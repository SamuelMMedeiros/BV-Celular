import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Palette, HardDrive, Cpu, MessageCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

interface ProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductDialog = ({ product, open, onOpenChange }: ProductDialogProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStoreSelection, setShowStoreSelection] = useState(false);

  const handleWhatsAppClick = (storeName: string) => {
    const message = encodeURIComponent(
      `Olá! Tenho interesse no ${product.name} disponível na ${storeName}.`
    );
    // Número de exemplo - será substituído pelos números reais das lojas
    const whatsappNumber = "5511999999999";
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{product.name}</span>
            {product.isPromotion && (
              <Badge className="bg-destructive text-destructive-foreground">
                -{discount}% OFF
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas do produto
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Images */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={product.images[currentImageIndex]}
                  alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </div>
            
            {product.images.length > 1 && (
              <div className="mt-2 flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 w-16 overflow-hidden rounded border-2 transition-all ${
                      currentImageIndex === index
                        ? "border-primary"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Price */}
            <div>
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  De R$ {product.originalPrice.toLocaleString("pt-BR")}
                </p>
              )}
              <p className="text-3xl font-bold text-primary">
                R$ {product.price.toLocaleString("pt-BR")}
              </p>
            </div>

            {/* Specs */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span>Armazenamento: {product.storage}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="h-4 w-4" />
                <span>Memória RAM: {product.ram}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Palette className="h-4 w-4" />
                <span>Cores: {product.colors.join(", ")}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="mb-2 font-semibold">Descrição</h4>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>

            {/* Stores */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4" />
                Disponível em:
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.stores.map((store) => (
                  <Badge key={store} variant="secondary">
                    {store}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            {!showStoreSelection ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowStoreSelection(true)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Comprar via WhatsApp
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-sm font-medium">Escolha uma loja:</p>
                {product.stores.map((store) => (
                  <Button
                    key={store}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleWhatsAppClick(store)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {store}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowStoreSelection(false)}
                >
                  Voltar
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
