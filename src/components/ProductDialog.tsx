import { useState, ReactNode } from "react";
import { Product, Store, CartItem } from "@/types";
import { useCart } from "@/contexts/CartContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    CheckCircle,
    PackagePlus,
    Info,
    Store as StoreIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils"; // <-- 1. IMPORTAR O FORMATADOR

interface ProductDialogProps {
    product: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children?: ReactNode;
}

export const ProductDialog = ({
    product,
    open,
    onOpenChange,
}: ProductDialogProps) => {
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const { addToCart } = useCart();
    const { toast } = useToast();

    const availableStores = product.stores || [];

    const handleStoreChange = (storeId: string) => {
        const store = availableStores.find((s) => s.id === storeId) || null;
        setSelectedStore(store);
    };

    const handleAddToCart = () => {
        if (!product) return;

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
            title: "Item adicionado!",
            description: (
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {/* --- 2. TEXTO DO TOAST ALTERADO --- */}
                    <span>
                        "{product.name}" foi adicionado ao seu carrinho.
                    </span>
                </div>
            ),
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/2 md:w-2/5">
                    <Carousel className="w-full">
                        <CarouselContent>
                            {product.images && product.images.length > 0 ? (
                                product.images.map((img, index) => (
                                    <CarouselItem key={index}>
                                        <div className="aspect-square w-full h-full rounded-lg overflow-hidden bg-muted">
                                            <img
                                                src={img}
                                                alt={`${product.name} ${
                                                    index + 1
                                                }`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))
                            ) : (
                                <CarouselItem>
                                    <div className="aspect-square w-full h-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                        <img
                                            src="/placeholder.svg"
                                            alt="Placeholder"
                                            className="w-1/2 h-1/2 object-contain text-muted-foreground"
                                        />
                                    </div>
                                </CarouselItem>
                            )}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-2" />
                        <CarouselNext className="absolute right-2" />
                    </Carousel>
                </div>

                <div className="w-full sm:w-1/2 md:w-3/5 flex flex-col pl-0 sm:pl-6 pt-4 sm:pt-0 overflow-y-auto pr-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {product.name}
                        </DialogTitle>
                        {product.isPromotion && product.originalPrice && (
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">PROMOÇÃO</Badge>
                                <span className="text-lg text-muted-foreground line-through">
                                    {/* --- 3. PREÇO FORMATADO --- */}
                                    {formatCurrency(product.originalPrice)}
                                </span>
                            </div>
                        )}
                        <DialogDescription className="text-3xl font-bold text-primary pt-1">
                            {/* --- 4. PREÇO FORMATADO --- */}
                            {formatCurrency(product.price)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 my-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {product.description ||
                                "Este produto não possui descrição."}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {product.storage && (
                                <Badge variant="outline" className="w-fit">
                                    Armazenamento: {product.storage} GB
                                </Badge>
                            )}
                            {product.ram && (
                                <Badge variant="outline" className="w-fit">
                                    RAM: {product.ram} GB
                                </Badge>
                            )}
                        </div>

                        {product.colors && product.colors.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-sm font-medium">
                                    Cores:
                                </span>
                                {product.colors.map((color) => (
                                    <Badge key={color} variant="secondary">
                                        {color}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1">
                                <StoreIcon className="h-4 w-4 text-muted-foreground" />
                                Lojas Disponíveis
                            </label>
                            {availableStores.length > 0 ? (
                                <Select onValueChange={handleStoreChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma loja para ver a disponibilidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStores.map((store) => (
                                            <SelectItem
                                                key={store.id}
                                                value={store.id}
                                            >
                                                {store.name} ({store.city})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">
                                    Produto indisponível nas lojas no momento.
                                </div>
                            )}
                        </div>

                        {selectedStore && (
                            <div className="p-3 bg-accent rounded-lg">
                                <p className="text-sm font-medium text-accent-foreground">
                                    Disponível em:{" "}
                                    <span className="font-bold">
                                        {selectedStore.name}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    WhatsApp da loja: {selectedStore.whatsapp}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-auto pt-4 border-t sm:justify-between sm:flex-row-reverse">
                        <Button
                            onClick={handleAddToCart}
                            className="w-full sm:w-auto"
                        >
                            <PackagePlus className="h-4 w-4 mr-2" />
                            {/* --- 5. TEXTO DO BOTÃO ALTERADO --- */}
                            Adicionar ao Carrinho
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto mt-2 sm:mt-0"
                            >
                                Fechar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
