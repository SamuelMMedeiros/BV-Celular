import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types";
import { fetchEmployeeProfile } from "@/lib/api";

// Define o tipo do que será compartilhado pelo Context
interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null; // O perfil do Admin/Funcionário
    loading: boolean;
    logout: () => Promise<void>; // Adiciona a função de logout
}

// Cria o Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o "Provedor" (o componente que vai envolver nosso App)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Função para buscar sessão E perfil de funcionário
        const getSessionAndProfile = async (currentSession: Session | null) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                try {
                    // Se há uma sessão, verifica se é um funcionário
                    const profile = await fetchEmployeeProfile(
                        currentSession.user.id
                    );
                    setEmployeeProfile(profile); // Será 'null' se não for funcionário
                } catch (error) {
                    console.error(
                        "Erro ao buscar perfil de funcionário:",
                        error
                    );
                    setEmployeeProfile(null);
                }
            } else {
                setEmployeeProfile(null);
            }
            setLoading(false);
        };

        // 2. Busca a sessão inicial
        supabase.auth
            .getSession()
            .then(({ data: { session: currentSession } }) => {
                getSessionAndProfile(currentSession);
            });

        // 3. Ouve mudanças no estado de autenticação (Login, Logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                // Se um Cliente logar, newSession vai existir, mas o profile será 'null'
                await getSessionAndProfile(newSession);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        // O listener acima vai cuidar de limpar o estado
    };

    const value = {
        session,
        user,
        employeeProfile,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Cria um hook customizado para facilitar o uso do contexto
//
// CORREÇÃO AQUI: Adicionamos 'export'
//
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
};
