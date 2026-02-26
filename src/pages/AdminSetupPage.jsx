import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import AdminSetupComponent from '../components/admin/AdminSetupComponent';
import PageSkeleton from '../components/common/PageSkeleton';
import { Navigate } from 'react-router-dom';

const AdminSetupPage = () => {
  const { currentUser, firestoreProfile } = useAuth();
  const theme = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [loading, setLoading] = useState(true);

  // Crear gradiente dinámico basado en el tema
  const isDarkMode = theme.palette.mode === 'dark';
  const backgroundGradient = isDarkMode
    ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        // Verificar si el usuario actual ya es admin (NUEVO SISTEMA)
        const hasAdminPerms = firestoreProfile?.permissions?.includes('usuarios') || false;
        setIsAdmin(hasAdminPerms);

        // Verificar si ya existe algún admin en el sistema
        const usersRef = collection(db, 'users');
        const adminQuery = query(usersRef, where('role', '==', 'ADMIN'));
        const adminUsers = await getDocs(adminQuery);

        setNeedsSetup(adminUsers.empty);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  const handleSetupComplete = () => {
    setIsAdmin(true);
    setNeedsSetup(false);
  };

  if (loading) return <PageSkeleton variant="form" kpiCount={0} />;

  // Si ya es admin, redirigir al dashboard
  if (isAdmin && !needsSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no necesita setup (ya hay admins), redirigir al login
  if (!needsSetup && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: backgroundGradient,
      display: 'flex',
      alignItems: 'center',
      py: 4
    }}>
      <Container maxWidth="md">
        <AdminSetupComponent onSetupComplete={handleSetupComplete} />
      </Container>
    </Box>
  );
};

export default AdminSetupPage;
