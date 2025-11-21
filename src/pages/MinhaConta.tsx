/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO PARA: src/pages/MinhaConta.tsx ===
//
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { fetchClientOrders, fetchClientFavorites, fetchClientAddresses, deleteAddress, fetchClientWarranties } from "@/lib/api";
import { Order, Product, Address, Warranty } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Package, MapPin, Heart, LogOut, Trash2, Plus, ShieldCheck, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProductCard } from "@/components/ProductCard";
import { generateWarrantyPDF } from "@/lib/pdfGenerator";

const MinhaConta = () => {
    const { user, profile, logout, isLoadingSession } = useCustomerAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isLoadingSession && !user) {
            navigate("/login");
        }
    }, [user, isLoadingSession, navigate]);

    const { data: orders, isLoading: loadingOrders } = useQuery<Order[]>({
        queryKey: ["clientOrders", user?.id],
        queryFn: () => fetchClientOrders(user!.id),
        enabled: !!user,
    });

    const { data: favorites, isLoading: loadingFavs } = useQuery<Product[]>({
        queryKey: ["clientFavorites", user?.id],
        queryFn: () => fetchClientFavorites(user!.id),
        enabled: !!user,
    });

    const { data: addresses, isLoading: loadingAddr } = useQuery<Address[]>({
        queryKey: ["clientAddresses", user?.id],
        queryFn: () => fetchClientAddresses(user!.id),
        enabled: !!user,
    });
    
    const { data: warranties } = useQuery<Warranty[]>({
        queryKey: ["clientWarranties", user?.id],
        queryFn: () => fetchClientWarranties(user!.id),
        enabled: !!user,
    });

    const deleteAddrMutation = useMutation({
        mutationFn: deleteAddress,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientAddresses"] }),
    });

    if (isLoadingSession) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    // --- COMPONENTE DE RASTREAMENTO VISUAL ---
    const OrderTracker = ({ status }: { status: string }) => {
        if (status === 'cancelled') {
            return (
                <div className="flex items-center gap-2 text-destructive font-bold mt-4 bg-destructive/10 p-3 rounded-lg">
                    <XCircle className="h-5 w-5" /> Pedido Cancelado
                </div>
            );
        }

        // Mapeia status para passos (0 a 3)
        const getStep = (s: string) => {
            switch(s) {
                case 'pending': return 0; // Recebido
                case 'processing': return 1; // Preparando/Separado
                case 'ready': return 1; // Pronto pra retirada
                case 'delivering': return 2; // Enviado/Em Rota
                case 'completed': return 3; // Entregue
                default: return 0;
            }
        };
        
        const currentStep = getStep(status);
        const steps = [
            { label: "Recebido", icon: Clock },
            { label: "Separado", icon: Package },
            { label: "Enviado", icon: Truck },
            { label: "Entregue", icon: CheckCircle },
        ];

        return (
            <div className="w-full mt-6 mb-2">
                <div className="relative flex justify-between items-center">
                    {/* Linha de Fundo */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10" />
                    {/* Linha de Progresso (Colorida) */}
                    <div 
                        className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 transition-all duration-500" 
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} 
                    />

                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx <= currentStep;
                        const isCurrent = idx === currentStep;
                        
                        return (
                            <div key={idx} className="flex flex-col items-center gap-2 bg-background px-2">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                                    ${isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-background border-muted text-muted-foreground'}
                                    ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                                `}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className={`text-[10px] md:text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />
            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Minha Conta</h1>
                        <p className="text-muted-foreground">Bem-vindo de volta, {profile?.name}</p>
                    </div>
                    <Button variant="outline" onClick={logout} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <LogOut className="mr-2 h-4 w-4" /> Sair
                    </Button>
                </div>

                <Tabs defaultValue="orders" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="orders">Meus Pedidos</TabsTrigger>
                        <TabsTrigger value="favorites">Favoritos</TabsTrigger>
                        <TabsTrigger value="account">Endereços & Dados</TabsTrigger>
                    </TabsList>

                    {/* ABA PEDIDOS */}
                    <TabsContent value="orders" className="space-y-6">
                        {loadingOrders ? <Loader2 className="mx-auto animate-spin" /> : 
                        !orders || orders.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-dashed">
                                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold">Nenhum pedido ainda</h3>
                                <Button asChild variant="link" className="mt-2"><Link to="/">Começar a comprar</Link></Button>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {orders.map(order => (
                                    <Card key={order.id} className="overflow-hidden border-l-4 border-l-primary">
                                        <CardHeader className="bg-muted/30 pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">Pedido #{order.id.substring(0, 8).toUpperCase()}</CardTitle>
                                                    <CardDescription>{format(new Date(order.created_at), "PPP 'às' HH:mm", { locale: ptBR })}</CardDescription>
                                                </div>
                                                <Badge variant="outline" className="capitalize">{order.status === 'completed' ? 'Concluído' : order.status === 'cancelled' ? 'Cancelado' : 'Em Andamento'}</Badge>
                                            </div>
                                            
                                            {/* RASTREADOR VISUAL */}
                                            <OrderTracker status={order.status} />
                                            
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {(order.items as any[]).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="font-medium">{item.quantity}x {item.name}</span>
                                                        <span>{formatCurrency(item.price * item.quantity)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center border-t pt-4 font-bold text-lg">
                                                    <span>Total</span>
                                                    <span className="text-primary">{formatCurrency(order.total_price)}</span>
                                                </div>
                                                
                                                {/* Se tiver delivery */}
                                                {order.delivery_type === 'delivery' && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-700 dark:text-blue-300 flex gap-2 items-start">
                                                        <Truck className="h-4 w-4 mt-0.5" />
                                                        <div>
                                                            <strong>Entrega em:</strong><br/>
                                                            {order.Stores?.name ? `Saindo de: ${order.Stores.name}` : "Centro de Distribuição"}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        
                        {/* ÁREA DE GARANTIAS */}
                        {warranties && warranties.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-green-600" /> Minhas Garantias</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {warranties.map(warranty => (
                                        <Card key={warranty.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{warranty.product_model}</CardTitle>
                                                <CardDescription>S/N: {warranty.serial_number}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Válido até: {format(new Date(warranty.warranty_end_date), "dd/MM/yyyy")}
                                                </p>
                                                <Button variant="outline" size="sm" onClick={() => generateWarrantyPDF(warranty, warranty.Stores || { name: "BV Celular" } as any, profile!)}>
                                                    Baixar Certificado PDF
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* ABA FAVORITOS */}
                    <TabsContent value="favorites">
                         {loadingFavs ? <Loader2 className="mx-auto animate-spin" /> : 
                            !favorites || favorites.length === 0 ? <p className="text-center text-muted-foreground py-8">Sua lista de desejos está vazia.</p> :
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favorites.map(product => <ProductCard key={product.id} product={product} />)}
                            </div>
                         }
                    </TabsContent>

                    {/* ABA DADOS */}
                    <TabsContent value="account" className="space-y-8">
                        <Card>
                            <CardHeader><CardTitle>Meus Endereços</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {loadingAddr ? <Loader2 className="animate-spin" /> : 
                                    !addresses || addresses.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum endereço salvo.</p> :
                                    addresses.map(addr => (
                                        <div key={addr.id} className="flex justify-between items-center border p-3 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="font-medium">{addr.name}</p>
                                                    <p className="text-sm text-muted-foreground">{addr.street}, {addr.number} - {addr.neighborhood}</p>
                                                    <p className="text-xs text-muted-foreground">{addr.city} - {addr.state}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAddrMutation.mutate(addr.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))
                                }
                                {/* O cliente pode adicionar endereço direto no carrinho, então aqui é só visualização/delete */}
                                <p className="text-xs text-muted-foreground pt-2">Para adicionar novos endereços, simule uma compra.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
            <Footer />
        </div>
    );
};

export default MinhaConta;