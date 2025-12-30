import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Chip,
  alpha,
  Avatar,
  useTheme,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  BreakfastDining as BreakIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const DashboardRRHH = ({ empleados, asistencias, loading }) => {
  const theme = useTheme();

  // 📊 CÁLCULO DE MÉTRICAS
  const metrics = useMemo(() => {
    const totalEmpleados = empleados.length;
    const activosHoy = asistencias.filter(a => a.estadoActual !== 'finalizado').length;
    const finalizados = asistencias.filter(a => a.estadoActual === 'finalizado').length;
    const enBreak = asistencias.filter(a => a.estadoActual === 'break' || a.estadoActual === 'almuerzo').length;
    const sinRegistro = totalEmpleados - asistencias.length;
    
    // Calcular horas trabajadas del día
    const horasMes = asistencias.reduce((total, a) => {
      if (a.horasTrabajadas) {
        const [horas] = a.horasTrabajadas.split(':');
        return total + parseInt(horas || 0);
      }
      return total;
    }, 0);

    // Calcular llegadas tarde (>= 8:15 AM)
    const llegadasTarde = asistencias.filter(a => {
      if (!a.entrada) return false;
      const hora = a.entrada.getHours();
      const minutos = a.entrada.getMinutes();
      return hora > 8 || (hora === 8 && minutos >= 15);
    }).length;

    const porcentajeLlegadasTarde = totalEmpleados > 0 ? ((llegadasTarde / asistencias.length) * 100).toFixed(1) : 0;
    const porcentajeAusentismo = totalEmpleados > 0 ? ((sinRegistro / totalEmpleados) * 100).toFixed(1) : 0;

    return {
      totalEmpleados,
      activosHoy,
      finalizados,
      enBreak,
      sinRegistro,
      horasMes,
      llegadasTarde,
      porcentajeLlegadasTarde,
      porcentajeAusentismo
    };
  }, [empleados, asistencias]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* MÉTRICAS PRINCIPALES */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Empleados */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.primary.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                  <GroupIcon />
                </Avatar>
                <Chip
                  label="Total"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {metrics.totalEmpleados}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Empleados
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Activos Hoy */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.success.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                  <CheckCircleIcon />
                </Avatar>
                <Chip
                  label="Hoy"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {metrics.activosHoy}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activos Hoy
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics.activosHoy / metrics.totalEmpleados) * 100}
                sx={{
                  mt: 1,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.success.main
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Horas Trabajadas Mes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.info.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                  <ScheduleIcon />
                </Avatar>
                <Chip
                  label="Mes"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="h3" fontWeight={700} color="info.main">
                {metrics.horasMes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Horas Trabajadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Llegadas Tarde */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.warning.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                  <WarningIcon />
                </Avatar>
                <Chip
                  label={`${metrics.porcentajeLlegadasTarde}%`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    fontWeight: 600
                  }}
                />
              </Box>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {metrics.llegadasTarde}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Llegadas Tarde
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* MÉTRICAS SECUNDARIAS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* En Break */}
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.info.main, 0.4)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                    <BreakIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {metrics.enBreak}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      En Break
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Finalizados */}
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.success.main, 0.4)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {metrics.finalizados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Finalizados
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sin Registro */}
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.error.main, 0.4)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {metrics.sinRegistro}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sin Registro ({metrics.porcentajeAusentismo}%)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* INFORMACIÓN */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`
        }}
      >
        <Typography variant="body2">
          Las métricas se actualizan en tiempo real desde la colección de asistencias. 
          Las llegadas tarde se calculan como entradas después de las 8:15 AM.
        </Typography>
      </Alert>
    </motion.div>
  );
};

export default DashboardRRHH;
