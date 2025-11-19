import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createWarranty } from "@/lib/api";
import { WarrantyPayload } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, ShieldCheck } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const warrantySchema = z.object({
    client_name: z.string().min(3, "Nome completo é obrigatório."),
    client_phone: z.string().min(10, "Telefone inválido."),
    invoice_number: z.string().min(1, "Número da nota é obrigatório."),
    product_model: z.string().min(1, "Modelo do produto é obrigatório."),
    serial_number: z.string().min(1, "Número de série/IMEI é obrigatório."),
    purchase_date: z.date({
        required_error: "Data da compra é obrigatória.",
    }),
});

const WarrantyPage = () => {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof warrantySchema>>({
        resolver: zodResolver(warrantySchema),
        defaultValues: {
            client_name: "",
            client_phone: "",
            invoice_number: "",
            product_model: "",
            serial_number: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (data: WarrantyPayload) => createWarranty(data),
        onSuccess: () => {
            toast({
                title: "Garantia Registrada!",
                description: "Seus dados foram enviados com sucesso.",
                duration: 5000,
            });
            form.reset();
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao registrar",
                description: error.message,
            });
        },
    });

    const onSubmit = (values: z.infer<typeof warrantySchema>) => {
        mutation.mutate(values);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8 space-y-2">
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <ShieldCheck className="h-10 w-10" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold">
                            Registro de Garantia
                        </h1>
                        <p className="text-muted-foreground">
                            Cadastre seu produto para ativar a garantia e
                            agilizar o suporte.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados do Produto</CardTitle>
                            <CardDescription>
                                Preencha com os dados da sua Nota Fiscal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-6"
                                >
                                    {/* Dados Pessoais */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="client_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Nome Completo
                                                    </FormLabel>
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
                                            name="client_phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Telefone / WhatsApp
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="(34) 99999-9999"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Dados da Compra */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="invoice_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Número da Nota Fiscal
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: 000.123.456"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="purchase_date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>
                                                        Data da Compra
                                                    </FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={
                                                                        "outline"
                                                                    }
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal",
                                                                        !field.value &&
                                                                            "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(
                                                                            field.value,
                                                                            "PPP",
                                                                            {
                                                                                locale: ptBR,
                                                                            }
                                                                        )
                                                                    ) : (
                                                                        <span>
                                                                            Selecione
                                                                            a
                                                                            data
                                                                        </span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start"
                                                        >
                                                            <Calendar
                                                                mode="single"
                                                                selected={
                                                                    field.value
                                                                }
                                                                onSelect={
                                                                    field.onChange
                                                                }
                                                                disabled={(
                                                                    date
                                                                ) =>
                                                                    date >
                                                                        new Date() ||
                                                                    date <
                                                                        new Date(
                                                                            "1900-01-01"
                                                                        )
                                                                }
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Produto */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="product_model"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Modelo do Produto
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: iPhone 15 Pro 256GB"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="serial_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Serial / IMEI
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Número de série"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Encontrado na caixa ou
                                                        nas configurações.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={mutation.isPending}
                                    >
                                        {mutation.isPending
                                            ? "Enviando..."
                                            : "Registrar Garantia"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default WarrantyPage;
