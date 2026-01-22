import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  useTheme,
  FormControlLabel,
  Checkbox,
  Avatar,
  IconButton,
  alpha
} from '@mui/material';
import {
  Event as EventIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AddEventModal = ({ open, onClose, selectedDate, onSave, editingEvent }) => {
  const theme = useTheme();
  const isEditing = !!editingEvent;
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    priority: 'medium', // low, medium, high
    subType: 'personal', // personal, business, reminder
    allDay: true,
    notifications: [
      { time: 10, unit: 'minutes', enabled: true }
    ],
    recurrence: {
      enabled: false,
      frequency: 'none',
      endDate: null
    }
  });

  // Cargar datos del evento cuando se está editando
  useEffect(() => {
    if (editingEvent) {
      setEventData({
        title: editingEvent.title || '',
        description: editingEvent.description || '',
        priority: editingEvent.priority || 'medium',
        subType: editingEvent.subType || 'personal',
        allDay: editingEvent.allDay !== undefined ? editingEvent.allDay : true,
        notifications: editingEvent.notifications || [{ time: 10, unit: 'minutes', enabled: true }],
        recurrence: editingEvent.recurrence || { enabled: false, frequency: 'none', endDate: null }
      });
    } else {
      setEventData({
        title: '',
        description: '',
        priority: 'medium',
        subType: 'personal',
        allDay: true,
        notifications: [{ time: 10, unit: 'minutes', enabled: true }],
        recurrence: { enabled: false, frequency: 'none', endDate: null }
      });
    }
  }, [editingEvent]);

  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!eventData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    const eventToSave = {
      ...eventData,
      date: selectedDate,
      type: 'custom' // Tipo fijo para eventos personalizados
    };
    
    // NO agregamos ID aquí porque Firestore lo genera automáticamente
    // Solo agregamos createdAt si es un evento nuevo
    if (!isEditing) {
      eventToSave.createdAt = new Date();
    }
    
    onSave(eventToSave);
    handleClose();
  };

  const handleClose = () => {
    setEventData({
      title: '',
      description: '',
      priority: 'medium',
      subType: 'personal',
      allDay: true,
      notifications: [{ time: 10, unit: 'minutes', enabled: true }],
      recurrence: { enabled: false, frequency: 'none', endDate: null }
    });
    setErrors({});
    onClose();
  };

  const priorityOptions = [
    { value: 'low', label: 'Baja', color: '#4caf50' },
    { value: 'medium', label: 'Media', color: '#ff9800' },
    { value: 'high', label: 'Alta', color: '#f44336' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      component={motion.div}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            {isEditing ? <EditIcon /> : <EventIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
              {isEditing ? 'Editar Evento' : 'Nuevo Evento'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: 3, pb: 3 }}>
        {/* Espaciador manual */}
        <Box sx={{ height: 30 }} />
        
        <Stack spacing={3}>
          {/* Título del evento */}
          <TextField
            fullWidth
            label="Título del evento"
            value={eventData.title}
            onChange={handleInputChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            variant="outlined"
            placeholder="Ej: Reunión con cliente, Recordatorio de pago..."
          />

          {/* Prioridad */}
          <FormControl fullWidth>
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={eventData.priority}
              label="Prioridad"
              onChange={handleInputChange('priority')}
            >
              {priorityOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Chip 
                    label={option.label}
                    size="small"
                    sx={{ 
                      backgroundColor: `${option.color}20`,
                      color: option.color,
                      fontWeight: 500
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Descripción */}
          <TextField
            fullWidth
            label="Descripción (opcional)"
            value={eventData.description}
            onChange={handleInputChange('description')}
            variant="outlined"
            multiline
            rows={3}
            placeholder="Detalles adicionales del evento..."
          />

          {/* Notificaciones */}
          <Box sx={{ 
            border: `1px solid ${theme.palette.divider}`, 
            borderRadius: 1, 
            p: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <NotificationsIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Alertas
                </Typography>
              </Box>
              <Chip 
                label={eventData.notifications.filter(n => n.enabled).length} 
                size="small" 
                color="primary"
                sx={{ minWidth: 32, height: 24 }}
              />
            </Box>
            
            <Stack spacing={1.5}>
              {[
                { time: 0, unit: 'minutes', label: 'A la hora del evento', icon: '🔔' },
                { time: 10, unit: 'minutes', label: '10 minutos antes', icon: '⏱️' },
                { time: 1, unit: 'hours', label: '1 hora antes', icon: '⏰' },
                { time: 1, unit: 'days', label: '1 día antes', icon: '📅' }
              ].map((notif) => {
                const isActive = eventData.notifications.some(
                  n => n.time === notif.time && n.unit === notif.unit && n.enabled
                );
                
                return (
                  <FormControlLabel
                    key={`${notif.time}-${notif.unit}`}
                    control={
                      <Checkbox
                        checked={isActive}
                        onChange={(e) => {
                          setEventData(prev => {
                            const existingIndex = prev.notifications.findIndex(
                              n => n.time === notif.time && n.unit === notif.unit
                            );
                            
                            let newNotifications;
                            if (existingIndex >= 0) {
                              newNotifications = [...prev.notifications];
                              newNotifications[existingIndex] = {
                                ...newNotifications[existingIndex],
                                enabled: e.target.checked
                              };
                            } else {
                              newNotifications = [...prev.notifications, { ...notif, enabled: true }];
                            }
                            
                            return { ...prev, notifications: newNotifications };
                          });
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {notif.icon} {notif.label}
                      </Typography>
                    }
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Recurrencia */}
          <Box sx={{ 
            border: `1px solid ${theme.palette.divider}`, 
            borderRadius: 1, 
            p: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={eventData.recurrence.enabled}
                  onChange={(e) => setEventData(prev => ({
                    ...prev,
                    recurrence: {
                      ...prev.recurrence,
                      enabled: e.target.checked
                    }
                  }))}
                  color="primary"
                />
              }
              label={
                <Typography variant="subtitle2" fontWeight={600}>
                  🔄 Repetir evento
                </Typography>
              }
            />

            {eventData.recurrence.enabled && (
              <Stack spacing={2} mt={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Frecuencia</InputLabel>
                  <Select
                    value={eventData.recurrence.frequency}
                    label="Frecuencia"
                    onChange={(e) => setEventData(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence,
                        frequency: e.target.value
                      }
                    }))}
                  >
                    <MenuItem value="daily">📅 Diario</MenuItem>
                    <MenuItem value="weekly">📆 Semanal</MenuItem>
                    <MenuItem value="monthly">🗓️ Mensual</MenuItem>
                    <MenuItem value="yearly">📋 Anual</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Finaliza el"
                  type="date"
                  value={eventData.recurrence.endDate 
                    ? format(new Date(eventData.recurrence.endDate), 'yyyy-MM-dd')
                    : ''
                  }
                  onChange={(e) => {
                    const newEndDate = e.target.value ? new Date(e.target.value) : null;
                    setEventData(prev => ({
                      ...prev,
                      recurrence: {
                        ...prev.recurrence,
                        endDate: newEndDate
                      }
                    }));
                  }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Fecha límite de la recurrencia"
                />
              </Stack>
            )}
          </Box>

          {/* Información adicional */}
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            <Typography variant="body2">
              Los eventos se mostrarán en el calendario y podrás convertirlos en compromisos cuando sea necesario.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          startIcon={<CancelIcon />}
          color="inherit"
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          startIcon={isEditing ? <EditIcon /> : <SaveIcon />}
          variant="contained"
          color="primary"
        >
          {isEditing ? 'Actualizar Evento' : 'Guardar Evento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEventModal;
