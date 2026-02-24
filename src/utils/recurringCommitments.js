/**
 * 🔄 Recurring Commitments Generator - DR Group Dashboard
 * Utilidad para generar compromisos recurrentes según periodicidad
 * Design System Spectacular aplicado
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { addMonths, addYears, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Mapeo de periodicidades a meses
 */
const PERIODICITY_MONTHS = {
  'monthly': 1,
  'bimonthly': 2, 
  'quarterly': 3,
  'fourmonthly': 4,
  'biannual': 6,
  'annual': 12
};

/**
 * Generar compromisos recurrentes basados en periodicidad con límite temporal
 * @param {Object} commitmentData - Datos del compromiso base
 * @param {number} instancesCount - Número de instancias a generar (por defecto 12)
 * @param {boolean} skipFirst - Si es true, salta el primer compromiso (útil para ediciones)
 * @param {Date} maxDate - Fecha límite hasta la cual generar compromisos (opcional)
 * @returns {Array} Array de compromisos generados
 */
export const generateRecurringCommitments = async (commitmentData, instancesCount = 12, skipFirst = false, maxDate = null) => {
  try {
    // ✅ VALIDACIONES CRÍTICAS PARA PREVENIR COMPROMISOS HUÉRFANOS
    if (!commitmentData) {
      throw new Error('commitmentData es requerido');
    }
    
    if (!commitmentData.concept || commitmentData.concept.trim() === '') {
      throw new Error('El concepto del compromiso es requerido');
    }
    
    if (!commitmentData.companyId) {
    }
    
    if (!commitmentData.companyName || commitmentData.companyName.trim() === '') {
      console.error('❌ CRITICAL: companyName faltante en commitmentData');
      console.error('📋 Datos recibidos:', {
        companyId: commitmentData.companyId,
        companyName: commitmentData.companyName,
        concept: commitmentData.concept,
        beneficiary: commitmentData.beneficiary
      });
      throw new Error('companyName es requerido para evitar compromisos huérfanos');
    }
    
    // Verificar que no sea pago único
    if (commitmentData.periodicity === 'unique') {
      return [commitmentData];
    }

    // Obtener meses para la periodicidad
    const monthsInterval = PERIODICITY_MONTHS[commitmentData.periodicity];
    if (!monthsInterval) {
      throw new Error(`Periodicidad no válida: ${commitmentData.periodicity}`);
    }

    // Establecer límite temporal por defecto: fin del año en curso
    const currentYear = new Date().getFullYear();
    const defaultMaxDate = new Date(currentYear, 11, 31); // 31 de diciembre del año en curso
    const effectiveMaxDate = maxDate || defaultMaxDate;

    const generatedCommitments = [];
    const baseDate = new Date(commitmentData.dueDate);
    
    // ✅ VERIFICAR QUE LA FECHA BASE SEA VÁLIDA
    if (isNaN(baseDate.getTime())) {
      throw new Error('Fecha de vencimiento no válida');
    }
    
    // Determinar índice inicial (0 si no skipFirst, 1 si skipFirst)
    const startIndex = skipFirst ? 1 : 0;
    
    // Log de debug para monitorear generación
    
    // Generar compromisos recurrentes con límite temporal
    let generatedCount = 0;
    for (let i = startIndex; i < instancesCount + startIndex && generatedCount < instancesCount; i++) {
      const currentDate = addMonths(baseDate, i * monthsInterval);
      
      // Verificar límite temporal (solo año en curso)
      if (currentDate > effectiveMaxDate) {
        break;
      }
      
      const commitment = {
        ...commitmentData,
        dueDate: currentDate,
        concept: commitmentData.concept, // 🔧 Mantener concepto original sin fecha automática
        // ✅ ASEGURAR CAMPOS CRÍTICOS
        companyName: commitmentData.companyName, // Explícitamente asegurar que esté presente
        companyId: commitmentData.companyId,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        instanceNumber: i + 1,
        totalInstances: instancesCount,
        parentCommitmentId: null, // Se asignará después del primer compromiso
        isRecurring: true,
        recurringGroup: null, // Se asignará un ID único para el grupo
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // ✅ VALIDACIÓN FINAL ANTES DE AGREGAR
      if (!commitment.companyName || commitment.companyName.trim() === '') {
        throw new Error(`Compromiso ${i + 1} quedaría sin companyName - cancelando generación`);
      }

      generatedCommitments.push(commitment);
      generatedCount++;
    }

    // Log del resultado
    const limitedByTime = generatedCount < instancesCount;
    
    // ✅ VALIDACIÓN FINAL DEL RESULTADO
    if (generatedCommitments.length === 0) {
      throw new Error('No se generaron compromisos recurrentes');
    }
    
    // Verificar que todos tengan companyName
    const invalidCommitments = generatedCommitments.filter(c => !c.companyName || c.companyName.trim() === '');
    if (invalidCommitments.length > 0) {
      throw new Error(`${invalidCommitments.length} compromisos sin companyName detectados - cancelando operación`);
    }

    return generatedCommitments;
  } catch (error) {
    console.error('❌ Error generating recurring commitments:', error);
    throw error;
  }
};

/**
 * Guardar compromisos recurrentes en Firebase
 * @param {Array} commitments - Array de compromisos a guardar
 * @returns {Array} Array de IDs de documentos creados
 */
export const saveRecurringCommitments = async (commitments) => {
  try {
    // ✅ VALIDACIONES CRÍTICAS
    if (!commitments || !Array.isArray(commitments) || commitments.length === 0) {
      throw new Error('Array de compromisos vacío o inválido');
    }
    
    // Verificar que todos los compromisos tengan companyName
    const invalidCommitments = commitments.filter(c => !c.companyName || c.companyName.trim() === '');
    if (invalidCommitments.length > 0) {
      console.error('❌ Compromisos sin companyName detectados:', invalidCommitments);
      throw new Error(`${invalidCommitments.length} compromisos sin companyName - no se guardarán para evitar huérfanos`);
    }
    
    // Log de debug
    
    const savedIds = [];
    const recurringGroupId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ VALIDACIÓN ADICIONAL DEL PRIMER COMPROMISO
    const firstCommitment = { 
      ...commitments[0], 
      recurringGroup: recurringGroupId,
      parentCommitmentId: null
    };
    
    if (!firstCommitment.companyName || firstCommitment.companyName.trim() === '') {
      throw new Error('El primer compromiso no tiene companyName - cancelando guardado');
    }
    
    // Guardar el primer compromiso para obtener su ID
    const firstDocRef = await addDoc(collection(db, 'commitments'), firstCommitment);
    savedIds.push(firstDocRef.id);
    
    
    // Guardar el resto de compromisos con referencia al primer compromiso
    for (let i = 1; i < commitments.length; i++) {
      const commitment = {
        ...commitments[i],
        recurringGroup: recurringGroupId,
        parentCommitmentId: firstDocRef.id
      };
      
      // ✅ VALIDACIÓN INDIVIDUAL
      if (!commitment.companyName || commitment.companyName.trim() === '') {
        console.error(`❌ Compromiso ${i + 1} sin companyName:`, commitment);
        throw new Error(`Compromiso ${i + 1} sin companyName - cancelando operación`);
      }
      
      const docRef = await addDoc(collection(db, 'commitments'), commitment);
      savedIds.push(docRef.id);
    }
    

    // ✅ VALIDACIÓN FINAL: Verificar que todos los IDs se generaron correctamente
    const invalidIds = savedIds.filter(id => !id || id === undefined || id === null);
    if (invalidIds.length > 0) {
      console.error('❌ ERROR CRÍTICO: Se detectaron IDs inválidos', {
        total: savedIds.length,
        invalid: invalidIds.length,
        ids: savedIds
      });
      throw new Error(`${invalidIds.length} compromisos se guardaron sin ID válido`);
    }


    return {
      success: true,
      count: savedIds.length,
      ids: savedIds,
      groupId: recurringGroupId
    };
  } catch (error) {
    console.error('❌ Error saving recurring commitments:', error);
    throw error;
  }
};

/**
 * Obtener descripción de periodicidad
 * @param {string} periodicity - Periodicidad del compromiso
 * @returns {string} Descripción legible
 */
export const getPeriodicityDescription = (periodicity) => {
  const descriptions = {
    'unique': 'Pago único',
    'monthly': 'Mensual',
    'bimonthly': 'Bimestral (cada 2 meses)',
    'quarterly': 'Trimestral (cada 3 meses)', 
    'fourmonthly': 'Cuatrimestral (cada 4 meses)',
    'biannual': 'Semestral (cada 6 meses)',
    'annual': 'Anual (cada 12 meses)'
  };
  
  return descriptions[periodicity] || 'Periodicidad desconocida';
};

/**
 * Calcular próximas fechas de compromiso
 * @param {Date} startDate - Fecha inicial
 * @param {string} periodicity - Periodicidad
 * @param {number} count - Número de fechas a generar
 * @returns {Array} Array de fechas
 */
export const calculateNextDueDates = (startDate, periodicity, count = 6) => {
  if (periodicity === 'unique') return [startDate];
  
  const monthsInterval = PERIODICITY_MONTHS[periodicity];
  if (!monthsInterval) return [startDate];
  
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(addMonths(startDate, i * monthsInterval));
  }
  
  return dates;
};

/**
 * Validar si una periodicidad es válida
 * @param {string} periodicity - Periodicidad a validar
 * @returns {boolean} True si es válida
 */
export const isValidPeriodicity = (periodicity) => {
  return periodicity === 'unique' || periodicity in PERIODICITY_MONTHS;
};

/**
 * Calcular el límite temporal recomendado basado en la fecha actual
 * @param {number} yearsAhead - Años hacia adelante (por defecto 1)
 * @returns {Date} Fecha límite
 */
export const calculateTemporalLimit = (yearsAhead = 1) => {
  const currentYear = new Date().getFullYear();
  return new Date(currentYear + yearsAhead, 11, 31); // 31 de diciembre
};

/**
 * Verificar si hay compromisos que requieren extensión temporal
 * @param {Array} commitments - Array de compromisos a verificar
 * @param {number} monthsAhead - Meses hacia adelante para verificar (por defecto 3)
 * @returns {Object} Información sobre compromisos que necesitan extensión
 */
export const checkCommitmentsForExtension = (commitments, monthsAhead = 3) => {
  
  const today = new Date();
  const checkDate = addMonths(today, monthsAhead);
  
  const recurringGroups = {};
  
  // Agrupar compromisos recurrentes
  commitments.forEach((commitment, index) => {
    
    if (commitment.isRecurring && commitment.recurringGroup) {
      if (!recurringGroups[commitment.recurringGroup]) {
        recurringGroups[commitment.recurringGroup] = {
          commitments: [],
          periodicity: commitment.periodicity,
          concept: commitment.concept.split(' - ')[0], // Concepto base
          companyId: commitment.companyId,
          companyName: commitment.companyName,
          beneficiary: commitment.beneficiary,
          amount: commitment.amount
        };
      }
      recurringGroups[commitment.recurringGroup].commitments.push(commitment);
    }
  });
  
  
  // Verificar cuáles grupos necesitan extensión
  const needsExtension = [];
  
  Object.entries(recurringGroups).forEach(([groupId, group]) => {
    const lastCommitment = group.commitments
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
    
    const needsExtensionCheck = monthsAhead < 0 ? true : new Date(lastCommitment.dueDate) < checkDate;
    
    
    if (lastCommitment && needsExtensionCheck) {
      needsExtension.push({
        groupId,
        ...group,
        lastDueDate: lastCommitment.dueDate,
        commitmentsCount: group.commitments.length
      });
    }
  });
  
  const result = {
    total: Object.keys(recurringGroups).length,
    needsExtension: needsExtension.length,
    groups: needsExtension
  };
  
  
  return result;
};

/**
 * Generar compromisos de extensión para el siguiente período
 * @param {Object} groupData - Datos del grupo de compromisos
 * @param {number} extensionCount - Número de compromisos a extender (por defecto 12)
 * @param {number} yearToExtend - Año al cual extender (por defecto año siguiente)
 * @returns {Array} Array de compromisos de extensión
 */
export const generateExtensionCommitments = async (groupData, extensionCount = 12, yearToExtend = null) => {
  try {
    const targetYear = yearToExtend || (new Date().getFullYear() + 1);
    const lastDueDate = new Date(groupData.lastDueDate);
    
    // Calcular la siguiente fecha basada en la periodicidad
    const monthsInterval = PERIODICITY_MONTHS[groupData.periodicity];
    const nextStartDate = addMonths(lastDueDate, monthsInterval);
    
    // Crear datos base para la extensión
    const baseCommitmentData = {
      concept: groupData.concept,
      companyId: groupData.companyId,
      companyName: groupData.companyName,
      beneficiary: groupData.beneficiary,
      amount: groupData.amount,
      periodicity: groupData.periodicity,
      paymentMethod: 'transfer', // Valor por defecto, se puede personalizar
      observations: `Extensión automática para ${targetYear}`,
      dueDate: nextStartDate
    };
    
    // Generar compromisos con límite temporal del año objetivo
    const maxDate = new Date(targetYear, 11, 31);
    const extensionCommitments = await generateRecurringCommitments(
      baseCommitmentData,
      extensionCount,
      false, // No skipFirst porque son nuevos compromisos
      maxDate
    );
    
    return extensionCommitments;
  } catch (error) {
    console.error('Error generating extension commitments:', error);
    throw error;
  }
};
