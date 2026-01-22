const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Inicializar Firebase Admin
initializeApp();

// Importar funciones de notificaciones scheduled
const notificationSchedulers = require('./notificationSchedulers');

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
 * Helper: Enviar mensaje de Telegram con soporte para botones inline
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

  // Agregar botones inline si se proporcionan
  if (options.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

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
 * Función auxiliar: Manejar consulta de compromisos por mes
 */
async function handleCommitmentsMonth(chatId, monthNumber, year, monthName, firstName) {
  try {
    console.log(`🔍 handleCommitmentsMonth - Chat: ${chatId}, Mes: ${monthNumber}, Año: ${year}`);
    const db = getFirestore();
    
    // Calcular rango de fechas del mes
    const startDate = new Date(year, monthNumber - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNumber, 0); // Último día del mes
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📅 Rango: ${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Obtener todos los compromisos y filtrar por mes
    const snapshot = await db.collection('commitments').get();
    console.log(`📊 Total compromisos en BD: ${snapshot.size}`);
    
    const monthCommitments = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
      
      if (dueDate >= startDate && dueDate <= endDate) {
        monthCommitments.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Ordenar por fecha de vencimiento
    monthCommitments.sort((a, b) => {
      const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
      const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
      return dateA - dateB;
    });
    
    console.log(`📋 Compromisos filtrados del mes: ${monthCommitments.length}`);
    
    if (monthCommitments.length === 0) {
      await sendTelegramMessage(chatId, `📅 No hay compromisos registrados para ${monthName} ${year}`);
      console.log(`✅ /compromisos mes ${monthNumber} - ${firstName} - Sin compromisos`);
      return;
    }
    
    let totalAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    
    let message = `📅 <b>Compromisos de ${monthName} ${year}</b>\n\n`;
    
    monthCommitments.forEach((commitment, index) => {
      const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const amount = commitment.amount || 0;
      totalAmount += amount;
      
      const isPaid = commitment.status === 'paid' || commitment.paid === true || commitment.isPaid === true;
      const isOverdue = dueDate < today && !isPaid;
      
      let icon = '🟢';
      if (isPaid) {
        icon = '✅';
        paidCount++;
      } else if (isOverdue) {
        icon = '🔴';
        overdueCount++;
      } else {
        icon = '🟡';
        pendingCount++;
      }
      
      message += `${icon} <b>${commitment.concept || 'Sin concepto'}</b>\n`;
      message += `   💰 $${amount.toLocaleString('es-CO')}\n`;
      message += `   📅 ${dueDate.toLocaleDateString('es-CO')}\n`;
      if (commitment.companyName) message += `   🏢 ${commitment.companyName}\n`;
      message += `\n`;
    });
    
    message += `<b>═══════════════════</b>\n`;
    message += `📊 <b>Resumen:</b>\n`;
    message += `• Total: ${monthCommitments.length} compromisos\n`;
    message += `• ✅ Pagados: ${paidCount}\n`;
    message += `• 🟡 Pendientes: ${pendingCount}\n`;
    message += `• 🔴 Vencidos: ${overdueCount}\n`;
    message += `• 💵 Monto total: $${totalAmount.toLocaleString('es-CO')}\n\n`;
    message += `🔗 <a href="https://dr-group-cd21b.web.app/commitments">Ver en dashboard</a>`;
    
    // Crear botones inline para ver detalles de cada compromiso
    const buttons = [];
    monthCommitments.slice(0, 5).forEach((commitment) => {
      buttons.push([{
        text: `📋 ${(commitment.concept || 'Sin concepto').substring(0, 30)}...`,
        callback_data: `detail_commitment_${commitment.id}`
      }]);
    });
    
    // Agregar botón de dashboard al final
    buttons.push([{
      text: '🌐 Abrir Dashboard Completo',
      url: 'https://dr-group-cd21b.web.app/commitments'
    }]);
    
    await sendTelegramMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
    console.log(`✅ /compromisos mes ${monthNumber} - ${firstName} - ${monthCommitments.length} compromisos con botones`);
  } catch (error) {
    console.error('Error en handleCommitmentsMonth:', error);
    await sendTelegramMessage(chatId, '❌ Error al obtener compromisos del mes.');
  }
}

/**
 * Función auxiliar: Manejar consulta de pagos por mes
 */
async function handlePaymentsMonth(chatId, monthNumber, year, monthName, firstName) {
  try {
    console.log(`🔍 handlePaymentsMonth - Chat: ${chatId}, Mes: ${monthNumber}, Año: ${year}`);
    const db = getFirestore();
    
    // Calcular rango de fechas del mes
    const startDate = new Date(year, monthNumber - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNumber, 0);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📅 Rango: ${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}`);
    
    // Obtener todos los pagos y filtrar por mes
    const paymentsSnapshot = await db.collection('payments').get();
    console.log(`📊 Total pagos en BD: ${paymentsSnapshot.size}`);
    
    const monthPayments = [];
    paymentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.is4x1000Tax) {
        const paymentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        
        if (paymentDate >= startDate && paymentDate <= endDate) {
          monthPayments.push({
            id: doc.id,
            ...data
          });
        }
      }
    });
    
    // Ordenar por fecha descendente
    monthPayments.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    
    console.log(`💳 Pagos filtrados del mes: ${monthPayments.length}`);
    
    if (monthPayments.length === 0) {
      await sendTelegramMessage(chatId, `💳 No hay pagos registrados para ${monthName} ${year}`);
      console.log(`✅ /pagos mes ${monthNumber} - ${firstName} - Sin pagos`);
      return;
    }
    
    let totalAmount = 0;
    let message = `💰 <b>Pagos de ${monthName} ${year}</b>\n\n`;
    
    monthPayments.forEach((payment, index) => {
      const paymentDate = payment.date?.toDate ? payment.date.toDate() : new Date(payment.date);
      const amount = payment.amount || 0;
      totalAmount += amount;
      
      message += `${index + 1}. <b>${payment.concept || 'Sin concepto'}</b>\n`;
      message += `   💰 $${amount.toLocaleString('es-CO')}\n`;
      message += `   📅 ${paymentDate.toLocaleDateString('es-CO')}\n`;
      if (payment.companyName) message += `   🏢 ${payment.companyName}\n`;
      if (payment.method) message += `   💳 ${payment.method}\n`;
      message += `\n`;
    });
    
    message += `<b>═══════════════════</b>\n`;
    message += `💵 <b>Total del mes:</b> $${totalAmount.toLocaleString('es-CO')}\n`;
    message += `📊 <b>Cantidad:</b> ${monthPayments.length} ${monthPayments.length === 1 ? 'pago' : 'pagos'}\n\n`;
    message += `🔗 <a href="https://dr-group-cd21b.web.app/payments">Ver en dashboard</a>`;
    
    // Crear botones inline para ver detalles de cada pago
    const buttons = [];
    monthPayments.slice(0, 5).forEach((payment) => {
      buttons.push([{
        text: `💳 ${(payment.concept || 'Sin concepto').substring(0, 30)}...`,
        callback_data: `detail_payment_${payment.id}`
      }]);
    });
    
    // Agregar botón de dashboard al final
    buttons.push([{
      text: '🌐 Abrir Dashboard Completo',
      url: 'https://dr-group-cd21b.web.app/payments'
    }]);
    
    await sendTelegramMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
    console.log(`✅ /pagos mes ${monthNumber} - ${firstName} - ${monthPayments.length} pagos con botones`);
  } catch (error) {
    console.error('Error en handlePaymentsMonth:', error);
    await sendTelegramMessage(chatId, '❌ Error al obtener pagos del mes.');
  }
}

/**
 * Función auxiliar: Manejar reporte de mes específico
 */
async function handleReportMonth(chatId, monthNumber, year, monthName, firstName) {
  try {
    console.log(`🔍 handleReportMonth - Chat: ${chatId}, Mes: ${monthNumber}, Año: ${year}`);
    const db = getFirestore();
    
    // Calcular rango de fechas del mes
    const startDate = new Date(year, monthNumber - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, monthNumber, 0);
    endDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`📅 Rango: ${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}`);
    
    // Obtener compromisos del mes
    const commitmentsSnapshot = await db.collection('commitments').get();
    console.log(`📊 Total compromisos en BD: ${commitmentsSnapshot.size}`);
    const monthCommitments = [];
    commitmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
      if (dueDate >= startDate && dueDate <= endDate) {
        monthCommitments.push({ id: doc.id, ...data });
      }
    });
    
    // Obtener pagos del mes
    const paymentsSnapshot = await db.collection('payments').get();
    const monthPayments = [];
    let totalPaymentsAmount = 0;
    paymentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.is4x1000Tax) {
        const paymentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        if (paymentDate >= startDate && paymentDate <= endDate) {
          monthPayments.push({ id: doc.id, ...data });
          totalPaymentsAmount += data.amount || 0;
        }
      }
    });
    
    // Analizar compromisos
    let totalCommitments = 0;
    let totalAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    
    monthCommitments.forEach(c => {
      totalCommitments++;
      totalAmount += c.amount || 0;
      
      const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const isPaid = c.status === 'paid' || c.paid === true || c.isPaid === true;
      const isOverdue = dueDate < today && !isPaid;
      
      if (isPaid) paidCount++;
      else if (isOverdue) overdueCount++;
      else pendingCount++;
    });
    
    const reportMessage = 
      `📊 <b>Reporte de ${monthName} ${year}</b>\n` +
      `📅 Generado: ${new Date().toLocaleDateString('es-CO')}\n\n` +
      `<b>═══════════════════</b>\n\n` +
      `📋 <b>Compromisos del mes:</b>\n` +
      `• Total: ${totalCommitments}\n` +
      `• ✅ Pagados: ${paidCount}\n` +
      `• 🟡 Pendientes: ${pendingCount}\n` +
      `• 🔴 Vencidos: ${overdueCount}\n` +
      `• 💵 Monto total: $${totalAmount.toLocaleString('es-CO')}\n\n` +
      `💳 <b>Pagos registrados:</b>\n` +
      `• Cantidad: ${monthPayments.length}\n` +
      `• 💰 Total: $${totalPaymentsAmount.toLocaleString('es-CO')}\n\n` +
      `${overdueCount > 0 ? '⚠️ <b>ATENCIÓN:</b> Hay compromisos vencidos.\n\n' : ''}` +
      `<b>═══════════════════</b>\n\n` +
      `🔗 <a href="https://dr-group-cd21b.web.app">Abrir Dashboard</a>`;
    
    await sendTelegramMessage(chatId, reportMessage);
    console.log(`✅ /reporte mes ${monthNumber} - ${firstName}`);
  } catch (error) {
    console.error('Error en handleReportMonth:', error);
    await sendTelegramMessage(chatId, '❌ Error al generar reporte del mes.');
  }
}

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
    
    // === HANDLER PARA CALLBACK QUERY (BOTONES INLINE) ===
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;
      const messageId = callbackQuery.message.message_id;
      
      console.log(`🔘 Callback recibido: ${data} de chat ${chatId}`);
      
      // Inicializar Firestore
      const db = getFirestore();
      const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || 
                        process.env.TELEGRAM_BOT_TOKEN ||
                        '8430298503:AAEVPOGrIp5_UdUNGXSy3AD9rI8mS2OKipQ';
      
      // Responder al callback inmediatamente para quitar el loader
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: 'Cargando detalles...'
        })
      });
      
      // Procesar callback según el tipo
      if (data.startsWith('detail_commitment_')) {
        const commitmentId = data.replace('detail_commitment_', '');
        
        try {
          // Consultar compromiso desde Firestore
          const commitmentDoc = await db.collection('commitments').doc(commitmentId).get();
          
          if (!commitmentDoc.exists) {
            await sendTelegramMessage(chatId, '❌ No se encontró el compromiso solicitado.');
            return res.status(200).send('OK');
          }
          
          const commitment = { id: commitmentDoc.id, ...commitmentDoc.data() };
          const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
          const isPaid = commitment.status === 'paid' || commitment.paid === true || commitment.isPaid === true;
          
          // Formatear mensaje de detalles
          let detailMessage = `📋 <b>DETALLES DEL COMPROMISO</b>\n\n`;
          detailMessage += `<b>Concepto:</b> ${commitment.concept || 'Sin concepto'}\n`;
          detailMessage += `<b>Empresa:</b> ${commitment.companyName || 'Sin empresa'}\n`;
          if (commitment.beneficiaryName) detailMessage += `<b>Beneficiario:</b> ${commitment.beneficiaryName}\n`;
          detailMessage += `<b>Monto:</b> $${(commitment.amount || 0).toLocaleString('es-CO')}\n`;
          detailMessage += `<b>Fecha de vencimiento:</b> ${dueDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
          detailMessage += `<b>Estado:</b> ${isPaid ? '✅ Pagado' : '🟡 Pendiente'}\n`;
          if (commitment.paymentMethod) detailMessage += `<b>Método de pago:</b> ${commitment.paymentMethod}\n`;
          if (commitment.observations) detailMessage += `\n<b>Observaciones:</b>\n${commitment.observations}\n`;
          detailMessage += `\n🔗 <a href="https://dr-group-cd21b.web.app/commitments">Ver en dashboard</a>`;
          
          await sendTelegramMessage(chatId, detailMessage);
          console.log(`✅ Detalles de compromiso ${commitmentId} enviados a chat ${chatId}`);
        } catch (error) {
          console.error('Error consultando compromiso:', error);
          await sendTelegramMessage(chatId, '❌ Error al cargar detalles del compromiso.');
        }
      }
      else if (data.startsWith('detail_payment_')) {
        const paymentId = data.replace('detail_payment_', '');
        
        try {
          // Consultar pago desde Firestore
          const paymentDoc = await db.collection('payments').doc(paymentId).get();
          
          if (!paymentDoc.exists) {
            await sendTelegramMessage(chatId, '❌ No se encontró el pago solicitado.');
            return res.status(200).send('OK');
          }
          
          const payment = { id: paymentDoc.id, ...paymentDoc.data() };
          const paymentDate = payment.date?.toDate ? payment.date.toDate() : new Date(payment.date);
          
          // Formatear mensaje de detalles
          let detailMessage = `💳 <b>DETALLES DEL PAGO</b>\n\n`;
          detailMessage += `<b>Concepto:</b> ${payment.concept || 'Sin concepto'}\n`;
          detailMessage += `<b>Empresa:</b> ${payment.companyName || 'Sin empresa'}\n`;
          detailMessage += `<b>Monto:</b> $${(payment.amount || 0).toLocaleString('es-CO')}\n`;
          detailMessage += `<b>Fecha:</b> ${paymentDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
          if (payment.method || payment.paymentMethod) detailMessage += `<b>Método:</b> ${payment.method || payment.paymentMethod}\n`;
          if (payment.reference) detailMessage += `<b>Referencia:</b> ${payment.reference}\n`;
          if (payment.notes) detailMessage += `\n<b>Notas:</b>\n${payment.notes}\n`;
          detailMessage += `\n🔗 <a href="https://dr-group-cd21b.web.app/payments">Ver en dashboard</a>`;
          
          await sendTelegramMessage(chatId, detailMessage);
          console.log(`✅ Detalles de pago ${paymentId} enviados a chat ${chatId}`);
        } catch (error) {
          console.error('Error consultando pago:', error);
          await sendTelegramMessage(chatId, '❌ Error al cargar detalles del pago.');
        }
      }
      
      return res.status(200).send('OK');
    }
    
    // Verificar si hay un mensaje
    if (!update.message) {
      return res.status(200).send('OK');
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from.first_name || 'Usuario';
    const username = message.from.username || '';
    
    // Inicializar Firestore para estados conversacionales
    const db = getFirestore();

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
        `/compromisos - Consultar compromisos por mes\n` +
        `/pagos - Consultar pagos por mes\n` +
        `/pagos_del_dia - Ver pagos de hoy\n` +
        `/ultimos_pagos - Ver pagos de últimos 15 días\n` +
        `/reporte - Reporte del mes\n\n` +
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
        `📅 /compromisos - Consultar compromisos por mes\n` +
        `💰 /pagos - Consultar pagos por mes\n` +
        `💵 /pagos_del_dia - Ver pagos de hoy\n` +
        `💳 /ultimos_pagos - Ver pagos de últimos 15 días\n` +
        `📊 /reporte - Reporte del mes actual\n` +
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
    
    // Comando /compromisos - Solicitar mes
    else if (text && text.toLowerCase() === '/compromisos') {
      const monthMessage = 
        `📅 <b>Consulta de Compromisos</b>\n\n` +
        `Selecciona el mes que deseas consultar:\n\n` +
        `1️⃣ Enero\n` +
        `2️⃣ Febrero\n` +
        `3️⃣ Marzo\n` +
        `4️⃣ Abril\n` +
        `5️⃣ Mayo\n` +
        `6️⃣ Junio\n` +
        `7️⃣ Julio\n` +
        `8️⃣ Agosto\n` +
        `9️⃣ Septiembre\n` +
        `🔟 Octubre\n` +
        `1️⃣1️⃣ Noviembre\n` +
        `1️⃣2️⃣ Diciembre\n\n` +
        `📝 Responde con el <b>número del mes</b> (1-12)`;
      
      await sendTelegramMessage(chatId, monthMessage);
      
      // Guardar estado de conversación
      await db.collection('telegram_states').doc(chatId.toString()).set({
        command: 'compromisos',
        timestamp: FieldValue.serverTimestamp()
      });
      
      console.log(`💾 Estado guardado: compromisos - Chat: ${chatId}`);
      console.log(`✅ /compromisos - ${firstName} - Solicitando mes`);
    }
    
    // Comando /pagos - Solicitar mes
    else if (text && text.toLowerCase() === '/pagos') {
      const monthMessage = 
        `💰 <b>Consulta de Pagos</b>\n\n` +
        `Selecciona el mes que deseas consultar:\n\n` +
        `1️⃣ Enero\n` +
        `2️⃣ Febrero\n` +
        `3️⃣ Marzo\n` +
        `4️⃣ Abril\n` +
        `5️⃣ Mayo\n` +
        `6️⃣ Junio\n` +
        `7️⃣ Julio\n` +
        `8️⃣ Agosto\n` +
        `9️⃣ Septiembre\n` +
        `🔟 Octubre\n` +
        `1️⃣1️⃣ Noviembre\n` +
        `1️⃣2️⃣ Diciembre\n\n` +
        `📝 Responde con el <b>número del mes</b> (1-12)`;
      
      await sendTelegramMessage(chatId, monthMessage);
      
      // Guardar estado de conversación
      await db.collection('telegram_states').doc(chatId.toString()).set({
        command: 'pagos',
        timestamp: FieldValue.serverTimestamp()
      });
      
      console.log(`💾 Estado guardado: pagos - Chat: ${chatId}`);
      console.log(`✅ /pagos - ${firstName} - Solicitando mes`);
    }
    
    // Comando /reporte - Solicitar mes
    else if (text && text.toLowerCase() === '/reporte') {
      const monthMessage = 
        `📊 <b>Generación de Reporte</b>\n\n` +
        `Selecciona el mes que deseas consultar:\n\n` +
        `1️⃣ Enero\n` +
        `2️⃣ Febrero\n` +
        `3️⃣ Marzo\n` +
        `4️⃣ Abril\n` +
        `5️⃣ Mayo\n` +
        `6️⃣ Junio\n` +
        `7️⃣ Julio\n` +
        `8️⃣ Agosto\n` +
        `9️⃣ Septiembre\n` +
        `🔟 Octubre\n` +
        `1️⃣1️⃣ Noviembre\n` +
        `1️⃣2️⃣ Diciembre\n\n` +
        `� Responde con el <b>número del mes</b> (1-12)`;
      
      await sendTelegramMessage(chatId, monthMessage);
      
      // Guardar estado de conversación
      await db.collection('telegram_states').doc(chatId.toString()).set({
        command: 'reporte',
        timestamp: FieldValue.serverTimestamp()
      });
      
      console.log(`💾 Estado guardado: reporte - Chat: ${chatId}`);
      console.log(`✅ /reporte - ${firstName} - Solicitando mes`);
    }
    
    // Comando /ultimos_pagos - Últimos 15 días
    else if (text && text.toLowerCase() === '/ultimos_pagos') {
      try {
        const today = new Date();
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        fifteenDaysAgo.setHours(0, 0, 0, 0);
        
        // Obtener pagos
        const paymentsSnapshot = await db.collection('payments').get();
        
        console.log(`📊 Total pagos en BD: ${paymentsSnapshot.size}`);
        
        // Filtrar pagos de últimos 15 días (excluir 4x1000)
        const recentPayments = [];
        paymentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.is4x1000Tax) {
            const paymentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
            paymentDate.setHours(0, 0, 0, 0);
            
            if (paymentDate >= fifteenDaysAgo) {
              recentPayments.push({
                id: doc.id,
                ...data
              });
            }
          }
        });
        
        // Ordenar por fecha descendente
        recentPayments.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });
        
        console.log(`💳 Pagos últimos 15 días: ${recentPayments.length}`);

        if (recentPayments.length === 0) {
          await sendTelegramMessage(chatId, '📭 No hay pagos registrados en los últimos 15 días.');
          console.log(`✅ /ultimos_pagos - ${firstName} - Sin pagos recientes`);
          return res.status(200).send('OK');
        }

        let totalAmount = 0;
        let message = `💳 <b>Pagos - Últimos 15 días</b>\n`;
        message += `📅 Del ${fifteenDaysAgo.toLocaleDateString('es-CO')} al ${today.toLocaleDateString('es-CO')}\n\n`;
        
        recentPayments.forEach((payment, index) => {
          const paymentDate = payment.date?.toDate ? payment.date.toDate() : new Date(payment.date);
          const amount = payment.amount || 0;
          totalAmount += amount;
          
          message += `${index + 1}. <b>${payment.concept || 'Sin concepto'}</b>\n`;
          message += `   💰 $${amount.toLocaleString('es-CO')}\n`;
          message += `   📅 ${paymentDate.toLocaleDateString('es-CO')}\n`;
          if (payment.companyName) message += `   🏢 ${payment.companyName}\n`;
          if (payment.method) message += `   💳 ${payment.method}\n`;
          message += `\n`;
        });

        message += `<b>═══════════════════</b>\n`;
        message += `💵 <b>Total:</b> $${totalAmount.toLocaleString('es-CO')}\n`;
        message += `📊 <b>Cantidad:</b> ${recentPayments.length} pagos\n\n`;
        message += `🔗 <a href="https://dr-group-cd21b.web.app/payments">Ver todos los pagos</a>`;

        await sendTelegramMessage(chatId, message);
        console.log(`✅ /ultimos_pagos - ${firstName}`);
      } catch (error) {
        console.error('Error en /ultimos_pagos:', error);
        await sendTelegramMessage(chatId, '❌ Error al obtener pagos.');
      }
    }
    
    // Comando /pagos_del_dia - Pagos de hoy
    else if (text && text.toLowerCase() === '/pagos_del_dia') {
      try {
        // Usar zona horaria de Colombia explícitamente
        const today = new Date();
        const colombiaOffset = -5; // UTC-5
        const colombiaDate = new Date(today.getTime() + (colombiaOffset * 60 * 60 * 1000));
        
        const year = colombiaDate.getUTCFullYear();
        const month = colombiaDate.getUTCMonth();
        const day = colombiaDate.getUTCDate();
        
        const startOfDay = new Date(Date.UTC(year, month, day, 5, 0, 0, 0)); // 00:00 Colombia = 05:00 UTC
        const endOfDay = new Date(Date.UTC(year, month, day + 1, 4, 59, 59, 999)); // 23:59:59 Colombia
        
        console.log(`🕐 Fecha actual Colombia: ${colombiaDate.toLocaleString('es-CO')}`);
        console.log(`📅 Buscando pagos del día: ${day}/${month + 1}/${year}`);
        console.log(`⏰ Rango UTC: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
        
        // Obtener pagos de hoy
        const paymentsSnapshot = await db.collection('payments').get();
        
        console.log(`📊 Total pagos en BD: ${paymentsSnapshot.size}`);
        
        // Filtrar pagos de hoy (excluir 4x1000)
        const todayPayments = [];
        paymentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.is4x1000Tax) {
            const paymentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
            
            // Verificar si el pago es del día de hoy
            if (paymentDate >= startOfDay && paymentDate <= endOfDay) {
              todayPayments.push({
                id: doc.id,
                ...data
              });
              console.log(`✅ Pago encontrado: ${data.concept} - ${paymentDate.toLocaleString('es-CO')}`);
            }
          }
        });
        
        // Ordenar por fecha descendente
        todayPayments.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });
        
        console.log(`💳 Pagos de hoy encontrados: ${todayPayments.length}`);

        if (todayPayments.length === 0) {
          const todayDisplay = new Date(year, month, day);
          await sendTelegramMessage(chatId, `📭 No hay pagos registrados hoy\n📅 ${todayDisplay.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
          console.log(`✅ /pagos_del_dia - ${firstName} - Sin pagos`);
          return res.status(200).send('OK');
        }

        let totalAmount = 0;
        const todayDisplay = new Date(year, month, day);
        let message = `💵 <b>Pagos de Hoy</b>\n`;
        message += `📅 ${todayDisplay.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
        
        todayPayments.forEach((payment, index) => {
          const paymentDate = payment.date?.toDate ? payment.date.toDate() : new Date(payment.date);
          const amount = payment.amount || 0;
          totalAmount += amount;
          
          message += `${index + 1}. <b>${payment.concept || 'Sin concepto'}</b>\n`;
          message += `   💰 $${amount.toLocaleString('es-CO')}\n`;
          message += `   🕐 ${paymentDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}\n`;
          if (payment.companyName) message += `   🏢 ${payment.companyName}\n`;
          if (payment.method) message += `   💳 ${payment.method}\n`;
          message += `\n`;
        });

        message += `<b>═══════════════════</b>\n`;
        message += `💵 <b>Total del día:</b> $${totalAmount.toLocaleString('es-CO')}\n`;
        message += `📊 <b>Cantidad:</b> ${todayPayments.length} ${todayPayments.length === 1 ? 'pago' : 'pagos'}\n\n`;
        message += `🔗 <a href="https://dr-group-cd21b.web.app/payments">Registrar nuevo pago</a>`;

        await sendTelegramMessage(chatId, message);
        console.log(`✅ /pagos_del_dia - ${firstName}`);
      } catch (error) {
        console.error('Error en /pagos_del_dia:', error);
        await sendTelegramMessage(chatId, '❌ Error al obtener pagos del día.');
      }
    }
    
    // Manejador de respuestas a comandos con estados
    else if (text && !text.startsWith('/')) {
      try {
        const db = getFirestore();
        
        // Verificar si hay un estado de conversación activo
        const stateDoc = await db.collection('telegram_states').doc(chatId.toString()).get();
        
        if (stateDoc.exists) {
          const stateData = stateDoc.data();
          const command = stateData.command;
          const monthNumber = parseInt(text);
          
          console.log(`📱 Estado detectado: ${command} - Mes: ${monthNumber} - Chat: ${chatId}`);
          
          // Validar que sea un número de mes válido
          if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            await sendTelegramMessage(chatId, '❌ Número de mes inválido. Por favor ingresa un número entre 1 y 12.');
            return res.status(200).send('OK');
          }
          
          const currentYear = new Date().getFullYear();
          const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
          const monthName = monthNames[monthNumber - 1];
          
          console.log(`🔄 Procesando: ${command} para ${monthName} ${currentYear}`);
          
          // Procesar según el comando original
          if (command === 'compromisos') {
            await handleCommitmentsMonth(chatId, monthNumber, currentYear, monthName, firstName);
          } else if (command === 'pagos') {
            await handlePaymentsMonth(chatId, monthNumber, currentYear, monthName, firstName);
          } else if (command === 'reporte') {
            await handleReportMonth(chatId, monthNumber, currentYear, monthName, firstName);
          }
          
          console.log(`✅ Comando ${command} ejecutado - Limpiando estado`);
          
          // Limpiar estado
          await db.collection('telegram_states').doc(chatId.toString()).delete();
          return res.status(200).send('OK');
        }
      } catch (error) {
        console.error('Error procesando estado:', error);
        await sendTelegramMessage(chatId, '❌ Error al procesar tu solicitud. Intenta nuevamente con el comando.');
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
      
      // Validación básica de Telegram
      if (!settings || !settings.telegramEnabled || !settings.telegramChatId) {
        continue;
      }

      // 🔴 NUEVO: Validación de granularidad (Nov 2023)
      // El usuario solicitó restringir notificaciones a: Coljuegos, UIAF, Parafiscales, Vencimientos y Eventos.
      // El "Reporte Diario Financiero" (este reporte) no está en la lista permitida.
      // Se requiere un flag explícito 'dailyFinancialReportEnabled' para enviarlo.
      // Como este switch no existe en el frontend actual, esto desactiva efectivamente el reporte diario general
      // para evitar spam no solicitado, manteniendo solo las alertas críticas.
      if (!settings.dailyFinancialReportEnabled) {
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

// ===================================================================
// 🎯 SISTEMA DE CONTADORES OPTIMIZADO - REDUCCIÓN DE 20,000 → 1 READ
// ===================================================================

const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');

/**
 * Helper: Recalcular estadísticas completas del dashboard
 * Solo se ejecuta cuando hay cambios en compromisos o pagos
 */
async function recalculateDashboardStats() {
  const db = getFirestore();
  
  console.log('📊 Iniciando recálculo de estadísticas...');
  
  try {
    // Obtener TODOS los compromisos (una sola vez)
    const commitmentsSnapshot = await db.collection('commitments').get();
    const commitments = commitmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 Compromisos encontrados: ${commitments.length}`);
    
    // Obtener TODOS los pagos (una sola vez)
    const paymentsSnapshot = await db.collection('payments').get();
    const allPayments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`💳 Pagos encontrados: ${allPayments.length}`);
    
    // Indexar pagos por commitmentId para búsqueda O(1)
    const paymentsByCommitment = {};
    allPayments.forEach(payment => {
      if (payment.commitmentId && !payment.is4x1000Tax) {
        if (!paymentsByCommitment[payment.commitmentId]) {
          paymentsByCommitment[payment.commitmentId] = [];
        }
        paymentsByCommitment[payment.commitmentId].push(payment);
      }
    });
    
    // Inicializar contadores
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const stats = {
      // Compromisos
      totalCommitments: 0,
      activeCommitments: 0,
      pendingCommitments: 0,
      overDueCommitments: 0,
      completedCommitments: 0,
      
      // Montos
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      
      // Empresas
      totalCompanies: 0,
      
      // Pagos del mes
      currentMonthPayments: 0,
      currentMonthPaymentAmount: 0,
      
      // Metadata
      lastUpdated: FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };
    
    const uniqueCompanies = new Set();
    
    // Procesar cada compromiso
    commitments.forEach(commitment => {
      stats.totalCommitments++;
      
      const originalAmount = parseFloat(commitment.amount) || 0;
      stats.totalAmount += originalAmount;
      
      // Contar empresas únicas
      if (commitment.companyId) {
        uniqueCompanies.add(commitment.companyId);
      }
      
      // Obtener pagos de este compromiso
      const paymentsForCommitment = paymentsByCommitment[commitment.id] || [];
      const totalPaidForCommitment = paymentsForCommitment.reduce((sum, p) => 
        sum + (parseFloat(p.amount) || 0), 0
      );
      
      // Calcular saldo restante
      const remainingAmount = Math.max(0, originalAmount - totalPaidForCommitment);
      const tolerance = originalAmount * 0.01;
      const isCompletelyPaid = Math.abs(remainingAmount) <= tolerance || 
                               totalPaidForCommitment >= originalAmount;
      
      // Verificar fecha de vencimiento
      const dueDate = commitment.dueDate?.toDate ? 
        commitment.dueDate.toDate() : 
        new Date(commitment.dueDate);
      const isOverdue = dueDate && dueDate < now;
      
      // Verificar si está marcado como pagado
      const isMarkedAsPaid = commitment.status === 'completed' || 
                            commitment.status === 'paid' || 
                            commitment.paid === true ||
                            commitment.isPaid === true;
      
      const isPaid = isCompletelyPaid || isMarkedAsPaid;
      
      // Contar pagos del mes actual
      paymentsForCommitment.forEach(payment => {
        let paymentDate = null;
        
        if (payment.date?.toDate) {
          paymentDate = payment.date.toDate();
        } else if (payment.createdAt?.toDate) {
          paymentDate = payment.createdAt.toDate();
        } else if (payment.paymentDate?.toDate) {
          paymentDate = payment.paymentDate.toDate();
        } else {
          paymentDate = now;
        }
        
        if (paymentDate.getMonth() === currentMonth && 
            paymentDate.getFullYear() === currentYear) {
          stats.currentMonthPayments++;
          stats.currentMonthPaymentAmount += parseFloat(payment.amount) || 0;
        }
      });
      
      // Clasificar compromiso
      if (isPaid) {
        stats.completedCommitments++;
        stats.paidAmount += originalAmount;
      } else {
        stats.activeCommitments++;
        stats.pendingCommitments++;
        stats.pendingAmount += remainingAmount;
        
        if (isOverdue) {
          stats.overDueCommitments++;
        }
      }
    });
    
    stats.totalCompanies = uniqueCompanies.size;
    
    // Guardar en Firestore
    await db.collection('system_stats').doc('dashboard').set(stats, { merge: true });
    
    console.log('✅ Estadísticas actualizadas:', {
      compromisos: stats.totalCommitments,
      pendientes: stats.pendingCommitments,
      vencidos: stats.overDueCommitments,
      pagados: stats.completedCommitments,
      pagosMes: stats.currentMonthPayments
    });
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error recalculando estadísticas:', error);
    throw error;
  }
}

/**
 * Trigger: Cuando se crea un compromiso
 */
exports.onCommitmentCreated = onDocumentCreated('commitments/{commitmentId}', async (event) => {
  console.log('🆕 Nuevo compromiso creado:', event.params.commitmentId);
  await recalculateDashboardStats();
});

/**
 * Trigger: Cuando se actualiza un compromiso
 */
exports.onCommitmentUpdated = onDocumentUpdated('commitments/{commitmentId}', async (event) => {
  console.log('✏️ Compromiso actualizado:', event.params.commitmentId);
  await recalculateDashboardStats();
});

/**
 * Trigger: Cuando se elimina un compromiso
 */
exports.onCommitmentDeleted = onDocumentDeleted('commitments/{commitmentId}', async (event) => {
  console.log('🗑️ Compromiso eliminado:', event.params.commitmentId);
  await recalculateDashboardStats();
});

/**
 * Trigger: Cuando se crea un pago
 */
exports.onPaymentCreated = onDocumentCreated('payments/{paymentId}', async (event) => {
  console.log('🆕 Nuevo pago registrado:', event.params.paymentId);
  await recalculateDashboardStats();
});

/**
 * Trigger: Cuando se actualiza un pago
 */
exports.onPaymentUpdated = onDocumentUpdated('payments/{paymentId}', async (event) => {
  console.log('✏️ Pago actualizado:', event.params.paymentId);
  await recalculateDashboardStats();
});

/**
 * Trigger: Cuando se elimina un pago
 */
exports.onPaymentDeleted = onDocumentDeleted('payments/{paymentId}', async (event) => {
  console.log('🗑️ Pago eliminado:', event.params.paymentId);
  await recalculateDashboardStats();
});

/**
 * Callable Function: Forzar recálculo manual
 * Útil para inicializar el sistema o reparar inconsistencias
 */
exports.forceRecalculateStats = onCall(async (request) => {
  console.log('🔄 Recálculo manual iniciado por:', request.auth?.uid);
  
  try {
    const stats = await recalculateDashboardStats();
    return { 
      success: true, 
      message: 'Estadísticas recalculadas exitosamente',
      stats 
    };
  } catch (error) {
    console.error('❌ Error en recálculo manual:', error);
    throw new HttpsError('internal', `Error: ${error.message}`);
  }
});

// ============================================
// 📅 FUNCIONES SCHEDULED DE NOTIFICACIONES
// ============================================
exports.checkExitReminder = notificationSchedulers.checkExitReminder;
exports.checkBreakReminder = notificationSchedulers.checkBreakReminder;
exports.checkLunchReminder = notificationSchedulers.checkLunchReminder;
exports.checkCalendarEvents = notificationSchedulers.checkCalendarEvents;
