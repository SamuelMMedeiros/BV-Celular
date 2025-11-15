import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Headset } from "lucide-react"; // Usando Headset para acessórios

// Componente para o estado de Loading
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

const Acessorios = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Debounce para a busca: espera 500ms após o usuário parar de digitar
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // Busca os dados usando React Query (Filtrando por 'acessorio')
    const {
        data: products,
        isLoading,
        isError,
    } = useQuery<Product[]>({
        queryKey: ["products", "acessorios", debouncedSearchTerm],
        // ALTERAÇÃO AQUI: categoria é 'acessorio'
        queryFn: () =>
            fetchProducts({
                q: debouncedSearchTerm,
                category: "acessorio",
                isPromotion: false,
            }),
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                        <Headset className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Acessórios
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tudo o que você precisa para complementar seu
                            aparelho.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-8 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar por cabo, película ou fone..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Products Grid */}
                {isLoading && <ProductGridSkeleton />}

                {isError && (
                    <div className="py-20 text-center">
                        <p className="text-destructive">
                            Erro ao carregar os acessórios.
                        </p>
                    </div>
                )}

                {!isLoading && !isError && products && (
                    <>
                        {products.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
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
                                    Nenhum acessório encontrado.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Acessorios;
