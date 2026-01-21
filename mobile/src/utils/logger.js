/**
 * Sistema de logging condicional para DR Group Mobile
 * En desarrollo: Muestra todos los logs
 * En producción: Solo muestra errores críticos
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Debug logs - Solo en desarrollo
   * Usar para debugging temporal
   */
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - Solo en desarrollo
   * Usar para flujo de ejecución informativo
   */
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - Siempre activo
   * Usar para situaciones anómalas no críticas
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - Siempre activo
   * Usar para errores que requieren atención
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};
