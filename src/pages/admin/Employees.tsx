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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Employee, Store } from "@/types";
import {
    fetchEmployees,
    fetchStores, // Precisamos das lojas para o dropdown
    createEmployee,
    updateEmployee,
    deleteEmployee,
    EmployeeInsertPayload,
    EmployeeUpdatePayload,
} from "@/lib/api";

// 1. Schema de Validação (Zod) para o formulário de Funcionário
const employeeSchema = z.object({
    name: z.string().min(2, { message: "O nome é obrigatório." }),
    email: z.string().email({ message: "E-mail inválido." }),
    store_id: z.string().optional().nullable(), // O ID da loja (pode ser nulo)
});
type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const AdminEmployees = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
        null
    );

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: { name: "", email: "", store_id: null },
    });

    // 3. Efeito para preencher o formulário
    useEffect(() => {
        if (employeeToEdit) {
            form.reset({
                name: employeeToEdit.name,
                email: employeeToEdit.email,
                store_id: employeeToEdit.store_id || null, // Garante que seja nulo ou string
            });
            setIsFormOpen(true);
        } else {
            form.reset({ name: "", email: "", store_id: null });
        }
    }, [employeeToEdit, form]);

    // 4. Query para buscar Funcionários
    const {
        data: employees,
        isLoading: isLoadingEmployees,
        isError: isErrorEmployees,
    } = useQuery<Employee[]>({
        queryKey: ["employees"],
        queryFn: fetchEmployees,
    });

    // 5. Query para buscar Lojas (para o dropdown do formulário)
    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    // 6. Mutações (Create, Update, Delete)

    const createMutation = useMutation({
        mutationFn: (data: EmployeeInsertPayload) => createEmployee(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Funcionário criado." });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
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
        mutationFn: (data: EmployeeUpdatePayload) => updateEmployee(data),
        onSuccess: () => {
            toast({
                title: "Sucesso!",
                description: "Funcionário atualizado.",
            });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setIsFormOpen(false);
            setEmployeeToEdit(null);
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
        mutationFn: (employeeId: string) => deleteEmployee(employeeId),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Funcionário excluído." });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            setEmployeeToDelete(null);
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            });
            setEmployeeToDelete(null);
        },
    });

    // 7. Função de Envio do Formulário
    const onSubmit = (data: EmployeeFormValues) => {
        // Garante que o store_id seja nulo se a string estiver vazia
        const payloadData = { ...data, store_id: data.store_id || null };

        if (employeeToEdit) {
            const payload: EmployeeUpdatePayload = {
                ...payloadData,
                id: employeeToEdit.id,
            };
            updateMutation.mutate(payload);
        } else {
            const payload: EmployeeInsertPayload = payloadData;
            createMutation.mutate(payload);
        }
    };

    const isLoading = isLoadingEmployees || isLoadingStores;
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
                            Gerenciar Funcionários
                        </h1>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEmployeeToEdit(null)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Novo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {employeeToEdit
                                        ? "Editar Funcionário"
                                        : "Adicionar Novo Funcionário"}
                                </DialogTitle>
                                <DialogDescription>
                                    Preencha os dados do funcionário. A senha é
                                    gerenciada pelo Supabase Auth.
                                </DialogDescription>
                            </DialogHeader>
                            {/* 8. Formulário dentro do Modal */}
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
                                                    Nome Completo
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nome do Funcionário"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>E-mail</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="email@dominio.com"
                                                        {...field}
                                                    />
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
                                                    Loja (Opcional)
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value || ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma loja" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="">
                                                            Nenhuma
                                                            (Admin/Geral)
                                                        </SelectItem>
                                                        {isLoadingStores && (
                                                            <SelectItem
                                                                value="loading"
                                                                disabled
                                                            >
                                                                Carregando
                                                                lojas...
                                                            </SelectItem>
                                                        )}
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
                                                                    {store.name}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
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

                {/* 9. Tabela de Funcionários */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Loja</TableHead>
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
                                            <Skeleton className="h-5 w-2/3" />
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
                            {isErrorEmployees && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-destructive"
                                    >
                                        <AlertTriangle className="mr-2 inline h-4 w-4" />
                                        Erro ao carregar os funcionários.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading &&
                                !isErrorEmployees &&
                                employees?.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium">
                                            {employee.name}
                                        </TableCell>
                                        <TableCell>{employee.email}</TableCell>
                                        <TableCell>
                                            {employee.Stores ? (
                                                <Badge variant="secondary">
                                                    {employee.Stores.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    N/A
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    setEmployeeToEdit(employee)
                                                }
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    setEmployeeToDelete(
                                                        employee
                                                    )
                                                }
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

                {!isLoading && !isErrorEmployees && employees?.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground">
                        Nenhum funcionário cadastrado ainda.
                    </div>
                )}
            </main>

            {/* 10. Diálogo de Confirmação de Exclusão */}
            <AlertDialog
                open={!!employeeToDelete}
                onOpenChange={(open) => {
                    if (!open) setEmployeeToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá excluir
                            permanentemente o funcionário
                            <span className="font-medium">
                                {" "}
                                "{employeeToDelete?.name}"{" "}
                            </span>
                            .
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
                                deleteMutation.mutate(employeeToDelete!.id)
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

export default AdminEmployees;
