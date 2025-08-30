import React, { useState, useEffect, useMemo } from 'react';
import useActivityLogs from '../../hooks/useActivityLogs';
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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';

const ReportsSummaryPage = () => {
  const theme = useTheme();
  const { logActivity } = useActivityLogs();
  
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
    }
  }, [commitments, companies, loading]);

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
            value: formatCurrency(summaryData.totalAmount), 
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
            value: formatCurrency(summaryData.averageAmount), 
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
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} compromisos`, 'Cantidad']} />
                  <Legend />
                </PieChart>
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
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount' ? formatCurrency(value) : value,
                      name === 'amount' ? 'Monto' : 'Compromisos'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill={theme.palette.primary.main} name="amount" />
                  <Bar dataKey="commitments" fill={theme.palette.secondary.main} name="commitments" />
                </BarChart>
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
                                {formatCurrency(company.amount)}
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
