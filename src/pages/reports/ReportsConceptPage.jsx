import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
import ExcelJS from 'exceljs';
import { determineCommitmentStatus } from '../../utils/commitmentStatusUtils';
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
  Chip,
  Avatar,
  InputAdornment,
  Tabs,
  Tab,
  useTheme,
  alpha,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Category,
  Search,
  GetApp,
  AttachMoney,
  Assignment,
  LocalAtm,
  Receipt,
  Business,
  Build,
  Group,
  FilterList,
  Clear,
  DateRange,
  CalendarToday
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';
import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';
import DateRangeFilter, { getDateRangeFromFilter } from '../../components/payments/DateRangeFilter';
import { isWithinInterval, isValid } from 'date-fns';

const ReportsConceptPage = () => {
  const theme = useTheme();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Período por defecto: Este mes (usando DateRangeFilter estándar)
  const [dateRangeFilter, setDateRangeFilter] = useState('thisMonth');
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para fechas personalizadas
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  // Estados para filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    selectedCategory: 'all',
    dateRangeFilter: 'thisMonth',
    customStartDate: null,
    customEndDate: null
  });
  const [filtersApplied, setFiltersApplied] = useState(true);

  // Sistema de esquemas de colores dinámicos
  const getColorScheme = (scheme = 'corporate') => {
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
      default:
        return [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main
        ];
    }
  };

  // Conectar con Firebase para obtener compromisos y empresas reales
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { companies: companiesData, loading: companiesLoading } = useCompanies();
  
  const loading = commitmentsLoading || companiesLoading;

  // Función para filtrar compromisos por rango de fechas usando DateRangeFilter estándar
  const filterCommitmentsByDateRange = useMemo(() => {
    return (commitmentsArray) => {
      if (!commitmentsArray || commitmentsArray.length === 0) return [];
      
      if (appliedFilters.dateRangeFilter === 'all') return commitmentsArray;
      
      const range = getDateRangeFromFilter(
        appliedFilters.dateRangeFilter,
        appliedFilters.customStartDate,
        appliedFilters.customEndDate
      );
      
      if (!range || !isValid(range.startDate) || !isValid(range.endDate)) {
        return commitmentsArray;
      }
      
      return commitmentsArray.filter(commitment => {
        let commitmentDate;
        if (commitment.dueDate?.toDate) commitmentDate = commitment.dueDate.toDate();
        else if (commitment.dueDate) commitmentDate = new Date(commitment.dueDate);
        else if (commitment.createdAt?.toDate) commitmentDate = commitment.createdAt.toDate();
        else if (commitment.createdAt) commitmentDate = new Date(commitment.createdAt);
        else return false;
        
        return isWithinInterval(commitmentDate, { start: range.startDate, end: range.endDate });
      });
    };
  }, [appliedFilters.dateRangeFilter, appliedFilters.customStartDate, appliedFilters.customEndDate]);

  // Funciones para manejo de filtros
  const applyFilters = () => {
    setAppliedFilters({
      searchTerm,
      selectedCategory,
      dateRangeFilter,
      customStartDate,
      customEndDate
    });
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setDateRangeFilter('thisMonth');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setAppliedFilters({
      searchTerm: '',
      selectedCategory: 'all',
      dateRangeFilter: 'thisMonth',
      customStartDate: null,
      customEndDate: null
    });
    setFiltersApplied(true);
  };

  const hasFiltersChanged = () => {
    if (
      appliedFilters.searchTerm !== searchTerm ||
      appliedFilters.selectedCategory !== selectedCategory ||
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

  // Análisis real por conceptos de Firebase con estados corregidos
  const [conceptsData, setConceptsData] = useState([]);

  useEffect(() => {
    const calculateConceptsWithCorrectStatus = async () => {
      if (!commitments || commitments.length === 0) {
        setConceptsData([]);
        return;
      }

      // ✅ APLICAR FILTRO DE FECHAS PRIMERO
      const filteredCommitments = filterCommitmentsByDateRange(commitments);
      
      if (filteredCommitments.length === 0) {
        setConceptsData([]);
        return;
      }

      // Agrupar compromisos filtrados por concepto real
      const conceptGroups = filteredCommitments.reduce((acc, commitment) => {
        const conceptName = commitment.concept || 'Sin Concepto';
        if (!acc[conceptName]) {
          acc[conceptName] = [];
        }
        acc[conceptName].push(commitment);
        return acc;
      }, {});

      // Calcular estadísticas por concepto con estados correctos
      const concepts = await Promise.all(
        Object.entries(conceptGroups).map(async ([conceptName, conceptCommitments]) => {
          const totalAmount = conceptCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
          
          // ✅ USAR LÓGICA CORRECTA DE ESTADOS CON determineCommitmentStatus
          const statusResults = await Promise.all(
            conceptCommitments.map(async (commitment) => {
              const status = await determineCommitmentStatus(commitment);
              return { ...commitment, calculatedStatus: status };
            })
          );
          
          const completed = statusResults.filter(c => c.calculatedStatus === 'completed').length;
          const pending = statusResults.filter(c => c.calculatedStatus === 'pending' || c.calculatedStatus === 'partial').length;
          const overdue = statusResults.filter(c => c.calculatedStatus === 'overdue').length;
      
          // Función para obtener icono y color basado en el concepto
          const getConceptIcon = (concept) => {
            const conceptLower = concept.toLowerCase();
            if (conceptLower.includes('servicio') || conceptLower.includes('consultoría')) return { icon: '🔧', color: '#667eea' };
            if (conceptLower.includes('marketing') || conceptLower.includes('publicidad')) return { icon: '📢', color: '#f093fb' };
            if (conceptLower.includes('tecnología') || conceptLower.includes('software')) return { icon: '💻', color: '#ff9800' };
            if (conceptLower.includes('financiero') || conceptLower.includes('banco')) return { icon: '🏦', color: '#9c27b0' };
            if (conceptLower.includes('suministro') || conceptLower.includes('material')) return { icon: '📝', color: '#4caf50' };
            if (conceptLower.includes('transporte') || conceptLower.includes('logística')) return { icon: '🚚', color: '#795548' };
            if (conceptLower.includes('mantenimiento') || conceptLower.includes('limpieza')) return { icon: '🔧', color: '#607d8b' };
            if (conceptLower.includes('rrhh') || conceptLower.includes('personal')) return { icon: '👥', color: '#e91e63' };
            if (conceptLower.includes('legal') || conceptLower.includes('jurídico')) return { icon: '⚖️', color: '#795548' };
            if (conceptLower.includes('seguridad') || conceptLower.includes('vigilancia')) return { icon: '🛡️', color: '#607d8b' };
            if (conceptLower.includes('salud') || conceptLower.includes('médico')) return { icon: '🏥', color: '#4caf50' };
            if (conceptLower.includes('educación') || conceptLower.includes('formación')) return { icon: '📚', color: '#2196f3' };
            return { icon: '📋', color: '#9e9e9e' }; // Default
          };

          const conceptInfo = getConceptIcon(conceptName);
          
          return {
            id: conceptName.replace(/\s+/g, '_').toLowerCase(),
            name: conceptName,
            concept: conceptName,
            totalAmount,
            commitments: conceptCommitments.length,
            completed,
            pending,
            overdue,
            avgAmount: conceptCommitments.length > 0 ? totalAmount / conceptCommitments.length : 0,
            icon: conceptInfo.icon,
            color: conceptInfo.color
          };
        })
      );

      const sortedConcepts = concepts
        .filter(concept => concept.commitments > 0) // Solo mostrar conceptos con datos
        .sort((a, b) => b.totalAmount - a.totalAmount); // Ordenar por monto total descendente
        
      setConceptsData(sortedConcepts);
    };

    calculateConceptsWithCorrectStatus();
  }, [commitments, appliedFilters, filterCommitmentsByDateRange]);

  // Generar categorías dinámicamente basándose en los conceptos reales
  const categories = useMemo(() => {
    const baseCategories = [{ id: 'all', name: 'Todos los Conceptos', icon: Category }];
    
    if (!conceptsData || conceptsData.length === 0) return baseCategories;
    
    // Extraer conceptos únicos y crear categorías
    const uniqueConcepts = conceptsData.map(concept => ({
      id: concept.id,
      name: concept.name,
      icon: () => concept.icon // Usar el emoji como función del icono
    }));
    
    return [...baseCategories, ...uniqueConcepts];
  }, [conceptsData]);

  const filteredConcepts = conceptsData.filter(concept => {
    const matchesSearch = concept.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || concept.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Limitar datos para mejor visualización - Solo mostrar top 8 conceptos más importantes
  const sortedConcepts = [...filteredConcepts].sort((a, b) => b.totalAmount - a.totalAmount);
  const topConcepts = sortedConcepts.slice(0, 8);
  const otherConcepts = sortedConcepts.slice(8);
  
  // Si hay conceptos adicionales, agregar categoría "Otros"
  const conceptsForChart = [...topConcepts];
  if (otherConcepts.length > 0) {
    const otherTotal = otherConcepts.reduce((sum, concept) => sum + concept.totalAmount, 0);
    const otherCommitments = otherConcepts.reduce((sum, concept) => sum + concept.commitments, 0);
    conceptsForChart.push({
      name: `Otros (${otherConcepts.length})`,
      totalAmount: otherTotal,
      commitments: otherCommitments,
      isOther: true
    });
  }

  const chartData = conceptsForChart.map((concept, index) => ({
    name: concept.isOther ? concept.name : (concept.name.substring(0, 20) + (concept.name.length > 20 ? '...' : '')),
    amount: concept.totalAmount,
    commitments: concept.commitments,
    color: concept.isOther ? '#9e9e9e' : getColorScheme(settings?.dashboard?.charts?.colorScheme || 'corporate')[index % 8] || theme.palette.grey[400]
  }));

  const pieData = conceptsForChart.map((concept, index) => ({
    name: concept.isOther ? concept.name : concept.name,
    value: concept.totalAmount,
    color: concept.isOther ? '#9e9e9e' : getColorScheme(settings?.dashboard?.charts?.colorScheme || 'corporate')[index % 8] || theme.palette.grey[400]
  }));

  const formatCurrency = useMemo(() => (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }, []);

  // Función para formatear valores del eje Y
  const formatYAxisValue = (value) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const getTotalStats = () => {
    return filteredConcepts.reduce((acc, concept) => ({
      totalAmount: acc.totalAmount + concept.totalAmount,
      totalCommitments: acc.totalCommitments + concept.commitments,
      totalCompleted: acc.totalCompleted + concept.completed,
      totalPending: acc.totalPending + concept.pending,
      totalOverdue: acc.totalOverdue + concept.overdue
    }), {
      totalAmount: 0,
      totalCommitments: 0,
      totalCompleted: 0,
      totalPending: 0,
      totalOverdue: 0
    });
  };

  const stats = getTotalStats();

  const exportReport = async () => {
    console.log('Exportando reporte por concepto...');
    
    // ✅ VALIDAR QUE LOS DATOS ESTÉN DISPONIBLES
    if (!companiesData || companiesData.length === 0) {
      alert('Error: No se han cargado los datos de empresas. Inténtalo de nuevo en unos segundos.');
      return;
    }
    
    if (!commitments || commitments.length === 0) {
      alert('Error: No hay compromisos para exportar.');
      return;
    }
    
    try {
      // 📝 Registrar actividad de auditoría - Exportación de reporte
      await logActivity('export_report', 'report', 'concept_report', {
        reportType: 'Análisis por Concepto',
        category: selectedCategory,
        dateRangeFilter: dateRangeFilter,
        searchTerm: searchTerm || 'Sin filtro',
        totalConcepts: filteredConcepts.length,
        totalAmount: stats.totalAmount,
        exportFormat: 'Excel'
      });

      // 📊 CREAR WORKBOOK SIGUIENDO EXCEL_EXPORT_DESIGN_SYSTEM
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DR Group Dashboard';
      workbook.created = new Date();
      workbook.properties.title = "DR Group - Análisis por Concepto";
      workbook.properties.subject = "Reporte Detallado de Compromisos por Concepto";

      // 🎨 PALETA DE COLORES CORPORATIVA PREMIUM (Siguiendo design system)
      const BRAND_COLORS = {
        primary: '0D47A1',      // Azul corporativo profundo
        primaryLight: '1976D2', // Azul corporativo claro
        headerBg: '0D47A1',     // Azul profundo para headers
        subHeaderBg: 'E3F2FD',  // Azul muy claro para sub-headers
        success: '2E7D32',      // Verde corporativo
        warning: 'E65100',      // Naranja ejecutivo
        error: 'C62828',        // Rojo corporativo
        white: 'FFFFFF',        // Blanco puro
        tableStripe: 'F8F9FA',  // Gris para filas alternas
        gold: 'FFD700'          // Dorado para elementos premium
      };

      // 📋 HOJA 1: RESUMEN POR CONCEPTOS
      const summarySheet = workbook.addWorksheet('Resumen por Conceptos', {
        pageSetup: { 
          paperSize: 9, // A4
          orientation: 'landscape',
          horizontalCentered: true,
          margins: { top: 0.75, bottom: 0.75, left: 0.25, right: 0.25 }
        }
      });
      
      // Header principal según design system
      summarySheet.mergeCells('A1:H1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = '🏢 DR GROUP - ANÁLISIS POR CONCEPTO';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.headerBg}` } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.border = {
        top: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } },
        bottom: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } },
        left: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } },
        right: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } }
      };
      summarySheet.getRow(1).height = 35;

      // Información del reporte (Header secundario)
      summarySheet.mergeCells('A2:H2');
      const infoCell = summarySheet.getCell('A2');
      infoCell.value = `📅 Generado: ${new Date().toLocaleDateString('es-ES')} | 🏷️ Categoría: ${selectedCategory} | ⏰ Período: ${dateRangeFilter}`;
      infoCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: `FF${BRAND_COLORS.primary}` } };
      infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.subHeaderBg}` } };
      infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(2).height = 25;

      // Headers de la tabla (SIN columna descripción)
      const headers = ['CONCEPTO', 'MONTO TOTAL', 'COMPROMISOS', 'COMPLETADOS', 'PENDIENTES', 'VENCIDOS', 'PROMEDIO', 'ICONO'];
      headers.forEach((header, index) => {
        const cell = summarySheet.getCell(4, index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.primaryLight}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } }
        };
      });
      summarySheet.getRow(4).height = 25;

      // Datos de conceptos (SIN columna descripción)
      filteredConcepts.forEach((concept, index) => {
        const row = index + 5;
        summarySheet.getCell(row, 1).value = concept.name;
        summarySheet.getCell(row, 2).value = concept.totalAmount;
        summarySheet.getCell(row, 3).value = concept.commitments;
        summarySheet.getCell(row, 4).value = concept.completed;
        summarySheet.getCell(row, 5).value = concept.pending;
        summarySheet.getCell(row, 6).value = concept.overdue;
        summarySheet.getCell(row, 7).value = concept.avgAmount;
        summarySheet.getCell(row, 8).value = concept.icon;

        // Formatear montos como moneda (diseño system)
        summarySheet.getCell(row, 2).numFmt = '"$"#,##0.00';
        summarySheet.getCell(row, 7).numFmt = '"$"#,##0.00';

        // Aplicar estilos según design system
        const fillColor = index % 2 === 0 ? BRAND_COLORS.tableStripe : BRAND_COLORS.white;
        for (let col = 1; col <= 8; col++) {
          const cell = summarySheet.getCell(row, col);
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fillColor}` } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          cell.alignment = { 
            horizontal: col === 1 ? 'left' : col === 8 ? 'center' : 'right',
            vertical: 'middle' 
          };
        }
        summarySheet.getRow(row).height = 18;
      });

      // Ajustar ancho de columnas según design system
      summarySheet.getColumn(1).width = 25; // Concepto
      summarySheet.getColumn(2).width = 15; // Monto Total  
      summarySheet.getColumn(3).width = 12; // Compromisos
      summarySheet.getColumn(4).width = 12; // Completados
      summarySheet.getColumn(5).width = 12; // Pendientes
      summarySheet.getColumn(6).width = 12; // Vencidos
      summarySheet.getColumn(7).width = 15; // Promedio
      summarySheet.getColumn(8).width = 8;  // Icono

      // 📋 HOJA 2: DETALLE DE COMPROMISOS CON ESTADOS CORRECTOS
      const detailSheet = workbook.addWorksheet('Detalle de Compromisos', {
        pageSetup: { 
          paperSize: 9,
          orientation: 'landscape',
          horizontalCentered: true
        }
      });
      
      // Header de detalle según design system
      detailSheet.mergeCells('A1:G1');
      const detailTitleCell = detailSheet.getCell('A1');
      detailTitleCell.value = '📊 DETALLE DE COMPROMISOS POR CONCEPTO';
      detailTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
      detailTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.success}` } };
      detailTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      detailTitleCell.border = {
        top: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } },
        bottom: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } },
        left: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } },
        right: { style: 'thick', color: { argb: `FF${BRAND_COLORS.gold}` } }
      };
      detailSheet.getRow(1).height = 35;

      // Headers del detalle (SIN descripción del concepto, enfocado en compromiso)
      const detailHeaders = ['CONCEPTO', 'MONTO', 'EMPRESA', 'ESTADO', 'FECHA CREACIÓN', 'FECHA VENCIMIENTO', 'BENEFICIARIO'];
      detailHeaders.forEach((header, index) => {
        const cell = detailSheet.getCell(3, index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: `FF${BRAND_COLORS.white}` } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLORS.success}` } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } }
        };
      });
      detailSheet.getRow(3).height = 25;

      // Llenar detalle de compromisos con estados calculados correctamente
      let detailRow = 4;
      for (const concept of filteredConcepts) {
        // Buscar compromisos que pertenezcan a este concepto
        const conceptCommitments = commitments.filter(c => 
          (c.concept === concept.name) || 
          (c.description && c.description.toLowerCase().includes(concept.name.toLowerCase()))
        );

        for (const commitment of conceptCommitments) {
          // ✅ USAR ESTADO CALCULADO CORRECTAMENTE
          const calculatedStatus = await determineCommitmentStatus(commitment);
          let statusText, statusColor;
          
          switch (calculatedStatus) {
            case 'completed':
              statusText = 'Completado';
              statusColor = 'FFE8F5E8'; // Verde claro
              break;
            case 'partial':
              statusText = 'Pago Parcial (Pendiente)';
              statusColor = 'FFFFF3E0'; // Amarillo claro
              break;
            case 'pending':
              statusText = 'Pendiente';
              statusColor = 'FFFFF3E0'; // Amarillo claro
              break;
            case 'overdue':
              statusText = 'Vencido';
              statusColor = 'FFFFE8E8'; // Rojo claro
              break;
            default:
              statusText = 'Desconocido';
              statusColor = 'FFF0F0F0'; // Gris claro
          }

          // Llenar fila con datos
          detailSheet.getCell(detailRow, 1).value = concept.name;
          detailSheet.getCell(detailRow, 2).value = commitment.amount || 0;
          
          // ✅ BUSCAR NOMBRE DE EMPRESA CORRECTAMENTE
          const company = companiesData?.find(comp => comp.id === commitment.companyId);
          detailSheet.getCell(detailRow, 3).value = company?.name || commitment.companyName || commitment.company || 'N/A';
          
          detailSheet.getCell(detailRow, 4).value = statusText;
          detailSheet.getCell(detailRow, 5).value = commitment.createdAt ? 
            new Date(commitment.createdAt.toDate ? commitment.createdAt.toDate() : commitment.createdAt).toLocaleDateString('es-ES') : 'N/A';
          detailSheet.getCell(detailRow, 6).value = commitment.dueDate ? 
            new Date(commitment.dueDate.toDate ? commitment.dueDate.toDate() : commitment.dueDate).toLocaleDateString('es-ES') : 'N/A';
          detailSheet.getCell(detailRow, 7).value = commitment.beneficiary || 'N/A';

          // Formatear monto
          detailSheet.getCell(detailRow, 2).numFmt = '"$"#,##0.00';

          // Aplicar formato según design system
          for (let col = 1; col <= 7; col++) {
            const cell = detailSheet.getCell(detailRow, col);
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FF424242' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
              right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
            };
            cell.alignment = { 
              horizontal: col === 1 ? 'left' : col === 4 ? 'center' : 'right',
              vertical: 'middle' 
            };
          }
          detailSheet.getRow(detailRow).height = 18;
          detailRow++;
        }
      }

      // Ajustar ancho de columnas del detalle
      detailSheet.getColumn(1).width = 20; // Concepto
      detailSheet.getColumn(2).width = 15; // Monto
      detailSheet.getColumn(3).width = 20; // Empresa
      detailSheet.getColumn(4).width = 20; // Estado
      detailSheet.getColumn(5).width = 15; // Fecha Creación
      detailSheet.getColumn(6).width = 15; // Fecha Vencimiento
      detailSheet.getColumn(7).width = 25; // Beneficiario

      // � GENERAR Y DESCARGAR ARCHIVO
      const timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
      const filename = `DR-Group-Reporte-Conceptos-${timestamp}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(link.href);
      
      console.log('✅ Reporte de conceptos exportado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al exportar reporte:', error);
      alert('Error al generar el reporte Excel. Verifica la consola para más detalles.');
    }
  };

  // Función para renderizar gráfica principal dinámicamente
  const renderConceptChart = (data, chartKey = 'main') => {
    const chartType = settings?.dashboard?.charts?.defaultType || 'bar';
    const colors = getColorScheme(settings?.dashboard?.charts?.colorScheme || 'corporate');
    const animations = settings?.dashboard?.charts?.animations !== false;
    const showDataLabels = settings?.dashboard?.charts?.showDataLabels !== false;
    const showGridLines = settings?.dashboard?.charts?.gridLines !== false;
    
    const commonProps = {
      data: data,
      margin: { top: 20, right: 30, left: 80, bottom: 5 }
    };

    const animationProps = animations ? {
      animationBegin: 0,
      animationDuration: 800
    } : {
      isAnimationActive: false
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps} key={`line-${chartKey}-${tabValue}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={tabValue === 0 ? formatYAxisValue : undefined}
              width={80}
            />
            <Tooltip 
              formatter={(value, name) => [
                tabValue === 0 ? formatCurrency(value) : value,
                tabValue === 0 ? 'Monto' : 'Compromisos'
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={tabValue === 0 ? 'amount' : 'commitments'}
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              name={tabValue === 0 ? 'Monto' : 'Compromisos'}
              {...animationProps}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps} key={`area-${chartKey}-${tabValue}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={tabValue === 0 ? formatYAxisValue : undefined}
              width={80}
            />
            <Tooltip 
              formatter={(value, name) => [
                tabValue === 0 ? formatCurrency(value) : value,
                tabValue === 0 ? 'Monto' : 'Compromisos'
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={tabValue === 0 ? 'amount' : 'commitments'}
              stroke={colors[0]}
              fill={`url(#colorGradient-${chartKey})`}
              name={tabValue === 0 ? 'Monto' : 'Compromisos'}
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

      case 'scatter':
        return (
          <ScatterChart {...commonProps} key={`scatter-${chartKey}-${tabValue}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis dataKey="commitments" name="Compromisos" />
            <YAxis 
              dataKey="amount" 
              name="Monto"
              tickFormatter={formatYAxisValue}
              width={80}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'Monto' ? formatCurrency(value) : value,
                name
              ]}
            />
            <Legend />
            <Scatter
              data={data.map(item => ({ ...item, x: item.commitments, y: item.amount }))}
              fill={colors[0]}
              name="Conceptos"
              {...animationProps}
            />
          </ScatterChart>
        );

      default: // bar
        return (
          <BarChart {...commonProps} key={`bar-${chartKey}-${tabValue}`}>
            {showGridLines && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              fontSize={11}
            />
            <YAxis 
              tickFormatter={tabValue === 0 ? formatYAxisValue : undefined}
              width={80}
            />
            <Tooltip 
              formatter={(value, name) => [
                tabValue === 0 ? formatCurrency(value) : value,
                tabValue === 0 ? 'Monto Total' : 'Cantidad de Compromisos'
              ]}
              labelFormatter={(label) => `Concepto: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey={tabValue === 0 ? 'amount' : 'commitments'} 
              fill={colors[0]}
              name={tabValue === 0 ? 'Monto' : 'Compromisos'}
              radius={[2, 2, 0, 0]}
              {...animationProps}
            />
          </BarChart>
        );
    }
  };

  // Función para renderizar gráfica de distribución dinámicamente
  const renderDistributionChart = (data, chartKey = 'distribution') => {
    const chartType = settings?.dashboard?.charts?.distributionType || 'pie';
    const colors = getColorScheme(settings?.dashboard?.charts?.colorScheme || 'corporate');
    const animations = settings?.dashboard?.charts?.animations !== false;

    const animationProps = animations ? {
      animationBegin: 0,
      animationDuration: 800
    } : {
      isAnimationActive: false
    };

    if (chartType === 'donut') {
      return (
        <PieChart key={`donut-${chartKey}-${tabValue}`}>
          <Pie
            data={data}
            cx="35%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            {...animationProps}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => formatCurrency(value)}
            labelFormatter={(label) => `Concepto: ${label}`}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '10px',
              maxWidth: '45%',
              paddingLeft: '10px' 
            }}
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconSize={8}
          />
        </PieChart>
      );
    }

    // Default: pie
    return (
      <PieChart key={`pie-${chartKey}-${tabValue}`}>
        <Pie
          data={data}
          cx="35%"
          cy="50%"
          innerRadius={30}
          outerRadius={75}
          paddingAngle={2}
          dataKey="value"
          {...animationProps}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => formatCurrency(value)}
          labelFormatter={(label) => `Concepto: ${label}`}
        />
        <Legend 
          wrapperStyle={{ 
            fontSize: '10px',
            maxWidth: '45%',
            paddingLeft: '10px' 
          }}
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconSize={8}
        />
      </PieChart>
    );
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
            Cargando y categorizando compromisos...
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
                REPORTES • ANÁLISIS POR CONCEPTO
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
                🏷️ Reportes por Concepto
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Análisis de {filteredConcepts.length} conceptos reales de Firebase
              </Typography>
            </Box>
          </Paper>

      {/* Filtros Premium */}
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
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}
        >
          <Box>
            {/* Header Premium */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <FilterList 
                    sx={{ 
                      mr: 2, 
                      color: 'primary.main',
                      fontSize: 28
                    }} 
                  />
                </motion.div>
                <Box>
                  <Typography 
                    variant="h5" 
                    color="primary.main"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    Filtros de Conceptos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Refina tu análisis de conceptos con múltiples criterios
                  </Typography>
                </Box>
              </Box>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <IconButton
                  onClick={clearFilters}
                  sx={{
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.2),
                    }
                  }}
                >
                  <Clear sx={{ color: 'error.main', fontSize: 20 }} />
                </IconButton>
              </motion.div>
            </Box>

            {/* Filtros Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Buscar concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.5)}`
                      }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Categoría"
                    sx={{
                      borderRadius: 1,
                      transition: 'all 0.2s ease',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.5)
                      }
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.id === 'all' ? (
                            <category.icon fontSize="small" />
                          ) : (
                            <span style={{ fontSize: '16px' }}>{category.icon()}</span>
                          )}
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
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

            {/* Botones de Apply/Clear */}
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

            {/* Chips de filtros aplicados */}
      {(searchTerm || selectedCategory !== 'all' || dateRangeFilter !== 'thisMonth') && (
              <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {searchTerm && (
                  <Chip
                    label={`Búsqueda: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm('')}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {selectedCategory !== 'all' && (
                  <Chip
                    label={`Categoría: ${categories.find(c => c.id === selectedCategory)?.name}`}
                    size="small"
                    onDelete={() => setSelectedCategory('all')}
                    color="secondary"
                    variant="outlined"
                  />
                )}
                {dateRangeFilter !== 'thisMonth' && (
                  <Chip
                    label={`Período: ${
                      dateRangeFilter === 'thisMonth' ? 'Este mes' :
                      dateRangeFilter === 'lastMonth' ? 'Mes pasado' :
                      dateRangeFilter === 'last90Days' ? 'Últimos 90 días' :
                      dateRangeFilter === 'thisYear' ? 'Este año' :
                      dateRangeFilter === 'lastYear' ? 'Año pasado' :
                      dateRangeFilter === 'custom' && customStartDate && customEndDate ? 
                        `${customStartDate.toLocaleDateString('es-ES')} - ${customEndDate.toLocaleDateString('es-ES')}` :
                        'Personalizado'
                    }`}
                    size="small"
                    onDelete={() => setDateRangeFilter('thisMonth')}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </motion.div>

      {/* DateRangeFilter handles custom dates internally */}

      {/* Botón de exportar Premium */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={exportReport}
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            py: 1.5,
            textTransform: 'none',
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
          Exportar Reporte
        </Button>
      </Box>

      {/* Resumen sobrio */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Conceptos Activos', 
            value: filteredConcepts.length, 
            color: theme.palette.primary.main,
            icon: Category
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(stats.totalAmount), 
            color: theme.palette.success.main,
            icon: AttachMoney
          },
          { 
            label: 'Total Compromisos', 
            value: stats.totalCommitments, 
            color: theme.palette.info.main,
            icon: Assignment
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
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sección de gráficos sobria */}
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              borderRadius: 1,
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.primary',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${theme.palette.primary.main}10`,
                color: 'primary.main'
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText'
              }
            }
          }}
        >
          <Tab label="Distribución por Monto" />
          <Tab label="Distribución por Cantidad" />
        </Tabs>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {tabValue === 0 ? 'Montos por Concepto' : 'Cantidad de Compromisos por Concepto'}
                </Typography>
                {otherConcepts.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Mostrando los 8 conceptos principales. Los {otherConcepts.length} conceptos restantes están agrupados en "Otros"
                  </Typography>
                )}
                <ResponsiveContainer width="100%" height={otherConcepts.length > 0 ? 280 : 300}>
                  {renderConceptChart(chartData, 'main')}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Distribución de Montos
                </Typography>
                {otherConcepts.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Top 8 conceptos + otros agrupados
                  </Typography>
                )}
                <ResponsiveContainer width="100%" height={otherConcepts.length > 0 ? 280 : 300}>
                  {renderDistributionChart(pieData, 'distribution')}
                </ResponsiveContainer>
                </CardContent>
              </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabla de conceptos sobria */}
      <Card sx={{ 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalle por Concepto ({filteredConcepts.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Análisis detallado de compromisos agrupados automáticamente por concepto
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ 
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderRadius: 0
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.8)
                    : 'grey.50'
                }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Concepto</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Compromisos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Completados</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Pendientes</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Vencidos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredConcepts.map((concept, index) => (
                  <TableRow
                    key={concept.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: theme.palette.action.hover 
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          background: `linear-gradient(135deg, ${concept.color} 0%, ${concept.color}90 100%)`
                        }}>
                          {concept.icon}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600 }}>
                          {concept.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                        {formatCurrency(concept.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{concept.commitments}</TableCell>
                    <TableCell>
                      <Chip 
                        label={concept.completed}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={concept.pending}
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={concept.overdue}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(concept.avgAmount)}
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

export default ReportsConceptPage;
