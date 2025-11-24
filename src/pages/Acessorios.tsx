/**
 * @title src/pages/Acessorios.tsx
 * @collapsible
 */
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { EmptyState } from "@/components/EmptyState";
// Importa o tipo e a função com filtros (agora contida no api.ts)
import { fetchProducts, ProductFilters as FiltersType } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Filter, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useCallback } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SEO } from "@/components/SEO";

const Acessorios = () => {
    // Define os filtros padrão para a categoria Acessório
    const defaultFilters: FiltersType = useMemo(
        () => ({
            category: "acessorio", // Chave principal de diferenciação
            q: "",
            brands: [],
            // Os campos de specs de aparelho (ram, storage, etc.) são omitidos aqui,
            // mas são limpos para garantir que a consulta API não os use.
            ram: [],
            storage: [],
            battery_capacity: [],
            processor_model: [],
        }),
        []
    );

    const [filters, setFilters] = useState<FiltersType>(defaultFilters);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Calcula a chave de query baseada nos filtros para refetch dinâmico
    const queryKey = ["acessorios", filters];

    const { data: products, isLoading } = useQuery({
        queryKey: queryKey,
        queryFn: () => fetchProducts(filters),
    });

    const productsCount = products?.length || 0;

    // Função que aplica os filtros e fecha o modal no mobile
    const handleSetFilters = useCallback(
        (newFilters: FiltersType) => {
            setFilters(newFilters);
            if (isSheetOpen) {
                setIsSheetOpen(false);
            }
        },
        [isSheetOpen]
    );

    const renderProductList = () => {
        if (isLoading) {
            return Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
            ));
        }

        if (productsCount === 0) {
            return (
                <div className="lg:col-span-3">
                    <EmptyState
                        icon={Headphones}
                        title="Nenhum Acessório Encontrado"
                        description="Tente ajustar os filtros ou pesquisar por outro termo."
                    />
                </div>
            );
        }

        return products?.map((product) => (
            <ProductCard key={product.id} product={product} />
        ));
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO
                title="Acessórios - BV Celular"
                description="Encontre acessórios essenciais como cases, películas, fones e carregadores."
            />
            <Navbar />
            <main className="container py-8 flex-1">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Headphones className="h-7 w-7 text-primary" />{" "}
                        Acessórios
                    </h1>
                    <span className="text-lg font-medium text-muted-foreground">
                        {productsCount} resultado
                        {productsCount !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filtros para Desktop */}
                    <aside className="hidden lg:block lg:col-span-1">
                        <ProductFilters
                            currentFilters={filters}
                            setFilters={handleSetFilters}
                            category="acessorio" // Passa a categoria correta para o filtro
                        />
                    </aside>

                    {/* Produtos */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {renderProductList()}
                    </div>
                </div>

                {/* Filtros para Mobile */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger
                        asChild
                        className="fixed bottom-4 right-4 z-40 lg:hidden"
                    >
                        <Button className="h-14 w-14 rounded-full shadow-lg">
                            <Filter className="h-6 w-6 mr-1" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[80%] sm:max-w-sm p-0"
                    >
                        <ProductFilters
                            currentFilters={filters}
                            setFilters={handleSetFilters}
                            isMobile={true}
                            setOpen={setIsSheetOpen}
                            category="acessorio" // Passa a categoria correta para o filtro
                        />
                    </SheetContent>
                </Sheet>
            </main>
            <Footer />
        </div>
    );
};

export default Acessorios;
