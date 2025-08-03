import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

// Configuración de Firebase (copiada de firebase.js)
const firebaseConfig = {
  // Tu configuración de Firebase aquí
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Script para convertir un usuario en administrador principal
 * Este script debe ejecutarse una sola vez para configurar el administrador inicial
 */

const setupAdminUser = async () => {
  try {
    // Email del usuario que será administrador (CAMBIAR POR TU EMAIL)
    const adminEmail = 'tu-email@aqui.com'; // ← CAMBIAR ESTO
    
    console.log('🔧 Configurando usuario administrador...');
    console.log('📧 Email:', adminEmail);
    
    // Datos del usuario administrador
    const adminUserData = {
      email: adminEmail.toLowerCase(),
      displayName: 'Administrador Principal',
      role: 'ADMIN',
      permissions: [
        // Todos los permisos posibles
        'download_receipts',
        'view_receipts',
        'upload_receipts',
        'delete_receipts',
        'create_commitments',
        'edit_commitments',
        'delete_commitments',
        'view_commitments',
        'generate_reports',
        'export_data',
        'manage_users',
        'view_users',
        'admin_access',
        'system_config'
      ],
      companies: [], // Acceso a todas las empresas
      isActive: true,
      department: 'Administración',
      notes: 'Usuario administrador principal del sistema',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        isMainAdmin: true,
        setupDate: new Date().toISOString(),
        cannotBeDeleted: true
      }
    };

    // Verificar si ya existe un usuario con este email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail.toLowerCase()));
    const existingUsers = await getDocs(q);

    if (!existingUsers.empty) {
      // Actualizar usuario existente
      const userDoc = existingUsers.docs[0];
      await setDoc(doc(db, 'users', userDoc.id), adminUserData, { merge: true });
      console.log('✅ Usuario existente actualizado a administrador');
    } else {
      // Crear nuevo usuario administrador
      const newDocRef = doc(collection(db, 'users'));
      await setDoc(newDocRef, adminUserData);
      console.log('✅ Nuevo usuario administrador creado');
    }

    console.log('🎉 Configuración completada exitosamente!');
    console.log('📋 Permisos asignados:', adminUserData.permissions.length);
    console.log('🔐 Acceso: Administrador completo');
    
    return {
      success: true,
      message: 'Usuario administrador configurado correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error configurando administrador:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Función para verificar el estado actual del usuario
 */
const checkUserStatus = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('👤 Usuario no encontrado en la base de datos');
      return null;
    }
    
    const userData = snapshot.docs[0].data();
    console.log('📊 Estado actual del usuario:');
    console.log('  📧 Email:', userData.email);
    console.log('  👥 Rol:', userData.role);
    console.log('  🔑 Permisos:', userData.permissions?.length || 0);
    console.log('  ✅ Activo:', userData.isActive);
    
    return userData;
    
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
    return null;
  }
};

// Exportar funciones para uso
export { setupAdminUser, checkUserStatus };

/**
 * INSTRUCCIONES DE USO:
 * 
 * 1. Cambiar el email en la línea 27 por tu email real
 * 2. Ejecutar este script desde la consola del navegador:
 *    - Abrir http://localhost:3002
 *    - Abrir DevTools (F12)
 *    - En la consola, ejecutar:
 *      import('./setupAdmin.js').then(m => m.setupAdminUser())
 * 
 * 3. Verificar que se creó correctamente:
 *    - Ir a http://localhost:3002/users
 *    - Deberías ver tu usuario como administrador
 * 
 * NOTA: Este script solo necesita ejecutarse UNA VEZ
 */
