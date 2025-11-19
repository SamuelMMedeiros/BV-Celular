import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useMemo,
    useCallback,
} from "react";
import { CartItem, Coupon } from "@/types";
import { fetchCoupon, checkCouponUsage } from "@/lib/api"; // Importar verificação
import { useCustomerAuth } from "./CustomerAuthContext"; // Importar Auth
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;

    // Campos de Cupom
    subtotal: number;
    discountAmount: number;
    totalPrice: number;
    coupon: Coupon | null;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "bvcelular_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to read cart from localStorage", e);
            return [];
        }
    });

    const [coupon, setCoupon] = useState<Coupon | null>(null);

    // Acesso ao perfil do usuário para validação
    const { profile, isLoggedIn } = useCustomerAuth();
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    const itemCount = useMemo(
        () => cartItems.reduce((count, item) => count + item.quantity, 0),
        [cartItems]
    );

    const subtotal = useMemo(() => {
        return cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }, [cartItems]);

    const discountAmount = useMemo(() => {
        if (!coupon) return 0;
        return Math.round(subtotal * (coupon.discount_percent / 100));
    }, [subtotal, coupon]);

    const totalPrice = subtotal - discountAmount;

    const addToCart = useCallback((item: CartItem) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id);

            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === item.id
                        ? { ...i, quantity: Math.min(i.quantity + 1, 5) }
                        : i
                );
            } else {
                return [...prevItems, { ...item, quantity: 1 }];
            }
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCartItems((prevItems) =>
            prevItems.filter((item) => item.id !== productId)
        );
    }, []);

    const updateQuantity = useCallback(
        (productId: string, quantity: number) => {
            if (quantity < 1 || quantity > 5) return;

            setCartItems((prevItems) => {
                if (quantity <= 0) {
                    return prevItems.filter((item) => item.id !== productId);
                }
                return prevItems.map((item) =>
                    item.id === productId
                        ? { ...item, quantity: quantity }
                        : item
                );
            });
        },
        []
    );

    const clearCart = useCallback(() => {
        setCartItems([]);
        setCoupon(null);
    }, []);

    // --- LÓGICA DE APLICAÇÃO DE CUPOM ATUALIZADA ---
    const applyCoupon = async (code: string) => {
        if (!code) return false;

        // 1. Verifica se está logado
        if (!isLoggedIn || !profile) {
            toast({
                variant: "destructive",
                title: "Login necessário",
                description: "Faça login para usar cupons de desconto.",
            });
            return false;
        }

        // 2. Busca o cupom
        const foundCoupon = await fetchCoupon(code);

        if (foundCoupon) {
            // 3. Verifica se já usou
            const alreadyUsed = await checkCouponUsage(
                profile.id,
                foundCoupon.id
            );

            if (alreadyUsed) {
                toast({
                    variant: "destructive",
                    title: "Cupom já utilizado",
                    description:
                        "Você já usou este cupom em uma compra anterior.",
                });
                return false;
            }

            setCoupon(foundCoupon);
            return true;
        }
        return false;
    };

    const removeCoupon = () => setCoupon(null);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discountAmount,
        totalPrice,
        coupon,
        applyCoupon,
        removeCoupon,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
            {/* O CartDrawer é renderizado na Navbar, não aqui, para evitar duplicidade visual */}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart deve ser usado dentro de um CartProvider");
    }
    return context;
};
