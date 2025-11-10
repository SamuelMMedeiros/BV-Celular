// src/components/ProductCard.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, HardDrive, Cpu } from "lucide-react";
import { useState } from "react";
import { ProductDialog } from "./ProductDialog";
import { Product } from "@/types"; // 1. Importe o tipo unificado que criamos

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const discount = product.originalPrice
        ? Math.round(
              ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
          )
        : 0;

    // 2. MUDANÇA AQUI: Transforme o array de objetos 'stores' em uma string de nomes
    const storeNames = product.stores.map((store) => store.name).join(", ");

    return (
        <>
            <Card
                className="group cursor-pointer overflow-hidden shadow-card transition-all hover:shadow-hover"
                onClick={() => setIsDialogOpen(true)}
            >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                        // 3. MUDANÇA AQUI: Adiciona checagem de nulo (safe navigation)
                        src={product.images?.[0] || "/placeholder.svg"} // Usa um placeholder se não houver imagem
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {product.isPromotion && (
                        <Badge className="absolute right-2 top-2 bg-destructive text-destructive-foreground">
                            -{discount}%
                        </Badge>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="mb-2 text-lg font-semibold text-card-foreground line-clamp-1">
                        {product.name}
                    </h3>

                    {/* Specs */}
                    <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            <span>{product.storage || "N/A"}</span>
                            <span className="mx-1">•</span>
                            <Cpu className="h-3 w-3" />
                            <span>{product.ram || "N/A"} RAM</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Palette className="h-3 w-3" />
                            {/* 4. MUDANÇA AQUI: Adiciona checagem de nulo */}
                            <span className="line-clamp-1">
                                {product.colors?.join(", ") || "Cor única"}
                            </span>
                        </div>
                    </div>

                    {/* Price (Não precisa de mudança) */}
                    <div className="mb-3">
                        {product.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                                R${" "}
                                {product.originalPrice.toLocaleString("pt-BR")}
                            </p>
                        )}
                        <p className="text-2xl font-bold text-primary">
                            R$ {product.price.toLocaleString("pt-BR")}
                        </p>
                    </div>

                    {/* Stores */}
                    <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {/* 5. MUDANÇA AQUI: Usa a string de nomes que criamos */}
                        <span className="line-clamp-1">
                            {storeNames || "Loja online"}
                        </span>
                    </div>

                    <Button className="w-full" size="sm">
                        Ver Detalhes
                    </Button>
                </div>
            </Card>

            <ProductDialog
                product={product}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </>
    );
};
