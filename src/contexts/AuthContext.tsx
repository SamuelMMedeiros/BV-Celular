import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

type Role = 'admin' | 'wholesale' | 'customer' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // Função interna para determinar a role baseada nas APIs Serverless
  // Isso garante segurança, pois o cliente não decide sua própria role
  const fetchUserRole = async (currentUser: User, token: string) => {
    try {
      // 1. Tenta Admin
      const adminRes = await fetch("/api/get-admin-profile", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
      });
      if (adminRes.ok) {
        setRole("admin");
        return;
      }

      // 2. Tenta Atacado
      const wholesaleRes = await fetch("/api/get-wholesale-profile", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
      });
      if (wholesaleRes.ok) {
        setRole("wholesale");
        return;
      }

      // 3. Fallback para Cliente
      setRole("customer");
    } catch (error) {
      console.error("Erro ao buscar role:", error);
      setRole("customer");
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Pega sessão inicial (localStorage)
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user && initialSession?.access_token) {
            await fetchUserRole(initialSession.user, initialSession.access_token);
          } else {
             setRole(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Escuta mudanças (Login, Logout, Auto-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Se houve login ou refresh de token, revalida a role
        if (newSession?.user && newSession?.access_token) {
           // Pequena otimização: se a role já estiver setada e o user for o mesmo, 
           // talvez não precise re-buscar, mas por segurança re-buscamos.
           await fetchUserRole(newSession.user, newSession.access_token);
        } else {
           setRole(null);
           setLoading(false); // Garante que saia do loading no logout
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setLoading(false); // Só desativa loading se der erro, senão o onAuthStateChange cuida
    return result;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // O onAuthStateChange vai limpar o estado
  };

  const value = useMemo(() => ({
    session,
    user,
    role,
    loading,
    signIn,
    signOut
  }), [session, user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};