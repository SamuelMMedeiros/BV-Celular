/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types";
import { fetchEmployeeProfile } from "@/lib/api";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null;
    loading: boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

const ADMIN_PROFILE_KEY = "bv_admin_profile"; // Chave para o LocalStorage

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // 1. INICIALIZAÇÃO COM CACHE (Carrega instantaneamente)
    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(
        () => {
            try {
                const stored = localStorage.getItem(ADMIN_PROFILE_KEY);
                return stored ? JSON.parse(stored) : null;
            } catch {
                return null;
            }
        }
    );

    // Se tiver perfil em cache, não começa carregando (tela branca evitada!)
    const [loading, setLoading] = useState(!employeeProfile);

    useEffect(() => {
        let mounted = true;

        const getSessionAndProfile = async (
            sessionFromEvent: Session | null
        ) => {
            if (!mounted) return;

            setSession(sessionFromEvent);
            setUser(sessionFromEvent?.user ?? null);

            if (sessionFromEvent?.user) {
                try {
                    // Busca dados atualizados do banco (usando a nova RPC rápida)
                    const profile = await fetchEmployeeProfile(
                        sessionFromEvent.user.id
                    );

                    if (mounted) {
                        if (profile) {
                            console.log(
                                "[Auth] Perfil Admin atualizado/confirmado."
                            );
                            setEmployeeProfile(profile);
                            // Salva no cache para o próximo reload
                            localStorage.setItem(
                                ADMIN_PROFILE_KEY,
                                JSON.stringify(profile)
                            );
                        } else {
                            console.warn(
                                "[Auth] Usuário logado mas não é Admin. Limpando acesso."
                            );
                            setEmployeeProfile(null);
                            localStorage.removeItem(ADMIN_PROFILE_KEY);
                        }
                    }
                } catch (error) {
                    console.error("[Auth] Erro ao validar perfil:", error);
                    // Em caso de erro de rede, mantemos o perfil do cache se existir (fallback)
                    // Não limpamos o estado para não deslogar o usuário por instabilidade
                }
            } else {
                // Se não tem sessão, limpa tudo
                if (mounted) {
                    setEmployeeProfile(null);
                    localStorage.removeItem(ADMIN_PROFILE_KEY);
                }
            }

            if (mounted) setLoading(false);
        };

        // Fluxo de inicialização
        supabase.auth.getSession().then(({ data: { session } }) => {
            getSessionAndProfile(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                getSessionAndProfile(session);
            }
        );

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setEmployeeProfile(null);
        localStorage.removeItem(ADMIN_PROFILE_KEY); // Limpa cache ao sair
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
