import React, { useState } from 'react';
import {
  Menu,
  Box,
  Typography,
  Grid,
  IconButton,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  alpha
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useFirestore } from '../../hooks/useFirestore';
import { fCurrency } from '../../utils/formatNumber';
import { useSettings } from '../../context/SettingsContext';

// Estilos CSS para animaciones spectacular
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined' && !document.getElementById('calendar-shimmer-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'calendar-shimmer-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = shimmerStyles;
  document.head.appendChild(styleSheet);
}

const CalendarMenu = ({ anchorEl, open, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const { data: commitments = [], loading } = useFirestore('commitments');
  const theme = useTheme();
  const { settings } = useSettings();

  // Configuraciones dinámicas del Design System
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 12;
  const animationsEnabled = settings?.theme?.animations !== false;

  // Obtener compromisos reales del mes actual
  const getCommitmentsForDate = (date) => {
    if (!commitments.length) return [];
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return commitments.filter(commitment => {
      if (!commitment.dueDate) return false;
      const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      const commitmentDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      return commitmentDate.getTime() === targetDate.getTime();
    });
  };

  // Obtener estadísticas del mes
  const getMonthStats = () => {
    const monthCommitments = commitments.filter(commitment => {
      if (!commitment.dueDate) return false;
      const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      return dueDate.getMonth() === selectedMonth.getMonth() && 
             dueDate.getFullYear() === selectedMonth.getFullYear();
    });

    const total = monthCommitments.length;
    const completed = monthCommitments.filter(c => c.status === 'completed').length;
    const overdue = monthCommitments.filter(c => {
      const dueDate = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
      return dueDate < new Date() && c.status !== 'completed';
    }).length;

    return { total, completed, overdue, pending: total - completed - overdue };
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedMonth(today);
    setSelectedDate(today);
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === selectedMonth.getMonth();
  };

  const hasCommitments = (date) => {
    return getCommitmentsForDate(date).length > 0;
  };

  const getCommitmentPriority = (date) => {
    const dayCommitments = getCommitmentsForDate(date);
    if (dayCommitments.length === 0) return null;
    
    const now = new Date();
    const isOverdue = dayCommitments.some(c => {
      const dueDate = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
      return dueDate < now && c.status !== 'completed';
    });
    
    if (isOverdue) return 'error';
    return dayCommitments.some(c => c.priority === 'high') ? 'warning' : 'info';
  };

  const days = getDaysInMonth();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthStats = getMonthStats();

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 380,
          maxHeight: 480,
          bgcolor: 'transparent',
          borderRadius: `${borderRadius}px`,
          boxShadow: `0 8px 32px ${alpha(primaryColor, 0.25)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: 'visible',
          mt: 1,
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            borderBottom: 'none',
            borderRight: 'none'
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: -10 } : {}}
        animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
        transition={animationsEnabled ? { type: 'spring', stiffness: 300, damping: 30 } : {}}
      >
        <Box sx={{ p: 1.5 }}>
          {/* Header del calendario con gradiente spectacular */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1.5,
            p: 1.5,
            mx: -1.5,
            mt: -1.5,
            borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: animationsEnabled ? 
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 
                'none',
              transform: 'translateX(-100%)',
              animation: animationsEnabled ? 'shimmer 3s infinite' : 'none'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
              <EventIcon sx={{ color: 'white', fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                Calendario
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <IconButton 
                size="small"
                onClick={goToToday}
                sx={{ 
                  borderRadius: `${borderRadius / 2}px`,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    transform: animationsEnabled ? 'scale(1.05)' : 'none'
                  }
                }}
              >
                <Today fontSize="small" />
              </IconButton>
            </Box>
          </Box>

        {/* Navegación del mes */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1.5
        }}>
          <IconButton 
            size="small"
            onClick={() => navigateMonth(-1)} 
            sx={{ 
              borderRadius: '8px',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedMonth.toLocaleDateString('es-ES', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Typography>
          <IconButton 
            size="small"
            onClick={() => navigateMonth(1)}
            sx={{ 
              borderRadius: '8px',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Estadísticas rápidas */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          <Chip 
            label={`${monthStats.total} Total`}
            size="small" 
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          <Chip 
            label={`${monthStats.completed} Completados`}
            size="small" 
            color="success"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          {monthStats.overdue > 0 && (
            <Chip 
              label={`${monthStats.overdue} Vencidos`}
              size="small" 
              color="error"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Grid del calendario */}
        <Box>
          {/* Nombres de los días */}
          <Grid container sx={{ mb: 0.5 }}>
            {dayNames.map((dayName, index) => (
              <Grid item xs={12/7} key={index}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'text.secondary',
                    p: 0.5
                  }}
                >
                  {dayName}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Días del mes */}
          <Grid container>
            {days.map((date, index) => {
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const hasCommitmentsOnDate = hasCommitments(date);
              const priority = getCommitmentPriority(date);
              const dayCommitments = getCommitmentsForDate(date);
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              const isHovered = hoveredDate && date.toDateString() === hoveredDate.toDateString();

              const getPriorityColor = () => {
                if (!hasCommitmentsOnDate) return 'transparent';
                switch (priority) {
                  case 'error': return '#ff4757';
                  case 'warning': return '#ffa502';
                  case 'info': return '#3742fa';
                  default: return '#2ed573';
                }
              };

              return (
                <Grid item xs={12/7} key={index}>
                  <Box
                    onClick={() => setSelectedDate(date)}
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
                    sx={{
                      position: 'relative',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      margin: '1px',
                      fontSize: '0.8rem',
                      fontWeight: isTodayDate || isSelected ? 600 : 400,
                      color: isCurrentMonthDay 
                        ? (isTodayDate || isSelected ? 'white' : 'text.primary')
                        : 'text.disabled',
                      bgcolor: isTodayDate || isSelected 
                        ? 'primary.main'
                        : isHovered 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                      border: hasCommitmentsOnDate && !isTodayDate && !isSelected
                        ? `2px solid ${getPriorityColor()}`
                        : 'none',
                      '&:hover': {
                        bgcolor: isTodayDate || isSelected 
                          ? 'primary.main'
                          : alpha(theme.palette.primary.main, 0.1),
                        transform: 'scale(1.1)',
                      },
                      transition: theme.transitions.create(['background-color', 'transform'], {
                        duration: theme.transitions.duration.short,
                      }),
                    }}
                  >
                    {date.getDate()}
                    
                    {/* Indicador de compromisos */}
                    {hasCommitmentsOnDate && !isTodayDate && !isSelected && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: getPriorityColor(),
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Compromisos del día seleccionado */}
        {selectedDate && (
          <Box sx={{ 
            mt: 1.5, 
            pt: 1.5, 
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.grey[900], 0.8)
              : alpha(theme.palette.common.white, 0.95),
            borderRadius: '8px',
            p: 1.5,
            mx: -0.5,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                fontSize: '0.85rem',
                color: theme.palette.mode === 'dark' ? 'common.white' : 'text.primary'
              }}>
                {selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Typography>
            </Box>
            
            {getCommitmentsForDate(selectedDate).length > 0 ? (
              <List sx={{ py: 0, '& .MuiListItem-root': { py: 0.25 } }}>
                {getCommitmentsForDate(selectedDate).slice(0, 3).map((commitment, index) => {
                  const priority = commitment.dueDate.toDate() < new Date() && commitment.status !== 'completed' ? 'error' :
                                 commitment.priority === 'high' ? 'warning' : 
                                 commitment.status === 'completed' ? 'success' : 'info';
                  
                  const priorityColor = priority === 'error' ? '#ff4336' :
                                      priority === 'warning' ? '#ff9800' :
                                      priority === 'success' ? '#4caf50' : '#2196f3';

                  const getStatusIcon = () => {
                    if (commitment.status === 'completed') return <CheckCircleIcon sx={{ fontSize: 14, color: priorityColor }} />;
                    if (priority === 'error') return <ErrorIcon sx={{ fontSize: 14, color: priorityColor }} />;
                    if (priority === 'warning') return <WarningIcon sx={{ fontSize: 14, color: priorityColor }} />;
                    return <EventIcon sx={{ fontSize: 14, color: priorityColor }} />;
                  };

                  return (
                    <ListItem key={commitment.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        {getStatusIcon()}
                      </ListItemIcon>
                      <ListItemText 
                        primary={commitment.description}
                        secondary={`${fCurrency(commitment.amount || 0)} • ${commitment.company || 'Sin empresa'}`}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { 
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            textDecoration: commitment.status === 'completed' ? 'line-through' : 'none',
                            opacity: commitment.status === 'completed' ? 0.7 : 1,
                            color: theme.palette.mode === 'dark' ? 'common.white' : 'text.primary'
                          }
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          sx: { 
                            fontSize: '0.7rem',
                            color: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.common.white, 0.7)
                              : 'text.secondary'
                          }
                        }}
                      />
                    </ListItem>
                  );
                })}
                {getCommitmentsForDate(selectedDate).length > 3 && (
                  <Typography variant="caption" sx={{ 
                    ml: 2, 
                    fontSize: '0.7rem',
                    color: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.6)
                      : 'text.secondary'
                  }}>
                    +{getCommitmentsForDate(selectedDate).length - 3} compromisos más...
                  </Typography>
                )}
              </List>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 1.5,
                color: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.common.white, 0.6)
                  : 'text.secondary'
              }}>
                <EventIcon sx={{ fontSize: 24, opacity: 0.3, mb: 0.5 }} />
                <Typography variant="body2" sx={{ 
                  fontSize: '0.8rem',
                  color: 'inherit'
                }}>
                  No hay compromisos
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      </motion.div>
    </Menu>
  );
};

export default CalendarMenu;
