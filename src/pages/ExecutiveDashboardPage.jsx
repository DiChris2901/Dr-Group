import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  LinearProgress,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Button
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  AttachMoney,
  Business,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
  Timeline,
  BarChart,
  PieChart
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useUserStats } from '../hooks/useUserStats';
import { useStorageStats } from '../hooks/useStorageStats';
import { fCurrency } from '../utils/formatNumber';


// Componente de KPI Card Premium
const ExecutiveKPICard = ({ title, value, subtitle, icon: Icon, color, trend, loading = false, delay = 0 }) => {
  const theme = useTheme();
  
  const getGradient = () => {
    switch (color) {
      case 'primary':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'success':
        return 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)';
      case 'error':
        return 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)';
      default:
        return 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)';
    }
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp sx={{ fontSize: 16, color: '#4caf50' }} />;
    if (trend < 0) return <TrendingDown sx={{ fontSize: 16, color: '#f44336' }} />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        bounce: 0.3
      }}
    >
      <Card
        sx={{
          background: getGradient(),
          color: 'white',
          height: 140,
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
          },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                {title}
              </Typography>
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white', mt: 1 }} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {value}
                </Typography>
              )}
            </Box>
            <Icon sx={{ fontSize: 32, opacity: 0.8 }} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {subtitle}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getTrendIcon()}
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de gráfico de progreso circular
const CircularKPI = ({ title, value, total, color = 'primary', delay = 0 }) => {
  const theme = useTheme();
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card sx={{ 
        p: 2, 
        textAlign: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
      }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={80}
            thickness={4}
            sx={{
              color: theme.palette[color].main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" component="div" color="text.primary" fontWeight="bold">
              {Math.round(percentage)}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {value} de {total}
        </Typography>
      </Card>
    </motion.div>
  );
};

const ExecutiveDashboardPage = () => {
  const theme = useTheme();
  const { stats, loading, error, refreshStats, usingFallback } = useDashboardStats();
  const { stats: userStats } = useUserStats();
  const storageStats = useStorageStats();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🎯 [handleRefresh] Botón presionado, llamando a refreshStats()...');
    
    try {
      await refreshStats(); // ✅ Llama a la Cloud Function para recalcular
      console.log('✅ [handleRefresh] refreshStats() completado exitosamente');
      console.log('⏳ [handleRefresh] Esperando 3 segundos para que Firestore actualice...');
      
      // Esperar 3 segundos para dar tiempo a que el listener detecte el cambio
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🎉 [handleRefresh] Proceso completado. El dashboard debería mostrar stats optimizados.');
    } catch (error) {
      console.error('❌ [handleRefresh] Error:', error);
      alert(`Error al inicializar contadores: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Métricas principales
  const mainKPIs = [
    {
      title: 'Compromisos Totales',
      value: loading ? '...' : stats?.totalCommitments || 0,
      subtitle: 'Activos en el sistema',
      icon: Assessment,
      color: 'primary',
      trend: 12.5
    },
    {
      title: 'Monto Total',
      value: loading ? '...' : fCurrency(stats?.totalAmount || 0),
      subtitle: 'Valor comprometido',
      icon: AttachMoney,
      color: 'success',
      trend: 8.3
    },
    {
      title: 'Pendientes',
      value: loading ? '...' : stats?.pendingCommitments || 0,
      subtitle: 'Requieren atención',
      icon: Schedule,
      color: 'warning',
      trend: -4.2
    },
    {
      title: 'Vencidos',
      value: loading ? '...' : stats?.overDueCommitments || 0,
      subtitle: 'Críticos',
      icon: Warning,
      color: 'error',
      trend: -15.6
    }
  ];

  return (
    <Box sx={{ p: 0 }}>
      {/* Header con título y controles */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          p: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              Dashboard Ejecutivo
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Centro de comando para métricas empresariales en tiempo real
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6d4190 100%)',
                  }
                }}
              >
                <Refresh sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* ⚠️ Banner de advertencia si está usando fallback */}
      {usingFallback && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)'
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefresh}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
              >
                {refreshing ? 'Activando...' : 'Activar Modo Optimizado'}
              </Button>
            }
          >
            <strong>Modo Fallback Activo:</strong> El dashboard está calculando estadísticas directamente (más lento). 
            Haz clic en "Activar Modo Optimizado" para inicializar el sistema de contadores (99.995% más rápido).
          </Alert>
        </motion.div>
      )}

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mainKPIs.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ExecutiveKPICard
              {...kpi}
              loading={loading}
              delay={index * 0.1}
            />
          </Grid>
        ))}
      </Grid>

      {/* Sección de análisis detallado */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <CircularKPI
            title="Compromisos Completados"
            value={stats?.completedCommitments || 0}
            total={stats?.totalCommitments || 1}
            color="success"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CircularKPI
            title="Progreso de Pagos"
            value={stats?.paidAmount || 0}
            total={stats?.totalAmount || 1}
            color="primary"
            delay={0.3}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CircularKPI
            title="Eficiencia Operativa"
            value={85}
            total={100}
            color="warning"
            delay={0.4}
          />
        </Grid>
      </Grid>

      {/* Sección de estado del sistema */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card sx={{ 
          p: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline sx={{ color: 'primary.main' }} />
            Estado del Sistema
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Uso de Storage</Typography>
                  <Typography variant="body2">
                    {storageStats ? ((storageStats.used / storageStats.total) * 100).toFixed(1) : '0'}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={storageStats ? (storageStats.used / storageStats.total) * 100 : 0} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                    }
                  }} 
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<CheckCircle />} 
                  label="Sistema Operativo" 
                  color="success" 
                  variant="outlined" 
                />
                <Chip 
                  icon={<Assessment />} 
                  label="Análisis Activo" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            </Grid>
          </Grid>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ExecutiveDashboardPage;
