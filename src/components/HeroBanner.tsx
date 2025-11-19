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
import { fetchBanners, fetchPromotions } from "@/lib/api";
import { Banner, Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

// Tipo unificado para o Carrossel
type CarouselItemData =
    | { type: "banner"; data: Banner }
    | { type: "product"; data: Product };

export const HeroBanner = () => {
    const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

    // 1. Busca Banners Manuais
    const { data: manualBanners, isLoading: loadingBanners } = useQuery<
        Banner[]
    >({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });

    // 2. Busca Produtos em Promoção
    const { data: promoProducts, isLoading: loadingPromos } = useQuery<
        Product[]
    >({
        queryKey: ["promotions-banner"],
        queryFn: () => fetchPromotions({ isPromotion: true }),
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

    if (manualBanners) {
        manualBanners.forEach((b) => items.push({ type: "banner", data: b }));
    }

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
        <div className="w-full py-4 md:py-6">
            <Carousel
                plugins={[plugin.current]}
                className="w-full max-w-7xl mx-auto md:rounded-2xl overflow-hidden shadow-xl"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
                opts={{ loop: true }}
            >
                <CarouselContent>
                    {items.map((item, index) => (
                        <CarouselItem key={index}>
                            {/* ALTERAÇÃO MOBILE: 
                                - Mudamos h-[400px] para min-h-[500px] no mobile para caber o conteúdo empilhado.
                                - No desktop mantém h-[500px].
                            */}
                            <div className="relative min-h-[500px] md:h-[500px] w-full flex items-center bg-slate-900 overflow-hidden">
                                {item.type === "banner" ? (
                                    // --- BANNER MANUAL ---
                                    <>
                                        <img
                                            src={item.data.image_url}
                                            alt={item.data.title}
                                            className="absolute inset-0 w-full h-full object-cover opacity-40"
                                        />
                                        {/* Overlay Gradiente para legibilidade */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent md:bg-gradient-to-r md:from-black/80 md:to-transparent" />

                                        <div className="container mx-auto px-6 py-12 flex flex-col-reverse md:flex-row items-center gap-8 relative z-10 h-full justify-center md:justify-between">
                                            {/* Texto */}
                                            <div className="flex-1 text-center md:text-left space-y-4 md:space-y-6">
                                                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
                                                    {item.data.title}
                                                </h2>
                                                {item.data.subtitle && (
                                                    <p className="text-base sm:text-lg md:text-2xl text-gray-200 drop-shadow-md font-light line-clamp-3 md:line-clamp-none">
                                                        {item.data.subtitle}
                                                    </p>
                                                )}
                                                <div className="pt-2">
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="w-full md:w-auto text-base md:text-lg px-8 h-12 rounded-full shadow-lg hover:scale-105 transition-transform bg-white text-black hover:bg-gray-100"
                                                    >
                                                        <a
                                                            href={
                                                                item.data
                                                                    .link_url
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
                                                            {
                                                                item.data
                                                                    .button_text
                                                            }
                                                            {item.data.link_url.includes(
                                                                "wa.me"
                                                            ) && (
                                                                <ExternalLink className="ml-2 h-4 w-4" />
                                                            )}
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Imagem Ilustrativa (Se houver, ou se for o mesmo background usado como destaque) */}
                                            <div className="flex-1 flex justify-center md:justify-end items-center w-full">
                                                {/* No mobile, limitamos a altura para não ocupar a tela toda */}
                                                <img
                                                    src={item.data.image_url}
                                                    alt={item.data.title}
                                                    className="h-40 sm:h-56 md:max-h-[400px] w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 rounded-lg md:rounded-none"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // --- PRODUTO EM PROMOÇÃO ---
                                    <>
                                        {/* Fundo borrado */}
                                        <img
                                            src={
                                                item.data.images[0] ||
                                                "/placeholder.svg"
                                            }
                                            alt={item.data.name}
                                            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/90 md:to-transparent" />

                                        <div className="container mx-auto px-6 py-12 flex flex-col-reverse md:flex-row items-center gap-6 md:gap-12 relative z-10 h-full justify-center md:justify-between">
                                            <div className="flex-1 text-center md:text-left space-y-4 md:space-y-6">
                                                <div className="inline-block bg-red-600 text-white text-xs md:text-sm font-bold px-3 py-1 rounded-full mb-2 animate-pulse uppercase tracking-wider">
                                                    Oferta Relâmpago
                                                </div>
                                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md line-clamp-2 leading-tight">
                                                    {item.data.name}
                                                </h2>

                                                <div className="space-y-1">
                                                    {item.data.originalPrice &&
                                                        item.data
                                                            .originalPrice >
                                                            item.data.price && (
                                                            <p className="text-lg md:text-xl text-gray-400 line-through">
                                                                {formatCurrency(
                                                                    item.data
                                                                        .originalPrice
                                                                )}
                                                            </p>
                                                        )}
                                                    <p className="text-4xl md:text-6xl font-bold text-yellow-400 drop-shadow-lg">
                                                        {formatCurrency(
                                                            item.data.price
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4 w-full">
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="w-full md:w-auto text-base md:text-lg px-8 h-12 rounded-full shadow-lg bg-white text-black hover:bg-gray-100"
                                                    >
                                                        <Link
                                                            to={`/produto/${item.data.id}`}
                                                        >
                                                            Comprar Agora
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex justify-center md:justify-end items-center w-full">
                                                {/* Imagem do Produto: Ajustada para Mobile */}
                                                <img
                                                    src={
                                                        item.data.images[0] ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={item.data.name}
                                                    className="h-48 sm:h-64 md:max-h-[420px] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Setas de navegação escondidas no mobile para não poluir (usuário arrasta) */}
                <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 text-white border-none hidden md:flex" />
                <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 text-white border-none hidden md:flex" />
            </Carousel>
        </div>
    );
};
