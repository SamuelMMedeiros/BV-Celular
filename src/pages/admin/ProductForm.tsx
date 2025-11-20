/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { ArrowLeft, X, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    createProduct,
    fetchStores,
    fetchProductById,
    updateProduct,
} from "@/lib/api";
import { ProductInsertPayload, ProductUpdatePayload, Store, Product } from "@/types";
import { parseCurrency, formatCurrency } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Opções de Subcategoria
const SUBCATEGORIES = {
    aparelho: [
        { value: "smartphone", label: "Smartphone" },
        { value: "tablet", label: "Tablet" },
        { value: "smartwatch", label: "Smartwatch" }, // Smartwatch pode ser considerado aparelho também
    ],
    acessorio: [
        { value: "case", label: "Capa / Case" },
        { value: "film", label: "Película" },
        { value: "charger", label: "Carregador / Cabo" },
        { value: "audio", label: "Fone / Áudio" },
        { value: "smartwatch_band", label: "Pulseira de Watch" },
        { value: "peripheral", label: "Periférico" },
        { value: "other", label: "Outros" },
    ]
};

const commonSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    description: z.string().optional().nullable(),
    brand: z.string().min(1, "A marca é obrigatória."), // Marca agora obrigatória para ajudar no filtro
    subcategory: z.string().optional(), // Novo campo

    price: z.string().min(1, { message: "Preço é obrigatório." }).transform((val) => parseCurrency(val)).refine((val) => val !== undefined && val > 0, { message: "Preço inválido." }),

    originalPrice: z.string().optional().nullable().transform((val) => (val ? parseCurrency(val) : undefined)),

    storage: z.string().optional().nullable(),
    ram: z.string().optional().nullable(),
    colors: z.string().optional().nullable().transform((val) => val ? val.split(",").map((s) => s.trim()).filter(Boolean) : []),
    category: z.enum(["aparelho", "acessorio"], { required_error: "Categoria é obrigatória." }),
    isPromotion: z.boolean().default(false),
    promotion_end_date: z.date().optional().nullable(), 
    quantity: z.string().optional().default("0"),
    store_ids: z.array(z.string()).optional(),
});

const imageFileSchema = z.array(z.instanceof(File)).optional(); 

const createSchema = commonSchema.extend({
    image_files: imageFileSchema, 
});

const editSchema = commonSchema.extend({
    image_files: imageFileSchema,
});

type FormValues = Omit<z.input<typeof createSchema>, "price" | "originalPrice" | "colors" | "promotion_end_date"> & {
    price: string;
    originalPrice?: string | null;
    colors?: string | null;
    promotion_end_date?: Date | null;
};

const productToForm = (product: Product): FormValues => ({
    name: product.name,
    description: product.description ?? "",
    brand: product.brand ?? "",
    subcategory: product.subcategory ?? "", // Mapeando
    price: product.price ? formatCurrency(product.price).replace("R$", "").trim() : "",
    originalPrice: product.originalPrice ? formatCurrency(product.originalPrice).replace("R$", "").trim() : "",
    storage: product.storage ?? "",
    ram: product.ram ?? "",
    colors: (Array.isArray(product.colors) ? product.colors.join(", ") : product.colors) || "",
    category: product.category as "aparelho" | "acessorio",
    isPromotion: product.isPromotion || false,
    promotion_end_date: product.promotion_end_date ? new Date(product.promotion_end_date) : null,
    quantity: String(product.quantity || 0),
    store_ids: product.stores.map((store) => store.id),
    image_files: [],
});

const FormSkeleton = () => (
    <div className="space-y-8">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-1/2" />
        <Skeleton className="h-10 w-full" />
    </div>
);

type FormSchemaOutput = z.infer<typeof createSchema> | z.infer<typeof editSchema>;

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
            colors: "",
            category: "aparelho",
            isPromotion: false,
            promotion_end_date: null,
            quantity: "0",
            store_ids: [],
            image_files: [],
        },
    });

    const selectedCategory = form.watch("category");
    const isPromotion = form.watch("isPromotion");

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
            toast({ title: "Sucesso!", description: "Produto criado." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            navigate("/admin/products");
        },
        onError: (error) => toast({ variant: "destructive", title: "Erro", description: error.message }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: ProductUpdatePayload) => updateProduct(data),
        onSuccess: () => {
            toast({ title: "Sucesso!", description: "Produto atualizado." });
            queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            queryClient.invalidateQueries({ queryKey: ["adminProduct", productId] });
            navigate("/admin/products");
        },
        onError: (error) => toast({ variant: "destructive", title: "Erro", description: error.message }),
    });

    const onSubmit = (data: FormSchemaOutput) => {
        const newFiles = data.image_files || [];
        const totalImages = existingImages.length + newFiles.length;

        if (totalImages === 0 && !isEditMode) {
            form.setError("image_files", { type: "manual", message: "Imagem obrigatória." });
            return;
        }
        if (totalImages > 3) {
            form.setError("image_files", { type: "manual", message: "Máximo de 3 imagens." });
            return;
        }

        const promotionEndDateISO = data.promotion_end_date ? data.promotion_end_date.toISOString() : null;
        const qty = parseInt(data.quantity as string, 10) || 0;

        // Define subcategoria como null se estiver vazia
        const subcategoryValue = data.subcategory || null;

        const commonPayload = {
            store_ids: data.store_ids || [], 
            promotion_end_date: promotionEndDateISO, 
            quantity: qty,
            brand: data.brand,
            subcategory: subcategoryValue
        };

        if (isEditMode) {
            updateMutation.mutate({
                ...(data as z.infer<typeof editSchema>),
                id: productId,
                images_to_delete: imagesToDelete,
                ...commonPayload
            });
        } else {
            createMutation.mutate({
                ...(data as z.infer<typeof createSchema>),
                image_files: data.image_files as File[],
                ...commonPayload
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;
    const newFiles = form.watch("image_files") || [];
    const newFilePreviews = newFiles.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));

    const removeNewFile = (index: number) => {
        const updatedFiles = newFiles.filter((_, i) => i !== index);
        form.setValue("image_files", updatedFiles, { shouldValidate: true });
    };

    const removeExistingImage = (imageUrl: string) => {
        setExistingImages(existingImages.filter((img) => img !== imageUrl));
        setImagesToDelete((prev) => [...prev, imageUrl]);
    };

    const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>, fieldName: "price" | "originalPrice") => {
        const value = e.target.value;
        const cents = parseCurrency(value);
        if (cents !== undefined) {
            const formatted = (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, '');
            form.setValue(fieldName, formatted);
        } else {
            form.setValue(fieldName, "");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <Card className="mx-auto max-w-3xl">
                    <CardHeader>
                        <Button variant="ghost" size="sm" asChild className="mb-2 w-fit justify-self-start p-0">
                            <Link to="/admin/products"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
                        </Button>
                        <CardTitle>{isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditMode && isLoadingProduct ? ( <FormSkeleton /> ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
                                    
                                    {/* TIPO E SUBCATEGORIA */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Categoria Principal</FormLabel>
                                                    <Select onValueChange={(val) => {
                                                        field.onChange(val);
                                                        form.setValue("subcategory", ""); // Reseta subcategoria ao trocar
                                                    }} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="aparelho">Aparelho</SelectItem>
                                                            <SelectItem value="acessorio">Acessório</SelectItem>
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
                                                    <FormLabel>Subcategoria</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {SUBCATEGORIES[selectedCategory as 'aparelho' | 'acessorio']?.map((sub) => (
                                                                <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="brand" render={({ field }) => (
                                            <FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ex: Apple, Samsung" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <FormField control={form.control} name="price" render={({ field }) => (
                                            <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input {...field} onBlur={(e) => { handlePriceBlur(e, "price"); field.onBlur(); }} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="originalPrice" render={({ field }) => (
                                            <FormItem><FormLabel>Preço Original</FormLabel><FormControl><Input {...field} onBlur={(e) => { handlePriceBlur(e, "originalPrice"); field.onBlur(); }} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="quantity" render={({ field }) => (
                                            <FormItem><FormLabel>Qtd. Estoque</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>

                                    {/* ESPECIFICAÇÕES - VISÍVEL APENAS PARA APARELHO */}
                                    {selectedCategory === "aparelho" && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/30 p-4 rounded-lg border border-dashed">
                                            <div className="col-span-full text-sm font-semibold text-muted-foreground">ESPECIFICAÇÕES TÉCNICAS</div>
                                            <FormField control={form.control} name="storage" render={({ field }) => (
                                                <FormItem><FormLabel>Armazenamento</FormLabel><FormControl><Input placeholder="128GB" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="ram" render={({ field }) => (
                                                <FormItem><FormLabel>Memória RAM</FormLabel><FormControl><Input placeholder="8GB" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="colors" render={({ field }) => (
                                                <FormItem><FormLabel>Cores</FormLabel><FormControl><Input placeholder="Azul, Preto" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                    )}

                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} className="h-32" /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                         <FormField control={form.control} name="isPromotion" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-[84px]">
                                                    <div className="space-y-0.5"><FormLabel className="text-base">Em Promoção?</FormLabel></div>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        {isPromotion && (
                                            <FormField control={form.control} name="promotion_end_date" render={({ field }) => (
                                                    <FormItem className="flex flex-col pt-2">
                                                        <FormLabel>Válida até</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal h-12", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus /></PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    <FormField control={form.control} name="store_ids" render={() => (
                                            <FormItem>
                                                <div className="mb-4"><FormLabel className="text-base">Disponibilidade nas Lojas</FormLabel></div>
                                                {isLoadingStores && <Skeleton className="h-5 w-1/4" />}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {stores?.map((store) => (
                                                        <FormField key={store.id} control={form.control} name="store_ids" render={({ field }) => (
                                                                <FormItem key={store.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card">
                                                                    <FormControl><Checkbox checked={field.value?.includes(store.id)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), store.id]) : field.onChange(field.value?.filter((value) => value !== store.id))} /></FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer w-full">{store.name} <span className="text-muted-foreground text-xs">({store.city})</span></FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Controller control={form.control} name="image_files" render={({ field: { onChange }, fieldState: { error } }) => (
                                            <FormItem>
                                                <FormLabel>Imagens</FormLabel>
                                                <FormControl><Input type="file" multiple accept="image/*" onChange={(e) => onChange([...newFiles, ...Array.from(e.target.files || [])])} /></FormControl>
                                                <FormDescription>Até 3 imagens.</FormDescription>
                                                <div className="mt-4 grid grid-cols-3 gap-4">
                                                     {existingImages.map(url => <div key={url} className="relative aspect-square"><img src={url} className="object-cover w-full h-full rounded" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1" onClick={() => removeExistingImage(url)}><X className="h-4 w-4"/></Button></div>)}
                                                     {newFilePreviews.map((p, i) => <div key={i} className="relative aspect-square"><img src={p.url} className="object-cover w-full h-full rounded" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1" onClick={() => removeNewFile(i)}><X className="h-4 w-4"/></Button></div>)}
                                                </div>
                                                {error && <FormMessage>{error.message}</FormMessage>}
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg">{isLoading ? "Salvando..." : "Salvar"}</Button>
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