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

  /**
   * Exportar datos consolidados en formato Python profesional
   * Intenta Python → Spectacular → Simple como fallbacks
   */
  const exportarConsolidado = useCallback(async () => {
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
            userProfile?.name || currentUser.displayName || 'Usuario desconocido',
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
  const exportarReporteSala = useCallback(() => {
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
      
    } catch (error) {
      console.error('Error exportando reporte por sala:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar reporte por sala', 'error');
    }
  }, [reporteBySala, empresa, addLog, addNotification]);

  /**
   * Exportar reporte diario multi-hoja por establecimiento
   * @param {string} establecimientoForzado - Establecimiento específico a exportar
   */
  const exportarReporteDiario = useCallback(async (establecimientoForzado) => {
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
          userProfile?.name || currentUser.displayName || 'Usuario desconocido',
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

  return {
    exportarConsolidado,
    exportarReporteSala,
    exportarReporteDiario
  };
}
