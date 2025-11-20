/* eslint-disable @typescript-eslint/ban-ts-comment */
// Siga a documentação do Supabase para deploy de functions:
// https://supabase.com/docs/guides/functions

// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de CORS (para o navegador aceitar a resposta)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { amount, storeId } = await req.json()

    // 1. Buscar a chave secreta da loja no banco
    const { data: store, error: storeError } = await supabase
      .from('Stores')
      .select('stripe_secret_key')
      .eq('id', storeId)
      .single()

    if (storeError || !store?.stripe_secret_key) {
      throw new Error('Loja não configurada para pagamentos ou chave inválida.')
    }

    // 2. Inicializar o Stripe com a chave da loja
    const stripe = new Stripe(store.stripe_secret_key, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 3. Criar o PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Valor em centavos (ex: 1000 = R$ 10,00)
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
    })

    // 4. Retornar o "client_secret" para o Frontend
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})