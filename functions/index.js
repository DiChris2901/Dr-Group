const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Inicializar Firebase Admin
initializeApp();

// Importar funciones de notificaciones (Email + Telegram)
// TODO: Implementar nuevas funciones de notificaciones

/**
 * Cloud Function para eliminar usuario completo (Auth + Firestore)
 * Solo disponible para administradores
 */
exports.deleteUserComplete = onCall(async (request) => {
  const { auth, data } = request;

  // Verificar autenticación
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { userEmail, userId } = data;

  if (!userEmail || !userId) {
    throw new HttpsError('invalid-argument', 'Email y ID de usuario requeridos');
  }

  try {
    const db = getFirestore();
    const adminAuth = getAuth();

    // 1. Verificar que el usuario que llama es administrador
    const callerDoc = await db.collection('users')
      .where('authUid', '==', auth.uid)
      .limit(1)
      .get();

    if (callerDoc.empty) {
      throw new HttpsError('permission-denied', 'Usuario no encontrado en sistema');
    }

    const callerData = callerDoc.docs[0].data();
    if (callerData.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Solo administradores pueden eliminar usuarios');
    }

    // 2. Obtener datos del usuario a eliminar
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    const userData = userDoc.data();

    // 3. Verificar que no es el último admin
    if (userData.role === 'ADMIN') {
      const adminQuery = await db.collection('users')
        .where('role', '==', 'ADMIN')
        .where('isActive', '!=', false)
        .get();
      
      if (adminQuery.size <= 1) {
        throw new HttpsError('failed-precondition', 'No puedes eliminar el último administrador');
      }
    }

    // 4. Prevenir auto-eliminación
    if (userData.email === callerData.email) {
      throw new HttpsError('failed-precondition', 'No puedes eliminar tu propio usuario');
    }

    // 5. Eliminar de Firebase Auth si tiene authUid
    let deletedFromAuth = false;
    if (userData.authUid) {
      try {
        await adminAuth.deleteUser(userData.authUid);
        deletedFromAuth = true;
        console.log('✅ Usuario eliminado de Firebase Auth:', userData.authUid);
      } catch (authError) {
        console.warn('⚠️ Error eliminando de Auth:', authError.code, authError.message);
        // Si no existe en Auth, no es error crítico
        if (authError.code === 'auth/user-not-found') {
          deletedFromAuth = true; // Ya no existe, considerarlo como eliminado
        }
      }
    } else {
      // Si no tiene authUid, buscar por email en Auth
      try {
        const userRecord = await adminAuth.getUserByEmail(userData.email);
        await adminAuth.deleteUser(userRecord.uid);
        deletedFromAuth = true;
        console.log('✅ Usuario eliminado de Firebase Auth (por email):', userRecord.uid);
      } catch (authError) {
        console.warn('⚠️ Usuario no encontrado en Auth o error:', authError.code, authError.message);
        if (authError.code === 'auth/user-not-found') {
          deletedFromAuth = true; // Ya no existe en Auth
        }
      }
    }

    // 6. Eliminar de Firestore
    await db.collection('users').doc(userId).delete();
    console.log('✅ Usuario eliminado de Firestore:', userId);

    // 7. Log de auditoría
    await db.collection('audit_logs').add({
      action: 'DELETE_USER',
      targetUser: userData.email,
      performedBy: callerData.email,
      performedByUid: auth.uid,
      timestamp: new Date(),
      details: {
        deletedUser: {
          email: userData.email,
          role: userData.role,
          displayName: userData.displayName
        }
      }
    });

    return {
      success: true,
      message: `Usuario ${userData.email} eliminado completamente`,
      deletedFromAuth: deletedFromAuth,
      deletedFromFirestore: true
    };

  } catch (error) {
    console.error('❌ Error en deleteUserComplete:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Proporcionar más detalles del error
    let errorMessage = 'Error interno desconocido';
    if (error.message) {
      errorMessage = error.message;
    }
    
    throw new HttpsError('internal', `Error interno: ${errorMessage}`);
  }
});

/**
 * HTTP proxy para descargar archivos de Storage evitando CORS en el cliente.
 * Uso: GET /storageProxy?path=<ruta en el bucket>
 */
exports.storageProxy = onRequest(async (req, res) => {
  // Permitir CORS básico
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const path = req.query.path;
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Missing required query param: path' });
    }

    const bucket = getStorage().bucket();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=0, no-cache');

    file.createReadStream()
      .on('error', (err) => {
        console.error('storageProxy stream error:', err);
        res.status(500).json({ error: 'Stream error', details: err.message });
      })
      .pipe(res);
  } catch (err) {
    console.error('storageProxy error:', err);
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

/**
 * Helper: Enviar mensaje de Telegram
 */
const sendTelegramMessage = async (chatId, text, options = {}) => {
  const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || 
                    process.env.TELEGRAM_BOT_TOKEN ||
                    '8430298503:AAEVPOGrIp5_UdUNGXSy3AD9rI8mS2OKipQ';
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_notification: options.silent || false,
    ...options
  };

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json();
};

/**
 * Helper: Obtener resumen del dashboard
 */
const getDashboardSummary = async (userId = null) => {
  const db = getFirestore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Obtener compromisos
  let commitmentsQuery = db.collection('commitments');
  const commitmentsSnapshot = await commitmentsQuery.get();
  
  const commitments = commitmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Filtrar compromisos por estado
  const overdue = commitments.filter(c => {
    const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
    return dueDate < today && c.status !== 'paid';
  });

  const dueToday = commitments.filter(c => {
    const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    return dueDateOnly.getTime() === today.getTime() && c.status !== 'paid';
  });

  const next7Days = commitments.filter(c => {
    const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
    const diff = (dueDate - today) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7 && c.status !== 'paid';
  });

  const pending = commitments.filter(c => c.status === 'pending' || c.status === 'overdue');
  
  // Calcular totales
  const totalPending = pending.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalOverdue = overdue.reduce((sum, c) => sum + (c.amount || 0), 0);

  return {
    totalCommitments: commitments.length,
    overdue: overdue.length,
    overdueAmount: totalOverdue,
    dueToday: dueToday.length,
    next7Days: next7Days.length,
    pendingCount: pending.length,
    totalPending: totalPending
  };
};

/**
 * Webhook para Telegram Bot (Mejorado con comandos)
 */
exports.telegramWebhook = onRequest(async (req, res) => {
  // Solo aceptar POST requests
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const update = req.body;
    
    // Verificar si hay un mensaje
    if (!update.message) {
      return res.status(200).send('OK');
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from.first_name || 'Usuario';
    const username = message.from.username || '';

    const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || 
                      process.env.TELEGRAM_BOT_TOKEN ||
                      '8430298503:AAEVPOGrIp5_UdUNGXSy3AD9rI8mS2OKipQ';

    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN no configurado');
      return res.status(200).send('OK');
    }

    // Comando /start
    if (text && text.toLowerCase() === '/start') {
      const responseMessage = 
        `🎉 ¡Hola ${firstName}! 👋\n\n` +
        `Tu bot de DR Group está listo para enviarte notificaciones.\n\n` +
        `📱 <b>Tu Chat ID es:</b> <code>${chatId}</code>\n\n` +
        `✅ Copia este número y pégalo en la configuración de notificaciones del dashboard.\n\n` +
        `💡 <b>Instrucciones:</b>\n` +
        `1. Ve a la página de Usuarios en el dashboard\n` +
        `2. Haz clic en el botón de configuración (⚙️)\n` +
        `3. Activa Telegram\n` +
        `4. Pega tu Chat ID: <code>${chatId}</code>\n` +
        `5. Guarda y prueba la notificación\n\n` +
        `📋 <b>Comandos disponibles:</b>\n` +
        `/help - Ver todos los comandos\n` +
        `/dashboard - Resumen del dashboard\n` +
        `/compromisos - Ver compromisos próximos\n` +
        `/pagos - Resumen de pagos pendientes\n\n` +
        `🤖 <i>DR Group Bot</i>`;

      await sendTelegramMessage(chatId, responseMessage);
      console.log(`✅ /start - ${firstName} (${username}) - Chat ID: ${chatId}`);
    }
    
    // Comando /help
    else if (text && text.toLowerCase() === '/help') {
      const helpMessage = 
        `📚 <b>Ayuda - DR Group Bot</b>\n\n` +
        `<b>Comandos Disponibles:</b>\n\n` +
        `🏠 /dashboard - Resumen general del sistema\n` +
        `📅 /compromisos - Ver compromisos próximos a vencer\n` +
        `💰 /pagos - Resumen de pagos pendientes\n` +
        `📊 /reporte - Solicitar reporte del día\n` +
        `❓ /help - Mostrar esta ayuda\n\n` +
        `<b>Notificaciones Automáticas:</b>\n` +
        `• Reporte diario a las 8:00 AM\n` +
        `• Alertas de compromisos vencidos\n` +
        `• Notificaciones de pagos registrados\n` +
        `• Eventos del calendario\n\n` +
        `💡 <b>Configuración:</b>\n` +
        `Administra tus notificaciones desde el dashboard en la sección de Usuarios.\n\n` +
        `🔗 <b>Dashboard:</b> https://dr-group-cd21b.web.app`;

      await sendTelegramMessage(chatId, helpMessage);
      console.log(`✅ /help - ${firstName}`);
    }
    
    // Comando /dashboard
    else if (text && text.toLowerCase() === '/dashboard') {
      try {
        const summary = await getDashboardSummary();
        const dashboardMessage = 
          `📊 <b>Resumen del Dashboard</b>\n\n` +
          `📅 <b>Compromisos:</b>\n` +
          `• Total: ${summary.totalCommitments}\n` +
          `• Pendientes: ${summary.pendingCount}\n` +
          `• Vencidos: ${summary.overdue} ⚠️\n` +
          `• Vencen hoy: ${summary.dueToday}\n` +
          `• Próximos 7 días: ${summary.next7Days}\n\n` +
          `💰 <b>Montos:</b>\n` +
          `• Total pendiente: $${summary.totalPending.toLocaleString('es-CO')}\n` +
          `• Vencido: $${summary.overdueAmount.toLocaleString('es-CO')} ${summary.overdueAmount > 0 ? '⚠️' : '✅'}\n\n` +
          `🕐 Actualizado: ${new Date().toLocaleString('es-CO')}\n\n` +
          `🔗 <a href="https://dr-group-cd21b.web.app">Abrir Dashboard</a>`;

        await sendTelegramMessage(chatId, dashboardMessage);
        console.log(`✅ /dashboard - ${firstName}`);
      } catch (error) {
        console.error('Error en /dashboard:', error);
        await sendTelegramMessage(chatId, '❌ Error al obtener resumen. Intenta nuevamente.');
      }
    }
    
    // Comando /compromisos
    else if (text && text.toLowerCase() === '/compromisos') {
      try {
        const db = getFirestore();
        const today = new Date();
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const snapshot = await db.collection('commitments')
          .where('status', 'in', ['pending', 'overdue'])
          .orderBy('dueDate', 'asc')
          .limit(10)
          .get();

        if (snapshot.empty) {
          await sendTelegramMessage(chatId, '✅ No hay compromisos pendientes próximos.');
          return res.status(200).send('OK');
        }

        let message = `📅 <b>Compromisos Próximos</b>\n\n`;
        
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
          const isOverdue = dueDate < today;
          const icon = isOverdue ? '🔴' : '🟡';
          
          message += `${icon} <b>${data.concept || 'Sin concepto'}</b>\n`;
          message += `   💰 $${(data.amount || 0).toLocaleString('es-CO')}\n`;
          message += `   📅 Vence: ${dueDate.toLocaleDateString('es-CO')}\n`;
          if (data.companyName) message += `   🏢 ${data.companyName}\n`;
          message += `\n`;
        });

        message += `\n🔗 <a href="https://dr-group-cd21b.web.app/commitments">Ver todos</a>`;

        await sendTelegramMessage(chatId, message);
        console.log(`✅ /compromisos - ${firstName}`);
      } catch (error) {
        console.error('Error en /compromisos:', error);
        await sendTelegramMessage(chatId, '❌ Error al obtener compromisos.');
      }
    }
    
    // Comando /pagos
    else if (text && text.toLowerCase() === '/pagos') {
      try {
        const summary = await getDashboardSummary();
        const pagosMessage = 
          `💰 <b>Resumen de Pagos</b>\n\n` +
          `📊 <b>Estadísticas:</b>\n` +
          `• Compromisos pendientes: ${summary.pendingCount}\n` +
          `• Total a pagar: $${summary.totalPending.toLocaleString('es-CO')}\n` +
          `• Vencidos: ${summary.overdue} compromisos\n` +
          `• Monto vencido: $${summary.overdueAmount.toLocaleString('es-CO')}\n\n` +
          `⚠️ <b>Urgente:</b>\n` +
          `• Vencen hoy: ${summary.dueToday}\n` +
          `• Próximos 7 días: ${summary.next7Days}\n\n` +
          `🔗 <a href="https://dr-group-cd21b.web.app/payments">Registrar pago</a>`;

        await sendTelegramMessage(chatId, pagosMessage);
        console.log(`✅ /pagos - ${firstName}`);
      } catch (error) {
        console.error('Error en /pagos:', error);
        await sendTelegramMessage(chatId, '❌ Error al obtener información de pagos.');
      }
    }
    
    // Comando /reporte
    else if (text && text.toLowerCase() === '/reporte') {
      try {
        const summary = await getDashboardSummary();
        const now = new Date();
        const reporteMessage = 
          `📊 <b>Reporte Diario - DR Group</b>\n` +
          `📅 ${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
          `<b>═══════════════════</b>\n\n` +
          `📋 <b>Compromisos:</b>\n` +
          `• Total activos: ${summary.totalCommitments}\n` +
          `• Pendientes: ${summary.pendingCount}\n` +
          `• 🔴 Vencidos: ${summary.overdue}\n` +
          `• ⚠️ Vencen hoy: ${summary.dueToday}\n` +
          `• 🟡 Próximos 7 días: ${summary.next7Days}\n\n` +
          `💰 <b>Situación Financiera:</b>\n` +
          `• Total pendiente: $${summary.totalPending.toLocaleString('es-CO')}\n` +
          `• Monto vencido: $${summary.overdueAmount.toLocaleString('es-CO')}\n\n` +
          `${summary.overdue > 0 ? '⚠️ <b>ATENCIÓN:</b> Hay compromisos vencidos que requieren acción inmediata.\n\n' : ''}` +
          `<b>═══════════════════</b>\n\n` +
          `🕐 Generado: ${now.toLocaleTimeString('es-CO')}\n` +
          `🔗 <a href="https://dr-group-cd21b.web.app">Abrir Dashboard</a>`;

        await sendTelegramMessage(chatId, reporteMessage);
        console.log(`✅ /reporte - ${firstName}`);
      } catch (error) {
        console.error('Error en /reporte:', error);
        await sendTelegramMessage(chatId, '❌ Error al generar reporte.');
      }
    }
    
    // Comando no reconocido
    else if (text && text.startsWith('/')) {
      const unknownMessage = 
        `❓ Comando no reconocido: <code>${text}</code>\n\n` +
        `Usa /help para ver los comandos disponibles.`;
      await sendTelegramMessage(chatId, unknownMessage);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    return res.status(200).send('OK'); // Siempre retornar 200 para Telegram
  }
});

/**
 * Reporte Automático Diario (8:00 AM Colombia)
 * Enviado a todos los usuarios con Telegram habilitado
 */
exports.dailyTelegramReport = onSchedule({
  schedule: '0 8 * * *',
  timeZone: 'America/Bogota',
  memory: '256MiB'
}, async (event) => {
  console.log('🤖 Iniciando reporte diario automático...');
  
  try {
    const db = getFirestore();
    
    // Obtener todos los usuarios con Telegram habilitado
    const usersSnapshot = await db.collection('users').get();
    const summary = await getDashboardSummary();
    
    const now = new Date();
    const greeting = now.getHours() < 12 ? '☀️ Buenos días' : '🌤️ Buenas tardes';
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const settings = userData.notificationSettings;
      
      // Verificar si tiene Telegram habilitado y Chat ID configurado
      if (!settings || !settings.telegramEnabled || !settings.telegramChatId) {
        continue;
      }
      
      const userName = userData.displayName || userData.name || 'Usuario';
      
      const reportMessage = 
        `${greeting} <b>${userName}</b> 👋\n\n` +
        `📊 <b>Reporte Diario - DR Group</b>\n` +
        `📅 ${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
        `<b>═══════════════════</b>\n\n` +
        `📋 <b>Compromisos:</b>\n` +
        `• Total activos: ${summary.totalCommitments}\n` +
        `• Pendientes: ${summary.pendingCount}\n` +
        `• 🔴 Vencidos: ${summary.overdue}\n` +
        `• ⚠️ Vencen hoy: ${summary.dueToday}\n` +
        `• 🟡 Próximos 7 días: ${summary.next7Days}\n\n` +
        `💰 <b>Situación Financiera:</b>\n` +
        `• Total pendiente: $${summary.totalPending.toLocaleString('es-CO')}\n` +
        `• Monto vencido: $${summary.overdueAmount.toLocaleString('es-CO')}\n\n` +
        `${summary.overdue > 0 ? '⚠️ <b>ATENCIÓN:</b> Hay compromisos vencidos que requieren acción inmediata.\n\n' : ''}` +
        `${summary.dueToday > 0 ? '📌 <b>RECORDATORIO:</b> Hay compromisos que vencen hoy.\n\n' : ''}` +
        `<b>═══════════════════</b>\n\n` +
        `💡 Usa /help para ver comandos disponibles\n` +
        `🔗 <a href="https://dr-group-cd21b.web.app">Abrir Dashboard</a>`;
      
      try {
        await sendTelegramMessage(settings.telegramChatId, reportMessage);
        sentCount++;
        console.log(`✅ Reporte enviado a ${userName} (${settings.telegramChatId})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error enviando a ${userName}:`, error);
      }
    }
    
    console.log(`✅ Reporte diario completado: ${sentCount} enviados, ${errorCount} errores`);
    return { success: true, sent: sentCount, errors: errorCount };
    
  } catch (error) {
    console.error('❌ Error en reporte diario:', error);
    throw error;
  }
});
