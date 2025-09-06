import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTheme } from '@mui/material/styles';

const SystemSettingsPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Configuración de la aplicación
    appName: 'DR Group Dashboard',
    appVersion: '1.0.0',
    maintenanceMode: false,
    allowRegistration: false,
    sessionTimeout: 30, // minutos
    maxFileSize: 10, // MB
    
    // Configuración de base de datos
    backupFrequency: 'daily',
    retentionPeriod: 90, // días
    
    // Configuración de notificaciones
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    
    // Configuración de seguridad
    requireTwoFactor: false,
    passwordMinLength: 8,
    passwordExpiration: 90, // días
    maxLoginAttempts: 5,
    
    // Configuración de rendimiento
    cacheDuration: 300, // segundos
    compressionEnabled: true,
    lazyLoadingEnabled: true
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'systemConfig', 'general');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings({ ...settings, ...settingsSnap.data() });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const settingsRef = doc(db, 'systemConfig', 'general');
      
      await setDoc(settingsRef, {
        ...settings,
        lastUpdated: new Date(),
        updatedBy: sessionStorage.getItem('systemCenterUser')
      }, { merge: true });
      
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SettingsIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Configuración General del Sistema
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Administra los parámetros globales del sistema
          </Typography>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Configuración de Aplicación */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  Configuración de Aplicación
                  <Chip label="Básico" size="small" sx={{ ml: 1 }} />
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Nombre de la Aplicación"
                    value={settings.appName}
                    onChange={(e) => handleSettingChange('appName', e.target.value)}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Versión"
                    value={settings.appVersion}
                    onChange={(e) => handleSettingChange('appVersion', e.target.value)}
                    size="small"
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    />
                  }
                  label="Modo de Mantenimiento"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistration}
                      onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                    />
                  }
                  label="Permitir Registro de Usuarios"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Configuración de Seguridad */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  Configuración de Seguridad
                  <Chip label="Crítico" size="small" color="error" sx={{ ml: 1 }} />
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tiempo de Sesión (minutos)"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Longitud Mínima de Contraseña"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Máximo de Intentos de Login"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                    size="small"
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireTwoFactor}
                      onChange={(e) => handleSettingChange('requireTwoFactor', e.target.checked)}
                    />
                  }
                  label="Requerir Autenticación de Dos Factores"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Configuración de Notificaciones */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Configuración de Notificaciones
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Notificaciones por Email"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  }
                  label="Notificaciones Push"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    />
                  }
                  label="Notificaciones SMS"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Configuración de Rendimiento */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Configuración de Rendimiento
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duración de Caché (segundos)"
                    value={settings.cacheDuration}
                    onChange={(e) => handleSettingChange('cacheDuration', parseInt(e.target.value))}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tamaño Máximo de Archivo (MB)"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    size="small"
                  />
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.compressionEnabled}
                      onChange={(e) => handleSettingChange('compressionEnabled', e.target.checked)}
                    />
                  }
                  label="Compresión Habilitada"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.lazyLoadingEnabled}
                      onChange={(e) => handleSettingChange('lazyLoadingEnabled', e.target.checked)}
                    />
                  }
                  label="Carga Diferida Habilitada"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Botones de Acción */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={loadSettings}
          startIcon={<RefreshIcon />}
          disabled={saving}
        >
          Recargar
        </Button>
        <Button
          variant="contained"
          onClick={saveSettings}
          startIcon={<SaveIcon />}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </Box>
    </Box>
  );
};

export default SystemSettingsPage;
