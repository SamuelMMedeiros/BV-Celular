//
// === CÓDIGO COMPLETO PARA: src/pages/LinksPage.tsx ===
//
import { useQuery } from "@tanstack/react-query";
import { fetchPublicLinks, fetchStores } from "@/lib/api";
import { PublicLink, Store } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MessageCircle,
    Instagram,
    Facebook,
    MapPin,
    Phone,
    Globe,
    Smartphone,
    ArrowLeft,
    Store as StoreIcon,
    ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

// Helper para renderizar o ícone correto dos links manuais
const getIcon = (iconName: string) => {
    switch (iconName) {
        case "whatsapp":
            return <MessageCircle className="h-5 w-5" />;
        case "instagram":
            return <Instagram className="h-5 w-5" />;
        case "facebook":
            return <Facebook className="h-5 w-5" />;
        case "maps":
            return <MapPin className="h-5 w-5" />;
        case "phone":
            return <Phone className="h-5 w-5" />;
        default:
            return <Globe className="h-5 w-5" />;
    }
};

// Helper para cor do botão baseada no tipo (Links Manuais)
const getButtonClass = (iconName: string) => {
    switch (iconName) {
        case "whatsapp":
            return "bg-green-600 hover:bg-green-700 text-white border-transparent";
        case "instagram":
            return "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-transparent";
        case "facebook":
            return "bg-blue-600 hover:bg-blue-700 text-white border-transparent";
        case "maps":
            return "bg-red-500 hover:bg-red-600 text-white border-transparent";
        default:
            return "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-foreground border-input";
    }
};

const LinksPage = () => {
    // 1. Busca Links Manuais
    const { data: links, isLoading: loadingLinks } = useQuery<PublicLink[]>({
        queryKey: ["publicLinks"],
        queryFn: fetchPublicLinks,
    });

    // 2. Busca Lojas (Automático)
    const { data: stores, isLoading: loadingStores } = useQuery<Store[]>({
        queryKey: ["storesPublic"],
        queryFn: fetchStores,
    });

    const activeLinks = links?.filter((l) => l.active) || [];
    const isLoading = loadingLinks || loadingStores;

    // Helpers para URLs dinâmicas de Loja
    const getStoreWhatsAppUrl = (phone: string) =>
        `https://wa.me/${phone.replace(/\D/g, "")}`;
    const getStoreMapUrl = (address: string, city: string) =>
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${address}, ${city}`
        )}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center py-12 px-4 text-slate-100 font-sans">
            {/* --- CABEÇALHO (PERFIL) --- */}
            <div className="w-full max-w-md text-center space-y-4 mb-8 animate-fade-in">
                <div className="h-28 w-28 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-2xl mb-4 ring-4 ring-white/10">
                    <Smartphone className="h-12 w-12 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        BV Celular
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Tecnologia, Acessórios e Assistência Técnica.
                    </p>
                </div>
            </div>

            <div className="w-full max-w-md space-y-6 animate-slide-up">
                {isLoading ? (
                    // SKELETON LOADING
                    <div className="space-y-3">
                        <Skeleton className="h-14 w-full rounded-xl bg-slate-800" />
                        <Skeleton className="h-14 w-full rounded-xl bg-slate-800" />
                        <Skeleton className="h-14 w-full rounded-xl bg-slate-800" />
                    </div>
                ) : (
                    <>
                        {/* 1. LINKS MANUAIS (Destaques, Redes Sociais, Promoções) */}
                        <div className="space-y-3">
                            {activeLinks.map((link) => (
                                <Button
                                    key={link.id}
                                    asChild
                                    size="lg"
                                    className={`w-full h-14 text-base font-semibold shadow-lg rounded-xl justify-start px-4 transition-transform hover:scale-[1.02] active:scale-95 ${getButtonClass(
                                        link.icon
                                    )}`}
                                >
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center w-full"
                                    >
                                        <span className="mr-4">
                                            {getIcon(link.icon)}
                                        </span>
                                        <span className="flex-1 text-center mr-6">
                                            {link.title}
                                        </span>
                                    </a>
                                </Button>
                            ))}
                        </div>

                        {/* Separador se houver lojas */}
                        {stores && stores.length > 0 && (
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-950 px-2 text-slate-500 font-bold tracking-widest">
                                        Nossas Unidades
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 2. LINKS AUTOMÁTICOS DAS LOJAS */}
                        <div className="space-y-4">
                            {stores?.map((store) => (
                                <div
                                    key={store.id}
                                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3 hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-white font-semibold">
                                        <StoreIcon className="h-5 w-5 text-blue-400" />
                                        {store.name}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Botão WhatsApp da Loja */}
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="bg-transparent border-green-600/30 text-green-400 hover:bg-green-600/10 hover:text-green-300 w-full justify-start h-10"
                                        >
                                            <a
                                                href={getStoreWhatsAppUrl(
                                                    store.whatsapp
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <MessageCircle className="mr-2 h-4 w-4" />{" "}
                                                WhatsApp
                                            </a>
                                        </Button>

                                        {/* Botão Endereço (Se houver) */}
                                        {store.address && store.city ? (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 w-full justify-start h-10"
                                            >
                                                <a
                                                    href={getStoreMapUrl(
                                                        store.address,
                                                        store.city
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <MapPin className="mr-2 h-4 w-4" />{" "}
                                                    Localização
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button
                                                disabled
                                                variant="outline"
                                                className="bg-transparent border-slate-800 text-slate-600 w-full justify-start h-10 cursor-not-allowed"
                                            >
                                                <MapPin className="mr-2 h-4 w-4" />{" "}
                                                Sem Endereço
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* RODAPÉ SIMPLES */}
                <div className="pt-8 pb-4 flex justify-center">
                    <Button
                        variant="link"
                        className="text-slate-500 hover:text-white"
                        asChild
                    >
                        <Link to="/">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Acessar Loja
                            Virtual
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LinksPage;
