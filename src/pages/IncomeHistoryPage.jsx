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
import { useTheme } from '@mui/material/styles';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot
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
  const [amountRangeFilter, setAmountRangeFilter] = useState({ min: '', max: '' });
  const [bankFilter, setBankFilter] = useState('all');
  
  // Estados para paginación optimizada
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [uniqueBanks, setUniqueBanks] = useState([]);

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
        
        // Extraer bancos únicos para filtros
        const banks = [...new Set(incomesData
          .map(income => income.bank)
          .filter(bank => bank && bank.trim())
        )].sort();
        setUniqueBanks(banks);
        
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

  // Aplicar filtros optimizado
  useEffect(() => {
    let filtered = [...incomes];

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(income =>
        income.client.toLowerCase().includes(searchLower) ||
        (income.description && income.description.toLowerCase().includes(searchLower)) ||
        (income.account && income.account.toLowerCase().includes(searchLower)) ||
        (income.bank && income.bank.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(income => income.paymentMethod === paymentMethodFilter);
    }

    // Filtro por banco
    if (bankFilter !== 'all') {
      filtered = filtered.filter(income => income.bank === bankFilter);
    }

    // Filtro por rango de montos
    if (amountRangeFilter.min !== '' || amountRangeFilter.max !== '') {
      filtered = filtered.filter(income => {
        const amount = income.amount || 0;
        const min = amountRangeFilter.min !== '' ? parseFloat(amountRangeFilter.min) : 0;
        const max = amountRangeFilter.max !== '' ? parseFloat(amountRangeFilter.max) : Infinity;
        return amount >= min && amount <= max;
      });
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
  }, [incomes, searchTerm, paymentMethodFilter, bankFilter, amountRangeFilter, dateRangeFilter, customDateFrom, customDateTo]);

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

  // Calcular datos paginados con mejor performance
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncomes = React.useMemo(() => {
    return filteredIncomes.slice(startIndex, endIndex);
  }, [filteredIncomes, startIndex, endIndex]);

  // Opciones de paginación para alto volumen
  const itemsPerPageOptions = [10, 25, 50, 100, 250];

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentMethodFilter('all');
    setBankFilter('all');
    setAmountRangeFilter({ min: '', max: '' });
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
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* Header sobrio */}
      <Box sx={{ 
        mb: 6,
        textAlign: 'left'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: 'text.primary'
          }}
        >
          📈 Histórico de Consignaciones
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontWeight: 400
          }}
        >
          Consulta y analiza todos los pagos recibidos
        </Typography>
      </Box>

      {/* Estadísticas sobrias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Registros',
            value: stats.total,
            icon: <ReceiptIcon />,
            color: theme.palette.primary.main
          },
          {
            title: 'Monto Total',
            value: formatCurrency(stats.totalAmount),
            icon: <AttachMoneyIcon />,
            color: theme.palette.success.main
          },
          {
            title: 'Promedio por Ingreso',
            value: formatCurrency(stats.averageAmount),
            icon: <TrendingUpIcon />,
            color: theme.palette.warning.main
          },
          {
            title: 'Página Actual',
            value: `${currentPage} de ${totalPages}`,
            icon: <BusinessIcon />,
            color: theme.palette.info.main
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: `${stat.color}15`,
                    color: stat.color
                  }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Panel de filtros sobrio */}
      <Card sx={{ 
        borderRadius: 2, 
        mb: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Filtros Avanzados
            </Typography>
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
                      <SearchIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>

            {/* Filtro por método de pago */}
            <Grid item xs={12} md={2.25}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  label="Método de Pago"
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'success.main'
                    }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por banco */}
            <Grid item xs={12} md={2.25}>
              <FormControl fullWidth>
                <InputLabel>Banco</InputLabel>
                <Select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  label="Banco"
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'info.main'
                    }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {uniqueBanks.map((bank) => (
                    <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por período */}
            <Grid item xs={12} md={2.25}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  label="Período"
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main'
                    }
                  }}
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

            {/* Botón limpiar filtros */}
            <Grid item xs={12} md={2.25}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ 
                  height: '56px',
                  borderRadius: 1,
                  fontWeight: 500
                }}
              >
                Limpiar
              </Button>
            </Grid>

            {/* Filtros de monto */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Monto mínimo"
                  type="number"
                  value={amountRangeFilter.min}
                  onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, min: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  sx={{ 
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'success.main'
                      }
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">a</Typography>
                <TextField
                  label="Monto máximo"
                  type="number"
                  value={amountRangeFilter.max}
                  onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, max: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  sx={{ 
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'success.main'
                      }
                    }
                  }}
                />
              </Box>
            </Grid>

            {/* Fechas personalizadas */}
            {dateRangeFilter === 'custom' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Desde"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'info.main'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Hasta"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'info.main'
                        }
                      }
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de resultados sobria */}
      <Card sx={{ 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header con controles de paginación */}
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Resultados: {stats.total} ingresos encontrados
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Registros por página:
              </Typography>
              <Select
                size="small"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(e.target.value);
                  setCurrentPage(1);
                }}
                sx={{
                  borderRadius: 1
                }}
              >
                {itemsPerPageOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Método</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cuenta</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Banco</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedIncomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Box>
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
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
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
                        <Tooltip title="Ver detalles">
                          <IconButton 
                            size="small" 
                            color="primary"
                            sx={{
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText'
                              }
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación sobria */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredIncomes.length)} de {filteredIncomes.length} registros
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
                variant="outlined"
                shape="rounded"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1,
                    fontWeight: 500
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Última actualización: {new Date().toLocaleString('es-CO')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total procesado: {formatCurrency(stats.totalAmount)}
        </Typography>
      </Box>
    </Box>
  );
};

export default IncomeHistoryPage;
