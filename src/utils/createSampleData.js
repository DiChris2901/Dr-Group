// 🔥 Script para poblar Firebase con datos de muestra
// Este script creará datos de ejemplo para las páginas integradas

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// 🔧 Datos de muestra para herramientas avanzadas
export const createSampleToolsData = async () => {
  console.log('🔧 Creando datos de muestra para Advanced Tools...');
  
  try {
    // Cálculos de ejemplo
    const sampleCalculations = [
      {
        type: 'financial_analysis',
        title: 'Análisis de Flujo de Caja - Q1 2025',
        result: 125000,
        currency: 'USD',
        parameters: {
          period: '3 months',
          companies: ['ABC Corp', 'XYZ Ltd'],
          includeProjections: true
        },
        userId: 'admin',
        createdAt: serverTimestamp(),
        status: 'completed'
      },
      {
        type: 'roi_calculation',
        title: 'ROI Proyecto Infraestructura',
        result: 18.5,
        currency: '%',
        parameters: {
          investment: 50000,
          returns: 59250,
          period: '12 months'
        },
        userId: 'admin',
        createdAt: serverTimestamp(),
        status: 'completed'
      }
    ];

    for (const calc of sampleCalculations) {
      await addDoc(collection(db, 'calculations'), calc);
    }

    // Historial de exportaciones
    const sampleExports = [
      {
        filename: 'reporte_ejecutivo_enero_2025.pdf',
        type: 'pdf',
        size: '2.3 MB',
        recordsCount: 150,
        userId: 'admin',
        createdAt: serverTimestamp(),
        status: 'completed'
      },
      {
        filename: 'compromisos_vencidos.xlsx',
        type: 'excel',
        size: '1.8 MB',
        recordsCount: 89,
        userId: 'admin',
        createdAt: serverTimestamp(),
        status: 'completed'
      }
    ];

    for (const exportItem of sampleExports) {
      await addDoc(collection(db, 'exportHistory'), exportItem);
    }

    // Herramientas del sistema
    const systemTools = [
      {
        name: 'Calculadora Financiera',
        description: 'Herramientas avanzadas de cálculo financiero',
        category: 'finance',
        isActive: true,
        permissions: ['admin', 'manager'],
        lastUpdated: serverTimestamp()
      },
      {
        name: 'Generador de Reportes',
        description: 'Creación automática de reportes personalizados',
        category: 'reporting',
        isActive: true,
        permissions: ['admin', 'manager', 'user'],
        lastUpdated: serverTimestamp()
      }
    ];

    for (const tool of systemTools) {
      await addDoc(collection(db, 'systemTools'), tool);
    }

    console.log('✅ Datos de herramientas creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando datos de herramientas:', error);
  }
};

// 📊 Datos de muestra para monitoreo del sistema
export const createSampleMonitoringData = async () => {
  console.log('📊 Creando datos de muestra para System Monitoring...');
  
  try {
    // Logs del sistema
    const systemLogs = [
      {
        level: 'info',
        message: 'Usuario admin@drgroup.com inició sesión exitosamente',
        component: 'auth',
        userId: 'admin',
        ip: '192.168.1.100',
        timestamp: serverTimestamp()
      },
      {
        level: 'warning',
        message: 'Intento de acceso fallido para usuario inexistente',
        component: 'auth',
        ip: '192.168.1.105',
        timestamp: serverTimestamp()
      },
      {
        level: 'error',
        message: 'Error de conexión con base de datos (timeout)',
        component: 'database',
        timestamp: serverTimestamp()
      },
      {
        level: 'info',
        message: 'Backup automático completado exitosamente',
        component: 'system',
        size: '250 MB',
        timestamp: serverTimestamp()
      }
    ];

    for (const log of systemLogs) {
      await addDoc(collection(db, 'systemLogs'), log);
    }

    // Métricas de rendimiento
    const performanceMetrics = [
      {
        cpu: 45,
        memory: 62,
        storage: 78,
        network: 23,
        uptime: 99.8,
        responseTime: 120,
        activeUsers: 8,
        status: 'healthy',
        timestamp: serverTimestamp()
      },
      {
        cpu: 52,
        memory: 58,
        storage: 78,
        network: 31,
        uptime: 99.8,
        responseTime: 95,
        activeUsers: 12,
        status: 'healthy',
        timestamp: serverTimestamp()
      }
    ];

    for (const metric of performanceMetrics) {
      await addDoc(collection(db, 'performanceMetrics'), metric);
    }

    console.log('✅ Datos de monitoreo creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando datos de monitoreo:', error);
  }
};

// 🚨 Datos de muestra para centro de alertas
export const createSampleAlertsData = async () => {
  console.log('🚨 Creando datos de muestra para Alerts Center...');
  
  try {
    const sampleAlerts = [
      {
        title: 'Compromiso Crítico Vencido',
        message: 'ABC Corp tiene un pago vencido de $25,000 desde hace 5 días',
        description: 'Este compromiso requiere atención inmediata. El cliente ha sido notificado pero no ha respondido.',
        severity: 'critical',
        type: 'payment_overdue',
        category: 'Pagos',
        status: 'active',
        priority: 'high',
        read: false,
        metadata: {
          company: 'ABC Corp',
          amount: 25000,
          daysOverdue: 5,
          commitmentId: 'commit_123'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Múltiples Vencimientos Próximos',
        message: '7 compromisos vencen en los próximos 3 días',
        description: 'Se recomienda contactar a los clientes para confirmar los pagos programados.',
        severity: 'warning',
        type: 'payments_due_soon',
        category: 'Vencimientos',
        status: 'active',
        priority: 'medium',
        read: false,
        metadata: {
          count: 7,
          totalAmount: 45000,
          daysUntilDue: 3
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Nueva Empresa Registrada',
        message: 'Tech Solutions se registró exitosamente',
        description: 'La empresa ha completado el proceso de registro y está lista para operar.',
        severity: 'info',
        type: 'new_company',
        category: 'Sistema',
        status: 'active',
        priority: 'low',
        read: true,
        metadata: {
          companyName: 'Tech Solutions',
          registrationDate: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Backup Completado',
        message: 'Respaldo automático completado exitosamente',
        description: 'El backup incluye todos los datos hasta las 11:30 PM del día anterior.',
        severity: 'success',
        type: 'system_backup',
        category: 'Sistema',
        status: 'dismissed',
        priority: 'low',
        read: true,
        metadata: {
          backupSize: '250 MB',
          completedAt: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const alert of sampleAlerts) {
      await addDoc(collection(db, 'alerts'), alert);
    }

    console.log('✅ Datos de alertas creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando datos de alertas:', error);
  }
};

// 🚀 Función principal para crear todos los datos de muestra
export const createAllSampleData = async () => {
  console.log('🚀 Iniciando creación de datos de muestra...');
  
  try {
    await createSampleToolsData();
    // await createSampleMonitoringData(); // Comentado - páginas eliminadas
    // await createSampleAlertsData(); // Comentado - páginas eliminadas
    
    console.log('🎉 ¡Todos los datos de muestra creados exitosamente!');
    console.log('📄 Las páginas ahora mostrarán datos reales de Firebase.');
  } catch (error) {
    console.error('❌ Error en la creación de datos de muestra:', error);
  }
};

export default {
  createSampleToolsData,
  // createSampleMonitoringData, // Comentado - páginas eliminadas
  // createSampleAlertsData, // Comentado - páginas eliminadas
  createAllSampleData
};
