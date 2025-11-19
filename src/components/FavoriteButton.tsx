import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { checkIsFavorite, toggleFavorite } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
    productId: string;
    className?: string;
    variant?: "icon" | "text"; // icon = só o coração, text = com texto "Favoritar"
}

export const FavoriteButton = ({
    productId,
    className,
    variant = "icon",
}: FavoriteButtonProps) => {
    const { profile, isLoggedIn } = useCustomerAuth();
    const { toast } = useToast();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Verifica status inicial ao carregar
    useEffect(() => {
        let mounted = true;
        const checkStatus = async () => {
            if (isLoggedIn && profile) {
                const status = await checkIsFavorite(profile.id, productId);
                if (mounted) setIsFavorite(status);
            }
        };
        checkStatus();
        return () => {
            mounted = false;
        };
    }, [isLoggedIn, profile, productId]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Não abrir o card/link ao clicar no coração

        if (!isLoggedIn || !profile) {
            toast({
                title: "Faça login",
                description: "Você precisa estar logado para salvar favoritos.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const newStatus = await toggleFavorite(profile.id, productId);
            setIsFavorite(newStatus);
            toast({
                title: newStatus
                    ? "Adicionado aos Favoritos"
                    : "Removido dos Favoritos",
                description: newStatus
                    ? "O produto foi salvo na sua lista."
                    : "O produto foi removido da sua lista.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar os favoritos.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "text") {
        return (
            <Button
                variant="outline"
                size="lg"
                className={cn("gap-2", className)}
                onClick={handleToggle}
                disabled={isLoading}
            >
                <Heart
                    className={cn(
                        "h-5 w-5",
                        isFavorite && "fill-red-500 text-red-500"
                    )}
                />
                {isFavorite ? "Salvo nos Favoritos" : "Adicionar aos Favoritos"}
            </Button>
        );
    }

    // Variante padrão (ícone circular)
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "rounded-full hover:bg-background/80 bg-background/50 backdrop-blur-sm shadow-sm transition-all",
                isFavorite && "text-red-500 hover:text-red-600",
                className
            )}
            onClick={handleToggle}
            disabled={isLoading}
        >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
            <span className="sr-only">Favoritar</span>
        </Button>
    );
};
