import React, { useState, useEffect, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCommitments } from '../../hooks/useFirestore';
import {
  DateRange,
  GetApp,
  CalendarMonth,
  TrendingUp,
  AttachMoney,
  Assignment
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
// Comentamos DatePicker temporalmente para evitar errores
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { es } from 'date-fns/locale';

const ReportsPeriodPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [startDate, setStartDate] = useState(new Date(2025, 0, 1)); // 1 enero 2025
  const [endDate, setEndDate] = useState(new Date(2025, 6, 31)); // 31 julio 2025
  const [periodType, setPeriodType] = useState('monthly');
  const [comparisonMode, setComparisonMode] = useState('previous');

  // Conectar con Firebase para obtener compromisos reales
  const { data: commitments, loading } = useCommitments();

  // Calcular datos mensuales desde Firebase
  const monthlyData = useMemo(() => {
    if (!commitments) return [];
    
    const months = [];
    const currentDate = new Date();
    
    // Generar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthCommitments = commitments.filter(c => {
        const commitmentDate = new Date(c.dueDate);
        return commitmentDate >= monthStart && commitmentDate <= monthEnd;
      });
      
      const totalAmount = monthCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      const completed = monthCommitments.filter(c => c.status === 'completed').length;
      const pending = monthCommitments.filter(c => c.status === 'pending').length;
      const overdue = monthCommitments.filter(c => c.status === 'overdue').length;
      
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
    
    return months;
  }, [commitments]);

  // Calcular datos semanales desde Firebase
  const weeklyData = useMemo(() => {
    if (!commitments) return [];
    
    const weeks = [];
    const currentDate = new Date();
    
    // Generar últimas 8 semanas
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - (i * 7) - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekCommitments = commitments.filter(c => {
        const commitmentDate = new Date(c.dueDate);
        return commitmentDate >= weekStart && commitmentDate <= weekEnd;
      });
      
      const totalAmount = weekCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      weeks.push({
        period: `Sem ${8 - i}`,
        amount: totalAmount,
        commitments: weekCommitments.length
      });
    }
    
    return weeks;
  }, [commitments]);

  const currentData = periodType === 'weekly' ? weeklyData : monthlyData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

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

  const exportReport = () => {
    console.log('Exportando reporte por período...');
    // Aquí se implementaría la exportación real
  };

  const getGrowthRate = () => {
    if (currentData.length < 2) return 0;
    const lastPeriod = currentData[currentData.length - 1];
    const previousPeriod = currentData[currentData.length - 2];
    return ((lastPeriod.amount - previousPeriod.amount) / previousPeriod.amount * 100).toFixed(1);
  };

  return (
    // <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Typography variant="h6" color="text.secondary">
              Cargando datos de períodos...
            </Typography>
          </Box>
        ) : (
          <>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              📅 Reportes por Período
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Análisis temporal de compromisos financieros
            </Typography>
          </Box>
        </motion.div>

        {/* Filters */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 4,
          background: isDarkMode 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Fecha Inicio"
                  type="date"
                  value="2025-01-01"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Fecha Fin"
                  type="date"
                  value="2025-07-31"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value)}
                    label="Período"
                  >
                    <MenuItem value="daily">Diario</MenuItem>
                    <MenuItem value="weekly">Semanal</MenuItem>
                    <MenuItem value="monthly">Mensual</MenuItem>
                    <MenuItem value="quarterly">Trimestral</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Comparar con</InputLabel>
                  <Select
                    value={comparisonMode}
                    onChange={(e) => setComparisonMode(e.target.value)}
                    label="Comparar con"
                  >
                    <MenuItem value="previous">Período anterior</MenuItem>
                    <MenuItem value="year">Mismo período año anterior</MenuItem>
                    <MenuItem value="none">Sin comparación</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={exportReport}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  Exportar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              label: 'Monto Total', 
              value: formatCurrency(stats.totalAmount), 
              color: '#4caf50',
              icon: AttachMoney,
              growth: getGrowthRate()
            },
            { 
              label: 'Total Compromisos', 
              value: stats.totalCommitments, 
              color: '#667eea',
              icon: Assignment,
              growth: '+12'
            },
            { 
              label: 'Tasa Completado', 
              value: `${Math.round((stats.totalCompleted / stats.totalCommitments) * 100)}%`, 
              color: '#f093fb',
              icon: TrendingUp,
              growth: '+5.2'
            },
            { 
              label: 'Ticket Promedio', 
              value: formatCurrency(stats.totalAmount / stats.totalCommitments), 
              color: '#ff9800',
              icon: CalendarMonth,
              growth: '-2.1'
            }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                  border: `1px solid ${stat.color}30`,
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <stat.icon sx={{ color: stat.color, fontSize: 32 }} />
                      <Chip 
                        label={`${stat.growth > 0 ? '+' : ''}${stat.growth}%`}
                        size="small"
                        color={stat.growth > 0 ? 'success' : 'error'}
                        icon={<TrendingUp />}
                      />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Trend Chart */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card sx={{
                borderRadius: 4,
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
                height: '400px'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Tendencia de Montos ({periodType === 'monthly' ? 'Mensual' : 'Semanal'})
                  </Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={currentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#667eea" 
                        fill="url(#colorAmount)"
                        strokeWidth={3}
                        name="Monto"
                      />
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Commitments Chart */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card sx={{
                borderRadius: 4,
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid rgba(0, 0, 0, 0.1)',
                height: '400px'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Compromisos por Período
                  </Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={currentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="commitments" 
                        stroke="#f093fb" 
                        strokeWidth={3}
                        dot={{ fill: '#f093fb', strokeWidth: 2, r: 6 }}
                        name="Compromisos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Detailed Table */}
        <Card sx={{ 
          borderRadius: 4,
          background: isDarkMode 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Detalle por Período
            </Typography>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Compromisos</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Completados</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Pendientes</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Vencidos</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ticket Promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentData.map((row, index) => (
                    <motion.tr
                      key={row.period}
                      component={TableRow}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {row.period}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {formatCurrency(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.commitments}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.completed || 0}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.pending || 0}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.overdue || 0}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(row.avgTicket || (row.amount / row.commitments))}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
          </>
        )}
      </Box>
    // </LocalizationProvider>
  );
};

export default ReportsPeriodPage;
