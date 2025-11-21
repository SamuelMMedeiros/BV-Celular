import { useQuery } from "@tanstack/react-query";
import { fetchPublicLinks } from "@/lib/api";
import { PublicLink } from "@/types";
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
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

// Helper para renderizar o ícone correto
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

// Helper para cor do botão baseada no tipo
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
    const { data: links, isLoading } = useQuery<PublicLink[]>({
        queryKey: ["publicLinks"],
        queryFn: fetchPublicLinks,
    });

    const activeLinks = links?.filter((l) => l.active) || [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <main className="flex-1 container py-12 flex flex-col items-center max-w-md mx-auto animate-fade-in">
                {/* Cabeçalho da Página de Links */}
                <div className="text-center space-y-4 mb-8">
                    <div className="h-24 w-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-xl mb-4">
                        <Smartphone className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        BV Celular
                    </h1>
                    <p className="text-muted-foreground">
                        Fale conosco ou nos encontre nas redes sociais.
                    </p>
                </div>

                {/* Lista de Botões */}
                <div className="w-full space-y-4">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-14 w-full rounded-xl" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </>
                    ) : activeLinks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-xl bg-background/50">
                            Nenhum link de contato disponível no momento.
                        </div>
                    ) : (
                        activeLinks.map((link) => (
                            <Button
                                key={link.id}
                                asChild
                                size="lg"
                                className={`w-full h-14 text-lg font-medium shadow-sm rounded-xl justify-start px-6 transition-transform hover:scale-[1.02] active:scale-95 ${getButtonClass(
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
                        ))
                    )}
                </div>

                {/* Botão Voltar */}
                <Button
                    variant="ghost"
                    className="mt-12 text-muted-foreground"
                    asChild
                >
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a
                        Loja
                    </Link>
                </Button>
            </main>

            <Footer />
        </div>
    );
};

export default LinksPage;
