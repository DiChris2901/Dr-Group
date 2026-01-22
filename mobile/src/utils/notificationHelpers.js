import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { logger } from './logger';

/**
 * Notifica a todos los administradores que tienen habilitado el tipo de evento especificado
 * @param {string} eventType - Tipo de evento: 'clockIn', 'clockOut', 'breakStart', 'lunchStart', 'incident'
 * @param {string} userName - Nombre del usuario que generó el evento
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @param {object} additionalData - Datos adicionales opcionales
 */
export async function notifyAdminsWorkEvent(eventType, userName, title, message, additionalData = {}) {
  try {
    // 1. Obtener todos los usuarios (necesitamos verificar sus preferencias)
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const notificationsToSend = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // 2. Cargar preferencias de notificación del usuario
        const preferencesRef = doc(db, 'users', userId, 'settings', 'notificationPreferences');
        const preferencesSnap = await getDoc(preferencesRef);
        
        if (!preferencesSnap.exists()) continue;
        
        const preferences = preferencesSnap.data();
        
        // 3. Verificar si tiene habilitado workEvents y el evento específico
        if (
          preferences.workEvents?.enabled &&
          preferences.workEvents?.events?.[eventType] === true
        ) {
          // Este usuario debe recibir la notificación
          notificationsToSend.push({
            uid: userId,
            type: 'work_event',
            subType: eventType,
            title,
            message,
            read: false,
            createdAt: serverTimestamp(),
            date: new Date().toISOString(),
            ...additionalData
          });
        }
      } catch (error) {
        logger.error(`Error verificando preferencias para usuario ${userId}:`, error);
      }
    }
    
    // 4. Crear todas las notificaciones
    if (notificationsToSend.length > 0) {
      const promises = notificationsToSend.map(notification =>
        addDoc(collection(db, 'notifications'), notification)
      );
      await Promise.all(promises);
      logger.info(`✅ ${notificationsToSend.length} notificaciones de ${eventType} enviadas`);
    } else {
      logger.info(`ℹ️ Ningún admin tiene habilitado ${eventType}`);
    }
  } catch (error) {
    logger.error('Error notificando evento de trabajo:', error);
  }
}

/**
 * Notifica a usuarios específicos sobre alertas de admin
 * Esta función es llamada desde AdminCreateAlertScreen
 */
export async function notifyUsers(userIds, alertData) {
  try {
    const promises = userIds.map(userId =>
      addDoc(collection(db, 'notifications'), {
        uid: userId,
        type: 'admin_alert',
        title: alertData.title,
        message: alertData.message,
        priority: alertData.priority || 'normal',
        audience: alertData.audience || 'all',
        read: false,
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
        senderName: alertData.senderName,
        senderRole: alertData.senderRole,
        senderUid: alertData.senderUid,
        attachment: alertData.attachment || null,
        expirationDate: alertData.expirationDate || null
      })
    );
    
    await Promise.all(promises);
    logger.info(`✅ Alertas enviadas a ${userIds.length} usuarios`);
  } catch (error) {
    logger.error('Error enviando alertas:', error);
    throw error;
  }
}

/**
 * Notifica eventos de calendario a usuarios con preferencias habilitadas
 * @param {string} eventType - Tipo de evento: 'parafiscales', 'coljuegos', 'uiaf', 'contratos', 'festivos', 'custom'
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @param {object} additionalData - Datos adicionales opcionales
 */
export async function notifyCalendarEvent(eventType, title, message, additionalData = {}) {
  try {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const notificationsToSend = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        const preferencesRef = doc(db, 'users', userId, 'settings', 'notificationPreferences');
        const preferencesSnap = await getDoc(preferencesRef);
        
        if (!preferencesSnap.exists()) continue;
        
        const preferences = preferencesSnap.data();
        
        // Verificar si tiene habilitado el tipo de evento de calendario
        if (
          preferences.calendar?.enabled &&
          preferences.calendar?.events?.[eventType] === true
        ) {
          notificationsToSend.push({
            uid: userId,
            type: 'calendar',
            subType: eventType,
            title,
            message,
            read: false,
            createdAt: serverTimestamp(),
            date: new Date().toISOString(),
            ...additionalData
          });
        }
      } catch (error) {
        logger.error(`Error verificando preferencias para usuario ${userId}:`, error);
      }
    }
    
    // Crear todas las notificaciones
    if (notificationsToSend.length > 0) {
      const promises = notificationsToSend.map(notification =>
        addDoc(collection(db, 'notifications'), notification)
      );
      await Promise.all(promises);
      logger.info(`✅ ${notificationsToSend.length} notificaciones de calendario enviadas`);
    }
  } catch (error) {
    logger.error('Error notificando evento de calendario:', error);
  }
}
