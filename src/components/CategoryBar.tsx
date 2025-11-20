import {
    Smartphone,
    Headphones,
    Watch,
    PlugZap,
    CaseUpper,
    Speaker,
    Cable,
    Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Definindo as categorias visuais
const CATEGORIES = [
    { id: "all", label: "Tudo", icon: null }, // Ícone null = botão "Todos"
    {
        id: "smartphones",
        label: "Celulares",
        icon: Smartphone,
        query: "celular",
    },
    { id: "cases", label: "Capas", icon: CaseUpper, query: "capa" },
    {
        id: "chargers",
        label: "Carregadores",
        icon: PlugZap,
        query: "carregador",
    },
    { id: "audio", label: "Áudio", icon: Headphones, query: "fone" },
    { id: "smartwatch", label: "Smartwatch", icon: Watch, query: "watch" },
    { id: "speakers", label: "Caixas Som", icon: Speaker, query: "caixa" },
    { id: "cables", label: "Cabos", icon: Cable, query: "cabo" },
    { id: "games", label: "Games", icon: Gamepad2, query: "game" },
];

interface CategoryBarProps {
    selectedCategory: string;
    onSelectCategory: (categoryId: string, query?: string) => void;
}

export const CategoryBar = ({
    selectedCategory,
    onSelectCategory,
}: CategoryBarProps) => {
    return (
        <div className="w-full border-b bg-background/50 backdrop-blur-sm sticky top-16 z-40 shadow-sm">
            <div className="container py-3">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;

                        return (
                            <Button
                                key={cat.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                    onSelectCategory(cat.id, cat.query)
                                }
                                className={cn(
                                    "rounded-full flex items-center gap-2 transition-all whitespace-nowrap h-9 px-4 border-input hover:border-primary hover:bg-accent",
                                    isSelected
                                        ? "shadow-md scale-105 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "text-muted-foreground"
                                )}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {cat.label}
                            </Button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
