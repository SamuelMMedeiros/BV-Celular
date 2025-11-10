//
// === CÓDIGO COMPLETO FINAL PARA: src/pages/admin/ProductForm.tsx ===
//
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect } from "react";
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
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    createProduct,
    fetchStores,
    fetchProductById,
    updateProduct, // 1. Importar a função de update
    ProductInsertPayload,
    ProductUpdatePayload,
} from "@/lib/api";
import { Store, Product } from "@/types";

// Schemas de Validação (Criação e Edição)
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const commonSchema = {
    name: z
        .string()
        .min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    description: z.string().optional(),
    price: z.coerce
        .number({ invalid_type_error: "Preço deve ser um número." })
        .min(1, { message: "Preço é obrigatório." })
        .transform((val) => val * 100),
    originalPrice: z.coerce
        .number()
        .optional()
        .transform((val) => (val ? val * 100 : undefined)),
    storage: z.string().optional(),
    ram: z.string().optional(),
    colors: z
        .string()
        .optional()
        .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
    category: z.enum(["aparelho", "acessorio"], {
        required_error: "Categoria é obrigatória.",
    }),
    isPromotion: z.boolean().default(false),
    store_ids: z.array(z.string()).optional(),
};

// Schema para CRIAR
const createSchema = z.object({
    ...commonSchema,
    image_files: z
        .custom<FileList>()
        .refine(
            (files) => files && files.length > 0,
            "Pelo menos uma imagem é obrigatória."
        )
        .refine((files) => files.length <= 3, "Máximo de 3 imagens.")
        .refine(
            (files) =>
                Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
            `Tamanho máximo de ${MAX_FILE_SIZE_MB}MB por imagem.`
        )
        .refine(
            (files) =>
                Array.from(files).every((file) =>
                    ACCEPTED_IMAGE_TYPES.includes(file.type)
                ),
            "Apenas .jpg, .jpeg, .png e .webp."
        ),
});

// Schema para EDITAR
const editSchema = z.object({
    ...commonSchema,
    image_files: z
        .custom<FileList>() // Imagens são opcionais na edição
        .optional()
        .refine((files) => !files || files.length <= 3, "Máximo de 3 imagens.")
        .refine(
            (files) =>
                !files ||
                Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
            `Tamanho máximo de ${MAX_FILE_SIZE_MB}MB por imagem.`
        )
        .refine(
            (files) =>
                !files ||
                Array.from(files).every((file) =>
                    ACCEPTED_IMAGE_TYPES.includes(file.type)
                ),
            "Apenas .jpg, .jpeg, .png e .webp."
        ),
});

// Helper: Converte dados do Produto (da API) para o formato do formulário
const productToForm = (product: Product) => ({
    ...product,
    price: product.price / 100,
    originalPrice: product.originalPrice
        ? product.originalPrice / 100
        : undefined,
    colors: product.colors?.join(", ") || "",
    store_ids: product.stores.map((store) => store.id),
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

// Define o tipo do formulário (pode ser criação ou edição)
type FormSchema = z.infer<typeof createSchema> | z.infer<typeof editSchema>;

const AdminProductForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { productId } = useParams<{ productId: string }>();
    const isEditMode = !!productId;

    // Define o schema correto
    const formSchema = isEditMode ? editSchema : createSchema;

    // Busca lojas
    const { data: stores, isLoading: isLoadingStores } = useQuery<Store[]>({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });

    // Busca produto (se em modo de edição)
    const { data: productToEdit, isLoading: isLoadingProduct } =
        useQuery<Product>({
            queryKey: ["adminProduct", productId],
            queryFn: () => fetchProductById(productId!),
            enabled: isEditMode,
        });

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            price: undefined,
            originalPrice: undefined,
            storage: "",
            ram: "",
            colors: "",
            category: "aparelho",
            isPromotion: false,
            store_ids: [],
        },
    });

    // Efeito para preencher o formulário no modo de edição
    useEffect(() => {
        if (productToEdit) {
            const formattedData = productToForm(productToEdit);
            form.reset(formattedData);
        }
    }, [productToEdit, form]);

    // Mutação de CRIAÇÃO
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

    // 2. Mutação de ATUALIZAÇÃO
    const updateMutation = useMutation({
        mutationFn: (data: ProductUpdatePayload) => updateProduct(data),
        onSuccess: () => {
            toast({
                title: "Sucesso!",
                description: "Produto atualizado com sucesso.",
            });
            // Invalida a lista E o produto específico
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

    // 3. Função de Envio ATUALIZADA
    const onSubmit = (data: FormSchema) => {
        if (isEditMode) {
            // Lógica de Edição
            const payload: ProductUpdatePayload = {
                ...data,
                id: productId, // Inclui o ID do produto
                current_images: productToEdit?.images, // Passa as URLs antigas para exclusão
                image_files: data.image_files as FileList | undefined,
            };
            updateMutation.mutate(payload);
        } else {
            // Lógica de Criação
            const payload: ProductInsertPayload = {
                ...data,
                image_files: data.image_files as FileList,
            };
            createMutation.mutate(payload);
        }
    };

    const { register } = form;
    // 4. Estado de Loading ATUALIZADO
    const isLoading = createMutation.isPending || updateMutation.isPending;

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
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-8"
                                >
                                    {/* Nome */}
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
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Descrição */}
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

                                    {/* Grid para Preço e Preço Original */}
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
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="7999.00"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Preço final de venda (em
                                                        Reais).
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
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="8999.00"
                                                            {...field}
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

                                    {/* Grid para Specs */}
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

                                    {/* Grid para Categoria e Promoção */}
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

                                    {/* Lojas */}
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
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-5 w-1/4" />
                                                        <Skeleton className="h-5 w-1/4" />
                                                    </div>
                                                )}
                                                {stores?.map((store) => (
                                                    <FormField
                                                        key={store.id}
                                                        control={form.control}
                                                        name="store_ids"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={
                                                                        store.id
                                                                    }
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
                                                                        {
                                                                            store.name
                                                                        }{" "}
                                                                        (
                                                                        {store.city ||
                                                                            "Online"}
                                                                        )
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Imagens */}
                                    <FormItem>
                                        <FormLabel>Imagens (Até 3)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                multiple
                                                accept="image/png, image/jpeg, image/webp"
                                                {...register("image_files")}
                                            />
                                        </FormControl>
                                        {isEditMode && (
                                            <FormDescription>
                                                Envie novas imagens apenas se
                                                quiser **substituir** as atuais.
                                            </FormDescription>
                                        )}
                                        <FormMessage>
                                            {
                                                form.formState.errors
                                                    .image_files?.message
                                            }
                                        </FormMessage>
                                    </FormItem>

                                    {/* 5. Linhas de Erro (o que você pediu) */}
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

                                    {/* 6. Botão de Envio Dinâmico */}
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
