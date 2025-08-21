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
  MenuItem,
  TablePagination,
  useTheme,
  alpha
} from '@mui/material';
import { useCommitments } from '../../hooks/useFirestore';
import {
  DateRange,
  GetApp,
  CalendarMonth,
  TrendingUp,
  AttachMoney,
  Assignment
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
// Comentamos DatePicker temporalmente para evitar errores
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { es } from 'date-fns/locale';

const ReportsPeriodPage = () => {
  const theme = useTheme();
  
  const [startDate, setStartDate] = useState(new Date(2025, 0, 1)); // 1 enero 2025
  const [endDate, setEndDate] = useState(new Date(2025, 6, 31)); // 31 julio 2025
  const [periodType, setPeriodType] = useState('monthly');
  const [comparisonMode, setComparisonMode] = useState('previous');
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Conectar con Firebase para obtener compromisos reales
  const { commitments, loading } = useCommitments();

  // Memoizar fecha actual para evitar recálculos constantes
  const currentDate = useMemo(() => new Date(), []);

  // Calcular datos mensuales desde Firebase
  const monthlyData = useMemo(() => {
    if (!commitments) return [];
    
    const months = [];
    
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
  }, [commitments, currentDate]);

  // Calcular datos semanales desde Firebase
  const weeklyData = useMemo(() => {
    if (!commitments) return [];
    
    const weeks = [];
    
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
  }, [commitments, currentDate]);

  const currentData = periodType === 'weekly' ? weeklyData : monthlyData;

  const formatCurrency = useMemo(() => (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
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

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography variant="h6" color="text.secondary">
            Cargando datos de períodos...
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
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Fecha Inicio"
                  type="date"
                  value="2025-01-01"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Fecha Fin"
                  type="date"
                  value="2025-07-31"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value)}
                    label="Período"
                    sx={{
                      borderRadius: 1
                    }}
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
                    sx={{
                      borderRadius: 1
                    }}
                  >
                    <MenuItem value="previous">Período anterior</MenuItem>
                    <MenuItem value="year">Mismo período año anterior</MenuItem>
                    <MenuItem value="none">Sin comparación</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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

        {/* Tarjetas de resumen sobrias */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              label: 'Monto Total', 
              value: formatCurrency(stats.totalAmount), 
              color: theme.palette.success.main,
              icon: AttachMoney,
              growth: getGrowthRate()
            },
            { 
              label: 'Total Compromisos', 
              value: stats.totalCommitments, 
              color: theme.palette.primary.main,
              icon: Assignment,
              growth: '+12'
            },
            { 
              label: 'Tasa Completado', 
              value: `${Math.round((stats.totalCompleted / stats.totalCommitments) * 100)}%`, 
              color: theme.palette.info.main,
              icon: TrendingUp,
              growth: '+5.2'
            },
            { 
              label: 'Ticket Promedio', 
              value: formatCurrency(stats.totalAmount / stats.totalCommitments), 
              color: theme.palette.warning.main,
              icon: CalendarMonth,
              growth: '-2.1'
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}15`,
                      color: stat.color
                    }}>
                      <stat.icon sx={{ fontSize: 24 }} />
                    </Box>
                    <Chip 
                      label={`${stat.growth > 0 ? '+' : ''}${stat.growth}%`}
                      size="small"
                      color={stat.growth > 0 ? 'success' : 'error'}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
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
                  <AreaChart 
                    key={`area-chart-${periodType}`}
                    data={currentData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      name="Monto"
                    />
                  </AreaChart>
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
                  <LineChart 
                    key={`line-chart-${periodType}`}
                    data={currentData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="commitments" 
                      stroke={theme.palette.secondary.main}
                      strokeWidth={2}
                      dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
                      name="Compromisos"
                    />
                  </LineChart>
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

export default ReportsPeriodPage;
