/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_VAPID_KEY = "BJAwxHs45rDjqTvNLQxPekSBPzS9N3_1gTCTvIk5-sXqHZCO7-lGNrdeWwu0MBbphhDUV5iBiF0dzHUo8yB3qiE";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(userId?: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error("Push notifications não suportadas neste navegador.");
  }

  const registration = await navigator.serviceWorker.ready;

  // Verifica se já existe inscrição
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
      return existingSubscription; // Já inscrito
  }

  // Cria nova inscrição
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
  });

  // Salva no Supabase
  const p256dh = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (p256dh && auth) {
      const { error } = await supabase.from('PushSubscriptions').insert({
          user_id: userId || null,
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(p256dh) as any)),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(auth) as any))
      });

      if (error) console.error("Erro ao salvar inscrição no banco:", error);
  }

  return subscription;
}