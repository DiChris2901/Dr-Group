import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tab, Chip, IconButton,
  Alert, Tooltip, Card, CardContent, Collapse, Divider, CircularProgress,
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
  Edit as EditIcon
} from '@mui/icons-material';
import useNomina from '../hooks/useNomina';
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

const parseNum = (str) => parseInt(String(str).replace(/\./g, '')) || 0;

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
const NominaPage = () => {
  const theme = useTheme();
  const { showToast } = useToast();
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
  const [smmlvInput, setSmmlvInput] = useState(formatNumber(DEFAULTS.SMMLV));
  const [auxTransInput, setAuxTransInput] = useState(formatNumber(DEFAULTS.AUX_TRANSPORTE));
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
          editables[l.empleadoId] = { diasTrabajados: l.diasTrabajados || 30, bonos: l.bonos || 0, bonoDescripcion: l.bonoDescripcion || '' };
        });
        setDatosEditables(editables);
        if (existente.smmlv) {
          setConfig(prev => ({ ...prev, smmlv: existente.smmlv, auxTransporte: existente.auxTransporte }));
          setSmmlvInput(formatNumber(existente.smmlv));
          setAuxTransInput(formatNumber(existente.auxTransporte));
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

  const recalcularLinea = (empId, editable) => {
    const emp = empleados.find(e => e.id === empId);
    if (!emp) return;
    const tipoNom = tipoLiquidacion.startsWith('quincenal') ? 'quincenal' : 'mensual';
    const nueva = calcularLineaNomina(emp, editable.diasTrabajados ?? 30, editable.bonos ?? 0, editable.bonoDescripcion ?? '', config.smmlv, config.auxTransporte, tipoNom, tipoLiquidacion === 'quincenal-1');
    setLineas(prev => prev.map(l => l.empleadoId === empId ? nueva : l));
  };

  const recalcularTodo = useCallback(() => {
    const newLineas = generarLineas(tipoLiquidacion, datosEditables);
    setLineas(newLineas);
  }, [generarLineas, tipoLiquidacion, datosEditables]);

  const applyConfig = () => {
    const smmlv = parseNum(smmlvInput);
    const auxTrans = parseNum(auxTransInput);
    if (smmlv > 0) {
      setConfig({ smmlv, auxTransporte: auxTrans });
      if (isEditable) {
        const tipoNom = tipoLiquidacion.startsWith('quincenal') ? 'quincenal' : 'mensual';
        const esPrimera = tipoLiquidacion === 'quincenal-1';
        const newLineas = empleados
          .filter(emp => tipoLiquidacion.startsWith('quincenal') ? emp.tipoNomina === 'quincenal' : emp.tipoNomina !== 'quincenal')
          .map(emp => {
            const ed = datosEditables[emp.id] || {};
            return calcularLineaNomina(emp, ed.diasTrabajados ?? 30, ed.bonos ?? 0, ed.bonoDescripcion ?? '', smmlv, auxTrans, tipoNom, esPrimera);
          });
        setLineas(newLineas);
      }
    }
  };

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
      const ws = wb.addWorksheet(`Nómina ${MESES[month - 1]} ${year}`);

      // Header
      ws.mergeCells('A1:N1');
      ws.getCell('A1').value = 'ORGANIZACIÓN RDJ';
      ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1A237E' } };
      ws.getCell('A1').alignment = { horizontal: 'center' };

      ws.mergeCells('A2:N2');
      ws.getCell('A2').value = `NÓMINA — ${MESES[month - 1].toUpperCase()} ${year}`;
      ws.getCell('A2').font = { bold: true, size: 12, color: { argb: 'FF5C6BC0' } };
      ws.getCell('A2').alignment = { horizontal: 'center' };

      ws.mergeCells('A3:N3');
      const tipoLabel = tipoLiquidacion === 'mensual' ? 'Mensual' : tipoLiquidacion === 'quincenal-1' ? '1ra Quincena' : '2da Quincena';
      ws.getCell('A3').value = `Tipo: ${tipoLabel} | SMMLV: ${fmtCOP(config.smmlv)} | Aux. Transporte: ${fmtCOP(config.auxTransporte)}`;
      ws.getCell('A3').font = { size: 9, color: { argb: 'FF757575' } };
      ws.getCell('A3').alignment = { horizontal: 'center' };

      ws.addRow([]);

      // Column headers
      const headers = ['#', 'Empleado', 'Cargo', 'Sal. Base', 'Días', 'Devengado', 'Aux. Tr.', 'Bonos', 'T. Devengado', 'Salud 4%', 'Pensión 4%', 'T. Deducciones', 'Anticipo', 'Neto a Pagar'];
      const hRow = ws.addRow(headers);
      hRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
      hRow.alignment = { horizontal: 'center', vertical: 'middle' };
      hRow.height = 24;

      lineas.forEach((l, i) => {
        ws.addRow([i + 1, l.empleadoNombre, l.cargo, l.salarioBase, l.diasTrabajados, l.salarioDevengado, l.auxTransporte, l.bonos, l.totalDevengado, l.saludEmpleado, l.pensionEmpleado, l.totalDeducciones, l.anticipo || 0, l.netoAPagar]);
      });

      const tRow = ws.addRow(['', 'TOTALES', '', '', '',
        lineas.reduce((s, l) => s + l.salarioDevengado, 0),
        lineas.reduce((s, l) => s + l.auxTransporte, 0),
        lineas.reduce((s, l) => s + l.bonos, 0),
        totales.totalDevengado,
        lineas.reduce((s, l) => s + l.saludEmpleado, 0),
        lineas.reduce((s, l) => s + l.pensionEmpleado, 0),
        totales.totalDeducciones, totales.totalAnticipo, totales.totalNeto
      ]);
      tRow.font = { bold: true };
      tRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } };

      [4, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(col => { ws.getColumn(col).numFmt = '$#,##0'; ws.getColumn(col).width = 16; });
      ws.getColumn(1).width = 5;
      ws.getColumn(2).width = 30;
      ws.getColumn(3).width = 20;
      ws.getColumn(5).width = 8;
      ws.views = [{ state: 'frozen', ySplit: 5 }];

      // Sheet 2: Provisiones
      const ws2 = wb.addWorksheet('Provisiones Empleador');
      const h2 = ws2.addRow(['Empleado', 'Salud 8.5%', 'Pensión 12%', 'ARL', 'Caja 4%', 'Cesantías', 'Int. Cesantías', 'Prima', 'Vacaciones', 'Total']);
      h2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      h2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
      lineas.forEach(l => { ws2.addRow([l.empleadoNombre, l.saludEmpleador, l.pensionEmpleador, l.arl, l.caja, l.cesantias, l.interesesCesantias, l.prima, l.vacaciones, l.totalProvisionesEmpleador]); });
      const t2 = ws2.addRow(['TOTALES', ...['saludEmpleador', 'pensionEmpleador', 'arl', 'caja', 'cesantias', 'interesesCesantias', 'prima', 'vacaciones', 'totalProvisionesEmpleador'].map(k => lineas.reduce((s, l) => s + (l[k] || 0), 0))]);
      t2.font = { bold: true };
      ws2.columns.forEach((col, i) => { col.width = i === 0 ? 30 : 16; if (i > 0) col.numFmt = '$#,##0'; });

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
      const pw = 216;
      const cw = pw - 30;
      const x = 15;
      let y = 20;

      // Header empresa
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ORGANIZACIÓN RDJ', pw / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('NIT: ---', pw / 2, y, { align: 'center' });
      y += 10;

      // Título
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROBANTE DE NÓMINA', pw / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const tipoLabel = tipoLiquidacion === 'mensual' ? 'Mensual' : tipoLiquidacion === 'quincenal-1' ? '1ra Quincena' : '2da Quincena';
      doc.text(`Período: ${MESES[month - 1]} ${year} — ${tipoLabel}`, pw / 2, y, { align: 'center' });
      y += 3;
      doc.setDrawColor(180);
      doc.line(x, y, x + cw, y);
      y += 8;

      // Datos empleado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DATOS DEL EMPLEADO', x, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const empData = [
        ['Nombre', linea.empleadoNombre],
        ['Cédula', linea.empleadoDocumento],
        ['Cargo', linea.cargo || '—'],
        ['Empresa', linea.empresaContratante || '—'],
        ['EPS', linea.eps || '—'],
        ['Fondo Pensión', linea.fondoPension || '—'],
        ['Fondo Cesantías', linea.fondoCesantias || '—'],
        ['ARL', `${linea.arlNombre || '—'} (Nivel ${linea.arlPorcentaje}%)`],
        ['Caja Compensación', linea.cajaCompensacion || '—'],
        ['Banco', linea.banco ? `${linea.banco} — ${linea.tipoCuenta} ${linea.numeroCuenta}` : '—']
      ];
      empData.forEach(([label, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, x + 3, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(val), x + 45, y);
        y += 5;
      });
      y += 5;

      const addRow = (label, value, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(label, x + 5, y);
        doc.text(fmtCOP(value), x + cw - 5, y, { align: 'right' });
        y += 5;
      };

      // Devengados
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DEVENGADOS', x, y);
      y += 6;
      doc.setFontSize(9);
      addRow(`Salario devengado (${linea.diasTrabajados} días)`, linea.salarioDevengado);
      if (linea.auxTransporte > 0) addRow('Auxilio de transporte', linea.auxTransporte);
      if (linea.bonos > 0) addRow(`Bonificación${linea.bonoDescripcion ? ` (${linea.bonoDescripcion})` : ''}`, linea.bonos);
      doc.setDrawColor(200);
      doc.line(x + 3, y, x + cw - 3, y);
      y += 2;
      addRow('TOTAL DEVENGADO', linea.totalDevengado, true);
      y += 5;

      // Deducciones
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DEDUCCIONES', x, y);
      y += 6;
      doc.setFontSize(9);
      addRow('Aporte salud empleado (4%)', linea.saludEmpleado);
      addRow('Aporte pensión empleado (4%)', linea.pensionEmpleado);
      if (linea.anticipo > 0) addRow('Anticipo 1ra quincena', linea.anticipo);
      doc.line(x + 3, y, x + cw - 3, y);
      y += 2;
      addRow('TOTAL DEDUCCIONES', linea.totalDeducciones + (linea.anticipo || 0), true);
      y += 8;

      // Neto a pagar
      doc.setFillColor(232, 234, 246);
      doc.rect(x, y - 3, cw, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('NETO A PAGAR:', x + 5, y + 4);
      doc.text(fmtCOP(linea.netoAPagar), x + cw - 5, y + 4, { align: 'right' });
      y += 14;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`(${numeroALetras(linea.netoAPagar)})`, x + 5, y);
      y += 10;

      // Aportes empleador
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('APORTES DEL EMPLEADOR (Informativo)', x, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const provs = [
        [`Salud (8.5%)`, linea.saludEmpleador],
        [`Pensión (12%)`, linea.pensionEmpleador],
        [`ARL (${linea.arlPorcentaje}%)`, linea.arl],
        [`Caja Compensación (4%)`, linea.caja],
        [`Cesantías (8.33%)`, linea.cesantias],
        [`Int. Cesantías (1%)`, linea.interesesCesantias],
        [`Prima (8.33%)`, linea.prima],
        [`Vacaciones (4.17%)`, linea.vacaciones]
      ];
      provs.forEach(([l, v]) => { addRow(l, v); });
      doc.line(x + 3, y, x + cw - 3, y);
      y += 2;
      addRow('TOTAL PROVISIONES', linea.totalProvisionesEmpleador, true);
      y += 15;

      // Firmas
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(100);
      doc.line(x, y, x + 65, y);
      doc.text('Firma Empleador', x + 32, y + 5, { align: 'center' });
      doc.line(x + cw - 65, y, x + cw, y);
      doc.text('Firma Empleado', x + cw - 32, y + 5, { align: 'center' });
      y += 12;
      doc.setFontSize(7);
      doc.setTextColor(130);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw / 2, y, { align: 'center' });

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
  const cellSx = { py: 1, px: 1, fontSize: '0.78rem', whiteSpace: 'nowrap' };
  const headerCellSx = {
    ...cellSx,
    fontWeight: 600,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.text.primary,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  };
  const numCellSx = { ...cellSx, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.76rem' };

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // === RENDER ===
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ===== HEADER GRADIENT SOBRIO ===== */}
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

      {/* ===== SELECTOR DE PERÍODO + CONFIG ===== */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
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
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              label="SMMLV"
              value={smmlvInput}
              onChange={(e) => setSmmlvInput(formatNumber(e.target.value))}
              onBlur={applyConfig}
              disabled={!isEditable}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Aux. Transporte"
              value={auxTransInput}
              onChange={(e) => setAuxTransInput(formatNumber(e.target.value))}
              onBlur={applyConfig}
              disabled={!isEditable}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
          </Grid>
          <Grid item xs={12} md={1} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'center' } }}>
            <Tooltip title="Recalcular todo">
              <IconButton onClick={applyConfig} disabled={!isEditable} color="primary" sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

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
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
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
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
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
                  { label: 'Total Devengado', value: totales.totalDevengado, color: 'success.main', icon: <TrendingUpIcon /> },
                  { label: 'Total Deducciones', value: totales.totalDeducciones, color: 'error.main', icon: <ReceiptIcon /> },
                  { label: 'Total Neto', value: totales.totalNeto, color: 'primary.main', icon: <MoneyIcon /> },
                  { label: 'Provisiones Empleador', value: totales.totalProvEmpleador, color: 'info.main', icon: <InfoIcon /> }
                ].map((kpi, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Box sx={{ color: kpi.color, display: 'flex' }}>{kpi.icon}</Box>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.3, fontSize: '0.65rem' }}>
                            {kpi.label}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: kpi.color, fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                          {fmtCOP(kpi.value)}
                        </Typography>
                      </CardContent>
                    </Card>
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
                        <>
                          <TableRow
                            key={linea.empleadoId}
                            hover
                            sx={{
                              '&:nth-of-type(even)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <TableCell sx={cellSx}>{idx + 1}</TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 500 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.3 }}>
                                {linea.empleadoNombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
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
                            <TableCell sx={{ ...numCellSx, color: theme.palette.primary.main, fontWeight: 700, fontSize: '0.82rem' }}>
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
                                <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.03), borderRadius: 1, my: 1 }}>
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
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>{p.label}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.78rem' }}>{fmtCOP(p.val)}</Typography>
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
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </>
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
              <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, backgroundColor: alpha(theme.palette.info.main, 0.03) }}>
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
              { label: 'Total Neto Pagado (YTD)', value: kpis.totalPagadoYTD, color: 'success.main', icon: <TrendingUpIcon />, sub: `Año ${year} — Acumulado` },
              { label: 'Total Neto Mes', value: kpis.totalMes, color: 'primary.main', icon: <MoneyIcon />, sub: `${MESES[month - 1]} ${year}` },
              { label: 'Costo Empleador Mes', value: kpis.costoEmpleadorMes, color: 'warning.main', icon: <ReceiptIcon />, sub: 'Neto + Provisiones' },
              { label: 'Empleados Activos', value: null, count: kpis.empleadosActivos, color: 'info.main', icon: <PeopleIcon />, sub: 'En nómina actual' }
            ].map((kpi, i) => (
              <Grid item xs={6} md={3} key={i}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.15)}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <Box sx={{ color: kpi.color, display: 'flex' }}>{kpi.icon}</Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.3, fontSize: '0.65rem' }}>
                        {kpi.label}
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: kpi.color }}>
                      {kpi.count != null ? kpi.count : fmtCOP(kpi.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>
                  </CardContent>
                </Card>
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
