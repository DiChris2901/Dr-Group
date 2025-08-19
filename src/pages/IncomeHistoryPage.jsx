import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
  Avatar,
  Pagination,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';

const IncomeHistoryPage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  
  // Estados principales
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Cargar ingresos desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'incomes'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const incomesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          incomesData.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });

        setIncomes(incomesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando histórico de ingresos:', error);
        setError('Error al cargar el histórico: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...incomes];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(income =>
        income.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (income.description && income.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (income.account && income.account.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (income.bank && income.bank.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(income => income.paymentMethod === paymentMethodFilter);
    }

    // Filtro por rango de fechas
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (dateRangeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'thisWeek':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          startDate = startOfWeek;
          endDate = endOfWeek;
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'custom':
          if (customDateFrom && customDateTo) {
            startDate = parseISO(customDateFrom);
            endDate = parseISO(customDateTo + 'T23:59:59');
          }
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(income =>
          isWithinInterval(income.date, { start: startDate, end: endDate })
        );
      }
    }

    setFilteredIncomes(filtered);
    setCurrentPage(1); // Reset página al filtrar
  }, [incomes, searchTerm, paymentMethodFilter, dateRangeFilter, customDateFrom, customDateTo]);

  // Calcular estadísticas de los ingresos filtrados
  const stats = React.useMemo(() => {
    const totalAmount = filteredIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    
    // Agrupar por método de pago
    const byPaymentMethod = filteredIncomes.reduce((acc, income) => {
      acc[income.paymentMethod] = (acc[income.paymentMethod] || 0) + income.amount;
      return acc;
    }, {});

    return {
      total: filteredIncomes.length,
      totalAmount,
      byPaymentMethod,
      averageAmount: filteredIncomes.length > 0 ? totalAmount / filteredIncomes.length : 0
    };
  }, [filteredIncomes]);

  // Calcular datos paginados
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncomes = filteredIncomes.slice(startIndex, endIndex);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentMethodFilter('all');
    setDateRangeFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'transferencia': 'primary',
      'efectivo': 'success',
      'cheque': 'warning',
      'tarjeta': 'info',
      'otro': 'default'
    };
    return colors[method] || 'default';
  };

  const exportData = () => {
    // Implementar exportación a CSV/Excel
    console.log('Exportando datos del histórico...');
    // TODO: Implementar exportación real
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando histórico de ingresos...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            📈 Histórico de Consignaciones
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consulta y analiza todos los pagos recibidos
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={exportData}
          sx={{ borderRadius: 2 }}
        >
          Exportar
        </Button>
      </Box>

      {/* Estadísticas resumidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Registros',
            value: stats.total,
            icon: <ReceiptIcon />,
            color: '#2196f3'
          },
          {
            title: 'Monto Total',
            value: formatCurrency(stats.totalAmount),
            icon: <AttachMoneyIcon />,
            color: '#4caf50'
          },
          {
            title: 'Promedio',
            value: formatCurrency(stats.averageAmount),
            icon: <TrendingUpIcon />,
            color: '#ff9800'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros de Búsqueda
            </Typography>
            {(searchTerm || paymentMethodFilter !== 'all' || dateRangeFilter !== 'all') && (
              <Button
                size="small"
                onClick={clearFilters}
                startIcon={<ClearIcon />}
                sx={{ ml: 'auto' }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Búsqueda */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cliente, descripción, cuenta, banco..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Filtro por método de pago */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  label="Método de Pago"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por rango de fechas */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  label="Período"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="today">Hoy</MenuItem>
                  <MenuItem value="thisWeek">Esta Semana</MenuItem>
                  <MenuItem value="thisMonth">Este Mes</MenuItem>
                  <MenuItem value="lastMonth">Mes Anterior</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fechas personalizadas */}
            {dateRangeFilter === 'custom' && (
              <>
                <Grid item xs={12} md={1.5}>
                  <TextField
                    fullWidth
                    label="Desde"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={1.5}>
                  <TextField
                    fullWidth
                    label="Hasta"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de resultados */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Resultados: {filteredIncomes.length} ingresos encontrados
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Método</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cuenta</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Banco</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Al Día</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedIncomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box>
                        <AttachMoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No se encontraron ingresos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Intenta ajustar los filtros de búsqueda
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedIncomes.map((income, index) => (
                    <TableRow
                      key={income.id}
                      sx={{
                        '&:hover': { backgroundColor: theme.palette.action.hover },
                        '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover + '40' }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {income.client}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(income.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(income.date, 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={income.paymentMethod}
                          size="small"
                          color={getPaymentMethodColor(income.paymentMethod)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {income.account || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {income.bank || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={income.isClientPaidInFull ? "✅ Al día" : "⏳ Parcial"}
                          size="small"
                          color={income.isClientPaidInFull ? "success" : "warning"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
                variant="outlined"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {paginatedIncomes.length} de {filteredIncomes.length} registros
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total mostrado: {formatCurrency(stats.totalAmount)}
        </Typography>
      </Box>
    </Box>
  );
};

export default IncomeHistoryPage;
