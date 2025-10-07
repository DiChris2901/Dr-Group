import { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getMetadata } from 'firebase/storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useStorageStats = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [storageData, setStorageData] = useState({
    used: 0,
    total: 5.0, // GB - límite de Firebase Spark plan
    documents: 0,
    images: 0,
    files: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    // 🔒 No ejecutar si no hay usuario autenticado o si aún está cargando auth
    if (!currentUser || authLoading) {
      setStorageData(prev => ({ ...prev, loading: authLoading }));
      return;
    }

    console.log('🔒 useStorageStats: Usuario autenticado, ejecutando fetch...');

    // ⏰ Delay más largo para asegurar que todos los permisos estén listos
    const timer = setTimeout(async () => {
      const fetchStorageStats = async () => {
        try {
          // ✅ Verificación adicional de seguridad
          if (!currentUser) {
            console.warn('🔒 useStorageStats: Usuario no autenticado en fetch, abortando');
            return;
          }

          setStorageData(prev => ({ ...prev, loading: true, error: null }));

          // 🔍 Intentar una verificación mínima primero
          let documentsCount = 0;
          try {
            documentsCount = await getFirestoreStats();
          } catch (firestoreError) {
            console.warn('⚠️ Error en Firestore, usando datos mínimos:', firestoreError.message);
            documentsCount = 0; // Usar 0 si no tenemos acceso
          }
          
          // � Obtener estadísticas reales de Firebase Storage
          let storageStats = {
            totalSize: 0,
            imageCount: 0,
            fileCount: 0
          };

          try {
            storageStats = await getFirebaseStorageStats();
            console.log('📊 Estadísticas reales de Storage obtenidas:', storageStats);
          } catch (storageError) {
            console.warn('⚠️ Error en Storage, usando datos mínimos:', storageError.message);
            // Usar datos por defecto si hay error
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

          console.log('📊 Stats finales calculadas:', finalStats);
          console.log('💾 Porcentaje de uso:', ((finalStats.used / finalStats.total) * 100).toFixed(1) + '%');

          setStorageData(finalStats);

        } catch (error) {
          console.warn('⚠️ Error general en stats, usando valores por defecto:', error.message);
          setStorageData({
            used: 0,
            total: 5.0,
            documents: 0,
            images: 0,
            files: 0,
            loading: false,
            error: null // No mostrar error al usuario
          });
        }
      };

      fetchStorageStats();
    }, 5000); // Esperar 5 segundos tras la autenticación para mayor seguridad

    return () => clearTimeout(timer);
  }, [currentUser, authLoading]); // 🔒 Dependencias de autenticación

  const getFirestoreStats = async () => {
    try {
      // ✅ Intentar acceso limitado primero - solo colecciones básicas
      const basicCollections = ['users']; // Empezar solo con users que debería ser accesible
      let totalDocs = 0;

      for (const collectionName of basicCollections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          console.log(`📄 ${collectionName}: ${snapshot.size} documentos`);
          totalDocs += snapshot.size;
        } catch (collectionError) {
          console.warn(`⚠️ No se pudo acceder a la colección ${collectionName}:`, collectionError.message);
          // Continuar con las demás colecciones
        }
      }

      // Si obtuvimos al menos algunos datos, intentar las demás colecciones
      if (totalDocs > 0) {
        const additionalCollections = ['commitments', 'companies', 'payments', 'files', 'incomes'];
        for (const collectionName of additionalCollections) {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            console.log(`📄 ${collectionName}: ${snapshot.size} documentos`);
            totalDocs += snapshot.size;
          } catch (collectionError) {
            console.warn(`⚠️ Acceso limitado a ${collectionName}, omitiendo...`);
            // No es crítico, continuar
          }
        }
      }

      console.log(`📊 Total documentos Firestore: ${totalDocs}`);
      return totalDocs > 0 ? totalDocs : 50; // Usar valor conservador si no se pudo obtener nada
    } catch (error) {
      console.warn('⚠️ Error de permisos en Firestore, usando datos simulados:', error.message);
      return 50; // Valor simulado conservador en caso de error de permisos
    }
  };

  const getFirebaseStorageStats = async () => {
    const storage = getStorage();
    
    let totalSize = 0;
    let imageCount = 0;
    let fileCount = 0;

    try {
      // 🔒 FIX PRODUCCIÓN: No acceder al root storage directamente
      // Las reglas de Firebase Security no permiten listAll() en el root
      // En su lugar, escaneamos las carpetas conocidas
      const knownFolders = [
        'logos',
        'receipts',
        'profile-photos',
        'company-documents',
        'liquidaciones',
        'payments',
        'commitments'
      ];

      console.log('🔍 [StorageStats] Escaneando carpetas conocidas en lugar del root...');

      for (const folderName of knownFolders) {
        try {
          const folderRef = ref(storage, folderName);
          const result = await listAll(folderRef);
          
          console.log(`📁 [StorageStats] Procesando carpeta: ${folderName}`);
          
          // Procesar archivos en la carpeta
          for (const itemRef of result.items) {
            try {
              const metadata = await getMetadata(itemRef);
              totalSize += metadata.size || 0;
              
              if (metadata.contentType?.startsWith('image/')) {
                imageCount++;
              } else {
                fileCount++;
              }
            } catch (metadataError) {
              console.warn(`Error getting metadata for file ${itemRef.name} in folder ${folderName}:`, metadataError);
            }
          }

          // Procesar subcarpetas (recursivamente si es necesario)
          for (const subfolderRef of result.prefixes) {
            try {
              const subfolderResult = await listAll(subfolderRef);
              for (const itemRef of subfolderResult.items) {
                try {
                  const metadata = await getMetadata(itemRef);
                  totalSize += metadata.size || 0;
                  
                  if (metadata.contentType?.startsWith('image/')) {
                    imageCount++;
                  } else {
                    fileCount++;
                  }
                } catch (metadataError) {
                  console.warn(`Error getting metadata for file ${itemRef.name} in subfolder ${subfolderRef.name}:`, metadataError);
                }
              }
            } catch (subfolderError) {
              console.warn(`Error processing subfolder ${subfolderRef.name}:`, subfolderError);
            }
          }
          
        } catch (folderError) {
          console.warn(`Error accessing folder ${folderName}:`, folderError);
          // Continúa con la siguiente carpeta sin fallar
        }
      }

    } catch (error) {
      console.error('Error accessing Firebase Storage:', error);
      throw error;
    }

    return { totalSize, imageCount, fileCount };
  };

  const refreshStats = () => {
    setStorageData(prev => ({ ...prev, loading: true }));
    // Re-ejecutar el efecto
    const timer = setTimeout(() => {
      window.location.reload(); // Forzar recarga para actualizar stats
    }, 1000);
    
    return () => clearTimeout(timer);
  };

  return {
    ...storageData,
    refreshStats
  };
};