/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";
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
import { fetchStores, createOrder, upsertClient } from "@/lib/api"; // <-- IMPORTADO upsertClient
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Store } from "@/types";

export const CartDrawer = () => {
    const {
        cartItems,
        itemCount,
        totalPrice,
        removeFromCart,
        updateQuantity,
        clearCart,
    } = useCart();
    const { isLoggedIn, profile } = useCustomerAuth();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [step, setStep] = useState<"cart" | "stores" | "auth">("cart");
    const [isStoreSelectOpen, setIsStoreSelectOpen] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    if (location.pathname.startsWith("/admin")) {
        return null;
    }

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["allStores"],
        queryFn: fetchStores,
        enabled: isSheetOpen && step === "stores",
    });

    const handleSelectStore = async (storeId: string) => {
        const store = stores?.find((s) => s.id === storeId);
        if (!store) return;

        let orderId: string | null = null;
        if (isLoggedIn && profile) {
            setIsSavingOrder(true);
            try {
                // --- CORREÇÃO AQUI ---
                // Garante que o cliente exista no banco antes de criar o pedido.
                // Isso é crucial se o Admin estiver testando o fluxo de compra.
                await upsertClient({
                    id: profile.id,
                    name: profile.name,
                    phone: profile.phone,
                    email: profile.email,
                });

                const orderItems = cartItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: item.category,
                }));

                const newOrder = await createOrder({
                    client_id: profile.id,
                    store_id: store.id,
                    total_price: totalPrice,
                    items: orderItems,
                });
                orderId = newOrder.id;

                toast({
                    title: "Pedido salvo!",
                    description: "Seu pedido foi salvo no seu histórico.",
                });
            } catch (error: any) {
                console.error("Falha ao salvar pedido:", error);
                toast({
                    variant: "destructive",
                    title: "Falha ao salvar pedido",
                    description:
                        "Não foi possível salvar seu pedido. O WhatsApp abrirá mesmo assim.",
                });
            } finally {
                setIsSavingOrder(false);
            }
        }

        const itemsText = cartItems
            .map((item) => `${item.quantity}x ${item.name}`)
            .join("%0A");

        let introMessage = `Olá, *${store.name}*!%0A%0A`;

        if (isLoggedIn && profile) {
            introMessage += `Eu sou *${profile.name}* e gostaria de fazer um pedido:%0A%0A`;
            if (orderId) {
                introMessage += `*(Ref. Pedido: ${orderId.substring(
                    0,
                    8
                )})*%0A%0A`;
            }
        } else {
            introMessage += "Gostaria de fazer um pedido:%0A%0A";
        }

        const totalText = `*Total: ${formatCurrency(totalPrice)}*%0A%0A`;
        const fullMessage =
            introMessage +
            itemsText +
            "%0A%0A" +
            totalText +
            "Aguardo seu contato!";

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${store.whatsapp.replace(
            /\D/g,
            ""
        )}&text=${fullMessage}`;

        window.open(whatsappUrl, "_blank");
        clearCart();
        setIsSheetOpen(false);
        setStep("cart");
    };

    const handleProceedToNextStep = () => {
        if (itemCount === 0) return;
        if (!isLoggedIn) {
            setStep("auth");
        } else {
            setStep("stores");
            setIsStoreSelectOpen(true);
        }
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
                            key={item.id}
                            className="flex flex-col gap-3 border-b pb-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <img
                                    src={item.images[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    className="h-16 w-16 rounded-md object-cover border"
                                />
                                <p className="flex-1 font-medium leading-tight break-words min-w-0">
                                    {item.name}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground flex-shrink-0"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">
                                        Remover item
                                    </span>
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
                                                item.quantity - 1
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
                                                item.quantity + 1
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

    const renderAuthPrompt = () => (
        <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
            <User className="h-10 w-10 mx-auto text-primary" />
            <SheetTitle>Quase lá!</SheetTitle>
            <SheetDescription>
                Precisamos do seu nome e telefone para enviar o pedido à loja.
            </SheetDescription>
            <Button
                size="lg"
                className="w-full"
                onClick={() => {
                    navigate("/login", { state: { from: location } });
                    setIsSheetOpen(false);
                    setStep("cart");
                }}
            >
                Fazer Login ou Cadastro
            </Button>
        </div>
    );

    const renderStoreSelection = () => (
        <div className="p-4 flex-1 flex flex-col justify-center">
            <div className="space-y-3">
                <Label
                    htmlFor="store-select-sheet-main"
                    className="text-base font-semibold text-center block"
                >
                    Selecione a loja para retirar:
                </Label>
                {isLoadingStores ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando lojas...</span>
                    </div>
                ) : (
                    <Select
                        onValueChange={handleSelectStore}
                        disabled={isSavingOrder}
                    >
                        <SelectTrigger id="store-select-sheet-main">
                            <SelectValue placeholder="Escolha uma loja" />
                        </SelectTrigger>
                        <SelectContent>
                            {stores?.map((store) => (
                                <SelectItem key={store.id} value={store.id}>
                                    {store.name} ({store.city || "Online"})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                {isSavingOrder && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando no seu histórico...</span>
                    </div>
                )}
            </div>
        </div>
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
                className="flex flex-col w-full sm:max-w-md"
            >
                <SheetHeader>
                    {(step === "stores" || step === "auth") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep("cart")}
                            className="absolute top-3 left-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    )}
                    <SheetTitle>
                        {step === "cart"
                            ? `Meu Carrinho (${itemCount} Itens)`
                            : "Finalizar Pedido"}
                    </SheetTitle>
                </SheetHeader>

                {step === "cart" && renderCartItems()}
                {step === "auth" && renderAuthPrompt()}
                {step === "stores" && renderStoreSelection()}

                {step === "cart" && (
                    <SheetFooter className="bg-background border-t pt-4 flex-col gap-3">
                        {itemCount > 0 ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-base text-muted-foreground">
                                        Total:
                                    </span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </div>

                                <div className="flex w-full gap-3">
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
                                        onClick={handleProceedToNextStep}
                                    >
                                        <StoreIcon className="mr-2 h-5 w-5" />
                                        Escolher Loja
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <SheetClose asChild>
                                <Button variant="outline" className="w-full">
                                    Continuar comprando
                                </Button>
                            </SheetClose>
                        )}
                    </SheetFooter>
                )}

                {step === "cart" && !isLoggedIn && (
                    <div className="p-4 pt-0 mt-auto">
                        <Alert variant="default">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Entre para salvar!</AlertTitle>
                            <AlertDescription>
                                <Link
                                    to="/login"
                                    className="underline font-medium"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    Faça login ou cadastre-se
                                </Link>{" "}
                                para salvar seus carrinhos no seu histórico.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
