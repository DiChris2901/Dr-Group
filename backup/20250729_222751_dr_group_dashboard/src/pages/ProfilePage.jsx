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
  LocationOn,
  CalendarToday
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
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
      showAlert('Por favor selecciona un archivo de imagen válido', 'error');
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
      
      // Subir archivo
      const snapshot = await uploadBytes(imageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Actualizar perfil con nueva foto
      await updateUserProfile({ photoURL: downloadURL });
      
      showAlert('Foto de perfil actualizada exitosamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showAlert('Error al subir la foto. Inténtalo de nuevo.', 'error');
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
      console.error('Error updating profile:', error);
      showAlert('Error al actualizar el perfil. Inténtalo de nuevo.', 'error');
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Alert */}
      {alert.open && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 3 }}
          onClose={() => setAlert({ open: false, message: '', severity: 'success' })}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">
            Mi Perfil
          </Typography>
          
          {!editing ? (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
            >
              Editar Perfil
            </Button>
          ) : (
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSave}
                disabled={loading}
              >
                Guardar
              </Button>
            </Box>
          )}
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Foto de perfil y datos básicos */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box position="relative" display="inline-block" mb={3}>
                  <Avatar
                    src={userProfile?.photoURL}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto',
                      border: 4,
                      borderColor: 'primary.main'
                    }}
                  >
                    {formData.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </Avatar>
                  
                  {editing && (
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <PhotoCamera />
                      )}
                    </IconButton>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </Box>

                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {formData.name || 'Usuario'}
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {formData.email}
                </Typography>

                <Chip 
                  label={formData.role === 'admin' ? 'Administrador' : 'Usuario'} 
                  color={formData.role === 'admin' ? 'primary' : 'default'}
                  size="small"
                />

                {formData.position && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    {formData.position}
                  </Typography>
                )}

                {formData.department && (
                  <Typography variant="body2" color="text.secondary">
                    {formData.department}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Información detallada */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                  <Person sx={{ mr: 1 }} />
                  Información Personal
                </Typography>
                
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  {/* Nombre completo */}
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

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Correo electrónico"
                      value={formData.email}
                      disabled={true} // Email no editable
                      variant="filled"
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  {/* Teléfono */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  {/* Cargo */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cargo"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                    />
                  </Grid>

                  {/* Departamento */}
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

                  {/* Empresa */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Empresa"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  {/* Ubicación */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  {/* Biografía */}
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
                </Grid>

                {/* Información de cuenta */}
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }} display="flex" alignItems="center">
                  <CalendarToday sx={{ mr: 1 }} />
                  Información de la Cuenta
                </Typography>
                
                <Divider sx={{ mb: 3 }} />

                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de registro
                      </Typography>
                      <Typography variant="body1">
                        {user?.metadata?.creationTime ? 
                          new Date(user.metadata.creationTime).toLocaleDateString('es-ES') : 
                          'No disponible'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Último acceso
                      </Typography>
                      <Typography variant="body1">
                        {user?.metadata?.lastSignInTime ? 
                          new Date(user.metadata.lastSignInTime).toLocaleDateString('es-ES') : 
                          'No disponible'
                        }
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
