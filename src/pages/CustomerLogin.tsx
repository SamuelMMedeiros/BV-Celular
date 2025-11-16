import { useNavigate, useLocation } from "react-router-dom";
import { CustomerAuthForm } from "@/components/CustomerAuthForm";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

const CustomerLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Tenta pegar a página anterior (de onde o usuário veio, ex: o carrinho)
    // Se não houver, o padrão é a página inicial "/"
    const from = location.state?.from?.pathname || "/";

    // 2. Função de sucesso que redireciona o usuário de volta
    const handleLoginSuccess = () => {
        navigate(from, { replace: true });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
            <Card className="w-full max-w-md p-6">
                <CardContent className="p-0">
                    <div className="flex justify-center mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                            <Smartphone className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CustomerAuthForm onSuccess={handleLoginSuccess} />
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerLogin;
