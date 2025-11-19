/* eslint-disable @typescript-eslint/no-explicit-any */
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { fetchAllOrders, updateOrderStatus } from "@/lib/api";
import { Order, OrderCartItem } from "@/types";
import {
    Loader2,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminOrders = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: orders, isLoading } = useQuery<Order[]>({
        queryKey: ["adminOrders"],
        queryFn: fetchAllOrders,
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" /> Concluído
                    </Badge>
                );
            case "cancelled":
                return (
                    <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" /> Cancelado
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" /> Pendente
                    </Badge>
                );
        }
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

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciar Pedidos</CardTitle>
                        <CardDescription>
                            Visualize e atualize os orçamentos recebidos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !orders || orders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum pedido encontrado.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Loja</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Ações
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(
                                                    new Date(order.created_at),
                                                    "dd/MM/yyyy HH:mm",
                                                    { locale: ptBR }
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
                                                {order.Stores?.name || "Online"}
                                            </TableCell>
                                            <TableCell className="font-bold text-primary">
                                                {formatCurrency(
                                                    order.total_price
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    defaultValue={order.status}
                                                    onValueChange={(val) =>
                                                        updateStatusMutation.mutate(
                                                            {
                                                                orderId:
                                                                    order.id,
                                                                status: val,
                                                            }
                                                        )
                                                    }
                                                    disabled={
                                                        updateStatusMutation.isPending
                                                    }
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue>
                                                            {getStatusBadge(
                                                                order.status
                                                            )}
                                                        </SelectValue>
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
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Detalhes do
                                                                Pedido
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                ID: {order.id}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 mt-4">
                                                            <div className="space-y-2">
                                                                {parseItems(
                                                                    order.items
                                                                ).map(
                                                                    (
                                                                        item,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="flex justify-between items-center border-b pb-2"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="bg-muted p-2 rounded">
                                                                                    <Package className="h-4 w-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium text-sm">
                                                                                        {
                                                                                            item.name
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {
                                                                                            item.quantity
                                                                                        }
                                                                                        x{" "}
                                                                                        {formatCurrency(
                                                                                            item.price
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="font-bold text-sm">
                                                                                {formatCurrency(
                                                                                    item.price *
                                                                                        item.quantity
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-center pt-2 font-bold text-lg">
                                                                <span>
                                                                    Total
                                                                </span>
                                                                <span>
                                                                    {formatCurrency(
                                                                        order.total_price
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminOrders;
