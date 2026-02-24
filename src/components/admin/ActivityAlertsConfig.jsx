import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Chip,
  Alert,
  Grid,
  Divider,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Notifications,
  Security,
  Warning,
  Error,
  Info,
  Schedule,
  ExpandMore,
  Save,
  NotificationsActive,
  Email,
  Sms,
  Dashboard
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Configuración de alertas y notificaciones para auditoría
 * Fase 2 - Sistema avanzado de monitoreo
 */
const ActivityAlertsConfig = ({ onConfigSave }) => {
  const theme = useTheme();
  const [config, setConfig] = useState({
    // Alertas de seguridad
    security: {
      enabled: true,
      failedLogins: { enabled: true, threshold: 5, timeframe: 15 },
      suspiciousActivity: { enabled: true, threshold: 20, timeframe: 60 },
      adminActions: { enabled: true, notify: 'immediate' },
      dataAccess: { enabled: false, threshold: 50, timeframe: 60 }
    },
    
    // Alertas de volumen
    volume: {
      enabled: true,
      highActivity: { enabled: true, threshold: 100, timeframe: 60 },
      unusualPatterns: { enabled: true, sensitivity: 'medium' },
      peakHours: { enabled: false, notify: 'daily' }
    },
    
    // Canales de notificación
    channels: {
      email: { enabled: true, recipients: [] },
      dashboard: { enabled: true, showBadges: true },
      sms: { enabled: false, recipients: [] }
    },
    
    // Horarios de notificación
    schedule: {
      enabled: true,
      businessHours: { start: '08:00', end: '18:00' },
      weekends: false,
      holidays: false,
      urgentBypass: true
    }
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    const savedConfig = localStorage.getItem('audit_alerts_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setSaved(false);
  };

  const handleNestedConfigChange = (section, key, subKey, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: {
          ...prev[section][key],
          [subKey]: value
        }
      }
    }));
    setSaved(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    
    try {
      // Guardar en localStorage
      localStorage.setItem('audit_alerts_config', JSON.stringify(config));
      
      // Notificar al componente padre si existe
      if (onConfigSave) {
        onConfigSave(config);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
    } catch (error) {
      console.error('❌ Error al guardar configuración:', error);
    }
    
    setSaving(false);
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      default: return theme.palette.primary.main;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        mb: 3
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <NotificationsActive color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Configuración de Alertas
            </Typography>
            <Chip 
              label="Fase 2" 
              size="small" 
              color="secondary" 
              variant="outlined" 
            />
          </Box>

          {saved && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
              Configuración guardada exitosamente
            </Alert>
          )}

          {/* Alertas de Seguridad */}
          <Accordion defaultExpanded sx={{ mb: 2, borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Security color="error" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Alertas de Seguridad
                </Typography>
                <Chip 
                  label={config.security.enabled ? 'Activo' : 'Inactivo'} 
                  size="small" 
                  color={config.security.enabled ? 'success' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.security.enabled}
                        onChange={(e) => handleConfigChange('security', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Habilitar alertas de seguridad"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Intentos fallidos de login"
                    type="number"
                    value={config.security.failedLogins.threshold}
                    onChange={(e) => handleNestedConfigChange('security', 'failedLogins', 'threshold', parseInt(e.target.value))}
                    InputProps={{ endAdornment: 'intentos' }}
                    disabled={!config.security.enabled}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Actividad sospechosa"
                    type="number"
                    value={config.security.suspiciousActivity.threshold}
                    onChange={(e) => handleNestedConfigChange('security', 'suspiciousActivity', 'threshold', parseInt(e.target.value))}
                    InputProps={{ endAdornment: 'acciones/hora' }}
                    disabled={!config.security.enabled}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.security.adminActions.enabled}
                        onChange={(e) => handleNestedConfigChange('security', 'adminActions', 'enabled', e.target.checked)}
                        color="warning"
                      />
                    }
                    label="Notificar todas las acciones de administrador"
                    disabled={!config.security.enabled}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Alertas de Volumen */}
          <Accordion sx={{ mb: 2, borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning color="warning" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Alertas de Volumen
                </Typography>
                <Chip 
                  label={config.volume.enabled ? 'Activo' : 'Inactivo'} 
                  size="small" 
                  color={config.volume.enabled ? 'success' : 'default'}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.volume.enabled}
                        onChange={(e) => handleConfigChange('volume', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Habilitar alertas de volumen"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Actividad alta"
                    type="number"
                    value={config.volume.highActivity.threshold}
                    onChange={(e) => handleNestedConfigChange('volume', 'highActivity', 'threshold', parseInt(e.target.value))}
                    InputProps={{ endAdornment: 'acciones/hora' }}
                    disabled={!config.volume.enabled}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={!config.volume.enabled}>
                    <InputLabel>Sensibilidad de patrones</InputLabel>
                    <Select
                      value={config.volume.unusualPatterns.sensitivity}
                      label="Sensibilidad de patrones"
                      onChange={(e) => handleNestedConfigChange('volume', 'unusualPatterns', 'sensitivity', e.target.value)}
                    >
                      <MenuItem value="low">Baja</MenuItem>
                      <MenuItem value="medium">Media</MenuItem>
                      <MenuItem value="high">Alta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Canales de Notificación */}
          <Accordion sx={{ mb: 2, borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Notifications color="info" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Canales de Notificación
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.channels.email.enabled}
                        onChange={(e) => handleNestedConfigChange('channels', 'email', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email fontSize="small" />
                        Email
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.channels.dashboard.enabled}
                        onChange={(e) => handleNestedConfigChange('channels', 'dashboard', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Dashboard fontSize="small" />
                        Dashboard
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.channels.sms.enabled}
                        onChange={(e) => handleNestedConfigChange('channels', 'sms', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Sms fontSize="small" />
                        SMS
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Horarios */}
          <Accordion sx={{ mb: 3, borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Schedule color="success" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Horarios de Notificación
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.schedule.enabled}
                        onChange={(e) => handleConfigChange('schedule', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Respetar horarios de oficina"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Hora de inicio"
                    type="time"
                    value={config.schedule.businessHours.start}
                    onChange={(e) => handleNestedConfigChange('schedule', 'businessHours', 'start', e.target.value)}
                    disabled={!config.schedule.enabled}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Hora de fin"
                    type="time"
                    value={config.schedule.businessHours.end}
                    onChange={(e) => handleNestedConfigChange('schedule', 'businessHours', 'end', e.target.value)}
                    disabled={!config.schedule.enabled}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.schedule.weekends}
                        onChange={(e) => handleConfigChange('schedule', 'weekends', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Notificar fines de semana"
                    disabled={!config.schedule.enabled}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.schedule.urgentBypass}
                        onChange={(e) => handleConfigChange('schedule', 'urgentBypass', e.target.checked)}
                        color="warning"
                      />
                    }
                    label="Bypass para alertas urgentes"
                    disabled={!config.schedule.enabled}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Botón Guardar */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveConfig}
              disabled={saving}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActivityAlertsConfig;
