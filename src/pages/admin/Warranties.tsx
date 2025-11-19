import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    fetchClients,
    fetchStores,
    createWarranty,
    fetchAllWarranties,
} from "@/lib/api";
import {
    Warranty,
    CustomerProfile,
    Store,
    WarrantyInsertPayload,
} from "@/types";
import {
    Loader2,
    Plus,
    Printer,
    ShieldCheck,
    Calendar as CalendarIcon,
    Search,
    MapPin,
    Smartphone,
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// --- SCHEMA DE VALIDAÇÃO ---
const warrantyFormSchema = z.object({
    client_id: z.string().min(1, "Selecione um cliente."),
    store_id: z.string().min(1, "Selecione uma loja."),
    product_model: z.string().min(2, "Modelo é obrigatório."),
    serial_number: z.string().min(2, "Serial/IMEI é obrigatório."),
    invoice_number: z.string().optional(),
    purchase_date: z.date({ required_error: "Data da compra obrigatória" }),
    warranty_months: z
        .string()
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Inválido"),
});

type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

const AdminWarranties = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Estados de controle
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [calculatedEndDate, setCalculatedEndDate] = useState<Date | null>(
        null
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [warrantyToPrint, setWarrantyToPrint] = useState<Warranty | null>(
        null
    );

    // Buscas de dados (API)
    const { data: clients } = useQuery<CustomerProfile[]>({
        queryKey: ["adminClients"],
        queryFn: fetchClients,
    });
    const { data: stores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });
    const { data: warranties, isLoading } = useQuery<Warranty[]>({
        queryKey: ["adminWarranties"],
        queryFn: fetchAllWarranties,
    });

    const form = useForm<WarrantyFormValues>({
        resolver: zodResolver(warrantyFormSchema),
        defaultValues: {
            product_model: "",
            serial_number: "",
            invoice_number: "",
            warranty_months: "3", // Padrão sugerido
        },
    });

    // --- LÓGICA DE DATA AUTOMÁTICA ---
    const purchaseDate = form.watch("purchase_date");
    const months = form.watch("warranty_months");

    useEffect(() => {
        if (purchaseDate && months && !isNaN(Number(months))) {
            const endDate = addMonths(purchaseDate, Number(months));
            setCalculatedEndDate(endDate);
        } else {
            setCalculatedEndDate(null);
        }
    }, [purchaseDate, months]);

    // --- MUTAÇÃO DE CRIAÇÃO ---
    const createMutation = useMutation({
        mutationFn: (data: WarrantyInsertPayload) => createWarranty(data),
        onSuccess: () => {
            toast({
                title: "Sucesso",
                description: "Garantia gerada e salva.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminWarranties"] });
            setIsDialogOpen(false);
            form.reset({
                product_model: "",
                serial_number: "",
                invoice_number: "",
                warranty_months: "3",
            });
            setCalculatedEndDate(null);
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const onSubmit = (values: WarrantyFormValues) => {
        if (!calculatedEndDate) return;

        const payload: WarrantyInsertPayload = {
            client_id: values.client_id,
            store_id: values.store_id,
            product_model: values.product_model,
            serial_number: values.serial_number,
            invoice_number: values.invoice_number || "",
            purchase_date: values.purchase_date,
            warranty_months: Number(values.warranty_months),
            warranty_end_date: calculatedEndDate,
        };

        createMutation.mutate(payload);
    };

    // Filtragem para a tabela
    const filteredWarranties = warranties?.filter(
        (w) =>
            w.product_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.Clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Gestão de Garantias
                        </h1>
                        <p className="text-muted-foreground">
                            Emita certificados oficiais para seus clientes.
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> Nova Garantia
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Gerar Nova Garantia</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados da venda para gerar o
                                    certificado.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-6 mt-4"
                                >
                                    {/* Seleção de Cliente e Loja */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="client_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Cliente
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Buscar cliente cadastrado..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {clients?.map(
                                                                (client) => (
                                                                    <SelectItem
                                                                        key={
                                                                            client.id
                                                                        }
                                                                        value={
                                                                            client.id
                                                                        }
                                                                    >
                                                                        {
                                                                            client.name
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                            client.phone
                                                                        }
                                                                        )
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
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
                                                        Loja da Venda
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione a loja..." />
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
                                                                        {
                                                                            store.name
                                                                        }{" "}
                                                                        {store.city
                                                                            ? `- ${store.city}`
                                                                            : ""}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Dados do Produto */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                            placeholder="Ex: iPhone 15 Pro Max 256GB"
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
                                                            placeholder="Digite o serial único"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Datas e Prazo */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
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
                                                                            Selecione
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
                                        <FormField
                                            control={form.control}
                                            name="warranty_months"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Prazo (Meses)
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="1">
                                                                1 Mês
                                                            </SelectItem>
                                                            <SelectItem value="3">
                                                                3 Meses
                                                            </SelectItem>
                                                            <SelectItem value="6">
                                                                6 Meses
                                                            </SelectItem>
                                                            <SelectItem value="12">
                                                                12 Meses
                                                            </SelectItem>
                                                            <SelectItem value="24">
                                                                24 Meses
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                Válido até:
                                            </span>
                                            <div className="h-10 px-3 py-2 rounded-md border bg-green-50 text-green-700 font-bold flex items-center text-sm border-green-200">
                                                {calculatedEndDate
                                                    ? format(
                                                          calculatedEndDate,
                                                          "dd/MM/yyyy"
                                                      )
                                                    : "-"}
                                            </div>
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="invoice_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nota Fiscal (Opcional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Número da NF"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending
                                            ? "Gerando Certificado..."
                                            : "Emitir Garantia"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Barra de Busca e Tabela */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <CardTitle>Histórico de Emissões</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, modelo ou serial..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Emissão</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Produto</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Loja</TableHead>
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
                                                className="text-center py-12"
                                            >
                                                <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !filteredWarranties ||
                                      filteredWarranties.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center py-12 text-muted-foreground"
                                            >
                                                Nenhuma garantia encontrada.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredWarranties.map((warranty) => {
                                            // Verifica se está vencida
                                            const isExpired =
                                                new Date(
                                                    warranty.warranty_end_date
                                                ) < new Date();
                                            return (
                                                <TableRow key={warranty.id}>
                                                    <TableCell>
                                                        {format(
                                                            new Date(
                                                                warranty.created_at
                                                            ),
                                                            "dd/MM/yyyy"
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {
                                                                warranty.Clients
                                                                    ?.name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                warranty.Clients
                                                                    ?.phone
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {
                                                                warranty.product_model
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            S/N:{" "}
                                                            {
                                                                warranty.serial_number
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                "font-bold",
                                                                isExpired
                                                                    ? "text-red-500"
                                                                    : "text-green-600"
                                                            )}
                                                        >
                                                            {format(
                                                                new Date(
                                                                    warranty.warranty_end_date
                                                                ),
                                                                "dd/MM/yyyy"
                                                            )}
                                                        </span>
                                                        {isExpired && (
                                                            <span className="text-xs text-red-400 block">
                                                                Vencida
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {warranty.Stores?.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() =>
                                                                setWarrantyToPrint(
                                                                    warranty
                                                                )
                                                            }
                                                        >
                                                            <Printer className="h-4 w-4" />{" "}
                                                            Imprimir
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* COMPONENTE DE IMPRESSÃO (OVERLAY) */}
            {warrantyToPrint && (
                <CertificateOverlay
                    warranty={warrantyToPrint}
                    onClose={() => setWarrantyToPrint(null)}
                />
            )}
        </div>
    );
};

// --- DESIGN DO CERTIFICADO (A4) ---
const CertificateOverlay = ({
    warranty,
    onClose,
}: {
    warranty: Warranty;
    onClose: () => void;
}) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
            {/* Botões de Controle (Escondidos na impressão) */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
                <Button
                    onClick={handlePrint}
                    size="lg"
                    className="shadow-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Printer className="mr-2 h-5 w-5" /> Imprimir / Salvar PDF
                </Button>
                <Button
                    onClick={onClose}
                    variant="secondary"
                    size="lg"
                    className="shadow-xl bg-white text-black hover:bg-gray-100"
                >
                    Fechar
                </Button>
            </div>

            {/* O CERTIFICADO (Papel A4) */}
            <div className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-12 md:p-16 shadow-2xl print:shadow-none print:w-full print:h-full print:m-0 flex flex-col relative mx-auto my-8 print:my-0 rounded-sm">
                {/* Marca d'água ou Borda Decorativa (Opcional) */}
                <div className="absolute inset-0 border-[12px] border-double border-gray-200 pointer-events-none m-4"></div>

                {/* Cabeçalho */}
                <div className="text-center border-b-2 border-gray-800 pb-6 mb-8 relative z-10">
                    <div className="flex justify-center mb-4">
                        {/* LOGO DA LOJA (Placeholder: Smartphone Icon) */}
                        <div className="h-20 w-20 bg-black text-white rounded-full flex items-center justify-center">
                            <Smartphone className="h-10 w-10" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-serif font-bold tracking-[0.2em] uppercase text-gray-900">
                        Certificado de Garantia
                    </h1>
                    <p className="text-xl mt-2 font-light tracking-wide text-gray-600">
                        BV Celular
                    </p>
                </div>

                {/* Corpo do Documento */}
                <div className="flex-1 space-y-10 relative z-10 px-4">
                    {/* Seção 1: Dados Principais */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                                Cliente
                            </h3>
                            <p className="text-xl font-bold text-gray-900">
                                {warranty.Clients?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                {warranty.Clients?.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                                Data da Compra
                            </h3>
                            <p className="text-xl font-bold text-gray-900">
                                {format(
                                    new Date(warranty.purchase_date),
                                    "dd 'de' MMMM 'de' yyyy",
                                    { locale: ptBR }
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Seção 2: Produto (Destaque) */}
                    <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gray-200 px-4 py-1 rounded-bl-xl text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Dados do Aparelho
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                                    Modelo
                                </span>
                                <span className="text-2xl font-bold text-gray-900 block leading-tight">
                                    {warranty.product_model}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                                    Serial / IMEI
                                </span>
                                <span className="text-xl font-mono tracking-widest text-gray-800 block bg-white p-2 rounded border border-gray-200 text-center">
                                    {warranty.serial_number}
                                </span>
                            </div>
                        </div>
                        {warranty.invoice_number && (
                            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2 items-baseline">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">
                                    Nota Fiscal:
                                </span>
                                <span className="font-medium text-gray-700">
                                    {warranty.invoice_number}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Seção 3: Loja e Validade */}
                    <div className="grid grid-cols-2 gap-8 items-center">
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Loja Responsável
                            </h3>
                            <p className="font-bold text-lg text-gray-900">
                                {warranty.Stores?.name}
                            </p>
                            {warranty.Stores?.address ? (
                                <p className="text-sm text-gray-600 mt-1 max-w-[250px] leading-relaxed">
                                    {warranty.Stores.address}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic mt-1">
                                    Endereço não cadastrado
                                </p>
                            )}
                            <p className="text-sm text-gray-600">
                                {warranty.Stores?.city}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="inline-block bg-black text-white p-6 rounded-xl shadow-sm">
                                <h3 className="text-xs uppercase tracking-widest opacity-70 mb-1">
                                    Garantia Válida Até
                                </h3>
                                <p className="text-3xl font-bold tracking-tight">
                                    {format(
                                        new Date(warranty.warranty_end_date),
                                        "dd/MM/yyyy"
                                    )}
                                </p>
                                <div className="mt-2 text-xs font-medium px-2 py-1 bg-white/20 rounded inline-block">
                                    {warranty.warranty_months} Meses de
                                    Cobertura
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção 4: Termos */}
                    <div className="pt-4">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3" /> Termos e
                            Cobertura
                        </h3>
                        <ul className="text-[11px] leading-relaxed text-gray-500 list-disc pl-4 space-y-1 text-justify">
                            <li>
                                Esta garantia cobre exclusivamente{" "}
                                <strong>defeitos de fabricação</strong> e vícios
                                ocultos do aparelho pelo período estipulado
                                acima, contados a partir da data da compra.
                            </li>
                            <li>
                                A garantia <strong>NÃO COBRE</strong>: danos
                                físicos (telas quebradas, carcaças amassadas,
                                riscos), danos causados por líquidos (oxidação),
                                mau uso, instalação de softwares não oficiais,
                                ou reparos realizados por terceiros não
                                autorizados pela BV Celular.
                            </li>
                            <li>
                                A bateria é um componente consumível e, salvo
                                especificação contrária na nota fiscal, possui
                                garantia legal de 90 dias (3 meses).
                            </li>
                            <li>
                                Para acionamento da garantia, é indispensável a
                                apresentação deste certificado, juntamente com o
                                aparelho e acessórios originais.
                            </li>
                            <li>
                                O backup de dados é de inteira responsabilidade
                                do cliente antes do envio para assistência
                                técnica.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Rodapé do Certificado */}
                <div className="mt-auto pt-12 flex justify-between items-end relative z-10">
                    <div className="text-center">
                        <div className="w-64 border-b border-black mb-2"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Assinatura do Vendedor
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                            BV Celular
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            Emitido em{" "}
                            {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                            ID: {warranty.id.split("-")[0].toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminWarranties;
