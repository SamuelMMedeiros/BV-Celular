import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom"; // <-- Importar
import { fetchEmployeeProfile } from "@/lib/api"; // <-- Importar API
import { supabase } from "@/integrations/supabase/client"; // <-- Importar Supabase

const authSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    name: z.string().optional(),
    phone: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface CustomerAuthFormProps {
    onSuccess?: () => void;
}

export const CustomerAuthForm = ({ onSuccess }: CustomerAuthFormProps) => {
    const { signIn, signUp } = useCustomerAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"login" | "register">("login");
    const navigate = useNavigate(); // Hook de navegação

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
            phone: "",
        },
    });

    const onSubmit = async (data: AuthFormValues) => {
        setIsLoading(true);
        try {
            if (activeTab === "login") {
                await signIn(data.email, data.password);

                // --- LÓGICA DE REDIRECIONAMENTO PÓS-LOGIN ---
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.user) {
                    const employee = await fetchEmployeeProfile(
                        session.user.id
                    );
                    if (employee && employee.is_driver) {
                        navigate("/entregador");
                        return; // Para aqui se redirecionar
                    }
                }
                // ----------------------------------------------
            } else {
                if (!data.name || data.name.length < 2) {
                    form.setError("name", {
                        message: "Nome é obrigatório para cadastro",
                    });
                    setIsLoading(false);
                    return;
                }
                if (!data.phone || data.phone.length < 10) {
                    form.setError("phone", { message: "Telefone inválido" });
                    setIsLoading(false);
                    return;
                }
                await signUp(data.email, data.password, data.name, data.phone);

                // Verifica se o novo cadastro é um entregador (vínculo automático)
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.user) {
                    const employee = await fetchEmployeeProfile(
                        session.user.id
                    );
                    if (employee?.is_driver) {
                        navigate("/entregador");
                        return;
                    }
                }
            }

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Erro de autenticação:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "register")}
            className="w-full"
        >
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    {activeTab === "register" && (
                        <>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Seu nome"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="(00) 00000-0000"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="seu@email.com"
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
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : activeTab === "login" ? (
                            "Entrar"
                        ) : (
                            "Criar Conta"
                        )}
                    </Button>
                </form>
            </Form>
        </Tabs>
    );
};
