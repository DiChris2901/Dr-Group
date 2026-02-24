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
  Divider
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
  Stop
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
  formatPeriodoLabel
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

  // ===== ESTADOS DE UPLOAD HOUNDOC =====
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPeriodoMes, setUploadPeriodoMes] = useState('');
  const [uploadPeriodoAnio, setUploadPeriodoAnio] = useState(new Date().getFullYear().toString());
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
    if (!uploadFile || !uploadPreview || !uploadPeriodoMes || !uploadPeriodoAnio) {
      addNotification?.('Selecciona un archivo y especifica el periodo', 'warning');
      return;
    }

    const periodoStr = `${uploadPeriodoMes}_${uploadPeriodoAnio}`;

    setUploading(true);
    try {
      const empresaNorm = normalizeEmpresa(empresaSeleccionada);
      const resultado = await updateConHoundoc(
        empresaNorm,
        empresaSeleccionada,
        uploadPreview.machines,
        periodoStr
      );

      if (resultado?.success || resultado?.data) {
        setData(resultado.data);
        addNotification?.(
          `Datos actualizados con Houndoc (${formatPeriodoLabel(periodoStr)}). ${uploadPreview.summary.enCero} máquinas en cero.`,
          'success'
        );
      }

      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadPeriodoMes('');
    } catch (err) {
      console.error('Error actualizando con Houndoc:', err);
      addNotification?.('Error al actualizar datos: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // ===== DATOS DERIVADOS =====
  const maquinas = data?.maquinas || [];
  const kpis = data?.kpis || null;
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
        case 'diasCalendario': va = a.diasCalendario; vb = b.diasCalendario; break;
        case 'mesesConsecutivos': va = a.mesesConsecutivos; vb = b.mesesConsecutivos; break;
        case 'mesesEnCero': va = a.mesesEnCero; vb = b.mesesEnCero; break;
        case 'sala': return dir === 'asc' ? a.sala.localeCompare(b.sala) : b.sala.localeCompare(a.sala);
        case 'serial': return dir === 'asc' ? (a.serial || '').localeCompare(b.serial || '') : (b.serial || '').localeCompare(a.serial || '');
        default: va = a.diasCalendario; vb = b.diasCalendario;
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
        fontSize: 12,
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.12) }
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
            sx={{ borderRadius: 1, px: 4 }}
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
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <UploadFile sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" fontWeight={600}>
          Actualizar con Archivo Houndoc
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sube un archivo Excel/CSV descargado de Houndoc con la misma estructura de las liquidaciones.
          Se procesará y actualizará el análisis de máquinas en cero.
        </Typography>

        {/* Period selector */}
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Periodo del archivo:
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={7}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select
                value={uploadPeriodoMes}
                label="Mes"
                onChange={(e) => setUploadPeriodoMes(e.target.value)}
              >
                {MESES.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={5}>
            <TextField
              fullWidth
              size="small"
              label="Año"
              type="number"
              value={uploadPeriodoAnio}
              onChange={(e) => setUploadPeriodoAnio(e.target.value)}
              inputProps={{ min: 2020, max: 2040 }}
            />
          </Grid>
        </Grid>

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
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => { setUploadModalOpen(false); setUploadFile(null); setUploadPreview(null); }}
          disabled={uploading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirmUpload}
          disabled={!uploadFile || !uploadPreview || !uploadPeriodoMes || !uploadPeriodoAnio || uploading}
          startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
          sx={{ borderRadius: 1 }}
        >
          {uploading ? 'Procesando...' : 'Actualizar Datos'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ===== RENDER: NO ZERO MACHINES =====
  if (!kpis || maquinas.length === 0) {
    return (
      <Box>
        <InfoBar data={data} theme={theme} onUpload={() => setUploadModalOpen(true)} onRecalcular={handleMigrar} migrando={migrando} />
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
      <InfoBar data={data} theme={theme} onUpload={() => setUploadModalOpen(true)} onRecalcular={handleMigrar} migrando={migrando} />

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
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
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
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
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
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 160 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
                  Mayor Tiempo en Cero
                </Typography>
                {kpis.peorMaquina && (
                  <>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1, mb: 0.5 }}>
                      {kpis.peorMaquina.diasCalendario}d
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {kpis.peorMaquina.serial !== 'N/A' ? kpis.peorMaquina.serial : kpis.peorMaquina.nuc}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                      {kpis.peorMaquina.sala}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Severity breakdown */}
      <Alert
        severity={kpis.criticas > 0 ? 'error' : kpis.alertas > 0 ? 'warning' : 'info'}
        sx={{ mb: 3, borderRadius: 1 }}
        icon={kpis.criticas > 0 ? <ErrorIcon /> : kpis.alertas > 0 ? <Warning /> : <Info />}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={500}>
            Distribución:
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
      </Alert>

      {/* FILTROS Y BÚSQUEDA */}
      <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
                sx={{ height: 40, borderRadius: 1, fontSize: 13 }}
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
        <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.error.main, 0.08) }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12, width: 32 }} />
                        <TableCell sx={{ fontWeight: 600, fontSize: 12, width: 40 }}>#</TableCell>
                        <SortableHeader campo="serial" label="Serial" />
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>NUC</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Tipo</TableCell>
                        <SortableHeader campo="sala" label="Sala" />
                        <SortableHeader campo="mesesEnCero" label="Meses en Cero" align="right" />
                        <SortableHeader campo="mesesConsecutivos" label="Meses Consec." align="right" />
                        <SortableHeader campo="diasCalendario" label="Días Calendario" align="right" />
                        <MuiTooltip title="Severidad según días en cero: Crítico (>90d), Alerta (30-90d), Reciente (<30d)" arrow enterDelay={300} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260 } } }}>
                          <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, cursor: 'help' }}>Nivel</TableCell>
                        </MuiTooltip>
                        <MuiTooltip title="'En Cero' = sin ingresos en el último periodo. 'Recuperada' = volvió a generar ingresos." arrow enterDelay={300} slotProps={{ tooltip: { sx: { fontSize: 12, maxWidth: 260 } } }}>
                          <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12, cursor: 'help' }}>Estado</TableCell>
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
                                    : idx % 2 === 0 ? alpha(theme.palette.error.main, 0.02) : 'transparent',
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
                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>{m.mesesEnCero}</TableCell>
                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: theme.palette.warning.main }}>
                                  {m.mesesConsecutivos}
                                </TableCell>
                                <TableCell align="right" sx={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: m.nivel === 'critico' ? theme.palette.error.main
                                    : m.nivel === 'alerta' ? theme.palette.warning.main
                                      : theme.palette.info.main
                                }}>
                                  {m.diasCalendario}
                                </TableCell>
                                <TableCell align="center"><NivelChip nivel={m.nivel} /></TableCell>
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
                                        <Grid container spacing={2}>
                                          {/* Fecha inicio en cero */}
                                          <Grid item xs={12} sm={3}>
                                            <Box sx={{
                                              display: 'flex', alignItems: 'center', gap: 1,
                                              p: 1.5, borderRadius: 1,
                                              backgroundColor: alpha(theme.palette.error.main, 0.06),
                                              border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`
                                            }}>
                                              <Stop sx={{ fontSize: 20, color: theme.palette.error.main }} />
                                              <Box>
                                                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                                                  En cero desde
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                                                  {formatPeriodoLabel(m.primerCero)}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Grid>

                                          {/* Último periodo en cero */}
                                          <Grid item xs={12} sm={3}>
                                            <Box sx={{
                                              display: 'flex', alignItems: 'center', gap: 1,
                                              p: 1.5, borderRadius: 1,
                                              backgroundColor: alpha(theme.palette.warning.main, 0.06),
                                              border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                                            }}>
                                              <DateRange sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                                              <Box>
                                                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                                                  Último periodo en cero
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                                                  {formatPeriodoLabel(m.ultimoCero)}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Grid>

                                          {/* Estado actual / Recuperación */}
                                          <Grid item xs={12} sm={3}>
                                            <Box sx={{
                                              display: 'flex', alignItems: 'center', gap: 1,
                                              p: 1.5, borderRadius: 1,
                                              backgroundColor: m.esActualmenteEnCero
                                                ? alpha(theme.palette.error.main, 0.06)
                                                : alpha(theme.palette.success.main, 0.06),
                                              border: `1px solid ${alpha(
                                                m.esActualmenteEnCero ? theme.palette.error.main : theme.palette.success.main, 0.15
                                              )}`
                                            }}>
                                              {m.esActualmenteEnCero
                                                ? <Schedule sx={{ fontSize: 20, color: theme.palette.error.main }} />
                                                : <PlayArrow sx={{ fontSize: 20, color: theme.palette.success.main }} />
                                              }
                                              <Box>
                                                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                                                  {m.esActualmenteEnCero ? 'Estado actual' : 'Recuperada en'}
                                                </Typography>
                                                <Typography variant="body2" sx={{
                                                  fontWeight: 600,
                                                  color: m.esActualmenteEnCero ? theme.palette.error.main : theme.palette.success.main
                                                }}>
                                                  {m.esActualmenteEnCero
                                                    ? `Sigue en cero (${m.diasCalendario} días)`
                                                    : (() => {
                                                        // El periodo de recuperación es el primero después del último cero
                                                        const idxUltimoCero = (m.periodosTotales || []).indexOf(m.ultimoCero);
                                                        const periodoRecuperacion = idxUltimoCero >= 0 && idxUltimoCero < (m.periodosTotales || []).length - 1
                                                          ? m.periodosTotales[idxUltimoCero + 1]
                                                          : null;
                                                        return periodoRecuperacion ? formatPeriodoLabel(periodoRecuperacion) : 'Periodo siguiente';
                                                      })()
                                                  }
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Grid>

                                          {/* Duración total */}
                                          <Grid item xs={12} sm={3}>
                                            <Box sx={{
                                              display: 'flex', alignItems: 'center', gap: 1,
                                              p: 1.5, borderRadius: 1,
                                              backgroundColor: alpha(theme.palette.info.main, 0.06),
                                              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
                                            }}>
                                              <CalendarMonth sx={{ fontSize: 20, color: theme.palette.info.main }} />
                                              <Box>
                                                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                                                  Duración en cero
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                                                  {m.mesesEnCero} mes{m.mesesEnCero !== 1 ? 'es' : ''} ({m.diasCalendario} días)
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Grid>
                                        </Grid>

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
          <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
                            0.3
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
          <Card sx={{ borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', p: 2 }}>
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
const InfoBar = ({ data, theme, onUpload, onRecalcular, migrando }) => {
  const updatedAt = data?.ultimaActualizacion
    ? new Date(data.ultimaActualizacion.seconds * 1000).toLocaleString('es-CO')
    : 'N/A';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Box>
        <Typography variant="caption" color="text.disabled">
          Última actualización: {updatedAt}
          {' | '}
          Fuente: {data?.fuenteUltimaActualizacion || '—'}
          {' | '}
          {(data?.periodosRegistrados || []).length} periodos
          {data?.periodoMasReciente ? ` • ${formatPeriodoLabel(data.periodoMasReciente)} más reciente` : ''}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <MuiTooltip title="Actualizar con archivo Houndoc">
          <Button size="small" variant="outlined" startIcon={<CloudUpload />} onClick={onUpload}>
            Houndoc
          </Button>
        </MuiTooltip>
        <MuiTooltip title="Recalcular desde todas las liquidaciones">
          <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={onRecalcular} disabled={migrando}>
            {migrando ? 'Recalculando...' : 'Recalcular'}
          </Button>
        </MuiTooltip>
      </Box>
    </Box>
  );
};

export default MaquinasEnCeroStats;
