import * as Notifications from 'expo-notifications';

/**
 * NotificationService - Servicio ligero para notificaciones LOCALES de sesión.
 * 
 * RESPONSABILIDADES (solo notificaciones locales del dispositivo):
 * - Notificaciones persistentes de estado (trabajando/break/almuerzo)
 * - Alertas programadas por tiempo (meta cumplida, break largo)
 * - Notificaciones puntuales (novedades, admin alerts)
 * 
 * NO RESPONSABLE DE (gestionado por NotificationsContext):
 * - Push tokens / registro de dispositivo
 * - Permisos de notificaciones
 * - Canales Android
 * - Listener de Firestore
 * - setNotificationHandler
 */
class NotificationService {
  // ID de la notificación persistente de estado actual
  _stateNotificationId = null;

  // IDs de notificaciones programadas de sesión (work goal, long break)
  _sessionNotificationIds = [];

  /**
   * Programa una notificación local
   */
  async scheduleNotification({ title, body, seconds = 0, data = {}, channelId = 'default', sound = true }) {
    try {
      const trigger = seconds > 0 
        ? { type: 'timeInterval', seconds, repeats: false }
        : { type: 'date', date: new Date() };
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound,
          ...(channelId && { channelId }),
        },
        trigger,
      });

      if (seconds > 0) {
        this._sessionNotificationIds.push(id);
      }

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Muestra una notificación persistente del estado actual.
   * Solo elimina la notificación de estado anterior, NO las demás.
   */
  async updateStateNotification(estado, horaInicio) {
    // 1. Cancelar SOLO la notificación de estado anterior (no todas)
    if (this._stateNotificationId) {
      try {
        await Notifications.dismissNotificationAsync(this._stateNotificationId);
      } catch (e) {
        // Puede fallar si ya fue dismisseada manualmente
      }
      this._stateNotificationId = null;
    }

    // 2. Definir contenido según estado
    let title = '';
    let body = '';
    const horaStr = horaInicio ? new Date(horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    switch (estado) {
      case 'trabajando':
        title = '🏢 Jornada Activa';
        body = `Iniciada a las ${horaStr} - Toca para abrir`;
        break;
      case 'break':
        title = '☕ En Break';
        body = `Descanso iniciado a las ${horaStr}`;
        break;
      case 'almuerzo':
        title = '🍽️ En Almuerzo';
        body = `Almuerzo iniciado a las ${horaStr}`;
        break;
      default:
        return;
    }

    // 3. Mostrar nueva notificación persistente y guardar su ID
    try {
      this._stateNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          autoDismiss: false,
          sound: false,
          channelId: 'work-session',
          data: { estado, isPersistent: true },
        },
        trigger: { type: 'date', date: new Date() },
      });
    } catch (error) {
      console.error('Error updating state notification:', error);
    }
  }

  /**
   * Cancela SOLO la notificación persistente de estado actual
   */
  async clearStateNotification() {
    if (this._stateNotificationId) {
      try {
        await Notifications.dismissNotificationAsync(this._stateNotificationId);
      } catch (e) {
        // Puede fallar si ya fue dismisseada
      }
      this._stateNotificationId = null;
    }
  }

  /**
   * Cancela todas las notificaciones de sesión programadas (work goal, break largo)
   * y la notificación persistente de estado.
   */
  async cancelSessionNotifications() {
    // Cancelar notificaciones programadas de sesión
    for (const id of this._sessionNotificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        // Ignorar si ya expiró
      }
    }
    this._sessionNotificationIds = [];

    // Cancelar notificación de estado
    await this.clearStateNotification();
  }

  /**
   * Notifica al usuario cuando debe finalizar su jornada
   */
  async notifyWorkDayComplete(horasMeta = 9) {
    return this.scheduleNotification({
      title: '🎉 ¡Meta Cumplida!',
      body: `Has completado ${horasMeta} horas de trabajo. ¡Finaliza tu jornada!`,
      seconds: horasMeta * 3600,
      data: { type: 'work_goal_reached' },
      channelId: 'work-session',
    });
  }

  /**
   * Notifica al usuario que su break es muy largo
   */
  async notifyLongBreak(minutos = 15) {
    return this.scheduleNotification({
      title: '⏰ Break Extendido',
      body: `Llevas ${minutos} minutos en break. ¿Olvidaste reanudar?`,
      seconds: minutos * 60,
      data: { type: 'long_break' },
      channelId: 'break',
    });
  }

  /**
   * Notifica al usuario sobre una novedad aprobada
   */
  async notifyNovedadApproved(tipo) {
    return this.scheduleNotification({
      title: '✅ Solicitud Aprobada',
      body: `Tu solicitud de ${tipo.replace('_', ' ')} ha sido aprobada.`,
      data: { type: 'novedad_approved' },
      channelId: 'alerts',
    });
  }

  /**
   * Notifica al usuario sobre una novedad rechazada
   */
  async notifyNovedadRejected(tipo, razon = '') {
    return this.scheduleNotification({
      title: '❌ Solicitud Rechazada',
      body: razon || `Tu solicitud de ${tipo.replace('_', ' ')} fue rechazada. Contacta a tu supervisor.`,
      data: { type: 'novedad_rejected' },
      channelId: 'alerts',
    });
  }

  /**
   * Notifica al admin sobre una nueva novedad reportada
   */
  async notifyAdminNewNovedad(empleado, tipo) {
    return this.scheduleNotification({
      title: '📝 Nueva Solicitud',
      body: `${empleado} reportó: ${tipo.replace('_', ' ')}`,
      data: { type: 'admin_new_novedad' },
      channelId: 'alerts',
    });
  }
}

export default new NotificationService();
