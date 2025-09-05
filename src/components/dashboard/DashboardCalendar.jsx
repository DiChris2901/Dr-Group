import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Event,
  Warning,
  CheckCircle,
  Cancel,
  Add
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { determineCommitmentStatus } from '../../utils/commitmentStatusUtils';
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  isWeekend,
  getDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useColombianHolidays } from '../../hooks/useColombianHolidays';
import { useCommitments } from '../../hooks/useCommitments';
import CalendarEventDetails from './CalendarEventDetails';
import AddEventModal from './AddEventModal';

/**
 * Función para verificar si un día es hábil (no fin de semana ni festivo)
 */
const esHabil = (fecha, holidays) => {
  const dayOfWeek = getDay(fecha);
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
  
  // Verificar si es festivo
  const fechaNormalizada = new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);
  const fechaISO = fechaNormalizada.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => holiday.date === fechaISO);
  
  return !isWeekendDay && !isHoliday;
};

/**
 * Función para sumar días hábiles desde una fecha base
 * Empieza a contar desde el día SIGUIENTE a la fecha base
 */
const sumarDiasHabiles = (fechaBase, diasAsumar, holidays) => {
  let fecha = addDays(new Date(fechaBase), 1); // Empezar desde el día siguiente
  let contador = 0;
  
  while (contador < diasAsumar) {
    if (esHabil(fecha, holidays)) {
      contador++;
    }
    if (contador < diasAsumar) {
      fecha = addDays(fecha, 1);
    }
  }
  
  return fecha;
};

/**
 * Calcula el décimo día hábil de un mes específico
 * excluyendo fines de semana y festivos colombianos
 */
const calculateTenthBusinessDay = (year, month, holidays) => {
  // Obtener el último día del mes anterior como base
  const fechaBase = new Date(year, month, 0); // Último día del mes anterior
  
  // Debug para noviembre 2025
  const isDebugMonth = year === 2025 && month === 10;
  if (isDebugMonth) {
    console.log('🔍 [DEBUG COLJUEGOS] Calculando décimo día hábil para Noviembre 2025');
    console.log(`   Fecha base (último día octubre): ${fechaBase.toDateString()}`);
  }
  
  // Sumar 10 días hábiles desde la fecha base
  const result = sumarDiasHabiles(fechaBase, 10, holidays);
  
  if (isDebugMonth) {
    console.log(`🎯 COLJUEGOS - Décimo día hábil: ${result.toDateString()}`);
  }
  
  return result;
};

/**
 * Calcula el tercer día hábil de un mes específico
 * excluyendo fines de semana y festivos colombianos
 */
const calculateThirdBusinessDay = (year, month, holidays) => {
  // Obtener el último día del mes anterior como base
  const fechaBase = new Date(year, month, 0); // Último día del mes anterior
  
  // Debug para noviembre 2025
  const isDebugMonth = year === 2025 && month === 10;
  if (isDebugMonth) {
    console.log('🔍 [DEBUG PARAFISCALES] Calculando tercer día hábil para Noviembre 2025');
    console.log(`   Fecha base (último día octubre): ${fechaBase.toDateString()}`);
  }
  
  // Sumar 3 días hábiles desde la fecha base
  const result = sumarDiasHabiles(fechaBase, 3, holidays);
  
  if (isDebugMonth) {
    console.log(`🎯 PARAFISCALES - Tercer día hábil: ${result.toDateString()}`);
  }
  
  return result;
};

const DashboardCalendar = ({ onDateSelect, selectedDate }) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '' });
  const [showEventDetails, setShowEventDetails] = useState(false);
  
  // 🆕 Estados para eventos personalizados
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState(null);

  const holidays = useColombianHolidays(currentDate.getFullYear());
  const { commitments } = useCommitments();

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 = Domingo
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Obtener eventos para un día específico
  const getEventsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const events = [];

    // Días festivos
    const holiday = holidays.find(h => h.date === dayStr);
    if (holiday) {
      events.push({
        type: 'holiday',
        title: holiday.name,
        category: holiday.type,
        color: holiday.type === 'civil' ? '#1976d2' : '#9c27b0'
      });
    }

    // 🆕 Eventos personalizados
    const dayCustomEvents = customEvents.filter(event => {
      const eventDate = format(new Date(event.date), 'yyyy-MM-dd');
      return eventDate === dayStr;
    });

    dayCustomEvents.forEach(event => {
      // Color fijo para eventos personalizados (azul corporativo)
      const eventColor = '#1976d2'; // Azul estándar para todos los eventos personalizados
      
      events.push({
        type: 'custom',
        title: event.title,
        description: event.description,
        priority: event.priority,
        color: eventColor
      });
    });

    // 🎯 COLJUEGOS: Décimo día hábil de cada mes
    const tenthBusinessDay = calculateTenthBusinessDay(day.getFullYear(), day.getMonth(), holidays);
    if (tenthBusinessDay && isSameDay(tenthBusinessDay, day)) {
      events.push({
        type: 'coljuegos',
        title: 'Coljuegos - Décimo día hábil',
        description: 'Día de pago obligatorio para Coljuegos',
        priority: 'high',
        color: '#ff5722', // Color distintivo naranja/rojo para Coljuegos
        isAutoGenerated: true // Flag para identificar eventos auto-generados
      });
    }

    // 📊 REPORTE UIAF: Día 10 de cada mes
    if (day.getDate() === 10) {
      events.push({
        type: 'uiaf',
        title: 'Reporte UIAF',
        description: 'Reporte mensual a la Unidad de Información y Análisis Financiero (UIAF)',
        priority: 'medium',
        color: '#795548', // Color marrón para UIAF
        isAutoGenerated: true
      });
    }

    // 💼 PARAFISCALES: Tercer día hábil de cada mes
    const thirdBusinessDay = calculateThirdBusinessDay(day.getFullYear(), day.getMonth(), holidays);
    if (thirdBusinessDay && isSameDay(thirdBusinessDay, day)) {
      events.push({
        type: 'parafiscales',
        title: 'Pago de Parafiscales',
        description: 'Pago de aportes parafiscales (3er día hábil del mes)',
        priority: 'high',
        color: '#607d8b', // Color azul grisáceo para Parafiscales
        isAutoGenerated: true
      });
    }

    // Compromisos próximos a vencer
    const dayCommitments = commitments.filter(commitment => {
      if (!commitment.dueDate) return false;
      const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      return isSameDay(dueDate, day);
    });

    /**
     * LÓGICA DE NEGOCIO MEJORADA PARA ESTADOS DE COMPROMISOS:
     * 
     * 1. PAGADO (Verde): Completamente pagado por cualquier método
     * 2. PENDIENTE (Naranja): Tiene pagos parciales, SIN IMPORTAR si está vencido por fecha
     * 3. VENCIDO (Rojo): SIN pagos Y fecha vencida
     * 4. PENDIENTE (Naranja): Sin pagos pero fecha vigente
     * 
     * Esta lógica diferencia claramente:
     * - Vencidos = Sin dinero recibido + fecha pasada
     * - Pendientes = Algún dinero recibido (aunque esté vencido por fecha)
     */

    dayCommitments.forEach(commitment => {
      // 1. Verificar si está completamente pagado
      const isPaidByStatus = commitment.status === 'paid' || 
                            commitment.status === 'completed' || 
                            commitment.status === 'Pagado';
      const isPaidByFlags = commitment.isPaid === true || commitment.paid === true;
      const isPaidByPaymentStatus = commitment.paymentStatus === 'paid' || 
                                   commitment.paymentStatus === 'Pagado' || 
                                   commitment.paymentStatus === 'pagado';
      
      // 2. Verificar pagos parciales usando los campos específicos del sistema
      const hasPartialPaymentStatus = commitment.status === 'partial_payment';
      const totalPaid = parseFloat(commitment.totalPaid || 0);
      const remainingBalance = parseFloat(commitment.remainingBalance || 0);
      const commitmentAmount = parseFloat(commitment.amount || 0);
      
      // 3. Determinar si está completamente pagado
      const isCompletelyPaid = isPaidByStatus || isPaidByFlags || isPaidByPaymentStatus || 
                              (commitmentAmount > 0 && remainingBalance <= 0) ||
                              (commitmentAmount > 0 && totalPaid >= commitmentAmount);
      
      // 4. Verificar fecha de vencimiento
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Normalizar para comparación de solo fecha
      const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Normalizar para comparación de solo fecha
      const isOverdueByDate = dueDate < currentDate;
      
      // 5. Verificar si tiene pagos parciales
      const hasPartialPayments = hasPartialPaymentStatus || 
                                totalPaid > 0 || 
                                (commitmentAmount > 0 && remainingBalance > 0 && remainingBalance < commitmentAmount);
      
      // 6. LÓGICA MEJORADA: Determinar estado según las reglas de negocio
      let color, statusLabel, finalStatus;
      
      if (isCompletelyPaid) {
        // ✅ COMPLETAMENTE PAGADO
        color = '#4caf50'; // Verde
        statusLabel = 'Pagado';
        finalStatus = 'completed';
      } else if (hasPartialPayments) {
        // 🟠 PENDIENTE (tiene pagos parciales, sin importar si está vencido por fecha)
        color = '#ff9800'; // Naranja
        statusLabel = isOverdueByDate ? 'Pendiente (Vencido)' : 'Pendiente';
        finalStatus = 'pending';
      } else if (isOverdueByDate) {
        // 🔴 VENCIDO (sin pagos y fecha vencida)
        color = '#f44336'; // Rojo
        statusLabel = 'Vencido';
        finalStatus = 'overdue';
      } else {
        // 🟡 PENDIENTE (sin pagos pero fecha vigente)
        color = '#ff9800'; // Naranja
        statusLabel = 'Pendiente';
        finalStatus = 'pending';
      }
      
      // Debug para verificar la lógica
      console.log(`📅 [CALENDAR DEBUG] Compromiso: ${commitment.concept}`, {
        id: commitment.id,
        status: commitment.status,
        totalPaid: totalPaid,
        remainingBalance: remainingBalance,
        amount: commitmentAmount,
        hasPartialPayments: hasPartialPayments,
        isOverdueByDate: isOverdueByDate,
        finalStatus: finalStatus,
        statusLabel: statusLabel
      });
      
      events.push({
        type: 'commitment',
        title: commitment.concept,
        amount: commitmentAmount,
        status: finalStatus,
        statusLabel: statusLabel,
        color: color,
        company: commitment.companyName || 'Sin empresa',
        totalPaid: totalPaid,
        remainingBalance: remainingBalance,
        hasPartialPayments: hasPartialPayments,
        isOverdueByDate: isOverdueByDate,
        isCompletelyPaid: isCompletelyPaid,
        commitment: commitment // Incluir objeto completo para referencia
      });
    });

    return events;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => 
      direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowEventDetails(true);
    onDateSelect?.(day);
  };

  // 🆕 Manejar click para agregar evento
  const handleAddEventClick = (day, event) => {
    event.stopPropagation(); // Evitar que se abra el detalle del día
    setSelectedDateForEvent(day);
    setShowAddEventModal(true);
  };

  // 🆕 Guardar evento personalizado
  const handleSaveEvent = (eventData) => {
    setCustomEvents(prev => [...prev, eventData]);
    setShowAddEventModal(false);
    setSelectedDateForEvent(null);
  };

  const saveEvent = () => {
    // TODO: Implementar guardado de eventos personalizados
    console.log('Nuevo evento:', newEvent, 'para fecha:', selectedDay);
    setShowEventDialog(false);
    setNewEvent({ title: '', description: '' });
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <Card sx={{ 
      backgroundColor: 'background.paper',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', // Sombra sobria
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1 // 8px - bordes menos redondeados
    }}>
      <CardContent>
        {/* Header del Calendario */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography 
            variant="h5" 
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            sx={{ 
              fontWeight: 600, // Peso sobrio
              color: 'text.primary',
              textTransform: 'capitalize'
            }}
          >
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </Typography>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Mes anterior">
              <IconButton 
                onClick={() => navigateMonth('prev')}
                sx={{ 
                  color: 'text.secondary',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    color: 'primary.main'
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Hoy">
              <Button
                variant="outlined"
                startIcon={<Today />}
                onClick={goToToday}
                sx={{
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    borderColor: 'primary.main',
                    color: 'primary.main'
                  }
                }}
              >
                Hoy
              </Button>
            </Tooltip>
            
            <Tooltip title="Siguiente mes">
              <IconButton 
                onClick={() => navigateMonth('next')}
                sx={{ 
                  color: 'text.secondary',
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    color: 'primary.main'
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Días de la semana */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, mb: 1 }}>
          {weekDays.map((day) => (
            <Box 
              key={day}
              textAlign="center" 
              py={1}
              sx={{ 
                borderBottom: `1px solid ${theme.palette.divider}`,
                fontWeight: 500,
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* Días del calendario */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          <AnimatePresence mode="wait">
            {calendarDays.map((day, index) => {
              const events = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              // 🎨 Detectar días no laborables para aplicar fondo
              const dayOfWeek = getDay(day);
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
              const isHoliday = events.some(event => event.type === 'holiday');
              const isNonWorkingDay = isWeekend || isHoliday;

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.005, duration: 0.2 }}
                >
                  <Box
                    onClick={() => handleDayClick(day)}
                    sx={{
                      minHeight: '120px',
                      height: '120px', // Altura aumentada para más espacio
                      p: 0.5,
                      cursor: 'pointer',
                      border: `1px solid ${theme.palette.divider}`,
                      borderColor: isSelected 
                        ? 'primary.main' 
                        : 'divider',
                      backgroundColor: isTodayDate 
                        ? theme.palette.primary.main
                        : isSelected 
                        ? theme.palette.action.selected
                        : isCurrentMonth 
                        ? 'background.paper'
                        : 'action.hover',
                      backgroundImage: isCurrentMonth && isNonWorkingDay && !isTodayDate && !isSelected
                        ? `linear-gradient(45deg, 
                            transparent 25%, 
                            ${theme.palette.primary.main}15 25%, 
                            ${theme.palette.primary.main}15 50%, 
                            transparent 50%, 
                            transparent 75%, 
                            ${theme.palette.secondary.main}15 75%)`
                        : 'none',
                      backgroundSize: isCurrentMonth && isNonWorkingDay && !isTodayDate && !isSelected 
                        ? '8px 8px' 
                        : 'auto',
                      color: isTodayDate 
                        ? 'primary.contrastText'
                        : isCurrentMonth 
                        ? 'text.primary' 
                        : 'text.disabled',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: isTodayDate 
                          ? 'primary.main'
                          : theme.palette.action.hover,
                        backgroundImage: isCurrentMonth && isNonWorkingDay && !isTodayDate
                        ? `linear-gradient(45deg, 
                            transparent 25%, 
                            ${theme.palette.primary.main}25 25%, 
                            ${theme.palette.primary.main}25 50%, 
                            transparent 50%, 
                            transparent 75%, 
                            ${theme.palette.secondary.main}25 75%)`
                        : 'none',
                        borderColor: 'primary.main',
                        '& .add-event-btn': {
                          opacity: 1,
                          transform: 'scale(1)'
                        }
                      }
                    }}
                  >
                    {/* Header del día con botón agregar evento */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: isTodayDate ? 600 : 400,
                          flex: 1,
                          textAlign: 'center'
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      
                      {/* 🆕 Botón de agregar evento */}
                      {isCurrentMonth && (
                        <IconButton
                          className="add-event-btn"
                          size="small"
                          onClick={(e) => handleAddEventClick(day, e)}
                          sx={{
                            opacity: isSelected ? 1 : 0,
                            transform: isSelected ? 'scale(1)' : 'scale(0.8)',
                            transition: 'all 0.2s ease',
                            width: 16,
                            height: 16,
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <Add sx={{ fontSize: 12 }} />
                        </IconButton>
                      )}
                    </Box>
                    
                    {/* Eventos del día */}
                    <Box display="flex" flexDirection="column" gap={0.5} flex={1} overflow="hidden">
                        {events.slice(0, 3).map((event, idx) => (
                          <Chip
                            key={idx}
                            label={event.title.length > 14 ? `${event.title.substring(0, 14)}...` : event.title}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '9px',
                              backgroundColor: `${event.color}20`,
                              color: event.color,
                              border: `1px solid ${event.color}50`,
                              cursor: 'pointer',
                              '& .MuiChip-label': {
                                px: 0.5,
                                fontWeight: 500,
                                lineHeight: 1
                              },
                              '&:hover': {
                                backgroundColor: `${event.color}30`,
                                borderColor: event.color,
                                transform: 'scale(1.02)'
                              }
                            }}
                          />
                        ))}
                        {events.length > 3 && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '9px',
                              color: 'text.secondary',
                              textAlign: 'center',
                              fontWeight: 500
                            }}
                          >
                            +{events.length - 3} más
                          </Typography>
                        )}
                        
                        {/* 🆕 Chip de "Agregar Evento" cuando no hay eventos */}
                        {events.length === 0 && isCurrentMonth && isSelected && (
                          <Chip
                            label="+ Evento"
                            size="small"
                            onClick={(e) => handleAddEventClick(day, e)}
                            sx={{
                              height: 18,
                              fontSize: '10px',
                              backgroundColor: `${theme.palette.primary.main}15`,
                              color: theme.palette.primary.main,
                              border: `1px dashed ${theme.palette.primary.main}50`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: `${theme.palette.primary.main}25`,
                                borderColor: theme.palette.primary.main,
                                transform: 'scale(1.05)'
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>

        {/* Leyenda */}
        {/* Leyenda sobria */}
        <Box mt={2} display="flex" flexWrap="wrap" gap={2} sx={{ 
          pt: 2, 
          borderTop: `1px solid ${theme.palette.divider}` 
        }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 4, backgroundColor: '#1976d2', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">Festivo Civil</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 4, backgroundColor: '#9c27b0', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">Festivo Religioso</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 4, backgroundColor: '#4caf50', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">Pagado</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 4, backgroundColor: '#ff9800', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">Pendiente</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 4, backgroundColor: '#f44336', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">Vencido</Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Dialog para agregar eventos - Diseño sobrio */}
      <Dialog 
        open={showEventDialog} 
        onClose={() => setShowEventDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          fontWeight: 500
        }}>
          Agregar Evento
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Título del evento"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descripción"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            variant="outlined"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          {selectedDay && (
            <Typography variant="body2" color="text.secondary">
              📅 {format(selectedDay, 'dd/MM/yyyy', { locale: es })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1
        }}>
          <Button 
            onClick={() => setShowEventDialog(false)}
            variant="outlined"
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={saveEvent} 
            variant="contained"
            disabled={!newEvent.title.trim()}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Panel de detalles de eventos */}
      {showEventDetails && selectedDay && (
        <CalendarEventDetails
          selectedDate={selectedDay}
          events={getEventsForDay(selectedDay)}
          onClose={() => setShowEventDetails(false)}
        />
      )}

      {/* 🆕 Modal para agregar eventos */}
      <AddEventModal
        open={showAddEventModal}
        onClose={() => {
          setShowAddEventModal(false);
          setSelectedDateForEvent(null);
        }}
        selectedDate={selectedDateForEvent}
        onSave={handleSaveEvent}
      />
    </Card>
  );
};

export default DashboardCalendar;
