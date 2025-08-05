import {
    Brightness4 as AutoModeIcon,
    Event as CalendarIcon,
    Assessment as CommitmentStatusIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Logout as LogoutIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Storage as StorageIcon
} from '@mui/icons-material';
import {
    Badge,
    Box,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
    Typography
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import CommitmentStatusMenu from '../commitments/CommitmentStatusMenu';
import ProfileAvatar from '../common/ProfileAvatar';
import NotificationsMenu from '../notifications/NotificationsMenu';
import StorageMenu from '../storage/StorageMenu';
import CalendarMenu from './CalendarMenu';

// Estilos CSS para animaciones spectacular del menú de avatar
const avatarMenuStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined' && !document.getElementById('avatar-menu-spectacular-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'avatar-menu-spectacular-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = avatarMenuStyles;
  document.head.appendChild(styleSheet);
}

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

      {/* Menú de perfil - Design System Spectacular */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            maxWidth: 320,
            borderRadius: `${borderRadius * 1.5}px`,
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: isDarkMode 
              ? `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px ${primaryColor}30`
              : `0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px ${primaryColor}20`,
            border: `1px solid ${isDarkMode ? `${primaryColor}40` : `${primaryColor}25`}`,
            overflow: 'visible',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 12,
              height: 12,
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              border: `1px solid ${isDarkMode ? `${primaryColor}40` : `${primaryColor}25`}`,
              borderBottom: 'none',
              borderRight: 'none'
            }
          },
        }}
      >
        {/* Información del usuario - Header Spectacular */}
        <Box sx={{ 
          px: 0, 
          py: 0,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          borderRadius: `${borderRadius * 1.5}px ${borderRadius * 1.5}px 0 0`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: animationsEnabled ? 
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 
              'none',
            transform: 'translateX(-100%)',
            animation: animationsEnabled ? 'shimmer 4s infinite' : 'none'
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2.5,
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ position: 'relative' }}>
              <ProfileAvatar
                photoURL={userProfile?.photoURL}
                name={userProfile?.name}
                email={userProfile?.email}
                size={56}
                border={true}
                sx={{
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    transform: animationsEnabled ? 'scale(1.05)' : 'none',
                    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.3)'
                  },
                  transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                }}
              />
              {/* Indicador de estado online */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  animation: animationsEnabled ? 'pulse 2s infinite' : 'none'
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1, color: 'white' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  mb: 0.5,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {userProfile.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: '0.85rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {userProfile.email}
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: `${borderRadius / 2}px`,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {userProfile.role || 'Admin'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ 
          borderColor: isDarkMode ? `${primaryColor}30` : `${primaryColor}20`,
          my: 0 
        }} />

        {/* Opciones del menú - Design System Spectacular */}
        <Box sx={{ p: 1 }}>
          <MenuItem 
            onClick={handleNavigateToProfile}
            sx={{
              borderRadius: `${borderRadius}px`,
              mb: 0.5,
              px: 2,
              py: 1.5,
              background: 'transparent',
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              '&:hover': {
                background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
                transform: animationsEnabled ? 'translateX(4px)' : 'none',
                boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.08)'}`,
                '& .MuiListItemIcon-root': {
                  color: primaryColor,
                  transform: animationsEnabled ? 'scale(1.1)' : 'none'
                },
                '& .MuiListItemText-primary': {
                  color: primaryColor,
                  fontWeight: 600
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: theme.palette.text.secondary,
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Mi Perfil" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            />
          </MenuItem>

          <MenuItem 
            onClick={handleOpenSettings}
            sx={{
              borderRadius: `${borderRadius}px`,
              mb: 0.5,
              px: 2,
              py: 1.5,
              background: 'transparent',
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              '&:hover': {
                background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)`,
                transform: animationsEnabled ? 'translateX(4px)' : 'none',
                boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.08)'}`,
                '& .MuiListItemIcon-root': {
                  color: primaryColor,
                  transform: animationsEnabled ? 'scale(1.1) rotate(45deg)' : 'none'
                },
                '& .MuiListItemText-primary': {
                  color: primaryColor,
                  fontWeight: 600
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: theme.palette.text.secondary,
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Configuración" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            />
          </MenuItem>
        </Box>

        <Divider sx={{ 
          borderColor: isDarkMode ? `${primaryColor}30` : `${primaryColor}20`,
          my: 0.5 
        }} />

        <Box sx={{ p: 1 }}>
          <MenuItem 
            onClick={handleLogout}
            sx={{
              borderRadius: `${borderRadius}px`,
              px: 2,
              py: 1.5,
              background: 'transparent',
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))',
                transform: animationsEnabled ? 'translateX(4px)' : 'none',
                boxShadow: `0 4px 12px rgba(239, 68, 68, 0.2)`,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.error.main,
                  transform: animationsEnabled ? 'scale(1.1)' : 'none'
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.error.main,
                  fontWeight: 600
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: theme.palette.text.secondary,
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Cerrar Sesión" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            />
          </MenuItem>
        </Box>
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
