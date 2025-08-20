// Script para limpiar registros de 4x1000 huérfanos en Firebase
// Ejecutar con: node cleanup-orphaned-4x1000.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';

// Configuración de Firebase (usar la misma del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf_CdqyFiRzjVcI",
  authDomain: "dr-group-dd221.firebaseapp.com", 
  projectId: "dr-group-dd221",
  storageBucket: "dr-group-dd221.appspot.com",
  messagingSenderId: "986998853068",
  appId: "1:986998853068:web:bb2ce93cef6a994ab1ea6a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupOrphanedTax4x1000Records() {
  console.log('🧹 Iniciando limpieza de registros 4x1000 huérfanos...');
  
  try {
    // Obtener todos los pagos
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(paymentsQuery);
    const allPayments = [];
    const tax4x1000Records = [];
    const regularPayments = [];
    
    // Separar registros de 4x1000 de pagos regulares
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      allPayments.push(data);
      
      if (data.concept && data.concept.includes('4x1000') && data.is4x1000Tax === true) {
        tax4x1000Records.push(data);
      } else {
        regularPayments.push(data);
      }
    });
    
    console.log(`📊 Encontrados: ${regularPayments.length} pagos regulares, ${tax4x1000Records.length} registros de 4x1000`);
    
    // Encontrar registros 4x1000 huérfanos (sin pago regular asociado)
    const orphanedTax4x1000 = [];
    
    for (const taxRecord of tax4x1000Records) {
      const taxDate = taxRecord.date?.toDate?.() || new Date(taxRecord.date);
      
      // Buscar si existe un pago regular del mismo día y monto aproximado
      const hasAssociatedPayment = regularPayments.some(payment => {
        const paymentDate = payment.date?.toDate?.() || new Date(payment.date);
        const isSameDay = paymentDate.toDateString() === taxDate.toDateString();
        const expectedTax = Math.round((payment.amount * 4) / 1000);
        const isSimilarAmount = Math.abs(taxRecord.amount - expectedTax) < 10;
        
        return isSameDay && isSimilarAmount;
      });
      
      if (!hasAssociatedPayment) {
        orphanedTax4x1000.push(taxRecord);
      }
    }
    
    console.log(`🔍 Encontrados ${orphanedTax4x1000.length} registros 4x1000 huérfanos`);
    
    if (orphanedTax4x1000.length === 0) {
      console.log('✅ No se encontraron registros huérfanos. Base de datos limpia.');
      return;
    }
    
    // Mostrar registros que serán eliminados
    console.log('\n🗑️ Registros que serán eliminados:');
    orphanedTax4x1000.forEach((record, index) => {
      const date = record.date?.toDate?.() || new Date(record.date);
      console.log(`${index + 1}. ${record.concept} - $${record.amount.toLocaleString()} - ${date.toLocaleDateString()}`);
    });
    
    // Confirmar eliminación (en un entorno real, podrías agregar confirmación)
    console.log('\n🚨 ELIMINANDO REGISTROS HUÉRFANOS...');
    
    let deletedCount = 0;
    for (const record of orphanedTax4x1000) {
      try {
        await deleteDoc(doc(db, 'payments', record.id));
        console.log(`✅ Eliminado: ${record.concept} - $${record.amount.toLocaleString()}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Error eliminando ${record.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Limpieza completada: ${deletedCount} registros eliminados`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar la limpieza
try {
  await cleanupOrphanedTax4x1000Records();
  console.log('🏁 Script completado');
  process.exit(0);
} catch (error) {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}
