/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { ProductFilters as FiltersType } from "@/lib/api"; // Importa o tipo de filtro
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronLeft, Filter, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchAllProducts } from "@/lib/api";

interface ProductFiltersProps {
    currentFilters: FiltersType;
    setFilters: (filters: FiltersType) => void;
    isMobile?: boolean;
    setOpen?: (open: boolean) => void;
    category: "aparelho" | "acessorio";
}

const SPEC_FILTERS_APARELHO = [
    { key: "brands", label: "Marca" },
    { key: "ram", label: "Memória RAM" },
    { key: "storage", label: "Armazenamento" },
    { key: "battery_capacity", label: "Bateria" },
    { key: "processor_model", label: "Processador" },
];

// Função para extrair valores únicos dos produtos
const extractUniqueValues = (products: any[], key: string): string[] => {
    const values = products
        .flatMap((p) => p[key])
        .filter(Boolean)
        .map(String)
        .map((s) =>
            s
                .trim()
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
        )
        .flat()
        .map((s) => s.replace(/\s*GB|\s*mAh|\s*MP/g, "").trim()) // Simplifica valores
        .filter((v, i, a) => a.indexOf(v) === i && v.length > 0)
        .sort((a, b) => {
            // Tenta ordenar numericamente se for o caso
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

    // Retorna apenas os 10 principais
    return Array.from(new Set(values)).slice(0, 10);
};

const ProductFilters: React.FC<ProductFiltersProps> = ({
    currentFilters,
    setFilters,
    isMobile = false,
    setOpen,
    category,
}) => {
    const [localQuery, setLocalQuery] = useState(currentFilters.q || "");
    // Estado para armazenar os valores únicos disponíveis na base de dados
    const [availableFilters, setAvailableFilters] = useState<
        Record<string, string[]>
    >({});
    const isAparelho = category === "aparelho";

    // Query para buscar todos os produtos (sem filtros) para popular as opções de filtro
    const { data: allProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["allProductsForFilters"],
        queryFn: fetchAllProducts,
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
        select: (data) => data.filter((p) => p.category === category),
    });

    // Efeito para popular as opções de filtro disponíveis
    useEffect(() => {
        if (allProducts && allProducts.length > 0) {
            const newAvailableFilters: Record<string, string[]> = {};
            const specList = isAparelho
                ? SPEC_FILTERS_APARELHO
                : [{ key: "brands", label: "Marca" }]; // Acessórios focam mais em marca

            specList.forEach((spec) => {
                newAvailableFilters[spec.key] = extractUniqueValues(
                    allProducts,
                    spec.key
                );
            });
            setAvailableFilters(newAvailableFilters);
        }
    }, [allProducts, isAparelho]);

    const handleApplyQuery = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ ...currentFilters, q: localQuery.trim() });
    };

    const handleFilterChange = (
        key: string,
        value: string,
        isChecked: boolean
    ) => {
        const currentValues = (currentFilters as any)[key] || [];

        const newValues = isChecked
            ? [...currentValues, value]
            : currentValues.filter((v: string) => v !== value);

        setFilters({ ...currentFilters, [key]: newValues });
    };

    const handleClearFilters = () => {
        setFilters({
            q: "",
            category,
            isPromotion: currentFilters.isPromotion,
        });
        setLocalQuery("");
    };

    const RenderFilterGroup = (key: string, label: string) => {
        const options = availableFilters[key] || [];
        const selectedOptions = (currentFilters as any)[key] || [];

        if (isLoadingProducts) {
            return <Skeleton className="h-10 w-full mb-4" />;
        }
        if (options.length === 0) return null;

        return (
            <AccordionItem value={key}>
                <AccordionTrigger className="font-semibold text-base">
                    {label} ({selectedOptions.length})
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-2">
                        {options.map((option) => (
                            <div
                                key={option}
                                className="flex items-center space-x-2"
                            >
                                <Checkbox
                                    id={`${key}-${option}`}
                                    checked={selectedOptions.includes(option)}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange(
                                            key,
                                            option,
                                            !!checked
                                        )
                                    }
                                />
                                <Label
                                    htmlFor={`${key}-${option}`}
                                    className="text-sm cursor-pointer"
                                >
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        );
    };

    return (
        <div
            className={`p-4 ${isMobile ? "h-full flex flex-col" : "space-y-6"}`}
        >
            {isMobile && (
                <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Filter className="h-5 w-5" /> Filtros
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen?.(false)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>
            )}

            <form onSubmit={handleApplyQuery} className="space-y-4">
                <div className="relative">
                    <Input
                        placeholder="Buscar por nome..."
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        className="pr-10"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    type="button"
                    onClick={handleClearFilters}
                    variant="outline"
                    className="w-full text-xs"
                    disabled={
                        Object.keys(currentFilters).length <= 2 &&
                        !currentFilters.q
                    }
                >
                    Limpar Todos os Filtros
                </Button>
            </form>

            <Separator />

            {/* Filtros de Especificações (Aparelhos) */}
            <Accordion
                type="multiple"
                defaultValue={["brands", "ram"]}
                className="w-full"
            >
                {RenderFilterGroup("brands", "Marca")}
                {isAparelho && RenderFilterGroup("ram", "Memória RAM (GB)")}
                {isAparelho &&
                    RenderFilterGroup("storage", "Armazenamento (GB)")}
                {isAparelho &&
                    RenderFilterGroup(
                        "battery_capacity",
                        "Capacidade Bateria (mAh)"
                    )}
                {isAparelho &&
                    RenderFilterGroup("processor_model", "Processador")}
            </Accordion>
        </div>
    );
};

export { ProductFilters };
