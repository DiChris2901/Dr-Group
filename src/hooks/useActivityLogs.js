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
import { useAuth } from '../context/AuthContext';

/**
 * Hook personalizado para manejo de logs de actividad
 * Permite registrar y consultar actividades del sistema
 */
const useActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { currentUser, userProfile } = useAuth();

  const normalizeText = (value) => {
    if (value == null) return '';
    return String(value).trim().toLowerCase();
  };

  const toCanonicalKey = (value) => {
    const text = normalizeText(value);
    if (!text) return '';
    return text
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  };

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
      const effectiveUserId = userId || currentUser?.uid;
      if (!effectiveUserId) return null;

      const effectiveUserName =
        userName ||
        userProfile?.name ||
        userProfile?.displayName ||
        currentUser?.displayName ||
        currentUser?.email ||
        'Usuario desconocido';

      const effectiveUserEmail =
        userEmail ||
        currentUser?.email ||
        userProfile?.email ||
        'Sin email';

      const logData = {
        action,
        entityType,
        entityId,
        details,
        userId: effectiveUserId,
        userName: effectiveUserName,
        userEmail: effectiveUserEmail,
        userRole: userProfile?.role || null,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        // Metadatos adicionales
        userAgent: navigator.userAgent,
        ipAddress: null, // Se podría obtener del servidor
        sessionId: sessionStorage.getItem('sessionId') || 'anonymous'
      };

      const docRef = await addDoc(collection(db, 'activity_logs'), logData);
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
      const constraints = [];

      // ✅ Server-side: narrow by timestamp range (on-demand reads)
      if (filters.startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Always sort by timestamp for a stable result set
      constraints.push(orderBy('timestamp', 'desc'));
      constraints.push(limit(pageSize));

      const q = query(collection(db, 'activity_logs'), ...constraints);
      const snapshot = await getDocs(q);

      let logsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });

      // ✅ Client-side: apply the rest of filters without fetching historical data
      if (filters.userId) {
        const targetUserId = String(filters.userId).trim();
        logsData = logsData.filter((log) => String(log.userId || '').trim() === targetUserId);
      }

      if (filters.userRole) {
        const targetUserRole = toCanonicalKey(filters.userRole);
        logsData = logsData.filter((log) => toCanonicalKey(log.userRole) === targetUserRole);
      }

      if (filters.action) {
        const targetAction = toCanonicalKey(filters.action);
        logsData = logsData.filter((log) => toCanonicalKey(log.action) === targetAction);
      }

      if (filters.entityType) {
        const targetEntityType = toCanonicalKey(filters.entityType);
        logsData = logsData.filter((log) => toCanonicalKey(log.entityType) === targetEntityType);
      }

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

      // Server-side: filtrar por rango de fechas directamente en Firestore
      const q = query(
        collection(db, 'activity_logs'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(q);
      const logs = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        logs.push({
          ...data,
          timestamp
        });
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
        const dateKey = log.timestamp instanceof Date ? 
          log.timestamp.toISOString().split('T')[0] : 
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
