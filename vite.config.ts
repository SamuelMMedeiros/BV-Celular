//
// === CÓDIGO COMPLETO PARA: vite.config.ts ===
//
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
      registerType: 'autoUpdate',
      // Adicione os arquivos estáticos que devem ser cacheados
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'icons/*.png'], 
      
      devOptions: {
        enabled: true,
        type: 'module',
      },

      manifest: {
        name: "BVCelular",
        short_name: "BVCelular",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "icons/-48x48.png",
            sizes: "48x48",
            type: "image/png"
          },
          {
            src: "icons/-72x72.png",
            sizes: "72x72",
            type: "image/png"
          },
          {
            src: "icons/-96x96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "icons/-128x128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "icons/-144x144.png",
            sizes: "144x144",
            type: "image/png"
          },
          {
            src: "icons/-152x152.png",
            sizes: "152x152",
            type: "image/png"
          },
          {
            src: "icons/-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: 'any maskable' //para compatibilidade Android
          },
          {
            src: "icons/-256x256.png",
            sizes: "256x256",
            type: "image/png"
          },
          {
            src: "icons/-384x384.png",
            sizes: "384x384",
            type: "image/png"
          },
          {
            src: "icons/-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: 'any maskable' // para compatibilidade Android
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