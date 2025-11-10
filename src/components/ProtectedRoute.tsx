import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Importa nosso hook do Passo 2
import { Skeleton } from "@/components/ui/skeleton"; // Para o estado de loading

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    // 1. Mostra um 'loading' enquanto o Supabase verifica a sessão
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

    // 2. Se não estiver carregando e NÃO houver usuário, redireciona para /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Se estiver tudo certo (logado), mostra o conteúdo da rota (a página Admin)
    // <Outlet /> é o marcador do React Router para "onde o filho deve ir"
    return <Outlet />;
};
