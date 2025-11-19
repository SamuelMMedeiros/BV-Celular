/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, PersonStanding, Phone, User, AlertTriangle, Package, Clock, CheckCircle, XCircle, Heart } from "lucide-react";

import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; 
import { Label } from "@/components/ui/label"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateCustomerProfile, CustomerUpdatePayload, fetchClientOrders, fetchClientFavorites } from "@/lib/api"; // <-- IMPORT FAVORITES
import { supabase } from "@/integrations/supabase/client"; 
import { formatCurrency } from "@/lib/utils";
import { OrderCartItem } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProductCard } from "@/components/ProductCard"; // <-- IMPORT PRODUCT CARD

const profileSchema = z.object({
    name: z.string().min(2, "Nome completo é obrigatório"),
    phone: z
        .string()
        .regex(
            /^\d{10,11}$/,
            "Telefone inválido (10 ou 11 dígitos, apenas números)"
        ),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const MinhaConta = () => {
    const { profile, isLoggedIn, session, refetchProfile, isLoadingSession } = useCustomerAuth(); 
    const navigate = useNavigate();
    const location = useLocation(); 
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            phone: "",
        },
    });

    // Query de Pedidos
    const { data: orders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ["clientOrders", profile?.id],
        queryFn: () => fetchClientOrders(profile!.id),
        enabled: !!profile?.id,
    });

    // Query de Favoritos
    const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
        queryKey: ["clientFavorites", profile?.id],
        queryFn: () => fetchClientFavorites(profile!.id),
        enabled: !!profile?.id,
    });

    useEffect(() => {
        if (isLoggedIn && profile) {
            form.reset({
                name: profile.name,
                phone: profile.phone,
            });
        }
    }, [isLoggedIn, profile, form]);

    const updateMutation = useMutation({
        mutationFn: (data: CustomerUpdatePayload) => updateCustomerProfile(data),
        onSuccess: async () => {
            const { error: authError } = await supabase.auth.updateUser({
                data: { 
                    full_name: form.getValues("name"), 
                    phone: form.getValues("phone")
                }
            })
            if (authError) throw new Error(authError.message);

            await refetchProfile(); 
            
            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminClients"] });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            });
        },
    });

    useEffect(() => {
        if (!isLoadingSession) {
            if (!isLoggedIn) {
                navigate("/login", { state: { from: location.pathname }, replace: true });
            }
        }
    }, [isLoggedIn, isLoadingSession, navigate, location.pathname]); 

    if (isLoadingSession || (!profile && isLoggedIn)) { 
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-8 text-center">
                    Carregando perfil...
                </div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return null;
    }

    const onSubmit = (data: ProfileFormValues) => {
        if (!profile?.id) return;
        
        const payload: CustomerUpdatePayload = {
            id: profile.id,
            name: data.name,
            phone: data.phone,
        };
        updateMutation.mutate(payload);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</Badge>;
            case "cancelled":
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
        }
    };

    const parseItems = (items: any): OrderCartItem[] => {
        if (typeof items === 'string') {
            try { return JSON.parse(items); } catch { return []; }
        }
        return items as OrderCartItem[];
   }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <Tabs defaultValue="profile" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="profile">Meus Dados</TabsTrigger>
                        <TabsTrigger value="orders">Meus Pedidos</TabsTrigger>
                        <TabsTrigger value="favorites">Meus Favoritos</TabsTrigger>
                    </TabsList>

                    {/* ABA PERFIL */}
                    <TabsContent value="profile">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                                        <User className="h-6 w-6 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">Minha Conta</CardTitle>
                                        <CardDescription>
                                            Atualize seus dados pessoais.
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-1">
                                                <Mail className="h-4 w-4 text-muted-foreground" /> Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profile.email || "Email não encontrado"}
                                                disabled
                                                className="cursor-not-allowed bg-muted/50"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                O email não pode ser alterado.
                                            </p>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <PersonStanding className="h-4 w-4 text-muted-foreground" /> Nome Completo
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Seu nome completo" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <Phone className="h-4 w-4 text-muted-foreground" /> Telefone (WhatsApp)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="tel" placeholder="34999998888 (só números)" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Usaremos este número para confirmar seu orçamento.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {updateMutation.isError && (
                                            <div className="flex items-center gap-2 text-sm text-destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span>Erro ao salvar: {updateMutation.error.message}</span>
                                            </div>
                                        )}

                                        <Button type="submit" className="w-full sm:w-auto" disabled={updateMutation.isPending}>
                                            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABA PEDIDOS */}
                    <TabsContent value="orders">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            {isLoadingOrders ? (
                                <div className="text-center py-8">Carregando pedidos...</div>
                            ) : !orders || orders.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <Package className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Você ainda não fez nenhum pedido.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                orders.map(order => (
                                    <Card key={order.id}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">
                                                        Pedido #{order.id.substring(0, 8)}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                    </CardDescription>
                                                </div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 mb-4">
                                                {parseItems(order.items).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t">
                                                <span className="text-sm text-muted-foreground">
                                                    Loja: {order.Stores?.name || "Online"}
                                                </span>
                                                <span className="font-bold text-lg text-primary">
                                                    {formatCurrency(order.total_price)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* ABA FAVORITOS */}
                    <TabsContent value="favorites">
                         <div className="space-y-4">
                            {isLoadingFavorites ? (
                                <div className="text-center py-8">Carregando favoritos...</div>
                            ) : !favorites || favorites.length === 0 ? (
                                <Card className="max-w-2xl mx-auto">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <Heart className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Sua lista de favoritos está vazia.</p>
                                        <Button variant="link" onClick={() => navigate("/aparelhos")}>
                                            Ver Produtos
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {favorites.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default MinhaConta;