import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  IconButton,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Close,
  Email,
  Telegram,
  Notifications,
  Settings,
  CheckCircle,
  Send
} from '@mui/icons-material';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';

const NotificationSettingsModal = ({ open, onClose, user }) => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { sendTestNotification, isLoading: emailLoading } = useEmailNotifications();
  
  const [settings, setSettings] = useState({
    emailEnabled: true,
    telegramEnabled: false,
    telegramChatId: '',
    userCreated: false,
    userUpdated: false,
    roleChanged: false,
    commitments15Days: false,
    commitments7Days: false,
    commitments2Days: false,
    commitmentsDueToday: false,
    newCommitments: false,
    automaticEvents: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return;
      
      try {
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.id);
        const userData = await getDoc(userDoc);
        
        if (userData.exists() && userData.data().notificationSettings) {
          setSettings(prev => ({
            ...prev,
            ...userData.data().notificationSettings
          }));
        }
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    };
    
    if (open && user) {
      loadUserSettings();
      setError('');
      setSuccess(false);
    }
  }, [user, open]);

  const handleCheckboxChange = (field) => (event) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    if (settings.telegramEnabled && !settings.telegramChatId) {
      setError('Por favor ingresa tu Chat ID de Telegram');
      return;
    }

    if (!settings.emailEnabled && !settings.telegramEnabled) {
      setError('Debes activar al menos un canal de notificación');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.id);
      
      await updateDoc(userDocRef, {
        notificationSettings: settings,
        updatedAt: new Date()
      });
      
      setSuccess(true);
      addNotification({
        type: 'success',
        title: 'Configuración Guardada',
        message: `Notificaciones configuradas para ${user.displayName || user.email}`,
        icon: 'notifications'
      });
      
      setTimeout(() => onClose(), 2000);
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setError('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async (channel) => {
    if (channel === 'email') {
      try {
        addNotification({
          type: 'info',
          title: 'Enviando Prueba',
          message: 'Enviando correo de prueba...',
          icon: 'email'
        });

        await sendTestNotification({
          userEmail: user?.email || currentUser?.email || 'test@drgroup.com',
          userName: user?.displayName || user?.name || 'Usuario de Prueba',
          testType: 'email_config'
        });

        // Verificar si fue modo demo o real
        const isDemoMode = !import.meta.env.VITE_EMAILJS_SERVICE_ID || 
                          import.meta.env.VITE_EMAILJS_SERVICE_ID === 'tu-service-id-aqui';
        
        addNotification({
          type: 'success',
          title: isDemoMode ? '🎭 Demo - Email Simulado' : '✅ Email Enviado',
          message: isDemoMode 
            ? 'Email simulado enviado (configura EmailJS para envío real)'
            : 'El correo de prueba fue enviado correctamente',
          icon: 'email'
        });
      } catch (error) {
        console.error('Error enviando email de prueba:', error);
        addNotification({
          type: 'error',
          title: '❌ Error en Email',
          message: error.message || 'Error al enviar el correo de prueba',
          icon: 'email'
        });
      }
    } else if (channel === 'telegram') {
      addNotification({
        type: 'info',
        title: 'Telegram en Desarrollo',
        message: 'La integración con Telegram está en desarrollo...',
        icon: 'telegram'
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications color="primary" />
          <Typography variant="h6">
            Configuración de Notificaciones - Email + Telegram
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✅ Configuración guardada exitosamente
          </Alert>
        )}

        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Configurando para:
          </Typography>
          <Typography variant="h6">
            {user?.displayName || user?.email || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Settings fontSize="small" />
          Canales de Notificación
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              border: settings.emailEnabled ? '2px solid #1976d2' : '1px solid #e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
            onClick={() => setSettings(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Email sx={{ fontSize: 40, color: settings.emailEnabled ? '#1976d2' : '#9e9e9e', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Email</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  📧 Formal • Registro permanente
                </Typography>
                <Chip 
                  label={settings.emailEnabled ? "✅ Activado" : "⭕ Desactivado"}
                  color={settings.emailEnabled ? "primary" : "default"}
                  size="small"
                />
                {settings.emailEnabled && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestNotification('email');
                      }}
                      disabled={emailLoading}
                    >
                      {emailLoading ? 'Enviando...' : 'Prueba'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              border: settings.telegramEnabled ? '2px solid #0088cc' : '1px solid #e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
            }}
            onClick={() => setSettings(prev => ({ ...prev, telegramEnabled: !prev.telegramEnabled }))}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Telegram sx={{ fontSize: 40, color: settings.telegramEnabled ? '#0088cc' : '#9e9e9e', mb: 1 }} />
                <Typography variant="h6" gutterBottom>Telegram</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  🚀 Instantáneo • Siempre visible
                </Typography>
                <Chip 
                  label={settings.telegramEnabled ? "✅ Activado" : "⭕ Desactivado"}
                  color={settings.telegramEnabled ? "info" : "default"}
                  size="small"
                />
                {settings.telegramEnabled && settings.telegramChatId && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestNotification('telegram');
                      }}
                    >
                      Prueba
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {settings.telegramEnabled && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f8ff', borderRadius: 1, border: '1px solid #0088cc' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Telegram fontSize="small" color="info" />
              Configuración de Telegram
            </Typography>
            <TextField
              fullWidth
              label="Chat ID o @username"
              value={settings.telegramChatId}
              onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
              placeholder="@usuario o 123456789"
              helperText="Tu Chat ID de Telegram. Busca @drgroup_bot y envía /start para obtenerlo."
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            
            <Alert severity="info" sx={{ mt: 1 }}>
              💡 <strong>¿Cómo obtener tu Chat ID?</strong><br/>
              1. Busca @drgroup_bot en Telegram<br/>
              2. Envía /start<br/>
              3. Copia el Chat ID que te envíe
            </Alert>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications fontSize="small" />
          Tipos de Notificaciones
        </Typography>

        <FormGroup>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
            👥 Gestión de Usuarios:
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={settings.userCreated} onChange={handleCheckboxChange('userCreated')} color="success" />}
            label="Cuando se crea un nuevo usuario"
          />
          <FormControlLabel
            control={<Checkbox checked={settings.userUpdated} onChange={handleCheckboxChange('userUpdated')} color="primary" />}
            label="Cuando se actualiza información del usuario"
          />
          <FormControlLabel
            control={<Checkbox checked={settings.roleChanged} onChange={handleCheckboxChange('roleChanged')} color="warning" />}
            label="Cuando cambian roles o permisos"
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            📅 Compromisos Próximos a Vencer:
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={settings.commitments15Days} onChange={handleCheckboxChange('commitments15Days')} color="primary" />}
            label="15 días antes del vencimiento"
          />
          <FormControlLabel
            control={<Checkbox checked={settings.commitments7Days} onChange={handleCheckboxChange('commitments7Days')} color="primary" />}
            label="1 semana antes del vencimiento"
          />
          <FormControlLabel
            control={<Checkbox checked={settings.commitments2Days} onChange={handleCheckboxChange('commitments2Days')} color="warning" />}
            label="2 días antes del vencimiento"
          />
          <FormControlLabel
            control={<Checkbox checked={settings.commitmentsDueToday} onChange={handleCheckboxChange('commitmentsDueToday')} color="error" />}
            label="El día del vencimiento"
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
            📝 Otros:
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={settings.newCommitments} onChange={handleCheckboxChange('newCommitments')} color="success" />}
            label="Nuevos compromisos agregados"
          />
          <FormControlLabel
            control={<Checkbox checked={settings.automaticEvents} onChange={handleCheckboxChange('automaticEvents')} color="info" />}
            label="Eventos automáticos (Coljuegos, Parafiscales, UIAF)"
          />
        </FormGroup>

        <Alert severity="info" sx={{ mt: 2 }}>
          📱 Las notificaciones se envían a las 9:00 AM (Colombia) solo en días hábiles.
        </Alert>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>📊 Resumen:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {settings.emailEnabled && <Chip label="📧 Email" color="primary" size="small" />}
            {settings.telegramEnabled && <Chip label="🤖 Telegram" color="info" size="small" />}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || (!settings.emailEnabled && !settings.telegramEnabled)}
          startIcon={loading ? <CheckCircle /> : <Settings />}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettingsModal;