import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState(new Set());

  // Cargar alertas resueltas desde localStorage al inicializar
  useEffect(() => {
    try {
      const savedResolvedAlerts = localStorage.getItem('dr_group_resolved_alerts');
      if (savedResolvedAlerts) {
        setResolvedAlerts(new Set(JSON.parse(savedResolvedAlerts)));
      }
    } catch (error) {
      console.warn('Error cargando alertas resueltas:', error);
    }
  }, []);

  // Guardar alertas resueltas en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('dr_group_resolved_alerts', JSON.stringify([...resolvedAlerts]));
    } catch (error) {
      console.warn('Error guardando alertas resueltas:', error);
    }
  }, [resolvedAlerts]);

  // Función para agregar notificación (soporta ambos formatos)
  const addNotification = (messageOrNotification, type = 'info') => {
    let notificationData;
    
    // Si es un string, convertir al formato de objeto
    if (typeof messageOrNotification === 'string') {
      notificationData = {
        title: type === 'success' ? 'Éxito' : 
               type === 'error' ? 'Error' : 
               type === 'warning' ? 'Advertencia' : 
               'Información',
        message: messageOrNotification,
        type: type
      };
    } else {
      // Si ya es un objeto, usarlo directamente
      notificationData = messageOrNotification;
    }
    
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notificationData
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Función para agregar alerta (solo si no está resuelta)
  const addAlert = (alert) => {
    // No agregar la alerta si ya está en la lista de resueltas
    if (resolvedAlerts.has(alert.id)) {
      return;
    }

    const newAlert = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...alert
    };
    setAlerts(prev => {
      // Evitar duplicados
      const exists = prev.some(existingAlert => existingAlert.id === alert.id);
      if (exists) return prev;
      return [newAlert, ...prev];
    });
  };

  // Función para marcar notificación como leída
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Función para eliminar notificación
  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Función para limpiar todas las notificaciones
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Función para eliminar alerta
  const deleteAlert = (alertId) => {
    setAlerts(prev => 
      prev.filter(alert => alert.id !== alertId)
    );
    // Marcar como resuelta para evitar que se vuelva a mostrar
    setResolvedAlerts(prev => new Set([...prev, alertId]));
  };

  // Función para limpiar todas las alertas
  const clearAllAlerts = () => {
    // Marcar todas las alertas actuales como resueltas
    const currentAlertIds = alerts.map(alert => alert.id);
    setResolvedAlerts(prev => new Set([...prev, ...currentAlertIds]));
    // Limpiar alertas del estado
    setAlerts([]);
  };

  // Función para restablecer alertas resueltas (útil para desarrollo/testing)
  const resetResolvedAlerts = () => {
    setResolvedAlerts(new Set());
    localStorage.removeItem('dr_group_resolved_alerts');
  };

  // Contar notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;
  const alertsCount = alerts.length;

  const value = {
    notifications,
    alerts,
    unreadCount,
    alertsCount,
    addNotification,
    addAlert,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    deleteAlert,
    clearAllAlerts,
    resetResolvedAlerts // Nueva función para development
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;
