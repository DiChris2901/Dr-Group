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
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getBlob 
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
   * 🆕 NUEVO: Guarda automáticamente liquidaciones separadas por sala
   * Se ejecuta automáticamente después de guardar la liquidación completa
   * @param {Object} liquidacionData - Datos originales de la liquidación
   * @param {string} userId - ID del usuario
   * @param {string} liquidacionOriginalId - ID de la liquidación completa (referencia)
   * @param {Object} liquidacionCompleta - Documento completo de la liquidación
   */
  async saveLiquidacionesPorSala(liquidacionData, userId, liquidacionOriginalId, liquidacionCompleta) {
    try {
      console.log('🏢 INICIO saveLiquidacionesPorSala');
      console.log('📊 liquidacionData recibida:', {
        hasReporteBySala: Boolean(liquidacionData?.reporteBySala),
        reporteBySalaLength: liquidacionData?.reporteBySala?.length || 0,
        empresa: liquidacionData?.empresa,
        hasConsolidatedData: Boolean(liquidacionData?.consolidatedData),
        consolidatedDataLength: liquidacionData?.consolidatedData?.length || 0
      });
      
      const { reporteBySala, empresa, consolidatedData } = liquidacionData;
      
      if (!reporteBySala || !Array.isArray(reporteBySala) || reporteBySala.length === 0) {
        console.log('⚠️ No hay datos por sala para guardar - reporteBySala:', reporteBySala);
        return [];
      }

      console.log(`🏢 Guardando ${reporteBySala.length} liquidaciones por sala...`);
      console.log('📋 Salas encontradas:', reporteBySala.map(s => s.establecimiento));
      
      const salaIds = [];
      
      // Procesar cada sala individualmente
      for (const sala of reporteBySala) {
        try {
          // 🔍 BUSCAR EMPRESA CORRECTA DESDE FIRESTORE PARA ESTA SALA
          let empresaSala = liquidacionCompleta.empresa; // Valor por defecto
          
          try {
            // Buscar la sala en Firestore para obtener su companyId real
            const normalizarNombre = (texto) => {
              return texto
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' ');
            };
            
            const nombreSalaNormalizado = normalizarNombre(sala.establecimiento);
            const salasSnapshot = await getDocs(collection(db, 'salas'));
            
            let salaEncontrada = null;
            for (const salaDoc of salasSnapshot.docs) {
              const salaData = salaDoc.data();
              const nombreDB = normalizarNombre(salaData.nombre || salaData.name || '');
              
              if (nombreDB === nombreSalaNormalizado) {
                salaEncontrada = { id: salaDoc.id, ...salaData };
                break;
              }
            }
            
            // Si encontramos la sala, cargar su empresa real
            if (salaEncontrada && salaEncontrada.companyId) {
              const empresaDoc = await getDoc(doc(db, 'companies', salaEncontrada.companyId));
              if (empresaDoc.exists()) {
                const empresaData = empresaDoc.data();
                empresaSala = {
                  id: empresaDoc.id,
                  nombre: empresaData.name || empresaData.nombre,
                  normalizado: (empresaData.name || empresaData.nombre).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
                };
                console.log(`✅ Empresa correcta cargada para ${sala.establecimiento}: ${empresaSala.nombre}`);
              }
            } else {
              console.warn(`⚠️ No se encontró sala en Firestore: ${sala.establecimiento}, usando empresa por defecto`);
            }
          } catch (errorEmpresa) {
            console.error(`❌ Error cargando empresa para sala ${sala.establecimiento}:`, errorEmpresa);
            // Continuar con empresa por defecto
          }
          
          // Generar ID único para esta sala
          const salaId = this.generateLiquidacionSalaId(
            empresa, 
            sala.establecimiento, 
            liquidacionCompleta.fechas.periodoLiquidacion, 
            userId
          );

          // Filtrar datos consolidados solo para esta sala
          const datosSala = consolidatedData.filter(
            maquina => maquina.establecimiento === sala.establecimiento
          );

          // Calcular métricas específicas de la sala
          const metricasSala = {
            totalMaquinas: datosSala.length,
            totalProduccion: datosSala.reduce((sum, m) => sum + (Number(m.produccion) || 0), 0),
            derechosExplotacion: datosSala.reduce((sum, m) => sum + (Number(m.derechosExplotacion) || 0), 0),
            gastosAdministracion: datosSala.reduce((sum, m) => sum + (Number(m.gastosAdministracion) || 0), 0)
          };
          metricasSala.totalImpuestos = metricasSala.derechosExplotacion + metricasSala.gastosAdministracion;

          // Crear documento de liquidación por sala
          const liquidacionSalaDoc = {
            id: salaId,
            userId,
            
            // Referencia a la liquidación original (CORREGIDO: era liquidacionOriginalId)
            liquidacionId: liquidacionOriginalId,
            
            // Información de empresa y sala (CORREGIDO: usar empresa real de la sala)
            empresa: empresaSala,
            sala: {
              nombre: sala.establecimiento,
              normalizado: sala.establecimiento.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
            },
            
            // Misma información temporal que la liquidación original
            fechas: liquidacionCompleta.fechas,
            
            // Referencias a los mismos archivos (no duplicar en Storage)
            archivos: liquidacionCompleta.archivos,
            
            // Métricas específicas de esta sala
            metricas: metricasSala,
            
            // Datos consolidados solo de esta sala
            datosConsolidados: datosSala,
            
            // Información de la sala desde reporteBySala
            reporteSala: sala,
            
            // Estado de facturación (nuevo)
            facturacion: {
              estado: 'pendiente', // 'pendiente', 'generada', 'enviada', 'pagada'
              fechaGeneracion: null,
              fechaEnvio: null,
              fechaPago: null,
              numeroCuentaCobro: null,
              urlPdf: null
            },
            
            // Procesamiento y metadatos
            procesamiento: {
              ...liquidacionCompleta.procesamiento,
              tipoLiquidacion: 'por_sala'
            },
            
            metadatos: {
              ...liquidacionCompleta.metadatos,
              salaNormalizada: sala.establecimiento.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
              empresaSala: `${empresa}_${sala.establecimiento}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
            }
          };

          // Guardar en colección separada
          await setDoc(doc(db, 'liquidaciones_por_sala', salaId), liquidacionSalaDoc);
          salaIds.push(salaId);
          
          console.log(`✅ Sala guardada: ${sala.establecimiento} (${datosSala.length} máquinas)`);
          
        } catch (error) {
          console.error(`❌ Error guardando sala ${sala.establecimiento}:`, error);
          // Continuar con las demás salas aunque una falle
        }
      }

      console.log(`🎉 ${salaIds.length} liquidaciones por sala guardadas exitosamente`);
      return salaIds;
      
    } catch (error) {
      console.error('Error guardando liquidaciones por sala:', error);
      throw new Error(`Error al guardar liquidaciones por sala: ${error.message}`);
    }
  }

  /**
   * Genera ID único para liquidación por sala
   */
  generateLiquidacionSalaId(empresa, sala, periodo, userId) {
    const empresaNorm = empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const salaNorm = sala.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = new Date().getTime();
    return `${empresaNorm}_${salaNorm}_${periodo}_${userId}_${timestamp}`;
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
        archivoTarifas, // Nuevo: segundo archivo si existe
        periodoDetectado, // Nuevo: período detectado del modal
        periodoInfo // Nuevo: información adicional del período
      } = liquidacionData;

      // Extraer información del período
      let periodoInfoExtracted = periodoInfo;
      
      // Si no hay periodoInfo pero sí periodoDetectado del modal, parsearlo
      if (!periodoInfoExtracted && periodoDetectado) {
        try {
          const match = periodoDetectado.match(/(\w+)\s+(\d{4})/);
          if (match) {
            const mesTexto = match[1].toLowerCase();
            const año = parseInt(match[2]);
            
            periodoInfoExtracted = {
              periodoLiquidacion: `${mesTexto}_${año}`,
              mesLiquidacion: mesTexto,
              añoLiquidacion: año,
              fechaProcesamiento: new Date().toISOString().split('T')[0]
            };
            
            console.log('📅 Período parseado desde modal en servicio:', periodoInfoExtracted);
          }
        } catch (error) {
          console.error('Error parseando período del modal en servicio:', error);
        }
      }
      
      // Fallback a extractPeriodoInfo solo si no hay nada
      if (!periodoInfoExtracted) {
        periodoInfoExtracted = this.extractPeriodoInfo(originalData);
      }
      
      // Generar ID único
      const liquidacionId = this.generateLiquidacionId(
        empresa, 
        periodoInfoExtracted.periodoLiquidacion, 
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
          periodoLiquidacion: periodoInfoExtracted.periodoLiquidacion,
          mesLiquidacion: periodoInfoExtracted.mesLiquidacion,
          añoLiquidacion: periodoInfoExtracted.añoLiquidacion,
          
          // Período detectado en el modal (para mostrar en UI)
          periodoDetectadoModal: periodoDetectado || periodoInfoExtracted.periodoLiquidacion,
          
          // Cuándo se procesa la liquidación (fecha actual)
          fechaProcesamiento: periodoInfoExtracted.fechaProcesamiento,
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

      // 🆕 NUEVO: Guardar automáticamente liquidaciones separadas por sala
      console.log('🔄 Iniciando guardado de liquidaciones por sala...');
      console.log('📊 Datos disponibles para salas:');
      console.log('  - reporteBySala:', liquidacionData.reporteBySala?.length || 'No disponible');
      console.log('  - consolidatedData:', liquidacionData.consolidatedData?.length || 'No disponible');
      console.log('  - empresa:', liquidacionData.empresa || 'No disponible');
      
      try {
        const salaIds = await this.saveLiquidacionesPorSala(liquidacionData, userId, liquidacionId, liquidacionDoc);
        console.log('✅ Liquidaciones por sala guardadas exitosamente:', salaIds);
        console.log('📊 Cantidad de salas guardadas:', salaIds.length);
      } catch (error) {
        console.error('❌ ERROR CRÍTICO guardando liquidaciones por sala:');
        console.error('Error completo:', error);
        console.error('Stack trace:', error.stack);
        console.error('Datos que causaron el error:');
        console.error('  - liquidacionData keys:', Object.keys(liquidacionData));
        console.error('  - userId:', userId);
        console.error('  - liquidacionId:', liquidacionId);
        // No lanzar error para no interrumpir el flujo principal
      }

      console.log('✅ LIQUIDACIÓN GUARDADA EXITOSAMENTE');
      console.log('📋 RESUMEN DE DATOS GUARDADOS:');
      console.log(`   🏢 Empresa: ${empresa}`);
      console.log(`   📅 Período Liquidado: ${periodoInfoExtracted.mesLiquidacion} ${periodoInfoExtracted.añoLiquidacion}`);
      console.log(`   📅 Período Detectado (Modal): ${periodoDetectado || 'No especificado'}`);
      console.log(`   🗓️ Fecha Procesamiento: ${periodoInfoExtracted.fechaProcesamiento}`);
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
   * Obtiene liquidaciones con filtros opcionales (sin filtro de usuario)
   * Solo trae de Firebase lo que coincide con los filtros - EFICIENTE
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.empresa - Filtrar por empresa específica
   * @param {string} filters.mes - Filtrar por mes (ej: 'diciembre')
   * @param {number} filters.año - Filtrar por año (ej: 2025)
   * @param {Date} filters.startDate - Filtrar por fecha inicio (≥)
   * @param {Date} filters.endDate - Filtrar por fecha fin (≤)
   * @param {number} limitCount - Límite de registros (default: 100)
   * @returns {Promise<Array>} - Lista de liquidaciones filtradas
   */
  async getAllLiquidaciones(filters = {}, limitCount = 100) {
    try {
      const { empresa, mes, año, startDate, endDate } = filters;
      
      console.log('🔍 Consultando liquidaciones con filtros:', {
        empresa: empresa || 'todas',
        mes: mes || 'todos',
        año: año || 'todos',
        startDate: startDate ? startDate.toLocaleDateString() : 'sin filtro',
        endDate: endDate ? endDate.toLocaleDateString() : 'sin filtro',
        límite: limitCount
      });
      
      // Construir query dinámicamente según filtros
      let constraints = [];
      
      // Filtro por empresa (si se especifica)
      if (empresa && empresa !== 'todas') {
        // Normalizar nombre de empresa para búsqueda
        const empresaNormalizada = empresa.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        constraints.push(where('metadatos.empresaNormalizada', '==', empresaNormalizada));
      }
      
      // Filtro por mes (si se especifica)
      if (mes && mes !== 'todos') {
        constraints.push(where('fechas.mesLiquidacion', '==', mes.toLowerCase()));
      }
      
      // Filtro por año (si se especifica)
      if (año && año !== 'todos') {
        constraints.push(where('fechas.añoLiquidacion', '==', parseInt(año)));
      }
      
      // 📅 Filtro por rango de fechas (si se especifica)
      if (startDate && endDate) {
        // Convertir a Timestamp de Firebase para comparación
        const startTimestamp = new Date(startDate);
        const endTimestamp = new Date(endDate);
        endTimestamp.setHours(23, 59, 59, 999); // Fin del día
        
        console.log('📅 Filtrando por rango:', {
          inicio: startTimestamp.toLocaleDateString(),
          fin: endTimestamp.toLocaleDateString()
        });
        
        // Firebase requiere usar where con '>=' y '<=' para rangos
        // NOTA: Requiere índice compuesto si se combina con otros filtros
        constraints.push(where('fechas.createdAt', '>=', startTimestamp));
        constraints.push(where('fechas.createdAt', '<=', endTimestamp));
      }
      
      // Agregar límite
      constraints.push(limit(limitCount));
      
      // Ejecutar query
      const q = query(collection(db, 'liquidaciones'), ...constraints);
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
        if (a.fechas?.createdAt && b.fechas?.createdAt) {
          const aTime = a.fechas.createdAt.toMillis ? a.fechas.createdAt.toMillis() : 0;
          const bTime = b.fechas.createdAt.toMillis ? b.fechas.createdAt.toMillis() : 0;
          return bTime - aTime;
        }
        return b.id.localeCompare(a.id);
      });

      console.log(`✅ Cargadas ${liquidaciones.length} liquidaciones desde Firestore`);
      
      if (liquidaciones.length === limitCount) {
        console.warn(`⚠️ Se alcanzó el límite de ${limitCount} registros. Puede haber más en la BD.`);
      }
      
      return liquidaciones;
    } catch (error) {
      console.error('Error obteniendo liquidaciones:', error);
      
      // Si el error es por índice compuesto faltante, dar instrucciones
      if (error.message.includes('index') || error.message.includes('índice')) {
        console.error('❌ ERROR: Falta índice compuesto en Firestore');
        console.error('📋 SOLUCIÓN: Firebase te mostrará un link para crear el índice automáticamente');
        console.error('🔗 Busca en la consola del navegador un link que diga "create composite index"');
        console.error('⚡ Haz clic en ese link y Firebase creará el índice en ~2-3 minutos');
      }
      
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
      console.log('📥 Cargando liquidación:', liquidacionId);

      // 1. Obtener metadatos
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Liquidación no encontrada');
      }

      const liquidacionData = docSnap.data();

      // 2. Verificar permisos (por defecto: solo propietario)
      if (liquidacionData.userId && liquidacionData.userId !== userId) {
        throw new Error('No tienes permisos para acceder a esta liquidación');
      }

      // 3. Normalizar metadatos de archivos (soporte nuevo + legacy)
      const originalMeta = liquidacionData.archivos?.archivoOriginal || liquidacionData.archivoOriginal || null;
      const tarifasMeta = liquidacionData.archivos?.archivoTarifas || liquidacionData.archivoTarifas || null;

      if (!originalMeta) {
        throw new Error('No se encontró metadato de archivo original en la liquidación');
      }

      const isDevelopment =
        import.meta.env.DEV ||
        (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'));

      const resolveStoragePath = (meta) => {
        if (!meta) return null;
        // Estructura nueva
        if (meta.nombreStorage) return meta.nombreStorage;
        // Variantes legacy
        if (meta.path) return meta.path;
        if (meta.fileName) return meta.fileName;

        const possibleUrl = meta.url || meta.downloadURL;
        if (possibleUrl) {
          const match = String(possibleUrl).match(/\/o\/(.+?)\?/);
          if (match) return decodeURIComponent(match[1]);
        }
        return null;
      };

      const downloadBlob = async (storagePath, label) => {
        if (!storagePath) throw new Error(`No se pudo determinar la ruta del archivo (${label})`);

        if (isDevelopment) {
          const proxyUrl = `https://us-central1-dr-group-cd21b.cloudfunctions.net/storageProxy?path=${encodeURIComponent(storagePath)}`;
          const response = await fetch(proxyUrl, { mode: 'cors' });
          if (!response.ok) throw new Error(`Proxy error (${label}): ${response.status}`);
          return response.blob();
        }

        try {
          const fileRef = ref(storage, storagePath);
          return await getBlob(fileRef);
        } catch (corsError) {
          console.warn(`⚠️ CORS con getBlob (${label}), intentando getDownloadURL + fetch`);
          const fileRef = ref(storage, storagePath);
          const downloadUrl = await getDownloadURL(fileRef);
          const response = await fetch(downloadUrl, { mode: 'cors' });
          return response.blob();
        }
      };

      // 4. Descargar archivo original
      console.log('📁 Descargando archivo original...');
      const originalPath = resolveStoragePath(originalMeta);
      const originalBlob = await downloadBlob(originalPath, 'original');
      const originalName = originalMeta.nombre || originalMeta.originalName || 'liquidacion.xlsx';
      const originalType = originalMeta.tipo || originalMeta.type || 'application/octet-stream';
      const originalFile = new File([originalBlob], originalName, { type: originalType });

      // 5. Descargar archivo de tarifas (opcional)
      let tarifasFile = null;
      if (tarifasMeta) {
        const tarifasPath = resolveStoragePath(tarifasMeta);
        if (tarifasPath) {
          console.log('📄 Descargando archivo de tarifas...');
          const tarifasBlob = await downloadBlob(tarifasPath, 'tarifas');
          const tarifasName = tarifasMeta.nombre || tarifasMeta.originalName || 'tarifas.xlsx';
          const tarifasType = tarifasMeta.tipo || tarifasMeta.type || 'application/octet-stream';
          tarifasFile = new File([tarifasBlob], tarifasName, { type: tarifasType });
        }
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
  async deleteLiquidacion(liquidacionId, userId, isAdmin = false) {
    try {
      console.log('🔍 [Service] Iniciando eliminación - ID:', liquidacionId, 'Usuario:', userId, 'Admin:', isAdmin);
      
      // 🔒 VALIDACIONES DE SEGURIDAD MEJORADAS
      if (!liquidacionId || typeof liquidacionId !== 'string') {
        console.log('❌ [Service] ID de liquidación inválido:', liquidacionId);
        throw new Error('ID de liquidación inválido');
      }
      
      if (!userId || typeof userId !== 'string') {
        console.log('❌ [Service] Usuario ID inválido:', userId);
        throw new Error('Usuario no autenticado correctamente');
      }
      
      // Verificar permisos
      const docRef = doc(db, 'liquidaciones', liquidacionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('❌ [Service] Liquidación no encontrada');
        throw new Error('Liquidación no encontrada');
      }

      const liquidacionData = docSnap.data();
      console.log('📄 [Service] Documento encontrado - Usuario propietario:', liquidacionData.userId);
      console.log('🔑 [Service] Usuario solicitante:', userId);
      console.log('� [Service] Tipos de datos:', 
        'propietario:', typeof liquidacionData.userId, 
        'solicitante:', typeof userId
      );
      
      // 🆕 VALIDACIÓN MEJORADA: Normalizar y comparar IDs
      const propietarioId = String(liquidacionData.userId || '').trim();
      const solicitanteId = String(userId || '').trim();
      
      console.log('🔍 [Service] Comparación normalizada:', {
        propietario: propietarioId,
        solicitante: solicitanteId,
        iguales: propietarioId === solicitanteId
      });
      
      // 🔍 DIAGNÓSTICO TEMPORAL: Imprimir TODA la estructura del documento
      console.log('🗂️ [DEBUG TEMPORAL] Estructura COMPLETA del documento:', {
        ...liquidacionData,
        // Campos específicos que podrían contener el userId
        usuario: liquidacionData.usuario,
        user: liquidacionData.user,
        createdBy: liquidacionData.createdBy,
        owner: liquidacionData.owner,
        authorId: liquidacionData.authorId,
        // Mostrar todas las claves del documento
        allKeys: Object.keys(liquidacionData)
      });
      
      // 🔍 VERIFICACIÓN ALTERNATIVA: Buscar userId en diferentes campos
      const possibleUserFields = [
        liquidacionData.userId,
        liquidacionData.user?.uid,
        liquidacionData.usuario?.uid,
        liquidacionData.createdBy,
        liquidacionData.owner,
        liquidacionData.authorId
      ].filter(Boolean);
      
      console.log('🔍 [DEBUG] Posibles campos de usuario encontrados:', possibleUserFields);
      
      // 🆕 LÓGICA DE VALIDACIÓN AMPLIADA CON SOPORTE PARA ADMINS
      const isUserAuthorized = possibleUserFields.some(fieldValue => {
        const normalizedField = String(fieldValue || '').trim();
        const isMatch = normalizedField === solicitanteId;
        console.log(`🔍 Comparando campo "${fieldValue}" con usuario "${solicitanteId}": ${isMatch}`);
        return isMatch;
      });
      
      const isOwner = isUserAuthorized || propietarioId === solicitanteId;
      
      // 🔑 PERMITIR A ADMINS ELIMINAR CUALQUIER LIQUIDACIÓN
      if (isAdmin) {
        console.log('✅ [Service] Usuario es ADMIN - Permitiendo eliminación');
      } else if (!isOwner) {
        console.log('❌ [Service] Sin permisos para eliminar - Usuario no es propietario ni admin');
        console.log('📋 [Service] Propietario de la liquidación:', propietarioId);
        console.log('🔑 [Service] Usuario solicitante:', solicitanteId);
        console.log('📊 [Service] Usuario es admin?', isAdmin);
        throw new Error('No tienes permisos para eliminar esta liquidación. Solo el propietario o un administrador pueden eliminarla.');
      }
      
      console.log('✅ [Service] Validación de permisos exitosa -', isAdmin ? 'Usuario ADMIN' : 'Usuario propietario');

      console.log('🗂️ [Service] Eliminando archivos de Storage...');
      // Eliminar archivos de Storage
      const deletePromises = [];
      
      // Verificar todas las posibles ubicaciones de archivos
      console.log('🔍 [Service] Verificando archivos en diferentes campos:');
      console.log('📁 archivos.archivoOriginal:', liquidacionData.archivos?.archivoOriginal);
      console.log('📁 archivos.archivoTarifas:', liquidacionData.archivos?.archivoTarifas);
      console.log('📁 archivoOriginal (legacy):', liquidacionData.archivoOriginal);
      console.log('📁 archivoTarifas (legacy):', liquidacionData.archivoTarifas);
      console.log('📁 archivosStorage (legacy):', liquidacionData.archivosStorage);
      
      // Archivo original (nueva estructura - estructura principal actual)
      if (liquidacionData.archivos?.archivoOriginal?.nombreStorage) {
        console.log('📁 [Service] Eliminando archivo original (nueva estructura):', liquidacionData.archivos.archivoOriginal.nombreStorage);
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivos.archivoOriginal.nombreStorage))
            .catch(error => console.warn('Error eliminando archivo original (nueva):', error))
        );
      }
      
      // Archivo de tarifas (nueva estructura - estructura principal actual)
      if (liquidacionData.archivos?.archivoTarifas?.nombreStorage) {
        console.log('📄 [Service] Eliminando archivo de tarifas (nueva estructura):', liquidacionData.archivos.archivoTarifas.nombreStorage);
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivos.archivoTarifas.nombreStorage))
            .catch(error => console.warn('Error eliminando archivo de tarifas (nueva):', error))
        );
      }
      
      // Archivo original (estructura legacy - para compatibilidad)
      if (liquidacionData.archivoOriginal?.fileName) {
        console.log('📁 [Service] Eliminando archivo original (legacy):', liquidacionData.archivoOriginal.fileName);
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivoOriginal.fileName))
            .catch(error => console.warn('Error eliminando archivo original (legacy):', error))
        );
      }

      // Archivo de tarifas (estructura legacy - para compatibilidad)
      if (liquidacionData.archivoTarifas?.fileName) {
        console.log('📄 [Service] Eliminando archivo de tarifas (legacy):', liquidacionData.archivoTarifas.fileName);
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivoTarifas.fileName))
            .catch(error => console.warn('Error eliminando archivo de tarifas (legacy):', error))
        );
      }

      // Archivos en archivosStorage (estructura antigua - para compatibilidad)
      if (liquidacionData.archivosStorage?.original?.fileName) {
        console.log('📁 [Service] Eliminando archivo original (archivosStorage):', liquidacionData.archivosStorage.original.fileName);
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivosStorage.original.fileName))
            .catch(error => console.warn('Error eliminando archivo original (archivosStorage):', error))
        );
      }
      
      if (liquidacionData.archivosStorage?.tarifas?.fileName) {
        console.log('📄 [Service] Eliminando archivo de tarifas (archivosStorage):', liquidacionData.archivosStorage.tarifas.fileName);
        deletePromises.push(
          deleteObject(ref(storage, liquidacionData.archivosStorage.tarifas.fileName))
            .catch(error => console.warn('Error eliminando archivo de tarifas (archivosStorage):', error))
        );
      }

      console.log('⏳ [Service] Esperando eliminación de archivos...');
      console.log('📊 [Service] Total de archivos a eliminar:', deletePromises.length);
      await Promise.all(deletePromises);
      console.log('✅ [Service] Archivos eliminados');

      // Eliminar registros de liquidaciones por sala relacionados
      console.log('🏢 [Service] Eliminando registros de liquidaciones por sala...');
      try {
        // CORREGIDO: usar la colección correcta y el campo correcto
        const liquidacionesPorSalaQuery = query(
          collection(db, 'liquidaciones_por_sala'),
          where('liquidacionId', '==', liquidacionId),
          where('userId', '==', userId)
        );
        
        const liquidacionesPorSalaSnapshot = await getDocs(liquidacionesPorSalaQuery);
        console.log(`🔍 [Service] Encontrados ${liquidacionesPorSalaSnapshot.docs.length} registros por sala para eliminar`);
        
        const deleteSalaPromises = liquidacionesPorSalaSnapshot.docs.map(async (salaDoc) => {
          console.log(`🗑️ [Service] Eliminando sala: ${salaDoc.id} - ${salaDoc.data().sala?.nombre || 'Sin nombre'}`);
          return deleteDoc(doc(db, 'liquidaciones_por_sala', salaDoc.id));
        });
        
        await Promise.all(deleteSalaPromises);
        console.log('✅ [Service] Registros por sala eliminados exitosamente');
      } catch (salaError) {
        console.warn('⚠️ [Service] Error eliminando registros por sala:', salaError);
        // No lanzar error aquí para no interrumpir la eliminación principal
      }

      // Eliminar documento principal
      console.log('📄 [Service] Eliminando documento principal de Firestore...');
      await deleteDoc(docRef);
      console.log('✅ [Service] Documento principal eliminado exitosamente');

    } catch (error) {
      console.error('❌ [Service] Error eliminando liquidación:', error);
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

  // ========================================
  // 🆕 NUEVAS FUNCIONES PARA LIQUIDACIONES POR SALA
  // ========================================

  /**
   * Obtiene todas las liquidaciones por sala para un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} filtros - Filtros opcionales { empresa, periodo, sala, estado }
   * @returns {Promise<Array>} - Array de liquidaciones por sala
   */
  async getLiquidacionesPorSala(userId, filtros = {}) {
    try {
      // Consulta simplificada sin orderBy para evitar índice compuesto
      let q = query(
        collection(db, 'liquidaciones_por_sala'),
        where('userId', '==', userId)
      );

      // Aplicar filtros adicionales si se proporcionan
      if (filtros.empresa) {
        q = query(q, where('empresa.nombre', '==', filtros.empresa));
      }

      const querySnapshot = await getDocs(q);
      let liquidacionesSala = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Aplicar filtros adicionales (que no se pueden hacer con Firestore)
        let incluir = true;
        
        // Solo filtrar si el filtro tiene un valor válido (no vacío)
        if (filtros.periodo && filtros.periodo.trim() && data.fechas.periodoLiquidacion !== filtros.periodo) {
          incluir = false;
        }
        
        if (filtros.sala && filtros.sala.trim() && data.sala.nombre !== filtros.sala) {
          incluir = false;
        }
        
        if (filtros.estado && filtros.estado.trim() && data.facturacion.estado !== filtros.estado) {
          incluir = false;
        }
        
        if (incluir) {
          liquidacionesSala.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Ordenar por timestamp en JavaScript (más recientes primero)
      liquidacionesSala.sort((a, b) => {
        const timestampA = a.fechas?.timestampProcesamiento || 0;
        const timestampB = b.fechas?.timestampProcesamiento || 0;
        return timestampB - timestampA;
      });

      console.log(`📋 Encontradas ${liquidacionesSala.length} liquidaciones por sala`);
      return liquidacionesSala;

    } catch (error) {
      console.error('Error obteniendo liquidaciones por sala:', error);
      throw new Error(`Error al obtener liquidaciones por sala: ${error.message}`);
    }
  }

  /**
   * Obtiene una liquidación por sala específica
   * @param {string} salaId - ID de la liquidación por sala
   * @returns {Promise<Object>} - Datos de la liquidación por sala
   */
  async getLiquidacionSala(salaId) {
    try {
      const docRef = doc(db, 'liquidaciones_por_sala', salaId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Liquidación por sala no encontrada');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error obteniendo liquidación por sala:', error);
      throw new Error(`Error al obtener liquidación por sala: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de facturación de una liquidación por sala
   * @param {string} salaId - ID de la liquidación por sala
   * @param {Object} datosFacturacion - Datos de facturación a actualizar
   * @returns {Promise<void>}
   */
  async actualizarEstadoFacturacion(salaId, datosFacturacion) {
    try {
      const docRef = doc(db, 'liquidaciones_por_sala', salaId);
      
      await setDoc(docRef, {
        facturacion: {
          ...datosFacturacion,
          fechaActualizacion: new Date().toISOString()
        },
        fechas: {
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      console.log(`✅ Estado de facturación actualizado para sala ${salaId}`);
    } catch (error) {
      console.error('Error actualizando estado de facturación:', error);
      throw new Error(`Error al actualizar estado de facturación: ${error.message}`);
    }
  }

  /**
   * Elimina una liquidación por sala
   * @param {string} salaId - ID de la liquidación por sala
   * @returns {Promise<void>}
   */
  async deleteLiquidacionSala(salaId) {
    try {
      const docRef = doc(db, 'liquidaciones_por_sala', salaId);
      await deleteDoc(docRef);
      console.log(`✅ Liquidación por sala eliminada: ${salaId}`);
    } catch (error) {
      console.error('Error eliminando liquidación por sala:', error);
      throw new Error(`Error al eliminar liquidación por sala: ${error.message}`);
    }
  }

  /**
   * Obtiene resumen estadístico de liquidaciones por sala
   * @param {string} userId - ID del usuario
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Object>} - Estadísticas resumidas
   */
  async getEstadisticasLiquidacionesSala(userId, filtros = {}) {
    try {
      const liquidaciones = await this.getLiquidacionesPorSala(userId, filtros);
      
      const estadisticas = {
        total: liquidaciones.length,
        porEstado: {
          pendiente: 0,
          generada: 0,
          enviada: 0,
          pagada: 0
        },
        montos: {
          totalProduccion: 0,
          totalDerechos: 0,
          totalGastos: 0,
          totalImpuestos: 0
        },
        salas: new Set(),
        empresas: new Set(),
        periodos: new Set()
      };

      liquidaciones.forEach(liq => {
        // Contar por estado
        estadisticas.porEstado[liq.facturacion.estado]++;
        
        // Sumar montos
        estadisticas.montos.totalProduccion += liq.metricas.totalProduccion || 0;
        estadisticas.montos.totalDerechos += liq.metricas.derechosExplotacion || 0;
        estadisticas.montos.totalGastos += liq.metricas.gastosAdministracion || 0;
        estadisticas.montos.totalImpuestos += liq.metricas.totalImpuestos || 0;
        
        // Recopilar dimensiones únicas
        estadisticas.salas.add(liq.sala.nombre);
        estadisticas.empresas.add(liq.empresa.nombre);
        estadisticas.periodos.add(liq.fechas.periodoLiquidacion);
      });

      // Convertir Sets a arrays
      estadisticas.salas = Array.from(estadisticas.salas);
      estadisticas.empresas = Array.from(estadisticas.empresas);
      estadisticas.periodos = Array.from(estadisticas.periodos);

      return estadisticas;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * 🧹 LIMPIEZA: Eliminar registros con períodos malformados
   * que contienen números de fecha Excel (como enero_45900)
   */
  async limpiarRegistrosMalformados(userId) {
    try {
      console.log('🧹 Iniciando limpieza de registros malformados...');
      
      // Obtener todas las liquidaciones por sala del usuario
      const q = query(
        collection(db, 'liquidaciones_por_sala'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`📋 Encontrados ${querySnapshot.size} registros para revisar`);
      
      let eliminados = 0;
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const periodo = data.fechas?.periodoLiquidacion;
        
        // Detectar períodos malformados que contienen números (como enero_45900)
        if (periodo && /\d{4,5}/.test(periodo)) {
          console.log(`❌ Período malformado detectado: ${periodo} - Eliminando ${doc.id}`);
          batch.delete(doc.ref);
          eliminados++;
        }
      });
      
      if (eliminados > 0) {
        await batch.commit();
        console.log(`✅ ${eliminados} registros malformados eliminados`);
      } else {
        console.log('✨ No se encontraron registros malformados para eliminar');
      }
      
      return { eliminados, total: querySnapshot.size };
      
    } catch (error) {
      console.error('Error limpiando registros malformados:', error);
      throw new Error(`Error en limpieza: ${error.message}`);
    }
  }

  /**
   * Limpia registros huérfanos y malformados de liquidaciones por sala
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado de la limpieza
   */
  async limpiarRegistrosHuerfanos(userId) {
    try {
      console.log('🧹 Iniciando limpieza de registros huérfanos...');
      
      // 1. Obtener todos los registros de liquidaciones por sala del usuario
      const liquidacionesPorSalaRef = collection(db, 'liquidacionesPorSala');
      const q = query(liquidacionesPorSalaRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      console.log(`📊 Encontrados ${snapshot.docs.length} registros por sala`);
      
      const registrosHuerfanos = [];
      const registrosMalformados = [];
      const registrosValidos = [];
      
      // 2. Verificar cada registro
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const docId = doc.id;
        
        // Verificar si tiene período malformado (contiene números grandes como 45900)
        const periodoTexto = data.fechas?.periodoLiquidacion || '';
        const esMalformado = periodoTexto.includes('45900') || 
                           periodoTexto.includes('43503') || 
                           /\d{5,}/.test(periodoTexto); // números de 5+ dígitos
        
        if (esMalformado) {
          registrosMalformados.push({ id: docId, periodo: periodoTexto, data });
          continue;
        }
        
        // Verificar si la liquidación original existe
        if (data.liquidacionOriginalId) {
          try {
            const liquidacionOriginalRef = doc(db, 'liquidaciones', data.liquidacionOriginalId);
            const liquidacionOriginalDoc = await getDoc(liquidacionOriginalRef);
            
            if (!liquidacionOriginalDoc.exists()) {
              registrosHuerfanos.push({ id: docId, liquidacionOriginalId: data.liquidacionOriginalId, data });
            } else {
              registrosValidos.push({ id: docId, data });
            }
          } catch (error) {
            console.warn(`Error verificando liquidación original ${data.liquidacionOriginalId}:`, error);
            registrosHuerfanos.push({ id: docId, liquidacionOriginalId: data.liquidacionOriginalId, data });
          }
        } else {
          // Sin liquidacionOriginalId - es huérfano
          registrosHuerfanos.push({ id: docId, liquidacionOriginalId: 'N/A', data });
        }
      }
      
      console.log(`🔍 Análisis completo:`);
      console.log(`   • Registros válidos: ${registrosValidos.length}`);
      console.log(`   • Registros huérfanos: ${registrosHuerfanos.length}`);
      console.log(`   • Registros malformados: ${registrosMalformados.length}`);
      
      // 3. Eliminar registros huérfanos y malformados
      const registrosAEliminar = [...registrosHuerfanos, ...registrosMalformados];
      const promesasEliminacion = [];
      
      registrosAEliminar.forEach(registro => {
        console.log(`🗑️ Eliminando: ${registro.id} (${registro.periodo || 'Sin período'})`);
        promesasEliminacion.push(
          deleteDoc(doc(db, 'liquidacionesPorSala', registro.id))
            .catch(error => console.warn(`Error eliminando ${registro.id}:`, error))
        );
      });
      
      await Promise.all(promesasEliminacion);
      
      const resultado = {
        totalRegistros: snapshot.docs.length,
        registrosValidos: registrosValidos.length,
        registrosEliminados: registrosAEliminar.length,
        huerfanos: registrosHuerfanos.length,
        malformados: registrosMalformados.length,
        detalleHuerfanos: registrosHuerfanos.map(r => ({ id: r.id, liquidacionOriginalId: r.liquidacionOriginalId })),
        detalleMalformados: registrosMalformados.map(r => ({ id: r.id, periodo: r.periodo }))
      };
      
      console.log('✅ Limpieza completada:', resultado);
      return resultado;
      
    } catch (error) {
      console.error('Error en limpieza de registros:', error);
      throw new Error(`Error en limpieza: ${error.message}`);
    }
  }

  /**
   * 🆕 Guarda una liquidación por sala editada (nueva versión)
   * @param {Object} liquidacionEditada - Datos de la liquidación editada
   * @returns {Promise<string>} - ID del nuevo documento creado
   */
  async saveLiquidacionPorSala(liquidacionEditada) {
    try {
      console.log('💾 Guardando nueva versión de liquidación editada...');
      
      // Función para limpiar valores undefined recursivamente
      const limpiarUndefined = (obj) => {
        if (obj === null || typeof obj !== 'object') {
          return obj === undefined ? null : obj;
        }
        
        if (Array.isArray(obj)) {
          return obj.map(item => limpiarUndefined(item));
        }
        
        const objetoLimpio = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            objetoLimpio[key] = limpiarUndefined(value);
          }
        }
        return objetoLimpio;
      };

      // Limpiar datos antes de guardar
      const datosLimpios = limpiarUndefined({
        ...liquidacionEditada,
        fechas: {
          ...liquidacionEditada.fechas,
          timestampEdicion: serverTimestamp()
        }
      });
      
      console.log('🔍 Datos limpios a guardar:', JSON.stringify(datosLimpios, null, 2));
      
      // Usar setDoc en lugar de addDoc para mantener control del ID
      const docRef = doc(collection(db, 'liquidaciones_por_sala'));
      await setDoc(docRef, datosLimpios);

      console.log('✅ Nueva versión guardada con ID:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('Error guardando liquidación editada:', error);
      throw new Error(`Error al guardar edición: ${error.message}`);
    }
  }

  /**
   * Crea o actualiza (acumulativamente) una liquidación editada por sala.
   * Escenario: primera edición -> crea doc nuevo; ediciones posteriores -> actualiza el mismo doc.
   * @param {Object} originalDoc - Documento original (liquidación base por sala)
   * @param {Array} nuevosDatosMaquinas - Array de máquinas (todas las visibles en la tabla de edición)
   * @param {String} motivoEdicion - Motivo textual de la edición actual
   * @param {Object} usuario - { uid, email, name }
   * @returns {Promise<string>} id del documento de edición (creado o actualizado)
   */
  async upsertLiquidacionEdicionPorSala({ originalDoc, nuevosDatosMaquinas, motivoEdicion, usuario, opcionesEdicion = {}, ingresoBaseManual }) {
    if (!originalDoc?.id) throw new Error('Falta id de liquidación original');
    if (!Array.isArray(nuevosDatosMaquinas)) throw new Error('Formato inválido de máquinas');

    try {
      console.log('🛠️ upsertLiquidacionEdicionPorSala start', { originalId: originalDoc.id, maquinas: nuevosDatosMaquinas.length });

      // 1. Buscar si ya existe una edición acumulada
      const q = query(
        collection(db, 'liquidaciones_por_sala'),
        where('liquidacionOriginalId', '==', originalDoc.id),
        where('esEdicion', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);

      let editDocRef = null;
      let editDocData = null;
  const ahoraServer = serverTimestamp();
  const ahoraISO = new Date().toISOString();

      // Utilidad: indexar máquinas por serial en array dado (normalizando clave a string)
      const indexBySerial = (arr) => {
        const map = new Map();
        arr.forEach(m => {
          const raw = m.serial ?? m.Serial;
          if (raw == null) return;
          const key = String(raw).trim();
          map.set(key, m);
        });
        return map;
      };

      const nuevosMap = indexBySerial(nuevosDatosMaquinas);

      // 2. Si NO existe edición previa -> crear documento nuevo
      if (snap.empty) {
        console.log('📄 No existe edición previa, creando nueva');

        // Detectar máquinas editadas (marcadas o con fueEditada true)
        const maquinasEditadasSeriales = [];
        const datosConsolidados = nuevosDatosMaquinas.map(m => {
          const copia = { ...m };
          const fueEditada = m.fueEditada === true; // viene marcado desde la UI
            // Preservar diasTransmitidos si viene en la nueva data o ya estaba en la previa
            if (m.diasTransmitidos === undefined && m.dias_transmitidos !== undefined) {
              copia.diasTransmitidos = m.dias_transmitidos;
            }
            // Normalizar a número si es string
            if (copia.diasTransmitidos != null && typeof copia.diasTransmitidos === 'string') {
              const parsedDias = parseInt(copia.diasTransmitidos.replace(/[^0-9]/g,''),10);
              if (!isNaN(parsedDias)) copia.diasTransmitidos = parsedDias; else delete copia.diasTransmitidos;
            }
          if (fueEditada) {
            copia.fueEditada = true;
            const serial = m.serial || m.Serial;
            if (serial) maquinasEditadasSeriales.push(serial);
          }
          // Reasegurar totalImpuestos coherente
            copia.totalImpuestos = (parseFloat(copia.derechosExplotacion) || 0) + (parseFloat(copia.gastosAdministracion) || 0);
          return copia;
        });

        // Preparar mapa de valores originales (para "antes") desde documento original si existe
        let originalMapBySerial = null;
        try {
          const originalSnap = await getDoc(doc(db, 'liquidaciones_por_sala', originalDoc.id));
          if (originalSnap.exists()) {
            const originalData = originalSnap.data();
            if (Array.isArray(originalData.datosConsolidados)) {
              originalMapBySerial = new Map();
              originalData.datosConsolidados.forEach(om => {
                const raw = om.serial ?? om.Serial;
                if (raw == null) return;
                const key = String(raw).trim();
                originalMapBySerial.set(key, om);
              });
            }
          }
        } catch (e) {
          console.warn('⚠️ No se pudo cargar documento original para historial de cambios:', e);
        }

        // Construir lista de cambios con antes/después cuando sea posible
        const cambiosIniciales = datosConsolidados
          .filter(m => m.fueEditada)
          .map(m => {
            const rawSerial = m.serial ?? m.Serial;
            const key = rawSerial != null ? String(rawSerial).trim() : null;
            const anterior = key ? originalMapBySerial?.get(key) : null;
            const sourceNuevo = key ? (nuevosMap.get(key) || m) : m;
            const despues = {
              produccion: m.produccion,
              derechosExplotacion: m.derechosExplotacion,
              gastosAdministracion: m.gastosAdministracion
            };
            // Intentar tomar "antes" desde doc original; si no, desde _originalValores enviado por la UI
            const antesFromOriginal = anterior ? {
              produccion: anterior.produccion,
              derechosExplotacion: anterior.derechosExplotacion,
              gastosAdministracion: anterior.gastosAdministracion
            } : null;
            const ov = sourceNuevo && sourceNuevo._originalValores;
            const antesFromClient = ov ? {
              produccion: ov.produccion,
              derechosExplotacion: ov.derechosExplotacion,
              gastosAdministracion: ov.gastosAdministracion
            } : null;
            // Fallback adicional: cuando el ajuste fue por "máquinas negativas a 0" usamos el backup interno
            const nb = sourceNuevo && sourceNuevo._negativoBackup;
            const antesFromNegativoBackup = nb ? {
              // La producción no cambia en este ajuste, usamos la actual como "antes"
              produccion: m.produccion,
              derechosExplotacion: nb.derechosExplotacion,
              gastosAdministracion: nb.gastosAdministracion
            } : null;
            const antes = antesFromOriginal || antesFromClient || antesFromNegativoBackup;
            const serialOut = rawSerial != null ? String(rawSerial).trim() : '';
            return antes ? { serial: serialOut, antes, despues } : { serial: serialOut, nuevo: despues };
          });

        // Recalcular métricas
        const metricas = {
          totalMaquinas: datosConsolidados.length,
          totalProduccion: datosConsolidados.reduce((s, m) => s + (parseFloat(m.produccion) || 0), 0),
          derechosExplotacion: datosConsolidados.reduce((s, m) => s + (parseFloat(m.derechosExplotacion) || 0), 0),
          gastosAdministracion: datosConsolidados.reduce((s, m) => s + (parseFloat(m.gastosAdministracion) || 0), 0)
        };
        metricas.totalImpuestos = metricas.derechosExplotacion + metricas.gastosAdministracion;

        const docRef = doc(collection(db, 'liquidaciones_por_sala'));
        const editPayload = {
          esEdicion: true,
            liquidacionOriginalId: originalDoc.id,
          userId: originalDoc.userId,
          empresa: originalDoc.empresa,
          sala: originalDoc.sala,
          fechas: { ...originalDoc.fechas, fechaEdicion: ahoraServer },
          metricas,
          datosConsolidados,
          maquinasEditadas: maquinasEditadasSeriales,
          usuarioEdicion: usuario,
          motivoEdicion,
          opcionesEdicion: {
            tarifaFija: !!opcionesEdicion.tarifaFija,
            maquinasNegativasCero: !!opcionesEdicion.maquinasNegativasCero
          },
          ingresoBaseManual: ingresoBaseManual ? {
            smmlv: parseFloat(ingresoBaseManual.smmlv) || 0,
            auxilio: parseFloat(ingresoBaseManual.auxilio) || 0,
            total: parseFloat(ingresoBaseManual.total) || ((parseFloat(ingresoBaseManual.smmlv)||0)+(parseFloat(ingresoBaseManual.auxilio)||0))
          } : null,
          historialEdiciones: [
            {
              fecha: ahoraISO, // No usar serverTimestamp dentro del array
              usuario,
              motivo: motivoEdicion,
              tipo: 'creacion_edicion',
              opcionesEdicionSnapshot: {
                tarifaFija: !!opcionesEdicion.tarifaFija,
                maquinasNegativasCero: !!opcionesEdicion.maquinasNegativasCero
              },
              ingresoBaseManualSnapshot: ingresoBaseManual ? {
                smmlv: parseFloat(ingresoBaseManual.smmlv) || 0,
                auxilio: parseFloat(ingresoBaseManual.auxilio) || 0,
                total: parseFloat(ingresoBaseManual.total) || ((parseFloat(ingresoBaseManual.smmlv)||0)+(parseFloat(ingresoBaseManual.auxilio)||0))
              } : null,
              cambios: cambiosIniciales
            }
          ]
        };

        await setDoc(docRef, editPayload);
        editDocRef = docRef;
        editDocData = editPayload;

        // Marcar original con flag de que tiene ediciones
        await setDoc(doc(db, 'liquidaciones_por_sala', originalDoc.id), { tieneEdiciones: true, edicionId: docRef.id }, { merge: true });

        console.log('✅ Edición creada', docRef.id);
        return docRef.id;
      }

      // 3. Existe edición previa -> actualizar
      const existingDoc = snap.docs[0];
      editDocRef = existingDoc.ref;
      editDocData = existingDoc.data();
      console.log('✏️ Actualizando edición existente', existingDoc.id);

  const previoDatos = Array.isArray(editDocData.datosConsolidados) ? [...editDocData.datosConsolidados] : [];
  const previoMap = indexBySerial(previoDatos);

      const cambiosAplicados = [];

      // Merge: actualizar solo máquinas marcadas como editadas (fueEditada)
      nuevosDatosMaquinas.forEach(m => {
        const raw = m.serial ?? m.Serial;
        if (raw == null) return;
        const key = String(raw).trim();
        if (m.fueEditada === true) {
          const anterior = previoMap.get(key);
          const nuevoValor = {
            ...(anterior || {}),
            ...m,
            fueEditada: true,
            diasTransmitidos: (m.diasTransmitidos !== undefined) ? m.diasTransmitidos : (anterior ? anterior.diasTransmitidos : undefined),
            totalImpuestos: (parseFloat(m.derechosExplotacion) || 0) + (parseFloat(m.gastosAdministracion) || 0)
          };
          if (nuevoValor.diasTransmitidos != null && typeof nuevoValor.diasTransmitidos === 'string') {
            const parsedDias = parseInt(nuevoValor.diasTransmitidos.replace(/[^0-9]/g,''),10);
            if (!isNaN(parsedDias)) nuevoValor.diasTransmitidos = parsedDias; else delete nuevoValor.diasTransmitidos;
          }
          previoMap.set(key, nuevoValor);
          cambiosAplicados.push({
            serial: key,
            antes: anterior ? {
              produccion: anterior.produccion,
              derechosExplotacion: anterior.derechosExplotacion,
              gastosAdministracion: anterior.gastosAdministracion
            } : null,
            despues: {
              produccion: nuevoValor.produccion,
              derechosExplotacion: nuevoValor.derechosExplotacion,
              gastosAdministracion: nuevoValor.gastosAdministracion
            }
          });
        }
      });

      // Reconstruir array consolidado
      const mergedDatos = Array.from(previoMap.values());

      // Recalcular métricas
      const metricasActualizadas = {
        totalMaquinas: mergedDatos.length,
        totalProduccion: mergedDatos.reduce((s, m) => s + (parseFloat(m.produccion) || 0), 0),
        derechosExplotacion: mergedDatos.reduce((s, m) => s + (parseFloat(m.derechosExplotacion) || 0), 0),
        gastosAdministracion: mergedDatos.reduce((s, m) => s + (parseFloat(m.gastosAdministracion) || 0), 0)
      };
      metricasActualizadas.totalImpuestos = metricasActualizadas.derechosExplotacion + metricasActualizadas.gastosAdministracion;

      // Actualizar historial
      const historial = Array.isArray(editDocData.historialEdiciones) ? [...editDocData.historialEdiciones] : [];
      historial.push({
        fecha: ahoraISO,
        usuario,
        motivo: motivoEdicion,
        tipo: 'actualizacion_edicion',
        opcionesEdicionSnapshot: {
          tarifaFija: !!opcionesEdicion.tarifaFija,
          maquinasNegativasCero: !!opcionesEdicion.maquinasNegativasCero
        },
        ingresoBaseManualSnapshot: ingresoBaseManual ? {
          smmlv: parseFloat(ingresoBaseManual.smmlv) || 0,
          auxilio: parseFloat(ingresoBaseManual.auxilio) || 0,
          total: parseFloat(ingresoBaseManual.total) || ((parseFloat(ingresoBaseManual.smmlv)||0)+(parseFloat(ingresoBaseManual.auxilio)||0))
        } : (editDocData.ingresoBaseManual || null),
        cambios: cambiosAplicados
      });

      const maquinasEditadasSeriales = mergedDatos.filter(m => m.fueEditada).map(m => m.serial || m.Serial).filter(Boolean);

      await setDoc(editDocRef, {
        metricas: metricasActualizadas,
        datosConsolidados: mergedDatos,
        maquinasEditadas: maquinasEditadasSeriales,
        historialEdiciones: historial,
        motivoEdicion, // último motivo registrado (opcional)
        fechaUltimaEdicion: ahoraServer,
        usuarioEdicion: usuario,
        esEdicion: true,
        liquidacionOriginalId: originalDoc.id,
        opcionesEdicion: {
          tarifaFija: !!opcionesEdicion.tarifaFija,
          maquinasNegativasCero: !!opcionesEdicion.maquinasNegativasCero
        },
        ingresoBaseManual: ingresoBaseManual ? {
          smmlv: parseFloat(ingresoBaseManual.smmlv) || 0,
          auxilio: parseFloat(ingresoBaseManual.auxilio) || 0,
          total: parseFloat(ingresoBaseManual.total) || ((parseFloat(ingresoBaseManual.smmlv)||0)+(parseFloat(ingresoBaseManual.auxilio)||0))
        } : (editDocData.ingresoBaseManual || null)
      }, { merge: true });

      // Marcar original (por si no estaba)
      await setDoc(doc(db, 'liquidaciones_por_sala', originalDoc.id), { tieneEdiciones: true, edicionId: existingDoc.id }, { merge: true });

      console.log('✅ Edición actualizada', existingDoc.id, 'cambios:', cambiosAplicados.length);
      return existingDoc.id;
    } catch (error) {
      console.error('Error en upsertLiquidacionEdicionPorSala:', error);
      throw error;
    }
  }
}

export default new LiquidacionPersistenceService();
