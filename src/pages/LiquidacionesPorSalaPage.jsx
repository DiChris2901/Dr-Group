import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
  Badge
} from '@mui/material';
import {
  Business as BusinessIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PdfIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const LiquidacionesPorSalaPage = () => {
  // Estados principales
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    empresa: '',
    periodo: '',
    sala: '',
    estado: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  // Estados de UI
  const [dialogDetalles, setDialogDetalles] = useState({ open: false, liquidacion: null });
  const [dialogFacturacion, setDialogFacturacion] = useState({ open: false, liquidacion: null });

  // Contextos
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();

  // Listener en tiempo real para actualizaciones automáticas
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);

    // Crear query base para liquidaciones por sala
    const liquidacionesQuery = query(
      collection(db, 'liquidaciones_por_sala'),
      where('userId', '==', currentUser.uid)
    );

    // Listener en tiempo real
    const unsubscribe = onSnapshot(
      liquidacionesQuery,
      async (snapshot) => {
        try {
          // Procesar datos del snapshot
          const liquidacionesRealTime = [];
          snapshot.forEach((doc) => {
            liquidacionesRealTime.push({
              id: doc.id,
              ...doc.data()
            });
          });

          console.log(`📡 Datos en tiempo real: ${liquidacionesRealTime.length} liquidaciones`);
          console.log('🔍 Usuario actual:', currentUser?.uid);
          console.log('🔍 Filtros aplicados:', filtrosAplicados);
          
          if (liquidacionesRealTime.length > 0) {
            console.log('🔍 Primera liquidación encontrada:', liquidacionesRealTime[0]);
          }

          // Aplicar filtros localmente si existen
          let liquidacionesFiltradas = liquidacionesRealTime;
          
          // Verificar si hay filtros con valores válidos (no vacíos)
          const hayFiltrosValidos = filtrosAplicados && Object.values(filtrosAplicados).some(f => f && f.trim && f.trim());
          
          if (hayFiltrosValidos) {
            console.log('🔧 Aplicando filtros localmente...');
            liquidacionesFiltradas = liquidacionesRealTime.filter(liquidacion => {
              const pasaEmpresa = !filtrosAplicados.empresa || !filtrosAplicados.empresa.trim() || liquidacion.empresa.nombre === filtrosAplicados.empresa;
              const pasaPeriodo = !filtrosAplicados.periodo || !filtrosAplicados.periodo.trim() || liquidacion.fechas.periodoLiquidacion === filtrosAplicados.periodo;
              const pasaSala = !filtrosAplicados.sala || !filtrosAplicados.sala.trim() || liquidacion.sala.nombre === filtrosAplicados.sala;
              const pasaEstado = !filtrosAplicados.estado || !filtrosAplicados.estado.trim() || filtrosAplicados.estado === 'todos' || liquidacion.facturacion.estado === filtrosAplicados.estado;
              
              console.log(`🔍 Liquidación ${liquidacion.sala.nombre}: empresa=${pasaEmpresa}, periodo=${pasaPeriodo}, sala=${pasaSala}, estado=${pasaEstado}`);
              
              return pasaEmpresa && pasaPeriodo && pasaSala && pasaEstado;
            });
            console.log(`📊 Después de filtros: ${liquidacionesFiltradas.length} de ${liquidacionesRealTime.length}`);
          } else {
            console.log('✅ Sin filtros válidos aplicados, mostrando todas');
          }

          setLiquidaciones(liquidacionesFiltradas);

          // Calcular estadísticas en tiempo real
          const estadisticasRealTime = calcularEstadisticasLocalmente(liquidacionesFiltradas);
          setEstadisticas(estadisticasRealTime);

          setLoading(false);
          setError(null);

        } catch (error) {
          console.error('Error procesando datos en tiempo real:', error);
          setError(error.message);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error en listener de Firebase:', error);
        setError('Error conectando con la base de datos');
        setLoading(false);
        addNotification('Error de conexión con Firebase', 'error');
      }
    );

    // Cleanup function
    return () => {
      console.log('🔌 Desconectando listener de Firebase');
      unsubscribe();
    };
  }, [currentUser?.uid, filtrosAplicados]);

  // Función de carga manual (backup para casos especiales)
  const cargarDatos = async () => {
    try {
      console.log('🔄 Recarga manual de datos...');
      // El listener en tiempo real se encargará de actualizar automáticamente
      // Esta función se mantiene para compatibilidad
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
      addNotification('Error al cargar liquidaciones por sala', 'error');
    }
  };

  // Estado para datos detallados de máquinas
  const [datosMaquinasSala, setDatosMaquinasSala] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // Cargar datos detallados de las máquinas de una sala específica
  const cargarDetallesSala = async (liquidacionSala) => {
    try {
      setCargandoDetalles(true);
      console.log('🔍 Cargando detalles para sala:', liquidacionSala.sala.nombre);
      
      // Obtener la liquidación original completa
      const liquidacionOriginal = await liquidacionPersistenceService.getLiquidacionById(
        liquidacionSala.liquidacionOriginalId
      );
      
      if (liquidacionOriginal && liquidacionOriginal.datos && liquidacionOriginal.datos.consolidatedData) {
        // Filtrar solo las máquinas de esta sala
        const maquinasDeLaSala = liquidacionOriginal.datos.consolidatedData.filter(
          maquina => maquina.establecimiento === liquidacionSala.sala.nombre
        );
        
        console.log(`📊 Encontradas ${maquinasDeLaSala.length} máquinas para la sala ${liquidacionSala.sala.nombre}`);
        setDatosMaquinasSala(maquinasDeLaSala);
        
      } else {
        console.warn('No se encontraron datos consolidados en la liquidación original');
        setDatosMaquinasSala([]);
        addNotification('No se pudieron cargar los detalles de las máquinas', 'warning');
      }
      
    } catch (error) {
      console.error('Error cargando detalles de sala:', error);
      setDatosMaquinasSala([]);
      addNotification('Error al cargar detalles de la sala', 'error');
    } finally {
      setCargandoDetalles(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    setFiltros({ empresa: '', periodo: '', sala: '', estado: '' });
    setFiltrosAplicados({});
  };

  // Calcular estadísticas localmente
  const calcularEstadisticasLocalmente = (liquidacionesData) => {
    const estadisticas = {
      totalLiquidaciones: liquidacionesData.length,
      porEstado: {
        pendiente: 0,
        generada: 0,
        enviada: 0,
        pagada: 0
      },
      montos: {
        totalProduccion: 0,
        totalDerechos: 0,
        totalGastos: 0,
        totalImpuestos: 0
      },
      salas: new Set(),
      empresas: new Set(),
      periodos: new Set()
    };

    liquidacionesData.forEach(liq => {
      // Contar por estado
      if (liq.facturacion?.estado) {
        estadisticas.porEstado[liq.facturacion.estado]++;
      }
      
      // Sumar montos
      if (liq.metricas) {
        estadisticas.montos.totalProduccion += liq.metricas.totalProduccion || 0;
        estadisticas.montos.totalDerechos += liq.metricas.derechosExplotacion || 0;
        estadisticas.montos.totalGastos += liq.metricas.gastosAdministracion || 0;
        estadisticas.montos.totalImpuestos += (liq.metricas.derechosExplotacion || 0) + (liq.metricas.gastosAdministracion || 0);
      }
      
      // Agregar a conjuntos únicos
      if (liq.sala?.nombre) estadisticas.salas.add(liq.sala.nombre);
      if (liq.empresa?.nombre) estadisticas.empresas.add(liq.empresa.nombre);
      if (liq.fechas?.periodoLiquidacion) estadisticas.periodos.add(liq.fechas.periodoLiquidacion);
    });

    // Convertir Sets a arrays
    estadisticas.salas = Array.from(estadisticas.salas);
    estadisticas.empresas = Array.from(estadisticas.empresas);
    estadisticas.periodos = Array.from(estadisticas.periodos);

    return estadisticas;
  };



  // Obtener opciones únicas para filtros
  const opcionesFiltros = useMemo(() => {
    return {
      empresas: [...new Set(liquidaciones.map(l => l.empresa.nombre))].sort(),
      periodos: [...new Set(liquidaciones.map(l => l.fechas.periodoLiquidacion))].sort().reverse(),
      salas: [...new Set(liquidaciones.map(l => l.sala.nombre))].sort(),
      estados: ['pendiente', 'generada', 'enviada', 'pagada']
    };
  }, [liquidaciones]);

  // Funciones de manejo de estados
  const actualizarEstadoFacturacion = async (salaId, nuevoEstado, datosAdicionales = {}) => {
    try {
      const datosFacturacion = {
        estado: nuevoEstado,
        ...datosAdicionales,
        [`fecha${nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1)}`]: new Date().toISOString()
      };

      await liquidacionPersistenceService.actualizarEstadoFacturacion(salaId, datosFacturacion);
      if (addNotification && typeof addNotification === 'function') {
        addNotification(`Estado actualizado a: ${nuevoEstado}`, 'success');
      }
      cargarDatos(); // Recargar datos

    } catch (error) {
      console.error('Error actualizando estado:', error);
      if (addNotification && typeof addNotification === 'function') {
        addNotification('Error al actualizar estado', 'error');
      }
    }
  };

  // Obtener color del chip según estado
  const getChipColor = (estado) => {
    const colores = {
      pendiente: 'warning',
      generada: 'info',
      enviada: 'primary',
      pagada: 'success'
    };
    return colores[estado] || 'default';
  };

  // Formatear montos
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto || 0);
  };

  // Componente de estadísticas
  const EstadisticasResumen = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <StoreIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{estadisticas?.total || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Liquidaciones
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <PaymentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{estadisticas?.porEstado?.pagada || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Pagadas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{estadisticas?.porEstado?.pendiente || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
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
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{formatearMonto(estadisticas?.montos?.totalImpuestos)}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Impuestos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Componente de filtros
  const PanelFiltros = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filtros</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={filtros.empresa}
                label="Empresa"
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.empresas.map(empresa => (
                  <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={filtros.periodo}
                label="Período"
                onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltros.periodos.map(periodo => (
                  <MenuItem key={periodo} value={periodo}>{periodo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sala</InputLabel>
              <Select
                value={filtros.sala}
                label="Sala"
                onChange={(e) => setFiltros({ ...filtros, sala: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.salas.map(sala => (
                  <MenuItem key={sala} value={sala}>{sala}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.estado}
                label="Estado"
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltros.estados.map(estado => (
                  <MenuItem key={estado} value={estado}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button 
              variant="contained" 
              onClick={aplicarFiltros}
              fullWidth
              size="small"
            >
              Aplicar
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button 
              variant="outlined" 
              onClick={limpiarFiltros}
              fullWidth
              size="small"
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={cargarDatos}>
            Reintentar
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box p={3}>
        {/* Título y acciones */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Liquidaciones por Sala
          </Typography>
          <Box>
            <Tooltip title="Actualizar datos">
              <IconButton onClick={cargarDatos}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Estadísticas */}
        {estadisticas && <EstadisticasResumen />}

        {/* Filtros */}
        <PanelFiltros />

        {/* Botones de acción */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              try {
                console.log('🔍 DEBUG - UserId actual:', currentUser.uid);
                console.log('🔍 DEBUG - Botón Debug DB presionado');
                
                // Consultar sin filtros
                const allLiquidaciones = await liquidacionPersistenceService.getLiquidacionesPorSala(currentUser.uid, {});
                console.log('🔍 DEBUG - Total liquidaciones sin filtros:', allLiquidaciones.length);
                
                if (allLiquidaciones.length > 0) {
                  console.log('🔍 DEBUG - Primera liquidación:', allLiquidaciones[0]);
                  console.log('🔍 DEBUG - Todas las empresas:', [...new Set(allLiquidaciones.map(l => l.empresa?.nombre))]);
                  console.log('🔍 DEBUG - Todos los periodos:', [...new Set(allLiquidaciones.map(l => l.fechas?.periodoLiquidacion))]);
                  console.log('🔍 DEBUG - Todas las salas:', [...new Set(allLiquidaciones.map(l => l.sala?.nombre))]);
                }
                
                // Consultar con filtros (usando valores vacíos ya que las variables no están en scope)
                const filteredLiquidaciones = await liquidacionPersistenceService.getLiquidacionesPorSala(currentUser.uid, {});
                console.log('🔍 DEBUG - Sin filtros aplicados:', filteredLiquidaciones.length);
                
                addNotification(`DEBUG: ${allLiquidaciones.length} liquidaciones encontradas`, 'info');
              } catch (error) {
                console.error('Error en debug:', error);
                addNotification('Error en debug', 'error');
              }
            }}
          >
            Debug DB
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            onClick={async () => {
              try {
                // Consulta directa a Firebase
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('../config/firebase');
                
                console.log('🔥 Consulta DIRECTA a Firebase...');
                const q = query(
                  collection(db, 'liquidaciones_por_sala'),
                  where('userId', '==', currentUser.uid)
                );
                
                const snapshot = await getDocs(q);
                console.log('🔥 Documentos encontrados directamente:', snapshot.size);
                
                const docs = [];
                snapshot.forEach(doc => {
                  docs.push({ id: doc.id, ...doc.data() });
                });
                
                console.log('🔥 Documentos:', docs);
                if (docs.length > 0) {
                  console.log('🔍 Primer documento estructura:', docs[0]);
                  console.log('🔍 Empresas en docs:', [...new Set(docs.map(d => d.empresa?.nombre))]);
                  console.log('🔍 Períodos en docs:', [...new Set(docs.map(d => d.fechas?.periodoLiquidacion))]);
                  console.log('🔍 Salas en docs:', [...new Set(docs.map(d => d.sala?.nombre))]);
                }
                addNotification(`Consulta directa: ${snapshot.size} documentos`, snapshot.size > 0 ? 'success' : 'warning');
              } catch (error) {
                console.error('Error consulta directa:', error);
                addNotification('Error en consulta directa', 'error');
              }
            }}
          >
            Firebase Directo
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            onClick={async () => {
              if (!confirm('¿Estás seguro de eliminar todas las liquidaciones con períodos malformados (que contengan números como enero_45900)?')) {
                return;
              }
              
              try {
                console.log('🧹 Limpiando registros con períodos malformados...');
                const result = await liquidacionPersistenceService.limpiarRegistrosMalformados(currentUser.uid);
                console.log('✅ Limpieza completada:', result);
                addNotification(`Limpieza completada: ${result.eliminados} registros eliminados`, 'success');
                
                // Recargar la página para ver los cambios
                window.location.reload();
              } catch (error) {
                console.error('Error en limpieza:', error);
                addNotification('Error en limpieza de registros', 'error');
              }
            }}
          >
            Limpiar Malformados
          </Button>
          
          <Tooltip title="Actualizar datos manualmente">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main'
              }}
            >
              Actualizar
            </Button>
          </Tooltip>
        </Box>

        {/* Tabla de liquidaciones */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empresa / Sala</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell align="right">Máquinas</TableCell>
                    <TableCell align="right">Producción</TableCell>
                    <TableCell align="right">Impuestos</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {liquidaciones.map((liquidacion) => (
                      <motion.tr
                        key={liquidacion.id}
                        component={TableRow}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {liquidacion.empresa.nombre}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {liquidacion.sala.nombre}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {liquidacion.fechas.periodoLiquidacion}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Badge badgeContent={liquidacion.metricas.totalMaquinas} color="primary">
                            <StoreIcon color="action" />
                          </Badge>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatearMonto(liquidacion.metricas.totalProduccion)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            {formatearMonto(liquidacion.metricas.totalImpuestos)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip 
                            label={liquidacion.facturacion.estado.toUpperCase()}
                            color={getChipColor(liquidacion.facturacion.estado)}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Ver detalles máquina por máquina">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setDialogDetalles({ open: true, liquidacion });
                                  cargarDetallesSala(liquidacion);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Generar PDF/Factura">
                              <IconButton 
                                size="small"
                                color="primary"
                                disabled={liquidacion.facturacion.estado === 'pagada'}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Gestionar facturación">
                              <IconButton 
                                size="small"
                                color="secondary"
                                onClick={() => setDialogFacturacion({ open: true, liquidacion })}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>

            {liquidaciones.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">
                  No se encontraron liquidaciones por sala
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog de detalles máquina por máquina */}
        <Dialog 
          open={dialogDetalles.open} 
          onClose={() => {
            setDialogDetalles({ open: false, liquidacion: null });
            setDatosMaquinasSala([]);
          }}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>
            {dialogDetalles.liquidacion && (
              <Box>
                <Typography variant="h6" component="div">
                  Detalle de Liquidación - {dialogDetalles.liquidacion.sala.nombre}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {dialogDetalles.liquidacion.empresa.nombre} | {dialogDetalles.liquidacion.fechas.periodoLiquidacion}
                </Typography>
              </Box>
            )}
          </DialogTitle>
          <DialogContent>
            {dialogDetalles.liquidacion && (
              <Box>
                {/* Resumen de métricas */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="h6" color="primary">
                          {dialogDetalles.liquidacion.metricas.totalMaquinas}
                        </Typography>
                        <Typography variant="caption">Máquinas</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="h6" color="success.main">
                          {formatearMonto(dialogDetalles.liquidacion.metricas.totalProduccion)}
                        </Typography>
                        <Typography variant="caption">Producción</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="h6" color="warning.main">
                          {formatearMonto(dialogDetalles.liquidacion.metricas.derechosExplotacion)}
                        </Typography>
                        <Typography variant="caption">Derechos</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="h6" color="error.main">
                          {formatearMonto(dialogDetalles.liquidacion.metricas.gastosAdministracion)}
                        </Typography>
                        <Typography variant="caption">Gastos</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Tabla detallada de máquinas */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Detalle por Máquina
                </Typography>
                
                {cargandoDetalles ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando detalles...</Typography>
                  </Box>
                ) : datosMaquinasSala.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Serial</strong></TableCell>
                          <TableCell><strong>NUC</strong></TableCell>
                          <TableCell><strong>Tarifa</strong></TableCell>
                          <TableCell align="right"><strong>Producción</strong></TableCell>
                          <TableCell align="right"><strong>Derechos</strong></TableCell>
                          <TableCell align="right"><strong>Gastos</strong></TableCell>
                          <TableCell align="right"><strong>Total Impuestos</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {datosMaquinasSala.map((maquina, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{maquina.serial || 'N/A'}</TableCell>
                            <TableCell>{maquina.nuc || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={maquina.tarifa || 'Estándar'} 
                                size="small"
                                color={maquina.tarifa === 'Tarifa fija (valores sumados)' ? 'secondary' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="success.main" fontWeight="medium">
                                {formatearMonto(maquina.produccion)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="warning.main">
                                {formatearMonto(maquina.derechosExplotacion)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="error.main">
                                {formatearMonto(maquina.gastosAdministracion)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="bold">
                                {formatearMonto(maquina.totalImpuestos)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No se pudieron cargar los detalles de las máquinas para esta sala.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {datosMaquinasSala.length > 0 && (
              <Button 
                startIcon={<DownloadIcon />}
                onClick={() => {
                  // TODO: Implementar exportación a Excel de esta sala específica
                  addNotification('Función de exportación en desarrollo', 'info');
                }}
              >
                Exportar Excel
              </Button>
            )}
            <Button 
              onClick={() => {
                setDialogDetalles({ open: false, liquidacion: null });
                setDatosMaquinasSala([]);
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de gestión de facturación */}
        <Dialog 
          open={dialogFacturacion.open} 
          onClose={() => setDialogFacturacion({ open: false, liquidacion: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Gestionar Facturación</DialogTitle>
          <DialogContent>
            {dialogFacturacion.liquidacion && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Sala:</strong> {dialogFacturacion.liquidacion.sala.nombre}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Estado actual:</strong> {dialogFacturacion.liquidacion.facturacion.estado}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    disabled={['generada', 'enviada', 'pagada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                    onClick={() => {
                      actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'generada');
                      setDialogFacturacion({ open: false, liquidacion: null });
                    }}
                  >
                    Generar PDF/Factura
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<SendIcon />}
                    disabled={!['generada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                    onClick={() => {
                      actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'enviada');
                      setDialogFacturacion({ open: false, liquidacion: null });
                    }}
                  >
                    Marcar como Enviada
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<PaymentIcon />}
                    disabled={!['enviada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                    onClick={() => {
                      actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'pagada');
                      setDialogFacturacion({ open: false, liquidacion: null });
                    }}
                  >
                    Marcar como Pagada
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogFacturacion({ open: false, liquidacion: null })}>
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default LiquidacionesPorSalaPage;
