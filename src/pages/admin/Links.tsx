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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    fetchPublicLinks,
    createPublicLink,
    updatePublicLink,
    deletePublicLink,
    togglePublicLinkStatus,
} from "@/lib/api";
import {
    PublicLink,
    PublicLinkInsertPayload,
    PublicLinkUpdatePayload,
} from "@/types";
import {
    Loader2,
    Plus,
    Trash2,
    Edit,
    Link as LinkIcon,
    MapPin,
    Phone,
    MessageCircle,
    Instagram,
    Facebook,
    Globe,
} from "lucide-react";

// Mapeamento de Ícones para o Select
const ICON_OPTIONS = [
    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "facebook", label: "Facebook", icon: Facebook },
    { value: "maps", label: "Localização / Maps", icon: MapPin },
    { value: "phone", label: "Telefone", icon: Phone },
    { value: "site", label: "Site / Outro", icon: Globe },
];

const linkSchema = z.object({
    title: z.string().min(2, "Título obrigatório"),
    url: z.string().min(5, "URL inválida"),
    icon: z.string().min(1, "Selecione um ícone"),
    active: z.boolean().default(true),
});

type LinkFormValues = z.infer<typeof linkSchema>;

const AdminLinks = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<PublicLink | null>(null);

    const { data: links, isLoading } = useQuery<PublicLink[]>({
        queryKey: ["adminLinks"],
        queryFn: fetchPublicLinks,
    });

    const form = useForm<LinkFormValues>({
        resolver: zodResolver(linkSchema),
        defaultValues: {
            title: "",
            url: "",
            icon: "whatsapp",
            active: true,
        },
    });

    // --- Mutações ---
    const createMutation = useMutation({
        mutationFn: (data: PublicLinkInsertPayload) => createPublicLink(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Link criado." });
            queryClient.invalidateQueries({ queryKey: ["adminLinks"] });
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
        mutationFn: (data: PublicLinkUpdatePayload) => updatePublicLink(data),
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Link atualizado." });
            queryClient.invalidateQueries({ queryKey: ["adminLinks"] });
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
        mutationFn: (id: string) => deletePublicLink(id),
        onSuccess: () => {
            toast({ title: "Link removido." });
            queryClient.invalidateQueries({ queryKey: ["adminLinks"] });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: boolean }) =>
            togglePublicLinkStatus(id, status),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["adminLinks"] }),
    });

    // --- Handlers ---
    const handleEdit = (link: PublicLink) => {
        setEditingLink(link);
        form.reset({
            title: link.title,
            url: link.url,
            icon: link.icon,
            active: link.active,
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingLink(null);
        form.reset({ title: "", url: "", icon: "whatsapp", active: true });
    };

    const onSubmit = (values: LinkFormValues) => {
        if (editingLink) {
            updateMutation.mutate({ id: editingLink.id, ...values });
        } else {
            // @ts-ignore
            createMutation.mutate(values);
        }
    };

    // Helper para renderizar o ícone
    const getIcon = (iconName: string) => {
        const option = ICON_OPTIONS.find((o) => o.value === iconName);
        const IconComponent = option?.icon || LinkIcon;
        return <IconComponent className="h-4 w-4" />;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Central de Links</h1>
                        <p className="text-muted-foreground">
                            Gerencie a página de contatos (Linktree).
                        </p>
                    </div>
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => !open && handleCloseDialog()}
                    >
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Novo Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingLink ? "Editar Link" : "Novo Link"}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="icon"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Tipo de Link
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {ICON_OPTIONS.map(
                                                            (opt) => (
                                                                <SelectItem
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    value={
                                                                        opt.value
                                                                    }
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <opt.icon className="h-4 w-4" />{" "}
                                                                        {
                                                                            opt.label
                                                                        }
                                                                    </div>
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
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Título do Botão
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex: WhatsApp Vendas"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    URL de Destino
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {form.watch("icon") ===
                                                        "whatsapp" &&
                                                        "Use: https://wa.me/553499999999"}
                                                    {form.watch("icon") ===
                                                        "maps" &&
                                                        "Cole o link de compartilhamento do Google Maps"}
                                                    {form.watch("icon") ===
                                                        "instagram" &&
                                                        "Use: https://instagram.com/seu_perfil"}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="active"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Ativo</FormLabel>
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
                                            : "Salvar"}
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
                                <TableHead>Ícone</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Destino</TableHead>
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
                            ) : !links || links.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        Nenhum link cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                links.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            {getIcon(link.icon)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {link.title}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                                            {link.url}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={link.active}
                                                onCheckedChange={() =>
                                                    toggleMutation.mutate({
                                                        id: link.id,
                                                        status: link.active,
                                                    })
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(link)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() =>
                                                    deleteMutation.mutate(
                                                        link.id
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

export default AdminLinks;
