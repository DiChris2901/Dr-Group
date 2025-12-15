import { useMemo } from 'react';
import festivosColombianos from 'festivos-colombianos';
import { parseISO, getDay, addDays } from 'date-fns';

// Hook para obtener días festivos de Colombia aplicando manualmente la Ley Emiliani
export const useColombianHolidays = (year = new Date().getFullYear()) => {
  const holidays = useMemo(() => {
    try {
      // Obtener festivos usando el paquete oficial
      const festivosOficiales = festivosColombianos(year);
      
      if (!Array.isArray(festivosOficiales)) return [];

      // Festivos que deben regirse por la Ley Emiliani (traslado al lunes)
      const festivosEmiliani = [
        "San José",
        "San Pedro y San Pablo", 
        "Asunción de la Virgen",
        "Día de la Raza",
        "Todos los Santos",
        "Independencia de Cartagena",
        "Sagrado Corazón",
        "Ascensión del Señor",
        "Corpus Christi"
      ];

      // Función para aplicar la Ley Emiliani
      const aplicarLeyEmiliani = (fechaISO) => {
        const fecha = parseISO(fechaISO);
        const diaSemana = getDay(fecha); // 0 = domingo, 1 = lunes, etc.
        
        if (diaSemana === 0) { // Si cae domingo
          return addDays(fecha, 1); // Mover al lunes (día siguiente)
        } else if (diaSemana > 1) { // Si cae martes a sábado
          return addDays(fecha, 8 - diaSemana); // Mover al lunes siguiente
        } else {
          return fecha; // Si ya es lunes, no se mueve
        }
      };

      // Convertir y aplicar Ley Emiliani donde corresponda
      const formattedHolidays = festivosOficiales.map(festivo => {
        const aplicaEmiliani = festivosEmiliani.some(nombre => 
          festivo.celebration.includes(nombre)
        );

        if (aplicaEmiliani) {
          const fechaCorregida = aplicarLeyEmiliani(festivo.holiday);
          return {
            date: fechaCorregida.toISOString().split('T')[0],
            name: festivo.celebration,
            type: 'religious',
            originalDate: festivo.holiday // Guardar fecha original para referencia
          };
        } else {
          return {
            date: festivo.holiday,
            name: festivo.celebration,
            type: 'civil'
          };
        }
      });

      return formattedHolidays;
    } catch (error) {
      console.error("Error calculating holidays:", error);
      return [];
    }
  }, [year]);

  return holidays;
};
