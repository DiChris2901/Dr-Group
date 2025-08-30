// 🧹 Limpieza de emergencia de compromisos huérfanos
// Ejecuta esto directamente en la consola del navegador

// Función que puedes copiar y pegar en la consola del navegador
const cleanupOrphanedCommitmentsFromBrowser = async () => {
  console.log('🧹 INICIANDO LIMPIEZA DE EMERGENCIA');
  console.log('=' .repeat(50));
  
  try {
    // Importar Firebase (asegúrate de que ya esté cargado)
    const { db } = window; // O como esté disponible en tu app
    
    if (!db) {
      console.error('❌ Base de datos no disponible. Asegúrate de estar en la página de compromisos.');
      return;
    }
    
    // Obtener compromisos problemáticos directamente
    const { collection, query, where, getDocs, doc, getDoc, deleteDoc } = firebase.firestore || window.firebase?.firestore || {};
    
    if (!collection) {
      console.error('❌ Firebase Firestore no está disponible');
      return;
    }
    
    // Buscar compromisos "Sin empresa"
    console.log('🔍 Buscando compromisos "Sin empresa"...');
    
    const orphanQuery = query(
      collection(db, 'commitments'),
      where('companyName', '==', 'Sin empresa')
    );
    
    const snapshot = await getDocs(orphanQuery);
    console.log(`📋 Encontrados ${snapshot.size} compromisos problemáticos`);
    
    if (snapshot.size === 0) {
      console.log('✅ No hay compromisos huérfanos para limpiar');
      return;
    }
    
    // Mostrar detalles
    let toDelete = [];
    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      console.log(`📝 ${data.concept} | ${data.beneficiary} | $${(data.totalAmount || 0).toLocaleString()}`);
      toDelete.push(docSnapshot.id);
    });
    
    // Confirmar eliminación
    const confirm = window.confirm(`¿Eliminar ${toDelete.length} compromisos huérfanos permanentemente?`);
    
    if (!confirm) {
      console.log('❌ Operación cancelada por el usuario');
      return;
    }
    
    // Eliminar uno por uno
    console.log('🗑️ Eliminando compromisos...');
    let deleted = 0;
    let errors = 0;
    
    for (const id of toDelete) {
      try {
        // Verificar si existe primero
        const docRef = doc(db, 'commitments', id);
        const docSnapshot = await getDoc(docRef);
        
        if (docSnapshot.exists()) {
          await deleteDoc(docRef);
          deleted++;
          console.log(`✅ ${id} eliminado`);
        } else {
          console.log(`👻 ${id} ya no existe`);
        }
      } catch (error) {
        console.error(`❌ Error eliminando ${id}:`, error);
        errors++;
      }
    }
    
    console.log(`📊 RESULTADO: ${deleted} eliminados, ${errors} errores`);
    
    // Recargar página
    if (deleted > 0) {
      console.log('🔄 Recargando página en 2 segundos...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.cleanupOrphanedCommitmentsFromBrowser = cleanupOrphanedCommitmentsFromBrowser;
}

console.log('🚀 FUNCIÓN DE LIMPIEZA DE EMERGENCIA CARGADA');
console.log('📋 Para usar, ejecuta en la consola: cleanupOrphanedCommitmentsFromBrowser()');
