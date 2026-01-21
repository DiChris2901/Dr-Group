import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { collection, query, where, onSnapshot, orderBy, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

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
  const { user, userProfile } = useAuth();
  const [notification, setNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const lastNotificationIdRef = useRef(null);

  // ✅ NUEVO: Registrar token de dispositivo al iniciar sesión
  useEffect(() => {
    if (user && userProfile) {
      registerForPushNotifications();
    }
  }, [user, userProfile]);

  // ✅ Listener de Firestore para contar no leídas y detectar nuevas
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return () => {}; // ✅ Cleanup vacío cuando no hay usuario
    }

    // Query para contar no leídas
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
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
    },
    (error) => {
      // ✅ Manejo de errores silencioso para evitar spam en consola
      console.log('⚠️ Error en listener de notificaciones (esperado al cerrar sesión):', error.code);
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

  // ✅ NUEVO: Registrar dispositivo para Push Notifications y guardar token
  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      logger.warn('Push Notifications requieren dispositivo físico');
      return null;
    }

    try {
      // 1. Pedir permisos
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return null;

      // 2. Obtener Expo Push Token
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      setExpoPushToken(token);
      logger.info('✅ Expo Push Token obtenido:', token);

      // 3. Guardar token en Firestore con info del dispositivo
      if (user && token) {
        const deviceInfo = {
          token,
          platform: Platform.OS,
          model: Device.modelName || 'Unknown',
          osVersion: Device.osVersion || 'Unknown',
          appVersion: Constants.expoConfig?.version || '2.1.0',
          lastUpdated: new Date().toISOString(),
          userId: user.uid,
          role: userProfile?.role || 'USER',
          // ✅ Preferencias de notificaciones según rol
          preferences: {
            calendar: userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN', // Solo admins reciben calendario
            attendance: true, // Todos reciben recordatorios de asistencia
            alerts: true // Todos reciben alertas de admins
          }
        };

        await setDoc(doc(db, 'deviceTokens', user.uid), deviceInfo, { merge: true });
        logger.info('✅ Token guardado en Firestore con preferencias');
      }

      return token;
    } catch (error) {
      logger.error('❌ Error registrando push notifications:', error);
      return null;
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

  // ✅ NUEVO: Programar recordatorio de salida (6:00 PM si no ha registrado salida)
  async function scheduleExitReminder() {
    try {
      const now = new Date();
      const exitReminderTime = new Date();
      exitReminderTime.setHours(18, 0, 0, 0); // 6:00 PM

      // Si ya pasó las 6 PM hoy, programar para mañana
      if (now > exitReminderTime) {
        exitReminderTime.setDate(exitReminderTime.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏠 ¿Olvidaste registrar tu salida?',
          body: 'Recuerda finalizar tu jornada laboral en la app.',
          data: { type: 'exit_reminder', screen: 'Dashboard' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: exitReminderTime,
          channelId: 'reminders',
        },
      });

      logger.info('✅ Recordatorio de salida programado:', identifier);
      return identifier;
    } catch (error) {
      logger.error('❌ Error programando recordatorio de salida:', error);
    }
  }

  // ✅ NUEVO: Recordatorio de break después de 4 horas trabajando
  async function scheduleBreakReminder(startTime) {
    try {
      const breakTime = new Date(startTime);
      breakTime.setHours(breakTime.getHours() + 4); // 4 horas después

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '☕ Hora de un descanso',
          body: 'Has trabajado 4 horas. Tómate un break de 15 minutos.',
          data: { type: 'break_reminder', screen: 'Dashboard' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          date: breakTime,
          channelId: 'reminders',
        },
      });

      logger.info('✅ Recordatorio de break programado:', identifier);
      return identifier;
    } catch (error) {
      logger.error('❌ Error programando recordatorio de break:', error);
    }
  }

  // ✅ NUEVO: Recordatorio de almuerzo (12:00 PM si no lo ha registrado)
  async function scheduleLunchReminder() {
    try {
      const now = new Date();
      const lunchTime = new Date();
      lunchTime.setHours(12, 0, 0, 0); // 12:00 PM

      // Solo programar si aún no es mediodía
      if (now < lunchTime) {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍽️ Hora del almuerzo',
            body: 'Recuerda registrar tu hora de almuerzo.',
            data: { type: 'lunch_reminder', screen: 'Dashboard' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            date: lunchTime,
            channelId: 'reminders',
          },
        });

        logger.info('✅ Recordatorio de almuerzo programado:', identifier);
        return identifier;
      }
    } catch (error) {
      logger.error('❌ Error programando recordatorio de almuerzo:', error);
    }
  }

  // ✅ NUEVO: Cancelar recordatorios específicos por tipo
  async function cancelScheduledReminders() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notif of scheduledNotifications) {
        const data = notif.content?.data;
        if (data?.type?.includes('reminder')) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
          logger.info(`✅ Recordatorio cancelado: ${data.type}`);
        }
      }
    } catch (error) {
      logger.error('❌ Error cancelando recordatorios:', error);
    }
  }

  const value = {
    notification,
    unreadCount,
    expoPushToken,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    // ✅ NUEVAS funciones de recordatorios
    scheduleExitReminder,
    scheduleBreakReminder,
    scheduleLunchReminder,
    cancelScheduledReminders,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
