/**
 * usePermissions Hook - Sistema Centralizado de Validación de Permisos
 * 
 * Centraliza toda la lógica de validación de permisos del sistema DR Group.
 * Reemplaza las implementaciones distribuidas en Sidebar, Taskbar y páginas individuales.
 * 
 * Soporta:
 * - Formato object: { "dashboard": true, "compromisos": true }
 * - Formato array (legacy): ["dashboard", "compromisos"]
 * - Permisos jerárquicos: "facturacion.cuentas_cobro"
 * - Super permiso "ALL"
 * - Validación de múltiples permisos
 * 
 * @example
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
 * 
 * if (hasPermission('asistencias')) {
 *   // Mostrar página de asistencias
 * }
 * 
 * if (hasAnyPermission(['dashboard', 'compromisos'])) {
 *   // Mostrar si tiene al menos uno
 * }
 */

import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { userProfile } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   * 
   * @param {string} permission - El nombre del permiso a verificar
   * @returns {boolean} - true si tiene el permiso, false en caso contrario
   * 
   * @example
   * hasPermission('dashboard') // true/false
   * hasPermission('facturacion.cuentas_cobro') // true/false
   */
  const hasPermission = (permission) => {
    // Si no hay usuario o perfil, denegar acceso
    if (!userProfile) {
      return false;
    }

    // Si no tiene permisos definidos, denegar acceso
    if (!userProfile.permissions) {
      return false;
    }
    
    // ===== FORMATO OBJECT (actual) =====
    if (typeof userProfile.permissions === 'object' && !Array.isArray(userProfile.permissions)) {
      // Super permiso "ALL" otorga acceso a todo
      if (userProfile.permissions.ALL === true) {
        return true;
      }
      
      // Verificar permiso específico
      return userProfile.permissions[permission] === true;
    }
    
    // ===== FORMATO ARRAY (legacy - retrocompatibilidad) =====
    if (Array.isArray(userProfile.permissions)) {
      // Super permiso "ALL" otorga acceso a todo
      if (userProfile.permissions.includes('ALL')) {
        return true;
      }
      
      // Verificar permiso específico
      return userProfile.permissions.includes(permission);
    }
    
    return false;
  };

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos especificados
   * 
   * @param {string[]} permissions - Array de permisos a verificar
   * @returns {boolean} - true si tiene al menos uno, false en caso contrario
   * 
   * @example
   * hasAnyPermission(['dashboard', 'compromisos']) // true si tiene alguno
   */
  const hasAnyPermission = (permissions) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Verifica si el usuario tiene TODOS los permisos especificados
   * 
   * @param {string[]} permissions - Array de permisos a verificar
   * @returns {boolean} - true si tiene todos, false en caso contrario
   * 
   * @example
   * hasAllPermissions(['dashboard', 'compromisos']) // true solo si tiene ambos
   */
  const hasAllPermissions = (permissions) => {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Verifica permisos jerárquicos para submenús
   * 
   * Si tiene el permiso padre completo, tiene acceso a todos los hijos.
   * Si tiene el permiso hijo específico, tiene acceso solo a ese hijo.
   * 
   * @param {string} parentPermission - Permiso del menú padre
   * @param {string} submenuPermission - Permiso específico del submenú (opcional)
   * @returns {boolean} - true si tiene acceso al submenú
   * 
   * @example
   * hasSubmenuPermission('facturacion', 'facturacion.cuentas_cobro')
   * // true si tiene 'facturacion' O 'facturacion.cuentas_cobro'
   */
  const hasSubmenuPermission = (parentPermission, submenuPermission = null) => {
    // Si tiene el permiso padre completo, tiene acceso a todo
    if (hasPermission(parentPermission)) {
      return true;
    }
    
    // Si tiene el permiso específico del submenú
    if (submenuPermission && hasPermission(submenuPermission)) {
      return true;
    }
    
    return false;
  };

  /**
   * Verifica si al menos un item de un menú con submenús es visible
   * 
   * Útil para determinar si mostrar el menú padre cuando tiene submenús.
   * 
   * @param {string} parentPermission - Permiso del menú padre
   * @param {Array} submenuItems - Array de items del submenú con sus permisos
   * @returns {boolean} - true si al menos un submenú es visible
   * 
   * @example
   * hasAnySubmenuVisible('facturacion', [
   *   { permission: 'facturacion.liquidaciones' },
   *   { permission: 'facturacion.cuentas_cobro' }
   * ])
   */
  const hasAnySubmenuVisible = (parentPermission, submenuItems = []) => {
    // Si tiene el permiso padre completo, mostrar grupo
    if (hasPermission(parentPermission)) {
      return true;
    }
    
    // Si tiene al menos un permiso de submenú específico
    return submenuItems.some(
      subItem => subItem.permission && hasPermission(subItem.permission)
    );
  };

  /**
   * Verifica si debe mostrar un item de menú completo (con o sin submenús)
   * 
   * @param {Object} item - Item del menú con permission y opcionalmente submenu
   * @returns {boolean} - true si el item debe mostrarse
   * 
   * @example
   * shouldShowMenuItem({
   *   permission: 'facturacion',
   *   submenu: [
   *     { permission: 'facturacion.liquidaciones' }
   *   ]
   * })
   */
  const shouldShowMenuItem = (item) => {
    if (!item) return false;

    // Si no tiene permisos requeridos, mostrar siempre
    if (!item.permission) {
      return true;
    }

    // Si tiene submenú, verificar si alguno es visible
    if (item.submenu && Array.isArray(item.submenu)) {
      return hasAnySubmenuVisible(item.permission, item.submenu);
    }

    // Si es item simple, verificar permiso directo
    return hasPermission(item.permission);
  };

  /**
   * Verifica si el usuario es un super admin con acceso total
   * 
   * @returns {boolean} - true si tiene permiso "ALL"
   */
  const isSuperAdmin = () => {
    return hasPermission('ALL');
  };

  /**
   * Obtiene el rol del usuario actual
   * 
   * @returns {string|null} - El rol del usuario o null si no está definido
   */
  const getUserRole = () => {
    return userProfile?.role || null;
  };

  /**
   * Verifica si el usuario tiene un rol específico
   * 
   * @param {string} role - El rol a verificar ('ADMIN', 'USER', etc.)
   * @returns {boolean} - true si tiene el rol
   */
  const hasRole = (role) => {
    return userProfile?.role === role;
  };

  return {
    // Funciones principales de validación
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Funciones para menús jerárquicos
    hasSubmenuPermission,
    hasAnySubmenuVisible,
    shouldShowMenuItem,
    
    // Funciones de utilidad
    isSuperAdmin,
    getUserRole,
    hasRole,
    
    // Datos del usuario (para casos especiales)
    userProfile,
  };
};

export default usePermissions;
