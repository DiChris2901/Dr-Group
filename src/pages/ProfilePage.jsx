import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  styled,
  IconButton,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Snackbar,
  Slide,
  InputAdornment,
  FormControlLabel,
  Switch,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Badge
} from '@mui/material';

// Styled components para animaciones CSS
const StyledContainer = styled(Box)(({ theme }) => ({
  '@keyframes shimmer': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' }
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(180deg)' }
  }
}));

import {
  PhotoCamera,
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  Business,
  Work,
  Verified,
  LocationOn,
  Settings,
  VpnKey,
  Shield,
  Delete,
  Computer,
  Smartphone,
  Tablet,
  ExitToApp,
  Visibility,
  VisibilityOff,
  AccountCircle,
  RestoreFromTrash,
  Warning,
  CheckCircle,
  AccessTime,
  Devices,
  NotificationImportant,
  AdminPanelSettings,
  Key,
  Lock,
  LockOpen,
  PersonRemove
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '@mui/material/styles';
import { storage, db, auth as firebaseAuth } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';

const ProfilePage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const { settings, updateSettings } = useSettings();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Aplicar configuraciones del tema desde settings
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;
  const notificationsEnabled = settings?.notifications?.enabled !== false;
  const soundEnabled = settings?.notifications?.sound !== false;
  
  // Estados principales
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false);
  const fileInputRef = useRef(null);

  // Estados de seguridad
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || '',
    position: userProfile?.position || '',
    department: userProfile?.department || '',
    company: userProfile?.company || '',
    location: userProfile?.location || '',
    bio: userProfile?.bio || '',
    role: userProfile?.role || 'user'
  });

  // Auto-save function estabilizada con useCallback
  const performAutoSave = useCallback(async () => {
    if (!editing || !hasUnsavedChanges || Object.keys(errors).length > 0) return;
    
    setAutoSaving(true);
    try {
      await updateUserProfile(formData);
      setHasUnsavedChanges(false);
      
      // Solo mostrar notificación auto-save si las notificaciones están habilitadas
      if (notificationsEnabled) {
        setShowAutoSaveNotice(true);
        setTimeout(() => setShowAutoSaveNotice(false), 2000);
      }
    } catch (error) {
      console.error('Error en auto-save:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [formData, editing, hasUnsavedChanges, errors, updateUserProfile, notificationsEnabled]);

  const handleChangePassword = async () => {
    setLoadingPassword(true);
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      
      if (passwordData.newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // Cambiar la contraseña
      await updatePassword(user, passwordData.newPassword);
      
      // Registrar el cambio en el historial
      await addDoc(collection(db, 'loginHistory'), {
        userId: user.uid,
        action: 'password_change',
        timestamp: new Date(),
        ipAddress: 'Unknown',
        userAgent: navigator.userAgent
      });

      showAlert('Contraseña actualizada exitosamente', 'success');
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert(error.message || 'Error al cambiar la contraseña', 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      
      // Si hay una foto actual, intentar eliminarla del storage
      if (userProfile?.photoURL && userProfile.photoURL.includes('firebase')) {
        try {
          const photoRef = ref(storage, userProfile.photoURL);
          await deleteObject(photoRef);
        } catch (error) {
          console.log('Error eliminando foto anterior:', error);
        }
      }
      
      await updateUserProfile({ photoURL: null });
      showAlert('Foto de perfil eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error removing photo:', error);
      showAlert('Error al eliminar la foto', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Auto-save después de 3 segundos de inactividad
  useEffect(() => {
    if (!editing || !hasUnsavedChanges || Object.keys(errors).length > 0) return;
    
    const timer = setTimeout(performAutoSave, 3000);
    return () => clearTimeout(timer);
  }, [performAutoSave]);

  // Actualizar formData cuando cambie userProfile
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || user?.email || '',
        phone: userProfile.phone || '',
        position: userProfile.position || '',
        department: userProfile.department || '',
        company: userProfile.company || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        role: userProfile.role || 'user'
      });
    }
  }, [userProfile, user]);

  const showAlert = (message, severity = 'success') => {
    // Solo mostrar notificaciones si están habilitadas en settings
    if (!notificationsEnabled) return;
    
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: 'success' }), 5000);
    
    // Reproducir sonido si está habilitado
    if (soundEnabled && severity === 'success') {
      // Crear un sonido suave para confirmaciones
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log('Audio context not available');
      }
    }
  };

  // Función para obtener el rol del usuario desde Firebase
  const getUserRole = () => {
    const role = userProfile?.role || formData.role || 'user';
    return role === 'admin' || role === 'ADMIN' ? 'Administrador' : 'Usuario';
  };

  // Función para obtener el icono del dispositivo
  const getDeviceIcon = (userAgent) => {
    if (userAgent?.includes('Mobile')) return <Smartphone />;
    if (userAgent?.includes('Tablet')) return <Tablet />;
    return <Computer />;
  };

  // Validación en tiempo real
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
      case 'phone':
        if (value && !/^\d{7,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          newErrors.phone = 'Formato de teléfono inválido';
        } else {
          delete newErrors.phone;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para aplicar configuraciones específicas de Profile
  const applyProfileSpecificConfigurations = useCallback(async () => {
    try {
      // Aplicar configuraciones de privacidad del perfil
      const profileConfigRef = doc(db, 'userProfileSettings', user.uid);
      
      const profileConfig = {
        profileVisibility: 'private', // Configuración de privacidad por defecto
        showEmail: false,
        showPhone: false,
        showPosition: true,
        showCompany: true,
        profileTheme: {
          primaryColor,
          secondaryColor,
          borderRadius,
          animationsEnabled
        },
        lastUpdated: new Date()
      };

      await updateDoc(profileConfigRef, profileConfig).catch(async () => {
        // Si el documento no existe, crearlo
        await setDoc(profileConfigRef, profileConfig);
      });

      console.log('✅ Configuraciones específicas de Profile aplicadas correctamente');
      
    } catch (error) {
      console.error('Error aplicando configuraciones de Profile:', error);
    }
  }, [user?.uid, primaryColor, secondaryColor, borderRadius, animationsEnabled]);

  // Aplicar configuraciones cuando cambie el usuario o las configuraciones
  useEffect(() => {
    if (user?.uid) {
      applyProfileSpecificConfigurations();
    }
  }, [user?.uid, applyProfileSpecificConfigurations]);

  // Función para generar informe de configuraciones aplicadas
  const generateConfigurationReport = useCallback(() => {
    const appliedConfigurations = [
      {
        category: 'Tema Global',
        settings: [
          { name: 'Modo de tema', value: theme.palette.mode, applied: true },
          { name: 'Color primario', value: primaryColor, applied: true },
          { name: 'Color secundario', value: secondaryColor, applied: true },
          { name: 'Radio de bordes', value: `${borderRadius}px`, applied: true },
          { name: 'Animaciones', value: animationsEnabled ? 'Habilitadas' : 'Deshabilitadas', applied: true }
        ]
      },
      {
        category: 'Layout',
        settings: [
          { name: 'Modo compacto sidebar', value: settings?.sidebar?.compactMode ? 'Habilitado' : 'Deshabilitado', applied: true }
        ]
      },
      {
        category: 'Notificaciones',
        settings: [
          { name: 'Notificaciones habilitadas', value: notificationsEnabled ? 'Sí' : 'No', applied: true },
          { name: 'Sonido habilitado', value: soundEnabled ? 'Sí' : 'No', applied: true }
        ]
      },
      {
        category: 'Profile Específicas',
        settings: [
          { name: 'Configuración de usuario', value: 'Datos personales aplicados', applied: true },
          { name: 'Configuración de seguridad', value: 'Configuraciones de seguridad aplicadas', applied: true },
          { name: 'Configuración de privacidad', value: 'Preferencias de privacidad aplicadas', applied: true }
        ]
      }
    ];

    const omittedConfigurations = [
      {
        category: 'Dashboard',
        reason: 'No aplicables a página Profile',
        settings: ['Layout de columnas', 'Widgets', 'Gráficos', 'Auto-refresh']
      },
      {
        category: 'Módulos Específicos',
        reason: 'No relevantes para Profile',
        settings: ['Compromisos', 'Reportes', 'Empresas', 'Almacenamiento']
      }
    ];

    return { appliedConfigurations, omittedConfigurations };
  }, [theme.palette.mode, primaryColor, secondaryColor, borderRadius, animationsEnabled, settings?.sidebar?.compactMode, notificationsEnabled, soundEnabled]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validar en tiempo real solo si estamos editando
    if (editing) {
      validateField(field, value);
      setHasUnsavedChanges(true);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Por favor selecciona una imagen válida', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert('La imagen debe ser menor a 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Eliminar foto anterior si existe
      if (userProfile?.photoURL && userProfile.photoURL.includes('firebase')) {
        try {
          const oldPhotoRef = ref(storage, userProfile.photoURL);
          await deleteObject(oldPhotoRef);
        } catch (error) {
          console.log('Error eliminando foto anterior:', error);
        }
      }

      const imageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const photoURL = await getDownloadURL(imageRef);
      await updateUserProfile({ photoURL });
      showAlert('Foto de perfil actualizada exitosamente');
    } catch (error) {
      console.error('Error al subir la foto:', error);
      showAlert('Error al subir la foto', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    // Validar todos los campos antes de guardar
    const isValid = Object.keys(formData).every(field => 
      validateField(field, formData[field])
    );
    
    if (!isValid) {
      showAlert('Por favor corrige los errores antes de guardar', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await updateUserProfile(formData);
      setEditing(false);
      setHasUnsavedChanges(false);
      setErrors({});
      showAlert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      showAlert('Error al guardar los cambios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('¿Estás seguro de que quieres descartar los cambios?')) {
        return;
      }
    }
    
    setFormData({
      name: userProfile?.name || '',
      email: userProfile?.email || user?.email || '',
      phone: userProfile?.phone || '',
      position: userProfile?.position || '',
      department: userProfile?.department || '',
      company: userProfile?.company || '',
      location: userProfile?.location || '',
      bio: userProfile?.bio || '',
      role: userProfile?.role || 'user'
    });
    setEditing(false);
    setHasUnsavedChanges(false);
    setErrors({});
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Auto-save notification */}
      <Snackbar
        open={showAutoSaveNotice && notificationsEnabled}
        autoHideDuration={2000}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ 
          borderRadius: borderRadius / 4,
          boxShadow: `0 4px 12px ${alpha(primaryColor, 0.25)}`
        }}>
          ✨ Cambios guardados automáticamente
        </Alert>
      </Snackbar>

      {/* Alert mejorado */}
      {alert.open && notificationsEnabled && (
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: -50 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          exit={animationsEnabled ? { opacity: 0, y: -50 } : { opacity: 0 }}
        >
          <Alert 
            severity={alert.severity} 
            sx={{ 
              mb: 3,
              borderRadius: borderRadius / 4,
              boxShadow: alert.severity === 'error' 
                ? `0 4px 12px ${alpha('#f44336', 0.25)}`
                : `0 4px 12px ${alpha(primaryColor, 0.25)}`,
              border: alert.severity === 'error' 
                ? `1px solid ${alpha('#f44336', 0.3)}` 
                : `1px solid ${alpha(primaryColor, 0.3)}`
            }}
          >
            {alert.message}
          </Alert>
        </motion.div>
      )}

      {/* Header estilo menú topbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card 
          sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            border: `1px solid ${alpha(primaryColor, 0.3)}`,
            borderRadius: borderRadius / 4, // Usar configuración de borderRadius
            p: 3,
            position: 'relative',
            overflow: 'hidden',
            transition: animationsEnabled ? theme.transitions.create(['transform', 'box-shadow'], {
              duration: theme.transitions.duration.short,
            }) : 'none',
            '&:hover': animationsEnabled ? {
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${alpha(primaryColor, 0.25)}`
            } : {},
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha('#fff', 0.1)}, transparent)`,
              pointerEvents: 'none'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                '50%': { transform: 'translateY(-20px) rotate(180deg)' }
              },
              animation: 'float 6s ease-in-out infinite',
              zIndex: 1
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="h4" sx={{ 
                        color: '#fff', 
                        fontWeight: 800,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)' 
                      }}>
                        {formData.name || 'Sin nombre'}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ 
                      color: alpha('#fff', 0.8), 
                      fontWeight: 500,
                      opacity: 0.9 
                    }}>
                      {formData.position || 'Sin cargo'} • {formData.company || 'Sin empresa'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Verified sx={{ color: alpha('#fff', 0.7), fontSize: 16 }} />
                      <Typography variant="caption" sx={{ 
                        color: alpha('#fff', 0.7),
                        fontWeight: 600,
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {getUserRole()}
                      </Typography>
                      {/* Último acceso */}
                      <Typography variant="caption" sx={{ 
                        color: alpha('#fff', 0.6),
                        ml: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <AccessTime sx={{ fontSize: 12 }} />
                        Último acceso: {user?.metadata?.lastSignInTime ? 
                          new Date(user.metadata.lastSignInTime).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Hoy'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  {!editing ? (
                    <motion.div 
                      whileHover={animationsEnabled ? { scale: 1.02, y: -2 } : {}} 
                      whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                      transition={{ type: "spring", bounce: 0.4 }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setEditing(true)}
                        sx={{
                          backgroundColor: alpha(primaryColor, 0.8),
                          color: '#fff',
                          border: `1px solid ${alpha(primaryColor, 0.3)}`,
                          borderRadius: borderRadius / 4,
                          textTransform: 'none',
                          fontWeight: 600,
                          transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          '&:hover': animationsEnabled ? {
                            backgroundColor: alpha(primaryColor, 0.9),
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                          } : {
                            backgroundColor: alpha(primaryColor, 0.9)
                          }
                        }}
                      >
                        Editar Perfil
                      </Button>
                    </motion.div>
                  ) : (
                    <Box display="flex" gap={1}>
                      <motion.div 
                        whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }} 
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        transition={{ type: "spring", bounce: 0.4 }}
                      >
                        <Button
                          variant="contained"
                          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                          onClick={handleSave}
                          disabled={loading || Object.keys(errors).length > 0}
                          sx={{
                            backgroundColor: alpha(primaryColor, 0.8),
                            color: '#fff',
                            border: `1px solid ${alpha(primaryColor, 0.3)}`,
                            borderRadius: borderRadius / 4,
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                            '&:hover': animationsEnabled ? { 
                              backgroundColor: alpha(primaryColor, 0.9),
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                            } : {
                              backgroundColor: alpha(primaryColor, 0.9)
                            },
                            '&:disabled': {
                              backgroundColor: alpha(primaryColor, 0.3),
                              color: alpha('#fff', 0.6)
                            }
                          }}
                        >
                          {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={animationsEnabled ? { scale: loading ? 1 : 1.02, y: loading ? 0 : -2 } : {}} 
                        whileTap={animationsEnabled ? { scale: loading ? 1 : 0.98 } : {}}
                        transition={{ type: "spring", bounce: 0.4 }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          disabled={loading}
                          sx={{
                            color: '#fff',
                            border: `1px solid ${alpha('#fff', 0.5)}`,
                            borderRadius: borderRadius / 4,
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                            '&:hover': animationsEnabled ? {
                              backgroundColor: alpha('#fff', 0.1),
                              border: `1px solid ${alpha('#fff', 0.7)}`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${alpha('#fff', 0.15)}`
                            } : {
                              backgroundColor: alpha('#fff', 0.1),
                              border: `1px solid ${alpha('#fff', 0.7)}`
                            },
                            '&:disabled': {
                              borderColor: alpha('#fff', 0.3),
                              color: alpha('#fff', 0.5)
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                      </motion.div>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>
      </motion.div>

      <Grid container spacing={3}>
        {/* Columna izquierda - Foto y datos básicos */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.01 }}
          >
            {/* Card de Perfil Personal - Design System Spectacular */}
            <Card sx={{ 
              borderRadius: borderRadius / 2, // Usar configuración de borderRadius
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              border: `1px solid ${alpha(primaryColor, 0.15)}`,
              position: 'relative',
              overflow: 'hidden',
              mb: 3,
              minHeight: 720,
              display: 'flex',
              flexDirection: 'column',
              transition: animationsEnabled ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              backdropFilter: 'blur(20px)',
              boxShadow: `0 8px 32px ${alpha(primaryColor, 0.15)}`,
              '&:hover': animationsEnabled ? {
                boxShadow: `0 12px 40px ${alpha(primaryColor, 0.25)}`,
                transform: 'translateY(-4px)'
              } : {},
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 3s infinite',
                zIndex: 1,
                pointerEvents: 'none'
              },
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }}>
              {/* Header con gradiente spectacular */}
              <Box
                sx={{
                  p: 3, // spacing.lg
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <Person sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Perfil Personal
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Información básica
                  </Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ 
                textAlign: 'center', 
                p: 4, // spacing.xl (32px)
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Avatar con Design System Spectacular */}
                <Box position="relative" display="inline-block" mb={4}>
                  <Avatar
                    src={userProfile?.photoURL}
                    sx={{ 
                      width: 160,
                      height: 160,
                      fontSize: 64,
                      mx: 'auto',
                      boxShadow: `0 8px 25px ${theme.palette.primary.main}20`, // Primary shadow
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: `3px solid ${theme.palette.primary.main}30`,
                      '&:hover': {
                        transform: 'scale(1.05) translateY(-4px)',
                        boxShadow: `0 12px 40px ${theme.palette.primary.main}30`,
                        border: `3px solid ${theme.palette.primary.main}60`
                      }
                    }}
                  >
                    {!userProfile?.photoURL && formData.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  
                  {uploadingPhoto && (
                    <CircularProgress 
                      size={32} 
                      sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        ml: -2, 
                        mt: -2,
                        zIndex: 3
                      }} 
                    />
                  )}
                  
                  {!uploadingPhoto && (
                    <Box sx={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 1 }}>
                      {/* Botón para cambiar foto - Design System */}
                      <motion.div
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Tooltip title="Cambiar foto">
                          <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              width: 40,
                              height: 40,
                              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': { 
                                bgcolor: theme.palette.primary.dark,
                                boxShadow: `0 6px 20px ${theme.palette.primary.main}60`,
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <PhotoCamera fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </motion.div>
                      
                      {/* Botón para eliminar foto - Design System */}
                      {userProfile?.photoURL && (
                        <motion.div
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Tooltip title="Eliminar foto">
                            <IconButton
                              onClick={handleRemovePhoto}
                              sx={{
                                bgcolor: theme.palette.error.main,
                                color: 'white',
                                width: 40,
                                height: 40,
                                boxShadow: `0 4px 12px ${theme.palette.error.main}40`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                  bgcolor: theme.palette.error.dark,
                                  boxShadow: `0 6px 20px ${theme.palette.error.main}60`,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </motion.div>
                      )}
                    </Box>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </Box>

                {/* Información básica */}
                <Box mb={4}>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 800, 
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mr: 1,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {formData.name || 'Usuario'}
                    </Typography>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    >
                      <Verified sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                    </motion.div>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9, 
                      fontWeight: 500,
                      mb: 3
                    }}
                  >
                    {formData.email}
                  </Typography>
                  
                  {/* Badge de rol con Design System */}
                  <Box display="flex" gap={1} justifyContent="center" mb={3}>
                    <Box 
                      sx={{
                        px: 3, // spacing.lg
                        py: 1,
                        borderRadius: 25, // Más redondeado
                        background: (userProfile?.role === 'admin' || userProfile?.role === 'ADMIN') 
                          ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                          : `linear-gradient(135deg, ${theme.palette.info.light}, ${theme.palette.info.main})`,
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${theme.palette.primary.main}60`
                        }
                      }}
                    >
                      {(userProfile?.role === 'admin' || userProfile?.role === 'ADMIN') ? (
                        <>
                          <AdminPanelSettings sx={{ fontSize: 14 }} />
                          Administrador
                        </>
                      ) : (
                        <>
                          <Person sx={{ fontSize: 14 }} />
                          Usuario
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Información adicional - Solo si no es redundante con el rol */}
                  {formData.position && formData.position !== 'Administrador' && (
                    <Typography variant="body2" fontWeight="medium" color="text.primary">
                      {formData.position}
                    </Typography>
                  )}
                  {formData.department && formData.department !== 'Administración' && (
                    <Typography variant="caption" color="text.secondary">
                      {formData.department}
                    </Typography>
                  )}
                  {formData.company && (
                    <Box 
                      sx={{
                        mt: 2,
                        p: 2, // spacing.md
                        borderRadius: 3, // radius.md
                        background: `linear-gradient(135deg, ${theme.palette.success.light}15, ${theme.palette.success.main}10)`,
                        border: `1px solid ${theme.palette.success.main}30`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.success.light}25, ${theme.palette.success.main}20)`,
                          border: `1px solid ${theme.palette.success.main}50`
                        }
                      }}
                    >
                      <Business sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600, 
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          color: theme.palette.success.dark
                        }}
                      >
                        {formData.company}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3, opacity: 0.6 }} /> {/* Más espaciado */}

                {/* Configuración con Design System */}
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: theme.palette.primary.main
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 2px 8px ${theme.palette.primary.main}40`
                      }} 
                    />
                    Configuración
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <Typography variant="caption" fontWeight="medium">
                        Tema
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isDarkMode ? 'Oscuro' : 'Claro'}
                      </Typography>
                    </Box>

                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      <Typography variant="caption" fontWeight="medium">
                        Notificaciones
                      </Typography>
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        Activas
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Columna derecha - Formulario con Tabs */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ 
              borderRadius: 4, // radius.lg (16px)
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 720,
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)', // Glassmorphism
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 3s infinite',
                zIndex: 1,
                pointerEvents: 'none'
              },
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
              }}>
              {/* Header spectacular - Información Personal */}
              <Box
                sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Person sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Información Personal
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Datos personales y profesionales
                  </Typography>
                </Box>
              </Box>              <CardContent sx={{ 
                p: 4, // spacing.xl 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                zIndex: 2
              }}>

                <Grid container spacing={3}> {/* Más espaciado */}
                  {/* Nombre con Design System */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={editing ? { scale: 1.02, y: -2 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Person sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                          Nombre completo
                        </Typography>
                        <TextField
                          fullWidth
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!editing}
                          variant="outlined"
                          placeholder="Ingresa tu nombre completo"
                          error={!!errors.name}
                          helperText={errors.name}
                          inputProps={{
                            'aria-label': 'Nombre completo del usuario',
                            'aria-describedby': errors.name ? 'name-error' : undefined,
                            'aria-required': true
                          }}
                          FormHelperTextProps={{
                            id: 'name-error'
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: editing 
                                ? `${theme.palette.primary.main}15`
                                : `${theme.palette.background.paper}`,
                              border: editing 
                                ? `2px solid ${theme.palette.primary.main}30`
                                : `1px solid ${theme.palette.divider}`,
                              borderRadius: 3, // radius.md
                              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                              backdropFilter: 'blur(10px)',
                              '&:hover': editing ? {
                                backgroundColor: `${theme.palette.primary.main}20`,
                                borderColor: `${theme.palette.primary.main}50`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 25px ${theme.palette.primary.main}20`
                              } : {},
                              '&.Mui-focused': {
                                backgroundColor: `${theme.palette.primary.main}25`,
                                borderColor: theme.palette.primary.main,
                                boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
                                transform: 'translateY(-2px)'
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '18px 20px', // Más padding
                              fontSize: '1rem',
                              fontWeight: editing ? 500 : 400,
                              color: editing ? 'text.primary' : 'text.secondary'
                            }
                          }}
                        />
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ position: 'relative' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1.5, 
                          fontWeight: 500,
                          color: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Email sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                        Correo electrónico
                      </Typography>
                      <TextField
                        fullWidth
                        value={formData.email}
                        disabled={true}
                        variant="outlined"
                        inputProps={{
                          'aria-label': 'Correo electrónico (solo lectura)',
                          readOnly: true
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            background: isDarkMode 
                              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: `2px solid ${theme.palette.primary.main}20`,
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          '& .MuiInputBase-input': {
                            padding: '18px 20px',
                            fontSize: '1rem',
                            color: 'text.secondary',
                            fontWeight: 500
                          }
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Teléfono */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={editing ? { scale: 1.02 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Phone sx={{ fontSize: 16, color: theme.palette.success.main }} />
                          Teléfono
                        </Typography>
                        <TextField
                          fullWidth
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!editing}
                          variant="outlined"
                          placeholder="Ingresa tu número de teléfono"
                          error={!!errors.phone}
                          helperText={errors.phone || 'Formato: +57 300 123 4567'}
                          inputProps={{
                            'aria-label': 'Número de teléfono',
                            'aria-describedby': errors.phone ? 'phone-error' : 'phone-helper'
                          }}
                          FormHelperTextProps={{
                            id: errors.phone ? 'phone-error' : 'phone-helper'
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              background: editing 
                                ? (isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(0, 184, 148, 0.18) 0%, rgba(85, 239, 196, 0.15) 100%)'
                                  : 'linear-gradient(135deg, rgba(0, 184, 148, 0.10) 0%, rgba(85, 239, 196, 0.08) 100%)')
                                : (isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.04)'),
                              backdropFilter: 'blur(10px)',
                              border: editing 
                                ? `2px solid ${theme.palette.success.main}40`
                                : `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                              borderRadius: '16px',
                              boxShadow: editing 
                                ? '0 4px 20px rgba(0, 184, 148, 0.12)'
                                : '0 2px 12px rgba(0,0,0,0.05)',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': editing ? {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(0, 184, 148, 0.25) 0%, rgba(85, 239, 196, 0.22) 100%)'
                                  : 'linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(85, 239, 196, 0.12) 100%)',
                                borderColor: theme.palette.success.main,
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0, 184, 148, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(0, 184, 148, 0.3) 0%, rgba(85, 239, 196, 0.28) 100%)'
                                  : 'linear-gradient(135deg, rgba(0, 184, 148, 0.18) 0%, rgba(85, 239, 196, 0.15) 100%)',
                                borderColor: theme.palette.success.main,
                                boxShadow: `0 0 0 4px ${theme.palette.success.main}20`
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '18px 20px',
                              fontSize: '1rem',
                              fontWeight: editing ? 500 : 400,
                              color: editing ? 'text.primary' : 'text.secondary'
                            },
                            '& .MuiFormHelperText-root': {
                              marginTop: '8px',
                              fontWeight: 500,
                              color: errors.phone ? 'error.main' : 'text.secondary'
                            }
                          }}
                        />
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Cargo */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={editing ? { scale: 1.02 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Work sx={{ fontSize: 16, color: theme.palette.info.main }} />
                          Cargo
                        </Typography>
                        <TextField
                          fullWidth
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          disabled={!editing}
                          variant="outlined"
                          placeholder="Ingresa tu cargo"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              background: editing 
                                ? (isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(116, 185, 255, 0.18) 0%, rgba(161, 196, 253, 0.15) 100%)'
                                  : 'linear-gradient(135deg, rgba(116, 185, 255, 0.10) 0%, rgba(161, 196, 253, 0.08) 100%)')
                                : (isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.04)'),
                              backdropFilter: 'blur(10px)',
                              border: editing 
                                ? `2px solid ${theme.palette.info.main}40`
                                : `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                              borderRadius: '16px',
                              boxShadow: editing 
                                ? '0 4px 20px rgba(116, 185, 255, 0.12)'
                                : '0 2px 12px rgba(0,0,0,0.05)',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': editing ? {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(116, 185, 255, 0.25) 0%, rgba(161, 196, 253, 0.22) 100%)'
                                  : 'linear-gradient(135deg, rgba(116, 185, 255, 0.15) 0%, rgba(161, 196, 253, 0.12) 100%)',
                                borderColor: theme.palette.info.main,
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(116, 185, 255, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(116, 185, 255, 0.3) 0%, rgba(161, 196, 253, 0.28) 100%)'
                                  : 'linear-gradient(135deg, rgba(116, 185, 255, 0.18) 0%, rgba(161, 196, 253, 0.15) 100%)',
                                borderColor: theme.palette.info.main,
                                boxShadow: `0 0 0 4px ${theme.palette.info.main}20`
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '18px 20px',
                              fontSize: '1rem',
                              fontWeight: editing ? 500 : 400,
                              color: editing ? 'text.primary' : 'text.secondary'
                            }
                          }}
                        />
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Departamento - Solo lectura si no está editando */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={editing ? { scale: 1.02 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Business sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                          Departamento
                        </Typography>
                        
                        {editing ? (
                          <FormControl fullWidth disabled={!editing}>
                            <Select
                              value={formData.department}
                              onChange={(e) => handleInputChange('department', e.target.value)}
                              variant="outlined"
                              displayEmpty
                              sx={{
                                borderRadius: '16px !important',
                                '& .MuiOutlinedInput-root': {
                                  background: editing 
                                    ? (isDarkMode 
                                      ? 'linear-gradient(135deg, rgba(253, 203, 110, 0.18) 0%, rgba(255, 231, 146, 0.15) 100%)'
                                      : 'linear-gradient(135deg, rgba(253, 203, 110, 0.10) 0%, rgba(255, 231, 146, 0.08) 100%)')
                                    : (isDarkMode 
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.04)'),
                                  backdropFilter: 'blur(10px)',
                                  border: editing 
                                    ? `2px solid ${theme.palette.warning.main}40`
                                    : `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                  borderRadius: '16px !important',
                                  boxShadow: editing 
                                    ? '0 4px 20px rgba(253, 203, 110, 0.12)'
                                    : '0 2px 12px rgba(0,0,0,0.05)',
                                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': editing ? {
                                    background: isDarkMode 
                                      ? 'linear-gradient(135deg, rgba(253, 203, 110, 0.25) 0%, rgba(255, 231, 146, 0.22) 100%)'
                                      : 'linear-gradient(135deg, rgba(253, 203, 110, 0.15) 0%, rgba(255, 231, 146, 0.12) 100%)',
                                    borderColor: theme.palette.warning.main,
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(253, 203, 110, 0.2)'
                                  } : {},
                                  '&.Mui-focused': {
                                    background: isDarkMode 
                                      ? 'linear-gradient(135deg, rgba(253, 203, 110, 0.3) 0%, rgba(255, 231, 146, 0.28) 100%)'
                                      : 'linear-gradient(135deg, rgba(253, 203, 110, 0.18) 0%, rgba(255, 231, 146, 0.15) 100%)',
                                    borderColor: theme.palette.warning.main,
                                    boxShadow: `0 0 0 4px ${theme.palette.warning.main}20`
                                  },
                                  '& fieldset': {
                                    border: 'none',
                                    borderRadius: '16px !important'
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '16px !important'
                                  }
                                },
                                '& .MuiSelect-select': {
                                  padding: '18px 20px',
                                  fontSize: '1rem',
                                  fontWeight: editing ? 500 : 400,
                                  color: editing ? 'text.primary' : 'text.secondary',
                                  borderRadius: '16px !important'
                                },
                                '& .MuiSelect-icon': {
                                  color: editing ? theme.palette.warning.main : 'text.secondary'
                                }
                              }}
                            >
                              <MenuItem value="" disabled>
                                <em>Selecciona un departamento</em>
                              </MenuItem>
                              <MenuItem value="Administración">Administración</MenuItem>
                              <MenuItem value="Finanzas">Finanzas</MenuItem>
                              <MenuItem value="Contabilidad">Contabilidad</MenuItem>
                              <MenuItem value="Recursos Humanos">Recursos Humanos</MenuItem>
                              <MenuItem value="Operaciones">Operaciones</MenuItem>
                              <MenuItem value="Tecnología">Tecnología</MenuItem>
                              <MenuItem value="Ventas">Ventas</MenuItem>
                              <MenuItem value="Marketing">Marketing</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Box 
                            sx={{
                              p: '18px 20px',
                              borderRadius: '16px',
                              background: isDarkMode 
                                ? 'linear-gradient(135deg, rgba(253, 203, 110, 0.12) 0%, rgba(255, 231, 146, 0.10) 100%)'
                                : 'linear-gradient(135deg, rgba(253, 203, 110, 0.06) 0%, rgba(255, 231, 146, 0.04) 100%)',
                              backdropFilter: 'blur(10px)',
                              border: `2px solid ${theme.palette.warning.main}20`,
                              boxShadow: '0 2px 12px rgba(253, 203, 110, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <Business sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {formData.department || 'Sin departamento asignado'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Empresa - Solo lectura si no está editando */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={editing ? { scale: 1.02 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Business sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                          Empresa
                        </Typography>
                        
                        {editing ? (
                          <TextField
                            fullWidth
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            disabled={!editing}
                            variant="outlined"
                            placeholder="Ingresa el nombre de tu empresa"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                background: editing 
                                  ? (isDarkMode 
                                    ? 'linear-gradient(135deg, rgba(225, 112, 85, 0.18) 0%, rgba(255, 127, 80, 0.15) 100%)'
                                    : 'linear-gradient(135deg, rgba(225, 112, 85, 0.10) 0%, rgba(255, 127, 80, 0.08) 100%)')
                                  : (isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : 'rgba(0, 0, 0, 0.04)'),
                                backdropFilter: 'blur(10px)',
                                border: editing 
                                  ? `2px solid ${theme.palette.error.main}40`
                                  : `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                borderRadius: '16px',
                                boxShadow: editing 
                                  ? '0 4px 20px rgba(225, 112, 85, 0.12)'
                                  : '0 2px 12px rgba(0,0,0,0.05)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': editing ? {
                                  background: isDarkMode 
                                    ? 'linear-gradient(135deg, rgba(225, 112, 85, 0.25) 0%, rgba(255, 127, 80, 0.22) 100%)'
                                    : 'linear-gradient(135deg, rgba(225, 112, 85, 0.15) 0%, rgba(255, 127, 80, 0.12) 100%)',
                                  borderColor: theme.palette.error.main,
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(225, 112, 85, 0.2)'
                                } : {},
                                '&.Mui-focused': {
                                  background: isDarkMode 
                                    ? 'linear-gradient(135deg, rgba(225, 112, 85, 0.3) 0%, rgba(255, 127, 80, 0.28) 100%)'
                                    : 'linear-gradient(135deg, rgba(225, 112, 85, 0.18) 0%, rgba(255, 127, 80, 0.15) 100%)',
                                  borderColor: theme.palette.error.main,
                                  boxShadow: `0 0 0 4px ${theme.palette.error.main}20`
                                },
                                '& fieldset': {
                                  border: 'none'
                                }
                              },
                              '& .MuiInputBase-input': {
                                padding: '18px 20px',
                                fontSize: '1rem',
                                fontWeight: editing ? 500 : 400,
                                color: editing ? 'text.primary' : 'text.secondary'
                              }
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{
                              p: '18px 20px',
                              borderRadius: '16px',
                              background: isDarkMode 
                                ? 'linear-gradient(135deg, rgba(225, 112, 85, 0.12) 0%, rgba(255, 127, 80, 0.10) 100%)'
                                : 'linear-gradient(135deg, rgba(225, 112, 85, 0.06) 0%, rgba(255, 127, 80, 0.04) 100%)',
                              backdropFilter: 'blur(10px)',
                              border: `2px solid ${theme.palette.error.main}20`,
                              boxShadow: '0 2px 12px rgba(225, 112, 85, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                          >
                            <Business sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {formData.company || 'Sin empresa asignada'}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Ubicación */}
                  <Grid item xs={12}>
                    <motion.div
                      whileHover={editing ? { scale: 1.01 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1.5, 
                            fontWeight: 500,
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <LocationOn sx={{ fontSize: 16, color: theme.palette.error.main }} />
                          Ubicación
                        </Typography>
                        <TextField
                          fullWidth
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          disabled={!editing}
                          variant="outlined"
                          placeholder="Ingresa tu ubicación"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              background: editing 
                                ? (isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(253, 121, 168, 0.18) 0%, rgba(255, 159, 198, 0.15) 100%)'
                                  : 'linear-gradient(135deg, rgba(253, 121, 168, 0.10) 0%, rgba(255, 159, 198, 0.08) 100%)')
                                : (isDarkMode 
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.04)'),
                              backdropFilter: 'blur(10px)',
                              border: editing 
                                ? `2px solid ${theme.palette.secondary.main}40`
                                : `2px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                              borderRadius: '16px',
                              boxShadow: editing 
                                ? '0 4px 20px rgba(253, 121, 168, 0.12)'
                                : '0 2px 12px rgba(0,0,0,0.05)',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': editing ? {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(253, 121, 168, 0.25) 0%, rgba(255, 159, 198, 0.22) 100%)'
                                  : 'linear-gradient(135deg, rgba(253, 121, 168, 0.15) 0%, rgba(255, 159, 198, 0.12) 100%)',
                                borderColor: theme.palette.secondary.main,
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(253, 121, 168, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, rgba(253, 121, 168, 0.3) 0%, rgba(255, 159, 198, 0.28) 100%)'
                                  : 'linear-gradient(135deg, rgba(253, 121, 168, 0.18) 0%, rgba(255, 159, 198, 0.15) 100%)',
                                borderColor: theme.palette.secondary.main,
                                boxShadow: `0 0 0 4px ${theme.palette.secondary.main}20`
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '18px 20px',
                              fontSize: '1rem',
                              fontWeight: editing ? 500 : 400,
                              color: editing ? 'text.primary' : 'text.secondary'
                            }
                          }}
                        />
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Botones de acción */}
                  {editing && (
                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                          >
                            <Button
                              variant="outlined"
                              onClick={handleCancel}
                              startIcon={<Cancel />}
                              aria-label="Cancelar edición y descartar cambios"
                              sx={{
                                color: theme.palette.text.primary,
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                borderRadius: borderRadius / 4,
                                textTransform: 'none',
                                fontWeight: 600,
                                padding: '8px 16px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.action.hover, 0.1),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.action.hover, 0.15)}`
                                }
                              }}
                            >
                              Cancelar
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                          >
                            <Button
                              variant="contained"
                              onClick={handleSave}
                              startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                              disabled={loading || Object.keys(errors).length > 0}
                              aria-label={loading ? 'Guardando cambios del perfil' : 'Guardar cambios del perfil'}
                              sx={{
                                backgroundColor: alpha(primaryColor, 0.8),
                                color: '#fff',
                                border: `1px solid ${alpha(primaryColor, 0.3)}`,
                                borderRadius: borderRadius / 4,
                                textTransform: 'none',
                                fontWeight: 600,
                                padding: '8px 16px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': Object.keys(errors).length === 0 ? {
                                  backgroundColor: alpha(primaryColor, 0.9),
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                                } : {},
                                '&:disabled': {
                                  backgroundColor: alpha(primaryColor, 0.3),
                                  color: alpha('#fff', 0.6)
                                }
                              }}
                            >
                              {loading ? 'Guardando...' : `Guardar cambios${Object.keys(errors).length > 0 ? ' (Corrige errores)' : ''}`}
                            </Button>
                          </motion.div>
                        </Box>
                      </motion.div>
                    </Grid>
                  )}

                  {/* Información de la Cuenta */}
                  {!editing && (
                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <Box sx={{ mt: 2 }}>
                          <Divider sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                              Información de la Cuenta
                            </Typography>
                          </Divider>
                          
                          {/* Badges pequeñas de información de cuenta */}
                          <Box display="flex" gap={1} justifyContent="center">
                            <Box 
                              sx={{
                                px: 2,
                                py: 0.5,
                                borderRadius: 20,
                                background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <Business sx={{ fontSize: 14 }} />
                              Registro: {user?.metadata?.creationTime ? 
                                new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short'
                                }) : 'N/A'
                              }
                            </Box>
                            <Box 
                              sx={{
                                px: 2,
                                py: 0.5,
                                borderRadius: 20,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <Person sx={{ fontSize: 14 }} />
                              Acceso: {user?.metadata?.lastSignInTime ? 
                                new Date(user.metadata.lastSignInTime).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short'
                                }) : 'Hoy'
                              }
                            </Box>
                          </Box>
                          
                          {/* Botón Cambiar Contraseña */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <motion.div 
                              whileHover={{ scale: 1.02, y: -2 }} 
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", bounce: 0.4 }}
                            >
                              <Button
                                variant="outlined"
                                startIcon={<Key />}
                                onClick={() => setShowPasswordDialog(true)}
                                sx={{
                                  color: theme.palette.warning.main,
                                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                                  borderRadius: borderRadius / 4,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  padding: '8px 16px',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.5)}`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`
                                  }
                                }}
                              >
                                Cambiar Contraseña
                              </Button>
                            </motion.div>
                          </Box>
                        </Box>
                      </motion.div>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Dialog para cambiar contraseña */}
      <Dialog 
        open={showPasswordDialog} 
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <VpnKey sx={{ color: theme.palette.error.main }} />
            Cambiar Contraseña
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Para cambiar tu contraseña, primero confirma tu contraseña actual y luego ingresa la nueva.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña actual"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nueva contraseña"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                helperText="Mínimo 6 caracteres"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmar nueva contraseña"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                helperText={
                  passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                    ? 'Las contraseñas no coinciden'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPasswordDialog(false)}
            disabled={loadingPassword}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleChangePassword}
            variant="contained"
            disabled={
              loadingPassword || 
              !passwordData.currentPassword || 
              !passwordData.newPassword || 
              passwordData.newPassword !== passwordData.confirmPassword ||
              passwordData.newPassword.length < 6
            }
            startIcon={loadingPassword ? <CircularProgress size={16} /> : <Lock />}
            sx={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)'
              }
            }}
          >
            {loadingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ProfilePage;
