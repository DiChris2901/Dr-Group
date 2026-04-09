import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { usePermissions } from './usePermissions';
import { APP_PERMISSIONS } from '../constants/permissions';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_LABEL = {
  enero: 'Ene', febrero: 'Feb', marzo: 'Mar', abril: 'Abr',
  mayo: 'May', junio: 'Jun', julio: 'Jul', agosto: 'Ago',
  septiembre: 'Sep', octubre: 'Oct', noviembre: 'Nov', diciembre: 'Dic'
};

/**
 * Obtiene el periodo actual en formato "mes_año"
 */
export function getPeriodoActual() {
  const hoy = new Date();
  return `${MESES[hoy.getMonth()]}_${hoy.getFullYear()}`;
}

/**
 * Obtiene el periodo anterior (mes vencido) en formato "mes_año"
 * Las liquidaciones son mes vencido, así que el último periodo disponible es el mes anterior.
 */
export function getPeriodoAnterior() {
  const hoy = new Date();
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return `${MESES[anterior.getMonth()]}_${anterior.getFullYear()}`;
}

/**
 * Formatea "enero_2025" → "Ene 2025"
 */
export function formatPeriodo(periodo) {
  if (!periodo) return '';
  const [mes, año] = periodo.split('_');
  return `${MESES_LABEL[mes] || mes} ${año}`;
}

/**
 * Formatea "enero_2025" → "Enero 2025"
 */
export function formatPeriodoLargo(periodo) {
  if (!periodo) return '';
  const [mes, año] = periodo.split('_');
  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`;
}

/**
 * Genera lista de periodos hacia atrás desde el actual
 */
export function generarPeriodos(cantidad = 12) {
  const periodos = [];
  const hoy = new Date();
  // Empezar desde el mes anterior (mes vencido)
  for (let i = 1; i <= cantidad; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    periodos.push(`${MESES[fecha.getMonth()]}_${fecha.getFullYear()}`);
  }
  return periodos;
}

/**
 * useLiquidaciones — Hook para consultar liquidaciones (solo lectura)
 * 
 * Usa getDocs en lugar de onSnapshot para minimizar lecturas Firestore.
 * Incluye queries para liquidaciones consolidadas, por sala, y máquinas en cero.
 */
export function useLiquidaciones() {
  const { can } = usePermissions();
  const hasPermission = can(APP_PERMISSIONS.LIQUIDACIONES_VER);

  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar lista de empresas con liquidaciones
  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const cargarEmpresas = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'liquidaciones'),
          orderBy('fechas.createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        const empresasMap = new Map();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const nombre = typeof data.empresa === 'object'
            ? data.empresa.nombre
            : data.empresa;
          const normalizado = typeof data.empresa === 'object'
            ? data.empresa.normalizado
            : (nombre || '').toLowerCase().replace(/\s+/g, '_');

          if (nombre && !empresasMap.has(normalizado)) {
            empresasMap.set(normalizado, { nombre, normalizado });
          }
        });

        if (!cancelled) {
          const lista = Array.from(empresasMap.values()).sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          );
          setEmpresas(lista);
          if (lista.length > 0 && !empresaSeleccionada) {
            setEmpresaSeleccionada(lista[0]);
          }
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Error al cargar empresas');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargarEmpresas();
    return () => { cancelled = true; };
  }, [hasPermission]);

  return {
    empresas,
    empresaSeleccionada,
    setEmpresaSeleccionada,
    loading,
    error,
    hasPermission,
  };
}

/**
 * useLiquidacionesPorPeriodo — Carga liquidaciones por sala para un periodo y empresa
 */
export function useLiquidacionesPorPeriodo(empresaNormalizada, periodo) {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [consolidado, setConsolidado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!empresaNormalizada || !periodo) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    try {
      // Cargar liquidaciones por sala
      const qSala = query(
        collection(db, 'liquidaciones_por_sala'),
        where('empresa.normalizado', '==', empresaNormalizada),
        where('fechas.periodoLiquidacion', '==', periodo)
      );
      const snapshotSala = await getDocs(qSala);
      const porSala = snapshotSala.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => {
        const nombreA = a.sala?.nombre || '';
        const nombreB = b.sala?.nombre || '';
        return nombreA.localeCompare(nombreB);
      });

      // Cargar consolidado general
      const qConsolidado = query(
        collection(db, 'liquidaciones'),
        where('empresa.normalizado', '==', empresaNormalizada),
        where('fechas.periodoLiquidacion', '==', periodo),
        limit(1)
      );
      const snapshotConsolidado = await getDocs(qConsolidado);
      const consolidadoDoc = snapshotConsolidado.docs.length > 0
        ? { id: snapshotConsolidado.docs[0].id, ...snapshotConsolidado.docs[0].data() }
        : null;

      if (!cancelled) {
        setLiquidaciones(porSala);
        setConsolidado(consolidadoDoc);
      }
    } catch (err) {
      if (!cancelled) {
        setError('Error al cargar liquidaciones del periodo');
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => { cancelled = true; };
  }, [empresaNormalizada, periodo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // KPIs calculados
  const kpis = useMemo(() => {
    if (!liquidaciones.length && !consolidado) {
      return { totalSalas: 0, totalMaquinas: 0, produccionTotal: 0, impuestosTotal: 0, promedioSala: 0 };
    }

    // Preferir metricas del consolidado (estructura real de Firestore)
    const metricas = consolidado?.metricas;
    if (metricas) {
      const totalSalas = metricas.totalEstablecimientos || liquidaciones.length;
      const totalMaquinas = metricas.maquinasConsolidadas || 0;
      const produccionTotal = metricas.totalProduccion || 0;
      const impuestosTotal = metricas.totalImpuestos || 0;
      const promedioSala = totalSalas > 0 ? produccionTotal / totalSalas : 0;
      return { totalSalas, totalMaquinas, produccionTotal, impuestosTotal, promedioSala };
    }

    // Fallback a datosConsolidados si existe
    const datos = consolidado?.datosConsolidados || [];
    const reporteSala = consolidado?.reporteBySala || [];

    const totalMaquinas = datos.length;
    const produccionTotal = datos.reduce((s, d) => s + (d.produccion || 0), 0);
    const impuestosTotal = datos.reduce((s, d) => s + (d.totalImpuestos || 0), 0);
    const totalSalas = reporteSala.length || liquidaciones.length;
    const promedioSala = totalSalas > 0 ? produccionTotal / totalSalas : 0;

    return { totalSalas, totalMaquinas, produccionTotal, impuestosTotal, promedioSala };
  }, [liquidaciones, consolidado]);

  return { liquidaciones, consolidado, kpis, loading, error, refetch: cargar };
}

/**
 * useLiquidacionesEstadisticas — KPIs y tendencias históricas
 */
export function useLiquidacionesEstadisticas(empresaNormalizada, meses = 6) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!empresaNormalizada) return;

    setLoading(true);
    setError(null);

    try {
      // Query sin orderBy para evitar dependencia de índice compuesto
      const q = query(
        collection(db, 'liquidaciones'),
        where('empresa.normalizado', '==', empresaNormalizada)
      );
      const snapshot = await getDocs(q);

      // Ordenar client-side por createdAt desc y tomar los últimos N
      const sortedDocs = snapshot.docs
        .sort((a, b) => {
          const aTime = a.data().fechas?.createdAt?.toMillis?.() || 0;
          const bTime = b.data().fechas?.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        })
        .slice(0, meses);

      const resultado = sortedDocs.map((docSnap) => {
        const d = docSnap.data();
        const metricas = d.metricas || {};
        const produccion = metricas.totalProduccion || 0;
        const impuestos = metricas.totalImpuestos || 0;
        const maquinas = metricas.maquinasConsolidadas || 0;
        const salas = metricas.totalEstablecimientos || 0;

        return {
          id: docSnap.id,
          periodo: d.fechas?.periodoLiquidacion || '',
          produccion,
          impuestos,
          maquinas,
          salas,
          cumplimientoTx: 0,
        };
      }).reverse(); // cronológico

      setData(resultado);
    } catch (err) {
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [empresaNormalizada, meses]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // KPIs resumen
  const resumen = useMemo(() => {
    if (!data.length) return null;
    const ultimo = data[data.length - 1];
    const penultimo = data.length > 1 ? data[data.length - 2] : null;

    const variacionProd = penultimo && penultimo.produccion !== 0
      ? (((ultimo.produccion - penultimo.produccion) / Math.abs(penultimo.produccion)) * 100).toFixed(1)
      : null;

    return {
      periodoActual: ultimo.periodo,
      produccionActual: ultimo.produccion,
      impuestosActual: ultimo.impuestos,
      maquinasActual: ultimo.maquinas,
      salasActual: ultimo.salas,
      cumplimientoTxActual: ultimo.cumplimientoTx,
      variacionProduccion: variacionProd ? Number(variacionProd) : null,
      totalPeriodos: data.length,
    };
  }, [data]);

  return { data, resumen, loading, error, refetch: cargar };
}

/**
 * useMaquinasEnCero — Consulta máquinas con producción cero
 */
export function useMaquinasEnCero(empresaNormalizada) {
  const [maquinas, setMaquinas] = useState([]);
  const [kpisData, setKpisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [periodoReciente, setPeriodoReciente] = useState('');

  const cargar = useCallback(async () => {
    if (!empresaNormalizada) return;

    setLoading(true);
    setError(null);

    try {
      // Documento ID = empresa normalizada
      const docSnap = await getDoc(doc(db, 'maquinas_en_cero', empresaNormalizada));

      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaquinas(data.maquinas || []);
        setKpisData(data.kpis || null);
        setPeriodoReciente(data.periodoMasReciente || '');
      } else {
        setMaquinas([]);
        setKpisData(null);
        setPeriodoReciente('');
      }
    } catch (err) {
      setError('Error al cargar máquinas en cero');
    } finally {
      setLoading(false);
    }
  }, [empresaNormalizada]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Estadísticas desde KPIs pre-calculados en Firestore
  const stats = useMemo(() => {
    if (!kpisData) {
      return { total: 0, activas: 0, resueltas: 0, diasPromedio: 0 };
    }
    const total = kpisData.totalEnCero || 0;
    const activas = kpisData.activasEnCero || 0;
    return {
      total,
      activas,
      resueltas: total - activas,
      diasPromedio: kpisData.diasPromedio || 0,
    };
  }, [kpisData]);

  return { maquinas, stats, periodoReciente, loading, error, refetch: cargar };
}

/**
 * useEstadisticasPorSala — Ranking y tendencias por sala para una empresa
 * 
 * Consulta liquidaciones_por_sala y agrupa/resume por sala.
 */
export function useEstadisticasPorSala(empresaNormalizada) {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    if (!empresaNormalizada) return;

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'liquidaciones_por_sala'),
        where('empresa.normalizado', '==', empresaNormalizada)
      );
      const snapshot = await getDocs(q);

      // Agrupar por sala
      const salasMap = new Map();

      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const salaNombre = d.sala?.nombre || 'Sin nombre';
        const metricas = d.metricas || {};
        const periodo = d.fechas?.periodoLiquidacion || '';
        const createdAt = d.fechas?.createdAt?.toMillis?.() || 0;

        if (!salasMap.has(salaNombre)) {
          salasMap.set(salaNombre, { nombre: salaNombre, periodos: [] });
        }

        salasMap.get(salaNombre).periodos.push({
          periodo,
          createdAt,
          produccion: metricas.totalProduccion || 0,
          impuestos: metricas.totalImpuestos || 0,
          maquinas: typeof metricas.totalMaquinas === 'string'
            ? parseInt(metricas.totalMaquinas, 10)
            : (metricas.totalMaquinas || 0),
        });
      });

      // Calcular resumen por sala
      const resultado = Array.from(salasMap.values()).map((sala) => {
        // Ordenar periodos cronológicamente
        sala.periodos.sort((a, b) => a.createdAt - b.createdAt);

        const ultimo = sala.periodos[sala.periodos.length - 1];
        const penultimo = sala.periodos.length > 1 ? sala.periodos[sala.periodos.length - 2] : null;

        const variacionProd = penultimo && penultimo.produccion !== 0
          ? (((ultimo.produccion - penultimo.produccion) / Math.abs(penultimo.produccion)) * 100)
          : null;

        return {
          nombre: sala.nombre,
          produccionActual: ultimo.produccion,
          impuestosActual: ultimo.impuestos,
          maquinasActual: ultimo.maquinas,
          periodoActual: ultimo.periodo,
          variacionProduccion: variacionProd !== null ? Number(variacionProd.toFixed(1)) : null,
          totalPeriodos: sala.periodos.length,
          periodos: sala.periodos,
        };
      });

      // Ordenar por producción del último periodo (mayor primero)
      resultado.sort((a, b) => b.produccionActual - a.produccionActual);

      setSalas(resultado);
    } catch (err) {
      setError('Error al cargar estadísticas por sala');
    } finally {
      setLoading(false);
    }
  }, [empresaNormalizada]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { salas, loading, error, refetch: cargar };
}
