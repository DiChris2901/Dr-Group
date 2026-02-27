import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  HelpOutline as HelpIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  ViewKanban as KanbanIcon,
  GridView as GridIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * TasksGuideModal - Modal de ayuda contextual para la página de tareas
 * Muestra instrucciones y guía según los permisos del usuario
 * Diseño sobrio empresarial siguiendo MODAL_DESIGN_SYSTEM.md
 */
const TasksGuideModal = ({ open, onClose, userPermissions }) => {
  const theme = useTheme();

  // Determinar permisos del usuario
  const hasPermissionVerTodas = userPermissions?.['tareas.ver_todas'] || 
                                (Array.isArray(userPermissions) && 
                                 userPermissions.includes('tareas.ver_todas'));
  
  const canCreate = hasPermissionVerTodas || userPermissions?.['tareas'];

  // Estados del sistema con colores
  const estados = [
    { 
      label: 'Sin Asignar', 
      color: theme.palette.info.main, 
      descripcion: 'Tarea creada pero aún no asignada a nadie'
    },
    { 
      label: 'Asignada', 
      color: theme.palette.warning.main, 
      descripcion: 'Tarea asignada a un usuario pero sin iniciar'
    },
    { 
      label: 'En Progreso', 
      color: theme.palette.secondary.main, 
      descripcion: 'Usuario trabajando activamente en la tarea'
    },
    { 
      label: 'En Revisión', 
      color: theme.palette.primary.main, 
      descripcion: 'Trabajo completado, esperando aprobación'
    },
    { 
      label: 'Completada', 
      color: theme.palette.success.main, 
      descripcion: 'Tarea aprobada y cerrada exitosamente'
    },
    {
      label: 'Traslado Pendiente',
      color: theme.palette.error.main,
      descripcion: 'Usuario solicitó reasignación (requiere aprobación)'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
      {/* HEADER */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              width: 44,
              height: 44
            }}
          >
            <HelpIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Guía de Uso: Gestión de Tareas
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Aprende cómo funciona el sistema de tareas
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: 'error.main'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 0, pb: 3, maxHeight: '70vh', overflowY: 'auto' }}>
        {/* ¿QUÉ SON LAS TAREAS? */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3.5,
            mb: 3,
            mt: 5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderColor: alpha(theme.palette.divider, 0.3)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48
              }}
            >
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                ¿Qué son las Tareas?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Concepto básico
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, pl: 0.5 }}>
            Las tareas son actividades o trabajos que se pueden <Box component="span" sx={{ fontWeight: 700 }}>asignar a diferentes personas</Box> del equipo.
            Puedes hacer seguimiento del avance, agregar comentarios, adjuntar archivos y ver el progreso en tiempo real.
          </Typography>
        </Paper>

        {/* ESTADOS Y FLUJO */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3.5,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.secondary.main, 0.02),
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
              borderColor: alpha(theme.palette.divider, 0.3)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                width: 48,
                height: 48
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Estados de una Tarea
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ciclo de vida
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, pl: 0.5, lineHeight: 1.8 }}>
            Cada tarea pasa por diferentes estados durante su ciclo de vida:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {estados.map((estado, index) => (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(estado.color, 0.05),
                  border: `1px solid ${alpha(estado.color, 0.15)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(estado.color, 0.08),
                    borderColor: alpha(estado.color, 0.25)
                  }
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: estado.color,
                    boxShadow: `0 0 0 4px ${alpha(estado.color, 0.15)}`
                  }}
                />
                <Chip
                  label={estado.label}
                  size="small"
                  sx={{
                    bgcolor: alpha(estado.color, 0.12),
                    color: estado.color,
                    fontWeight: 700,
                    minWidth: 115,
                    borderRadius: 1.5,
                    fontSize: '0.75rem',
                    height: 28,
                    border: `1px solid ${alpha(estado.color, 0.2)}`
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, lineHeight: 1.6 }}>
                  {estado.descripcion}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* CÓMO USAR LA PÁGINA */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3.5,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.success.main, 0.02),
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.success.main, 0.04),
              borderColor: alpha(theme.palette.divider, 0.3)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                width: 48,
                height: 48
              }}
            >
              <VisibilityIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {hasPermissionVerTodas ? '¿Qué puedes hacer aquí?' : 'Cómo usar tus tareas'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {hasPermissionVerTodas ? 'Acceso completo' : 'Acceso básico'}
              </Typography>
            </Box>
          </Box>

          {hasPermissionVerTodas && (
            <>
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                borderRadius: 1.5, 
                bgcolor: alpha(theme.palette.info.main, 0.06),
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main', mb: 0.5 }}>
                  🎯 Acceso Completo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Tienes permisos para ver, crear y gestionar todas las tareas del sistema
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Crear tareas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Usa el botón "Nueva Tarea" en el header para asignar trabajos a tu equipo
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Ver todas las tareas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Puedes filtrar por "Todas", "Mías", "Creadas por mí" o "Sin Asignar"
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Gestionar tareas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Reasignar, actualizar progreso, aprobar o rechazar traslados
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Hacer seguimiento
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Revisa el progreso, comentarios y archivos adjuntos de cualquier tarea
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}

          {!hasPermissionVerTodas && (
            <>
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                borderRadius: 1.5, 
                bgcolor: alpha(theme.palette.warning.main, 0.06),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main', mb: 0.5 }}>
                  👤 Acceso Personal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Solo puedes ver y gestionar las tareas asignadas a ti
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Ver tus tareas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      En la lista solo aparecerán las tareas asignadas a ti
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Actualizar progreso
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Haz clic en el menú (⋮) y selecciona "Actualizar Progreso"
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Cambiar estado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Indica si estás trabajando, en revisión o completaste la tarea
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Solicitar traslado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Si no puedes completar la tarea, puedes pedir reasignarla
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Paper>

        {/* VISTAS DISPONIBLES */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3.5,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.info.main, 0.02),
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderColor: alpha(theme.palette.divider, 0.3)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                width: 48,
                height: 48
              }}
            >
              <KanbanIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Modos de Vista
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Visualización flexible
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, pl: 0.5, lineHeight: 1.8 }}>
            Puedes cambiar cómo visualizar las tareas:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2.5,
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.info.main, 0.05),
                borderColor: alpha(theme.palette.info.main, 0.2),
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.12)}`
              }
            }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.grey[600], 0.1),
                  color: theme.palette.grey[700],
                  width: 44,
                  height: 44
                }}
              >
                <GridIcon sx={{ fontSize: 24 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, fontSize: '0.9375rem' }}>
                  Vista Grid (Tarjetas)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.7 }}>
                  Muestra todas las tareas como tarjetas, ideal para ver detalles rápidamente
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2.5,
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.info.main, 0.05),
                borderColor: alpha(theme.palette.info.main, 0.2)
              }
            }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.grey[600], 0.1),
                  color: theme.palette.grey[700],
                  width: 44,
                  height: 44
                }}
              >
                <KanbanIcon sx={{ fontSize: 24 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, fontSize: '0.9375rem' }}>
                  Vista Kanban (Columnas)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.7 }}>
                  Organiza las tareas por estado en columnas, ideal para ver el flujo de trabajo
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* FILTROS Y BÚSQUEDA */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3.5,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.warning.main, 0.02),
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.warning.main, 0.04),
              borderColor: alpha(theme.palette.divider, 0.3)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                width: 48,
                height: 48
              }}
            >
              <SearchIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Filtros y Búsqueda
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Encuentra rápidamente
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, pl: 0.5, lineHeight: 1.8 }}>
            Encuentra rápidamente lo que buscas:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                borderColor: alpha(theme.palette.warning.main, 0.2)
              }
            }}>
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <SearchIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Buscar por texto
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Escribe palabras clave para buscar en títulos y descripciones
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                borderColor: alpha(theme.palette.warning.main, 0.2)
              }
            }}>
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <FlagIcon sx={{ fontSize: 18, color: 'error.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Filtrar por prioridad
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Urgente, Alta, Media o Baja
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                borderColor: alpha(theme.palette.warning.main, 0.2)
              }
            }}>
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <PersonIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Filtrar por asignación
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Todas, mías, creadas por mí o sin asignar (según permisos)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.04),
                borderColor: alpha(theme.palette.warning.main, 0.2)
              }
            }}>
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <BusinessIcon sx={{ fontSize: 18, color: 'success.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Filtrar por empresa
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Si hay tareas de diferentes empresas
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.error.main, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
              transition: 'all 0.2s ease'
            }}>
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.error.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 18, color: 'error.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', mb: 0.5 }}>
                  ⚠️ Recuerda: Aplicar Filtros
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Después de configurar filtros, haz clic en "Aplicar" para ver resultados
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* ACCIONES DISPONIBLES */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3.5,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderColor: alpha(theme.palette.divider, 0.3)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 48,
                height: 48
              }}
            >
              <AssignmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Acciones Disponibles
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Menú (⋮) de cada tarea
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, pl: 0.5, lineHeight: 1.8 }}>
            Cada tarea tiene un menú con estas opciones:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}>
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <VisibilityIcon sx={{ fontSize: 16, color: 'info.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Ver Detalles
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Muestra información completa, archivos adjuntos y historial de cambios
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 2,
              p: 2,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: alpha(theme.palette.primary.main, 0.2)
              }
            }}>
              <Box
                sx={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 0.25
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Actualizar Progreso (Bitácora)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                  Cambia el estado, agrega comentarios y adjunta evidencias de avance
                </Typography>
              </Box>
            </Box>
            {hasPermissionVerTodas && (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.warning.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Reasignar
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Cambia el usuario responsable de la tarea
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <EditIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Editar
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Modifica título, descripción, prioridad o fecha de vencimiento
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: alpha(theme.palette.primary.main, 0.2)
                  }
                }}>
                  <Box
                    sx={{
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.error.main, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.25
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Eliminar
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.7 }}>
                      Borra permanentemente la tarea (requiere confirmación)
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Paper>

        {/* TIP FINAL */}
        <Box sx={{ 
          p: 3,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: alpha(theme.palette.info.main, 0.08),
            borderColor: alpha(theme.palette.info.main, 0.3)
          }
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.15),
                color: 'info.main',
                width: 44,
                height: 44,
                fontSize: '1.5rem'
              }}
            >
              💡
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'info.main', mb: 1, fontSize: '0.9375rem' }}>
                Consejo Útil
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                El sistema de Bitácora (Actualizar Progreso) es clave para documentar avances. Agrega comentarios y evidencias cada vez que cambies el estado de una tarea.
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 1,
            px: 3,
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            }
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TasksGuideModal;
