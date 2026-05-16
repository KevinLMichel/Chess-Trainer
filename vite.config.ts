/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Chess-Trainer/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'pieces/*.svg'],
      manifest: {
        name: "Queen's Gambit Trainer",
        short_name: 'QG Trainer',
        description: "Offline-first Queen's Gambit opening practice.",
        theme_color: '#08090d',
        background_color: '#08090d',
        display: 'standalone',
        scope: '/Chess-Trainer/',
        start_url: '/Chess-Trainer/',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        navigateFallback: '/Chess-Trainer/index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
  },
})
