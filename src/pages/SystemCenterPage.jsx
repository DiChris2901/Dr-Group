import React, { useState, useEffect } from 'react';
import SystemLayout from '../components/layout/SystemLayout';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  FolderDelete as FolderDeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SystemCenterPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    orphanFiles: 0,
    storageUsed: 0
  });

  useEffect(() => {
    // Verificar autenticación para System Center
    const systemAuth = sessionStorage.getItem('systemCenterAuth');
    const systemUser = sessionStorage.getItem('systemCenterUser');
    
    if (!systemAuth || systemUser !== 'daruedagu@gmail.com') {
      navigate('/system-login');
      return;
    }

    setUser({ email: systemUser });
    
    // Simular carga de estadísticas del sistema
    setTimeout(() => {
      setSystemStats({
        totalUsers: 12,
        activeUsers: 8,
        orphanFiles: 3,
        storageUsed: 75
      });
    }, 1000);
  }, [navigate]);

  if (!user) {
    return <LinearProgress />;
  }

  const quickActions = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: PeopleIcon,
      color: '#2e7d32',
      path: '/system-center/users',
      stats: `${systemStats.activeUsers} activos`
    },
    {
      title: 'Configuración General',
      description: 'Parámetros del sistema',
      icon: SettingsIcon,
      color: '#7b1fa2',
      path: '/system-center/settings',
      stats: 'Configuración'
    },
    {
      title: 'Gestión de Empresas',
      description: 'Administrar empresas',
      icon: BusinessIcon,
      color: '#1565c0',
      path: '/system-center/companies',
      stats: 'Empresas'
    },
    {
      title: 'Auditoría del Sistema',
      description: 'Logs de actividad',
      icon: HistoryIcon,
      color: '#ed6c02',
      path: '/system-center/activity-logs',
      stats: 'Logs'
    },
    {
      title: 'Monitoreo',
      description: 'Estado del sistema',
      icon: TimelineIcon,
      color: '#ef6c00',
      path: '/system-center/monitoring',
      stats: 'En línea'
    },
    {
      title: 'Archivos Huérfanos',
      description: 'Limpieza de storage',
      icon: FolderDeleteIcon,
      color: '#d32f2f',
      path: '/system-center/orphan-files',
      stats: `${systemStats.orphanFiles} archivos`
    }
  ];

  return (
    <Box>
      {/* Encabezado del Dashboard */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Dashboard del Sistema
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Bienvenido al Centro de Configuración del Sistema DR Group
        </Typography>
      </Box>

      {/* Estadísticas Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#2e7d32' }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {systemStats.totalUsers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Usuarios Totales
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2' }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {systemStats.activeUsers}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Usuarios Activos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#ed6c02' }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {systemStats.orphanFiles}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Archivos Huérfanos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#7b1fa2' }}>
                    <StorageIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {systemStats.storageUsed}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Storage Usado
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={systemStats.storageUsed} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Acciones Rápidas */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Acciones Rápidas
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={action.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: action.color }}>
                      <action.icon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {action.title}
                      </Typography>
                      <Chip label={action.stats} size="small" />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Estado del Sistema */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          Estado del Sistema
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Servicios del Sistema
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Base de Datos" secondary="Operativo" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Autenticación" secondary="Operativo" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Storage" secondary="Operativo" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Notificaciones" secondary="Parcialmente operativo" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Actividad Reciente
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Usuario conectado"
                      secondary="daruedagu@gmail.com - Hace 2 minutos"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Configuración actualizada"
                      secondary="Sistema - Hace 1 hora"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Backup completado"
                      secondary="Automático - Hace 3 horas"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Limpieza de archivos"
                      secondary="Sistema - Hace 1 día"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Wrapper que incluye el SystemLayout
const SystemCenterPageWithLayout = () => {
  return (
    <SystemLayout>
      <SystemCenterPage />
    </SystemLayout>
  );
};

export default SystemCenterPageWithLayout;
