import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import { 
  Palette, 
  FormatSize, 
  Brush,
  ColorLens,
  Style,
  Tune,
  AutoAwesome,
  Science
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { 
  generatePaletteFromSeed, 
  generateQualitySeedColors, 
  generateMaterialTheme 
} from '../../utils/materialThemeGenerator';

const OfficeThemeCustomizer = () => {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [seedColor, setSeedColor] = useState(settings?.theme?.primaryColor || '#6750A4');
  const [generatedPalette, setGeneratedPalette] = useState(null);

  // Generar paleta cuando cambia el color semilla
  useEffect(() => {
    const palette = generatePaletteFromSeed(seedColor);
    setGeneratedPalette(palette);
  }, [seedColor]);

  // Colores semilla de alta calidad
  const qualitySeedColors = generateQualitySeedColors();

  // Presets de colores creativos y corporativos (mantenemos compatibilidad)
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
    // Preset especial: Negro a Rojo
    { name: 'Negro a Rojo', primary: '#000000', secondary: '#ff0000' },
    
    // Presets Corporativos Profesionales
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
    // Al aplicar un preset, también actualizamos la topbar, sidebar y formularios si usan estos colores
    updateSettings('theme', {
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      // Si tienes más propiedades específicas para topbar/sidebar, agrégalas aquí
      topbarColor: preset.primary,
      sidebarBannerColor: preset.secondary,
      formColor: preset.secondary
    });
  };

  // Manejar selección de color semilla (Material Theme Builder style)
  const handleSeedColorSelect = (color) => {
    setSeedColor(color);
    const palette = generatePaletteFromSeed(color);
    updateSettings('theme', {
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      tertiaryColor: palette.tertiaryColor,
      seedColor: color
    });
  };

  // Aplicar paleta generada completa
  const applyGeneratedPalette = () => {
    if (generatedPalette) {
      updateSettings('theme', {
        primaryColor: generatedPalette.primaryColor,
        secondaryColor: generatedPalette.secondaryColor,
        tertiaryColor: generatedPalette.tertiaryColor,
        seedColor: seedColor,
        palette: generatedPalette
      });
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`theme-tabpanel-${index}`}
      aria-labelledby={`theme-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Tabs solo para Generador Inteligente y Opciones Avanzadas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="theme customization tabs"
        >
          <Tab 
            icon={<AutoAwesome />} 
            label="Generador Inteligente" 
            id="theme-tab-0"
            aria-controls="theme-tabpanel-0"
          />
          <Tab 
            icon={<Tune />} 
            label="Opciones Avanzadas" 
            id="theme-tab-1"
            aria-controls="theme-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Panel 1: Generador Inteligente (Material Theme Builder Style) */}
      <TabPanel value={activeTab} index={0}>
        {/* ...existing code for the intelligent generator panel... */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Science sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Generador de Paleta Inteligente
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Inspirado en Material Theme Builder:</strong> Selecciona un color semilla y el sistema 
                    generará automáticamente una paleta completa y armónica para tu dashboard.
                  </Typography>
                </Alert>
                {/* Selector de Color Semilla */}
                <Box mb={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    🎨 Color Semilla Principal
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Un solo color genera toda la paleta automáticamente
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <input
                      type="color"
                      value={seedColor}
                      onChange={(e) => setSeedColor(e.target.value)}
                      style={{
                        width: 60,
                        height: 50,
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="600">
                        {seedColor.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Color semilla seleccionado
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={applyGeneratedPalette}
                      sx={{ ml: 'auto' }}
                    >
                      Aplicar Paleta
                    </Button>
                  </Box>
                  {/* Colores Semilla Predefinidos */}
                  <Typography variant="subtitle2" gutterBottom>
                    ⭐ Colores Semilla de Alta Calidad
                  </Typography>
                  <Grid container spacing={1.5}>
                    {qualitySeedColors.map((seed, index) => (
                      <Grid item xs={6} sm={4} md={2.4} key={index}>
                        <Tooltip title={`${seed.name} - ${seed.category}`} arrow>
                          <motion.div
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                backgroundColor: seed.color,
                                color: 'white',
                                textAlign: 'center',
                                borderRadius: 2,
                                border: seedColor === seed.color ? '3px solid white' : 'none',
                                minHeight: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                boxShadow: seedColor === seed.color 
                                  ? '0 4px 20px rgba(0,0,0,0.3)' 
                                  : '0 1px 3px rgba(0,0,0,0.2)',
                                '&::after': seed.category === 'corporate' ? {
                                  content: '"★"',
                                  position: 'absolute',
                                  top: 2,
                                  right: 4,
                                  fontSize: '10px',
                                  opacity: 0.8
                                } : {}
                              }}
                              onClick={() => setSeedColor(seed.color)}
                            >
                              <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>
                                {seed.name}
                              </Typography>
                            </Paper>
                          </motion.div>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                {/* Vista Previa de Paleta Generada */}
                {generatedPalette && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      🎯 Paleta Generada Automáticamente
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Vista previa de los colores principales generados desde tu color semilla
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: generatedPalette.primaryColor, color: 'white' }}>
                          <Typography variant="caption" fontWeight="bold">PRIMARIO</Typography>
                          <Typography variant="body2">{generatedPalette.primaryColor}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: generatedPalette.secondaryColor, color: 'white' }}>
                          <Typography variant="caption" fontWeight="bold">SECUNDARIO</Typography>
                          <Typography variant="body2">{generatedPalette.secondaryColor}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: generatedPalette.tertiaryColor, color: 'white' }}>
                          <Typography variant="caption" fontWeight="bold">TERCIARIO</Typography>
                          <Typography variant="body2">{generatedPalette.tertiaryColor}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    {/* Vista Previa con Elementos */}
                    <Box mt={3} p={2} bgcolor="background.default" borderRadius={2} border="1px solid" borderColor="divider">
                      <Typography variant="subtitle2" gutterBottom color="text.secondary">
                        🔍 Vista Previa con Elementos
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button 
                          variant="contained" 
                          size="small"
                          sx={{ backgroundColor: generatedPalette.primaryColor }}
                        >
                          Botón Primario
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          sx={{ borderColor: generatedPalette.secondaryColor, color: generatedPalette.secondaryColor }}
                        >
                          Botón Secundario
                        </Button>
                        <Chip 
                          label="Etiqueta" 
                          sx={{ backgroundColor: generatedPalette.tertiaryColor, color: 'white' }}
                          size="small"
                        />
                      </Stack>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Panel 2: Opciones Avanzadas */}
      <TabPanel value={activeTab} index={1}>
        {/* ...existing code for advanced options... */}
        <Grid container spacing={3}>
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
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default OfficeThemeCustomizer;
