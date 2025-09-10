import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const HEADER_STYLE = {
  font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } },
  border: { top: { style: 'thin', color: { argb: 'FFCCCCCC' } }, left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, bottom: { style: 'thin', color: { argb: 'FF666666' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } } }
};
const TITLE_STYLE = { font: { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } } };
const SUBTITLE_STYLE = { font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5F7A' } } };
const METRICS_STYLE = { font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } } };
const DATE_STYLE = { font: { name: 'Segoe UI', size: 10, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } } };

const DATA_BASE = { font: { name: 'Segoe UI', size: 9, color: { argb: 'FF223344' } }, alignment: { vertical: 'middle', horizontal: 'center' }, border: { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } } };
const MONEY_STYLE = { ...DATA_BASE, alignment: { vertical: 'middle', horizontal: 'right' }, numFmt: '"$"#,##0' };

const COLUMNS = [
  { header: 'Establecimiento', key: 'establecimiento', width: 28 },
  { header: 'Empresa', key: 'empresa', width: 20 },
  { header: 'Total Máquinas', key: 'totalMaquinas', width: 14 },
  { header: 'Producción', key: 'produccion', width: 18 },
  { header: 'Derechos de Explotación', key: 'derechosExplotacion', width: 20 },
  { header: 'Gastos de Administración', key: 'gastosAdministracion', width: 20 },
  { header: 'Total Impuestos', key: 'totalImpuestos', width: 18 },
  { header: 'Promedio/Establecimiento', key: 'promedioEstablecimiento', width: 22 }
];

export async function exportarReporteSalaFormato(salasData, salaSeleccionada, empresa) {
  if (!Array.isArray(salasData) || salasData.length === 0) throw new Error('No hay datos de sala para exportar');
  const row = salasData[0];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte Sala', { views: [{ state: 'frozen', ySplit: 6 }] });

  ws.mergeCells(1,1,1,COLUMNS.length);
  const titleCell = ws.getCell(1,1);
  titleCell.value = salaSeleccionada;
  Object.assign(titleCell, { style: TITLE_STYLE });
  ws.getRow(1).height = 26;

  ws.mergeCells(2,1,2,COLUMNS.length);
  const subCell = ws.getCell(2,1);
  subCell.value = 'Reporte agregado por sala';
  Object.assign(subCell, { style: SUBTITLE_STYLE });
  ws.getRow(2).height = 20;

  ws.mergeCells(3,1,3,COLUMNS.length);
  const metrics = ws.getCell(3,1);
  metrics.value = `Máquinas: ${row.totalMaquinas} | Producción Total: $${Math.round(row.produccion).toLocaleString('es-CO')} | Derechos: $${Math.round(row.derechosExplotacion).toLocaleString('es-CO')} | Gastos: $${Math.round(row.gastosAdministracion).toLocaleString('es-CO')} | Total Impuestos: $${Math.round(row.totalImpuestos).toLocaleString('es-CO')}`;
  Object.assign(metrics, { style: METRICS_STYLE });
  ws.getRow(3).height = 18;

  ws.mergeCells(4,1,4,COLUMNS.length);
  const fecha = ws.getCell(4,1);
  fecha.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
  Object.assign(fecha, { style: DATE_STYLE });
  ws.getRow(4).height = 16;

  ws.getRow(5).height = 6;

  ws.columns = COLUMNS.map(({ header, key, width }) => ({ key, width }));
  const headerRow = ws.getRow(6);
  COLUMNS.forEach((c, i) => { const cell = headerRow.getCell(i+1); cell.value = c.header; cell.style = HEADER_STYLE; });
  headerRow.height = 24;

  const dataRow = ws.getRow(7);
  COLUMNS.forEach((c, i) => {
    let val = row[c.key];
    if (['produccion','derechosExplotacion','gastosAdministracion','totalImpuestos','promedioEstablecimiento'].includes(c.key)) val = Math.round(val||0);
    const cell = dataRow.getCell(i+1);
    cell.value = val;
    const isMoney = ['produccion','derechosExplotacion','gastosAdministracion','totalImpuestos','promedioEstablecimiento'].includes(c.key);
    cell.style = isMoney ? { ...MONEY_STYLE } : { ...DATA_BASE };
    if (isMoney) {
      if (val < 0) cell.font = { ...cell.font, color: { argb: 'FFDC2626' } }; else cell.font = { ...cell.font, color: { argb: 'FF15803D' } };
    }
    if (c.key === 'establecimiento') cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });
  dataRow.height = 20;

  COLUMNS.forEach((col, idx) => {
    const column = ws.getColumn(idx+1);
    let max = col.header.length;
    [titleCell, subCell, metrics, fecha, headerRow.getCell(idx+1), dataRow.getCell(idx+1)].forEach(cell => {
      const v = cell.value ? cell.value.toString() : '';
      if (v.length > max) max = v.length;
    });
    column.width = Math.min(50, Math.max(8, max + 2));
  });

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Reporte_Sala_${salaSeleccionada.replace(/[^a-zA-Z0-9-_]/g,'_')}_${new Date().toISOString().replace(/[:.]/g,'-')}.xlsx`;
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  return { success: true, filename };
}

export default { exportarReporteSalaFormato };
