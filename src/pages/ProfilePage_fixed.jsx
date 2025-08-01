import React, { useState, useRef } from 'react';
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
  Divider,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  BusinessCenter,
  Verified,
  AccessTime,
  TrendingUp,
  LocationOn,
  CalendarToday,
  Assignment,
  Notifications,
  Palette,
  Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
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

  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert({ open: false, message: '', severity: 'success' }), 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showAlert('Por favor selecciona una imagen válida', 'error');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('La imagen debe ser menor a 5MB', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Crear referencia única para la imagen
      const imageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      
      // Subir imagen
      await uploadBytes(imageRef, file);
      const photoURL = await getDownloadURL(imageRef);

      // Actualizar perfil del usuario
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
    setLoading(true);
    try {
      await updateUserProfile(formData);
      setEditing(false);
      showAlert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      showAlert('Error al guardar los cambios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Alert */}
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
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {alert.message}
          </Alert>
        </motion.div>
      )}

      {/* Header con efectos cinematográficos */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box 
          sx={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #f472b6 100%)',
            borderRadius: '24px',
            p: 4,
            mb: 4,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 20px 50px rgba(79, 70, 229, 0.3)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transition: 'left 0.6s ease',
            },
            '&:hover::before': {
              left: '100%',
            }
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Mi Perfil
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Gestiona tu información personal y profesional
              </Typography>
            </Box>
            <Person sx={{ fontSize: 80, opacity: 0.3 }} />
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Columna izquierda - Foto de perfil */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -8 }}
          >
            <Card sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(249, 115, 22, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(249, 115, 22, 0.12) 100%)',
              borderRadius: '24px',
              border: `1px solid ${isDarkMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}`,
              backdropFilter: 'blur(30px)',
              height: '100%',
              boxShadow: isDarkMode 
                ? '0 8px 32px rgba(236, 72, 153, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                : '0 8px 32px rgba(236, 72, 153, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px) rotateY(2deg)',
                boxShadow: isDarkMode 
                  ? '0 16px 48px rgba(236, 72, 153, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 16px 48px rgba(236, 72, 153, 0.12), 0 0 0 1px rgba(255, 255, 255, 1)',
              }
            }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #ec4899, #f97316)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
                    }}
                  >
                    <Person sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Perfil Personal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Información básica
                    </Typography>
                  </Box>
                </Box>

                {/* Foto de perfil con efectos avanzados */}
                <Box position="relative" display="inline-block" mb={3}>
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      rotate: [0, -1, 1, 0],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box
                      sx={{
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899, #f97316, #f59e0b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: '4px',
                        boxShadow: '0 8px 32px rgba(236, 72, 153, 0.4), 0 0 20px rgba(249, 115, 22, 0.2)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: -3,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ec4899, #f97316, #f59e0b, #ec4899)',
                          zIndex: -1,
                          animation: 'breathe 3s ease-in-out infinite, rotate 20s linear infinite'
                        },
                        '@keyframes breathe': {
                          '0%, 100%': {
                            transform: 'scale(1)',
                            opacity: 0.8
                          },
                          '50%': {
                            transform: 'scale(1.05)',
                            opacity: 1
                          }
                        },
                        '@keyframes rotate': {
                          '0%': {
                            transform: 'rotate(0deg)'
                          },
                          '100%': {
                            transform: 'rotate(360deg)'
                          }
                        }
                      }}
                    >
                      <Avatar
                        src={userProfile?.photoURL}
                        sx={{ 
                          width: 152, 
                          height: 152,
                          border: '2px solid white',
                          fontSize: 60
                        }}
                      >
                        {!userProfile?.photoURL && formData.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </Box>
                  </motion.div>
                  
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
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'primary.main',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          '&:hover': { 
                            bgcolor: 'primary.dark',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <PhotoCamera />
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

                {/* Información del usuario */}
                <Box>
                  <Typography variant="h5" fontWeight="bold" mb={1}>
                    {formData.name || 'Usuario'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {formData.email}
                  </Typography>
                  
                  {formData.position && (
                    <Chip
                      label={formData.position}
                      sx={{
                        mb: 2,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        fontWeight: 'medium'
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Columna derecha - Formulario */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -8 }}
          >
            <Card sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(124, 58, 237, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(124, 58, 237, 0.12) 100%)',
              borderRadius: '24px',
              border: `1px solid ${isDarkMode ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.2)'}`,
              backdropFilter: 'blur(30px)',
              height: '100%',
              boxShadow: isDarkMode 
                ? '0 8px 32px rgba(79, 70, 229, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                : '0 8px 32px rgba(79, 70, 229, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px) rotateX(2deg)',
                boxShadow: isDarkMode 
                  ? '0 16px 48px rgba(79, 70, 229, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  : '0 16px 48px rgba(79, 70, 229, 0.12), 0 0 0 1px rgba(255, 255, 255, 1)',
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    <Person sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Información Personal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Datos personales y profesionales
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ 
                  mb: 3,
                  background: isDarkMode 
                    ? 'linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.5), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.3), transparent)',
                  height: '2px',
                  border: 'none'
                }} />

                <Grid container spacing={3}>
                  {/* Campos del formulario */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Correo electrónico"
                      value={formData.email}
                      disabled={true}
                      variant="filled"
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: '#4f46e5' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: '#7c3aed' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cargo"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <Work sx={{ mr: 1, color: '#059669' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Departamento</InputLabel>
                      <Select
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        variant={editing ? 'outlined' : 'filled'}
                      >
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
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Empresa"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <Business sx={{ mr: 1, color: '#dc2626' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: '#3b82f6' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Biografía"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      multiline
                      rows={3}
                      placeholder="Cuéntanos un poco sobre ti..."
                    />
                  </Grid>

                  {/* Botones de acción */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      {editing ? (
                        <>
                          <Button
                            variant="outlined"
                            onClick={handleCancel}
                            startIcon={<Cancel />}
                            sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSave}
                            startIcon={<Save />}
                            disabled={loading}
                            sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
                          >
                            {loading ? 'Guardando...' : 'Guardar cambios'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => setEditing(true)}
                          startIcon={<Edit />}
                          sx={{ borderRadius: '12px', px: 3, py: 1.5 }}
                        >
                          Editar perfil
                        </Button>
                      )}
                    </Box>
                  </Grid>
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
