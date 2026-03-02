import { useState, useEffect, useMemo, useCallback } from 'react';
import PageSkeleton from '../components/common/PageSkeleton';
import {
  Box, Typography, Grid, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tab, Chip, IconButton,
  Alert, Tooltip, Collapse, Divider, CircularProgress, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, alpha, useTheme
} from '@mui/material';
import {
  Payments as PaymentsIcon,
  CalendarMonth as CalendarIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Calculate as CalculateIcon,
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  Description as ExcelIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import useNomina from '../hooks/useNomina';
import useConfigNomina from '../hooks/useConfigNomina';
import useCompanies from '../hooks/useCompanies';
import { useToast } from '../context/ToastContext';

// ===== CONSTANTES =====
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const YEARS = Array.from({ length: 7 }, (_, i) => 2024 + i);

// ===== HELPERS =====
const fmtCOP = (value) => {
  if (value == null || isNaN(value)) return '$0';
  return '$' + Math.round(value).toLocaleString('es-CO');
};

const formatNumber = (value) => {
  const num = String(value).replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseNum = (str) => parseInt(String(str).replace(/\./g, '').replace(/,/g, '')) || 0;


// Convertir número a letras (español colombiano)
const numeroALetras = (num) => {
  const n = Math.round(Math.abs(num));
  if (n === 0) return 'cero pesos m/cte';

  const u = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
  const d = ['', 'diez', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const c = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const grupo = (n) => {
    if (n === 0) return '';
    if (n === 100) return 'cien';
    let r = '';
    const ce = Math.floor(n / 100);
    const re = n % 100;
    if (ce > 0) r += c[ce] + ' ';
    if (re <= 20) { r += u[re]; }
    else if (re < 30) { r += 'veinti' + u[re - 20]; }
    else { r += d[Math.floor(re / 10)]; if (re % 10 > 0) r += ' y ' + u[re % 10]; }
    return r.trim();
  };

  const miles = (n) => {
    if (n === 0) return '';
    if (n < 1000) return grupo(n);
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    const mt = m === 1 ? 'mil' : grupo(m) + ' mil';
    return r === 0 ? mt : mt + ' ' + grupo(r);
  };

  if (n >= 1000000) {
    const mill = Math.floor(n / 1000000);
    const resto = n % 1000000;
    const mt = mill === 1 ? 'un millón' : miles(mill) + ' millones';
    return (mt + (resto ? ' ' + miles(resto) : '') + ' pesos m/cte').replace(/\s+/g, ' ').trim();
  }
  return (miles(n) + ' pesos m/cte').replace(/\s+/g, ' ').trim();
};

// ===== COMPONENTE PRINCIPAL =====
const NominaPage = ({ embedded = false }) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { companies } = useCompanies();
  const {
    nominas, empleados, loading, saving, error,
    config, setConfig, PORCENTAJES, DEFAULTS,
    generarLineas, crearNomina, actualizarNomina,
    cambiarEstado, verificarPeriodoExistente, obtenerNovedadesPeriodo,
    calcularLineaNomina
  } = useNomina();

  // === ESTADO ===
  const [activeTab, setActiveTab] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [tipoLiquidacion, setTipoLiquidacion] = useState('mensual');
  const [lineas, setLineas] = useState([]);
  const [datosEditables, setDatosEditables] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [nominaCargada, setNominaCargada] = useState(null);
  const [novedades, setNovedades] = useState([]);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  // Config anual desde Firestore — cargada por año seleccionado
  const { config: configNomina, loading: loadingConfig } = useConfigNomina(year);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });

  const periodo = `${year}-${String(month).padStart(2, '0')}`;
  const isEditable = !nominaCargada || nominaCargada.estado === 'borrador';

  // === CARGAR PERÍODO ===
  const loadPeriodo = useCallback(async () => {
    setLoadingPeriodo(true);
    try {
      const existente = await verificarPeriodoExistente(periodo, tipoLiquidacion);
      if (existente) {
        setNominaCargada(existente);
        setLineas(existente.lineas || []);
        const editables = {};
        (existente.lineas || []).forEach(l => {
          editables[l.empleadoId] = {
          diasTrabajados: l.diasTrabajados || 30,
          bonos: l.bonos || 0,
          bonoDescripcion: l.bonoDescripcion || '',
          pagosAdicionales: l.pagosAdicionales || []
        };
        });
        setDatosEditables(editables);
        if (existente.smmlv) {
          setConfig(prev => ({ ...prev, smmlv: existente.smmlv, auxTransporte: existente.auxTransporte }));
        }
      } else {
        setNominaCargada(null);
        setDatosEditables({});
        const newLineas = generarLineas(tipoLiquidacion, {});
        setLineas(newLineas);
      }
      const nov = await obtenerNovedadesPeriodo(periodo);
      setNovedades(nov);
    } catch (err) {
      console.error('Error cargando período:', err);
    } finally {
      setLoadingPeriodo(false);
    }
  }, [periodo, tipoLiquidacion, empleados, generarLineas, verificarPeriodoExistente, obtenerNovedadesPeriodo, setConfig]);

  useEffect(() => {
    if (!empleados.length || loading) return;
    loadPeriodo();
  }, [periodo, tipoLiquidacion, empleados.length, loading]);

  // === TOTALES ===
  const totales = useMemo(() => ({
    totalDevengado: lineas.reduce((s, l) => s + l.totalDevengado, 0),
    totalDeducciones: lineas.reduce((s, l) => s + l.totalDeducciones, 0),
    totalNeto: lineas.reduce((s, l) => s + l.netoAPagar, 0),
    totalProvEmpleador: lineas.reduce((s, l) => s + l.totalProvisionesEmpleador, 0),
    totalAnticipo: lineas.reduce((s, l) => s + (l.anticipo || 0), 0)
  }), [lineas]);

  // === KPIs CONSOLIDADO ===
  const kpis = useMemo(() => {
    const nominasYear = nominas.filter(n => n.periodo?.startsWith(String(year)));
    const pagadas = nominasYear.filter(n => n.estado === 'pagada');
    const mesPeriodo = nominasYear.filter(n => n.periodo === periodo);

    return {
      totalPagadoYTD: pagadas.reduce((s, n) => s + (n.totalNeto || 0), 0),
      totalMes: mesPeriodo.reduce((s, n) => s + (n.totalNeto || 0), 0),
      costoEmpleadorMes: mesPeriodo.reduce((s, n) => s + (n.totalDevengado || 0) + (n.totalProvisionesEmpleador || 0), 0),
      empleadosActivos: empleados.length,
      nominasDelYear: nominasYear
    };
  }, [nominas, year, periodo, empleados]);

  // === HANDLERS ===
  const handleDiasChange = (empId, value) => {
    const dias = Math.min(30, Math.max(0, parseInt(value) || 0));
    const newEd = { ...datosEditables, [empId]: { ...datosEditables[empId], diasTrabajados: dias } };
    setDatosEditables(newEd);
    recalcularLinea(empId, newEd[empId]);
  };

  const handleBonosChange = (empId, value) => {
    const bonos = parseNum(value);
    const newEd = { ...datosEditables, [empId]: { ...datosEditables[empId], bonos } };
    setDatosEditables(newEd);
    recalcularLinea(empId, newEd[empId]);
  };

  const handleBonoDescChange = (empId, value) => {
    setDatosEditables(prev => ({ ...prev, [empId]: { ...prev[empId], bonoDescripcion: value } }));
    setLineas(prev => prev.map(l => l.empleadoId === empId ? { ...l, bonoDescripcion: value } : l));
  };

  // === CONCEPTOS ADICIONALES (intereses cesantías, prima, vacaciones, etc.) ===
  const recalcularLineaConEd = (empId, updatedEd) => {
    const emp = empleados.find(e => e.id === empId);
    if (!emp) return;
    const tipoNom = tipoLiquidacion.startsWith('quincenal') ? 'quincenal' : 'mensual';
    const nueva = calcularLineaNomina(emp, updatedEd.diasTrabajados ?? 30, updatedEd.bonos ?? 0, updatedEd.bonoDescripcion ?? '', config.smmlv, config.auxTransporte, tipoNom, tipoLiquidacion === 'quincenal-1', updatedEd.pagosAdicionales ?? [], config.tasas);
    setLineas(prev => prev.map(l => l.empleadoId === empId ? nueva : l));
  };

  const handleAddConcepto = (empId, concepto = '', monto = 0) => {
    setDatosEditables(prev => {
      const old = prev[empId]?.pagosAdicionales || [];
      const updated = { ...prev, [empId]: { ...prev[empId], pagosAdicionales: [...old, { concepto, monto }] } };
      recalcularLineaConEd(empId, updated[empId]);
      return updated;
    });
  };

  const handleUpdateConcepto = (empId, idx, field, value) => {
    setDatosEditables(prev => {
      const old = [...(prev[empId]?.pagosAdicionales || [])];
      old[idx] = { ...old[idx], [field]: field === 'monto' ? (parseNum(value) || 0) : value };
      const updated = { ...prev, [empId]: { ...prev[empId], pagosAdicionales: old } };
      recalcularLineaConEd(empId, updated[empId]);
      return updated;
    });
  };

  const handleRemoveConcepto = (empId, idx) => {
    setDatosEditables(prev => {
      const old = [...(prev[empId]?.pagosAdicionales || [])];
      old.splice(idx, 1);
      const updated = { ...prev, [empId]: { ...prev[empId], pagosAdicionales: old } };
      recalcularLineaConEd(empId, updated[empId]);
      return updated;
    });
  };

  const recalcularLinea = (empId, editable) => {
    const emp = empleados.find(e => e.id === empId);
    if (!emp) return;
    const tipoNom = tipoLiquidacion.startsWith('quincenal') ? 'quincenal' : 'mensual';
    const nueva = calcularLineaNomina(emp, editable.diasTrabajados ?? 30, editable.bonos ?? 0, editable.bonoDescripcion ?? '', config.smmlv, config.auxTransporte, tipoNom, tipoLiquidacion === 'quincenal-1', editable.pagosAdicionales ?? [], config.tasas);
    setLineas(prev => prev.map(l => l.empleadoId === empId ? nueva : l));
  };

  const recalcularTodo = useCallback(() => {
    const newLineas = generarLineas(tipoLiquidacion, datosEditables);
    setLineas(newLineas);
  }, [generarLineas, tipoLiquidacion, datosEditables]);

  // Sincronizar config desde Firestore cuando cambia el año (solo si no hay nómina cargada)
  useEffect(() => {
    if (!loadingConfig && !nominaCargada) {
      setConfig({ smmlv: configNomina.smmlv, auxTransporte: configNomina.auxTransporte, tasas: configNomina.tasas || null });
    }
  }, [configNomina, loadingConfig, nominaCargada, setConfig]);

  const handleGuardar = async () => {
    try {
      if (nominaCargada) {
        await actualizarNomina(nominaCargada.id, lineas);
        showToast('Nómina actualizada exitosamente', 'success');
      } else {
        await crearNomina(periodo, tipoLiquidacion, lineas);
        showToast('Borrador de nómina guardado', 'success');
      }
      await loadPeriodo();
    } catch (err) {
      showToast('Error al guardar: ' + err.message, 'error');
    }
  };

  const handleProcesar = () => {
    setConfirmDialog({
      open: true,
      title: 'Procesar Nómina',
      message: `¿Procesar la nómina de ${MESES[month - 1]} ${year}? Una vez procesada, no podrá editar los valores.`,
      action: async () => {
        try {
          if (!nominaCargada) {
            const id = await crearNomina(periodo, tipoLiquidacion, lineas);
            await cambiarEstado(id, 'procesada');
          } else {
            await actualizarNomina(nominaCargada.id, lineas);
            await cambiarEstado(nominaCargada.id, 'procesada');
          }
          showToast('Nómina procesada exitosamente', 'success');
          await loadPeriodo();
        } catch (err) {
          showToast('Error al procesar: ' + err.message, 'error');
        }
      }
    });
  };

  const handleMarcarPagada = () => {
    setConfirmDialog({
      open: true,
      title: 'Marcar como Pagada',
      message: `¿Confirma que la nómina de ${MESES[month - 1]} ${year} ha sido pagada?`,
      action: async () => {
        try {
          await cambiarEstado(nominaCargada.id, 'pagada');
          showToast('Nómina marcada como pagada', 'success');
          await loadPeriodo();
        } catch (err) {
          showToast('Error: ' + err.message, 'error');
        }
      }
    });
  };

  const toggleExpanded = (empId) => setExpandedRows(prev => ({ ...prev, [empId]: !prev[empId] }));

  // === EXPORTAR EXCEL ===
  const handleExportExcel = async () => {
    try {
      const ExcelJSMod = await import('exceljs');
      const ExcelJS = ExcelJSMod.default || ExcelJSMod;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Organización RDJ';
      wb.created = new Date();

      // ─── PALETA CORPORATIVA ──────────────────────────────────────────────────
      const BC = {
        titleBg:    'FF0B3040',
        subtitleBg: 'FF1A5F7A',
        metricsBg:  'FF334155',
        dateBg:     'FF475569',
        headerBg:   'FF0B3040',
        totalsBg:   'FF1A5F7A',
        white:      'FFFFFFFF',
        textDark:   'FF223344',
        borderL:    'FFE2E8F0',
        borderM:    'FFC0CCDA',
      };

      const tipoLabel = tipoLiquidacion === 'mensual' ? 'Mensual'
        : tipoLiquidacion === 'quincenal-1' ? '1ra Quincena' : '2da Quincena';

      // ─── HELPER: encabezado de 7 filas ───────────────────────────────────────
      const buildHeader = (ws, subtitle, metrics, nCols) => {
        ws.views = [{ state: 'frozen', ySplit: 7 }];

        const mergeAndStyle = (row, value, fill, fontSize, bold) => {
          ws.mergeCells(row, 1, row, nCols);
          const cell = ws.getCell(row, 1);
          cell.value = value;
          cell.font = { name: 'Segoe UI', size: fontSize, bold, color: { argb: BC.white } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: row === 3 };
        };

        mergeAndStyle(1, 'ORGANIZACIÓN RDJ', BC.titleBg, 18, true);   ws.getRow(1).height = 30;
        mergeAndStyle(2, subtitle,            BC.subtitleBg, 11, true); ws.getRow(2).height = 22;
        mergeAndStyle(3, metrics,             BC.metricsBg, 10, true); ws.getRow(3).height = 22;
        mergeAndStyle(4, `Generado: ${new Date().toLocaleString('es-CO')}`, BC.dateBg, 10, false);
        ws.getRow(4).height = 18;
        ws.getRow(5).height = 5;
        ws.getRow(6).height = 8;
      };

      // ─── HELPER: estilo header columna ───────────────────────────────────────
      const styleHeader = (cell) => {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BC.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BC.headerBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top:    { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left:   { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FF666666' } },
          right:  { style: 'thin', color: { argb: 'FFCCCCCC' } },
        };
      };

      // ─── HELPER: estilo celda de dato ────────────────────────────────────────
      const styleData = (cell, align = 'left', bold = false, bg = null) => {
        cell.font = { name: 'Segoe UI', size: 9, bold, color: { argb: BC.textDark } };
        cell.alignment = { horizontal: align, vertical: 'middle', wrapText: false };
        cell.border = {
          top:    { style: 'thin', color: { argb: BC.borderL } },
          left:   { style: 'thin', color: { argb: BC.borderL } },
          bottom: { style: 'thin', color: { argb: BC.borderM } },
          right:  { style: 'thin', color: { argb: BC.borderL } },
        };
        if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      };

      // ─── HELPER: estilo fila totales ─────────────────────────────────────────
      const styleTotals = (cell, align = 'right') => {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: BC.white } };
        cell.alignment = { horizontal: align, vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BC.totalsBg } };
        cell.border = {
          top:    { style: 'thin', color: { argb: 'FF1A5F7A' } },
          left:   { style: 'thin', color: { argb: 'FF1A5F7A' } },
          bottom: { style: 'medium', color: { argb: 'FF0B3040' } },
          right:  { style: 'thin', color: { argb: 'FF1A5F7A' } },
        };
      };

      const COP = '$#,##0';

      // ════════════════════════════════════════════════════════════════════════════
      // HOJA 1 — LIQUIDACIÓN DE NÓMINA
      // ════════════════════════════════════════════════════════════════════════════
      const COLS1 = ['#', 'Empleado', 'Cargo', 'Sal. Base', 'Días', 'Devengado', 'Aux. Tr.', 'Bonos', 'Conceptos Adic.', 'Detalle Conceptos Adic.', 'T. Devengado', 'Salud 4%', 'Pensión 4%', 'T. Deducciones', 'Anticipo', 'Neto a Pagar'];
      const NC1 = COLS1.length;

      const ws1 = wb.addWorksheet(`Nómina ${MESES[month - 1]} ${year}`);
      buildHeader(
        ws1,
        `Liquidación de Nómina — ${MESES[month - 1].toUpperCase()} ${year} (${tipoLabel})`,
        `Empleados: ${lineas.length} | SMMLV: ${fmtCOP(config.smmlv)} | Aux. Transporte: ${fmtCOP(config.auxTransporte)} | Total Neto: ${fmtCOP(totales.totalNeto)}`,
        NC1
      );

      // Row 7: headers
      const hr1 = ws1.getRow(7);
      hr1.height = 28;
      COLS1.forEach((h, i) => { hr1.getCell(i + 1).value = h; styleHeader(hr1.getCell(i + 1)); });

      // Rows 8+: datos
      lineas.forEach((l, i) => {
        const paTotal = (l.pagosAdicionales || []).reduce((s, p) => s + (Number(p.monto) || 0), 0);
        const paDesc  = (l.pagosAdicionales || []).map(p => `${p.concepto}: ${fmtCOP(Number(p.monto) || 0)}`).join(' | ') || '—';
        const rowData = [
          i + 1, l.empleadoNombre, l.cargo || '—',
          l.salarioBase, l.diasTrabajados,
          l.salarioDevengado, l.auxTransporte, l.bonos,
          paTotal > 0 ? paTotal : '—', paDesc,
          l.totalDevengado, l.saludEmpleado, l.pensionEmpleado,
          l.totalDeducciones, l.anticipo || 0, l.netoAPagar,
        ];
        const row = ws1.getRow(i + 8);
        row.height = 18;
        rowData.forEach((v, ci) => {
          const cell = row.getCell(ci + 1);
          cell.value = v;
          const isNum = ci >= 3 && ci !== 4 && ci !== 9;
          styleData(cell, isNum ? 'right' : ci <= 2 ? 'left' : 'center');
          if (isNum && typeof v === 'number') cell.numFmt = COP;
          if (ci === 4) { cell.alignment = { horizontal: 'center', vertical: 'middle' }; }
        });
      });

      // Fila totales
      const paGrand = lineas.reduce((s, l) => s + (l.pagosAdicionales || []).reduce((ss, p) => ss + (Number(p.monto) || 0), 0), 0);
      const totRow1 = ws1.getRow(lineas.length + 8);
      totRow1.height = 20;
      const tot1Data = [
        '', 'TOTALES', '', '', '',
        lineas.reduce((s, l) => s + l.salarioDevengado, 0),
        lineas.reduce((s, l) => s + l.auxTransporte, 0),
        lineas.reduce((s, l) => s + l.bonos, 0),
        paGrand,
        '',
        totales.totalDevengado,
        lineas.reduce((s, l) => s + l.saludEmpleado, 0),
        lineas.reduce((s, l) => s + l.pensionEmpleado, 0),
        totales.totalDeducciones,
        totales.totalAnticipo,
        totales.totalNeto,
      ];
      tot1Data.forEach((v, ci) => {
        const cell = totRow1.getCell(ci + 1);
        cell.value = v;
        styleTotals(cell, ci === 1 ? 'left' : 'right');
        if (typeof v === 'number' && v !== 0) cell.numFmt = COP;
      });

      // Anchos columnas
      ws1.getColumn(1).width = 4;
      ws1.getColumn(2).width = 32;
      ws1.getColumn(3).width = 22;
      ws1.getColumn(4).width = 15;
      ws1.getColumn(5).width = 7;
      ws1.getColumn(6).width = 15;
      ws1.getColumn(7).width = 12;
      ws1.getColumn(8).width = 12;
      ws1.getColumn(9).width = 15;
      ws1.getColumn(10).width = 40;
      for (let c = 11; c <= 16; c++) ws1.getColumn(c).width = 15;

      // ════════════════════════════════════════════════════════════════════════════
      // HOJA 2 — PROYECCIÓN PAGO PARAFISCALES (PILA)
      // ════════════════════════════════════════════════════════════════════════════
      const COLS2 = [
        'Empleado', 'Sal. Base', 'Sal. Devengado',
        'Salud Empl. (4%)', 'Salud Empr. (8.5%)', 'Total Salud (12.5%)',
        'Pensión Empl. (4%)', 'Pensión Empr. (12%)', 'Total Pensión (16%)',
        'ARL', 'Caja Comp. (4%)',
        'TOTAL PILA',
      ];
      const NC2 = COLS2.length;

      const ws2 = wb.addWorksheet('Proyección Parafiscales');
      buildHeader(
        ws2,
        `Proyección Pago Parafiscales — ${MESES[month - 1].toUpperCase()} ${year}`,
        `Empleados: ${lineas.length} | Total PILA estimado: ${fmtCOP(lineas.reduce((s, l) => s + l.saludEmpleado + l.saludEmpleador + l.pensionEmpleado + l.pensionEmpleador + l.arl + l.caja, 0))}`,
        NC2
      );

      const hr2 = ws2.getRow(7);
      hr2.height = 36; // más alto porque hay text wrap en headers
      COLS2.forEach((h, i) => { hr2.getCell(i + 1).value = h; styleHeader(hr2.getCell(i + 1)); });

      lineas.forEach((l, i) => {
        const totalPila = l.saludEmpleado + l.saludEmpleador + l.pensionEmpleado + l.pensionEmpleador + l.arl + l.caja;
        const rowData = [
          l.empleadoNombre,
          l.salarioBase,
          l.salarioDevengado,
          l.saludEmpleado,
          l.saludEmpleador,
          l.saludEmpleado + l.saludEmpleador,
          l.pensionEmpleado,
          l.pensionEmpleador,
          l.pensionEmpleado + l.pensionEmpleador,
          l.arl,
          l.caja,
          totalPila,
        ];
        const row = ws2.getRow(i + 8);
        row.height = 18;
        rowData.forEach((v, ci) => {
          const cell = row.getCell(ci + 1);
          cell.value = v;
          styleData(cell, ci === 0 ? 'left' : 'right');
          if (ci > 0) cell.numFmt = COP;
        });
      });

      // Totales PILA
      const totRow2 = ws2.getRow(lineas.length + 8);
      totRow2.height = 20;
      const tot2Data = [
        'TOTALES',
        lineas.reduce((s, l) => s + l.salarioBase, 0),
        lineas.reduce((s, l) => s + l.salarioDevengado, 0),
        lineas.reduce((s, l) => s + l.saludEmpleado, 0),
        lineas.reduce((s, l) => s + l.saludEmpleador, 0),
        lineas.reduce((s, l) => s + l.saludEmpleado + l.saludEmpleador, 0),
        lineas.reduce((s, l) => s + l.pensionEmpleado, 0),
        lineas.reduce((s, l) => s + l.pensionEmpleador, 0),
        lineas.reduce((s, l) => s + l.pensionEmpleado + l.pensionEmpleador, 0),
        lineas.reduce((s, l) => s + l.arl, 0),
        lineas.reduce((s, l) => s + l.caja, 0),
        lineas.reduce((s, l) => s + l.saludEmpleado + l.saludEmpleador + l.pensionEmpleado + l.pensionEmpleador + l.arl + l.caja, 0),
      ];
      tot2Data.forEach((v, ci) => {
        const cell = totRow2.getCell(ci + 1);
        cell.value = v;
        styleTotals(cell, ci === 0 ? 'left' : 'right');
        if (typeof v === 'number') cell.numFmt = COP;
      });

      // Nota informativa debajo de totales
      const noteRow2 = ws2.getRow(lineas.length + 10);
      ws2.mergeCells(lineas.length + 10, 1, lineas.length + 10, NC2);
      noteRow2.getCell(1).value = 'NOTA: Los valores de Salud y Pensión incluyen el aporte del empleado y del empleador. ARL y Caja son exclusivos del empleador. Este reporte se usa como base para diligenciar la PILA mensual.';
      noteRow2.getCell(1).font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FF475569' } };
      noteRow2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      noteRow2.height = 28;

      ws2.getColumn(1).width = 32;
      for (let c = 2; c <= NC2; c++) ws2.getColumn(c).width = 16;

      // ════════════════════════════════════════════════════════════════════════════
      // HOJA 3 — PROVISIONES EMPLEADOR
      // ════════════════════════════════════════════════════════════════════════════
      const COLS3 = ['Empleado', 'Salud 8.5%', 'Pensión 12%', 'ARL', 'Caja 4%', 'Cesantías 8.33%', 'Int. Cesantías 1%', 'Prima 8.33%', 'Vacaciones 4.17%', 'Total Provisiones'];
      const NC3 = COLS3.length;

      const ws3 = wb.addWorksheet('Provisiones Empleador');
      buildHeader(
        ws3,
        `Provisiones del Empleador — ${MESES[month - 1].toUpperCase()} ${year}`,
        `Empleados: ${lineas.length} | Total Provisiones: ${fmtCOP(totales.totalProvisionesEmpleador || lineas.reduce((s, l) => s + (l.totalProvisionesEmpleador || 0), 0))}`,
        NC3
      );

      const hr3 = ws3.getRow(7);
      hr3.height = 36;
      COLS3.forEach((h, i) => { hr3.getCell(i + 1).value = h; styleHeader(hr3.getCell(i + 1)); });

      lineas.forEach((l, i) => {
        const rowData = [
          l.empleadoNombre,
          l.saludEmpleador, l.pensionEmpleador, l.arl, l.caja,
          l.cesantias, l.interesesCesantias, l.prima, l.vacaciones,
          l.totalProvisionesEmpleador,
        ];
        const row = ws3.getRow(i + 8);
        row.height = 18;
        rowData.forEach((v, ci) => {
          const cell = row.getCell(ci + 1);
          cell.value = v;
          styleData(cell, ci === 0 ? 'left' : 'right');
          if (ci > 0) cell.numFmt = COP;
        });
      });

      // Totales provisiones
      const totRow3 = ws3.getRow(lineas.length + 8);
      totRow3.height = 20;
      const tot3Keys = ['saludEmpleador', 'pensionEmpleador', 'arl', 'caja', 'cesantias', 'interesesCesantias', 'prima', 'vacaciones', 'totalProvisionesEmpleador'];
      const tot3Data = ['TOTALES', ...tot3Keys.map(k => lineas.reduce((s, l) => s + (l[k] || 0), 0))];
      tot3Data.forEach((v, ci) => {
        const cell = totRow3.getCell(ci + 1);
        cell.value = v;
        styleTotals(cell, ci === 0 ? 'left' : 'right');
        if (typeof v === 'number') cell.numFmt = COP;
      });

      ws3.getColumn(1).width = 32;
      for (let c = 2; c <= NC3; c++) ws3.getColumn(c).width = 17;

      // ─── DESCARGA ────────────────────────────────────────────────────────────
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nomina_${MESES[month - 1]}_${year}_${tipoLiquidacion}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Excel exportado exitosamente', 'success');
    } catch (err) {
      showToast('Error exportando Excel: ' + err.message, 'error');
    }
  };

  // === GENERAR DESPRENDIBLE PDF ===
  const handleDesprendible = async (linea) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'letter');

      // ── Constantes de layout ────────────────────────────────────────────────
      const PW = 216;
      const PH = 279;
      const ML = 14;
      const CW = PW - ML * 2;

      // Paleta corporativa (R,G,B)
      const C = {
        dark:     [11,  48,  64],   // #0B3040
        mid:      [26,  95, 122],   // #1A5F7A
        slate:    [51,  65,  85],   // #334155
        slateLt:  [71,  85, 105],   // #475569
        sectionBg:[241,245, 249],   // #F1F5F9
        border:   [226,232, 240],   // #E2E8F0
        textDark: [34,  51,  68],   // #223344
        textMid:  [100,116, 139],   // #64748B
        white:    [255,255, 255],
      };

      let y = 0;

      // ── Helpers ─────────────────────────────────────────────────────────────
      const sf  = (style, size) => { doc.setFont('helvetica', style); doc.setFontSize(size); };
      const tc  = (c) => doc.setTextColor(...c);
      const fc  = (c) => doc.setFillColor(...c);
      const dc  = (c) => doc.setDrawColor(...c);
      const lw  = (w) => doc.setLineWidth(w);

      const hLine = (col = C.border, w = 0.25) => {
        dc(col); lw(w); doc.line(ML, y, ML + CW, y);
      };

      // Encabezado de sección: franja gris + acento lateral izquierdo
      const sectionHead = (title) => {
        y += 3;
        fc(C.sectionBg); doc.rect(ML, y - 2.5, CW, 7, 'F');
        fc(C.mid);       doc.rect(ML, y - 2.5, 2.5, 7, 'F');
        sf('bold', 8); tc(C.dark);
        doc.text(title, ML + 5, y + 2);
        y += 7;
      };

      // Fila moneda: label izq + monto der
      const moneyRow = (label, amount, bold = false, indent = 4) => {
        sf(bold ? 'bold' : 'normal', 8.5);
        tc(bold ? C.textDark : C.textMid);
        doc.text(label, ML + indent, y);
        tc(C.textDark);
        doc.text(fmtCOP(amount), ML + CW, y, { align: 'right' });
        y += 5.8;
      };

      // Thin divisor
      const thinDiv = () => { dc(C.border); lw(0.25); doc.line(ML + 4, y, ML + CW - 4, y); y += 1; };

      // ── LOOKUP EMPRESA ────────────────────────────────────────────────────────
      const empData    = companies.find(c => c.name === linea.empresaContratante);
      const empNIT     = empData?.nit     || '—';
      const empAddr    = empData?.address || '—';
      const empLogoURL = empData?.logoURL || null;

      let logoBase64 = null;
      if (empLogoURL) {
        try {
          const res  = await fetch(empLogoURL);
          const blob = await res.blob();
          logoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch { /* logo no disponible — continuar sin él */ }
      }

      // ── BANDA 1: Cabecera corporativa ────────────────────────────────────────
      const B1H = 18;
      fc(C.dark); doc.rect(0, 0, PW, B1H, 'F');
      tc(C.white);
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'JPEG', ML, 2, 14, 14); } catch { /* formato inesperado — ignorar logo */ }
        const txtX = ML + 17;
        const txtW = CW - 17;
        sf('bold', 13);
        doc.text(linea.empresaContratante || 'ORGANIZACIÓN RDJ', txtX + txtW / 2, 8, { align: 'center' });
        sf('normal', 6.5);
        doc.text(`NIT: ${empNIT}  ·  ${empAddr}  ·  Comprobante de Pago de Salarios`, txtX + txtW / 2, 14, { align: 'center' });
      } else {
        sf('bold', 14);
        doc.text(linea.empresaContratante || 'ORGANIZACIÓN RDJ', PW / 2, 8, { align: 'center' });
        sf('normal', 7);
        doc.text(`NIT: ${empNIT}  ·  ${empAddr}  ·  Comprobante de Pago de Salarios`, PW / 2, 14, { align: 'center' });
      }
      y = B1H;

      // ── BANDA 2: Subtítulo documento ─────────────────────────────────────────
      fc(C.mid); doc.rect(0, y, PW, 8, 'F');
      sf('bold', 9.5); tc(C.white);
      doc.text('COMPROBANTE DE NÓMINA', PW / 2, y + 5.5, { align: 'center' });
      y += 8;

      // ── BANDA 3: Período + fecha ──────────────────────────────────────────────
      const tipoLabel = tipoLiquidacion === 'mensual' ? 'Mensual'
        : tipoLiquidacion === 'quincenal-1' ? '1ra Quincena' : '2da Quincena';
      fc(C.slate); doc.rect(0, y, PW, 6, 'F');
      sf('normal', 7); tc(C.white);
      doc.text(`Período: ${MESES[month - 1]} ${year}  —  ${tipoLabel}`, ML + 2, y + 4);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, ML + CW - 2, y + 4, { align: 'right' });
      y += 6;

      y += 4;

      // ── DATOS DEL EMPLEADO (2 columnas) ──────────────────────────────────────
      sectionHead('DATOS DEL EMPLEADO');

      const colMid = ML + CW / 2 + 3;
      const col2   = (lLabel, lVal, rLabel, rVal) => {
        sf('normal', 6.5); tc(C.textMid);
        doc.text(String(lLabel).toUpperCase(), ML, y);
        if (rLabel) doc.text(String(rLabel).toUpperCase(), colMid, y);
        y += 3.5;
        sf('normal', 8.5); tc(C.textDark);
        doc.text(String(lVal || '—'), ML, y);
        if (rLabel) doc.text(String(rVal || '—'), colMid, y);
        y += 6.5;
      };

      col2('Nombre completo', linea.empleadoNombre,       'Cédula de ciudadanía', linea.empleadoDocumento || '—');
      col2('Cargo / Posición', linea.cargo || '—',        'Empresa contratante',  linea.empresaContratante || '—');
      col2('EPS',             linea.eps || '—',           'Fondo de pensiones',   linea.fondoPension || '—');
      col2('Fondo de cesantías', linea.fondoCesantias||'—', 'ARL', `${linea.arlNombre||'—'} (${linea.arlPorcentaje||0}%)`);
      col2('Caja compensación', linea.cajaCompensacion||'—', 'Cuenta bancaria',
        linea.banco ? `${linea.banco} – ${linea.tipoCuenta||''} ${linea.numeroCuenta||''}`.trim() : '—');

      y += 1; hLine(); y += 7;

      // ── DEVENGADOS ────────────────────────────────────────────────────────────
      sectionHead('DEVENGADOS');

      moneyRow(`Salario devengado (${linea.diasTrabajados} días de ${fmtCOP(linea.salarioBase)}/mes)`, linea.salarioDevengado);
      if ((linea.auxTransporte || 0) > 0)
        moneyRow('Auxilio de transporte  (Art. 2 Ley 15/59)', linea.auxTransporte);
      if ((linea.bonos || 0) > 0)
        moneyRow(`Bonificación${linea.bonoDescripcion ? `  —  ${linea.bonoDescripcion}` : ''}`, linea.bonos);

      // Conceptos adicionales
      const pagosAd = linea.pagosAdicionales || [];
      if (pagosAd.length > 0) {
        y += 1;
        sf('normal', 6.5); tc(C.textMid);
        doc.text('CONCEPTOS ADICIONALES PAGADOS EN EL PERÍODO:', ML + 4, y);
        y += 4;
        pagosAd.forEach(p => moneyRow(`    ${p.concepto}`, Number(p.monto) || 0, false, 6));
      }

      thinDiv();
      moneyRow('TOTAL DEVENGADO', linea.totalDevengado, true, 3);

      y += 5;

      // ── DEDUCCIONES ───────────────────────────────────────────────────────────
      sectionHead('DEDUCCIONES LEGALES');

      moneyRow('Aporte salud empleado  (4% — Art. 204 Ley 100/93)', linea.saludEmpleado);
      moneyRow('Aporte pensión empleado  (4% — Art. 20 Ley 797/03)', linea.pensionEmpleado);
      if ((linea.anticipo || 0) > 0)
        moneyRow('Anticipo 1ra quincena', linea.anticipo);

      thinDiv();
      moneyRow('TOTAL DEDUCCIONES', linea.totalDeducciones + (linea.anticipo || 0), true, 3);

      y += 7;

      // ── NETO A PAGAR ──────────────────────────────────────────────────────────
      fc(C.dark); doc.rect(ML, y, CW, 12, 'F');
      sf('bold', 10); tc(C.white);
      doc.text('NETO A PAGAR:', ML + 5, y + 5);
      sf('bold', 13);
      doc.text(fmtCOP(linea.netoAPagar), ML + CW - 5, y + 5, { align: 'right' });
      y += 12;
      sf('italic', 7); tc(C.slateLt);
      const letras = `(${numeroALetras(linea.netoAPagar)})`;
      const letrasLines = doc.splitTextToSize(letras, CW - 4);
      const rasLines = letrasLines.length * 4.2 + 4;
      doc.text(letrasLines, ML + 4, y + 4);
      y += rasLines + 6;

      // ── FIRMAS ────────────────────────────────────────────────────────────────
      if (y > PH - 46) { doc.addPage(); y = 18; }

      const sigW = 74;
      const sigL = ML;
      const sigR = ML + CW - sigW;

      dc(C.textDark); lw(0.4);
      doc.line(sigL, y, sigL + sigW, y);
      doc.line(sigR, y, sigR + sigW, y);

      sf('bold', 8); tc(C.dark);
      doc.text('Representante Legal', sigL + sigW / 2, y + 4.5, { align: 'center' });
      doc.text('Empleado', sigR + sigW / 2, y + 4.5, { align: 'center' });

      sf('normal', 7); tc(C.textMid);
      doc.text('Nombre: _______________________________', sigL, y + 9);
      doc.text(`Nombre: ${linea.empleadoNombre}`, sigR, y + 9);
      doc.text('C.C.: _________________________________', sigL, y + 14);
      doc.text(`C.C.: ${linea.empleadoDocumento || '—'}`, sigR, y + 14);
      doc.text('Cargo: ________________________________', sigL, y + 19);
      doc.text(`Cargo: ${linea.cargo || '—'}`, sigR, y + 19);

      y += 27;

      // ── PIE LEGAL ─────────────────────────────────────────────────────────────
      hLine(C.border, 0.25); y += 3;
      sf('italic', 6.5); tc(C.textMid);
      const legal = 'Documento con validez legal como comprobante de pago de salarios y prestaciones conforme al Art. 139 del Código Sustantivo del Trabajo (C.S.T.) y la Ley 52 de 1975. Conservar por un mínimo de 10 años para efectos de auditoría, control laboral e inspecciones del Ministerio de Trabajo.';
      const legalLines = doc.splitTextToSize(legal, CW);
      doc.text(legalLines, ML, y + 3);
      y += legalLines.length * 3.5 + 4;

      sf('normal', 6.5); tc(C.textMid);
      doc.text(`Página 1 de 1  ·  ${new Date().toLocaleString('es-CO')}`, PW / 2, y + 2, { align: 'center' });

      doc.save(`Desprendible_${linea.empleadoNombre.replace(/\s+/g, '_')}_${MESES[month - 1]}_${year}.pdf`);
      showToast(`Desprendible generado para ${linea.empleadoNombre}`, 'success');
    } catch (err) {
      showToast('Error al generar PDF: ' + err.message, 'error');
    }
  };

  // Generar todos los desprendibles
  const handleTodosDesprendibles = async () => {
    for (const linea of lineas) {
      await handleDesprendible(linea);
    }
    showToast(`${lineas.length} desprendibles generados`, 'success');
  };

  // === ESTILOS DE CELDA ===
  const cellSx = { py: 1, px: 1, fontSize: '0.8rem', whiteSpace: 'nowrap' };
  const headerCellSx = {
    ...cellSx,
    fontWeight: 600,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.text.primary,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  };
  const numCellSx = { ...cellSx, textAlign: 'right', fontSize: '0.8rem' };

  // Estado chip
  const estadoChip = (estado) => {
    const map = {
      borrador: { color: 'warning', icon: <EditIcon sx={{ fontSize: 14 }} />, label: 'Borrador' },
      procesada: { color: 'info', icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, label: 'Procesada' },
      pagada: { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, label: 'Pagada' }
    };
    const cfg = map[estado] || map.borrador;
    return <Chip size="small" color={cfg.color} icon={cfg.icon} label={cfg.label} sx={{ fontWeight: 600, borderRadius: 1 }} />;
  };

  // === LOADING ===
  if (loading) {
    return <PageSkeleton variant="table" kpiCount={4} />;
  }

  // === RENDER ===
  return (
    <Box sx={{ p: embedded ? 0 : { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ===== HEADER GRADIENT SOBRIO ===== */}
      {!embedded && (
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          position: 'relative'
        }}
      >
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 1.2
          }}>
            RRHH • GESTIÓN DE NÓMINA
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5
          }}>
            <PaymentsIcon sx={{ fontSize: 32 }} />
            Nómina
          </Typography>
          <Typography variant="body1" sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            mt: 0.5
          }}>
            Liquidación y consolidado de nómina — Código Sustantivo del Trabajo (CST)
          </Typography>
        </Box>
      </Paper>
      )}

      {/* ===== SELECTOR DE PERÍODO + CONFIG ===== */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select value={year} onChange={(e) => setYear(e.target.value)} label="Año" sx={{ borderRadius: 1 }}>
                {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} label="Mes" sx={{ borderRadius: 1 }}>
                {MESES.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Liquidación</InputLabel>
              <Select value={tipoLiquidacion} onChange={(e) => setTipoLiquidacion(e.target.value)} label="Tipo de Liquidación" sx={{ borderRadius: 1 }}>
                <MenuItem value="mensual">Mensual</MenuItem>
                <MenuItem value="quincenal-1">Quincenal — 1ra Quincena</MenuItem>
                <MenuItem value="quincenal-2">Quincenal — 2da Quincena</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{
              px: 2, py: 1,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.04)
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Valores vigentes {year}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.25 }}>
                SMMLV: <strong>{fmtCOP(config.smmlv)}</strong>
                {' '}•{' '}
                Aux. Tr.: <strong>{fmtCOP(config.auxTransporte)}</strong>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={1} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'center' } }}>
            <Tooltip title="Recalcular nómina">
              <IconButton onClick={recalcularTodo} disabled={!isEditable} color="primary" sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* ===== ALERTA ENERO/FEBRERO — INTERESES CESANTÍAS ===== */}
      {[1, 2].includes(month) && isEditable && (
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{ mb: 3, borderRadius: 1, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
            📅 {month === 1 ? 'Enero' : 'Febrero'} — Pago obligatorio: Intereses sobre cesantías
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            Según el Art. 99 Ley 52/75, deben pagarse directamente al empleado antes del 31 de enero.
            Expande ▾ cada fila para agregar el concepto con el monto sugerido autocalculado.
          </Typography>
        </Alert>
      )}

      {/* ===== ALERTA JUNIO/DICIEMBRE — PRIMA DE SERVICIOS ===== */}
      {[6, 12].includes(month) && isEditable && (
        <Alert
          severity="success"
          icon={<InfoIcon />}
          sx={{ mb: 3, borderRadius: 1, border: `1px solid ${alpha(theme.palette.success.main, 0.3)}` }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
            📅 {month === 6 ? 'Junio' : 'Diciembre'} — Pago obligatorio: Prima de servicios (semestre {month === 6 ? '1' : '2'})
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {month === 6
              ? 'Debe pagarse antes del 30 de junio. Corresponde a 15 días de salario por el primer semestre trabajado.'
              : 'Debe pagarse antes del 20 de diciembre. Corresponde a 15 días de salario por el segundo semestre trabajado.'}
            {' '}Expande ▾ cada fila para ver el monto sugerido y agregarlo a la nómina.
          </Typography>
        </Alert>
      )}

      {/* ===== NOVEDADES ALERT ===== */}
      {novedades.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {novedades.length} novedad(es) aprobada(s) en el período
          </Typography>
          {novedades.slice(0, 3).map((n, i) => (
            <Typography key={i} variant="body2" sx={{ fontSize: '0.8rem' }}>
              • {n.empleadoNombre}: {n.tipo} ({n.dias} días) — {n.descripcion}
            </Typography>
          ))}
          {novedades.length > 3 && (
            <Typography variant="caption" color="text.secondary">y {novedades.length - 3} más...</Typography>
          )}
        </Alert>
      )}

      {/* ===== ESTADO + ACCIONES ===== */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {MESES[month - 1]} {year}
          </Typography>
          {nominaCargada ? estadoChip(nominaCargada.estado) : (
            <Chip size="small" label="Sin guardar" variant="outlined" sx={{ fontWeight: 500, borderRadius: 1 }} />
          )}
          <Typography variant="caption" color="text.secondary">
            {lineas.length} empleado(s)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {isEditable && (
            <>
              <Button variant="outlined" size="small" startIcon={<SaveIcon />} onClick={handleGuardar} disabled={saving || lineas.length === 0}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}>
                {nominaCargada ? 'Actualizar' : 'Guardar Borrador'}
              </Button>
              <Button variant="contained" size="small" startIcon={<CheckCircleIcon />} onClick={handleProcesar} disabled={saving || lineas.length === 0}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}>
                Procesar
              </Button>
            </>
          )}
          {nominaCargada?.estado === 'procesada' && (
            <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={handleMarcarPagada} disabled={saving}
              sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}>
              Marcar Pagada
            </Button>
          )}
          {lineas.length > 0 && (
            <>
              <Button variant="outlined" size="small" color="success" startIcon={<ExcelIcon />} onClick={handleExportExcel}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}>
                Excel
              </Button>
              <Button variant="outlined" size="small" color="error" startIcon={<PdfIcon />} onClick={handleTodosDesprendibles}
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}>
                Desprendibles
              </Button>
            </>
          )}
        </Box>
      </Paper>

      {/* ===== TABS ===== */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, borderRadius: '8px 8px 0 0' },
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
        }}
      >
        <Tab label="Liquidación" icon={<CalculateIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Consolidado" icon={<AssessmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {/* ===== TAB: LIQUIDACIÓN ===== */}
      {activeTab === 0 && (
        <Box>
          {loadingPeriodo ? (
            <Box sx={{ py: 2 }}>
              <LinearProgress sx={{ borderRadius: 1 }} />
            </Box>
          ) : lineas.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No hay empleados para liquidar en este período
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {tipoLiquidacion.startsWith('quincenal')
                  ? 'No hay empleados con periodicidad quincenal configurada.'
                  : 'No hay empleados activos con periodicidad mensual.'}
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Resumen rápido */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Total Devengado',     value: totales.totalDevengado,    color: theme.palette.success.main, icon: <TrendingUpIcon /> },
                  { label: 'Total Deducciones',   value: totales.totalDeducciones,  color: theme.palette.error.main,   icon: <ReceiptIcon /> },
                  { label: 'Total Neto',          value: totales.totalNeto,         color: theme.palette.primary.main, icon: <MoneyIcon /> },
                  { label: 'Provisiones Empleador', value: totales.totalProvEmpleador, color: theme.palette.info.main,  icon: <InfoIcon /> }
                ].map((kpi, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        height: '100%',
                        border: `1px solid ${alpha(kpi.color, 0.25)}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: alpha(kpi.color, 0.5),
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{
                          p: 0.75,
                          borderRadius: 1,
                          backgroundColor: alpha(kpi.color, 0.1),
                          color: kpi.color,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {kpi.icon}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, fontSize: '0.7rem', lineHeight: 1.3 }}>
                          {kpi.label}
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: kpi.color, fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
                        {fmtCOP(kpi.value)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Tabla de nómina */}
              <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.15)}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <TableContainer sx={{ maxHeight: '65vh' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerCellSx}>#</TableCell>
                        <TableCell sx={{ ...headerCellSx, minWidth: 180 }}>Empleado</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Sal. Base</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'center', minWidth: 65 }}>Días</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Devengado</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Aux. Tr.</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'center', minWidth: 100 }}>Bonos</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right', color: theme.palette.success.main }}>T. Devengado</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Salud 4%</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Pensión 4%</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right', color: theme.palette.error.main }}>T. Deducc.</TableCell>
                        {tipoLiquidacion === 'quincenal-2' && (
                          <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Anticipo</TableCell>
                        )}
                        <TableCell sx={{ ...headerCellSx, textAlign: 'right', color: theme.palette.primary.main, fontWeight: 700 }}>Neto</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'center', width: 50 }}>+</TableCell>
                        <TableCell sx={{ ...headerCellSx, textAlign: 'center', width: 40 }}>PDF</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineas.map((linea, idx) => (
                        <React.Fragment key={linea.empleadoId}>
                          <TableRow
                            hover
                            sx={{
                              '&:nth-of-type(even)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <TableCell sx={cellSx}>{idx + 1}</TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 500 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', lineHeight: 1.3 }}>
                                {linea.empleadoNombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {linea.cargo || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={numCellSx}>{fmtCOP(linea.salarioBase)}</TableCell>
                            <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                              {isEditable ? (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={datosEditables[linea.empleadoId]?.diasTrabajados ?? linea.diasTrabajados}
                                  onChange={(e) => handleDiasChange(linea.empleadoId, e.target.value)}
                                  inputProps={{ min: 0, max: 30, style: { textAlign: 'center', width: 40, padding: '4px 0' } }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{linea.diasTrabajados}</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={numCellSx}>{fmtCOP(linea.salarioDevengado)}</TableCell>
                            <TableCell sx={numCellSx}>
                              {linea.auxTransporte > 0 ? fmtCOP(linea.auxTransporte) : '—'}
                            </TableCell>
                            <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                              {isEditable ? (
                                <TextField
                                  size="small"
                                  value={datosEditables[linea.empleadoId]?.bonos ? formatNumber(datosEditables[linea.empleadoId].bonos) : ''}
                                  onChange={(e) => handleBonosChange(linea.empleadoId, e.target.value)}
                                  placeholder="0"
                                  inputProps={{ style: { textAlign: 'right', width: 70, padding: '4px 6px' } }}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{linea.bonos > 0 ? fmtCOP(linea.bonos) : '—'}</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ ...numCellSx, color: theme.palette.success.main, fontWeight: 600 }}>
                              {fmtCOP(linea.totalDevengado)}
                            </TableCell>
                            <TableCell sx={numCellSx}>{fmtCOP(linea.saludEmpleado)}</TableCell>
                            <TableCell sx={numCellSx}>{fmtCOP(linea.pensionEmpleado)}</TableCell>
                            <TableCell sx={{ ...numCellSx, color: theme.palette.error.main, fontWeight: 600 }}>
                              {fmtCOP(linea.totalDeducciones)}
                            </TableCell>
                            {tipoLiquidacion === 'quincenal-2' && (
                              <TableCell sx={numCellSx}>{fmtCOP(linea.anticipo)}</TableCell>
                            )}
                            <TableCell sx={{ ...numCellSx, color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.85rem' }}>
                              {fmtCOP(linea.netoAPagar)}
                            </TableCell>
                            <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                              <IconButton size="small" onClick={() => toggleExpanded(linea.empleadoId)}>
                                {expandedRows[linea.empleadoId] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                              <Tooltip title="Generar desprendible">
                                <IconButton size="small" color="error" onClick={() => handleDesprendible(linea)}>
                                  <PdfIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>

                          {/* Fila expandida: Provisiones empleador */}
                          <TableRow key={`${linea.empleadoId}-prov`}>
                            <TableCell colSpan={tipoLiquidacion === 'quincenal-2' ? 16 : 15} sx={{ py: 0, borderBottom: expandedRows[linea.empleadoId] ? undefined : 'none' }}>
                              <Collapse in={expandedRows[linea.empleadoId]} timeout="auto">
                                <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`, borderRadius: 1, my: 1 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'info.main', fontSize: '0.78rem' }}>
                                    Aportes Empleador y Provisiones Prestacionales
                                  </Typography>
                                  <Grid container spacing={1.5}>
                                    {[
                                      { label: 'Salud (8.5%)', val: linea.saludEmpleador },
                                      { label: 'Pensión (12%)', val: linea.pensionEmpleador },
                                      { label: `ARL (${linea.arlPorcentaje}%)`, val: linea.arl },
                                      { label: 'Caja Comp. (4%)', val: linea.caja },
                                      { label: 'Cesantías (8.33%)', val: linea.cesantias },
                                      { label: 'Int. Cesantías (1%)', val: linea.interesesCesantias },
                                      { label: 'Prima (8.33%)', val: linea.prima },
                                      { label: 'Vacaciones (4.17%)', val: linea.vacaciones }
                                    ].map((p, i) => (
                                      <Grid item xs={6} sm={3} md={1.5} key={i}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>{p.label}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{fmtCOP(p.val)}</Typography>
                                      </Grid>
                                    ))}
                                  </Grid>
                                  <Divider sx={{ my: 1.5 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.78rem' }}>
                                      Total Provisiones: {fmtCOP(linea.totalProvisionesEmpleador)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Costo total empleador: {fmtCOP(linea.totalDevengado + linea.totalProvisionesEmpleador)}
                                    </Typography>
                                  </Box>
                                  {/* Bono descripción */}
                                  {isEditable && (
                                    <Box sx={{ mt: 1.5 }}>
                                      <TextField
                                        size="small"
                                        fullWidth
                                        label="Observaciones / Descripción de bono"
                                        value={datosEditables[linea.empleadoId]?.bonoDescripcion || ''}
                                        onChange={(e) => handleBonoDescChange(linea.empleadoId, e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                      />
                                    </Box>
                                  )}

                                  {/* ===== CONCEPTOS ADICIONALES ===== */}
                                  <Box sx={{ mt: 2 }}>
                                    <Divider sx={{ mb: 1.5 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 0.8, color: 'text.secondary' }}>
                                        Conceptos adicionales pagados al empleado
                                      </Typography>
                                      {isEditable && (
                                        <Button
                                          size="small"
                                          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                          onClick={() => handleAddConcepto(linea.empleadoId)}
                                          sx={{ fontSize: '0.74rem', textTransform: 'none', borderRadius: 1, py: 0.3 }}
                                        >
                                          Agregar concepto
                                        </Button>
                                      )}
                                    </Box>

                                    {/* Sugerencia automática en junio/diciembre — Prima de servicios */}
                                    {isEditable && [6, 12].includes(month) && !(datosEditables[linea.empleadoId]?.pagosAdicionales || []).some(p => p.concepto?.toLowerCase().includes('prima')) && (
                                      <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 1, border: `1px dashed ${alpha(theme.palette.success.main, 0.4)}`, backgroundColor: alpha(theme.palette.success.main, 0.04) }}>
                                        <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
                                          💡 Prima de servicios — semestre {month === 6 ? '1 (hasta 30 jun)' : '2 (hasta 20 dic)'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            Monto sugerido: <strong>{fmtCOP(Math.round((linea.salarioBase + config.auxTransporte) * 0.5))}</strong>
                                            {' '}(15 días de salario + aux. transporte)
                                          </Typography>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                            onClick={() => handleAddConcepto(
                                              linea.empleadoId,
                                              `Prima de servicios semestre ${month === 6 ? '1' : '2'}`,
                                              Math.round((linea.salarioBase + config.auxTransporte) * 0.5)
                                            )}
                                            sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: 1, py: 0.25 }}
                                          >
                                            Agregar sugerido
                                          </Button>
                                        </Box>
                                      </Box>
                                    )}

                                    {/* Sugerencia automática en enero/febrero — Intereses cesantías */}
                                    {isEditable && [1, 2].includes(month) && !(datosEditables[linea.empleadoId]?.pagosAdicionales || []).some(p => p.concepto?.toLowerCase().includes('cesant')) && (
                                      <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 1, border: `1px dashed ${alpha(theme.palette.warning.main, 0.4)}`, backgroundColor: alpha(theme.palette.warning.main, 0.04) }}>
                                        <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
                                          💡 Intereses de cesantías pendientes de pago — calculado sobre el año anterior
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            Monto sugerido: <strong>{fmtCOP(Math.round((linea.salarioBase + config.auxTransporte) * 0.12))}</strong>
                                            {' '}(12% anual × cesantías)
                                          </Typography>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="warning"
                                            onClick={() => handleAddConcepto(
                                              linea.empleadoId,
                                              'Intereses de cesantías',
                                              Math.round((linea.salarioBase + config.auxTransporte) * 0.12)
                                            )}
                                            sx={{ fontSize: '0.72rem', textTransform: 'none', borderRadius: 1, py: 0.25 }}
                                          >
                                            Agregar sugerido
                                          </Button>
                                        </Box>
                                      </Box>
                                    )}

                                    {/* Lista de conceptos */}
                                    {(datosEditables[linea.empleadoId]?.pagosAdicionales || []).length === 0 ? (
                                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                                        Sin conceptos adicionales. Usa “Agregar concepto” para incluir intereses de cesantías, prima, vacaciones u otros pagos directos.
                                      </Typography>
                                    ) : (
                                      <Grid container spacing={1}>
                                        {(datosEditables[linea.empleadoId]?.pagosAdicionales || []).map((cp, cIdx) => (
                                          <Grid item xs={12} key={cIdx}>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                              <TextField
                                                size="small"
                                                label="Concepto"
                                                value={cp.concepto}
                                                onChange={(e) => handleUpdateConcepto(linea.empleadoId, cIdx, 'concepto', e.target.value)}
                                                disabled={!isEditable}
                                                sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                                placeholder="Ej: Intereses de cesantías"
                                              />
                                              <TextField
                                                size="small"
                                                label="Monto"
                                                value={cp.monto ? String(cp.monto).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                                                onChange={(e) => handleUpdateConcepto(linea.empleadoId, cIdx, 'monto', e.target.value)}
                                                disabled={!isEditable}
                                                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                                inputProps={{ style: { textAlign: 'right' } }}
                                              />
                                              {isEditable && (
                                                <IconButton size="small" color="error" onClick={() => handleRemoveConcepto(linea.empleadoId, cIdx)} sx={{ flexShrink: 0 }}>
                                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                              )}
                                            </Box>
                                          </Grid>
                                        ))}
                                        <Grid item xs={12}>
                                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                              Subtotal conceptos adicionales: <strong>{fmtCOP((datosEditables[linea.empleadoId]?.pagosAdicionales || []).reduce((s, p) => s + (Number(p.monto) || 0), 0))}</strong>
                                            </Typography>
                                          </Box>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </Box>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}

                      {/* Fila de totales */}
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.06) }}>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }} colSpan={2}>TOTALES</TableCell>
                        <TableCell sx={numCellSx} />
                        <TableCell sx={numCellSx} />
                        <TableCell sx={{ ...numCellSx, fontWeight: 600 }}>{fmtCOP(lineas.reduce((s, l) => s + l.salarioDevengado, 0))}</TableCell>
                        <TableCell sx={{ ...numCellSx, fontWeight: 600 }}>{fmtCOP(lineas.reduce((s, l) => s + l.auxTransporte, 0))}</TableCell>
                        <TableCell sx={{ ...numCellSx, fontWeight: 600 }}>{fmtCOP(lineas.reduce((s, l) => s + l.bonos, 0))}</TableCell>
                        <TableCell sx={{ ...numCellSx, fontWeight: 700, color: theme.palette.success.main }}>{fmtCOP(totales.totalDevengado)}</TableCell>
                        <TableCell sx={{ ...numCellSx, fontWeight: 600 }}>{fmtCOP(lineas.reduce((s, l) => s + l.saludEmpleado, 0))}</TableCell>
                        <TableCell sx={{ ...numCellSx, fontWeight: 600 }}>{fmtCOP(lineas.reduce((s, l) => s + l.pensionEmpleado, 0))}</TableCell>
                        <TableCell sx={{ ...numCellSx, fontWeight: 700, color: theme.palette.error.main }}>{fmtCOP(totales.totalDeducciones)}</TableCell>
                        {tipoLiquidacion === 'quincenal-2' && (
                          <TableCell sx={{ ...numCellSx, fontWeight: 600 }}>{fmtCOP(totales.totalAnticipo)}</TableCell>
                        )}
                        <TableCell sx={{ ...numCellSx, fontWeight: 700, color: theme.palette.primary.main, fontSize: '0.85rem' }}>{fmtCOP(totales.totalNeto)}</TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Info legal */}
              <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, backgroundColor: alpha(theme.palette.info.main, 0.04) }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <InfoIcon sx={{ fontSize: 16, color: 'info.main', mt: 0.3 }} />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', display: 'block' }}>
                      Base Legal — Código Sustantivo del Trabajo (CST)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.6 }}>
                      Salud: Empleado 4% + Empleador 8.5% (Art. 204 Ley 100/93) • Pensión: Empleado 4% + Empleador 12% (Art. 20 Ley 797/03) •
                      ARL: 100% empleador (Decreto 1295/94) • Caja Compensación: 4% empleador (Ley 21/82) •
                      Cesantías: 8.33% sobre sal. + aux. transp. (Art. 249 CST) • Intereses cesantías: 12% anual (Ley 52/75) •
                      Prima: 8.33% sobre sal. + aux. transp. (Art. 306 CST) • Vacaciones: 4.17% sobre salario (Art. 186 CST) •
                      Aux. transporte: aplica si salario ≤ 2 SMMLV (Ley 1 de 1963)
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </>
          )}
        </Box>
      )}

      {/* ===== TAB: CONSOLIDADO ===== */}
      {activeTab === 1 && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total Neto Pagado (YTD)', value: kpis.totalPagadoYTD,      color: theme.palette.success.main,  icon: <TrendingUpIcon />, sub: `Año ${year} — Acumulado` },
              { label: 'Total Neto Mes',          value: kpis.totalMes,            color: theme.palette.primary.main,  icon: <MoneyIcon />,      sub: `${MESES[month - 1]} ${year}` },
              { label: 'Costo Empleador Mes',     value: kpis.costoEmpleadorMes,   color: theme.palette.warning.main,  icon: <ReceiptIcon />,    sub: 'Neto + Provisiones' },
              { label: 'Empleados Activos',       value: null, count: kpis.empleadosActivos, color: theme.palette.info.main, icon: <PeopleIcon />, sub: 'En nómina actual' }
            ].map((kpi, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    height: '100%',
                    border: `1px solid ${alpha(kpi.color, 0.25)}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha(kpi.color, 0.5),
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{
                      p: 0.75,
                      borderRadius: 1,
                      backgroundColor: alpha(kpi.color, 0.1),
                      color: kpi.color,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {kpi.icon}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, fontSize: '0.7rem', lineHeight: 1.3 }}>
                      {kpi.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: kpi.color }}>
                    {kpi.count != null ? kpi.count : fmtCOP(kpi.value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Histórico de nóminas */}
          <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.15)}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 20 }} />
                Historial de Nóminas — {year}
              </Typography>
            </Box>

            {kpis.nominasDelYear.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No hay nóminas registradas en {year}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Genera tu primera nómina en la pestaña &quot;Liquidación&quot;
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>Período</TableCell>
                      <TableCell sx={headerCellSx}>Tipo</TableCell>
                      <TableCell sx={headerCellSx}>Estado</TableCell>
                      <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>Empleados</TableCell>
                      <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Total Devengado</TableCell>
                      <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Total Deducciones</TableCell>
                      <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Total Neto</TableCell>
                      <TableCell sx={{ ...headerCellSx, textAlign: 'right' }}>Prov. Empleador</TableCell>
                      <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kpis.nominasDelYear.map((nom) => {
                      const [ny, nm] = nom.periodo.split('-');
                      const mesNombre = MESES[parseInt(nm) - 1] || nm;
                      const tipoLabel = nom.tipo === 'mensual' ? 'Mensual' : nom.tipo === 'quincenal-1' ? '1ra Qna.' : '2da Qna.';
                      return (
                        <TableRow
                          key={nom.id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:nth-of-type(even)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) }
                          }}
                          onClick={() => {
                            setYear(parseInt(ny));
                            setMonth(parseInt(nm));
                            setTipoLiquidacion(nom.tipo);
                            setActiveTab(0);
                          }}
                        >
                          <TableCell sx={{ ...cellSx, fontWeight: 500 }}>{mesNombre} {ny}</TableCell>
                          <TableCell sx={cellSx}>{tipoLabel}</TableCell>
                          <TableCell sx={cellSx}>{estadoChip(nom.estado)}</TableCell>
                          <TableCell sx={{ ...cellSx, textAlign: 'center' }}>{nom.cantidadEmpleados || '—'}</TableCell>
                          <TableCell sx={{ ...numCellSx, color: theme.palette.success.main }}>{fmtCOP(nom.totalDevengado)}</TableCell>
                          <TableCell sx={{ ...numCellSx, color: theme.palette.error.main }}>{fmtCOP(nom.totalDeducciones)}</TableCell>
                          <TableCell sx={{ ...numCellSx, fontWeight: 600, color: theme.palette.primary.main }}>{fmtCOP(nom.totalNeto)}</TableCell>
                          <TableCell sx={{ ...numCellSx, color: 'text.secondary' }}>{fmtCOP(nom.totalProvisionesEmpleador)}</TableCell>
                          <TableCell sx={{ ...cellSx, textAlign: 'center' }}>
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" color="primary">
                                <CalculateIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* ===== DIALOG CONFIRMACIÓN ===== */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null })}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (confirmDialog.action) await confirmDialog.action();
              setConfirmDialog({ open: false, title: '', message: '', action: null });
            }}
            disabled={saving}
            sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error global */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }} onClose={() => {}}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default NominaPage;
