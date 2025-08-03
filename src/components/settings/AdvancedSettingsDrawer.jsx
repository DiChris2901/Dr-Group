/**
 * Professional Settings Drawer with Tabs
 * Complete configuration system for DR Group Dashboard
 */

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
  RestartAlt as RestartIcon,
  TextFields as TextFieldsIcon,
  FormatSize as FormatSizeIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Devices as DevicesIcon,
  Email as EmailIcon,
  DeleteForever as DeleteIcon,
  Warning as WarningIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  ExitToApp as LogoutIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { primaryColorPresets } from '../../theme/colorPresets';
import { auth, db } from '../../config/firebase';
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
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
  const { settings, updateSettings, resetSettings, loading: settingsLoading, error: settingsError } = useSettings();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Función para guardar configuración
  const handleSaveSettings = async () => {
    try {
      setSaveMessage('Guardando configuración...');
      setShowSaveSuccess(true);
      
      // Las configuraciones ya se guardan automáticamente en Firebase
      // Solo mostramos confirmación al usuario
      setTimeout(() => {
        setSaveMessage('Configuración guardada con éxito en Firebase');
      }, 1000);
      
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
    } catch (error) {
      setSaveMessage('Error al guardar configuración');
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
    }
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setSaveMessage('Eliminando cuenta...');
      setShowSaveSuccess(true);
      
      // Eliminar datos del usuario de Firestore
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      
      // Eliminar historial de login
      const historyRef = collection(db, 'loginHistory');
      const historyQuery = query(historyRef, where('userId', '==', user.uid));
      const historySnapshot = await getDocs(historyQuery);
      const historyDeletePromises = historySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(historyDeletePromises);
      
      // Eliminar sesiones activas
      const sessionsRef = collection(db, 'activeSessions');
      const sessionsQuery = query(sessionsRef, where('userId', '==', user.uid));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsDeletePromises = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(sessionsDeletePromises);
      
      // Eliminar cuenta de Firebase Auth
      await deleteUser(user);
      
      setSaveMessage('Cuenta eliminada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
      setSaveMessage('Error al eliminar la cuenta. Es posible que necesites volver a autenticarte.');
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
    widgets: {
      totalCommitments: true,
      monthlyOverview: true,
      upcomingPayments: true,
      companyBreakdown: true,
      recentActivity: true,
      analytics: true
    },
    charts: {
      defaultType: 'bar',
      animations: 'smooth',
      colorScheme: 'corporate'
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
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                background: `linear-gradient(135deg, ${alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: settings?.theme?.borderRadius || 2,
                      background: `linear-gradient(135deg, ${settings?.theme?.primaryColor || theme.palette.primary.main}, ${alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.7)})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 24px ${alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.25)}`,
                      transition: settings?.theme?.animations ? 'all 0.3s ease' : 'none'
                    }}
                  >
                    <SettingsIcon sx={{ color: 'white', fontSize: (settings?.theme?.fontSize || 14) + 10 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: 'text.primary',
                      fontSize: `${(settings?.theme?.fontSize || 14) + 8}px`
                    }}>
                      Configuración
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        fontSize: `${(settings?.theme?.fontSize || 14) - 1}px`
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
                      {user && !settingsLoading && (
                        <Chip
                          label="Guardado en Firebase"
                          size="small"
                          color="success"
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
                  <Tooltip title="Guardar configuración">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSettings}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2
                      }}
                    >
                      Guardar
                    </Button>
                  </Tooltip>
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
                    borderRadius: `${settings?.theme?.borderRadius || 3}px ${settings?.theme?.borderRadius || 3}px 0 0`,
                    background: `linear-gradient(90deg, ${settings?.theme?.primaryColor || theme.palette.primary.main}, ${alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.7)})`,
                  },
                  '& .MuiTab-root': {
                    minHeight: 72,
                    minWidth: { xs: 120, sm: 140 },
                    maxWidth: { xs: 160, sm: 180 },
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: `${(settings?.theme?.fontSize || 14) - 0.5}px`,
                    color: theme.palette.text.secondary,
                    padding: '12px 20px',
                    margin: '0 4px',
                    borderRadius: `${settings?.theme?.borderRadius || 8}px ${settings?.theme?.borderRadius || 8}px 0 0`,
                    transition: settings?.theme?.animations ? 'all 0.2s ease-in-out' : 'color 0.1s',
                    '&:hover': {
                      backgroundColor: alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.08),
                      color: settings?.theme?.primaryColor || theme.palette.primary.main,
                      transform: settings?.theme?.animations ? 'translateY(-1px)' : 'none',
                    },
                    '&.Mui-selected': {
                      color: settings?.theme?.primaryColor || theme.palette.primary.main,
                      fontWeight: 600,
                      backgroundColor: alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.12),
                      '& .MuiSvgIcon-root': {
                        color: settings?.theme?.primaryColor || theme.palette.primary.main,
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
                {/* Vista Previa Instantánea - Solo en Tema */}
                <Box sx={{ mb: 3 }}>
                  <Card 
                    sx={{ 
                      border: `2px solid ${settings?.theme?.primaryColor || theme.palette.primary.main}`,
                      borderRadius: settings?.theme?.borderRadius || 3,
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: settings?.theme?.borderRadius || 2,
                            background: `linear-gradient(135deg, ${settings?.theme?.primaryColor || theme.palette.primary.main}, ${alpha(settings?.theme?.primaryColor || theme.palette.primary.main, 0.7)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <PaletteIcon sx={{ color: 'white', fontSize: (settings?.theme?.fontSize || 14) + 6 }} />
                        </Box>
                        <Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontFamily: settings?.theme?.fontFamily || 'Inter',
                              fontSize: `${(settings?.theme?.fontSize || 14) + 2}px`,
                              fontWeight: 600,
                              color: settings?.theme?.primaryColor || theme.palette.primary.main
                            }}
                          >
                            Vista Previa en Tiempo Real
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: settings?.theme?.fontFamily || 'Inter',
                              fontSize: `${settings?.theme?.fontSize || 14}px`,
                              color: 'text.secondary'
                            }}
                          >
                            {settings?.theme?.fontFamily || 'Inter'} • {settings?.theme?.fontSize || 14}px • Tema {settings?.theme?.mode === 'dark' ? 'Oscuro' : 'Claro'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Primario', color: settings?.theme?.primaryColor || theme.palette.primary.main },
                          { label: 'Secundario', color: settings?.theme?.secondaryColor || theme.palette.secondary.main }
                        ].map((item, index) => (
                          <Chip
                            key={index}
                            label={item.label}
                            sx={{
                              backgroundColor: item.color,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                <Stack spacing={3}>
                  {/* Color Presets */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaletteIcon color="primary" />
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
                            </Tooltip>
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
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextFieldsIcon color="primary" />
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
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChartBarIcon color="primary" />
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
                              <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                Tipo de Gráfica Predeterminado
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </FormLabel>
                            </Tooltip>
                            <Select
                              value={dashboardSettings.charts?.defaultType || 'bar'}
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
                              <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                Animaciones en Gráficas
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
                                      p: 1,
                                      cursor: 'pointer',
                                      border: dashboardSettings.charts?.colorScheme === value ? 
                                        `2px solid ${theme.palette.primary.main}` : 
                                        `1px solid ${theme.palette.divider}`,
                                      '&:hover': {
                                        boxShadow: theme.shadows[4]
                                      }
                                    }}
                                    onClick={() => updateDashboardSetting('charts.colorScheme', value)}
                                  >
                                    <Box sx={{ display: 'flex', mb: 1, height: 20 }}>
                                      {colors.map((color, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            flex: 1,
                                            backgroundColor: color,
                                            '&:first-of-type': { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                                            '&:last-of-type': { borderTopRightRadius: 4, borderBottomRightRadius: 4 }
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

                  {/* Widgets Configuration */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DashboardIcon color="primary" />
                        Widgets del Dashboard
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Personaliza qué widgets aparecen en tu panel de control. Puedes habilitar o deshabilitar cada elemento según tus preferencias.
                      </Typography>

                      <Stack spacing={1}>
                        {Object.entries(dashboardSettings.widgets).map(([key, enabled]) => (
                          <Tooltip 
                            key={key}
                            title={getWidgetDescription(key)} 
                            placement="left" 
                            arrow
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={enabled}
                                  onChange={(e) => updateDashboardSetting(`widgets.${key}`, e.target.checked)}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getWidgetLabel(key)}
                                  <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                </Box>
                              }
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Reset Dashboard Settings */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RestartIcon color="primary" />
                        Restaurar Configuración
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Restaura todas las configuraciones del dashboard a sus valores predeterminados. 
                          Esto incluye layout, gráficas, widgets y notificaciones.
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<RestartIcon />}
                            onClick={() => {
                              updateSettings('dashboard', defaultDashboard);
                              setSaveMessage('Configuración del dashboard restaurada a valores por defecto');
                              setShowSaveSuccess(true);
                              setTimeout(() => {
                                setShowSaveSuccess(false);
                              }, 3000);
                            }}
                            sx={{
                              borderColor: theme.palette.warning.main,
                              color: theme.palette.warning.main,
                              '&:hover': {
                                borderColor: theme.palette.warning.dark,
                                backgroundColor: alpha(theme.palette.warning.main, 0.04)
                              }
                            }}
                          >
                            Restaurar Dashboard
                          </Button>
                          
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                            sx={{
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                              '&:hover': {
                                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                              }
                            }}
                          >
                            Guardar Cambios
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Stack>
              </TabPanel>

              {/* NOTIFICACIONES TAB */}
              <TabPanel value={activeTab} index={2}>
                <Stack spacing={3}>
                  {/* Notifications Main Settings */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsIcon color="primary" />
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
                              checked={dashboardSettings.notifications.enabled}
                              onChange={(e) => {
                                updateDashboardSetting('notifications.enabled', e.target.checked);
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

                  {dashboardSettings.notifications.enabled && (
                    <>
                      {/* Threshold Configuration */}
                      <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SpeedIcon color="primary" />
                            Configuración de Umbrales
                          </Typography>
                          
                          <Box>
                            <Tooltip 
                              title="Establece el monto límite para recibir alertas automáticas. Se aplicará a compromisos y pagos que superen este valor." 
                              placement="top" 
                              arrow
                            >
                              <FormLabel sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                Umbral de Monto para Alerta
                                <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </FormLabel>
                            </Tooltip>
                            <TextField
                              type="number"
                              value={dashboardSettings.notifications.alertThreshold}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (value >= 0) {
                                  updateDashboardSetting('notifications.alertThreshold', value);
                                }
                              }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              placeholder="Ej: 100000"
                              helperText="Recibirás una alerta cuando se supere este monto"
                              size="small"
                              fullWidth
                              error={dashboardSettings.notifications.alertThreshold < 0}
                            />
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Notification Types */}
                      <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Badge color="primary" />
                            Tipos de Notificaciones
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Personaliza qué tipos de alertas deseas recibir en el sistema
                          </Typography>

                          <Stack spacing={2}>
                            {Object.entries(dashboardSettings.notifications.types).map(([key, enabled]) => (
                              <Box 
                                key={key}
                                sx={{
                                  p: 2,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                                  borderRadius: 2,
                                  bgcolor: enabled ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <Tooltip 
                                  title={getNotificationDescription(key)} 
                                  placement="top" 
                                  arrow
                                >
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={enabled}
                                        onChange={(e) => {
                                          updateDashboardSetting(`notifications.types.${key}`, e.target.checked);
                                          // Feedback visual
                                          setSaveMessage(e.target.checked ? 
                                            `${getNotificationLabel(key)} habilitado` : 
                                            `${getNotificationLabel(key)} deshabilitado`
                                          );
                                          setShowSaveSuccess(true);
                                          setTimeout(() => setShowSaveSuccess(false), 2000);
                                        }}
                                      />
                                    }
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {getNotificationIcon(key)}
                                        <Box>
                                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {getNotificationLabel(key)}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {getNotificationDescription(key)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    }
                                    sx={{ margin: 0, width: '100%' }}
                                  />
                                </Tooltip>
                              </Box>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Notification Preview */}
                      <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <NotificationsIcon color="primary" />
                            Vista Previa de Notificaciones
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Ejemplos de cómo se verán las notificaciones en tu dashboard
                          </Typography>

                          <Stack spacing={2}>
                            {/* Sample notification previews */}
                            <Box sx={{ 
                              p: 2, 
                              border: `1px solid ${theme.palette.warning.main}`,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <NotificationsIcon sx={{ color: theme.palette.warning.main }} />
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  Pago Próximo a Vencer
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  El compromiso "Nómina Enero" vence en 3 días - ${dashboardSettings.notifications.alertThreshold?.toLocaleString() || '100,000'}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ 
                              p: 2, 
                              border: `1px solid ${theme.palette.error.main}`,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <NotificationsIcon sx={{ color: theme.palette.error.main }} />
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  Monto Elevado Detectado
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Se registró un compromiso de ${(dashboardSettings.notifications.alertThreshold * 1.5)?.toLocaleString() || '150,000'} - superior al umbral configurado
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ 
                              p: 2, 
                              border: `1px solid ${theme.palette.success.main}`,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  Pago Completado
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Se confirmó el pago de "Servicios Públicos" por $45,000
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Action Buttons */}
                      <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SettingsIcon color="primary" />
                            Acciones de Configuración
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Gestiona tu configuración de notificaciones con las siguientes opciones
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<RestartIcon />}
                                onClick={() => {
                                  const defaultNotifications = defaultDashboard.notifications;
                                  updateDashboardSetting('notifications', defaultNotifications);
                                  setSaveMessage('Configuración de notificaciones restaurada a valores por defecto');
                                  setShowSaveSuccess(true);
                                  setTimeout(() => setShowSaveSuccess(false), 3000);
                                }}
                                sx={{
                                  borderColor: theme.palette.warning.main,
                                  color: theme.palette.warning.main,
                                  '&:hover': {
                                    borderColor: theme.palette.warning.dark,
                                    backgroundColor: alpha(theme.palette.warning.main, 0.04)
                                  }
                                }}
                              >
                                Restaurar por Defecto
                              </Button>
                              
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveSettings}
                                sx={{
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                                  }
                                }}
                              >
                                Guardar Cambios
                              </Button>
                            </Box>
                          </Box>
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
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" />
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
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DevicesIcon color="primary" />
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
                                      {session.isCurrent && (
                                        <Chip 
                                          label="Actual" 
                                          size="small" 
                                          color="primary"
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
                          size="small"
                          onClick={loadActiveSessions}
                          disabled={loadingSessions}
                        >
                          Actualizar Lista
                        </Button>
                        {activeSessions.length > 0 && (
                          <Button
                            variant="outlined"
                            color="warning"
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
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="primary" />
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

                  {/* Eliminar Cuenta */}
                  <Card sx={{ border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                        <DeleteIcon />
                        Zona Peligrosa
                      </Typography>

                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>¡Atención!</strong> Esta acción es irreversible. Al eliminar tu cuenta se perderán todos tus datos permanentemente.
                        </Typography>
                      </Alert>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Si eliminas tu cuenta, se borrarán:
                        </Typography>
                        <List dense sx={{ ml: 2 }}>
                          <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2">• Todos tus compromisos financieros</Typography>
                          </ListItem>
                          <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2">• Historial de pagos y transacciones</Typography>
                          </ListItem>
                          <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2">• Configuraciones personalizadas</Typography>
                          </ListItem>
                          <ListItem sx={{ py: 0.5 }}>
                            <Typography variant="body2">• Archivos y documentos subidos</Typography>
                          </ListItem>
                        </List>

                        {!showDeleteConfirm ? (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<WarningIcon />}
                            onClick={() => setShowDeleteConfirm(true)}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Quiero eliminar mi cuenta
                          </Button>
                        ) : (
                          <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.error.main, 0.05), borderRadius: 1, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                              ¿Estás completamente seguro?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Esta acción no se puede deshacer. Tu cuenta y todos los datos asociados se eliminarán permanentemente.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteAccount}
                              >
                                Sí, eliminar permanentemente
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setShowDeleteConfirm(false)}
                              >
                                Cancelar
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
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
function getWidgetLabel(key) {
  const labels = {
    totalCommitments: 'Estadísticas Generales',
    monthlyOverview: 'Resumen Mensual',
    upcomingPayments: 'Próximos Pagos',
    companyBreakdown: 'Desglose por Empresa',
    recentActivity: 'Actividad Reciente',
    analytics: 'Gráficas y Análisis',
    stats: 'Estadísticas',
    recentCommitments: 'Compromisos Recientes',
    monthlyChart: 'Gráfica Mensual',
    companiesOverview: 'Resumen de Empresas',
    quickActions: 'Acciones Rápidas',
    paymentsSummary: 'Resumen de Pagos',
    alertsWidget: 'Alertas y Notificaciones',
    financialOverview: 'Panorama Financiero'
  };
  return labels[key] || key;
}

function getWidgetDescription(key) {
  const descriptions = {
    totalCommitments: 'Muestra métricas clave como total de compromisos, montos y estado general',
    monthlyOverview: 'Presenta un resumen de los compromisos y pagos del mes actual',
    upcomingPayments: 'Lista los próximos pagos programados y fechas de vencimiento',
    companyBreakdown: 'Desglosa los compromisos financieros organizados por empresa',
    recentActivity: 'Muestra las últimas actividades y transacciones registradas',
    analytics: 'Presenta gráficas interactivas y análisis de tendencias financieras',
    stats: 'Estadísticas resumidas del estado actual de compromisos',
    recentCommitments: 'Listado de los compromisos añadidos recientemente',
    monthlyChart: 'Gráfica visual del progreso mensual de pagos',
    companiesOverview: 'Vista general del estado financiero por empresa',
    quickActions: 'Accesos rápidos a funciones frecuentemente utilizadas',
    paymentsSummary: 'Resumen consolidado de todos los pagos realizados',
    alertsWidget: 'Centro de notificaciones y alertas importantes',
    financialOverview: 'Panorama completo del estado financiero general'
  };
  return descriptions[key] || 'Widget personalizable del dashboard';
}

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
