import React from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Chip,
  Paper,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  Palette, 
  FormatSize, 
  Brush,
  ColorLens,
  Style,
  Tune
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

const ThemeCustomizer = ({ settings, updateSettings, onPreviewChange }) => {
  // Presets de colores creativos y corporativos
  const colorPresets = [
    // Presets Creativos Originales
    { name: 'Boss Lite Original', primary: '#667eea', secondary: '#764ba2' },
    { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#3b82f6' },
    { name: 'Emerald Green', primary: '#10b981', secondary: '#059669' },
    { name: 'Sunset Orange', primary: '#f59e0b', secondary: '#ea580c' },
    { name: 'Purple Magic', primary: '#8b5cf6', secondary: '#a855f7' },
    { name: 'Rose Gold', primary: '#f43f5e', secondary: '#ec4899' },
    { name: 'Teal Fresh', primary: '#14b8a6', secondary: '#0d9488' },
    { name: 'Indigo Deep', primary: '#6366f1', secondary: '#4f46e5' },
    
    // ✨ NUEVOS PRESETS CORPORATIVOS PROFESIONALES ✨
    // Diseñados específicamente para entornos empresariales y dashboards financieros
    { 
      name: 'Corporate Professional', 
      primary: '#2563eb', 
      secondary: '#1e40af', 
      category: 'corporate',
      description: 'Azul corporativo clásico - Ideal para presentaciones ejecutivas y reportes formales'
    },
    { 
      name: 'Finance Gold', 
      primary: '#d97706', 
      secondary: '#92400e', 
      category: 'corporate',
      description: 'Dorado elegante - Perfecto para dashboards financieros y métricas de rentabilidad'
    },
    { 
      name: 'Success Green', 
      primary: '#059669', 
      secondary: '#065f46', 
      category: 'corporate',
      description: 'Verde confianza - Transmite crecimiento, estabilidad y éxito empresarial'
    },
    { 
      name: 'Executive Navy', 
      primary: '#1e3a8a', 
      secondary: '#1e40af', 
      category: 'corporate',
      description: 'Azul ejecutivo - Proyecta autoridad, experiencia y liderazgo empresarial'
    },
    { 
      name: 'Trust Blue', 
      primary: '#0369a1', 
      secondary: '#0284c7', 
      category: 'corporate',
      description: 'Azul confianza - Ideal para comunicar seguridad, profesionalismo y credibilidad'
    }
  ];

  const fontOptions = [
    { name: 'Roboto', family: 'Roboto' },
    { name: 'Inter', family: 'Inter' },
    { name: 'Poppins', family: 'Poppins' },
    { name: 'Open Sans', family: 'Open Sans' },
    { name: 'Montserrat', family: 'Montserrat' },
    { name: 'Nunito', family: 'Nunito' },
    { name: 'Source Sans Pro', family: 'Source Sans Pro' },
    { name: 'Lato', family: 'Lato' }
  ];

  const handleColorPresetSelect = (preset) => {
    updateSettings('theme', {
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    });
    if (onPreviewChange) {
      onPreviewChange({ primaryColor: preset.primary, secondaryColor: preset.secondary });
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Modo de Tema */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Palette sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Modo de Color
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Seleccionar Modo
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {['light', 'dark', 'auto'].map((mode) => (
                  <Chip
                    key={mode}
                    label={mode === 'light' ? 'Claro' : mode === 'dark' ? 'Oscuro' : 'Automático'}
                    onClick={() => updateSettings('theme', { mode })}
                    color={settings.theme.mode === mode ? 'primary' : 'default'}
                    variant={settings.theme.mode === mode ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Colores Personalizados */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ColorLens sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Colores del Tema
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Color Primario
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  type="color"
                  value={settings.theme.primaryColor}
                  onChange={(e) => updateSettings('theme', { primaryColor: e.target.value })}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {settings.theme.primaryColor}
                </Typography>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Color Secundario
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <input
                  type="color"
                  value={settings.theme.secondaryColor}
                  onChange={(e) => updateSettings('theme', { secondaryColor: e.target.value })}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {settings.theme.secondaryColor}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Presets de Color */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Brush sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Combinaciones Predefinidas
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Presets Corporativos:</strong> Diseñados especialmente para entornos empresariales y presentaciones ejecutivas. 
                Transmiten profesionalismo, confianza y son ideales para dashboards financieros.
              </Typography>
            </Alert>

            {/* Presets Creativos */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                🎨 Presets Creativos
              </Typography>
              <Grid container spacing={2}>
                {colorPresets.filter(preset => !preset.category).map((preset, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          background: `linear-gradient(45deg, ${preset.primary} 30%, ${preset.secondary} 90%)`,
                          color: 'white',
                          textAlign: 'center',
                          borderRadius: 2,
                          border: (settings.theme.primaryColor === preset.primary && 
                                 settings.theme.secondaryColor === preset.secondary) 
                                 ? '3px solid white' : 'none',
                          minHeight: 60,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleColorPresetSelect(preset)}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          {preset.name}
                        </Typography>
                      </Paper>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Presets Corporativos */}
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                🏢 Presets Corporativos
              </Typography>
              <Grid container spacing={2}>
                {colorPresets.filter(preset => preset.category === 'corporate').map((preset, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Tooltip 
                      title={preset.description || preset.name}
                      placement="top"
                      arrow
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Paper
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            background: `linear-gradient(45deg, ${preset.primary} 30%, ${preset.secondary} 90%)`,
                            color: 'white',
                            textAlign: 'center',
                            borderRadius: 2,
                            border: (settings.theme.primaryColor === preset.primary && 
                                   settings.theme.secondaryColor === preset.secondary) 
                                   ? '3px solid white' : 'none',
                            minHeight: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            '&::after': {
                              content: '"★"',
                              position: 'absolute',
                              top: 4,
                              right: 8,
                              fontSize: '12px',
                              opacity: 0.7
                            }
                          }}
                          onClick={() => handleColorPresetSelect(preset)}
                        >
                          <Typography variant="caption" fontWeight="bold">
                            {preset.name}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Vista Previa del Tema Actual */}
            <Box mt={3} p={2} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                🎯 Vista Previa del Tema Actual
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{ 
                    background: `linear-gradient(135deg, ${settings.theme.primaryColor} 0%, ${settings.theme.secondaryColor} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${settings.theme.primaryColor}dd 0%, ${settings.theme.secondaryColor}dd 100%)`,
                    }
                  }}
                >
                  Botón Primario
                </Button>
                <Chip 
                  label="Etiqueta" 
                  color="primary"
                  size="small"
                />
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 20, 
                    background: `linear-gradient(90deg, ${settings.theme.primaryColor} 0%, ${settings.theme.secondaryColor} 100%)`,
                    borderRadius: 1
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  {settings.theme.primaryColor} → {settings.theme.secondaryColor}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Efectos Visuales */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Style sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Efectos Visuales
              </Typography>
            </Box>

            <Box mt={3} mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Radio de Bordes: {settings.theme.borderRadius || 8}px
              </Typography>
              <Slider
                value={settings.theme.borderRadius || 8}
                onChange={(e, value) => updateSettings('theme', { borderRadius: value })}
                min={0}
                max={24}
                step={2}
                marks={[
                  { value: 0, label: 'Sin' },
                  { value: 8, label: 'Normal' },
                  { value: 16, label: 'Redondeado' },
                  { value: 24, label: 'Muy Redondo' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Vista Previa de Elementos
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{ borderRadius: `${settings.theme.borderRadius || 8}px` }}
                >
                  Botón
                </Button>
                <Chip 
                  label="Chip" 
                  color="primary"
                  sx={{ borderRadius: `${(settings.theme.borderRadius || 8) / 2}px` }}
                />
                <Paper 
                  sx={{ 
                    p: 1, 
                    borderRadius: `${settings.theme.borderRadius || 8}px`,
                    minWidth: 60,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                  }}
                >
                  <Typography variant="caption">Papel</Typography>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Tipografía */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <FormatSize sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Tipografía
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Familia de Fuente
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {fontOptions.map((font) => (
                  <Chip
                    key={font.family}
                    label={font.name}
                    onClick={() => updateSettings('theme', { fontFamily: font.family })}
                    color={settings.theme.fontFamily === font.family ? 'primary' : 'default'}
                    variant={settings.theme.fontFamily === font.family ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Box>
              
              {/* Preview de la fuente actual */}
              <Paper 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: `"${settings.theme.fontFamily}", sans-serif`,
                    color: 'text.primary'
                  }}
                >
                  Vista previa: {settings.theme.fontFamily} - ¡Esta es la fuente seleccionada!
                </Typography>
              </Paper>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Tamaño de Fuente
              </Typography>
              <Box display="flex" gap={1}>
                {['small', 'medium', 'large'].map((size) => (
                  <Chip
                    key={size}
                    label={size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}
                    onClick={() => updateSettings('theme', { fontSize: size })}
                    color={settings.theme.fontSize === size ? 'primary' : 'default'}
                    variant={settings.theme.fontSize === size ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ThemeCustomizer;
