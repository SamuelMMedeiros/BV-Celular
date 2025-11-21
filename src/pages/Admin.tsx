/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fetchAllOrders, fetchStores, updateOrderStatus } from "@/lib/api";
import { Order, Store, OrderCartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    DollarSign,
    ShoppingBag,
    CreditCard,
    TrendingUp,
    Store as StoreIcon,
    Users,
    ShieldCheck,
    ImageIcon,
    Building2,
    UserCog,
    Eye,
    Package,
    TicketPercent,
    Clock,
    Briefcase,
    Link as LinkIcon, // <-- ÍCONE ADICIONADO
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

    // Busca dados (Pedidos e Lojas)
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

    const metrics = useMemo(() => {
        const completedOrders = filteredOrders.filter(
            (o) => o.status === "completed"
        );
        const pendingOrders = filteredOrders.filter(
            (o) => o.status === "pending"
        );

        const totalRevenue = completedOrders.reduce(
            (acc, curr) => acc + Number(curr.total_price),
            0
        );

        const averageTicket =
            completedOrders.length > 0
                ? totalRevenue / completedOrders.length
                : 0;

        return {
            totalRevenue,
            totalOrdersCount: filteredOrders.length,
            completedOrdersCount: completedOrders.length,
            pendingOrdersCount: pendingOrders.length,
            averageTicket,
        };
    }, [filteredOrders]);

    const chartData = useMemo(() => {
        if (!orders || !stores) return [];

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return d;
        });

        return last7Days.map((date) => {
            const dateKey = format(date, "dd/MM", { locale: ptBR });
            const dayData: any = { date: dateKey };

            const daysOrders = orders.filter(
                (o) =>
                    o.status === "completed" &&
                    isSameDay(new Date(o.created_at), date)
            );

            const relevantOrders =
                selectedStoreId === "all"
                    ? daysOrders
                    : daysOrders.filter((o) => o.store_id === selectedStoreId);

            stores.forEach((store) => {
                const storeRevenue = relevantOrders
                    .filter((o) => o.store_id === store.id)
                    .reduce((acc, curr) => acc + Number(curr.total_price), 0);

                dayData[store.name] = storeRevenue / 100;
            });

            return dayData;
        });
    }, [orders, stores, selectedStoreId]);

    const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

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

    if (isLoadingOrders || isLoadingStores) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background animate-fade-in">
            <Navbar />
            <main className="container py-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h2>
                        <p className="text-muted-foreground">
                            Visão geral do desempenho da sua loja.
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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Receita Total
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(metrics.totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Concluída
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pedidos
                            </CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.totalOrdersCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {metrics.pendingOrdersCount} pendentes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ticket Médio
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(metrics.averageTicket)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Vendas concluídas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Conversão
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.totalOrdersCount > 0
                                    ? Math.round(
                                          (metrics.completedOrdersCount /
                                              metrics.totalOrdersCount) *
                                              100
                                      )
                                    : 0}
                                %
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pedidos concluídos
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="col-span-4 animate-slide-up">
                    <CardHeader>
                        <CardTitle>Vendas (7 dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis
                                    fontSize={12}
                                    tickFormatter={(val) => `R$${val}`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [
                                        `R$ ${value.toFixed(2)}`,
                                        "Venda",
                                    ]}
                                    labelStyle={{ color: "#000" }}
                                />
                                {selectedStoreId === "all" && stores ? (
                                    stores.map((store, index) => (
                                        <Bar
                                            key={store.id}
                                            dataKey={store.name}
                                            stackId="a"
                                            fill={colors[index % colors.length]}
                                        />
                                    ))
                                ) : (
                                    <Bar
                                        dataKey={
                                            stores?.find(
                                                (s) => s.id === selectedStoreId
                                            )?.name || "Vendas"
                                        }
                                        fill="#2563eb"
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-slide-up">
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Menu de Gestão</CardTitle>
                            <CardDescription>
                                Acesso rápido aos cadastros.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-2">
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/produtos">
                                    <ShoppingBag className="mr-2 h-4 w-4" />{" "}
                                    Produtos
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/pedidos">
                                    <CreditCard className="mr-2 h-4 w-4" />{" "}
                                    Pedidos
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="default"
                                className="justify-start bg-blue-600 hover:bg-blue-700"
                            >
                                <Link to="/admin/logistica">
                                    <Clock className="mr-2 h-4 w-4" /> Expedição
                                    / Logística
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/lojas">
                                    <Building2 className="mr-2 h-4 w-4" /> Lojas
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/funcionarios">
                                    <UserCog className="mr-2 h-4 w-4" />{" "}
                                    Funcionários
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/entregadores">
                                    <StoreIcon className="mr-2 h-4 w-4" />{" "}
                                    Entregadores
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/clientes">
                                    <Users className="mr-2 h-4 w-4" /> Clientes
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/atacado">
                                    <Briefcase className="mr-2 h-4 w-4" />{" "}
                                    Clientes Atacado
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/cupons">
                                    <TicketPercent className="mr-2 h-4 w-4" />{" "}
                                    Gerenciar Cupons
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/garantias">
                                    <ShieldCheck className="mr-2 h-4 w-4" />{" "}
                                    Garantias
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/banners">
                                    <ImageIcon className="mr-2 h-4 w-4" />{" "}
                                    Banners
                                </Link>
                            </Button>

                            {/* --- BOTÃO ADICIONADO --- */}
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/links">
                                    <LinkIcon className="mr-2 h-4 w-4" />{" "}
                                    Central de Links (Linktree)
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Últimos Pedidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredOrders.slice(0, 5).map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {order.Clients?.name ||
                                                    "Cliente Desconhecido"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(
                                                    new Date(order.created_at),
                                                    "dd/MM HH:mm"
                                                )}{" "}
                                                • {order.Stores?.name}
                                            </p>
                                            <span className="font-bold text-sm text-primary block md:hidden">
                                                {formatCurrency(
                                                    order.total_price
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
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
                                                disabled={
                                                    updateStatusMutation.isPending
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-[110px] text-xs">
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

                                            <span className="font-bold text-sm hidden md:block w-24 text-right">
                                                {formatCurrency(
                                                    order.total_price
                                                )}
                                            </span>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Detalhes do Pedido
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            ID: {order.id}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-2 mt-2">
                                                        {parseItems(
                                                            order.items
                                                        ).map((item, idx) => (
                                                            <div
                                                                key={idx}
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
                                                        ))}
                                                        <div className="flex justify-between items-center pt-2 font-bold text-lg">
                                                            <span>Total</span>
                                                            <span>
                                                                {formatCurrency(
                                                                    order.total_price
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Nenhum pedido encontrado.
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="link"
                                asChild
                                className="w-full mt-4"
                            >
                                <Link to="/admin/pedidos">Ver todos</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

const DashboardSkeleton = () => (
    <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8 space-y-8 animate-pulse">
            <div className="flex justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-[200px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <Skeleton className="h-[350px] w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-3 h-[300px] rounded-xl" />
                <Skeleton className="col-span-4 h-[300px] rounded-xl" />
            </div>
        </main>
    </div>
);

export default AdminDashboard;
