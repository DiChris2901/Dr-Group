/**
 * Professional Settings Drawer with Tabs
 * Complete configuration system for DR Group Dashboard
 */

import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Slider,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  FormControl,
  FormLabel,
  Stack,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  TableChart as TableIcon,
  BarChart as ChartBarIcon,
  ShowChart as ChartLineIcon,
  DonutSmall as ChartDonutIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  RestartAlt as RestartIcon,
  TextFields as TextFieldsIcon,
  FormatSize as FormatSizeIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { primaryColorPresets } from '../../theme/colorPresets';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function AdvancedSettingsDrawer({ open, onClose }) {
  const theme = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Valores por defecto para dashboard settings
  const defaultDashboard = {
    layout: {
      columns: 3,
      cardSize: 'medium',
      density: 'normal',
      viewMode: 'grid'
    },
    widgets: {
      totalCommitments: true,
      monthlyOverview: true,
      upcomingPayments: true,
      companyBreakdown: true,
      recentActivity: true,
      analytics: true
    },
    notifications: {
      enabled: true,
      alertThreshold: 100000,
      types: {
        upcomingPayments: true,
        overduePayments: true,
        highAmount: true,
        systemUpdates: false
      }
    },
    company: {
      defaultView: 'all',
      autoRefresh: true,
      refreshInterval: 30
    }
  };

  const dashboardSettings = { ...defaultDashboard, ...settings.dashboard };

  const updateDashboardSetting = (path, value) => {
    const keys = path.split('.');
    const updatedDashboard = { ...dashboardSettings };
    let current = updatedDashboard;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    updateSettings('dashboard', updatedDashboard);
  };

  const colorOptions = Object.entries(primaryColorPresets).map(([key, preset]) => ({
    key,
    name: preset.name,
    colors: preset
  }));

  const tabs = [
    { label: 'Tema', icon: <PaletteIcon /> },
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Notificaciones', icon: <NotificationsIcon /> },
    { label: 'Empresa', icon: <BusinessIcon /> },
    { label: 'Seguridad', icon: <SecurityIcon />, disabled: true },
    { label: 'Idioma', icon: <LanguageIcon />, disabled: true }
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 520, md: 600, lg: 650 },
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          zIndex: 1300
        }
      }}
      ModalProps={{
        keepMounted: false,
        sx: { zIndex: 1300 }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ height: '100%' }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                  >
                    <SettingsIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Configuración
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Personaliza tu dashboard
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Restablecer configuración">
                    <IconButton
                      onClick={resetSettings}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          background: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main'
                        }
                      }}
                    >
                      <RestartIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    onClick={onClose}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { background: alpha(theme.palette.text.primary, 0.08) }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: alpha(theme.palette.background.default, 0.3)
            }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: 72,
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                  '& .MuiTab-root': {
                    minHeight: 72,
                    minWidth: { xs: 120, sm: 140 },
                    maxWidth: { xs: 160, sm: 180 },
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    color: theme.palette.text.secondary,
                    padding: '12px 20px',
                    margin: '0 4px',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      '& .MuiSvgIcon-root': {
                        color: theme.palette.primary.main,
                      }
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      color: theme.palette.text.disabled,
                      cursor: 'not-allowed',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        transform: 'none',
                      }
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.25rem',
                      marginRight: '8px',
                      marginBottom: '0 !important',
                      color: 'inherit',
                      transition: 'color 0.2s ease-in-out',
                    },
                    '& .MuiTab-iconWrapper': {
                      marginBottom: '0 !important',
                    }
                  }
                }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    disabled={tab.disabled}
                    label={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flexDirection: 'row',
                        position: 'relative'
                      }}>
                        {tab.icon}
                        <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: 'inherit' }}>
                          {tab.label}
                        </Typography>
                        {tab.disabled && (
                          <Chip 
                            label="Próximamente" 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              height: 18, 
                              fontSize: '0.625rem',
                              backgroundColor: alpha(theme.palette.warning.main, 0.15),
                              color: theme.palette.warning.main,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }} 
                          />
                        )}
                      </Box>
                    }
                    sx={{ 
                      '& .MuiTab-wrapper': {
                        flexDirection: 'row',
                        gap: 1
                      }
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* TEMA TAB */}
              <TabPanel value={activeTab} index={0}>
                <Stack spacing={3}>
                  {/* Color Presets */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaletteIcon color="primary" />
                        Paleta de Colores
                      </Typography>
                      <Grid container spacing={1.5}>
                        {colorOptions.map(({ key, name, colors }) => (
                          <Grid item xs={6} sm={4} key={key}>
                            <Card
                              sx={{
                                cursor: 'pointer',
                                border: settings?.theme?.primaryColor === colors.main 
                                  ? `2px solid ${colors.main}` 
                                  : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 8px 24px ${alpha(colors.main, 0.25)}`
                                }
                              }}
                              onClick={() => {
                                const newTheme = { 
                                  ...settings.theme, 
                                  primaryColor: colors.main 
                                };
                                updateSettings('theme', newTheme);
                              }}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 32,
                                    borderRadius: 1,
                                    background: `linear-gradient(135deg, ${colors.light}, ${colors.main}, ${colors.dark})`,
                                    mb: 1
                                  }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {name}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Mode Selection */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Modo de Tema
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant={settings?.theme?.mode === 'light' ? 'contained' : 'outlined'}
                          startIcon={<LightModeIcon />}
                          onClick={() => updateSettings('theme', { 
                            ...settings.theme, 
                            mode: 'light' 
                          })}
                          sx={{ flex: 1, py: 1.5 }}
                        >
                          Claro
                        </Button>
                        <Button
                          variant={settings?.theme?.mode === 'dark' ? 'contained' : 'outlined'}
                          startIcon={<DarkModeIcon />}
                          onClick={() => updateSettings('theme', { 
                            ...settings.theme, 
                            mode: 'dark' 
                          })}
                          sx={{ flex: 1, py: 1.5 }}
                        >
                          Oscuro
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Advanced Options */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Opciones Avanzadas
                      </Typography>
                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings?.theme?.animations !== false}
                              onChange={(e) => updateSettings('theme', { 
                                ...settings.theme, 
                                animations: e.target.checked 
                              })}
                            />
                          }
                          label="Habilitar animaciones"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings?.sidebar?.compactMode !== false}
                              onChange={(e) => {
                                const newCompactMode = e.target.checked;
                                // Actualizar tanto en sidebar como en theme para compatibilidad
                                updateSettings('sidebar', { 
                                  ...settings.sidebar, 
                                  compactMode: newCompactMode 
                                });
                                updateSettings('theme', { 
                                  ...settings.theme, 
                                  compactMode: newCompactMode 
                                });
                              }}
                            />
                          }
                          label="Modo compacto"
                        />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Typography Settings */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextFieldsIcon color="primary" />
                        Tipografía
                      </Typography>
                      <Stack spacing={3}>
                        {/* Font Family */}
                        <FormControl fullWidth>
                          <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Familia de Fuente</FormLabel>
                          <Select
                            value={settings?.theme?.fontFamily || 'Inter'}
                            onChange={(e) => updateSettings('theme', { 
                              ...settings.theme, 
                              fontFamily: e.target.value 
                            })}
                            sx={{ 
                              fontFamily: settings?.theme?.fontFamily || 'Inter',
                              '& .MuiSelect-select': {
                                fontFamily: settings?.theme?.fontFamily || 'Inter'
                              }
                            }}
                          >
                            <MenuItem value="Inter" sx={{ fontFamily: 'Inter' }}>
                              Inter (Recomendada)
                            </MenuItem>
                            <MenuItem value="Roboto" sx={{ fontFamily: 'Roboto' }}>
                              Roboto
                            </MenuItem>
                            <MenuItem value="Public Sans" sx={{ fontFamily: 'Public Sans' }}>
                              Public Sans
                            </MenuItem>
                            <MenuItem value="DM Sans" sx={{ fontFamily: 'DM Sans' }}>
                              DM Sans
                            </MenuItem>
                            <MenuItem value="Nunito Sans" sx={{ fontFamily: 'Nunito Sans' }}>
                              Nunito Sans
                            </MenuItem>
                            <MenuItem value="system-ui" sx={{ fontFamily: 'system-ui' }}>
                              Sistema (system-ui)
                            </MenuItem>
                            <MenuItem value="Arial" sx={{ fontFamily: 'Arial' }}>
                              Arial
                            </MenuItem>
                            <MenuItem value="Times New Roman" sx={{ fontFamily: 'Times New Roman' }}>
                              Times New Roman
                            </MenuItem>
                          </Select>
                        </FormControl>

                        {/* Font Size */}
                        <Box sx={{ width: '100%' }}>
                          <FormLabel sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormatSizeIcon sx={{ fontSize: 18 }} />
                            Tamaño de Fuente Base: {settings?.theme?.fontSize || 14}px
                          </FormLabel>
                          <Box sx={{ px: 1 }}>
                            <Slider
                              value={settings?.theme?.fontSize || 14}
                              onChange={(e, value) => updateSettings('theme', { 
                                ...settings.theme, 
                                fontSize: value 
                              })}
                              min={12}
                              max={18}
                              step={1}
                              marks={[
                                { value: 12, label: '12px' },
                                { value: 14, label: '14px' },
                                { value: 16, label: '16px' },
                                { value: 18, label: '18px' }
                              ]}
                              sx={{
                                width: '100%',
                                '& .MuiSlider-root': {
                                  width: '100%',
                                },
                                '& .MuiSlider-rail': {
                                  backgroundColor: alpha(theme.palette.text.secondary, 0.3),
                                  height: 4,
                                },
                                '& .MuiSlider-track': {
                                  backgroundColor: theme.palette.primary.main,
                                  height: 4,
                                  border: 'none',
                                },
                                '& .MuiSlider-thumb': {
                                  height: 20,
                                  width: 20,
                                  backgroundColor: theme.palette.primary.main,
                                  border: `2px solid ${theme.palette.background.paper}`,
                                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                                  '&:hover': {
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                                  },
                                  '&.Mui-focusVisible': {
                                    boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                                  },
                                },
                                '& .MuiSlider-mark': {
                                  backgroundColor: theme.palette.text.secondary,
                                  height: 8,
                                  width: 2,
                                  '&.MuiSlider-markActive': {
                                    opacity: 1,
                                    backgroundColor: theme.palette.primary.main,
                                  }
                                },
                                '& .MuiSlider-markLabel': {
                                  fontSize: '0.75rem',
                                  color: theme.palette.text.secondary,
                                  fontWeight: 500,
                                  transform: 'translateX(-50%)',
                                  whiteSpace: 'nowrap',
                                }
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Preview */}
                        <Box 
                          sx={{ 
                            p: 2, 
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.background.paper, 0.5)
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Vista Previa:
                          </Typography>
                          <Box sx={{ 
                            fontFamily: settings?.theme?.fontFamily || 'Inter',
                            fontSize: `${settings?.theme?.fontSize || 14}px`
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                              fontWeight: 600,
                              mb: 1 
                            }}>
                              DR Group Dashboard
                            </Typography>
                            <Typography variant="body1" sx={{ 
                              fontFamily: 'inherit',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              mb: 0.5 
                            }}>
                              Este es un ejemplo de texto con la fuente seleccionada.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              fontFamily: 'inherit',
                              fontSize: `${(settings?.theme?.fontSize || 14) * 0.875}px`,
                              fontWeight: 'inherit'
                            }}>
                              Texto secundario más pequeño para referencia.
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </TabPanel>

              {/* DASHBOARD TAB */}
              <TabPanel value={activeTab} index={1}>
                <Stack spacing={3}>
                  {/* Layout Configuration */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GridIcon color="primary" />
                        Layout y Visualización
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {/* Columns */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Número de Columnas</FormLabel>
                            <Select
                              value={dashboardSettings.layout.columns}
                              onChange={(e) => updateDashboardSetting('layout.columns', e.target.value)}
                              size="small"
                            >
                              <MenuItem value={1}>1 Columna</MenuItem>
                              <MenuItem value={2}>2 Columnas</MenuItem>
                              <MenuItem value={3}>3 Columnas</MenuItem>
                              <MenuItem value={4}>4 Columnas</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Card Size */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Tamaño de Cards</FormLabel>
                            <Select
                              value={dashboardSettings.layout.cardSize}
                              onChange={(e) => updateDashboardSetting('layout.cardSize', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="small">Pequeño</MenuItem>
                              <MenuItem value="medium">Mediano</MenuItem>
                              <MenuItem value="large">Grande</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* View Mode */}
                        <Grid item xs={12}>
                          <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>Modo de Vista</FormLabel>
                          <ToggleButtonGroup
                            value={dashboardSettings.layout.viewMode}
                            exclusive
                            onChange={(e, value) => value && updateDashboardSetting('layout.viewMode', value)}
                            size="small"
                          >
                            <ToggleButton value="grid">
                              <GridIcon sx={{ mr: 1 }} />
                              Grid
                            </ToggleButton>
                            <ToggleButton value="list">
                              <ListIcon sx={{ mr: 1 }} />
                              Lista
                            </ToggleButton>
                            <ToggleButton value="table">
                              <TableIcon sx={{ mr: 1 }} />
                              Tabla
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Widgets Configuration */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DashboardIcon color="primary" />
                        Widgets del Dashboard
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selecciona qué widgets deseas mostrar en tu dashboard
                      </Typography>

                      <Stack spacing={1}>
                        {Object.entries(dashboardSettings.widgets).map(([key, enabled]) => (
                          <FormControlLabel
                            key={key}
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => updateDashboardSetting(`widgets.${key}`, e.target.checked)}
                              />
                            }
                            label={getWidgetLabel(key)}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </TabPanel>

              {/* NOTIFICACIONES TAB */}
              <TabPanel value={activeTab} index={2}>
                <Stack spacing={3}>
                  {/* Notifications Settings */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsIcon color="primary" />
                        Notificaciones y Alertas
                      </Typography>

                      <Stack spacing={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={dashboardSettings.notifications.enabled}
                              onChange={(e) => updateDashboardSetting('notifications.enabled', e.target.checked)}
                            />
                          }
                          label="Habilitar notificaciones"
                        />

                        {dashboardSettings.notifications.enabled && (
                          <>
                            <Box>
                              <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Umbral de Monto para Alerta</FormLabel>
                              <TextField
                                type="number"
                                value={dashboardSettings.notifications.alertThreshold}
                                onChange={(e) => updateDashboardSetting('notifications.alertThreshold', Number(e.target.value))}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                size="small"
                                fullWidth
                              />
                            </Box>

                            <Box>
                              <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>Tipos de Notificaciones</FormLabel>
                              <Stack spacing={1}>
                                {Object.entries(dashboardSettings.notifications.types).map(([key, enabled]) => (
                                  <FormControlLabel
                                    key={key}
                                    control={
                                      <Switch
                                        checked={enabled}
                                        onChange={(e) => updateDashboardSetting(`notifications.types.${key}`, e.target.checked)}
                                      />
                                    }
                                    label={getNotificationLabel(key)}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </TabPanel>

              {/* EMPRESA TAB */}
              <TabPanel value={activeTab} index={3}>
                <Stack spacing={3}>
                  {/* Company Settings */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" />
                        Configuraciones de Empresa
                      </Typography>

                      <Stack spacing={3}>
                        <Box>
                          <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'block' }}>
                            Vista Predeterminada
                          </FormLabel>
                          <Select
                            value={dashboardSettings.company.defaultView}
                            onChange={(e) => updateDashboardSetting('company.defaultView', e.target.value)}
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="all">Todas las empresas</MenuItem>
                            <MenuItem value="active">Solo empresas activas</MenuItem>
                            <MenuItem value="recent">Actividad reciente</MenuItem>
                          </Select>
                        </Box>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={dashboardSettings.company.autoRefresh}
                              onChange={(e) => updateDashboardSetting('company.autoRefresh', e.target.checked)}
                            />
                          }
                          label="Actualización automática de datos"
                        />

                        {dashboardSettings.company.autoRefresh && (
                          <Box>
                            <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Intervalo de actualización (segundos)</FormLabel>
                            <Slider
                              value={dashboardSettings.company.refreshInterval}
                              onChange={(e, value) => updateDashboardSetting('company.refreshInterval', value)}
                              min={10}
                              max={300}
                              step={10}
                              marks={[
                                { value: 10, label: '10s' },
                                { value: 60, label: '1m' },
                                { value: 300, label: '5m' }
                              ]}
                              valueLabelDisplay="auto"
                            />
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Info */}
                  <Alert severity="info">
                    <Typography variant="body2">
                      💡 <strong>Tip:</strong> Los cambios se guardan automáticamente. Puedes restablecer toda la configuración usando el botón "Restablecer" en la parte superior.
                    </Typography>
                  </Alert>
                </Stack>
              </TabPanel>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
}

// Helper functions
function getWidgetLabel(key) {
  const labels = {
    totalCommitments: 'Total de Compromisos',
    monthlyOverview: 'Resumen Mensual',
    upcomingPayments: 'Próximos Pagos',
    companyBreakdown: 'Desglose por Empresa',
    recentActivity: 'Actividad Reciente',
    analytics: 'Analytics y Gráficos'
  };
  return labels[key] || key;
}

function getNotificationLabel(key) {
  const labels = {
    upcomingPayments: 'Próximos pagos',
    overduePayments: 'Pagos vencidos',
    highAmount: 'Montos altos',
    systemUpdates: 'Actualizaciones del sistema'
  };
  return labels[key] || key;
}
