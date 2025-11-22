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
    const [loadingMessage, setLoadingMessage] = useState("Iniciando...");

    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(() => {
        try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || "null"); } catch { return null; }
    });
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(() => {
        try { return JSON.parse(localStorage.getItem(WHOLESALE_PROFILE_KEY) || "null"); } catch { return null; }
    });

    const log = (msg: string, data?: any) => console.log(`%c[AUTH] ${msg}`, 'color: #00ffff', data || '');

    const logout = useCallback(async () => {
        setLoading(true);
        setLoadingMessage("Saindo...");
        await supabase.auth.signOut();
        localStorage.clear(); // Limpa tudo para garantir
        window.location.href = "/"; 
    }, []);

    // FETCH COM TIMEOUT E ABORT CONTROLLER
    const fetchProfileFromBackend = async (token: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos max

        try {
            log("📡 Buscando perfil (max 5s)...");
            
            // Tenta Admin
            const adminRes = await fetch("/api/get-admin-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                signal: controller.signal
            });

            if (adminRes.ok) {
                const data = await adminRes.json();
                log("✅ Perfil Admin carregado");
                setEmployeeProfile(data);
                setWholesaleProfile(null);
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data));
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                return;
            }

            // Tenta Atacado
            const wholesaleRes = await fetch("/api/get-wholesale-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                signal: controller.signal
            });

            if (wholesaleRes.ok) {
                const data = await wholesaleRes.json();
                log("✅ Perfil Atacado carregado");
                setWholesaleProfile(data);
                setEmployeeProfile(null);
                localStorage.setItem(WHOLESALE_PROFILE_KEY, JSON.stringify(data));
                localStorage.removeItem(ADMIN_PROFILE_KEY);
                return;
            }

            log("⚠️ Nenhum perfil especial. Cliente comum.");
            setEmployeeProfile(null);
            setWholesaleProfile(null);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                log("⏳ Timeout na busca de perfil. Liberando tela.");
            } else {
                log("🔥 Erro no fetch de perfil:", error);
            }
            // Mantém o que tiver no cache ou assume cliente comum
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // Inicialização
    useEffect(() => {
        let mounted = true;
        
        const init = async () => {
            setLoadingMessage("Verificando sessão...");
            try {
                const { data: { session: initSession } } = await supabase.auth.getSession();
                
                if (initSession?.user) {
                    log("👤 Sessão encontrada");
                    setSession(initSession);
                    setUser(initSession.user);
                    await fetchProfileFromBackend(initSession.access_token);
                } else {
                    log("👤 Sem sessão (Visitante)");
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            log(`🔄 Evento: ${event}`);
            
            if (newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);
                
                // Só bloqueia a tela no LOGIN EXPLICITO. No refresh de token, faz em background.
                if (event === 'SIGNED_IN') {
                    setLoading(true);
                    setLoadingMessage("Carregando perfil...");
                    await fetchProfileFromBackend(newSession.access_token);
                    setLoading(false);
                } else if (event === 'TOKEN_REFRESHED') {
                    // Background update
                    fetchProfileFromBackend(newSession.access_token);
                }
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setEmployeeProfile(null);
                setWholesaleProfile(null);
                setLoading(false);
            }
        });

        return () => { mounted = false; subscription.unsubscribe(); };
    }, []);

    const signIn = useCallback(async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    }, []);

    const value = useMemo(() => ({
        session, user, employeeProfile, wholesaleProfile, isWholesale: !!wholesaleProfile, loading, signIn, logout
    }), [session, user, employeeProfile, wholesaleProfile, loading, signIn, logout]);

    // TELA DE LOADING COM BOTÃO DE EMERGÊNCIA
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black text-green-400 z-[9999] flex flex-col items-center justify-center p-4 font-mono">
                <div className="animate-pulse mb-4 text-xl">🔐 {loadingMessage}</div>
                <div className="text-xs text-gray-500 mb-8">Aguardando resposta do servidor...</div>
                
                <button 
                    onClick={() => setLoading(false)}
                    className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-900 rounded text-sm transition-colors"
                >
                    ⚠️ DEMORANDO MUITO? CLIQUE AQUI PARA ENTRAR
                </button>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
