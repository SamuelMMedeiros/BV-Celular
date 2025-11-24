/**
 * @title src/pages/driver/Dashboard.tsx
 * @collapsible
 */
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Adicionando fetchDriverOrders e updateOrderStatus
import {
    fetchDriverProfile,
    updateDriverLocation,
    fetchDriverOrders,
    updateOrderStatus,
} from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Driver, Order } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    Loader2,
    Truck,
    MapPin,
    Clock,
    Shield,
    LogOut,
    CheckCircle,
    Car,
    Package,
    Phone,
    Home,
    Check,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const DriverDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isTracking, setIsTracking] = useState(false);
    const intervalRef = useRef<number | null>(null);

    const { data: driver, isLoading } = useQuery<Driver | null>({
        queryKey: ["driverProfile"],
        queryFn: fetchDriverProfile,
        staleTime: Infinity,
    });

    // Query para buscar os pedidos do motorista logado
    const { data: assignedOrders, isLoading: isLoadingOrders } = useQuery<
        Order[]
    >({
        queryKey: ["driverOrders", driver?.id],
        queryFn: () => fetchDriverOrders(driver!.id!),
        enabled: !!driver?.id,
    });

    // Mutação para marcar pedido como concluído
    const updateStatusMutation = useMutation({
        mutationFn: ({
            orderId,
            status,
        }: {
            orderId: string;
            status: string;
        }) => updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["driverOrders"] });
            queryClient.invalidateQueries({ queryKey: ["logisticsData"] }); // Atualiza o admin
            toast({
                title: "Sucesso!",
                description: "Entrega marcada como concluída.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
        },
    });

    // Redireciona se não for motorista válido ou se a sessão expirar
    useEffect(() => {
        if (!isLoading && !driver) {
            navigate("/driver-login");
        }
    }, [isLoading, driver, navigate]);

    // Função principal para enviar a localização
    const sendLocationUpdate = (driverId: string) => {
        if (!navigator.geolocation) {
            toast({
                variant: "destructive",
                title: "Erro de GPS",
                description:
                    "Geolocalização não é suportada por este navegador.",
            });
            setIsTracking(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Envia a localização para a API
                try {
                    await updateDriverLocation(driverId, latitude, longitude);
                    queryClient.invalidateQueries({
                        queryKey: ["driverProfile"],
                    });
                } catch (error) {
                    console.error("Falha ao enviar localização:", error);
                }
            },
            (error) => {
                console.error("Erro ao obter localização:", error);
                // Não desliga automaticamente, mas notifica o motorista
                toast({
                    variant: "destructive",
                    title: "Permissão Negada",
                    description:
                        "Ative o GPS e permita o uso da localização para iniciar o rastreamento.",
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    };

    // Efeito para gerenciar o intervalo de rastreamento
    useEffect(() => {
        if (isTracking && driver?.id) {
            // Converte para Number para usar no window.setInterval
            intervalRef.current = window.setInterval(() => {
                sendLocationUpdate(driver.id!);
            }, 15000); // Envia localização a cada 15 segundos
        } else {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isTracking, driver?.id]);

    const handleStartTracking = () => {
        if (!driver?.id) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Dados do motorista não carregados.",
            });
            return;
        }
        setIsTracking(true);
        sendLocationUpdate(driver.id);
        toast({
            title: "Rastreamento Iniciado!",
            description: "Sua localização está sendo enviada a cada 15s.",
        });
    };

    const handleStopTracking = () => {
        setIsTracking(false);
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        toast({
            title: "Rastreamento Parado.",
            description: "Localização não está mais sendo enviada.",
        });
    };

    const handleLogout = () => {
        handleStopTracking();
        localStorage.removeItem("driver_session_token");
        navigate("/driver-login");
    };

    const handleCompleteOrder = (orderId: string) => {
        updateStatusMutation.mutate({ orderId, status: "completed" });
    };

    if (isLoading || !driver) {
        return (
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const isRecentUpdate =
        driver.last_updated &&
        new Date().getTime() - new Date(driver.last_updated).getTime() < 30000;

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-16">
            <header className="p-4 border-b bg-white dark:bg-slate-900 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <Car className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">{driver.name}</h1>
                </div>
                <Button variant="ghost" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
            </header>

            <main className="container py-8 max-w-lg">
                {/* Status do Rastreamento */}
                <Card
                    className={`mb-6 shadow-lg ${
                        isTracking ? "border-green-500" : "border-amber-500"
                    } border-l-4`}
                >
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center justify-between">
                            Status do Rastreamento
                            {isTracking ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                                <Clock className="h-6 w-6 text-amber-500" />
                            )}
                        </CardTitle>
                        <CardDescription>
                            {isTracking
                                ? "Sua posição está sendo enviada a cada 15 segundos para a central."
                                : "O rastreamento está inativo. Ative para aparecer no mapa logístico."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">Última Posição:</span>
                            {driver.latitude && driver.longitude ? (
                                <span
                                    className={
                                        isRecentUpdate
                                            ? "text-green-600 font-semibold"
                                            : "text-amber-600"
                                    }
                                >
                                    {driver.last_updated
                                        ? format(
                                              new Date(driver.last_updated),
                                              "HH:mm:ss",
                                              { locale: ptBR }
                                          )
                                        : "Aguardando 1ª atualização"}
                                </span>
                            ) : (
                                <span className="text-gray-500">N/A</span>
                            )}
                        </div>
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={
                                isTracking
                                    ? handleStopTracking
                                    : handleStartTracking
                            }
                            variant={isTracking ? "destructive" : "default"}
                        >
                            {isTracking
                                ? "Parar Rastreamento"
                                : "Iniciar Rastreamento"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Pedidos Atribuídos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Truck className="h-5 w-5" /> Seus Pedidos em Rota (
                            {assignedOrders?.length || 0})
                        </CardTitle>
                        <CardDescription>
                            Lista de entregas atribuídas a você.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingOrders ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        ) : assignedOrders && assignedOrders.length > 0 ? (
                            assignedOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="border p-4 rounded-lg bg-white dark:bg-slate-800 shadow-md space-y-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-lg">
                                                Entrega para{" "}
                                                {order.Clients?.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                Pedido #
                                                {order.id.substring(0, 8)}
                                            </p>
                                        </div>
                                        <p className="font-bold text-xl text-primary">
                                            {formatCurrency(order.total_price)}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-1 text-sm">
                                        <p className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-primary" />
                                            {order.Addresses?.street},{" "}
                                            {order.Addresses?.number} -{" "}
                                            {order.Addresses?.neighborhood} (
                                            {order.Addresses?.city})
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-primary" />
                                            {order.Clients?.phone}
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full mt-3 bg-green-600 hover:bg-green-700"
                                        onClick={() =>
                                            handleCompleteOrder(order.id)
                                        }
                                        disabled={
                                            updateStatusMutation.isPending
                                        }
                                    >
                                        <Check className="h-4 w-4 mr-2" />{" "}
                                        Marcar como Entregue
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                <Package className="h-10 w-10 mx-auto mb-2" />
                                <p>Nenhum pedido atribuído no momento.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default DriverDashboard;
