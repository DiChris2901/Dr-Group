import { useMemo } from 'react';

// Hook para obtener días festivos de Colombia
export const useColombianHolidays = (year = new Date().getFullYear()) => {
  const holidays = useMemo(() => {
    const holidays = [];

    // Días festivos fijos
    const fixedHolidays = [
      { date: `${year}-01-01`, name: 'Año Nuevo', type: 'civil' },
      { date: `${year}-05-01`, name: 'Día del Trabajo', type: 'civil' },
      { date: `${year}-07-20`, name: 'Día de la Independencia', type: 'civil' },
      { date: `${year}-08-07`, name: 'Batalla de Boyacá', type: 'civil' },
      { date: `${year}-12-08`, name: 'Inmaculada Concepción', type: 'religious' },
      { date: `${year}-12-25`, name: 'Navidad', type: 'religious' }
    ];

    // Días festivos móviles que se mueven al lunes siguiente
    const movableToMonday = [
      { month: 1, day: 6, name: 'Día de los Reyes Magos' },
      { month: 3, day: 19, name: 'Día de San José' },
      { month: 6, day: 29, name: 'San Pedro y San Pablo' },
      { month: 8, day: 15, name: 'Asunción de la Virgen' },
      { month: 10, day: 12, name: 'Día de la Raza' },
      { month: 11, day: 1, name: 'Todos los Santos' },
      { month: 11, day: 11, name: 'Independencia de Cartagena' }
    ];

    // Calcular días festivos móviles
    movableToMonday.forEach(holiday => {
      const date = new Date(year, holiday.month - 1, holiday.day);
      
      // Si no es lunes, mover al siguiente lunes
      if (date.getDay() !== 1) {
        const daysToAdd = (8 - date.getDay()) % 7;
        if (daysToAdd === 0) {
          date.setDate(date.getDate() + 7);
        } else {
          date.setDate(date.getDate() + daysToAdd);
        }
      }

      holidays.push({
        date: date.toISOString().split('T')[0],
        name: holiday.name,
        type: 'religious'
      });
    });

    // Calcular Semana Santa (fechas móviles basadas en la Pascua)
    const easter = calculateEaster(year);
    const easterHolidays = [
      { offset: -3, name: 'Jueves Santo' },
      { offset: -2, name: 'Viernes Santo' },
      { offset: 39, name: 'Ascensión del Señor' }, // Se mueve al lunes
      { offset: 60, name: 'Corpus Christi' }, // Se mueve al lunes
      { offset: 68, name: 'Sagrado Corazón de Jesús' } // Se mueve al lunes
    ];

    easterHolidays.forEach(holiday => {
      const date = new Date(easter);
      date.setDate(date.getDate() + holiday.offset);
      
      // Para algunos festivos, mover al lunes más cercano
      if (holiday.offset > 0 && date.getDay() !== 1) {
        const daysToAdd = (8 - date.getDay()) % 7;
        if (daysToAdd === 0) {
          date.setDate(date.getDate() + 7);
        } else {
          date.setDate(date.getDate() + daysToAdd);
        }
      }

      holidays.push({
        date: date.toISOString().split('T')[0],
        name: holiday.name,
        type: 'religious'
      });
    });

    // Agregar días festivos fijos
    holidays.push(...fixedHolidays);

    // Ordenar por fecha
    return holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [year]);

  return holidays;
};

// Algoritmo para calcular la fecha de Pascua (algoritmo de Gregorian)
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}
