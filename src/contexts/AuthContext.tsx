import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";

// --- MANTENDO INTERFACES ---
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
    const [loading, setLoading] = useState(true);

    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(null);

    // --- LOGGER AUXILIAR ---
    const log = (step: string, data?: any) => {
        console.log(`%c[AUTH DEBUG] ${step}`, 'background: #222; color: #bada55; font-size: 12px;', data || '');
    };

    const logout = useCallback(async () => {
        log("Logout iniciado");
        setLoading(true);
        await supabase.auth.signOut();
        window.location.href = "/"; 
    }, []);

    const fetchProfileFromBackend = async (token: string) => {
        log("📡 Iniciando fetch no backend...");
        try {
            // ADMIN
            log("📡 Tentando /api/get-admin-profile");
            const adminRes = await fetch("/api/get-admin-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            log(`📡 Status Admin: ${adminRes.status}`);
            
            if (adminRes.ok) {
                const data = await adminRes.json();
                log("✅ Admin encontrado:", data);
                setEmployeeProfile(data);
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data));
                return;
            } else {
                const text = await adminRes.text();
                log("❌ Erro Admin Body:", text);
            }

            // ATACADO
            log("📡 Tentando /api/get-wholesale-profile");
            const wholesaleRes = await fetch("/api/get-wholesale-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            
            if (wholesaleRes.ok) {
                const data = await wholesaleRes.json();
                log("✅ Atacado encontrado:", data);
                setWholesaleProfile(data);
                return;
            }

            log("⚠️ Nenhum perfil encontrado no backend.");
            setEmployeeProfile(null);

        } catch (error) {
            log("🔥 ERRO CRÍTICO NO FETCH:", error);
        }
    };

    useEffect(() => {
        let mounted = true;
        log("🚀 AuthProvider Montado. Loading: true");

        const initAuth = async () => {
            try {
                log("🔍 Buscando sessão no Supabase...");
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                
                if (error) log("❌ Erro getSession:", error);

                if (initialSession?.user) {
                    log("👤 Sessão encontrada para:", initialSession.user.email);
                    if (mounted) {
                        setSession(initialSession);
                        setUser(initialSession.user);
                        await fetchProfileFromBackend(initialSession.access_token);
                    }
                } else {
                    log("💨 Nenhuma sessão encontrada (Usuário deslogado)");
                }
            } catch (err) {
                log("🔥 Erro Geral Init:", err);
            } finally {
                log("🏁 Loading definido para FALSE");
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            log(`🔄 Evento Auth: ${event}`);
            if (event === 'SIGNED_IN' && newSession) {
                setLoading(true); // Trava a tela pra carregar perfil
                await fetchProfileFromBackend(newSession.access_token);
                setLoading(false);
            }
            if (event === 'SIGNED_OUT') {
                 setSession(null); setUser(null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({
        session, user, employeeProfile, wholesaleProfile, isWholesale: !!wholesaleProfile, loading, signIn: async () => {}, logout
    }), [session, user, employeeProfile, wholesaleProfile, loading, logout]);

    // Renderização Condicional do Debug
    if (loading) {
        return <div style={{padding: 50, background: 'black', color: 'white'}}>
            <h1>CARREGANDO AUTH...</h1>
            <p>Abra o console (F12)</p>
        </div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
