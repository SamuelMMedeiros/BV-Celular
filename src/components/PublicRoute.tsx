import { useContext, ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRouteProps {
    children?: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
    const context = useContext(AuthContext);

    if (!context) {
        return <Outlet />;
    }

    const { employeeProfile, loading } = context;

    // Enquanto carrega, não faz nada (ou mostra skeleton)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        );
    }

    // SE FOR ADMIN/FUNCIONÁRIO, PROÍBE O ACESSO E MANDA PRO ADMIN
    if (employeeProfile) {
        return <Navigate to="/admin" replace />;
    }

    // Se for cliente ou visitante, permite
    return children ? <>{children}</> : <Outlet />;
};
