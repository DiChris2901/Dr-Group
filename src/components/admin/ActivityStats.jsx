import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Person,
  Assignment,
  Schedule,
  Business,
  Assessment
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Componente para mostrar estadísticas de actividad del sistema
 * Diseño sobrio con métricas clave de auditoría
 */
const ActivityStats = ({ stats }) => {
  const theme = useTheme();

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Actividades',
      value: stats.totalActivities,
      icon: <Assessment />,
      color: theme.palette.primary.main,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      subtitle: 'Últimos 30 días'
    },
    {
      title: 'Usuarios Activos',
      value: stats.uniqueUsers,
      icon: <Person />,
      color: theme.palette.success.main,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      subtitle: 'Usuarios únicos'
    },
    {
      title: 'Acciones Principales',
      value: Object.keys(stats.actionTypes).length,
      icon: <Assignment />,
      color: theme.palette.warning.main,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      subtitle: 'Tipos de acciones'
    },
    {
      title: 'Promedio Diario',
      value: Math.round(stats.totalActivities / 30),
      icon: <Schedule />,
      color: theme.palette.info.main,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      subtitle: 'Actividades/día'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={card.title}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Card
              sx={{
                height: '100%',
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                backgroundColor: theme.palette.background.paper,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  borderColor: alpha(theme.palette.primary.main, 0.8)
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      backgroundColor: alpha(card.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                      border: `1px solid ${alpha(card.color, 0.2)}`
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Chip
                    label="30d"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: alpha(card.color, 0.3),
                      color: card.color,
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color={card.color}
                  sx={{ mb: 0.5 }}
                >
                  {card.value.toLocaleString()}
                </Typography>
                
                <Typography 
                  variant="subtitle1" 
                  fontWeight={500} 
                  color="text.primary"
                  gutterBottom
                >
                  {card.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                >
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}

      {/* Desglose de acciones más frecuentes */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card sx={{ 
            height: '100%',
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Acciones Más Frecuentes
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(stats.actionTypes)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([action, count], index) => (
                    <Box
                      key={action}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none'
                      }}
                    >
                      <Typography variant="body2" color="text.primary">
                        {action.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        label={count}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Usuarios más activos */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card sx={{ 
            height: '100%',
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Usuarios Más Activos
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(stats.mostActiveUsers)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([user, count], index) => (
                    <Box
                      key={user}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none'
                      }}
                    >
                      <Typography variant="body2" color="text.primary" noWrap>
                        {user.split(' (')[0]} {/* Solo mostrar nombre, no email */}
                      </Typography>
                      <Chip
                        label={count}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );
};

export default ActivityStats;
