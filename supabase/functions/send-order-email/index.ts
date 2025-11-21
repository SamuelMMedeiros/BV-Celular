/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  clientName: string
  orderId: string
  total: string
  items: { name: string; quantity: number; price: number }[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, clientName, orderId, total, items }: EmailRequest = await req.json()

    // Monta a lista de itens em HTML simples
    const itemsHtml = items.map(item => 
      `<li>${item.quantity}x ${item.name} - R$ ${(item.price / 100).toFixed(2)}</li>`
    ).join('')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'BV Celular <onboarding@resend.dev>', // Use seu domínio verificado se tiver, ou este padrão do Resend
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1>Olá, ${clientName}!</h1>
            <p>Recebemos seu pedido com sucesso.</p>
            
            <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Pedido #${orderId.substring(0, 8).toUpperCase()}</h3>
              <ul>${itemsHtml}</ul>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <p><strong>Total: ${total}</strong></p>
            </div>

            <p>Você será notificado assim que o pedido sair para entrega.</p>
            <p>Equipe BV Celular</p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})