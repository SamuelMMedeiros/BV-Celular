/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllOrders, fetchStores, updateOrderStatus } from "@/lib/api";
import { Order, Store, OrderCartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Store as StoreIcon, Printer, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const AdminOrders = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ["adminOrders"],
        queryFn: fetchAllOrders,
    });

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({
            orderId,
            status,
        }: {
            orderId: string;
            status: string;
        }) => updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
            toast({
                title: "Status atualizado!",
                description: "O pedido foi atualizado com sucesso.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            });
        },
    });

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (selectedStoreId === "all") return orders;
        return orders.filter((order) => order.store_id === selectedStoreId);
    }, [orders, selectedStoreId]);

    if (isLoadingOrders) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Pedidos
                        </h2>
                        <p className="text-muted-foreground">
                            Gerencie e imprima os pedidos recebidos.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StoreIcon className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedStoreId}
                            onValueChange={setSelectedStoreId}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtrar por Loja" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todas as Lojas
                                </SelectItem>
                                {stores?.map((store) => (
                                    <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Ações
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(
                                                new Date(order.created_at),
                                                "dd/MM/yyyy HH:mm"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {order.Clients?.name ||
                                                    "Desconhecido"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.Clients?.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {order.Employees?.name ? (
                                                <Badge
                                                    variant="outline"
                                                    className="font-normal text-xs"
                                                >
                                                    {order.Employees.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {order.Stores?.name}
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {formatCurrency(order.total_price)}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={order.status}
                                                onValueChange={(val) =>
                                                    updateStatusMutation.mutate(
                                                        {
                                                            orderId: order.id,
                                                            status: val,
                                                        }
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-[130px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">
                                                        Pendente
                                                    </SelectItem>
                                                    <SelectItem value="completed">
                                                        Concluído
                                                    </SelectItem>
                                                    <SelectItem value="cancelled">
                                                        Cancelado
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setOrderToPrint(order)
                                                }
                                            >
                                                <Printer className="h-4 w-4 mr-2" />{" "}
                                                Imprimir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>

            {/* Overlay de Impressão */}
            {orderToPrint && (
                <OrderReceiptOverlay
                    order={orderToPrint}
                    onClose={() => setOrderToPrint(null)}
                />
            )}
        </div>
    );
};

const OrderReceiptOverlay = ({
    order,
    onClose,
}: {
    order: Order;
    onClose: () => void;
}) => {
    const handlePrint = () => {
        window.print();
    };

    const parseItems = (items: any): OrderCartItem[] => {
        if (typeof items === "string") {
            try {
                return JSON.parse(items);
            } catch {
                return [];
            }
        }
        return items as OrderCartItem[];
    };

    const items = parseItems(order.items);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
                <Button
                    onClick={handlePrint}
                    size="lg"
                    className="shadow-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Printer className="mr-2 h-5 w-5" /> Imprimir
                </Button>
                <Button
                    onClick={onClose}
                    variant="secondary"
                    size="lg"
                    className="shadow-xl bg-white text-black hover:bg-gray-100"
                >
                    Fechar
                </Button>
            </div>

            <div className="bg-white text-black w-full max-w-[80mm] min-h-[150mm] p-6 shadow-2xl print:shadow-none print:w-full print:max-w-full print:h-full print:m-0 flex flex-col relative mx-auto my-8 print:my-0 font-mono text-sm">
                <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                    <h1 className="text-xl font-bold uppercase">BV Celular</h1>
                    {/* CNPJ ADICIONADO AQUI */}
                    {order.Stores?.cnpj && (
                        <p className="text-xs mt-1">
                            CNPJ: {order.Stores.cnpj}
                        </p>
                    )}
                    {order.Stores?.address && (
                        <p className="text-xs mt-1">{order.Stores.address}</p>
                    )}
                    <p className="text-xs mt-1">Recibo de Pedido</p>
                    <p className="text-xs mt-1">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                </div>

                <div className="mb-4 space-y-1">
                    <p>
                        <strong>Cliente:</strong> {order.Clients?.name}
                    </p>
                    <p>
                        <strong>Telefone:</strong> {order.Clients?.phone}
                    </p>
                    <p>
                        <strong>Loja:</strong> {order.Stores?.name}
                    </p>

                    {/* DADOS DE ENTREGA NO RECIBO */}
                    {order.delivery_type === "delivery" && order.Addresses && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                            <p>
                                <strong>ENTREGA:</strong>
                            </p>
                            <p>
                                {order.Addresses.street},{" "}
                                {order.Addresses.number}
                            </p>
                            <p>
                                {order.Addresses.neighborhood} -{" "}
                                {order.Addresses.city}
                            </p>
                        </div>
                    )}

                    {order.Employees?.name && (
                        <p className="mt-2">
                            <strong>Vendedor:</strong> {order.Employees.name}
                        </p>
                    )}
                </div>

                <table className="w-full text-left mb-4 border-collapse">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-1">Item</th>
                            <th className="py-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-dashed border-gray-300"
                            >
                                <td className="py-2">
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-xs">
                                        {item.quantity}x{" "}
                                        {formatCurrency(item.price)}
                                    </div>
                                </td>
                                <td className="py-2 text-right align-top">
                                    {formatCurrency(item.price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="space-y-1 border-t border-black pt-2 mt-auto">
                    {order.delivery_fee && order.delivery_fee > 0 && (
                        <div className="flex justify-between text-xs">
                            <span>Taxa de Entrega:</span>
                            <span>{formatCurrency(order.delivery_fee)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL:</span>
                        <span>{formatCurrency(order.total_price)}</span>
                    </div>
                    {order.payment_method && (
                        <p className="text-xs text-right mt-1">
                            Pagamento:{" "}
                            {order.payment_method === "credit_card"
                                ? "Cartão"
                                : order.payment_method === "pix"
                                ? "Pix"
                                : "Dinheiro"}
                        </p>
                    )}
                </div>

                <div className="text-center text-xs mt-8 pt-4 border-t border-black">
                    <p>Obrigado pela preferência!</p>
                    <p>ID: {order.id.split("-")[0].toUpperCase()}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
