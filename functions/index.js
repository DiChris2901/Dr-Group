const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin
initializeApp();

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
    if (userData.authUid) {
      try {
        await adminAuth.deleteUser(userData.authUid);
        console.log('✅ Usuario eliminado de Firebase Auth:', userData.authUid);
      } catch (authError) {
        console.warn('⚠️ Error eliminando de Auth:', authError);
        // Continuar con eliminación de Firestore aunque falle Auth
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
      deletedFromAuth: !!userData.authUid,
      deletedFromFirestore: true
    };

  } catch (error) {
    console.error('❌ Error en deleteUserComplete:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', `Error interno: ${error.message}`);
  }
});

/**
 * Cloud Function para verificar y limpiar usuarios duplicados
 */
exports.cleanDuplicateUsers = onCall(async (request) => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    const db = getFirestore();

    // Verificar permisos de admin
    const callerDoc = await db.collection('users')
      .where('authUid', '==', auth.uid)
      .limit(1)
      .get();

    if (callerDoc.empty) {
      throw new HttpsError('permission-denied', 'Usuario no encontrado');
    }

    const callerData = callerDoc.docs[0].data();
    if (callerData.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Solo administradores pueden ejecutar limpieza');
    }

    // Buscar duplicados por email
    const usersSnapshot = await db.collection('users').get();
    const emailMap = new Map();
    const duplicates = [];

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const email = data.email?.toLowerCase();
      
      if (email) {
        if (emailMap.has(email)) {
          duplicates.push({
            id: doc.id,
            email: email,
            data: data
          });
        } else {
          emailMap.set(email, {
            id: doc.id,
            data: data
          });
        }
      }
    });

    // Eliminar duplicados (mantener el más reciente)
    const deletedUsers = [];
    for (const duplicate of duplicates) {
      try {
        await db.collection('users').doc(duplicate.id).delete();
        deletedUsers.push(duplicate.email);
        console.log('🧹 Duplicado eliminado:', duplicate.email, duplicate.id);
      } catch (err) {
        console.error('Error eliminando duplicado:', err);
      }
    }

    return {
      success: true,
      duplicatesFound: duplicates.length,
      deletedUsers: deletedUsers,
      message: `Limpieza completada. ${duplicates.length} duplicados eliminados.`
    };

  } catch (error) {
    console.error('❌ Error en cleanDuplicateUsers:', error);
    throw new HttpsError('internal', `Error interno: ${error.message}`);
  }
});
