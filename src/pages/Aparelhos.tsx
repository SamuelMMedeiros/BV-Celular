import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom"; // <-- Importar
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO"; // <-- SEO

const Aparelhos = () => {
    const [searchParams] = useSearchParams();
    const queryFromUrl = searchParams.get("q") || ""; // Pega a busca da URL

    // Estado local para filtros extras (Preço, etc - implementação simples)
    const [priceFilter, setPriceFilter] = useState(0);

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ["products", "aparelho", queryFromUrl],
        queryFn: () => fetchProducts({ category: "aparelho", q: queryFromUrl }),
    });

    // Filtragem local adicional se necessário (ex: preço máximo)
    const filteredProducts = products?.filter((p) => {
        if (priceFilter > 0 && p.price > priceFilter * 100) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Aparelhos e Smartphones"
                description="Confira nossa seleção de iPhones, Samsungs e Motorolas, Redmis, POCOs e Realmes com os melhores preços."
            />
            <Navbar />

            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Aparelhos
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {queryFromUrl
                                ? `Resultados para "${queryFromUrl}"`
                                : "Encontre o smartphone ideal para você."}
                        </p>
                    </div>

                    {/* Filtros Simples */}
                    <div className="flex gap-2 items-center">
                        <span className="text-sm font-medium">Preço máx:</span>
                        <Input
                            type="number"
                            placeholder="R$ 0,00"
                            className="w-32"
                            onChange={(e) =>
                                setPriceFilter(Number(e.target.value))
                            }
                        />
                    </div>
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
                ) : !filteredProducts || filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground">
                            Nenhum aparelho encontrado com esses critérios.
                        </p>
                        <Button
                            variant="link"
                            onClick={() =>
                                (window.location.href = "/aparelhos")
                            }
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Aparelhos;
