import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchClientOrders,
    updateCustomerProfile,
    fetchClientAddresses,
    createAddress,
    deleteAddress,
    fetchClientWarranties,
    fetchClientNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchAddressByCEP,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
// CORRIGIDO: Payload types e ClientNotification importados de types.ts
import {
    Address,
    Order,
    ClientNotification,
    Warranty,
    CustomerUpdatePayload,
    AddressInsertPayload,
} from "@/types";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MapPin,
    Package,
    ShieldCheck,
    Bell,
    Loader2,
    Check,
    Edit,
    Trash2,
    Plus,
    X,
    LogOut,
    CheckCircle,
    Truck,
    Clock,
    XCircle,
    Home,
    Store as StoreIcon, // Aliasing Store para StoreIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/EmptyState"; // Importado EmptyState

// ==================================================================
// 1. SCHEMAS
// ==================================================================

const profileSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    phone: z.string().min(10, "Telefone inválido."),
});

const addressSchema = z.object({
    name: z.string().min(3, "Nome do endereço é obrigatório."),
    cep: z.string().min(8, "CEP inválido."),
    street: z.string().min(3, "Rua é obrigatória."),
    number: z.string().min(1, "Número é obrigatório."),
    complement: z.string().optional().nullable(),
    neighborhood: z.string().min(3, "Bairro é obrigatório."),
    city: z.string().min(3, "Cidade é obrigatória."),
    state: z.string().length(2, "Estado inválido."),
});

// ==================================================================
// 2. TABS E TELAS
// ==================================================================

// Componente para a aba de Notificações
const NotificationsTab = ({ clientId }: { clientId: string }) => {
    const queryClient = useQueryClient();

    // Busca notificações
    const { data: notifications, isLoading } = useQuery<ClientNotification[]>({
        queryKey: ["clientNotifications", clientId],
        queryFn: () => fetchClientNotifications(clientId),
        enabled: !!clientId,
    });

    // Mutação para marcar como lido
    const markReadMutation = useMutation({
        mutationFn: (id: string) => markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["clientNotifications", clientId],
            });
        },
    });

    // Mutação para marcar todos como lidos
    const markAllReadMutation = useMutation({
        mutationFn: () => markAllNotificationsAsRead(clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["clientNotifications", clientId],
            });
        },
    });

    const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

    const getIconAndColor = (statusKey: string) => {
        switch (statusKey) {
            case "on_the_way":
                return {
                    Icon: Truck,
                    color: "text-blue-500",
                    bg: "bg-blue-50",
                };
            case "ready":
                return {
                    Icon: StoreIcon,
                    color: "text-amber-500",
                    bg: "bg-amber-50",
                };
            case "completed":
                return {
                    Icon: Check,
                    color: "text-green-500",
                    bg: "bg-green-50",
                };
            case "cancelled":
                return {
                    Icon: XCircle,
                    color: "text-red-500",
                    bg: "bg-red-50",
                };
            default:
                return {
                    Icon: Clock,
                    color: "text-gray-500",
                    bg: "bg-gray-50",
                };
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Seus Alertas
                    </CardTitle>
                    <CardDescription>
                        {unreadCount > 0 ? (
                            <span className="text-primary font-medium">
                                {unreadCount} notificação(es) não lida(s).
                            </span>
                        ) : (
                            "Nenhuma notificação não lida."
                        )}
                    </CardDescription>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                    >
                        {markAllReadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        Marcar todas como lidas
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {notifications && notifications.length > 0 ? (
                        notifications.map((n) => {
                            const { Icon, color, bg } = getIconAndColor(
                                n.status_key || "pending"
                            );
                            return (
                                <div
                                    key={n.id}
                                    className={`flex gap-4 p-4 rounded-lg border shadow-sm transition-all ${
                                        n.is_read
                                            ? "opacity-70 bg-muted/50"
                                            : `${bg} border-l-4 border-l-primary/80`
                                    }`}
                                >
                                    <div
                                        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${color} ${bg}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p
                                                className={`text-sm ${
                                                    n.is_read
                                                        ? "text-foreground/80"
                                                        : "font-semibold text-foreground"
                                                }`}
                                            >
                                                {n.message}
                                            </p>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs shrink-0"
                                            >
                                                {formatDistanceToNow(
                                                    parseISO(n.created_at),
                                                    {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    }
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                            {n.order_id && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs font-mono"
                                                >
                                                    Pedido #
                                                    {n.order_id.substring(0, 8)}
                                                </Badge>
                                            )}
                                            {!n.is_read && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="h-6 p-0 text-xs"
                                                    onClick={() =>
                                                        markReadMutation.mutate(
                                                            n.id
                                                        )
                                                    }
                                                    disabled={
                                                        markReadMutation.isPending
                                                    }
                                                >
                                                    Marcar como lido
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                            Nenhum alerta recente.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Componente para a aba de Pedidos
const OrdersTab = ({ clientId }: { clientId: string }) => {
    const { data: orders, isLoading } = useQuery<Order[]>({
        queryKey: ["clientOrders", clientId],
        queryFn: () => fetchClientOrders(clientId),
        enabled: !!clientId,
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-gray-200 text-gray-700"
                    >
                        <Clock className="h-3 w-3 mr-1" /> Pendente
                    </Badge>
                );
            case "processing":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                    >
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />{" "}
                        Processando
                    </Badge>
                );
            case "ready":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-700"
                    >
                        <StoreIcon className="h-3 w-3 mr-1" /> Pronto para
                        Retirada
                    </Badge>
                ); // Usa StoreIcon
            case "on_the_way":
                return (
                    <Badge className="bg-blue-600 text-white">
                        <Truck className="h-3 w-3 mr-1" /> A Caminho
                    </Badge>
                );
            case "completed":
                return (
                    <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                    >
                        <CheckCircle className="h-3 w-3 mr-1" /> Concluído
                    </Badge>
                ); // Removido variant="success"
            case "cancelled":
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Cancelado
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading)
        return (
            <div className="space-y-4 pt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                ))}
            </div>
        );

    return (
        <div className="space-y-6 pt-4">
            {orders?.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="Nenhum Pedido Encontrado"
                    description="Você ainda não fez nenhum pedido em nossa loja."
                />
            ) : (
                orders?.map((order) => (
                    <Card key={order.id} className="shadow-sm">
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div>
                                <CardTitle className="text-xl">
                                    Pedido #{order.id.substring(0, 8)}
                                </CardTitle>
                                <CardDescription>
                                    {format(
                                        new Date(order.created_at),
                                        "dd 'de' MMMM, yyyy",
                                        { locale: ptBR }
                                    )}
                                </CardDescription>
                            </div>
                            {getStatusBadge(order.status)}
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-bold mb-2">
                                Total: {formatCurrency(order.total_price)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {order.delivery_type === "delivery"
                                    ? "Entrega"
                                    : "Retirada"}{" "}
                                em {order.Stores?.name || "Loja Desconhecida"}
                            </p>
                            <Separator className="my-3" />
                            <h4 className="text-sm font-semibold mb-2">
                                Itens:
                            </h4>
                            <ScrollArea className="h-20 border p-2 rounded-md">
                                <ul className="text-sm space-y-0.5">
                                    {order.items.map((item, idx) => (
                                        <li key={idx}>
                                            {item.quantity}x {item.name}{" "}
                                            {item.variantName &&
                                                `(${item.variantName})`}
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

// Componente da aba Perfil e Endereços
const ProfileAndAddressTab = () => {
    const { customerProfile, refetchProfile } = useCustomerAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: customerProfile?.name || "",
            phone: customerProfile?.phone || "",
        },
        values: {
            name: customerProfile?.name || "",
            phone: customerProfile?.phone || "",
        },
    });

    const addressForm = useForm<z.infer<typeof addressSchema>>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            name: "",
            cep: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: CustomerUpdatePayload) =>
            updateCustomerProfile(data), // Typagem explícita
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Perfil atualizado." });
            refetchProfile();
            setIsEditingProfile(false);
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const createAddressMutation = useMutation({
        mutationFn: (data: AddressInsertPayload) => createAddress(data), // Typagem explícita
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Endereço adicionado." });
            queryClient.invalidateQueries({ queryKey: ["clientAddresses"] });
            setIsAddingAddress(false);
            addressForm.reset();
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const deleteAddressMutation = useMutation({
        mutationFn: deleteAddress,
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Endereço removido." });
            queryClient.invalidateQueries({ queryKey: ["clientAddresses"] });
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const { data: addresses, isLoading: isLoadingAddresses } = useQuery<
        Address[]
    >({
        queryKey: ["clientAddresses", customerProfile?.id],
        queryFn: () => fetchClientAddresses(customerProfile!.id),
        enabled: !!customerProfile?.id,
    });

    const handleCEPBlur = async () => {
        const cep = addressForm.getValues("cep").replace(/\D/g, "");
        if (cep.length !== 8) return;

        setIsFetchingCep(true);
        try {
            const data = await fetchAddressByCEP(cep);
            if (data) {
                addressForm.setValue("street", data.street || "");
                addressForm.setValue("neighborhood", data.neighborhood || "");
                addressForm.setValue("city", data.city || "");
                addressForm.setValue("state", data.state || "");
                addressForm.setFocus("number");
            }
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao buscar CEP." });
        } finally {
            setIsFetchingCep(false);
        }
    };

    const handleProfileSubmit = (data: z.infer<typeof profileSchema>) => {
        if (customerProfile) {
            // CORRIGIDO: Passando name e phone garantidos pelo Zod, e o ID do cliente
            updateProfileMutation.mutate({
                id: customerProfile.id,
                name: data.name,
                phone: data.phone,
            });
        }
    };

    const handleAddressSubmit = (data: z.infer<typeof addressSchema>) => {
        if (customerProfile) {
            // CORRIGIDO: Os campos obrigatórios (garantidos pelo Zod) são passados explicitamente
            createAddressMutation.mutate({
                client_id: customerProfile.id,
                name: data.name,
                cep: data.cep,
                street: data.street,
                number: data.number, // Garantido pelo Zod
                complement: data.complement || null,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
            } as AddressInsertPayload);
        }
    };

    return (
        <div className="space-y-6 pt-4">
            {/* CARD PERFIL */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Dados Pessoais</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                        {isEditingProfile ? (
                            <X className="h-4 w-4 mr-2" />
                        ) : (
                            <Edit className="h-4 w-4 mr-2" />
                        )}
                        {isEditingProfile ? "Cancelar" : "Editar"}
                    </Button>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form
                            onSubmit={profileForm.handleSubmit(
                                handleProfileSubmit
                            )}
                            className="space-y-4"
                        >
                            <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditingProfile}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditingProfile}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {!isEditingProfile && (
                                <p className="text-sm text-muted-foreground">
                                    Email: {customerProfile?.email}
                                </p>
                            )}
                            {isEditingProfile && (
                                <Button
                                    type="submit"
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending
                                        ? "Salvando..."
                                        : "Salvar Perfil"}
                                </Button>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* CARD ENDEREÇOS */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Meus Endereços</CardTitle>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAddingAddress(!isAddingAddress)}
                    >
                        {isAddingAddress ? (
                            <X className="h-4 w-4 mr-2" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        {isAddingAddress ? "Cancelar" : "Novo Endereço"}
                    </Button>
                </CardHeader>

                {isAddingAddress && (
                    <CardContent className="border-t pt-6">
                        <Form {...addressForm}>
                            <form
                                onSubmit={addressForm.handleSubmit(
                                    handleAddressSubmit
                                )}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={addressForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Apelido *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Ex: Casa"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={addressForm.control}
                                        name="cep"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>CEP *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        onBlur={handleCEPBlur}
                                                        disabled={isFetchingCep}
                                                        placeholder="Apenas números"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <FormField
                                        control={addressForm.control}
                                        name="street"
                                        render={({ field }) => (
                                            <FormItem className="col-span-3">
                                                <FormLabel>Rua *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isFetchingCep}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={addressForm.control}
                                        name="number"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel>Número *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={addressForm.control}
                                        name="neighborhood"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bairro *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isFetchingCep}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={addressForm.control}
                                        name="complement"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Complemento
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={addressForm.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Cidade *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={isFetchingCep}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={addressForm.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel>UF *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        maxLength={2}
                                                        disabled={isFetchingCep}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={
                                        createAddressMutation.isPending ||
                                        isFetchingCep
                                    }
                                >
                                    {createAddressMutation.isPending
                                        ? "Adicionando..."
                                        : "Salvar Endereço"}
                                </Button>
                            </form>
                        </Form>
                        <Separator className="my-6" />
                    </CardContent>
                )}

                <CardContent className="space-y-4">
                    {isLoadingAddresses ? (
                        <div className="space-y-4">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                            ))}
                        </div>
                    ) : addresses && addresses.length > 0 ? (
                        addresses.map((address) => (
                            <div
                                key={address.id}
                                className="border p-4 rounded-lg flex justify-between items-start hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <div>
                                        <p className="font-semibold text-lg">
                                            {address.name}
                                        </p>
                                        <p className="text-sm">
                                            {address.street}, {address.number}
                                            {address.complement &&
                                                ` - ${address.complement}`}
                                            <br />
                                            {address.neighborhood},{" "}
                                            {address.city} - {address.state},{" "}
                                            {address.cep}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        deleteAddressMutation.mutate(address.id)
                                    }
                                    disabled={deleteAddressMutation.isPending}
                                    className="text-destructive shrink-0"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            Nenhum endereço cadastrado.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// Componente da aba Garantias
const WarrantiesTab = ({ clientId }: { clientId: string }) => {
    const { data: warranties, isLoading } = useQuery<Warranty[]>({
        queryKey: ["clientWarranties", clientId],
        queryFn: () => fetchClientWarranties(clientId),
        enabled: !!clientId,
    });

    if (isLoading)
        return (
            <div className="space-y-4 pt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );

    return (
        <div className="space-y-6 pt-4">
            {warranties?.length === 0 ? (
                <EmptyState
                    icon={ShieldCheck}
                    title="Nenhuma Garantia Encontrada"
                    description="As garantias dos seus produtos aparecerão aqui."
                />
            ) : (
                warranties?.map((warranty) => (
                    <Card
                        key={warranty.id}
                        className="shadow-sm border-l-4 border-l-primary"
                    >
                        <CardHeader className="flex flex-row justify-between items-center pb-2">
                            <CardTitle className="text-xl">
                                {warranty.product_model}
                            </CardTitle>
                            <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                            >
                                Ativa
                            </Badge>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="font-medium">
                                Número de Série:{" "}
                                <span className="font-mono">
                                    {warranty.serial_number}
                                </span>
                            </p>
                            <p className="text-muted-foreground mt-2">
                                Data de Compra:{" "}
                                {format(
                                    parseISO(warranty.purchase_date),
                                    "dd/MM/yyyy",
                                    { locale: ptBR }
                                )}
                            </p>
                            <p className="font-semibold text-primary mt-1">
                                Expira em:{" "}
                                {format(
                                    parseISO(warranty.warranty_end_date),
                                    "dd/MM/yyyy",
                                    { locale: ptBR }
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Loja: {warranty.Stores?.name}
                            </p>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

// ==================================================================
// 3. TELA PRINCIPAL
// ==================================================================

const MinhaConta = () => {
    const { isLoggedIn, isLoadingSession, logout, customerProfile } =
        useCustomerAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "pedidos";

    // Redireciona se não estiver logado e a sessão carregou
    useEffect(() => {
        if (!isLoadingSession && !isLoggedIn) {
            navigate("/login");
        }
    }, [isLoadingSession, isLoggedIn, navigate]);

    // Função para alterar a aba via URL
    const setActiveTab = (tab: string) => {
        setSearchParams({ tab });
    };

    if (isLoadingSession || !isLoggedIn || !customerProfile) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    // Calcula o ID do cliente logado
    const clientId = customerProfile.id;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Minha Conta"
                description={`Gerencie seus pedidos, perfil e alertas, ${customerProfile.name}.`}
            />
            <Navbar />
            <main className="container py-8 flex-1 max-w-4xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {customerProfile.name}
                        </h1>
                        <p className="text-muted-foreground">
                            {customerProfile.email}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={logout}
                        className="text-destructive"
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-4 h-12">
                        <TabsTrigger value="pedidos">
                            <Package className="h-4 w-4 mr-2 hidden sm:inline" />{" "}
                            Pedidos
                        </TabsTrigger>
                        <TabsTrigger value="alertas">
                            <Bell className="h-4 w-4 mr-2 hidden sm:inline" />{" "}
                            Alertas
                        </TabsTrigger>
                        <TabsTrigger value="perfil">
                            <MapPin className="h-4 w-4 mr-2 hidden sm:inline" />{" "}
                            Perfil/Endereços
                        </TabsTrigger>
                        <TabsTrigger value="garantias">
                            <ShieldCheck className="h-4 w-4 mr-2 hidden sm:inline" />{" "}
                            Garantias
                        </TabsTrigger>
                    </TabsList>

                    {/* Conteúdo da aba Pedidos */}
                    <TabsContent value="pedidos">
                        <OrdersTab clientId={clientId} />
                    </TabsContent>

                    {/* NOVO: Conteúdo da aba Alertas/Notificações */}
                    <TabsContent value="alertas">
                        <NotificationsTab clientId={clientId} />
                    </TabsContent>

                    {/* Conteúdo da aba Perfil e Endereços */}
                    <TabsContent value="perfil">
                        <ProfileAndAddressTab />
                    </TabsContent>

                    {/* Conteúdo da aba Garantias */}
                    <TabsContent value="garantias">
                        <WarrantiesTab clientId={clientId} />
                    </TabsContent>
                </Tabs>
            </main>
            <Footer />
        </div>
    );
};

export default MinhaConta;
