/* eslint-disable @typescript-eslint/no-explicit-any */
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
    logout: () => Promise<void>;
}

// Cria o Context
// CORREÇÃO: Exportamos o Context para o hook poder usá-lo
export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

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
            setLoading(true); // <-- Mantém true aqui até o fim

            if (currentSession?.user) {
                // !!! ESTA É A CORREÇÃO CRÍTICA !!!
                // Envolvemos a busca de perfil em um try...catch.
                // Se um cliente estiver logado, fetchEmployeeProfile VAI falhar.
                // Não podemos deixar esse erro quebrar o React.
                try {
                    const profile = await fetchEmployeeProfile(
                        currentSession.user.id
                    );
                    setEmployeeProfile(profile); // Será null se for cliente, o que está correto.
                } catch (error: any) {
                    console.error(
                        "Falha ao buscar perfil de funcionário (AuthContext):",
                        error.message
                    );
                    // Garante que o perfil de funcionário é nulo em caso de erro
                    setEmployeeProfile(null);
                }
            } else {
                setEmployeeProfile(null);
            }
            // Define o loading como false APÓS tudo ter sido processado
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
                await getSessionAndProfile(newSession);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        employeeProfile,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
