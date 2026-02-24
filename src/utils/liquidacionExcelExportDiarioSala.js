import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ================== DATE PARSING ==================
// Normaliza distintos formatos (serial Excel, DD/MM/YYYY, DD-MM, etc.)
const parseDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') { // Excel serial (days from 1899-12-30)
    if (value > 25569 && value < 60000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(epoch.getTime() + value * 86400000);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const mFull = /^([0-3]?\d)[/-]([0-1]?\d)[/-](\d{2,4})$/.exec(trimmed);
    if (mFull) {
      const [, dd, mm, yyyy] = mFull;
      const year = yyyy.length === 2 ? Number('20' + yyyy) : Number(yyyy);
      const d = new Date(year, Number(mm) - 1, Number(dd));
      return isNaN(d.getTime()) || d.getFullYear() < 1971 ? null : d;
    }
    const mShort = /^([0-3]?\d)-([0-1]?\d)$/.exec(trimmed);
    if (mShort) {
      const [, dd, mm] = mShort;
      const now = new Date();
      const d = new Date(now.getFullYear(), Number(mm) - 1, Number(dd));
      return isNaN(d.getTime()) ? null : d;
    }
    const nat = new Date(trimmed.replace(/\./g, '/'));
    if (!isNaN(nat.getTime()) && nat.getFullYear() > 1970) return nat;
  }
  return null;
};

// ================== STYLES (Spectacular) ==================
const baseFont = { name: 'Segoe UI' };
const styleTitle = { font: { ...baseFont, size: 16, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } } };
const styleDate = { font: { ...baseFont, size: 11, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5F7A' } } };
const styleHeader = { font: { ...baseFont, size: 10, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } }, border: { top: { style: 'thin', color: { argb: 'FFCCCCCC' } }, left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, bottom: { style: 'thin', color: { argb: 'FF666666' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } } } };
const styleCell = { font: { ...baseFont, size: 9, color: { argb: 'FF223344' } }, alignment: { vertical: 'middle', horizontal: 'center' }, border: { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } } };
const styleMoney = { ...styleCell, alignment: { vertical: 'middle', horizontal: 'right' }, numFmt: '"$"#,##0' };
const styleTotals = { font: { ...baseFont, size: 10, bold: true, color: { argb: 'FF0B3040' } }, alignment: { horizontal: 'right', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } };

// ================== DATASET BUILDER ==================
// Regla clave: SOLO fechas reales presentes en rawData. Solo rellenar huecos internos
// dentro del rango min..max de cada máquina (serial+NUC). Cuando una máquina deja de
// aparecer (reemplazo) no se agrega después de su última fecha.
const buildDailyDataset = (rawData, establecimiento) => {
  const dateKeyToLocalDate = (key) => {
    const [yy, mm, dd] = key.split('-').map(Number);
    return new Date(yy, mm - 1, dd, 0, 0, 0, 0); // Fecha local sin desfase
  };
  const rawDateSamples = new Set();
  const filtered = rawData.filter(r => {
    const est = r.Establecimiento || r.establecimiento || r.sala;
    return est === establecimiento;
  });

  const machineMap = new Map(); // key serial|nuc -> {serial,nuc,tarifaTipo, dates:Set<Date>, min:Date, max:Date}
  const productionRows = []; // filas reales

  filtered.forEach(r => {
    const fechaRaw = r['Fecha reporte'] || r.fechaReporte || r['Fecha'] || r.fecha || r['fecha_dia'] || r['fecha_d'] || r['fecha dia'];
    rawDateSamples.add(fechaRaw);
    const fecha = parseDate(fechaRaw);
    if (!fecha || fecha.getFullYear() < 1971) return; // inválida

    const serial = r.Serial || r.serial || '';
    const nuc = r.NUC || r.nuc || '';
    const tarifaTipo = r.tipoTarifa || r.tarifa || '';
    const prod = Number(r['Base liquidación diaria'] || r.baseLiquidacionDiaria || r.baseLiquidacion || r.produccionDiaria || 0) || 0;
    const derechos = prod * 0.12;
    const gastos = derechos * 0.01;
    const total = derechos + gastos;

    productionRows.push({ fecha, serial, nuc, tarifaTipo, produccion: prod, derechos, gastos, total });

    const key = `${serial}__${nuc}`;
    if (!machineMap.has(key)) {
      machineMap.set(key, { serial, nuc, tarifaTipo, dates: new Set([fecha.toISOString().slice(0,10)]), min: fecha, max: fecha });
    } else {
      const m = machineMap.get(key);
      m.dates.add(fecha.toISOString().slice(0,10));
      if (fecha < m.min) m.min = fecha;
      if (fecha > m.max) m.max = fecha;
      if (!m.tarifaTipo && tarifaTipo) m.tarifaTipo = tarifaTipo; // preservar si llega después
    }
  });

  if (!productionRows.length) {
    return new Map();
  }

  // Fechas reales únicas
  const uniqueDateKeys = [...new Set(productionRows.map(r => r.fecha.toISOString().slice(0,10)))].sort();

  // Map fecha -> rows (inicialmente reales)
  const grouped = new Map();
  uniqueDateKeys.forEach(d => grouped.set(d, []));
  productionRows.forEach(r => {
    const k = r.fecha.toISOString().slice(0,10);
    grouped.get(k).push(r);
  });

  // Rellenar huecos internos por máquina (solo entre min..max)
  uniqueDateKeys.forEach(dateKey => {
    const dateObj = dateKeyToLocalDate(dateKey);
    const list = grouped.get(dateKey);
    machineMap.forEach(m => {
      if (dateObj >= m.min && dateObj <= m.max) { // dentro de rango
        if (!m.dates.has(dateKey)) { // hueco interno
          list.push({
            fecha: dateObj,
            serial: m.serial,
            nuc: m.nuc,
            tarifaTipo: m.tarifaTipo,
            produccion: 0,
            derechos: 0,
            gastos: 0,
            total: 0
          });
        }
      }
    });
  });


  // Ordenar filas de cada día por serial
  grouped.forEach(list => list.sort((a,b) => (a.serial||'').localeCompare(b.serial||'')));

  return grouped; // Map<dateKey, rows[]>
};

// ================== EXPORT MAIN ==================
export const exportarReporteDiarioSala = async (rawData, establecimiento, empresa = 'DR GROUP') => {
  if (!rawData || !Array.isArray(rawData) || !rawData.length) throw new Error('Sin datos base para reporte diario');
  if (!establecimiento) throw new Error('Establecimiento no especificado');

  const grouped = buildDailyDataset(rawData, establecimiento);
  if (grouped.size === 0) {
    throw new Error('No se encontraron fechas válidas para el establecimiento (solo datos reales).');
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'DR Group Dashboard';
  wb.created = new Date();

  const dateKeys = [...grouped.keys()].sort();

  const dateKeyToLocalDate = (key) => {
    const [yy, mm, dd] = key.split('-').map(Number);
    return new Date(yy, mm - 1, dd, 0, 0, 0, 0);
  };

  dateKeys.forEach(dateKey => {
    const rows = grouped.get(dateKey);
    const dateObj = dateKeyToLocalDate(dateKey);
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth()+1;
    const d = dateObj.getDate();

    const sheetName = dateKey; // YYYY-MM-DD
    const ws = wb.addWorksheet(sheetName.substring(0,31));

  // Title row (1)
  ws.mergeCells(1,1,1,6);
    const r1 = ws.getRow(1);
    r1.getCell(1).value = `LIQUIDACIÓN DIARIA - ${establecimiento}`;
    r1.getCell(1).style = styleTitle;
    r1.height = 26;

    // Date row (2)
  ws.mergeCells(2,1,2,6);
    const r2 = ws.getRow(2);
    r2.getCell(1).value = `${d.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}/${y}`;
    r2.getCell(1).style = styleDate;
    r2.height = 18;

    // Headers (3)
  const headers = ['Serial','NUC','Producción','Derechos (12%)','Gastos (1%)','Total Impuestos'];
    const r3 = ws.getRow(3);
    headers.forEach((h,i)=>{ const c = r3.getCell(i+1); c.value = h; c.style = styleHeader; });
    r3.height = 22;

    // Data rows start at 4
    let excelRowIndex = 4;
    let totalProd=0, totalDer=0, totalGas=0, totalImp=0;
    rows.forEach(r => {
      const row = ws.getRow(excelRowIndex);
      const values = [r.serial, r.nuc, Math.round(r.produccion), Math.round(r.derechos), Math.round(r.gastos), Math.round(r.total)];
      values.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx+1);
        cell.value = val;
        const isMoney = colIdx >=2 && colIdx <=5; // Producción -> Total
        cell.style = isMoney ? { ...styleMoney } : { ...styleCell };
        if (isMoney) {
          if (val < 0) cell.font = { ...cell.font, color: { argb: 'FFDC2626' } }; else cell.font = { ...cell.font, color: { argb: 'FF15803D' } };
        }
      });
      row.height = 18;
      totalProd += r.produccion; totalDer += r.derechos; totalGas += r.gastos; totalImp += r.total;
      excelRowIndex++;
    });

    // Totals row (after a blank row for clarity?) We'll directly place after last data +1
    const totalRowIndex = excelRowIndex + 1;
    ws.mergeCells(totalRowIndex,1,totalRowIndex,2);
    const totalRow = ws.getRow(totalRowIndex);
    totalRow.getCell(1).value = 'TOTALES';
    totalRow.getCell(1).style = { ...styleTotals, alignment: { horizontal: 'center', vertical: 'middle' } };
    const putTotal = (col,val) => { const c = totalRow.getCell(col); c.value = Math.round(val); c.style = { ...styleMoney, font: { ...styleMoney.font, bold: true } }; };
    putTotal(3,totalProd); putTotal(4,totalDer); putTotal(5,totalGas); putTotal(6,totalImp);
    totalRow.height = 18;

    // Column widths
  [12,14,16,16,16,18].forEach((w,i)=> ws.getColumn(i+1).width = w);
  });

  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const filename = `reporte_diario_${establecimiento.replace(/[^a-zA-Z0-9-_]/g,'_')}_${ts}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  return { success: true, filename };
};

export default { exportarReporteDiarioSala };
