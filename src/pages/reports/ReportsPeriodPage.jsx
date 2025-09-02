import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  TablePagination,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';
import { useSettings } from '../../context/SettingsContext';
import {
  DateRange,
  GetApp,
  CalendarMonth,
  TrendingUp,
  AttachMoney,
  Assignment
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { determineCommitmentStatus } from '../../utils/commitmentStatusUtils';
// Comentamos DatePicker temporalmente para evitar errores
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { es } from 'date-fns/locale';

const ReportsPeriodPage = () => {
  const theme = useTheme();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  
  // 🎯 ESTADOS DE FILTROS (igual que ReportsCompanyPage)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [timeRange, setTimeRange] = useState('currentYear');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estados para fechas personalizadas
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showCustomDates, setShowCustomDates] = useState(false);
  
  // Estados para sistema de filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    selectedCompanies: [],
    timeRange: 'currentYear',
    statusFilter: 'all',
    customStartDate: null,
    customEndDate: null
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date(2025, 0, 1)); // 1 enero 2025
  const [endDate, setEndDate] = useState(new Date(2025, 6, 31)); // 31 julio 2025
  const [periodType, setPeriodType] = useState('monthly');
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 🔥 CONECTAR CON FIREBASE PARA OBTENER DATOS REALES
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { companies, loading: companiesLoading } = useCompanies();
  
  const loading = commitmentsLoading || companiesLoading;

  // 🐛 DEBUG: Logging de datos recibidos
  useEffect(() => {
    if (commitments && commitments.length > 0) {
      console.log('🔥 DATOS DE COMPROMISOS RECIBIDOS:', {
        total: commitments.length,
        primeros3: commitments.slice(0, 3).map(c => ({
          id: c.id,
          amount: c.amount,
          totalAmount: c.totalAmount,
          createdAt: c.createdAt,
          dueDate: c.dueDate,
          companyId: c.companyId
        }))
      });
    }
    
    if (companies && companies.length > 0) {
      console.log('🏢 DATOS DE EMPRESAS RECIBIDOS:', {
        total: companies.length,
        nombres: companies.slice(0, 5).map(c => c.name)
      });
    }
  }, [commitments, companies]);

  //  FUNCIÓN DE UTILIDAD PARA FORMATO DE FECHAS
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-ES');
  };

  // 🔄 FUNCIÓN PARA GENERAR NOMBRE DE ARCHIVO ÚNICO
  const generateFileName = () => {
    const dateStr = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const timeStr = new Date().toLocaleTimeString('es-ES', { hour12: false }).replace(/:/g, '-');
    return `DR-Group-Analisis-Temporal-${dateStr}-${timeStr}.xlsx`;
  };

  // Memoizar fecha actual para evitar recálculos constantes
  const currentDate = useMemo(() => new Date(), []);

  // 🎯 FUNCIÓN PARA FILTRAR COMPROMISOS SEGÚN CONFIGURACIÓN DEL DRAWER
  const getFilteredCommitments = useMemo(() => {
    if (!commitments || commitments.length === 0) return [];

    // Usar filtros aplicados si están activos, sino usar filtros actuales
    const filters = filtersApplied ? appliedFilters : {
      searchTerm,
      selectedCompanies,
      timeRange,
      statusFilter,
      customStartDate,
      customEndDate
    };

    console.log('🎯 Aplicando filtros a compromisos:', filters);

    return commitments.filter(commitment => {
      // Filtro por término de búsqueda
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          commitment.description?.toLowerCase().includes(searchLower) ||
          commitment.concept?.toLowerCase().includes(searchLower) ||
          commitment.companyName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por empresas seleccionadas
      if (filters.selectedCompanies.length > 0) {
        if (!filters.selectedCompanies.includes(commitment.companyId)) {
          return false;
        }
      }

      // Filtro por rango de fechas personalizado
      if (filters.customStartDate || filters.customEndDate) {
        const commitmentDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
        if (filters.customStartDate && commitmentDate < new Date(filters.customStartDate)) return false;
        if (filters.customEndDate && commitmentDate > new Date(filters.customEndDate)) return false;
      }

      // Filtro por rango de tiempo predefinido
      if (filters.timeRange && filters.timeRange !== 'all' && !filters.customStartDate && !filters.customEndDate) {
        const commitmentDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
        const today = new Date();
        
        switch (filters.timeRange) {
          case 'currentYear':
            if (commitmentDate.getFullYear() !== today.getFullYear()) return false;
            break;
          case 'lastYear':
            if (commitmentDate.getFullYear() !== today.getFullYear() - 1) return false;
            break;
          case 'last6months':
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            if (commitmentDate < sixMonthsAgo || commitmentDate > today) return false;
            break;
          case 'last3months':
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            if (commitmentDate < threeMonthsAgo || commitmentDate > today) return false;
            break;
        }
      }

      return true;
    });
  }, [commitments, filtersApplied, appliedFilters, searchTerm, selectedCompanies, timeRange, statusFilter, customStartDate, customEndDate]);

  // 🔥 CALCULAR DATOS MENSUALES REALES DESDE FIREBASE CON CLASIFICACIÓN CORRECTA Y FILTROS
  const monthlyData = useMemo(() => {
    const filteredCommitments = getFilteredCommitments;
    
    if (!filteredCommitments || filteredCommitments.length === 0) {
      console.log('⏳ Esperando datos de compromisos filtrados...');
      return [];
    }
    
    console.log(`📊 Procesando ${filteredCommitments.length} compromisos filtrados para análisis mensual...`);
    
    // 🐛 DEBUG: Mostrar fechas de compromisos filtrados para entender el problema
    console.log('🔍 FECHAS DE COMPROMISOS FILTRADOS (primeros 10):');
    filteredCommitments.slice(0, 10).forEach((c, index) => {
      const createdDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
      console.log(`${index + 1}. ID: ${c.id?.slice(0, 8)}... - Creado: ${createdDate.toLocaleDateString('es-ES')} - Vence: ${dueDate.toLocaleDateString('es-ES')}`);
    });
    
    const months = [];
    
    // 📅 GENERAR 12 MESES DEL AÑO ACTUAL (enero - diciembre)
    const currentYear = currentDate.getFullYear();
    
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      console.log(`📅 Buscando compromisos para ${date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })} (${monthStart.toLocaleDateString('es-ES')} - ${monthEnd.toLocaleDateString('es-ES')})`);
      
      // 🔄 USAR dueDate (fecha de vencimiento) para clasificar compromisos por período
      const monthCommitments = filteredCommitments.filter(c => {
        const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
        
        // Verificar que la fecha de vencimiento esté en el rango del mes
        const isInMonth = dueDate >= monthStart && dueDate <= monthEnd;
        
        if (isInMonth) {
          console.log(`  ✅ Compromiso incluido: ${c.id?.slice(0, 8)}... - Vence: ${dueDate.toLocaleDateString('es-ES')}`);
        }
        
        return isInMonth;
      });
      
      console.log(`� ${date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}: ${monthCommitments.length} compromisos encontrados`);
      
      // Calcular monto total usando totalAmount o amount
      const totalAmount = monthCommitments.reduce((sum, c) => {
        const amount = parseFloat(c.totalAmount) || parseFloat(c.amount) || 0;
        return sum + amount;
      }, 0);
      
      // 🔥 USAR CLASIFICACIÓN REAL DE ESTADOS (no los campos status obsoletos)
      let completed = 0;
      let pending = 0;
      let overdue = 0;
      
      monthCommitments.forEach(commitment => {
        const status = determineCommitmentStatus(commitment);
        switch (status) {
          case 'completed':
            completed++;
            break;
          case 'pending':
            pending++;
            break;
          case 'overdue':
            overdue++;
            break;
          default:
            pending++; // Default a pendiente
        }
      });
      
      months.push({
        period: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        amount: totalAmount,
        commitments: monthCommitments.length,
        completed,
        pending,
        overdue,
        avgTicket: monthCommitments.length > 0 ? totalAmount / monthCommitments.length : 0
      });
    }
    
    console.log(`✅ Análisis mensual completado: ${months.length} períodos procesados`);
    console.log('📈 Resumen por mes:', months.map(m => `${m.period}: ${m.commitments} compromisos`));
    return months;
  }, [getFilteredCommitments, currentDate]);

  // 🔥 CALCULAR DATOS SEMANALES REALES DESDE FIREBASE CON FILTROS
  const weeklyData = useMemo(() => {
    const filteredCommitments = getFilteredCommitments;
    
    if (!filteredCommitments || filteredCommitments.length === 0) {
      console.log('⏳ Esperando datos de compromisos filtrados para análisis semanal...');
      return [];
    }
    
    console.log(`📊 Procesando ${filteredCommitments.length} compromisos filtrados para análisis semanal...`);
    const weeks = [];
    
    // Generar últimas 8 semanas
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      
      console.log(`📅 Buscando compromisos para semana ${8 - i} (${weekStart.toLocaleDateString('es-ES')} - ${weekEnd.toLocaleDateString('es-ES')})`);
      
      // 🔄 Usar dueDate (fecha de vencimiento) para consistencia con análisis mensual
      const weekCommitments = filteredCommitments.filter(c => {
        const dueDate = c.dueDate?.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });
      
      console.log(`📊 Semana ${8 - i}: ${weekCommitments.length} compromisos encontrados`);
      
      const totalAmount = weekCommitments.reduce((sum, c) => {
        const amount = parseFloat(c.totalAmount) || parseFloat(c.amount) || 0;
        return sum + amount;
      }, 0);
      
      // Clasificación real de estados
      let completed = 0;
      let pending = 0;
      let overdue = 0;
      
      weekCommitments.forEach(commitment => {
        const status = determineCommitmentStatus(commitment);
        switch (status) {
          case 'completed':
            completed++;
            break;
          case 'pending':
            pending++;
            break;
          case 'overdue':
            overdue++;
            break;
          default:
            pending++;
        }
      });
      
      weeks.push({
        period: `Sem ${8 - i} (${weekStart.getDate()}/${weekStart.getMonth() + 1})`,
        amount: totalAmount,
        commitments: weekCommitments.length,
        completed,
        pending,
        overdue,
        avgTicket: weekCommitments.length > 0 ? totalAmount / weekCommitments.length : 0
      });
    }
    
    console.log(`✅ Análisis semanal completado: ${weeks.length} períodos procesados`);
    console.log('📈 Resumen por semana:', weeks.map(w => `${w.period}: ${w.commitments} compromisos`));
    return weeks;
  }, [getFilteredCommitments, currentDate]);

  const currentData = periodType === 'weekly' ? weeklyData : monthlyData;

  // 💰 FORMATO DE MONEDA COLOMBIANA
  const formatCurrency = useMemo(() => (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }, []);

  const getTotalStats = () => {
    return currentData.reduce((acc, item) => ({
      totalAmount: acc.totalAmount + item.amount,
      totalCommitments: acc.totalCommitments + item.commitments,
      totalCompleted: acc.totalCompleted + (item.completed || 0),
      totalPending: acc.totalPending + (item.pending || 0),
      totalOverdue: acc.totalOverdue + (item.overdue || 0)
    }), {
      totalAmount: 0,
      totalCommitments: 0,
      totalCompleted: 0,
      totalPending: 0,
      totalOverdue: 0
    });
  };

  const stats = getTotalStats();

  // 🎨 FUNCIÓN PARA OBTENER ESQUEMAS DE COLORES SEGÚN CONFIGURACIÓN
  const getColorScheme = (scheme = 'default') => {
    switch (scheme) {
      case 'corporate':
        return [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
          '#8E24AA',
          '#00796B'
        ];
      case 'vibrant':
        return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
      case 'pastel':
        return ['#FFD1DC', '#E6E6FA', '#F0F8FF', '#F5FFFA', '#FFF8DC', '#FFE4E1', '#F0FFF0', '#F8F8FF'];
      case 'monochrome':
        return ['#212121', '#424242', '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#EEEEEE'];
      case 'ocean':
        return ['#1565C0', '#0277BD', '#0288D1', '#039BE5', '#03A9F4', '#29B6F6', '#4FC3F7', '#81D4FA'];
      case 'blue':
        return ['#1976d2', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd', '#0d47a1', '#1565c0'];
      case 'green':
        return ['#388e3c', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e8', '#1b5e20', '#2e7d32'];
      case 'purple':
        return ['#7b1fa2', '#ba68c8', '#ce93d8', '#e1bee7', '#f3e5f5', '#fce4ec', '#4a148c', '#6a1b9a'];
      case 'orange':
        return ['#f57c00', '#ffb74d', '#ffcc02', '#ffd54f', '#fff176', '#fff9c4', '#e65100', '#ef6c00'];
      case 'teal':
        return ['#00695c', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1', '#f3e5f5', '#004d40', '#00796b'];
      case 'pink':
        return ['#c2185b', '#f06292', '#f48fb1', '#f8bbd9', '#fce4ec', '#fff0f5', '#880e4f', '#ad1457'];
      default:
        return [
          theme.palette.primary.main, 
          theme.palette.secondary.main,
          theme.palette.error.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.primary.dark,
          theme.palette.secondary.dark
        ];
    }
  };

  // 🎨 FUNCIÓN PARA RENDERIZAR GRÁFICA DE TENDENCIA DE MONTOS SEGÚN CONFIGURACIÓN
  const renderTrendChart = (data, chartType = 'area') => {
    const { animations, colorScheme, showDataLabels, gridLines } = settings.dashboard.charts || {};
    const colors = getColorScheme(colorScheme);
    const isAnimated = animations !== 'none';
    const animationDuration = isAnimated ? (animations === 'smooth' ? 300 : animations === 'bounce' ? 500 : 800) : 0;
    
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      axisLine: { stroke: theme.palette.text.secondary, strokeWidth: 1 },
      tickLine: { stroke: theme.palette.text.secondary },
      tick: { fill: theme.palette.text.primary, fontSize: 12 }
    };

    const yAxisProps = {
      ...commonAxisProps,
      tickFormatter: (value) => {
        if (value === 0) return '$0';
        if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${Math.round(value)}`;
      }
    };

    const tooltipProps = {
      formatter: (value) => [formatCurrency(value), 'Monto'],
      contentStyle: {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${colors[0]}`,
        borderRadius: 8,
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2, fill: '#fff' }}
              animationDuration={animationDuration}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar 
              dataKey="amount" 
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
              animationDuration={animationDuration}
            />
          </BarChart>
        );

      default: // 'area'
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke={colors[0]}
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#amountGradient)"
              animationDuration={animationDuration}
            />
          </AreaChart>
        );
    }
  };

  // 🎨 FUNCIÓN PARA RENDERIZAR GRÁFICA DE COMPROMISOS SEGÚN CONFIGURACIÓN
  const renderCommitmentsChart = (data, chartType = 'line') => {
    const { animations, colorScheme, showDataLabels, gridLines } = settings.dashboard.charts || {};
    const colors = getColorScheme(colorScheme);
    const isAnimated = animations !== 'none';
    const animationDuration = isAnimated ? (animations === 'smooth' ? 300 : animations === 'bounce' ? 500 : 800) : 0;
    
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      axisLine: { stroke: theme.palette.text.secondary, strokeWidth: 1 },
      tickLine: { stroke: theme.palette.text.secondary },
      tick: { fill: theme.palette.text.primary, fontSize: 12 }
    };

    const tooltipProps = {
      formatter: (value) => [value, 'Compromisos'],
      contentStyle: {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${colors[1]}`,
        borderRadius: 8,
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="commitmentsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[1]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[1]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip {...tooltipProps} />
            <Area 
              type="monotone" 
              dataKey="commitments" 
              stroke={colors[1]}
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#commitmentsGradient)"
              animationDuration={animationDuration}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="commitmentsBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[1]} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={colors[1]} stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar 
              dataKey="commitments" 
              fill="url(#commitmentsBarGradient)"
              radius={[4, 4, 0, 0]}
              animationDuration={animationDuration}
            />
          </BarChart>
        );

      default: // 'line'
        return (
          <LineChart {...commonProps}>
            {gridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip {...tooltipProps} />
            <Line 
              type="monotone" 
              dataKey="commitments" 
              stroke={colors[1]}
              strokeWidth={3}
              dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[1], strokeWidth: 2, fill: '#fff' }}
              animationDuration={animationDuration}
            />
          </LineChart>
        );
    }
  };

  // 🎯 FUNCIONES PARA MANEJAR FILTROS (igual que ReportsCompanyPage)
  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm,
      selectedCompanies,
      timeRange,
      statusFilter,
      customStartDate,
      customEndDate
    });
    setFiltersApplied(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompanies([]);
    setTimeRange('currentYear');
    setStatusFilter('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setShowCustomDates(false);
    setAppliedFilters({
      searchTerm: '',
      selectedCompanies: [],
      timeRange: 'currentYear',
      statusFilter: 'all',
      customStartDate: null,
      customEndDate: null
    });
    setFiltersApplied(false);
  };

  // Función para verificar si los filtros han cambiado
  const hasFiltersChanged = () => {
    return (
      searchTerm !== appliedFilters.searchTerm ||
      JSON.stringify(selectedCompanies.sort()) !== JSON.stringify(appliedFilters.selectedCompanies.sort()) ||
      timeRange !== appliedFilters.timeRange ||
      statusFilter !== appliedFilters.statusFilter ||
      customStartDate !== appliedFilters.customStartDate ||
      customEndDate !== appliedFilters.customEndDate
    );
  };

  // 🐛 DEBUG: Logging de estadísticas calculadas
  useEffect(() => {
    if (currentData && currentData.length > 0) {
      console.log('📊 ESTADÍSTICAS CALCULADAS:', {
        totalPeriods: currentData.length,
        stats: stats,
        periodType: periodType,
        sampleData: currentData.slice(0, 3)
      });
    }
  }, [currentData, stats, periodType]);

  const exportReport = async () => {
    console.log('🚀 Iniciando exportación de reporte temporal...');
    
    try {
      // 📝 Registrar actividad de auditoría - Exportación de reporte
      await logActivity('export_report', 'report', 'period_report', {
        reportType: 'Análisis Temporal',
        periodType: periodType,
        dateRange: `${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}`,
        comparisonMode: comparisonMode,
        totalRecords: currentData.length,
        totalAmount: stats.totalAmount,
        exportFormat: 'Excel'
      });

      // 🔥 CREAR WORKBOOK DE EXCEL
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DR Group Dashboard';
      workbook.lastModifiedBy = 'Sistema DR Group';
      workbook.created = new Date();
      workbook.modified = new Date();

      // 📊 HOJA 1: RESUMEN EJECUTIVO TEMPORAL
      const summarySheet = workbook.addWorksheet('Resumen Temporal');
      
      // Header principal
      summarySheet.mergeCells('A1:H1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = '📈 DR GROUP - ANÁLISIS TEMPORAL DE COMPROMISOS';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = {
        top: { style: 'thick', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thick', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thick', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thick', color: { argb: 'FFFFFFFF' } }
      };
      summarySheet.getRow(1).height = 35;
      
      // Información del reporte
      summarySheet.mergeCells('A2:H2');
      const infoCell = summarySheet.getCell('A2');
      const reportInfo = [
        `📅 Generado: ${new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })} a las ${new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', minute: '2-digit'
        })}`,
        `⏰ Período: ${periodType === 'monthly' ? 'Mensual' : periodType === 'weekly' ? 'Semanal' : 'Diario'}`,
        `🔄 Modo: ${comparisonMode === 'previous' ? 'Comparación con período anterior' : 'Análisis absoluto'}`
      ].join(' | ');
      
      infoCell.value = reportInfo;
      infoCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1565C0' } };
      infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(2).height = 25;

      // === KPIs PRINCIPALES ===
      summarySheet.mergeCells('A4:H4');
      const kpiHeader = summarySheet.getCell('A4');
      kpiHeader.value = '📊 MÉTRICAS CONSOLIDADAS DEL PERÍODO';
      kpiHeader.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1565C0' } };
      kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      kpiHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      kpiHeader.border = {
        top: { style: 'medium', color: { argb: 'FF1565C0' } },
        bottom: { style: 'medium', color: { argb: 'FF1565C0' } }
      };
      summarySheet.getRow(4).height = 30;

      // Headers de métricas
      const metricsHeaders = ['MÉTRICA', 'VALOR', 'FORMATO', 'MÉTRICA', 'VALOR', 'FORMATO'];
      const metricsHeaderRow = summarySheet.getRow(6);
      metricsHeaders.forEach((header, index) => {
        const cell = metricsHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF424242' } },
          bottom: { style: 'medium', color: { argb: 'FF424242' } }
        };
      });
      metricsHeaderRow.height = 25;

      // Datos de métricas
      const metricsData = [
        ['Total Períodos', currentData.length, 'unidades', 'Monto Total Período', formatCurrency(stats.totalAmount), 'COP'],
        ['Total Compromisos', stats.totalCommitments, 'unidades', 'Compromisos Completados', stats.totalCompleted, 'unidades'],
        ['Compromisos Pendientes', stats.totalPending, 'unidades', 'Compromisos Vencidos', stats.totalOverdue, 'unidades'],
        ['Tasa de Completado', `${Math.round((stats.totalCompleted / stats.totalCommitments) * 100)}%`, 'porcentaje', 'Ticket Promedio', formatCurrency(stats.totalAmount / stats.totalCommitments), 'COP'],
        ['Período Analizado', `${periodType.charAt(0).toUpperCase() + periodType.slice(1)}`, 'texto', 'Períodos con Datos', currentData.length, 'unidades']
      ];

      metricsData.forEach((rowData, rowIndex) => {
        const row = summarySheet.getRow(7 + rowIndex);
        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          
          const bgColor = (rowIndex % 2 === 0) ? 'FFFAFAFA' : 'FFFFFFFF';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF424242' } };
          
          if (colIndex === 0 || colIndex === 3) {
            cell.alignment = { horizontal: 'left', vertical: 'center' };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1565C0' } };
          } else if (colIndex === 1 || colIndex === 4) {
            cell.alignment = { horizontal: 'right', vertical: 'center' };
            if (typeof value === 'string' && value.includes('$')) {
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2E7D32' } };
            }
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'center' };
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
        row.height = 20;
      });

      // Configurar anchos de columna para resumen
      summarySheet.columns = [
        { width: 25 }, { width: 20 }, { width: 15 }, { width: 25 }, { width: 20 }, { width: 15 }
      ];

      // 📈 HOJA 2: SERIE TEMPORAL DETALLADA
      const timeSeriesSheet = workbook.addWorksheet('Serie Temporal');
      
      // Header
      timeSeriesSheet.mergeCells('A1:H1');
      const timeSeriesTitleCell = timeSeriesSheet.getCell('A1');
      timeSeriesTitleCell.value = '📈 SERIE TEMPORAL - ANÁLISIS POR PERÍODO';
      timeSeriesTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      timeSeriesTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6F00' } };
      timeSeriesTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      timeSeriesSheet.getRow(1).height = 30;

      // Subtítulo
      timeSeriesSheet.mergeCells('A2:H2');
      const timeSeriesSubtitleCell = timeSeriesSheet.getCell('A2');
      timeSeriesSubtitleCell.value = `🕐 Análisis ${periodType} detallado | Total períodos: ${currentData.length} | Generado: ${new Date().toLocaleDateString('es-ES')}`;
      timeSeriesSubtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFF6F00' } };
      timeSeriesSubtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
      timeSeriesSubtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      timeSeriesSheet.getRow(2).height = 22;

      // Headers detallados
      const timeSeriesHeaders = [
        'PERÍODO', 'MONTO TOTAL', 'COMPROMISOS', 'COMPLETADOS', 'PENDIENTES', 'VENCIDOS', 'TICKET PROMEDIO', '% COMPLETADO'
      ];
      
      const timeSeriesHeaderRow = timeSeriesSheet.getRow(4);
      timeSeriesHeaders.forEach((header, index) => {
        const cell = timeSeriesHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE65100' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FFE65100' } },
          bottom: { style: 'medium', color: { argb: 'FFE65100' } }
        };
      });
      timeSeriesHeaderRow.height = 25;

      // Datos de serie temporal
      let timeSeriesTotal = 0;
      currentData.forEach((period, index) => {
        const row = timeSeriesSheet.getRow(5 + index);
        timeSeriesTotal += period.amount;
        
        const completionRate = period.commitments > 0 ? ((period.completed / period.commitments) * 100).toFixed(1) : 0;
        
        const rowData = [
          period.period,
          period.amount,
          period.commitments,
          period.completed,
          period.pending,
          period.overdue,
          period.avgTicket,
          `${completionRate}%`
        ];
        
        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          
          const bgColor = (index % 2 === 0) ? 'FFFFFBF0' : 'FFFFFFFF';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
          
          if (colIndex === 0) {
            cell.alignment = { horizontal: 'center', vertical: 'center' };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFF6F00' } };
          } else if (colIndex === 1 || colIndex === 6) {
            cell.alignment = { horizontal: 'right', vertical: 'center' };
            cell.numFmt = '$#,##0';
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF2E7D32' } };
          } else if (colIndex >= 2 && colIndex <= 5) {
            cell.alignment = { horizontal: 'center', vertical: 'center' };
            cell.numFmt = '#,##0';
            if (value > 0) {
              cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1565C0' } };
            }
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'center' };
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
        row.height = 18;
      });

      // Fila de totales
      const totalTimeSeriesRow = timeSeriesSheet.getRow(5 + currentData.length);
      totalTimeSeriesRow.getCell(1).value = 'TOTAL PERÍODOS';
      totalTimeSeriesRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      totalTimeSeriesRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6F00' } };
      totalTimeSeriesRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      
      totalTimeSeriesRow.getCell(2).value = timeSeriesTotal;
      totalTimeSeriesRow.getCell(2).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      totalTimeSeriesRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6F00' } };
      totalTimeSeriesRow.getCell(2).numFmt = '$#,##0';
      totalTimeSeriesRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };

      // Configurar anchos de columna para serie temporal
      timeSeriesSheet.columns = [
        { width: 15 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }
      ];

      // 💾 GENERAR Y DESCARGAR ARCHIVO
      const fileName = generateFileName();
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, fileName);
      
      console.log(`✅ Reporte temporal exportado exitosamente: ${fileName}`);
      console.log(`📊 Estadísticas: ${currentData.length} períodos, ${stats.totalCommitments} compromisos, ${formatCurrency(stats.totalAmount)} monto total`);

    } catch (logError) {
      console.error('❌ Error exportando reporte temporal:', logError);
      alert('Error al exportar el reporte. Por favor intente nuevamente.');
    }
  };

  // Funciones para renderizar gráficas dinámicamente
  const renderPeriodChart = (data, chartKey = 'main') => {
    const chartType = settings?.dashboard?.charts?.defaultType || 'line';
    const colors = getColorScheme(settings?.dashboard?.charts?.colorScheme || 'default');
    const animations = settings?.dashboard?.charts?.animations !== false;
    const showGridLines = settings?.dashboard?.charts?.gridLines !== false;
    
    const commonProps = {
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const animationProps = animations ? {
      animationBegin: 0,
      animationDuration: 800
    } : {
      isAnimationActive: false
    };

    console.log('🔍 DEBUG renderPeriodChart:', {
      chartType,
      dataLength: data?.length,
      firstDataItem: data?.[0],
      colors: colors.slice(0, 3)
    });

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps} key={`area-${chartKey}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), 'Monto']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${colors[0]}`,
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={colors[0]}
              fill={`url(#colorGradient-${chartKey})`}
              strokeWidth={2}
              {...animationProps}
            />
            <defs>
              <linearGradient id={`colorGradient-${chartKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps} key={`bar-${chartKey}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), 'Monto']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${colors[0]}`,
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="amount" 
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
              {...animationProps}
            />
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps} key={`line-${chartKey}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), 'Monto']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${colors[0]}`,
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke={colors[0]} 
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: colors[0], strokeWidth: 2, fill: theme.palette.background.paper }}
              {...animationProps}
            />
          </LineChart>
        );
    }
  };

  // Función para renderizar gráfica de compromisos por período
  const renderCommitmentChart = (data, chartKey = 'commitments') => {
    const chartType = settings?.dashboard?.charts?.statusType || 'line';
    const colors = getColorScheme(settings?.dashboard?.charts?.colorScheme || 'default');
    const animations = settings?.dashboard?.charts?.animations !== false;
    const showGridLines = settings?.dashboard?.charts?.gridLines !== false;
    
    const commonProps = {
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const animationProps = animations ? {
      animationBegin: 0,
      animationDuration: 800
    } : {
      isAnimationActive: false
    };

    console.log('🔍 DEBUG renderCommitmentChart:', {
      chartType,
      dataLength: data?.length,
      firstDataItem: data?.[0],
      colors: colors.slice(0, 3)
    });

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps} key={`commitment-area-${chartKey}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip 
              formatter={(value) => [value, 'Compromisos']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${colors[1]}`,
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
            <Area
              type="monotone"
              dataKey="commitments"
              stroke={colors[1]}
              fill={`url(#commitmentGradient-${chartKey})`}
              strokeWidth={2}
              {...animationProps}
            />
            <defs>
              <linearGradient id={`commitmentGradient-${chartKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[1]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[1]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps} key={`commitment-bar-${chartKey}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip 
              formatter={(value) => [value, 'Compromisos']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${colors[1]}`,
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="commitments" 
              fill={colors[1]}
              radius={[4, 4, 0, 0]}
              {...animationProps}
            />
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps} key={`commitment-line-${chartKey}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />}
            <XAxis dataKey="period" stroke={theme.palette.text.secondary} fontSize={12} />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip 
              formatter={(value) => [value, 'Compromisos']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${colors[1]}`,
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="commitments" 
              stroke={colors[1]} 
              strokeWidth={3}
              dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[1], strokeWidth: 2, fill: theme.palette.background.paper }}
              {...animationProps}
            />
          </LineChart>
        );
    }
  };

  // Funciones para manejar paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calcular datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return currentData.slice(startIndex, startIndex + rowsPerPage);
  }, [currentData, page, rowsPerPage]);

  // 🎯 ASIGNAR FUNCIONES PARA QUE EL DRAWER PUEDA ACCEDER A ELLAS
  useEffect(() => {
    ReportsPeriodPage.filterFunctions = {
      handleApplyFilters,
      handleClearFilters,
      hasFiltersChanged,
      setSearchTerm,
      setSelectedCompanies,
      setTimeRange,
      setStatusFilter,
      setCustomStartDate,
      setCustomEndDate,
      searchTerm,
      selectedCompanies,
      timeRange,
      statusFilter,
      customStartDate,
      customEndDate,
      hasActiveFilters: searchTerm || selectedCompanies.length > 0 || timeRange !== 'currentYear' || statusFilter !== 'all' || customStartDate || customEndDate
    };
  }, [
    searchTerm,
    selectedCompanies,
    timeRange,
    statusFilter,
    customStartDate,
    customEndDate,
    handleApplyFilters,
    handleClearFilters,
    hasFiltersChanged
  ]);

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 2
        }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            🔄 Cargando datos temporales desde Firebase...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Analizando compromisos y clasificando por período
          </Typography>
        </Box>
      ) : currentData.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            📊 No se encontraron datos para el período seleccionado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Intenta ajustar los filtros o verifica que existan compromisos en el período
          </Typography>
        </Box>
      ) : (
          <>
        {/* HEADER GRADIENT SOBRIO SIMPLIFICADO */}
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
            mb: 6
          }}
        >
          <Box sx={{ 
            p: 3, 
            position: 'relative',
            zIndex: 1
          }}>
            <Typography variant="overline" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              REPORTES • ANÁLISIS TEMPORAL
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
              📅 Reportes por Período
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Análisis temporal de compromisos financieros
            </Typography>
          </Box>
        </Paper>

        {/* Filtros sobrios */}
        <Card sx={{ 
          mb: 4,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Filtros de Período
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                value="2025-01-01"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              
              <TextField
                label="Fecha Fin"
                type="date"
                value="2025-07-31"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />

              <Button
                variant="contained"
                onClick={() => {
                  // Funcionalidad para aplicar filtros
                  console.log('Aplicando filtros de fecha...');
                }}
                sx={{
                  borderRadius: 1,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: 'white',
                  border: 'none',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  }
                }}
              >
                Aplicar
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Botón de exportar */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={exportReport}
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              px: 3,
              py: 1,
              textTransform: 'none'
            }}
          >
            Exportar Reporte
          </Button>
        </Box>

        {/* Tarjetas de resumen con datos reales de Firebase */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              label: 'Monto Total Período', 
              value: formatCurrency(stats.totalAmount), 
              color: theme.palette.success.main,
              icon: AttachMoney,
              subtitle: `${periodType === 'monthly' ? 'Últimos 12 meses' : 'Últimas 8 semanas'}`
            },
            { 
              label: 'Total Compromisos', 
              value: stats.totalCommitments, 
              color: theme.palette.primary.main,
              icon: Assignment,
              subtitle: `En ${currentData.length} períodos`
            },
            { 
              label: 'Ticket Promedio', 
              value: stats.totalCommitments > 0 ? formatCurrency(stats.totalAmount / stats.totalCommitments) : formatCurrency(0), 
              color: theme.palette.warning.main,
              icon: CalendarMonth,
              subtitle: `Promedio por compromiso`
            }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}15`,
                      color: stat.color
                    }}>
                      <stat.icon sx={{ fontSize: 24 }} />
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {stat.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Gráficos sobrios */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Gráfico de tendencias */}
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Tendencia de Montos ({periodType === 'monthly' ? 'Mensual' : 'Semanal'})
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {renderPeriodChart(currentData, 'trend')}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de compromisos */}
          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Compromisos por Período
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {renderCommitmentChart(currentData, 'commitments')}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabla detallada sobria */}
        <Card sx={{ 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Detalle por Período
            </Typography>
            <TableContainer component={Paper} sx={{ 
              backgroundColor: 'transparent',
              boxShadow: 'none'
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: theme.palette.grey[50],
                    '& th': { 
                      fontWeight: 600,
                      color: 'text.primary'
                    }
                  }}>
                    <TableCell>Período</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Compromisos</TableCell>
                    <TableCell>Completados</TableCell>
                    <TableCell>Pendientes</TableCell>
                    <TableCell>Vencidos</TableCell>
                    <TableCell>Ticket Promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow
                      key={row.period}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: theme.palette.action.hover 
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {row.period}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{row.commitments}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.completed || 0}
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.pending || 0}
                          color="warning"
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.overdue || 0}
                          color="error"
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {formatCurrency(row.avgTicket || (row.amount / row.commitments))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={currentData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Registros por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              sx={{
                borderTop: 1,
                borderColor: 'divider',
                mt: 0,
                '& .MuiTablePagination-toolbar': {
                  padding: '8px 16px',
                  minHeight: '52px'
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary
                },
                '& .MuiSelect-select': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </CardContent>
        </Card>
          </>
        )}
      </Box>
    // </LocalizationProvider>
  );
};

// 🎯 EXPORTAR FUNCIONES PARA EL DRAWER DE CONFIGURACIÓN
ReportsPeriodPage.filterFunctions = {
  handleApplyFilters: null, // Se asignará desde el componente
  handleClearFilters: null, // Se asignará desde el componente
  hasFiltersChanged: null,  // Se asignará desde el componente
  setSearchTerm: null,
  setSelectedCompanies: null,
  setTimeRange: null,
  setStatusFilter: null,
  setCustomStartDate: null,
  setCustomEndDate: null,
  searchTerm: '',
  selectedCompanies: [],
  timeRange: 'currentYear',
  statusFilter: 'all',
  customStartDate: null,
  customEndDate: null,
  hasActiveFilters: false
};

export default ReportsPeriodPage;
