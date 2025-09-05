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
  Divider
} from '@mui/material';
import {
  Close,
  WhatsApp,
  Notifications,
  Settings
} from '@mui/icons-material';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

const NotificationSettingsModal = ({ open, onClose, user }) => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const [settings, setSettings] = useState({
    phoneNumber: '',
    // Compromisos próximos a vencer
    commitments15Days: false,
    commitments7Days: false,
    commitments2Days: false,
    commitmentsDueToday: false,
    // Nuevos compromisos
    newCommitments: false,
    // Eventos automáticos
    automaticEvents: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [templateSending, setTemplateSending] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [templateTest, setTemplateTest] = useState({
    contentSid: '',
    variables: JSON.stringify({ company: 'DR Group', user: user?.displayName || user?.email || 'Usuario' })
  });

  // Cargar configuración actual del usuario
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.id) return;
      
      try {
        // Limpiar settings previos
        setSettings({
          phoneNumber: '',
          commitments15Days: false,
          commitments7Days: false,
          commitments2Days: false,
          commitmentsDueToday: false,
          newCommitments: false,
          automaticEvents: false
        });
        
        const db = getFirestore();
        const userDoc = await doc(db, 'users', user.id);
        const userData = await getDoc(userDoc);
        
        if (userData.exists() && userData.data().notificationSettings) {
          console.log('📱 Cargando configuración de notificaciones para:', user.email);
          console.log('🔧 Configuración encontrada:', userData.data().notificationSettings);
          
          setSettings(prev => ({
            ...prev,
            ...userData.data().notificationSettings
          }));
        } else {
          console.log('📱 No hay configuración de notificaciones para:', user.email);
        }
      } catch (error) {
        console.error('❌ Error cargando configuración:', error);
      }
    };
    
    if (open && user) {
      loadUserSettings();
    }
  }, [user, open]);

  // Validar número telefónico colombiano
  const validatePhoneNumber = (phone) => {
    // Formato: +57XXXXXXXXXX (10 dígitos después del +57)
    const colombianPhoneRegex = /^\+57[3][0-9]{9}$/;
    return colombianPhoneRegex.test(phone);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Auto-formatear número
    if (value && !value.startsWith('+57')) {
      if (value.startsWith('57')) {
        value = '+' + value;
      } else if (value.startsWith('3')) {
        value = '+57' + value;
      } else {
        value = '+57' + value;
      }
    }
    
    setSettings(prev => ({ ...prev, phoneNumber: value }));
    setError('');
  };

  const handleCheckboxChange = (field) => (e) => {
    setSettings(prev => ({
      ...prev,
      [field]: e.target.checked
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Validar número si está presente
      if (settings.phoneNumber && !validatePhoneNumber(settings.phoneNumber)) {
        throw new Error('Número de teléfono inválido. Formato: +57XXXXXXXXXX');
      }

      // Si hay notificaciones habilitadas, el número es obligatorio
      const hasNotificationsEnabled = Object.values(settings).some((value, index) => 
        index > 0 && value === true // Excluir phoneNumber del check
      );

      if (hasNotificationsEnabled && !settings.phoneNumber) {
        throw new Error('Número de teléfono es obligatorio para recibir notificaciones');
      }

      const db = getFirestore();
      const userRef = doc(db, 'users', user.id);

      await updateDoc(userRef, {
        notificationSettings: settings
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error guardando configuración:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!settings.phoneNumber || !validatePhoneNumber(settings.phoneNumber)) {
      setError('Ingresa un número válido para probar');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🚀 Iniciando prueba de WhatsApp...');
      console.log('📱 Número:', settings.phoneNumber);
      console.log('👤 Usuario:', user?.email);
      
      // Inicializar Firebase Functions
      const functions = getFunctions();
      console.log('⚡ Functions inicializadas:', !!functions);
      
      const testFunction = httpsCallable(functions, 'testWhatsAppNotification');
      console.log('🔧 Función obtenida:', !!testFunction);
      
      const messageData = {
        phoneNumber: settings.phoneNumber, 
        message: '🔔 ¡Prueba exitosa! Tu notificación de DR Group Dashboard funciona correctamente ✅\n\n📱 Este número está configurado para recibir alertas de compromisos financieros.\n\n🏢 Enviado desde WhatsApp Business API',
        useBusinessAPI: true // Usar Business API por defecto
      };
      
      console.log('📨 Enviando datos:', messageData);
      
      // Enviar mensaje de prueba
      const result = await testFunction(messageData);
      
      console.log('📬 Respuesta recibida:', result);
      console.log('✅ Data:', result.data);
      
      if (result.data && result.data.success) {
        console.log('🎉 Mensaje enviado exitosamente!');
        console.log('📡 Método:', result.data.method);
        setSuccess(true);
        // Mostrar notificación de éxito usando el contexto
        addNotification({
          type: 'success',
          title: '🎉 Mensaje Enviado',
          message: `Revisa tu WhatsApp ${settings.phoneNumber}`,
          icon: 'check_circle'
        });
      } else {
        console.error('❌ Error en la respuesta:', result.data);
        throw new Error(result.data?.error || 'Error desconocido en el envío');
      }
      
    } catch (error) {
      console.error('❌ Error enviando prueba:', error);
      setError(`Error enviando mensaje: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (field) => (e) => {
    setTemplateTest(prev => ({ ...prev, [field]: e.target.value }));
    setTemplateError('');
  };

  const handleSendTemplate = async () => {
    if (!settings.phoneNumber || !validatePhoneNumber(settings.phoneNumber)) {
      setTemplateError('Ingresa un número válido para probar');
      return;
    }
    if (!templateTest.contentSid) {
      setTemplateError('Ingresa el Content SID de la plantilla aprobada');
      return;
    }
    let variablesObj = {};
    try {
      if (templateTest.variables) {
        variablesObj = JSON.parse(templateTest.variables);
      }
    } catch (e) {
      setTemplateError('JSON de variables inválido');
      return;
    }
    try {
      setTemplateSending(true);
      setTemplateError('');
      setTemplateSuccess(false);
      const functions = getFunctions();
      const sendTemplateFn = httpsCallable(functions, 'sendWhatsAppTemplate');
      const result = await sendTemplateFn({
        phoneNumber: settings.phoneNumber,
        contentSid: templateTest.contentSid.trim(),
        variables: variablesObj
      });
      if (result.data?.success) {
        setTemplateSuccess(true);
        addNotification({
          type: 'success',
          title: 'Plantilla Enviada',
          message: `Template enviado a ${settings.phoneNumber}`,
          icon: 'sms'
        });
      } else {
        setTemplateError(result.data?.error || 'Fallo al enviar plantilla');
      }
    } catch (err) {
      console.error('Error enviando plantilla:', err);
      setTemplateError(err.message);
    } finally {
      setTemplateSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsApp color="success" />
          <Typography variant="h6">
            Configuración de Notificaciones
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

        {/* Configuración de Teléfono */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings fontSize="small" />
            Número de WhatsApp
          </Typography>
          <TextField
            fullWidth
            label="Número de teléfono"
            value={settings.phoneNumber}
            onChange={handlePhoneChange}
            placeholder="+573001234567"
            helperText="Formato: +57 seguido de 10 dígitos (números celulares colombianos)"
            variant="outlined"
            size="small"
          />
          
          {settings.phoneNumber && validatePhoneNumber(settings.phoneNumber) && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleTestNotification}
              disabled={loading}
              sx={{ mt: 1 }}
            >
              Enviar Prueba
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Prueba de Plantilla WhatsApp Business */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsApp fontSize="small" color="success" />
          Prueba de Plantilla (Business API)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Usa una plantilla aprobada para iniciar una conversación fuera de la ventana de 24h. Ingresa el Content SID y variables opcionales (JSON).
        </Typography>
        {templateError && (
          <Alert severity="error" sx={{ mb: 1 }}>{templateError}</Alert>
        )}
        {templateSuccess && (
          <Alert severity="success" sx={{ mb: 1 }}>✅ Plantilla enviada (revisa estado en WhatsApp)</Alert>
        )}
        <TextField
          fullWidth
          label="Content SID de la Plantilla"
          placeholder="HXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          value={templateTest.contentSid}
          onChange={handleTemplateChange('contentSid')}
          size="small"
          sx={{ mb: 1 }}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Variables (JSON)"
          value={templateTest.variables}
          onChange={handleTemplateChange('variables')}
          size="small"
          sx={{ mb: 1, fontFamily: 'monospace' }}
        />
        <Button
          variant="contained"
          color="success"
          onClick={handleSendTemplate}
          disabled={templateSending || loading}
          startIcon={<WhatsApp />}
          sx={{ mb: 2 }}
        >
          {templateSending ? 'Enviando...' : 'Enviar Plantilla'}
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Configuración de Notificaciones */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications fontSize="small" />
          Tipos de Notificaciones
        </Typography>

        <FormGroup>
          {/* Compromisos Próximos a Vencer */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
            📅 Compromisos Próximos a Vencer:
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.commitments15Days}
                onChange={handleCheckboxChange('commitments15Days')}
                color="primary"
              />
            }
            label="15 días antes del vencimiento"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.commitments7Days}
                onChange={handleCheckboxChange('commitments7Days')}
                color="primary"
              />
            }
            label="1 semana antes del vencimiento"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.commitments2Days}
                onChange={handleCheckboxChange('commitments2Days')}
                color="warning"
              />
            }
            label="2 días antes del vencimiento"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.commitmentsDueToday}
                onChange={handleCheckboxChange('commitmentsDueToday')}
                color="error"
              />
            }
            label="El día del vencimiento"
          />

          {/* Nuevos Compromisos */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            📝 Nuevos Compromisos:
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.newCommitments}
                onChange={handleCheckboxChange('newCommitments')}
                color="success"
              />
            }
            label="Notificar cuando se agreguen compromisos"
          />

          {/* Eventos Automáticos */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            🤖 Eventos Automáticos:
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.automaticEvents}
                onChange={handleCheckboxChange('automaticEvents')}
                color="info"
              />
            }
            label="Coljuegos, Parafiscales y UIAF"
          />
        </FormGroup>

        <Alert severity="info" sx={{ mt: 2 }}>
          📱 Las notificaciones se envían a las 9:00 AM (hora de Colombia) solo en días hábiles.
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? undefined : <WhatsApp />}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettingsModal;
