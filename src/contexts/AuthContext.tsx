import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null;
    wholesaleProfile: WholesaleClient | null;
    isWholesale: boolean;
    role: 'admin' | 'wholesale' | 'customer' | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE_KEY = "bv_admin_profile";
const WHOLESALE_PROFILE_KEY = "bv_wholesale_profile";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'wholesale' | 'customer' | null>(null);
    
    // Inicia lendo do cache para evitar flicker
    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(() => {
        try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || "null"); } catch { return null; }
    });
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(() => {
        try { return JSON.parse(localStorage.getItem(WHOLESALE_PROFILE_KEY) || "null"); } catch { return null; }
    });

    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setRole(null);
        setEmployeeProfile(null);
        setWholesaleProfile(null);
        localStorage.removeItem(ADMIN_PROFILE_KEY);
        localStorage.removeItem(WHOLESALE_PROFILE_KEY);
        window.location.href = "/"; // Força recarregamento limpo
    }, []);

    const fetchProfileFromNetlify = async (token: string, userId: string) => {
        try {
            // 1. Tenta buscar perfil de ADMIN na Function
            const adminRes = await fetch("/api/get-admin-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (adminRes.ok) {
                const adminData = await adminRes.json();
                setEmployeeProfile(adminData);
                setRole('admin');
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminData));
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                return;
            }

            // 2. Se falhou, tenta perfil de ATACADO
            const wholesaleRes = await fetch("/api/get-wholesale-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (wholesaleRes.ok) {
                const wholesaleData = await wholesaleRes.json();
                setWholesaleProfile(wholesaleData);
                setRole('wholesale');
                localStorage.setItem(WHOLESALE_PROFILE_KEY, JSON.stringify(wholesaleData));
                localStorage.removeItem(ADMIN_PROFILE_KEY);
                return;
            }

            // 3. Se não é nenhum, é Customer
            setRole('customer');
            setEmployeeProfile(null);
            setWholesaleProfile(null);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
            localStorage.removeItem(WHOLESALE_PROFILE_KEY);

        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            // Não deslogamos em erro de rede, apenas assumimos customer temporariamente
            setRole('customer');
        }
    };

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                
                if (mounted) {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.access_token && initialSession?.user) {
                        await fetchProfileFromNetlify(initialSession.access_token, initialSession.user.id);
                    } else {
                        // Sem sessão
                        setEmployeeProfile(null);
                        setWholesaleProfile(null);
                        setRole(null);
                    }
                }
            } catch (err) {
                console.error("Erro auth init:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (!mounted) return;
            
            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.access_token && newSession?.user) {
                // Se o usuário mudou ou token mudou, revalida
                await fetchProfileFromNetlify(newSession.access_token, newSession.user.id);
            } else {
                setRole(null);
                setEmployeeProfile(null);
                setWholesaleProfile(null);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    }, []);

    const value = useMemo(() => ({
        session,
        user,
        employeeProfile,
        wholesaleProfile,
        isWholesale: !!wholesaleProfile,
        role,
        loading,
        signIn,
        logout
    }), [session, user, employeeProfile, wholesaleProfile, role, loading, signIn, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};