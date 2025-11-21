/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Layers,
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
import { Label } from "recharts";

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

const variantSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    price: z.string().min(1, "Preço obrigatório"),
    quantity: z.string().min(1, "Estoque obrigatório"),
    original_price: z.string().optional(),
});

const commonSchema = z.object({
    name: z.string().min(3, "Nome muito curto."),
    description: z.string().optional().nullable(),
    brand: z.string().min(1, "Marca obrigatória."),
    subcategory: z.string().optional(),
    price: z.string().min(1, "Preço obrigatório"),
    originalPrice: z.string().optional().nullable(),
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
    quantity: z.string().optional().default("0"),
    wholesale_price: z.string().optional(),
    installment_price: z.string().optional(),
    max_installments: z.string().optional().default("12"),
    store_ids: z.array(z.string()).optional(),
    has_variations: z.boolean().default(false),
    variants: z.array(variantSchema).optional(),
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
            price: "",
            originalPrice: "",
            storage: "",
            ram: "",
            colors: "" as any,
            category: "aparelho",
            isPromotion: false,
            promotion_end_date: null,
            quantity: "0",
            wholesale_price: "",
            installment_price: "",
            max_installments: "12",
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
    } = useFieldArray({
        control: form.control,
        name: "variants" as any,
    });

    const selectedCategory = form.watch("category");
    const isPromotion = form.watch("isPromotion");
    const hasVariations = form.watch("has_variations");

    useEffect(() => {
        if (productToEdit) {
            const formValues: any = {
                ...productToEdit,
                price: productToEdit.price
                    ? formatCurrency(productToEdit.price)
                          .replace("R$", "")
                          .trim()
                    : "",
                originalPrice: productToEdit.originalPrice
                    ? formatCurrency(productToEdit.originalPrice)
                          .replace("R$", "")
                          .trim()
                    : "",
                quantity: String(productToEdit.quantity || 0),
                wholesale_price: productToEdit.wholesale_price
                    ? formatCurrency(productToEdit.wholesale_price)
                          .replace("R$", "")
                          .trim()
                    : "",
                installment_price: productToEdit.installment_price
                    ? formatCurrency(productToEdit.installment_price)
                          .replace("R$", "")
                          .trim()
                    : "",
                max_installments: String(productToEdit.max_installments || 12),
                colors: Array.isArray(productToEdit.colors)
                    ? productToEdit.colors.join(", ")
                    : productToEdit.colors,
                promotion_end_date: productToEdit.promotion_end_date
                    ? new Date(productToEdit.promotion_end_date)
                    : null,
                store_ids: productToEdit.stores.map((s) => s.id),
                image_files: [],
                has_variations: productToEdit.has_variations || false,
                variants:
                    productToEdit.variants?.map((v) => ({
                        name: v.name,
                        price: formatCurrency(v.price).replace("R$", "").trim(),
                        quantity: String(v.quantity),
                        original_price: v.original_price
                            ? formatCurrency(v.original_price)
                                  .replace("R$", "")
                                  .trim()
                            : "",
                    })) || [],
            };
            form.reset(formValues);
            setExistingImages(productToEdit.images || []);
            setImagesToDelete([]);
        }
    }, [productToEdit, form]);

    const createMutation = useMutation({
        mutationFn: (data: ProductInsertPayload) => createProduct(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Produto criado." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            // CORREÇÃO: Redireciona para a rota em português
            navigate("/admin/produtos");
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro ao criar",
                description: error.message,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: ProductUpdatePayload) => updateProduct(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Produto atualizado." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            // CORREÇÃO: Redireciona para a rota em português
            navigate("/admin/produtos");
        },
        onError: (error) =>
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: error.message,
            }),
    });

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

    const isLoading = createMutation.isPending || updateMutation.isPending;

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

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />
            <main className="container py-8">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader>
                        {/* CORREÇÃO: Link de voltar aponta para /admin/produtos */}
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2 w-fit justify-self-start p-0"
                        >
                            <Link to="/admin/produtos">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                            </Link>
                        </Button>
                        <CardTitle>
                            {isEditMode
                                ? "Editar Produto"
                                : "Adicionar Produto"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditMode && isLoadingProduct ? (
                            <Skeleton className="h-96 w-full" />
                        ) : (
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(
                                        onSubmit as any
                                    )}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo</FormLabel>
                                                    <Select
                                                        onValueChange={(
                                                            val
                                                        ) => {
                                                            field.onChange(val);
                                                            form.setValue(
                                                                "subcategory",
                                                                ""
                                                            );
                                                        }}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
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
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {SUBCATEGORIES[
                                                                selectedCategory as
                                                                    | "aparelho"
                                                                    | "acessorio"
                                                            ]?.map((sub) => (
                                                                <SelectItem
                                                                    key={
                                                                        sub.value
                                                                    }
                                                                    value={
                                                                        sub.value
                                                                    }
                                                                >
                                                                    {sub.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome</FormLabel>
                                                    <FormControl>
                                                        <Input
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
                                            name="brand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Marca</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: Apple"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Preço Varejo (R$)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            onBlur={(e) =>
                                                                handlePriceBlur(
                                                                    e,
                                                                    "price"
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
                                            name="originalPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Preço Original
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            onBlur={(e) =>
                                                                handlePriceBlur(
                                                                    e,
                                                                    "originalPrice"
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
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Estoque Total
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            disabled={
                                                                hasVariations
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {hasVariations
                                                            ? "Calculado pelas variações"
                                                            : "Estoque único"}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="has_variations"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base font-bold flex items-center gap-2">
                                                            <Layers className="h-4 w-4" />{" "}
                                                            Tem variações?
                                                        </FormLabel>
                                                    </div>
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
                                                </FormItem>
                                            )}
                                        />
                                        {hasVariations && (
                                            <div className="space-y-4 animate-in fade-in">
                                                {variantFields.map(
                                                    (field, index) => (
                                                        <div
                                                            key={field.id}
                                                            className="grid grid-cols-12 gap-2 items-end border p-2 rounded bg-background"
                                                        >
                                                            <div className="col-span-5">
                                                                <Label className="text-xs">
                                                                    Nome
                                                                </Label>
                                                                <Input
                                                                    {...form.register(
                                                                        `variants.${index}.name`
                                                                    )}
                                                                    placeholder="Variação"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <Label className="text-xs">
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
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Label className="text-xs">
                                                                    Qtd
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    {...form.register(
                                                                        `variants.${index}.quantity`
                                                                    )}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="w-full"
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
                                                            price: "",
                                                            quantity: "",
                                                            original_price: "",
                                                        })
                                                    }
                                                    className="w-full"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />{" "}
                                                    Adicionar Variação
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-4 mt-4 bg-muted/10 p-4 rounded-md">
                                        <div className="col-span-full font-semibold text-sm text-muted-foreground">
                                            OPÇÕES AVANÇADAS
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="wholesale_price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Preço Atacado (PJ)
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
                                                        Base Parcelamento
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
                                                        />
                                                    </FormControl>
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
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        className="h-24"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name="image_files"
                                        render={({
                                            field: { onChange },
                                            fieldState: { error },
                                        }) => (
                                            <FormItem>
                                                <FormLabel>Imagens</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            onChange([
                                                                ...newFiles,
                                                                ...Array.from(
                                                                    e.target
                                                                        .files ||
                                                                        []
                                                                ),
                                                            ])
                                                        }
                                                    />
                                                </FormControl>
                                                <div className="mt-4 grid grid-cols-4 gap-4">
                                                    {existingImages.map(
                                                        (url) => (
                                                            <div
                                                                key={url}
                                                                className="relative aspect-square"
                                                            >
                                                                <img
                                                                    src={url}
                                                                    className="object-cover w-full h-full rounded border"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-6 w-6"
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
                                                                className="relative aspect-square"
                                                            >
                                                                <img
                                                                    src={p.url}
                                                                    className="object-cover w-full h-full rounded border opacity-80"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-6 w-6"
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
                                    <FormField
                                        control={form.control}
                                        name="store_ids"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Lojas</FormLabel>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {stores?.map((store) => (
                                                        <FormField
                                                            key={store.id}
                                                            control={
                                                                form.control
                                                            }
                                                            name="store_ids"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex flex-row items-center space-x-2">
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
                                                                    <FormLabel className="font-normal">
                                                                        {
                                                                            store.name
                                                                        }
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <FormField
                                            control={form.control}
                                            name="isPromotion"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-[84px]">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">
                                                            Em Promoção?
                                                        </FormLabel>
                                                    </div>
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
                                                </FormItem>
                                            )}
                                        />
                                        {isPromotion && (
                                            <FormField
                                                control={form.control}
                                                name="promotion_end_date"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col pt-2">
                                                        <FormLabel>
                                                            Válida até
                                                        </FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <FormControl>
                                                                    <Button
                                                                        variant={
                                                                            "outline"
                                                                        }
                                                                        className={cn(
                                                                            "pl-3 text-left font-normal h-12",
                                                                            !field.value &&
                                                                                "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(
                                                                                field.value,
                                                                                "PPP",
                                                                                {
                                                                                    locale: ptBR,
                                                                                }
                                                                            )
                                                                        ) : (
                                                                            <span>
                                                                                Selecione
                                                                                a
                                                                                data
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
                                                                        field.value ||
                                                                        undefined
                                                                    }
                                                                    onSelect={
                                                                        field.onChange
                                                                    }
                                                                    disabled={(
                                                                        date
                                                                    ) =>
                                                                        date <
                                                                        new Date()
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 text-lg"
                                    >
                                        {isLoading ? "Salvando..." : "Salvar"}
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminProductForm;
