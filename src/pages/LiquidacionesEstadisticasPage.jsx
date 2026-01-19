import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Button,
  Chip,
  Alert,
  Skeleton,
  IconButton,
  Tooltip as MuiTooltip,
  alpha,
  useTheme,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  FileDownload,
  Assessment,
  Business,
  CalendarToday,
  Warning,
  CheckCircle,
  Info,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportarEstadisticasLiquidaciones } from '../utils/estadisticasLiquidacionesExcelExport';
import { exportarDetalleSalaExcel } from '../utils/salaDetalleExcelExport';
import { useNotifications } from '../context/NotificationsContext';
import SalaDetallePorMesModal from '../components/modals/SalaDetallePorMesModal';
import MaquinaDetallePorMesModal from '../components/modals/MaquinaDetallePorMesModal';

// ===== PÁGINA DE ESTADÍSTICAS DE LIQUIDACIONES =====
// Comparativas por rangos de meses (3, 6 y 12 meses)
// Métricas por empresa y por sala
// Alertas automáticas y exportación Excel

const LiquidacionesEstadisticasPage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // ===== ESTADOS =====
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('todas');
  const [salaSeleccionada, setSalaSeleccionada] = useState('todas');
  const [salaDetalleSeleccionada, setSalaDetalleSeleccionada] = useState('');
  const [periodoTab, setPeriodoTab] = useState(0); // 0: Trimestral, 1: Semestral, 2: Anual
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [liquidacionesPorSala, setLiquidacionesPorSala] = useState([]);
  const [salasDisponibles, setSalasDisponibles] = useState([]);
  const [periodosLiquidacionIncluidos, setPeriodosLiquidacionIncluidos] = useState([]);
  const [periodoLiquidacionUltimo, setPeriodoLiquidacionUltimo] = useState('');
  const [mostrarDetalleMaquinas, setMostrarDetalleMaquinas] = useState(false);
  const [detalleSalaMesModalOpen, setDetalleSalaMesModalOpen] = useState(false);
  const [detalleSalaMesSelection, setDetalleSalaMesSelection] = useState(null);
  const [detalleMaquinaMesModalOpen, setDetalleMaquinaMesModalOpen] = useState(false);
  const [detalleMaquinaMesSelection, setDetalleMaquinaMesSelection] = useState(null);

  const [pageSalas, setPageSalas] = useState(0);
  const [rowsPerPageSalas, setRowsPerPageSalas] = useState(10);
  const [pageMaquinas, setPageMaquinas] = useState(0);
  const [rowsPerPageMaquinas, setRowsPerPageMaquinas] = useState(10);
  const [searchMaquina, setSearchMaquina] = useState(''); // Búsqueda por NUC o Serial

  // Cache en memoria (evita re-queries al alternar pestañas/volver a selección previa)
  const liquidacionesCacheRef = useRef(new Map());

  const normalizarTexto = (value) => {
    if (value === null || value === undefined) return '';
    return value
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const normalizarEmpresaKey = (texto) => {
    if (!texto) return '';
    return String(texto).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  const normalizarSalaKey = (texto) => {
    if (!texto) return '';
    return String(texto).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  const abrirDetalleSalaPorMes = (salaNombre) => {
    if (!salaNombre) return;

    const salaKey = normalizarSalaKey(salaNombre);
    const matchDoc =
      liquidacionesPorSala.find((d) => d?.sala?.nombre === salaNombre) ||
      liquidacionesPorSala.find((d) => normalizarSalaKey(d?.sala?.nombre) === salaKey);

    const salaNormalizado = matchDoc?.sala?.normalizado || salaKey;
    setDetalleSalaMesSelection({ nombre: salaNombre, normalizado: salaNormalizado });
    setDetalleSalaMesModalOpen(true);
  };

  const abrirDetalleMaquinaPorMes = (machine, salaAsociada = null) => {
    if (!machine) return;
    
    // Si viene de búsqueda global, necesitamos establecer la sala primero
    if (salaAsociada) {
      setSalaDetalleSeleccionada(salaAsociada);
      setMostrarDetalleMaquinas(true);
    }
    
    setDetalleMaquinaMesSelection({
      serial: machine.serial || 'N/A',
      nuc: machine.nuc || 'N/A',
      tipoApuesta: machine.tipoApuesta || null
    });
    setDetalleMaquinaMesModalOpen(true);
  };

  const monthIndexFromNombre = (nombreMes) => {
    const key = normalizarTexto(nombreMes);
    const map = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      setiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11
    };
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
  };

  const periodoLiquidacionScore = (periodoLiquidacion) => {
    if (!periodoLiquidacion || typeof periodoLiquidacion !== 'string') return null;
    if (!periodoLiquidacion.includes('_')) return null;

    const parts = periodoLiquidacion.split('_').filter(Boolean);
    if (parts.length < 2) return null;

    const year = Number.parseInt(parts[parts.length - 1], 10);
    if (!Number.isFinite(year)) return null;

    const nombreMes = parts.slice(0, -1).join('_');
    const monthIndex = monthIndexFromNombre(nombreMes);
    if (monthIndex === null) return null;
    return year * 12 + monthIndex;
  };

  const formatPeriodoLiquidacionLabel = (periodoLiquidacion) => {
    if (!periodoLiquidacion || typeof periodoLiquidacion !== 'string') return 'N/A';
    if (!periodoLiquidacion.includes('_')) return periodoLiquidacion;

    const parts = periodoLiquidacion.split('_').filter(Boolean);
    if (parts.length < 2) return periodoLiquidacion;

    const year = parts[parts.length - 1];
    const monthRaw = parts.slice(0, -1).join(' ');
    const month = monthRaw
      .split(' ')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
    return `${month} ${year}`;
  };

  const extraerYearMonthPeriodo = (liq) => {
    const periodo = liq?.fechas?.periodoLiquidacion;
    if (typeof periodo === 'string' && periodo.includes('_')) {
      const parts = periodo.split('_');
      const yearStr = parts[parts.length - 1];
      const year = Number.parseInt(yearStr, 10);
      const nombreMes = parts.slice(0, -1).join('_');
      const monthIndex = monthIndexFromNombre(nombreMes);
      if (Number.isFinite(year) && monthIndex !== null) return { year, monthIndex };
    }

    const yearFromDoc = liq?.fechas?.añoLiquidacion;
    const mesFromDoc = liq?.fechas?.mesLiquidacion;
    const parsedYear = Number.parseInt(yearFromDoc, 10);
    const monthIndex2 = monthIndexFromNombre(mesFromDoc);
    if (Number.isFinite(parsedYear) && monthIndex2 !== null) return { year: parsedYear, monthIndex: monthIndex2 };

    const fecha = liq?.fechas?.createdAt?.toDate?.() || new Date(liq?.fechas?.createdAt);
    if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
      return { year: fecha.getFullYear(), monthIndex: fecha.getMonth() };
    }

    return null;
  };

  // ===== CARGAR EMPRESAS DESDE LIQUIDACIONES =====
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const hace24Meses = new Date();
        hace24Meses.setMonth(hace24Meses.getMonth() - 24);

        const q = query(
          collection(db, 'liquidaciones'),
          where('fechas.createdAt', '>=', hace24Meses)
        );

        const snapshot = await getDocs(q);
        const empresasSet = new Set();
        
        snapshot.docs.forEach(doc => {
          const empresa = doc.data().empresa;
          // Extraer nombre del objeto si es necesario
          const nombreEmpresa = typeof empresa === 'object' && empresa?.nombre 
            ? empresa.nombre 
            : empresa;
          
          if (nombreEmpresa && typeof nombreEmpresa === 'string' && nombreEmpresa.trim()) {
            empresasSet.add(nombreEmpresa);
          }
        });

        const empresasData = Array.from(empresasSet)
          .sort()
          .map((name, index) => ({
            id: `empresa_${index}`,
            name: name
          }));

        setEmpresas(empresasData);
      } catch (error) {
        console.error('Error cargando empresas:', error);
      }
    };
    cargarEmpresas();
  }, []);

  // ===== CARGAR LIQUIDACIONES (últimos 24 meses) =====
  useEffect(() => {
    const cargarLiquidaciones = async () => {
      setLoading(true);
      try {
        const monthsToShow = periodoTab === 0 ? 3 : periodoTab === 1 ? 6 : 12;

        // Cache key estable por empresa + pestaña
        const cacheKey = `${empresaSeleccionada}::${periodoTab}`;
        const cached = liquidacionesCacheRef.current.get(cacheKey);
        if (cached) {
          setLiquidaciones(cached.liquidaciones || []);
          setLiquidacionesPorSala(cached.liquidacionesPorSala || []);
          setSalasDisponibles(cached.salasDisponibles || []);
          setSalaDetalleSeleccionada(cached.salaDetalleSeleccionada || '');
          setPeriodosLiquidacionIncluidos(cached.periodosLiquidacionIncluidos || []);
          setPeriodoLiquidacionUltimo(cached.periodoLiquidacionUltimo || '');
          console.log('♻️ Cache hit (liquidaciones):', cacheKey);
          return;
        }

        // Ventana amplia de 24 meses para asegurar cobertura completa incluso con gaps
        const hace24Meses = new Date();
        hace24Meses.setMonth(hace24Meses.getMonth() - 24);

        // ===== MODO TODAS LAS EMPRESAS =====
        if (empresaSeleccionada === 'todas') {
          const q = query(
            collection(db, 'liquidaciones'),
            where('fechas.createdAt', '>=', hace24Meses),
            orderBy('fechas.createdAt', 'desc')
          );

          const snapshot = await getDocs(q);
          const allDocs = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));

          // Identificar los últimos N periodos únicos
          const periodosUnicos = [...new Set(
            allDocs
              .map(doc => doc?.fechas?.periodoLiquidacion)
              .filter(p => p)
          )].sort((a, b) => {
            const sa = periodoLiquidacionScore(a);
            const sb = periodoLiquidacionScore(b);
            if (sa === null && sb === null) return 0;
            if (sa === null) return 1;
            if (sb === null) return -1;
            return sb - sa; // Descendente (más reciente primero)
          }).slice(0, monthsToShow); // Tomar solo los últimos N periodos

          // Tomar TODOS los documentos de esos periodos (no solo 1 por periodo)
          const mensualSeleccionado = allDocs.filter(liq => {
            const periodo = liq?.fechas?.periodoLiquidacion;
            return periodo && periodosUnicos.includes(periodo);
          });

          setLiquidaciones(mensualSeleccionado);
          setLiquidacionesPorSala([]);
          setSalasDisponibles([]);
          setSalaDetalleSeleccionada('');
          setPeriodosLiquidacionIncluidos([]);
          setPeriodoLiquidacionUltimo('');

          liquidacionesCacheRef.current.set(cacheKey, {
            liquidaciones: mensualSeleccionado,
            liquidacionesPorSala: [],
            salasDisponibles: [],
            salaDetalleSeleccionada: '',
            periodosLiquidacionIncluidos: [],
            periodoLiquidacionUltimo: ''
          });
          return;
        }

        // ===== MODO EMPRESA (optimizado) =====
        const empresaNorm = normalizarEmpresaKey(empresaSeleccionada);

        // 1) Cargar meses consolidados de la empresa desde `liquidaciones` (uno por mes)
        let mensualDocs = [];
        try {
          const qMensual = query(
            collection(db, 'liquidaciones'),
            where('empresa.normalizado', '==', empresaNorm),
            where('fechas.createdAt', '>=', hace24Meses),
            orderBy('fechas.createdAt', 'desc'),
            limit(24)
          );
          const snapMensual = await getDocs(qMensual);
          mensualDocs = snapMensual.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        } catch (e) {
          console.warn('⚠️ Query por empresa.normalizado falló, usando fallback por nombre:', e);
          const qFallback = query(
            collection(db, 'liquidaciones'),
            where('fechas.createdAt', '>=', hace24Meses),
            orderBy('fechas.createdAt', 'desc'),
            limit(300)
          );
          const snapFallback = await getDocs(qFallback);
          
          mensualDocs = snapFallback.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .filter((liq) => {
              const empresaDoc = liq.empresa;
              const nombreEmpresa = typeof empresaDoc === 'object' && empresaDoc?.nombre ? empresaDoc.nombre : empresaDoc;
              return nombreEmpresa === empresaSeleccionada;
            });
        }

        // ORDENAR PRIMERO por periodo (descendente) antes de limitar
        const docsOrdenados = [...mensualDocs].sort((a, b) => {
          const pa = a?.fechas?.periodoLiquidacion;
          const pb = b?.fechas?.periodoLiquidacion;
          const sa = periodoLiquidacionScore(pa);
          const sb = periodoLiquidacionScore(pb);
          if (sa === null && sb === null) return 0;
          if (sa === null) return 1;
          if (sb === null) return -1;
          return sb - sa; // Descendente (más reciente primero)
        });

        // Seleccionar meses únicos (máximo monthsToShow)
        const vistos = new Set();
        const mensualSeleccionado = [];
        for (const liq of docsOrdenados) {
          const periodo = liq?.fechas?.periodoLiquidacion;
          if (!periodo) continue;
          if (vistos.has(periodo)) continue;
          vistos.add(periodo);
          mensualSeleccionado.push(liq);
          if (mensualSeleccionado.length >= monthsToShow) break;
        }

        setLiquidaciones(mensualSeleccionado);

        // Periodos incluidos ordenados DESC (último primero) usando score
        const periodosIncluidosRaw = mensualSeleccionado
          .map((l) => l?.fechas?.periodoLiquidacion)
          .filter((p) => typeof p === 'string' && p.trim());

        const periodosIncluidos = [...new Set(periodosIncluidosRaw)].sort((a, b) => {
          const sa = periodoLiquidacionScore(a);
          const sb = periodoLiquidacionScore(b);
          if (sa === null && sb === null) return String(b).localeCompare(String(a));
          if (sa === null) return 1;
          if (sb === null) return -1;
          return sb - sa;
        });

        const periodoUltimoComputed = periodosIncluidos[0] || '';
        setPeriodosLiquidacionIncluidos(periodosIncluidos);
        setPeriodoLiquidacionUltimo(periodoUltimoComputed);

        // 2) Top 10 salas del último mes y traer histórico de esas mismas salas
        if (!periodosIncluidos.length) {
          setLiquidacionesPorSala([]);
          setSalasDisponibles([]);
          setSalaDetalleSeleccionada('');
          console.log('ℹ️ Empresa sin periodos disponibles en ventana.');
          return;
        }

        // Consultar TODAS las salas de TODOS los periodos EN PARALELO (optimización performance)
        const historico = [];
        const todasLasSalas = new Set();

        // Ejecutar todas las queries simultáneamente en lugar de secuencialmente
        const queryPromises = periodosIncluidos.map(periodo =>
          getDocs(query(
            collection(db, 'liquidaciones_por_sala'),
            where('empresa.normalizado', '==', empresaNorm),
            where('fechas.periodoLiquidacion', '==', periodo)
          )).catch(e => {
            console.error(`❌ Error consultando periodo ${periodo}:`, e);
            return null; // Retornar null en caso de error para no romper Promise.all
          })
        );

        const snapshots = await Promise.all(queryPromises);

        // Procesar todos los snapshots
        snapshots.forEach((snapPeriodo) => {
          if (!snapPeriodo) return; // Ignorar queries que fallaron
          snapPeriodo.docs.forEach((docSnap) => {
            const doc = { id: docSnap.id, ...docSnap.data() };
            historico.push(doc);
            const salaNombre = doc?.sala?.nombre;
            if (typeof salaNombre === 'string' && salaNombre.trim()) {
              todasLasSalas.add(salaNombre);
            }
          });
        });

        setSalasDisponibles(Array.from(todasLasSalas).sort());

        if (!historico.length) {
          setLiquidacionesPorSala([]);
          setSalaDetalleSeleccionada('');
          return;
        }

        setLiquidacionesPorSala(historico);

        liquidacionesCacheRef.current.set(cacheKey, {
          liquidaciones: mensualSeleccionado,
          liquidacionesPorSala: historico,
          salasDisponibles: Array.from(todasLasSalas).sort(),
          salaDetalleSeleccionada: Array.from(todasLasSalas).sort()[0] || '',
          periodosLiquidacionIncluidos: periodosIncluidos,
          periodoLiquidacionUltimo: periodoUltimoComputed
        });
      } catch (error) {
        console.error('Error cargando liquidaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarLiquidaciones();
  }, [empresaSeleccionada, periodoTab]);

  useEffect(() => {
    if (empresaSeleccionada === 'todas') return;
    if (!salasDisponibles.length) return;
    if (salaDetalleSeleccionada && salasDisponibles.includes(salaDetalleSeleccionada)) return;
    setSalaDetalleSeleccionada(salasDisponibles[0] || '');
  }, [empresaSeleccionada, salasDisponibles, salaDetalleSeleccionada]);

  useEffect(() => {
    setPageSalas(0);
    setPageMaquinas(0);
    setRowsPerPageMaquinas(10);
    setMostrarDetalleMaquinas(false);
    setDetalleSalaMesModalOpen(false);
    setDetalleSalaMesSelection(null);
    setDetalleMaquinaMesModalOpen(false);
    setDetalleMaquinaMesSelection(null);
  }, [empresaSeleccionada, periodoTab]);

  const detalleMaquinasSala = useMemo(() => {
    if (empresaSeleccionada === 'todas') return null;
    if (!salaDetalleSeleccionada) return null;
    if (!Array.isArray(periodosLiquidacionIncluidos) || periodosLiquidacionIncluidos.length === 0) return null;
    if (!Array.isArray(liquidacionesPorSala) || liquidacionesPorSala.length === 0) return null;

    const periodos = periodosLiquidacionIncluidos.filter((p) => typeof p === 'string' && p.trim());
    if (!periodos.length) return null;

    const periodoUltimo = periodos[0];
    const periodoAnterior = periodos.length > 1 ? periodos[1] : '';

    const salaNorm = normalizarSalaKey(salaDetalleSeleccionada);

    const docsSala = liquidacionesPorSala.filter((d) => {
      const p = d?.fechas?.periodoLiquidacion;
      if (!p || !periodos.includes(p)) return false;
      const salaNormDoc = d?.sala?.normalizado;
      if (salaNormDoc) return salaNormDoc === salaNorm;
      const salaNombreDoc = d?.sala?.nombre;
      return normalizarSalaKey(salaNombreDoc) === salaNorm;
    });

    const docByPeriodo = new Map();
    docsSala.forEach((d) => {
      const p = d?.fechas?.periodoLiquidacion;
      if (!p) return;
      if (!docByPeriodo.has(p)) docByPeriodo.set(p, d);
    });

    const pickNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    const extractMachine = (m, index) => {
      const serial = m?.serial || m?.Serial || 'N/A';
      const nucRaw = m?.nuc ?? m?.NUC ?? null;
      const nuc = nucRaw != null ? String(nucRaw) : 'N/A';
      const tipoApuesta = m?.tipoApuesta || m?.tipo_apuesta || m?.tipo || 'N/A';
      return {
        serial,
        nuc,
        tipoApuesta,
        produccion: pickNumber(m?.produccion),
        impuestos: pickNumber(m?.totalImpuestos ?? m?.impuestos),
        _fallbackKey: `${serial}_${nuc}_${index}`
      };
    };

    const acc = new Map();

    for (const p of periodos) {
      const doc = docByPeriodo.get(p);
      const maquinas = Array.isArray(doc?.datosConsolidados) ? doc.datosConsolidados : [];

      maquinas.forEach((m, idx) => {
        const base = extractMachine(m, idx);
        const stableKey = base.serial !== 'N/A' ? base.serial : base.nuc !== 'N/A' ? base.nuc : base._fallbackKey;

        if (!acc.has(stableKey)) {
          acc.set(stableKey, {
            id: stableKey,
            serial: base.serial,
            nuc: base.nuc,
            tipoApuesta: base.tipoApuesta,
            produccionRango: 0,
            impuestosRango: 0,
            produccionUltimoMes: 0,
            produccionMesAnterior: 0
          });
        }

        const item = acc.get(stableKey);
        item.produccionRango += base.produccion;
        item.impuestosRango += base.impuestos;
        if (p === periodoUltimo) item.produccionUltimoMes += base.produccion;
        if (p === periodoAnterior) item.produccionMesAnterior += base.produccion;
      });
    }

    const maquinas = Array.from(acc.values()).map((m) => {
      const prev = m.produccionMesAnterior;
      const cambioPct = prev > 0 ? ((m.produccionUltimoMes - prev) / prev) * 100 : null;
      return { ...m, cambioPct };
    });

    maquinas.sort((a, b) => (b.produccionRango || 0) - (a.produccionRango || 0));

    return {
      sala: salaDetalleSeleccionada,
      periodoUltimo,
      maquinas
    };
  }, [empresaSeleccionada, liquidacionesPorSala, periodosLiquidacionIncluidos, salaDetalleSeleccionada]);

  // Búsqueda global de máquinas en todas las salas
  const maquinasGlobales = useMemo(() => {
    if (empresaSeleccionada === 'todas') return [];
    if (!searchMaquina.trim()) return [];
    if (!Array.isArray(liquidacionesPorSala) || liquidacionesPorSala.length === 0) return [];

    const searchLower = searchMaquina.toLowerCase().trim();
    const maquinasUnicas = new Map(); // Agrupar por serial+nuc+sala (sin período)

    // Recorrer todas las liquidaciones y buscar máquinas que coincidan
    liquidacionesPorSala.forEach((liq) => {
      const sala = liq?.sala?.nombre || 'N/A';
      const maquinas = Array.isArray(liq?.datosConsolidados) ? liq.datosConsolidados : [];

      maquinas.forEach((m) => {
        const serial = m?.serial || m?.Serial || 'N/A';
        const nucRaw = m?.nuc ?? m?.NUC ?? null;
        const nuc = nucRaw != null ? String(nucRaw) : 'N/A';
        const tipoApuesta = m?.tipoApuesta || m?.tipo_apuesta || m?.tipo || 'N/A';

        const serialMatch = serial.toLowerCase().includes(searchLower);
        const nucMatch = nuc.toLowerCase().includes(searchLower);

        if (serialMatch || nucMatch) {
          // Clave única por máquina+sala (agrupando todos los períodos)
          const key = `${serial}_${nuc}_${sala}`;
          
          // Solo tomar el primer registro para tener los datos básicos
          if (!maquinasUnicas.has(key)) {
            maquinasUnicas.set(key, {
              id: key,
              serial,
              nuc,
              tipoApuesta,
              sala,
              // Objeto original para pasarlo al modal
              maquinaOriginal: m
            });
          }
        }
      });
    });

    // Convertir a array y ordenar por sala
    const resultados = Array.from(maquinasUnicas.values());
    resultados.sort((a, b) => a.sala.localeCompare(b.sala));
    
    return resultados;
  }, [empresaSeleccionada, liquidacionesPorSala, searchMaquina]);

  // Filtrar máquinas por búsqueda dentro de una sala específica (detalle)
  const maquinasFiltradas = useMemo(() => {
    if (!detalleMaquinasSala?.maquinas) return [];
    if (!searchMaquina.trim()) return detalleMaquinasSala.maquinas;
    
    const searchLower = searchMaquina.toLowerCase().trim();
    return detalleMaquinasSala.maquinas.filter((m) => {
      const serialMatch = m.serial?.toLowerCase().includes(searchLower);
      const nucMatch = m.nuc?.toString().toLowerCase().includes(searchLower);
      return serialMatch || nucMatch;
    });
  }, [detalleMaquinasSala, searchMaquina]);

  // ===== PROCESAMIENTO DE DATOS =====
  const datosEstadisticos = useMemo(() => {
    if (!liquidaciones.length) return null;

    // Función para agrupar por período
    // Requisito negocio: Trimestral/Semestral/Anual = últimos 3/6/12 meses (sin Q1/Q2/etc.)
    const agruparPorPeriodo = (tipo) => {
      // 1) Agregar primero a nivel mensual (doc = empresa + mes)
      const mensual = {};
      const isModoEmpresaPorSala = empresaSeleccionada !== 'todas';
      
      // ESTRATEGIA DUAL:
      // - Producción/Impuestos/Máquinas: desde liquidaciones (consolidado empresa)
      // - Salas: desde liquidacionesPorSala (conteo individual por sala)
      
      liquidaciones.forEach((liq) => {
        const ym = extraerYearMonthPeriodo(liq);
        if (!ym) return;
        const monthKey = `${ym.year}-${String(ym.monthIndex + 1).padStart(2, '0')}`;
        
        if (!mensual[monthKey]) {
          mensual[monthKey] = {
            year: ym.year,
            monthIndex: ym.monthIndex,
            produccion: 0,
            impuestos: 0,
            derechosExplotacion: 0,
            gastosAdministracion: 0,
            maquinasTotal: 0,
            salasTotal: 0,
            empresasSet: new Set(),
            salasSet: new Set()
          };
        }

        mensual[monthKey].produccion += liq.metricas?.totalProduccion || 0;
        mensual[monthKey].impuestos += liq.metricas?.totalImpuestos || 0;
        mensual[monthKey].derechosExplotacion += liq.metricas?.derechosExplotacion || 0;
        mensual[monthKey].gastosAdministracion += liq.metricas?.gastosAdministracion || 0;

        // Máquinas: siempre desde liquidaciones (empresa consolidada)
        mensual[monthKey].maquinasTotal +=
          (liq.metricas?.totalMaquinas ?? liq.metricas?.maquinasConsolidadas ?? 0);

        // Salas: solo si NO es modo empresa por sala
        if (!isModoEmpresaPorSala) {
          mensual[monthKey].salasTotal += liq.metricas?.totalEstablecimientos || 0;
        }

        const empresaDoc = liq.empresa;
        const nombreEmpresa = typeof empresaDoc === 'object' && empresaDoc?.nombre
          ? empresaDoc.nombre
          : empresaDoc;
        if (typeof nombreEmpresa === 'string' && nombreEmpresa.trim()) {
          mensual[monthKey].empresasSet.add(nombreEmpresa);
        }

        mensual[monthKey].documentos += 1;
      });

      // Si es modo empresa específica, contar salas desde liquidacionesPorSala
      if (isModoEmpresaPorSala && liquidacionesPorSala.length > 0) {
        liquidacionesPorSala.forEach((liq) => {
          const ym = extraerYearMonthPeriodo(liq);
          if (!ym) return;
          const monthKey = `${ym.year}-${String(ym.monthIndex + 1).padStart(2, '0')}`;
          if (!mensual[monthKey]) return; // Solo procesar meses que ya existen
          
          const salaNombre = liq?.sala?.nombre;
          if (typeof salaNombre === 'string' && salaNombre.trim()) {
            mensual[monthKey].salasSet.add(salaNombre);
          }
        });
      }

      // 2) Seleccionar últimos N meses disponibles (según pestaña)
      const monthsToShow = tipo === 'trimestral' ? 3 : tipo === 'semestral' ? 6 : 12;

      const monthKeys = Object.keys(mensual);
      if (monthKeys.length === 0) return {};

      // Encontrar el mes más reciente con data (no depende de la fecha actual)
      const parseMonthKey = (mk) => {
        const [yy, mm] = String(mk).split('-');
        const year = Number(yy);
        const month = Number(mm); // 1-12
        if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
        return { year, monthIndex: month - 1, score: year * 12 + (month - 1) };
      };

      const parsed = monthKeys
        .map((k) => ({ key: k, p: parseMonthKey(k) }))
        .filter((x) => x.p);

      if (parsed.length === 0) return {};

      parsed.sort((a, b) => a.p.score - b.p.score);
      const latest = parsed[parsed.length - 1].p;

      // Incluir los últimos N meses que TENGAN DATOS (no necesariamente consecutivos)
      // Ordenar todos los meses disponibles y tomar los últimos N
      const sortedMonths = parsed.sort((a, b) => b.p.score - a.p.score); // Descendente
      
      const monthsToInclude = sortedMonths
        .slice(0, monthsToShow)
        .map(x => x.key)
        .reverse(); // Revertir para tener orden ascendente

      // 3) Devolver por mes (cada key = YYYY-MM)
      const agrupado = {};
      monthsToInclude.forEach((key) => {
        const m = mensual[key];
        if (!m) return;

        const empresasConsolidadas = m.empresasSet ? m.empresasSet.size : 0;
        const salasConsolidadas = isModoEmpresaPorSala ? (m.salasSet ? m.salasSet.size : 0) : m.salasTotal;

        agrupado[key] = {
          produccion: m.produccion,
          impuestos: m.impuestos,
          derechosExplotacion: m.derechosExplotacion,
          gastosAdministracion: m.gastosAdministracion,
          meses: 1,
          maquinasSumaMensual: m.maquinasTotal,
          salasSumaMensual: salasConsolidadas,
          documentos: empresasConsolidadas,
          maquinasPromedioMensual: m.maquinasTotal,
          salasPromedioMensual: salasConsolidadas,
          produccionPromedioMensual: m.produccion
        };
      });

      return agrupado;
    };

    const tipoActual = periodoTab === 0 ? 'trimestral' : periodoTab === 1 ? 'semestral' : 'anual';
    return agruparPorPeriodo(tipoActual);
  }, [liquidaciones, liquidacionesPorSala, periodoTab, empresaSeleccionada]);

  const comparativoPorSala = useMemo(() => {
    if (empresaSeleccionada === 'todas') return [];
    if (!datosEstadisticos) return [];

    const periodos = Object.keys(datosEstadisticos).sort();
    if (!periodos.length) return [];

    const ultimoPeriodo = periodos[periodos.length - 1];
    const penultimoPeriodo = periodos.length > 1 ? periodos[periodos.length - 2] : null;
    const periodosSet = new Set(periodos);

    const porSalaPorMes = new Map();

    liquidacionesPorSala.forEach((liq) => {
      const salaNombre = liq?.sala?.nombre;
      if (typeof salaNombre !== 'string' || !salaNombre.trim()) return;
      const ym = extraerYearMonthPeriodo(liq);
      if (!ym) return;
      const monthKey = `${ym.year}-${String(ym.monthIndex + 1).padStart(2, '0')}`;
      if (!periodosSet.has(monthKey)) return;

      if (!porSalaPorMes.has(salaNombre)) porSalaPorMes.set(salaNombre, {});
      const salaData = porSalaPorMes.get(salaNombre);
      salaData[monthKey] = {
        produccion: Number(liq.metricas?.totalProduccion) || 0,
        impuestos: Number(liq.metricas?.totalImpuestos) || 0,
        maquinas: Number(liq.metricas?.totalMaquinas ?? liq.metricas?.maquinasConsolidadas) || 0
      };
    });

    const filas = [];
    porSalaPorMes.forEach((meses, salaNombre) => {
      const produccionRango = periodos.reduce((sum, p) => sum + (meses[p]?.produccion || 0), 0);
      const impuestosRango = periodos.reduce((sum, p) => sum + (meses[p]?.impuestos || 0), 0);
      const maquinasPromedioMensual = periodos.length
        ? periodos.reduce((sum, p) => sum + (meses[p]?.maquinas || 0), 0) / periodos.length
        : 0;

      const prodUltimo = meses[ultimoPeriodo]?.produccion || 0;
      const prodPrevio = penultimoPeriodo ? (meses[penultimoPeriodo]?.produccion || 0) : null;
      const cambioPct = prodPrevio && prodPrevio > 0 ? ((prodUltimo - prodPrevio) / prodPrevio) * 100 : null;

      filas.push({
        sala: salaNombre,
        produccionRango,
        impuestosRango,
        maquinasPromedioMensual,
        ultimoPeriodo,
        produccionUltimoMes: prodUltimo,
        produccionMesAnterior: prodPrevio,
        cambioPct
      });
    });

    filas.sort((a, b) => b.produccionRango - a.produccionRango);
    return filas;
  }, [empresaSeleccionada, datosEstadisticos, liquidacionesPorSala]);



  // ===== CÁLCULO DE KPIs =====
  const kpis = useMemo(() => {
    if (!datosEstadisticos) return null;

    const valores = Object.values(datosEstadisticos);
    const produccionTotal = valores.reduce((sum, p) => sum + p.produccion, 0);
    const mesesTotal = valores.reduce((sum, p) => sum + (p.meses || 0), 0);
    const produccionPromedio = valores.length > 0 ? produccionTotal / valores.length : 0;

    // Calcular tendencia
    // - Si hay >= 6 períodos: compara suma últimos 3 vs suma primeros 3
    // - Si hay < 6 períodos (p.ej. trimestral): compara primer período vs último período
    const periodosOrdenados = Object.keys(datosEstadisticos).sort();
    const numPeriodos = periodosOrdenados.length;

    let tendencia = 'estable';
    let porcentajeCambio = 0;

    const aplicarClasificacionTendencia = (pct) => {
      if (pct > 5) return 'creciente';
      if (pct < -5) return 'decreciente';
      return 'estable';
    };

    if (numPeriodos >= 2) {
      let base = 0;
      let actual = 0;

      if (numPeriodos >= 6) {
        base = periodosOrdenados.slice(0, 3).reduce((sum, key) => sum + (Number(datosEstadisticos[key]?.produccion) || 0), 0);
        actual = periodosOrdenados.slice(-3).reduce((sum, key) => sum + (Number(datosEstadisticos[key]?.produccion) || 0), 0);
      } else {
        const primerKey = periodosOrdenados[0];
        const ultimoKey = periodosOrdenados[numPeriodos - 1];
        base = Number(datosEstadisticos[primerKey]?.produccion) || 0;
        actual = Number(datosEstadisticos[ultimoKey]?.produccion) || 0;
      }

      if (base > 0) {
        porcentajeCambio = ((actual - base) / base) * 100;
        tendencia = aplicarClasificacionTendencia(porcentajeCambio);
      } else {
        // Evita divisiones por 0: si no hay base, no podemos inferir % real.
        porcentajeCambio = 0;
        tendencia = 'estable';
      }
    }

    const salasPromedioMensualGlobal = mesesTotal > 0
      ? valores.reduce((sum, p) => sum + (p.salasPromedioMensual || 0) * (p.meses || 0), 0) / mesesTotal
      : 0;
    const maquinasPromedioMensualGlobal = mesesTotal > 0
      ? valores.reduce((sum, p) => sum + (p.maquinasPromedioMensual || 0) * (p.meses || 0), 0) / mesesTotal
      : 0;

    // Producción por sala: usando salas promedio mensual (evita sumar “stocks” mes a mes)
    const produccionPorSala = salasPromedioMensualGlobal > 0 ? produccionTotal / salasPromedioMensualGlobal : 0;
    const produccionPorMaquina = maquinasPromedioMensualGlobal > 0 ? produccionTotal / maquinasPromedioMensualGlobal : 0;

    return {
      produccionTotal,
      mesesTotal,
      produccionPromedio,
      tendencia,
      porcentajeCambio,
      produccionPorSala,
      produccionPorMaquina,
      salasPromedioMensualGlobal,
      maquinasPromedioMensualGlobal,
      numPeriodos: valores.length
    };
  }, [datosEstadisticos]);

  // ===== FORMATEO DE NÚMEROS =====
  const formatearNumeroGrande = (valor) => {
    if (valor >= 1000000000) return `$${(valor / 1000000000).toFixed(1)}MM`;
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)}M`;
    if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}K`;
    return `$${valor}`;
  };

  const formatearPeriodo = (periodo) => {
    // Esperado: YYYY-MM
    const parts = String(periodo).split('-');
    if (parts.length === 2) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const meses = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
      ];
      if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
        return `${meses[month - 1]} ${year}`;
      }
    }

    // Fallback
    return String(periodo);
  };

  // ===== DATOS PARA GRÁFICOS =====
  const datosGraficos = useMemo(() => {
    if (!datosEstadisticos) return [];

    return Object.keys(datosEstadisticos)
      .sort((a, b) => b.localeCompare(a)) // Orden descendente: más reciente primero
      .map(key => {
        const data = datosEstadisticos[key];
        
        return {
          periodo: key,
          periodoLabel: formatearPeriodo(key),
          produccion: Math.round(data.produccion),
          empresasConsolidadas: data.documentos || 0,
          salasPromedioMensual: Math.round(data.salasPromedioMensual || 0),
          maquinasPromedioMensual: Math.round(data.maquinasPromedioMensual || 0),
          impuestos: Math.round(data.impuestos)
        };
      });
  }, [datosEstadisticos]);

  // ===== ALERTAS =====
  const alertas = useMemo(() => {
    if (!datosEstadisticos || Object.keys(datosEstadisticos).length < 2) return [];

    const alerts = [];
    const periodosOrdenados = Object.keys(datosEstadisticos).sort();
    const ultimoPeriodo = periodosOrdenados[periodosOrdenados.length - 1];
    const penultimoPeriodo = periodosOrdenados[periodosOrdenados.length - 2];

    if (ultimoPeriodo && penultimoPeriodo) {
      const prodActual = datosEstadisticos[ultimoPeriodo].produccion;
      const prodAnterior = datosEstadisticos[penultimoPeriodo].produccion;
      const cambio = prodAnterior > 0 ? ((prodActual - prodAnterior) / prodAnterior) * 100 : null;

      if (cambio === null) {
        if (prodActual > 0) {
          alerts.push({
            tipo: 'info',
            mensaje: 'Mes anterior sin producción: % no comparable',
            icono: <Info />
          });
        }
        return alerts;
      }

      if (cambio < -30) {
        alerts.push({
          tipo: 'error',
          mensaje: `Caída crítica de ${Math.abs(cambio).toFixed(1)}% vs período anterior`,
          icono: <ErrorIcon />
        });
      } else if (cambio < -15) {
        alerts.push({
          tipo: 'warning',
          mensaje: `Disminución de ${Math.abs(cambio).toFixed(1)}% vs período anterior`,
          icono: <Warning />
        });
      } else if (cambio > 20) {
        alerts.push({
          tipo: 'success',
          mensaje: `Crecimiento de ${cambio.toFixed(1)}% vs período anterior`,
          icono: <CheckCircle />
        });
      }
    }

    // Alerta si no hay meses consolidados
    if ((datosEstadisticos[ultimoPeriodo]?.meses || 0) === 0) {
      alerts.push({
        tipo: 'error',
        mensaje: 'No hay meses consolidados en el último período',
        icono: <ErrorIcon />
      });
    }

    return alerts;
  }, [datosEstadisticos]);

  // ===== EXPORTAR A EXCEL =====
  const handleExportarExcel = async () => {
    try {
      const filtros = {
        empresa: empresaSeleccionada,
        sala: 'N/A (consolidado)',
        tipoPeriodo: periodoTab === 0 ? 'Trimestral' : periodoTab === 1 ? 'Semestral' : 'Anual'
      };

      const result = await exportarEstadisticasLiquidaciones(
        datosEstadisticos,
        kpis,
        datosGraficos,
        alertas,
        filtros
      );

      if (result.success) {
        addNotification(result.message, 'success');
      } else {
        addNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Error exportando:', error);
      addNotification('Error al exportar estadísticas', 'error');
    }
  };

  const handleExportarDetalleSalaExcel = async (salaNombre) => {
    try {
      if (!salaNombre) return;
      const tipoPeriodo = periodoTab === 0 ? 'Trimestral' : periodoTab === 1 ? 'Semestral' : 'Anual';

      const periodosIncluidos = Array.isArray(periodosLiquidacionIncluidos) ? periodosLiquidacionIncluidos : [];

      const result = await exportarDetalleSalaExcel({
        empresa: empresaSeleccionada,
        sala: salaNombre,
        tipoPeriodo,
        periodosIncluidos,
        liquidacionesPorSala
      });

      if (result.success) {
        addNotification(result.message, 'success');
      } else {
        addNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Error exportando detalle por sala:', error);
      addNotification('Error al exportar detalle por sala', 'error');
    }
  };

  // ===== RENDERIZADO =====
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER GRADIENT SOBRIO SIMPLIFICADO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            mb: 3
          }}
        >
          <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography variant="overline" sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              FINANZAS • ANÁLISIS
            </Typography>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              Estadísticas de Liquidaciones
            </Typography>
            <Typography variant="body1" sx={{
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Análisis comparativo por últimos 3, 6 o 12 meses
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* FILTROS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    value={empresaSeleccionada}
                    onChange={(e) => {
                      setEmpresaSeleccionada(e.target.value);
                      setSalaSeleccionada('todas');
                      setSalaDetalleSeleccionada('');
                    }}
                    label="Empresa"
                  >
                    <MenuItem value="todas">Todas las empresas</MenuItem>
                    {empresas.map(emp => (
                      <MenuItem key={emp.id} value={emp.name}>
                        {emp.name || 'Sin nombre'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* NOTA: Filtro por sala oculto - los datos están consolidados por empresa/mes */}
              <Grid item xs={12} sm={8}>
                <Button
                  variant="contained"
                  startIcon={<FileDownload />}
                  fullWidth
                  sx={{ height: 56, borderRadius: 1 }}
                  disabled={!datosEstadisticos}
                  onClick={handleExportarExcel}
                >
                  Exportar Excel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* TABS DE PERÍODO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Tabs
            value={periodoTab}
            onChange={(e, newValue) => setPeriodoTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem'
              }
            }}
          >
            <Tab label="Trimestral" icon={<CalendarToday />} iconPosition="start" />
            <Tab label="Semestral" icon={<CalendarToday />} iconPosition="start" />
            <Tab label="Anual" icon={<CalendarToday />} iconPosition="start" />
          </Tabs>
        </Card>
      </motion.div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Box sx={{ mb: 3 }}>
            {alertas.map((alerta, index) => (
              <Alert
                key={index}
                severity={alerta.tipo}
                icon={alerta.icono}
                sx={{ mb: 1, borderRadius: 1 }}
              >
                {alerta.mensaje}
              </Alert>
            ))}
          </Box>
        </motion.div>
      )}

      {/* KPIs */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Producción Total */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Producción Total
                  </Typography>
                  <Typography variant="h4" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    ${kpis.produccionTotal.toLocaleString()}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${kpis.numPeriodos} períodos`}
                    sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Promedio por Período */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Promedio por Período
                  </Typography>
                  <Typography variant="h4" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    ${Math.round(kpis.produccionPromedio).toLocaleString()}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${kpis.mesesTotal} meses total`}
                    sx={{ backgroundColor: alpha(theme.palette.secondary.main, 0.1) }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Tendencia */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Tendencia
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                    {kpis.tendencia === 'creciente' && <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 1 }} />}
                    {kpis.tendencia === 'decreciente' && <TrendingDown sx={{ fontSize: 40, color: 'error.main', mr: 1 }} />}
                    {kpis.tendencia === 'estable' && <TrendingFlat sx={{ fontSize: 40, color: 'warning.main', mr: 1 }} />}
                    <Typography variant="h4" fontWeight={600}>
                      {Math.abs(kpis.porcentajeCambio).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={kpis.tendencia === 'creciente' ? 'Crecimiento' : kpis.tendencia === 'decreciente' ? 'Disminución' : 'Estable'}
                    color={kpis.tendencia === 'creciente' ? 'success' : kpis.tendencia === 'decreciente' ? 'error' : 'default'}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Producción por Máquina */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                    Prod. Promedio por Sala
                  </Typography>
                  <Typography variant="h4" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
                    ${Math.round(kpis.produccionPorSala).toLocaleString()}
                  </Typography>
                  <Chip
                    size="small"
                    label="Estimado"
                    sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* GRÁFICO DE BARRAS */}
      {datosGraficos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Producción por Período
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={datosGraficos}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="periodoLabel" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tickFormatter={(value) => formatearNumeroGrande(value)}
                  style={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Producción') return [`$${value.toLocaleString()}`, name];
                    return [value.toLocaleString(), name];
                  }}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar 
                  dataKey="produccion" 
                  fill={theme.palette.primary.main} 
                  name="Producción"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* GRÁFICO DE LÍNEAS */}
      {datosGraficos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Tendencias Operativas
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={datosGraficos}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="periodoLabel" 
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                  label={{ value: 'Empresas', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                  label={{ value: 'Máquinas (prom. mensual)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [value.toLocaleString(), name]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="empresasConsolidadas" 
                  stroke={theme.palette.secondary.main} 
                  strokeWidth={2.5} 
                  name="Empresas Consolidadas"
                  dot={{ fill: theme.palette.secondary.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="maquinasPromedioMensual" 
                  stroke={theme.palette.warning.main} 
                  strokeWidth={2.5} 
                  name="Máquinas (prom. mensual)"
                  dot={{ fill: theme.palette.warning.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* TABLA DETALLADA */}
      {datosGraficos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Detalle Comparativo por Período
              </Typography>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Período</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Producción Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Impuestos</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Empresas</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Salas (prom. mensual)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Máquinas (prom. mensual)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Prod/Empresa (prom.)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosGraficos.map((row, index) => (
                      <TableRow
                        key={row.periodo}
                        sx={{
                          backgroundColor: index % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{row.periodoLabel}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.primary.main }}>
                          ${row.produccion.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          ${row.impuestos.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{row.empresasConsolidadas}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{row.salasPromedioMensual}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>{row.maquinasPromedioMensual.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500 }}>
                          ${row.empresasConsolidadas > 0 ? Math.round(row.produccion / row.empresasConsolidadas).toLocaleString() : 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* COMPARATIVO POR SALA (solo cuando se filtra una empresa) */}
      {empresaSeleccionada !== 'todas' && comparativoPorSala.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.05 }}
        >
          <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Comparativo por Sala (Empresa: {empresaSeleccionada})
              </Typography>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.secondary.main, 0.08) }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Sala</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Producción (rango)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Producción (último mes)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>% vs mes anterior</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Impuestos (rango)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Máquinas (prom. mensual)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparativoPorSala
                      .slice(pageSalas * rowsPerPageSalas, pageSalas * rowsPerPageSalas + rowsPerPageSalas)
                      .map((row, index) => (
                      <TableRow
                        key={row.sala}
                        sx={{
                          backgroundColor: index % 2 === 0 ? alpha(theme.palette.secondary.main, 0.02) : 'transparent',
                          '&:hover': { backgroundColor: alpha(theme.palette.secondary.main, 0.05) }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{row.sala}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.primary.main }}>
                          ${Math.round(row.produccionRango).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          ${Math.round(row.produccionUltimoMes).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          {row.cambioPct === null
                            ? 'N/A'
                            : `${row.cambioPct > 0 ? '+' : ''}${row.cambioPct.toFixed(1)}%`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          ${Math.round(row.impuestosRango).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          {Math.round(row.maquinasPromedioMensual).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, flexWrap: 'nowrap' }}>
                            <MuiTooltip title="Exportar Excel">
                              <IconButton
                                size="small"
                                onClick={() => handleExportarDetalleSalaExcel(row.sala)}
                                sx={{
                                  color: theme.palette.secondary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.08)
                                  }
                                }}
                              >
                                <FileDownload fontSize="small" />
                              </IconButton>
                            </MuiTooltip>
                            <MuiTooltip title="Ver detalle por mes">
                              <IconButton
                                size="small"
                                onClick={() => abrirDetalleSalaPorMes(row.sala)}
                                sx={{
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                                  }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </MuiTooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={comparativoPorSala.length}
                page={pageSalas}
                onPageChange={(e, newPage) => setPageSalas(newPage)}
                rowsPerPage={rowsPerPageSalas}
                onRowsPerPageChange={(e) => {
                  setRowsPerPageSalas(Number(e.target.value));
                  setPageSalas(0);
                }}
                rowsPerPageOptions={[10]}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* BÚSQUEDA GLOBAL DE MÁQUINAS */}
      {empresaSeleccionada !== 'todas' && salasDisponibles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Búsqueda de Máquinas
              </Typography>
              
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar máquina por NUC o Serial en todas las salas..."
                value={searchMaquina}
                onChange={(e) => {
                  setSearchMaquina(e.target.value);
                  setPageMaquinas(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchMaquina && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchMaquina('');
                          setPageMaquinas(0);
                        }}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.08),
                            color: theme.palette.error.main
                          }
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04)
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }
                }}
              />

              {/* Resultados de búsqueda global */}
              {searchMaquina.trim() && (
                <Box sx={{ mt: 3 }}>
                  {maquinasGlobales.length === 0 ? (
                    <Alert severity="info" icon={<Info />} sx={{ borderRadius: 1 }}>
                      No se encontraron máquinas que coincidan con "{searchMaquina}".
                    </Alert>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {maquinasGlobales.length} {maquinasGlobales.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Serial</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>NUC</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Tipo</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Sala</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {maquinasGlobales
                              .slice(pageMaquinas * rowsPerPageMaquinas, pageMaquinas * rowsPerPageMaquinas + rowsPerPageMaquinas)
                              .map((m, idx) => (
                                <TableRow
                                  key={m.id}
                                  sx={{
                                    backgroundColor: idx % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.06)
                                    }
                                  }}
                                >
                                  <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{m.serial}</TableCell>
                                  <TableCell sx={{ fontSize: 12 }}>{m.nuc}</TableCell>
                                  <TableCell sx={{ fontSize: 12 }}>{m.tipoApuesta}</TableCell>
                                  <TableCell sx={{ fontSize: 12, color: theme.palette.primary.main, fontWeight: 500 }}>
                                    {m.sala}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: 12 }}>
                                    <MuiTooltip title="Ver detalle por mes">
                                      <IconButton
                                        size="small"
                                        onClick={() => abrirDetalleMaquinaPorMes(m.maquinaOriginal, m.sala)}
                                        sx={{
                                          color: theme.palette.primary.main,
                                          '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08)
                                          }
                                        }}
                                      >
                                        <VisibilityIcon fontSize="small" />
                                      </IconButton>
                                    </MuiTooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <TablePagination
                        component="div"
                        count={maquinasGlobales.length}
                        page={pageMaquinas}
                        onPageChange={(e, newPage) => setPageMaquinas(newPage)}
                        rowsPerPage={rowsPerPageMaquinas}
                        onRowsPerPageChange={(e) => {
                          setRowsPerPageMaquinas(Number(e.target.value));
                          setPageMaquinas(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50]}
                      />
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* DETALLE POR MÁQUINA (opcional) */}
      {empresaSeleccionada !== 'todas' && salasDisponibles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.1 }}
        >
          <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ flex: '1 1 auto' }}>
                  Detalle por Máquina (por Sala)
                </Typography>
                <Button
                  variant={mostrarDetalleMaquinas ? 'outlined' : 'contained'}
                  size="small"
                  onClick={() => {
                    setMostrarDetalleMaquinas((prev) => {
                      const next = !prev;
                      if (!next) setPageMaquinas(0);
                      return next;
                    });
                  }}
                >
                  {mostrarDetalleMaquinas ? 'Ocultar detalle' : 'Ver detalle'}
                </Button>

                <FormControl sx={{ minWidth: 260 }} size="small">
                  <InputLabel>Sala</InputLabel>
                  <Select
                    value={salaDetalleSeleccionada || ''}
                    label="Sala"
                    onChange={(e) => setSalaDetalleSeleccionada(e.target.value)}
                  >
                    {salasDisponibles.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {mostrarDetalleMaquinas && detalleMaquinasSala && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Período último: {formatPeriodoLiquidacionLabel(detalleMaquinasSala.periodoUltimo) || 'N/A'} · Sala: {detalleMaquinasSala.sala}
                  </Typography>

                  {detalleMaquinasSala.maquinas.length === 0 ? (
                    <Alert severity="info" icon={<Info />} sx={{ borderRadius: 1 }}>
                      No hay máquinas disponibles para esta sala en el rango actual.
                    </Alert>
                  ) : maquinasFiltradas.length === 0 ? (
                    <Alert severity="warning" icon={<Info />} sx={{ borderRadius: 1 }}>
                      No se encontraron máquinas que coincidan con "{searchMaquina}".
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: alpha(theme.palette.info.main, 0.08) }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Serial</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>NUC</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Tipo</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Producción (rango)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Producción (último mes)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>% vs mes anterior</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Impuestos (rango)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {maquinasFiltradas
                            .slice(pageMaquinas * rowsPerPageMaquinas, pageMaquinas * rowsPerPageMaquinas + rowsPerPageMaquinas)
                            .map((m, idx) => (
                              <TableRow
                                key={m.id}
                                sx={{
                                  backgroundColor: idx % 2 === 0 ? alpha(theme.palette.info.main, 0.02) : 'transparent'
                                }}
                              >
                                <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{m.serial}</TableCell>
                                <TableCell sx={{ fontSize: 12 }}>{m.nuc}</TableCell>
                                <TableCell sx={{ fontSize: 12 }}>{m.tipoApuesta || 'N/A'}</TableCell>
                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.primary.main }}>
                                  ${Math.round(m.produccionRango).toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: 12 }}>
                                  ${Math.round(m.produccionUltimoMes).toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: 12 }}>
                                  {m.cambioPct === null
                                    ? 'N/A'
                                    : `${m.cambioPct > 0 ? '+' : ''}${m.cambioPct.toFixed(1)}%`}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: 12 }}>
                                  ${Math.round(m.impuestosRango).toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: 12 }}>
                                  <MuiTooltip title="Ver detalle por mes">
                                    <IconButton
                                      size="small"
                                      onClick={() => abrirDetalleMaquinaPorMes(m)}
                                      sx={{
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                                        }
                                      }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </MuiTooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <TablePagination
                    component="div"
                    count={maquinasFiltradas.length}
                    page={pageMaquinas}
                    onPageChange={(e, newPage) => setPageMaquinas(newPage)}
                    rowsPerPage={rowsPerPageMaquinas}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPageMaquinas(Number(e.target.value));
                      setPageMaquinas(0);
                    }}
                    rowsPerPageOptions={[10]}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* EMPTY STATE */}
      {!datosEstadisticos && !loading && (
        <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay datos disponibles para el período seleccionado
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Intenta seleccionar otra empresa o período
          </Typography>
        </Card>
      )}

      {/* MODAL: DETALLE POR MES DE LA SALA */}
      <SalaDetallePorMesModal
        open={detalleSalaMesModalOpen}
        onClose={() => setDetalleSalaMesModalOpen(false)}
        empresaNombre={empresaSeleccionada}
        salaNombre={detalleSalaMesSelection?.nombre || ''}
        salaNormalizado={detalleSalaMesSelection?.normalizado || ''}
        periodosLiquidacion={periodosLiquidacionIncluidos}
        liquidacionesPorSala={liquidacionesPorSala}
      />

      {/* MODAL: DETALLE POR MES DE LA MÁQUINA */}
      <MaquinaDetallePorMesModal
        open={detalleMaquinaMesModalOpen}
        onClose={() => setDetalleMaquinaMesModalOpen(false)}
        empresaNombre={empresaSeleccionada}
        salaNombre={salaDetalleSeleccionada || ''}
        salaNormalizado={normalizarSalaKey(salaDetalleSeleccionada || '')}
        machineSelection={detalleMaquinaMesSelection}
        periodosLiquidacion={periodosLiquidacionIncluidos}
        liquidacionesPorSala={liquidacionesPorSala}
      />
    </Box>
  );
};

export default LiquidacionesEstadisticasPage;
