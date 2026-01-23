// 🔐 HOOK DE PERMISOS - APP MÓVIL
// Lee permisos desde PermissionsApp/{uid} y provee helpers

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { isValidPermission, getAllPermissions } from '../constants/permissions';

/**
 * Hook para gestión de permisos granulares
 * @returns {Object} - Permisos, rol calculado y helpers
 */
export const usePermissions = () => {
  const { user, userProfile } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========================================
  // 📡 LISTENER REAL-TIME A PermissionsApp
  // ========================================

  useEffect(() => {
    if (!user?.uid) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listener a PermissionsApp/{uid}
    const permissionsRef = doc(db, 'PermissionsApp', user.uid);
    
    const unsubscribe = onSnapshot(
      permissionsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPermissions(data.permissions || []);
        } else {
          // Si no existe el documento, asumir permisos USER básicos
          console.warn(`⚠️ PermissionsApp/${user.uid} no existe - Asignando permisos USER`);
          setPermissions([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error al leer PermissionsApp:', err);
        setError(err.message);
        setPermissions([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // ========================================
  // 🎭 INFORMACIÓN DE ROL
  // ========================================

  /**
   * Rol calculado desde userProfile.appRole (campo en users/{uid})
   */
  const appRole = userProfile?.appRole || 'USER';

  /**
   * ¿Es SUPERADMIN? (único que puede editar permisos)
   */
  const isSuperAdmin = appRole === 'SUPERADMIN';

  /**
   * ¿Es ADMIN o superior?
   */
  const isAdmin = appRole === 'ADMIN' || appRole === 'SUPERADMIN';

  /**
   * ¿Es USER básico?
   */
  const isUser = appRole === 'USER';

  // ========================================
  // 🔍 HELPERS DE PERMISOS
  // ========================================

  /**
   * Verifica si el usuario tiene UN permiso específico
   * @param {string} permission - Permiso a verificar
   * @returns {boolean}
   */
  const can = useCallback(
    (permission) => {
      if (!permission) return false;
      if (!isValidPermission(permission)) {
        console.warn(`⚠️ Permiso inválido: ${permission}`);
        return false;
      }
      
      // SUPERADMIN siempre tiene todos los permisos
      if (isSuperAdmin) return true;

      return permissions.includes(permission);
    },
    [permissions, isSuperAdmin]
  );

  /**
   * Verifica si tiene TODOS los permisos especificados
   * @param {string[]} requiredPermissions - Array de permisos requeridos
   * @returns {boolean}
   */
  const canAll = useCallback(
    (requiredPermissions) => {
      if (!Array.isArray(requiredPermissions)) return false;
      if (requiredPermissions.length === 0) return true;
      
      // SUPERADMIN siempre tiene todos
      if (isSuperAdmin) return true;

      return requiredPermissions.every((perm) => permissions.includes(perm));
    },
    [permissions, isSuperAdmin]
  );

  /**
   * Verifica si tiene ALGUNO de los permisos especificados
   * @param {string[]} anyPermissions - Array de permisos (al menos uno)
   * @returns {boolean}
   */
  const canAny = useCallback(
    (anyPermissions) => {
      if (!Array.isArray(anyPermissions)) return false;
      if (anyPermissions.length === 0) return false;
      
      // SUPERADMIN siempre tiene todos
      if (isSuperAdmin) return true;

      return anyPermissions.some((perm) => permissions.includes(perm));
    },
    [permissions, isSuperAdmin]
  );

  /**
   * Verifica si NO tiene un permiso
   * @param {string} permission - Permiso a verificar
   * @returns {boolean}
   */
  const cannot = useCallback(
    (permission) => {
      return !can(permission);
    },
    [can]
  );

  // ========================================
  // 📊 ESTADÍSTICAS DE PERMISOS
  // ========================================

  /**
   * Cantidad de permisos activos
   */
  const permissionCount = permissions.length;

  /**
   * Porcentaje de permisos activos (de 35 totales)
   */
  const permissionPercentage = Math.round((permissionCount / 35) * 100);

  /**
   * Lista todos los permisos disponibles
   */
  const allPermissions = getAllPermissions();

  /**
   * ¿Tiene permisos activos?
   */
  const hasPermissions = permissionCount > 0;

  // ========================================
  // 🎯 RETURN OBJECT
  // ========================================

  return {
    // Datos principales
    permissions,          // Array de permisos activos
    appRole,             // 'SUPERADMIN' | 'ADMIN' | 'USER'
    loading,             // Estado de carga
    error,               // Error si ocurre

    // Verificación de roles
    isSuperAdmin,        // true si SUPERADMIN
    isAdmin,             // true si ADMIN o SUPERADMIN
    isUser,              // true si USER

    // Helpers de verificación
    can,                 // can('asistencias.view')
    canAll,              // canAll(['asistencias.view', 'reportes.view'])
    canAny,              // canAny(['asistencias.view', 'reportes.view'])
    cannot,              // cannot('usuarios.permissions')

    // Estadísticas
    permissionCount,     // Número de permisos activos
    permissionPercentage, // Porcentaje de permisos (0-100)
    hasPermissions,      // true si tiene al menos 1 permiso
    allPermissions,      // Array de todos los 35 permisos disponibles
  };
};
