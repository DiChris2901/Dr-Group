/**
 * Sistema de Permisos de Usuario - DR Group Dashboard
 * Gestiona los permisos granulares para diferentes acciones del sistema
 */

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

// Roles predefinidos con permisos
export const USER_ROLES = {
  ADMIN: {
    name: 'Administrador',
    permissions: Object.values(PERMISSIONS)
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
    ]
  },
  EMPLOYEE: {
    name: 'Empleado',
    permissions: [
      PERMISSIONS.VIEW_RECEIPTS,
      PERMISSIONS.UPLOAD_RECEIPTS,
      PERMISSIONS.CREATE_COMMITMENTS,
      PERMISSIONS.EDIT_COMMITMENTS,
      PERMISSIONS.VIEW_COMMITMENTS
    ]
  },
  VIEWER: {
    name: 'Solo Lectura',
    permissions: [
      PERMISSIONS.VIEW_RECEIPTS,
      PERMISSIONS.VIEW_COMMITMENTS
    ]
  }
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {Object} user - Objeto del usuario con sus permisos
 * @param {string} permission - Permiso a verificar
 * @returns {boolean} - True si tiene el permiso
 */
export const hasPermission = (user, permission) => {
  if (!user) {
    console.warn('Usuario no definido para verificación de permisos');
    return false;
  }
  
  // TEMPORAL: Hasta que implementemos el sistema completo de usuarios
  // Por ahora, verificamos si el usuario tiene permisos específicos o es admin
  if (user.email) {
    // Lista temporal de emails con permisos de descarga
    const usersWithDownloadPermissions = [
      'admin@drgroup.com',
      'gerente@drgroup.com',
      'diego@drgroup.com' // Agregar emails que deben tener permisos
    ];
    
    // Si es para descarga de recibos, verificar lista temporal
    if (permission === PERMISSIONS.DOWNLOAD_RECEIPTS) {
      return usersWithDownloadPermissions.includes(user.email.toLowerCase());
    }
    
    // Otros permisos por defecto habilitados por ahora
    return true;
  }
  
  // Si tiene estructura completa de permisos (implementación futura)
  if (user.permissions) {
    // Los admins tienen todos los permisos
    if (user.role === 'ADMIN' || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
      return true;
    }
    
    return user.permissions.includes(permission);
  }
  
  // Por defecto, denegar si no hay información suficiente
  console.warn('Usuario sin estructura de permisos definida:', user);
  return false;
};

/**
 * Verifica múltiples permisos (AND logic)
 * @param {Object} user - Objeto del usuario
 * @param {Array} permissions - Array de permisos a verificar
 * @returns {boolean} - True si tiene TODOS los permisos
 */
export const hasAllPermissions = (user, permissions) => {
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Verifica si tiene al menos uno de los permisos (OR logic)
 * @param {Object} user - Objeto del usuario
 * @param {Array} permissions - Array de permisos a verificar
 * @returns {boolean} - True si tiene AL MENOS UNO de los permisos
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Obtiene los permisos de un rol específico
 * @param {string} role - Nombre del rol
 * @returns {Array} - Array de permisos del rol
 */
export const getRolePermissions = (role) => {
  return USER_ROLES[role]?.permissions || [];
};

/**
 * Hook personalizado para verificar permisos en componentes React
 * @param {string} permission - Permiso a verificar
 * @returns {boolean} - True si el usuario actual tiene el permiso
 */
export const usePermission = (permission) => {
  // Este hook se implementará cuando tengamos el contexto de usuario completo
  // Por ahora retorna true para no romper la funcionalidad existente
  return true;
};

/**
 * Estructura de usuario esperada en Firestore
 * Esta estructura se usará al crear/editar usuarios
 */
export const USER_STRUCTURE_EXAMPLE = {
  uid: 'user_firebase_uid',
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
  metadata: {
    lastLogin: 'timestamp',
    createdBy: 'admin_uid',
    department: 'Finanzas'
  }
};

// Exportar todo para uso fácil
export default {
  PERMISSIONS,
  USER_ROLES,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  usePermission
};
