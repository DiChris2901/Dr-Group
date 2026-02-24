import { useState, useCallback } from 'react';
import { storage, db } from '../config/firebase';
import { ref, listAll, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { collection, getDocs, query } from 'firebase/firestore';

/**
 * Hook personalizado para gestionar la detección de archivos huérfanos en Firebase Storage
 * Optimizado para rendimiento y manejo de errores
 */
export const useOrphanFileDetector = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [storageFiles, setStorageFiles] = useState([]);
  const [firestoreRefs, setFirestoreRefs] = useState(new Set());
  const [orphanFiles, setOrphanFiles] = useState([]);
  const [totalStorageSize, setTotalStorageSize] = useState(0);
  const [orphanStorageSize, setOrphanStorageSize] = useState(0);
  const [scanResults, setScanResults] = useState(null);

  // Función optimizada para obtener todos los archivos del Storage
  const scanStorageFiles = useCallback(async (onProgress = () => {}) => {
    
    const files = [];
    let totalSize = 0;
    // ✅ FIXED: Agregadas todas las carpetas existentes en Storage
    const folders = [
      'commitments', 
      'payments', 
      'users', 
      'companies', 
      'reports',
      'bank-certifications',
      'incomes',
      'invoices',
      'liquidaciones',
      'logos',
      'profile-photos'
    ];
    let processedFolders = 0;
    
    try {
      // Función helper para procesar archivos de manera asíncrona
      const processFilesBatch = async (fileRefs, folder, subfolder = '') => {
        const batchPromises = fileRefs.map(async (fileRef) => {
          try {
            const [metadata, downloadURL] = await Promise.all([
              getMetadata(fileRef),
              getDownloadURL(fileRef)
            ]);
            
            return {
              path: fileRef.fullPath,
              name: fileRef.name,
              size: metadata.size || 0,
              created: metadata.timeCreated,
              updated: metadata.updated,
              downloadURL,
              folder: subfolder ? `${folder}/${subfolder}` : folder,
              contentType: metadata.contentType
            };
          } catch (error) {
            return null;
          }
        });
        
        return (await Promise.all(batchPromises)).filter(Boolean);
      };

      for (const folder of folders) {
        try {
          const folderRef = ref(storage, folder);
          const folderList = await listAll(folderRef);
          
          // Procesar archivos en lotes para mejor rendimiento
          if (folderList.items.length > 0) {
            const folderFiles = await processFilesBatch(folderList.items, folder);
            files.push(...folderFiles);
            totalSize += folderFiles.reduce((sum, f) => sum + f.size, 0);
          }
          
          // Procesar subcarpetas
          for (const subfolderRef of folderList.prefixes) {
            try {
              const subfolderList = await listAll(subfolderRef);
              if (subfolderList.items.length > 0) {
                const subfolderFiles = await processFilesBatch(
                  subfolderList.items, 
                  folder, 
                  subfolderRef.name
                );
                files.push(...subfolderFiles);
                totalSize += subfolderFiles.reduce((sum, f) => sum + f.size, 0);
              }
            } catch (error) {
            }
          }
          
          processedFolders++;
          onProgress((processedFolders / folders.length) * 50); // 50% del progreso total
          
        } catch (error) {
          processedFolders++;
          onProgress((processedFolders / folders.length) * 50);
        }
      }
      
      setTotalStorageSize(totalSize);
      return files;
    } catch (error) {
      console.error('❌ Error escaneando Storage:', error);
      throw error;
    }
  }, []);

  // Función optimizada para obtener referencias de archivos en Firestore
  const scanFirestoreReferences = useCallback(async (onProgress = () => {}) => {
    
    const references = new Set();
    // ✅ FIXED: Agregada colección 'incomes' que también maneja attachments
    const collections = ['commitments', 'payments', 'users', 'companies', 'files', 'incomes'];
    let processedCollections = 0;
    
    try {
      // ✅ IMPROVED: Función mejorada para extraer paths de URLs de Firebase Storage
      const extractFilePathFromUrl = (url) => {
        if (!url || typeof url !== 'string') return null;
        
        // Verificar que sea una URL de Firebase Storage
        if (!url.includes('firebasestorage.googleapis.com')) return null;
        
        try {
          // Formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Ffile?alt=media&token=...
          const pathMatch = url.match(/o\/(.+?)\?/);
          if (pathMatch) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            // Solo log en modo debug
            return decodedPath;
          }
          
          // Formato alternativo sin parámetros
          const altMatch = url.match(/o\/(.+)$/);
          if (altMatch) {
            const decodedPath = decodeURIComponent(altMatch[1]);
            // Solo log en modo debug
            return decodedPath;
          }
        } catch (error) {
        }
        
        return null;
      };
      
      // ✅ IMPROVED: Función recursiva mejorada para extraer URLs de cualquier estructura
      const extractUrlsFromData = (data, path = '') => {
        const urls = [];
        
        if (!data) return urls;
        
        // Si es string y parece una URL de Firebase Storage
        if (typeof data === 'string' && data.includes('firebasestorage.googleapis.com')) {
          const filePath = extractFilePathFromUrl(data);
          if (filePath) {
            urls.push(filePath);
          }
        }
        // Si es array, procesar cada elemento
        else if (Array.isArray(data)) {
          data.forEach((item, index) => {
            urls.push(...extractUrlsFromData(item, `${path}[${index}]`));
          });
        }
        // Si es objeto, procesar recursivamente
        else if (typeof data === 'object' && data !== null) {
          // ✅ CASOS ESPECIALES PARA FACTURAS - CAMPOS CRÍTICOS
          if (data.url && typeof data.url === 'string') {
            const filePath = extractFilePathFromUrl(data.url);
            if (filePath) {
              urls.push(filePath);
            }
          }
          if (data.downloadURL && typeof data.downloadURL === 'string') {
            const filePath = extractFilePathFromUrl(data.downloadURL);
            if (filePath) {
              urls.push(filePath);
            }
          }
          if (data.path && typeof data.path === 'string' && data.path.includes('/')) {
            // Path directo al archivo
            urls.push(data.path);
          }
          
          // ✅ CAMPOS ESPECÍFICOS PARA LIQUIDACIONES - CRÍTICO
          if (data.nombreStorage && typeof data.nombreStorage === 'string') {
            // Este campo contiene la ruta completa del archivo en Storage
            urls.push(data.nombreStorage);
          }
          if (data.fileName && typeof data.fileName === 'string' && data.fileName.includes('/')) {
            // Otro campo posible para rutas de archivo
            urls.push(data.fileName);
          }
          
          // ✅ CASOS ESPECÍFICOS PARA FACTURAS
          if (path.includes('invoice') || path.includes('Invoice')) {
          }
          
          // Procesar todos los campos del objeto recursivamente
          Object.keys(data).forEach(key => {
            // No reprocesar campos ya manejados arriba
            if (!['url', 'downloadURL', 'path', 'nombreStorage', 'fileName'].includes(key)) {
              urls.push(...extractUrlsFromData(data[key], path ? `${path}.${key}` : key));
            }
          });
        }
        
        return urls;
      };

      for (const collectionName of collections) {
        try {
          const q = query(collection(db, collectionName));
          const snapshot = await getDocs(q);
          
          let documentsProcessed = 0;
          let totalFoundUrls = 0;
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            documentsProcessed++;
            
            // ✅ IMPROVED: Escanear todo el documento de forma recursiva
            const foundUrls = extractUrlsFromData(data, `${collectionName}/${doc.id}`);
            foundUrls.forEach(url => references.add(url));
            totalFoundUrls += foundUrls.length;
          });
          
          
          processedCollections++;
          onProgress(50 + (processedCollections / collections.length) * 30); // 30% del progreso total
          
        } catch (error) {
          processedCollections++;
          onProgress(50 + (processedCollections / collections.length) * 30);
        }
      }
      
      return references;
    } catch (error) {
      console.error('❌ Error escaneando Firestore:', error);
      throw error;
    }
  }, []);

  // Función principal de escaneo
  const performFullScan = useCallback(async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setOrphanFiles([]);
    setScanResults(null);
    
    try {
      const startTime = Date.now();
      
      // Paso 1: Escanear archivos en Storage
      setScanProgress(5);
      const files = await scanStorageFiles(setScanProgress);
      setStorageFiles(files);
      
      // Paso 2: Escanear referencias en Firestore
      setScanProgress(50);
      const references = await scanFirestoreReferences(setScanProgress);
      setFirestoreRefs(references);
      
      // Paso 3: Identificar archivos huérfanos con comparación mejorada
      setScanProgress(85);
      
      // ✅ IMPROVED: Comparación más robusta para detectar huérfanos
      const orphans = files.filter(file => {
        // Normalizar el path del archivo
        const normalizedFilePath = file.path.replace(/\\/g, '/');
        
        // Verificar si existe una referencia exacta
        if (references.has(normalizedFilePath)) {
          return false; // No es huérfano
        }
        
        // Verificar si existe una referencia similar (por si hay variaciones)
        const hasReference = Array.from(references).some(ref => {
          const normalizedRef = ref.replace(/\\/g, '/');
          
          // Comparación exacta de path
          if (normalizedRef === normalizedFilePath) {
            return true;
          }
          
          // Solo para archivos con extensión válida - evitar archivos corruptos/incompletos
          if (file.name.includes('.') && normalizedRef.endsWith(file.name)) {
            return true;
          }
          
          return false;
        });
        
        if (hasReference) {
          return false; // No es huérfano
        }
        
        // MEJORA: Filtrar archivos obviamente huérfanos (sin extensión, mal formateados)
        const isObviousOrphan = !file.name.includes('.') || // Sin extensión
                                file.name.length > 100 || // Nombre excesivamente largo
                                /^[a-f0-9]{20,}$/i.test(file.name); // Solo hash sin extensión
        
        // ESPECIAL: Los archivos de liquidaciones con patrón oficial nunca son huérfanos
        const isLiquidacionFile = normalizedFilePath.includes('liquidaciones/') && 
                                  (normalizedFilePath.includes('original_') || 
                                   file.name.includes('.xlsx') || 
                                   file.name.includes('.xls'));
        
        if (isLiquidacionFile && !isObviousOrphan) {
          
          // Solo marcar como huérfano si es obviamente temporal/corrupto
          if (isObviousOrphan) {
            return true;
          } else {
            return false; // Proteger archivos de liquidación válidos
          }
        }
        
        if (isObviousOrphan) {
          return true;
        }
        
        return true; // Es huérfano
      });
      
      const orphanSize = orphans.reduce((sum, file) => sum + file.size, 0);
      
      setOrphanFiles(orphans);
      setOrphanStorageSize(orphanSize);
      
      // Generar estadísticas del escaneo
      const endTime = Date.now();
      const scanDuration = endTime - startTime;
      
      const results = {
        totalFiles: files.length,
        totalReferences: references.size,
        orphanCount: orphans.length,
        totalStorageSize: files.reduce((sum, f) => sum + f.size, 0),
        orphanStorageSize: orphanSize,
        scanDuration,
        scanDate: new Date().toISOString(),
        filesByFolder: files.reduce((acc, file) => {
          acc[file.folder] = (acc[file.folder] || 0) + 1;
          return acc;
        }, {}),
        orphansByFolder: orphans.reduce((acc, file) => {
          acc[file.folder] = (acc[file.folder] || 0) + 1;
          return acc;
        }, {})
      };
      
      setScanResults(results);
      setScanProgress(100);
      
      return results;
      
    } catch (error) {
      console.error('❌ Error durante el escaneo:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, scanStorageFiles, scanFirestoreReferences]);

  // Función para eliminar archivos huérfanos
  const deleteOrphanFiles = useCallback(async (filePaths, onProgress = () => {}) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return { success: 0, errors: 0, details: [] };
    }
    
    const results = {
      success: 0,
      errors: 0,
      details: []
    };
    
    try {
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        
        try {
          const fileRef = ref(storage, filePath);
          await deleteObject(fileRef);
          
          results.success++;
          results.details.push({
            path: filePath,
            status: 'success',
            message: 'Archivo eliminado exitosamente'
          });
          
          
        } catch (error) {
          results.errors++;
          results.details.push({
            path: filePath,
            status: 'error',
            message: error.message
          });
          
          console.error(`❌ Error eliminando ${filePath}:`, error);
        }
        
        // Actualizar progreso
        onProgress(((i + 1) / filePaths.length) * 100);
      }
      
      // Actualizar listas locales
      const remainingOrphans = orphanFiles.filter(file => !filePaths.includes(file.path));
      setOrphanFiles(remainingOrphans);
      
      const deletedSize = orphanFiles
        .filter(file => filePaths.includes(file.path))
        .reduce((sum, file) => sum + file.size, 0);
      
      setOrphanStorageSize(prev => prev - deletedSize);
      
      return results;
      
    } catch (error) {
      console.error('❌ Error en eliminación de archivos:', error);
      throw error;
    }
  }, [orphanFiles]);

  // Función para obtener estadísticas resumidas
  const getScanSummary = useCallback(() => {
    if (!scanResults) return null;
    
    return {
      ...scanResults,
      storageEfficiency: scanResults.totalFiles > 0 
        ? ((scanResults.totalFiles - scanResults.orphanCount) / scanResults.totalFiles * 100).toFixed(1)
        : 0,
      spaceSavings: scanResults.orphanStorageSize,
      recommendedAction: scanResults.orphanCount > 0 
        ? `Se pueden eliminar ${scanResults.orphanCount} archivos para liberar ${(scanResults.orphanStorageSize / 1024 / 1024).toFixed(2)} MB`
        : 'El Storage está optimizado, no se encontraron archivos huérfanos'
    };
  }, [scanResults]);

  // Reset function
  const resetScan = useCallback(() => {
    setIsScanning(false);
    setScanProgress(0);
    setStorageFiles([]);
    setFirestoreRefs(new Set());
    setOrphanFiles([]);
    setTotalStorageSize(0);
    setOrphanStorageSize(0);
    setScanResults(null);
  }, []);

  return {
    // Estados
    isScanning,
    scanProgress,
    storageFiles,
    firestoreRefs,
    orphanFiles,
    totalStorageSize,
    orphanStorageSize,
    scanResults,
    
    // Funciones
    performFullScan,
    deleteOrphanFiles,
    getScanSummary,
    resetScan,
    
    // Estados computados
    hasOrphans: orphanFiles.length > 0,
    scanComplete: scanResults !== null
  };
};
