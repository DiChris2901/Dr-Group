import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../utils/userPermissions';

/**
 * Hook para verificar permisos del usuario en tiempo real
 */
export const useUserPermissions = () => {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAllPermissions = async () => {
      if (!currentUser?.email) {
        setPermissions({});
        setLoading(false);
        return;
      }

      setLoading(true);
      const userPermissions = {};

      try {
        // Verificar todos los permisos posibles
        const permissionChecks = Object.values(PERMISSIONS).map(async (permission) => {
          const hasAccess = await hasPermission(currentUser.email, permission);
          return { permission, hasAccess };
        });

        const results = await Promise.all(permissionChecks);
        
        results.forEach(({ permission, hasAccess }) => {
          userPermissions[permission] = hasAccess;
        });

        setPermissions(userPermissions);
        console.log('✅ Permisos del usuario cargados:', userPermissions);
      } catch (error) {
        console.error('❌ Error verificando permisos:', error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    checkAllPermissions();
  }, [currentUser?.email]);

  // Función helper para verificar un permiso específico
  const hasUserPermission = (permission) => {
    return permissions[permission] === true;
  };

  // Función para verificar si es administrador
  const isAdmin = () => {
    return hasUserPermission(PERMISSIONS.ADMIN_ACCESS);
  };

  return {
    permissions,
    hasUserPermission,
    isAdmin,
    loading
  };
};

export default useUserPermissions;
