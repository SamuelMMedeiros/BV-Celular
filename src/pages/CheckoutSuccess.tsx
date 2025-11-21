import { useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    CheckCircle,
    ShoppingBag,
    ArrowRight,
    MessageCircle,
    Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get("orderId");

    // Se tentar acessar sem ID, manda pra home
    useEffect(() => {
        if (!orderId) navigate("/");
    }, [orderId, navigate]);

    if (!orderId) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <main className="flex-1 container flex items-center justify-center py-12 animate-fade-in">
                <Card className="w-full max-w-lg text-center shadow-xl border-t-4 border-t-green-500">
                    <CardContent className="pt-12 pb-8 px-6 space-y-6">
                        {/* Ícone Animado */}
                        <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Pedido Realizado!
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Obrigado pela preferência.
                            </p>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-1">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">
                                Número do Pedido
                            </p>
                            <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                                #{orderId.split("-")[0].toUpperCase()}
                            </p>
                        </div>

                        <div className="space-y-4 text-left">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" /> O que
                                acontece agora?
                            </h3>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex gap-3">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                        1
                                    </span>
                                    <span>
                                        A loja recebeu seu pedido e está
                                        verificando o estoque e pagamento.
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                        2
                                    </span>
                                    <span>
                                        Se escolheu <strong>WhatsApp</strong>,
                                        finalize a negociação por lá. Se pagou{" "}
                                        <strong>Online</strong>, aguarde a
                                        aprovação.
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                        3
                                    </span>
                                    <span>
                                        Você será notificado quando o pedido
                                        sair para entrega ou estiver pronto para
                                        retirada.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <Separator />

                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                asChild
                                size="lg"
                                className="w-full h-12 text-base"
                            >
                                <Link to="/minha-conta">
                                    Acompanhar Meus Pedidos{" "}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full h-12 text-base"
                            >
                                <Link to="/aparelhos">
                                    <ShoppingBag className="mr-2 h-4 w-4" />{" "}
                                    Continuar Comprando
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutSuccess;
