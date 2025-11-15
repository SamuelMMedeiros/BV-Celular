import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { CustomerProfile } from "@/types";

// Nome da chave no localStorage
const STORAGE_KEY = "bv_celular_customer_profile";

// Definição do Tipo de Contexto
interface CustomerAuthContextType {
    profile: CustomerProfile | null;
    isLoggedIn: boolean;
    login: (name: string, phone: string) => void;
    logout: () => void;
    getGreeting: () => string;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
    undefined
);

// --- Provider ---
export const CustomerAuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [profile, setProfile] = useState<CustomerProfile | null>(null);

    // 1. Carrega o perfil do LocalStorage na montagem
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setProfile(JSON.parse(stored));
            }
        } catch (e) {
            console.error(
                "Failed to load customer profile from localStorage",
                e
            );
        }
    }, []);

    // 2. Persistência de Sessão no LocalStorage
    const persistProfile = useCallback((newProfile: CustomerProfile | null) => {
        if (newProfile) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        setProfile(newProfile);
    }, []);

    // 3. Funções de Ação
    const login = useCallback(
        (name: string, phone: string) => {
            const newProfile: CustomerProfile = { name, phone };
            persistProfile(newProfile);
        },
        [persistProfile]
    );

    const logout = useCallback(() => {
        persistProfile(null);
    }, [persistProfile]);

    // 4. Lógica de Saudação (Resolve 5)
    const getGreeting = useCallback((): string => {
        if (!profile) return "Entrar";

        const hour = new Date().getHours();
        let greeting = "Olá";

        if (hour >= 5 && hour < 12) {
            greeting = "Bom dia";
        } else if (hour >= 12 && hour < 18) {
            greeting = "Boa tarde";
        } else {
            greeting = "Boa noite";
        }

        // Usa apenas o primeiro nome
        const firstName = profile.name.split(" ")[0];
        return `${greeting}, ${firstName}`;
    }, [profile]);

    const isLoggedIn = useMemo(() => !!profile, [profile]);

    const value = {
        profile,
        isLoggedIn,
        login,
        logout,
        getGreeting,
    };

    return (
        <CustomerAuthContext.Provider value={value}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

// Hook de uso
export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) {
        throw new Error(
            "useCustomerAuth deve ser usado dentro de um CustomerAuthProvider"
        );
    }
    return context;
};
