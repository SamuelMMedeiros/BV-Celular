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
import { ModeToggle } from "@/components/Mode-Toggle";
import { NotificationButton } from "@/components/NotificationButton";
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
];

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Contexto de Admin/Funcionário
    const adminContext = useContext(AuthContext);
    const employeeProfile = adminContext?.employeeProfile;
    const adminLogout = adminContext?.logout || (async () => {});

    // Contexto de Cliente
    const {
        isLoggedIn: isCustomerLoggedIn,
        getGreeting,
        logout: customerLogout,
    } = useCustomerAuth();

    const isActive = (path: string) => location.pathname === path;

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
            <div className="container flex h-16 items-center justify-between gap-4">
                {/* --- BLOCO ESQUERDA: MENU MOBILE & LOGO --- */}
                <div className="flex items-center gap-2 md:gap-6">
                    {/* Menu Mobile (Hambúrguer) */}
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
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
                                {/* Links Mobile - Apenas para Clientes */}
                                {!employeeProfile &&
                                    navLinks.map((link) => (
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

                                {/* Lógica de Conta no Mobile */}
                                {employeeProfile ? (
                                    <>
                                        <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                                            {employeeProfile.name} (Admin)
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
                                                Painel Admin
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            onClick={() => {
                                                handleAdminLogout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="justify-start text-destructive"
                                        >
                                            <LogOut className="h-5 w-5 mr-3" />{" "}
                                            Sair
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {isCustomerLoggedIn ? (
                                            <>
                                                <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                                                    {getGreeting()}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="lg"
                                                    asChild
                                                    className="justify-start"
                                                    onClick={() =>
                                                        setIsMenuOpen(false)
                                                    }
                                                >
                                                    <Link to="/minha-conta">
                                                        Minha Conta
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="lg"
                                                    onClick={() => {
                                                        customerLogout();
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="justify-start text-destructive"
                                                >
                                                    <LogOut className="h-5 w-5 mr-3" />{" "}
                                                    Sair
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="default"
                                                size="lg"
                                                asChild
                                                className="justify-start w-full"
                                                onClick={() =>
                                                    setIsMenuOpen(false)
                                                }
                                            >
                                                <Link to="/login">
                                                    Fazer Login / Cadastro
                                                </Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 transition-opacity hover:opacity-90"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-sm">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold hidden min-[360px]:inline-block tracking-tight">
                            BV Celular
                        </span>
                    </Link>

                    {/* Links Desktop - Apenas para Clientes */}
                    {!employeeProfile && (
                        <div className="hidden md:flex items-center gap-1 ml-4">
                            {navLinks.map((link) => (
                                <Button
                                    key={link.to}
                                    variant={
                                        isActive(link.to)
                                            ? "secondary"
                                            : "ghost"
                                    }
                                    size="sm"
                                    asChild
                                    className="text-sm font-medium"
                                >
                                    <Link to={link.to}>{link.label}</Link>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- BLOCO CENTRO: BUSCA (Apenas Clientes) --- */}
                {!employeeProfile && (
                    <div className="hidden md:flex flex-1 max-w-md mx-4">
                        <form
                            onSubmit={handleSearch}
                            className="w-full relative"
                        >
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="O que você procura hoje?"
                                className="w-full pl-9 bg-muted/40 focus:bg-background border-muted-foreground/20 rounded-full transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>
                )}

                {/* --- BLOCO DIREITA: AÇÕES --- */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Botões Universais (Aparecem para todos) */}
                    <NotificationButton />
                    <ModeToggle />

                    {/* Se for ADMIN */}
                    {employeeProfile ? (
                        <div className="flex items-center gap-2 ml-2 border-l pl-4">
                            <span className="text-sm font-medium hidden lg:inline-block truncate max-w-[100px]">
                                {employeeProfile.name}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="hidden sm:flex gap-2"
                            >
                                <Link to="/admin">
                                    <ShieldCheck className="h-4 w-4" /> Painel
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleAdminLogout}
                                title="Sair"
                            >
                                <LogOut className="h-5 w-5 text-destructive" />
                            </Button>
                        </div>
                    ) : (
                        // Se for CLIENTE (Visitante ou Logado)
                        <>
                            {/* Busca Mobile */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => navigate("/aparelhos")}
                            >
                                <Search className="h-5 w-5" />
                            </Button>

                            {/* Carrinho */}
                            <CartDrawer />

                            {/* Minha Conta / Login */}
                            <div className="hidden sm:block ml-1">
                                <CustomerAuthPopover />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
