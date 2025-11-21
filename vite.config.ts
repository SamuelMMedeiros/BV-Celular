//
// === CÓDIGO COMPLETO PARA: vite.config.ts ===
//
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      
      // Arquivos estáticos a serem cacheados
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'icons/*.png'], 
      
      devOptions: {
        enabled: true,
        type: 'module', // Garante que imports funcionem em dev
        navigateFallback: 'index.html',
      },

      manifest: {
        name: "BVCelular",
        short_name: "BVCelular",
        description: "Sua loja de eletrônicos e acessórios.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait",
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
            purpose: 'any maskable'
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