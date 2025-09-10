// Exportador de Liquidación - Formato alineado al script Python
// Usa exceljs para soportar estilos reales (xlsx-style y sheetjs básico no conservan estilos completos en community)

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Orden y nombres EXACTOS de columnas Python
// Empresa, Serial, NUC, Establecimiento, Días transmitidos, Días del mes,
// Primer día transmitido, Último día transmitido, Período Texto, Tipo apuesta,
// Producción, Derechos de Explotación, Gastos de Administración, Total Impuestos, Novedad

const COLUMN_DEFS = [
  { header: 'Empresa', key: 'empresa', width: 18 },
  { header: 'Serial', key: 'serial', width: 14 },
  { header: 'NUC', key: 'nuc', width: 14 },
  { header: 'Establecimiento', key: 'establecimiento', width: 28 },
  { header: 'Días transmitidos', key: 'diasTransmitidos', width: 16 },
  { header: 'Días del mes', key: 'diasMes', width: 14 },
  { header: 'Primer día transmitido', key: 'primerDia', width: 18 },
  { header: 'Último día transmitido', key: 'ultimoDia', width: 18 },
  { header: 'Período Texto', key: 'periodoTexto', width: 16 },
  { header: 'Tipo apuesta', key: 'tipoApuesta', width: 16 },
  { header: 'Producción', key: 'produccion', width: 16 },
  { header: 'Derechos de Explotación', key: 'derechosExplotacion', width: 20 },
  { header: 'Gastos de Administración', key: 'gastosAdministracion', width: 20 },
  { header: 'Total Impuestos', key: 'totalImpuestos', width: 18 },
  { header: 'Novedad', key: 'novedad', width: 18 }
];

// Mapea un registro consolidado JS a estructura canon Python
const mapItem = (item, index) => {
  return {
    empresa: item.empresa || 'SIN EMPRESA',
    serial: item.serial || '',
    nuc: item.nuc || item.NUC || `NUC-${index + 1}`,
    establecimiento: item.establecimiento || item.sala || 'SIN ESTABLECIMIENTO',
    diasTransmitidos: item.diasTransmitidos ?? item['Días transmitidos'] ?? 0,
    diasMes: item.diasMes ?? item['Días del mes'] ?? 0,
    primerDia: item.primerDia || item['Primer día transmitido'] || '',
    ultimoDia: item.ultimoDia || item['Último día transmitido'] || '',
    periodoTexto: item.periodoTexto || item.periodo || item['Período Texto'] || '',
    tipoApuesta: item.tipoApuesta || item['Tipo apuesta'] || item.tipo || '',
    produccion: toNumber(item.produccion || item['Producción'] || item.baseLiquidacion || 0),
    derechosExplotacion: toNumber(item.derechosExplotacion || item['Derechos de Explotación'] || (toNumber(item.produccion) * 0.12)),
    gastosAdministracion: toNumber(item.gastosAdministracion || item['Gastos de Administración'] || (toNumber(item.derechosExplotacion || item.derechos || 0) * 0.01)),
    totalImpuestos: toNumber(item.totalImpuestos || item['Total Impuestos'] || (toNumber(item.derechosExplotacion || 0) + toNumber(item.gastosAdministracion || 0))),
    novedad: item.novedad || item.Novedad || calcularNovedad(item.diasTransmitidos, item.diasMes)
  };
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v.toString().replace(/[^0-9.-]/g, '')) : Number(v);
  return isNaN(n) ? 0 : n;
};

const calcularNovedad = (diasT, diasMes) => {
  const dT = Number(diasT) || 0;
  const dM = Number(diasMes) || 0;
  if (!dT || !dM) return 'Sin información';
  if (dT === dM) return 'Sin cambios';
  if (dT < dM) return 'Retiro / Adición';
  return 'Días extra transmitidos';
};

// Formatos reutilizables
const fmtTitle = { font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } } };
const fmtSubTitle = { font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5F7A' } } };
const fmtHeader = { font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3040' } }, border: { top: { style: 'thin', color: { argb: 'FFCCCCCC' } }, left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, bottom: { style: 'thin', color: { argb: 'FF666666' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } } } };
const fmtDataBase = { font: { name: 'Segoe UI', size: 9, color: { argb: 'FF223344' } }, alignment: { vertical: 'middle', horizontal: 'center', wrapText: false }, border: { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } } };
const fmtDataMoney = { ...fmtDataBase, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0.00' };
const fmtTotalsLabel = { font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0B3040' } }, alignment: { horizontal: 'right', vertical: 'middle' } };
const fmtTotalsNumber = { font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0B3040' } }, alignment: { horizontal: 'right', vertical: 'middle' }, numFmt: '#,##0.00', fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }, border: { top: { style: 'thin', color: { argb: 'FF94A3B8' } }, bottom: { style: 'thin', color: { argb: 'FF64748B' } } } };

export const exportarLiquidacionPythonFormat = async (data, empresaFallback = 'DR GROUP') => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    // Mapear primero (esto es la misma fuente que usa la primera columna 'Empresa')
    const mapped = data.map(mapItem);

    // Determinar empresa del título EXACTAMENTE igual al origen de la primera columna:
    // 1. Si empresaFallback viene con algo distinto a vacío y no es el genérico, úsalo.
    // 2. De lo contrario toma la primera empresa válida de mapped.
    // 3. Si ninguna válida, 'SIN EMPRESA'.
    let empresa = (empresaFallback && empresaFallback.trim()) ? empresaFallback.trim() : '';
    const esGenerico = ['DR GROUP', 'GENERAL'].includes(empresa.toUpperCase?.() || empresa);
    if (!empresa || esGenerico) {
      const firstValid = mapped.find(r => r.empresa && r.empresa !== 'SIN EMPRESA' && r.empresa.trim() !== '');
      if (firstValid) empresa = firstValid.empresa;
    }
    if (!empresa) empresa = 'SIN EMPRESA';

    // Propagar empresa a registros vacíos para mantener consistencia visual
    mapped.forEach(r => { if (!r.empresa || r.empresa === 'SIN EMPRESA') r.empresa = empresa; });

    console.log('[ExcelExport] Empresa fallback recibida:', empresaFallback);
    console.log('[ExcelExport] Empresa final usada para título:', empresa);
    console.log('[ExcelExport] Ejemplos primeras 3 empresas mapeadas:', mapped.slice(0,3).map(m=>m.empresa));

    // Totales
    const totalProduccion = mapped.reduce((s, r) => s + r.produccion, 0);
    const totalDerechos = mapped.reduce((s, r) => s + r.derechosExplotacion, 0);
    const totalGastos = mapped.reduce((s, r) => s + r.gastosAdministracion, 0);
    const totalImpuestos = mapped.reduce((s, r) => s + r.totalImpuestos, 0);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();
    const ws = wb.addWorksheet('Liquidación Consolidada', { views: [{ state: 'frozen', ySplit: 7 }] });

    // Título principal (fila 1) merge A1:O1
    ws.mergeCells(1, 1, 1, COLUMN_DEFS.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = empresa;
    Object.assign(titleCell, { style: fmtTitle });
    ws.getRow(1).height = 30;

    // Subtítulo (fila 2)
    ws.mergeCells(2, 1, 2, COLUMN_DEFS.length);
    const subTitleCell = ws.getCell(2, 1);
    subTitleCell.value = 'Reporte consolidado de liquidación por máquinas';
    Object.assign(subTitleCell, { style: fmtSubTitle });
    ws.getRow(2).height = 22;

  // Línea info métricas (fila 3) - ahora incluye derechos, gastos y total impuestos (derechos + gastos) sin decimales
  ws.mergeCells(3, 1, 3, COLUMN_DEFS.length);
  const infoCell = ws.getCell(3, 1);
  const roundInt = (v) => Math.round(v || 0);
  const prodInt = roundInt(totalProduccion);
  const derInt = roundInt(totalDerechos);
  const gasInt = roundInt(totalGastos);
  const totalImpInt = derInt + gasInt; // suma explícita requerida
  infoCell.value = `Máquinas: ${mapped.length} | Producción Total: ${prodInt.toLocaleString('es-CO')} | Derechos de Explotación: ${derInt.toLocaleString('es-CO')} | Gastos de Administración: ${gasInt.toLocaleString('es-CO')} | Total Impuestos: ${totalImpInt.toLocaleString('es-CO')}`;
  Object.assign(infoCell, { style: { ...fmtSubTitle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }, font: { ...fmtSubTitle.font, size: 10 } } });
  ws.getRow(3).height = 22;

    // Fecha generación (fila 4)
    ws.mergeCells(4, 1, 4, COLUMN_DEFS.length);
    const fechaCell = ws.getCell(4, 1);
    fechaCell.value = `Generado: ${new Date().toLocaleString('es-CO')}`;
    Object.assign(fechaCell, { style: { ...fmtSubTitle, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } }, font: { ...fmtSubTitle.font, size: 10, bold: false } } });
    ws.getRow(4).height = 18;

    // Fila 5 vacía
    ws.getRow(5).height = 5;

    // Insertamos headers en fila 6 y 7? Vamos a colocar headers en fila 7 (dejar fila 6 como separación)
    ws.getRow(6).height = 8;

  // Configurar columnas SIN inyectar headers automáticos (evitamos que sobreescriba fila 1)
  const COLUMNS_NO_HEADER = COLUMN_DEFS.map(({ header, ...rest }) => ({ ...rest }));
  ws.columns = COLUMNS_NO_HEADER;

    // Header (fila 7)
    const headerRowIndex = 7;
    const headerRow = ws.getRow(headerRowIndex);
    COLUMN_DEFS.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      Object.assign(cell, { style: fmtHeader });
    });
    headerRow.height = 28;

    // Datos comienzan en fila 8
    let currentRow = headerRowIndex + 1;
    mapped.forEach((r, i) => {
      const row = ws.getRow(currentRow);
      COLUMN_DEFS.forEach((col, idx) => {
        let value = r[col.key];
        if (['primerDia', 'ultimoDia'].includes(col.key) && value && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) {
          // Convertir DD/MM/YYYY a date excel opcional
          const parts = value.split('/');
          if (parts.length === 3) {
            const [d, m, y] = parts.map(p => parseInt(p, 10));
            const dateObj = new Date(y < 100 ? 2000 + y : y, (m || 1) - 1, d || 1);
            if (!isNaN(dateObj.getTime())) value = dateObj;
          }
        }
        const cell = row.getCell(idx + 1);
        cell.value = value;
        // Estilo alternado
        const baseStyle = (idx >= 10 && idx <= 13) ? fmtDataMoney : fmtDataBase; // columnas monetarias
        cell.style = { ...baseStyle };
        if (i % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        // Ajustes específicos
        if (value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        if (['novedad'].includes(col.key)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
        if (col.key === 'establecimiento') {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
      row.height = 18;
      currentRow++;
    });

    // Totales (fila después de los datos + 1 espacio)
    const totalsStart = currentRow + 1;
    ws.getRow(currentRow).height = 6; // espacio visual
    currentRow++;

    const totalsRow = ws.getRow(currentRow);
    const labelCell = totalsRow.getCell(1);
    ws.mergeCells(currentRow, 1, currentRow, 10); // Merge A..J para etiqueta
    labelCell.value = 'TOTALES GENERALES';
    Object.assign(labelCell, { style: fmtTotalsLabel });

    const setTotal = (colIndex, value) => {
      const c = totalsRow.getCell(colIndex);
      c.value = value;
      c.style = fmtTotalsNumber;
    };

    // Producción (K), Derechos (L), Gastos (M), Total (N)
    setTotal(11, totalProduccion);
    setTotal(12, totalDerechos);
    setTotal(13, totalGastos);
    setTotal(14, totalImpuestos);

    // Ajustar ancho automático para algunas columnas (solo si se quedan pequeñas)
    ws.columns.forEach(col => {
      if (!col.width || col.width < 10) {
        col.width = 12;
      }
    });

    // Aplicar autofiltro en header
    ws.autoFilter = { from: { row: headerRowIndex, column: 1 }, to: { row: headerRowIndex, column: COLUMN_DEFS.length } };

    // Freeze panes (ya definimos ySplit en views) aseguramos también
    ws.views = [{ state: 'frozen', ySplit: 7 }];

    // Generar archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `liquidacion_consolidada_python_format_${timestamp}.xlsx`;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);

    return {
      success: true,
      filename,
      message: `Excel generado (${mapped.length} filas, formato Python)`
    };
  } catch (err) {
    console.error('Error exportando formato Python:', err);
    throw err;
  }
};

export default { exportarLiquidacionPythonFormat };
