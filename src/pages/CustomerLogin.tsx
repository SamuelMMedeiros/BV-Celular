import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { CustomerAuthForm } from "@/components/CustomerAuthForm";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { fetchEmployeeProfile } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const CustomerLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, isLoadingSession } = useCustomerAuth();

    // Pega a rota de origem, mas com segurança
    const from = location.state?.from?.pathname;

    useEffect(() => {
        const checkRedirect = async () => {
            if (!isLoadingSession && isLoggedIn) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (session?.user) {
                    try {
                        // Busca perfil administrativo/entregador
                        const employee = await fetchEmployeeProfile(
                            session.user.id
                        );

                        if (employee?.is_driver) {
                            navigate("/entregador", { replace: true });
                            return;
                        }

                        if (employee) {
                            navigate("/admin", { replace: true });
                            return;
                        }
                    } catch (e) {
                        console.error("Erro ao verificar perfil:", e);
                    }
                }

                // SEGURO CONTRA LOOP:
                // Se tentou acessar /entregador ou /admin mas a verificação acima falhou (employee é null),
                // FORÇAMOS o redirecionamento para a Home (/) para não ficar num loop infinito de login.
                if (from === "/entregador" || from?.startsWith("/admin")) {
                    navigate("/", { replace: true });
                } else {
                    navigate(from || "/", { replace: true });
                }
            }
        };

        checkRedirect();
    }, [isLoggedIn, isLoadingSession, navigate, from]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            Acesso Restrito
                        </CardTitle>
                        <CardDescription>
                            Faça login para continuar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomerAuthForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CustomerLogin;
