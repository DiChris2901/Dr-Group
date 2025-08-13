import { useState, useEffect } from 'react';
import { performanceLogger } from '../utils/PerformanceLogger';

/**
 * Hook personalizado para debounce - Optimización Firebase
 * Evita consultas excesivas durante filtrado rápido
 * 
 * @param {*} value - Valor a debouncer
 * @param {number} delay - Retraso en milisegundos (default: 500ms)
 * @param {string} loggerName - Nombre para logging (opcional)
 * @returns {*} - Valor debouncado
 */
const useDebounce = (value, delay = 500, loggerName = 'filter') => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // ✅ Configura el timeout para actualizar el valor debouncado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      // 📊 Log del evento de debounce para métricas
      if (value !== debouncedValue) {
        performanceLogger.logDebounceEvent(loggerName);
      }
    }, delay);

    // 🧹 Limpia el timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, debouncedValue, loggerName]);

  return debouncedValue;
};

export default useDebounce;
