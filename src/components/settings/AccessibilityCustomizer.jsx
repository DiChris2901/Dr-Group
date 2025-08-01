import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Slider,
  Divider,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  Accessibility,
  TextFields,
  ColorLens,
  Mouse,
  Keyboard,
  VolumeUp,
  Visibility,
  Speed,
  Contrast,
  ZoomIn
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

const AccessibilityCustomizer = () => {
  const { settings, updateSettings } = useSettings();

  // Configuraciones de accesibilidad actuales
  const accessibilitySettings = settings?.accessibility || {
    // Configuraciones visuales
    highContrast: false,
    largeText: false,
    fontSize: 'medium', // small, medium, large, extra-large
    reducedMotion: false,
    
    // Configuraciones de navegación
    keyboardNavigation: true,
    skipLinks: true,
    focusIndicators: true,
    
    // Configuraciones de contenido
    screenReaderSupport: true,
    altTexts: true,
    ariaLabels: true,
    
    // Configuraciones de interacción
    clickDelay: 300, // ms
    hoverDelay: 500, // ms
    doubleClickTime: 400, // ms
    
    // Configuraciones de sonido
    soundEffects: false,
    voiceAnnouncements: false,
    
    // Configuraciones específicas del dashboard
    autoSave: true,
    confirmActions: true,
    loadingIndicators: true,
    progressAnnouncements: true
  };

  const handleAccessibilityChange = (setting, value) => {
    updateSettings({
      accessibility: {
        ...accessibilitySettings,
        [setting]: value
      }
    });
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Pequeño (14px)' },
    { value: 'medium', label: 'Mediano (16px)' },
    { value: 'large', label: 'Grande (18px)' },
    { value: 'extra-large', label: 'Extra Grande (20px)' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Accessibility sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Configuración de Accesibilidad
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Estas configuraciones ayudan a hacer el dashboard más accesible para todos los usuarios.
          Los cambios se aplican inmediatamente.
        </Alert>

        <Grid container spacing={3}>
          {/* Configuraciones Visuales */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Visibility sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Configuraciones Visuales
                </Typography>
              </Box>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.highContrast}
                      onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Alto Contraste"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.largeText}
                      onChange={(e) => handleAccessibilityChange('largeText', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Texto Grande"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.reducedMotion}
                      onChange={(e) => handleAccessibilityChange('reducedMotion', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Reducir Animaciones"
                />
              </FormGroup>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel sx={{ mb: 1 }}>
                  <TextFields sx={{ mr: 1, fontSize: 20 }} />
                  Tamaño de Fuente
                </FormLabel>
                <Select
                  value={accessibilitySettings.fontSize}
                  onChange={(e) => handleAccessibilityChange('fontSize', e.target.value)}
                  size="small"
                >
                  {fontSizeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Configuraciones de Navegación */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Keyboard sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Navegación y Control
                </Typography>
              </Box>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.keyboardNavigation}
                      onChange={(e) => handleAccessibilityChange('keyboardNavigation', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Navegación por Teclado Mejorada"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.skipLinks}
                      onChange={(e) => handleAccessibilityChange('skipLinks', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enlaces de Salto"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.focusIndicators}
                      onChange={(e) => handleAccessibilityChange('focusIndicators', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Indicadores de Foco Visibles"
                />
              </FormGroup>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>
                  <Mouse sx={{ mr: 1, fontSize: 20 }} />
                  Tiempo de Retraso de Click (ms)
                </FormLabel>
                <Slider
                  value={accessibilitySettings.clickDelay}
                  onChange={(e, value) => handleAccessibilityChange('clickDelay', value)}
                  min={100}
                  max={1000}
                  step={50}
                  marks={[
                    { value: 200, label: '200ms' },
                    { value: 500, label: '500ms' },
                    { value: 800, label: '800ms' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </FormControl>
            </Paper>
          </Grid>

          {/* Configuraciones de Lectores de Pantalla */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VolumeUp sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Soporte para Lectores de Pantalla
                </Typography>
              </Box>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.screenReaderSupport}
                      onChange={(e) => handleAccessibilityChange('screenReaderSupport', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Soporte Completo de Lector de Pantalla"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.altTexts}
                      onChange={(e) => handleAccessibilityChange('altTexts', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Textos Alternativos Detallados"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.ariaLabels}
                      onChange={(e) => handleAccessibilityChange('ariaLabels', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Etiquetas ARIA Extendidas"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.voiceAnnouncements}
                      onChange={(e) => handleAccessibilityChange('voiceAnnouncements', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Anuncios de Voz para Acciones"
                />
              </FormGroup>
            </Paper>
          </Grid>

          {/* Configuraciones del Dashboard */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Experiencia de Usuario
                </Typography>
              </Box>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.autoSave}
                      onChange={(e) => handleAccessibilityChange('autoSave', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Autoguardado Frecuente"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.confirmActions}
                      onChange={(e) => handleAccessibilityChange('confirmActions', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Confirmar Acciones Importantes"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.loadingIndicators}
                      onChange={(e) => handleAccessibilityChange('loadingIndicators', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Indicadores de Carga Detallados"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={accessibilitySettings.progressAnnouncements}
                      onChange={(e) => handleAccessibilityChange('progressAnnouncements', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Anuncios de Progreso"
                />
              </FormGroup>
            </Paper>
          </Grid>

          {/* Resumen de Configuración Actual */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                🎯 Configuración Actual de Accesibilidad
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {accessibilitySettings.highContrast && (
                  <Chip icon={<Contrast />} label="Alto Contraste" color="primary" size="small" />
                )}
                {accessibilitySettings.largeText && (
                  <Chip icon={<ZoomIn />} label="Texto Grande" color="primary" size="small" />
                )}
                {accessibilitySettings.reducedMotion && (
                  <Chip icon={<Speed />} label="Animaciones Reducidas" color="primary" size="small" />
                )}
                {accessibilitySettings.keyboardNavigation && (
                  <Chip icon={<Keyboard />} label="Navegación por Teclado" color="primary" size="small" />
                )}
                {accessibilitySettings.screenReaderSupport && (
                  <Chip icon={<VolumeUp />} label="Lector de Pantalla" color="primary" size="small" />
                )}
                {accessibilitySettings.autoSave && (
                  <Chip icon={<Speed />} label="Autoguardado" color="primary" size="small" />
                )}
              </Box>

              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ✅ Configuración optimizada para accesibilidad financiera empresarial
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default AccessibilityCustomizer;
