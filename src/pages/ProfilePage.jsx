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
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Snackbar,
  Slide
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
  LocationOn
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfilePage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false);
  const fileInputRef = useRef(null);

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
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: 'success' }), 5000);
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

      {/* Header - Optimizado y compacto */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          sx={{
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            borderRadius: 3,
            boxShadow: `0 6px 20px ${theme.palette.primary.main}40`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Elemento decorativo simplificado */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)'
            }}
          />
          
          <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Mi Perfil
                  {autoSaving && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ marginLeft: 8 }}
                    >
                      <Chip 
                        size="small" 
                        label="Guardando..." 
                        icon={<CircularProgress size={12} sx={{ color: 'white !important' }} />}
                        sx={{ 
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }} 
                      />
                    </motion.span>
                  )}
                  {hasUnsavedChanges && !autoSaving && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ marginLeft: 8 }}
                    >
                      <Chip 
                        size="small" 
                        label="Sin guardar" 
                        sx={{ 
                          background: 'rgba(255, 193, 7, 0.9)',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }} 
                      />
                    </motion.span>
                  )}
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Completado:
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: 8, 
                    px: 1.5, 
                    py: 0.5,
                    minWidth: 50,
                    textAlign: 'center'
                  }}>
                    <Typography variant="caption" fontWeight="bold">
                      {Math.round(
                        (Object.values(formData).filter(val => val && val.trim()).length / 
                         Object.keys(formData).length) * 100
                      )}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Botón de Editar Perfil */}
              {!editing && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => setEditing(true)}
                    startIcon={<Edit />}
                    aria-label="Activar modo de edición del perfil"
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      px: 2,
                      py: 0.75,
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.35)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
                    Editar Perfil
                  </Button>
                </motion.div>
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      <Grid container spacing={3}>
        {/* Columna izquierda - Foto y datos básicos */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
              mb: 2
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
              
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                {/* Avatar con anillo completo animado */}
                <Box position="relative" display="inline-block" mb={3}>
                  {/* Anillo exterior completo con gradiente animado */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{
                      position: 'absolute',
                      inset: -12,
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
                        width: 120, 
                        height: 120,
                        fontSize: 48,
                        mx: 'auto',
                        border: '4px solid',
                        borderColor: 'background.paper',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
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
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          bgcolor: '#ff6b6b',
                          color: 'white',
                          width: 36,
                          height: 36,
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
                    </motion.div>
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
                <Box mb={3}>
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
                  
                  {/* Badges de rol y estado */}
                  <Box display="flex" gap={1} justifyContent="center" mb={2}>
                    <Box 
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {formData.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </Box>
                    <Box 
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 20,
                        background: user?.emailVerified 
                          ? 'linear-gradient(135deg, #00b894 0%, #00a085 100%)'
                          : 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {user?.emailVerified ? 'Activo' : 'Pendiente'}
                    </Box>
                  </Box>

                  {/* Información adicional */}
                  {formData.position && (
                    <Typography variant="body2" fontWeight="medium" color="text.primary">
                      {formData.position}
                    </Typography>
                  )}
                  {formData.department && (
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
                        Idioma
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Español
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Columna derecha - Formulario */}
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
              overflow: 'hidden'
            }}>
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
              
              <CardContent sx={{ p: 3 }}>

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
                              transition: 'all 0.3s ease',
                              '&:hover': editing ? {
                                backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.12)',
                                borderColor: 'rgba(102, 126, 234, 0.5)',
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                              } : {},
                              '&.Mui-focused': {
                                backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.25)' : 'rgba(102, 126, 234, 0.15)',
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.15)'
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

                  {/* Departamento */}
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
                        </Typography>
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
                      </Box>
                    </motion.div>
                  </Grid>

                  {/* Empresa */}
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
                        </Typography>
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
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};
export default ProfilePage;
