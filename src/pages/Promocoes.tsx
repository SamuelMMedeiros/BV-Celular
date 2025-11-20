import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { fetchPromotions } from "@/lib/api";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { EmptyState } from "@/components/EmptyState"; // <-- IMPORTAR
import { Tag } from "lucide-react";

const Promocoes = () => {
    const { data: promotions, isLoading } = useQuery<Product[]>({
        queryKey: ["promotions-page"],
        queryFn: () => fetchPromotions(),
    });

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
            <SEO
                title="Promoções e Ofertas"
                description="Aproveite nossos descontos em smartphones e acessórios."
            />
            <Navbar />

            <main className="flex-1 container py-8 animate-fade-in">
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center md:justify-start gap-2">
                        <Tag className="h-8 w-8 text-primary" />
                        Ofertas Especiais
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Preços baixos por tempo limitado. Aproveite!
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-64 w-full rounded-xl" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : !promotions || promotions.length === 0 ? (
                    // --- EMPTY STATE ---
                    <EmptyState
                        icon={Tag}
                        title="Nenhuma promoção ativa"
                        description="No momento não temos itens em oferta. Confira nosso catálogo completo."
                        actionLabel="Ver Todos os Produtos"
                        actionLink="/aparelhos"
                    />
                ) : (
                    // --- LISTA COM ANIMAÇÃO ---
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-slide-up">
                        {promotions.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Promocoes;
