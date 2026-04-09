import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  alpha,
  useTheme,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  FreeBreakfast as BreakIcon,
  ExitToApp as ExitIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const DashboardRRHH = ({ empleados, asistencias, loading }) => {
  const theme = useTheme();

  // 📊 CÁLCULO DE MÉTRICAS
  const metrics = useMemo(() => {
    const totalEmpleados = empleados.length;
    const activosHoy = asistencias.filter(a => a.estadoActual && a.estadoActual !== 'finalizado').length;
    const finalizados = asistencias.filter(a => a.estadoActual === 'finalizado').length;
    const enBreak = asistencias.filter(a => a.estadoActual === 'break' || a.estadoActual === 'almuerzo').length;
    const sinRegistro = Math.max(0, totalEmpleados - asistencias.length);

    // Calcular horas trabajadas del día
    const horasHoy = asistencias.reduce((total, a) => {
      if (a.horasTrabajadas) {
        const parts = a.horasTrabajadas.split(':');
        return total + parseInt(parts[0] || 0);
      }
      return total;
    }, 0);

    // Calcular llegadas tarde (>= 8:15 AM)
    const llegadasTarde = asistencias.filter(a => {
      if (!a.entrada) return false;
      const entrada = a.entrada instanceof Date ? a.entrada : a.entrada?.toDate?.() || new Date(a.entrada);
      const hora = entrada.getHours();
      const minutos = entrada.getMinutes();
      return hora > 8 || (hora === 8 && minutos >= 15);
    }).length;

    // Fix NaN: solo calcular porcentaje si hay asistencias registradas
    const porcentajeTardanza = asistencias.length > 0
      ? ((llegadasTarde / asistencias.length) * 100).toFixed(0)
      : '0';

    const porcentajeAusentismo = totalEmpleados > 0
      ? ((sinRegistro / totalEmpleados) * 100).toFixed(0)
      : '0';

    const porcentajeAsistencia = totalEmpleados > 0
      ? ((asistencias.length / totalEmpleados) * 100).toFixed(0)
      : '0';

    return {
      totalEmpleados,
      activosHoy,
      finalizados,
      enBreak,
      sinRegistro,
      horasHoy,
      llegadasTarde,
      porcentajeTardanza,
      porcentajeAusentismo,
      porcentajeAsistencia
    };
  }, [empleados, asistencias]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ===== CONFIGURACIÓN DE KPI CARDS =====
  const kpiCards = [
    {
      label: 'Activos Ahora',
      value: metrics.activosHoy,
      subtitle: `de ${metrics.totalEmpleados} empleados`,
      icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
      color: theme.palette.success.main,
      progress: metrics.totalEmpleados > 0 ? (metrics.activosHoy / metrics.totalEmpleados) * 100 : 0
    },
    {
      label: 'En Break',
      value: metrics.enBreak,
      subtitle: 'break o almuerzo',
      icon: <BreakIcon sx={{ fontSize: 20 }} />,
      color: theme.palette.info.main,
      progress: metrics.totalEmpleados > 0 ? (metrics.enBreak / metrics.totalEmpleados) * 100 : 0
    },
    {
      label: 'Finalizados',
      value: metrics.finalizados,
      subtitle: 'jornada completa',
      icon: <ExitIcon sx={{ fontSize: 20 }} />,
      color: theme.palette.primary.main,
      progress: metrics.totalEmpleados > 0 ? (metrics.finalizados / metrics.totalEmpleados) * 100 : 0
    },
    {
      label: 'Sin Registro',
      value: metrics.sinRegistro,
      subtitle: `${metrics.porcentajeAusentismo}% ausentismo`,
      icon: <PersonOffIcon sx={{ fontSize: 20 }} />,
      color: metrics.sinRegistro > 0 ? theme.palette.warning.main : theme.palette.text.secondary,
      progress: metrics.totalEmpleados > 0 ? (metrics.sinRegistro / metrics.totalEmpleados) * 100 : 0
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* RESUMEN GENERAL */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, mb: 2 }}>
          Estado del día
        </Typography>

        <Grid container spacing={2}>
          {kpiCards.map((kpi, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderColor: alpha(kpi.color, 0.3)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(kpi.color, 0.08),
                    color: kpi.color
                  }}>
                    {kpi.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.75rem' }}>
                    {kpi.label}
                  </Typography>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1, mb: 0.5 }}>
                  {kpi.value}
                </Typography>

                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                  {kpi.subtitle}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(kpi.progress, 100)}
                  sx={{
                    mt: 1.5,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(kpi.color, 0.08),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      bgcolor: kpi.color
                    }
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* INDICADORES COMPLEMENTARIOS */}
      <Grid container spacing={2}>
        {/* Horas Trabajadas */}
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.08),
              color: theme.palette.info.main
            }}>
              <ScheduleIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 0.25 }}>
                Horas trabajadas hoy
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                {metrics.horasHoy}h
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
              {metrics.finalizados + metrics.activosHoy} registros
            </Typography>
          </Paper>
        </Grid>

        {/* Llegadas Tarde */}
        <Grid item xs={12} sm={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              color: theme.palette.warning.main
            }}>
              <WarningIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 0.25 }}>
                Llegadas tarde
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
                {metrics.llegadasTarde}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{
              color: metrics.llegadasTarde > 0 ? theme.palette.warning.main : 'text.disabled',
              fontWeight: metrics.llegadasTarde > 0 ? 600 : 400,
              fontSize: '0.75rem'
            }}>
              {metrics.porcentajeTardanza}% del total
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* NOTA INFORMATIVA */}
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.disabled', fontSize: '0.7rem', textAlign: 'center' }}>
        Métricas en tiempo real · Llegada tarde = después de 8:15 AM
      </Typography>
    </motion.div>
  );
};

export default DashboardRRHH;
