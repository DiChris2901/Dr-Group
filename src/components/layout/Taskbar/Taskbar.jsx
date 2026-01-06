import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Avatar,
  alpha,
  useTheme,
  useMediaQuery,
  Popover,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as CommitmentsIcon,
  Receipt as PaymentsIcon,
  TrendingUp as IncomesIcon,
  Business as CompaniesIcon,
  Assessment as ReportsIcon,
  MeetingRoom as SalasIcon,
  AttachMoney as FacturacionIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  AddBox as AddBoxIcon,
  Timeline as TimelineIcon,
  DeleteSweep as DeleteSweepIcon,
  AdminPanelSettings as AdminIcon,
  AccessTime,
  BarChart as BarChartIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useFavorites } from '../../../hooks/useFavorites';
import TaskbarMenu from './TaskbarMenu';
import { Star, StarBorder } from '@mui/icons-material';

// Estilos Taskbar - Diseño Sobrio
const taskbarAnimations = ``;

// ✅ OPTIMIZACIÓN: Memoizar componente para evitar re-renders innecesarios
const Taskbar = React.memo(() => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [openMenu, setOpenMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuInicioAnchorEl, setMenuInicioAnchorEl] = useState(null);
  const [menuInicioAnchorPos, setMenuInicioAnchorPos] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsAnchorEl, setSearchResultsAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('dashboard'); // Primera categoría por defecto
  const [menuSearchQuery, setMenuSearchQuery] = useState(''); // Búsqueda interna del Menú Inicio
  const [recentPages, setRecentPages] = useState(() => {
    // Cargar páginas recientes desde localStorage
    try {
      const stored = localStorage.getItem('taskbar_recent_pages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Hook de favoritos
  const { favorites, toggleFavorite, isFavorite, loading: favoritesLoading } = useFavorites(isMobile ? 2 : 4);

  // Función para registrar página visitada
  const registerPageVisit = useCallback((path, label, categoryLabel, categoryColor) => {
    setRecentPages(prev => {
      const newRecent = [
        { path, label, categoryLabel, categoryColor, timestamp: Date.now() },
        ...prev.filter(p => p.path !== path)
      ].slice(0, 5); // Mantener solo 5 más recientes
      
      try {
        localStorage.setItem('taskbar_recent_pages', JSON.stringify(newRecent));
      } catch (e) {
        console.error('Error guardando páginas recientes:', e);
      }
      
      return newRecent;
    });
  }, []);

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ✅ OPTIMIZACIÓN: Cachear funciones de formateo con useCallback
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDate = useCallback((date) => {
    return date.toLocaleDateString('es-CO', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }, []);

  // Calcular márgenes considerando el Sidebar (solo cuando modo sidebar está activo)
  const navigationMode = settings?.navigation?.mode || 'sidebar';
  const showSidebar = navigationMode === 'sidebar';
  const sidebarWidth = settings?.sidebar?.width || 280;
  const sidebarPosition = settings?.sidebar?.position || 'left';
  const isCompactMode = settings?.sidebar?.compactMode || false;
  
  // Ancho actual del sidebar (solo aplica si sidebar está visible)
  const currentSidebarWidth = isCompactMode ? 80 : sidebarWidth;

  // ✅ OPTIMIZACIÓN: Cachear items del taskbar con useMemo
  const taskbarItems = useMemo(() => [
    {
      id: 'dashboard',
      icon: DashboardIcon,
      label: 'Dashboard',
      path: '/dashboard',
      color: theme.palette.primary.main,
      permission: 'dashboard'
    },
    {
      id: 'compromisos',
      icon: CommitmentsIcon,
      label: 'Compromisos',
      color: theme.palette.secondary.main,
      permission: 'compromisos',
      submenu: [
        { label: 'Ver Todos', path: '/commitments', icon: AssignmentIcon, permission: 'compromisos.ver_todos' },
        { label: 'Agregar Nuevo', path: '/commitments/new', icon: FacturacionIcon, permission: 'compromisos.agregar_nuevo' },
        { label: 'Próximos a Vencer', path: '/commitments/due', icon: NotificationsIcon, permission: 'compromisos.proximos_vencer' }
      ]
    },
    {
      id: 'pagos',
      icon: PaymentsIcon,
      label: 'Pagos',
      color: theme.palette.primary.main,
      permission: 'pagos',
      submenu: [
        { label: 'Historial', path: '/payments', icon: ReportsIcon, permission: 'pagos.historial' },
        { label: 'Nuevo Pago', path: '/payments/new', icon: FacturacionIcon, permission: 'pagos.nuevo_pago' }
      ]
    },
    {
      id: 'ingresos',
      icon: IncomesIcon,
      label: 'Ingresos',
      color: '#4caf50',
      permission: 'ingresos',
      submenu: [
        { label: 'Registrar Ingreso', path: '/income', icon: AddBoxIcon, permission: 'ingresos.registrar' },
        { label: 'Historial', path: '/income/history', icon: TimelineIcon, permission: 'ingresos.historial' },
        { label: 'Cuentas Bancarias', path: '/income/accounts', icon: CommitmentsIcon, permission: 'ingresos.cuentas' }
      ]
    },
    {
      id: 'companies',
      icon: CompaniesIcon,
      label: 'Gestión Empresarial',
      color: theme.palette.secondary.main,
      permission: 'gestion_empresarial',
      submenu: [
        { label: 'Empresas', path: '/companies', icon: CompaniesIcon, permission: 'gestion_empresarial.empresas' },
        { label: 'Salas', path: '/facturacion/salas', icon: SalasIcon, permission: 'gestion_empresarial.salas' },
        { label: 'Clientes', path: '/clientes', icon: PeopleIcon, permission: 'gestion_empresarial.clientes' }
      ]
    },
    {
      id: 'liquidaciones',
      icon: PaymentsIcon,
      label: 'Liquidaciones',
      color: '#ff9800',
      permission: 'liquidaciones',
      submenu: [
        { label: 'Liquidaciones', path: '/liquidaciones', icon: PaymentsIcon, permission: 'liquidaciones.liquidaciones' },
        { label: 'Histórico de Liquidaciones', path: '/liquidaciones/historico', icon: ReportsIcon, permission: 'liquidaciones.historico' },
        { label: 'Estadísticas', path: '/liquidaciones/estadisticas', icon: BarChartIcon, permission: 'liquidaciones.estadisticas' }
      ]
    },
    {
      id: 'facturacion',
      icon: FacturacionIcon,
      label: 'Facturación',
      color: '#2196f3',
      permission: 'facturacion',
      submenu: [
        { label: 'Liquidaciones por Sala', path: '/facturacion/liquidaciones-por-sala', icon: CompaniesIcon, permission: 'facturacion.liquidaciones_por_sala' },
        { label: 'Cuentas de Cobro', path: '/facturacion/cuentas-cobro', icon: PaymentsIcon, permission: 'facturacion.cuentas_cobro' }
      ]
    },
    {
      id: 'reportes',
      icon: ReportsIcon,
      label: 'Reportes',
      color: theme.palette.primary.main,
      permission: 'reportes',
      submenu: [
        { label: 'Resumen General', path: '/reports/summary', icon: ReportsIcon, permission: 'reportes.resumen' },
        { label: 'Por Empresa', path: '/reports/company', icon: CompaniesIcon, permission: 'reportes.por_empresa' },
        { label: 'Por Período', path: '/reports/period', icon: AssignmentIcon, permission: 'reportes.por_periodo' },
        { label: 'Por Concepto', path: '/reports/concept', icon: PaymentsIcon, permission: 'reportes.por_concepto' }
      ]
    },
    {
      id: 'rrhh',
      icon: BadgeIcon,
      label: 'RRHH',
      color: '#ff9800',
      permission: 'talento_humano',
      submenu: [
        { label: 'Talento Humano', path: '/recursos-humanos', icon: BadgeIcon, permission: 'rrhh' },
        { label: 'Empleados', path: '/empleados', icon: PersonIcon, permission: 'empleados' },
        { label: 'Asistencias', path: '/asistencias', icon: AccessTime, permission: 'asistencias' },
        { label: 'Solicitudes', path: '/solicitudes', icon: AssignmentIcon, permission: 'solicitudes' }
      ]
    },
    {
      id: 'admin',
      icon: AdminIcon,
      label: 'Administración',
      color: '#9c27b0',
      permission: 'administracion',
      submenu: [
        { label: 'Usuarios', path: '/users', icon: PeopleIcon, permission: 'usuarios' },
        { label: 'Auditoría del Sistema', path: '/admin/activity-logs', icon: ReportsIcon, permission: 'auditoria' },
        { label: 'Limpieza de Storage', path: '/admin/orphan-files', icon: DeleteSweepIcon, permission: 'storage' }
      ]
    }
  ], [theme.palette.primary.main, theme.palette.secondary.main]); // Solo recalcular si cambian los colores del tema

  // ✅ Usar hook centralizado de permisos (elimina 70+ líneas duplicadas)
  const { shouldShowMenuItem, hasSubmenuPermission, hasPermission } = usePermissions();

  // ✅ OPTIMIZACIÓN: Cachear filtrado de permisos con useMemo
  const filteredTaskbarItems = useMemo(() => {
    return taskbarItems.filter(shouldShowMenuItem);
  }, [taskbarItems, shouldShowMenuItem]);

  // Auto-seleccionar primera categoría disponible solo cuando se abre el menú
  // Detectar categoría actual basada en la página donde está el usuario
  // ✅ FIX: Actualizar selectedCategory solo cuando se ABRE el menú o cuando se navega con menú cerrado
  useEffect(() => {
    // Solo actualizar la categoría si el menú está cerrado o acabamos de cambiar de página
    if (!menuInicioAnchorEl && filteredTaskbarItems.length > 0) {
      // Buscar la categoría que contiene la página actual
      const currentCategory = filteredTaskbarItems.find(category => {
        if (category.path === location.pathname) return true;
        if (category.submenu) {
          return category.submenu.some(sub => sub.path === location.pathname);
        }
        return false;
      });
      
      if (currentCategory) {
        setSelectedCategory(currentCategory.id);
      } else {
        // Si no se encuentra la categoría, seleccionar la primera
        setSelectedCategory(filteredTaskbarItems[0]?.id || 'dashboard');
      }
    }
  }, [menuInicioAnchorEl, filteredTaskbarItems, location.pathname]);

  // ✅ Al abrir el menú, actualizar la categoría seleccionada a la actual
  useEffect(() => {
    if (menuInicioAnchorEl && filteredTaskbarItems.length > 0) {
      const currentCategory = filteredTaskbarItems.find(category => {
        if (category.path === location.pathname) return true;
        if (category.submenu) {
          return category.submenu.some(sub => sub.path === location.pathname);
        }
        return false;
      });
      
      if (currentCategory) {
        setSelectedCategory(currentCategory.id);
      }
    }
  }, [menuInicioAnchorEl]);

  // 🎯 SISTEMA INTELIGENTE: Decidir comportamiento del Taskbar
  const showMenuInicio = filteredTaskbarItems.length > 6;
  const taskbarVisibleItems = useMemo(() => {
    if (showMenuInicio) {
      // Usuarios con muchos permisos: mostrar solo primeros 4
      return filteredTaskbarItems.slice(0, 4);
    }
    // Usuarios con pocos permisos: mostrar todos
    return filteredTaskbarItems;
  }, [filteredTaskbarItems, showMenuInicio]);

  // Filtrar items para búsqueda
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return filteredTaskbarItems;
    
    const query = searchQuery.toLowerCase();
    return filteredTaskbarItems.filter(item => {
      if (item.label.toLowerCase().includes(query)) return true;
      if (item.submenu) {
        return item.submenu.some(sub => sub.label.toLowerCase().includes(query));
      }
      return false;
    });
  }, [filteredTaskbarItems, searchQuery]);

  // ✅ OPTIMIZACIÓN: Cachear función de filtrado de submenús
  const filterSubmenu = useMemo(() => {
    return (submenu, parentPermission) => {
      if (!submenu) return [];
      
      return submenu.filter(subItem => {
        if (!subItem.permission) return true;
        return hasSubmenuPermission(parentPermission, subItem.permission);
      });
    };
  }, [hasSubmenuPermission]);

  // ===== FIN SISTEMA DE PERMISOS =====

  // Handlers para búsqueda y menú
  const handleSearchFocus = (event) => {
    setSearchResultsAnchorEl(event.currentTarget);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    // Abrir popover solo si hay texto
    if (value.trim().length > 0 && !searchResultsAnchorEl) {
      setSearchResultsAnchorEl(event.currentTarget);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResultsAnchorEl(null);
  };

  const handleMenuInicioOpen = (event) => {
    const anchorEl = event.currentTarget;
    setMenuInicioAnchorEl(anchorEl);
    setMenuInicioAnchorPos(computeMenuInicioAnchorPos(anchorEl));
  };

  const handleMenuInicioClose = () => {
    setMenuInicioAnchorEl(null);
    setMenuInicioAnchorPos(null);
  };

  const handleNavigateFromSearch = (path, label, categoryLabel, categoryColor) => {
    // Registrar visita a página reciente
    if (label && categoryLabel) {
      registerPageVisit(path, label, categoryLabel, categoryColor);
    }
    navigate(path);
    setSearchQuery('');
    setSearchResultsAnchorEl(null);
    handleMenuInicioClose();
  };

  const handleToggleFavorite = async (item, event) => {
    event.stopPropagation();
    await toggleFavorite(item);
  };

  const handleItemClick = (item, event) => {
    if (item.submenu) {
      setOpenMenu(openMenu === item.id ? null : item.id);
      setAnchorEl(event.currentTarget);
    } else {
      navigate(item.path);
      setOpenMenu(null);
    }
  };

  const handleMenuClose = () => {
    setOpenMenu(null);
    setAnchorEl(null);
  };

  const handleMenuItemClick = useCallback((path) => {
    navigate(path);
    handleMenuClose();
  }, [navigate]);

  // Filtrado de menú con búsqueda interna y permisos
  const filteredMenuItems = useMemo(() => {
    // Primero filtrar por permisos los submenús de cada categoría
    let itemsWithFilteredSubmenus = filteredTaskbarItems.map(category => {
      if (!category.submenu) return category;
      
      // Filtrar submenús por permisos
      const filteredSubmenuByPermissions = category.submenu.filter(item => {
        // Si tiene permiso específico del subitem
        if (item.permission && shouldShowMenuItem(item)) {
          return true;
        }
        // Si no tiene permiso específico pero tiene el permiso padre
        if (!item.permission && hasPermission(category.permission)) {
          return true;
        }
        return false;
      });
      
      return { ...category, submenu: filteredSubmenuByPermissions };
    }).filter(category => 
      // Solo mostrar categorías que tengan al menos un submenú visible
      !category.submenu || category.submenu.length > 0
    );
    
    // Si no hay búsqueda, retornar items con submenús filtrados por permisos
    if (!menuSearchQuery.trim()) return itemsWithFilteredSubmenus;
    
    // Si hay búsqueda, filtrar adicionalmente por texto
    const query = menuSearchQuery.toLowerCase();
    return itemsWithFilteredSubmenus.map(category => {
      if (!category.submenu) return category;
      
      const filteredSubmenu = category.submenu.filter(item => 
        item.label.toLowerCase().includes(query) ||
        category.label.toLowerCase().includes(query)
      );
      
      return { ...category, submenu: filteredSubmenu };
    }).filter(category => 
      !category.submenu || category.submenu.length > 0 ||
      category.label.toLowerCase().includes(query)
    );
  }, [filteredTaskbarItems, menuSearchQuery, shouldShowMenuItem, hasPermission]);

  // Contador de páginas por categoría
  const getCategoryCount = useCallback((category) => {
    if (!category.submenu) return 0;
    return filterSubmenu(category.submenu, category.permission).length;
  }, [filterSubmenu]);

  // ✅ OPTIMIZACIÓN: Cachear función isActive con useCallback
  const isActive = useCallback((item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.submenu) {
      return item.submenu.some(subItem => location.pathname === subItem.path);
    }
    return false;
  }, [location.pathname]);

  // Constantes de layout (deben coincidir con el taskbar)
  const TASKBAR_BOTTOM_PX = 16;
  const TASKBAR_HEIGHT_PX = isMobile ? 64 : 80;
  const MENU_WIDTH_PX = 650;
  const MENU_HEIGHT_PX = 500;
  const MENU_GAP_PX = 12; // separación entre menú y taskbar
  const VIEWPORT_PADDING_PX = 16;

  const computeMenuInicioAnchorPos = useCallback((anchorEl) => {
    if (!anchorEl) return null;

    const rect = anchorEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Top del taskbar en el viewport (fixed)
    const taskbarTop = viewportHeight - TASKBAR_BOTTOM_PX - TASKBAR_HEIGHT_PX;
    // El menú debe quedar completamente arriba del taskbar
    const desiredTop = taskbarTop - MENU_GAP_PX - MENU_HEIGHT_PX;
    
    // Alinear el menú con el borde izquierdo de la taskbar
    const taskbarLeft = !isMobile && showSidebar && sidebarPosition === 'left' 
      ? currentSidebarWidth + 16 
      : 16;
    const desiredLeft = taskbarLeft;

    const top = Math.max(VIEWPORT_PADDING_PX, desiredTop);
    const left = Math.min(
      Math.max(VIEWPORT_PADDING_PX, desiredLeft),
      Math.max(VIEWPORT_PADDING_PX, viewportWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX)
    );

    return { top, left };
  }, [TASKBAR_HEIGHT_PX, isMobile, showSidebar, sidebarPosition, currentSidebarWidth]);

  useEffect(() => {
    if (!menuInicioAnchorEl) return;

    const update = () => {
      setMenuInicioAnchorPos(computeMenuInicioAnchorPos(menuInicioAnchorEl));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [menuInicioAnchorEl, computeMenuInicioAnchorPos]);

  return (
    <>
      <style>{taskbarAnimations}</style>
      
      {/* Taskbar Container - Diseño TopBar Style - SIN animación de entrada */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: !isMobile && showSidebar && sidebarPosition === 'left' 
            ? `${currentSidebarWidth + 16}px` 
            : '16px',
          right: !isMobile && showSidebar && sidebarPosition === 'right' 
            ? `${currentSidebarWidth + 32}px`  // Extra margen para compensar scrollbar
            : '32px',  // Margen aumentado para equilibrar con el left
          height: isMobile ? 64 : 80,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}, 0 2px 8px ${alpha(theme.palette.common.black, 0.08)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: isMobile ? 2 : 3,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }
        }}
      >
        {/* Left Section - Menú Inicio */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minWidth: 'fit-content',
        }}>
          {/* Botón Menú Inicio (solo si > 6 permisos) */}
          {showMenuInicio && (
            <Tooltip title={`Menú completo (${filteredTaskbarItems.length} secciones)`}>
              <Box sx={{ position: 'relative' }}>
                <IconButton
                  onClick={handleMenuInicioOpen}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    }
                  }}
                >
                  <MenuIcon sx={{ color: theme.palette.primary.main }} />
                </IconButton>
                {/* Badge con número de secciones */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: '9px',
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 0.5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {filteredTaskbarItems.length}
                </Box>
              </Box>
            </Tooltip>
          )}

          {/* Barra de Búsqueda Inline */}
          <TextField
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder={isMobile ? "Buscar..." : "Buscar páginas..."}
            size="small"
            sx={{
              width: isMobile ? 140 : 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '&.Mui-focused': {
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '& input': {
                py: 1,
                px: 1.5
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Separador Vertical */}
        {!isMobile && (
          <Box sx={{ 
            width: 2,
            height: 48,
            bgcolor: alpha(theme.palette.divider, 0.3),
            mx: 2,
            borderRadius: 1
          }} />
        )}

        {/* Center Section - Favoritos */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          overflow: 'hidden',
          mx: 1,
        }}>
          <Box sx={{
            display: 'flex', 
            gap: isMobile ? 1.5 : 2,
            alignItems: 'center',
            justifyContent: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              height: '4px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.divider, 0.3),
              borderRadius: '10px',
              '&:hover': {
                background: alpha(theme.palette.divider, 0.5)
              }
            },
          }}>
          {!favoritesLoading && favorites.map((favorite) => {
            // Buscar el item completo desde taskbarItems (puede ser categoría o subitem)
            let item = null;
            let categoryLabel = null; // Para guardar el nombre de la categoría padre
            
            // Primero buscar si es una categoría con path directo
            item = filteredTaskbarItems.find(i => i.path === favorite.path);
            
            // Si no, buscar en los submenus de cada categoría
            if (!item) {
              for (const category of filteredTaskbarItems) {
                if (category.submenu) {
                  const subItem = category.submenu.find(sub => sub.path === favorite.path);
                  if (subItem) {
                    // Guardar nombre de categoría para mostrar contexto
                    categoryLabel = category.label;
                    // Crear item temporal con el color de la categoría padre
                    item = {
                      ...subItem,
                      id: `${category.id}-${subItem.path}`,
                      color: category.color
                    };
                    break;
                  }
                }
              }
            }
            
            if (!item) return null;

            // Crear tooltip con ruta completa
            const tooltipText = categoryLabel 
              ? `${categoryLabel} → ${item.label}\n${item.path || favorite.path}`
              : `${item.label}\n${item.path || favorite.path}`;

            return (
              <React.Fragment key={item.id || item.path}>
                {/* Contenedor minimalista de ícono + label */}
                <Tooltip title={tooltipText} arrow placement="top">
                  <Box
                    onClick={(e) => handleItemClick(item, e)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.75,
                      cursor: 'pointer',
                      padding: isMobile ? '8px 10px' : '10px 12px',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'visible', // ✅ Permite que el botón X se vea completo
                    minWidth: isMobile ? 90 : 130, // ✅ Ancho aumentado para textos largos
                    maxWidth: isMobile ? 100 : 140, // ✅ Ancho máximo aumentado
                    border: isActive(item) 
                      ? `1px solid ${alpha(item.color, 0.4)}` // Borde más fuerte cuando activo
                      : `1px solid ${alpha(theme.palette.divider, 0.3)}`, // Borde sutil siempre visible
                    bgcolor: isActive(item)
                      ? alpha(item.color, 0.08)
                      : 'transparent',
                    boxShadow: isActive(item) ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    '&:hover': {
                      bgcolor: alpha(item.color, 0.08),
                      border: `1px solid ${alpha(item.color, 0.3)}`, // Borde de color al hover
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      '& .taskbar-icon': {
                        color: item.color,
                      },
                      '& .taskbar-label': {
                        color: item.color,
                        fontWeight: 600,
                      },
                      '& .remove-favorite-btn': {
                        opacity: 1,
                      }
                    }
                  }}
                >
                  {/* Botón X para quitar de favoritos (aparece al hover) */}
                  <IconButton
                    className="remove-favorite-btn"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite({ path: item.path || favorite.path, permission: item.permission });
                    }}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 22,
                      height: 22,
                      padding: 0,
                      opacity: 0,
                      transition: 'all 0.2s ease',
                      bgcolor: alpha(theme.palette.error.main, 0.95),
                      color: theme.palette.common.white,
                      zIndex: 10,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      '&:hover': {
                        bgcolor: theme.palette.error.main,
                        transform: 'scale(1.15)',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                      }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>

                  {/* Ícono simple sin borde */}
                  <Box
                    className="taskbar-icon"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color, // ✅ Color vibrante siempre
                      transition: 'all 0.2s ease',
                      filter: isActive(item) 
                        ? `drop-shadow(0 2px 6px ${alpha(item.color, 0.4)})` // Activo: sombra más fuerte
                        : `drop-shadow(0 1px 3px ${alpha(item.color, 0.2)})`, // Inactivo: sombra sutil
                    }}
                  >
                    <item.icon 
                      sx={{ 
                        fontSize: isMobile ? 22 : 24,
                        transition: 'all 0.2s ease',
                      }} 
                    />
                  </Box>

                  {/* Label con contexto de categoría (si es subitem) */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 0.25,
                    width: '100%', // ✅ Ocupa todo el ancho disponible
                    overflow: 'hidden' // ✅ Contiene el texto overflow
                  }}>
                    {categoryLabel && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          fontWeight: 500,
                          color: alpha(item.color, 0.6),
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                          lineHeight: 1,
                          opacity: 0.8,
                          width: '100%',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {categoryLabel}
                      </Typography>
                    )}
                    <Typography
                      className="taskbar-label"
                      variant="caption"
                      sx={{
                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                        fontWeight: isActive(item) ? 600 : 500,
                        color: isActive(item) ? item.color : 'text.secondary',
                        letterSpacing: 0.2,
                        transition: 'all 0.2s ease',
                        textTransform: 'none',
                        lineHeight: 1,
                        opacity: isActive(item) ? 1 : 0.8,
                        width: '100%',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>

                {/* Indicador de activo - barra inferior estilo macOS Dock */}
                {isActive(item) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      marginLeft: '-35%',
                      width: '70%',
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                      bgcolor: item.color,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  />
                )}
              </Box>
            </Tooltip>
            </React.Fragment>
          );
          })}
          </Box>
        </Box>

        {/* Separador Vertical */}
        {!isMobile && (
          <Box sx={{ 
            width: 2,
            height: 48,
            bgcolor: alpha(theme.palette.divider, 0.3),
            mx: 2,
            borderRadius: 1
          }} />
        )}

        {/* Right Section - Date/Time & User Info */}
        {!isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1.5,
            minWidth: 'fit-content',
          }}>
            {/* Date and Time */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'flex-end',
              px: 2.5,
              py: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 600,
                fontSize: '0.9rem',
                color: theme.palette.primary.main,
                lineHeight: 1.3,
                letterSpacing: 0.3
              }}>
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                fontWeight: 500,
                textTransform: 'capitalize',
                letterSpacing: 0.2
              }}>
                {formatDate(currentTime)}
              </Typography>
            </Box>

            {/* User Info */}
            {userProfile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 1.5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: theme.palette.primary.main,
                    lineHeight: 1.3
                  }}>
                    {userProfile?.name?.split(' ')[0] || 'Usuario'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: theme.palette.success.main,
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem',
                      color: theme.palette.success.main,
                      fontWeight: 500,
                      letterSpacing: 0.3
                    }}>
                      ONLINE
                    </Typography>
                  </Box>
                </Box>
                
                {/* Avatar del Usuario */}
                <Avatar
                  className="user-avatar"
                  src={userProfile?.photoURL}
                  alt={userProfile?.name || 'Usuario'}
                  sx={{
                    width: 48,
                    height: 48,
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {!userProfile?.photoURL && (userProfile?.name?.charAt(0) || 'U')}
                </Avatar>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Submenu Popup */}
      <TaskbarMenu
        open={openMenu !== null}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        items={useMemo(() => {
          const currentItem = taskbarVisibleItems.find(item => item.id === openMenu);
          if (!currentItem || !currentItem.submenu) return [];
          return filterSubmenu(currentItem.submenu, currentItem.permission);
        }, [openMenu, taskbarVisibleItems, filterSubmenu])}
        categoryColor={useMemo(() => {
          const currentItem = taskbarVisibleItems.find(item => item.id === openMenu);
          return currentItem?.color || theme.palette.primary.main;
        }, [openMenu, taskbarVisibleItems, theme.palette.primary.main])}
        onItemClick={handleMenuItemClick}
      />

      {/* Popover de Resultados de Búsqueda (arriba de la taskbar) */}
      <Popover
        open={Boolean(searchResultsAnchorEl) && searchQuery.trim().length > 0}
        anchorEl={searchResultsAnchorEl}
        onClose={() => {
          setSearchResultsAnchorEl(null);
        }}
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: isMobile ? 240 : 320,
            maxHeight: 400,
            borderRadius: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            mt: 0.5
          }
        }}
      >
        <List sx={{ py: 0.5 }}>
          {searchFilteredItems.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron resultados
              </Typography>
            </Box>
          ) : (
            searchFilteredItems.slice(0, 8).map((item) => (
              <React.Fragment key={item.id}>
                {item.submenu ? (
                  item.submenu.slice(0, 3).map((subItem) => (
                    <ListItem key={subItem.path} disablePadding>
                      <ListItemButton 
                        onClick={() => handleNavigateFromSearch(subItem.path)}
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <subItem.icon sx={{ fontSize: 18, color: item.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.label}
                          secondary={item.label}
                          primaryTypographyProps={{ fontSize: '0.8rem' }}
                          secondaryTypographyProps={{ fontSize: '0.7rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                ) : (
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => handleNavigateFromSearch(item.path)}
                      sx={{ py: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <item.icon sx={{ fontSize: 18, color: item.color }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                )}
              </React.Fragment>
            ))
          )}
        </List>
      </Popover>

      {/* Popover de Menú Inicio - Diseño de Dos Columnas */}
      <Popover
        open={Boolean(menuInicioAnchorEl && menuInicioAnchorPos)}
        anchorReference="anchorPosition"
        anchorPosition={menuInicioAnchorPos || { top: 0, left: 0 }}
        onClose={handleMenuInicioClose}
        disableAutoFocus
        disableEnforceFocus
        slotProps={{
          paper: {
            sx: {
              width: 650,
              height: 500,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              overflow: 'hidden'
            }
          }
        }}
      >
        {/* Header con Búsqueda Interna - Diseño Mejorado */}
        <Box sx={{ 
          p: 2.5,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            {/* Sección de Título */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: alpha('#ffffff', 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MenuIcon sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'white',
                    letterSpacing: -0.5
                  }}
                >
                  Menú de Navegación
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem',
                  ml: 5.5,
                  display: 'block'
                }}
              >
                {filteredTaskbarItems.length} categorías • Acceso rápido a todas tus páginas
              </Typography>
            </Box>
            
            {/* Campo de Búsqueda */}
            <TextField
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              placeholder="Buscar en menú..."
              size="small"
              sx={{
                width: 240,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: theme.palette.background.paper,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  boxShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.04)}`,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.2)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.4)
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2
                    }
                  }
                },
                '& input': {
                  py: 1,
                  px: 1.5
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: menuSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setMenuSearchQuery('')}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

        {/* Layout de Dos Columnas */}
        <Box sx={{ display: 'flex', height: 'calc(500px - 96px)', maxHeight: 'calc(500px - 96px)' }}>
          {/* Columna Izquierda - Categorías con Contadores */}
          <Box sx={{ 
            width: 220,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 1.5
          }}>
            <List sx={{ py: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredMenuItems.map((category) => (
                <ListItem key={category.id} disablePadding>
                  <ListItemButton
                    selected={selectedCategory === category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      border: `1px solid ${alpha(category.color, selectedCategory === category.id ? 0.4 : 0.15)}`,
                      bgcolor: selectedCategory === category.id 
                        ? alpha(category.color, 0.12) 
                        : alpha(theme.palette.background.paper, 0.6),
                      boxShadow: selectedCategory === category.id 
                        ? `0 2px 8px ${alpha(category.color, 0.2)}` 
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      '&.Mui-selected': {
                        bgcolor: alpha(category.color, 0.12),
                        '&:hover': {
                          bgcolor: alpha(category.color, 0.15),
                        }
                      },
                      '&:hover': {
                        bgcolor: alpha(category.color, 0.08),
                        border: `1px solid ${alpha(category.color, 0.3)}`,
                        boxShadow: `0 2px 8px ${alpha(category.color, 0.15)}`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <category.icon sx={{ 
                        fontSize: 20, 
                        color: category.color,
                        opacity: selectedCategory === category.id ? 1 : 0.7,
                        transition: 'all 0.2s ease'
                      }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={category.label}
                      primaryTypographyProps={{ 
                        fontSize: '0.875rem',
                        fontWeight: selectedCategory === category.id ? 600 : 500,
                        color: category.color
                      }}
                    />
                    {/* Contador de páginas */}
                    {category.submenu && (
                      <Box
                        sx={{
                          minWidth: 24,
                          height: 20,
                          borderRadius: 1,
                          bgcolor: selectedCategory === category.id 
                            ? alpha(category.color, 0.2) 
                            : alpha(theme.palette.divider, 0.1),
                          color: selectedCategory === category.id 
                            ? category.color 
                            : theme.palette.text.secondary,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 0.75,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {getCategoryCount(category)}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Columna Derecha - Páginas de la Categoría Seleccionada */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 2
          }}>
            {/* Breadcrumb Visual */}
            {selectedCategory && (() => {
              const category = filteredMenuItems.find(cat => cat.id === selectedCategory);
              if (!category) return null;
              
              return (
                <Box sx={{ 
                  mb: 2, 
                  pb: 1.5, 
                  borderBottom: `2px solid ${alpha(category.color, 0.2)}`
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <category.icon sx={{ fontSize: 20, color: category.color }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '1rem',
                        color: category.color 
                      }}
                    >
                      {category.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                    {getCategoryCount(category)} páginas disponibles
                  </Typography>
                </Box>
              );
            })()}

            {/* Páginas Recientes */}
            {recentPages.length > 0 && (
              <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    display: 'block',
                    mb: 1
                  }}
                >
                  📌 Páginas Recientes
                </Typography>
                <List sx={{ py: 0 }}>
                  {recentPages.slice(0, 3).map((page) => {
                    const isCurrentPage = location.pathname === page.path;
                    
                    return (
                      <ListItem key={page.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleNavigateFromSearch(page.path, page.label, page.categoryLabel, page.categoryColor)}
                          selected={isCurrentPage}
                          sx={{
                            py: 1,
                            px: 1.5,
                            borderRadius: 1,
                            transition: 'all 0.2s ease',
                            border: `1px solid ${alpha(page.categoryColor || theme.palette.divider, 0.15)}`,
                            bgcolor: isCurrentPage 
                              ? alpha(page.categoryColor || theme.palette.primary.main, 0.08) 
                              : 'transparent',
                            '&:hover': {
                              bgcolor: alpha(page.categoryColor || theme.palette.primary.main, 0.08),
                              border: `1px solid ${alpha(page.categoryColor || theme.palette.primary.main, 0.3)}`,
                            }
                          }}
                        >
                          <ListItemText 
                            primary={page.label}
                            secondary={page.categoryLabel}
                            primaryTypographyProps={{ 
                              fontSize: '0.8rem',
                              fontWeight: isCurrentPage ? 600 : 400
                            }}
                            secondaryTypographyProps={{ 
                              fontSize: '0.65rem',
                              color: page.categoryColor || 'text.secondary'
                            }}
                          />
                          {isCurrentPage && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: page.categoryColor || theme.palette.primary.main,
                                ml: 1
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            <List sx={{ py: 0 }}>
              {(() => {
                // Encontrar la categoría seleccionada
                const selectedItem = filteredMenuItems.find(item => item.id === selectedCategory);
                
                if (!selectedItem) return null;

                // Si tiene submenu, mostrar los subitems
                if (selectedItem.submenu) {
                  return selectedItem.submenu.map((subItem) => {
                    const isCurrentPage = location.pathname === subItem.path;
                    
                    return (
                      <ListItem key={subItem.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton 
                          onClick={() => handleNavigateFromSearch(
                            subItem.path, 
                            subItem.label, 
                            selectedItem.label, 
                            selectedItem.color
                          )}
                          selected={isCurrentPage}
                          sx={{
                            py: 1.5,
                            px: 2,
                            borderRadius: 1,
                            transition: 'all 0.2s ease',
                            border: isCurrentPage 
                              ? `2px solid ${selectedItem.color}`
                              : `1px solid transparent`,
                            bgcolor: isCurrentPage 
                              ? alpha(selectedItem.color, 0.12) 
                              : 'transparent',
                            '&.Mui-selected': {
                              bgcolor: alpha(selectedItem.color, 0.12),
                              '&:hover': {
                                bgcolor: alpha(selectedItem.color, 0.15)
                              }
                            },
                            '&:hover': {
                              bgcolor: alpha(selectedItem.color, 0.08),
                              border: `1px solid ${alpha(selectedItem.color, 0.2)}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <subItem.icon sx={{ 
                              fontSize: 20, 
                              color: selectedItem.color,
                              opacity: isCurrentPage ? 1 : 0.7,
                              transition: 'all 0.2s ease'
                            }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.label}
                            primaryTypographyProps={{ 
                              fontSize: '0.875rem',
                              fontWeight: isCurrentPage ? 600 : 400,
                              color: 'text.primary'
                            }}
                          />
                          {/* Indicador "Estás aquí" */}
                          {isCurrentPage && (
                            <Box
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5,
                                bgcolor: alpha(selectedItem.color, 0.2),
                                color: selectedItem.color,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                mr: 1
                              }}
                            >
                              Aquí
                            </Box>
                          )}
                          {/* Estrella de Favorito */}
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleFavorite({ path: subItem.path, permission: subItem.permission }, e)}
                            sx={{ 
                              ml: 0.5,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.warning.main, 0.1)
                              }
                            }}
                          >
                            {isFavorite(subItem.path) ? (
                              <Star sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                            ) : (
                              <StarBorder sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                            )}
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    );
                  });
                } else {
                  // Si no tiene submenu, mostrar un mensaje o la página directa
                  return (
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton 
                        onClick={() => handleNavigateFromSearch(selectedItem.path)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          border: `1px solid transparent`,
                          '&:hover': {
                            bgcolor: alpha(selectedItem.color, 0.08),
                            border: `1px solid ${alpha(selectedItem.color, 0.2)}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <selectedItem.icon sx={{ fontSize: 20, color: selectedItem.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={selectedItem.label}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                        {/* Estrella de Favorito */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleFavorite({ path: selectedItem.path, permission: selectedItem.permission }, e)}
                          sx={{ 
                            ml: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.warning.main, 0.1)
                            }
                          }}
                        >
                          {isFavorite(selectedItem.path) ? (
                            <Star sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                          ) : (
                            <StarBorder sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                          )}
                        </IconButton>
                      </ListItemButton>
                    </ListItem>
                  );
                }
              })()}
            </List>
          </Box>
        </Box>
      </Popover>
    </>
  );
}); // Fin de React.memo

// Nombre de display para debugging
Taskbar.displayName = 'Taskbar';

export default Taskbar;
