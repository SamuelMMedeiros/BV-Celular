// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Employee, WholesaleClient } from "@/types";
import { Loader2, AlertCircle } from "lucide-react"; // Adicionei ícones para o loading bonito

interface AuthContextType {
    session: Session | null;
    user: User | null;
    employeeProfile: Employee | null;
    wholesaleProfile: WholesaleClient | null;
    isWholesale: boolean;
    loading: boolean;
    role: 'admin' | 'wholesale' | 'customer' | null;
    signIn: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE_KEY = "bv_admin_profile";
const WHOLESALE_PROFILE_KEY = "bv_wholesale_profile";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Iniciando...");
    const [showEmergencyBtn, setShowEmergencyBtn] = useState(false); // Controle para botão de emergência

    const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(() => {
        try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || "null"); } catch { return null; }
    });
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(() => {
        try { return JSON.parse(localStorage.getItem(WHOLESALE_PROFILE_KEY) || "null"); } catch { return null; }
    });

    const log = (msg: string, data?: any) => console.log(`%c[AUTH] ${msg}`, 'color: #00ffff', data || '');

    // --- LOGOUT OTIMISTA ---
    const logout = useCallback(async () => {
        log("🚪 Iniciando Logout...");
        try {
            setSession(null);
            setUser(null);
            setEmployeeProfile(null);
            setWholesaleProfile(null);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
            localStorage.removeItem(WHOLESALE_PROFILE_KEY);
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key);
            });
            const { error } = await supabase.auth.signOut();
            if (error) log("⚠️ Aviso: Erro no signOut do servidor (ignorado)", error);
        } catch (err) {
            console.error("Erro crítico no logout:", err);
        } finally {
            window.location.href = "/login";
        }
    }, []);

    // --- FETCH DE PERFIL ---
    const fetchProfileFromBackend = async (token: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            log("📡 Buscando perfil...");
            
            const adminRes = await fetch("/api/get-admin-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                signal: controller.signal
            });

            if (adminRes.ok) {
                const data = await adminRes.json();
                setEmployeeProfile(data);
                setWholesaleProfile(null);
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data));
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                return;
            }

            const wholesaleRes = await fetch("/api/get-wholesale-profile", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                signal: controller.signal
            });

            if (wholesaleRes.ok) {
                const data = await wholesaleRes.json();
                setWholesaleProfile(data);
                setEmployeeProfile(null);
                localStorage.setItem(WHOLESALE_PROFILE_KEY, JSON.stringify(data));
                localStorage.removeItem(ADMIN_PROFILE_KEY);
                return;
            }

            setEmployeeProfile(null);
            setWholesaleProfile(null);
        } catch (error: any) {
            if (error.name !== 'AbortError') log("🔥 Erro no fetch de perfil:", error);
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // --- INICIALIZAÇÃO ---
    useEffect(() => {
        let mounted = true;
        
        // Timer para mostrar botão de emergência apenas se demorar mais de 3s
        const emergencyTimer = setTimeout(() => setShowEmergencyBtn(true), 3000);

        const init = async () => {
            setLoadingMessage("Carregando...");
            try {
                const { data: { session: initSession } } = await supabase.auth.getSession();
                
                if (initSession?.user) {
                    if(mounted) {
                        setSession(initSession);
                        setUser(initSession.user);
                    }
                    await fetchProfileFromBackend(initSession.access_token);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
                clearTimeout(emergencyTimer);
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;
            if (newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);
                if (event === 'SIGNED_IN') {
                    setLoading(true);
                    setShowEmergencyBtn(false);
                    setTimeout(() => setShowEmergencyBtn(true), 3000);
                    await fetchProfileFromBackend(newSession.access_token);
                    setLoading(false);
                } else if (event === 'TOKEN_REFRESHED') {
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

        return () => { 
            mounted = false; 
            subscription.unsubscribe();
            clearTimeout(emergencyTimer);
        };
    }, []);

    const signIn = useCallback(async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    }, []);

    const role = useMemo(() => {
        if (employeeProfile) return 'admin';
        if (wholesaleProfile) return 'wholesale';
        if (user) return 'customer';
        return null;
    }, [employeeProfile, wholesaleProfile, user]);

    const value = useMemo(() => ({
        session, user, employeeProfile, wholesaleProfile, isWholesale: !!wholesaleProfile, 
        loading, signIn, logout, signOut: logout, role
    }), [session, user, employeeProfile, wholesaleProfile, loading, signIn, logout, role]);

    // --- NOVO LOADING BONITO ---
    if (loading) {
        return (
            <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4 p-8 rounded-2xl animate-in fade-in duration-300">
                    {/* Logo ou Spinner */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
                             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">BV Celular</h3>
                        <p className="text-sm text-gray-500 animate-pulse">{loadingMessage}</p>
                    </div>

                    {/* Botão de Emergência Sutil (só aparece após 3s) */}
                    {showEmergencyBtn && (
                        <button 
                            onClick={() => { setLoading(false); logout(); }}
                            className="mt-8 flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors duration-200 group"
                        >
                            <AlertCircle size={14} />
                            <span className="group-hover:underline">Demorando muito? Clique para reiniciar</span>
                        </button>
                    )}
                </div>
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
