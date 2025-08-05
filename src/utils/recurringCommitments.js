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
 * Generar compromisos recurrentes basados en periodicidad
 * @param {Object} commitmentData - Datos del compromiso base
 * @param {number} instancesCount - Número de instancias a generar (por defecto 12)
 * @returns {Array} Array de compromisos generados
 */
export const generateRecurringCommitments = async (commitmentData, instancesCount = 12) => {
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

    const generatedCommitments = [];
    const baseDate = new Date(commitmentData.dueDate);
    
    // Generar compromisos recurrentes
    for (let i = 0; i < instancesCount; i++) {
      const currentDate = addMonths(baseDate, i * monthsInterval);
      
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
    }

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
