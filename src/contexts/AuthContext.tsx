/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types"; // Importar
import { fetchEmployeeProfile, fetchWholesaleProfile } from "@/lib/api"; // Importar

interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null;
    wholesaleProfile: WholesaleClient | null; // <-- NOVO
    isWholesale: boolean; // <-- NOVO
    loading: boolean;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

const ADMIN_PROFILE_KEY = "bv_admin_profile";
const WHOLESALE_PROFILE_KEY = "bv_wholesale_profile"; // <-- Cache

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Admin Profile
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

    // Wholesale Profile
    const [wholesaleProfile, setWholesaleProfile] =
        useState<WholesaleClient | null>(() => {
            try {
                const stored = localStorage.getItem(WHOLESALE_PROFILE_KEY);
                return stored ? JSON.parse(stored) : null;
            } catch {
                return null;
            }
        });

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
                    // 1. Tenta Admin
                    const profile = await fetchEmployeeProfile(
                        sessionFromEvent.user.id
                    );
                    if (mounted) {
                        if (profile) {
                            setEmployeeProfile(profile);
                            localStorage.setItem(
                                ADMIN_PROFILE_KEY,
                                JSON.stringify(profile)
                            );
                        } else {
                            setEmployeeProfile(null);
                            localStorage.removeItem(ADMIN_PROFILE_KEY);
                        }
                    }

                    // 2. Tenta Atacado
                    const wholesale = await fetchWholesaleProfile();
                    if (mounted) {
                        if (wholesale) {
                            setWholesaleProfile(wholesale);
                            localStorage.setItem(
                                WHOLESALE_PROFILE_KEY,
                                JSON.stringify(wholesale)
                            );
                        } else {
                            setWholesaleProfile(null);
                            localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                        }
                    }
                } catch (error) {
                    console.error("Erro ao validar perfis:", error);
                }
            } else {
                if (mounted) {
                    setEmployeeProfile(null);
                    localStorage.removeItem(ADMIN_PROFILE_KEY);
                    setWholesaleProfile(null);
                    localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                }
            }

            if (mounted) setLoading(false);
        };

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
        setWholesaleProfile(null);
        localStorage.removeItem(ADMIN_PROFILE_KEY);
        localStorage.removeItem(WHOLESALE_PROFILE_KEY);
    };

    const value = {
        session,
        user,
        employeeProfile,
        wholesaleProfile,
        isWholesale: !!wholesaleProfile,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};