import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'JanRakshak AI',
        short_name: 'JanRakshak',
        description: 'Elite Rural Healthcare AI',
        theme_color: '#2d6a4f',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'https://janrakshak-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
