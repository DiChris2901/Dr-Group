/**
 * Performance logger para monitoreo de optimizaciones Firebase
 * Rastrea mejoras en consultas, cache hits, y reducción de costos
 */
class PerformanceLogger {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      firebaseReads: 0,
      cacheHits: 0,
      totalOperations: 0,
      debounceEvents: 0
    };
    
    // Solo logear en desarrollo
    this.isDev = process.env.NODE_ENV === 'development';
  }

  /**
   * Registra una lectura de Firebase
   * @param {string} operation - Tipo de operación (getDocs, getCount, etc)
   * @param {number} count - Cantidad de documentos leídos
   */
  logFirebaseRead(operation, count = 1) {
    this.metrics.firebaseReads += count;
    this.metrics.totalOperations++;
    
    if (this.isDev) {
    }
  }

  /**
   * Registra un hit de cache
   * @param {string} cacheType - Tipo de cache (firestore, local, etc)
   * @param {string} key - Clave del cache
   */
  logCacheHit(cacheType, key) {
    this.metrics.cacheHits++;
    this.metrics.totalOperations++;
    
    if (this.isDev) {
      const hitRate = ((this.metrics.cacheHits / this.metrics.totalOperations) * 100).toFixed(1);
    }
  }

  /**
   * Registra un evento de debounce
   * @param {string} filterType - Tipo de filtro (search, company, etc)
   */
  logDebounceEvent(filterType) {
    this.metrics.debounceEvents++;
    
    if (this.isDev) {
    }
  }

  /**
   * Obtiene un resumen de métricas
   */
  getSummary() {
    const sessionTime = (Date.now() - this.startTime) / 1000;
    const hitRate = this.metrics.totalOperations > 0 
      ? ((this.metrics.cacheHits / this.metrics.totalOperations) * 100).toFixed(1)
      : 0;
    
    return {
      sessionDuration: `${sessionTime.toFixed(1)}s`,
      firebaseReads: this.metrics.firebaseReads,
      cacheHits: this.metrics.cacheHits,
      hitRate: `${hitRate}%`,
      debounceEvents: this.metrics.debounceEvents,
      operationsPerSecond: (this.metrics.totalOperations / sessionTime).toFixed(2)
    };
  }

  /**
   * Imprime un reporte de performance
   */
  printReport() {
    if (!this.isDev) return;
    
    const summary = this.getSummary();
    console.group('🚀 OPTIMIZACIÓN FIREBASE - REPORTE DE SESIÓN');
    console.groupEnd();
  }

  /**
   * Resetea las métricas
   */
  reset() {
    this.startTime = Date.now();
    this.metrics = {
      firebaseReads: 0,
      cacheHits: 0,
      totalOperations: 0,
      debounceEvents: 0
    };
  }
}

// Instancia global del logger
export const performanceLogger = new PerformanceLogger();

// Auto-reporte cada 5 minutos en desarrollo
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceLogger.printReport();
  }, 5 * 60 * 1000);
}

export default PerformanceLogger;
