/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { CartItem } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    totalPrice: number;
    // Novos campos para o cupom
    coupon: string | null;
    discount: number;
    applyCoupon: (code: string) => void;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Estado para o cupom
    const [coupon, setCoupon] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    // Recalcula o desconto sempre que o carrinho ou o cupom mudam
    useEffect(() => {
        const subtotal = cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        if (coupon === "BV10") {
            // Exemplo: Cupom fixo de 10%
            setDiscount(subtotal * 0.1);
        } else if (coupon === "PROMO20") {
            // Exemplo: Cupom de R$ 20,00
            setDiscount(20);
        } else {
            setDiscount(0);
        }
    }, [cartItems, coupon]);

    const addToCart = (item: CartItem) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        toast({ title: "Adicionado ao carrinho", description: item.name });
    };

    const removeFromCart = (itemId: string) => {
        setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setCoupon(null); // Limpa cupom ao esvaziar
        setDiscount(0);
    };

    // Função para aplicar cupom
    const applyCoupon = (code: string) => {
        // Aqui você pode validar com uma API real no futuro
        const validCoupons = ["BV10", "PROMO20"];

        if (validCoupons.includes(code.toUpperCase())) {
            setCoupon(code.toUpperCase());
            toast({
                title: "Cupom aplicado!",
                description: `Desconto ativado com sucesso.`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "Cupom inválido",
                description: "Tente BV10 ou PROMO20",
            });
            setCoupon(null);
        }
    };

    const removeCoupon = () => {
        setCoupon(null);
        setDiscount(0);
    };

    const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    // Total = Subtotal - Desconto
    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    const totalPrice = Math.max(0, subtotal - discount); // Garante que não fique negativo

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
                coupon,
                discount,
                applyCoupon,
                removeCoupon,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
