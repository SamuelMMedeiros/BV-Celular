/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO CORRIGIDO PARA: src/pages/admin/ProductForm.tsx ===
//
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
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
import { ArrowLeft, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    createProduct,
    fetchStores,
    fetchProductById,
    updateProduct,
    ProductInsertPayload,
    ProductUpdatePayload,
} from "@/lib/api";
import { Store, Product } from "@/types";

// --- Helpers de Formatação (Formato Moeda) ---
const formatPriceForDisplay = (
    value: string | number | undefined | null
): string => {
    if (value === null || value === undefined) return "";
    let numberValue: number;
    if (typeof value === "number") {
        numberValue = value;
    } else {
        const cleanedValue = String(value).replace(/[^\d,.]/g, "");
        numberValue = parseFloat(
            cleanedValue.replace(/\./g, "").replace(",", ".")
        );
    }

    if (isNaN(numberValue)) return "";
    return numberValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const parsePriceForDatabase = (
    value: string | undefined
): number | undefined => {
    if (!value) return undefined;
    const numberValue = parseFloat(value.replace(/\./g, "").replace(",", "."));
    if (isNaN(numberValue)) return undefined;
    return Math.round(numberValue * 100);
};
// --- Fim dos Helpers ---

// --- Schemas de Validação (Zod) ---
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

// Schema base para campos comuns
const commonSchema = z.object({
    name: z
        .string()
        .min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    description: z.string().optional().nullable(),

    price: z
        .string()
        .min(1, { message: "Preço é obrigatório." })
        .transform((val) => parsePriceForDatabase(val) as number),

    originalPrice: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? parsePriceForDatabase(val) : undefined)),

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

    category: z.enum(["aparelho", "acessorio"], {
        required_error: "Categoria é obrigatória.",
    }),
    isPromotion: z.boolean().default(false),
    store_ids: z.array(z.string()).optional(), // CORREÇÃO: Mantido opcional
});

// Schema para o campo de imagens
const imageFileSchema = z
    .array(z.instanceof(File))
    .optional()
    .refine((files) => !files || files.length <= 3, "Máximo de 3 imagens.")
    .refine(
        (files) => !files || files.every((file) => file.size <= MAX_FILE_SIZE),
        `Tamanho máximo de ${MAX_FILE_SIZE_MB}MB por imagem.`
    )
    .refine(
        (files) =>
            !files ||
            files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
        "Apenas .jpg, .jpeg, .png e .webp."
    );

//
// CORREÇÃO (Erros 1 e 2): Combinando os schemas da forma correta (usando .extend)
//
const createSchema = commonSchema.extend({
    image_files: imageFileSchema.refine(
        (files) => files && files.length > 0,
        "Pelo menos uma imagem é obrigatória."
    ),
});

const editSchema = commonSchema.extend({
    image_files: imageFileSchema,
});
// --- Fim dos Schemas ---

// Tipo do formulário (antes da transformação do Zod)
// (Este é o tipo que o 'useForm' usa)
type FormValues = Omit<
    z.input<typeof createSchema>,
    "price" | "originalPrice" | "colors"
> & {
    price: string;
    originalPrice?: string | null;
    colors?: string | null;
};

// Helper: Converte dados do Produto (da API) para o formato do formulário
const productToForm = (product: Product): FormValues => ({
    name: product.name,
    description: product.description ?? "",
    price: formatPriceForDisplay(product.price / 100),
    originalPrice: product.originalPrice
        ? formatPriceForDisplay(product.originalPrice / 100)
        : "",
    storage: product.storage ?? "",
    ram: product.ram ?? "",
    colors:
        (Array.isArray(product.colors)
            ? product.colors.join(", ")
            : product.colors) || "",
    category: product.category as "aparelho" | "acessorio",
    isPromotion: product.isPromotion || false,
    store_ids: product.stores.map((store) => store.id),
    image_files: [],
});

// Helper: Skeleton do formulário
const FormSkeleton = () => (
    <div className="space-y-8">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-1/2" />
        <Skeleton className="h-10 w-full" />
    </div>
);

// Tipo do formulário (após transformação do Zod)
// (Este é o tipo que o 'onSubmit' recebe)
type FormSchemaOutput =
    | z.infer<typeof createSchema>
    | z.infer<typeof editSchema>;

const AdminProductForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { productId } = useParams<{ productId: string }>();
    const isEditMode = !!productId;

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    const formSchema = isEditMode ? editSchema : createSchema;

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
        // Usa o tipo de INPUT
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            price: "",
            originalPrice: "",
            storage: "",
            ram: "",
            colors: "",
            category: "aparelho",
            isPromotion: false,
            store_ids: [],
            image_files: [],
        },
    });

    useEffect(() => {
        if (productToEdit) {
            const formattedData = productToForm(productToEdit);
            form.reset(formattedData);
            setExistingImages(productToEdit.images || []);
            setImagesToDelete([]);
        }
    }, [productToEdit, form]);

    const createMutation = useMutation({
        mutationFn: (data: ProductInsertPayload) => createProduct(data),
        onSuccess: () => {
            toast({
                title: "Sucesso!",
                description: "Produto criado com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            navigate("/admin/products");
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao criar produto",
                description: error.message,
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: ProductUpdatePayload) => updateProduct(data),
        onSuccess: () => {
            toast({
                title: "Sucesso!",
                description: "Produto atualizado com sucesso.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            queryClient.invalidateQueries({
                queryKey: ["adminProduct", productId],
            });
            navigate("/admin/products");
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar produto",
                description: error.message,
            });
        },
    });

    // CORREÇÃO (Erro 3): O 'data' aqui é o 'FormSchemaOutput'
    const onSubmit = (data: FormSchemaOutput) => {
        const newFiles = data.image_files || [];

        const totalImages = existingImages.length + newFiles.length;
        if (totalImages === 0 && !isEditMode) {
            form.setError("image_files", {
                type: "manual",
                message: "Pelo menos uma imagem é obrigatória.",
            });
            return;
        }
        if (totalImages > 3) {
            form.setError("image_files", {
                type: "manual",
                message: `Máximo de 3 imagens no total. (Atualmente: ${totalImages})`,
            });
            return;
        }

        if (isEditMode) {
            // 'data' já tem os tipos corretos (price: number, colors: string[])
            const payload: ProductUpdatePayload = {
                ...data,
                id: productId,
                images_to_delete: imagesToDelete,
                store_ids: data.store_ids || [], // Garante que não é undefined
            };
            updateMutation.mutate(payload);
        } else {
            const payload: ProductInsertPayload = {
                ...(data as z.infer<typeof createSchema>),
                image_files: data.image_files as File[],
                store_ids: data.store_ids || [], // Garante que não é undefined
            };
            createMutation.mutate(payload);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const newFiles = form.watch("image_files") || [];
    const newFilePreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
    }));

    const removeNewFile = (index: number) => {
        const updatedFiles = newFiles.filter((_, i) => i !== index);
        form.setValue("image_files", updatedFiles, { shouldValidate: true });
    };

    const removeExistingImage = (imageUrl: string) => {
        setExistingImages(existingImages.filter((img) => img !== imageUrl));
        setImagesToDelete((prev) => [...prev, imageUrl]);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8">
                <Card className="mx-auto max-w-3xl">
                    <CardHeader>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2 w-fit justify-self-start p-0"
                        >
                            <Link to="/admin/products">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar para Produtos
                            </Link>
                        </Button>
                        <CardTitle>
                            {isEditMode
                                ? "Editar Produto"
                                : "Adicionar Novo Produto"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditMode && isLoadingProduct ? (
                            <FormSkeleton />
                        ) : (
                            <Form {...form}>
                                {/* CORREÇÃO (Erro 3): O 'data' agora é 'FormSchemaOutput' */}
                                <form
                                    onSubmit={form.handleSubmit(
                                        onSubmit as any
                                    )}
                                    className="space-y-8"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nome do Produto
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="iPhone 15 Pro"
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Descreva o produto..."
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Preço (R$)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            placeholder="7.999,00"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            onBlur={(e) => {
                                                                field.onChange(
                                                                    formatPriceForDisplay(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                );
                                                                field.onBlur();
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Preço final de venda.
                                                    </FormDescription>
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
                                                        Preço Original (R$)
                                                        (Opcional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            placeholder="8.999,00"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            onBlur={(e) => {
                                                                field.onChange(
                                                                    formatPriceForDisplay(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                );
                                                                field.onBlur();
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Preço "de" (para
                                                        promoções).
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="storage"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Armazenamento (Opcional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="256GB"
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
                                        <FormField
                                            control={form.control}
                                            name="ram"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        RAM (Opcional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="8GB"
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
                                        <FormField
                                            control={form.control}
                                            name="colors"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Cores (Opcional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Azul, Preto, Titânio"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Separadas por vírgula.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Categoria
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione a categoria" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="aparelho">
                                                                Aparelho
                                                                (Celular,
                                                                Tablet)
                                                            </SelectItem>
                                                            <SelectItem value="acessorio">
                                                                Acessório (Capa,
                                                                Carregador)
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="isPromotion"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col rounded-lg border p-4">
                                                    <FormLabel>
                                                        Produto em Promoção?
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Marque para exibir na
                                                        página de Promoções.
                                                    </FormDescription>
                                                    <FormControl className="mt-2">
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
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="store_ids"
                                        render={() => (
                                            <FormItem>
                                                <div className="mb-4">
                                                    <FormLabel className="text-base">
                                                        Lojas
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Selecione as lojas onde
                                                        este produto está
                                                        disponível.
                                                    </FormDescription>
                                                </div>
                                                {isLoadingStores && (
                                                    <Skeleton className="h-5 w-1/4" />
                                                )}
                                                {stores?.map((store) => (
                                                    <FormField
                                                        key={store.id}
                                                        control={form.control}
                                                        name="store_ids"
                                                        render={({ field }) => (
                                                            <FormItem
                                                                key={store.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(
                                                                            store.id
                                                                        )}
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) => {
                                                                            return checked
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
                                                                                              value
                                                                                          ) =>
                                                                                              value !==
                                                                                              store.id
                                                                                      )
                                                                                  );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {store.name}{" "}
                                                                    (
                                                                    {store.city ||
                                                                        "Online"}
                                                                    )
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
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
                                        }) => {
                                            const totalImages =
                                                existingImages.length +
                                                newFiles.length;
                                            return (
                                                <FormItem>
                                                    <FormLabel>
                                                        Imagens ({totalImages} /
                                                        3)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="file"
                                                            multiple
                                                            accept="image/png, image/jpeg, image/webp"
                                                            disabled={
                                                                totalImages >= 3
                                                            }
                                                            onChange={(e) => {
                                                                const files =
                                                                    Array.from(
                                                                        e.target
                                                                            .files ||
                                                                            []
                                                                    );
                                                                const total =
                                                                    totalImages +
                                                                    files.length;
                                                                if (total > 3) {
                                                                    form.setError(
                                                                        "image_files",
                                                                        {
                                                                            type: "manual",
                                                                            message:
                                                                                "Máximo de 3 imagens no total.",
                                                                        }
                                                                    );
                                                                    return;
                                                                }
                                                                onChange([
                                                                    ...newFiles,
                                                                    ...files,
                                                                ]);
                                                                form.clearErrors(
                                                                    "image_files"
                                                                );
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {isEditMode
                                                            ? "Envie novas imagens para adicionar. Clique no (X) para remover as atuais."
                                                            : "Envie até 3 imagens."}
                                                    </FormDescription>

                                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                                        {existingImages.map(
                                                            (url) => (
                                                                <div
                                                                    key={url}
                                                                    className="relative group"
                                                                >
                                                                    <img
                                                                        src={
                                                                            url
                                                                        }
                                                                        alt="Preview existente"
                                                                        className="w-full h-24 object-cover rounded-md border"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                                        onClick={() =>
                                                                            removeExistingImage(
                                                                                url
                                                                            )
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )
                                                        )}
                                                        {newFilePreviews.map(
                                                            (
                                                                preview,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        preview.name
                                                                    }
                                                                    className="relative group"
                                                                >
                                                                    <img
                                                                        src={
                                                                            preview.url
                                                                        }
                                                                        alt={`Preview ${preview.name}`}
                                                                        className="w-full h-24 object-cover rounded-md border"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                                        onClick={() =>
                                                                            removeNewFile(
                                                                                index
                                                                            )
                                                                        }
                                                                    >
                                                                        <X className="h-4 w-4" />
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
                                            );
                                        }}
                                    />

                                    {createMutation.isError && (
                                        <div className="flex items-center gap-2 text-sm text-destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>
                                                Erro ao criar:{" "}
                                                {createMutation.error.message}
                                            </span>
                                        </div>
                                    )}
                                    {updateMutation.isError && (
                                        <div className="flex items-center gap-2 text-sm text-destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>
                                                Erro ao atualizar:{" "}
                                                {updateMutation.error.message}
                                            </span>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        {isLoading
                                            ? "Salvando..."
                                            : isEditMode
                                            ? "Salvar Alterações"
                                            : "Salvar Produto"}
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
