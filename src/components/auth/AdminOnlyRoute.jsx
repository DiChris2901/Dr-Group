import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, Typography, Alert, Paper } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * Componente de protección para rutas administrativas críticas
 * Solo permite acceso a daruedagu@gmail.com
 */
const AdminOnlyRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Mostrar loading mientras se autentica
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Verificando permisos...</Typography>
      </Box>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si es el administrador autorizado
  const isAuthorizedAdmin = currentUser.email === 'daruedagu@gmail.com';

  if (!isAuthorizedAdmin) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" color="error" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Área Restringida - Solo Administrador Principal
          </Typography>
          <Alert severity="error" sx={{ textAlign: 'left' }}>
            <Typography variant="body1">
              <strong>Esta página está restringida exclusivamente para:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
              daruedagu@gmail.com
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Tu usuario: <strong>{currentUser.email}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              No tienes permisos para acceder a esta sección administrativa.
            </Typography>
          </Alert>
        </Paper>
      </Box>
    );
  }

  // Si es el administrador autorizado, mostrar el contenido
  return children;
};

export default AdminOnlyRoute;
