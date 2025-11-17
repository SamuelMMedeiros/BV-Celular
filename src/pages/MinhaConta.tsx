import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, PersonStanding, Phone, User, AlertTriangle } from "lucide-react";

import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Navbar } from "@/components/Navbar";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateCustomerProfile, CustomerUpdatePayload } from "@/lib/api";

// Schema de validação para o formulário de perfil
const profileSchema = z.object({
    name: z.string().min(2, "Nome completo é obrigatório"),
    phone: z
        .string()
        .regex(
            /^\d{10,11}$/,
            "Telefone inválido (10 ou 11 dígitos, apenas números)"
        ),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const MinhaConta = () => {
    const { profile, isLoggedIn, session, refetchProfile } = useCustomerAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            phone: "",
        },
    });

    // Efeito para preencher o formulário quando o perfil for carregado
    useEffect(() => {
        if (isLoggedIn && profile) {
            form.reset({
                name: profile.name,
                phone: profile.phone,
            });
        }
    }, [isLoggedIn, profile, form]);

    // Mutação para atualizar o perfil
    const updateMutation = useMutation({
        mutationFn: (data: CustomerUpdatePayload) =>
            updateCustomerProfile(data),
        onSuccess: async () => {
            // Atualiza os dados do usuário no Supabase Auth (user_metadata)
            // Isso é importante para que a saudação na Navbar seja atualizada no próximo refresh
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: form.getValues("name"),
                    phone: form.getValues("phone"),
                },
            });
            if (authError) throw new Error(authError.message);

            // Força a atualização do hook useCustomerAuth
            await refetchProfile();

            toast({
                title: "Sucesso!",
                description: "Seu perfil foi atualizado.",
            });
            // Invalida a query de clientes no admin (se houver)
            queryClient.invalidateQueries({ queryKey: ["adminClients"] });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            });
        },
    });

    // Redireciona se não estiver logado
    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login", { state: { from: location }, replace: true });
        }
    }, [isLoggedIn, navigate]);

    if (!profile) {
        // Isso pode aparecer rapidamente enquanto o perfil carrega
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container py-8 text-center">
                    Carregando perfil...
                </div>
            </div>
        );
    }

    const onSubmit = (data: ProfileFormValues) => {
        if (!profile?.id) return;

        const payload: CustomerUpdatePayload = {
            id: profile.id,
            name: data.name,
            phone: data.phone,
        };
        updateMutation.mutate(payload);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                                <User className="h-6 w-6 text-accent-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">
                                    Minha Conta
                                </CardTitle>
                                <CardDescription>
                                    Atualize seus dados pessoais.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* Campo de Email (Desabilitado) */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="email"
                                        className="flex items-center gap-1"
                                    >
                                        <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={
                                            session?.user?.email ||
                                            "Email não encontrado"
                                        }
                                        disabled
                                        className="cursor-not-allowed bg-muted/50"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        O email não pode ser alterado.
                                    </p>
                                </div>

                                {/* Campo de Nome */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1">
                                                <PersonStanding className="h-4 w-4 text-muted-foreground" />{" "}
                                                Nome Completo
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Seu nome completo"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Campo de Telefone */}
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1">
                                                <Phone className="h-4 w-4 text-muted-foreground" />{" "}
                                                Telefone (WhatsApp)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="tel"
                                                    placeholder="34999998888 (só números)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Usaremos este número para
                                                confirmar seu orçamento.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {updateMutation.isError && (
                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>
                                            Erro ao salvar:{" "}
                                            {updateMutation.error.message}
                                        </span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending
                                        ? "Salvando..."
                                        : "Salvar Alterações"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default MinhaConta;
