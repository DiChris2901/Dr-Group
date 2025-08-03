import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Typography,
  Badge,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Brightness4 as AutoModeIcon,
  Search as SearchIcon,
  Event as CalendarIcon,
  Assessment as CommitmentStatusIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';
import ProfileAvatar from '../common/ProfileAvatar';
import NotificationsMenu from '../notifications/NotificationsMenu';
import CalendarMenu from './CalendarMenu';
import CommitmentStatusMenu from '../commitments/CommitmentStatusMenu';
import StorageMenu from '../storage/StorageMenu';

const DashboardHeader = ({ onOpenSettings }) => {
  const navigate = useNavigate();
  const theme = useMuiTheme();
  const { settings, updateSettings } = useSettings();
  const { unreadCount, alertsCount } = useNotifications();
  const { currentUser, userProfile: firestoreProfile, logout } = useAuth();
  
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [calendarAnchor, setCalendarAnchor] = useState(null);
  const [commitmentStatusAnchor, setCommitmentStatusAnchor] = useState(null);
  const [storageAnchor, setStorageAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // User profile data from Firebase Auth y Firestore
  const userProfile = {
    name: firestoreProfile?.name || currentUser?.displayName || 'Diego Rueda',
    email: firestoreProfile?.email || currentUser?.email || 'diego@drgroup.com',
    photoURL: firestoreProfile?.photoURL || currentUser?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80', // Prioridad: Firestore -> Auth -> Prueba
    role: firestoreProfile?.role || 'admin'
  };

  const isDarkMode = theme.palette.mode === 'dark';
  
  // 🎨 Design System Spectacular - Configuraciones dinámicas
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;
  
  // 📧 Configuraciones de Notificaciones
  const notificationsEnabled = settings?.notifications?.enabled !== false;
  const notificationSoundEnabled = settings?.notifications?.sound !== false;
  
  // 📐 Configuraciones de Layout
  const compactMode = settings?.sidebar?.compactMode || false;

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    // 🔊 Sonido condicional en notificaciones
    if (notificationSoundEnabled) {
      // Crear sonido sutil para feedback auditivo
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeCSGh2u+8g');
      audio.volume = 0.1;
      audio.play().catch(() => {}); // Ignorar errores de autoplay
    }
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleCalendarOpen = (event) => {
    setCalendarAnchor(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchor(null);
  };

  const handleCommitmentStatusOpen = (event) => {
    setCommitmentStatusAnchor(event.currentTarget);
  };

  const handleCommitmentStatusClose = () => {
    setCommitmentStatusAnchor(null);
  };

  const handleStorageOpen = (event) => {
    setStorageAnchor(event.currentTarget);
  };

  const handleStorageClose = () => {
    setStorageAnchor(null);
  };

  const handleThemeChange = () => {
    const modes = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(settings?.theme?.mode || 'light');
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    // Corregir el llamado a updateSettings
    updateSettings('theme', { mode: nextMode });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    handleProfileMenuClose();
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
    handleProfileMenuClose();
  };

  const getThemeIcon = () => {
    switch (settings?.theme?.mode) {
      case 'dark':
        return <DarkModeIcon />;
      case 'light':
        return <LightModeIcon />;
      case 'auto':
      default:
        return <AutoModeIcon />;
    }
  };

  const getThemeTooltip = () => {
    switch (settings?.theme?.mode) {
      case 'dark':
        return 'Cambiar a modo claro';
      case 'light':
        return 'Cambiar a modo automático';
      case 'auto':
      default:
        return 'Cambiar a modo oscuro';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      width: '100%', 
      justifyContent: 'flex-end',
      // 📐 Altura dinámica según modo compacto
      height: compactMode ? 60 : 72,
      py: compactMode ? 1 : 1.5,
    }}>
      {/* Controles del lado derecho */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        gap: 1
      }}>
        {/* Botón de notificaciones - Condicional según configuración */}
        {notificationsEnabled && (
          <Tooltip title="Notificaciones y Alertas">
            <IconButton
            onClick={handleNotificationsOpen}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`
                : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
              border: `1px solid ${isDarkMode ? `${primaryColor}30` : `${primaryColor}20`}`,
              borderRadius: `${borderRadius * 1.5}px`,
              backdropFilter: 'blur(10px)',
              color: primaryColor,
              '&:hover': {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}15)`
                  : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}12)`,
                transform: animationsEnabled ? 'translateY(-1px)' : 'none',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
              },
              transition: animationsEnabled ? theme.transitions.create(['background', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }) : 'none',
            }}
          >
            <Badge 
              badgeContent={unreadCount + alertsCount} 
              color="error"
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  minWidth: 20,
                  height: 20,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: `2px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`,
                  boxShadow: isDarkMode 
                    ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                    : '0 4px 8px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Tooltip>
        )}

        {/* Botón de calendario */}
        <Tooltip title="Calendario de Compromisos">
          <IconButton
            onClick={handleCalendarOpen}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`
                : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
              border: `1px solid ${isDarkMode ? `${primaryColor}30` : `${primaryColor}20`}`,
              borderRadius: `${borderRadius * 1.5}px`,
              backdropFilter: 'blur(10px)',
              color: primaryColor,
              '&:hover': {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}15)`
                  : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}12)`,
                transform: animationsEnabled ? 'translateY(-1px)' : 'none',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
              },
              transition: animationsEnabled ? theme.transitions.create(['background', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }) : 'none',
            }}
          >
            <CalendarIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        {/* Botón de estado de compromisos */}
        <Tooltip title="Estado de Compromisos">
          <IconButton
            onClick={handleCommitmentStatusOpen}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`
                : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
              border: `1px solid ${isDarkMode ? `${primaryColor}30` : `${primaryColor}20`}`,
              borderRadius: `${borderRadius * 1.5}px`,
              backdropFilter: 'blur(10px)',
              color: primaryColor,
              '&:hover': {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}15)`
                  : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}12)`,
                transform: animationsEnabled ? 'translateY(-1px)' : 'none',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
              },
              transition: animationsEnabled ? theme.transitions.create(['background', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }) : 'none',
            }}
          >
            <CommitmentStatusIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        {/* Botón de almacenamiento */}
        <Tooltip title="Almacenamiento">
          <IconButton
            onClick={handleStorageOpen}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`
                : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
              border: `1px solid ${isDarkMode ? `${primaryColor}30` : `${primaryColor}20`}`,
              borderRadius: `${borderRadius * 1.5}px`,
              backdropFilter: 'blur(10px)',
              color: primaryColor,
              '&:hover': {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}15)`
                  : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}12)`,
                transform: animationsEnabled ? 'translateY(-1px)' : 'none',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
              },
              transition: animationsEnabled ? theme.transitions.create(['background', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }) : 'none',
            }}
          >
            <StorageIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        {/* Botón de cambio de tema */}
        <Tooltip title={getThemeTooltip()}>
          <IconButton
            onClick={handleThemeChange}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`
                : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
              border: `1px solid ${isDarkMode ? `${primaryColor}30` : `${primaryColor}20`}`,
              borderRadius: `${borderRadius * 1.5}px`,
              backdropFilter: 'blur(10px)',
              color: isDarkMode ? '#fbbf24' : secondaryColor, // Dorado en dark, secondary en light
              '&:hover': {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${primaryColor}30, #fbbf2420)`
                  : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}15)`,
                transform: animationsEnabled ? 'translateY(-1px)' : 'none',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? '#fcd34d' : primaryColor,
              },
              transition: animationsEnabled ? theme.transitions.create(['background', 'transform', 'box-shadow', 'color'], {
                duration: theme.transitions.duration.short,
              }) : 'none',
            }}
          >
            {getThemeIcon()}
          </IconButton>
        </Tooltip>

        {/* Avatar y menú de perfil */}
        <Tooltip title="Perfil de usuario">
          <IconButton 
            onClick={handleProfileMenuOpen} 
            sx={{ 
              p: 0, 
              ml: 1,
              width: 48,
              height: 48,
              background: isDarkMode 
                ? `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}15)`
                : `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`,
              border: `2px solid ${primaryColor}`,
              borderRadius: `${borderRadius * 1.75}px`,
              backdropFilter: 'blur(10px)',
              '&:hover': {
                background: isDarkMode 
                  ? `linear-gradient(135deg, ${primaryColor}35, ${secondaryColor}20)`
                  : `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}15)`,
                transform: animationsEnabled ? 'translateY(-1px) scale(1.02)' : 'none',
                boxShadow: isDarkMode 
                  ? `0 8px 16px rgba(0, 0, 0, 0.3), 0 0 20px ${primaryColor}40`
                  : `0 8px 16px rgba(0, 0, 0, 0.1), 0 0 20px ${primaryColor}30`,
                borderColor: secondaryColor,
              },
              transition: animationsEnabled ? theme.transitions.create(['background', 'transform', 'box-shadow', 'border-color'], {
                duration: theme.transitions.duration.short,
              }) : 'none',
            }}
          >
            <ProfileAvatar
              photoURL={userProfile?.photoURL}
              name={userProfile?.name}
              email={userProfile?.email}
              size={36}
              border={false} // Removemos el borde del avatar ya que el botón tiene uno
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Menú de perfil */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: `${borderRadius}px`,
            boxShadow: theme.shadows[8],
            border: `1px solid ${isDarkMode ? `${primaryColor}30` : `${primaryColor}20`}`,
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        {/* Información del usuario */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {userProfile.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {userProfile.email}
          </Typography>
        </Box>
        
        <Divider />

        {/* Opciones del menú */}
        <MenuItem onClick={handleNavigateToProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Mi Perfil" />
        </MenuItem>

        <MenuItem onClick={handleOpenSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Configuración" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </MenuItem>
      </Menu>

      {/* Menú de notificaciones */}
      <NotificationsMenu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
      />

      {/* Menú de calendario */}
      <CalendarMenu
        anchorEl={calendarAnchor}
        open={Boolean(calendarAnchor)}
        onClose={handleCalendarClose}
      />

      {/* Menú de estado de compromisos */}
      <CommitmentStatusMenu
        anchorEl={commitmentStatusAnchor}
        open={Boolean(commitmentStatusAnchor)}
        onClose={handleCommitmentStatusClose}
      />

      {/* Menú de almacenamiento */}
      <StorageMenu
        anchorEl={storageAnchor}
        open={Boolean(storageAnchor)}
        onClose={handleStorageClose}
      />
    </Box>
  );
};

export default DashboardHeader;
