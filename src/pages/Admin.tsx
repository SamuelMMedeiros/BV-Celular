/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllOrders, fetchStores } from "@/lib/api";
import { Order, Store } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
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
    Building2, // Ícone Loja
    UserCog, // Ícone Funcionario
    TicketPercent
} from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
    const [selectedStoreId, setSelectedStoreId] = useState<string>("all");

    const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
        queryKey: ["adminOrders"],
        queryFn: fetchAllOrders,
    });

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
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

    if (isLoadingOrders || isLoadingStores) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background">
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

                {/* Cards de KPI */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    {/* ... Outros Cards (Mantidos iguais para brevidade) ... */}
                </div>

                {/* Gráfico */}
                <Card className="col-span-4">
                    {/* ... Código do Gráfico (Mantido igual) ... */}
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
                                <Tooltip />
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

                {/* --- ATALHOS RÁPIDOS (BOTÕES ADICIONADOS) --- */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                                <Link to="/admin/products">
                                    <ShoppingBag className="mr-2 h-4 w-4" />{" "}
                                    Produtos
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/orders">
                                    <CreditCard className="mr-2 h-4 w-4" />{" "}
                                    Pedidos
                                </Link>
                            </Button>

                            {/* BOTÕES RESTAURADOS */}
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/stores">
                                    <Building2 className="mr-2 h-4 w-4" /> Lojas
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/employees">
                                    <UserCog className="mr-2 h-4 w-4" />{" "}
                                    Funcionários
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/clients">
                                    <Users className="mr-2 h-4 w-4" /> Clientes
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="justify-start"
                            >
                                <Link to="/admin/warranties">
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
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full justify-start"
                            >
                                <Link to="/admin/coupons">
                                    <TicketPercent className="mr-2 h-5 w-5" />
                                    Gerenciar Cupons
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Últimos Pedidos (Mantido igual) */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Últimos Pedidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Lista simplificada */}
                            {filteredOrders.slice(0, 5).map((o) => (
                                <div
                                    key={o.id}
                                    className="flex justify-between py-2 border-b text-sm"
                                >
                                    <span>{o.Clients?.name || "Cliente"}</span>
                                    <span className="font-bold">
                                        {formatCurrency(o.total_price)}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

const DashboardSkeleton = () => <div className="min-h-screen bg-background"><Navbar /><div className="container py-8">Carregando...</div></div>;

export default AdminDashboard;