import { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Smartphone,
    Tag,
    ShieldCheck,
    LogOut,
    MessageCircle,
    Menu,
    ShoppingCart,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // <-- IMPORTAR INPUT
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
];

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState(""); // Estado da busca

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

    // --- FUNÇÃO DE BUSCA ---
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Redireciona para /aparelhos com o parametro ?q=
            navigate(`/aparelhos?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-4">
                {/* Logo e Menu Mobile */}
                <div className="flex items-center space-x-2 shrink-0">
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 sm:w-80">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-primary" />{" "}
                                    BV Celular
                                </SheetTitle>
                            </SheetHeader>
                            {/* Conteúdo do Menu Mobile (simplificado aqui para caber) */}
                            <div className="mt-6 space-y-2">
                                {navLinks.map((link) => (
                                    <Button
                                        key={link.to}
                                        variant="ghost"
                                        asChild
                                        className="justify-start w-full"
                                    >
                                        <Link
                                            to={link.to}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold hidden sm:inline">
                            BV Celular
                        </span>
                    </Link>
                </div>

                {/* --- BARRA DE PESQUISA (DESKTOP/TABLET) --- */}
                <form
                    onSubmit={handleSearch}
                    className="hidden md:flex flex-1 max-w-sm items-center relative"
                >
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar produtos..."
                        className="pl-9 w-full bg-muted/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                {/* Links Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <Button
                            key={link.to}
                            variant={isActive(link.to) ? "default" : "ghost"}
                            size="sm"
                            asChild
                        >
                            <Link to={link.to}>{link.label}</Link>
                        </Button>
                    ))}
                </div>

                {/* Ações */}
                <div className="flex items-center space-x-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate("/aparelhos")}
                    >
                        <Search className="h-5 w-5" />{" "}
                        {/* Ícone de busca mobile */}
                    </Button>

                    {!employeeProfile && (
                        <div className="border-r pr-2">
                            <CustomerAuthPopover />
                        </div>
                    )}
                    <CartDrawer />

                    {employeeProfile && (
                        <div className="hidden md:flex items-center gap-2 ml-2">
                            <Link to="/admin">
                                <Button variant="outline" size="sm">
                                    Painel
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleAdminLogout}
                                className="text-destructive"
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
