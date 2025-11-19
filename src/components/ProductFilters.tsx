import { useState, useEffect, useMemo } from "react";
import { Product } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";

interface FilterState {
    priceRange: [number, number];
    selectedBrands: string[];
    selectedColors: string[];
}

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
    // 1. Analisar os dados disponíveis (Marcas, Cores, Preços)
    const options = useMemo(() => {
        const brands = Array.from(
            new Set(products.map((p) => p.brand).filter(Boolean) as string[])
        ).sort();

        // Cores podem vir como array ou string, normalizamos
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

        const prices = products.map((p) => p.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000000; // 10k default

        return { brands, colors, minPrice, maxPrice };
    }, [products]);

    // Estados dos Filtros
    const [priceRange, setPriceRange] = useState<[number, number]>([
        0, 1000000,
    ]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    // Inicializa o range de preço com os valores reais quando carregarem
    useEffect(() => {
        if (options.maxPrice > 0) {
            setPriceRange([options.minPrice, options.maxPrice]);
        }
    }, [options.minPrice, options.maxPrice]);

    // Aplica os filtros sempre que o estado mudar
    useEffect(() => {
        const filtered = products.filter((product) => {
            // Filtro de Preço
            if (product.price < priceRange[0] || product.price > priceRange[1])
                return false;

            // Filtro de Marca
            if (selectedBrands.length > 0) {
                if (!product.brand || !selectedBrands.includes(product.brand))
                    return false;
            }

            // Filtro de Cor
            if (selectedColors.length > 0) {
                const productColors = Array.isArray(product.colors)
                    ? product.colors
                    : [];
                const hasColor = productColors.some((c) =>
                    selectedColors.includes(c)
                );
                if (!hasColor) return false;
            }

            return true;
        });

        onFilterChange(filtered);
    }, [priceRange, selectedBrands, selectedColors, products]); // Remove onFilterChange da dependência para evitar loop se não for memoizado

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

    // Renderização da Interface
    return (
        <div
            className={`bg-background p-6 border-r h-full overflow-y-auto ${className} ${
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
                        selectedColors.length > 0 ||
                        priceRange[0] > options.minPrice ||
                        priceRange[1] < options.maxPrice) && (
                        <Button
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={clearFilters}
                        >
                            Limpar
                        </Button>
                    )}
                </div>

                {/* FILTRO DE PREÇO */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm">Faixa de Preço</h4>
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
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
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
                                        className="text-sm cursor-pointer leading-none"
                                    >
                                        {brand}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {options.brands.length > 0 && <Separator />}

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
                                    <Label
                                        htmlFor={`color-${color}`}
                                        className="text-sm cursor-pointer leading-none capitalize"
                                    >
                                        {color}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botão Aplicar Mobile */}
                {isMobileOpen && (
                    <div className="pt-4 md:hidden">
                        <Button className="w-full" onClick={onMobileClose}>
                            Ver Resultados
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
