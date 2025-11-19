import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export const HeroBanner = () => {
    const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

    const banners = [
        {
            id: 1,
            title: "iPhone 15 Pro Max",
            subtitle: "Titânio. Tão robusto quanto leve.",
            bgClass: "bg-gradient-to-r from-slate-900 to-slate-700",
            textColor: "text-white",
            image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800", // Exemplo
            link: "/aparelhos",
            buttonText: "Ver Ofertas",
        },
        {
            id: 2,
            title: "Semana de Acessórios",
            subtitle: "Proteção e estilo com 20% OFF.",
            bgClass: "bg-gradient-to-r from-indigo-500 to-purple-500",
            textColor: "text-white",
            image: "https://images.unsplash.com/photo-1603351154351-5cf233092c5b?auto=format&fit=crop&q=80&w=800",
            link: "/acessorios",
            buttonText: "Confira Agora",
        },
        {
            id: 3,
            title: "Novos Samsung Galaxy",
            subtitle: "Inteligência Artificial na palma da mão.",
            bgClass: "bg-gradient-to-r from-blue-600 to-cyan-500",
            textColor: "text-white",
            image: "https://images.unsplash.com/photo-1610945265078-3858a0b5d8f4?auto=format&fit=crop&q=80&w=800",
            link: "/aparelhos",
            buttonText: "Comprar",
        },
    ];

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
                            <div
                                className={`relative h-[400px] md:h-[500px] w-full flex items-center ${banner.bgClass}`}
                            >
                                <div className="container mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-8">
                                    {/* Texto */}
                                    <div className="flex-1 text-center md:text-left space-y-6 z-10">
                                        <h2
                                            className={`text-4xl md:text-6xl font-extrabold tracking-tight ${banner.textColor}`}
                                        >
                                            {banner.title}
                                        </h2>
                                        <p
                                            className={`text-lg md:text-2xl opacity-90 ${banner.textColor}`}
                                        >
                                            {banner.subtitle}
                                        </p>
                                        <Button
                                            asChild
                                            size="lg"
                                            className="text-lg px-8 h-12 rounded-full shadow-lg hover:scale-105 transition-transform"
                                        >
                                            <Link to={banner.link}>
                                                {banner.buttonText}
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Imagem Ilustrativa */}
                                    <div className="flex-1 flex justify-center md:justify-end items-center h-full">
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="max-h-[250px] md:max-h-[400px] object-contain drop-shadow-2xl"
                                        />
                                    </div>
                                </div>
                                {/* Overlay sutil para leitura */}
                                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
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
