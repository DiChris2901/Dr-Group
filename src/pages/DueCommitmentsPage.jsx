import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  AlertTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Warning,
  Schedule,
  Assignment,
  Business,
  AttachMoney,
  Visibility,
  Edit,
  Delete,
  CalendarToday,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  NotificationImportant,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks y Context
import { useAuth } from '../context/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useSettings } from '../context/SettingsContext';

// Design System v2.1 utilities
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../utils/designSystem.js';

// Styled components para animaciones CSS
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Box)(({ theme }) => ({
  '@keyframes shimmer': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' }
  },
  '@keyframes pulse': {
    '0%, 100%': { 
      boxShadow: `0 0 0 0 ${theme.palette.error.main}40` 
    },
    '50%': { 
      boxShadow: `0 0 0 10px ${theme.palette.error.main}00` 
    }
  }
}));

const DueCommitmentsPage = () => {
  const theme = useTheme();
  const gradients = useThemeGradients();
  const { settings } = useSettings();
  const { userProfile } = useAuth();
  const { stats, loading, error, refetch } = useDashboardStats();

  const [commitments, setCommitments] = useState([]);
  const [filteredCommitments, setFilteredCommitments] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data para demostración (en producción vendría de Firebase)
  const mockCommitments = [
    {
      id: 1,
      title: 'Pago de Nómina Ejecutivos',
      company: 'DR Group Holdings',
      amount: 2850000,
      dueDate: new Date('2025-08-03'),
      priority: 'high',
      status: 'overdue',
      description: 'Pago quincenal nómina ejecutiva'
    },
    {
      id: 2,
      title: 'Cuota Préstamo Bancario',
      company: 'DR Construction',
      amount: 12500000,
      dueDate: new Date('2025-08-05'),
      priority: 'critical',
      status: 'due_soon',
      description: 'Cuota mensual préstamo desarrollo inmobiliario'
    },
    {
      id: 3,
      title: 'Servicios Públicos',
      company: 'DR Logistics',
      amount: 890000,
      dueDate: new Date('2025-08-07'),
      priority: 'medium',
      status: 'upcoming',
      description: 'Facturación servicios públicos bodegas'
    },
    {
      id: 4,
      title: 'Seguros Empresariales',
      company: 'DR Tech Solutions',
      amount: 1750000,
      dueDate: new Date('2025-08-02'),
      priority: 'high',
      status: 'overdue',
      description: 'Renovación pólizas seguros empresariales'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setCommitments(mockCommitments);
    setFilteredCommitments(mockCommitments);
  }, []);

  useEffect(() => {
    // Filtrar compromisos según prioridad
    if (priorityFilter === 'all') {
      setFilteredCommitments(commitments);
    } else {
      setFilteredCommitments(commitments.filter(c => c.priority === priorityFilter));
    }
  }, [priorityFilter, commitments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (refetch) refetch();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return theme.palette.error.main;
      case 'due_soon': return theme.palette.warning.main;
      case 'upcoming': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'overdue': return 'Vencido';
      case 'due_soon': return 'Próximo a vencer';
      case 'upcoming': return 'Por vencer';
      default: return 'Al día';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    return differenceInDays(dueDate, new Date());
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const overdueCounts = {
    total: commitments.length,
    overdue: commitments.filter(c => c.status === 'overdue').length,
    dueSoon: commitments.filter(c => c.status === 'due_soon').length,
    upcoming: commitments.filter(c => c.status === 'upcoming').length
  };

  const totalAmount = commitments.reduce((sum, c) => sum + c.amount, 0);
  const overdueAmount = commitments
    .filter(c => c.status === 'overdue')
    .reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <StyledContainer>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          >
            <LinearProgress 
              sx={{ 
                mb: 2, 
                borderRadius: 3,
                height: 8,
                background: gradients.paper,
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }
              }} 
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cargando compromisos próximos a vencer...
            </Typography>
          </motion.div>
        </Box>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      {/* Header Premium con micro-interacciones */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: gradients.primary,
            borderRadius: 4,
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.primary.main}30`,
            ...shimmerEffect
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.warning.main}20, ${theme.palette.error.main}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <NotificationImportant sx={{ fontSize: 28, color: theme.palette.warning.main }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 800, 
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      color: 'white'
                    }}
                  >
                    Compromisos Próximos a Vencer
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                    Gestión proactiva de vencimientos financieros
                  </Typography>
                </Box>
              </Box>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", bounce: 0.4 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    borderRadius: 3,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </motion.div>
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* Cards de Resumen con micro-interacciones */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            title: 'Total Compromisos',
            value: overdueCounts.total,
            icon: Assignment,
            color: 'info',
            gradient: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.info.light}10)`,
            iconColor: theme.palette.info.main
          },
          {
            title: 'Vencidos',
            value: overdueCounts.overdue,
            icon: Warning,
            color: 'error',
            gradient: `linear-gradient(135deg, ${theme.palette.error.main}15, ${theme.palette.error.light}10)`,
            iconColor: theme.palette.error.main
          },
          {
            title: 'Por Vencer (7 días)',
            value: overdueCounts.dueSoon,
            icon: Schedule,
            color: 'warning',
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.light}10)`,
            iconColor: theme.palette.warning.main
          },
          {
            title: 'Monto Total',
            value: formatCurrency(totalAmount),
            icon: AttachMoney,
            color: 'success',
            gradient: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.light}10)`,
            iconColor: theme.palette.success.main
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                bounce: 0.3
              }}
              whileHover={{ 
                y: -4,
                scale: 1.01,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  background: stat.gradient,
                  border: `1px solid ${stat.iconColor}30`,
                  borderRadius: 4,
                  p: 3,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...shimmerEffect,
                  '&:hover': {
                    boxShadow: `0 12px 24px ${stat.iconColor}20`,
                    border: `1px solid ${stat.iconColor}50`,
                  }
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${stat.iconColor}20, ${stat.iconColor}10)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <stat.icon sx={{ fontSize: 24, color: stat.iconColor }} />
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.9, 
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 800,
                      color: stat.iconColor,
                      mt: 0.5
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Alertas Críticas */}
      {overdueCounts.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Alert 
            severity="error" 
            icon={<Warning />}
            sx={{ 
              mb: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.error.main}10, ${theme.palette.error.light}05)`,
              border: `1px solid ${theme.palette.error.main}30`,
              '& .MuiAlert-icon': {
                animation: 'pulse 2s infinite'
              }
            }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>¡Atención Requerida!</AlertTitle>
            <Typography variant="body2">
              Tienes <strong>{overdueCounts.overdue} compromiso{overdueCounts.overdue > 1 ? 's' : ''} vencido{overdueCounts.overdue > 1 ? 's' : ''}</strong> por un monto de <strong>{formatCurrency(overdueAmount)}</strong>. Se requiere acción inmediata.
            </Typography>
          </Alert>
        </motion.div>
      )}

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            background: gradients.paper
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <FilterList sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Filtrar por prioridad:
            </Typography>
            {['all', 'critical', 'high', 'medium'].map((filter) => (
              <motion.div
                key={filter}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", bounce: 0.4 }}
              >
                <Chip
                  label={filter === 'all' ? 'Todas' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  onClick={() => setPriorityFilter(filter)}
                  color={priorityFilter === filter ? 'primary' : 'default'}
                  variant={priorityFilter === filter ? 'filled' : 'outlined'}
                  sx={{ 
                    borderRadius: 2,
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: `0 4px 12px ${theme.palette.primary.main}20`
                    }
                  }}
                />
              </motion.div>
            ))}
          </Stack>
        </Paper>
      </motion.div>

      {/* Tabla de Compromisos */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Paper 
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            background: gradients.paper
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}05)` }}>
                  {[
                    'Compromiso',
                    'Empresa', 
                    'Monto',
                    'Fecha Vencimiento',
                    'Días Restantes',
                    'Prioridad',
                    'Estado',
                    'Acciones'
                  ].map((header) => (
                    <TableCell 
                      key={header}
                      sx={{ 
                        fontWeight: 700,
                        borderBottom: 'none',
                        py: 2
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredCommitments.map((commitment, index) => (
                    <motion.tr
                      key={commitment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      style={{ cursor: 'pointer' }}
                      whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}
                    >
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}`, py: 2 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {commitment.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {commitment.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Chip
                          icon={<Business />}
                          label={commitment.company}
                          size="small"
                          sx={{ 
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {formatCurrency(commitment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {format(commitment.dueDate, 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Chip
                          label={`${getDaysUntilDue(commitment.dueDate)} días`}
                          size="small"
                          sx={{
                            borderRadius: 2,
                            backgroundColor: getDaysUntilDue(commitment.dueDate) < 0 
                              ? alpha(theme.palette.error.main, 0.1)
                              : getDaysUntilDue(commitment.dueDate) <= 7
                              ? alpha(theme.palette.warning.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                            color: getDaysUntilDue(commitment.dueDate) < 0 
                              ? theme.palette.error.main
                              : getDaysUntilDue(commitment.dueDate) <= 7
                              ? theme.palette.warning.main
                              : theme.palette.success.main
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Chip
                          label={commitment.priority.charAt(0).toUpperCase() + commitment.priority.slice(1)}
                          size="small"
                          sx={{
                            borderRadius: 2,
                            backgroundColor: alpha(getPriorityColor(commitment.priority), 0.1),
                            color: getPriorityColor(commitment.priority),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Chip
                          label={getStatusLabel(commitment.status)}
                          size="small"
                          sx={{
                            borderRadius: 2,
                            backgroundColor: alpha(getStatusColor(commitment.status), 0.1),
                            color: getStatusColor(commitment.status),
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Stack direction="row" spacing={1}>
                          {[
                            { icon: Visibility, tooltip: 'Ver detalles', color: theme.palette.info.main },
                            { icon: Edit, tooltip: 'Editar', color: theme.palette.warning.main },
                            { icon: Delete, tooltip: 'Eliminar', color: theme.palette.error.main }
                          ].map((action, actionIndex) => (
                            <motion.div
                              key={actionIndex}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ type: "spring", bounce: 0.4 }}
                            >
                              <Tooltip title={action.tooltip}>
                                <IconButton
                                  size="small"
                                  sx={{
                                    backgroundColor: alpha(action.color, 0.1),
                                    color: action.color,
                                    borderRadius: 2,
                                    '&:hover': {
                                      backgroundColor: alpha(action.color, 0.2),
                                      boxShadow: `0 4px 12px ${action.color}30`
                                    }
                                  }}
                                >
                                  <action.icon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </motion.div>
                          ))}
                        </Stack>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>

      {/* Empty State */}
      {filteredCommitments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              background: gradients.paper
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              ¡Excelente!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No hay compromisos que coincidan con los filtros seleccionados.
            </Typography>
          </Paper>
        </motion.div>
      )}
    </StyledContainer>
  );
};

export default DueCommitmentsPage;
