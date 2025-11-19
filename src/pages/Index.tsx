/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO PARA: src/pages/Index.tsx ===
//
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
    ShieldCheck,
} from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { Footer } from "@/components/Footer";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
    // Busca Produtos em Promoção
    const { data: promotions, isLoading: loadingPromos } = useQuery<Product[]>({
        queryKey: ["promotions-home"],
        queryFn: () => fetchPromotions(),
    });

    // Busca Todos os Produtos (para seção de Novidades/Destaques)
    // Limitaremos a exibição na interface, mas a query traz tudo
    const { data: allProducts, isLoading: loadingAll } = useQuery<Product[]>({
        queryKey: ["products-home"],
        queryFn: fetchAllProducts,
    });

    // Filtra as novidades (simulação: pega os primeiros 8 produtos não promocionais)
    const newArrivals = allProducts
        ? allProducts.filter((p) => !p.isPromotion).slice(0, 8)
        : [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* 1. Hero Banner (Carrossel Principal) */}
                <HeroBanner />

                {/* 2. Atalhos de Categoria */}
                <section className="container py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <CategoryCard
                            icon={Smartphone}
                            title="Aparelhos"
                            subtitle="iPhones e Androids"
                            link="/aparelhos"
                            color="bg-blue-100 text-blue-700"
                        />
                        <CategoryCard
                            icon={Tag}
                            title="Acessórios"
                            subtitle="Capas e Películas"
                            link="/acessorios"
                            color="bg-purple-100 text-purple-700"
                        />
                        <CategoryCard
                            icon={Sparkles}
                            title="Promoções"
                            subtitle="Ofertas Imperdíveis"
                            link="/promocoes"
                            color="bg-pink-100 text-pink-700"
                        />
                        <CategoryCard
                            icon={ShieldCheck}
                            title="Garantia"
                            subtitle="Compra Segura"
                            link="#"
                            color="bg-green-100 text-green-700"
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

                {/* 4. Seção de Novidades (Grid) */}
                <section className="bg-muted/30 py-16">
                    <div className="container">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold tracking-tight">
                                Novidades na Loja
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                Confira os últimos lançamentos disponíveis.
                            </p>
                        </div>

                        {loadingAll ? (
                            <ProductListSkeleton count={8} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {newArrivals.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-10 text-center">
                            <Button size="lg" asChild>
                                <Link to="/aparelhos">
                                    Ver Catálogo Completo
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* 5. Banner Institucional / Newsletter (Estático) */}
                <section className="container py-16">
                    <div className="bg-primary rounded-3xl p-8 md:p-16 text-primary-foreground text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Precisa de ajuda para escolher?
                            </h2>
                            <p className="text-primary-foreground/80 text-lg">
                                Nossa equipe está pronta para te atender no
                                WhatsApp e tirar todas as suas dúvidas sobre
                                qual aparelho é ideal para você.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="whitespace-nowrap text-lg h-14 px-8 rounded-full"
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
