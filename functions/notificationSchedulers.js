const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const asistenciasSnapshot = await db.collection('asistencias')
      .where('fecha', '==', today)
      .where('estadoActual', 'in', ['trabajando', 'break', 'almuerzo'])
      .get();

    let notificationsCreated = 0;

    for (const doc of asistenciasSnapshot.docs) {
      const session = doc.data();
      
      // Calcular horas trabajadas
      const entrada = session.entrada.hora.toDate();
      const now = new Date();
      const horasTrabajadas = (now - entrada) / 1000 / 60 / 60;

      // Si lleva más de 8 horas trabajando
      if (horasTrabajadas >= 8) {
        // Obtener usuarios con exitReminder habilitado
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
          const userSettings = await db.collection('users').doc(userDoc.id)
            .collection('settings').doc('notificationPreferences').get();

          if (userSettings.exists) {
            const prefs = userSettings.data();
            if (prefs?.attendance?.enabled && prefs?.attendance?.exitReminder) {
              await db.collection('notifications').add({
                userId: userDoc.id,
                type: 'attendance',
                subType: 'exitReminder',
                title: '🏠 Recordatorio de Salida',
                message: `${session.userName} lleva ${horasTrabajadas.toFixed(1)}h trabajando sin registrar salida`,
                timestamp: Timestamp.now(),
                read: false,
                data: {
                  sessionUserId: session.uid,
                  horasTrabajadas: horasTrabajadas.toFixed(2),
                  fecha: formatDate(now)
                }
              });
              notificationsCreated++;
            }
          }
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

    let notificationsCreated = 0;

    for (const doc of asistenciasSnapshot.docs) {
      const session = doc.data();
      
      // Calcular tiempo desde entrada
      const entrada = session.entrada.hora.toDate();
      const now = new Date();
      const horasTrabajadas = (now - entrada) / 1000 / 60 / 60;

      // Si lleva más de 4h sin break
      if (horasTrabajadas >= 4 && (!session.breaks || session.breaks.length === 0)) {
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
          const userSettings = await db.collection('users').doc(userDoc.id)
            .collection('settings').doc('notificationPreferences').get();

          if (userSettings.exists) {
            const prefs = userSettings.data();
            if (prefs?.attendance?.enabled && prefs?.attendance?.breakReminder) {
              await db.collection('notifications').add({
                userId: userDoc.id,
                type: 'attendance',
                subType: 'breakReminder',
                title: '☕ Recordatorio de Break',
                message: `${session.userName} lleva ${horasTrabajadas.toFixed(1)}h trabajando sin descanso`,
                timestamp: Timestamp.now(),
                read: false,
                data: {
                  sessionUserId: session.uid,
                  horasTrabajadas: horasTrabajadas.toFixed(2),
                  fecha: formatDate(now)
                }
              });
              notificationsCreated++;
            }
          }
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

    let notificationsCreated = 0;

    for (const doc of asistenciasSnapshot.docs) {
      const session = doc.data();
      
      // Si no ha tomado almuerzo
      if (!session.almuerzo || !session.almuerzo.inicio) {
        const usersSnapshot = await db.collection('users').get();

        for (const userDoc of usersSnapshot.docs) {
          const userSettings = await db.collection('users').doc(userDoc.id)
            .collection('settings').doc('notificationPreferences').get();

          if (userSettings.exists) {
            const prefs = userSettings.data();
            if (prefs?.attendance?.enabled && prefs?.attendance?.lunchReminder) {
              await db.collection('notifications').add({
                userId: userDoc.id,
                type: 'attendance',
                subType: 'lunchReminder',
                title: '🍽️ Hora de Almuerzo',
                message: `${session.userName} aún no ha registrado su almuerzo`,
                timestamp: Timestamp.now(),
                read: false,
                data: {
                  sessionUserId: session.uid,
                  fecha: formatDate(new Date())
                }
              });
              notificationsCreated++;
            }
          }
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
    const in7Days = addDays(now, 7);
    
    // Query commitments próximos a vencer (pendientes)
    const commitmentsSnapshot = await db.collection('commitments')
      .where('status', '==', 'pendiente')
      .get();

    let notificationsCreated = 0;

    for (const doc of commitmentsSnapshot.docs) {
      const commitment = doc.data();
      
      if (!commitment.dueDate) continue;
      
      const dueDate = commitment.dueDate.toDate();
      const daysLeft = differenceInDays(dueDate, now);

      // Solo notificar a 7, 3 y 1 día antes
      if (![7, 3, 1].includes(daysLeft)) continue;

      // Determinar tipo de evento basado en el nombre
      let eventType = 'custom';
      const commitmentTitle = (commitment.name || '').toLowerCase();
      
      if (commitmentTitle.includes('parafiscal')) eventType = 'parafiscales';
      else if (commitmentTitle.includes('coljuegos')) eventType = 'coljuegos';
      else if (commitmentTitle.includes('uiaf')) eventType = 'uiaf';
      else if (commitmentTitle.includes('contrato')) eventType = 'contratos';
      else if (commitmentTitle.includes('festivo')) eventType = 'festivos';

      // Obtener usuarios con este tipo de evento habilitado
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userSettings = await db.collection('users').doc(userDoc.id)
          .collection('settings').doc('notificationPreferences').get();

        if (userSettings.exists) {
          const prefs = userSettings.data();
          if (prefs?.calendar?.enabled && prefs?.calendar?.events?.[eventType]) {
            const pad = (n) => String(n).padStart(2, '0');
            const dueDateStr = `${pad(dueDate.getDate())}/${pad(dueDate.getMonth() + 1)}/${dueDate.getFullYear()}`;
            
            await db.collection('notifications').add({
              userId: userDoc.id,
              type: 'calendar',
              subType: eventType,
              title: `📅 Recordatorio: ${commitment.name}`,
              message: `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''} (${dueDateStr})${commitment.amount ? ` - $${commitment.amount.toLocaleString()}` : ''}`,
              timestamp: Timestamp.now(),
              read: false,
              data: {
                commitmentId: doc.id,
                daysLeft: daysLeft,
                dueDate: dueDateStr,
                amount: commitment.amount || 0,
                empresa: commitment.empresa || 'N/A'
              }
            });
            notificationsCreated++;
          }
        }
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
  schedule: '*/15 * * * *', // Cada 15 minutos
  timeZone: 'America/Bogota',
  memory: '512MiB',
  timeoutSeconds: 180
}, async (event) => {
  console.log('📅 Ejecutando checkCustomCalendarEvents...');
  
  try {
    const now = new Date();
    let notificationsCreated = 0;

    // Query eventos personalizados activos
    const eventsSnapshot = await db.collection('calendar_events')
      .where('type', '==', 'custom')
      .get();

    console.log(`📊 Encontrados ${eventsSnapshot.size} eventos personalizados`);

    for (const eventDoc of eventsSnapshot.docs) {
      const calendarEvent = eventDoc.data();
      
      if (!calendarEvent.date || !calendarEvent.notifications) continue;
      
      const eventDate = calendarEvent.date.toDate();
      const notifications = calendarEvent.notifications || [];
      
      // Procesar cada notificación configurada
      for (const notif of notifications) {
        if (!notif.enabled) continue;

        // Calcular el tiempo de la notificación
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

        // Verificar si debe notificarse AHORA (dentro de los próximos 15 minutos)
        const timeDiff = notificationTime - now;
        const minutesUntilNotification = timeDiff / (1000 * 60);

        // Si la notificación debe dispararse en los próximos 15 minutos
        if (minutesUntilNotification >= 0 && minutesUntilNotification < 15) {
          
          // Verificar si ya se creó esta notificación (evitar duplicados)
          const existingNotifQuery = await db.collection('notifications')
            .where('data.calendarEventId', '==', eventDoc.id)
            .where('data.notificationTime', '==', notif.time)
            .where('data.notificationUnit', '==', notif.unit)
            .get();

          if (!existingNotifQuery.empty) {
            console.log(`⏭️ Notificación ya existe para evento ${eventDoc.id}`);
            continue;
          }

          // Crear notificación para el creador del evento
          const creatorId = calendarEvent.createdBy;
          
          if (creatorId) {
            // Verificar preferencias del usuario
            const userSettings = await db.collection('users').doc(creatorId)
              .collection('settings').doc('notificationPreferences').get();

            if (userSettings.exists) {
              const prefs = userSettings.data();
              
              // Verificar si tiene habilitadas notificaciones de calendario custom
              if (prefs?.calendar?.enabled && prefs?.calendar?.events?.custom) {
                
                // Formatear mensaje según el tiempo
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

                await db.collection('notifications').add({
                  userId: creatorId,
                  type: 'calendar',
                  subType: 'custom',
                  title: `📅 ${calendarEvent.title}`,
                  message: `${timeMessage} - ${eventDateStr} ${eventTimeStr}`,
                  timestamp: Timestamp.now(),
                  read: false,
                  data: {
                    calendarEventId: eventDoc.id,
                    eventDate: eventDateStr,
                    eventTime: eventTimeStr,
                    notificationTime: notif.time,
                    notificationUnit: notif.unit,
                    priority: calendarEvent.priority || 'medium',
                    description: calendarEvent.description || ''
                  }
                });
                
                notificationsCreated++;
                console.log(`✅ Notificación creada para ${calendarEvent.title} (${timeMessage})`);
              }
            }
          }
        }
      }

      // Procesar eventos recurrentes
      if (calendarEvent.recurrence?.enabled && calendarEvent.recurrence.endDate) {
        const recurrence = calendarEvent.recurrence;
        const endDate = recurrence.endDate.toDate();
        
        // Calcular próxima ocurrencia
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

        // Si la próxima ocurrencia está dentro del rango y no ha pasado el endDate
        if (nextOccurrence <= endDate && nextOccurrence > now) {
          console.log(`🔄 Evento recurrente: ${calendarEvent.title} - Próxima: ${nextOccurrence}`);
          // Las notificaciones se crearán en la próxima ejecución
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
