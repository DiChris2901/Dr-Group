import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook para gestionar logs de liquidaciones
 * Maneja límite automático de logs para prevenir memory leaks
 * 
 * @param {number} maxLogs - Máximo de logs a mantener (default: 100)
 * @returns {Object} - { logs, addLog, limpiarLogs }
 */
export default function useLiquidacionLogs(maxLogs = 100) {
  const [logs, setLogs] = useState([]);
  const logIdCounter = useRef(0);

  /**
   * Agregar un nuevo log al sistema
   * @param {string} message - Mensaje del log
   * @param {string} type - Tipo de log: 'info' | 'success' | 'warning' | 'error'
   */
  const addLog = useCallback((message, type = 'info') => {
    const newLog = {
      id: logIdCounter.current++,
      timestamp: new Date().toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      message,
      type
    };
    
    setLogs(prev => {
      const updated = [...prev, newLog];
      // Mantener solo los últimos logs para evitar memory leak
      if (updated.length > maxLogs) {
        return updated.slice(-maxLogs);
      }
      return updated;
    });
  }, [maxLogs]);

  /**
   * Limpiar todos los logs
   */
  const limpiarLogs = useCallback(() => {
    setLogs([]);
    addLog('🧹 Logs limpiados correctamente', 'info');
  }, [addLog]);

  return { 
    logs, 
    addLog, 
    limpiarLogs 
  };
}
