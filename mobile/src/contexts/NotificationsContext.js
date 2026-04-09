import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { collection, query, where, onSnapshot, orderBy, limit, doc, setDoc, getDoc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
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

// Helper para verificar si una notificación debe mostrarse
const shouldShowNotification = (notification, preferences) => {
  if (!preferences) return true; // Si no hay preferencias cargadas, mostrar por seguridad

  // 1. Verificar alertas generales (Admin)
  if (notification.type === 'admin_alert' || notification.type === 'alert') { 
    if (!preferences.alerts?.enabled) return false;
    
    // Filtrar por audiencia
    if (notification.audience === 'admins' && !preferences.alerts.adminOnly) return false;
    
    // Filtrar por prioridad
    if (notification.priority === 'high' && !preferences.alerts.highPriority) return false;
    if (notification.priority === 'normal' && !preferences.alerts.general) return false;
    
    return true;
  }

  // 2. Verificar calendario
  if (notification.type === 'calendar' || notification.type === 'event') {
    if (!preferences.calendar?.enabled) return false;
    const eventType = notification.subType || 'custom';
    if (preferences.calendar.events && preferences.calendar.events[eventType] === false) return false;
    return true;
  }

  // 3. Verificar asistencia
  if (notification.type === 'attendance') {
    if (!preferences.attendance?.enabled) return false;
    if (notification.subType === 'exit' && !preferences.attendance.exitReminder) return false;
    if (notification.subType === 'break' && !preferences.attendance.breakReminder) return false;
    if (notification.subType === 'lunch' && !preferences.attendance.lunchReminder) return false;
    return true;
  }

  // 4. Verificar eventos de jornada laboral
  if (notification.type === 'work_event') {
    if (!preferences.workEvents?.enabled) return false;
    if (notification.subType === 'clockIn' && !preferences.workEvents.events?.clockIn) return false;
    if (notification.subType === 'clockOut' && !preferences.workEvents.events?.clockOut) return false;
    if (notification.subType === 'breakStart' && !preferences.workEvents.events?.breakStart) return false;
    if (notification.subType === 'lunchStart' && !preferences.workEvents.events?.lunchStart) return false;
    if (notification.subType === 'incident' && !preferences.workEvents.events?.incidents) return false;
    return true;
  }

  return true; // Default allow
};

// ✅ Configurar cómo se manejan las notificaciones locales cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationsProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [notification, setNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null); // ✅ Nueva: Preferencias locales
  const notificationListener = useRef();
  const responseListener = useRef();
  const lastNotificationIdRef = useRef(null);

  // ✅ NUEVO: Cargar preferencias al inicio
  useEffect(() => {
    if (user?.uid) {
      const loadPrefs = async () => {
        try {
          const docRef = doc(db, 'users', user.uid, 'settings', 'notificationPreferences');
          const snap = await getDoc(docRef);
          if (snap.exists()) setUserPreferences(snap.data());
        } catch (e) {
          console.error('Error cargando preferencias de notificaciones:', e);
        }
      };
      loadPrefs();
    }
  }, [user]);

  // Registrar token de dispositivo al iniciar sesion
  useEffect(() => {
    if (user && userProfile) {
      registerForPushNotifications();
    }
  }, [user, userProfile]);

  // Re-registrar token cuando la app vuelve a foreground (previene tokens expirados)
  useEffect(() => {
    if (!user || !userProfile) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        registerForPushNotifications();
      }
    });

    return () => subscription.remove();
  }, [user, userProfile, registerForPushNotifications]);

  // Auto-limpiar notificaciones > 2 días al iniciar sesión
  useEffect(() => {
    if (!user?.uid) return;
    const twoDaysAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    const cleanupQuery = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('createdAt', '<', twoDaysAgo)
    );
    getDocs(cleanupQuery).then((snapshot) => {
      if (snapshot.empty) return;
      const CHUNK_SIZE = 400;
      const chunks = [];
      for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
        chunks.push(snapshot.docs.slice(i, i + CHUNK_SIZE));
      }
      return Promise.all(chunks.map(chunk => {
        const batch = writeBatch(db);
        chunk.forEach((d) => batch.delete(d.ref));
        return batch.commit();
      }));
    }).catch((e) => console.warn('[Notifications] cleanup error:', e?.message));
  }, [user?.uid]);

  // ✅ Listener de Firestore para contar no leídas y detectar nuevas
  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      // ✅ Resetear badge al cerrar sesión
      Notifications.setBadgeCountAsync(0).catch(() => {});
      return () => {}; // ✅ Cleanup vacío cuando no hay usuario
    }

    const twoDaysAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    // Query para contar no leídas (solo últimos 2 días)
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      where('read', '==', false),
      where('createdAt', '>=', twoDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
      const count = snapshot.size;
      setUnreadCount(count);

      // ✅ Sincronizar badge count del ícono de la app
      Notifications.setBadgeCountAsync(count).catch(() => {});

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

          // ✅ APLICAR FILTRO DE PREFERENCIAS
          const allowedBySettings = shouldShowNotification(newNotif, userPreferences);

          if (isRecent && lastNotificationIdRef.current !== newNotifId && allowedBySettings) {
            lastNotificationIdRef.current = newNotifId;

            // Cargar preferencias de presentación (sin await porque no está en async)
            getDoc(doc(db, 'users', user.uid, 'settings', 'notificationBehavior'))
              .then((behaviorDoc) => {
                const prefs = behaviorDoc.exists() ? behaviorDoc.data() : {};
                const presentationStyle = prefs.presentationStyle || 'full';
                const soundEnabled = prefs.sound !== false;
                const vibrationEnabled = prefs.vibration !== false;

                // Adaptar contenido según estilo
                let finalBody = newNotif.message || 'Tienes una nueva alerta en Dr. Group';
                if (presentationStyle === 'compact') {
                  finalBody = finalBody.length > 50 ? finalBody.substring(0, 47) + '...' : finalBody;
                } else if (presentationStyle === 'minimal') {
                  finalBody = '';
                }
                
                // ✅ Determinar canal y grupo según tipo de notificación
                const notifType = newNotif.type || 'admin_alert';
                const channelMap = {
                  'calendar': 'attendance',
                  'calendar_event': 'attendance',
                  'attendance': 'attendance',
                  'exit_reminder': 'attendance',
                  'break_reminder': 'break',
                  'lunch_reminder': 'break',
                  'admin_alert': 'alerts',
                  'novedad_approved': 'alerts',
                  'novedad_rejected': 'alerts',
                  'admin_new_novedad': 'alerts',
                  'work_goal_reached': 'work-session',
                  'long_break': 'break',
                };
                const groupMap = {
                  'alerts': 'rdj-alerts',
                  'attendance': 'rdj-attendance',
                  'work-session': 'rdj-work',
                  'break': 'rdj-break',
                  'reminders': 'rdj-reminders',
                };
                const resolvedChannel = channelMap[notifType] || 'alerts';
                const groupKey = groupMap[resolvedChannel] || 'rdj-general';

                Notifications.scheduleNotificationAsync({
                  content: {
                    title: newNotif.title || 'Nueva Notificación',
                    body: finalBody,
                    data: { type: notifType, id: newNotifId, ...newNotif.data },
                    sound: soundEnabled,
                    vibrate: vibrationEnabled ? [0, 250, 250, 250] : [],
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    channelId: resolvedChannel,
                    // ✅ Notification grouping por tipo
                    ...(Platform.OS === 'android' && {
                      android: {
                        groupId: groupKey,
                      },
                    }),
                  },
                  trigger: null,
                });
              })
              .catch(() => {
                // Si falla, mostrar notificación completa por defecto
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: newNotif.title || 'Nueva Notificación',
                    body: newNotif.message || 'Tienes una nueva alerta en Dr. Group',
                    data: { type: newNotif.type || 'admin_alert', id: newNotifId, ...newNotif.data },
                    sound: true,
                    vibrate: [0, 250, 250, 250],
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    channelId: 'alerts',
                  },
                  trigger: null,
                });
              });
          }
        }
      });
    },
    (error) => {
      // ✅ Manejo de errores silencioso para evitar spam en consola
      console.error('Error en listener de notificaciones:', error.code);
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
      setNotification(notification);
    });

    // ✅ Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
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
  const requestNotificationPermissions = useCallback(async () => {
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
      
      return true;
    } catch (error) {
      console.error('❌ Error pidiendo permisos:', error);
      return false;
    }
  }, []);

  // ✅ NUEVO: Registrar dispositivo para Push Notifications y guardar token
  const registerForPushNotifications = useCallback(async () => {
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
      }

      return token;
    } catch (error) {
      logger.error('❌ Error registrando push notifications:', error);
      return null;
    }
  }, [user, userProfile, requestNotificationPermissions]);

  // Configurar canales de notificación para Android (diferenciados por tipo)
  const setupNotificationChannels = useCallback(async () => {
    try {
      // Canal: Jornada Laboral (prioridad alta, vibración fuerte)
      await Notifications.setNotificationChannelAsync('work-session', {
        name: 'Jornada Laboral',
        description: 'Notificaciones de inicio/fin de jornada y metas de trabajo',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Canal: Alertas Admin (prioridad máxima, vibración urgente)
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Alertas',
        description: 'Alertas de administradores y novedades',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#f44336',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Canal: Asistencia (prioridad alta, vibración moderada)
      await Notifications.setNotificationChannelAsync('attendance', {
        name: 'Asistencia',
        description: 'Recordatorios de entrada, salida y registro de asistencia',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 150, 300],
        lightColor: '#4caf50',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Canal: Break/Descanso (prioridad media, vibración suave)
      await Notifications.setNotificationChannelAsync('break', {
        name: 'Descansos',
        description: 'Notificaciones de breaks y almuerzos',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 100, 150],
        lightColor: '#ff9800',
        sound: 'default',
        enableVibrate: true,
        showBadge: false,
      });

      // Canal: Recordatorios (prioridad media)
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios',
        description: 'Recordatorios de calendario y eventos programados',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ffa502',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

    } catch (error) {
      console.error('❌ Error configurando canales:', error);
    }
  }, []);

  // ✅ Función para programar notificación local
  const scheduleNotification = useCallback(async (title, body, data = {}, channelId = 'default') => {
    try {
      // Cargar preferencias del usuario
      let presentationStyle = 'full';
      let soundEnabled = true;
      let vibrationEnabled = true;
      
      if (user?.uid) {
        try {
          const behaviorDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'notificationBehavior'));
          if (behaviorDoc.exists()) {
            const prefs = behaviorDoc.data();
            presentationStyle = prefs.presentationStyle || 'full';
            soundEnabled = prefs.sound !== false;
            vibrationEnabled = prefs.vibration !== false;
          }
        } catch (e) {
          // use default notification settings
        }
      }

      // Adaptar contenido según estilo
      let finalBody = body;
      if (presentationStyle === 'compact') {
        finalBody = body.length > 50 ? body.substring(0, 47) + '...' : body;
      } else if (presentationStyle === 'minimal') {
        finalBody = '';
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: finalBody,
          data,
          sound: soundEnabled,
          vibrate: vibrationEnabled ? [0, 250, 250, 250] : [],
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error programando notificación:', error);
    }
  }, [user]);

  // ✅ Función para cancelar notificación por ID
  const cancelNotification = useCallback(async (notificationId) => {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('❌ Error cancelando notificación:', error);
    }
  }, []);

  // ✅ Función para cancelar todas las notificaciones
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('❌ Error cancelando notificaciones:', error);
    }
  }, []);

  // ✅ NUEVO: Programar recordatorio de salida (6:00 PM si no ha registrado salida)
  const scheduleExitReminder = useCallback(async (preferences = null) => {
    try {
      // ✅ VERIFICAR PREFERENCIAS DEL USUARIO
      if (preferences && preferences.attendance) {
        if (!preferences.attendance.enabled || !preferences.attendance.exitReminder) {
          logger.debug('⏭️ Recordatorio de salida deshabilitado por preferencias');
          return null;
        }
      }

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
  }, []);

  // ✅ NUEVO: Recordatorio de break después de 4 horas trabajando
  const scheduleBreakReminder = useCallback(async (startTime, preferences = null) => {
    try {
      // ✅ VERIFICAR PREFERENCIAS DEL USUARIO
      if (preferences && preferences.attendance) {
        if (!preferences.attendance.enabled || !preferences.attendance.breakReminder) {
          logger.debug('⏭️ Recordatorio de break deshabilitado por preferencias');
          return null;
        }
      }

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
  }, []);

  // ✅ NUEVO: Recordatorio de almuerzo (12:00 PM si no lo ha registrado)
  const scheduleLunchReminder = useCallback(async (preferences = null) => {
    try {
      // ✅ VERIFICAR PREFERENCIAS DEL USUARIO
      if (preferences && preferences.attendance) {
        if (!preferences.attendance.enabled || !preferences.attendance.lunchReminder) {
          logger.debug('⏭️ Recordatorio de almuerzo deshabilitado por preferencias');
          return null;
        }
      }

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
  }, []);

  // ✅ NUEVO: Cancelar recordatorios específicos por tipo
  const cancelScheduledReminders = useCallback(async () => {
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
  }, []);

  // ✅ NUEVO: Programar notificación de evento de calendario (Solo ADMIN)
  const scheduleCalendarEventNotification = useCallback(async (event, daysBeforeArray = [2, 0]) => {
    if (!userProfile || (userProfile.role !== 'ADMIN' && userProfile.role !== 'SUPER_ADMIN')) {
      logger.debug('Notificaciones de calendario solo para ADMIN');
      return [];
    }

    const identifiers = [];

    try {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      const now = new Date();

      // Solo programar si el evento es futuro
      if (eventDate < now) {
        return identifiers;
      }

      for (const daysBefore of daysBeforeArray) {
        const notificationDate = new Date(eventDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);
        notificationDate.setHours(8, 0, 0, 0); // 8:00 AM

        // Solo programar si la fecha de notificación es futura
        if (notificationDate > now) {
          const priority = event.priority === 'high' || event.priority === 'urgent' 
            ? Notifications.AndroidNotificationPriority.HIGH 
            : Notifications.AndroidNotificationPriority.DEFAULT;

          const emoji = event.type === 'system' ? '🚨' : '📅';
          const daysText = daysBefore === 0 
            ? 'HOY' 
            : daysBefore === 1 
              ? 'MAÑANA' 
              : `en ${daysBefore} días`;

          let body = `${event.title} - ${daysText}`;
          if (event.amount) {
            body += ` | Monto: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(event.amount)}`;
          }

          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${emoji} Evento de Calendario`,
              body,
              data: { 
                type: 'calendar_event', 
                eventId: event.id,
                screen: 'Calendario' 
              },
              sound: true,
              priority,
            },
            trigger: {
              date: notificationDate,
              channelId: 'reminders',
            },
          });

          identifiers.push(identifier);
        }
      }

      return identifiers;
    } catch (error) {
      logger.error('❌ Error programando notificación de calendario:', error);
      return identifiers;
    }
  }, [userProfile]);

  // ✅ NUEVO: Cancelar notificaciones de calendario obsoletas
  const cancelCalendarNotifications = useCallback(async () => {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      let canceledCount = 0;
      
      for (const notif of scheduledNotifications) {
        const data = notif.content?.data;
        if (data?.type === 'calendar_event') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
          canceledCount++;
        }
      }

      if (canceledCount > 0) {
        logger.info(`✅ ${canceledCount} notificaciones de calendario canceladas`);
      }
    } catch (error) {
      logger.error('❌ Error cancelando notificaciones de calendario:', error);
    }
  }, []);

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
    // ✅ NUEVAS funciones de calendario
    scheduleCalendarEventNotification,
    cancelCalendarNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
