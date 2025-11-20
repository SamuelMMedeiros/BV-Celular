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
import { ExternalLink, ArrowRight, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

type CarouselItemData =
    | { type: "banner"; data: Banner }
    | { type: "product"; data: Product };

export const HeroBanner = () => {
    const plugin = useRef(Autoplay({ delay: 6000, stopOnInteraction: true }));

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
            <div className="w-full py-4">
                <Skeleton className="w-full max-w-[1400px] mx-auto h-[350px] rounded-3xl" />
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
        <div className="w-full pt-2 pb-6">
            <Carousel
                plugins={[plugin.current]}
                className="w-full max-w-[1440px] mx-auto md:rounded-3xl overflow-hidden shadow-xl"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
                opts={{ loop: true }}
            >
                <CarouselContent>
                    {items.map((item, index) => (
                        <CarouselItem key={index}>
                            {/* AJUSTE DE ALTURA AQUI: min-h-[400px] mobile / h-[350px] desktop */}
                            <div
                                className="relative min-h-[400px] md:h-[350px] w-full flex items-center overflow-hidden bg-slate-950"
                                style={
                                    item.type === "banner" &&
                                    item.data.background_color
                                        ? {
                                              backgroundColor:
                                                  item.data.background_color,
                                          }
                                        : {}
                                }
                            >
                                {item.type === "banner" ? (
                                    // --- BANNER MANUAL ---
                                    <>
                                        {item.data.image_url && (
                                            <img
                                                src={item.data.image_url}
                                                alt={item.data.title}
                                                className="absolute inset-0 w-full h-full object-cover opacity-60 md:opacity-100"
                                            />
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />

                                        <div className="container mx-auto px-6 py-8 flex flex-col items-center md:items-start justify-end md:justify-center relative z-10 h-full text-center md:text-left pb-16 md:pb-0">
                                            <div className="space-y-4 max-w-2xl animate-fade-in">
                                                <h2
                                                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-xl"
                                                    style={{
                                                        color:
                                                            item.data
                                                                .text_color ||
                                                            "white",
                                                    }}
                                                >
                                                    {item.data.title}
                                                </h2>
                                                {item.data.subtitle && (
                                                    <p
                                                        className="text-base sm:text-lg md:text-xl font-light drop-shadow-md line-clamp-2"
                                                        style={{
                                                            color:
                                                                item.data
                                                                    .text_color ||
                                                                "white",
                                                            opacity: 0.9,
                                                        }}
                                                    >
                                                        {item.data.subtitle}
                                                    </p>
                                                )}
                                                <div className="pt-2">
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="text-sm md:text-base h-12 px-8 rounded-full shadow-xl hover:scale-105 transition-transform bg-white text-black hover:bg-gray-100 border-none font-bold"
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
                                                            ) ? (
                                                                <ExternalLink className="ml-2 h-4 w-4" />
                                                            ) : (
                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                            )}
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // --- PRODUTO EM PROMOÇÃO (VITRINE) ---
                                    <>
                                        <img
                                            src={
                                                item.data.images[0] ||
                                                "/placeholder.svg"
                                            }
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-3xl scale-125"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" />

                                        <div className="container mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-center md:justify-between relative z-10 gap-6 py-8">
                                            <div className="flex-1 text-center md:text-left space-y-3 order-2 md:order-1 animate-slide-up">
                                                <div className="inline-flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm mb-1">
                                                    <Tag className="h-3 w-3" />{" "}
                                                    Oferta Relâmpago
                                                </div>
                                                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none drop-shadow-2xl line-clamp-2">
                                                    {item.data.name}
                                                </h2>

                                                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 pt-1">
                                                    {item.data.originalPrice &&
                                                        item.data
                                                            .originalPrice >
                                                            item.data.price && (
                                                            <span className="text-lg text-gray-400 line-through decoration-red-500/50 decoration-2">
                                                                {formatCurrency(
                                                                    item.data
                                                                        .originalPrice
                                                                )}
                                                            </span>
                                                        )}
                                                    <span className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm">
                                                        {formatCurrency(
                                                            item.data.price
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="pt-4">
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="text-base px-10 h-12 rounded-full bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105 font-bold"
                                                    >
                                                        <Link
                                                            to={`/produto/${item.data.id}`}
                                                        >
                                                            Comprar Agora
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex justify-center md:justify-end items-center order-1 md:order-2 relative h-full">
                                                <div className="absolute w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-white/5 rounded-full blur-3xl animate-pulse" />
                                                <img
                                                    src={
                                                        item.data.images[0] ||
                                                        "/placeholder.svg"
                                                    }
                                                    alt={item.data.name}
                                                    className="h-[200px] sm:h-[250px] md:h-[320px] w-auto object-contain drop-shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-700 z-10"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <div className="hidden md:block">
                    <CarouselPrevious className="left-8 h-10 w-10 border-none bg-white/10 hover:bg-white/30 text-white backdrop-blur-md" />
                    <CarouselNext className="right-8 h-10 w-10 border-none bg-white/10 hover:bg-white/30 text-white backdrop-blur-md" />
                </div>
            </Carousel>
        </div>
    );
};
