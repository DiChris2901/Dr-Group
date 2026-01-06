import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ===== EXPORTACIÓN EXCEL PARA ESTADÍSTICAS DE LIQUIDACIONES =====
// Formato Python profesional (7 filas header, freeze panes, brand colors)
// Siguiendo el estándar de docs/EXCEL_EXPORT_DESIGN_SYSTEM.md

const BRAND_COLORS = {
  titleBg: '0B3040',
  subtitleBg: '1A5F7A',
  metricsBg: '334155',
  dateBg: '475569',
  headerBg: '0B3040',
  white: 'FFFFFF',
  textDark: '223344',
  borderLight: 'E2E8F0',
  borderMedium: 'C0CCDA',
  borderDark: '94A3B8'
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

const fmtDate = {
  font: { name: 'Segoe UI', size: 10, bold: false, color: { argb: argb(BRAND_COLORS.white) } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(BRAND_COLORS.dateBg) } }
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

const fmtDataTextLeft = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'left' } };
const fmtDataNumber = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'center' } };
const fmtDataMoney = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'right' }, numFmt: '"$"#,##0' };
const fmtDataPercent = { ...fmtDataBase, alignment: { ...fmtDataBase.alignment, horizontal: 'center' }, numFmt: '0.0%' };

const applyZebraFill = (cell, isZebra) => {
  if (!isZebra) return;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
};

const applyHeader7Rows = (ws, { title, subtitle, metrics, totalColumns }) => {
  // Freeze panes fila 7
  ws.views = [{ state: 'frozen', ySplit: 7 }];

  // Fila 1: Título
  ws.mergeCells(1, 1, 1, totalColumns);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = 'DR GROUP';
  titleCell.style = fmtTitle;
  ws.getRow(1).height = 30;

  // Fila 2: Subtítulo
  ws.mergeCells(2, 1, 2, totalColumns);
  const subCell = ws.getCell(2, 1);
  subCell.value = title;
  subCell.style = fmtSubTitle;
  ws.getRow(2).height = 22;

  // Fila 3-4: Métricas + Fecha (combinadas para evitar texto apiñado)
  ws.mergeCells(3, 1, 4, totalColumns);
  const metricsCell = ws.getCell(3, 1);
  metricsCell.value = `${metrics}\nGenerado: ${new Date().toLocaleString('es-CO')}`;
  metricsCell.style = {
    ...fmtMetrics,
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
  };
  // Altura combinada (suma aproximada de 2 filas, más holgada)
  ws.getRow(3).height = 34;
  ws.getRow(4).height = 22;

  // Fila 5-6: Espaciadores
  ws.getRow(5).height = 5;
  ws.getRow(6).height = 8;

  // Fila 7: Encabezado de columnas (se llena afuera)
  ws.getRow(7).height = 28;

  // Nota: subtitle param mantiene compatibilidad futura (por ahora va en metrics string)
  void subtitle;
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'string' ? parseFloat(v.toString().replace(/[^0-9.-]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoneyCompact = (value) => {
  const n = Math.round(toNumber(value));
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const buildProduccionImpuestosChartPngDataUrl = async ({ labels, produccion, impuestos, title }) => {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  // Tamaño fijo para que se vea consistente en Excel
  canvas.width = 1100;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Dynamic import para no penalizar carga inicial
  const mod = await import('chart.js/auto');
  const ChartCtor = mod?.default;
  if (!ChartCtor) return null;

  const chart = new ChartCtor(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Producción',
          data: produccion,
          backgroundColor: `#${BRAND_COLORS.titleBg}`,
          borderColor: `#${BRAND_COLORS.titleBg}`,
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Impuestos',
          data: impuestos,
          backgroundColor: `#${BRAND_COLORS.subtitleBg}`,
          borderColor: `#${BRAND_COLORS.subtitleBg}`,
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      plugins: {
        title: {
          display: true,
          text: title,
          color: '#0B3040',
          font: { family: 'Segoe UI', size: 14, weight: '600' }
        },
        legend: {
          position: 'top',
          labels: { font: { family: 'Segoe UI', size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const v = context.parsed?.y ?? 0;
              return `${context.dataset.label}: $${Math.round(v).toLocaleString('es-CO')}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            font: { family: 'Segoe UI', size: 11 },
            maxRotation: 0,
            autoSkip: false
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            font: { family: 'Segoe UI', size: 11 },
            callback: (v) => formatMoneyCompact(v)
          },
          grid: { color: '#E2E8F0' }
        }
      }
    }
  });

  // Asegurar que pinte
  await new Promise((r) => setTimeout(r, 0));
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();
  return dataUrl;
};

export const exportarEstadisticasLiquidaciones = async (
  datosEstadisticos,
  kpis,
  datosGraficos,
  alertas,
  filtros
) => {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();

    const empresaLabel = filtros?.empresa && filtros.empresa !== 'todas' ? filtros.empresa : 'Todas';
    const tipoPeriodoLabel = filtros?.tipoPeriodo || 'N/A';
    const numPeriodos = Array.isArray(datosGraficos) ? datosGraficos.length : 0;
    const prodTotal = toNumber(kpis?.produccionTotal);
    const impTotal = Array.isArray(datosGraficos)
      ? datosGraficos.reduce((acc, r) => acc + toNumber(r?.impuestos), 0)
      : 0;
    const prodProm = toNumber(kpis?.produccionPromedio);
    const prodSala = toNumber(kpis?.produccionPorSala);
    const prodMaquina = toNumber(kpis?.produccionPorMaquina);
    const mesesConsolidados = Number.isFinite(kpis?.mesesTotal) ? kpis.mesesTotal : 0;
    const metricsLine = `Empresa: ${empresaLabel} | Periodos: ${numPeriodos} (${tipoPeriodoLabel}) | Producción Total: $${Math.round(prodTotal).toLocaleString('es-CO')} | Impuestos Total: $${Math.round(impTotal).toLocaleString('es-CO')} | Promedio Periodo: $${Math.round(prodProm).toLocaleString('es-CO')} | Prod/Sala (est.): $${Math.round(prodSala).toLocaleString('es-CO')} | Prod/Máquina (est.): $${Math.round(prodMaquina).toLocaleString('es-CO')} | Meses consolidados: ${mesesConsolidados}`;

    // ===== HOJA 1: RESUMEN (FORMATO PYTHON) =====
    const wsResumen = wb.addWorksheet('Resumen Ejecutivo', { views: [{ state: 'frozen', ySplit: 7 }] });

    const columnsResumen = [
      { header: 'Periodo', key: 'periodoLabel', width: 18 },
      { header: 'Periodo (Key)', key: 'periodoKey', width: 14 },
      { header: 'Producción', key: 'produccion', width: 18 },
      { header: 'Impuestos', key: 'impuestos', width: 18 },
      { header: 'Empresas consolidadas', key: 'empresas', width: 18 },
      { header: 'Salas prom. mensual', key: 'salasProm', width: 18 },
      { header: 'Máquinas prom. mensual', key: 'maquinasProm', width: 20 },
      { header: 'Variación % vs anterior', key: 'variacion', width: 18 }
    ];

    applyHeader7Rows(wsResumen, {
      title: 'Estadísticas de Liquidaciones',
      subtitle: `Análisis comparativo - ${tipoPeriodoLabel}`,
      metrics: metricsLine,
      totalColumns: columnsResumen.length
    });

    // Configurar columnas (sin headers automáticos)
    wsResumen.columns = columnsResumen.map(({ width, key }) => ({ key, width }));

    // Headers fila 7
    columnsResumen.forEach((col, idx) => {
      const cell = wsResumen.getCell(7, idx + 1);
      cell.value = col.header;
      cell.style = fmtHeader;
    });

    // Gráfico (imagen) debajo del header
    const dataRowsStartResumen = 22;
    if (Array.isArray(datosGraficos) && datosGraficos.length > 0) {
      try {
        const labels = datosGraficos.map((r) => r?.periodoLabel ?? String(r?.periodo ?? ''));
        const produccionSeries = datosGraficos.map((r) => Math.round(toNumber(r?.produccion)));
        const impuestosSeries = datosGraficos.map((r) => Math.round(toNumber(r?.impuestos)));
        const pngDataUrl = await buildProduccionImpuestosChartPngDataUrl({
          labels,
          produccion: produccionSeries,
          impuestos: impuestosSeries,
          title: 'Producción vs Impuestos por período'
        });
        if (pngDataUrl) {
          const imageId = wb.addImage({ base64: pngDataUrl, extension: 'png' });
          wsResumen.addImage(imageId, 'A8:H20');
        }
      } catch (e) {
        console.warn('⚠️ No se pudo generar/incrustar el gráfico en Excel:', e);
      }
    }

    // Datos desde fila 8
    let rowIndex = dataRowsStartResumen;
    if (Array.isArray(datosGraficos) && datosGraficos.length > 0) {
      datosGraficos.forEach((r, idx) => {
        const zebra = idx % 2 === 0;

        const periodoKey = r?.periodo ?? '';
        const periodoLabel = r?.periodoLabel ?? String(periodoKey);
        const produccion = Math.round(toNumber(r?.produccion));
        const impuestos = Math.round(toNumber(r?.impuestos));
        const empresas = Math.round(toNumber(r?.empresasConsolidadas));
        const salasProm = Math.round(toNumber(r?.salasPromedioMensual));
        const maquinasProm = Math.round(toNumber(r?.maquinasPromedioMensual));

        let variacionFraction = null;
        if (idx > 0) {
          const anterior = toNumber(datosGraficos[idx - 1]?.produccion);
          variacionFraction = anterior > 0 ? (produccion - anterior) / anterior : null;
        }

        const row = wsResumen.getRow(rowIndex);
        row.getCell(1).value = periodoLabel;
        row.getCell(1).style = fmtDataTextLeft;
        applyZebraFill(row.getCell(1), zebra);

        row.getCell(2).value = String(periodoKey);
        row.getCell(2).style = fmtDataTextLeft;
        applyZebraFill(row.getCell(2), zebra);

        row.getCell(3).value = produccion;
        row.getCell(3).style = fmtDataMoney;
        applyZebraFill(row.getCell(3), zebra);

        row.getCell(4).value = impuestos;
        row.getCell(4).style = fmtDataMoney;
        applyZebraFill(row.getCell(4), zebra);

        row.getCell(5).value = empresas;
        row.getCell(5).style = fmtDataNumber;
        applyZebraFill(row.getCell(5), zebra);

        row.getCell(6).value = salasProm;
        row.getCell(6).style = fmtDataNumber;
        applyZebraFill(row.getCell(6), zebra);

        row.getCell(7).value = maquinasProm;
        row.getCell(7).style = fmtDataNumber;
        applyZebraFill(row.getCell(7), zebra);

        if (variacionFraction === null) {
          row.getCell(8).value = 'N/A';
          row.getCell(8).style = fmtDataNumber;
        } else {
          row.getCell(8).value = variacionFraction;
          row.getCell(8).style = fmtDataPercent;
        }
        applyZebraFill(row.getCell(8), zebra);

        row.height = 18;
        rowIndex++;
      });
    }


    // ===== HOJA 2: DETALLE (RAW) =====
    // Mantiene el mismo estándar visual para consistencia.
    if (datosEstadisticos && Object.keys(datosEstadisticos).length > 0) {
      const wsDetalle = wb.addWorksheet('Detalle por Período', { views: [{ state: 'frozen', ySplit: 7 }] });

      const columnsDetalle = [
        { header: 'Periodo (Key)', key: 'periodoKey', width: 14 },
        { header: 'Producción', key: 'produccion', width: 18 },
        { header: 'Impuestos', key: 'impuestos', width: 18 },
        { header: 'Empresas consolidadas', key: 'empresas', width: 18 },
        { header: 'Salas prom. mensual', key: 'salasProm', width: 18 },
        { header: 'Máquinas prom. mensual', key: 'maquinasProm', width: 20 }
      ];

      applyHeader7Rows(wsDetalle, {
        title: 'Detalle por Período - Estadísticas de Liquidaciones',
        subtitle: `Empresa: ${empresaLabel} - ${tipoPeriodoLabel}`,
        metrics: metricsLine,
        totalColumns: columnsDetalle.length
      });

      wsDetalle.columns = columnsDetalle.map(({ width, key }) => ({ key, width }));
      columnsDetalle.forEach((col, idx) => {
        const cell = wsDetalle.getCell(7, idx + 1);
        cell.value = col.header;
        cell.style = fmtHeader;
      });

      // Gráfico (imagen) debajo del header
      const dataRowsStartDetalle = 22;
      if (Array.isArray(datosGraficos) && datosGraficos.length > 0) {
        try {
          const labels = datosGraficos.map((r) => r?.periodoLabel ?? String(r?.periodo ?? ''));
          const produccionSeries = datosGraficos.map((r) => Math.round(toNumber(r?.produccion)));
          const impuestosSeries = datosGraficos.map((r) => Math.round(toNumber(r?.impuestos)));
          const pngDataUrl = await buildProduccionImpuestosChartPngDataUrl({
            labels,
            produccion: produccionSeries,
            impuestos: impuestosSeries,
            title: 'Producción vs Impuestos por período'
          });
          if (pngDataUrl) {
            const imageId = wb.addImage({ base64: pngDataUrl, extension: 'png' });
            wsDetalle.addImage(imageId, 'A8:F20');
          }
        } catch (e) {
          console.warn('⚠️ No se pudo generar/incrustar el gráfico en Excel (detalle):', e);
        }
      }

      let rIdx = dataRowsStartDetalle;
      Object.keys(datosEstadisticos)
        .sort()
        .forEach((key, idx) => {
          const zebra = idx % 2 === 0;
          const data = datosEstadisticos[key] || {};
          const row = wsDetalle.getRow(rIdx);

          row.getCell(1).value = String(key);
          row.getCell(1).style = fmtDataTextLeft;
          applyZebraFill(row.getCell(1), zebra);

          row.getCell(2).value = Math.round(toNumber(data.produccion));
          row.getCell(2).style = fmtDataMoney;
          applyZebraFill(row.getCell(2), zebra);

          row.getCell(3).value = Math.round(toNumber(data.impuestos));
          row.getCell(3).style = fmtDataMoney;
          applyZebraFill(row.getCell(3), zebra);

          row.getCell(4).value = Math.round(toNumber(data.documentos));
          row.getCell(4).style = fmtDataNumber;
          applyZebraFill(row.getCell(4), zebra);

          row.getCell(5).value = Math.round(toNumber(data.salasPromedioMensual));
          row.getCell(5).style = fmtDataNumber;
          applyZebraFill(row.getCell(5), zebra);

          row.getCell(6).value = Math.round(toNumber(data.maquinasPromedioMensual));
          row.getCell(6).style = fmtDataNumber;
          applyZebraFill(row.getCell(6), zebra);

          row.height = 18;
          rIdx++;
        });
    }

    // ===== GENERAR Y DESCARGAR =====
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fecha = new Date().toISOString().split('T')[0];
    const nombreEmpresa = empresaLabel !== 'Todas' ? empresaLabel.replace(/\s+/g, '_') : 'Todas';
    const nombreArchivo = `Estadisticas_Liquidaciones_${nombreEmpresa}_${fecha}.xlsx`;

    saveAs(blob, nombreArchivo);

    return {
      success: true,
      message: `Estadísticas exportadas: ${nombreArchivo}`,
      fileName: nombreArchivo
    };
  } catch (error) {
    console.error('Error exportando estadísticas:', error);
    return {
      success: false,
      message: `Error al exportar: ${error.message}`
    };
  }
};

export default { exportarEstadisticasLiquidaciones };
