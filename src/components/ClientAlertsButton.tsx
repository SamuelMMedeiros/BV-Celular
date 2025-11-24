/**
 * @title src/components/ClientAlertsButton.tsx
 * @collapsible
 */
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    MailOpen,
    Check,
    Package,
    Clock,
    Truck,
    Store,
    XCircle,
    Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
    fetchClientNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
} from "@/lib/api";

import { ClientNotification, } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Skeleton } from "./ui/skeleton";

const getIconAndColor = (statusKey: string) => {
    switch (statusKey) {
        case "on_the_way":
            return { Icon: Truck, color: "text-blue-500", label: "Em Entrega" };
        case "ready":
            return {
                Icon: Store,
                color: "text-amber-500",
                label: "Pronto p/ Retirada",
            };
        case "completed":
            return { Icon: Check, color: "text-green-500", label: "Concluído" };
        case "cancelled":
            return { Icon: XCircle, color: "text-red-500", label: "Cancelado" };
        case "processing":
            return {
                Icon: Package,
                color: "text-indigo-500",
                label: "Processando",
            };
        case "pending":
            return { Icon: Clock, color: "text-gray-500", label: "Pendente" };
        default:
            return {
                Icon: Clock,
                color: "text-gray-500",
                label: "Atualização",
            };
    }
};

const ClientAlertsButton: React.FC = () => {
    const { customerProfile } = useCustomerAuth();
    const queryClient = useQueryClient();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const clientId = customerProfile?.id || "";

    // Busca as notificações
    const { data: notifications, isLoading } = useQuery<ClientNotification[]>({
        queryKey: ["clientNotifications", clientId],
        queryFn: () => fetchClientNotifications(clientId),
        enabled: !!clientId,
    });

    const unreadCount = useMemo(() => {
        return notifications?.filter((n) => !n.is_read).length || 0;
    }, [notifications]);

    // Mutação para marcar como lido
    const markReadMutation = useMutation({
        mutationFn: (id: string) => markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["clientNotifications", clientId],
            });
        },
    });

    // Mutação para marcar todos como lidos
    const markAllReadMutation = useMutation({
        mutationFn: () => markAllNotificationsAsRead(clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["clientNotifications", clientId],
            });
        },
    });

    const handleMarkAsRead = (notification: ClientNotification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        // Redireciona para a aba de pedidos
        if (notification.order_id) {
            // Em uma implementação real, você navegaria para a aba de pedidos:
            // navigate(`/minha-conta?tab=pedidos`);
        }
    };

    if (!clientId) return null;

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                {/* Usando MailOpen para diferenciar do sino de Push Notification */}
                <Button variant="ghost" size="icon" className="relative">
                    <MailOpen className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 flex items-center justify-between border-b">
                    <h4 className="font-bold text-lg">Central de Alertas</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            {markAllReadMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Marcar todas como lidas"
                            )}
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    <div className="p-2 space-y-1">
                        {isLoading ? (
                            <div className="space-y-3 p-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : notifications && notifications.length > 0 ? (
                            notifications.map((n) => {
                                const { Icon, color } = getIconAndColor(
                                    n.status_key || "pending"
                                );
                                return (
                                    <div
                                        key={n.id}
                                        className={`p-3 rounded-lg flex gap-3 cursor-pointer transition-colors ${
                                            n.is_read
                                                ? "bg-background hover:bg-muted/50"
                                                : "bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-100/70"
                                        }`}
                                        onClick={() => handleMarkAsRead(n)}
                                    >
                                        <div
                                            className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${color} bg-current/10`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p
                                                className={`text-sm ${
                                                    n.is_read
                                                        ? "text-foreground/80"
                                                        : "font-semibold text-foreground"
                                                }`}
                                            >
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {formatDistanceToNow(
                                                    parseISO(n.created_at),
                                                    {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    }
                                                )}
                                            </p>
                                            {n.order_id && (
                                                <Badge
                                                    variant="secondary"
                                                    className="mt-1 text-xs px-2 py-0.5 font-mono"
                                                >
                                                    Pedido #
                                                    {n.order_id.substring(0, 8)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-muted-foreground py-8 text-sm">
                                Nenhum alerta recente.
                            </p>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t">
                    <Button variant="link" asChild className="w-full text-sm">
                        <Link
                            to="/minha-conta"
                            onClick={() => setIsPopoverOpen(false)}
                        >
                            Ir para Minha Conta
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export { ClientAlertsButton };
