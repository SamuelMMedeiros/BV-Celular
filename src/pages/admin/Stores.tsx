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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Store } from "@/types";
import {
    fetchStores,
    createStore,
    updateStore,
    deleteStore,
    StoreInsertPayload,
    StoreUpdatePayload,
} from "@/lib/api";
import { Edit, Trash2, Plus, MapPin } from "lucide-react";

const storeSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    whatsapp: z.string().min(10, "WhatsApp inválido."),
    city: z.string().optional(),
    address: z.string().optional(), // <-- NOVO CAMPO
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
            address: "", // <-- NOVO CAMPO
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
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: StoreUpdatePayload) => updateStore(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Loja atualizada." });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
            handleCloseDialog();
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
        },
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
        form.reset({
            name: store.name,
            whatsapp: store.whatsapp,
            city: store.city || "",
            address: store.address || "", // <-- NOVO CAMPO
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
        form.reset({ name: "", whatsapp: "", city: "", address: "" });
    };

    const onSubmit = (data: StoreFormValues) => {
        if (editingStore) {
            updateMutation.mutate({ ...data, id: editingStore.id });
        } else {
            createMutation.mutate(data);
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
                        <DialogContent>
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
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nome da Loja
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex: Unidade Centro"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="whatsapp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="5534999999999"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cidade</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Uberlândia"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* NOVO CAMPO DE ENDEREÇO */}
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Endereço Completo
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Av. Afonso Pena, 1000"
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
                                        disabled={
                                            createMutation.isPending ||
                                            updateMutation.isPending
                                        }
                                    >
                                        {editingStore ? "Atualizar" : "Criar"}
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
                                <TableHead>Cidade</TableHead>
                                <TableHead>Endereço</TableHead>
                                <TableHead>WhatsApp</TableHead>
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
                                    <TableCell>{store.city || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {store.address && (
                                                <MapPin className="h-3 w-3" />
                                            )}
                                            {store.address || "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{store.whatsapp}</TableCell>
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
