/**
 * Script para corregir compromisos marcados como pagados sin pagos asociados
 * Ejecutar una sola vez después de eliminar pagos
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc,
  deleteField
} from 'firebase/firestore';

// Configuración de Firebase (usar la misma del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyCqM1vFqk41fBgcKY4A9rYl5s7MqhgpH5U",
  authDomain: "dr-group-dashboard.firebaseapp.com",
  projectId: "dr-group-dashboard",
  storageBucket: "dr-group-dashboard.appspot.com",
  messagingSenderId: "590657043597",
  appId: "1:590657043597:web:8b1c4aa5ff5f4e0c123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixOrphanedPaidCommitments() {
  console.log('🔧 Iniciando corrección de compromisos pagados sin pagos asociados...\n');
  
  try {
    // 1. Obtener todos los compromisos marcados como pagados
    console.log('📋 Consultando compromisos marcados como pagados...');
    
    const commitmentsQuery = query(
      collection(db, 'commitments'),
      where('isPaid', '==', true)
    );
    
    const commitmentsSnapshot = await getDocs(commitmentsQuery);
    console.log(`📊 Encontrados ${commitmentsSnapshot.size} compromisos marcados como pagados\n`);
    
    if (commitmentsSnapshot.size === 0) {
      console.log('✅ No hay compromisos marcados como pagados para revisar');
      return;
    }
    
    // 2. Obtener todos los pagos válidos (no 4x1000)
    console.log('💰 Consultando pagos válidos...');
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    
    const validPayments = new Set();
    paymentsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Solo contar pagos que no sean 4x1000 y que tengan commitmentId
      if (!data.is4x1000Tax && data.commitmentId) {
        validPayments.add(data.commitmentId);
      }
    });
    
    console.log(`💳 Encontrados ${validPayments.size} compromisos con pagos válidos\n`);
    
    // 3. Identificar compromisos huérfanos (marcados como pagados sin pagos)
    const orphanedCommitments = [];
    
    commitmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const commitmentId = doc.id;
      
      // Si está marcado como pagado pero no tiene pagos válidos asociados
      if ((data.isPaid || data.paid) && !validPayments.has(commitmentId)) {
        orphanedCommitments.push({
          id: commitmentId,
          concept: data.concept || data.description || 'Sin concepto',
          amount: data.amount || 0,
          companyName: data.companyName || data.company || 'Sin empresa',
          data: data
        });
      }
    });
    
    console.log(`🔍 Compromisos huérfanos encontrados: ${orphanedCommitments.length}`);
    
    if (orphanedCommitments.length === 0) {
      console.log('✅ Todos los compromisos pagados tienen pagos válidos asociados');
      return;
    }
    
    // 4. Mostrar compromisos que se van a corregir
    console.log('\n📝 Compromisos que se corregirán:');
    orphanedCommitments.forEach((commitment, index) => {
      console.log(`   ${index + 1}. ${commitment.concept}`);
      console.log(`      Empresa: ${commitment.companyName}`);
      console.log(`      Monto: $${commitment.amount.toLocaleString()}`);
      console.log(`      ID: ${commitment.id}\n`);
    });
    
    // 5. Corregir cada compromiso huérfano
    console.log('🔧 Iniciando corrección de compromisos...\n');
    
    let correctedCount = 0;
    let errorCount = 0;
    
    for (const commitment of orphanedCommitments) {
      try {
        console.log(`🔄 Corrigiendo: ${commitment.concept}`);
        
        const commitmentRef = doc(db, 'commitments', commitment.id);
        await updateDoc(commitmentRef, {
          isPaid: false,
          paid: false,
          paymentDate: deleteField(),
          paidAt: deleteField(),
          paymentAmount: deleteField(),
          paymentId: deleteField(),
          interestPaid: deleteField(),
          paymentMethod: deleteField(),
          paymentReference: deleteField(),
          paymentNotes: deleteField(),
          receiptUrl: deleteField(),
          receiptUrls: deleteField(),
          receiptMetadata: deleteField(),
          updatedAt: new Date()
        });
        
        correctedCount++;
        console.log(`   ✅ Corregido exitosamente\n`);
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error corrigiendo ${commitment.concept}:`, error.message);
        console.log(`   🔍 ID del compromiso: ${commitment.id}\n`);
      }
    }
    
    // 6. Resumen final
    console.log('📊 RESUMEN DE CORRECCIÓN:');
    console.log(`   ✅ Compromisos corregidos: ${correctedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📋 Total procesados: ${orphanedCommitments.length}`);
    
    if (correctedCount > 0) {
      console.log('\n🎉 Corrección completada exitosamente!');
      console.log('📱 Los compromisos ahora aparecerán como "no pagados" en la interfaz');
    }
    
    if (errorCount > 0) {
      console.log('\n⚠️ Algunos compromisos no pudieron corregirse');
      console.log('🔍 Revisa los errores arriba para más detalles');
    }
    
  } catch (error) {
    console.error('❌ Error general en la corrección:', error);
  }
}

// Ejecutar el script
fixOrphanedPaidCommitments()
  .then(() => {
    console.log('\n🏁 Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
