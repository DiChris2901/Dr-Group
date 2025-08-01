import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import AdminSetupComponent from '../components/admin/AdminSetupComponent';
import { hasPermission } from '../utils/userPermissions';
import { Navigate } from 'react-router-dom';

const AdminSetupPage = () => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        // Verificar si el usuario actual ya es admin
        const hasAdminPerms = await hasPermission(currentUser.email, 'admin_access');
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

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Verificando configuración...
      </Box>
    );
  }

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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
