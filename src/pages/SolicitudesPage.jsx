import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import SolicitudesRRHH from '../components/rrhh/SolicitudesRRHH';
import { Description } from '@mui/icons-material';

const SolicitudesPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const [solicitudes, setSolicitudes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Validar permisos
  const canViewSolicitudes = hasPermission('solicitudes');

  // Listener de solicitudes - Solo las del usuario actual
  useEffect(() => {
    if (!canViewSolicitudes || !userProfile?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'solicitudes'),
      where('empleadoId', '==', userProfile.uid)
    );
    
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
      setLoading(false);
    }, (error) => {
      console.error('❌ Error al cargar solicitudes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [canViewSolicitudes, userProfile?.uid]);

  // Listener de empleados
  useEffect(() => {
    if (!canViewSolicitudes) return;

    const q = query(collection(db, 'empleados'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const empleadosData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        empleadosData.push({ 
          id: doc.id, 
          ...data,
          nombre: data.nombre || data.nombreCompleto || data.apellidos || 'Sin nombre'
        });
      });
      setEmpleados(empleadosData);
    }, (error) => {
      console.error('❌ Error al cargar empleados:', error);
    });

    return () => unsubscribe();
  }, [canViewSolicitudes]);

  if (!canViewSolicitudes) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error">
            ⛔ No tienes permisos para acceder a esta página
          </Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
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
          mb: 4
        }}
      >
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2,
              display: 'block',
              mb: 0.5
            }}
          >
            RRHH • SOLICITUDES
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5
            }}
          >
            <Description sx={{ fontSize: 32 }} />
            Solicitudes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: 600
            }}
          >
            Gestión de vacaciones, permisos, incapacidades y compensatorios
          </Typography>
        </Box>
      </Paper>

      {/* Componente de solicitudes */}
      <SolicitudesRRHH 
        solicitudes={solicitudes}
        empleados={empleados}
        userProfile={userProfile}
        showToast={showToast}
        loading={loading}
      />
    </Container>
  );
};

export default SolicitudesPage;
