import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa"; // <-- IMPORTAR

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // --- CONFIGURAÇÃO DO PWA ---
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando faz deploy novo
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'], // Arquivos estáticos extras
      manifest: {
        name: 'BV Celular',
        short_name: 'BV Celular',
        description: 'Sua loja de smartphones e acessórios.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Isso faz parecer um app nativo (sem barra de URL)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png', // precisará criar essa imagem
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png', // precisará criar essa imagem
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));