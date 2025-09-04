import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SYSTEM_USERS } from '../../config/systemUsers';
import { getUserData, PERMISSIONS } from '../../utils/userPermissions';

const AdminAccessVerifier = () => {
  const { currentUser, userProfile } = useAuth();
  const [verificationResults, setVerificationResults] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerification, setLastVerification] = useState(null);

  const TARGET_EMAIL = 'daruedagu@gmail.com';

  const ADMIN_CONFIG = {
    email: TARGET_EMAIL,
    displayName: 'Daruedagu - Administrador',
    role: 'ADMIN',
    accountType: 'Administrador',
    position: 'Administrador del Sistema',
    department: 'Tecnología',
    permissions: ['ALL'],
    status: 'active',
    isActive: true,
    isSystemUser: true,
    companies: [],
    theme: {
      darkMode: false,
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e'
    },
    updatedAt: new Date()
  };

  // Verificar configuración en systemUsers.js
  const verifySystemUsers = () => {
    try {
      const user = SYSTEM_USERS[TARGET_EMAIL];
      
      if (!user) {
        return {
          status: 'error',
          message: 'Usuario no encontrado en systemUsers.js',
          details: null
        };
      }

      const hasCorrectRole = user.role === 'ADMIN';
      const hasAllPermissions = user.permissions.includes('ALL');
      const hasCorrectAccountType = user.accountType === 'Administrador';

      if (hasCorrectRole && hasAllPermissions && hasCorrectAccountType) {
        return {
          status: 'success',
          message: 'Configuración correcta en systemUsers.js',
          details: {
            role: user.role,
            permissions: user.permissions,
            accountType: user.accountType,
            position: user.position
          }
        };
      } else {
        return {
          status: 'warning',
          message: 'Configuración parcial en systemUsers.js',
          details: {
            role: user.role,
            permissions: user.permissions,
            accountType: user.accountType,
            issues: [
              !hasCorrectRole && 'Role debe ser ADMIN',
              !hasAllPermissions && 'Permissions debe incluir ALL',
              !hasCorrectAccountType && 'AccountType debe ser Administrador'
            ].filter(Boolean)
          }
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Error verificando systemUsers.js',
        details: { error: error.message }
      };
    }
  };

  // Verificar usuario en Firestore
  const verifyFirestore = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', TARGET_EMAIL));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          status: 'warning',
          message: 'Usuario no encontrado en Firestore',
          details: { action: 'Se puede crear automáticamente' }
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const hasCorrectRole = userData.role === 'ADMIN';
      const hasCorrectStatus = userData.status === 'active';
      const hasPermissions = userData.permissions && (
        userData.permissions.includes('ALL') ||
        (Array.isArray(userData.permissions) && userData.permissions.length > 5)
      );

      if (hasCorrectRole && hasCorrectStatus && hasPermissions) {
        return {
          status: 'success',
          message: 'Usuario configurado correctamente en Firestore',
          details: {
            id: userDoc.id,
            role: userData.role,
            status: userData.status,
            permissions: userData.permissions,
            accountType: userData.accountType
          }
        };
      } else {
        return {
          status: 'warning',
          message: 'Usuario con configuración incompleta en Firestore',
          details: {
            id: userDoc.id,
            role: userData.role,
            status: userData.status,
            permissions: userData.permissions,
            issues: [
              !hasCorrectRole && 'Role debe ser ADMIN',
              !hasCorrectStatus && 'Status debe ser active',
              !hasPermissions && 'Permissions insuficientes'
            ].filter(Boolean)
          }
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Error verificando Firestore',
        details: { error: error.message }
      };
    }
  };

  // Verificar permisos efectivos
  const verifyEffectivePermissions = async () => {
    try {
      const userData = await getUserData(TARGET_EMAIL);

      if (!userData) {
        return {
          status: 'error',
          message: 'No se pudieron obtener datos del usuario',
          details: null
        };
      }

      const allPermissions = Object.values(PERMISSIONS);
      const userPermissions = userData.permissions || [];
      
      const hasAllAccess = userPermissions.includes('ALL') || 
                          (Array.isArray(userPermissions) && userPermissions.length >= allPermissions.length);

      if (hasAllAccess) {
        return {
          status: 'success',
          message: 'Acceso completo confirmado',
          details: {
            email: userData.email,
            role: userData.role,
            permissions: userData.permissions,
            totalPermissions: Array.isArray(userPermissions) ? userPermissions.length : 'ALL',
            availablePermissions: allPermissions.length
          }
        };
      } else {
        return {
          status: 'warning',
          message: 'Acceso limitado detectado',
          details: {
            email: userData.email,
            role: userData.role,
            permissions: userData.permissions,
            missingPermissions: allPermissions.filter(p => !userPermissions.includes(p))
          }
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: 'Error verificando permisos efectivos',
        details: { error: error.message }
      };
    }
  };

  // Corregir acceso en Firestore
  const fixFirestoreAccess = async () => {
    try {
      // Buscar documento existente
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', TARGET_EMAIL));
      const querySnapshot = await getDocs(q);

      let userDocRef;
      let updateData = { ...ADMIN_CONFIG };

      if (!querySnapshot.empty) {
        // Usuario existe, actualizar
        const existingDoc = querySnapshot.docs[0];
        userDocRef = existingDoc.ref;
        updateData.createdAt = existingDoc.data().createdAt || new Date();
      } else {
        // Crear nuevo usuario
        const newUserId = `admin_${Date.now()}`;
        userDocRef = doc(db, 'users', newUserId);
        updateData.createdAt = new Date();
      }

      await setDoc(userDocRef, updateData, { merge: true });

      return {
        status: 'success',
        message: 'Acceso admin corregido en Firestore',
        details: { documentId: userDocRef.id }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Error corrigiendo acceso en Firestore',
        details: { error: error.message }
      };
    }
  };

  // Ejecutar verificación completa
  const runFullVerification = async () => {
    setIsVerifying(true);
    setLastVerification(new Date());

    try {
      const results = {
        systemUsers: verifySystemUsers(),
        firestore: await verifyFirestore(),
        effectivePermissions: await verifyEffectivePermissions()
      };

      setVerificationResults(results);
    } catch (error) {
      console.error('Error en verificación:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Verificación automática al cargar
  useEffect(() => {
    if (currentUser?.email === TARGET_EMAIL) {
      runFullVerification();
    }
  }, [currentUser]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <SecurityIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (currentUser?.email !== TARGET_EMAIL) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Este componente solo está disponible para el administrador principal ({TARGET_EMAIL})
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SecurityIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6">
              Verificador de Acceso de Administrador
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Usuario objetivo: <strong>{TARGET_EMAIL}</strong>
          </Typography>

          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              onClick={runFullVerification}
              disabled={isVerifying}
              startIcon={isVerifying ? <CircularProgress size={20} /> : <SecurityIcon />}
            >
              {isVerifying ? 'Verificando...' : 'Verificar Acceso'}
            </Button>

            {verificationResults.firestore?.status === 'warning' || 
             verificationResults.firestore?.status === 'error' ? (
              <Button
                variant="outlined"
                color="warning"
                onClick={fixFirestoreAccess}
                startIcon={<SettingsIcon />}
              >
                Corregir Firestore
              </Button>
            ) : null}
          </Box>

          {lastVerification && (
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Última verificación: {lastVerification.toLocaleString()}
            </Typography>
          )}

          {Object.keys(verificationResults).length > 0 && (
            <List>
              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(verificationResults.systemUsers?.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>SystemUsers.js</Typography>
                      <Chip 
                        label={verificationResults.systemUsers?.status?.toUpperCase()} 
                        size="small" 
                        color={getStatusColor(verificationResults.systemUsers?.status)}
                      />
                    </Box>
                  }
                  secondary={verificationResults.systemUsers?.message}
                />
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(verificationResults.firestore?.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>Firestore Database</Typography>
                      <Chip 
                        label={verificationResults.firestore?.status?.toUpperCase()} 
                        size="small" 
                        color={getStatusColor(verificationResults.firestore?.status)}
                      />
                    </Box>
                  }
                  secondary={verificationResults.firestore?.message}
                />
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(verificationResults.effectivePermissions?.status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>Permisos Efectivos</Typography>
                      <Chip 
                        label={verificationResults.effectivePermissions?.status?.toUpperCase()} 
                        size="small" 
                        color={getStatusColor(verificationResults.effectivePermissions?.status)}
                      />
                    </Box>
                  }
                  secondary={verificationResults.effectivePermissions?.message}
                />
              </ListItem>
            </List>
          )}

          {/* Detalles técnicos */}
          {Object.values(verificationResults).some(r => r?.details) && (
            <Box mt={3}>
              <Typography variant="subtitle2" mb={2}>Detalles Técnicos:</Typography>
              {Object.entries(verificationResults).map(([key, result]) => (
                result?.details && (
                  <Alert key={key} severity="info" sx={{ mb: 1 }}>
                    <Typography variant="caption" component="pre">
                      {JSON.stringify(result.details, null, 2)}
                    </Typography>
                  </Alert>
                )
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminAccessVerifier;
