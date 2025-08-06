// Script temporal para crear usuario en Firestore directamente
// Ejecutar en la consola del navegador cuando estés logueado

console.log('🔧 Script para crear usuario en Firestore');

// Función para crear usuario en Firestore
async function createUserInFirestore() {
  const { db } = window; // Acceder a la instancia de Firebase
  
  if (!db) {
    console.error('❌ Firebase no está disponible');
    return;
  }
  
  const userData = {
    email: 'smgc18@gmail.com',
    displayName: 'Nombre de tu Esposa', // CAMBIAR POR EL NOMBRE REAL
    name: 'Nombre de tu Esposa', // CAMBIAR POR EL NOMBRE REAL
    phone: '3001234567', // CAMBIAR POR EL TELÉFONO REAL
    role: 'ADMIN',
    permissions: [
      'view_receipts',
      'download_receipts', 
      'upload_receipts',
      'delete_receipts',
      'view_commitments',
      'create_commitments',
      'edit_commitments', 
      'delete_commitments',
      'generate_reports',
      'export_data',
      'manage_users',
      'view_users',
      'admin_access',
      'system_config'
    ],
    companies: ['DR Group'],
    isActive: true,
    department: 'Administración',
    position: 'Administrador',
    authUid: 'PONER_UID_DE_FIREBASE_AUTH_AQUI', // CAMBIAR POR EL UID REAL
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'manual',
    notes: 'Usuario creado manualmente desde script'
  };
  
  try {
    // Crear documento con ID basado en email
    const userDocId = userData.email.replace(/[^a-zA-Z0-9]/g, '_');
    
    await firebase.firestore().collection('users').doc(userDocId).set(userData);
    
    console.log('✅ Usuario creado exitosamente en Firestore');
    console.log('📧 Email:', userData.email);
    console.log('💾 Document ID:', userDocId);
    console.log('🔑 El usuario ya puede iniciar sesión');
    
    alert('✅ Usuario creado exitosamente! Ya puede iniciar sesión.');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    alert('❌ Error: ' + error.message);
  }
}

// Ejecutar automáticamente
createUserInFirestore();
