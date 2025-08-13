import { useState, useEffect, useCallback, useRef } from 'react';
import { firestoreCache } from '../utils/FirestoreCache';
import { performanceLogger } from '../utils/PerformanceLogger';

/**
 * Hook para Lazy Loading de datos no críticos - FASE 2
 * Carga datos bajo demanda y con priorización inteligente
 */
const useLazyData = (dataKey, fetchFunction, options = {}) => {
  const {
    priority = 'normal', // 'high', 'normal', 'low'
    ttl = 5 * 60 * 1000, // 5 minutos por defecto
    retryAttempts = 3,
    retryDelay = 1000,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const fetchRef = useRef(null);
  const retryCountRef = useRef(0);

  // 🎯 Queue de prioridades para lazy loading
  const priorityQueue = useRef(new Map([
    ['high', []],
    ['normal', []],
    ['low', []]
  ]));

  // ✅ Verificar si necesita refetch
  const needsRefetch = useCallback(() => {
    if (!lastFetch) return true;
    return (Date.now() - lastFetch) > ttl;
  }, [lastFetch, ttl]);

  // 🚀 Función de fetch optimizada con cache
  const fetchData = useCallback(async (forceRefetch = false) => {
    if (!enabled) return;

    // ✅ Verificar cache primero
    if (!forceRefetch) {
      const cached = firestoreCache.get(dataKey);
      if (cached && !needsRefetch()) {
        setData(cached);
        performanceLogger.logCacheHit('lazy-data', dataKey);
        return cached;
      }
    }

    // 🎯 Agregar a la cola de prioridad
    return new Promise((resolve, reject) => {
      const task = {
        id: Date.now() + Math.random(),
        dataKey,
        fetchFunction,
        resolve,
        reject,
        retryCount: 0
      };

      priorityQueue.current.get(priority).push(task);
      processQueue();
    });
  }, [dataKey, fetchFunction, priority, enabled, needsRefetch]);

  // ⚡ Procesador de cola con límite de concurrencia
  const processQueue = useCallback(async () => {
    const maxConcurrent = 3; // Límite de requests simultáneos
    const currentlyRunning = fetchRef.current?.size || 0;
    
    if (currentlyRunning >= maxConcurrent) return;

    // 🎯 Procesar por orden de prioridad
    const priorities = ['high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = priorityQueue.current.get(priority);
      if (queue.length > 0) {
        const task = queue.shift();
        executeTask(task);
        break;
      }
    }
  }, []);

  // 🔥 Ejecutar tarea individual
  const executeTask = async (task) => {
    const { id, dataKey, fetchFunction, resolve, reject, retryCount } = task;
    
    if (!fetchRef.current) {
      fetchRef.current = new Set();
    }
    fetchRef.current.add(id);

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction();
      
      // 💾 Guardar en cache
      firestoreCache.set(dataKey, result, ttl);
      performanceLogger.logFirebaseRead('lazy-fetch', Array.isArray(result) ? result.length : 1);
      
      setData(result);
      setLastFetch(Date.now());
      setLoading(false);
      
      resolve(result);

    } catch (error) {
      console.error(`❌ Lazy loading error for ${dataKey}:`, error);
      
      // 🔄 Retry logic
      if (retryCount < retryAttempts) {
        setTimeout(() => {
          const retryTask = { ...task, retryCount: retryCount + 1 };
          priorityQueue.current.get(priority).unshift(retryTask); // Prioridad alta para retry
          processQueue();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError(error);
        setLoading(false);
        reject(error);
      }
    } finally {
      fetchRef.current?.delete(id);
      // Continuar procesando la cola
      setTimeout(processQueue, 100);
    }
  };

  // 🎯 Auto-fetch al montar el componente (según prioridad)
  useEffect(() => {
    if (enabled) {
      // Delay basado en prioridad
      const delays = { high: 0, normal: 100, low: 500 };
      const delay = delays[priority] || 100;
      
      const timer = setTimeout(() => {
        if (needsRefetch()) {
          fetchData();
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [enabled, fetchData, needsRefetch, priority]);

  // 🧹 Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (fetchRef.current) {
        fetchRef.current.clear();
      }
    };
  }, []);

  // 🎯 Funciones de control manual
  const refetch = useCallback(() => fetchData(true), [fetchData]);
  const clearCache = useCallback(() => {
    firestoreCache.invalidatePattern(dataKey);
    setData(null);
    setLastFetch(null);
  }, [dataKey]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isStale: needsRefetch()
  };
};

/**
 * Hook especializado para lazy loading de archivos/attachments
 */
export const useLazyFiles = (commitmentId, enabled = true) => {
  return useLazyData(
    `files-${commitmentId}`,
    async () => {
      // Simulación de fetch de archivos (implementar según tu lógica)
      const response = await fetch(`/api/commitments/${commitmentId}/files`);
      return response.json();
    },
    {
      priority: 'low', // Archivos tienen prioridad baja
      ttl: 10 * 60 * 1000, // 10 minutos (cambian raramente)
      enabled
    }
  );
};

/**
 * Hook para lazy loading de estadísticas de empresa
 */
export const useLazyCompanyStats = (companyId, enabled = true) => {
  return useLazyData(
    `company-stats-${companyId}`,
    async () => {
      // Implementar fetch de estadísticas por empresa
      const response = await fetch(`/api/companies/${companyId}/stats`);
      return response.json();
    },
    {
      priority: 'normal',
      ttl: 5 * 60 * 1000, // 5 minutos
      enabled
    }
  );
};

export default useLazyData;
