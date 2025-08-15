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
    Typography,
    alpha
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

  // 🎨 Estilo unificado para items del menú de usuario
  const menuItemStyle = {
    borderRadius: 1.5,
    mb: 0.5,
    mx: 0.5,
    px: 2,
    py: 1.5,
    backgroundColor: 'transparent',
    transition: theme.transitions.create(['background-color', 'transform'], {
      duration: theme.transitions.duration.short,
    }),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      transform: 'translateX(4px)',
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main
      },
      '& .MuiListItemText-primary': {
        color: theme.palette.primary.main,
        fontWeight: 600
      }
    }
  };

  // 🎨 Estilo unificado para botones de la topbar - DS 3.0 Sobrio
  const topbarButtonStyle = {
    width: 44,
    height: 44,
    color: theme.palette.text.secondary,
    borderRadius: 2,
    backgroundColor: 'transparent',
    border: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    '& .MuiSvgIcon-root': {
      fontSize: '21px',
    }
  };

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
        gap: theme.spacing(0.5) // Espaciado uniforme DS 3.0 sobrio
      }}>
        {/* Botón de notificaciones - Condicional según configuración */}
        {notificationsEnabled && (
          <Tooltip title="Notificaciones y Alertas" arrow>
            <IconButton
            onClick={handleNotificationsOpen}
            sx={topbarButtonStyle}
          >
            <Badge 
              badgeContent={unreadCount + alertsCount} 
              color="error"
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  minWidth: 18,
                  height: 18,
                  backgroundColor: theme.palette.error.main,
                  color: 'white',
                  boxShadow: `0 2px 4px ${alpha(theme.palette.error.main, 0.3)}`,
                  border: `1px solid ${theme.palette.background.paper}`,
                },
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        )}

        {/* Botón de calendario */}
        <Tooltip title="Calendario de Compromisos" arrow>
          <IconButton
            onClick={handleCalendarOpen}
            sx={topbarButtonStyle}
          >
            <CalendarIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        {/* Botón de estado de compromisos */}
        <Tooltip title="Estado de Compromisos" arrow>
          <IconButton
            onClick={handleCommitmentStatusOpen}
            sx={topbarButtonStyle}
          >
            <CommitmentStatusIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Botón de almacenamiento */}
        <Tooltip title="Almacenamiento" arrow>
          <IconButton
            onClick={handleStorageOpen}
            sx={topbarButtonStyle}
          >
            <StorageIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        {/* Botón de cambio de tema */}
        <Tooltip title={getThemeTooltip()} arrow>
          <IconButton
            onClick={handleThemeChange}
            sx={{
              ...topbarButtonStyle,
              color: theme.palette.secondary.main,
              '&:hover': {
                ...topbarButtonStyle['&:hover'],
                borderColor: alpha(theme.palette.secondary.main, 0.2),
                color: theme.palette.secondary.dark,
              }
            }}
          >
            {getThemeIcon()}
          </IconButton>
        </Tooltip>

        {/* Avatar y menú de perfil */}
        <Tooltip title="Perfil de usuario" arrow>
          <IconButton 
            onClick={handleProfileMenuOpen} 
            sx={{ 
              p: 0, 
              ml: 0.5,
              width: 44,
              height: 44,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2.5,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                borderColor: alpha(theme.palette.primary.main, 0.3),
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[2]
              },
              transition: theme.transitions.create(['background-color', 'border-color', 'transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            <ProfileAvatar
              photoURL={userProfile?.photoURL}
              name={userProfile?.name}
              email={userProfile?.email}
              size={36}
              border={false}
              sx={{
                border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                }
              }}
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
            mt: 1.5,
            minWidth: 300,
            maxWidth: 340,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[4],
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden'
          },
        }}
      >
        {/* Header del usuario - DS 3.0 con Gradiente Spectacular */}
        <Box sx={{ 
          px: 0, 
          py: 0,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          borderRadius: '8px 8px 0 0',
          position: 'relative'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 3,
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ position: 'relative' }}>
              <ProfileAvatar
                photoURL={userProfile?.photoURL}
                name={userProfile?.name}
                email={userProfile?.email}
                size={52}
                border={true}
                sx={{
                  border: '3px solid white',
                  boxShadow: theme.shadows[2]
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
                  backgroundColor: theme.palette.success.main,
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1, color: 'white' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '1rem',
                  mb: 0.5
                }}
              >
                {userProfile.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: '0.875rem',
                  mb: 1
                }}
              >
                {userProfile.email}
              </Typography>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'white'
                  }}
                >
                  {userProfile.role || 'Admin'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ my: 0 }} />

        {/* Opciones del menú - DS 3.0 Sobrio */}
        <Box sx={{ p: 1 }}>
          <MenuItem 
            onClick={handleNavigateToProfile}
            sx={menuItemStyle}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: theme.palette.text.secondary
            }}>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Mi Perfil" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
            />
          </MenuItem>

          <MenuItem 
            onClick={handleOpenSettings}
            sx={menuItemStyle}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: theme.palette.text.secondary
            }}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Configuración" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.9rem'
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
              ...menuItemStyle,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                transform: 'translateX(4px)',
                '& .MuiListItemIcon-root': {
                  color: theme.palette.error.main
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
              color: theme.palette.text.secondary
            }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Cerrar Sesión" 
              primaryTypographyProps={{
                fontWeight: 500,
                fontSize: '0.9rem'
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
