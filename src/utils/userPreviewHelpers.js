// 🎯 DR Group - Helpers para Usuario Preview
// Funciones utilitarias para la gestión de previews de usuario en el login

import { getSystemUser } from '../config/systemUsers';

/**
 * Crea objeto userPreview para usuario de Firebase
 * @param {string} email - Email del usuario
 * @param {Object} firebaseUser - Datos del usuario de Firebase
 * @returns {Object} - Objeto userPreview formateado
 */
export const createFirebaseUserPreview = (email, firebaseUser) => {
  return {
    email,
    name: firebaseUser.name || firebaseUser.displayName,
    position: firebaseUser.position || firebaseUser.role || 'Usuario del Sistema',
    department: firebaseUser.department || 'DR Group',
    photoURL: firebaseUser.photoURL,
    lastLogin: firebaseUser.lastLogin || new Date().toISOString(),
    accountType: firebaseUser.role === 'ADMIN' ? 'Administrador' : 
                firebaseUser.role === 'MANAGER' ? 'Gerente' : 'Usuario',
    isRealUser: true,
    isActive: firebaseUser.isActive !== false,
    joinDate: firebaseUser.createdAt || new Date().toISOString()
  };
};

/**
 * Crea objeto userPreview para usuario del sistema
 * @param {string} email - Email del usuario
 * @param {Object} systemUser - Datos del usuario del sistema
 * @returns {Object} - Objeto userPreview formateado
 */
export const createSystemUserPreview = (email, systemUser) => {
  return {
    email,
    name: systemUser.name,
    position: systemUser.position,
    department: systemUser.department,
    photoURL: systemUser.photoURL,
    accountType: systemUser.accountType,
    lastLogin: systemUser.lastLogin,
    joinDate: systemUser.joinDate,
    isRealUser: false,
    isActive: systemUser.isActive
  };
};

/**
 * Crea objeto userPreview para usuario no registrado
 * @param {string} email - Email del usuario
 * @returns {Object} - Objeto userPreview para usuario no registrado
 */
export const createUnregisteredUserPreview = (email) => {
  return {
    email,
    name: null,
    position: null,
    department: null,
    photoURL: null,
    accountType: null,
    lastLogin: null,
    joinDate: null,
    isRealUser: false,
    isActive: false,
    isUnregistered: true // Flag para identificar usuario no registrado
  };
};

/**
 * Procesa email y genera userPreview apropiado
 * @param {string} email - Email a procesar
 * @param {Function} checkEmailExists - Función para verificar en Firebase
 * @returns {Object} - Objeto userPreview completo
 */
export const processUserEmail = async (email, checkEmailExists) => {
  console.log('🔍 Verificando email:', email);
  
  try {
    // Primero intentar obtener datos reales de Firebase
    const realUser = await checkEmailExists(email);
    
    if (realUser) {
      console.log('✅ Usuario real encontrado:', realUser);
      return createFirebaseUserPreview(email, realUser);
    }
    
    console.log('⚠️ Usuario no encontrado en Firebase:', email);
    
    // Verificar si es un usuario conocido del sistema (fallback)
    const systemUser = getSystemUser(email);
    
    if (systemUser) {
      console.log('✅ Usuario del sistema encontrado:', systemUser);
      return createSystemUserPreview(email, systemUser);
    }
    
    console.log('⚠️ Usuario no registrado:', email);
    return createUnregisteredUserPreview(email);
    
  } catch (error) {
    console.error('❌ Error procesando email:', error);
    throw error;
  }
};

export default {
  createFirebaseUserPreview,
  createSystemUserPreview,
  createUnregisteredUserPreview,
  processUserEmail
};
