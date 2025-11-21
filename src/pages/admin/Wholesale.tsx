/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    fetchWholesaleClients,
    createWholesaleClient,
    updateWholesaleClient,
    deleteWholesaleClient,
    fetchStores,
} from "@/lib/api";
import {
    WholesaleClient,
    WholesaleClientInsertPayload,
    WholesaleClientUpdatePayload,
    Store,
} from "@/types";
import { Loader2, Plus, Trash2, Edit, Building2 } from "lucide-react";

const wholesaleSchema = z.object({
    name: z.string().min(2, "Nome do representante obrigatório"),
    company_name: z.string().min(2, "Razão Social obrigatória"),
    cnpj: z.string().min(14, "CNPJ obrigatório"),
    cpf: z.string().optional(),
    email: z.string().email("Email obrigatório"),
    phone: z.string().min(10, "Telefone inválido"),
    address: z.string().min(5, "Endereço completo"),
    store_id: z.string().min(1, "Loja vinculada é obrigatória"),
});

type WholesaleFormValues = z.infer<typeof wholesaleSchema>;

const AdminWholesale = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<WholesaleClient | null>(
        null
    );

    const { data: clients, isLoading } = useQuery<WholesaleClient[]>({
        queryKey: ["wholesaleClients"],
        queryFn: fetchWholesaleClients,
    });

    const { data: stores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const form = useForm<WholesaleFormValues>({
        resolver: zodResolver(wholesaleSchema),
        defaultValues: {
            name: "",
            company_name: "",
            cnpj: "",
            cpf: "",
            email: "",
            phone: "",
            address: "",
            store_id: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: WholesaleClientInsertPayload) =>
            createWholesaleClient(data),
        onSuccess: () => {
            toast({
                title: "Sucesso",
                description: "Cliente Atacado cadastrado.",
            });
            queryClient.invalidateQueries({ queryKey: ["wholesaleClients"] });
            handleCloseDialog();
        },
        onError: (err) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: err.message,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: WholesaleClientUpdatePayload) =>
            updateWholesaleClient(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Dados atualizados." });
            queryClient.invalidateQueries({ queryKey: ["wholesaleClients"] });
            handleCloseDialog();
        },
        onError: (err) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: err.message,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteWholesaleClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wholesaleClients"] });
            toast({ title: "Cliente removido." });
        },
    });

    const handleEdit = (client: WholesaleClient) => {
        setEditingClient(client);
        form.reset({
            name: client.name,
            company_name: client.company_name,
            cnpj: client.cnpj,
            cpf: client.cpf || "",
            email: client.email,
            phone: client.phone,
            address: client.address,
            store_id: client.store_id || "",
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingClient(null);
        form.reset({
            name: "",
            company_name: "",
            cnpj: "",
            cpf: "",
            email: "",
            phone: "",
            address: "",
            store_id: "",
        });
    };

    const onSubmit = (values: WholesaleFormValues) => {
        if (editingClient) {
            updateMutation.mutate({ id: editingClient.id, ...values });
        } else {
            //@ts-ignore
            createMutation.mutate(values);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Clientes Atacado (PJ)
                        </h1>
                        <p className="text-muted-foreground">
                            Gerencie empresas parceiras e revendedores.
                        </p>
                    </div>
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => !open && handleCloseDialog()}
                    >
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingClient
                                        ? "Editar Cliente"
                                        : "Cadastrar Revendedor"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="company_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Razão Social / Empresa
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
                                            name="cnpj"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CNPJ</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Nome do Representante
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
                                            name="cpf"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        CPF (Opcional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Email de Login
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
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Telefone
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Endereço Completo
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
                                        name="store_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Loja Vinculada (Obrigatório)
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione a loja de compra" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {stores?.map(
                                                            (store) => (
                                                                <SelectItem
                                                                    key={
                                                                        store.id
                                                                    }
                                                                    value={
                                                                        store.id
                                                                    }
                                                                >
                                                                    {store.name}{" "}
                                                                    (
                                                                    {store.city}
                                                                    )
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    O cliente só poderá comprar
                                                    o estoque desta loja.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                            : "Salvar"}
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
                                <TableHead>Empresa</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Loja Vinculada</TableHead>
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
                            ) : (
                                clients?.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {client.company_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {client.cnpj}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {client.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {client.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {/* @ts-ignore: Join feito na API */}
                                            {client.Stores?.name || (
                                                <span className="text-destructive">
                                                    Sem vínculo
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleEdit(client)
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
                                                        client.id
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

export default AdminWholesale;
