import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Fab,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  AttachMoney,
  Business,
  Add,
  Notifications,
  Upload,
  Assessment,
  AccountBalance
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useFirestore } from '../../hooks/useFirestore';
import { fCurrency } from '../../utils/formatNumber';
import DashboardHeader from './DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { createSampleData } from '../../utils/sampleData';
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../../utils/designSystem.js';

// Componente de tarjeta premium personalizada
const PremiumStatCard = ({ title, value, icon, color, trend, delay = 0 }) => {
  const theme = useTheme();
  
  const getGradient = () => {
    switch (color) {
      case 'primary': return `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.light}10)`;
      case 'warning': return `linear-gradient(135deg, ${theme.palette.warning.main}15, ${theme.palette.warning.light}10)`;
      case 'error': return `linear-gradient(135deg, ${theme.palette.error.main}15, ${theme.palette.error.light}10)`;
      case 'success': return `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.success.light}10)`;
      default: return `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.light}10)`;
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'primary': return theme.palette.primary.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      case 'success': return theme.palette.success.main;
      default: return theme.palette.primary.main;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: delay,
        type: "spring",
        bounce: 0.3
      }}
      whileHover={{ 
        y: -4,
        scale: 1.01,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          background: getGradient(),
          border: `1px solid ${getIconColor()}30`,
          borderRadius: 4,
          p: 3,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...shimmerEffect,
          '&:hover': {
            boxShadow: `0 12px 24px ${getIconColor()}20`,
            border: `1px solid ${getIconColor()}50`,
          }
        }}
      >
        {/* Círculo decorativo de fondo */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${getIconColor()}10 0%, transparent 70%)`,
            zIndex: 1
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {/* Header con icono */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${getIconColor()}20, ${getIconColor()}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  color: getIconColor(),
                  fontSize: 28
                }
              })}
            </Box>
            
            {trend && (
              <Chip
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                size="small"
                color={trend > 0 ? 'success' : 'error'}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: 2
                }}
              />
            )}
          </Box>

          {/* Título */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1,
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {title}
          </Typography>

          {/* Valor principal */}
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              color: getIconColor(),
              fontFamily: 'monospace',
              textShadow: `0 2px 4px ${getIconColor()}20`
            }}
          >
            {typeof value === 'number' && value > 1000000 ? formatCurrency(value) : value}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};

// Componente de acciones rápidas
const QuickActionsSection = () => {
  const navigate = useNavigate();

  const handleCreateSampleData = async () => {
    try {
      const result = await createSampleData();
      if (result.success) {
        alert('¡Datos de ejemplo creados exitosamente! Ya puedes ver compromisos reales.');
        window.location.reload();
      } else {
        alert('Error al crear datos de ejemplo: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const quickActions = [
    {
      title: 'Nuevo Compromiso',
      description: 'Agregar un nuevo compromiso financiero',
      icon: Add,
      color: 'primary.main',
      action: () => navigate('/commitments'),
      gradient: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
    },
    {
      title: 'Ver Compromisos',
      description: 'Gestionar compromisos existentes',
      icon: AccountBalance,
      color: 'success.main',
      action: () => navigate('/commitments'),
      gradient: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)'
    },
    {
      title: 'Cargar Datos Demo',
      description: 'Crear datos de ejemplo para probar',
      icon: Upload,
      color: 'warning.main',
      action: handleCreateSampleData,
      gradient: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)'
    },
    {
      title: 'Ver Reportes',
      description: 'Analizar datos financieros',
      icon: Assessment,
      color: 'info.main',
      action: () => navigate('/reports'),
      gradient: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary.main">
              Acciones Rápidas
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1, type: "spring", bounce: 0.4 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={action.action}
                    sx={{
                      background: action.gradient,
                      color: 'white',
                      height: 100,
                      flexDirection: 'column',
                      gap: 1,
                      boxShadow: '0 3px 5px 2px rgba(0,0,0,.1)',
                      '&:hover': {
                        boxShadow: '0 6px 10px 4px rgba(0,0,0,.15)',
                      }
                    }}
                  >
                    <action.icon sx={{ fontSize: 24 }} />
                    <Box textAlign="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        {action.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" paragraph>
              💡 <strong>Sugerencia:</strong> Comienza cargando datos de ejemplo para explorar todas las funcionalidades del sistema.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Los datos de ejemplo incluyen diferentes tipos de compromisos, empresas y estados de pago.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sistema de diseño original con efectos visuales spectacular
const designSystem = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: 4,
  borderRadii: {
    sm: 2,
    md: 4,
    lg: 6
  },
  shadows: {
    minimal: '0 2px 8px rgba(0,0,0,0.08)',
    soft: '0 4px 20px rgba(0,0,0,0.12)',
    hover: '0 8px 25px rgba(0,0,0,0.15)',
    medium: '0 6px 20px rgba(0,0,0,0.1)',
    elevated: '0 8px 32px rgba(0,0,0,0.12)',
    glassmorphism: '0 8px 32px rgba(31, 38, 135, 0.37)',
    gentle: '0 4px 15px rgba(0,0,0,0.1)'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    error: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    glassmorphism: 'rgba(255, 255, 255, 0.05)',
    shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
  },
  animations: {
    gentle: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    smooth: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
    spring: { type: "spring", stiffness: 100, damping: 20 },
    bounce: { type: "spring", stiffness: 300, damping: 10 }
  }
};

const WidgetCard = ({ children, gradient, height = 'auto', glassEffect = false, ...props }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={designSystem.animations.smooth}
      whileHover={{ 
        y: -2,
        scale: 1.01,
        transition: designSystem.animations.spring
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Paper
        sx={{
          background: glassEffect 
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`
            : gradient || theme.palette.background.paper,
          borderRadius: designSystem.borderRadius,
          boxShadow: glassEffect ? designSystem.shadows.glassmorphism : designSystem.shadows.elevated,
          height,
          overflow: 'hidden',
          position: 'relative',
          backdropFilter: glassEffect ? 'blur(20px)' : 'none',
          border: glassEffect ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}` : 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradient ? designSystem.gradients.primary : 
                       `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            borderRadius: `${designSystem.borderRadius}px ${designSystem.borderRadius}px 0 0`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: designSystem.gradients.shimmer,
            animation: 'shimmer 3s infinite',
            opacity: 0.3,
          },
          '@keyframes shimmer': {
            '0%': { left: '-100%' },
            '50%': { left: '100%' },
            '100%': { left: '100%' }
          }
        }}
        {...props}
      >
        {children}
      </Paper>
    </motion.div>
  );
};

const SimpleCalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const { data: commitments = [], loading } = useFirestore('commitments');
  const theme = useTheme();

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
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Empezar desde domingo
    
    const days = [];
    for (let i = 0; i < 42; i++) { // 6 semanas * 7 días
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
    return dayCommitments.some(c => c.status !== 'completed') ? 'warning' : 'success';
  };

  const days = getDaysInMonth();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthStats = getMonthStats();
  
  return (
    <WidgetCard height="400px" glassEffect>
      <CardContent sx={{ p: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo degradado dinámico */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }
        }} />
        
        <Box sx={{ position: 'relative', p: 3, height: '100%', display: 'flex', flexDirection: 'row', gap: 3, zIndex: 1 }}>
          {/* Sección izquierda: Calendario */}
          <Box sx={{ flex: 0.55, display: 'flex', flexDirection: 'column' }}>
            {/* Header del calendario mejorado */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, ...designSystem.animations.spring }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <CalendarToday sx={{ 
                      mr: 2, 
                      color: 'white',
                      fontSize: 28,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }} />
                  </motion.div>
                  <Box>
                    <Typography variant="h6" fontWeight="700" sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      Calendario
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Ir a hoy">
                    <IconButton 
                      size="small" 
                      onClick={goToToday}
                      sx={{ 
                        color: theme.palette.text.secondary, 
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Schedule fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton 
                    size="small" 
                    onClick={() => navigateMonth(-1)} 
                    sx={{ 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => navigateMonth(1)}
                    sx={{ 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
              
              {/* Estadísticas del mes */}
              {monthStats.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mb: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    p: 1.5,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <Chip
                      size="small"
                      label={`${monthStats.total} total`}
                      sx={{ 
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        fontSize: '0.7rem',
                        backdropFilter: 'blur(5px)'
                      }}
                    />
                    {monthStats.completed > 0 && (
                      <Chip
                        size="small"
                        label={`${monthStats.completed} ✓`}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(76, 175, 80, 0.5)',
                          fontSize: '0.7rem',
                          backdropFilter: 'blur(5px)'
                        }}
                      />
                    )}
                    {monthStats.overdue > 0 && (
                      <Chip
                        size="small"
                        label={`${monthStats.overdue} ⚠`}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(244, 67, 54, 0.5)',
                          fontSize: '0.7rem',
                          backdropFilter: 'blur(5px)'
                        }}
                      />
                    )}
                    {monthStats.pending > 0 && (
                      <Chip
                        size="small"
                        label={`${monthStats.pending} ⏳`}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255, 193, 7, 0.5)',
                          fontSize: '0.7rem',
                          backdropFilter: 'blur(5px)'
                        }}
                      />
                    )}
                  </Box>
                </motion.div>
              )}
            </motion.div>
          
            {/* Calendario completo */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Nombres de los días */}
              <Grid container sx={{ mb: 1 }}>
                {dayNames.map((dayName) => (
                  <Grid item xs key={dayName} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight="600" sx={{ 
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      {dayName}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              
              {/* Días del mes */}
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={0.5}>
                  {days.map((date, index) => {
                    const isCurrentMonthDay = isCurrentMonth(date);
                    const isTodayDate = isToday(date);
                    const hasCommitmentsOnDate = hasCommitments(date);
                    const priority = getCommitmentPriority(date);
                    const dayCommitments = getCommitmentsForDate(date);
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                    const isHovered = hoveredDate && date.toDateString() === hoveredDate.toDateString();
                    
                    return (
                      <Grid item xs key={index} sx={{ aspectRatio: '1', minHeight: '28px' }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + (index * 0.008), duration: 0.2 }}
                          whileHover={{ scale: 1.1, transition: { duration: 0.1 } }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Box
                            onClick={() => setSelectedDate(date)}
                            onMouseEnter={() => setHoveredDate(date)}
                            onMouseLeave={() => setHoveredDate(null)}
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              position: 'relative',
                              background: isTodayDate ? 
                                'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 
                                isSelected ?
                                  alpha(theme.palette.primary.main, 0.2) :
                                  hasCommitmentsOnDate && isCurrentMonthDay ? 
                                    alpha(
                                      priority === 'error' ? theme.palette.error.main :
                                      priority === 'warning' ? theme.palette.warning.main :
                                      theme.palette.success.main, 0.1
                                    ) : 
                                    isHovered ? alpha(theme.palette.action.hover, 0.1) : 'transparent',
                              border: isTodayDate || isSelected ? 
                                `2px solid ${theme.palette.primary.main}` : 
                                hasCommitmentsOnDate && isCurrentMonthDay ?
                                  `1px solid ${alpha(
                                    priority === 'error' ? theme.palette.error.main :
                                    priority === 'warning' ? theme.palette.warning.main :
                                    theme.palette.success.main, 0.4
                                  )}` : 
                                  isHovered ? `1px solid ${theme.palette.divider}` : 'none',
                              color: isTodayDate ? 'white' : 
                                     isSelected ? theme.palette.primary.contrastText : 
                                     isCurrentMonthDay ? theme.palette.text.primary : theme.palette.text.disabled,
                              fontWeight: isTodayDate || hasCommitmentsOnDate || isSelected ? 600 : 400,
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isTodayDate ? designSystem.shadows.elevated :
                                         isSelected ? designSystem.shadows.elevated :
                                         isHovered ? designSystem.shadows.gentle : 'none',
                              '&:hover': {
                                transform: 'scale(1.02) translateY(-1px)',
                                boxShadow: designSystem.shadows.elevated
                              }
                            }}
                          >
                            <Typography variant="caption" fontWeight="inherit" sx={{ 
                              fontSize: '0.7rem'
                            }}>
                              {date.getDate()}
                            </Typography>
                            
                            {/* Indicador de compromisos pequeño */}
                            {hasCommitmentsOnDate && isCurrentMonthDay && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 2,
                                  right: 2,
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: priority === 'error' ? theme.palette.error.main :
                                           priority === 'warning' ? theme.palette.warning.main :
                                           theme.palette.success.main,
                                  boxShadow: designSystem.shadows.gentle,
                                }}
                              />
                            )}
                          </Box>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
              
              {/* Leyenda */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.error.main, 
                      mr: 0.5,
                      boxShadow: designSystem.shadows.gentle
                    }} />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                      Vencido
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.warning.main, 
                      mr: 0.5,
                      boxShadow: designSystem.shadows.gentle
                    }} />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                      Pendiente
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.success.main, 
                      mr: 0.5,
                      boxShadow: designSystem.shadows.gentle
                    }} />
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                      Completado
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Box>
          </Box>

          {/* Sección derecha: Eventos del día seleccionado */}
          <Box sx={{ flex: 0.45, display: 'flex', flexDirection: 'column' }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Header de eventos */}
              <Box sx={{ 
                mb: 1.5,
                pb: 1,
                borderBottom: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="h6" fontWeight="600" sx={{ 
                  color: theme.palette.text.primary,
                  fontSize: '0.95rem',
                  mb: 0.5
                }}>
                  Eventos del Día
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                  {selectedDate ? 
                    selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    }) :
                    'Selecciona una fecha'
                  }
                </Typography>
              </Box>

              {/* Lista de eventos */}
              <Box sx={{ 
                flex: 1, 
                maxHeight: 'calc(100% - 70px)', 
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.background.paper, 0.1),
                  borderRadius: '2px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.text.secondary, 0.3),
                  borderRadius: '2px',
                  '&:hover': {
                    background: alpha(theme.palette.text.secondary, 0.4),
                  }
                },
                '&::-webkit-scrollbar-thumb:active': {
                  background: alpha(theme.palette.text.secondary, 0.5),
                },
                // Firefox
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(theme.palette.text.secondary, 0.3)} ${alpha(theme.palette.background.paper, 0.1)}`,
              }}>
                <AnimatePresence mode="wait">
                  {selectedDate ? (
                    <motion.div
                      key={selectedDate.toDateString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {getCommitmentsForDate(selectedDate).length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {getCommitmentsForDate(selectedDate).map((commitment, index) => {
                            const priority = commitment.dueDate.toDate() < new Date() && commitment.status !== 'completed' ? 'error' :
                                           commitment.status !== 'completed' ? 'warning' : 'success';
                            const priorityColor = priority === 'error' ? '#f44336' :
                                                 priority === 'warning' ? '#ff9800' : '#4caf50';
                            
                            return (
                              <motion.div
                                key={commitment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Box
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${alpha(priorityColor, 0.15)}, ${alpha(priorityColor, 0.05)})`,
                                    border: `1px solid ${alpha(priorityColor, 0.3)}`,
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      background: `linear-gradient(135deg, ${alpha(priorityColor, 0.25)}, ${alpha(priorityColor, 0.1)})`,
                                      transform: 'translateY(-2px)',
                                      boxShadow: `0 4px 12px ${alpha(priorityColor, 0.3)}`
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    {/* Indicador de estado */}
                                    <Box sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      bgcolor: priorityColor,
                                      boxShadow: `0 0 8px ${priorityColor}`,
                                      mt: 0.5,
                                      flexShrink: 0
                                    }} />
                                    
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography 
                                        variant="body2" 
                                        fontWeight="600" 
                                        sx={{ 
                                          color: 'white',
                                          mb: 0.5,
                                          fontSize: '0.85rem',
                                          lineHeight: 1.3
                                        }}
                                      >
                                        {commitment.title}
                                      </Typography>
                                      
                                      {commitment.company && (
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            color: 'rgba(255,255,255,0.7)',
                                            display: 'block',
                                            mb: 0.5,
                                            fontSize: '0.7rem'
                                          }}
                                        >
                                          {commitment.company}
                                        </Typography>
                                      )}
                                      
                                      {commitment.amount && (
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            color: priorityColor,
                                            fontWeight: 600,
                                            fontSize: '0.75rem'
                                          }}
                                        >
                                          {fCurrency(commitment.amount)}
                                        </Typography>
                                      )}
                                      
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Chip
                                          size="small"
                                          label={
                                            commitment.status === 'completed' ? 'Completado' :
                                            priority === 'error' ? 'Vencido' : 'Pendiente'
                                          }
                                          sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            color: 'white',
                                            backgroundColor: alpha(priorityColor, 0.3),
                                            border: `1px solid ${alpha(priorityColor, 0.5)}`
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              </motion.div>
                            );
                          })}
                        </Box>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 4,
                            color: 'rgba(255,255,255,0.6)'
                          }}>
                            <Schedule sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Sin compromisos
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              Este día está libre
                            </Typography>
                          </Box>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        color: 'rgba(255,255,255,0.6)'
                      }}>
                        <CalendarToday sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Selecciona una fecha
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Haz clic en un día para ver sus eventos
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          </Box>
        </Box>
      </CardContent>
    </WidgetCard>
  );
};

const SimpleCommitmentsStatusWidget = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);
  const { data: commitments = [], loading } = useFirestore('commitments');
  const theme = useTheme();

  // Calcular estadísticas de compromisos
  const getCommitmentStats = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: commitments.length,
      completed: 0,
      overdue: 0,
      upcoming: 0,
      onTrack: 0,
      thisMonth: 0,
      totalAmount: 0
    };

    commitments.forEach(commitment => {
      if (!commitment.dueDate) return;
      
      const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      const amount = parseFloat(commitment.amount) || 0;
      stats.totalAmount += amount;

      // Compromisos de este mes
      if (dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()) {
        stats.thisMonth++;
      }

      if (commitment.status === 'completed') {
        stats.completed++;
      } else if (dueDate < now) {
        stats.overdue++;
      } else if (dueDate <= nextWeek) {
        stats.upcoming++;
      } else {
        stats.onTrack++;
      }
    });

    return stats;
  };

  const stats = getCommitmentStats();
  
  // Configuración de tarjetas de estado
  const statusCards = [
    {
      id: 'overdue',
      title: 'Vencidos',
      count: stats.overdue,
      icon: ErrorOutline,
      color: '#f44336',
      gradient: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
      description: 'Requieren atención inmediata',
      priority: 'critical'
    },
    {
      id: 'upcoming',
      title: 'Próximos',
      count: stats.upcoming,
      icon: AccessTime,
      color: '#ff9800',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      description: 'Vencen en los próximos 7 días',
      priority: 'warning'
    },
    {
      id: 'completed',
      title: 'Completados',
      count: stats.completed,
      icon: CheckCircle,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
      description: 'Finalizados exitosamente',
      priority: 'success'
    },
    {
      id: 'onTrack',
      title: 'Al día',
      count: stats.onTrack,
      icon: Timeline,
      color: '#2196f3',
      gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
      description: 'En tiempo y forma',
      priority: 'info'
    }
  ];

  // Calcular el progreso general
  const overallProgress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const getProgressColor = () => {
    if (overallProgress >= 80) return '#4caf50';
    if (overallProgress >= 60) return '#2196f3';
    if (overallProgress >= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <WidgetCard height="450px" glassEffect>
      <CardContent sx={{ p: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo degradado dinámico */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(getProgressColor(), 0.1)} 0%, ${alpha(getProgressColor(), 0.2)} 100%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }
        }} />

        <Box sx={{ position: 'relative', p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
          {/* Header mejorado */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...designSystem.animations.bounce }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${getProgressColor()}, ${alpha(getProgressColor(), 0.8)})`,
                    mr: 2,
                    boxShadow: `0 4px 12px ${alpha(getProgressColor(), 0.3)}`
                  }}>
                    <Assessment sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                </motion.div>
                <Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Estado de Compromisos
                  </Typography>
                  <Typography variant="caption" sx={{ color: getProgressColor(), fontWeight: 600 }}>
                    {stats.total} total • {stats.thisMonth} este mes
                  </Typography>
                </Box>
              </Box>
              
              {/* Indicador de progreso circular pequeño */}
              <Box sx={{ position: 'relative', width: 50, height: 50 }}>
                <Box sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `conic-gradient(${getProgressColor()} ${overallProgress * 3.6}deg, ${alpha(theme.palette.grey[300], 0.3)} 0deg)`,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70%',
                    height: '70%',
                    borderRadius: '50%',
                    background: theme.palette.background.paper,
                  }
                }} />
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" fontWeight="700" sx={{ color: getProgressColor(), fontSize: '0.7rem' }}>
                    {overallProgress.toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>

          {/* Tarjetas de estado en grid 2x2 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ flex: 1 }}>
              {statusCards.map((card, index) => (
                <Grid item xs={6} key={card.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (index * 0.05), ...designSystem.animations.smooth }}
                    whileHover={{ y: -1 }}
                    onHoverStart={() => setHoveredCard(card.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        p: 1.5,
                        borderRadius: 2,
                        background: hoveredCard === card.id ? 
                          alpha(card.color, 0.08) :
                          alpha(card.color, 0.04),
                        border: `1px solid ${alpha(card.color, hoveredCard === card.id ? 0.15 : 0.1)}`,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <card.icon sx={{ 
                          color: card.color, 
                          fontSize: 20
                        }} />
                        <Typography 
                          variant="h5" 
                          fontWeight="600" 
                          sx={{ 
                            color: card.color
                          }}
                        >
                          <CountUp value={card.count} />
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.5 }}>
                        {card.title}
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.7rem',
                          lineHeight: 1.2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {card.description}
                      </Typography>

                      {/* Indicador de cantidad con animación */}
                      {card.count > 0 && (
                        <Box sx={{
                          position: 'absolute',
                          bottom: 6,
                          right: 6,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: card.color,
                          boxShadow: designSystem.shadows.minimal,
                        }} />
                      )}
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Resumen financiero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Box sx={{ 
                mt: 1.5, 
                p: 1.5, 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(getProgressColor(), 0.1)}, ${alpha(getProgressColor(), 0.05)})`,
                border: `1px solid ${alpha(getProgressColor(), 0.2)}`,
                backdropFilter: 'blur(10px)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ color: getProgressColor(), mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" fontWeight="600" color="text.secondary">
                      Monto Total
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="600" sx={{ color: getProgressColor() }}>
                    {fCurrency(stats.totalAmount)}
                  </Typography>
                </Box>
                
                {/* Barra de progreso general */}
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                      Progreso General
                    </Typography>
                    <Typography variant="caption" sx={{ color: getProgressColor(), fontWeight: 700 }}>
                      {overallProgress.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={overallProgress} 
                    sx={{
                      height: 6,
                      borderRadius: 2,
                      bgcolor: alpha(getProgressColor(), 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${getProgressColor()}, ${alpha(getProgressColor(), 0.8)})`
                      }
                    }}
                  />
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Box>
      </CardContent>
    </WidgetCard>
  );
};

const SimpleWeatherWidget = () => {
  const { userProfile } = useAuth(); // Acceder al perfil del usuario
  const [weatherData, setWeatherData] = useState({
    temperature: '--',
    location: 'Cargando...',
    condition: 'Obteniendo datos...',
    humidity: '--',
    windSpeed: '--',
    pressure: '--',
    loading: true,
    error: null
  });

  const fetchWeatherData = async () => {
    try {
      setWeatherData(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔍 Debug completo del perfil del usuario:', {
        'userProfile existe': !!userProfile,
        'userProfile.city': userProfile?.city,
        'userProfile.location': userProfile?.location,
        'userProfile.address': userProfile?.address,
        'userProfile.country': userProfile?.country,
        'userProfile completo': userProfile,
        'Todas las propiedades del perfil': userProfile ? Object.keys(userProfile) : 'No hay perfil'
      });

      // Prioridad 1: Usar ubicación del perfil del usuario (buscar diferentes campos)
      if (userProfile) {
        let city = null;
        let country = null;
        
        // Buscar ciudad en diferentes campos posibles
        city = userProfile.city || userProfile.ciudad || userProfile.location || userProfile.address;
        
        // Buscar país/ubicación en diferentes campos posibles
        country = userProfile.country || userProfile.pais || userProfile.location || userProfile.estado;
        
        console.log('🏠 Verificando ubicación del perfil:', {
          'Campo city encontrado': city,
          'Campo country encontrado': country,
          'Campos disponibles en perfil': userProfile ? Object.keys(userProfile) : 'Sin perfil'
        });
        
        if (city) {
          console.log('✅ Usando ubicación del perfil:', { city, country });
          
          const weatherFromProfile = getWeatherForCity(city, country);
        
          setTimeout(() => {
            setWeatherData({
              ...weatherFromProfile,
              loading: false,
              error: null
            });
          }, 800);
          return;
        } else {
          console.log('❌ No se encontró ciudad en el perfil del usuario');
        }
      }

      // Prioridad 2: Intentar obtener ubicación del navegador como fallback
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Usar coordenadas reales para obtener clima de la ubicación actual
              const { latitude, longitude } = position.coords;
              
              // Simular datos del clima basados en la ubicación real
              // En un proyecto real, aquí usarías una API como OpenWeatherMap
              const weatherSimulation = getWeatherForLocation(latitude, longitude);
              
              console.log('🌤️ Datos del clima obtenidos por geolocalización:', {
                coords: { latitude, longitude },
                weather: weatherSimulation
              });
              
              setTimeout(() => {
                setWeatherData({
                  ...weatherSimulation,
                  loading: false,
                  error: null
                });
              }, 800);
            } catch (error) {
              console.error('Error obteniendo clima:', error);
              fallbackToDefaultLocation();
            }
          },
          (error) => {
            console.warn('Geolocalización no disponible:', error);
            fallbackToDefaultLocation();
          },
          {
            timeout: 10000,
            enableHighAccuracy: false,
            maximumAge: 300000 // 5 minutos de cache
          }
        );
      } else {
        console.warn('Geolocalización no soportada');
        fallbackToDefaultLocation();
      }

      function fallbackToDefaultLocation() {
        // Usar Pereira como ubicación por defecto (datos fijos y consistentes)
        setTimeout(() => {
          setWeatherData({
            temperature: 19,
            location: 'Pereira, Colombia',
            condition: 'Parcialmente nublado',
            humidity: 66,
            windSpeed: 10,
            pressure: 1024,
            loading: false,
            error: null
          });
        }, 800);
      }

      function getWeatherForCity(city, country = '') {
        // Base de datos de clima para ciudades principales
        const cityWeatherData = {
          // Colombia
          'bogotá': { temp: 15, condition: 'Nublado', humidity: 75 },
          'medellín': { temp: 22, condition: 'Parcialmente nublado', humidity: 70 },
          'cali': { temp: 25, condition: 'Soleado', humidity: 65 },
          'barranquilla': { temp: 28, condition: 'Soleado', humidity: 80 },
          'cartagena': { temp: 30, condition: 'Caluroso', humidity: 85 },
          'pereira': { temp: 19, condition: 'Parcialmente nublado', humidity: 66 },
          'manizales': { temp: 17, condition: 'Lluvia ligera', humidity: 80 },
          'bucaramanga': { temp: 24, condition: 'Soleado', humidity: 60 },
          'santa marta': { temp: 29, condition: 'Soleado', humidity: 75 },
          'ibagué': { temp: 21, condition: 'Parcialmente nublado', humidity: 68 },
          
          // Otras ciudades importantes
          'madrid': { temp: 12, condition: 'Nublado', humidity: 60 },
          'barcelona': { temp: 16, condition: 'Soleado', humidity: 65 },
          'londres': { temp: 8, condition: 'Lluvia ligera', humidity: 85 },
          'parís': { temp: 10, condition: 'Nublado', humidity: 70 },
          'nueva york': { temp: 5, condition: 'Nieve', humidity: 55 },
          'miami': { temp: 28, condition: 'Soleado', humidity: 80 },
          'ciudad de méxico': { temp: 18, condition: 'Parcialmente nublado', humidity: 50 },
          'buenos aires': { temp: 20, condition: 'Soleado', humidity: 65 },
          'lima': { temp: 22, condition: 'Nublado', humidity: 75 },
        };

        const cityKey = city.toLowerCase().trim();
        const cityData = cityWeatherData[cityKey];
        
        if (cityData) {
          return {
            temperature: cityData.temp,
            location: `${city}${country ? ', ' + country : ''}`,
            condition: cityData.condition,
            humidity: cityData.humidity,
            windSpeed: Math.round(8 + Math.random() * 8), // 8-16 km/h
            pressure: Math.round(1015 + Math.random() * 20) // 1015-1035 hPa
          };
        }

        // Si la ciudad no está en la base de datos, usar datos genéricos
        return {
          temperature: 20,
          location: `${city}${country ? ', ' + country : ''}`,
          condition: 'Parcialmente nublado',
          humidity: 65,
          windSpeed: 10,
          pressure: 1020
        };
      }

      function getWeatherForLocation(lat, lon) {
        // Datos fijos y consistentes para Pereira, Colombia
        // Para Pereira, Colombia (aproximadamente 4.8°N, 75.7°W)
        if (lat > 4 && lat < 6 && lon > -76 && lon < -75) {
          return {
            temperature: 19,
            location: 'Pereira, Colombia',
            condition: 'Parcialmente nublado',
            humidity: 66,
            windSpeed: 10,
            pressure: 1024
          };
        }
        
        // Para otras ubicaciones en Colombia - datos consistentes
        if (lat > -5 && lat < 15 && lon > -85 && lon < -65) {
          return {
            temperature: 22,
            location: 'Colombia',
            condition: 'Parcialmente nublado',
            humidity: 70,
            windSpeed: 8,
            pressure: 1015
          };
        }

        // Para ubicaciones fuera de Colombia - datos consistentes
        return {
          temperature: 20,
          location: 'Pereira, Colombia', // Siempre mostrar Pereira como ubicación por defecto
          condition: 'Parcialmente nublado',
          humidity: 65,
          windSpeed: 12,
          pressure: 1020
        };
      }

    } catch (error) {
      console.error('Error en fetchWeatherData:', error);
      setWeatherData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar datos del clima'
      }));
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [userProfile]); // Ejecutar cuando cambie el perfil del usuario

  const getWeatherConfig = (condition) => {
    const configs = {
      'Soleado': {
        icon: '☀️',
        gradient: 'linear-gradient(135deg, #FDB813 0%, #FF6B35 50%, #F7931E 100%)',
        animation: 'sunny',
        particles: '🌟',
        particleCount: 6
      },
      'Despejado': {
        icon: '☀️',
        gradient: 'linear-gradient(135deg, #FDB813 0%, #FF6B35 50%, #F7931E 100%)',
        animation: 'sunny',
        particles: '✨',
        particleCount: 8
      },
      'Caluroso': {
        icon: '🌡️',
        gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #C73E1D 100%)',
        animation: 'hot',
        particles: '🔥',
        particleCount: 5
      },
      'Parcialmente nublado': {
        icon: '⛅',
        gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)',
        animation: 'partlyCloudy',
        particles: '☁️',
        particleCount: 4
      },
      'Nublado': {
        icon: '☁️',
        gradient: 'linear-gradient(135deg, #636e72 0%, #2d3436 50%, #74b9ff 100%)',
        animation: 'cloudy',
        particles: '☁️',
        particleCount: 6
      },
      'Lluvia ligera': {
        icon: '🌧️',
        gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 50%, #74b9ff 100%)',
        animation: 'rainy',
        particles: '💧',
        particleCount: 12
      },
      'Llovizna': {
        icon: '�️',
        gradient: 'linear-gradient(135deg, #636e72 0%, #74b9ff 50%, #0984e3 100%)',
        animation: 'rainy',
        particles: '💧',
        particleCount: 8
      },
      'Tormenta': {
        icon: '⛈️',
        gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 50%, #e17055 100%)',
        animation: 'storm',
        particles: '⚡',
        particleCount: 10
      }
    };

    return configs[condition] || configs['Parcialmente nublado'];
  };

  const weatherConfig = getWeatherConfig(weatherData.condition);
  const theme = useTheme();

  return (
    <WidgetCard height="350px" glassEffect>
      <CardContent sx={{ p: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo degradado dinámico según clima */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: weatherConfig.gradient,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)',
          }
        }} />
        
        {/* Partículas animadas según el clima */}
        {!weatherData.loading && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
            {Array.from({ length: weatherConfig.particleCount }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  fontSize: weatherConfig.particles === '💧' ? '12px' : '16px',
                  animation: `${weatherConfig.animation} ${3 + Math.random() * 2}s infinite linear`,
                  animationDelay: `${Math.random() * 3}s`,
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  opacity: weatherConfig.particles === '💧' ? 0.7 : 0.8,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                  '@keyframes sunny': {
                    '0%': {
                      transform: 'translateY(-20px) rotate(0deg)',
                      opacity: 0
                    },
                    '50%': {
                      opacity: 1
                    },
                    '100%': {
                      transform: 'translateY(370px) rotate(360deg)',
                      opacity: 0
                    }
                  },
                  '@keyframes hot': {
                    '0%': {
                      transform: 'translateY(-20px) scale(0.5)',
                      opacity: 0
                    },
                    '50%': {
                      opacity: 1,
                      transform: 'translateY(100px) scale(1)'
                    },
                    '100%': {
                      transform: 'translateY(370px) scale(0.5)',
                      opacity: 0
                    }
                  },
                  '@keyframes partlyCloudy': {
                    '0%': {
                      transform: 'translateX(-50px) translateY(-20px)',
                      opacity: 0
                    },
                    '50%': {
                      opacity: 0.8
                    },
                    '100%': {
                      transform: 'translateX(50px) translateY(370px)',
                      opacity: 0
                    }
                  },
                  '@keyframes cloudy': {
                    '0%': {
                      transform: 'translateX(-30px) translateY(-20px)',
                      opacity: 0
                    },
                    '50%': {
                      opacity: 0.6
                    },
                    '100%': {
                      transform: 'translateX(30px) translateY(370px)',
                      opacity: 0
                    }
                  },
                  '@keyframes rainy': {
                    '0%': {
                      transform: 'translateY(-20px)',
                      opacity: 0
                    },
                    '10%': {
                      opacity: 1
                    },
                    '100%': {
                      transform: 'translateY(370px)',
                      opacity: 0.3
                    }
                  },
                  '@keyframes storm': {
                    '0%': {
                      transform: 'translateY(-20px) scale(0.8)',
                      opacity: 0
                    },
                    '20%': {
                      opacity: 1,
                      transform: 'translateY(50px) scale(1.2)'
                    },
                    '60%': {
                      opacity: 0.8,
                      transform: 'translateY(200px) scale(0.9)'
                    },
                    '100%': {
                      transform: 'translateY(370px) scale(0.7)',
                      opacity: 0
                    }
                  }
                }}
              >
                {weatherConfig.particles}
              </Box>
            ))}
          </Box>
        )}
        
        {/* Contenido principal */}
        <Box sx={{ position: 'relative', p: 4, height: '100%', color: 'white', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, ...designSystem.animations.bounce }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  animate={{ 
                    rotate: weatherConfig.animation === 'sunny' ? [0, 360] : 0,
                    scale: weatherConfig.animation === 'hot' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  style={{
                    fontSize: '32px',
                    marginRight: '12px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                >
                  {weatherConfig.icon}
                </motion.div>
                <Typography variant="h6" fontWeight="700" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Clima
                </Typography>
              </Box>
              <Tooltip 
                title="Actualizar clima"
                disableHoverListener={weatherData.loading}
                disableFocusListener={weatherData.loading}
                disableTouchListener={weatherData.loading}
              >
                <span>
                  <IconButton 
                    sx={{ 
                      color: 'white', 
                      opacity: 0.9,
                      '&:hover': { opacity: 1, transform: 'rotate(180deg)' },
                      transition: 'all 0.3s ease'
                    }}
                    size="small"
                    onClick={fetchWeatherData}
                    disabled={weatherData.loading}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </motion.div>
          
          {weatherData.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60%' }}>
              <CircularProgress sx={{ color: 'white' }} size={40} />
            </Box>
          ) : (
            <>
              {/* Temperatura principal */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <motion.div
                      animate={weatherConfig.animation === 'hot' ? { 
                        textShadow: [
                          '0 4px 8px rgba(255,107,53,0.5)',
                          '0 4px 15px rgba(255,107,53,0.8)',
                          '0 4px 8px rgba(255,107,53,0.5)'
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Typography 
                        variant="h1" 
                        fontWeight="900" 
                        sx={{ 
                          fontSize: '4rem',
                          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                          mr: 1
                        }}
                      >
                        {weatherData.temperature}
                      </Typography>
                    </motion.div>
                    <Typography 
                      variant="h3" 
                      fontWeight="300" 
                      sx={{ 
                        opacity: 0.8,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      °C
                    </Typography>
                  </Box>
                </motion.div>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 0.5, fontSize: 18, opacity: 0.9 }} />
                  <Typography variant="h6" fontWeight="600" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {weatherData.location}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div
                    animate={weatherConfig.animation === 'rainy' ? { y: [0, 2, 0] } : 
                             weatherConfig.animation === 'storm' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    style={{ marginRight: '8px', fontSize: '1.5rem' }}
                  >
                    {weatherConfig.icon}
                  </motion.div>
                  <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                    {weatherData.condition}
                  </Typography>
                </Box>
              </Box>
              
              {/* Detalles meteorológicos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                        Humedad
                      </Typography>
                      <Typography variant="h6" fontWeight="700">
                        {weatherData.humidity}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                        Viento
                      </Typography>
                      <Typography variant="h6" fontWeight="700">
                        {weatherData.windSpeed} km/h
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                        Presión
                      </Typography>
                      <Typography variant="h6" fontWeight="700">
                        {weatherData.pressure} hPa
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </motion.div>
            </>
          )}
        </Box>
      </CardContent>
    </WidgetCard>
  );
};

const SimpleStorageWidget = () => {
  const theme = useTheme();
  const storageStats = useStorageStats();
  
  const usagePercentage = storageStats.total > 0 ? (storageStats.used / storageStats.total) * 100 : 0;
  
  const getStorageStatus = () => {
    if (usagePercentage > 90) return { status: 'critical', color: '#ff4757', message: '¡Crítico!' };
    if (usagePercentage > 75) return { status: 'warning', color: '#ffa502', message: 'Alto uso' };
    if (usagePercentage > 50) return { status: 'moderate', color: '#3742fa', message: 'Moderado' };
    return { status: 'good', color: '#2ed573', message: 'Óptimo' };
  };

  const storageStatus = getStorageStatus();
  
  return (
    <WidgetCard height="350px" glassEffect>
      <CardContent sx={{ p: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo degradado dinámico según el uso */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(storageStatus.color, 0.1)} 0%, ${alpha(storageStatus.color, 0.3)} 100%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }
        }} />
        
        {/* Contenido principal */}
        <Box sx={{ position: 'relative', p: 4, height: '100%', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, ...designSystem.animations.bounce }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${storageStatus.color}, ${alpha(storageStatus.color, 0.7)})`,
                  mr: 2,
                  boxShadow: `0 4px 12px ${alpha(storageStatus.color, 0.3)}`
                }}>
                  <Storage sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Almacenamiento
                  </Typography>
                  <Typography variant="caption" sx={{ color: storageStatus.color, fontWeight: 600 }}>
                    {storageStatus.message}
                  </Typography>
                </Box>
              </Box>
              {storageStats.loading && <CircularProgress size={20} />}
            </Box>
          </motion.div>
          
          {/* Indicador circular de progreso */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              style={{ position: 'relative' }}
            >
              <Box sx={{ 
                position: 'relative',
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Círculo de fondo */}
                <Box sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `conic-gradient(${storageStatus.color} ${usagePercentage * 3.6}deg, ${alpha(theme.palette.grey[300], 0.3)} 0deg)`,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '75%',
                    height: '75%',
                    borderRadius: '50%',
                    background: theme.palette.background.paper,
                  }
                }} />
                
                {/* Contenido central */}
                <Box sx={{ 
                  position: 'relative', 
                  textAlign: 'center',
                  zIndex: 1
                }}>
                  <Typography 
                    variant="h4" 
                    fontWeight="900" 
                    sx={{ 
                      color: storageStatus.color,
                      lineHeight: 1,
                      mb: 0.5
                    }}
                  >
                    {usagePercentage.toFixed(0)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    En uso
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Box>
          
          {/* Detalles de uso */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  Espacio utilizado
                </Typography>
                <Typography variant="body2" color="text.primary" fontWeight="700">
                  {storageStats.used || 0} GB de {storageStats.total || 5} GB
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  Espacio libre
                </Typography>
                <Typography variant="body2" sx={{ color: storageStatus.color, fontWeight: 700 }}>
                  {((storageStats.total || 5) - (storageStats.used || 0)).toFixed(1)} GB
                </Typography>
              </Box>
            </Box>
          </motion.div>
          
          {/* Distribución de archivos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Typography variant="subtitle2" color="text.primary" fontWeight="700" sx={{ mb: 2 }}>
              Distribución de Archivos
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                }}>
                  <Typography variant="h6" fontWeight="800" color="primary.main">
                    {storageStats.documents || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Documentos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.secondary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                  }
                }}>
                  <Typography variant="h6" fontWeight="800" color="secondary.main">
                    {storageStats.images || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Imágenes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ 
                  textAlign: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`
                  }
                }}>
                  <Typography variant="h6" fontWeight="800" color="success.main">
                    {storageStats.files || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Otros
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        </Box>
      </CardContent>
    </WidgetCard>
  );
};

const SimpleTimeWidget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const theme = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return { period: 'Madrugada', icon: '🌙', color: '#6c5ce7' };
    if (hour < 12) return { period: 'Mañana', icon: '🌅', color: '#fdcb6e' };
    if (hour < 18) return { period: 'Tarde', icon: '☀️', color: '#74b9ff' };
    return { period: 'Noche', icon: '🌆', color: '#6c5ce7' };
  };

  const timeOfDay = getTimeOfDay();
  const dayProgress = (currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) * 100;
  const weekProgress = ((currentTime.getDay() === 0 ? 7 : currentTime.getDay()) - 1) / 6 * 100;

  return (
    <WidgetCard height="350px" glassEffect>
      <CardContent sx={{ p: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo degradado dinámico según hora del día */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${timeOfDay.color} 0%, ${alpha(timeOfDay.color, 0.6)} 100%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }
        }} />
        
        {/* Contenido principal */}
        <Box sx={{ position: 'relative', p: 4, height: '100%', color: 'white', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, ...designSystem.animations.bounce }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                fontSize: '28px',
                mr: 2,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}>
                {timeOfDay.icon}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {timeOfDay.period}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Tiempo local
                </Typography>
              </Box>
            </Box>
          </motion.div>
          
          {/* Hora principal */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
            >
              <Typography 
                variant="h2" 
                fontWeight="900" 
                sx={{
                  fontSize: '3.5rem',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  mb: 1,
                  fontFamily: '"Roboto Mono", monospace'
                }}
              >
                {currentTime.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </Typography>
            </motion.div>
            <Typography variant="body1" sx={{ 
              opacity: 0.9, 
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              textTransform: 'capitalize',
              fontWeight: 500
            }}>
              {currentTime.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long'
              })}
            </Typography>
          </Box>
          
          {/* Progreso del día y semana */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  Progreso del día
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {dayProgress.toFixed(0)}%
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                borderRadius: 4,
                background: 'rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dayProgress}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,1))',
                    borderRadius: 4
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  Progreso de la semana
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {weekProgress.toFixed(0)}%
                </Typography>
              </Box>
              <Box sx={{ 
                height: 8, 
                borderRadius: 4,
                background: 'rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weekProgress}%` }}
                  transition={{ duration: 1, delay: 1 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.9))',
                    borderRadius: 4
                  }}
                />
              </Box>
            </Box>
          </motion.div>
        </Box>
      </CardContent>
    </WidgetCard>
  );
};



const WelcomeDashboardSimple = () => {
  const { user, userProfile } = useAuth();
  const theme = useTheme();
  
  // Debug temporal para verificar datos del usuario
  React.useEffect(() => {
    if (user || userProfile) {
      console.log('🔍 Debug Usuario:', {
        'user.photoURL': user?.photoURL,
        'user.displayName': user?.displayName,
        'user.email': user?.email,
        'user.metadata.lastSignInTime': user?.metadata?.lastSignInTime,
        'user.metadata.creationTime': user?.metadata?.creationTime,
        'userProfile.photoURL': userProfile?.photoURL,
        'userProfile.avatar': userProfile?.avatar,
        'userProfile.name': userProfile?.name,
        'userProfile completo': userProfile
      });
    }
  }, [user, userProfile]);
  const currentTime = new Date().getHours();
  const { data: recentCommitments = [], loading: loadingCommitments } = useFirestore('commitments', {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 3
  });
  const stats = useDashboardStats();
  const { data: companies = [] } = useFirestore('companies');
  const storageStatsForAlerts = useStorageStats();
  
  const getGreeting = () => {
    if (currentTime < 12) return 'Buenos días';
    if (currentTime < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Convertir compromisos recientes a actividad reciente
  const recentActivity = recentCommitments.map(commitment => {
    const createdAt = commitment.createdAt?.toDate ? commitment.createdAt.toDate() : new Date(commitment.createdAt);
    const timeAgo = Math.floor((new Date() - createdAt) / (1000 * 60)); // minutos
    
    let timeText;
    if (timeAgo < 1) timeText = 'Ahora';
    else if (timeAgo < 60) timeText = `${timeAgo} min`;
    else if (timeAgo < 1440) timeText = `${Math.floor(timeAgo / 60)} h`;
    else timeText = `${Math.floor(timeAgo / 1440)} días`;
    
    return {
      action: commitment.status === 'completed' ? 'Compromiso completado' : 'Nuevo compromiso creado',
      company: commitment.company || 'Empresa',
      time: timeAgo < 1440 ? timeText : createdAt.toLocaleDateString(),
      type: commitment.status === 'completed' ? 'complete' : 'create'
    };
  });

  // Si no hay actividad reciente, mostrar datos de ejemplo
  const displayActivity = recentActivity.length > 0 ? recentActivity : [
    { action: 'Sistema iniciado', company: 'DR Group', time: 'Ahora', type: 'system' },
    { action: 'Dashboard cargado', company: 'Sistema', time: '1 min', type: 'system' },
    { action: 'Datos sincronizados', company: 'Firebase', time: '2 min', type: 'sync' }
  ];

  // Calcular estado general de compromisos (más informativo)
  const getCommitmentStatus = () => {
    if (stats.loading) {
      return {
        overdue: '...',
        upcoming: '...',
        onTrack: '...'
      };
    }

    // Compromisos próximos a vencer (próximos 7 días)
    const upcomingCommitments = recentCommitments.filter(commitment => {
      if (!commitment.dueDate || commitment.status === 'completed') return false;
      const dueDate = commitment.dueDate.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      const now = new Date();
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    // Compromisos al día (no vencidos, no próximos)
    const onTrackCommitments = Math.max(0, stats.totalCommitments - stats.overDueCommitments - upcomingCommitments - stats.completedCommitments);

    return {
      overdue: stats.overDueCommitments,
      upcoming: upcomingCommitments,
      onTrack: onTrackCommitments
    };
  };

  const commitmentStatus = getCommitmentStatus();

  // Generar alertas y notificaciones del sistema
  const getSystemAlerts = () => {
    const alerts = [];
    
    if (!stats.loading) {
      if (stats.overDueCommitments > 0) {
        alerts.push({
          type: 'error',
          message: `${stats.overDueCommitments} compromiso${stats.overDueCommitments > 1 ? 's' : ''} vencido${stats.overDueCommitments > 1 ? 's' : ''}`,
          priority: 'high'
        });
      }
      
      if (commitmentStatus.upcoming > 0) {
        alerts.push({
          type: 'warning',
          message: `${commitmentStatus.upcoming} compromiso${commitmentStatus.upcoming > 1 ? 's' : ''} próximo${commitmentStatus.upcoming > 1 ? 's' : ''} a vencer`,
          priority: 'medium'
        });
      }
    }

    // Alerta de almacenamiento si está cerca del límite
    const usagePercentage = storageStatsForAlerts.total > 0 ? (storageStatsForAlerts.used / storageStatsForAlerts.total) * 100 : 0;
    
    if (usagePercentage > 80) {
      alerts.push({
        type: 'warning',
        message: `Almacenamiento al ${usagePercentage.toFixed(0)}%`,
        priority: 'medium'
      });
    }

    // Si todo está bien
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        message: 'Todos los sistemas operando normalmente',
        priority: 'low'
      });
    }

    return alerts.slice(0, 3); // Máximo 3 alertas
  };

  // Calcular días desde último ingreso
  const getLastLoginDays = () => {
    if (!user?.metadata?.lastSignInTime) {
      return 'hoy'; // Si no hay datos, asumimos que es hoy
    }
    
    const lastLogin = new Date(user.metadata.lastSignInTime);
    const today = new Date();
    
    // Resetear las horas para comparar solo fechas
    const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = Math.abs(todayDate - lastLoginDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    return `${diffDays} días`;
  };

  const lastLoginText = getLastLoginDays();

  return (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
      minHeight: '100vh'
    }}>
      {/* Topbar con controles */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 1000,
        p: 2
      }}>
        <DashboardHeader />
      </Box>

      {/* Header Premium con Avatar */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Avatar Premium con Animaciones */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.2,
              duration: 0.8,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
          >
            <Box sx={{ 
              position: 'relative',
              mb: 3
            }}>
              {/* Anillo animado exterior */}
              <Box sx={{
                position: 'absolute',
                top: -12,
                left: -12,
                right: -12,
                bottom: -12,
                borderRadius: '50%',
                background: `conic-gradient(
                  from 0deg,
                  ${theme.palette.primary.main},
                  ${theme.palette.secondary.main},
                  ${theme.palette.primary.main}
                )`,
                animation: 'rotate 3s linear infinite',
                opacity: 0.7,
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
              
              {/* Anillo intermedio */}
              <Box sx={{
                position: 'absolute',
                top: -6,
                left: -6,
                right: -6,
                bottom: -6,
                borderRadius: '50%',
                background: theme.palette.background.paper,
                boxShadow: designSystem.shadows.medium
              }} />
              
              {/* Avatar principal */}
              <Avatar
                src={userProfile?.photoURL || user?.photoURL || userProfile?.avatar}
                sx={{
                  width: 140,
                  height: 140,
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: designSystem.shadows.elevated,
                  background: (userProfile?.photoURL || user?.photoURL || userProfile?.avatar) ? 'transparent' : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  fontSize: '3.5rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                {!(userProfile?.photoURL || user?.photoURL || userProfile?.avatar) && (userProfile?.name?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'U')}
              </Avatar>
              
              {/* Indicador de estado online */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <Box sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#4caf50',
                  border: `3px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)' },
                    '50%': { boxShadow: '0 0 16px rgba(76, 175, 80, 0.8)' },
                    '100%': { boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)' }
                  }
                }} />
              </motion.div>
            </Box>
          </motion.div>

          {/* Mensaje de Bienvenida */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Typography 
              variant="h4" 
              fontWeight="800" 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
                fontSize: { xs: '1.5rem', md: '2.2rem' }
              }}
            >
              {getGreeting()}, {userProfile?.name || user?.displayName || 'Usuario'}
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Typography 
              variant="h6" 
              color="text.secondary" 
              fontWeight="400"
              sx={{ mb: 2 }}
            >
              Bienvenido a tu Dashboard de DR Group
            </Typography>
          </motion.div>

          {/* Información de último ingreso */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2.5,
              py: 1,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              backdropFilter: 'blur(10px)',
              boxShadow: designSystem.shadows.soft
            }}>
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatDelay: 3
                }}
              >
                <AccessTime sx={{ 
                  color: theme.palette.primary.main, 
                  fontSize: 20 
                }} />
              </motion.div>
              <Typography 
                variant="body2" 
                fontWeight="600"
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem'
                }}
              >
                Tu último ingreso fue hace{' '}
                <Box component="span" sx={{ 
                  color: theme.palette.primary.main,
                  fontWeight: 700 
                }}>
                  {lastLoginText}
                </Box>
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </motion.div>

      {/* Grid Principal - Solo widgets esenciales */}
      <Grid container spacing={3}>
        {/* Primera fila - Widgets principales */}
        <Grid item xs={12} md={6}>
          <SimpleCalendarWidget />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimpleCommitmentsStatusWidget />
        </Grid>

        {/* Segunda fila - Solo almacenamiento */}
        <Grid item xs={12} md={6} lg={4}>
          <SimpleStorageWidget />
        </Grid>

        {/* Tercera fila - Estadísticas Detalladas */}
        <Grid item xs={12}>
          <DetailedStatsSection />
        </Grid>

        {/* Cuarta fila - Acciones Rápidas */}
        <Grid item xs={12}>
          <QuickActionsSection />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WelcomeDashboardSimple;
