import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccountCircle,
  Analytics,
  Assessment,
  AttachMoney,
  BarChart as BarChartIcon,
  Business,
  Casino,
  CheckCircle,
  Close,
  CloudUpload,
  DeleteSweep,
  History,
  Notifications,
  ReceiptLong,
  Save,
  Settings,
  TrendingDown,
  TrendingUp,
  Warning
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import useActivityLogs from '../hooks/useActivityLogs';
import useLiquidacionExport from '../hooks/useLiquidacionExport';
import useCompanies from '../hooks/useCompanies';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import ExportarPorSalaModal from '../components/modals/ExportarPorSalaModal';
import ReporteDiarioModal from '../components/modals/ReporteDiarioModal';
import ConfirmarGuardadoModal from '../components/modals/ConfirmarGuardadoModal';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import { FixedSizeList as VirtualList } from 'react-window';
import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis
} from 'recharts';

const LOG_COLORS_BY_TYPE = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

function formatCurrencyCompact(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$ 0';
  // Compact formatting (e.g., 402.3 M)
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$ ${(abs / 1_000_000_000).toFixed(1)} B`;
  if (abs >= 1_000_000) return `${sign}$ ${(abs / 1_000_000).toFixed(1)} M`;
  if (abs >= 1_000) return `${sign}$ ${(abs / 1_000).toFixed(1)} K`;
  return `${sign}$ ${Math.round(abs).toLocaleString('es-CO')}`;
}

function formatCurrencyCOP(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function useMeasure() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(element);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}

function VirtualTable({
  rows,
  columns,
  height = 520,
  rowHeight = 44,
  headerHeight = 44,
  emptyLabel = 'Sin datos para mostrar.'
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const [wrapRef, size] = useMeasure();

  const totalMinWidth = columns.reduce((sum, col) => sum + (col.width || 140), 0);
  const width = Math.max(size.width || 0, Math.min(totalMinWidth, size.width || totalMinWidth));

  return (
    <Box
      ref={wrapRef}
      sx={{
        width: '100%',
        borderRadius: 2,
        border: (t) => `1px solid ${alpha(t.palette.divider, 0.2)}`,
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
          borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.2)}`
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: columns.map((c) => `${c.width || 140}px`).join(' '),
            width: totalMinWidth,
            px: 1.5,
            columnGap: 0,
            alignItems: 'center'
          }}
        >
          {columns.map((col) => (
            <Typography
              key={col.key}
              variant="caption"
              sx={{
                fontWeight: 800,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                pr: 1,
                textAlign: col.align || 'left',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}
              title={col.label}
            >
              {col.label}
            </Typography>
          ))}
        </Box>
      </Box>

      {safeRows.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {emptyLabel}
          </Typography>
        </Box>
      ) : size.width > 0 ? (
        <Box sx={{ overflowX: 'auto' }}>
          <VirtualList
            height={height}
            width={Math.max(width, 0)}
            itemCount={safeRows.length}
            itemSize={rowHeight}
          >
            {({ index, style }) => {
              const row = safeRows[index];
              return (
                <Box
                  style={style}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.12)}`,
                    bgcolor: index % 2 === 0 ? 'transparent' : (t) => alpha(t.palette.action.hover, 0.25)
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: columns.map((c) => `${c.width || 140}px`).join(' '),
                      width: totalMinWidth,
                      px: 1.5,
                      alignItems: 'center'
                    }}
                  >
                    {columns.map((col) => {
                      const rawValue = typeof col.value === 'function' ? col.value(row) : row?.[col.key];
                      const displayValue = col.format ? col.format(rawValue, row) : rawValue;
                      const cellText = displayValue === null || displayValue === undefined || displayValue === '' ? '—' : String(displayValue);
                      return (
                        <Typography
                          key={col.key}
                          variant="body2"
                          sx={{
                            pr: 1,
                            textAlign: col.align || 'left',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}
                          title={cellText}
                        >
                          {cellText}
                        </Typography>
                      );
                    })}
                  </Box>
                </Box>
              );
            }}
          </VirtualList>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Preparando tabla…
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function LiquidacionesPageV2() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivityLogs();
  const { companies, loading: companiesLoading } = useCompanies();

  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Datos reales se migrarán en fases (procesamiento/carga). Por ahora se mantienen como placeholders.
  const [empresa, setEmpresa] = useState('GENERAL');
  const [empresaCompleta, setEmpresaCompleta] = useState(null); // Estado para empresa completa con logo/NIT/contrato
  const [selectedFile, setSelectedFile] = useState(null);
  const [archivoTarifas, setArchivoTarifas] = useState(null);
  const [tarifasOficiales, setTarifasOficiales] = useState({});
  const [metricsData, setMetricsData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [reporteBySala, setReporteBySala] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // Validación (V1-style): procesar → revisar en modal → confirmar para aplicar
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationData, setValidationData] = useState(null);
  const [pendingLiquidacion, setPendingLiquidacion] = useState(null);
  const [showTarifasOptions, setShowTarifasOptions] = useState(false);
  const [liquidacionCoincide, setLiquidacionCoincide] = useState(true);
  const [procesandoTarifasValidacion, setProcesandoTarifasValidacion] = useState(false);

  const fileInputRef = useRef(null);
  const tarifasInputRef = useRef(null);
  const validationTarifasInputRef = useRef(null);

  const [showSalaModal, setShowSalaModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);

  // Persistencia Firebase (Guardar + Historial)
  const [showConfirmarGuardadoModal, setShowConfirmarGuardadoModal] = useState(false);
  const [guardandoLiquidacion, setGuardandoLiquidacion] = useState(false);
  const [liquidacionGuardadaId, setLiquidacionGuardadaId] = useState(null);

  const addLog = useCallback((message, type = 'info') => {
    const safeType = LOG_COLORS_BY_TYPE[type] ? type : 'info';
    const entry = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      message: String(message ?? ''),
      type: safeType,
      timestamp: new Date()
    };
    setLogs((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('🧹 Logs limpiados', 'info');
  }, [addLog]);

  const derivedMetrics = useMemo(() => {
    const consolidated = Array.isArray(consolidatedData) ? consolidatedData : [];
    const totalMaquinas = consolidated.length;
    const totalProduccion = consolidated.reduce((sum, item) => sum + (Number(item?.produccion) || 0), 0);
    const totalDerechos = consolidated.reduce((sum, item) => sum + (Number(item?.derechosExplotacion) || 0), 0);
    const totalGastos = consolidated.reduce((sum, item) => sum + (Number(item?.gastosAdministracion) || 0), 0);
    const totalImpuestos = consolidated.reduce((sum, item) => sum + (Number(item?.totalImpuestos) || 0), 0);

    const reporteSala = Array.isArray(reporteBySala) ? reporteBySala : [];
    const totalEstablecimientos = reporteSala.length;
    const promedioPorEstablecimiento = totalEstablecimientos > 0 ? totalProduccion / totalEstablecimientos : 0;

    const sinCambios = consolidated.filter((i) => String(i?.novedad || '').toLowerCase().includes('sin')).length;
    const conNovedades = totalMaquinas - sinCambios;
    const pct = (v) => (totalMaquinas > 0 ? Math.round((v / totalMaquinas) * 100) : 0);

    return {
      maquinas: { value: totalMaquinas, trend: 0, isPositive: true },
      produccion: { value: totalProduccion, trend: 0, isPositive: true },
      impuestos: { value: totalImpuestos, trend: 0, isPositive: true },
      promedio: { value: promedioPorEstablecimiento, trend: 0, isPositive: true },
      establecimientos: { value: totalEstablecimientos },
      derechos: { value: totalDerechos },
      gastos: { value: totalGastos },
      sinCambios: { value: sinCambios, percentage: pct(sinCambios) },
      novedades: { value: conNovedades, percentage: pct(conNovedades) }
    };
  }, [consolidatedData, reporteBySala]);

  const parseFechaToDate = useCallback((value) => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      // Excel serial date (1900 system)
      const d = new Date((value - 25569) * 86400 * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const chartProduccionPorEstablecimiento = useMemo(() => {
    const reporte = Array.isArray(reporteBySala) ? reporteBySala : [];
    if (reporte.length === 0) return [];

    const sorted = [...reporte]
      .map((r) => ({
        establecimiento: String(r?.establecimiento || 'Sin nombre'),
        produccion: Number(r?.produccion) || 0
      }))
      .sort((a, b) => b.produccion - a.produccion);

    const maxBars = 12;
    const head = sorted.slice(0, maxBars);
    const tail = sorted.slice(maxBars);

    const otros = tail.reduce((sum, item) => sum + item.produccion, 0);
    if (otros > 0) head.push({ establecimiento: 'Otros', produccion: otros });
    return head;
  }, [reporteBySala]);

  const chartNovedades = useMemo(() => {
    const consolidated = Array.isArray(consolidatedData) ? consolidatedData : [];
    if (consolidated.length === 0) return [];

    const map = new Map();
    for (const row of consolidated) {
      const raw = String(row?.novedad || 'Sin cambios').trim();
      const key = raw || 'Sin cambios';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedData]);

  const chartTendenciaDiaria = useMemo(() => {
    const rows = Array.isArray(originalData) ? originalData : [];
    if (rows.length === 0) return [];

    const byDay = new Map();
    for (const row of rows) {
      const d = parseFechaToDate(row?.fecha);
      if (!d) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const base = Number(row?.baseLiquidacion) || 0;
      byDay.set(key, (byDay.get(key) || 0) + base);
    }
    const entries = Array.from(byDay.entries())
      .map(([day, produccion]) => ({ day, produccion }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));

    // Solo últimos 31 días para legibilidad
    return entries.slice(-31);
  }, [originalData, parseFechaToDate]);

  // Filtrar datos de tarifa fija
  const tarifaFijaData = useMemo(() => {
    const consolidated = Array.isArray(consolidatedData) ? consolidatedData : [];
    if (consolidated.length === 0) return [];
    if (!tarifasOficiales || Object.keys(tarifasOficiales).length === 0) return [];

    return consolidated.filter(row => {
      const nucStr = String(row?.nuc || '').trim();
      return nucStr && tarifasOficiales[nucStr];
    });
  }, [consolidatedData, tarifasOficiales]);

  // Resumen de tarifas fijas
  const tarifaFijaResumen = useMemo(() => {
    if (!tarifasOficiales || Object.keys(tarifasOficiales).length === 0) {
      return { count: 0, totalDerechos: 0, totalGastos: 0, totalImpuestos: 0 };
    }

    const count = tarifaFijaData.length;
    const totalDerechos = Object.values(tarifasOficiales).reduce((sum, tarifa) => 
      sum + (Number(tarifa?.derechosAdicionales) || 0), 0
    );
    const totalGastos = Object.values(tarifasOficiales).reduce((sum, tarifa) => 
      sum + (Number(tarifa?.gastosAdicionales) || 0), 0
    );
    const totalImpuestos = totalDerechos + totalGastos;

    return { count, totalDerechos, totalGastos, totalImpuestos };
  }, [tarifaFijaData, tarifasOficiales]);

  const mockMetrics = useMemo(
    () => ({
      maquinas: { value: 205, trend: 3.5, isPositive: true },
      produccion: { value: 402_300_000, trend: 12, isPositive: true },
      impuestos: { value: 48_700_000, trend: -1.2, isPositive: false },
      promedio: { value: 44_700_000, trend: 0.8, isPositive: true },
      establecimientos: { value: 9 },
      derechos: { value: 48_300_000 },
      gastos: { value: 482_700 },
      sinCambios: { value: 205, percentage: 100 },
      novedades: { value: 0, percentage: 0 }
    }),
    []
  );

  const metrics = useMemo(() => {
    if (Array.isArray(consolidatedData) && consolidatedData.length > 0) return derivedMetrics;
    return mockMetrics;
  }, [consolidatedData, derivedMetrics, mockMetrics]);

  const progressPct = activeStep === 1 ? 0 : activeStep === 2 ? 50 : 100;

  const { exportarConsolidado } = useLiquidacionExport({
    consolidatedData,
    reporteBySala,
    originalData,
    empresa,
    addLog,
    addNotification,
    logActivity,
    currentUser,
    userProfile
  });

  const canExportConsolidado = Boolean(currentUser?.uid) && Array.isArray(consolidatedData) && consolidatedData.length > 0;
  const canExportSala = Boolean(currentUser?.uid) && Array.isArray(reporteBySala) && reporteBySala.length > 0;
  const canExportDiario = Boolean(currentUser?.uid) && Array.isArray(consolidatedData) && consolidatedData.length > 0 && Array.isArray(originalData) && originalData.length > 0;

  const canGuardar =
    Boolean(currentUser?.uid) &&
    Boolean(selectedFile) &&
    Array.isArray(consolidatedData) &&
    consolidatedData.length > 0 &&
    Array.isArray(originalData) &&
    originalData.length > 0;

  const getUserDisplayName = useCallback(() => {
    return userProfile?.name || currentUser?.displayName || currentUser?.email || 'Usuario desconocido';
  }, [currentUser?.displayName, currentUser?.email, userProfile?.name]);

  const detectarPeriodoLiquidacion = useCallback(() => {
    const periodos = (Array.isArray(consolidatedData) ? consolidatedData : [])
      .map((row) => String(row?.periodoTexto || '').trim())
      .filter(Boolean);

    if (periodos.length === 0) return 'No detectado';

    const counts = new Map();
    for (const p of periodos) counts.set(p, (counts.get(p) || 0) + 1);
    let best = periodos[0];
    let bestCount = 0;
    counts.forEach((count, key) => {
      if (count > bestCount) {
        bestCount = count;
        best = key;
      }
    });
    return best || 'No detectado';
  }, [consolidatedData]);

  const validateExcelData = useCallback(
    (data) => {
      const errors = [];
      const warnings = [];

      if (!Array.isArray(data)) {
        errors.push('Los datos no son un array válido');
        return { valid: false, errors, warnings };
      }
      if (data.length < 2) {
        errors.push(`Archivo sin datos suficientes (${data.length} fila${data.length === 1 ? '' : 's'})`);
        return { valid: false, errors, warnings };
      }
      if (!data[0] || !Array.isArray(data[0])) {
        errors.push('Primera fila inválida o ausente');
        return { valid: false, errors, warnings };
      }

      const filasConDatos = data.filter(
        (row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && cell !== '')
      );
      if (filasConDatos.length < 2) {
        errors.push('El archivo no contiene filas con datos válidos');
        return { valid: false, errors, warnings };
      }

      const columnasEsperadas = data[0].length;
      const filasInconsistentes = data.filter(
        (row) =>
          Array.isArray(row) &&
          row.length !== columnasEsperadas &&
          row.some((cell) => cell !== null && cell !== undefined && cell !== '')
      );
      if (filasInconsistentes.length > data.length * 0.1) {
        warnings.push(`${filasInconsistentes.length} filas tienen diferente número de columnas`);
      }

      const columnasVacias = [];
      for (let col = 0; col < columnasEsperadas; col++) {
        const tieneValor = data.some(
          (row) => Array.isArray(row) && row[col] !== null && row[col] !== undefined && row[col] !== ''
        );
        if (!tieneValor) columnasVacias.push(col);
      }
      if (columnasVacias.length > 0) {
        warnings.push(
          `${columnasVacias.length} columna${columnasVacias.length === 1 ? '' : 's'} completamente vacía${
            columnasVacias.length === 1 ? '' : 's'
          }`
        );
      }

      return {
        valid: true,
        errors: [],
        warnings,
        stats: {
          totalRows: data.length,
          dataRows: filasConDatos.length - 1,
          columns: columnasEsperadas,
          emptyColumns: columnasVacias.length
        }
      };
    },
    []
  );

  const readFile = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }, []);

  const detectarFilaEncabezados = useCallback(
    (data) => {
      const HEADER_SCAN_ROWS = 15;
      const columnasClave = ['serial', 'nuc', 'nuid', 'establecimiento', 'sala', 'base', 'liquidacion', 'produccion'];

      addLog('🔍 Analizando las primeras filas para encontrar encabezados...', 'info');

      for (let fila = 0; fila < Math.min(HEADER_SCAN_ROWS, data.length); fila++) {
        const row = data[fila];
        if (!row) continue;
        const rowText = row.map((cell) => String(cell || '').toLowerCase().trim());
        const coincidencias = columnasClave.filter((clave) => rowText.some((cell) => cell.includes(clave)));
        if (coincidencias.length >= 3) {
          addLog(
            `✅ Encabezados detectados en fila ${fila + 1} con ${coincidencias.length} coincidencias: ${coincidencias.join(', ')}`,
            'success'
          );
          return fila;
        }
      }

      addLog('🔍 Búsqueda estricta fallida, probando búsqueda flexible...', 'info');
      const palabrasEncabezado = [
        'serial',
        'nuc',
        'establecimiento',
        'contrato',
        'codigo',
        'tipo',
        'fecha',
        'base',
        'liquidacion',
        'produccion',
        'ingresos',
        'casino',
        'sala'
      ];
      for (let fila = 0; fila < Math.min(HEADER_SCAN_ROWS, data.length); fila++) {
        const row = data[fila];
        if (!row) continue;
        const rowText = row.map((cell) => String(cell || '').toLowerCase().trim());
        const coincidencias = palabrasEncabezado.filter((palabra) => rowText.some((cell) => cell.includes(palabra)));
        if (coincidencias.length >= 4) {
          addLog(
            `✅ Encabezados detectados (flexible) en fila ${fila + 1} con ${coincidencias.length} coincidencias: ${coincidencias.join(', ')}`,
            'success'
          );
          return fila;
        }
      }

      if (data[0]) {
        const primeraFila = data[0].map((cell) => String(cell || '').toLowerCase().trim());
        const coincidenciasPrimera = palabrasEncabezado.filter((palabra) => primeraFila.some((cell) => cell.includes(palabra)));
        if (coincidenciasPrimera.length >= 4) {
          addLog('✅ Primera fila contiene palabras clave, usando como encabezados', 'success');
          return 0;
        }
      }

      addLog('⚠️ No se detectaron encabezados automáticamente, usando fila 2 como fallback', 'warning');
      return 1;
    },
    [addLog]
  );

  const procesarDatos = useCallback(
    (data, headerRow) => {
      const headers = data[headerRow];
      const rows = data.slice(headerRow + 1);

      const columnMap = {};
      headers.forEach((header, index) => {
        const headerLower = String(header || '').toLowerCase().trim();

        if (headerLower.includes('nuc')) columnMap.nuc = index;
        else if (headerLower.includes('serial')) columnMap.serial = index;
        else if (headerLower.includes('establecimiento')) columnMap.establecimiento = index;
        else if (headerLower.includes('tipo') && headerLower.includes('apuesta')) columnMap.tipoApuesta = index;
        else if (headerLower.includes('fecha') && headerLower.includes('reporte')) columnMap.fecha = index;
        else if (headerLower.includes('contrato')) columnMap.contrato = index;
        else if (headerLower.includes('cod') && headerLower.includes('local')) columnMap.codLocal = index;
        else if (headerLower.includes('código') && headerLower.includes('marca')) columnMap.codigoMarca = index;
        else if (
          (headerLower.includes('base') && (headerLower.includes('liquidación') || headerLower.includes('liquidacion'))) ||
          headerLower === 'base liquidación diaria' ||
          headerLower === 'base liquidacion diaria' ||
          headerLower.includes('produccion') ||
          headerLower.includes('ingresos') ||
          headerLower.includes('valor') ||
          headerLower.includes('monto')
        ) {
          columnMap.baseLiquidacion = index;
        } else if (headerLower.includes('sala') || headerLower.includes('casino')) {
          columnMap.establecimiento = index;
        } else if (headerLower.includes('categoria') || headerLower.includes('tipo')) {
          columnMap.tipoApuesta = index;
        }
      });

      const columnasEsenciales = ['nuc', 'baseLiquidacion'];
      const columnasFaltantes = columnasEsenciales.filter((col) => columnMap[col] === undefined);
      if (columnasFaltantes.length > 0) {
        addLog(`⚠️ Columnas faltantes: ${columnasFaltantes.join(', ')}`, 'warning');
      }

      return rows
        .map((row) => {
          const obj = {};
          Object.keys(columnMap).forEach((key) => {
            obj[key] = row[columnMap[key]] || '';
          });
          return obj;
        })
        .filter((row) => row.nuc && row.nuc !== '');
    },
    [addLog]
  );

  const formatearFechaSinTimezone = useCallback((fecha) => {
    try {
      if (!fecha || isNaN(fecha.getTime())) return '';
      const dia = String(fecha.getUTCDate()).padStart(2, '0');
      const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
      const año = fecha.getUTCFullYear();
      return `${dia}/${mes}/${año}`;
    } catch {
      return '';
    }
  }, []);

  const calcularDiasMes = useCallback((fecha) => {
    try {
      if (!fecha) return 31;
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return 31;
      const year = fechaObj.getFullYear();
      const month = fechaObj.getMonth();
      return new Date(year, month + 1, 0).getDate();
    } catch {
      return 31;
    }
  }, []);

  const determinarNovedad = useCallback((diasTransmitidos, diasMes) => {
    try {
      const dias = parseInt(diasTransmitidos);
      const totalDias = parseInt(diasMes);
      if (dias === totalDias) return 'Sin cambios';
      if (dias < totalDias) return 'Retiro / Adición';
      return 'Retiro / Adición';
    } catch {
      return 'Sin cambios';
    }
  }, []);

  const convertirFechaAPeriodo = useCallback((fecha) => {
    try {
      if (!fecha) return '';
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return '';
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
      return `${meses[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`;
    } catch {
      return '';
    }
  }, []);

  const consolidarDatos = useCallback(
    (data, empresaValue) => {
      const grouped = {};
      data.forEach((row) => {
        const key = `${row.nuc}_${row.establecimiento}`;
        if (!grouped[key]) {
          grouped[key] = {
            nuc: row.nuc,
            serial: row.serial,
            establecimiento: row.establecimiento,
            tipoApuesta: row.tipoApuesta,
            empresa: empresaValue,
            produccion: 0,
            diasTransmitidos: 0,
            fechas: []
          };
        }

        let baseLiq = 0;
        if (row.baseLiquidacion !== undefined && row.baseLiquidacion !== '') {
          baseLiq = parseFloat(row.baseLiquidacion) || 0;
        }
        grouped[key].produccion += baseLiq;
        grouped[key].diasTransmitidos += 1;

        if (row.fecha && row.fecha !== '') {
          let fechaObj;
          if (typeof row.fecha === 'number') fechaObj = new Date((row.fecha - 25569) * 86400 * 1000);
          else fechaObj = new Date(row.fecha);
          if (!isNaN(fechaObj.getTime())) grouped[key].fechas.push(fechaObj);
        }
      });

      return Object.values(grouped).map((item) => {
        const derechosExplotacion = item.produccion * 0.12;
        const gastosAdministracion = derechosExplotacion * 0.01;
        const totalImpuestos = derechosExplotacion + gastosAdministracion;

        let fechaInicio = null;
        let fechaFin = null;
        if (item.fechas.length > 0) {
          const fechasValidas = item.fechas.filter((f) => !isNaN(f.getTime()));
          if (fechasValidas.length > 0) {
            fechaInicio = new Date(Math.min(...fechasValidas.map((f) => f.getTime())));
            fechaFin = new Date(Math.max(...fechasValidas.map((f) => f.getTime())));
          }
        }

        const diasMes = fechaFin ? calcularDiasMes(fechaFin) : 31;
        const periodoTexto = fechaFin ? convertirFechaAPeriodo(fechaFin) : '';
        const novedad = determinarNovedad(item.diasTransmitidos, diasMes);

        return {
          empresa: item.empresa,
          serial: item.serial,
          nuc: item.nuc,
          establecimiento: item.establecimiento,
          diasTransmitidos: item.diasTransmitidos,
          diasMes,
          primerDia: formatearFechaSinTimezone(fechaInicio),
          ultimoDia: formatearFechaSinTimezone(fechaFin),
          periodoTexto,
          tipoApuesta: item.tipoApuesta,
          produccion: item.produccion,
          derechosExplotacion,
          gastosAdministracion,
          totalImpuestos,
          novedad
        };
      });
    },
    [calcularDiasMes, convertirFechaAPeriodo, determinarNovedad, formatearFechaSinTimezone]
  );

  const generarReporteSala = useCallback((consolidated) => {
    const grouped = {};
    consolidated.forEach((item) => {
      if (!grouped[item.establecimiento]) {
        grouped[item.establecimiento] = {
          establecimiento: item.establecimiento,
          empresa: item.empresa,
          totalMaquinas: 0,
          produccion: 0,
          derechosExplotacion: 0,
          gastosAdministracion: 0,
          totalImpuestos: 0
        };
      }
      const grupo = grouped[item.establecimiento];
      grupo.totalMaquinas += 1;
      grupo.produccion += item.produccion;
      grupo.derechosExplotacion += item.derechosExplotacion;
      grupo.gastosAdministracion += item.gastosAdministracion;
      grupo.totalImpuestos += item.totalImpuestos;
    });
    return Object.values(grouped)
      .map((item) => ({
        ...item,
        promedioEstablecimiento: item.totalMaquinas > 0 ? item.produccion / item.totalMaquinas : 0
      }))
      .sort((a, b) => b.produccion - a.produccion);
  }, []);

  const buscarEmpresaPorContrato = useCallback(
    (numeroContrato) => {
      if (!numeroContrato) return null;
      const numeroContratoNormalizado = numeroContrato.toString().trim().toUpperCase();
      const empresaEncontrada = (companies || []).find((company) => {
        if (!company.contractNumber) return false;
        const contratoEmpresa = company.contractNumber.toString().trim().toUpperCase();
        return contratoEmpresa === numeroContratoNormalizado;
      });
      return empresaEncontrada || null; // Retornar objeto completo o null
    },
    [companies]
  );

  const resetLiquidacion = useCallback(() => {
    setSelectedFile(null);
    setArchivoTarifas(null);
    setTarifasOficiales({});
    setMetricsData(null);
    setEmpresa('GENERAL');
    setEmpresaCompleta(null);
    setConsolidatedData(null);
    setReporteBySala(null);
    setOriginalData(null);
    setLiquidacionGuardadaId(null);
    setActiveStep(1);
    setLogs([]);
    addLog('🔄 Estado reiniciado. Listo para cargar un nuevo archivo.', 'info');
  }, [addLog]);

  const cancelarValidacion = useCallback(() => {
    setShowValidationModal(false);
    setValidationData(null);
    setPendingLiquidacion(null);
    setShowTarifasOptions(false);
    setLiquidacionCoincide(true);
    setProcesandoTarifasValidacion(false);
    resetLiquidacion();

    try {
      if (currentUser?.uid) {
        logActivity(
          'liquidacion_validacion_cancelada',
          'liquidacion',
          empresa || 'GENERAL',
          {
            empresa: empresa || 'GENERAL'
          },
          currentUser.uid,
          getUserDisplayName(),
          currentUser.email
        );
      }
    } catch {
      // best-effort
    }
  }, [currentUser?.email, currentUser?.uid, empresa, getUserDisplayName, logActivity, resetLiquidacion]);

  const confirmarValidacion = useCallback(async () => {
    const payload = validationData;
    if (!payload || !Array.isArray(payload.consolidated) || payload.consolidated.length === 0) return;

    setConsolidatedData(payload.consolidated);
    setReporteBySala(payload.reporteSala);
    setMetricsData(payload.metrics);
    setActiveStep(3);

    addLog(`📊 ${payload.totalMaquinas} máquinas consolidadas`, 'success');
    addLog(`🏢 ${payload.totalEstablecimientos} establecimientos procesados`, 'success');
    addLog('✅ Validación confirmada. Datos listos para exportar/guardar.', 'success');
    addNotification('Liquidación validada correctamente', 'success');

    setShowValidationModal(false);
    setShowTarifasOptions(false);
    setLiquidacionCoincide(true);
    setProcesandoTarifasValidacion(false);
    setPendingLiquidacion(null);
    setValidationData(null);
    setActiveTab(0);

    try {
      if (currentUser?.uid) {
        await logActivity(
          'liquidacion_validacion_confirmada',
          'liquidacion',
          payload.empresaFinal || empresa || 'GENERAL',
          {
            empresa: payload.empresaFinal || empresa || 'GENERAL',
            numeroContrato: payload.numeroContrato || 'No detectado',
            totalMaquinas: payload.totalMaquinas || 0,
            totalEstablecimientos: payload.totalEstablecimientos || 0,
            totalProduccion: payload.totalProduccion || 0,
            totalImpuestos: payload.totalImpuestos || 0,
            tieneTarifas: Boolean(archivoTarifas) || Boolean(pendingLiquidacion?.archivoTarifas)
          },
          currentUser.uid,
          getUserDisplayName(),
          currentUser.email
        );
      }
    } catch (e) {
      console.warn('Error logging validacion confirmada:', e);
    }
  }, [
    addLog,
    addNotification,
    archivoTarifas,
    currentUser?.email,
    currentUser?.uid,
    empresa,
    getUserDisplayName,
    logActivity,
    pendingLiquidacion?.archivoTarifas,
    validationData
  ]);

  const handleLiquidacionCoincide = useCallback(() => {
    setLiquidacionCoincide(true);
    setShowTarifasOptions(false);
    confirmarValidacion();
  }, [confirmarValidacion]);

  const handleLiquidacionNoCoincide = useCallback(() => {
    setLiquidacionCoincide(false);
    setShowTarifasOptions(true);
    addLog('⚠️ Liquidación marcada como no coincidente - Se requiere ajuste de tarifas', 'warning');
  }, [addLog]);

  const seleccionarArchivoTarifasValidacion = useCallback(() => {
    validationTarifasInputRef.current?.click();
  }, []);

  const continuarSinTarifas = useCallback(() => {
    addLog('➡️ Continuando sin ajustes de tarifas', 'info');
    confirmarValidacion();
  }, [addLog, confirmarValidacion]);

  const calcularMetricasBasicas = useCallback((consolidated, reporteSala) => {
    const consolidatedArr = Array.isArray(consolidated) ? consolidated : [];
    const reporteArr = Array.isArray(reporteSala) ? reporteSala : [];

    const totalProduccion = consolidatedArr.reduce((sum, item) => sum + (Number(item?.produccion) || 0), 0);
    const totalDerechos = consolidatedArr.reduce((sum, item) => sum + (Number(item?.derechosExplotacion) || 0), 0);
    const totalGastos = consolidatedArr.reduce((sum, item) => sum + (Number(item?.gastosAdministracion) || 0), 0);

    return {
      totalMaquinas: consolidatedArr.length,
      totalEstablecimientos: reporteArr.length,
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalImpuestos: totalDerechos + totalGastos
    };
  }, []);

  const buildValidationPayload = useCallback(
    (consolidated, reporteSala, metrics, empresaFinal, numeroContrato) => {
      const m = metrics || calcularMetricasBasicas(consolidated, reporteSala);
      return {
        consolidated,
        reporteSala,
        metrics: m,
        totalMaquinas: Number(m?.totalMaquinas) || (Array.isArray(consolidated) ? consolidated.length : 0),
        totalEstablecimientos: Number(m?.totalEstablecimientos) || (Array.isArray(reporteSala) ? reporteSala.length : 0),
        totalProduccion: Number(m?.totalProduccion) || 0,
        totalDerechos: Number(m?.totalDerechos) || 0,
        totalGastos: Number(m?.totalGastos) || 0,
        totalImpuestos: Number(m?.totalImpuestos) || 0,
        empresaFinal: empresaFinal || 'GENERAL',
        numeroContrato: numeroContrato || null
      };
    },
    [calcularMetricasBasicas]
  );

  const aplicarTarifasDesdeArchivo = useCallback(
    async (tarifasFile, consolidatedBase, empresaFinal) => {
      if (!tarifasFile) return { consolidated: consolidatedBase, reporteSala: generarReporteSala(consolidatedBase), metrics: calcularMetricasBasicas(consolidatedBase, generarReporteSala(consolidatedBase)), tarifasOficiales: {} };

      addLog('📄 Procesando archivo de tarifas...', 'info');

      let tarifasOficialesCalculadas = {};
      let consolidatedConTarifas = Array.isArray(consolidatedBase) ? consolidatedBase : [];

      try {
        const tarifasData = await tarifasFile.arrayBuffer();
        const workbook = XLSX.read(tarifasData, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Detectar encabezados
        let headerRow = -1;
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i];
          if (
            Array.isArray(row) &&
            row.some(
              (cell) =>
                cell &&
                typeof cell === 'string' &&
                (cell.toLowerCase().includes('nuc') || cell.toLowerCase().includes('tarifa'))
            )
          ) {
            headerRow = i;
            break;
          }
        }

        if (headerRow === -1) {
          addLog('❌ No se encontraron encabezados válidos en el archivo de tarifas', 'error');
          return {
            consolidated: consolidatedConTarifas,
            reporteSala: generarReporteSala(consolidatedConTarifas),
            metrics: calcularMetricasBasicas(consolidatedConTarifas, generarReporteSala(consolidatedConTarifas)),
            tarifasOficiales: {}
          };
        }

        const headers = jsonData[headerRow];
        const dataRows = jsonData.slice(headerRow + 1);

        const nucIndex = headers.findIndex((h) => h && h.toString().toLowerCase().includes('nuc'));
        const tarifaIndex = headers.findIndex((h) => h && h.toString().toLowerCase().includes('tarifa'));
        const derechosIndex = headers.findIndex((h) => h && h.toString().toLowerCase().includes('derechos'));
        const gastosIndex = headers.findIndex((h) => h && h.toString().toLowerCase().includes('gastos'));

        if (nucIndex === -1 || tarifaIndex === -1) {
          addLog('❌ No se encontraron columnas NUC o Tarifa en el archivo de tarifas', 'error');
          return {
            consolidated: consolidatedConTarifas,
            reporteSala: generarReporteSala(consolidatedConTarifas),
            metrics: calcularMetricasBasicas(consolidatedConTarifas, generarReporteSala(consolidatedConTarifas)),
            tarifasOficiales: {}
          };
        }

        let tarifasEncontradas = 0;
        dataRows.forEach((row) => {
          if (!row) return;
          const nucRaw = row[nucIndex];
          const tipoRaw = row[tarifaIndex];
          if (!nucRaw || !tipoRaw) return;
          if (String(tipoRaw).trim() !== 'Tarifa fija') return;

          const nuc = String(nucRaw).trim();
          const derechos = parseFloat(row[derechosIndex]) || 0;
          const gastos = parseFloat(row[gastosIndex]) || 0;

          if (derechos > 0 || gastos > 0) {
            tarifasOficialesCalculadas[nuc] = {
              derechosAdicionales: derechos,
              gastosAdicionales: gastos
            };
            tarifasEncontradas++;
          }
        });

        if (tarifasEncontradas > 0) {
          consolidatedConTarifas = consolidatedConTarifas.map((maquina) => {
            const nucString = String(maquina?.nuc ?? '').trim();
            const infoTarifa = tarifasOficialesCalculadas[nucString];
            if (!infoTarifa) {
              return { ...maquina, tarifa: maquina?.tarifa || 'Cálculo original (sin ajuste)', tipoTarifa: maquina?.tipoTarifa || 'Tarifa variable' };
            }

            const nuevosDerechos = (Number(maquina?.derechosExplotacion) || 0) + (Number(infoTarifa.derechosAdicionales) || 0);
            const nuevosGastos = (Number(maquina?.gastosAdministracion) || 0) + (Number(infoTarifa.gastosAdicionales) || 0);

            return {
              ...maquina,
              derechosExplotacion: nuevosDerechos,
              gastosAdministracion: nuevosGastos,
              totalImpuestos: nuevosDerechos + nuevosGastos,
              tarifa: 'Tarifa fija (valores sumados)',
              tipoTarifa: 'Tarifa fija'
            };
          });
          addLog(`✅ ${tarifasEncontradas} tarifas aplicadas correctamente`, 'success');
          addNotification(`Tarifas aplicadas: ${tarifasEncontradas} NUC`, 'success');
        } else {
          addLog('⚠️ No se encontraron tarifas válidas en el archivo', 'warning');
          addNotification('No se encontraron tarifas válidas', 'warning');
        }
      } catch (tarifasError) {
        addLog(`❌ Error procesando archivo de tarifas: ${tarifasError.message}`, 'error');
        addNotification('Error procesando archivo de tarifas', 'error');
      }

      // Recalcular reporte por sala y métricas con tarifas aplicadas
      const consolidatedFinal = consolidatedConTarifas.map((item) => ({ ...item, empresa: empresaFinal }));
      const reporteSalaFinal = generarReporteSala(consolidatedFinal);
      const metricsFinal = calcularMetricasBasicas(consolidatedFinal, reporteSalaFinal);

      return {
        consolidated: consolidatedFinal,
        reporteSala: reporteSalaFinal,
        metrics: metricsFinal,
        tarifasOficiales: tarifasOficialesCalculadas
      };
    },
    [addLog, addNotification, calcularMetricasBasicas, generarReporteSala]
  );

  const procesarArchivo = useCallback(
    async (file, tarifasFile = null, { allowReplace = false, source = 'archivo' } = {}) => {
      if (!file) return null;

      if (!allowReplace) {
        if (companiesLoading) {
          addNotification('Por favor espera a que se carguen las empresas antes de subir archivos...', 'warning');
          return null;
        }
        if (!companies || companies.length === 0) {
          addNotification('No se encontraron empresas. Verifica tu conexión.', 'error');
          return null;
        }
        if (processing) return null;
        if (selectedFile || (Array.isArray(consolidatedData) && consolidatedData.length > 0)) {
          addNotification('Ya hay una liquidación cargada. Usa Reiniciar para cargar otra.', 'warning');
          return null;
        }
      }

      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      if (file?.type && !validTypes.includes(file.type)) {
        addNotification('Solo se permiten archivos Excel (.xlsx, .xls) o CSV', 'error');
        return null;
      }

      // Si viene del historial y ya hay algo cargado, reiniciar primero
      if (allowReplace && (selectedFile || (Array.isArray(consolidatedData) && consolidatedData.length > 0))) {
        resetLiquidacion();
      }

      setProcessing(true);
      setSelectedFile(file);
      addLog(`📁 ${source === 'historial' ? 'Archivo cargado desde historial' : 'Archivo seleccionado'}: ${file.name}`, 'success');
      setActiveStep(2);

      try {
        const data = await readFile(file);
        const validation = validateExcelData(data);
        if (!validation.valid) {
          addLog(`❌ Archivo inválido: ${validation.errors.join(', ')}`, 'error');
          addNotification(`Error: ${validation.errors[0] || 'Archivo inválido'}`, 'error');
          throw new Error(validation.errors[0] || 'Archivo inválido');
        }
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((w) => addLog(`⚠️ ${w}`, 'warning'));
        }
        addLog(`📊 Archivo validado: ${validation.stats.dataRows} filas de datos`, 'info');

        addLog('🏢 Detectando empresa del archivo...', 'info');
        let numeroContrato = null;
        const HEADER_SCAN_ROWS = 15;
        const valoresIgnorados = ['contrato', 'contract', 'numero', 'number', 'código', 'codigo'];
        for (let i = 1; i < Math.min(HEADER_SCAN_ROWS, data.length); i++) {
          const fila = data[i];
          if (fila && fila[0]) {
            const posibleContrato = fila[0].toString().trim();
            const posibleContratoLower = posibleContrato.toLowerCase();
            const esHeader = valoresIgnorados.some(
              (palabra) => posibleContratoLower === palabra || posibleContratoLower.startsWith(palabra + ' ')
            );
            if (esHeader) continue;
            if (posibleContrato) {
              numeroContrato = posibleContrato;
              break;
            }
          }
        }

        let empresaObj = null;
        if (numeroContrato && Array.isArray(companies) && companies.length > 0) {
          empresaObj = buscarEmpresaPorContrato(numeroContrato);
          if (empresaObj) {
            setEmpresa(empresaObj.name);
            setEmpresaCompleta(empresaObj);
            addLog(`✅ Empresa detectada: ${empresaObj.name}`, 'success');
            addLog(`🏭 Logo disponible: ${empresaObj.logoURL ? 'SÍ' : 'NO'}`, empresaObj.logoURL ? 'success' : 'warning');
          } else {
            const fallback = `Contrato ${numeroContrato} (No encontrado)`;
            setEmpresa(fallback);
            setEmpresaCompleta(null);
            addLog(`⚠️ No se encontró empresa para el contrato: ${numeroContrato}`, 'warning');
          }
        } else if (numeroContrato) {
          const fallback = `Contrato ${numeroContrato} (No encontrado)`;
          setEmpresa(fallback);
          setEmpresaCompleta(null);
          addLog(`ℹ️ Empresas no disponibles para validar contrato (${numeroContrato})`, 'info');
        } else {
          setEmpresa('Empresa no detectada');
          setEmpresaCompleta(null);
          addLog('⚠️ No se pudo detectar número de contrato', 'warning');
        }

        const headerRow = detectarFilaEncabezados(data);
        const processedRows = procesarDatos(data, headerRow);
        setOriginalData(processedRows);

        const empresaFinal =
          empresaObj?.name || (numeroContrato ? `Contrato ${numeroContrato} (No encontrado)` : 'Empresa no detectada');
        const consolidatedBase = consolidarDatos(processedRows, empresaFinal);

        // Aplicar tarifas (si llegan) y recalcular
        let consolidated = consolidatedBase;
        let reporteSala = generarReporteSala(consolidated);
        let metrics = calcularMetricasBasicas(consolidated, reporteSala);
        let tarifas = {};

        if (tarifasFile) {
          setArchivoTarifas(tarifasFile);
          const tarifasResult = await aplicarTarifasDesdeArchivo(tarifasFile, consolidatedBase, empresaFinal);
          consolidated = tarifasResult.consolidated;
          reporteSala = tarifasResult.reporteSala;
          metrics = tarifasResult.metrics;
          tarifas = tarifasResult.tarifasOficiales;
          setTarifasOficiales(tarifas);
        } else {
          setArchivoTarifas(null);
          setTarifasOficiales({});
        }

        // Historial: aplicar directamente (sin modal) para navegación rápida.
        if (source === 'historial') {
          setConsolidatedData(consolidated);
          setReporteBySala(reporteSala);
          setMetricsData(metrics);
          setActiveStep(3);

          addLog(`📊 ${consolidated.length} máquinas consolidadas`, 'success');
          addLog(`🏢 ${reporteSala.length} establecimientos procesados`, 'success');
          addNotification('Liquidación procesada correctamente', 'success');
        } else {
          // Archivo nuevo: preparar validación (no fijar datos hasta confirmar)
          const validacion = buildValidationPayload(consolidated, reporteSala, metrics, empresaFinal, numeroContrato);
          setPendingLiquidacion({
            source,
            empresaFinal,
            numeroContrato,
            originalFile: file,
            archivoTarifas: tarifasFile || null,
            consolidatedBase,
            consolidated,
            reporteSala,
            metrics,
            tarifasOficiales: tarifas
          });
          setValidationData(validacion);
          setShowValidationModal(true);
          setShowTarifasOptions(false);
          setLiquidacionCoincide(true);
          addLog('🔍 Validación requerida: revisa los totales antes de continuar', 'info');
        }

        try {
          if (currentUser?.uid) {
            await logActivity(
              source === 'historial' ? 'liquidacion_historial_procesada' : 'archivo_liquidacion_procesado',
              'liquidacion',
              empresaFinal || 'GENERAL',
              {
                fileName: file.name || 'sin-nombre',
                fileSize: file.size || 0,
                empresa: empresaFinal,
                numeroContrato: numeroContrato || 'No detectado',
                totalMaquinas: consolidated.length,
                totalEstablecimientos: reporteSala.length
              },
              currentUser.uid,
              getUserDisplayName(),
              currentUser.email
            );
          }
        } catch (logError) {
          console.error('Error logging liquidacion processing:', logError);
        }

        return {
          empresaFinal,
          numeroContrato,
          originalData: processedRows,
          consolidatedData: consolidated,
          reporteBySala: reporteSala,
          metricsData: metrics,
          tarifasOficiales: tarifas
        };
      } catch (error) {
        console.error('Error procesando liquidación:', error);
        addLog(`❌ Error procesando liquidación: ${error.message}`, 'error');
        addNotification(`Error procesando liquidación: ${error.message}`, 'error');
        setSelectedFile(null);
        setActiveStep(1);
        throw error;
      } finally {
        setProcessing(false);
      }
    },
    [
      addLog,
      addNotification,
      buscarEmpresaPorContrato,
      companies,
      companiesLoading,
      consolidarDatos,
      consolidatedData,
      currentUser?.email,
      currentUser?.uid,
      detectarFilaEncabezados,
      aplicarTarifasDesdeArchivo,
      calcularMetricasBasicas,
      generarReporteSala,
      getUserDisplayName,
      logActivity,
      procesarDatos,
      processing,
      readFile,
      resetLiquidacion,
      selectedFile,
      validateExcelData,
      buildValidationPayload
    ]
  );

  const handleValidationTarifasInputChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!pendingLiquidacion) {
        addNotification('No hay una liquidación pendiente para ajustar', 'warning');
        return;
      }
      if (procesandoTarifasValidacion || processing) return;

      setProcesandoTarifasValidacion(true);
      addLog('📄 Procesando archivo de tarifas (validación)...', 'info');

      try {
        const empresaFinal = pendingLiquidacion.empresaFinal || empresa || 'GENERAL';
        const consolidatedBase = pendingLiquidacion.consolidatedBase || pendingLiquidacion.consolidated || [];
        const tarifasResult = await aplicarTarifasDesdeArchivo(file, consolidatedBase, empresaFinal);

        setArchivoTarifas(file);
        setTarifasOficiales(tarifasResult.tarifasOficiales || {});

        const validacionActualizada = buildValidationPayload(
          tarifasResult.consolidated,
          tarifasResult.reporteSala,
          tarifasResult.metrics,
          empresaFinal,
          pendingLiquidacion.numeroContrato
        );
        setValidationData(validacionActualizada);
        setPendingLiquidacion((prev) =>
          prev
            ? {
                ...prev,
                archivoTarifas: file,
                consolidated: tarifasResult.consolidated,
                reporteSala: tarifasResult.reporteSala,
                metrics: tarifasResult.metrics,
                tarifasOficiales: tarifasResult.tarifasOficiales || {}
              }
            : prev
        );

        setLiquidacionCoincide(true);
        addLog('✅ Tarifas aplicadas. Confirmando validación...', 'success');

        // Mantener comportamiento de V1: cerrar automáticamente después de aplicar tarifas.
        setTimeout(() => {
          confirmarValidacion();
        }, 900);
      } catch (error) {
        console.error('Error aplicando tarifas (validación):', error);
        addLog(`❌ Error aplicando tarifas: ${error.message}`, 'error');
        addNotification('Error aplicando tarifas', 'error');
      } finally {
        setProcesandoTarifasValidacion(false);
      }
    },
    [
      addLog,
      addNotification,
      aplicarTarifasDesdeArchivo,
      buildValidationPayload,
      confirmarValidacion,
      empresa,
      pendingLiquidacion,
      procesandoTarifasValidacion,
      processing
    ]
  );

  const processSelectedFile = useCallback(
    async (file) => {
      await procesarArchivo(file, null, { allowReplace: false, source: 'archivo' });
    },
    [
      procesarArchivo
    ]
  );

  const handleSelectTarifasFile = useCallback(() => {
    tarifasInputRef.current?.click();
  }, []);

  const handleTarifasInputChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!Array.isArray(consolidatedData) || consolidatedData.length === 0) {
        addNotification('Primero procesa una liquidación para aplicar tarifas', 'warning');
        return;
      }
      if (processing) return;

      // Aplicar tarifas sobre el consolidado actual
      setProcessing(true);
      try {
        setArchivoTarifas(file);
        const empresaFinal = empresa || 'GENERAL';
        const tarifasResult = await aplicarTarifasDesdeArchivo(file, consolidatedData, empresaFinal);
        setConsolidatedData(tarifasResult.consolidated);
        setReporteBySala(tarifasResult.reporteSala);
        setMetricsData(tarifasResult.metrics);
        setTarifasOficiales(tarifasResult.tarifasOficiales);
        addLog('✅ Tarifas aplicadas al consolidado actual', 'success');
      } catch (error) {
        console.error('Error aplicando tarifas:', error);
        addLog(`❌ Error aplicando tarifas: ${error.message}`, 'error');
        addNotification('Error aplicando tarifas', 'error');
      } finally {
        setProcessing(false);
      }
    },
    [addLog, addNotification, aplicarTarifasDesdeArchivo, consolidatedData, empresa, processing]
  );

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) processSelectedFile(file);
    },
    [processSelectedFile]
  );

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // No cambiar estado visual si ya hay archivos procesados
    if (selectedFile || liquidacionGuardadaId) {
      return;
    }
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [selectedFile, liquidacionGuardadaId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Validación: Prevenir drop si empresas no están disponibles
    if (companiesLoading) {
      addNotification({
        type: 'warning',
        title: 'Cargando empresas',
        message: 'Por favor espera a que se carguen las empresas antes de subir archivos...',
        icon: 'warning'
      });
      return;
    }

    if (!companies || companies.length === 0) {
      addNotification({
        type: 'error',
        title: 'Sin empresas disponibles',
        message: 'No se encontraron empresas en la base de datos. Verifica tu conexión.',
        icon: 'error'
      });
      return;
    }

    // Prevenir drop si ya hay archivos procesados
    if (selectedFile || liquidacionGuardadaId) {
      addNotification({
        type: 'warning',
        title: 'Ya hay archivos cargados',
        message: 'Reinicia la liquidación antes de cargar nuevos archivos.',
        icon: 'warning'
      });
      return;
    }

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      processSelectedFile(file);
    }
  }, [selectedFile, liquidacionGuardadaId, companiesLoading, companies, addNotification, processSelectedFile]);

  const abrirModalSala = useCallback(() => {
    if (!Array.isArray(reporteBySala) || reporteBySala.length === 0) {
      addNotification('No hay reporte por sala para exportar', 'warning');
      return;
    }
    if (!Array.isArray(consolidatedData) || consolidatedData.length === 0) {
      addNotification('No hay datos consolidados para filtrar la sala', 'warning');
      return;
    }
    setShowSalaModal(true);
  }, [addNotification, consolidatedData, reporteBySala]);

  const abrirModalDaily = useCallback(() => {
    if (!Array.isArray(consolidatedData) || consolidatedData.length === 0) {
      addNotification('No hay datos para exportar reporte diario', 'warning');
      return;
    }
    if (!Array.isArray(originalData) || originalData.length === 0) {
      addNotification('No hay archivo original con datos diarios', 'warning');
      return;
    }
    setShowDailyModal(true);
  }, [addNotification, consolidatedData, originalData]);

  const mostrarConfirmacionGuardado = useCallback(() => {
    if (!canGuardar) {
      addNotification('No hay datos suficientes para guardar', 'warning');
      return;
    }
    setShowConfirmarGuardadoModal(true);
  }, [addNotification, canGuardar]);

  const confirmarGuardadoLiquidacion = useCallback(async () => {
    if (!currentUser?.uid) {
      addNotification('Debes iniciar sesión para guardar', 'warning');
      return;
    }
    if (!canGuardar) {
      addNotification('No hay datos suficientes para guardar', 'warning');
      return;
    }
    if (guardandoLiquidacion) return;

    setGuardandoLiquidacion(true);
    addLog('💾 Guardando liquidación en Firebase...', 'info');

    try {
      const periodoDetectado = detectarPeriodoLiquidacion();

      const liquidacionData = {
        empresa: empresa || 'GENERAL',
        originalData,
        consolidatedData,
        reporteBySala,
        metricsData,
        tarifasOficiales,
        originalFile: selectedFile,
        archivoTarifas: archivoTarifas || null,
        periodoDetectado: periodoDetectado || null
      };

      // Opcional: aportar periodoInfo si se puede parsear (el servicio también tiene fallback propio)
      if (periodoDetectado) {
        const match = String(periodoDetectado).match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(?:de\s*)?(\d{4})/i);
        if (match) {
          const mesTexto = match[1].toLowerCase();
          const año = parseInt(match[2]);
          liquidacionData.periodoInfo = {
            periodoLiquidacion: `${mesTexto}_${año}`,
            mesLiquidacion: mesTexto,
            añoLiquidacion: año,
            fechaProcesamiento: new Date().toISOString().split('T')[0]
          };
        }
      }

      const liquidacionId = await liquidacionPersistenceService.saveLiquidacion(liquidacionData, currentUser.uid);
      setLiquidacionGuardadaId(liquidacionId);
      addLog(`✅ Liquidación guardada con ID: ${liquidacionId}`, 'success');
      addNotification('Liquidación guardada exitosamente en Firebase', 'success');

      try {
        await logActivity(
          'liquidacion_guardada',
          'liquidacion',
          liquidacionId,
          {
            empresa: empresa || 'Sin Empresa',
            periodo: periodoDetectado || 'Sin período',
            registros: Array.isArray(consolidatedData) ? consolidatedData.length : 0,
            archivoOriginal: selectedFile?.name || null,
            archivoTarifas: archivoTarifas?.name || null
          },
          currentUser.uid,
          getUserDisplayName(),
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging liquidacion save:', logError);
      }

      setShowConfirmarGuardadoModal(false);
    } catch (error) {
      console.error('Error guardando liquidación:', error);
      addLog(`❌ Error guardando liquidación: ${error.message}`, 'error');
      addNotification('Error al guardar liquidación en Firebase', 'error');
    } finally {
      setGuardandoLiquidacion(false);
    }
  }, [
    addLog,
    addNotification,
    archivoTarifas,
    canGuardar,
    consolidatedData,
    currentUser?.email,
    currentUser?.uid,
    detectarPeriodoLiquidacion,
    empresa,
    getUserDisplayName,
    guardandoLiquidacion,
    logActivity,
    metricsData,
    originalData,
    reporteBySala,
    selectedFile,
    tarifasOficiales
  ]);

  const goToHistorico = useCallback(() => {
    navigate('/liquidaciones/historico');
  }, [navigate]);

  return (
    <>
      {/* Modal de validación (V1-style) */}
      <Dialog
        open={showValidationModal}
        onClose={() => {}}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            background: theme.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Analytics />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                🔍 Validación de Liquidación
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Revisa los cálculos antes de finalizar
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 5 }}>
          <input
            ref={validationTarifasInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleValidationTarifasInputChange}
          />

          {validationData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.08),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 600, color: 'primary.main', letterSpacing: 0.8, fontSize: '0.75rem' }}
                  >
                    Información General
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    📊 Resumen de Consolidación
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    🎰 Máquinas consolidadas: <strong>{validationData.totalMaquinas}</strong>
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    🏢 Establecimientos: <strong>{validationData.totalEstablecimientos}</strong>
                  </Typography>
                  <Typography>
                    🏢 Empresa: <strong>{validationData.empresaFinal || empresa || 'No detectada'}</strong>
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    background: alpha(theme.palette.secondary.main, 0.08),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 600, color: 'secondary.main', letterSpacing: 0.8, fontSize: '0.75rem' }}
                  >
                    Información Financiera
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    💰 Totales Financieros
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    Producción: <strong>{formatCurrencyCOP(validationData.totalProduccion)}</strong>
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    Derechos (12%): <strong>{formatCurrencyCOP(validationData.totalDerechos)}</strong>
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    Gastos (1%): <strong>{formatCurrencyCOP(validationData.totalGastos)}</strong>
                  </Typography>
                  <Typography sx={{ fontSize: '1.05em', fontWeight: 600 }}>
                    Total Impuestos: <strong>{formatCurrencyCOP(validationData.totalImpuestos)}</strong>
                  </Typography>
                </Paper>
              </Grid>

              {!showTarifasOptions && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      background: alpha(theme.palette.info.main, 0.08),
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                  >
                    <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                      🔍 ¿Los cálculos coinciden con las tarifas oficiales?
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 3 }}>
                      Si tienes un archivo de tarifas oficial, selecciona “No Coincide” para ajustar automáticamente.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        onClick={handleLiquidacionCoincide}
                        variant="contained"
                        size="large"
                        color="success"
                        sx={{ minWidth: 140, borderRadius: 1, fontWeight: 600, textTransform: 'none' }}
                      >
                        ✅ Sí Coincide
                      </Button>
                      <Button
                        onClick={handleLiquidacionNoCoincide}
                        variant="contained"
                        size="large"
                        color="error"
                        sx={{ minWidth: 140, borderRadius: 1, fontWeight: 600, textTransform: 'none' }}
                      >
                        ❌ No Coincide
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}

              {showTarifasOptions && (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      background: alpha(theme.palette.warning.main, 0.08),
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      ⚙️ Ajuste de Tarifas Oficiales
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      Selecciona un Excel de tarifas con columnas “NUC” y “Tarifa fija”.
                    </Typography>

                    {(procesandoTarifasValidacion || processing) && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                          p: 2,
                          borderRadius: 1,
                          background: alpha(theme.palette.info.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}
                      >
                        <CircularProgress size={20} color="info" />
                        <Typography>Procesando archivo de tarifas…</Typography>
                      </Box>
                    )}

                    {liquidacionCoincide && !procesandoTarifasValidacion && showTarifasOptions && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                          p: 2,
                          borderRadius: 1,
                          background: alpha(theme.palette.success.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}
                      >
                        <Typography sx={{ textAlign: 'center', width: '100%' }}>
                          ✅ Tarifas aplicadas. Cerrando validación…
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        onClick={seleccionarArchivoTarifasValidacion}
                        variant="contained"
                        disabled={procesandoTarifasValidacion || processing}
                        sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none' }}
                      >
                        📁 Seleccionar Archivo de Tarifas
                      </Button>
                      <Button
                        onClick={continuarSinTarifas}
                        variant="outlined"
                        disabled={procesandoTarifasValidacion || processing}
                        sx={{ borderRadius: 1, fontWeight: 500, textTransform: 'none' }}
                      >
                        ➡️ Continuar Sin Ajustes
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Validación de liquidación
          </Typography>
          <Button onClick={cancelarValidacion} variant="outlined" sx={{ borderRadius: 1, textTransform: 'none', px: 3 }}>
            ❌ Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 2,
          p: 3,
          color: theme.palette.primary.contrastText,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                letterSpacing: 1.2,
                fontWeight: 600,
                opacity: 0.85
              }}
            >
              SISTEMA • PROCESAMIENTO
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.5, mt: 0.5 }}>
              Procesador de Liquidaciones
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Sistema avanzado para gestión centralizada de recaudos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[{ icon: Settings, label: 'Configuración' }, { icon: Notifications, label: 'Notificaciones' }, { icon: AccountCircle, label: 'Cuenta' }].map(
              ({ icon: Icon, label }) => (
                <IconButton
                  key={label}
                  size="small"
                  aria-label={label}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              )
            )}
          </Box>
        </Box>
      </Paper>

      {/* Acciones (Fase 1: exportaciones) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          p: 2.5,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <input
          ref={tarifasInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleTarifasInputChange}
        />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Acciones
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.25 }}>
              Carga, procesamiento y exportaciones
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              onClick={handleSelectFile}
              disabled={processing || companiesLoading || !companies || companies.length === 0 || Boolean(selectedFile)}
            >
              {processing ? 'Procesando…' : selectedFile ? 'Archivo cargado' : 'Cargar archivo'}
            </Button>
            <Button variant="outlined" onClick={resetLiquidacion} disabled={processing}>
              Reiniciar
            </Button>
            <Button
              variant="outlined"
              onClick={handleSelectTarifasFile}
              disabled={processing || !selectedFile || !Array.isArray(consolidatedData) || consolidatedData.length === 0}
            >
              {archivoTarifas ? 'Tarifas cargadas' : 'Cargar tarifas (opcional)'}
            </Button>
            <Button
              variant="contained"
              startIcon={<ReceiptLong />}
              onClick={exportarConsolidado}
              disabled={!canExportConsolidado}
            >
              Exportar Consolidado
            </Button>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={mostrarConfirmacionGuardado}
              disabled={!canGuardar}
            >
              Guardar
            </Button>
            <Button
              variant="outlined"
              startIcon={<Business />}
              onClick={abrirModalSala}
              disabled={!canExportSala}
            >
              Exportar Reporte Salas
            </Button>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={abrirModalDaily}
              disabled={!canExportDiario}
            >
              Exportar Reporte Diario
            </Button>
            <Button
              variant="outlined"
              onClick={goToHistorico}
              sx={{ textTransform: 'none' }}
            >
              Ver histórico
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5, alignItems: 'center' }}>
          {/* Avatar con logo de empresa */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              border: `1px solid ${alpha(empresa && empresa !== 'GENERAL' ? theme.palette.success.main : theme.palette.grey[500], 0.3)}`,
              backgroundColor: alpha(empresa && empresa !== 'GENERAL' ? theme.palette.success.main : theme.palette.grey[500], 0.06),
              transition: 'all 0.2s ease'
            }}
          >
            {empresaCompleta?.logoURL ? (
              <Avatar
                src={empresaCompleta.logoURL}
                alt={`Logo de ${empresaCompleta.name}`}
                sx={{
                  width: 36,
                  height: 36,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              />
            ) : empresa && empresa !== 'GENERAL' ? (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              >
                {empresa.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.grey[500], 0.15),
                  color: theme.palette.grey[600],
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: `2px solid ${alpha(theme.palette.grey[500], 0.3)}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              >
                ?
              </Avatar>
            )}
            
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: empresa && empresa !== 'GENERAL' ? theme.palette.text.primary : theme.palette.text.secondary,
                  lineHeight: 1.2,
                  fontSize: '0.875rem'
                }}
              >
                {empresa || 'GENERAL'}
              </Typography>
              {empresaCompleta && (
                <Box sx={{ mt: 0.25 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      display: 'block'
                    }}
                  >
                    NIT: {empresaCompleta.nit}
                  </Typography>
                  {empresaCompleta.contractNumber && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.success.main,
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    >
                      Contrato: {empresaCompleta.contractNumber}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            
            {empresa && empresa !== 'GENERAL' && (
              <Chip
                size="small"
                label="Detectada"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: alpha(theme.palette.success.main, 0.12),
                  color: theme.palette.success.main,
                  border: 'none'
                }}
              />
            )}
          </Paper>
          
          {selectedFile && <Chip size="small" label={`Archivo: ${selectedFile.name}`} />}
          {archivoTarifas && <Chip size="small" color="info" label={`Tarifas: ${archivoTarifas.name}`} />}
          {liquidacionGuardadaId && <Chip size="small" color="success" label="Guardada" />}
          {companiesLoading && <Chip size="small" color="warning" label="Cargando empresas…" />}
          {!companiesLoading && (!companies || companies.length === 0) && <Chip size="small" color="error" label="Sin empresas" />}
        </Box>
        {!currentUser?.uid && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: theme.palette.text.secondary }}>
            Inicia sesión para habilitar exportaciones.
          </Typography>
        )}
        {currentUser?.uid && !canExportConsolidado && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: theme.palette.text.secondary }}>
            Carga y procesa un archivo para habilitar exportaciones.
          </Typography>
        )}
      </Paper>

      {/* Drag & Drop Zone */}
      {!processing && !selectedFile && (
        <Paper
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 6,
            mb: 3,
            textAlign: 'center',
            border: `2px dashed ${
              dragActive
                ? theme.palette.primary.main
                : alpha(theme.palette.divider, 0.3)
            }`,
            borderRadius: 2,
            backgroundColor: dragActive
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.background.paper, 0.6),
            transition: 'all 0.3s ease',
            cursor: companiesLoading || (companies && companies.length === 0)
              ? 'not-allowed'
              : 'pointer',
            transform: dragActive ? 'scale(1.02)' : 'scale(1)',
            opacity: companiesLoading || (companies && companies.length === 0) ? 0.5 : 1,
            boxShadow: dragActive 
              ? '0 4px 12px rgba(0,0,0,0.1)' 
              : '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: companiesLoading || (companies && companies.length === 0)
                ? alpha(theme.palette.divider, 0.3)
                : alpha(theme.palette.primary.main, 0.5),
              backgroundColor: companiesLoading || (companies && companies.length === 0)
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.primary.main, 0.04)
            }
          }}
        >
          <CloudUpload
            sx={{
              fontSize: 64,
              color: dragActive
                ? theme.palette.primary.main
                : alpha(theme.palette.text.secondary, 0.4),
              mb: 2,
              transition: 'all 0.3s ease'
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 1
            }}
          >
            {companiesLoading
              ? 'Cargando empresas...'
              : (companies && companies.length === 0)
              ? 'No hay empresas disponibles'
              : 'Arrastra aquí el archivo Excel de liquidaciones'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 2
            }}
          >
            {companiesLoading
              ? 'Esperando datos de empresas...'
              : (companies && companies.length === 0)
              ? 'Primero debes crear empresas en el sistema'
              : 'O haz clic en el botón "Cargar Archivo" para seleccionar manualmente'}
          </Typography>
        </Paper>
      )}

      {/* Stepper */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          p: 2.5,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ position: 'relative', maxWidth: 900, mx: 'auto', px: 1 }}>
          <Box
            sx={{
              position: 'absolute',
              top: 24,
              left: 30,
              right: 30,
              height: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.12)
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 24,
              left: 30,
              height: 2,
              width: `${progressPct}%`,
              bgcolor: theme.palette.primary.main,
              transition: 'width 0.5s ease'
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {[
              { n: 1, label: '1. Cargar Archivo' },
              { n: 2, label: '2. Procesando' },
              { n: 3, label: '3. Guardar' }
            ].map((s) => {
              const isActive = s.n === activeStep;
              const isCompleted = s.n < activeStep;
              return (
                <Box
                  key={s.n}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveStep(s.n)}
                  onKeyDown={(e) => (e.key === 'Enter' ? setActiveStep(s.n) : null)}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    zIndex: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      border: `2px solid ${isActive || isCompleted ? theme.palette.primary.main : 'transparent'}`,
                      bgcolor: isActive || isCompleted ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.08),
                      color: isActive || isCompleted ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? `0 0 0 6px ${alpha(theme.palette.primary.main, 0.18)}` : 'none'
                    }}
                  >
                    {s.n}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive || isCompleted ? theme.palette.primary.main : theme.palette.text.secondary
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>

      {/* KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {processing && (!originalData || originalData.length === 0) ? (
          // Skeleton para KPIs durante carga
          [1, 2, 3, 4].map((i) => (
            <Grid key={`kpi-skeleton-${i}`} item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  p: 2.5,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={40} />
                    <Skeleton variant="text" width="90%" height={20} sx={{ mt: 0.5 }} />
                  </Box>
                  <Skeleton variant="rounded" width={44} height={44} />
                </Box>
                <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 2 }} />
              </Paper>
            </Grid>
          ))
        ) : (
          (() => {
            // Calcular cumplimiento de transmisión (solo si hay datos)
            const totalMaquinasContrato = Array.isArray(consolidatedData) ? consolidatedData.length : 0;
            const maquinasTransmitiendo = Array.isArray(consolidatedData) 
              ? consolidatedData.filter(m => (m.produccion || 0) > 0).length 
              : 0;
            const maquinasSinTransmitir = totalMaquinasContrato - maquinasTransmitiendo;
            const porcentajeIncumplimiento = totalMaquinasContrato > 0 
              ? ((maquinasSinTransmitir / totalMaquinasContrato) * 100).toFixed(1)
              : 0;
            const porcentajeCumplimiento = totalMaquinasContrato > 0
              ? ((maquinasTransmitiendo / totalMaquinasContrato) * 100).toFixed(1)
              : 0;
            
            const kpis = [
          {
            key: 'maquinas',
            title: 'Máquinas Consolidadas',
            value: String(metrics.maquinas.value),
            trend: metrics.maquinas,
            icon: Casino,
            color: theme.palette.primary.main
          },
          {
            key: 'produccion',
            title: 'Producción Total',
            value: formatCurrencyCompact(metrics.produccion.value),
            trend: metrics.produccion,
            icon: AttachMoney,
            color: theme.palette.success.main
          },
          {
            key: 'impuestos',
            title: 'Total Impuestos',
            value: formatCurrencyCompact(metrics.impuestos.value),
            trend: metrics.impuestos,
            icon: ReceiptLong,
            color: theme.palette.warning.main
          },
          {
            key: 'promedio',
            title: 'Promedio / Establecimiento',
            value: formatCurrencyCompact(metrics.promedio.value),
            trend: metrics.promedio,
            icon: Analytics,
            color: theme.palette.secondary.main
          }
        ];
        
        // Agregar tarjeta de cumplimiento
        kpis.push({
          key: 'cumplimiento',
          title: 'Cumplimiento Transmisión',
          value: `${porcentajeCumplimiento}%`,
          subtitle: `${maquinasTransmitiendo}/${totalMaquinasContrato} transmitiendo`,
          incumplimiento: maquinasSinTransmitir,
          porcentajeIncumplimiento: porcentajeIncumplimiento,
          trend: { value: 0, trend: 0, isPositive: maquinasSinTransmitir === 0 },
          icon: Assessment,
          color: maquinasSinTransmitir === 0 ? theme.palette.success.main : theme.palette.error.main,
          isCumplimiento: true
        });

        return kpis.map((kpi) => {
          const TrendIcon = kpi.trend.isPositive ? TrendingUp : TrendingDown;
          const trendColor = kpi.trend.isPositive ? theme.palette.success.main : theme.palette.error.main;
          return (
            <Grid key={kpi.key} item xs={12} sm={6} md={kpi.isCumplimiento ? 12 : 3}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  p: 2.5,
                  border: `1px solid ${alpha(kpi.isCumplimiento ? kpi.color : theme.palette.primary.main, 0.6)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderColor: alpha(kpi.isCumplimiento ? kpi.color : theme.palette.primary.main, 0.8) },
                  ...(kpi.isCumplimiento && { background: alpha(kpi.color, 0.04) })
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.3 }}>
                      {kpi.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.25 }}>
                      {kpi.title}
                    </Typography>
                    {kpi.subtitle && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.5 }}>
                        {kpi.subtitle}
                      </Typography>
                    )}
                    {kpi.isCumplimiento && kpi.incumplimiento > 0 && (
                      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.error.main, 0.12),
                            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'error.main' }}>
                            ⚠️ {kpi.incumplimiento} máquinas sin transmitir ({kpi.porcentajeIncumplimiento}% incumplimiento)
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {kpi.isCumplimiento && kpi.incumplimiento === 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Chip
                          size="small"
                          icon={<CheckCircle fontSize="small" />}
                          label="✅ 100% de las máquinas transmitiendo correctamente"
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.12),
                            color: 'success.main',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(kpi.color, 0.12),
                      color: kpi.color
                    }}
                  >
                    <kpi.icon fontSize="small" />
                  </Box>
                </Box>

                {!kpi.isCumplimiento && (
                  <Chip
                    size="small"
                    icon={<TrendIcon fontSize="small" />}
                    label={`${kpi.trend.isPositive ? '+' : ''}${kpi.trend.trend}%`}
                    sx={{
                      mt: 2,
                      bgcolor: alpha(trendColor, 0.12),
                      color: trendColor,
                      fontWeight: 700,
                      '& .MuiChip-icon': { color: trendColor }
                    }}
                  />
                )}
              </Paper>
            </Grid>
          );
        });
          })()
        )}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {processing && (!originalData || originalData.length === 0) ? (
          // Skeleton para métricas secundarias durante carga
          [1, 2, 3, 4, 5].map((i) => (
            <Grid key={`metric-skeleton-${i}`} item xs={12} sm={6} md={2.4}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  p: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={24} />
                    <Skeleton variant="text" width="60%" height={16} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          [
          { label: 'Establecimientos', value: String(metrics.establecimientos.value), icon: Business, color: theme.palette.primary.main },
          { label: 'Derechos Explotación', value: formatCurrencyCompact(metrics.derechos.value), icon: AttachMoney, color: theme.palette.warning.main },
          { label: 'Gastos Admin.', value: formatCurrencyCompact(metrics.gastos.value), icon: ReceiptLong, color: theme.palette.secondary.main },
          { label: `Sin Cambios (${metrics.sinCambios.percentage}%)`, value: String(metrics.sinCambios.value), icon: CheckCircle, color: theme.palette.success.main },
          { label: `Con Novedades (${metrics.novedades.percentage}%)`, value: String(metrics.novedades.value), icon: Warning, color: theme.palette.warning.main }
        ].map((item) => (
          <Grid key={item.label} item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                p: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.6) }
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  mx: 'auto',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(item.color, 0.12),
                  color: item.color,
                  mb: 1
                }}
              >
                <item.icon fontSize="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.2 }}>
                {item.value}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {item.label}
              </Typography>
            </Paper>
          </Grid>
        ))
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {processing && (!originalData || originalData.length === 0) ? (
          // Skeleton para gráficos durante carga
          <>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  p: 2.5,
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  minHeight: 240
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={180} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
            {[1, 2].map((i) => (
              <Grid key={`chart-skeleton-${i}`} item xs={12} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    p: 2.5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    minHeight: 240
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Skeleton variant="text" width="70%" height={28} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Box>
                  <Skeleton variant="circular" width={140} height={140} sx={{ mx: 'auto', mt: 2 }} />
                </Paper>
              </Grid>
            ))}
          </>
        ) : (
          <>
            <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 2.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 240
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Producción por Establecimiento
              </Typography>
              <BarChartIcon fontSize="small" color="action" />
            </Box>

            {chartProduccionPorEstablecimiento.length === 0 ? (
              <Box
                sx={{
                  height: 180,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
                  display: 'grid',
                  placeItems: 'center',
                  color: theme.palette.text.secondary
                }}
              >
                <Typography variant="body2">Sin datos para graficar</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={chartProduccionPorEstablecimiento} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={alpha(theme.palette.divider, 0.25)} strokeDasharray="3 3" />
                    <XAxis dataKey="establecimiento" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrencyCompact(Number(v) || 0).replace('$ ', '')} />
                    <ReTooltip
                      formatter={(v) => formatCurrencyCOP(Number(v) || 0)}
                      labelFormatter={(l) => String(l || '')}
                      contentStyle={{ borderRadius: 8, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}
                    />
                    <Bar dataKey="produccion" fill={alpha(theme.palette.primary.main, 0.85)} radius={[6, 6, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 2.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 240
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Estado de Novedades
              </Typography>
              <Analytics fontSize="small" color="action" />
            </Box>

            {chartNovedades.length === 0 ? (
              <Box
                sx={{
                  height: 180,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
                  display: 'grid',
                  placeItems: 'center',
                  color: theme.palette.text.secondary
                }}
              >
                <Typography variant="body2">Sin datos para graficar</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <ReTooltip
                      formatter={(v) => `${Number(v) || 0} máquina(s)`}
                      contentStyle={{ borderRadius: 8, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}
                    />
                    <Pie
                      data={chartNovedades}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {chartNovedades.map((entry, index) => {
                        const name = String(entry?.name || '').toLowerCase();
                        const color = name.includes('sin')
                          ? theme.palette.success.main
                          : name.includes('retiro')
                            ? theme.palette.warning.main
                            : theme.palette.info.main;
                        return <Cell key={`cell-${index}`} fill={alpha(color, 0.9)} />;
                      })}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 2.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              minHeight: 240
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Tendencia Diaria
              </Typography>
              <Analytics fontSize="small" color="action" />
            </Box>

            {chartTendenciaDiaria.length === 0 ? (
              <Box
                sx={{
                  height: 180,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`,
                  display: 'grid',
                  placeItems: 'center',
                  color: theme.palette.text.secondary
                }}
              >
                <Typography variant="body2">Sin fechas diarias detectadas</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={chartTendenciaDiaria} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={alpha(theme.palette.divider, 0.25)} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} minTickGap={12} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrencyCompact(Number(v) || 0).replace('$ ', '')} />
                    <ReTooltip
                      formatter={(v) => formatCurrencyCOP(Number(v) || 0)}
                      labelFormatter={(l) => String(l || '')}
                      contentStyle={{ borderRadius: 8, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}
                    />
                    <Line
                      type="monotone"
                      dataKey="produccion"
                      stroke={alpha(theme.palette.secondary.main, 0.9)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </ReLineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
          </>
        )}
      </Grid>

      {/* Tabs + content placeholder */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          p: 2.5,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          mb: 10
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 38,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 38 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 }
          }}
        >
          <Tab label="Resumen General" />
          <Tab label="Consolidado Detallado" />
          <Tab label="Reporte por Sala" />
          {tarifasOficiales && Object.keys(tarifasOficiales).length > 0 && (
            <Tab label="🏷️ Tarifa Fija" />
          )}
        </Tabs>

        <Divider sx={{ mt: 1.5 }} />

        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabPanel value={activeTab} index={0}>
                {!Array.isArray(consolidatedData) || consolidatedData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Procesa un archivo para ver el dashboard ejecutivo.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Top 5 Establecimientos por Producción */}
                    <Paper
                      sx={{
                        p: 2.5,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        background: alpha(theme.palette.primary.main, 0.04),
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 600, color: 'primary.main', letterSpacing: 0.8, fontSize: '0.75rem', display: 'block', mb: 1.5 }}
                      >
                        🏆 Top 5 Establecimientos por Producción
                      </Typography>
                      {(() => {
                        const salasOrdenadas = [...(Array.isArray(reporteBySala) ? reporteBySala : [])]
                          .sort((a, b) => (b.produccion || 0) - (a.produccion || 0))
                          .slice(0, 5);
                        const totalProduccionGlobal = metricsData?.totalProduccion || derivedMetrics.totalProduccion || 1;
                        
                        return salasOrdenadas.length === 0 ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No hay datos de establecimientos disponibles.
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {salasOrdenadas.map((sala, idx) => {
                              const porcentaje = ((sala.produccion || 0) / totalProduccionGlobal) * 100;
                              return (
                                <Box key={idx}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                      {sala.establecimiento || 'Sin nombre'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                      {formatCurrencyCOP(sala.produccion || 0)} ({porcentaje.toFixed(1)}%)
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: 8,
                                      borderRadius: 1,
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${porcentaje}%`,
                                        height: '100%',
                                        bgcolor: theme.palette.primary.main,
                                        transition: 'width 0.3s ease'
                                      }}
                                    />
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        );
                      })()}
                    </Paper>

                    {/* Alertas y Validaciones */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      {/* Alertas */}
                      <Paper
                        sx={{
                          p: 2.5,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                          background: alpha(theme.palette.warning.main, 0.04),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{ fontWeight: 600, color: 'warning.main', letterSpacing: 0.8, fontSize: '0.75rem', display: 'block', mb: 1.5 }}
                        >
                          ⚠️ Alertas y Observaciones
                        </Typography>
                        {(() => {
                          const maquinasConNovedades = consolidatedData.filter(m => m.novedad && m.novedad !== 'Sin cambios').length;
                          const establecimientosSinProduccion = (Array.isArray(reporteBySala) ? reporteBySala : []).filter(s => (s.produccion || 0) === 0).length;
                          const promedioDiario = (metricsData?.totalProduccion || derivedMetrics.totalProduccion || 0) / 30;
                          
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: maquinasConNovedades > 0 ? 'warning.main' : 'success.main' }} />
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  <strong>{maquinasConNovedades}</strong> máquinas con novedades {maquinasConNovedades > 10 && '(requiere seguimiento)'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: establecimientosSinProduccion > 0 ? 'error.main' : 'success.main' }} />
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  <strong>{establecimientosSinProduccion}</strong> establecimientos sin producción {establecimientosSinProduccion > 0 && '(verificar operación)'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'info.main' }} />
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  Promedio diario estimado: <strong>{formatCurrencyCOP(promedioDiario)}</strong>
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })()}
                      </Paper>

                      {/* Validaciones */}
                      <Paper
                        sx={{
                          p: 2.5,
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          background: alpha(theme.palette.success.main, 0.04),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{ fontWeight: 600, color: 'success.main', letterSpacing: 0.8, fontSize: '0.75rem', display: 'block', mb: 1.5 }}
                        >
                          ✅ Validaciones Automáticas
                        </Typography>
                        {(() => {
                          const totalMaquinas = consolidatedData.length;
                          const maquinasConTarifa = consolidatedData.filter(m => m.tarifaOficial && m.tarifaOficial !== 0).length;
                          const sinTarifa = totalMaquinas - maquinasConTarifa;
                          const calculosOK = consolidatedData.every(m => 
                            (m.totalImpuestos || 0) === ((m.derechosExplotacion || 0) + (m.gastosAdministracion || 0))
                          );
                          
                          // Detectar periodo usando la misma función del modal
                          const periodoDetectado = detectarPeriodoLiquidacion();
                          
                          // Detectar posibles duplicados (mismo NUC)
                          const nucsUnicos = new Set(consolidatedData.map(m => m.nuc).filter(Boolean));
                          const posiblesDuplicados = totalMaquinas - nucsUnicos.size;
                          
                          // Máquinas sin NUC
                          const sinNUC = consolidatedData.filter(m => !m.nuc || m.nuc === '').length;
                          
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {calculosOK ? '✅' : '❌'}
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  Cálculos de impuestos verificados
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                📅
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  Periodo: <strong>{periodoDetectado}</strong>
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                📊
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  Tarifa Fija: <strong>{maquinasConTarifa}</strong> | Variable (12%): <strong>{sinTarifa}</strong>
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {posiblesDuplicados === 0 ? '✅' : '⚠️'}
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  Duplicados: <strong>{posiblesDuplicados}</strong>
                                  {posiblesDuplicados > 0 && ' (revisar NUCs)'}
                                </Typography>
                              </Box>
                              
                              {sinNUC > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  ⚠️
                                  <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'warning.main' }}>
                                    <strong>{sinNUC}</strong> máquinas sin NUC asignado
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })()}
                      </Paper>
                    </Box>

                    {/* Top Máquinas de Mayor Rendimiento */}
                    <Paper
                      sx={{
                        p: 2.5,
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                        background: alpha(theme.palette.secondary.main, 0.04),
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{ fontWeight: 600, color: 'secondary.main', letterSpacing: 0.8, fontSize: '0.75rem', display: 'block', mb: 1.5 }}
                      >
                        🎰 Máquinas de Mayor Rendimiento
                      </Typography>
                      {(() => {
                        const topMaquinas = [...consolidatedData]
                          .sort((a, b) => (b.produccion || 0) - (a.produccion || 0))
                          .slice(0, 5);
                        
                        return topMaquinas.length === 0 ? (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No hay datos de máquinas disponibles.
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {topMaquinas.map((maq, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                  background: alpha(theme.palette.background.paper, 0.6),
                                  minWidth: 140
                                }}
                              >
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                  #{maq.serial || maq.nuc || `Máq ${idx + 1}`}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                  {formatCurrencyCOP(maq.produccion || 0)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {maq.establecimiento || 'Sin sala'}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        );
                      })()}
                    </Paper>
                  </Box>
                )}
              </TabPanel>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="consolidado"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabPanel value={activeTab} index={1}>
          {processing && (!consolidatedData || consolidatedData.length === 0) ? (
            // Skeleton durante carga
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Skeleton variant="text" width={200} height={28} />
                  <Skeleton variant="text" width={120} height={20} />
                </Box>
                <Skeleton variant="rounded" width={100} height={24} />
              </Box>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                {[...Array(10)].map((_, i) => (
                  <Box
                    key={`skeleton-row-${i}`}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 1.5,
                      borderBottom: i < 9 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                    }}
                  >
                    <Skeleton variant="text" width="20%" />
                    <Skeleton variant="text" width="12%" />
                    <Skeleton variant="text" width="10%" />
                    <Skeleton variant="text" width="12%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="16%" />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Consolidado Detallado
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {Array.isArray(consolidatedData) ? `${consolidatedData.length} filas` : 'Sin datos'}
                </Typography>
              </Box>
              <Chip size="small" label="Virtualizado" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }} />
            </Box>

            <VirtualTable
              rows={consolidatedData}
              height={520}
              rowHeight={44}
              emptyLabel="Procesa un archivo para ver el consolidado."
              columns={[
                { key: 'establecimiento', label: 'Establecimiento', width: 240 },
                { key: 'serial', label: 'Serial', width: 140 },
                { key: 'nuc', label: 'NUC', width: 120 },
                { key: 'tipoApuesta', label: 'Tipo', width: 140 },
                { key: 'produccion', label: 'Producción', width: 140, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'derechosExplotacion', label: 'Derechos', width: 140, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'gastosAdministracion', label: 'Gastos', width: 140, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'totalImpuestos', label: 'Total', width: 140, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'diasTransmitidos', label: 'Días', width: 80, align: 'right' },
                { key: 'primerDia', label: 'Primer día', width: 120 },
                { key: 'ultimoDia', label: 'Último día', width: 120 },
                { key: 'novedad', label: 'Novedad', width: 220 },
                { key: 'tarifa', label: 'Tarifa', width: 200 }
              ]}
            />
          </Box>
          )}
        </TabPanel>
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="porSala"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabPanel value={activeTab} index={2}>
                {processing && (!reporteBySala || reporteBySala.length === 0) ? (
                  // Skeleton durante carga
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Skeleton variant="text" width={180} height={28} />
                  <Skeleton variant="text" width={140} height={20} />
                </Box>
                <Skeleton variant="rounded" width={100} height={24} />
              </Box>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                {[...Array(8)].map((_, i) => (
                  <Box
                    key={`skeleton-sala-${i}`}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 1.5,
                      borderBottom: i < 7 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                    }}
                  >
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="15%" />
                    <Skeleton variant="text" width="10%" />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Reporte por Sala
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {Array.isArray(reporteBySala) ? `${reporteBySala.length} establecimientos` : 'Sin datos'}
                </Typography>
              </Box>
              <Chip size="small" label="Virtualizado" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }} />
            </Box>

            <VirtualTable
              rows={reporteBySala}
              height={520}
              rowHeight={44}
              emptyLabel="Procesa un archivo para ver el reporte por sala."
              columns={[
                { key: 'establecimiento', label: 'Establecimiento', width: 280 },
                { key: 'totalMaquinas', label: 'Máquinas', width: 100, align: 'right' },
                { key: 'produccion', label: 'Producción', width: 160, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'derechosExplotacion', label: 'Derechos', width: 160, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'gastosAdministracion', label: 'Gastos', width: 160, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'totalImpuestos', label: 'Total', width: 160, align: 'right', format: (v) => formatCurrencyCOP(v) },
                { key: 'promedioEstablecimiento', label: 'Promedio/Maq.', width: 160, align: 'right', format: (v) => formatCurrencyCOP(v) }
              ]}
            />
          </Box>
          )}
        </TabPanel>
            </motion.div>
          )}

          {/* Tab Tarifa Fija */}
          {activeTab === 3 && tarifasOficiales && Object.keys(tarifasOficiales).length > 0 && (
            <motion.div
              key="tarifaFija"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabPanel value={activeTab} index={3}>
                {!Array.isArray(tarifaFijaData) || tarifaFijaData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                <Casino sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.4), mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.secondary, mb: 1 }}>
                  No hay máquinas con tarifa fija aplicada
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Las máquinas con tarifas oficiales aparecerán aquí
                </Typography>
              </Box>
            ) : (
              <>
                {/* Resumen de tarifa fija */}
                <Box sx={{ 
                  mb: 3, 
                  p: 3, 
                  background: alpha(theme.palette.secondary.main, 0.08),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                }}>
                  <Typography variant="overline" sx={{ 
                    fontWeight: 600, 
                    color: 'secondary.main',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem',
                    display: 'block',
                    mb: 1
                  }}>
                    Resumen Tarifa Fija
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Máquinas con Tarifa Fija
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                        {tarifaFijaResumen.count}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Total Derechos Fijos
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                        {formatCurrencyCompact(tarifaFijaResumen.totalDerechos)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Total Gastos Fijos
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                        {formatCurrencyCompact(tarifaFijaResumen.totalGastos)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        Total Impuestos
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {formatCurrencyCompact(tarifaFijaResumen.totalImpuestos)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Tabla de máquinas con tarifa fija */}
                <Box sx={{ height: 550, borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`, bgcolor: theme.palette.background.paper }}>
                  <VirtualTable
                    data={tarifaFijaData}
                    columns={[
                      { key: 'establecimiento', label: 'Establecimiento', width: 220 },
                      { key: 'serial', label: 'Serial', width: 120 },
                      { key: 'nuc', label: 'NUC', width: 100 },
                      { 
                        key: 'derechosFijos', 
                        label: 'Derechos Fijos', 
                        width: 150, 
                        align: 'right',
                        format: (_, row) => {
                          const nucStr = String(row?.nuc || '').trim();
                          const derechos = nucStr && tarifasOficiales[nucStr] 
                            ? Number(tarifasOficiales[nucStr].derechosAdicionales) || 0 
                            : 0;
                          return formatCurrencyCOP(derechos);
                        }
                      },
                      { 
                        key: 'gastosFijos', 
                        label: 'Gastos Fijos', 
                        width: 150, 
                        align: 'right',
                        format: (_, row) => {
                          const nucStr = String(row?.nuc || '').trim();
                          const gastos = nucStr && tarifasOficiales[nucStr] 
                            ? Number(tarifasOficiales[nucStr].gastosAdicionales) || 0 
                            : 0;
                          return formatCurrencyCOP(gastos);
                        }
                      },
                      { 
                        key: 'totalFijo', 
                        label: 'Total Impuestos Fijos', 
                        width: 180, 
                        align: 'right',
                        format: (_, row) => {
                          const nucStr = String(row?.nuc || '').trim();
                          if (!nucStr || !tarifasOficiales[nucStr]) return formatCurrencyCOP(0);
                          const derechos = Number(tarifasOficiales[nucStr].derechosAdicionales) || 0;
                          const gastos = Number(tarifasOficiales[nucStr].gastosAdicionales) || 0;
                          return formatCurrencyCOP(derechos + gastos);
                        }
                      }
                    ]}
                  />
                </Box>
              </>
            )}
          </TabPanel>
            </motion.div>
          )}
        </AnimatePresence>

      </Paper>

      <Fab
        color="primary"
        onClick={() => setLogsOpen((v) => !v)}
        sx={{
          position: 'fixed',
          left: 24,
          bottom: 24,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        }}
        aria-label="Registro de actividad"
      >
        <History />
      </Fab>

      <Box
        sx={{
          position: 'fixed',
          left: 24,
          bottom: 90,
          width: 420,
          maxWidth: 'calc(100vw - 48px)',
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          transform: logsOpen ? 'translateY(0)' : 'translateY(16px)',
          opacity: logsOpen ? 1 : 0,
          pointerEvents: logsOpen ? 'auto' : 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History sx={{ color: theme.palette.primary.main }} fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Registro de Actividad
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" aria-label="Limpiar logs" onClick={clearLogs} disabled={logs.length === 0}>
              <DeleteSweep fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Cerrar" onClick={() => setLogsOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            p: 1.5,
            maxHeight: 320,
            overflow: 'auto'
          }}
        >
          {logs.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, p: 0.5 }}>
              No hay actividades registradas.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {logs.map((l) => (
                <Box
                  key={l.id}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    bgcolor:
                      l.type === 'success'
                        ? alpha(theme.palette.success.main, 0.08)
                        : l.type === 'warning'
                          ? alpha(theme.palette.warning.main, 0.08)
                          : l.type === 'error'
                            ? alpha(theme.palette.error.main, 0.08)
                            : alpha(theme.palette.info.main, 0.06)
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Chip
                      size="small"
                      label={l.type.toUpperCase()}
                      sx={{
                        height: 20,
                        fontWeight: 800,
                        letterSpacing: 0.6,
                        bgcolor:
                          l.type === 'success'
                            ? alpha(theme.palette.success.main, 0.12)
                            : l.type === 'warning'
                              ? alpha(theme.palette.warning.main, 0.12)
                              : l.type === 'error'
                                ? alpha(theme.palette.error.main, 0.12)
                                : alpha(theme.palette.info.main, 0.12),
                        color:
                          l.type === 'success'
                            ? theme.palette.success.main
                            : l.type === 'warning'
                              ? theme.palette.warning.main
                              : l.type === 'error'
                                ? theme.palette.error.main
                                : theme.palette.info.main
                      }}
                    />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {l.timestamp instanceof Date ? l.timestamp.toLocaleTimeString('es-CO') : ''}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {l.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Modales de exportación (reutilizados tal cual) */}
      <ExportarPorSalaModal
        open={showSalaModal}
        onClose={() => setShowSalaModal(false)}
        reporteBySala={reporteBySala}
        consolidatedData={consolidatedData}
        empresa={empresa}
        addLog={addLog}
        addNotification={addNotification}
      />
      <ReporteDiarioModal
        open={showDailyModal}
        onClose={() => setShowDailyModal(false)}
        consolidatedData={consolidatedData}
        originalData={originalData}
        empresa={empresa}
        addLog={addLog}
        addNotification={addNotification}
      />

      <ConfirmarGuardadoModal
        open={showConfirmarGuardadoModal}
        onClose={() => setShowConfirmarGuardadoModal(false)}
        onConfirm={confirmarGuardadoLiquidacion}
        periodoDetectado={detectarPeriodoLiquidacion()}
        loading={guardandoLiquidacion}
      />
    </Container>
    </>
  );
}
