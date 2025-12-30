import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  useTheme
} from '@mui/material';
import {
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import DashboardRRHH from '../components/rrhh/DashboardRRHH';
import SolicitudesRRHH from '../components/rrhh/SolicitudesRRHH';
import LiquidacionesRRHH from '../components/rrhh/LiquidacionesRRHH';

const RecursosHumanosPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  
  // Estados
  const [activeTab, setActiveTab] = useState(0);
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
      {/* HEADER CON GRADIENTE SOBRIO SIMPLIFICADO */}
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
            mb: 3
          }}
        >
          <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
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
          
          {/* SIN decoración de fondo según diseño sobrio */}
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

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
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
            borderBottom: `1px solid ${theme.palette.divider}`,
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
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Solicitudes" />
          <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Liquidaciones" />
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Reportes" disabled />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: DASHBOARD */}
          {activeTab === 0 && (
            <DashboardRRHH 
              empleados={empleados} 
              asistencias={asistencias} 
              loading={loading} 
            />
          )}

          {/* TAB 1: SOLICITUDES */}
          {activeTab === 1 && (
            <SolicitudesRRHH 
              solicitudes={solicitudes}
              empleados={empleados}
              userProfile={userProfile}
              showToast={showToast}
            />
          )}

          {/* TAB 2: LIQUIDACIONES */}
          {activeTab === 2 && (
            <LiquidacionesRRHH 
              liquidaciones={liquidaciones}
              empleados={empleados}
              userProfile={userProfile}
              showToast={showToast}
            />
          )}

          {/* TAB 3: REPORTES */}
          {activeTab === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.info.main}`,
                  bgcolor: `rgba(${theme.palette.info.main}, 0.05)`
                }}
              >
                <Typography variant="body1">
                  Módulo de Reportes Ejecutivos en desarrollo.
                </Typography>
              </Paper>
            </motion.div>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RecursosHumanosPage;
