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
import { Loader2, Lock, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPaymentIntent } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface StripeCheckoutProps {
    amount: number; // Em centavos
    storeId: string;
    storePublicKey: string;
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

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin, // Retorna pra home em caso de redirect
                },
                redirect: "if_required",
            });

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Erro no pagamento",
                    description: error.message,
                });
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                onSuccess(paymentIntent.id);
            } else {
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            setIsProcessing(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 border rounded-lg bg-white mt-4 shadow-sm animate-in fade-in"
        >
            <div className="flex items-center gap-2 text-sm font-medium mb-2 text-blue-600">
                <CreditCard className="h-4 w-4" /> Pagamento Seguro
            </div>

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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isProcessing || !stripe}
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    ) : (
                        <Lock className="mr-2 h-4 w-4" />
                    )}
                    Pagar {formatCurrency(amount)}
                </Button>
            </div>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (storePublicKey) {
            setStripePromise(loadStripe(storePublicKey));
        }
    }, [storePublicKey]);

    useEffect(() => {
        const initPayment = async () => {
            try {
                const { clientSecret } = await createPaymentIntent(
                    amount,
                    storeId
                );
                setClientSecret(clientSecret);
            } catch (err: any) {
                console.error("Erro ao iniciar pagamento:", err);
                setError(
                    "Não foi possível iniciar o pagamento. Verifique as configurações da loja."
                );
            }
        };

        if (amount > 0 && storeId) {
            initPayment();
        }
    }, [amount, storeId]);

    if (error)
        return (
            <div className="text-destructive text-sm p-4 border border-destructive/20 rounded-md bg-destructive/10">
                {error}
            </div>
        );

    if (!clientSecret || !stripePromise) {
        return (
            <div className="flex justify-center py-8">
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
