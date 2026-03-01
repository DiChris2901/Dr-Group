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
  useTheme,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
import PageSkeleton from '../components/common/PageSkeleton';
import useConfigNomina, { TASAS_DEFAULT } from '../hooks/useConfigNomina';

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

  // ===== CONFIG AÑO DE NÓMINA (valores legales) =====
  const YEARS_NOMINA = Array.from({ length: 5 }, (_, i) => 2024 + i);
  const [configYear, setConfigYear] = useState(new Date().getFullYear());
  const [smmlvEdit, setSmmlvEdit] = useState('');
  const [auxTransEdit, setAuxTransEdit] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const [tasasEdit, setTasasEdit] = useState({});
  const [showTasas, setShowTasas] = useState(false);

  const { config: configNomina, loading: loadingConfig, saving: savingConfig, guardarConfig } = useConfigNomina(configYear);

  // Sincronizar formulario cuando carga/cambia el año
  useEffect(() => {
    if (!loadingConfig) {
      setSmmlvEdit(configNomina.smmlv.toLocaleString('es-CO'));
      setAuxTransEdit(configNomina.auxTransporte.toLocaleString('es-CO'));
      const t = configNomina.tasas || TASAS_DEFAULT;
      setTasasEdit({
        SALUD_EMPLEADO: t.SALUD_EMPLEADO,
        PENSION_EMPLEADO: t.PENSION_EMPLEADO,
        SALUD_EMPLEADOR: t.SALUD_EMPLEADOR,
        PENSION_EMPLEADOR: t.PENSION_EMPLEADOR,
        CAJA_COMPENSACION: t.CAJA_COMPENSACION,
        CESANTIAS: t.CESANTIAS,
        INTERESES_CESANTIAS: t.INTERESES_CESANTIAS,
        PRIMA: t.PRIMA,
        VACACIONES: t.VACACIONES,
        ARL_I: t.ARL?.I ?? 0.522,
        ARL_II: t.ARL?.II ?? 1.044,
        ARL_III: t.ARL?.III ?? 2.436,
        ARL_IV: t.ARL?.IV ?? 4.350,
        ARL_V: t.ARL?.V ?? 6.960,
      });
    }
  }, [configNomina, loadingConfig]);

  const handleGuardarConfig = async () => {
    try {
      const smmlv = parseInt(String(smmlvEdit).replace(/\./g, '').replace(/,/g, '')) || 0;
      const auxTransporte = parseInt(String(auxTransEdit).replace(/\./g, '').replace(/,/g, '')) || 0;
      if (!smmlv || !auxTransporte) {
        showToast('Ingresa valores válidos para SMMLV y Aux. Transporte', 'error');
        return;
      }
      const tasas = {
        SALUD_EMPLEADO: parseFloat(tasasEdit.SALUD_EMPLEADO) || TASAS_DEFAULT.SALUD_EMPLEADO,
        PENSION_EMPLEADO: parseFloat(tasasEdit.PENSION_EMPLEADO) || TASAS_DEFAULT.PENSION_EMPLEADO,
        SALUD_EMPLEADOR: parseFloat(tasasEdit.SALUD_EMPLEADOR) || TASAS_DEFAULT.SALUD_EMPLEADOR,
        PENSION_EMPLEADOR: parseFloat(tasasEdit.PENSION_EMPLEADOR) || TASAS_DEFAULT.PENSION_EMPLEADOR,
        CAJA_COMPENSACION: parseFloat(tasasEdit.CAJA_COMPENSACION) || TASAS_DEFAULT.CAJA_COMPENSACION,
        CESANTIAS: parseFloat(tasasEdit.CESANTIAS) || TASAS_DEFAULT.CESANTIAS,
        INTERESES_CESANTIAS: parseFloat(tasasEdit.INTERESES_CESANTIAS) || TASAS_DEFAULT.INTERESES_CESANTIAS,
        PRIMA: parseFloat(tasasEdit.PRIMA) || TASAS_DEFAULT.PRIMA,
        VACACIONES: parseFloat(tasasEdit.VACACIONES) || TASAS_DEFAULT.VACACIONES,
        ARL: {
          I: parseFloat(tasasEdit.ARL_I) || TASAS_DEFAULT.ARL.I,
          II: parseFloat(tasasEdit.ARL_II) || TASAS_DEFAULT.ARL.II,
          III: parseFloat(tasasEdit.ARL_III) || TASAS_DEFAULT.ARL.III,
          IV: parseFloat(tasasEdit.ARL_IV) || TASAS_DEFAULT.ARL.IV,
          V: parseFloat(tasasEdit.ARL_V) || TASAS_DEFAULT.ARL.V,
        },
      };
      await guardarConfig({ smmlv, auxTransporte, tasas });
      showToast(`Valores legales ${configYear} guardados correctamente`, 'success');
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 4000);
    } catch (err) {
      showToast('Error al guardar: ' + err.message, 'error');
    }
  };

  const fmtCOP = (v) => v ? '$' + Math.round(v).toLocaleString('es-CO') : '$0';
  // solicitudes.gestionar → gestión dentro de RRHH; 'solicitudes' (crear) tiene su propia ruta /solicitudes
  const canViewSolicitudes = hasFullRRHH || hasPermission('solicitudes.gestionar');
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
      return;
    }

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
      setLoading(false);
    }, (error) => {
      console.error('❌ Error al cargar empleados:', error);
      showToast('Error al cargar empleados: ' + error.message, 'error');
      setLoading(false);
    });

    return () => {
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
        
        // Helper para convertir Timestamps a Date
        const convertDate = (dateValue) => {
          if (!dateValue) return null;
          return dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
        };
        
        solicitudesData.push({
          id: doc.id,
          ...data,
          fechaSolicitud: convertDate(data.fechaSolicitud) || new Date(),
          fechaInicio: convertDate(data.fechaInicio),
          fechaFin: convertDate(data.fechaFin),
          fechaAprobacion: convertDate(data.fechaAprobacion),
          fechaRechazo: convertDate(data.fechaRechazo),
          fechaNacimiento: convertDate(data.fechaNacimiento),
          fechaDeduccion: convertDate(data.fechaDeduccion),
          fechaRequerida: convertDate(data.fechaRequerida)
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

  // ✅ REDIRECCIÓN: Si solo tiene permiso 'solicitudes' (crear), redirigir a /solicitudes (SolicitudesPage)
  const hasOnlySolicitudes = hasPermission('solicitudes') && !hasPermission('solicitudes.gestionar') && !hasFullRRHH && !canViewDashboard && !canViewLiquidaciones && !canViewReportes;
  
  useEffect(() => {
    if (hasOnlySolicitudes) {
      navigate('/solicitudes', { replace: true });
      return;
    }
    
    // Si tiene acceso a módulos de gestión, auto-redirigir si solo 1 disponible
    const availableModules = [
      canViewDashboard && 'dashboard',
      canViewSolicitudes && 'solicitudes',
      canViewLiquidaciones && 'liquidaciones',
      canViewReportes && 'reportes'
    ].filter(Boolean);
    
    if (availableModules.length === 1) {
      setActiveModule(availableModules[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOnlySolicitudes, canViewDashboard, canViewSolicitudes, canViewLiquidaciones, canViewReportes]);

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
            bgcolor: alpha(theme.palette.error.main, 0.05)
          }}
        >
          <Typography variant="h6" color="error.main">
            No tienes permisos para acceder a Recursos Humanos
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (loading) return <PageSkeleton variant="default" kpiCount={4} />;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1400px', mx: 'auto' }}>
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

            {/* ===== VALORES LEGALES DE NÓMINA ===== */}
            {(hasFullRRHH || userProfile?.role === 'ADMIN' || userProfile?.permissions?.ALL === true) && (
              <Box sx={{ mt: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SavingsIcon sx={{ color: theme.palette.warning.main, fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      Valores Legales de Nómina
                    </Typography>
                    {configSaved && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        label="Guardado"
                        size="small"
                        color="success"
                        sx={{ ml: 1, fontWeight: 600, borderRadius: 1 }}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 2 }}>
                    Configura el Salario Mínimo (SMMLV) y Auxilio de Transporte vigentes por año. Estos valores se usan automáticamente al liquidar nómina.
                  </Typography>

                  <Divider sx={{ mb: 2.5 }} />

                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={3} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Año</InputLabel>
                        <Select
                          value={configYear}
                          onChange={(e) => setConfigYear(e.target.value)}
                          label="Año"
                          sx={{ borderRadius: 1 }}
                        >
                          {YEARS_NOMINA.map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="SMMLV"
                        value={smmlvEdit}
                        onChange={(e) => setSmmlvEdit(e.target.value)}
                        disabled={loadingConfig || savingConfig}
                        helperText="Salario Mínimo Mensual Vigente"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.85rem', color: 'text.secondary' }}>$</Typography> }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Auxilio de Transporte"
                        value={auxTransEdit}
                        onChange={(e) => setAuxTransEdit(e.target.value)}
                        disabled={loadingConfig || savingConfig}
                        helperText="Valor mensual aux. transporte"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.85rem', color: 'text.secondary' }}>$</Typography> }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={12} md={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={handleGuardarConfig}
                        disabled={loadingConfig || savingConfig}
                        sx={{ borderRadius: 1, py: 1, fontWeight: 600 }}
                        startIcon={savingConfig ? <CircularProgress size={14} color="inherit" /> : null}
                      >
                        {savingConfig ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Toggle: Tasas Parafiscales */}
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setShowTasas(v => !v)}
                      endIcon={showTasas ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ color: 'text.secondary', fontSize: '0.78rem', textTransform: 'none', px: 0 }}
                    >
                      {showTasas ? 'Ocultar' : 'Ver / editar'} tasas parafiscales
                    </Button>
                  </Box>

                  {showTasas && !loadingConfig && (
                    <Box sx={{ mt: 1, p: 2, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.25)}`, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.75rem' }}>
                        Porcentajes (%) aplicados al liquidar nómina. Modifica solo si hay cambios legales.
                      </Typography>
                      <Grid container spacing={1.5}>
                        {[
                          { key: 'SALUD_EMPLEADO',      label: 'Salud Empleado %' },
                          { key: 'PENSION_EMPLEADO',    label: 'Pensión Empleado %' },
                          { key: 'SALUD_EMPLEADOR',     label: 'Salud Empleador %' },
                          { key: 'PENSION_EMPLEADOR',   label: 'Pensión Empleador %' },
                          { key: 'CAJA_COMPENSACION',   label: 'Caja Compensación %' },
                          { key: 'CESANTIAS',           label: 'Cesantías %' },
                          { key: 'INTERESES_CESANTIAS', label: 'Int. Cesantías %' },
                          { key: 'PRIMA',               label: 'Prima %' },
                          { key: 'VACACIONES',          label: 'Vacaciones %' },
                          { key: 'ARL_I',   label: 'ARL Riesgo I %' },
                          { key: 'ARL_II',  label: 'ARL Riesgo II %' },
                          { key: 'ARL_III', label: 'ARL Riesgo III %' },
                          { key: 'ARL_IV',  label: 'ARL Riesgo IV %' },
                          { key: 'ARL_V',   label: 'ARL Riesgo V %' },
                        ].map(({ key, label }) => (
                          <Grid item xs={6} sm={4} md={3} key={key}>
                            <TextField
                              fullWidth
                              size="small"
                              label={label}
                              type="number"
                              inputProps={{ step: '0.001', min: '0' }}
                              value={tasasEdit[key] ?? ''}
                              onChange={(e) => setTasasEdit(prev => ({ ...prev, [key]: e.target.value }))}
                              disabled={savingConfig}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {!loadingConfig && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, backgroundColor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.15)}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        <strong>Vigente {configYear}:</strong>{' '}
                        SMMLV {fmtCOP(configNomina.smmlv)} • Aux. Transporte {fmtCOP(configNomina.auxTransporte)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
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
