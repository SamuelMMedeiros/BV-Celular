import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthAdmin"; // <-- CORREÇÃO DA IMPORTAÇÃO
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = () => {
    const location = useLocation();
    const { employeeProfile, loading } = useAuth();

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

    if (!loading && !employeeProfile) {
        return (
            <Navigate to="/admin-login" state={{ from: location }} replace />
        );
    }

    return <Outlet />;
};
