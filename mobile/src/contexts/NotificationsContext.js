import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationsProvider');
  }
  return context;
};

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationsProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Registrar para notificaciones push
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('📱 Push Token:', token);
      }
    });

    // Configurar canales de notificación para Android
    if (Platform.OS === 'android') {
      setupNotificationChannels();
    }

    // Listener para notificaciones recibidas mientras la app está en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida:', notification);
      setNotification(notification);
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificación tocada:', response);
      // La navegación se manejará en App.js
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Función para registrar el dispositivo para notificaciones push
  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      // Android requiere configuración de canal de notificaciones
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ Permiso de notificaciones denegado');
        return null;
      }
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          console.warn('⚠️ Project ID no encontrado');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('✅ Push token obtenido:', token);
      } catch (e) {
        console.error('❌ Error obteniendo push token:', e);
        token = null;
      }
    } else {
      console.warn('⚠️ Debe usar un dispositivo físico para push notifications');
    }

    return token;
  }

  // Configurar canales de notificación para Android
  async function setupNotificationChannels() {
    try {
      // Canal para jornada laboral (prioridad alta)
      await Notifications.setNotificationChannelAsync('work-session', {
        name: 'Jornada Laboral',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });

      // Canal para chat (prioridad alta)
      await Notifications.setNotificationChannelAsync('chat', {
        name: 'Mensajes de Chat',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#764ba2',
        sound: 'default',
      });

      // Canal para recordatorios (prioridad media)
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ffa502',
        sound: 'default',
      });

      console.log('✅ Canales de notificación configurados');
    } catch (error) {
      console.error('❌ Error configurando canales:', error);
    }
  }

  // ✅ Función para programar notificación local
  async function scheduleNotification(title, body, data = {}, channelId = 'default') {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Inmediato
      });
      console.log('✅ Notificación programada');
    } catch (error) {
      console.error('❌ Error programando notificación:', error);
    }
  }

  // ✅ Función para cancelar notificación por ID
  async function cancelNotification(notificationId) {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      console.log('✅ Notificación cancelada:', notificationId);
    } catch (error) {
      console.error('❌ Error cancelando notificación:', error);
    }
  }

  // ✅ Función para cancelar todas las notificaciones
  async function cancelAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ Todas las notificaciones canceladas');
    } catch (error) {
      console.error('❌ Error cancelando notificaciones:', error);
    }
  }

  const value = {
    expoPushToken,
    notification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
