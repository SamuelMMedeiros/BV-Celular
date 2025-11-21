/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// supabase/functions/send-push/index.ts
//@ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "https://esm.sh/web-push@3.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CONFIGURAÇÃO VAPID
// A Private Key deve estar configurada nos Secrets do Supabase (VAPID_PRIVATE_KEY)
// A Public Key aqui deve ser EXATAMENTE a mesma usada no frontend (src/lib/pushNotifications.ts)
const vapidKeys = {
  publicKey: "BJAwxHs45rDjqTvNLQxPekSBPzS9N3_1gTCTvIk5-sXqHZCO7-lGNrdeWwu0MBbphhDUV5iBiF0dzHUo8yB3qiE",
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
};

if (!vapidKeys.privateKey) {
  console.error("ERRO: VAPID_PRIVATE_KEY não encontrada nas variáveis de ambiente.");
}

webpush.setVapidDetails(
  'mailto:contato@bvcelular.com.br', // Email de contato obrigatório pelo protocolo
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

serve(async (req) => {
  // 1. Tratamento de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Ler dados da requisição
    const { title, body, url, image } = await req.json()

    // 3. Conectar ao Supabase (usando Service Role para ter acesso total)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Buscar todas as inscrições
    const { data: subscriptions, error: dbError } = await supabase
      .from('PushSubscriptions')
      .select('*')

    if (dbError) {
      throw new Error(`Erro ao buscar inscrições: ${dbError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum dispositivo inscrito.", successCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    let successCount = 0;
    let failureCount = 0;

    // 5. Enviar Notificações em Paralelo
    const notifications = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        // Payload com suporte a imagem grande (Big Picture)
        const payload = JSON.stringify({
          title,
          body,
          url,
          image // URL da imagem (opcional)
        });

        await webpush.sendNotification(pushSubscription, payload);
        successCount++;

      } catch (err) {
        failureCount++;
        console.error(`Falha ao enviar para ${sub.id}:`, err.statusCode);

        // Se o erro for 410 (Gone) ou 404 (Not Found), a inscrição não existe mais no servidor de push
        // Devemos removê-la do nosso banco para não tentar enviar de novo.
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removendo inscrição inválida: ${sub.id}`);
          await supabase.from('PushSubscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(notifications);

    // 6. Retornar Resultado
    return new Response(
      JSON.stringify({ 
        success: true, 
        successCount, 
        failureCount,
        total: subscriptions.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error("Erro geral na function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})