// Script para agregar pagos de prueba a Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Configuración de Firebase (usa la misma de tu proyecto)
const firebaseConfig = {
  // Aquí van tus credenciales de Firebase
  // Cópialas de src/config/firebase.js
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const samplePayments = [
  {
    companyName: 'DR Group',
    concept: 'Nómina Diciembre 2024',
    amount: 125000,
    method: 'Transferencia Bancaria',
    date: Timestamp.now(),
    reference: 'TRF-DRG-001',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Tech Solutions',
    concept: 'Servicios de TI - Noviembre',
    amount: 85000,
    method: 'Tarjeta de Crédito',
    date: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    reference: 'TRF-TECH-002',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Marketing Pro',
    concept: 'Campaña Digital Q4',
    amount: 45000,
    method: 'Efectivo',
    date: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    reference: 'EFE-MKT-001',
    status: 'pending',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Construcciones ABC',
    concept: 'Material de Construcción',
    amount: 230000,
    method: 'Transferencia Bancaria',
    date: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    reference: 'TRF-CONS-003',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Logística Express',
    concept: 'Transporte Mensual',
    amount: 65000,
    method: 'Cheque',
    date: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
    reference: 'CHE-LOG-001',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Consultoría Legal',
    concept: 'Asesoría Jurídica',
    amount: 95000,
    method: 'Transferencia Bancaria',
    date: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    reference: 'TRF-LEG-004',
    status: 'failed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Inmobiliaria Central',
    concept: 'Renta de Oficina - Diciembre',
    amount: 155000,
    method: 'Transferencia Bancaria',
    date: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    reference: 'TRF-IMO-005',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Servicios Generales',
    concept: 'Mantenimiento Instalaciones',
    amount: 35000,
    method: 'Efectivo',
    date: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    reference: 'EFE-SER-002',
    status: 'pending',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Proveedores Unidos',
    concept: 'Insumos de Oficina',
    amount: 28000,
    method: 'Tarjeta de Débito',
    date: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
    reference: 'TAR-PRO-001',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Desarrollo Web',
    concept: 'Sitio Web Corporativo',
    amount: 180000,
    method: 'Transferencia Bancaria',
    date: Timestamp.fromDate(new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)),
    reference: 'TRF-WEB-006',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Equipos y Sistemas',
    concept: 'Hardware Nuevo - Servidores',
    amount: 320000,
    method: 'Transferencia Bancaria',
    date: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    reference: 'TRF-EQU-007',
    status: 'completed',
    createdAt: Timestamp.now()
  },
  {
    companyName: 'Capacitación Pro',
    concept: 'Cursos para Personal',
    amount: 75000,
    method: 'Cheque',
    date: Timestamp.fromDate(new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)),
    reference: 'CHE-CAP-002',
    status: 'completed',
    createdAt: Timestamp.now()
  }
];

async function addSamplePayments() {
  console.log('🔥 Agregando pagos de prueba a Firebase...');
  
  try {
    const promises = samplePayments.map(payment => 
      addDoc(collection(db, 'payments'), payment)
    );
    
    const results = await Promise.all(promises);
    console.log(`✅ Se agregaron ${results.length} pagos de prueba exitosamente!`);
    console.log('IDs generados:', results.map(doc => doc.id));
  } catch (error) {
    console.error('❌ Error agregando pagos:', error);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addSamplePayments();
}

export { addSamplePayments };
