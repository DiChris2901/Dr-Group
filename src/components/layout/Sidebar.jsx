import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Chip,
  Collapse,
  Tooltip,
  Divider,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  Receipt,
  Business,
  Assessment,
  People,
  Assignment,
  AttachMoney,
  Notifications,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import ProfileAvatar from '../common/ProfileAvatar';

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
      color: primaryColor
    },
    {
      title: 'Compromisos',
      icon: AccountBalance,
      color: secondaryColor,
      submenu: [
        { title: 'Ver Todos', icon: Assignment, path: '/commitments' },
        { title: 'Agregar Nuevo', icon: AttachMoney, path: '/commitments/new' },
        { title: 'Próximos a Vencer', icon: Notifications, path: '/commitments/due' }
      ]
    },
    {
      title: 'Pagos',
      icon: Receipt,
      color: primaryColor,
      submenu: [
        { title: 'Historial', icon: Assessment, path: '/payments' },
        { title: 'Comprobantes', icon: Receipt, path: '/receipts' },
        { title: 'Nuevo Pago', icon: AttachMoney, path: '/payments/new' }
      ]
    },
    {
      title: 'Empresas',
      icon: Business,
      path: '/companies',
      color: secondaryColor
    },
    {
      title: 'Reportes',
      icon: Assessment,
      color: primaryColor,
      submenu: [
        { title: 'Resumen General', icon: Assessment, path: '/reports/summary' },
        { title: 'Por Empresa', icon: Business, path: '/reports/company' },
        { title: 'Por Período', icon: Assignment, path: '/reports/period' },
        { title: 'Por Concepto', icon: Receipt, path: '/reports/concept' }
      ]
    }
  ];

  const adminMenuItems = [
    {
      title: 'Usuarios',
      icon: People,
      path: '/users',
      color: primaryColor
    }
  ];

  const sidebarContent = (
    <Box 
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header del Sidebar */}
      <Box
        sx={{
          p: isCompactMode && !isHoverExpanded ? 1 : 3,
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
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
            <ProfileAvatar
              photoURL={userProfile?.photoURL}
              name={userProfile?.name}
              email={userProfile?.email}
              size={40}
              border={true}
            />
          ) : (
            <Box display="flex" alignItems="center" gap={2}>
              <ProfileAvatar
                photoURL={userProfile?.photoURL}
                name={userProfile?.name}
                email={userProfile?.email}
                size={48}
                border={true}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {userProfile?.name || 'Diego Rueda'}
                </Typography>
                <Chip
                  label={userProfile?.role || 'ADMIN'}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                />
              </Box>
            </Box>
          )}
        </motion.div>
      </Box>

      {/* Menú Principal */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: isCompactMode ? 1 : 2 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.title}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  {(isCompactMode && !isHoverExpanded) ? (
                    <Tooltip title={item.title} placement={anchor === 'left' ? 'right' : 'left'}>
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
                        py: 1,
                        minHeight: 48,
                        justifyContent: 'flex-start',
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
                  <Collapse in={openSubmenu[item.title]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.submenu.map((subItem) => (
                        <ListItem key={subItem.title} disablePadding>
                          <ListItemButton
                            onClick={() => handleNavigation(subItem.path)}
                            sx={{
                              pl: 6,
                              mx: 2,
                              borderRadius: 2,
                              py: 0.75,
                              minHeight: 40,
                              bgcolor: isActiveRoute(subItem.path) ? `${primaryColor}10` : 'transparent',
                              '&:hover': {
                                bgcolor: `${primaryColor}10`,
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
                <Divider sx={{ mx: 2, my: 1, opacity: 0.6 }} />
              )}
            </React.Fragment>
          ))}

          {/* Menú de Administrador */}
          {userProfile?.role === 'ADMIN' && (
            <>
              {settings?.sidebar?.grouping !== false && (!isCompactMode || isHoverExpanded) && (
                <>
                  <Divider sx={{ my: 2, mx: 3 }} />
                  <Typography
                    variant="overline"
                    sx={{
                      px: 3,
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Administración
                  </Typography>
                </>
              )}

              {adminMenuItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (menuItems.length + index) * 0.1 }}
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    {(isCompactMode && !isHoverExpanded) ? (
                      <Tooltip title={item.title} placement={anchor === 'left' ? 'right' : 'left'}>
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
                          py: 1,
                          minHeight: 48,
                          justifyContent: 'flex-start',
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
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          {(!isCompactMode || isHoverExpanded) && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                DR Group Dashboard v1.0
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
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
            borderRight: anchor === 'left' ? `1px solid ${theme.palette.divider}` : 'none',
            borderLeft: anchor === 'right' ? `1px solid ${theme.palette.divider}` : 'none',
            borderRadius: 0,
            boxShadow: anchor === 'left' ? 
              theme.shadows[2] : 
              theme.shadows[2],
            transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: theme.zIndex.drawer,
          ...(isCompactMode && {
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
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
