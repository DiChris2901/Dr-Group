import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  FolderDelete as FolderDeleteIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Schedule as ScheduleIcon,
  Api as ApiIcon,
  BugReport as BugReportIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

const drawerWidth = 280;

const SystemLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: DashboardIcon,
      path: '/system-center',
      color: '#1976d2'
    },
    {
      title: 'Gestión de Usuarios',
      icon: PeopleIcon,
      path: '/system-center/users',
      color: '#2e7d32'
    },
    {
      title: 'Auditoría del Sistema',
      icon: HistoryIcon,
      path: '/system-center/activity-logs',
      color: '#ed6c02'
    },
    {
      title: 'Archivos Huérfanos',
      icon: FolderDeleteIcon,
      path: '/system-center/orphan-files',
      color: '#d32f2f'
    },
    // Nuevas funciones
    {
      title: 'Configuración General',
      icon: SettingsIcon,
      path: '/system-center/settings',
      color: '#7b1fa2'
    },
    {
      title: 'Gestión de Empresas',
      icon: BusinessIcon,
      path: '/system-center/companies',
      color: '#1565c0'
    },
    {
      title: 'Configuración de Seguridad',
      icon: SecurityIcon,
      path: '/system-center/security',
      color: '#c62828'
    },
    {
      title: 'Configuración de Notificaciones',
      icon: EmailIcon,
      path: '/system-center/notifications',
      color: '#00695c'
    },
    {
      title: 'Base de Datos',
      icon: StorageIcon,
      path: '/system-center/database',
      color: '#4527a0'
    },
    {
      title: 'Monitoreo del Sistema',
      icon: TimelineIcon,
      path: '/system-center/monitoring',
      color: '#ef6c00'
    },
    {
      title: 'Tareas Programadas',
      icon: ScheduleIcon,
      path: '/system-center/scheduled-tasks',
      color: '#558b2f'
    },
    {
      title: 'Configuración API',
      icon: ApiIcon,
      path: '/system-center/api-config',
      color: '#6a1b9a'
    },
    {
      title: 'Modo Debug',
      icon: BugReportIcon,
      path: '/system-center/debug',
      color: '#d84315'
    },
    {
      title: 'Logs del Sistema',
      icon: DescriptionIcon,
      path: '/system-center/system-logs',
      color: '#5d4037'
    },
    {
      title: 'Inspector de Estado',
      icon: SearchIcon,
      path: '/system-center/state-inspector',
      color: '#37474f'
    }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('systemCenterAuth');
    sessionStorage.removeItem('systemCenterUser');
    navigate('/system-login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header del System Center */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'rgba(255,255,255,0.2)',
              mr: 2
            }}
          >
            <SettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              System Center
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Centro de Configuración
            </Typography>
          </Box>
        </Box>
        
        <Chip
          label="Administrador"
          size="small"
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 600
          }}
        />
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flex: 1, p: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    background: isActive
                      ? `linear-gradient(135deg, ${item.color}15 0%, ${item.color}08 100%)`
                      : 'transparent',
                    border: isActive ? `1px solid ${item.color}30` : '1px solid transparent',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${item.color}10 0%, ${item.color}05 100%)`,
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? item.color : theme.palette.text.secondary,
                      minWidth: 40
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? item.color : theme.palette.text.primary
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      <Divider />

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: theme.palette.error.main,
            '&:hover': {
              bgcolor: `${theme.palette.error.main}10`
            }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
            <ExitIcon />
          </ListItemIcon>
          <ListItemText primary="Salir del Sistema" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Centro de Configuración del Sistema
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {sessionStorage.getItem('systemCenterUser')}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            minHeight: 'calc(100vh - 120px)',
            background: theme.palette.background.paper
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
};

export default SystemLayout;
