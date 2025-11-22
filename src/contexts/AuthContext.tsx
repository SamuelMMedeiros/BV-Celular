import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";

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

    // --- FUNÇÃO DE LOGIN (AGORA IMPLEMENTADA CORRETAMENTE) ---
    const signIn = useCallback(async (email: string, pass: string) => {
        log(`🔐 Tentando login para: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        
        if (error) {
            log("🔥 Erro no login (Supabase):", error);
            throw error;
        }
        
        log("✅ Login Supabase bem sucedido!", data);
        // O onAuthStateChange vai capturar a mudança de sessão e carregar o perfil
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
                try {
                    const text = await adminRes.text();
                    log("❌ Erro Admin Body:", text);
                } catch (e) { log("❌ Erro ao ler body do erro admin"); }
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
                localStorage.setItem(WHOLESALE_PROFILE_KEY, JSON.stringify(data));
                return;
            }

            log("⚠️ Nenhum perfil especial encontrado. Usuário é Cliente Comum.");
            setEmployeeProfile(null);
            setWholesaleProfile(null);

        } catch (error) {
            log("🔥 ERRO CRÍTICO NO FETCH:", error);
        }
    };

    useEffect(() => {
        let mounted = true;
        log("🚀 AuthProvider Montado. Loading: true");

        const initAuth = async () => {
            try {
                log("🔍 Buscando sessão inicial...");
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                
                if (error) log("❌ Erro getSession:", error);

                if (initialSession?.user) {
                    log("👤 Sessão restaurada para:", initialSession.user.email);
                    if (mounted) {
                        setSession(initialSession);
                        setUser(initialSession.user);
                        await fetchProfileFromBackend(initialSession.access_token);
                    }
                } else {
                    log("💨 Nenhuma sessão inicial (Deslogado)");
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
            log(`🔄 Evento Auth Detectado: ${event}`);
            
            if (newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);
                
                // Só recarrega perfil se for login ou mudança de token
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    log("📥 Carregando perfil após login/refresh...");
                    setLoading(true); // Mostra a tela preta de carregamento rapidinho
                    await fetchProfileFromBackend(newSession.access_token);
                    setLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                 log("👋 Usuário deslogou.");
                 setSession(null); 
                 setUser(null);
                 setEmployeeProfile(null);
                 setWholesaleProfile(null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({
        session, 
        user, 
        employeeProfile, 
        wholesaleProfile, 
        isWholesale: !!wholesaleProfile, 
        loading, 
        signIn, // <--- AGORA ESTÁ PASSANDO A FUNÇÃO CORRETA
        logout
    }), [session, user, employeeProfile, wholesaleProfile, loading, signIn, logout]);

    // Renderização Condicional do Debug (Tela Preta)
    if (loading) {
        return <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'black', color: '#0f0', zIndex: 9999, padding: '2rem', fontFamily: 'monospace'
        }}>
            <h1 className="text-2xl font-bold mb-4">DEBUG AUTH LOADING...</h1>
            <p>Verifique o Console (F12) para os logs [AUTH DEBUG]</p>
        </div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
