/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO PARA: src/pages/admin/Orders.tsx ===
//
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import {
    Card,
    CardContent,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllOrders, fetchStores, fetchEmployees, updateOrderStatus } from "@/lib/api"; // <-- Import fetchEmployees
import { Order, Store, Employee, OrderCartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Store as StoreIcon, Printer, Package, Eye, UserCog, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const AdminOrders = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    // Filtros
    const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all"); // <-- Novo Filtro
    
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    // Queries
    const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ["adminOrders"],
        queryFn: fetchAllOrders,
    });

    const { data: stores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const { data: employees } = useQuery<Employee[]>({
        queryKey: ["employees"],
        queryFn: fetchEmployees,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: string }) => 
            updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
            toast({ title: "Status atualizado!", description: "O pedido foi atualizado com sucesso." });
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
        },
    });

    // --- LÓGICA DE FILTRAGEM AVANÇADA ---
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        
        return orders.filter((order) => {
            // Filtro de Loja
            const matchStore = selectedStoreId === "all" || order.store_id === selectedStoreId;
            
            // Filtro de Funcionário
            // Se employee_id for null no pedido, só aparece se filtro for 'all'
            const matchEmployee = selectedEmployeeId === "all" || order.employee_id === selectedEmployeeId;

            return matchStore && matchEmployee;
        });
    }, [orders, selectedStoreId, selectedEmployeeId]);

    // Filtra lista de funcionários baseado na loja selecionada (para o dropdown não ficar gigante)
    const filteredEmployeesList = useMemo(() => {
        if (!employees) return [];
        if (selectedStoreId === "all") return employees;
        return employees.filter(e => e.store_id === selectedStoreId);
    }, [employees, selectedStoreId]);

    // Helper
    const parseItems = (items: any): OrderCartItem[] => {
        if (typeof items === 'string') { try { return JSON.parse(items); } catch { return []; } }
        return items as OrderCartItem[];
    }

    // Calcular total do funcionário filtrado (Comissão rápida)
    const totalFilteredSales = filteredOrders.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.total_price : 0), 0);

    if (isLoadingOrders) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-background animate-fade-in">
            <Navbar />
            <main className="container py-8 space-y-6">
                
                {/* CABEÇALHO E FILTROS */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-muted/20 p-4 rounded-lg border">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h2>
                        <p className="text-muted-foreground">Acompanhe vendas e imprima comprovantes.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        
                        {/* FILTRO DE LOJA */}
                        <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1 w-full sm:w-auto">
                            <StoreIcon className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedStoreId} onValueChange={(val) => { setSelectedStoreId(val); setSelectedEmployeeId("all"); }}>
                                <SelectTrigger className="border-none shadow-none focus:ring-0 w-[180px] h-8 p-0"><SelectValue placeholder="Loja" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Lojas</SelectItem>
                                    {stores?.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* FILTRO DE FUNCIONÁRIO (COMISSÃO) */}
                        <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1 w-full sm:w-auto">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger className="border-none shadow-none focus:ring-0 w-[180px] h-8 p-0"><SelectValue placeholder="Vendedor" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Vendedores</SelectItem>
                                    {filteredEmployeesList.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* RESUMO DO FILTRO (Útil para ver comissão) */}
                {selectedEmployeeId !== "all" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">
                        <span>Vendas Confirmadas de <strong>{employees?.find(e => e.id === selectedEmployeeId)?.name}</strong>:</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(totalFilteredSales)}</span>
                    </div>
                )}

                {/* TABELA */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado com estes filtros.</TableCell></TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="whitespace-nowrap text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{format(new Date(order.created_at), "dd/MM/yyyy")}</span>
                                                    <span className="text-muted-foreground">{format(new Date(order.created_at), "HH:mm")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{order.Clients?.name || "Consumidor"}</div>
                                                <div className="text-xs text-muted-foreground">{order.Clients?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                {order.Employees?.name 
                                                    ? <Badge variant="outline" className="font-normal text-xs bg-slate-100 dark:bg-slate-800">{order.Employees.name}</Badge> 
                                                    : <span className="text-xs text-muted-foreground italic">Direto</span>}
                                            </TableCell>
                                            <TableCell className="text-sm">{order.Stores?.name}</TableCell>
                                            <TableCell className="font-bold text-primary">{formatCurrency(order.total_price)}</TableCell>
                                            <TableCell>
                                                <Select 
                                                    defaultValue={order.status} 
                                                    onValueChange={(val) => updateStatusMutation.mutate({ orderId: order.id, status: val })}
                                                >
                                                    <SelectTrigger className={`h-7 w-[110px] text-xs border-none ${
                                                        order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pendente</SelectItem>
                                                        <SelectItem value="processing">Separando</SelectItem>
                                                        <SelectItem value="delivering">Em Rota</SelectItem>
                                                        <SelectItem value="completed">Concluído</SelectItem>
                                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {/* DETALHES (O QUE VENDEU) */}
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Pedido #{order.id.substring(0,8).toUpperCase()}</DialogTitle>
                                                                <DialogDescription>
                                                                    Vendedor: {order.Employees?.name || "N/A"} <br/>
                                                                    Data: {format(new Date(order.created_at), "PPP 'às' HH:mm", { locale: ptBR })}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-2 mt-2 border rounded-md p-4">
                                                                {parseItems(order.items).map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="bg-muted p-2 rounded"><Package className="h-4 w-4" /></div>
                                                                            <div>
                                                                                <p className="font-medium text-sm">{item.name}</p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {item.quantity}x {formatCurrency(item.price)}
                                                                                    {/* Se tiver variação, mostra aqui também */}
                                                                                    {/* @ts-ignore */}
                                                                                    {item.variantName ? ` - ${item.variantName}` : ''}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</div>
                                                                    </div>
                                                                ))}
                                                                <div className="flex justify-between items-center pt-4 mt-4 border-t font-bold text-lg">
                                                                    <span>Total</span>
                                                                    <span>{formatCurrency(order.total_price)}</span>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                    {/* IMPRIMIR */}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setOrderToPrint(order)}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>

            {/* OVERLAY DE IMPRESSÃO COM A CLASSE "printable-content" */}
            {orderToPrint && (
                <OrderReceiptOverlay 
                    order={orderToPrint} 
                    onClose={() => setOrderToPrint(null)} 
                />
            )}
        </div>
    );
};

// --- COMPONENTE DE CUPOM (CORRIGIDO PARA IMPRESSÃO) ---
const OrderReceiptOverlay = ({ order, onClose }: { order: Order, onClose: () => void }) => {
    const parseItems = (items: any): OrderCartItem[] => {
        if (typeof items === 'string') { try { return JSON.parse(items); } catch { return []; } }
        return items as OrderCartItem[];
    }
    const items = parseItems(order.items);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:p-0 print:static print:block">
            
            {/* BOTÕES (Classe no-print esconde na impressão) */}
            <div className="fixed top-4 right-4 flex gap-2 z-50 no-print">
                <Button onClick={() => window.print()} size="lg" className="shadow-xl bg-blue-600 hover:bg-blue-700 text-white">
                    <Printer className="mr-2 h-5 w-5" /> Imprimir
                </Button>
                <Button onClick={onClose} variant="secondary" size="lg" className="shadow-xl bg-white text-black hover:bg-gray-100">
                    Fechar
                </Button>
            </div>

            {/* ÁREA DO CUPOM (Classe printable-content mostra na impressão) */}
            {/* Ajustamos o CSS inline para garantir visual de cupom térmico */}
            <div className="printable-content bg-white text-black w-[80mm] min-h-[150mm] p-4 shadow-2xl mx-auto my-8 print:my-0 print:w-full print:shadow-none font-mono text-xs leading-tight">
                
                <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                    <h1 className="text-base font-bold uppercase">BV Celular</h1>
                    <p className="text-[10px] mt-1">{order.Stores?.name}</p>
                    {order.Stores?.cnpj && <p className="text-[10px]">CNPJ: {order.Stores.cnpj}</p>}
                    {order.Stores?.address && <p className="text-[10px]">{order.Stores.address}</p>}
                    <p className="text-[10px] mt-1">{format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</p>
                    <p className="text-[10px] font-bold mt-1">PEDIDO #{order.id.substring(0, 8).toUpperCase()}</p>
                </div>

                <div className="mb-2 border-b border-dashed border-black pb-2">
                    <p><strong>Cliente:</strong> {order.Clients?.name}</p>
                    <p><strong>Tel:</strong> {order.Clients?.phone}</p>
                    {order.Employees?.name && <p><strong>Vendedor:</strong> {order.Employees.name}</p>}
                </div>

                {/* ITENS */}
                <table className="w-full text-left mb-2">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-1 font-bold">Qtd x Item</th>
                            <th className="py-1 text-right font-bold">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-1 pr-1">
                                    {item.quantity}x {item.name}
                                    {/* @ts-ignore */}
                                    {item.variantName && <div className="text-[10px] pl-2">- {item.variantName}</div>}
                                </td>
                                <td className="py-1 text-right align-top">
                                    {formatCurrency(item.price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="border-t border-black pt-2 mt-2 space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        {/* Aproximação simples, o ideal é salvar subtotal no banco */}
                        <span>{formatCurrency(order.total_price - (order.delivery_fee || 0))}</span>
                    </div>
                    {order.delivery_fee && order.delivery_fee > 0 && (
                        <div className="flex justify-between">
                            <span>Entrega:</span>
                            <span>{formatCurrency(order.delivery_fee)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-dashed border-black">
                         <span>TOTAL:</span>
                         <span>{formatCurrency(order.total_price)}</span>
                    </div>
                    <div className="text-right mt-1 text-[10px]">
                         Pgto: {order.payment_method === 'credit_card_online' ? 'Pago Online (Stripe)' : 
                                order.payment_method === 'credit_card' ? 'Cartão (Maq.)' : 
                                order.payment_method === 'pix' ? 'Pix' : 'Dinheiro'}
                    </div>
                    {order.change_for && (
                         <div className="text-right text-[10px]">Troco p/: {formatCurrency(order.change_for)}</div>
                    )}
                </div>

                {order.delivery_type === 'delivery' && order.Addresses && (
                     <div className="mt-4 pt-2 border-t border-black">
                        <p className="font-bold mb-1">ENTREGA:</p>
                        <p>{order.Addresses.street}, {order.Addresses.number}</p>
                        <p>{order.Addresses.neighborhood} - {order.Addresses.city}</p>
                        {order.Addresses.complement && <p>Obs: {order.Addresses.complement}</p>}
                    </div>
                )}

                <div className="text-center text-[10px] mt-6">
                    <p>Obrigado pela preferência!</p>
                    <p>www.bvcelular.com.br</p>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;