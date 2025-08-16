// Script simple para eliminar datos de prueba de payments
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Tu configuración Firebase del proyecto
const firebaseConfig = {
  apiKey: "AIzaSyBHJQ2Q4K_GH8XpZ1k2d3L4m5n6o7p8q9r0",
  authDomain: "dr-group-dashboard.firebaseapp.com", 
  projectId: "dr-group-dashboard",
  storageBucket: "dr-group-dashboard.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearPayments() {
  console.log('🧹 Eliminando datos de prueba de payments...');
  
  try {
    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(paymentsRef);
    
    console.log(`Encontrados ${snapshot.size} documentos para eliminar`);
    
    // Eliminar cada documento
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Eliminados ${snapshot.size} registros de payments`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearPayments();
