import { useState, useMemo, useEffect } from 'react';
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
  DialogActions,
  FormControl,
  InputLabel,
  Select
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
  Delete as DeleteIcon,
  ViewKanban as ViewKanbanIcon,
  GridView as GridViewIcon
} from '@mui/icons-material';
import { useDelegatedTasks } from '../hooks/useDelegatedTasks';
import { useAuth } from '../context/AuthContext';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import TaskDialog from '../components/tasks/TaskDialog';
import TaskDetailDialog from '../components/tasks/TaskDetailDialog';
import TaskReassignDialog from '../components/tasks/TaskReassignDialog';
import TaskProgressDialog from '../components/tasks/TaskProgressDialog';
import TasksFilters from '../components/tasks/TasksFilters';

/**
 * TasksPage - Sistema de gestión de tareas delegadas
 * Vista Grid con cards siguiendo diseño sobrio empresarial
 * Patrón de diseño: EmpleadosPage, LiquidacionesEstadisticasPage
 */
const TasksPage = () => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { 
    tasks, 
    stats, 
    loading, 
    changeStatus, 
    updateTask, 
    deleteTask,
    currentPage,
    hasMore,
    nextPage,
    previousPage,
    refreshTasks
  } = useDelegatedTasks();

  // Determinar filtro de asignación inicial según permisos
  const hasPermissionVerTodas = userProfile?.permissions?.['tareas.ver_todas'] || 
                                (Array.isArray(userProfile?.permissions) && 
                                 userProfile?.permissions.includes('tareas.ver_todas'));
  
  const initialAssignmentFilter = hasPermissionVerTodas ? 'all' : 'mine';

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignment, setFilterAssignment] = useState(initialAssignmentFilter);
  const [filterCompany, setFilterCompany] = useState('all');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [companies, setCompanies] = useState([]);
  
  // Estados para sistema de filtros aplicados
  const [filtersApplied, setFiltersApplied] = useState(false); // Usuario debe hacer clic en Aplicar

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

  // Ajustar filtro de asignación si el usuario no tiene permisos
  useEffect(() => {
    if (!hasPermissionVerTodas && (filterAssignment === 'all' || filterAssignment === 'unassigned')) {
      // Si el usuario no puede ver todas las tareas pero tiene filtro "all" o "unassigned"
      // cambiar automáticamente a "mine"
      setFilterAssignment('mine');
      setFiltersApplied(false); // Requiere aplicar de nuevo
    }
  }, [hasPermissionVerTodas, filterAssignment]);

  // Cargar empresas desde Firestore
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesQuery = query(collection(db, 'companies'));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesData = [];
        companiesSnapshot.forEach((doc) => {
          const companyData = doc.data();
          companiesData.push({
            id: doc.id,
            nombre: companyData.name || companyData.nombre
          });
        });
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error al cargar empresas:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Filtrar tareas - solo mostrar datos si se han aplicado filtros
  const filteredTasks = useMemo(() => {
    // Si no se han aplicado filtros, retornar array vacío
    if (!filtersApplied) {
      return [];
    }

    return tasks.filter(task => {
      // Búsqueda por texto
      if (searchTerm && !task.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.asignadoA?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) {
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
  }, [tasks, filterPriority, filterAssignment, filterCompany, searchTerm, currentUser, filtersApplied]);

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

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setOpenDetailDialog(true);
  };

  const getPriorityColor = (priority) => {
    // Diseño sobrio: Solo urgente tiene color, resto gris neutro
    if (priority === 'urgente') {
      return theme.palette.error.main;
    }
    return theme.palette.grey[600];
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
    const taskDate = task.fechaVencimiento.toDate();
    const today = new Date();
    return differenceInDays(taskDate, today);
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
    // Diseño sobrio: Estado siempre gris neutro
    return theme.palette.grey[600];
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
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Total Tareas */}
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main,
                letterSpacing: 1.2,
                fontSize: '0.65rem'
              }}>
                TOTAL TAREAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1,
                fontSize: '2rem'
              }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Mis Tareas */}
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.info.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.info.main,
                letterSpacing: 1.2,
                fontSize: '0.65rem'
              }}>
                MIS TAREAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1,
                fontSize: '2rem'
              }}>
                {stats.misAsignadas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* En Progreso */}
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.warning.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.warning.main,
                letterSpacing: 1.2,
                fontSize: '0.65rem'
              }}>
                EN PROGRESO
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1,
                fontSize: '2rem'
              }}>
                {stats.enProgreso}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completadas */}
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.success.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.success.main,
                letterSpacing: 1.2,
                fontSize: '0.65rem'
              }}>
                COMPLETADAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1,
                fontSize: '2rem'
              }}>
                {stats.completadas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sin Asignar */}
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.grey[500], 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.grey[600],
                letterSpacing: 1.2,
                fontSize: '0.65rem'
              }}>
                SIN ASIGNAR
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1,
                fontSize: '2rem'
              }}>
                {stats.pendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Vencidas */}
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            height: '100%',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12)',
              borderColor: alpha(theme.palette.error.main, 0.8)
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600,
                color: theme.palette.error.main,
                letterSpacing: 1.2,
                fontSize: '0.65rem'
              }}>
                VENCIDAS
              </Typography>
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mt: 1,
                fontSize: '2rem'
              }}>
                {stats.vencidas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sistema de Filtros */}
      <TasksFilters
        searchTerm={searchTerm}
        filterPriority={filterPriority}
        filterAssignment={filterAssignment}
        filterCompany={filterCompany}
        viewMode={viewMode}
        companies={companies}
        hasFiltersChanged={!filtersApplied}
        filtersApplied={filtersApplied}
        userProfile={userProfile}
        onSearchChange={setSearchTerm}
        onPriorityChange={setFilterPriority}
        onAssignmentChange={setFilterAssignment}
        onCompanyChange={setFilterCompany}
        onViewModeChange={setViewMode}
        onApplyFilters={() => {
          setFiltersApplied(true);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setFilterPriority('all');
          setFilterAssignment(initialAssignmentFilter);
          setFilterCompany('all');
          setFiltersApplied(false);
        }}
        onRefresh={refreshTasks}
      />

      {/* Vista Grid o Kanban de Tareas */}
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
        ) : viewMode === 'kanban' ? (
          /* VISTA KANBAN */
          <Box sx={{ display: 'flex', gap: 2.5 }}>
            {['pendiente', 'asignada', 'en_progreso', 'en_revision', 'completada'].map((estado) => {
              const tareasEnEstado = filteredTasks.filter(t => t.estadoActual === estado);
              return (
                <Paper
                  key={estado}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: 2,
                    border: `2px solid ${alpha(getEstadoColor(estado), 0.3)}`,
                    bgcolor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.6)
                      : theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Header de columna */}
                  <Box sx={{
                    p: 2,
                    borderBottom: `3px solid ${getEstadoColor(estado)}`,
                    bgcolor: alpha(getEstadoColor(estado), 0.15)
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {getEstadoLabel(estado).toUpperCase()}
                      </Typography>
                      <Chip
                        label={tareasEnEstado.length}
                        size="small"
                        sx={{
                          height: 24,
                          fontWeight: 700,
                          bgcolor: getEstadoColor(estado),
                          color: '#fff'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Tareas de la columna */}
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 600, overflowY: 'auto' }}>
                    {tareasEnEstado.map((task) => (
                      <Card
                        key={task.id}
                        sx={{
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                            borderColor: alpha(theme.palette.primary.main, 0.4)
                          }
                        }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* Prioridad y menú */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Chip
                              label={task.prioridad || 'media'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: alpha(getPriorityColor(task.prioridad), 0.12),
                                color: getPriorityColor(task.prioridad)
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, task);
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Título */}
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
                            {task.titulo}
                          </Typography>

                          {/* Vencimiento */}
                          {task.fechaVencimiento && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <CalendarIcon sx={{ fontSize: 14, color: isOverdue(task) ? 'error.main' : 'text.secondary' }} />
                              <Typography variant="caption" sx={{ color: isOverdue(task) ? 'error.main' : 'text.secondary' }}>
                                {format(task.fechaVencimiento.toDate(), 'dd MMM', { locale: es })}
                              </Typography>
                            </Box>
                          )}

                          {/* Asignado */}
                          {task.asignadoA && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={task.asignadoA.photoURL} sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                                {task.asignadoA.displayName?.charAt(0) || task.asignadoA.email?.charAt(0)}
                              </Avatar>
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                {task.asignadoA.displayName || task.asignadoA.email}
                              </Typography>
                            </Box>
                          )}

                          {/* Progreso */}
                          {task.porcentajeCompletado > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              <LinearProgress
                                variant="determinate"
                                value={task.porcentajeCompletado}
                                sx={{
                                  height: 4,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                                }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {tareasEnEstado.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No hay tareas
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        ) : (
          /* VISTA GRID */
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
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              textTransform: 'uppercase',
                              bgcolor: alpha(getEstadoColor(task.estadoActual), 0.1),
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
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              textTransform: 'uppercase',
                              bgcolor: alpha(getPriorityColor(task.prioridad), 0.1),
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
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                letterSpacing: 0.3,
                                bgcolor: alpha(getDaysRemainingColor(getDaysRemaining(task)), 0.1),
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
                            fontSize: '0.8125rem',
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5
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
                                fontSize: '0.8125rem',
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

      {/* Controles de Paginación */}
      {filteredTasks.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 2, 
          mt: 4,
          pb: 2
        }}>
          <Button
            variant="outlined"
            disabled={currentPage === 1}
            onClick={previousPage}
            startIcon={<RefreshIcon sx={{ transform: 'rotate(180deg)' }} />}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Anterior
          </Button>
          
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Página {currentPage} • {filteredTasks.length} tareas
          </Typography>
          
          <Button
            variant="outlined"
            disabled={!hasMore}
            onClick={nextPage}
            endIcon={<RefreshIcon />}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Siguiente
          </Button>
        </Box>
      )}

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
