import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  FolderDelete as FolderDeleteIcon,
  Security as SecurityIcon,
  ExitToApp as ExitIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('systemCenterAuth');
      sessionStorage.removeItem('systemCenterUser');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const adminSections = [
    {
      id: 'users',
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios, roles y permisos del sistema',
      icon: PeopleIcon,
      route: '/system-center/users',
      color: '#3b82f6',
      stats: `${systemStats.totalUsers} usuarios totales`
    },
    {
      id: 'activity-logs',
      title: 'Logs de Actividad',
      description: 'Monitorear actividad del sistema y auditoría',
      icon: HistoryIcon,
      route: '/system-center/activity-logs',
      color: '#8b5cf6',
      stats: 'Últimas 24 horas'
    },
    {
      id: 'orphan-files',
      title: 'Archivos Huérfanos',
      description: 'Limpiar archivos no utilizados en el storage',
      icon: FolderDeleteIcon,
      route: '/system-center/orphan-files',
      color: '#ef4444',
      stats: `${systemStats.orphanFiles} archivos detectados`
    }
  ];

  const systemHealth = [
    { label: 'Firebase Auth', status: 'online', color: '#10b981' },
    { label: 'Firestore DB', status: 'online', color: '#10b981' },
    { label: 'Firebase Storage', status: 'online', color: '#10b981' },
    { label: 'WhatsApp Business', status: 'pending', color: '#f59e0b' }
  ];

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LinearProgress sx={{ width: '200px' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f8fafc',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 2,
              background: 'white',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: '#3b82f6',
                    color: 'white'
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '1.875rem',
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    }}
                  >
                    System Center
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#64748b',
                      fontSize: '0.95rem',
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    }}
                  >
                    Administración del sistema • {user.email}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate('/')}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    borderColor: '#d1d5db',
                    color: '#374151',
                    '&:hover': {
                      borderColor: '#9ca3af',
                      background: '#f9fafb'
                    }
                  }}
                >
                  Launcher
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ExitIcon />}
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    background: '#ef4444',
                    '&:hover': {
                      background: '#dc2626'
                    }
                  }}
                >
                  Cerrar Sesión
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={4}>
          {/* Sistema Health Status */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 3,
                      color: '#1e293b',
                      fontSize: '1.125rem',
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                    }}
                  >
                    Estado del Sistema
                  </Typography>
                  
                  <List disablePadding>
                    {systemHealth.map((service, index) => (
                      <ListItem key={service.label} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: service.color,
                              boxShadow: `0 0 8px ${service.color}40`
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={service.label}
                          secondary={service.status === 'online' ? 'En línea' : 'Pendiente'}
                          primaryTypographyProps={{
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }}
                        />
                        <Chip
                          label={service.status === 'online' ? 'Activo' : 'Pendiente'}
                          size="small"
                          sx={{
                            background: service.status === 'online' ? '#10b981' : '#f59e0b',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        color: '#64748b',
                        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                      }}
                    >
                      Uso de Storage: {systemStats.storageUsed}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={systemStats.storageUsed}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          background: systemStats.storageUsed > 80 
                            ? '#ef4444'
                            : '#10b981'
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Secciones de Administración */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {adminSections.map((section, index) => (
                <Grid item xs={12} sm={6} lg={4} key={section.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      sx={{
                        height: 180,
                        borderRadius: 2,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transform: 'translateY(-2px)',
                          borderColor: section.color
                        }
                      }}
                      onClick={() => navigate(section.route)}
                    >
                      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              background: section.color,
                              mr: 2
                            }}
                          >
                            <section.icon sx={{ fontSize: 20, color: 'white' }} />
                          </Avatar>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: '#1e293b',
                              fontSize: '1rem',
                              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                            }}
                          >
                            {section.title}
                          </Typography>
                        </Box>
                        
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            flexGrow: 1,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }}
                        >
                          {section.description}
                        </Typography>
                        
                        <Chip
                          label={section.stats}
                          size="small"
                          sx={{
                            alignSelf: 'flex-start',
                            background: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Alert
            severity="info"
            sx={{
              mt: 4,
              borderRadius: 2,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0c4a6e'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              <strong>System Center v1.0</strong> - Centro de administración exclusivo para el administrador del sistema. 
              Todas las acciones quedan registradas en los logs de actividad.
            </Typography>
          </Alert>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SystemCenterPage;
