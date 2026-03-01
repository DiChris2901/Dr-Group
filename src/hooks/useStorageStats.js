import { useState, useEffect, useCallback, useRef } from 'react';
import { getStorage, ref, listAll, getMetadata } from 'firebase/storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const CACHE_KEY = 'rdj-storage-stats';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

const defaultStats = {
  used: 0,
  total: 5.0,
  documents: 0,
  images: 0,
  files: 0,
  loading: false,
  error: null
};

// Leer cache desde localStorage
const getCachedStats = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
};

const saveCachedStats = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) { /* ignore */ }
};

/**
 * Hook para estadisticas de Firebase Storage.
 * 
 * @param {Object} options
 * @param {boolean} options.autoFetch - Si true, ejecuta el scan completo de Storage.
 *   Si false (default), solo usa datos cacheados. Esto evita docenas de llamadas
 *   403 en paginas como el Dashboard donde solo se muestra un % de uso.
 */
export const useStorageStats = ({ autoFetch = false } = {}) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [storageData, setStorageData] = useState(() => {
    const cached = getCachedStats();
    return cached || defaultStats;
  });
  const fetchingRef = useRef(false);

  const getFirestoreStats = useCallback(async () => {
    let totalDocs = 0;
    const collections = ['users', 'commitments', 'companies', 'payments', 'files', 'incomes'];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        totalDocs += snapshot.size;
      } catch (e) {
        // Acceso limitado, continuar
      }
    }
    return totalDocs > 0 ? totalDocs : 50;
  }, []);

  const getFirebaseStorageStats = useCallback(async () => {
    const storage = getStorage();
    let totalSize = 0;
    let imageCount = 0;
    let fileCount = 0;

    const knownFolders = [
      'logos', 'receipts', 'profile-photos',
      'company-documents', 'liquidaciones', 'payments', 'commitments'
    ];

    for (const folderName of knownFolders) {
      try {
        const folderRef = ref(storage, folderName);
        const result = await listAll(folderRef);

        for (const itemRef of result.items) {
          try {
            const metadata = await getMetadata(itemRef);
            totalSize += metadata.size || 0;
            if (metadata.contentType?.startsWith('image/')) imageCount++;
            else fileCount++;
          } catch (e) { /* metadata error, skip */ }
        }

        // Subcarpetas (limite de profundidad 1, maximo 20)
        const subfoldersToProcess = result.prefixes.slice(0, 20);
        for (const subfolderRef of subfoldersToProcess) {
          try {
            if (subfolderRef.fullPath.length > 200) continue;
            const subResult = await listAll(subfolderRef);
            for (const itemRef of subResult.items) {
              try {
                const metadata = await getMetadata(itemRef);
                totalSize += metadata.size || 0;
                if (metadata.contentType?.startsWith('image/')) imageCount++;
                else fileCount++;
              } catch (e) { /* skip */ }
            }
          } catch (e) {
            // 403 en subcarpeta, continuar
            continue;
          }
        }
      } catch (folderError) {
        // 403/unauthorized en carpeta completa - NO reintentar, solo saltar
        continue;
      }
    }

    return { totalSize, imageCount, fileCount };
  }, []);

  const fetchStats = useCallback(async () => {
    if (!currentUser || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setStorageData(prev => ({ ...prev, loading: true, error: null }));

      let documentsCount = 0;
      try {
        documentsCount = await getFirestoreStats();
      } catch (e) {
        documentsCount = 0;
      }

      let storageStats = { totalSize: 0, imageCount: 0, fileCount: 0 };
      try {
        storageStats = await getFirebaseStorageStats();
      } catch (e) {
        // Error total en storage, usar defaults
      }

      const usedGB = storageStats.totalSize / (1024 * 1024 * 1024);
      const finalStats = {
        used: parseFloat(usedGB.toFixed(2)),
        total: 5.0,
        documents: documentsCount,
        images: storageStats.imageCount,
        files: storageStats.fileCount,
        loading: false,
        error: null
      };

      setStorageData(finalStats);
      saveCachedStats(finalStats);
    } catch (error) {
      setStorageData(prev => ({
        ...prev,
        loading: false,
        error: null
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, [currentUser, getFirestoreStats, getFirebaseStorageStats]);

  // Solo auto-fetch si esta habilitado Y hay usuario autenticado
  useEffect(() => {
    if (!autoFetch || !currentUser || authLoading) return;

    // Delay para asegurar que el token este listo
    const timer = setTimeout(() => {
      if (currentUser) fetchStats();
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoFetch, currentUser, authLoading, fetchStats]);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...storageData,
    refreshStats
  };
};