// 🔒 COMPONENTE PROTEGIDO POR PERMISOS
// Muestra u oculta componentes según permisos del usuario

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Button, IconButton, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

/**
 * Botón protegido por permisos
 * @param {Object} props
 * @param {string} props.permission - Permiso requerido
 * @param {string[]} props.anyPermissions - Cualquiera de estos permisos
 * @param {string[]} props.allPermissions - Todos estos permisos
 * @param {boolean} props.requireSuperAdmin - Solo SUPERADMIN
 * @param {boolean} props.hideIfDenied - Ocultar en vez de deshabilitar
 * @param {boolean} props.showDeniedMessage - Mostrar mensaje de permiso denegado
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {boolean} props.isIconButton - Usar IconButton en vez de Button
 * @param {...any} props - Resto de props del Button/IconButton
 */
export const ProtectedButton = ({
  permission,
  anyPermissions,
  allPermissions,
  requireSuperAdmin = false,
  hideIfDenied = false,
  showDeniedMessage = false,
  children,
  isIconButton = false,
  ...buttonProps
}) => {
  const { can, canAny, canAll, isSuperAdmin } = usePermissions();

  // ========================================
  // 🔍 VERIFICACIÓN DE PERMISOS
  // ========================================

  let hasAccess = true;

  // 1. Verificar si requiere SUPERADMIN
  if (requireSuperAdmin) {
    hasAccess = isSuperAdmin;
  }
  // 2. Verificar permiso único
  else if (permission) {
    hasAccess = can(permission);
  }
  // 3. Verificar cualquier permiso (OR)
  else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = canAny(anyPermissions);
  }
  // 4. Verificar todos los permisos (AND)
  else if (allPermissions && allPermissions.length > 0) {
    hasAccess = canAll(allPermissions);
  }

  // ========================================
  // 🚫 RENDERIZADO CONDICIONAL
  // ========================================

  // Ocultar completamente si no tiene acceso
  if (!hasAccess && hideIfDenied) {
    return null;
  }

  // Mostrar mensaje de permiso denegado
  if (!hasAccess && showDeniedMessage) {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedText}>🔒 Acceso restringido</Text>
      </View>
    );
  }

  // ========================================
  // 🎨 RENDERIZADO DE BOTÓN
  // ========================================

  // IconButton
  if (isIconButton) {
    return (
      <IconButton
        {...buttonProps}
        disabled={!hasAccess || buttonProps.disabled}
        style={[
          buttonProps.style,
          !hasAccess && styles.disabledButton,
        ]}
      />
    );
  }

  // Button estándar
  return (
    <Button
      {...buttonProps}
      disabled={!hasAccess || buttonProps.disabled}
      style={[
        buttonProps.style,
        !hasAccess && styles.disabledButton,
      ]}
    >
      {children}
    </Button>
  );
};

/**
 * Wrapper para proteger cualquier componente (no solo botones)
 * @param {Object} props
 * @param {string} props.permission - Permiso requerido
 * @param {string[]} props.anyPermissions - Cualquiera de estos permisos
 * @param {string[]} props.allPermissions - Todos estos permisos
 * @param {boolean} props.requireSuperAdmin - Solo SUPERADMIN
 * @param {React.ReactNode} props.children - Componente a proteger
 * @param {React.ReactNode} props.fallback - Componente a mostrar si no tiene acceso
 */
export const ProtectedComponent = ({
  permission,
  anyPermissions,
  allPermissions,
  requireSuperAdmin = false,
  children,
  fallback = null,
}) => {
  const { can, canAny, canAll, isSuperAdmin } = usePermissions();

  // Verificación de permisos
  let hasAccess = true;

  if (requireSuperAdmin) {
    hasAccess = isSuperAdmin;
  } else if (permission) {
    hasAccess = can(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = canAny(anyPermissions);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = canAll(allPermissions);
  }

  // Renderizado condicional
  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.5,
  },
  deniedContainer: {
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  deniedText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
  },
});
