import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
  alpha,
  useTheme,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  LinearProgress,
  Skeleton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  Search as SearchIcon,
  Clear as ClearIcon,
  FileDownload,
  ExpandMore,
  ExpandLess,
  DoNotDisturbOn,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  CalendarMonth,
  CloudUpload,
  Refresh,
  Storage as StorageIcon,
  UploadFile,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Schedule,
  DateRange,
  PlayArrow,
  Stop,
  Save
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

import {
  getMaquinasEnCero,
  migrarEmpresa,
  updateConHoundoc,
  parseHoundocFile,
  normalizeEmpresa,
  formatPeriodoLabel,
  backfillFechasExactas,
  actualizarEpisodiosDesdeHoundoc,
  periodoToDate,
  periodoEndDate,
  periodoScore
} from '../../services/maquinasEnCeroService';

// ===== COMPONENTE: MÁQUINAS EN CERO — ANÁLISIS ESTADÍSTICO =====
// Lee datos pre-computados de la colección maquinas_en_cero/{empresa}
// Soporta upload de archivos Houndoc para actualización intermedia

const MESES = [
  { value: 'enero', label: 'Enero' },
  { value: 'febrero', label: 'Febrero' },
  { value: 'marzo', label: 'Marzo' },
  { value: 'abril', label: 'Abril' },
  { value: 'mayo', label: 'Mayo' },
  { value: 'junio', label: 'Junio' },
  { value: 'julio', label: 'Julio' },
  { value: 'agosto', label: 'Agosto' },
  { value: 'septiembre', label: 'Septiembre' },
  { value: 'octubre', label: 'Octubre' },
  { value: 'noviembre', label: 'Noviembre' },
  { value: 'diciembre', label: 'Diciembre' }
];

const MaquinasEnCeroStats = ({
  empresaSeleccionada = 'todas',
  addNotification
}) => {
  const theme = useTheme();

  // ===== ESTADOS DE DATA =====
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [migrando, setMigrando] = useState(false);
  const [migracionProgress, setMigracionProgress] = useState('');
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState('');

  // ===== ESTADOS DE UPLOAD HOUNDOC =====
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ===== ESTADOS DE FILTROS =====
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroSala, setFiltroSala] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [searchMaquina, setSearchMaquina] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedSalas, setExpandedSalas] = useState(new Set());
  const [expandedRow, setExpandedRow] = useState(null); // key de la máquina expandida
  const [ordenamiento, setOrdenamiento] = useState({ campo: 'diasCalendario', dir: 'desc' });

  // ===== CARGAR DATOS PRE-COMPUTADOS =====
  useEffect(() => {
    if (empresaSeleccionada === 'todas' || !empresaSeleccionada) {
      setData(null);
      setError(null);
      return;
    }

    const cargarDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        const empresaNorm = normalizeEmpresa(empresaSeleccionada);
        const resultado = await getMaquinasEnCero(empresaNorm);
        setData(resultado);
      } catch (err) {
        console.error('Error cargando maquinas_en_cero:', err);
        setError('Error al cargar datos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [empresaSeleccionada]);

  // ===== MIGRACIÓN INICIAL =====
  const handleMigrar = async () => {
    if (!empresaSeleccionada || empresaSeleccionada === 'todas') return;

    setMigrando(true);
    setMigracionProgress('Iniciando migración...');
    try {
      const empresaNorm = normalizeEmpresa(empresaSeleccionada);
      const resultado = await migrarEmpresa(empresaNorm, empresaSeleccionada, (progress) => {
        setMigracionProgress(progress.message);
      });

      if (resultado.success) {
        setData(resultado.data);
        addNotification?.(
          `Migración completa: ${resultado.maquinasEnCero} máquinas en cero en ${resultado.periodosRegistrados} periodos`,
          'success'
        );
      }
    } catch (err) {
      console.error('Error en migración:', err);
      addNotification?.('Error en migración: ' + err.message, 'error');
    } finally {
      setMigrando(false);
      setMigracionProgress('');
    }
  };

  // ===== BACKFILL FECHAS EXACTAS =====
  const handleBackfill = async () => {
    if (!empresaSeleccionada || empresaSeleccionada === 'todas') return;

    setBackfillRunning(true);
    setBackfillProgress('Iniciando extracción de fechas exactas...');
    try {
      const empresaNorm = normalizeEmpresa(empresaSeleccionada);
      const resultado = await backfillFechasExactas(
        empresaNorm,
        empresaSeleccionada,
        XLSX,
        (progress) => { setBackfillProgress(progress.message); }
      );

      if (resultado?.success) {
        // Recargar datos con episodios actualizados
        const datosActualizados = await getMaquinasEnCero(empresaNorm);
        setData(datosActualizados);
        addNotification?.(
          `Fechas exactas: ${resultado.conFechaExacta} máquinas con fecha exacta de ${resultado.totalMaquinas} total (${resultado.archivosProcessados} archivos procesados)`,
          'success'
        );
      } else {
        addNotification?.(`Backfill: ${resultado?.message || 'Error desconocido'}`, 'warning');
      }
    } catch (err) {
      console.error('Error en backfill:', err);
      addNotification?.('Error en backfill: ' + err.message, 'error');
    } finally {
      setBackfillRunning(false);
      setBackfillProgress('');
    }
  };

  // ===== UPLOAD HOUNDOC =====
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadPreview(null);

    try {
      const buffer = await file.arrayBuffer();
      const preview = parseHoundocFile(buffer, XLSX);
      setUploadPreview(preview);
    } catch (err) {
      console.error('Error parseando archivo:', err);
      addNotification?.('Error al leer el archivo: ' + err.message, 'error');
      setUploadFile(null);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!uploadFile || !uploadPreview) {
      addNotification?.('Selecciona un archivo válido', 'warning');
      return;
    }

    if (!uploadPreview.periodoDetectado) {
      addNotification?.(
        'No se pudo detectar el periodo del archivo. Verifica que contenga una columna de fecha o un título con el periodo.',
        'warning'
      );
      return;
    }

    const periodoStr = uploadPreview.periodoDetectado.periodoStr;

    setUploading(true);
    try {
      const empresaNorm = normalizeEmpresa(empresaSeleccionada);
      const resultado = await updateConHoundoc(
        empresaNorm,
        empresaSeleccionada,
        uploadPreview.machines,
        periodoStr
      );

      // 🆕 Actualizar fechas exactas de episodios desde el archivo Houndoc
      try {
        const buffer = await uploadFile.arrayBuffer();
        await actualizarEpisodiosDesdeHoundoc(empresaNorm, buffer, XLSX);
      } catch (episodioErr) {
        console.warn('⚠️ No se pudieron actualizar episodios desde Houndoc:', episodioErr.message);
      }

      if (resultado?.success || resultado?.data) {
        // Recargar datos actualizados (incluyendo episodios)
        const empresaNormReload = normalizeEmpresa(empresaSeleccionada);
        const datosActualizados = await getMaquinasEnCero(empresaNormReload);
        setData(datosActualizados || resultado.data);
        addNotification?.(
          `Datos actualizados con Houndoc (${formatPeriodoLabel(periodoStr)}). ${uploadPreview.summary.enCero} máquinas en cero.`,
          'success'
        );
      }

      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
    } catch (err) {
      console.error('Error actualizando con Houndoc:', err);
      addNotification?.('Error al actualizar datos: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // ===== DATOS DERIVADOS =====
  // Enriquecer máquinas: recalcular episodio en cliente desde los datos de periodos
  // que ya existen en cada máquina. Esto corrige cualquier dato de episodio 
  // almacenado en Firestore con el algoritmo anterior.
  const maquinas = useMemo(() => {
    const hoy = new Date();

    return (data?.maquinas || []).map(m => {
      // --- Calcular última racha consecutiva de periodos en cero ---
      const enCeroSet = new Set(m.periodosEnCero || []);
      const sorted = [...(m.periodosTotales || [])].sort((a, b) => periodoScore(a) - periodoScore(b));
      const idx = m.ultimoCero ? sorted.lastIndexOf(m.ultimoCero) : -1;

      // Sin datos suficientes → devolver original
      if (idx < 0 || !m.ultimoCero) return m;

      const streak = [m.ultimoCero];
      for (let i = idx - 1; i >= 0; i--) {
        if (enCeroSet.has(sorted[i])) streak.unshift(sorted[i]);
        else break;
      }

      const streakStartDate = periodoToDate(streak[0]);
      const streakEndDate = periodoEndDate(streak[streak.length - 1]);
      const sigueEnCero = m.esActualmenteEnCero;

      // --- Calcular días y fechas correctas ---
      const ep = m.ultimoEpisodio || {};
      let diasCalc, fechaInicio, fechaFin;

      if (sigueEnCero) {
        // Aún en cero: si tiene fecha exacta de última producción, usar esa
        if (ep.ultimaFechaConProduccion && ep.fuenteFecha === 'exacta') {
          const nextDay = new Date(ep.ultimaFechaConProduccion + 'T12:00:00');
          nextDay.setDate(nextDay.getDate() + 1);
          fechaInicio = nextDay.toISOString().split('T')[0];
          diasCalc = Math.max(0, Math.round((hoy - nextDay) / 86400000));
        } else {
          fechaInicio = streakStartDate ? streakStartDate.toISOString().split('T')[0] : null;
          diasCalc = streakStartDate ? Math.max(0, Math.round((hoy - streakStartDate) / 86400000)) : (m.diasCalendario || 0);
        }
        fechaFin = null;
      } else {
        // Recuperada: duración real de la racha
        fechaInicio = streakStartDate ? streakStartDate.toISOString().split('T')[0] : null;
        fechaFin = streakEndDate ? streakEndDate.toISOString().split('T')[0] : null;
        diasCalc = (streakStartDate && streakEndDate)
          ? Math.max(0, Math.round((streakEndDate - streakStartDate) / 86400000))
          : 0;
      }

      const nuevoNivel = diasCalc >= 180 ? 'critico' : diasCalc >= 60 ? 'alerta' : 'reciente';

      // Para recuperadas: encontrar el periodo de recuperación (mes siguiente al último cero)
      let periodoRecuperacion = null;
      if (!sigueEnCero) {
        const idxEnd = sorted.indexOf(streak[streak.length - 1]);
        if (idxEnd >= 0 && idxEnd < sorted.length - 1) {
          periodoRecuperacion = sorted[idxEnd + 1];
        }
      }

      // Construir episodio corregido: preservar datos exactos de Houndoc,
      // pero sobreescribir fechas/días con cálculo correcto de racha
      const episodioCorregido = {
        ...ep,
        fechaInicioCero: fechaInicio,
        fechaFin: fechaFin,
        diasInactividad: diasCalc,
        periodoOrigen: streak[0],
        periodoRecuperacion: periodoRecuperacion,
        // Solo marcar como 'exacta' si sigue en cero Y tenía dato exacto de Houndoc
        fuenteFecha: (sigueEnCero && ep.fuenteFecha === 'exacta') ? 'exacta' : 'periodo',
      };

      return {
        ...m,
        diasCalendario: diasCalc,
        esActualmenteEnCero: sigueEnCero,
        nivel: nuevoNivel,
        ultimoEpisodio: episodioCorregido,
      };
    });
  }, [data?.maquinas]);
  const kpis = data?.kpis || null;
  // Derivar peorMaquina desde las máquinas enriquecidas (con episodio si existe)
  const peorMaquinaReal = useMemo(() => {
    if (maquinas.length === 0) return null;
    return maquinas.reduce((peor, m) => {
      if (!peor || m.diasCalendario > peor.diasCalendario) return m;
      return peor;
    }, null);
  }, [maquinas]);
  const salasResumen = data?.resumenPorSala || [];
  const tendencia = data?.tendencia || [];

  // ===== FILTRADO Y ORDENAMIENTO =====
  const maquinasFiltradas = useMemo(() => {
    let resultado = [...maquinas];

    if (filtroNivel !== 'todos') {
      resultado = resultado.filter(m => m.nivel === filtroNivel);
    }
    if (filtroSala !== 'todas') {
      resultado = resultado.filter(m => m.sala === filtroSala);
    }
    if (filtroEstado === 'activo') {
      resultado = resultado.filter(m => m.esActualmenteEnCero);
    } else if (filtroEstado === 'recuperada') {
      resultado = resultado.filter(m => !m.esActualmenteEnCero);
    }
    if (searchMaquina.trim()) {
      const searchLower = searchMaquina.toLowerCase().trim();
      resultado = resultado.filter(m =>
        m.serial?.toLowerCase().includes(searchLower) ||
        m.nuc?.toLowerCase().includes(searchLower) ||
        m.sala?.toLowerCase().includes(searchLower)
      );
    }

    resultado.sort((a, b) => {
      const { campo, dir } = ordenamiento;
      let va, vb;
      switch (campo) {
        case 'diasCalendario': va = a.esActualmenteEnCero ? a.diasCalendario : 0; vb = b.esActualmenteEnCero ? b.diasCalendario : 0; break;
        case 'mesesConsecutivos': va = a.esActualmenteEnCero ? a.mesesConsecutivos : 0; vb = b.esActualmenteEnCero ? b.mesesConsecutivos : 0; break;
        case 'mesesEnCero': va = a.esActualmenteEnCero ? a.mesesEnCero : 0; vb = b.esActualmenteEnCero ? b.mesesEnCero : 0; break;
        case 'sala': return dir === 'asc' ? a.sala.localeCompare(b.sala) : b.sala.localeCompare(a.sala);
        case 'serial': return dir === 'asc' ? (a.serial || '').localeCompare(b.serial || '') : (b.serial || '').localeCompare(a.serial || '');
        default: va = a.esActualmenteEnCero ? a.diasCalendario : 0; vb = b.esActualmenteEnCero ? b.diasCalendario : 0;
      }
      return dir === 'asc' ? va - vb : vb - va;
    });

    return resultado;
  }, [maquinas, filtroNivel, filtroSala, filtroEstado, searchMaquina, ordenamiento]);

  const salasUnicas = useMemo(() => {
    const salas = new Set(maquinas.map(m => m.sala));
    return Array.from(salas).sort();
  }, [maquinas]);

  // ===== HANDLERS =====
  const handleSort = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      dir: prev.campo === campo && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleSala = (sala) => {
    setExpandedSalas(prev => {
      const next = new Set(prev);
      if (next.has(sala)) next.delete(sala);
      else next.add(sala);
      return next;
    });
  };

  // Reset filters when empresa changes
  useEffect(() => {
    setFiltroNivel('todos');
    setFiltroSala('todas');
    setFiltroEstado('todos');
    setSearchMaquina('');
    setPage(0);
    setExpandedSalas(new Set());
  }, [empresaSeleccionada]);

  // ===== SUB-COMPONENTS =====
  const SortableHeader = ({ campo, label, align = 'left' }) => (
    <TableCell
      align={align}
      sx={{
        fontWeight: 600,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'text.secondary',
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
      }}
      onClick={() => handleSort(campo)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', gap: 0.5 }}>
        {label}
        {ordenamiento.campo === campo && (
          <Typography variant="caption" sx={{ fontSize: 10 }}>
            {ordenamiento.dir === 'asc' ? '▲' : '▼'}
          </Typography>
        )}
      </Box>
    </TableCell>
  );

  const nivelTooltips = {
    critico: 'Más de 90 días calendario sin generar ingresos. Requiere atención urgente: evaluar retiro, reubicación o mantenimiento mayor.',
    alerta: 'Entre 30 y 90 días calendario en cero. Monitorear de cerca: puede necesitar mantenimiento o reubicación.',
    reciente: 'Menos de 30 días en cero. Podría ser temporal (mantenimiento programado, baja estacional). Seguimiento normal.'
  };

  const NivelChip = ({ nivel }) => {
    const config = {
      critico: { label: 'Crítico', color: 'error', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
      alerta: { label: 'Alerta', color: 'warning', icon: <Warning sx={{ fontSize: 14 }} /> },
      reciente: { label: 'Reciente', color: 'info', icon: <Info sx={{ fontSize: 14 }} /> }
    };
    const c = config[nivel] || config.reciente;
    return (
      <MuiTooltip
        title={nivelTooltips[nivel] || ''}
        arrow
        placement="top"
        enterDelay={200}
        slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 280, lineHeight: 1.5 } } }}
      >
        <Chip
          size="small"
          label={c.label}
          color={c.color}
          icon={c.icon}
          sx={{ fontSize: 11, fontWeight: 600, height: 24, cursor: 'help' }}
        />
      </MuiTooltip>
    );
  };

  // ===== EXPORTAR EXCEL =====
  const handleExportarExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DR Group Dashboard';
      workbook.created = new Date();

      const BRAND_COLORS = {
        primary: '2563EB',
        secondary: '7C3AED',
        success: '16A34A',
        warning: 'D97706',
        error: 'DC2626',
        headerBg: '1E293B',
        headerText: 'FFFFFF',
        altRow: 'F8FAFC',
        border: 'E2E8F0'
      };

      // Sheet 1: Ranking
      const ws = workbook.addWorksheet('Máquinas en Cero', {
        views: [{ state: 'frozen', ySplit: 7 }]
      });

      ws.mergeCells('A1:J1');
      ws.getCell('A1').value = 'DR GROUP - REPORTE DE MÁQUINAS EN CERO';
      ws.getCell('A1').font = { size: 16, bold: true, color: { argb: BRAND_COLORS.headerText } };
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } };
      ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 36;

      ws.mergeCells('A2:J2');
      ws.getCell('A2').value = `Empresa: ${empresaSeleccionada} | Periodos: ${(data?.periodosRegistrados || []).length} meses de histórico | Datos completos`;
      ws.getCell('A2').font = { size: 11, color: { argb: BRAND_COLORS.headerText } };
      ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.secondary } };
      ws.getCell('A2').alignment = { horizontal: 'center' };

      ws.mergeCells('A3:J3');
      const updatedAt = data?.ultimaActualizacion
        ? new Date(data.ultimaActualizacion.seconds * 1000).toLocaleString('es-CO')
        : 'N/A';
      ws.getCell('A3').value = `Generado: ${new Date().toLocaleString('es-CO')} | Última actualización: ${updatedAt}`;
      ws.getCell('A3').font = { size: 10, italic: true };
      ws.getCell('A3').alignment = { horizontal: 'center' };

      ws.mergeCells('A4:J4');
      ws.getCell('A4').value = kpis
        ? `Total en Cero: ${kpis.totalEnCero} | Activas: ${kpis.activasEnCero} | Días Promedio: ${kpis.diasPromedio} | % Flota: ${kpis.porcentajeEnCero}%`
        : 'Sin datos';
      ws.getCell('A4').font = { size: 10, bold: true };
      ws.getCell('A4').alignment = { horizontal: 'center' };

      ws.getRow(5).height = 8;
      ws.getRow(6).height = 8;

      const headers = ['#', 'Serial', 'NUC', 'Tipo', 'Sala', 'Meses en Cero', 'Meses Consecutivos', 'Días Calendario', 'Nivel', 'Estado'];
      const headerRow = ws.getRow(7);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 11, color: { argb: BRAND_COLORS.headerText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerBg } };
        cell.alignment = { horizontal: i >= 5 ? 'center' : 'left', vertical: 'middle' };
        cell.border = { bottom: { style: 'thin', color: { argb: BRAND_COLORS.border } } };
      });
      headerRow.height = 28;

      maquinasFiltradas.forEach((m, idx) => {
        const row = ws.getRow(8 + idx);
        row.getCell(1).value = idx + 1;
        row.getCell(2).value = m.serial;
        row.getCell(3).value = m.nuc;
        row.getCell(4).value = m.tipoApuesta;
        row.getCell(5).value = m.sala;
        row.getCell(6).value = m.mesesEnCero;
        row.getCell(7).value = m.mesesConsecutivos;
        row.getCell(8).value = m.diasCalendario;
        row.getCell(9).value = m.nivel === 'critico' ? 'Crítico' : m.nivel === 'alerta' ? 'Alerta' : 'Reciente';
        row.getCell(10).value = m.esActualmenteEnCero ? 'En Cero' : 'Recuperada';

        if (idx % 2 === 0) {
          for (let c = 1; c <= 10; c++) {
            row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.altRow } };
          }
        }
        for (let c = 6; c <= 8; c++) {
          row.getCell(c).alignment = { horizontal: 'center' };
        }
      });

      ws.columns = [
        { width: 6 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 28 },
        { width: 16 }, { width: 20 }, { width: 18 }, { width: 14 }, { width: 16 }
      ];

      // Sheet 2: Resumen por Sala
      const ws2 = workbook.addWorksheet('Resumen por Sala');
      ws2.mergeCells('A1:G1');
      ws2.getCell('A1').value = 'RESUMEN POR SALA — MÁQUINAS EN CERO';
      ws2.getCell('A1').font = { size: 14, bold: true, color: { argb: BRAND_COLORS.headerText } };
      ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } };
      ws2.getCell('A1').alignment = { horizontal: 'center' };
      ws2.getRow(1).height = 32;

      const headers2 = ['Sala', 'Total en Cero', 'Críticas', 'Alertas', 'Recientes', 'Activas', 'Flota Total'];
      const headerRow2 = ws2.getRow(3);
      headers2.forEach((h, i) => {
        const cell = headerRow2.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 11, color: { argb: BRAND_COLORS.headerText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerBg } };
        cell.alignment = { horizontal: i >= 1 ? 'center' : 'left' };
      });

      salasResumen.forEach((s, idx) => {
        const row = ws2.getRow(4 + idx);
        row.getCell(1).value = s.sala;
        row.getCell(2).value = s.total;
        row.getCell(3).value = s.criticas;
        row.getCell(4).value = s.alertas;
        row.getCell(5).value = s.recientes;
        row.getCell(6).value = s.activas;
        row.getCell(7).value = s.totalFlota || 'N/A';
        for (let c = 2; c <= 7; c++) row.getCell(c).alignment = { horizontal: 'center' };
      });

      ws2.columns = [
        { width: 30 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 14 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Maquinas_en_Cero_${empresaSeleccionada.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      addNotification?.('Reporte de máquinas en cero exportado exitosamente', 'success');
    } catch (err) {
      console.error('Error exportando Excel:', err);
      addNotification?.('Error al exportar reporte', 'error');
    }
  };

  // ===== RENDER: EMPTY STATE (todas las empresas) =====
  if (empresaSeleccionada === 'todas') {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 4, textAlign: 'center' }}>
        <DoNotDisturbOn sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Selecciona una empresa para ver el análisis de máquinas en cero
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          El análisis muestra todo el histórico completo de máquinas con producción = 0
        </Typography>
      </Card>
    );
  }

  // ===== RENDER: LOADING =====
  if (loading) {
    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  // ===== RENDER: ERROR =====
  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
        <Button size="small" sx={{ ml: 2 }} onClick={handleMigrar}>Reintentar</Button>
      </Alert>
    );
  }

  // ===== RENDER: NO DATA (necesita migración) =====
  if (!data) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 4, textAlign: 'center' }}>
        <StorageIcon sx={{ fontSize: 80, color: theme.palette.warning.main, mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay datos pre-computados para esta empresa
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
          Para ver el análisis completo de máquinas en cero, necesitas generar los datos iniciales.
          Esto leerá todo el histórico de liquidaciones y creará un resumen optimizado.
        </Typography>

        {migrando ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              {migracionProgress || 'Procesando...'}
            </Typography>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="large"
            startIcon={<Refresh />}
            onClick={handleMigrar}
            sx={{ borderRadius: 1, px: 4, textTransform: 'none', fontWeight: 600 }}
          >
            Generar Datos Iniciales
          </Button>
        )}
      </Card>
    );
  }

  // ===== RENDER: MODAL DE UPLOAD HOUNDOC =====
  const renderUploadModal = () => (
    <Dialog
      open={uploadModalOpen}
      onClose={() => { if (!uploading) setUploadModalOpen(false); }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      <DialogTitle sx={{
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <UploadFile />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
              Actualizar con Houndoc
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Sube un archivo Excel/CSV de liquidaciones
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sube el archivo de liquidaciones descargado de Houndoc. El periodo se detecta automáticamente
          de la última fecha registrada en el archivo.
        </Typography>

        {/* File picker */}
        <Button
          variant="outlined"
          fullWidth
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ mb: 2, borderRadius: 1, borderStyle: 'dashed', py: 2 }}
          disabled={uploading}
        >
          {uploadFile ? uploadFile.name : 'Seleccionar archivo Excel/CSV'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Periodo auto-detectado */}
        {uploadPreview?.periodoDetectado && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, mb: 2,
            p: 1.5, borderRadius: 1,
            backgroundColor: alpha(theme.palette.success.main, 0.08),
            border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`
          }}>
            <DateRange sx={{ fontSize: 20, color: theme.palette.success.main }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>
                Periodo detectado automáticamente
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {uploadPreview.periodoDetectado.label}
              </Typography>
              {uploadPreview.periodoDetectado.fechaISO && (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                  Última fecha en el archivo: {new Date(uploadPreview.periodoDetectado.fechaISO + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {uploadPreview && !uploadPreview.periodoDetectado && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 1 }}>
            No se detectó fecha en el archivo. Verifica que tenga columna &quot;Fecha&quot; o un título con el periodo.
          </Alert>
        )}

        {/* Preview */}
        {uploadPreview && (
          <Alert severity="info" sx={{ borderRadius: 1 }} icon={<Info />}>
            <Typography variant="subtitle2" fontWeight={600}>
              Vista previa del archivo:
            </Typography>
            <Typography variant="body2">
              Total máquinas: {uploadPreview.summary.totalMaquinas}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
              En cero: {uploadPreview.summary.enCero}
            </Typography>
            <Typography variant="body2">
              Con producción: {uploadPreview.summary.conProduccion}
            </Typography>
            <Typography variant="body2">
              Salas detectadas: {uploadPreview.summary.salasDetectadas}
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Datos actualizados en tiempo real
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={() => { setUploadModalOpen(false); setUploadFile(null); setUploadPreview(null); }}
            disabled={uploading}
            variant="outlined"
            sx={{ borderRadius: 1, fontWeight: 500, textTransform: 'none', px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmUpload}
            disabled={!uploadFile || !uploadPreview || !uploadPreview?.periodoDetectado || uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Save />}
            sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', px: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            {uploading ? 'Procesando...' : 'Guardar'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );

  // ===== RENDER: NO ZERO MACHINES =====
  if (!kpis || maquinas.length === 0) {
    return (
      <Box>
        <InfoBar data={data} theme={theme} onUpload={() => setUploadModalOpen(true)} onBackfill={handleBackfill} backfillRunning={backfillRunning} backfillProgress={backfillProgress} />
        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: theme.palette.success.main, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No se encontraron máquinas en cero
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Todas las máquinas tienen producción activa en los {(data?.periodosRegistrados || []).length} periodos analizados
          </Typography>
        </Card>
        {renderUploadModal()}
      </Box>
    );
  }

  // ===== RENDER: MAIN CONTENT =====
  return (
    <Box>
      {/* Info bar + action buttons */}
      <InfoBar data={data} theme={theme} onUpload={() => setUploadModalOpen(true)} onBackfill={handleBackfill} backfillRunning={backfillRunning} backfillProgress={backfillProgress} />

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total en Cero */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                  Máquinas en Cero
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ mt: 1, mb: 0.5, color: theme.palette.error.main }}>
                  {kpis.activasEnCero}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={`${kpis.totalEnCero} históricas`}
                    sx={{ backgroundColor: alpha(theme.palette.error.main, 0.1), fontSize: 11 }}
                  />
                  {kpis.trendCambioPct !== 0 && (
                    <Chip
                      size="small"
                      icon={kpis.trendCambioPct > 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                      label={`${kpis.trendCambioPct > 0 ? '+' : ''}${kpis.trendCambioPct.toFixed(0)}%`}
                      color={kpis.trendCambioPct > 0 ? 'error' : 'success'}
                      variant="outlined"
                      sx={{ fontSize: 11, height: 24 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Días Promedio */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                  Días Promedio en Cero
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ mt: 1, mb: 0.5, color: theme.palette.warning.main }}>
                  {kpis.diasPromedio}
                </Typography>
                <Chip
                  size="small"
                  icon={<CalendarMonth sx={{ fontSize: 14 }} />}
                  label="días calendario desde primer cero"
                  sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1), fontSize: 11 }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* % de la Flota */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                  % Flota en Cero
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ mt: 1, mb: 0.5, color: theme.palette.info.main }}>
                  {kpis.porcentajeEnCero}%
                </Typography>
                <Chip
                  size="small"
                  label={`${kpis.activasEnCero} de ${kpis.totalFlota} máquinas`}
                  sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), fontSize: 11 }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Peor Máquina */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                  Mayor Tiempo en Cero
                </Typography>
                {peorMaquinaReal && (
                  <>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>
                      {peorMaquinaReal.diasCalendario}d
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {peorMaquinaReal.serial !== 'N/A' ? peorMaquinaReal.serial : peorMaquinaReal.nuc}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                      {peorMaquinaReal.sala}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Severity breakdown - neutral bar */}
      <Box sx={{
        mb: 3, px: 2, py: 1.5, borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.grey[900], 0.6)
          : alpha(theme.palette.grey[50], 0.8)
      }}>
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          Distribución
        </Typography>
        <MuiTooltip title="Más de 90 días en cero. Requiere acción urgente: retiro, reubicación o mantenimiento mayor." arrow enterDelay={200} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260, lineHeight: 1.5 } } }}>
          <Chip size="small" label={`${kpis.criticas} Críticas (>90d)`} color="error" variant={kpis.criticas > 0 ? 'filled' : 'outlined'} sx={{ fontSize: 11, cursor: 'help' }} />
        </MuiTooltip>
        <MuiTooltip title="Entre 30 y 90 días en cero. Monitorear: puede necesitar mantenimiento o reubicación." arrow enterDelay={200} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260, lineHeight: 1.5 } } }}>
          <Chip size="small" label={`${kpis.alertas} Alertas (30-90d)`} color="warning" variant={kpis.alertas > 0 ? 'filled' : 'outlined'} sx={{ fontSize: 11, cursor: 'help' }} />
        </MuiTooltip>
        <MuiTooltip title="Menos de 30 días en cero. Podría ser temporal (mantenimiento, baja estacional). Seguimiento normal." arrow enterDelay={200} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260, lineHeight: 1.5 } } }}>
          <Chip size="small" label={`${kpis.recientes} Recientes (<30d)`} color="info" variant={kpis.recientes > 0 ? 'filled' : 'outlined'} sx={{ fontSize: 11, cursor: 'help' }} />
        </MuiTooltip>
      </Box>

      {/* FILTROS Y BÚSQUEDA */}
      <Card sx={{ mb: 3, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar por NUC, Serial o Sala..."
                value={searchMaquina}
                onChange={(e) => { setSearchMaquina(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchMaquina && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchMaquina(''); setPage(0); }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Nivel</InputLabel>
                <Select value={filtroNivel} label="Nivel" onChange={(e) => { setFiltroNivel(e.target.value); setPage(0); }}>
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="critico">Crítico (&gt;90d)</MenuItem>
                  <MenuItem value="alerta">Alerta (30-90d)</MenuItem>
                  <MenuItem value="reciente">Reciente (&lt;30d)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={filtroEstado} label="Estado" onChange={(e) => { setFiltroEstado(e.target.value); setPage(0); }}>
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="activo">Actualmente en Cero</MenuItem>
                  <MenuItem value="recuperada">Recuperadas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sala</InputLabel>
                <Select value={filtroSala} label="Sala" onChange={(e) => { setFiltroSala(e.target.value); setPage(0); }}>
                  <MenuItem value="todas">Todas las salas</MenuItem>
                  {salasUnicas.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                startIcon={<FileDownload />}
                fullWidth
                sx={{ height: 40, borderRadius: 1, fontSize: 13, textTransform: 'none', fontWeight: 600 }}
                onClick={handleExportarExcel}
              >
                Exportar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* TABLA PRINCIPAL */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
        <Card sx={{ mb: 3, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Ranking de Máquinas en Cero
              </Typography>
              <Chip
                size="small"
                label={`${maquinasFiltradas.length} máquina${maquinasFiltradas.length !== 1 ? 's' : ''}`}
                sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
              />
            </Box>

            {maquinasFiltradas.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 1 }}>
                No hay máquinas que coincidan con los filtros seleccionados.
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', width: 32 }} />
                        <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', width: 40 }}>#</TableCell>
                        <SortableHeader campo="serial" label="Serial" />
                        <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>NUC</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>Tipo</TableCell>
                        <SortableHeader campo="sala" label="Sala" />
                        <SortableHeader campo="mesesEnCero" label="Meses en Cero" align="right" />
                        <SortableHeader campo="mesesConsecutivos" label="Consec." align="right" />
                        <SortableHeader campo="diasCalendario" label="Días" align="right" />
                        <MuiTooltip title="Severidad según días en cero: Crítico (>90d), Alerta (30-90d), Reciente (<30d)" arrow enterDelay={300} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260 } } }}>
                          <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', cursor: 'help' }}>Nivel</TableCell>
                        </MuiTooltip>
                        <MuiTooltip title="'En Cero' = sin ingresos en el último periodo. 'Recuperada' = volvió a generar ingresos." arrow enterDelay={300} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260 } } }}>
                          <TableCell align="center" sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', cursor: 'help' }}>Estado</TableCell>
                        </MuiTooltip>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {maquinasFiltradas
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((m, idx) => {
                          const globalIdx = page * rowsPerPage + idx;
                          const isExpanded = expandedRow === m.key;
                          return (
                            <React.Fragment key={m.key}>
                              <TableRow
                                onClick={() => setExpandedRow(isExpanded ? null : m.key)}
                                sx={{
                                  backgroundColor: isExpanded
                                    ? alpha(theme.palette.primary.main, 0.06)
                                    : idx % 2 === 0 ? alpha(theme.palette.grey[500], 0.04) : 'transparent',
                                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                <TableCell sx={{ width: 32, p: 0, pl: 1 }}>
                                  {isExpanded
                                    ? <KeyboardArrowDown sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                                    : <KeyboardArrowRight sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  }
                                </TableCell>
                                <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{globalIdx + 1}</TableCell>
                                <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{m.serial}</TableCell>
                                <TableCell sx={{ fontSize: 12 }}>{m.nuc}</TableCell>
                                <TableCell sx={{ fontSize: 12 }}>{m.tipoApuesta}</TableCell>
                                <TableCell sx={{ fontSize: 12, color: theme.palette.primary.main, fontWeight: 500 }}>{m.sala}</TableCell>
                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>
                                  {m.esActualmenteEnCero ? m.mesesEnCero : <Typography sx={{ fontSize: 14, color: 'text.disabled', fontWeight: 400 }}>—</Typography>}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.warning.main }}>
                                  {m.mesesConsecutivos}
                                </TableCell>
                                <TableCell align="right">
                                  {m.esActualmenteEnCero ? (
                                    // En cero: días actuales sin producción (urgente)
                                    <Typography sx={{
                                      fontSize: 13, fontWeight: 700,
                                      color: m.nivel === 'critico' ? theme.palette.error.main
                                        : m.nivel === 'alerta' ? theme.palette.warning.main
                                        : theme.palette.info.main
                                    }}>
                                      {m.diasCalendario}
                                    </Typography>
                                  ) : (
                                    // Recuperada: no mostrar contador de días en la tabla
                                    // (la duración del episodio ya aparece en las cards expandidas)
                                    <Typography sx={{ fontSize: 14, color: 'text.disabled', fontWeight: 400 }}>—</Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {/* Badge de nivel solo para máquinas EN CERO — para recuperadas no tiene sentido mostrar urgencia */}
                                  {m.esActualmenteEnCero && <NivelChip nivel={m.nivel} />}
                                </TableCell>
                                <TableCell align="center">
                                  <MuiTooltip
                                    title={m.esActualmenteEnCero
                                      ? 'Esta máquina registró $0 en el último periodo de liquidación. Sigue sin generar ingresos.'
                                      : `Esta máquina volvió a generar ingresos en el último periodo. Estuvo ${m.mesesEnCero} mes${m.mesesEnCero !== 1 ? 'es' : ''} en cero antes de recuperarse.`
                                    }
                                    arrow
                                    placement="top"
                                    enterDelay={200}
                                    slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 280, lineHeight: 1.5 } } }}
                                  >
                                    <Chip
                                      size="small"
                                      label={m.esActualmenteEnCero ? 'En Cero' : 'Recuperada'}
                                      color={m.esActualmenteEnCero ? 'error' : 'success'}
                                      variant={m.esActualmenteEnCero ? 'filled' : 'outlined'}
                                      sx={{ fontSize: 11, height: 24, cursor: 'help' }}
                                    />
                                  </MuiTooltip>
                                </TableCell>
                              </TableRow>

                              {/* FILA EXPANDIBLE: Detalle de fechas */}
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={11} sx={{ py: 0, borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                                    <Collapse in={isExpanded} timeout={250}>
                                      <Box sx={{ py: 2, px: 2 }}>
                                        {/* Alerta de normativa si >= 30 días */}
                                        {m.esActualmenteEnCero && (() => {
                                          const ep = m.ultimoEpisodio;
                                          const diasReales = ep?.diasInactividad || m.diasCalendario;
                                          if (diasReales >= 30) {
                                            return (
                                              <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>
                                                <strong>⚠️ Riesgo de sanción:</strong> Esta máquina lleva {diasReales} días consecutivos sin producción.
                                                La normativa sanciona a partir de 30 días inactivos.
                                              </Alert>
                                            );
                                          }
                                          return null;
                                        })()}

                                        {m.esActualmenteEnCero ? (
                                          /* ===== MÁQUINA EN CERO: 4 cards de estado actual ===== */
                                          <Grid container spacing={2} alignItems="stretch">
                                            {/* C1: En cero desde */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.error.main, 0.06), border: `1px solid ${alpha(theme.palette.error.main, 0.4)}` }}>
                                                <Stop sx={{ fontSize: 20, color: theme.palette.error.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>En cero desde</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                                                    {m.ultimoEpisodio?.fechaInicioCero
                                                      ? new Date(m.ultimoEpisodio.fechaInicioCero + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                      : formatPeriodoLabel(m.primerCero)}
                                                  </Typography>
                                                  {m.ultimoEpisodio?.fuenteFecha === 'exacta' && (
                                                    <Chip size="small" label="Fecha exacta" sx={{ mt: 0.5, height: 16, fontSize: 9, fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main }} />
                                                  )}
                                                </Box>
                                              </Box>
                                            </Grid>
                                            {/* C2: Última producción (antes de caer a cero) */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.warning.main, 0.06), border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}` }}>
                                                <DateRange sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Última producción</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                                                    {(() => {
                                                      if (m.ultimoEpisodio?.ultimaFechaConProduccion) {
                                                        return new Date(m.ultimoEpisodio.ultimaFechaConProduccion + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
                                                      }
                                                      // Aproximar: mes anterior al primer periodo en cero
                                                      const primerCeroDate = periodoToDate(m.ultimoEpisodio?.periodoOrigen || m.primerCero);
                                                      if (primerCeroDate) {
                                                        const prevMonth = new Date(primerCeroDate.getFullYear(), primerCeroDate.getMonth() - 1, 1);
                                                        return prevMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
                                                      }
                                                      return 'Sin datos';
                                                    })()}
                                                  </Typography>
                                                  {!m.ultimoEpisodio?.ultimaFechaConProduccion && (periodoToDate(m.ultimoEpisodio?.periodoOrigen || m.primerCero)) && (
                                                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>Aprox. mes anterior al primer cero</Typography>
                                                  )}
                                                  {m.ultimoEpisodio?.produccionAntesDeCero > 0 && (
                                                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>${m.ultimoEpisodio.produccionAntesDeCero.toLocaleString('es-CO')}</Typography>
                                                  )}
                                                </Box>
                                              </Box>
                                            </Grid>
                                            {/* C3: Estado actual */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.error.main, 0.06), border: `1px solid ${alpha(theme.palette.error.main, 0.4)}` }}>
                                                <Schedule sx={{ fontSize: 20, color: theme.palette.error.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Estado actual</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>Sigue en cero</Typography>
                                                  <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>Último periodo: {formatPeriodoLabel(m.ultimoCero)}</Typography>
                                                </Box>
                                              </Box>
                                            </Grid>
                                            {/* C4: Días actualmente inactiva */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.error.main, 0.06), border: `1px solid ${alpha(theme.palette.error.main, 0.4)}` }}>
                                                <CalendarMonth sx={{ fontSize: 20, color: theme.palette.error.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Días inactiva</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 15, color: theme.palette.error.main }}>
                                                    {m.diasCalendario} días
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>{m.mesesEnCero} mes{m.mesesEnCero !== 1 ? 'es' : ''} en cero</Typography>
                                                </Box>
                                              </Box>
                                            </Grid>
                                          </Grid>
                                        ) : (
                                          /* ===== MÁQUINA RECUPERADA: narración cronológica del episodio ===== */
                                          <Grid container spacing={2} alignItems="stretch">
                                            {/* C1: Cuándo empezó el episodio */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.warning.main, 0.06), border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}` }}>
                                                <Stop sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Estuvo en cero desde</Typography>
                                                  {(() => {
                                                    const periodoOrigen = m.ultimoEpisodio?.periodoOrigen || m.primerCero;
                                                    const fechaInicio = periodoOrigen ? periodoToDate(periodoOrigen) : null;
                                                    return fechaInicio ? (
                                                      <>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                                          {fechaInicio.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>
                                                          {m.mesesEnCero} mes{m.mesesEnCero !== 1 ? 'es' : ''} en cero
                                                        </Typography>
                                                      </>
                                                    ) : (
                                                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>Sin datos</Typography>
                                                    );
                                                  })()}
                                                </Box>
                                              </Box>
                                            </Grid>
                                            {/* C2: Cuándo se recuperó */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.success.main, 0.06), border: `1px solid ${alpha(theme.palette.success.main, 0.4)}` }}>
                                                <PlayArrow sx={{ fontSize: 20, color: theme.palette.success.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Se recuperó en</Typography>
                                                  {(() => {
                                                    const periodoRec = m.ultimoEpisodio?.periodoRecuperacion;
                                                    const fechaRec = periodoRec ? periodoToDate(periodoRec) : null;
                                                    return fechaRec ? (
                                                      <>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                                          {fechaRec.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>
                                                          Primer periodo con producción
                                                        </Typography>
                                                      </>
                                                    ) : (
                                                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>Periodo siguiente</Typography>
                                                    );
                                                  })()}
                                                </Box>
                                              </Box>
                                            </Grid>
                                            {/* C3: Duración del episodio */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.4)}` }}>
                                                <CalendarMonth sx={{ fontSize: 20, color: theme.palette.info.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Duración del episodio</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 15, color: theme.palette.info.main }}>
                                                    {m.diasCalendario} días
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>Aprox. {m.mesesEnCero} mes{m.mesesEnCero !== 1 ? 'es' : ''}</Typography>
                                                </Box>
                                              </Box>
                                            </Grid>
                                            {/* C4: Producción más reciente registrada */}
                                            <Grid item xs={12} sm={3} sx={{ display: 'flex' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 1, width: '100%', backgroundColor: alpha(theme.palette.success.main, 0.06), border: `1px solid ${alpha(theme.palette.success.main, 0.4)}` }}>
                                                <DateRange sx={{ fontSize: 20, color: theme.palette.success.main }} />
                                                <Box>
                                                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>Última prod. registrada</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                                    {m.ultimoEpisodio?.ultimaFechaConProduccion
                                                      ? new Date(m.ultimoEpisodio.ultimaFechaConProduccion + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                      : 'Sin datos'}
                                                  </Typography>
                                                  {m.ultimoEpisodio?.produccionAntesDeCero > 0 && (
                                                    <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>${m.ultimoEpisodio.produccionAntesDeCero.toLocaleString('es-CO')}</Typography>
                                                  )}
                                                </Box>
                                              </Box>
                                            </Grid>
                                          </Grid>
                                        )}

                                        {/* Timeline de periodos en cero */}
                                        {Array.isArray(m.periodosEnCero) && m.periodosEnCero.length > 0 && (
                                          <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                              Periodos registrados en cero
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                              {m.periodosEnCero.map((p) => (
                                                <Chip
                                                  key={p}
                                                  size="small"
                                                  label={formatPeriodoLabel(p)}
                                                  sx={{
                                                    fontSize: 10,
                                                    height: 22,
                                                    fontWeight: 500,
                                                    backgroundColor: p === m.ultimoCero
                                                      ? alpha(theme.palette.error.main, 0.15)
                                                      : alpha(theme.palette.grey[500], 0.1),
                                                    color: p === m.ultimoCero ? theme.palette.error.main : 'text.secondary',
                                                    border: p === m.primerCero
                                                      ? `1px solid ${alpha(theme.palette.error.main, 0.4)}`
                                                      : 'none'
                                                  }}
                                                />
                                              ))}
                                            </Box>
                                          </Box>
                                        )}
                                      </Box>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={maquinasFiltradas.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Filas:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* RESUMEN POR SALA */}
      {salasResumen.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
          <Card sx={{ mb: 3, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Resumen por Sala
              </Typography>

              <Grid container spacing={2}>
                {salasResumen.map((sala) => {
                  const isExpanded = expandedSalas.has(sala.sala);
                  const porcentaje = sala.totalFlota ? ((sala.activas / sala.totalFlota) * 100).toFixed(1) : '—';

                  return (
                    <Grid item xs={12} sm={6} md={4} key={sala.sala}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderColor: alpha(
                            sala.criticas > 0 ? theme.palette.error.main
                              : sala.alertas > 0 ? theme.palette.warning.main
                                : theme.palette.info.main,
                            0.6
                          ),
                          transition: 'all 0.2s ease',
                          '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }
                        }}
                      >
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Box
                            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => toggleSala(sala.sala)}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                                {sala.sala}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {sala.activas} en cero de {sala.totalFlota || '?'} ({porcentaje}%)
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h5" fontWeight={700} color="error.main">
                                {sala.total}
                              </Typography>
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </Box>
                          </Box>

                          {sala.totalFlota > 0 && (
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (sala.activas / sala.totalFlota) * 100)}
                              sx={{
                                mt: 1.5,
                                height: 6,
                                borderRadius: 1,
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: sala.criticas > 0 ? theme.palette.error.main
                                    : sala.alertas > 0 ? theme.palette.warning.main
                                      : theme.palette.info.main,
                                  borderRadius: 1
                                }
                              }}
                            />
                          )}

                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip size="small" label={`${sala.criticas} críticas`} color="error" variant="outlined" sx={{ fontSize: 11 }} />
                              <Chip size="small" label={`${sala.alertas} alertas`} color="warning" variant="outlined" sx={{ fontSize: 11 }} />
                              <Chip size="small" label={`${sala.recientes} recientes`} color="info" variant="outlined" sx={{ fontSize: 11 }} />
                            </Box>
                          </Collapse>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* GRÁFICO DE TENDENCIA */}
      {tendencia.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
          <Card sx={{ borderRadius: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Tendencia de Máquinas en Cero por Período
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis
                  dataKey="periodoLabel"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                <Bar
                  dataKey="maquinasEnCero"
                  fill={theme.palette.error.main}
                  name="Máquinas en Cero"
                  radius={[8, 8, 0, 0]}
                  fillOpacity={0.8}
                />
                <Bar
                  dataKey="totalMaquinas"
                  fill={alpha(theme.palette.primary.main, 0.3)}
                  name="Total Máquinas"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* UPLOAD MODAL */}
      {renderUploadModal()}
    </Box>
  );
};

// ===== InfoBar sub-component =====
const InfoBar = ({ data, theme, onUpload, onBackfill, backfillRunning, backfillProgress }) => {
  const updatedAt = data?.ultimaActualizacion
    ? new Date(data.ultimaActualizacion.seconds * 1000).toLocaleString('es-CO')
    : 'N/A';

  const tieneEpisodios = (data?.maquinas || []).some(m => m.ultimoEpisodio);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="caption" color="text.disabled">
            Última actualización: {updatedAt}
            {' | '}
            Fuente: {data?.fuenteUltimaActualizacion || '—'}
            {' | '}
            {(data?.periodosRegistrados || []).length} periodos
            {data?.periodoMasReciente ? ` • ${formatPeriodoLabel(data.periodoMasReciente)} más reciente` : ''}
            {tieneEpisodios && (
              <Chip
                size="small"
                label="Fechas exactas ✓"
                sx={{ ml: 1, height: 18, fontSize: 10, fontWeight: 600,
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                  color: theme.palette.success.main
                }}
              />
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <MuiTooltip title="Actualizar con archivo Houndoc">
            <Button size="small" variant="outlined" startIcon={<CloudUpload />} onClick={onUpload}
              sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Houndoc
            </Button>
          </MuiTooltip>
          {!tieneEpisodios && (
            <MuiTooltip title="Extraer fechas exactas de inicio en cero desde los archivos históricos de liquidaciones">
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={backfillRunning ? <CircularProgress size={16} color="inherit" /> : <DateRange />}
                onClick={onBackfill}
                disabled={backfillRunning}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
              >
                {backfillRunning ? 'Procesando...' : 'Extraer fechas exactas'}
              </Button>
            </MuiTooltip>
          )}
        </Box>
      </Box>
      {backfillRunning && backfillProgress && (
        <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.06), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} color="warning" />
            <Typography variant="caption" sx={{ fontWeight: 500, color: theme.palette.warning.main }}>
              {backfillProgress}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MaquinasEnCeroStats;
