/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, HardDrive, Cpu, ShoppingCart } from "lucide-react";
import { CartItem, Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";

interface ProductCardProps {
    product: Product;
}

const formatArrayData = (data: any): string => {
    if (Array.isArray(data)) {
        const cleaned = data.flatMap((item) => {
            if (typeof item === "string" && item.startsWith("[")) {
                try {
                    return JSON.parse(item);
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
        return cleaned.join(", ");
    }
    if (typeof data === "string" && data.startsWith("[")) {
        try {
            return JSON.parse(data).join(", ");
        } catch (e) {
            return data;
        }
    }
    if (typeof data === "string" && data.startsWith("{")) {
        return data.replace(/[{}]/g, "").replace(/,/g, ", ");
    }
    return data || "";
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
    const colorString = formatArrayData(product.colors); // Retorna string vazia se não tiver cores

    const firstImage = Array.isArray(product.images)
        ? product.images[0]
        : product.images || "/placeholder.svg";

    // Verifica se tem alguma especificação técnica para mostrar
    const hasSpecs = product.storage || product.ram || colorString;

    const handleCardClick = () => {
        navigate(`/produto/${product.id}`);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();

        const cartItem: CartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            quantity: 1,
            category: product.category,
        };

        addToCart(cartItem);

        toast({
            title: "Adicionado ao Carrinho",
            description: (
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>
                        "{product.name}" foi adicionado ao seu carrinho.
                    </span>
                </div>
            ),
            variant: "default",
        });
    };

    return (
        <Card
            className="group cursor-pointer overflow-hidden shadow-card transition-all hover:shadow-hover relative flex flex-col h-full"
            onClick={handleCardClick}
        >
            {/* --- BOTÃO DE FAVORITO --- */}
            <div className="absolute top-2 right-2 z-20">
                <FavoriteButton productId={product.id} />
            </div>

            <div className="relative aspect-square overflow-hidden bg-muted shrink-0">
                <img
                    src={firstImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {product.isPromotion && discount > 0 && (
                    <Badge className="absolute left-2 top-2 bg-destructive text-destructive-foreground z-10">
                        -{discount}%
                    </Badge>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3 className="mb-2 text-lg font-semibold text-card-foreground line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                </h3>

                {/* --- INFORMAÇÕES TÉCNICAS (SÓ RENDERIZA SE TIVER) --- */}
                {hasSpecs ? (
                    <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                        {(product.storage || product.ram) && (
                            <div className="flex items-center gap-1">
                                {product.storage && (
                                    <>
                                        <HardDrive className="h-3 w-3" />
                                        <span>{product.storage}</span>
                                    </>
                                )}
                                {/* Só mostra o ponto se tiver AMBOS */}
                                {product.storage && product.ram && (
                                    <span className="mx-1">•</span>
                                )}

                                {product.ram && (
                                    <>
                                        <Cpu className="h-3 w-3" />
                                        <span>{product.ram} RAM</span>
                                    </>
                                )}
                            </div>
                        )}

                        {colorString && (
                            <div className="flex items-center gap-1">
                                <Palette className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {colorString}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    // Espaço vazio para manter alinhamento se não tiver specs, ou remove se preferir
                    <div className="mb-3 h-8"></div>
                )}

                {/* PREÇOS */}
                <div className="mt-auto">
                    <div className="mb-3">
                        {discount > 0 && product.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.originalPrice)}
                            </p>
                        )}
                        <p className="text-2xl font-bold text-primary">
                            {formatCurrency(product.price)}
                        </p>
                    </div>

                    <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">
                            {storeNames || "Loja online"}
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            className="flex-1"
                            size="sm"
                            onClick={handleCardClick}
                        >
                            Ver Detalhes
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 shrink-0"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
