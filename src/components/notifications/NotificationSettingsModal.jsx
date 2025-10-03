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
  Paper,
  Avatar,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Telegram as TelegramIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';

const NotificationSettingsModal = ({ open, onClose, user }) => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { sendTestNotification, isLoading: emailLoading } = useEmailNotifications();
  const theme = useTheme();
  
  const [settings, setSettings] = useState({
    emailEnabled: true,
    telegramEnabled: false,
    telegramChatId: '',
    // 👥 Gestión de Usuarios
    userCreated: true,
    userUpdated: true,
    roleChanged: true,
    // 📅 Compromisos Próximos a Vencer
    commitments15Days: true,
    commitments7Days: true,
    commitments2Days: true,
    commitmentsDueToday: true,
    // 🚨 Compromisos Críticos
    commitmentOverdue: true,
    commitmentHighValue: true,
    commitmentCompleted: true,
    // 📋 Contratos de Empresas (NUEVO)
    contract365Days: true,
    contract180Days: true,
    contract90Days: true,
    contract30Days: true,
    contractDueToday: true,
    contractExpired: true,
    // 💳 Pagos
    paymentRegistered: true,
    paymentPartial: false,
    // 📈 Ingresos
    incomeReceived: true,
    bankBalanceLow: false,
    // 📊 Reportes y Resúmenes
    weeklySummary: true,
    monthlySummary: true,
    cashFlowAlert: false,
    // 🔐 Seguridad
    criticalPermissionChange: true,
    suspiciousAccess: false,
    dataExport: false,
    // 📋 Otros
    newCommitments: true,
    automaticEvents: true
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

        await sendTestNotification(
          user?.email || currentUser?.email || 'test@drgroup.com',
          user?.displayName || user?.name || 'Usuario de Prueba'
        );

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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
        }
      }}
    >
      {/* HEADER SOBRIO CON DISEÑO EMPRESARIAL */}
      <DialogTitle sx={{ 
        pb: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? theme.palette.grey[900]
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            bgcolor: 'primary.main', 
            width: 48,
            height: 48
          }}>
            <SettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: 'text.primary' 
            }}>
              Configuración de Notificaciones
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.displayName || user?.email || 'Email + Telegram'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        {/* ALERTS */}
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

        {/* CANALES DE NOTIFICACIÓN */}
        <Paper elevation={0} sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
        }}>
          <Typography variant="overline" sx={{
            fontWeight: 600,
            color: 'primary.main',
            letterSpacing: 0.8,
            fontSize: '0.75rem'
          }}>
            CANALES DE COMUNICACIÓN
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* EMAIL CHANNEL */}
            <Grid item xs={12} md={6}>
              <Paper sx={{
                p: 2.5,
                borderRadius: 2,
                border: settings.emailEnabled 
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                background: settings.emailEnabled
                  ? alpha(theme.palette.primary.main, 0.04)
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
              onClick={() => setSettings(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ 
                      fontSize: 28, 
                      color: settings.emailEnabled ? 'primary.main' : 'text.disabled' 
                    }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Email
                    </Typography>
                  </Box>
                  <Switch 
                    checked={settings.emailEnabled}
                    color="primary"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  📧 Formal · Registro permanente
                </Typography>

                {settings.emailEnabled && (
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestNotification('email');
                    }}
                    disabled={emailLoading}
                  >
                    {emailLoading ? 'Enviando...' : '▶ Prueba'}
                  </Button>
                )}
              </Paper>
            </Grid>

            {/* TELEGRAM CHANNEL */}
            <Grid item xs={12} md={6}>
              <Paper sx={{
                p: 2.5,
                borderRadius: 2,
                border: settings.telegramEnabled 
                  ? `2px solid ${theme.palette.info.main}`
                  : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                background: settings.telegramEnabled
                  ? alpha(theme.palette.info.main, 0.04)
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: theme.palette.info.main,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                }
              }}
              onClick={() => setSettings(prev => ({ ...prev, telegramEnabled: !prev.telegramEnabled }))}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TelegramIcon sx={{ 
                      fontSize: 28, 
                      color: settings.telegramEnabled ? 'info.main' : 'text.disabled' 
                    }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Telegram
                    </Typography>
                  </Box>
                  <Switch 
                    checked={settings.telegramEnabled}
                    color="info"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSettings(prev => ({ ...prev, telegramEnabled: e.target.checked }))}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  ⚡ Instantáneo · Siempre visible
                </Typography>

                {settings.telegramEnabled && settings.telegramChatId && (
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    color="info"
                    startIcon={<SendIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestNotification('telegram');
                    }}
                  >
                    ▶ Prueba
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* TELEGRAM CONFIGURATION */}
          {settings.telegramEnabled && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Chat ID de Telegram"
                value={settings.telegramChatId}
                onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                placeholder="@usuario o 123456789"
                helperText="Busca @drgroup_bot en Telegram y envía /start para obtener tu Chat ID"
                variant="outlined"
                size="small"
              />
            </Box>
          )}
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* TIPOS DE NOTIFICACIONES CON ACCORDIONS */}
        <Typography variant="overline" sx={{
          fontWeight: 600,
          color: 'secondary.main',
          letterSpacing: 0.8,
          fontSize: '0.75rem',
          display: 'block',
          mb: 2
        }}>
          🔔 TIPOS DE NOTIFICACIONES
        </Typography>

        {/* ACCORDION 1: Gestión de Usuarios */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <PeopleIcon sx={{ color: 'success.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Gestión de Usuarios
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Creación, actualización y cambios de roles
                </Typography>
              </Box>
              <Chip label={`${[settings.userCreated, settings.userUpdated, settings.roleChanged].filter(Boolean).length}/3`} size="small" color="success" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.userCreated} onChange={handleCheckboxChange('userCreated')} />} label="✅ Nuevo usuario creado" />
              <FormControlLabel control={<Checkbox checked={settings.userUpdated} onChange={handleCheckboxChange('userUpdated')} />} label="✏️ Usuario actualizado" />
              <FormControlLabel control={<Checkbox checked={settings.roleChanged} onChange={handleCheckboxChange('roleChanged')} />} label="🔄 Cambio de rol" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 2: Compromisos Próximos */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <AssignmentIcon sx={{ color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Compromisos Próximos a Vencer
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recordatorios antes del vencimiento
                </Typography>
              </Box>
              <Chip label={`${[settings.commitments15Days, settings.commitments7Days, settings.commitments2Days, settings.commitmentsDueToday].filter(Boolean).length}/4`} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.commitments15Days} onChange={handleCheckboxChange('commitments15Days')} />} label="📅 15 días antes" />
              <FormControlLabel control={<Checkbox checked={settings.commitments7Days} onChange={handleCheckboxChange('commitments7Days')} />} label="⏰ 7 días antes" />
              <FormControlLabel control={<Checkbox checked={settings.commitments2Days} onChange={handleCheckboxChange('commitments2Days')} />} label="🔔 2 días antes" />
              <FormControlLabel control={<Checkbox checked={settings.commitmentsDueToday} onChange={handleCheckboxChange('commitmentsDueToday')} />} label="🔴 El día del vencimiento" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 3: Compromisos Críticos */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.error.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <WarningIcon sx={{ color: 'error.main' }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Compromisos Críticos <Chip label="NUEVO" size="small" color="error" sx={{ ml: 1, height: 18 }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Vencidos, alto valor y completados
                </Typography>
              </Box>
              <Chip label={`${[settings.commitmentOverdue, settings.commitmentHighValue, settings.commitmentCompleted].filter(Boolean).length}/3`} size="small" color="error" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.commitmentOverdue} onChange={handleCheckboxChange('commitmentOverdue')} />} label="❌ Compromiso Vencido (diario)" />
              <FormControlLabel control={<Checkbox checked={settings.commitmentHighValue} onChange={handleCheckboxChange('commitmentHighValue')} />} label="💎 Alto Valor (>$50M)" />
              <FormControlLabel control={<Checkbox checked={settings.commitmentCompleted} onChange={handleCheckboxChange('commitmentCompleted')} />} label="✅ Compromiso Completado" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 4: Contratos de Empresas (NUEVO) */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <BusinessIcon sx={{ color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Contratos de Empresas <Chip label="NUEVO" size="small" color="primary" sx={{ ml: 1, height: 18 }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Vencimientos y renovaciones de contratos
                </Typography>
              </Box>
              <Chip label={`${[settings.contract365Days, settings.contract180Days, settings.contract90Days, settings.contract30Days, settings.contractDueToday, settings.contractExpired].filter(Boolean).length}/6`} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.contract365Days} onChange={handleCheckboxChange('contract365Days')} />} label="📄 Contrato vence en 1 año" />
              <FormControlLabel control={<Checkbox checked={settings.contract180Days} onChange={handleCheckboxChange('contract180Days')} />} label="📋 Contrato vence en 6 meses" />
              <FormControlLabel control={<Checkbox checked={settings.contract90Days} onChange={handleCheckboxChange('contract90Days')} />} label="📌 Contrato vence en 3 meses" />
              <FormControlLabel control={<Checkbox checked={settings.contract30Days} onChange={handleCheckboxChange('contract30Days')} />} label="⚠️ Contrato vence en 30 días" />
              <FormControlLabel control={<Checkbox checked={settings.contractDueToday} onChange={handleCheckboxChange('contractDueToday')} />} label="🔴 Contrato vence HOY" />
              <FormControlLabel control={<Checkbox checked={settings.contractExpired} onChange={handleCheckboxChange('contractExpired')} />} label="❌ Contrato Vencido (diario)" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 5: Pagos */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.info.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <PaymentIcon sx={{ color: 'info.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Pagos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Registros y abonos parciales
                </Typography>
              </Box>
              <Chip label={`${[settings.paymentRegistered, settings.paymentPartial].filter(Boolean).length}/2`} size="small" color="info" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.paymentRegistered} onChange={handleCheckboxChange('paymentRegistered')} />} label="💸 Pago Registrado" />
              <FormControlLabel control={<Checkbox checked={settings.paymentPartial} onChange={handleCheckboxChange('paymentPartial')} />} label="💰 Pago Parcial (Abono)" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 6: Ingresos */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.success.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <TrendingUpIcon sx={{ color: 'success.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Ingresos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Consignaciones y saldos bancarios
                </Typography>
              </Box>
              <Chip label={`${[settings.incomeReceived, settings.bankBalanceLow].filter(Boolean).length}/2`} size="small" color="success" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.incomeReceived} onChange={handleCheckboxChange('incomeReceived')} />} label="📈 Ingreso Recibido" />
              <FormControlLabel control={<Checkbox checked={settings.bankBalanceLow} onChange={handleCheckboxChange('bankBalanceLow')} />} label="⚠️ Saldo Bancario Bajo" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 7: Reportes */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <AssessmentIcon sx={{ color: 'secondary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Reportes y Resúmenes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Análisis periódicos y alertas
                </Typography>
              </Box>
              <Chip label={`${[settings.weeklySummary, settings.monthlySummary, settings.cashFlowAlert].filter(Boolean).length}/3`} size="small" color="secondary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.weeklySummary} onChange={handleCheckboxChange('weeklySummary')} />} label="📧 Resumen Semanal (Lunes)" />
              <FormControlLabel control={<Checkbox checked={settings.monthlySummary} onChange={handleCheckboxChange('monthlySummary')} />} label="📅 Resumen Mensual" />
              <FormControlLabel control={<Checkbox checked={settings.cashFlowAlert} onChange={handleCheckboxChange('cashFlowAlert')} />} label="💰 Alerta Flujo de Caja" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 8: Seguridad */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <SecurityIcon sx={{ color: 'warning.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Seguridad
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Permisos críticos y accesos
                </Typography>
              </Box>
              <Chip label={`${[settings.criticalPermissionChange, settings.suspiciousAccess, settings.dataExport].filter(Boolean).length}/3`} size="small" color="warning" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.criticalPermissionChange} onChange={handleCheckboxChange('criticalPermissionChange')} />} label="🛡️ Cambio de Permiso Crítico" />
              <FormControlLabel control={<Checkbox checked={settings.suspiciousAccess} onChange={handleCheckboxChange('suspiciousAccess')} />} label="🚨 Acceso Sospechoso" />
              <FormControlLabel control={<Checkbox checked={settings.dataExport} onChange={handleCheckboxChange('dataExport')} />} label="📥 Exportación de Datos" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 9: Otros */}
        <Accordion sx={{ mb: 1, border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <NotificationsIcon sx={{ color: 'grey.600' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Otros
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Eventos adicionales del sistema
                </Typography>
              </Box>
              <Chip label={`${[settings.newCommitments, settings.automaticEvents].filter(Boolean).length}/2`} size="small" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={settings.newCommitments} onChange={handleCheckboxChange('newCommitments')} />} label="✨ Nuevos compromisos" />
              <FormControlLabel control={<Checkbox checked={settings.automaticEvents} onChange={handleCheckboxChange('automaticEvents')} />} label="🤖 Eventos automáticos" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        <Alert severity="info" icon={<NotificationsIcon />} sx={{ mt: 3 }}>
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
          disabled={loading || (!settings.emailEnabled && !settings.telegramEnabled)}
          startIcon={loading ? <CheckCircleIcon /> : <SettingsIcon />}
        >
          {loading ? 'Guardando...' : '⚙️ Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettingsModal;
