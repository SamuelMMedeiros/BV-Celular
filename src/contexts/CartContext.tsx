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
import { CartItem } from "@/types";
// NÃO importamos CartDrawer aqui para evitar ciclo e renderização duplicada

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

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    const itemCount = useMemo(
        () => cartItems.reduce((count, item) => count + item.quantity, 0),
        [cartItems]
    );

    const totalPrice = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]);

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
    }, []);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        totalPrice,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
            {/* REMOVIDO: <CartDrawer /> - Agora ele deve ser renderizado na Navbar */}
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