import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputBase,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Hook para cargar pagos desde Firebase
import { usePayments } from '../hooks/useFirestore';

const PaymentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Cargar pagos reales desde Firebase
  const { payments, loading, error } = usePayments({ status: statusFilter !== 'all' ? statusFilter : undefined });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckIcon fontSize="small" />;
      case 'pending':
        return <PendingIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  // Filtrar pagos por término de búsqueda
  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.companyName?.toLowerCase().includes(searchLower) ||
      payment.concept?.toLowerCase().includes(searchLower) ||
      payment.reference?.toLowerCase().includes(searchLower) ||
      payment.method?.toLowerCase().includes(searchLower)
    );
  });

  // Calcular estadísticas de pagos
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Mostrar indicador de carga */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando pagos...
          </Typography>
        </Box>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar los pagos: {error}
        </Alert>
      )}

      {/* Contenido principal - solo se muestra si no hay loading ni error */}
      {!loading && !error && (
        <>
          {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Gestión de Pagos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra todos los pagos y transacciones del sistema
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    ${totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Procesado
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <CheckIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    ${completedAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    ${pendingAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <ReceiptIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {filteredPayments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Pagos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: theme.palette.background.default,
            borderRadius: 1,
            px: 2,
            py: 1,
            flex: 1,
            minWidth: 200
          }}>
            <SearchIcon color="disabled" sx={{ mr: 1 }} />
            <InputBase
              placeholder="Buscar pagos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Estado"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="completed">Completados</MenuItem>
              <MenuItem value="pending">Pendientes</MenuItem>
              <MenuItem value="failed">Fallidos</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/payments/new')}
          >
            Nuevo Pago
          </Button>
        </Box>
      </Paper>

      {/* Payments Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {payment.companyName?.charAt(0) || 'N'}
                      </Avatar>
                      {payment.companyName || 'Sin empresa'}
                    </Box>
                  </TableCell>
                  <TableCell>{payment.concept}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    ${payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {payment.reference}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(payment.status)}
                      label={getStatusText(payment.status)}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton size="small">
                        <ReceiptIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
        </>
      )}
    </Box>
  );
};

export default PaymentsPage;
