/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    refetchProfile: () => Promise<void>;
    isLoadingSession: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
    undefined
);

// Helper para extrair o perfil do objeto User
const extractProfile = (session: Session | null): CustomerProfile | null => {
    if (!session?.user) return null;

    const metadata = session.user.user_metadata;
    if (metadata && metadata.full_name && metadata.phone) {
        return {
            id: session.user.id,
            email: session.user.email || "",
            name: metadata.full_name as string,
            phone: metadata.phone as string,
        };
    }

    if (session.user.email) {
        return {
            id: session.user.id,
            email: session.user.email,
            name: "Cliente",
            phone: "",
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
    // Inicia como true para o carregamento inicial da página
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // Função para buscar o perfil e a sessão
    const fetchSessionAndProfile = useCallback(
        async (currentSession: Session | null) => {
            // --- CORREÇÃO IMPORTANTE ---
            // Removemos o setIsLoadingSession(true) daqui.
            // Isso evita que a tela "pisque" com skeletons toda vez que você troca de aba.
            // A variável isLoadingSession continua controlando apenas o carregamento INICIAL.

            setSession(currentSession);

            if (currentSession?.user) {
                try {
                    const { data, error } = await supabase
                        .from("Clients")
                        .select("id, name, phone, email")
                        .eq("id", currentSession.user.id)
                        .maybeSingle();

                    if (error) {
                        throw error;
                    }

                    if (data) {
                        setProfile(data as CustomerProfile);
                    } else {
                        setProfile(extractProfile(currentSession));
                    }
                } catch (error: any) {
                    console.error(
                        "Erro ao buscar perfil do cliente (Context):",
                        error.message
                    );
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            // Garantimos que o loading termine após a primeira verificação
            setIsLoadingSession(false);
        },
        []
    );

    const refetchProfile = useCallback(async () => {
        // Aqui podemos manter o loading opcionalmente, ou removê-lo se preferir uma atualização silenciosa
        // Por segurança, vamos manter false aqui também ou gerenciar um estado de 'isUpdating' separado se necessário.
        // Mas para simplificar e evitar o travamento, não vamos bloquear a UI globalmente.
        const {
            data: { session: currentSession },
        } = await supabase.auth.getSession();
        await fetchSessionAndProfile(currentSession);
    }, [fetchSessionAndProfile]);

    useEffect(() => {
        supabase.auth
            .getSession()
            .then(({ data: { session: currentSession } }) => {
                fetchSessionAndProfile(currentSession);
            });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                fetchSessionAndProfile(newSession);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [fetchSessionAndProfile]);

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
                    data: {
                        full_name: name,
                        phone: phone.replace(/\D/g, ""),
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

            toast({
                title: "Sucesso!",
                description:
                    "Verifique seu email para confirmar sua conta e fazer o login.",
                variant: "default",
            });
        },
        [toast]
    );

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

            toast({
                title: "Bem-vindo!",
                description: "Login concluído com sucesso.",
            });
        },
        [toast]
    );

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
    }, []);

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
        () => !!session && !!profile && !isLoadingSession,
        [session, profile, isLoadingSession]
    );

    const value = {
        profile,
        isLoggedIn,
        session,
        signUp,
        signIn,
        logout,
        getGreeting,
        refetchProfile,
        isLoadingSession,
    };

    return (
        <CustomerAuthContext.Provider value={value}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) {
        throw new Error(
            "useCustomerAuth deve ser usado dentro de um CustomerAuthProvider"
        );
    }
    return context;
};
