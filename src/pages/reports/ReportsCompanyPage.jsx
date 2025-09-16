import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
import ExcelJS from 'exceljs';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  InputAdornment,
  alpha,
  CircularProgress,
  Chip,
  IconButton,
  Collapse,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import {
  Business,
  Search,
  GetApp,
  AttachMoney,
  Clear,
  FilterList,
  CalendarToday,
  DateRange
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import DateRangeFilter, { getDateRangeFromFilter } from '../../components/payments/DateRangeFilter';
import { isValid } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useCommitments, useCompanies, usePayments } from '../../hooks/useFirestore';
import { useSettings } from '../../context/SettingsContext';

const ReportsCompanyPage = () => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { logActivity } = useActivityLogs();
  
  // Estados de filtros mejorados como CommitmentsPage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [timeRange, setTimeRange] = useState('last6months');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // ✅ ESTADOS PARA FECHAS PERSONALIZADAS
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  // ✅ ESTADO PARA DATERANGEFILTER (por defecto sin filtrar)
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  
  // ✅ NUEVOS ESTADOS PARA SISTEMA DE FILTROS SPECTACULAR
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    selectedCompanies: [],
    timeRange: 'last6months',
    dateRangeFilter: 'all',
    statusFilter: 'all',
    customStartDate: null,
    customEndDate: null
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Conectar con Firebase para obtener datos reales
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { companies: companiesData, loading: companiesLoading } = useCompanies();
  const { payments, loading: paymentsLoading } = usePayments();
  
  const loading = commitmentsLoading || companiesLoading || paymentsLoading;

  // ✅ ESTADO DERIVADO DE SELECCIÓN MULTI-EMPRESA
  const isAllCompaniesSelected = companiesData && companiesData.length > 0 && selectedCompanies.length === companiesData.length; // legacy (aún usado en chips)
  const isSomeCompaniesSelected = selectedCompanies.length > 0 && selectedCompanies.length < (companiesData?.length || 0); // legacy (para compatibilidad visual)
  const allCompanyIds = useMemo(() => (companiesData ? companiesData.map(c => c.id) : []), [companiesData]);
  const trulyAllSelected = allCompanyIds.length > 0 && allCompanyIds.every(id => selectedCompanies.includes(id)) && selectedCompanies.length === allCompanyIds.length;

  // ✅ LIMPIEZA DE EMPRESAS SELECCIONADAS INVÁLIDAS (solo cuando cambia el catálogo)
  useEffect(() => {
    if (companiesData && companiesData.length > 0 && selectedCompanies.length > 0) {
      const validIds = companiesData.map(company => company.id);
      const filteredSelection = selectedCompanies.filter(id => id && validIds.includes(id));
      if (filteredSelection.length !== selectedCompanies.length) {
        console.log('Limpiando empresas inválidas:', {
          original: selectedCompanies,
          filtered: filteredSelection
        });
        setSelectedCompanies(filteredSelection);
      }
    }
  }, [companiesData]); // Removido selectedCompanies para evitar loops

  // ✅ CALCULAR EMPRESAS ENRIQUECIDAS CON DATOS DE FIREBASE
  const enrichedCompanies = useMemo(() => {
    console.log('🔄 Calculando enrichedCompanies:', {
      commitments: commitments?.length || 0,
      companiesData: companiesData?.length || 0,
      loading: { commitmentsLoading, companiesLoading }
    });

    if (!commitments || !companiesData) {
      console.log('❌ Datos faltantes para enrichedCompanies');
      return [];
    }
    
    const result = companiesData.map(company => {
      const companyCommitments = commitments.filter(c => c.companyId === company.id);
      const totalAmount = companyCommitments.reduce((sum, c) => {
        const amount = parseFloat(c.totalAmount) || parseFloat(c.amount) || 0;
        return sum + amount;
      }, 0);
      // ✅ CORRECCIÓN: Contar correctamente compromisos pagados
      const completed = companyCommitments.filter(c => {
        const isPaidByStatus = c.status === 'completed' || c.status === 'paid';
        const isPaidByFlag = c.paid === true || c.isPaid === true;
        return isPaidByStatus || isPaidByFlag;
      }).length;
      const pending = companyCommitments.filter(c => c.status === 'pending').length;
      const overdue = companyCommitments.filter(c => c.status === 'overdue').length;
      
      return {
        id: company.id,
        name: company.name,
        logoURL: company.logoURL,
        totalAmount,
        commitments: companyCommitments.length,
        completed,
        pending,
        overdue,
        avgTicket: companyCommitments.length > 0 ? totalAmount / companyCommitments.length : 0,
        growth: 0, // TODO: Implementar cálculo de crecimiento
        // Datos adicionales para filtros
        rawCommitments: companyCommitments
      };
    });

    console.log('✅ enrichedCompanies calculado:', {
      empresasConDatos: result.filter(c => c.totalAmount > 0).length,
      totalEmpresas: result.length,
      muestrasConDatos: result.filter(c => c.totalAmount > 0).slice(0, 3).map(c => ({
        name: c.name,
        totalAmount: c.totalAmount,
        commitments: c.commitments
      }))
    });

    return result;
  }, [commitments, companiesData, commitmentsLoading, companiesLoading]);

  // ✅ FUNCIONES PARA SISTEMA DE FILTROS SPECTACULAR
  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm,
      selectedCompanies,
      timeRange,
      dateRangeFilter,
      statusFilter,
      customStartDate,
      customEndDate
    });
    setFiltersApplied(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompanies([]);
    setTimeRange('last6months');
    setDateRangeFilter('all');
    setStatusFilter('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setAppliedFilters({
      searchTerm: '',
      selectedCompanies: [],
      timeRange: 'last6months',
      dateRangeFilter: 'all',
      statusFilter: 'all',
      customStartDate: null,
      customEndDate: null
    });
    setFiltersApplied(false);
  };

  const hasFiltersChanged = () => {
    return (
      appliedFilters.searchTerm !== searchTerm ||
      JSON.stringify(appliedFilters.selectedCompanies) !== JSON.stringify(selectedCompanies) ||
      appliedFilters.timeRange !== timeRange ||
      appliedFilters.dateRangeFilter !== dateRangeFilter ||
      appliedFilters.statusFilter !== statusFilter ||
      appliedFilters.customStartDate !== customStartDate ||
      appliedFilters.customEndDate !== customEndDate
    );
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // ✅ FUNCIONES PARA FECHAS PERSONALIZADAS
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    // Sincronizar con DateRangeFilter
    const mapping = {
      'lastmonth': 'lastMonth',
      'last3months': 'last90days',
      'last6months': 'last6months',
      'last12months': 'thisYear',
      'custom': 'custom'
    };
    setDateRangeFilter(mapping[value] || value);
    
    if (value === 'custom') {
      // Establecer fechas por defecto si no existen
      if (!customStartDate) {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setCustomStartDate(lastMonth);
      }
      if (!customEndDate) {
        setCustomEndDate(new Date());
      }
    }
  };

  // ✅ FUNCIONES PARA DATERANGEFILTER
  const handleDateRangeChange = (value) => {
    setDateRangeFilter(value);
    // Sincronizar con timeRange para mantener compatibilidad
    const reverseMapping = {
      'lastMonth': 'lastmonth',
      'last90days': 'last3months',
      'last6months': 'last6months',
      'thisYear': 'last12months',
      'custom': 'custom'
    };
    setTimeRange(reverseMapping[value] || 'last6months');
  };

  const handleCustomRangeChange = (startDate, endDate) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Calcular datos mensuales por empresa desde Firebase
  const monthlyCompanyData = useMemo(() => {
    if (!commitments || !companiesData) return [];
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    const last6MonthsIndexes = [];
    
    // Obtener los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      last6MonthsIndexes.push(monthIndex);
    }
    
    return last6MonthsIndexes.map((monthIndex) => {
      const monthData = { month: months[monthIndex] };
      
      companiesData.slice(0, 8).forEach(company => { // Limitar a 8 empresas para mejor visualización
        const monthCommitments = commitments.filter(c => {
          if (!c.dueDate) return false;
          const commitmentDate = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
          return commitmentDate.getMonth() === monthIndex && 
                 commitmentDate.getFullYear() === currentYear &&
                 c.companyId === company.id;
        });
        
        monthData[company.name] = monthCommitments.reduce((sum, c) => {
          const amount = parseFloat(c.totalAmount) || parseFloat(c.amount) || 0;
          return sum + amount;
        }, 0);
      });
      
      return monthData;
    });
  }, [commitments, companiesData]);

  // Generar colores dinámicos para las empresas
  const getCompanyColor = (index) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
      '#FF6B6B',
      '#4ECDC4'
    ];
    return colors[index % colors.length];
  };

  // ✨ FUNCIÓN PARA ESQUEMAS DE COLORES (Compatible con Settings)
  const getColorScheme = (schemeName) => {
    const schemes = {
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
      // Alias en español
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

  // ✨ FUNCIÓN PARA RENDERIZAR GRÁFICA CON CONFIGURACIONES
  const renderCompanyTrendChart = (data, chartType = 'bar') => {
    if (!data || data.length === 0) return null;
    
    const { animations, colorScheme, showDataLabels, gridLines } = settings?.dashboard?.charts || {};
    const colors = getColorScheme(colorScheme || 'corporate');
    const isAnimated = animations !== 'none';
    const animationDuration = isAnimated ? (animations === 'smooth' ? 300 : animations === 'bounce' ? 500 : 800) : 0;

    const commonProps = {
      data,
      margin: { top: 30, right: 40, left: 20, bottom: 20 }
    };

    const commonAxisProps = {
      axisLine: { stroke: theme.palette.text.secondary, strokeWidth: 1 },
      tickLine: { stroke: theme.palette.text.secondary, strokeWidth: 1 },
      tick: { fill: theme.palette.text.primary, fontWeight: 500, fontSize: 12 }
    };

    const commonTooltipStyle = {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontSize: '12px'
    };

    const tooltipProps = {
      formatter: (value, name) => [formatCurrency(value), name],
      contentStyle: commonTooltipStyle
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={gridLines !== false ? alpha(theme.palette.divider, 0.3) : 'transparent'}
              horizontal={true}
              vertical={true}
            />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip {...tooltipProps} />
            <Legend />
            {companiesData && companiesData.slice(0, 8).map((company, index) => (
              <Line
                key={company.id}
                type="monotone"
                dataKey={company.name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                animationDuration={animationDuration}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={gridLines !== false ? alpha(theme.palette.divider, 0.3) : 'transparent'}
              horizontal={true}
              vertical={true}
            />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip {...tooltipProps} />
            <Legend />
            {companiesData && companiesData.slice(0, 8).map((company, index) => (
              <Area
                key={company.id}
                type="monotone"
                dataKey={company.name}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                animationDuration={animationDuration}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={gridLines !== false ? alpha(theme.palette.divider, 0.3) : 'transparent'}
              horizontal={true}
              vertical={true}
            />
            <XAxis dataKey="month" {...commonAxisProps} />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip {...tooltipProps} />
            <Legend />
            {companiesData && companiesData.slice(0, 8).map((company, index) => (
              <Bar
                key={company.id}
                dataKey={company.name}
                fill={colors[index % colors.length]}
                radius={[2, 2, 0, 0]}
                animationDuration={animationDuration}
              />
            ))}
          </BarChart>
        );
    }
  };

  const filteredCompanies = enrichedCompanies.filter(company => {
    // ✅ USAR FILTROS ACTUALES DIRECTAMENTE (no requiere hacer clic en "Filtrar")
    const filters = {
      searchTerm,
      selectedCompanies,
      timeRange,
      dateRangeFilter,
      statusFilter,
      customStartDate,
      customEndDate
    };
    
    // ✅ FILTRO POR FECHAS USANDO DATERANGEFILTER
    let dateFiltered = true;
    if (filters.dateRangeFilter && filters.dateRangeFilter !== 'all') {
      const dateRange = getDateRangeFromFilter(filters.dateRangeFilter, filters.customStartDate, filters.customEndDate);
      if (dateRange && isValid(dateRange.start) && isValid(dateRange.end)) {
        // Filtrar por compromisos que tengan fechas en el rango seleccionado
        const hasCommitmentsInRange = company.rawCommitments && company.rawCommitments.some(commitment => {
          if (!commitment.dueDate) return false;
          const commitmentDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
          return commitmentDate >= dateRange.start && commitmentDate <= dateRange.end;
        });
        dateFiltered = hasCommitmentsInRange;
      }
    }
    
    return company.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
           (filters.selectedCompanies.length === 0 || filters.selectedCompanies.includes(company.id)) &&
           dateFiltered &&
           (filters.statusFilter === 'all' || 
            (filters.statusFilter === 'high-performance' && company.completed / company.commitments >= 0.8) ||
            (filters.statusFilter === 'medium-performance' && company.completed / company.commitments >= 0.5 && company.completed / company.commitments < 0.8) ||
            (filters.statusFilter === 'low-performance' && company.completed / company.commitments < 0.5));
  });

  // Opciones de estado para filtros
  const statusOptions = [
    { value: 'all', label: 'Todas las empresas', color: 'default', icon: '🏢' },
    { value: 'high-performance', label: 'Alto desempeño (>80%)', color: 'success', icon: '🚀' },
    { value: 'medium-performance', label: 'Desempeño medio (50-80%)', color: 'warning', icon: '⚠️' },
    { value: 'low-performance', label: 'Bajo desempeño (<50%)', color: 'error', icon: '📉' }
  ];

  const hasActiveFilters = searchTerm || selectedCompanies.length > 0 || dateRangeFilter !== 'all' || statusFilter !== 'all' || customStartDate || customEndDate;

  // ✅ RECALCULAR MÉTRICAS CON DATOS FILTRADOS POR FECHA
  const filteredCompaniesWithRecalculatedStats = useMemo(() => {
    if (!filteredCompanies.length) return [];
    
    return filteredCompanies.map(company => {
      // Si no hay filtro de fecha, usar métricas originales
      if (!dateRangeFilter || dateRangeFilter === 'all') {
        return company;
      }
      
      // Aplicar filtro de fecha a los compromisos para recalcular métricas
      const dateRange = getDateRangeFromFilter(dateRangeFilter, customStartDate, customEndDate);
      if (!dateRange || !isValid(dateRange.start) || !isValid(dateRange.end)) {
        return company;
      }
      
      // Filtrar compromisos por fecha
      const filteredCommitments = company.rawCommitments.filter(commitment => {
        if (!commitment.dueDate) return false;
        const commitmentDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
        return commitmentDate >= dateRange.start && commitmentDate <= dateRange.end;
      });
      
      // Recalcular métricas solo con compromisos del período
      const totalAmount = filteredCommitments.reduce((sum, c) => {
        const amount = parseFloat(c.totalAmount) || parseFloat(c.amount) || 0;
        return sum + amount;
      }, 0);
      
      const completed = filteredCommitments.filter(c => {
        const isPaidByStatus = c.status === 'completed' || c.status === 'paid';
        const isPaidByFlag = c.paid === true || c.isPaid === true;
        return isPaidByStatus || isPaidByFlag;
      }).length;
      
      const pending = filteredCommitments.filter(c => c.status === 'pending').length;
      const overdue = filteredCommitments.filter(c => c.status === 'overdue').length;
      
      return {
        ...company,
        totalAmount,
        commitments: filteredCommitments.length,
        completed,
        pending,
        overdue,
        avgTicket: filteredCommitments.length > 0 ? totalAmount / filteredCommitments.length : 0,
        rawCommitments: filteredCommitments
      };
    });
  }, [filteredCompanies, dateRangeFilter, customStartDate, customEndDate]);

  // Estadísticas globales para el header (usando datos recalculados)
  const globalStats = useMemo(() => {
    const totalAmount = filteredCompaniesWithRecalculatedStats.reduce((sum, company) => sum + company.totalAmount, 0);
    const totalCommitments = filteredCompaniesWithRecalculatedStats.reduce((sum, company) => sum + company.commitments, 0);
    const totalCompleted = filteredCompaniesWithRecalculatedStats.reduce((sum, company) => sum + company.completed, 0);
    const totalPending = filteredCompaniesWithRecalculatedStats.reduce((sum, company) => sum + company.pending, 0);
    
    return {
      totalAmount,
      totalCommitments,
      totalCompleted,
      totalPending,
      totalCompanies: filteredCompaniesWithRecalculatedStats.length
    };
  }, [filteredCompaniesWithRecalculatedStats]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCompletionRate = (company) => {
    return Math.round((company.completed / company.commitments) * 100);
  };

  // Función para obtener datos históricos de los últimos 6 meses para Excel
  const getLast6MonthsData = () => {
    if (!commitments || !companiesData) return [];
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    const last6MonthsIndexes = [];
    
    // Obtener los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (new Date().getMonth() - i + 12) % 12;
      last6MonthsIndexes.push(monthIndex);
    }

    // Generar datos históricos por empresa
    return companiesData.map(company => {
      const companyHistoricalData = {
        name: company.name,
        data: last6MonthsIndexes.map(monthIndex => {
          // Contar compromisos del mes
          const monthCommitments = commitments.filter(c => {
            if (!c.dueDate) return false;
            const commitmentDate = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
            return commitmentDate.getMonth() === monthIndex && 
                   commitmentDate.getFullYear() === currentYear &&
                   c.companyId === company.id;
          });
          
          return {
            month: months[monthIndex],
            compromisos: monthCommitments.length,
            monto: monthCommitments.reduce((sum, c) => sum + (c.amount || 0), 0)
          };
        })
      };
      return companyHistoricalData;
    });
  };

  const exportReport = async () => {
    console.log('Exportando reporte por empresa...');
    setExportingExcel(true);
    
    try {
      // 📝 Registrar actividad de auditoría - Exportación de reporte
      const selectedCompanyNames = selectedCompanies.length === 0 ? 'Todas las empresas' : 
        selectedCompanies.map(id => companiesData.find(c => c.id === id)?.name || id).join(', ');
      
      await logActivity('export_report', 'report', 'company_report', {
        reportType: 'Análisis por Empresa',
        selectedCompanies: selectedCompanyNames,
        timeRange: timeRange,
        searchTerm: searchTerm || 'Sin filtro',
        totalCompanies: filteredCompaniesWithRecalculatedStats.length,
        totalAmount: globalStats.totalAmount,
        exportFormat: 'Excel'
      });

      // 📊 CREAR WORKBOOK DE EXCEL CON FORMATO PROFESIONAL
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DR Group Dashboard';
      workbook.created = new Date();
      workbook.properties.title = "DR Group - Reporte de Empresas PREMIUM";
      workbook.properties.subject = "Análisis Detallado por Empresa";
      
      // 📋 HOJA 1: DASHBOARD EJECUTIVO EMPRESAS
      const summarySheet = workbook.addWorksheet('Dashboard Ejecutivo');
      
      // === HEADER CORPORATIVO PROFESIONAL ===
      summarySheet.mergeCells('A1:H1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = '🏢 DR GROUP - ANÁLISIS EMPRESARIAL PREMIUM';
      titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = {
        top: { style: 'thick', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thick', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thick', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thick', color: { argb: 'FFFFFFFF' } }
      };
      summarySheet.getRow(1).height = 35;
      
      // Información del reporte con formato empresarial
      summarySheet.mergeCells('A2:H2');
      const infoCell = summarySheet.getCell('A2');
      infoCell.value = `Generado: ${new Date().toLocaleString('es-ES', { 
        timeZone: 'America/Bogota',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })} | Filtros: ${selectedCompanyNames} | Período: ${timeRange}`;
      infoCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1565C0' } };
      infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(2).height = 25;

      // === SECCIÓN KPIs PRINCIPALES ===
      summarySheet.mergeCells('A4:H4');
      const kpiHeader = summarySheet.getCell('A4');
      kpiHeader.value = '� INDICADORES CLAVE DE RENDIMIENTO';
      kpiHeader.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1565C0' } };
      kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      kpiHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      kpiHeader.border = {
        top: { style: 'medium', color: { argb: 'FF1565C0' } },
        bottom: { style: 'medium', color: { argb: 'FF1565C0' } }
      };
      summarySheet.getRow(4).height = 25;

      // Headers de KPIs con formato profesional
      const kpiHeaderRow = summarySheet.getRow(6);
      ['MÉTRICA', 'VALOR', 'FORMATO', '', 'MÉTRICA', 'VALOR', 'FORMATO', ''].forEach((header, index) => {
        const cell = kpiHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF424242' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF424242' } },
          bottom: { style: 'medium', color: { argb: 'FF424242' } }
        };
      });
      kpiHeaderRow.height = 20;

      // Datos de KPIs (usando métricas recalculadas)
      const kpiData = [
        ['Total Empresas', filteredCompaniesWithRecalculatedStats.length, 'unidades', '', 'Empresas Activas', filteredCompaniesWithRecalculatedStats.filter(c => c.commitments > 0).length, 'unidades'],
        ['Monto Total', filteredCompaniesWithRecalculatedStats.reduce((sum, c) => sum + c.totalAmount, 0), 'COP', '', 'Compromisos Totales', filteredCompaniesWithRecalculatedStats.reduce((sum, c) => sum + c.commitments, 0), 'unidades'],
        ['Promedio por Empresa', filteredCompaniesWithRecalculatedStats.length > 0 ? Math.round(filteredCompaniesWithRecalculatedStats.reduce((sum, c) => sum + c.totalAmount, 0) / filteredCompaniesWithRecalculatedStats.length) : 0, 'COP', '', 'Completados', filteredCompaniesWithRecalculatedStats.reduce((sum, c) => sum + c.completed, 0), 'unidades'],
        ['Top Performer', filteredCompaniesWithRecalculatedStats.length > 0 ? filteredCompaniesWithRecalculatedStats.sort((a, b) => (b.completed/b.commitments) - (a.completed/a.commitments))[0]?.name || 'N/A' : 'N/A', 'texto', '', 'Pendientes', filteredCompaniesWithRecalculatedStats.reduce((sum, c) => sum + c.pending, 0), 'unidades']
      ];

      kpiData.forEach((row, rowIndex) => {
        const excelRow = summarySheet.getRow(7 + rowIndex);
        row.forEach((value, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1);
          cell.value = value;
          
          // Alternar colores de fila
          const bgColor = (rowIndex % 2 === 0) ? 'FFF5F5F5' : 'FFFFFFFF';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF424242' } };
          
          // Alineación especial para números
          if (colIndex === 1 || colIndex === 5) {
            cell.alignment = { horizontal: 'right', vertical: 'center' };
            if (typeof value === 'number' && value > 1000) {
              cell.numFmt = '#,##0';
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2E7D32' } };
            }
          } else {
            cell.alignment = { horizontal: colIndex === 0 || colIndex === 4 ? 'left' : 'center', vertical: 'center' };
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
        excelRow.height = 18;
      });

      // 📋 HOJA 2: DETALLE EMPRESARIAL PREMIUM
      const detailSheet = workbook.addWorksheet('Análisis Detallado');
      
      // Header corporativo para detalle
      detailSheet.mergeCells('A1:G1');
      const detailTitleCell = detailSheet.getCell('A1');
      detailTitleCell.value = '📋 ANÁLISIS DETALLADO POR EMPRESA';
      detailTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      detailTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B1FA2' } };
      detailTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      detailSheet.getRow(1).height = 30;

      // Subtítulo
      detailSheet.mergeCells('A2:G2');
      const subtitleCell = detailSheet.getCell('A2');
      subtitleCell.value = `Período: ${timeRange} | Total empresas analizadas: ${filteredCompaniesWithRecalculatedStats.length}`;
      subtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF7B1FA2' } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      detailSheet.getRow(2).height = 22;
      
      // Encabezados de la tabla con formato premium
      const headers = ['RANKING', 'EMPRESA', 'COMPROMISOS', 'COMPLETADOS', 'MONTO TOTAL', '% CUMPLIMIENTO', 'ESTADO'];
      const headerRow = detailSheet.getRow(4);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF37474F' } },
          bottom: { style: 'medium', color: { argb: 'FF37474F' } }
        };
      });
      headerRow.height = 25;
      
      // Datos de empresas con formato profesional (usando métricas recalculadas)
      filteredCompaniesWithRecalculatedStats.forEach((company, index) => {
        const row = detailSheet.getRow(5 + index);
        const percentage = Math.round((company.completed / company.commitments) * 100);
        
        // Determinar estado y colores
        let status, bgColor, textColor;
        const ranking = `${index + 1}°`;
        
        if (index === 0) {
          status = 'LÍDER'; bgColor = 'FFFFF3E0'; textColor = 'FFE65100';
        } else if (index === 1) {
          status = 'DESTACADA'; bgColor = 'FFF3E5F5'; textColor = 'FF7B1FA2';
        } else if (index === 2) {
          status = 'EXCELENTE'; bgColor = 'FFE8F5E8'; textColor = 'FF2E7D32';
        } else if (percentage >= 80) {
          status = 'ALTO'; bgColor = 'FFE8F5E8'; textColor = 'FF2E7D32';
        } else if (percentage >= 50) {
          status = 'MEDIO'; bgColor = 'FFFFF3E0'; textColor = 'FFF57C00';
        } else {
          status = 'BAJO'; bgColor = 'FFFFEBEE'; textColor = 'FFD32F2F';
        }
        
        const rowData = [ranking, company.name, company.commitments, company.completed, company.totalAmount, percentage, status];
        
        rowData.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          
          // Aplicar colores especiales para top 3, sino alternar normal
          const finalBgColor = index < 3 ? bgColor : ((index % 2 === 0) ? 'FFF8F9FA' : 'FFFFFFFF');
          const finalTextColor = index < 3 ? textColor : 'FF424242';
          
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: finalBgColor } };
          cell.font = { name: 'Arial', size: 10, color: { argb: finalTextColor }, bold: index < 3 };
          
          // Alineación y formato especial
          if (colIndex === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'center' };
          } else if (colIndex === 4) {
            cell.alignment = { horizontal: 'right', vertical: 'center' };
            cell.numFmt = '$#,##0.00';
          } else if (colIndex === 5) {
            cell.alignment = { horizontal: 'center', vertical: 'center' };
            cell.numFmt = '0"%"';
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
      
      // Configurar anchos de columna optimizados
      detailSheet.columns = [
        { width: 10 }, // Ranking
        { width: 25 }, // Empresa
        { width: 12 }, // Compromisos
        { width: 12 }, // Completados
        { width: 18 }, // Monto Total
        { width: 15 }, // % Cumplimiento
        { width: 12 }  // Estado
      ];

      // 📋 HOJA 3: EVOLUCIÓN HISTÓRICA PREMIUM
      const historicalSheet = workbook.addWorksheet('Evolución Histórica');
      
      // Header corporativo histórico
      historicalSheet.mergeCells('A1:H1');
      const histTitleCell = historicalSheet.getCell('A1');
      histTitleCell.value = '� EVOLUCIÓN HISTÓRICA - ÚLTIMOS 6 MESES';
      histTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      histTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6F00' } };
      histTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      historicalSheet.getRow(1).height = 30;

      // Subtítulo histórico
      historicalSheet.mergeCells('A2:H2');
      const histSubtitleCell = historicalSheet.getCell('A2');
      histSubtitleCell.value = `Análisis temporal detallado por empresa | Generado: ${new Date().toLocaleDateString('es-ES')}`;
      histSubtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFF6F00' } };
      histSubtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
      histSubtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      historicalSheet.getRow(2).height = 22;

      // Headers para datos históricos con formato premium
      const historicalData = getLast6MonthsData();
      const monthHeaders = ['EMPRESA', ...historicalData[0]?.data?.map(d => d.month) || []];
      const histHeaderRow = historicalSheet.getRow(4);
      
      monthHeaders.forEach((header, index) => {
        const cell = histHeaderRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF37474F' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF37474F' } },
          bottom: { style: 'medium', color: { argb: 'FF37474F' } }
        };
      });
      histHeaderRow.height = 25;
      
      // Datos históricos por empresa con formato profesional
      historicalData.forEach((companyData, index) => {
        const row = historicalSheet.getRow(5 + index);
        const rowValues = [
          companyData.name,
          ...companyData.data.map(monthData => monthData.compromisos || 0)
        ];
        
        rowValues.forEach((value, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = value;
          
          // Colores alternados para filas históricas
          const bgColor = (index % 2 === 0) ? 'FFFFF8E1' : 'FFFFFFFF';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FF424242' } };
          
          // Alineación especial
          if (colIndex === 0) {
            cell.alignment = { horizontal: 'left', vertical: 'center' };
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFF6F00' } };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'center' };
            // Resaltar valores altos
            if (typeof value === 'number' && value > 10) {
              cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2E7D32' } };
            }
          }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFB74D' } },
            bottom: { style: 'thin', color: { argb: 'FFFFB74D' } },
            left: { style: 'thin', color: { argb: 'FFFFB74D' } },
            right: { style: 'thin', color: { argb: 'FFFFB74D' } }
          };
        });
        row.height = 18;
      });

      // Configurar anchos optimizados para históricos
      historicalSheet.getColumn(1).width = 25; // Empresa
      for (let i = 2; i <= monthHeaders.length; i++) {
        historicalSheet.getColumn(i).width = 12;
      }

      // Configurar anchos de columna optimizados para summary
      summarySheet.columns = [
        { width: 20 }, { width: 15 }, { width: 12 }, { width: 8 },
        { width: 15 }, { width: 12 }, { width: 12 }, { width: 8 }
      ];

      // 📋 HOJA 4: COMPROMISOS COMPLETADOS DETALLADOS
      // ✅ CORRECCIÓN: Incluir TODOS los compromisos pagados, no solo 'completed'
      const completedCommitments = commitments.filter(c => {
        const isSelectedCompany = selectedCompanies.length === 0 || selectedCompanies.includes(c.companyId);
        const isPaidByStatus = c.status === 'completed' || c.status === 'paid';
        const isPaidByFlag = c.paid === true || c.isPaid === true;
        const isPaidCommitment = isPaidByStatus || isPaidByFlag;
        
        return isSelectedCompany && isPaidCommitment;
      });
      
      console.log(`� [EXCEL DEBUG] Compromisos filtrados para exportación:`, {
        totalCommitments: commitments.length,
        selectedCompanies: selectedCompanies.length === 0 ? 'TODAS' : selectedCompanies.length,
        completedCommitments: completedCommitments.length,
        sampleCompleted: completedCommitments.slice(0, 3).map(c => ({
          id: c.id,
          concept: c.concept,
          status: c.status,
          paid: c.paid,
          isPaid: c.isPaid
        }))
      });
      
      if (completedCommitments.length > 0) {
        const completedSheet = workbook.addWorksheet('Compromisos Completados');
        
        // Header
        completedSheet.mergeCells('A1:O1');
        const completedTitleCell = completedSheet.getCell('A1');
        completedTitleCell.value = '✅ COMPROMISOS COMPLETADOS - DETALLE FINANCIERO';
        completedTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        completedTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
        completedTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        completedSheet.getRow(1).height = 30;

        // Subtítulo
        completedSheet.mergeCells('A2:O2');
        const completedSubtitleCell = completedSheet.getCell('A2');
        completedSubtitleCell.value = `Total compromisos completados: ${completedCommitments.length} | Monto total: ${formatCurrency(completedCommitments.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || parseFloat(c.amount) || 0), 0))}`;
        completedSubtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF2E7D32' } };
        completedSubtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
        completedSubtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        completedSheet.getRow(2).height = 22;

        // Headers detallados
        const completedHeaders = [
          'EMPRESA', 'BENEFICIARIO/PROVEEDOR', 'NIT', 'CONCEPTO', 'VALOR BASE', 'IVA', 'RETEFUENTE', 
          'ICA', 'DERECHOS EXPLOTACIÓN', 'GASTOS ADMIN', 'INTERESES', 'DESCUENTOS', 'VALOR TOTAL', 'FECHA PAGO', 'MÉTODO PAGO'
        ];
        
        const completedHeaderRow = completedSheet.getRow(4);
        completedHeaders.forEach((header, index) => {
          const cell = completedHeaderRow.getCell(index + 1);
          cell.value = header;
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF1B5E20' } },
            bottom: { style: 'medium', color: { argb: 'FF1B5E20' } }
          };
        });
        completedHeaderRow.height = 25;

        // Datos detallados de compromisos completados
        let completedTotal = 0;
        completedCommitments.forEach((commitment, index) => {
          const company = companiesData.find(comp => comp.id === commitment.companyId);
          const row = completedSheet.getRow(5 + index);
          
          const baseAmount = parseFloat(commitment.baseAmount) || parseFloat(commitment.amount) || 0;
          const iva = parseFloat(commitment.iva) || 0;
          const retefuente = parseFloat(commitment.retefuente) || 0;
          const ica = parseFloat(commitment.ica) || 0;
          const derechosExplotacion = parseFloat(commitment.derechosExplotacion) || 0;
          const gastosAdmin = parseFloat(commitment.gastosAdministracion) || 0;
          const intereses = parseFloat(commitment.intereses) || 0;
          const descuentos = parseFloat(commitment.discount) || 0;
          const totalAmount = parseFloat(commitment.totalAmount) || baseAmount;
          
          completedTotal += totalAmount;
          
          const rowData = [
            company?.name || 'N/A',
            commitment.beneficiary || 'N/A',
            commitment.beneficiaryNit || 'N/A',
            commitment.concept || 'N/A',
            baseAmount,
            iva,
            retefuente,
            ica,
            derechosExplotacion,
            gastosAdmin,
            intereses,
            descuentos,
            totalAmount,
            commitment.paidDate ? new Date(commitment.paidDate.toDate ? commitment.paidDate.toDate() : commitment.paidDate).toLocaleDateString('es-ES') : 'N/A',
            commitment.paymentMethod || 'N/A'
          ];
          
          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = value;
            
            const bgColor = (index % 2 === 0) ? 'FFF1F8E9' : 'FFFFFFFF';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
            
            if (colIndex === 0 || colIndex === 1 || colIndex === 3) {
              cell.alignment = { horizontal: 'left', vertical: 'center' };
            } else if (colIndex >= 4 && colIndex <= 12) {
              cell.alignment = { horizontal: 'right', vertical: 'center' };
              cell.numFmt = '#,##0.00';
              if (typeof value === 'number' && value > 0) {
                cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF2E7D32' } };
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
        const totalRow = completedSheet.getRow(5 + completedCommitments.length);
        totalRow.getCell(1).value = 'TOTAL COMPLETADOS';
        totalRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
        totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        
        totalRow.getCell(13).value = completedTotal;
        totalRow.getCell(13).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        totalRow.getCell(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
        totalRow.getCell(13).numFmt = '$#,##0.00';
        totalRow.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
        
        // Configurar anchos de columna
        completedSheet.columns = [
          { width: 20 }, { width: 25 }, { width: 15 }, { width: 25 }, { width: 15 },
          { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 },
          { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 }, { width: 15 }
        ];
      }

      // 📋 HOJA 5: COMPROMISOS PENDIENTES DETALLADOS
      // ✅ NUEVA LÓGICA: Obtener pagos de cada compromiso para determinar correctamente los pendientes
      const commitmentsWithPayments = await Promise.all(
        commitments.map(async (commitment) => {
          try {
            const paymentsQuery = query(
              collection(db, 'payments'),
              where('commitmentId', '==', commitment.id)
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            const payments = paymentsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            const totalPaid = payments.reduce((sum, payment) => {
              // Excluir pagos de impuestos 4x1000
              if (payment.is4x1000Tax) return sum;
              return sum + (parseFloat(payment.amount) || 0);
            }, 0);
            
            const originalAmount = parseFloat(commitment.totalAmount) || parseFloat(commitment.amount) || 0;
            const remainingBalance = Math.max(0, originalAmount - totalPaid);
            
            // ✅ LÓGICA MÁS ESTRICTA: Un compromiso está completamente pagado si:
            // 1. El saldo restante es <= 0.01 (tolerancia de centavos) O
            // 2. Tiene flags de pagado en el documento O
            // 3. Su status indica que está pagado
            const isCompletelyPaid = remainingBalance <= 0.01 || 
                                   commitment.paid === true || 
                                   commitment.isPaid === true || 
                                   commitment.status === 'paid' || 
                                   commitment.status === 'completed';
            
            const hasPayments = payments.length > 0;
            
            return {
              ...commitment,
              payments,
              totalPaid,
              remainingBalance,
              isCompletelyPaid,
              hasPayments
            };
          } catch (error) {
            console.error('Error obteniendo pagos para compromiso:', commitment.id, error);
            return {
              ...commitment,
              payments: [],
              totalPaid: 0,
              remainingBalance: parseFloat(commitment.totalAmount) || parseFloat(commitment.amount) || 0,
              isCompletelyPaid: false,
              hasPayments: false
            };
          }
        })
      );
      
      // ✅ FILTRO CORRECTO PARA PENDIENTES: Solo compromisos que NO están completamente pagados
      // Incluye compromisos sin pagos y con pagos parciales
      const pendingCommitments = commitmentsWithPayments.filter(c => {
        const isSelectedCompany = selectedCompanies.length === 0 || selectedCompanies.includes(c.companyId);
        const isNotCompletelyPaid = !c.isCompletelyPaid;
        return isSelectedCompany && isNotCompletelyPaid;
      });
      
      console.log(`📊 [EXCEL PENDIENTES] Debug filtros detallado:`, {
        totalCommitments: commitments.length,
        commitmentsWithPayments: commitmentsWithPayments.length,
        pendingCommitments: pendingCommitments.length,
        completedCommitments: commitmentsWithPayments.filter(c => c.isCompletelyPaid).length,
        samplePending: pendingCommitments.slice(0, 3).map(c => ({
          id: c.id,
          concept: c.concept,
          totalPaid: c.totalPaid,
          remainingBalance: c.remainingBalance,
          isCompletelyPaid: c.isCompletelyPaid,
          hasPayments: c.hasPayments,
          paymentsCount: c.payments.length,
          status: c.status,
          paid: c.paid,
          isPaid: c.isPaid
        })),
        sampleCompleted: commitmentsWithPayments.filter(c => c.isCompletelyPaid).slice(0, 3).map(c => ({
          id: c.id,
          concept: c.concept,
          totalPaid: c.totalPaid,
          remainingBalance: c.remainingBalance,
          isCompletelyPaid: c.isCompletelyPaid,
          status: c.status,
          paid: c.paid,
          isPaid: c.isPaid
        }))
      });
      
      if (pendingCommitments.length > 0) {
        const pendingSheet = workbook.addWorksheet('Compromisos Pendientes');
        
        // Header - Expandir para incluir información de pagos individuales
        pendingSheet.mergeCells('A1:S1');
        const pendingTitleCell = pendingSheet.getCell('A1');
        pendingTitleCell.value = '⏳ COMPROMISOS PENDIENTES - DETALLE FINANCIERO Y PAGOS PARCIALES';
        pendingTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        pendingTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF57C00' } };
        pendingTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        pendingSheet.getRow(1).height = 30;

        // Subtítulo
        pendingSheet.mergeCells('A2:S2');
        const pendingSubtitleCell = pendingSheet.getCell('A2');
        const totalPendingAmount = pendingCommitments.reduce((sum, c) => sum + c.remainingBalance, 0);
        pendingSubtitleCell.value = `Total compromisos pendientes: ${pendingCommitments.length} | Saldo pendiente total: ${formatCurrency(totalPendingAmount)}`;
        pendingSubtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFF57C00' } };
        pendingSubtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
        pendingSubtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        pendingSheet.getRow(2).height = 22;

        // Headers detallados - Estructura expandida para pagos individuales
        const pendingHeaders = [
          'EMPRESA', 'BENEFICIARIO/PROVEEDOR', 'NIT', 'CONCEPTO', 'VALOR BASE', 'IVA', 'RETEFUENTE', 
          'ICA', 'DERECHOS EXPLOTACIÓN', 'GASTOS ADMIN', 'INTERESES', 'DESCUENTOS', 'VALOR TOTAL', 
          'TOTAL PAGADO', 'SALDO PENDIENTE', 'VALOR PAGO', 'FECHA PAGO', 'MÉTODO PAGO', 'FECHA VENCIMIENTO'
        ];
        
        const pendingHeaderRow = pendingSheet.getRow(4);
        pendingHeaders.forEach((header, index) => {
          const cell = pendingHeaderRow.getCell(index + 1);
          cell.value = header;
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE65100' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FFE65100' } },
            bottom: { style: 'medium', color: { argb: 'FFE65100' } }
          };
        });
        pendingHeaderRow.height = 25;

        // Datos detallados de compromisos pendientes - CADA PAGO EN FILA SEPARADA
        let pendingTotal = 0;
        let rowIndex = 5;
        
        pendingCommitments.forEach((commitment, commitmentIndex) => {
          const company = companiesData.find(comp => comp.id === commitment.companyId);
          
          const baseAmount = parseFloat(commitment.baseAmount) || parseFloat(commitment.amount) || 0;
          const iva = parseFloat(commitment.iva) || 0;
          const retefuente = parseFloat(commitment.retefuente) || 0;
          const ica = parseFloat(commitment.ica) || 0;
          const derechosExplotacion = parseFloat(commitment.derechosExplotacion) || 0;
          const gastosAdmin = parseFloat(commitment.gastosAdministracion) || 0;
          const intereses = parseFloat(commitment.intereses) || 0;
          const descuentos = parseFloat(commitment.discount) || 0;
          const totalAmount = parseFloat(commitment.totalAmount) || baseAmount;
          
          pendingTotal += commitment.remainingBalance;
          
          // ✅ LÓGICA NUEVA: Si tiene pagos, mostrar cada pago en fila separada
          if (commitment.payments && commitment.payments.length > 0) {
            commitment.payments.forEach((payment, paymentIndex) => {
              if (payment.is4x1000Tax) return; // Saltar impuestos 4x1000
              
              const row = pendingSheet.getRow(rowIndex);
              const isFirstPayment = paymentIndex === 0;
              
              // Solo mostrar datos del compromiso en la primera fila de pagos
              const rowData = [
                isFirstPayment ? (company?.name || 'N/A') : '', // EMPRESA
                isFirstPayment ? (commitment.beneficiary || 'N/A') : '', // BENEFICIARIO
                isFirstPayment ? (commitment.beneficiaryNit || 'N/A') : '', // NIT
                isFirstPayment ? (commitment.concept || 'N/A') : '', // CONCEPTO
                isFirstPayment ? baseAmount : '', // VALOR BASE
                isFirstPayment ? iva : '', // IVA
                isFirstPayment ? retefuente : '', // RETEFUENTE
                isFirstPayment ? ica : '', // ICA
                isFirstPayment ? derechosExplotacion : '', // DERECHOS EXPLOTACIÓN
                isFirstPayment ? gastosAdmin : '', // GASTOS ADMIN
                isFirstPayment ? intereses : '', // INTERESES
                isFirstPayment ? descuentos : '', // DESCUENTOS
                isFirstPayment ? totalAmount : '', // VALOR TOTAL
                isFirstPayment ? commitment.totalPaid : '', // TOTAL PAGADO
                isFirstPayment ? commitment.remainingBalance : '', // SALDO PENDIENTE
                parseFloat(payment.amount) || 0, // VALOR PAGO
                payment.date ? new Date(payment.date.toDate ? payment.date.toDate() : payment.date).toLocaleDateString('es-ES') : 'S/F', // FECHA PAGO
                payment.method || payment.paymentMethod || 'N/A', // MÉTODO PAGO
                isFirstPayment ? (commitment.dueDate ? new Date(commitment.dueDate.toDate ? commitment.dueDate.toDate() : commitment.dueDate).toLocaleDateString('es-ES') : 'N/A') : '' // FECHA VENCIMIENTO
              ];
              
              rowData.forEach((value, colIndex) => {
                const cell = row.getCell(colIndex + 1);
                cell.value = value;
                
                // Formateo visual
                const bgColor = (commitmentIndex % 2 === 0) ? 'FFFFFBF0' : 'FFFFFFFF';
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
                
                // Formateo específico por columna
                if (colIndex <= 3 || colIndex >= 16) { // Texto
                  cell.alignment = { horizontal: 'left', vertical: 'center' };
                } else if (colIndex >= 4 && colIndex <= 15) { // Valores monetarios
                  cell.alignment = { horizontal: 'right', vertical: 'center' };
                  if (typeof value === 'number' && value > 0) {
                    cell.numFmt = '#,##0.00';
                    // Resaltar pagos realizados
                    if (colIndex === 15) { // VALOR PAGO
                      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF2E7D32' } };
                    } else if (colIndex === 13 || colIndex === 14) { // TOTAL PAGADO y SALDO PENDIENTE
                      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: colIndex === 13 ? 'FF2E7D32' : 'FFF57C00' } };
                    }
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
              rowIndex++;
            });
          } else {
            // ✅ Compromiso sin pagos - mostrar fila normal
            const row = pendingSheet.getRow(rowIndex);
            const rowData = [
              company?.name || 'N/A',
              commitment.beneficiary || 'N/A',
              commitment.beneficiaryNit || 'N/A',
              commitment.concept || 'N/A',
              baseAmount,
              iva,
              retefuente,
              ica,
              derechosExplotacion,
              gastosAdmin,
              intereses,
              descuentos,
              totalAmount,
              0, // TOTAL PAGADO
              commitment.remainingBalance, // SALDO PENDIENTE
              '', // VALOR PAGO
              '', // FECHA PAGO
              '', // MÉTODO PAGO
              commitment.dueDate ? new Date(commitment.dueDate.toDate ? commitment.dueDate.toDate() : commitment.dueDate).toLocaleDateString('es-ES') : 'N/A'
            ];
            
            rowData.forEach((value, colIndex) => {
              const cell = row.getCell(colIndex + 1);
              cell.value = value;
              
              const bgColor = (commitmentIndex % 2 === 0) ? 'FFFFFBF0' : 'FFFFFFFF';
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
              cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
              
              if (colIndex <= 3 || colIndex >= 16) {
                cell.alignment = { horizontal: 'left', vertical: 'center' };
              } else if (colIndex >= 4 && colIndex <= 15) {
                cell.alignment = { horizontal: 'right', vertical: 'center' };
                if (typeof value === 'number' && value > 0) {
                  cell.numFmt = '#,##0.00';
                  if (colIndex === 14) { // SALDO PENDIENTE
                    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFF57C00' } };
                  }
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
            rowIndex++;
          }
        });

        // Fila de totales
        const totalPendingRow = pendingSheet.getRow(rowIndex);
        totalPendingRow.getCell(1).value = 'TOTAL SALDOS PENDIENTES';
        totalPendingRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        totalPendingRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF57C00' } };
        totalPendingRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Total de saldos pendientes en columna 15 (SALDO PENDIENTE)
        totalPendingRow.getCell(15).value = pendingTotal;
        totalPendingRow.getCell(15).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        totalPendingRow.getCell(15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF57C00' } };
        totalPendingRow.getCell(15).numFmt = '$#,##0.00';
        totalPendingRow.getCell(15).alignment = { horizontal: 'right', vertical: 'middle' };
        
        // Configurar anchos de columna optimizados para la nueva estructura con pagos individuales
        pendingSheet.columns = [
          { width: 20 }, // EMPRESA
          { width: 25 }, // BENEFICIARIO/PROVEEDOR
          { width: 15 }, // NIT
          { width: 25 }, // CONCEPTO
          { width: 15 }, // VALOR BASE
          { width: 12 }, // IVA
          { width: 12 }, // RETEFUENTE
          { width: 12 }, // ICA
          { width: 15 }, // DERECHOS EXPLOTACIÓN
          { width: 12 }, // GASTOS ADMIN
          { width: 12 }, // INTERESES
          { width: 12 }, // DESCUENTOS
          { width: 15 }, // VALOR TOTAL
          { width: 15 }, // TOTAL PAGADO
          { width: 15 }, // SALDO PENDIENTE
          { width: 15 }, // VALOR PAGO
          { width: 15 }, // FECHA PAGO
          { width: 18 }, // MÉTODO PAGO
          { width: 15 }  // FECHA VENCIMIENTO
        ];
      }

      // 📋 HOJA 6: COMPROMISOS VENCIDOS DETALLADOS
      // ✅ NUEVA LÓGICA: Solo compromisos SIN pagos y vencidos por fecha
      const overdueCommitments = commitmentsWithPayments.filter(c => {
        const isSelectedCompany = selectedCompanies.length === 0 || selectedCompanies.includes(c.companyId);
        const hasNoPayments = !c.hasPayments; // Sin pagos en absoluto
        const isOverdueByDate = c.dueDate && new Date(c.dueDate.toDate ? c.dueDate.toDate() : c.dueDate) < new Date();
        return isSelectedCompany && hasNoPayments && isOverdueByDate;
      });
      
      console.log(`📊 [EXCEL VENCIDOS] Debug filtros:`, {
        totalCommitmentsWithPayments: commitmentsWithPayments.length,
        overdueCommitments: overdueCommitments.length,
        sample: overdueCommitments.slice(0, 3).map(c => ({
          id: c.id,
          concept: c.concept,
          hasPayments: c.hasPayments,
          dueDate: c.dueDate,
          isOverdueByDate: c.dueDate && new Date(c.dueDate.toDate ? c.dueDate.toDate() : c.dueDate) < new Date()
        }))
      });
      
      if (overdueCommitments.length > 0) {
        const overdueSheet = workbook.addWorksheet('Compromisos Vencidos');
        
        // Header
        overdueSheet.mergeCells('A1:O1');
        const overdueTitleCell = overdueSheet.getCell('A1');
        overdueTitleCell.value = '🚨 COMPROMISOS VENCIDOS - DETALLE FINANCIERO';
        overdueTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        overdueTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };
        overdueTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        overdueSheet.getRow(1).height = 30;

        // Subtítulo
        overdueSheet.mergeCells('A2:O2');
        const overdueSubtitleCell = overdueSheet.getCell('A2');
        overdueSubtitleCell.value = `Total compromisos vencidos: ${overdueCommitments.length} | Monto total: ${formatCurrency(overdueCommitments.reduce((sum, c) => sum + (parseFloat(c.totalAmount) || parseFloat(c.amount) || 0), 0))}`;
        overdueSubtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFD32F2F' } };
        overdueSubtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
        overdueSubtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        overdueSheet.getRow(2).height = 22;

        // Headers detallados (con días de vencimiento)
        const overdueHeaders = [
          'EMPRESA', 'BENEFICIARIO/PROVEEDOR', 'NIT', 'CONCEPTO', 'VALOR BASE', 'IVA', 'RETEFUENTE', 
          'ICA', 'DERECHOS EXPLOTACIÓN', 'GASTOS ADMIN', 'INTERESES', 'DESCUENTOS', 'VALOR TOTAL', 'FECHA VENCIMIENTO', 'DÍAS VENCIDO'
        ];
        
        const overdueHeaderRow = overdueSheet.getRow(4);
        overdueHeaders.forEach((header, index) => {
          const cell = overdueHeaderRow.getCell(index + 1);
          cell.value = header;
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FFB71C1C' } },
            bottom: { style: 'medium', color: { argb: 'FFB71C1C' } }
          };
        });
        overdueHeaderRow.height = 25;

        // Datos detallados de compromisos vencidos
        let overdueTotal = 0;
        overdueCommitments.forEach((commitment, index) => {
          const company = companiesData.find(comp => comp.id === commitment.companyId);
          const row = overdueSheet.getRow(5 + index);
          
          const baseAmount = parseFloat(commitment.baseAmount) || parseFloat(commitment.amount) || 0;
          const iva = parseFloat(commitment.iva) || 0;
          const retefuente = parseFloat(commitment.retefuente) || 0;
          const ica = parseFloat(commitment.ica) || 0;
          const derechosExplotacion = parseFloat(commitment.derechosExplotacion) || 0;
          const gastosAdmin = parseFloat(commitment.gastosAdministracion) || 0;
          const intereses = parseFloat(commitment.intereses) || 0;
          const descuentos = parseFloat(commitment.discount) || 0;
          const totalAmount = parseFloat(commitment.totalAmount) || baseAmount;
          
          // Calcular días de vencimiento
          const dueDate = commitment.dueDate ? (commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate)) : new Date();
          const today = new Date();
          const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          
          overdueTotal += totalAmount;
          
          const rowData = [
            company?.name || 'N/A',
            commitment.beneficiary || 'N/A',
            commitment.beneficiaryNit || 'N/A',
            commitment.concept || 'N/A',
            baseAmount,
            iva,
            retefuente,
            ica,
            derechosExplotacion,
            gastosAdmin,
            intereses,
            descuentos,
            totalAmount,
            dueDate.toLocaleDateString('es-ES'),
            daysOverdue > 0 ? daysOverdue : 0
          ];
          
          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = value;
            
            const bgColor = (index % 2 === 0) ? 'FFFEF5F5' : 'FFFFFFFF';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
            
            if (colIndex === 0 || colIndex === 1 || colIndex === 3) {
              cell.alignment = { horizontal: 'left', vertical: 'center' };
            } else if (colIndex >= 4 && colIndex <= 12) {
              cell.alignment = { horizontal: 'right', vertical: 'center' };
              cell.numFmt = '#,##0.00';
              if (typeof value === 'number' && value > 0) {
                cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFD32F2F' } };
              }
            } else if (colIndex === 14) {
              cell.alignment = { horizontal: 'center', vertical: 'center' };
              if (typeof value === 'number' && value > 30) {
                cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
              } else if (typeof value === 'number' && value > 15) {
                cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFD32F2F' } };
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
        const totalOverdueRow = overdueSheet.getRow(5 + overdueCommitments.length);
        totalOverdueRow.getCell(1).value = 'TOTAL VENCIDOS';
        totalOverdueRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        totalOverdueRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };
        totalOverdueRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        
        totalOverdueRow.getCell(13).value = overdueTotal;
        totalOverdueRow.getCell(13).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        totalOverdueRow.getCell(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };
        totalOverdueRow.getCell(13).numFmt = '$#,##0.00';
        totalOverdueRow.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
        
        // Configurar anchos de columna
        overdueSheet.columns = [
          { width: 20 }, { width: 25 }, { width: 15 }, { width: 25 }, { width: 15 },
          { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 12 },
          { width: 12 }, { width: 12 }, { width: 15 }, { width: 15 }, { width: 12 }
        ];
      }

      // 💾 GENERAR Y DESCARGAR ARCHIVO
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Nombre del archivo con fecha
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `DR-Group-Reporte-Empresas-${timestamp}.xlsx`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ Reporte exportado exitosamente: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error al exportar reporte:', error);
      alert('Error al generar el reporte de Excel. Por favor, inténtalo de nuevo.');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="text.secondary">
            Cargando datos de empresas...
          </Typography>
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
              REPORTES • POR EMPRESA
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
              🏢 Reportes por Empresa
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Análisis detallado del desempeño por empresa
            </Typography>
          </Box>

          {/* Indicadores y acciones */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'row', md: 'row' },
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center'
          }}>
            {/* Header limpio sin chips ni refresh */}
          </Box>
        </Box>
      </Paper>

      {/* ✨ FILTROS SPECTACULAR MEJORADOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            borderRadius: 1,
            p: 3,
            mb: 4,
            position: 'relative',
            '&:hover': {
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease'
            }
          }}
        >
          {/* Header de Filtros */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                width: 32,
                height: 32
              }}>
                <FilterList fontSize="small" />
              </Avatar>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Filtros de Búsqueda
              </Typography>
            </Box>

            {/* Chips de filtros activos */}
            {hasActiveFilters && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {searchTerm && (
                  <Chip
                    key="search-filter"
                    label={`Búsqueda: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm('')}
                    sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                      borderColor: 'info.main',
                      '& .MuiChip-deleteIcon': { color: 'info.main' }
                    }}
                  />
                )}
                {selectedCompanies.length > 0 && selectedCompanies
                  .filter(companyId => companyId && typeof companyId === 'string')
                  .map((companyId, index) => {
                    const company = companiesData?.find(c => c.id === companyId);
                    if (!company) return null;
                    
                    return (
                      <Chip
                        key={`selected-company-filter-${companyId}-${index}`}
                        avatar={
                        company?.logoURL ? (
                          <Avatar 
                            key={`avatar-with-logo-${companyId}`}
                            src={company.logoURL}
                            sx={{ 
                              width: 20, 
                              height: 20,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                          />
                        ) : (
                          <Avatar 
                            key={`avatar-without-logo-${companyId}`}
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              fontSize: '0.7rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              color: 'primary.main',
                              fontWeight: 600
                            }}>
                            {company?.name.charAt(0) || 'E'}
                          </Avatar>
                        )
                      }
                      label={company?.name || 'N/A'}
                      size="small"
                      onDelete={() => setSelectedCompanies(prev => prev.filter(id => id !== companyId))}
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        borderColor: 'primary.main',
                        '& .MuiChip-deleteIcon': { color: 'primary.main' },
                        '& .MuiChip-avatar': { 
                          marginLeft: 0.5,
                          marginRight: -0.5
                        }
                      }}
                    />
                  );
                }).filter(Boolean)}
                {dateRangeFilter !== 'all' && (
                  <Chip
                    key="date-range-filter"
                    label={`Período: ${
                      dateRangeFilter === 'thisMonth' ? 'Este mes' :
                      dateRangeFilter === 'lastMonth' ? 'Mes pasado' :
                      dateRangeFilter === 'last90days' ? 'Últimos 90 días' :
                      dateRangeFilter === 'thisYear' ? 'Este año' :
                      dateRangeFilter === 'lastYear' ? 'Año pasado' :
                      dateRangeFilter === 'last6months' ? 'Últimos 6 meses' :
                      dateRangeFilter === 'custom' && customStartDate && customEndDate ? 
                        `${customStartDate.toLocaleDateString('es-ES')} - ${customEndDate.toLocaleDateString('es-ES')}` :
                        'Personalizado'
                    }`}
                    size="small"
                    onDelete={() => {
                      setDateRangeFilter('all');
                      setTimeRange('last6months');
                    }}
                    sx={{ 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: 'secondary.main',
                      borderColor: 'secondary.main',
                      '& .MuiChip-deleteIcon': { color: 'secondary.main' }
                    }}
                  />
                )}
                {(customStartDate || customEndDate) && dateRangeFilter === 'custom' && (
                  <Chip
                    key="custom-dates-filter"
                    label={`📅 Fechas: ${customStartDate ? customStartDate.toLocaleDateString('es-ES') : 'Sin inicio'} - ${customEndDate ? customEndDate.toLocaleDateString('es-ES') : 'Sin fin'}`}
                    size="small"
                    onDelete={() => {
                      setCustomStartDate(null);
                      setCustomEndDate(null);
                    }}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                {statusFilter !== 'all' && (
                  <Chip
                    key="status-filter"
                    label={`${statusOptions.find(s => s.value === statusFilter)?.icon} ${statusOptions.find(s => s.value === statusFilter)?.label}`}
                    size="small"
                    onDelete={() => setStatusFilter('all')}
                    color={statusOptions.find(s => s.value === statusFilter)?.color}
                    sx={{ 
                      '& .MuiChip-deleteIcon': { 
                        color: `${statusOptions.find(s => s.value === statusFilter)?.color}.main` 
                      }
                    }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Campos de Filtros */}
          <Grid container spacing={3}>
            {/* Búsqueda de Empresa */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar empresa"
                placeholder="Nombre de empresa..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClearSearch}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }
                }}
              />
            </Grid>
            
            {/* Selector Multi-Empresa (Estilo Excel) */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>🏢 Empresas</InputLabel>
                <Select
                  multiple
                  value={selectedCompanies}
                  // Patrón estándar MUI multi-select con opción especial '__all__'
                  onChange={(event) => {
                    const { value } = event.target;
                    let newValue = typeof value === 'string' ? value.split(',') : value;
                    // Si el último valor es __all__, togglear selección completa
                    if (newValue[newValue.length - 1] === '__all__') {
                      if (trulyAllSelected) {
                        newValue = [];
                      } else {
                        newValue = [...allCompanyIds];
                      }
                    }
                    // Eliminar el token especial si quedó
                    newValue = newValue.filter(v => v !== '__all__');
                    // Normalizar (sin duplicados) preservando orden base de companies
                    const ordered = allCompanyIds.filter(id => newValue.includes(id));
                    setSelectedCompanies(ordered);
                  }}
                  input={<OutlinedInput label="🏢 Empresas" />}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <Typography color="text.secondary">Seleccionar empresas...</Typography>;
                    }
                    if (selected.length === 1) {
                      const company = companiesData?.find(c => c.id === selected[0]);
                      return company?.name || 'Empresa';
                    }
                    return `${selected.length} empresas seleccionadas`;
                  }}
                  sx={{
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 400,
                        borderRadius: 8,
                        marginTop: 8
                      },
                    },
                  }}
                >
                  {/* Opción especial Seleccionar / Deseleccionar todas */}
                  <MenuItem value="__all__" sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Checkbox
                      checked={trulyAllSelected}
                      indeterminate={isSomeCompaniesSelected && !trulyAllSelected}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': { color: theme.palette.primary.main },
                        '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                      }}
                    />
                    <ListItemText
                      primary={trulyAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                      primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                    />
                    <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                      ({selectedCompanies.length}/{companiesData?.length || 0})
                    </Typography>
                  </MenuItem>
                  
                  {companiesData && companiesData.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      <Checkbox 
                        key={`menu-checkbox-${company.id}`}
                        checked={selectedCompanies.indexOf(company.id) > -1}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                        {company.logoURL ? (
                          <Avatar 
                            key={`menu-avatar-with-logo-${company.id}`}
                            src={company.logoURL} 
                            sx={{ 
                              width: 24, 
                              height: 24,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            {company.name.charAt(0)}
                          </Avatar>
                        ) : (
                          <Avatar 
                            key={`menu-avatar-without-logo-${company.id}`}
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              fontSize: '0.75rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              fontWeight: 600
                            }}>
                            {company.name.charAt(0)}
                          </Avatar>
                        )}
                        <ListItemText 
                          key={`menu-text-${company.id}`}
                          primary={company.name}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Botón rápido para limpiar selección de empresas */}
              {selectedCompanies.length > 0 && (
                <Button
                  size="small"
                  onClick={() => setSelectedCompanies([])}
                  sx={{
                    mt: 1,
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: 'error.main'
                    }
                  }}
                >
                  Limpiar selección ({selectedCompanies.length})
                </Button>
              )}
            </Grid>

            {/* Selector de Período con DateRangeFilter */}
            <Grid item xs={12} md={2}>
              <DateRangeFilter
                value={dateRangeFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onChange={handleDateRangeChange}
                onCustomRangeChange={handleCustomRangeChange}
              />
            </Grid>

            {/* Selector de Desempeño */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>📊 Desempeño</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="📊 Desempeño"
                  sx={{
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.15)}`
                    }
                  }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span">{option.icon}</Typography>
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Botones de Acción */}
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'flex-end' }}>
                {/* Botón Aplicar Filtros */}
                <Button
                  variant={hasFiltersChanged() ? "contained" : "outlined"}
                  onClick={handleApplyFilters}
                  disabled={!hasFiltersChanged()}
                  sx={{
                    flex: 1,
                    borderRadius: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 1.8,
                    transition: 'all 0.3s ease',
                    background: hasFiltersChanged() 
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                      : 'transparent',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    },
                    '&.Mui-disabled': {
                      background: 'transparent'
                    }
                  }}
                >
                  {hasFiltersChanged() ? '✅ Aplicar' : '📋 Filtros'}
                </Button>

                {/* Botón Limpiar */}
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClearFilters}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      py: 1.8,
                      borderRadius: 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    🗑️
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Botón Exportar */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              startIcon={exportingExcel ? <CircularProgress size={16} color="inherit" /> : <GetApp />}
              onClick={exportReport}
              disabled={exportingExcel || loading || filteredCompaniesWithRecalculatedStats.length === 0}
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                textTransform: 'none',
                py: 1.2,
                px: 3,
                background: exportingExcel 
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark}99, ${theme.palette.secondary.dark}99)` 
                  : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: exportingExcel ? 'none' : 'translateY(-2px)',
                  background: exportingExcel 
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark}99, ${theme.palette.secondary.dark}99)` 
                    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: exportingExcel ? 'none' : `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
                },
                '&:disabled': {
                  background: alpha(theme.palette.action.disabled, 0.12),
                  color: theme.palette.action.disabled
                }
              }}
            >
              {exportingExcel ? '⏳ Generando Excel...' : '📊 Exportar Reporte'}
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {/* Tarjetas de resumen sobrias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Empresas', 
            value: filteredCompaniesWithRecalculatedStats.length, 
            color: theme.palette.primary.main,
            icon: Business
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(filteredCompanies.reduce((sum, c) => sum + c.totalAmount, 0)), 
            color: theme.palette.success.main,
            icon: AttachMoney
          },
          { 
            label: 'Compromisos Totales', 
            value: filteredCompanies.reduce((sum, c) => sum + c.commitments, 0), 
            color: theme.palette.info.main,
            icon: Business
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
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
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
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráfico sobrio */}
      <Card sx={{
        mb: 4,
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
            Tendencia por Empresa ({
              timeRange === 'lastmonth' ? 'Último mes' :
              timeRange === 'last3months' ? 'Últimos 3 meses' :
              timeRange === 'last12months' ? 'Último año' :
              timeRange === 'custom' && customStartDate && customEndDate ? 
                `${customStartDate.toLocaleDateString('es-ES')} - ${customEndDate.toLocaleDateString('es-ES')}` :
                'Últimos 6 meses'
            })
          </Typography>
          {monthlyCompanyData && monthlyCompanyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              {renderCompanyTrendChart(
                monthlyCompanyData,
                settings?.dashboard?.charts?.chartType || 'bar'
              )}
            </ResponsiveContainer>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 400,
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                {loading ? 'Cargando datos de tendencias...' : 'No hay datos disponibles para mostrar'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabla de empresas sobria */}
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
            Detalle por Empresa
          </Typography>
          <TableContainer component={Paper} sx={{ 
            backgroundColor: 'transparent',
            boxShadow: 'none' 
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Empresa</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Compromisos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Completados</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Pendientes</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Vencidos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompaniesWithRecalculatedStats.map((company, index) => (
                  <TableRow
                    key={company.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: theme.palette.action.hover 
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {company.logoURL ? (
                          <Avatar 
                            src={company.logoURL}
                            alt={company.name}
                            sx={{ 
                              width: 40,
                              height: 40,
                              backgroundColor: `${theme.palette.primary.main}10`,
                              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                            }}
                          />
                        ) : (
                          <Avatar sx={{ 
                            backgroundColor: `${theme.palette.primary.main}15`,
                            color: 'primary.main',
                            width: 40,
                            height: 40
                          }}>
                            <Business />
                          </Avatar>
                        )}
                        <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {company.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatCurrency(company.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{company.commitments}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                        {company.completed}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'warning.main' }}>
                        {company.pending}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'error.main' }}>
                        {company.overdue}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {company.avgTicket > 0 ? formatCurrency(company.avgTicket) : '$0'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
        </>
      )}
    </Box>
  );
};

export default ReportsCompanyPage;
