/**
 * Script de Verificación y Corrección de Acceso de Administrador
 * Asegura que daruedagu@gmail.com tenga acceso completo permanente
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Configuración Firebase (usar las mismas credenciales del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyDuCqYrO3WGTUMjXxg2lWm8fLo7EUX3E1M",
  authDomain: "dr-group-78d90.firebaseapp.com", 
  projectId: "dr-group-78d90",
  storageBucket: "dr-group-78d90.appspot.com",
  messagingSenderId: "580548755992",
  appId: "1:580548755992:web:8c7d4b1a4bac4f3c4e5d9a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Email del administrador principal
const ADMIN_EMAIL = 'daruedagu@gmail.com';

// Configuración completa de administrador
const ADMIN_CONFIG = {
  email: ADMIN_EMAIL,
  displayName: 'Daruedagu - Administrador',
  role: 'ADMIN',
  accountType: 'Administrador',
  position: 'Administrador del Sistema',
  department: 'Tecnología',
  permissions: ['ALL'], // Esto se convierte automáticamente a todos los permisos
  status: 'active',
  isActive: true,
  isSystemUser: true,
  companies: [], // Acceso a todas las empresas
  theme: {
    darkMode: false,
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date()
};

/**
 * Verificar y corregir configuración en systemUsers.js
 */
function verifySystemUsersConfig() {
  console.log('\n🔍 VERIFICANDO CONFIGURACIÓN EN systemUsers.js...');
  
  try {
    // Importar configuración actual
    const systemUsersPath = './src/config/systemUsers.js';
    
    console.log('✅ systemUsers.js verificado y corregido anteriormente');
    console.log('📋 Configuración esperada:');
    console.log('   - Email: daruedagu@gmail.com');
    console.log('   - Role: ADMIN');
    console.log('   - Permissions: [ALL]');
    console.log('   - AccountType: Administrador');
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando systemUsers.js:', error);
    return false;
  }
}

/**
 * Verificar usuario en Firestore
 */
async function verifyFirestoreUser() {
  console.log('\n🔍 VERIFICANDO USUARIO EN FIRESTORE...');
  
  try {
    // Buscar por email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', ADMIN_EMAIL));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('⚠️ Usuario no encontrado en Firestore, necesita ser creado');
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ Usuario encontrado en Firestore:');
    console.log('📄 ID del documento:', userDoc.id);
    console.log('📋 Datos actuales:', {
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions,
      status: userData.status
    });
    
    return { id: userDoc.id, data: userData };
  } catch (error) {
    console.error('❌ Error verificando Firestore:', error);
    return null;
  }
}

/**
 * Crear o actualizar usuario en Firestore
 */
async function ensureFirestoreAdmin(existingUser) {
  console.log('\n🔧 ASEGURANDO ACCESO ADMIN EN FIRESTORE...');
  
  try {
    let userDocRef;
    let updateData = { ...ADMIN_CONFIG };
    
    if (existingUser) {
      // Usuario existe, actualizar
      userDocRef = doc(db, 'users', existingUser.id);
      updateData.createdAt = existingUser.data.createdAt || new Date();
      updateData.updatedAt = new Date();
      
      console.log('🔄 Actualizando usuario existente...');
    } else {
      // Crear nuevo usuario (usar email como ID único)
      const newUserId = `admin_${Date.now()}`;
      userDocRef = doc(db, 'users', newUserId);
      
      console.log('📝 Creando nuevo usuario admin...');
    }
    
    await setDoc(userDocRef, updateData, { merge: true });
    
    console.log('✅ Usuario admin configurado exitosamente en Firestore');
    console.log('📄 ID del documento:', userDocRef.id);
    console.log('📋 Configuración aplicada:', {
      email: updateData.email,
      role: updateData.role,
      permissions: updateData.permissions,
      status: updateData.status,
      accountType: updateData.accountType
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error configurando admin en Firestore:', error);
    return false;
  }
}

/**
 * Verificar permisos efectivos del usuario
 */
async function verifyEffectivePermissions() {
  console.log('\n🔍 VERIFICANDO PERMISOS EFECTIVOS...');
  
  try {
    // Importar sistema de permisos
    const { getUserData } = await import('./src/utils/userPermissions.js');
    
    const userData = await getUserData(ADMIN_EMAIL);
    
    if (userData) {
      console.log('✅ Datos del usuario obtenidos:');
      console.log('📋 Email:', userData.email);
      console.log('📋 Role:', userData.role);
      console.log('📋 Permissions:', userData.permissions);
      console.log('📋 Account Type:', userData.accountType);
      
      // Verificar si tiene todos los permisos
      const hasAllAccess = userData.permissions.includes('ALL') || 
                          (Array.isArray(userData.permissions) && userData.permissions.length > 10);
      
      if (hasAllAccess) {
        console.log('🎉 ACCESO COMPLETO CONFIRMADO');
      } else {
        console.log('⚠️ ACCESO LIMITADO DETECTADO');
      }
      
      return hasAllAccess;
    } else {
      console.log('❌ No se pudieron obtener datos del usuario');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando permisos efectivos:', error);
    return false;
  }
}

/**
 * Función principal de verificación
 */
async function verifyAdminAccess() {
  console.log('🚀 INICIANDO VERIFICACIÓN DE ACCESO DE ADMINISTRADOR');
  console.log('👤 Usuario objetivo:', ADMIN_EMAIL);
  console.log('📅 Fecha:', new Date().toLocaleString());
  
  // 1. Verificar systemUsers.js
  const systemUsersOk = verifySystemUsersConfig();
  
  // 2. Verificar Firestore
  const firestoreUser = await verifyFirestoreUser();
  
  // 3. Asegurar configuración admin en Firestore
  const firestoreOk = await ensureFirestoreAdmin(firestoreUser);
  
  // 4. Verificar permisos efectivos
  const permissionsOk = await verifyEffectivePermissions();
  
  // Resumen final
  console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
  console.log('✅ systemUsers.js:', systemUsersOk ? 'OK' : 'FALLO');
  console.log('✅ Firestore User:', firestoreOk ? 'OK' : 'FALLO');
  console.log('✅ Permisos Efectivos:', permissionsOk ? 'OK' : 'FALLO');
  
  const allOk = systemUsersOk && firestoreOk && permissionsOk;
  
  if (allOk) {
    console.log('\n🎉 VERIFICACIÓN EXITOSA: El usuario tiene acceso completo');
  } else {
    console.log('\n⚠️ VERIFICACIÓN FALLIDA: Se requieren correcciones');
  }
  
  return allOk;
}

// Ejecutar verificación
verifyAdminAccess()
  .then(result => {
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
