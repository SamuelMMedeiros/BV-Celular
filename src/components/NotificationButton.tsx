import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import { subscribeToPushNotifications } from "@/lib/pushNotifications";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export const NotificationButton = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { toast } = useToast();
    const { user } = useCustomerAuth();

    const handleSubscribe = async () => {
        try {
            await subscribeToPushNotifications(user?.id);
            setIsSubscribed(true);
            toast({
                title: "Notificações Ativadas!",
                description: "Você receberá ofertas em primeira mão.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível ativar as notificações.",
            });
        }
    };

    if (isSubscribed) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <BellRing className="h-5 w-5 text-primary" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleSubscribe}
            title="Receber Ofertas"
        >
            <Bell className="h-5 w-5" />
        </Button>
    );
};
