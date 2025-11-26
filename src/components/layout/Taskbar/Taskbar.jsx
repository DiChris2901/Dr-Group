import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  AddBox as AddBoxIcon,
  Timeline as TimelineIcon,
  DeleteSweep as DeleteSweepIcon,
  AdminPanelSettings as AdminIcon,
  AccessTime
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
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
      id: 'admin',
      icon: AdminIcon,
      label: 'Administración',
      color: '#9c27b0',
      permission: 'administracion',
      submenu: [
        { label: 'Usuarios', path: '/users', icon: PeopleIcon, permission: 'usuarios' },
        { label: 'Empleados', path: '/empleados', icon: PersonIcon, permission: 'empleados' },
        { label: 'Asistencias', path: '/asistencias', icon: AccessTime, permission: 'asistencias' },
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
          transition: theme.transitions.create(['box-shadow', 'transform', 'left', 'right', 'border'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.18)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.12)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}`,
            transform: 'translateY(-2px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          }
        }}
      >
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
          {filteredTaskbarItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {/* Etiquetas de Categoría */}
              {index === 0 && !isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  mr: 2
                }}>
                  <Box sx={{
                    width: 3,
                    height: 12,
                    bgcolor: theme.palette.primary.main,
                    borderRadius: 1
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: theme.palette.primary.main,
                      textTransform: 'uppercase',
                      userSelect: 'none'
                    }}
                  >
                    Inicio
                  </Typography>
                </Box>
              )}
              {index === 1 && !isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                  mr: 2
                }}>
                  <Box sx={{
                    width: 3,
                    height: 12,
                    bgcolor: theme.palette.secondary.main,
                    borderRadius: 1
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: theme.palette.secondary.main,
                      textTransform: 'uppercase',
                      userSelect: 'none'
                    }}
                  >
                    Operaciones
                  </Typography>
                </Box>
              )}
              {item.id === 'gestion' && !isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                  mr: 2
                }}>
                  <Box sx={{
                    width: 3,
                    height: 12,
                    bgcolor: theme.palette.secondary.main,
                    borderRadius: 1
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: theme.palette.secondary.main,
                      textTransform: 'uppercase',
                      userSelect: 'none'
                    }}
                  >
                    Gestión
                  </Typography>
                </Box>
              )}
              {item.id === 'reports' && !isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  mr: 2
                }}>
                  <Box sx={{
                    width: 3,
                    height: 12,
                    bgcolor: theme.palette.primary.main,
                    borderRadius: 1
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: theme.palette.primary.main,
                      textTransform: 'uppercase',
                      userSelect: 'none'
                    }}
                  >
                    Reportes
                  </Typography>
                </Box>
              )}
              {item.id === 'admin' && !isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha('#9c27b0', 0.06),
                  border: `1px solid ${alpha('#9c27b0', 0.15)}`,
                  mr: 2
                }}>
                  <Box sx={{
                    width: 3,
                    height: 12,
                    bgcolor: '#9c27b0',
                    borderRadius: 1
                  }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: '#9c27b0',
                      textTransform: 'uppercase',
                      userSelect: 'none'
                    }}
                  >
                    Admin
                  </Typography>
                </Box>
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
                  padding: isMobile ? '8px 10px' : '10px 12px',
                  borderRadius: 2.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  border: isActive(item) 
                    ? `2px solid ${alpha(item.color, 0.3)}`
                    : '2px solid transparent',
                  bgcolor: isActive(item)
                    ? alpha(item.color, 0.08)
                    : 'transparent',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(item.color, 0.06)} 0%, ${alpha(item.color, 0.12)} 100%)`,
                    border: `2px solid ${alpha(item.color, 0.2)}`,
                    boxShadow: `0 6px 16px ${alpha(item.color, 0.2)}`,
                    '& .taskbar-icon': {
                      color: item.color,
                      transform: 'scale(1.1)',
                    },
                    '& .taskbar-label': {
                      color: item.color,
                      fontWeight: 700,
                    }
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
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
                      transform: 'translateX(-50%)',
                      width: '70%',
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                      bgcolor: item.color,
                      boxShadow: `0 -2px 8px ${alpha(item.color, 0.5)}`,
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
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 100%)`,
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.4),
                    }
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
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 700,
                fontSize: '0.9rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.3,
                letterSpacing: 0.5
              }}>
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                fontWeight: 600,
                textTransform: 'capitalize',
                letterSpacing: 0.3
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
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                  '& .user-avatar': {
                    transform: 'scale(1.1)',
                  }
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
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
                        boxShadow: `0 0 8px ${theme.palette.success.main}, 0 0 16px ${alpha(theme.palette.success.main, 0.5)}`,
                        animation: 'taskbar-pulse 2s infinite'
                      }}
                    />
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem',
                      color: theme.palette.success.main,
                      fontWeight: 700,
                      letterSpacing: 0.5
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
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
          const currentItem = filteredTaskbarItems.find(item => item.id === openMenu);
          if (!currentItem || !currentItem.submenu) return [];
          return filterSubmenu(currentItem.submenu, currentItem.permission);
        }, [openMenu, filteredTaskbarItems, filterSubmenu])}
        categoryColor={useMemo(() => {
          const currentItem = filteredTaskbarItems.find(item => item.id === openMenu);
          return currentItem?.color || theme.palette.primary.main;
        }, [openMenu, filteredTaskbarItems, theme.palette.primary.main])}
        onItemClick={handleMenuItemClick}
      />
    </>
  );
}); // Fin de React.memo

// Nombre de display para debugging
Taskbar.displayName = 'Taskbar';

export default Taskbar;
