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
