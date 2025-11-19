import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Smartphone,
    Tag,
    ShieldCheck,
    LogOut,
    MessageCircle,
    Menu,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/contexts/AuthContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { CustomerAuthPopover } from "@/components/CustomerAuthPopover";
import { CartDrawer } from "@/components/CartDrawer";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navLinks = [
    { to: "/aparelhos", label: "Aparelhos", icon: Smartphone },
    { to: "/acessorios", label: "Acessórios", icon: Tag },
    { to: "/promocoes", label: "Promoções", icon: MessageCircle },
    { to: "/garantia", label: "Garantia", icon: ShieldCheck },
];

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const adminContext = useContext(AuthContext);
    const employeeProfile = adminContext?.employeeProfile;
    const adminLogout = adminContext?.logout || (async () => {});

    const {
        isLoggedIn: isCustomerLoggedIn,
        getGreeting,
        logout: customerLogout,
    } = useCustomerAuth();

    const isActive = (path: string) => location.pathname === path;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleAdminLogout = async () => {
        await adminLogout();
        navigate("/");
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/aparelhos?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-2 md:gap-4">
                {/* ESQUERDA: Menu Mobile + Logo */}
                <div className="flex items-center">
                    {/* Menu Hamburguer (Só aparece em Mobile/Tablet) */}
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild className="md:hidden mr-2">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="left" className="w-72">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <span>BV Celular</span>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col mt-6 space-y-2">
                                {/* Links Mobile */}
                                {navLinks.map((link) => (
                                    <Button
                                        key={link.to}
                                        variant={
                                            isActive(link.to)
                                                ? "secondary"
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

                                {/* Opções de Conta no Menu Mobile */}
                                {employeeProfile ? (
                                    <>
                                        <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                                            Área Admin
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            asChild
                                            className="justify-start"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Link to="/admin">
                                                <ShieldCheck className="h-5 w-5 mr-3" />{" "}
                                                Painel
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            onClick={handleAdminLogout}
                                            className="justify-start text-destructive"
                                        >
                                            <LogOut className="h-5 w-5 mr-3" />{" "}
                                            Sair (Admin)
                                        </Button>
                                    </>
                                ) : isCustomerLoggedIn ? (
                                    <>
                                        <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                                            {getGreeting()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            onClick={customerLogout}
                                            className="justify-start text-destructive"
                                        >
                                            <LogOut className="h-5 w-5 mr-3" />{" "}
                                            Sair da Conta
                                        </Button>
                                    </>
                                ) : (
                                    <div className="px-2 text-sm text-muted-foreground">
                                        Faça login para ver seus pedidos.
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold hidden min-[360px]:inline-block">
                            BV Celular
                        </span>
                    </Link>
                </div>

                {/* CENTRO: Barra de Pesquisa (Apenas Desktop) */}
                <form
                    onSubmit={handleSearch}
                    className="hidden md:flex flex-1 max-w-sm items-center relative mx-4"
                >
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar produtos..."
                        className="pl-9 w-full bg-muted/50 focus:bg-background transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                {/* DIREITA: Links Desktop + Ações */}
                <div className="flex items-center gap-1 md:gap-2">
                    {/* Links (Apenas Desktop) */}
                    <div className="hidden md:flex items-center gap-1 mr-2">
                        {navLinks.map((link) => (
                            <Button
                                key={link.to}
                                variant={
                                    isActive(link.to) ? "secondary" : "ghost"
                                }
                                size="sm"
                                asChild
                            >
                                <Link to={link.to}>{link.label}</Link>
                            </Button>
                        ))}
                    </div>

                    {/* Busca Mobile (Ícone) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate("/aparelhos")}
                    >
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Buscar</span>
                    </Button>

                    {/* Carrinho (Sempre visível, ícone) */}
                    <CartDrawer />

                    {/* Perfil / Login */}
                    {!employeeProfile && <CustomerAuthPopover />}

                    {/* Admin Actions */}
                    {employeeProfile && (
                        <div className="flex items-center">
                            {/* Desktop: Botão com texto / Mobile: Ícone */}
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="hidden md:flex gap-2"
                            >
                                <Link to="/admin">
                                    <ShieldCheck className="h-4 w-4" /> Painel
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="md:hidden"
                            >
                                <Link to="/admin">
                                    <ShieldCheck className="h-5 w-5" />
                                </Link>
                            </Button>

                            {/* Logout Admin (Apenas Desktop, no mobile fica no menu) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleAdminLogout}
                                className="text-destructive hidden md:flex"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
