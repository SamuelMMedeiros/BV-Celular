import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
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

// 1. Schema de Validação (Zod) para o formulário de Loja
const storeSchema = z.object({
    name: z.string().min(2, { message: "O nome é obrigatório." }),
    whatsapp: z
        .string()
        .min(10, { message: "O WhatsApp é obrigatório (só números)." }),
    city: z.string().optional(),
});
type StoreFormValues = z.infer<typeof storeSchema>;

export const AdminStores = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Estado para controlar o modal de Adicionar/Editar
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [storeToEdit, setStoreToEdit] = useState<Store | null>(null);

    // Estado para controlar o diálogo de Excluir
    const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

    // 2. Configuração do Formulário (React Hook Form)
    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeSchema),
        defaultValues: { name: "", whatsapp: "", city: "" },
    });

    // 3. Efeito para preencher o formulário quando 'storeToEdit' mudar
    useEffect(() => {
        if (storeToEdit) {
            form.reset({
                name: storeToEdit.name,
                whatsapp: storeToEdit.whatsapp,
                city: storeToEdit.city || "",
            });
            setIsFormOpen(true); // Abre o modal
        } else {
            form.reset({ name: "", whatsapp: "", city: "" }); // Limpa ao fechar
        }
    }, [storeToEdit, form]);

    // 4. Query para buscar todas as Lojas
    const {
        data: stores,
        isLoading,
        isError,
    } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    // 5. Mutações (Create, Update, Delete)

    const createMutation = useMutation({
        mutationFn: (data: StoreInsertPayload) => createStore(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Loja criada." });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
            setIsFormOpen(false);
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
            toast({ title: "Sucesso!", description: "Loja atualizada." });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
            setIsFormOpen(false);
            setStoreToEdit(null);
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
        mutationFn: (storeId: string) => deleteStore(storeId),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Loja excluída." });
            queryClient.invalidateQueries({ queryKey: ["stores"] });
            setStoreToDelete(null);
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
            setStoreToDelete(null);
        },
    });

    // 6. Função de Envio do Formulário (decide entre Criar ou Atualizar)
    const onSubmit = (data: StoreFormValues) => {
        if (storeToEdit) {
            // Modo Edição
            const payload: StoreUpdatePayload = { ...data, id: storeToEdit.id };
            updateMutation.mutate(payload);
        } else {
            // Modo Criação
            const payload: StoreInsertPayload = data;
            createMutation.mutate(payload);
        }
    };

    const isLoadingMutation =
        createMutation.isPending || updateMutation.isPending;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8">
                {/* Cabeçalho da Página */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2"
                        >
                            <Link to="/admin">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao Painel
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">
                            Gerenciar Lojas
                        </h1>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setStoreToEdit(null)}>
                                {" "}
                                {/* Limpa o form para 'Criar' */}
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Nova
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {storeToEdit
                                        ? "Editar Loja"
                                        : "Adicionar Nova Loja"}
                                </DialogTitle>
                                <DialogDescription>
                                    Preencha os dados da loja.
                                </DialogDescription>
                            </DialogHeader>
                            {/* 7. Formulário dentro do Modal */}
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
                                                        placeholder="Loja Centro"
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
                                                <FormLabel>
                                                    WhatsApp (com DDD)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        placeholder="34999998888"
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
                                                <FormLabel>
                                                    Cidade (Opcional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Patos de Minas"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={isLoadingMutation}
                                            >
                                                Cancelar
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            disabled={isLoadingMutation}
                                        >
                                            {isLoadingMutation
                                                ? "Salvando..."
                                                : "Salvar"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 8. Tabela de Lojas */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>WhatsApp</TableHead>
                                <TableHead>Cidade</TableHead>
                                <TableHead className="w-[100px]">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading &&
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-1/2" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-1/3" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-1/3" />
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {isError && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-destructive"
                                    >
                                        <AlertTriangle className="mr-2 inline h-4 w-4" />
                                        Erro ao carregar as lojas.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading &&
                                !isError &&
                                stores?.map((store) => (
                                    <TableRow key={store.id}>
                                        <TableCell className="font-medium">
                                            {store.name}
                                        </TableCell>
                                        <TableCell>{store.whatsapp}</TableCell>
                                        <TableCell>
                                            {store.city || "N/A"}
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    setStoreToEdit(store)
                                                } // Abre o modal para Edição
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    setStoreToDelete(store)
                                                } // Abre o alerta de exclusão
                                                disabled={
                                                    deleteMutation.isPending
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

                {!isLoading && !isError && stores?.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground">
                        Nenhuma loja cadastrada ainda.
                    </div>
                )}
            </main>

            {/* 9. Diálogo de Confirmação de Exclusão */}
            <AlertDialog
                open={!!storeToDelete}
                onOpenChange={(open) => {
                    if (!open) setStoreToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá excluir
                            permanentemente a loja
                            <span className="font-medium">
                                {" "}
                                "{storeToDelete?.name}"{" "}
                            </span>
                            e removerá sua associação com todos os produtos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({
                                variant: "destructive",
                            })}
                            onClick={() =>
                                deleteMutation.mutate(storeToDelete!.id)
                            }
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? "Excluindo..."
                                : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminStores;
