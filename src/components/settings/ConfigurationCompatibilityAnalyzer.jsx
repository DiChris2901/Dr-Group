/**
 * Configuration Compatibility Analyzer
 * Analiza la compatibilidad de configuraciones del SettingsContext con páginas específicas
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
  CircularProgress,
  Snackbar,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useSettings } from '../../context/SettingsContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const ConfigurationCompatibilityAnalyzer = ({ pageName, pageUrl, isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedConfigs, setSelectedConfigs] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // 🎨 Design System Spectacular - Configuraciones dinámicas
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;

  // Definición de compatibilidad por página
  const pageCompatibilityRules = {
    'NewCommitmentPage': {
      compatible: [
        // Configuraciones de Tema
        'theme.primaryColor',
        'theme.secondaryColor', 
        'theme.borderRadius',
        'theme.fontSize',
        'theme.animations',
        'theme.mode',
        'theme.fontFamily',
        'theme.fontWeight',
        
        // Configuraciones de Layout
        'sidebar.compactMode',
        
        // Configuraciones de Notificaciones
        'notifications.enabled',
        'notifications.sound',
        'notifications.desktop',
        
        // Configuraciones de Dashboard (algunas)
        'dashboard.behavior.animationsEnabled',
        'dashboard.behavior.showTooltips'
      ],
      notCompatible: [
        // Configuraciones específicas del Dashboard
        'dashboard.layout.columns',
        'dashboard.layout.cardSize',
        'dashboard.layout.density',
        'dashboard.layout.viewMode',
        'dashboard.widgets.stats',
        'dashboard.widgets.recentCommitments',
        'dashboard.widgets.upcomingPayments',
        'dashboard.widgets.monthlyChart',
        'dashboard.widgets.companiesOverview',
        'dashboard.widgets.quickActions',
        'dashboard.alerts.daysBeforeExpiry',
        'dashboard.alerts.emailNotifications',
        'dashboard.alerts.inAppNotifications',
        'dashboard.alerts.amountThreshold',
        'dashboard.behavior.autoRefresh',
        'dashboard.behavior.refreshInterval',
        'dashboard.behavior.defaultPeriod',
        'dashboard.appearance.chartType',
        'dashboard.appearance.showTrends',
        'dashboard.appearance.transparencyLevel',
        
        // Configuraciones de Sidebar no relevantes
        'sidebar.width',
        'sidebar.position',
        'sidebar.showIcons',
        'sidebar.showLabels',
        'sidebar.grouping',
        'sidebar.showActiveIndicator',
        'sidebar.animationSpeed',
        'sidebar.hoverDelay',
        'sidebar.persistState',
        
        // Notificaciones específicas no aplicables a formularios
        'notifications.email',
        'notifications.reminderDays',
        'notifications.overdueAlerts',
        'notifications.weeklyReport'
      ]
    }
  };

  // Función para obtener el valor anidado de un objeto
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Función para establecer el valor anidado de un objeto
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Analizar compatibilidad de configuraciones
  const analyzeCompatibility = () => {
    setLoading(true);
    
    const rules = pageCompatibilityRules[pageName] || { compatible: [], notCompatible: [] };
    const compatibleConfigs = [];
    const notCompatibleConfigs = [];
    
    // Analizar configuraciones compatibles
    rules.compatible.forEach(configPath => {
      const value = getNestedValue(settings, configPath);
      const pathParts = configPath.split('.');
      const category = pathParts[0];
      const setting = pathParts.slice(1).join('.');
      
      compatibleConfigs.push({
        path: configPath,
        category,
        setting,
        value,
        impact: getConfigImpact(configPath),
        description: getConfigDescription(configPath)
      });
    });

    // Analizar configuraciones no compatibles
    rules.notCompatible.forEach(configPath => {
      const value = getNestedValue(settings, configPath);
      const pathParts = configPath.split('.');
      const category = pathParts[0];
      const setting = pathParts.slice(1).join('.');
      
      notCompatibleConfigs.push({
        path: configPath,
        category,
        setting,
        value,
        reason: getIncompatibilityReason(configPath)
      });
    });

    setAnalysis({
      compatible: compatibleConfigs,
      notCompatible: notCompatibleConfigs,
      totalConfigs: compatibleConfigs.length + notCompatibleConfigs.length,
      compatibilityScore: Math.round((compatibleConfigs.length / (compatibleConfigs.length + notCompatibleConfigs.length)) * 100)
    });

    // Preseleccionar todas las configuraciones compatibles
    setSelectedConfigs(new Set(compatibleConfigs.map(config => config.path)));
    
    setLoading(false);
  };

  // Obtener impacto de la configuración
  const getConfigImpact = (configPath) => {
    const impacts = {
      'theme.primaryColor': 'Alto - Cambia colores de botones, iconos y gradientes',
      'theme.secondaryColor': 'Alto - Modifica colores secundarios y degradados',
      'theme.borderRadius': 'Medio - Ajusta el radio de bordes en cards y campos',
      'theme.fontSize': 'Medio - Escala el tamaño de fuente en toda la página',
      'theme.animations': 'Bajo - Habilita/deshabilita animaciones y transiciones',
      'theme.mode': 'Alto - Cambia entre tema claro y oscuro',
      'theme.fontFamily': 'Medio - Modifica la fuente utilizada',
      'theme.fontWeight': 'Bajo - Cambia el peso de fuente base',
      'sidebar.compactMode': 'Bajo - Ajusta el espaciado basado en el modo compacto',
      'notifications.enabled': 'Medio - Habilita/deshabilita notificaciones',
      'notifications.sound': 'Bajo - Controla sonidos de notificación',
      'notifications.desktop': 'Bajo - Controla notificaciones de escritorio',
      'dashboard.behavior.animationsEnabled': 'Bajo - Redundante con theme.animations',
      'dashboard.behavior.showTooltips': 'Bajo - Muestra/oculta tooltips informativos'
    };
    return impacts[configPath] || 'Impacto no especificado';
  };

  // Obtener descripción de la configuración
  const getConfigDescription = (configPath) => {
    const descriptions = {
      'theme.primaryColor': 'Color principal utilizado en gradientes, botones e iconos',
      'theme.secondaryColor': 'Color secundario para efectos y degradados',
      'theme.borderRadius': 'Radio de bordes aplicado a cards, papers y botones',
      'theme.fontSize': 'Tamaño base de fuente escalable para toda la interfaz',
      'theme.animations': 'Habilita animaciones de entrada, hover y transiciones',
      'theme.mode': 'Modo de tema (claro/oscuro) que afecta toda la apariencia',
      'theme.fontFamily': 'Familia tipográfica principal de la interfaz',
      'theme.fontWeight': 'Peso de fuente base para el texto',
      'sidebar.compactMode': 'Controla el espaciado en el layout basado en sidebar',
      'notifications.enabled': 'Controla si se muestran notificaciones al usuario',
      'notifications.sound': 'Reproduce sonidos cuando ocurren eventos',
      'notifications.desktop': 'Permite notificaciones del navegador',
      'dashboard.behavior.animationsEnabled': 'Control adicional de animaciones',
      'dashboard.behavior.showTooltips': 'Muestra información adicional en hover'
    };
    return descriptions[configPath] || 'Configuración del sistema';
  };

  // Obtener razón de incompatibilidad
  const getIncompatibilityReason = (configPath) => {
    if (configPath.startsWith('dashboard.layout')) return 'No aplica - Configuración específica del layout del dashboard';
    if (configPath.startsWith('dashboard.widgets')) return 'No aplica - Controla widgets específicos del dashboard';
    if (configPath.startsWith('dashboard.alerts')) return 'No aplica - Sistema de alertas específico del dashboard';
    if (configPath.startsWith('dashboard.appearance.chart')) return 'No aplica - Configuración específica de gráficos';
    if (configPath.includes('sidebar.') && !configPath.includes('compactMode')) return 'No aplica - Configuración específica del sidebar';
    if (configPath.includes('notifications.email') || configPath.includes('notifications.reminder')) return 'No aplica - Notificaciones específicas no relevantes para formularios';
    return 'No relevante para esta página';
  };

  // Obtener icono por categoría
  const getCategoryIcon = (category) => {
    const icons = {
      theme: <PaletteIcon sx={{ color: primaryColor }} />,
      dashboard: <DashboardIcon sx={{ color: primaryColor }} />,
      sidebar: <SettingsIcon sx={{ color: primaryColor }} />,
      notifications: <NotificationsIcon sx={{ color: primaryColor }} />,
      security: <SecurityIcon sx={{ color: primaryColor }} />
    };
    return icons[category] || <SettingsIcon sx={{ color: primaryColor }} />;
  };

  // Manejar selección de configuración
  const handleConfigToggle = (configPath) => {
    const newSelected = new Set(selectedConfigs);
    if (newSelected.has(configPath)) {
      newSelected.delete(configPath);
    } else {
      newSelected.add(configPath);
    }
    setSelectedConfigs(newSelected);
  };

  // Aplicar configuraciones seleccionadas
  const applySelectedConfigurations = async () => {
    setApplying(true);
    try {
      const configsToApply = analysis.compatible.filter(config => selectedConfigs.has(config.path));
      
      // Crear objeto de configuraciones a aplicar
      const newSettings = { ...settings };
      configsToApply.forEach(config => {
        setNestedValue(newSettings, config.path, config.value);
      });

      // Guardar en Firebase
      if (currentUser) {
        const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
        await setDoc(userSettingsRef, newSettings, { merge: true });
      }

      // Actualizar contexto local
      await updateSettings(newSettings);

      setSnackbar({
        open: true,
        message: `✅ ${configsToApply.length} configuraciones aplicadas exitosamente`,
        severity: 'success'
      });

      setShowApplyDialog(false);
      
      // Cerrar el analizador después de aplicar
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error applying configurations:', error);
      setSnackbar({
        open: true,
        message: '❌ Error al aplicar configuraciones. Inténtalo de nuevo.',
        severity: 'error'
      });
    } finally {
      setApplying(false);
    }
  };

  // Ejecutar análisis cuando se abre el componente
  useEffect(() => {
    if (isOpen && pageName) {
      analyzeCompatibility();
    }
  }, [isOpen, pageName, settings]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${borderRadius}px`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 20px 60px rgba(0, 0, 0, 0.5)' 
            : '0 20px 60px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${theme.palette.secondary.main} 100%)`,
              borderRadius: `${borderRadius / 2}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SettingsIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="700">
              Análisis de Compatibilidad de Configuraciones
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {pageName} • {pageUrl}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress size={50} />
          </Box>
        ) : analysis ? (
          <Grid container spacing={3}>
            {/* Resumen del Análisis */}
            <Grid item xs={12}>
              <Alert 
                severity="info" 
                icon={<InfoIcon />}
                sx={{ 
                  borderRadius: `${borderRadius}px`,
                  border: `1px solid ${theme.palette.info.main}`,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(33, 150, 243, 0.1)' 
                    : 'rgba(33, 150, 243, 0.05)'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  📊 Resumen del Análisis
                </Typography>
                <Typography variant="body2">
                  <strong>Compatibilidad: {analysis.compatibilityScore}%</strong> • 
                  {' '}{analysis.compatible.length} configuraciones compatibles • 
                  {' '}{analysis.notCompatible.length} configuraciones omitidas
                </Typography>
              </Alert>
            </Grid>

            {/* Configuraciones Compatibles */}
            <Grid item xs={12} md={7}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: `${borderRadius}px`,
                  border: `1px solid ${theme.palette.success.main}`,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(76, 175, 80, 0.1)' 
                    : 'rgba(76, 175, 80, 0.05)'
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="600">
                      Configuraciones Compatibles ({analysis.compatible.length})
                    </Typography>
                  </Box>
                  
                  <List>
                    {analysis.compatible.map((config, index) => (
                      <ListItem 
                        key={config.path}
                        sx={{ 
                          borderRadius: `${borderRadius / 2}px`,
                          mb: 1,
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <ListItemIcon>
                          {getCategoryIcon(config.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                {config.setting}
                              </Typography>
                              <Chip 
                                label={config.category} 
                                size="small" 
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {config.description}
                              </Typography>
                              <br />
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                                {config.impact}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedConfigs.has(config.path)}
                                onChange={() => handleConfigToggle(config.path)}
                                color="primary"
                              />
                            }
                            label=""
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Configuraciones No Compatibles */}
            <Grid item xs={12} md={5}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: `${borderRadius}px`,
                  border: `1px solid ${theme.palette.warning.main}`,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 152, 0, 0.1)' 
                    : 'rgba(255, 152, 0, 0.05)'
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <CancelIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="600">
                      Configuraciones Omitidas ({analysis.notCompatible.length})
                    </Typography>
                  </Box>
                  
                  <List>
                    {analysis.notCompatible.slice(0, 8).map((config, index) => (
                      <ListItem 
                        key={config.path}
                        sx={{ 
                          borderRadius: `${borderRadius / 2}px`,
                          mb: 1,
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.03)' 
                            : 'rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <ListItemIcon>
                          {getCategoryIcon(config.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="500">
                              {config.setting}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {config.reason}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                    {analysis.notCompatible.length > 8 && (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                        ... y {analysis.notCompatible.length - 8} más
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: `${borderRadius}px` }}
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={() => setShowApplyDialog(true)}
          variant="contained"
          disabled={!analysis || selectedConfigs.size === 0}
          startIcon={<SaveIcon />}
          sx={{ 
            borderRadius: `${borderRadius}px`,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${theme.palette.secondary.main} 100%)`,
            minWidth: 200
          }}
        >
          Aplicar {selectedConfigs.size} Configuraciones
        </Button>
      </DialogActions>

      {/* Dialog de Confirmación */}
      <Dialog 
        open={showApplyDialog} 
        onClose={() => setShowApplyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          ⚠️ Confirmar Aplicación de Configuraciones
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: `${borderRadius}px` }}>
            <Typography variant="body2">
              Se aplicarán <strong>{selectedConfigs.size} configuraciones</strong> a la página {pageName}.
              Los cambios se guardarán en Firebase y serán visibles inmediatamente.
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowApplyDialog(false)}
            disabled={applying}
          >
            Cancelar
          </Button>
          <Button 
            onClick={applySelectedConfigurations}
            variant="contained"
            disabled={applying}
            startIcon={applying ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: `${borderRadius}px` }}
          >
            {applying ? 'Aplicando...' : 'Confirmar y Aplicar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: `${borderRadius}px` }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ConfigurationCompatibilityAnalyzer;
