//
// === CÓDIGO COMPLETO PARA: src/components/Navbar.tsx ===
//
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Smartphone, Tag, ShieldCheck, LogOut, User } from "lucide-react"; // 1. Importar User
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext"; // 2. Importar useAuth
import { supabase } from "@/integrations/supabase/client"; // 3. Importar supabase

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // 4. Pegar 'user' E 'employeeProfile'
    const { user, employeeProfile } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    // 5. Adicionar função de Logout
    const handleLogout = async () => {
        // Faz o logout no Supabase
        await supabase.auth.signOut();
        // Redireciona para a Home
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
                    {/* --- Botões Públicos (Sempre visíveis) --- */}
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
                        variant={isActive("/promocoes") ? "default" : "ghost"}
                        size="sm"
                        asChild
                    >
                        <Link
                            to="/promocoes"
                            className="flex items-center gap-2"
                        >
                            <Tag className="h-4 w-4" />
                            <span className="hidden sm:inline">Promoções</span>
                        </Link>
                    </Button>

                    {/* --- 6. Lógica Condicional para Admin e Logout --- */}
                    {user ? (
                        <>
                            {/* 7. Adicionar o nome do usuário */}
                            <div className="flex items-center gap-2 border-r pr-2 ml-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="hidden text-sm font-medium sm:inline">
                                    {/* Usa o primeiro nome do perfil, ou 'Admin' como fallback */}
                                    {employeeProfile?.name.split(" ")[0] ||
                                        "Admin"}
                                </span>
                            </div>

                            {/* Mostra "Admin" se o usuário estiver logado */}
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

                            {/* Mostra "Sair" se o usuário estiver logado */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-destructive hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Não mostra nada se o usuário não estiver logado */}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
