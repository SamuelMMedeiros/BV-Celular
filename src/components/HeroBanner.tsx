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
import { fetchBanners } from "@/lib/api"; // <-- IMPORTAR API
import { Banner } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

export const HeroBanner = () => {
    const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

    // Busca os banners do banco
    const { data: banners, isLoading } = useQuery<Banner[]>({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });

    if (isLoading) {
        return (
            <div className="w-full py-6">
                <Skeleton className="w-full max-w-7xl mx-auto h-[400px] rounded-2xl" />
            </div>
        );
    }

    if (!banners || banners.length === 0) {
        return null; // Se não tiver banners, não mostra nada
    }

    return (
        <div className="w-full py-6">
            <Carousel
                plugins={[plugin.current]}
                className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-xl"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {banners.map((banner) => (
                        <CarouselItem key={banner.id}>
                            {/* Usamos um background escuro padrão, a imagem cobre tudo */}
                            <div className="relative h-[400px] md:h-[500px] w-full flex items-center bg-slate-900 overflow-hidden">
                                {/* Imagem de Fundo (Blur/Cover) */}
                                <img
                                    src={banner.image_url}
                                    alt={banner.title}
                                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                                />

                                <div className="container mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-8 relative z-10">
                                    {/* Texto */}
                                    <div className="flex-1 text-center md:text-left space-y-6">
                                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                                            {banner.title}
                                        </h2>
                                        {banner.subtitle && (
                                            <p className="text-lg md:text-2xl text-gray-200 drop-shadow-md">
                                                {banner.subtitle}
                                            </p>
                                        )}
                                        <Button
                                            asChild
                                            size="lg"
                                            className="text-lg px-8 h-12 rounded-full shadow-lg hover:scale-105 transition-transform bg-white text-black hover:bg-gray-100"
                                        >
                                            <a
                                                href={banner.link_url}
                                                target={
                                                    banner.link_url.startsWith(
                                                        "http"
                                                    )
                                                        ? "_blank"
                                                        : "_self"
                                                }
                                                rel="noopener noreferrer"
                                            >
                                                {banner.button_text}
                                                {banner.link_url.includes(
                                                    "wa.me"
                                                ) && (
                                                    <ExternalLink className="ml-2 h-4 w-4" />
                                                )}
                                            </a>
                                        </Button>
                                    </div>

                                    {/* Imagem Ilustrativa (Destacada) */}
                                    <div className="flex-1 flex justify-center md:justify-end items-center h-full">
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="max-h-[250px] md:max-h-[400px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
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
