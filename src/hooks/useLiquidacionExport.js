import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { exportarLiquidacionPythonFormat } from '../utils/liquidacionExcelExportPythonFormat';
import { exportarLiquidacionSpectacular, exportarLiquidacionSimple } from '../utils/liquidacionExcelExportSpectacularFixed';
import { exportarReporteDiarioSala } from '../utils/liquidacionExcelExportDiarioSala';

/**
 * Custom hook para gestionar exportaciones de liquidaciones
 * Maneja 3 formatos de exportación: consolidado, por sala, y diario
 * 
 * @param {Object} params - Parámetros del hook
 * @param {Array} params.consolidatedData - Datos consolidados para exportar
 * @param {Array} params.reporteBySala - Reporte agrupado por sala
 * @param {Array} params.originalData - Datos originales sin procesar (para reporte diario)
 * @param {string} params.empresa - Nombre de la empresa
 * @param {Function} params.addLog - Función para agregar logs
 * @param {Function} params.addNotification - Función para mostrar notificaciones
 * @param {Function} params.logActivity - Función para registrar actividad en Firebase
 * @param {Object} params.currentUser - Usuario actual autenticado
 * @param {Object} params.userProfile - Perfil del usuario actual
 * 
 * @returns {Object} - Funciones de exportación
 */
export default function useLiquidacionExport({
  consolidatedData,
  reporteBySala,
  originalData,
  empresa,
  addLog,
  addNotification,
  logActivity,
  currentUser,
  userProfile
}) {

  const getUserDisplayName = () => {
    return (
      userProfile?.name ||
      currentUser?.displayName ||
      currentUser?.email ||
      'Usuario desconocido'
    );
  };

  /**
   * Exportar datos consolidados en formato Python profesional
   * Intenta Python → Spectacular → Simple como fallbacks
   */
  const exportarConsolidado = useCallback(async () => {
    if (!currentUser?.uid) {
      addNotification('Sesión no válida. Inicia sesión nuevamente.', 'error');
      return;
    }

    if (!consolidatedData) {
      addNotification('No hay datos consolidados para exportar', 'warning');
      return;
    }

    try {
      addLog('📦 Exportando con formato Python exacto...', 'info');
      const result = await exportarLiquidacionPythonFormat(consolidatedData, empresa || 'GENERAL');
      if (result.success) {
        addLog(`✅ ${result.message}`, 'success');
        addNotification('Liquidación exportada (formato Python exacto)', 'success');
        
        // 📤 LOG DE ACTIVIDAD: Exportación consolidada
        try {
          await logActivity(
            'liquidacion_consolidada_exportada',
            'liquidacion',
            empresa || 'GENERAL',
            {
              exportFormat: 'python',
              empresa: empresa || 'GENERAL',
              registrosExportados: consolidatedData?.length || 0,
              fileName: result?.fileName || 'Liquidacion.xlsx'
            },
            currentUser.uid,
            getUserDisplayName(),
            currentUser.email
          );
        } catch (logError) {
          console.error('Error logging export:', logError);
        }
        
        return;
      }
    } catch (e) {
      console.error('Error formato Python:', e);
      addLog('⚠️ Falló formato Python, usando versión spectacular...', 'warning');
    }

    try {
      addLog('✨ Iniciando exportación spectacular...', 'info');
      const result = await exportarLiquidacionSpectacular(consolidatedData, empresa || 'GENERAL');
      if (result.success) {
        addLog(`✅ ${result.message}`, 'success');
        addNotification('Liquidación exportada con diseño SPECTACULAR 💎', 'success');
      }
    } catch (error) {
      console.error('Error exportando datos consolidados:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      try {
        addLog('🔄 Intentando exportación simple...', 'info');
        const fallbackResult = exportarLiquidacionSimple(consolidatedData, empresa || 'GENERAL');
        if (fallbackResult.success) {
          addLog(`✅ ${fallbackResult.message}`, 'success');
          addNotification('Datos exportados (formato simple)', 'warning');
        }
      } catch (fallbackError) {
        console.error('Error en exportación de respaldo:', fallbackError);
        addLog(`❌ Error en exportación de respaldo: ${fallbackError.message}`, 'error');
        addNotification('Error al exportar datos consolidados', 'error');
      }
    }
  }, [consolidatedData, empresa, addLog, addNotification, logActivity, currentUser, userProfile]);

  /**
   * Exportar reporte agrupado por sala con totales
   */
  const exportarReporteSala = useCallback(async () => {
    if (!currentUser?.uid) {
      addNotification('Sesión no válida. Inicia sesión nuevamente.', 'error');
      return;
    }

    if (!reporteBySala) {
      addNotification('No hay reporte por sala para exportar', 'warning');
      return;
    }

    try {
      addLog('🏢 Iniciando exportación de reporte por sala...', 'info');
      
      const ws = XLSX.utils.json_to_sheet(reporteBySala.map(row => ({
        'Establecimiento': row.establecimiento,
        'Empresa': row.empresa,
        'Total Máquinas': row.totalMaquinas,
        'Producción': row.produccion,
        'Derechos de Explotación': row.derechosExplotacion,
        'Gastos de Administración': row.gastosAdministracion,
        'Total Impuestos': row.totalImpuestos,
        'Promedio/Establecimiento': row.promedioEstablecimiento
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte por Sala');

      const timestamp = new Date().toLocaleString('es-CO').replace(/[/:]/g, '-').replace(', ', '_');
      const filename = `Reporte_Salas_${empresa || 'General'}_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      
      addLog(`✅ Reporte por sala exportado como: ${filename}`, 'success');
      addNotification('Reporte por sala exportado exitosamente', 'success');

      // 🏢 LOG DE ACTIVIDAD: Exportación reporte por sala
      try {
        if (typeof logActivity === 'function') {
          await logActivity(
            'reporte_sala_exportado',
            'liquidacion',
            empresa || 'GENERAL',
            {
              empresa: empresa || 'GENERAL',
              establecimientos: reporteBySala?.length || 0,
              exportFormat: 'xlsx',
              fileName: filename
            },
            currentUser.uid,
            getUserDisplayName(),
            currentUser.email
          );
        }
      } catch (logError) {
        console.error('Error logging sala report export:', logError);
      }
      
    } catch (error) {
      console.error('Error exportando reporte por sala:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar reporte por sala', 'error');
    }
  }, [reporteBySala, empresa, addLog, addNotification, logActivity, currentUser, userProfile]);

  /**
   * Exportar reporte diario multi-hoja por establecimiento
   * @param {string} establecimientoForzado - Establecimiento específico a exportar
   */
  const exportarReporteDiario = useCallback(async (establecimientoForzado) => {
    if (!currentUser?.uid) {
      addNotification('Sesión no válida. Inicia sesión nuevamente.', 'error');
      return;
    }

    if (!consolidatedData || !consolidatedData.length) {
      addNotification('No hay datos para exportar reporte diario', 'warning');
      return;
    }

    // Detectar establecimientos disponibles
    const establecimientosUnicos = [...new Set(consolidatedData.map(item => item.establecimiento).filter(Boolean))];
    if (!establecimientosUnicos.length) {
      addNotification('No se detectaron establecimientos en los datos', 'error');
      return;
    }

    let establecimientoTarget;
    if (establecimientoForzado) {
      establecimientoTarget = establecimientoForzado;
    } else {
      establecimientoTarget = establecimientosUnicos[0];
      if (establecimientosUnicos.length > 1) {
        addNotification(`Usando el primer establecimiento (${establecimientoTarget}).`, 'info');
      }
    }

    try {
      // Usar exclusivamente el primer archivo (originalData) para datos diarios reales
      if (!originalData || !Array.isArray(originalData) || originalData.length === 0) {
        addNotification('No hay archivo original con datos diarios', 'warning');
        return;
      }
      
      const hayFechasReales = originalData.some(r => r['Fecha reporte'] || r.fechaReporte || r['Fecha'] || r.fecha);
      if (!hayFechasReales) {
        addLog('⚠️ No se encontraron fechas diarias explícitas en el archivo original. No se genera reporte.', 'warning');
        addNotification('No hay registros diarios reales en el archivo original', 'warning');
        return;
      }
      
      addLog(`📅 Generando reporte diario multi-hoja (solo datos reales) para ${establecimientoTarget}...`, 'info');
      await exportarReporteDiarioSala(originalData, establecimientoTarget, empresa || 'General');
      addLog('✅ Reporte diario exportado (multi-hoja por día)', 'success');
      addNotification('Reporte diario exportado', 'success');
      
      // 📅 LOG DE ACTIVIDAD: Exportación reporte diario
      try {
        await logActivity(
          'reporte_diario_exportado',
          'liquidacion',
          establecimientoTarget || 'sin-establecimiento',
          {
            empresa: empresa || 'General',
            establecimiento: establecimientoTarget || 'sin-establecimiento',
            registrosDiarios: originalData?.length || 0,
            exportFormat: 'python'
          },
          currentUser.uid,
          getUserDisplayName(),
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging daily report export:', logError);
      }
      
    } catch (error) {
      console.error('Error exportando reporte diario:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar reporte diario', 'error');
    }
  }, [consolidatedData, originalData, empresa, addLog, addNotification, logActivity, currentUser, userProfile]);

  /**
   * Exportar máquinas en cero (producción = 0) agrupadas por sala
   * Formato Python Profesional con ExcelJS
   */
  const exportarMaquinasEnCero = useCallback(async () => {
    if (!currentUser?.uid) {
      addNotification('Sesión no válida. Inicia sesión nuevamente.', 'error');
      return;
    }

    if (!consolidatedData || consolidatedData.length === 0) {
      addNotification('No hay datos para exportar', 'warning');
      return;
    }

    try {
      addLog('📦 Exportando máquinas en cero (Formato Python)...', 'info');

      // Filtrar máquinas con producción en cero
      const maquinasEnCero = consolidatedData.filter(m => {
        const prod = parseFloat(m.produccion) || 0;
        return Math.abs(prod) < 0.01;
      });

      if (maquinasEnCero.length === 0) {
        addNotification('No hay máquinas en cero para exportar', 'info');
        return;
      }

      // Importar ExcelJS dinámicamente
      const ExcelJS = (await import('exceljs')).default;

      // Crear workbook y worksheet
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Máquinas en Cero', {
        views: [{ state: 'frozen', ySplit: 7 }]
      });

      // Agrupar por establecimiento
      const maquinasPorSala = maquinasEnCero.reduce((acc, maquina) => {
        const sala = maquina.establecimiento || 'Sin establecimiento';
        if (!acc[sala]) {
          acc[sala] = [];
        }
        acc[sala].push(maquina);
        return acc;
      }, {});

      const salasOrdenadas = Object.keys(maquinasPorSala).sort();
      const totalColumnas = 7;

      // Colores corporativos Python
      const BRAND_COLORS = {
        titleBg: 'FF0B3040',
        subtitleBg: 'FF1A5F7A',
        metricsBg: 'FF334155',
        dateBg: 'FF475569',
        headerBg: 'FF0B3040',
        white: 'FFFFFFFF',
        textDark: 'FF223344',
        borderLight: 'FFE2E8F0',
        borderMedium: 'FFC0CCDA',
        borderDark: 'FF94A3B8'
      };

      // FILA 1: Título principal
      ws.mergeCells(1, 1, 1, totalColumnas);
      const titleCell = ws.getCell(1, 1);
      titleCell.value = 'DR GROUP';
      titleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: BRAND_COLORS.white } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.titleBg } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      // FILA 2: Subtítulo
      ws.mergeCells(2, 1, 2, totalColumnas);
      const subCell = ws.getCell(2, 1);
      subCell.value = 'Reporte de Máquinas Sin Transmitir';
      subCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: BRAND_COLORS.white } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.subtitleBg } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.getRow(2).height = 22;

      // FILA 3: Métricas
      ws.mergeCells(3, 1, 3, totalColumnas);
      const metricsCell = ws.getCell(3, 1);
      metricsCell.value = `Total Máquinas: ${maquinasEnCero.length} | Establecimientos Afectados: ${salasOrdenadas.length} | Empresa: ${empresa || 'GENERAL'}`;
      metricsCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_COLORS.white } };
      metricsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.metricsBg } };
      metricsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.getRow(3).height = 22;

      // FILA 4: Fecha de generación
      ws.mergeCells(4, 1, 4, totalColumnas);
      const dateCell = ws.getCell(4, 1);
      dateCell.value = `Generado: ${new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' })}`;
      dateCell.font = { name: 'Segoe UI', size: 10, bold: false, color: { argb: BRAND_COLORS.white } };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.dateBg } };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(4).height = 18;

      // FILA 5-6: Espaciadores
      ws.getRow(5).height = 5;
      ws.getRow(6).height = 8;

      // FILA 7: Headers de columnas
      const headers = ['Establecimiento', 'Empresa', 'Serial', 'NUC', 'Días Transmitidos', 'Tipo Apuesta', 'Novedad'];
      const headerRow = ws.getRow(7);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_COLORS.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FF666666' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });
      headerRow.height = 28;

      // FILA 8+: Datos agrupados por sala
      let currentRow = 8;
      salasOrdenadas.forEach((sala, salaIdx) => {
        // Header de sala (merged)
        if (salaIdx > 0) {
          currentRow++; // Fila vacía entre salas
        }

        ws.mergeCells(currentRow, 1, currentRow, totalColumnas);
        const salaHeaderCell = ws.getCell(currentRow, 1);
        salaHeaderCell.value = `${sala} - ${maquinasPorSala[sala].length} ${maquinasPorSala[sala].length === 1 ? 'máquina' : 'máquinas'}`;
        salaHeaderCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: BRAND_COLORS.textDark } };
        salaHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        salaHeaderCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        salaHeaderCell.border = {
          top: { style: 'medium', color: { argb: BRAND_COLORS.borderDark } },
          left: { style: 'thin', color: { argb: BRAND_COLORS.borderLight } },
          bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderMedium } },
          right: { style: 'thin', color: { argb: BRAND_COLORS.borderLight } }
        };
        ws.getRow(currentRow).height = 22;
        currentRow++;

        // Máquinas de la sala
        maquinasPorSala[sala].forEach(maquina => {
          const row = ws.getRow(currentRow);
          const rowData = [
            '', // Establecimiento vacío (ya está en header)
            maquina.empresa || '—',
            maquina.serial || '—',
            maquina.nuc || '—',
            maquina.diasTransmitidos || 0,
            maquina.tipoApuesta || '—',
            maquina.novedad || 'Sin transmitir'
          ];

          rowData.forEach((value, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            cell.value = value;
            cell.font = { name: 'Segoe UI', size: 9, color: { argb: BRAND_COLORS.textDark } };
            cell.alignment = { 
              horizontal: colIdx === 4 ? 'center' : 'left', 
              vertical: 'middle', 
              wrapText: false,
              indent: colIdx === 0 ? 2 : 0
            };
            cell.border = {
              top: { style: 'thin', color: { argb: BRAND_COLORS.borderLight } },
              left: { style: 'thin', color: { argb: BRAND_COLORS.borderLight } },
              bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderMedium } },
              right: { style: 'thin', color: { argb: BRAND_COLORS.borderLight } }
            };
          });
          row.height = 18;
          currentRow++;
        });
      });

      // Ajustar anchos de columna
      ws.columns = [
        { width: 35 }, // Establecimiento
        { width: 20 }, // Empresa
        { width: 15 }, // Serial
        { width: 15 }, // NUC
        { width: 18 }, // Días Transmitidos
        { width: 18 }, // Tipo Apuesta
        { width: 25 }  // Novedad
      ];

      // Generar archivo
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const timestamp = new Date().toLocaleString('es-CO').replace(/[/:]/g, '-').replace(', ', '_');
      const filename = `Maquinas_En_Cero_${empresa || 'General'}_${timestamp}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      addLog(`✅ Exportadas ${maquinasEnCero.length} máquinas en cero (Formato Python)`, 'success');
      addNotification(`Exportadas ${maquinasEnCero.length} máquinas en cero`, 'success');

      // Log de actividad
      try {
        await logActivity(
          'maquinas_en_cero_exportadas',
          'liquidacion',
          empresa || 'GENERAL',
          {
            exportFormat: 'python_professional',
            empresa: empresa || 'GENERAL',
            totalMaquinas: maquinasEnCero.length,
            salas: salasOrdenadas.length,
            fileName: filename
          },
          currentUser.uid,
          getUserDisplayName(),
          currentUser.email
        );
      } catch (logError) {
        console.error('Error logging export:', logError);
      }

    } catch (error) {
      console.error('Error exportando máquinas en cero:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar máquinas en cero', 'error');
    }
  }, [consolidatedData, empresa, addLog, addNotification, logActivity, currentUser, userProfile]);

  return {
    exportarConsolidado,
    exportarReporteSala,
    exportarReporteDiario,
    exportarMaquinasEnCero
  };
}
