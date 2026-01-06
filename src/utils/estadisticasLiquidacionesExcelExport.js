import ExcelJS from 'exceljs';

// ===== EXPORTACIÓN EXCEL PARA ESTADÍSTICAS DE LIQUIDACIONES =====
// Formato Python profesional (7 filas header, freeze panes, brand colors)
// Siguiendo el estándar de docs/EXCEL_EXPORT_DESIGN_SYSTEM.md

const BRAND_COLORS = {
  primary: '667EEA',
  secondary: '764BA2',
  accent: 'F093FB',
  dark: '1A202C',
  light: 'F7FAFC',
  success: '48BB78',
  warning: 'ECC94B',
  error: 'F56565'
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

    // ===== HOJA 1: RESUMEN EJECUTIVO =====
    const wsResumen = wb.addWorksheet('Resumen Ejecutivo', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 7 }]
    });

    // ROW 1: Título principal
    wsResumen.mergeCells('A1:F1');
    const cellTitulo = wsResumen.getCell('A1');
    cellTitulo.value = 'ESTADÍSTICAS DE LIQUIDACIONES';
    cellTitulo.font = { name: 'Roboto', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    cellTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } };
    cellTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(1).height = 40;

    // ROW 2: Subtítulo
    wsResumen.mergeCells('A2:F2');
    const cellSubtitulo = wsResumen.getCell('A2');
    cellSubtitulo.value = `Análisis Comparativo - ${filtros.tipoPeriodo}`;
    cellSubtitulo.font = { name: 'Roboto', size: 12, italic: true, color: { argb: BRAND_COLORS.dark } };
    cellSubtitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.light } };
    cellSubtitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(2).height = 25;

    // ROW 3: Empresa
    wsResumen.mergeCells('A3:C3');
    wsResumen.getCell('A3').value = 'EMPRESA:';
    wsResumen.getCell('A3').font = { name: 'Roboto', size: 10, bold: true };
    wsResumen.mergeCells('D3:F3');
    wsResumen.getCell('D3').value = filtros.empresa || 'Todas';
    wsResumen.getCell('D3').font = { name: 'Roboto', size: 10 };

    // ROW 4: Alcance
    wsResumen.mergeCells('A4:C4');
    wsResumen.getCell('A4').value = 'ALCANCE:';
    wsResumen.getCell('A4').font = { name: 'Roboto', size: 10, bold: true };
    wsResumen.mergeCells('D4:F4');
    wsResumen.getCell('D4').value = 'Consolidado (sin sala)';
    wsResumen.getCell('D4').font = { name: 'Roboto', size: 10 };

    // ROW 5: Fecha generación
    wsResumen.mergeCells('A5:C5');
    wsResumen.getCell('A5').value = 'FECHA GENERACIÓN:';
    wsResumen.getCell('A5').font = { name: 'Roboto', size: 10, bold: true };
    wsResumen.mergeCells('D5:F5');
    wsResumen.getCell('D5').value = new Date().toLocaleString('es-ES');
    wsResumen.getCell('D5').font = { name: 'Roboto', size: 10 };

    // ROW 6: Espacio en blanco
    wsResumen.getRow(6).height = 10;

    // ROW 7: KPIs Principales (Header de sección)
    wsResumen.mergeCells('A7:F7');
    const cellKPIsHeader = wsResumen.getCell('A7');
    cellKPIsHeader.value = '📊 INDICADORES CLAVE (KPIs)';
    cellKPIsHeader.font = { name: 'Roboto', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cellKPIsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.secondary } };
    cellKPIsHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(7).height = 30;

    // ROW 8: Headers KPIs
    const headerKPIs = [
      'Producción Total',
      'Promedio por Período',
      'Tendencia',
      'Cambio %',
      'Prod. por Sala (est.)',
      'Meses Consolidados'
    ];

    headerKPIs.forEach((header, idx) => {
      const cell = wsResumen.getCell(8, idx + 1);
      cell.value = header;
      cell.font = { name: 'Roboto', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.dark } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
    wsResumen.getRow(8).height = 35;

    // ROW 9: Valores KPIs
    if (kpis) {
      const valoresKPIs = [
        `$${Math.round(kpis.produccionTotal).toLocaleString()}`,
        `$${Math.round(kpis.produccionPromedio).toLocaleString()}`,
        kpis.tendencia === 'creciente' ? '↗️ Creciente' : kpis.tendencia === 'decreciente' ? '↘️ Decreciente' : '→ Estable',
        `${kpis.porcentajeCambio >= 0 ? '+' : ''}${kpis.porcentajeCambio.toFixed(1)}%`,
        `$${Math.round(kpis.produccionPorSala).toLocaleString()}`,
        kpis.mesesTotal
      ];

      valoresKPIs.forEach((valor, idx) => {
        const cell = wsResumen.getCell(9, idx + 1);
        cell.value = valor;
        cell.font = { name: 'Roboto', size: 10, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
      wsResumen.getRow(9).height = 30;
    }

    // ROW 11: Alertas (si existen)
    let currentRow = 11;
    if (alertas && alertas.length > 0) {
      wsResumen.mergeCells(`A${currentRow}:F${currentRow}`);
      const cellAlertasHeader = wsResumen.getCell(`A${currentRow}`);
      cellAlertasHeader.value = '⚠️ ALERTAS Y NOTIFICACIONES';
      cellAlertasHeader.font = { name: 'Roboto', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cellAlertasHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.warning } };
      cellAlertasHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      wsResumen.getRow(currentRow).height = 30;
      currentRow++;

      alertas.forEach((alerta, idx) => {
        wsResumen.mergeCells(`A${currentRow}:F${currentRow}`);
        const cellAlerta = wsResumen.getCell(`A${currentRow}`);
        cellAlerta.value = `${idx + 1}. ${alerta.mensaje}`;
        cellAlerta.font = { name: 'Roboto', size: 10 };
        
        let bgColor = BRAND_COLORS.light;
        if (alerta.tipo === 'error') bgColor = 'FFFEF2F2';
        else if (alerta.tipo === 'warning') bgColor = 'FFFFFBEB';
        else if (alerta.tipo === 'success') bgColor = 'FFF0FDF4';
        
        cellAlerta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cellAlerta.alignment = { horizontal: 'left', vertical: 'middle' };
        wsResumen.getRow(currentRow).height = 25;
        currentRow++;
      });
      currentRow++;
    }

    // ROW: Tabla detallada por período
    currentRow++;
    wsResumen.mergeCells(`A${currentRow}:F${currentRow}`);
    const cellTablaHeader = wsResumen.getCell(`A${currentRow}`);
    cellTablaHeader.value = '📋 DETALLE POR PERÍODO';
    cellTablaHeader.font = { name: 'Roboto', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cellTablaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.secondary } };
    cellTablaHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    wsResumen.getRow(currentRow).height = 30;
    currentRow++;

    // Headers de tabla
    const headersTabla = ['Período', 'Producción', 'Impuestos', 'Empresas', 'Máquinas (prom. mensual)', 'Variación %'];
    headersTabla.forEach((header, idx) => {
      const cell = wsResumen.getCell(currentRow, idx + 1);
      cell.value = header;
      cell.font = { name: 'Roboto', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.dark } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
    wsResumen.getRow(currentRow).height = 30;
    currentRow++;

    // Datos de tabla
    if (datosGraficos && datosGraficos.length > 0) {
      datosGraficos.forEach((row, idx) => {
        // Calcular variación vs período anterior
        let variacion = 0;
        if (idx > 0) {
          const anterior = datosGraficos[idx - 1].produccion;
          variacion = anterior > 0 ? ((row.produccion - anterior) / anterior) * 100 : 0;
        }

        const valores = [
          row.periodo,
          Math.round(row.produccion),
          Math.round(row.impuestos || 0),
          row.empresasConsolidadas || 0,
          Math.round(row.maquinasPromedioMensual || 0),
          `${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}%`
        ];

        valores.forEach((valor, colIdx) => {
          const cell = wsResumen.getCell(currentRow, colIdx + 1);
          cell.value = valor;
          cell.font = { name: 'Roboto', size: 10 };
          cell.alignment = { horizontal: colIdx === 0 ? 'left' : 'center', vertical: 'middle' };
          
          // Color alternado
          if (idx % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Formato moneda para producción
          if (colIdx === 1 || colIdx === 2) {
            cell.numFmt = '$#,##0';
          }
        });

        wsResumen.getRow(currentRow).height = 25;
        currentRow++;
      });
    }

    // Ajustar anchos de columnas
    wsResumen.columns = [
      { width: 18 }, // Período
      { width: 18 }, // Producción
      { width: 18 }, // Impuestos
      { width: 10 }, // Meses
      { width: 22 }, // Máquinas (prom.)
      { width: 12 }  // Variación
    ];

    // ===== HOJA 2: DETALLE POR PERÍODO (opcional, solo si hay suficientes datos) =====
    if (datosEstadisticos && Object.keys(datosEstadisticos).length > 0) {
      const wsDetalle = wb.addWorksheet('Detalle por Período', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
      });

      // Header
      wsDetalle.getCell('A1').value = 'Período';
      wsDetalle.getCell('B1').value = 'Producción';
      wsDetalle.getCell('C1').value = 'Empresas';
      wsDetalle.getCell('D1').value = 'Salas (prom. mensual)';
      wsDetalle.getCell('E1').value = 'Máquinas (prom. mensual)';
      wsDetalle.getCell('F1').value = 'Impuestos Totales';

      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'].forEach(cell => {
        wsDetalle.getCell(cell).font = { name: 'Roboto', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        wsDetalle.getCell(cell).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } };
        wsDetalle.getCell(cell).alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Datos
      let rowDetalle = 2;
      Object.keys(datosEstadisticos).sort().forEach(key => {
        const data = datosEstadisticos[key];
        wsDetalle.getCell(`A${rowDetalle}`).value = key;
        wsDetalle.getCell(`B${rowDetalle}`).value = Math.round(data.produccion);
        wsDetalle.getCell(`C${rowDetalle}`).value = data.documentos || 0;
        wsDetalle.getCell(`D${rowDetalle}`).value = Math.round(data.salasPromedioMensual || 0);
        wsDetalle.getCell(`E${rowDetalle}`).value = Math.round(data.maquinasPromedioMensual || 0);
        wsDetalle.getCell(`F${rowDetalle}`).value = Math.round(data.impuestos);

        // Formato moneda
        wsDetalle.getCell(`B${rowDetalle}`).numFmt = '$#,##0';
        wsDetalle.getCell(`F${rowDetalle}`).numFmt = '$#,##0';

        rowDetalle++;
      });

      wsDetalle.columns = [
        { width: 15 },
        { width: 18 },
        { width: 12 },
        { width: 20 },
        { width: 22 },
        { width: 18 }
      ];
    }

    // ===== GENERAR Y DESCARGAR =====
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const fecha = new Date().toISOString().split('T')[0];
    const nombreEmpresa = filtros.empresa !== 'todas' ? filtros.empresa.replace(/\s+/g, '_') : 'Todas';
    const nombreArchivo = `Estadisticas_Liquidaciones_${nombreEmpresa}_${fecha}.xlsx`;
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

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
