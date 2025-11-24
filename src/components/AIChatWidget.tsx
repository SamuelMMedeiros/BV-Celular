/**
 * @title src/components/AIChatWidget.tsx
 * @collapsible
 */
import { useState, useRef, useEffect } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateAIChatResponse } from "@/lib/api"; // NOVO: Importar a função de API
import { useToast } from "@/hooks/use-toast"; // NOVO: Para feedback de erro

type Message = {
    id: number;
    text: string;
    sender: "user" | "ai";
};

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Olá! Eu sou o assistente virtual da BV Celular. Como posso ajudar você a encontrar o produto ideal?",
            sender: "ai",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false); // NOVO: Estado de loading da IA
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Scrolla para o fim a cada nova mensagem
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === "" || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            text: input,
            sender: "user",
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            // Mapeia o histórico para o formato da API: { text: string; sender: "user" | "ai" }
            const apiHistory = newMessages.map((msg) => ({
                text: msg.text,
                sender: msg.sender,
            }));

            // CHAMA A FUNÇÃO DE API REAL
            const { response: aiText } = await generateAIChatResponse(
                apiHistory
            );

            const aiResponse: Message = {
                id: Date.now() + 1,
                text: aiText,
                sender: "ai",
            };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro no Chat",
                description:
                    "Não foi possível conectar com o assistente. Tente novamente mais tarde.",
            });
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "Desculpe, ocorreu um erro ao processar sua solicitação. Verifique sua conexão ou a configuração da API no backend.",
                    sender: "ai",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Botão Flutuante (Fechado) */}
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all z-50"
                size="icon"
                aria-label="Abrir Chat com IA"
                style={{ display: isOpen ? "none" : "flex" }}
            >
                <Bot className="h-6 w-6" />
            </Button>

            {/* Janela de Chat (Aberta) */}
            <div
                className={`fixed bottom-0 right-0 h-full max-h-[80vh] w-full max-w-sm sm:bottom-6 sm:right-6 sm:h-[600px] transition-transform duration-300 ease-in-out bg-white dark:bg-slate-900 border shadow-2xl rounded-lg flex flex-col z-50 ${
                    isOpen
                        ? "translate-y-0 opacity-100"
                        : "translate-y-full sm:translate-y-0 sm:opacity-0 sm:pointer-events-none"
                }`}
            >
                <Card className="flex flex-col h-full border-none">
                    <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bot className="h-5 w-5 text-blue-600" />
                            Assistente de Compras
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            aria-label="Fechar Chat"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 overflow-hidden">
                        {/* ScrollArea com ref para auto-scroll */}
                        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${
                                            msg.sender === "user"
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
                                                msg.sender === "user"
                                                    ? "bg-blue-600 text-white rounded-br-none"
                                                    : "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
                                            }`}
                                        >
                                            {msg.sender === "ai" && (
                                                <div className="flex items-center mb-1 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                                    <Avatar className="h-4 w-4 mr-1">
                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px]">
                                                            <Bot className="h-3 w-3" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    IA
                                                </div>
                                            )}
                                            <p className="text-sm break-words whitespace-pre-wrap">
                                                {msg.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] p-3 rounded-xl shadow-sm bg-gray-100 dark:bg-slate-800 rounded-tl-none">
                                            <span className="animate-pulse text-sm text-muted-foreground">
                                                Digitando...
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="border-t p-4">
                        <div className="flex w-full space-x-2">
                            <Textarea
                                placeholder="Digite sua pergunta..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                className="min-h-[40px] max-h-[100px] resize-none pr-10"
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                size="icon"
                                onClick={handleSend}
                                disabled={input.trim() === "" || isLoading}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
};

export default AIChatWidget;
