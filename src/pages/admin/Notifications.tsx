/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    fetchNotifications,
    createNotification,
    sendNotificationNow,
    deleteNotification,
    uploadBannerImage,
} from "@/lib/api";
import { PushCampaign, PushCampaignInsertPayload } from "@/types";
import {
    Loader2,
    Send,
    Trash2,
    Bell,
    Smartphone,
    Image as ImageIcon,
    CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

const notificationSchema = z.object({
    title: z.string().min(3, "Título obrigatório"),
    body: z.string().min(5, "Mensagem obrigatória"),
    link_url: z.string().optional(),
    image_url: z.string().optional(),
    scheduled_for: z.date().optional().nullable(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

const AdminNotifications = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const { data: notifications, isLoading } = useQuery<PushCampaign[]>({
        queryKey: ["adminNotifications"],
        queryFn: fetchNotifications,
    });

    const form = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            title: "",
            body: "",
            link_url: "/",
            image_url: "",
            scheduled_for: null,
        },
    });

    // Mutações
    const createMutation = useMutation({
        mutationFn: (data: PushCampaignInsertPayload) =>
            createNotification(data),
        onSuccess: () => {
            toast({ title: "Notificação criada!" });
            queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
            form.reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
            toast({ title: "Removida" });
        },
    });

    const handleSendNow = async (notification: PushCampaign) => {
        if (!confirm("Enviar esta notificação para TODOS os inscritos agora?"))
            return;
        setIsSending(true);
        try {
            const count = await sendNotificationNow(notification);
            toast({
                title: "Enviada com sucesso!",
                description: `${count} dispositivos receberam.`,
            });
            queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro no envio",
                description: error.message,
            });
        } finally {
            setIsSending(false);
        }
    };

    const onSubmit = (values: NotificationFormValues) => {
        const payload: PushCampaignInsertPayload = {
            title: values.title,
            body: values.body,
            link_url: values.link_url,
            image_url: values.image_url,
            scheduled_for: values.scheduled_for
                ? values.scheduled_for.toISOString()
                : null,
            status: values.scheduled_for ? "scheduled" : "draft",
        };
        createMutation.mutate(payload);
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadBannerImage(file);
            form.setValue("image_url", url);
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    // Valores em tempo real para o Mockup
    const watchTitle = form.watch("title");
    const watchBody = form.watch("body");
    const watchImage = form.watch("image_url");

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* COLUNA 1: FORMULÁRIO */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                                <Bell className="h-8 w-8 text-primary" />{" "}
                                Central de Notificações
                            </h1>
                            <p className="text-muted-foreground">
                                Envie alertas Push para os clientes que
                                instalaram o App.
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Nova Campanha</CardTitle>
                                <CardDescription>
                                    Crie o conteúdo da mensagem.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Título (Chamada)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: Oferta Relâmpago! ⚡"
                                                            {...field}
                                                            maxLength={40}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="body"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Mensagem
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Ex: O iPhone 15 está com 20% de desconto. Corre!"
                                                            {...field}
                                                            maxLength={120}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
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
                                                                placeholder="/promocoes"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="scheduled_for"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>
                                                            Agendar (Opcional)
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
                                                                            "pl-3 text-left font-normal",
                                                                            !field.value &&
                                                                                "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(
                                                                                field.value,
                                                                                "dd/MM HH:mm"
                                                                            )
                                                                        ) : (
                                                                            <span>
                                                                                Enviar
                                                                                Agora
                                                                            </span>
                                                                        )}
                                                                        <CalendarClock className="ml-auto h-4 w-4 opacity-50" />
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
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="image_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Imagem (Banner Android)
                                                    </FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input
                                                                placeholder="URL da imagem..."
                                                                {...field}
                                                            />
                                                        </FormControl>
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
                                                            >
                                                                {isUploading ? (
                                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                                ) : (
                                                                    <ImageIcon className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <FormDescription>
                                                        Recomendado: 600x300px
                                                        (Paisagem)
                                                    </FormDescription>
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
                                                : "Salvar Campanha"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUNA 2: PREVIEW (MOCKUP) */}
                    <div className="w-full lg:w-80 flex flex-col items-center pt-12">
                        <h3 className="font-semibold mb-4 text-muted-foreground uppercase text-xs tracking-widest">
                            Pré-visualização Android
                        </h3>

                        {/* MOCKUP DE CELULAR CSS */}
                        <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-700">
                            {/* Notch/Camera */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-800 rounded-b-xl z-20"></div>

                            {/* Wallpaper */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 z-0"></div>

                            {/* Notificação */}
                            <div className="relative z-10 mt-12 mx-3 bg-white/95 backdrop-blur text-slate-900 rounded-2xl shadow-lg overflow-hidden animate-in slide-in-from-top-4 duration-700">
                                <div className="p-3 flex gap-3 items-start">
                                    <div className="h-6 w-6 bg-black rounded-full flex items-center justify-center shrink-0">
                                        <img
                                            src="/pwa-192x192.png"
                                            alt="Logo"
                                            className="h-4 w-4"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-xs font-bold opacity-70">
                                                BV Celular • Agora
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm leading-tight">
                                            {watchTitle ||
                                                "Título da Notificação"}
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-snug mt-1">
                                            {watchBody ||
                                                "O texto da sua mensagem aparecerá aqui."}
                                        </p>
                                    </div>
                                </div>
                                {watchImage && (
                                    <div className="w-full h-32 bg-slate-100 border-t">
                                        <img
                                            src={watchImage}
                                            className="w-full h-full object-cover"
                                            alt="Preview"
                                        />
                                    </div>
                                )}
                                <div className="bg-slate-50 px-4 py-2 border-t flex gap-4">
                                    <span className="text-xs font-bold text-blue-600 uppercase">
                                        Ver Oferta
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HISTÓRICO */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-4">
                        Histórico de Envios
                    </h2>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Campanha</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Alcance</TableHead>
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
                                            Carregando...
                                        </TableCell>
                                    </TableRow>
                                ) : !notifications?.length ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Nenhuma campanha criada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notifications.map((notif) => (
                                        <TableRow key={notif.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(
                                                    new Date(notif.created_at),
                                                    "dd/MM HH:mm"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {notif.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {notif.body}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        notif.status === "sent"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className={
                                                        notif.status === "sent"
                                                            ? "bg-green-600"
                                                            : ""
                                                    }
                                                >
                                                    {notif.status === "sent"
                                                        ? "Enviado"
                                                        : notif.status ===
                                                          "scheduled"
                                                        ? "Agendado"
                                                        : "Rascunho"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {notif.status === "sent"
                                                    ? `${notif.sent_count} dispositivos`
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {notif.status !== "sent" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSendNow(notif)
                                                        }
                                                        disabled={isSending}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <Send className="h-3 w-3 mr-1" />{" "}
                                                        Enviar
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        deleteMutation.mutate(
                                                            notif.id
                                                        )
                                                    }
                                                    className="text-destructive"
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
                </div>
            </main>
        </div>
    );
};

export default AdminNotifications;
