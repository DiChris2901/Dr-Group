import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ========================================
// 📋 DEFINICIÓN DE PERMISOS v2.0 (14 PERMISOS)
// ========================================

// Permisos básicos para usuarios normales (9 permisos)
const USER_PERMISSIONS = [
  // Básicos (6)
  'dashboard',
  'calendario',
  'historial',
  'perfil',
  'configuracion',
  'notificaciones',
  // Divididos - Solo "propias/propios/reportar" (3)
  'asistencias.propias',
  'reportes.propios',
  'novedades.reportar'
]; // 9 permisos

// Permisos para administradores (12 permisos - no tiene usuarios.gestionar)
const ADMIN_DEFAULT_PERMISSIONS = [
  // Básicos (6)
  'dashboard',
  'calendario',
  'historial',
  'perfil',
  'configuracion',
  'notificaciones',
  // Divididos - Nivel "todos/gestionar" (3)
  'asistencias.todos',
  'reportes.todos',
  'novedades.gestionar',
  // Admin (1 de 2 - sin usuarios.gestionar)
  'admin.dashboard'
]; // 10 permisos

// SUPERADMIN - TODOS los permisos (16 permisos)
const SUPERADMIN_PERMISSIONS = [
  // Básicos (6)
  'dashboard',
  'calendario',
  'historial',
  'perfil',
  'configuracion',
  'notificaciones',
  // Divididos (6)
  'asistencias.propias',
  'asistencias.todos',
  'novedades.reportar',
  'novedades.gestionar',
  'reportes.propios',
  'reportes.todos',
  // Admin (2)
  'admin.dashboard',
  'usuarios.gestionar'
]; // 14 permisos

// ========================================
// 🚀 FUNCIÓN DE MIGRACIÓN
// ========================================

export async function migratePermissionsApp(onLog) {
  const log = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (onLog) onLog(message, type);
  };

  const stats = { total: 0, superadmin: 0, admin: 0, user: 0, errors: 0 };

  try {
    log('🔄 Iniciando migración de permisos...', 'info');

    // Buscar SOLO el usuario daruedagu@gmail.com
    const usersSnapshot = await getDocs(collection(db, 'users'));
    log(`📊 Buscando usuario daruedagu@gmail.com...`, 'info');

    let userFound = false;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const email = userData.email || '';

      // SOLO procesar daruedagu@gmail.com
      if (email === 'daruedagu@gmail.com') {
        userFound = true;
        const uid = userDoc.id;
        const displayName = userData.name || userData.displayName || email;

        stats.total++;

        try {
          // Asignar TODOS los 14 permisos (SUPERADMIN)
          const permissions = SUPERADMIN_PERMISSIONS;
          const appRole = 'SUPERADMIN';
          stats.superadmin++;

          log(`🔍 Usuario encontrado: ${displayName}`, 'info');
          log(`📋 Asignando ${permissions.length} permisos...`, 'info');

          // Crear documento en PermissionsApp
          await setDoc(doc(db, 'PermissionsApp', uid), {
            permissions,
            lastUpdated: new Date(),
            updatedBy: 'migration-script-v2.0'
          });

          log(`✅ PermissionsApp/${uid} creado`, 'success');

          // Actualizar campo appRole en users
          await updateDoc(doc(db, 'users', uid), {
            appRole
          });

          log(`✅ users/${uid}/appRole actualizado a SUPERADMIN`, 'success');
          log(`🎉 ${displayName} ahora tiene acceso completo (14 permisos)`, 'success');

        } catch (error) {
          stats.errors++;
          log(`❌ Error procesando ${displayName}: ${error.message}`, 'error');
        }
        break; // Salir del loop después de procesar el usuario
      }
    }

    if (!userFound) {
      log(`❌ Usuario daruedagu@gmail.com no encontrado`, 'error');
      return { success: false, error: 'Usuario no encontrado', stats };
    }

    // Resumen final
    log('', 'info');
    log('═══════════════════════════════════════', 'info');
    log('🎯 MIGRACIÓN COMPLETADA', 'success');
    log('═══════════════════════════════════════', 'info');
    log(`✅ Usuario: daruedagu@gmail.com`, 'success');
    log(`👑 Rol: SUPERADMIN`, 'success');
    log(`📋 Permisos asignados: 14/14`, 'success');
    log('', 'info');
    log('🚀 Ahora puedes:','info');
    log('1. Recargar la app móvil', 'info');
    log('2. Acceder a AdminDashboard → Usuarios', 'info');
    log('3. Gestionar permisos de otros usuarios', 'info');
    log('═══════════════════════════════════════', 'info');

    return { success: true, stats };

  } catch (error) {
    log(`❌ Error fatal en la migración: ${error.message}`, 'error');
    return { success: false, error: error.message, stats };
  }
}
