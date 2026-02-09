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
 * - Los logs SIEMPRE están en tasks/{taskId}/progressLogs (para mantener compatibilidad)
 * - Pero actualiza la tarea en la colección correcta (delegated_tasks o tasks)
 * 
 * @param {string} taskId - ID de la tarea
 * @param {string} taskCollection - Nombre de la colección donde está la tarea ('tasks' o 'delegated_tasks')
 */
export const useProgressLogs = (taskId, taskCollection = 'delegated_tasks') => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    // Los logs SIEMPRE están en tasks/{taskId}/progressLogs (ubicación fija)
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
   * Los logs SIEMPRE se guardan en tasks/{taskId}/progressLogs
   * Pero actualiza la tarea en la colección correcta (delegated_tasks o tasks)
   */
  const createLog = async (logData) => {
    try {
      // Los logs SIEMPRE en tasks/{taskId}/progressLogs
      const logsRef = collection(db, 'tasks', taskId, 'progressLogs');
      const newLog = {
        ...logData,
        fecha: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(logsRef, newLog);
      
      // Actualizar tarea principal en la colección correcta (taskCollection)
      const taskRef = doc(db, taskCollection, taskId);
      await updateDoc(taskRef, {
        estado: logData.estado,
        estadoActual: logData.estado, // Compatibilidad con ambos campos
        porcentajeCompletado: logData.porcentaje,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error al crear log de progreso:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar registro existente
   * Los logs SIEMPRE en tasks/{taskId}/progressLogs
   * Actualiza la tarea en la colección correcta si se modificó estado/porcentaje
   */
  const updateLog = async (logId, updates) => {
    try {
      // Los logs SIEMPRE en tasks/{taskId}/progressLogs
      const logRef = doc(db, 'tasks', taskId, 'progressLogs', logId);
      await updateDoc(logRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Si se actualizó el estado o porcentaje, actualizar tarea principal
      if (updates.estado || updates.porcentaje !== undefined) {
        const taskRef = doc(db, taskCollection, taskId);
        const taskUpdates = {
          updatedAt: serverTimestamp()
        };
        
        if (updates.estado) {
          taskUpdates.estado = updates.estado;
          taskUpdates.estadoActual = updates.estado;
        }
        
        if (updates.porcentaje !== undefined) {
          taskUpdates.porcentajeCompletado = updates.porcentaje;
        }
        
        await updateDoc(taskRef, taskUpdates);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar log de progreso:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Eliminar registro y sus archivos de Storage
   * Los logs SIEMPRE en tasks/{taskId}/progressLogs
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

      // Los logs SIEMPRE en tasks/{taskId}/progressLogs
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
