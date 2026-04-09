/**
 * Sistema de logging condicional para RDJ Organizaci髇
 * En desarrollo: Muestra todos los logs
 * En producci贸n: Solo muestra errores cr铆ticos
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
   * Usar para flujo de ejecuci贸n informativo
   */
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - Siempre activo
   * Usar para situaciones an贸malas no cr铆ticas
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logs - Siempre activo
   * Usar para errores que requieren atenci贸n
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};
