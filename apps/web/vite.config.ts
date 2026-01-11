/**
 * Vite configuration for the web application
 * 
 * Intent: Configure Vite build tool with React, TypeScript, and PWA support
 * 
 * Input: Vite config options, plugins
 * Output: Configured Vite dev server and build process
 * Side effects: Starts dev server on configured port
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Cola Finance',
        short_name: 'ColaFin',
        description: 'Multi-broker portfolio management',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  },
  build: {
    target: 'es2022'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
