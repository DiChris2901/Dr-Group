import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Fab,
  CircularProgress,
  Alert,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  AttachMoney,
  Business,
  Add,
  Notifications
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../../utils/designSystem.js';
import { AnalyticsWidgetSummary } from '../charts';

const DashboardStats = ({ stats = {} }) => {
  const theme = useTheme();
  const gradients = useThemeGradients();
  
  const {
    totalCommitments = 0,
    pendingCommitments = 0,
    overDueCommitments = 0,
    completedCommitments = 0,
    totalAmount = 0,
    paidAmount = 0,
    pendingAmount = 0,
    loading = false,
    error = null
  } = stats;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Componente de tarjeta premium personalizada
  const PremiumStatCard = ({ title, value, icon, color, trend, delay = 0 }) => {
    const getGradient = () => {
      switch (color) {
        case 'primary': return `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.light}10)`;
        case 'warning': return `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.light}10)`;
        case 'error': return `linear-gradient(135deg, ${theme.palette.error.main}15, ${theme.palette.error.light}10)`;
        case 'success': return `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.light}10)`;
        default: return gradients.paper;
      }
    };

    const getIconColor = () => {
      switch (color) {
        case 'primary': return theme.palette.primary.main;
        case 'warning': return theme.palette.warning.main;
        case 'error': return theme.palette.error.main;
        case 'success': return theme.palette.success.main;
        default: return theme.palette.primary.main;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: delay,
          type: "spring",
          bounce: 0.3
        }}
        whileHover={{ 
          y: -8,
          transition: { duration: 0.2 }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            background: getGradient(),
            border: `1px solid ${getIconColor()}30`,
            borderRadius: 4,
            p: 3,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            ...shimmerEffect,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px ${getIconColor()}20`,
              border: `1px solid ${getIconColor()}50`,
            }
          }}
        >
          {/* Círculo decorativo de fondo */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${getIconColor()}10 0%, transparent 70%)`,
              zIndex: 1
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            {/* Header con icono */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${getIconColor()}20, ${getIconColor()}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {React.cloneElement(icon, { 
                  sx: { 
                    color: getIconColor(),
                    fontSize: 28
                  }
                })}
              </Box>
              
              {trend && (
                <Chip
                  label={`${trend > 0 ? '+' : ''}${trend}%`}
                  size="small"
                  color={trend > 0 ? 'success' : 'error'}
                  sx={{ 
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                />
              )}
            </Box>

            {/* Título */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 1,
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {title}
            </Typography>

            {/* Valor principal */}
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                color: getIconColor(),
                fontFamily: 'monospace',
                textShadow: `0 2px 4px ${getIconColor()}20`
              }}
            >
              {typeof value === 'number' && value > 1000000 ? formatCurrency(value) : value}
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    );
  };

  const statCards = [
    {
      title: 'Total Compromisos',
      value: totalCommitments,
      icon: <Business />,
      color: 'primary',
      trend: 12.5
    },
    {
      title: 'Pendientes',
      value: pendingCommitments,
      icon: <Warning />,
      color: 'warning',
      trend: -8.2
    },
    {
      title: 'Vencidos',
      value: overDueCommitments,
      icon: <Warning />,
      color: 'error',
      trend: -15.3
    },
    {
      title: 'Completados',
      value: completedCommitments,
      icon: <CheckCircle />,
      color: 'success',
      trend: 23.7
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Mostrar indicador de carga */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress size={40} color="primary" />
            <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>
              Cargando estadísticas...
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 4,
              '& .MuiAlert-icon': { fontSize: 24 }
            }}
          >
            Error al cargar las estadísticas: {error}
          </Alert>
        </motion.div>
      )}

      {/* Contenido principal - solo se muestra si no hay loading ni error */}
      {!loading && !error && (
        <>
          {/* Header Premium */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box mb={4}>
              <Typography 
                variant="h4" 
                component="h2" 
                sx={{ 
                  fontWeight: 800,
                  background: gradients.primary,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Dashboard Financiero DR Group
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Resumen ejecutivo de compromisos y métricas financieras en tiempo real
              </Typography>
            </Box>
          </motion.div>

          {/* Tarjetas de estadísticas premium */}
          <Grid container spacing={3} mb={4}>
            {statCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <PremiumStatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  trend={card.trend}
                  delay={index * 0.1}
                />
              </Grid>
            ))}
          </Grid>

          {/* Resumen financiero premium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                background: gradients.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 4,
                p: 4,
                position: 'relative',
                overflow: 'hidden',
                ...shimmerEffect
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.info.main}20, ${theme.palette.info.main}10)`,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <AttachMoney sx={{ color: 'info.main', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Resumen Financiero
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progreso de pagos y montos pendientes
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Comprometido
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 800,
                          color: 'info.main',
                          fontFamily: 'monospace'
                        }}
                      >
                        {formatCurrency(totalAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Pagado
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 800,
                          color: 'success.main',
                          fontFamily: 'monospace'
                        }}
                      >
                        {formatCurrency(paidAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Pendiente
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 800,
                          color: 'warning.main',
                          fontFamily: 'monospace'
                        }}
                      >
                        {formatCurrency(pendingAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Barra de progreso premium */}
                <Box mt={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      Progreso de Pagos
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight={700}>
                      {paymentProgress.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={paymentProgress}
                    color="success"
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`
                      }
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Alertas importantes */}
          {(overDueCommitments > 0 || pendingCommitments > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Paper
                elevation={0}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.light}10)`,
                  border: `1px solid ${theme.palette.warning.main}30`,
                  borderRadius: 4,
                  p: 3,
                  mt: 3
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Warning color="warning" />
                  <Typography variant="h6" color="warning.main" fontWeight={700}>
                    Alertas Importantes
                  </Typography>
                </Box>
                
                <Box display="flex" gap={2} flexWrap="wrap">
                  {overDueCommitments > 0 && (
                    <Chip
                      icon={<Warning />}
                      label={`${overDueCommitments} compromisos vencidos`}
                      color="error"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />
                  )}
                  
                  {pendingCommitments > 0 && (
                    <Chip
                      icon={<Notifications />}
                      label={`${pendingCommitments} compromisos pendientes`}
                      color="warning"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Paper>
            </motion.div>
          )}
        </>
      )}
    </Box>
  );
};

export default DashboardStats;
