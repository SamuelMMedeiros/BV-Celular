//
// === CÓDIGO COMPLETO PARA: src/components/Navbar.tsx ===
//
import { useState, useContext, useEffect, useRef } from "react"; // <-- useRef, useEffect
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Smartphone,
    Tag,
    ShieldCheck,
    LogOut,
    MessageCircle,
    Menu,
    Search,
    History,
    X,
} from "lucide-react"; // <-- Novos ícones
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
import { Card } from "@/components/ui/card"; // <-- Card para o histórico

const navLinks = [
    { to: "/aparelhos", label: "Aparelhos", icon: Smartphone },
    { to: "/acessorios", label: "Acessórios", icon: Tag },
    { to: "/promocoes", label: "Promoções", icon: MessageCircle },
];

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    // --- ESTADOS DO HISTÓRICO DE BUSCA ---
    const [showHistory, setShowHistory] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Carrega histórico ao iniciar
    useEffect(() => {
        const saved = localStorage.getItem("bv_search_history");
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    // Fecha histórico se clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node)
            ) {
                setShowHistory(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const saveToHistory = (query: string) => {
        const newHistory = [
            query,
            ...searchHistory.filter((h) => h !== query),
        ].slice(0, 5); // Max 5 itens
        setSearchHistory(newHistory);
        localStorage.setItem("bv_search_history", JSON.stringify(newHistory));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            saveToHistory(searchQuery.trim());
            setShowHistory(false);
            navigate(`/aparelhos?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleHistoryClick = (term: string) => {
        setSearchQuery(term);
        saveToHistory(term);
        setShowHistory(false);
        navigate(`/aparelhos?q=${encodeURIComponent(term)}`);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem("bv_search_history");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between gap-2 md:gap-4">
                {/* ESQUERDA */}
                <div className="flex items-center">
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
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold hidden min-[360px]:inline-block">
                            BV Celular
                        </span>
                    </Link>
                </div>

                {/* CENTRO: BUSCA INTELIGENTE */}
                {!employeeProfile && (
                    <div
                        className="hidden md:flex flex-1 max-w-sm relative mx-4"
                        ref={searchContainerRef}
                    >
                        <form
                            onSubmit={handleSearch}
                            className="w-full relative"
                        >
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar produtos..."
                                className="pl-9 w-full bg-muted/50 focus:bg-background transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowHistory(true)}
                            />
                        </form>

                        {/* DROPDOWN DE HISTÓRICO */}
                        {showHistory && searchHistory.length > 0 && (
                            <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-2 shadow-xl animate-in fade-in zoom-in-95">
                                <div className="flex justify-between items-center px-2 pb-2 border-b mb-2">
                                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                        <History className="h-3 w-3" /> Recentes
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-[10px] text-destructive"
                                        onClick={clearHistory}
                                    >
                                        Limpar
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    {searchHistory.map((term, i) => (
                                        <button
                                            key={i}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors flex items-center justify-between group"
                                            onClick={() =>
                                                handleHistoryClick(term)
                                            }
                                        >
                                            {term}
                                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* DIREITA */}
                <div className="flex items-center gap-1 md:gap-2">
                    <NotificationButton />
                    <ModeToggle />
                    {!employeeProfile && (
                        <div className="hidden lg:flex items-center gap-1 mr-2">
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
                                >
                                    <Link to={link.to}>{link.label}</Link>
                                </Button>
                            ))}
                        </div>
                    )}
                    {!employeeProfile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => navigate("/aparelhos")}
                        >
                            <Search className="h-5 w-5" />
                            <span className="sr-only">Buscar</span>
                        </Button>
                    )}
                    {!employeeProfile && <CartDrawer />}
                    {!employeeProfile && <CustomerAuthPopover />}
                    {employeeProfile && (
                        <div className="flex items-center">
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
