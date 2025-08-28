import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import {
  Timeline,
  BarChart,
  PieChart,
  TrendingUp,
  DateRange,
  Person,
  Security
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Legend
} from 'recharts';
import { format, parseISO, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

/**
 * Componente de visualizaciones avanzadas para auditoría
 * Fase 2 - Gráficos interactivos y análisis visual
 */
const ActivityCharts = ({ logs, stats }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('timeline');
  const [timeRange, setTimeRange] = useState('7d');

  // Preparar datos para timeline de actividad
  const timelineData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const dateRange = eachDayOfInterval({ start: startDate, end: now });
    
    const dataByDate = logs.reduce((acc, log) => {
      const logDate = format(log.timestamp.toDate(), 'yyyy-MM-dd');
      acc[logDate] = (acc[logDate] || 0) + 1;
      return acc;
    }, {});

    return dateRange.map(date => ({
      date: format(date, 'dd/MM'),
      fullDate: format(date, 'yyyy-MM-dd'),
      actividad: dataByDate[format(date, 'yyyy-MM-dd')] || 0,
      usuarios: new Set(
        logs
          .filter(log => format(log.timestamp.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
          .map(log => log.userId)
      ).size
    }));
  }, [logs, timeRange]);

  // Preparar datos para gráfico de acciones
  const actionsData = useMemo(() => {
    if (!stats?.actionTypes) return [];
    
    return Object.entries(stats.actionTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({
        accion: action.replace('_', ' ').toUpperCase(),
        cantidad: count,
        porcentaje: Math.round((count / stats.totalActivities) * 100)
      }));
  }, [stats]);

  // Preparar datos para gráfico circular de usuarios
  const usersData = useMemo(() => {
    if (!stats?.mostActiveUsers) return [];
    
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main
    ];
    
    return Object.entries(stats.mostActiveUsers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([user, count], index) => ({
        nombre: user.split(' (')[0],
        actividades: count,
        fill: colors[index % colors.length]
      }));
  }, [stats, theme]);

  // Preparar datos para análisis por horas
  const hourlyData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const hourlyActivity = logs.reduce((acc, log) => {
      const hour = log.timestamp.toDate().getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Array.from({ length: 24 }, (_, hour) => ({
      hora: `${hour.toString().padStart(2, '0')}:00`,
      actividades: hourlyActivity[hour] || 0,
      periodo: hour < 6 ? 'Madrugada' : 
               hour < 12 ? 'Mañana' : 
               hour < 18 ? 'Tarde' : 'Noche'
    }));
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{
          bgcolor: 'background.paper',
          p: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorActividad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis 
                dataKey="date" 
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="actividad"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActividad)"
                name="Actividades"
              />
              <Line
                type="monotone"
                dataKey="usuarios"
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 3 }}
                name="Usuarios únicos"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'actions':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={actionsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={12} />
              <YAxis 
                dataKey="accion" 
                type="category" 
                stroke={theme.palette.text.secondary}
                fontSize={10}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="cantidad" 
                fill={theme.palette.primary.main}
                name="Cantidad"
                radius={[0, 4, 4, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'users':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={usersData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="actividades"
                label={({nombre, actividades}) => `${nombre}: ${actividades}`}
              >
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'hourly':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis 
                dataKey="hora" 
                stroke={theme.palette.text.secondary}
                fontSize={10}
              />
              <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="actividades" 
                fill={theme.palette.info.main}
                name="Actividades"
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (chartType) {
      case 'timeline': return 'Timeline de Actividad';
      case 'actions': return 'Acciones Más Frecuentes';
      case 'users': return 'Distribución por Usuario';
      case 'hourly': return 'Actividad por Horas';
      default: return 'Gráfico';
    }
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'timeline': return <Timeline />;
      case 'actions': return <BarChart />;
      case 'users': return <PieChart />;
      case 'hourly': return <TrendingUp />;
      default: return <BarChart />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        mb: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {getChartIcon()}
                <Typography variant="h6" fontWeight={600}>
                  Análisis Visual
                </Typography>
                <Chip 
                  label="Fase 2" 
                  size="small" 
                  color="secondary" 
                  variant="outlined" 
                />
              </Box>

              {/* Controles de gráfico */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={(e, newType) => newType && setChartType(newType)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 500
                    }
                  }}
                >
                  <ToggleButton value="timeline">
                    <Timeline sx={{ mr: 1 }} /> Timeline
                  </ToggleButton>
                  <ToggleButton value="actions">
                    <BarChart sx={{ mr: 1 }} /> Acciones
                  </ToggleButton>
                  <ToggleButton value="users">
                    <Person sx={{ mr: 1 }} /> Usuarios
                  </ToggleButton>
                  <ToggleButton value="hourly">
                    <TrendingUp sx={{ mr: 1 }} /> Por Horas
                  </ToggleButton>
                </ToggleButtonGroup>

                {chartType === 'timeline' && (
                  <ToggleButtonGroup
                    value={timeRange}
                    exclusive
                    onChange={(e, newRange) => newRange && setTimeRange(newRange)}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 500
                      }
                    }}
                  >
                    <ToggleButton value="7d">7 días</ToggleButton>
                    <ToggleButton value="30d">30 días</ToggleButton>
                    <ToggleButton value="90d">90 días</ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>

              {/* Título del gráfico */}
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                {getChartTitle()}
              </Typography>

              {/* Área del gráfico */}
              <Box sx={{
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 1,
                p: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
              }}>
                {renderChart()}
              </Box>

              {/* Métricas rápidas */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mt: 2, 
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Chip
                  icon={<DateRange />}
                  label={`${logs?.length || 0} registros`}
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<Person />}
                  label={`${stats?.uniqueUsers || 0} usuarios`}
                  variant="outlined"
                  color="secondary"
                />
                <Chip
                  icon={<Security />}
                  label={`${stats ? Object.keys(stats.actionTypes).length : 0} tipos`}
                  variant="outlined"
                  color="success"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActivityCharts;
