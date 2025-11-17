import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, HardDrive, Cpu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { ProductDialog } from "./ProductDialog";
import { CartItem, Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils"; // <-- 1. IMPORTAR O FORMATADOR CORRETO
import { CheckCircle } from "lucide-react";

interface ProductCardProps {
    product: Product;
}

// Helper para "limpar" dados de array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    const colorString = formatArrayData(product.colors) || "Cor única";
    const firstImage = Array.isArray(product.images)
        ? product.images[0]
        : product.images || "/placeholder.svg";

    // Lógica de adicionar ao carrinho
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
            title: "Adicionado ao Carrinho", // <-- 2. TEXTO CORRIGIDO
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
        <>
            <Card
                className="group cursor-pointer overflow-hidden shadow-card transition-all hover:shadow-hover"
                onClick={() => setIsDialogOpen(true)}
            >
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                        src={firstImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {product.isPromotion && discount > 0 && (
                        <Badge className="absolute right-2 top-2 bg-destructive text-destructive-foreground">
                            -{discount}%
                        </Badge>
                    )}
                </div>

                <div className="p-4">
                    <h3 className="mb-2 text-lg font-semibold text-card-foreground line-clamp-1">
                        {product.name}
                    </h3>

                    <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            <span>
                                {product.storage?.toUpperCase() || "N/A"}
                            </span>
                            <span className="mx-1">•</span>
                            <Cpu className="h-3 w-3" />
                            <span>
                                {product.ram?.toUpperCase() || "N/A"} RAM
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Palette className="h-3 w-3" />
                            <span className="line-clamp-1">{colorString}</span>
                        </div>
                    </div>

                    <div className="mb-3">
                        {discount > 0 && product.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                                {/* --- 3. PREÇO FORMATADO --- */}
                                {formatCurrency(product.originalPrice)}
                            </p>
                        )}
                        <p className="text-2xl font-bold text-primary">
                            {/* --- 4. PREÇO FORMATADO --- */}
                            {formatCurrency(product.price)}
                        </p>
                    </div>

                    <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">
                            {storeNames || "Loja online"}
                        </span>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            className="flex-1"
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            Ver Detalhes
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <ProductDialog
                product={product}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            >
                <></>
            </ProductDialog>
        </>
    );
};
