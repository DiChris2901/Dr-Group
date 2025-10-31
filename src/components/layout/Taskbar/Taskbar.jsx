import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Avatar,
  alpha,
  useTheme,
  useMediaQuery
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
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  AddBox as AddBoxIcon,
  Timeline as TimelineIcon,
  DeleteSweep as DeleteSweepIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import TaskbarMenu from './TaskbarMenu';

// Animaciones para Taskbar - Spectacular Style
const taskbarAnimations = `
  @keyframes taskbar-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.15);
    }
  }
  
  @keyframes taskbar-shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
`;

const Taskbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [openMenu, setOpenMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear hora y fecha
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-CO', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Calcular márgenes considerando el Sidebar (solo cuando modo sidebar está activo)
  const navigationMode = settings?.navigation?.mode || 'sidebar';
  const showSidebar = navigationMode === 'sidebar';
  const sidebarWidth = settings?.sidebar?.width || 280;
  const sidebarPosition = settings?.sidebar?.position || 'left';
  const isCompactMode = settings?.sidebar?.compactMode || false;
  
  // Ancho actual del sidebar (solo aplica si sidebar está visible)
  const currentSidebarWidth = isCompactMode ? 80 : sidebarWidth;

  // Definir items principales del taskbar (coinciden exactamente con Sidebar)
  const taskbarItems = [
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
        { label: 'Liquidaciones por Sala', path: '/facturacion/liquidaciones-por-sala', icon: CompaniesIcon, permission: 'facturacion.liquidaciones_por_sala' }
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
  ];

  // ===== SISTEMA DE PERMISOS (IDÉNTICO A SIDEBAR) =====
  
  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    // Si no tiene perfil de Firestore, denegar acceso
    if (!userProfile) {
      return false;
    }

    // Si no tiene permisos definidos, denegar acceso
    if (!userProfile.permissions || !Array.isArray(userProfile.permissions)) {
      return false;
    }
    
    // Si tiene el permiso "ALL", permitir todo
    if (userProfile.permissions.includes('ALL')) {
      return true;
    }
    
    // Verificar si tiene el permiso específico
    const hasPermissionResult = userProfile.permissions.includes(permission);
    
    return hasPermissionResult;
  };

  // Función para verificar permisos de submenú (granulares)
  const hasSubmenuPermission = (parentPermission, submenuPermission) => {
    if (!userProfile) return false;
    if (!userProfile.permissions || !Array.isArray(userProfile.permissions)) return false;
    if (userProfile.permissions.includes('ALL')) return true;
    
    // Si tiene el permiso padre completo, tiene acceso a todo
    if (userProfile.permissions.includes(parentPermission)) return true;
    
    // Si tiene el permiso específico del submenú
    if (submenuPermission && userProfile.permissions.includes(submenuPermission)) return true;
    
    return false;
  };

  // Función para verificar si el grupo debe mostrarse (si tiene al menos un submenú visible)
  const hasAnySubmenuPermission = (parentPermission, submenu) => {
    if (!submenu || submenu.length === 0) return false;
    
    // Si tiene el permiso padre completo, mostrar grupo
    if (hasPermission(parentPermission)) return true;
    
    // Si tiene al menos un permiso de submenú, mostrar grupo
    return submenu.some(subItem => 
      subItem.permission && hasPermission(subItem.permission)
    );
  };

  // Filtrar elementos del taskbar según permisos
  const filteredTaskbarItems = taskbarItems.filter(item => {
    if (!item.permission) return true; // Si no tiene permiso definido, mostrar
    
    // Si el item tiene submenú, verificar si tiene al menos un submenú visible
    if (item.submenu) {
      return hasAnySubmenuPermission(item.permission, item.submenu);
    }
    
    return hasPermission(item.permission);
  });

  // Filtrar submenús según permisos
  const filterSubmenu = (submenu, parentPermission) => {
    if (!submenu) return [];
    
    return submenu.filter(subItem => {
      if (!subItem.permission) return true;
      return hasSubmenuPermission(parentPermission, subItem.permission);
    });
  };

  // ===== FIN SISTEMA DE PERMISOS =====

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

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isActive = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.submenu) {
      return item.submenu.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  return (
    <>
      <style>{taskbarAnimations}</style>
      
      {/* Taskbar Container - Diseño TopBar Style */}
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
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `${theme.shadows[1]}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: isMobile ? 2 : 3,
          transition: theme.transitions.create(['box-shadow', 'background-color', 'left', 'right', 'border'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.leavingScreen,
          }),
          '&:hover': {
            boxShadow: `${theme.shadows[2]}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          }
        }}
      >
        {/* Center Section - Main Modules */}
        <Box sx={{ 
          display: 'flex', 
          gap: isMobile ? 0.5 : 0.75,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {filteredTaskbarItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Etiquetas de Categoría */}
              {index === 0 && !isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    textTransform: 'uppercase',
                    mr: 1,
                    userSelect: 'none'
                  }}
                >
                  Inicio
                </Typography>
              )}
              {index === 1 && !isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    textTransform: 'uppercase',
                    mr: 1,
                    userSelect: 'none'
                  }}
                >
                  Operaciones
                </Typography>
              )}
              {item.id === 'gestion' && !isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    textTransform: 'uppercase',
                    mr: 1,
                    userSelect: 'none'
                  }}
                >
                  Gestión
                </Typography>
              )}
              {item.id === 'reports' && !isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    textTransform: 'uppercase',
                    mr: 1,
                    userSelect: 'none'
                  }}
                >
                  Reportes
                </Typography>
              )}
              {item.id === 'admin' && !isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    textTransform: 'uppercase',
                    mr: 1,
                    userSelect: 'none'
                  }}
                >
                  Admin
                </Typography>
              )}

              {/* Contenedor minimalista de ícono + label */}
              <Box
                onClick={(e) => handleItemClick(item, e)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.75,
                  cursor: 'pointer',
                  padding: isMobile ? '6px' : '8px',
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&:hover': {
                    background: alpha(item.color, 0.04),
                    '& .taskbar-icon': {
                      color: item.color,
                      transform: 'scale(1.05)',
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

                {/* Indicador de activo - dot sutil arriba del ícono */}
                {isActive(item) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 2,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      boxShadow: `0 0 6px ${alpha(item.color, 0.6)}`,
                    }}
                  />
                )}
              </Box>

              {/* Divisores para agrupación - después de Dashboard (0), después de Ingresos (3), y antes de Administración */}
              {(index === 0 || index === 3 || (filteredTaskbarItems[index + 1]?.id === 'admin')) && (
                <Box
                  sx={{
                    width: '1px',
                    height: isMobile ? 32 : 40,
                    mx: isMobile ? 0.5 : 1,
                    background: `linear-gradient(180deg, transparent, ${alpha(theme.palette.divider, 0.3)}, transparent)`,
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
              px: 2,
              py: 1,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.default, 0.3),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
                borderColor: theme.palette.primary.main,
              }
            }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 600,
                fontSize: '0.8rem',
                color: theme.palette.text.primary,
                lineHeight: 1.3
              }}>
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                fontWeight: 500,
                textTransform: 'capitalize'
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
                px: 2,
                py: 1,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.default, 0.3),
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-1px)',
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: theme.palette.text.primary,
                    lineHeight: 1.3
                  }}>
                    {userProfile?.name?.split(' ')[0] || 'Usuario'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: theme.palette.success.main,
                        boxShadow: `0 0 4px ${theme.palette.success.main}`,
                        animation: 'taskbar-pulse 2s infinite'
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem',
                      color: theme.palette.text.secondary,
                      fontWeight: 500
                    }}>
                      Conectado
                    </Typography>
                  </Box>
                </Box>
                
                {/* Avatar del Usuario */}
                <Avatar
                  src={userProfile?.photoURL}
                  alt={userProfile?.name || 'Usuario'}
                  sx={{
                    width: 42,
                    height: 42,
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
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
        items={
          (() => {
            const currentItem = filteredTaskbarItems.find(item => item.id === openMenu);
            if (!currentItem || !currentItem.submenu) return [];
            return filterSubmenu(currentItem.submenu, currentItem.permission);
          })()
        }
        categoryColor={
          (() => {
            const currentItem = filteredTaskbarItems.find(item => item.id === openMenu);
            return currentItem?.color || theme.palette.primary.main;
          })()
        }
        onItemClick={handleMenuItemClick}
      />
    </>
  );
};

export default Taskbar;
