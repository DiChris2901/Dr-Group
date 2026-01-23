// 📝 EJEMPLO DE USO DEL SISTEMA RBAC
// Este archivo muestra cómo aplicar permisos en componentes reales

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedButton, ProtectedComponent } from '../components/ProtectedButton';
import { APP_PERMISSIONS } from '../constants/permissions';

/**
 * EJEMPLO 1: Botón de Exportar Excel
 * Solo visible si tiene permiso 'asistencias.export'
 */
export function ExportExcelButton() {
  const handleExport = () => {
    console.log('Exportando Excel...');
    // Lógica de exportación
  };

  return (
    <ProtectedButton
      permission={APP_PERMISSIONS.ASISTENCIAS_EXPORT}
      hideIfDenied={true}  // Ocultar si no tiene permiso
      mode="contained"
      icon="file-excel"
      onPress={handleExport}
    >
      Exportar Excel
    </ProtectedButton>
  );
}

/**
 * EJEMPLO 2: Botón de Crear Novedad
 * Deshabilitado si no tiene permiso, pero visible
 */
export function CreateNovedadButton() {
  const handleCreate = () => {
    console.log('Creando novedad...');
  };

  return (
    <ProtectedButton
      permission={APP_PERMISSIONS.NOVEDADES_CREATE}
      hideIfDenied={false}  // Mantener visible pero deshabilitado
      mode="contained"
      icon="plus"
      onPress={handleCreate}
    >
      Crear Novedad
    </ProtectedButton>
  );
}

/**
 * EJEMPLO 3: Sección de Administración
 * Solo visible para SUPERADMIN
 */
export function AdminSection() {
  return (
    <ProtectedComponent requireSuperAdmin={true}>
      <View style={styles.section}>
        <Text variant="titleMedium">🔐 Panel de Administración</Text>
        <Text variant="bodySmall">Solo SUPERADMIN puede ver esto</Text>
      </View>
    </ProtectedComponent>
  );
}

/**
 * EJEMPLO 4: Verificación Manual con Hook
 */
export function ManualPermissionCheck() {
  const { can, canAll, canAny, isSuperAdmin, permissionCount } = usePermissions();

  return (
    <View style={styles.section}>
      {/* Verificar permiso único */}
      {can(APP_PERMISSIONS.REPORTES_VIEW) && (
        <Button mode="outlined" onPress={() => console.log('Ver reportes')}>
          Ver Reportes
        </Button>
      )}

      {/* Verificar todos los permisos (AND) */}
      {canAll([APP_PERMISSIONS.NOVEDADES_CREATE, APP_PERMISSIONS.NOVEDADES_EDIT]) && (
        <Button mode="outlined" onPress={() => console.log('Administrar novedades')}>
          Administrar Novedades
        </Button>
      )}

      {/* Verificar cualquier permiso (OR) */}
      {canAny([APP_PERMISSIONS.REPORTES_VIEW, APP_PERMISSIONS.REPORTES_STATS]) && (
        <Button mode="outlined" onPress={() => console.log('Ver estadísticas')}>
          Estadísticas
        </Button>
      )}

      {/* Verificar rol SUPERADMIN */}
      {isSuperAdmin && (
        <Button mode="contained" onPress={() => console.log('Gestionar usuarios')}>
          Gestionar Usuarios
        </Button>
      )}

      {/* Mostrar información de permisos */}
      <Text variant="bodySmall" style={{ marginTop: 16 }}>
        Tienes {permissionCount} permisos activos de 35 totales
      </Text>
    </View>
  );
}

/**
 * EJEMPLO 5: IconButton Protegido
 */
export function ProtectedIconButtonExample() {
  const handleDelete = () => {
    console.log('Eliminando novedad...');
  };

  return (
    <ProtectedButton
      permission={APP_PERMISSIONS.NOVEDADES_DELETE}
      isIconButton={true}
      icon="delete"
      onPress={handleDelete}
      hideIfDenied={true}
    />
  );
}

/**
 * EJEMPLO 6: Verificación Condicional Compleja
 */
export function ComplexPermissionExample() {
  const { can, isAdmin, isSuperAdmin } = usePermissions();

  // Lógica compleja de permisos
  const canManageNovedades = 
    isSuperAdmin || 
    (isAdmin && can(APP_PERMISSIONS.NOVEDADES_EDIT));

  const canExportData = 
    can(APP_PERMISSIONS.ASISTENCIAS_EXPORT) || 
    can(APP_PERMISSIONS.REPORTES_EXPORT);

  return (
    <View style={styles.section}>
      {canManageNovedades && (
        <Button mode="contained" onPress={() => console.log('Gestionar novedades')}>
          Gestionar Novedades
        </Button>
      )}

      {canExportData && (
        <Button mode="outlined" onPress={() => console.log('Exportar datos')}>
          Exportar Datos
        </Button>
      )}
    </View>
  );
}

/**
 * EJEMPLO 7: Fallback Personalizado
 */
export function PermissionWithFallback() {
  return (
    <ProtectedComponent
      permission={APP_PERMISSIONS.USUARIOS_VIEW}
      fallback={
        <View style={styles.deniedContainer}>
          <Text variant="bodyMedium">🔒 No tienes acceso a esta sección</Text>
          <Text variant="bodySmall" style={{ color: '#757575', marginTop: 4 }}>
            Contacta a un administrador para solicitar permisos
          </Text>
        </View>
      }
    >
      <View style={styles.section}>
        <Text variant="titleMedium">👥 Lista de Usuarios</Text>
        {/* Contenido de usuarios */}
      </View>
    </ProtectedComponent>
  );
}

/**
 * EJEMPLO 8: Múltiples Niveles de Permisos
 */
export function MultiLevelPermissions() {
  const { can, canAll } = usePermissions();

  // Nivel 1: Ver novedades
  const canViewNovedades = can(APP_PERMISSIONS.NOVEDADES_VIEW);

  // Nivel 2: Crear novedades
  const canCreateNovedades = 
    canViewNovedades && can(APP_PERMISSIONS.NOVEDADES_CREATE);

  // Nivel 3: Administrar novedades completo
  const canManageNovedades = canAll([
    APP_PERMISSIONS.NOVEDADES_VIEW,
    APP_PERMISSIONS.NOVEDADES_CREATE,
    APP_PERMISSIONS.NOVEDADES_EDIT,
    APP_PERMISSIONS.NOVEDADES_DELETE,
  ]);

  return (
    <View style={styles.section}>
      {canViewNovedades && (
        <Button mode="outlined" onPress={() => console.log('Ver')}>
          Ver Novedades
        </Button>
      )}

      {canCreateNovedades && (
        <Button mode="outlined" onPress={() => console.log('Crear')}>
          Crear Novedad
        </Button>
      )}

      {canManageNovedades && (
        <Button mode="contained" onPress={() => console.log('Administrar')}>
          Administración Completa
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    gap: 12,
  },
  deniedContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    alignItems: 'center',
  },
});

// ========================================
// 💡 MEJORES PRÁCTICAS
// ========================================

/**
 * ✅ DO - Buenas prácticas:
 * 
 * 1. Usar hideIfDenied={true} para funcionalidades opcionales
 * 2. Usar hideIfDenied={false} para mostrar que la función existe pero no está disponible
 * 3. Usar requireSuperAdmin para funciones administrativas críticas
 * 4. Combinar can() con lógica de roles para permisos complejos
 * 5. Memoizar verificaciones de permisos si son costosas
 * 6. Usar ProtectedComponent para secciones completas
 * 7. Proporcionar fallbacks informativos
 */

/**
 * ❌ DON'T - Malas prácticas:
 * 
 * 1. No hardcodear roles en lugar de usar permisos
 * 2. No verificar permisos en el backend (siempre validar en Firestore rules)
 * 3. No olvidar actualizar permisos al agregar nuevas funcionalidades
 * 4. No usar verificaciones complejas en renders frecuentes sin useMemo
 * 5. No mostrar mensajes técnicos de permisos al usuario final
 */

// ========================================
// 📚 RECURSOS ADICIONALES
// ========================================

/**
 * - Hook usePermissions: mobile/src/hooks/usePermissions.js
 * - Constantes de permisos: mobile/src/constants/permissions.js
 * - Componentes protegidos: mobile/src/components/ProtectedButton.js
 * - Pantalla de gestión: mobile/src/screens/admin/UsersScreen.js
 * - Documentación completa: mobile/RBAC_SYSTEM_GUIDE.md
 */
