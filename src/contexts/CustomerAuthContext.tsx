//
// === CÓDIGO COMPLETO PARA: src/contexts/CustomerAuthContext.tsx ===
//
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { CustomerProfile } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

// Definição do Tipo de Contexto
interface CustomerAuthContextType {
    session: Session | null;
    profile: CustomerProfile | null;
    isLoggedIn: boolean;
    signUp: (
        email: string,
        password: string,
        name: string,
        phone: string
    ) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => void;
    getGreeting: () => string;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
    undefined
);

// Helper para extrair o perfil do objeto User
const extractProfile = (session: Session | null): CustomerProfile | null => {
    if (!session?.user) return null;

    // Assegura que os metadados existam e tenham os campos que precisamos
    const metadata = session.user.user_metadata;
    if (metadata && metadata.full_name && metadata.phone) {
        return {
            id: session.user.id,
            name: metadata.full_name as string,
            phone: metadata.phone as string,
        };
    }
    return null;
};

// --- Provider ---
export const CustomerAuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { toast } = useToast();
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // 1. Lógica para buscar sessão e perfil na inicialização e em mudanças de Auth
    useEffect(() => {
        const fetchSessionAndProfile = (currentSession: Session | null) => {
            setSession(currentSession);
            setProfile(extractProfile(currentSession));
            setIsLoadingSession(false);
        };

        // 1a. Tenta buscar a sessão no Local Storage
        supabase.auth
            .getSession()
            .then(({ data: { session: currentSession } }) => {
                fetchSessionAndProfile(currentSession);
            });

        // 1b. Ouve mudanças em tempo real (login/logout/refresh)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                fetchSessionAndProfile(newSession);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    // 2. Funções de Ação (Nova Lógica Email/Senha)

    // A. Registro
    const signUp = useCallback(
        async (
            email: string,
            password: string,
            name: string,
            phone: string
        ) => {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Salva nome e telefone no metadata (user_metadata)
                    data: {
                        full_name: name,
                        phone: phone.replace(/\D/g, ""), // Limpa o telefone para salvar apenas dígitos
                    },
                },
            });

            if (error) {
                toast({
                    title: "Erro no Cadastro",
                    description: error.message,
                    variant: "destructive",
                });
                throw error;
            }

            // Supabase envia um email de confirmação por padrão.
            toast({
                title: "Sucesso!",
                description:
                    "Verifique seu email para confirmar sua conta e fazer o login.",
                variant: "default",
            });
        },
        [toast]
    );

    // B. Login
    const signIn = useCallback(
        async (email: string, password: string) => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast({
                    title: "Login Falhou",
                    description: error.message,
                    variant: "destructive",
                });
                throw error;
            }

            // O useEffect do listener acima cuidará de atualizar o estado (session/profile)
            toast({
                title: "Bem-vindo!",
                description: "Login concluído com sucesso.",
            });
        },
        [toast]
    );

    // C. Logout
    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
    }, []);

    // 3. Lógica de Saudação
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

        const firstName = profile.name.split(" ")[0];
        return `${greeting}, ${firstName}`;
    }, [profile]);

    const isLoggedIn = useMemo(
        () => !!session && !isLoadingSession,
        [session, isLoadingSession]
    );

    const value = {
        profile,
        isLoggedIn,
        session,
        signUp,
        signIn,
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
