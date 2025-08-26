// Script temporal para actualizar pagos existentes con datos de beneficiarios
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjJGgzK2PLHwG-Lb_cKhayg-9M4BHa-ZE",
  authDomain: "dr-group-dashboard-63ec0.firebaseapp.com",
  projectId: "dr-group-dashboard-63ec0",
  storageBucket: "dr-group-dashboard-63ec0.firebasestorage.app",
  messagingSenderId: "439897096444",
  appId: "1:439897096444:web:29ba7b0e8fe4a81db8a16c",
  measurementId: "G-1BNTLLXZ70"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updatePaymentsWithBeneficiaries() {
  try {
    console.log('🔍 Buscando pagos para actualizar...');
    
    // Obtener todos los pagos
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    console.log(`📋 Encontrados ${paymentsSnapshot.docs.length} pagos`);
    
    let updateCount = 0;
    
    for (const paymentDoc of paymentsSnapshot.docs) {
      const payment = paymentDoc.data();
      
      // Skip si ya tiene provider o beneficiary
      if (payment.provider || payment.beneficiary) {
        console.log(`✅ Pago ${paymentDoc.id} ya tiene beneficiario`);
        continue;
      }
      
      // Obtener el compromiso relacionado
      if (!payment.commitmentId) {
        console.log(`⚠️ Pago ${paymentDoc.id} no tiene commitmentId`);
        continue;
      }
      
      try {
        const commitmentDoc = await getDoc(doc(db, 'commitments', payment.commitmentId));
        
        if (!commitmentDoc.exists()) {
          console.log(`⚠️ Compromiso ${payment.commitmentId} no existe`);
          continue;
        }
        
        const commitment = commitmentDoc.data();
        const provider = commitment.provider || commitment.beneficiary || '';
        const beneficiary = commitment.beneficiary || commitment.provider || '';
        
        if (provider || beneficiary) {
          // Actualizar el pago con los datos del compromiso
          await updateDoc(doc(db, 'payments', paymentDoc.id), {
            provider: provider,
            beneficiary: beneficiary,
            updatedAt: new Date()
          });
          
          updateCount++;
          console.log(`✅ Actualizado pago ${paymentDoc.id} con beneficiario: ${provider || beneficiary}`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando compromiso ${payment.commitmentId}:`, error);
      }
    }
    
    console.log(`🎉 Proceso completado. ${updateCount} pagos actualizados.`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si es llamado directamente
if (typeof window !== 'undefined') {
  console.log('🔧 Herramienta de actualización de beneficiarios cargada');
  window.updatePaymentsWithBeneficiaries = updatePaymentsWithBeneficiaries;
}

export { updatePaymentsWithBeneficiaries };
