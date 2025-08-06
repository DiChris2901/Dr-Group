import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Assessment,
  Business,
  AccountBalance,
  PieChart,
  BarChart,
  Timeline,
  MonetizationOn,
  Payment,
  Receipt,
  CreditCard,
  AccountBalanceWallet,
  Savings,
  ExpandMore,
  FilterList,
  Refresh,
  GetApp,
  DateRange,
  CompareArrows,
  ShowChart
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
// Recharts removido por compatibilidad ARM64
import { useDashboardStats } from '../hooks/useDashboardStats';

// Componente de KPI individual
const KPICard = ({ title, value, subtitle, icon, trend, trendValue, color, gradient, delay = 0 }) => {
  const theme = useTheme();
  
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('es-MX', { 
        style: 'currency', 
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <Card
        sx={{
          background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          height: '100%',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
          },
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Efecto shimmer */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 3s infinite',
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' }
            }
          }}
        />
        
        <CardContent sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '50%', 
              p: 1.5,
              backdropFilter: 'blur(10px)'
            }}>
              {icon}
            </Box>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {trend === 'up' ? (
                  <TrendingUp sx={{ color: '#4caf50', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: '#f44336', mr: 0.5 }} />
                )}
                <Typography variant="caption" fontWeight="bold">
                  {trendValue}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            {formatValue(value)}
          </Typography>
          
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de gráfico simple con CSS
const SimpleChart = ({ data, title, type = 'line' }) => {
  const theme = useTheme();
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card sx={{ 
      height: '400px',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
    }}>
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          {title}
        </Typography>
        <Box sx={{ height: '300px', display: 'flex', alignItems: 'end', gap: 1 }}>
          {data.map((item, index) => (
            <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: `${(item.value / maxValue) * 250}px`,
                  background: `linear-gradient(180deg, #667eea 0%, #764ba2 100%)`,
                  borderRadius: '4px 4px 0 0',
                  mb: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scaleY(1.05)',
                    filter: 'brightness(1.1)'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.name}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                ${(item.value / 1000).toFixed(0)}K
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Componente de gráfico circular simple
const SimpleDonutChart = ({ data, title }) => {
  const theme = useTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];

  return (
    <Card sx={{ 
      height: '400px',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
    }}>
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '300px' }}>
          <Box sx={{ 
            width: '200px', 
            height: '200px', 
            borderRadius: '50%',
            background: `conic-gradient(
              ${colors[0]} 0deg ${(data[0].value / total) * 360}deg,
              ${colors[1]} ${(data[0].value / total) * 360}deg ${((data[0].value + data[1].value) / total) * 360}deg,
              ${colors[2]} ${((data[0].value + data[1].value) / total) * 360}deg ${((data[0].value + data[1].value + data[2].value) / total) * 360}deg,
              ${colors[3]} ${((data[0].value + data[1].value + data[2].value) / total) * 360}deg 360deg
            )`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100px',
              height: '100px',
              background: theme.palette.background.paper,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)'
            }
          }} />
          <Box sx={{ ml: 4, flex: 1 }}>
            {data.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: '16px', 
                  height: '16px', 
                  background: colors[index],
                  borderRadius: '50%',
                  mr: 2
                }} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${(item.value / 1000).toFixed(0)}K ({((item.value / total) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const FinancialKPIsPage = () => {
  const theme = useTheme();
  const { stats } = useDashboardStats();
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [refreshing, setRefreshing] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState(null);

  // Datos simulados para KPIs
  const kpiData = {
    totalRevenue: 2450000,
    totalExpenses: 1850000,
    netProfit: 600000,
    pendingPayments: 450000,
    overduePayments: 125000,
    activeCommitments: 47,
    monthlyGrowth: 12.5,
    cashFlow: 785000
  };

  // Datos para gráficos
  const revenueData = [
    { name: 'Ene', value: 1200000 },
    { name: 'Feb', value: 1450000 },
    { name: 'Mar', value: 1680000 },
    { name: 'Abr', value: 1520000 },
    { name: 'May', value: 1890000 },
    { name: 'Jun', value: 2100000 },
    { name: 'Jul', value: 2450000 }
  ];

  const expenseData = [
    { name: 'Ene', value: 980000 },
    { name: 'Feb', value: 1150000 },
    { name: 'Mar', value: 1320000 },
    { name: 'Abr', value: 1280000 },
    { name: 'May', value: 1550000 },
    { name: 'Jun', value: 1720000 },
    { name: 'Jul', value: 1850000 }
  ];

  const categoryData = [
    { name: 'Ingresos por Servicios', value: 1850000 },
    { name: 'Ventas de Productos', value: 600000 },
    { name: 'Otros Ingresos', value: 200000 },
    { name: 'Inversiones', value: 150000 }
  ];

  const cashFlowData = [
    { name: 'Ene', value: 220000 },
    { name: 'Feb', value: 300000 },
    { name: 'Mar', value: 360000 },
    { name: 'Abr', value: 240000 },
    { name: 'May', value: 340000 },
    { name: 'Jun', value: 380000 },
    { name: 'Jul', value: 600000 }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
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
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ 
              background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              KPIs Financieros
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Indicadores clave de rendimiento y análisis financiero en tiempo real
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={selectedPeriod}
                label="Período"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="daily">Diario</MenuItem>
                <MenuItem value="weekly">Semanal</MenuItem>
                <MenuItem value="monthly">Mensual</MenuItem>
                <MenuItem value="yearly">Anual</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Filtros">
              <IconButton
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6d4190 100%)',
                  }
                }}
              >
                <FilterList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
                  }
                }}
              >
                <Refresh sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Ingresos Totales"
            value={kpiData.totalRevenue}
            subtitle="Ingresos acumulados del período"
            icon={<MonetizationOn />}
            trend="up"
            trendValue="12.5"
            gradient="linear-gradient(135deg, #4caf50 0%, #81c784 100%)"
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Gastos Totales"
            value={kpiData.totalExpenses}
            subtitle="Gastos operativos del período"
            icon={<Payment />}
            trend="up"
            trendValue="8.2"
            gradient="linear-gradient(135deg, #f44336 0%, #ef5350 100%)"
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Utilidad Neta"
            value={kpiData.netProfit}
            subtitle="Ganancias después de gastos"
            icon={<Savings />}
            trend="up"
            trendValue="15.7"
            gradient="linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Flujo de Caja"
            value={kpiData.cashFlow}
            subtitle="Liquidez disponible"
            icon={<AccountBalanceWallet />}
            trend="up"
            trendValue="9.3"
            gradient="linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)"
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* KPIs Secundarios */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Pagos Pendientes"
            value={kpiData.pendingPayments}
            subtitle="Compromisos por cobrar"
            icon={<Receipt />}
            trend="down"
            trendValue="5.1"
            gradient="linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)"
            delay={0.4}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Pagos Vencidos"
            value={kpiData.overduePayments}
            subtitle="Compromisos en mora"
            icon={<CreditCard />}
            trend="down"
            trendValue="12.8"
            gradient="linear-gradient(135deg, #e91e63 0%, #f06292 100%)"
            delay={0.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            title="Compromisos Activos"
            value={kpiData.activeCommitments}
            subtitle="Total de compromisos vigentes"
            icon={<Assessment />}
            gradient="linear-gradient(135deg, #607d8b 0%, #90a4ae 100%)"
            delay={0.6}
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <SimpleChart data={revenueData} title="Tendencia de Ingresos" type="area" />
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <SimpleChart data={expenseData} title="Evolución de Gastos" type="line" />
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <SimpleDonutChart data={categoryData} title="Distribución de Ingresos" />
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <SimpleChart data={cashFlowData} title="Flujo de Caja Mensual" type="bar" />
          </motion.div>
        </Grid>
      </Grid>

      {/* Menu de filtros */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => setFilterAnchor(null)}>
          <ListItemIcon><DateRange /></ListItemIcon>
          <ListItemText>Por fecha</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchor(null)}>
          <ListItemIcon><Business /></ListItemIcon>
          <ListItemText>Por empresa</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setFilterAnchor(null)}>
          <ListItemIcon><CompareArrows /></ListItemIcon>
          <ListItemText>Comparativo</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FinancialKPIsPage;
