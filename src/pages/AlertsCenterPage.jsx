import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Alert,
  Badge,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  NotificationsActive,
  NotificationsOff,
  Schedule,
  AttachMoney,
  Business,
  Assessment,
  Delete,
  Add,
  FilterList,
  Refresh,
  Settings,
  PriorityHigh,
  Visibility,
  VisibilityOff,
  Person
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAlertsCenter } from '../hooks/useAlertsCenter';
import { useDashboardStats } from '../hooks/useDashboardStats';

// Componente de tarjeta de alerta
const AlertCard = ({ alert, onDismiss, onToggleStatus, onClick, delay = 0 }) => {
  const theme = useTheme();
  
  const getSeverityConfig = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          color: '#f44336',
          bg: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
          icon: <Error />,
          label: 'Crítico'
        };
      case 'warning':
        return {
          color: '#ff9800',
          bg: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
          icon: <Warning />,
          label: 'Advertencia'
        };
      case 'info':
        return {
          color: '#2196f3',
          bg: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
          icon: <Info />,
          label: 'Información'
        };
      default:
        return {
          color: '#4caf50',
          bg: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
          icon: <CheckCircle />,
          label: 'Éxito'
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card
        onClick={() => onClick && onClick(alert)}
        sx={{
          mb: 2,
          cursor: 'pointer',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${config.color}`,
          boxShadow: `0 8px 32px ${config.color}33`,
          opacity: alert.status === 'dismissed' ? 0.6 : 1,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 40px ${config.color}44`,
          },
          transition: 'all 0.3s ease'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
              <Box
                sx={{
                  background: config.bg,
                  borderRadius: '50%',
                  p: 1,
                  mr: 2,
                  color: 'white'
                }}
              >
                {config.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {alert.title}
                  </Typography>
                  <Chip 
                    label={config.label} 
                    size="small" 
                    sx={{ 
                      background: config.bg,
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                  {alert.priority === 'high' && (
                    <Chip 
                      icon={<PriorityHigh />}
                      label="Alta Prioridad" 
                      size="small" 
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {alert.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    📅 {alert.timestamp}
                  </Typography>
                  {alert.category && (
                    <Chip label={alert.category} size="small" variant="outlined" />
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Tooltip title={alert.status === 'active' ? 'Marcar como vista' : 'Marcar como activa'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleStatus(alert.id)}
                  color={alert.status === 'active' ? 'primary' : 'default'}
                >
                  {alert.status === 'active' ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar alerta">
                <IconButton
                  size="small"
                  onClick={() => onDismiss(alert.id)}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de estadísticas de alertas
const AlertsStats = ({ alerts, onRefresh, refreshing }) => {
  const theme = useTheme();
  
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    active: alerts.filter(a => a.status === 'active').length,
    dismissed: alerts.filter(a => a.status === 'dismissed').length
  };

  const statCards = [
    {
      title: 'Total de Alertas',
      value: stats.total,
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Críticas',
      value: stats.critical,
      color: 'error',
      gradient: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)'
    },
    {
      title: 'Advertencias',
      value: stats.warning,
      color: 'warning',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'
    },
    {
      title: 'Activas',
      value: stats.active,
      color: 'success',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Resumen de Alertas
        </Typography>
        <Tooltip title="Actualizar alertas">
          <IconButton 
            onClick={onRefresh}
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
      
      <Grid container spacing={2}>
        {statCards.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  textAlign: 'center',
                  p: 2,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
                }}
              >
                <Typography variant="h4" fontWeight="bold">
                  {stat.value}
                </Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  {stat.title}
                </Typography>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const AlertsCenterPage = () => {
  const theme = useTheme();
  const { stats } = useDashboardStats();
  const {
    // alerts, // Comentado temporalmente para evitar conflicto
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    unreadCount,
    totalCount,
    alertsConfig,
    loading: alertsLoading,
    error: alertsError,
    markAsRead,
    markAllAsRead
  } = useAlertsCenter();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [newAlertDialog, setNewAlertDialog] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: 'Compromiso Crítico Vencido',
      description: 'ABC Corp tiene un pago vencido de $25,000 desde hace 5 días. Requiere atención inmediata.',
      severity: 'critical',
      status: 'active',
      priority: 'high',
      category: 'Pagos',
      timestamp: 'Hace 2 horas',
      type: 'payment',
      sender: 'Sistema Financiero'
    },
    {
      id: 2,
      title: 'Múltiples Vencimientos Próximos',
      description: '7 compromisos vencen en los próximos 3 días por un total de $45,000.',
      severity: 'warning',
      status: 'active',
      priority: 'medium',
      category: 'Vencimientos',
      timestamp: 'Hace 4 horas',
      type: 'commitment',
      sender: 'Gestor de Compromisos'
    },
    {
      id: 3,
      title: 'Nueva Empresa Registrada',
      description: 'Tech Solutions se ha registrado exitosamente en el sistema.',
      severity: 'info',
      status: 'dismissed',
      priority: 'low',
      category: 'Sistema',
      timestamp: 'Hace 1 día',
      type: 'company',
      sender: 'Admin Principal'
    },
    {
      id: 4,
      title: 'Límite de Storage Alcanzado',
      description: 'El uso de almacenamiento ha alcanzado el 85% de la capacidad total.',
      severity: 'warning',
      status: 'active',
      priority: 'medium',
      category: 'Sistema',
      timestamp: 'Hace 6 horas',
      type: 'system',
      sender: 'Monitor de Sistema'
    },
    {
      id: 5,
      title: 'Reporte Mensual Generado',
      description: 'El reporte financiero de julio 2025 ha sido generado correctamente.',
      severity: 'success',
      status: 'dismissed',
      priority: 'low',
      category: 'Reportes',
      timestamp: 'Hace 2 días',
      type: 'report',
      sender: 'Sistema de Reportes'
    }
  ]);

  const handleDismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleToggleAlertStatus = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: alert.status === 'active' ? 'dismissed' : 'active' }
        : alert
    ));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (currentTab) {
      case 1: return alert.status === 'active';
      case 2: return alert.severity === 'critical' || alert.severity === 'warning';
      case 3: return alert.status === 'dismissed';
      default: return true;
    }
  });

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
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
              background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              Centro de Alertas
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestión centralizada de notificaciones y alertas críticas del sistema
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={alertsEnabled} 
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                  color="error"
                />
              }
              label="Alertas Activas"
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setNewAlertDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                }
              }}
            >
              Nueva Alerta
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Estadísticas */}
      <AlertsStats 
        alerts={alerts} 
        onRefresh={handleRefresh} 
        refreshing={refreshing} 
      />

      {/* Tabs de filtrado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card sx={{ mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<Badge badgeContent={alerts.length} color="primary"><NotificationsActive /></Badge>}
              label="Todas"
            />
            <Tab 
              icon={<Badge badgeContent={alerts.filter(a => a.status === 'active').length} color="error"><Warning /></Badge>}
              label="Activas"
            />
            <Tab 
              icon={<Badge badgeContent={alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length} color="warning"><PriorityHigh /></Badge>}
              label="Críticas"
            />
            <Tab 
              icon={<Badge badgeContent={alerts.filter(a => a.status === 'dismissed').length} color="success"><CheckCircle /></Badge>}
              label="Resueltas"
            />
          </Tabs>
        </Card>
      </motion.div>

      {/* Lista de alertas */}
      <AnimatePresence>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={handleDismissAlert}
              onToggleStatus={handleToggleAlertStatus}
              onClick={handleAlertClick}
              delay={index * 0.1}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6">No hay alertas en esta categoría</Typography>
              <Typography>Todas las alertas están gestionadas correctamente</Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog de Detalle de Alerta */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
              : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
          }
        }}
      >
        {selectedAlert && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight="bold">
                  {selectedAlert.title}
                </Typography>
                <Chip 
                  label={selectedAlert.severity === 'critical' ? 'Crítico' : 
                         selectedAlert.severity === 'warning' ? 'Advertencia' : 
                         selectedAlert.severity === 'info' ? 'Info' : 'Éxito'} 
                  size="small" 
                  color={selectedAlert.severity === 'critical' ? 'error' : 
                         selectedAlert.severity === 'warning' ? 'warning' : 
                         selectedAlert.severity === 'info' ? 'info' : 'success'}
                  variant="outlined"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Descripción
                  </Typography>
                  <Typography variant="body1">
                    {selectedAlert.description}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Categoría
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip label={selectedAlert.category} size="small" />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Prioridad
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {selectedAlert.priority === 'high' && <PriorityHigh color="error" fontSize="small" />}
                      <Typography variant="body2" fontWeight={500}>
                        {selectedAlert.priority === 'high' ? 'Alta' : 
                         selectedAlert.priority === 'medium' ? 'Media' : 'Baja'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Fecha
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2">
                        {selectedAlert.timestamp}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estado
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {selectedAlert.status === 'active' ? 
                        <Visibility color="primary" fontSize="small" /> : 
                        <VisibilityOff color="action" fontSize="small" />
                      }
                      <Typography variant="body2">
                        {selectedAlert.status === 'active' ? 'Activa' : 'Resuelta'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Campo Enviado por */}
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Enviado por
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedAlert.sender || 'Sistema Automático'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
              <Button 
                variant="contained" 
                color={selectedAlert.status === 'active' ? 'primary' : 'inherit'}
                onClick={() => {
                  handleToggleAlertStatus(selectedAlert.id);
                  setDetailDialogOpen(false);
                }}
              >
                {selectedAlert.status === 'active' ? 'Marcar como Resuelta' : 'Reactivar Alerta'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog para nueva alerta */}
      <Dialog open={newAlertDialog} onClose={() => setNewAlertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nueva Alerta</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Funcionalidad en desarrollo. Próximamente podrás crear alertas personalizadas.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewAlertDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsCenterPage;
