/**
 * 📊 Excel Importer Utility - DR Group Dashboard
 * Sistema de importación masiva de compromisos desde Excel
 * 
 * Mapeo de campos:
 * A: Empresa → companyName + buscar companyId
 * B: Mes → month (1-12)
 * C: Año → year
 * D: Fecha Vencimiento → dueDate
 * E: Periodicidad → periodicity
 * F: Beneficiario → beneficiary
 * G: Concepto → concept
 * H: Valor → amount
 * I: Método Pago → paymentMethod
 * J: Pago Aplazado → deferredPayment
 * K: Observaciones → observations
 */

import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mapeo de periodicidades válidas
const PERIODICITY_MAPPING = {
  'unico': 'unique',
  'único': 'unique',
  'pago unico': 'unique',
  'pago único': 'unique',
  'mensual': 'monthly',
  'bimestral': 'bimonthly',
  'trimestral': 'quarterly', 
  'cuatrimestral': 'fourmonthly',
  'semestral': 'biannual',
  'anual': 'annual'
};

// Mapeo de métodos de pago válidos
const PAYMENT_METHOD_MAPPING = {
  'transferencia': 'transfer',
  'transfer': 'transfer',
  'efectivo': 'cash',
  'cash': 'cash',
  'cheque': 'check',
  'tarjeta': 'card',
  'debito': 'debit',
  'credito': 'credit',
  'crédito': 'credit'
};

/**
 * Parsear archivo Excel y extraer datos
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON con header en fila 1
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: ['empresa', 'mes', 'año', 'fechaVencimiento', 'periodicidad', 'beneficiario', 'concepto', 'valor', 'metodoPago', 'pagoAplazado', 'observaciones'],
          range: 1 // Empezar desde fila 2 (saltar headers)
        });
        
        resolve({
          success: true,
          data: jsonData,
          totalRows: jsonData.length,
          fileName: file.name
        });
      } catch (error) {
        reject({
          success: false,
          error: `Error parsing Excel file: ${error.message}`
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        success: false,
        error: 'Error reading file'
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Buscar empresa por nombre en Firebase
 */
const findCompanyByName = async (companyName, companiesCache = null) => {
  try {
    // Si ya tenemos cache de empresas, usar eso
    if (companiesCache) {
      const found = companiesCache.find(company => 
        company.name.toLowerCase().trim() === companyName.toLowerCase().trim()
      );
      return found || null;
    }
    
    // Buscar en Firebase
    const q = query(
      collection(db, 'companies'), 
      where('name', '==', companyName.trim())
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding company:', error);
    return null;
  }
};

/**
 * Normalizar periodicidad
 */
const normalizePeriodicidad = (periodicidad) => {
  if (!periodicidad) return 'monthly';
  
  const normalized = periodicidad.toString().toLowerCase().trim();
  return PERIODICITY_MAPPING[normalized] || 'monthly';
};

/**
 * Normalizar método de pago
 */
const normalizePaymentMethod = (metodo) => {
  if (!metodo) return 'transfer';
  
  const normalized = metodo.toString().toLowerCase().trim();
  return PAYMENT_METHOD_MAPPING[normalized] || 'transfer';
};

/**
 * Parsear fecha Excel a JavaScript Date
 */
const parseExcelDate = (excelDate, mes, año) => {
  try {
    // Si es un número de Excel (fecha serial)
    if (typeof excelDate === 'number') {
      const date = XLSX.SSF.parse_date_code(excelDate);
      return new Date(date.y, date.m - 1, date.d);
    }
    
    // Si es string, intentar parsearlo
    if (typeof excelDate === 'string') {
      const dateStr = excelDate.trim();
      
      // Formato DD/MM/YYYY
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      
      // Formato YYYY-MM-DD
      if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
    }
    
    // Fallback: usar mes y año proporcionados + día 15
    if (mes && año) {
      return new Date(parseInt(año), parseInt(mes) - 1, 15);
    }
    
    // Último fallback: fecha actual
    return new Date();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

/**
 * Validar datos de compromiso
 */
export const validateCommitmentData = async (rowData, rowIndex, companiesCache) => {
  const errors = [];
  const warnings = [];
  
  // Validar empresa
  if (!rowData.empresa || rowData.empresa.toString().trim() === '') {
    errors.push(`Fila ${rowIndex + 2}: Empresa es obligatoria`);
  }
  
  // Validar concepto
  if (!rowData.concepto || rowData.concepto.toString().trim() === '') {
    errors.push(`Fila ${rowIndex + 2}: Concepto es obligatorio`);
  }
  
  // Validar monto
  const amount = parseFloat(rowData.valor);
  if (isNaN(amount) || amount <= 0) {
    errors.push(`Fila ${rowIndex + 2}: Valor debe ser un número mayor a 0`);
  }
  
  // Validar año
  const year = parseInt(rowData.año);
  if (isNaN(year) || year < 2020 || year > 2030) {
    errors.push(`Fila ${rowIndex + 2}: Año debe estar entre 2020 y 2030`);
  }
  
  // Validar mes
  const month = parseInt(rowData.mes);
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push(`Fila ${rowIndex + 2}: Mes debe estar entre 1 y 12`);
  }
  
  // Buscar empresa en Firebase
  let company = null;
  if (rowData.empresa) {
    company = await findCompanyByName(rowData.empresa.toString().trim(), companiesCache);
    if (!company) {
      warnings.push(`Fila ${rowIndex + 2}: Empresa "${rowData.empresa}" no encontrada en el sistema`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    company
  };
};

/**
 * Transformar datos de Excel a formato Firebase
 */
export const transformExcelToFirebase = (rowData, company, currentUser) => {
  const dueDate = parseExcelDate(rowData.fechaVencimiento, rowData.mes, rowData.año);
  const amount = parseFloat(rowData.valor) || 0;
  
  // Determinar si es pago aplazado
  const deferredPayment = rowData.pagoAplazado ? 
    (rowData.pagoAplazado.toString().toLowerCase().includes('si') || 
     rowData.pagoAplazado.toString().toLowerCase().includes('sí') ||
     rowData.pagoAplazado === true ||
     rowData.pagoAplazado === 'true' ||
     rowData.pagoAplazado === 1) : false;
  
  return {
    concept: rowData.concepto?.toString().trim() || '',
    companyId: company?.id || '',
    companyName: company?.name || rowData.empresa?.toString().trim() || '',
    amount: amount,
    dueDate: dueDate,
    month: parseInt(rowData.mes) || new Date().getMonth() + 1,
    year: parseInt(rowData.año) || new Date().getFullYear(),
    periodicity: normalizePeriodicidad(rowData.periodicidad),
    beneficiary: rowData.beneficiario?.toString().trim() || '',
    paymentMethod: normalizePaymentMethod(rowData.metodoPago),
    observations: rowData.observaciones?.toString().trim() || '',
    deferredPayment: deferredPayment,
    status: 'pending',
    paid: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: currentUser.uid,
    updatedBy: currentUser.uid,
    importedAt: new Date(),
    importSource: 'excel'
  };
};

/**
 * Importar compromisos masivamente a Firebase
 */
export const batchCreateCommitments = async (validatedData, currentUser, onProgress) => {
  const results = {
    success: 0,
    errors: 0,
    total: validatedData.length,
    errorDetails: []
  };
  
  // Obtener cache de empresas
  const companiesSnapshot = await getDocs(collection(db, 'companies'));
  const companiesCache = companiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  for (let i = 0; i < validatedData.length; i++) {
    try {
      onProgress?.({
        current: i + 1,
        total: validatedData.length,
        percentage: Math.round(((i + 1) / validatedData.length) * 100)
      });
      
      const rowData = validatedData[i];
      
      // Validar fila
      const validation = await validateCommitmentData(rowData, i, companiesCache);
      
      if (!validation.isValid) {
        results.errors++;
        results.errorDetails.push(...validation.errors);
        continue;
      }
      
      // Transformar datos
      const commitmentData = transformExcelToFirebase(rowData, validation.company, currentUser);
      
      // Guardar en Firebase
      await addDoc(collection(db, 'commitments'), commitmentData);
      
      results.success++;
      
      // Pausa pequeña para no saturar Firebase
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`Error importing row ${i + 1}:`, error);
      results.errors++;
      results.errorDetails.push(`Fila ${i + 2}: ${error.message}`);
    }
  }
  
  return results;
};

/**
 * Previsualizar datos antes de importar
 */
export const previewImportData = async (parsedData) => {
  const preview = [];
  const companiesSnapshot = await getDocs(collection(db, 'companies'));
  const companiesCache = companiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  for (let i = 0; i < Math.min(parsedData.length, 10); i++) {
    const rowData = parsedData[i];
    const validation = await validateCommitmentData(rowData, i, companiesCache);
    
    preview.push({
      rowIndex: i + 2,
      data: rowData,
      validation: validation,
      preview: validation.isValid ? transformExcelToFirebase(rowData, validation.company, { uid: 'preview' }) : null
    });
  }
  
  return preview;
};
