import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";

// --- INTERFACE (Mantida igual para não quebrar o resto do projeto) ---
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
    // Estados principais
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados de perfil (Inicializa do cache para performance)
    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(() => {
        try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || "null"); } catch { return null; }
    });
    
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(() => {
        try { return JSON.parse(localStorage.getItem(WHOLESALE_PROFILE_KEY) || "null"); } catch { return null; }
    });

    // --- FUNÇÃO 1: Logout Seguro ---
    const logout = useCallback(async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Erro no logout:", error);
        } finally {
            // Limpa tudo localmente independente de erro na API
            setSession(null);
            setUser(null);
            setEmployeeProfile(null);
            setWholesaleProfile(null);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
            localStorage.removeItem(WHOLESALE_PROFILE_KEY);
            setLoading(false);
            window.location.href = "/"; // Refresh forçado para limpar memória
        }
    }, []);

    // --- FUNÇÃO 2: Busca Perfil no Backend (Netlify Functions) ---
    const fetchProfileFromBackend = async (token: string) => {
        try {
            // Tenta Admin
            const adminRes = await fetch("/api/get-admin-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (adminRes.ok) {
                const adminData = await adminRes.json();
                setEmployeeProfile(adminData);
                setWholesaleProfile(null);
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminData));
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                return;
            }

            // Tenta Atacado
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

            // Se falhou ambos, limpa perfis (é cliente comum)
            setEmployeeProfile(null);
            setWholesaleProfile(null);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
            localStorage.removeItem(WHOLESALE_PROFILE_KEY);

        } catch (error) {
            console.error("Erro ao buscar perfil:", error);
            // Em caso de erro de rede, não fazemos nada drástico, 
            // apenas deixamos o usuário navegar como visitante/cliente.
        }
    };

    // --- EFEITO: Inicialização e Monitoramento ---
    useEffect(() => {
        let mounted = true;

        // 1. Função de inicialização
        const initAuth = async () => {
            try {
                // Pega sessão do Supabase (que já recupera do LocalStorage)
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                
                if (!mounted) return;

                if (initialSession?.user) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    // Busca perfil atualizado no backend
                    await fetchProfileFromBackend(initialSession.access_token);
                } else {
                    // Sem usuário logado
                    setSession(null);
                    setUser(null);
                    setEmployeeProfile(null);
                    setWholesaleProfile(null);
                }
            } catch (err) {
                console.error("Erro na inicialização do Auth:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // 2. Escuta mudanças de evento (Login, Logout, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;
            
            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (event === 'SIGNED_IN' || (event === 'TOKEN_REFRESHED' && newSession)) {
                await fetchProfileFromBackend(newSession!.access_token);
            } else if (event === 'SIGNED_OUT') {
                setEmployeeProfile(null);
                setWholesaleProfile(null);
                localStorage.removeItem(ADMIN_PROFILE_KEY);
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
            }
            
            setLoading(false);
        });

        // 3. TRAVA DE SEGURANÇA (TIMEOUT)
        // Se por qualquer motivo o loading ficar true por 3 segundos, destrava a tela.
        // Isso impede a "Tela Branca da Morte".
        const safetyTimer = setTimeout(() => {
            if (mounted) {
                setLoading((currentLoading) => {
                    if (currentLoading) {
                        console.warn("⚠️ Auth Timeout: Forçando liberação da tela.");
                        return false; 
                    }
                    return currentLoading;
                });
            }
        }, 3000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
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
        loading,
        signIn,
        logout
    }), [session, user, employeeProfile, wholesaleProfile, loading, signIn, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- HOOK EXPORTADO (Essencial para não quebrar outros arquivos) ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};