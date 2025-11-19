import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBanners, fetchPromotions } from "@/lib/api"; // Buscar Banners E Promoções
import { Banner, Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

// Tipo unificado para o Carrossel
type CarouselItemData =
    | { type: "banner"; data: Banner }
    | { type: "product"; data: Product };

export const HeroBanner = () => {
    const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

    // 1. Busca Banners Manuais (Tabela 'Banners')
    const { data: manualBanners, isLoading: loadingBanners } = useQuery<
        Banner[]
    >({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });

    // 2. Busca Produtos em Promoção (Tabela 'Products' com isPromotion=true)
    const { data: promoProducts, isLoading: loadingPromos } = useQuery<
        Product[]
    >({
        queryKey: ["promotions-banner"],
        queryFn: () => fetchPromotions({ isPromotion: true }), // Garante filtro
    });

    if (loadingBanners || loadingPromos) {
        return (
            <div className="w-full py-6">
                <Skeleton className="w-full max-w-7xl mx-auto h-[400px] rounded-2xl" />
            </div>
        );
    }

    // 3. Mescla e Limita os itens
    const items: CarouselItemData[] = [];

    // Adiciona banners manuais primeiro (se houver)
    if (manualBanners) {
        manualBanners.forEach((b) => items.push({ type: "banner", data: b }));
    }

    // Adiciona produtos em promoção (até completar 7 itens no total ou acabar os produtos)
    if (promoProducts) {
        const remainingSlots = 7 - items.length;
        if (remainingSlots > 0) {
            const productsToAdd = promoProducts.slice(0, remainingSlots);
            productsToAdd.forEach((p) =>
                items.push({ type: "product", data: p })
            );
        }
    }

    if (items.length === 0) return null;

    return (
        <div className="w-full py-6">
            <Carousel
                plugins={[plugin.current]}
                className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-xl"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
                opts={{ loop: true }}
            >
                <CarouselContent>
                    {items.map((item, index) => (
                        <CarouselItem key={index}>
                            <div className="relative h-[400px] md:h-[500px] w-full flex items-center bg-slate-900 overflow-hidden">
                                {item.type === "banner" ? (
                                    // --- RENDERIZAÇÃO DE BANNER MANUAL ---
                                    <>
                                        <img
                                            src={item.data.image_url}
                                            alt={item.data.title}
                                            className="absolute inset-0 w-full h-full object-cover opacity-40"
                                        />
                                        <div className="container mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-8 relative z-10">
                                            <div className="flex-1 text-center md:text-left space-y-6">
                                                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                                                    {item.data.title}
                                                </h2>
                                                {item.data.subtitle && (
                                                    <p className="text-lg md:text-2xl text-gray-200 drop-shadow-md font-light">
                                                        {item.data.subtitle}
                                                    </p>
                                                )}
                                                <Button
                                                    asChild
                                                    size="lg"
                                                    className="text-lg px-8 h-12 rounded-full shadow-lg hover:scale-105 transition-transform bg-white text-black hover:bg-gray-100"
                                                >
                                                    <a
                                                        href={
                                                            item.data.link_url
                                                        }
                                                        target={
                                                            item.data.link_url.startsWith(
                                                                "http"
                                                            )
                                                                ? "_blank"
                                                                : "_self"
                                                        }
                                                        rel="noopener noreferrer"
                                                    >
                                                        {item.data.button_text}
                                                        {item.data.link_url.includes(
                                                            "wa.me"
                                                        ) && (
                                                            <ExternalLink className="ml-2 h-4 w-4" />
                                                        )}
                                                    </a>
                                                </Button>
                                            </div>
                                            <div className="flex-1 flex justify-center md:justify-end items-center h-full">
                                                <img
                                                    src={item.data.image_url}
                                                    alt={item.data.title}
                                                    className="max-h-[250px] md:max-h-[400px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // --- RENDERIZAÇÃO DE PRODUTO EM PROMOÇÃO ---
                                    <>
                                        {/* Fundo com a imagem do produto borrada */}
                                        <img
                                            src={
                                                item.data.images[0] ||
                                                "/placeholder.svg"
                                            }
                                            alt={item.data.name}
                                            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

                                        <div className="container mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-12 relative z-10">
                                            <div className="flex-1 text-center md:text-left space-y-6">
                                                <div className="inline-block bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 animate-pulse">
                                                    OFERTA RELÂMPAGO
                                                </div>
                                                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md line-clamp-2">
                                                    {item.data.name}
                                                </h2>

                                                <div className="space-y-1">
                                                    {item.data.originalPrice &&
                                                        item.data
                                                            .originalPrice >
                                                            item.data.price && (
                                                            <p className="text-xl text-gray-400 line-through">
                                                                {formatCurrency(
                                                                    item.data
                                                                        .originalPrice
                                                                )}
                                                            </p>
                                                        )}
                                                    <p className="text-5xl md:text-6xl font-bold text-yellow-400 drop-shadow-lg">
                                                        {formatCurrency(
                                                            item.data.price
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="text-lg px-8 h-14 rounded-full shadow-lg bg-white text-black hover:bg-gray-100"
                                                    >
                                                        <Link
                                                            to={`/produto/${item.data.id}`}
                                                        >
                                                            Comprar Agora
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex justify-center md:justify-end items-center h-full">
                                                <img
                                                    src={
                                                        item.data.images[0] ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={item.data.name}
                                                    className="max-h-[280px] md:max-h-[420px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 text-white border-none" />
                <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 text-white border-none" />
            </Carousel>
        </div>
    );
};
