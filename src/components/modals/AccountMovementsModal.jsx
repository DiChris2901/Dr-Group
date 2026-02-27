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
  Alert,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Paginación
  const totalMovements = filteredMovements.length;
  const paginatedMovements = filteredMovements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Resetear página cuando cambien filtros
  React.useEffect(() => {
    setPage(0);
  }, [searchTerm, filterType]);

  // Manejadores de paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!account) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: `1px solid ${theme.palette.divider}`
        }
      }}
    >
      {/* Header sobrio */}
      <DialogTitle sx={{ 
        pb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: `${theme.palette.primary.main}15`,
            color: 'primary.main'
          }}>
            <AccountBalanceIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {account.companyName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {account.account} - {account.bank}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ borderRadius: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Resumen de balance sobrio */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: 'success.main',
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {formatCurrency(balance.incomes)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ingresos ({balance.incomesCount})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: 'error.main',
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {formatCurrency(balance.payments)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pagos ({balance.paymentsCount})
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: 'warning.main',
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {formatCurrency(balance.tax4x1000)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  4x1000 ({balance.tax4x1000Count})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ 
                  color: getBalanceColor(balance.balance),
                  fontWeight: 600,
                  mb: 0.5
                }}>
                  {formatCurrency(balance.balance)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Balance Final
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros sobrios */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Buscar movimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
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
                sx={{
                  borderRadius: 1,
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: filterType === filter.value 
                      ? undefined 
                      : `${theme.palette[filter.color]?.main || theme.palette.action.hover}15`
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Lista sobria de movimientos */}
        {filteredMovements.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            {searchTerm || filterType !== 'all' 
              ? 'No se encontraron movimientos con los filtros aplicados.'
              : 'No hay movimientos registrados para esta cuenta.'}
          </Alert>
        ) : (
          <>
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {paginatedMovements.map((movement, index) => (
                <ListItem 
                  key={`${movement.type}-${movement.id}-${index}`}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    mb: 1,
                    py: 2,
                    px: 2,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    {/* Icono sobrio */}
                    <Box sx={{ 
                      flexShrink: 0,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: movement.type === 'income' 
                        ? `${theme.palette.success.main}15`
                        : movement.type === '4x1000' 
                        ? `${theme.palette.warning.main}15`
                        : `${theme.palette.error.main}15`
                    }}>
                      {movement.type === 'income' ? (
                        <TrendingUpIcon 
                          sx={{ 
                            fontSize: 20, 
                            color: 'success.main'
                          }} 
                        />
                      ) : movement.type === '4x1000' ? (
                        <ReceiptIcon 
                          sx={{ 
                            fontSize: 20, 
                            color: 'warning.main'
                          }} 
                        />
                      ) : (
                        <TrendingDownIcon 
                          sx={{ 
                            fontSize: 20, 
                            color: 'error.main'
                          }} 
                        />
                      )}
                    </Box>

                    {/* Contenido principal */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '60%'
                          }}
                        >
                          {movement.type === 'income' 
                            ? movement.client || movement.concept
                            : movement.type === '4x1000'
                            ? 'Impuesto 4x1000'
                            : movement.concept || 'Pago'
                          }
                        </Typography>
                        
                        {/* Monto */}
                        <Typography 
                          variant="h6" 
                          sx={{
                            color: movement.type === 'income' 
                              ? 'success.main' 
                              : movement.type === '4x1000' 
                              ? 'warning.main' 
                              : 'error.main',
                            fontWeight: 600
                          }}
                        >
                          {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
                        </Typography>
                      </Box>

                      {/* Detalles secundarios */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {format(movement.date, 'dd/MMM/yyyy HH:mm', { locale: es })}
                        </Typography>
                        
                        {movement.type === '4x1000' && (
                          <Chip 
                            label="Automático" 
                            size="small" 
                            color="warning" 
                            variant="outlined" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              borderRadius: 0.5
                            }} 
                          />
                        )}
                        
                        {movement.notes && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontStyle: 'italic',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px'
                            }}
                          >
                            • {movement.notes}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>

            {/* Paginación sobria */}
            <Box sx={{ 
              mt: 3, 
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalMovements)} de {totalMovements} movimientos
              </Typography>
              
              <TablePagination
                component="div"
                count={totalMovements}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
                size="small"
                sx={{
                  '& .MuiTablePagination-toolbar': {
                    minHeight: 48,
                    paddingLeft: 2,
                    paddingRight: 0
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                    color: 'text.secondary'
                  }
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>

      {/* Actions sobrias */}
      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${theme.palette.divider}`,
        gap: 1
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            textTransform: 'none'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountMovementsModal;
