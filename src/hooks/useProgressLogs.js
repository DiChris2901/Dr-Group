import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

/**
 * Hook para manejar logs de progreso de tareas
 * - Crear registros con archivos adjuntos
 * - Editar registros existentes
 * - Eliminar registros y sus archivos de Storage
 */
export const useProgressLogs = (taskId) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const logsRef = collection(db, 'tasks', taskId, 'progressLogs');
    const q = query(logsRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const logsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLogs(logsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar logs de progreso:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  /**
   * Crear nuevo registro de progreso
   */
  const createLog = async (logData) => {
    try {
      const logsRef = collection(db, 'tasks', taskId, 'progressLogs');
      const newLog = {
        ...logData,
        fecha: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(logsRef, newLog);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error al crear log de progreso:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar registro existente
   */
  const updateLog = async (logId, updates) => {
    try {
      const logRef = doc(db, 'tasks', taskId, 'progressLogs', logId);
      await updateDoc(logRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar log de progreso:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Eliminar registro y sus archivos de Storage
   */
  const deleteLog = async (logId, archivos = []) => {
    try {
      // Eliminar archivos de Storage
      if (archivos && archivos.length > 0) {
        const deletePromises = archivos.map(async (archivo) => {
          try {
            const fileRef = ref(storage, archivo.url);
            await deleteObject(fileRef);
          } catch (error) {
            console.error(`Error al eliminar archivo ${archivo.nombre}:`, error);
          }
        });
        await Promise.all(deletePromises);
      }

      // Eliminar documento de Firestore
      const logRef = doc(db, 'tasks', taskId, 'progressLogs', logId);
      await deleteDoc(logRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar log de progreso:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Subir archivos a Storage y retornar URLs
   */
  const uploadFiles = async (logId, files) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const filePath = `tasks/${taskId}/progress/${logId}/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        
        return {
          nombre: file.name,
          url: url,
          tipo: file.type,
          tamaño: file.size,
          uploadedAt: new Date().toISOString()
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      return { success: true, files: uploadedFiles };
    } catch (error) {
      console.error('Error al subir archivos:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    logs,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    uploadFiles
  };
};
