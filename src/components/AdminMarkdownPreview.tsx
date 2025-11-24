import React from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye } from "lucide-react";

interface AdminMarkdownPreviewProps {
    content: string;
}

const AdminMarkdownPreview: React.FC<AdminMarkdownPreviewProps> = ({
    content,
}) => {
    return (
        <Card className="mt-4 border-dashed bg-background/50">
            <CardHeader className="p-3 border-b">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Eye className="h-4 w-4" /> Pré-visualização da Descrição
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {content ? (
                    <ScrollArea className="h-[200px] p-2 rounded-md border bg-card">
                        <MarkdownRenderer content={content} />
                    </ScrollArea>
                ) : (
                    <p className="text-muted-foreground text-sm italic">
                        Digite no campo de descrição acima ou gere com a IA para
                        ver a pré-visualização.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export { AdminMarkdownPreview };
