import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Stack,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as CompromisosIcon,
  Receipt as PagosIcon,
  Business as EmpresasIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Componente de tarjeta de estadística
const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].main}05 100%)`,
          border: `1px solid ${theme.palette[color].main}20`,
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
            {trend && (
              <Chip
                icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${Math.abs(trend)}%`}
                size="small"
                color={trend > 0 ? 'success' : 'error'}
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="h4" fontWeight={700} color={`${color}.main`} gutterBottom>
            {value}
          </Typography>
          <Typography variant="h6" color="textPrimary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de filtros
const DataFilters = ({ filters, onFiltersChange }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Filtros y Configuración
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
        </Box>
        
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={filters.period}
                    label="Período"
                    onChange={(e) => onFiltersChange({ ...filters, period: e.target.value })}
                  >
                    <MenuItem value="week">Esta semana</MenuItem>
                    <MenuItem value="month">Este mes</MenuItem>
                    <MenuItem value="quarter">Este trimestre</MenuItem>
                    <MenuItem value="year">Este año</MenuItem>
                    <MenuItem value="custom">Personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    value={filters.company}
                    label="Empresa"
                    onChange={(e) => onFiltersChange({ ...filters, company: e.target.value })}
                  >
                    <MenuItem value="">Todas las empresas</MenuItem>
                    <MenuItem value="abc">Constructora ABC S.A.S</MenuItem>
                    <MenuItem value="xyz">Distribuidora XYZ Ltda</MenuItem>
                    <MenuItem value="lmn">Servicios LMN EIRL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    label="Estado"
                    onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="">Todos los estados</MenuItem>
                    <MenuItem value="pending">Pendientes</MenuItem>
                    <MenuItem value="completed">Completados</MenuItem>
                    <MenuItem value="overdue">Vencidos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.showTrends}
                        onChange={(e) => onFiltersChange({ ...filters, showTrends: e.target.checked })}
                      />
                    }
                    label="Mostrar tendencias"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.realTimeData}
                        onChange={(e) => onFiltersChange({ ...filters, realTimeData: e.target.checked })}
                      />
                    }
                    label="Datos en tiempo real"
                  />
                </Box>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

const DataPage = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState({
    period: 'month',
    company: '',
    status: '',
    showTrends: true,
    realTimeData: false
  });

  // Datos iniciales vacíos - listos para datos reales
  const stats = [
    {
      title: 'Total Compromisos',
      value: '0',
      subtitle: 'Compromisos activos',
      icon: CompromisosIcon,
      trend: null,
      color: 'primary'
    },
    {
      title: 'Pagos Realizados',
      value: '$0',
      subtitle: 'Este mes',
      icon: PagosIcon,
      trend: null,
      color: 'success'
    },
    {
      title: 'Empresas Activas',
      value: '0',
      subtitle: 'Con compromisos vigentes',
      icon: EmpresasIcon,
      trend: null,
      color: 'info'
    },
    {
      title: 'Próximos Vencimientos',
      value: '0',
      subtitle: 'En los próximos 7 días',
      icon: CalendarIcon,
      trend: null,
      color: 'warning'
    }
  ];

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Centro de Análisis de Datos
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Información consolidada, filtrada y visualizada de compromisos y pagos
        </Typography>
        
        {/* Botones de acción */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<RefreshIcon />} size="small">
            Actualizar Datos
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
            Exportar Reporte
          </Button>
        </Stack>
      </Box>

      {/* Filtros */}
      <DataFilters filters={filters} onFiltersChange={setFilters} />

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs para diferentes vistas */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              icon={<ChartIcon />} 
              label="Resumen General" 
              iconPosition="start"
            />
            <Tab 
              icon={<PieChartIcon />} 
              label="Por Categorías" 
              iconPosition="start"
            />
            <Tab 
              icon={<LineChartIcon />} 
              label="Tendencias" 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <CardContent sx={{ minHeight: 400 }}>
          {currentTab === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ChartIcon sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Gráficas de Resumen General
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aquí se mostrarán los gráficos consolidados de todos los datos financieros
              </Typography>
            </Box>
          )}
          
          {currentTab === 1 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PieChartIcon sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Análisis por Categorías
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Distribución de compromisos y pagos organizados por categorías y empresas
              </Typography>
            </Box>
          )}
          
          {currentTab === 2 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <LineChartIcon sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Análisis de Tendencias
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Evolución temporal de compromisos, pagos y proyecciones futuras
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataPage;
