//
// === CÓDIGO COMPLETO PARA: src/pages/admin/Stores.tsx ===
//
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Store, StoreInsertPayload, StoreUpdatePayload } from "@/types";
import { fetchStores, createStore, updateStore, deleteStore } from "@/lib/api";
import {
    Edit,
    Trash2,
    Plus,
    MapPin,
    FileText,
    Truck,
    CreditCard,
} from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const storeSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    whatsapp: z.string().min(10, "WhatsApp inválido."),
    city: z.string().optional(),
    address: z.string().optional(),
    cnpj: z.string().optional(),
    delivery_fixed_fee: z.string().optional(),
    free_shipping_min_value: z.string().optional(),
    // Campos Stripe
    stripe_enabled: z.boolean().default(false),
    stripe_public_key: z.string().optional(),
    stripe_secret_key: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

const AdminStores = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);

    const { data: stores, isLoading } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: "",
            whatsapp: "",
            city: "",
            address: "",
            cnpj: "",
            delivery_fixed_fee: "",
            free_shipping_min_value: "",
            stripe_enabled: false,
            stripe_public_key: "",
            stripe_secret_key: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: StoreInsertPayload) => createStore(data),
        onSuccess: () => {
            toast({
                title: "Sucesso",
                description: "Loja criada com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
            handleCloseDialog();
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: StoreUpdatePayload) => updateStore(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Loja atualizada." });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
            handleCloseDialog();
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteStore(id),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Loja removida." });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
        },
    });

    const handleEdit = (store: Store) => {
        setEditingStore(store);

        const feeFormatted = store.delivery_fixed_fee
            ? store.delivery_fixed_fee.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
              })
            : "";
        const freeShippingFormatted = store.free_shipping_min_value
            ? store.free_shipping_min_value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
              })
            : "";

        form.reset({
            name: store.name,
            whatsapp: store.whatsapp,
            city: store.city || "",
            address: store.address || "",
            cnpj: store.cnpj || "",
            delivery_fixed_fee: feeFormatted,
            free_shipping_min_value: freeShippingFormatted,
            stripe_enabled: store.stripe_enabled || false,
            stripe_public_key: store.stripe_public_key || "",
            stripe_secret_key: store.stripe_secret_key || "",
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta loja?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingStore(null);
        form.reset({
            name: "",
            whatsapp: "",
            city: "",
            address: "",
            cnpj: "",
            delivery_fixed_fee: "",
            free_shipping_min_value: "",
            stripe_enabled: false,
            stripe_public_key: "",
            stripe_secret_key: "",
        });
    };

    const onSubmit = (data: StoreFormValues) => {
        const feeCents = parseCurrency(data.delivery_fixed_fee);
        const freeShippingCents = parseCurrency(data.free_shipping_min_value);

        const payload = {
            ...data,
            delivery_fixed_fee: feeCents !== undefined ? feeCents / 100 : 0,
            free_shipping_min_value:
                freeShippingCents !== undefined ? freeShippingCents / 100 : 0,
        };

        if (editingStore) {
            updateMutation.mutate({ ...payload, id: editingStore.id });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleCurrencyBlur = (
        e: React.FocusEvent<HTMLInputElement>,
        fieldName: "delivery_fixed_fee" | "free_shipping_min_value"
    ) => {
        const value = e.target.value;
        const cents = parseCurrency(value);
        if (cents !== undefined) {
            const formatted = (cents / 100).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
            });
            form.setValue(fieldName, formatted);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Gerenciar Lojas</h1>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => {
                                    setEditingStore(null);
                                    form.reset();
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Nova Loja
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingStore ? "Editar Loja" : "Nova Loja"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <Tabs
                                        defaultValue="info"
                                        className="w-full"
                                    >
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="info">
                                                Informações
                                            </TabsTrigger>
                                            <TabsTrigger value="payment">
                                                Pagamento (Stripe)
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* ABA INFORMAÇÕES GERAIS */}
                                        <TabsContent
                                            value="info"
                                            className="space-y-4"
                                        >
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Nome da Loja
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="whatsapp"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                WhatsApp
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="cnpj"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                CNPJ
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Cidade
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Endereço
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="delivery_fixed_fee"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Taxa Entrega
                                                                (R$)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="0,00"
                                                                    {...field}
                                                                    onBlur={(
                                                                        e
                                                                    ) =>
                                                                        handleCurrencyBlur(
                                                                            e,
                                                                            "delivery_fixed_fee"
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="free_shipping_min_value"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Frete Grátis
                                                                (R$)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="0,00"
                                                                    {...field}
                                                                    onBlur={(
                                                                        e
                                                                    ) =>
                                                                        handleCurrencyBlur(
                                                                            e,
                                                                            "free_shipping_min_value"
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </TabsContent>

                                        {/* ABA PAGAMENTO (STRIPE) */}
                                        <TabsContent
                                            value="payment"
                                            className="space-y-4"
                                        >
                                            <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground mb-4">
                                                Configure as chaves da sua conta
                                                Stripe para receber pagamentos
                                                online.
                                                <br />
                                                <strong>Segurança:</strong>{" "}
                                                Apenas administradores podem ver
                                                e editar estes dados.
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="stripe_enabled"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                Ativar Pagamento
                                                                Online
                                                            </FormLabel>
                                                            <FormDescription>
                                                                Habilita cartão
                                                                de crédito no
                                                                checkout.
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {form.watch("stripe_enabled") && (
                                                <>
                                                    <FormField
                                                        control={form.control}
                                                        name="stripe_public_key"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Chave
                                                                    Pública
                                                                    (Publishable
                                                                    Key)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="pk_test_..."
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="stripe_secret_key"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Chave
                                                                    Secreta
                                                                    (Secret Key)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="password"
                                                                        placeholder="sk_test_..."
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </>
                                            )}
                                        </TabsContent>
                                    </Tabs>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            createMutation.isPending ||
                                            updateMutation.isPending
                                        }
                                    >
                                        {editingStore
                                            ? "Atualizar Loja"
                                            : "Criar Loja"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Logística</TableHead>
                                <TableHead>Pagamento</TableHead>
                                <TableHead>Dados</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stores?.map((store) => (
                                <TableRow key={store.id}>
                                    <TableCell className="font-medium">
                                        {store.name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Truck className="h-3 w-3 text-muted-foreground" />{" "}
                                                <span>
                                                    {store.delivery_fixed_fee
                                                        ? formatCurrency(
                                                              store.delivery_fixed_fee *
                                                                  100
                                                          )
                                                        : "Grátis"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {store.stripe_enabled ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CreditCard className="h-3 w-3 mr-1" />{" "}
                                                Stripe Ativo
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Inativo
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                            {store.address && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />{" "}
                                                    {store.address}
                                                </span>
                                            )}
                                            {store.cnpj && (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />{" "}
                                                    {store.cnpj}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(store)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() =>
                                                handleDelete(store.id)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
};

export default AdminStores;
