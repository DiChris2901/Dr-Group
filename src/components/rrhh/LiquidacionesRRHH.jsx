import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const LiquidacionesRRHH = ({ 
  liquidaciones, 
  empleados, 
  userProfile, 
  showToast 
}) => {
  const theme = useTheme();
  
  // Estados
  const [openLiquidacionModal, setOpenLiquidacionModal] = useState(false);
  const [selectedMes, setSelectedMes] = useState(format(new Date(), 'yyyy-MM'));
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form Liquidación
  const [formLiquidacion, setFormLiquidacion] = useState({
    empleadoId: '',
    empleadoNombre: '',
    mes: format(new Date(), 'yyyy-MM'),
    salarioBase: 0,
    horasExtras: 0,
    valorHoraExtra: 0,
    bonificaciones: 0,
    deducciones: 0,
    detallesBonificaciones: '',
    detallesDeducciones: ''
  });

  // Calcular totales
  const calcularTotales = (form) => {
    const base = parseFloat(form.salarioBase) || 0;
    const extras = (parseFloat(form.horasExtras) || 0) * (parseFloat(form.valorHoraExtra) || 0);
    const bonos = parseFloat(form.bonificaciones) || 0;
    const deduc = parseFloat(form.deducciones) || 0;
    
    const devengado = base + extras + bonos;
    const neto = devengado - deduc;
    
    return { devengado, neto };
  };

  // Crear nueva liquidación
  const handleCrearLiquidacion = async () => {
    try {
      if (!formLiquidacion.empleadoId || !formLiquidacion.salarioBase) {
        showToast('Por favor completa todos los campos obligatorios', 'warning');
        return;
      }

      const empleado = empleados.find(e => e.id === formLiquidacion.empleadoId);
      const { devengado, neto } = calcularTotales(formLiquidacion);
      
      await addDoc(collection(db, 'liquidaciones'), {
        empleadoId: formLiquidacion.empleadoId,
        empleadoNombre: empleado?.nombre || formLiquidacion.empleadoNombre,
        empleadoEmail: empleado?.email || '',
        mes: formLiquidacion.mes,
        salarioBase: parseFloat(formLiquidacion.salarioBase),
        horasExtras: parseFloat(formLiquidacion.horasExtras) || 0,
        valorHoraExtra: parseFloat(formLiquidacion.valorHoraExtra) || 0,
        bonificaciones: parseFloat(formLiquidacion.bonificaciones) || 0,
        deducciones: parseFloat(formLiquidacion.deducciones) || 0,
        detallesBonificaciones: formLiquidacion.detallesBonificaciones,
        detallesDeducciones: formLiquidacion.detallesDeducciones,
        totalDevengado: devengado,
        totalNeto: neto,
        estado: 'generada',
        fechaCreacion: Timestamp.now(),
        creadoPor: userProfile.uid,
        creadoPorNombre: userProfile.name || userProfile.displayName
      });

      showToast('Liquidación creada exitosamente', 'success');
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear liquidación:', error);
      showToast('Error al crear la liquidación', 'error');
    }
  };

  // Eliminar liquidación
  const handleEliminarLiquidacion = async (liquidacionId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta liquidación?')) return;
    
    try {
      await deleteDoc(doc(db, 'liquidaciones', liquidacionId));
      showToast('Liquidación eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar liquidación:', error);
      showToast('Error al eliminar la liquidación', 'error');
    }
  };

  // Marcar como pagada
  const handleMarcarPagada = async (liquidacionId) => {
    try {
      await updateDoc(doc(db, 'liquidaciones', liquidacionId), {
        estado: 'pagada',
        fechaPago: Timestamp.now(),
        pagadoPor: userProfile.uid,
        pagadoPorNombre: userProfile.name || userProfile.displayName
      });
      showToast('Liquidación marcada como pagada', 'success');
    } catch (error) {
      console.error('Error al marcar como pagada:', error);
      showToast('Error al actualizar el estado', 'error');
    }
  };

  // Abrir modal
  const handleNuevaLiquidacion = () => {
    setFormLiquidacion({
      empleadoId: '',
      empleadoNombre: '',
      mes: format(new Date(), 'yyyy-MM'),
      salarioBase: 0,
      horasExtras: 0,
      valorHoraExtra: 0,
      bonificaciones: 0,
      deducciones: 0,
      detallesBonificaciones: '',
      detallesDeducciones: ''
    });
    setOpenLiquidacionModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenLiquidacionModal(false);
  };

  // Helper: Color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pagada': return 'success';
      case 'generada': return 'warning';
      default: return 'default';
    }
  };

  // Filtrar liquidaciones
  const liquidacionesFiltradas = liquidaciones.filter(liq => {
    const matchMes = !selectedMes || liq.mes === selectedMes;
    const matchSearch = searchEmpleado === '' || 
      liq.empleadoNombre.toLowerCase().includes(searchEmpleado.toLowerCase());
    return matchMes && matchSearch;
  });

  // Calcular totales del período
  const totalesPeriodo = liquidacionesFiltradas.reduce((acc, liq) => ({
    devengado: acc.devengado + (liq.totalDevengado || 0),
    deducciones: acc.deducciones + (liq.deducciones || 0),
    neto: acc.neto + (liq.totalNeto || 0)
  }), { devengado: 0, deducciones: 0, neto: 0 });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* HEADER */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Gestión de Nómina y Liquidaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNuevaLiquidacion}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            }
          }}
        >
          Nueva Liquidación
        </Button>
      </Box>

      {/* TARJETAS DE RESUMEN */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.success.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Devengado
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {formatCurrency(totalesPeriodo.devengado)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.error.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
                  <TrendingDownIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Deducciones
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {formatCurrency(totalesPeriodo.deducciones)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: alpha(theme.palette.primary.main, 0.8)
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Neto
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {formatCurrency(totalesPeriodo.neto)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTROS */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="month"
              label="Período"
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar empleado"
              value={searchEmpleado}
              onChange={(e) => setSearchEmpleado(e.target.value)}
              placeholder="Nombre..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* TABLA */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              <TableCell><strong>Empleado</strong></TableCell>
              <TableCell><strong>Período</strong></TableCell>
              <TableCell align="right"><strong>Salario Base</strong></TableCell>
              <TableCell align="right"><strong>Devengado</strong></TableCell>
              <TableCell align="right"><strong>Deducciones</strong></TableCell>
              <TableCell align="right"><strong>Neto</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {liquidacionesFiltradas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((liquidacion) => (
                <TableRow key={liquidacion.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <PersonIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="body2">{liquidacion.empleadoNombre}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(liquidacion.mes + '-01'), 'MMMM yyyy', { locale: es })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(liquidacion.salarioBase)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatCurrency(liquidacion.totalDevengado)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      {formatCurrency(liquidacion.deducciones)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(liquidacion.totalNeto)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={liquidacion.estado.toUpperCase()}
                      size="small"
                      color={getEstadoColor(liquidacion.estado)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {liquidacion.estado === 'generada' && (
                        <Tooltip title="Marcar como pagada">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleMarcarPagada(liquidacion.id)}
                          >
                            <MoneyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminarLiquidacion(liquidacion.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {liquidacionesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay liquidaciones para el período seleccionado
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={liquidacionesFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* MODAL: NUEVA LIQUIDACIÓN */}
      <Dialog
        open={openLiquidacionModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          fontWeight: 700
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Nueva Liquidación
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Empleado */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={formLiquidacion.empleadoId}
                  label="Empleado"
                  onChange={(e) => {
                    const emp = empleados.find(emp => emp.id === e.target.value);
                    setFormLiquidacion({
                      ...formLiquidacion,
                      empleadoId: e.target.value,
                      empleadoNombre: emp?.nombre || ''
                    });
                  }}
                >
                  {empleados.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        {emp.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Período */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="month"
                label="Período"
                value={formLiquidacion.mes}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, mes: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Salario Base */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Salario Base"
                value={formLiquidacion.salarioBase}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, salarioBase: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>

            {/* Horas Extras */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Horas Extras"
                value={formLiquidacion.horasExtras}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, horasExtras: e.target.value })}
              />
            </Grid>

            {/* Valor Hora Extra */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Valor Hora Extra"
                value={formLiquidacion.valorHoraExtra}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, valorHoraExtra: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>

            {/* Bonificaciones */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Bonificaciones"
                value={formLiquidacion.bonificaciones}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, bonificaciones: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>

            {/* Deducciones */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Deducciones"
                value={formLiquidacion.deducciones}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, deducciones: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>

            {/* Detalle Bonificaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Detalle Bonificaciones (opcional)"
                value={formLiquidacion.detallesBonificaciones}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, detallesBonificaciones: e.target.value })}
                placeholder="Ej: Bono productividad, comisiones..."
              />
            </Grid>

            {/* Detalle Deducciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Detalle Deducciones (opcional)"
                value={formLiquidacion.detallesDeducciones}
                onChange={(e) => setFormLiquidacion({ ...formLiquidacion, detallesDeducciones: e.target.value })}
                placeholder="Ej: Pensión, salud, préstamos..."
              />
            </Grid>

            {/* Resumen Calculado */}
            <Grid item xs={12}>
              <Alert
                severity="success"
                icon={<InfoIcon />}
                sx={{ borderRadius: 1 }}
              >
                <Typography variant="body2">
                  <strong>Total Devengado:</strong> {formatCurrency(calcularTotales(formLiquidacion).devengado)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Total Neto a Pagar:</strong> {formatCurrency(calcularTotales(formLiquidacion).neto)}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCrearLiquidacion}
            startIcon={<MoneyIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            Crear Liquidación
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default LiquidacionesRRHH;
