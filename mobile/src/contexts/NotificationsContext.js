import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationsProvider');
  }
  return context;
};

// ✅ Configurar cómo se manejan las notificaciones locales cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Deprecated pero aún funciona
    shouldPlaySound: true,
    shouldSetBadge: true,
    // ✅ Nueva API recomendada:
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [notification, setNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationListener = useRef();
  const responseListener = useRef();
  const lastNotificationIdRef = useRef(null);

  // ✅ Listener de Firestore para contar no leídas y detectar nuevas
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    // Query para contar no leídas
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.size;
      setUnreadCount(count);

      // Detectar nuevas notificaciones para emitir alerta local
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newNotif = change.doc.data();
          const newNotifId = change.doc.id;

          // Evitar notificar sobre la carga inicial o duplicados
          // Usamos una referencia simple o timestamp para filtrar "viejas" si es necesario
          // Pero docChanges 'added' se dispara en carga inicial para todos los docs existentes.
          // Para evitar spam en carga inicial, podemos verificar si el cambio es reciente o usar un flag de "inicializado".
          
          // Estrategia: Solo notificar si la notificación fue creada hace menos de 10 segundos
          // (Esto asume que la hora del dispositivo y servidor están sincronizadas razonablemente)
          const createdAt = newNotif.createdAt?.toDate();
          const now = new Date();
          const isRecent = createdAt && (now - createdAt) < 10000; // 10 segundos

          if (isRecent && lastNotificationIdRef.current !== newNotifId) {
            lastNotificationIdRef.current = newNotifId;
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: newNotif.title || 'Nueva Notificación',
                body: newNotif.message || 'Tienes una nueva alerta en Dr. Group',
                data: { url: '/notifications', id: newNotifId },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null, // Mostrar inmediatamente
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // ✅ Pedir permisos para notificaciones locales
    requestNotificationPermissions();

    // ✅ Configurar canales de notificación para Android
    if (Platform.OS === 'android') {
      setupNotificationChannels();
    }

    // ✅ Listener para notificaciones recibidas mientras la app está en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida:', notification);
      setNotification(notification);
    });

    // ✅ Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificación tocada:', response);
      // La navegación se manejará en App.js
    });

    return () => {
      // ✅ Usar .remove() en lugar de removeNotificationSubscription
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // ✅ Función para pedir permisos de notificaciones locales
  async function requestNotificationPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ Permiso de notificaciones denegado');
        return false;
      }
      
      console.log('✅ Permisos de notificaciones concedidos');
      return true;
    } catch (error) {
      console.error('❌ Error pidiendo permisos:', error);
      return false;
    }
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
    notification,
    unreadCount,
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
