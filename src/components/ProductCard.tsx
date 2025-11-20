/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, HardDrive, Cpu, ShoppingCart, Clock } from "lucide-react";
import { CartItem, Product } from "@/types"; 
import { useCart } from "@/contexts/CartContext"; 
import { useToast } from "@/hooks/use-toast"; 
import { formatCurrency } from "@/lib/utils"; 
import { CheckCircle } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton"; 
import { format, isBefore } from "date-fns";

interface ProductCardProps {
    product: Product;
}

const formatArrayData = (data: any): string => {
    if (Array.isArray(data)) {
        const cleaned = data.flatMap((item) => {
            if (typeof item === "string" && item.startsWith("[")) {
                try { return JSON.parse(item); } catch (e) { return item; }
            }
            return item;
        });
        return cleaned.join(", ");
    }
    if (typeof data === "string" && data.startsWith("[")) {
        try { return JSON.parse(data).join(", "); } catch (e) { return data; }
    }
    if (typeof data === "string" && data.startsWith("{")) {
        return data.replace(/[{}]/g, "").replace(/,/g, ", ");
    }
    return data || "";
};

// Map de labels bonitas para subcategorias
const SUBCATEGORY_LABELS: Record<string, string> = {
    smartphone: "Smartphone",
    tablet: "Tablet",
    smartwatch: "Smartwatch",
    case: "Capa",
    film: "Película",
    charger: "Carregador",
    audio: "Áudio",
    smartwatch_band: "Pulseira",
    peripheral: "Periférico",
    other: "Outros"
};

export const ProductCard = ({ product }: ProductCardProps) => {
    const navigate = useNavigate(); 
    const { addToCart } = useCart(); 
    const { toast } = useToast(); 

    const discount =
        product.originalPrice && product.originalPrice > product.price
            ? Math.round(
                  ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
              )
            : 0;

    const storeNames = product.stores.map((store) => store.name).join(", ");
    const colorString = formatArrayData(product.colors); 
    
    const firstImage = Array.isArray(product.images)
        ? product.images[0]
        : product.images || "/placeholder.svg";

    // Se tem specs técnicas relevantes para exibir ícones
    const hasSpecs = product.storage || product.ram || (colorString && product.category === 'aparelho');

    const isPromoValid = product.isPromotion && (!product.promotion_end_date || !isBefore(new Date(product.promotion_end_date), new Date()));
    const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;

    const handleCardClick = () => {
        navigate(`/produto/${product.id}`);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        if (isOutOfStock) return;

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
            description: <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>"{product.name}" foi adicionado.</span></div>,
        });
    };

    // Label da subcategoria ou categoria fallback
    const categoryLabel = product.subcategory 
        ? SUBCATEGORY_LABELS[product.subcategory] || product.subcategory 
        : (product.category === 'aparelho' ? 'Aparelho' : 'Acessório');

    return (
        <Card
            className={`group cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-all relative flex flex-col h-full ${isOutOfStock ? 'opacity-70' : ''}`}
            onClick={handleCardClick}
        >
            <div className="absolute top-2 right-2 z-20">
                <FavoriteButton productId={product.id} />
            </div>

            <div className="relative aspect-square overflow-hidden bg-muted/50 shrink-0">
                <img
                    src={firstImage}
                    alt={product.name}
                    className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`}
                />
                
                {isOutOfStock && <Badge className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white z-30 font-bold">ESGOTADO</Badge>}

                {!isOutOfStock && isPromoValid && discount > 0 && (
                    <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground z-10 font-bold">-{discount}%</Badge>
                )}

                {!isOutOfStock && isPromoValid && product.promotion_end_date && (
                    <Badge variant="secondary" className="absolute left-2 bottom-2 z-10 text-[10px] bg-black/70 text-white border-none backdrop-blur-sm gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(product.promotion_end_date), "dd/MM")}
                    </Badge>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1 gap-2">
                {/* MARCA E SUBCATEGORIA (NOVO) */}
                <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                    <span>{product.brand || "Genérico"}</span>
                    <span>{categoryLabel}</span>
                </div>

                <h3 className="text-base font-semibold text-card-foreground line-clamp-2 leading-tight min-h-[2.5rem]">
                    {product.name}
                </h3>

                {/* SPECS (SÓ APARELHOS OU SE TIVER DADOS) */}
                {hasSpecs ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                        {product.storage && <Badge variant="outline" className="font-normal bg-transparent text-muted-foreground border-muted-foreground/30"><HardDrive className="h-3 w-3 mr-1"/>{product.storage}</Badge>}
                        {product.ram && <Badge variant="outline" className="font-normal bg-transparent text-muted-foreground border-muted-foreground/30"><Cpu className="h-3 w-3 mr-1"/>{product.ram}</Badge>}
                    </div>
                ) : (
                    // Se for acessório sem specs, não renderiza nada, o flex-col ajusta o espaço
                    null
                )}

                {/* EMPURRA O PREÇO PARA BAIXO */}
                <div className="mt-auto pt-2">
                    <div className="mb-2">
                        {!isOutOfStock && isPromoValid && product.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</p>
                        )}
                        <p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{storeNames || "Online"}</span>
                    </div>

                    <div className="flex gap-2">
                        <Button className="flex-1 h-9 text-sm" onClick={handleCardClick} variant="secondary">Ver Detalhes</Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 border-primary/20 text-primary hover:bg-primary hover:text-white" onClick={handleAddToCart} disabled={isOutOfStock}>
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};