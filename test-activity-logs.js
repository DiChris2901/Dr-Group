// Script para generar logs de prueba para el sistema de auditoría
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configuración de Firebase (usar la misma del proyecto)
const firebaseConfig = {
  // Aquí van las credenciales del proyecto
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para generar logs de prueba
async function generateTestLogs() {
  const testLogs = [
    {
      action: 'user_login',
      entityType: 'authentication',
      entityId: 'test_user_123',
      userId: 'darg1@example.com',
      userEmail: 'darg1@example.com',
      userName: 'Diego Rodriguez',
      details: {
        loginMethod: 'email',
        browserInfo: 'Chrome 91.0',
        ipAddress: '192.168.1.100'
      },
      timestamp: serverTimestamp()
    },
    {
      action: 'create_commitment',
      entityType: 'commitment',
      entityId: 'commitment_456',
      userId: 'darg1@example.com',
      userEmail: 'darg1@example.com',
      userName: 'Diego Rodriguez',
      details: {
        commitmentName: 'Pago Nómina Agosto',
        amount: 2500000,
        dueDate: '2025-08-31',
        company: 'DR Group'
      },
      timestamp: serverTimestamp()
    },
    {
      action: 'create_payment',
      entityType: 'payment',
      entityId: 'payment_789',
      userId: 'darg1@example.com',
      userEmail: 'darg1@example.com',
      userName: 'Diego Rodriguez',
      details: {
        paymentAmount: 1250000,
        paymentMethod: 'Transferencia',
        concept: 'Servicios públicos',
        beneficiary: 'Empresa de Energía'
      },
      timestamp: serverTimestamp()
    },
    {
      action: 'create_company',
      entityType: 'company',
      entityId: 'company_101',
      userId: 'darg1@example.com',
      userEmail: 'darg1@example.com',
      userName: 'Diego Rodriguez',
      details: {
        companyName: 'Nueva Empresa Test',
        nit: '900123456-1',
        bankAccount: '1234567890',
        bankName: 'Banco de Bogotá'
      },
      timestamp: serverTimestamp()
    },
    {
      action: 'export_report',
      entityType: 'report',
      entityId: 'report_202',
      userId: 'darg1@example.com',
      userEmail: 'darg1@example.com',
      userName: 'Diego Rodriguez',
      details: {
        reportType: 'Análisis por Empresa',
        selectedCompany: 'DR Group',
        timeRange: 'last6months',
        totalAmount: 15750000,
        exportFormat: 'Excel'
      },
      timestamp: serverTimestamp()
    }
  ];

  try {
    console.log('🚀 Generando logs de prueba...');
    
    for (const log of testLogs) {
      await addDoc(collection(db, 'activity_logs'), log);
      console.log(`✅ Log creado: ${log.action}`);
    }
    
    console.log('🎉 ¡Todos los logs de prueba han sido creados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando logs:', error);
  }
}

// Ejecutar el script
generateTestLogs();
