/**
 * @title src/pages/admin/Logistics.tsx
 * @collapsible
 */
import { Navbar } from "@/components/Navbar";
import {
    fetchLogisticsData,
    assignDriverToOrder,
    fetchDrivers,
} from "@/lib/api";
import { OrderCartItem, Order, Driver } from "@/types"; // Importação necessária
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Map,
    List,
    RefreshCcw,
    Truck,
    MapPin,
    Package,
    Clock,
    User,
    CheckCircle,
    Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { LogisticsMap } from "@/components/LogisticsMap"; // Importa o novo componente de mapa
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const AdminLogistics = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDriverId, setSelectedDriverId] = useState<string>("");

    // Query principal de dados logísticos (pedidos em rota e motoristas ativos)
    const {
        data: logisticsData,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["logisticsData"],
        queryFn: fetchLogisticsData,
        refetchInterval: 15000, // Atualiza a cada 15 segundos
    });

    // Query para todos os motoristas (usado para atribuição)
    const { data: allDrivers, isLoading: isLoadingDrivers } = useQuery({
        queryKey: ["allDrivers"],
        queryFn: fetchDrivers,
    });

    const assignDriverMutation = useMutation({
        mutationFn: ({
            orderId,
            driverId,
        }: {
            orderId: string;
            driverId: string;
        }) => assignDriverToOrder(orderId, driverId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["logisticsData"] });
            queryClient.invalidateQueries({ queryKey: ["activeOrders"] }); // Invalida o KDS tbm
            toast({
                title: "Sucesso!",
                description: "Entregador atribuído e pedido em rota.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro na Atribuição",
                description: error.message,
            });
        },
    });

    const driversInRoute = logisticsData?.drivers || [];
    const ordersInDelivery = logisticsData?.orders || [];
    // Pedidos prontos para serem atribuídos (status 'ready' ou 'delivering' sem driver_id)
    const ordersToAssign = ordersInDelivery.filter(
        (o) =>
            !o.driver_id &&
            o.delivery_type === "delivery" &&
            (o.status === "ready" || o.status === "delivering")
    );
    // Pedidos já atribuídos e em rota
    const assignedOrders = ordersInDelivery.filter((o) => o.driver_id);

    const getStatusText = (status: string) => {
        switch (status) {
            case "on_the_way":
                return "Em Rota";
            case "out_for_delivery":
                return "Saiu para Entrega";
            case "delivery_attempted":
                return "Tentativa de Entrega";
            case "ready":
                return "Pronto para Despacho";
            default:
                return status;
        }
    };

    // Função de Atribuição (usada na tabela de pedidos não atribuídos)
    const handleAssignDriver = (orderId: string) => {
        if (!selectedDriverId) {
            toast({ variant: "destructive", title: "Selecione um Entregador" });
            return;
        }
        assignDriverMutation.mutate({ orderId, driverId: selectedDriverId });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <Navbar />
            <main className="container py-8 max-w-7xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Map className="h-6 w-6" /> Central de Logística
                    </h1>
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCcw
                            className={`mr-2 h-4 w-4 ${
                                isLoading ? "animate-spin" : ""
                            }`}
                        />
                        Atualizar Dados
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Mapa de Rastreamento */}
                    <div className="lg:col-span-2">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />{" "}
                                Rastreamento em Tempo Real
                            </CardTitle>
                            <CardDescription>
                                Monitoramento de Entregadores e Pedidos em Rota.
                            </CardDescription>
                        </CardHeader>
                        <LogisticsMap
                            orders={assignedOrders}
                            drivers={driversInRoute}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Estatísticas e Atribuição */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Truck className="h-5 w-5" /> Entregadores
                                    Ativos
                                </CardTitle>
                                <CardDescription>
                                    {driversInRoute.length} Motorista(s)
                                    enviando localização.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton
                                            key={i}
                                            className="h-10 w-full"
                                        />
                                    ))
                                ) : driversInRoute.length > 0 ? (
                                    driversInRoute.map((driver) => (
                                        <div
                                            key={driver.id}
                                            className="p-3 border rounded-md flex items-center justify-between bg-green-50/50 dark:bg-green-900/20"
                                        >
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {driver.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Em rota com:{" "}
                                                    {
                                                        assignedOrders.filter(
                                                            (o) =>
                                                                o.driver_id ===
                                                                driver.id
                                                        ).length
                                                    }{" "}
                                                    pedido(s)
                                                </p>
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {driver.last_updated
                                                    ? formatDistanceToNow(
                                                          parseISO(
                                                              driver.last_updated
                                                          ),
                                                          {
                                                              addSuffix: true,
                                                              locale: ptBR,
                                                          }
                                                      )
                                                    : "Localizando..."}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Nenhum motorista ativo ou enviando
                                        localização.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Atribuição Rápida */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                                    <Car className="h-5 w-5" /> Atribuir
                                    Entregador
                                </CardTitle>
                                <CardDescription>
                                    {ordersToAssign.length} pedido(s) prontos
                                    para despacho.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select
                                    onValueChange={setSelectedDriverId}
                                    disabled={
                                        isLoadingDrivers ||
                                        !allDrivers ||
                                        allDrivers.length === 0
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um Entregador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allDrivers?.map((driver) => (
                                            <SelectItem
                                                key={driver.id}
                                                value={driver.id}
                                            >
                                                {driver.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    className="w-full"
                                    onClick={() =>
                                        handleAssignDriver(
                                            ordersToAssign[0]?.id
                                        )
                                    } // Atribui o primeiro da lista
                                    disabled={
                                        ordersToAssign.length === 0 ||
                                        !selectedDriverId ||
                                        assignDriverMutation.isPending
                                    }
                                >
                                    {assignDriverMutation.isPending
                                        ? "Atribuindo..."
                                        : `Atribuir Pedido (${ordersToAssign.length})`}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Tabela de Pedidos em Entrega */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <List className="h-5 w-5" /> Pedidos Atribuídos em
                            Rota ({assignedOrders.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Endereço</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Entregador</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ) : assignedOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-muted-foreground"
                                            >
                                                Nenhum pedido atribuído e em
                                                rota.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        assignedOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium text-xs">
                                                    {order.id.substring(0, 8)}
                                                </TableCell>
                                                <TableCell>
                                                    {order.Clients?.name}
                                                </TableCell>
                                                <TableCell>
                                                    {order.Addresses?.street},{" "}
                                                    {order.Addresses?.number} -{" "}
                                                    {order.Addresses?.city}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(
                                                        order.total_price
                                                    )}
                                                </TableCell>
                                                <TableCell className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {order.Drivers?.name ||
                                                        "N/A"}
                                                </TableCell>
                                                <TableCell
                                                    className={`font-medium ${
                                                        order.status ===
                                                        "on_the_way"
                                                            ? "text-blue-600"
                                                            : "text-primary"
                                                    }`}
                                                >
                                                    {getStatusText(
                                                        order.status
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminLogistics;
