// Script para limpiar compromisos duplicados
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDsjjUxFbGTkFmQlqjX5A0qBjJTk-iKkNE",
  authDomain: "dr-group-commitments.firebaseapp.com",
  projectId: "dr-group-commitments",
  storageBucket: "dr-group-commitments.firebasestorage.app",
  messagingSenderId: "644493390153",
  appId: "1:644493390153:web:1234567890abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicates() {
  try {
    console.log('🧹 Iniciando limpieza de duplicados...');
    
    // Obtener todos los compromisos
    const snapshot = await getDocs(collection(db, 'commitments'));
    const commitments = [];
    
    snapshot.forEach(doc => {
      commitments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Total compromisos encontrados: ${commitments.length}`);
    
    // Agrupar por criterios similares
    const groups = {};
    commitments.forEach(commitment => {
      const key = `${commitment.companyId}_${commitment.beneficiary}_${commitment.amount}_${commitment.concept}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(commitment);
    });
    
    // Identificar grupos con duplicados
    const duplicateGroups = Object.values(groups).filter(group => group.length > 1);
    
    console.log(`🔍 Grupos con posibles duplicados: ${duplicateGroups.length}`);
    
    let totalDeleted = 0;
    
    for (const group of duplicateGroups) {
      console.log(`\n📋 Grupo con ${group.length} compromisos:`);
      group.forEach((c, i) => {
        const date = c.dueDate ? new Date(c.dueDate.seconds * 1000).toLocaleDateString() : 'Sin fecha';
        console.log(`  ${i + 1}. ${c.concept} - ${date} (${c.id})`);
      });
      
      // Mantener solo el primero (por fecha de creación o ID)
      const sorted = group.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return a.createdAt.seconds - b.createdAt.seconds;
        }
        return a.id.localeCompare(b.id);
      });
      
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);
      
      console.log(`  ✅ Mantener: ${toKeep.concept} (${toKeep.id})`);
      console.log(`  🗑️ Eliminar: ${toDelete.length} compromisos`);
      
      // Eliminar duplicados
      for (const duplicate of toDelete) {
        try {
          await deleteDoc(doc(db, 'commitments', duplicate.id));
          totalDeleted++;
          console.log(`    ✅ Eliminado: ${duplicate.id}`);
        } catch (error) {
          console.error(`    ❌ Error eliminando ${duplicate.id}:`, error);
        }
      }
    }
    
    console.log(`\n🎉 Limpieza completada. Eliminados: ${totalDeleted} compromisos duplicados`);
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

// Solo ejecutar si es llamado directamente
if (process.argv[1].includes('cleanup-duplicates.js')) {
  cleanupDuplicates();
}
