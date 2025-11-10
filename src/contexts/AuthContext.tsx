import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types"; // 1. Importar o tipo Employee
import { fetchEmployeeProfile } from "@/lib/api"; // 2. Importar a nova função

// 3. Define o tipo do que será compartilhado
interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null; // 4. Adicionar o perfil
    loading: boolean;
}

// Cria o Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o "Provedor"
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(
        null
    ); // 5. Adicionar estado do perfil
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 6. Função para buscar sessão E perfil
        const getSessionAndProfile = async () => {
            const {
                data: { session: currentSession },
            } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                // Se há uma sessão, busca o perfil
                try {
                    const profile = await fetchEmployeeProfile(
                        currentSession.user.id
                    );
                    setEmployeeProfile(profile);
                } catch (error) {
                    console.error(
                        "Falha ao buscar perfil no carregamento:",
                        error
                    );
                    setEmployeeProfile(null);
                }
            } else {
                setEmployeeProfile(null);
            }
            setLoading(false);
        };

        getSessionAndProfile();

        // 7. Ouve mudanças no estado de autenticação (Login, Logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    // Usuário FEZ LOGIN, busca o perfil
                    try {
                        const profile = await fetchEmployeeProfile(
                            newSession.user.id
                        );
                        setEmployeeProfile(profile);
                    } catch (error) {
                        console.error(
                            "Falha ao buscar perfil no login:",
                            error
                        );
                        setEmployeeProfile(null);
                    }
                } else {
                    // Usuário FEZ LOGOUT, limpa o perfil
                    setEmployeeProfile(null);
                }
            }
        );

        // 3. Limpa o "ouvinte" quando o componente desmontar
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const value = {
        session,
        user,
        employeeProfile, // 8. Fornecer o perfil
        loading,
    };

    // Compartilha 'session', 'user', 'employeeProfile' e 'loading' com todos os filhos
    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// Cria um hook customizado para facilitar o uso do contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
};
