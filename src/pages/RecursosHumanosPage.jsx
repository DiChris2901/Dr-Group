import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Breadcrumbs,
  IconButton,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import ModuleCard from '../components/rrhh/ModuleCard';
import DashboardRRHH from '../components/rrhh/DashboardRRHH';
import SolicitudesRRHH from '../components/rrhh/SolicitudesRRHH';
import LiquidacionesRRHH from '../components/rrhh/LiquidacionesRRHH';

const RecursosHumanosPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  
  // Estados
  const [activeModule, setActiveModule] = useState(null); // null = hub, 'dashboard' | 'solicitudes' | 'liquidaciones' | 'reportes'
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
  
  // Validar permisos
  const canViewRRHH = hasPermission('rrhh') || hasPermission('rrhh.gestion');
  const canViewEmpleados = hasPermission('rrhh.empleados');
  const canViewAsistencias = hasPermission('rrhh.asistencias');

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

  // ✅ LISTENER: Obtener solicitudes en tiempo real
  useEffect(() => {
    if (!canViewRRHH) return;

    const q = query(collection(db, 'solicitudes'), orderBy('fechaSolicitud', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        solicitudesData.push({
          id: doc.id,
          ...data,
          fechaSolicitud: data.fechaSolicitud?.toDate ? data.fechaSolicitud.toDate() : new Date(data.fechaSolicitud),
          fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
          fechaFin: data.fechaFin?.toDate ? data.fechaFin.toDate() : new Date(data.fechaFin)
        });
      });
      setSolicitudes(solicitudesData);
    });

    return () => unsubscribe();
  }, [canViewRRHH]);

  // ✅ LISTENER: Obtener liquidaciones en tiempo real
  useEffect(() => {
    if (!canViewRRHH) return;

    const q = query(collection(db, 'liquidaciones'), orderBy('fechaCreacion', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liquidacionesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        liquidacionesData.push({
          id: doc.id,
          ...data,
          fechaCreacion: data.fechaCreacion?.toDate ? data.fechaCreacion.toDate() : new Date(data.fechaCreacion)
        });
      });
      setLiquidaciones(liquidacionesData);
    });

    return () => unsubscribe();
  }, [canViewRRHH]);

  // ✅ CALCULAR STATS PARA MODULE CARDS
  const moduleStats = useMemo(() => {
    // Dashboard stats
    const activosHoy = asistencias.filter(a => 
      a.estadoActual === 'trabajando' || a.estadoActual === 'break' || a.estadoActual === 'almuerzo'
    ).length;
    
    const horasTotales = asistencias.reduce((total, a) => {
      if (!a.horasTrabajadas) return total;
      const [horas] = a.horasTrabajadas.split(':');
      return total + parseInt(horas || 0);
    }, 0);

    // Solicitudes stats
    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    const solicitudesAprobadas = solicitudes.filter(s => 
      s.estado === 'aprobada' && 
      s.fechaAprobacion && 
      format(s.fechaAprobacion, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length;

    // Liquidaciones stats
    const mesActual = format(new Date(), 'yyyy-MM');
    const liquidacionesMes = liquidaciones.filter(l => l.mes === mesActual);
    const totalDevengado = liquidacionesMes.reduce((total, l) => total + (l.totalDevengado || 0), 0);
    const totalPagadas = liquidacionesMes.filter(l => l.estado === 'pagada').length;

    return {
      dashboard: [
        { value: activosHoy, label: 'Activos Hoy' },
        { value: `${horasTotales}h`, label: 'Total Trabajadas' }
      ],
      solicitudes: [
        { value: solicitudesPendientes, label: 'Pendientes' },
        { value: solicitudesAprobadas, label: 'Aprobadas Hoy' }
      ],
      liquidaciones: [
        { value: `$${(totalDevengado / 1000000).toFixed(1)}M`, label: `Devengado ${mesActual}` },
        { value: `${totalPagadas}/${liquidacionesMes.length}`, label: 'Pagadas' }
      ],
      reportes: []
    };
  }, [asistencias, solicitudes, liquidaciones]);

  // ✅ VALIDACIÓN DE PERMISOS
  if (!canViewRRHH) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 1,
            border: `1px solid ${theme.palette.error.main}`,
            bgcolor: `rgba(${theme.palette.error.main}, 0.05)`
          }}
        >
          <Typography variant="h6" color="error.main">
            No tienes permisos para acceder a Recursos Humanos
          </Typography>
        </Paper>
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
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            mb: 3,
            position: 'relative'
          }}
        >
          <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="overline" sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  letterSpacing: 1.2
                }}>
                  RECURSOS HUMANOS • GESTIÓN DE PERSONAL
                </Typography>
                <Typography variant="h4" sx={{
                  fontWeight: 700,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 0.5
                }}>
                  <GroupIcon sx={{ fontSize: 32 }} />
                  RRHH
                </Typography>
                <Typography variant="body1" sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mt: 0.5
                }}>
                  Gestión integral de empleados, asistencias, solicitudes y liquidaciones
                </Typography>
              </Box>

              {/* BADGE TOTAL EMPLEADOS */}
              <Chip
                icon={<GroupIcon />}
                label={`${empleados.length} Empleados`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              />
            </Box>
          </Box>
          
          {/* Decoración sutil */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              zIndex: 0
            }}
          />
        </Paper>
      </motion.div>

      {/* BREADCRUMBS (Solo visible cuando hay módulo activo) */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => setActiveModule(null)}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    borderColor: alpha(theme.palette.primary.main, 0.4)
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Breadcrumbs 
                separator={<NavigateNextIcon fontSize="small" />}
                sx={{
                  '& .MuiBreadcrumbs-separator': {
                    color: theme.palette.text.secondary
                  }
                }}
              >
                <Typography 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    cursor: 'pointer',
                    '&:hover': { color: theme.palette.primary.main }
                  }}
                  onClick={() => setActiveModule(null)}
                >
                  Recursos Humanos
                </Typography>
                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  {activeModule === 'dashboard' && 'Dashboard'}
                  {activeModule === 'solicitudes' && 'Solicitudes'}
                  {activeModule === 'liquidaciones' && 'Liquidaciones'}
                  {activeModule === 'reportes' && 'Reportes'}
                </Typography>
              </Breadcrumbs>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENIDO PRINCIPAL */}
      <AnimatePresence mode="wait">
        {!activeModule ? (
          /* MODULE HUB - Vista Principal */
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              {/* CARD 1: DASHBOARD */}
              <Grid item xs={12} md={6}>
                <ModuleCard
                  title="Dashboard"
                  description="Panel de Control"
                  icon={DashboardIcon}
                  stats={moduleStats.dashboard}
                  onClick={() => setActiveModule('dashboard')}
                  color="primary"
                />
              </Grid>

              {/* CARD 2: SOLICITUDES */}
              <Grid item xs={12} md={6}>
                <ModuleCard
                  title="Solicitudes"
                  description="Vacaciones & Permisos"
                  icon={AssignmentIcon}
                  stats={moduleStats.solicitudes}
                  onClick={() => setActiveModule('solicitudes')}
                  color="secondary"
                />
              </Grid>

              {/* CARD 3: LIQUIDACIONES */}
              <Grid item xs={12} md={6}>
                <ModuleCard
                  title="Liquidaciones"
                  description="Nómina & Pagos"
                  icon={AccountBalanceIcon}
                  stats={moduleStats.liquidaciones}
                  onClick={() => setActiveModule('liquidaciones')}
                  color="success"
                />
              </Grid>

              {/* CARD 4: REPORTES (Disabled) */}
              <Grid item xs={12} md={6}>
                <ModuleCard
                  title="Reportes"
                  description="Análisis & Gráficos"
                  icon={AssessmentIcon}
                  stats={moduleStats.reportes}
                  onClick={() => setActiveModule('reportes')}
                  color="info"
                  disabled
                />
              </Grid>
            </Grid>
          </motion.div>
        ) : (
          /* MÓDULO ACTIVO - Vista Detallada */
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 3 }}>
                {activeModule === 'dashboard' && (
                  <DashboardRRHH 
                    empleados={empleados} 
                    asistencias={asistencias} 
                    loading={loading} 
                  />
                )}

                {activeModule === 'solicitudes' && (
                  <SolicitudesRRHH 
                    solicitudes={solicitudes}
                    empleados={empleados}
                    userProfile={userProfile}
                    showToast={showToast}
                  />
                )}

                {activeModule === 'liquidaciones' && (
                  <LiquidacionesRRHH 
                    liquidaciones={liquidaciones}
                    empleados={empleados}
                    userProfile={userProfile}
                    showToast={showToast}
                  />
                )}

                {activeModule === 'reportes' && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <AssessmentIcon sx={{ fontSize: 80, color: theme.palette.info.main, mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Módulo de Reportes
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Próximamente: Análisis avanzado, gráficos y exportación de reportes ejecutivos
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default RecursosHumanosPage;
