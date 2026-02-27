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
  Schedule as ScheduleIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DocumentPreviewModal from '../common/DocumentPreviewModal';

/**
 * TaskDetailDialog - Modal de vista de detalles de tarea
 * Diseño: Siguiendo MODAL_DESIGN_SYSTEM.md estrictamente
 * Patrón: Modal de VISTA (solo lectura, sin edición)
 */
const TaskDetailDialog = ({ open, onClose, task }) => {
  const theme = useTheme();
  const [empresasData, setEmpresasData] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Normalizar empresas a array (soporta empresa única o múltiple)
  useEffect(() => {
    if (task?.empresa) {
      if (Array.isArray(task.empresa)) {
        // Ya es un array de empresas
        setEmpresasData(task.empresa);
      } else if (typeof task.empresa === 'object' && task.empresa !== null) {
        // Es un objeto único, convertir a array
        setEmpresasData([task.empresa]);
      } else {
        setEmpresasData([]);
      }
    } else {
      setEmpresasData([]);
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

  const getFileIcon = (tipo) => {
    if (tipo === 'application/pdf') return <PdfIcon />;
    if (tipo === 'application/zip') return <ZipIcon />;
    if (tipo?.startsWith('image/')) return <FileIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const handleOpenPreview = () => {
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  return (
    <>
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
      {/* HEADER */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 3,
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
            <AssignmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              mb: 0.25
            }}>
              Detalle de la Tarea
            </Typography>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              display: 'block',
              maxWidth: 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {task.titulo}
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

      <DialogContent sx={{ pb: 3, px: 3 }}>
        {/* Título y Descripción */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            mt: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            mb: 3
          }}
        >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                mb: task.descripcion ? 2 : 0,
                color: 'text.primary'
              }}
            >
              {task.titulo}
            </Typography>
            {task.descripcion && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.7
                }}
              >
                {task.descripcion}
              </Typography>
            )}
          </Paper>

        {/* Estado y Prioridad */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 200,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                bgcolor: alpha(theme.palette.divider, 0.03)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.grey[600] }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  Estado
                </Typography>
              </Box>
              <Chip 
                label={getEstadoLabel(task.estadoActual)}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.grey[600], 0.08),
                  color: theme.palette.grey[600],
                  fontWeight: 600,
                  borderRadius: 1,
                  height: 26
                }}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 200,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                bgcolor: alpha(theme.palette.divider, 0.03)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FlagIcon sx={{ fontSize: 18, color: theme.palette.grey[600] }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  Prioridad
                </Typography>
              </Box>
              <Chip 
                label={getPriorityLabel(task.prioridad)}
                size="small"
                sx={{ 
                  bgcolor: task.prioridad === 'urgente' 
                    ? alpha(theme.palette.error.main, 0.08)
                    : alpha(theme.palette.grey[600], 0.08),
                  color: task.prioridad === 'urgente' 
                    ? theme.palette.error.main
                    : theme.palette.grey[600],
                  fontWeight: 600,
                  borderRadius: 1,
                  height: 26
                }}
              />
            </Paper>
          </Box>

        {/* Información de Personas y Empresa */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            mb: 3
          }}
        >
            <Grid container spacing={3}>
              {/* Creado por */}
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 600,
                      color: 'text.secondary'
                    }}
                  >
                    Creado por
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {task.creadoPor?.nombre || 'No especificado'}
                </Typography>
              </Grid>

              {/* Asignado a */}
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 600,
                      color: 'text.secondary'
                    }}
                  >
                    Asignado a
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {task.asignadoA?.nombre || 'Sin asignar'}
                </Typography>
              </Grid>

              {/* Empresas (una o múltiples) */}
              <Grid item xs={12} sm={empresasData.length > 1 ? 12 : 4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 600,
                      color: 'text.secondary'
                    }}
                  >
                    {empresasData.length > 1 ? 'Empresas' : 'Empresa'}
                  </Typography>
                </Box>
                {empresasData.length === 0 ? (
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    Sin empresa
                  </Typography>
                ) : empresasData.length === 1 ? (
                  // Una sola empresa (diseño compacto)
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {empresasData[0]?.logoURL ? (
                      <Avatar
                        src={empresasData[0].logoURL}
                        alt={empresasData[0].nombre}
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
                    <Typography variant="body2" fontWeight={500}>
                      {empresasData[0]?.nombre || 'Sin nombre'}
                    </Typography>
                  </Box>
                ) : (
                  // Múltiples empresas (lista con chips)
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {empresasData.map((empresa, index) => (
                      <Chip
                        key={index}
                        avatar={
                          empresa?.logoURL ? (
                            <Avatar 
                              src={empresa.logoURL} 
                              alt={empresa.nombre}
                              sx={{ 
                                '& img': {
                                  objectFit: 'contain'
                                }
                              }}
                            />
                          ) : undefined
                        }
                        label={empresa?.nombre || 'Sin nombre'}
                        size="small"
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'text.primary',
                          fontWeight: 500,
                          borderRadius: 1,
                          height: 28,
                          '& .MuiChip-avatar': {
                            width: 20,
                            height: 20
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

        {/* Fechas */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 200,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${alpha(isOverdue() ? theme.palette.error.main : theme.palette.divider, 0.2)}`,
                bgcolor: alpha(isOverdue() ? theme.palette.error.main : theme.palette.background.paper, 0.04)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon sx={{ 
                  fontSize: 18, 
                  color: isOverdue() ? 'error.main' : 'text.secondary' 
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  Vencimiento
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography 
                  variant="body2" 
                  fontWeight={600}
                  sx={{ color: isOverdue() ? 'error.main' : 'text.primary' }}
                >
                  {formatDate(task.fechaVencimiento)}
                </Typography>
                {isOverdue() && (
                  <Chip 
                    label="Vencida" 
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: alpha(theme.palette.error.main, 0.15),
                      color: 'error.main',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 200,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.5)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  Fecha de Creación
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={500}>
                {formatDate(task.fechaCreacion)}
              </Typography>
            </Paper>
          </Box>

        {/* Resultado de Revisión (Aprobación/Rechazo) */}
        {(() => {
          // Buscar el último estado con información de aprobación
          const estadoConAprobacion = task.historialEstados?.slice().reverse().find(estado => estado.aprobacion);
          
          if (estadoConAprobacion && estadoConAprobacion.aprobacion) {
            const aprobacion = estadoConAprobacion.aprobacion;
            const aprobado = aprobacion.aprobado;
            const comentario = estadoConAprobacion.comentario || '';
            
            // Extraer solo el comentario del revisor (remover prefijo "Aprobado:" o "Rechazado:")
            const motivoLimpio = comentario.replace(/^(Aprobado|Rechazado):\s*/i, '');

            return (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(aprobado ? theme.palette.success.main : theme.palette.error.main, 0.3)}`,
                  bgcolor: alpha(aprobado ? theme.palette.success.main : theme.palette.error.main, 0.06),
                  mb: 3
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <CheckCircleIcon sx={{ 
                    fontSize: 24, 
                    color: aprobado ? 'success.main' : 'error.main' 
                  }} />
                  <Typography 
                    variant="h6" 
                    fontWeight={700}
                    sx={{ color: aprobado ? 'success.main' : 'error.main' }}
                  >
                    {aprobado ? 'Tarea Aprobada' : 'Tarea Rechazada'}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2, borderColor: alpha(aprobado ? theme.palette.success.main : theme.palette.error.main, 0.2) }} />

                <Grid container spacing={2}>
                  {/* Motivo/Comentario del Revisor */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 1
                      }}
                    >
                      {aprobado ? 'Comentarios de Aprobación' : 'Motivo de Rechazo'}
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.primary',
                          fontWeight: 500,
                          lineHeight: 1.6,
                          fontStyle: motivoLimpio ? 'normal' : 'italic'
                        }}
                      >
                        {motivoLimpio || (aprobado ? 'Sin comentarios adicionales' : 'Sin motivo especificado')}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Fecha de Revisión */}
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      Fecha de Revisión
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {aprobacion.fecha?.toDate ? format(aprobacion.fecha.toDate(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es }) : 'No disponible'}
                    </Typography>
                  </Grid>

                  {/* Próximos Pasos (Solo si fue rechazada) */}
                  {!aprobado && (
                    <Grid item xs={12}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.warning.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <AssignmentIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                          <Typography 
                            variant="caption" 
                            fontWeight={600}
                            sx={{ color: 'warning.main', textTransform: 'uppercase', letterSpacing: 0.5 }}
                          >
                            Próximos Pasos
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          Revisa el motivo de rechazo y realiza las correcciones necesarias. Puedes volver a enviar la tarea a revisión cuando esté lista.
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            );
          }
          return null;
        })()}

        {/* Adjunto */}
        {task.adjunto && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.04)
            }}
          >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachFileIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary'
                  }}
                >
                  Documento Adjunto
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 48,
                    height: 48
                  }}>
                    {getFileIcon(task.adjunto.tipo)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body1" 
                      fontWeight={600}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {task.adjunto.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(task.adjunto.tamaño)}
                      {task.adjunto.archivosOriginales > 1 && ` • ${task.adjunto.archivosOriginales} archivos originales`}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Botón Vista Previa (PDF o Imágenes) */}
                  {(task.adjunto.tipo === 'application/pdf' || task.adjunto.tipo?.startsWith('image/')) && (
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={handleOpenPreview}
                      sx={{
                        borderRadius: 1,
                        fontWeight: 600,
                        px: 2.5,
                        bgcolor: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Ver Documento
                    </Button>
                  )}
                  {/* Botón Descargar (ZIP u otros archivos) */}
                  {(task.adjunto.tipo === 'application/zip' || 
                    (!task.adjunto.tipo?.startsWith('image/') && task.adjunto.tipo !== 'application/pdf')) && (
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      component="a"
                      href={task.adjunto.url}
                      download
                      sx={{
                        borderRadius: 1,
                        fontWeight: 600,
                        px: 2.5,
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Descargar
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            py: 1.25,
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal de Vista Previa de Documentos */}
    <DocumentPreviewModal
      open={previewOpen}
      onClose={handleClosePreview}
      document={task?.adjunto}
    />
    </>
  );
};

export default TaskDetailDialog;
