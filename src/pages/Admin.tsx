import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Store, Users, Contact } from "lucide-react";
import { useAuth } from "@/hooks/useAuthAdmin"; // <-- CORREÇÃO DA IMPORTAÇÃO
import { Link } from "react-router-dom";

const Admin = () => {
    const { employeeProfile } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">
                        Painel Administrativo
                    </h1>
                    <p className="text-muted-foreground">
                        Logado como: {employeeProfile?.email}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6 transition-all hover:shadow-hover">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                            <Package className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">Produtos</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Cadastre aparelhos e acessórios
                        </p>
                        <Button className="w-full" asChild>
                            <Link to="/admin/products">Gerenciar Produtos</Link>
                        </Button>
                    </Card>

                    <Card className="p-6 transition-all hover:shadow-hover">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                            <Store className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">Lojas</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Adicione e configure suas lojas
                        </p>
                        <Button className="w-full" asChild>
                            <Link to="/admin/stores">Gerenciar Lojas</Link>
                        </Button>
                    </Card>

                    <Card className="p-6 transition-all hover:shadow-hover">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                            <Users className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">
                            Funcionários
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Gerencie equipe e permissões
                        </p>
                        <Button className="w-full" asChild>
                            <Link to="/admin/employees">
                                Gerenciar Funcionários
                            </Link>
                        </Button>
                    </Card>

                    <Card className="p-6 transition-all hover:shadow-hover">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                            <Contact className="h-6 w-6 text-accent-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">Clientes</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Exporte dados de clientes cadastrados
                        </p>
                        <Button className="w-full" asChild>
                            <Link to="/admin/clients">Gerenciar Clientes</Link>
                        </Button>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Admin;
