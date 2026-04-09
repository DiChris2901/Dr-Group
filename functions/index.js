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
// PRE-COMPUTED STATS: ELIMINADOS en v3.16.2
// Los 13 triggers (commitments, payments, incomes, liquidaciones, asistencias)
// y 4 funciones de recalculo escribian a system_stats/ pero NINGUN componente
// del frontend leia esos datos. Se eliminaron para ahorrar ~300K reads/mes.
// ===================================================================

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
 * Ejecuta 1x/dia — elimina notificaciones leidas >2 dias y todas >7 dias
 * Las notificaciones moviles son efimeras: si no se vio en 2 dias, ya no es relevante
 */
exports.cleanupOldNotifications = onSchedule({
  schedule: '0 1 * * *', // 1 AM todos los dias
  timeZone: 'America/Bogota',
  memory: '256MiB',
  timeoutSeconds: 120
}, async (event) => {
  const db = getFirestore();
  console.log('🧹 Ejecutando cleanupOldNotifications...');

  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let totalDeleted = 0;

    // 1. Eliminar notificaciones leidas con mas de 2 dias
    const readOldSnapshot = await db.collection('notifications')
      .where('read', '==', true)
      .where('createdAt', '<', twoDaysAgo)
      .limit(500)
      .get();

    if (!readOldSnapshot.empty) {
      const batch1 = db.batch();
      readOldSnapshot.docs.forEach(doc => batch1.delete(doc.ref));
      await batch1.commit();
      totalDeleted += readOldSnapshot.size;
    }

    // 2. Eliminar TODAS las notificaciones con mas de 7 dias (leidas o no)
    const allOldSnapshot = await db.collection('notifications')
      .where('createdAt', '<', sevenDaysAgo)
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

// =============================================================================
// Cloud Function: Clonar config de nómina el 1 de enero
// =============================================================================
exports.clonarConfigNominaAnual = onSchedule({
  schedule: '0 6 1 1 *',        // 1 de enero a las 6:00 AM
  timeZone: 'America/Bogota',
  memory: '256MiB',
}, async (_event) => {
  const db = getFirestore();
  const nuevoAnio = new Date().getFullYear();
  const anioAnterior = nuevoAnio - 1;

  const TASAS_NODE_DEFAULT = {
    SALUD_EMPLEADO: 4,
    PENSION_EMPLEADO: 4,
    SALUD_EMPLEADOR: 8.5,
    PENSION_EMPLEADOR: 12,
    CAJA_COMPENSACION: 4,
    CESANTIAS: 8.33,
    INTERESES_CESANTIAS: 1,
    PRIMA: 8.33,
    VACACIONES: 4.17,
    ARL: { I: 0.522, II: 1.044, III: 2.436, IV: 4.350, V: 6.960 },
  };

  try {
    const nuevoRef = db.collection('configuracion_nomina').doc(String(nuevoAnio));
    const nuevoSnap = await nuevoRef.get();

    if (nuevoSnap.exists) {
      console.log(`ℹ️ Config nómina ${nuevoAnio} ya existe — no se sobreescribe.`);
      return;
    }

    const anteriorSnap = await db.collection('configuracion_nomina').doc(String(anioAnterior)).get();
    const baseData = anteriorSnap.exists
      ? anteriorSnap.data()
      : { smmlv: 1823109, auxTransporte: 258064, tasas: TASAS_NODE_DEFAULT };

    await nuevoRef.set({
      ...baseData,
      year: nuevoAnio,
      tasas: baseData.tasas || TASAS_NODE_DEFAULT,
      fechaVigencia: `${nuevoAnio}-01-01`,
      clonadoDe: anioAnterior,
      pendienteActualizacion: true,
      actualizadoPor: 'Sistema (auto)',
      actualizadoEn: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Config nómina ${nuevoAnio} creada (copiada de ${anioAnterior}).`);

    // Notificación in-app en Firestore
    await db.collection('notifications').add({
      tipo: 'nomina_config',
      titulo: `Nómina ${nuevoAnio} — Actualiza SMMLV`,
      mensaje: `Se creó la configuración de nómina ${nuevoAnio} copiando los valores de ${anioAnterior}. Por favor actualiza el SMMLV y Auxilio de Transporte vigente.`,
      year: nuevoAnio,
      leido: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Notificación push a administradores
    const adminsSnap = await db.collection('users')
      .where('role', 'in', ['ADMIN', 'SUPER_ADMIN'])
      .get();

    if (!adminsSnap.empty) {
      const { sendPushToMultipleUsers } = require('./pushService');
      await sendPushToMultipleUsers(
        adminsSnap.docs.map((d) => d.id),
        {
          title: `📋 Nómina ${nuevoAnio} — Actualiza SMMLV`,
          message: `Nuevo año fiscal. Actualiza el SMMLV y Auxilio de Transporte en el módulo de RRHH.`,
          type: 'nomina_config',
          priority: 'high',
          data: { year: String(nuevoAnio) },
        }
      );
      console.log(`🔔 Push enviado a ${adminsSnap.size} administrador(es).`);
    }
  } catch (err) {
    console.error('❌ Error en clonarConfigNominaAnual:', err);
    throw err;
  }
});
