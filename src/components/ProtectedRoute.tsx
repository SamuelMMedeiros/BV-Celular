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

    // Proteção contra uso indevido do componente
    if (!context) {
        return <Navigate to="/admin-login" replace />;
    }

    const { employeeProfile, loading, user } = context;

    if (loading) {
        return (
            <div className="container py-10 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    // Se não estiver logado OU estiver logado mas sem perfil de funcionário
    if (!user || !employeeProfile) {
        // Redireciona para o login, salvando a origem
        return (
            <Navigate to="/admin-login" state={{ from: location }} replace />
        );
    }

    return children ? <>{children}</> : <Outlet />;
};
