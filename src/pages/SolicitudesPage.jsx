import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { collection, query, onSnapshot } from 'firebase/firestore';
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

  // Listener de solicitudes
  useEffect(() => {
    if (!canViewSolicitudes) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'solicitudes'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const solicitudesData = [];
      snapshot.forEach((doc) => {
        solicitudesData.push({ id: doc.id, ...doc.data() });
      });
      setSolicitudes(solicitudesData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error al cargar solicitudes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [canViewSolicitudes]);

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
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 2,
          p: 3,
          mb: 4,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Description sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Solicitudes
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Gestión de vacaciones, permisos, incapacidades y compensatorios
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Componente de solicitudes */}
      <SolicitudesRRHH 
        solicitudes={solicitudes}
        empleados={empleados}
        userProfile={userProfile}
        loading={loading}
      />
    </Container>
  );
};

export default SolicitudesPage;
