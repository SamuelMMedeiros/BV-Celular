import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Smartphone,
    Tag,
    ShieldCheck,
    LogOut,
    MessageCircle,
    Menu,
    ShoppingCart,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
// CORREÇÃO: Importa o hook do Contexto, não do Popover
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { CustomerAuthPopover } from "@/components/CustomerAuthPopover";
import { supabase } from "@/integrations/supabase/client";
import { CartDrawer } from "@/contexts/CartContext";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Definição dos links de navegação para reutilização
const navLinks = [
    { to: "/aparelhos", label: "Aparelhos", icon: Smartphone },
    { to: "/acessorios", label: "Acessórios", icon: Tag },
    { to: "/promocoes", label: "Promoções", icon: MessageCircle },
];

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, employeeProfile } = useAuth(); // Autenticação do Admin
    const {
        isLoggedIn,
        getGreeting,
        logout: customerLogout,
    } = useCustomerAuth(); // Autenticação do Cliente

    const isActive = (path: string) => location.pathname === path;
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para o menu hamburguer

    const handleAdminLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* --- 1. Menu Hamburguer (MOBILE) e Logo --- */}
                <div className="flex items-center space-x-2">
                    {/* Botão do Hamburguer (Sheet Trigger) */}
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>

                        {/* Conteúdo do Menu Lateral */}
                        <SheetContent side="left" className="w-64 sm:w-80">
                            <SheetHeader>
                                <SheetTitle className="flex items-center space-x-2">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                    <span>BV Celular</span>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col mt-6 space-y-2">
                                {navLinks.map((link) => (
                                    <Button
                                        key={link.to}
                                        variant={
                                            isActive(link.to)
                                                ? "default"
                                                : "ghost"
                                        }
                                        size="lg"
                                        asChild
                                        className="justify-start"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Link
                                            to={link.to}
                                            className="flex items-center gap-3"
                                        >
                                            <link.icon className="h-5 w-5" />
                                            <span>{link.label}</span>
                                        </Link>
                                    </Button>
                                ))}

                                <Separator className="my-4" />

                                {/* Se o Admin estiver logado, mostra o link do Painel no menu */}
                                {user && (
                                    <Button
                                        variant={
                                            isActive("/admin")
                                                ? "default"
                                                : "ghost"
                                        }
                                        size="lg"
                                        asChild
                                        className="justify-start"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Link
                                            to="/admin"
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <ShieldCheck className="h-5 w-5" />
                                            <span>Painel Administrativo</span>
                                        </Link>
                                    </Button>
                                )}

                                {/* Saudação e Logout do Cliente (para contexto mobile) */}
                                {isLoggedIn && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium mb-2">
                                            {getGreeting()}!
                                        </p>
                                        <Button
                                            onClick={customerLogout}
                                            variant="outline"
                                            className="w-full justify-start text-destructive"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sair (Cliente)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Título (Sempre visível no Mobile) */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary md:h-8 md:w-8">
                            <Smartphone className="h-6 w-6 text-primary-foreground md:h-5 md:w-5" />
                        </div>
                        <span className="text-xl font-bold text-foreground">
                            BV Celular
                        </span>
                    </Link>
                </div>

                {/* --- 2. Links de Navegação (DESKTOP) --- */}
                <div className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <Button
                            key={link.to}
                            variant={isActive(link.to) ? "default" : "ghost"}
                            size="sm"
                            asChild
                        >
                            <Link
                                to={link.to}
                                className="flex items-center gap-2"
                            >
                                <link.icon className="h-4 w-4" />
                                <span>{link.label}</span>
                            </Link>
                        </Button>
                    ))}
                </div>

                {/* --- 3. Ícones de Ação (Login/Carrinho/Admin) --- */}
                <div className="flex items-center space-x-1">
                    {/* 3.1 Login do Cliente (Popover - Sempre visível) */}
                    <div className="border-r pr-2">
                        <CustomerAuthPopover />
                    </div>

                    {/* 3.2 Botão do Carrinho (Drawer Trigger) --- */}
                    <CartDrawer />

                    {/* 3.3 Admin (Apenas se o Admin estiver logado - Desktop) */}
                    {user ? (
                        <div className="hidden md:flex items-center">
                            <Button
                                variant={
                                    isActive("/admin") ? "default" : "ghost"
                                }
                                size="sm"
                                asChild
                            >
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-2"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Painel</span>
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAdminLogout}
                                className="flex items-center gap-2 text-destructive hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sair (Admin)</span>
                            </Button>
                        </div>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
            {/* <SheetContent/> A linha que causava o erro anterior foi removida */}
        </nav>
    );
};
