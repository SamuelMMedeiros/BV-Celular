/* eslint-disable @typescript-eslint/ban-ts-comment */
//
// === CÓDIGO COMPLETO PARA: src/pages/admin/Drivers.tsx ===
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
// --- CORREÇÃO 1: Remover o Payload daqui ---
import { fetchDrivers, createDriver, deleteDriver } from "@/lib/api";
// --- CORREÇÃO 2: Importar o Payload daqui ---
import { Driver, DriverInsertPayload } from "@/types";
import { Loader2, Plus, Trash2, Bike } from "lucide-react";

const driverSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone inválido"),
});

const AdminDrivers = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: drivers, isLoading } = useQuery<Driver[]>({
        queryKey: ["adminDrivers"],
        queryFn: fetchDrivers,
    });

    const form = useForm<z.infer<typeof driverSchema>>({
        resolver: zodResolver(driverSchema),
        defaultValues: { name: "", email: "", phone: "" },
    });

    const createMutation = useMutation({
        mutationFn: (data: DriverInsertPayload) => createDriver(data),
        onSuccess: () => {
            toast({ title: "Entregador cadastrado!" });
            queryClient.invalidateQueries({ queryKey: ["adminDrivers"] });
            setIsDialogOpen(false);
            form.reset();
        },
        onError: (err) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: err.message,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminDrivers"] });
            toast({ title: "Removido com sucesso" });
        },
    });

    const onSubmit = (values: z.infer<typeof driverSchema>) => {
        //@ts-ignore
        createMutation.mutate(values);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Entregadores</h1>
                        <p className="text-muted-foreground">
                            Gerencie a equipe de logística.
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Novo
                                Entregador
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Entregador</DialogTitle>
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Email de Acesso
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
                                                <FormLabel>Telefone</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending
                                            ? "Salvando..."
                                            : "Cadastrar"}
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
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
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
                                        className="text-center py-4"
                                    >
                                        <Loader2 className="animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                drivers?.map((driver) => (
                                    <TableRow key={driver.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Bike className="h-4 w-4" />{" "}
                                            {driver.name}
                                        </TableCell>
                                        <TableCell>{driver.email}</TableCell>
                                        <TableCell>{driver.phone}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() =>
                                                    deleteMutation.mutate(
                                                        driver.id
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

export default AdminDrivers;
