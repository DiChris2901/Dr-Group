import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Box, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

/**
 * Componente de protección para rutas administrativas críticas
 * Usa sistema centralizado de permisos (requiere 'auditoria')
 * 
 * @deprecated Considera usar <ProtectedRoute requiredPermission="auditoria" /> en su lugar
 */
const AdminOnlyRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const { hasPermission } = usePermissions();

  // Mostrar loading mientras se autentica
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Verificando permisos de auditoría...
        </Typography>
      </Box>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Verificar permiso 'auditoria' usando sistema centralizado
  const hasAuditoriaPermission = hasPermission('auditoria');

  if (!hasAuditoriaPermission) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" color="error" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Área Restringida - Auditoría del Sistema
          </Typography>
          <Alert severity="error" sx={{ textAlign: 'left' }}>
            <Typography variant="body1">
              <strong>Esta página requiere el permiso:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontWeight: 600 }}>
              auditoria
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Tu usuario: <strong>{currentUser.email}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              Contacta al administrador del sistema para solicitar acceso a los logs de auditoría.
            </Typography>
          </Alert>
        </Paper>
      </Box>
    );
  }

  // Si tiene el permiso 'auditoria', mostrar el contenido
  return children;
};

export default AdminOnlyRoute;
