/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

serve(async (req: { headers: { get: (arg0: string) => any; }; text: () => any; }) => {
  try {
    // 1. Configuração
    const stripeSignature = req.headers.get('Stripe-Signature')
    if (!stripeSignature) {
      return new Response('No signature', { status: 400 })
    }

    // Variáveis de ambiente (configure no painel do Supabase)
    // Como temos várias lojas, o ideal seria uma chave mestra ou buscar do banco.
    // Para este MVP, vamos assumir que você configura a SECRET KEY da loja principal no ENV do Supabase.
    // Ou, melhor: O webhook do Stripe envia o evento.
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') // Sua chave SK_LIVE ou SK_TEST
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') // Chave WHSEC_...

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 2. Verificar e Construir o Evento
    const body = await req.text()
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret);
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // 3. Processar o Pagamento Bem-Sucedido
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.id;

        console.log(`Pagamento recebido: ${paymentId}`);

        // 4. Atualizar o Pedido no Banco de Dados
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Busca o pedido que tem esse ID de pagamento
        const { data: order, error: searchError } = await supabase
            .from('Orders')
            .select('id, status')
            .eq('stripe_payment_id', paymentId)
            .single();

        if (order) {
            // Atualiza para 'completed' (Pago) se ainda não estiver
            if (order.status !== 'completed') {
                await supabase
                    .from('Orders')
                    .update({ status: 'completed' })
                    .eq('id', order.id);
                
                // Opcional: Baixar estoque aqui se ainda não tiver baixado
                // await supabase.rpc('decrement_stock_by_order', { order_id: order.id });
                
                console.log(`Pedido ${order.id} atualizado para Pago.`);
            }
        } else {
            console.log(`Pedido não encontrado para o pagamento ${paymentId}. Pode ter sido criado apenas a intent sem finalizar o checkout.`);
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})