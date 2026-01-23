// 📋 SISTEMA DE PERMISOS GRANULARES - APP MÓVIL
// Versión 1.0.0 - Enero 2026

// ========================================
// 🎯 DEFINICIÓN DE PERMISOS (35 TOTAL)
// ========================================

export const APP_PERMISSIONS = {
  // 1. DASHBOARD (3 permisos)
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_STATS: 'dashboard.stats',
  DASHBOARD_CHARTS: 'dashboard.charts',

  // 2. ASISTENCIAS (5 permisos)
  ASISTENCIAS_VIEW: 'asistencias.view',
  ASISTENCIAS_REGISTRO: 'asistencias.registro',
  ASISTENCIAS_BREAK: 'asistencias.break',
  ASISTENCIAS_ALMUERZO: 'asistencias.almuerzo',
  ASISTENCIAS_EXPORT: 'asistencias.export',

  // 3. REPORTES (4 permisos)
  REPORTES_VIEW: 'reportes.view',
  REPORTES_STATS: 'reportes.stats',
  REPORTES_CHARTS: 'reportes.charts',
  REPORTES_EXPORT: 'reportes.export',

  // 4. CALENDARIO (3 permisos)
  CALENDARIO_VIEW: 'calendario.view',
  CALENDARIO_EVENTOS: 'calendario.eventos',
  CALENDARIO_FESTIVOS: 'calendario.festivos',

  // 5. NOVEDADES (4 permisos)
  NOVEDADES_VIEW: 'novedades.view',
  NOVEDADES_CREATE: 'novedades.create',
  NOVEDADES_EDIT: 'novedades.edit',
  NOVEDADES_DELETE: 'novedades.delete',

  // 6. USUARIOS (4 permisos)
  USUARIOS_VIEW: 'usuarios.view',
  USUARIOS_PERMISSIONS: 'usuarios.permissions', // ← CRÍTICO: Solo SUPERADMIN
  USUARIOS_CREATE: 'usuarios.create',
  USUARIOS_EDIT: 'usuarios.edit',

  // 7. CONFIGURACIÓN (3 permisos)
  CONFIG_VIEW: 'config.view',
  CONFIG_THEME: 'config.theme',
  CONFIG_APP: 'config.app',

  // 8. PERFIL (3 permisos)
  PERFIL_VIEW: 'perfil.view',
  PERFIL_EDIT: 'perfil.edit',
  PERFIL_PHOTO: 'perfil.photo',

  // 9. NOTIFICACIONES (3 permisos)
  NOTIFICACIONES_VIEW: 'notificaciones.view',
  NOTIFICACIONES_MANAGE: 'notificaciones.manage',
  NOTIFICACIONES_SEND: 'notificaciones.send',

  // 10. AVANZADO (3 permisos)
  STORAGE_VIEW: 'storage.view',
  LOGS_VIEW: 'logs.view',
  ADMIN_TOOLS: 'admin.tools',
};

// ========================================
// 📦 CATEGORÍAS DE PERMISOS (Para UI)
// ========================================

export const PERMISSION_CATEGORIES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'view-dashboard',
    permissions: [
      APP_PERMISSIONS.DASHBOARD_VIEW,
      APP_PERMISSIONS.DASHBOARD_STATS,
      APP_PERMISSIONS.DASHBOARD_CHARTS,
    ],
  },
  {
    id: 'asistencias',
    name: 'Asistencias',
    icon: 'clock-check-outline',
    permissions: [
      APP_PERMISSIONS.ASISTENCIAS_VIEW,
      APP_PERMISSIONS.ASISTENCIAS_REGISTRO,
      APP_PERMISSIONS.ASISTENCIAS_BREAK,
      APP_PERMISSIONS.ASISTENCIAS_ALMUERZO,
      APP_PERMISSIONS.ASISTENCIAS_EXPORT,
    ],
  },
  {
    id: 'reportes',
    name: 'Reportes',
    icon: 'chart-line',
    permissions: [
      APP_PERMISSIONS.REPORTES_VIEW,
      APP_PERMISSIONS.REPORTES_STATS,
      APP_PERMISSIONS.REPORTES_CHARTS,
      APP_PERMISSIONS.REPORTES_EXPORT,
    ],
  },
  {
    id: 'calendario',
    name: 'Calendario',
    icon: 'calendar',
    permissions: [
      APP_PERMISSIONS.CALENDARIO_VIEW,
      APP_PERMISSIONS.CALENDARIO_EVENTOS,
      APP_PERMISSIONS.CALENDARIO_FESTIVOS,
    ],
  },
  {
    id: 'novedades',
    name: 'Novedades',
    icon: 'newspaper-variant-outline',
    permissions: [
      APP_PERMISSIONS.NOVEDADES_VIEW,
      APP_PERMISSIONS.NOVEDADES_CREATE,
      APP_PERMISSIONS.NOVEDADES_EDIT,
      APP_PERMISSIONS.NOVEDADES_DELETE,
    ],
  },
  {
    id: 'usuarios',
    name: 'Usuarios',
    icon: 'account-group',
    permissions: [
      APP_PERMISSIONS.USUARIOS_VIEW,
      APP_PERMISSIONS.USUARIOS_PERMISSIONS,
      APP_PERMISSIONS.USUARIOS_CREATE,
      APP_PERMISSIONS.USUARIOS_EDIT,
    ],
  },
  {
    id: 'config',
    name: 'Configuración',
    icon: 'cog',
    permissions: [
      APP_PERMISSIONS.CONFIG_VIEW,
      APP_PERMISSIONS.CONFIG_THEME,
      APP_PERMISSIONS.CONFIG_APP,
    ],
  },
  {
    id: 'perfil',
    name: 'Perfil',
    icon: 'account-circle',
    permissions: [
      APP_PERMISSIONS.PERFIL_VIEW,
      APP_PERMISSIONS.PERFIL_EDIT,
      APP_PERMISSIONS.PERFIL_PHOTO,
    ],
  },
  {
    id: 'notificaciones',
    name: 'Notificaciones',
    icon: 'bell',
    permissions: [
      APP_PERMISSIONS.NOTIFICACIONES_VIEW,
      APP_PERMISSIONS.NOTIFICACIONES_MANAGE,
      APP_PERMISSIONS.NOTIFICACIONES_SEND,
    ],
  },
  {
    id: 'avanzado',
    name: 'Avanzado',
    icon: 'shield-crown',
    permissions: [
      APP_PERMISSIONS.STORAGE_VIEW,
      APP_PERMISSIONS.LOGS_VIEW,
      APP_PERMISSIONS.ADMIN_TOOLS,
    ],
  },
];

// ========================================
// 🎭 ROLES Y PERMISOS POR DEFECTO
// ========================================

// USER: Permisos básicos (9 permisos)
export const USER_PERMISSIONS = [
  APP_PERMISSIONS.DASHBOARD_VIEW,
  APP_PERMISSIONS.ASISTENCIAS_VIEW,
  APP_PERMISSIONS.ASISTENCIAS_REGISTRO,
  APP_PERMISSIONS.ASISTENCIAS_BREAK,
  APP_PERMISSIONS.ASISTENCIAS_ALMUERZO,
  APP_PERMISSIONS.CALENDARIO_VIEW,
  APP_PERMISSIONS.PERFIL_VIEW,
  APP_PERMISSIONS.PERFIL_EDIT,
  APP_PERMISSIONS.PERFIL_PHOTO,
];

// ADMIN: Permisos extendidos (18 permisos por defecto)
export const ADMIN_DEFAULT_PERMISSIONS = [
  ...USER_PERMISSIONS, // 9 permisos base
  APP_PERMISSIONS.DASHBOARD_STATS,
  APP_PERMISSIONS.DASHBOARD_CHARTS,
  APP_PERMISSIONS.ASISTENCIAS_EXPORT,
  APP_PERMISSIONS.REPORTES_VIEW,
  APP_PERMISSIONS.REPORTES_STATS,
  APP_PERMISSIONS.REPORTES_CHARTS,
  APP_PERMISSIONS.CALENDARIO_EVENTOS,
  APP_PERMISSIONS.NOVEDADES_VIEW,
  APP_PERMISSIONS.CONFIG_VIEW,
];

// SUPERADMIN: Todos los permisos (35 permisos)
export const SUPERADMIN_PERMISSIONS = Object.values(APP_PERMISSIONS);

// ========================================
// 🔄 CÁLCULO DINÁMICO DE ROL
// ========================================

/**
 * Calcula el appRole según la cantidad de permisos
 * @param {number} permCount - Cantidad de permisos activos
 * @returns {'SUPERADMIN' | 'ADMIN' | 'USER'}
 */
export const calculateAppRole = (permCount) => {
  if (permCount === 35) return 'SUPERADMIN';
  if (permCount >= 8 && permCount <= 34) return 'ADMIN';
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
