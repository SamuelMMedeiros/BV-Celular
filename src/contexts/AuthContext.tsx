import { createContext, useEffect, useState, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";
import { fetchEmployeeProfile, fetchWholesaleProfile } from "@/lib/api";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null;
    wholesaleProfile: WholesaleClient | null;
    isWholesale: boolean;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

const ADMIN_PROFILE_KEY = "bv_admin_profile";
const WHOLESALE_PROFILE_KEY = "bv_wholesale_profile";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);

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

    const [wholesaleProfile, setWholesaleProfile] =
        useState<WholesaleClient | null>(() => {
            try {
                const stored = localStorage.getItem(WHOLESALE_PROFILE_KEY);
                return stored ? JSON.parse(stored) : null;
            } catch {
                return null;
            }
        });

    // Inicia carregando apenas se não tivermos dados em cache
    const [loading, setLoading] = useState(
        !employeeProfile && !wholesaleProfile
    );

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
                    // 1. Busca Perfil Admin
                    const profile = await fetchEmployeeProfile(
                        sessionFromEvent.user.id
                    );
                    if (mounted) {
                        setEmployeeProfile(profile);
                        if (profile)
                            localStorage.setItem(
                                ADMIN_PROFILE_KEY,
                                JSON.stringify(profile)
                            );
                        else localStorage.removeItem(ADMIN_PROFILE_KEY);
                    }

                    // 2. Busca Perfil Atacado
                    const wholesale = await fetchWholesaleProfile();
                    if (mounted) {
                        setWholesaleProfile(wholesale);
                        if (wholesale)
                            localStorage.setItem(
                                WHOLESALE_PROFILE_KEY,
                                JSON.stringify(wholesale)
                            );
                        else localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                    }
                } catch (error) {
                    console.error("Erro ao carregar perfis:", error);
                }
            } else {
                // Logout / Sem sessão
                if (mounted) {
                    setEmployeeProfile(null);
                    setWholesaleProfile(null);
                    localStorage.removeItem(ADMIN_PROFILE_KEY);
                    localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                }
            }

            if (mounted) setLoading(false);
        };

        // Inicialização
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

    const signIn = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });
        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setEmployeeProfile(null);
        setWholesaleProfile(null);
        localStorage.removeItem(ADMIN_PROFILE_KEY);
        localStorage.removeItem(WHOLESALE_PROFILE_KEY);
        setLoading(false);
    };

    // USEMEMO: A CORREÇÃO DO LOOP ESTÁ AQUI
    // Garante que o objeto 'value' só mude se os dados mudarem, evitando re-renders infinitos.
    const value = useMemo(
        () => ({
            session,
            user,
            employeeProfile,
            wholesaleProfile,
            isWholesale: !!wholesaleProfile,
            loading,
            signIn,
            logout,
        }),
        [session, user, employeeProfile, wholesaleProfile, loading]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
