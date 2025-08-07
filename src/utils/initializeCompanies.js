import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Empresas de prueba para el sistema
const testCompanies = [
  {
    name: 'COLJUEGOS',
    nit: '901230106-7',
    email: 'info@coljuegos.gov.co',
    phone: '(1) 123-4567',
    address: 'Bogotá, Colombia',
    status: 'active',
    createdAt: new Date()
  },
  {
    name: 'CODERE COLOMBIA SAS',
    nit: '900123456-1',
    email: 'info@codere.com.co',
    phone: '(1) 234-5678',
    address: 'Bogotá, Colombia',
    status: 'active',
    createdAt: new Date()
  },
  {
    name: 'GAMING TECH COLOMBIA',
    nit: '800987654-3',
    email: 'contacto@gamingtech.co',
    phone: '(1) 345-6789',
    address: 'Medellín, Colombia',
    status: 'active',
    createdAt: new Date()
  },
  {
    name: 'SLOTS ENTERPRISES',
    nit: '700456789-2',
    email: 'admin@slotsenterprise.com',
    phone: '(1) 456-7890',
    address: 'Cali, Colombia',
    status: 'active',
    createdAt: new Date()
  }
];

export const initializeTestCompanies = async () => {
  try {
    console.log('🔄 Verificando empresas en Firebase...');
    
    // Verificar si ya hay empresas
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    
    if (companiesSnapshot.empty) {
      console.log('📝 No hay empresas. Creando empresas de prueba...');
      
      const promises = testCompanies.map(company => 
        addDoc(collection(db, 'companies'), company)
      );
      
      await Promise.all(promises);
      console.log('✅ Empresas de prueba creadas exitosamente!');
      
      return { success: true, message: 'Empresas de prueba creadas', count: testCompanies.length };
    } else {
      console.log(`ℹ️ Ya existen ${companiesSnapshot.size} empresas en la base de datos`);
      return { success: true, message: 'Empresas ya existentes', count: companiesSnapshot.size };
    }
  } catch (error) {
    console.error('❌ Error inicializando empresas:', error);
    return { success: false, error: error.message };
  }
};
