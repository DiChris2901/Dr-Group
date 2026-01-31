import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  IconButton,
  TextField,
  Slider,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  alpha,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useDelegatedTasks } from '../../hooks/useDelegatedTasks';

/**
 * TaskProgressDialog - Modal para actualizar progreso de tareas
 * Diseño: MODAL_DESIGN_SYSTEM.md estrictamente
 */
const TaskProgressDialog = ({ open, onClose, task }) => {
  const theme = useTheme();
  const { updateProgress } = useDelegatedTasks();
  const [loading, setLoading] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);
  const [checklistItems, setChecklistItems] = useState([]);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (task && open) {
      setPorcentaje(task.porcentajeCompletado || 0);
      setChecklistItems(task.checklistItems || []);
      setComentario('');
      setError('');
    }
  }, [task, open]);

  const handleChecklistChange = (index) => {
    const newItems = [...checklistItems];
    newItems[index] = {
      ...newItems[index],
      completado: !newItems[index].completado
    };
    setChecklistItems(newItems);

    // Calcular porcentaje automáticamente basado en checklist
    if (newItems.length > 0) {
      const completados = newItems.filter(item => item.completado).length;
      const nuevoPorcentaje = Math.round((completados / newItems.length) * 100);
      setPorcentaje(nuevoPorcentaje);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await updateProgress(task.id, porcentaje, checklistItems);
      onClose();
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      setError('Error al actualizar el progreso. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
      {/* HEADER EXACTO SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogTitle sx={{ 
        pt: 2,
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
            <TrendingUpIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              mb: 0,
              color: 'text.primary'
            }}>
              Actualizar Progreso
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Registrar avance de la tarea
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 4 }}>
        {/* Información de la tarea */}
        <Paper sx={{ 
          p: 3, 
          mt: 3,
          mb: 4,
          borderRadius: 2, 
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
              {task.titulo}
            </Typography>
            <Chip
              label={task.prioridad?.toUpperCase()}
              size="small"
              sx={{
                bgcolor: alpha(getPriorityColor(task.prioridad), 0.1),
                color: getPriorityColor(task.prioridad),
                fontWeight: 600,
                border: `1px solid ${alpha(getPriorityColor(task.prioridad), 0.3)}`
              }}
            />
          </Box>
          
          {task.descripcion && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {task.descripcion}
            </Typography>
          )}
        </Paper>

        {/* Control de progreso */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2, 
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          background: theme.palette.background.paper,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Typography variant="overline" sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            letterSpacing: 0.8,
            mb: 2,
            display: 'block'
          }}>
            PORCENTAJE DE COMPLETADO
          </Typography>

          <Box sx={{ px: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progreso
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {porcentaje}%
              </Typography>
            </Box>
            <Slider
              value={porcentaje}
              onChange={(e, value) => setPorcentaje(value)}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              sx={{
                '& .MuiSlider-thumb': {
                  width: 20,
                  height: 20
                },
                '& .MuiSlider-track': {
                  height: 8
                },
                '& .MuiSlider-rail': {
                  height: 8,
                  opacity: 0.3
                }
              }}
            />
            <LinearProgress
              variant="determinate"
              value={porcentaje}
              sx={{
                height: 12,
                borderRadius: 1,
                mt: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1
                }
              }}
            />
          </Box>

          {/* Checklist si existe */}
          {checklistItems.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="overline" sx={{ 
                fontWeight: 600, 
                color: 'text.secondary',
                letterSpacing: 0.8,
                mb: 1.5,
                display: 'block'
              }}>
                LISTA DE VERIFICACIÓN ({checklistItems.filter(i => i.completado).length}/{checklistItems.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {checklistItems.map((item, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={item.completado}
                        onChange={() => handleChecklistChange(index)}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleIcon />}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: item.completado ? 'line-through' : 'none',
                          color: item.completado ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {item.texto || item.label || 'Sin descripción'}
                      </Typography>
                    }
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Comentario opcional */}
          <TextField
            fullWidth
            label="Comentario (opcional)"
            placeholder="Describe el progreso realizado..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </Paper>

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      {/* FOOTER EXACTO SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogActions sx={{ 
        p: 2.5, 
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50]
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={<TrendingUpIcon />}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {loading ? 'Actualizando...' : 'Actualizar Progreso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskProgressDialog;
