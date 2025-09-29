import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimizaciones para React
      fastRefresh: true,
      include: "**/*.{jsx,tsx}",
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              },
              cacheKeyWillBeUsed: async ({ request }) => `${request.url}`
            }
          },
          {
            urlPattern: /^https:\/\/firebaseapp\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              }
            }
          }
        ]
      },
      includeAssets: ['dr-favicon.svg', 'dr-group-logo.svg', 'robots.txt'],
      manifest: {
        name: 'DR Group Dashboard - Control de Compromisos Financieros',
        short_name: 'DR Group',
        description: 'Sistema empresarial para control de compromisos financieros y gestión de usuarios',
        theme_color: '#1976d2',
        background_color: '#1976d2',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true // Habilita PWA en desarrollo
      }
    })
  ],
  server: {
    port: 5173,
    host: '0.0.0.0', // Permite acceso desde cualquier IP en la red local
    open: true,
    hmr: {
      overlay: false // Desactiva overlay de errores que puede ralentizar
    },
    watch: {
      // Optimizar file watching
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/backup/**']
    }
  },
  build: {
    // Optimizaciones de build
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          framer: ['framer-motion'],
          utils: ['date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@config': '/src/config',
      '@context': '/src/context',
      '@theme': '/src/theme'
    }
  },
  define: {
    // ✅ Fix para Firebase en Vite - Configuración mejorada
    global: 'globalThis',
    'process.env': {},
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  optimizeDeps: {
    // Pre-bundling dependencies para mejor rendimiento
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/functions',
      'framer-motion',
      'date-fns'
    ],
    exclude: ['@firebase/app-types', '@firebase/util', '@firebase/component'],
    force: true // Forzar re-optimización
  },
  esbuild: {
    // Optimizaciones de esbuild
    target: 'esnext',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
