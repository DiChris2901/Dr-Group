import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimizaciones para React
      fastRefresh: true,
      include: "**/*.{jsx,tsx}",
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
