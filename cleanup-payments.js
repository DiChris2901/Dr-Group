// Script para limpiar datos de prueba de la colección payments
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';

// Configuración de Firebase (misma que en tu proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyBVT3zE5j8U5JJQp4fLKj4VQGn_dYlKqKo",
  authDomain: "dr-group-dashboard.firebaseapp.com",
  projectId: "dr-group-dashboard",
  storageBucket: "dr-group-dashboard.appspot.com",
  messagingSenderId: "877584017413",
  appId: "1:877584017413:web:c5821234567890abcdef"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupPayments() {
  console.log('🧹 Iniciando limpieza de datos de pagos...');
  
  try {
    // Obtener todos los documentos de la colección payments
    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(paymentsRef);
    
    if (snapshot.empty) {
      console.log('✅ No hay datos de pagos para eliminar.');
      return;
    }
    
    console.log(`📊 Encontrados ${snapshot.size} registros de pagos para eliminar.`);
    
    // Usar batch para eliminar múltiples documentos eficientemente
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    snapshot.forEach((document) => {
      currentBatch.delete(doc(db, 'payments', document.id));
      operationCount++;
      
      // Firestore limita a 500 operaciones por batch
      if (operationCount === 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });
    
    // Agregar el último batch si tiene operaciones
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Ejecutar todos los batches
    console.log(`🚀 Ejecutando ${batches.length} batch(es) de eliminación...`);
    
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} completado.`);
    }
    
    console.log('🎉 ¡Limpieza de pagos completada exitosamente!');
    console.log(`🗑️ Total de registros eliminados: ${snapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Función para limpiar también compromisos de prueba si es necesario
async function cleanupCommitments() {
  console.log('🧹 ¿Eliminar también compromisos de prueba? (comentar para activar)');
  
  // Descomenta las siguientes líneas si también quieres limpiar compromisos
  /*
  try {
    const commitmentsRef = collection(db, 'commitments');
    const snapshot = await getDocs(commitmentsRef);
    
    if (snapshot.empty) {
      console.log('✅ No hay compromisos para eliminar.');
      return;
    }
    
    console.log(`📊 Encontrados ${snapshot.size} compromisos para eliminar.`);
    
    const batch = writeBatch(db);
    snapshot.forEach((document) => {
      batch.delete(doc(db, 'commitments', document.id));
    });
    
    await batch.commit();
    console.log('🎉 ¡Compromisos eliminados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error eliminando compromisos:', error);
  }
  */
}

// Ejecutar limpieza
async function main() {
  console.log('🔥 DR Group Dashboard - Limpiador de Datos de Prueba');
  console.log('================================================');
  
  await cleanupPayments();
  // await cleanupCommitments(); // Descomenta si quieres limpiar compromisos también
  
  console.log('✨ Proceso completado. Puedes cerrar esta ventana.');
  process.exit(0);
}

// Ejecutar script
main().catch(console.error);
