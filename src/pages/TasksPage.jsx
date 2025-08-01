import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
  AccessTime,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const designSystem = {
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)'
  },
  borderRadius: 4,
  shadows: {
    soft: '0 2px 12px rgba(0,0,0,0.08)',
    medium: '0 4px 20px rgba(0,0,0,0.12)'
  }
};

const TasksManager = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Revisar comprobantes pendientes', priority: 'high', completed: false, createdAt: new Date() },
    { id: 2, title: 'Actualizar datos de empresas', priority: 'medium', completed: false, createdAt: new Date() },
    { id: 3, title: 'Generar reporte mensual', priority: 'low', completed: true, createdAt: new Date() },
    { id: 4, title: 'Configurar notificaciones', priority: 'medium', completed: false, createdAt: new Date() }
  ]);

  const [editDialog, setEditDialog] = useState({ open: false, task: null });
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium' });

  // Simulamos persistencia local
  useEffect(() => {
    const savedTasks = localStorage.getItem('dr_dashboard_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dr_dashboard_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const task = {
        id: Date.now(),
        title: newTask.title,
        priority: newTask.priority,
        completed: false,
        createdAt: new Date()
      };
      setTasks([...tasks, task]);
      setNewTask({ title: '', priority: 'medium' });
    }
  };

  const handleToggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleEditTask = (task) => {
    setEditDialog({ open: true, task: { ...task } });
  };

  const handleSaveEdit = () => {
    setTasks(tasks.map(task => 
      task.id === editDialog.task.id ? editDialog.task : task
    ));
    setEditDialog({ open: false, task: null });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority, completed) => {
    if (completed) return <CheckCircle color="success" />;
    
    switch (priority) {
      case 'high': return <Warning color="error" />;
      case 'medium': return <AccessTime color="warning" />;
      case 'low': return <Assignment color="info" />;
      default: return <RadioButtonUnchecked />;
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h4" fontWeight="700" gutterBottom>
          Gestión de Tareas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Administra las tareas del dashboard y mantén el control de tus actividades
        </Typography>
      </motion.div>

      {/* Formulario para nueva tarea */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper sx={{ p: 3, mb: 3, borderRadius: designSystem.borderRadius, boxShadow: designSystem.shadows.medium }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Nueva Tarea
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Descripción de la tarea"
              variant="outlined"
              fullWidth
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              sx={{ minWidth: '300px', flex: 1 }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                label="Prioridad"
              >
                <MenuItem value="low">Baja</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              onClick={handleAddTask}
              startIcon={<Add />}
              sx={{
                background: designSystem.gradients.primary,
                borderRadius: designSystem.borderRadius,
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Agregar
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {/* Lista de tareas pendientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper sx={{ mb: 3, borderRadius: designSystem.borderRadius, boxShadow: designSystem.shadows.medium }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="600">
                Tareas Pendientes
              </Typography>
              <Chip 
                label={pendingTasks.length} 
                color="primary" 
                size="small"
              />
            </Box>
          </Box>
          
          <List>
            {pendingTasks.map((task) => (
              <ListItem key={task.id} divider>
                <ListItemIcon>
                  <IconButton onClick={() => handleToggleTask(task.id)}>
                    {getPriorityIcon(task.priority, task.completed)}
                  </IconButton>
                </ListItemIcon>
                
                <ListItemText
                  primary={task.title}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip 
                        label={task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'} 
                        size="small" 
                        color={getPriorityColor(task.priority)}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Creada: {new Date(task.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="edit"
                    onClick={() => handleEditTask(task)}
                    sx={{ mr: 1 }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            
            {pendingTasks.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No hay tareas pendientes"
                  primaryTypographyProps={{ 
                    color: 'text.secondary',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </motion.div>

      {/* Lista de tareas completadas */}
      {completedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Paper sx={{ borderRadius: designSystem.borderRadius, boxShadow: designSystem.shadows.medium }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="600">
                  Tareas Completadas
                </Typography>
                <Chip 
                  label={completedTasks.length} 
                  color="success" 
                  size="small"
                />
              </Box>
            </Box>
            
            <List>
              {completedTasks.map((task) => (
                <ListItem key={task.id} divider>
                  <ListItemIcon>
                    <IconButton onClick={() => handleToggleTask(task.id)}>
                      <CheckCircle color="success" />
                    </IconButton>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={task.title}
                    primaryTypographyProps={{ 
                      sx: { textDecoration: 'line-through', opacity: 0.7 }
                    }}
                    secondary={
                      <Chip 
                        label={task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'} 
                        size="small" 
                        color={getPriorityColor(task.priority)}
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </motion.div>
      )}

      {/* Dialog de edición */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, task: null })}>
        <DialogTitle>Editar Tarea</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descripción"
            fullWidth
            variant="outlined"
            value={editDialog.task?.title || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              task: { ...editDialog.task, title: e.target.value }
            })}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={editDialog.task?.priority || 'medium'}
              onChange={(e) => setEditDialog({
                ...editDialog,
                task: { ...editDialog.task, priority: e.target.value }
              })}
              label="Prioridad"
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={editDialog.task?.completed || false}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  task: { ...editDialog.task, completed: e.target.checked }
                })}
              />
            }
            label="Marcar como completada"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, task: null })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            sx={{ background: designSystem.gradients.primary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksManager;
