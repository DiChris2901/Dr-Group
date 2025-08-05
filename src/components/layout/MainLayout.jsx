import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  useMediaQuery,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  HomeRounded as HomeIcon,
  BusinessRounded as BusinessIcon,
  DashboardCustomizeRounded as DashboardIcon,
  TrendingUpRounded as TrendingIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useNotificationSystem } from '../../hooks/useNotificationSystem';
import Sidebar from './Sidebar';
import DashboardHeader from '../dashboard/DashboardHeader';
import FloatingSearchButton from '../common/FloatingSearchButton';
import { AdvancedSettingsDrawer, SettingsButton } from '../settings';
import NotificationsTestPanel from '../debug/NotificationsTestPanel';

const MainLayout = ({ children, title = "Dashboard", breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const theme = useMuiTheme();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Inicializar sistema de notificaciones
  useNotificationSystem();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHoverExpanded, setSidebarHoverExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Obtener colores del tema actual
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const isDarkMode = theme.palette.mode === 'dark';

  // Configuración del sidebar
  const sidebarWidth = settings?.sidebar?.width || 280;
  const sidebarPosition = settings?.sidebar?.position || 'left';
  const isCompactMode = settings?.sidebar?.compactMode || false;
  
  // Ancho dinámico del sidebar que se adapta al modo compacto y hover
  const currentSidebarWidth = isCompactMode 
    ? (sidebarHoverExpanded ? sidebarWidth : 72) 
    : sidebarWidth;
  
  // Margen base más pequeño para mejor proporción
  const baseMargin = 16;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarHoverChange = (isExpanded) => {
    setSidebarHoverExpanded(isExpanded);
  };

  const handleBreadcrumbClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar para móvil */}
      {isMobile && (
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerToggle}
          variant="temporary"
          onHoverChange={handleSidebarHoverChange}
        />
      )}

      {/* Sidebar para desktop */}
      {!isMobile && (
        <Sidebar
          open={true}
          onClose={() => {}}
          variant="permanent"
          onHoverChange={handleSidebarHoverChange}
        />
      )}

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
          // Margen dinámico que se adapta al ancho actual del sidebar
          marginLeft: !isMobile && sidebarPosition === 'left' ? `${currentSidebarWidth}px` : '0px',
          marginRight: !isMobile && sidebarPosition === 'right' ? `${currentSidebarWidth}px` : '0px',
          transition: theme.transitions.create(['margin-left', 'margin-right'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* TopBar flotante moderna y elegante */}
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 16,
            left: !isMobile && sidebarPosition === 'left' ? `${currentSidebarWidth + 16}px` : '16px',
            right: !isMobile && sidebarPosition === 'right' ? `${currentSidebarWidth + 16}px` : '16px',
            zIndex: 1100,
            height: 64, // Altura igual al banner del sidebar
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '16px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            boxShadow: isDarkMode 
              ? '0 8px 16px -4px rgba(0, 0, 0, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.1)'
              : '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.06)',
            transition: theme.transitions.create(['left', 'right'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              height: '100%', // Ocupa toda la altura disponible
            }}
          >
            {/* Lado izquierdo - Título y breadcrumbs + Menú móvil */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              minWidth: 0
            }}>
              {/* Menú móvil (solo si es móvil) */}
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="abrir menú"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ 
                    mr: 2,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              {/* Título y breadcrumbs alineados a la izquierda */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                minWidth: 0
              }}>
                {/* TÍTULO DE LA PÁGINA - IZQUIERDA */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: breadcrumbs.length > 0 ? 0.5 : 0 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 22,
                      background: `linear-gradient(135deg, ${primaryColor}, ${theme.palette.secondary.main})`,
                      borderRadius: '2px',
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: isDarkMode ? '#ffffff' : '#1e293b',
                      fontSize: '1.1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'visible',
                      maxWidth: 'none',
                      letterSpacing: '-0.01em',
                      textShadow: isDarkMode 
                        ? '0 1px 3px rgba(0,0,0,0.3)' 
                        : '0 1px 2px rgba(255,255,255,0.9)',
                    }}
                  >
                    {title}
                  </Typography>
                </Box>
                
                {/* Breadcrumbs alineados a la izquierda debajo del título */}
                {breadcrumbs.length > 0 && (
                  <Breadcrumbs
                    aria-label="breadcrumb"
                    sx={{
                      fontSize: '0.75rem',
                      '& .MuiBreadcrumbs-separator': {
                        color: theme.palette.text.secondary,
                        opacity: 0.7,
                        mx: 0.5,
                      },
                      '& .MuiBreadcrumbs-ol': {
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                      },
                    }}
                  >
                    <Link
                      color="inherit"
                      onClick={() => handleBreadcrumbClick('/')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: theme.palette.text.secondary,
                        textDecoration: 'none',
                        px: 1,
                        py: 0.25,
                        borderRadius: '6px',
                        minWidth: 0,
                        '&:hover': {
                          color: primaryColor,
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        },
                        transition: theme.transitions.create(['color', 'background-color']),
                      }}
                    >
                      <HomeIcon sx={{ mr: 0.5, fontSize: 16, flexShrink: 0 }} />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 500, 
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '80px',
                        }}
                      >
                        Inicio
                      </Typography>
                    </Link>
                    {breadcrumbs.map((breadcrumb, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.25,
                          minWidth: 0,
                          maxWidth: 200,
                        }}
                      >
                        <BusinessIcon sx={{ mr: 0.5, fontSize: 16, color: theme.palette.primary.main, flexShrink: 0 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '120px',
                          }}
                        >
                          {breadcrumb}
                        </Typography>
                      </Box>
                    ))}
                  </Breadcrumbs>
                )}
              </Box>
            </Box>

            {/* Lado derecho - Header del dashboard */}
            <DashboardHeader onOpenSettings={() => setSettingsOpen(true)} />
          </Box>
        </Box>

        {/* Contenido de la página */}
        <Container
          maxWidth="xl"
          sx={{
            py: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 },
            mt: '96px', // Margen que considera la altura del TopBar + espaciado
            flexGrow: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </Container>
      </Box>

      {/* Botón flotante de búsqueda */}
      <FloatingSearchButton 
        sidebarHoverExpanded={sidebarHoverExpanded}
        currentSidebarWidth={currentSidebarWidth}
      />

      {/* Botón flotante de configuración profesional */}
      <SettingsButton onClick={() => setSettingsOpen(true)} />
      
      {/* Drawer de configuración avanzada */}
      <AdvancedSettingsDrawer 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Panel de prueba de notificaciones (solo en desarrollo) */}
      <NotificationsTestPanel />
    </Box>
  );
};

export default MainLayout;
