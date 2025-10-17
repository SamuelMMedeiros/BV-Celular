import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, Store, Users } from "lucide-react";

const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie produtos, lojas e funcionários</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 transition-all hover:shadow-hover">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <Package className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Produtos</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Cadastre e gerencie aparelhos e acessórios
            </p>
            <Button className="w-full">Gerenciar Produtos</Button>
          </Card>

          <Card className="p-6 transition-all hover:shadow-hover">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <Store className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Lojas</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Adicione e configure suas lojas
            </p>
            <Button className="w-full">Gerenciar Lojas</Button>
          </Card>

          <Card className="p-6 transition-all hover:shadow-hover">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Funcionários</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Gerencie equipe e permissões
            </p>
            <Button className="w-full">Gerenciar Funcionários</Button>
          </Card>
        </div>

        <Card className="mt-6 border-primary/20 bg-accent p-6">
          <h3 className="mb-2 text-lg font-semibold text-accent-foreground">
            Autenticação Necessária
          </h3>
          <p className="text-sm text-muted-foreground">
            O painel administrativo completo estará disponível após implementar a autenticação com Lovable Cloud.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
