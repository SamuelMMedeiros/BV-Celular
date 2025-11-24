import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    // Componente que renderiza a string Markdown.
    // Usamos o plugin remarkGfm para compatibilidade com tabelas, listas de tarefas, etc.
    
    return (
        <div className={className || ""}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                // Adicionando estilos básicos para garantir que o Markdown seja legível
                components={{
                    h1: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
                    h2: ({ node, ...props }) => <h4 className="text-lg font-bold mt-3 mb-1 text-foreground" {...props} />,
                    h3: ({ node, ...props }) => <h5 className="text-base font-semibold mt-3 mb-1 text-foreground" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-2 text-muted-foreground leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside ml-4 space-y-1 text-muted-foreground" {...props} />,
                    li: ({ node, ...props }) => <li className="text-sm" {...props} />,
                    a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                    // Adicionando suporte a código e quebra de linha
                    code: ({ node, inline, ...props }) => (
                        <code className={inline ? "bg-muted px-1 py-0.5 rounded text-sm font-mono" : "block bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm"} {...props} />
                    ),
                    pre: ({ node, ...props }) => <pre {...props} className="bg-muted p-3 rounded-md overflow-x-auto text-sm" />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground/80 my-4" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export { MarkdownRenderer };