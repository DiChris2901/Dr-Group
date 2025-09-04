import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AddEventModal = ({ open, onClose, selectedDate, onSave }) => {
  const theme = useTheme();
  
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    priority: 'medium' // low, medium, high
  });

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
    
    const newEvent = {
      ...eventData,
      date: selectedDate,
      id: Date.now().toString(),
      createdAt: new Date(),
      type: 'custom' // Tipo fijo para eventos personalizados
    };
    
    onSave(newEvent);
    handleClose();
  };

  const handleClose = () => {
    setEventData({
      title: '',
      description: '',
      priority: 'medium'
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
      maxWidth="sm"
      fullWidth
      component={motion.div}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      PaperProps={{
        sx: {
          borderRadius: 1, // 8px - esquinas menos redondeadas
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' // Sombra más sobria
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, // Reducir padding inferior del header
        backgroundColor: 'background.paper', // Fondo sobrio
        borderBottom: `1px solid ${theme.palette.divider}` // Solo borde inferior
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <EventIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              Agregar Evento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </Typography>
          </Box>
        </Box>
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
          startIcon={<SaveIcon />}
          variant="contained"
          color="primary"
        >
          Guardar Evento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEventModal;
