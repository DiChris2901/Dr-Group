/**
 * 🏢 DR Group Design System 3.0 - Enterprise Topbar Component
 * Componente de navegación superior empresarial con tokens DS 3.0
 */

import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Badge,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Collapse
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import TodayIcon from '@mui/icons-material/Today';
import Brightness4Icon from '@mui/icons-material/Brightness4';

// 🎨 Import Design System 3.0 Tokens
import { 
  designTokens, 
  tokenUtils, 
  buttonUtils, 
  cardsUtils 
} from '../../theme/tokens/index.js';

/**
 * 🎯 TOPBAR EMPRESARIAL DS 3.0
 */
export const Topbar = ({ 
  title = "DashboardIcon",
  breadcrumbs = [],
  searchEnabled = true,
  searchPlaceholder = "Buscar en el sistema...",
  NotificationsIcon = 0,
  user = { name: "Usuario", email: "user@drgroup.com", role: "Usuario", avatar: "U" },
  onSearch,
  onNotificationClick,
  onUserMenuSelect,
  elevation = 0
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // Estados locales
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  
  const userMenuOpen = Boolean(userMenuAnchor);

  // 🎯 Handlers
  const handleUserMenuClick = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleUserMenuItemClick = (action) => {
    onUserMenuSelect?.(action);
    handleUserMenuClose();
  };

  const toggleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
  };

  // 🎨 Aplicar tokens DS 3.0
  const topbarStyles = {
    background: designTokens.gradients.primary.soft,
    boxShadow: designTokens.shadows.elevation2,
    borderBottom: `1px solid ${designTokens.colors.primary[300]}20`,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: designTokens.gradients.primary.full,
      backgroundSize: '200% 100%',
      animation: 'gradientMove 3s ease-in-out infinite'
    },
    '@keyframes gradientMove': {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' }
    }
  };

  const toolbarStyles = {
    justifyContent: 'space-between',
    minHeight: 72,
    px: designTokens.spacing.lg,
    position: 'relative'
  };

  // 🧭 Breadcrumbs empresariales
  const renderBreadcrumbs = () => {
    const allCrumbs = [
      { label: 'Inicio', href: '/', icon: HomeIcon },
      ...breadcrumbs,
      { label: title, current: true, icon: DashboardIcon }
    ];

    if (isSmall) {
      // Modo compacto móvil - solo título actual
      const currentCrumb = allCrumbs[allCrumbs.length - 1];
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <currentCrumb.icon sx={{ 
            fontSize: designTokens.iconSizes.small,
            color: designTokens.colors.primary.main 
          }} />
          <Typography 
            variant="subtitle1" 
            sx={{
              ...designTokens.muiVariants.subtitle1,
              fontWeight: designTokens.fontWeights.bold,
              color: designTokens.surfaces.light.text.primary,
              background: designTokens.gradients.primary.full,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {currentCrumb.label}
          </Typography>
        </Box>
      );
    }

    return (
      <Breadcrumbs 
        separator={
          <ChevronRightIcon 
            fontSize="small" 
            sx={{ 
              color: `${designTokens.colors.primary.main}60`,
              transition: 'all 0.3s ease'
            }} 
          />
        }
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: designTokens.spacing.sm
          }
        }}
      >
        {allCrumbs.map((crumb, index) => {
          const isLast = index === allCrumbs.length - 1;
          const Icon = crumb.icon;
          
          if (isLast || crumb.current) {
            return (
              <Typography 
                key={crumb.label}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  px: designTokens.spacing.sm,
                  py: designTokens.spacing.xs,
                  borderRadius: designTokens.borderRadius.sm,
                  background: designTokens.gradients.primary.soft,
                  color: designTokens.surfaces.light.text.primary,
                  fontWeight: designTokens.fontWeights.bold,
                  fontSize: '0.9rem',
                  border: `1px solid ${designTokens.colors.primary[300]}20`,
                  boxShadow: designTokens.shadows.elevation1
                }}
              >
                {Icon && typeof Icon === 'function' && <Icon sx={{ fontSize: '1.1rem' }} />}
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link 
              key={crumb.label}
              underline="none" 
              component={crumb.to ? RouterLink : 'a'}
              to={crumb.to}
              href={crumb.href || '#'}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: designTokens.spacing.sm,
                py: designTokens.spacing.xs,
                borderRadius: designTokens.borderRadius.sm,
                background: `${designTokens.surfaces.light.surface[2]}80`,
                color: designTokens.colors.primary.main,
                fontWeight: designTokens.fontWeights.medium,
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                border: `1px solid ${designTokens.colors.primary[300]}15`,
                '&:hover': {
                  background: `${designTokens.colors.primary[300]}15`,
                  transform: 'translateY(-2px)',
                  boxShadow: designTokens.shadows.elevation2
                }
              }}
            >
              {Icon && typeof Icon === 'function' && <Icon sx={{ fontSize: '1.1rem' }} />}
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  // 🔍 Campo de búsqueda adaptativo
  const renderSearch = () => {
    if (!searchEnabled) return null;

    if (isMobile && !searchExpanded) {
      return (
        <IconButton
          onClick={toggleSearchExpanded}
          sx={buttonUtils.createButtonProps({
            variant: 'text',
            size: 'medium'
          }).sx}
          aria-label="Abrir búsqueda"
        >
          <SearchIcon />
        </IconButton>
      );
    }

    return (
      <Fade in={!isMobile || searchExpanded}>
        <TextField
          size="medium"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: designTokens.colors.primary.main }} />
              </InputAdornment>
            ),
            ...(isMobile && {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleSearchExpanded} size="small">
                    <ChevronRightIcon sx={{ transform: 'rotate(90deg)' }} />
                  </IconButton>
                </InputAdornment>
              )
            })
          }}
          sx={{ 
            width: isMobile ? '100%' : 280,
            '& .MuiOutlinedInput-root': {
              borderRadius: designTokens.borderRadius.sm,
              background: designTokens.surfaces.elevated,
              boxShadow: designTokens.shadows.elevation1,
              border: `1px solid ${designTokens.colors.primary[300]}20`,
              fontWeight: designTokens.fontWeights.medium,
              '&:hover': {
                border: `1px solid ${designTokens.colors.primary[300]}40`,
                boxShadow: designTokens.shadows.elevation2
              },
              '&.Mui-focused': {
                border: `2px solid ${designTokens.colors.primary.main}50`,
                boxShadow: `0 0 0 3px ${designTokens.colors.primary.main}10`,
                background: designTokens.surfaces.paper
              }
            },
            '& .MuiInputBase-input': {
              fontWeight: designTokens.fontWeights.medium,
              '&::placeholder': {
                color: `${designTokens.colors.primary.main}60`,
                fontWeight: designTokens.fontWeights.medium
              }
            }
          }}
        />
      </Fade>
    );
  };

  // 🎯 Acciones rápidas
  const renderActions = () => {
    const actions = [
      { 
        icon: NotificationsIcon, 
        badge: NotificationsIcon, 
        color: 'primary',
        onClick: onNotificationClick,
        ariaLabel: 'Ver notificaciones'
      },
      { 
        icon: TodayIcon, 
        color: 'secondary',
        ariaLabel: 'Calendario'
      },
      { 
        icon: SettingsIcon, 
        color: 'warning',
        ariaLabel: 'Configuración'
      }
    ];

    if (isSmall) {
      return (
        <IconButton
          sx={buttonUtils.createButtonProps({
            variant: 'text',
            size: 'medium'
          }).sx}
          aria-label="Más opciones"
        >
          <MenuIcon />
        </IconButton>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const buttonProps = buttonUtils.createButtonProps({
            variant: 'outlined',
            size: 'medium'
          });

          return (
            <IconButton
              key={index}
              onClick={action.onClick}
              aria-label={action.ariaLabel}
              sx={{
                ...buttonProps.sx,
                background: `${designTokens.colors[action.color].main}10`,
                border: `1px solid ${designTokens.colors[action.color].main}20`,
                '&:hover': {
                  background: `${designTokens.colors[action.color].main}15`,
                  border: `1px solid ${designTokens.colors[action.color].main}30`,
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: designTokens.shadows.elevation3
                }
              }}
            >
              {action.badge ? (
                <Badge 
                  badgeContent={action.badge} 
                  color={action.color}
                  sx={{
                    '& .MuiBadge-badge': {
                      background: designTokens.gradients.primary.full,
                      boxShadow: designTokens.coloredShadows.primary.medium,
                      fontSize: '0.7rem',
                      fontWeight: designTokens.fontWeights.bold
                    }
                  }}
                >
                  <Icon sx={{ color: designTokens.colors[action.color].main }} />
                </Badge>
              ) : (
                <Icon sx={{ color: designTokens.colors[action.color].main }} />
              )}
            </IconButton>
          );
        })}
      </Box>
    );
  };

  // 👤 Avatar y menú de usuario
  const renderUserMenu = () => (
    <>
      <Box 
        onClick={handleUserMenuClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: isSmall ? 0 : 1.5,
          px: isSmall ? 1 : designTokens.spacing.sm,
          py: designTokens.spacing.xs,
          borderRadius: designTokens.borderRadius.sm,
          background: designTokens.surfaces.elevated,
          boxShadow: designTokens.shadows.elevation2,
          border: `1px solid ${designTokens.colors.primary[300]}20`,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: designTokens.surfaces.paper,
            border: `1px solid ${designTokens.colors.primary.main}30`,
            boxShadow: designTokens.shadows.elevation3,
            transform: 'translateY(-2px)'
          }
        }}
        role="button"
        aria-label="Menú de usuario"
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        <Avatar sx={{ 
          width: 36, 
          height: 36, 
          background: designTokens.gradients.primary.full,
          boxShadow: designTokens.coloredShadows.primary.medium,
          fontSize: '1rem',
          fontWeight: designTokens.fontWeights.bold
        }}>
          {user.avatar}
        </Avatar>
        {!isSmall && (
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: designTokens.fontWeights.bold,
                lineHeight: 1.2,
                color: designTokens.surfaces.light.text.primary
              }}
            >
              {user.name}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: designTokens.surfaces.light.text.secondary,
                fontSize: '0.75rem',
                fontWeight: designTokens.fontWeights.medium
              }}
            >
              {user.role}
            </Typography>
          </Box>
        )}
        {!isSmall && (
          <ExpandMoreIcon sx={{ 
            fontSize: '1.2rem',
            color: designTokens.surfaces.light.text.secondary,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} />
        )}
      </Box>

      {/* Menú desplegable del usuario */}
      <Menu
        anchorEl={userMenuAnchor}
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            borderRadius: designTokens.borderRadius.md,
            background: designTokens.surfaces.paper,
            boxShadow: designTokens.shadows.elevation4,
            border: `1px solid ${designTokens.colors.primary[300]}10`,
            '& .MuiMenuItem-root': {
              borderRadius: designTokens.borderRadius.sm,
              mx: 1,
              my: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: designTokens.gradients.primary.soft
              }
            }
          }
        }}
      >
        {/* Header del usuario en menú */}
        <Box sx={{ 
          px: 2, 
          py: 2, 
          background: designTokens.gradients.primary.soft,
          borderRadius: designTokens.borderRadius.sm,
          mx: 1,
          mb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 40, 
              height: 40,
              background: designTokens.gradients.primary.full,
              fontSize: '1rem',
              fontWeight: designTokens.fontWeights.bold
            }}>
              {user.avatar}
            </Avatar>
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: designTokens.fontWeights.bold,
                  color: designTokens.surfaces.light.text.primary
                }}
              >
                {user.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: designTokens.surfaces.light.text.secondary,
                  display: 'block'
                }}
              >
                {user.email}
              </Typography>
              <Chip 
                label={user.role} 
                size="small" 
                sx={{ 
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.7rem',
                  background: designTokens.gradients.primary.full,
                  color: 'white',
                  fontWeight: designTokens.fontWeights.medium
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mx: 1, borderColor: `${designTokens.colors.primary[300]}10` }} />

        {/* Opciones del menú */}
        {[
          { icon: PersonIcon, label: 'Mi Perfil', description: 'Configurar información personal', action: 'profile' },
          { icon: SettingsIcon, label: 'Configuración', description: 'Preferencias y ajustes', action: 'settings' },
          { icon: SecurityIcon, label: 'Seguridad', description: 'Cambiar contraseña y 2FA', action: 'security' }
        ].map((item, index) => (
          <MenuItem key={index} onClick={() => handleUserMenuItemClick(item.action)}>
            <ListItemIcon>
              <item.icon fontSize="small" sx={{ color: designTokens.colors.primary.main }} />
            </ListItemIcon>
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: designTokens.fontWeights.medium,
                  color: designTokens.surfaces.light.text.primary
                }}
              >
                {item.label}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: designTokens.surfaces.light.text.secondary,
                  display: 'block'
                }}
              >
                {item.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return (
    <AppBar 
      position="static" 
      elevation={elevation}
      sx={topbarStyles}
      role="banner"
    >
      <Toolbar sx={toolbarStyles}>
        {/* Búsqueda expandida en móvil */}
        {isMobile && searchExpanded && (
          <Collapse in={searchExpanded} orientation="horizontal" sx={{ width: '100%' }}>
            <Box sx={{ width: '100%', mr: 2 }}>
              {renderSearch()}
            </Box>
          </Collapse>
        )}
        
        {/* Layout normal */}
        {!searchExpanded && (
          <>
            {/* Sección izquierda: Breadcrumbs */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {renderBreadcrumbs()}
            </Box>

            {/* Sección central: Búsqueda */}
            {!isMobile && (
              <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                {renderSearch()}
              </Box>
            )}

            {/* Sección derecha: Acciones + Usuario */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
              {isMobile && renderSearch()}
              {renderActions()}
              {renderUserMenu()}
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
