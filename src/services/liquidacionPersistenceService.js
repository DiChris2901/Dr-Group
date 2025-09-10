/**
 * Servicio para manejar la persistencia de liquidaciones en Firebase
 * 
 * IMPORTANTE - GESTIÓN TEMPORAL:
 * Este servicio considera la diferencia temporal entre el período de liquidación 
 * y la fecha de procesamiento:
 * 
 * - Período de Liquidación: El mes que se está liquidando (ej: Junio 2025)
 * - Fecha de Procesamiento: Cuándo se procesa realmente (ej: Julio 2025)
 * 
 * Ejemplo:
 * - En Julio 2025 se procesa la liquidación de Junio 2025
 * - En Agosto 2025 se procesa la liquidación de Julio 2025
 * 
 * El servicio extrae automáticamente el período del archivo y mantiene
 * ambas fechas para consultas y organización correcta.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

/**
 * Servicio para manejar la persistencia de liquidaciones en Firebase
 * Maneja la diferencia temporal: archivo del mes X procesado en mes X+1
 */
class LiquidacionPersistenceService {
  
  /**
   * Extrae la fecha del período de liquidación del archivo
   * @param {Array} originalData - Datos originales del archivo
   * @returns {Object} - { periodoLiquidacion, fechaProcesamiento }
   */
  extractPeriodoInfo(originalData) {
    if (!originalData || !Array.isArray(originalData) || originalData.length === 0) {
      throw new Error('No hay datos para extraer el período');
    }

    // Buscar indicadores de fecha en el archivo
    const fechaIndicadores = [
      'fecha', 'Fecha', 'FECHA',
      'mes', 'Mes', 'MES', 
      'periodo', 'Periodo', 'PERIODO',
      'liquidacion', 'Liquidacion', 'LIQUIDACION'
    ];

    let periodoDetectado = null;
    
    // Buscar en headers o primeras filas
    for (const row of originalData.slice(0, 10)) {
      for (const [key, value] of Object.entries(row)) {
        if (fechaIndicadores.some(indicator => key.toLowerCase().includes(indicator.toLowerCase()))) {
          if (value && typeof value === 'string') {
            // Intentar extraer mes y año
            const fechaMatch = value.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(de\s*)?(\d{4})/i);
            if (fechaMatch) {
              periodoDetectado = {
                mes: fechaMatch[1].toLowerCase(),
                año: parseInt(fechaMatch[3])
              };
              break;
            }
          }
        }
      }
      if (periodoDetectado) break;
    }

    // Si no se detectó en headers, buscar en cualquier celda
    if (!periodoDetectado) {
      for (const row of originalData) {
        for (const value of Object.values(row)) {
          if (value && typeof value === 'string') {
            const fechaMatch = value.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(de\s*)?(\d{4})/i);
            if (fechaMatch) {
              periodoDetectado = {
                mes: fechaMatch[1].toLowerCase(),
                año: parseInt(fechaMatch[3])
              };
              break;
            }
          }
        }
        if (periodoDetectado) break;
      }
    }

    if (!periodoDetectado) {
      // Fallback: usar mes anterior al actual
      const now = new Date();
      const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      periodoDetectado = {
        mes: meses[mesAnterior.getMonth()],
        año: mesAnterior.getFullYear()
      };
    }

    return {
      periodoLiquidacion: `${periodoDetectado.mes}_${periodoDetectado.año}`,
      mesLiquidacion: periodoDetectado.mes,
      añoLiquidacion: periodoDetectado.año,
      fechaProcesamiento: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };
  }

  /**
   * Genera un ID único para la liquidación
   * @param {string} empresa - Nombre de la empresa
   * @param {string} periodoLiquidacion - Período de liquidación
   * @param {string} userId - ID del usuario
   * @returns {string} - ID único
   */
  generateLiquidacionId(empresa, periodoLiquidacion, userId) {
    const empresaClean = empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    return `${empresaClean}_${periodoLiquidacion}_${userId}_${timestamp}`;
  }

  /**
   * Sube el archivo original a Firebase Storage
   * @param {File} file - Archivo original
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Promise<string>} - URL de descarga
   */
  async uploadOriginalFile(file, liquidacionId) {
    try {
      const fileName = `liquidaciones/${liquidacionId}/original_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        downloadURL,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error subiendo archivo original:', error);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }
  }

  /**
   * Guarda los datos procesados de la liquidación
   * @param {Object} liquidacionData - Datos completos de la liquidación
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} - ID de la liquidación guardada
   */
  async saveLiquidacion(liquidacionData, userId) {
    try {
      const {
        empresa,
        originalData,
        consolidatedData,
        reporteBySala,
        metricsData,
        tarifasOficiales,
        originalFile
      } = liquidacionData;

      // Extraer información del período
      const periodoInfo = this.extractPeriodoInfo(originalData);
      
      // Generar ID único
      const liquidacionId = this.generateLiquidacionId(
        empresa, 
        periodoInfo.periodoLiquidacion, 
        userId
      );

      // Subir archivo original a Storage
      const fileInfo = await this.uploadOriginalFile(originalFile, liquidacionId);

      // Preparar metadatos para Firestore
      const liquidacionDoc = {
        id: liquidacionId,
        userId,
        empresa,
        periodoLiquidacion: periodoInfo.periodoLiquidacion,
        mesLiquidacion: periodoInfo.mesLiquidacion,
        añoLiquidacion: periodoInfo.añoLiquidacion,
        fechaProcesamiento: periodoInfo.fechaProcesamiento,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Información del archivo
        archivoOriginal: fileInfo,
        
        // Estadísticas generales
        estadisticas: {
          totalMaquinas: consolidatedData?.length || 0,
          totalEstablecimientos: reporteBySala ? 
            [...new Set(reporteBySala.map(r => r.establecimiento))].length : 0,
          produccionTotal: consolidatedData?.reduce((sum, r) => sum + (Number(r.produccion) || 0), 0) || 0,
          tieneTarifasFijas: Boolean(tarifasOficiales && Object.keys(tarifasOficiales).length > 0)
        },

        // Metadatos de procesamiento
        procesamiento: {
          tieneConsolidatedData: Boolean(consolidatedData),
          tieneReporteBySala: Boolean(reporteBySala),
          tieneMetricsData: Boolean(metricsData),
          tieneTarifasOficiales: Boolean(tarifasOficiales)
        }
      };

      // Guardar documento principal en Firestore
      await setDoc(doc(db, 'liquidaciones', liquidacionId), liquidacionDoc);

      // Guardar datos procesados en subcolecciones para mejor organización
      if (consolidatedData && consolidatedData.length > 0) {
        await setDoc(
          doc(db, 'liquidaciones', liquidacionId, 'datos', 'consolidated'), 
          { data: consolidatedData, timestamp: serverTimestamp() }
        );
      }

      if (reporteBySala && reporteBySala.length > 0) {
        await setDoc(
          doc(db, 'liquidaciones', liquidacionId, 'datos', 'reporteBySala'), 
          { data: reporteBySala, timestamp: serverTimestamp() }
        );
      }

      if (metricsData) {
        await setDoc(
          doc(db, 'liquidaciones', liquidacionId, 'datos', 'metrics'), 
          { data: metricsData, timestamp: serverTimestamp() }
        );
      }

      if (tarifasOficiales && Object.keys(tarifasOficiales).length > 0) {
        await setDoc(
          doc(db, 'liquidaciones', liquidacionId, 'datos', 'tarifasOficiales'), 
          { data: tarifasOficiales, timestamp: serverTimestamp() }
        );
      }

      return liquidacionId;
    } catch (error) {
      console.error('Error guardando liquidación:', error);
      throw new Error(`Error al guardar liquidación: ${error.message}`);
    }
  }

  /**
   * Obtiene una liquidación específica por ID
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Promise<Object|null>} - Datos de la liquidación o null si no existe
   */
  async getLiquidacionById(liquidacionId) {
    try {
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo liquidación:', error);
      throw new Error(`Error al obtener liquidación: ${error.message}`);
    }
  }

  /**
   * Obtiene el historial de liquidaciones del usuario
   * @param {string} userId - ID del usuario
   * @param {number} limitCount - Límite de resultados
   * @returns {Promise<Array>} - Lista de liquidaciones
   */
  async getUserLiquidaciones(userId, limitCount = 20) {
    try {
      // Consulta simplificada para evitar índices compuestos
      const q = query(
        collection(db, 'liquidaciones'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const liquidaciones = [];

      querySnapshot.forEach((doc) => {
        liquidaciones.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar en el cliente por fecha de creación (más recientes primero)
      liquidaciones.sort((a, b) => {
        // Si tienen timestamp, usar eso
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        // Fallback: ordenar por ID (que incluye timestamp)
        return b.id.localeCompare(a.id);
      });

      return liquidaciones;
    } catch (error) {
      console.error('Error obteniendo liquidaciones:', error);
      throw new Error(`Error al obtener liquidaciones: ${error.message}`);
    }
  }

  /**
   * Carga una liquidación específica con todos sus datos
   * @param {string} liquidacionId - ID de la liquidación
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Promise<Object>} - Datos completos de la liquidación
   */
  async loadLiquidacion(liquidacionId, userId) {
    try {
      // Obtener documento principal
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Liquidación no encontrada');
      }

      const liquidacionData = docSnap.data();

      // Verificar permisos
      if (liquidacionData.userId !== userId) {
        throw new Error('No tienes permisos para acceder a esta liquidación');
      }

      // Cargar datos procesados
      const datosRefs = [
        'consolidated',
        'reporteBySala', 
        'metrics',
        'tarifasOficiales'
      ];

      const datosPromises = datosRefs.map(async (tipo) => {
        try {
          const dataDoc = await getDoc(doc(db, 'liquidaciones', liquidacionId, 'datos', tipo));
          return dataDoc.exists() ? { [tipo]: dataDoc.data().data } : {};
        } catch (error) {
          console.warn(`No se pudo cargar ${tipo}:`, error);
          return {};
        }
      });

      const datosResults = await Promise.all(datosPromises);
      const datosCompletos = datosResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});

      return {
        ...liquidacionData,
        ...datosCompletos
      };
    } catch (error) {
      console.error('Error cargando liquidación:', error);
      throw new Error(`Error al cargar liquidación: ${error.message}`);
    }
  }

  /**
   * Elimina una liquidación completa
   * @param {string} liquidacionId - ID de la liquidación
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async deleteLiquidacion(liquidacionId, userId) {
    try {
      // Verificar permisos
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Liquidación no encontrada');
      }

      const liquidacionData = docSnap.data();
      if (liquidacionData.userId !== userId) {
        throw new Error('No tienes permisos para eliminar esta liquidación');
      }

      // Eliminar archivo de Storage
      if (liquidacionData.archivoOriginal?.fileName) {
        try {
          const fileRef = ref(storage, liquidacionData.archivoOriginal.fileName);
          await deleteObject(fileRef);
        } catch (error) {
          console.warn('Error eliminando archivo de Storage:', error);
        }
      }

      // Eliminar subcolecciones de datos
      const datosRefs = ['consolidated', 'reporteBySala', 'metrics', 'tarifasOficiales'];
      
      const deletePromises = datosRefs.map(async (tipo) => {
        try {
          await deleteDoc(doc(db, 'liquidaciones', liquidacionId, 'datos', tipo));
        } catch (error) {
          console.warn(`Error eliminando ${tipo}:`, error);
        }
      });

      await Promise.all(deletePromises);

      // Eliminar documento principal
      await deleteDoc(docRef);

    } catch (error) {
      console.error('Error eliminando liquidación:', error);
      throw new Error(`Error al eliminar liquidación: ${error.message}`);
    }
  }

  /**
   * Busca liquidaciones por período específico
   * @param {string} userId - ID del usuario
   * @param {string} mes - Mes de liquidación
   * @param {number} año - Año de liquidación
   * @returns {Promise<Array>} - Liquidaciones del período
   */
  async getLiquidacionesByPeriodo(userId, mes, año) {
    try {
      const q = query(
        collection(db, 'liquidaciones'),
        where('userId', '==', userId),
        where('mesLiquidacion', '==', mes.toLowerCase()),
        where('añoLiquidacion', '==', año),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const liquidaciones = [];

      querySnapshot.forEach((doc) => {
        liquidaciones.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return liquidaciones;
    } catch (error) {
      console.error('Error buscando liquidaciones por período:', error);
      throw new Error(`Error al buscar liquidaciones: ${error.message}`);
    }
  }
}

export default new LiquidacionPersistenceService();
