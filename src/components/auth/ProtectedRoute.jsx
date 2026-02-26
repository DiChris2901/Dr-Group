import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import PageSkeleton from '../common/PageSkeleton';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import useActivityLogs from '../../hooks/useActivityLogs';

/**
 * ProtectedRoute - Componente de protección de rutas con sistema de permisos centralizado
 * 
 * Valida que el usuario tenga los permisos necesarios para acceder a una ruta.
 * Si no tiene permisos, redirige a /unauthorized y registra el intento en logs de auditoría.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a proteger
 * @param {string} props.requiredPermission - Permiso único requerido (ej: 'usuarios')
 * @param {string[]} props.requiredPermissions - Array de permisos (requiere AL MENOS UNO)
 * @param {boolean} props.requireAll - Si es true y se pasa array, requiere TODOS los permisos
 * @param {string} props.fallbackPath - Ruta de redirección personalizada (default: '/unauthorized')
 * @param {string} props.redirectToLogin - Si es true, redirige a /login si no está autenticado
 * 
 * @example
 * // Permiso único
 * <ProtectedRoute requiredPermission="usuarios">
 *   <UserManagementPage />
 * </ProtectedRoute>
 * 
 * @example
 * // Al menos uno de varios permisos
 * <ProtectedRoute requiredPermissions={['dashboard', 'compromisos']}>
 *   <HomePage />
 * </ProtectedRoute>
 * 
 * @example
 * // Requiere todos los permisos del array
 * <ProtectedRoute requiredPermissions={['admin', 'usuarios']} requireAll={true}>
 *   <AdvancedAdminPage />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermission = null,
  requiredPermissions = null,
  requireAll = false,
  fallbackPath = '/unauthorized',
  redirectToLogin = false
}) => {
  const location = useLocation();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { logActivity } = useActivityLogs();

  // ===== VALIDACIONES =====
  
  // 1. Mostrar loading mientras se autentica O se carga el perfil
  if (authLoading || (currentUser && !userProfile)) {
    return <PageSkeleton variant="default" kpiCount={4} />;
  }

  // 2. Si no hay usuario autenticado
  if (!currentUser) {
    // Si se configuró para redirigir al login
    if (redirectToLogin) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Por defecto, redirigir a unauthorized
    return <Navigate to={fallbackPath} replace />;
  }

  // 3. Determinar si tiene acceso según el tipo de validación
  let hasAccess = false;
  let permissionChecked = '';

  // CASO A: Permiso único
  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
    permissionChecked = requiredPermission;
  }
  // CASO B: Array de permisos
  else if (requiredPermissions && Array.isArray(requiredPermissions)) {
    if (requireAll) {
      // Requiere TODOS los permisos
      hasAccess = hasAllPermissions(requiredPermissions);
      permissionChecked = requiredPermissions.join(' + ');
    } else {
      // Requiere AL MENOS UNO
      hasAccess = hasAnyPermission(requiredPermissions);
      permissionChecked = requiredPermissions.join(' o ');
    }
  }
  // CASO C: Sin permisos especificados (permitir acceso - útil para rutas públicas)
  else {
    hasAccess = true;
  }

  // 4. Si NO tiene acceso, registrar intento y redirigir
  if (!hasAccess) {
    // Log de auditoría (intento de acceso no autorizado)
    logActivity(
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'route',
      location.pathname,
      {
        requiredPermission: permissionChecked,
        attemptedPath: location.pathname
      },
      currentUser?.uid,
      currentUser?.displayName,
      currentUser?.email
    );

    // Redirigir a página de acceso denegado con información del permiso
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ 
          from: location.pathname,
          requiredPermission: permissionChecked 
        }} 
        replace 
      />
    );
  }

  // 5. Si tiene acceso, mostrar el contenido protegido
  return children;
};

export default ProtectedRoute;
