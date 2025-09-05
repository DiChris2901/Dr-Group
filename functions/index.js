const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin
initializeApp();

// Importar funciones de WhatsApp
const {
  notifyNewCommitment,
  dailyNotificationCheck,
  testWhatsAppNotification,
  sendWhatsAppTemplate
} = require('./whatsapp-notifications');

// Exportar funciones de WhatsApp
exports.notifyNewCommitment = notifyNewCommitment;
exports.dailyNotificationCheck = dailyNotificationCheck;
exports.testWhatsAppNotification = testWhatsAppNotification;
exports.sendWhatsAppTemplate = sendWhatsAppTemplate;

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
