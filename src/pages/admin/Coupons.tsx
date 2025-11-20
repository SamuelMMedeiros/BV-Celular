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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    fetchAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
} from "@/lib/api";
import { Coupon, CouponInsertPayload, CouponUpdatePayload } from "@/types";
import {
    Loader2,
    Plus,
    Trash2,
    Edit,
    Calendar as CalendarIcon,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency, parseCurrency } from "@/lib/utils";
import { format } from "date-fns";

const couponSchema = z.object({
    code: z
        .string()
        .min(3, "Código deve ter pelo menos 3 letras.")
        .toUpperCase(),
    discount_percent: z.string().refine((val) => {
        const n = Number(val);
        return !isNaN(n) && n > 0 && n <= 100;
    }, "Desconto deve ser entre 1% e 100%"),
    min_purchase_value: z.string().optional(),
    valid_until: z.date().optional(),
    active: z.boolean().default(true),
    allow_with_promotion: z.boolean().default(false),
    valid_for_aparelho: z.boolean().default(true),
    valid_for_acessorio: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;

const AdminCoupons = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const { data: coupons, isLoading } = useQuery<Coupon[]>({
        queryKey: ["adminCoupons"],
        queryFn: fetchAllCoupons,
    });

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: "",
            discount_percent: "10",
            min_purchase_value: "",
            active: true,
            allow_with_promotion: false,
            valid_for_aparelho: true,
            valid_for_acessorio: true,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CouponInsertPayload) => createCoupon(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Cupom criado." });
            queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
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
        mutationFn: (data: CouponUpdatePayload) => updateCoupon(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Cupom atualizado." });
            queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
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
        mutationFn: (id: string) => deleteCoupon(id),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Cupom removido." });
            queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: boolean }) =>
            toggleCouponStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
            toast({
                title: "Atualizado",
                description: "Status do cupom alterado.",
            });
        },
    });

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);

        // --- CORREÇÃO DO BUG ---
        // O valor no banco já está em Reais (ex: 50).
        // Não multiplicamos por 100 aqui. Apenas formatamos para string.
        // 50 -> "50,00"
        const minValueFormatted = coupon.min_purchase_value
            ? coupon.min_purchase_value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
              })
            : "";

        form.reset({
            code: coupon.code,
            discount_percent: String(coupon.discount_percent),
            min_purchase_value: minValueFormatted,
            valid_until: coupon.valid_until
                ? new Date(coupon.valid_until)
                : undefined,
            active: coupon.active,
            allow_with_promotion: coupon.allow_with_promotion || false,
            valid_for_aparelho:
                coupon.valid_for_categories?.includes("aparelho") ?? true,
            valid_for_acessorio:
                coupon.valid_for_categories?.includes("acessorio") ?? true,
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCoupon(null);
        form.reset({
            code: "",
            discount_percent: "10",
            min_purchase_value: "",
            active: true,
            allow_with_promotion: false,
            valid_for_aparelho: true,
            valid_for_acessorio: true,
        });
    };

    const onSubmit = (values: CouponFormValues) => {
        // O parseCurrency retorna CENTAVOS (ex: "50,00" -> 5000)
        const minValueCents = values.min_purchase_value
            ? parseCurrency(values.min_purchase_value)
            : undefined;

        const categories = [];
        if (values.valid_for_aparelho) categories.push("aparelho");
        if (values.valid_for_acessorio) categories.push("acessorio");

        if (categories.length === 0) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Selecione pelo menos uma categoria.",
            });
            return;
        }

        const payload = {
            code: values.code,
            discount_percent: Number(values.discount_percent),
            active: values.active,
            valid_until: values.valid_until,
            // O banco espera REAIS (Numeric), então dividimos por 100
            // Ex: 5000 centavos -> 50.00 Reais
            min_purchase_value: minValueCents ? minValueCents / 100 : undefined,
            valid_for_categories: categories,
            allow_with_promotion: values.allow_with_promotion,
        };

        if (editingCoupon) {
            updateMutation.mutate({ ...payload, id: editingCoupon.id });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleValueBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cents = parseCurrency(value);
        if (cents !== undefined) {
            // Exibe de volta como Reais (ex: "50,00")
            const formatted = (cents / 100).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
            });
            form.setValue("min_purchase_value", formatted);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Gerenciar Cupons</h1>
                        <p className="text-muted-foreground">
                            Crie códigos de desconto com regras.
                        </p>
                    </div>
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => !open && handleCloseDialog()}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Cupom
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCoupon
                                        ? "Editar Cupom"
                                        : "Criar Cupom"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Código</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="NATAL10"
                                                        {...field}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="discount_percent"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Desconto (%)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="10"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="min_purchase_value"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Valor Mínimo (R$)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="0,00"
                                                            {...field}
                                                            onBlur={
                                                                handleValueBlur
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Opcional
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="valid_until"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    Validade (Opcional)
                                                </FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
                                                                className={cn(
                                                                    "pl-3 text-left font-normal",
                                                                    !field.value &&
                                                                        "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(
                                                                        field.value,
                                                                        "dd/MM/yyyy"
                                                                    )
                                                                ) : (
                                                                    <span>
                                                                        Sem
                                                                        validade
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
                                                            disabled={(date) =>
                                                                date <
                                                                new Date()
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* REGRAS DE CATEGORIA */}
                                    <div className="space-y-3 border p-4 rounded-md">
                                        <h4 className="text-sm font-medium">
                                            Válido para:
                                        </h4>
                                        <div className="flex gap-4">
                                            <FormField
                                                control={form.control}
                                                name="valid_for_aparelho"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            Aparelhos
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="valid_for_acessorio"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            Acessórios
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* OPÇÕES EXTRAS */}
                                    <div className="space-y-3">
                                        <FormField
                                            control={form.control}
                                            name="allow_with_promotion"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>
                                                            Acumular com
                                                            Promoção?
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Se marcado, aplica
                                                            desconto mesmo em
                                                            itens já
                                                            promocionais.
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

                                        <FormField
                                            control={form.control}
                                            name="active"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>
                                                            Ativo
                                                        </FormLabel>
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
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            createMutation.isPending ||
                                            updateMutation.isPending
                                        }
                                    >
                                        {createMutation.isPending ||
                                        updateMutation.isPending
                                            ? "Salvando..."
                                            : editingCoupon
                                            ? "Atualizar Cupom"
                                            : "Criar Cupom"}
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
                                <TableHead>Código</TableHead>
                                <TableHead>Desconto</TableHead>
                                <TableHead>Mínimo</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8"
                                    >
                                        <Loader2 className="animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : !coupons || coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        Nenhum cupom criado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-mono font-bold text-lg">
                                            {coupon.code}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.discount_percent}%
                                        </TableCell>
                                        <TableCell>
                                            {coupon.min_purchase_value
                                                ? formatCurrency(
                                                      coupon.min_purchase_value
                                                  )
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.valid_until
                                                ? format(
                                                      new Date(
                                                          coupon.valid_until
                                                      ),
                                                      "dd/MM/yyyy"
                                                  )
                                                : "Ilimitado"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={coupon.active}
                                                    onCheckedChange={() =>
                                                        toggleMutation.mutate({
                                                            id: coupon.id,
                                                            status: coupon.active,
                                                        })
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {coupon.active
                                                        ? "Ativo"
                                                        : "Inativo"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleEdit(coupon)
                                                }
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() =>
                                                    deleteMutation.mutate(
                                                        coupon.id
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>
        </div>
    );
};

export default AdminCoupons;
