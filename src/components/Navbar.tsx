/* eslint-disable react-hooks/rules-of-hooks */
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Smartphone,
    Tag,
    ShieldCheck,
    LogOut,
    MessageCircle,
    ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext"; // <<--- CORREÇÃO 1: Importa o hook do Context
import { CustomerAuthPopover } from "@/components/CustomerAuthPopover"; // <<--- CORREÇÃO 2: Importa o componente Popover
import { supabase } from "@/integrations/supabase/client";
import { CartDrawer } from "@/contexts/CartContext";

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, employeeProfile } = useAuth();
    const { isLoggedIn, getGreeting } = useCustomerAuth();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                        <Smartphone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-foreground">
                        BV Celular
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* --- Botões Públicos --- */}
                    <Button
                        variant={isActive("/aparelhos") ? "default" : "ghost"}
                        size="sm"
                        asChild
                    >
                        <Link
                            to="/aparelhos"
                            className="flex items-center gap-2"
                        >
                            <Smartphone className="h-4 w-4" />
                            <span className="hidden sm:inline">Aparelhos</span>
                        </Link>
                    </Button>

                    <Button
                        variant={isActive("/acessorios") ? "default" : "ghost"}
                        size="sm"
                        asChild
                    >
                        <Link
                            to="/acessorios"
                            className="flex items-center gap-2"
                        >
                            <Tag className="h-4 w-4" />
                            <span className="hidden sm:inline">Acessórios</span>
                        </Link>
                    </Button>

                    <Button
                        variant={isActive("/promocoes") ? "default" : "ghost"}
                        size="sm"
                        asChild
                    >
                        <Link
                            to="/promocoes"
                            className="flex items-center gap-2"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Promoções</span>
                        </Link>
                    </Button>

                    {/* --- Login do Cliente e Saudação --- */}
                    {isLoggedIn ? (
                        <div className="flex items-center space-x-2 border-r pr-3 ml-2">
                            <span className="text-sm font-medium hidden sm:inline">
                                {getGreeting()}
                            </span>
                            <Button
                                onClick={useCustomerAuth().logout}
                                variant="ghost"
                                size="icon"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="ml-2 border-r pr-3">
                            <CustomerAuthPopover />
                        </div>
                    )}

                    {/* --- Botão do Carrinho (Drawer Trigger) --- */}
                    <CartDrawer />

                    {/* --- Lógica Condicional para Admin e Logout --- */}
                    {user ? (
                        <>
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
                                    <span className="hidden sm:inline">
                                        Painel
                                    </span>
                                </Link>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-destructive hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Sair (Admin)
                                </span>
                            </Button>
                        </>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        </nav>
    );
};
