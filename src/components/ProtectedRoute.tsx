import { useContext, ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
    children?: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const context = useContext(AuthContext);
    const location = useLocation();

    if (!context) {
        console.error(
            "FATAL: ProtectedRoute renderizado fora do AuthProvider!"
        );
        // Fallback seguro
        return <Navigate to="/login" replace />;
    }

    const { employeeProfile, loading } = context;

    // 1. Estado de Carregamento
    if (loading) {
        return (
            <div className="container py-10 space-y-8">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        );
    }

    // 2. Verificação de Acesso
    if (!employeeProfile) {
        // CORREÇÃO: Se estiver tentando acessar área de entregador, manda pro login comum
        if (location.pathname.startsWith("/entregador")) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
        // Senão, manda pro login de admin
        return (
            <Navigate to="/admin-login" state={{ from: location }} replace />
        );
    }

    // 3. Acesso Permitido
    return children ? <>{children}</> : <Outlet />;
};
