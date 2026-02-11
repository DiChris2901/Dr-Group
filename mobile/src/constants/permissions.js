// 📋 SISTEMA DE PERMISOS SIMPLIFICADO - APP MÓVIL
// Versión 2.0.0 - Enero 2026
// ROL = Identificación visual | PERMISO = Control de acceso real

// ========================================
// 🎯 DEFINICIÓN DE PERMISOS (16 TOTAL)
// ========================================

export const APP_PERMISSIONS = {
  // ====================================
  // 📱 PANTALLAS INDIVIDUALES (11 permisos)
  // ====================================
  DASHBOARD: 'dashboard',                          // DashboardScreen (marcar jornada)
  SETTINGS: 'settings',                            // SettingsScreen
  NOTIFICACIONES: 'notificaciones',                // NotificacionesScreen
  PERFIL: 'perfil',                                // Editar Perfil
  CALENDARIO: 'calendario',                        // CalendarioScreen
  ADMIN_DASHBOARD: 'admin.dashboard',              // AdminDashboardScreen → Define ROL: ADMIN
  ADMIN_NOVEDADES: 'admin.novedades',              // AdminNovedadesScreen
  ADMIN_CREATE_ALERT: 'admin.create_alert',        // AdminCreateAlert
  ADMIN_NOTIFICATION_CONTROL: 'admin.notification_control', // AdminNotificationControl
  ADMIN_SETTINGS: 'admin.settings',                // AdminSettings
  USUARIOS_GESTIONAR: 'usuarios.gestionar',        // UsersScreen → Define ROL: SUPERADMIN

  // ====================================
  // 🔀 DIVIDIDOS (6 permisos) - Dos niveles de acceso
  // ====================================
  
  // ASISTENCIAS (2 permisos)
  ASISTENCIAS_PROPIAS: 'asistencias.propias',      // Ver SOLO mis registros
  ASISTENCIAS_TODOS: 'asistencias.todos',          // Ver registros de TODOS

  // NOVEDADES (1 permiso)
  NOVEDADES_REPORTAR: 'novedades.reportar',        // Reportar mis incidentes

  // REPORTES (2 permisos)
  REPORTES_PROPIOS: 'reportes.propios',            // Ver SOLO mi desempeño
  REPORTES_TODOS: 'reportes.todos',                // Ver desempeño de TODOS

  // ====================================
  // 🏢 CONSULTA (2 permisos) - Solo lectura
  // ====================================
  EMPRESAS_VER: 'empresas.ver',                    // Consultar directorio de empresas
  EMPLEADOS_VER: 'empleados.ver',                  // Consultar directorio de empleados
};

// ========================================
// 📦 CATEGORÍAS DE PERMISOS (Para UI)
// ========================================

export const PERMISSION_CATEGORIES = [
  {
    id: 'pantallas',
    name: '📱 Pantallas Generales',
    description: 'Acceso a pantallas principales',
    icon: 'view-dashboard',
    permissions: [
      APP_PERMISSIONS.DASHBOARD,
      APP_PERMISSIONS.SETTINGS,
      APP_PERMISSIONS.NOTIFICACIONES,
      APP_PERMISSIONS.PERFIL,
      APP_PERMISSIONS.CALENDARIO,
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
      APP_PERMISSIONS.REPORTES_PROPIOS,
      APP_PERMISSIONS.REPORTES_TODOS,
    ],
  },
  {
    id: 'consulta',
    name: '🏢 Consulta',
    description: 'Directorios de empresas y empleados (solo lectura)',
    icon: 'office-building',
    permissions: [
      APP_PERMISSIONS.EMPRESAS_VER,
      APP_PERMISSIONS.EMPLEADOS_VER,
    ],
  },
  {
    id: 'admin',
    name: '👑 Administrativos',
    description: 'Funciones de administración y control',
    icon: 'shield-crown',
    permissions: [
      APP_PERMISSIONS.ADMIN_DASHBOARD,
      APP_PERMISSIONS.ADMIN_NOVEDADES,
      APP_PERMISSIONS.ADMIN_CREATE_ALERT,
      APP_PERMISSIONS.ADMIN_NOTIFICATION_CONTROL,
      APP_PERMISSIONS.ADMIN_SETTINGS,
      APP_PERMISSIONS.USUARIOS_GESTIONAR,
    ],
  },
];

// ========================================
// 📊 CONSTANTES DEL SISTEMA
// ========================================

export const TOTAL_PERMISSIONS = 18; // Total de permisos en el sistema v2.1

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
