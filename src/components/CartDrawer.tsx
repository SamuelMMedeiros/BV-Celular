/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import {
    ShoppingCart,
    ArrowLeft,
    Store as StoreIcon,
    User,
    Loader2,
    Minus,
    Plus,
    X,
    Ticket,
    Trash2,
    Truck,
    CreditCard,
    Building2,
    ShieldCheck,
    Gift
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
import { fetchStores, createOrder, upsertClient, createCouponUsage, fetchClientAddresses, sendOrderEmail } from "@/lib/api";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"; // Certifique-se que este componente existe, senão use HTML simples
import { Store, Address } from "@/types";
import { StripeCheckout } from "./StripeCheckout";
import { Separator } from "@/components/ui/separator";

export const CartDrawer = () => {
    const {
        cartItems,
        itemCount,
        totalPrice,
        subtotal,
        discountAmount,
        coupon,
        applyCoupon,
        removeCoupon,
        removeFromCart,
        updateQuantity,
        clearCart,
        shippingQuote,
        calculateShipping,
        clearShipping
    } = useCart();
    
    const { isLoggedIn, profile, isWholesale, wholesaleProfile } = useCustomerAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    
    const couponInputRef = useRef<HTMLInputElement>(null);
    const [couponInput, setCouponInput] = useState("");

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [step, setStep] = useState<"cart" | "stores" | "auth" | "checkout">("cart");
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isCalculatingFreight, setIsCalculatingFreight] = useState(false);

    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | "cash">("credit_card");
    const [changeFor, setChangeFor] = useState<string>("");
    const [paymentMode, setPaymentMode] = useState<"whatsapp" | "stripe">("whatsapp");

    if (location.pathname.startsWith('/admin')) return null;

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["allStores"],
        queryFn: fetchStores,
        enabled: isSheetOpen,
    });

    const { data: addresses, isLoading: isLoadingAddresses } = useQuery<Address[]>({
        queryKey: ["checkoutAddresses", profile?.id],
        queryFn: () => fetchClientAddresses(profile!.id),
        enabled: isSheetOpen && step === "checkout" && isLoggedIn && !!profile?.id && !isWholesale,
    });

    useEffect(() => {
        if (isWholesale && wholesaleProfile?.store_id) {
            if (selectedStoreId !== wholesaleProfile.store_id) {
                setSelectedStoreId(wholesaleProfile.store_id);
            }
        }
    }, [isWholesale, wholesaleProfile, selectedStoreId]);

    // --- LÓGICA DE FRETE E PROGRESS BAR ---
    const normalize = (str: string | undefined | null) => 
        str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

    const selectedStore = stores?.find(s => s.id === selectedStoreId);
    const selectedAddress = addresses?.find(a => a.id === selectedAddressId);
    const isSameCity = selectedStore && selectedAddress && 
                       normalize(selectedStore.city) === normalize(selectedAddress.city);

    // Lógica da Barra de Progresso de Frete Grátis
    const freeShippingThreshold = (selectedStore?.free_shipping_min_value || 0) * 100;
    const progressPercentage = freeShippingThreshold > 0 ? Math.min(100, (subtotal / freeShippingThreshold) * 100) : 0;
    const remainingForFreeShipping = freeShippingThreshold - subtotal;

    let deliveryCost = 0;
    if (deliveryType === "delivery") {
        if (isSameCity && selectedStore) {
            const fixedFee = (selectedStore.delivery_fixed_fee || 0) * 100;
            if (remainingForFreeShipping <= 0 && freeShippingThreshold > 0) {
                deliveryCost = 0;
            } else {
                deliveryCost = fixedFee;
            }
        } else if (shippingQuote) {
            deliveryCost = shippingQuote.price;
        }
    }

    const finalTotal = Math.max(0, (subtotal - discountAmount) + deliveryCost);

    // --- HANDLERS ---
    const handleAddressChange = (addrId: string) => {
        setSelectedAddressId(addrId);
        const addr = addresses?.find(a => a.id === addrId);
        if (addr) handleCalculateFreight(addr.cep);
    };

    const handleCalculateFreight = async (cep: string) => {
        if (!cep) return;
        setIsCalculatingFreight(true);
        await calculateShipping(cep);
        setIsCalculatingFreight(false);
    };

    const handleApplyCoupon = async () => {
        if (!couponInput) return;
        setIsApplyingCoupon(true);
        const success = await applyCoupon(couponInput);
        setIsApplyingCoupon(false);
        if (success) {
            toast({ title: "Cupom aplicado!", description: `Desconto ativado.` });
            setCouponInput("");
        } 
    };

    const handleSelectStore = (storeId: string) => {
        setSelectedStoreId(storeId);
    };

    const handleFinishOrder = async (paidOnline = false, paymentId?: string) => {
        if (deliveryType === "pickup" && !selectedStoreId) {
            toast({ variant: "destructive", title: "Atenção", description: "Selecione a loja." });
            return;
        }
        if (deliveryType === "delivery" && !selectedAddressId && !isWholesale) {
            toast({ variant: "destructive", title: "Atenção", description: "Selecione o endereço." });
            return;
        }
        if (!selectedStoreId) {
             toast({ variant: "destructive", title: "Atenção", description: "Selecione a loja de origem." });
             return;
        }

        if (isLoggedIn && (profile || wholesaleProfile)) {
            setIsSavingOrder(true);
            try {
                if (!isWholesale && profile) {
                    await upsertClient({
                        id: profile.id,
                        name: profile.name,
                        phone: profile.phone,
                        email: profile.email
                    });
                }

                const orderItems = cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: item.category,
                    variantName: item.variantName
                }));

                const employeeRef = localStorage.getItem("bv_employee_ref") || null;
                const clientId = isWholesale ? wholesaleProfile!.id : profile!.id;

                const newOrder = await createOrder({
                    client_id: clientId,
                    store_id: selectedStoreId,
                    total_price: finalTotal,
                    items: orderItems,
                    employee_id: employeeRef,
                    delivery_type: deliveryType,
                    address_id: deliveryType === "delivery" ? selectedAddressId : null,
                    delivery_fee: deliveryCost,
                    payment_method: paidOnline ? 'credit_card_online' : paymentMethod,
                    change_for: changeFor ? parseFloat(changeFor.replace(",", ".")) * 100 : undefined,
                    status: paidOnline ? 'completed' : 'pending',
                    stripe_payment_id: paymentId || null
                });

                if (coupon && !isWholesale) await createCouponUsage(clientId, coupon.id);

                const clientName = isWholesale ? wholesaleProfile?.company_name : profile?.name;
                const clientEmail = isWholesale ? wholesaleProfile?.email : profile?.email;
                
                if (clientEmail && clientName) {
                    sendOrderEmail(clientEmail, clientName, newOrder.id, formatCurrency(finalTotal), orderItems);
                }

                if (!paidOnline) {
                    const itemsText = cartItems.map(item => `• ${item.quantity}x ${item.name} ${item.variantName ? `(${item.variantName})` : ''}`).join('%0A');
                    let msg = `👋 *Olá, ${selectedStore?.name}!*`;
                    msg += `%0A%0ASou *${clientName}* ${isWholesale ? '(Atacado)' : ''} e acabei de fazer o pedido no site.`;
                    msg += `%0A🆔 *Pedido:* #${newOrder.id.substring(0, 8).toUpperCase()}`;
                    msg += `%0A%0A🛒 *ITENS DO PEDIDO:*`;
                    msg += `%0A${itemsText}`;

                    msg += `%0A%0A📦 *ENTREGA:*`;
                    if (deliveryType === "pickup") {
                        msg += `%0A🏬 *Vou retirar na Loja*`;
                    } else if (selectedAddress) {
                        msg += `%0A🚚 *Entregar em:*`;
                        msg += `%0A${selectedAddress.street}, ${selectedAddress.number}`;
                        msg += `%0A${selectedAddress.neighborhood} - ${selectedAddress.city}/${selectedAddress.state}`;
                        if (selectedAddress.complement) msg += `%0A(Comp: ${selectedAddress.complement})`;
                    }

                    msg += `%0A%0A💰 *PAGAMENTO:*`;
                    if (paymentMethod === 'credit_card') {
                        msg += `%0A💳 Cartão (Levar maquininha)`;
                    } else if (paymentMethod === 'pix') {
                        msg += `%0A💠 PIX`;
                        msg += `%0A_Por favor, me envie a chave PIX para pagamento._`;
                    } else {
                        msg += `%0A💵 Dinheiro`;
                        if (changeFor) msg += `%0A⚠️ *Troco para:* ${changeFor}`;
                        else msg += `%0A_Sem troco_`;
                    }

                    msg += `%0A%0A📝 *RESUMO FINANCEIRO:*`;
                    msg += `%0ASubtotal: ${formatCurrency(subtotal)}`;
                    if (discountAmount > 0) msg += `%0A🏷️ Desconto: -${formatCurrency(discountAmount)}`;
                    
                    if (deliveryType === "delivery") {
                         if (deliveryCost > 0) msg += `%0A🚚 Frete: ${formatCurrency(deliveryCost)}`;
                         else msg += `%0A🚚 Frete: GRÁTIS`;
                    }
                    
                    msg += `%0A%0A🔥 *TOTAL FINAL: ${formatCurrency(finalTotal)}*`;
                    msg += `%0A%0AAguardando confirmação!`;

                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${selectedStore?.whatsapp.replace(/\D/g, '')}&text=${msg}`;
                    window.open(whatsappUrl, '_blank');
                } else {
                    toast({ title: "Pedido Confirmado!", description: `Pedido #${newOrder.id.substring(0, 8)} recebido.` });
                }

                clearCart();
                setIsSheetOpen(false);
                setStep("cart");
                navigate(`/success?orderId=${newOrder.id}`);

            } catch (error: any) {
                console.error(error);
                toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o pedido." });
            } finally {
                setIsSavingOrder(false);
            }
        }
    };

    const handleProceed = () => {
        if (itemCount === 0) return;
        if (!isLoggedIn) setStep("auth");
        else setStep("stores");
    };

    // RENDERIZAÇÃO
    const renderCartItems = () => (
        <ScrollArea className="flex-1 -mx-6 px-6">
            {itemCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground opacity-60">
                    <ShoppingCart className="h-12 w-12 mb-4" />
                    <p>Seu carrinho está vazio.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4 py-4">
                    {cartItems.map((item) => (
                        <div key={`${item.id}-${item.variantId || 'base'}`} className="flex flex-col gap-3 border-b pb-4 last:border-0">
                            {/* Cabeçalho do Item */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="relative h-16 w-16 rounded-md border overflow-hidden flex-shrink-0 bg-white">
                                    <img src={item.images[0] || "/placeholder.svg"} alt={item.name} className="h-full w-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm leading-tight break-words">{item.name}</p>
                                    {item.variantName && (
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                                            {item.variantName}
                                        </span>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive -mt-1 -mr-1" onClick={() => removeFromCart(item.id, item.variantId)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            {/* Controles de Preço e Qtd */}
                            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md">
                               <p className="text-sm font-bold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                               <div className="flex items-center gap-3 bg-background rounded border px-1 h-7">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)} className="text-muted-foreground hover:text-primary p-1"><Minus className="h-3 w-3" /></button>
                                    <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)} className="text-muted-foreground hover:text-primary p-1"><Plus className="h-3 w-3" /></button>
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
                    {itemCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-white shadow-sm">{itemCount}</span>}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col w-full sm:max-w-md overflow-y-auto h-full">
                <SheetHeader className="pb-2 border-b">
                    {(step !== "cart") && (
                        <Button variant="ghost" size="sm" onClick={() => setStep("cart")} className="absolute top-3 left-4 px-2"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>
                    )}
                    <SheetTitle className="text-center">{step === "cart" ? `Carrinho (${itemCount})` : "Finalizar Pedido"}</SheetTitle>
                    <SheetDescription className="sr-only">Resumo do carrinho</SheetDescription>
                </SheetHeader>

                {/* --- BARRA DE PROGRESSO FRETE GRÁTIS (GAMIFICAÇÃO) --- */}
                {step === "cart" && !isWholesale && selectedStore && freeShippingThreshold > 0 && (
                    <div className="px-6 pt-4 pb-2 bg-green-50/50 dark:bg-green-950/10">
                        {remainingForFreeShipping > 0 ? (
                            <div className="space-y-1">
                                <p className="text-xs text-center text-green-700 dark:text-green-400 font-medium">
                                    Faltam <strong>{formatCurrency(remainingForFreeShipping)}</strong> para <span className="uppercase font-bold">Frete Grátis</span>! <Truck className="inline h-3 w-3 ml-1"/>
                                </p>
                                <Progress value={progressPercentage} className="h-1.5 bg-green-200" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 py-1.5 rounded-md animate-in zoom-in">
                                <Gift className="h-3 w-3" /> PARABÉNS! VOCÊ GANHOU FRETE GRÁTIS!
                            </div>
                        )}
                    </div>
                )}

                {step === "cart" && renderCartItems()}
                
                {step === "auth" && (
                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                        <User className="h-10 w-10 mx-auto text-primary" />
                        <SheetTitle>Quase lá!</SheetTitle>
                        <SheetDescription>Entre para finalizar sua compra e acumular pontos.</SheetDescription>
                        <Button size="lg" className="w-full" onClick={() => { navigate("/login", { state: { from: location } }); setIsSheetOpen(false); setStep("cart"); }}>Fazer Login / Cadastro</Button>
                    </div>
                )}
                
                {step === "stores" && (
                    <div className="flex-1 flex flex-col gap-6 py-4 px-2">
                        {isWholesale ? (
                            <div className="text-center space-y-4 border p-6 rounded-lg bg-muted/30">
                                <Building2 className="h-10 w-10 text-primary mx-auto" />
                                <div>
                                    <h3 className="text-lg font-bold">Pedido B2B</h3>
                                    <p className="text-sm text-muted-foreground">Sua conta está vinculada à:</p>
                                    <p className="text-foreground font-semibold mt-1">{stores?.find(s => s.id === selectedStoreId)?.name}</p>
                                </div>
                                <Button className="w-full" onClick={() => setStep("checkout")}>Continuar</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-center pb-4">
                                    <StoreIcon className="h-10 w-10 text-primary mx-auto mb-2" />
                                    <h3 className="font-semibold">Escolha a Loja</h3>
                                    <p className="text-sm text-muted-foreground">Selecione a unidade mais próxima de você.</p>
                                </div>
                                {isLoadingStores ? <Loader2 className="animate-spin mx-auto" /> : 
                                    <div className="space-y-3">
                                        <Label>Lojas Disponíveis</Label>
                                        <Select onValueChange={(val) => { handleSelectStore(val); setStep("checkout"); }}>
                                            <SelectTrigger className="h-12"><SelectValue placeholder="Selecione a loja..." /></SelectTrigger>
                                            <SelectContent>
                                                {stores?.map(s => (
                                                    <SelectItem key={s.id} value={s.id} className="py-3">
                                                        <span className="font-medium">{s.name}</span>
                                                        <span className="block text-xs text-muted-foreground">{s.city}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                }
                            </div>
                        )}
                    </div>
                )}

                {step === "checkout" && (
                    <div className="flex-1 flex flex-col gap-6 py-4 px-1">
                        {/* 1. ESCOLHA DE ENTREGA */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Como deseja receber?</Label>
                            <RadioGroup value={deliveryType} onValueChange={(v: any) => { setDeliveryType(v); if(v === 'pickup') clearShipping(); }} className="grid grid-cols-2 gap-3">
                                <div>
                                    <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                                    <Label htmlFor="pickup" className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                                        <StoreIcon className="h-5 w-5" /> <span className="text-sm font-medium">Retirar na Loja</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                                    <Label htmlFor="delivery" className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                                        <Truck className="h-5 w-5" /> <span className="text-sm font-medium">Entrega</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {deliveryType === "delivery" && !isWholesale && (
                            <div className="space-y-3 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Endereço</Label>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => { navigate("/minha-conta"); setIsSheetOpen(false); }}>+ Novo Endereço</Button>
                                </div>
                                {isLoadingAddresses ? <Loader2 className="animate-spin mx-auto" /> : 
                                    (!addresses || addresses.length === 0) ? 
                                    <div className="text-sm text-muted-foreground border border-dashed p-4 rounded-md text-center bg-muted/30">Você não tem endereços cadastrados.</div> :
                                    <RadioGroup value={selectedAddressId} onValueChange={handleAddressChange} className="space-y-2">
                                        {addresses.map(addr => (
                                            <div key={addr.id} className="flex items-start space-x-3 border p-3 rounded-lg hover:bg-accent/50 transition-colors">
                                                <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                                                <Label htmlFor={addr.id} className="cursor-pointer w-full">
                                                    <span className="text-sm font-bold block">{addr.name}</span>
                                                    <span className="text-xs text-muted-foreground block">{addr.street}, {addr.number} - {addr.neighborhood}</span>
                                                    <span className="text-xs text-muted-foreground block">{addr.city}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                }
                            </div>
                        )}

                        {/* 2. ESCOLHA DE PAGAMENTO */}
                        {!isWholesale && (
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Pagamento</Label>
                                <RadioGroup value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)} className="grid grid-cols-1 gap-2">
                                    <div className="relative">
                                        <RadioGroupItem value="whatsapp" id="pm_wa" className="peer sr-only" />
                                        <Label htmlFor="pm_wa" className="flex items-center gap-4 p-3 rounded-lg border-2 border-muted bg-background peer-data-[state=checked]:border-primary cursor-pointer hover:bg-accent">
                                            <div className="bg-green-100 p-2 rounded-full text-green-600"><ShoppingCart className="h-5 w-5" /></div>
                                            <div className="flex-1">
                                                <span className="block font-semibold text-sm">Pagar na Entrega / Retirada</span>
                                                <span className="block text-xs text-muted-foreground">Dinheiro, Pix ou Maquininha (via Zap)</span>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <RadioGroupItem value="stripe" id="pm_stripe" className="peer sr-only" />
                                        <Label htmlFor="pm_stripe" className="flex items-center gap-4 p-3 rounded-lg border-2 border-muted bg-background peer-data-[state=checked]:border-primary cursor-pointer hover:bg-accent">
                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><CreditCard className="h-5 w-5" /></div>
                                            <div className="flex-1">
                                                <span className="block font-semibold text-sm">Pagar Agora (Online)</span>
                                                <span className="block text-xs text-muted-foreground">Cartão de Crédito ou Pix Instantâneo</span>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {/* Sub-opções para WhatsApp */}
                                {paymentMode === 'whatsapp' && (
                                    <div className="pl-2 border-l-2 border-muted ml-4 mt-2 space-y-2 animate-in slide-in-from-left-2">
                                        <Select onValueChange={(v: any) => setPaymentMethod(v)} defaultValue="credit_card">
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="credit_card">Levarei a Maquininha</SelectItem>
                                                <SelectItem value="pix">Quero a chave Pix</SelectItem>
                                                <SelectItem value="cash">Dinheiro em Espécie</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {paymentMethod === 'cash' && <Input placeholder="Precisa de troco para quanto?" onChange={(e) => setChangeFor(e.target.value)} />}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STRIPE RENDER */}
                        {paymentMode === 'stripe' && !isWholesale && selectedStore && selectedStore.stripe_enabled && selectedStore.stripe_public_key && (
                            <div className="border-t pt-4">
                                <StripeCheckout amount={finalTotal} storeId={selectedStoreId} storePublicKey={selectedStore.stripe_public_key} onCancel={() => setPaymentMode('whatsapp')} onSuccess={(pid) => handleFinishOrder(true, pid)} />
                            </div>
                        )}
                         {paymentMode === 'stripe' && selectedStore && !selectedStore.stripe_enabled && <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs text-center">Pagamento online indisponível nesta loja no momento.</div>}
                    </div>
                )}

                <SheetFooter className="bg-background border-t p-6 flex flex-col gap-4 mt-auto shadow-2xl z-20">
                    {step === "cart" ? (
                        itemCount > 0 ? (
                            <>
                                {/* LINHA 1: VALORES */}
                                <div className="w-full space-y-1.5">
                                    <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                    {discountAmount > 0 && <div className="flex justify-between text-sm text-green-600 font-medium"><span>Desconto</span><span>-{formatCurrency(discountAmount)}</span></div>}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-end"><span className="text-base font-semibold">Total</span><span className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</span></div>
                                </div>

                                {/* LINHA 2: CUPOM */}
                                {!isWholesale && (
                                    <div className="w-full flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input ref={couponInputRef} value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Cupom de desconto" className="pl-9 h-10" disabled={!!coupon} />
                                        </div>
                                        {coupon ? (
                                            <Button variant="ghost" size="icon" onClick={removeCoupon} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-5 w-5" /></Button>
                                        ) : (
                                            <Button variant="secondary" onClick={handleApplyCoupon} disabled={isApplyingCoupon} className="h-10 px-4">{isApplyingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : "Aplicar"}</Button>
                                        )}
                                    </div>
                                )}

                                {/* LINHA 3: AÇÕES */}
                                <div className="w-full grid grid-cols-2 gap-3 pt-2">
                                    <Button variant="outline" onClick={clearCart} className="text-muted-foreground border-dashed hover:border-destructive hover:text-destructive h-12">Esvaziar</Button>
                                    <Button size="lg" className="font-bold h-12 text-base shadow-md" onClick={handleProceed}>Finalizar Compra</Button>
                                </div>
                                
                                <div className="flex justify-center gap-2 text-[10px] text-muted-foreground opacity-70 mt-1">
                                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Compra 100% Segura</span>
                                </div>
                            </>
                        ) : (<SheetClose asChild><Button variant="outline" className="w-full h-12">Continuar comprando</Button></SheetClose>)
                    ) : step === "checkout" && (paymentMode === 'whatsapp' || isWholesale) && (
                         <div className="w-full space-y-4">
                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl space-y-2">
                                {deliveryType === "delivery" && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Frete {isSameCity ? "(Local)" : "(Envio)"}:</span>
                                        <span>{deliveryCost === 0 ? "GRÁTIS" : formatCurrency(deliveryCost)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-dashed border-primary/20">
                                    <span className="font-semibold">Total a Pagar:</span>
                                    <span className="text-2xl font-bold text-primary">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>
                            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg font-bold shadow-lg transition-transform active:scale-95" onClick={() => handleFinishOrder(false)} disabled={isSavingOrder}>
                                {isSavingOrder ? <Loader2 className="animate-spin mr-2" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                                Enviar Pedido
                            </Button>
                         </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};