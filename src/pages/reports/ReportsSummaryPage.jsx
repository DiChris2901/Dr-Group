import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
import { fCurrency, fShortenNumber } from '../../utils/formatNumber';
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
  Button
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
  Download,
  FilterList
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';
import { useSettings } from '../../context/SettingsContext';

const ReportsSummaryPage = () => {
  const theme = useTheme();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  
  // Estados locales
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Conectar con Firebase para obtener datos reales
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { companies, loading: companiesLoading } = useCompanies();
  
  const loading = commitmentsLoading || companiesLoading;

  // Calcular estadísticas reales desde Firebase
  const summaryData = useMemo(() => {
    if (!commitments || commitments.length === 0) return {
      totalCommitments: 0,
      totalAmount: 0,
      completedCommitments: 0,
      pendingCommitments: 0,
      overdueCommitments: 0,
      averageAmount: 0,
      monthlyGrowth: 0,
      companies: companies?.length || 0
    };

    const now = new Date();
    
    // Calcular estadísticas basadas en la estructura real de Firebase - CAMPO 'paid'
    const completed = commitments.filter(c => c.paid === true);
    
    const pending = commitments.filter(c => c.paid !== true);
    
    const overdue = commitments.filter(c => {
      // Verificar que no esté pagado
      if (c.paid === true) return false;
      
      // Verificar fecha de vencimiento
      let dueDate;
      if (c.dueDate?.toDate) {
        dueDate = c.dueDate.toDate();
      } else if (c.dueDate) {
        dueDate = new Date(c.dueDate);
      } else {
        return false; // Sin fecha de vencimiento
      }
      
      return dueDate < now;
    });

    const totalAmount = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Debug: Log esencial para verificar datos reales
    if (commitments.length > 0) {
      console.log('📊 ReportsSummary:', {
        total: commitments.length,
        completed: completed.length,
        pending: pending.length,
        overdue: overdue.length
      });
    }
    
    return {
      totalCommitments: commitments.length,
      totalAmount,
      completedCommitments: completed.length,
      pendingCommitments: pending.length, // Total pendientes (incluye vencidos)
      pendingOnTime: pending.length - overdue.length, // Pendientes al día (sin vencidos)
      overdueCommitments: overdue.length,
      averageAmount: commitments.length > 0 ? totalAmount / commitments.length : 0,
      monthlyGrowth: 0, // Calcular con datos históricos
      companies: companies?.length || 0
    };
  }, [commitments, companies]);

  const statusData = useMemo(() => [
    { name: 'Completados', value: summaryData.completedCommitments, color: '#4caf50' },
    { name: 'Pendientes al día', value: summaryData.pendingOnTime, color: '#ff9800' },
    { name: 'Vencidos', value: summaryData.overdueCommitments, color: '#f44336' }
  ], [summaryData]);

  // Generar datos mensuales reales desde Firebase
  const monthlyData = useMemo(() => {
    if (!commitments) return [];
    
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
    commitments.forEach(commitment => {
      const createdDate = commitment.createdAt?.toDate() || new Date(commitment.createdAt);
      const month = monthNames[createdDate.getMonth()];
      
      if (monthlyStats[month]) {
        monthlyStats[month].amount += commitment.amount || 0;
        monthlyStats[month].commitments += 1;
      }
    });
    
    return Object.values(monthlyStats);
  }, [commitments]);

  // Calcular top companies desde datos reales ÚNICAMENTE
  const topCompanies = useMemo(() => {
    if (!commitments || commitments.length === 0 || !companies || companies.length === 0) {
      console.log('⚠️ topCompanies: No hay datos suficientes para calcular estadísticas');
      return [];
    }
    
    console.log('🏢 Calculando topCompanies:', {
      commitments: commitments.length,
      companies: companies.length
    });
    
    const companyStats = companies.map(company => {
      // Intentar diferentes campos de empresa en los compromisos
      const companyCommitments = commitments.filter(c => {
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
  }, [commitments, companies]);

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

  const handleExport = async () => {
    await logActivity('reports_export', 'summary', {
      timestamp: new Date().toISOString(),
      format: 'excel'
    });
    
    // Aquí implementarías la lógica de exportación
    console.log('Exportando reporte...');
  };

  // DEBUG: Información esencial sobre el estado de los datos
  useEffect(() => {
    if (!loading) {
      console.log('� ReportsSummary Status:', { 
        commitments: commitments?.length || 0, 
        companies: companies?.length || 0
      });
      console.log('🎨 Chart Settings:', settings.dashboard.charts);
      console.log('🎨 Color Scheme Selected:', settings.dashboard.charts.colorScheme);
      console.log('📈 Status Chart Type:', settings.dashboard.charts?.statusChart?.type || settings.dashboard.charts?.defaultType || 'pie');
      console.log('📊 Trend Chart Type:', settings.dashboard.charts?.trendChart?.type || settings.dashboard.charts?.defaultType || 'bar');
    }
  }, [commitments, companies, loading, settings]);

  // Función helper para obtener esquemas de colores mejorados
  const getColorScheme = (schemeName) => {
    console.log('🎨 Getting color scheme for:', schemeName);
    
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
    
    const selectedColors = schemes[schemeName] || schemes.corporate;
    console.log('🎨 Selected colors:', selectedColors);
    console.log('🎨 Available schemes:', Object.keys(schemes));
    
    return selectedColors;
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
              
              <IconButton
                onClick={handleExport}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)'
                  }
                }}
              >
                <Download sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* KPI Cards sobrias */}
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
            label: 'Tasa de Cumplimiento', 
            value: `${summaryData.totalCommitments > 0 ? Math.round((summaryData.completedCommitments / summaryData.totalCommitments) * 100) : 0}%`, 
            icon: CheckCircle,
            color: theme.palette.success.main,
            trend: (() => {
              if (summaryData.totalCommitments === 0) return '0%';
              const rate = (summaryData.completedCommitments / summaryData.totalCommitments);
              if (rate >= 0.9) return '+12%';
              if (rate >= 0.8) return '+5%'; 
              if (rate >= 0.6) return '+2%';
              if (rate >= 0.4) return '-3%';
              return '-8%';
            })(),
            subtitle: 'Compromisos completados'
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
                  <Typography 
                    variant="caption"
                    sx={{ 
                      fontWeight: 600,
                      color: kpi.trend.includes('+') ? 'success.main' : kpi.trend.includes('-') ? 'error.main' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3,
                      fontSize: '0.65rem'
                    }}
                  >
                    {kpi.trend.includes('+') ? <TrendingUp sx={{ fontSize: 12 }} /> : 
                     kpi.trend.includes('-') ? <TrendingDown sx={{ fontSize: 12 }} /> : null}
                    {kpi.trend}
                  </Typography>
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

      {/* Sección de gráficos sobria */}
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

      {/* Empresas principales sobrias */}
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
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  fontWeight: 600,
                                  color: company.growth > 0 ? 'success.main' : 'error.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                {company.growth > 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
                                {`${company.growth > 0 ? '+' : ''}${company.growth}%`}
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
        </>
      )}
    </Box>
  );
};

export default ReportsSummaryPage;
