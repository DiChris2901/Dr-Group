/**
 * Cache inteligente para Firestore con TTL (Time To Live)
 * Optimización Firebase - Evita consultas repetitivas innecesarias
 * 
 * Features:
 * - TTL configurable por entrada
 * - Limpieza automática de entradas expiradas  
 * - Invalidación por patrones de clave
 * - Métricas de hit/miss rate
 */
class FirestoreCache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutos por defecto
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.stats = { hits: 0, misses: 0 };
    
    // 🧹 Limpieza automática cada 2 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }

  /**
   * Obtiene un valor del cache si no ha expirado
   * @param {string} key - Clave del cache
   * @returns {*|null} - Valor cached o null si expiró/no existe
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // ⏰ Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Almacena un valor en el cache con TTL
   * @param {string} key - Clave del cache  
   * @param {*} value - Valor a almacenar
   * @param {number} ttl - TTL específico en ms (opcional)
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
  }

  /**
   * Invalida entradas por patrón de clave
   * @param {string} pattern - Patrón a invalidar (ej: "company_123_*")
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 Cache: Invalidated ${keysToDelete.length} entries matching "${pattern}"`);
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    const initialSize = this.cache.size;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    
    const cleaned = initialSize - this.cache.size;
    if (cleaned > 0) {
      console.log(`🧹 Cache: Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0,
      size: this.cache.size
    };
  }

  /**
   * Limpia todo el cache
   */
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Destruye el cache y limpia el interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// 🎯 Instancia global del cache para Firestore
export const firestoreCache = new FirestoreCache();

export default FirestoreCache;
