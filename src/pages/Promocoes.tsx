// src/pages/Promocoes.tsx
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";
import { Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPromotions } from "@/lib/api"; // 1. Importa a nova função
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

// 2. Reutilizamos o mesmo componente de Skeleton da página Aparelhos
const ProductGridSkeleton = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-9 w-full" />
            </div>
        ))}
    </div>
);

const Promocoes = () => {
    // 3. Busca os dados usando React Query
    // Note que a queryKey é diferente: ['products', 'promotions']
    const {
        data: promotions,
        isLoading,
        isError,
    } = useQuery<Product[]>({
        queryKey: ["products", "promotions"],
        queryFn: fetchPromotions, // Usa a nossa nova função
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8">
                {/* Header (Não muda) */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                        <Percent className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Promoções
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Aproveite nossas ofertas especiais
                        </p>
                    </div>
                </div>

                {/* 4. Grid de Promoções Dinâmica */}
                {isLoading && <ProductGridSkeleton />}

                {isError && (
                    <div className="py-20 text-center">
                        <p className="text-destructive">
                            Erro ao carregar as promoções.
                        </p>
                    </div>
                )}

                {!isLoading && !isError && promotions && (
                    <>
                        {promotions.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {promotions.map((product, index) => (
                                    <motion.div
                                        key={product.id} // Use o ID do Supabase
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: index * 0.1,
                                        }}
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <p className="text-muted-foreground">
                                    Nenhuma promoção disponível no momento.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Promocoes;
