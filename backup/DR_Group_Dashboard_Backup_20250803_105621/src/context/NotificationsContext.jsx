import React, { createContext, useContext, useState } from 'react';

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

  // Función para agregar notificación
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Función para agregar alerta
  const addAlert = (alert) => {
    const newAlert = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...alert
    };
    setAlerts(prev => [newAlert, ...prev]);
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
  };

  // Función para limpiar todas las alertas
  const clearAllAlerts = () => {
    setAlerts([]);
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
    clearAllAlerts
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;
