import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Smartphone, Tag, Zap, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Aparelhos de Qualidade",
      description: "Smartphones e tablets das melhores marcas"
    },
    {
      icon: Tag,
      title: "Promoções Exclusivas",
      description: "Ofertas imperdíveis todos os dias"
    },
    {
      icon: Zap,
      title: "Entrega Rápida",
      description: "Receba seu produto com agilidade"
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description: "Garantia e suporte em todas as compras"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Bem-vindo à{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Martins Tech
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Encontre os melhores aparelhos e promoções em tecnologia. 
              Qualidade, preço justo e atendimento excepcional.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="group">
                <Link to="/aparelhos" className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Ver Aparelhos
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="group">
                <Link to="/promocoes" className="flex items-center gap-2">
                  <Tag className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Promoções
                  <TrendingUp className="h-4 w-4 text-primary" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container pb-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="group rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-hover">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-6 w-6 text-accent-foreground transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 Loja Martins Tech. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
