/**
 * 🧭 DR Group Design System 3.0 - Sidebar Navigation Component
 * Componente de navegación lateral mejorado con colores vibrantes y indicadores visuales
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  IconButton,
  Typography,
  Avatar,
  Collapse,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  Business,
  AttachMoney,
  Group,
  Assessment,
  Settings,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 🎨 Import Design System 3.0 Tokens
import { 
  designTokens, 
  tokenUtils, 
  buttonUtils, 
  cardsUtils 
} from '../theme/tokens/index.js';

/**
 * 🎯 DATOS DE NAVEGACIÓN MEJORADOS CON COLORES VIBRANTES
 */
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Dashboard,
    path: '/dashboard',
    semantic: 'primary',
    color: '#2196F3',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)'
  },
  {
    id: 'compromisos',
    label: 'Compromisos',
    icon: Assignment,
    path: '/compromisos',
    semantic: 'error',
    color: '#FF5722',
    gradient: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
    children: [
      { 
        id: 'crear-compromiso', 
        label: 'Crear Compromiso', 
        path: '/compromisos/crear',
        color: '#FF5722' 
      },
      { 
        id: 'listado', 
        label: 'Listado', 
        path: '/compromisos/listado',
        color: '#FF7043'
      },
      { 
        id: 'vencidos', 
        label: 'Vencidos', 
        path: '/compromisos/vencidos',
        color: '#D32F2F'
      }
    ]
  },
  {
    id: 'empresas',
    label: 'Empresas',
    icon: Business,
    path: '/empresas',
    semantic: 'success',
    color: '#4CAF50',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
    children: [
      { 
        id: 'dr-group', 
        label: 'DR Group', 
        path: '/empresas/dr-group',
        color: '#4CAF50'
      },
      { 
        id: 'subsidiarias', 
        label: 'Subsidiarias', 
        path: '/empresas/subsidiarias',
        color: '#66BB6A'
      }
    ]
  },
  {
    id: 'pagos',
    label: 'Pagos',
    icon: AttachMoney,
    path: '/pagos',
    semantic: 'success',
    color: '#00BCD4',
    gradient: 'linear-gradient(135deg, #00BCD4 0%, #4DD0E1 100%)'
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: Assessment,
    path: '/reportes',
    semantic: 'warning',
    color: '#FF9800',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)',
    children: [
      { 
        id: 'mensuales', 
        label: 'Reportes Mensuales', 
        path: '/reportes/mensuales',
        color: '#FF9800'
      },
      { 
        id: 'anuales', 
        label: 'Reportes Anuales', 
        path: '/reportes/anuales',
        color: '#FFB74D'
      }
    ]
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: Group,
    path: '/usuarios',
    semantic: 'secondary',
    color: '#9C27B0',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)'
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    path: '/configuracion',
    semantic: 'secondary',
    color: '#607D8B',
    gradient: 'linear-gradient(135deg, #607D8B 0%, #78909C 100%)'
  }
];

/**
 * 🎨 ITEM DE NAVEGACIÓN SPECTACULAR CON COLORES VIBRANTES
 */
const NavigationItem = React.memo(React.forwardRef(({ 
  item, 
  isActive, 
  isParentActive, 
  isCompact, 
  expandedItems, 
  onToggleExpand,
  onItemClick,
  depth = 0 
}, ref) => {
  const theme = useTheme();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems[item.id];
  const isChild = depth > 0;
  
  // 🎨 Colores vibrantes spectacular
  const itemColor = item.color || theme.palette.primary.main;
  const itemGradient = item.gradient || `linear-gradient(135deg, ${itemColor} 0%, ${itemColor}80 100%)`;

  // 🎨 Contenido principal del item - SPECTACULAR DESIGN
  const itemContent = (
    <ListItemButton
      onClick={() => onItemClick(item)}
      selected={isActive}
      sx={{
        minHeight: isCompact ? 48 : (isChild ? 42 : 56),
        px: isCompact ? 1 : 2,
        py: isCompact ? 1 : 1.5,
        mx: isCompact ? 0.5 : 1,
        borderRadius: isCompact ? 3 : 2.5,
        position: 'relative',
        ml: isChild ? 3 : 0,
        overflow: 'hidden',
        
        // 🌟 SUBTLE ACTIVE STATE - Más sutil para no competir con header
        ...(isActive && {
          backgroundColor: `${itemColor}12`,
          color: itemColor,
          borderLeft: `3px solid ${itemColor}`,
          marginLeft: '1px',
          boxShadow: `0 2px 8px ${itemColor}08`,
          transform: 'translateX(2px)'
        }),
        
        // 🎨 COMPACT MODE SPECTACULAR
        ...(isCompact && {
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: '52px',
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          margin: '6px auto'
        }),

        // 🌈 ENHANCED HOVER - Con animación de iconos
        '&:hover': {
          backgroundColor: isActive ? `${itemColor}18` : `${itemColor}08`,
          transform: isActive ? 'translateX(4px)' : 'translateX(2px)',
          boxShadow: isActive 
            ? `0 4px 12px ${itemColor}15`
            : `0 2px 8px ${itemColor}08`,
          '& .MuiListItemIcon-root': {
            color: itemColor, // Color vibrante completo en hover
            transform: 'scale(1.1)'
          }
        },
        
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        // 🎯 Subtle focus state
        '&:focus-visible': {
          outline: `2px solid ${itemColor}40`,
          outlineOffset: '2px',
          backgroundColor: isActive ? `${itemColor}12` : `${itemColor}08`
        },
        
        // 🎭 Subtle parent active state
        ...(isParentActive && !isActive && {
          backgroundColor: `${itemColor}06`,
          borderLeft: `2px solid ${itemColor}40`,
          marginLeft: '2px'
        })
      }}
      role="menuitem"
      tabIndex={0}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      {/* 🎨 COLORED ICON - Como en producción */}
      <ListItemIcon 
        sx={{ 
          color: isActive ? itemColor : `${itemColor}CC`, // Color vibrante siempre, más suave cuando no activo
          minWidth: isCompact ? 'auto' : 48,
          mr: isCompact ? 0 : 1.5,
          justifyContent: 'center',
          position: 'relative',
          transition: 'color 0.2s ease',
          
          // 🎨 Icon container in compact mode
          ...(isCompact && {
            margin: 0,
            width: '24px',
            height: '24px'
          }),
          
          // ✨ Enhanced icon when active
          ...(isActive && {
            fontWeight: 600,
            transform: 'scale(1.05)'
          })
        }}
      >
        {item.icon ? (
          <item.icon sx={{ 
            fontSize: isCompact ? 20 : (isChild ? 20 : 22), 
            fontWeight: isActive ? 'bold' : 'normal'
          }} />
        ) : (
          <ChevronRight sx={{ fontSize: isCompact ? 20 : (isChild ? 20 : 22) }} />
        )}
      </ListItemIcon>

      {/* 🎨 SPECTACULAR TEXT */}
      {!isCompact && (
        <>
          <ListItemText
            primary={item.label}
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: isChild ? '0.875rem' : '0.95rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? itemColor : 'text.primary',
                letterSpacing: isActive ? '0.25px' : 'normal'
              }
            }}
          />
          
          {/* 🔽 SUBTLE EXPAND INDICATOR */}
          {hasChildren && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item.id);
              }}
              size="small"
              sx={{ 
                color: isActive ? itemColor : 'text.secondary',
                backgroundColor: 'transparent',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: `${itemColor}08`,
                  transform: isExpanded ? 'rotate(180deg) scale(1.05)' : 'rotate(0deg) scale(1.05)'
                }
              }}
            >
              <ExpandMore sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </>
      )}
      
      {/* 🎨 COMPACT MODE LABEL */}
      {isCompact && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: isActive ? 700 : 600,
            color: isActive ? itemColor : `${itemColor}CC`, // Consistente con los iconos
            textAlign: 'center',
            lineHeight: 1,
            mt: 0.5,
            letterSpacing: '0.2px',
            transition: 'color 0.2s ease'
          }}
        >
          {item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label}
        </Typography>
      )}
    </ListItemButton>
  );

  // 🎯 En modo compacto, wrappear con Tooltip
  if (isCompact) {
    return (
      <ListItem disablePadding>
        <Tooltip 
          title={item.label} 
          placement="right"
          arrow
          enterDelay={300}
          sx={{
            '& .MuiTooltip-tooltip': {
              ...designTokens.muiVariants?.body2,
              backgroundColor: 'grey.800',
              fontSize: '0.875rem'
            }
          }}
        >
          {itemContent}
        </Tooltip>
      </ListItem>
    );
  }

  return (
    <ListItem ref={ref} disablePadding>
      {itemContent}
    </ListItem>
  );
}));

NavigationItem.displayName = 'NavigationItem';

/**
 * 🧭 COMPONENTE SIDEBAR PRINCIPAL
 */
export const DSNavbarSidebar = ({ 
  isOpen = false, 
  onClose, 
  activeItemId = 'dashboard',
  variant = 'permanent',
  isCompactMode = false,
  onItemSelect
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isCompact, setIsCompact] = useState(isCompactMode);
  const [expandedItems, setExpandedItems] = useState({});
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const sidebarRef = useRef(null);
  const itemRefs = useRef([]);

  // 🎯 Determinar si debe mostrarse como drawer en móvil
  const shouldUseDrawer = variant === 'temporary' || isMobile;
  
  // 📱 Ajustar modo compacto en móvil y desactivar hover expand para drawers
  useEffect(() => {
    if (isMobile) {
      setIsCompact(false);
    }
    if (shouldUseDrawer && isCompact) {
      setIsHoverExpanded(false); // Mantener compacto en drawers
    }
  }, [isMobile, shouldUseDrawer, isCompact]);

  // 🎯 Items de navegación con estado activo calculado
  const navigationWithStates = useMemo(() => {
    return navigationItems.map(item => {
      const isActive = item.id === activeItemId || item.path === activeItemId;
      const isParentActive = item.children?.some(child => 
        child.id === activeItemId || child.path === activeItemId
      );
      
      return {
        ...item,
        isActive,
        isParentActive
      };
    });
  }, [activeItemId]);

  // 🎯 Toggle expansión de grupos
  const handleToggleExpand = useCallback((itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  // 🎯 Hover expand functionality (solo para sidebar permanente)
  const handleMouseEnter = useCallback(() => {
    if (isCompact && !shouldUseDrawer) {
      setIsHoverExpanded(true);
    }
  }, [isCompact, shouldUseDrawer]);

  const handleMouseLeave = useCallback(() => {
    if (isCompact && !shouldUseDrawer) {
      setIsHoverExpanded(false);
    }
  }, [isCompact, shouldUseDrawer]);

  // 🎯 Selección de item
  const handleItemClick = useCallback((item) => {
    if (item.children && item.children.length > 0) {
      handleToggleExpand(item.id);
    } else {
      onItemSelect?.(item);
      if (isMobile) {
        onClose?.();
      }
    }
  }, [handleToggleExpand, onItemSelect, isMobile, onClose]);

  // ⌨️ Navegación por teclado
  const handleKeyDown = useCallback((event) => {
    const items = navigationWithStates.filter(item => !item.children || expandedItems[item.id]);
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(items.length - 1, prev + 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleItemClick(items[focusedIndex]);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (items[focusedIndex].children) {
          handleToggleExpand(items[focusedIndex].id);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (expandedItems[items[focusedIndex].id]) {
          handleToggleExpand(items[focusedIndex].id);
        }
        break;
    }
  }, [navigationWithStates, expandedItems, focusedIndex, handleItemClick, handleToggleExpand]);

  // 🎨 Header ejecutivo con gradiente DS 3.0
  const sidebarHeader = (
    <Box
      sx={{
        p: isCompact && !isHoverExpanded ? 1 : 3,
        background: `linear-gradient(135deg, #2196F3 0%, #9C27B0 100%)`,
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderTopRightRadius: '8px'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isCompact && !isHoverExpanded ? (
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              width: 40,
              height: 40,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Dashboard sx={{ color: 'white', fontSize: 20 }} />
          </Avatar>
        ) : (
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                width: 48,
                height: 48,
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              <Dashboard sx={{ color: 'white', fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                DR Group
              </Typography>
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-block'
                }}
              >
                Sistema Financiero
              </Box>
            </Box>
          </Box>
        )}
      </motion.div>
    </Box>
  );

  // 🎨 Contenido de navegación
  const sidebarContent = (
    <Box 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {sidebarHeader}
      
      {/* 📋 Lista de navegación */}
      <Box 
        component="nav"
        aria-label="Sidebar"
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          py: 2
        }}
        ref={sidebarRef}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <List disablePadding>
          <AnimatePresence>
            {navigationWithStates.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavigationItem
                  ref={el => itemRefs.current[index] = el}
                  item={item}
                  isActive={item.isActive}
                  isParentActive={item.isParentActive}
                  isCompact={isCompact}
                  expandedItems={expandedItems}
                  onToggleExpand={handleToggleExpand}
                  onItemClick={handleItemClick}
                />
                
                {/* 🔽 Sub-items colapsables */}
                {!(isCompact && !isHoverExpanded) && item.children && (
                  <Collapse in={expandedItems[item.id]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => (
                        <NavigationItem
                          key={child.id}
                          item={{
                            ...child,
                            color: child.color || item.color,
                            gradient: child.gradient || `linear-gradient(135deg, ${child.color || item.color} 0%, ${child.color || item.color}80 100%)`
                          }}
                          isActive={child.id === activeItemId || child.path === activeItemId}
                          isParentActive={false}
                          isCompact={false}
                          expandedItems={{}}
                          onToggleExpand={() => {}}
                          onItemClick={handleItemClick}
                          depth={1}
                        />
                      ))}
                    </List>
                  </Collapse>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      </Box>
    </Box>
  );

  // 🎯 Ancho dinámico con hover expand - ESTILO PRODUCCIÓN
  const sidebarWidth = useMemo(() => {
    if (isCompact && !isHoverExpanded) return 80;
    return 288;
  }, [isCompact, isHoverExpanded]);

  // 📱 Render condicional: Drawer vs permanente
  if (shouldUseDrawer) {
    return (
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: (isCompact && !isHoverExpanded) ? '80px' : '280px',
            boxShadow: designTokens.shadows?.elevation4 || '0 8px 32px rgba(0,0,0,0.12)',
            borderRadius: '0 12px 12px 0'
          }
        }}
        ModalProps={{
          keepMounted: true
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // 🖥️ Sidebar permanente en desktop
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderRightColor: 'divider',
          transition: `width ${designTokens.transitions?.default || '0.25s ease'}`,
          overflow: 'hidden'
        }
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default DSNavbarSidebar;
