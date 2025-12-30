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
  Search as SearchIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import TaskbarMenu from './TaskbarMenu';

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
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [menuInicioAnchorEl, setMenuInicioAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      id: 'commitments',
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
      id: 'payments',
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
      id: 'incomes',
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
      id: 'gestion',
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
        { label: 'Histórico de Liquidaciones', path: '/liquidaciones/historico', icon: ReportsIcon, permission: 'liquidaciones.historico' }
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
      id: 'reports',
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
      color: '#00bcd4',
      permission: 'rrhh',
      submenu: [
        { label: 'Gestión RRHH', path: '/recursos-humanos', icon: BadgeIcon, permission: 'rrhh.gestion' },
        { label: 'Empleados', path: '/empleados', icon: PersonIcon, permission: 'rrhh.empleados' },
        { label: 'Asistencias', path: '/asistencias', icon: AccessTime, permission: 'rrhh.asistencias' }
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
  const { shouldShowMenuItem, hasSubmenuPermission } = usePermissions();

  // ✅ OPTIMIZACIÓN: Cachear filtrado de permisos con useMemo
  const filteredTaskbarItems = useMemo(() => {
    return taskbarItems.filter(shouldShowMenuItem);
  }, [taskbarItems, shouldShowMenuItem]);

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
  const handleSearchOpen = (event) => {
    setSearchAnchorEl(event.currentTarget);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
    setSearchQuery('');
  };

  const handleMenuInicioOpen = (event) => {
    setMenuInicioAnchorEl(event.currentTarget);
  };

  const handleMenuInicioClose = () => {
    setMenuInicioAnchorEl(null);
  };

  const handleNavigateFromSearch = (path) => {
    navigate(path);
    handleSearchClose();
    handleMenuInicioClose();
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
        {/* Left Section - Menú Inicio + Búsqueda */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mr: 2
        }}>
          {/* Botón Menú Inicio (solo si > 6 permisos) */}
          {showMenuInicio && (
            <Tooltip title="Menú">
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
            </Tooltip>
          )}

          {/* Botón de Búsqueda (siempre visible) */}
          <Tooltip title="Buscar páginas">
            <IconButton
              onClick={handleSearchOpen}
              sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }
              }}
            >
              <SearchIcon sx={{ color: theme.palette.text.secondary }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Center Section - Main Modules */}
        <Box sx={{ 
          display: 'flex', 
          gap: isMobile ? 0.5 : 0.75,
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          px: 1,
          mx: -1,
          '&::-webkit-scrollbar': {
            height: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.2),
            borderRadius: '10px',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.4)
            }
          },
          // Fade effect en los bordes para indicar scroll
          maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
        }}>
          {taskbarVisibleItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Contenedor minimalista de ícono + label */}
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
                  border: isActive(item) 
                    ? `1px solid ${alpha(item.color, 0.3)}`
                    : '1px solid transparent',
                  bgcolor: isActive(item)
                    ? alpha(item.color, 0.08)
                    : 'transparent',
                  boxShadow: isActive(item) ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  '&:hover': {
                    bgcolor: alpha(item.color, 0.08),
                    border: `1px solid ${alpha(item.color, 0.2)}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    '& .taskbar-icon': {
                      color: item.color,
                    },
                    '& .taskbar-label': {
                      color: item.color,
                      fontWeight: 600,
                    }
                  }
                }}
              >
                {/* Ícono simple sin borde */}
                <Box
                  className="taskbar-icon"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive(item) ? item.color : alpha(item.color, 0.7),
                    transition: 'all 0.2s ease',
                    ...(isActive(item) && {
                      filter: `drop-shadow(0 2px 4px ${alpha(item.color, 0.3)})`,
                    })
                  }}
                >
                  <item.icon 
                    sx={{ 
                      fontSize: isMobile ? 22 : 24,
                      transition: 'all 0.2s ease',
                    }} 
                  />
                </Box>

                {/* Label minimalista sin chip */}
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
                  }}
                >
                  {item.label}
                </Typography>

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

              {/* Divisores para agrupación - después de Dashboard (0), después de Ingresos (3), y antes de Administración */}
              {(index === 0 || index === 3 || (filteredTaskbarItems[index + 1]?.id === 'admin')) && (
                <Box
                  sx={{
                    width: '1px',
                    height: isMobile ? 40 : 48,
                    mx: isMobile ? 1 : 1.5,
                    bgcolor: alpha(theme.palette.divider, 0.2),
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Box>

        {/* Right Section - Date/Time & User Info */}
        {!isMobile && (
          <Box sx={{ 
            position: 'absolute',
            right: isMobile ? 16 : 24,
            display: 'flex', 
            alignItems: 'center',
            gap: 1.5,
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

      {/* Popover de Búsqueda */}
      <Popover
        open={Boolean(searchAnchorEl)}
        anchorEl={searchAnchorEl}
        onClose={handleSearchClose}
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
            width: 400,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            autoFocus
            size="small"
            placeholder="Buscar página..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: alpha(theme.palette.text.secondary, 0.5) }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 1,
                '& fieldset': {
                  borderColor: alpha(theme.palette.divider, 0.2),
                },
                '&:hover fieldset': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused fieldset': {
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                },
              }
            }}
          />
        </Box>
        
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {searchFilteredItems.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No se encontraron resultados
              </Typography>
            </Box>
          ) : (
            searchFilteredItems.map((item) => (
              <React.Fragment key={item.id}>
                {item.submenu ? (
                  item.submenu.map((subItem) => (
                    <ListItem key={subItem.path} disablePadding>
                      <ListItemButton onClick={() => handleNavigateFromSearch(subItem.path)}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <subItem.icon sx={{ fontSize: 20, color: item.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.label}
                          secondary={item.label}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                ) : (
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => handleNavigateFromSearch(item.path)}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <item.icon sx={{ fontSize: 20, color: item.color }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                )}
              </React.Fragment>
            ))
          )}
        </List>
      </Popover>

      {/* Popover de Menú Inicio */}
      <Popover
        open={Boolean(menuInicioAnchorEl)}
        anchorEl={menuInicioAnchorEl}
        onClose={handleMenuInicioClose}
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
            width: 350,
            maxHeight: 600,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Menú de Navegación
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Todas tus páginas disponibles
          </Typography>
        </Box>

        <Divider />

        <List sx={{ maxHeight: 500, overflow: 'auto', py: 1 }}>
          {filteredTaskbarItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Categorías */}
              {index === 0 && (
                <ListItem sx={{ pt: 1, pb: 0.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Inicio
                  </Typography>
                </ListItem>
              )}
              {index === 1 && (
                <ListItem sx={{ pt: 1, pb: 0.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Operaciones
                  </Typography>
                </ListItem>
              )}
              {item.label === 'Gestión Empresarial' && (
                <ListItem sx={{ pt: 1, pb: 0.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Gestión
                  </Typography>
                </ListItem>
              )}
              {item.label === 'Reportes' && (
                <ListItem sx={{ pt: 1, pb: 0.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Reportes
                  </Typography>
                </ListItem>
              )}
              {item.label === 'Administración' && (
                <ListItem sx={{ pt: 1, pb: 0.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Admin
                  </Typography>
                </ListItem>
              )}

              {/* Item principal */}
              {item.submenu ? (
                item.submenu.map((subItem) => (
                  <ListItem key={subItem.path} disablePadding sx={{ pl: 2 }}>
                    <ListItemButton onClick={() => handleNavigateFromSearch(subItem.path)}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <subItem.icon sx={{ fontSize: 20, color: item.color }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={subItem.label}
                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem disablePadding sx={{ pl: 2 }}>
                  <ListItemButton onClick={() => handleNavigateFromSearch(item.path)}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <item.icon sx={{ fontSize: 20, color: item.color }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              )}
            </React.Fragment>
          ))}
        </List>
      </Popover>
    </>
  );
}); // Fin de React.memo

// Nombre de display para debugging
Taskbar.displayName = 'Taskbar';

export default Taskbar;
