import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Avatar,
  Button,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Event,
  AttachMoney,
  Business,
  Warning,
  CheckCircle,
  Cancel,
  Add,
  Close
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const CalendarEventDetails = ({ selectedDate, events, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!selectedDate || !events || events.length === 0) {
    return null;
  }

  const handleCreateCommitment = (event = null) => {
    // Detectar tipos de eventos especiales en la fecha
    const coljuegosEvent = events.find(e => e.type === 'coljuegos');
    const uiafEvent = events.find(e => e.type === 'uiaf');
    const parafiscalesEvent = events.find(e => e.type === 'parafiscales');
    
    // Preparar datos para pre-llenar el formulario
    const queryParams = new URLSearchParams({
      fromCalendar: 'true',
      date: format(selectedDate, 'yyyy-MM-dd')
    });

    // Pre-llenar datos según el tipo de evento automático
    if (coljuegosEvent) {
      queryParams.append('concept', 'Pago Coljuegos');
      queryParams.append('provider', 'Coljuegos');
      queryParams.append('category', 'Impuestos y Tasas');
      queryParams.append('priority', 'high');
      queryParams.append('isColjuegos', 'true');
    } else if (uiafEvent) {
      queryParams.append('concept', 'Reporte UIAF');
      queryParams.append('provider', 'UIAF');
      queryParams.append('category', 'Reportes y Declaraciones');
      queryParams.append('priority', 'medium');
      queryParams.append('isUiaf', 'true');
    } else if (parafiscalesEvent) {
      queryParams.append('concept', 'Pago de Parafiscales');
      queryParams.append('provider', 'Entidades Parafiscales');
      queryParams.append('category', 'Seguridad Social');
      queryParams.append('priority', 'high');
      queryParams.append('isParafiscales', 'true');
    } else if (event) {
      // Usar datos del evento específico si se proporciona
      if (event.title) queryParams.append('concept', event.title);
      if (event.amount) queryParams.append('amount', event.amount);
      if (event.company) queryParams.append('company', event.company);
    }

    navigate(`/commitments/new?${queryParams.toString()}`);
  };

  const getEventIcon = (event) => {
    switch (event.type) {
      case 'holiday':
        return <Event sx={{ fontSize: 16 }} />;
      case 'commitment':
        if (event.status === 'paid') return <CheckCircle sx={{ fontSize: 16 }} />;
        if (event.status === 'overdue') return <Cancel sx={{ fontSize: 16 }} />;
        return <Warning sx={{ fontSize: 16 }} />;
      case 'coljuegos':
        return <AttachMoney sx={{ fontSize: 16 }} />; // Ícono de dinero para Coljuegos
      case 'uiaf':
        return <Business sx={{ fontSize: 16 }} />; // Ícono de negocio para UIAF
      case 'parafiscales':
        return <AttachMoney sx={{ fontSize: 16 }} />; // Ícono de dinero para Parafiscales
      case 'custom':
        switch (event.subType) {
          case 'business':
            return <Business sx={{ fontSize: 16 }} />;
          case 'reminder':
            return <Warning sx={{ fontSize: 16 }} />;
          case 'personal':
          default:
            return <Event sx={{ fontSize: 16 }} />;
        }
      default:
        return <Event sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusLabel = (event) => {
    if (event.type === 'holiday') {
      return event.category === 'civil' ? 'Festivo Civil' : 'Festivo Religioso';
    }
    if (event.type === 'commitment') {
      switch (event.status) {
        case 'paid': return 'Pagado';
        case 'overdue': return 'Vencido';
        case 'pending': return 'Pendiente';
        default: return 'Pendiente';
      }
    }
    if (event.type === 'coljuegos') {
      return 'Pago Obligatorio - Décimo Día Hábil';
    }
    if (event.type === 'custom') {
      const typeLabels = {
        personal: 'Personal',
        business: 'Negocio',
        reminder: 'Recordatorio'
      };
      const priorityLabels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta'
      };
      return `${typeLabels[event.subType] || 'Evento'} - ${priorityLabels[event.priority] || 'Media'}`;
    }
    return 'Evento';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{
          position: 'fixed',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 400,
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 1300,
          backgroundColor: 'background.paper',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Sombra sobria
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
              </Typography>
              <IconButton 
                onClick={onClose}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    backgroundColor: 'action.hover',
                    color: 'text.primary' 
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Botón para crear nuevo compromiso - Solo mostrar si hay eventos personalizados o NO hay compromisos reales */}
            {(() => {
              const hasCommitments = events.some(event => event.type === 'commitment');
              const hasCustomEvents = events.some(event => event.type === 'custom');
              const hasColjuegosEvents = events.some(event => event.type === 'coljuegos');
              const hasUiafEvents = events.some(event => event.type === 'uiaf');
              const hasParafiscalesEvents = events.some(event => event.type === 'parafiscales');
              const hasOnlyHolidays = events.every(event => event.type === 'holiday');
              
              // Mostrar botón si:
              // 1. Solo hay festivos (sin eventos personalizados ni compromisos)
              // 2. Hay eventos personalizados (sin importar si hay compromisos)
              // 3. Hay eventos automáticos (Coljuegos, UIAF, Parafiscales)
              // NO mostrar si SOLO hay compromisos sin eventos personalizados
              const shouldShowButton = hasOnlyHolidays || hasCustomEvents || hasColjuegosEvents || hasUiafEvents || hasParafiscalesEvents || (!hasCommitments && !hasCustomEvents);
              
              return shouldShowButton ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => handleCreateCommitment()}
                  sx={{
                    mb: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderColor: 'primary.dark'
                    }
                  }}
                >
                  Crear Compromiso para esta fecha
                </Button>
              ) : null;
            })()}

            <List sx={{ p: 0 }}>
              {events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem sx={{ 
                    px: 0, 
                    py: 1,
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: alpha(event.color || theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(event.color || theme.palette.primary.main, 0.2)}`
                  }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar sx={{ 
                        bgcolor: event.color || theme.palette.primary.main,
                        width: 32,
                        height: 32
                      }}>
                        {getEventIcon(event)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {event.title}
                          </Typography>
                          <Chip 
                            label={getStatusLabel(event)}
                            size="small"
                            sx={{
                              bgcolor: event.color,
                              color: 'white',
                              fontSize: '10px',
                              height: 20
                            }}
                          />
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box>
                          {event.company && (
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {event.company}
                              </Typography>
                            </Box>
                          )}
                          {event.amount && (
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <AttachMoney sx={{ fontSize: 14, color: 'success.main' }} />
                              <Typography variant="caption" sx={{ 
                                fontWeight: 600,
                                color: 'success.main'
                              }}>
                                ${event.amount.toLocaleString('es-CO')}
                              </Typography>
                            </Box>
                          )}
                          {event.type === 'holiday' && (
                            <Typography variant="caption" color="text.secondary">
                              Día festivo nacional
                            </Typography>
                          )}
                          
                          {/* 🆕 Información para eventos personalizados */}
                          {event.type === 'custom' && (
                            <>
                              {event.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                  {event.description}
                                </Typography>
                              )}
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Chip
                                  label={`Prioridad ${event.priority === 'high' ? 'Alta' : event.priority === 'medium' ? 'Media' : 'Baja'}`}
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: '10px',
                                    backgroundColor: event.priority === 'high' ? '#f4433620' : 
                                                    event.priority === 'medium' ? '#ff980020' : '#4caf5020',
                                    color: event.priority === 'high' ? '#f44336' : 
                                          event.priority === 'medium' ? '#ff9800' : '#4caf50'
                                  }}
                                />
                              </Box>
                            </>
                          )}
                          
                          {/* Botón para crear compromiso basado en este evento */}
                          {event.type !== 'commitment' && (
                            <Box mt={1}>
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<Add />}
                                onClick={() => handleCreateCommitment(event)}
                                sx={{
                                  fontSize: '11px',
                                  textTransform: 'none',
                                  color: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                  }
                                }}
                              >
                                Crear compromiso
                              </Button>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>

            {events.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  No hay eventos para esta fecha
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleCreateCommitment()}
                  sx={{
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  Crear Compromiso
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default CalendarEventDetails;
