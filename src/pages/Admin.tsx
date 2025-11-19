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
} from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
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

    // --- LÓGICA DE DADOS ---

    // 1. Filtra os pedidos pela loja selecionada
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (selectedStoreId === "all") return orders;
        return orders.filter((order) => order.store_id === selectedStoreId);
    }, [orders, selectedStoreId]);

    // 2. Calcula KPIs (Indicadores)
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

    // 3. Prepara dados para o Gráfico (Últimos 7 dias)
    const chartData = useMemo(() => {
        if (!orders || !stores) return [];

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return d;
        });

        return last7Days.map((date) => {
            const dateKey = format(date, "dd/MM", { locale: ptBR });

            // Inicializa o objeto do dia com a data
            const dayData: any = { date: dateKey };

            // Filtra pedidos CONCLUÍDOS deste dia
            const daysOrders = orders.filter(
                (o) =>
                    o.status === "completed" &&
                    isSameDay(new Date(o.created_at), date)
            );

            // Se tiver filtro de loja global ativo, filtramos aqui também
            const relevantOrders =
                selectedStoreId === "all"
                    ? daysOrders
                    : daysOrders.filter((o) => o.store_id === selectedStoreId);

            // Agrupa valores por loja (para empilhar no gráfico)
            stores.forEach((store) => {
                const storeRevenue = relevantOrders
                    .filter((o) => o.store_id === store.id)
                    .reduce((acc, curr) => acc + Number(curr.total_price), 0);

                // O gráfico espera valores em Reais (não centavos) para ficar legível no eixo Y
                // Se seus valores estão em centavos, divida por 100.
                // Se já salvou como float no banco, mantenha.
                // Assumindo centavos baseado no nosso histórico:
                dayData[store.name] = storeRevenue / 100;
            });

            return dayData;
        });
    }, [orders, stores, selectedStoreId]);

    // Cores para o gráfico (uma cor para cada loja se possível, ou rotacionar)
    const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

    if (isLoadingOrders || isLoadingStores) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 space-y-8">
                {/* Cabeçalho e Filtro */}
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
                                Receita Total (Concluída)
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(metrics.totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Apenas pedidos com status "Concluído"
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
                                {metrics.pendingOrdersCount} pendentes de
                                atenção
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
                                Baseado em vendas concluídas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Taxa de Conversão
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
                                Pedidos concluídos vs totais
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráfico de Vendas */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Vendas nos últimos 7 dias</CardTitle>
                        <CardDescription>
                            Valores de vendas <strong>concluídas</strong> por
                            dia.
                            {selectedStoreId !== "all"
                                ? " (Filtrado por loja)"
                                : " (Cada cor representa uma loja)"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [
                                            `R$ ${value.toFixed(2)}`,
                                            "Venda",
                                        ]}
                                        labelStyle={{ color: "#000" }}
                                    />
                                    <Legend />

                                    {/* Gera uma barra para cada loja se estivermos vendo 'Todas' */}
                                    {selectedStoreId === "all" && stores ? (
                                        stores.map((store, index) => (
                                            <Bar
                                                key={store.id}
                                                dataKey={store.name}
                                                stackId="a"
                                                fill={
                                                    colors[
                                                        index % colors.length
                                                    ]
                                                }
                                                radius={[4, 4, 0, 0]}
                                            />
                                        ))
                                    ) : (
                                        // Se uma loja específica estiver selecionada, mostra apenas uma barra genérica
                                        <Bar
                                            dataKey={
                                                stores?.find(
                                                    (s) =>
                                                        s.id === selectedStoreId
                                                )?.name || "Vendas"
                                            }
                                            fill="#2563eb"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Atalhos Rápidos / Lista Recente */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Atalhos */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Acesso Rápido</CardTitle>
                            <CardDescription>
                                Gerencie sua loja com um clique.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="w-full justify-start"
                            >
                                <Link to="/admin/products/new">
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                    Adicionar Novo Produto
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full justify-start"
                            >
                                <Link to="/admin/orders">
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Ver Todos os Pedidos
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full justify-start"
                            >
                                <Link to="/admin/clients">
                                    <Users className="mr-2 h-5 w-5" />
                                    Gerenciar Clientes
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Últimos Pedidos (Resumo) */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Últimos Pedidos</CardTitle>
                            <CardDescription>
                                Os 5 orçamentos mais recentes recebidos.
                            </CardDescription>
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
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                    order.status === "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : order.status ===
                                                          "cancelled"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {order.status === "completed"
                                                    ? "Concluído"
                                                    : order.status ===
                                                      "cancelled"
                                                    ? "Cancelado"
                                                    : "Pendente"}
                                            </span>
                                            <span className="font-bold text-sm">
                                                {formatCurrency(
                                                    order.total_price
                                                )}
                                            </span>
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
                                <Link to="/admin/orders">Ver todos</Link>
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
        <main className="container py-8 space-y-8">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-[200px]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-[400px] w-full" />
        </main>
    </div>
);

export default AdminDashboard;
