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
import { fetchCoupon, checkCouponUsage, calculateFreight } from "@/lib/api";
import { useCustomerAuth } from "./CustomerAuthContext";
import { useToast } from "@/hooks/use-toast";
import { isBefore } from "date-fns";

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, variantId?: string) => void;
    updateQuantity: (
        itemId: string,
        quantity: number,
        variantId?: string
    ) => void;
    clearCart: () => void;
    itemCount: number;

    // Campos Financeiros
    subtotal: number;
    discountAmount: number;
    totalPrice: number;

    // Cupom
    coupon: Coupon | null;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;

    // Frete
    shippingQuote: ShippingQuote | null;
    calculateShipping: (cep: string) => Promise<void>;
    clearShipping: () => void;
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
    const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(
        null
    );

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
        // Calcula desconto percentual
        return Math.round(subtotal * (coupon.discount_percent / 100));
    }, [subtotal, coupon]);

    const totalPrice = useMemo(() => {
        let total = subtotal - discountAmount;
        if (shippingQuote) {
            total += shippingQuote.price;
        }
        return total > 0 ? total : 0;
    }, [subtotal, discountAmount, shippingQuote]);

    const addToCart = useCallback((newItem: CartItem) => {
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
                (i) => i.id === newItem.id && i.variantId === newItem.variantId
            );

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                const currentItem = updatedItems[existingItemIndex];
                const newQuantity = Math.min(currentItem.quantity + 1, 10);
                updatedItems[existingItemIndex] = {
                    ...currentItem,
                    quantity: newQuantity,
                };
                return updatedItems;
            } else {
                return [...prevItems, { ...newItem, quantity: 1 }];
            }
        });
    }, []);

    const removeFromCart = useCallback(
        (productId: string, variantId?: string) => {
            setCartItems((prevItems) =>
                prevItems.filter(
                    (item) =>
                        !(item.id === productId && item.variantId === variantId)
                )
            );
        },
        []
    );

    const updateQuantity = useCallback(
        (productId: string, quantity: number, variantId?: string) => {
            if (quantity < 1 || quantity > 10) return;

            setCartItems((prevItems) => {
                return prevItems.map((item) => {
                    if (item.id === productId && item.variantId === variantId) {
                        return { ...item, quantity: quantity };
                    }
                    return item;
                });
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
            if (
                foundCoupon.valid_until &&
                isBefore(new Date(foundCoupon.valid_until), new Date())
            ) {
                toast({ variant: "destructive", title: "Cupom expirado" });
                return false;
            }

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

            const alreadyUsed = await checkCouponUsage(
                profile.id,
                foundCoupon.id
            );
            if (alreadyUsed) {
                toast({ variant: "destructive", title: "Cupom já utilizado" });
                return false;
            }

            if (!foundCoupon.allow_with_promotion) {
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

            if (
                foundCoupon.valid_for_categories &&
                foundCoupon.valid_for_categories.length > 0
            ) {
                const allItemsValid = cartItems.every((item) =>
                    foundCoupon.valid_for_categories?.includes(item.category)
                );
                if (!allItemsValid) {
                    toast({
                        variant: "destructive",
                        title: "Categoria inválida",
                        description: `Válido apenas para: ${foundCoupon.valid_for_categories.join(
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

    const calculateShipping = async (cep: string) => {
        try {
            const quote = await calculateFreight(cep);
            setShippingQuote(quote);
            toast({
                title: "Frete calculado!",
                description: `Prazo: ${quote.days} dias úteis.`,
            });
        } catch (error) {
            console.error(error);
            setShippingQuote(null);
            toast({
                variant: "destructive",
                title: "Erro no frete",
                description: "Verifique o CEP.",
            });
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
        shippingQuote,
        calculateShipping,
        clearShipping,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart deve ser usado dentro de um CartProvider");
    }
    return context;
};
