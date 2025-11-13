// Exportador de Asistencias - Formato Python Profesional
// Usa exceljs para soportar estilos empresariales (similar a liquidacionExcelExportPythonFormat.js)

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ✅ BRAND COLORS - Paleta corporativa DR Group
const BRAND_COLORS = {
  primary: '0B3040',      // Azul oscuro corporativo
  secondary: '1A5F7A',    // Azul medio
  accent: '334155',       // Gris azulado
  success: '15803D',      // Verde
  warning: 'B45309',      // Ámbar
  error: 'DC2626',        // Rojo
  white: 'FFFFFFFF',
  lightGray: 'F8FAFC',
  mediumGray: 'E2E8F0'
};

// ✅ DEFINICIÓN DE COLUMNAS (Orden empresarial)
const COLUMN_DEFS = [
  { header: 'Empleado', key: 'empleado', width: 28 },
  { header: 'Email', key: 'email', width: 32 },
  { header: 'Fecha', key: 'fecha', width: 14 },
  { header: 'Entrada', key: 'entrada', width: 12 },
  { header: 'Break 1', key: 'break1', width: 12 },
  { header: 'Break 2', key: 'break2', width: 12 },
  { header: 'Almuerzo', key: 'almuerzo', width: 12 },
  { header: 'Salida', key: 'salida', width: 12 },
  { header: 'Horas Trabajadas', key: 'horasTrabajadas', width: 18 }
];

// ✅ FORMATOS REUTILIZABLES (Idénticos al Python format)
const fmtTitle = {
  font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: BRAND_COLORS.white } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } }
};

const fmtSubTitle = {
  font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: BRAND_COLORS.white } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.secondary } }
};

const fmtHeader = {
  font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_COLORS.white } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.primary } },
  border: {
    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'FF666666' } },
    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
  }
};

const fmtDataBase = {
  font: { name: 'Segoe UI', size: 9, color: { argb: 'FF223344' } },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: false },
  border: {
    top: { style: 'thin', color: { argb: `FF${BRAND_COLORS.mediumGray}` } },
    left: { style: 'thin', color: { argb: `FF${BRAND_COLORS.mediumGray}` } },
    bottom: { style: 'thin', color: { argb: 'FFC0CCDA' } },
    right: { style: 'thin', color: { argb: `FF${BRAND_COLORS.mediumGray}` } }
  }
};

const fmtDataHour = {
  ...fmtDataBase,
  alignment: { horizontal: 'center', vertical: 'middle' },
  numFmt: 'hh:mm:ss' // Formato de hora Excel
};

const fmtTotalsLabel = {
  font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.primary}` } },
  alignment: { horizontal: 'right', vertical: 'middle' }
};

const fmtTotalsNumber = {
  font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.primary}` } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.lightGray}` } },
  border: {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF64748B' } }
  }
};

// ✅ MAPEAR REGISTRO
const mapItem = (item) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return format(date, 'HH:mm:ss');
    } catch {
      return null;
    }
  };

  return {
    empleado: item.empleadoNombre || 'Sin nombre',
    email: item.empleadoEmail || '',
    fecha: item.fecha || '',
    entrada: formatTime(item.entrada),
    break1: item.breaks && item.breaks[0] ? formatTime(item.breaks[0]) : null,
    break2: item.breaks && item.breaks[1] ? formatTime(item.breaks[1]) : null,
    almuerzo: formatTime(item.almuerzo),
    salida: formatTime(item.salida),
    horasTrabajadas: item.horasTrabajadas || ''
  };
};

// ✅ EXPORTACIÓN PRINCIPAL
export const exportarAsistenciasExcel = async (data) => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    const mapped = data.map(mapItem);

    // Estadísticas
    const totalRegistros = mapped.length;
    const empleadosUnicos = [...new Set(mapped.map(r => r.email))].length;
    const fechasUnicas = [...new Set(mapped.map(r => r.fecha))].length;
    const totalHorasTrabajadas = mapped.reduce((sum, r) => {
      const horas = parseFloat(r.horasTrabajadas) || 0;
      return sum + horas;
    }, 0);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'DR Group Dashboard';
    wb.created = new Date();
    wb.company = 'DR Group';
    
    const ws = wb.addWorksheet('Asistencias', {
      views: [{ state: 'frozen', ySplit: 7 }] // Freeze panes en fila 7
    });

    // ✅ FILA 1: TÍTULO PRINCIPAL
    ws.mergeCells(1, 1, 1, COLUMN_DEFS.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = 'DR GROUP - CONTROL DE ASISTENCIAS';
    Object.assign(titleCell, { style: fmtTitle });
    ws.getRow(1).height = 30;

    // ✅ FILA 2: SUBTÍTULO
    ws.mergeCells(2, 1, 2, COLUMN_DEFS.length);
    const subTitleCell = ws.getCell(2, 1);
    subTitleCell.value = 'Registro de Entrada, Breaks, Almuerzo y Salida del Personal';
    Object.assign(subTitleCell, { style: fmtSubTitle });
    ws.getRow(2).height = 22;

    // ✅ FILA 3: MÉTRICAS
    ws.mergeCells(3, 1, 3, COLUMN_DEFS.length);
    const infoCell = ws.getCell(3, 1);
    infoCell.value = `Registros: ${totalRegistros} | Empleados: ${empleadosUnicos} | Fechas: ${fechasUnicas} | Horas Totales: ${totalHorasTrabajadas.toFixed(2)}h`;
    Object.assign(infoCell, {
      style: {
        ...fmtSubTitle,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.accent}` } },
        font: { ...fmtSubTitle.font, size: 10 }
      }
    });
    ws.getRow(3).height = 22;

    // ✅ FILA 4: FECHA DE GENERACIÓN
    ws.mergeCells(4, 1, 4, COLUMN_DEFS.length);
    const fechaCell = ws.getCell(4, 1);
    fechaCell.value = `Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}`;
    Object.assign(fechaCell, {
      style: {
        ...fmtSubTitle,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } },
        font: { ...fmtSubTitle.font, size: 10, bold: false }
      }
    });
    ws.getRow(4).height = 18;

    // ✅ FILA 5: VACÍA (SEPARADOR)
    ws.getRow(5).height = 5;

    // ✅ FILA 6: VACÍA (SEPARADOR)
    ws.getRow(6).height = 8;

    // ✅ CONFIGURAR COLUMNAS SIN HEADERS AUTOMÁTICOS
    const COLUMNS_NO_HEADER = COLUMN_DEFS.map(({ header, ...rest }) => ({ ...rest }));
    ws.columns = COLUMNS_NO_HEADER;

    // ✅ FILA 7: HEADERS
    const headerRowIndex = 7;
    const headerRow = ws.getRow(headerRowIndex);
    COLUMN_DEFS.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      Object.assign(cell, { style: fmtHeader });
    });
    headerRow.height = 28;

    // ✅ FILAS DE DATOS (Comienzan en fila 8)
    let currentRow = headerRowIndex + 1;
    mapped.forEach((r, i) => {
      const row = ws.getRow(currentRow);
      
      COLUMN_DEFS.forEach((col, idx) => {
        const cell = row.getCell(idx + 1);
        let value = r[col.key];
        
        // Convertir fecha a formato Excel
        if (col.key === 'fecha' && value) {
          try {
            const dateObj = parseISO(value);
            if (!isNaN(dateObj.getTime())) {
              value = dateObj;
              cell.numFmt = 'dd/mm/yyyy';
            }
          } catch {
            // Mantener como string si falla
          }
        }
        
        cell.value = value || '-';
        
        // Estilo base con alternancia de color
        let cellStyle = { ...fmtDataBase };
        
        // Columnas de hora con formato especial
        if (['entrada', 'break1', 'break2', 'almuerzo', 'salida'].includes(col.key)) {
          cellStyle = { ...fmtDataHour };
        }
        
        // Alineación específica
        if (col.key === 'empleado') {
          cellStyle.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (col.key === 'email') {
          cellStyle.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (col.key === 'horasTrabajadas') {
          cellStyle.alignment = { horizontal: 'center', vertical: 'middle' };
          cellStyle.font = { ...cellStyle.font, bold: true, color: { argb: `FF${BRAND_COLORS.success}` } };
        }
        
        cell.style = cellStyle;
        
        // Color alternado de fila
        if (i % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.lightGray}` } };
        }
      });
      
      row.height = 18;
      currentRow++;
    });

    // ✅ FILA DE TOTALES
    const totalsStart = currentRow + 1;
    ws.getRow(currentRow).height = 6; // Espacio visual
    currentRow++;

    const totalsRow = ws.getRow(currentRow);
    
    // Merge celdas para etiqueta
    ws.mergeCells(currentRow, 1, currentRow, 8);
    const labelCell = totalsRow.getCell(1);
    labelCell.value = 'TOTALES GENERALES';
    Object.assign(labelCell, { style: fmtTotalsLabel });
    
    // Total horas trabajadas
    const totalCell = totalsRow.getCell(9);
    totalCell.value = `${totalHorasTrabajadas.toFixed(2)}h`;
    totalCell.style = fmtTotalsNumber;
    
    totalsRow.height = 24;

    // ✅ AUTOFILTRO
    ws.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: COLUMN_DEFS.length }
    };

    // ✅ GENERAR ARCHIVO
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const filename = `asistencias_dr_group_${timestamp}.xlsx`;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, filename);

    return {
      success: true,
      filename,
      message: `Excel generado exitosamente (${totalRegistros} registros)`
    };
  } catch (err) {
    console.error('❌ Error exportando asistencias:', err);
    throw err;
  }
};

export default { exportarAsistenciasExcel };
