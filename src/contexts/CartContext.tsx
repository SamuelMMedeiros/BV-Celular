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
import { Product, Store, CartItem, Coupon } from "@/types";
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
    TicketPercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { fetchStores, createOrder, upsertClient, fetchCoupon } from "@/lib/api";
import { useCustomerAuth } from "./CustomerAuthContext";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    
    // Novos campos para Cupom
    subtotal: number;
    discountAmount: number;
    totalPrice: number;
    coupon: Coupon | null;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
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

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    const itemCount = useMemo(
        () => cartItems.reduce((count, item) => count + item.quantity, 0),
        [cartItems]
    );

    // 1. Calcula Subtotal
    const subtotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]);

    // 2. Calcula Desconto
    const discountAmount = useMemo(() => {
        if (!coupon) return 0;
        // Preço em centavos * porcentagem / 100
        return Math.round(subtotal * (coupon.discount_percent / 100));
    }, [subtotal, coupon]);

    // 3. Total Final
    const totalPrice = subtotal - discountAmount;

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
        setCoupon(null); // Limpa cupom ao limpar carrinho
    }, []);

    // Lógica do Cupom
    const applyCoupon = async (code: string) => {
        if (!code) return false;
        const foundCoupon = await fetchCoupon(code);
        if (foundCoupon) {
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

// --- COMPONENTE VISUAL (CART DRAWER) ---
import { CartDrawer as DrawerComponent } from "@/components/CartDrawer"; 
