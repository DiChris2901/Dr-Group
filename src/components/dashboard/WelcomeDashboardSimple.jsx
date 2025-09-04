import React, { useState, useEffect, useCallback } from 'react';
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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  AttachMoney,
  Business as BusinessIcon,
  AccountBalance,
  Person,
  Refresh
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useFirestore } from '../../hooks/useFirestore';
import { useCommitments } from '../../hooks/useFirestore';
import { fCurrency } from '../../utils/formatNumber';
import { useNavigate } from 'react-router-dom';
import DashboardCalendar from './DashboardCalendar';

const WelcomeDashboardSimple = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const stats = useDashboardStats();
  const { commitments } = useCommitments();
  const [currentTime] = useState(new Date().getHours());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  // Obtener compromisos vencidos - Usando la misma lógica que useDashboardStats
  const getOverdueCommitments = useCallback(() => {
    if (!commitments || commitments.length === 0) return [];
    
    const now = new Date();
    return commitments.filter(commitment => {
      const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      
      // Verificar si está vencido
      const isOverdue = dueDate && dueDate < now;
      
      // Verificar múltiples formas de identificar un compromiso PAGADO (misma lógica que useDashboardStats)
      const isPaid = commitment.status === 'completed' || 
                    commitment.status === 'paid' || 
                    commitment.status === 'Pagado' ||
                    commitment.status === 'pagado' ||
                    commitment.status === 'PAGADO' ||
                    commitment.paid === true ||
                    commitment.isPaid === true ||
                    commitment.paymentStatus === 'paid' ||
                    commitment.paymentStatus === 'Pagado' ||
                    commitment.paymentStatus === 'pagado' ||
                    commitment.completed === true;
      
      // Solo mostrar compromisos vencidos Y no pagados
      return isOverdue && !isPaid;
    }).map(commitment => ({
      ...commitment,
      dueDate: commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate)
    })).sort((a, b) => a.dueDate - b.dueDate); // Ordenar por fecha de vencimiento
  }, [commitments]);

  const overdueCommitments = getOverdueCommitments();

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
      trend: stats?.overDueCommitments > 0 ? '¡Revisar!' : 'Sin alertas',
      onClick: () => setAlertsModalOpen(true),
      isAlert: true
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
                  transition: 'all 0.3s ease',
                  cursor: stat.onClick ? 'pointer' : 'default'
                }}
                onClick={stat.onClick}
                >
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

        {/* Calendario de Compromisos y Festivos */}
        <Box sx={{ mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <DashboardCalendar />
          </motion.div>
        </Box>


      </Box>

      {/* Modal de Alertas Críticas - Diseño Sobrio */}
      <Dialog
        open={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          pt: 3,
          px: 3,
          background: 'transparent',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Warning sx={{ color: 'error.main', fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ 
              color: 'text.secondary',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              mb: 0.5
            }}>
              ESTADO CRÍTICO
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Compromisos Vencidos
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {overdueCommitments.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1.5 }} />
              <Typography variant="subtitle1" color="success.main" sx={{ fontWeight: 600 }}>
                ¡No hay compromisos vencidos!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Todos los compromisos están al día
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {overdueCommitments.map((commitment, index) => (
                <React.Fragment key={commitment.id}>
                  <Box sx={{ 
                    p: 1.5,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.error.main, 0.04),
                    mb: index < overdueCommitments.length - 1 ? 1.5 : 0
                  }}>
                    {/* Header compacto */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        flex: 1,
                        mr: 2
                      }}>
                        {commitment.concept || commitment.description || commitment.title || commitment.name || 'Compromiso sin descripción'}
                      </Typography>
                      <Chip 
                        label={fCurrency(commitment.amount || 0)}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.error.main, 0.08),
                          color: 'error.main',
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    
                    {/* Información compacta */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: 1,
                      fontSize: '0.8rem'
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 500
                        }}>
                          EMPRESA
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'text.primary',
                          mt: 0.25
                        }}>
                          {commitment.companyName || commitment.company || 'No especificada'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: 500
                        }}>
                          VENCIDO
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'error.main',
                          mt: 0.25
                        }}>
                          {Math.floor((new Date() - commitment.dueDate) / (1000 * 60 * 60 * 24))} días
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Fecha de vencimiento */}
                    <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                      <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.7rem'
                      }}>
                        Fecha límite: {commitment.dueDate.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2, 
          gap: 1.5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          backgroundColor: alpha(theme.palette.background.default, 0.5)
        }}>
          <Button
            onClick={() => {
              setAlertsModalOpen(false);
              navigate('/commitments');
            }}
            variant="contained"
            disabled={overdueCommitments.length === 0}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1,
              px: 3
            }}
          >
            Gestionar Compromisos
          </Button>
          <Button
            onClick={() => setAlertsModalOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 1,
              px: 3,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.4),
                backgroundColor: alpha(theme.palette.primary.main, 0.04)
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default WelcomeDashboardSimple;
