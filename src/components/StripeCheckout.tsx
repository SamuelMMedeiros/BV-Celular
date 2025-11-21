/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPaymentIntent } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface StripeCheckoutProps {
    amount: number; // Valor em centavos
    storeId: string;
    storePublicKey: string; // Chave pública da loja específica
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

// Componente interno do formulário
const CheckoutForm = ({ amount, onSuccess, onCancel }: { amount: number, onSuccess: (pid: string) => void, onCancel: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js ainda não carregou
            return;
        }

        setIsProcessing(true);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // URL para onde o usuário é redirecionado após o pagamento (se necessário, ex: 3DSecure)
                    // Para pagamentos simples (cartão/pix direto), o redirect: "if_required" evita o reload da página.
                    return_url: window.location.origin, 
                },
                redirect: "if_required", 
            });

            if (error) {
                toast({ 
                    variant: "destructive", 
                    title: "Erro no pagamento", 
                    description: error.message || "Ocorreu um erro desconhecido."
                });
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                // Sucesso imediato
                onSuccess(paymentIntent.id);
            } else {
                // Status pendente ou processando (ex: boleto/pix assíncrono)
                // Nesses casos, geralmente dependemos do Webhook, mas aqui liberamos o fluxo
                toast({ title: "Processando", description: "Aguardando confirmação do pagamento." });
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Erro de conexão", description: "Tente novamente." });
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white dark:bg-slate-900 mt-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-medium mb-4 text-blue-600 dark:text-blue-400">
                <CreditCard className="h-4 w-4" /> Pagamento Seguro
            </div>
            
            {/* O Elemento do Stripe monta os inputs de Cartão/Pix automaticamente */}
            <PaymentElement />
            
            <div className="flex gap-3 pt-6">
                <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1" 
                    onClick={onCancel} 
                    disabled={isProcessing}
                >
                    Voltar
                </Button>
                <Button 
                    type="submit" 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    disabled={isProcessing || !stripe || !elements}
                >
                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    Pagar {formatCurrency(amount)}
                </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1 mt-2">
                <Lock className="h-3 w-3" /> Seus dados são processados de forma segura pelo Stripe.
            </p>
        </form>
    );
};

// Componente Wrapper que carrega o contexto do Stripe
export const StripeCheckout = ({ amount, storeId, storePublicKey, onSuccess, onCancel }: StripeCheckoutProps) => {
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 1. Carrega a instância do Stripe com a Public Key da loja
    useEffect(() => {
        if (storePublicKey) {
            setStripePromise(loadStripe(storePublicKey));
        }
    }, [storePublicKey]);

    // 2. Solicita ao Backend a criação do PaymentIntent (Client Secret)
    useEffect(() => {
        const initPayment = async () => {
            try {
                const { clientSecret } = await createPaymentIntent(amount, storeId);
                setClientSecret(clientSecret);
            } catch (err: any) {
                console.error("Erro ao iniciar pagamento:", err);
                setError("Não foi possível iniciar o pagamento. Verifique se a loja configurou as chaves do Stripe corretamente.");
            }
        };

        if (amount > 0 && storeId) {
            initPayment();
        }
    }, [amount, storeId]);

    if (error) {
        return (
            <div className="text-destructive text-sm p-4 border border-destructive/20 rounded-md bg-destructive/10 text-center">
                <p className="font-bold mb-1">Erro de Configuração</p>
                {error}
                <Button variant="link" onClick={onCancel} className="mt-2 h-auto p-0 block mx-auto">Voltar</Button>
            </div>
        );
    }

    if (!clientSecret || !stripePromise) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground">Iniciando conexão segura...</p>
            </div>
        );
    }

    return (
        <Elements 
            stripe={stripePromise} 
            options={{ 
                clientSecret, 
                appearance: { 
                    theme: 'stripe',
                    labels: 'floating',
                } 
            }}
        >
            <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
    );
};