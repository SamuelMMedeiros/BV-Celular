/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO PARA: src/pages/ProductDetails.tsx ===
//
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById, fetchRelatedProducts } from "@/lib/api"; 
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CartItem, Store } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton"; 
import { SEO } from "@/components/SEO"; 
import { ProductCard } from "@/components/ProductCard"; // <-- IMPORT NOVO
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi, // <-- IMPORT NOVO
} from "@/components/ui/carousel";
import {
    ArrowLeft,
    ShoppingCart,
    CheckCircle,
    Store as StoreIcon,
    Cpu,
    HardDrive,
    Palette,
    Share2,
    Clock,
    Timer
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const ProductDetails = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toast } = useToast();

    // Estado para controlar o carrossel principal
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    // 1. Busca Produto Principal
    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", productId],
        queryFn: () => fetchProductById(productId!),
        enabled: !!productId,
    });

    // 2. Busca Relacionados (Só executa quando tivermos o produto principal)
    const { data: relatedProducts } = useQuery({
        queryKey: ["related", product?.category, productId],
        queryFn: () => fetchRelatedProducts(product!.category, productId!),
        enabled: !!product,
    });

    // Atualiza o slide atual quando o carrossel muda
    useEffect(() => {
        if (!api) {
            return;
        }
        
        // Sincroniza o estado com o evento de slide
        api.on("select", () => {
            setCurrentSlide(api.selectedScrollSnap());
        });
    }, [api]);

    // Reseta o slide quando muda de produto
    useEffect(() => {
        if (api) api.scrollTo(0);
    }, [productId, api]);

    if (isLoading) {
        return <ProductDetailsSkeleton />;
    }

    if (isError || !product) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <h2 className="text-2xl font-bold">Produto não encontrado</h2>
                    <p className="text-muted-foreground">
                        O produto que você procura não existe ou foi removido.
                    </p>
                    <Button onClick={() => navigate("/")}>Voltar para o Início</Button>
                </div>
            </div>
        );
    }

    // Validações de Promoção e Dados
    const isPromoValid = product.isPromotion && (!product.promotion_end_date || !isBefore(new Date(product.promotion_end_date), new Date()));
    const discount = isPromoValid && product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    const hasSpecs = product.storage || product.ram || (product.colors && product.colors.length > 0);
    
    // Garante array de imagens válido
    const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];

    const formatArrayData = (data: any): string => {
        if (Array.isArray(data)) return data.join(", ");
        return data || "";
    };

    const handleAddToCart = () => {
        const cartItem: CartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            quantity: 1,
            category: product.category,
            isPromotion: product.isPromotion
        };
        addToCart(cartItem);
        toast({
            title: "Adicionado ao Carrinho",
            description: <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>"{product.name}" adicionado.</span></div>,
        });
    };

    const handleShare = async () => {
        const shareData = { title: product.name, text: `Confira ${product.name} na BV Celular!`, url: window.location.href };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log(err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link copiado!" });
        }
    };

    const seoDescription = product.description ? product.description.substring(0, 150) + "..." : `Compre ${product.name}.`;

    return (
        <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
            <SEO title={product.name} description={seoDescription} image={images[0]} />
            <Navbar />
            
            <main className="container py-8 flex-1 animate-fade-in">
                <div className="mb-4">
                    <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-16 mb-16">
                    {/* COLUNA 1: CARROSSEL DE IMAGENS */}
                    <div className="space-y-4">
                        <div className="relative aspect-square w-full bg-muted/30 rounded-2xl overflow-hidden border">
                            <Carousel setApi={setApi} className="w-full h-full">
                                <CarouselContent>
                                    {images.map((img, index) => (
                                        <CarouselItem key={index} className="flex items-center justify-center h-full">
                                            <img 
                                                src={img} 
                                                alt={`${product.name} - Imagem ${index + 1}`} 
                                                className="w-full h-full object-contain p-4"
                                            />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {/* Setas apenas no Desktop, Mobile usa swipe */}
                                {images.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-4 hidden md:flex" />
                                        <CarouselNext className="right-4 hidden md:flex" />
                                    </>
                                )}
                            </Carousel>

                            {/* Badges Flutuantes sobre o Carrossel */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                {isPromoValid && discount > 0 && (
                                    <Badge className="bg-destructive text-destructive-foreground text-lg px-3 py-1 shadow-md w-fit">-{discount}%</Badge>
                                )}
                                {isPromoValid && product.promotion_end_date && (
                                    <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-md border-none shadow-md w-fit flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Até {format(new Date(product.promotion_end_date), "dd/MM")}
                                    </Badge>
                                )}
                            </div>
                            
                            {/* Botão de Favorito Flutuante */}
                            <div className="absolute top-4 right-4 z-10">
                                <FavoriteButton productId={product.id} className="bg-white/80 backdrop-blur-md shadow-md hover:bg-white" />
                            </div>
                        </div>
                        
                        {/* Miniaturas (Controle do Carrossel) */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => api?.scrollTo(idx)}
                                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                            currentSlide === idx
                                                ? "border-primary ring-2 ring-primary/20 opacity-100"
                                                : "border-transparent hover:border-muted-foreground/30 opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUNA 2: INFORMAÇÕES */}
                    <div className="flex flex-col space-y-6">
                        <div>
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                                    {product.name}
                                </h1>
                                <Button variant="ghost" size="icon" onClick={handleShare} className="shrink-0">
                                    <Share2 className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-sm capitalize">{product.category}</Badge>
                                {product.storage && <Badge variant="secondary" className="text-sm">{product.storage}</Badge>}
                                {product.brand && <Badge variant="secondary" className="text-sm">{product.brand}</Badge>}
                            </div>
                        </div>

                        <div className="p-6 bg-card border rounded-xl shadow-sm space-y-4">
                            <div>
                                {isPromoValid && product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-lg text-muted-foreground line-through">
                                        {formatCurrency(product.originalPrice)}
                                    </span>
                                )}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-primary tracking-tight">
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                                <span className="text-sm text-muted-foreground block mt-1">
                                    À vista no PIX ou em até 12x no cartão (consulte condições).
                                </span>
                            </div>

                            {isPromoValid && product.promotion_end_date && (
                                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-sm font-medium">
                                    <Timer className="h-5 w-5" />
                                    <span>Aproveite! Oferta encerra em {format(new Date(product.promotion_end_date), "dd 'de' MMMM", { locale: ptBR })}.</span>
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <StoreIcon className="h-4 w-4 text-primary" />
                                    <span>Disponibilidade:</span>
                                </div>
                                {product.stores && product.stores.length > 0 ? (
                                    <>
                                        <Select onValueChange={(val) => setSelectedStore(product.stores.find(s => s.id === val) || null)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione uma loja..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {product.stores.map(store => (
                                                    <SelectItem key={store.id} value={store.id}>
                                                        {store.name} ({store.city})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedStore && (
                                            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                                                <p><strong>{selectedStore.name}</strong></p>
                                                <p>{selectedStore.address || selectedStore.city}</p>
                                                <p className="mt-1">Tel: {selectedStore.whatsapp}</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Consulte disponibilidade online.</p>
                                )}
                            </div>

                            <Button size="lg" className="w-full h-14 text-lg font-bold shadow-lg hover:scale-[1.02] transition-transform" onClick={handleAddToCart}>
                                <ShoppingCart className="mr-2 h-6 w-6" />
                                Adicionar ao Carrinho
                            </Button>
                        </div>

                        {/* Especificações (Condicional) */}
                        {hasSpecs && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Detalhes Técnicos</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    {product.storage && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                                            <HardDrive className="h-5 w-5 text-primary" />
                                            <div><p className="font-medium">Armazenamento</p><p className="text-muted-foreground">{product.storage}</p></div>
                                        </div>
                                    )}
                                    {product.ram && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                                            <Cpu className="h-5 w-5 text-primary" />
                                            <div><p className="font-medium">Memória RAM</p><p className="text-muted-foreground">{product.ram}</p></div>
                                        </div>
                                    )}
                                    {product.colors && product.colors.length > 0 && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border sm:col-span-2">
                                            <Palette className="h-5 w-5 text-primary" />
                                            <div><p className="font-medium">Cores</p><p className="text-muted-foreground">{formatArrayData(product.colors)}</p></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {product.description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Sobre o Produto</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SEÇÃO 3: PRODUTOS RELACIONADOS */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-16 space-y-6 animate-slide-up">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold tracking-tight">Quem viu este, viu também</h2>
                            <Separator className="flex-1" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((related) => (
                                <ProductCard key={related.id} product={related} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const ProductDetailsSkeleton = () => (
    <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container py-8 flex-1">
            <Skeleton className="h-10 w-24 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </main>
    </div>
);

export default ProductDetails;