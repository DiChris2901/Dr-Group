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
  Tab,
  Tabs,
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
  Security,
  VpnKey,
  Shield,
  Delete,
  History,
  Computer,
  Smartphone,
  Tablet,
  ExitToApp,
  Visibility,
  VisibilityOff,
  Google,
  Microsoft,
  AccountCircle,
  RestoreFromTrash,
  DeleteForever,
  Warning,
  CheckCircle,
  AccessTime,
  Devices,
  NotificationImportant,
  AdminPanelSettings,
  Key,
  Lock,
  LockOpen,
  PersonRemove,
  LinkOff,
  Link
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { storage, db, auth as firebaseAuth } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  deleteUser,
  linkWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  unlink
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
  onSnapshot
} from 'firebase/firestore';

const ProfilePage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Estados principales
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const fileInputRef = useRef(null);

  // Estados de seguridad
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  const [loginHistory, setLoginHistory] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
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
      setShowAutoSaveNotice(true);
      setTimeout(() => setShowAutoSaveNotice(false), 2000);
    } catch (error) {
      console.error('Error en auto-save:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [formData, editing, hasUnsavedChanges, errors, updateUserProfile]);

  // Funciones de seguridad
  const loadLoginHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const historyRef = collection(db, 'loginHistory');
      const q = query(
        historyRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLoginHistory(history);
    } catch (error) {
      console.error('Error loading login history:', error);
      setLoginHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  const loadLinkedAccounts = useCallback(() => {
    if (!user?.providerData) return;
    const accounts = user.providerData.map(provider => ({
      providerId: provider.providerId,
      email: provider.email,
      displayName: provider.displayName
    }));
    setLinkedAccounts(accounts);
  }, [user]);

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

  const handleLinkAccount = async (provider) => {
    try {
      let authProvider;
      if (provider === 'google') {
        authProvider = new GoogleAuthProvider();
      } else if (provider === 'microsoft') {
        authProvider = new OAuthProvider('microsoft.com');
      }
      
      await linkWithPopup(user, authProvider);
      showAlert(`Cuenta de ${provider} vinculada exitosamente`, 'success');
      loadLinkedAccounts();
    } catch (error) {
      console.error('Error linking account:', error);
      showAlert(`Error al vincular cuenta de ${provider}`, 'error');
    }
  };

  const handleUnlinkAccount = async (providerId) => {
    try {
      await unlink(user, providerId);
      showAlert('Cuenta desvinculada exitosamente', 'success');
      loadLinkedAccounts();
    } catch (error) {
      console.error('Error unlinking account:', error);
      showAlert('Error al desvincular cuenta', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    setLoadingDelete(true);
    try {
      // Eliminar documentos del usuario de Firestore
      if (userProfile) {
        await deleteDoc(doc(db, 'users', user.uid));
      }
      
      // Eliminar historial de login
      const historyRef = collection(db, 'loginHistory');
      const q = query(historyRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Eliminar cuenta de Firebase Auth
      await deleteUser(user);
      
      showAlert('Cuenta eliminada exitosamente', 'success');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      showAlert('Error al eliminar la cuenta', 'error');
    } finally {
      setLoadingDelete(false);
      setShowDeleteDialog(false);
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

  // Cargar datos de seguridad al cambiar de tab
  useEffect(() => {
    if (activeTab === 1) { // Tab de Seguridad
      loadLoginHistory();
      loadLinkedAccounts();
    }
  }, [activeTab, loadLoginHistory, loadLinkedAccounts]);

  const showAlert = (message, severity = 'success') => {
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

  // Función para obtener el nombre del proveedor
  const getProviderName = (providerId) => {
    switch (providerId) {
      case 'google.com': return 'Google';
      case 'microsoft.com': return 'Microsoft';
      case 'password': return 'Email/Contraseña';
      default: return providerId;
    }
  };

  // Función para obtener el icono del proveedor
  const getProviderIcon = (providerId) => {
    switch (providerId) {
      case 'google.com': return <Google />;
      case 'microsoft.com': return <Microsoft />;
      case 'password': return <Email />;
      default: return <AccountCircle />;
    }
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Auto-save notification */}
      <Snackbar
        open={showAutoSaveNotice}
        autoHideDuration={2000}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          ✨ Cambios guardados automáticamente
        </Alert>
      </Snackbar>

      {/* Alert mejorado */}
      {alert.open && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          <Alert 
            severity={alert.severity} 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: 3,
              border: alert.severity === 'error' ? '1px solid #f44336' : '1px solid #4caf50'
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
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            borderRadius: 4,
            p: 3,
            position: 'relative',
            overflow: 'hidden',
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
                      whileHover={{ scale: 1.02, y: -2 }} 
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setEditing(true)}
                        sx={{
                          backgroundColor: alpha('#fff', 0.2),
                          color: '#fff',
                          border: `1px solid ${alpha('#fff', 0.3)}`,
                          borderRadius: 3,
                          textTransform: 'none',
                          fontWeight: 600,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: alpha('#fff', 0.3),
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha('#fff', 0.2)}`
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
                            backgroundColor: alpha('#fff', 0.2),
                            color: '#fff',
                            border: `1px solid ${alpha('#fff', 0.3)}`,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                              backgroundColor: alpha('#fff', 0.3),
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${alpha('#fff', 0.2)}`
                            },
                            '&:disabled': {
                              backgroundColor: alpha('#fff', 0.1),
                              color: alpha('#fff', 0.5)
                            }
                          }}
                        >
                          {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }} 
                        whileTap={{ scale: loading ? 1 : 0.98 }}
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
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 600,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              backgroundColor: alpha('#fff', 0.1),
                              border: `1px solid ${alpha('#fff', 0.7)}`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${alpha('#fff', 0.15)}`
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
            {/* Card de Perfil Personal */}
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: isDarkMode 
                ? 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              mb: 2,
              minHeight: 720, // Altura mínima consistente con las tarjetas de la derecha
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease-out',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.1)}, transparent)`,
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                },
                animation: 'shimmer 3s infinite',
                zIndex: 1,
                pointerEvents: 'none'
              }
            }}>
              {/* Header con icono */}
              <Box
                sx={{
                  p: 2.5,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
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
                p: 4, // Aumentar padding
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {/* Avatar con anillo completo animado - Más grande */}
                <Box position="relative" display="inline-block" mb={4}>
                  {/* Anillo exterior completo con gradiente animado */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{
                      position: 'absolute',
                      inset: -12, // Aumentar el anillo
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24, #fd79a8, #fdcb6e, #74b9ff, #6c5ce7, #a29bfe, #ff6b6b)',
                      backgroundSize: '400% 400%',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: theme.palette.background.paper
                      }}
                    />
                  </motion.div>
                  
                  {/* Anillo interno con efecto de brillo */}
                  <motion.div
                    animate={{ 
                      rotate: -360,
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, rgba(255, 107, 107, 0.6), rgba(238, 90, 36, 0.6), rgba(253, 121, 168, 0.6), rgba(116, 185, 255, 0.6))',
                      padding: '2px'
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: theme.palette.background.paper
                      }}
                    />
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Avatar
                      src={userProfile?.photoURL}
                      sx={{ 
                        width: 160, // Aumentar de 120 a 160
                        height: 160, // Aumentar de 120 a 160
                        fontSize: 64, // Aumentar fuente proporcionalmente
                        mx: 'auto',
                        border: '5px solid', // Aumentar borde
                        borderColor: 'background.paper',
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)', // Aumentar sombra
                        position: 'relative',
                        zIndex: 2
                      }}
                    >
                      {!userProfile?.photoURL && formData.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </motion.div>
                  
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
                    <Box sx={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 0.5 }}>
                      {/* Botón para cambiar foto */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Tooltip title="Cambiar foto">
                          <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              bgcolor: '#ff6b6b',
                              color: 'white',
                              width: 32,
                              height: 32,
                              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                              '&:hover': { 
                                bgcolor: '#ee5a24',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 16px rgba(255, 107, 107, 0.4)'
                              },
                              zIndex: 3
                            }}
                          >
                            <PhotoCamera fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </motion.div>
                      
                      {/* Botón para eliminar foto (solo si hay foto) */}
                      {userProfile?.photoURL && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Tooltip title="Eliminar foto">
                            <IconButton
                              onClick={handleRemovePhoto}
                              sx={{
                                bgcolor: '#e74c3c',
                                color: 'white',
                                width: 32,
                                height: 32,
                                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                                '&:hover': { 
                                  bgcolor: '#c0392b',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 6px 16px rgba(231, 76, 60, 0.4)'
                                },
                                zIndex: 3
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
                <Box mb={4}> {/* Aumentar margen inferior */}
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                      {formData.name || 'Usuario'}
                    </Typography>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    >
                      <Verified sx={{ color: '#ff6b6b', fontSize: 20 }} />
                    </motion.div>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {formData.email}
                  </Typography>
                  
                  {/* Badge de rol */}
                  <Box display="flex" gap={1} justifyContent="center" mb={3}> {/* Aumentar margen inferior */}
                    <Box 
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 20,
                        background: (userProfile?.role === 'admin' || userProfile?.role === 'ADMIN') 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
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
                        p: 1.5,
                        borderRadius: 2,
                        background: isDarkMode ? 'rgba(0, 184, 148, 0.1)' : 'rgba(0, 184, 148, 0.05)',
                        border: '1px solid rgba(0, 184, 148, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Business sx={{ color: '#00b894', fontSize: 16 }} />
                      <Typography variant="caption" fontWeight="medium">
                        {formData.company}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1.5, opacity: 0.6 }} />

                {/* Configuración única - Solo info no disponible en otros lados */}
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" mb={1.5} display="flex" alignItems="center" gap={1}>
                    <Box 
                      sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #667eea, #764ba2)' 
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
              borderRadius: 3, 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: isDarkMode 
                ? 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 720, // Altura mínima igual que la tarjeta izquierda
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Tabs Header */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 64,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }
                  }}
                >
                  <Tab 
                    icon={<Person />} 
                    label="Información Personal" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<Security />} 
                    label="Seguridad y Privacidad" 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              {/* Tab Panel - Información Personal */}
              {activeTab === 0 && (
                <Box>
                  {/* Header optimizado */}
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  </Box>
              
              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>

                <Grid container spacing={2.5}>
                  {/* Nombre */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={editing ? { scale: 1.02 } : {}}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Person sx={{ fontSize: 18, color: '#667eea' }} />
                          Nombre completo
                          <Chip size="small" label="Requerido" color="error" sx={{ ml: 0.5, fontSize: '0.65rem', height: 18 }} />
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
                                ? (isDarkMode ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.08)')
                                : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                              border: editing 
                                ? '2px solid rgba(102, 126, 234, 0.3)'
                                : '2px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: 3,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': editing ? {
                                backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.12)',
                                borderColor: 'rgba(102, 126, 234, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.25)' : 'rgba(102, 126, 234, 0.15)',
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.15)',
                                transform: 'translateY(-1px)'
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '16px 18px',
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
                        fontWeight="medium" 
                        sx={{ 
                          mb: 1.5, 
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Email sx={{ fontSize: 18, color: '#6c5ce7' }} />
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
                            backgroundColor: isDarkMode ? 'rgba(108, 92, 231, 0.12)' : 'rgba(108, 92, 231, 0.06)',
                            border: '2px solid rgba(108, 92, 231, 0.2)',
                            borderRadius: 3,
                            '& fieldset': {
                              border: 'none'
                            }
                          },
                          '& .MuiInputBase-input': {
                            padding: '16px 18px',
                            fontSize: '1rem',
                            color: 'text.secondary'
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
                          fontWeight="medium" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Phone sx={{ fontSize: 18, color: '#00b894' }} />
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
                              backgroundColor: editing 
                                ? (isDarkMode ? 'rgba(0, 184, 148, 0.15)' : 'rgba(0, 184, 148, 0.08)')
                                : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                              border: editing 
                                ? '2px solid rgba(0, 184, 148, 0.3)'
                                : '2px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': editing ? {
                                backgroundColor: isDarkMode ? 'rgba(0, 184, 148, 0.2)' : 'rgba(0, 184, 148, 0.12)',
                                borderColor: 'rgba(0, 184, 148, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(0, 184, 148, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                backgroundColor: isDarkMode ? 'rgba(0, 184, 148, 0.25)' : 'rgba(0, 184, 148, 0.15)',
                                borderColor: '#00b894',
                                boxShadow: '0 0 0 3px rgba(0, 184, 148, 0.15)'
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '16px 18px',
                              fontSize: '1rem',
                              fontWeight: editing ? 500 : 400,
                              color: editing ? 'text.primary' : 'text.secondary'
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
                          fontWeight="medium" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Work sx={{ fontSize: 18, color: '#74b9ff' }} />
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
                                ? (isDarkMode ? 'rgba(116, 185, 255, 0.15)' : 'rgba(116, 185, 255, 0.08)')
                                : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                              border: editing 
                                ? '2px solid rgba(116, 185, 255, 0.3)'
                                : '2px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': editing ? {
                                backgroundColor: isDarkMode ? 'rgba(116, 185, 255, 0.2)' : 'rgba(116, 185, 255, 0.12)',
                                borderColor: 'rgba(116, 185, 255, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(116, 185, 255, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                backgroundColor: isDarkMode ? 'rgba(116, 185, 255, 0.25)' : 'rgba(116, 185, 255, 0.15)',
                                borderColor: '#74b9ff',
                                boxShadow: '0 0 0 3px rgba(116, 185, 255, 0.15)'
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '16px 18px',
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
                          fontWeight="medium" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Business sx={{ fontSize: 18, color: '#fdcb6e' }} />
                          Departamento
                          {!editing && (
                            <Chip size="small" label="Solo lectura" color="default" sx={{ ml: 0.5, fontSize: '0.65rem', height: 18 }} />
                          )}
                        </Typography>
                        
                        {editing ? (
                          <FormControl fullWidth disabled={!editing}>
                            <Select
                              value={formData.department}
                              onChange={(e) => handleInputChange('department', e.target.value)}
                              variant="outlined"
                              displayEmpty
                              sx={{
                                borderRadius: '24px !important',
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: editing 
                                    ? (isDarkMode ? 'rgba(253, 203, 110, 0.15)' : 'rgba(253, 203, 110, 0.08)')
                                    : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                                  border: editing 
                                    ? '2px solid rgba(253, 203, 110, 0.3)'
                                    : '2px solid rgba(0, 0, 0, 0.1)',
                                  borderRadius: '24px !important',
                                  transition: 'all 0.3s ease',
                                  '&:hover': editing ? {
                                    backgroundColor: isDarkMode ? 'rgba(253, 203, 110, 0.2)' : 'rgba(253, 203, 110, 0.12)',
                                    borderColor: 'rgba(253, 203, 110, 0.5)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(253, 203, 110, 0.2)'
                                  } : {},
                                  '&.Mui-focused': {
                                    backgroundColor: isDarkMode ? 'rgba(253, 203, 110, 0.25)' : 'rgba(253, 203, 110, 0.15)',
                                    borderColor: '#fdcb6e',
                                    boxShadow: '0 0 0 3px rgba(253, 203, 110, 0.15)'
                                  },
                                  '& fieldset': {
                                    border: 'none',
                                    borderRadius: '24px !important'
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '24px !important'
                                  }
                                },
                                '& .MuiSelect-select': {
                                  padding: '16px 18px',
                                  fontSize: '1rem',
                                  fontWeight: editing ? 500 : 400,
                                  color: editing ? 'text.primary' : 'text.secondary',
                                  borderRadius: '24px !important'
                                },
                                '& .MuiSelect-icon': {
                                  color: editing ? '#fdcb6e' : 'text.secondary'
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
                              p: 2,
                              borderRadius: 3,
                              background: isDarkMode ? 'rgba(253, 203, 110, 0.1)' : 'rgba(253, 203, 110, 0.05)',
                              border: '2px solid rgba(253, 203, 110, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Business sx={{ color: '#fdcb6e', fontSize: 20 }} />
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
                          fontWeight="medium" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Business sx={{ fontSize: 18, color: '#e17055' }} />
                          Empresa
                          {!editing && (
                            <Chip size="small" label="Solo lectura" color="default" sx={{ ml: 0.5, fontSize: '0.65rem', height: 18 }} />
                          )}
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
                                backgroundColor: editing 
                                  ? (isDarkMode ? 'rgba(225, 112, 85, 0.15)' : 'rgba(225, 112, 85, 0.08)')
                                  : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                                border: editing 
                                  ? '2px solid rgba(225, 112, 85, 0.3)'
                                  : '2px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': editing ? {
                                  backgroundColor: isDarkMode ? 'rgba(225, 112, 85, 0.2)' : 'rgba(225, 112, 85, 0.12)',
                                  borderColor: 'rgba(225, 112, 85, 0.5)',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 12px rgba(225, 112, 85, 0.2)'
                                } : {},
                                '&.Mui-focused': {
                                  backgroundColor: isDarkMode ? 'rgba(225, 112, 85, 0.25)' : 'rgba(225, 112, 85, 0.15)',
                                  borderColor: '#e17055',
                                  boxShadow: '0 0 0 3px rgba(225, 112, 85, 0.15)'
                                },
                                '& fieldset': {
                                  border: 'none'
                                }
                              },
                              '& .MuiInputBase-input': {
                                padding: '16px 18px',
                                fontSize: '1rem',
                                fontWeight: editing ? 500 : 400,
                                color: editing ? 'text.primary' : 'text.secondary'
                              }
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              background: isDarkMode ? 'rgba(225, 112, 85, 0.1)' : 'rgba(225, 112, 85, 0.05)',
                              border: '2px solid rgba(225, 112, 85, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Business sx={{ color: '#e17055', fontSize: 20 }} />
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
                          fontWeight="medium" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <LocationOn sx={{ fontSize: 18, color: '#fd79a8' }} />
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
                                ? (isDarkMode ? 'rgba(253, 121, 168, 0.15)' : 'rgba(253, 121, 168, 0.08)')
                                : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
                              border: editing 
                                ? '2px solid rgba(253, 121, 168, 0.3)'
                                : '2px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': editing ? {
                                backgroundColor: isDarkMode ? 'rgba(253, 121, 168, 0.2)' : 'rgba(253, 121, 168, 0.12)',
                                borderColor: 'rgba(253, 121, 168, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(253, 121, 168, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                backgroundColor: isDarkMode ? 'rgba(253, 121, 168, 0.25)' : 'rgba(253, 121, 168, 0.15)',
                                borderColor: '#fd79a8',
                                boxShadow: '0 0 0 3px rgba(253, 121, 168, 0.15)'
                              },
                              '& fieldset': {
                                border: 'none'
                              }
                            },
                            '& .MuiInputBase-input': {
                              padding: '16px 18px',
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
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outlined"
                              onClick={handleCancel}
                              startIcon={<Cancel />}
                              aria-label="Cancelar edición y descartar cambios"
                              sx={{
                                borderColor: 'grey.400',
                                color: 'grey.600',
                                '&:hover': {
                                  borderColor: 'grey.600',
                                  backgroundColor: 'grey.50'
                                }
                              }}
                            >
                              Cancelar
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="contained"
                              onClick={handleSave}
                              startIcon={<Save />}
                              disabled={loading || Object.keys(errors).length > 0}
                              aria-label={loading ? 'Guardando cambios del perfil' : 'Guardar cambios del perfil'}
                              sx={{
                                background: Object.keys(errors).length > 0 
                                  ? 'grey.400' 
                                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                '&:hover': {
                                  background: Object.keys(errors).length > 0 
                                    ? 'grey.400'
                                    : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                                },
                                '&:disabled': {
                                  background: 'grey.400'
                                }
                              }}
                            >
                              {loading ? (
                                <>
                                  <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                  Guardando...
                                </>
                              ) : (
                                `Guardar cambios${Object.keys(errors).length > 0 ? ' (Corrige errores)' : ''}`
                              )}
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
                        </Box>
                      </motion.div>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
                </Box>
              )}

              {/* Tab Panel - Seguridad */}
              {activeTab === 1 && (
                <Box>
                  {/* Header de Seguridad */}
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Security sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Seguridad y Privacidad
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Gestiona la seguridad de tu cuenta
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Grid container spacing={3}>
                      
                      {/* Cambiar Contraseña */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          border: '2px solid rgba(231, 76, 60, 0.2)',
                          borderRadius: 3,
                          background: isDarkMode ? 'rgba(231, 76, 60, 0.1)' : 'rgba(231, 76, 60, 0.05)'
                        }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <VpnKey sx={{ color: '#e74c3c', fontSize: 28 }} />
                              <Box>
                                <Typography variant="h6" fontWeight="bold">
                                  Contraseña
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Cambia tu contraseña de acceso
                                </Typography>
                              </Box>
                            </Box>
                            <Button
                              variant="contained"
                              onClick={() => setShowPasswordDialog(true)}
                              startIcon={<Lock />}
                              sx={{
                                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)'
                                }
                              }}
                            >
                              Cambiar Contraseña
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Cuentas Vinculadas */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ 
                          border: '2px solid rgba(52, 152, 219, 0.2)',
                          borderRadius: 3,
                          background: isDarkMode ? 'rgba(52, 152, 219, 0.1)' : 'rgba(52, 152, 219, 0.05)'
                        }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Link sx={{ color: '#3498db', fontSize: 28 }} />
                              <Box>
                                <Typography variant="h6" fontWeight="bold">
                                  Cuentas Vinculadas
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Gestiona cuentas externas
                                </Typography>
                              </Box>
                            </Box>
                            
                            <List dense>
                              {linkedAccounts.length > 0 ? linkedAccounts.map((account, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                  <ListItemIcon>
                                    {getProviderIcon(account.providerId)}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={getProviderName(account.providerId)}
                                    secondary={account.email}
                                  />
                                  {account.providerId !== 'password' && (
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        edge="end"
                                        onClick={() => handleUnlinkAccount(account.providerId)}
                                        size="small"
                                        sx={{ color: 'error.main' }}
                                      >
                                        <LinkOff />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  )}
                                </ListItem>
                              )) : (
                                <Typography variant="body2" color="text.secondary">
                                  Solo autenticación por email
                                </Typography>
                              )}
                            </List>
                            
                            <Box display="flex" gap={1} mt={2}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Google />}
                                onClick={() => handleLinkAccount('google')}
                                disabled={linkedAccounts.some(acc => acc.providerId === 'google.com')}
                              >
                                Google
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Microsoft />}
                                onClick={() => handleLinkAccount('microsoft')}
                                disabled={linkedAccounts.some(acc => acc.providerId === 'microsoft.com')}
                              >
                                Microsoft
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Historial de Actividad */}
                      <Grid item xs={12}>
                        <Card sx={{ 
                          border: '2px solid rgba(155, 89, 182, 0.2)',
                          borderRadius: 3,
                          background: isDarkMode ? 'rgba(155, 89, 182, 0.1)' : 'rgba(155, 89, 182, 0.05)'
                        }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" justify="space-between" mb={2}>
                              <Box display="flex" alignItems="center" gap={2}>
                                <History sx={{ color: '#9b59b6', fontSize: 28 }} />
                                <Box>
                                  <Typography variant="h6" fontWeight="bold">
                                    Historial de Actividad
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Últimos accesos y actividades
                                  </Typography>
                                </Box>
                              </Box>
                              {loadingHistory && <CircularProgress size={24} />}
                            </Box>
                            
                            <List>
                              {loginHistory.length > 0 ? loginHistory.slice(0, 5).map((entry, index) => (
                                <ListItem key={index} divider={index < 4}>
                                  <ListItemIcon>
                                    {getDeviceIcon(entry.userAgent)}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2" fontWeight="medium">
                                          {entry.action === 'login' ? 'Inicio de sesión' : 
                                           entry.action === 'password_change' ? 'Cambio de contraseña' : 
                                           'Actividad'}
                                        </Typography>
                                        <Chip 
                                          size="small" 
                                          label={entry.action === 'login' ? 'Login' : 'Seguridad'} 
                                          color={entry.action === 'login' ? 'success' : 'warning'}
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          {entry.timestamp?.toDate?.() ? 
                                            entry.timestamp.toDate().toLocaleString('es-ES') :
                                            new Date(entry.timestamp).toLocaleString('es-ES')
                                          }
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                          IP: {entry.ipAddress || 'Desconocida'}
                                        </Typography>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              )) : (
                                <Typography variant="body2" color="text.secondary">
                                  No hay historial disponible
                                </Typography>
                              )}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Eliminar Cuenta */}
                      <Grid item xs={12}>
                        <Card sx={{ 
                          border: '2px solid rgba(192, 57, 43, 0.3)',
                          borderRadius: 3,
                          background: isDarkMode ? 'rgba(192, 57, 43, 0.1)' : 'rgba(192, 57, 43, 0.05)'
                        }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Warning sx={{ color: '#c0392b', fontSize: 28 }} />
                              <Box>
                                <Typography variant="h6" fontWeight="bold" color="error">
                                  Zona de Peligro
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Acciones irreversibles
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              Eliminar tu cuenta es una acción permanente. Todos tus datos serán eliminados 
                              y no podrán ser recuperados.
                            </Alert>
                            
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => setShowDeleteDialog(true)}
                              startIcon={<DeleteForever />}
                              sx={{
                                background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #a93226 0%, #922b21 100%)'
                                }
                              }}
                            >
                              Eliminar Cuenta Permanentemente
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>

                    </Grid>
                  </CardContent>
                </Box>
              )}
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
            <VpnKey sx={{ color: '#e74c3c' }} />
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

      {/* Dialog para eliminar cuenta */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Warning sx={{ color: '#c0392b' }} />
            Eliminar Cuenta Permanentemente
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              Esta acción es irreversible
            </Typography>
            <Typography variant="body2">
              Se eliminarán permanentemente:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>Tu perfil de usuario</li>
              <li>Historial de actividad</li>
              <li>Datos personales</li>
              <li>Acceso a todas las funcionalidades</li>
            </Box>
          </Alert>
          
          <DialogContentText>
            Para confirmar la eliminación, escribe <strong>ELIMINAR</strong> en el campo de abajo:
          </DialogContentText>
          
          <TextField
            fullWidth
            placeholder="Escribe ELIMINAR para confirmar"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            disabled={loadingDelete}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={loadingDelete}
            startIcon={loadingDelete ? <CircularProgress size={16} /> : <DeleteForever />}
            sx={{
              background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #a93226 0%, #922b21 100%)'
              }
            }}
          >
            {loadingDelete ? 'Eliminando...' : 'Eliminar Cuenta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ProfilePage;
