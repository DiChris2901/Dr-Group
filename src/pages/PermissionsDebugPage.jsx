import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert,
  Divider,
  Chip,
  Grid,
  TextField
} from '@mui/material';
import { 
  Bug as BugIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/userPermissions';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Página de debug para diagnosticar problemas de permisos
 */
const PermissionsDebugPage = () => {
  const { currentUser } = useAuth();
  const [userFirebaseData, setUserFirebaseData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  // Cargar datos del usuario actual
  const loadUserData = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      // Buscar usuario en Firebase
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', currentUser.email.toLowerCase()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        setUserFirebaseData({ id: snapshot.docs[0].id, ...userData });
        
        // Verificar todos los permisos
        const permissionChecks = {};
        for (const permission of Object.values(PERMISSIONS)) {
          permissionChecks[permission] = await hasPermission(currentUser.email, permission);
        }
        setPermissions(permissionChecks);
      } else {
        setUserFirebaseData(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear usuario administrador automáticamente
  const createAdminUser = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      const userData = {
        email: currentUser.email.toLowerCase(),
        displayName: currentUser.displayName || currentUser.email.split('@')[0],
        role: 'ADMIN',
        permissions: Object.values(PERMISSIONS),
        isActive: true,
        createdAt: new Date(),
        createdBy: 'auto-setup'
      };

      await addDoc(collection(db, 'users'), userData);
      await loadUserData();
      alert('✅ Usuario administrador creado exitosamente!');
    } catch (error) {
      console.error('Error creating admin user:', error);
      alert('❌ Error al crear usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar usuario existente a admin
  const upgradeToAdmin = async () => {
    if (!userFirebaseData?.id) return;

    setLoading(true);
    try {
      const updates = {
        role: 'ADMIN',
        permissions: Object.values(PERMISSIONS),
        isActive: true,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'users', userFirebaseData.id), updates);
      await loadUserData();
      alert('✅ Usuario actualizado a administrador!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('❌ Error al actualizar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      loadUserData();
      setTestEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  if (!currentUser) {
    return (
      <Alert severity="warning">
        No hay usuario autenticado
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugIcon color="primary" />
            🔍 Debug de Permisos
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta página te ayuda a diagnosticar y resolver problemas de permisos de usuario.
          </Alert>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Información del Usuario Firebase Auth */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Firebase Authentication
              </Typography>
              
              <Typography variant="body2">
                <strong>Email:</strong> {currentUser.email}
              </Typography>
              <Typography variant="body2">
                <strong>UID:</strong> {currentUser.uid}
              </Typography>
              <Typography variant="body2">
                <strong>Display Name:</strong> {currentUser.displayName || 'No establecido'}
              </Typography>
              <Typography variant="body2">
                <strong>Email Verificado:</strong> {currentUser.emailVerified ? '✅ Sí' : '❌ No'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Información del Usuario en Firestore */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                Usuario en Firestore
              </Typography>
              
              {userFirebaseData ? (
                <>
                  <Typography variant="body2">
                    <strong>Rol:</strong> {userFirebaseData.role}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Estado:</strong> {userFirebaseData.isActive ? '✅ Activo' : '❌ Inactivo'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Permisos:</strong> {userFirebaseData.permissions?.length || 0}
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    onClick={upgradeToAdmin} 
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    Actualizar a Admin
                  </Button>
                </>
              ) : (
                <>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    ❌ Usuario NO encontrado en Firestore
                  </Alert>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={createAdminUser}
                    disabled={loading}
                  >
                    Crear Usuario Administrador
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Permisos Detallados */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Permisos
              </Typography>
              
              <Grid container spacing={1}>
                {Object.entries(permissions).map(([permission, hasAccess]) => (
                  <Grid item xs={12} sm={6} md={4} key={permission}>
                    <Chip
                      icon={hasAccess ? <CheckIcon /> : <CancelIcon />}
                      label={permission}
                      color={hasAccess ? 'success' : 'error'}
                      variant={hasAccess ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ width: '100%', justifyContent: 'flex-start' }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 2 }} />
              
              <Button 
                variant="outlined" 
                onClick={loadUserData} 
                disabled={loading}
              >
                🔄 Recargar Datos
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PermissionsDebugPage;
