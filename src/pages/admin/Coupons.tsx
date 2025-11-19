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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    fetchAllCoupons,
    createCoupon,
    deleteCoupon,
    toggleCouponStatus,
} from "@/lib/api";
import { Coupon, CouponInsertPayload } from "@/types";
import { Loader2, Plus, Trash2, TicketPercent } from "lucide-react";

const couponSchema = z.object({
    code: z
        .string()
        .min(3, "Código deve ter pelo menos 3 letras.")
        .toUpperCase(),
    discount_percent: z.string().refine((val) => {
        const n = Number(val);
        return !isNaN(n) && n > 0 && n <= 100;
    }, "Desconto deve ser entre 1% e 100%"),
    active: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponSchema>;

const AdminCoupons = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: coupons, isLoading } = useQuery<Coupon[]>({
        queryKey: ["adminCoupons"],
        queryFn: fetchAllCoupons,
    });

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: "",
            discount_percent: "10",
            active: true,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CouponInsertPayload) => createCoupon(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Cupom criado." });
            queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
            setIsDialogOpen(false);
            form.reset();
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

    const onSubmit = (values: CouponFormValues) => {
        createMutation.mutate({
            code: values.code,
            discount_percent: Number(values.discount_percent),
            active: values.active,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Gerenciar Cupons</h1>
                        <p className="text-muted-foreground">
                            Crie códigos de desconto para seus clientes.
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo Cupom
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Criar Cupom de Desconto
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
                                                <FormLabel>
                                                    Código (Ex: NATAL10)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="CÓDIGO"
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
                                    <FormField
                                        control={form.control}
                                        name="discount_percent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Porcentagem de Desconto (%)
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
                                        name="active"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Ativo</FormLabel>
                                                    <FormDescription>
                                                        Cupom pode ser usado
                                                        imediatamente?
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending
                                            ? "Criando..."
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
                                        colSpan={4}
                                        className="text-center py-8"
                                    >
                                        <Loader2 className="animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : !coupons || coupons.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
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
