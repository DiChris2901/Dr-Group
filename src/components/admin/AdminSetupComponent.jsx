import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const AdminSetupComponent = ({ onSetupComplete }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [adminData, setAdminData] = useState({
    email: currentUser?.email || '',
    displayName: '',
    department: 'Administración'
  });

  const steps = [
    'Configurar Administrador',
    'Confirmar Permisos',
    'Finalizar Setup'
  ];

  const handleSetupAdmin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Datos del usuario administrador
      const adminUserData = {
        email: adminData.email.toLowerCase(),
        displayName: adminData.displayName || 'Administrador Principal',
        role: 'ADMIN',
        permissions: [
          'dashboard',
          'compromisos',
          'pagos',
          'ingresos',
          'empresas',
          'reportes',
          'usuarios',
          'auditoria',
          'storage'
        ],
        companies: [],
        isActive: true,
        department: adminData.department,
        notes: 'Usuario administrador principal del sistema',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          isMainAdmin: true,
          setupDate: new Date().toISOString(),
          cannotBeDeleted: true
        }
      };

      // Verificar si ya existe
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', adminData.email.toLowerCase()));
      const existingUsers = await getDocs(q);

      if (!existingUsers.empty) {
        // Actualizar usuario existente
        const userDoc = existingUsers.docs[0];
        await setDoc(doc(db, 'users', userDoc.id), adminUserData, { merge: true });
      } else {
        // Crear nuevo usuario
        const newDocRef = doc(collection(db, 'users'));
        await setDoc(newDocRef, adminUserData);
      }

      setSuccess(true);
      setStep(2);
      
      // Notificar al componente padre que el setup está completo
      setTimeout(() => {
        onSetupComplete?.();
      }, 2000);

    } catch (err) {
      console.error('Error setting up admin:', err);
      setError('Error al configurar administrador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminIcon color="primary" />
              Configurar Usuario Administrador
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Email del administrador"
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!!currentUser?.email}
                helperText={currentUser?.email ? "Usando tu email actual de Firebase Auth" : ""}
              />
              
              <TextField
                fullWidth
                label="Nombre completo"
                value={adminData.displayName}
                onChange={(e) => setAdminData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Tu nombre completo"
              />
              
              <TextField
                fullWidth
                label="Departamento"
                value={adminData.department}
                onChange={(e) => setAdminData(prev => ({ ...prev, department: e.target.value }))}
              />
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon color="warning" />
              Permisos de Administrador
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Se configurarán <strong>TODOS los permisos</strong> para este usuario, incluyendo:
            </Alert>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {[
                'Gestión completa de usuarios',
                'Descarga de comprobantes',
                'Crear/editar compromisos', 
                'Generar reportes',
                'Exportar datos',
                'Configuración del sistema',
                'Acceso a todas las empresas',
                'Permisos administrativos'
              ].map((permission, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" fontSize="small" />
                  <Typography variant="body2">{permission}</Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
              <strong>Usuario:</strong> {adminData.email}<br/>
              <strong>Nombre:</strong> {adminData.displayName}<br/>
              <strong>Rol:</strong> Administrador Principal
            </Typography>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              ¡Configuración Completada!
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Tu usuario ha sido configurado como administrador principal del sistema.
            </Typography>
            <Alert severity="success">
              Ya puedes acceder a todas las funciones de administración, incluyendo la gestión de usuarios.
            </Alert>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Configuración Inicial de Administrador
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Configura tu usuario como administrador principal del sistema
          </Typography>
        </Box>

        {/* Stepper */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        {renderStepContent(step)}

        {/* Error */}
        {error && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* Actions */}
        {step < 2 && (
          <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Anterior
            </Button>
            
            {step === 0 ? (
              <Button
                variant="contained"
                onClick={() => setStep(1)}
                disabled={!adminData.email || !adminData.displayName}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSetupAdmin}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AdminIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #218838 0%, #1ea085 100%)',
                  }
                }}
              >
                {loading ? 'Configurando...' : 'Configurar Administrador'}
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminSetupComponent;
