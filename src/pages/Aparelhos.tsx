import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ProductFilters } from "@/components/ProductFilters"; // <-- IMPORTAR
import { Filter } from "lucide-react"; // Ícone para mobile

const Aparelhos = () => {
    const [searchParams] = useSearchParams();
    const queryFromUrl = searchParams.get("q") || "";

    // Estado para controlar o filtro mobile
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Busca os dados "Brutos" (Todos os aparelhos)
    const { data: allProducts, isLoading } = useQuery<Product[]>({
        queryKey: ["products", "aparelho", queryFromUrl],
        queryFn: () => fetchProducts({ category: "aparelho", q: queryFromUrl }),
    });

    // Estado dos produtos filtrados (Começa igual ao allProducts)
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    // Quando carregar dados novos, atualiza a lista
    useEffect(() => {
        if (allProducts) setFilteredProducts(allProducts);
    }, [allProducts]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Aparelhos e Smartphones"
                description="iPhones, Samsungs e Motorolas com os melhores preços."
            />
            <Navbar />

            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* SIDEBAR DE FILTROS (Esquerda) */}
                    {/* Só renderiza se tiver produtos carregados */}
                    {!isLoading && allProducts && (
                        <aside className="w-full md:w-64 flex-shrink-0">
                            <ProductFilters
                                products={allProducts}
                                onFilterChange={setFilteredProducts}
                                isMobileOpen={isMobileFiltersOpen}
                                onMobileClose={() =>
                                    setIsMobileFiltersOpen(false)
                                }
                            />
                        </aside>
                    )}

                    {/* CONTEÚDO PRINCIPAL (Direita) */}
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Aparelhos
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {queryFromUrl
                                        ? `Resultados para "${queryFromUrl}"`
                                        : `${filteredProducts.length} produtos encontrados`}
                                </p>
                            </div>

                            {/* Botão de Filtro Mobile */}
                            <Button
                                variant="outline"
                                className="md:hidden w-full sm:w-auto"
                                onClick={() => setIsMobileFiltersOpen(true)}
                            >
                                <Filter className="mr-2 h-4 w-4" /> Filtros
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="space-y-4">
                                        <Skeleton className="h-64 w-full rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                                <p className="text-lg text-muted-foreground">
                                    Nenhum produto encontrado com esses filtros.
                                </p>
                                <Button
                                    variant="link"
                                    onClick={() => window.location.reload()}
                                >
                                    Limpar tudo
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Aparelhos;
