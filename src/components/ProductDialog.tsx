/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Palette,
    HardDrive,
    Cpu,
    MessageCircle,
    ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, Store } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductDialogProps {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Helper para "limpar" dados de array que vêm do Supabase
const formatArrayData = (data: any): any[] => {
    if (Array.isArray(data)) {
        return data.flatMap((item) => {
            if (typeof item === "string" && item.startsWith("[")) {
                try {
                    return JSON.parse(item);
                } catch (e) {
                    return item;
                }
            }
            return item;
        });
    }
    if (typeof data === "string" && data.startsWith("[")) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    if (typeof data === "string" && data.startsWith("{")) {
        return data.replace(/[{}]/g, "").split(",");
    }
    return []; // Retorna vazio se for null ou outro tipo
};

// Helper para formatar preços (R$)
const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
    });
};

// 1. FUNÇÃO CORRIGIDA: Garante o formato correto para o wa.me API
const handleWhatsAppClick = (productName: string, store: Store) => {
    const message = encodeURIComponent(
        `Olá! Tenho interesse no ${productName} disponível na ${store.name}.`
    );

    // 2. CORREÇÃO PRINCIPAL: Limpa e garante o prefixo '55'
    const cleanedNumber = store.whatsapp.replace(/\D/g, "");
    const finalNumber = cleanedNumber.startsWith("55")
        ? cleanedNumber
        : "55" + cleanedNumber;

    // 3. Abre o link com o número final limpo e formatado
    window.open(`https://wa.me/${finalNumber}?text=${message}`, "_blank");
};

export const ProductDialog = ({
    product,
    open,
    onOpenChange,
}: ProductDialogProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showStoreSelection, setShowStoreSelection] = useState(false);
    const { addItem } = useCart();
    const { toast } = useToast();

    // Otimizado para só calcular se originalPrice existir e for maior
    const discount =
        product.originalPrice && product.originalPrice > product.price
            ? Math.round(
                  ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
              )
            : 0;

    const images = formatArrayData(product.images);
    const colors = formatArrayData(product.colors).join(", ") || "Cor única";

    // Lógica de adicionar ao carrinho
    const handleAddToCart = () => {
        addItem(product);
        toast({
            title: "Adicionado ao Carrinho",
            description: `${product.name} adicionado com sucesso.`,
            variant: "default",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{product.name}</span>
                        {discount > 0 && product.isPromotion && (
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
                                    src={
                                        images[currentImageIndex] ||
                                        "/placeholder.svg"
                                    }
                                    alt={`${product.name} - Imagem ${
                                        currentImageIndex + 1
                                    }`}
                                    className="h-full w-full object-cover"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </AnimatePresence>
                        </div>

                        {images.length > 1 && (
                            <div className="mt-2 flex gap-2">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            setCurrentImageIndex(index)
                                        }
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
                            {discount > 0 && product.originalPrice && (
                                <p className="text-sm text-muted-foreground line-through">
                                    De R$ {formatPrice(product.originalPrice)}
                                </p>
                            )}
                            <p className="text-3xl font-bold text-primary">
                                R$ {formatPrice(product.price)}
                            </p>
                        </div>

                        {/* Specs */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HardDrive className="h-4 w-4" />
                                <span>
                                    Armazenamento:{" "}
                                    {product.storage?.toUpperCase() || "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Cpu className="h-4 w-4" />
                                <span>
                                    Memória RAM:{" "}
                                    {product.ram?.toUpperCase() || "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Palette className="h-4 w-4" />
                                <span>Cores: {colors}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="mb-2 font-semibold">Descrição</h4>
                            <p className="text-sm text-muted-foreground">
                                {product.description}
                            </p>
                        </div>

                        {/* Stores */}
                        <div>
                            <h4 className="mb-2 flex items-center gap-2 font-semibold">
                                <MapPin className="h-4 w-4" />
                                Disponível em:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {product.stores.map((store) => (
                                    <Badge key={store.id} variant="secondary">
                                        {store.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Novo botão de Adicionar ao Carrinho */}
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Adicionar ao Carrinho
                        </Button>

                        {/* Actions (Comprar via WhatsApp) */}
                        {!showStoreSelection ? (
                            <Button
                                className="w-full"
                                variant="outline"
                                size="lg"
                                onClick={() => setShowStoreSelection(true)}
                            >
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Comprar via WhatsApp (Loja Única)
                            </Button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <p className="text-sm font-medium">
                                    Escolha uma loja:
                                </p>
                                {product.stores.map((store) => (
                                    <Button
                                        key={store.id}
                                        variant="outline"
                                        className="w-full justify-start"
                                        // 4. CHAMA A FUNÇÃO CORRIGIDA
                                        onClick={() =>
                                            handleWhatsAppClick(
                                                product.name,
                                                store
                                            )
                                        }
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        {store.name}
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
