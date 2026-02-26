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



// ===================================================================
// 🎯 SISTEMA DE CONTADORES OPTIMIZADO - REDUCCIÓN DE 20,000 → 1 READ
// ===================================================================

const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted, onDocumentWritten } = require('firebase-functions/v2/firestore');

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

// ===================================================================
// 📊 PRE-COMPUTED STATS: INGRESOS
// ===================================================================

async function recalculateIngresosStats() {
  const db = getFirestore();
  console.log('📊 Recalculando estadísticas de ingresos...');

  try {
    const snapshot = await db.collection('incomes').get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      totalCount: 0,
      totalAmount: 0,
      currentMonthCount: 0,
      currentMonthAmount: 0,
      byPaymentMethod: {},
      lastUpdated: FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = parseFloat(data.amount) || 0;
      stats.totalCount++;
      stats.totalAmount += amount;

      // Método de pago
      const method = data.paymentMethod || 'otro';
      if (!stats.byPaymentMethod[method]) {
        stats.byPaymentMethod[method] = { count: 0, amount: 0 };
      }
      stats.byPaymentMethod[method].count++;
      stats.byPaymentMethod[method].amount += amount;

      // Ingreso del mes actual
      let incomeDate = null;
      if (data.date?.toDate) incomeDate = data.date.toDate();
      else if (data.createdAt?.toDate) incomeDate = data.createdAt.toDate();
      else if (data.date) incomeDate = new Date(data.date);

      if (incomeDate &&
          incomeDate.getMonth() === currentMonth &&
          incomeDate.getFullYear() === currentYear) {
        stats.currentMonthCount++;
        stats.currentMonthAmount += amount;
      }
    });

    await db.collection('system_stats').doc('ingresos').set(stats, { merge: true });
    console.log('✅ Stats ingresos actualizadas:', { total: stats.totalCount, monto: stats.totalAmount });
    return stats;
  } catch (error) {
    console.error('❌ Error recalculando stats ingresos:', error);
    throw error;
  }
}

exports.onIncomeCreated = onDocumentCreated('incomes/{docId}', async () => {
  await recalculateIngresosStats();
});
exports.onIncomeUpdated = onDocumentUpdated('incomes/{docId}', async () => {
  await recalculateIngresosStats();
});
exports.onIncomeDeleted = onDocumentDeleted('incomes/{docId}', async () => {
  await recalculateIngresosStats();
});

// ===================================================================
// 📊 PRE-COMPUTED STATS: LIQUIDACIONES POR SALA
// ===================================================================

async function recalculateLiquidacionesStats() {
  const db = getFirestore();
  console.log('📊 Recalculando estadísticas de liquidaciones...');

  try {
    const snapshot = await db.collection('liquidaciones_por_sala').get();

    const stats = {
      totalCount: 0,
      pendientes: 0,
      facturadas: 0,
      pagadas: 0,
      vencidas: 0,
      montoTotal: 0,
      montoPendiente: 0,
      montoCobrado: 0,
      lastUpdated: FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };

    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.totalCount++;

      const impuestos = parseFloat(data.metricas?.totalImpuestos) || 0;
      stats.montoTotal += impuestos;

      const estado = (data.estado || 'pendiente').toLowerCase();
      if (estado === 'pagada' || estado === 'pagado') {
        stats.pagadas++;
        stats.montoCobrado += impuestos;
      } else if (estado === 'facturada' || estado === 'facturado') {
        stats.facturadas++;
        stats.montoPendiente += impuestos;
      } else {
        stats.pendientes++;
        stats.montoPendiente += impuestos;
      }

      // Vencidas
      let fechaVencimiento = null;
      if (data.fechaVencimiento?.toDate) fechaVencimiento = data.fechaVencimiento.toDate();
      else if (data.fechaVencimiento) fechaVencimiento = new Date(data.fechaVencimiento);
      if (fechaVencimiento && fechaVencimiento < now && estado !== 'pagada' && estado !== 'pagado') {
        stats.vencidas++;
      }
    });

    await db.collection('system_stats').doc('liquidaciones').set(stats, { merge: true });
    console.log('✅ Stats liquidaciones actualizadas:', { total: stats.totalCount, pendientes: stats.pendientes });
    return stats;
  } catch (error) {
    console.error('❌ Error recalculando stats liquidaciones:', error);
    throw error;
  }
}

exports.onLiquidacionPorSalaCreated = onDocumentCreated('liquidaciones_por_sala/{docId}', async () => {
  await recalculateLiquidacionesStats();
});
exports.onLiquidacionPorSalaUpdated = onDocumentUpdated('liquidaciones_por_sala/{docId}', async () => {
  await recalculateLiquidacionesStats();
});
exports.onLiquidacionPorSalaDeleted = onDocumentDeleted('liquidaciones_por_sala/{docId}', async () => {
  await recalculateLiquidacionesStats();
});

// ===================================================================
// 📊 PRE-COMPUTED STATS: ASISTENCIAS (resumen del día)
// ===================================================================

async function recalculateAsistenciasStats() {
  const db = getFirestore();
  const today = new Date();
  const fechaHoy = today.toISOString().split('T')[0]; // YYYY-MM-DD
  console.log('📊 Recalculando estadísticas de asistencias para:', fechaHoy);

  try {
    const snapshot = await db.collection('asistencias')
      .where('fecha', '==', fechaHoy)
      .get();

    const usersSnapshot = await db.collection('users')
      .where('isActive', '!=', false)
      .get();
    const totalEmployees = usersSnapshot.size;

    const stats = {
      fecha: fechaHoy,
      totalEmployees,
      presentes: 0,
      trabajando: 0,
      enBreak: 0,
      enAlmuerzo: 0,
      finalizados: 0,
      ausentes: 0,
      lastUpdated: FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };

    const presentUids = new Set();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const estado = (data.estadoActual || '').toLowerCase();
      presentUids.add(data.uid);

      if (estado === 'trabajando') stats.trabajando++;
      else if (estado === 'break') stats.enBreak++;
      else if (estado === 'almuerzo') stats.enAlmuerzo++;
      else if (estado === 'finalizado') stats.finalizados++;
    });

    stats.presentes = presentUids.size;
    stats.ausentes = Math.max(0, totalEmployees - presentUids.size);

    await db.collection('system_stats').doc('asistencias').set(stats, { merge: true });
    console.log('✅ Stats asistencias actualizadas:', {
      presentes: stats.presentes, ausentes: stats.ausentes, trabajando: stats.trabajando
    });
    return stats;
  } catch (error) {
    console.error('❌ Error recalculando stats asistencias:', error);
    throw error;
  }
}

exports.onAsistenciaWritten = onDocumentWritten('asistencias/{docId}', async () => {
  await recalculateAsistenciasStats();
});

// ============================================
// 📅 FUNCIONES SCHEDULED DE NOTIFICACIONES
// ============================================
exports.checkExitReminder = notificationSchedulers.checkExitReminder;
exports.checkBreakReminder = notificationSchedulers.checkBreakReminder;
exports.checkLunchReminder = notificationSchedulers.checkLunchReminder;
exports.checkCalendarEvents = notificationSchedulers.checkCalendarEvents;
exports.checkCustomCalendarEvents = notificationSchedulers.checkCustomCalendarEvents;

// ============================================
// 🧹 FUNCIONES DE LIMPIEZA TTL (Cleanup)
// ============================================

/**
 * OPT-3: Limpieza de sesiones inactivas (activeSessions)
 * Ejecuta 1x/día a medianoche — elimina sesiones donde isCurrent=false y lastActivity > 7 días
 */
exports.cleanupOldSessions = onSchedule({
  schedule: '0 0 * * *', // Medianoche todos los días
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 120
}, async (event) => {
  const db = getFirestore();
  console.log('🧹 Ejecutando cleanupOldSessions...');

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Eliminar sesiones inactivas con lastActivity > 7 días
    const oldSessionsSnapshot = await db.collection('activeSessions')
      .where('isCurrent', '==', false)
      .where('lastActivity', '<', sevenDaysAgo)
      .get();

    let deletedCount = 0;
    const batchSize = 500;
    let batch = db.batch();

    for (const doc of oldSessionsSnapshot.docs) {
      batch.delete(doc.ref);
      deletedCount++;

      if (deletedCount % batchSize === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }

    if (deletedCount % batchSize !== 0) {
      await batch.commit();
    }

    console.log(`✅ cleanupOldSessions: ${deletedCount} sesiones inactivas eliminadas`);
    return { success: true, deleted: deletedCount };
  } catch (error) {
    console.error('❌ Error en cleanupOldSessions:', error);
    throw error;
  }
});

/**
 * OPT-4: Limpieza de activity_logs antiguos
 * Ejecuta 1x/semana (domingo medianoche) — elimina logs con timestamp > 90 días
 */
exports.cleanupOldActivityLogs = onSchedule({
  schedule: '0 0 * * 0', // Domingo a medianoche
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 120
}, async (event) => {
  const db = getFirestore();
  console.log('🧹 Ejecutando cleanupOldActivityLogs...');

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldLogsSnapshot = await db.collection('activity_logs')
      .where('timestamp', '<', ninetyDaysAgo)
      .limit(500) // Procesar en lotes para no exceder timeout
      .get();

    let deletedCount = 0;
    const batch = db.batch();

    for (const doc of oldLogsSnapshot.docs) {
      batch.delete(doc.ref);
      deletedCount++;
    }

    if (deletedCount > 0) {
      await batch.commit();
    }

    console.log(`✅ cleanupOldActivityLogs: ${deletedCount} logs antiguos eliminados (>90 días)`);
    return { success: true, deleted: deletedCount };
  } catch (error) {
    console.error('❌ Error en cleanupOldActivityLogs:', error);
    throw error;
  }
});

/**
 * OPT-5: Limpieza de notificaciones antiguas
 * Ejecuta 1x/día — elimina notificaciones leídas >30 días y todas >60 días
 */
exports.cleanupOldNotifications = onSchedule({
  schedule: '0 1 * * *', // 1 AM todos los días
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 120
}, async (event) => {
  const db = getFirestore();
  console.log('🧹 Ejecutando cleanupOldNotifications...');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let totalDeleted = 0;

    // 1. Eliminar notificaciones leídas con más de 30 días
    const readOldSnapshot = await db.collection('notifications')
      .where('read', '==', true)
      .where('createdAt', '<', thirtyDaysAgo)
      .limit(500)
      .get();

    if (!readOldSnapshot.empty) {
      const batch1 = db.batch();
      readOldSnapshot.docs.forEach(doc => batch1.delete(doc.ref));
      await batch1.commit();
      totalDeleted += readOldSnapshot.size;
    }

    // 2. Eliminar TODAS las notificaciones con más de 60 días (leídas o no)
    const allOldSnapshot = await db.collection('notifications')
      .where('createdAt', '<', sixtyDaysAgo)
      .limit(500)
      .get();

    if (!allOldSnapshot.empty) {
      const batch2 = db.batch();
      allOldSnapshot.docs.forEach(doc => batch2.delete(doc.ref));
      await batch2.commit();
      totalDeleted += allOldSnapshot.size;
    }

    console.log(`✅ cleanupOldNotifications: ${totalDeleted} notificaciones antiguas eliminadas`);
    return { success: true, deleted: totalDeleted };
  } catch (error) {
    console.error('❌ Error en cleanupOldNotifications:', error);
    throw error;
  }
});

// ============================================
// 🔔 ENVIAR PUSH NOTIFICATIONS (Callable desde la app)
// ============================================
const { sendPushToMultipleUsers } = require('./pushService');

exports.sendAlertPush = onCall({
  memory: '256MiB',
  timeoutSeconds: 30
}, async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { userIds, title, message, type, priority, extraData } = data;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Se requiere un array de userIds');
  }

  if (!title || !message) {
    throw new HttpsError('invalid-argument', 'Se requieren title y message');
  }

  try {
    const result = await sendPushToMultipleUsers(userIds, {
      title,
      message,
      type: type || 'admin_alert',
      priority: priority || 'default',
      data: extraData || {},
    });

    console.log(`🔔 Push enviado: ${result.sent} exitosos, ${result.failed} fallidos`);
    return { success: true, ...result };
  } catch (error) {
    console.error('❌ Error en sendAlertPush:', error);
    throw new HttpsError('internal', 'Error enviando push notifications');
  }
});
