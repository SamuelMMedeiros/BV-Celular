/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useRef } from "react";
import {
    ShoppingCart,
    ArrowLeft,
    Store as StoreIcon,
    User,
    Loader2,
    AlertTriangle,
    Minus,
    Plus,
    X,
    Ticket,
    Trash2,
    Truck,
    MapPin,
    CreditCard,
    Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { fetchStores, createOrder, upsertClient, createCouponUsage, fetchClientAddresses } from "@/lib/api";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useCart } from "@/contexts/CartContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Store, Address } from "@/types";
import { Separator } from "@radix-ui/react-select";

export const CartDrawer = () => {
    const {
        cartItems,
        itemCount,
        totalPrice, // Preço dos produtos com desconto do cupom
        subtotal,
        discountAmount,
        coupon,
        applyCoupon,
        removeCoupon,
        removeFromCart,
        updateQuantity,
        clearCart,
    } = useCart();
    
    const { isLoggedIn, profile } = useCustomerAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const couponInputRef = useRef<HTMLInputElement>(null);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [step, setStep] = useState<"cart" | "auth" | "checkout">("cart");
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    // Estados do Checkout
    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | "cash">("credit_card");
    const [changeFor, setChangeFor] = useState<string>("");

    if (location.pathname.startsWith('/admin')) return null;

    // Queries
    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["allStores"],
        queryFn: fetchStores,
        enabled: isSheetOpen && step === "checkout",
    });

    const { data: addresses, isLoading: isLoadingAddresses } = useQuery<Address[]>({
        queryKey: ["checkoutAddresses", profile?.id],
        queryFn: () => fetchClientAddresses(profile!.id),
        enabled: isSheetOpen && step === "checkout" && isLoggedIn && !!profile?.id,
    });

    // Cálculos Finais
    const selectedStore = stores?.find(s => s.id === selectedStoreId);
    const deliveryFee = (deliveryType === "delivery" && selectedStore) ? (selectedStore.delivery_fixed_fee || 0) * 100 : 0; // Em centavos
    // Regra de Frete Grátis (se existir)
    const finalDeliveryFee = (selectedStore?.free_shipping_min_value && subtotal >= selectedStore.free_shipping_min_value * 100) ? 0 : deliveryFee;
    
    const finalTotal = totalPrice + finalDeliveryFee;

    const handleApplyCoupon = async () => {
        const code = couponInputRef.current?.value;
        if (!code) return;
        setIsApplyingCoupon(true);
        const success = await applyCoupon(code);
        setIsApplyingCoupon(false);
        if (success) {
            toast({ title: "Cupom aplicado!", description: `Desconto de ${code} ativado.` });
            if (couponInputRef.current) couponInputRef.current.value = "";
        } 
    };

    const handleFinishOrder = async () => {
        if (deliveryType === "pickup" && !selectedStoreId) {
            toast({ variant: "destructive", title: "Selecione uma loja", description: "Escolha onde retirar o produto." });
            return;
        }
        if (deliveryType === "delivery" && !selectedAddressId) {
            toast({ variant: "destructive", title: "Selecione um endereço", description: "Escolha onde entregar o produto." });
            return;
        }
        if (deliveryType === "delivery" && !selectedStoreId) {
             toast({ variant: "destructive", title: "Selecione a loja de origem", description: "Escolha de qual loja o pedido sairá." });
             return;
        }

        // Dados Finais
        const store = stores?.find(s => s.id === selectedStoreId);
        const address = addresses?.find(a => a.id === selectedAddressId);

        if (isLoggedIn && profile) {
            setIsSavingOrder(true);
            try {
                await upsertClient({
                    id: profile.id,
                    name: profile.name,
                    phone: profile.phone,
                    email: profile.email
                });

                const orderItems = cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: item.category,
                }));

                const employeeRef = localStorage.getItem("bv_employee_ref") || null;

                const newOrder = await createOrder({
                    client_id: profile.id,
                    store_id: selectedStoreId,
                    total_price: finalTotal,
                    items: orderItems,
                    employee_id: employeeRef,
                    delivery_type: deliveryType,
                    address_id: deliveryType === "delivery" ? selectedAddressId : null,
                    delivery_fee: finalDeliveryFee,
                    payment_method: paymentMethod,
                    change_for: changeFor ? parseFloat(changeFor) * 100 : undefined // Centavos
                });

                if (coupon) await createCouponUsage(profile.id, coupon.id);

                // Enviar WhatsApp
                const itemsText = cartItems.map(item => `${item.quantity}x ${item.name}`).join('%0A');
                let msg = `Olá, *${store?.name}*!%0A%0AEu sou *${profile.name}* e gostaria de fazer um pedido (Ref: ${newOrder.id.substring(0, 8)}):%0A%0A`;
                msg += itemsText + '%0A%0A';
                
                if (deliveryType === "pickup") {
                    msg += `📍 *Vou Retirar na Loja*`;
                } else {
                    msg += `🚚 *Entrega* para:%0A${address?.street}, ${address?.number} - ${address?.neighborhood}%0A(${address?.city})%0A`;
                    if (address?.complement) msg += `Comp: ${address.complement}%0A`;
                }

                msg += `%0A💳 Pagamento: ${paymentMethod === 'credit_card' ? 'Cartão' : paymentMethod === 'pix' ? 'Pix' : 'Dinheiro'}`;
                if (paymentMethod === 'cash' && changeFor) msg += ` (Troco para ${changeFor})`;

                msg += `%0A%0A*Total Final: ${formatCurrency(finalTotal)}*`;

                const whatsappUrl = `https://api.whatsapp.com/send?phone=${store?.whatsapp.replace(/\D/g, '')}&text=${msg}`;
                window.open(whatsappUrl, '_blank');

                toast({ title: "Pedido realizado!", description: "Acompanhe em 'Meus Pedidos'." });
                clearCart();
                setIsSheetOpen(false);
                setStep("cart");

            } catch (error: any) {
                console.error("Falha ao salvar pedido:", error);
                toast({ variant: "destructive", title: "Erro no pedido", description: "Tente novamente." });
            } finally {
                setIsSavingOrder(false);
            }
        }
    };

    const handleProceed = () => {
        if (itemCount === 0) return;
        if (!isLoggedIn) setStep("auth");
        else setStep("checkout");
    };

    const renderCartItems = () => (
        <ScrollArea className="flex-1 -mx-6 px-6">
            {itemCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">O carrinho está vazio.</div>
            ) : (
                <div className="flex flex-col gap-4 py-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex flex-col gap-3 border-b pb-4 last:border-0">
                            <div className="flex items-start justify-between gap-3">
                                <img src={item.images[0] || "/placeholder.svg"} alt={item.name} className="h-16 w-16 rounded-md object-cover border" />
                                <p className="flex-1 font-medium leading-tight break-words min-w-0">{item.name}</p>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground flex-shrink-0" onClick={() => removeFromCart(item.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                               <p className="text-lg text-primary font-bold">{formatCurrency(item.price * item.quantity)}</p>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                              </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
    );

    return (
        <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setStep("cart"); }}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-white">{itemCount}</span>}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    {(step !== "cart") && (
                        <Button variant="ghost" size="sm" onClick={() => setStep("cart")} className="absolute top-3 left-4"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                    )}
                    <SheetTitle>{step === "cart" ? `Meu Carrinho (${itemCount})` : "Finalizar Pedido"}</SheetTitle>
                </SheetHeader>

                {step === "cart" && renderCartItems()}
                
                {step === "auth" && (
                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                        <User className="h-10 w-10 mx-auto text-primary" />
                        <SheetTitle>Quase lá!</SheetTitle>
                        <SheetDescription>Entre para finalizar sua compra.</SheetDescription>
                        <Button size="lg" className="w-full" onClick={() => { navigate("/login", { state: { from: location } }); setIsSheetOpen(false); setStep("cart"); }}>Fazer Login ou Cadastro</Button>
                    </div>
                )}
                
                {step === "checkout" && (
                    <div className="flex-1 flex flex-col gap-6 py-4">
                        {/* 1. TIPO DE ENTREGA */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Como deseja receber?</Label>
                            <RadioGroup value={deliveryType} onValueChange={(v: "pickup" | "delivery") => setDeliveryType(v)} className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                                    <Label htmlFor="pickup" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <StoreIcon className="mb-2 h-6 w-6" /> Retirada
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                                    <Label htmlFor="delivery" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <Truck className="mb-2 h-6 w-6" /> Entrega
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* 2. LOJA (Origem) */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Loja Responsável</Label>
                            {isLoadingStores ? <Loader2 className="animate-spin" /> : 
                                <Select onValueChange={setSelectedStoreId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                                    <SelectContent>{stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.city})</SelectItem>)}</SelectContent>
                                </Select>
                            }
                        </div>

                        {/* 3. ENDEREÇO (Se Entrega) */}
                        {deliveryType === "delivery" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold">Endereço de Entrega</Label>
                                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { navigate("/minha-conta"); setIsSheetOpen(false); }}>Gerenciar</Button>
                                </div>
                                {isLoadingAddresses ? <Loader2 className="animate-spin" /> : 
                                    (!addresses || addresses.length === 0) ? 
                                    <div className="text-sm text-muted-foreground border border-dashed p-4 rounded-md text-center">Nenhum endereço cadastrado. <br/><Link to="/minha-conta" className="text-primary underline" onClick={() => setIsSheetOpen(false)}>Cadastrar agora</Link></div> :
                                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                                        {addresses.map(addr => (
                                            <div key={addr.id} className="flex items-start space-x-2 border p-3 rounded-md">
                                                <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                                                <Label htmlFor={addr.id} className="cursor-pointer w-full">
                                                    <span className="font-bold block">{addr.name}</span>
                                                    <span className="text-xs text-muted-foreground block">{addr.street}, {addr.number} - {addr.neighborhood}</span>
                                                    <span className="text-xs text-muted-foreground block">{addr.city}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                }
                            </div>
                        )}

                        {/* 4. PAGAMENTO */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Pagamento</Label>
                            <Select onValueChange={(v: any) => setPaymentMethod(v)} defaultValue="credit_card">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit_card">Cartão de Crédito/Débito</SelectItem>
                                    <SelectItem value="pix">Pix</SelectItem>
                                    <SelectItem value="cash">Dinheiro</SelectItem>
                                </SelectContent>
                            </Select>
                            {paymentMethod === 'cash' && (
                                <div className="mt-2">
                                    <Label className="text-xs">Troco para quanto?</Label>
                                    <Input placeholder="R$ 0,00" onChange={(e) => setChangeFor(e.target.value)} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FOOTER UNIFICADO */}
                 <SheetFooter className="bg-background border-t pt-4 flex-col gap-3 mt-auto">
                    {step === "cart" ? (
                        itemCount > 0 ? (
                            <>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <Ticket className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input ref={couponInputRef} placeholder="Cupom" className="pl-9" disabled={!!coupon} />
                                    </div>
                                    {coupon ? (
                                        <Button variant="destructive" size="icon" onClick={removeCoupon}><Trash2 className="h-4 w-4" /></Button>
                                    ) : (
                                        <Button variant="secondary" onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
                                            {isApplyingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : "Aplicar"}
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {coupon && (
                                        <>
                                            <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                                            <div className="flex justify-between text-sm text-green-600 font-medium"><span>Desconto:</span><span>-{formatCurrency(discountAmount)}</span></div>
                                            <Separator className="my-1" />
                                        </>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-base text-muted-foreground">Total:</span> 
                                        <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
                                    </div>
                                </div>
                                <div className="flex w-full gap-3 pt-2">
                                    <Button variant="ghost" onClick={clearCart} className="text-muted-foreground hover:text-destructive">Limpar</Button>
                                    <Button size="lg" className="w-full" onClick={handleProceed}>Finalizar Compra</Button>
                                </div>
                            </>
                        ) : (
                            <SheetClose asChild><Button variant="outline" className="w-full">Continuar comprando</Button></SheetClose>
                        )
                    ) : step === "checkout" && (
                         <>
                            <div className="space-y-1">
                                {deliveryType === "delivery" && deliveryFee > 0 && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Taxa de Entrega:</span>
                                        <span>{formatCurrency(finalDeliveryFee)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-base text-muted-foreground">Total Final:</span> 
                                    <span className="text-xl font-bold text-primary">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>
                            <Button size="lg" className="w-full" onClick={handleFinishOrder} disabled={isSavingOrder}>
                                {isSavingOrder ? <Loader2 className="animate-spin mr-2" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                                Enviar Pedido no WhatsApp
                            </Button>
                         </>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};