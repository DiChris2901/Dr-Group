// 🚨 Hook para el centro de alertas
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where, updateDoc, doc, limit, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export const useAlertsCenter = () => {
  const { currentUser } = useAuth();
  const [alertsData, setAlertsData] = useState({
    alerts: [],
    criticalAlerts: [],
    warningAlerts: [],
    infoAlerts: [],
    unreadCount: 0,
    totalCount: 0,
    alertsConfig: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!currentUser) {
      setAlertsData(prev => ({ ...prev, loading: false }));
      return;
    }

    // Monitorear alertas recientes (máx 50 para optimizar reads)
    const unsubscribeAlerts = onSnapshot(
      query(
        collection(db, 'alerts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const alerts = [];
        let unreadCount = 0;
        let criticalAlerts = [];
        let warningAlerts = [];
        let infoAlerts = [];

        snapshot.forEach((doc) => {
          const alertData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          };
          
          alerts.push(alertData);
          
          if (!alertData.read) {
            unreadCount++;
          }

          // Clasificar por tipo
          switch (alertData.severity || alertData.type) {
            case 'critical':
            case 'error':
              criticalAlerts.push(alertData);
              break;
            case 'warning':
              warningAlerts.push(alertData);
              break;
            case 'info':
            case 'success':
              infoAlerts.push(alertData);
              break;
            default:
              infoAlerts.push(alertData);
          }
        });
        
        setAlertsData(prev => ({
          ...prev,
          alerts,
          criticalAlerts,
          warningAlerts,
          infoAlerts,
          unreadCount,
          totalCount: alerts.length,
          loading: false
        }));
      },
      (error) => {
        console.error('Error fetching alerts:', error);
        setAlertsData(prev => ({ ...prev, error: error.message, loading: false }));
      }
    );

    // Monitorear configuración de alertas del usuario
    const unsubscribeConfig = onSnapshot(
      doc(db, 'alertsConfig', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setAlertsData(prev => ({
            ...prev,
            alertsConfig: doc.data()
          }));
        } else {
          // Configuración por defecto
          setAlertsData(prev => ({
            ...prev,
            alertsConfig: {
              emailNotifications: true,
              pushNotifications: true,
              criticalAlerts: true,
              warningAlerts: true,
              infoAlerts: false,
              reminderAlerts: true
            }
          }));
        }
      }
    );

    return () => {
      unsubscribeAlerts();
      unsubscribeConfig();
    };
  }, [currentUser]);

  // Función para marcar alerta como leída
  const markAsRead = async (alertId) => {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        read: true,
        readAt: new Date(),
        readBy: currentUser.uid
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  // Función para marcar todas como leídas (batch write — 1 transacción en vez de N)
  const markAllAsRead = async () => {
    try {
      const unreadAlerts = alertsData.alerts.filter(alert => !alert.read);
      if (unreadAlerts.length === 0) return;
      const batch = writeBatch(db);
      unreadAlerts.forEach(alert => {
        batch.update(doc(db, 'alerts', alert.id), {
          read: true,
          readAt: new Date(),
          readBy: currentUser.uid
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  return {
    ...alertsData,
    markAsRead,
    markAllAsRead
  };
};
