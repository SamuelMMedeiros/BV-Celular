import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { Product, Store } from "@/types";
import {
    MessageCircle,
    Trash2,
    ShoppingCart,
    ArrowLeft,
    Store as StoreIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
    DrawerFooter,
} from "@/components/ui/drawer";
import { useQuery } from "@tanstack/react-query";
import { fetchStores } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// --- 1. Definição do Tipo de Item do Carrinho ---
export interface CartItem {
    product: Product;
    quantity: number;
}

// --- 2. Definição do Tipo de Contexto ---
interface CartContextType {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    generateWhatsAppMessage: (items: CartItem[]) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- 3. Provider do Carrinho ---
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    // Inicializa o estado lendo do localStorage para persistência
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem("bv_celular_cart");
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to read cart from localStorage", e);
            return [];
        }
    });

    // Salva o estado no localStorage sempre que 'items' muda
    useEffect(() => {
        localStorage.setItem("bv_celular_cart", JSON.stringify(items));
    }, [items]);

    // Contagem total de itens (para o badge na Navbar)
    const itemCount = useMemo(
        () => items.reduce((count, item) => count + item.quantity, 0),
        [items]
    );

    // --- Funções de Lógica ---
    const addItem = useCallback((product: Product) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find(
                (item) => item.product.id === product.id
            );

            if (existingItem) {
                return prevItems.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevItems, { product, quantity: 1 }];
            }
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems((prevItems) =>
            prevItems.filter((item) => item.product.id !== productId)
        );
    }, []);

    const updateQuantity = useCallback(
        (productId: string, quantity: number) => {
            setItems((prevItems) => {
                if (quantity <= 0) {
                    return prevItems.filter(
                        (item) => item.product.id !== productId
                    );
                }
                return prevItems.map((item) =>
                    item.product.id === productId
                        ? { ...item, quantity: quantity }
                        : item
                );
            });
        },
        []
    );

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    // --- Função de Geração de Mensagem para WhatsApp (REESCRITA) ---
    const generateWhatsAppMessage = useCallback((items: CartItem[]): string => {
        if (items.length === 0) return "O carrinho está vazio.";

        const customerNamePlaceholder = "[NOME DO CLIENTE]"; // Placeholder
        let totalValue = 0;

        // --- Header ---
        let message = `👋 *NOVO PEDIDO DE ORÇAMENTO!*
    
👤 Cliente: ${customerNamePlaceholder}
📱 Origem: Website BV Celular
    
---
*📋 ITENS DO CARRINHO:*\n`;

        // --- Lista de Itens ---
        items.forEach((item, index) => {
            const price = item.product.price / 100;
            totalValue += price * item.quantity;

            message += `\n${index + 1}. *${item.product.name}* (x${
                item.quantity
            })`;
            message += `\n   💰 Preço Unid.: R$ ${price.toLocaleString(
                "pt-BR",
                { minimumFractionDigits: 2 }
            )}`;
            message += `\n   ${item.product.storage?.toUpperCase() || ""} / ${
                item.product.ram?.toUpperCase() || ""
            } RAM`;
        });

        // --- Footer ---
        message += `\n\n---`;
        message += `\n*✅ TOTAL DO ORÇAMENTO:* R$ ${totalValue.toLocaleString(
            "pt-BR",
            { minimumFractionDigits: 2 }
        )}`;
        message += `\n\nAguardamos o contato para confirmar a disponibilidade e a forma de pagamento!`;

        return message;
    }, []);
    // --- Fim da Geração de Mensagem ---

    const value = {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        generateWhatsAppMessage,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};

// Hook de uso
export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart deve ser usado dentro de um CartProvider");
    }
    return context;
};

// Helper para formatação de WhatsApp (Igual ao AdminStores)
const formatWhatsapp = (number: string): string => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 11)
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(
            2,
            7
        )}-${cleaned.substring(7, 11)}`;
    if (cleaned.length === 10)
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(
            2,
            6
        )}-${cleaned.substring(6, 10)}`;
    return number;
};

// --- Componente UI para o Drawer/Lista (Escolha da Loja) ---
export const CartDrawer = () => {
    const {
        items,
        itemCount,
        removeItem,
        updateQuantity,
        clearCart,
        generateWhatsAppMessage,
    } = useCart();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [step, setStep] = useState<"cart" | "stores">("cart"); // Estado para os passos do Checkout

    // 1. Query para buscar todas as lojas
    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["allStores"],
        queryFn: fetchStores,
        enabled: isDrawerOpen && step === "stores", // Só busca se o drawer e o passo estiverem ativos
    });

    // Helper para formatar preços
    const formatPrice = (priceInCents: number) => {
        return (priceInCents / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
        });
    };

    // Lógica que envia o pedido para a loja selecionada
    const handleSelectStore = (store: Store) => {
        const message = generateWhatsAppMessage(items);
        const encodedMessage = encodeURIComponent(message);

        const whatsappCleaned = store.whatsapp.replace(/\D/g, "");

        window.open(
            `https://wa.me/55${whatsappCleaned}?text=${encodedMessage}`,
            "_blank"
        );
        setIsDrawerOpen(false);
        setStep("cart"); // Reseta o passo
    };

    const handleProceedToStores = () => {
        if (itemCount > 0) {
            setStep("stores");
        }
    };

    const totalOrderValue =
        items.reduce(
            (total, item) => total + item.product.price * item.quantity,
            0
        ) / 100;

    // Renderiza a lista de itens do carrinho
    const renderCartItems = () => (
        <div className="p-4 overflow-y-auto">
            {itemCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    O carrinho está vazio.
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.product.id}
                            className="flex items-center space-x-4 border-b pb-4"
                        >
                            <img
                                src={
                                    item.product.images?.[0] ||
                                    "/placeholder.svg"
                                }
                                alt={item.product.name}
                                className="h-16 w-16 object-cover rounded-md"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">
                                    {item.product.name}
                                </p>
                                <p className="text-sm text-primary">
                                    R${" "}
                                    {formatPrice(
                                        item.product.price * item.quantity
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        updateQuantity(
                                            item.product.id,
                                            item.quantity - 1
                                        )
                                    }
                                >
                                    -
                                </Button>
                                <span className="w-6 text-center">
                                    {item.quantity}
                                </span>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        updateQuantity(
                                            item.product.id,
                                            item.quantity + 1
                                        )
                                    }
                                >
                                    +
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => removeItem(item.product.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Renderiza a lista de lojas para escolha
    const renderStoreSelection = () => {
        if (isLoadingStores) {
            return (
                <div className="p-4 text-center text-muted-foreground">
                    <Skeleton className="h-6 w-1/2 mx-auto mb-4" />
                    Carregando lojas...
                </div>
            );
        }

        if (!stores || stores.length === 0) {
            return (
                <div className="p-4 text-center text-destructive">
                    Nenhuma loja cadastrada para finalizar o pedido.
                </div>
            );
        }

        return (
            <div className="p-4 space-y-3 overflow-y-auto">
                <p className="text-sm font-semibold">
                    Selecione a loja para enviar o pedido:
                </p>
                {stores.map((store) => (
                    <Button
                        key={store.id}
                        className="w-full h-auto py-3 justify-start transition-colors duration-150"
                        variant="outline"
                        onClick={() => handleSelectStore(store)} // Envia para a função de checkout
                    >
                        <div className="flex flex-col items-start">
                            <span className="font-bold">{store.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatWhatsapp(store.whatsapp)} -{" "}
                                {store.city || "Online"}
                            </span>
                        </div>
                    </Button>
                ))}
            </div>
        );
    };

    return (
        <Drawer
            open={isDrawerOpen}
            onOpenChange={(open) => {
                setIsDrawerOpen(open);
                if (!open) setStep("cart");
            }}
        >
            <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="relative ml-2">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-white">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader>
                    {/* Exibe o botão de voltar quando estiver no passo de escolha de loja */}
                    {step === "stores" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep("cart")}
                            className="absolute top-4 left-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    )}
                    <DrawerTitle>
                        {step === "cart"
                            ? `Seu Carrinho (${itemCount} Itens)`
                            : "Escolher Loja"}
                    </DrawerTitle>
                    <DrawerDescription>
                        {step === "cart"
                            ? "Lista de itens para orçamento."
                            : "Selecione a loja para finalizar via WhatsApp."}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Renderização do Conteúdo por Passo */}
                {step === "cart" ? renderCartItems() : renderStoreSelection()}

                <DrawerFooter className="bg-background border-t flex-col">
                    {step === "cart" && itemCount > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">
                                    Total:
                                </span>
                                <span className="text-xl font-bold text-primary">
                                    R${" "}
                                    {totalOrderValue.toLocaleString("pt-BR", {
                                        minimumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleProceedToStores} // Avança para o passo 2
                            >
                                <StoreIcon className="mr-2 h-5 w-5" />
                                Escolher Loja e Finalizar
                            </Button>
                        </>
                    )}

                    {/* Botão Limpar Carrinho (Disponível em ambos os passos) */}
                    <Button
                        variant="ghost"
                        onClick={clearCart}
                        disabled={itemCount === 0 || isLoadingStores}
                        className="w-full text-sm text-muted-foreground hover:text-destructive"
                    >
                        Limpar Carrinho
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
