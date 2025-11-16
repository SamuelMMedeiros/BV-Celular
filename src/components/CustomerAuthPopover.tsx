import { useState } from "react";
import { User, LogOut } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { CustomerAuthForm } from "./CustomerAuthForm"; // Importa o formulário

export const CustomerAuthPopover = () => {
    const { profile, isLoggedIn, logout, getGreeting } = useCustomerAuth();
    const [isOpen, setIsOpen] = useState(false);

    // --- Renderização Logado ---
    if (isLoggedIn) {
        return (
            <div className="flex items-center space-x-2 border-r pr-3">
                <span className="text-sm font-medium hidden sm:inline">
                    {getGreeting()}
                </span>
                <Button onClick={logout} variant="ghost" size="icon">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    // --- Renderização Não Logado ---
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Entrar/Cadastrar</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
                {/* Renderiza o formulário e passa a função de fechar o popover */}
                <CustomerAuthForm onSuccess={() => setIsOpen(false)} />
            </PopoverContent>
        </Popover>
    );
};
