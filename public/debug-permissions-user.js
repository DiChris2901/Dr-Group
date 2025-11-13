/**
 * DEBUG: Verificar permisos del usuario actual
 * 
 * Abrir consola del navegador y pegar este código para ver:
 * - Formato de permisos (object/array)
 * - Lista completa de permisos
 * - Verificación específica de facturacion.cuentas_cobro
 */

(function debugUserPermissions() {
  // Obtener Firebase desde el contexto global
  const app = window.firebase?.apps?.[0];
  if (!app) {
    console.error('❌ Firebase no está inicializado');
    return;
  }

  const auth = window.firebase.auth();
  const db = window.firebase.firestore();

  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No hay usuario autenticado');
    return;
  }

  console.log('🔍 DEBUG DE PERMISOS - Usuario Actual');
  console.log('=====================================');
  console.log('👤 Usuario:', user.email);
  console.log('🆔 UID:', user.uid);
  console.log('');

  // Leer documento del usuario
  db.collection('users').doc(user.uid).get()
    .then(doc => {
      if (!doc.exists) {
        console.error('❌ Documento de usuario no encontrado');
        return;
      }

      const userData = doc.data();
      console.log('📋 Datos del Usuario:');
      console.log('  - Nombre:', userData.name || userData.displayName);
      console.log('  - Email:', userData.email);
      console.log('  - Rol:', userData.role);
      console.log('');

      console.log('🔐 PERMISOS:');
      console.log('  - Formato:', Array.isArray(userData.permissions) ? 'ARRAY (legacy)' : 'OBJECT (actual)');
      console.log('  - Total:', Array.isArray(userData.permissions) 
        ? userData.permissions.length 
        : Object.keys(userData.permissions || {}).filter(k => userData.permissions[k] === true).length);
      console.log('');

      if (Array.isArray(userData.permissions)) {
        console.log('📜 Lista de permisos (array):');
        userData.permissions.forEach(p => console.log(`  ✓ ${p}`));
        console.log('');
        console.log('❓ ¿Tiene facturacion.cuentas_cobro?', 
          userData.permissions.includes('facturacion.cuentas_cobro') ? '✅ SÍ' : '❌ NO');
      } else if (typeof userData.permissions === 'object') {
        console.log('📜 Lista de permisos (object):');
        Object.entries(userData.permissions)
          .filter(([_, value]) => value === true)
          .forEach(([key, _]) => console.log(`  ✓ ${key}`));
        console.log('');
        console.log('❓ ¿Tiene facturacion.cuentas_cobro?', 
          userData.permissions['facturacion.cuentas_cobro'] === true ? '✅ SÍ' : '❌ NO');
        
        // Verificar variaciones comunes
        console.log('');
        console.log('🔍 Verificación de variaciones:');
        console.log('  - facturacion.cuentas_cobro:', userData.permissions['facturacion.cuentas_cobro'] === true ? '✅' : '❌');
        console.log('  - facturacion.cuentas-cobro:', userData.permissions['facturacion.cuentas-cobro'] === true ? '✅' : '❌');
        console.log('  - facturacion:', userData.permissions['facturacion'] === true ? '✅' : '❌');
      } else {
        console.log('⚠️ Formato de permisos desconocido:', typeof userData.permissions);
      }

      console.log('');
      console.log('📊 Permisos RAW (copiar para análisis):');
      console.log(JSON.stringify(userData.permissions, null, 2));
    })
    .catch(error => {
      console.error('❌ Error al leer permisos:', error);
    });
})();
