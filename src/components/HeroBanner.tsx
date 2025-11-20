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

type CarouselItemData =
    | { type: "banner"; data: Banner }
    | { type: "product"; data: Product };

export const HeroBanner = () => {
    const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

    const { data: manualBanners, isLoading: loadingBanners } = useQuery<
        Banner[]
    >({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });

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
                            <div
                                className="relative min-h-[500px] md:h-[500px] w-full flex items-center overflow-hidden"
                                style={
                                    item.type === "banner"
                                        ? {
                                              backgroundColor:
                                                  item.data.background_color,
                                          }
                                        : { backgroundColor: "#0f172a" }
                                }
                            >
                                {item.type === "banner" ? (
                                    // --- BANNER MANUAL ---
                                    <>
                                        {item.data.image_url && (
                                            <img
                                                src={item.data.image_url}
                                                alt={item.data.title}
                                                className="absolute inset-0 w-full h-full object-cover opacity-40"
                                            />
                                        )}

                                        {/* Overlay sutil se tiver imagem */}
                                        {item.data.image_url && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        )}

                                        <div className="container mx-auto px-6 py-12 flex flex-col items-center justify-center text-center relative z-10 h-full">
                                            <div className="space-y-4 md:space-y-6 max-w-3xl">
                                                <h2
                                                    className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md leading-tight"
                                                    style={{
                                                        color: item.data
                                                            .text_color,
                                                    }}
                                                >
                                                    {item.data.title}
                                                </h2>
                                                {item.data.subtitle && (
                                                    <p
                                                        className="text-base sm:text-lg md:text-2xl drop-shadow-md font-light"
                                                        style={{
                                                            color: item.data
                                                                .text_color,
                                                            opacity: 0.9,
                                                        }}
                                                    >
                                                        {item.data.subtitle}
                                                    </p>
                                                )}
                                                <div className="pt-4">
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="text-base md:text-lg px-8 h-12 rounded-full shadow-lg hover:scale-105 transition-transform bg-white text-black hover:bg-gray-100 border-none"
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
                                        </div>
                                    </>
                                ) : (
                                    // --- PRODUTO EM PROMOÇÃO ---
                                    <>
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

                <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 text-white border-none hidden md:flex" />
                <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 text-white border-none hidden md:flex" />
            </Carousel>
        </div>
    );
};
