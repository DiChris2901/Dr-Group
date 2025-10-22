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
 * Helper: Obtener resumen del dashboard (con datos reales de Firestore)
 */
const getDashboardSummary = async (userId = null) => {
  const db = getFirestore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);
  
  // ========== COMPROMISOS ==========
  const commitmentsSnapshot = await db.collection('commitments').get();
  const commitments = commitmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`📊 Total compromisos en BD: ${commitments.length}`);
  
  // Obtener TODOS los pagos para cruzar con compromisos
  const allPaymentsSnapshot = await db.collection('payments').get();
  const allPayments = allPaymentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Indexar pagos por commitmentId para búsqueda rápida
  const paymentsByCommitment = {};
  allPayments.forEach(payment => {
    if (payment.commitmentId && !payment.is4x1000Tax) {
      if (!paymentsByCommitment[payment.commitmentId]) {
        paymentsByCommitment[payment.commitmentId] = [];
      }
      paymentsByCommitment[payment.commitmentId].push(payment);
    }
  });
  
  console.log(`💳 Total pagos indexados: ${Object.keys(paymentsByCommitment).length} compromisos con pagos`);
  
  // Clasificar compromisos según LÓGICA DE NEGOCIO CORRECTA
  const overdue = [];        // SIN pagos + fecha vencida
  const partialPayment = []; // CON pagos parciales (sin importar fecha)
  const dueToday = [];
  const next7Days = [];
  const paid = [];
  const pending = [];
  
  commitments.forEach(c => {
    // Verificar si está COMPLETAMENTE pagado
    const isCompletelyPaid = c.status === 'paid' || 
                            c.status === 'completed' || 
                            c.paid === true || 
                            c.isPaid === true;
    
    if (isCompletelyPaid) {
      paid.push(c);
      return;
    }
    
    // Obtener fecha de vencimiento
    const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Verificar si tiene pagos asociados
    const commitmentPayments = paymentsByCommitment[c.id] || [];
    const totalPaidAmount = commitmentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const hasPayments = commitmentPayments.length > 0 && totalPaidAmount > 0;
    
    // LÓGICA DE CLASIFICACIÓN:
    // 1. Si tiene pagos parciales → PENDIENTE (aunque esté vencido)
    if (hasPayments) {
      partialPayment.push(c);
      pending.push(c);
      return;
    }
    
    // 2. Sin pagos + fecha vencida → VENCIDO
    if (dueDate < today) {
      overdue.push(c);
      return;
    }
    
    // 3. Sin pagos + vence hoy → DUE TODAY
    if (dueDate.getTime() === today.getTime()) {
      dueToday.push(c);
      pending.push(c);
      return;
    }
    
    // 4. Sin pagos + vence en 7 días → NEXT 7 DAYS
    const diff = (dueDate - today) / (1000 * 60 * 60 * 24);
    if (diff > 0 && diff <= 7) {
      next7Days.push(c);
      pending.push(c);
      return;
    }
    
    // 5. Sin pagos + fecha futura → PENDING
    pending.push(c);
  });
  
  // Calcular totales de compromisos
  const totalPending = pending.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalOverdue = overdue.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaid = paid.reduce((sum, c) => sum + (c.amount || 0), 0);
  
  console.log(`📋 Clasificación: Vencidos=${overdue.length}, Parciales=${partialPayment.length}, Pendientes=${pending.length}, Pagados=${paid.length}`);
  
  // ========== PAGOS ==========
  const paymentsSnapshot = await db.collection('payments').get();
  console.log(`📊 Total pagos en BD: ${paymentsSnapshot.size}`);
  
  const payments = paymentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Pagos del mes actual (usar campo 'date' que es el correcto)
  const paymentsThisMonth = payments.filter(p => {
    try {
      // El campo correcto es 'date', no 'paymentDate'
      const paymentDate = p.date?.toDate ? p.date.toDate() : new Date(p.date);
      if (isNaN(paymentDate.getTime())) return false;
      return paymentDate >= firstDayOfMonth && paymentDate <= lastDayOfMonth;
    } catch (error) {
      console.warn('Error procesando fecha de pago:', p.id, error);
      return false;
    }
  });
  
  // Pagos de hoy
  const paymentsToday = payments.filter(p => {
    try {
      const paymentDate = p.date?.toDate ? p.date.toDate() : new Date(p.date);
      if (isNaN(paymentDate.getTime())) return false;
      const paymentDateOnly = new Date(paymentDate);
      paymentDateOnly.setHours(0, 0, 0, 0);
      return paymentDateOnly.getTime() === today.getTime();
    } catch (error) {
      console.warn('Error procesando fecha de pago hoy:', p.id, error);
      return false;
    }
  });
  
  // Calcular totales de pagos (excluir 4x1000)
  const realPayments = payments.filter(p => !p.is4x1000Tax);
  const totalPaymentsAmount = realPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaymentsThisMonth = paymentsThisMonth.filter(p => !p.is4x1000Tax).reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaymentsToday = paymentsToday.filter(p => !p.is4x1000Tax).reduce((sum, p) => sum + (p.amount || 0), 0);
  
  console.log(`💰 Resumen pagos: Total=${realPayments.length}, Este mes=${paymentsThisMonth.filter(p => !p.is4x1000Tax).length}, Hoy=${paymentsToday.filter(p => !p.is4x1000Tax).length}`);

  return {
    // Compromisos
    totalCommitments: commitments.length,
    overdue: overdue.length,
    overdueAmount: totalOverdue,
    dueToday: dueToday.length,
    next7Days: next7Days.length,
    pendingCount: pending.length,
    paidCount: paid.length,
    partialPaymentCount: partialPayment.length,
    totalPending: totalPending,
    totalPaid: totalPaid,
    
    // Pagos
    totalPayments: realPayments.length,
    totalPaymentsAmount: totalPaymentsAmount,
    paymentsThisMonth: paymentsThisMonth.filter(p => !p.is4x1000Tax).length,
    totalPaymentsThisMonth: totalPaymentsThisMonth,
    paymentsToday: paymentsToday.filter(p => !p.is4x1000Tax).length,
    totalPaymentsToday: totalPaymentsToday
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
        `/pagos - Resumen de pagos\n` +
        `/ultimos_pagos - Ver últimos pagos registrados\n\n` +
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
        `💰 /pagos - Resumen completo de pagos\n` +
        `💳 /ultimos_pagos - Ver últimos 10 pagos registrados\n` +
        `📊 /reporte - Solicitar reporte del día\n` +
        `❓ /help - Mostrar esta ayuda\n\n` +
        `<b>Notificaciones Automáticas:</b>\n` +
        `• Recordatorios inteligentes a las 7:00 AM\n` +
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
          `• Con pagos parciales: ${summary.partialPaymentCount} 🟠\n` +
          `• Pagados completos: ${summary.paidCount} ✅\n` +
          `• Vencidos sin pago: ${summary.overdue} ⚠️\n` +
          `• Vencen hoy: ${summary.dueToday}\n` +
          `• Próximos 7 días: ${summary.next7Days}\n\n` +
          `💰 <b>Montos Compromisos:</b>\n` +
          `• Total pendiente: $${summary.totalPending.toLocaleString('es-CO')}\n` +
          `• Monto pagado: $${summary.totalPaid.toLocaleString('es-CO')} ✅\n` +
          `• Vencido: $${summary.overdueAmount.toLocaleString('es-CO')} ${summary.overdueAmount > 0 ? '⚠️' : '✅'}\n\n` +
          `💳 <b>Pagos Registrados:</b>\n` +
          `• Total histórico: ${summary.totalPayments} pagos\n` +
          `• Monto total: $${summary.totalPaymentsAmount.toLocaleString('es-CO')}\n` +
          `• Este mes: ${summary.paymentsThisMonth} ($${summary.totalPaymentsThisMonth.toLocaleString('es-CO')})\n` +
          `• Hoy: ${summary.paymentsToday} ($${summary.totalPaymentsToday.toLocaleString('es-CO')})\n\n` +
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
        today.setHours(0, 0, 0, 0);
        const next30Days = new Date(today);
        next30Days.setDate(today.getDate() + 30);

        // CORREGIDO: Traer todos los compromisos y filtrar en memoria
        // (evita error de índice compuesto con where + orderBy)
        const snapshot = await db.collection('commitments').get();
        
        console.log(`📊 Total compromisos en BD: ${snapshot.size}`);
        
        // Filtrar manualmente compromisos pendientes/vencidos
        const filteredCommitments = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status || 'pending';
          
          // Solo compromisos no pagados
          if (status !== 'paid' && status !== 'cancelled') {
            filteredCommitments.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Ordenar por fecha de vencimiento
        filteredCommitments.sort((a, b) => {
          const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
          const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
          return dateA - dateB;
        });
        
        // Tomar solo los primeros 10
        const topCommitments = filteredCommitments.slice(0, 10);
        
        console.log(`📋 Compromisos filtrados: ${topCommitments.length}`);

        if (topCommitments.length === 0) {
          await sendTelegramMessage(chatId, '✅ No hay compromisos pendientes próximos.');
          console.log(`✅ /compromisos - ${firstName} - Sin compromisos`);
          return res.status(200).send('OK');
        }

        let message = `📅 <b>Compromisos Próximos</b> (${topCommitments.length})\n\n`;
        
        topCommitments.forEach((commitment, index) => {
          const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const isOverdue = dueDate < today;
          const icon = isOverdue ? '🔴' : '🟡';
          
          message += `${icon} <b>${commitment.concept || 'Sin concepto'}</b>\n`;
          message += `   💰 $${(commitment.amount || 0).toLocaleString('es-CO')}\n`;
          message += `   📅 Vence: ${dueDate.toLocaleDateString('es-CO')}\n`;
          if (commitment.companyName) message += `   🏢 ${commitment.companyName}\n`;
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
        const now = new Date();
        const monthName = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        
        const pagosMessage = 
          `💰 <b>Resumen de Pagos</b>\n\n` +
          `📊 <b>Compromisos Pendientes:</b>\n` +
          `• Cantidad: ${summary.pendingCount}\n` +
          `• Con pagos parciales: ${summary.partialPaymentCount} 🟠\n` +
          `• Total a pagar: $${summary.totalPending.toLocaleString('es-CO')}\n` +
          `• Vencidos sin pago: ${summary.overdue} compromisos\n` +
          `• Monto vencido: $${summary.overdueAmount.toLocaleString('es-CO')}\n\n` +
          `✅ <b>Compromisos Pagados:</b>\n` +
          `• Cantidad: ${summary.paidCount}\n` +
          `• Monto pagado: $${summary.totalPaid.toLocaleString('es-CO')}\n\n` +
          `💳 <b>Pagos Registrados (${monthName}):</b>\n` +
          `• Pagos este mes: ${summary.paymentsThisMonth}\n` +
          `• Total del mes: $${summary.totalPaymentsThisMonth.toLocaleString('es-CO')}\n` +
          `• Pagos hoy: ${summary.paymentsToday}\n` +
          `• Total hoy: $${summary.totalPaymentsToday.toLocaleString('es-CO')}\n\n` +
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
        const monthName = now.toLocaleDateString('es-CO', { month: 'long' });
        
        const reporteMessage = 
          `📊 <b>Reporte Diario - DR Group</b>\n` +
          `📅 ${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
          `<b>═══════════════════</b>\n\n` +
          `📋 <b>Compromisos:</b>\n` +
          `• Total activos: ${summary.totalCommitments}\n` +
          `• Pendientes: ${summary.pendingCount}\n` +
          `• Pagados: ${summary.paidCount} ✅\n` +
          `• 🔴 Vencidos: ${summary.overdue}\n` +
          `• ⚠️ Vencen hoy: ${summary.dueToday}\n` +
          `• 🟡 Próximos 7 días: ${summary.next7Days}\n\n` +
          `💰 <b>Situación Financiera:</b>\n` +
          `• Total pendiente: $${summary.totalPending.toLocaleString('es-CO')}\n` +
          `• Total pagado: $${summary.totalPaid.toLocaleString('es-CO')} ✅\n` +
          `• Monto vencido: $${summary.overdueAmount.toLocaleString('es-CO')}\n\n` +
          `💳 <b>Pagos de ${monthName}:</b>\n` +
          `• Pagos registrados: ${summary.paymentsThisMonth}\n` +
          `• Monto del mes: $${summary.totalPaymentsThisMonth.toLocaleString('es-CO')}\n` +
          `• Pagos hoy: ${summary.paymentsToday} ($${summary.totalPaymentsToday.toLocaleString('es-CO')})\n\n` +
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
    
    // Comando /ultimos_pagos
    else if (text && text.toLowerCase() === '/ultimos_pagos') {
      try {
        const db = getFirestore();
        
        // Obtener pagos (sin orderBy para evitar índice)
        const paymentsSnapshot = await db.collection('payments').get();
        
        console.log(`📊 Total pagos en BD: ${paymentsSnapshot.size}`);
        
        // Filtrar pagos reales (excluir 4x1000) y ordenar manualmente
        const realPayments = [];
        paymentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.is4x1000Tax) {
            realPayments.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Ordenar por fecha descendente
        realPayments.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });
        
        // Tomar solo los primeros 10
        const lastPayments = realPayments.slice(0, 10);
        
        console.log(`💳 Últimos pagos filtrados: ${lastPayments.length}`);

        if (lastPayments.length === 0) {
          await sendTelegramMessage(chatId, '📭 No hay pagos registrados aún.');
          console.log(`✅ /ultimos_pagos - ${firstName} - Sin pagos`);
          return res.status(200).send('OK');
        }

        let message = `💳 <b>Últimos Pagos Registrados</b> (${lastPayments.length})\n\n`;
        
        lastPayments.forEach((payment, index) => {
          const paymentDate = payment.date?.toDate ? payment.date.toDate() : new Date(payment.date);
          
          message += `${index + 1}. <b>${payment.concept || 'Sin concepto'}</b>\n`;
          message += `   💰 $${(payment.amount || 0).toLocaleString('es-CO')}\n`;
          message += `   📅 ${paymentDate.toLocaleDateString('es-CO')}\n`;
          if (payment.companyName) message += `   🏢 ${payment.companyName}\n`;
          if (payment.method) message += `   💳 ${payment.method}\n`;
          message += `\n`;
        });

        message += `🔗 <a href="https://dr-group-cd21b.web.app/payments">Ver todos los pagos</a>`;

        await sendTelegramMessage(chatId, message);
        console.log(`✅ /ultimos_pagos - ${firstName}`);
      } catch (error) {
        console.error('Error en /ultimos_pagos:', error);
        await sendTelegramMessage(chatId, '❌ Error al obtener pagos.');
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
      const monthName = now.toLocaleDateString('es-CO', { month: 'long' });
      
      const reportMessage = 
        `${greeting} <b>${userName}</b> 👋\n\n` +
        `📊 <b>Reporte Diario - DR Group</b>\n` +
        `📅 ${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
        `<b>═══════════════════</b>\n\n` +
        `📋 <b>Compromisos:</b>\n` +
        `• Total activos: ${summary.totalCommitments}\n` +
        `• Pendientes: ${summary.pendingCount}\n` +
        `• Con pagos parciales: ${summary.partialPaymentCount} 🟠\n` +
        `• Pagados completos: ${summary.paidCount} ✅\n` +
        `• 🔴 Vencidos sin pago: ${summary.overdue}\n` +
        `• ⚠️ Vencen hoy: ${summary.dueToday}\n` +
        `• 🟡 Próximos 7 días: ${summary.next7Days}\n\n` +
        `💰 <b>Situación Financiera:</b>\n` +
        `• Total pendiente: $${summary.totalPending.toLocaleString('es-CO')}\n` +
        `• Total pagado: $${summary.totalPaid.toLocaleString('es-CO')} ✅\n` +
        `• Monto vencido: $${summary.overdueAmount.toLocaleString('es-CO')}\n\n` +
        `💳 <b>Pagos de ${monthName}:</b>\n` +
        `• Registrados: ${summary.paymentsThisMonth} pagos\n` +
        `• Total: $${summary.totalPaymentsThisMonth.toLocaleString('es-CO')}\n` +
        `• Hoy: ${summary.paymentsToday} ($${summary.totalPaymentsToday.toLocaleString('es-CO')})\n\n` +
        `${summary.overdue > 0 ? '⚠️ <b>ATENCIÓN:</b> Hay compromisos vencidos SIN PAGOS que requieren acción inmediata.\n\n' : ''}` +
        `${summary.dueToday > 0 ? '📌 <b>RECORDATORIO:</b> Hay compromisos que vencen hoy.\n\n' : ''}` +
        `${summary.partialPaymentCount > 0 ? '🟠 <b>INFO:</b> Hay ' + summary.partialPaymentCount + ' compromiso(s) con pagos parciales pendientes de completar.\n\n' : ''}` +
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

/**
 * Recordatorios Inteligentes de Compromisos
 * Se ejecuta cada día a las 7:00 AM (1 hora antes del reporte)
 */
exports.smartCommitmentReminders = onSchedule({
  schedule: '0 7 * * *',
  timeZone: 'America/Bogota',
  memory: '256MiB'
}, async (event) => {
  console.log('⏰ Iniciando recordatorios inteligentes...');
  
  try {
    const db = getFirestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fechas de referencia
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Obtener compromisos pendientes
    const commitmentsSnapshot = await db.collection('commitments')
      .where('status', 'in', ['pending', 'overdue'])
      .get();
    
    const reminders = {
      overdue: [],      // Ya vencidos
      dueToday: [],     // Vencen hoy
      due3Days: []      // Vencen en 3 días
    };
    
    // Clasificar compromisos
    commitmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        reminders.overdue.push({ id: doc.id, ...data, dueDate });
      } else if (dueDate.getTime() === today.getTime()) {
        reminders.dueToday.push({ id: doc.id, ...data, dueDate });
      } else if (dueDate.getTime() === threeDaysFromNow.getTime()) {
        reminders.due3Days.push({ id: doc.id, ...data, dueDate });
      }
    });
    
    // Obtener usuarios con notificaciones habilitadas
    const usersSnapshot = await db.collection('users').get();
    
    let sentCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const settings = userData.notificationSettings;
      
      if (!settings || !settings.telegramEnabled || !settings.telegramChatId) {
        continue;
      }
      
      const userName = userData.displayName || userData.name || 'Usuario';
      
      // 🔴 CRÍTICO: Compromisos vencidos
      if (reminders.overdue.length > 0) {
        const overdueMessage = 
          `🔴 <b>ALERTA CRÍTICA</b>\n\n` +
          `⚠️ Tienes ${reminders.overdue.length} compromiso(s) VENCIDO(S)\n\n` +
          reminders.overdue.slice(0, 5).map(c => 
            `• <b>${c.concept}</b>\n` +
            `  💰 $${(c.amount || 0).toLocaleString('es-CO')}\n` +
            `  📅 Venció: ${c.dueDate.toLocaleDateString('es-CO')}\n` +
            `  ${c.companyName ? `🏢 ${c.companyName}\n` : ''}`
          ).join('\n') +
          (reminders.overdue.length > 5 ? `\n...y ${reminders.overdue.length - 5} más` : '') +
          `\n\n⚡ <b>ACCIÓN REQUERIDA INMEDIATA</b>`;
        
        await sendTelegramMessage(settings.telegramChatId, overdueMessage, { 
          disable_notification: false  // Sonido ALTO
        });
        sentCount++;
      }
      
      // ⚠️ URGENTE: Vencen hoy
      if (reminders.dueToday.length > 0) {
        const todayMessage = 
          `⚠️ <b>RECORDATORIO URGENTE</b>\n\n` +
          `📅 ${reminders.dueToday.length} compromiso(s) VENCEN HOY\n\n` +
          reminders.dueToday.slice(0, 5).map(c => 
            `• <b>${c.concept}</b>\n` +
            `  💰 $${(c.amount || 0).toLocaleString('es-CO')}\n` +
            `  ${c.companyName ? `🏢 ${c.companyName}\n` : ''}`
          ).join('\n') +
          (reminders.dueToday.length > 5 ? `\n...y ${reminders.dueToday.length - 5} más` : '') +
          `\n\n⏰ Vencen antes de medianoche`;
        
        await sendTelegramMessage(settings.telegramChatId, todayMessage, { 
          disable_notification: false  // Sonido MEDIO
        });
        sentCount++;
      }
      
      // 🟡 INFO: Vencen en 3 días
      if (reminders.due3Days.length > 0) {
        const threeDaysMessage = 
          `🟡 <b>Recordatorio</b>\n\n` +
          `📌 ${reminders.due3Days.length} compromiso(s) vencen en 3 días\n\n` +
          reminders.due3Days.slice(0, 5).map(c => 
            `• <b>${c.concept}</b>\n` +
            `  💰 $${(c.amount || 0).toLocaleString('es-CO')}\n` +
            `  📅 ${c.dueDate.toLocaleDateString('es-CO')}\n` +
            `  ${c.companyName ? `🏢 ${c.companyName}\n` : ''}`
          ).join('\n') +
          (reminders.due3Days.length > 5 ? `\n...y ${reminders.due3Days.length - 5} más` : '') +
          `\n\n💡 Planifica el pago con anticipación`;
        
        await sendTelegramMessage(settings.telegramChatId, threeDaysMessage, { 
          disable_notification: true  // Modo SILENCIOSO
        });
        sentCount++;
      }
    }
    
    console.log(`✅ Recordatorios completados: ${sentCount} enviados`);
    console.log(`   - Vencidos: ${reminders.overdue.length}`);
    console.log(`   - Hoy: ${reminders.dueToday.length}`);
    console.log(`   - 3 días: ${reminders.due3Days.length}`);
    
    return { 
      success: true, 
      sent: sentCount,
      overdue: reminders.overdue.length,
      today: reminders.dueToday.length,
      threeDays: reminders.due3Days.length
    };
    
  } catch (error) {
    console.error('❌ Error en recordatorios:', error);
    throw error;
  }
});

/**
 * Helper mejorado: Enviar mensaje con prioridad
 */
const sendTelegramMessageWithPriority = async (chatId, text, priority = 'normal') => {
  const options = {
    silent: priority === 'low',
    disable_notification: priority === 'low'
  };
  
  // Agregar emoji según prioridad
  let prefix = '';
  switch(priority) {
    case 'critical':
      prefix = '🔴 ';
      break;
    case 'high':
      prefix = '⚠️ ';
      break;
    case 'normal':
      prefix = '📌 ';
      break;
    case 'low':
      prefix = '📝 ';
      break;
  }
  
  return await sendTelegramMessage(chatId, prefix + text, options);
};
