//
// === CÓDIGO COMPLETO PARA: src/pages/Aparelhos.tsx ===
//
import { useState, useEffect, useMemo } from "react";
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
import { ProductFilters } from "@/components/ProductFilters";
import { EmptyState } from "@/components/EmptyState";
import { Filter, SearchX, ArrowUpDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Aparelhos = () => {
    const [searchParams] = useSearchParams();
    const queryFromUrl = searchParams.get("q") || "";

    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [sortOrder, setSortOrder] = useState<string>("newest"); // Estado da ordenação

    // Busca inicial
    const { data: allProducts, isLoading } = useQuery<Product[]>({
        queryKey: ["products", "aparelho", queryFromUrl],
        queryFn: () => fetchProducts({ category: "aparelho", q: queryFromUrl }),
    });

    // Lógica de Ordenação
    const sortedProducts = useMemo(() => {
        if (!filteredProducts) return [];
        const products = [...filteredProducts]; // Cria cópia para não mutar

        switch (sortOrder) {
            case "low_price":
                return products.sort((a, b) => a.price - b.price);
            case "high_price":
                return products.sort((a, b) => b.price - a.price);
            case "newest":
            default:
                // Como não temos created_at explícito no tipo Omit, usamos id ou ordem de chegada
                // Mas o fetchAllProducts já traz ordenado por created_at desc do banco
                // Se quisermos garantir no front, precisaríamos do campo created_at no tipo Product
                return products;
        }
    }, [filteredProducts, sortOrder]);

    // Atualiza lista inicial
    useEffect(() => {
        if (allProducts) setFilteredProducts(allProducts);
    }, [allProducts]);

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
            <SEO
                title="Aparelhos e Smartphones"
                description="iPhones, Samsungs e Motorolas com os melhores preços."
            />
            <Navbar />

            <main className="flex-1 container py-8">
                <div className="flex flex-col md:flex-row items-start gap-8 animate-fade-in">
                    {/* SIDEBAR */}
                    {!isLoading && allProducts && (
                        <aside className="w-full md:w-64 flex-shrink-0 animate-slide-up">
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

                    <div className="flex-1 w-full">
                        {/* TOPO DA LISTA */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Aparelhos
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {queryFromUrl
                                        ? `Resultados para "${queryFromUrl}"`
                                        : `${sortedProducts.length} produtos encontrados`}
                                </p>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                {/* Botão Filtro Mobile */}
                                <Button
                                    variant="outline"
                                    className="md:hidden flex-1"
                                    onClick={() => setIsMobileFiltersOpen(true)}
                                >
                                    <Filter className="mr-2 h-4 w-4" /> Filtros
                                </Button>

                                {/* Select de Ordenação */}
                                <Select
                                    value={sortOrder}
                                    onValueChange={setSortOrder}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Ordenar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">
                                            Mais Recentes
                                        </SelectItem>
                                        <SelectItem value="low_price">
                                            Menor Preço
                                        </SelectItem>
                                        <SelectItem value="high_price">
                                            Maior Preço
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* CONTEÚDO */}
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
                        ) : sortedProducts.length === 0 ? (
                            <EmptyState
                                icon={SearchX}
                                title="Nenhum aparelho encontrado"
                                description="Tente ajustar seus filtros ou buscar por outro termo."
                                actionLabel="Limpar Filtros"
                                actionLink="/aparelhos"
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                                {sortedProducts.map((product) => (
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
