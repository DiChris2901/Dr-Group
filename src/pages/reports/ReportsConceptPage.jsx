import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
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
  IconButton
} from '@mui/material';
import {
  Category,
  Search,
  GetApp,
  TrendingUp,
  AttachMoney,
  Assignment,
  LocalAtm,
  Receipt,
  Business,
  Build,
  Group,
  FilterList,
  Clear
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { useCommitments } from '../../hooks/useFirestore';
import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';

const ReportsConceptPage = () => {
  const theme = useTheme();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('last6months');
  const [tabValue, setTabValue] = useState(0);

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

  // Conectar con Firebase para obtener compromisos reales
  const { commitments, loading } = useCommitments();

  // Análisis real por conceptos de Firebase
  const conceptsData = useMemo(() => {
    if (!commitments) return [];

    // Agrupar compromisos por concepto real
    const conceptGroups = commitments.reduce((acc, commitment) => {
      const conceptName = commitment.concept || 'Sin Concepto';
      if (!acc[conceptName]) {
        acc[conceptName] = [];
      }
      acc[conceptName].push(commitment);
      return acc;
    }, {});

    // Calcular estadísticas por concepto
    const concepts = Object.entries(conceptGroups).map(([conceptName, conceptCommitments]) => {
      const totalAmount = conceptCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      const completed = conceptCommitments.filter(c => c.status === 'completed').length;
      const pending = conceptCommitments.filter(c => c.status === 'pending').length;
      const overdue = conceptCommitments.filter(c => c.status === 'overdue').length;
      
      // Calcular crecimiento (comparando con período anterior - simplificado)
      const growth = Math.random() * 40 - 20; // TODO: Implementar cálculo real de crecimiento
      
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
        growth,
        icon: conceptInfo.icon,
        color: conceptInfo.color
      };
    });

    return concepts
      .filter(concept => concept.commitments > 0) // Solo mostrar conceptos con datos
      .sort((a, b) => b.totalAmount - a.totalAmount); // Ordenar por monto total descendente
  }, [commitments]);

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

  const chartData = filteredConcepts.map((concept, index) => ({
    name: concept.name.substring(0, 15) + (concept.name.length > 15 ? '...' : ''),
    amount: concept.totalAmount,
    commitments: concept.commitments,
    color: getColorScheme(settings?.dashboard?.charts?.colorScheme || 'corporate')[index % 8] || theme.palette.grey[400]
  }));

  const pieData = filteredConcepts.map((concept, index) => ({
    name: concept.name,
    value: concept.totalAmount,
    color: getColorScheme(settings?.dashboard?.charts?.colorScheme || 'corporate')[index % 8] || theme.palette.grey[400]
  }));

  const formatCurrency = useMemo(() => (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }, []);

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
    
    // 📝 Registrar actividad de auditoría - Exportación de reporte
    try {
      await logActivity('export_report', 'report', 'concept_report', {
        reportType: 'Análisis por Concepto',
        category: selectedCategory,
        timeRange: timeRange,
        searchTerm: searchTerm || 'Sin filtro',
        totalConcepts: filteredConcepts.length,
        totalAmount: stats.totalAmount,
        exportFormat: 'Excel'
      });
    } catch (logError) {
      console.error('Error logging report export activity:', logError);
    }
    
    // Aquí se implementaría la exportación real
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
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
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
            <YAxis />
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
            <YAxis />
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
            <YAxis dataKey="amount" name="Monto" />
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
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                tabValue === 0 ? formatCurrency(value) : value,
                tabValue === 0 ? 'Monto' : 'Compromisos'
              ]}
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
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            {...animationProps}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
        </PieChart>
      );
    }

    // Default: pie
    return (
      <PieChart key={`pie-${chartKey}-${tabValue}`}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          {...animationProps}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend />
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
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setTimeRange('last6months');
                  }}
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
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    label="Período"
                    sx={{
                      borderRadius: 1,
                      transition: 'all 0.2s ease',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.5)
                      }
                    }}
                  >
                    <MenuItem value="last3months">Últimos 3 meses</MenuItem>
                    <MenuItem value="last6months">Últimos 6 meses</MenuItem>
                    <MenuItem value="last12months">Último año</MenuItem>
                    <MenuItem value="custom">Personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Chips de filtros aplicados */}
            {(searchTerm || selectedCategory !== 'all' || timeRange !== 'last6months') && (
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
                {timeRange !== 'last6months' && (
                  <Chip
                    label={`Período: ${timeRange}`}
                    size="small"
                    onDelete={() => setTimeRange('last6months')}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </motion.div>

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
          },
          { 
            label: 'Ticket Promedio', 
            value: formatCurrency(stats.totalAmount / stats.totalCommitments || 0), 
            color: theme.palette.warning.main,
            icon: TrendingUp
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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
          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {tabValue === 0 ? 'Montos por Concepto' : 'Cantidad de Compromisos por Concepto'}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  {renderConceptChart(chartData, 'main')}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '400px'
            }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Distribución de Montos
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
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
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Concepto</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Monto Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Compromisos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Completados</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Pendientes</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Vencidos</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Promedio</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Crecimiento</TableCell>
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
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {concept.growth > 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                        ) : (
                          <TrendingUp sx={{ color: '#f44336', fontSize: 16, transform: 'rotate(180deg)' }} />
                        )}
                        <Typography 
                          sx={{ 
                            fontWeight: 600,
                            color: concept.growth > 0 ? '#4caf50' : '#f44336'
                          }}
                        >
                          {concept.growth > 0 ? '+' : ''}{concept.growth}%
                        </Typography>
                      </Box>
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
