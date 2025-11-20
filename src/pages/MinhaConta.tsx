/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO PARA: src/pages/MinhaConta.tsx ===
//
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, PersonStanding, Phone, User, AlertTriangle, Package, Clock, CheckCircle, XCircle, Heart, ShieldCheck, MapPin, Plus, Trash2, Search } from "lucide-react";

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
import { 
    updateCustomerProfile, 
    fetchClientOrders, 
    fetchClientFavorites, 
    fetchClientWarranties,
    fetchClientAddresses,
    createAddress,
    deleteAddress,
    fetchAddressByCEP
} from "@/lib/api"; 
// --- CORREÇÃO: Importando Payloads de @/types ---
import { CustomerUpdatePayload, AddressInsertPayload, OrderCartItem, Address } from "@/types";
import { supabase } from "@/integrations/supabase/client"; 
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProductCard } from "@/components/ProductCard"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Schemas
const profileSchema = z.object({
    name: z.string().min(2, "Nome completo é obrigatório"),
    phone: z.string().regex(/^\d{10,11}$/, "Telefone inválido"),
});

const addressSchema = z.object({
    name: z.string().min(1, "Dê um nome (ex: Casa)"),
    cep: z.string().min(8, "CEP inválido").max(9),
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(2, "Estado é obrigatório"),
    complement: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

const MinhaConta = () => {
    const { profile, isLoggedIn, isLoadingSession, refetchProfile } = useCustomerAuth(); 
    const navigate = useNavigate();
    const location = useLocation(); 
    const { toast } = useToast();
    const queryClient = useQueryClient();
    
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "", phone: "" },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: { name: "Casa", cep: "", street: "", number: "", neighborhood: "", city: "", state: "", complement: "" },
    });

    const { data: orders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ["clientOrders", profile?.id],
        queryFn: () => fetchClientOrders(profile!.id),
        enabled: !!profile?.id,
    });

    const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
        queryKey: ["clientFavorites", profile?.id],
        queryFn: () => fetchClientFavorites(profile!.id),
        enabled: !!profile?.id,
    });

     const { data: warranties, isLoading: isLoadingWarranties } = useQuery({
        queryKey: ["clientWarranties", profile?.id],
        queryFn: () => fetchClientWarranties(profile!.id),
        enabled: !!profile?.id,
    });

    const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
        queryKey: ["clientAddresses", profile?.id],
        queryFn: () => fetchClientAddresses(profile!.id),
        enabled: !!profile?.id,
    });

    useEffect(() => {
        if (isLoggedIn && profile) {
            profileForm.reset({ name: profile.name, phone: profile.phone });
        }
    }, [isLoggedIn, profile, profileForm]);

    useEffect(() => {
        if (!isLoadingSession && !isLoggedIn) {
            navigate("/login", { state: { from: location.pathname }, replace: true });
        }
    }, [isLoggedIn, isLoadingSession, navigate, location.pathname]); 

    const updateProfileMutation = useMutation({
        mutationFn: (data: CustomerUpdatePayload) => updateCustomerProfile(data),
        onSuccess: async () => {
            await supabase.auth.updateUser({ data: { full_name: profileForm.getValues("name"), phone: profileForm.getValues("phone") } });
            await refetchProfile(); 
            toast({ title: "Sucesso!", description: "Perfil atualizado." });
        },
        onError: (error) => toast({ variant: "destructive", title: "Erro", description: error.message }),
    });

    const createAddressMutation = useMutation({
        mutationFn: (data: AddressInsertPayload) => createAddress(data),
        onSuccess: () => {
            toast({ title: "Endereço salvo!" });
            queryClient.invalidateQueries({ queryKey: ["clientAddresses"] });
            setIsAddressDialogOpen(false);
            addressForm.reset();
        },
        onError: (error) => toast({ variant: "destructive", title: "Erro", description: error.message }),
    });

    const deleteAddressMutation = useMutation({
        mutationFn: (id: string) => deleteAddress(id),
        onSuccess: () => {
            toast({ title: "Endereço removido." });
            queryClient.invalidateQueries({ queryKey: ["clientAddresses"] });
        },
    });

    const onProfileSubmit = (data: ProfileFormValues) => {
        if (!profile?.id) return;
        updateProfileMutation.mutate({ id: profile.id, name: data.name, phone: data.phone });
    };

    const onAddressSubmit = (data: AddressFormValues) => {
        if (!profile?.id) return;
        //@ts-ignore
        createAddressMutation.mutate({ ...data, client_id: profile.id });
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            setIsLoadingCep(true);
            const data = await fetchAddressByCEP(cep);
            setIsLoadingCep(false);
            if (data) {
                addressForm.setValue('street', data.street || '');
                addressForm.setValue('neighborhood', data.neighborhood || '');
                addressForm.setValue('city', data.city || '');
                addressForm.setValue('state', data.state || '');
                addressForm.setFocus('number');
            } else {
                toast({ variant: "destructive", title: "CEP não encontrado" });
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed": return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</Badge>;
            case "cancelled": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
            default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
        }
    };

    const parseItems = (items: any): OrderCartItem[] => {
        if (typeof items === 'string') { try { return JSON.parse(items); } catch { return []; } }
        return items as OrderCartItem[];
    }

    if (isLoadingSession || (!profile && isLoggedIn)) { 
        return <div className="min-h-screen bg-background pt-20 text-center">Carregando...</div>;
    }

    if (!isLoggedIn) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <Tabs defaultValue="profile" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto gap-2 bg-transparent p-0">
                        <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white border bg-card">Dados</TabsTrigger>
                        <TabsTrigger value="addresses" className="data-[state=active]:bg-primary data-[state=active]:text-white border bg-card">Endereços</TabsTrigger>
                        <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-white border bg-card">Pedidos</TabsTrigger>
                        <TabsTrigger value="favorites" className="data-[state=active]:bg-primary data-[state=active]:text-white border bg-card">Favoritos</TabsTrigger>
                        <TabsTrigger value="warranties" className="data-[state=active]:bg-primary data-[state=active]:text-white border bg-card">Garantias</TabsTrigger>
                    </TabsList>

                    {/* 1. PERFIL */}
                    <TabsContent value="profile">
                        <Card className="max-w-xl mx-auto">
                            <CardHeader>
                                <div className="flex items-center gap-3"><User className="h-8 w-8 text-primary" /><CardTitle>Meus Dados</CardTitle></div>
                            </CardHeader>
                            <CardContent>
                                <Form {...profileForm}>
                                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={profile.email} disabled className="bg-muted" />
                                        </div>
                                        <FormField control={profileForm.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={profileForm.control} name="phone" render={({ field }) => (
                                            <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                                            {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 2. ENDEREÇOS */}
                    <TabsContent value="addresses">
                        <div className="space-y-4 max-w-3xl mx-auto">
                             <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Meus Endereços</h2>
                                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Novo Endereço</Button></DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader><DialogTitle>Adicionar Endereço</DialogTitle></DialogHeader>
                                        <Form {...addressForm}>
                                            <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                                                <FormField control={addressForm.control} name="name" render={({ field }) => (
                                                    <FormItem><FormLabel>Nome do Local</FormLabel><FormControl><Input placeholder="Ex: Casa, Trabalho" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={addressForm.control} name="cep" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>CEP</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input placeholder="00000-000" {...field} onBlur={handleCepBlur} maxLength={9} />
                                                                    {isLoadingCep && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={addressForm.control} name="state" render={({ field }) => (
                                                        <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={addressForm.control} name="city" render={({ field }) => (
                                                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={addressForm.control} name="neighborhood" render={({ field }) => (
                                                        <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                                <FormField control={addressForm.control} name="street" render={({ field }) => (
                                                    <FormItem><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <FormField control={addressForm.control} name="number" render={({ field }) => (
                                                        <FormItem className="col-span-1"><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={addressForm.control} name="complement" render={({ field }) => (
                                                        <FormItem className="col-span-2"><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                                <Button type="submit" className="w-full" disabled={createAddressMutation.isPending}>{createAddressMutation.isPending ? "Salvando..." : "Salvar Endereço"}</Button>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                             </div>

                             {isLoadingAddresses ? <div className="text-center py-8">Carregando...</div> : 
                                (!addresses || addresses.length === 0) ? 
                                <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum endereço cadastrado.</CardContent></Card> : 
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {addresses.map(addr => (
                                        <Card key={addr.id} className="relative group">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/> {addr.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm text-muted-foreground">
                                                <p>{addr.street}, {addr.number}</p>
                                                {addr.complement && <p>{addr.complement}</p>}
                                                <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                                <p>{addr.cep}</p>
                                            </CardContent>
                                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => deleteAddressMutation.mutate(addr.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                             }
                        </div>
                    </TabsContent>

                    {/* 3. PEDIDOS */}
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

                    {/* 4. FAVORITOS */}
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

                    {/* 5. GARANTIAS */}
                    <TabsContent value="warranties">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            {isLoadingWarranties ? (
                                <div className="text-center py-8">Carregando garantias...</div>
                            ) : !warranties || warranties.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Você não possui garantias ativas.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                warranties.map(warranty => (
                                    <Card key={warranty.id}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">{warranty.product_model}</CardTitle>
                                                    <CardDescription>S/N: {warranty.serial_number}</CardDescription>
                                                </div>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Ativa
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Data da Compra</p>
                                                    <p className="font-medium">{format(new Date(warranty.purchase_date), "dd/MM/yyyy")}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Válida Até</p>
                                                    <p className="font-bold text-primary">{format(new Date(warranty.warranty_end_date), "dd/MM/yyyy")}</p>
                                                </div>
                                                <div className="col-span-2 pt-2 border-t mt-2">
                                                    <p className="text-muted-foreground text-xs">Loja: {warranty.Stores?.name}</p>
                                                    {warranty.Stores?.address && <p className="text-muted-foreground text-xs">{warranty.Stores.address}</p>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default MinhaConta;