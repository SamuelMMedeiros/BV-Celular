/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPaymentIntent } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// OBS: Em produção, você usaria sua chave pública principal ou buscaria do banco se for multi-tenant real no front.
// Para o MVP white-label, podemos usar uma chave pública genérica ou passar via props se já tiver carregado a loja.
// Mas o ideal é carregar o stripePromise dinamicamente com a chave pública da loja.
// Para simplificar este passo, vamos assumir que passamos a chave pública da loja selecionada.

interface StripeCheckoutProps {
    amount: number; // Em centavos
    storeId: string;
    storePublicKey: string; // A chave pública da loja selecionada
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

const CheckoutForm = ({
    amount,
    onSuccess,
    onCancel,
}: {
    amount: number;
    onSuccess: (pid: string) => void;
    onCancel: () => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Em caso de redirecionamento (ex: 3DSecure), para onde voltar?
                return_url: window.location.href,
            },
            redirect: "if_required", // Tenta não redirecionar se não precisar
        });

        if (error) {
            toast({
                variant: "destructive",
                title: "Erro no pagamento",
                description: error.message,
            });
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast({
                title: "Pagamento Aprovado!",
                description: "Seu pedido foi confirmado.",
            });
            onSuccess(paymentIntent.id);
        } else {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <PaymentElement />

            <div className="flex gap-3 pt-4">
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isProcessing || !stripe}
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin mr-2" />
                    ) : (
                        <Lock className="mr-2 h-4 w-4" />
                    )}
                    Pagar {formatCurrency(amount / 100)}
                </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Pagamento processado de forma
                segura pelo Stripe.
            </p>
        </form>
    );
};

export const StripeCheckout = ({
    amount,
    storeId,
    storePublicKey,
    onSuccess,
    onCancel,
}: StripeCheckoutProps) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePromise, setStripePromise] = useState<any>(null);

    useEffect(() => {
        // 1. Carrega o Stripe com a chave pública da loja
        if (storePublicKey) {
            setStripePromise(loadStripe(storePublicKey));
        }

        // 2. Pede ao backend (Edge Function) para criar a intenção
        const initPayment = async () => {
            try {
                const { clientSecret } = await createPaymentIntent(
                    amount,
                    storeId
                );
                setClientSecret(clientSecret);
            } catch (error) {
                console.error(error);
            }
        };
        initPayment();
    }, [amount, storeId, storePublicKey]);

    if (!clientSecret || !stripePromise) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
        >
            <CheckoutForm
                amount={amount}
                onSuccess={onSuccess}
                onCancel={onCancel}
            />
        </Elements>
    );
};
