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
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Warning,
  Schedule,
  Assignment,
  Business,
  FilterList,
  AttachMoney,
  Visibility,
  Edit,
  Delete,
  CalendarToday,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  NotificationImportant,
  Refresh,
  Flag,
  MoreHoriz,
  Close,
  Person,
  Info,
  Notes,
  History,
  Payment,
  AttachFile,
  Share,
  GetApp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks y Context
import { useAuth } from '../context/AuthContext';
import { useDueCommitments } from '../hooks/useDueCommitments';
import { useSettings } from '../context/SettingsContext';

// Componentes de compromisos
import CommitmentEditForm from '../components/commitments/CommitmentEditForm';
import PaymentReceiptViewer from '../components/commitments/PaymentReceiptViewer';

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
  const { 
    commitments, 
    loading, 
    error, 
    refreshCommitments, 
    getCommitmentsByPriority,
    stats 
  } = useDueCommitments();

  const [filteredCommitments, setFilteredCommitments] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para modales y dialogs
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState(null);

  useEffect(() => {
    // Filtrar compromisos según prioridad y empresa usando datos reales
    let filtered = getCommitmentsByPriority(priorityFilter);
    
    if (companyFilter !== 'all') {
      filtered = filtered.filter(commitment => 
        commitment.company === companyFilter
      );
    }
    
    setFilteredCommitments(filtered);
  }, [priorityFilter, companyFilter, commitments, getCommitmentsByPriority]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh con datos reales de Firebase
    await new Promise(resolve => setTimeout(resolve, 1000));
    refreshCommitments();
    setRefreshing(false);
  };

  // Funciones para manejar acciones de compromisos
  const handleViewCommitment = async (commitment) => {
    setSelectedCommitment(commitment);
    setViewDialogOpen(true);
  };

  const handleEditCommitment = (commitment) => {
    setSelectedCommitment(commitment);
    setEditDialogOpen(true);
  };

  const handleDeleteCommitment = (commitment) => {
    setCommitmentToDelete(commitment);
    setDeleteDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedCommitment(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCommitment(null);
  };

  const confirmDelete = async () => {
    if (commitmentToDelete) {
      try {
        // Aquí integrarías con Firebase para eliminar el compromiso
        console.log('Eliminando compromiso:', commitmentToDelete.id);
        
        // Simular eliminación exitosa
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refrescar la lista
        refreshCommitments();
        
        // Cerrar dialog
        setDeleteDialogOpen(false);
        setCommitmentToDelete(null);
        
        // Mostrar notificación de éxito (puedes agregar un snackbar aquí)
        console.log('Compromiso eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar compromiso:', error);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCommitmentToDelete(null);
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

  // Función auxiliar para obtener texto de estado
  const getStatusText = (commitment) => {
    if (!commitment?.dueDate) return 'Sin fecha';
    const today = new Date();
    const dueDate = commitment.dueDate;
    const daysUntilDue = differenceInDays(dueDate, today);
    
    if (daysUntilDue < 0) return 'Vencido';
    if (daysUntilDue === 0) return 'Vence hoy';
    if (daysUntilDue <= 7) return 'Próximo';
    return 'Vigente';
  };

  // Función auxiliar para formatear la fecha de forma segura
  const safeToDate = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    return null;
  };

  // Estado para información de la empresa
  const [companyData, setCompanyData] = useState(null);

  // Obtener empresas únicas para el filtro
  const getUniqueCompanies = () => {
    const companies = commitments
      .map(commitment => commitment.company)
      .filter(company => company && company.trim() !== '')
      .filter((company, index, arr) => arr.indexOf(company) === index)
      .sort();
    return companies;
  };

  const overdueCounts = {
    total: stats.total,
    overdue: stats.overdue,
    dueSoon: stats.dueSoon,
    upcoming: stats.upcoming,
    totalAmount: stats.totalAmount,
    overdueAmount: stats.overdueAmount
  };

  // Mostrar estado de carga

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
      {/* Header Premium con Gradiente Dinámico */}
      <motion.div
        initial={settings.theme?.animations ? { opacity: 0, y: -20 } : {}}
        animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={settings.theme?.animations ? { duration: 0.6, type: "spring" } : { duration: 0 }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${settings.theme?.primaryColor || '#667eea'} 0%, ${settings.theme?.secondaryColor || '#764ba2'} 100%)`,
            borderRadius: `${settings.theme?.borderRadius || 16}px`,
            p: settings.theme?.compactMode ? 3 : 4,
            mb: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: `${settings.theme?.borderRadius || 16}px`,
              zIndex: 0,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: `${(settings.theme?.borderRadius || 16) / 2}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <NotificationImportant sx={{ fontSize: (settings.theme?.fontSize || 16) * 2.3, color: 'white' }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="700" 
                    sx={{ 
                      color: 'white', 
                      mb: 0.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize + 8}px` : '2rem',
                      fontFamily: settings.theme?.fontFamily || 'inherit'
                    }}
                  >
                    Compromisos Próximos a Vencer
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize + 2}px` : '1.125rem',
                      fontFamily: settings.theme?.fontFamily || 'inherit'
                    }}
                  >
                    Gestión proactiva de vencimientos financieros con alertas inteligentes y control total
                  </Typography>
                </Box>
              </Box>
              
              {/* Botones de Acción */}
              <Box display="flex" gap={2}>
                {/* Botón Actualizar */}
                <motion.div
                  initial={settings.theme?.animations ? { x: 20, opacity: 0 } : {}}
                  animate={settings.theme?.animations ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                  transition={settings.theme?.animations ? { delay: 0.2, duration: 0.5 } : { duration: 0 }}
                  whileHover={settings.theme?.animations ? { scale: 1.05 } : {}}
                  whileTap={settings.theme?.animations ? { scale: 0.95 } : {}}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    size={settings.theme?.compactMode ? "medium" : "large"}
                    sx={{
                      py: settings.theme?.compactMode ? 1 : 1.5,
                      px: settings.theme?.compactMode ? 2.5 : 3.5,
                      fontSize: settings.theme?.fontSize ? `${settings.theme.fontSize * 1}px` : '1rem',
                      fontWeight: 600,
                      fontFamily: settings.theme?.fontFamily || 'inherit',
                      borderRadius: `${settings.theme?.borderRadius || 16}px`,
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      textTransform: 'none',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Cards de Resumen - Estilo Dashboard Limpio */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            title: 'Total Compromisos',
            value: overdueCounts.total,
            icon: Assignment,
            iconBg: '#e3f2fd',
            iconColor: '#2196f3',
            trend: '+12%',
            trendColor: '#4caf50'
          },
          {
            title: 'Vencidos',
            value: overdueCounts.overdue,
            icon: Warning,
            iconBg: '#ffebee',
            iconColor: '#f44336',
            trend: '-5%',
            trendColor: '#f44336'
          },
          {
            title: 'Por Vencer (7 días)',
            value: overdueCounts.dueSoon,
            icon: Schedule,
            iconBg: '#e8f5e8',
            iconColor: '#4caf50',
            trend: '+8%',
            trendColor: '#4caf50'
          },
          {
            title: 'Monto Total',
            value: formatCurrency(overdueCounts.totalAmount),
            icon: AttachMoney,
            iconBg: '#fff3e0',
            iconColor: '#ff9800',
            trend: '-15%',
            trendColor: '#f44336'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <Card
                sx={{
                  p: 2.5,
                  height: 130,
                  background: 'white',
                  borderRadius: 1,
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a',
                        mb: 0.5,
                        fontSize: '1.75rem'
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontWeight: 500,
                        mb: 1.5
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Chip
                      label={stat.trend}
                      size="small"
                      sx={{
                        backgroundColor: stat.trendColor === '#4caf50' ? '#e8f5e8' : '#ffebee',
                        color: stat.trendColor,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        border: 'none'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1,
                      backgroundColor: stat.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <stat.icon sx={{ fontSize: 22, color: stat.iconColor }} />
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Alertas Críticas */}
      {overdueCounts.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              background: 'white',
              borderLeft: `4px solid ${theme.palette.error.main}`
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Warning sx={{ color: theme.palette.error.main, fontSize: 20 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.error.main, mb: 0.5 }}>
                  ¡Atención Requerida!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tienes <strong>{overdueCounts.overdue} compromiso{overdueCounts.overdue > 1 ? 's' : ''} vencido{overdueCounts.overdue > 1 ? 's' : ''}</strong> por un monto de <strong>{formatCurrency(overdueCounts.overdueAmount)}</strong>. Se requiere acción inmediata.
                </Typography>
              </Box>
            </Stack>
          </Paper>
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
            p: 2.5,
            mb: 3,
            borderRadius: 1,
            border: `1px solid #f0f0f0`,
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <Stack direction="column" spacing={2.5}>
            {/* Filtros en una sola fila */}
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" justifyContent="space-between">
              {/* Filtro por Prioridad */}
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <FilterList sx={{ color: '#666', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '0.875rem',
                  minWidth: 'fit-content'
                }}>
                  Filtrar por prioridad:
                </Typography>
                {['all', 'critical', 'high', 'medium'].map((filter) => (
                  <motion.div
                    key={filter}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.2 }}
                  >
                    <Chip
                      label={filter === 'all' ? 'Todas' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      onClick={() => setPriorityFilter(filter)}
                      sx={{ 
                        borderRadius: 1,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 32,
                        backgroundColor: priorityFilter === filter ? theme.palette.primary.main : 'transparent',
                        color: priorityFilter === filter ? 'white' : '#666',
                        border: `1px solid ${priorityFilter === filter ? theme.palette.primary.main : '#e0e0e0'}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: priorityFilter === filter ? theme.palette.primary.dark : '#f5f5f5',
                          borderColor: priorityFilter === filter ? theme.palette.primary.dark : '#d0d0d0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </Stack>

              {/* Filtro por Empresa */}
              <Stack direction="row" alignItems="center" spacing={2.5}>
                <Business sx={{ color: '#666', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '0.875rem',
                  minWidth: 'fit-content'
                }}>
                  Filtrar por empresa:
                </Typography>
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 220,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      height: 32,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: `1px solid #e0e0e0`,
                      '&:hover': {
                        borderColor: '#d0d0d0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    },
                    '& .MuiSelect-select': {
                      padding: '6px 24px',
                      color: '#666'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.75rem',
                      color: '#666',
                      fontWeight: 500,
                      transform: 'translate(24px, 8px) scale(1)',
                      '&.Mui-focused, &.MuiFormLabel-filled': {
                        transform: 'translate(24px, -9px) scale(0.75)',
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0'
                    },
                    '& fieldset': {
                      borderRadius: 1
                    }
                  }}
                >
                  <InputLabel>Seleccionar empresa</InputLabel>
                  <Select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    label="Seleccionar empresa"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 1,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                          border: '1px solid #f0f0f0',
                          mt: 0.5,
                          '& .MuiMenuItem-root': {
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            padding: '8px 16px',
                            '&:hover': {
                              backgroundColor: '#f5f5f5'
                            },
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.12)
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="all">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Business sx={{ fontSize: 16, color: '#666' }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Todas las empresas
                        </Typography>
                      </Stack>
                    </MenuItem>
                    {getUniqueCompanies().map((company) => (
                      <MenuItem key={company} value={company}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Business sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {company}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
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
            borderRadius: 1,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            background: gradients.paper
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ 
                  background: 'white',
                  borderBottom: `1px solid #f0f0f0`
                }}>
                  {[
                    { label: 'Compromiso', width: '22%' },
                    { label: 'Empresa', width: '12%' }, 
                    { label: 'Monto', width: '12%' },
                    { label: 'Fecha Vencimiento', width: '15%' },
                    { label: 'Días Restantes', width: '12%' },
                    { label: 'Prioridad', width: '10%' },
                    { label: 'Estado', width: '10%' },
                    { label: 'Acciones', width: '7%' }
                  ].map((header, index) => (
                    <TableCell 
                      key={header.label}
                      sx={{ 
                        fontWeight: 600,
                        borderBottom: 'none',
                        py: 2.5,
                        pl: index === 0 ? 3 : 2,
                        pr: index === 7 ? 3 : 2,
                        width: header.width,
                        color: '#1a1a1a',
                        fontSize: '0.875rem',
                        background: 'transparent'
                      }}
                    >
                      {header.label}
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
                      whileHover={{ 
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`
                      }}
                    >
                      <TableCell sx={{ 
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`, 
                        py: 2,
                        pl: 3
                      }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: 600,
                            color: 'text.primary',
                            mb: 0.5
                          }}>
                            {commitment.title || 'Compromiso sin título'}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            opacity: 0.8
                          }}>
                            {commitment.description || 'Sin descripción'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                        <Chip
                          icon={<Business />}
                          label={commitment.company || 'Sin empresa'}
                          size="small"
                          sx={{ 
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.info.main, 0.08),
                            color: theme.palette.info.main,
                            fontWeight: 500,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.info.main, 0.12)
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 700,
                          color: commitment.amount >= 1000000 ? theme.palette.success.main : 'text.primary'
                        }}>
                          {formatCurrency(commitment.amount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarToday sx={{ 
                            fontSize: 16, 
                            color: 'text.secondary',
                            opacity: 0.7
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {commitment.dueDate ? format(commitment.dueDate, 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                        <Chip
                          label={commitment.dueDate ? `${getDaysUntilDue(commitment.dueDate)} días` : '-- días'}
                          size="small"
                          sx={{
                            borderRadius: 3,
                            fontWeight: 600,
                            border: '1px solid transparent',
                            backgroundColor: commitment.dueDate && getDaysUntilDue(commitment.dueDate) < 0 
                              ? alpha(theme.palette.error.main, 0.08)
                              : commitment.dueDate && getDaysUntilDue(commitment.dueDate) <= 7
                              ? alpha(theme.palette.warning.main, 0.08)
                              : alpha(theme.palette.success.main, 0.08),
                            color: commitment.dueDate && getDaysUntilDue(commitment.dueDate) < 0 
                              ? theme.palette.error.main
                              : commitment.dueDate && getDaysUntilDue(commitment.dueDate) <= 7
                              ? theme.palette.warning.main
                              : theme.palette.success.main,
                            borderColor: commitment.dueDate && getDaysUntilDue(commitment.dueDate) < 0 
                              ? alpha(theme.palette.error.main, 0.15)
                              : commitment.dueDate && getDaysUntilDue(commitment.dueDate) <= 7
                              ? alpha(theme.palette.warning.main, 0.15)
                              : alpha(theme.palette.success.main, 0.15)
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                        <Chip
                          label={commitment.priority ? commitment.priority.charAt(0).toUpperCase() + commitment.priority.slice(1) : 'Media'}
                          size="small"
                          sx={{
                            borderRadius: 3,
                            backgroundColor: alpha(getPriorityColor(commitment.priority || 'medium'), 0.08),
                            color: getPriorityColor(commitment.priority || 'medium'),
                            fontWeight: 600,
                            border: `1px solid ${alpha(getPriorityColor(commitment.priority || 'medium'), 0.15)}`
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
                        <Chip
                          label={getStatusLabel(commitment.status || 'upcoming')}
                          size="small"
                          sx={{
                            borderRadius: 3,
                            backgroundColor: alpha(getStatusColor(commitment.status || 'upcoming'), 0.08),
                            color: getStatusColor(commitment.status || 'upcoming'),
                            fontWeight: 600,
                            border: `1px solid ${alpha(getStatusColor(commitment.status || 'upcoming'), 0.15)}`
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                        pr: 3
                      }}>
                        <Stack direction="row" spacing={1}>
                          {[
                            { 
                              icon: Visibility, 
                              tooltip: 'Ver detalles', 
                              color: theme.palette.info.main,
                              hoverColor: theme.palette.info.dark,
                              action: () => handleViewCommitment(commitment)
                            },
                            { 
                              icon: Edit, 
                              tooltip: 'Editar', 
                              color: theme.palette.warning.main,
                              hoverColor: theme.palette.warning.dark,
                              action: () => handleEditCommitment(commitment)
                            },
                            { 
                              icon: Delete, 
                              tooltip: 'Eliminar', 
                              color: theme.palette.error.main,
                              hoverColor: theme.palette.error.dark,
                              action: () => handleDeleteCommitment(commitment)
                            }
                          ].map((action, actionIndex) => (
                            <motion.div
                              key={actionIndex}
                              whileHover={{ 
                                scale: 1.08, 
                                y: -2,
                                transition: { duration: 0.2, ease: "easeOut" }
                              }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", bounce: 0.4 }}
                            >
                              <Tooltip 
                                title={action.tooltip}
                                placement="top"
                                arrow
                              >
                                <IconButton
                                  size="small"
                                  onClick={action.action}
                                  sx={{
                                    backgroundColor: alpha(action.color, 0.08),
                                    color: action.color,
                                    borderRadius: 2.5,
                                    border: `1px solid ${alpha(action.color, 0.15)}`,
                                    width: 32,
                                    height: 32,
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      backgroundColor: alpha(action.color, 0.15),
                                      borderColor: alpha(action.color, 0.3),
                                      color: action.hoverColor,
                                      boxShadow: `0 4px 12px ${alpha(action.color, 0.25)}`
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
              borderRadius: 1,
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
      
      {/* Modales y Dialogs */}
      {/* Diálogo de vista detallada - Premium Design System v2.1 */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: '24px', // Margen fijo y seguro
            maxHeight: 'calc(100vh - 48px)', // Altura segura
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            position: 'relative',
            // Shimmer effect premium
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 3s infinite',
              zIndex: 1
            },
            '& @keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }
        }}
      >
        {selectedCommitment && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 120,
              duration: 0.6 
            }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            {/* Header Premium con Gradiente Dinámico */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 100,
                delay: 0.1 
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  p: 3,
                  borderRadius: '16px 16px 0 0',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                    zIndex: 1
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    animation: 'float 6s ease-in-out infinite',
                    zIndex: 1
                  },
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(180deg)' }
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 2 }}>
                  <Box display="flex" alignItems="center" gap={2.5}>
                    {/* Logo de empresa */}
                    <motion.div
                      initial={{ scale: 0.8, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2.5,
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            animation: 'shimmer 2s infinite'
                          }
                        }}
                      >
                        <Business sx={{ fontSize: 28, color: 'white', zIndex: 1 }} />
                      </Box>
                    </motion.div>
                    
                    {/* Información compacta del compromiso */}
                    <Box>
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontSize: '1.25rem' }}>
                          {selectedCommitment?.title || selectedCommitment?.description || 'Sin concepto'}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 800, 
                              fontSize: '1.4rem',
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              color: 'rgba(255, 255, 255, 0.95)'
                            }}
                          >
                            {formatCurrency(selectedCommitment?.amount || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                            • {selectedCommitment?.company || 'Sin empresa'}
                          </Typography>
                        </Box>
                        {/* Nueva fila con información adicional */}
                        <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                          <Typography variant="body2" sx={{ 
                            opacity: 0.85, 
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}>
                            📅 {selectedCommitment?.periodicity || 'Mensual'}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            opacity: 0.85, 
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}>
                            • 🏦 {selectedCommitment?.paymentMethod || 'Transferencia'}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Box>
                  </Box>

                  {/* Lado derecho: Estado + Botón cerrar */}
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      {/* Estado del compromiso */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <Chip
                          label={getStatusText(selectedCommitment)}
                          size="medium"
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                      </motion.div>

                      {/* Botón de cerrar */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <IconButton
                          onClick={handleCloseViewDialog}
                          sx={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.3)',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <MoreHoriz />
                        </IconButton>
                      </motion.div>
                    </Box>
                  </motion.div>
                </Box>
              </Box>
            </motion.div>
            
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Fecha de Vencimiento - Diseño consistente */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 120 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2.5}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 2.5,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            <CalendarToday sx={{ color: 'white', fontSize: 28 }} />
                          </Box>
                        </motion.div>
                        
                        <Box flex={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                            Fecha de Vencimiento
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: 'text.primary',
                            textTransform: 'capitalize',
                            mb: 0.2
                          }}>
                            {selectedCommitment.dueDate ? format(selectedCommitment.dueDate, 'EEEE', { locale: es }) : 'Sin fecha'}
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 500,
                            color: 'text.secondary'
                          }}>
                            {selectedCommitment.dueDate ? format(selectedCommitment.dueDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es }) : 'No especificada'}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Información Adicional */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(50, 50, 50, 0.6) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderRadius: 4,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          animation: 'shimmer 3s infinite',
                          zIndex: 1
                        },
                        '& @keyframes shimmer': {
                          '0%': { transform: 'translateX(-100%)' },
                          '100%': { transform: 'translateX(100%)' }
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 3, 
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Assignment sx={{ fontSize: 24 }} />
                          Información Adicional
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {/* Primera fila: Empresa y Prioridad */}
                          <Grid item xs={12} md={6}>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(theme.palette.info.light, 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Business sx={{ color: 'info.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.main' }}>
                                    Empresa
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {selectedCommitment.company || 'No especificada'}
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)}, ${alpha(theme.palette.warning.light, 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Flag sx={{ color: 'warning.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                    Prioridad
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {selectedCommitment.priority || 'Media'}
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>
                          
                          {/* Descripción completa */}
                          {selectedCommitment.description && (
                            <Grid item xs={12}>
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                              >
                                <Box sx={{
                                  p: 2.5,
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.light, 0.03)})`,
                                  borderRadius: 3,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}>
                                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                    <Assignment sx={{ color: 'primary.main', fontSize: 20 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                      Descripción
                                    </Typography>
                                  </Box>
                                  <Typography variant="body1" sx={{ 
                                    fontWeight: 400,
                                    lineHeight: 1.6,
                                    color: 'text.primary'
                                  }}>
                                    {selectedCommitment.description}
                                  </Typography>
                                </Box>
                              </motion.div>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions 
              sx={{ 
                p: 4,
                pb: 6,
                background: `
                  linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%),
                  linear-gradient(225deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)
                `,
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(20px) saturate(180%)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: 1,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)'
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  onClick={handleCloseViewDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 3,
                    px: 4,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.3)}`,
                    color: theme.palette.text.secondary,
                    backgroundColor: 'transparent',
                    '&:hover': {
                      borderColor: alpha(theme.palette.text.primary, 0.3),
                      backgroundColor: alpha(theme.palette.text.primary, 0.04),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.text.primary, 0.15)}`
                    }
                  }}
                >
                  Cerrar
                </Button>
              </motion.div>
              
              <Box display="flex" gap={2.5}>
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => handleEditCommitment(selectedCommitment)}
                    sx={{ 
                      borderRadius: 3.5,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: `
                        linear-gradient(135deg, #667eea 0%, #764ba2 100%),
                        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)
                      `,
                      boxShadow: `
                        0 8px 25px rgba(102, 126, 234, 0.35),
                        0 3px 12px rgba(102, 126, 234, 0.25),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                      '&:hover': {
                        background: `
                          linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%),
                          radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)
                        `,
                        boxShadow: `
                          0 12px 35px rgba(102, 126, 234, 0.45),
                          0 5px 20px rgba(102, 126, 234, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.3)
                        `,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Editar
                  </Button>
                </motion.div>
              </Box>
            </DialogActions>
          </motion.div>
        )}
      </Dialog>
      
      {/* Modal de Edición usando CommitmentEditForm */}
      <CommitmentEditForm 
        open={editDialogOpen}
        commitment={selectedCommitment}
        onClose={handleCloseEditDialog}
        onSuccess={() => {
          handleCloseEditDialog();
          refreshCommitments(); // Refrescar la lista después de editar
        }}
      />
      
      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        commitment={commitmentToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </StyledContainer>
  );
};

// Componente para Confirmar Eliminación
const DeleteConfirmDialog = ({ open, commitment, onConfirm, onCancel }) => {
  const theme = useTheme();
  
  if (!commitment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Warning sx={{ color: theme.palette.error.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Confirmar Eliminación
          </Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que deseas eliminar el compromiso <strong>"{commitment.title}"</strong>?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, color: theme.palette.error.main }}>
          Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onCancel} 
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          sx={{ borderRadius: 2 }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DueCommitmentsPage;
