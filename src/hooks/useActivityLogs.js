import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook personalizado para manejo de logs de actividad
 * Permite registrar y consultar actividades del sistema
 */
const useActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Registra una nueva actividad en el sistema
   * @param {string} action - Tipo de acción realizada
   * @param {string} entityType - Tipo de entidad afectada
   * @param {string} entityId - ID de la entidad afectada
   * @param {object} details - Detalles adicionales de la actividad
   * @param {string} userId - ID del usuario que realizó la acción
   * @param {string} userName - Nombre del usuario
   * @param {string} userEmail - Email del usuario
   */
  const logActivity = async (action, entityType, entityId, details = {}, userId, userName, userEmail) => {
    try {
      const logData = {
        action,
        entityType,
        entityId,
        details,
        userId,
        userName,
        userEmail,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        // Metadatos adicionales
        userAgent: navigator.userAgent,
        ipAddress: null, // Se podría obtener del servidor
        sessionId: sessionStorage.getItem('sessionId') || 'anonymous'
      };

      const docRef = await addDoc(collection(db, 'activity_logs'), logData);
      console.log('✅ Log de actividad registrado:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al registrar log de actividad:', error);
      setError(error.message);
      throw error;
    }
  };

  /**
   * Obtiene logs de actividad con filtros
   * @param {object} filters - Filtros para la consulta
   * @param {number} pageSize - Número de elementos por página
   */
  const getActivityLogs = async (filters = {}, pageSize = 50) => {
    setLoading(true);
    setError(null);

    try {
      let logsData = [];
      
      if (filters.userId) {
        // Obtener todos los logs del usuario (sin orderBy para evitar índice compuesto)
        const userQuery = query(
          collection(db, 'activity_logs'),
          where('userId', '==', filters.userId),
          limit(pageSize * 3) // Obtener más para compensar filtros adicionales
        );
        
        const snapshot = await getDocs(userQuery);
        snapshot.forEach((doc) => {
          const data = doc.data();
          logsData.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });
        
        // Ordenar por timestamp en el cliente
        logsData.sort((a, b) => b.timestamp - a.timestamp);
        
      } else {
        // Sin filtro de usuario, solo orderBy timestamp
        const generalQuery = query(
          collection(db, 'activity_logs'),
          orderBy('timestamp', 'desc'),
          limit(pageSize * 2)
        );
        
        const snapshot = await getDocs(generalQuery);
        snapshot.forEach((doc) => {
          const data = doc.data();
          logsData.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });
      }

      // Aplicar filtros adicionales en el cliente
      if (filters.action) {
        logsData = logsData.filter(log => log.action === filters.action);
      }
      
      if (filters.entityType) {
        logsData = logsData.filter(log => log.entityType === filters.entityType);
      }

      if (filters.startDate) {
        logsData = logsData.filter(log => log.timestamp >= filters.startDate);
      }
      
      if (filters.endDate) {
        logsData = logsData.filter(log => log.timestamp <= filters.endDate);
      }

      // Limitar a la cantidad solicitada
      logsData = logsData.slice(0, pageSize);

      setLogs(logsData);
      return logsData;
      
    } catch (error) {
      console.error('❌ Error al obtener logs:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Suscripción en tiempo real a los logs más recientes
   * @param {object} filters - Filtros para la consulta
   * @param {number} limitCount - Número máximo de logs
   */
  const subscribeToRecentLogs = (filters = {}, limitCount = 100) => {
    setLoading(true);

    let q;
    
    if (filters.userId) {
      // Solo filtrar por usuario (sin orderBy para evitar índice compuesto)
      q = query(
        collection(db, 'activity_logs'),
        where('userId', '==', filters.userId),
        limit(limitCount * 2) // Obtener más para ordenar en cliente
      );
    } else {
      // Solo orderBy timestamp
      q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });

      // Si filtramos por usuario, ordenar por timestamp en el cliente
      if (filters.userId) {
        logsData.sort((a, b) => b.timestamp - a.timestamp);
        // Limitar a la cantidad solicitada después del ordenamiento
        logsData.splice(limitCount);
      }

      setLogs(logsData);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('❌ Error en suscripción de logs:', error);
      setError(error.message);
      setLoading(false);
    });

    return unsubscribe;
  };

  /**
   * Obtiene estadísticas de actividad
   */
  const getActivityStats = async (dateRange = 30) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Consulta simple sin filtros compuestos
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(1000) // Obtener últimas 1000 actividades
      );

      const snapshot = await getDocs(q);
      const logs = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        
        // Filtrar por rango de fechas en el cliente
        if (timestamp >= startDate && timestamp <= endDate) {
          logs.push({
            ...data,
            timestamp
          });
        }
      });

      // Calcular estadísticas
      const stats = {
        totalActivities: logs.length,
        uniqueUsers: [...new Set(logs.map(log => log.userId))].length,
        actionTypes: {},
        entityTypes: {},
        dailyActivity: {},
        mostActiveUsers: {}
      };

      // Contar por tipos de acción
      logs.forEach(log => {
        stats.actionTypes[log.action] = (stats.actionTypes[log.action] || 0) + 1;
        stats.entityTypes[log.entityType] = (stats.entityTypes[log.entityType] || 0) + 1;
        
        // Actividad diaria
        const dateKey = log.timestamp?.toDate ? 
          log.timestamp.toDate().toISOString().split('T')[0] : 
          new Date(log.timestamp).toISOString().split('T')[0];
        stats.dailyActivity[dateKey] = (stats.dailyActivity[dateKey] || 0) + 1;
        
        // Usuarios más activos
        const userKey = `${log.userName} (${log.userEmail})`;
        stats.mostActiveUsers[userKey] = (stats.mostActiveUsers[userKey] || 0) + 1;
      });

      return stats;
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      return null;
    }
  };

  return {
    logs,
    loading,
    error,
    logActivity,
    getActivityLogs,
    subscribeToRecentLogs,
    getActivityStats
  };
};

export default useActivityLogs;
