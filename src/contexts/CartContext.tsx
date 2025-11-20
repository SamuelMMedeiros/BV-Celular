/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useMemo,
    useCallback,
} from "react";
import { CartItem, Coupon, ShippingQuote } from "@/types";
import { fetchCoupon, checkCouponUsage, calculateFreight } from "@/lib/api"; // <-- IMPORT calculateFreight
import { useCustomerAuth } from "./CustomerAuthContext";
import { useToast } from "@/hooks/use-toast";
import { isBefore } from "date-fns";

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
    
    // Campos de Frete
    shippingQuote: ShippingQuote | null;
    calculateShipping: (cep: string) => Promise<void>;
    clearShipping: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'bvcelular_cart';

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

    

    const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null); // <-- Novo State
    
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
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]);

    const discountAmount = useMemo(() => {
        if (!coupon) return 0;
        return Math.round(subtotal * (coupon.discount_percent / 100));
    }, [subtotal, coupon]);

    const totalPrice = useMemo(() => {
        let total = subtotal - discountAmount;
        if (shippingQuote) {
            total += shippingQuote.price; // Soma o frete
        }
        return total > 0 ? total : 0;
    }, [subtotal, discountAmount, shippingQuote]);

    const addToCart = useCallback((item: CartItem) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(
                (i) => i.id === item.id
            );

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
                    return prevItems.filter(
                        (item) => item.id !== productId
                    );
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
        setShippingQuote(null);
    }, []);

const applyCoupon = async (code: string) => {
    if (!code) return false;

    if (!isLoggedIn || !profile) {
        toast({
            variant: "destructive",
            title: "Login necessário",
            description: "Faça login para usar cupons.",
        });
        return false;
    }

    const foundCoupon = await fetchCoupon(code);

    if (foundCoupon) {
        // 1. Validade de Data
        if (
            foundCoupon.valid_until &&
            isBefore(new Date(foundCoupon.valid_until), new Date())
        ) {
            toast({ variant: "destructive", title: "Cupom expirado" });
            return false;
        }

        // 2. Valor Mínimo
        if (
            foundCoupon.min_purchase_value &&
            subtotal < foundCoupon.min_purchase_value * 100
        ) {
            toast({
                variant: "destructive",
                title: "Valor mínimo não atingido",
            });
            return false;
        }

        // 3. Uso Único
        const alreadyUsed = await checkCouponUsage(profile.id, foundCoupon.id);
        if (alreadyUsed) {
            toast({ variant: "destructive", title: "Cupom já utilizado" });
            return false;
        }

        // --- NOVAS REGRAS DE VALIDAÇÃO ---

        // 4. Bloqueio de Promoção
        if (!foundCoupon.allow_with_promotion) {
            // Verifica se TEM algum item em promoção no carrinho
            // (Precisamos que CartItem tenha isPromotion, que adicionamos no types.ts)
            const hasPromoItem = cartItems.some((item) => item.isPromotion);
            if (hasPromoItem) {
                toast({
                    variant: "destructive",
                    title: "Não permitido",
                    description:
                        "Este cupom não acumula com itens em promoção.",
                });
                return false;
            }
        }

        // 5. Restrição de Categoria
        if (
            foundCoupon.valid_for_categories &&
            foundCoupon.valid_for_categories.length > 0
        ) {
            // Verifica se TODOS os itens do carrinho pertencem às categorias permitidas
            const allItemsValid = cartItems.every((item) =>
                foundCoupon.valid_for_categories?.includes(item.category)
            );

            if (!allItemsValid) {
                toast({
                    variant: "destructive",
                    title: "Categoria inválida",
                    description: `Este cupom só vale para: ${foundCoupon.valid_for_categories.join(
                        ", "
                    )}`,
                });
                return false;
            }
        }

        setCoupon(foundCoupon);
        return true;
    }

    toast({ variant: "destructive", title: "Cupom inválido" });
    return false;
};

    const removeCoupon = () => setCoupon(null);

    // --- NOVA LÓGICA DE FRETE ---
    const calculateShipping = async (cep: string) => {
        try {
            const quote = await calculateFreight(cep);
            setShippingQuote(quote);
            toast({ title: "Frete calculado!", description: `Prazo: ${quote.days} dias úteis.` });
        } catch (error) {
            console.error(error);
            setShippingQuote(null);
            toast({ variant: "destructive", title: "Erro no frete", description: "Verifique o CEP." });
        }
    };

    const clearShipping = () => setShippingQuote(null);

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
        shippingQuote,     // Novo
        calculateShipping, // Novo
        clearShipping,     // Novo
    };

    return (
        <CartContext.Provider value={value}>
            {children}
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