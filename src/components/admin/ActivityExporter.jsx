import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  CircularProgress,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Download,
  GetApp,
  PictureAsPdf,
  TableChart,
  Assignment,
  DateRange
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

/**
 * Componente para exportar logs de actividad en diferentes formatos
 * Fase 2 - Funcionalidades avanzadas de exportación
 */
const ActivityExporter = ({ logs, filters, stats }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * Exporta logs a Excel con formato profesional
   */
  const exportToExcel = async () => {
    setExporting(true);
    handleMenuClose();

    try {
      // Preparar datos para Excel
      const excelData = logs.map(log => ({
        'Fecha': format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        'Usuario': log.userName,
        'Email': log.userEmail,
        'Rol': log.userRole.toUpperCase(),
        'Acción': log.action.replace('_', ' ').toUpperCase(),
        'Entidad': log.entityType || 'N/A',
        'ID Entidad': log.entityId || 'N/A',
        'IP': log.ipAddress || 'N/A',
        'Navegador': log.userAgent ? log.userAgent.split(' ')[0] : 'N/A',
        'Detalles': JSON.stringify(log.details || {})
      }));

      // Crear workbook
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Logs detallados
      const wsData = XLSX.utils.json_to_sheet(excelData);
      
      // Configurar anchos de columna
      wsData['!cols'] = [
        { width: 20 }, // Fecha
        { width: 25 }, // Usuario
        { width: 30 }, // Email
        { width: 15 }, // Rol
        { width: 25 }, // Acción
        { width: 15 }, // Entidad
        { width: 20 }, // ID Entidad
        { width: 15 }, // IP
        { width: 20 }, // Navegador
        { width: 50 }  // Detalles
      ];

      XLSX.utils.book_append_sheet(wb, wsData, 'Logs de Actividad');

      // Hoja 2: Estadísticas
      if (stats) {
        const statsData = [
          { 'Métrica': 'Total de Actividades', 'Valor': stats.totalActivities },
          { 'Métrica': 'Usuarios Únicos', 'Valor': stats.uniqueUsers },
          { 'Métrica': 'Tipos de Acciones', 'Valor': Object.keys(stats.actionTypes).length },
          { 'Métrica': 'Promedio Diario', 'Valor': Math.round(stats.totalActivities / 30) },
          { 'Métrica': '', 'Valor': '' },
          { 'Métrica': 'ACCIONES MÁS FRECUENTES', 'Valor': '' },
          ...Object.entries(stats.actionTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([action, count]) => ({
              'Métrica': action.replace('_', ' ').toUpperCase(),
              'Valor': count
            })),
          { 'Métrica': '', 'Valor': '' },
          { 'Métrica': 'USUARIOS MÁS ACTIVOS', 'Valor': '' },
          ...Object.entries(stats.mostActiveUsers)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([user, count]) => ({
              'Métrica': user.split(' (')[0],
              'Valor': count
            }))
        ];

        const wsStats = XLSX.utils.json_to_sheet(statsData);
        wsStats['!cols'] = [{ width: 40 }, { width: 15 }];
        XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');
      }

      // Generar archivo
      const fileName = `auditoria_sistema_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('❌ Error al exportar a Excel:', error);
    }

    setExporting(false);
  };

  /**
   * Exporta logs a CSV simple
   */
  const exportToCSV = async () => {
    setExporting(true);
    handleMenuClose();

    try {
      const csvData = logs.map(log => [
        format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        log.userName,
        log.userEmail,
        log.userRole,
        log.action,
        log.entityType || '',
        log.entityId || '',
        log.ipAddress || ''
      ]);

      const csvContent = [
        ['Fecha', 'Usuario', 'Email', 'Rol', 'Acción', 'Entidad', 'ID Entidad', 'IP'],
        ...csvData
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const fileName = `auditoria_${format(new Date(), 'ddMMyyyy_HHmm')}.csv`;
      
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();

    } catch (error) {
      console.error('❌ Error al exportar a CSV:', error);
    }

    setExporting(false);
  };

  /**
   * Genera reporte de resumen ejecutivo
   */
  const exportSummaryReport = async () => {
    setExporting(true);
    handleMenuClose();

    try {
      const summary = {
        periodo: {
          inicio: logs.length > 0 ? format(logs[logs.length - 1].timestamp.toDate(), 'dd/MM/yyyy', { locale: es }) : 'N/A',
          fin: logs.length > 0 ? format(logs[0].timestamp.toDate(), 'dd/MM/yyyy', { locale: es }) : 'N/A',
          total_registros: logs.length
        },
        metricas_clave: stats || {},
        filtros_aplicados: filters || {}
      };

      const reportContent = `
REPORTE EJECUTIVO - AUDITORÍA DEL SISTEMA
==========================================

📊 PERÍODO ANALIZADO
- Fecha inicio: ${summary.periodo.inicio}
- Fecha fin: ${summary.periodo.fin}
- Total registros: ${summary.periodo.total_registros}

📈 MÉTRICAS PRINCIPALES
- Total actividades: ${stats?.totalActividades || 'N/A'}
- Usuarios únicos: ${stats?.uniqueUsers || 'N/A'}
- Tipos de acciones: ${stats ? Object.keys(stats.actionTypes).length : 'N/A'}
- Promedio diario: ${stats ? Math.round(stats.totalActivities / 30) : 'N/A'}

🔥 ACCIONES MÁS FRECUENTES
${stats ? Object.entries(stats.actionTypes)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([action, count]) => `- ${action.replace('_', ' ').toUpperCase()}: ${count}`)
  .join('\n') : 'N/A'}

👥 USUARIOS MÁS ACTIVOS
${stats ? Object.entries(stats.mostActiveUsers)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([user, count]) => `- ${user.split(' (')[0]}: ${count} actividades`)
  .join('\n') : 'N/A'}

Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
Sistema Organización RDJ - Auditoría Empresarial
      `;

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const fileName = `resumen_auditoria_${format(new Date(), 'ddMMyyyy_HHmm')}.txt`;
      
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();

    } catch (error) {
      console.error('❌ Error al exportar resumen:', error);
    }

    setExporting(false);
  };

  const hasData = logs && logs.length > 0;

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
        onClick={handleMenuOpen}
        disabled={!hasData || exporting}
        sx={{
          borderRadius: 1,
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
          }
        }}
      >
        {exporting ? 'Exportando...' : 'Exportar Datos'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: 280
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} color="primary">
            Exportar Auditoría
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Chip 
              label={`${logs.length} registros`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
            {stats && (
              <Chip 
                label={`${stats.uniqueUsers} usuarios`} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            )}
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={exportToExcel} sx={{ py: 1.5 }}>
          <TableChart color="success" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Excel Completo (.xlsx)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Logs + estadísticas con formato
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem onClick={exportToCSV} sx={{ py: 1.5 }}>
          <Assignment color="info" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              CSV Simple (.csv)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Datos tabulares para análisis
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem onClick={exportSummaryReport} sx={{ py: 1.5 }}>
          <DateRange color="warning" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Resumen Ejecutivo (.txt)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Métricas clave y tendencias
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ActivityExporter;
