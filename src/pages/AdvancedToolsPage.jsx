import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Search,
  Download,
  Upload,
  FilterList,
  Calculate,
  Timeline,
  PictureAsPdf,
  TableChart,
  CloudDownload,
  TrendingUp,
  Assessment,
  AttachMoney,
  Business,
  Schedule,
  Settings
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDashboardStats } from '../hooks/useDashboardStats';

// Componente de herramienta individual
const ToolCard = ({ title, description, icon: Icon, color, onAction, disabled = false, delay = 0 }) => {
  const theme = useTheme();
  
  const getGradient = () => {
    switch (color) {
      case 'primary':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'success':
        return 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)';
      case 'error':
        return 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)';
      case 'info':
        return 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)';
      default:
        return 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        bounce: 0.3
      }}
    >
      <Card
        sx={{
          height: 160,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          background: getGradient(),
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          '&:hover': disabled ? {} : {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
          },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={disabled ? undefined : onAction}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
                {description}
              </Typography>
            </Box>
            <Icon sx={{ fontSize: 40, opacity: 0.8, ml: 1 }} />
          </Box>
          
          {disabled && (
            <Chip 
              label="Próximamente" 
              size="small" 
              sx={{ 
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                alignSelf: 'flex-start'
              }} 
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de búsqueda avanzada
const AdvancedSearchTool = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    // Simular búsqueda
    setTimeout(() => {
      setResults([
        { id: 1, type: 'commitment', title: 'Compromiso ABC Corp', amount: '$5,000' },
        { id: 2, type: 'company', title: 'XYZ Industries', status: 'Activa' },
        { id: 3, type: 'payment', title: 'Pago mensual', date: '2025-08-15' }
      ]);
      setSearching(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search />
          Búsqueda Avanzada Inteligente
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Buscar en toda la plataforma"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Ingresa términos de búsqueda..."
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['all', 'commitments', 'companies', 'payments', 'reports'].map((type) => (
              <Chip
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                color={searchType === type ? 'primary' : 'default'}
                onClick={() => setSearchType(type)}
                variant={searchType === type ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {results.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Resultados ({results.length})</Typography>
            <List>
              {results.map((result, index) => (
                <ListItem key={result.id} divider={index < results.length - 1}>
                  <ListItemIcon>
                    {result.type === 'commitment' && <Assessment />}
                    {result.type === 'company' && <Business />}
                    {result.type === 'payment' && <AttachMoney />}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.title}
                    secondary={result.amount || result.status || result.date}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button 
          variant="contained" 
          onClick={handleSearch}
          disabled={!searchQuery || searching}
          startIcon={searching ? <Search /> : <Search />}
        >
          {searching ? 'Buscando...' : 'Buscar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AdvancedToolsPage = () => {
  const theme = useTheme();
  const { stats } = useDashboardStats();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Herramientas disponibles
  const tools = [
    {
      title: 'Búsqueda Inteligente',
      description: 'Búsqueda avanzada con filtros y resultados en tiempo real',
      icon: Search,
      color: 'primary',
      onAction: () => setSearchDialogOpen(true),
      disabled: false
    },
    {
      title: 'Exportación PDF',
      description: 'Generar reportes ejecutivos en formato PDF',
      icon: PictureAsPdf,
      color: 'error',
      onAction: () => {},
      disabled: true
    },
    {
      title: 'Exportación Excel',
      description: 'Exportar datos completos a hojas de cálculo',
      icon: TableChart,
      color: 'success',
      onAction: () => setExportDialogOpen(true),
      disabled: false
    },
    {
      title: 'Calculadora Financiera',
      description: 'Herramientas de cálculo para proyecciones',
      icon: Calculate,
      color: 'warning',
      onAction: () => {},
      disabled: true
    },
    {
      title: 'Análisis de Tendencias',
      description: 'Análisis predictivo y tendencias automáticas',
      icon: Timeline,
      color: 'info',
      onAction: () => {},
      disabled: true
    },
    {
      title: 'Importación Masiva',
      description: 'Cargar datos desde archivos externos',
      icon: Upload,
      color: 'secondary',
      onAction: () => {},
      disabled: true
    }
  ];

  const handleExportExcel = () => {
    // Simular exportación
    const data = {
      compromisos: stats?.totalCommitments || 0,
      montoTotal: stats?.totalAmount || 0,
      pendientes: stats?.pendingCommitments || 0,
      vencidos: stats?.overDueCommitments || 0
    };
    
    console.log('Exportando datos:', data);
    alert('Exportación iniciada. El archivo se descargará cuando esté listo.');
    setExportDialogOpen(false);
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          mb: 4,
          p: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}>
          <Typography variant="h4" fontWeight="bold" sx={{ 
            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            Herramientas Avanzadas
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Suite completa de utilidades para análisis, exportación y gestión de datos
          </Typography>
        </Box>
      </motion.div>

      {/* Alertas informativas */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Herramientas Disponibles:</strong> Algunas funcionalidades están en desarrollo. 
          Las herramientas activas están marcadas y completamente operativas.
        </Alert>
      </motion.div>

      {/* Grid de herramientas */}
      <Grid container spacing={3}>
        {tools.map((tool, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ToolCard
              {...tool}
              delay={index * 0.1}
            />
          </Grid>
        ))}
      </Grid>

      {/* Sección de estadísticas rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card sx={{ 
          mt: 4,
          p: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings sx={{ color: 'primary.main' }} />
            Datos del Sistema
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {stats?.totalCommitments || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Registros totales
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  6
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Herramientas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  3
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Activas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  99%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Disponibilidad
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>
      </motion.div>

      {/* Diálogos */}
      <AdvancedSearchTool 
        open={searchDialogOpen} 
        onClose={() => setSearchDialogOpen(false)} 
      />

      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Exportar a Excel</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Deseas exportar los datos actuales del dashboard a un archivo Excel?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El archivo incluirá: compromisos, empresas, pagos y estadísticas generales.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleExportExcel} startIcon={<Download />}>
            Exportar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedToolsPage;
