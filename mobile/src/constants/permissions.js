// 📋 SISTEMA DE PERMISOS SIMPLIFICADO - APP MÓVIL
// Versión 2.0.0 - Enero 2026
// ROL = Identificación visual | PERMISO = Control de acceso real

// ========================================
// 🎯 DEFINICIÓN DE PERMISOS (17 TOTAL)
// ========================================

export const APP_PERMISSIONS = {
  // ====================================
  // 📱 BÁSICOS (7 permisos) - Acceso a pantallas principales
  // ====================================
  DASHBOARD: 'dashboard',           // Ver DashboardScreen
  CALENDARIO: 'calendario',         // Ver CalendarioScreen
  HISTORIAL: 'historial',          // Ver HistorialScreen
  PERFIL: 'perfil',                // Ver PerfilScreen
  CONFIGURACION: 'configuracion',   // Ver SettingsScreen
  NOTIFICACIONES: 'notificaciones', // Ver NotificacionesScreen
  CHAT: 'chat',                    // Ver ChatScreen

  // ====================================
  // 🔀 DIVIDIDOS (6 permisos) - Dos niveles de acceso
  // ====================================
  
  // ASISTENCIAS (2 permisos) - Control de visibilidad de registros
  ASISTENCIAS_PROPIAS: 'asistencias.propias',  // ← Ve SOLO sus registros
  ASISTENCIAS_TODOS: 'asistencias.todos',      // ← Ve registros de TODOS

  // NOVEDADES (2 permisos) - Control de acciones
  NOVEDADES_REPORTAR: 'novedades.reportar',    // ← Reportar incidentes propios
  NOVEDADES_GESTIONAR: 'novedades.gestionar',  // ← Gestionar todas las novedades

  // REPORTES (2 permisos) - Control de visibilidad de reportes
  REPORTES_PROPIOS: 'reportes.propios',        // ← Ve SOLO sus reportes
  REPORTES_TODOS: 'reportes.todos',            // ← Ve reportes de TODOS

  // ====================================
  // 👑 ADMIN (4 permisos) - Acceso a funciones administrativas
  // ====================================
  ADMIN_DASHBOARD: 'admin.dashboard',          // ← Define ROL: ADMIN
  USUARIOS_GESTIONAR: 'usuarios.gestionar',    // ← Define ROL: SUPERADMIN (gestión de permisos)
  STORAGE: 'storage',                          // ← Acceso a gestión de archivos
  AUDITORIA: 'auditoria'                       // ← Ver logs del sistema
};

// ========================================
// 📦 CATEGORÍAS DE PERMISOS (Para UI)
// ========================================

export const PERMISSION_CATEGORIES = [
  {
    id: 'basicos',
    name: '📱 Básicos',
    description: 'Acceso a pantallas principales de la app',
    icon: 'apps',
    permissions: [
      APP_PERMISSIONS.DASHBOARD,
      APP_PERMISSIONS.CALENDARIO,
      APP_PERMISSIONS.HISTORIAL,
      APP_PERMISSIONS.PERFIL,
      APP_PERMISSIONS.CONFIGURACION,
      APP_PERMISSIONS.NOTIFICACIONES,
      APP_PERMISSIONS.CHAT,
    ],
  },
  {
    id: 'divididos',
    name: '🔀 Acceso Dividido',
    description: 'Permisos con dos niveles (propios vs todos)',
    icon: 'account-switch',
    permissions: [
      APP_PERMISSIONS.ASISTENCIAS_PROPIAS,
      APP_PERMISSIONS.ASISTENCIAS_TODOS,
      APP_PERMISSIONS.NOVEDADES_REPORTAR,
      APP_PERMISSIONS.NOVEDADES_GESTIONAR,
      APP_PERMISSIONS.REPORTES_PROPIOS,
      APP_PERMISSIONS.REPORTES_TODOS,
    ],
  },
  {
    id: 'admin',
    name: '👑 Administrativos',
    description: 'Funciones de administración y control',
    icon: 'shield-crown',
    permissions: [
      APP_PERMISSIONS.ADMIN_DASHBOARD,
      APP_PERMISSIONS.USUARIOS_GESTIONAR,
      APP_PERMISSIONS.STORAGE,
      APP_PERMISSIONS.AUDITORIA,
    ],
  },
];

// ========================================
// 🎭 ROLES Y PERMISOS POR DEFECTO
// ========================================

// USER: Permisos básicos (7 permisos)
export const USER_PERMISSIONS = [
  APP_PERMISSIONS.DASHBOARD,
  APP_PERMISSIONS.CALENDARIO,
  APP_PERMISSIONS.HISTORIAL,
  APP_PERMISSIONS.PERFIL,
  APP_PERMISSIONS.CONFIGURACION,
  APP_PERMISSIONS.NOTIFICACIONES,
  APP_PERMISSIONS.CHAT,
];

// ADMIN: Permisos básicos + admin.dashboard + algunos divididos (11 permisos sugeridos)
export const ADMIN_DEFAULT_PERMISSIONS = [
  ...USER_PERMISSIONS,              // 7 básicos
  APP_PERMISSIONS.ADMIN_DASHBOARD,  // ← Define ROL: ADMIN
  APP_PERMISSIONS.ASISTENCIAS_TODOS,
  APP_PERMISSIONS.REPORTES_TODOS,
  APP_PERMISSIONS.NOVEDADES_GESTIONAR,
];

// SUPERADMIN: Todos los permisos (17 permisos)
export const SUPERADMIN_PERMISSIONS = Object.values(APP_PERMISSIONS);

// ========================================
// 🔄 CÁLCULO DINÁMICO DE ROL
// ========================================

/**
 * Calcula el appRole según permisos específicos
 * IMPORTANTE: El ROL es solo identificación visual
 * Los PERMISOS individuales controlan el acceso real
 * 
 * @param {string[]} permissions - Array de permisos activos
 * @returns {'SUPERADMIN' | 'ADMIN' | 'USER'}
 */
export const calculateAppRole = (permissions) => {
  // SUPERADMIN: Tiene permiso de gestionar usuarios
  if (permissions.includes(APP_PERMISSIONS.USUARIOS_GESTIONAR)) {
    return 'SUPERADMIN';
  }
  
  // ADMIN: Tiene acceso al AdminDashboard
  if (permissions.includes(APP_PERMISSIONS.ADMIN_DASHBOARD)) {
    return 'ADMIN';
  }
  
  // USER: No tiene permisos administrativos
  return 'USER';
};

/**
 * Valida si un permiso existe
 * @param {string} permission - Permiso a validar
 * @returns {boolean}
 */
export const isValidPermission = (permission) => {
  return Object.values(APP_PERMISSIONS).includes(permission);
};

/**
 * Obtiene todos los permisos como array
 * @returns {string[]}
 */
export const getAllPermissions = () => {
  return Object.values(APP_PERMISSIONS);
};

/**
 * Obtiene permisos por categoría
 * @param {string} categoryId - ID de la categoría
 * @returns {string[]}
 */
export const getPermissionsByCategory = (categoryId) => {
  const category = PERMISSION_CATEGORIES.find((cat) => cat.id === categoryId);
  return category ? category.permissions : [];
};
