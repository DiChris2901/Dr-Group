import { query, where, orderBy, limit, startAfter, getDocs, collection, documentId } from 'firebase/firestore';
import { db } from '../config/firebase';
import { firestoreCache } from './FirestoreCache';
import { performanceLogger } from './PerformanceLogger';

/**
 * Optimizador de Consultas Firebase - FASE 2
 * Utiliza índices compuestos y consultas optimizadas para reducir lecturas
 */
class FirestoreQueryOptimizer {
  constructor() {
    this.batchSize = 10; // Tamaño de batch para consultas múltiples
    this.indexHints = new Map(); // Cache de índices conocidos
  }

  /**
   * Construye consulta optimizada para compromisos con índices compuestos
   * @param {Object} filters - Filtros a aplicar
   * @param {Object} pagination - Configuración de paginación
   */
  async buildOptimizedCommitmentsQuery(filters = {}, pagination = {}) {
    const { companyId, year, status, searchTerm } = filters;
    const { pageSize = 9, lastDoc = null } = pagination;

    // 🎯 Construir consulta base con índices compuestos
    let baseQuery = collection(db, 'commitments');
    const queryConstraints = [];

    // 📊 Optimización: Usar índices compuestos cuando sea posible
    if (companyId && year) {
      // Índice compuesto: (companyId, year, dueDate)
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      
      queryConstraints.push(
        where('companyId', '==', companyId),
        where('dueDate', '>=', startDate),
        where('dueDate', '<=', endDate),
        orderBy('dueDate', 'asc')
      );
    } else if (companyId) {
      // Índice simple: (companyId, dueDate)
      queryConstraints.push(
        where('companyId', '==', companyId),
        orderBy('dueDate', 'asc')
      );
    } else if (year) {
      // Índice simple: (dueDate)
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      
      queryConstraints.push(
        where('dueDate', '>=', startDate),
        where('dueDate', '<=', endDate),
        orderBy('dueDate', 'asc')
      );
    } else {
      // Consulta general ordenada
      queryConstraints.push(orderBy('dueDate', 'asc'));
    }

    // 📄 Paginación
    queryConstraints.push(limit(pageSize));
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    return query(baseQuery, ...queryConstraints);
  }

  /**
   * Consulta batch optimizada para múltiples empresas
   * @param {Array} companyIds - IDs de empresas
   * @param {Object} additionalFilters - Filtros adicionales
   */
  async queryMultipleCompanies(companyIds, additionalFilters = {}) {
    const cacheKey = `multi-companies-${companyIds.join(',')}-${JSON.stringify(additionalFilters)}`;
    
    // ✅ Verificar cache primero
    const cached = firestoreCache.get(cacheKey);
    if (cached) {
      performanceLogger.logCacheHit('multi-company', cacheKey);
      return cached;
    }

    // 🔥 Dividir en batches para evitar límite de 10 elementos en "in"
    const batches = [];
    for (let i = 0; i < companyIds.length; i += this.batchSize) {
      const batch = companyIds.slice(i, i + this.batchSize);
      batches.push(this.querySingleBatch(batch, additionalFilters));
    }

    // 📊 Ejecutar todos los batches en paralelo
    const batchResults = await Promise.all(batches);
    const allResults = batchResults.flat();

    // 💾 Guardar en cache
    firestoreCache.set(cacheKey, allResults, 2 * 60 * 1000); // 2 minutos
    performanceLogger.logFirebaseRead('batch-query', allResults.length);

    return allResults;
  }

  /**
   * Ejecuta consulta para un batch de empresas
   */
  async querySingleBatch(companyIds, additionalFilters) {
    let baseQuery = collection(db, 'commitments');
    const constraints = [
      where('companyId', 'in', companyIds),
      orderBy('dueDate', 'asc')
    ];

    // Agregar filtros adicionales si existen
    if (additionalFilters.year) {
      const startDate = new Date(parseInt(additionalFilters.year), 0, 1);
      const endDate = new Date(parseInt(additionalFilters.year), 11, 31);
      constraints.push(
        where('dueDate', '>=', startDate),
        where('dueDate', '<=', endDate)
      );
    }

    const querySnapshot = await getDocs(query(baseQuery, ...constraints));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate ? doc.data().dueDate.toDate() : new Date(doc.data().dueDate)
    }));
  }

  /**
   * Consulta agregada para estadísticas (reduce lecturas para dashboards)
   * @param {Object} filters - Filtros para la consulta
   */
  async getAggregatedStats(filters = {}) {
    const cacheKey = `stats-${JSON.stringify(filters)}`;
    
    // ✅ Verificar cache primero (TTL más largo para stats)
    const cached = firestoreCache.get(cacheKey);
    if (cached) {
      performanceLogger.logCacheHit('aggregated-stats', cacheKey);
      return cached;
    }

    // 🎯 Construir consulta optimizada para estadísticas
    const optimizedQuery = await this.buildOptimizedCommitmentsQuery(filters, { pageSize: 1000 });
    const snapshot = await getDocs(optimizedQuery);

    // 📊 Procesar estadísticas localmente (una sola consulta)
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate ? doc.data().dueDate.toDate() : new Date(doc.data().dueDate)
    }));

    const stats = this.calculateStats(docs);
    
    // 💾 Cache con TTL más largo (5 minutos)
    firestoreCache.set(cacheKey, stats, 5 * 60 * 1000);
    performanceLogger.logFirebaseRead('aggregated-stats', docs.length);

    return stats;
  }

  /**
   * Calcula estadísticas localmente para evitar múltiples consultas
   */
  calculateStats(docs) {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return {
      total: docs.length,
      paid: docs.filter(doc => doc.paid).length,
      pending: docs.filter(doc => !doc.paid).length,
      overdue: docs.filter(doc => !doc.paid && doc.dueDate < today).length,
      dueSoon: docs.filter(doc => 
        !doc.paid && 
        doc.dueDate > today && 
        doc.dueDate <= threeDaysFromNow
      ).length,
      totalAmount: docs.reduce((sum, doc) => sum + (doc.amount || 0), 0),
      paidAmount: docs.filter(doc => doc.paid).reduce((sum, doc) => sum + (doc.amount || 0), 0)
    };
  }

  /**
   * Prefetch inteligente basado en patrones de uso
   * @param {Object} currentFilters - Filtros actuales
   */
  async intelligentPrefetch(currentFilters) {
    const { companyId, year } = currentFilters;
    
    // 🎯 Prefetch páginas siguientes si hay patrones de navegación secuencial
    if (companyId && year) {
      const prefetchFilters = { ...currentFilters };
      
      // Prefetch del año siguiente si estamos cerca del final del año actual
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 10) { // Noviembre/Diciembre
        const nextYear = (parseInt(year) + 1).toString();
        const nextYearFilters = { ...currentFilters, year: nextYear };
        
        // Ejecutar prefetch en background (sin await)
        this.buildOptimizedCommitmentsQuery(nextYearFilters, { pageSize: 5 })
          .then(query => getDocs(query))
          .then(snapshot => {
            const cacheKey = `prefetch-${JSON.stringify(nextYearFilters)}`;
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            firestoreCache.set(cacheKey, docs, 10 * 60 * 1000); // 10 minutos
            console.log('🚀 Prefetch completado para año siguiente');
          })
          .catch(error => console.log('Prefetch error (ignorado):', error));
      }
    }
  }
}

// 🎯 Instancia global del optimizador
export const queryOptimizer = new FirestoreQueryOptimizer();

export default FirestoreQueryOptimizer;
