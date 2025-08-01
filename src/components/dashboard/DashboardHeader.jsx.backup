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
  Search as SearchIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';
import ProfileAvatar from '../common/ProfileAvatar';
import NotificationsMenu from '../notifications/NotificationsMenu';

const DashboardHeader = ({ onOpenSettings }) => {
  const navigate = useNavigate();
  const theme = useMuiTheme();
  const { settings, updateSettings } = useSettings();
  const { unreadCount, alertsCount } = useNotifications();
  const { currentUser, userProfile: firestoreProfile, logout } = useAuth();
  
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // User profile data from Firebase Auth y Firestore
  const userProfile = {
    name: firestoreProfile?.name || currentUser?.displayName || 'Diego Rueda',
    email: firestoreProfile?.email || currentUser?.email || 'diego@drgroup.com',
    photoURL: firestoreProfile?.photoURL || currentUser?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80', // Prioridad: Firestore -> Auth -> Prueba
    role: firestoreProfile?.role || 'admin'
  };

  const isDarkMode = theme.palette.mode === 'dark';
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
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
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
      {/* Controles del lado derecho */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        gap: 1
      }}>
        {/* Botón de notificaciones */}
        <Tooltip title="Notificaciones y Alertas">
          <IconButton
            onClick={handleNotificationsOpen}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04))',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              color: isDarkMode ? 'white' : 'text.primary',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                  : 'linear-gradient(135deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.06))',
                transform: 'translateY(-1px)',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
              },
              transition: theme.transitions.create(['background', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }),
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

        {/* Botón de cambio de tema */}
        <Tooltip title={getThemeTooltip()}>
          <IconButton
            onClick={handleThemeChange}
            sx={{
              width: 48,
              height: 48,
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04))',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              color: isDarkMode ? '#fbbf24' : '#f59e0b', // Colores dorados para el tema
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))'
                  : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.08))',
                transform: 'translateY(-1px)',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? '#fcd34d' : '#d97706',
              },
              transition: theme.transitions.create(['background', 'transform', 'box-shadow', 'color'], {
                duration: theme.transitions.duration.short,
              }),
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
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04))',
              border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
              borderRadius: '14px',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                  : 'linear-gradient(135deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.06))',
                transform: 'translateY(-1px)',
                boxShadow: isDarkMode 
                  ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
              },
              transition: theme.transitions.create(['background', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }),
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
            borderRadius: 2,
            boxShadow: theme.shadows[8],
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
    </Box>
  );
};

export default DashboardHeader;
