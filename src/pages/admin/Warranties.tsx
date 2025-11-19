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

// Schema do formulário
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [calculatedEndDate, setCalculatedEndDate] = useState<Date | null>(
        null
    );
    const [searchTerm, setSearchTerm] = useState("");

    // Estado para controlar qual garantia está sendo visualizada para impressão
    const [warrantyToPrint, setWarrantyToPrint] = useState<Warranty | null>(
        null
    );

    // Buscas de dados
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
            warranty_months: "3", // Padrão 3 meses
        },
    });

    // Cálculo automático da data final
    const purchaseDate = form.watch("purchase_date");
    const months = form.watch("warranty_months");

    useEffect(() => {
        if (purchaseDate && months && !isNaN(Number(months))) {
            const endDate = addMonths(purchaseDate, Number(months));
            setCalculatedEndDate(endDate);
        }
    }, [purchaseDate, months]);

    const createMutation = useMutation({
        mutationFn: (data: WarrantyInsertPayload) => createWarranty(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Garantia gerada." });
            queryClient.invalidateQueries({ queryKey: ["adminWarranties"] });
            setIsDialogOpen(false);
            form.reset();
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

    // Filtragem de garantias na tabela
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Gestão de Garantias
                        </h1>
                        <p className="text-muted-foreground">
                            Emita e imprima certificados de garantia.
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Nova Garantia
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Gerar Nova Garantia</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados para gerar o certificado.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-6 mt-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                                <SelectValue placeholder="Selecione o cliente" />
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
                                                                <SelectValue placeholder="Selecione a loja" />
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
                                                                        -{" "}
                                                                        {
                                                                            store.city
                                                                        }
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                            placeholder="Digite o serial"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <div className="flex flex-col justify-end pb-2">
                                            <span className="text-sm font-medium mb-2">
                                                Válido até:
                                            </span>
                                            <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm font-bold text-primary flex items-center">
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
                                        className="w-full"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending
                                            ? "Gerando..."
                                            : "Emitir Certificado"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <CardTitle>Histórico de Garantias</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cliente, modelo ou serial..."
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
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data Emissão</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Produto</TableHead>
                                        <TableHead>Validade</TableHead>
                                        <TableHead className="text-right">
                                            Ações
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center py-8"
                                            >
                                                <Loader2 className="animate-spin mx-auto h-8 w-8" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !filteredWarranties ||
                                      filteredWarranties.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                Nenhuma garantia encontrada.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredWarranties.map((warranty) => (
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
                                                        {warranty.Clients?.name}
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
                                                        {warranty.product_model}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        S/N:{" "}
                                                        {warranty.serial_number}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-primary">
                                                        {format(
                                                            new Date(
                                                                warranty.warranty_end_date
                                                            ),
                                                            "dd/MM/yyyy"
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {
                                                            warranty.warranty_months
                                                        }{" "}
                                                        meses
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setWarrantyToPrint(
                                                                warranty
                                                            )
                                                        }
                                                    >
                                                        <Printer className="h-4 w-4 mr-2" />{" "}
                                                        Imprimir
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* MODAL DE IMPRESSÃO (Overlay) */}
            {warrantyToPrint && (
                <CertificateOverlay
                    warranty={warrantyToPrint}
                    onClose={() => setWarrantyToPrint(null)}
                />
            )}
        </div>
    );
};

// --- COMPONENTE DO CERTIFICADO PARA IMPRESSÃO ---
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
            {/* Botões de Controle (Somem na impressão) */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden">
                <Button onClick={handlePrint} size="lg" className="shadow-xl">
                    <Printer className="mr-2 h-5 w-5" /> Imprimir
                </Button>
                <Button
                    onClick={onClose}
                    variant="secondary"
                    size="lg"
                    className="shadow-xl"
                >
                    Fechar
                </Button>
            </div>

            {/* O CERTIFICADO (Papel A4) */}
            <div className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-12 md:p-16 shadow-2xl print:shadow-none print:w-full print:h-full print:m-0 flex flex-col relative">
                {/* Cabeçalho */}
                <div className="text-center border-b-2 border-gray-800 pb-8 mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-24 w-24 bg-black text-white rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-12 w-12" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-serif font-bold tracking-widest uppercase">
                        Certificado de Garantia
                    </h1>
                    <p className="text-xl mt-2 font-light">BV Celular</p>
                </div>

                {/* Detalhes */}
                <div className="flex-1 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">
                                Cliente
                            </h3>
                            <p className="text-lg font-bold">
                                {warranty.Clients?.name}
                            </p>
                            <p className="text-gray-600">
                                {warranty.Clients?.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">
                                Data da Compra
                            </h3>
                            <p className="text-lg font-bold">
                                {format(
                                    new Date(warranty.purchase_date),
                                    "dd 'de' MMMM 'de' yyyy",
                                    { locale: ptBR }
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">
                            Dados do Aparelho
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs text-gray-400">
                                    Modelo
                                </span>
                                <span className="text-xl font-bold">
                                    {warranty.product_model}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400">
                                    Serial / IMEI
                                </span>
                                <span className="text-xl font-mono tracking-wide">
                                    {warranty.serial_number}
                                </span>
                            </div>
                            {warranty.invoice_number && (
                                <div className="col-span-2 pt-2 border-t border-gray-200">
                                    <span className="block text-xs text-gray-400">
                                        Nota Fiscal
                                    </span>
                                    <span>{warranty.invoice_number}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 items-center">
                        <div>
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-1">
                                Loja Responsável
                            </h3>
                            <p className="font-bold text-lg">
                                {warranty.Stores?.name}
                            </p>
                            <p className="text-gray-600">
                                {warranty.Stores?.city}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {warranty.Stores?.address}
                            </p>
                        </div>
                        <div className="text-right bg-black text-white p-6 rounded-xl">
                            <h3 className="text-sm uppercase tracking-wider opacity-80 mb-1">
                                Garantia Válida Até
                            </h3>
                            <p className="text-3xl font-bold">
                                {format(
                                    new Date(warranty.warranty_end_date),
                                    "dd/MM/yyyy"
                                )}
                            </p>
                            <p className="text-sm opacity-80 mt-1">
                                Prazo de {warranty.warranty_months} meses
                            </p>
                        </div>
                    </div>

                    <div className="pt-8">
                        <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                            Termos e Cobertura
                        </h3>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2 text-justify">
                            <li>
                                A garantia cobre defeitos de fabricação e vícios
                                ocultos do aparelho pelo período estipulado
                                acima.
                            </li>
                            <li>
                                A garantia <strong>NÃO</strong> cobre: danos
                                físicos (telas quebradas, amassados), danos por
                                líquidos (oxidação), mau uso, alterações de
                                software não oficiais ou reparos feitos por
                                terceiros não autorizados.
                            </li>
                            <li>
                                A bateria é considerada um item consumível e
                                possui garantia de 3 meses, salvo especificação
                                contrária.
                            </li>
                            <li>
                                É obrigatória a apresentação deste certificado
                                e/ou nota fiscal para solicitação de reparo.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Rodapé do Certificado */}
                <div className="mt-12 pt-8 border-t-2 border-gray-800 flex justify-between items-end">
                    <div className="text-center">
                        <div className="w-64 border-b border-black mb-2"></div>
                        <p className="text-sm font-bold uppercase">
                            Assinatura do Vendedor
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">BV Celular</p>
                        <p className="text-xs text-gray-400">
                            Certificado emitido em{" "}
                            {format(new Date(), "dd/MM/yyyy HH:mm")}
                        </p>
                        <p className="text-xs text-gray-400">
                            ID: {warranty.id.split("-")[0].toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminWarranties;
