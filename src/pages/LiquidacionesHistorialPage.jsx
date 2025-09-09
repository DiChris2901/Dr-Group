import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Delete,
  Add,
  GetApp,
  DateRange,
  Business,
  Assessment,
  Receipt,
  Timeline,
  MoreVert,
  CloudDownload,
  Archive,
  Restore
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

const LiquidacionesHistorialPage = () => {
  const theme = useTheme();
  const { currentUser, firestoreProfile } = useAuth();
  const { addNotification } = useNotifications();

  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterEmpresa, setFilterEmpresa] = useState('todas');
  const [filterDateStart, setFilterDateStart] = useState(null);
  const [filterDateEnd, setFilterDateEnd] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados de UI
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Datos de ejemplo para el histórico
  const [mockData] = useState([
    {
      id: 1,
      fecha: new Date('2024-01-15'),
      empresa: 'Casino Golden Palace',
      archivo: 'liquidacion_enero_2024.xlsx',
      totalMaquinas: 45,
      totalProduccion: 125000000,
      totalImpuestos: 15000000,
      establecimientos: 3,
      estado: 'completado',
      procesadoPor: 'admin@drgroup.com',
      notas: 'Liquidación mensual enero 2024'
    },
    {
      id: 2,
      fecha: new Date('2024-02-15'),
      empresa: 'Slots Paradise',
      archivo: 'liquidacion_febrero_2024.xlsx',
      totalMaquinas: 32,
      totalProduccion: 89000000,
      totalImpuestos: 10680000,
      establecimientos: 2,
      estado: 'completado',
      procesadoPor: 'usuario@drgroup.com',
      notas: 'Liquidación febrero con algunas novedades'
    },
    {
      id: 3,
      fecha: new Date('2024-03-01'),
      empresa: 'Lucky Stars Casino',
      archivo: 'liquidacion_marzo_2024.xlsx',
      totalMaquinas: 67,
      totalProduccion: 234000000,
      totalImpuestos: 28080000,
      establecimientos: 5,
      estado: 'procesando',
      procesadoPor: 'admin@drgroup.com',
      notas: 'Liquidación en proceso - marzo 2024'
    },
    {
      id: 4,
      fecha: new Date('2024-03-15'),
      empresa: 'Casino Golden Palace',
      archivo: 'liquidacion_marzo_adicional.xlsx',
      totalMaquinas: 12,
      totalProduccion: 45000000,
      totalImpuestos: 5400000,
      establecimientos: 1,
      estado: 'error',
      procesadoPor: 'usuario@drgroup.com',
      notas: 'Error en validación de datos'
    },
    {
      id: 5,
      fecha: new Date('2024-04-01'),
      empresa: 'Mega Casino Resort',
      archivo: 'liquidacion_abril_2024.xlsx',
      totalMaquinas: 156,
      totalProduccion: 567000000,
      totalImpuestos: 68040000,
      establecimientos: 8,
      estado: 'completado',
      procesadoPor: 'admin@drgroup.com',
      notas: 'Liquidación abril - récord de producción'
    }
  ]);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      // Aquí cargarías desde Firestore
      // const snapshot = await getDocs(collection(db, 'liquidaciones'));
      // const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // setLiquidaciones(data);
      
      // Por ahora usamos datos mock
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carga
      setLiquidaciones(mockData);
    } catch (error) {
      console.error('Error cargando historial:', error);
      addNotification('Error cargando historial de liquidaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar liquidaciones
  const liquidacionesFiltradas = liquidaciones.filter(liquidacion => {
    const matchesSearch = liquidacion.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         liquidacion.archivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         liquidacion.procesadoPor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'todos' || liquidacion.estado === filterStatus;
    const matchesEmpresa = filterEmpresa === 'todas' || liquidacion.empresa === filterEmpresa;
    
    const matchesDateRange = (!filterDateStart || liquidacion.fecha >= filterDateStart) &&
                            (!filterDateEnd || liquidacion.fecha <= filterDateEnd);
    
    return matchesSearch && matchesStatus && matchesEmpresa && matchesDateRange;
  });

  // Paginación
  const totalPages = Math.ceil(liquidacionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const liquidacionesPaginadas = liquidacionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Obtener empresas únicas para el filtro
  const empresasUnicas = [...new Set(liquidaciones.map(l => l.empresa))];

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Obtener color del estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'completado': return 'success';
      case 'procesando': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'completado': return '✅';
      case 'procesando': return '⏳';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  // Manejar menú de acciones
  const handleMenuClick = (event, liquidacion) => {
    setAnchorEl(event.currentTarget);
    setSelectedLiquidacion(liquidacion);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLiquidacion(null);
  };

  // Ver detalle
  const verDetalle = () => {
    setShowDetailDialog(true);
    handleMenuClose();
  };

  // Descargar liquidación
  const descargarLiquidacion = () => {
    addNotification(`Descargando ${selectedLiquidacion?.archivo}...`, 'info');
    // Aquí implementarías la descarga real
    handleMenuClose();
  };

  // Eliminar liquidación
  const eliminarLiquidacion = () => {
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const confirmarEliminacion = () => {
    setLiquidaciones(prev => prev.filter(l => l.id !== selectedLiquidacion.id));
    addNotification('Liquidación eliminada correctamente', 'success');
    setShowDeleteDialog(false);
    setSelectedLiquidacion(null);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setFilterEmpresa('todas');
    setFilterDateStart(null);
    setFilterDateEnd(null);
    setCurrentPage(1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          p: 3,
          mb: 3,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            📊 Histórico de Liquidaciones
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Consulta y gestiona el historial completo de liquidaciones procesadas
          </Typography>
        </Box>
      </motion.div>

      {/* Panel de Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            🔍 Filtros de Búsqueda
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            {/* Búsqueda por texto */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar empresa, archivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Filtro por estado */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterStatus}
                  label="Estado"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="completado">Completado</MenuItem>
                  <MenuItem value="procesando">Procesando</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Filtro por empresa */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={filterEmpresa}
                  label="Empresa"
                  onChange={(e) => setFilterEmpresa(e.target.value)}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  {empresasUnicas.map(empresa => (
                    <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Filtro por fecha inicio */}
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <MuiDatePicker
                  label="Fecha Inicio"
                  value={filterDateStart}
                  onChange={(newValue) => setFilterDateStart(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Filtro por fecha fin */}
            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <MuiDatePicker
                  label="Fecha Fin"
                  value={filterDateEnd}
                  onChange={(newValue) => setFilterDateEnd(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Botón limpiar filtros */}
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={limpiarFiltros}
                sx={{ height: 56 }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: theme.palette.primary.main, color: 'white' }}>
            <Receipt sx={{ fontSize: 30, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {liquidaciones.length}
            </Typography>
            <Typography variant="body2">
              Total Liquidaciones
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#4caf50', color: 'white' }}>
            <Assessment sx={{ fontSize: 30, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {liquidaciones.filter(l => l.estado === 'completado').length}
            </Typography>
            <Typography variant="body2">
              Completadas
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#ff9800', color: 'white' }}>
            <Timeline sx={{ fontSize: 30, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {liquidaciones.filter(l => l.estado === 'procesando').length}
            </Typography>
            <Typography variant="body2">
              En Proceso
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f44336', color: 'white' }}>
            <Business sx={{ fontSize: 30, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {empresasUnicas.length}
            </Typography>
            <Typography variant="body2">
              Empresas Activas
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Liquidaciones */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 Liquidaciones ({liquidacionesFiltradas.length})
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<Download />}
                sx={{ mr: 1 }}
              >
                Exportar Todo
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                href="/liquidaciones"
              >
                Nueva Liquidación
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Cargando historial...</Typography>
            </Box>
          ) : liquidacionesPaginadas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Receipt sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No se encontraron liquidaciones
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {liquidacionesFiltradas.length === 0 && liquidaciones.length > 0 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza procesando tu primera liquidación'
                }
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Empresa</strong></TableCell>
                      <TableCell><strong>Archivo</strong></TableCell>
                      <TableCell><strong>Máquinas</strong></TableCell>
                      <TableCell><strong>Producción</strong></TableCell>
                      <TableCell><strong>Total Impuestos</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell><strong>Procesado por</strong></TableCell>
                      <TableCell><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {liquidacionesPaginadas.map((liquidacion) => (
                      <TableRow key={liquidacion.id} hover>
                        <TableCell>
                          {liquidacion.fecha.toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Business sx={{ mr: 1, fontSize: 16 }} />
                            {liquidacion.empresa}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {liquidacion.archivo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${liquidacion.totalMaquinas} máquinas`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(liquidacion.totalProduccion)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            {formatCurrency(liquidacion.totalImpuestos)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${getStatusIcon(liquidacion.estado)} ${liquidacion.estado}`}
                            color={getStatusColor(liquidacion.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {liquidacion.procesadoPor}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, liquidacion)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Menú de Acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={verDetalle}>
          <Visibility sx={{ mr: 1 }} /> Ver Detalle
        </MenuItem>
        <MenuItem onClick={descargarLiquidacion}>
          <CloudDownload sx={{ mr: 1 }} /> Descargar
        </MenuItem>
        <MenuItem onClick={eliminarLiquidacion} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>

      {/* Dialog Detalle */}
      <Dialog 
        open={showDetailDialog} 
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📋 Detalle de Liquidación - {selectedLiquidacion?.empresa}
        </DialogTitle>
        <DialogContent>
          {selectedLiquidacion && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Fecha de Procesamiento</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedLiquidacion.fecha.toLocaleDateString('es-CO')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Archivo Original</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {selectedLiquidacion.archivo}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Total de Máquinas</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedLiquidacion.totalMaquinas} máquinas
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Establecimientos</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedLiquidacion.establecimientos} establecimientos
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Producción Total</Typography>
                <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                  {formatCurrency(selectedLiquidacion.totalProduccion)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Total Impuestos</Typography>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  {formatCurrency(selectedLiquidacion.totalImpuestos)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Procesado por</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedLiquidacion.procesadoPor}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Notas</Typography>
                <Typography variant="body1">
                  {selectedLiquidacion.notas || 'Sin notas adicionales'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<CloudDownload />}
            onClick={() => {
              descargarLiquidacion();
              setShowDetailDialog(false);
            }}
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmación Eliminación */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>
          ⚠️ Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la liquidación de <strong>{selectedLiquidacion?.empresa}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmarEliminacion}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para nueva liquidación */}
      <Fab
        color="primary"
        aria-label="Nueva liquidación"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        href="/liquidaciones"
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default LiquidacionesHistorialPage;
