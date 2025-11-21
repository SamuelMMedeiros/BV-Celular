import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();
clientsClaim();

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "BV Celular";
    const options = {
        body: data.body || "Nova oferta disponível!",
        icon: "/icons/-192x192.png",
        badge: "/icons/-48x48.png",
        image: data.image,
        data: {
            url: data.url || "/",
        },
        actions: [
            { action: "open", title: "Ver Oferta" },
        ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Abre a URL
                const urlToOpen = event.notification.data.url;
                if (clients.openWindow) return clients.openWindow(urlToOpen);
            })
    );
});
