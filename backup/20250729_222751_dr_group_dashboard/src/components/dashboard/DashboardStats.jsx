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
  Alert
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
import { AnalyticsWidgetSummary } from '../charts';

const DashboardStats = ({ stats = {} }) => {
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

  const statCards = [
    {
      title: 'Total Compromisos',
      value: totalCommitments,
      icon: <Business fontSize="large" />,
      color: 'primary',
      percent: 12.5, // Ejemplo de tendencia
      chart: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        series: [20, 25, 15, 30, 35, totalCommitments]
      }
    },
    {
      title: 'Pendientes',
      value: pendingCommitments,
      icon: <Warning fontSize="large" />,
      color: 'warning',
      percent: -8.2,
      chart: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        series: [15, 18, 12, 20, 22, pendingCommitments]
      }
    },
    {
      title: 'Vencidos',
      value: overDueCommitments,
      icon: <Warning fontSize="large" />,
      color: 'error',
      percent: -15.3,
      chart: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        series: [8, 12, 6, 10, 14, overDueCommitments]
      }
    },
    {
      title: 'Completados',
      value: totalCommitments - pendingCommitments - overDueCommitments,
      icon: <CheckCircle fontSize="large" />,
      color: 'success',
      percent: 23.7,
      chart: {
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        series: [5, 8, 12, 18, 22, totalCommitments - pendingCommitments - overDueCommitments]
      }
    }
  ];

  return (
    <Box>
      {/* Mostrar indicador de carga */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando estadísticas...
          </Typography>
        </Box>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar las estadísticas: {error}
        </Alert>
      )}

      {/* Contenido principal - solo se muestra si no hay loading ni error */}
      {!loading && !error && (
        <>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Dashboard Financiero DR Group
          </Typography>

      {/* Tarjetas de estadísticas profesionales */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <AnalyticsWidgetSummary
                title={card.title}
                total={card.value}
                percent={card.percent}
                color={card.color}
                icon={card.icon}
                chart={card.chart}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Resumen financiero */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Resumen Financiero
                </Typography>
                
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Progreso de Pagos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(paymentProgress)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={paymentProgress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Total Comprometido:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="success.main">Pagado:</Typography>
                    <Typography variant="body1" color="success.main" sx={{ fontWeight: 600 }}>
                      {formatCurrency(paidAmount)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="warning.main">Pendiente:</Typography>
                    <Typography variant="body1" color="warning.main" sx={{ fontWeight: 600 }}>
                      {formatCurrency(pendingAmount)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Alertas Importantes
                </Typography>
                
                {overDueCommitments > 0 && (
                  <Chip
                    icon={<Warning />}
                    label={`${overDueCommitments} compromisos vencidos`}
                    color="error"
                    variant="outlined"
                    sx={{ mb: 1, mr: 1 }}
                  />
                )}
                
                {pendingCommitments > 0 && (
                  <Chip
                    icon={<Notifications />}
                    label={`${pendingCommitments} compromisos pendientes`}
                    color="warning"
                    variant="outlined"
                    sx={{ mb: 1, mr: 1 }}
                  />
                )}

                {overDueCommitments === 0 && pendingCommitments === 0 && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle color="success" />
                    <Typography variant="body2" color="success.main">
                      ¡Todos los compromisos están al día!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Botón flotante para agregar compromiso */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={() => {
          // TODO: Abrir modal para agregar compromiso
          console.log('Agregar nuevo compromiso');
        }}
      >
        <Add />
      </Fab>
        </>
      )}
    </Box>
  );
};

export default DashboardStats;
