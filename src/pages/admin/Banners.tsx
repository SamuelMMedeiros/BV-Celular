/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
    fetchAllBannersAdmin,
    createBanner,
    updateBanner,
    deleteBanner,
    uploadBannerImage,
    BannerInsertPayload,
    BannerUpdatePayload,
} from "@/lib/api";
import { Banner } from "@/types";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    Image as ImageIcon,
    ExternalLink,
} from "lucide-react";

// Schema de Validação
const bannerSchema = z.object({
    title: z.string().min(3, "Título é obrigatório"),
    subtitle: z.string().optional(),
    image_url: z.string().min(1, "Imagem é obrigatória (URL ou Upload)"),
    link_url: z.string().min(1, "Link de destino é obrigatório"),
    button_text: z.string().min(1, "Texto do botão é obrigatório"),
    active: z.boolean().default(true),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

const AdminBanners = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Busca Banners
    const { data: banners, isLoading } = useQuery<Banner[]>({
        queryKey: ["adminBanners"],
        queryFn: fetchAllBannersAdmin,
    });

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: "",
            subtitle: "",
            image_url: "",
            link_url: "/aparelhos",
            button_text: "Ver Oferta",
            active: true,
        },
    });

    // --- Mutações ---
    const createMutation = useMutation({
        mutationFn: (data: BannerInsertPayload) => createBanner(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Banner criado." });
            queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
            handleClose();
        },
        onError: (err) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: err.message,
            }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: BannerUpdatePayload) => updateBanner(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Banner atualizado." });
            queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
            handleClose();
        },
        onError: (err) =>
            toast({
                variant: "destructive",
                title: "Erro",
                description: err.message,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteBanner(id),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Banner removido." });
            queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
        },
    });

    // --- Handlers ---
    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        form.reset({
            title: banner.title,
            subtitle: banner.subtitle || "",
            image_url: banner.image_url,
            link_url: banner.link_url,
            button_text: banner.button_text,
            active: banner.active,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza? Isso removerá o banner da home.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        setEditingBanner(null);
        form.reset({
            title: "",
            subtitle: "",
            image_url: "",
            link_url: "/aparelhos",
            button_text: "Ver Oferta",
            active: true,
        });
    };

    const onSubmit = (values: BannerFormValues) => {
        if (editingBanner) {
            updateMutation.mutate({ ...values, id: editingBanner.id });
        } else {
            createMutation.mutate(values);
        }
    };

    // Handler de Upload de Imagem
    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadBannerImage(file);
            form.setValue("image_url", url);
            toast({
                title: "Imagem enviada!",
                description: "URL preenchida automaticamente.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Falha no upload",
                description: error.message,
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Gestão de Banners
                        </h1>
                        <p className="text-muted-foreground">
                            Configure o carrossel da página inicial.
                        </p>
                    </div>

                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => !open && handleClose()}
                    >
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Novo Banner
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingBanner
                                        ? "Editar Banner"
                                        : "Criar Novo Banner"}
                                </DialogTitle>
                            </DialogHeader>

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    {/* Títulos */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Título Principal
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: Ofertas de Natal"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="subtitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Subtítulo (Opcional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: Descontos de até 50%"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Imagem */}
                                    <FormField
                                        control={form.control}
                                        name="image_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Imagem de Fundo
                                                </FormLabel>
                                                <div className="flex gap-2 items-center">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="https://..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    {/* Input de arquivo escondido mas funcional */}
                                                    <div className="relative">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={
                                                                handleImageUpload
                                                            }
                                                            disabled={
                                                                isUploading
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            disabled={
                                                                isUploading
                                                            }
                                                        >
                                                            {isUploading ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <FormDescription>
                                                    Cole a URL ou clique no
                                                    ícone para subir um arquivo.
                                                </FormDescription>
                                                {field.value && (
                                                    <img
                                                        src={field.value}
                                                        alt="Preview"
                                                        className="h-20 w-full object-cover rounded-md mt-2 border"
                                                    />
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Links e Botão */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="button_text"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Texto do Botão
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: Ver Ofertas"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="link_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Link de Destino
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="/aparelhos ou https://wa.me/..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Ativo Switch */}
                                    <FormField
                                        control={form.control}
                                        name="active"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>
                                                        Banner Ativo
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Exibir na página
                                                        inicial.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            createMutation.isPending ||
                                            updateMutation.isPending
                                        }
                                    >
                                        {createMutation.isPending ||
                                        updateMutation.isPending
                                            ? "Salvando..."
                                            : editingBanner
                                            ? "Atualizar Banner"
                                            : "Criar Banner"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Link</TableHead>
                                    <TableHead>Status</TableHead>
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
                                            <Loader2 className="animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : !banners || banners.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Nenhum banner cadastrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    banners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell>
                                                <img
                                                    src={banner.image_url}
                                                    alt="Miniatura"
                                                    className="w-16 h-10 object-cover rounded bg-muted"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {banner.title}
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {banner.subtitle}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                                    <ExternalLink className="h-3 w-3" />{" "}
                                                    {banner.link_url.substring(
                                                        0,
                                                        20
                                                    )}
                                                    ...
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        banner.active
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {banner.active
                                                        ? "Ativo"
                                                        : "Inativo"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEdit(banner)
                                                    }
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        handleDelete(banner.id)
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
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminBanners;
