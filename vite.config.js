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
    })
    // PWA temporalmente deshabilitado para debugging
  ],
  server: {
    port: 5174,
    host: '0.0.0.0', // Permite acceso desde cualquier IP en la red local
    open: true,
    hmr: {
      overlay: false // Desactiva overlay de errores que puede ralentizar
    },
    proxy: {
      // Proxy para Firebase Storage - evita CORS en desarrollo
      '/__storage': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__storage/, ''),
        secure: true
      }
    },
    watch: {
      // Optimizar file watching
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/backup/**']
    }
  },
  build: {
    target: 'es2015',
    minify: 'esbuild', // ✅ esbuild es 20-40x más rápido que terser
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ Estrategia estática para evitar dependencias circulares
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'charts': ['recharts'],
          'animations': ['framer-motion'],
          'pdf-utils': ['jspdf', 'html2canvas'],
          'excel-utils': ['exceljs'],
          'date-utils': ['date-fns']
        }
      }
    }
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
    },
    dedupe: ['react', 'react-dom'] // ✅ Deduplicate React
  },
  define: {
    // ✅ Fix para Firebase en Vite - Configuración mejorada
    global: 'globalThis',
    'process.env': {},
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'framer-motion',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'exceljs', // ✅ Reincluido para evitar error de export
      'react-window' // ✅ Virtualización (Liquidaciones V2)
    ],
    exclude: [
      // Excluir solo paquetes realmente problemáticos
      'html2canvas',
      'jspdf'
    ],
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'top-level-await': true
      }
    }
  },
  esbuild: {
    // Optimizaciones de esbuild
    target: 'esnext',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
