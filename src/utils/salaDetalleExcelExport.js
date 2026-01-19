import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Exportación Excel: Detalle por Sala (histórico + máquinas)
// Bajo demanda desde la tabla "Comparativo por Sala".

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

const CHANGE_COLORS = {
  positive: 'FF15803D',
  negative: 'FFB91C1C'
};

const applyZebraFill = (cell, isZebra) => {
  if (!isZebra) return;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
};

const applyHeader7Rows = (ws, { title, metrics, totalColumns }) => {
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
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v.toString().replace(/[^0-9.-]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizarSalaKey = (texto) => {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const normalizarTexto = (texto) => {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
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

const extractMachine = (m, index) => {
  const serial = m?.serial || m?.Serial || 'N/A';
  const nucRaw = m?.nuc ?? m?.NUC ?? null;
  const nuc = nucRaw != null ? String(nucRaw) : 'N/A';
  const tipoApuesta = m?.tipoApuesta || m?.tipo_apuesta || m?.tipo || 'N/A';
  return {
    serial,
    nuc,
    tipoApuesta,
    produccion: toNumber(m?.produccion),
    impuestos: toNumber(m?.totalImpuestos ?? m?.impuestos),
    _fallbackKey: `${serial}_${nuc}_${index}`
  };
};

export const exportarDetalleSalaExcel = async ({
  empresa,
  sala,
  tipoPeriodo,
  periodosIncluidos,
  liquidacionesPorSala
}) => {
  try {
    const empresaLabel = (empresa ?? '').toString().trim() || 'N/A';
    const salaLabel = (sala ?? '').toString().trim() || 'N/A';
    const tipoPeriodoLabel = (tipoPeriodo ?? '').toString().trim() || 'N/A';

    // En la página estos periodos vienen DESC (último primero)
    const periodosRaw = Array.isArray(periodosIncluidos) ? periodosIncluidos : [];
    const periodosDesc = periodosRaw.map((p) => String(p || '').trim()).filter(Boolean);
    const periodosDescSorted = [...new Set(periodosDesc)].sort((a, b) => {
      const sa = periodoLiquidacionScore(a);
      const sb = periodoLiquidacionScore(b);
      if (sa === null && sb === null) return String(b).localeCompare(String(a));
      if (sa === null) return 1;
      if (sb === null) return -1;
      return sb - sa;
    });

    const periodos = [...periodosDescSorted].sort((a, b) => {
      const sa = periodoLiquidacionScore(a);
      const sb = periodoLiquidacionScore(b);
      if (sa === null && sb === null) return String(a).localeCompare(String(b));
      if (sa === null) return -1;
      if (sb === null) return 1;
      return sa - sb;
    });

    const periodoUltimo = periodosDescSorted[0] || '';
    const periodoAnterior = periodosDescSorted.length > 1 ? periodosDescSorted[1] : '';

    const salaNorm = normalizarSalaKey(salaLabel);
    const docsSala = (Array.isArray(liquidacionesPorSala) ? liquidacionesPorSala : []).filter((d) => {
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

    // ===== Construir histórico por período (sala) =====
    const historico = periodos.map((p) => {
      const doc = docByPeriodo.get(p);
      const produccion = Math.round(toNumber(doc?.metricas?.totalProduccion));
      const impuestos = Math.round(toNumber(doc?.metricas?.totalImpuestos));
      const maquinas = Math.round(toNumber(doc?.metricas?.totalMaquinas ?? doc?.metricas?.maquinasConsolidadas));
      return {
        periodoKey: p,
        periodoLabel: formatPeriodoLiquidacionLabel(p),
        produccion,
        impuestos,
        maquinas
      };
    });

    const totalProduccion = historico.reduce((acc, r) => acc + toNumber(r.produccion), 0);
    const totalImpuestos = historico.reduce((acc, r) => acc + toNumber(r.impuestos), 0);
    const avgMaquinas = historico.length ? historico.reduce((acc, r) => acc + toNumber(r.maquinas), 0) / historico.length : 0;

    // ===== Construir máquinas acumuladas en rango + producción por mes =====
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
            produccionPorPeriodo: {}
          });
        }

        const item = acc.get(stableKey);
        item.produccionRango += base.produccion;
        item.impuestosRango += base.impuestos;
        item.produccionPorPeriodo[p] = (item.produccionPorPeriodo[p] || 0) + base.produccion;
      });
    }

    const maquinasRango = Array.from(acc.values())
      .map((m) => {
        // Calcular promedio mensual de producción
        const totalMeses = periodos.length;
        const promedioMensual = totalMeses > 0 ? m.produccionRango / totalMeses : 0;
        
        return { ...m, promedioMensual };
      })
      .sort((a, b) => (b.produccionRango || 0) - (a.produccionRango || 0));

    const totalProduccionMaquinas = maquinasRango.reduce((acc, r) => acc + toNumber(r.produccionRango), 0);
    const totalImpuestosMaquinas = maquinasRango.reduce((acc, r) => acc + toNumber(r.impuestosRango), 0);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();

    // ===== Hoja 1: Sala (histórico) =====
    const wsSala = wb.addWorksheet('Sala - Histórico', { views: [{ state: 'frozen', ySplit: 7 }] });
    const salaCols = [
      { header: 'Periodo', key: 'periodoLabel', width: 18 },
      { header: 'Periodo (Key)', key: 'periodoKey', width: 14 },
      { header: 'Producción', key: 'produccion', width: 18 },
      { header: 'Impuestos', key: 'impuestos', width: 18 },
      { header: 'Máquinas', key: 'maquinas', width: 12 }
    ];

    const metricsLineSala = `Empresa: ${empresaLabel} | Sala: ${salaLabel} | Periodo: ${tipoPeriodoLabel} | Meses: ${periodos.length} | Producción total: $${Math.round(totalProduccion).toLocaleString('es-CO')} | Impuestos total: $${Math.round(totalImpuestos).toLocaleString('es-CO')} | Máquinas prom.: ${Math.round(avgMaquinas).toLocaleString('es-CO')}`;
    applyHeader7Rows(wsSala, {
      title: `Detalle de Sala - ${salaLabel}`,
      metrics: metricsLineSala,
      totalColumns: salaCols.length
    });

    wsSala.columns = salaCols.map(({ width, key }) => ({ key, width }));
    salaCols.forEach((col, idx) => {
      const cell = wsSala.getCell(7, idx + 1);
      cell.value = col.header;
      cell.style = fmtHeader;
    });

    let salaRowIndex = 8;
    historico.forEach((r, idx) => {
      const zebra = idx % 2 === 0;
      const row = wsSala.getRow(salaRowIndex);

      row.getCell(1).value = r.periodoLabel;
      row.getCell(1).style = fmtTextLeft;
      applyZebraFill(row.getCell(1), zebra);

      row.getCell(2).value = r.periodoKey;
      row.getCell(2).style = fmtTextLeft;
      applyZebraFill(row.getCell(2), zebra);

      row.getCell(3).value = r.produccion;
      row.getCell(3).style = fmtMoney;
      applyZebraFill(row.getCell(3), zebra);

      row.getCell(4).value = r.impuestos;
      row.getCell(4).style = fmtMoney;
      applyZebraFill(row.getCell(4), zebra);

      row.getCell(5).value = r.maquinas;
      row.getCell(5).style = fmtNumber;
      applyZebraFill(row.getCell(5), zebra);

      row.height = 18;
      salaRowIndex++;
    });

    if (historico.length > 0) {
      const totalRow = wsSala.getRow(salaRowIndex);
      totalRow.getCell(1).value = 'TOTAL';
      totalRow.getCell(1).style = fmtTotalTextLeft;

      totalRow.getCell(2).value = '';
      totalRow.getCell(2).style = fmtTotalTextLeft;

      totalRow.getCell(3).value = Math.round(totalProduccion);
      totalRow.getCell(3).style = fmtTotalMoney;

      totalRow.getCell(4).value = Math.round(totalImpuestos);
      totalRow.getCell(4).style = fmtTotalMoney;

      totalRow.getCell(5).value = Math.round(avgMaquinas);
      totalRow.getCell(5).style = fmtTotalNumber;

      totalRow.height = 20;
    }

    // ===== Hoja 2: Máquinas (producción por mes) =====
    const wsMaq = wb.addWorksheet('Máquinas - Detalle', { views: [{ state: 'frozen', ySplit: 7 }] });
    const monthCols = periodos.map((p) => ({
      header: `Prod. ${formatPeriodoLiquidacionLabel(p)}`,
      key: `prod_${p}`,
      width: 16,
      periodo: p
    }));

    const maqCols = [
      { header: 'Serial', key: 'serial', width: 16 },
      { header: 'NUC', key: 'nuc', width: 16 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      ...monthCols,
      { header: 'Producción (rango)', key: 'prodRango', width: 18 },
      { header: 'Impuestos (rango)', key: 'impRango', width: 18 },
      { header: 'Producción (prom. mensual)', key: 'promedio', width: 20 }
    ];

    const metricsLineMaq = `Empresa: ${empresaLabel} | Sala: ${salaLabel} | Periodo: ${tipoPeriodoLabel} | Máquinas: ${maquinasRango.length} | Producción (rango): $${Math.round(totalProduccionMaquinas).toLocaleString('es-CO')} | Impuestos (rango): $${Math.round(totalImpuestosMaquinas).toLocaleString('es-CO')}`;
    applyHeader7Rows(wsMaq, {
      title: `Máquinas - ${salaLabel}`,
      metrics: metricsLineMaq,
      totalColumns: maqCols.length
    });

    wsMaq.columns = maqCols.map(({ width, key }) => ({ key, width }));
    maqCols.forEach((col, idx) => {
      const cell = wsMaq.getCell(7, idx + 1);
      cell.value = col.header;
      cell.style = fmtHeader;
    });

    let maqRowIndex = 8;
    maquinasRango.forEach((m, idx) => {
      const zebra = idx % 2 === 0;
      const row = wsMaq.getRow(maqRowIndex);

      let colIndex = 1;

      row.getCell(colIndex).value = m.serial;
      row.getCell(colIndex).style = fmtTextLeft;
      applyZebraFill(row.getCell(colIndex), zebra);
      colIndex++;

      row.getCell(colIndex).value = m.nuc;
      row.getCell(colIndex).style = fmtTextLeft;
      applyZebraFill(row.getCell(colIndex), zebra);
      colIndex++;

      row.getCell(colIndex).value = m.tipoApuesta || 'N/A';
      row.getCell(colIndex).style = fmtTextLeft;
      applyZebraFill(row.getCell(colIndex), zebra);
      colIndex++;

      // Producción por mes (en el mismo orden del filtro)
      for (const p of periodos) {
        row.getCell(colIndex).value = Math.round(toNumber(m.produccionPorPeriodo?.[p]));
        row.getCell(colIndex).style = fmtMoney;
        applyZebraFill(row.getCell(colIndex), zebra);
        colIndex++;
      }

      row.getCell(colIndex).value = Math.round(toNumber(m.produccionRango));
      row.getCell(colIndex).style = fmtMoney;
      applyZebraFill(row.getCell(colIndex), zebra);
      colIndex++;

      row.getCell(colIndex).value = Math.round(toNumber(m.impuestosRango));
      row.getCell(colIndex).style = fmtMoney;
      applyZebraFill(row.getCell(colIndex), zebra);
      colIndex++;

      // Promedio mensual
      row.getCell(colIndex).value = Math.round(toNumber(m.promedioMensual));
      row.getCell(colIndex).style = fmtMoney;
      applyZebraFill(row.getCell(colIndex), zebra);

      row.height = 18;
      maqRowIndex++;
    });

    if (maquinasRango.length > 0) {
      const totalByPeriodo = {};
      for (const p of periodos) totalByPeriodo[p] = 0;
      maquinasRango.forEach((m) => {
        for (const p of periodos) {
          totalByPeriodo[p] += toNumber(m.produccionPorPeriodo?.[p]);
        }
      });

      // Promedio general mensual
      const promedioGeneralMensual = periodos.length > 0 ? totalProduccionMaquinas / periodos.length : 0;

      const totalRow = wsMaq.getRow(maqRowIndex);
      let colIndex = 1;

      totalRow.getCell(colIndex).value = 'TOTAL';
      totalRow.getCell(colIndex).style = fmtTotalTextLeft;
      colIndex++;

      totalRow.getCell(colIndex).value = '';
      totalRow.getCell(colIndex).style = fmtTotalTextLeft;
      colIndex++;

      totalRow.getCell(colIndex).value = '';
      totalRow.getCell(colIndex).style = fmtTotalTextLeft;
      colIndex++;

      for (const p of periodos) {
        totalRow.getCell(colIndex).value = Math.round(totalByPeriodo[p]);
        totalRow.getCell(colIndex).style = fmtTotalMoney;
        colIndex++;
      }

      totalRow.getCell(colIndex).value = Math.round(totalProduccionMaquinas);
      totalRow.getCell(colIndex).style = fmtTotalMoney;
      colIndex++;

      totalRow.getCell(colIndex).value = Math.round(totalImpuestosMaquinas);
      totalRow.getCell(colIndex).style = fmtTotalMoney;
      colIndex++;

      // Promedio mensual general
      totalRow.getCell(colIndex).value = Math.round(promedioGeneralMensual);
      totalRow.getCell(colIndex).style = fmtTotalMoney;

      totalRow.height = 20;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fecha = new Date().toISOString().split('T')[0];
    const safeEmpresa = empresaLabel.replace(/\s+/g, '_');
    const safeSala = salaLabel.replace(/\s+/g, '_');
    const nombreArchivo = `Detalle_Sala_${safeEmpresa}_${safeSala}_${fecha}.xlsx`;

    saveAs(blob, nombreArchivo);

    return {
      success: true,
      message: `Detalle de sala exportado: ${nombreArchivo}`,
      fileName: nombreArchivo
    };
  } catch (error) {
    console.error('Error exportando detalle por sala:', error);
    return {
      success: false,
      message: `Error al exportar: ${error.message}`
    };
  }
};

export default { exportarDetalleSalaExcel };
