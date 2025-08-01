import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import useUserPermissions from '../../hooks/useUserPermissions';
import { PERMISSIONS } from '../../utils/userPermissions';

/**
 * Componente de debug para verificar permisos del usuario
 * Solo para desarrollo - mostrar permisos actuales
 */
const PermissionsDebug = () => {
  const { currentUser } = useAuth();
  const { permissions, isAdmin, loading } = useUserPermissions();

  if (!currentUser) {
    return (
      <Alert severity="warning">
        No hay usuario autenticado
      </Alert>
    );
  }

  if (loading) {
    return (
      <Alert severity="info">
        Verificando permisos...
      </Alert>
    );
  }

  return (
    <Card sx={{ mt: 2, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔍 Debug de Permisos
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            Email: {currentUser.email}
          </Typography>
          <Typography variant="subtitle2">
            UID: {currentUser.uid}
          </Typography>
          <Typography variant="subtitle2">
            Es Admin: {isAdmin() ? '✅ Sí' : '❌ No'}
          </Typography>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Permisos Actuales:
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.values(PERMISSIONS).map((permission) => (
            <Chip
              key={permission}
              label={permission}
              color={permissions[permission] ? 'success' : 'default'}
              variant={permissions[permission] ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>

        {Object.keys(permissions).length === 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            ❌ No se encontraron permisos para este usuario. 
            Verifica que el email esté configurado en Firebase.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionsDebug;
