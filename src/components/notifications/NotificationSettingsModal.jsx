import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  IconButton,
  Divider,
  Paper,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Telegram as TelegramIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';
import { useTelegramNotifications } from '../../hooks/useTelegramNotifications';

const NotificationSettingsModal = ({ open, onClose, user }) => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { sendTestNotification, isLoading: emailLoading } = useEmailNotifications();
  const { 
    sendTestNotification: sendTelegramTest, 
    verifyChatId,
    sending: telegramSending 
  } = useTelegramNotifications();
  const theme = useTheme();
  
  const [settings, setSettings] = useState({
    notificationChannel: 'email', // 'email' o 'telegram'
    emailEnabled: true,
    telegramEnabled: false,
    telegramChatId: '',
    customEventsEnabled: true, // Eventos personalizados del calendario
    coljuegosEnabled: true, // Décimo día hábil
    uiafEnabled: true, // Día 10
    parafiscalesEnabled: true // Tercer día hábil
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showChatIdInstructions, setShowChatIdInstructions] = useState(false);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return;
      
      try {
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.id);
        const userData = await getDoc(userDoc);
        
        if (userData.exists() && userData.data().notificationSettings) {
          const userSettings = userData.data().notificationSettings;
          
          // Determinar el canal activo
          let channel = 'email';
          if (userSettings.telegramEnabled && userSettings.telegramChatId) {
            channel = 'telegram';
          } else if (userSettings.emailEnabled) {
            channel = 'email';
          }
          
          setSettings({
            notificationChannel: channel,
            emailEnabled: channel === 'email',
            telegramEnabled: channel === 'telegram',
            telegramChatId: userSettings.telegramChatId || '',
            customEventsEnabled: userSettings.customEventsEnabled !== undefined 
              ? userSettings.customEventsEnabled 
              : true,
            coljuegosEnabled: userSettings.coljuegosEnabled !== undefined 
              ? userSettings.coljuegosEnabled 
              : true,
            uiafEnabled: userSettings.uiafEnabled !== undefined 
              ? userSettings.uiafEnabled 
              : true,
            parafiscalesEnabled: userSettings.parafiscalesEnabled !== undefined 
              ? userSettings.parafiscalesEnabled 
              : true
          });
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

  const handleChannelChange = (event, newChannel) => {
    if (!newChannel) return; // Siempre debe haber un canal seleccionado
    
    setSettings(prev => ({
      ...prev,
      notificationChannel: newChannel,
      emailEnabled: newChannel === 'email',
      telegramEnabled: newChannel === 'telegram'
    }));
  };

  const handleCustomEventsToggle = (event) => {
    setSettings(prev => ({
      ...prev,
      customEventsEnabled: event.target.checked
    }));
  };

  const handleShowInstructions = () => {
    setShowChatIdInstructions(!showChatIdInstructions);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    if (settings.telegramEnabled && !settings.telegramChatId) {
      setError('Por favor ingresa tu Chat ID de Telegram');
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
          message: 'Enviando correo de prueba...'
        });
        
        await sendTestNotification(user.email, user.displayName);
        
        addNotification({
          type: 'success',
          title: 'Correo Enviado',
          message: 'Revisa tu bandeja de entrada'
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message
        });
      }
    } else if (channel === 'telegram') {
      if (!settings.telegramChatId) {
        setError('Por favor ingresa tu Chat ID primero');
        return;
      }
      
      try {
        addNotification({
          type: 'info',
          title: 'Enviando Prueba',
          message: 'Enviando mensaje a Telegram...'
        });
        
        const isValid = await verifyChatId(settings.telegramChatId);
        
        if (isValid) {
          await sendTelegramTest(settings.telegramChatId, user.displayName);
          
          addNotification({
            type: 'success',
            title: 'Mensaje Enviado',
            message: 'Revisa tu chat de Telegram'
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Chat ID Inválido',
            message: 'Verifica tu Chat ID'
          });
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message
        });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: 'white'
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon />
          <Typography variant="h6" fontWeight={600}>
            Configuración de Notificaciones
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
            ✅ Configuración guardada exitosamente
          </Alert>
        )}

        {/* Canal de Notificación */}
        <Paper elevation={0} sx={{ 
          p: 2.5, 
          mt: 2,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            📢 Canal de Notificación
          </Typography>
          
          <ToggleButtonGroup
            value={settings.notificationChannel}
            exclusive
            onChange={handleChannelChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="email" sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon />
                <Typography variant="body2" fontWeight={500}>
                  Email
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="telegram" sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <TelegramIcon />
                <Typography variant="body2" fontWeight={500}>
                  Telegram
                </Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Selecciona el canal donde recibirás las notificaciones automáticas del sistema
          </Typography>

          {/* Configuración Email */}
          {settings.notificationChannel === 'email' && (
            <Box>
              <Alert severity="info" icon={<EmailIcon />} sx={{ mb: 1.5 }}>
                Recibirás notificaciones en: <strong>{user?.email}</strong>
              </Alert>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleTestNotification('email')}
                disabled={emailLoading}
                startIcon={<EmailIcon />}
                sx={{ borderRadius: 1 }}
              >
                {emailLoading ? 'Enviando...' : 'Enviar Prueba a Email'}
              </Button>
            </Box>
          )}

          {/* Configuración Telegram */}
          {settings.notificationChannel === 'telegram' && (
            <Box>
              <TextField
                fullWidth
                label="Chat ID de Telegram"
                value={settings.telegramChatId}
                onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                placeholder="Ej: 123456789"
                variant="outlined"
                size="small"
                sx={{ mb: 1.5 }}
                helperText={
                  <Typography 
                    variant="caption" 
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={handleShowInstructions}
                  >
                    {showChatIdInstructions ? '▼ Ocultar instrucciones' : '▶ ¿Cómo obtener mi Chat ID?'}
                  </Typography>
                }
              />

              {showChatIdInstructions && (
                <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                  <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                    <strong>Pasos para obtener tu Chat ID:</strong>
                  </Typography>
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Abre Telegram y busca el bot: <strong>@userinfobot</strong></li>
                    <li>Inicia conversación con /start</li>
                    <li>El bot te enviará tu Chat ID (número)</li>
                    <li>Copia y pega ese número aquí</li>
                  </ol>
                </Alert>
              )}
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleTestNotification('telegram')}
                disabled={telegramSending || !settings.telegramChatId}
                startIcon={<TelegramIcon />}
                sx={{ borderRadius: 1 }}
              >
                {telegramSending ? 'Enviando...' : 'Enviar Prueba a Telegram'}
              </Button>
            </Box>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Configuración de Eventos */}
        <Paper elevation={0} sx={{ 
          p: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.secondary.main, 0.02)
        }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            🗓️ Eventos a Notificar
          </Typography>

          {/* Eventos Gubernamentales */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontWeight: 600 }}>
              EVENTOS GUBERNAMENTALES
            </Typography>
            
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  🏛️ Coljuegos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Décimo día hábil de cada mes
                </Typography>
              </Box>
              <Switch
                checked={settings.coljuegosEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, coljuegosEnabled: e.target.checked }))}
                color="primary"
                size="small"
              />
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  📊 UIAF
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Día 10 de cada mes
                </Typography>
              </Box>
              <Switch
                checked={settings.uiafEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, uiafEnabled: e.target.checked }))}
                color="primary"
                size="small"
              />
            </Box>

            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  💼 Parafiscales
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tercer día hábil de cada mes
                </Typography>
              </Box>
              <Switch
                checked={settings.parafiscalesEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, parafiscalesEnabled: e.target.checked }))}
                color="primary"
                size="small"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Eventos Personalizados */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontWeight: 600 }}>
              EVENTOS PERSONALIZADOS
            </Typography>
            
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  📅 Eventos del Calendario
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Eventos que tú creas manualmente
                </Typography>
              </Box>
              <Switch
                checked={settings.customEventsEnabled}
                onChange={handleCustomEventsToggle}
                color="secondary"
                size="small"
              />
            </Box>
          </Box>
        </Paper>

        {/* Información sobre notificaciones automáticas */}
        <Alert severity="info" icon={<CheckCircleIcon />} sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            ℹ️ Notificaciones de Contratos
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary">
            Los contratos próximos a vencer se notifican automáticamente con 8 alertas progresivas (6 meses, 3 meses, 2 meses, 1 mes, 15 días, 1 semana, 3 días y el día del vencimiento).
          </Typography>
        </Alert>

        <Alert severity="info" icon={<NotificationsIcon />} sx={{ mt: 2 }}>
          📱 Las notificaciones se envían a las 9:00 AM (Colombia) solo en días hábiles.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CheckCircleIcon /> : <SettingsIcon />}
        >
          {loading ? 'Guardando...' : '⚙️ Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettingsModal;
