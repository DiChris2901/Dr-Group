// Script para clonar usuario existente con nuevos datos personales
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const cloneUserWithNewData = async (sourceEmail, newEmail, newName, newPhone = '', newAuthUid = '') => {
  try {
    // 1. Buscar el usuario fuente (tu usuario)
    const sourceUserId = sourceEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const sourceUserDoc = await getDoc(doc(db, 'users', sourceUserId));
    
    if (!sourceUserDoc.exists()) {
      throw new Error(`Usuario fuente ${sourceEmail} no encontrado`);
    }
    
    const sourceUserData = sourceUserDoc.data();
    console.log('📋 Usuario fuente encontrado:', sourceUserData.displayName);
    
    // 2. Crear nuevo usuario copiando TODOS los datos del usuario fuente
    const newUserData = {
      ...sourceUserData, // Copia TODO: permisos, configuraciones, rol, etc.
      
      // Solo cambiar los datos personales:
      email: newEmail,
      displayName: newName,
      name: newName,
      phone: newPhone,
      authUid: newAuthUid, // UID de Firebase Authentication
      
      // Actualizar timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Opcional: agregar nota de que es un usuario clonado
      notes: `Usuario clonado de ${sourceEmail} el ${new Date().toLocaleDateString()}`
    };

    // 3. Crear el nuevo documento con ID basado en el email
    const newUserId = newEmail.replace(/[^a-zA-Z0-9]/g, '_');
    await setDoc(doc(db, 'users', newUserId), newUserData);
    
    console.log(`✅ Usuario ${newEmail} creado exitosamente como copia de ${sourceEmail}`);
    console.log('🔑 Permisos copiados:', newUserData.permissions);
    console.log('👤 Rol asignado:', newUserData.role);
    
    return { 
      success: true, 
      message: `Usuario ${newEmail} creado como copia exacta de ${sourceEmail}`,
      userData: newUserData
    };
    
  } catch (error) {
    console.error('❌ Error clonando usuario:', error);
    return { success: false, error: error.message };
  }
};

// Función de uso específico para tu caso:
export const createSpouseUser = async (spouseName, spouseEmail, spousePhone, authUid) => {
  return await cloneUserWithNewData(
    'daruedagu@gmail.com', // Tu email (usuario fuente)
    spouseEmail,           // Email de tu esposa
    spouseName,            // Nombre de tu esposa
    spousePhone,           // Teléfono de tu esposa
    authUid                // UID de Firebase Auth de tu esposa
  );
};

// Ejemplo de uso:
// createSpouseUser(
//   'Nombre de tu Esposa', 
//   'smgc18@gmail.com', 
//   '3001234567',
//   'bAUQ52s2o5aghQlZlbYQBHD...' // UID de Firebase Auth
// );

export default cloneUserWithNewData;
