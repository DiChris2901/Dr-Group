import {
    AccessTime,
    AccountBalance,
    AddBox,
    Assessment,
    Assignment,
    AttachMoney,
    Business,
    Dashboard,
    DeleteSweep,
    ExpandLess,
    ExpandMore,
    MeetingRoom,
    Notifications,
    People,
    Person,
    Receipt,
    Timeline,
    TrendingUp
} from '@mui/icons-material';
import {
    Box,
    Chip,
    Collapse,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
    alpha
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
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
  
  // User profile data from Firebase Auth y Firestore
  const userProfile = {
    name: firestoreProfile?.name || currentUser?.displayName || 'Diego Rueda',
    email: firestoreProfile?.email || currentUser?.email || 'diego@drgroup.com',
    role: firestoreProfile?.role || 'ADMIN',
    photoURL: firestoreProfile?.photoURL || currentUser?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80' // Prioridad: Firestore -> Auth -> Prueba
  };
  
  const [openSubmenu, setOpenSubmenu] = useState({});
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  // Configuración del tema
  const isDarkMode = theme.palette.mode === 'dark';

  // Obtener colores del tema actual
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;

  // Modo compacto basado en configuración
  const isCompactMode = settings?.sidebar?.compactMode || settings?.sidebar?.width <= 80;

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
    setOpenSubmenu(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
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
        { title: 'Agregar Nuevo', icon: AttachMoney, path: '/commitments/new', permission: 'compromisos.agregar_nuevo' },
        { title: 'Próximos a Vencer', icon: Notifications, path: '/commitments/due', permission: 'compromisos.proximos_vencer' }
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
        { title: 'Histórico de Liquidaciones', icon: Assessment, path: '/liquidaciones/historico', permission: 'liquidaciones.historico' }
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
      title: 'Empleados',
      icon: Person,
      path: '/empleados',
      color: '#4caf50',
      permission: 'empleados'
    },
    {
      title: 'Asistencias',
      icon: AccessTime,
      path: '/asistencias',
      color: '#ff9800',
      permission: 'asistencias'
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
  const filteredMenuItems = menuItems.filter(shouldShowMenuItem);
  const filteredAdminMenuItems = adminMenuItems.filter(shouldShowMenuItem);

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
        <List sx={{ pt: isCompactMode ? 1 : 2 }}>
          {filteredMenuItems.map((item, index) => (
            <React.Fragment key={item.title}>
              {/* Etiquetas de Categoría */}
              {index === 0 && !isCompactMode && (
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
                    Inicio
                  </Typography>
                </Box>
              )}
              {index === 1 && !isCompactMode && (
                <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    Operaciones
                  </Typography>
                </Box>
              )}
              {item.title === 'Gestión Empresarial' && !isCompactMode && (
                <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    Gestión
                  </Typography>
                </Box>
              )}
              {item.title === 'Reportes' && !isCompactMode && (
                <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    Reportes
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
                        openSubmenu[item.title] ? <ExpandLess /> : <ExpandMore />
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
                  <Collapse in={openSubmenu[item.title]} timeout={400} unmountOnExit>
                    <List component="div" disablePadding sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      borderRadius: 2,
                      mx: 2,
                      my: 0.5,
                      py: 0.5
                    }}>
                      {item.submenu
                        .filter(subItem => hasSubmenuPermission(item.permission, subItem.permission))
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

              {/* Dividers para agrupación */}
              {settings?.sidebar?.grouping !== false && (index === 0 || index === 3) && (
                <Divider sx={{ 
                  mx: 2, 
                  my: 2,
                  background: `linear-gradient(90deg, 
                    transparent 0%, 
                    ${alpha(theme.palette.primary.main, 0.2)} 50%, 
                    transparent 100%
                  )`,
                  height: '1px',
                  border: 'none'
                }} />
              )}
            </React.Fragment>
          ))}

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
                v2.5.0 • Nov 2025
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
