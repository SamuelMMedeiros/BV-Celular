/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    X,
    Plus,
    Trash2,
    Layers,
    Wand2,
    Calculator,
    List,
    Box,
    Package,
    Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    createProduct,
    fetchStores,
    fetchProductById,
    updateProduct,
} from "@/lib/api";
import {
    ProductInsertPayload,
    ProductUpdatePayload,
    Store,
    Product,
} from "@/types";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@radix-ui/react-label";

// --- CONSTANTES ---
const SUBCATEGORIES = {
    aparelho: [
        { value: "smartphone", label: "Smartphone" },
        { value: "tablet", label: "Tablet" },
        { value: "smartwatch", label: "Smartwatch" },
    ],
    acessorio: [
        { value: "case", label: "Capa / Case" },
        { value: "film", label: "Película" },
        { value: "charger", label: "Carregador / Cabo" },
        { value: "audio", label: "Fone / Áudio" },
        { value: "smartwatch_band", label: "Pulseira de Watch" },
        { value: "peripheral", label: "Periférico" },
        { value: "other", label: "Outros" },
    ],
};

// --- SCHEMAS ---
const variantSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    price: z.string().min(1, "Preço obrigatório"),
    quantity: z.string().min(1, "Estoque obrigatório"),
    original_price: z.string().optional(),
    sku: z.string().optional(),
});

const commonSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().optional().nullable(),
    brand: z.string().min(1, "A marca é obrigatória."),
    subcategory: z.string().optional(),

    price: z.string().min(1, "Preço obrigatório"),
    originalPrice: z.string().optional().nullable(),
    cost_price: z.string().optional().nullable(),

    wholesale_price: z.string().optional(),
    installment_price: z.string().optional(),
    max_installments: z.string().optional().default("12"),

    quantity: z.string().optional().default("0"),
    sku: z.string().optional(),
    store_ids: z.array(z.string()).optional(),

    storage: z.string().optional().nullable(),
    ram: z.string().optional().nullable(),
    colors: z
        .string()
        .optional()
        .nullable()
        .transform((val) =>
            val
                ? val
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                : []
        ),

    category: z.enum(["aparelho", "acessorio"]),
    isPromotion: z.boolean().default(false),
    promotion_end_date: z.date().optional().nullable(),

    has_variations: z.boolean().default(false),
    variants: z.array(variantSchema).optional(),

    image_files: z.array(z.instanceof(File)).optional(),
});

const imageFileSchema = z.array(z.instanceof(File)).optional();
const createSchema = commonSchema.extend({ image_files: imageFileSchema });
const editSchema = commonSchema.extend({ image_files: imageFileSchema });
type FormValues = z.infer<typeof createSchema>;

const AdminProductForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { productId } = useParams<{ productId: string }>();
    const isEditMode = !!productId;

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [isSimpleVariantMode, setIsSimpleVariantMode] = useState(false);
    const [simpleVariantText, setSimpleVariantText] = useState("");

    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    const { data: productToEdit, isLoading: isLoadingProduct } =
        useQuery<Product>({
            queryKey: ["adminProduct", productId],
            queryFn: () => fetchProductById(productId!),
            enabled: isEditMode,
        });

    const form = useForm<FormValues>({
        resolver: zodResolver(isEditMode ? editSchema : createSchema),
        defaultValues: {
            name: "",
            description: "",
            brand: "",
            subcategory: "",
            category: "aparelho",
            price: "",
            originalPrice: "",
            cost_price: "",
            wholesale_price: "",
            installment_price: "",
            max_installments: "12",
            quantity: "0",
            sku: "",
            storage: "",
            ram: "",
            colors: "" as any,
            isPromotion: false,
            promotion_end_date: null,
            store_ids: [],
            image_files: [],
            has_variations: false,
            variants: [],
        },
    });

    const {
        fields: variantFields,
        append: appendVariant,
        remove: removeVariant,
        replace: replaceVariants,
    } = useFieldArray({
        control: form.control,
        name: "variants",
    });

    const selectedCategory = form.watch("category");
    const hasVariations = form.watch("has_variations");
    const currentPrice = form.watch("price");
    const isPromotion = form.watch("isPromotion");

    useEffect(() => {
        if (productToEdit) {
            const toMoney = (val: number | null | undefined) =>
                val ? formatCurrency(val).replace("R$", "").trim() : "";

            form.reset({
                ...productToEdit,
                price: toMoney(productToEdit.price),
                originalPrice: toMoney(productToEdit.originalPrice),
                cost_price: toMoney(productToEdit.cost_price),
                wholesale_price: toMoney(productToEdit.wholesale_price),
                installment_price: toMoney(productToEdit.installment_price),
                quantity: String(productToEdit.quantity || 0),
                max_installments: String(productToEdit.max_installments || 12),
                // CORREÇÃO DE TIPO: colors as any para evitar erro de string vs string[]
                colors: (Array.isArray(productToEdit.colors)
                    ? productToEdit.colors.join(", ")
                    : productToEdit.colors) as any,
                promotion_end_date: productToEdit.promotion_end_date
                    ? new Date(productToEdit.promotion_end_date)
                    : null,
                store_ids: productToEdit.stores.map((s) => s.id),
                image_files: [],
                has_variations: productToEdit.has_variations || false,
                sku: productToEdit.sku || "",
                variants:
                    productToEdit.variants?.map((v) => ({
                        name: v.name,
                        price: toMoney(v.price),
                        quantity: String(v.quantity),
                        original_price: toMoney(v.original_price),
                        sku: v.sku || "",
                    })) || [],
            });

            setExistingImages(productToEdit.images || []);
            setImagesToDelete([]);
        }
    }, [productToEdit, form]);

    const createMutation = useMutation({
        mutationFn: (data: ProductInsertPayload) => createProduct(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Produto criado." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            navigate("/admin/produtos");
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: ProductUpdatePayload) => updateProduct(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Produto atualizado." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            navigate("/admin/produtos");
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message,
            }),
    });

    const generateSKU = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newSku = `PRD-${random}`;
        form.setValue("sku", newSku);
        toast({ description: `SKU gerado: ${newSku}` });
    };

    const handleGenerateVariantsFromList = () => {
        if (!simpleVariantText.trim()) return;
        const items = simpleVariantText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        const newVariants = items.map((item) => ({
            name: item,
            price: currentPrice || "0,00",
            quantity: "10",
            original_price: "",
            sku: `SKU-${Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase()}`,
        }));
        const currentVariants = form.getValues("variants") || [];
        replaceVariants([...currentVariants, ...newVariants]);
        setIsSimpleVariantMode(false);
        setSimpleVariantText("");
        toast({
            title: "Variações geradas!",
            description: `${items.length} itens adicionados.`,
        });
    };

    const onSubmit = (data: any) => {
        const newFiles = data.image_files || [];
        if (existingImages.length + newFiles.length === 0 && !isEditMode) {
            form.setError("image_files", {
                type: "manual",
                message: "Imagem obrigatória.",
            });
            return;
        }

        const parseMoney = (val: string) => {
            const cents = parseCurrency(val);
            return cents !== undefined ? cents / 100 : 0;
        };

        const payloadBase = {
            store_ids: data.store_ids,
            promotion_end_date: data.promotion_end_date
                ? data.promotion_end_date.toISOString()
                : null,
            quantity: parseInt(data.quantity || "0"),
            price: parseMoney(data.price),
            originalPrice: parseMoney(data.originalPrice),
            cost_price: parseMoney(data.cost_price),
            sku: data.sku,
            wholesale_price: parseMoney(data.wholesale_price),
            installment_price: parseMoney(data.installment_price),
            max_installments: parseInt(data.max_installments || "12"),
            brand: data.brand,
            subcategory: data.subcategory || null,
            has_variations: data.has_variations,
            variants: data.has_variations
                ? data.variants.map((v: any) => ({
                      name: v.name,
                      attributes: { name: v.name },
                      price: parseMoney(v.price),
                      original_price: v.original_price
                          ? parseMoney(v.original_price)
                          : null,
                      quantity: parseInt(v.quantity || "0"),
                      sku: v.sku,
                  }))
                : [],
        };

        if (isEditMode) {
            updateMutation.mutate({
                ...data,
                id: productId,
                images_to_delete: imagesToDelete,
                ...payloadBase,
            });
        } else {
            createMutation.mutate({
                ...data,
                image_files: data.image_files,
                ...payloadBase,
            });
        }
    };

    const handlePriceBlur = (e: any, fieldName: any) => {
        const value = e.target.value;
        const cents = parseCurrency(value);
        if (cents !== undefined) {
            const formatted = (cents / 100)
                .toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                .replace(/\s/g, "");
            form.setValue(fieldName, formatted);
        } else {
            form.setValue(fieldName, "");
        }
    };

    const removeNewFile = (index: number) => {
        const newFiles = form.getValues("image_files") || [];
        const updatedFiles = newFiles.filter((_, i) => i !== index);
        form.setValue("image_files", updatedFiles, { shouldValidate: true });
    };
    const removeExistingImage = (imageUrl: string) => {
        setExistingImages(existingImages.filter((img) => img !== imageUrl));
        setImagesToDelete((prev) => [...prev, imageUrl]);
    };

    const newFiles = form.watch("image_files") || [];
    const newFilePreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
    }));
    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <Navbar />
            <main className="container py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="rounded-full"
                        >
                            <Link to="/admin/produtos">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEditMode ? "Editar Produto" : "Novo Produto"}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => form.reset()}
                            disabled={isLoading}
                        >
                            Limpar
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            {isLoading ? "Salvando..." : "Salvar Produto"}
                        </Button>
                    </div>
                </div>

                {isEditMode && isLoadingProduct ? (
                    <Skeleton className="h-96 w-full" />
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* COLUNA ESQUERDA */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Detalhes Básicos
                                            </CardTitle>
                                            <CardDescription>
                                                Informações principais.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Nome do Produto *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Ex: iPhone 15"
                                                                {...field}
                                                                value={
                                                                    field.value ||
                                                                    ""
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
                                                    name="brand"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Marca
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Ex: Apple"
                                                                    {...field}
                                                                    value={
                                                                        field.value ||
                                                                        ""
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="category"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Categoria
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={(
                                                                    val
                                                                ) => {
                                                                    field.onChange(
                                                                        val
                                                                    );
                                                                    form.setValue(
                                                                        "subcategory",
                                                                        ""
                                                                    );
                                                                }}
                                                                value={
                                                                    field.value
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="aparelho">
                                                                        Aparelho
                                                                    </SelectItem>
                                                                    <SelectItem value="acessorio">
                                                                        Acessório
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="subcategory"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Subcategoria
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {SUBCATEGORIES[
                                                                    selectedCategory as
                                                                        | "aparelho"
                                                                        | "acessorio"
                                                                ]?.map(
                                                                    (sub) => (
                                                                        <SelectItem
                                                                            key={
                                                                                sub.value
                                                                            }
                                                                            value={
                                                                                sub.value
                                                                            }
                                                                        >
                                                                            {
                                                                                sub.label
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

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Descrição
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Detalhes..."
                                                                {...field}
                                                                className="h-32 resize-none"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <CardTitle>Variações</CardTitle>
                                                <CardDescription>
                                                    Cores, tamanhos ou modelos.
                                                </CardDescription>
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="has_variations"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2">
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
                                                        <FormLabel className="pb-2">
                                                            Ativar
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardHeader>

                                        {hasVariations && (
                                            <CardContent className="space-y-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-sm text-muted-foreground">
                                                        Modo:
                                                    </span>
                                                    <div className="flex items-center bg-muted rounded-lg p-1">
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                isSimpleVariantMode
                                                                    ? "ghost"
                                                                    : "secondary"
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                setIsSimpleVariantMode(
                                                                    false
                                                                )
                                                            }
                                                            className="h-7 text-xs"
                                                        >
                                                            <List className="mr-1 h-3 w-3" />{" "}
                                                            Detalhado
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                isSimpleVariantMode
                                                                    ? "secondary"
                                                                    : "ghost"
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                setIsSimpleVariantMode(
                                                                    true
                                                                )
                                                            }
                                                            className="h-7 text-xs"
                                                        >
                                                            <Wand2 className="mr-1 h-3 w-3" />{" "}
                                                            Rápido
                                                        </Button>
                                                    </div>
                                                </div>

                                                {isSimpleVariantMode ? (
                                                    <div className="bg-slate-50 border border-dashed border-primary/50 p-4 rounded-lg space-y-3">
                                                        <div className="space-y-1">
                                                            <FormLabel>
                                                                Lista Rápida
                                                                (Separada por
                                                                vírgulas)
                                                            </FormLabel>
                                                            <Textarea
                                                                value={
                                                                    simpleVariantText
                                                                }
                                                                onChange={(e) =>
                                                                    setSimpleVariantText(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                placeholder="Ex: Azul 64GB, Azul 128GB..."
                                                                className="h-24"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={
                                                                handleGenerateVariantsFromList
                                                            }
                                                            className="w-full"
                                                            size="sm"
                                                        >
                                                            <Wand2 className="mr-2 h-4 w-4" />{" "}
                                                            Gerar Variações
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {variantFields.map(
                                                            (field, index) => (
                                                                <div
                                                                    key={
                                                                        field.id
                                                                    }
                                                                    className="grid grid-cols-12 gap-3 items-end p-3 border rounded-md bg-card"
                                                                >
                                                                    <div className="col-span-12 md:col-span-4">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs font-semibold">
                                                                                Nome
                                                                            </Label>
                                                                            <Input
                                                                                {...form.register(
                                                                                    `variants.${index}.name`
                                                                                )}
                                                                                placeholder="Variação"
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-4 md:col-span-3">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs font-semibold">
                                                                                Preço
                                                                            </Label>
                                                                            <Input
                                                                                {...form.register(
                                                                                    `variants.${index}.price`
                                                                                )}
                                                                                onBlur={(
                                                                                    e
                                                                                ) =>
                                                                                    handlePriceBlur(
                                                                                        e,
                                                                                        `variants.${index}.price`
                                                                                    )
                                                                                }
                                                                                placeholder="0,00"
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-4 md:col-span-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs font-semibold">
                                                                                Qtd
                                                                            </Label>
                                                                            <Input
                                                                                type="number"
                                                                                {...form.register(
                                                                                    `variants.${index}.quantity`
                                                                                )}
                                                                                placeholder="0"
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-4 md:col-span-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs font-semibold text-muted-foreground">
                                                                                SKU
                                                                            </Label>
                                                                            <Input
                                                                                {...form.register(
                                                                                    `variants.${index}.sku`
                                                                                )}
                                                                                placeholder="SKU"
                                                                                className="h-9 text-xs"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-12 md:col-span-1 flex justify-end">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-destructive h-9 w-9"
                                                                            onClick={() =>
                                                                                removeVariant(
                                                                                    index
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                appendVariant({
                                                                    name: "",
                                                                    price:
                                                                        currentPrice ||
                                                                        "0,00",
                                                                    quantity:
                                                                        "0",
                                                                    original_price:
                                                                        "",
                                                                    sku: "",
                                                                })
                                                            }
                                                            className="w-full border-dashed"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />{" "}
                                                            Adicionar Linha
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        )}
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">
                                                Condições Comerciais
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="wholesale_price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Preço Atacado
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                onBlur={(e) =>
                                                                    handlePriceBlur(
                                                                        e,
                                                                        "wholesale_price"
                                                                    )
                                                                }
                                                                placeholder="0,00"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="installment_price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Base Parcelado
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                onBlur={(e) =>
                                                                    handlePriceBlur(
                                                                        e,
                                                                        "installment_price"
                                                                    )
                                                                }
                                                                placeholder="0,00"
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-[10px]">
                                                            Se maior que à vista
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="max_installments"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Máx. Parcelas
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* COLUNA DIREITA */}
                                <div className="space-y-6">
                                    <Card className="border-blue-100 dark:border-blue-900 shadow-sm">
                                        <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 pb-3">
                                            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                                <Calculator className="h-5 w-5" />{" "}
                                                Precificação
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            <FormField
                                                control={form.control}
                                                name="price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">
                                                            Preço Venda *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-muted-foreground">
                                                                    R$
                                                                </span>
                                                                <Input
                                                                    className="pl-9 font-bold text-lg"
                                                                    {...field}
                                                                    onBlur={(
                                                                        e
                                                                    ) =>
                                                                        handlePriceBlur(
                                                                            e,
                                                                            "price"
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name="originalPrice"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">
                                                                De (Original)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    className="h-9"
                                                                    {...field}
                                                                    onBlur={(
                                                                        e
                                                                    ) =>
                                                                        handlePriceBlur(
                                                                            e,
                                                                            "originalPrice"
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="cost_price"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-muted-foreground">
                                                                Custo
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    className="h-9 bg-muted/50"
                                                                    {...field}
                                                                    onBlur={(
                                                                        e
                                                                    ) =>
                                                                        handlePriceBlur(
                                                                            e,
                                                                            "cost_price"
                                                                        )
                                                                    }
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Box className="h-4 w-4" />{" "}
                                                Estoque
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="sku"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            SKU
                                                        </FormLabel>
                                                        <div className="flex gap-2">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="PRD-000"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={
                                                                    generateSKU
                                                                }
                                                                title="Gerar SKU"
                                                            >
                                                                <Wand2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="quantity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Quantidade Total
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                disabled={
                                                                    hasVariations
                                                                }
                                                                className={
                                                                    hasVariations
                                                                        ? "opacity-50"
                                                                        : ""
                                                                }
                                                            />
                                                        </FormControl>
                                                        {hasVariations && (
                                                            <FormDescription className="text-xs">
                                                                Gerenciado pelas
                                                                variações.
                                                            </FormDescription>
                                                        )}
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Package className="h-4 w-4" />{" "}
                                                Mídia
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Controller
                                                control={form.control}
                                                name="image_files"
                                                render={({
                                                    field: { onChange },
                                                    fieldState: { error },
                                                }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Galeria
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="file"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={(e) =>
                                                                    onChange([
                                                                        ...newFiles,
                                                                        ...Array.from(
                                                                            e
                                                                                .target
                                                                                .files ||
                                                                                []
                                                                        ),
                                                                    ])
                                                                }
                                                            />
                                                        </FormControl>
                                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                                            {existingImages.map(
                                                                (url) => (
                                                                    <div
                                                                        key={
                                                                            url
                                                                        }
                                                                        className="relative aspect-square group"
                                                                    >
                                                                        <img
                                                                            src={
                                                                                url
                                                                            }
                                                                            className="object-cover w-full h-full rounded border"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() =>
                                                                                removeExistingImage(
                                                                                    url
                                                                                )
                                                                            }
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            )}
                                                            {newFilePreviews.map(
                                                                (p, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="relative aspect-square group"
                                                                    >
                                                                        <img
                                                                            src={
                                                                                p.url
                                                                            }
                                                                            className="object-cover w-full h-full rounded border ring-2 ring-primary/20"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() =>
                                                                                removeNewFile(
                                                                                    i
                                                                                )
                                                                            }
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                        {error && (
                                                            <FormMessage>
                                                                {error.message}
                                                            </FormMessage>
                                                        )}
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">
                                                Disponibilidade
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <FormField
                                                control={form.control}
                                                name="store_ids"
                                                render={() => (
                                                    <div className="space-y-2">
                                                        {stores?.map(
                                                            (store) => (
                                                                <FormField
                                                                    key={
                                                                        store.id
                                                                    }
                                                                    control={
                                                                        form.control
                                                                    }
                                                                    name="store_ids"
                                                                    render={({
                                                                        field,
                                                                    }) => (
                                                                        <FormItem
                                                                            key={
                                                                                store.id
                                                                            }
                                                                            className="flex flex-row items-center space-x-2 border p-2 rounded hover:bg-muted/50"
                                                                        >
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(
                                                                                        store.id
                                                                                    )}
                                                                                    onCheckedChange={(
                                                                                        checked
                                                                                    ) =>
                                                                                        checked
                                                                                            ? field.onChange(
                                                                                                  [
                                                                                                      ...(field.value ||
                                                                                                          []),
                                                                                                      store.id,
                                                                                                  ]
                                                                                              )
                                                                                            : field.onChange(
                                                                                                  field.value?.filter(
                                                                                                      (
                                                                                                          v: string
                                                                                                      ) =>
                                                                                                          v !==
                                                                                                          store.id
                                                                                                  )
                                                                                              )
                                                                                    }
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal text-sm cursor-pointer flex-1">
                                                                                {
                                                                                    store.name
                                                                                }
                                                                            </FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 text-lg"
                            >
                                {isLoading ? "Salvando..." : "Salvar Produto"}
                            </Button>
                        </form>
                    </Form>
                )}
            </main>
        </div>
    );
};

export default AdminProductForm;
