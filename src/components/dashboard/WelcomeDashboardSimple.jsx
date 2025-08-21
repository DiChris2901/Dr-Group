import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  useTheme,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  AttachMoney,
  Business as BusinessIcon,
  Add,
  Notifications,
  Assessment,
  AccountBalance,
  AccessTime,
  Person,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useFirestore } from '../../hooks/useFirestore';
import { fCurrency } from '../../utils/formatNumber';
import { useNavigate } from 'react-router-dom';

const WelcomeDashboardSimple = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const stats = useDashboardStats();
  const [currentTime] = useState(new Date().getHours());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Actualizar timestamp cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000); // Actualiza cada minuto

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

  const getGreeting = () => {
    if (currentTime < 12) return 'Buenos días';
    if (currentTime < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Centro de Comando Empresarial - 7 categorías profesionales
  const quickActions = [
    {
      title: 'Análisis Inteligente',
      description: 'Reportes automáticos y proyecciones financieras',
      icon: Assessment,
      color: 'primary.main',
      action: () => navigate('/reports'),
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      category: 'analytics'
    },
    {
      title: 'Dashboard Ejecutivo',
      description: 'KPIs y métricas de rendimiento empresarial',
      icon: TrendingUp,
      color: 'success.main',
      action: () => navigate('/reports/executive'),
      gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
      category: 'reports'
    },
    {
      title: 'Herramientas Avanzadas',
      description: 'Búsqueda inteligente y exportación de datos',
      icon: BusinessIcon,
      color: 'info.main',
      action: () => navigate('/tools'),
      gradient: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
      category: 'tools'
    },
    {
      title: 'Acceso Rápido',
      description: 'Nuevo compromiso, pagos y gestión empresas',
      icon: Add,
      color: 'secondary.main',
      action: () => navigate('/commitments'),
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
      category: 'quickAccess'
    },
    {
      title: 'KPIs Financieros',
      description: 'Indicadores clave y métricas de gestión',
      icon: AttachMoney,
      color: 'primary.dark',
      action: () => navigate('/kpis'),
      gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      category: 'kpis'
    }
  ];

  // Estadísticas rápidas con datos reales de Firebase
  const quickStats = [
    {
      title: 'Compromisos Activos',
      value: stats?.loading ? '...' : (stats?.activeCommitments || '0'),
      icon: AccountBalance,
      color: '#2196f3',
      trend: stats?.activeCommitments > 0 ? `${stats.activeCommitments} activos de ${stats.totalCommitments} total` : 'Sin compromisos activos'
    },
    {
      title: 'Pendientes de Pago',
      value: stats?.loading ? '...' : fCurrency(stats?.pendingAmount || 0),
      icon: AttachMoney,
      color: '#ff9800',
      trend: stats?.pendingCommitments > 0 ? `${stats.pendingCommitments} compromisos` : 'Al día'
    },
    {
      title: 'Empresas Activas',
      value: stats?.loading ? '...' : (stats?.totalCompanies || '0'),
      icon: BusinessIcon,
      color: '#4caf50',
      trend: stats?.totalCompanies > 0 ? 'Activo' : 'Inactivo'
    },
    {
      title: 'Alertas Críticas',
      value: stats?.loading ? '...' : (stats?.overDueCommitments || '0'),
      icon: Warning,
      color: '#f44336',
      trend: stats?.overDueCommitments > 0 ? '¡Revisar!' : 'Sin alertas'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* 🎨 Header sobrio empresarial */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          p: 3,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  mb: 0.5,
                  color: 'white',
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' }
                }}
              >
                📊 {getGreeting()}, {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.85)',
                  mb: 0
                }}
              >
                Centro de Comando Empresarial • Gestión financiera inteligente
              </Typography>
            </Box>
            
            {/* Botón sobrio con estado en tiempo real */}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={stats?.loading}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 1,
                fontWeight: 500,
                px: 2.5,
                py: 1,
                color: 'white',
                textTransform: 'none',
                fontSize: '0.875rem',
                minHeight: 'auto',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
            >
              {stats?.loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Box>
        </Box>
      </motion.div>

        {/* Estadísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card sx={{
                  background: theme.palette.mode === 'dark' 
                    ? theme.palette.background.paper
                    : '#ffffff',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 25px rgba(0, 0, 0, 0.4)'
                      : '0 8px 25px rgba(0, 0, 0, 0.12)',
                    borderColor: alpha(theme.palette.primary.main, 0.8)
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                          {stats?.loading ? (
                            <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
                          ) : stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        background: alpha(theme.palette.primary.main, 0.1), 
                        borderRadius: 2, 
                        p: 1.5,
                        color: theme.palette.primary.main
                      }}>
                        <stat.icon />
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={stat.trend} 
                        size="small" 
                        color={stat.trend.includes('+') ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Centro de Comando Empresarial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Centro de Comando Empresarial
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              Acceso directo a todas las funcionalidades profesionales del sistema
            </Typography>

            <Grid container spacing={3}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      onClick={action.action}
                      sx={{
                        background: theme.palette.mode === 'dark' 
                          ? theme.palette.background.paper
                          : '#ffffff',
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                          : '0 4px 20px rgba(0, 0, 0, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 25px rgba(0, 0, 0, 0.4)'
                            : '0 8px 25px rgba(0, 0, 0, 0.12)',
                          borderColor: alpha(theme.palette.primary.main, 0.8),
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <CardContent sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        <Box sx={{ 
                          background: alpha(theme.palette.primary.main, 0.1), 
                          borderRadius: 2, 
                          p: 2, 
                          mb: 2,
                          color: theme.palette.primary.main
                        }}>
                          <action.icon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: theme.palette.text.primary }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary, 
                          lineHeight: 1.4,
                          fontSize: '0.875rem'
                        }}>
                          {action.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default WelcomeDashboardSimple;
