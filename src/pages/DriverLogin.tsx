/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bike, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchDriverProfile } from "@/lib/api";

const DriverLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false); // Toggle para cadastro
    const [name, setName] = useState(""); // Para cadastro
    const [phone, setPhone] = useState(""); // Para cadastro

    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegistering) {
                // Fluxo de Cadastro (Sign Up)
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name, phone: phone } },
                });
                if (error) throw error;

                // Após cadastro, o trigger do banco deve vincular. Tentamos logar ou avisar.
                toast({
                    title: "Cadastro realizado!",
                    description:
                        "Verifique se seu email já foi autorizado pelo administrador.",
                });
                // Tenta fazer login automático após cadastro
                const { error: loginError } =
                    await supabase.auth.signInWithPassword({ email, password });
                if (!loginError) checkDriverAccess();
            } else {
                // Fluxo de Login (Sign In)
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                await checkDriverAccess();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
            setLoading(false);
        }
    };

    const checkDriverAccess = async () => {
        // Verifica se é motorista de verdade usando a RPC segura
        const driver = await fetchDriverProfile();

        if (driver) {
            toast({ title: "Bem-vindo!", description: `Olá, ${driver.name}` });
            navigate("/entregador");
        } else {
            toast({
                variant: "destructive",
                title: "Acesso Negado",
                description: "Este usuário não é um entregador cadastrado.",
            });
            await supabase.auth.signOut(); // Desloga se não for motorista
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <Bike className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Área do Entregador
                    </CardTitle>
                    <CardDescription>
                        {isRegistering
                            ? "Crie sua senha de acesso"
                            : "Faça login para ver suas entregas"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {isRegistering && (
                            <>
                                <div className="space-y-2">
                                    <Label>Nome Completo</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone</Label>
                                    <Input
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        required
                                        placeholder="Seu telefone"
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Senha</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="******"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : isRegistering ? (
                                "Cadastrar"
                            ) : (
                                "Entrar"
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground pt-2">
                            {isRegistering
                                ? "Já tem senha? "
                                : "Primeiro acesso? "}
                            <button
                                type="button"
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="text-primary hover:underline font-medium"
                            >
                                {isRegistering ? "Fazer Login" : "Criar Senha"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default DriverLogin;
