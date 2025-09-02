/**
 * Professional Settings Drawer with Tabs
 * Complete configuration system for DR Group Dashboard
 * Enhanced with Spectacular Design System effects
 */

// Inyectar estilos CSS para animaciones spectacular
const spectacularStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%) skewX(-15deg); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { 
      box-shadow: 0 0 8px rgba(102, 126, 234, 0.3);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 25px rgba(102, 126, 234, 0.7);
      transform: scale(1.02);
    }
  }
  
  @keyframes gradient-shift {
    0%, 100% { 
      background-position: 0% 50%;
    }
    50% { 
      background-position: 100% 50%;
    }
  }

  @keyframes title-underline {
    0%, 100% { width: 0%; opacity: 0.3; }
    25% { width: 100%; opacity: 1; }
    75% { width: 100%; opacity: 1; }
  }

  @keyframes icon-pulse {
    0%, 100% { 
      transform: scale(1) rotate(0deg);
      filter: brightness(1) saturate(1);
    }
    25% { 
      transform: scale(1.05) rotate(2deg);
      filter: brightness(1.1) saturate(1.2);
    }
    75% { 
      transform: scale(1.05) rotate(-2deg);
      filter: brightness(1.1) saturate(1.2);
    }
  }

  @keyframes tab-glow {
    0%, 100% { 
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }
    50% { 
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined' && !document.getElementById('settings-spectacular-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'settings-spectacular-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = spectacularStyles;
  document.head.appendChild(styleSheet);
}

import React, { useState, useEffect } from 'react';
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
  Badge,
  Snackbar,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  TableChart as TableIcon,
  BarChart as ChartBarIcon,
  ShowChart as ChartLineIcon,
  DonutSmall as ChartDonutIcon,
  PieChart as ChartPieIcon,
  Timeline as ChartAreaIcon,
  ScatterPlot as ChartScatterIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  TextFields as TextFieldsIcon,
  FormatSize as FormatSizeIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Devices as DevicesIcon,
  Email as EmailIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  ExitToApp as LogoutIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Contrast as ContrastIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { primaryColorPresets } from '../../theme/colorPresets';
import { auth, db } from '../../config/firebase';
import { signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper functions for chart configuration
const getChartTypeIcon = (type, size = 24) => {
  const iconProps = { sx: { fontSize: size, color: 'primary.main' } };
  switch (type) {
    case 'bar': return <ChartBarIcon {...iconProps} />;
    case 'line': return <ChartLineIcon {...iconProps} />;
    case 'pie': return <ChartPieIcon {...iconProps} />;
    case 'donut': return <ChartDonutIcon {...iconProps} />;
    case 'area': return <ChartAreaIcon {...iconProps} />;
    case 'scatter': return <ChartScatterIcon {...iconProps} />;
    default: return <ChartBarIcon {...iconProps} />;
  }
};

const getChartTypeName = (type) => {
  switch (type) {
    case 'bar': return 'Gráfica de Barras';
    case 'line': return 'Gráfica de Líneas';
    case 'pie': return 'Gráfica Circular';
    case 'donut': return 'Gráfica de Dona';
    case 'area': return 'Gráfica de Área';
    case 'scatter': return 'Gráfica de Dispersión';
    default: return 'Gráfica de Barras';
  }
};

const getChartTypeDescription = (type) => {
  switch (type) {
    case 'bar': return 'Ideal para comparar cantidades entre categorías';
    case 'line': return 'Perfecta para mostrar tendencias en el tiempo';
    case 'pie': return 'Excelente para mostrar proporciones del total';
    case 'donut': return 'Similar al circular pero con espacio central';
    case 'area': return 'Muestra evolución acumulativa en el tiempo';
    case 'scatter': return 'Ideal para mostrar correlaciones entre variables';
    default: return 'Gráfica versátil para múltiples propósitos';
  }
};

const getChartSchemeDescription = (scheme) => {
  switch (scheme) {
    case 'corporate': return 'presentaciones empresariales y reportes formales';
    case 'vibrant': return 'dashboards dinámicos y presentaciones llamativas';
    case 'pastel': return 'interfaces suaves y amigables';
    case 'monochrome': return 'reportes minimalistas y elegantes';
    case 'ocean': return 'temas relacionados con datos y tecnología';
    default: return 'uso general';
  }
};

const getChartSchemeName = (scheme) => {
  switch (scheme) {
    case 'corporate': return 'Corporativo';
    case 'vibrant': return 'Vibrante';
    case 'pastel': return 'Pastel';
    case 'monochrome': return 'Monocromático';
    case 'ocean': return 'Océano';
    default: return 'Corporativo';
  }
};

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
  const { settings, updateSettings, resetSettings, applyPredefinedTheme, defaultSettings, loading: settingsLoading, error: settingsError } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Estados para seguridad
  const [loginHistory, setLoginHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [securityNotifications, setSecurityNotifications] = useState({
    emailAlerts: true,
    loginAlerts: true,
    suspiciousActivity: true
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Función para restaurar configuración
  const handleResetSettings = async () => {
    try {
      setSaveMessage('Restaurando configuraciones...');
      setShowSaveSuccess(true);
      
      await resetSettings();
      
      setTimeout(() => {
        setSaveMessage('Configuración restaurada a valores por defecto');
      }, 1000);
      
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
    } catch (error) {
      setSaveMessage('Error al restaurar configuración');
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
    }
  };

  // Funciones de seguridad
  const loadLoginHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const historyRef = collection(db, 'loginHistory');
      const q = query(
        historyRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setLoginHistory(history);
    } catch (error) {
      console.error('Error loading login history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadActiveSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const sessionsRef = collection(db, 'activeSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', user.uid),
        orderBy('lastActivity', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastActivity: doc.data().lastActivity?.toDate()
      }));
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      setSaveMessage('Cerrando sesión en todos los dispositivos...');
      setShowSaveSuccess(true);
      
      // Eliminar todas las sesiones activas de Firestore
      const sessionsRef = collection(db, 'activeSessions');
      const q = query(sessionsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Cerrar sesión del usuario actual
      await signOut(auth);
      
      setSaveMessage('Sesión cerrada en todos los dispositivos');
      onClose();
    } catch (error) {
      console.error('Error logging out from all devices:', error);
      setSaveMessage('Error al cerrar sesiones');
    }
  };

  const updateSecurityNotifications = async (key, value) => {
    if (!user) return;
    
    const newSettings = { ...securityNotifications, [key]: value };
    setSecurityNotifications(newSettings);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        securityNotifications: newSettings
      });
      setSaveMessage('Configuración de notificaciones actualizada');
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating security notifications:', error);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'smartphone':
        return <SmartphoneIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  // Cargar datos al abrir la pestaña de seguridad
  React.useEffect(() => {
    if (activeTab === 3 && user) { // Pestaña de seguridad
      loadLoginHistory();
      loadActiveSessions();
    }
  }, [activeTab, user]);

  // Valores por defecto para dashboard settings
  const defaultDashboard = {
    layout: {
      columns: 3,
      cardSize: 'medium',
      density: 'normal',
      viewMode: 'grid'
    },
    charts: {
      defaultType: 'bar',
      animations: 'smooth',
      colorScheme: 'corporate',
      // Configuraciones específicas por gráfica
      statusChart: {
        type: 'pie',
        enabled: true
      },
      trendChart: {
        type: 'bar',
        enabled: true
      }
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
    
    // 🔄 Sincronización: Mantener charts.defaultType y appearance.chartType alineados
    if (path === 'charts.defaultType') {
      // Si se cambia charts.defaultType, actualizar también appearance.chartType
      if (!updatedDashboard.appearance) updatedDashboard.appearance = {};
      updatedDashboard.appearance.chartType = value;
    } else if (path === 'appearance.chartType') {
      // Si se cambia appearance.chartType, actualizar también charts.defaultType
      if (!updatedDashboard.charts) updatedDashboard.charts = {};
      updatedDashboard.charts.defaultType = value;
    }
    
    updateSettings('dashboard', updatedDashboard);
  };

  const colorOptions = Object.entries(primaryColorPresets).map(([key, preset]) => ({
    key,
    name: preset.name,
    colors: preset
  }));

  // Familias de fuente mejoradas
  const fontFamilies = [
    { value: 'Inter', label: 'Inter', recommended: true, description: 'Moderna y legible para interfaces' },
    { value: 'Roboto', label: 'Roboto', recommended: true, description: 'Diseñada por Google para pantallas' },
    { value: 'Poppins', label: 'Poppins', recommended: false, description: 'Geométrica y amigable' },
    { value: 'Open Sans', label: 'Open Sans', recommended: false, description: 'Humanista y neutral' },
    { value: 'Lato', label: 'Lato', recommended: false, description: 'Semi-redondeada y elegante' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro', recommended: false, description: 'Diseñada por Adobe' },
    { value: 'Nunito Sans', label: 'Nunito Sans', recommended: false, description: 'Redondeada y moderna' }
  ];

  const tabs = [
    { label: 'Tema', icon: <PaletteIcon /> },
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Notificaciones', icon: <NotificationsIcon /> },
    { label: 'Seguridad', icon: <SecurityIcon /> }
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100vw', sm: 520, md: 600, lg: 650 },
          background: theme.palette.background.paper,
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          zIndex: 1300,
          position: 'relative'
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
            initial={settings?.theme?.animations ? { x: 300, opacity: 0 } : { opacity: 0 }}
            animate={settings?.theme?.animations ? { x: 0, opacity: 1 } : { opacity: 1 }}
            exit={settings?.theme?.animations ? { x: 300, opacity: 0 } : { opacity: 0 }}
            transition={settings?.theme?.animations ? 
              { type: 'spring', damping: 25, stiffness: 200 } : 
              { duration: 0.1 }
            }
            style={{ height: '100%' }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                background: theme.palette.background.paper,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 4,
                      background: settings?.theme?.primaryColor || '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: settings?.theme?.animations ? 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                      '&::before': settings?.theme?.animations ? {
                        content: '""',
                        position: 'absolute',
                        top: '-50%',
                        left: '-100%',
                        width: '200%',
                        height: '200%',
                        background: `conic-gradient(from 45deg, 
                          transparent 0deg,
                          ${alpha('#ffffff', 0.1)} 90deg,
                          ${alpha('#ffffff', 0.2)} 180deg,
                          ${alpha('#ffffff', 0.1)} 270deg,
                          transparent 360deg
                        )`,
                        animation: 'icon-pulse 5s ease-in-out infinite',
                        borderRadius: '50%'
                      } : {},
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: '2px',
                        borderRadius: 'inherit',
                        background: `linear-gradient(135deg, 
                          ${alpha('#ffffff', theme.palette.mode === 'dark' ? 0.05 : 0.15)} 0%, 
                          transparent 50%,
                          ${alpha('#000000', 0.08)} 100%
                        )`,
                        pointerEvents: 'none'
                      },
                      '&:hover': settings?.theme?.animations ? {
                        transform: 'translateY(-4px) scale(1.08) rotate(8deg)',
                        boxShadow: `
                          0 12px 40px ${alpha(settings?.theme?.primaryColor || '#667eea', 0.5)},
                          0 4px 12px ${alpha(settings?.theme?.primaryColor || '#667eea', 0.3)}
                        `
                      } : {}
                    }}
                  >
                    <SettingsIcon sx={{ 
                      color: 'white', 
                      fontSize: 24
                    }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary,
                      fontSize: '20px'
                    }}>
                      Configuración
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        fontSize: `${(settings?.theme?.fontSize || 14) - 1}px`,
                        fontWeight: 500,
                        background: `linear-gradient(90deg, 
                          ${alpha(settings?.theme?.primaryColor || '#667eea', 0.7)} 0%, 
                          ${alpha(settings?.theme?.secondaryColor || '#764ba2', 0.7)} 100%
                        )`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        Personaliza tu dashboard
                      </Typography>
                      {settingsLoading && (
                        <Chip
                          label="Sincronizando..."
                          size="small"
                          color="primary"
                          sx={{ 
                            fontSize: `${(settings?.theme?.fontSize || 14) - 4}px`, 
                            height: 18,
                            borderRadius: `${(settings?.theme?.borderRadius || 8) / 2}px`
                          }}
                        />
                      )}
                      {settingsError && (
                        <Chip
                          label="Error de sincronización"
                          size="small"
                          color="error"
                          sx={{ 
                            fontSize: `${(settings?.theme?.fontSize || 14) - 4}px`, 
                            height: 18,
                            borderRadius: `${(settings?.theme?.borderRadius || 8) / 2}px`
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Restablecer configuración">
                    <IconButton
                      onClick={handleResetSettings}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          background: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main'
                        }
                      }}
                    >
                      <SettingsIcon />
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
              background: `linear-gradient(135deg, 
                ${alpha(settings?.theme?.primaryColor || '#667eea', 0.02)} 0%, 
                ${alpha(theme.palette.background.default, 0.95)} 50%,
                ${alpha(settings?.theme?.secondaryColor || '#764ba2', 0.02)} 100%
              )`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: `linear-gradient(90deg, 
                  transparent 0%, 
                  ${alpha(settings?.theme?.primaryColor || '#667eea', 0.3)} 20%,
                  ${alpha(settings?.theme?.secondaryColor || '#764ba2', 0.3)} 80%,
                  transparent 100%
                )`,
              }
            }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: 56,
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 2,
                    borderRadius: '1px 1px 0 0',
                    background: settings?.theme?.primaryColor || '#667eea',
                  },
                  '& .MuiTab-root': {
                    minHeight: 56,
                    minWidth: { xs: 120, sm: 140 },
                    maxWidth: { xs: 160, sm: 180 },
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: alpha(theme.palette.text.primary, 0.7),
                    padding: '10px 16px',
                    margin: '0 4px',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main
                    },
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600
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
                              fontSize: `${(settings?.theme?.fontSize || 14) - 4}px`,
                              backgroundColor: alpha(theme.palette.warning.main, 0.15),
                              color: theme.palette.warning.main,
                              borderRadius: `${(settings?.theme?.borderRadius || 8) / 2}px`,
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
                  {/* Temas Predefinidos */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#9c27b0', // Purple for themes
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <AutoAwesomeIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Temas Predefinidos
                        <Tooltip title="Aplica configuraciones completas con un solo clic">
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
                        </Tooltip>
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(defaultSettings.predefinedThemes).map(([themeKey, themeConfig]) => (
                          <Grid item xs={12} sm={6} md={4} key={themeKey}>
                            <Card
                              sx={{
                                cursor: 'pointer',
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                borderRadius: `${(settings?.theme?.borderRadius || 8)}px`,
                                background: theme.palette.background.paper,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                                  borderColor: themeConfig.primaryColor
                                }
                              }}
                              onClick={() => applyPredefinedTheme(themeKey)}
                            >
                              {/* Theme preview background */}
                              <Box sx={{
                                height: 60,
                                background: themeConfig.mode === 'dark' 
                                  ? `linear-gradient(135deg, ${themeConfig.primaryColor}22 0%, ${themeConfig.secondaryColor}22 100%)`
                                  : `linear-gradient(135deg, ${themeConfig.primaryColor}33 0%, ${themeConfig.secondaryColor}33 100%)`,
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Box sx={{
                                  display: 'flex',
                                  gap: 0.5,
                                  alignItems: 'center'
                                }}>
                                  <Box sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: themeConfig.primaryColor
                                  }} />
                                  <Box sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: themeConfig.secondaryColor
                                  }} />
                                  <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: alpha(themeConfig.primaryColor, 0.6)
                                  }} />
                                </Box>
                              </Box>
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2" sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.text.primary,
                                  mb: 0.5
                                }}>
                                  {themeConfig.name}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                  lineHeight: 1.3
                                }}>
                                  {themeConfig.description}
                                </Typography>
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1, 
                                  mt: 1,
                                  alignItems: 'center'
                                }}>
                                  <Chip 
                                    label={themeConfig.mode === 'dark' ? '🌙' : '☀️'}
                                    size="small"
                                    sx={{ 
                                      fontSize: '0.65rem',
                                      height: 20,
                                      minWidth: 'auto',
                                      '& .MuiChip-label': { px: 1 }
                                    }}
                                  />
                                  <Chip 
                                    label={themeConfig.fontFamily}
                                    size="small"
                                    sx={{ 
                                      fontSize: '0.65rem',
                                      height: 20,
                                      backgroundColor: alpha(themeConfig.primaryColor, 0.1),
                                      color: themeConfig.primaryColor,
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Color Presets */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#e91e63', // Elegant Pink
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <PaletteIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Paleta de Colores
                        <Tooltip title="Elige el color principal que se aplicará en toda la interfaz">
                          <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
                        </Tooltip>
                      </Typography>
                      <Grid container spacing={1.5}>
                        {colorOptions.map(({ key, name, colors }) => (
                          <Grid item xs={6} sm={4} key={key}>
                            <Tooltip 
                              title={`${name} - Ideal para interfaces ${name.toLowerCase().includes('azul') ? 'corporativas' : name.toLowerCase().includes('verde') ? 'de crecimiento' : name.toLowerCase().includes('morado') ? 'creativas' : 'modernas'}`}
                              placement="top"
                            >
                              <Card
                                sx={{
                                  cursor: 'pointer',
                                  border: settings?.theme?.primaryColor === colors.main 
                                    ? `2px solid ${colors.main}` 
                                    : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                  borderRadius: `${(settings?.theme?.borderRadius || 8)}px`,
                                  background: theme.palette.background.paper,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px ${alpha(colors.main, 0.15)}`,
                                    borderColor: colors.main
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
                                    height: 36,
                                    borderRadius: `${(settings?.theme?.borderRadius || 8)}px`,
                                    background: colors.main,
                                    mb: 1.5,
                                    boxShadow: `0 2px 8px ${alpha(colors.main, 0.15)}`
                                  }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {name}
                                </Typography>
                              </CardContent>
                            </Card>
                            </Tooltip>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Mode Selection */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#ff9800', // Finance Gold
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <ContrastIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Modo de Tema
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant={settings?.theme?.mode === 'light' ? 'contained' : 'outlined'}
                          onClick={() => updateSettings('theme', { 
                            ...settings.theme, 
                            mode: 'light' 
                          })}
                          sx={{ 
                            flex: 1, 
                            py: 1.5, 
                            borderRadius: `${(settings?.theme?.borderRadius || 8)}px`,
                            fontWeight: 500,
                            textTransform: 'none',
                            ...(settings?.theme?.mode === 'light' ? {
                              backgroundColor: '#ffa500',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#ff8c00'
                              }
                            } : {
                              borderColor: alpha(theme.palette.divider, 0.3),
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                borderColor: '#ffa500',
                                backgroundColor: alpha('#ffa500', 0.08)
                              }
                            })
                          }}
                        >
                          ☀️ Claro
                        </Button>
                        <Button
                          variant={settings?.theme?.mode === 'dark' ? 'contained' : 'outlined'}
                          onClick={() => updateSettings('theme', { 
                            ...settings.theme, 
                            mode: 'dark' 
                          })}
                          sx={{ 
                            flex: 1, 
                            py: 1.5,
                            borderRadius: `${(settings?.theme?.borderRadius || 8)}px`,
                            fontWeight: 500,
                            textTransform: 'none',
                            ...(settings?.theme?.mode === 'dark' ? {
                              backgroundColor: '#3498db',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#2980b9'
                              }
                            } : {
                              borderColor: alpha(theme.palette.divider, 0.3),
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                borderColor: '#3498db',
                                backgroundColor: alpha('#3498db', 0.08)
                              }
                            })
                          }}
                        >
                          🌙 Oscuro
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Advanced Options */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#009688', // Modern Teal
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <SettingsIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Opciones Avanzadas
                      </Typography>
                      <Stack spacing={2}>
                        <Tooltip 
                          title="Las animaciones mejoran la experiencia visual pero pueden afectar el rendimiento en dispositivos lentos" 
                          placement="top"
                          arrow
                        >
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
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Habilitar animaciones
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </Box>
                            }
                          />
                        </Tooltip>
                        <Tooltip 
                          title="El modo compacto reduce espacios y tamaños para mostrar más información en pantalla. Ideal para pantallas pequeñas o usuarios que prefieren una interfaz más densa" 
                          placement="top"
                          arrow
                        >
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
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Modo compacto
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </Box>
                            }
                          />
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Typography Settings */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#3f51b5', // Tech Indigo
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <TextFieldsIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Tipografía
                      </Typography>
                      <Stack spacing={3}>
                        {/* Font Family */}
                        <FormControl fullWidth>
                          <Tooltip 
                            title="Selecciona la familia de fuente para toda la aplicación. Inter es la recomendada por su excelente legibilidad en pantallas digitales" 
                            placement="top" 
                            arrow
                          >
                            <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                              Familia de Fuente
                              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </FormLabel>
                          </Tooltip>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                Inter
                                <Chip label="Recomendada" size="small" color="primary" sx={{ ml: 1 }} />
                              </Box>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                Sistema (system-ui)
                                <Chip label="Rápida" size="small" color="success" sx={{ ml: 1 }} />
                              </Box>
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
                          <Tooltip 
                            title="Ajusta el tamaño base de la fuente. El resto de elementos se escalarán proporcionalmente" 
                            placement="top" 
                            arrow
                          >
                            <FormLabel sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FormatSizeIcon sx={{ fontSize: 18 }} />
                              Tamaño de Fuente Base: {settings?.theme?.fontSize || 14}px
                              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </FormLabel>
                          </Tooltip>
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
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#1976d2', // Corporate Blue
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <GridIcon sx={{ fontSize: 20 }} />
                        </Box>
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
                            sx={{
                              borderRadius: 2,
                              background: alpha(theme.palette.background.paper, 0.8),
                              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                              '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: '8px !important',
                                mx: 0.5,
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                  background: settings?.theme?.primaryColor || '#667eea',
                                  color: 'white',
                                  boxShadow: `0 2px 8px ${alpha(settings?.theme?.primaryColor || '#667eea', 0.2)}`,
                                  '&:hover': {
                                    background: settings?.theme?.primaryColor || '#667eea',
                                    opacity: 0.9
                                  }
                                },
                                '&:hover': {
                                  backgroundColor: alpha(settings?.theme?.primaryColor || '#667eea', 0.08)
                                }
                              }
                            }}
                          >
                            <ToggleButton value="grid">
                              <GridIcon sx={{ mr: 1 }} />
                              Cuadrícula
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

                  {/* Chart Type Configuration */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#4caf50', // Success Green
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <ChartBarIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Tipos de Gráficas
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {/* Default Chart Type */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <Tooltip 
                              title="Selecciona el tipo de gráfica predeterminado para los widgets del dashboard. Cada widget puede tener su propio tipo si es compatible" 
                              placement="top" 
                              arrow
                            >
                              <FormLabel sx={{ 
                                mb: 1, 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center', // Centrar verticalmente
                                gap: 1,
                                minHeight: '32px' // Altura más razonable
                              }}>
                                Tipo de Gráfica
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </FormLabel>
                            </Tooltip>
                            <Select
                              value={dashboardSettings.charts?.defaultType || dashboardSettings.appearance?.chartType || 'bar'}
                              onChange={(e) => updateDashboardSetting('charts.defaultType', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="bar">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartBarIcon sx={{ fontSize: 18 }} />
                                  Barras
                                </Box>
                              </MenuItem>
                              <MenuItem value="line">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartLineIcon sx={{ fontSize: 18 }} />
                                  Líneas
                                </Box>
                              </MenuItem>
                              <MenuItem value="pie">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartPieIcon sx={{ fontSize: 18 }} />
                                  Círculos (Pie)
                                </Box>
                              </MenuItem>
                              <MenuItem value="donut">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartDonutIcon sx={{ fontSize: 18 }} />
                                  Dona (Donut)
                                </Box>
                              </MenuItem>
                              <MenuItem value="area">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartAreaIcon sx={{ fontSize: 18 }} />
                                  Área
                                </Box>
                              </MenuItem>
                              <MenuItem value="scatter">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartScatterIcon sx={{ fontSize: 18 }} />
                                  Dispersión
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Chart Animation */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <Tooltip 
                              title="Las animaciones en gráficas mejoran la experiencia visual pero pueden afectar el rendimiento" 
                              placement="top" 
                              arrow
                            >
                              <FormLabel sx={{ 
                                mb: 1, 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center', // Centrar verticalmente
                                gap: 1,
                                minHeight: '32px' // Altura más razonable
                              }}>
                                Animaciones
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </FormLabel>
                            </Tooltip>
                            <Select
                              value={dashboardSettings.charts?.animations || 'smooth'}
                              onChange={(e) => updateDashboardSetting('charts.animations', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="none">Sin Animaciones</MenuItem>
                              <MenuItem value="smooth">Suaves</MenuItem>
                              <MenuItem value="bounce">Con Rebote</MenuItem>
                              <MenuItem value="elastic">Elásticas</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Specific Chart Configurations */}
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600, 
                            mb: 2,
                            color: 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <Box sx={{
                              p: 0.5,
                              borderRadius: 1,
                              backgroundColor: alpha(theme.palette.success.main, 0.15),
                              color: 'success.main'
                            }}>
                              <GridIcon sx={{ fontSize: 16 }} />
                            </Box>
                            Configuración Individual de Gráficas
                          </Typography>
                        </Grid>

                        {/* Status Chart Type */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <Tooltip 
                              title="Configura el tipo de gráfica para la distribución por estado" 
                              placement="top" 
                              arrow
                            >
                              <FormLabel sx={{ 
                                mb: 1, 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1,
                                minHeight: '32px'
                              }}>
                                Distribución por Estado
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </FormLabel>
                            </Tooltip>
                            <Select
                              value={dashboardSettings.charts?.statusChart?.type || 'pie'}
                              onChange={(e) => updateDashboardSetting('charts.statusChart.type', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="bar">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartBarIcon sx={{ fontSize: 18 }} />
                                  Barras
                                </Box>
                              </MenuItem>
                              <MenuItem value="line">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartLineIcon sx={{ fontSize: 18 }} />
                                  Líneas
                                </Box>
                              </MenuItem>
                              <MenuItem value="pie">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartPieIcon sx={{ fontSize: 18 }} />
                                  Círculos (Pie)
                                </Box>
                              </MenuItem>
                              <MenuItem value="donut">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartDonutIcon sx={{ fontSize: 18 }} />
                                  Dona (Donut)
                                </Box>
                              </MenuItem>
                              <MenuItem value="area">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartAreaIcon sx={{ fontSize: 18 }} />
                                  Área
                                </Box>
                              </MenuItem>
                              <MenuItem value="scatter">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartScatterIcon sx={{ fontSize: 18 }} />
                                  Dispersión
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Trend Chart Type */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <Tooltip 
                              title="Configura el tipo de gráfica para la tendencia mensual" 
                              placement="top" 
                              arrow
                            >
                              <FormLabel sx={{ 
                                mb: 1, 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1,
                                minHeight: '32px'
                              }}>
                                Tendencia Mensual
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </FormLabel>
                            </Tooltip>
                            <Select
                              value={dashboardSettings.charts?.trendChart?.type || 'bar'}
                              onChange={(e) => updateDashboardSetting('charts.trendChart.type', e.target.value)}
                              size="small"
                            >
                              <MenuItem value="bar">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartBarIcon sx={{ fontSize: 18 }} />
                                  Barras
                                </Box>
                              </MenuItem>
                              <MenuItem value="line">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartLineIcon sx={{ fontSize: 18 }} />
                                  Líneas
                                </Box>
                              </MenuItem>
                              <MenuItem value="pie">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartPieIcon sx={{ fontSize: 18 }} />
                                  Círculos (Pie)
                                </Box>
                              </MenuItem>
                              <MenuItem value="donut">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartDonutIcon sx={{ fontSize: 18 }} />
                                  Dona (Donut)
                                </Box>
                              </MenuItem>
                              <MenuItem value="area">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartAreaIcon sx={{ fontSize: 18 }} />
                                  Área
                                </Box>
                              </MenuItem>
                              <MenuItem value="scatter">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ChartScatterIcon sx={{ fontSize: 18 }} />
                                  Dispersión
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Chart Colors */}
                        <Grid item xs={12}>
                          <FormLabel sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PaletteIcon sx={{ fontSize: 18 }} />
                            Esquema de Colores para Gráficas
                          </FormLabel>
                          <Grid container spacing={1}>
                            {[
                              { name: 'Corporativo', colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'], value: 'corporate' },
                              { name: 'Vibrante', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'], value: 'vibrant' },
                              { name: 'Pastel', colors: ['#a8e6cf', '#dcedc8', '#ffd3a5', '#fd9853', '#e1bee7'], value: 'pastel' },
                              { name: 'Monocromático', colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7'], value: 'monochrome' },
                              { name: 'Océano', colors: ['#667eea', '#764ba2', '#4facfe', '#00f2fe', '#667eea'], value: 'ocean' }
                            ].map(({ name, colors, value }) => (
                              <Grid item xs={6} sm={4} md={2.4} key={value}>
                                <Tooltip title={`Esquema ${name}: ideal para ${getChartSchemeDescription(value)}`} arrow>
                                  <Card
                                    sx={{
                                      p: 1.5,
                                      cursor: 'pointer',
                                      borderRadius: 2,
                                      border: dashboardSettings.charts?.colorScheme === value ? 
                                        `2px solid ${colors[0]}` : 
                                        `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                      background: theme.palette.background.paper,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${alpha(colors[0], 0.15)}`,
                                        borderColor: colors[0]
                                      }
                                    }}
                                    onClick={() => updateDashboardSetting('charts.colorScheme', value)}
                                  >
                                    <Box sx={{ 
                                      display: 'flex', 
                                      mb: 1.5, 
                                      height: 24,
                                      borderRadius: `${(settings?.theme?.borderRadius || 8) * 0.75}px`,
                                      overflow: 'hidden',
                                      boxShadow: `0 2px 8px ${alpha(colors[0], 0.2)}`,
                                      border: `1px solid ${alpha(colors[0], 0.1)}`
                                    }}>
                                      {colors.map((color, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            flex: 1,
                                            backgroundColor: color,
                                            position: 'relative',
                                            transition: settings?.theme?.animations ? 'all 0.3s ease' : 'none',
                                            '&:hover': settings?.theme?.animations ? {
                                              transform: 'scaleY(1.1)',
                                              zIndex: 1
                                            } : {},
                                            '&::after': {
                                              content: '""',
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              right: 0,
                                              bottom: 0,
                                              background: `linear-gradient(135deg, 
                                                ${alpha('#ffffff', 0.2)} 0%, 
                                                transparent 50%, 
                                                ${alpha('#000000', 0.1)} 100%
                                              )`,
                                              pointerEvents: 'none'
                                            }
                                          }}
                                        />
                                      ))}
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', display: 'block' }}>
                                      {name}
                                    </Typography>
                                  </Card>
                                </Tooltip>
                              </Grid>
                            ))}
                          </Grid>
                        </Grid>

                        {/* Chart Preview */}
                        <Grid item xs={12}>
                          <Box 
                            sx={{ 
                              p: 3, 
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                              backgroundColor: alpha(theme.palette.background.paper, 0.5)
                            }}
                          >
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              Vista Previa de Gráficas
                              {getChartTypeIcon(dashboardSettings.charts?.defaultType || 'bar')}
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ 
                                  height: 120, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  border: `1px dashed ${theme.palette.divider}`,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                                }}>
                                  {getChartTypeIcon(dashboardSettings.charts?.defaultType || 'bar', 48)}
                                  <Box sx={{ ml: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                      {getChartTypeName(dashboardSettings.charts?.defaultType || 'bar')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {getChartTypeDescription(dashboardSettings.charts?.defaultType || 'bar')}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Configuración Actual:</Typography>
                                  <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2">Tipo:</Typography>
                                      <Chip size="small" label={getChartTypeName(dashboardSettings.charts?.defaultType || 'bar')} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2">Animación:</Typography>
                                      <Chip size="small" label={dashboardSettings.charts?.animations || 'Suaves'} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2">Esquema:</Typography>
                                      <Chip size="small" label={getChartSchemeName(dashboardSettings.charts?.colorScheme || 'corporate')} />
                                    </Box>
                                  </Stack>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </TabPanel>

              {/* NOTIFICACIONES TAB */}
              <TabPanel value={activeTab} index={2}>
                <Stack spacing={3}>
                  {/* Notifications Main Settings */}
                  <Card sx={{ 
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    position: 'relative'
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#ff5722', // Creative Orange
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <NotificationsIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Configuración General
                      </Typography>

                      <Tooltip 
                        title="Activa o desactiva todas las notificaciones del sistema. Cuando está deshabilitado, no recibirás ninguna alerta." 
                        placement="top" 
                        arrow
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.notifications?.enabled || false}
                              onChange={(e) => {
                                updateSettings({
                                  notifications: {
                                    ...settings.notifications,
                                    enabled: e.target.checked
                                  }
                                });
                                // Feedback visual
                                if (e.target.checked) {
                                  setSaveMessage('Notificaciones habilitadas');
                                } else {
                                  setSaveMessage('Notificaciones deshabilitadas');
                                }
                                setShowSaveSuccess(true);
                                setTimeout(() => setShowSaveSuccess(false), 2000);
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              Habilitar Notificaciones
                              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </Box>
                          }
                        />
                      </Tooltip>
                    </CardContent>
                  </Card>

                  {settings.notifications?.enabled && (
                    <>
                      {/* Notification Types */}
                      <Card sx={{ 
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        borderRadius: 4,
                        background: theme.palette.background.paper,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        position: 'relative'
                      }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ 
                            mb: 3, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            fontWeight: 600,
                            color: theme.palette.text.primary
                          }}>
                            <Box sx={{
                              p: 1,
                              borderRadius: 2,
                              backgroundColor: '#8bc34a', // Nature Green
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <NotificationsIcon sx={{ fontSize: 20 }} />
                            </Box>
                            Tipos de Notificaciones
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Personaliza qué tipos de alertas deseas recibir en el sistema
                          </Typography>

                          <Stack spacing={2}>
                            {/* Próximos Pagos */}
                            <Box 
                              sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                borderRadius: 2,
                                bgcolor: settings.notifications?.proximosPagos ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Tooltip 
                                title="Alertas sobre compromisos próximos a vencer en los próximos días" 
                                placement="top" 
                                arrow
                              >
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={settings.notifications?.proximosPagos || false}
                                      onChange={(e) => {
                                        updateSettings({
                                          notifications: {
                                            ...settings.notifications,
                                            proximosPagos: e.target.checked
                                          }
                                        });
                                        setSaveMessage(e.target.checked ? 
                                          'Próximos Pagos habilitado' : 
                                          'Próximos Pagos deshabilitado'
                                        );
                                        setShowSaveSuccess(true);
                                        setTimeout(() => setShowSaveSuccess(false), 2000);
                                      }}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <ScheduleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                      <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                          Próximos Pagos
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Alertas sobre compromisos próximos a vencer en los próximos días
                                        </Typography>
                                      </Box>
                                    </Box>
                                  }
                                  sx={{ margin: 0, width: '100%' }}
                                />
                              </Tooltip>
                            </Box>

                            {/* Actualizaciones del Sistema */}
                            <Box 
                              sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                borderRadius: 2,
                                bgcolor: settings.notifications?.actualizacionesSistema ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Tooltip 
                                title="Notificaciones sobre actualizaciones y mantenimiento del sistema" 
                                placement="top" 
                                arrow
                              >
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={settings.notifications?.actualizacionesSistema || false}
                                      onChange={(e) => {
                                        updateSettings({
                                          notifications: {
                                            ...settings.notifications,
                                            actualizacionesSistema: e.target.checked
                                          }
                                        });
                                        setSaveMessage(e.target.checked ? 
                                          'Actualizaciones del Sistema habilitado' : 
                                          'Actualizaciones del Sistema deshabilitado'
                                        );
                                        setShowSaveSuccess(true);
                                        setTimeout(() => setShowSaveSuccess(false), 2000);
                                      }}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <SettingsIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                      <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                          Actualizaciones del Sistema
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Notificaciones sobre actualizaciones y mantenimiento del sistema
                                        </Typography>
                                      </Box>
                                    </Box>
                                  }
                                  sx={{ margin: 0, width: '100%' }}
                                />
                              </Tooltip>
                            </Box>

                            {/* Montos Elevados */}
                            <Box 
                              sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                borderRadius: 2,
                                bgcolor: settings.notifications?.montosElevados ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Tooltip 
                                title="Alertas automáticas cuando un compromiso supera el umbral de monto configurado" 
                                placement="top" 
                                arrow
                              >
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={settings.notifications?.montosElevados || false}
                                      onChange={(e) => {
                                        updateSettings({
                                          notifications: {
                                            ...settings.notifications,
                                            montosElevados: e.target.checked
                                          }
                                        });
                                        setSaveMessage(e.target.checked ? 
                                          'Montos Elevados habilitado' : 
                                          'Montos Elevados deshabilitado'
                                        );
                                        setShowSaveSuccess(true);
                                        setTimeout(() => setShowSaveSuccess(false), 2000);
                                      }}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <SpeedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                      <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                          Montos Elevados
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Alertas automáticas cuando un compromiso supera el umbral de monto configurado
                                        </Typography>
                                      </Box>
                                    </Box>
                                  }
                                  sx={{ margin: 0, width: '100%' }}
                                />
                              </Tooltip>
                            </Box>

                            {/* Pagos Vencidos */}
                            <Box 
                              sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                borderRadius: 2,
                                bgcolor: settings.notifications?.pagosVencidos ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Tooltip 
                                title="Notificaciones sobre pagos que han superado su fecha de vencimiento" 
                                placement="top" 
                                arrow
                              >
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={settings.notifications?.pagosVencidos || false}
                                      onChange={(e) => {
                                        updateSettings({
                                          notifications: {
                                            ...settings.notifications,
                                            pagosVencidos: e.target.checked
                                          }
                                        });
                                        setSaveMessage(e.target.checked ? 
                                          'Pagos Vencidos habilitado' : 
                                          'Pagos Vencidos deshabilitado'
                                        );
                                        setShowSaveSuccess(true);
                                        setTimeout(() => setShowSaveSuccess(false), 2000);
                                      }}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <NotificationsIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                      <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                          Pagos Vencidos
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Notificaciones sobre pagos que han superado su fecha de vencimiento
                                        </Typography>
                                      </Box>
                                    </Box>
                                  }
                                  sx={{ margin: 0, width: '100%' }}
                                />
                              </Tooltip>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                    </>
                  )}
                </Stack>
              </TabPanel>

              {/* SEGURIDAD TAB */}
              <TabPanel value={activeTab} index={3}>
                <Stack spacing={3}>
                  {/* Historial de Inicios de Sesión */}
                  <Card sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    transition: 'box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[3]
                    }
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: '#1565c0', // Executive Navy
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <HistoryIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Historial de Inicios de Sesión
                      </Typography>

                      {loadingHistory ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Cargando historial...
                          </Typography>
                        </Box>
                      ) : (
                        <List>
                          {loginHistory.length === 0 ? (
                            <ListItem>
                              <ListItemText 
                                primary="No hay historial disponible"
                                secondary="El historial de inicios de sesión aparecerá aquí"
                              />
                            </ListItem>
                          ) : (
                            loginHistory.map((entry) => (
                              <ListItem key={entry.id} divider>
                                <ListItemIcon>
                                  {getDeviceIcon(entry.deviceType)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip 
                                        label={entry.action === 'login' ? 'Inicio' : entry.action === 'logout' ? 'Cierre' : 'Cambio'} 
                                        size="small" 
                                        color={entry.action === 'login' ? 'success' : entry.action === 'logout' ? 'info' : 'warning'}
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                      />
                                      <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">
                                        {entry.timestamp ? format(entry.timestamp, "dd/MM/yyyy 'a las' HH:mm", { locale: es }) : 'Fecha no disponible'}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <Stack spacing={0.5}>
                                      <Typography variant="body2" color="text.secondary">
                                        {entry.deviceInfo || 'Dispositivo desconocido'}
                                      </Typography>
                                      {entry.location && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                          <Typography variant="body2" color="text.secondary">
                                            {entry.location}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Stack>
                                  }
                                />
                              </ListItem>
                            ))
                          )}
                        </List>
                      )}

                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={loadLoginHistory}
                          disabled={loadingHistory}
                        >
                          Actualizar Historial
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Gestión de Sesiones Activas */}
                  <Card sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    transition: 'box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[3]
                    }
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: '#2196f3', // Boss Lite
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <DevicesIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Sesiones Activas
                      </Typography>

                      {loadingSessions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Cargando sesiones...
                          </Typography>
                        </Box>
                      ) : (
                        <List>
                          {activeSessions.length === 0 ? (
                            <ListItem>
                              <ListItemText 
                                primary="No hay sesiones activas detectadas"
                                secondary="Las sesiones activas en otros dispositivos aparecerán aquí"
                              />
                            </ListItem>
                          ) : (
                            activeSessions.map((session) => (
                              <ListItem key={session.id} divider>
                                <ListItemIcon>
                                  {getDeviceIcon(session.deviceType)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1">
                                        {session.deviceInfo || 'Dispositivo desconocido'}
                                      </Typography>
                                      {session.isCurrent ? (
                                        <Chip 
                                          label="Sesión Actual" 
                                          size="small" 
                                          color="success"
                                          sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                      ) : (
                                        <Chip 
                                          label="Inactiva" 
                                          size="small" 
                                          color="default"
                                          sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <Stack spacing={0.5}>
                                      <Typography variant="body2" color="text.secondary">
                                        Última actividad: {session.lastActivity ? format(session.lastActivity, "dd/MM/yyyy 'a las' HH:mm", { locale: es }) : 'Desconocida'}
                                      </Typography>
                                      {session.location && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                          <Typography variant="body2" color="text.secondary">
                                            {session.location}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Stack>
                                  }
                                />
                              </ListItem>
                            ))
                          )}
                        </List>
                      )}

                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={loadActiveSessions}
                          disabled={loadingSessions}
                        >
                          Actualizar Lista
                        </Button>
                        {activeSessions.length > 0 && (
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogoutAllDevices}
                          >
                            Cerrar Todas las Sesiones
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Notificaciones de Seguridad */}
                  <Card sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    transition: 'box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[3]
                    }
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ 
                        mb: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}>
                        <Box sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor: '#9c27b0', // Purple Accent
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <EmailIcon sx={{ fontSize: 20 }} />
                        </Box>
                        Notificaciones de Seguridad
                      </Typography>

                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={securityNotifications.emailAlerts}
                              onChange={(e) => updateSecurityNotifications('emailAlerts', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">Alertas por correo electrónico</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Recibe notificaciones por email sobre cambios importantes en tu cuenta
                              </Typography>
                            </Box>
                          }
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={securityNotifications.loginAlerts}
                              onChange={(e) => updateSecurityNotifications('loginAlerts', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">Alertas de inicio de sesión</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Notificaciones cuando se detecte un nuevo inicio de sesión
                              </Typography>
                            </Box>
                          }
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={securityNotifications.suspiciousActivity}
                              onChange={(e) => updateSecurityNotifications('suspiciousActivity', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">Actividad sospechosa</Typography>
                              <Typography variant="body2" color="text.secondary">
                                Alertas sobre intentos de acceso no autorizados o actividad inusual
                              </Typography>
                            </Box>
                          }
                        />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Info */}
                  <Alert severity="info">
                    <Typography variant="body2">
                      💡 <strong>Tip:</strong> Mantén tu cuenta segura activando las notificaciones de seguridad y revisando regularmente tu historial de accesos.
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
function getNotificationLabel(key) {
  const labels = {
    upcomingPayments: 'Próximos Pagos',
    overduePayments: 'Pagos Vencidos',
    highAmount: 'Montos Elevados',
    systemUpdates: 'Actualizaciones del Sistema',
    commitmentAlerts: 'Alertas de Compromisos',
    paymentReminders: 'Recordatorios de Pago',
    monthlyReports: 'Reportes Mensuales'
  };
  return labels[key] || key;
}

function getNotificationDescription(key) {
  const descriptions = {
    upcomingPayments: 'Alertas sobre compromisos próximos a vencer en los próximos días',
    overduePayments: 'Notificaciones sobre pagos que han superado su fecha de vencimiento',
    highAmount: 'Alertas automáticas cuando un compromiso supera el umbral de monto configurado',
    systemUpdates: 'Notificaciones sobre actualizaciones y mantenimiento del sistema',
    commitmentAlerts: 'Alertas generales sobre el estado de tus compromisos financieros',
    paymentReminders: 'Recordatorios automáticos antes de las fechas de vencimiento',
    monthlyReports: 'Resúmenes mensuales automáticos de tu actividad financiera'
  };
  return descriptions[key] || 'Notificación del sistema';
}

function getNotificationIcon(key) {
  const iconProps = { sx: { fontSize: 20, color: 'primary.main' } };
  switch (key) {
    case 'upcomingPayments': return <ScheduleIcon {...iconProps} />;
    case 'overduePayments': return <NotificationsIcon {...iconProps} />;
    case 'highAmount': return <SpeedIcon {...iconProps} />;
    case 'systemUpdates': return <SettingsIcon {...iconProps} />;
    case 'commitmentAlerts': return <NotificationsIcon {...iconProps} />;
    case 'paymentReminders': return <ScheduleIcon {...iconProps} />;
    case 'monthlyReports': return <DashboardIcon {...iconProps} />;
    default: return <NotificationsIcon {...iconProps} />;
  }
}
