// NavegacionShowcase.jsx - Design System 3.0 - MODELOS DE NAVEGACIÓN PROFESIONAL
import React, { useState } from 'react';
import DSNavbarSidebar from './DSNavbarSidebar';
import {
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  AppBar,
  Toolbar,
  Breadcrumbs,
  Link,
  Badge,
  Tabs,
  Tab,
  Collapse,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  Business,
  AttachMoney,
  Settings,
  Notifications,
  Person,
  Help,
  Menu as MenuIcon,
  Search,
  FilterList,
  More,
  Home,
  ChevronRight,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Close,
  Brightness4,
  Language,
  Security,
  Analytics,
  AccountBalance,
  Receipt,
  Report,
  Group,
  Star,
  Warning,
  Info,
  CheckCircle,
  Today,
  CloudUpload
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const NavegacionShowcase = ({ onOpenDrawer }) => {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState('sidebars');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState(null);
  const avatarMenuOpen = Boolean(avatarMenuAnchor);

  // 🎨 Sistema de colores semánticos DS 3.0
  const getSemanticColor = (itemId) => {
    const colorMap = {
      dashboard: theme.palette.primary.main,      // Azul corporativo
      compromisos: theme.palette.error.main,     // Rojo profesional
      empresas: theme.palette.info.main,         // Azul info
      pagos: theme.palette.success.main,         // Verde éxito
      reportes: theme.palette.warning.main,      // Naranja warning
      usuarios: theme.palette.secondary.main,    // Morado secundario
    };
    return colorMap[itemId] || theme.palette.grey[600];
  };

  const handleAvatarMenuClick = (event) => {
    setAvatarMenuAnchor(event.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };
  
  const categories = [
    { id: 'sidebars', label: 'Sidebars', icon: '📋' },
    { id: 'topbars', label: 'Topbars', icon: '🔝' },
    { id: 'drawers', label: 'Drawers Config', icon: '⚙️' },
    { id: 'tabs', label: 'Pestañas', icon: '📑' }
  ];

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Dashboard />, 
      badge: null,
      children: []
    },
    { 
      id: 'compromisos', 
      label: 'Compromisos', 
      icon: <Assignment />, 
      badge: 5,
      children: [
        { id: 'crear-compromiso', label: 'Crear Compromiso', icon: <Assignment /> },
        { id: 'listar-compromisos', label: 'Lista de Compromisos', icon: <Assignment /> },
        { id: 'reportes-compromisos', label: 'Reportes', icon: <Report /> }
      ]
    },
    { 
      id: 'empresas', 
      label: 'Empresas', 
      icon: <Business />, 
      badge: null,
      children: [
        { id: 'crear-empresa', label: 'Nueva Empresa', icon: <Business /> },
        { id: 'listar-empresas', label: 'Lista de Empresas', icon: <Business /> }
      ]
    },
    { 
      id: 'pagos', 
      label: 'Pagos', 
      icon: <AttachMoney />, 
      badge: 2,
      children: [
        { id: 'registrar-pago', label: 'Registrar Pago', icon: <Receipt /> },
        { id: 'historial-pagos', label: 'Historial', icon: <Analytics /> }
      ]
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: <Analytics />, 
      badge: null,
      children: []
    },
    { 
      id: 'usuarios', 
      label: 'Usuarios', 
      icon: <Group />, 
      badge: null,
      children: []
    }
  ];

  const handleExpandToggle = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const renderSidebarsSection = () => (
    <Grid container spacing={3}>
      {/* 🚀 NEW: Sidebar DS 3.0 Refactorizado */}
      <Grid item xs={12}>
        <Box sx={{ mb: 3, p: 3, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            🚀 Sidebar DS 3.0 - Build-First Refactor
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Nueva implementación usando <strong>designTokens</strong>, <strong>tokenUtils</strong>, <strong>buttonUtils</strong>, y <strong>cardsUtils</strong>. 
            Con estados activos, parent-active, modo compacto/rail, navegación por teclado y accesibilidad completa.
          </Typography>
        </Box>
      </Grid>

      {/* DS 3.0 Sidebar Expandido */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            🎨 Sidebar DS 3.0 - Expandido (288px)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Tokens DS 3.0:</strong> Paper con Acento, gradientes ejecutivos, colores semánticos, tipografía jerárquica, sombras elevation.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content'
        }}>
          <Button 
            variant="contained" 
            onClick={() => {
              setSidebarType('ds30-expandido');
              setSidebarOpen(true);
            }}
            startIcon={<MenuIcon />}
            sx={{ mb: 2 }}
            fullWidth
          >
            Sidebar DS 3.0 Expandido
          </Button>
          
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              • <strong>Estados activos</strong>: Paper con Acento de 4px
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Parent-active</strong>: Resalta padres de items activos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Badges inteligentes</strong>: Ocultar si 0, compactar 99+
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Grupos colapsables</strong>: Con animaciones suaves
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Navegación por teclado</strong>: ↑↓ moverse, → abrir, ← cerrar
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      {/* DS 3.0 Sidebar Compacto/Rail */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="secondary.main" gutterBottom>
            🎯 Sidebar DS 3.0 - Compacto/Rail (76px)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Modo Rail:</strong> Solo iconos con tooltips, toggle dinámico, focus visible, accesibilidad completa.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content'
        }}>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => {
              setSidebarType('ds30-compacto');
              setSidebarOpen(true);
            }}
            startIcon={<MenuIcon />}
            sx={{ mb: 2 }}
            fullWidth
          >
            Sidebar DS 3.0 Compacto
          </Button>
          
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              • <strong>Tooltips informativos</strong>: Con delay y posicionamiento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Estados hover/focus</strong>: Micro-interacciones DS 3.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Toggle funcional</strong>: 288px ↔ 76px dinámico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Drawer móvil</strong>: Responsive con focus trap
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Performance</strong>: React.memo + useMemo
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      {/* Separador visual */}
      <Grid item xs={12}>
        <Box sx={{ my: 2, borderTop: '2px dashed', borderColor: 'divider', opacity: 0.5 }} />
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
          📚 Implementaciones Legacy (Referencia)
        </Typography>
      </Grid>

      {/* Sidebar Principal (Legacy) */}
      <Grid item xs={12} lg={4}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="grey.600" gutterBottom>
            📋 Sidebar Principal (Legacy)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Navegación principal con módulos, submenús y badges de notificación.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content',
          opacity: 0.7
        }}>
          <Button 
            variant="contained" 
            onClick={() => {
              setSidebarType('principal');
              setSidebarOpen(true);
            }}
            startIcon={<MenuIcon />}
            sx={{ 
              mb: 2,
              bgcolor: 'grey.600',
              color: 'white',
              '&:hover': {
                bgcolor: 'grey.700'
              }
            }}
            fullWidth
          >
            Abrir Sidebar (Legacy)
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Sidebar con navegación jerárquica, badges de notificaciones 
            y estados activos.
          </Typography>
        </Paper>
      </Grid>

      {/* Sidebar Compacto (Legacy) */}
      <Grid item xs={12} lg={4}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="grey.600" gutterBottom>
            📌 Sidebar Compacto (Legacy)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para maximizar espacio de contenido, solo íconos con tooltips.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content',
          opacity: 0.7
        }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              setSidebarType('compacto');
              setSidebarOpen(true);
            }}
            startIcon={<MenuIcon />}
            sx={{ 
              mb: 2,
              borderColor: 'grey.400',
              color: 'grey.600',
              '&:hover': {
                borderColor: 'grey.600',
                bgcolor: 'grey.50'
              }
            }}
            fullWidth
          >
            Sidebar Compacto (Legacy)
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Versión minimalista con íconos únicamente, tooltips informativos.
          </Typography>
        </Paper>
      </Grid>

      {/* Sidebar Contextual */}
      <Grid item xs={12} lg={4}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            🔍 Sidebar Contextual
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para filtros, acciones específicas de módulo.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 'fit-content'
        }}>
          <Button 
            variant="outlined" 
            color="info"
            onClick={() => {
              setSidebarType('contextual');
              setSidebarOpen(true);
            }}
            startIcon={<FilterList />}
            sx={{ mb: 2 }}
            fullWidth
          >
            Filtros Avanzados
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Sidebar específico para filtros, acciones y opciones del módulo actual.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTopbarsSection = () => (
    <Grid container spacing={3}>
      {/* NUEVO: Topbar Design System 3.0 */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" gutterBottom sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            ✨ Topbar Design System 3.0 - Premium
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Nuevo:</strong> Topbar mejorado con gradientes spectacular, glassmorphism y micro-interacciones premium.
            Mantiene funcionalidad completa con efectos visuales de nivel empresarial.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'rgba(102, 126, 234, 0.2)',
          borderRadius: 1,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {/* HEADER DEL TOPBAR */}
          <Box sx={{ 
            p: 2.5,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'shimmer 3s infinite'
            },
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' }
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 2 }}>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                width: 36, 
                height: 36,
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -2,
                  background: 'inherit',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  opacity: 0.6,
                  zIndex: -1
                }
              }}>
                <Dashboard />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Navegación - Design System Test
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500
                }}>
                  Navegación empresarial premium con efectos spectacular
                </Typography>
              </Box>
            </Box>
            <Chip 
              label="Design System 3.0" 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                zIndex: 2,
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                },
                transition: 'all 0.3s ease'
              }} 
            />
          </Box>

          {/* TOPBAR PREMIUM SIMULADO */}
          <AppBar position="static" elevation={0} sx={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
              backgroundSize: '200% 100%',
              animation: 'gradientMove 3s ease-in-out infinite'
            },
            '@keyframes gradientMove': {
              '0%, 100%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' }
            }
          }}>
            <Toolbar sx={{ 
              justifyContent: 'space-between',
              minHeight: '72px',
              px: 3,
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {/* Breadcrumbs Premium */}
                <Breadcrumbs 
                  separator={
                    <ChevronRight 
                      fontSize="small" 
                      sx={{ 
                        color: 'rgba(102, 126, 234, 0.6)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          color: 'primary.main',
                          transform: 'scale(1.2)'
                        }
                      }} 
                    />
                  }
                  sx={{
                    '& .MuiBreadcrumbs-separator': {
                      mx: 2
                    }
                  }}
                >
                  <Link 
                    underline="none" 
                    href="#" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      background: 'rgba(102, 126, 234, 0.08)',
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(102, 126, 234, 0.15)',
                      '&:hover': {
                        background: 'rgba(102, 126, 234, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                  >
                    <Home sx={{ fontSize: '1.1rem' }} />
                    Inicio
                  </Link>
                  <Link 
                    underline="none" 
                    href="#"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      background: 'rgba(118, 75, 162, 0.08)',
                      color: 'secondary.main',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(118, 75, 162, 0.15)',
                      '&:hover': {
                        background: 'rgba(118, 75, 162, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(118, 75, 162, 0.2)'
                      }
                    }}
                  >
                    <Dashboard sx={{ fontSize: '1.1rem' }} />
                    Dashboard
                  </Link>
                  <Typography 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      color: 'text.primary',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
                    }}
                  >
                    <Assignment sx={{ fontSize: '1.1rem' }} />
                    Compromisos
                  </Typography>
                </Breadcrumbs>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Búsqueda Premium */}
                <TextField
                  size="medium"
                  placeholder="Buscar en el sistema..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    width: 280,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      fontWeight: 500,
                      '&:hover': {
                        border: '1px solid rgba(102, 126, 234, 0.4)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)'
                      },
                      '&.Mui-focused': {
                        border: '2px solid rgba(102, 126, 234, 0.5)',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                        background: 'rgba(255,255,255,0.95)'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontWeight: 500,
                      '&::placeholder': {
                        color: 'rgba(102, 126, 234, 0.6)',
                        fontWeight: 500
                      }
                    }
                  }}
                />
                
                {/* Iconos Premium con efectos spectacular */}
                <IconButton sx={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: 1,
                  width: 48,
                  height: 48,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)',
                    '&::before': {
                      opacity: 1
                    }
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Badge 
                    badgeContent={3} 
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        animation: 'pulse 2s infinite'
                      },
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.2)' }
                      }
                    }}
                  >
                    <Notifications sx={{ color: 'primary.main' }} />
                  </Badge>
                </IconButton>

                <IconButton sx={{
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(233, 30, 99, 0.1) 100%)',
                  border: '1px solid rgba(156, 39, 176, 0.2)',
                  borderRadius: 1,
                  width: 48,
                  height: 48,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(233, 30, 99, 0.15) 100%)',
                    border: '1px solid rgba(156, 39, 176, 0.3)',
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: '0 8px 25px rgba(156, 39, 176, 0.2)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Today sx={{ color: 'secondary.main' }} />
                </IconButton>

                <IconButton sx={{
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  borderRadius: 1,
                  width: 48,
                  height: 48,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)',
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    transform: 'translateY(-2px) rotate(90deg) scale(1.05)',
                    boxShadow: '0 8px 25px rgba(255, 152, 0, 0.2)'
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Settings sx={{ color: 'warning.main' }} />
                </IconButton>
                
                {/* Botón Modo Oscuro/Claro */}
                <IconButton sx={{
                  background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
                  border: '1px solid rgba(255, 193, 7, 0.2)',
                  borderRadius: 1,
                  width: 48,
                  height: 48,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    transform: 'translateY(-2px) rotate(180deg) scale(1.05)',
                    boxShadow: '0 8px 25px rgba(255, 193, 7, 0.2)'
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Brightness4 sx={{ color: 'warning.main' }} />
                </IconButton>
                
                {/* Avatar Premium */}
                <Box 
                  onClick={handleAvatarMenuClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.2,
                    borderRadius: 1,
                    background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
                      transform: 'translateY(-4px)',
                      '&::before': {
                        opacity: 1
                      }
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Avatar sx={{ 
                    width: 36, 
                    height: 36, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 800,
                    position: 'relative',
                    zIndex: 2,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: -3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      filter: 'blur(8px)',
                      opacity: 0.4,
                      zIndex: -1,
                      animation: 'glow 3s ease-in-out infinite alternate'
                    },
                    '@keyframes glow': {
                      '0%': { opacity: 0.4, transform: 'scale(1)' },
                      '100%': { opacity: 0.8, transform: 'scale(1.1)' }
                    }
                  }}>
                    DR
                  </Avatar>
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 700,
                      lineHeight: 1.2,
                      background: 'linear-gradient(135deg, #333 0%, #667eea 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Diego R.
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(102, 126, 234, 0.8)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      Administrator
                    </Typography>
                  </Box>
                  <ExpandMore sx={{ 
                    fontSize: '1.2rem',
                    color: 'rgba(102, 126, 234, 0.7)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    zIndex: 2,
                    transform: avatarMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                </Box>

                {/* Menú Dropdown del Avatar */}
                <Menu
                  anchorEl={avatarMenuAnchor}
                  open={avatarMenuOpen}
                  onClose={handleAvatarMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 280,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                      '& .MuiMenuItem-root': {
                        borderRadius: 1,
                        mx: 1,
                        my: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          transform: 'translateX(4px)'
                        }
                      }
                    }
                  }}
                >
                  {/* Header del Usuario */}
                  <Box sx={{ 
                    px: 2, 
                    py: 2, 
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    borderRadius: 1,
                    mx: 1,
                    mb: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '1rem',
                        fontWeight: 700
                      }}>
                        DR
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Diego Rodríguez
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          diego.rodriguez@drgroup.com
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            label="Administrador" 
                            size="small" 
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: 500
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ mx: 1, borderColor: 'rgba(102, 126, 234, 0.1)' }} />

                  {/* Opciones del Menú */}
                  <MenuItem onClick={handleAvatarMenuClose}>
                    <ListItemIcon>
                      <Person fontSize="small" sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Mi Perfil</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Configurar información personal
                      </Typography>
                    </Box>
                  </MenuItem>

                  <MenuItem onClick={handleAvatarMenuClose}>
                    <ListItemIcon>
                      <Settings fontSize="small" sx={{ color: 'secondary.main' }} />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Configuración</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Preferencias y ajustes
                      </Typography>
                    </Box>
                  </MenuItem>

                  <MenuItem onClick={handleAvatarMenuClose}>
                    <ListItemIcon>
                      <Security fontSize="small" sx={{ color: 'info.main' }} />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Seguridad</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Cambiar contraseña y 2FA
                      </Typography>
                    </Box>
                  </MenuItem>

                  <MenuItem onClick={handleAvatarMenuClose}>
                    <ListItemIcon>
                      <Notifications fontSize="small" sx={{ color: 'warning.main' }} />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Notificaciones</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Gestionar alertas y avisos
                      </Typography>
                    </Box>
                  </MenuItem>

                  <Divider sx={{ mx: 1, my: 1, borderColor: 'rgba(102, 126, 234, 0.1)' }} />

                  {/* Estadísticas Rápidas */}
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      ESTADÍSTICAS RÁPIDAS
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Box sx={{ 
                        flex: 1, 
                        textAlign: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'rgba(76, 175, 80, 0.1)'
                      }}>
                        <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700 }}>
                          23
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Compromisos
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        textAlign: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'rgba(244, 67, 54, 0.1)'
                      }}>
                        <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 700 }}>
                          2
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Vencidos
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ mx: 1, my: 1, borderColor: 'rgba(102, 126, 234, 0.1)' }} />

                  {/* Cerrar Sesión */}
                  <MenuItem 
                    onClick={handleAvatarMenuClose}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)',
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Box sx={{ 
                        width: 20, 
                        height: 20, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transform: 'rotate(180deg)'
                      }}>
                        <Box sx={{ fontSize: '16px' }}>🚪</Box>
                      </Box>
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Cerrar Sesión
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
        </Paper>
      </Grid>

      {/* Topbar de Acciones */}
      <Grid item xs={12} md={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            ⚡ Topbar de Acciones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para acciones específicas del módulo actual.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ 
            p: 2,
            bgcolor: 'success.50',
            borderBottom: '1px solid',
            borderColor: 'success.100',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
              <Assignment />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Barra de Acciones
            </Typography>
          </Box>
          
          <Toolbar sx={{ gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<Assignment />}>
              Nuevo
            </Button>
            <Button variant="outlined" size="small" startIcon={<FilterList />}>
              Filtrar
            </Button>
            <Button variant="outlined" size="small" startIcon={<More />}>
              Más
            </Button>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Typography variant="body2" color="text.secondary">
              23 elementos
            </Typography>
          </Toolbar>
        </Paper>
      </Grid>

      {/* Topbar de Búsqueda */}
      <Grid item xs={12} md={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            🔍 Topbar de Búsqueda
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para búsquedas complejas y filtros rápidos.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ 
            p: 2,
            bgcolor: 'info.50',
            borderBottom: '1px solid',
            borderColor: 'info.100',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
              <Search />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Búsqueda Avanzada
            </Typography>
          </Box>
          
          <Toolbar>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar compromisos, empresas, pagos..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mr: 2 }}
            />
            <Button variant="contained" size="small">
              Buscar
            </Button>
          </Toolbar>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDrawersSection = () => (
    <Grid container spacing={3}>
      {/* Drawer de Preferencias */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            👤 Drawer de Preferencias de Usuario
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Configuraciones personales, tema, idioma, notificaciones.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 3, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            onClick={onOpenDrawer}
            startIcon={<Settings />}
            sx={{ 
              mb: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            fullWidth
          >
            🎨 DR Group Spectacular Drawer
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            <strong>🌟 Nuevo Design System 3.0:</strong> Drawer con efectos glassmorphism, 
            gradientes corporativos DR Group, micro-animaciones y navegación por secciones.
          </Typography>
        </Paper>
      </Grid>

    </Grid>
  );

  const renderTabsSection = () => (
    <Grid container spacing={3}>
      {/* Pestañas Horizontales */}
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            📑 Pestañas Horizontales con Badges
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para organizar contenido relacionado en la misma vista.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider'
        }}>
          {/* HEADER DE PESTAÑAS */}
          <Box sx={{ 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper'
          }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <Assignment />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Panel de Compromisos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Vista organizada por pestañas
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['General', 'Reportes', 'Configuración'].map((tab, index) => (
                <motion.div key={tab} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={tabValue === index ? 'contained' : 'text'}
                    onClick={() => setTabValue(index)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: tabValue === index ? 600 : 500,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        ...(tabValue !== index && {
                          bgcolor: 'rgba(102, 126, 234, 0.08)'
                        })
                      },
                      ...(tabValue === index && {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      })
                    }}
                  >
                    {tab}
                  </Button>
                </motion.div>
              ))}
            </Box>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Compromisos Activos</Typography>
                <Typography variant="body2" color="text.secondary">
                  Lista de compromisos vigentes pendientes de pago...
                </Typography>
              </Box>
            )}
            {tabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom color="error">Compromisos Vencidos</Typography>
                <Typography variant="body2" color="text.secondary">
                  Compromisos que han superado su fecha de vencimiento...
                </Typography>
              </Box>
            )}
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom color="success.main">Compromisos Pagados</Typography>
                <Typography variant="body2" color="text.secondary">
                  Historial de compromisos completados exitosamente...
                </Typography>
              </Box>
            )}
            {tabValue === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom color="info.main">Reportes y Analytics</Typography>
                <Typography variant="body2" color="text.secondary">
                  Análisis y métricas de compromisos financieros...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* Pestañas Verticales */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="secondary.main" gutterBottom>
            📑 Pestañas Verticales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Cuando hay muchas categorías o contenido extenso.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 400,
          display: 'flex'
        }}>
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={0}
            sx={{ 
              borderRight: '1px solid', 
              borderColor: 'divider',
              minWidth: 200,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                alignItems: 'flex-start',
                textAlign: 'left',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.08)',
                  color: 'primary.main'
                },
                '&.Mui-selected': {
                  fontWeight: 600,
                  color: 'primary.main',
                  bgcolor: 'rgba(102, 126, 234, 0.12)'
                }
              }
            }}
          >
            <Tab label="General" />
            <Tab label="Financiero" />
            <Tab label="Usuarios" />
            <Tab label="Seguridad" />
            <Tab label="Notificaciones" />
            <Tab label="Integrations" />
          </Tabs>
          
          <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuración General
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contenido de la pestaña activa...
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Pestañas con Estados */}
      <Grid item xs={12} lg={6}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            🏷️ Pestañas con Estados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Uso:</strong> Para indicar estados, progreso o alertas.
          </Typography>
        </Box>
        
        <Paper sx={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
          border: '1px solid',
          borderColor: 'divider',
          height: 400
        }}>
          <Tabs 
            value={0}
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 2,
              pt: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: 'rgba(102, 126, 234, 0.08)'
                },
                '&.Mui-selected': {
                  fontWeight: 600,
                  color: 'primary.main'
                }
              }
            }}
          >
            <Tab 
              icon={<Info />}
              label="Información"
              iconPosition="start"
            />
            <Tab 
              icon={
                <Badge badgeContent="!" color="warning">
                  <Warning />
                </Badge>
              }
              label="Alertas"
              iconPosition="start"
            />
            <Tab 
              icon={<Star />}
              label="Favoritos"
              iconPosition="start"
              disabled
            />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información del Sistema
            </Typography>
            <Stack spacing={2}>
              <Chip 
                label="Sistema Activo" 
                color="success" 
                size="small"
                sx={{ 
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
                }} 
              />
              <Chip 
                label="2 Alertas Pendientes" 
                color="warning" 
                size="small"
                sx={{ 
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)'
                }} 
              />
              <Chip 
                label="Favoritos Deshabilitados" 
                color="default" 
                size="small"
                sx={{ 
                  fontWeight: 500,
                  opacity: 0.6
                }} 
              />
            </Stack>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderActiveSection = () => {
    switch(activeCategory) {
      case 'sidebars': return renderSidebarsSection();
      case 'topbars': return renderTopbarsSection();
      case 'drawers': return renderDrawersSection();
      case 'tabs': return renderTabsSection();
      default: return renderSidebarsSection();
    }
  };

  const renderSidebar = () => {
    // 🚀 Manejo de Sidebar DS 3.0 con tokens
    if (sidebarType === 'ds30-expandido') {
      return (
        <DSNavbarSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="temporary"
          activeItemId="compromisos"
          onItemSelect={(item) => {
            console.log('DS 3.0 - Item seleccionado:', item);
            // Aquí iría la navegación real
          }}
        />
      );
    }

    if (sidebarType === 'ds30-compacto') {
      return (
        <DSNavbarSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="temporary"
          activeItemId="dashboard"
          isCompactMode={true}
          onItemSelect={(item) => {
            console.log('DS 3.0 Compacto - Item seleccionado:', item);
            // Aquí iría la navegación real
          }}
        />
      );
    }

    // 📚 Legacy sidebar implementations
    const getSidebarWidth = () => {
      if (sidebarType === 'compacto' || isCompact) {
        return isCompact ? 76 : 288;  // Modo rail DS 3.0
      }
      switch(sidebarType) {
        case 'contextual': return 320;
        default: return 288;  // Modo expandido estándar DS 3.0
      }
    };

    const handleToggleCompact = () => {
      setIsCompact(!isCompact);
    };

    return (
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{
          sx: {
            width: getSidebarWidth(),
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,250,1) 100%)'
          }
        }}
      >
        {/* HEADER DEL SIDEBAR - DS 3.0 Sin Glassmorphism */}
        <Box sx={{ 
          p: sidebarType === 'compacto' && isCompact ? 2 : 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '1px solid',
          borderColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.12)',
          position: 'relative'
        }}>
          {(sidebarType !== 'compacto' || !isCompact) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                width: 40, 
                height: 40,
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Dashboard sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700, 
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  DR Group
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  Sistema Financiero
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* Avatar compacto o toggle */}
          {sidebarType === 'compacto' && isCompact && (
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              width: 44, 
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Dashboard sx={{ color: 'white', fontSize: 24 }} />
            </Avatar>
          )}
        </Box>

        {/* CONTENIDO DEL SIDEBAR - DS 3.0 Sin Glassmorphism */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          background: 'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)',
          pointerEvents: 'none'
        }}>
          {sidebarType === 'principal' && (
            <List sx={{ px: isCompact ? 1 : 2, py: 2 }}>
              {menuItems.map((item, index) => (
                <Box key={item.id}>
                  {isCompact ? (
                    // Modo Rail (76px) - Solo iconos con tooltips
                    <Tooltip title={item.label} placement="right" arrow>
                      <ListItemButton
                        onClick={() => item.children.length > 0 && handleExpandToggle(item.id)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          px: 1,
                          py: 1.5,
                          minHeight: 48,
                          display: 'flex',
                          justifyContent: 'center',
                          background: index === 0 
                            ? `linear-gradient(135deg, ${getSemanticColor(item.id, theme).light} 0%, ${getSemanticColor(item.id, theme).main} 100%)`
                            : 'transparent',
                          color: index === 0 
                            ? getSemanticColor(item.id, theme).main 
                            : theme.palette.text.secondary,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${getSemanticColor(item.id, theme).light} 0%, ${getSemanticColor(item.id, theme).main}20 100%)`,
                            color: getSemanticColor(item.id, theme).main,
                            transform: 'scale(1.05)',
                            boxShadow: `0 4px 12px ${getSemanticColor(item.id, theme).main}40`
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <ListItemIcon sx={{ 
                          color: 'inherit', 
                          minWidth: 'auto',
                          justifyContent: 'center' 
                        }}>
                          <item.icon sx={{ fontSize: 24 }} />
                        </ListItemIcon>
                      </ListItemButton>
                    </Tooltip>
                  ) : (
                    // Modo Normal (288px) - Con texto
                    <ListItemButton
                      onClick={() => item.children.length > 0 && handleExpandToggle(item.id)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        px: 2,
                        py: 1.5,
                        background: index === 0 
                          ? `linear-gradient(135deg, ${getSemanticColor(item.id, theme).light} 0%, ${getSemanticColor(item.id, theme).main}20 100%)`
                          : 'transparent',
                        border: index === 0 
                          ? `1px solid ${getSemanticColor(item.id, theme).main}40` 
                          : '1px solid transparent',
                        boxShadow: index === 0 
                          ? `0 4px 12px ${getSemanticColor(item.id, theme).main}30` 
                          : 'none',
                        color: index === 0 
                          ? getSemanticColor(item.id, theme).main 
                          : theme.palette.text.primary,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${getSemanticColor(item.id, theme).light} 0%, ${getSemanticColor(item.id, theme).main}30 100%)`,
                          border: `1px solid ${getSemanticColor(item.id, theme).main}60`,
                          transform: 'translateX(2px)',
                          color: getSemanticColor(item.id, theme).main,
                          boxShadow: `0 6px 20px ${getSemanticColor(item.id, theme).main}20`
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        '&::before': index === 0 ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '4px',
                          height: '24px',
                        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '0 2px 2px 0'
                      } : {}
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 44 }}>
                      {item.badge ? (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                              border: '2px solid white'
                            }
                          }}
                        >
                          <Box sx={{ 
                            color: index === 0 ? 'primary.main' : 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.3s ease'
                          }}>
                            {item.icon}
                          </Box>
                        </Badge>
                      ) : (
                        <Box sx={{ 
                          color: index === 0 ? 'primary.main' : 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.3s ease'
                        }}>
                          {item.icon}
                        </Box>
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: index === 0 ? 600 : 500,
                        color: index === 0 ? 'primary.main' : 'text.primary',
                        fontSize: '0.95rem'
                      }}
                    />
                    {item.children.length > 0 && (
                      <Box sx={{ 
                        color: index === 0 ? 'primary.main' : 'text.secondary',
                        transition: 'transform 0.3s ease',
                        transform: expandedItems[item.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>
                        {expandedItems[item.id] ? <ExpandLess /> : <ExpandMore />}
                      </Box>
                    )}
                  </ListItemButton>
                  )}
                  
                  {!isCompact && item.children.length > 0 && (
                    <Collapse in={expandedItems[item.id]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 2, pr: 1 }}>
                        {item.children.map((child) => (
                          <ListItemButton 
                            key={child.id} 
                            sx={{ 
                              borderRadius: 2, 
                              mb: 0.5,
                              py: 1,
                              px: 2,
                              ml: 2,
                              mr: 1,
                              background: 'rgba(255,255,255,0.7)',
                              border: '1px solid rgba(102, 126, 234, 0.1)',
                              '&:hover': {
                                background: 'rgba(102, 126, 234, 0.05)',
                                border: '1px solid rgba(102, 126, 234, 0.2)',
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
                      },
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: -16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '12px',
                        height: '1px',
                        bgcolor: 'rgba(102, 126, 234, 0.3)'
                      }
                    }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Box sx={{ 
                                color: 'text.secondary',
                                transform: 'scale(0.9)',
                                opacity: 0.8
                              }}>
                                {child.icon}
                              </Box>
                            </ListItemIcon>
                            <ListItemText 
                              primary={child.label} 
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                fontWeight: 500,
                                fontSize: '0.85rem'
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              ))}
            </List>
          )}

          {sidebarType === 'compacto' && (
            <List sx={{ px: 1, py: 2 }}>
              {menuItems.map((item, index) => (
                <ListItemButton
                  key={item.id}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    justifyContent: 'center',
                    minHeight: 56,
                    background: index === 0 
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                      : 'rgba(255,255,255,0.5)',
                    border: index === 0 
                      ? '1px solid rgba(102, 126, 234, 0.2)' 
                      : '1px solid rgba(0,0,0,0.05)',
                    boxShadow: index === 0 
                      ? '0 4px 12px rgba(102, 126, 234, 0.2)' 
                      : '0 2px 8px rgba(0,0,0,0.05)',
                    '&:hover': {
                      background: index === 0 
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 'auto', 
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {item.badge ? (
                      <Badge 
                        badgeContent={item.badge} 
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            boxShadow: '0 2px 8px rgba(244, 67, 54, 0.4)',
                            border: '2px solid white',
                            fontSize: '0.7rem',
                            height: '18px',
                            minWidth: '18px'
                          }
                        }}
                      >
                        <Box sx={{ 
                          color: index === 0 ? 'primary.main' : 'text.secondary',
                          fontSize: '1.2rem'
                        }}>
                          {item.icon}
                        </Box>
                      </Badge>
                    ) : (
                      <Box sx={{ 
                        color: index === 0 ? 'primary.main' : 'text.secondary',
                        fontSize: '1.2rem'
                      }}>
                        {item.icon}
                      </Box>
                    )}
                  </ListItemIcon>
                </ListItemButton>
              ))}
            </List>
          )}

          {sidebarType === 'contextual' && (
            <Box sx={{ p: 3 }}>
              <Box sx={{
                mb: 3,
                p: 2,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                borderRadius: 2,
                border: '1px solid rgba(102, 126, 234, 0.2)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)'
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                  mb: 1
                }}>
                  Filtros Avanzados
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Personaliza los resultados según tus necesidades
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar"
                  placeholder="Nombre del compromiso..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)'
                      },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                      }
                    }
                  }}
                />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Estado
                  </Typography>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.7)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Stack spacing={1}>
                      <FormControlLabel 
                        control={<Switch defaultChecked size="small" />} 
                        label="Activos" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                      />
                      <FormControlLabel 
                        control={<Switch size="small" />} 
                        label="Vencidos" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                      />
                      <FormControlLabel 
                        control={<Switch defaultChecked size="small" />} 
                        label="Pagados" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                      />
                    </Stack>
                  </Paper>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Empresa
                  </Typography>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.7)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Stack spacing={1}>
                      <FormControlLabel 
                        control={<Switch defaultChecked size="small" />} 
                        label="DR Group SAS" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                      />
                      <FormControlLabel 
                        control={<Switch size="small" />} 
                        label="DR Construcciones" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                      />
                    </Stack>
                  </Paper>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Rango de Fechas
                  </Typography>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.7)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <Stack spacing={2}>
                      <TextField 
                        type="date" 
                        size="small" 
                        label="Desde" 
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.8)',
                          }
                        }}
                      />
                      <TextField 
                        type="date" 
                        size="small" 
                        label="Hasta" 
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.8)',
                          }
                        }}
                      />
                    </Stack>
                  </Paper>
                </Box>
              </Stack>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" fullWidth>
                  Limpiar
                </Button>
                <Button variant="contained" size="small" fullWidth>
                  Aplicar
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* FOOTER DEL SIDEBAR */}
        {sidebarType !== 'compacto' && (
          <Box sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(102, 126, 234, 0.1)',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(102, 126, 234, 0.3) 50%, transparent 100%)'
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)',
              '&:hover': {
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.12)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <Avatar sx={{ 
                width: 36, 
                height: 36, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <Person />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  Diego Rodriguez
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}>
                  Administrador Sistema
                </Typography>
              </Box>
              <IconButton 
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    transform: 'rotate(90deg)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Settings />
              </IconButton>
            </Box>
          </Box>
        )}
      </Drawer>
    );
  };

  const renderConfigDrawer = () => null;

  return (
    <Box>
      {/* HEADER DEL SHOWCASE */}
      <Box sx={{ 
        mb: 4,
        p: 3,
        bgcolor: 'primary.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.100'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          🧭 Navegación - Design System 3.0
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Colección de componentes de navegación profesionales: sidebars, topbars, drawers de configuración 
          y sistemas de pestañas. Diseñados para aplicaciones empresariales modernas.
        </Typography>
        
        {/* NAVEGACIÓN DE CATEGORÍAS */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon} ${category.label}`}
              variant={activeCategory === category.id ? 'filled' : 'outlined'}
              color={activeCategory === category.id ? 'primary' : 'default'}
              onClick={() => setActiveCategory(category.id)}
              sx={{ 
                fontWeight: activeCategory === category.id ? 600 : 400,
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* CONTENIDO ACTIVO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveSection()}
        </motion.div>
      </AnimatePresence>

      {/* SIDEBAR DINÁMICO */}
      {renderSidebar()}
    </Box>
  );
};

export default NavegacionShowcase;