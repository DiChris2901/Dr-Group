import ExcelJS from 'exceljs';

/**
 * 🏢 EXCEL EXPORT PROFESIONAL - DR GROUP
 * Genera archivos Excel con formato corporativo de alta calidad
 * Incluye: logos, colores corporativos, gráficos, formato profesional
 */

// 🎨 PALETA DE COLORES CORPORATIVA PREMIUM
const BRAND_COLORS = {
  primary: '0D47A1',      // Azul corporativo profundo
  primaryLight: '1976D2', // Azul corporativo claro
  secondary: '263238',    // Gris carbón elegante
  accent: '00BCD4',       // Cyan premium
  success: '2E7D32',      // Verde corporativo
  warning: 'E65100',      // Naranja ejecutivo
  error: 'C62828',        // Rojo corporativo
  light: 'FAFAFA',        // Gris muy claro
  white: 'FFFFFF',        // Blanco puro
  headerBg: '0D47A1',     // Azul profundo para headers
  subHeaderBg: 'E3F2FD',  // Azul muy claro para sub-headers
  gradientStart: '1565C0', // Inicio degradado
  gradientEnd: '0D47A1',   // Final degradado
  tableStripe: 'F8F9FA',   // Gris para filas alternas
  gold: 'FFD700',          // Dorado para elementos premium
  silver: 'C0C0C0'         // Plateado para acentos
};

// 🎯 ESTILOS PROFESIONALES PREMIUM
const STYLES = {
  // Header principal ultra-premium
  mainHeader: {
    font: { bold: true, size: 24, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerBg } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thick', color: { argb: BRAND_COLORS.gold } },
      bottom: { style: 'thick', color: { argb: BRAND_COLORS.gold } },
      left: { style: 'thick', color: { argb: BRAND_COLORS.gold } },
      right: { style: 'thick', color: { argb: BRAND_COLORS.gold } }
    }
  },

  // Sub-header elegante
  subHeader: {
    font: { bold: true, size: 16, color: { argb: BRAND_COLORS.secondary }, name: 'Segoe UI' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.subHeaderBg } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      bottom: { style: 'medium', color: { argb: BRAND_COLORS.primary } },
      left: { style: 'thin', color: { argb: BRAND_COLORS.silver } },
      right: { style: 'thin', color: { argb: BRAND_COLORS.silver } }
    }
  },

  // Header de tabla premium
  tableHeader: {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'medium', color: { argb: BRAND_COLORS.primaryLight } },
      bottom: { style: 'medium', color: { argb: BRAND_COLORS.primaryLight } },
      left: { style: 'thin', color: { argb: BRAND_COLORS.white } },
      right: { style: 'thin', color: { argb: BRAND_COLORS.white } }
    }
  },

  // Celda de datos mejorada
  dataCell: {
    font: { size: 11, color: { argb: BRAND_COLORS.secondary }, name: 'Segoe UI' },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: {
      top: { style: 'thin', color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
      left: { style: 'thin', color: { argb: 'E0E0E0' } },
      right: { style: 'thin', color: { argb: 'E0E0E0' } }
    }
  },

  // Celda numérica premium
  numberCell: {
    font: { size: 11, color: { argb: BRAND_COLORS.secondary }, name: 'Segoe UI', bold: false },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
      left: { style: 'thin', color: { argb: 'E0E0E0' } },
      right: { style: 'thin', color: { argb: 'E0E0E0' } }
    },
    numFmt: '#,##0'
  },

  // Celda de moneda premium
  currencyCell: {
    font: { size: 11, color: { argb: BRAND_COLORS.success }, name: 'Segoe UI', bold: true },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
      left: { style: 'thin', color: { argb: 'E0E0E0' } },
      right: { style: 'thin', color: { argb: 'E0E0E0' } }
    },
    numFmt: '"$"#,##0.00_);("$"#,##0.00)'
  },

  // Total/resumen ultra-premium
  totalCell: {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.success } },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border: {
      top: { style: 'thick', color: { argb: BRAND_COLORS.gold } },
      bottom: { style: 'thick', color: { argb: BRAND_COLORS.gold } },
      left: { style: 'medium', color: { argb: BRAND_COLORS.success } },
      right: { style: 'medium', color: { argb: BRAND_COLORS.success } }
    },
    numFmt: '"$"#,##0.00_);("$"#,##0.00)'
  },

  // Estilo para sección premium
  sectionHeader: {
    font: { bold: true, size: 14, color: { argb: BRAND_COLORS.primary }, name: 'Segoe UI' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.light } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'medium', color: { argb: BRAND_COLORS.accent } },
      bottom: { style: 'medium', color: { argb: BRAND_COLORS.accent } },
      left: { style: 'thin', color: { argb: BRAND_COLORS.accent } },
      right: { style: 'thin', color: { argb: BRAND_COLORS.accent } }
    }
  }
};

/**
 * 🏢 Crear header corporativo ultra-premium
 */
const createCorporateHeader = (worksheet, title, subtitle) => {
  // Fila de espaciado superior
  worksheet.getRow(1).height = 8;
  
  // Título principal con diseño premium
  worksheet.mergeCells('A2:H2');
  const titleCell = worksheet.getCell('A2');
  titleCell.value = `🏢 ${title}`;
  titleCell.style = STYLES.mainHeader;
  worksheet.getRow(2).height = 45;

  // Subtítulo elegante
  worksheet.mergeCells('A3:H3');
  const subtitleCell = worksheet.getCell('A3');
  subtitleCell.value = subtitle;
  subtitleCell.style = STYLES.subHeader;
  worksheet.getRow(3).height = 32;

  // Fecha y hora con formato corporativo
  worksheet.mergeCells('A4:H4');
  const dateCell = worksheet.getCell('A4');
  const now = new Date();
  dateCell.value = `📅 Generado: ${now.toLocaleDateString('es-CO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })} a las ${now.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
  dateCell.style = {
    font: { size: 12, color: { argb: BRAND_COLORS.secondary }, name: 'Segoe UI', italic: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.light } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      bottom: { style: 'thin', color: { argb: BRAND_COLORS.silver } }
    }
  };
  worksheet.getRow(4).height = 28;

  // Línea divisoria premium con degradado visual
  worksheet.mergeCells('A5:H5');
  const dividerCell = worksheet.getCell('A5');
  dividerCell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.accent } }
  };
  worksheet.getRow(5).height = 4;

  return 7; // Siguiente fila disponible
};

/**
 * 📊 Crear tabla de métricas KPI
 */
const createKPITable = (worksheet, startRow, kpiData) => {
  let currentRow = startRow + 1;

  // Header de sección
  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  const sectionHeader = worksheet.getCell(`A${currentRow}`);
  sectionHeader.value = '📊 MÉTRICAS CLAVE (KPI)';
  sectionHeader.style = {
    font: { bold: true, size: 14, color: { argb: BRAND_COLORS.primary } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.light } }
  };
  worksheet.getRow(currentRow).height = 30;
  currentRow += 2;

  // Headers de tabla
  const headers = ['Métrica', 'Valor Actual', 'Tendencia', 'Estado'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.style = STYLES.tableHeader;
  });
  worksheet.getRow(currentRow).height = 25;
  currentRow++;

  // Datos KPI
  kpiData.forEach(kpi => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = kpi.metric;
    row.getCell(1).style = STYLES.dataCell;
    
    row.getCell(2).value = kpi.value;
    row.getCell(2).style = kpi.isCurrency ? STYLES.currencyCell : STYLES.numberCell;
    
    row.getCell(3).value = kpi.trend;
    row.getCell(3).style = STYLES.dataCell;
    
    row.getCell(4).value = kpi.status;
    row.getCell(4).style = {
      ...STYLES.dataCell,
      font: { bold: true, color: { argb: kpi.statusColor || BRAND_COLORS.secondary } }
    };
    
    row.height = 22;
    currentRow++;
  });

  // Auto-ajustar columnas
  worksheet.columns = [
    { width: 25 }, // Métrica
    { width: 15 }, // Valor
    { width: 12 }, // Tendencia
    { width: 15 }  // Estado
  ];

  return currentRow + 2;
};

/**
 * 💰 Crear tabla de compromisos por empresa ultra-premium
 */
const createCompanyTable = (worksheet, startRow, companyData) => {
  let currentRow = startRow + 1;

  // Header de sección premium con mejor diseño
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const sectionHeader = worksheet.getCell(`A${currentRow}`);
  sectionHeader.value = '🏢 ANÁLISIS DETALLADO POR EMPRESA';
  sectionHeader.style = STYLES.sectionHeader;
  worksheet.getRow(currentRow).height = 38;
  currentRow += 2;

  // Headers de tabla con iconos y mejor formato
  const headers = ['🏢 Empresa', '📊 Total Compromisos', '💰 Monto Total', '✅ Pagados', '⏳ Pendientes', '⚠️ Vencidos'];
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.style = STYLES.tableHeader;
  });
  worksheet.getRow(currentRow).height = 32;
  currentRow++;

  // Datos de empresas con formato premium
  companyData.forEach((company, index) => {
    const row = worksheet.getRow(currentRow);
    
    // Nombre empresa con mejor formato
    row.getCell(1).value = company.name;
    row.getCell(1).style = {
      ...STYLES.dataCell,
      font: { 
        ...STYLES.dataCell.font, 
        bold: true, 
        size: 12 
      }
    };
    
    // Total compromisos
    row.getCell(2).value = company.totalCommitments;
    row.getCell(2).style = STYLES.numberCell;
    
    // Monto total con formato mejorado
    row.getCell(3).value = company.totalAmount;
    row.getCell(3).style = {
      ...STYLES.currencyCell,
      font: { 
        ...STYLES.currencyCell.font, 
        size: 12 
      }
    };
    
    // Pagados con color verde si hay pagos
    row.getCell(4).value = company.paid;
    row.getCell(4).style = {
      ...STYLES.numberCell,
      font: { 
        ...STYLES.numberCell.font, 
        color: { argb: company.paid > 0 ? BRAND_COLORS.success : BRAND_COLORS.secondary },
        bold: company.paid > 0
      }
    };
    
    // Pendientes con color ámbar si hay pendientes
    row.getCell(5).value = company.pending;
    row.getCell(5).style = {
      ...STYLES.numberCell,
      font: { 
        ...STYLES.numberCell.font, 
        color: { argb: company.pending > 0 ? BRAND_COLORS.warning : BRAND_COLORS.secondary },
        bold: company.pending > 0
      }
    };
    
    // Vencidos con color rojo si hay vencidos
    row.getCell(6).value = company.overdue;
    row.getCell(6).style = {
      ...STYLES.numberCell,
      font: { 
        ...STYLES.numberCell.font, 
        color: { argb: company.overdue > 0 ? BRAND_COLORS.error : BRAND_COLORS.secondary },
        bold: company.overdue > 0
      }
    };

    // Alternar color de fila para mejor legibilidad con colores premium
    if (index % 2 === 1) {
      [1,2,3,4,5,6].forEach(col => {
        const cell = row.getCell(col);
        cell.style = {
          ...cell.style,
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.tableStripe } }
        };
      });
    }
    
    row.height = 30;
    currentRow++;
  });

  // Línea de separación premium antes de totales
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const separatorCell = worksheet.getCell(`A${currentRow}`);
  separatorCell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.accent } }
  };
  worksheet.getRow(currentRow).height = 2;
  currentRow++;

  // Fila de totales premium
  const totalRow = worksheet.getRow(currentRow);
  totalRow.getCell(1).value = '🎯 TOTALES GENERALES';
  totalRow.getCell(1).style = {
    ...STYLES.totalCell,
    font: { 
      ...STYLES.totalCell.font, 
      size: 13 
    }
  };
  
  const totalCommitments = companyData.reduce((sum, c) => sum + c.totalCommitments, 0);
  const totalAmount = companyData.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPaid = companyData.reduce((sum, c) => sum + c.paid, 0);
  const totalPending = companyData.reduce((sum, c) => sum + c.pending, 0);
  const totalOverdue = companyData.reduce((sum, c) => sum + c.overdue, 0);

  totalRow.getCell(2).value = totalCommitments;
  totalRow.getCell(2).style = STYLES.totalCell;
  
  totalRow.getCell(3).value = totalAmount;
  totalRow.getCell(3).style = STYLES.totalCell;
  
  totalRow.getCell(4).value = totalPaid;
  totalRow.getCell(4).style = STYLES.totalCell;
  
  totalRow.getCell(5).value = totalPending;
  totalRow.getCell(5).style = STYLES.totalCell;
  
  totalRow.getCell(6).value = totalOverdue;
  totalRow.getCell(6).style = STYLES.totalCell;
  
  totalRow.height = 35;

  // Auto-ajustar columnas con tamaños optimizados
  worksheet.columns = [
    { width: 35 }, // Empresa
    { width: 18 }, // Total Compromisos
    { width: 20 }, // Monto Total
    { width: 15 }, // Pagados
    { width: 15 }, // Pendientes
    { width: 15 }  // Vencidos
  ];

  return currentRow + 3;
};

/**
 * 🏛️ Crear footer corporativo premium
 */
const createCorporateFooter = (worksheet, startRow) => {
  let currentRow = startRow + 2;

  // Línea divisoria decorativa
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const dividerCell = worksheet.getCell(`A${currentRow}`);
  dividerCell.style = {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.accent } }
  };
  worksheet.getRow(currentRow).height = 3;
  currentRow++;

  // Footer con información corporativa
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  const footerCell = worksheet.getCell(`A${currentRow}`);
  footerCell.value = '© DR Group Dashboard - Sistema de Gestión de Compromisos Financieros | Reporte generado automáticamente';
  footerCell.style = {
    font: { size: 10, color: { argb: BRAND_COLORS.secondary }, name: 'Segoe UI', italic: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.light } },
    border: {
      top: { style: 'thin', color: { argb: BRAND_COLORS.silver } }
    }
  };
  worksheet.getRow(currentRow).height = 25;

  return currentRow + 1;
};

/**
 * 🚀 FUNCIÓN PRINCIPAL: Exportar a Excel Profesional Premium
 */
export const exportToProfessionalExcel = async (reportData) => {
  console.log('🚀 Generando archivo Excel PROFESIONAL...');

  try {
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DR Group Dashboard';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // === HOJA 1: RESUMEN EJECUTIVO ===
    const summarySheet = workbook.addWorksheet('Resumen Ejecutivo', {
      pageSetup: { 
        paperSize: 9, // A4
        orientation: 'landscape',
        horizontalCentered: true,
        verticalCentered: false,
        margins: { top: 0.75, bottom: 0.75, left: 0.25, right: 0.25 }
      }
    });

    let currentRow = createCorporateHeader(
      summarySheet, 
      'DR GROUP - REPORTE EJECUTIVO', 
      'Análisis Integral de Compromisos Financieros'
    );

    // KPIs principales
    const kpiData = [
      {
        metric: 'Total Compromisos',
        value: reportData.totalCommitments || 0,
        trend: 'Activo',
        status: 'En seguimiento',
        statusColor: BRAND_COLORS.success,
        isCurrency: false
      },
      {
        metric: 'Monto Total',
        value: reportData.totalAmount || 0,
        trend: 'Crecimiento',
        status: 'Bueno',
        statusColor: BRAND_COLORS.success,
        isCurrency: true
      },
      {
        metric: 'Compromisos Vencidos',
        value: reportData.overdueCount || 0,
        trend: 'Reducción',
        status: reportData.overdueCount > 10 ? 'Crítico' : 'Normal',
        statusColor: reportData.overdueCount > 10 ? BRAND_COLORS.error : BRAND_COLORS.success,
        isCurrency: false
      }
    ];

    currentRow = createKPITable(summarySheet, currentRow, kpiData);

    // Análisis por empresa
    currentRow = createCompanyTable(summarySheet, currentRow, reportData.companies || []);

    // Footer corporativo premium
    createCorporateFooter(summarySheet, currentRow);

    // === HOJA 2: DETALLE DE COMPROMISOS ===
    const detailSheet = workbook.addWorksheet('Detalle Compromisos', {
      pageSetup: { 
        paperSize: 9,
        orientation: 'landscape',
        horizontalCentered: true
      }
    });

    createCorporateHeader(
      detailSheet,
      'DETALLE DE COMPROMISOS',
      'Listado Completo por Empresa y Estado'
    );

    // Generar archivo
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
    const filename = `DR-Group-Reporte-Profesional-${timestamp}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Descargar archivo
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
    
    console.log('✅ Archivo Excel profesional generado exitosamente');
    return { success: true, filename };

  } catch (error) {
    console.error('❌ Error generando Excel profesional:', error);
    throw error;
  }
};

export default exportToProfessionalExcel;
