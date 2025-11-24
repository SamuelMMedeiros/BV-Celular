/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const AdminLoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // Proteção contra contexto nulo
    if (!authContext) return null;
    const { signIn, user, employeeProfile, loading, logout } = authContext;

    const from = location.state?.from?.pathname || "/admin";

    useEffect(() => {
        // Redireciona apenas se tiver certeza absoluta do perfil de admin
        if (!loading && user && employeeProfile) {
            navigate(from, { replace: true });
        }
    }, [user, employeeProfile, loading, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            await signIn(email, password);
            // O redirecionamento acontece no useEffect
        } catch (error: any) {
            console.error("Login attempt result:", error);
            
            // CORREÇÃO: Se o usuário foi logado e tem perfil, ignoramos erros espúrios
            // Isso evita o toast vermelho quando o login na verdade funcionou
            if (user && employeeProfile) return;

            // Filtra mensagens de erro comuns para serem mais amigáveis
            const errorMessage = error.message === "Invalid login credentials" 
                ? "E-mail ou senha incorretos." 
                : (error.message || "Verifique suas credenciais.");

            toast({
                variant: "destructive",
                title: "Erro ao entrar",
                description: errorMessage,
            });
        } finally {
            // Só paramos o loading se o usuário NÃO estiver logado.
            // Se estiver logado, deixamos o loading ativo enquanto redireciona.
            if (!user) {
                setIsLoggingIn(false);
            }
        }
    };

    // Tela de Erro de Permissão (Logado, mas não é Admin)
    if (!loading && user && !employeeProfile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md border-destructive">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit text-destructive mb-2">
                            <ShieldAlert className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-destructive">Acesso Negado</CardTitle>
                        <CardDescription>
                            Sua conta não tem permissão de Administrador ou Funcionário.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Se você acredita que isso é um erro, contate o gerente para vincular sua conta.
                        </p>
                        <Button onClick={() => logout()} variant="outline" className="w-full">
                            Sair da Conta e Tentar Outra
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Acesso Administrativo</CardTitle>
                        <CardDescription className="text-center">
                            Digite suas credenciais para acessar o painel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@bvcelular.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoggingIn}>
                                {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminLoginPage;