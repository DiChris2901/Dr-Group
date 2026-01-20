import React, { useState } from 'react';
import {
  Menu,
  MenuList,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha,
  useTheme,
  Button,
  Tooltip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Avatar,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Task as TaskIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  Flag as PriorityIcon,
  Schedule as DueSoonIcon,
  Warning as OverdueIcon,
  CalendarToday as CalendarIcon,
  Label as TagIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../context/AuthContext';

const TasksMenu = ({ anchorEl, open, onClose }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { 
    tasks, 
    loading, 
    pendingTasksCount, 
    completedTasksCount,
    highPriorityPendingCount,
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskComplete,
    getRecentTasks,
    getOverdueTasks,
    getUpcomingTasks
  } = useTasks();
  
  const [allTasksModalOpen, setAllTasksModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium',
    dueDate: '',
    tags: []
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const recentTasks = getRecentTasks(5);
  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks();

  const priorities = [
    { value: 'high', label: 'Alta', color: '#d32f2f', icon: '🔴' },
    { value: 'medium', label: 'Media', color: '#f57c00', icon: '🟡' },
    { value: 'low', label: 'Baja', color: '#388e3c', icon: '🟢' }
  ];

  const handleOpenTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd\'T\'HH:mm') : '',
        tags: task.tags || []
      });
    } else {
      setEditingTask(null);
      setTaskForm({ 
        title: '', 
        description: '', 
        priority: 'medium',
        dueDate: '',
        tags: []
      });
    }
    setTaskModalOpen(true);
    onClose();
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', tags: [] });
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return;

    try {
      const taskData = {
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : null
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      handleCloseTaskModal();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await toggleTaskComplete(taskId);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const p = priorities.find(p => p.value === priority);
    return p ? p.color : '#616161';
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return '';
    
    if (isToday(dueDate)) {
      return `Hoy ${format(dueDate, 'HH:mm')}`;
    } else if (isTomorrow(dueDate)) {
      return `Mañana ${format(dueDate, 'HH:mm')}`;
    } else {
      return format(dueDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const getTasksByTab = () => {
    let filteredTasks = tasks;
    
    // Filtrar por tab
    switch (currentTab) {
      case 0: // Pendientes
        filteredTasks = tasks.filter(task => !task.completed);
        break;
      case 1: // Completadas
        filteredTasks = tasks.filter(task => task.completed);
        break;
      case 2: // Vencidas
        filteredTasks = overdueTasks;
        break;
      default:
        break;
    }
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por prioridad
    if (filterPriority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }
    
    return filteredTasks;
  };

  const getCompletionRate = () => {
    const totalTasks = pendingTasksCount + completedTasksCount;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasksCount / totalTasks) * 100);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 520,
            mt: 1.5,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: theme.palette.background.paper
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="600" sx={{ letterSpacing: '-0.01em' }}>
              Mis Tareas
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {highPriorityPendingCount > 0 && (
                <Chip
                  label={`${highPriorityPendingCount} alta`}
                  size="small"
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    bgcolor: alpha(theme.palette.error.main, 0.15),
                    color: 'error.main',
                    fontWeight: 600
                  }}
                />
              )}
              <Chip
                label={pendingTasksCount}
                size="small"
                sx={{ 
                  minWidth: 24,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
          
          {/* Barra de progreso */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="500">
                Progreso: {getCompletionRate()}%
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="500">
                {completedTasksCount}/{pendingTasksCount + completedTasksCount}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getCompletionRate()} 
              sx={{ 
                borderRadius: 1,
                height: 7,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  borderRadius: 1
                }
              }}
            />
          </Box>
          
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskModal()}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.25,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Nueva Tarea
          </Button>
        </Box>

        <MenuList sx={{ p: 0, maxHeight: 280, overflowY: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Cargando tareas..." />
            </ListItem>
          ) : recentTasks.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="Sin tareas pendientes" 
                secondary="¡Excelente trabajo! 🎉"
                sx={{ textAlign: 'center', py: 2 }}
              />
            </ListItem>
          ) : (
            recentTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ListItem
                  sx={{
                    py: 2,
                    px: 2.5,
                    borderLeft: `6px solid ${getPriorityColor(task.priority)}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    opacity: task.completed ? 0.6 : 1,
                    position: 'relative',
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      boxShadow: `inset 0 0 0 1px ${alpha(getPriorityColor(task.priority), 0.2)}`,
                      transform: 'translateX(2px)',
                      opacity: task.completed ? 0.7 : 1
                    }
                  }}
                  onClick={() => handleOpenTaskModal(task)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      checked={task.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id);
                      }}
                      size="small"
                      color="primary"
                      sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }}
                    />
                  </ListItemIcon>
                  
                  <Box sx={{ width: '100%', minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight="600" 
                        noWrap
                        sx={{ 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          flex: 1,
                          color: 'text.primary',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {task.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        sx={{ 
                          ml: 1, 
                          opacity: 0.5,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            opacity: 1, 
                            color: 'error.main',
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            transform: 'scale(1.1)'
                          } 
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {task.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mt: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {task.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={priorities.find(p => p.value === task.priority)?.icon}
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 18,
                          bgcolor: alpha(getPriorityColor(task.priority), 0.1),
                          color: getPriorityColor(task.priority)
                        }}
                      />
                      
                      {task.dueDate && (
                        <Typography 
                          variant="caption" 
                          color={
                            task.dueDate < new Date() && !task.completed 
                              ? 'error.main' 
                              : 'text.disabled'
                          }
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <CalendarIcon sx={{ fontSize: 12 }} />
                          {formatDueDate(task.dueDate)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ListItem>
                <Divider />
              </motion.div>
            ))
          )}
        </MenuList>

        {tasks.length > 5 && (
          <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              fullWidth
              startIcon={<TaskIcon />}
              onClick={() => {
                setAllTasksModalOpen(true);
                onClose();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                color: 'text.secondary',
                py: 1,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  color: 'primary.main'
                }
              }}
            >
              Ver todas las tareas ({tasks.length})
            </Button>
          </Box>
        )}
      </Menu>

      {/* Modal para crear/editar tarea */}
      <Dialog
        open={taskModalOpen}
        onClose={handleCloseTaskModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              color: 'primary.main'
            }}>
              <TaskIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="600" sx={{ letterSpacing: '-0.01em' }}>
              {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseTaskModal}
            sx={{ 
              '&:hover': { 
                bgcolor: alpha(theme.palette.error.main, 0.08),
                color: 'error.main'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Título *"
              fullWidth
              variant="outlined"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              sx={{ 
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          
          <TextField
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            sx={{ 
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={taskForm.priority}
                label="Prioridad"
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                sx={{
                  borderRadius: 2
                }}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority.value} value={priority.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{priority.icon}</span>
                      {priority.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha límite"
              type="datetime-local"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          background: theme.palette.mode === 'dark' 
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1.5
        }}>
          <Button 
            onClick={handleCloseTaskModal}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTask}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!taskForm.title.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
              }
            }}
          >
            {editingTask ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para ver todas las tareas */}
      <Dialog
        open={allTasksModalOpen}
        onClose={() => setAllTasksModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, height: '85vh' }
        }}
      >
        <DialogTitle>
          Gestión de Tareas
          <IconButton
            onClick={() => setAllTasksModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab 
                label={
                  <Badge badgeContent={pendingTasksCount} color="primary" max={99}>
                    Pendientes
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={completedTasksCount} color="success" max={99}>
                    Completadas
                  </Badge>
                } 
              />
              <Tab 
                label={
                  <Badge badgeContent={overdueTasks.length} color="error" max={99}>
                    Vencidas
                  </Badge>
                } 
              />
            </Tabs>
          </Box>

          {/* Filtros */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ flex: 1 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={filterPriority}
                  label="Prioridad"
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.icon} {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Lista de tareas */}
          <Box sx={{ p: 2, height: 'calc(85vh - 200px)', overflowY: 'auto' }}>
            {getTasksByTab().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TaskIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay tareas que mostrar
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setAllTasksModalOpen(false);
                    handleOpenTaskModal();
                  }}
                  sx={{ mt: 2 }}
                >
                  Crear primera tarea
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {getTasksByTab().map((task) => (
                  <Card
                    key={task.id}
                    sx={{
                      borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: theme.shadows[4] },
                      opacity: task.completed ? 0.8 : 1
                    }}
                    onClick={() => {
                      setAllTasksModalOpen(false);
                      handleOpenTaskModal(task);
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Checkbox
                          checked={task.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task.id);
                          }}
                          color="primary"
                        />
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight="600" 
                            sx={{ 
                              textDecoration: task.completed ? 'line-through' : 'none',
                              mb: 1
                            }}
                          >
                            {task.title}
                          </Typography>
                          
                          {task.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {task.description}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${priorities.find(p => p.value === task.priority)?.icon} ${priorities.find(p => p.value === task.priority)?.label}`}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(getPriorityColor(task.priority), 0.1),
                                color: getPriorityColor(task.priority)
                              }}
                            />
                            
                            {task.dueDate && (
                              <Chip
                                label={formatDueDate(task.dueDate)}
                                size="small"
                                color={
                                  task.dueDate < new Date() && !task.completed 
                                    ? 'error' 
                                    : 'default'
                                }
                                icon={<CalendarIcon />}
                              />
                            )}
                            
                            <Typography variant="caption" color="text.disabled">
                              {formatDistanceToNow(task.updatedAt, { addSuffix: true, locale: es })}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TasksMenu;