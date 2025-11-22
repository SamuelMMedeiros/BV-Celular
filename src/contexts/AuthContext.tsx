import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";

// Mantendo a interface EXATA que seu projeto já usa
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE_KEY = "bv_admin_profile";
const WHOLESALE_PROFILE_KEY = "bv_wholesale_profile";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    
    // Estados compatíveis com o código antigo
    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(() => {
        try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || "null"); } catch { return null; }
    });
    
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(() => {
        try { return JSON.parse(localStorage.getItem(WHOLESALE_PROFILE_KEY) || "null"); } catch { return null; }
    });

    const [loading, setLoading] = useState(true);

    // Função de Logout compatível
    const logout = useCallback(async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setEmployeeProfile(null);
        setWholesaleProfile(null);
        localStorage.removeItem(ADMIN_PROFILE_KEY);
        localStorage.removeItem(WHOLESALE_PROFILE_KEY);
        setLoading(false);
        window.location.href = "/"; 
    }, []);

    // Nova lógica segura (Netlify Functions) mas populando as variáveis antigas
    const fetchProfileFromBackend = async (token: string) => {
        try {
            // 1. Tenta buscar perfil de ADMIN
            const adminRes = await fetch("/api/get-admin-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (adminRes.ok) {
                const adminData = await adminRes.json();
                setEmployeeProfile(adminData); // Salva onde o ProtectedRoute procura
                setWholesaleProfile(null);
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminData));
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                return;
            }

            // 2. Tenta perfil de ATACADO
            const wholesaleRes = await fetch("/api/get-wholesale-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (wholesaleRes.ok) {
                const wholesaleData = await wholesaleRes.json();
                setWholesaleProfile(wholesaleData);
                setEmployeeProfile(null);
                localStorage.setItem(WHOLESALE_PROFILE_KEY, JSON.stringify(wholesaleData));
                localStorage.removeItem(ADMIN_PROFILE_KEY);
                return;
            }

            // 3. Cliente comum
            setEmployeeProfile(null);
            setWholesaleProfile(null);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
            localStorage.removeItem(WHOLESALE_PROFILE_KEY);

        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            // Em caso de erro, não quebra a aplicação, apenas assume sem permissão
            setEmployeeProfile(null);
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
                        await fetchProfileFromBackend(initialSession.access_token);
                    } else {
                        setEmployeeProfile(null);
                        setWholesaleProfile(null);
                    }
                }
            } catch (err) {
                console.error("Auth init error:", err);
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
                await fetchProfileFromBackend(newSession.access_token);
            } else {
                setEmployeeProfile(null);
                setWholesaleProfile(null);
            }
            setLoading(false);
        });

        // Timeout de segurança para destravar a tela se a API demorar
        const safetyTimeout = setTimeout(() => {
            if (loading && mounted) {
                setLoading(false);
            }
        }, 4000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    const signIn = useCallback(async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    }, []);

    const value = useMemo(() => ({
        session,
        user,
        employeeProfile,    // Mantido para compatibilidade
        wholesaleProfile,   // Mantido para compatibilidade
        isWholesale: !!wholesaleProfile, // Mantido para compatibilidade
        loading,
        signIn,
        logout
    }), [session, user, employeeProfile, wholesaleProfile, loading, signIn, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// === O HOOK QUE FALTAVA ===
// Adicionando isso, os outros arquivos voltam a funcionar
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};