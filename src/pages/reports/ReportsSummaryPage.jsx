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
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCommitments, useCompanies } from '../../hooks/useFirestore';

const ReportsSummaryPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Conectar con Firebase para obtener datos reales
  const { commitments, loading: commitmentsLoading } = useCommitments();
  const { data: companies, loading: companiesLoading } = useCompanies();
  
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
    <Box sx={{ p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LinearProgress sx={{ width: '50%' }} />
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
            📊 Resumen Ejecutivo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vista general de todos los compromisos financieros
          </Typography>
        </Box>
      </motion.div>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Compromisos', 
            value: summaryData.totalCommitments, 
            icon: Assignment,
            color: '#667eea',
            suffix: '',
            trend: '+15%'
          },
          { 
            label: 'Monto Total', 
            value: formatCurrency(summaryData.totalAmount), 
            icon: AttachMoney,
            color: '#4caf50',
            suffix: '',
            trend: `+${summaryData.monthlyGrowth}%`
          },
          { 
            label: 'Empresas Activas', 
            value: summaryData.companies, 
            icon: Business,
            color: '#f093fb',
            suffix: '',
            trend: '+3'
          },
          { 
            label: 'Promedio por Compromiso', 
            value: formatCurrency(summaryData.averageAmount), 
            icon: AccountBalance,
            color: '#ff9800',
            suffix: '',
            trend: '+5.2%'
          }
        ].map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${kpi.color}20 0%, ${kpi.color}08 100%)`
                  : `linear-gradient(135deg, ${kpi.color}15 0%, ${kpi.color}05 100%)`,
                border: isDarkMode 
                  ? `1px solid ${kpi.color}40` 
                  : `1px solid ${kpi.color}30`,
                borderRadius: 4,
                backdropFilter: 'blur(20px)',
                height: '100%'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <kpi.icon sx={{ color: kpi.color, fontSize: 32 }} />
                    <Chip 
                      label={kpi.trend}
                      size="small"
                      icon={kpi.trend.includes('+') ? <TrendingUp /> : <TrendingDown />}
                      color={kpi.trend.includes('+') ? 'success' : 'error'}
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: kpi.color, mb: 1 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(255, 255, 255, 0.2)',
              height: '400px'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
          </motion.div>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card sx={{
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(255, 255, 255, 0.2)',
              height: '400px'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
                    <Bar dataKey="amount" fill="#667eea" name="amount" />
                    <Bar dataKey="commitments" fill="#f093fb" name="commitments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Top Companies */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Empresas con Mayor Actividad
                </Typography>
                <List>
                  {topCompanies.map((company, index) => (
                    <React.Fragment key={company.name}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            background: `linear-gradient(135deg, #667eea${(5-index)*20} 0%, #764ba2${(5-index)*20} 100%)` 
                          }}>
                            <Business />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 600 }}>
                                {company.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                                  {formatCurrency(company.amount)}
                                </Typography>
                                <Chip 
                                  label={`${company.growth > 0 ? '+' : ''}${company.growth}%`}
                                  size="small"
                                  color={company.growth > 0 ? 'success' : 'error'}
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
          </motion.div>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card sx={{
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Indicadores Rápidos
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tasa de Completado</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.round((summaryData.completedCommitments / summaryData.totalCommitments) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(summaryData.completedCommitments / summaryData.totalCommitments) * 100}
                    sx={{ 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #4caf50 0%, #45a049 100%)'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Compromisos Pendientes</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.round((summaryData.pendingCommitments / summaryData.totalCommitments) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(summaryData.pendingCommitments / summaryData.totalCommitments) * 100}
                    sx={{ 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)'
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Compromisos Vencidos</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.round((summaryData.overdueCommitments / summaryData.totalCommitments) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(summaryData.overdueCommitments / summaryData.totalCommitments) * 100}
                    sx={{ 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #f44336 0%, #d32f2f 100%)'
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
        </>
      )}
    </Box>
  );
};

export default ReportsSummaryPage;
