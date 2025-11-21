/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useRef, useEffect } from "react";
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
    CreditCard,
    Building2,
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
} from "@/lib/api"; // <-- IMPORTAR sendOrderEmail
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

    let deliveryCost = 0;
    if (deliveryType === "delivery") {
        if (isSameCity && selectedStore) {
            const fixedFee = (selectedStore.delivery_fixed_fee || 0) * 100;
            const minFree = (selectedStore.free_shipping_min_value || 0) * 100;
            if (minFree > 0 && subtotal >= minFree) {
                deliveryCost = 0;
            } else {
                deliveryCost = fixedFee;
            }
        } else if (shippingQuote) {
            deliveryCost = shippingQuote.price;
        }
    }

    const finalTotal = subtotal - discountAmount + deliveryCost;

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
        const code = couponInputRef.current?.value;
        if (!code) return;
        setIsApplyingCoupon(true);
        const success = await applyCoupon(code);
        setIsApplyingCoupon(false);
        if (success) {
            toast({
                title: "Cupom aplicado!",
                description: `Desconto de ${code} ativado.`,
            });
            if (couponInputRef.current) couponInputRef.current.value = "";
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
                title: "Selecione uma loja",
                description: "Escolha onde retirar o produto.",
            });
            return;
        }
        if (deliveryType === "delivery" && !selectedAddressId && !isWholesale) {
            toast({
                variant: "destructive",
                title: "Selecione um endereço",
                description: "Escolha onde entregar o produto.",
            });
            return;
        }
        if (!selectedStoreId) {
            toast({
                variant: "destructive",
                title: "Selecione a loja de origem",
                description: "Escolha de qual loja o pedido sairá.",
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
                        ? parseFloat(changeFor) * 100
                        : undefined,
                    status: paidOnline ? "completed" : "pending",
                    // @ts-ignore - Se o tipo não estiver atualizado no OrderInsertPayload ainda
                    stripe_payment_id: paymentId || null,
                });

                if (coupon && !isWholesale)
                    await createCouponUsage(clientId, coupon.id);

                // --- ENVIO DE EMAIL ---
                const clientName = isWholesale
                    ? wholesaleProfile?.company_name
                    : profile?.name;
                const clientEmail = isWholesale
                    ? wholesaleProfile?.email
                    : profile?.email;

                if (clientEmail && clientName) {
                    // Dispara o email sem esperar (fire and forget) para não travar o UI
                    sendOrderEmail(
                        clientEmail,
                        clientName,
                        newOrder.id,
                        formatCurrency(finalTotal),
                        orderItems
                    );
                }
                // ---------------------

                if (!paidOnline) {
                    const itemsText = cartItems
                        .map((item) => `${item.quantity}x ${item.name}`)
                        .join("%0A");

                    let msg = `Olá, *${
                        store?.name
                    }*!%0A%0AEu sou *${clientName}* ${
                        isWholesale ? "(Atacado)" : ""
                    } e gostaria de fazer um pedido (Ref: ${newOrder.id.substring(
                        0,
                        8
                    )}):%0A%0A`;
                    msg += itemsText + "%0A%0A";

                    if (deliveryType === "pickup") {
                        msg += `📍 *Vou Retirar na Loja*`;
                    } else if (address) {
                        msg += `🚚 *Entrega* para:%0A${address?.street}, ${address?.number} - ${address?.neighborhood}%0A(${address?.city})%0A`;
                        if (address?.complement)
                            msg += `Comp: ${address.complement}%0A`;

                        if (isSameCity) {
                            msg += `Frete Local: ${
                                deliveryCost === 0
                                    ? "GRÁTIS"
                                    : formatCurrency(deliveryCost)
                            }`;
                        } else if (shippingQuote) {
                            msg += `Frete: ${formatCurrency(
                                shippingQuote.price
                            )} (${shippingQuote.days} dias)`;
                        }
                    }

                    msg += `%0A💳 Pagamento: ${
                        paymentMethod === "credit_card"
                            ? "Cartão"
                            : paymentMethod === "pix"
                            ? "Pix"
                            : "Dinheiro"
                    }`;
                    if (paymentMethod === "cash" && changeFor)
                        msg += ` (Troco para ${changeFor})`;

                    msg += `%0A%0A*Total Final: ${formatCurrency(finalTotal)}*`;

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
                                    {/* MOSTRA VARIAÇÃO SE HOUVER */}
                                    {item.variantName && (
                                        <p className="text-xs text-muted-foreground mt-1 bg-muted inline-block px-1.5 py-0.5 rounded">
                                            {item.variantName}
                                        </p>
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
                </SheetHeader>

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
                                    Seu pedido será direcionado automaticamente
                                    para: <br />
                                    <strong className="text-foreground">
                                        {stores?.find(
                                            (s) => s.id === selectedStoreId
                                        )?.name || "Loja Vinculada"}
                                    </strong>
                                </p>
                                <Button
                                    className="w-full"
                                    onClick={() => setStep("checkout")}
                                >
                                    Continuar para Pagamento
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 flex-1 flex flex-col justify-center space-y-3">
                                <Label className="text-base font-semibold text-center block">
                                    Selecione a loja para retirar:
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
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer h-full text-center text-sm"
                                        >
                                            <ShoppingCart className="mb-2 h-6 w-6 text-green-600" />
                                            Negociar no Zap
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
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer h-full text-center text-sm"
                                        >
                                            <CreditCard className="mb-2 h-6 w-6 text-blue-600" />
                                            Pagar Online
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
                                        Nenhum endereço cadastrado. <br />
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
                                                    <span className="font-bold block">
                                                        {addr.name}
                                                    </span>
                                                    <span className="text-muted-foreground block">
                                                        {addr.street},{" "}
                                                        {addr.number}
                                                    </span>
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
                                    <div className="mt-2">
                                        <Label className="text-xs">
                                            Troco para quanto?
                                        </Label>
                                        <Input
                                            placeholder="R$ 0,00"
                                            onChange={(e) =>
                                                setChangeFor(e.target.value)
                                            }
                                        />
                                    </div>
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
                                <div className="p-4 bg-amber-100 text-amber-800 rounded-md text-sm text-center">
                                    Pagamento online indisponível nesta loja.{" "}
                                    <br />
                                    Por favor, escolha outra opção.
                                </div>
                            )}
                    </div>
                )}

                <SheetFooter className="bg-background border-t pt-4 flex-col gap-3 mt-auto">
                    {step === "cart" ? (
                        itemCount > 0 ? (
                            <>
                                {!isWholesale && (
                                    <div className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <Ticket className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                ref={couponInputRef}
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
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon}
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
                                <div className="space-y-1">
                                    {coupon && (
                                        <>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>Subtotal:</span>
                                                <span>
                                                    {formatCurrency(subtotal)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                                <span>Desconto:</span>
                                                <span>
                                                    -
                                                    {formatCurrency(
                                                        discountAmount
                                                    )}
                                                </span>
                                            </div>
                                            <Separator className="my-1" />
                                        </>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-primary ml-auto">
                                            {formatCurrency(totalPrice)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex w-full gap-3 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={clearCart}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        Limpar
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="w-full"
                                        onClick={handleProceed}
                                    >
                                        Finalizar Compra
                                    </Button>
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
                            <>
                                <div className="space-y-1">
                                    {deliveryType === "delivery" &&
                                        deliveryCost > 0 && (
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>
                                                    Frete{" "}
                                                    {isSameCity
                                                        ? "(Local)"
                                                        : "(Correios)"}
                                                    :
                                                </span>
                                                <span>
                                                    {formatCurrency(
                                                        deliveryCost
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-primary ml-auto">
                                            {formatCurrency(finalTotal)}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => handleFinishOrder(false)}
                                    disabled={isSavingOrder}
                                >
                                    {isSavingOrder ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : (
                                        <ShoppingCart className="mr-2 h-5 w-5" />
                                    )}
                                    Finalizar no WhatsApp
                                </Button>
                            </>
                        )
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
