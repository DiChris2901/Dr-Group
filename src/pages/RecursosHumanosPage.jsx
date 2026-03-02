import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Stack,
  Tabs,
  Tab,
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
  Dashboard as DashboardIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import DashboardRRHH from '../components/rrhh/DashboardRRHH';
import SolicitudesRRHH from '../components/rrhh/SolicitudesRRHH';
import NominaPage from './NominaPage';
import EmpleadosPage from './EmpleadosPage';
import PageSkeleton from '../components/common/PageSkeleton';
import useConfigNomina, { TASAS_DEFAULT } from '../hooks/useConfigNomina';

const RecursosHumanosPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  
  // Estados
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  
  // Validar permisos granulares
  const hasFullRRHH = hasPermission('rrhh'); // Acceso completo
  const canViewDashboard = hasFullRRHH;

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
  // Todas las pestañas son visibles si tiene 'rrhh' (acceso completo a Talento Humano)
  const canViewSolicitudes = hasFullRRHH;
  const canManageSolicitudes = hasFullRRHH;
  const canViewEmpleados = hasFullRRHH;
  const canViewAsistencias = hasFullRRHH || hasPermission('rrhh.asistencias');
  const canViewNomina = hasFullRRHH || hasPermission('rrhh.nomina');
  const canViewConfig = hasFullRRHH || userProfile?.role === 'ADMIN' || userProfile?.permissions?.ALL === true;
  const canViewRRHH = hasFullRRHH || canViewDashboard || canViewSolicitudes || canViewNomina || canViewEmpleados;

  // ===== TABS DISPONIBLES SEGÚN PERMISOS =====
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (canViewDashboard)     tabs.push({ key: 'dashboard',     label: 'Resumen',                icon: <DashboardIcon sx={{ fontSize: 18 }} /> });
    if (canViewEmpleados)     tabs.push({ key: 'empleados',     label: 'Empleados',              icon: <GroupIcon sx={{ fontSize: 18 }} /> });
    if (canViewSolicitudes)   tabs.push({ key: 'solicitudes',   label: 'Gestionar Solicitudes',  icon: <AssignmentIcon sx={{ fontSize: 18 }} /> });
    if (canViewNomina)        tabs.push({ key: 'nomina',        label: 'Nómina',                 icon: <PaymentsIcon sx={{ fontSize: 18 }} /> });
    if (canViewConfig)        tabs.push({ key: 'config',        label: 'Configuración',          icon: <SettingsIcon sx={{ fontSize: 18 }} /> });
    return tabs;
  }, [canViewDashboard, canViewEmpleados, canViewSolicitudes, canViewNomina, canViewConfig]);

  // Clave del tab activo
  const activeTabKey = availableTabs[activeTab]?.key || availableTabs[0]?.key;

  // ===== HEADER DINÁMICO SEGÚN TAB ACTIVO =====
  const headerConfig = useMemo(() => {
    const configs = {
      dashboard:    { overline: 'RECURSOS HUMANOS • GESTIÓN DE PERSONAL',   title: 'Talento Humano',          subtitle: 'Gestión integral de empleados, asistencias y solicitudes', icon: <GroupIcon sx={{ fontSize: 32 }} /> },
      empleados:    { overline: 'RECURSOS HUMANOS • EMPLEADOS',             title: 'Empleados',               subtitle: 'Gestión y administración del personal de la organización', icon: <GroupIcon sx={{ fontSize: 32 }} /> },
      solicitudes:  { overline: 'RECURSOS HUMANOS • SOLICITUDES',           title: 'Gestionar Solicitudes',   subtitle: 'Revisión y aprobación de solicitudes del personal',        icon: <AssignmentIcon sx={{ fontSize: 32 }} /> },
      nomina:       { overline: 'RECURSOS HUMANOS • NÓMINA',                title: 'Nómina',                  subtitle: 'Liquidación y gestión de nómina del personal',             icon: <PaymentsIcon sx={{ fontSize: 32 }} /> },
      config:       { overline: 'RECURSOS HUMANOS • CONFIGURACIÓN',         title: 'Configuración',           subtitle: 'Parámetros legales y configuración del módulo',            icon: <SettingsIcon sx={{ fontSize: 32 }} /> },
    };
    return configs[activeTabKey] || configs.dashboard;
  }, [activeTabKey]);

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

  // ✅ Redirect: employees with only 'solicitudes' perm go to /solicitudes
  useEffect(() => {
    const hasOnlySolicitudes = hasPermission('solicitudes') && !hasFullRRHH && !canViewDashboard && !canViewNomina;
    if (hasOnlySolicitudes) {
      navigate('/solicitudes', { replace: true });
    }
  }, [hasPermission, hasFullRRHH, canViewDashboard, canViewNomina, navigate]);

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
                  {headerConfig.overline}
                </Typography>
                <Typography variant="h4" sx={{
                  fontWeight: 700,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 0.5
                }}>
                  {headerConfig.icon}
                  {headerConfig.title}
                </Typography>
                <Typography variant="body1" sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mt: 0.5
                }}>
                  {headerConfig.subtitle}
                </Typography>
              </Box>

              {/* BADGE EMPLEADOS */}
              <Chip
                icon={<GroupIcon />}
                label={`${empleados.length} Empleado${empleados.length !== 1 ? 's' : ''}`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.4)',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            </Box>
          </Box>

        </Paper>
      </motion.div>

      {/* TABS DE NAVEGACIÓN */}
      {availableTabs.length > 1 && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                minHeight: 48,
                transition: 'all 0.2s ease',
                '&.Mui-selected': { fontWeight: 600 }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            {availableTabs.map((tab) => (
              <Tab
                key={tab.key}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>
      )}

      {/* CONTENIDO DEL TAB ACTIVO */}
      <motion.div
        key={activeTabKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* TAB: RESUMEN (Dashboard) */}
        {activeTabKey === 'dashboard' && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3 }}>
              <DashboardRRHH
                empleados={empleados}
                asistencias={asistencias}
                loading={loading}
              />
            </Box>
          </Paper>
        )}

        {/* TAB: SOLICITUDES (admin — gestión) */}
        {activeTabKey === 'solicitudes' && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3 }}>
              <SolicitudesRRHH
                solicitudes={solicitudes}
                empleados={empleados}
                userProfile={userProfile}
                showToast={showToast}
              />
            </Box>
          </Paper>
        )}

        {/* TAB: EMPLEADOS */}
        {activeTabKey === 'empleados' && (
          <EmpleadosPage embedded />
        )}

        {/* TAB: NÓMINA */}
        {activeTabKey === 'nomina' && (
          <NominaPage embedded />
        )}

        {/* TAB: CONFIGURACIÓN */}
        {activeTabKey === 'config' && (
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

            <Divider sx={{ mb: 2 }} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <FormControl size="small" sx={{ width: { xs: '100%', sm: 105 }, flexShrink: 0 }}>
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

              <TextField
                size="small"
                label="SMMLV"
                value={smmlvEdit}
                onChange={(e) => setSmmlvEdit(e.target.value)}
                disabled={loadingConfig || savingConfig}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.85rem', color: 'text.secondary' }}>$</Typography> }}
              />

              <TextField
                size="small"
                label="Auxilio de Transporte"
                value={auxTransEdit}
                onChange={(e) => setAuxTransEdit(e.target.value)}
                disabled={loadingConfig || savingConfig}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.85rem', color: 'text.secondary' }}>$</Typography> }}
              />

              <Button
                variant="contained"
                size="small"
                onClick={handleGuardarConfig}
                disabled={loadingConfig || savingConfig}
                sx={{ borderRadius: 1, py: 1, px: 3, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}
                startIcon={savingConfig ? <CircularProgress size={14} color="inherit" /> : null}
              >
                {savingConfig ? 'Guardando...' : 'Guardar'}
              </Button>
            </Stack>

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
                    { key: 'PENSION_EMPLEADO',     label: 'Pensión Empleado %' },
                    { key: 'SALUD_EMPLEADOR',      label: 'Salud Empleador %' },
                    { key: 'PENSION_EMPLEADOR',     label: 'Pensión Empleador %' },
                    { key: 'CAJA_COMPENSACION',    label: 'Caja Compensación %' },
                    { key: 'CESANTIAS',            label: 'Cesantías %' },
                    { key: 'INTERESES_CESANTIAS',  label: 'Int. Cesantías %' },
                    { key: 'PRIMA',                label: 'Prima %' },
                    { key: 'VACACIONES',           label: 'Vacaciones %' },
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
        )}
      </motion.div>
    </Box>
  );
};

export default RecursosHumanosPage;
