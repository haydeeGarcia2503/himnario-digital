
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Guardar los logos para que funcionen sin Internet
      includeAssets: [
        'logo-iglesia-sin-fondo.png',
        'icon-iglesia-sin-fondo.png',
      ],

      manifest: {
        name: 'Himnario Digital',
        short_name: 'Himnario',
        description: 'Himnario digital de la Iglesia de Dios (7° día).',
        theme_color: '#172B4D',
        background_color: '#E8EDF3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-iglesia-sin-fondo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
