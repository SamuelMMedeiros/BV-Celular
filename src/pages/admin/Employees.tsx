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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
// --- CORREÇÃO AQUI: Importando tipos de @/types ---
import {
    Employee,
    Store,
    EmployeeInsertPayload,
    EmployeeUpdatePayload,
} from "@/types";
import {
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    fetchStores,
} from "@/lib/api";
import { Edit, Trash2, Plus, Link as LinkIcon, Check } from "lucide-react";

const employeeSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório."),
    email: z.string().email("Email inválido."),
    store_id: z.string().optional(),
    can_create: z.boolean().default(false),
    can_update: z.boolean().default(false),
    can_delete: z.boolean().default(false),
    is_driver: z.boolean().default(false), // Adicionado campo de entregador
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const AdminEmployees = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(
        null
    );
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { data: employees, isLoading } = useQuery<Employee[]>({
        queryKey: ["employees"],
        queryFn: fetchEmployees,
    });

    const { data: stores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            name: "",
            email: "",
            store_id: "all",
            can_create: false,
            can_update: false,
            can_delete: false,
            is_driver: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: EmployeeInsertPayload) => createEmployee(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Funcionário criado." });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
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
        mutationFn: (data: EmployeeUpdatePayload) => updateEmployee(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Funcionário atualizado." });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
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
        mutationFn: (id: string) => deleteEmployee(id),
        onSuccess: () =>
            toast({ title: "Sucesso", description: "Funcionário removido." }),
    });

    const handleEdit = (emp: Employee) => {
        setEditingEmployee(emp);
        form.reset({
            name: emp.name,
            email: emp.email,
            store_id: emp.store_id || "all",
            can_create: emp.can_create || false,
            can_update: emp.can_update || false,
            can_delete: emp.can_delete || false,
            is_driver: emp.is_driver || false,
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingEmployee(null);
        form.reset({
            name: "",
            email: "",
            store_id: "all",
            can_create: false,
            can_update: false,
            can_delete: false,
            is_driver: false,
        });
    };

    const onSubmit = (data: EmployeeFormValues) => {
        const payloadStoreId = data.store_id === "all" ? null : data.store_id;

        const payload = {
            ...data,
            store_id: payloadStoreId,
        };

        if (editingEmployee) {
            updateMutation.mutate({ ...payload, id: editingEmployee.id });
        } else {
            // Nota: Idealmente o ID viria da criação do Auth user
            createMutation.mutate({ ...payload, id: crypto.randomUUID() });
        }
    };

    const copyLink = (employeeId: string) => {
        const link = `${window.location.origin}/?ref=${employeeId}`;
        navigator.clipboard.writeText(link);

        setCopiedId(employeeId);
        setTimeout(() => setCopiedId(null), 2000);

        toast({
            title: "Link copiado!",
            description: "Link de vendedor copiado.",
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">
                        Gerenciar Funcionários
                    </h1>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => {
                                    setEditingEmployee(null);
                                    form.reset();
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Novo
                                Funcionário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingEmployee ? "Editar" : "Novo"}{" "}
                                    Funcionário
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
                                                <FormLabel>Nome</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Email (Login)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="store_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Loja Vinculada
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="all">
                                                            Todas (Super Admin)
                                                        </SelectItem>
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
                                                <FormDescription>
                                                    Se "Todas", ele vê tudo.
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2 border p-4 rounded-md">
                                        <h4 className="font-medium text-sm">
                                            Permissões
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="can_create"
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
                                                            Criar
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="can_update"
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
                                                            Editar
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="can_delete"
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
                                                            Excluir
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="is_driver"
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
                                                            É Entregador
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full">
                                        Salvar
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
                                <TableHead>Loja</TableHead>
                                <TableHead>Link de Venda</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees?.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {emp.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {emp.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {emp.Stores?.name || (
                                            <span className="font-bold text-primary">
                                                Super Admin
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyLink(emp.id)}
                                            className="gap-2 min-w-[140px]"
                                        >
                                            {copiedId === emp.id ? (
                                                <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <LinkIcon className="h-3 w-3" />
                                            )}
                                            {copiedId === emp.id
                                                ? "Copiado!"
                                                : "Copiar Link"}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(emp)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() =>
                                                deleteMutation.mutate(emp.id)
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

export default AdminEmployees;
