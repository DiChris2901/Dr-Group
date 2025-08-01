import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Función para crear datos de ejemplo
export const createSampleData = async () => {
  try {
    // Crear empresas de ejemplo
    const companiesData = [
      {
        id: 'dr-group-main',
        name: 'DR Group',
        description: 'Empresa principal del grupo',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'dr-construction',
        name: 'DR Construcción',
        description: 'División de construcción',
        active: true,
        createdAt: new Date()
      },
      {
        id: 'dr-logistics',
        name: 'DR Logística',
        description: 'División de logística y transporte',
        active: true,
        createdAt: new Date()
      }
    ];

    // Insertar empresas
    for (const company of companiesData) {
      await setDoc(doc(db, 'companies', company.id), company);
    }

    // Crear compromisos de ejemplo
    const commitmentsData = [
      {
        description: 'Pago de nómina mensual',
        company: 'DR Group',
        companyId: 'dr-group-main',
        amount: 450000,
        dueDate: new Date('2024-01-15'),
        type: 'Nómina',
        paid: false,
        notes: 'Pago correspondiente al mes de enero 2024',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Alquiler de oficina principal',
        company: 'DR Group',
        companyId: 'dr-group-main',
        amount: 75000,
        dueDate: new Date('2024-01-10'),
        type: 'Alquiler',
        paid: true,
        paidDate: new Date('2024-01-08'),
        notes: 'Alquiler mensual de las oficinas administrativas',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Pago a proveedores de materiales',
        company: 'DR Construcción',
        companyId: 'dr-construction',
        amount: 180000,
        dueDate: new Date('2024-01-20'),
        type: 'Proveedores',
        paid: false,
        notes: 'Materiales para proyecto Plaza Central',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Mantenimiento de vehículos',
        company: 'DR Logística',
        companyId: 'dr-logistics',
        amount: 35000,
        dueDate: new Date('2024-01-12'),
        type: 'Mantenimiento',
        paid: false,
        notes: 'Mantenimiento preventivo de la flota',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Pago de seguros empresariales',
        company: 'DR Group',
        companyId: 'dr-group-main',
        amount: 120000,
        dueDate: new Date('2024-01-25'),
        type: 'Seguros',
        paid: false,
        notes: 'Renovación anual de pólizas de seguros',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Electricidad - Oficinas',
        company: 'DR Group',
        companyId: 'dr-group-main',
        amount: 8500,
        dueDate: new Date('2024-01-08'),
        type: 'Servicios Públicos',
        paid: true,
        paidDate: new Date('2024-01-07'),
        notes: 'Factura de electricidad del mes anterior',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Combustible para vehículos',
        company: 'DR Logística',
        companyId: 'dr-logistics',
        amount: 45000,
        dueDate: new Date('2024-01-14'),
        type: 'Combustible',
        paid: false,
        notes: 'Combustible para operaciones del mes',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      },
      {
        description: 'Préstamo bancario - Cuota mensual',
        company: 'DR Construcción',
        companyId: 'dr-construction',
        amount: 95000,
        dueDate: new Date('2024-01-30'),
        type: 'Préstamos',
        paid: false,
        notes: 'Cuota mensual del préstamo para equipos',
        createdAt: new Date(),
        createdBy: 'admin@drgroup.com'
      }
    ];

    // Insertar compromisos
    for (const commitment of commitmentsData) {
      await addDoc(collection(db, 'commitments'), commitment);
    }

    console.log('Datos de ejemplo creados exitosamente');
    return { success: true, message: 'Datos de ejemplo creados exitosamente' };

  } catch (error) {
    console.error('Error creating sample data:', error);
    return { success: false, error: error.message };
  }
};

// Función para limpiar datos de ejemplo (útil para testing)
export const clearSampleData = async () => {
  try {
    // Esta función se implementaría si fuera necesaria
    console.log('Función de limpieza disponible si es necesaria');
  } catch (error) {
    console.error('Error clearing sample data:', error);
  }
};
