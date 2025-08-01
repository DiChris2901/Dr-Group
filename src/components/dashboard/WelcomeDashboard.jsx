import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Button
} from '@mui/material';
import {
  CalendarToday,
  Cloud,
  Storage,
  Notifications,
  TrendingUp,
  Assignment,
  AccessTime,
  Warning,
  CheckCircle,
  Business,
  AccountBalance,
  Assessment,
  Refresh,
  Settings
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { formatNumber } from '../../utils/formatNumber';

const designSystem = {
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  borderRadius: 4,
  shadows: {
    soft: '0 2px 12px rgba(0,0,0,0.08)',
    medium: '0 4px 20px rgba(0,0,0,0.12)',
    strong: '0 8px 32px rgba(0,0,0,0.16)'
  }
};

const WidgetCard = ({ children, gradient, height = 'auto', ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    whileHover={{ y: -2 }}
  >
    <Paper
      sx={{
        background: gradient || 'background.paper',
        borderRadius: designSystem.borderRadius,
        boxShadow: designSystem.shadows.medium,
        height,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: designSystem.gradients.primary,
        }
      }}
      {...props}
    >
      {children}
    </Paper>
  </motion.div>
);

const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: commitments } = useFirestore('commitments');
  
  // Función simple para obtener compromisos próximos sin date-fns
  const upcomingCommitments = commitments?.filter(commitment => {
    const dueDate = new Date(commitment.dueDate);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek;
  }).slice(0, 3) || [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'long' }),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString('es-ES', { weekday: 'long' })
    };
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const isUrgent = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 && diffDays >= 0;
  };

  const formattedDate = formatDate(currentDate);

  return (
    <WidgetCard height="320px">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            Calendario
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="700" color="primary.main">
            {formattedDate.day}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formattedDate.month} {formattedDate.year}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formattedDate.weekday}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="subtitle2" fontWeight="600" mb={1}>
          Próximos Compromisos
        </Typography>
        
        <List dense>
          {upcomingCommitments.map((commitment, index) => {
            const dueDate = new Date(commitment.dueDate);
            const urgent = isUrgent(commitment.dueDate);
            
            return (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Badge
                    color={urgent ? "error" : "primary"}
                    variant="dot"
                  >
                    <Assignment fontSize="small" />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={commitment.description}
                  secondary={formatShortDate(dueDate)}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    sx: { fontWeight: urgent ? 600 : 400 }
                  }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            );
          })}
          
          {upcomingCommitments.length === 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="No hay compromisos próximos"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </WidgetCard>
  );
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulamos datos del clima (en producción usarías una API real como OpenWeather)
    const mockWeather = {
      city: 'Ciudad de México',
      temperature: 22,
      condition: 'Parcialmente nublado',
      humidity: 65,
      windSpeed: 12
    };
    
    setTimeout(() => {
      setWeather(mockWeather);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <WidgetCard height="200px">
        <CardContent sx={{ p: 3 }}>
          <LinearProgress />
        </CardContent>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard 
      height="200px"
      gradient={designSystem.gradients.info}
    >
      <CardContent sx={{ p: 3, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Cloud sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="600">
            Clima
          </Typography>
          <IconButton 
            size="small" 
            sx={{ ml: 'auto', color: 'white' }}
            onClick={() => window.location.reload()}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" fontWeight="700" sx={{ mr: 2 }}>
            {weather.temperature}°
          </Typography>
          <Box>
            <Typography variant="body1" fontWeight="600">
              {weather.city}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {weather.condition}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={`Humedad ${weather.humidity}%`} 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <Chip 
            label={`Viento ${weather.windSpeed} km/h`} 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
      </CardContent>
    </WidgetCard>
  );
};

const StorageWidget = () => {
  const [storageData, setStorageData] = useState({
    used: 1.2,
    total: 5,
    documents: 47,
    images: 12,
    files: 23,
    loading: false
  });

  const [refreshing, setRefreshing] = useState(false);

  const refreshStats = async () => {
    setRefreshing(true);
    // Simular carga
    setTimeout(() => {
      setStorageData(prev => ({
        ...prev,
        used: (Math.random() * 2 + 0.5).toFixed(2),
        documents: Math.floor(Math.random() * 50) + 20,
        images: Math.floor(Math.random() * 20) + 5,
        files: Math.floor(Math.random() * 30) + 10
      }));
      setRefreshing(false);
    }, 1000);
  };

  const usagePercentage = (storageData.used / storageData.total) * 100;

  return (
    <WidgetCard height="200px">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Storage sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            Almacenamiento
          </Typography>
          <IconButton 
            size="small" 
            sx={{ ml: 'auto', color: 'primary.main' }}
            onClick={refreshStats}
            disabled={refreshing}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
        
        {refreshing ? (
          <LinearProgress sx={{ mb: 2 }} />
        ) : (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Usado: {storageData.used} GB de {storageData.total} GB
              </Typography>
              <Typography variant="body2" fontWeight="600">
                {usagePercentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={usagePercentage}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  background: usagePercentage > 80 ? 
                    designSystem.gradients.warning : 
                    designSystem.gradients.success
                }
              }}
            />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={`${storageData.documents} docs`} 
            size="small" 
            variant="outlined"
            title="Documentos en Firestore"
          />
          <Chip 
            label={`${storageData.images} imgs`} 
            size="small" 
            variant="outlined"
            title="Imágenes en Storage"
          />
          <Chip 
            label={`${storageData.files} files`} 
            size="small" 
            variant="outlined"
            title="Archivos en Storage"
          />
        </Box>
      </CardContent>
    </WidgetCard>
  );
};

const ActivityWidget = () => {
  const { data: recentActivity, loading } = useFirestore('commitments', {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 5
  });

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <WidgetCard height="320px">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            Actividad Reciente
          </Typography>
        </Box>
        
        <List dense>
          {loading ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Cargando actividad...
              </Typography>
            </Box>
          ) : (
            recentActivity?.map((activity, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      background: designSystem.gradients.primary 
                    }}
                  >
                    <Assignment fontSize="small" />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={`Compromiso: ${activity.description?.substring(0, 30)}...`}
                  secondary={formatDateTime(activity.createdAt)}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Chip 
                  label={activity.amount ? `$${formatNumber(activity.amount)}` : 'Sin monto'}
                  size="small" 
                  variant="outlined"
                  color="primary"
                />
              </ListItem>
            ))
          )}
          
          {!loading && (!recentActivity || recentActivity.length === 0) && (
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="No hay actividad reciente"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </WidgetCard>
  );
};

const TasksWidget = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Revisar comprobantes pendientes', priority: 'high', completed: false },
    { id: 2, title: 'Actualizar datos de empresas', priority: 'medium', completed: false },
    { id: 3, title: 'Generar reporte mensual', priority: 'low', completed: true },
    { id: 4, title: 'Configurar notificaciones', priority: 'medium', completed: false }
  ]);

  // Cargar tareas desde localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('dr_dashboard_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const handleToggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('dr_dashboard_tasks', JSON.stringify(updatedTasks));
  };

  return (
    <WidgetCard height="320px">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Assignment sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            Tareas Pendientes
          </Typography>
          <Chip 
            label={pendingTasks.length} 
            size="small" 
            color="primary" 
            sx={{ ml: 'auto', mr: 1 }}
          />
          <IconButton 
            size="small" 
            onClick={() => navigate('/tasks')}
            sx={{ color: 'primary.main' }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Box>
        
        <List dense>
          {pendingTasks.slice(0, 3).map((task) => (
            <ListItem key={task.id} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <IconButton 
                  size="small"
                  onClick={() => handleToggleTask(task.id)}
                >
                  {task.completed ? 
                    <CheckCircle color="success" fontSize="small" /> :
                    <AccessTime color={getPriorityColor(task.priority)} fontSize="small" />
                  }
                </IconButton>
              </ListItemIcon>
              <ListItemText
                primary={task.title}
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.6 : 1
                  }
                }}
              />
              <Chip 
                label={task.priority} 
                size="small" 
                color={getPriorityColor(task.priority)}
                variant="outlined"
              />
            </ListItem>
          ))}
          
          {pendingTasks.length === 0 && (
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="No hay tareas pendientes"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          )}
          
          {completedTasks.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Completadas: {completedTasks.length}
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/tasks')}
                  sx={{ textTransform: 'none' }}
                >
                  Ver todas
                </Button>
              </Box>
            </>
          )}
        </List>
      </CardContent>
    </WidgetCard>
  );
};

const QuickStatsWidget = () => {
  const { data: commitments } = useFirestore('commitments');
  const { data: companies } = useFirestore('companies');
  
  const totalCommitments = commitments?.length || 0;
  const activeCompanies = companies?.filter(c => c.active)?.length || 0;
  const totalAmount = commitments?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  const urgentTasks = commitments?.filter(c => {
    const dueDate = new Date(c.dueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  })?.length || 0;

  const stats = [
    { label: 'Compromisos', value: totalCommitments, icon: Assignment, color: 'primary' },
    { label: 'Empresas', value: activeCompanies, icon: Business, color: 'secondary' },
    { label: 'Total', value: `$${formatNumber(totalAmount)}`, icon: AccountBalance, color: 'success' },
    { label: 'Urgentes', value: urgentTasks, icon: Warning, color: 'error' }
  ];

  return (
    <WidgetCard height="200px">
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Assessment sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            Resumen Ejecutivo
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {stats.map((stat, index) => (
            <Grid item xs={6} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <stat.icon sx={{ color: `${stat.color}.main`, mb: 1 }} />
                <Typography variant="h6" fontWeight="700" color={`${stat.color}.main`}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </WidgetCard>
  );
};

const WelcomeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentTime = new Date().getHours();
  
  const getGreeting = () => {
    if (currentTime < 12) return 'Buenos días';
    if (currentTime < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header de Bienvenida */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="700" gutterBottom>
            {getGreeting()}, {user?.displayName || 'Usuario'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aquí tienes un resumen de tu dashboard financiero para hoy
          </Typography>
        </Box>
      </motion.div>

      {/* Grid de Widgets */}
      <Grid container spacing={3}>
        {/* Primera fila */}
        <Grid item xs={12} md={4}>
          <CalendarWidget />
        </Grid>
        <Grid item xs={12} md={4}>
          <TasksWidget />
        </Grid>
        <Grid item xs={12} md={4}>
          <ActivityWidget />
        </Grid>

        {/* Segunda fila */}
        <Grid item xs={12} md={3}>
          <WeatherWidget />
        </Grid>
        <Grid item xs={12} md={3}>
          <StorageWidget />
        </Grid>
        <Grid item xs={12} md={6}>
          <QuickStatsWidget />
        </Grid>
      </Grid>
    </Box>
  );
};

export default WelcomeDashboard;
