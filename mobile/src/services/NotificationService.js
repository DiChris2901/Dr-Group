import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración global de cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Solicita permisos de notificaciones al usuario
   * @returns {Promise<boolean>} true si se otorgaron permisos
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('No se otorgaron permisos de notificación');
        return false;
      }

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Programa una notificación local
   * @param {Object} options - Opciones de la notificación
   * @param {string} options.title - Título de la notificación
   * @param {string} options.body - Cuerpo de la notificación
   * @param {number} options.seconds - Segundos hasta que se muestre (opcional)
   * @param {Object} options.data - Datos adicionales (opcional)
   * @returns {Promise<string>} ID de la notificación programada
   */
  async scheduleNotification({ title, body, seconds = 0, data = {} }) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: seconds > 0 ? { seconds } : null,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancela una notificación programada
   * @param {string} notificationId - ID de la notificación a cancelar
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Notifica al usuario cuando debe finalizar su jornada
   * @param {number} horasMeta - Horas de meta de trabajo (default 9)
   */
  async notifyWorkDayComplete(horasMeta = 9) {
    const horasEnSegundos = horasMeta * 3600;
    return this.scheduleNotification({
      title: '🎉 ¡Meta Cumplida!',
      body: `Has completado ${horasMeta} horas de trabajo. ¡Finaliza tu jornada!`,
      seconds: horasEnSegundos,
      data: { type: 'work_goal_reached' },
    });
  }

  /**
   * Notifica al usuario que su break es muy largo
   * @param {number} minutos - Minutos de break (default 15)
   */
  async notifyLongBreak(minutos = 15) {
    return this.scheduleNotification({
      title: '⏰ Break Extendido',
      body: `Llevas ${minutos} minutos en break. ¿Olvidaste reanudar?`,
      seconds: minutos * 60,
      data: { type: 'long_break' },
    });
  }

  /**
   * Notifica al usuario sobre una novedad aprobada
   * @param {string} tipo - Tipo de novedad
   */
  async notifyNovedadApproved(tipo) {
    return this.scheduleNotification({
      title: '✅ Solicitud Aprobada',
      body: `Tu solicitud de ${tipo.replace('_', ' ')} ha sido aprobada.`,
      data: { type: 'novedad_approved' },
    });
  }

  /**
   * Notifica al usuario sobre una novedad rechazada
   * @param {string} tipo - Tipo de novedad
   * @param {string} razon - Razón del rechazo (opcional)
   */
  async notifyNovedadRejected(tipo, razon = '') {
    return this.scheduleNotification({
      title: '❌ Solicitud Rechazada',
      body: razon || `Tu solicitud de ${tipo.replace('_', ' ')} fue rechazada. Contacta a tu supervisor.`,
      data: { type: 'novedad_rejected' },
    });
  }

  /**
   * Recordatorio para iniciar jornada (si no ha iniciado a cierta hora)
   * @param {number} hora - Hora del día (0-23)
   */
  async notifyStartWorkReminder(hora = 8) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hora, 0, 0, 0);
    
    if (target < now) {
      target.setDate(target.getDate() + 1); // Si ya pasó la hora, programar para mañana
    }

    const diffSeconds = Math.floor((target - now) / 1000);

    return this.scheduleNotification({
      title: '👋 Hora de Trabajar',
      body: 'No olvides iniciar tu jornada laboral',
      seconds: diffSeconds,
      data: { type: 'work_reminder' },
    });
  }

  /**
   * Notifica al admin sobre una nueva novedad reportada
   * @param {string} empleado - Nombre del empleado
   * @param {string} tipo - Tipo de novedad
   */
  async notifyAdminNewNovedad(empleado, tipo) {
    return this.scheduleNotification({
      title: '📝 Nueva Solicitud',
      body: `${empleado} reportó: ${tipo.replace('_', ' ')}`,
      data: { type: 'admin_new_novedad' },
    });
  }
}

export default new NotificationService();
