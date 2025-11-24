/**
 * @title src/components/MarkdownEditor.tsx
 * @collapsible
 */
import { Textarea } from "@/components/ui/textarea";
import { type TextareaProps } from "@/components/ui/textarea";
import { EditIcon } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

// Este componente envolve o Textarea, adicionando uma indicação visual de suporte a Markdown.
// O TooltipProvider foi incluído aqui para garantir que a dica funcione.

const MarkdownEditor = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className="relative">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <EditIcon className="absolute top-3 right-3 h-4 w-4 text-primary/50 z-10 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            Campo com suporte a formatação Markdown.
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Textarea
                    ref={ref}
                    {...props}
                    className="pr-10 h-32 resize-none" // Adicionado padding para o ícone
                />
            </div>
        );
    }
);

MarkdownEditor.displayName = "MarkdownEditor";

export { MarkdownEditor };
