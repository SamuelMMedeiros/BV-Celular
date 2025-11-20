/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchAllOrders, updateOrderStatus } from "@/lib/api";
import { Order, OrderCartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
    Loader2,
    Truck,
    Store,
    CheckCircle,
    Clock,
    Package,
    Printer,
    RefreshCw,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

// Som de notificação (Bip curto)
const NOTIFICATION_SOUND =
    "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const AdminLogistics = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Inicializa o áudio
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
    }, []);

    // Busca apenas pedidos ativos (não concluídos/cancelados)
    const {
        data: allOrders,
        isLoading,
        refetch,
    } = useQuery<Order[]>({
        queryKey: ["activeOrders"],
        queryFn: async () => {
            // Filtramos no front ou criamos uma API específica.
            // Por enquanto, fetchAllOrders e filtra aqui para simplificar.
            const orders = await fetchAllOrders();
            return orders.filter(
                (o) => o.status !== "completed" && o.status !== "cancelled"
            );
        },
    });

    // --- REALTIME: OUVIR NOVOS PEDIDOS ---
    useEffect(() => {
        const channel = supabase
            .channel("public:Orders")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Orders" },
                (payload) => {
                    console.log("Alteração em tempo real:", payload);

                    // Se for um novo pedido, toca som e avisa
                    if (payload.eventType === "INSERT") {
                        audioRef.current
                            ?.play()
                            .catch((e) =>
                                console.log(
                                    "Autoplay bloqueado pelo navegador",
                                    e
                                )
                            );
                        toast({
                            title: "🔔 Novo Pedido Recebido!",
                            description: "A lista foi atualizada.",
                            duration: 5000,
                            className: "bg-green-600 text-white border-none",
                        });
                    }

                    refetch(); // Atualiza a lista
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetch, toast]);

    const updateStatusMutation = useMutation({
        mutationFn: ({
            orderId,
            status,
        }: {
            orderId: string;
            status: string;
        }) => updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
            toast({ title: "Status atualizado!" });
        },
    });

    // Separação por Tipo
    const deliveryOrders =
        allOrders?.filter((o) => o.delivery_type === "delivery") || [];
    const pickupOrders =
        allOrders?.filter((o) => o.delivery_type === "pickup") || [];

    // Helper de itens
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

    // Componente de Card de Pedido (KDS Style)
    const OrderTicket = ({ order }: { order: Order }) => {
        const minutesAgo = differenceInMinutes(
            new Date(),
            new Date(order.created_at)
        );
        const isLate = minutesAgo > 30; // Alerta se passar de 30min

        return (
            <Card
                className={`border-l-4 shadow-md ${
                    isLate ? "border-l-red-500" : "border-l-blue-500"
                }`}
            >
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                #{order.id.substring(0, 6).toUpperCase()}
                                {isLate && (
                                    <Badge
                                        variant="destructive"
                                        className="text-xs"
                                    >
                                        Atrasado
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {order.Clients?.name} •{" "}
                                {format(new Date(order.created_at), "HH:mm")}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono">
                            {minutesAgo} min
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="text-sm pb-3">
                    <div className="space-y-1 mb-3">
                        {parseItems(order.items).map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                                <span>
                                    {item.quantity}x {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-2 text-muted-foreground text-xs">
                        {order.delivery_type === "delivery" ? (
                            <>
                                <p className="font-bold text-foreground flex items-center gap-1">
                                    <Truck className="h-3 w-3" /> Entrega:
                                </p>
                                <p>
                                    {order.Addresses?.neighborhood} -{" "}
                                    {order.Addresses?.city}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-bold text-foreground flex items-center gap-1">
                                    <Store className="h-3 w-3" /> Retirada:
                                </p>
                                <p>{order.Stores?.name}</p>
                            </>
                        )}
                        <p className="mt-1 font-bold text-primary text-base">
                            {formatCurrency(order.total_price)}
                        </p>
                        {order.payment_method === "cash" &&
                            order.change_for && (
                                <p className="text-red-600 font-bold">
                                    Troco para:{" "}
                                    {formatCurrency(order.change_for)}
                                </p>
                            )}
                    </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2 pt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                    >
                        <Printer className="h-4 w-4 mr-2" /> Imprimir
                    </Button>

                    {order.status === "pending" && (
                        <Button
                            size="sm"
                            className={
                                order.delivery_type === "delivery"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                            }
                            onClick={() =>
                                updateStatusMutation.mutate({
                                    orderId: order.id,
                                    status:
                                        order.delivery_type === "delivery"
                                            ? "delivering"
                                            : "ready",
                                })
                            }
                        >
                            {order.delivery_type === "delivery"
                                ? "Despachar"
                                : "Pronto"}
                        </Button>
                    )}

                    {(order.status === "delivering" ||
                        order.status === "ready") && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={() =>
                                updateStatusMutation.mutate({
                                    orderId: order.id,
                                    status: "completed",
                                })
                            }
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Concluir
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="container py-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Clock className="h-8 w-8 text-primary" /> Expedição
                            em Tempo Real
                        </h1>
                        <p className="text-muted-foreground">
                            Monitoramento de pedidos ativos.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${
                                    isLoading ? "animate-spin" : ""
                                }`}
                            />{" "}
                            Atualizar
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="delivery" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-14 mb-6 bg-white border shadow-sm rounded-xl">
                            <TabsTrigger
                                value="delivery"
                                className="text-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                            >
                                <Truck className="mr-2 h-5 w-5" /> Entregas (
                                {deliveryOrders.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="pickup"
                                className="text-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
                            >
                                <Store className="mr-2 h-5 w-5" /> Retiradas (
                                {pickupOrders.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="delivery">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {deliveryOrders.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-muted-foreground">
                                        <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-xl">
                                            Nenhuma entrega pendente.
                                        </p>
                                    </div>
                                ) : (
                                    deliveryOrders.map((order) => (
                                        <OrderTicket
                                            key={order.id}
                                            order={order}
                                        />
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="pickup">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {pickupOrders.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-muted-foreground">
                                        <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-xl">
                                            Nenhuma retirada pendente.
                                        </p>
                                    </div>
                                ) : (
                                    pickupOrders.map((order) => (
                                        <OrderTicket
                                            key={order.id}
                                            order={order}
                                        />
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
};

export default AdminLogistics;
