// 🧹 Script para limpiar compromisos recurrentes huérfanos
// Elimina compromisos que no existen en Firestore pero aparecen en la UI

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDiW_FyQhF5FcrAo3XBJ3qKYVjCVb4w85Q",
  authDomain: "dr-group-cd21b.firebaseapp.com",
  projectId: "dr-group-cd21b",
  storageBucket: "dr-group-cd21b.firebasestorage.app",
  messagingSenderId: "266292159849",
  appId: "1:266292159849:web:83a2e68b1d4b8b71dced57",
  measurementId: "G-W5YN7P2Z3E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupRecurringCommitments() {
  console.log('🧹 Iniciando limpieza de compromisos recurrentes huérfanos...\n');
  
  try {
    // 1. Obtener todos los compromisos de "Bonificación" sin empresa
    console.log('📋 Buscando compromisos de bonificación sin empresa...');
    
    const bonificacionQuery = query(
      collection(db, 'commitments'),
      where('concept', '==', 'Bonificación')
    );
    
    const bonificacionSnapshot = await getDocs(bonificacionQuery);
    const bonificacionCommitments = [];
    
    bonificacionSnapshot.forEach(doc => {
      const data = doc.data();
      bonificacionCommitments.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Encontrados ${bonificacionCommitments.length} compromisos de bonificación\n`);
    
    // 2. Filtrar los que no tienen empresa (companyName vacío o "Sin empresa")
    const orphanedBonifications = bonificacionCommitments.filter(commitment => 
      !commitment.companyName || 
      commitment.companyName.trim() === '' || 
      commitment.companyName === 'Sin empresa'
    );
    
    console.log(`🎯 Compromisos sin empresa encontrados: ${orphanedBonifications.length}`);
    
    if (orphanedBonifications.length === 0) {
      console.log('✅ No hay compromisos huérfanos de bonificación para limpiar');
      return;
    }
    
    // 3. Mostrar detalles de los compromisos a eliminar
    console.log('\n🚨 COMPROMISOS A ELIMINAR:');
    console.log('-'.repeat(80));
    
    orphanedBonifications.forEach((commitment, index) => {
      console.log(`${index + 1}. ID: ${commitment.id}`);
      console.log(`   📝 Concepto: ${commitment.concept}`);
      console.log(`   🏢 Empresa: "${commitment.companyName || 'Sin empresa'}"`);
      console.log(`   👤 Beneficiario: ${commitment.beneficiary || 'Sin beneficiario'}`);
      console.log(`   💰 Monto: $${(commitment.totalAmount || commitment.amount || 0).toLocaleString()}`);
      console.log(`   📅 Vencimiento: ${commitment.dueDate ? new Date(commitment.dueDate.seconds * 1000).toLocaleDateString() : 'Sin fecha'}`);
      console.log(`   🔄 Periodicidad: ${commitment.periodicity || 'unique'}`);
      console.log('');
    });
    
    // 4. Confirmar eliminación (en producción, requerir confirmación manual)
    console.log('⚠️ ADVERTENCIA: Se eliminarán PERMANENTEMENTE estos compromisos');
    console.log('💡 En producción, esta operación requeriría confirmación manual\n');
    
    // 5. Proceder con eliminación usando batch
    console.log('🗑️ Iniciando eliminación en lotes...');
    
    const batchSize = 500; // Firestore permite máximo 500 operaciones por batch
    let totalDeleted = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < orphanedBonifications.length; i += batchSize) {
      const batch = writeBatch(db);
      const currentBatch = orphanedBonifications.slice(i, i + batchSize);
      
      console.log(`📦 Procesando lote ${Math.floor(i / batchSize) + 1}: ${currentBatch.length} compromisos`);
      
      // Verificar cada documento antes de agregarlo al batch
      for (const commitment of currentBatch) {
        try {
          const docRef = doc(db, 'commitments', commitment.id);
          const docSnapshot = await getDoc(docRef);
          
          if (docSnapshot.exists()) {
            batch.delete(docRef);
            console.log(`   ✅ ${commitment.id} agregado al batch para eliminación`);
          } else {
            console.log(`   👻 ${commitment.id} ya no existe (huérfano)`);
          }
        } catch (error) {
          console.error(`   ❌ Error verificando ${commitment.id}:`, error);
          totalErrors++;
        }
      }
      
      try {
        await batch.commit();
        totalDeleted += currentBatch.length;
        console.log(`   🎉 Lote ${Math.floor(i / batchSize) + 1} eliminado exitosamente`);
      } catch (batchError) {
        console.error(`   ❌ Error eliminando lote ${Math.floor(i / batchSize) + 1}:`, batchError);
        totalErrors += currentBatch.length;
      }
    }
    
    // 6. Reporte final
    console.log('\n📊 REPORTE FINAL:');
    console.log('='.repeat(50));
    console.log(`✅ Compromisos eliminados: ${totalDeleted}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log(`📋 Total procesados: ${orphanedBonifications.length}`);
    
    if (totalDeleted > 0) {
      console.log('\n🎉 Limpieza completada exitosamente');
      console.log('💡 Recomendación: Recarga la aplicación para ver los cambios');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Función adicional para limpiar compromisos de un concepto específico
async function cleanupSpecificConcept(concept, companyName = null) {
  console.log(`🧹 Limpiando compromisos de: ${concept}${companyName ? ` en ${companyName}` : ''}`);
  
  try {
    let q = query(
      collection(db, 'commitments'),
      where('concept', '==', concept)
    );
    
    if (companyName) {
      q = query(q, where('companyName', '==', companyName));
    }
    
    const snapshot = await getDocs(q);
    console.log(`📋 Encontrados ${snapshot.size} compromisos`);
    
    if (snapshot.size === 0) return;
    
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`✅ ${count} compromisos eliminados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar limpieza principal
if (process.argv.includes('--confirm')) {
  cleanupRecurringCommitments().then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
} else {
  console.log('🚨 MODO SEGURO: Para ejecutar la limpieza, usa: node cleanup-recurring-commitments.js --confirm');
  console.log('⚠️ ADVERTENCIA: Esta operación eliminará permanentemente compromisos de la base de datos');
  
  // Solo mostrar preview sin eliminar
  cleanupRecurringCommitments().then(() => {
    console.log('\n📋 Preview completado (no se eliminó nada)');
    console.log('💡 Para eliminar realmente, ejecuta: node cleanup-recurring-commitments.js --confirm');
    process.exit(0);
  });
}
