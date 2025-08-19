import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const AccountMovementsModal = ({ 
  open, 
  onClose, 
  account, 
  movements = [], 
  balance = {} 
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, payment, 4x1000

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Obtener color según el balance
  const getBalanceColor = (balance) => {
    if (balance > 0) return 'success.main';
    if (balance < 0) return 'error.main';
    return 'text.secondary';
  };

  // Filtrar movimientos
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = !searchTerm || 
      movement.concept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || movement.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (!account) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[24],
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        pb: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AccountBalanceIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {account.companyName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {account.account} - {account.bank}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Resumen de Balance */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.success.main}20 0%, ${theme.palette.success.main}10 100%)` }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  {formatCurrency(balance.incomes)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ingresos ({balance.incomesCount})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.error.main}20 0%, ${theme.palette.error.main}10 100%)` }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body2" color="error.main" fontWeight="bold">
                  {formatCurrency(balance.payments)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pagos ({balance.paymentsCount})
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.main}20 0%, ${theme.palette.warning.main}10 100%)` }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body2" color="warning.main" fontWeight="bold">
                  {formatCurrency(balance.tax4x1000)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  4x1000 ({balance.tax4x1000Count})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.primary.main}10 100%)` }}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography 
                  variant="body2" 
                  color={getBalanceColor(balance.balance)} 
                  fontWeight="bold"
                >
                  {formatCurrency(balance.balance)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Balance Final
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros y Búsqueda */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Buscar movimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <Box display="flex" gap={1}>
            {[
              { value: 'all', label: 'Todos', color: 'primary' },
              { value: 'income', label: 'Ingresos', color: 'success' },
              { value: 'payment', label: 'Pagos', color: 'error' },
              { value: '4x1000', label: '4x1000', color: 'warning' }
            ].map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                variant={filterType === filter.value ? 'filled' : 'outlined'}
                color={filterType === filter.value ? filter.color : 'default'}
                onClick={() => setFilterType(filter.value)}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Lista de Movimientos */}
        {filteredMovements.length === 0 ? (
          <Alert severity="info">
            {searchTerm || filterType !== 'all' 
              ? 'No se encontraron movimientos con los filtros aplicados.'
              : 'No hay movimientos registrados para esta cuenta.'}
          </Alert>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            <AnimatePresence>
              {filteredMovements.map((movement, index) => (
                <motion.div
                  key={`${movement.type}-${movement.id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <ListItem 
                    sx={{ 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <ListItemIcon>
                      {movement.type === 'income' ? (
                        <TrendingUpIcon color="success" />
                      ) : movement.type === '4x1000' ? (
                        <ReceiptIcon color="warning" />
                      ) : (
                        <TrendingDownIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {movement.type === 'income' 
                            ? `Ingreso: ${movement.client || movement.concept}` 
                            : movement.type === '4x1000'
                            ? '4x1000: Impuesto Gravamen'
                            : `Pago: ${movement.concept}`
                          }
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {format(movement.date, 'dd/MMM/yyyy HH:mm', { locale: es })}
                          </Typography>
                          {movement.type === '4x1000' && (
                            <Chip 
                              label="Automático" 
                              size="small" 
                              color="warning" 
                              variant="outlined" 
                              sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} 
                            />
                          )}
                          {movement.notes && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {movement.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography 
                        variant="body2" 
                        color={movement.type === 'income' ? 'success.main' : movement.type === '4x1000' ? 'warning.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Mostrando {filteredMovements.length} de {movements.length} movimientos
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountMovementsModal;
