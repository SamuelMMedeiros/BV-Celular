import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { Product, Store } from "@/types";
import { MessageCircle, Trash2, ShoppingCart } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button"; // Importa buttonVariants
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer"; // IMPORTAÇÃO CORRETA DO DRAWER

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
    generateWhatsAppMessage: (stores: Store[]) => string;
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

    // --- Função de Geração de Mensagem para WhatsApp ---
    const generateWhatsAppMessage = useCallback(
        (stores: Store[]): string => {
            if (items.length === 0) return "O carrinho está vazio.";

            let message = "*🛒 Pedido BV Celular*\n\n";
            let totalValue = 0;

            items.forEach((item, index) => {
                const price = item.product.price / 100;
                totalValue += price * item.quantity;

                message += `${index + 1}. *${item.product.name}* (x${
                    item.quantity
                })\n`;
                message += `   Preço Unid.: R$ ${price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                })}\n`;
            });

            message +=
                "\n*Total do Pedido:* R$ " +
                totalValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                });
            message += "\n\n---";

            // Adiciona a seção de Lojas para "Comprar via WhatsApp"
            const uniqueStores = Array.from(
                new Map(stores.map((s) => [s.id, s])).values()
            );

            if (uniqueStores.length > 0) {
                message += "\n\n*Opções de Loja para Compra (WhatsApp):*\n";
                uniqueStores.forEach((store) => {
                    message += `\n*${store.name} (${
                        store.city || "Online"
                    })*:\n`;
                    const whatsappCleaned = store.whatsapp.replace(/\D/g, "");
                    message += `  Contato: +55 ${whatsappCleaned.replace(
                        /^(\d{2})(\d{5})(\d{4})$/,
                        "($1) $2-$3"
                    )}\n`;
                });
                message +=
                    "\n_Entre em contato com uma loja para finalizar seu pedido!_";
            }

            return message;
        },
        [items]
    );
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

// --- Componente UI para o Drawer/Lista (Opcional, mas útil para a Navbar) ---
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

    // Lógica para enviar o pedido via WhatsApp
    const handleCheckout = () => {
        // Encontra todas as lojas referenciadas pelos produtos no carrinho
        const allStoresInCart = items.flatMap((item) => item.product.stores);
        const uniqueStores = Array.from(
            new Map(allStoresInCart.map((s) => [s.id, s])).values()
        );

        const message = generateWhatsAppMessage(uniqueStores);
        const encodedMessage = encodeURIComponent(message);

        // Usamos o número da primeira loja para o checkout
        const centralWhatsapp =
            uniqueStores[0]?.whatsapp.replace(/\D/g, "") || "34999990000";

        window.open(
            `https://wa.me/55${centralWhatsapp}?text=${encodedMessage}`,
            "_blank"
        );
        setIsDrawerOpen(false);
    };

    // Helper para formatar preços
    const formatPrice = (priceInCents: number) => {
        return (priceInCents / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
        });
    };

    const totalOrderValue =
        items.reduce(
            (total, item) => total + item.product.price * item.quantity,
            0
        ) / 100;

    return (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
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
                    <DrawerTitle>
                        Seu Carrinho ({itemCount}{" "}
                        {itemCount === 1 ? "Item" : "Itens"})
                    </DrawerTitle>
                    <DrawerDescription>
                        Lista de itens para orçamento via WhatsApp.
                    </DrawerDescription>
                </DrawerHeader>
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
                                                item.product.price *
                                                    item.quantity
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
                                            onClick={() =>
                                                removeItem(item.product.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DrawerFooter className="bg-background border-t">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total:</span>
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
                        disabled={itemCount === 0}
                        onClick={handleCheckout}
                    >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Finalizar Pedido via WhatsApp
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={clearCart}
                        disabled={itemCount === 0}
                        className="w-full"
                    >
                        Limpar Carrinho
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
