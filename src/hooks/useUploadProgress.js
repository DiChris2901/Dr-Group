import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

/**
 * Hook para escuchar el progreso de uploads desde RTDB
 * Permite sincronización de progreso entre múltiples pestañas/dispositivos
 * 
 * @param {string} userId - ID del usuario
 * @returns {Object} - Objeto con uploads activos y su progreso
 */
export const useUploadProgress = (userId) => {
  const [uploads, setUploads] = useState({});
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    if (!userId || !database) {
      setUploads({});
      setTotalProgress(0);
      return;
    }

    const uploadsRef = ref(database, `/uploads/${userId}`);
    
    const unsubscribe = onValue(uploadsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUploads(data);

      // Calcular progreso total si hay múltiples uploads
      const uploadArray = Object.values(data);
      if (uploadArray.length > 0) {
        const avgProgress = uploadArray.reduce((sum, upload) => sum + (upload.progress || 0), 0) / uploadArray.length;
        setTotalProgress(Math.round(avgProgress));
      } else {
        setTotalProgress(0);
      }
    }, (error) => {
      console.error('❌ Error escuchando progreso de uploads:', error);
    });

    return () => unsubscribe();
  }, [userId]);

  // Helper para obtener progreso de un upload específico
  const getUploadProgress = (uploadId) => {
    return uploads[uploadId]?.progress || 0;
  };

  // Verificar si hay uploads en progreso
  const hasActiveUploads = Object.keys(uploads).length > 0;

  return {
    uploads,           // { uploadId: { fileName, progress, bytesTransferred, totalBytes, state, timestamp } }
    totalProgress,     // Progreso promedio de todos los uploads activos
    hasActiveUploads,  // Boolean - hay uploads en progreso
    getUploadProgress  // Function(uploadId) - obtener progreso específico
  };
};

export default useUploadProgress;
