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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
  
  // Validar permisos granulares
  const hasFullRRHH = hasPermission('rrhh'); // Acceso completo
  const canViewDashboard = hasFullRRHH || hasPermission('rrhh.dashboard');
  const canViewSolicitudes = hasFullRRHH || hasPermission('solicitudes') || hasPermission('solicitudes.gestionar');
  // ⚠️ Verificación EXPLÍCITA del permiso de gestión
  // SOLO solicitudes.gestionar explícito o ALL — rrhh NO otorga gestión automáticamente
  const canManageSolicitudes = userProfile?.permissions?.['solicitudes.gestionar'] === true || userProfile?.permissions?.ALL === true;
  const canViewLiquidaciones = hasFullRRHH || hasPermission('rrhh.liquidaciones');
  const canViewReportes = hasFullRRHH || hasPermission('rrhh.reportes');
  const canViewRRHH = hasFullRRHH || canViewDashboard || canViewSolicitudes || canViewLiquidaciones || canViewReportes;
  const canViewEmpleados = hasFullRRHH || hasPermission('rrhh.empleados');
  const canViewAsistencias = hasFullRRHH || hasPermission('rrhh.asistencias');

  // Calcular cuántos módulos tiene disponibles (para UX del breadcrumb)
  const availableModulesCount = [
    canViewDashboard,
    canViewSolicitudes,
    canViewLiquidaciones,
    canViewReportes
  ].filter(Boolean).length;

  // ✅ LISTENER: Obtener empleados en tiempo real desde Firestore
  useEffect(() => {
    // Si el usuario puede ver RRHH, puede ver empleados
    if (!canViewRRHH) {
      console.log('❌ RRHH: Sin permisos para cargar empleados');
      return;
    }

    console.log('🔍 RRHH: Iniciando listener de empleados...');
    // Sin orderBy para evitar problemas con campos faltantes
    const q = query(collection(db, 'empleados'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const empleadosData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        empleadosData.push({ 
          id: doc.id, 
          ...data,
          // Normalizar nombre para compatibilidad
          nombre: data.nombre || data.nombreCompleto || data.apellidos || 'Sin nombre'
        });
      });
      setEmpleados(empleadosData);
      console.log('📊 RRHH: Empleados cargados desde Firestore:', empleadosData.length);
      if (empleadosData.length > 0) {
        console.log('👥 Empleados:', empleadosData.map(e => e.nombre).join(', '));
      }
    }, (error) => {
      console.error('❌ Error al cargar empleados:', error);
      showToast('Error al cargar empleados: ' + error.message, 'error');
    });

    return () => {
      console.log('🔚 RRHH: Desconectando listener de empleados');
      unsubscribe();
    };
  }, [canViewRRHH]);

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
  // Si puede gestionar → TODAS las solicitudes | Si solo crear → solo las suyas
  useEffect(() => {
    if (!canViewSolicitudes || !userProfile?.uid) return;

    const q = canManageSolicitudes
      ? query(collection(db, 'solicitudes'), orderBy('fechaSolicitud', 'desc'))
      : query(collection(db, 'solicitudes'), where('empleadoId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        solicitudesData.push({
          id: doc.id,
          ...data,
          fechaSolicitud: data.fechaSolicitud?.toDate ? data.fechaSolicitud.toDate() : new Date(data.fechaSolicitud),
          // Solo convertir fechas si existen (certificaciones no tienen fechaInicio/fechaFin)
          fechaInicio: data.fechaInicio ? (data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio)) : null,
          fechaFin: data.fechaFin ? (data.fechaFin?.toDate ? data.fechaFin.toDate() : new Date(data.fechaFin)) : null
        });
      });
      setSolicitudes(solicitudesData);
    });

    return () => unsubscribe();
  }, [canViewSolicitudes, canManageSolicitudes, userProfile?.uid]);

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

  // ✅ REDIRECCIÓN AUTOMÁTICA: Si solo tiene 1 permiso, redirige directamente (UX optimizada)
  useEffect(() => {
    // Solo ejecutar al montarse o cuando cambien los permisos, NO cuando cambie activeModule
    const availableModules = [
      canViewDashboard && 'dashboard',
      canViewSolicitudes && 'solicitudes',
      canViewLiquidaciones && 'liquidaciones',
      canViewReportes && 'reportes'
    ].filter(Boolean);
    
    // Si solo tiene acceso a 1 módulo, redirigir automáticamente (sin HUB redundante)
    if (availableModules.length === 1) {
      console.log(`🎯 RRHH: Usuario con acceso único a "${availableModules[0]}", redirigiendo directamente (sin HUB)...`);
      setActiveModule(availableModules[0]);
    } else if (availableModules.length > 1) {
      console.log(`📊 RRHH: Usuario con acceso a ${availableModules.length} módulos: ${availableModules.join(', ')} → Mostrar HUB`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewDashboard, canViewSolicitudes, canViewLiquidaciones, canViewReportes]); // ✅ SIN activeModule para evitar loops

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
      {/* HEADER SOBRIO CON GRADIENTE DINÁMICO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
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

              {/* BADGE TOTAL EMPLEADOS - Clickeable para ir a página de empleados */}
              <Chip
                icon={<GroupIcon />}
                label={loading ? 'Cargando...' : `${empleados.length} Empleado${empleados.length !== 1 ? 's' : ''}`}
                onClick={() => navigate('/empleados')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '& .MuiChip-icon': {
                    color: 'white'
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.35)',
                    borderColor: 'rgba(255,255,255,0.6)',
                    transform: 'scale(1.05)'
                  }
                }}
              />
            </Box>
          </Box>

        </Paper>
      </motion.div>

      {/* BREADCRUMBS (Solo visible cuando hay módulo activo Y tiene 2+ módulos disponibles) */}
      <AnimatePresence>
        {activeModule && availableModulesCount > 1 && (
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
              {/* CARD 1: DASHBOARD - Solo si tiene permiso */}
              {canViewDashboard && (
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
              )}

              {/* CARD 2: SOLICITUDES - Solo si tiene permiso */}
              {canViewSolicitudes && (
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
              )}

              {/* CARD 3: LIQUIDACIONES - Solo si tiene permiso */}
              {canViewLiquidaciones && (
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
              )}

              {/* CARD 4: REPORTES - Solo si tiene permiso */}
              {canViewReportes && (
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
              )}
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
                {activeModule === 'dashboard' && canViewDashboard && (
                  <DashboardRRHH 
                    empleados={empleados} 
                    asistencias={asistencias} 
                    loading={loading} 
                  />
                )}

                {activeModule === 'solicitudes' && canViewSolicitudes && (
                  <SolicitudesRRHH 
                    solicitudes={solicitudes}
                    empleados={empleados}
                    userProfile={userProfile}
                    showToast={showToast}
                  />
                )}

                {activeModule === 'liquidaciones' && canViewLiquidaciones && (
                  <LiquidacionesRRHH 
                    liquidaciones={liquidaciones}
                    empleados={empleados}
                    userProfile={userProfile}
                    showToast={showToast}
                  />
                )}

                {activeModule === 'reportes' && canViewReportes && (
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
                
                {/* Mensaje si intenta acceder sin permisos */}
                {activeModule && (
                  (activeModule === 'dashboard' && !canViewDashboard) ||
                  (activeModule === 'solicitudes' && !canViewSolicitudes) ||
                  (activeModule === 'liquidaciones' && !canViewLiquidaciones) ||
                  (activeModule === 'reportes' && !canViewReportes)
                ) && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
                      No tienes permisos para acceder a este módulo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contacta al administrador para solicitar acceso
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
