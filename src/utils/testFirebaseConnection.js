import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Función para probar la conexión a Firebase
export const testFirebaseConnection = async () => {
  try {
    console.log('🔬 Iniciando test de conexión a Firebase...');
    
    // 1. Probar lectura de empresas
    console.log('📖 1. Probando lectura de colección companies...');
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    console.log('✅ Lectura exitosa:', {
      totalEmpresas: companiesSnapshot.size,
      empty: companiesSnapshot.empty
    });
    
    if (!companiesSnapshot.empty) {
      companiesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🏢 Empresa encontrada:', {
          id: doc.id,
          name: data.name,
          nit: data.nit,
          status: data.status
        });
      });
    }
    
    return {
      success: true,
      companiesCount: companiesSnapshot.size,
      message: 'Conexión a Firebase exitosa'
    };
    
  } catch (error) {
    console.error('❌ Error en test de Firebase:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Función para crear una empresa de prueba
export const createTestCompany = async () => {
  try {
    console.log('🏗️ Creando empresa de prueba...');
    
    const testCompany = {
      name: 'EMPRESA DE PRUEBA DIAGNOSTICO',
      nit: '999999999-9',
      email: 'prueba@test.com',
      phone: '(1) 999-9999',
      address: 'Dirección de prueba',
      status: 'active',
      createdAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'companies'), testCompany);
    console.log('✅ Empresa de prueba creada con ID:', docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      company: testCompany
    };
    
  } catch (error) {
    console.error('❌ Error creando empresa de prueba:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
