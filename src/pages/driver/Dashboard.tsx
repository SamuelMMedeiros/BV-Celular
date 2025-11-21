/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/types";
import {
    MapPin,
    Phone,
    CheckCircle,
    Navigation,
    Package,
    RefreshCw,
    LogOut,
    Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { fetchDriverProfile } from "@/lib/api";
import { NotificationButton } from "@/components/NotificationButton"; // <-- ADICIONADO

const fetchDeliveries = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from("Orders")
        .select(
            `
            *,
            Clients ( name, phone ),
            Stores ( name ),
            Addresses ( * )
        `
        )
        .eq("delivery_type", "delivery")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as Order[];
};

const DriverDashboard = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("pending");

    // SEGURANÇA: Verifica se é motorista
    useEffect(() => {
        const checkAuth = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                navigate("/driver-login");
                return;
            }
            const driver = await fetchDriverProfile();
            if (!driver) {
                await supabase.auth.signOut();
                navigate("/driver-login");
            }
        };
        checkAuth();
    }, [navigate]);

    const {
        data: orders,
        isLoading,
        refetch,
    } = useQuery<Order[]>({
        queryKey: ["driverOrders"],
        queryFn: fetchDeliveries,
    });

    // REALTIME: Atualiza lista quando cai pedido
    useEffect(() => {
        const channel = supabase
            .channel("public:Orders")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Orders" },
                (payload) => {
                    console.log("Mudança em pedidos:", payload);
                    refetch();
                    if (
                        payload.eventType === "INSERT" ||
                        payload.eventType === "UPDATE"
                    ) {
                        toast({
                            title: "Atualização!",
                            description: "Lista de entregas atualizada.",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetch, toast]);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from("Orders")
                .update({ status })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Status atualizado!" });
            queryClient.invalidateQueries({ queryKey: ["driverOrders"] });
        },
        onError: (err) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: err.message,
            }),
    });

    const pendingOrders = orders?.filter(
        (o) =>
            o.status === "pending" ||
            o.status === "processing" ||
            o.status === "delivering"
    );
    const completedOrders = orders?.filter((o) => o.status === "completed");

    const openMap = (address: any) => {
        if (!address) return;
        const query = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}`;
        // Abre app nativo de mapas
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                query
            )}`,
            "_blank"
        );
    };

    const openWhatsApp = (phone: string) => {
        window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
    };

    const DeliveryCard = ({
        order,
        showActions = true,
    }: {
        order: Order;
        showActions?: boolean;
    }) => (
        <Card className="mb-4 border-l-4 border-l-primary shadow-sm bg-white dark:bg-slate-800 text-card-foreground animate-in fade-in slide-in-from-bottom-2">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">
                            #{order.id.substring(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {order.Clients?.name}
                        </p>
                    </div>
                    <Badge
                        variant={
                            order.status === "completed"
                                ? "default"
                                : "secondary"
                        }
                    >
                        {order.status === "pending"
                            ? "Pendente"
                            : order.status === "delivering"
                            ? "Em Rota"
                            : order.status === "completed"
                            ? "Entregue"
                            : order.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm space-y-2">
                <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-foreground">
                            {order.Addresses?.street}, {order.Addresses?.number}
                        </p>
                        <p className="text-muted-foreground">
                            {order.Addresses?.neighborhood} -{" "}
                            {order.Addresses?.city}
                        </p>
                        {order.Addresses?.complement && (
                            <p className="text-xs italic text-muted-foreground">
                                Obs: {order.Addresses.complement}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground">
                        {formatCurrency(order.total_price)} (
                        {order.payment_method === "cash"
                            ? "Dinheiro"
                            : "Cartão/Pix"}
                        )
                    </span>
                </div>
                {order.change_for && (
                    <p className="text-xs text-red-500 font-bold pl-6 uppercase">
                        Levar Troco: {formatCurrency(order.change_for)}
                    </p>
                )}
            </CardContent>
            {showActions && (
                <CardFooter className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => openMap(order.Addresses)}
                        className="w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                    >
                        <Navigation className="mr-2 h-4 w-4" /> Rota
                    </Button>

                    {order.status !== "completed" ? (
                        <Button
                            onClick={() =>
                                updateStatusMutation.mutate({
                                    id: order.id,
                                    status: "completed",
                                })
                            }
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Entregue
                        </Button>
                    ) : (
                        <Button disabled variant="ghost" className="w-full">
                            Concluído
                        </Button>
                    )}

                    <Button
                        variant="secondary"
                        onClick={() => openWhatsApp(order.Clients?.phone || "")}
                        className="col-span-2 w-full dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                    >
                        <Phone className="mr-2 h-4 w-4" /> Contatar Cliente
                    </Button>
                </CardFooter>
            )}
        </Card>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
            <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Navigation className="h-6 w-6" /> Entregas
                </h1>
                <div className="flex items-center gap-2">
                    {/* Botão para receber Push Notification */}
                    <NotificationButton />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate("/driver-login");
                        }}
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <main className="p-4 max-w-md mx-auto">
                <Tabs
                    defaultValue="pending"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-white dark:bg-slate-900">
                        <TabsTrigger
                            value="pending"
                            className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800"
                        >
                            A Fazer ({pendingOrders?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger
                            value="completed"
                            className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800"
                        >
                            Feitas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="animate-spin mx-auto" />
                            </div>
                        ) : pendingOrders?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Tudo entregue por enquanto!</p>
                                <Button
                                    variant="link"
                                    onClick={() => refetch()}
                                >
                                    Atualizar{" "}
                                    <RefreshCw className="ml-2 h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            pendingOrders?.map((order) => (
                                <DeliveryCard key={order.id} order={order} />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        {completedOrders?.map((order) => (
                            <DeliveryCard
                                key={order.id}
                                order={order}
                                showActions={false}
                            />
                        ))}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default DriverDashboard;
