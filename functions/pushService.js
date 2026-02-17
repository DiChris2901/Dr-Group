/**
 * Push Notification Service para DR Group
 * Usa expo-server-sdk para enviar notificaciones push reales
 * a dispositivos registrados en deviceTokens/{uid}
 */
const { Expo } = require('expo-server-sdk');
const { getFirestore } = require('firebase-admin/firestore');

const expo = new Expo();
const db = getFirestore();

/**
 * Envía una push notification a un usuario específico
 * @param {string} uid - ID del usuario destinatario
 * @param {Object} notification - Datos de la notificación
 * @param {string} notification.title - Título
 * @param {string} notification.message - Cuerpo del mensaje
 * @param {string} notification.type - Tipo de notificación (calendar, attendance, admin_alert, etc.)
 * @param {Object} [notification.data] - Datos adicionales para deep linking
 * @param {string} [notification.channelId] - Canal de Android (alerts, work-session, break, attendance)
 * @param {string} [notification.priority] - Prioridad (default, high)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendPushToUser(uid, notification) {
  try {
    // 1. Obtener el token del dispositivo del usuario
    const tokenDoc = await db.collection('deviceTokens').doc(uid).get();
    
    if (!tokenDoc.exists) {
      return { success: false, error: 'No device token found' };
    }

    const { token } = tokenDoc.data();

    if (!token || !Expo.isExpoPushToken(token)) {
      return { success: false, error: `Invalid push token: ${token}` };
    }

    // 2. Determinar canal de Android según tipo
    const channelId = notification.channelId || getChannelForType(notification.type);

    // 3. Construir el mensaje push
    const message = {
      to: token,
      title: notification.title,
      body: notification.message,
      data: {
        type: notification.type,
        ...(notification.data || {}),
      },
      channelId,
      sound: 'default',
      priority: notification.priority === 'high' ? 'high' : 'default',
      // Android: badge count no aplica, pero iOS sí
      badge: 1,
    };

    // 4. Enviar
    const [result] = await expo.sendPushNotificationsAsync([message]);

    if (result.status === 'ok') {
      return { success: true, ticketId: result.id };
    } else {
      // Si el token ya no es válido, limpiar de Firestore
      if (result.details?.error === 'DeviceNotRegistered') {
        await db.collection('deviceTokens').doc(uid).delete();
        console.log(`🗑️ Token inválido eliminado para ${uid}`);
      }
      return { success: false, error: result.message || result.details?.error };
    }
  } catch (error) {
    console.error(`❌ Error enviando push a ${uid}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envía push notifications a múltiples usuarios
 * @param {string[]} uids - Array de UIDs destinatarios
 * @param {Object} notification - Datos de la notificación (mismo formato que sendPushToUser)
 * @returns {Promise<{sent: number, failed: number, errors: string[]}>}
 */
async function sendPushToMultipleUsers(uids, notification) {
  const results = { sent: 0, failed: 0, errors: [] };

  if (!uids || uids.length === 0) return results;

  // 1. Obtener todos los tokens en batch
  const tokenDocs = await Promise.all(
    uids.map(uid => db.collection('deviceTokens').doc(uid).get())
  );

  // 2. Construir mensajes válidos
  const messages = [];
  const tokenUidMap = new Map(); // Para rastrear qué token pertenece a qué UID

  const channelId = notification.channelId || getChannelForType(notification.type);

  for (let i = 0; i < tokenDocs.length; i++) {
    const tokenDoc = tokenDocs[i];
    const uid = uids[i];

    if (!tokenDoc.exists) continue;
    
    const { token } = tokenDoc.data();
    if (!token || !Expo.isExpoPushToken(token)) continue;

    tokenUidMap.set(token, uid);
    messages.push({
      to: token,
      title: notification.title,
      body: notification.message,
      data: {
        type: notification.type,
        ...(notification.data || {}),
      },
      channelId,
      sound: 'default',
      priority: notification.priority === 'high' ? 'high' : 'default',
      badge: 1,
    });
  }

  if (messages.length === 0) return results;

  // 3. Enviar en chunks (Expo recomienda máximo 100 por batch)
  const chunks = expo.chunkPushNotifications(messages);
  
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      
      for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].status === 'ok') {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(tickets[i].message || tickets[i].details?.error || 'Unknown error');
          
          // Limpiar tokens inválidos
          if (tickets[i].details?.error === 'DeviceNotRegistered') {
            const failedToken = chunk[i].to;
            const failedUid = tokenUidMap.get(failedToken);
            if (failedUid) {
              await db.collection('deviceTokens').doc(failedUid).delete();
              console.log(`🗑️ Token inválido eliminado para ${failedUid}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error enviando chunk de push:', error.message);
      results.failed += chunk.length;
      results.errors.push(error.message);
    }
  }

  return results;
}

/**
 * Determina el canal de Android según el tipo de notificación
 */
function getChannelForType(type) {
  switch (type) {
    case 'attendance':
      return 'attendance';
    case 'calendar':
      return 'attendance';
    case 'admin_alert':
      return 'alerts';
    case 'novedad_approved':
    case 'novedad_rejected':
    case 'admin_new_novedad':
      return 'alerts';
    case 'work_goal_reached':
    case 'long_break':
      return 'work-session';
    default:
      return 'alerts';
  }
}

module.exports = { sendPushToUser, sendPushToMultipleUsers };
