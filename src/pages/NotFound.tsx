import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WifiOff, Home, Smartphone, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const NotFound = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Elementos de Fundo Decorativos (Círculos de "Sinal") */}
                <div className="absolute pointer-events-none flex items-center justify-center opacity-10 dark:opacity-5">
                    <div
                        className="w-[300px] h-[300px] border-4 border-primary rounded-full animate-ping absolute"
                        style={{ animationDuration: "3s" }}
                    />
                    <div
                        className="w-[500px] h-[500px] border-2 border-primary rounded-full animate-ping absolute"
                        style={{
                            animationDuration: "3s",
                            animationDelay: "0.5s",
                        }}
                    />
                    <div
                        className="w-[800px] h-[800px] border border-primary rounded-full animate-ping absolute"
                        style={{
                            animationDuration: "3s",
                            animationDelay: "1s",
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-lg w-full text-center space-y-8">
                    {/* Ícone Animado */}
                    <div className="mx-auto w-32 h-32 bg-muted rounded-full flex items-center justify-center relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                        <WifiOff className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </div>

                    {/* Textos */}
                    <div className="space-y-4">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-primary">
                            404
                        </h1>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                            Ops! Sem sinal por aqui.
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Parece que você entrou em uma área sem cobertura. A
                            página que você tentou acessar não existe, mudou de
                            endereço ou ficou sem bateria.
                        </p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
                        >
                            <Link to="/">
                                <Home className="mr-2 h-4 w-4" />
                                Voltar para o Início
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 px-8 rounded-full hover:bg-accent"
                        >
                            <Link to="/aparelhos">
                                <Smartphone className="mr-2 h-4 w-4" />
                                Ver Aparelhos
                            </Link>
                        </Button>
                    </div>

                    {/* Sugestão de Busca */}
                    <div className="pt-8 border-t border-border/50">
                        <p className="text-sm text-muted-foreground mb-4">
                            Estava procurando algo específico?
                        </p>
                        <div className="relative max-w-xs mx-auto">
                            <Link to="/aparelhos">
                                <div className="flex items-center justify-center gap-2 text-primary font-medium hover:underline cursor-pointer">
                                    <Search className="h-4 w-4" />
                                    Ir para a busca avançada
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NotFound;
