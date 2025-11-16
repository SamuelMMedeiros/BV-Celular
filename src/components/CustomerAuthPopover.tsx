import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    User,
    LogOut,
    Phone,
    PersonStanding,
    Check,
    Mail,
    Lock,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// --- Schemas de Validação ---

// A. Schema para Registro
const signUpSchema = z.object({
    name: z.string().min(2, "Nome completo é obrigatório"),
    phone: z
        .string()
        .regex(
            /^\d{10,11}$/,
            "Telefone inválido (10 ou 11 dígitos, apenas números)"
        ),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});
type SignUpValues = z.infer<typeof signUpSchema>;

// B. Schema para Login
const signInSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
});
type SignInValues = z.infer<typeof signInSchema>;

// --- Componente Principal ---
export const CustomerAuthPopover = () => {
    const { profile, isLoggedIn, signUp, signIn, logout, getGreeting } =
        useCustomerAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"login" | "signup">("login"); // Estado para alternar as telas
    const [isLoading, setIsLoading] = useState(false);

    // Configura o formulário com o schema baseado na view atual
    const form = useForm<SignUpValues | SignInValues>({
        // Usa o zodResolver para escolher o schema correto
        resolver: zodResolver(view === "login" ? signInSchema : signUpSchema),
        defaultValues: {
            // Inicializa com valores vazios para Login
            email: "",
            password: "",
            // Adiciona valores de Registro, se estiver no modo correto
            name: profile?.name || "",
            phone: profile?.phone || "",
        } as SignUpValues | SignInValues, // Garante que o tipo seja compatível
    });

    // Reseta o formulário quando a view muda
    useEffect(() => {
        form.reset({
            email: "",
            password: "",
            name: view === "signup" ? profile?.name || "" : "",
            phone: view === "signup" ? profile?.phone || "" : "",
        });
        // Limpa erros após a mudança de view
        form.clearErrors();
    }, [view, form, profile]);

    const onSubmit = async (data: SignUpValues | SignInValues) => {
        setIsLoading(true);

        try {
            if (view === "signup") {
                const { name, phone, email, password } = data as SignUpValues;
                await signUp(email, password, name, phone);
            } else {
                const { email, password } = data as SignInValues;
                await signIn(email, password);
            }
            // Após o sucesso, fecha o popover. O Context cuida do redirecionamento.
            setIsOpen(false);
        } catch (e) {
            // O toast do Context já lidou com o erro
        } finally {
            setIsLoading(false);
        }
    };

    // --- Renderização Logado ---
    if (isLoggedIn) {
        return (
            <div className="flex items-center space-x-2 border-r pr-3">
                <span className="text-sm font-medium hidden sm:inline">
                    {getGreeting()}
                </span>
                <Button onClick={logout} variant="ghost" size="icon">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    // --- Renderização Não Logado ---
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {view === "login" ? "Entrar" : "Cadastrar"}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
                {/* Título e Descrição */}
                <div className="space-y-2 text-center">
                    <h4 className="font-bold text-xl">
                        {view === "login" ? "Acesso Cliente" : "Criar Conta"}
                    </h4>
                    <CardDescription>
                        {view === "login"
                            ? "Faça login com seu email e senha."
                            : "Crie sua conta para finalizar o pedido."}
                    </CardDescription>
                </div>

                {/* Formulário */}
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="mt-4 space-y-4"
                >
                    {view === "signup" && (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="customer-name"
                                    className="flex items-center gap-1"
                                >
                                    <PersonStanding className="h-4 w-4 text-muted-foreground" />{" "}
                                    Nome
                                </Label>
                                <Input
                                    id="customer-name"
                                    placeholder="Nome Completo"
                                    {...form.register("name")}
                                    disabled={isLoading}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-destructive">
                                        {form.formState.errors.name.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="customer-phone"
                                    className="flex items-center gap-1"
                                >
                                    <Phone className="h-4 w-4 text-muted-foreground" />{" "}
                                    Telefone
                                </Label>
                                <Input
                                    id="customer-phone"
                                    type="tel"
                                    placeholder="34999998888"
                                    {...form.register("phone")}
                                    disabled={isLoading}
                                />
                                {form.formState.errors.phone && (
                                    <p className="text-xs text-destructive">
                                        {form.formState.errors.phone.message}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label
                            htmlFor="customer-email"
                            className="flex items-center gap-1"
                        >
                            <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                            Email
                        </Label>
                        <Input
                            id="customer-email"
                            placeholder="seu@email.com"
                            {...form.register("email")}
                            disabled={isLoading}
                        />
                        {form.formState.errors.email && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="customer-password"
                            className="flex items-center gap-1"
                        >
                            <Lock className="h-4 w-4 text-muted-foreground" />{" "}
                            Senha
                        </Label>
                        <Input
                            id="customer-password"
                            type="password"
                            placeholder="••••••"
                            {...form.register("password")}
                            disabled={isLoading}
                        />
                        {form.formState.errors.password && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Processando..."
                            : view === "login"
                            ? "Entrar"
                            : "Cadastrar e Entrar"}
                    </Button>
                </form>

                {/* Switcher Login/Cadastro */}
                <Separator className="my-4" />
                <Button
                    variant="link"
                    size="sm"
                    className="w-full text-xs text-muted-foreground"
                    onClick={() => {
                        setView(view === "login" ? "signup" : "login");
                        form.clearErrors();
                    }}
                >
                    {view === "login"
                        ? "Novo por aqui? Crie sua conta agora."
                        : "Já tem conta? Clique para fazer Login."}
                </Button>
            </PopoverContent>
        </Popover>
    );
};
