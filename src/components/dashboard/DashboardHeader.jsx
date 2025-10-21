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
    Storage as StorageIcon,
    Search as SearchIcon,
    StickyNote2 as NotesIcon,
    Task as TaskIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import {
    Badge,
    Box,
    Divider,
    IconButton,
    InputAdornment,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
    alpha,
    Autocomplete,
    Paper
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import { useTasks } from '../../hooks/useTasks';
import CommitmentStatusMenu from '../commitments/CommitmentStatusMenu';
import ProfileAvatar from '../common/ProfileAvatar';
import NotificationsMenu from '../notifications/NotificationsMenu';
import StorageMenu from '../storage/StorageMenu';
import CalendarMenu from './CalendarMenu';
import NotesMenu from '../notes/NotesMenu';
import TasksMenu from '../tasks/TasksMenu';

// Estilos CSS para animaciones spectacular del menú de avatar y topbar
const avatarMenuStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  
  @keyframes pulse {
    0%, 100% { 
      transform: scale(1);
      opacity: 1;
    }
    50% { 
      transform: scale(1.2);
      opacity: 0.8;
    }
  }
  
  @keyframes shimmerBadge {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  
  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0 0 8px rgba(103, 126, 234, 0.4), 0 0 16px rgba(103, 126, 234, 0.3), 0 0 24px rgba(103, 126, 234, 0.2);
    }
    50% {
      box-shadow: 0 0 16px rgba(103, 126, 234, 0.7), 0 0 32px rgba(103, 126, 234, 0.5), 0 0 48px rgba(103, 126, 234, 0.3);
    }
  }
  
  @keyframes iconGlow {
    0%, 100% {
      filter: drop-shadow(0 0 2px rgba(103, 126, 234, 0.3));
    }
    50% {
      filter: drop-shadow(0 0 8px rgba(103, 126, 234, 0.6));
    }
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
  const { pendingTasksCount, highPriorityPendingCount } = useTasks();
  
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [calendarAnchor, setCalendarAnchor] = useState(null);
  const [commitmentStatusAnchor, setCommitmentStatusAnchor] = useState(null);
  const [storageAnchor, setStorageAnchor] = useState(null);
  const [notesAnchor, setNotesAnchor] = useState(null);
  const [tasksAnchor, setTasksAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  // 🎨 Estilo unificado para botones de la topbar - Spectacular V3 (Sin glassmorphism)
  const topbarButtonStyle = {
    width: 48,
    height: 48,
    color: theme.palette.text.secondary,
    borderRadius: 2,
    background: 'transparent',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
      transition: 'left 0.5s ease',
    },
    '&:hover': {
      color: theme.palette.primary.main,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.primary.light, 0.08)})`,
      transform: 'translateY(-4px) scale(1.15)',
      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}, 0 0 30px ${alpha(theme.palette.primary.main, 0.25)}`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      '&::before': {
        left: '100%',
      },
    },
    '& .MuiSvgIcon-root': {
      fontSize: '21px',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      transition: 'all 0.3s ease',
    }
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // 🔍 Handler para búsqueda global
  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter' && searchValue.trim()) {
      performGlobalSearch(searchValue.trim());
    }
  };

  // 🔍 Función para realizar búsqueda global inteligente
  const performGlobalSearch = (searchTerm) => {
    // Navegar a la página de búsqueda global
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    setSearchOpen(false);
    setSearchValue('');
  };

  // 🔍 Función para obtener sugerencias de búsqueda global
  const fetchSearchSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const suggestions = new Map(); // Usar Map para almacenar tipo y ruta
      const searchLower = searchTerm.toLowerCase();
      
      // 1️⃣ Buscar en compromisos
      const commitmentsQuery = query(
        collection(db, 'commitments'),
        limit(15)
      );
      
      const commitmentsSnapshot = await getDocs(commitmentsQuery);
      commitmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.concept && data.concept.toLowerCase().includes(searchLower)) {
          suggestions.set(`📋 ${data.concept}`, {
            type: 'commitment',
            path: '/commitments',
            query: `?search=${encodeURIComponent(data.concept)}`
          });
        }
        
        if (data.beneficiary && data.beneficiary.toLowerCase().includes(searchLower)) {
          suggestions.set(`👤 ${data.beneficiary}`, {
            type: 'commitment',
            path: '/commitments',
            query: `?search=${encodeURIComponent(data.beneficiary)}`
          });
        }
        
        if (data.companyName && data.companyName.toLowerCase().includes(searchLower)) {
          suggestions.set(`🏢 ${data.companyName}`, {
            type: 'commitment',
            path: '/commitments',
            query: `?search=${encodeURIComponent(data.companyName)}`
          });
        }
      });

      // 2️⃣ Buscar en empresas
      const companiesQuery = query(
        collection(db, 'companies'),
        limit(10)
      );
      
      const companiesSnapshot = await getDocs(companiesQuery);
      companiesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes(searchLower)) {
          suggestions.set(`🏢 ${data.name}`, {
            type: 'company',
            path: '/companies',
            query: `?search=${encodeURIComponent(data.name)}`
          });
        }
      });

      // 3️⃣ Buscar en pagos
      const paymentsQuery = query(
        collection(db, 'payments'),
        limit(10)
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      paymentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.concept && data.concept.toLowerCase().includes(searchLower)) {
          suggestions.set(`💰 ${data.concept}`, {
            type: 'payment',
            path: '/payments',
            query: `?search=${encodeURIComponent(data.concept)}`
          });
        }
      });

      // 4️⃣ Buscar en usuarios
      const usersQuery = query(
        collection(db, 'users'),
        limit(8)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.displayName && data.displayName.toLowerCase().includes(searchLower)) {
          suggestions.set(`👥 ${data.displayName}`, {
            type: 'user',
            path: '/users',
            query: `?search=${encodeURIComponent(data.displayName)}`
          });
        }
        if (data.email && data.email.toLowerCase().includes(searchLower)) {
          suggestions.set(`📧 ${data.email}`, {
            type: 'user',
            path: '/users',
            query: `?search=${encodeURIComponent(data.email)}`
          });
        }
      });

      // 5️⃣ Agregar páginas del sistema que coincidan
      const systemPages = [
        { name: 'Dashboard', path: '/', keywords: ['dashboard', 'inicio', 'principal', 'resumen'] },
        { name: 'Compromisos', path: '/commitments', keywords: ['compromiso', 'obligacion', 'pago', 'deuda'] },
        { name: 'Pagos', path: '/payments', keywords: ['pago', 'abono', 'transferencia', 'consignacion'] },
        { name: 'Empresas', path: '/companies', keywords: ['empresa', 'compania', 'negocio'] },
        { name: 'Usuarios', path: '/users', keywords: ['usuario', 'persona', 'empleado'] },
        { name: 'Reportes', path: '/reports', keywords: ['reporte', 'informe', 'estadistica'] },
        { name: 'Centro de Alertas', path: '/alerts-center', keywords: ['alerta', 'notificacion', 'aviso'] },
        { name: 'KPIs Financieros', path: '/financial-kpis', keywords: ['kpi', 'indicador', 'metrica', 'financiero'] },
        { name: 'Dashboard Ejecutivo', path: '/executive-dashboard', keywords: ['ejecutivo', 'gerencia', 'directivo'] },
        { name: 'Compromisos Vencidos', path: '/due-commitments', keywords: ['vencido', 'atrasado', 'moroso'] },
        { name: 'Perfil', path: '/profile', keywords: ['perfil', 'usuario', 'configuracion'] },
        { name: 'Configuración', path: '/settings', keywords: ['configuracion', 'ajuste', 'preferencia'] }
      ];

      systemPages.forEach(page => {
        const pageNameMatch = page.name.toLowerCase().includes(searchLower);
        const keywordMatch = page.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchLower) || 
          searchLower.includes(keyword.toLowerCase())
        );
        
        if (pageNameMatch || keywordMatch) {
          suggestions.set(`📄 ${page.name}`, {
            type: 'page',
            path: page.path,
            query: ''
          });
        }
      });
      
      // Convertir Map a Array y limitar a 12 sugerencias
      const suggestionsArray = Array.from(suggestions.keys()).slice(0, 12);
      setSearchSuggestions(suggestionsArray.map(key => ({
        label: key,
        ...suggestions.get(key)
      })));
      
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 🔍 useEffect para obtener sugerencias con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue.trim()) {
        fetchSearchSuggestions(searchValue.trim());
        setSearchOpen(true);
      } else {
        setSearchSuggestions([]);
        setSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

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

  const handleNotesOpen = (event) => {
    setNotesAnchor(event.currentTarget);
  };

  const handleNotesClose = () => {
    setNotesAnchor(null);
  };

  const handleTasksOpen = (event) => {
    setTasksAnchor(event.currentTarget);
  };

  const handleTasksClose = () => {
    setTasksAnchor(null);
  };

  const handleMoreMenuOpen = (event) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
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
      // 📐 Altura dinámica según modo compacto - Aumentada para mejor espaciado
      height: compactMode ? 80 : 96,
      py: compactMode ? 2 : 2.5,
      px: 2,
    }}>
      {/* Área izquierda - espacio para balance */}
      <Box sx={{ flex: 1 }}>
        {/* Espacio vacío para balancear la búsqueda en el centro */}
      </Box>

      {/* Área central para barra de búsqueda */}
      <Box sx={{ 
        flex: '0 0 auto',
        display: 'flex', 
        justifyContent: 'center',
        minWidth: { xs: 200, sm: 260, md: 320 }, // Responsive: móvil → tablet → desktop
        maxWidth: { xs: 240, sm: 300, md: 380 },
        position: 'relative',
      }}>
        <Autocomplete
          freeSolo
          open={searchOpen && searchSuggestions.length > 0}
          onOpen={() => {
            if (searchSuggestions.length > 0) {
              setSearchOpen(true);
            }
          }}
          onClose={() => setSearchOpen(false)}
          inputValue={searchValue}
          onInputChange={(event, newValue, reason) => {
            if (reason === 'input') {
              setSearchValue(newValue);
            }
          }}
          onChange={(event, newValue) => {
            if (newValue) {
              // Manejar navegación basada en el tipo de resultado
              if (typeof newValue === 'object' && newValue.path) {
                if (newValue.type === 'page') {
                  navigate(newValue.path);
                } else {
                  navigate(`/search?q=${encodeURIComponent(newValue.label.replace(/^[📋👤🏢💰👥📧📄]\s/, ''))}`);
                }
              } else {
                // Fallback para búsqueda general
                navigate(`/search?q=${encodeURIComponent(newValue)}`);
              }
              setSearchOpen(false);
              setSearchValue('');
            }
          }}
          options={searchSuggestions}
          loading={loadingSuggestions}
          getOptionLabel={(option) => typeof option === 'object' ? option.label : option}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <Box 
                component="li" 
                key={key}
                {...otherProps}
                sx={{ 
                  px: 2, 
                  py: 1.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="body2" sx={{ 
                    flex: 1,
                    fontSize: '0.875rem',
                    color: theme.palette.text.primary
                  }}>
                    {typeof option === 'object' ? option.label : option}
                  </Typography>
                  {typeof option === 'object' && (
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      ml: 1,
                      fontSize: '0.75rem',
                      textTransform: 'capitalize'
                    }}>
                      {option.type === 'commitment' && 'Compromiso'}
                      {option.type === 'company' && 'Empresa'}
                      {option.type === 'payment' && 'Pago'}
                      {option.type === 'user' && 'Usuario'}
                      {option.type === 'page' && 'Página'}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          }}
          noOptionsText={loadingSuggestions ? "Buscando..." : "No hay sugerencias"}
          loadingText="Buscando..."
          PaperComponent={({ children, ...other }) => (
            <Paper
              {...other}
              sx={{
                borderRadius: '12px',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 8px 32px rgba(0,0,0,0.1)',
                mt: 1,
              }}
            >
              {children}
            </Paper>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Buscar compromisos, pagos..."
              onKeyDown={handleSearchSubmit}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: 20 
                    }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.95)
                    : '#ffffff',
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `linear-gradient(45deg, transparent 30%, ${alpha(theme.palette.primary.main, 0.1)} 50%, transparent 70%)`,
                    animation: 'shimmer 3s infinite',
                    pointerEvents: 'none',
                  },
                  '& fieldset': {
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-3px) scale(1.03)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      borderWidth: '2px',
                    },
                  },
                  '&.Mui-focused': {
                    transform: 'translateY(-3px) scale(1.03)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '& fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    },
                  },
                  '@keyframes shimmer': {
                    '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                    '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '10px 4px',
                  '&::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 0.8,
                    fontWeight: 500,
                  },
                },
                '& .MuiInputAdornment-root': {
                  marginRight: '8px',
                },
              }}
            />
          )}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Área derecha - controles de usuario */}
      <Box sx={{ 
        flex: 1,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        gap: { xs: 0.5, sm: 1, md: 1.5 } // Espaciado responsive mejorado
      }}>
        {/* Botón de notificaciones con badge inteligente */}
        {notificationsEnabled && (
          <Tooltip 
            title={
              <Box>
                <Typography variant="caption" fontWeight="bold" display="block">Notificaciones</Typography>
                {(unreadCount + alertsCount) > 0 && (
                  <Typography variant="caption" display="block" color={alertsCount > 0 ? "error.light" : "info.light"}>
                    {unreadCount + alertsCount} {alertsCount > 0 ? `(${alertsCount} urgentes)` : 'sin leer'}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Atajo: Alt+N</Typography>
              </Box>
            }
            arrow
          >
            <IconButton
            onClick={handleNotificationsOpen}
            sx={{
              ...topbarButtonStyle,
              animation: (unreadCount + alertsCount) > 0 ? 'iconGlow 2s ease-in-out infinite' : 'none',
              '&:hover': {
                ...topbarButtonStyle['&:hover'],
                boxShadow: alertsCount > 0 
                  ? `0 12px 40px ${alpha(theme.palette.error.main, 0.35)}`
                  : unreadCount > 0 
                  ? `0 12px 40px ${alpha(theme.palette.warning.main, 0.35)}`
                  : `0 12px 40px ${alpha(theme.palette.info.main, 0.35)}`,
              },
              '& .MuiSvgIcon-root': {
                fontSize: '26px',
                color: alertsCount > 0 
                  ? theme.palette.error.main 
                  : unreadCount > 0 
                  ? theme.palette.warning.main 
                  : theme.palette.info.main,
              }
            }}
          >
            <Badge 
              badgeContent={unreadCount + alertsCount} 
              color={alertsCount > 0 ? "error" : unreadCount > 0 ? "warning" : "info"}
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  minWidth: 22,
                  height: 22,
                  padding: '0 7px',
                  borderRadius: '11px',
                  background: alertsCount > 0 
                    ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})` 
                    : unreadCount > 0 
                    ? `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})` 
                    : `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                  color: '#fff',
                  border: `2.5px solid ${theme.palette.background.paper}`,
                  boxShadow: `0 4px 12px ${alpha(
                    alertsCount > 0 
                      ? theme.palette.error.main 
                      : unreadCount > 0 
                      ? theme.palette.warning.main 
                      : theme.palette.info.main, 
                    0.5
                  )}, 0 0 20px ${alpha(
                    alertsCount > 0 
                      ? theme.palette.error.main 
                      : unreadCount > 0 
                      ? theme.palette.warning.main 
                      : theme.palette.info.main, 
                    0.3
                  )}`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  animation: alertsCount > 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glowPulse 2s ease-in-out infinite' : unreadCount > 0 ? 'glowPulse 3s ease-in-out infinite' : 'none',
                },
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        )}

        {/* Separador visual - Grupo Crítico */}
        <Box
          sx={{
            mx: { xs: 0.5, md: 1 },
            width: '3px',
            height: 32,
            alignSelf: 'center',
            background: `linear-gradient(180deg, transparent, ${alpha(theme.palette.primary.main, 0.6)}, transparent)`,
            borderRadius: '3px',
            boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            animation: 'glowPulse 4s ease-in-out infinite',
          }}
        />

        {/* Botón de calendario */}
        <Tooltip 
          title={
            <Box>
              <Typography variant="caption" fontWeight="bold" display="block">Calendario</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Atajo: Alt+C</Typography>
            </Box>
          }
          arrow
        >
          <IconButton
            onClick={handleCalendarOpen}
            sx={{
              ...topbarButtonStyle,
              '&:hover': {
                ...topbarButtonStyle['&:hover'],
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}`,
              },
            }}
          >
            <CalendarIcon sx={{ fontSize: 22, color: theme.palette.primary.main }} />
          </IconButton>
        </Tooltip>

        {/* Botón de notas */}
        <Tooltip 
          title={
            <Box>
              <Typography variant="caption" fontWeight="bold" display="block">Mis Notas</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Atajo: Alt+M</Typography>
            </Box>
          }
          arrow
        >
          <IconButton
            onClick={handleNotesOpen}
            sx={{
              ...topbarButtonStyle,
              '&:hover': {
                ...topbarButtonStyle['&:hover'],
                boxShadow: `0 12px 40px ${alpha(theme.palette.warning.main, 0.35)}`,
              },
            }}
          >
            <NotesIcon sx={{ fontSize: 22, color: theme.palette.warning.main }} />
          </IconButton>
        </Tooltip>

        {/* Separador visual - Grupo Herramientas */}
        <Box
          sx={{
            mx: { xs: 0.5, md: 1 },
            width: '3px',
            height: 32,
            alignSelf: 'center',
            background: `linear-gradient(180deg, transparent, ${alpha(theme.palette.primary.main, 0.6)}, transparent)`,
            borderRadius: '3px',
            boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            animation: 'glowPulse 4.5s ease-in-out infinite',
          }}
        />

        {/* Botón de menú "Más" - Agrupa opciones menos frecuentes */}
        <Tooltip title="Más opciones" arrow>
          <IconButton
            onClick={handleMoreMenuOpen}
            sx={topbarButtonStyle}
          >
            <MoreVertIcon sx={{ fontSize: 22, color: theme.palette.text.secondary }} />
          </IconButton>
        </Tooltip>

        {/* Botón de tareas con badge inteligente */}
        <Tooltip 
          title={
            <Box>
              <Typography variant="caption" fontWeight="bold" display="block">Mis Tareas</Typography>
              {pendingTasksCount > 0 && (
                <Typography variant="caption" display="block" color={highPriorityPendingCount > 0 ? "error.light" : "primary.light"}>
                  {pendingTasksCount} pendientes {highPriorityPendingCount > 0 ? `(${highPriorityPendingCount} urgentes)` : ''}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Atajo: Alt+T</Typography>
            </Box>
          }
          arrow
        >
          <IconButton
            onClick={handleTasksOpen}
            sx={{
              ...topbarButtonStyle,
              animation: pendingTasksCount > 0 ? 'iconGlow 2.5s ease-in-out infinite' : 'none',
              '&:hover': {
                ...topbarButtonStyle['&:hover'],
                boxShadow: highPriorityPendingCount > 0 
                  ? `0 12px 40px ${alpha(theme.palette.error.main, 0.35)}`
                  : `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}`,
              },
              '& .MuiSvgIcon-root': {
                fontSize: '26px',
                color: highPriorityPendingCount > 0 
                  ? theme.palette.error.main 
                  : theme.palette.primary.main,
              }
            }}
          >
            <Badge 
              badgeContent={pendingTasksCount} 
              color={highPriorityPendingCount > 0 ? "error" : "primary"}
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  minWidth: 22,
                  height: 22,
                  padding: '0 7px',
                  borderRadius: '11px',
                  background: highPriorityPendingCount > 0 
                    ? `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})` 
                    : pendingTasksCount > 0 
                    ? `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})` 
                    : `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                  color: '#fff',
                  border: `2.5px solid ${theme.palette.background.paper}`,
                  boxShadow: `0 4px 12px ${alpha(
                    highPriorityPendingCount > 0 
                      ? theme.palette.error.main 
                      : pendingTasksCount > 0 
                      ? theme.palette.warning.main 
                      : theme.palette.info.main, 
                    0.5
                  )}, 0 0 20px ${alpha(
                    highPriorityPendingCount > 0 
                      ? theme.palette.error.main 
                      : pendingTasksCount > 0 
                      ? theme.palette.warning.main 
                      : theme.palette.info.main, 
                    0.3
                  )}`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  animation: highPriorityPendingCount > 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glowPulse 2s ease-in-out infinite' : pendingTasksCount > 0 ? 'glowPulse 3s ease-in-out infinite' : 'none',
                },
              }}
            >
              <TaskIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Botón de cambio de tema */}
        <Tooltip title={getThemeTooltip()} arrow>
          <IconButton
            onClick={handleThemeChange}
            sx={{
              ...topbarButtonStyle,
              '&:hover': {
                ...topbarButtonStyle['&:hover'],
                boxShadow: `0 12px 40px ${alpha(theme.palette.secondary.main, 0.35)}`,
              },
              '& .MuiSvgIcon-root': {
                color: theme.palette.secondary.main,
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
              width: 46, // +2px más grande
              height: 46,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2.5,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                borderColor: alpha(theme.palette.primary.main, 0.3),
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
              },
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Box 
              sx={{ 
                position: 'relative',
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box, linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}) border-box`,
                border: '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.37)}`,
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.1)',
                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
                  animation: 'glowPulse 1.5s ease-in-out infinite',
                },
              }}
            >
              <ProfileAvatar
                photoURL={userProfile?.photoURL}
                name={userProfile?.name}
                email={userProfile?.email}
                size={44}
                border={false}
              />
              {/* Indicador de estado online spectacular con glow intenso */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                  border: `3px solid ${theme.palette.background.paper}`,
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 16px ${alpha(theme.palette.success.main, 0.9)}, 0 0 24px ${alpha(theme.palette.success.main, 0.6)}`,
                  animation: 'glowPulse 2.5s ease-in-out infinite',
                }}
              />
            </Box>
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
        {/* Header del usuario - DS 3.0 sobrio */}
        <Box sx={{ 
          px: 0, 
          py: 0,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
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
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: theme.shadows[1]
                }}
              />
              {/* Indicador de estado online */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.success.main,
                  border: `2px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1, color: theme.palette.text.primary }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '1rem',
                  mb: 0.5,
                  color: theme.palette.text.primary
                }}
              >
                {userProfile.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
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
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
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
                    color: theme.palette.primary.main
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
              <PersonIcon sx={{ fontSize: '21px' }} />
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
              <SettingsIcon sx={{ fontSize: '21px' }} />
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
          borderColor: theme.palette.divider,
          my: 0.5 
        }} />

        <Box sx={{ p: 1 }}>
          <MenuItem 
            onClick={handleLogout}
            sx={{
              ...menuItemStyle,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.04),
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
              <LogoutIcon sx={{ fontSize: '21px' }} />
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

      {/* Menú de notas */}
      <NotesMenu
        anchorEl={notesAnchor}
        open={Boolean(notesAnchor)}
        onClose={handleNotesClose}
      />

      {/* Menú de tareas */}
      <TasksMenu
        anchorEl={tasksAnchor}
        open={Boolean(tasksAnchor)}
        onClose={handleTasksClose}
      />

      {/* Menú "Más" - Opciones agrupadas */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[4],
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <MenuItem 
            onClick={() => {
              handleCommitmentStatusOpen({ currentTarget: moreMenuAnchor });
              handleMoreMenuClose();
            }}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              px: 2,
              py: 1.5,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                transform: 'translateX(4px)',
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
              <CommitmentStatusIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Estado de Compromisos" 
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
            />
          </MenuItem>

          <MenuItem 
            onClick={() => {
              handleStorageOpen({ currentTarget: moreMenuAnchor });
              handleMoreMenuClose();
            }}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              px: 2,
              py: 1.5,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.success.main, 0.08),
                transform: 'translateX(4px)',
                '& .MuiListItemIcon-root': {
                  color: theme.palette.success.main,
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: theme.palette.success.main }}>
              <StorageIcon sx={{ fontSize: 22 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Almacenamiento" 
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
            />
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem 
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              handleMoreMenuClose();
            }}
            sx={{
              borderRadius: 1.5,
              px: 2,
              py: 1.5,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                transform: 'translateX(4px)',
                '& .MuiListItemIcon-root': {
                  color: theme.palette.secondary.main,
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: theme.palette.secondary.main }}>
              <SettingsIcon sx={{ fontSize: 21 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Configuración Avanzada" 
              primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
            />
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
};

export default DashboardHeader;
