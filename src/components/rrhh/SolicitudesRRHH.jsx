import React, { useState } from 'react';
import {
  Box,
  Button,
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Typography,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  FlightTakeoff as VacacionesIcon,
  MedicalServices as IncapacidadIcon,
  WatchLater as PermisoIcon,
  Celebration as CompensatorioIcon,
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
import { differenceInDays } from 'date-fns';

const SolicitudesRRHH = ({ 
  solicitudes, 
  empleados, 
  userProfile, 
  showToast 
}) => {
  const theme = useTheme();
  
  // Estados
  const [openSolicitudModal, setOpenSolicitudModal] = useState(false);
  const [filterSolicitudTipo, setFilterSolicitudTipo] = useState('todos');
  const [filterSolicitudEstado, setFilterSolicitudEstado] = useState('todos');
  const [searchSolicitud, setSearchSolicitud] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form Solicitud
  const [formSolicitud, setFormSolicitud] = useState({
    tipo: 'vacaciones',
    empleadoId: '',
    empleadoNombre: '',
    fechaInicio: '',
    fechaFin: '',
    dias: 0,
    motivo: ''
  });

  // Calcular días automáticamente
  React.useEffect(() => {
    if (formSolicitud.fechaInicio && formSolicitud.fechaFin) {
      const inicio = new Date(formSolicitud.fechaInicio);
      const fin = new Date(formSolicitud.fechaFin);
      const dias = differenceInDays(fin, inicio) + 1;
      setFormSolicitud(prev => ({ ...prev, dias: dias > 0 ? dias : 0 }));
    }
  }, [formSolicitud.fechaInicio, formSolicitud.fechaFin]);

  // Crear nueva solicitud
  const handleCrearSolicitud = async () => {
    try {
      if (!formSolicitud.empleadoId || !formSolicitud.fechaInicio || !formSolicitud.fechaFin) {
        showToast('Por favor completa todos los campos obligatorios', 'warning');
        return;
      }

      const empleado = empleados.find(e => e.id === formSolicitud.empleadoId);
      
      await addDoc(collection(db, 'solicitudes'), {
        tipo: formSolicitud.tipo,
        empleadoId: formSolicitud.empleadoId,
        empleadoNombre: empleado?.nombre || formSolicitud.empleadoNombre,
        empleadoEmail: empleado?.email || '',
        fechaInicio: Timestamp.fromDate(new Date(formSolicitud.fechaInicio)),
        fechaFin: Timestamp.fromDate(new Date(formSolicitud.fechaFin)),
        dias: formSolicitud.dias,
        motivo: formSolicitud.motivo,
        estado: 'pendiente',
        fechaSolicitud: Timestamp.now(),
        creadoPor: userProfile.uid,
        creadoPorNombre: userProfile.name || userProfile.displayName
      });

      showToast('Solicitud creada exitosamente', 'success');
      handleCloseModal();
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      showToast('Error al crear la solicitud', 'error');
    }
  };

  // Aprobar solicitud
  const handleAprobarSolicitud = async (solicitudId) => {
    try {
      await updateDoc(doc(db, 'solicitudes', solicitudId), {
        estado: 'aprobada',
        aprobadoPor: userProfile.uid,
        aprobadoPorNombre: userProfile.name || userProfile.displayName,
        fechaAprobacion: Timestamp.now()
      });
      showToast('Solicitud aprobada', 'success');
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      showToast('Error al aprobar la solicitud', 'error');
    }
  };

  // Rechazar solicitud
  const handleRechazarSolicitud = async (solicitudId) => {
    try {
      await updateDoc(doc(db, 'solicitudes', solicitudId), {
        estado: 'rechazada',
        rechazadoPor: userProfile.uid,
        rechazadoPorNombre: userProfile.name || userProfile.displayName,
        fechaRechazo: Timestamp.now()
      });
      showToast('Solicitud rechazada', 'info');
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      showToast('Error al rechazar la solicitud', 'error');
    }
  };

  // Eliminar solicitud
  const handleEliminarSolicitud = async (solicitudId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;
    
    try {
      await deleteDoc(doc(db, 'solicitudes', solicitudId));
      showToast('Solicitud eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      showToast('Error al eliminar la solicitud', 'error');
    }
  };

  // Abrir modal
  const handleNuevaSolicitud = () => {
    setFormSolicitud({
      tipo: 'vacaciones',
      empleadoId: '',
      empleadoNombre: '',
      fechaInicio: '',
      fechaFin: '',
      dias: 0,
      motivo: ''
    });
    setOpenSolicitudModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenSolicitudModal(false);
  };

  // Helper: Ícono según tipo con colores vibrantes
  const getTipoIcon = (tipo) => {
    const iconStyles = { fontSize: 20 };
    switch (tipo) {
      case 'vacaciones': 
        return <VacacionesIcon sx={{ ...iconStyles, color: '#00bcd4' }} />;
      case 'permiso': 
        return <PermisoIcon sx={{ ...iconStyles, color: '#ff9800' }} />;
      case 'incapacidad': 
        return <IncapacidadIcon sx={{ ...iconStyles, color: '#f44336' }} />;
      case 'compensatorio': 
        return <CompensatorioIcon sx={{ ...iconStyles, color: '#9c27b0' }} />;
      default: 
        return <AssignmentIcon sx={iconStyles} />;
    }
  };

  // Helper: Color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'success';
      case 'rechazada': return 'error';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(sol => {
    const matchTipo = filterSolicitudTipo === 'todos' || sol.tipo === filterSolicitudTipo;
    const matchEstado = filterSolicitudEstado === 'todos' || sol.estado === filterSolicitudEstado;
    const matchSearch = searchSolicitud === '' || 
      sol.empleadoNombre.toLowerCase().includes(searchSolicitud.toLowerCase());
    return matchTipo && matchEstado && matchSearch;
  });

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
          Gestión de Solicitudes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNuevaSolicitud}
          sx={{
            backgroundColor: theme.palette.primary.main,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }
          }}
        >
          Nueva Solicitud
        </Button>
      </Box>

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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterSolicitudTipo}
                label="Tipo"
                onChange={(e) => setFilterSolicitudTipo(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="vacaciones">Vacaciones</MenuItem>
                <MenuItem value="permiso">Permiso</MenuItem>
                <MenuItem value="incapacidad">Incapacidad</MenuItem>
                <MenuItem value="compensatorio">Día Compensatorio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterSolicitudEstado}
                label="Estado"
                onChange={(e) => setFilterSolicitudEstado(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="pendiente">Pendientes</MenuItem>
                <MenuItem value="aprobada">Aprobadas</MenuItem>
                <MenuItem value="rechazada">Rechazadas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar empleado"
              value={searchSolicitud}
              onChange={(e) => setSearchSolicitud(e.target.value)}
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
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Empleado</strong></TableCell>
              <TableCell><strong>Fecha Inicio</strong></TableCell>
              <TableCell><strong>Fecha Fin</strong></TableCell>
              <TableCell align="center"><strong>Días</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudesFiltradas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((solicitud) => (
                <TableRow key={solicitud.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTipoIcon(solicitud.tipo)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {solicitud.tipo}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <PersonIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="body2">{solicitud.empleadoNombre}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(solicitud.fechaInicio, 'dd MMM yyyy', { locale: es })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(solicitud.fechaFin, 'dd MMM yyyy', { locale: es })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${solicitud.dias} día${solicitud.dias !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={solicitud.estado.toUpperCase()}
                      size="small"
                      color={getEstadoColor(solicitud.estado)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {solicitud.estado === 'pendiente' && (
                        <>
                          <Tooltip title="Aprobar">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleAprobarSolicitud(solicitud.id)}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRechazarSolicitud(solicitud.id)}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminarSolicitud(solicitud.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {solicitudesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay solicitudes registradas
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
          count={solicitudesFiltradas.length}
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

      {/* MODAL: NUEVA SOLICITUD */}
      <Dialog
        open={openSolicitudModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
                Nueva Solicitud
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Registrar vacaciones, permisos o incapacidades
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
            {/* Tipo de Solicitud */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Solicitud</InputLabel>
                <Select
                  value={formSolicitud.tipo}
                  label="Tipo de Solicitud"
                  onChange={(e) => setFormSolicitud({ ...formSolicitud, tipo: e.target.value })}
                >
                  <MenuItem value="vacaciones">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VacacionesIcon fontSize="small" sx={{ color: '#00bcd4' }} />
                      Vacaciones
                    </Box>
                  </MenuItem>
                  <MenuItem value="permiso">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PermisoIcon fontSize="small" sx={{ color: '#ff9800' }} />
                      Permiso
                    </Box>
                  </MenuItem>
                  <MenuItem value="incapacidad">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IncapacidadIcon fontSize="small" sx={{ color: '#f44336' }} />
                      Incapacidad
                    </Box>
                  </MenuItem>
                  <MenuItem value="compensatorio">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompensatorioIcon fontSize="small" sx={{ color: '#9c27b0' }} />
                      Día Compensatorio
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Empleado */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={formSolicitud.empleadoId}
                  label="Empleado"
                  onChange={(e) => {
                    const emp = empleados.find(emp => emp.id === e.target.value);
                    setFormSolicitud({
                      ...formSolicitud,
                      empleadoId: e.target.value,
                      empleadoNombre: emp?.nombre || ''
                    });
                  }}
                >
                  {empleados.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        {emp.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Fechas */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Inicio"
                value={formSolicitud.fechaInicio}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Fin"
                value={formSolicitud.fechaFin}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, fechaFin: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Días Calculados */}
            <Grid item xs={12}>
              <Alert
                severity="info"
                icon={<InfoIcon />}
                sx={{ 
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.info.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="body2">
                  <strong>Días solicitados:</strong> {formSolicitud.dias} día{formSolicitud.dias !== 1 ? 's' : ''}
                </Typography>
              </Alert>
            </Grid>

            {/* Motivo */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motivo (opcional)"
                value={formSolicitud.motivo}
                onChange={(e) => setFormSolicitud({ ...formSolicitud, motivo: e.target.value })}
                placeholder="Describe el motivo de la solicitud..."
              />
            </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, gap: 1.5 }}>
          <Button onClick={handleCloseModal} variant="outlined" color="secondary">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCrearSolicitud}
            startIcon={<CheckIcon />}
            sx={{
              backgroundColor: theme.palette.success.main,
              color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              '&:hover': {
                backgroundColor: theme.palette.success.dark,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            Crear Solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default SolicitudesRRHH;
