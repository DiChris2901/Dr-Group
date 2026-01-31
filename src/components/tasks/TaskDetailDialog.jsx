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
  Grid,
  Button,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * TaskDetailDialog - Modal de vista de detalles de tarea
 * Diseño: Siguiendo MODAL_DESIGN_SYSTEM.md estrictamente
 * Patrón: Modal de VISTA (solo lectura, sin edición)
 */
const TaskDetailDialog = ({ open, onClose, task }) => {
  const theme = useTheme();
  const [empresaData, setEmpresaData] = useState(null);

  // La empresa ya viene completa con logo desde Firestore
  useEffect(() => {
    if (task?.empresa) {
      setEmpresaData(task.empresa);
    } else {
      setEmpresaData(null);
    }
  }, [task]);

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

  const getPriorityLabel = (priority) => {
    const labels = {
      urgente: 'Urgente',
      alta: 'Alta',
      media: 'Media',
      baja: 'Baja'
    };
    return labels[priority] || priority;
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Sin Asignar',
      asignada: 'Asignada',
      en_progreso: 'En Progreso',
      en_revision: 'En Revisión',
      completada: 'Completada',
      cancelada: 'Cancelada',
      traslado_pendiente: 'Traslado Pendiente'
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
      cancelada: theme.palette.error.main,
      traslado_pendiente: theme.palette.error.main
    };
    return colors[estado] || theme.palette.grey[300];
  };

  const isOverdue = () => {
    if (!task.fechaVencimiento || task.estadoActual === 'completada' || task.estadoActual === 'cancelada') {
      return false;
    }
    return isBefore(task.fechaVencimiento.toDate(), new Date());
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No definida';
    return format(timestamp.toDate(), "dd 'de' MMMM yyyy", { locale: es });
  };

  // Constantes de estilo según MODAL_DESIGN_SYSTEM.md
  const CARD_STYLES = {
    primary: {
      p: 3,
      borderRadius: 2,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    secondary: {
      p: 3.5,
      borderRadius: 2,
      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }
  };

  const OVERLINE_STYLES = {
    primary: {
      fontWeight: 600,
      color: 'primary.main',
      letterSpacing: 0.8,
      fontSize: '0.75rem'
    },
    secondary: {
      fontWeight: 600,
      color: 'secondary.main',
      letterSpacing: 0.8,
      fontSize: '0.75rem'
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
            <VisibilityIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              mb: 0,
              color: 'text.primary'
            }}>
              Detalle de la Tarea
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {task.titulo}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 5 }}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* INFORMACIÓN PRINCIPAL - 8 columnas según MODAL_DESIGN_SYSTEM.md */}
            <Grid item xs={12} md={8}>
              <Paper sx={CARD_STYLES.primary}>
                <Typography variant="overline" sx={OVERLINE_STYLES.primary}>
                  <AssignmentIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Información General
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {/* Título */}
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Título
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {task.titulo}
                    </Typography>
                  </Grid>

                  {/* Descripción */}
                  {task.descripcion && (
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}>
                        Descripción
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                        {task.descripcion}
                      </Typography>
                    </Grid>
                  )}

                  {/* Estado y Prioridad */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Estado
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label={getEstadoLabel(task.estadoActual)}
                        sx={{ 
                          bgcolor: alpha(getEstadoColor(task.estadoActual), 0.1),
                          color: getEstadoColor(task.estadoActual),
                          fontWeight: 600,
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Prioridad
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: getPriorityColor(task.prioridad)
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getPriorityLabel(task.prioridad)}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Progreso */}
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Progreso
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={task.porcentajeCompletado || 0}
                        sx={{ 
                          flex: 1, 
                          height: 8, 
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 45 }}>
                        {task.porcentajeCompletado || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* INFORMACIÓN LATERAL - 4 columnas según MODAL_DESIGN_SYSTEM.md */}
            <Grid item xs={12} md={4}>
              <Paper sx={CARD_STYLES.secondary}>
                <Typography variant="overline" sx={OVERLINE_STYLES.secondary}>
                  <CalendarIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Detalles
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Creado por */}
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Creado por
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {task.creadoPor?.nombre || 'No especificado'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Asignado a */}
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Asignado a
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {task.asignadoA?.nombre || 'Sin asignar'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Empresa */}
                  {task.empresa && (
                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}>
                        Empresa
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {empresaData?.logoURL ? (
                          <Avatar
                            src={empresaData.logoURL}
                            alt={empresaData.nombre}
                            sx={{ 
                              width: 20, 
                              height: 20,
                              '& img': {
                                objectFit: 'contain'
                              }
                            }}
                          />
                        ) : (
                          <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                        <Typography variant="body2">
                          {empresaData?.nombre || 'Sin empresa'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Fecha de vencimiento */}
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Vencimiento
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ 
                        fontSize: 16, 
                        color: isOverdue() ? 'error.main' : 'text.secondary' 
                      }} />
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: isOverdue() ? 'error.main' : 'text.primary',
                          fontWeight: isOverdue() ? 600 : 400
                        }}
                      >
                        {formatDate(task.fechaVencimiento)}
                        {isOverdue() && ' (Vencida)'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Fecha de creación */}
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      Fecha de Creación
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDate(task.fechaCreacion)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <Divider />

      {/* ACTIONS SEGÚN MODAL_DESIGN_SYSTEM.md */}
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog;
