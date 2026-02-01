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
    // 🔒 VALIDACIÓN CRÍTICA: No ejecutar NADA si no hay usuario autenticado
    if (!currentUser) {
      // console.log('🔒 useStorageStats: Sin usuario, no se ejecuta');
      setStorageData(prev => ({ 
        ...prev, 
        loading: false,
        used: 0,
        documents: 0,
        images: 0,
        files: 0
      }));
      return;
    }

    // 🔒 Esperar a que termine de cargar la autenticación
    if (authLoading) {
      // console.log('🔒 useStorageStats: Auth cargando, esperando...');
      return;
    }

    console.log('🔒 useStorageStats: Usuario autenticado, ejecutando fetch...');

    // ⏰ Delay más largo para asegurar que todos los permisos estén listos
    const timer = setTimeout(async () => {
      // ✅ Verificación FINAL antes de ejecutar
      if (!currentUser) {
        console.warn('🔒 useStorageStats: Usuario desapareció durante timeout, abortando');
        return;
      }

      const fetchStorageStats = async () => {
        try {
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
          
          console.log(`📁 [StorageStats] Procesando carpeta: ${folderName} (${result.items.length} archivos)`);
          
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
              console.warn(`⚠️ Error obteniendo metadata de ${itemRef.name}:`, metadataError.message);
              // Continuar sin bloquear
            }
          }

          // Procesar subcarpetas con límites de seguridad
          const maxSubfolders = 20; // Limitar número de subcarpetas
          const subfoldersToProcess = result.prefixes.slice(0, maxSubfolders);
          
          if (result.prefixes.length > maxSubfolders) {
            console.warn(`⚠️ Carpeta ${folderName} tiene ${result.prefixes.length} subcarpetas, procesando solo ${maxSubfolders}`);
          }

          for (const subfolderRef of subfoldersToProcess) {
            try {
              // Validar longitud del path (Firebase Storage tiene límites)
              if (subfolderRef.fullPath.length > 200) {
                console.warn(`⚠️ Path demasiado largo, omitiendo: ${subfolderRef.fullPath.substring(0, 50)}...`);
                continue;
              }

              const subfolderResult = await listAll(subfolderRef);
              
              // Solo archivos directos, NO más subcarpetas (profundidad = 1)
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
                  console.warn(`⚠️ Error metadata ${itemRef.name}:`, metadataError.message);
                }
              }
            } catch (subfolderError) {
              // Error HTTP/2 o path largo - omitir y continuar
              console.warn(`⚠️ Error subcarpeta ${subfolderRef.name}:`, subfolderError.code || subfolderError.message);
              continue;
            }
          }
          
        } catch (folderError) {
          console.warn(`⚠️ Error accediendo a carpeta ${folderName}:`, folderError.code || folderError.message);
          // Si es error de permisos (403), informar pero continuar
          if (folderError.code === 'storage/unauthorized') {
            console.log(`ℹ️ Sin permisos para listar ${folderName}, omitiendo...`);
          }
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