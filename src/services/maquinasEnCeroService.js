/**
 * Servicio para gestionar la colección pre-computada de Máquinas en Cero
 * 
 * Colección: maquinas_en_cero/{empresaNormalizada}
 * 
 * Un documento por empresa con toda la data histórica de máquinas que han tenido
 * producción = 0. Se actualiza incrementalmente al subir liquidaciones o archivos Houndoc.
 * 
 * Beneficio: 1 lectura de Firestore en lugar de cientos (10 salas × N periodos)
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { ref, getBlob, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// ===== CONSTANTES =====
const COLLECTION_NAME = 'maquinas_en_cero';
const ZERO_THRESHOLD = 0.01; // Producción < 0.01 se considera cero

// ===== HELPERS DE PERIODO =====

const MONTH_MAP = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11
};

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Normaliza nombre de empresa (mismo patrón que liquidacionPersistenceService)
 */
export const normalizeEmpresa = (empresa) => {
  return String(empresa || '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
};

/**
 * Convierte "enero_2025" → Date(2025, 0, 1)
 */
export const periodoToDate = (periodoStr) => {
  if (!periodoStr || typeof periodoStr !== 'string') return null;
  const parts = periodoStr.split('_').filter(Boolean);
  if (parts.length < 2) return null;
  const year = parseInt(parts[parts.length - 1], 10);
  const mesKey = parts.slice(0, -1).join('_').toLowerCase();
  const monthIndex = MONTH_MAP[mesKey];
  if (monthIndex === undefined || !Number.isFinite(year)) return null;
  return new Date(year, monthIndex, 1);
};

/**
 * Convierte "enero_2025" → Date último día del mes
 */
export const periodoEndDate = (periodoStr) => {
  const start = periodoToDate(periodoStr);
  if (!start) return null;
  return new Date(start.getFullYear(), start.getMonth() + 1, 0);
};

/**
 * Score numérico para ordenar periodos: "enero_2025" → 202500
 */
export const periodoScore = (periodoStr) => {
  const d = periodoToDate(periodoStr);
  if (!d) return 0;
  return d.getFullYear() * 100 + d.getMonth();
};

/**
 * Formatea periodo para mostrar: "enero_2025" → "Ene 2025"
 */
export const formatPeriodoLabel = (periodoStr) => {
  const d = periodoToDate(periodoStr);
  if (!d) return periodoStr || '?';
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Calcula días calendario entre el primer día de primerPeriodo y el último día de ultimoPeriodo
 */
export const diasEntrePeriodos = (primerPeriodo, ultimoPeriodo) => {
  const inicio = periodoToDate(primerPeriodo);
  const fin = periodoEndDate(ultimoPeriodo);
  if (!inicio || !fin) return 0;
  return Math.max(0, Math.round((fin - inicio) / (1000 * 60 * 60 * 24)));
};

/**
 * Calcula días calendario desde un periodo hasta HOY
 */
export const diasDesdePeriodoHastaHoy = (periodoStr) => {
  const inicio = periodoToDate(periodoStr);
  if (!inicio) return 0;
  const hoy = new Date();
  return Math.max(0, Math.round((hoy - inicio) / (1000 * 60 * 60 * 24)));
};

// ===== FUNCIONES DE CÓMPUTO PURAS =====

/**
 * Función pura que computa el análisis completo de máquinas en cero
 * a partir de un array de documentos de liquidaciones_por_sala.
 * 
 * @param {Array} liquidacionesPorSalaArr - Todos los documentos de liquidaciones_por_sala para una empresa
 * @param {string} empresaNombre - Nombre de la empresa
 * @returns {Object} - Documento completo para guardar en maquinas_en_cero
 */
export const computeMaquinasEnCero = (liquidacionesPorSalaArr, empresaNombre) => {
  if (!Array.isArray(liquidacionesPorSalaArr) || liquidacionesPorSalaArr.length === 0) {
    return createEmptyDocument(empresaNombre);
  }

  // Recopilar todos los periodos
  const allPeriodos = new Set();
  liquidacionesPorSalaArr.forEach(liq => {
    const p = liq?.fechas?.periodoLiquidacion;
    if (p) allPeriodos.add(p);
  });

  const periodosOrdenados = [...allPeriodos].sort((a, b) => periodoScore(a) - periodoScore(b));
  if (periodosOrdenados.length === 0) return createEmptyDocument(empresaNombre);

  const periodoMasReciente = periodosOrdenados[periodosOrdenados.length - 1];

  // Map<nucKey, machineRecord>
  const machineMap = new Map();
  // Track total fleet per period
  const totalMaquinasPorPeriodo = new Map();

  // Process each liquidacion document
  liquidacionesPorSalaArr.forEach((liq) => {
    const periodo = liq?.fechas?.periodoLiquidacion;
    if (!periodo) return;

    const sala = liq?.sala?.nombre || 'Sin Sala';
    const maquinas = Array.isArray(liq?.datosConsolidados) ? liq.datosConsolidados : [];

    if (!totalMaquinasPorPeriodo.has(periodo)) totalMaquinasPorPeriodo.set(periodo, new Set());

    maquinas.forEach((m) => {
      const serial = m?.serial || m?.Serial || 'N/A';
      const nucRaw = m?.nuc ?? m?.NUC ?? null;
      const nuc = nucRaw != null ? String(nucRaw) : 'N/A';
      const produccion = Number(m?.produccion) || 0;
      const tipoApuesta = m?.tipoApuesta || m?.tipo_apuesta || m?.tipo || 'N/A';

      // Stable key: serial+sala for uniqueness
      const nucKey = serial !== 'N/A' ? `${serial}__${sala}` : nuc !== 'N/A' ? `${nuc}__${sala}` : null;
      if (!nucKey) return;

      totalMaquinasPorPeriodo.get(periodo).add(nucKey);

      const esEnCero = Math.abs(produccion) < ZERO_THRESHOLD;

      if (!machineMap.has(nucKey)) {
        machineMap.set(nucKey, {
          nuc,
          serial,
          sala,
          tipoApuesta,
          periodosEnCero: [],
          periodosTotales: [],
          produccionUltimoPeriodo: 0
        });
      }

      const record = machineMap.get(nucKey);
      if (!record.periodosTotales.includes(periodo)) {
        record.periodosTotales.push(periodo);
      }
      if (esEnCero && !record.periodosEnCero.includes(periodo)) {
        record.periodosEnCero.push(periodo);
      }
      // Track latest production
      if (periodoScore(periodo) >= periodoScore(record._ultimoPeriodoVisto || '')) {
        record.produccionUltimoPeriodo = produccion;
        record._ultimoPeriodoVisto = periodo;
      }
    });
  });

  // Build final list of zero-machines
  const maquinasEnCero = [];

  machineMap.forEach((record, key) => {
    if (record.periodosEnCero.length === 0) return;

    // Sort periods by score
    const zeroPeriodosSorted = [...record.periodosEnCero].sort((a, b) => periodoScore(a) - periodoScore(b));
    const totalPeriodosSorted = [...record.periodosTotales].sort((a, b) => periodoScore(a) - periodoScore(b));

    const primerCero = zeroPeriodosSorted[0];
    const ultimoCero = zeroPeriodosSorted[zeroPeriodosSorted.length - 1];
    const esActualmenteEnCero = record.periodosEnCero.includes(periodoMasReciente);

    // Calculate consecutive months in zero (backwards from most recent period)
    let mesesConsecutivos = 0;
    for (let i = periodosOrdenados.length - 1; i >= 0; i--) {
      const p = periodosOrdenados[i];
      if (record.periodosEnCero.includes(p)) {
        mesesConsecutivos++;
      } else if (record.periodosTotales.includes(p)) {
        break; // Machine existed but produced → stop counting
      }
    }

    // Días calendario: desde el primer periodo en cero hasta HOY (no hasta el último periodo)
    // Esto da la estadística "bruta" real de cuánto tiempo lleva
    const diasCalendario = diasDesdePeriodoHastaHoy(primerCero);
    const diasEntrePrimeroYUltimoCero = diasEntrePeriodos(primerCero, ultimoCero);

    // Severity level based on calendar days
    let nivel;
    if (diasCalendario > 90) nivel = 'critico';
    else if (diasCalendario > 30) nivel = 'alerta';
    else nivel = 'reciente';

    maquinasEnCero.push({
      key,
      nuc: record.nuc,
      serial: record.serial,
      sala: record.sala,
      tipoApuesta: record.tipoApuesta,
      periodosEnCero: zeroPeriodosSorted,
      periodosTotales: totalPeriodosSorted,
      mesesEnCero: record.periodosEnCero.length,
      mesesConsecutivos,
      primerCero,
      ultimoCero,
      diasCalendario,
      diasEntrePrimeroYUltimoCero,
      esActualmenteEnCero,
      nivel,
      produccionUltimoPeriodo: record.produccionUltimoPeriodo
    });
  });

  // Sort by dias calendario desc
  maquinasEnCero.sort((a, b) => b.diasCalendario - a.diasCalendario);

  // Salas summary
  const salasMap = new Map();
  maquinasEnCero.forEach((m) => {
    if (!salasMap.has(m.sala)) {
      salasMap.set(m.sala, { sala: m.sala, total: 0, criticas: 0, alertas: 0, recientes: 0, activas: 0, totalFlota: 0 });
    }
    const s = salasMap.get(m.sala);
    s.total++;
    if (m.nivel === 'critico') s.criticas++;
    else if (m.nivel === 'alerta') s.alertas++;
    else s.recientes++;
    if (m.esActualmenteEnCero) s.activas++;
  });

  // Calculate fleet per sala from most recent period
  liquidacionesPorSalaArr.forEach((liq) => {
    const periodo = liq?.fechas?.periodoLiquidacion;
    if (periodo !== periodoMasReciente) return;
    const sala = liq?.sala?.nombre || 'Sin Sala';
    const totalMaq = Array.isArray(liq?.datosConsolidados) ? liq.datosConsolidados.length : 0;
    if (salasMap.has(sala)) {
      salasMap.get(sala).totalFlota = totalMaq;
    }
  });

  const resumenPorSala = Array.from(salasMap.values()).sort((a, b) => b.total - a.total);

  // Trend data
  const tendencia = periodosOrdenados.map((p) => {
    let count = 0;
    machineMap.forEach((record) => {
      if (record.periodosEnCero.includes(p)) count++;
    });
    return {
      periodo: p,
      periodoLabel: formatPeriodoLabel(p),
      maquinasEnCero: count,
      totalMaquinas: totalMaquinasPorPeriodo.get(p)?.size || 0
    };
  });

  // KPIs
  const totalEnCero = maquinasEnCero.length;
  const activasEnCero = maquinasEnCero.filter(m => m.esActualmenteEnCero).length;
  const diasPromedio = totalEnCero > 0
    ? Math.round(maquinasEnCero.reduce((sum, m) => sum + m.diasCalendario, 0) / totalEnCero)
    : 0;
  const peorMaquina = maquinasEnCero.length > 0 ? {
    nuc: maquinasEnCero[0].nuc,
    serial: maquinasEnCero[0].serial,
    sala: maquinasEnCero[0].sala,
    diasCalendario: maquinasEnCero[0].diasCalendario
  } : null;
  const totalFlota = totalMaquinasPorPeriodo.get(periodoMasReciente)?.size || 0;
  const porcentajeEnCero = totalFlota > 0 ? ((activasEnCero / totalFlota) * 100).toFixed(1) : '0';

  // Trend comparison
  const trendActual = tendencia.length > 0 ? tendencia[tendencia.length - 1].maquinasEnCero : 0;
  const trendAnterior = tendencia.length > 1 ? tendencia[tendencia.length - 2].maquinasEnCero : 0;
  const trendCambioPct = trendAnterior > 0 ? ((trendActual - trendAnterior) / trendAnterior * 100) : 0;

  return {
    empresa: normalizeEmpresa(empresaNombre),
    empresaNombre,
    periodosRegistrados: periodosOrdenados,
    periodoMasReciente,
    maquinas: maquinasEnCero,
    kpis: {
      totalEnCero,
      activasEnCero,
      diasPromedio,
      peorMaquina,
      totalFlota,
      porcentajeEnCero,
      trendCambioPct,
      criticas: maquinasEnCero.filter(m => m.nivel === 'critico').length,
      alertas: maquinasEnCero.filter(m => m.nivel === 'alerta').length,
      recientes: maquinasEnCero.filter(m => m.nivel === 'reciente').length
    },
    resumenPorSala,
    tendencia
  };
};

/**
 * Crea un documento vacío para empresas sin datos
 */
const createEmptyDocument = (empresaNombre) => ({
  empresa: normalizeEmpresa(empresaNombre),
  empresaNombre,
  periodosRegistrados: [],
  periodoMasReciente: null,
  maquinas: [],
  kpis: {
    totalEnCero: 0, activasEnCero: 0, diasPromedio: 0,
    peorMaquina: null, totalFlota: 0, porcentajeEnCero: '0',
    trendCambioPct: 0, criticas: 0, alertas: 0, recientes: 0
  },
  resumenPorSala: [],
  tendencia: []
});

// ===== OPERACIONES FIRESTORE =====

/**
 * Lee el documento pre-computado de una empresa
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @returns {Object|null} - Documento o null si no existe
 */
export const getMaquinasEnCero = async (empresaNorm) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, empresaNorm);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error leyendo maquinas_en_cero:', error);
    throw error;
  }
};

/**
 * Guarda el documento pre-computado en Firestore
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @param {Object} data - Documento completo (resultado de computeMaquinasEnCero)
 * @param {string} fuente - "liquidacion" | "houndoc" | "migracion"
 */
export const saveMaquinasEnCero = async (empresaNorm, data, fuente = 'migracion') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, empresaNorm);
    await setDoc(docRef, {
      ...data,
      ultimaActualizacion: serverTimestamp(),
      fuenteUltimaActualizacion: fuente
    });
    return true;
  } catch (error) {
    console.error('Error guardando maquinas_en_cero:', error);
    throw error;
  }
};

/**
 * MIGRACIÓN: Lee TODOS los documentos de liquidaciones_por_sala de una empresa
 * y genera el documento pre-computado inicial.
 * 
 * ⚠️ Esta función hace MUCHAS lecturas a Firestore (una por sala×periodo).
 * Solo usar para la migración inicial o recalcular datos completos.
 * 
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @param {string} empresaNombre - Nombre legible de la empresa
 * @param {Function} onProgress - Callback de progreso (optional)
 * @returns {Object} - Resultado de la migración
 */
export const migrarEmpresa = async (empresaNorm, empresaNombre, onProgress) => {
  try {
    if (onProgress) onProgress({ step: 'reading', message: 'Leyendo todos los datos históricos...' });

    // Query ALL liquidaciones_por_sala for this empresa (sin filtro de periodo)
    const q = query(
      collection(db, 'liquidaciones_por_sala'),
      where('empresa.normalizado', '==', empresaNorm)
    );

    const snapshot = await getDocs(q);
    const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (onProgress) onProgress({
      step: 'computing',
      message: `Procesando ${allDocs.length} documentos de ${snapshot.docs.length} periodos...`
    });

    // Compute
    const resultado = computeMaquinasEnCero(allDocs, empresaNombre);

    if (onProgress) onProgress({ step: 'saving', message: 'Guardando datos pre-computados...' });

    // Save
    await saveMaquinasEnCero(empresaNorm, resultado, 'migracion');

    if (onProgress) onProgress({
      step: 'done',
      message: `Migración completa: ${resultado.kpis.totalEnCero} máquinas en cero detectadas en ${resultado.periodosRegistrados.length} periodos`
    });

    return {
      success: true,
      totalDocumentos: allDocs.length,
      periodosRegistrados: resultado.periodosRegistrados.length,
      maquinasEnCero: resultado.kpis.totalEnCero,
      data: resultado
    };
  } catch (error) {
    console.error('Error en migración de maquinas_en_cero:', error);
    if (onProgress) onProgress({ step: 'error', message: `Error: ${error.message}` });
    throw error;
  }
};

/**
 * ACTUALIZACIÓN INCREMENTAL: Recibe los nuevos documentos de liquidaciones_por_sala
 * de un periodo recién subido, los mergea con el documento pre-computado existente
 * y recalcula todo.
 * 
 * Costo: 1 lectura (doc existente) + 1 escritura (doc actualizado)
 * 
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @param {string} empresaNombre - Nombre legible de la empresa
 * @param {Array} newLiqPorSalaDocs - Documentos de liquidaciones_por_sala del nuevo periodo
 * @param {string} fuente - "liquidacion" | "houndoc"
 */
export const updateConNuevoPeriodo = async (empresaNorm, empresaNombre, newLiqPorSalaDocs, fuente = 'liquidacion') => {
  try {
    // 1. Leer documento existente
    const existing = await getMaquinasEnCero(empresaNorm);

    if (!existing) {
      // No existe — hacer migración completa (primera vez)
      return migrarEmpresa(empresaNorm, empresaNombre);
    }

    // 2. Reconstruir los docs originales a partir del doc pre-computado
    //    Necesitamos re-crear la estructura de liquidaciones_por_sala a partir de maquinas[]
    //    PERO es más simple: leer el periodo que ya tenemos + agregar el nuevo
    
    // Extraer periodo del nuevo upload
    const nuevoPeriodo = newLiqPorSalaDocs[0]?.fechas?.periodoLiquidacion;
    if (!nuevoPeriodo) {
      console.error('updateConNuevoPeriodo: No se pudo determinar el periodo del nuevo upload');
      return null;
    }

    // Verificar si este periodo ya está registrado
    const periodosExistentes = existing.periodosRegistrados || [];
    const yaExiste = periodosExistentes.includes(nuevoPeriodo);

    if (yaExiste) {
      // Si el periodo ya existe, necesitamos hacer un recálculo completo
      // porque no podemos "restar" el periodo viejo del análisis incremental
      return migrarEmpresa(empresaNorm, empresaNombre);
    }

    // 3. Merge incremental: agregar datos del nuevo periodo al análisis existente
    const periodosActualizados = [...periodosExistentes, nuevoPeriodo].sort((a, b) => periodoScore(a) - periodoScore(b));
    const periodoMasReciente = periodosActualizados[periodosActualizados.length - 1];

    // Rebuild machine map from existing data
    const machineMap = new Map();
    const totalMaquinasPorPeriodo = new Map();

    // Restore existing machines
    (existing.maquinas || []).forEach(m => {
      machineMap.set(m.key, {
        nuc: m.nuc,
        serial: m.serial,
        sala: m.sala,
        tipoApuesta: m.tipoApuesta,
        periodosEnCero: [...(m.periodosEnCero || [])],
        periodosTotales: [...(m.periodosTotales || [])],
        produccionUltimoPeriodo: m.produccionUltimoPeriodo || 0
      });
    });

    // Restore fleet counts from trend data
    (existing.tendencia || []).forEach(t => {
      const set = new Set();
      // We don't have exact fleet data, but we can use the count
      for (let i = 0; i < (t.totalMaquinas || 0); i++) {
        set.add(`_fleet_${t.periodo}_${i}`);
      }
      totalMaquinasPorPeriodo.set(t.periodo, set);
    });

    // Add new period data
    if (!totalMaquinasPorPeriodo.has(nuevoPeriodo)) {
      totalMaquinasPorPeriodo.set(nuevoPeriodo, new Set());
    }

    newLiqPorSalaDocs.forEach(liqDoc => {
      const sala = liqDoc?.sala?.nombre || 'Sin Sala';
      const maquinas = Array.isArray(liqDoc?.datosConsolidados) ? liqDoc.datosConsolidados : [];

      maquinas.forEach(m => {
        const serial = m?.serial || m?.Serial || 'N/A';
        const nucRaw = m?.nuc ?? m?.NUC ?? null;
        const nuc = nucRaw != null ? String(nucRaw) : 'N/A';
        const produccion = Number(m?.produccion) || 0;
        const tipoApuesta = m?.tipoApuesta || m?.tipo_apuesta || m?.tipo || 'N/A';

        const nucKey = serial !== 'N/A' ? `${serial}__${sala}` : nuc !== 'N/A' ? `${nuc}__${sala}` : null;
        if (!nucKey) return;

        totalMaquinasPorPeriodo.get(nuevoPeriodo).add(nucKey);
        const esEnCero = Math.abs(produccion) < ZERO_THRESHOLD;

        if (!machineMap.has(nucKey)) {
          machineMap.set(nucKey, {
            nuc, serial, sala, tipoApuesta,
            periodosEnCero: [],
            periodosTotales: [],
            produccionUltimoPeriodo: 0
          });
        }

        const record = machineMap.get(nucKey);
        if (!record.periodosTotales.includes(nuevoPeriodo)) {
          record.periodosTotales.push(nuevoPeriodo);
        }
        if (esEnCero && !record.periodosEnCero.includes(nuevoPeriodo)) {
          record.periodosEnCero.push(nuevoPeriodo);
        }
        record.produccionUltimoPeriodo = produccion;
      });
    });

    // Recalculate all derived fields
    const maquinasEnCero = [];

    machineMap.forEach((record, key) => {
      if (record.periodosEnCero.length === 0) return;

      const zeroPeriodosSorted = [...record.periodosEnCero].sort((a, b) => periodoScore(a) - periodoScore(b));
      const totalPeriodosSorted = [...record.periodosTotales].sort((a, b) => periodoScore(a) - periodoScore(b));

      const primerCero = zeroPeriodosSorted[0];
      const ultimoCero = zeroPeriodosSorted[zeroPeriodosSorted.length - 1];
      const esActualmenteEnCero = record.periodosEnCero.includes(periodoMasReciente);

      let mesesConsecutivos = 0;
      for (let i = periodosActualizados.length - 1; i >= 0; i--) {
        const p = periodosActualizados[i];
        if (record.periodosEnCero.includes(p)) {
          mesesConsecutivos++;
        } else if (record.periodosTotales.includes(p)) {
          break;
        }
      }

      const diasCalendario = diasDesdePeriodoHastaHoy(primerCero);
      const diasEntrePrimeroYUltimoCero = diasEntrePeriodos(primerCero, ultimoCero);

      let nivel;
      if (diasCalendario > 90) nivel = 'critico';
      else if (diasCalendario > 30) nivel = 'alerta';
      else nivel = 'reciente';

      maquinasEnCero.push({
        key, nuc: record.nuc, serial: record.serial, sala: record.sala,
        tipoApuesta: record.tipoApuesta,
        periodosEnCero: zeroPeriodosSorted,
        periodosTotales: totalPeriodosSorted,
        mesesEnCero: record.periodosEnCero.length,
        mesesConsecutivos, primerCero, ultimoCero,
        diasCalendario, diasEntrePrimeroYUltimoCero,
        esActualmenteEnCero, nivel,
        produccionUltimoPeriodo: record.produccionUltimoPeriodo
      });
    });

    maquinasEnCero.sort((a, b) => b.diasCalendario - a.diasCalendario);

    // Salas summary
    const salasMap = new Map();
    maquinasEnCero.forEach(m => {
      if (!salasMap.has(m.sala)) {
        salasMap.set(m.sala, { sala: m.sala, total: 0, criticas: 0, alertas: 0, recientes: 0, activas: 0, totalFlota: 0 });
      }
      const s = salasMap.get(m.sala);
      s.total++;
      if (m.nivel === 'critico') s.criticas++;
      else if (m.nivel === 'alerta') s.alertas++;
      else s.recientes++;
      if (m.esActualmenteEnCero) s.activas++;
    });

    // Fleet from new period
    newLiqPorSalaDocs.forEach(liq => {
      const sala = liq?.sala?.nombre || 'Sin Sala';
      const totalMaq = Array.isArray(liq?.datosConsolidados) ? liq.datosConsolidados.length : 0;
      if (salasMap.has(sala)) {
        salasMap.get(sala).totalFlota = totalMaq;
      }
    });

    const resumenPorSala = Array.from(salasMap.values()).sort((a, b) => b.total - a.total);

    // Trend data
    const tendencia = periodosActualizados.map(p => {
      let count = 0;
      machineMap.forEach(record => {
        if (record.periodosEnCero.includes(p)) count++;
      });
      return {
        periodo: p,
        periodoLabel: formatPeriodoLabel(p),
        maquinasEnCero: count,
        totalMaquinas: totalMaquinasPorPeriodo.get(p)?.size || 0
      };
    });

    // KPIs
    const totalEnCero = maquinasEnCero.length;
    const activasEnCero = maquinasEnCero.filter(m => m.esActualmenteEnCero).length;
    const diasPromedio = totalEnCero > 0
      ? Math.round(maquinasEnCero.reduce((sum, m) => sum + m.diasCalendario, 0) / totalEnCero)
      : 0;
    const peorMaquina = maquinasEnCero[0] ? {
      nuc: maquinasEnCero[0].nuc, serial: maquinasEnCero[0].serial,
      sala: maquinasEnCero[0].sala, diasCalendario: maquinasEnCero[0].diasCalendario
    } : null;
    const totalFlota = totalMaquinasPorPeriodo.get(periodoMasReciente)?.size || 0;
    const porcentajeEnCero = totalFlota > 0 ? ((activasEnCero / totalFlota) * 100).toFixed(1) : '0';

    const trendActual = tendencia.length > 0 ? tendencia[tendencia.length - 1].maquinasEnCero : 0;
    const trendAnterior = tendencia.length > 1 ? tendencia[tendencia.length - 2].maquinasEnCero : 0;
    const trendCambioPct = trendAnterior > 0 ? ((trendActual - trendAnterior) / trendAnterior * 100) : 0;

    const resultado = {
      empresa: empresaNorm,
      empresaNombre,
      periodosRegistrados: periodosActualizados,
      periodoMasReciente,
      maquinas: maquinasEnCero,
      kpis: {
        totalEnCero, activasEnCero, diasPromedio, peorMaquina,
        totalFlota, porcentajeEnCero, trendCambioPct,
        criticas: maquinasEnCero.filter(m => m.nivel === 'critico').length,
        alertas: maquinasEnCero.filter(m => m.nivel === 'alerta').length,
        recientes: maquinasEnCero.filter(m => m.nivel === 'reciente').length
      },
      resumenPorSala,
      tendencia
    };

    // Save
    await saveMaquinasEnCero(empresaNorm, resultado, fuente);

    return { success: true, data: resultado };
  } catch (error) {
    console.error('Error en actualización incremental de maquinas_en_cero:', error);
    throw error;
  }
};

/**
 * PARSER DE ARCHIVOS HOUNDOC/LIQUIDACIÓN
 * 
 * Parsea un archivo Excel/CSV con la misma estructura que las liquidaciones.
 * Extrae las máquinas y su producción, identificando las que están en cero.
 * 
 * @param {ArrayBuffer} fileBuffer - Buffer del archivo
 * @param {Object} XLSX - Referencia a la librería XLSX (se pasa para no importarla aquí)
 * @returns {Object} - { machines: [], periodo: string, summary: {} }
 */
export const parseHoundocFile = (fileBuffer, XLSX) => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length < 2) {
    throw new Error('El archivo no contiene datos suficientes');
  }

  // Detect header row
  const columnasClave = ['serial', 'nuc', 'nuid', 'establecimiento', 'sala', 'base', 'liquidacion', 'produccion'];
  let headerRow = -1;

  for (let fila = 0; fila < Math.min(15, data.length); fila++) {
    const row = data[fila];
    if (!row) continue;
    const rowText = row.map(cell => String(cell || '').toLowerCase().trim());
    const coincidencias = columnasClave.filter(clave => rowText.some(cell => cell.includes(clave)));
    if (coincidencias.length >= 3) {
      headerRow = fila;
      break;
    }
  }

  // Fallback: flexible search
  if (headerRow === -1) {
    const palabrasFlexibles = ['serial', 'nuc', 'establecimiento', 'contrato', 'codigo', 'tipo', 'fecha', 'base', 'liquidacion', 'produccion', 'ingresos', 'casino', 'sala'];
    for (let fila = 0; fila < Math.min(15, data.length); fila++) {
      const row = data[fila];
      if (!row) continue;
      const rowText = row.map(cell => String(cell || '').toLowerCase().trim());
      const coincidencias = palabrasFlexibles.filter(w => rowText.some(cell => cell.includes(w)));
      if (coincidencias.length >= 4) {
        headerRow = fila;
        break;
      }
    }
  }

  if (headerRow === -1) {
    throw new Error('No se pudieron detectar los encabezados del archivo. Verifica que el formato sea correcto.');
  }

  // Map columns
  const headers = data[headerRow];
  const columnMap = {};

  headers.forEach((header, index) => {
    const h = String(header || '').toLowerCase().trim();
    if (h.includes('nuc')) columnMap.nuc = index;
    else if (h.includes('serial')) columnMap.serial = index;
    else if (h.includes('establecimiento') || h.includes('sala') || h.includes('casino')) {
      if (!columnMap.establecimiento) columnMap.establecimiento = index;
    }
    else if ((h.includes('tipo') && h.includes('apuesta')) || h.includes('categoria')) columnMap.tipoApuesta = index;
    else if (h.includes('base') && (h.includes('liquidaci') || h.includes('liquidacion'))) columnMap.baseLiquidacion = index;
    else if (h.includes('produccion') || h.includes('ingresos') || h.includes('valor') || h.includes('monto')) {
      if (!columnMap.baseLiquidacion) columnMap.baseLiquidacion = index;
    }
  });

  if (columnMap.nuc === undefined) {
    throw new Error('No se encontró la columna NUC en el archivo');
  }

  // Process rows
  const rows = data.slice(headerRow + 1);
  const machinesByKey = new Map();

  rows.forEach(row => {
    if (!row || !Array.isArray(row)) return;
    const nuc = String(row[columnMap.nuc] || '').trim();
    if (!nuc) return;

    const serial = columnMap.serial !== undefined ? String(row[columnMap.serial] || '').trim() : '';
    const establecimiento = columnMap.establecimiento !== undefined ? String(row[columnMap.establecimiento] || '').trim() : 'Sin Sala';
    const tipoApuesta = columnMap.tipoApuesta !== undefined ? String(row[columnMap.tipoApuesta] || '').trim() : '';

    let produccion = 0;
    if (columnMap.baseLiquidacion !== undefined) {
      const raw = row[columnMap.baseLiquidacion];
      produccion = Number(raw) || 0;
    }

    const key = serial ? `${serial}__${establecimiento}` : `${nuc}__${establecimiento}`;

    if (!machinesByKey.has(key)) {
      machinesByKey.set(key, {
        nuc, serial, establecimiento, tipoApuesta,
        produccionTotal: 0,
        filas: 0
      });
    }

    const m = machinesByKey.get(key);
    m.produccionTotal += produccion;
    m.filas++;
  });

  // Build result grouped by sala
  const machines = [];
  const salasSummary = new Map();

  machinesByKey.forEach((m, key) => {
    machines.push({
      key,
      nuc: m.nuc,
      serial: m.serial || 'N/A',
      establecimiento: m.establecimiento,
      tipoApuesta: m.tipoApuesta || 'N/A',
      produccion: m.produccionTotal,
      esEnCero: Math.abs(m.produccionTotal) < ZERO_THRESHOLD,
      filas: m.filas
    });

    if (!salasSummary.has(m.establecimiento)) {
      salasSummary.set(m.establecimiento, { total: 0, enCero: 0 });
    }
    const s = salasSummary.get(m.establecimiento);
    s.total++;
    if (Math.abs(m.produccionTotal) < ZERO_THRESHOLD) s.enCero++;
  });

  const totalMaquinas = machines.length;
  const enCero = machines.filter(m => m.esEnCero).length;

  return {
    machines,
    summary: {
      totalMaquinas,
      enCero,
      conProduccion: totalMaquinas - enCero,
      salasDetectadas: salasSummary.size,
      salasSummary: Object.fromEntries(salasSummary),
      headerRow,
      totalFilas: rows.length
    }
  };
};

/**
 * ACTUALIZACIÓN CON ARCHIVO HOUNDOC
 * 
 * Recibe las máquinas parseadas de un archivo Houndoc y las merge con
 * el documento pre-computado existente.
 * 
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @param {string} empresaNombre - Nombre legible
 * @param {Array} parsedMachines - Resultado de parseHoundocFile().machines
 * @param {string} periodoStr - Periodo del archivo (ej: "febrero_2026")
 */
export const updateConHoundoc = async (empresaNorm, empresaNombre, parsedMachines, periodoStr) => {
  // Convert parsed machines into liquidaciones_por_sala-like documents
  // Group by establecimiento (sala)
  const salaGroups = new Map();

  parsedMachines.forEach(m => {
    const sala = m.establecimiento || 'Sin Sala';
    if (!salaGroups.has(sala)) {
      salaGroups.set(sala, []);
    }
    salaGroups.get(sala).push({
      serial: m.serial,
      nuc: m.nuc,
      establecimiento: sala,
      tipoApuesta: m.tipoApuesta,
      produccion: m.produccion
    });
  });

  // Create pseudo-documents that look like liquidaciones_por_sala
  const pseudoDocs = [];
  salaGroups.forEach((maquinas, sala) => {
    pseudoDocs.push({
      fechas: { periodoLiquidacion: periodoStr },
      sala: { nombre: sala },
      datosConsolidados: maquinas
    });
  });

  // Use the standard incremental update
  return updateConNuevoPeriodo(empresaNorm, empresaNombre, pseudoDocs, 'houndoc');
};

// ===== FECHAS EXACTAS — EPISODIOS DE MÁQUINAS EN CERO =====

/**
 * Parsea un archivo XLSX manteniendo filas diarias individuales (con fecha).
 * A diferencia de parseHoundocFile que consolida por máquina, esta función
 * mantiene cada fila por separado para poder extraer fechas exactas.
 * 
 * @param {ArrayBuffer} fileBuffer - Buffer del archivo XLSX
 * @param {Object} XLSXLib - Referencia a la librería XLSX
 * @returns {Array} - [{ key, nuc, serial, establecimiento, fecha: Date|null, produccion: number }]
 */
export const parseArchivoConFechasDiarias = (fileBuffer, XLSXLib) => {
  const workbook = XLSXLib.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSXLib.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length < 2) throw new Error('Archivo sin datos suficientes');

  // Detect header row (same heuristic as parseHoundocFile)
  const columnasClave = ['serial', 'nuc', 'nuid', 'establecimiento', 'sala', 'base', 'liquidacion', 'produccion', 'fecha'];
  let headerRow = -1;

  for (let fila = 0; fila < Math.min(15, data.length); fila++) {
    const row = data[fila];
    if (!row) continue;
    const rowText = row.map(cell => String(cell || '').toLowerCase().trim());
    const coincidencias = columnasClave.filter(clave => rowText.some(cell => cell.includes(clave)));
    if (coincidencias.length >= 3) { headerRow = fila; break; }
  }

  if (headerRow === -1) {
    const palabrasFlexibles = ['serial', 'nuc', 'establecimiento', 'contrato', 'codigo', 'tipo', 'fecha', 'base', 'liquidacion', 'produccion'];
    for (let fila = 0; fila < Math.min(15, data.length); fila++) {
      const row = data[fila];
      if (!row) continue;
      const rowText = row.map(cell => String(cell || '').toLowerCase().trim());
      const coincidencias = palabrasFlexibles.filter(w => rowText.some(cell => cell.includes(w)));
      if (coincidencias.length >= 4) { headerRow = fila; break; }
    }
  }

  if (headerRow === -1) throw new Error('No se detectaron encabezados en el archivo');

  // Map columns
  const headers = data[headerRow];
  const columnMap = {};

  headers.forEach((header, index) => {
    const h = String(header || '').toLowerCase().trim();
    if (h.includes('nuc')) columnMap.nuc = index;
    else if (h.includes('serial')) columnMap.serial = index;
    else if (h.includes('establecimiento') || h.includes('sala') || h.includes('casino')) {
      if (!columnMap.establecimiento) columnMap.establecimiento = index;
    }
    else if (h.includes('fecha')) { if (!columnMap.fecha) columnMap.fecha = index; }
    else if (h.includes('base') && (h.includes('liquidaci') || h.includes('liquidacion'))) columnMap.baseLiquidacion = index;
    else if (h.includes('produccion') || h.includes('ingresos') || h.includes('valor') || h.includes('monto')) {
      if (!columnMap.baseLiquidacion) columnMap.baseLiquidacion = index;
    }
  });

  if (columnMap.nuc === undefined && columnMap.serial === undefined) {
    throw new Error('No se encontró columna NUC ni Serial en el archivo');
  }

  // Process rows — keep individual daily records
  const rows = data.slice(headerRow + 1);
  const dailyRows = [];

  rows.forEach(row => {
    if (!row || !Array.isArray(row)) return;
    const nuc = columnMap.nuc !== undefined ? String(row[columnMap.nuc] || '').trim() : '';
    const serial = columnMap.serial !== undefined ? String(row[columnMap.serial] || '').trim() : '';
    if (!nuc && !serial) return;

    const establecimiento = columnMap.establecimiento !== undefined
      ? String(row[columnMap.establecimiento] || '').trim()
      : 'Sin Sala';

    let produccion = 0;
    if (columnMap.baseLiquidacion !== undefined) {
      produccion = Number(row[columnMap.baseLiquidacion]) || 0;
    }

    let fecha = null;
    if (columnMap.fecha !== undefined && row[columnMap.fecha] != null && row[columnMap.fecha] !== '') {
      const raw = row[columnMap.fecha];
      if (typeof raw === 'number') {
        // Excel serial date → JS Date (UTC)
        fecha = new Date((raw - 25569) * 86400 * 1000);
      } else {
        fecha = new Date(raw);
      }
      if (isNaN(fecha.getTime())) fecha = null;
    }

    const key = serial ? `${serial}__${establecimiento}` : `${nuc}__${establecimiento}`;
    dailyRows.push({ key, nuc, serial, establecimiento, fecha, produccion });
  });

  return dailyRows;
};

/**
 * Convierte originalData (de procesarDatos en LiquidacionesPage) al mismo formato
 * que parseArchivoConFechasDiarias. Útil para la inyección en el flujo de guardar.
 * 
 * @param {Array} originalData - Datos del procesarDatos: [{ nuc, serial, establecimiento, fecha, baseLiquidacion }]
 * @returns {Array} - [{ key, nuc, serial, establecimiento, fecha: Date|null, produccion: number }]
 */
export const convertirOriginalDataAFilasDiarias = (originalData) => {
  if (!Array.isArray(originalData)) return [];

  return originalData.map(row => {
    const serial = String(row.serial || '').trim();
    const nuc = String(row.nuc || '').trim();
    const establecimiento = String(row.establecimiento || '').trim() || 'Sin Sala';

    if (!nuc && !serial) return null;

    const key = serial ? `${serial}__${establecimiento}` : `${nuc}__${establecimiento}`;

    let fecha = null;
    if (row.fecha != null && row.fecha !== '') {
      if (typeof row.fecha === 'number') {
        fecha = new Date((row.fecha - 25569) * 86400 * 1000);
      } else {
        fecha = new Date(row.fecha);
      }
      if (isNaN(fecha.getTime())) fecha = null;
    }

    const produccion = parseFloat(row.baseLiquidacion) || 0;
    return { key, nuc, serial, establecimiento, fecha, produccion };
  }).filter(Boolean);
};

/**
 * A partir de filas diarias (posiblemente de múltiples periodos),
 * calcula por cada máquina:
 * - lastProductiveDay: último día con producción > 0
 * - lastProductiveAmount: monto de ese último día productivo
 * - firstKnownDate / lastKnownDate: rango de datos disponibles
 * 
 * @param {Array} allDailyRows - Resultado de parseArchivoConFechasDiarias o convertirOriginalData
 * @returns {Map<string, Object>} - Map de machineKey → producción data
 */
export const extraerProduccionPorMaquina = (allDailyRows) => {
  const machineData = new Map();

  allDailyRows.forEach(row => {
    if (!row.fecha || !row.key) return;

    if (!machineData.has(row.key)) {
      machineData.set(row.key, {
        lastProductiveDay: null,
        lastProductiveAmount: 0,
        firstKnownDate: new Date(row.fecha),
        lastKnownDate: new Date(row.fecha),
        totalProduccion: 0,
        totalFilas: 0
      });
    }

    const md = machineData.get(row.key);
    md.totalProduccion += row.produccion;
    md.totalFilas++;

    const rowDate = new Date(row.fecha);
    if (rowDate < md.firstKnownDate) md.firstKnownDate = new Date(rowDate);
    if (rowDate > md.lastKnownDate) md.lastKnownDate = new Date(rowDate);

    if (row.produccion > ZERO_THRESHOLD) {
      if (!md.lastProductiveDay || rowDate > md.lastProductiveDay) {
        md.lastProductiveDay = new Date(rowDate);
        md.lastProductiveAmount = row.produccion;
      }
    }
  });

  return machineData;
};

/**
 * A partir de la producción por máquina y el documento existente de maquinas_en_cero,
 * construye el campo ultimoEpisodio para cada máquina de la lista.
 * 
 * Reglas:
 * - Si la máquina tuvo producción en algún momento: fechaInicioCero = día siguiente al último productivo
 * - Si nunca tuvo producción: fechaInicioCero = primer día conocido en los datos
 * - Si está recuperada: fechaFin se calcula (último día en cero)
 * - Si sigue en cero: fechaFin = null
 * 
 * @param {Map} machineProductionData - De extraerProduccionPorMaquina()
 * @param {Object} existingDoc - Documento de maquinas_en_cero (con .maquinas[])
 * @returns {Map<string, Object>} - Map de machineKey → ultimoEpisodio
 */
export const construirEpisodios = (machineProductionData, existingDoc) => {
  if (!existingDoc?.maquinas?.length) return new Map();

  const episodios = new Map();
  const hoy = new Date();

  existingDoc.maquinas.forEach(maq => {
    const prodData = machineProductionData.get(maq.key);

    if (!prodData) {
      // Sin datos diarios → fallback a nivel de periodo
      const inicioDate = periodoToDate(maq.primerCero);
      const finDate = !maq.esActualmenteEnCero ? periodoEndDate(maq.ultimoCero) : null;
      
      episodios.set(maq.key, {
        fechaInicioCero: inicioDate ? inicioDate.toISOString().split('T')[0] : null,
        ultimaFechaConProduccion: null,
        produccionAntesDeCero: 0,
        fechaFin: finDate ? finDate.toISOString().split('T')[0] : null,
        diasInactividad: maq.esActualmenteEnCero && inicioDate
          ? Math.max(0, Math.round((hoy - inicioDate) / 86400000))
          : maq.diasEntrePrimeroYUltimoCero || 0,
        periodoOrigen: maq.primerCero,
        fuenteFecha: 'periodo'
      });
      return;
    }

    if (prodData.lastProductiveDay) {
      // ✅ Máquina produjo en algún momento → tenemos fecha exacta de transición
      const nextDay = new Date(prodData.lastProductiveDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const fechaInicio = nextDay.toISOString().split('T')[0];
      const diasInactividad = maq.esActualmenteEnCero
        ? Math.max(0, Math.round((hoy - nextDay) / 86400000))
        : maq.diasEntrePrimeroYUltimoCero || 0;

      episodios.set(maq.key, {
        fechaInicioCero: fechaInicio,
        ultimaFechaConProduccion: prodData.lastProductiveDay.toISOString().split('T')[0],
        produccionAntesDeCero: prodData.lastProductiveAmount,
        fechaFin: maq.esActualmenteEnCero ? null : (periodoEndDate(maq.ultimoCero)?.toISOString().split('T')[0] || null),
        diasInactividad,
        periodoOrigen: maq.primerCero,
        fuenteFecha: 'exacta'
      });
    } else {
      // Máquina NUNCA produjo en datos conocidos → en cero desde el inicio
      const firstDate = prodData.firstKnownDate || periodoToDate(maq.primerCero);
      const fechaInicio = firstDate ? firstDate.toISOString().split('T')[0] : null;
      const inicioDate = firstDate || periodoToDate(maq.primerCero);
      const diasInactividad = maq.esActualmenteEnCero && inicioDate
        ? Math.max(0, Math.round((hoy - inicioDate) / 86400000))
        : maq.diasCalendario || 0;

      episodios.set(maq.key, {
        fechaInicioCero: fechaInicio,
        ultimaFechaConProduccion: null,
        produccionAntesDeCero: 0,
        fechaFin: maq.esActualmenteEnCero ? null : (periodoEndDate(maq.ultimoCero)?.toISOString().split('T')[0] || null),
        diasInactividad,
        periodoOrigen: maq.primerCero,
        fuenteFecha: 'desde_inicio_datos'
      });
    }
  });

  return episodios;
};

/**
 * Aplica los episodios calculados al documento de maquinas_en_cero en Firestore.
 * Agrega el campo ultimoEpisodio a cada máquina correspondiente.
 * 
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @param {Map} episodiosMap - Resultado de construirEpisodios()
 * @returns {boolean} - true si se actualizó, false si no había doc
 */
export const aplicarEpisodiosAlDocumento = async (empresaNorm, episodiosMap) => {
  const docRef = doc(db, COLLECTION_NAME, empresaNorm);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return false;

  const data = docSnap.data();
  const maquinasActualizadas = (data.maquinas || []).map(maq => {
    const episodio = episodiosMap.get(maq.key);
    if (episodio) {
      return { ...maq, ultimoEpisodio: episodio };
    }
    return maq;
  });

  await setDoc(docRef, {
    ...data,
    maquinas: maquinasActualizadas,
    ultimaActualizacionFechas: serverTimestamp(),
    backfillCompletado: true
  });

  return true;
};

/**
 * Helper para descargar un archivo de Firebase Storage.
 * Maneja dev (proxy CORS) y producción (acceso directo).
 */
const downloadFileFromStorage = async (storagePath) => {
  const isDevelopment = typeof window !== 'undefined' &&
    (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

  if (isDevelopment) {
    const proxyUrl = `https://us-central1-dr-group-cd21b.cloudfunctions.net/storageProxy?path=${encodeURIComponent(storagePath)}`;
    const response = await fetch(proxyUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    return response.blob();
  }

  try {
    const fileRef = ref(storage, storagePath);
    return await getBlob(fileRef);
  } catch {
    const fileRef = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(fileRef);
    const response = await fetch(downloadUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`Download error: ${response.status}`);
    return response.blob();
  }
};

/**
 * Resuelve la ruta de Storage desde los metadatos del archivo.
 * Soporta formatos nuevos y legacy.
 */
const resolveStoragePath = (meta) => {
  if (!meta) return null;
  if (meta.nombreStorage) return meta.nombreStorage;
  if (meta.path) return meta.path;
  if (meta.fileName) return meta.fileName;
  const possibleUrl = meta.url || meta.downloadURL;
  if (possibleUrl) {
    const match = String(possibleUrl).match(/\/o\/(.+?)\?/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
};

/**
 * BACKFILL MASIVO: Descarga TODOS los archivos originales de las liquidaciones
 * de una empresa, extrae las filas diarias con fechas, y calcula el campo
 * ultimoEpisodio para cada máquina en cero.
 * 
 * @param {string} empresaNorm - Nombre normalizado de la empresa
 * @param {string} empresaNombre - Nombre legible
 * @param {Object} XLSXLib - Referencia a la librería XLSX
 * @param {Function} onProgress - Callback de progreso
 * @returns {Object} - Resultado del backfill
 */
export const backfillFechasExactas = async (empresaNorm, empresaNombre, XLSXLib, onProgress) => {
  try {
    onProgress?.({ step: 'inicio', message: 'Verificando datos existentes...' });

    // 1. Verificar que existe el documento de maquinas_en_cero
    const existingDoc = await getMaquinasEnCero(empresaNorm);
    if (!existingDoc || !existingDoc.maquinas?.length) {
      onProgress?.({ step: 'error', message: 'No hay máquinas en cero registradas. Ejecuta la migración primero.' });
      return { success: false, message: 'No hay datos de máquinas en cero' };
    }

    onProgress?.({ step: 'buscando', message: 'Buscando liquidaciones históricas en Firebase...' });

    // 2. Buscar TODAS las liquidaciones de esta empresa
    const liqQuery = query(
      collection(db, 'liquidaciones'),
      where('metadatos.empresaNormalizada', '==', empresaNorm)
    );
    const liqSnap = await getDocs(liqQuery);

    // Dedup y extraer info de archivos
    const liquidaciones = [];
    liqSnap.docs.forEach(d => {
      const data = d.data();
      const archivoMeta = data.archivos?.archivoOriginal || data.archivoOriginal;
      const periodo = data.fechas?.periodoLiquidacion || data.periodoLiquidacion;
      const storagePath = resolveStoragePath(archivoMeta);

      if (storagePath && periodo) {
        liquidaciones.push({ id: d.id, periodo, storagePath, archivoMeta });
      }
    });

    if (liquidaciones.length === 0) {
      onProgress?.({ step: 'error', message: 'No se encontraron archivos originales en las liquidaciones guardadas.' });
      return { success: false, message: 'No hay archivos originales en Storage' };
    }

    // Ordenar por periodo cronológicamente
    liquidaciones.sort((a, b) => periodoScore(a.periodo) - periodoScore(b.periodo));

    onProgress?.({ step: 'descargando', message: `Descargando y parseando ${liquidaciones.length} archivos...` });

    // 3. Descargar y parsear cada archivo
    const allDailyRows = [];
    let processed = 0;
    let errores = 0;

    for (const liq of liquidaciones) {
      try {
        const blob = await downloadFileFromStorage(liq.storagePath);
        const arrayBuffer = await blob.arrayBuffer();
        const dailyRows = parseArchivoConFechasDiarias(arrayBuffer, XLSXLib);
        allDailyRows.push(...dailyRows);

        processed++;
        onProgress?.({
          step: 'procesando',
          message: `✅ ${processed}/${liquidaciones.length}: ${formatPeriodoLabel(liq.periodo)} (${dailyRows.length} filas)`
        });
      } catch (fileErr) {
        errores++;
        processed++;
        onProgress?.({
          step: 'procesando',
          message: `⚠️ ${processed}/${liquidaciones.length}: Error en ${formatPeriodoLabel(liq.periodo)} - ${fileErr.message}`
        });
      }
    }

    if (allDailyRows.length === 0) {
      onProgress?.({ step: 'error', message: 'No se pudieron extraer datos diarios de ningún archivo.' });
      return { success: false, message: 'Sin datos diarios extraíbles' };
    }

    onProgress?.({ step: 'calculando', message: `Analizando ${allDailyRows.length} filas diarias para ${existingDoc.maquinas.length} máquinas...` });

    // 4. Extraer producción por máquina
    const machineProductionData = extraerProduccionPorMaquina(allDailyRows);

    // 5. Construir episodios
    const episodios = construirEpisodios(machineProductionData, existingDoc);

    // 6. Guardar en Firestore
    onProgress?.({ step: 'guardando', message: 'Guardando fechas exactas en Firebase...' });
    await aplicarEpisodiosAlDocumento(empresaNorm, episodios);

    const exactas = Array.from(episodios.values()).filter(e => e.fuenteFecha === 'exacta').length;
    const desdePeriodo = Array.from(episodios.values()).filter(e => e.fuenteFecha === 'periodo').length;
    const desdeInicio = Array.from(episodios.values()).filter(e => e.fuenteFecha === 'desde_inicio_datos').length;

    onProgress?.({
      step: 'done',
      message: `✅ Backfill completo: ${exactas} con fecha exacta, ${desdeInicio} desde inicio de datos, ${desdePeriodo} a nivel de periodo`
    });

    return {
      success: true,
      totalMaquinas: episodios.size,
      conFechaExacta: exactas,
      conFechaDesdePeriodo: desdePeriodo,
      conFechaDesdeInicio: desdeInicio,
      archivosProcessados: processed,
      archivosConError: errores,
      totalFilasDiarias: allDailyRows.length
    };
  } catch (error) {
    onProgress?.({ step: 'error', message: `Error crítico: ${error.message}` });
    throw error;
  }
};

/**
 * Inyección para flujo de guardado de liquidación nueva.
 * Toma originalData (filas diarias en memoria), extrae episodios y actualiza
 * el documento de maquinas_en_cero.
 * 
 * @param {string} empresaNorm - Nombre normalizado
 * @param {Array} originalData - De procesarDatos() en LiquidacionesPage
 */
export const actualizarEpisodiosDesdeLiquidacion = async (empresaNorm, originalData) => {
  try {
    const dailyRows = convertirOriginalDataAFilasDiarias(originalData);
    if (dailyRows.length === 0) return;

    const machineData = extraerProduccionPorMaquina(dailyRows);
    const existingDoc = await getMaquinasEnCero(empresaNorm);
    if (!existingDoc?.maquinas?.length) return;

    const episodios = construirEpisodios(machineData, existingDoc);
    if (episodios.size > 0) {
      await aplicarEpisodiosAlDocumento(empresaNorm, episodios);
    }
  } catch (err) {
    console.warn('⚠️ No se pudieron actualizar episodios de fechas exactas:', err.message);
  }
};

/**
 * Inyección para flujo de Houndoc.
 * Toma las filas diarias ya parseadas del archivo Houndoc y actualiza episodios.
 * 
 * @param {string} empresaNorm - Nombre normalizado
 * @param {ArrayBuffer} fileBuffer - Buffer del archivo original
 * @param {Object} XLSXLib - Referencia a XLSX
 */
export const actualizarEpisodiosDesdeHoundoc = async (empresaNorm, fileBuffer, XLSXLib) => {
  try {
    const dailyRows = parseArchivoConFechasDiarias(fileBuffer, XLSXLib);
    if (dailyRows.length === 0) return;

    const machineData = extraerProduccionPorMaquina(dailyRows);
    const existingDoc = await getMaquinasEnCero(empresaNorm);
    if (!existingDoc?.maquinas?.length) return;

    const episodios = construirEpisodios(machineData, existingDoc);
    if (episodios.size > 0) {
      await aplicarEpisodiosAlDocumento(empresaNorm, episodios);
    }
  } catch (err) {
    console.warn('⚠️ No se pudieron actualizar episodios desde Houndoc:', err.message);
  }
};

// Export service object for convenience
const maquinasEnCeroService = {
  normalizeEmpresa,
  periodoToDate,
  periodoEndDate,
  periodoScore,
  formatPeriodoLabel,
  diasEntrePeriodos,
  diasDesdePeriodoHastaHoy,
  computeMaquinasEnCero,
  getMaquinasEnCero,
  saveMaquinasEnCero,
  migrarEmpresa,
  updateConNuevoPeriodo,
  updateConHoundoc,
  parseHoundocFile,
  parseArchivoConFechasDiarias,
  convertirOriginalDataAFilasDiarias,
  extraerProduccionPorMaquina,
  construirEpisodios,
  aplicarEpisodiosAlDocumento,
  backfillFechasExactas,
  actualizarEpisodiosDesdeLiquidacion,
  actualizarEpisodiosDesdeHoundoc
};

export default maquinasEnCeroService;
