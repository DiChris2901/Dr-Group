import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ========================================
// 📋 DEFINICIÓN DE PERMISOS
// ========================================

const USER_PERMISSIONS = [
  'dashboard.view',
  'asistencias.view',
  'asistencias.registro',
  'reportes.view',
  'calendario.view',
  'novedades.view',
  'perfil.view',
  'perfil.edit',
  'notificaciones.view'
]; // 9 permisos

const ADMIN_DEFAULT_PERMISSIONS = [
  // Dashboard (3)
  'dashboard.view',
  'dashboard.stats',
  'dashboard.charts',
  // Asistencias (5)
  'asistencias.view',
  'asistencias.registro',
  'asistencias.break',
  'asistencias.almuerzo',
  'asistencias.export',
  // Reportes (4)
  'reportes.view',
  'reportes.stats',
  'reportes.charts',
  'reportes.export',
  // Calendario (2)
  'calendario.view',
  'calendario.eventos',
  // Novedades (2)
  'novedades.view',
  'novedades.create',
  // Usuarios (1) - Solo ver, no gestionar permisos
  'usuarios.view',
  // Config (1)
  'config.tema'
]; // 18 permisos

const SUPERADMIN_PERMISSIONS = [
  // Dashboard (3)
  'dashboard.view',
  'dashboard.stats',
  'dashboard.charts',
  // Asistencias (5)
  'asistencias.view',
  'asistencias.registro',
  'asistencias.break',
  'asistencias.almuerzo',
  'asistencias.export',
  // Reportes (4)
  'reportes.view',
  'reportes.stats',
  'reportes.charts',
  'reportes.export',
  // Calendario (3)
  'calendario.view',
  'calendario.eventos',
  'calendario.festivos',
  // Novedades (4)
  'novedades.view',
  'novedades.create',
  'novedades.edit',
  'novedades.delete',
  // Usuarios (4)
  'usuarios.view',
  'usuarios.permissions',
  'usuarios.create',
  'usuarios.edit',
  // Config (3)
  'config.tema',
  'config.notificaciones',
  'config.firebase',
  // Perfil (2)
  'perfil.view',
  'perfil.edit',
  // Notificaciones (2)
  'notificaciones.view',
  'notificaciones.send',
  // Avanzado (5)
  'avanzado.firestore',
  'avanzado.storage',
  'avanzado.functions',
  'avanzado.analytics',
  'avanzado.logs'
]; // 35 permisos

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

    // Leer todos los usuarios
    const usersSnapshot = await getDocs(collection(db, 'users'));
    log(`📊 Total de usuarios encontrados: ${usersSnapshot.size}`, 'info');

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      const email = userData.email || 'Sin email';
      const displayName = userData.name || userData.displayName || email;
      const currentRole = userData.role || 'EMPLEADO';

      stats.total++;

      try {
        // Determinar permisos según el rol del dashboard
        let permissions = [];
        let appRole = 'USER';

        // Casos especiales: SUPERADMIN
        if (email === 'daruedagu@gmail.com') {
          permissions = SUPERADMIN_PERMISSIONS;
          appRole = 'SUPERADMIN';
          stats.superadmin++;
        }
        // ADMIN del dashboard → ADMIN en app
        else if (currentRole === 'ADMIN') {
          permissions = ADMIN_DEFAULT_PERMISSIONS;
          appRole = 'ADMIN';
          stats.admin++;
        }
        // EMPLEADO del dashboard → USER en app
        else {
          permissions = USER_PERMISSIONS;
          appRole = 'USER';
          stats.user++;
        }

        // Crear documento en PermissionsApp
        await setDoc(doc(db, 'PermissionsApp', uid), {
          permissions,
          lastUpdated: new Date(),
          updatedBy: 'migration-script'
        });

        // Actualizar campo appRole en users
        await updateDoc(doc(db, 'users', uid), {
          appRole
        });

        log(`✅ ${displayName} → ${appRole} (${permissions.length} permisos)`, 'success');

      } catch (error) {
        stats.errors++;
        log(`❌ Error procesando ${displayName}: ${error.message}`, 'error');
      }
    }

    // Resumen final
    log('', 'info');
    log('═══════════════════════════════════════', 'info');
    log('📊 RESUMEN DE MIGRACIÓN', 'success');
    log('═══════════════════════════════════════', 'info');
    log(`✅ Total de usuarios procesados: ${stats.total}`, 'success');
    log(`👑 SUPERADMIN: ${stats.superadmin}`, 'success');
    log(`🔧 ADMIN: ${stats.admin}`, 'success');
    log(`👤 USER: ${stats.user}`, 'success');
    if (stats.errors > 0) {
      log(`⚠️ Errores: ${stats.errors}`, 'warning');
    }
    log('═══════════════════════════════════════', 'info');

    return { success: true, stats };

  } catch (error) {
    log(`❌ Error fatal en la migración: ${error.message}`, 'error');
    return { success: false, error: error.message, stats };
  }
}
