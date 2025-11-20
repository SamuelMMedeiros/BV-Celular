import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string;
    className?: string;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionLink,
    className,
}: EmptyStateProps) => {
    return (
        <div
            className={`flex flex-col items-center justify-center py-16 text-center animate-fade-in ${className}`}
        >
            <div className="bg-muted/50 p-6 rounded-full mb-4 transition-transform hover:scale-110 duration-300">
                <Icon className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                {description}
            </p>
            {actionLabel && actionLink && (
                <Button
                    asChild
                    variant="default"
                    size="lg"
                    className="rounded-full px-8"
                >
                    <Link to={actionLink}>{actionLabel}</Link>
                </Button>
            )}
        </div>
    );
};
