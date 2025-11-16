import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Continua usando o Auth (Admin)
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = () => {
    // 1. CORREÇÃO: Pega o 'employeeProfile' além do 'loading'
    const { employeeProfile, loading } = useAuth();

    // 2. Estado de carregamento (enquanto o Supabase busca a sessão E o perfil)
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    // 3. A LÓGICA CORRIGIDA:
    // Se NÃO estiver carregando E (não houver perfil DE FUNCIONÁRIO),
    // redireciona para o login do Admin.
    // Se um Cliente logar, 'employeeProfile' será 'null' e o acesso será bloqueado.
    if (!loading && !employeeProfile) {
        return <Navigate to="/admin-login" replace />;
    }

    // 4. Se 'employeeProfile' existir, o usuário é um Admin.
    return <Outlet />;
};
