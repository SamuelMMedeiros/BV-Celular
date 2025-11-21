/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Briefcase } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { fetchWholesaleProfile } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const WholesaleLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signIn } = useCustomerAuth(); // Usamos o signIn do contexto para setar a sessão
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            // 1. Faz login no Supabase Auth
            await signIn(data.email, data.password);

            // 2. Verifica se é realmente um cliente de Atacado
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
                const wholesaleProfile = await fetchWholesaleProfile();

                if (wholesaleProfile) {
                    toast({
                        title: "Bem-vindo!",
                        description: `Olá, ${wholesaleProfile.name} da ${wholesaleProfile.company_name}.`,
                    });
                    // Redireciona para a Home (agora com preços de atacado ativos)
                    navigate("/");
                } else {
                    // Se não for atacado, desloga e avisa
                    await supabase.auth.signOut();
                    toast({
                        variant: "destructive",
                        title: "Acesso Negado",
                        description:
                            "Esta conta não tem permissão de acesso ao portal de atacado.",
                    });
                }
            }
        } catch (error: any) {
            console.error("Erro de login atacado:", error);
            // O toast de erro já é exibido pelo signIn do contexto, mas garantimos aqui
            if (!error.message.includes("Invalid login")) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Falha ao entrar. Verifique suas credenciais.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-t-4 border-t-blue-800 shadow-lg">
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit text-blue-800">
                            <Briefcase className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-blue-900">
                            Portal do Revendedor
                        </CardTitle>
                        <CardDescription>
                            Acesso exclusivo para parceiros e empresas (B2B).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Email Corporativo
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="comercial@empresa.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="******"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-800 hover:bg-blue-900"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        "Acessar Painel"
                                    )}
                                </Button>

                                <div className="text-center text-sm text-muted-foreground pt-4 border-t mt-4">
                                    Não tem cadastro? <br />
                                    Entre em contato com nosso setor comercial
                                    para se tornar um parceiro.
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WholesaleLogin;
