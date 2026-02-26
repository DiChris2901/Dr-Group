import {
    AccessTime,
    AccountBalance,
    AddBox,
    Assessment,
    Assignment,
    AttachMoney,
    Badge,
    BarChart,
    Business,
    Clear,
    Dashboard,
    DeleteSweep,
    Description,
    ExpandLess,
    ExpandMore,
    Group,
    History,
    Keyboard,
    MeetingRoom,
    Notifications,
    People,
    Person,
    Receipt,
    Search,
    Timeline,
    TrendingUp
} from '@mui/icons-material';
import {
    Box,
    Chip,
    Collapse,
    Divider,
    Drawer,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Tooltip,
    Typography,
    alpha
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import ProfileAvatar from '../common/ProfileAvatar';

// Animación pulse para el indicador de sistema activo
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

const Sidebar = ({ open, onClose, variant = 'temporary', onHoverChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMuiTheme();
  const { settings } = useSettings();
  const { currentUser, userProfile: firestoreProfile } = useAuth();
  
  // 🎨 CRÍTICO: Intentar cargar foto desde caché localStorage si firestoreProfile no está listo
  const getCachedPhoto = () => {
    if (firestoreProfile?.photoURL) {
      return firestoreProfile.photoURL;
    }
    
    // Intentar desde caché localStorage
    try {
      const cached = localStorage.getItem('drgroup-userProfile');
      if (cached) {
        const parsedProfile = JSON.parse(cached);
        if (parsedProfile?.photoURL) {
          return parsedProfile.photoURL;
        }
      }
    } catch (error) {
    }
    
    // Fallback a Auth o default
    return currentUser?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80';
  };
  
  // User profile data from Firebase Auth y Firestore
  const userProfile = {
    name: firestoreProfile?.name || currentUser?.displayName || 'Diego Rueda',
    email: firestoreProfile?.email || currentUser?.email || 'diego@drgroup.com',
    role: firestoreProfile?.role || 'ADMIN',
    photoURL: getCachedPhoto() // ✅ Prioridad: Firestore → localStorage → Auth → Default
  };
  
  const [openSubmenu, setOpenSubmenu] = useState({});
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [recentPages, setRecentPages] = useState([]);
  const searchInputRef = React.useRef(null);

  // Configuración del tema
  const isDarkMode = theme.palette.mode === 'dark';

  // ⌨️ Cargar historial reciente desde localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('sidebar_recent_pages');
    if (savedHistory) {
      try {
        setRecentPages(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading recent pages:', error);
      }
    }
  }, []);

  // 📍 Guardar página visitada en historial
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Buscar información de la página actual (sin guardar el ícono)
    const findPageInfo = (items) => {
      for (const item of items) {
        if (item.path === currentPath) {
          return { title: item.title, path: item.path, color: item.color };
        }
        if (item.submenu) {
          const subItem = item.submenu.find(sub => sub.path === currentPath);
          if (subItem) {
            return { 
              title: subItem.title, 
              path: subItem.path, 
              color: item.color 
            };
          }
        }
      }
      return null;
    };

    const pageInfo = findPageInfo([...menuItems, ...adminMenuItems]);
    
    if (pageInfo && currentPath !== '/dashboard') {
      setRecentPages(prev => {
        // Evitar duplicados
        const filtered = prev.filter(p => p.path !== currentPath);
        // Agregar al inicio y limitar a 3
        const updated = [pageInfo, ...filtered].slice(0, 3);
        // Guardar en localStorage (sin íconos)
        localStorage.setItem('sidebar_recent_pages', JSON.stringify(updated));
        return updated;
      });
    }
  }, [location.pathname]);

  // ⌨️ Atajo de teclado Ctrl + B para buscar
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlB = (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B');
      
      if (isCtrlB) {
        e.preventDefault();
        e.stopPropagation();
        
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Obtener colores del tema actual
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;

  // ✅ Modo compacto basado en configuración (usar ?? para manejar false correctamente)
  const isCompactMode = settings?.sidebar?.compactMode ?? (settings?.sidebar?.width <= 80);

  // Monitorear cambios en modo compacto
  useEffect(() => {
    // Solo para debugging si es necesario
  }, [settings?.sidebar?.compactMode, settings?.sidebar?.width, isCompactMode, isHoverExpanded]);

  // Ancho dinámico del sidebar
  const drawerWidth = isCompactMode && !isHoverExpanded ? 80 : (settings?.sidebar?.width || 280);

  // Posición del sidebar (izquierda o derecha)
  const anchor = settings?.sidebar?.position || 'left';

  const handleMouseEnter = () => {
    if (isCompactMode) {
      setIsHoverExpanded(true);
      // Comunicar al MainLayout que el sidebar se expandió
      onHoverChange?.(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCompactMode) {
      setIsHoverExpanded(false);
      // Comunicar al MainLayout que el sidebar se contrajo
      onHoverChange?.(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleSubmenuToggle = (title) => {
    // Auto-colapsar: Si se abre una categoría, cierra las demás
    setExpandedCategory(prev => prev === title ? null : title);
  };

  // Función para filtrar páginas según búsqueda
  const filterPages = (items) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      // Buscar en el título principal
      if (item.title.toLowerCase().includes(query)) return true;
      
      // Buscar en sub-items
      if (item.submenu) {
        return item.submenu.some(sub => sub.title.toLowerCase().includes(query));
      }
      
      return false;
    }).map(item => {
      // Si tiene submenu, filtrar también los sub-items
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(sub => 
            sub.title.toLowerCase().includes(query) || 
            item.title.toLowerCase().includes(query)
          )
        };
      }
      return item;
    });
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Verificar si una ruta está activa
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Verificar si un submenu tiene una ruta activa
  const hasActiveSubmenu = (submenu) => {
    return submenu?.some(item => isActiveRoute(item.path));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Dashboard,
      path: '/dashboard',
      color: primaryColor,
      permission: 'dashboard'
    },
    {
      title: 'Compromisos',
      icon: AccountBalance,
      color: secondaryColor,
      permission: 'compromisos',
      submenu: [
        { title: 'Ver Todos', icon: Assignment, path: '/commitments', permission: 'compromisos.ver_todos' },
        { title: 'Agregar Nuevo', icon: AttachMoney, path: '/commitments/new', permission: 'compromisos.agregar_nuevo' }
      ]
    },
    {
      title: 'Pagos',
      icon: Receipt,
      color: primaryColor,
      permission: 'pagos',
      submenu: [
        { title: 'Historial', icon: Assessment, path: '/payments', permission: 'pagos.historial' },
        { title: 'Nuevo Pago', icon: AttachMoney, path: '/payments/new', permission: 'pagos.nuevo_pago' }
      ]
    },
    {
      title: 'Ingresos',
      icon: TrendingUp,
      color: '#4caf50',
      permission: 'ingresos',
      submenu: [
        { title: 'Registrar Ingreso', icon: AddBox, path: '/income', permission: 'ingresos.registrar' },
        { title: 'Historial', icon: Timeline, path: '/income/history', permission: 'ingresos.historial' },
        { title: 'Cuentas Bancarias', icon: AccountBalance, path: '/income/accounts', permission: 'ingresos.cuentas' }
      ]
    },
    {
      title: 'Gestión Empresarial',
      icon: Business,
      color: secondaryColor,
      permission: 'gestion_empresarial',
      submenu: [
        { title: 'Empresas', icon: Business, path: '/companies', permission: 'gestion_empresarial.empresas' },
        { title: 'Salas', icon: MeetingRoom, path: '/facturacion/salas', permission: 'gestion_empresarial.salas' },
        { title: 'Clientes', icon: People, path: '/clientes', permission: 'gestion_empresarial.clientes' }
      ]
    },
    {
      title: 'Liquidaciones',
      icon: Receipt,
      color: '#ff9800',
      permission: 'liquidaciones',
      submenu: [
        { title: 'Liquidaciones', icon: Receipt, path: '/liquidaciones', permission: 'liquidaciones.liquidaciones' },
        { title: 'Histórico de Liquidaciones', icon: Assessment, path: '/liquidaciones/historico', permission: 'liquidaciones.historico' },
        { title: 'Estadísticas', icon: BarChart, path: '/liquidaciones/estadisticas', permission: 'liquidaciones.estadisticas' }
      ]
    },
    {
      title: 'Facturación',
      icon: AttachMoney,
      color: '#2196f3',
      permission: 'facturacion',
      submenu: [
        { title: 'Liquidaciones por Sala', icon: Business, path: '/facturacion/liquidaciones-por-sala', permission: 'facturacion.liquidaciones_por_sala' },
        { title: 'Cuentas de Cobro', icon: Receipt, path: '/facturacion/cuentas-cobro', permission: 'facturacion.cuentas_cobro' }
      ]
    },
    {
      title: 'Reportes',
      icon: Assessment,
      color: primaryColor,
      permission: 'reportes',
      submenu: [
        { title: 'Resumen General', icon: Assessment, path: '/reports/summary', permission: 'reportes.resumen' },
        { title: 'Por Empresa', icon: Business, path: '/reports/company', permission: 'reportes.por_empresa' },
        { title: 'Por Período', icon: Assignment, path: '/reports/period', permission: 'reportes.por_periodo' },
        { title: 'Por Concepto', icon: Receipt, path: '/reports/concept', permission: 'reportes.por_concepto' }
      ]
    },
    {
      title: 'Tareas',
      icon: Assignment,
      path: '/tasks',
      color: '#00bcd4',
      permission: 'tareas',
      alternativePermissions: ['tareas.asignar', 'tareas.ver_propias'] // Permitir acceso con cualquiera de estos
    },
    {
      title: 'RRHH',
      icon: Badge,
      color: '#ff9800',
      permission: 'talento_humano',
      submenu: [
        { title: 'Talento Humano', icon: Badge, path: '/recursos-humanos', permission: 'rrhh', alternativePermissions: ['solicitudes', 'solicitudes.gestionar', 'rrhh.dashboard', 'rrhh.liquidaciones', 'rrhh.reportes'] },
        { title: 'Empleados', icon: Person, path: '/empleados', permission: 'empleados' },
        { title: 'Asistencias', icon: AccessTime, path: '/asistencias', permission: 'asistencias' },
      ]
    }
  ];

  const adminMenuItems = [
    {
      title: 'Usuarios',
      icon: People,
      path: '/users',
      color: primaryColor,
      permission: 'usuarios'
    },
    {
      title: 'Auditoría del Sistema',
      icon: Assessment,
      path: '/admin/activity-logs',
      color: '#9c27b0',
      permission: 'auditoria'
    },
    {
      title: 'Limpieza de Storage',
      icon: DeleteSweep,
      path: '/admin/orphan-files',
      color: '#f44336',
      permission: 'storage'
    }
  ];

  // ✅ Usar hook centralizado de permisos (reemplaza 60+ líneas de código duplicado)
  const { 
    hasPermission, 
    hasSubmenuPermission, 
    hasAnySubmenuVisible,
    shouldShowMenuItem 
  } = usePermissions();

  // Filtrar elementos del menú según permisos (usa shouldShowMenuItem del hook)
  const permissionFilteredMenuItems = menuItems.filter(shouldShowMenuItem);
  const permissionFilteredAdminMenuItems = adminMenuItems.filter(shouldShowMenuItem);
  
  // Aplicar filtro de búsqueda
  const filteredMenuItems = filterPages(permissionFilteredMenuItems);
  const filteredAdminMenuItems = filterPages(permissionFilteredAdminMenuItems);

  // Auto-expandir categoría basándose en la ruta actual
  React.useEffect(() => {
    // Solo auto-expandir si no hay búsqueda activa
    if (searchQuery.trim()) return;
    
    const currentCategory = menuItems.find(item => {
      if (item.path && isActiveRoute(item.path)) return true;
      if (item.submenu && hasActiveSubmenu(item.submenu)) return true;
      return false;
    });
    
    if (currentCategory && currentCategory.title !== expandedCategory) {
      setExpandedCategory(currentCategory.title);
    }
  }, [location.pathname, searchQuery]);

  const sidebarContent = (
    <>
      <style>{pulseAnimation}</style>
      <Box 
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header del Sidebar */}
      <Box
        sx={{
          p: isCompactMode && !isHoverExpanded ? 1 : 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha(theme.palette.secondary.dark, 0.95)} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          borderTopRightRadius: anchor === 'left' ? '8px' : '0px',
          borderTopLeftRadius: anchor === 'right' ? '8px' : '0px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isCompactMode && !isHoverExpanded ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <ProfileAvatar
                photoURL={userProfile?.photoURL}
                name={userProfile?.name}
                email={userProfile?.email}
                size={48}
                border={true}
              />
            </motion.div>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
              >
                <ProfileAvatar
                  photoURL={userProfile?.photoURL}
                  name={userProfile?.name}
                  email={userProfile?.email}
                  size={96}
                  border={true}
                />
              </motion.div>
              <Box textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                  {userProfile?.name || 'Diego Rueda'}
                </Typography>
                <Chip
                  label={userProfile?.role || 'ADMIN'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
          )}
        </motion.div>
      </Box>

      {/* Menú Principal */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '10px',
          transition: 'background 0.3s ease',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.6)
          }
        }
      }}>
        {/* 📚 Historial Reciente - Diseño Compacto con Categoría */}
        {!isCompactMode && recentPages.length > 0 && !searchQuery && (
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              mb: 0.75
            }}>
              <History sx={{ 
                fontSize: 13, 
                color: alpha(theme.palette.text.secondary, 0.5) 
              }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color: alpha(theme.palette.text.secondary, 0.6),
                  textTransform: 'uppercase',
                }}
              >
                Recientes
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 0.5,
              px: 1,
              overflow: 'hidden'
            }}>
              {recentPages.map((page, index) => {
                // Buscar el ícono y la categoría desde menuItems/adminMenuItems
                const getPageInfo = (path) => {
                  const allItems = [...menuItems, ...adminMenuItems];
                  for (const item of allItems) {
                    if (item.path === path) {
                      return { 
                        icon: item.icon, 
                        category: null, // Es un item principal
                        categoryColor: item.color 
                      };
                    }
                    if (item.submenu) {
                      const subItem = item.submenu.find(sub => sub.path === path);
                      if (subItem) {
                        return { 
                          icon: subItem.icon || item.icon, 
                          category: item.title, // Nombre de la categoría padre
                          categoryColor: item.color 
                        };
                      }
                    }
                  }
                  return { icon: Dashboard, category: null, categoryColor: primaryColor };
                };
                
                const pageInfo = getPageInfo(page.path);
                const PageIcon = pageInfo.icon;
                const isActive = isActiveRoute(page.path);
                
                return (
                  <motion.div
                    key={page.path}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    style={{ 
                      flex: '1 1 0',
                      minWidth: 0
                    }}
                  >
                    <Tooltip 
                      title={
                        <Box sx={{ textAlign: 'center' }}>
                          {pageInfo.category && (
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.7 }}>
                              {pageInfo.category}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {page.title}
                          </Typography>
                        </Box>
                      }
                      placement="right"
                      arrow
                    >
                      <Box
                        onClick={() => handleNavigation(page.path)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.2,
                          py: 0.5,
                          px: 0.5,
                          height: '100%',
                          borderRadius: 1.5,
                          bgcolor: isActive 
                            ? alpha(pageInfo.categoryColor, 0.15) 
                            : alpha(theme.palette.background.paper, 0.5),
                          border: `1px solid ${alpha(pageInfo.categoryColor, isActive ? 0.4 : 0.2)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(pageInfo.categoryColor, 0.2),
                            borderColor: alpha(pageInfo.categoryColor, 0.6),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(pageInfo.categoryColor, 0.2)}`
                          }
                        }}
                      >
                        <PageIcon sx={{ 
                          fontSize: 18,
                          color: pageInfo.categoryColor,
                        }} />
                        {pageInfo.category && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.5rem',
                              fontWeight: 600,
                              letterSpacing: 0.3,
                              color: pageInfo.categoryColor,
                              textTransform: 'uppercase',
                              lineHeight: 1,
                              textAlign: 'center',
                            }}
                          >
                            {pageInfo.category}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: isActive ? 600 : 500,
                            color: 'text.primary',
                            textAlign: 'center',
                            lineHeight: 1.1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            width: '100%',
                          }}
                        >
                          {page.title}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </motion.div>
                );
              })}
            </Box>
            <Divider sx={{ mt: 1.5, mb: 1 }} />
          </Box>
        )}

        {/* Barra de Búsqueda */}
        {!isCompactMode && (
          <Box sx={{ px: 2, pt: recentPages.length > 0 && !searchQuery ? 0 : 1, pb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar página..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputRef={searchInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ 
                      fontSize: 18,
                      color: alpha(theme.palette.text.secondary, 0.5)
                    }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searchQuery ? (
                      <IconButton
                        size="small"
                        onClick={clearSearch}
                        sx={{ 
                          p: 0.5,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                          }
                        }}
                      >
                        <Clear sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : (
                      <Chip
                        icon={<Keyboard sx={{ fontSize: 12 }} />}
                        label="Ctrl+B"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: alpha(theme.palette.text.secondary, 0.7),
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          '& .MuiChip-icon': {
                            fontSize: 12,
                            ml: 0.5
                          }
                        }}
                      />
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                  },
                  '&:hover': {
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    },
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1,
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  '&::placeholder': {
                    opacity: 0.5,
                  }
                },
              }}
            />
          </Box>
        )}
        
        <List sx={{ pt: isCompactMode ? 1 : 0 }}>
          {filteredMenuItems.map((item, index) => {
            // Determinar si debe mostrar etiqueta de categoría
            const showCategoryLabel = !isCompactMode && (() => {
              // Solo mostrar si no hay búsqueda activa
              if (searchQuery.trim()) return null;
              
              // Primera categoría: INICIO (Dashboard)
              if (index === 0 && item.title === 'Dashboard') {
                return 'Inicio';
              }
              // Segunda categoría: OPERACIONES (Compromisos, Pagos, Ingresos)
              if (index > 0 && item.title === 'Compromisos' && filteredMenuItems[index - 1]?.title === 'Dashboard') {
                return 'Operaciones';
              }
              // Tercera categoría: GESTIÓN (Gestión Empresarial, Liquidaciones, Facturación)
              if (item.title === 'Gestión Empresarial') {
                return 'Gestión';
              }
              // Cuarta categoría: REPORTES
              if (item.title === 'Reportes') {
                return 'Reportes';
              }
              return null;
            })();
            
            return (
            <React.Fragment key={item.title}>
              {/* Etiquetas de Categoría */}
              {showCategoryLabel && (
                <Box sx={{ px: 3, pt: index === 0 ? 1 : 2.5, pb: index === 0 ? 1 : 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 20,
                    height: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.4),
                    borderRadius: 1
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.text.primary, 0.6)
                        : alpha(theme.palette.text.secondary, 0.8),
                      textTransform: 'uppercase',
                      userSelect: 'none'
                    }}
                  >
                    {showCategoryLabel}
                  </Typography>
                </Box>
              )}
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  {(isCompactMode && !isHoverExpanded) ? (
                    <Tooltip 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 3, 
                            height: 16, 
                            bgcolor: item.color,
                            borderRadius: 1 
                          }} />
                          <Typography sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                        </Box>
                      }
                      placement={anchor === 'left' ? 'right' : 'left'}
                      arrow
                      enterDelay={200}
                      leaveDelay={0}
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.background.paper, 0.98)
                              : alpha(theme.palette.grey[900], 0.95),
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: `1px solid ${alpha(item.color, 0.3)}`,
                            boxShadow: `0 8px 24px ${alpha(item.color, 0.25)}`,
                            '& .MuiTooltip-arrow': {
                              color: theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.background.paper, 0.98)
                                : alpha(theme.palette.grey[900], 0.95)
                            }
                          }
                        }
                      }}
                    >
                      <ListItemButton
                        onClick={() => item.submenu ? handleSubmenuToggle(item.title) : handleNavigation(item.path)}
                        sx={{
                          mx: 1,
                          borderRadius: 2,
                          py: 1.5,
                          minHeight: 48,
                          justifyContent: 'center',
                          minWidth: 48,
                          bgcolor: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu) ? `${primaryColor}20` : 'transparent',
                          '&:hover': {
                            bgcolor: `${primaryColor}20`,
                            '& .MuiListItemIcon-root': {
                              color: item.color
                            }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: 'unset',
                          justifyContent: 'center',
                          display: settings?.sidebar?.showIcons !== false ? 'flex' : 'none'
                        }}>
                          <item.icon sx={{ 
                            color: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu) ? primaryColor : item.color,
                            fontSize: '1.5rem'
                          }} />
                        </ListItemIcon>
                        {/* Indicador activo para modo compacto */}
                        {settings?.sidebar?.showActiveIndicator !== false && (isActiveRoute(item.path) || hasActiveSubmenu(item.submenu)) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              [anchor]: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 3,
                              height: 20,
                              bgcolor: primaryColor,
                              borderRadius: anchor === 'left' ? '0 2px 2px 0' : '2px 0 0 2px'
                            }}
                          />
                        )}
                      </ListItemButton>
                    </Tooltip>
                  ) : (
                    <ListItemButton
                      onClick={() => item.submenu ? handleSubmenuToggle(item.title) : handleNavigation(item.path)}
                      sx={{
                        mx: 2,
                        borderRadius: 2,
                        py: 1.2,
                        minHeight: 48,
                        justifyContent: 'flex-start',
                        bgcolor: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu) 
                          ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12)
                          : 'transparent',
                        boxShadow: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu)
                          ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                          : 'none',
                        borderLeft: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu)
                          ? `4px solid ${theme.palette.primary.main}` 
                          : '4px solid transparent',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08),
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                          transform: 'translateX(4px)',
                          borderLeftColor: alpha(theme.palette.primary.main, 0.6),
                          '& .MuiListItemIcon-root': {
                            color: item.color,
                            transform: 'scale(1.15) rotate(5deg)',
                            transition: 'transform 0.2s ease'
                          },
                          '& .MuiListItemText-primary': {
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            transition: 'color 0.2s ease'
                          }
                        },
                        '&:active': {
                          transform: 'translateX(2px) scale(0.98)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 56,
                        justifyContent: 'center',
                        display: settings?.sidebar?.showIcons !== false ? 'flex' : 'none'
                      }}>
                        <item.icon sx={{ 
                          color: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu) ? primaryColor : item.color,
                          fontSize: '1.5rem'
                        }} />
                      </ListItemIcon>
                      {settings?.sidebar?.showLabels !== false && (
                        <ListItemText 
                          primary={item.title}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontWeight: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu) ? 600 : 500,
                              fontSize: '1rem',
                              color: isActiveRoute(item.path) || hasActiveSubmenu(item.submenu) ? primaryColor : 'inherit'
                            }
                          }}
                        />
                      )}
                      {item.submenu && settings?.sidebar?.showLabels !== false && (
                        expandedCategory === item.title ? <ExpandLess /> : <ExpandMore />
                      )}
                      {/* Indicador activo para modo expandido */}
                      {settings?.sidebar?.showActiveIndicator !== false && (isActiveRoute(item.path) || hasActiveSubmenu(item.submenu)) && (
                        <Box
                          sx={{
                            position: 'absolute',
                            [anchor]: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3,
                            height: 20,
                            bgcolor: primaryColor,
                            borderRadius: anchor === 'left' ? '0 2px 2px 0' : '2px 0 0 2px'
                          }}
                        />
                      )}
                    </ListItemButton>
                  )}
                </ListItem>

                {/* Submenu */}
                {item.submenu && (!isCompactMode || isHoverExpanded) && (
                  <Collapse in={expandedCategory === item.title || searchQuery.trim() !== ''} timeout={400} unmountOnExit>
                    <List component="div" disablePadding sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      borderRadius: 2,
                      mx: 2,
                      my: 0.5,
                      py: 0.5
                    }}>
                      {item.submenu
                        .filter(subItem => {
                          // Verificar permiso principal del subItem
                          if (hasSubmenuPermission(item.permission, subItem.permission)) return true;
                          // Verificar permisos alternativos (ej: Talento Humano visible con solicitudes o solicitudes.gestionar)
                          if (subItem.alternativePermissions) {
                            return subItem.alternativePermissions.some(altPerm => hasPermission(altPerm));
                          }
                          return false;
                        })
                        .map((subItem) => (
                        <ListItem key={subItem.title} disablePadding>
                          <ListItemButton
                            onClick={() => handleNavigation(subItem.path)}
                            sx={{
                              pl: 5,
                              mx: 1,
                              my: 0.5,
                              borderRadius: 1.5,
                              py: 1,
                              minHeight: 40,
                              bgcolor: isActiveRoute(subItem.path) 
                                ? alpha(theme.palette.primary.main, 0.12)
                                : 'transparent',
                              borderLeft: `3px solid ${isActiveRoute(subItem.path) 
                                ? theme.palette.primary.main 
                                : 'transparent'}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                borderLeftColor: alpha(theme.palette.primary.main, 0.5),
                                transform: 'translateX(6px)',
                                '& .MuiListItemIcon-root': {
                                  transform: 'scale(1.1)',
                                  color: theme.palette.primary.main
                                }
                              }
                            }}
                          >
                            <ListItemIcon sx={{ 
                              minWidth: 40,
                              display: settings?.sidebar?.showIcons !== false ? 'flex' : 'none'
                            }}>
                              <subItem.icon sx={{ 
                                fontSize: 20, 
                                color: isActiveRoute(subItem.path) ? primaryColor : 'inherit'
                              }} />
                            </ListItemIcon>
                            {settings?.sidebar?.showLabels !== false && (
                              <ListItemText 
                                primary={subItem.title}
                                sx={{
                                  '& .MuiListItemText-primary': {
                                    fontSize: '0.875rem',
                                    fontWeight: isActiveRoute(subItem.path) ? 600 : 400,
                                    color: isActiveRoute(subItem.path) ? primaryColor : 'inherit'
                                  }
                                }}
                              />
                            )}
                            {/* Indicador activo para submenú */}
                            {settings?.sidebar?.showActiveIndicator !== false && isActiveRoute(subItem.path) && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  [anchor]: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 2,
                                  height: 16,
                                  bgcolor: primaryColor,
                                  borderRadius: anchor === 'left' ? '0 1px 1px 0' : '1px 0 0 1px'
                                }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </motion.div>
            </React.Fragment>
          );
          })}

          {/* Menú de Administrador */}
          {userProfile?.role === 'ADMIN' && (
            <>
              {settings?.sidebar?.grouping !== false && (!isCompactMode || isHoverExpanded) && (
                <>
                  <Divider sx={{ 
                    my: 2, 
                    mx: 3,
                    background: `linear-gradient(90deg, 
                      transparent 0%, 
                      ${alpha(theme.palette.primary.main, 0.2)} 50%, 
                      transparent 100%
                    )`,
                    height: '1px',
                    border: 'none'
                  }} />
                  <Box sx={{ px: 3, pt: 1, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 20,
                      height: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.4),
                      borderRadius: 1
                    }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        color: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.text.primary, 0.6)
                          : alpha(theme.palette.text.secondary, 0.8),
                        textTransform: 'uppercase',
                        userSelect: 'none'
                      }}
                    >
                      Admin
                    </Typography>
                  </Box>
                </>
              )}

              {filteredAdminMenuItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (filteredMenuItems.length + index) * 0.1 }}
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    {(isCompactMode && !isHoverExpanded) ? (
                      <Tooltip 
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 3, 
                              height: 16, 
                              bgcolor: item.color,
                              borderRadius: 1 
                            }} />
                            <Typography sx={{ fontWeight: 600 }}>
                              {item.title}
                            </Typography>
                          </Box>
                        }
                        placement={anchor === 'left' ? 'right' : 'left'}
                        arrow
                        enterDelay={200}
                        leaveDelay={0}
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.background.paper, 0.98)
                                : alpha(theme.palette.grey[900], 0.95),
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              px: 2,
                              py: 1,
                              borderRadius: 1,
                              border: `1px solid ${alpha(item.color, 0.3)}`,
                              boxShadow: `0 8px 24px ${alpha(item.color, 0.25)}`,
                              '& .MuiTooltip-arrow': {
                                color: theme.palette.mode === 'dark' 
                                  ? alpha(theme.palette.background.paper, 0.98)
                                  : alpha(theme.palette.grey[900], 0.95)
                              }
                            }
                          }
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          sx={{
                            mx: 1,
                            borderRadius: 2,
                            py: 1.5,
                            minHeight: 48,
                            justifyContent: 'center',
                            minWidth: 48,
                            bgcolor: isActiveRoute(item.path) ? `${primaryColor}20` : 'transparent',
                            '&:hover': {
                              bgcolor: `${primaryColor}20`,
                              '& .MuiListItemIcon-root': {
                                color: item.color
                              }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ 
                            minWidth: 'unset',
                            justifyContent: 'center',
                            display: settings?.sidebar?.showIcons !== false ? 'flex' : 'none'
                          }}>
                            <item.icon sx={{ 
                              color: isActiveRoute(item.path) ? primaryColor : item.color,
                              fontSize: '1.5rem'
                            }} />
                          </ListItemIcon>
                          {/* Indicador activo */}
                          {settings?.sidebar?.showActiveIndicator !== false && isActiveRoute(item.path) && (
                            <Box
                              sx={{
                                position: 'absolute',
                                [anchor]: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 3,
                                height: 20,
                                bgcolor: primaryColor,
                                borderRadius: anchor === 'left' ? '0 2px 2px 0' : '2px 0 0 2px'
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    ) : (
                      <ListItemButton
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          mx: 2,
                          borderRadius: 2,
                          py: 1.2,
                          minHeight: 48,
                          justifyContent: 'flex-start',
                          bgcolor: isActiveRoute(item.path) 
                            ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12)
                            : 'transparent',
                          boxShadow: isActiveRoute(item.path) 
                            ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                            : 'none',
                          borderLeft: isActiveRoute(item.path) 
                            ? `4px solid ${theme.palette.primary.main}` 
                            : '4px solid transparent',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.15 : 0.08),
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                            transform: 'translateX(4px)',
                            borderLeftColor: alpha(theme.palette.primary.main, 0.6),
                            '& .MuiListItemIcon-root': {
                              color: item.color,
                              transform: 'scale(1.15) rotate(5deg)',
                              transition: 'transform 0.2s ease'
                            },
                            '& .MuiListItemText-primary': {
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              transition: 'color 0.2s ease'
                            }
                          },
                          '&:active': {
                            transform: 'translateX(2px) scale(0.98)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: 56,
                          justifyContent: 'center',
                          display: settings?.sidebar?.showIcons !== false ? 'flex' : 'none'
                        }}>
                          <item.icon sx={{ 
                            color: isActiveRoute(item.path) ? primaryColor : item.color,
                            fontSize: '1.5rem'
                          }} />
                        </ListItemIcon>
                        {settings?.sidebar?.showLabels !== false && (
                          <ListItemText 
                            primary={item.title}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontWeight: isActiveRoute(item.path) ? 600 : 500,
                                fontSize: '1rem',
                                color: isActiveRoute(item.path) ? primaryColor : 'inherit'
                              }
                            }}
                          />
                        )}
                        {/* Indicador activo */}
                        {settings?.sidebar?.showActiveIndicator !== false && isActiveRoute(item.path) && (
                          <Box
                            sx={{
                              position: 'absolute',
                              [anchor]: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 3,
                              height: 20,
                              bgcolor: primaryColor,
                              borderRadius: anchor === 'left' ? '0 2px 2px 0' : '2px 0 0 2px'
                            }}
                          />
                        )}
                      </ListItemButton>
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </>
          )}
        </List>

        {/* Footer del Sidebar */}
        <Box 
          sx={{ 
            p: isCompactMode && !isHoverExpanded ? 1 : 2, 
            mt: 'auto',
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            background: `linear-gradient(180deg, 
              transparent 0%, 
              ${alpha(theme.palette.primary.main, 0.02)} 100%
            )`
          }}
        >
          {(!isCompactMode || isHoverExpanded) && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ 
                display: 'block', 
                mb: 1,
                fontWeight: 600,
                letterSpacing: 0.5
              }}>
                DR Group Dashboard
              </Typography>
              
              {/* Versión del sistema */}
              <Typography variant="caption" sx={{ 
                display: 'block',
                color: alpha(theme.palette.text.secondary, 0.6),
                fontSize: '0.65rem',
                mb: 1.5
              }}>
                v3.17.0 • Feb 2026
              </Typography>
              
              {/* Estado del sistema mejorado */}
              <Box sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                mb: 1.5
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main',
                  boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`,
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="caption" sx={{ 
                  color: theme.palette.success.main,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: 0.5
                }}>
                  ONLINE
                </Typography>
              </Box>
              
              {/* Indicador de modo de navegación mejorado */}
              {settings?.navigation?.mode && (
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={settings.navigation.mode === 'sidebar' ? 'Navegación Lateral' : 'Barra de Tareas'} 
                    size="small"
                    icon={settings.navigation.mode === 'sidebar' ? <Dashboard sx={{ fontSize: '0.875rem' }} /> : <Timeline sx={{ fontSize: '0.875rem' }} />}
                    sx={{ 
                      height: 24,
                      fontSize: '0.7rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      '& .MuiChip-icon': {
                        color: theme.palette.primary.main
                      }
                    }} 
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
      </Box>
    </>
  );

  return (
    <Box 
      sx={{ 
        position: 'fixed',
        top: 0,
        left: anchor === 'left' ? 0 : 'auto',
        right: anchor === 'right' ? 0 : 'auto',
        height: '100vh',
        width: drawerWidth,
        zIndex: theme.zIndex.drawer,
      }}
    >
      <Drawer
        variant={variant}
        anchor={anchor}
        open={open}
        onClose={onClose}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative !important',
            height: '100vh !important',
            top: '0 !important',
            left: '0 !important',
            right: '0 !important',
            overflowY: 'auto',
            overflowX: 'hidden',
            // Diseño limpio sin efectos glass
            background: theme.palette.background.paper,
            borderRight: anchor === 'left' 
              ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` 
              : 'none',
            borderLeft: anchor === 'right' 
              ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}` 
              : 'none',
            borderRadius: 0,
            boxShadow: anchor === 'left' 
              ? `8px 0 24px ${alpha(theme.palette.primary.main, 0.08)}, 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
              : `-8px 0 24px ${alpha(theme.palette.primary.main, 0.08)}, 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: theme.transitions.create(['width', 'transform', 'box-shadow'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen
            }),
          zIndex: theme.zIndex.drawer,
          ...(isCompactMode && {
            transition: theme.transitions.create(['width', 'transform', 'box-shadow'], {
              easing: theme.transitions.easing.easeOut,
              duration: 200
            }),
          }),
        },
        ...(variant === 'temporary' && {
          '& .MuiDrawer-paper': {
            position: 'fixed',
            zIndex: theme.zIndex.modal,
          },
        }),
      }}
    >
      {sidebarContent}
    </Drawer>
    </Box>
  );
};

export default Sidebar;
