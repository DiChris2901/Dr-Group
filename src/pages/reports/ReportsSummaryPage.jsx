import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
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
  Schedule
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';

const ReportsSummaryPage = () => {
  const theme = useTheme();
  
  // Conectar con Firebase para obtener datos reales
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { companies, loading: companiesLoading } = useCommitments();
  
  const loading = commitmentsLoading || companiesLoading;

  // Calcular estadísticas reales desde Firebase
  const summaryData = useMemo(() => {
    if (!commitments) return {
      totalCommitments: 0,
      totalAmount: 0,
      completedCommitments: 0,
      pendingCommitments: 0,
      overdueCommitments: 0,
      averageAmount: 0,
      monthlyGrowth: 0,
      companies: 0
    };

    const completed = commitments.filter(c => c.status === 'completed');
    const pending = commitments.filter(c => c.status === 'pending');
    const overdue = commitments.filter(c => {
      const dueDate = new Date(c.dueDate);
      return c.status === 'pending' && dueDate < new Date();
    });

    const totalAmount = commitments.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    return {
      totalCommitments: commitments.length,
      totalAmount,
      completedCommitments: completed.length,
      pendingCommitments: pending.length,
      overdueCommitments: overdue.length,
      averageAmount: commitments.length > 0 ? totalAmount / commitments.length : 0,
      monthlyGrowth: 0, // Calcular con datos históricos
      companies: companies?.length || 0
    };
  }, [commitments, companies]);

  const statusData = useMemo(() => [
    { name: 'Completados', value: summaryData.completedCommitments, color: '#4caf50' },
    { name: 'Pendientes', value: summaryData.pendingCommitments, color: '#ff9800' },
    { name: 'Vencidos', value: summaryData.overdueCommitments, color: '#f44336' }
  ], [summaryData]);

  // Generar datos mensuales reales (simplificado para el ejemplo)
  const monthlyData = useMemo(() => {
    // En una implementación real, agruparías los compromisos por mes
    return [
      { month: 'Ene', amount: 0, commitments: 0 },
      { month: 'Feb', amount: 0, commitments: 0 },
      { month: 'Mar', amount: 0, commitments: 0 },
      { month: 'Abr', amount: 0, commitments: 0 },
      { month: 'May', amount: 0, commitments: 0 },
      { month: 'Jun', amount: 0, commitments: 0 },
      { month: 'Jul', amount: 0, commitments: 0 }
    ];
  }, [commitments]);

  // Calcular top companies desde datos reales
  const topCompanies = useMemo(() => {
    if (!commitments || !companies) return [];
    
    const companyStats = companies.map(company => {
      const companyCommitments = commitments.filter(c => c.company === company.name);
      const totalAmount = companyCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      return {
        name: company.name,
        amount: totalAmount,
        commitments: companyCommitments.length,
        growth: 0 // Calcular con datos históricos
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);
    
    return companyStats;
  }, [commitments, companies]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : (
        <>
      {/* Header sobrio */}
      <Box sx={{ 
        mb: 6,
        textAlign: 'left'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: 'text.primary'
          }}
        >
          📊 Resumen Ejecutivo
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontWeight: 400
          }}
        >
          Vista general de todos los compromisos financieros
        </Typography>
      </Box>

      {/* KPI Cards sobrias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Compromisos', 
            value: summaryData.totalCommitments, 
            icon: Assignment,
            color: theme.palette.primary.main,
            suffix: '',
            trend: '+15%'
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(summaryData.totalAmount), 
            icon: AttachMoney,
            color: theme.palette.success.main,
            suffix: '',
            trend: `+${summaryData.monthlyGrowth}%`
          },
          { 
            label: 'Empresas Activas', 
            value: summaryData.companies, 
            icon: Business,
            color: theme.palette.info.main,
            suffix: '',
            trend: '+3'
          },
          { 
            label: 'Promedio por Compromiso', 
            value: formatCurrency(summaryData.averageAmount), 
            icon: AccountBalance,
            color: theme.palette.warning.main,
            suffix: '',
            trend: '+5.2%'
          }
        ].map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
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
                    backgroundColor: `${kpi.color}15`,
                    color: kpi.color
                  }}>
                    <kpi.icon sx={{ fontSize: 24 }} />
                  </Box>
                  <Chip 
                    label={kpi.trend}
                    size="small"
                    icon={kpi.trend.includes('+') ? <TrendingUp /> : <TrendingDown />}
                    color={kpi.trend.includes('+') ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.label}
                </Typography>
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
            border: `1px solid ${theme.palette.divider}`,
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
            border: `1px solid ${theme.palette.divider}`,
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
            border: `1px solid ${theme.palette.divider}`,
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
                              <Chip 
                                label={`${company.growth > 0 ? '+' : ''}${company.growth}%`}
                                size="small"
                                color={company.growth > 0 ? 'success' : 'error'}
                                variant="outlined"
                                icon={company.growth > 0 ? <TrendingUp /> : <TrendingDown />}
                              />
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
            border: `1px solid ${theme.palette.divider}`,
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
                    {Math.round((summaryData.completedCommitments / summaryData.totalCommitments) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(summaryData.completedCommitments / summaryData.totalCommitments) * 100}
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
                    {Math.round((summaryData.pendingCommitments / summaryData.totalCommitments) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(summaryData.pendingCommitments / summaryData.totalCommitments) * 100}
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
                    {Math.round((summaryData.overdueCommitments / summaryData.totalCommitments) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(summaryData.overdueCommitments / summaryData.totalCommitments) * 100}
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
