import React, { useState } from 'react';
import {
  Box,
  Menu,
  Typography,
  Grid,
  LinearProgress,
  useTheme,
  alpha,
  Divider,
  Chip
} from '@mui/material';
import {
  Assessment,
  ErrorOutline,
  AccessTime,
  CheckCircle,
  Timeline,
  AttachMoney
} from '@mui/icons-material';
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
if (typeof document !== 'undefined' && !document.getElementById('commitment-shimmer-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'commitment-shimmer-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = shimmerStyles;
  document.head.appendChild(styleSheet);
}

const CountUp = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
};

const CommitmentStatusMenu = ({ anchorEl, open, onClose }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const { data: commitments = [], loading } = useFirestore('commitments');
  const theme = useTheme();
  const { settings } = useSettings();

  // Configuraciones dinámicas del Design System
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 12;
  const animationsEnabled = settings?.theme?.animations !== false;

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
      description: 'Requieren atención inmediata',
      priority: 'critical'
    },
    {
      id: 'upcoming',
      title: 'Próximos',
      count: stats.upcoming,
      icon: AccessTime,
      color: '#ff9800',
      description: 'Vencen en los próximos 7 días',
      priority: 'warning'
    },
    {
      id: 'completed',
      title: 'Completados',
      count: stats.completed,
      icon: CheckCircle,
      color: '#4caf50',
      description: 'Finalizados exitosamente',
      priority: 'success'
    },
    {
      id: 'onTrack',
      title: 'Al día',
      count: stats.onTrack,
      icon: Timeline,
      color: '#2196f3',
      description: 'En tiempo y forma',
      priority: 'info'
    }
  ];

  // Calcular el progreso general
  const overallProgress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const getProgressColor = () => {
    if (overallProgress >= 80) return primaryColor;
    if (overallProgress >= 60) return theme.palette.info.main;
    if (overallProgress >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          maxHeight: 550,
          bgcolor: theme.palette.background.paper,
          borderRadius: `${borderRadius}px`,
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: 'visible',
          mt: 1,
          '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: theme.palette.background.paper,
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
      <Box sx={{ p: 0 }}>
        {/* Header spectacular con gradiente dinámico */}
        <Box
          sx={{
            transition: animationsEnabled ? theme.transitions.create(['opacity'], {
              duration: theme.transitions.duration.short
            }) : 'none'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ 
                color: 'white', 
                mr: 1, 
                fontSize: 22 
              }} />
              <Box>
                <Typography variant="h6" fontWeight="700" color="white">
                  Estado de Compromisos
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {stats.total} total • {stats.thisMonth} este mes
                </Typography>
              </Box>
            </Box>
            
            {/* Indicador de progreso circular mejorado */}
            <Box sx={{ position: 'relative', width: 45, height: 45 }}>
              <Box sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(rgba(255,255,255,0.9) ${overallProgress * 3.6}deg, rgba(255,255,255,0.2) 0deg)`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }
              }} />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <Typography variant="caption" fontWeight="700" sx={{ 
                  color: 'white', 
                  fontSize: '0.75rem' 
                }}>
                  {overallProgress.toFixed(0)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Contenido del menú */}
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />

          {/* Tarjetas de estado en grid 2x2 */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
          {statusCards.map((card, index) => (
            <Grid item xs={6} key={card.id}>
              <Box
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                sx={{
                  transition: animationsEnabled ? theme.transitions.create(['transform'], {
                    duration: theme.transitions.duration.short
                  }) : 'none',
                  '&:hover': {
                    transform: animationsEnabled ? 'translateY(-2px)' : 'none'
                  }
                }}
              >
                <Box
                  sx={{
                    height: 120,
                    p: 2,
                    borderRadius: '8px',
                    background: hoveredCard === card.id ? 
                      alpha(card.color, 0.08) :
                      alpha(card.color, 0.04),
                    border: `1px solid ${alpha(card.color, hoveredCard === card.id ? 0.15 : 0.1)}`,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <card.icon sx={{ 
                      color: card.color, 
                      fontSize: 20
                    }} />
                    <Typography 
                      variant="h5" 
                      fontWeight="600" 
                      sx={{ 
                        color: card.color,
                        fontSize: '1.4rem'
                      }}
                    >
                      <CountUp value={card.count} />
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6, fontSize: '0.9rem' }}>
                      {card.title}
                    </Typography>
                    
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                        display: 'block',
                        overflow: 'visible',
                        whiteSpace: 'normal'
                      }}
                    >
                      {card.description}
                    </Typography>
                  </Box>

                  {/* Indicador de cantidad */}
                  {card.count > 0 && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: card.color,
                    }} />
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Resumen financiero */}
        <Box
          sx={{
            transition: animationsEnabled ? theme.transitions.create(['opacity'], {
              duration: theme.transitions.duration.short
            }) : 'none'
          }}
        >
          <Box sx={{ 
            p: 2, 
            borderRadius: '8px',
            background: alpha(getProgressColor(), 0.08),
            border: `1px solid ${alpha(getProgressColor(), 0.12)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ color: getProgressColor(), mr: 1, fontSize: 20 }} />
                <Typography variant="body2" fontWeight="600" color="text.secondary">
                  Monto Total
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="600" sx={{ color: getProgressColor() }}>
                {fCurrency(stats.totalAmount)}
              </Typography>
            </Box>
            
            {/* Barra de progreso general */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  Progreso General
                </Typography>
                <Typography variant="caption" sx={{ color: getProgressColor(), fontWeight: 600 }}>
                  {overallProgress.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={overallProgress} 
                sx={{
                  height: 6,
                  borderRadius: '3px',
                  bgcolor: alpha(getProgressColor(), 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: '3px',
                    bgcolor: getProgressColor()
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
        </Box>
      </Box>
    </Menu>
  );
};

export default CommitmentStatusMenu;
