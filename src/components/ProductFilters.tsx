import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";

interface ProductFiltersProps {
    products: Product[];
    onFilterChange: (filteredProducts: Product[]) => void;
    className?: string;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const ProductFilters = ({
    products,
    onFilterChange,
    className,
    isMobileOpen,
    onMobileClose,
}: ProductFiltersProps) => {
    // 1. Analisar os dados disponíveis para criar opções dinâmicas
    const options = useMemo(() => {
        // Extrai marcas únicas
        const brands = Array.from(
            new Set(products.map((p) => p.brand).filter(Boolean) as string[])
        ).sort();

        // Extrai cores únicas (normalizando strings e arrays)
        const colors = Array.from(
            new Set(
                products
                    .flatMap((p) => {
                        if (Array.isArray(p.colors)) return p.colors;
                        if (typeof p.colors === "string")
                            return (p.colors as string)
                                .split(",")
                                .map((c) => c.trim());
                        return [];
                    })
                    .filter(Boolean)
            )
        ).sort();

        // Define range de preços real
        const prices = products.map((p) => p.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000000;

        return { brands, colors, minPrice, maxPrice };
    }, [products]);

    // Estados dos Filtros
    // Inicializa com o range total detectado
    const [priceRange, setPriceRange] = useState<[number, number]>([
        0, 1000000,
    ]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    // Atualiza o slider quando os dados carregam
    useEffect(() => {
        if (options.maxPrice > 0) {
            // Se o range atual for o padrão ou maior que o novo max, ajusta
            setPriceRange([options.minPrice, options.maxPrice]);
        }
    }, [options.minPrice, options.maxPrice]);

    // Lógica de Filtragem
    useEffect(() => {
        const filtered = products.filter((product) => {
            // 1. Preço
            if (product.price < priceRange[0] || product.price > priceRange[1])
                return false;

            // 2. Marca (se houver seleção)
            if (selectedBrands.length > 0) {
                if (!product.brand || !selectedBrands.includes(product.brand))
                    return false;
            }

            // 3. Cor (se houver seleção)
            if (selectedColors.length > 0) {
                const productColors = Array.isArray(product.colors)
                    ? product.colors
                    : [];
                const hasColor = productColors.some((c) =>
                    selectedColors.includes(c)
                );
                // Se o produto não tem cor definida, não mostramos se o filtro de cor estiver ativo
                if (!hasColor && productColors.length > 0) return false;
            }

            return true;
        });

        onFilterChange(filtered);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceRange, selectedBrands, selectedColors, products]);

    const toggleBrand = (brand: string) => {
        setSelectedBrands((prev) =>
            prev.includes(brand)
                ? prev.filter((b) => b !== brand)
                : [...prev, brand]
        );
    };

    const toggleColor = (color: string) => {
        setSelectedColors((prev) =>
            prev.includes(color)
                ? prev.filter((c) => c !== color)
                : [...prev, color]
        );
    };

    const clearFilters = () => {
        setPriceRange([options.minPrice, options.maxPrice]);
        setSelectedBrands([]);
        setSelectedColors([]);
    };

    return (
        <div
            className={`bg-background p-6 border-r h-full overflow-y-auto scrollbar-thin ${className} ${
                isMobileOpen
                    ? "fixed inset-0 z-50 w-full md:w-auto md:static md:block"
                    : "hidden md:block"
            }`}
        >
            {/* Header Mobile */}
            {isMobileOpen && (
                <div className="flex justify-between items-center mb-6 md:hidden">
                    <h2 className="text-xl font-bold">Filtros</h2>
                    <Button variant="ghost" size="icon" onClick={onMobileClose}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            )}

            <div className="space-y-8">
                {/* Cabeçalho Desktop */}
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Filtrar por</h3>
                    {(selectedBrands.length > 0 ||
                        selectedColors.length > 0) && (
                        <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-destructive"
                            onClick={clearFilters}
                        >
                            Limpar tudo
                        </Button>
                    )}
                </div>

                {/* FILTRO DE PREÇO (Slider Duplo) */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm">Faixa de Preço</h4>
                    {/* Slider aceita array [min, max] para renderizar duas bolinhas */}
                    <Slider
                        value={priceRange}
                        min={options.minPrice}
                        max={options.maxPrice}
                        step={1000} // Passos de R$ 10,00 (centavos)
                        onValueChange={(val) =>
                            setPriceRange(val as [number, number])
                        }
                        className="py-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                    </div>
                </div>

                <Separator />

                {/* FILTRO DE MARCA (Dinâmico) */}
                {options.brands.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm">Marcas</h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                            {options.brands.map((brand) => (
                                <div
                                    key={brand}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`brand-${brand}`}
                                        checked={selectedBrands.includes(brand)}
                                        onCheckedChange={() =>
                                            toggleBrand(brand)
                                        }
                                    />
                                    <Label
                                        htmlFor={`brand-${brand}`}
                                        className="text-sm cursor-pointer leading-none font-normal"
                                    >
                                        {brand}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {options.brands.length > 0 && options.colors.length > 0 && (
                    <Separator />
                )}

                {/* FILTRO DE COR (Dinâmico) */}
                {options.colors.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm">Cores</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {options.colors.map((color) => (
                                <div
                                    key={color}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`color-${color}`}
                                        checked={selectedColors.includes(color)}
                                        onCheckedChange={() =>
                                            toggleColor(color)
                                        }
                                    />
                                    <div className="flex items-center gap-2 cursor-pointer">
                                        {/* Pequena bolinha de cor se possível, ou apenas texto */}
                                        <Label
                                            htmlFor={`color-${color}`}
                                            className="text-sm leading-none font-normal capitalize"
                                        >
                                            {color}
                                        </Label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botão Aplicar Mobile */}
                {isMobileOpen && (
                    <div className="pt-4 md:hidden">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={onMobileClose}
                        >
                            Ver Resultados
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
