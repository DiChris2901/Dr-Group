import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
import { fCurrency, fShortenNumber } from '../../utils/formatNumber';
import DateRangeFilter, { getDateRangeFromFilter } from '../../components/payments/DateRangeFilter';
import { isWithinInterval, isValid } from 'date-fns';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  alpha,
  IconButton,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  AttachMoney,
  Business,
  Assignment,
  CheckCircle,
  Warning,
  Schedule,
  Refresh,
  FilterList,
  Search,
  Clear
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { useCommitments } from '../../hooks/useFirestore';
import useCompanies from '../../hooks/useCompanies';
import { useSettings } from '../../context/SettingsContext';

const ReportsSummaryPage = () => {
  const theme = useTheme();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  
  // Estados locales
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filtros (UI)
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  // Filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    companyFilter: 'all',
    statusFilter: 'all',
    dateRangeFilter: 'thisMonth',
    customStartDate: null,
    customEndDate: null
  });
  const [filtersApplied, setFiltersApplied] = useState(false); // ✅ Cambiar a false - Requiere aplicar filtros
  
  // ✅ Calcular shouldLoadData y fechas para el hook
  // Permitir cargar datos incluso con "all" si hay filtros de fecha
  const shouldLoadData = filtersApplied;
  
  const dateRange = appliedFilters.dateRangeFilter !== 'all' 
    ? getDateRangeFromFilter(
        appliedFilters.dateRangeFilter,
        appliedFilters.customStartDate,
        appliedFilters.customEndDate
      )
    : null;
  
  // Conectar con Firebase para obtener datos reales CON FILTROS
  const { commitments, loading: commitmentsLoading } = useCommitments({
    company: shouldLoadData && appliedFilters.companyFilter !== 'all' ? appliedFilters.companyFilter : null,
    startDate: shouldLoadData && dateRange ? dateRange.startDate : null,  // ✅ Corregido: .startDate
    endDate: shouldLoadData && dateRange ? dateRange.endDate : null,      // ✅ Corregido: .endDate
    shouldLoadData: shouldLoadData
  });
  const { companies, loading: companiesLoading } = useCompanies();
  
  const loading = commitmentsLoading || companiesLoading;

  const applyFilters = () => {
    setAppliedFilters({ 
      companyFilter, 
      statusFilter, 
      dateRangeFilter,
      customStartDate,
      customEndDate
    });
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    // Limpiar filtros en el UI
    setCompanyFilter('all');
    setStatusFilter('all');
    setDateRangeFilter('thisMonth');
    setCustomStartDate(null);
    setCustomEndDate(null);
    
    // ✅ Limpiar filtros aplicados y resetear tabla
    setAppliedFilters({ 
      companyFilter: 'all', 
      statusFilter: 'all', 
      dateRangeFilter: 'thisMonth',
      customStartDate: null,
      customEndDate: null
    });
    setFiltersApplied(false); // ✅ Cambiar a false para mostrar estado vacío
  };

  const hasFiltersChanged = () => {
    if (
      appliedFilters.companyFilter !== companyFilter ||
      appliedFilters.statusFilter !== statusFilter ||
      appliedFilters.dateRangeFilter !== dateRangeFilter
    ) return true;

    // Si el filtro es personalizado, detectar cambios en fechas
    if (dateRangeFilter === 'custom') {
      const aStart = appliedFilters.customStartDate ? new Date(appliedFilters.customStartDate).getTime() : null;
      const aEnd = appliedFilters.customEndDate ? new Date(appliedFilters.customEndDate).getTime() : null;
      const cStart = customStartDate ? new Date(customStartDate).getTime() : null;
      const cEnd = customEndDate ? new Date(customEndDate).getTime() : null;
      return aStart !== cStart || aEnd !== cEnd;
    }
    return false;
  };

  // Filtrar compromisos según filtros aplicados
  const filteredCommitments = useMemo(() => {
    if (!commitments || !filtersApplied) return [];

    let filtered = [...commitments];

    // Empresa
    if (appliedFilters.companyFilter !== 'all') {
      filtered = filtered.filter(c => c.companyId === appliedFilters.companyFilter || c.company === appliedFilters.companyFilter);
    }

    // Estado
    if (appliedFilters.statusFilter !== 'all') {
      if (appliedFilters.statusFilter === 'paid') filtered = filtered.filter(c => c.paid === true);
      else if (appliedFilters.statusFilter === 'pending') filtered = filtered.filter(c => c.paid !== true);
    }

    // Rango de fechas (usar dueDate preferentemente, fallback a createdAt)
    if (appliedFilters.dateRangeFilter !== 'all') {
      const range = getDateRangeFromFilter(
        appliedFilters.dateRangeFilter,
        appliedFilters.customStartDate,
        appliedFilters.customEndDate
      );
      const start = range?.start;
      const end = range?.end;
      if (start && end && isValid(start) && isValid(end)) {
        filtered = filtered.filter(commitment => {
          let commitmentDate;
          if (commitment.dueDate?.toDate) commitmentDate = commitment.dueDate.toDate();
          else if (commitment.dueDate) commitmentDate = new Date(commitment.dueDate);
          else if (commitment.createdAt?.toDate) commitmentDate = commitment.createdAt.toDate();
          else if (commitment.createdAt) commitmentDate = new Date(commitment.createdAt);
          else return false;
          return isWithinInterval(commitmentDate, { start, end });
        });
      }
    }

    return filtered;
  }, [commitments, appliedFilters, filtersApplied]);

  // Calcular estadísticas reales desde Firebase usando compromisos filtrados
  const summaryData = useMemo(() => {
    const base = {
      totalCommitments: 0,
      totalAmount: 0,
      completedCommitments: 0,
      pendingCommitments: 0,
      pendingOnTime: 0,
      overdueCommitments: 0,
      averageAmount: 0,
      monthlyGrowth: 0,
      companies: 0
    };

    if (!filteredCommitments || filteredCommitments.length === 0) {
      return { ...base, companies: 0 };
    }

    const now = new Date();
    const completed = filteredCommitments.filter(c => c.paid === true);
    const pending = filteredCommitments.filter(c => c.paid !== true);
    const overdue = filteredCommitments.filter(c => {
      if (c.paid === true) return false;
      let dueDate;
      if (c.dueDate?.toDate) dueDate = c.dueDate.toDate();
      else if (c.dueDate) dueDate = new Date(c.dueDate);
      else return false;
      return dueDate < now;
    });
    const totalAmount = filteredCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Empresas activas en el rango
    const activeCompanySet = new Set(
      filteredCommitments.map(c => c.companyId || c.company || c.companyName).filter(Boolean)
    );

    return {
      totalCommitments: filteredCommitments.length,
      totalAmount,
      completedCommitments: completed.length,
      pendingCommitments: pending.length, // Total pendientes (incluye vencidos)
      pendingOnTime: Math.max(pending.length - overdue.length, 0), // Pendientes al día (sin vencidos)
      overdueCommitments: overdue.length,
      averageAmount: filteredCommitments.length > 0 ? totalAmount / filteredCommitments.length : 0,
      monthlyGrowth: 0, // Placeholder
      companies: activeCompanySet.size
    };
  }, [filteredCommitments]);

  const statusData = useMemo(() => [
    { name: 'Completados', value: summaryData.completedCommitments, color: '#4caf50' },
    { name: 'Pendientes al día', value: summaryData.pendingOnTime, color: '#ff9800' },
    { name: 'Vencidos', value: summaryData.overdueCommitments, color: '#f44336' }
  ], [summaryData]);

  // Generar datos mensuales reales desde Firebase
  const monthlyData = useMemo(() => {
    if (!filteredCommitments) return [];
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    const monthsToShow = 7;
    
    const monthlyStats = {};
    
    // Inicializar los últimos 7 meses
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      const monthKey = monthNames[month];
      monthlyStats[monthKey] = { month: monthKey, amount: 0, commitments: 0 };
    }
    
    // Procesar compromisos
    filteredCommitments.forEach(commitment => {
      const createdDate = commitment.createdAt?.toDate?.() || new Date(commitment.createdAt);
      const month = monthNames[createdDate.getMonth()];
      
      if (monthlyStats[month]) {
        monthlyStats[month].amount += commitment.amount || 0;
        monthlyStats[month].commitments += 1;
      }
    });
    
    return Object.values(monthlyStats);
  }, [filteredCommitments]);

  // Calcular top companies desde datos filtrados
  const topCompanies = useMemo(() => {
    if (!filteredCommitments || filteredCommitments.length === 0 || !companies || companies.length === 0) {
      return [];
    }
    
    const companyStats = companies.map(company => {
      // Intentar diferentes campos de empresa en los compromisos
      const companyCommitments = filteredCommitments.filter(c => {
        return c.company === company.name || 
               c.companyName === company.name ||
               c.company === company.id ||
               c.companyId === company.id;
      });
      
      const totalAmount = companyCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      return {
        name: company.name,
        amount: totalAmount,
        commitments: companyCommitments.length,
        growth: companyCommitments.length > 0 ? '+5%' : '0%'
      };
    })
    .filter(company => company.commitments > 0) // Solo empresas con compromisos reales
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
    
    return companyStats;
  }, [filteredCommitments, companies]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLastUpdated(new Date());
    
    // Log de actividad
    await logActivity('reports_refresh', 'summary', {
      timestamp: new Date().toISOString()
    });
    
    // Simular tiempo de carga
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleExport = async (format = 'excel') => {
    try {
      // Log de actividad
      await logActivity('reports_export', 'summary', {
        timestamp: new Date().toISOString(),
        format: format,
        recordsCount: summaryData.totalCommitments
      });

      if (format === 'pdf') {
        await exportToPDF();
      } else {
        // 🚀 USAR NUEVA FUNCIÓN PROFESIONAL
        await exportToProfessionalExcel({
          totalCommitments: summaryData.totalCommitments,
          totalAmount: summaryData.totalAmount,
          overdueCount: summaryData.overdueCount,
          complianceRate: summaryData.complianceRate,
          companies: topCompanies.map(company => ({
            name: company.name,
            totalCommitments: company.commitments,
            totalAmount: company.amount,
            paid: Math.floor(company.commitments * 0.7), // Estimado 70% pagados
            pending: Math.floor(company.commitments * 0.25), // Estimado 25% pendientes  
            overdue: Math.floor(company.commitments * 0.05), // Estimado 5% vencidos
            compliance: 85 // Valor por defecto, se puede calcular dinámicamente después
          }))
        });
        
        console.log('✅ Archivo Excel profesional generado exitosamente');
      }
      
    } catch (error) {
      console.error(`❌ Error al generar reporte ${format}:`, error);
      
      await logActivity('reports_export_error', 'summary', {
        timestamp: new Date().toISOString(),
        format: format,
        error: error.message
      });

      alert(`Error al generar el reporte ${format}. Verifica la consola para más detalles.`);
    }
  };

  // 🎨 FUNCIÓN PARA GENERAR GRÁFICAS COMO IMÁGENES
  const generateChartImage = async (chartData, chartType, title) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      canvas.style.backgroundColor = theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white';
      
      const ctx = canvas.getContext('2d');
      
      // Configuración del gráfico según el tipo
      let chartConfig = {
        type: chartType,
        data: chartData,
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: { size: 20, weight: 'bold' },
              color: '#1565C0',
              padding: 20
            },
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 14 },
                padding: 20,
                usePointStyle: true
              }
            }
          },
          scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
            y: {
              beginAtZero: true,
              grid: { color: '#E0E0E0' },
              ticks: {
                font: { size: 12 },
                callback: function(value) {
                  return fCurrency(value);
                }
              }
            },
            x: {
              grid: { color: '#E0E0E0' },
              ticks: { font: { size: 12 } }
            }
          } : {}
        }
      };

      const chart = new Chart(ctx, chartConfig);
      
      // Esperar a que se renderice y obtener la imagen
      setTimeout(() => {
        const imageData = canvas.toDataURL('image/png', 1.0);
        chart.destroy();
        resolve(imageData);
      }, 500);
    });
  };

  // 📊 EXPORTAR A EXCEL AVANZADO CON FORMATO PROFESIONAL
  const exportToExcelAdvanced = async () => {
    console.log('🚀 Generando Excel PREMIUM con formato empresarial...');

    // Crear workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: "DR Group - Reporte Ejecutivo PREMIUM",
      Subject: "Análisis Avanzado de Compromisos Financieros",
      Author: "DR Group Dashboard",
      CreatedDate: new Date()
    };

    // === HOJA 1: DASHBOARD EJECUTIVO ===
    const dashboardData = [
      // Header corporativo
      ['DR GROUP - REPORTE EJECUTIVO PREMIUM', '', '', '', '', '', '', ''],
      [`Generado: ${new Date().toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })}`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''], // Espacio

      // KPIs principales con formato mejorado
      ['INDICADORES CLAVE DE RENDIMIENTO', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['METRICA', 'VALOR', 'FORMATO', '', 'METRICA', 'VALOR', 'FORMATO', ''],
      ['Total Compromisos', summaryData.totalCommitments, 'unidades', '', 'Completados', summaryData.completedCommitments, 'unidades', ''],
      ['Monto Total', summaryData.totalAmount, 'COP', '', 'Pendientes', summaryData.pendingCommitments, 'unidades', ''],
      ['Promedio', summaryData.averageAmount, 'COP', '', 'Vencidos', summaryData.overdueCommitments, 'unidades', ''],
      ['Empresas Activas', topCompanies.length, 'unidades', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''], // Espacio

      // Distribución con formato de tabla profesional
      ['DISTRIBUCION POR ESTADO', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['ESTADO', 'CANTIDAD', 'PORCENTAJE', 'INDICADOR', '', '', '', ''],
    ];

    // Agregar datos de distribución
    statusData.forEach(item => {
      const total = statusData.reduce((sum, s) => sum + s.value, 0);
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
      const indicator = item.value > 20 ? 'ALTO' : item.value > 10 ? 'MEDIO' : 'BAJO';
      
      dashboardData.push([
        item.name, item.value, `${percentage}%`, indicator, '', '', '', ''
      ]);
    });

    const dashboardWs = XLSX.utils.aoa_to_sheet(dashboardData);

    // APLICAR ESTILOS PROFESIONALES
    const range = XLSX.utils.decode_range(dashboardWs['!ref']);
    
    // Estilos para diferentes secciones
    for (let row = 0; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!dashboardWs[cellRef]) continue;

        const cell = dashboardWs[cellRef];
        
        // Header principal (filas 0-1)
        if (row <= 1) {
          cell.s = {
            fill: { fgColor: { rgb: "1565C0" } },
            font: { bold: true, sz: row === 0 ? 18 : 12, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thick", color: { rgb: "FFFFFF" } },
              bottom: { style: "thick", color: { rgb: "FFFFFF" } },
              left: { style: "thick", color: { rgb: "FFFFFF" } },
              right: { style: "thick", color: { rgb: "FFFFFF" } }
            }
          };
        }
        // Headers de sección (filas 3, 12)
        else if (row === 3 || row === 12) {
          cell.s = {
            fill: { fgColor: { rgb: "E3F2FD" } },
            font: { bold: true, sz: 14, color: { rgb: "1565C0" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "medium", color: { rgb: "1565C0" } },
              bottom: { style: "medium", color: { rgb: "1565C0" } }
            }
          };
        }
        // Headers de tabla (filas 5, 14)
        else if (row === 5 || row === 14) {
          cell.s = {
            fill: { fgColor: { rgb: "424242" } },
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "medium", color: { rgb: "424242" } },
              bottom: { style: "medium", color: { rgb: "424242" } }
            }
          };
        }
        // Celdas de datos
        else if (row > 5 && row < 11) {
          // Alternar colores de fila
          const bgColor = (row % 2 === 0) ? "F5F5F5" : "FFFFFF";
          cell.s = {
            fill: { fgColor: { rgb: bgColor } },
            font: { sz: 10, color: { rgb: "424242" } },
            alignment: { horizontal: col === 1 || col === 2 || col === 5 || col === 6 ? "right" : "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E0E0E0" } },
              bottom: { style: "thin", color: { rgb: "E0E0E0" } },
              left: { style: "thin", color: { rgb: "E0E0E0" } },
              right: { style: "thin", color: { rgb: "E0E0E0" } }
            }
          };
          
          // Formato especial para números grandes
          if (typeof cell.v === 'number' && cell.v > 1000) {
            cell.s.numFmt = '#,##0';
            cell.s.font.color = { rgb: "2E7D32" };
            cell.s.font.bold = true;
          }
        }
        // Datos de distribución
        else if (row > 14) {
          const bgColor = ((row - 15) % 2 === 0) ? "FFF3E0" : "FFFFFF";
          cell.s = {
            fill: { fgColor: { rgb: bgColor } },
            font: { sz: 10, color: { rgb: "424242" } },
            alignment: { horizontal: col === 1 || col === 2 ? "center" : "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "FFB74D" } },
              bottom: { style: "thin", color: { rgb: "FFB74D" } },
              left: { style: "thin", color: { rgb: "FFB74D" } },
              right: { style: "thin", color: { rgb: "FFB74D" } }
            }
          };
        }
      }
    }

    // Configurar anchos de columna optimizados
    dashboardWs['!cols'] = [
      { width: 20 }, { width: 15 }, { width: 12 }, { width: 8 },
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 8 }
    ];

    // Merge cells para headers
    dashboardWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Header principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Fecha
      { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // KPIs title
      { s: { r: 12, c: 0 }, e: { r: 12, c: 7 } } // Distribución title
    ];

    // === HOJA 2: ANÁLISIS TEMPORAL PROFESIONAL ===
    const temporalData = [
      ['ANALISIS TEMPORAL DETALLADO', '', '', '', '', '', ''],
      [`Periodo: ${monthlyData[0]?.month || 'N/A'} - ${monthlyData[monthlyData.length - 1]?.month || 'N/A'}`, '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['MES', 'MONTO TOTAL', 'CANTIDAD', 'PROMEDIO', 'CRECIMIENTO %', 'TENDENCIA', 'RANKING']
    ];

    monthlyData.forEach((month, index) => {
      const prevMonth = index > 0 ? monthlyData[index - 1] : month;
      const growth = prevMonth.amount > 0 
        ? ((month.amount - prevMonth.amount) / prevMonth.amount * 100).toFixed(1)
        : '0.0';
      
      const trendText = parseFloat(growth) > 0 ? 'POSITIVA' : parseFloat(growth) < 0 ? 'NEGATIVA' : 'ESTABLE';
      const ranking = index < 2 ? 'ORO' : index < 4 ? 'PLATA' : 'BRONCE';
      
      temporalData.push([
        month.month,
        month.amount,
        month.commitments,
        month.commitments > 0 ? Math.round(month.amount / month.commitments) : 0,
        `${growth}%`,
        trendText,
        ranking
      ]);
    });

    const temporalWs = XLSX.utils.aoa_to_sheet(temporalData);
    
    // Estilos para análisis temporal
    const tempRange = XLSX.utils.decode_range(temporalWs['!ref']);
    for (let row = 0; row <= tempRange.e.r; row++) {
      for (let col = 0; col <= tempRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!temporalWs[cellRef]) continue;

        const cell = temporalWs[cellRef];
        
        if (row <= 2) {
          // Headers
          cell.s = {
            fill: { fgColor: { rgb: row === 0 ? "7B1FA2" : "F3E5F5" } },
            font: { bold: true, sz: row === 0 ? 16 : 12, color: { rgb: row === 0 ? "FFFFFF" : "7B1FA2" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else if (row === 3) {
          // Column headers
          cell.s = {
            fill: { fgColor: { rgb: "424242" } },
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        } else {
          // Data rows
          const bgColor = (row % 2 === 0) ? "F8F9FA" : "FFFFFF";
          cell.s = {
            fill: { fgColor: { rgb: bgColor } },
            font: { sz: 10 },
            alignment: { horizontal: col === 0 ? "left" : "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E0E0E0" } },
              bottom: { style: "thin", color: { rgb: "E0E0E0" } }
            }
          };
          
          // Formato especial para montos
          if (col === 1 && typeof cell.v === 'number') {
            cell.s.numFmt = '#,##0';
            cell.s.font.color = { rgb: "2E7D32" };
            cell.s.font.bold = true;
          }
        }
      }
    }

    temporalWs['!cols'] = [
      { width: 12 }, { width: 18 }, { width: 12 }, { width: 18 }, 
      { width: 15 }, { width: 15 }, { width: 12 }
    ];

    temporalWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];

    // === HOJA 3: TOP EMPRESAS CON FORMATO PREMIUM ===
    if (topCompanies.length > 0) {
      const companiesData = [
        ['TOP EMPRESAS POR RENDIMIENTO', '', '', '', '', '', ''],
        [`Total empresas analizadas: ${topCompanies.length}`, '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['RANKING', 'EMPRESA', 'MONTO TOTAL', 'COMPROMISOS', 'PROMEDIO', 'PARTICIPACION %', 'ESTADO']
      ];

      const totalAmount = topCompanies.reduce((sum, comp) => sum + comp.amount, 0);
      
      topCompanies.forEach((company, index) => {
        const participation = totalAmount > 0 ? ((company.amount / totalAmount) * 100).toFixed(1) : '0.0';
        const status = index === 0 ? 'LIDER' : index < 3 ? 'DESTACADA' : 'ACTIVA';
        const rankingPos = `${index + 1}°`;
        
        companiesData.push([
          rankingPos,
          company.name,
          company.amount,
          company.commitments,
          company.commitments > 0 ? Math.round(company.amount / company.commitments) : 0,
          `${participation}%`,
          status
        ]);
      });

      const companiesWs = XLSX.utils.aoa_to_sheet(companiesData);
      
      // Estilos empresariales
      const compRange = XLSX.utils.decode_range(companiesWs['!ref']);
      for (let row = 0; row <= compRange.e.r; row++) {
        for (let col = 0; col <= compRange.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!companiesWs[cellRef]) continue;

          const cell = companiesWs[cellRef];
          
          if (row <= 2) {
            cell.s = {
              fill: { fgColor: { rgb: row === 0 ? "FF6F00" : "FFF3E0" } },
              font: { bold: true, sz: row === 0 ? 16 : 12, color: { rgb: row === 0 ? "FFFFFF" : "FF6F00" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (row === 3) {
            cell.s = {
              fill: { fgColor: { rgb: "37474F" } },
              font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else {
            // Colores especiales para el top 3
            let bgColor = "FFFFFF";
            let textColor = "424242";
            const dataRow = row - 4;
            
            if (dataRow === 0) { // 1er lugar
              bgColor = "FFF3E0"; textColor = "E65100";
            } else if (dataRow === 1) { // 2do lugar  
              bgColor = "F3E5F5"; textColor = "7B1FA2";
            } else if (dataRow === 2) { // 3er lugar
              bgColor = "E8F5E8"; textColor = "2E7D32";
            } else {
              bgColor = (row % 2 === 0) ? "F8F9FA" : "FFFFFF";
            }
            
            cell.s = {
              fill: { fgColor: { rgb: bgColor } },
              font: { sz: 10, color: { rgb: textColor }, bold: dataRow < 3 },
              alignment: { horizontal: col === 1 ? "left" : "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E0E0E0" } },
                bottom: { style: "thin", color: { rgb: "E0E0E0" } }
              }
            };
            
            if (col === 2 && typeof cell.v === 'number') {
              cell.s.numFmt = '#,##0';
            }
          }
        }
      }

      companiesWs['!cols'] = [
        { width: 10 }, { width: 25 }, { width: 18 }, { width: 12 }, 
        { width: 15 }, { width: 15 }, { width: 12 }
      ];

      companiesWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
      ];
      
      XLSX.utils.book_append_sheet(wb, companiesWs, 'Top Empresas');
    }

    // Agregar las hojas principales
    XLSX.utils.book_append_sheet(wb, dashboardWs, 'Dashboard Ejecutivo');
    XLSX.utils.book_append_sheet(wb, temporalWs, 'Analisis Temporal');

    // Generar y descargar archivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    XLSX.writeFile(wb, `DR-Group-Reporte-Premium-${timestamp}.xlsx`);

    console.log('✨ Reporte Excel PREMIUM generado exitosamente con formato profesional');
  };

  // � EXPORTAR A PDF PROFESIONAL
  const exportToPDF = async () => {
    console.log('�🚀 Generando PDF profesional...');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // === PORTADA CORPORATIVA ===
    pdf.setFillColor(21, 101, 192); // Color corporativo
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    // Logo y título
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DR GROUP', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text('REPORTE EJECUTIVO DE COMPROMISOS FINANCIEROS', pageWidth / 2, 40, { align: 'center' });
    
    // Fecha y hora
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const now = new Date().toLocaleString('es-CO', { 
      timeZone: 'America/Bogota',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    pdf.text(`Generado: ${now}`, pageWidth / 2, 52, { align: 'center' });
    
    // === KPIs PRINCIPALES ===
    let yPos = 80;
    pdf.setTextColor(21, 101, 192);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INDICADORES CLAVE DE RENDIMIENTO', 20, yPos);
    
    yPos += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    const kpis = [
      { label: 'Total Compromisos:', value: summaryData.totalCommitments.toLocaleString('es-CO') },
      { label: 'Monto Total:', value: fCurrency(summaryData.totalAmount) },
      { label: 'Completados:', value: summaryData.completedCommitments.toLocaleString('es-CO') },
      { label: 'Pendientes:', value: summaryData.pendingCommitments.toLocaleString('es-CO') },
      { label: 'Vencidos:', value: summaryData.overdueCommitments.toLocaleString('es-CO') },
      { label: 'Promedio:', value: fCurrency(summaryData.averageAmount) }
    ];
    
    kpis.forEach(kpi => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(kpi.label, 25, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(kpi.value, 120, yPos);
      yPos += 8;
    });
    
    // === DISTRIBUCIÓN POR ESTADO ===
    yPos += 10;
    pdf.setTextColor(123, 31, 162);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DISTRIBUCION POR ESTADO', 20, yPos);
    
    yPos += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    const total = statusData.reduce((sum, item) => sum + item.value, 0);
    statusData.forEach(item => {
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${item.name}:`, 25, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${item.value} (${percentage}%)`, 120, yPos);
      yPos += 8;
    });
    
    // === ANÁLISIS TEMPORAL ===
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 30;
    }
    
    yPos += 10;
    pdf.setTextColor(255, 111, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ANALISIS TEMPORAL', 20, yPos);
    
    yPos += 15;
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    monthlyData.slice(0, 6).forEach((month, index) => {
      const avgAmount = month.commitments > 0 ? month.amount / month.commitments : 0;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${month.month}:`, 25, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${fCurrency(month.amount)} (${month.commitments} compromisos)`, 70, yPos);
      pdf.text(`Promedio: ${fCurrency(avgAmount)}`, 140, yPos);
      yPos += 7;
    });
    
    // === PIE DE PÁGINA ===
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('DR Group Dashboard - Reporte generado automaticamente', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Generar y descargar
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    pdf.save(`DR-Group-Reporte-PDF-${timestamp}.pdf`);
    
    console.log('✨ PDF profesional generado exitosamente');
  };

  // DEBUG: Información esencial sobre el estado de los datos
  // Logs removidos para optimización

  // Función helper para obtener esquemas de colores mejorados
  const getColorScheme = (schemeName) => {
    const schemes = {
      // Esquemas exactos del AdvancedSettingsDrawer.jsx con colores mejorados
      corporate: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main
      ],
      vibrant: [
        '#FF6B6B', // Rojo vibrante
        '#4ECDC4', // Turquesa
        '#45B7D1', // Azul cielo
        '#96CEB4', // Verde menta
        '#FECA57', // Amarillo brillante
        '#FFA07A'  // Salmón
      ],
      pastel: [
        '#A8E6CF', // Verde pastel
        '#DCEDC8', // Verde claro
        '#FFD3A5', // Melocotón
        '#FD9853', // Naranja suave
        '#E1BEE7', // Lavanda
        '#FFDFD3'  // Rosa pálido
      ],
      monochrome: [
        '#2C3E50', // Azul oscuro
        '#34495E', // Gris azulado
        '#7F8C8D', // Gris medio
        '#95A5A6', // Gris claro
        '#BDC3C7', // Gris muy claro
        '#ECF0F1'  // Gris casi blanco
      ],
      ocean: [
        '#1B4F72', // Azul marino
        '#2E86C1', // Azul océano
        '#5DADE2', // Azul medio
        '#85C1E9', // Azul claro
        '#AED6F1', // Azul pastel
        '#D6EAF8'  // Azul muy claro
      ],
      
      // Alias para compatibilidad con nombres en español
      corporativo: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main
      ],
      vibrante: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FFA07A'
      ],
      monocromatico: [
        '#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1'
      ],
      oceano: [
        '#1B4F72', '#2E86C1', '#5DADE2', '#85C1E9', '#AED6F1', '#D6EAF8'
      ]
    };
    
    return schemes[schemeName] || schemes.corporate;
  };

  // Función para crear gradientes dinámicos
  const createGradient = (color1, color2) => ({
    background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  });

  // Función para renderizar gráficas de estado con diseño premium
  const renderStatusChart = (data, chartType) => {
    const { animations, colorScheme, showDataLabels, gridLines } = settings.dashboard.charts;
    const colors = getColorScheme(colorScheme);
    const isAnimated = animations !== 'none';
    const animationDuration = isAnimated ? (animations === 'smooth' ? 300 : animations === 'bounce' ? 500 : 800) : 0;

    // Agregar colores a los datos si no los tienen
    const dataWithColors = data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));

    const commonTooltipStyle = {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      fontSize: '14px'
    };

    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <defs>
              {colors.map((color, index) => (
                <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={1}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={130}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={animationDuration}
            >
              {dataWithColors.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#gradient-${index})`}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} compromisos`, 'Cantidad']}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
          </PieChart>
        );

      case 'donut':
        return (
          <PieChart>
            <defs>
              {colors.map((color, index) => (
                <radialGradient key={`radial-${index}`} id={`radial-${index}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="70%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={color} stopOpacity={1}/>
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={130}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={animationDuration}
            >
              {dataWithColors.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#radial-${index})`}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} compromisos`, 'Cantidad']}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart data={dataWithColors} margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={1}/>
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
            />
            <YAxis 
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
            />
            <Tooltip 
              formatter={(value) => [`${value} compromisos`, 'Cantidad']}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Bar 
              dataKey="value" 
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
              animationDuration={animationDuration}
              stroke={colors[0]}
              strokeWidth={1}
            />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={dataWithColors} margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="statusLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[0]} stopOpacity={1}/>
              </linearGradient>
            </defs>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
            />
            <YAxis 
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              formatter={(value) => [`${value} compromisos`, 'Cantidad']}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]}
              strokeWidth={4}
              dot={{ r: 8, fill: colors[0], strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 10, fill: colors[0], strokeWidth: 2, stroke: '#fff' }}
              animationDuration={animationDuration}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={dataWithColors} margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="statusAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
            />
            <YAxis 
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              formatter={(value) => [`${value} compromisos`, 'Cantidad']}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              strokeWidth={3}
              fill="url(#statusAreaGradient)"
              animationDuration={animationDuration}
            />
          </AreaChart>
        );

      case 'scatter':
        const scatterData = dataWithColors.map((item, index) => ({
          x: index + 1,
          y: item.value,
          z: item.value * 10,
          name: item.name,
          color: colors[index % colors.length]
        }));
        
        return (
          <ScatterChart data={scatterData} margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="x" 
              name="Categoría"
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
            />
            <YAxis 
              dataKey="y" 
              name="Compromisos"
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
            />
            <Tooltip 
              formatter={(value, name) => [value, name === 'y' ? 'Compromisos' : name]}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Scatter
              dataKey="y"
              fill={colors[0]}
              animationDuration={animationDuration}
            >
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        );

      default:
        return renderStatusChart(data, 'pie');
    }
  };

  // Función para renderizar gráficas de tendencia mensual con diseño premium
  const renderTrendChart = (data, chartType) => {
    const { animations, colorScheme, showDataLabels, gridLines } = settings.dashboard.charts;
    const colors = getColorScheme(colorScheme);
    const isAnimated = animations !== 'none';
    const animationDuration = isAnimated ? (animations === 'smooth' ? 300 : animations === 'bounce' ? 500 : 800) : 0;

    const commonProps = {
      data,
      margin: { top: 30, right: 40, left: 20, bottom: 20 }
    };

    const commonAxisProps = {
      axisLine: { stroke: theme.palette.text.secondary, strokeWidth: 2 },
      tickLine: { stroke: theme.palette.text.secondary },
      tick: { fill: theme.palette.text.primary, fontWeight: 500 }
    };

    // Formatters específicos para ejes Y
    const yAxisAmountProps = {
      ...commonAxisProps,
      tickFormatter: (value) => {
        if (value === 0) return '$0';
        if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value}`;
      }
    };

    const yAxisCommitmentsProps = {
      ...commonAxisProps,
      tickFormatter: (value) => {
        if (value === 0) return '0';
        return value.toString();
      }
    };

    const commonTooltipStyle = {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      fontSize: '14px'
    };

    const tooltipProps = {
      formatter: (value, name) => [
        name === 'amount' ? fCurrency(value) : value,
        name === 'amount' ? 'Monto' : 'Compromisos'
      ],
      contentStyle: commonTooltipStyle
    };

    switch (chartType) {
      case 'pie':
        // Para pie chart de tendencia, convertir datos mensuales a pie
        const pieData = data.map((item, index) => ({
          name: item.month,
          value: item.amount, // Usar amount en lugar de commitments para mejor visualización
          commitments: item.commitments,
          fill: colors[index % colors.length]
        }));
        
        return (
          <PieChart>
            <defs>
              {colors.map((color, index) => (
                <linearGradient key={`trend-pie-${index}`} id={`trend-pie-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={1}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0.8}/>
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={130}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={animationDuration}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`trend-pie-cell-${index}`} 
                  fill={colors[index % colors.length]} // Usar color sólido directamente
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, entry) => {
                const total = data.reduce((sum, item) => sum + item.amount, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return [
                  `${fCurrency(value)} (${percentage}%)`,
                  `${entry.payload.month} - ${entry.payload.commitments} compromisos`
                ];
              }}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
          </PieChart>
        );

      case 'donut':
        // Para donut de tendencia, convertir datos mensuales a donut
        const donutData = data.map((item, index) => ({
          name: item.month,
          value: item.amount, // Usar amount en lugar de commitments
          commitments: item.commitments,
          fill: colors[index % colors.length]
        }));
        
        return (
          <PieChart>
            <defs>
              {colors.map((color, index) => (
                <radialGradient key={`trend-donut-${index}`} id={`trend-donut-${index}`} cx="50%" cy="50%" r="50%">
                  <stop offset="30%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="70%" stopColor={color} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={color} stopOpacity={1}/>
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={130}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={animationDuration}
            >
              {donutData.map((entry, index) => (
                <Cell 
                  key={`trend-donut-cell-${index}`} 
                  fill={colors[index % colors.length]} // Usar color sólido directamente
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, entry) => {
                const total = data.reduce((sum, item) => sum + item.amount, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return [
                  `${fCurrency(value)} (${percentage}%)`,
                  `${entry.payload.month} - ${entry.payload.commitments} compromisos`
                ];
              }}
              contentStyle={commonTooltipStyle}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={1}/>
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="commitmentsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[1]} stopOpacity={1}/>
                <stop offset="100%" stopColor={colors[1]} stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis yAxisId="amount" orientation="left" {...yAxisAmountProps} />
            <YAxis yAxisId="commitments" orientation="right" {...yAxisCommitmentsProps} />
            <Tooltip {...tooltipProps} />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Bar 
              yAxisId="amount"
              dataKey="amount" 
              fill="url(#amountGradient)"
              name="Monto"
              radius={[4, 4, 0, 0]}
              animationDuration={animationDuration}
              stroke={colors[0]}
              strokeWidth={1}
            />
            <Bar 
              yAxisId="commitments"
              dataKey="commitments" 
              fill="url(#commitmentsGradient)"
              name="Compromisos"
              radius={[4, 4, 0, 0]}
              animationDuration={animationDuration}
              stroke={colors[1]}
              strokeWidth={1}
            />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <defs>
              <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[0]} stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors[1]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[1]} stopOpacity={1}/>
              </linearGradient>
            </defs>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis yAxisId="amount" orientation="left" {...yAxisAmountProps} />
            <YAxis yAxisId="commitments" orientation="right" {...yAxisCommitmentsProps} />
            <Tooltip {...tooltipProps} />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Line 
              yAxisId="amount"
              type="monotone" 
              dataKey="amount" 
              stroke={colors[0]}
              strokeWidth={4}
              dot={{ r: 8, fill: colors[0], strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 10, fill: colors[0], strokeWidth: 2, stroke: '#fff' }}
              animationDuration={animationDuration}
              name="Monto"
            />
            <Line 
              yAxisId="commitments"
              type="monotone" 
              dataKey="commitments" 
              stroke={colors[1]}
              strokeWidth={4}
              dot={{ r: 8, fill: colors[1], strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 10, fill: colors[1], strokeWidth: 2, stroke: '#fff' }}
              animationDuration={animationDuration}
              name="Compromisos"
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[0]} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="areaGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[1]} stopOpacity={0.8}/>
                <stop offset="100%" stopColor={colors[1]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis yAxisId="amount" orientation="left" {...yAxisAmountProps} />
            <YAxis yAxisId="commitments" orientation="right" {...yAxisCommitmentsProps} />
            <Tooltip {...tooltipProps} />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Area 
              yAxisId="amount"
              type="monotone" 
              dataKey="amount" 
              stackId="1" 
              stroke={colors[0]} 
              strokeWidth={3}
              fill="url(#areaGradient1)"
              animationDuration={animationDuration}
              name="Monto"
            />
            <Area 
              yAxisId="commitments"
              type="monotone" 
              dataKey="commitments" 
              stackId="2" 
              stroke={colors[1]} 
              strokeWidth={3}
              fill="url(#areaGradient2)"
              animationDuration={animationDuration}
              name="Compromisos"
            />
          </AreaChart>
        );

      case 'scatter':
        const scatterData = data.map((item, index) => ({
          x: item.amount / 1000000, // Convertir a millones para mejor visualización
          y: item.commitments,
          name: item.month,
          color: colors[index % colors.length]
        }));
        
        return (
          <ScatterChart data={scatterData} margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
            {gridLines && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider} 
                opacity={0.3}
              />
            )}
            <XAxis 
              dataKey="x" 
              name="Monto"
              axisLine={{ stroke: theme.palette.text.secondary, strokeWidth: 2 }}
              tickLine={{ stroke: theme.palette.text.secondary }}
              tick={{ fill: theme.palette.text.primary, fontWeight: 500 }}
              tickFormatter={(value) => `$${value.toFixed(1)}M`}
              label={{ 
                value: 'Monto (Millones COP)', 
                position: 'insideBottom', 
                offset: -10,
                style: { textAnchor: 'middle', fill: theme.palette.text.secondary, fontSize: '12px' }
              }}
            />
            <YAxis 
              dataKey="y" 
              name="Compromisos"
              {...yAxisCommitmentsProps}
              label={{ 
                value: 'Número de Compromisos', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: theme.palette.text.secondary, fontSize: '12px' }
              }}
            />
            <Tooltip 
              formatter={(value, name, payload) => {
                if (name === 'x') {
                  return [`${fCurrency(value * 1000000)}`, 'Monto Total'];
                }
                return [value, 'Compromisos'];
              }}
              labelFormatter={(label) => `Datos del mes`}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={commonTooltipStyle}>
                      <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
                        📊 {data.name}
                      </p>
                      <p style={{ margin: 0, color: colors[0] }}>
                        💰 Monto: {fCurrency(data.x * 1000000)}
                      </p>
                      <p style={{ margin: 0, color: colors[1] }}>
                        📋 Compromisos: {data.y}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {showDataLabels && (
              <Legend 
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            )}
            <Scatter
              dataKey="y"
              fill={colors[0]}
              animationDuration={animationDuration}
            >
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  r={8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        );

      default:
        return renderTrendChart(data, 'bar');
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto',
      '& @keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : (
        <>
      {/* HEADER GRADIENT SOBRIO */}
      <Paper 
        sx={{ 
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          mb: 4
        }}
      >
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Información principal */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              REPORTES • RESUMEN EJECUTIVO
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mt: 0.5, 
              mb: 0.5,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              📊 Resumen Ejecutivo
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Vista general de todos los compromisos financieros
            </Typography>
          </Box>

          {/* Indicadores y acciones */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center'
          }}>
            {/* Información de actualización */}
            <Chip
              label={`Actualizado: ${lastUpdated.toLocaleTimeString()}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            />
            
            {/* Controles de acción */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)'
                  }
                }}
              >
                <Refresh sx={{ 
                  fontSize: 20,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>

            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Panel de Filtros */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FilterList sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Filtros de Reportes</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select label="Empresa" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    Todas las empresas
                  </Box>
                </MenuItem>
                {companies?.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assignment sx={{ mr: 1, color: 'text.secondary' }} />
                    Todos los estados
                  </Box>
                </MenuItem>
                <MenuItem value="paid">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ mr: 1, color: 'success.main' }} /> Pagados
                  </Box>
                </MenuItem>
                <MenuItem value="pending">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1, color: 'warning.main' }} /> Pendientes
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <DateRangeFilter 
              value={dateRangeFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onChange={setDateRangeFilter}
              onCustomRangeChange={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
              }}
            />
          </Grid>
        </Grid>

        <Box display="flex" gap={2} mt={4} pt={3} borderTop={`1px solid ${alpha(theme.palette.divider, 0.2)}`}>
          <Button
            variant="contained"
            onClick={applyFilters}
            disabled={!hasFiltersChanged() && filtersApplied}
            startIcon={<Search />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {filtersApplied && !hasFiltersChanged() ? 'Filtros Aplicados' : 'Aplicar Filtros'}
          </Button>
          <Button
            variant="outlined"
            onClick={clearFilters}
            startIcon={<Clear />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Limpiar Filtros
          </Button>
        </Box>
      </Paper>

      {/* ✅ ESTADO VACÍO - No hay filtros aplicados */}
      {!filtersApplied && (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: 3,
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.02)
        }}>
          <FilterList sx={{ 
            fontSize: 80, 
            color: alpha(theme.palette.primary.main, 0.3),
            mb: 2
          }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
            Selecciona los filtros para ver el reporte
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Configura los filtros de <strong>período</strong> y <strong>empresa</strong>, luego haz clic en "Aplicar Filtros" para cargar el reporte.
          </Typography>
          <Box sx={{ 
            display: 'inline-flex', 
            gap: 1, 
            px: 3, 
            py: 1.5, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
          }}>
            <Business sx={{ color: theme.palette.info.main }} />
            <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
              Esto optimiza el rendimiento cargando solo los datos que necesitas
            </Typography>
          </Box>
        </Paper>
      )}

      {/* KPI Cards sobrias */}
      {filtersApplied && (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Compromisos', 
            value: summaryData.totalCommitments, 
            icon: Assignment,
            color: theme.palette.primary.main,
            trend: '+15%',
            subtitle: 'Compromisos activos'
          },
          { 
            label: 'Monto Total', 
            value: fCurrency(summaryData.totalAmount), 
            icon: AttachMoney,
            color: theme.palette.success.main,
            trend: `+${summaryData.monthlyGrowth}%`,
            subtitle: 'Valor total de cartera'
          },
          { 
            label: 'Empresas Activas', 
            value: summaryData.companies, 
            icon: Business,
            color: theme.palette.info.main,
            trend: '+3',
            subtitle: 'Empresas con compromisos'
          },
          { 
            label: 'Promedio por Compromiso', 
            value: fCurrency(summaryData.averageAmount), 
            icon: AccountBalance,
            color: theme.palette.warning.main,
            trend: '+5.2%',
            subtitle: 'Monto promedio'
          },
          { 
            label: 'Compromisos Vencidos', 
            value: summaryData.overdueCommitments, 
            icon: Warning,
            color: theme.palette.error.main,
            trend: (() => {
              if (summaryData.overdueCommitments === 0) return '0';
              if (summaryData.overdueCommitments <= 2) return '-2';
              if (summaryData.overdueCommitments <= 5) return '+1';
              return '+' + Math.min(summaryData.overdueCommitments, 10);
            })(),
            subtitle: 'Requieren atención'
          }
        ].map((kpi, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              height: '140px', // Altura fija para consistencia
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ 
                p: 2.5, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${kpi.color}15`,
                    color: kpi.color
                  }}>
                    <kpi.icon sx={{ fontSize: 20 }} />
                  </Box>
                </Box>
                
                {/* Contenido principal */}
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary', 
                    mb: 0.5, 
                    fontSize: '1rem',
                    lineHeight: 1.2
                  }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontWeight: 500, 
                    fontSize: '0.75rem', 
                    mb: 0.25,
                    lineHeight: 1.3
                  }}>
                    {kpi.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    fontSize: '0.65rem',
                    lineHeight: 1.2
                  }}>
                    {kpi.subtitle}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      )}

      {/* Sección de gráficos sobria */}
      {filtersApplied && (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            },
            height: '400px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Distribución por Estado
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {renderStatusChart(statusData, settings.dashboard.charts?.statusChart?.type || settings.dashboard.charts?.defaultType || 'pie')}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            },
            height: '400px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Tendencia Mensual
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                {renderTrendChart(monthlyData, settings.dashboard.charts?.trendChart?.type || settings.dashboard.charts?.defaultType || 'bar')}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Empresas principales sobrias */}
      {filtersApplied && (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Empresas con Mayor Actividad
              </Typography>
              <List>
                {topCompanies.map((company, index) => (
                  <React.Fragment key={company.name}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          backgroundColor: `${theme.palette.primary.main}15`,
                          color: 'primary.main'
                        }}>
                          <Business />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {company.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                                {fCurrency(company.amount)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={`${company.commitments} compromisos activos`}
                      />
                    </ListItem>
                    {index < topCompanies.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Estadísticas rápidas sobrias */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Indicadores Rápidos
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Tasa de Completado</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {summaryData.totalCommitments > 0 ? Math.round((summaryData.completedCommitments / summaryData.totalCommitments) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={summaryData.totalCommitments > 0 ? (summaryData.completedCommitments / summaryData.totalCommitments) * 100 : 0}
                  sx={{ 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'success.main'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Compromisos Pendientes</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {summaryData.totalCommitments > 0 ? Math.round((summaryData.pendingOnTime / summaryData.totalCommitments) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={summaryData.totalCommitments > 0 ? (summaryData.pendingOnTime / summaryData.totalCommitments) * 100 : 0}
                  sx={{ 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'warning.main'
                    }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Compromisos Vencidos</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {summaryData.totalCommitments > 0 ? Math.round((summaryData.overdueCommitments / summaryData.totalCommitments) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={summaryData.totalCommitments > 0 ? (summaryData.overdueCommitments / summaryData.totalCommitments) * 100 : 0}
                  sx={{ 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'error.main'
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}
        </>
      )}
    </Box>
  );
};

export default ReportsSummaryPage;
