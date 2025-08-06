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
  Tooltip
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
import { useStorageStats } from '../../hooks/useStorageStats';
import { useFirestore } from '../../hooks/useFirestore';
import { fCurrency } from '../../utils/formatNumber';
import DashboardHeader from './DashboardHeader';
import { useNavigate } from 'react-router-dom';

const WelcomeDashboardSimple = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const stats = useDashboardStats();
  const storageStats = useStorageStats();
  const [currentTime] = useState(new Date().getHours());

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
      title: 'Monitoreo Tiempo Real',
      description: 'Seguimiento activo de compromisos críticos',
      icon: Notifications,
      color: 'warning.main',
      action: () => navigate('/monitoring'),
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
      category: 'monitoring'
    },
    {
      title: 'Centro de Alertas',
      description: 'Notificaciones y compromisos próximos a vencer',
      icon: Warning,
      color: 'error.main',
      action: () => navigate('/alerts'),
      gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
      category: 'alerts'
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

  // Estadísticas rápidas
  const quickStats = [
    {
      title: 'Compromisos Activos',
      value: stats?.totalCommitments || '0',
      icon: AccountBalance,
      color: '#2196f3',
      trend: '+12%'
    },
    {
      title: 'Pendientes de Pago',
      value: fCurrency(stats?.pendingAmount || 0),
      icon: AttachMoney,
      color: '#ff9800',
      trend: '-5%'
    },
    {
      title: 'Empresas Activas',
      value: stats?.totalCompanies || '0',
      icon: BusinessIcon,
      color: '#4caf50',
      trend: '+8%'
    },
    {
      title: 'Alertas Críticas',
      value: stats?.criticalAlerts || '0',
      icon: Warning,
      color: '#f44336',
      trend: '-15%'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header del Dashboard */}
      <DashboardHeader />

      <Box sx={{ p: 3 }}>
        {/* Saludo personalizado */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
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
            <Avatar sx={{ 
              mr: 2, 
              width: 56, 
              height: 56,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <Person />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {getGreeting()}, {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Bienvenido al Centro de Comando Empresarial
              </Typography>
            </Box>
            <Tooltip title="Actualizar datos">
              <IconButton sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6d4190 100%)',
                }
              }}>
                <Refresh />
              </IconButton>
            </Tooltip>
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
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        background: `${stat.color}20`, 
                        borderRadius: '50%', 
                        p: 1.5,
                        color: stat.color
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
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
                        background: action.gradient,
                        color: 'white',
                        cursor: 'pointer',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s',
                        },
                        '&:hover::before': {
                          left: '100%',
                        }
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
                          background: 'rgba(255,255,255,0.2)', 
                          borderRadius: '50%', 
                          p: 2, 
                          mb: 2,
                          backdropFilter: 'blur(10px)'
                        }}>
                          <action.icon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
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

        {/* Estado del sistema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card sx={{
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Estado del Sistema
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Uso de Almacenamiento</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {storageStats?.used ? `${Math.round((storageStats.used / storageStats.total) * 100)}%` : '0%'}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={storageStats?.used ? (storageStats.used / storageStats.total) * 100 : 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Última actualización
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {new Date().toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Chip 
                      icon={<CheckCircle />}
                      label="Sistema Operativo" 
                      color="success" 
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default WelcomeDashboardSimple;
