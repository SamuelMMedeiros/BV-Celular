//
// === CÓDIGO COMPLETO PARA: src/contexts/AuthContext.tsx ===
//
import {
    createContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
} from "react";
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

    // Loading state inicia true se não tivermos dados cacheados
    const [loading, setLoading] = useState(
        !employeeProfile && !wholesaleProfile
    );

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setEmployeeProfile(null);
        setWholesaleProfile(null);
        localStorage.removeItem(ADMIN_PROFILE_KEY);
        localStorage.removeItem(WHOLESALE_PROFILE_KEY);
        setLoading(false);
    }, []);

    // FUNÇÃO CENTRAL DE CARREGAMENTO DE PERFIS
    const loadProfiles = useCallback(async (currentUser: User) => {
        try {
            // 1. Tenta Admin (Prioridade)
            const admin = await fetchEmployeeProfile(currentUser.id);
            if (admin) {
                setEmployeeProfile(admin);
                setWholesaleProfile(null); // Garante que não misture
                localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));
                localStorage.removeItem(WHOLESALE_PROFILE_KEY);
                return; // Encerra se achou admin
            }

            // 2. Se não é Admin, tenta Atacado
            // Nota: fetchWholesaleProfile usa auth.uid() internamente no backend, não precisa de ID
            const wholesale = await fetchWholesaleProfile();
            if (wholesale) {
                setWholesaleProfile(wholesale);
                setEmployeeProfile(null);
                localStorage.setItem(
                    WHOLESALE_PROFILE_KEY,
                    JSON.stringify(wholesale)
                );
                localStorage.removeItem(ADMIN_PROFILE_KEY);
                return; // Encerra se achou atacado
            }

            // 3. Se não achou nenhum dos dois, limpa perfis especiais
            // (O usuário pode ser um cliente varejo comum, então não damos logout forçado aqui)
            setEmployeeProfile(null);
            setWholesaleProfile(null);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
            localStorage.removeItem(WHOLESALE_PROFILE_KEY);
        } catch (error) {
            console.error("Erro ao carregar perfis:", error);
            // Em caso de erro de rede, mantemos o estado anterior ou limpamos sem logout forçado
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const processSession = async (s: Session | null) => {
            if (!mounted) return;

            setSession(s);
            setUser(s?.user ?? null);

            if (s?.user) {
                await loadProfiles(s.user);
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
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("Erro de sessão inicial:", error);
                // Só aqui fazemos logout forçado se a sessão for inválida
                logout();
            } else {
                processSession(session);
            }
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                processSession(session);
            }
        );

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [logout, loadProfiles]);

    const signIn = useCallback(async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });
        if (error) throw error;
    }, []);

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
        [
            session,
            user,
            employeeProfile,
            wholesaleProfile,
            loading,
            signIn,
            logout,
        ]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
