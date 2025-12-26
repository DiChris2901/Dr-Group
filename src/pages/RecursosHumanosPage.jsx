import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Tab,
  Tabs,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  alpha,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  BreakfastDining as BreakIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// Importar componentes de páginas existentes (los renderizaremos en pestañas)
import EmpleadosPage from './EmpleadosPage';
import AsistenciasPage from './AsistenciasPage';

const RecursosHumanosPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Estados
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  
  // Validar permisos
  const canViewRRHH = hasPermission('empleados') || hasPermission('asistencias');
  const canViewEmpleados = hasPermission('empleados');
  const canViewAsistencias = hasPermission('asistencias');

  // ✅ LISTENER: Obtener empleados en tiempo real
  useEffect(() => {
    if (!canViewEmpleados) return;

    const q = query(collection(db, 'empleados'), orderBy('nombre', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const empleadosData = [];
      snapshot.forEach((doc) => {
        empleadosData.push({ id: doc.id, ...doc.data() });
      });
      setEmpleados(empleadosData);
    });

    return () => unsubscribe();
  }, [canViewEmpleados]);

  // ✅ LISTENER: Obtener asistencias del día actual
  useEffect(() => {
    if (!canViewAsistencias) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'asistencias'),
      where('fecha', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const asistenciasData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        asistenciasData.push({
          id: doc.id,
          uid: data.uid,
          empleadoNombre: data.empleadoNombre,
          entrada: data.entrada?.hora ? (data.entrada.hora.toDate ? data.entrada.hora.toDate() : new Date(data.entrada.hora)) : null,
          estadoActual: data.estadoActual,
          horasTrabajadas: data.horasTrabajadas
        });
      });
      setAsistencias(asistenciasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [canViewAsistencias]);

  // 📊 CÁLCULO DE MÉTRICAS
  const metrics = useMemo(() => {
    const totalEmpleados = empleados.length;
    const activosHoy = asistencias.filter(a => a.estadoActual !== 'finalizado').length;
    const finalizados = asistencias.filter(a => a.estadoActual === 'finalizado').length;
    const enBreak = asistencias.filter(a => a.estadoActual === 'break' || a.estadoActual === 'almuerzo').length;
    const sinRegistro = totalEmpleados - asistencias.length;
    
    // Calcular horas trabajadas del mes (ejemplo simplificado)
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

  // ✅ VALIDACIÓN DE PERMISOS
  if (!canViewRRHH) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a Recursos Humanos.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER CON GRADIENTE SOBRIO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 4,
            mb: 3,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <GroupIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h4" fontWeight={700}>
                Recursos Humanos
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 600 }}>
              Gestión integral de empleados, asistencias, solicitudes y liquidaciones
            </Typography>
          </Box>
          
          {/* Decoración de fondo */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }}
          />
        </Paper>
      </motion.div>

      {/* DASHBOARD DE MÉTRICAS */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* MÉTRICAS PRINCIPALES */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Total Empleados */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transform: 'translateY(-4px)'
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
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transform: 'translateY(-4px)'
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
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transform: 'translateY(-4px)'
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
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        transform: 'translateY(-4px)'
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
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                          <BreakIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={700}>
                            {metrics.enBreak}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            En Break/Almuerzo
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Finalizados */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                          <CheckCircleIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={700}>
                            {metrics.finalizados}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Jornada Finalizada
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Sin Registro */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                  </Card>
                </Grid>
              </Grid>

              {/* INFORMACIÓN */}
              <Alert
                severity="info"
                icon={<InfoIcon />}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="body2">
                  Las métricas se actualizan en tiempo real desde la colección de asistencias. 
                  Las llegadas tarde se calculan como entradas después de las 8:15 AM.
                </Typography>
              </Alert>
            </>
          )}
        </motion.div>
      )}

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 64,
              transition: 'all 0.3s ease'
            }
          }}
        >
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Dashboard" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Empleados" disabled={!canViewEmpleados} />
          <Tab icon={<AccessTimeIcon />} iconPosition="start" label="Asistencias" disabled={!canViewAsistencias} />
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Solicitudes" disabled />
          <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Liquidaciones" disabled />
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Reportes" disabled />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <AnimatePresence mode="wait">
            {activeTab === 1 && canViewEmpleados && (
              <motion.div
                key="empleados"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <EmpleadosPage />
              </motion.div>
            )}
            
            {activeTab === 2 && canViewAsistencias && (
              <motion.div
                key="asistencias"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AsistenciasPage />
              </motion.div>
            )}

            {activeTab === 3 && (
              <motion.div
                key="solicitudes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="info">
                  Módulo de Solicitudes (vacaciones, permisos, incapacidades) en desarrollo.
                </Alert>
              </motion.div>
            )}

            {activeTab === 4 && (
              <motion.div
                key="liquidaciones"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="info">
                  Módulo de Liquidaciones Individuales en desarrollo.
                </Alert>
              </motion.div>
            )}

            {activeTab === 5 && (
              <motion.div
                key="reportes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="info">
                  Módulo de Reportes Ejecutivos en desarrollo.
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Paper>
    </Box>
  );
};

export default RecursosHumanosPage;
