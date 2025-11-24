/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
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
    ShieldCheck, // Ícone de segurança
    Gift, // Ícone de presente
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
import {
    fetchStores,
    createOrder,
    upsertClient,
    createCouponUsage,
    fetchClientAddresses,
    sendOrderEmail,
} from "@/lib/api";
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
import { Progress } from "@/components/ui/progress"; // Certifique-se que este componente existe
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
        clearShipping,
    } = useCart();

    const { isLoggedIn, profile, isWholesale, wholesaleProfile } =
        useCustomerAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const couponInputRef = useRef<HTMLInputElement>(null);
    const [couponInput, setCouponInput] = useState("");

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [step, setStep] = useState<"cart" | "stores" | "auth" | "checkout">(
        "cart"
    );
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isCalculatingFreight, setIsCalculatingFreight] = useState(false);

    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">(
        "pickup"
    );
    const [selectedStoreId, setSelectedStoreId] = useState<string>("");
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<
        "credit_card" | "pix" | "cash"
    >("credit_card");
    const [changeFor, setChangeFor] = useState<string>("");
    const [paymentMode, setPaymentMode] = useState<"whatsapp" | "stripe">(
        "whatsapp"
    );

    if (location.pathname.startsWith("/admin")) return null;

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["allStores"],
        queryFn: fetchStores,
        enabled: isSheetOpen,
    });

    const { data: addresses, isLoading: isLoadingAddresses } = useQuery<
        Address[]
    >({
        queryKey: ["checkoutAddresses", profile?.id],
        queryFn: () => fetchClientAddresses(profile!.id),
        enabled:
            isSheetOpen &&
            step === "checkout" &&
            isLoggedIn &&
            !!profile?.id &&
            !isWholesale,
    });

    useEffect(() => {
        if (isWholesale && wholesaleProfile?.store_id) {
            if (selectedStoreId !== wholesaleProfile.store_id) {
                setSelectedStoreId(wholesaleProfile.store_id);
            }
        }
    }, [isWholesale, wholesaleProfile, selectedStoreId]);

    const normalize = (str: string | undefined | null) =>
        str
            ? str
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .trim()
            : "";

    const selectedStore = stores?.find((s) => s.id === selectedStoreId);
    const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

    const isSameCity =
        selectedStore &&
        selectedAddress &&
        normalize(selectedStore.city) === normalize(selectedAddress.city);

    // --- LÓGICA DE GAMIFICAÇÃO FRETE GRÁTIS ---
    const freeShippingThreshold =
        (selectedStore?.free_shipping_min_value || 0) * 100;
    const progressPercentage =
        freeShippingThreshold > 0
            ? Math.min(100, (subtotal / freeShippingThreshold) * 100)
            : 0;
    const remainingForFreeShipping = freeShippingThreshold - subtotal;

    let deliveryCost = 0;
    if (deliveryType === "delivery") {
        if (isSameCity && selectedStore) {
            const fixedFee = (selectedStore.delivery_fixed_fee || 0) * 100;
            // Se atingiu a meta, zera
            if (
                freeShippingThreshold > 0 &&
                subtotal >= freeShippingThreshold
            ) {
                deliveryCost = 0;
            } else {
                deliveryCost = fixedFee;
            }
        } else if (shippingQuote) {
            deliveryCost = shippingQuote.price;
        }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount + deliveryCost);

    const handleAddressChange = (addrId: string) => {
        setSelectedAddressId(addrId);
        const addr = addresses?.find((a) => a.id === addrId);
        if (addr) {
            handleCalculateFreight(addr.cep);
        }
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
            toast({
                title: "Cupom aplicado!",
                description: `Desconto ativado.`,
            });
            setCouponInput("");
        }
    };

    const handleSelectStore = async (storeId: string) => {
        setSelectedStoreId(storeId);
    };

    const handleFinishOrder = async (
        paidOnline = false,
        paymentId?: string
    ) => {
        if (deliveryType === "pickup" && !selectedStoreId) {
            toast({
                variant: "destructive",
                title: "Atenção",
                description: "Selecione a loja.",
            });
            return;
        }
        if (deliveryType === "delivery" && !selectedAddressId && !isWholesale) {
            toast({
                variant: "destructive",
                title: "Atenção",
                description: "Selecione o endereço.",
            });
            return;
        }
        if (!selectedStoreId) {
            toast({
                variant: "destructive",
                title: "Atenção",
                description: "Selecione a loja de origem.",
            });
            return;
        }

        const store = stores?.find((s) => s.id === selectedStoreId);
        const address = addresses?.find((a) => a.id === selectedAddressId);

        if (isLoggedIn && (profile || wholesaleProfile)) {
            setIsSavingOrder(true);
            try {
                if (!isWholesale && profile) {
                    await upsertClient({
                        id: profile.id,
                        name: profile.name,
                        phone: profile.phone,
                        email: profile.email,
                    });
                }

                const orderItems = cartItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: item.category,
                    variantName: item.variantName,
                }));

                const employeeRef =
                    localStorage.getItem("bv_employee_ref") || null;
                const clientId = isWholesale
                    ? wholesaleProfile!.id
                    : profile!.id;

                const newOrder = await createOrder({
                    client_id: clientId,
                    store_id: selectedStoreId,
                    total_price: finalTotal,
                    items: orderItems,
                    employee_id: employeeRef,
                    delivery_type: deliveryType,
                    address_id:
                        deliveryType === "delivery" ? selectedAddressId : null,
                    delivery_fee: deliveryCost,
                    payment_method: paidOnline
                        ? "credit_card_online"
                        : paymentMethod,
                    change_for: changeFor
                        ? parseFloat(changeFor.replace(",", ".")) * 100
                        : undefined,
                    status: paidOnline ? "completed" : "pending",
                    stripe_payment_id: paymentId || null,
                });

                if (coupon && !isWholesale)
                    await createCouponUsage(clientId, coupon.id);

                const clientName = isWholesale
                    ? wholesaleProfile?.company_name
                    : profile?.name;
                const clientEmail = isWholesale
                    ? wholesaleProfile?.email
                    : profile?.email;

                if (clientEmail && clientName) {
                    sendOrderEmail(
                        clientEmail,
                        clientName,
                        newOrder.id,
                        formatCurrency(finalTotal),
                        orderItems
                    );
                }

                if (!paidOnline) {
                    let msg = `👋 *Olá, ${selectedStore?.name}!*`;
                    msg += `%0A%0ASou *${clientName}* ${
                        isWholesale ? "(Atacado)" : ""
                    } e acabei de fazer o pedido no site.`;
                    msg += `%0A🆔 *Pedido:* #${newOrder.id
                        .substring(0, 6)
                        .toUpperCase()}`;

                    msg += `%0A%0A🛒 *ITENS DO PEDIDO:*`;
                    cartItems.forEach((item) => {
                        msg += `%0A▪️ ${item.quantity}x ${item.name}`;
                        if (item.variantName) msg += ` (${item.variantName})`;
                        msg += ` - ${formatCurrency(item.price)}`;
                    });

                    msg += `%0A%0A📦 *ENTREGA:*`;
                    if (deliveryType === "pickup") {
                        msg += `%0A🏬 *Vou retirar na Loja*`;
                    } else if (selectedAddress) {
                        msg += `%0A🚚 *Entregar em:*`;
                        msg += `%0A${selectedAddress.street}, ${selectedAddress.number}`;
                        msg += `%0A${selectedAddress.neighborhood} - ${selectedAddress.city}/${selectedAddress.state}`;
                        if (selectedAddress.complement)
                            msg += `%0A(Comp: ${selectedAddress.complement})`;
                    }

                    msg += `%0A%0A💰 *PAGAMENTO:*`;
                    if (paymentMethod === "credit_card") {
                        msg += `%0A💳 Cartão (Levar maquininha)`;
                    } else if (paymentMethod === "pix") {
                        msg += `%0A💠 PIX`;
                        msg += `%0A_Por favor, me envie a chave PIX para pagamento._`;
                    } else {
                        msg += `%0A💵 Dinheiro`;
                        if (changeFor)
                            msg += `%0A⚠️ *Troco para:* R$ ${changeFor}`;
                        else msg += `%0A_Sem troco_`;
                    }

                    msg += `%0A%0A📝 *RESUMO FINANCEIRO:*`;
                    msg += `%0ASubtotal: ${formatCurrency(subtotal)}`;
                    if (discountAmount > 0)
                        msg += `%0A🏷️ Desconto: -${formatCurrency(
                            discountAmount
                        )}`;

                    if (deliveryType === "delivery") {
                        if (deliveryCost > 0)
                            msg += `%0A🚚 Frete: ${formatCurrency(
                                deliveryCost
                            )}`;
                        else msg += `%0A🚚 Frete: GRÁTIS`;
                    }

                    msg += `%0A%0A🔥 *TOTAL FINAL: ${formatCurrency(
                        finalTotal
                    )}*`;
                    msg += `%0A%0AAguardando confirmação!`;

                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${store?.whatsapp.replace(
                        /\D/g,
                        ""
                    )}&text=${msg}`;
                    window.open(whatsappUrl, "_blank");
                } else {
                    toast({
                        title: "Pagamento Confirmado! 🎉",
                        description: `Seu pedido #${newOrder.id.substring(
                            0,
                            8
                        )} foi recebido com sucesso.`,
                        duration: 5000,
                        className: "bg-green-600 text-white",
                    });
                }

                clearCart();
                setIsSheetOpen(false);
                setStep("cart");
                navigate(`/success?orderId=${newOrder.id}`);
            } catch (error: any) {
                console.error("Falha ao salvar pedido:", error);
                toast({
                    variant: "destructive",
                    title: "Erro no pedido",
                    description: "Tente novamente.",
                });
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

    // RENDERIZAÇÃO DOS ITENS (DESIGN MAIS CLEAN)
    const renderCartItems = () => (
        <ScrollArea className="flex-1 -mx-6 px-6">
            {itemCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    O carrinho está vazio.
                </div>
            ) : (
                <div className="flex flex-col gap-4 py-4">
                    {cartItems.map((item) => (
                        <div
                            key={`${item.id}-${item.variantId || "base"}`}
                            className="flex flex-col gap-3 border-b pb-4 last:border-0"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <img
                                    src={item.images[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    className="h-16 w-16 rounded-md object-cover border"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium leading-tight break-words">
                                        {item.name}
                                    </p>
                                    {/* DESTAQUE PARA VARIAÇÃO (CLEAN) */}
                                    {item.variantName && (
                                        <span className="text-[10px] font-semibold text-foreground bg-secondary px-2 py-0.5 rounded mt-1 inline-block">
                                            {item.variantName}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground flex-shrink-0"
                                    onClick={() =>
                                        removeFromCart(item.id, item.variantId)
                                    }
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-lg text-primary font-bold">
                                    {formatCurrency(item.price * item.quantity)}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.quantity - 1,
                                                item.variantId
                                            )
                                        }
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium w-4 text-center">
                                        {item.quantity}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() =>
                                            updateQuantity(
                                                item.id,
                                                item.quantity + 1,
                                                item.variantId
                                            )
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
    );

    return (
        <Sheet
            open={isSheetOpen}
            onOpenChange={(open) => {
                setIsSheetOpen(open);
                if (!open) setStep("cart");
            }}
        >
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-white">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="flex flex-col w-full sm:max-w-md overflow-y-auto"
            >
                <SheetHeader>
                    {step !== "cart" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep("cart")}
                            className="absolute top-3 left-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                        </Button>
                    )}
                    <SheetTitle>
                        {step === "cart"
                            ? `Meu Carrinho (${itemCount})`
                            : "Finalizar Pedido"}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        Resumo do carrinho
                    </SheetDescription>
                </SheetHeader>

                {/* BARRA DE PROGRESSO (GAMIFICAÇÃO) - Só aparece se tiver loja selecionada/contexto */}
                {step === "cart" &&
                    !isWholesale &&
                    selectedStore &&
                    freeShippingThreshold > 0 && (
                        <div className="px-6 pt-4 pb-2 bg-secondary/30 rounded-b-lg mb-2">
                            {remainingForFreeShipping > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-center text-muted-foreground font-medium">
                                        Adicione{" "}
                                        <span className="text-primary font-bold">
                                            {formatCurrency(
                                                remainingForFreeShipping
                                            )}
                                        </span>{" "}
                                        para ganhar{" "}
                                        <span className="uppercase font-bold text-green-600">
                                            Frete Grátis
                                        </span>
                                        ! 🚚
                                    </p>
                                    <Progress
                                        value={progressPercentage}
                                        className="h-2 bg-muted"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-600 bg-green-100/50 py-2 rounded-md animate-in zoom-in">
                                    <Gift className="h-4 w-4" /> PARABÉNS! VOCÊ
                                    GANHOU FRETE GRÁTIS!
                                </div>
                            )}
                        </div>
                    )}

                {step === "cart" && renderCartItems()}

                {step === "auth" && (
                    <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
                        <User className="h-10 w-10 mx-auto text-primary" />
                        <SheetTitle>Quase lá!</SheetTitle>
                        <SheetDescription>
                            Entre para finalizar sua compra.
                        </SheetDescription>
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() => {
                                navigate("/login", {
                                    state: { from: location },
                                });
                                setIsSheetOpen(false);
                                setStep("cart");
                            }}
                        >
                            Fazer Login ou Cadastro
                        </Button>
                    </div>
                )}

                {step === "stores" && (
                    <div className="flex-1 flex flex-col gap-6 py-4">
                        {isWholesale ? (
                            <div className="text-center space-y-4 border p-6 rounded-lg bg-muted/30">
                                <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                                    <Building2 className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold">
                                    Pedido de Atacado
                                </h3>
                                <p className="text-muted-foreground">
                                    Saindo de:{" "}
                                    <strong className="text-foreground">
                                        {
                                            stores?.find(
                                                (s) => s.id === selectedStoreId
                                            )?.name
                                        }
                                    </strong>
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => setStep("checkout")}
                                >
                                    Continuar
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 flex-1 flex flex-col justify-center space-y-3">
                                <Label className="text-base font-semibold text-center block">
                                    Selecione a loja de origem:
                                </Label>
                                {isLoadingStores ? (
                                    <Loader2 className="animate-spin mx-auto" />
                                ) : (
                                    <Select
                                        onValueChange={(val) => {
                                            handleSelectStore(val);
                                            setStep("checkout");
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha uma loja" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores?.map((s) => (
                                                <SelectItem
                                                    key={s.id}
                                                    value={s.id}
                                                >
                                                    {s.name} ({s.city})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {step === "checkout" && (
                    <div className="flex-1 flex flex-col gap-6 py-4">
                        {!isWholesale && (
                            <div className="bg-muted/20 p-4 rounded-lg border">
                                <Label className="text-base font-semibold mb-3 block">
                                    Como deseja pagar?
                                </Label>
                                <RadioGroup
                                    value={paymentMode}
                                    onValueChange={(v: any) =>
                                        setPaymentMode(v)
                                    }
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div>
                                        <RadioGroupItem
                                            value="whatsapp"
                                            id="pm_wa"
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor="pm_wa"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary hover:bg-accent"
                                        >
                                            <ShoppingCart className="mb-1 h-5 w-5 text-green-600" />
                                            <span className="text-sm text-center">
                                                Zap / Entrega
                                            </span>
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem
                                            value="stripe"
                                            id="pm_stripe"
                                            className="peer sr-only"
                                        />
                                        <Label
                                            htmlFor="pm_stripe"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary hover:bg-accent"
                                        >
                                            <CreditCard className="mb-1 h-5 w-5 text-blue-600" />
                                            <span className="text-sm text-center">
                                                Online (Card/Pix)
                                            </span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        <div className="space-y-1 border-b pb-4">
                            <Label className="text-sm font-semibold text-muted-foreground">
                                Loja Responsável
                            </Label>
                            <p className="text-lg font-medium">
                                {
                                    stores?.find(
                                        (s) => s.id === selectedStoreId
                                    )?.name
                                }
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-semibold">
                                Recebimento
                            </Label>
                            <RadioGroup
                                value={deliveryType}
                                onValueChange={(v: any) => {
                                    setDeliveryType(v);
                                    if (v === "pickup") clearShipping();
                                }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem
                                        value="pickup"
                                        id="pickup"
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor="pickup"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary"
                                    >
                                        <StoreIcon className="mb-1 h-4 w-4" />{" "}
                                        <span className="text-sm">
                                            Retirada
                                        </span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem
                                        value="delivery"
                                        id="delivery"
                                        className="peer sr-only"
                                    />
                                    <Label
                                        htmlFor="delivery"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary"
                                    >
                                        <Truck className="mb-1 h-4 w-4" />{" "}
                                        <span className="text-sm">Entrega</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {deliveryType === "delivery" && !isWholesale && (
                            <div className="space-y-3 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-semibold">
                                        Endereço de Entrega
                                    </Label>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0"
                                        onClick={() => {
                                            navigate("/minha-conta");
                                            setIsSheetOpen(false);
                                        }}
                                    >
                                        Gerenciar
                                    </Button>
                                </div>
                                {isLoadingAddresses ? (
                                    <Loader2 className="animate-spin" />
                                ) : !addresses || addresses.length === 0 ? (
                                    <div className="text-sm text-muted-foreground border border-dashed p-4 rounded-md text-center">
                                        Nenhum endereço cadastrado.{" "}
                                        <Link
                                            to="/minha-conta"
                                            className="text-primary underline"
                                            onClick={() =>
                                                setIsSheetOpen(false)
                                            }
                                        >
                                            Cadastrar agora
                                        </Link>
                                    </div>
                                ) : (
                                    <RadioGroup
                                        value={selectedAddressId}
                                        onValueChange={handleAddressChange}
                                    >
                                        {addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                className="flex items-start space-x-2 border p-2 rounded-md"
                                            >
                                                <RadioGroupItem
                                                    value={addr.id}
                                                    id={addr.id}
                                                    className="mt-1"
                                                />
                                                <Label
                                                    htmlFor={addr.id}
                                                    className="cursor-pointer w-full text-sm"
                                                >
                                                    <span className="font-bold">
                                                        {addr.name}
                                                    </span>{" "}
                                                    - {addr.street},{" "}
                                                    {addr.number}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            </div>
                        )}

                        {(paymentMode === "whatsapp" || isWholesale) && (
                            <div className="space-y-3 animate-in fade-in">
                                <Label className="text-base font-semibold">
                                    Forma de Pagamento
                                </Label>
                                <Select
                                    onValueChange={(v: any) =>
                                        setPaymentMethod(v)
                                    }
                                    defaultValue="credit_card"
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit_card">
                                            Cartão (Maquininha)
                                        </SelectItem>
                                        <SelectItem value="pix">
                                            Pix (Chave no WhatsApp)
                                        </SelectItem>
                                        <SelectItem value="cash">
                                            Dinheiro
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {paymentMethod === "cash" && (
                                    <Input
                                        placeholder="Troco para quanto?"
                                        className="mt-2"
                                        onChange={(e) =>
                                            setChangeFor(e.target.value)
                                        }
                                    />
                                )}
                            </div>
                        )}

                        {paymentMode === "stripe" &&
                            !isWholesale &&
                            selectedStore &&
                            selectedStore.stripe_enabled &&
                            selectedStore.stripe_public_key && (
                                <StripeCheckout
                                    amount={finalTotal}
                                    storeId={selectedStoreId}
                                    storePublicKey={
                                        selectedStore.stripe_public_key
                                    }
                                    onCancel={() => setPaymentMode("whatsapp")}
                                    onSuccess={(pid) =>
                                        handleFinishOrder(true, pid)
                                    }
                                />
                            )}
                        {paymentMode === "stripe" &&
                            selectedStore &&
                            !selectedStore.stripe_enabled && (
                                <div className="p-3 bg-amber-100 text-amber-800 rounded text-sm text-center">
                                    Pagamento online indisponível nesta loja.
                                </div>
                            )}
                    </div>
                )}

                {/* FOOTER MANTIDO (FLEX-ROW WRAP) COM SELO DE SEGURANÇA */}
                <SheetFooter className="bg-background border-t p-4 flex flex-row flex-wrap gap-4 mt-auto shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
                    {step === "cart" ? (
                        itemCount > 0 ? (
                            <>
                                {/* LINHA 1: TOTAIS */}
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span>Desconto:</span>
                                            <span>
                                                -
                                                {formatCurrency(discountAmount)}
                                            </span>
                                        </div>
                                    )}
                                    <Separator className="my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-semibold">
                                            Total:
                                        </span>
                                        <span className="text-xl font-bold text-primary">
                                            {formatCurrency(totalPrice)}
                                        </span>
                                    </div>
                                </div>

                                {/* LINHA 2: CUPOM */}
                                {!isWholesale && (
                                    <div className="w-full flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Ticket className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                ref={couponInputRef}
                                                value={couponInput}
                                                onChange={(e) =>
                                                    setCouponInput(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Cupom"
                                                className="pl-9"
                                                disabled={!!coupon}
                                            />
                                        </div>
                                        {coupon ? (
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={removeCoupon}
                                                className="shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon}
                                                className="shrink-0"
                                            >
                                                {isApplyingCoupon ? (
                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                ) : (
                                                    "Aplicar"
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* LINHA 3: BOTÕES LADO A LADO */}
                                <div className="w-full grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={clearCart}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        Esvaziar
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="font-bold"
                                        onClick={handleProceed}
                                    >
                                        Finalizar
                                    </Button>
                                </div>

                                {/* SELO DE SEGURANÇA (NOVO) */}
                                <div className="w-full flex justify-center gap-2 text-[10px] text-muted-foreground opacity-70 mt-1">
                                    <span className="flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-green-600" />{" "}
                                        Compra 100% Segura
                                    </span>
                                </div>
                            </>
                        ) : (
                            <SheetClose asChild>
                                <Button variant="outline" className="w-full">
                                    Continuar comprando
                                </Button>
                            </SheetClose>
                        )
                    ) : (
                        step === "checkout" &&
                        (paymentMode === "whatsapp" || isWholesale) && (
                            <div className="w-full space-y-3">
                                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                                    {deliveryType === "delivery" &&
                                        deliveryCost > 0 && (
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>
                                                    Frete{" "}
                                                    {isSameCity
                                                        ? "(Local)"
                                                        : "(Envio)"}
                                                    :
                                                </span>
                                                <span>
                                                    {deliveryCost === 0
                                                        ? "GRÁTIS"
                                                        : formatCurrency(
                                                              deliveryCost
                                                          )}
                                                </span>
                                            </div>
                                        )}
                                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-300">
                                        <span className="font-semibold">
                                            Total Final:
                                        </span>
                                        <span className="text-xl font-bold text-primary">
                                            {formatCurrency(finalTotal)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-base shadow-md"
                                    onClick={() => handleFinishOrder(false)}
                                    disabled={isSavingOrder}
                                >
                                    {isSavingOrder ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : (
                                        <ShoppingCart className="mr-2 h-5 w-5" />
                                    )}
                                    Confirmar Pedido
                                </Button>

                                <div className="w-full flex justify-center gap-2 text-[10px] text-muted-foreground opacity-70 mt-1">
                                    <span className="flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-green-600" />{" "}
                                        Ambiente Seguro
                                    </span>
                                </div>
                            </div>
                        )
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
