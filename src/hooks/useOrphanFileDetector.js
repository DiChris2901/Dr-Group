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
    console.log('🔍 Iniciando escaneo de archivos en Storage...');
    
    const files = [];
    let totalSize = 0;
    const folders = ['commitments', 'payments', 'users', 'companies', 'reports'];
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
            console.warn(`⚠️ Error procesando archivo ${fileRef.fullPath}:`, error);
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
              console.warn(`⚠️ Error procesando subcarpeta ${subfolderRef.fullPath}:`, error);
            }
          }
          
          processedFolders++;
          onProgress((processedFolders / folders.length) * 50); // 50% del progreso total
          
        } catch (error) {
          console.warn(`⚠️ Error procesando carpeta ${folder}:`, error);
          processedFolders++;
          onProgress((processedFolders / folders.length) * 50);
        }
      }
      
      console.log(`✅ Escaneo de Storage completado: ${files.length} archivos, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      setTotalStorageSize(totalSize);
      return files;
    } catch (error) {
      console.error('❌ Error escaneando Storage:', error);
      throw error;
    }
  }, []);

  // Función optimizada para obtener referencias de archivos en Firestore
  const scanFirestoreReferences = useCallback(async (onProgress = () => {}) => {
    console.log('🔍 Iniciando escaneo de referencias en Firestore...');
    
    const references = new Set();
    const collections = ['commitments', 'payments', 'users', 'companies', 'files'];
    let processedCollections = 0;
    
    try {
      // Función helper para extraer paths de URLs
      const extractFilePathFromUrl = (url) => {
        if (!url || typeof url !== 'string' || !url.includes('firebase')) return null;
        
        const pathMatch = url.match(/o\/(.+?)\?/);
        if (pathMatch) {
          return decodeURIComponent(pathMatch[1]);
        }
        return null;
      };
      
      // Campos que pueden contener URLs de archivos
      const urlFields = [
        'receiptUrl', 'receiptUrls', 'attachments', 'invoiceUrl', 'invoiceUrls',
        'profileImage', 'logo', 'companyLogo', 'fileUrl', 'fileUrls',
        'receiptMetadata', 'attachmentMetadata'
      ];

      for (const collectionName of collections) {
        try {
          const q = query(collection(db, collectionName));
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            urlFields.forEach(field => {
              const value = data[field];
              
              if (typeof value === 'string') {
                const path = extractFilePathFromUrl(value);
                if (path) references.add(path);
              } else if (Array.isArray(value)) {
                value.forEach(item => {
                  if (typeof item === 'string') {
                    const path = extractFilePathFromUrl(item);
                    if (path) references.add(path);
                  } else if (typeof item === 'object' && item?.url) {
                    const path = extractFilePathFromUrl(item.url);
                    if (path) references.add(path);
                  }
                });
              }
            });
          });
          
          processedCollections++;
          onProgress(50 + (processedCollections / collections.length) * 30); // 30% del progreso total
          
        } catch (error) {
          console.warn(`⚠️ Error escaneando colección ${collectionName}:`, error);
          processedCollections++;
          onProgress(50 + (processedCollections / collections.length) * 30);
        }
      }
      
      console.log(`✅ Escaneo de Firestore completado: ${references.size} referencias encontradas`);
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
      
      // Paso 3: Identificar archivos huérfanos
      setScanProgress(85);
      const orphans = files.filter(file => !references.has(file.path));
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
          
          console.log(`✅ Archivo eliminado: ${filePath}`);
          
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
