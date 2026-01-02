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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  ViewSidebar,
  Settings,
  Speed,
  TouchApp,
  FormatAlignLeft,
  FormatAlignRight
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';

const SidebarCustomizer = ({ settings, updateSettings }) => {
  return (
    <Grid container spacing={3}>
      {/* Diseño y Comportamiento */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ViewSidebar sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Diseño y Comportamiento
              </Typography>
            </Box>

            {/* Modo Compacto - Movido desde Tema */}
            <Box mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sidebar?.compactMode || false}
                    onChange={(e) => {
                      const newCompactMode = e.target.checked;
                      console.log('🔄 [SidebarCustomizer] Cambiando modo compacto a:', newCompactMode);
                      
                      // ✅ Actualizar ambas configuraciones en una sola llamada
                      updateSettings({
                        ...settings,
                        sidebar: { 
                          ...settings.sidebar,
                          compactMode: newCompactMode 
                        },
                        theme: { 
                          ...settings.theme, 
                          compactMode: newCompactMode 
                        }
                      });
                    }}
                  />
                }
                label="Modo Compacto Global"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Reduce espaciado en toda la aplicación para mostrar más información
              </Typography>
            </Box>

            {/* Ancho del Sidebar */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Ancho del Sidebar: {settings.sidebar?.width || 280}px
              </Typography>
              <Box sx={{ px: 2, py: 1 }}>
                <Slider
                  value={settings.sidebar?.width || 280}
                  onChange={(e, value) => updateSettings('sidebar', { width: value })}
                  min={240}
                  max={400}
                  step={20}
                  marks={[
                    { value: 240, label: 'Compacto' },
                    { value: 280, label: 'Normal' },
                    { value: 320, label: 'Amplio' },
                    { value: 400, label: 'Máximo' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                    },
                    '& .MuiSlider-mark': {
                      height: 8,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Posición del Sidebar */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Posición
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  icon={<FormatAlignLeft />}
                  label="Izquierda"
                  onClick={() => updateSettings('sidebar', { position: 'left' })}
                  color={settings.sidebar?.position === 'left' ? 'primary' : 'default'}
                  variant={settings.sidebar?.position === 'left' ? 'filled' : 'outlined'}
                />
                <Chip
                  icon={<FormatAlignRight />}
                  label="Derecha"
                  onClick={() => updateSettings('sidebar', { position: 'right' })}
                  color={settings.sidebar?.position === 'right' ? 'primary' : 'default'}
                  variant={settings.sidebar?.position === 'right' ? 'filled' : 'outlined'}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>



      {/* Comportamiento Avanzado */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Settings sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Comportamiento Avanzado
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Animaciones */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Velocidad de Animación
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.sidebar?.animationSpeed || 'normal'}
                      onChange={(e) => updateSettings('sidebar', { animationSpeed: e.target.value })}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200,
                            zIndex: 9999
                          }
                        }
                      }}
                    >
                      <MenuItem value="slow">Lenta</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="fast">Rápida</MenuItem>
                      <MenuItem value="none">Sin animación</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Hover Delay */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Retardo de Hover: {settings.sidebar?.hoverDelay || 300}ms
                  </Typography>
                  <Box sx={{ px: 2, py: 1 }}>
                    <Slider
                      value={settings.sidebar?.hoverDelay || 300}
                      onChange={(e, value) => updateSettings('sidebar', { hoverDelay: value })}
                      min={0}
                      max={1000}
                      step={100}
                      marks={[
                        { value: 0, label: 'Inmediato' },
                        { value: 300, label: 'Normal' },
                        { value: 600, label: 'Lento' }
                      ]}
                      valueLabelDisplay="auto"
                      sx={{
                        '& .MuiSlider-markLabel': {
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        },
                        '& .MuiSlider-mark': {
                          height: 8,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Persistir Estado */}
              <Grid item xs={12}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.sidebar?.persistState !== false}
                        onChange={(e) => updateSettings('sidebar', { persistState: e.target.checked })}
                      />
                    }
                    label="Recordar estado"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Mantener expandido/colapsado entre sesiones
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Vista Previa */}
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                🎯 Vista Previa de Configuración Actual
              </Typography>
              <Paper 
                sx={{ 
                  p: 3, 
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {/* Simulación del Sidebar */}
                  <Box 
                    sx={{ 
                      width: Math.max(60, (settings.sidebar?.width || 280) / 4),
                      height: 80,
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      color: 'white',
                      fontSize: '10px',
                      position: 'relative',
                      order: settings.sidebar?.position === 'right' ? 2 : 1
                    }}
                  >
                    {settings.sidebar?.showIcons !== false && '⚙'}
                    {settings.sidebar?.showLabels !== false && 'Menu'}
                    {settings.sidebar?.collapsed && (
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 8,
                          height: 8,
                          bgcolor: 'warning.main',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                  </Box>

                  {/* Área de Contenido */}
                  <Box 
                    sx={{ 
                      flex: 1,
                      height: 80,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      order: settings.sidebar?.position === 'right' ? 1 : 2
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Área de Contenido
                    </Typography>
                  </Box>
                </Box>

                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Configuración:</strong> Ancho {settings.sidebar?.width || 280}px • 
                    Posición {settings.sidebar?.position === 'right' ? 'Derecha' : 'Izquierda'} • 
                    Velocidad {settings.sidebar?.animationSpeed || 'normal'} • 
                    Hover {settings.sidebar?.hoverDelay || 300}ms
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SidebarCustomizer;
