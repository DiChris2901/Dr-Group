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
  IconButton,
  Alert,
  Divider,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Snackbar,
  Slide,
  InputAdornment,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tooltip,
  useTheme,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';

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
  VpnKey,
  Delete,
  Computer,
  Smartphone,
  Tablet,
  Visibility,
  VisibilityOff,
  AccessTime,
  AdminPanelSettings,
  Key,
  Lock,
  VpnKey as KeyIcon,
  Notifications as NotificationsIcon,
  VolumeUp as SoundIcon,
  Vibration as VibrationIcon,
  NotificationsActive as BrowserNotificationIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PageSkeleton from '../components/common/PageSkeleton';
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
  onSnapshot,
  getDoc
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
  const [activeTab, setActiveTab] = useState(0); // Estado para las pestañas
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
      
      const newFormData = {
        name: userProfile.name || '',
        email: userProfile.email || user?.email || '',
        phone: userProfile.phone || '',
        position: userProfile.position || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        role: userProfile.role || 'user'
      };
      
      setFormData(newFormData);
      
    } else {
    }
  }, [userProfile, user]);

  const showAlert = (message, severity = 'success') => {
    // Solo mostrar notificaciones si están habilitadas en settings
    if (!notificationsEnabled) return;
    
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: 'success' }), 5000);
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
      console.error('❌ ProfilePage - Error al guardar:', error);
      console.error('❌ ProfilePage - Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
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
      location: userProfile?.location || '',
      bio: userProfile?.bio || '',
      role: userProfile?.role || 'user'
    });
    setEditing(false);
    setHasUnsavedChanges(false);
    setErrors({});
  };

  if (loading) return <PageSkeleton variant="form" kpiCount={0} rows={5} />;

  return (
    <Box sx={{
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* Auto-save notification */}
      <Snackbar
        open={showAutoSaveNotice && notificationsEnabled}
        autoHideDuration={2000}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ 
          borderRadius: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          ✨ Cambios guardados automáticamente
        </Alert>
      </Snackbar>

      {/* Alert sobrio */}
      {alert.open && notificationsEnabled && (
        <Alert 
          severity={alert.severity} 
          sx={{ 
            mb: 3,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header con gradiente - Diseño sobrio */}
      <Box sx={{
        mb: 3,
        borderRadius: 1,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ 
          p: 3,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Person sx={{ fontSize: 32, color: 'white' }} />
            <Box>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'white',
                  lineHeight: 1.2
                }}
              >
                Perfil de Usuario
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 400,
                  mt: 0.5
                }}
              >
                {formData.name || 'Sin nombre'} • {getUserRole()}
              </Typography>
            </Box>
          </Box>
          
          {/* Botones en el header */}
          <Box display="flex" gap={1}>
            {!editing ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditing(true)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: 1,
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
                  onClick={handleSave}
                  disabled={loading || Object.keys(errors).length > 0}
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                    borderRadius: 1,
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(76, 175, 80, 1)'
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: 1,
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Cancelar
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Columna izquierda - Foto y datos básicos */}
        <Grid item xs={12} lg={4}>
          {/* Card de Perfil Personal - Diseño sobrio */}
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            mb: 3,
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            {/* Header sobrio */}
            <Box sx={{
              p: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Person sx={{ fontSize: 24 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Perfil Personal
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Información básica
                </Typography>
              </Box>
            </Box>
            
            <CardContent sx={{ 
              textAlign: 'center', 
              p: 4,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Avatar sobrio */}
              <Box position="relative" display="inline-block" mb={4}>
                <Avatar
                  src={userProfile?.photoURL}
                  sx={{ 
                    width: 120,
                    height: 120,
                    fontSize: 48,
                    mx: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'box-shadow 0.2s ease',
                    border: `2px solid ${theme.palette.primary.main}30`,
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {!userProfile?.photoURL && formData.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                
                {uploadingPhoto && (
                  <CircularProgress 
                    size={24} 
                    sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      ml: -1.5, 
                      mt: -1.5
                    }} 
                  />
                )}
                
                {!uploadingPhoto && (
                  <Box sx={{ position: 'absolute', bottom: 0, right: 0, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Cambiar foto">
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': { 
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        <PhotoCamera fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {userProfile?.photoURL && (
                      <Tooltip title="Eliminar foto">
                        <IconButton
                          onClick={handleRemovePhoto}
                          size="small"
                          sx={{
                            bgcolor: 'error.main',
                            color: 'white',
                            width: 32,
                            height: 32,
                            '&:hover': { 
                              bgcolor: 'error.dark'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                      fontWeight: 600,
                      mr: 1,
                      color: 'text.primary'
                    }}
                  >
                    {formData.name || 'Usuario'}
                  </Typography>
                  <Verified sx={{ color: 'primary.main', fontSize: 20 }} />
                </Box>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {formData.email}
                </Typography>
                
                {/* Badge de departamento sobrio */}
                {userProfile?.department && (
                  <Box display="flex" justifyContent="center" mb={3}>
                    <Chip
                      icon={<Business />}
                      label={userProfile.department}
                      color={(userProfile?.role === 'admin' || userProfile?.role === 'ADMIN') ? 'primary' : 'secondary'}
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}

                {/* Información adicional */}
                {formData.position && (
                  <Typography variant="body2" color="text.primary" sx={{ mb: 1, textAlign: 'center' }}>
                    <Work sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    {formData.position}
                  </Typography>
                )}
                {formData.location && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    {formData.location}
                  </Typography>
                )}
                {formData.phone && (
                  <Box sx={{
                    mt: 1,
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <Phone sx={{ color: 'info.main', fontSize: 16 }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'info.dark'
                      }}
                    >
                      {formData.phone}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Configuración sobria */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary'
                  }}
                >
                  Configuración
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption">Tema</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isDarkMode ? 'Oscuro' : 'Claro'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption">Notificaciones</Typography>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                      Activas
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Columna derecha - Formulario sobrio */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.secondary.main, 0.8)
            }
          }}>
            {/* Header sobrio con pestañas */}
            <Box sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: 'white'
            }}>
              <Box sx={{ 
                p: 3, 
                pb: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Person sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Mi Perfil
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Información personal y permisos
                  </Typography>
                </Box>
              </Box>
              
              {/* Tabs */}
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  px: 3,
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    minHeight: 48,
                    '&.Mui-selected': {
                      color: 'white'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'white',
                    height: 3
                  }
                }}
              >
                <Tab label="Información Personal" />
                <Tab label="Empresas y Permisos" />
              </Tabs>
            </Box>

            <CardContent sx={{ 
              p: 4,
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column'
            }}>

              {/* Tab 1: Información Personal */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                {/* Nombre */}
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: editing 
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'background.paper',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': editing ? {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08)
                          } : {},
                          '&.Mui-focused': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 16px',
                          fontSize: '1rem',
                          fontWeight: editing ? 500 : 400,
                          color: editing ? 'text.primary' : 'text.secondary'
                        }
                      }}
                    />
                  </Box>
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.03),
                          borderRadius: 1
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 16px',
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: editing 
                            ? alpha(theme.palette.success.main, 0.05)
                            : 'background.paper',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': editing ? {
                            backgroundColor: alpha(theme.palette.success.main, 0.08)
                          } : {},
                          '&.Mui-focused': {
                            backgroundColor: alpha(theme.palette.success.main, 0.1)
                          }
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 16px',
                          fontSize: '1rem',
                          fontWeight: editing ? 500 : 400,
                          color: editing ? 'text.primary' : 'text.secondary'
                        }
                      }}
                    />
                  </Box>
                </Grid>

                {/* Cargo */}
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
                          backgroundColor: editing 
                            ? alpha(theme.palette.info.main, 0.05)
                            : 'background.paper',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': editing ? {
                            backgroundColor: alpha(theme.palette.info.main, 0.08)
                          } : {},
                          '&.Mui-focused': {
                            backgroundColor: alpha(theme.palette.info.main, 0.1)
                          }
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 16px',
                          fontSize: '1rem',
                          fontWeight: editing ? 500 : 400,
                          color: editing ? 'text.primary' : 'text.secondary'
                        }
                      }}
                    />
                  </Box>
                </Grid>

                {/* Ubicación */}
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
                          backgroundColor: editing 
                            ? alpha(theme.palette.error.main, 0.05)
                            : 'background.paper',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': editing ? {
                            backgroundColor: alpha(theme.palette.error.main, 0.08)
                          } : {},
                          '&.Mui-focused': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1)
                          }
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 16px',
                          fontSize: '1rem',
                          fontWeight: editing ? 500 : 400,
                          color: editing ? 'text.primary' : 'text.secondary'
                        }
                      }}
                    />
                  </Box>
                </Grid>

                {/* Fecha de Ingreso */}
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
                      <AccessTime sx={{ fontSize: 16, color: theme.palette.success.main }} />
                      Fecha de Ingreso
                    </Typography>
                    <TextField
                      fullWidth
                      value={userProfile?.hireDate || 'No especificada'}
                      disabled={true}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: alpha(theme.palette.success.main, 0.05),
                          borderRadius: 1
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 16px',
                          fontSize: '1rem',
                          color: 'text.secondary',
                          fontWeight: 500
                        }
                      }}
                    />
                  </Box>
                </Grid>

                {/* Información de la Cuenta */}
                {!editing && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                          Información de la Cuenta
                        </Typography>
                      </Divider>
                      
                      {/* Badges de información */}
                      <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap" mb={3}>
                        <Chip
                          icon={<Business />}
                          label={`Registro: ${user?.metadata?.creationTime ? 
                            new Date(user.metadata.creationTime).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'
                          }`}
                          variant="outlined"
                          size="small"
                          color="success"
                        />
                        <Chip
                          icon={<Person />}
                          label={`Último acceso: ${user?.metadata?.lastSignInTime ? 
                            new Date(user.metadata.lastSignInTime).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Hoy'
                          }`}
                          variant="outlined"
                          size="small"
                          color="primary"
                        />
                        {user?.emailVerified && (
                          <Chip
                            icon={<Verified />}
                            label="Email verificado"
                            variant="outlined"
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                      
                      {/* Botón Cambiar Contraseña */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          startIcon={<KeyIcon />}
                          onClick={() => setShowPasswordDialog(true)}
                          sx={{
                            borderRadius: 1,
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          Cambiar Contraseña
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
              )}

              {/* Tab 2: Empresas y Permisos */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  
                {/* Empresas Asignadas */}
                <Grid item xs={12}>
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
                      Empresas Asignadas
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1,
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      minHeight: 60,
                      alignItems: 'center'
                    }}>
                      {userProfile?.companies && userProfile.companies.length > 0 ? (
                        userProfile.companies.map((company, index) => (
                          <Chip
                            key={index}
                            label={company}
                            variant="outlined"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 500 }}
                          />
                        ))
                      ) : (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontStyle: 'italic',
                            width: '100%',
                            textAlign: 'center'
                          }}
                        >
                          Sin empresas asignadas
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Permisos Asignados */}
                {userProfile?.permissions && Object.keys(userProfile.permissions).length > 0 && (
                  <Grid item xs={12}>
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
                        <VpnKey sx={{ fontSize: 16, color: theme.palette.info.main }} />
                        Permisos de Acceso
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1,
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        maxHeight: 300,
                        overflowY: 'auto'
                      }}>
                        {Object.keys(userProfile.permissions)
                          .filter(perm => userProfile.permissions[perm] === true)
                          .map((permission, index) => {
                            const label = permission
                              .replace(/_/g, ' ')
                              .replace(/\./g, ' › ')
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            
                            return (
                              <Chip
                                key={index}
                                label={label}
                                variant="outlined"
                                size="small"
                                color="info"
                                sx={{ fontWeight: 500 }}
                              />
                            );
                          })
                        }
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
              )}
            </CardContent>
          </Card>
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
                error={!!(passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword)}
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
