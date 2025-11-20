import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { fetchPromotions, fetchAllProducts } from "@/lib/api";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Smartphone,
    Headphones,
    ShieldCheck,
    Truck,
    CreditCard,
    Star,
    MapPin,
    Tag,
    Sparkles,
} from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryBar } from "@/components/CategoryBar";
import { EmptyState } from "@/components/EmptyState";
import { SearchX } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [filterQuery, setFilterQuery] = useState("");

    const { data: promotions, isLoading: loadingPromos } = useQuery<Product[]>({
        queryKey: ["promotions-home"],
        queryFn: () => fetchPromotions(),
    });

    const { data: allProducts, isLoading: loadingAll } = useQuery<Product[]>({
        queryKey: ["products-home"],
        queryFn: fetchAllProducts,
    });

    const handleCategorySelect = (catId: string, query?: string) => {
        setActiveCategory(catId);
        setFilterQuery(query || "");
    };

    const filteredProducts =
        allProducts?.filter((p) => {
            if (activeCategory === "all") return true;
            const search = filterQuery.toLowerCase();
            const nameMatch = p.name.toLowerCase().includes(search);
            const descMatch = p.description?.toLowerCase().includes(search);
            if (activeCategory === "smartphones")
                return p.category === "aparelho";
            return nameMatch || descMatch;
        }) || [];

    const newPhones = allProducts
        ? allProducts
              .filter((p) => p.category === "aparelho" && !p.isPromotion)
              .slice(0, 8)
        : [];

    const newAccessories = allProducts
        ? allProducts
              .filter((p) => p.category === "acessorio" && !p.isPromotion)
              .slice(0, 8)
        : [];

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-x-hidden font-sans">
            <Navbar />

            <CategoryBar
                selectedCategory={activeCategory}
                onSelectCategory={handleCategorySelect}
            />

            <main className="flex-1">
                {activeCategory !== "all" ? (
                    <section className="container py-8 min-h-[60vh] animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold capitalize">
                                {activeCategory === "smartwatch"
                                    ? "Smartwatches"
                                    : activeCategory === "cases"
                                    ? "Capas e Películas"
                                    : activeCategory === "audio"
                                    ? "Áudio e Fones"
                                    : activeCategory}
                            </h2>
                            <p className="text-muted-foreground">
                                {filteredProducts.length} resultados
                            </p>
                        </div>

                        {loadingAll ? (
                            <ProductListSkeleton count={8} />
                        ) : filteredProducts.length === 0 ? (
                            <EmptyState
                                icon={SearchX}
                                title="Nenhum produto encontrado"
                                description={`Não encontramos itens para "${activeCategory}".`}
                                actionLabel="Voltar para o Início"
                                actionLink="/"
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-slide-up">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        <HeroBanner />

                        {/* TRUST BAR */}
                        <section className="bg-muted/30 border-y border-border/50 py-6">
                            <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                                        <Truck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">
                                            Entrega Rápida
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Para toda a região
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">
                                            Garantia Oficial
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Em todos os produtos
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">
                                            Parcelamento
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Até 12x no cartão
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full">
                                        <Star className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">
                                            Melhor Avaliação
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Líder em satisfação
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* BENTO GRID (CATEGORIAS) */}
                        <section className="container py-16">
                            <h2 className="text-2xl md:text-3xl font-bold mb-8">
                                Navegue por Categorias
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[400px]">
                                {/* Card Grande - Aparelhos */}
                                <Link
                                    to="/aparelhos"
                                    className="group relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800 md:col-span-2 min-h-[200px] transition-all hover:shadow-lg"
                                >
                                    <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                                        <div>
                                            <span className="text-sm font-bold uppercase tracking-wider text-blue-600 bg-white/90 px-3 py-1 rounded-full w-fit mb-2 block">
                                                Destaques
                                            </span>
                                            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
                                                Smartphones
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-300 max-w-xs">
                                                A melhor tecnologia da Apple,
                                                Samsung e Xiaomi em suas mãos.
                                            </p>
                                        </div>
                                        {/* Botão com Hover Colorido */}
                                        <Button
                                            variant="secondary"
                                            className="w-fit rounded-full transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white"
                                        >
                                            Ver Aparelhos{" "}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Smartphone className="absolute -right-10 -bottom-10 h-64 w-64 text-slate-200 dark:text-slate-700 rotate-12 transition-transform group-hover:scale-110 duration-500" />
                                </Link>

                                <div className="grid grid-rows-2 gap-6">
                                    {/* Card Pequeno - Acessórios */}
                                    <Link
                                        to="/acessorios"
                                        className="group relative overflow-hidden rounded-2xl bg-purple-50 dark:bg-slate-800 min-h-[180px] transition-all hover:shadow-md"
                                    >
                                        <div className="absolute inset-0 p-6 z-10 flex flex-col justify-center items-start">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                Acessórios
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                                Capas, películas e áudio.
                                            </p>
                                            {/* Botão com Hover Colorido */}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="rounded-full transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white"
                                            >
                                                Ver Coleção
                                            </Button>
                                        </div>
                                        <Headphones className="absolute -right-4 -bottom-4 h-32 w-32 text-purple-200 dark:text-slate-700 transition-transform group-hover:-rotate-12" />
                                    </Link>

                                    {/* Card Pequeno - SUBSTITUÍDO: Garantia -> Promoções/Ofertas */}
                                    <Link
                                        to="/promocoes"
                                        className="group relative overflow-hidden rounded-2xl bg-amber-50 dark:bg-slate-800 min-h-[180px] transition-all hover:shadow-md"
                                    >
                                        <div className="absolute inset-0 p-6 z-10 flex flex-col justify-center items-start">
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                Ofertas
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                                Descontos imperdíveis hoje.
                                            </p>
                                            {/* Botão com Hover Colorido */}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="rounded-full transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white"
                                            >
                                                Conferir
                                            </Button>
                                        </div>
                                        <Sparkles className="absolute -right-4 -bottom-4 h-32 w-32 text-amber-200 dark:text-slate-700 transition-transform group-hover:scale-110" />
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* PROMOÇÕES */}
                        {promotions && promotions.length > 0 && (
                            <section className="container py-8">
                                <div className="flex items-end justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                            🔥 Ofertas Relâmpago
                                        </h2>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        asChild
                                        className="text-primary"
                                    >
                                        <Link to="/promocoes">Ver todas</Link>
                                    </Button>
                                </div>

                                {loadingPromos ? (
                                    <ProductListSkeleton count={4} />
                                ) : (
                                    <Carousel
                                        opts={{ align: "start" }}
                                        className="w-full"
                                    >
                                        <CarouselContent className="-ml-4 pb-4">
                                            {promotions?.map((product) => (
                                                <CarouselItem
                                                    key={product.id}
                                                    className="pl-4 md:basis-1/2 lg:basis-1/4 h-full"
                                                >
                                                    <div className="h-full p-1">
                                                        <ProductCard
                                                            product={product}
                                                        />
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious className="hidden md:flex -left-4" />
                                        <CarouselNext className="hidden md:flex -right-4" />
                                    </Carousel>
                                )}
                            </section>
                        )}

                        {/* NOVIDADES (ABAS) */}
                        <section className="bg-muted/30 py-20 mt-8">
                            <div className="container">
                                <div className="text-center mb-12">
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                        Chegou Agora
                                    </h2>
                                    <p className="text-muted-foreground max-w-2xl mx-auto">
                                        Confira os últimos lançamentos em
                                        tecnologia.
                                    </p>
                                </div>

                                <Tabs defaultValue="phones" className="w-full">
                                    <div className="flex justify-center mb-10">
                                        <TabsList className="h-14 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border">
                                            <TabsTrigger
                                                value="phones"
                                                className="rounded-full h-12 px-8 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Smartphones
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="accessories"
                                                className="rounded-full h-12 px-8 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Acessórios
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent
                                        value="phones"
                                        className="animate-fade-in"
                                    >
                                        {loadingAll ? (
                                            <ProductListSkeleton count={8} />
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                                                {newPhones.map((product) => (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                    />
                                                ))}
                                                {newPhones.length === 0 && (
                                                    <p className="col-span-4 text-center py-8 text-muted-foreground">
                                                        Nenhum aparelho novo no
                                                        momento.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent
                                        value="accessories"
                                        className="animate-fade-in"
                                    >
                                        {loadingAll ? (
                                            <ProductListSkeleton count={8} />
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                                                {newAccessories.map(
                                                    (product) => (
                                                        <ProductCard
                                                            key={product.id}
                                                            product={product}
                                                        />
                                                    )
                                                )}
                                                {newAccessories.length ===
                                                    0 && (
                                                    <p className="col-span-4 text-center py-8 text-muted-foreground">
                                                        Nenhum acessório novo no
                                                        momento.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                <div className="mt-16 text-center">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="rounded-full px-8 h-12 border-2"
                                        asChild
                                    >
                                        <Link to="/aparelhos">
                                            Explorar Catálogo Completo
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* BANNER ATENDIMENTO */}
                        <section className="container py-20">
                            <div className="relative bg-slate-900 rounded-[2rem] p-8 md:p-20 overflow-hidden text-center md:text-left">
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="space-y-6 max-w-2xl">
                                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                            Ainda com dúvidas sobre qual
                                            escolher?
                                        </h2>
                                        <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                                            Não compre no escuro. Chame nossa
                                            equipe no WhatsApp e receba um
                                            atendimento personalizado com fotos
                                            e vídeos reais do produto.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                                            <Button
                                                size="lg"
                                                className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-lg font-bold shadow-lg hover:scale-105 transition-transform"
                                            >
                                                Falar com Consultor
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductListSkeleton = ({ count }: { count: number }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-4">
                <Skeleton className="h-80 w-full rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

export default Index;
