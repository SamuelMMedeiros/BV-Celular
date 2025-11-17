import { useState } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom"; // <-- Importar Link
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // <-- Importar DropdownMenu
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // <-- Importar Avatar
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { CustomerAuthForm } from "./CustomerAuthForm"; // Importa o formulário

// Helper para pegar as iniciais do nome
const getInitials = (name: string) => {
    const names = name.split(" ");
    const first = names[0]?.[0] || "";
    const last = names.length > 1 ? names[names.length - 1]?.[0] : "";
    return `${first}${last}`.toUpperCase();
};

export const CustomerAuthPopover = () => {
    const { profile, isLoggedIn, logout, getGreeting } = useCustomerAuth();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // --- Renderização Logado (AGORA É UM DROPDOWN) ---
    if (isLoggedIn && profile) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 h-9 w-9 p-0 rounded-full"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Abrir menu do usuário</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {getGreeting()}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {profile.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* --- NOVO LINK --- */}
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/minha-conta">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Minha Conta</span>
                        </Link>
                    </DropdownMenuItem>
                    {/* --- FIM DO NOVO LINK --- */}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={logout}
                        className="cursor-pointer text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // --- Renderização Não Logado (Continua sendo um Popover) ---
    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
                <CustomerAuthForm onSuccess={() => setIsPopoverOpen(false)} />
            </PopoverContent>
        </Popover>
    );
};
