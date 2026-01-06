import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Exportación Excel: Comparativo por Sala (cuando hay empresa filtrada)
// Formato alineado a docs/EXCEL_EXPORT_DESIGN_SYSTEM.md (7 filas header, freeze panes, fuente Segoe UI)

const BRAND_COLORS = {
  titleBg: '0B3040',
  subtitleBg: '1A5F7A',
  metricsBg: '334155',
  headerBg: '0B3040',
  white: 'FFFFFF',
  textDark: '223344',
  borderLight: 'E2E8F0',
  borderMedium: 'C0CCDA'
};

const argb = (hexNoAlpha) => `FF${hexNoAlpha}`;

const fmtTitle = {
  font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: argb(BRAND_COLORS.white) } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND_COLORS.titleBg) } }
};

const fmtSubTitle = {
  font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: argb(BRAND_COLORS.white) } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND_COLORS.subtitleBg) } }
};

const fmtMetrics = {
  font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: argb(BRAND_COLORS.white) } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND_COLORS.metricsBg) } }
};

const fmtHeader = {
  font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: argb(BRAND_COLORS.white) } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND_COLORS.headerBg) } },
  border: {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FF666666' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  }
};

const fmtDataBase = {
  font: { name: 'Segoe UI', size: 9, color: { argb: argb(BRAND_COLORS.textDark) } },
  alignment: { vertical: 'middle', wrapText: false },
  border: {
    top: { style: 'thin', color: { argb: argb(BRAND_COLORS.borderLight) } },
    left: { style: 'thin', color: { argb: argb(BRAND_COLORS.borderLight) } },
    bottom: { style: 'thin', color: { argb: argb(BRAND_COLORS.borderMedium) } },
    right: { style: 'thin', color: { argb: argb(BRAND_COLORS.borderLight) } }
  }
};

const fmtTextLeft = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'left' } };
const fmtNumber = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'center' } };
const fmtMoney = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'right' }, numFmt: '"$"#,##0' };
const fmtPercent = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'center' }, numFmt: '0.0%' };

const makeTotalStyle = (baseStyle) => ({
  ...baseStyle,
  font: { ...(baseStyle.font || {}), name: 'Segoe UI', size: 9, bold: true, color: { argb: argb(BRAND_COLORS.textDark) } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND_COLORS.borderLight) } }
});

const fmtTotalTextLeft = makeTotalStyle(fmtTextLeft);
const fmtTotalNumber = makeTotalStyle(fmtNumber);
const fmtTotalMoney = makeTotalStyle(fmtMoney);
const fmtTotalPercent = makeTotalStyle(fmtPercent);

const applyZebraFill = (cell, isZebra) => {
  if (!isZebra) return;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
};

const applyHeader7Rows = (ws, { title, subtitle, metrics, totalColumns }) => {
  ws.views = [{ state: 'frozen', ySplit: 7 }];

  ws.mergeCells(1, 1, 1, totalColumns);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = 'DR GROUP';
  titleCell.style = fmtTitle;
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, totalColumns);
  const subCell = ws.getCell(2, 1);
  subCell.value = title;
  subCell.style = fmtSubTitle;
  ws.getRow(2).height = 22;

  ws.mergeCells(3, 1, 4, totalColumns);
  const metricsCell = ws.getCell(3, 1);
  metricsCell.value = `${metrics}\nGenerado: ${new Date().toLocaleString('es-CO')}`;
  metricsCell.style = fmtMetrics;
  ws.getRow(3).height = 34;
  ws.getRow(4).height = 22;

  ws.getRow(5).height = 5;
  ws.getRow(6).height = 8;
  ws.getRow(7).height = 28;

  void subtitle;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v.toString().replace(/[^0-9.-]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const exportarComparativoSalaExcel = async ({
  empresa,
  tipoPeriodo,
  comparativoPorSala
}) => {
  try {
    const rows = Array.isArray(comparativoPorSala) ? comparativoPorSala : [];
    const empresaLabel = (empresa ?? '').toString().trim() || 'N/A';
    const tipoPeriodoLabel = (tipoPeriodo ?? '').toString().trim() || 'N/A';

    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();

    const ws = wb.addWorksheet('Comparativo Salas', { views: [{ state: 'frozen', ySplit: 7 }] });

    const columns = [
      { header: 'Sala', key: 'sala', width: 28 },
      { header: 'Producción (rango)', key: 'prodRango', width: 20 },
      { header: 'Producción (último mes)', key: 'prodUlt', width: 22 },
      { header: '% vs mes anterior', key: 'cambio', width: 16 },
      { header: 'Impuestos (rango)', key: 'impRango', width: 20 },
      { header: 'Máquinas (prom. mensual)', key: 'maqProm', width: 22 }
    ];

    const totalProduccionRango = rows.reduce((acc, r) => acc + toNumber(r?.produccionRango), 0);
    const totalProduccionUlt = rows.reduce((acc, r) => acc + toNumber(r?.produccionUltimoMes), 0);
    const totalImpuestosRango = rows.reduce((acc, r) => acc + toNumber(r?.impuestosRango), 0);
    const avgMaquinas = rows.length > 0 ? rows.reduce((acc, r) => acc + toNumber(r?.maquinasPromedioMensual), 0) / rows.length : 0;

    const metricsLine = `Empresa: ${empresaLabel} | Periodo: ${tipoPeriodoLabel} | Salas: ${rows.length} | Producción (rango): $${Math.round(totalProduccionRango).toLocaleString('es-CO')} | Producción (último mes): $${Math.round(totalProduccionUlt).toLocaleString('es-CO')} | Impuestos (rango): $${Math.round(totalImpuestosRango).toLocaleString('es-CO')}`;

    applyHeader7Rows(ws, {
      title: `Comparativo por Sala - ${empresaLabel}`,
      subtitle: `Periodo: ${tipoPeriodoLabel}`,
      metrics: metricsLine,
      totalColumns: columns.length
    });

    ws.columns = columns.map(({ width, key }) => ({ key, width }));

    columns.forEach((col, idx) => {
      const cell = ws.getCell(7, idx + 1);
      cell.value = col.header;
      cell.style = fmtHeader;
    });

    let rowIndex = 8;
    rows.forEach((r, idx) => {
      const zebra = idx % 2 === 0;
      const sala = (r?.sala ?? '').toString();
      const prodRango = Math.round(toNumber(r?.produccionRango));
      const prodUlt = Math.round(toNumber(r?.produccionUltimoMes));
      const impRango = Math.round(toNumber(r?.impuestosRango));
      const maqProm = Math.round(toNumber(r?.maquinasPromedioMensual));
      const cambioPct = Number.isFinite(r?.cambioPct) ? r.cambioPct : null;

      const row = ws.getRow(rowIndex);

      row.getCell(1).value = sala;
      row.getCell(1).style = fmtTextLeft;
      applyZebraFill(row.getCell(1), zebra);

      row.getCell(2).value = prodRango;
      row.getCell(2).style = fmtMoney;
      applyZebraFill(row.getCell(2), zebra);

      row.getCell(3).value = prodUlt;
      row.getCell(3).style = fmtMoney;
      applyZebraFill(row.getCell(3), zebra);

      if (cambioPct === null) {
        row.getCell(4).value = 'N/A';
        row.getCell(4).style = fmtNumber;
      } else {
        row.getCell(4).value = cambioPct / 100;
        row.getCell(4).style = fmtPercent;
      }
      applyZebraFill(row.getCell(4), zebra);

      row.getCell(5).value = impRango;
      row.getCell(5).style = fmtMoney;
      applyZebraFill(row.getCell(5), zebra);

      row.getCell(6).value = maqProm;
      row.getCell(6).style = fmtNumber;
      applyZebraFill(row.getCell(6), zebra);

      row.height = 18;
      rowIndex++;
    });

    // Fila TOTAL
    if (rows.length > 0) {
      const totalRow = ws.getRow(rowIndex);
      totalRow.getCell(1).value = 'TOTAL';
      totalRow.getCell(1).style = fmtTotalTextLeft;

      totalRow.getCell(2).value = Math.round(totalProduccionRango);
      totalRow.getCell(2).style = fmtTotalMoney;

      totalRow.getCell(3).value = Math.round(totalProduccionUlt);
      totalRow.getCell(3).style = fmtTotalMoney;

      totalRow.getCell(4).value = 'N/A';
      totalRow.getCell(4).style = fmtTotalNumber;

      totalRow.getCell(5).value = Math.round(totalImpuestosRango);
      totalRow.getCell(5).style = fmtTotalMoney;

      totalRow.getCell(6).value = Math.round(avgMaquinas);
      totalRow.getCell(6).style = fmtTotalNumber;

      totalRow.height = 20;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fecha = new Date().toISOString().split('T')[0];
    const safeEmpresa = empresaLabel.replace(/\s+/g, '_');
    const nombreArchivo = `Comparativo_Salas_${safeEmpresa}_${fecha}.xlsx`;

    saveAs(blob, nombreArchivo);

    return {
      success: true,
      message: `Comparativo exportado: ${nombreArchivo}`,
      fileName: nombreArchivo
    };
  } catch (error) {
    console.error('Error exportando comparativo por sala:', error);
    return {
      success: false,
      message: `Error al exportar: ${error.message}`
    };
  }
};

export default { exportarComparativoSalaExcel };
