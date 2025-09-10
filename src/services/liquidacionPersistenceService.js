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
   * Extrae la fecha del período de liquidación de los datos consolidados procesados
   * @param {Array} consolidatedData - Datos consolidados procesados (no el archivo original)
   * @returns {Object} - { periodoLiquidacion, fechaProcesamiento }
   */
  extractPeriodoInfo(consolidatedData) {
    if (!consolidatedData || !Array.isArray(consolidatedData) || consolidatedData.length === 0) {
      throw new Error('No hay datos consolidados para extraer el período');
    }

    console.log('🔍 Buscando período en datos consolidados con', consolidatedData.length, 'filas');

    let periodoDetectado = null;
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    // Buscar en la columna "periodo" de los datos consolidados
    for (let i = 0; i < consolidatedData.length; i++) {
      const row = consolidatedData[i];
      if (!row) continue;

      // Buscar específicamente la columna de período
      const periodoValue = row.periodo || row.Periodo || row.PERIODO || 
                          row.period || row.Period || row.PERIOD;
      
      if (periodoValue) {
        const valorStr = periodoValue.toString().toLowerCase();
        console.log(`� Encontrada columna periodo [${i}]:`, valorStr);

        // Buscar patrones de fecha en el valor del período
        const patronesFecha = [
          // Patrón 1: "mes año" o "mes de año"
          /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(de\s*)?(\d{4})/i,
          // Patrón 2: formato numérico MM/YYYY o MM-YYYY
          /(\d{1,2})[\/\-](\d{4})/,
          // Patrón 3: solo el nombre del mes
          /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
        ];

        for (let j = 0; j < patronesFecha.length; j++) {
          const patron = patronesFecha[j];
          const match = valorStr.match(patron);
          if (match) {
            console.log('✅ Encontrado patrón de fecha en período:', match);
            
            if (j === 1) { // Formato numérico MM/YYYY
              const mes = parseInt(match[1]) - 1; // JavaScript months are 0-indexed
              const año = parseInt(match[2]);
              if (mes >= 0 && mes <= 11 && año >= 2020) {
                periodoDetectado = {
                  mes: meses[mes],
                  año: año
                };
                console.log('📅 Período detectado (numérico):', periodoDetectado);
                break;
              }
            } else if (match[1] && meses.includes(match[1].toLowerCase())) {
              // Formato texto
              const año = match[3] ? parseInt(match[3]) : new Date().getFullYear();
              periodoDetectado = {
                mes: match[1].toLowerCase(),
                año: año
              };
              console.log('📅 Período detectado (texto):', periodoDetectado);
              break;
            }
          }
        }
        
        if (periodoDetectado) break;
      }
    }

    // Si no se encontró en columna período, buscar en fecha de reporte del primer registro
    if (!periodoDetectado && consolidatedData.length > 0) {
      console.log('🔍 Buscando en fecha de reporte del primer registro...');
      const firstRow = consolidatedData[0];
      const fechaReporte = firstRow.fechaReporte || firstRow.fecha || firstRow.date;
      
      if (fechaReporte) {
        console.log('📅 Fecha de reporte encontrada:', fechaReporte);
        const fechaStr = fechaReporte.toString();
        
        // Si es una fecha válida, extraer mes y año
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime())) {
          periodoDetectado = {
            mes: meses[fecha.getMonth()],
            año: fecha.getFullYear()
          };
          console.log('📅 Período extraído de fecha de reporte:', periodoDetectado);
        }
      }
    }

    // Fallback: usar el mes actual
    if (!periodoDetectado) {
      console.log('⚠️ No se detectó período, usando mes actual como fallback');
      const now = new Date();
      periodoDetectado = {
        mes: meses[now.getMonth()],
        año: now.getFullYear()
      };
    }

    console.log('🎯 Período final seleccionado:', periodoDetectado);

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
      const fileName = `liquidaciones/${liquidacionId}/original_${Date.now()}_${file.name}`;
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
   * Sube el archivo de tarifas a Firebase Storage
   * @param {File} file - Archivo de tarifas
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Promise<Object>} - Información del archivo
   */
  async uploadTarifasFile(file, liquidacionId) {
    try {
      const fileName = `liquidaciones/${liquidacionId}/tarifas_${Date.now()}_${file.name}`;
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
      console.error('Error subiendo archivo de tarifas:', error);
      throw new Error(`Error al subir archivo de tarifas: ${error.message}`);
    }
  }

  /**
   * Guarda solo los archivos originales y metadatos básicos
   * @param {Object} liquidacionData - Datos de la liquidación
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
        originalFile,
        archivoTarifas // Nuevo: segundo archivo si existe
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

      // Subir archivo de tarifas si existe
      let archivoTarifasInfo = null;
      if (archivoTarifas) {
        archivoTarifasInfo = await this.uploadTarifasFile(archivoTarifas, liquidacionId);
      }

      // Preparar metadatos detallados para Firestore
      const liquidacionDoc = {
        id: liquidacionId,
        userId,
        
        // Información de la empresa
        empresa: {
          nombre: empresa,
          normalizado: empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        },
        
        // Información temporal detallada
        fechas: {
          // El período que se está liquidando (ej: "junio_2025")
          periodoLiquidacion: periodoInfo.periodoLiquidacion,
          mesLiquidacion: periodoInfo.mesLiquidacion,
          añoLiquidacion: periodoInfo.añoLiquidacion,
          
          // Cuándo se procesa la liquidación (fecha actual)
          fechaProcesamiento: periodoInfo.fechaProcesamiento,
          timestampProcesamiento: new Date().getTime(),
          
          // Timestamps de Firebase
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        
        // Enlaces de Storage para los archivos
        archivos: {
          // Archivo principal de liquidación
          archivoOriginal: {
            url: fileInfo.downloadURL,
            nombre: fileInfo.originalName,
            nombreStorage: fileInfo.fileName,
            tamaño: fileInfo.size,
            tipo: fileInfo.type,
            fechaSubida: new Date().toISOString()
          },
          
          // Archivo de tarifas (opcional)
          archivoTarifas: archivoTarifasInfo ? {
            url: archivoTarifasInfo.downloadURL,
            nombre: archivoTarifasInfo.originalName,
            nombreStorage: archivoTarifasInfo.fileName,
            tamaño: archivoTarifasInfo.size,
            tipo: archivoTarifasInfo.type,
            fechaSubida: new Date().toISOString()
          } : null,
          
          // Resumen de archivos
          totalArchivos: archivoTarifasInfo ? 2 : 1,
          tiposProcesados: archivoTarifasInfo ? ['liquidacion', 'tarifas'] : ['liquidacion']
        },
        
        // Métricas exactas del dashboard (como aparece en la imagen)
        metricas: {
          // Métrica 1: Máquinas Consolidadas (icono dados azul)
          maquinasConsolidadas: metricsData?.totalMaquinas || consolidatedData?.length || 0,
          
          // Métrica 2: Total Establecimientos (icono edificio)
          totalEstablecimientos: metricsData?.totalEstablecimientos || 
            (reporteBySala ? [...new Set(reporteBySala.map(r => r.establecimiento))].length : 0),
          
          // Métrica 3: Total Producción (icono tendencia verde)
          totalProduccion: metricsData?.totalProduccion || 
            (consolidatedData?.reduce((sum, r) => sum + (Number(r.produccion) || 0), 0) || 0),
          
          // Métrica 4: Derechos de Explotación (icono gráfico naranja)
          derechosExplotacion: metricsData?.totalDerechos || 
            (consolidatedData?.reduce((sum, r) => sum + (Number(r.derechosExplotacion) || 0), 0) || 0),
          
          // Métrica 5: Gastos de Administración (icono documento azul)
          gastosAdministracion: metricsData?.totalGastos || 
            (consolidatedData?.reduce((sum, r) => sum + (Number(r.gastosAdministracion) || 0), 0) || 0),
          
          // Métrica 6: Total Impuestos (icono lista roja) = Derechos + Gastos
          totalImpuestos: metricsData?.totalImpuestos || 
            ((metricsData?.totalDerechos || 0) + (metricsData?.totalGastos || 0)) ||
            ((consolidatedData?.reduce((sum, r) => sum + (Number(r.derechosExplotacion) || 0), 0) || 0) + 
             (consolidatedData?.reduce((sum, r) => sum + (Number(r.gastosAdministracion) || 0), 0) || 0)),
          
          // Indicadores adicionales
          tieneTarifasFijas: Boolean(tarifasOficiales && Object.keys(tarifasOficiales).length > 0),
          tieneArchivoTarifas: Boolean(archivoTarifas)
        },

        // Indicadores de procesamiento y validación
        procesamiento: {
          fueCorregidoConTarifas: Boolean(archivoTarifas),
          requiereProcesamiento: true, // Flag para indicar que necesita procesamiento al cargar
          versionProcesamiento: "2.0", // Para futuras migraciones
          tipoLiquidacion: archivoTarifas ? 'con_tarifas_corregidas' : 'solo_archivo_principal',
          validado: true, // Se asume validado si llegó hasta aquí
          fechaValidacion: new Date().toISOString()
        },
        
        // Metadatos para consultas y filtros
        metadatos: {
          // Para facilitar búsquedas y filtros
          empresaNormalizada: empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          añoMes: `${periodoInfo.añoLiquidacion}_${String(new Date(Date.parse(periodoInfo.mesLiquidacion + " 1, 2000")).getMonth() + 1).padStart(2, '0')}`,
          usuarioEmpresa: `${userId}_${empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
          
          // Tags para categorización
          tags: [
            periodoInfo.mesLiquidacion,
            periodoInfo.añoLiquidacion.toString(),
            empresa.toLowerCase(),
            archivoTarifas ? 'con_tarifas' : 'sin_tarifas'
          ]
        }
      };

      // Guardar documento principal en Firestore
      await setDoc(doc(db, 'liquidaciones', liquidacionId), liquidacionDoc);

      console.log('✅ LIQUIDACIÓN GUARDADA EXITOSAMENTE');
      console.log('📋 RESUMEN DE DATOS GUARDADOS:');
      console.log(`   🏢 Empresa: ${empresa}`);
      console.log(`   📅 Período Liquidado: ${periodoInfo.mesLiquidacion} ${periodoInfo.añoLiquidacion}`);
      console.log(`   🗓️ Fecha Procesamiento: ${periodoInfo.fechaProcesamiento}`);
      console.log(`   📊 Métricas guardadas:`);
      console.log(`      - Máquinas: ${liquidacionDoc.metricas.maquinasConsolidadas}`);
      console.log(`      - Establecimientos: ${liquidacionDoc.metricas.totalEstablecimientos}`);
      console.log(`      - Producción: $${liquidacionDoc.metricas.totalProduccion.toLocaleString()}`);
      console.log(`      - Derechos: $${liquidacionDoc.metricas.derechosExplotacion.toLocaleString()}`);
      console.log(`      - Gastos: $${liquidacionDoc.metricas.gastosAdministracion.toLocaleString()}`);
      console.log(`      - Total Impuestos: $${liquidacionDoc.metricas.totalImpuestos.toLocaleString()}`);
      console.log(`   📁 Archivos en Storage:`);
      console.log(`      - Principal: ${fileInfo.originalName}`);
      if (archivoTarifasInfo) {
        console.log(`      - Tarifas: ${archivoTarifasInfo.originalName}`);
      }
      console.log(`   🆔 ID Liquidación: ${liquidacionId}`);

      return liquidacionId;
    } catch (error) {
      console.error('Error guardando liquidación:', error);
      throw new Error(`Error al guardar liquidación: ${error.message}`);
    }
  }

  /**
   * Obtiene solo las métricas de una liquidación (sin procesar archivos)
   * Útil para mostrar en listas y históricos
   * @param {string} liquidacionId - ID de la liquidación
   * @returns {Promise<Object|null>} - Métricas de la liquidación
   */
  async getLiquidacionMetrics(liquidacionId) {
    try {
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          empresa: data.empresa,
          fechas: data.fechas,
          metricas: data.metricas,
          archivos: {
            totalArchivos: data.archivos.totalArchivos,
            tiposProcesados: data.archivos.tiposProcesados
          },
          procesamiento: data.procesamiento,
          metadatos: data.metadatos
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo métricas de liquidación:', error);
      throw new Error(`Error al obtener métricas: ${error.message}`);
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
   * Obtiene métricas consolidadas por empresa para un período específico
   * @param {string} userId - ID del usuario
   * @param {string} empresa - Nombre de la empresa (opcional)
   * @param {string} año - Año para filtrar (opcional)
   * @returns {Promise<Object>} - Métricas consolidadas
   */
  async getMetricasConsolidadas(userId, empresa = null, año = null) {
    try {
      // Construir consulta base
      let q = query(
        collection(db, 'liquidaciones'),
        where('userId', '==', userId)
      );

      // Aplicar filtros adicionales si se proporcionan
      if (empresa) {
        q = query(q, where('empresa.normalizado', '==', empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()));
      }

      const querySnapshot = await getDocs(q);
      const liquidaciones = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filtrar por año si se especifica
        if (año && data.fechas.añoLiquidacion !== parseInt(año)) {
          return;
        }
        
        liquidaciones.push({
          id: doc.id,
          ...data
        });
      });

      // Calcular métricas consolidadas
      const consolidado = {
        totalLiquidaciones: liquidaciones.length,
        empresas: [...new Set(liquidaciones.map(l => l.empresa.nombre))],
        periodos: [...new Set(liquidaciones.map(l => l.fechas.periodoLiquidacion))],
        
        // Métricas totales
        metricasTotales: {
          maquinasConsolidadas: liquidaciones.reduce((sum, l) => sum + (l.metricas.maquinasConsolidadas || 0), 0),
          totalEstablecimientos: liquidaciones.reduce((sum, l) => sum + (l.metricas.totalEstablecimientos || 0), 0),
          totalProduccion: liquidaciones.reduce((sum, l) => sum + (l.metricas.totalProduccion || 0), 0),
          derechosExplotacion: liquidaciones.reduce((sum, l) => sum + (l.metricas.derechosExplotacion || 0), 0),
          gastosAdministracion: liquidaciones.reduce((sum, l) => sum + (l.metricas.gastosAdministracion || 0), 0),
          totalImpuestos: liquidaciones.reduce((sum, l) => sum + (l.metricas.totalImpuestos || 0), 0)
        },

        // Detalle por liquidación
        detalleLiquidaciones: liquidaciones.map(l => ({
          id: l.id,
          empresa: l.empresa.nombre,
          periodo: l.fechas.periodoLiquidacion,
          fechaProcesamiento: l.fechas.fechaProcesamiento,
          metricas: l.metricas,
          totalArchivos: l.archivos.totalArchivos
        }))
      };

      return consolidado;
    } catch (error) {
      console.error('Error obteniendo métricas consolidadas:', error);
      throw new Error(`Error al obtener métricas consolidadas: ${error.message}`);
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
   * Carga una liquidación y procesa los archivos originales bajo demanda
   * @param {string} liquidacionId - ID de la liquidación
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @param {Function} processingFunction - Función de procesamiento de la página
   * @returns {Promise<Object>} - Datos completos procesados
   */
  async loadAndProcessLiquidacion(liquidacionId, userId, processingFunction) {
    try {
      // 1. Obtener metadatos de la liquidación
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Liquidación no encontrada');
      }

      const liquidacionData = docSnap.data();

      // 2. Verificar permisos
      if (liquidacionData.userId !== userId) {
        throw new Error('No tienes permisos para acceder a esta liquidación');
      }

      // 3. Descargar archivos originales de Storage
      console.log('📁 Descargando archivos originales...');
      
      // Archivo principal
      const originalFileResponse = await fetch(liquidacionData.archivoOriginal.downloadURL);
      const originalFileBlob = await originalFileResponse.blob();
      const originalFile = new File([originalFileBlob], liquidacionData.archivoOriginal.originalName, {
        type: liquidacionData.archivoOriginal.type
      });

      // Archivo de tarifas (si existe)
      let tarifasFile = null;
      if (liquidacionData.archivoTarifas) {
        console.log('📄 Descargando archivo de tarifas...');
        const tarifasResponse = await fetch(liquidacionData.archivoTarifas.downloadURL);
        const tarifasBlob = await tarifasResponse.blob();
        tarifasFile = new File([tarifasBlob], liquidacionData.archivoTarifas.originalName, {
          type: liquidacionData.archivoTarifas.type
        });
      }

      // 4. Procesar archivos con la misma lógica de la página
      console.log('⚙️ Procesando archivos originales...');
      const processedData = await processingFunction(originalFile, tarifasFile);

      // 5. Retornar datos completos
      return {
        metadata: liquidacionData,
        originalFile,
        tarifasFile,
        ...processedData
      };

    } catch (error) {
      console.error('Error cargando y procesando liquidación:', error);
      throw new Error(`Error al cargar liquidación: ${error.message}`);
    }
  }

  /**
   * Carga una liquidación y procesa los archivos originales en tiempo real
   * @param {string} liquidacionId - ID de la liquidación
   * @param {string} userId - ID del usuario
   * @param {Function} processingFunction - Función de procesamiento a aplicar
   * @returns {Promise<Object>} - Datos procesados en tiempo real
   */
  async loadAndProcessLiquidacion(liquidacionId, userId, processingFunction) {
    try {
      console.log('📥 Cargando liquidación:', liquidacionId);
      
      // 1. Obtener metadatos
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Liquidación no encontrada');
      }

      const liquidacionData = docSnap.data();

      // 2. Verificar permisos
      if (liquidacionData.userId !== userId) {
        throw new Error('No tienes permisos para acceder a esta liquidación');
      }

      // 3. Descargar archivos originales de Storage
      console.log('📁 Descargando archivo original...');
      const originalResponse = await fetch(liquidacionData.archivoOriginal.downloadURL);
      const originalBlob = await originalResponse.blob();
      const originalFile = new File([originalBlob], liquidacionData.archivoOriginal.originalName, {
        type: liquidacionData.archivoOriginal.type
      });

      // Archivo de tarifas (si existe)
      let tarifasFile = null;
      if (liquidacionData.archivoTarifas) {
        console.log('📄 Descargando archivo de tarifas...');
        const tarifasResponse = await fetch(liquidacionData.archivoTarifas.downloadURL);
        const tarifasBlob = await tarifasResponse.blob();
        tarifasFile = new File([tarifasBlob], liquidacionData.archivoTarifas.originalName, {
          type: liquidacionData.archivoTarifas.type
        });
      }

      // 4. Procesar archivos con la misma lógica de la página
      console.log('⚙️ Procesando archivos originales...');
      const processedData = await processingFunction(originalFile, tarifasFile);

      // 5. Retornar datos completos
      return {
        metadata: liquidacionData,
        originalFile,
        tarifasFile,
        ...processedData
      };

    } catch (error) {
      console.error('Error cargando y procesando liquidación:', error);
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

      // Eliminar archivos de Storage
      const deletePromises = [];
      
      // Archivo original
      if (liquidacionData.archivoOriginal?.fileName) {
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivoOriginal.fileName))
            .catch(error => console.warn('Error eliminando archivo original:', error))
        );
      }

      // Archivo de tarifas (si existe)
      if (liquidacionData.archivoTarifas?.fileName) {
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivoTarifas.fileName))
            .catch(error => console.warn('Error eliminando archivo de tarifas:', error))
        );
      }

      await Promise.all(deletePromises);

      // Eliminar documento principal (ya no hay subcolecciones)
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
