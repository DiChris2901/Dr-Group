import { addDays, getDay, parseISO } from 'date-fns';

/**
 * Función para verificar si un día es hábil (no fin de semana ni festivo)
 */
export const esHabil = (fecha, holidays) => {
  const dayOfWeek = getDay(fecha);
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
  
  // Verificar si es festivo
  const fechaNormalizada = new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);
  const fechaISO = fechaNormalizada.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === fechaISO);
  
  return !isWeekendDay && !isHoliday;
};

/**
 * Función para sumar días hábiles desde una fecha base
 * Empieza a contar desde el día SIGUIENTE a la fecha base
 */
export const sumarDiasHabiles = (fechaBase, diasAsumar, holidays) => {
  let fecha = addDays(new Date(fechaBase), 1); // Empezar desde el día siguiente
  let contador = 0;
  
  while (contador < diasAsumar) {
    if (esHabil(fecha, holidays)) {
      contador++;
    }
    if (contador < diasAsumar) {
      fecha = addDays(fecha, 1);
    }
  }
  
  return fecha;
};

/**
 * Calcula el décimo día hábil de un mes específico
 * excluyendo fines de semana y festivos colombianos
 */
export const calculateTenthBusinessDay = (year, month, holidays) => {
  // Obtener el último día del mes anterior como base
  const fechaBase = new Date(year, month, 0); // Último día del mes anterior
  
  // Sumar 10 días hábiles desde la fecha base
  const result = sumarDiasHabiles(fechaBase, 10, holidays);
  
  return result;
};

/**
 * Calcula el tercer día hábil de un mes específico
 * excluyendo fines de semana y festivos colombianos
 */
export const calculateThirdBusinessDay = (year, month, holidays) => {
  // Obtener el último día del mes anterior como base
  const fechaBase = new Date(year, month, 0); // Último día del mes anterior
  
  // Sumar 3 días hábiles desde la fecha base
  const result = sumarDiasHabiles(fechaBase, 3, holidays);
  
  return result;
};
