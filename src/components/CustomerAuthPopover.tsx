import { useState } from "react";
import { User, LogOut, Settings, Heart, Package } from "lucide-react";
import { Link } from "react-router-dom";
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { CustomerAuthForm } from "./CustomerAuthForm";

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

    // --- Renderização Logado (Dropdown) ---
    if (isLoggedIn && profile) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Abrir menu do usuário</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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

                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/minha-conta">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Minha Conta</span>
                        </Link>
                    </DropdownMenuItem>

                    {/* Atalhos extras úteis */}
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/minha-conta">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Meus Pedidos</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/minha-conta">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>Favoritos</span>
                        </Link>
                    </DropdownMenuItem>

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

    // --- Renderização Não Logado (Popover de Login) ---
    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm" // Tamanho menor para alinhar com ícones
                    className="gap-2 px-2 md:px-4" // Padding reduzido no mobile
                >
                    <User className="h-5 w-5" />
                    {/* CORREÇÃO AQUI: Texto escondido no mobile (hidden), visível no desktop (md:inline) */}
                    <span className="hidden md:inline font-medium">Entrar</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <CustomerAuthForm onSuccess={() => setIsPopoverOpen(false)} />
            </PopoverContent>
        </Popover>
    );
};
