import { useEffect, useState } from 'react';

/**
 * Hook para registrar y gestionar Service Worker - FASE 2
 * Proporciona cache persistente para optimización Firebase
 * ✅ MODO SEGURO: No falla si el SW no está disponible
 */
const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ Verificar soporte para Service Worker
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      
      // 🛡️ Solo registrar en producción o cuando esté habilitado
      if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true') {
        registerServiceWorker();
      } else {
        console.log('🚧 Service Worker deshabilitado en desarrollo');
      }
    } else {
      console.warn('⚠️ Service Worker no soportado en este navegador');
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('🚀 Registrando Service Worker para cache Firebase...');
      
      // ✅ Verificar que el archivo existe antes de registrar
      const swPath = '/firebase-cache-sw.js';
      const response = await fetch(swPath, { method: 'HEAD' }).catch(() => null);
      
      if (!response || !response.ok) {
        console.warn('⚠️ Service Worker file not found, skipping registration');
        return;
      }
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/'
      });

      console.log('✅ Service Worker registrado:', registration.scope);
      setIsRegistered(true);

      // 📊 Escuchar actualizaciones del SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker actualizándose...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('✅ Service Worker actualizado y activo');
          }
        });
      });

      // 🎯 Configurar comunicación con SW
      if (navigator.serviceWorker.controller) {
        setupSWMessaging();
      }

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      setError(error.message);
    }
  };

  const setupSWMessaging = () => {
    // 📊 Recibir métricas del SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'CACHE_HIT':
          console.log('🚀 SW Cache Hit:', data.key);
          break;
        case 'CACHE_MISS':
          console.log('🔥 SW Cache Miss:', data.key);
          break;
        case 'CACHE_CLEANED':
          console.log('🧹 SW Cache Cleaned:', data.count, 'entries');
          break;
      }
    });
  };

  // 🧹 Función para limpiar cache manualmente
  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE'
        });
        console.log('🧹 Cache limpiado por solicitud manual');
      } catch (error) {
        console.error('❌ Error limpiando cache:', error);
      }
    }
  };

  // 📊 Función para obtener estadísticas del cache
  const getCacheStats = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_CACHE_STATS'
        }, [channel.port2]);
      });
    }
    return null;
  };

  return {
    isRegistered,
    isSupported,
    error,
    clearCache,
    getCacheStats
  };
};

export default useServiceWorker;
