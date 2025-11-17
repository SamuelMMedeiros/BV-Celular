import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useMemo,
    useCallback,
} from "react";
import { Product, Store, CartItem } from "@/types";
import {
    MessageCircle,
    Trash2,
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
import { fetchStores, createOrder } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "./CustomerAuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// --------------------------------------------------------------
// CONTEXTO DO CARRINHO
// --------------------------------------------------------------

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = "bvcelular_cart";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    const itemCount = useMemo(
        () => cartItems.reduce((count, item) => count + item.quantity, 0),
        [cartItems]
    );

    const totalPrice = useMemo(
        () =>
            cartItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ),
        [cartItems]
    );

    const addToCart = useCallback((item: CartItem) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id
                        ? { ...i, quantity: Math.min(i.quantity + 1, 5) }
                        : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((id: string) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateQuantity = useCallback((id: string, qty: number) => {
        if (qty < 1 || qty > 5) return;
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, quantity: qty } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => setCartItems([]), []);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                itemCount,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context)
        throw new Error("useCart deve ser usado dentro de um CartProvider");
    return context;
};

// --------------------------------------------------------------
// CART DRAWER
// --------------------------------------------------------------

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
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["allStores"],
        queryFn: fetchStores,
        enabled: isSheetOpen && step === "stores",
    });

    if (location.pathname.startsWith("/admin")) return null;

    const handleProceedToNextStep = () => {
        if (itemCount === 0) return;
        if (!isLoggedIn) setStep("auth");
        else setStep("stores");
    };

    const handleSelectStore = async (storeId: string) => {
        const store = stores?.find((s) => s.id === storeId);
        if (!store) return;

        let orderId: string | null = null;

        if (isLoggedIn && profile) {
            setIsSavingOrder(true);
            try {
                const orderItems = cartItems.map((i) => ({
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    category: i.category,
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
                    description: "Seu pedido foi salvo no histórico.",
                });
            } catch {
                toast({
                    variant: "destructive",
                    title: "Erro ao salvar",
                    description: "O WhatsApp abrirá mesmo assim.",
                });
            } finally {
                setIsSavingOrder(false);
            }
        }

        const itemsText = cartItems
            .map((i) => `${i.quantity}x ${i.name}`)
            .join("%0A");
        const totalText = `*Total: ${formatCurrency(totalPrice)}*%0A%0A`;

        let intro =
            isLoggedIn && profile
                ? `Olá, *${store.name}*!%0A%0AEu sou *${profile.name}* e gostaria de fazer um pedido:%0A%0A`
                : `Olá, *${store.name}*!%0A%0AGostaria de fazer um pedido:%0A%0A`;

        if (orderId) intro += `*(Ref: ${orderId.substring(0, 8)})*%0A%0A`;

        const fullMessage =
            intro + itemsText + "%0A%0A" + totalText + "Aguardo retorno!";
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${store.whatsapp.replace(
            /\D/g,
            ""
        )}&text=${fullMessage}`;

        window.open(whatsappUrl, "_blank");

        clearCart();
        setIsSheetOpen(false);
        setStep("cart");
    };

    // --------------------------------------------------------------
    // RENDERIZAR ITENS DO CARRINHO
    // --------------------------------------------------------------

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
                                <p className="flex-1 font-medium">
                                    {item.name}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => removeFromCart(item.id)}
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
                                                item.quantity - 1
                                            )
                                        }
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>

                                    <span className="w-4 text-center font-medium">
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

    // --------------------------------------------------------------
    // TELAS INTERMEDIÁRIAS (LOGIN e LOJAS)
    // --------------------------------------------------------------

    const renderAuthPrompt = () => (
        <div className="p-6 text-center space-y-4 flex-1 flex flex-col justify-center">
            <User className="h-10 w-10 mx-auto text-primary" />
            <SheetTitle>Quase lá!</SheetTitle>
            <SheetDescription>
                Precisamos do seu nome e telefone para enviar o pedido.
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
            <Label className="text-base font-semibold text-center mb-3">
                Selecione a loja:
            </Label>

            {isLoadingStores ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando lojas...</span>
                </div>
            ) : (
                <Select
                    onValueChange={handleSelectStore}
                    disabled={isSavingOrder}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Escolha uma loja" />
                    </SelectTrigger>
                    <SelectContent>
                        {stores?.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                                {store.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {isSavingOrder && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando pedido...</span>
                </div>
            )}
        </div>
    );

    // --------------------------------------------------------------
    // UI PRINCIPAL DO DRAWER
    // --------------------------------------------------------------

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
                        <span className="absolute -top-1 -right-1 bg-destructive text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
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

                {/* -------------------------------------------------------------- */}
                {/*  FOOTER CORRIGIDO — TOTAL EM CIMA / BOTÕES EMBAIXO */}
                {/* -------------------------------------------------------------- */}

                {step === "cart" && (
                    <SheetFooter className="bg-background border-t pt-4 flex-col gap-3">
                        {itemCount > 0 ? (
                            <>
                                {/* TOTAL EM LINHA SEPARADA */}
                                <div className="w-full flex flex-col text-right pr-1">
                                    <span className="text-sm text-muted-foreground">
                                        Total:
                                    </span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </div>

                                {/* BOTÕES ABAIXO */}
                                <div className="flex w-full justify-between gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={clearCart}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        Limpar Carrinho
                                    </Button>

                                    <Button
                                        size="lg"
                                        className="w-full"
                                        onClick={handleProceedToNextStep}
                                    >
                                        <StoreIcon className="mr-2 h-5 w-5" />
                                        Escolher Loja e Finalizar
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <SheetClose asChild>
                                <Button variant="outline" className="w-full">
                                    Continuar Comprando
                                </Button>
                            </SheetClose>
                        )}
                    </SheetFooter>
                )}

                {step === "cart" && !isLoggedIn && (
                    <div className="p-4 pt-0 mt-auto">
                        <Alert>
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
                                para salvar carrinhos no seu histórico.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
