import { useState, useEffect } from "react"; 
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, LogOut, Phone, PersonStanding, Check } from "lucide-react";
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

// Schema de validação
const formSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    phone: z
        .string()
        .regex(
            /^\d{10,11}$/,
            "Telefone inválido (10 ou 11 dígitos, apenas números)"
        ),
});
type FormValues = z.infer<typeof formSchema>;

export const CustomerAuthPopover = () => {
    const { profile, isLoggedIn, login, logout, getGreeting } =
        useCustomerAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: profile?.name || "",
            phone: profile?.phone || "",
        },
        mode: "onBlur",
    });

    // Atualiza o formulário se o perfil mudar (ex: login/logout)
    useEffect(() => {
        form.reset({
            name: profile?.name || "",
            phone: profile?.phone || "",
        });
    }, [profile, form]);

    const onSubmit = (data: FormValues) => {
        login(data.name, data.phone);
        setIsOpen(false);
        toast({
            title: "Login Concluído",
            description: "Seus dados foram salvos para a próxima compra.",
            icon: <Check className="h-4 w-4" />,
        });
    };

    // Se logado, mostra a saudação e o botão de logout
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

    // Se não logado, mostra o popover de login/cadastro
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Entrar/Cadastrar</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                    <h4 className="font-bold text-lg">
                        Identificação do Cliente
                    </h4>
                    <CardDescription>
                        Informe seu nome e telefone para iniciar seu pedido.
                    </CardDescription>
                </div>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="mt-4 space-y-4"
                >
                    <div className="space-y-2">
                        <Label
                            htmlFor="customer-name"
                            className="flex items-center gap-1"
                        >
                            <PersonStanding className="h-4 w-4 text-muted-foreground" />{" "}
                            Nome Completo
                        </Label>
                        <Input
                            id="customer-name"
                            placeholder="Seu nome"
                            {...form.register("name")}
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
                            Telefone (DDD)
                        </Label>
                        <Input
                            id="customer-phone"
                            type="tel"
                            placeholder="34999998888"
                            {...form.register("phone")}
                        />
                        {form.formState.errors.phone && (
                            <p className="text-xs text-destructive">
                                {form.formState.errors.phone.message}
                            </p>
                        )}
                    </div>

                    <Button type="submit" className="w-full">
                        Salvar e Continuar
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    );
};
