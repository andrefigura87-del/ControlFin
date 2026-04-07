import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'], // Apenas arquivos existentes na public/
      manifest: {
        name: 'ControlFin - Gestão Financeira',
        short_name: 'ControlFin',
        description: 'Gestão financeira pessoal e familiar completa com Supabase e FSD.',
        theme_color: '#10b981',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
