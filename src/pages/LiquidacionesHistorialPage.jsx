import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Fab,
  Avatar,
  alpha
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
  Restore,
  Close
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import DateRangeFilter, { getDateRangeFromFilter } from '../components/payments/DateRangeFilter';
import { isValid } from 'date-fns';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const LiquidacionesHistorialPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser, firestoreProfile } = useAuth();
  const { addNotification } = useNotifications();

  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterEmpresa, setFilterEmpresa] = useState('todas');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados de UI
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [liquidacionToDelete, setLiquidacionToDelete] = useState(null); // Estado específico para eliminación

  // Función para cargar usuarios desde Firebase
  const cargarUsuarios = async () => {
    try {
      const usuariosQuery = query(collection(db, 'users'), orderBy('name', 'asc'));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      const usuariosData = [];
      
      usuariosSnapshot.forEach((doc) => {
        usuariosData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsuarios(usuariosData);
      console.log('👥 Usuarios cargados:', usuariosData.length);
      return usuariosData;
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      return [];
    }
  };

  // Función para obtener nombre de usuario por email o UID
  const getNombreUsuario = (emailOrUid, usuariosList = usuarios) => {
    if (!emailOrUid || !usuariosList.length) return emailOrUid?.split('@')[0] || 'Usuario desconocido';
    
    // Buscar por email primero
    let usuario = usuariosList.find(user => 
      user.email?.toLowerCase() === emailOrUid.toLowerCase()
    );
    
    // Si no se encuentra por email, buscar por UID
    if (!usuario) {
      usuario = usuariosList.find(user => user.uid === emailOrUid);
    }
    
    return usuario?.name || usuario?.displayName || emailOrUid.split('@')[0] || 'Usuario desconocido';
  };

  // Función para cargar empresas desde Firebase
  const cargarEmpresas = async () => {
    try {
      const empresasQuery = query(collection(db, 'companies'), orderBy('name', 'asc'));
      const empresasSnapshot = await getDocs(empresasQuery);
      const empresasData = [];
      
      empresasSnapshot.forEach((doc) => {
        empresasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setEmpresas(empresasData);
      console.log('🏢 Empresas cargadas:', empresasData.length);
      return empresasData;
    } catch (error) {
      console.error('Error cargando empresas:', error);
      return [];
    }
  };

  // Función para obtener información completa de empresa
  const getEmpresaCompleta = (nombreEmpresa, empresasList = empresas) => {
    if (!nombreEmpresa || !empresasList.length) return null;
    
    // Normalizar el nombre de empresa para búsqueda
    const nombreNormalizado = nombreEmpresa.toLowerCase().trim();
    
    return empresasList.find(empresa => 
      empresa.name?.toLowerCase().trim() === nombreNormalizado ||
      empresa.nit === nombreEmpresa ||
      empresa.name?.toLowerCase().includes(nombreNormalizado.split(' ')[0])
    );
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    if (!currentUser?.uid) {
      addNotification('Usuario no autenticado', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Cargando historial de liquidaciones para usuario:', currentUser.uid);
      
      // Cargar empresas y usuarios primero para obtener los logos y nombres
      const [empresasData, usuariosData] = await Promise.all([
        cargarEmpresas(),
        cargarUsuarios()
      ]);
      
      // Cargar liquidaciones desde Firebase
      const liquidacionesFirebase = await liquidacionPersistenceService.getUserLiquidaciones(
        currentUser.uid, 
        50 // Cargar hasta 50 liquidaciones
      );

      console.log('📊 Liquidaciones cargadas desde Firebase:', liquidacionesFirebase.length);

      // Mapear datos de Firebase al formato esperado por la UI
      const liquidacionesMapeadas = liquidacionesFirebase.map(liq => {
        const nombreEmpresa = liq.empresa?.nombre || liq.empresa || 'Sin Empresa';
        const empresaCompleta = getEmpresaCompleta(nombreEmpresa, empresasData);
        const nombreUsuario = getNombreUsuario(liq.userId || liq.processedBy || currentUser.email, usuariosData);
        
        return {
          id: liq.id,
          fecha: liq.fechas?.createdAt?.toDate() || new Date(liq.fechas?.fechaProcesamiento || Date.now()),
          empresa: nombreEmpresa,
          archivo: liq.archivos?.archivoOriginal?.nombre || 'archivo_liquidacion.xlsx',
          archivoTarifas: liq.archivos?.archivoTarifas?.nombre || null,
          totalMaquinas: liq.metricas?.maquinasConsolidadas || 0,
          totalProduccion: liq.metricas?.totalProduccion || 0,
          totalImpuestos: liq.metricas?.totalImpuestos || 0,
          totalDerechos: liq.metricas?.derechosExplotacion || 0,
          totalGastos: liq.metricas?.gastosAdministracion || 0,
          establecimientos: liq.metricas?.totalEstablecimientos || 0,
          estado: 'completado', // Las liquidaciones guardadas están completas
          procesadoPor: nombreUsuario,
          notas: `Liquidación ${liq.fechas?.mesLiquidacion} ${liq.fechas?.añoLiquidacion}`,
          periodo: liq.fechas?.periodoDetectadoModal || `${liq.fechas?.mesLiquidacion} ${liq.fechas?.añoLiquidacion}`,
          archivosStorage: {
            original: liq.archivos?.archivoOriginal,
            tarifas: liq.archivos?.archivoTarifas
          },
          metadatosCompletos: {
            ...liq, // Guardar metadatos completos para detalles
            empresaCompleta: empresaCompleta // Agregar información completa de empresa
          }
        };
      });

      setLiquidaciones(liquidacionesMapeadas);
      
      if (liquidacionesMapeadas.length === 0) {
        addNotification('No se encontraron liquidaciones guardadas', 'info');
      } else {
        addNotification(`${liquidacionesMapeadas.length} liquidaciones cargadas`, 'success');
      }

    } catch (error) {
      console.error('Error cargando historial:', error);
      addNotification('Error cargando historial de liquidaciones: ' + error.message, 'error');
      
      // En caso de error, usar datos mock como fallback para testing
      console.log('🔄 Usando datos mock como fallback');
      await new Promise(resolve => setTimeout(resolve, 500));
      setLiquidaciones(mockData);
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
    
    // Filtro de rango de fechas
    let matchesDateRange = true;
    if (dateRangeFilter !== 'all') {
      const dateRange = getDateRangeFromFilter(
        dateRangeFilter,
        customStartDate,
        customEndDate
      );
      
      if (dateRange && dateRange.startDate && dateRange.endDate && 
          isValid(dateRange.startDate) && isValid(dateRange.endDate)) {
        const liquidacionDate = new Date(liquidacion.fecha);
        matchesDateRange = liquidacionDate >= dateRange.startDate && liquidacionDate <= dateRange.endDate;
      }
    }
    
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

  // Cargar liquidación en el procesador
  const cargarLiquidacionEnProcesador = () => {
    if (!selectedLiquidacion) return;
    
    // Navegar a la página de liquidaciones con el ID de la liquidación a cargar
    const liquidacionId = selectedLiquidacion.id;
    addNotification(`Cargando liquidación ${selectedLiquidacion.periodo}...`, 'info');
    
    // Redirigir a la página de liquidaciones con parámetro para cargar
    navigate(`/liquidaciones?cargar=${liquidacionId}`);
    handleMenuClose();
  };

  // Ver detalle
  const verDetalle = () => {
    console.log('🔍 Abriendo modal de detalle para:', selectedLiquidacion);
    setShowDetailDialog(true);
    // NO llamar handleMenuClose() aquí para mantener selectedLiquidacion
    setAnchorEl(null); // Solo cerrar el menú, pero mantener la selección
  };

  // Cerrar modal de detalle
  const cerrarModalDetalle = () => {
    setShowDetailDialog(false);
    setSelectedLiquidacion(null); // Limpiar selección al cerrar
  };

  // Descargar liquidación
  const abrirDialogoDescarga = () => {
    console.log('🔍 Abriendo modal de descarga para:', selectedLiquidacion);
    setShowDownloadDialog(true);
    setAnchorEl(null); // Solo cerrar el menú, pero mantener la selección
  };

  // Cerrar modal de descarga
  const cerrarModalDescarga = () => {
    setShowDownloadDialog(false);
    setSelectedLiquidacion(null); // Limpiar selección al cerrar
  };

  const descargarLiquidacion = () => {
    abrirDialogoDescarga();
  };

  const descargarArchivoEspecifico = async (tipoArchivo) => {
    const archivoInfo = tipoArchivo === 'original' 
      ? selectedLiquidacion?.archivosStorage?.original 
      : selectedLiquidacion?.archivosStorage?.tarifas;
      
    const nombreArchivo = tipoArchivo === 'original' 
      ? selectedLiquidacion?.archivo 
      : selectedLiquidacion?.archivoTarifas;

    if (!archivoInfo) {
      addNotification(`No hay archivo ${tipoArchivo} disponible para descargar`, 'warning');
      return;
    }

    try {
      addNotification(`Descargando ${nombreArchivo}...`, 'info');
      
      let filePath = archivoInfo.path;
      const fileUrl = archivoInfo.url;
      
      if (!filePath || filePath.trim() === '') {
        if (fileUrl) {
          const match = fileUrl.match(/\/o\/(.+?)\?/);
          if (match) {
            filePath = decodeURIComponent(match[1]);
          }
        }
      }
      
      if (!filePath || filePath.trim() === '') {
        throw new Error(`No se pudo determinar la ruta del archivo ${tipoArchivo}`);
      }
      
      const fileRef = ref(storage, filePath);
      const downloadUrl = await getDownloadURL(fileRef);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = nombreArchivo;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      addNotification(`Archivo ${tipoArchivo} descargado correctamente`, 'success');
      
    } catch (error) {
      console.error(`Error descargando archivo ${tipoArchivo}:`, error);
      addNotification(`Error al descargar archivo ${tipoArchivo}: ` + error.message, 'error');
    }
  };

  const descargarTodosLosArchivos = async () => {
    const archivosDisponibles = [];
    
    if (selectedLiquidacion?.archivosStorage?.original) {
      archivosDisponibles.push('original');
    }
    
    if (selectedLiquidacion?.archivosStorage?.tarifas) {
      archivosDisponibles.push('tarifas');
    }
    
    if (archivosDisponibles.length === 0) {
      addNotification('No hay archivos disponibles para descargar', 'warning');
      return;
    }
    
    addNotification(`Descargando ${archivosDisponibles.length} archivo(s)...`, 'info');
    
    for (let i = 0; i < archivosDisponibles.length; i++) {
      await descargarArchivoEspecifico(archivosDisponibles[i]);
      if (i < archivosDisponibles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    cerrarModalDescarga();
  };
  const eliminarLiquidacion = () => {
    setLiquidacionToDelete(selectedLiquidacion); // Guardar en estado específico
    setShowDeleteDialog(true);
    handleMenuClose();
  };

  const confirmarEliminacion = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🗑️ CLICK DETECTADO - Iniciando eliminación...');
    console.log('📋 Estado selectedLiquidacion:', selectedLiquidacion);
    console.log('📋 Estado liquidacionToDelete:', liquidacionToDelete);
    
    if (!liquidacionToDelete) {
      console.log('❌ No hay liquidación para eliminar en liquidacionToDelete');
      addNotification('No hay liquidación seleccionada', 'error');
      return;
    }
    
    if (!currentUser?.uid) {
      console.log('❌ No hay usuario autenticado');
      addNotification('Usuario no autenticado', 'error');
      return;
    }
    
    try {
      console.log('🔄 Eliminando liquidación:', liquidacionToDelete.id, 'para usuario:', currentUser.uid);
      
      await liquidacionPersistenceService.deleteLiquidacion(
        liquidacionToDelete.id, 
        currentUser.uid
      );
      
      console.log('✅ Liquidación eliminada exitosamente');
      
      // Actualizar la lista local
      setLiquidaciones(prev => prev.filter(l => l.id !== liquidacionToDelete.id));
      addNotification('Liquidación eliminada correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error eliminando liquidación:', error);
      addNotification('Error al eliminar liquidación: ' + error.message, 'error');
    } finally {
      console.log('🔄 Cerrando modal y limpiando selección');
      setShowDeleteDialog(false);
      setSelectedLiquidacion(null);
      setLiquidacionToDelete(null); // Limpiar estado específico
    }
  };

  // Detectar si hay filtros activos
  const hasActiveFilters = searchTerm || 
    filterStatus !== 'todos' || 
    filterEmpresa !== 'todas' || 
    dateRangeFilter !== 'all';

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setFilterEmpresa('todas');
    setDateRangeFilter('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setCurrentPage(1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Sobrio Simplificado */}
      <Paper sx={{
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        mb: 3
      }}>
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{
            fontWeight: 600, 
            fontSize: '0.7rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 1.2
          }}>
            LIQUIDACIONES • GESTIÓN
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            📊 Histórico de Liquidaciones
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Consulta y gestiona el historial completo de liquidaciones procesadas
          </Typography>
        </Box>
      </Paper>

      {/* Panel de Filtros Premium */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          borderRadius: 1,
          p: 3,
          mb: 4,
          position: 'relative',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.8)
          }
        }}
      >
        <Box>
          {/* Header Premium */}
          <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
            <Box display="flex" alignItems="center">
              <FilterList 
                sx={{ 
                  mr: 2, 
                  color: 'primary.main',
                  fontSize: 28
                }} 
              />
              <Box>
                <Typography 
                  variant="h5" 
                  color="primary.main"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Filtros de Liquidaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refina tu búsqueda de liquidaciones históricas
                </Typography>
              </Box>
            </Box>
            
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Close />}
                  onClick={limpiarFiltros}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  Limpiar Filtros
                </Button>
              </motion.div>
            )}
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            {/* Búsqueda por texto */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar liquidaciones"
                placeholder="Empresa, archivo, usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Filtro por estado */}
            <Grid item xs={12} md={2}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
              >
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterStatus}
                  label="Estado"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="todos">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Assessment sx={{ mr: 1, color: 'text.secondary' }} />
                      Todos los estados
                    </Box>
                  </MenuItem>
                  <MenuItem value="completado">Completado</MenuItem>
                  <MenuItem value="procesando">Procesando</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Filtro por empresa */}
            <Grid item xs={12} md={2}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
              >
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={filterEmpresa}
                  label="Empresa"
                  onChange={(e) => setFilterEmpresa(e.target.value)}
                >
                  <MenuItem value="todas">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Business sx={{ mr: 1, color: 'text.secondary' }} />
                      Todas las empresas
                    </Box>
                  </MenuItem>
                  {empresasUnicas.map(empresa => (
                    <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Filtro por período */}
            <Grid item xs={12} md={3}>
              <DateRangeFilter
                value={dateRangeFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onChange={setDateRangeFilter}
                onCustomRangeChange={(startDate, endDate) => {
                  setCustomStartDate(startDate);
                  setCustomEndDate(endDate);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Estadísticas rápidas - Sistema de Diseño Sobrio */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <Receipt sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              mb: 0.5
            }}>
              {liquidaciones.length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Total Liquidaciones
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.success.main, 0.8)
            }
          }}>
            <Assessment sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.success.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.success.main,
              mb: 0.5
            }}>
              {liquidaciones.filter(l => l.estado === 'completado').length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Completadas
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.warning.main, 0.8)
            }
          }}>
            <Timeline sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.warning.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.warning.main,
              mb: 0.5
            }}>
              {liquidaciones.filter(l => l.estado === 'procesando').length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              En Proceso
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 3, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderColor: alpha(theme.palette.error.main, 0.8)
            }
          }}>
            <Business sx={{ 
              fontSize: 32, 
              mb: 1.5, 
              color: theme.palette.error.main,
              opacity: 0.8
            }} />
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: theme.palette.error.main,
              mb: 0.5
            }}>
              {empresasUnicas.length}
            </Typography>
            <Typography variant="body2" sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}>
              Empresas Activas
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Liquidaciones Sobrio */}
      <Card sx={{ 
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        '&:hover': {
          borderColor: alpha(theme.palette.success.main, 0.8),
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        },
        transition: 'all 0.2s ease'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Assessment sx={{ fontSize: 20, color: 'success.main' }} />
              Liquidaciones ({liquidacionesFiltradas.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                sx={{ 
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Exportar Todo
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                href="/liquidaciones"
                sx={{ 
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600
                }}
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
            <Box sx={{ p: 3 }}>
              <TableContainer component={Paper} sx={{ 
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Período</TableCell>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Empresa</TableCell>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Archivo</TableCell>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Máquinas</TableCell>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Producción</TableCell>
                      <TableCell sx={{ fontWeight: 600, borderBottom: `2px solid ${theme.palette.divider}` }}>Total Impuestos</TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
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
                            <DateRange sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {liquidacion.periodo || 'No detectado'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Business sx={{ mr: 1, fontSize: 16 }} />
                            {liquidacion.empresa}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {liquidacion.archivo}
                            </Typography>
                            {liquidacion.archivoTarifas && (
                              <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                                + {liquidacion.archivoTarifas}
                              </Typography>
                            )}
                          </Box>
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
            </Box>
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
        <MenuItem onClick={cargarLiquidacionEnProcesador}>
          <Restore sx={{ mr: 1 }} /> Cargar para Procesar
        </MenuItem>
        <MenuItem onClick={descargarLiquidacion}>
          <CloudDownload sx={{ mr: 1 }} /> Descargar
        </MenuItem>
        <MenuItem onClick={eliminarLiquidacion} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>

      {/* Dialog Detalle - Sistema de Diseño Empresarial */}
      <Dialog 
        open={showDetailDialog} 
        onClose={cerrarModalDetalle}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{
          p: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              width: 40,
              height: 40
            }}>
              <Visibility />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Detalle de Liquidación
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={cerrarModalDetalle}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main'
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          {selectedLiquidacion ? (
            <Box sx={{ mt: 2 }}>
              {/* Header de la liquidación */}
              <Paper sx={{
                p: 3,
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {/* Avatar con logo real de la empresa o inicial */}
                  {selectedLiquidacion.metadatosCompletos?.empresaCompleta?.logoURL ? (
                    <Avatar
                      src={selectedLiquidacion.metadatosCompletos.empresaCompleta.logoURL}
                      alt={`Logo de ${selectedLiquidacion.empresa}`}
                      sx={{
                        width: 56,
                        height: 56,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      width: 56,
                      height: 56,
                      fontSize: '1.5rem',
                      fontWeight: 700
                    }}>
                      {(selectedLiquidacion.empresa || 'SE').charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: 'primary.main',
                      mb: 0,
                      fontSize: '1.75rem'
                    }}>
                      {selectedLiquidacion.empresa || 'Sin Empresa'}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h5" sx={{ 
                  fontWeight: 700,
                  mb: 2
                }}>
                  Periodo liquidado: {selectedLiquidacion.periodo || selectedLiquidacion.metadatosCompletos?.fechas?.periodoDetectadoModal || 'Periodo no detectado'}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Procesado el {selectedLiquidacion.fecha?.toLocaleDateString?.('es-CO') || 
                                selectedLiquidacion.metadatosCompletos?.fechas?.createdAt?.toDate()?.toLocaleDateString?.('es-CO') || 
                                'Fecha no disponible'} por {selectedLiquidacion.procesadoPor || 'Usuario desconocido'}
                </Typography>
              </Paper>

              {/* Métricas principales - Primera fila */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.warning.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Establecimientos
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'warning.main' 
                    }}>
                      {selectedLiquidacion.establecimientos || 
                       selectedLiquidacion.metadatosCompletos?.metricas?.totalEstablecimientos || 
                       0}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.info.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Total Máquinas
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'info.main' 
                    }}>
                      {selectedLiquidacion.totalMaquinas || 
                       selectedLiquidacion.metadatosCompletos?.metricas?.maquinasConsolidadas || 
                       0}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.success.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Producción Total
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'success.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalProduccion || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.totalProduccion || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Segunda fila */}
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Derechos de Explotación
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'secondary.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalDerechos || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.derechosExplotacion || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.error.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Gastos de Administración
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'error.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalGastos || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.gastosAdministracion || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Tercera fila - Total Impuestos centrado */}
              <Grid container spacing={3} sx={{ mt: 2 }} justifyContent="center">
                <Grid item xs={12} sm={8} md={6}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }}>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Total Impuestos
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main' 
                    }}>
                      {formatCurrency(
                        selectedLiquidacion.totalImpuestos || 
                        selectedLiquidacion.metadatosCompletos?.metricas?.totalImpuestos || 
                        0
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No hay datos de liquidación
              </Typography>
              <Typography variant="body2" color="textSecondary">
                No se pudo cargar la información de la liquidación seleccionada
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={cerrarModalDetalle}
            variant="contained"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 120
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmación Eliminación - Sistema de Diseño Empresarial */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{
          p: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: 'error.main',
            width: 40,
            height: 40
          }}>
            <Delete />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Confirmar Eliminación
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Box sx={{ mt: 3 }}>
            <Paper sx={{
              p: 3,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
              backgroundColor: alpha(theme.palette.warning.main, 0.05)
            }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ¿Está seguro que desea eliminar la liquidación de{' '}
                <Typography component="span" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {liquidacionToDelete?.empresa}
                </Typography>
                ?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Se eliminarán permanentemente:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <Typography component="li" variant="body2" color="textSecondary">
                  • Todos los archivos originales en Storage
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  • Metadatos y métricas en Firestore
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  • Historial de procesamiento
                </Typography>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => {
              setShowDeleteDialog(false);
              setLiquidacionToDelete(null);
            }}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={(e) => {
              console.log('🖱️ CLICK EN BOTÓN ELIMINAR DETECTADO!');
              confirmarEliminacion(e);
            }}
            color="error"
            variant="contained"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Eliminar Permanentemente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Descarga de Archivos - Sistema de Diseño Empresarial */}
      <Dialog
        open={showDownloadDialog}
        onClose={cerrarModalDescarga}
        maxWidth="sm"
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
          p: 3,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            width: 40,
            height: 40
          }}>
            <CloudDownload />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Descargar Archivos
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Selecciona qué archivos descargar
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, pt: 3 }}>
          {selectedLiquidacion && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Archivos disponibles para{' '}
                <Typography component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {selectedLiquidacion.empresa}
                </Typography>
                {' - '}{selectedLiquidacion.periodo}:
              </Typography>
              
              <Grid container spacing={2}>
                {/* Archivo Original */}
                {selectedLiquidacion.archivosStorage?.original && (
                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          width: 32,
                          height: 32
                        }}>
                          📊
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Archivo Original
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedLiquidacion.archivo}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => {
                          descargarArchivoEspecifico('original');
                          cerrarModalDescarga();
                        }}
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Descargar
                      </Button>
                    </Paper>
                  </Grid>
                )}
                
                {/* Archivo de Tarifas */}
                {selectedLiquidacion.archivosStorage?.tarifas && (
                  <Grid item xs={12}>
                    <Paper sx={{
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'secondary.main',
                          width: 32,
                          height: 32
                        }}>
                          💰
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Archivo de Tarifas
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedLiquidacion.archivoTarifas}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => {
                          descargarArchivoEspecifico('tarifas');
                          cerrarModalDescarga();
                        }}
                        sx={{ 
                          borderRadius: 1,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Descargar
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
              
              {/* Información adicional */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  💡 Los archivos se descargarán directamente desde Firebase Storage
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={cerrarModalDescarga}
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          
          {/* Botón para descargar todos si hay múltiples archivos */}
          {selectedLiquidacion?.archivosStorage?.original && selectedLiquidacion?.archivosStorage?.tarifas && (
            <Button 
              onClick={descargarTodosLosArchivos}
              variant="contained"
              startIcon={<GetApp />}
              sx={{ 
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Descargar Todos
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* FAB para nueva liquidación - Sistema de Diseño Sobrio */}
      <Fab
        color="primary"
        aria-label="Nueva liquidación"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease'
        }}
        href="/liquidaciones"
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default LiquidacionesHistorialPage;
