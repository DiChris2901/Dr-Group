import React, { useState, useEffect } from 'react';
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
  Alert,
  TablePagination
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
import { motion } from 'framer-motion';
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

  // Paleta/acentos suaves (versión liviana)
  const gradients = {
    primary: 'linear-gradient(135deg, rgba(102,126,234,0.35) 0%, rgba(118,75,162,0.35) 100%)'
  };

  const fadeUp = { initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{duration:.45,ease:'easeOut'} };

  // Paginación (máx 10 registros por página)
  const [page, setPage] = useState(0);
  const rowsPerPage = 10; // fijo según requerimiento

  useEffect(()=>{
    const maxPage = Math.max(0, Math.ceil(filteredPayments.length / rowsPerPage) - 1);
    if(page > maxPage) setPage(0);
  }, [filteredPayments.length, page]);

  const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3, pb:6, display:'flex', flexDirection:'column', gap:3 }}>
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
          {/* HEADER GESTIÓN EMPRESARIAL */}
          <motion.div {...fadeUp}>
            <Paper variant="outlined" sx={{ mb:2.5, p:2.5, borderRadius:2, position:'relative', bgcolor: theme.palette.background.paper }}>
              <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, justifyContent:'space-between', alignItems:{ md:'center' }, gap:2 }}>
                <Box sx={{ flex:1, minWidth:260 }}>
                  <Typography variant="overline" sx={{ fontWeight:600, letterSpacing:.5, color:'text.secondary' }}>FINANZAS • PAGOS</Typography>
                  <Typography variant="h5" sx={{ fontWeight:700, letterSpacing:'-0.5px' }}>Gestión de Pagos</Typography>
                  <Typography variant="body2" sx={{ color:'text.secondary', mt:0.5 }}>Administra pagos y transacciones corporativas</Typography>
                </Box>
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:1.2, alignItems:'center' }}>
                  <Chip size="small" label={`Total $${totalAmount.toLocaleString()}`} sx={{ fontWeight:600, borderRadius:1 }} />
                  <Chip size="small" label={`Comp $${completedAmount.toLocaleString()}`} color="success" variant="outlined" sx={{ borderRadius:1 }} />
                  <Chip size="small" label={`Pend $${pendingAmount.toLocaleString()}`} color="warning" variant="outlined" sx={{ borderRadius:1 }} />
                  <Chip size="small" label={`${filteredPayments.length} pagos`} variant="outlined" sx={{ borderRadius:1 }} />
                  <Box sx={{ width:1, display:{ xs:'block', md:'none' } }} />
                  <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={()=>navigate('/payments/new')} sx={{ textTransform:'none', fontWeight:600, borderRadius:2 }}>Nuevo</Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* KPIs / CARDS LIGEROS */}
          <Grid container spacing={2}>
            {[{
              label:'Total Procesado', value:`$${totalAmount.toLocaleString()}`, icon:<MoneyIcon />, color: theme.palette.primary.main
            },{
              label:'Completados', value:`$${completedAmount.toLocaleString()}`, icon:<CheckIcon />, color: theme.palette.success.main
            },{
              label:'Pendientes', value:`$${pendingAmount.toLocaleString()}`, icon:<PendingIcon />, color: theme.palette.warning.main
            },{
              label:'Total Pagos', value:filteredPayments.length, icon:<ReceiptIcon />, color: theme.palette.info.main
            }].map(card => (
              <Grid item xs={12} sm={6} md={3} key={card.label}>
                <motion.div whileHover={{ y:-3 }} transition={{ duration:.3 }}>
                  <Card variant="outlined" sx={{ borderRadius:2, position:'relative', overflow:'hidden', backdropFilter:'blur(4px)', '&:hover':{ boxShadow:'0 4px 18px rgba(0,0,0,0.08)' } }}>
                    <CardContent sx={{ p:2.2 }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                        <Avatar variant="rounded" sx={{ width:40, height:40, bgcolor: `${card.color}14`, color:card.color, borderRadius:2 }}>{card.icon}</Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight:700 }}>{card.value}</Typography>
                          <Typography variant="caption" sx={{ color:'text.secondary', fontWeight:500 }}>{card.label}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* FILTROS LIGEROS */}
          <motion.div {...fadeUp}>
            <Paper sx={{ mt:3, mb:1, p:1.5, borderRadius:2, display:'flex', flexWrap:'wrap', gap:1.5, alignItems:'center', border:'1px solid', borderColor:'divider', background: theme.palette.background.paper }}>
              <Box sx={{ flex:1, minWidth:240, display:'flex', alignItems:'center', gap:1, px:1.5, py:0.75, borderRadius:1, border:'1px solid', borderColor:'divider' }}>
                <SearchIcon fontSize="small" sx={{ color:'text.secondary' }} />
                <InputBase placeholder="Buscar pagos..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} sx={{ flex:1, fontSize:14 }} />
              </Box>
              <FormControl size="small" sx={{ minWidth:130 }}>
                <InputLabel>Estado</InputLabel>
                <Select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} label="Estado" sx={{ borderRadius:2 }}>
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="completed">Completados</MenuItem>
                  <MenuItem value="pending">Pendientes</MenuItem>
                  <MenuItem value="failed">Fallidos</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<AddIcon />} onClick={()=>navigate('/payments/new')} sx={{ borderRadius:2, fontWeight:600, textTransform:'none', px:2.5 }}>Nuevo Pago</Button>
            </Paper>
          </motion.div>

          {/* TABLA LIGERA */}
            <motion.div {...fadeUp}>
              <Paper sx={{ borderRadius:2, overflow:'hidden', border:'1px solid', borderColor:'divider' }}>
                <TableContainer sx={{ maxHeight: '62vh' }}>
                  <Table stickyHeader size="small" sx={{ '& td, & th':{ borderBottomColor:'divider' }, 'thead th':{ fontSize:12, letterSpacing:'.4px', textTransform:'uppercase', fontWeight:600, bgcolor: theme.palette.mode==='light'? 'grey.50':'grey.900' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Empresa</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Método</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Referencia</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPayments.map((payment, idx) => (
                        <TableRow
                          key={payment.id}
                          hover
                          sx={{
                            transition:'background .18s',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : (theme.palette.mode==='light' ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.03)'),
                            '&:hover': { background: theme.palette.mode==='light'? 'rgba(102,126,234,0.06)':'rgba(102,126,234,0.14)' }
                          }}
                        >
                          <TableCell sx={{ py:1 }}>
                            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                              <Avatar sx={{ width:30, height:30, fontSize:'0.7rem', bgcolor:'primary.50', color:'primary.main', fontWeight:600, borderRadius:2 }}>
                                {payment.companyName?.charAt(0) || 'N'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight:500 }}>{payment.companyName || 'Sin empresa'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py:1 }}><Typography variant="body2">{payment.concept}</Typography></TableCell>
                          <TableCell sx={{ py:1, fontWeight:600 }} align="right">${payment.amount.toLocaleString()}</TableCell>
                          <TableCell sx={{ py:1 }}>
                            <Chip label={payment.method} size="small" variant="outlined" sx={{ fontWeight:600, borderRadius:1 }} />
                          </TableCell>
                          <TableCell sx={{ py:1 }}><Typography variant="caption">{new Date(payment.date).toLocaleDateString()}</Typography></TableCell>
                          <TableCell sx={{ py:1 }}>
                            <Typography variant="caption" sx={{ fontFamily:'monospace', fontWeight:500 }}>{payment.reference}</Typography>
                          </TableCell>
                          <TableCell sx={{ py:1 }}>
                            <Chip icon={getStatusIcon(payment.status)} label={getStatusText(payment.status)} color={getStatusColor(payment.status)} size="small" sx={{ borderRadius:1 }} />
                          </TableCell>
                          <TableCell sx={{ py:1 }}>
                            <Tooltip title="Ver detalles">
                              <IconButton size="small">
                                <ReceiptIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredPayments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py:6 }}>
                            <Box sx={{ textAlign:'center', opacity:0.75, display:'flex', flexDirection:'column', gap:1, alignItems:'center' }}>
                              <ReceiptIcon fontSize="large" sx={{ opacity:0.4 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight:600 }}>No hay pagos registrados</Typography>
                              <Typography variant="caption" sx={{ maxWidth:360, lineHeight:1.4 }}>Crea el primer registro con el botón "Nuevo" o ajusta los filtros para ampliar la búsqueda.</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  rowsPerPageOptions={[10]}
                  labelRowsPerPage={''}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  count={filteredPayments.length}
                  onPageChange={(e, newPage)=> setPage(newPage)}
                />
              </Paper>
            </motion.div>
        </>
      )}
    </Box>
  );
};

export default PaymentsPage;
