/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CustomerProfile, WholesaleClient } from "@/types"; 
import { fetchCustomerProfile, fetchWholesaleProfile } from "@/lib/api"; // Importar fetchWholesale

interface CustomerAuthContextType {
    session: Session | null;
    user: User | null;
    customerProfile: CustomerProfile | null; // CORRIGIDO: Renomeado de 'profile' para 'customerProfile'
    wholesaleProfile: WholesaleClient | null;
    isWholesale: boolean;
    isLoggedIn: boolean;
    isLoadingSession: boolean;
    signIn: (e: string, p: string) => Promise<void>;
    signUp: (e: string, p: string, n: string, ph: string) => Promise<void>;
    logout: () => Promise<void>;
    getGreeting: () => string;
    refetchProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null); // CORRIGIDO: Renomeado o state
    const [wholesaleProfile, setWholesaleProfile] = useState<WholesaleClient | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    const fetchProfiles = async (userId: string) => {
        try {
            // Tenta buscar perfil de cliente normal
            const customerData = await fetchCustomerProfile(userId);
            if (customerData) {
                setCustomerProfile(customerData); // Usa novo nome
            }

            // Tenta buscar perfil de atacado (se houver)
            const wholesaleData = await fetchWholesaleProfile();
            if (wholesaleData) {
                setWholesaleProfile(wholesaleData);
            } else {
                setWholesaleProfile(null);
            }

        } catch (error) {
            console.error("Erro ao buscar perfis:", error);
        }
    };

    useEffect(() => {
        let mounted = true;
        
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfiles(session.user.id);
                }
                setIsLoadingSession(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfiles(session.user.id);
                } else {
                    setCustomerProfile(null); // Usa novo nome
                    setWholesaleProfile(null);
                }
                setIsLoadingSession(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, pass: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    };

    const signUp = async (email: string, pass: string, name: string, phone: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: { data: { full_name: name, phone } }
        });
        if (error) throw error;
        if (data.user) {
            await supabase.from('Clients').insert({ 
                id: data.user.id, 
                name, 
                phone, 
                email 
            });
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCustomerProfile(null); // Usa novo nome
        setWholesaleProfile(null);
        setUser(null);
        setSession(null);
    };

    const refetchProfile = async () => {
        if (user) await fetchProfiles(user.id);
    }

    const getGreeting = () => {
        if (wholesaleProfile) return `Olá, ${wholesaleProfile.name} (Atacado)`;
        if (customerProfile) return `Olá, ${customerProfile.name}`; // Usa novo nome
        return "Minha Conta";
    };

    const value = {
        session,
        user,
        customerProfile, // Expõe como 'customerProfile'
        wholesaleProfile,
        isWholesale: !!wholesaleProfile,
        isLoggedIn: !!user,
        isLoadingSession,
        signIn,
        signUp,
        logout,
        getGreeting,
        refetchProfile
    };

    return (
        <CustomerAuthContext.Provider value={value}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) throw new Error("useCustomerAuth must be used within Provider");
    return context;
};