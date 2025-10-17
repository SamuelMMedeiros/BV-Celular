import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, HardDrive, Cpu } from "lucide-react";
import { useState } from "react";
import { ProductDialog } from "./ProductDialog";

interface Product {
  id: string;
  name: string;
  storage: string;
  ram: string;
  colors: string[];
  price: number;
  originalPrice?: number;
  stores: string[];
  images: string[];
  description: string;
  isPromotion?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <Card 
        className="group cursor-pointer overflow-hidden shadow-card transition-all hover:shadow-hover"
        onClick={() => setIsDialogOpen(true)}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
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
              <span>{product.storage}</span>
              <span className="mx-1">•</span>
              <Cpu className="h-3 w-3" />
              <span>{product.ram} RAM</span>
            </div>
            <div className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              <span className="line-clamp-1">{product.colors.join(", ")}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            {product.originalPrice && (
              <p className="text-xs text-muted-foreground line-through">
                R$ {product.originalPrice.toLocaleString("pt-BR")}
              </p>
            )}
            <p className="text-2xl font-bold text-primary">
              R$ {product.price.toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Stores */}
          <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{product.stores.join(", ")}</span>
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
