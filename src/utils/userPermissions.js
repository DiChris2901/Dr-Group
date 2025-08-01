/**
 * Sistema de Permisos de Usuario - DR Group Dashboard
 * Gestiona los permisos granulares para diferentes acciones del sistema
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Enum de permisos disponibles
export const PERMISSIONS = {
  // Permisos de comprobantes
  DOWNLOAD_RECEIPTS: 'download_receipts',
  VIEW_RECEIPTS: 'view_receipts',
  UPLOAD_RECEIPTS: 'upload_receipts',
  DELETE_RECEIPTS: 'delete_receipts',
  
  // Permisos de compromisos
  CREATE_COMMITMENTS: 'create_commitments',
  EDIT_COMMITMENTS: 'edit_commitments',
  DELETE_COMMITMENTS: 'delete_commitments',
  VIEW_COMMITMENTS: 'view_commitments',
  
  // Permisos de usuarios
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Permisos de reportes
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_DATA: 'export_data',
  
  // Permisos administrativos
  ADMIN_ACCESS: 'admin_access',
  SYSTEM_CONFIG: 'system_config'
};

// Traducciones de permisos al español
export const PERMISSION_TRANSLATIONS = {
  [PERMISSIONS.DOWNLOAD_RECEIPTS]: 'Descargar comprobantes',
  [PERMISSIONS.VIEW_RECEIPTS]: 'Ver comprobantes',
  [PERMISSIONS.UPLOAD_RECEIPTS]: 'Subir comprobantes',
  [PERMISSIONS.DELETE_RECEIPTS]: 'Eliminar comprobantes',
  [PERMISSIONS.CREATE_COMMITMENTS]: 'Crear compromisos',
  [PERMISSIONS.EDIT_COMMITMENTS]: 'Editar compromisos',
  [PERMISSIONS.DELETE_COMMITMENTS]: 'Eliminar compromisos',
  [PERMISSIONS.VIEW_COMMITMENTS]: 'Ver compromisos',
  [PERMISSIONS.MANAGE_USERS]: 'Gestionar usuarios',
  [PERMISSIONS.VIEW_USERS]: 'Ver usuarios',
  [PERMISSIONS.GENERATE_REPORTS]: 'Generar reportes',
  [PERMISSIONS.EXPORT_DATA]: 'Exportar datos',
  [PERMISSIONS.ADMIN_ACCESS]: 'Acceso administrativo',
  [PERMISSIONS.SYSTEM_CONFIG]: 'Configuración del sistema'
};

// Roles predefinidos con permisos
export const USER_ROLES = {
  ADMIN: {
    name: 'Administrador',
    permissions: Object.values(PERMISSIONS),
    description: 'Acceso completo al sistema'
  },
  MANAGER: {
    name: 'Gerente',
    permissions: [
      PERMISSIONS.VIEW_RECEIPTS,
      PERMISSIONS.DOWNLOAD_RECEIPTS,
      PERMISSIONS.UPLOAD_RECEIPTS,
      PERMISSIONS.CREATE_COMMITMENTS,
      PERMISSIONS.EDIT_COMMITMENTS,
      PERMISSIONS.VIEW_COMMITMENTS,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.VIEW_USERS
    ],
    description: 'Gestión de compromisos y reportes'
  },
  EMPLOYEE: {
    name: 'Empleado',
    permissions: [
      PERMISSIONS.VIEW_RECEIPTS,
      PERMISSIONS.UPLOAD_RECEIPTS,
      PERMISSIONS.CREATE_COMMITMENTS,
      PERMISSIONS.EDIT_COMMITMENTS,
      PERMISSIONS.VIEW_COMMITMENTS
    ],
    description: 'Creación y consulta básica'
  },
  VIEWER: {
    name: 'Solo Lectura',
    permissions: [
      PERMISSIONS.VIEW_RECEIPTS,
      PERMISSIONS.VIEW_COMMITMENTS
    ],
    description: 'Solo lectura'
  }
};

// Cache de usuarios para mejorar rendimiento
let userCache = new Map();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene los datos del usuario desde Firebase
 */
const getUserData = async (email) => {
  const now = Date.now();
  const cacheKey = email.toLowerCase();
  
  // Verificar cache
  if (userCache.has(cacheKey) && now < cacheExpiry) {
    return userCache.get(cacheKey);
  }
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      
      // Actualizar cache
      userCache.set(cacheKey, userData);
      cacheExpiry = now + CACHE_DURATION;
      
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Verifica si un usuario tiene un permiso específico
 */
export const hasPermission = async (userEmail, permission) => {
  if (!userEmail || !permission) return false;
  
  try {
    const userData = await getUserData(userEmail);
    
    if (!userData) {
      console.log(`❌ Usuario no encontrado: ${userEmail}`);
      return false;
    }
    
    // Verificar si el usuario está activo
    if (!userData.isActive) {
      console.log(`❌ Usuario inactivo: ${userEmail}`);
      return false;
    }
    
    // Verificar permisos directos
    if (userData.permissions && userData.permissions.includes(permission)) {
      return true;
    }
    
    // Verificar permisos por rol
    if (userData.role && USER_ROLES[userData.role]) {
      return USER_ROLES[userData.role].permissions.includes(permission);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Verifica si un usuario tiene alguno de los permisos especificados
 */
export const hasAnyPermission = async (userEmail, permissions) => {
  if (!userEmail || !Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  
  for (const permission of permissions) {
    if (await hasPermission(userEmail, permission)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Verifica si un usuario tiene todos los permisos especificados
 */
export const hasAllPermissions = async (userEmail, permissions) => {
  if (!userEmail || !Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  
  for (const permission of permissions) {
    if (!(await hasPermission(userEmail, permission))) {
      return false;
    }
  }
  
  return true;
};

/**
 * Obtiene todos los permisos de un usuario
 */
export const getUserPermissions = async (userEmail) => {
  if (!userEmail) return [];
  
  try {
    const userData = await getUserData(userEmail);
    
    if (!userData || !userData.isActive) {
      return [];
    }
    
    let permissions = [];
    
    // Agregar permisos directos
    if (userData.permissions && Array.isArray(userData.permissions)) {
      permissions = [...userData.permissions];
    }
    
    // Agregar permisos del rol
    if (userData.role && USER_ROLES[userData.role]) {
      const rolePermissions = USER_ROLES[userData.role].permissions;
      permissions = [...new Set([...permissions, ...rolePermissions])];
    }
    
    return permissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

/**
 * Verifica si un usuario es administrador
 */
export const isAdmin = async (userEmail) => {
  return await hasPermission(userEmail, PERMISSIONS.ADMIN_ACCESS);
};

/**
 * Limpia el cache de usuarios
 */
export const clearUserCache = () => {
  userCache.clear();
  cacheExpiry = 0;
};

/**
 * Obtiene los permisos de un rol específico
 */
export const getRolePermissions = (role) => {
  return USER_ROLES[role]?.permissions || [];
};

// Estructura de usuario esperada en Firestore
export const USER_STRUCTURE_EXAMPLE = {
  email: 'usuario@empresa.com',
  displayName: 'Nombre del Usuario',
  role: 'MANAGER', // ADMIN, MANAGER, EMPLOYEE, VIEWER
  permissions: [
    // Array de permisos específicos del usuario
    PERMISSIONS.VIEW_RECEIPTS,
    PERMISSIONS.DOWNLOAD_RECEIPTS,
    // ... más permisos
  ],
  companies: ['company_id_1', 'company_id_2'], // Empresas a las que tiene acceso
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  isActive: true,
  department: 'Finanzas',
  notes: 'Notas adicionales',
  metadata: {
    lastLogin: 'timestamp',
    createdBy: 'admin_email',
    setupDate: 'timestamp'
  }
};

// Exportar todo para uso fácil
export default {
  PERMISSIONS,
  PERMISSION_TRANSLATIONS,
  USER_ROLES,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getUserPermissions,
  isAdmin,
  getRolePermissions,
  clearUserCache
};
