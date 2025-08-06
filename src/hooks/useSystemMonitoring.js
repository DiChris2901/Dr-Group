// 📊 Hook para datos de monitoreo del sistema
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useSystemMonitoring = () => {
  const { currentUser } = useAuth();
  const [monitoringData, setMonitoringData] = useState({
    systemHealth: {
      cpu: 0,
      memory: 0,
      storage: 0,
      network: 0,
      status: 'unknown'
    },
    activeUsers: 0,
    totalCommitments: 0,
    pendingTasks: 0,
    systemLogs: [],
    performanceMetrics: [],
    alerts: [],
    uptime: 0,
    responseTime: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!currentUser) {
      setMonitoringData(prev => ({ ...prev, loading: false }));
      return;
    }

    // Monitorear logs del sistema
    const unsubscribeLogs = onSnapshot(
      query(
        collection(db, 'systemLogs'),
        orderBy('timestamp', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const logs = [];
        snapshot.forEach((doc) => {
          logs.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          });
        });
        
        setMonitoringData(prev => ({
          ...prev,
          systemLogs: logs,
          loading: false
        }));
      },
      (error) => {
        console.error('Error fetching system logs:', error);
        setMonitoringData(prev => ({ ...prev, error: error.message, loading: false }));
      }
    );

    // Monitorear métricas de rendimiento
    const unsubscribeMetrics = onSnapshot(
      query(
        collection(db, 'performanceMetrics'),
        orderBy('timestamp', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const metrics = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          metrics.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate()
          });
        });
        
        // Calcular métricas actuales basadas en los últimos datos
        const latestMetric = metrics[0];
        if (latestMetric) {
          setMonitoringData(prev => ({
            ...prev,
            systemHealth: {
              cpu: latestMetric.cpu || 0,
              memory: latestMetric.memory || 0,
              storage: latestMetric.storage || 0,
              network: latestMetric.network || 0,
              status: latestMetric.status || 'unknown'
            },
            uptime: latestMetric.uptime || 0,
            responseTime: latestMetric.responseTime || 0,
            performanceMetrics: metrics
          }));
        }
      }
    );

    // Monitorear usuarios activos
    const unsubscribeUsers = onSnapshot(
      query(
        collection(db, 'users'),
        where('isActive', '==', true)
      ),
      (snapshot) => {
        setMonitoringData(prev => ({
          ...prev,
          activeUsers: snapshot.size
        }));
      }
    );

    // Monitorear compromisos totales
    const unsubscribeCommitments = onSnapshot(
      collection(db, 'commitments'),
      (snapshot) => {
        setMonitoringData(prev => ({
          ...prev,
          totalCommitments: snapshot.size
        }));
      }
    );

    // Monitorear tareas pendientes
    const unsubscribeTasks = onSnapshot(
      query(
        collection(db, 'tasks'),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        setMonitoringData(prev => ({
          ...prev,
          pendingTasks: snapshot.size
        }));
      }
    );

    return () => {
      unsubscribeLogs();
      unsubscribeMetrics();
      unsubscribeUsers();
      unsubscribeCommitments();
      unsubscribeTasks();
    };
  }, [currentUser]);

  return monitoringData;
};
