import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  AttachFile as AttachFileIcon,
  Comment as CommentIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Inbox as InboxIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDelegatedTasks } from '../hooks/useDelegatedTasks';
import { useAuth } from '../context/AuthContext';
import { format, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import TaskDialog from '../components/tasks/TaskDialog';
import TaskDetailDialog from '../components/tasks/TaskDetailDialog';
import TaskReassignDialog from '../components/tasks/TaskReassignDialog';
import TaskProgressDialog from '../components/tasks/TaskProgressDialog';

/**
 * TasksPage - Sistema de gestión de tareas delegadas
 * Vista Grid con cards siguiendo diseño sobrio empresarial
 * Patrón de diseño: EmpleadosPage, LiquidacionesEstadisticasPage
 */
const TasksPage = () => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { tasks, stats, loading, changeStatus, updateTask, deleteTask } = useDelegatedTasks();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);

  // Permisos (soporta formato objeto y array)
  const canCreate = userProfile?.permissions?.['tareas'] || 
                    userProfile?.permissions?.['tareas.crear'] || 
                    (Array.isArray(userProfile?.permissions) && 
                     (userProfile?.permissions.includes('tareas') || 
                      userProfile?.permissions.includes('tareas.crear')));
  const canAssign = userProfile?.permissions?.['tareas.asignar'] || 
                    (Array.isArray(userProfile?.permissions) && userProfile?.permissions.includes('tareas.asignar'));
  const canApprove = userProfile?.permissions?.['tareas.aprobar'] || 
                     (Array.isArray(userProfile?.permissions) && userProfile?.permissions.includes('tareas.aprobar'));
  const canViewAll = userProfile?.permissions?.['tareas.ver_todas'] || 
                     (Array.isArray(userProfile?.permissions) && userProfile?.permissions.includes('tareas.ver_todas'));
  
  // Editar y Eliminar: Solo usuarios con permiso de crear tareas
  const canEdit = canCreate;
  const canDelete = canCreate;

  // Filtrar tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Búsqueda por texto
      if (searchTerm && !task.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por prioridad
      if (filterPriority !== 'all' && task.prioridad !== filterPriority) {
        return false;
      }

      // Filtro por asignación
      if (filterAssignment === 'mine' && task.asignadoA?.uid !== currentUser?.uid) {
        return false;
      }
      if (filterAssignment === 'created' && task.creadoPor?.uid !== currentUser?.uid) {
        return false;
      }
      if (filterAssignment === 'unassigned' && task.asignadoA) {
        return false;
      }

      // Filtro por empresa
      if (filterCompany !== 'all' && task.empresa !== filterCompany) {
        return false;
      }

      return true;
    });
  }, [tasks, searchTerm, filterPriority, filterAssignment, filterCompany, currentUser]);

  // Handlers
  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setOpenDetailDialog(true);
    handleMenuClose();
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedTask(null);
  };

  const handleEdit = () => {
    setTaskToEdit(selectedTask);
    setOpenCreateDialog(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setConfirmDeleteOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedTask?.id) return;

    try {
      await deleteTask(selectedTask.id);
      setConfirmDeleteOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      alert('Error al eliminar la tarea. Por favor, intenta nuevamente.');
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setTaskToEdit(null);
  };

  const handleReassign = () => {
    setOpenReassignDialog(true);
    handleMenuClose();
  };

  const handleCloseReassign = () => {
    setOpenReassignDialog(false);
  };

  const handleUpdateProgress = () => {
    setOpenProgressDialog(true);
    handleMenuClose();
  };

  const handleCloseProgress = () => {
    setOpenProgressDialog(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente':
        return theme.palette.error.main;
      case 'alta':
        return theme.palette.warning.main;
      case 'media':
        return theme.palette.info.main;
      case 'baja':
        return theme.palette.grey[400];
      default:
        return theme.palette.grey[300];
    }
  };

  const isOverdue = (task) => {
    if (!task.fechaVencimiento || task.estadoActual === 'completada' || task.estadoActual === 'cancelada') {
      return false;
    }
    // Solo marcar como vencida si la fecha es ANTERIOR al día de hoy (no incluir hoy)
    const taskDate = new Date(task.fechaVencimiento.toDate());
    const today = new Date();
    taskDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const getDaysRemaining = (task) => {
    if (!task.fechaVencimiento || task.estadoActual === 'completada' || task.estadoActual === 'cancelada') {
      return null;
    }
    const taskDate = new Date(task.fechaVencimiento.toDate());
    const today = new Date();
    taskDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysRemainingLabel = (days) => {
    if (days === null) return null;
    if (days < 0) return `${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''} vencida`;
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `${days} día${days !== 1 ? 's' : ''} restantes`;
  };

  const getDaysRemainingColor = (days) => {
    if (days === null) return theme.palette.grey[400];
    if (days < 0) return theme.palette.error.main;
    if (days === 0) return theme.palette.warning.main;
    if (days <= 3) return theme.palette.warning.main;
    if (days <= 7) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Sin Asignar',
      asignada: 'Asignada',
      en_progreso: 'En Progreso',
      en_revision: 'En Revisión',
      completada: 'Completada',
      traslado_pendiente: 'Traslado'
    };
    return labels[estado] || estado;
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: theme.palette.grey[500],
      asignada: theme.palette.info.main,
      en_progreso: theme.palette.warning.main,
      en_revision: theme.palette.secondary.main,
      completada: theme.palette.success.main,
      traslado_pendiente: theme.palette.error.main
    };
    return colors[estado] || theme.palette.grey[300];
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Cargando tareas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1600px',
      mx: 'auto'
    }}>
      {/* HEADER GRADIENT SOBRIO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper 
          sx={{ 
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            mb: 6
          }}
        >
          <Box sx={{ 
            p: 3, 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <Box>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                fontSize: '0.7rem', 
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: 1.2
              }}>
                DELEGACIÓN • SEGUIMIENTO COLABORATIVO
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                mt: 0.5, 
                mb: 0.5,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                Gestión de Tareas
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Sistema de delegación y seguimiento colaborativo de tareas empresariales
              </Typography>
            </Box>
            
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderRadius: 1,
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Nueva Tarea
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>

      {/* Estadísticas sobrias con bordes dinámicos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main,
                letterSpacing: 1.2
              }}>
                TOTAL TAREAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.info.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.info.main,
                letterSpacing: 1.2
              }}>
                MIS TAREAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {stats.misAsignadas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.warning.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.warning.main,
                letterSpacing: 1.2
              }}>
                EN PROGRESO
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {stats.enProgreso}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.success.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.success.main,
                letterSpacing: 1.2
              }}>
                COMPLETADAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1
              }}>
                {stats.completadas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de búsqueda y filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card sx={{ mb: 3, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 1 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <ToggleButtonGroup
                    value={filterPriority}
                    exclusive
                    onChange={(e, value) => value && setFilterPriority(value)}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { borderRadius: 1 } }}
                  >
                    <ToggleButton value="all">Todas</ToggleButton>
                    <ToggleButton value="urgente">Urgentes</ToggleButton>
                    <ToggleButton value="alta">Alta</ToggleButton>
                    <ToggleButton value="media">Media</ToggleButton>
                  </ToggleButtonGroup>

                  <ToggleButtonGroup
                    value={filterAssignment}
                    exclusive
                    onChange={(e, value) => value && setFilterAssignment(value)}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { borderRadius: 1 } }}
                  >
                    <ToggleButton value="all">Todas</ToggleButton>
                    <ToggleButton value="mine">Mis Tareas</ToggleButton>
                    <ToggleButton value="created">Creadas por Mí</ToggleButton>
                    <ToggleButton value="unassigned">Sin Asignar</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>

              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Refrescar">
                    <IconButton size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Filtros avanzados">
                    <IconButton size="small">
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vista Grid de Tareas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {filteredTasks.length === 0 ? (
          <Card sx={{ textAlign: 'center', borderRadius: 2 }}>
            <CardContent sx={{ py: 8 }}>
              <InboxIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay tareas que mostrar
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {searchTerm || filterPriority !== 'all' || filterAssignment !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : canCreate 
                    ? 'Comienza creando la primera tarea'
                    : 'Cuando se creen tareas, aparecerán aquí'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredTasks.map((task, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={task.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        borderColor: alpha(theme.palette.primary.main, 0.4)
                      }
                    }}
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      {/* Header: Estado + Prioridad + Días Restantes + Menú */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 2,
                        pb: 1.5,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1, pr: 1 }}>
                          <Chip
                            label={getEstadoLabel(task.estadoActual)}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              textTransform: 'uppercase',
                              bgcolor: alpha(getEstadoColor(task.estadoActual), 0.12),
                              color: getEstadoColor(task.estadoActual),
                              border: `1px solid ${alpha(getEstadoColor(task.estadoActual), 0.3)}`,
                              borderRadius: 1
                            }}
                          />
                          <Chip
                            label={task.prioridad || 'media'}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              textTransform: 'uppercase',
                              bgcolor: alpha(getPriorityColor(task.prioridad), 0.12),
                              color: getPriorityColor(task.prioridad),
                              border: `1px solid ${alpha(getPriorityColor(task.prioridad), 0.3)}`,
                              borderRadius: 1
                            }}
                          />
                          {/* Chip de días restantes */}
                          {getDaysRemaining(task) !== null && (
                            <Chip
                              label={getDaysRemainingLabel(getDaysRemaining(task))}
                              size="small"
                              icon={<CalendarIcon sx={{ fontSize: 14, color: getDaysRemainingColor(getDaysRemaining(task)) + ' !important' }} />}
                              sx={{
                                height: 24,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                letterSpacing: 0.3,
                                bgcolor: alpha(getDaysRemainingColor(getDaysRemaining(task)), 0.12),
                                color: getDaysRemainingColor(getDaysRemaining(task)),
                                border: `1px solid ${alpha(getDaysRemainingColor(getDaysRemaining(task)), 0.3)}`,
                                borderRadius: 1,
                                '& .MuiChip-icon': {
                                  marginLeft: '6px'
                                }
                              }}
                            />
                          )}
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, task);
                          }}
                          sx={{
                            bgcolor: alpha(theme.palette.divider, 0.05),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Título */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          mb: 1.5,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: isOverdue(task) ? theme.palette.error.main : 'text.primary'
                        }}
                      >
                        {task.titulo}
                      </Typography>

                      {/* Descripción */}
                      {task.descripcion && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.8rem',
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4
                          }}
                        >
                          {task.descripcion}
                        </Typography>
                      )}

                      {/* Barra de progreso */}
                      {task.porcentajeCompletado > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progreso
                            </Typography>
                            <Typography variant="caption" fontWeight={600} color="primary">
                              {task.porcentajeCompletado}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={task.porcentajeCompletado}
                            sx={{
                              height: 6,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 1
                              }
                            }}
                          />
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      {/* Información adicional */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Fecha de vencimiento */}
                        {task.fechaVencimiento && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: isOverdue(task) 
                              ? alpha(theme.palette.error.main, 0.08) 
                              : alpha(theme.palette.divider, 0.04)
                          }}>
                            <CalendarIcon sx={{ 
                              fontSize: 18, 
                              color: isOverdue(task) ? 'error.main' : 'text.secondary' 
                            }} />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.8rem',
                                color: isOverdue(task) ? 'error.main' : 'text.secondary',
                                fontWeight: isOverdue(task) ? 600 : 500
                              }}
                            >
                              {isOverdue(task) && 'Vencida: '}
                              {format(task.fechaVencimiento.toDate(), 'dd MMM yyyy', { locale: es })}
                            </Typography>
                          </Box>
                        )}

                        {/* Asignado a */}
                        {task.asignadoA && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.divider, 0.04)
                          }}>
                            <Avatar
                              src={task.asignadoA.photoURL}
                              sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                            >
                              {task.asignadoA.displayName?.charAt(0) || task.asignadoA.email?.charAt(0)}
                            </Avatar>
                            <Typography variant="caption" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
                              {task.asignadoA.displayName || task.asignadoA.email}
                            </Typography>
                          </Box>
                        )}

                        {/* Adjuntos y comentarios */}
                        {(task.archivosAdjuntos?.length > 0 || task.comentarios?.length > 0) && (
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            {task.archivosAdjuntos?.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {task.archivosAdjuntos.length}
                                </Typography>
                              </Box>
                            )}
                            {task.comentarios?.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CommentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {task.comentarios.length}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        {canEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {canAssign && (
          <MenuItem onClick={handleReassign}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reasignar</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleUpdateProgress}>
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Actualizar Progreso</ListItemText>
        </MenuItem>
        {canDelete && (
          <>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Dialog de Creación/Edición */}
      <TaskDialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        task={taskToEdit}
      />

      {/* Dialog de Detalles */}
      <TaskDetailDialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        task={selectedTask}
      />

      {/* Dialog de Reasignación */}
      <TaskReassignDialog
        open={openReassignDialog}
        onClose={handleCloseReassign}
        task={selectedTask}
      />

      {/* Dialog de Actualización de Progreso */}
      <TaskProgressDialog
        open={openProgressDialog}
        onClose={handleCloseProgress}
        task={selectedTask}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={cancelDelete}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          color: 'error.main'
        }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la tarea "{selectedTask?.titulo}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={cancelDelete}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete}
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: 1,
              fontWeight: 600
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksPage;
