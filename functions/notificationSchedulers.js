const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { sendPushToUser } = require('./pushService');

const db = getFirestore();

// Helper para formatear fechas
const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const differenceInDays = (date1, date2) => {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Helper: Carga TODOS los usuarios con sus preferencias de notificación en una sola pasada.
 * Reduce N+1 queries (1 getDoc por usuario) a 1 query de usuarios + 1 batch de settings.
 * @returns {Array<{id, data, prefs}>} Lista de usuarios con sus preferencias
 */
async function loadUsersWithPreferences() {
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

  // Batch read de todas las preferencias de notificación (máximo 10 por batch en getAll)
  const settingsRefs = users.map(u =>
    db.collection('users').doc(u.id).collection('settings').doc('notificationPreferences')
  );

  // getAll soporta hasta 200 refs en una sola llamada
  const settingsDocs = await db.getAll(...settingsRefs);

  return users.map((user, index) => ({
    ...user,
    prefs: settingsDocs[index].exists ? settingsDocs[index].data() : null
  }));
}

// ============================================
// 1️⃣ RECORDATORIO DE SALIDA (6 PM Lunes-Viernes)
// ============================================
exports.checkExitReminder = onSchedule({
  schedule: '0 18 * * 1-5', // 6 PM lunes a viernes
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 60
}, async (event) => {
  console.log('🕐 Ejecutando checkExitReminder...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const asistenciasSnapshot = await db.collection('asistencias')
      .where('fecha', '==', today)
      .where('estadoActual', 'in', ['trabajando', 'break', 'almuerzo'])
      .get();

    // Cargar usuarios + preferencias en una sola pasada (batch read)
    const usersWithPrefs = await loadUsersWithPreferences();
    const eligibleUsers = usersWithPrefs.filter(u =>
      u.prefs?.attendance?.enabled && u.prefs?.attendance?.exitReminder
    );

    let notificationsCreated = 0;

    for (const doc of asistenciasSnapshot.docs) {
      const session = doc.data();
      const entrada = session.entrada.hora.toDate();
      const now = new Date();
      const horasTrabajadas = (now - entrada) / 1000 / 60 / 60;

      if (horasTrabajadas >= 8) {
        for (const user of eligibleUsers) {
          const exitTitle = '🏠 Recordatorio de Salida';
          const exitMessage = `${session.userName} lleva ${horasTrabajadas.toFixed(1)}h trabajando sin registrar salida`;
          const exitData = {
            sessionUserId: session.uid,
            horasTrabajadas: horasTrabajadas.toFixed(2),
            fecha: formatDate(now)
          };
          await db.collection('notifications').add({
            uid: user.id,
            type: 'attendance',
            subType: 'exitReminder',
            title: exitTitle,
            message: exitMessage,
            createdAt: Timestamp.now(),
            read: false,
            data: exitData
          });
          await sendPushToUser(user.id, { title: exitTitle, message: exitMessage, type: 'attendance', data: exitData });
          notificationsCreated++;
        }
      }
    }

    console.log(`✅ ${notificationsCreated} notificaciones de salida creadas`);
    return { success: true, count: notificationsCreated };
  } catch (error) {
    console.error('❌ Error en checkExitReminder:', error);
    throw error;
  }
});

// ============================================
// 2️⃣ RECORDATORIO DE BREAK (Cada 2 horas, 10 AM - 6 PM)
// ============================================
exports.checkBreakReminder = onSchedule({
  schedule: '0 10,12,14,16,18 * * 1-5', // 10 AM, 12 PM, 2 PM, 4 PM, 6 PM lunes-viernes
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 60
}, async (event) => {
  console.log('☕ Ejecutando checkBreakReminder...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const asistenciasSnapshot = await db.collection('asistencias')
      .where('fecha', '==', today)
      .where('estadoActual', '==', 'trabajando')
      .get();

    // Cargar usuarios + preferencias en una sola pasada (batch read)
    const usersWithPrefs = await loadUsersWithPreferences();
    const eligibleUsers = usersWithPrefs.filter(u =>
      u.prefs?.attendance?.enabled && u.prefs?.attendance?.breakReminder
    );

    let notificationsCreated = 0;

    for (const doc of asistenciasSnapshot.docs) {
      const session = doc.data();
      const entrada = session.entrada.hora.toDate();
      const now = new Date();
      const horasTrabajadas = (now - entrada) / 1000 / 60 / 60;

      if (horasTrabajadas >= 4 && (!session.breaks || session.breaks.length === 0)) {
        for (const user of eligibleUsers) {
          const breakTitle = '☕ Recordatorio de Break';
          const breakMessage = `${session.userName} lleva ${horasTrabajadas.toFixed(1)}h trabajando sin descanso`;
          const breakData = {
            sessionUserId: session.uid,
            horasTrabajadas: horasTrabajadas.toFixed(2),
            fecha: formatDate(now)
          };
          await db.collection('notifications').add({
            uid: user.id,
            type: 'attendance',
            subType: 'breakReminder',
            title: breakTitle,
            message: breakMessage,
            createdAt: Timestamp.now(),
            read: false,
            data: breakData
          });
          await sendPushToUser(user.id, { title: breakTitle, message: breakMessage, type: 'attendance', data: breakData });
          notificationsCreated++;
        }
      }
    }

    console.log(`✅ ${notificationsCreated} notificaciones de break creadas`);
    return { success: true, count: notificationsCreated };
  } catch (error) {
    console.error('❌ Error en checkBreakReminder:', error);
    throw error;
  }
});

// ============================================
// 3️⃣ RECORDATORIO DE ALMUERZO (12 PM Lunes-Viernes)
// ============================================
exports.checkLunchReminder = onSchedule({
  schedule: '0 12 * * 1-5', // 12 PM lunes a viernes
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 60
}, async (event) => {
  console.log('🍽️ Ejecutando checkLunchReminder...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const asistenciasSnapshot = await db.collection('asistencias')
      .where('fecha', '==', today)
      .where('estadoActual', 'in', ['trabajando', 'break'])
      .get();

    // Cargar usuarios + preferencias en una sola pasada (batch read)
    const usersWithPrefs = await loadUsersWithPreferences();
    const eligibleUsers = usersWithPrefs.filter(u =>
      u.prefs?.attendance?.enabled && u.prefs?.attendance?.lunchReminder
    );

    let notificationsCreated = 0;

    for (const doc of asistenciasSnapshot.docs) {
      const session = doc.data();

      if (!session.almuerzo || !session.almuerzo.inicio) {
        for (const user of eligibleUsers) {
          const lunchTitle = '🍽️ Hora de Almuerzo';
          const lunchMessage = `${session.userName} aún no ha registrado su almuerzo`;
          const lunchData = {
            sessionUserId: session.uid,
            fecha: formatDate(new Date())
          };
          await db.collection('notifications').add({
            uid: user.id,
            type: 'attendance',
            subType: 'lunchReminder',
            title: lunchTitle,
            message: lunchMessage,
            createdAt: Timestamp.now(),
            read: false,
            data: lunchData
          });
          await sendPushToUser(user.id, { title: lunchTitle, message: lunchMessage, type: 'attendance', data: lunchData });
          notificationsCreated++;
        }
      }
    }

    console.log(`✅ ${notificationsCreated} notificaciones de almuerzo creadas`);
    return { success: true, count: notificationsCreated };
  } catch (error) {
    console.error('❌ Error en checkLunchReminder:', error);
    throw error;
  }
});

// ============================================
// 4️⃣ EVENTOS DE CALENDARIO (9 AM Diario)
// ============================================
exports.checkCalendarEvents = onSchedule({
  schedule: '0 9 * * *', // 9 AM todos los días
  timeZone: 'America/Bogota',
  memory: '512MiB',
  timeoutSeconds: 120
}, async (event) => {
  console.log('📅 Ejecutando checkCalendarEvents...');

  try {
    const now = new Date();

    const commitmentsSnapshot = await db.collection('commitments')
      .where('status', '==', 'pendiente')
      .get();

    // Cargar usuarios + preferencias en una sola pasada (batch read)
    const usersWithPrefs = await loadUsersWithPreferences();

    let notificationsCreated = 0;

    for (const doc of commitmentsSnapshot.docs) {
      const commitment = doc.data();
      if (!commitment.dueDate) continue;

      const dueDate = commitment.dueDate.toDate();
      const daysLeft = differenceInDays(dueDate, now);
      if (![7, 3, 1].includes(daysLeft)) continue;

      let eventType = 'custom';
      const commitmentTitle = (commitment.name || '').toLowerCase();
      if (commitmentTitle.includes('parafiscal')) eventType = 'parafiscales';
      else if (commitmentTitle.includes('coljuegos')) eventType = 'coljuegos';
      else if (commitmentTitle.includes('uiaf')) eventType = 'uiaf';
      else if (commitmentTitle.includes('contrato')) eventType = 'contratos';
      else if (commitmentTitle.includes('festivo')) eventType = 'festivos';

      const eligibleUsers = usersWithPrefs.filter(u =>
        u.prefs?.calendar?.enabled && u.prefs?.calendar?.events?.[eventType]
      );

      for (const user of eligibleUsers) {
        const pad = (n) => String(n).padStart(2, '0');
        const dueDateStr = `${pad(dueDate.getDate())}/${pad(dueDate.getMonth() + 1)}/${dueDate.getFullYear()}`;

        const calTitle = `📅 Recordatorio: ${commitment.name}`;
        const calMessage = `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''} (${dueDateStr})${commitment.amount ? ` - $${commitment.amount.toLocaleString()}` : ''}`;
        const calData = {
          commitmentId: doc.id,
          daysLeft: daysLeft,
          dueDate: dueDateStr,
          amount: commitment.amount || 0,
          empresa: commitment.empresa || 'N/A'
        };
        await db.collection('notifications').add({
          uid: user.id,
          type: 'calendar',
          subType: eventType,
          title: calTitle,
          message: calMessage,
          createdAt: Timestamp.now(),
          read: false,
          data: calData
        });
        await sendPushToUser(user.id, { title: calTitle, message: calMessage, type: 'calendar', data: calData });
        notificationsCreated++;
      }
    }

    console.log(`✅ ${notificationsCreated} notificaciones de calendario creadas`);
    return { success: true, count: notificationsCreated };
  } catch (error) {
    console.error('❌ Error en checkCalendarEvents:', error);
    throw error;
  }
});

// ======================================
// NOTIFICACIONES DE EVENTOS PERSONALIZADOS DEL CALENDARIO
// ======================================
exports.checkCustomCalendarEvents = onSchedule({
  schedule: '*/30 * * * *', // Cada 30 minutos (antes: cada 15 — reduce 50% de ejecuciones)
  timeZone: 'America/Bogota',
  memory: '512MiB',
  timeoutSeconds: 180
}, async (event) => {
  console.log('📅 Ejecutando checkCustomCalendarEvents...');

  try {
    const now = new Date();
    let notificationsCreated = 0;

    const eventsSnapshot = await db.collection('calendar_events')
      .where('type', '==', 'custom')
      .get();

    console.log(`📊 Encontrados ${eventsSnapshot.size} eventos personalizados`);

    // Pre-cargar preferencias de usuarios que son creadores de eventos (batch)
    const creatorIds = new Set();
    for (const eventDoc of eventsSnapshot.docs) {
      const calendarEvent = eventDoc.data();
      if (calendarEvent.createdBy) creatorIds.add(calendarEvent.createdBy);
    }

    // Cargar settings de creadores en batch (1 llamada getAll en vez de N getDoc)
    const creatorPrefsMap = {};
    if (creatorIds.size > 0) {
      const settingsRefs = [...creatorIds].map(uid =>
        db.collection('users').doc(uid).collection('settings').doc('notificationPreferences')
      );
      const settingsDocs = await db.getAll(...settingsRefs);
      const creatorIdsArray = [...creatorIds];
      settingsDocs.forEach((doc, index) => {
        creatorPrefsMap[creatorIdsArray[index]] = doc.exists ? doc.data() : null;
      });
    }

    for (const eventDoc of eventsSnapshot.docs) {
      const calendarEvent = eventDoc.data();

      if (!calendarEvent.date || !calendarEvent.notifications) continue;

      const eventDate = calendarEvent.date.toDate();
      const notifications = calendarEvent.notifications || [];

      for (const notif of notifications) {
        if (!notif.enabled) continue;

        let notificationTime = new Date(eventDate);
        switch (notif.unit) {
          case 'minutes':
            notificationTime.setMinutes(notificationTime.getMinutes() - notif.time);
            break;
          case 'hours':
            notificationTime.setHours(notificationTime.getHours() - notif.time);
            break;
          case 'days':
            notificationTime.setDate(notificationTime.getDate() - notif.time);
            break;
        }

        const timeDiff = notificationTime - now;
        const minutesUntilNotification = timeDiff / (1000 * 60);

        // Ventana de 30 minutos (ajustada al nuevo intervalo)
        if (minutesUntilNotification >= 0 && minutesUntilNotification < 30) {

          // Verificar duplicados
          const existingNotifQuery = await db.collection('notifications')
            .where('data.calendarEventId', '==', eventDoc.id)
            .where('data.notificationTime', '==', notif.time)
            .where('data.notificationUnit', '==', notif.unit)
            .get();

          if (!existingNotifQuery.empty) {
            console.log(`⏭️ Notificación ya existe para evento ${eventDoc.id}`);
            continue;
          }

          const creatorId = calendarEvent.createdBy;
          if (!creatorId) continue;

          // Usar preferencias pre-cargadas (sin getDoc individual)
          const prefs = creatorPrefsMap[creatorId];
          if (!prefs?.calendar?.enabled || !prefs?.calendar?.events?.custom) continue;

          let timeMessage = '';
          if (notif.time === 0) {
            timeMessage = '¡Ahora!';
          } else if (notif.unit === 'minutes') {
            timeMessage = `en ${notif.time} minuto${notif.time > 1 ? 's' : ''}`;
          } else if (notif.unit === 'hours') {
            timeMessage = `en ${notif.time} hora${notif.time > 1 ? 's' : ''}`;
          } else if (notif.unit === 'days') {
            timeMessage = `en ${notif.time} día${notif.time > 1 ? 's' : ''}`;
          }

          const pad = (n) => String(n).padStart(2, '0');
          const eventDateStr = `${pad(eventDate.getDate())}/${pad(eventDate.getMonth() + 1)}/${eventDate.getFullYear()}`;
          const eventTimeStr = calendarEvent.allDay
            ? 'Todo el día'
            : `${pad(eventDate.getHours())}:${pad(eventDate.getMinutes())}`;

          const customTitle = `📅 ${calendarEvent.title}`;
          const customMessage = `${timeMessage} - ${eventDateStr} ${eventTimeStr}`;
          const customData = {
            calendarEventId: eventDoc.id,
            eventDate: eventDateStr,
            eventTime: eventTimeStr,
            notificationTime: notif.time,
            notificationUnit: notif.unit,
            priority: calendarEvent.priority || 'medium',
            description: calendarEvent.description || ''
          };
          await db.collection('notifications').add({
            uid: creatorId,
            type: 'calendar',
            subType: 'custom',
            title: customTitle,
            message: customMessage,
            createdAt: Timestamp.now(),
            read: false,
            data: customData
          });
          await sendPushToUser(creatorId, { title: customTitle, message: customMessage, type: 'calendar', data: customData });
          notificationsCreated++;
          console.log(`✅ Notificación creada para ${calendarEvent.title} (${timeMessage})`);
        }
      }

      // Procesar eventos recurrentes
      if (calendarEvent.recurrence?.enabled && calendarEvent.recurrence.endDate) {
        const recurrence = calendarEvent.recurrence;
        const endDate = recurrence.endDate.toDate();
        let nextOccurrence = new Date(eventDate);

        switch (recurrence.frequency) {
          case 'daily':
            nextOccurrence.setDate(nextOccurrence.getDate() + 1);
            break;
          case 'weekly':
            nextOccurrence.setDate(nextOccurrence.getDate() + 7);
            break;
          case 'monthly':
            nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
            break;
          case 'yearly':
            nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
            break;
        }

        if (nextOccurrence <= endDate && nextOccurrence > now) {
          console.log(`🔄 Evento recurrente: ${calendarEvent.title} - Próxima: ${nextOccurrence}`);
        }
      }
    }

    console.log(`✅ ${notificationsCreated} notificaciones de eventos personalizados creadas`);
    return { success: true, count: notificationsCreated };
  } catch (error) {
    console.error('❌ Error en checkCustomCalendarEvents:', error);
    throw error;
  }
});
