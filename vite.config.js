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
    // ✅ ESTRATEGIA SIMPLE: Dejar que Vite maneje todo automáticamente
    target: 'es2015',
    minify: 'terser', // Cambiar a terser para mejor manejo de dependencias
    sourcemap: false, // Desactivar sourcemaps para reducir complejidad
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // ✅ CHUNKING AUTOMÁTICO SIMPLE - Solo separar vendors grandes
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'ui-framework': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'charts': ['recharts'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'animations': ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 3000
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
    // ✅ ESTRATEGIA SIMPLE: Solo pre-bundle lo esencial
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'framer-motion'
    ],
    esbuildOptions: {
      target: 'es2015'
    }
  },
  esbuild: {
    // Optimizaciones de esbuild
    target: 'esnext',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
