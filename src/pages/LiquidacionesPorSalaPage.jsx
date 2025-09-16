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
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Business as BusinessIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  Send as SendIcon,
  Payment as PaymentIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import liquidacionPersistenceService from '../services/liquidacionPersistenceService';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
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
    sala: ''
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  // Estados de UI
  const [dialogDetalles, setDialogDetalles] = useState({ open: false, liquidacion: null });
  const [dialogFacturacion, setDialogFacturacion] = useState({ open: false, liquidacion: null });
  const [dialogEdicion, setDialogEdicion] = useState({ open: false, liquidacion: null });
  const [datosEdicion, setDatosEdicion] = useState({});
  // Estado para controlar si hay cambios no guardados en la edición (deshabilita auto-guardado)
  const [edicionDirty, setEdicionDirty] = useState(false);

  // Contextos
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const theme = useTheme();

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
              
              console.log(`🔍 Liquidación ${liquidacion.sala.nombre}: empresa=${pasaEmpresa}, periodo=${pasaPeriodo}, sala=${pasaSala}`);
              
              return pasaEmpresa && pasaPeriodo && pasaSala;
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

  // Cargar datos detallados de las máquinas desde datosConsolidados
  const cargarDetallesSala = async (liquidacionSala) => {
    try {
      setCargandoDetalles(true);
      console.log('🔍 Cargando detalles para sala:', liquidacionSala.sala.nombre);
      console.log('📋 Datos de liquidación recibidos:', liquidacionSala);
      
      // Obtener el documento completo desde Firebase
      const liquidacionDoc = await getDoc(doc(db, 'liquidaciones_por_sala', liquidacionSala.id));
      
      if (!liquidacionDoc.exists()) {
        console.warn('❌ No se encontró el documento de liquidación');
        setDatosMaquinasSala([]);
        addNotification('No se encontró el documento de liquidación', 'warning');
        return;
      }

      const liquidacionData = liquidacionDoc.data();
      console.log('📄 Documento completo cargado:', liquidacionData);
      
      // Verificar si tiene datosConsolidados
      if (liquidacionData.datosConsolidados && Array.isArray(liquidacionData.datosConsolidados)) {
        const datosConsolidados = liquidacionData.datosConsolidados;
        console.log(`📊 Datos consolidados encontrados: ${datosConsolidados.length} máquinas`);
        console.log('🔧 Muestra de datos:', datosConsolidados.slice(0, 2));
        
        // Procesar los datos para la tabla
        const maquinasData = datosConsolidados.map((maquina, index) => ({
          id: index,
          serial: maquina.serial || 'N/A',
          nuc: maquina.nuc?.toString() || 'N/A',
          produccion: maquina.produccion || 0,
          derechosExplotacion: maquina.derechosExplotacion || 0,
          gastosAdministracion: maquina.gastosAdministracion || 0,
          totalImpuestos: maquina.totalImpuestos || 0
        }));
        
        console.log('✅ Datos procesados para la tabla:', maquinasData);
        setDatosMaquinasSala(maquinasData);
        
      } else {
        console.warn('❌ No se encontraron datosConsolidados en el documento');
        console.log('Estructura del documento:', Object.keys(liquidacionData));
        setDatosMaquinasSala([]);
        addNotification('No se encontraron datos consolidados de máquinas', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Error cargando detalles de sala:', error);
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
    setFiltros({ empresa: '', periodo: '', sala: '' });
    setFiltrosAplicados({});
  };

  // Funciones para edición de liquidaciones
  const abrirModalEdicion = async (liquidacion) => {
    console.log('🔧 Abriendo modal de edición para:', liquidacion);
    
    setDatosEdicion({
      sala: liquidacion.sala.nombre,
      empresa: liquidacion.empresa,
      periodo: liquidacion.periodo,
      totalProduccion: liquidacion.metricas.totalProduccion,
      derechosExplotacion: liquidacion.metricas.derechosExplotacion,
      gastosAdministracion: liquidacion.metricas.gastosAdministracion,
      totalImpuestos: liquidacion.metricas.totalImpuestos,
      numeroMaquinas: liquidacion.metricas.numeroMaquinas,
      motivoEdicion: ''
    });
    
    // Limpiar datos anteriores y abrir modal
    setDatosMaquinasSala([]);
    setDialogEdicion({ open: true, liquidacion });
    // Reiniciar estado de cambios pendientes al abrir el modal
    setEdicionDirty(false);
    
    // Cargar datos detallados de las máquinas para edición
    console.log('🔍 Iniciando carga de datos de máquinas...');
    try {
      await cargarDetallesSala(liquidacion);
      console.log('✅ Datos de máquinas cargados exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar datos de máquinas:', error);
    }
  };

  const guardarEdicionLiquidacion = async () => {
    try {
      const liquidacionOriginal = dialogEdicion.liquidacion;
      
      // Obtener totales calculados automáticamente
      const totales = calcularTotalesDesdeTabla();
      const totalProduccion = totales.totalProduccion;
      const totalDerechos = totales.totalDerechos;
      const totalGastos = totales.totalGastos;
      const totalImpuestos = totales.totalGeneral;
      
      // Crear nueva liquidación con los datos editados
      const nuevaLiquidacion = {
        ...liquidacionOriginal,
        metricas: {
          ...liquidacionOriginal.metricas,
          totalProduccion,
          derechosExplotacion: totalDerechos,
          gastosAdministracion: totalGastos,
          totalImpuestos,
          numeroMaquinas: datosMaquinasSala.length
        },
        // Actualizar datosConsolidados con los valores editados
        datosConsolidados: datosMaquinasSala.map(maq => ({
          ...maq,
          totalImpuestos: (maq.produccion || 0) + (maq.derechosExplotacion || 0) + (maq.gastosAdministracion || 0)
        })),
        // Metadatos de edición
        esEdicion: true,
        liquidacionOriginalId: liquidacionOriginal.id,
        fechaEdicion: new Date(),
        usuarioEdicion: currentUser.uid,
        motivoEdicion: datosEdicion.motivoEdicion,
        historialEdiciones: [
          ...(liquidacionOriginal.historialEdiciones || []),
          {
            fecha: new Date(),
            usuario: currentUser.uid,
            motivo: datosEdicion.motivoEdicion,
            valoresAnteriores: {
              totalProduccion: liquidacionOriginal.metricas.totalProduccion,
              derechosExplotacion: liquidacionOriginal.metricas.derechosExplotacion,
              gastosAdministracion: liquidacionOriginal.metricas.gastosAdministracion,
              totalImpuestos: liquidacionOriginal.metricas.totalImpuestos,
              numeroMaquinas: liquidacionOriginal.metricas.numeroMaquinas,
              datosConsolidados: liquidacionOriginal.datosConsolidados
            }
          }
        ]
      };

      // Guardar en Firestore como nuevo documento
      await liquidacionPersistenceService.saveLiquidacionPorSala(nuevaLiquidacion);
      
      addNotification('Liquidación editada correctamente. Se creó un nuevo registro.', 'success');
      setDialogEdicion({ open: false, liquidacion: null });
      setDatosMaquinasSala([]);
      setDatosEdicion({});
  setEdicionDirty(false);
      
    } catch (error) {
      console.error('Error al guardar edición:', error);
      addNotification('Error al guardar la edición de la liquidación', 'error');
    }
  };

  // Calcular totales automáticamente desde la tabla de máquinas
  const calcularTotalesDesdeTabla = () => {
    if (!datosMaquinasSala || datosMaquinasSala.length === 0) {
      return {
        totalProduccion: 0,
        totalDerechos: 0,
        totalGastos: 0,
        totalGeneral: 0
      };
    }

    const totalProduccion = datosMaquinasSala.reduce((sum, maq) => sum + (parseFloat(maq.produccion) || 0), 0);
    const totalDerechos = datosMaquinasSala.reduce((sum, maq) => sum + (parseFloat(maq.derechosExplotacion) || 0), 0);
    const totalGastos = datosMaquinasSala.reduce((sum, maq) => sum + (parseFloat(maq.gastosAdministracion) || 0), 0);
    const totalGeneral = totalDerechos + totalGastos; // Total = Derechos + Gastos (sin Producción)

    return {
      totalProduccion,
      totalDerechos,
      totalGastos,
      totalGeneral
    };
  };

  // Calcular estadísticas localmente
  const calcularEstadisticasLocalmente = (liquidacionesData) => {
    const estadisticas = {
      totalLiquidaciones: liquidacionesData.length,
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
      salas: [...new Set(liquidaciones.map(l => l.sala.nombre))].sort()
    };
  }, [liquidaciones]);

  // Calcular totales automáticamente cuando cambien los datos de las máquinas
  const totalesCalculados = useMemo(() => {
    return calcularTotalesDesdeTabla();
  }, [datosMaquinasSala]);

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

  // Formatear montos (producción - sin decimales)
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto || 0);
  };

  // Formatear montos con decimales (derechos y gastos - máximo 2 decimales)
  const formatearMontoConDecimales = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(monto || 0);
  };

  // Parsear moneda a número (para campos de edición)
  const parsearMoneda = (valorFormateado) => {
    if (!valorFormateado) return 0;
    // Remover símbolos de moneda y espacios, mantener decimales
    const valorString = valorFormateado.toString()
      .replace(/[\$\s]/g, '') // Remover $ y espacios
      .replace(/\./g, '') // Remover puntos de miles
      .replace(/,/g, '.'); // Convertir coma decimal a punto
    return parseFloat(valorString) || 0;
  };

  // Formatear período (de "agosto_2025" a "Agosto 2025")
  const formatearPeriodo = (periodo) => {
    if (!periodo) return '';
    
    const [mes, año] = periodo.split('_');
    const mesesMap = {
      enero: 'Enero',
      febrero: 'Febrero',
      marzo: 'Marzo',
      abril: 'Abril',
      mayo: 'Mayo',
      junio: 'Junio',
      julio: 'Julio',
      agosto: 'Agosto',
      septiembre: 'Septiembre',
      octubre: 'Octubre',
      noviembre: 'Noviembre',
      diciembre: 'Diciembre'
    };
    
    return `${mesesMap[mes] || mes} ${año}`;
  };

  // Componente de estadísticas con diseño sobrio
  const EstadisticasResumen = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.primary.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mr: 2 
              }}>
                <StoreIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {estadisticas?.totalLiquidaciones || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Liquidaciones
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.success.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                mr: 2 
              }}>
                <PaymentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatearMonto(estadisticas?.montos?.totalProduccion)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Producción
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.warning.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                mr: 2 
              }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatearMontoConDecimales(estadisticas?.montos?.totalDerechos)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Derechos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderColor: alpha(theme.palette.info.main, 0.8)
          }
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                mr: 2 
              }}>
                <BusinessIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatearMonto(estadisticas?.montos?.totalImpuestos)}
                </Typography>
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

  // Componente de filtros con diseño sobrio
  const PanelFiltros = () => (
    <Card sx={{ 
      mb: 3,
      borderRadius: 1,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderColor: alpha(theme.palette.primary.main, 0.8)
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={filtros.empresa}
                label="Empresa"
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.empresas.map(empresa => (
                  <MenuItem key={empresa} value={empresa}>{empresa}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={filtros.periodo}
                label="Período"
                onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {opcionesFiltros.periodos.map(periodo => (
                  <MenuItem key={periodo} value={periodo}>{formatearPeriodo(periodo)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sala</InputLabel>
              <Select
                value={filtros.sala}
                label="Sala"
                onChange={(e) => setFiltros({ ...filtros, sala: e.target.value })}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesFiltros.salas.map(sala => (
                  <MenuItem key={sala} value={sala}>{sala}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1} height="100%">
              <Button 
                variant="contained" 
                onClick={aplicarFiltros}
                fullWidth
                size="small"
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Aplicar
              </Button>
              <Button 
                variant="outlined" 
                onClick={limpiarFiltros}
                fullWidth
                size="small"
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Limpiar
              </Button>
            </Box>
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
    <Box sx={{ p: 3 }}>
      {/* Header sobrio con gradiente controlado */}
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
            GESTIÓN FINANCIERA • CONTROL DE LIQUIDACIONES
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5
          }}>
            <StoreIcon sx={{ fontSize: '2rem' }} />
            Liquidaciones por Sala
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            mt: 0.5
          }}>
            Control y gestión de liquidaciones organizadas por sala
          </Typography>
        </Box>
      </Paper>

        {/* Estadísticas */}
        {estadisticas && <EstadisticasResumen />}

        {/* Filtros */}
        <PanelFiltros />

        {/* Tabla de liquidaciones con diseño sobrio */}
        <Card sx={{
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table sx={{
                '& .MuiTableCell-root': {
                  borderColor: 'divider'
                },
                '& .MuiTableHead-root .MuiTableRow-root': {
                  borderBottom: `1px solid ${theme.palette.divider}`
                }
              }}>
                <TableHead>
                  <TableRow sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}>
                    <TableCell sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Empresa / Sala
                    </TableCell>
                    <TableCell sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Período
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Máquinas
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Producción
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Impuestos
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      borderColor: 'divider',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {liquidaciones.map((liquidacion) => (
                    <TableRow
                      key={liquidacion.id}
                      sx={{
                        borderColor: 'divider',
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
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
                            {formatearPeriodo(liquidacion.fechas.periodoLiquidacion)}
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
                            
                            <Tooltip title="Editar liquidación">
                              <IconButton 
                                size="small"
                                color="secondary"
                                onClick={() => abrirModalEdicion(liquidacion)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                    </TableRow>
                  ))}
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
          /* Auto-size: dejamos que el contenido defina ancho, con límites de viewport */
          fullWidth={false}
          maxWidth={false}
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              width: 'auto',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <ViewIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
                  Detalle de Liquidación
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {dialogDetalles.liquidacion ? `${dialogDetalles.liquidacion.empresa.nombre} • ${formatearPeriodo(dialogDetalles.liquidacion.fechas.periodoLiquidacion)}` : '—'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => { setDialogDetalles({ open: false, liquidacion: null }); setDatosMaquinasSala([]); }} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 6 }}>
            {/* Layout flexible para que el ancho total se adapte al contenido real de la tabla */}
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 3,
              // El panel izquierdo se dimensiona por su contenido (tabla), hasta un máximo relativo
              '& > .detalle-maquinas-wrapper': {
                flex: '0 1 auto'
              },
              '& > .sidebar-metricas': {
                flex: '0 0 320px'
              },
              // Evitar que el contenedor provoque shrink que genere scroll horizontal
              overflowX: 'visible'
            }}>
              <Box className="detalle-maquinas-wrapper">
                {dialogDetalles.liquidacion && (
                  <Box>
                    {/* Tabla detallada de máquinas en Paper auto-ajustable */}
                    <Paper sx={{
                      mt: 1.5,
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.primary.light, 0.02),
                      width: 'fit-content',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        mb: 2
                      }}>
                        DETALLE POR MÁQUINA
                      </Typography>
                      {cargandoDetalles ? (
                        <Box display="flex" justifyContent="center" py={4}>
                          <CircularProgress />
                          <Typography sx={{ ml: 2 }}>Cargando detalles...</Typography>
                        </Box>
                      ) : datosMaquinasSala.length > 0 ? (
                        <Box sx={{
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                          borderRadius: 1,
                          overflow: 'hidden',
                          width: 'fit-content'
                        }}>
                          <TableContainer /* Altura automática: sin maxHeight interno; scroll recaerá en el Dialog si excede viewport */>
                            <Table size="small" sx={{
                              width: 'fit-content',
                              tableLayout: 'auto',
                              '& .MuiTableCell-root': {
                                borderColor: 'divider',
                                padding: '8px 12px'
                              },
                              '& .MuiTableHead-root .MuiTableRow-root': {
                                borderBottom: `1px solid ${theme.palette.divider}`
                              }
                            }}>
                              <TableHead>
                                <TableRow sx={{ 
                                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                  borderBottom: `1px solid ${theme.palette.divider}`
                                }}>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    Serial
                                  </TableCell>
                                  <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>
                                    NUC
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Producción
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Derechos de Explotación
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Gastos de Administración
                                  </TableCell>
                                  <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                    Total Impuestos
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {datosMaquinasSala.map((maquina, index) => (
                                  <TableRow 
                                    key={index} 
                                    sx={{
                                      borderColor: 'divider',
                                      transition: 'background-color 0.2s ease',
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                      }
                                    }}
                                  >
                                    <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                      {maquina.serial || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>
                                      {maquina.nuc || 'N/A'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.success.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                        {formatearMonto(maquina.produccion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.warning.main, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.derechosExplotacion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ color: theme.palette.error.main, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.gastosAdministracion)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderColor: 'divider', whiteSpace: 'nowrap' }}>
                                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                        {formatearMontoConDecimales(maquina.totalImpuestos)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          No se pudieron cargar los detalles de las máquinas para esta sala.
                        </Alert>
                      )}
                    </Paper>
                  </Box>
                )}
              </Box>

              <Box className="sidebar-metricas">
                {dialogDetalles.liquidacion && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                    {/* Información adicional */}
                    <Paper sx={{ 
                      mt: 1.5,
                      p: 2.5, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.primary.light, 0.02)
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 1.5 }}>
                        Información Adicional
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Sala:</strong> {dialogDetalles.liquidacion.sala.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Empresa:</strong> {dialogDetalles.liquidacion.empresa.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Período:</strong> {formatearPeriodo(dialogDetalles.liquidacion.fechas.periodoLiquidacion)}
                      </Typography>
                    </Paper>

                    {/* Métricas (vertical full-width) */}
                    <Paper sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.4)
                        : alpha(theme.palette.primary.light, 0.02)
                    }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                        Métricas
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.12) : alpha(theme.palette.primary.main, 0.03) }}>
                          <Typography variant="overline" sx={{ display: 'block', lineHeight: 1.1, fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>MÁQUINAS</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.primary.main }}>{dialogDetalles.liquidacion.metricas.totalMaquinas}</Typography>
                        </Paper>
                        <Paper elevation= {0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.success.dark, 0.12) : alpha(theme.palette.success.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>PRODUCCIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.success.main }}>{formatearMonto(dialogDetalles.liquidacion.metricas.totalProduccion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.12) : alpha(theme.palette.warning.light, 0.08) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>DERECHOS DE EXPLOTACIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.warning.main }}>{formatearMonto(dialogDetalles.liquidacion.metricas.derechosExplotacion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.12) : alpha(theme.palette.error.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>GASTOS DE ADMINISTRACIÓN</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.error.main }}>{formatearMonto(dialogDetalles.liquidacion.metricas.gastosAdministracion)}</Typography>
                        </Paper>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.info.dark, 0.12) : alpha(theme.palette.info.light, 0.06) }}>
                          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>TOTAL IMPUESTOS</Typography>
                          <Typography variant="h6" sx={{ m: 0, fontWeight: 600, color: theme.palette.text.primary }}>{formatearMonto(dialogDetalles.liquidacion.metricas.totalImpuestos)}</Typography>
                        </Paper>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              onClick={() => {
                setDialogDetalles({ open: false, liquidacion: null });
                setDatosMaquinasSala([]);
              }}
              variant="outlined"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de gestión de facturación con diseño sobrio */}
        <Dialog 
          open={dialogFacturacion.open} 
          onClose={() => setDialogFacturacion({ open: false, liquidacion: null })}
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
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <ReceiptIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                  Gestión de Facturación
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Control de Estados
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogFacturacion({ open: false, liquidacion: null })} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 5 }}>
            {dialogFacturacion.liquidacion && (
              <Box>
                <Paper sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.5)
                    : alpha(theme.palette.primary.light, 0.04)
                }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, mb: 1 }}>
                    Información de la Sala
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {dialogFacturacion.liquidacion.sala.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estado: {dialogFacturacion.liquidacion.facturacion.estado.toUpperCase()}
                  </Typography>
                </Paper>
                <Paper sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.4)
                    : alpha(theme.palette.primary.light, 0.02)
                }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, mb: 2 }}>
                    Acciones
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<PdfIcon />}
                      disabled={['generada', 'enviada', 'pagada'].includes(dialogFacturacion.liquidacion.facturacion.estado)}
                      onClick={() => {
                        actualizarEstadoFacturacion(dialogFacturacion.liquidacion.id, 'generada');
                        setDialogFacturacion({ open: false, liquidacion: null });
                      }}
                      sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', py: 1.5 }}
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
                      sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', py: 1.5 }}
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
                      sx={{ borderRadius: 1, fontWeight: 600, textTransform: 'none', py: 1.5 }}
                    >
                      Marcar como Pagada
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              onClick={() => setDialogFacturacion({ open: false, liquidacion: null })}
              variant="outlined"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de edición de liquidación */}
        <Dialog 
          open={dialogEdicion.open} 
          onClose={() => {
            setDialogEdicion({ open: false, liquidacion: null });
            setDatosMaquinasSala([]);
            setDatosEdicion({});
            setEdicionDirty(false);
          }}
          fullWidth={false}
          maxWidth={false}
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              width: 'auto',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <EditIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                  Editar Liquidación
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {dialogEdicion.liquidacion ? `${dialogEdicion.liquidacion.sala?.nombre} • ${formatearPeriodo(dialogEdicion.liquidacion.periodo)}` : '—'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => { setDialogEdicion({ open: false, liquidacion: null }); setDatosMaquinasSala([]); setDatosEdicion({}); }} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3, pt: 6 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 3,
              '& > .edit-left': { flex: '0 1 auto' },
              '& > .edit-right': { flex: '0 0 340px' }
            }}>
              <Box className="edit-left">
                <Paper sx={{ mt: 1.5, p: 3, mb: 3, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02), width: 'fit-content', maxWidth: '100%' }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                    DETALLE POR MÁQUINA
                  </Typography>
                  {cargandoDetalles ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Cargando detalles...</Typography>
                    </Box>
                  ) : datosMaquinasSala.length > 0 ? (
                    <Box sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`, borderRadius: 1, overflow: 'hidden', width: 'fit-content' }}>
                      <TableContainer>
                        <Table size="small" sx={{ width: 'fit-content', tableLayout: 'auto', '& .MuiTableCell-root': { borderColor: 'divider', padding: '8px 12px' }, '& .MuiTableHead-root .MuiTableRow-root': { borderBottom: `1px solid ${theme.palette.divider}` } }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderBottom: `1px solid ${theme.palette.divider}` }}>
                              <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Serial</TableCell>
                              <TableCell sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>NUC</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Producción</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Derechos de Explotación</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Gastos de Administración</TableCell>
                              <TableCell align="right" sx={{ borderColor: 'divider', fontWeight: 600, fontSize: '0.875rem' }}>Total Impuestos</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {datosMaquinasSala.map((maquina, index) => (
                              <TableRow key={index} sx={{ borderColor: 'divider', transition: 'background-color 0.2s ease', '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) } }}>
                                <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>{maquina.serial || 'N/A'}</TableCell>
                                <TableCell sx={{ borderColor: 'divider', fontSize: '0.8rem' }}>{maquina.nuc || 'N/A'}</TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <TextField
                                    variant="standard"
                                    type="text"
                                    size="small"
                                    value={formatearMonto(maquina.produccion || 0)}
                                    onChange={(e) => {
                                      const nuevaProduccion = parsearMoneda(e.target.value);
                                      const nuevasMaquinas = [...datosMaquinasSala];
                                      const derechos = nuevaProduccion * 0.12;
                                      const gastos = derechos * 0.01;
                                      nuevasMaquinas[index].produccion = nuevaProduccion;
                                      nuevasMaquinas[index].derechosExplotacion = derechos;
                                      nuevasMaquinas[index].gastosAdministracion = gastos;
                                      setDatosMaquinasSala(nuevasMaquinas);
                                      if (!edicionDirty) setEdicionDirty(true);
                                    }}
                                    InputProps={{
                                      style: { color: theme.palette.success.main, fontWeight: 500, fontSize: '0.8rem', textAlign: 'right' },
                                      disableUnderline: false
                                    }}
                                    sx={{ '& input': { textAlign: 'right' } }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <Typography sx={{ color: theme.palette.warning.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                    {formatearMontoConDecimales(maquina.derechosExplotacion || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <Typography sx={{ color: theme.palette.error.main, fontWeight: 500, fontSize: '0.8rem' }}>
                                    {formatearMontoConDecimales(maquina.gastosAdministracion || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderColor: 'divider' }}>
                                  <Typography sx={{ color: theme.palette.text.primary, fontWeight: 500, fontSize: '0.8rem' }}>
                                    {formatearMontoConDecimales((maquina.derechosExplotacion || 0) + (maquina.gastosAdministracion || 0))}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ borderRadius: 1 }} action={<Button color="warning" size="small" onClick={() => cargarDetallesSala(dialogEdicion.liquidacion)}>Reintentar</Button>}>
                      <Typography variant="body2">No se pudieron cargar los detalles de las máquinas</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                        ID de liquidación: {dialogEdicion.liquidacion?.id}<br/>
                        Datos disponibles: {datosMaquinasSala.length} máquinas<br/>
                        Estado de carga: {cargandoDetalles ? 'Cargando...' : 'Completado'}
                      </Typography>
                    </Alert>
                  )}
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02), width: 'fit-content' }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>Motivo de la Edición</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={datosEdicion.motivoEdicion || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDatosEdicion(prev => ({ ...prev, motivoEdicion: value }));
                      // Marcar como sucio si cambia el motivo
                      if (!edicionDirty) setEdicionDirty(true);
                    }}
                    placeholder="Describe el motivo de esta edición..."
                    required
                    helperText={!datosEdicion.motivoEdicion && edicionDirty ? 'Ingresa un motivo para habilitar el guardado' : ' '}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 1, backgroundColor: alpha(theme.palette.info.main, 0.1), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                    <Typography variant="body2">Se creará un nuevo registro manteniendo el original como historial. Esta acción quedará registrada para auditoría.</Typography>
                  </Alert>
                </Paper>
              </Box>

              <Box className="edit-right">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                  <Paper sx={{ mt: 1.5, p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02) }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 1.5 }}>
                      Información Base
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Sala:</strong> {dialogEdicion.liquidacion?.sala?.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Empresa:</strong> {dialogEdicion.liquidacion?.empresa?.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Período:</strong> {dialogEdicion.liquidacion ? formatearPeriodo(dialogEdicion.liquidacion.periodo) : '—'}</Typography>
                  </Paper>
                  <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : alpha(theme.palette.primary.light, 0.02) }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                      Métricas Calculadas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.success.dark, 0.12) : alpha(theme.palette.success.light, 0.06) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>PRODUCCIÓN</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600, m: 0 }}>{formatearMonto(totalesCalculados.totalProduccion)}</Typography>
                      </Paper>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.12) : alpha(theme.palette.warning.light, 0.08) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>DERECHOS</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.warning.main, fontWeight: 600, m: 0 }}>{formatearMontoConDecimales(totalesCalculados.totalDerechos)}</Typography>
                      </Paper>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.error.dark, 0.12) : alpha(theme.palette.error.light, 0.06) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>GASTOS</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.error.main, fontWeight: 600, m: 0 }}>{formatearMontoConDecimales(totalesCalculados.totalGastos)}</Typography>
                      </Paper>
                      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`, background: theme.palette.mode === 'dark' ? alpha(theme.palette.info.dark, 0.12) : alpha(theme.palette.info.light, 0.06) }}>
                        <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: '.08em', fontWeight: 600, color: theme.palette.text.secondary }}>TOTAL</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.info.main, fontWeight: 600, m: 0 }}>{formatearMontoConDecimales(totalesCalculados.totalGeneral)}</Typography>
                      </Paper>
                    </Box>
                  </Paper>
                  <Paper sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.default, 0.5)
                      : alpha(theme.palette.primary.light, 0.02)
                  }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, mb: 2 }}>
                      Herramientas de Edición
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Estado:</strong> Modo edición activo</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Auto-guardado:</strong> Deshabilitado</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}><strong>Cambios pendientes:</strong> {edicionDirty ? 'Sí' : 'No'}</Typography>
                    <Typography variant="body2" color="text.secondary"><strong>Control de versión:</strong> Activado</Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button
              onClick={() => {
                setDialogEdicion({ open: false, liquidacion: null });
                setDatosMaquinasSala([]);
                setDatosEdicion({});
                setEdicionDirty(false);
              }}
              variant="outlined"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={guardarEdicionLiquidacion}
              // Ahora solo depende del motivo: si hay cambios pero el usuario no cambió producción y solo quiere documentar un ajuste, igual puede guardar
              disabled={!datosEdicion.motivoEdicion}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.24)}` } }}
            >
              Guardar Edición
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default LiquidacionesPorSalaPage;
