/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProductById } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CartItem, Store } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    ShoppingCart,
    CheckCircle,
    Store as StoreIcon,
    Cpu,
    HardDrive,
    Palette,
    Share2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const ProductDetails = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toast } = useToast();

    const [selectedImage, setSelectedImage] = useState<string>("");
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    // Busca os dados do produto
    const {
        data: product,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["product", productId],
        queryFn: () => fetchProductById(productId!),
        enabled: !!productId,
    });

    // Define a imagem inicial assim que o produto carrega
    useEffect(() => {
        if (product?.images && product.images.length > 0) {
            setSelectedImage(product.images[0]);
        }
    }, [product]);

    if (isLoading) {
        return <ProductDetailsSkeleton />;
    }

    if (isError || !product) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <h2 className="text-2xl font-bold">
                        Produto não encontrado
                    </h2>
                    <p className="text-muted-foreground">
                        O produto que você procura não existe ou foi removido.
                    </p>
                    <Button onClick={() => navigate("/")}>
                        Voltar para o Início
                    </Button>
                </div>
            </div>
        );
    }

    const discount =
        product.originalPrice && product.originalPrice > product.price
            ? Math.round(
                  ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
              )
            : 0;

    const handleAddToCart = () => {
        const cartItem: CartItem = {
            id: product.id,
            name: product.name,
            price: product.price, // Já está em centavos
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
                    <span>"{product.name}" foi adicionado.</span>
                </div>
            ),
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link copiado!",
            description:
                "Link do produto copiado para a área de transferência.",
        });
    };

    const formatArrayData = (data: any): string => {
        if (Array.isArray(data)) return data.join(", ");
        return data || "";
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="container py-8 flex-1">
                {/* Breadcrumb / Botão Voltar */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 hover:bg-transparent hover:text-primary"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* COLUNA DA ESQUERDA: Imagens */}
                    <div className="space-y-4">
                        <div className="aspect-square w-full bg-muted rounded-xl overflow-hidden border relative">
                            <img
                                src={selectedImage || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-contain p-4"
                            />
                            {product.isPromotion && discount > 0 && (
                                <Badge className="absolute top-4 right-4 text-lg px-3 py-1 bg-destructive text-destructive-foreground">
                                    -{discount}%
                                </Badge>
                            )}
                        </div>

                        {/* Galeria de Miniaturas */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                            selectedImage === img
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-transparent hover:border-muted-foreground/50"
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`View ${idx}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUNA DA DIREITA: Informações */}
                    <div className="flex flex-col space-y-6">
                        <div>
                            <div className="flex justify-between items-start">
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                    {product.name}
                                </h1>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-sm">
                                    {product.category === "aparelho"
                                        ? "Aparelho"
                                        : "Acessório"}
                                </Badge>
                                {product.storage && (
                                    <Badge
                                        variant="secondary"
                                        className="text-sm"
                                    >
                                        {product.storage}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {product.originalPrice &&
                                product.originalPrice > product.price && (
                                    <span className="text-lg text-muted-foreground line-through block">
                                        {formatCurrency(product.originalPrice)}
                                    </span>
                                )}
                            <span className="text-4xl font-bold text-primary block">
                                {formatCurrency(product.price)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                À vista ou parcelado conforme condições da loja.
                            </span>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">
                                Especificações
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {product.storage && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                        <HardDrive className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium">
                                                Armazenamento
                                            </p>
                                            <p className="text-muted-foreground">
                                                {product.storage}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {product.ram && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                        <Cpu className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium">
                                                Memória RAM
                                            </p>
                                            <p className="text-muted-foreground">
                                                {product.ram}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {product.colors &&
                                    product.colors.length > 0 && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                                            <Palette className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-medium">
                                                    Cores Disponíveis
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {formatArrayData(
                                                        product.colors
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {product.description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">
                                    Descrição
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3 p-4 border rounded-xl bg-card">
                            <div className="flex items-center gap-2 font-medium">
                                <StoreIcon className="h-5 w-5 text-primary" />
                                <span>Disponibilidade nas Lojas</span>
                            </div>

                            {product.stores && product.stores.length > 0 ? (
                                <>
                                    <Select
                                        onValueChange={(val) =>
                                            setSelectedStore(
                                                product.stores.find(
                                                    (s) => s.id === val
                                                ) || null
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma loja para ver detalhes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {product.stores.map((store) => (
                                                <SelectItem
                                                    key={store.id}
                                                    value={store.id}
                                                >
                                                    {store.name} ({store.city})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedStore && (
                                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-2">
                                            <p className="font-medium text-foreground">
                                                {selectedStore.name}
                                            </p>
                                            <p>Cidade: {selectedStore.city}</p>
                                            <p className="mt-1">
                                                WhatsApp:{" "}
                                                {selectedStore.whatsapp}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Consulte disponibilidade online.
                                </p>
                            )}
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-lg h-14"
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="mr-2 h-6 w-6" />
                            Adicionar ao Carrinho
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Componente de Carregamento (Skeleton)
const ProductDetailsSkeleton = () => (
    <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container py-8 flex-1">
            <div className="mb-6">
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-px w-full" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-14 w-full" />
                </div>
            </div>
        </main>
    </div>
);

export default ProductDetails;
