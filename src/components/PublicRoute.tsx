import { useContext, ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRouteProps {
    children?: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
    const context = useContext(AuthContext);

    // Se por algum motivo o contexto falhar (não deve ocorrer agora), renderiza o outlet
    if (!context) {
        return <Outlet />;
    }

    const { employeeProfile, loading } = context;

    // Enquanto verifica a sessão, mostra loading para evitar redirect falso
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        );
    }

    // Se for Admin/Funcionário, BLOQUEIA acesso público e joga pro painel
    if (employeeProfile) {
        return <Navigate to="/admin" replace />;
    }

    // Se for visitante ou cliente normal, libera
    return children ? <>{children}</> : <Outlet />;
};
