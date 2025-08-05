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
    // Verificar que no sea pago único
    if (commitmentData.periodicity === 'unique') {
      return [commitmentData];
    }

    // Obtener meses para la periodicidad
    const monthsInterval = PERIODICITY_MONTHS[commitmentData.periodicity];
    if (!monthsInterval) {
      throw new Error(`Periodicidad no válida: ${commitmentData.periodicity}`);
    }

    // Establecer límite temporal por defecto: fin del año siguiente
    const currentYear = new Date().getFullYear();
    const defaultMaxDate = new Date(currentYear + 1, 11, 31); // 31 de diciembre del año siguiente
    const effectiveMaxDate = maxDate || defaultMaxDate;

    const generatedCommitments = [];
    const baseDate = new Date(commitmentData.dueDate);
    
    // Determinar índice inicial (0 si no skipFirst, 1 si skipFirst)
    const startIndex = skipFirst ? 1 : 0;
    
    // Generar compromisos recurrentes con límite temporal
    let generatedCount = 0;
    for (let i = startIndex; i < instancesCount + startIndex && generatedCount < instancesCount; i++) {
      const currentDate = addMonths(baseDate, i * monthsInterval);
      
      // Verificar límite temporal
      if (currentDate > effectiveMaxDate) {
        console.log(`⏱️ Límite temporal alcanzado: ${currentDate.toISOString()} > ${effectiveMaxDate.toISOString()}`);
        break;
      }
      
      const commitment = {
        ...commitmentData,
        dueDate: currentDate,
        concept: i === 0 
          ? commitmentData.concept 
          : `${commitmentData.concept} - ${format(currentDate, 'MMMM yyyy', { locale: es })}`,
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

      generatedCommitments.push(commitment);
      generatedCount++;
    }

    // Log del resultado
    const limitedByTime = generatedCount < instancesCount;
    console.log(`📅 Compromisos generados: ${generatedCount}/${instancesCount}${limitedByTime ? ' (limitado por fecha)' : ''}`);

    return generatedCommitments;
  } catch (error) {
    console.error('Error generating recurring commitments:', error);
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
    const savedIds = [];
    const recurringGroupId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Guardar el primer compromiso para obtener su ID
    const firstCommitment = { 
      ...commitments[0], 
      recurringGroup: recurringGroupId,
      parentCommitmentId: null
    };
    
    const firstDocRef = await addDoc(collection(db, 'commitments'), firstCommitment);
    savedIds.push(firstDocRef.id);
    
    // Guardar el resto de compromisos con referencia al primer compromiso
    for (let i = 1; i < commitments.length; i++) {
      const commitment = {
        ...commitments[i],
        recurringGroup: recurringGroupId,
        parentCommitmentId: firstDocRef.id
      };
      
      const docRef = await addDoc(collection(db, 'commitments'), commitment);
      savedIds.push(docRef.id);
    }

    return {
      success: true,
      count: savedIds.length,
      ids: savedIds,
      groupId: recurringGroupId
    };
  } catch (error) {
    console.error('Error saving recurring commitments:', error);
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
  console.log('🔍 checkCommitmentsForExtension iniciado');
  console.log('📊 Compromisos recibidos:', commitments.length);
  
  const today = new Date();
  const checkDate = addMonths(today, monthsAhead);
  console.log('📅 Fecha límite para verificar:', checkDate.toISOString());
  
  const recurringGroups = {};
  
  // Agrupar compromisos recurrentes
  commitments.forEach((commitment, index) => {
    console.log(`📋 Compromiso ${index + 1}:`, {
      concept: commitment.concept,
      isRecurring: commitment.isRecurring,
      recurringGroup: commitment.recurringGroup,
      periodicity: commitment.periodicity,
      dueDate: commitment.dueDate
    });
    
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
  
  console.log('📦 Grupos recurrentes encontrados:', Object.keys(recurringGroups).length);
  console.log('🔍 Grupos:', Object.keys(recurringGroups));
  
  // Verificar cuáles grupos necesitan extensión
  const needsExtension = [];
  
  Object.entries(recurringGroups).forEach(([groupId, group]) => {
    const lastCommitment = group.commitments
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
    
    console.log(`📆 Grupo ${groupId}:`, {
      concept: group.concept,
      lastDueDate: lastCommitment.dueDate,
      checkDate: checkDate,
      needsExtension: new Date(lastCommitment.dueDate) < checkDate
    });
    
    if (lastCommitment && new Date(lastCommitment.dueDate) < checkDate) {
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
  
  console.log('🎯 Resultado final:', result);
  
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
