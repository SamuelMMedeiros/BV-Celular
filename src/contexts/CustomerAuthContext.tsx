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
    isLoadingSession: boolean; // <-- ESTA LINHA FOI ADICIONADA
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
            // (O email vem do nível superior do user, não do metadata)
            email: session.user.email || "",
            name: metadata.full_name as string,
            phone: metadata.phone as string,
        };
    }
    // Fallback caso o metadata não exista, mas o usuário sim
    if (session.user.email) {
        return {
            id: session.user.id,
            email: session.user.email,
            name: "Cliente", // Nome padrão
            phone: "", // Telefone padrão
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

    // Função para buscar o perfil e a sessão (usada na inicialização e no refetch)
    const fetchSessionAndProfile = useCallback(
        async (currentSession: Session | null) => {
            setIsLoadingSession(true); // <-- GARANTE QUE O LOADING É TRUE NO INÍCIO
            setSession(currentSession);

            if (currentSession?.user) {
                // Se o usuário está logado, tentamos buscar o perfil na tabela 'Clients'
                try {
                    // Usamos a função da API para buscar o perfil no DB
                    const { data, error } = await supabase
                        .from("Clients")
                        .select("id, name, phone, email")
                        .eq("id", currentSession.user.id)
                        .single();

                    if (error && error.code !== "PGRST116") {
                        // Ignora erro "não encontrado"
                        throw error;
                    }

                    if (data) {
                        setProfile(data as CustomerProfile);
                    } else {
                        // Se não achou na tabela Clients (ex: só se cadastrou no Auth),
                        // extrai do metadata
                        setProfile(extractProfile(currentSession));
                    }
                } catch (error: any) {
                    console.error(
                        "Erro ao buscar perfil do cliente (Context):",
                        error.message
                    );
                    setProfile(null); // Falha na busca
                }
            } else {
                // Se não há sessão, não há perfil
                setProfile(null);
            }

            setIsLoadingSession(false); // <-- FINALIZA O LOADING
        },
        []
    );

    // Função para forçar a re-busca dos dados da sessão e do perfil
    const refetchProfile = useCallback(async () => {
        setIsLoadingSession(true);
        const {
            data: { session: currentSession },
        } = await supabase.auth.getSession();
        await fetchSessionAndProfile(currentSession);
    }, [fetchSessionAndProfile]);

    // 1. Lógica para buscar sessão e perfil na inicialização e em mudanças de Auth
    useEffect(() => {
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
    }, [fetchSessionAndProfile]);

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
            greeting = "Boa noite";
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
        isLoadingSession, // <-- ESTA LINHA FOI ADICIONADA
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
