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
    Tag,
    Sparkles,
    Headphones,
} from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { SEO } from "@/components/SEO";

const Index = () => {
    // Busca Produtos em Promoção
    const { data: promotions, isLoading: loadingPromos } = useQuery<Product[]>({
        queryKey: ["promotions-home"],
        queryFn: () => fetchPromotions(),
    });

    // Busca Todos os Produtos
    const { data: allProducts, isLoading: loadingAll } = useQuery<Product[]>({
        queryKey: ["products-home"],
        queryFn: fetchAllProducts,
    });

    // Filtra para as seções
    const newPhones = allProducts
        ? allProducts
              .filter((p) => p.category === "aparelho" && !p.isPromotion)
              .slice(0, 4)
        : [];

    const newAccessories = allProducts
        ? allProducts
              .filter((p) => p.category === "acessorio" && !p.isPromotion)
              .slice(0, 4)
        : [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEO title="Início" />
            <Navbar />

            <main className="flex-1">
                {/* 1. Hero Banner (Banners Manuais + Promoções Automáticas) */}
                <HeroBanner />

                {/* 2. Navegação Rápida */}
                <section className="container py-8 md:py-12">
                    {/* Ajustado para grid-cols-3 pois removemos um item */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <CategoryCard
                            icon={Smartphone}
                            title="Celulares"
                            subtitle="Novos e Seminovos"
                            link="/aparelhos"
                            color="bg-blue-100 text-blue-700"
                        />
                        <CategoryCard
                            icon={Headphones}
                            title="Acessórios"
                            subtitle="Audio, Cases e + "
                            link="/acessorios"
                            color="bg-purple-100 text-purple-700"
                        />
                        {/* Botão Garantia REMOVIDO daqui */}
                        <CategoryCard
                            icon={Sparkles}
                            title="Ofertas"
                            subtitle="Descontos Especiais"
                            link="/promocoes"
                            color="bg-amber-100 text-amber-700"
                        />
                    </div>
                </section>

                {/* 3. Seção de Promoções (Carrossel de Produtos) */}
                <section className="container py-8">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                Ofertas Relâmpago ⚡
                            </h2>
                            <p className="text-muted-foreground">
                                Os melhores preços da semana.
                            </p>
                        </div>
                        <Button variant="ghost" asChild>
                            <Link to="/promocoes" className="gap-2">
                                Ver tudo <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    {loadingPromos ? (
                        <ProductListSkeleton count={4} />
                    ) : (
                        <Carousel opts={{ align: "start" }} className="w-full">
                            <CarouselContent className="-ml-4">
                                {promotions?.map((product) => (
                                    <CarouselItem
                                        key={product.id}
                                        className="pl-4 md:basis-1/2 lg:basis-1/4"
                                    >
                                        <ProductCard product={product} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    )}
                </section>

                {/* 4. Seção de Destaques (Abas: Aparelhos vs Acessórios) */}
                <section className="bg-muted/30 py-16">
                    <div className="container">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    Novidades na Loja
                                </h2>
                                <p className="text-muted-foreground mt-1">
                                    Os lançamentos mais recentes.
                                </p>
                            </div>

                            <Button variant="outline" asChild>
                                <Link to="/aparelhos">
                                    Ver Todos os Produtos
                                </Link>
                            </Button>
                        </div>

                        <Tabs defaultValue="phones" className="w-full">
                            <div className="flex justify-center md:justify-start mb-6">
                                <TabsList className="grid w-full max-w-md grid-cols-2">
                                    <TabsTrigger value="phones">
                                        Aparelhos
                                    </TabsTrigger>
                                    <TabsTrigger value="accessories">
                                        Acessórios
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="phones">
                                {loadingAll ? (
                                    <ProductListSkeleton count={4} />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {newPhones.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                            />
                                        ))}
                                        {newPhones.length === 0 && (
                                            <p className="col-span-4 text-center py-8 text-muted-foreground">
                                                Nenhum aparelho novo no momento.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="accessories">
                                {loadingAll ? (
                                    <ProductListSkeleton count={4} />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {newAccessories.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                            />
                                        ))}
                                        {newAccessories.length === 0 && (
                                            <p className="col-span-4 text-center py-8 text-muted-foreground">
                                                Nenhum acessório novo no
                                                momento.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>

                {/* 5. Banner Institucional */}
                <section className="container py-16">
                    <div className="bg-primary rounded-3xl p-8 md:p-16 text-primary-foreground text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                        <div className="space-y-4 max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Precisa de ajuda para escolher?
                            </h2>
                            <p className="text-primary-foreground/80 text-lg">
                                Nossa equipe de especialistas está pronta para
                                te atender no WhatsApp. Tire dúvidas sobre
                                modelos, garantia e formas de pagamento.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="whitespace-nowrap text-lg h-14 px-8 rounded-full shadow-md hover:scale-105 transition-transform"
                        >
                            Falar com Consultor
                        </Button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

// Componente de Card de Categoria
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CategoryCard = ({ icon: Icon, title, subtitle, link, color }: any) => (
    <Link to={link} className="group block">
        <div
            className={`h-full p-6 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1 bg-card`}
        >
            <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}
            >
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
    </Link>
);

// Skeleton de Carregamento
const ProductListSkeleton = ({ count }: { count: number }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

export default Index;
