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
  TablePagination,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  BreakfastDining as BreakIcon,
  LunchDining as LunchIcon,
  ExitToApp as ExitIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../hooks/usePermissions';
import { exportarAsistenciasExcel } from '../utils/asistenciasExcelExport';

const AsistenciasPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ False inicial (no carga hasta aplicar filtros)
  const [error, setError] = useState(null);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ✅ Filtros Avanzados
  const [filterPeriodo, setFilterPeriodo] = useState('hoy'); // 'hoy', 'ayer', '7dias', '30dias', 'mes_actual', 'personalizado'
  const [filterEmpleado, setFilterEmpleado] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all'); // all, trabajando, break, almuerzo, finalizado
  const [filterUbicacion, setFilterUbicacion] = useState('all'); // all, oficina, remoto
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [searchText, setSearchText] = useState('');
  
  // Control de query activa
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [activeListener, setActiveListener] = useState(null);
  const [hasMoreData, setHasMoreData] = useState(false); // ✅ Warning si hay +100 registros
  
  // Exportando Excel
  const [exporting, setExporting] = useState(false);
  
  // Lista de empleados para dropdown
  const [empleadosList, setEmpleadosList] = useState([]);

  // ✅ Usar hook centralizado de permisos
  const { hasPermission } = usePermissions();
  const canViewAsistencias = hasPermission('asistencias');

  // ✅ Cargar lista de empleados para filtro (solo nombres, no asistencias)
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const snapshot = await getDocs(usersQuery);
        const empleados = snapshot.docs.map(doc => ({
          uid: doc.id,
          nombre: doc.data().name || doc.data().displayName || doc.data().email,
          email: doc.data().email
        }));
        setEmpleadosList(empleados);
      } catch (err) {
        console.error('Error cargando empleados:', err);
      }
    };
    
    if (canViewAsistencias) {
      fetchEmpleados();
    }
  }, [canViewAsistencias]);

  // ✅ Función para aplicar filtros y cargar datos de Firestore
  const handleApplyFilters = () => {
    if (!canViewAsistencias) {
      setError('No tienes permisos para ver asistencias');
      return;
    }

    // Si no hay período seleccionado, establecer '7dias' por defecto
    const periodoFinal = filterPeriodo || '7dias';
    if (!filterPeriodo) {
      setFilterPeriodo('7dias'); // Actualizar el Select visualmente
    }

    // Limpiar listener anterior si existe
    if (activeListener) {
      activeListener();
      setActiveListener(null);
    }

    setLoading(true);
    setError(null);
    
    try {
      // ✅ Calcular rango de fechas según período seleccionado
      // Si no hay período, usar últimos 7 días por defecto
      let startDate = null;
      let endDate = null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const periodoActual = filterPeriodo || '7dias'; // Default a 7 días
      
      switch (periodoActual) {
        case 'hoy':
          startDate = format(today, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'ayer':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = format(yesterday, 'yyyy-MM-dd');
          endDate = format(yesterday, 'yyyy-MM-dd');
          break;
        case '7dias':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case '30dias':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'mes_actual':
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = format(firstDay, 'yyyy-MM-dd');
          endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'personalizado':
          if (!filterDateStart || !filterDateEnd) {
            showToast('Por favor selecciona un rango de fechas', 'warning');
            setLoading(false);
            return;
          }
          startDate = filterDateStart;
          endDate = filterDateEnd;
          break;
        default:
          showToast('Por favor selecciona un período', 'warning');
          setLoading(false);
          return;
      }
      
      // ✅ Construir query específica de Firestore con LÍMITE DE 100
      let q;
      
      if (filterEmpleado !== 'all') {
        // Query con filtro de empleado + rango de fechas + LÍMITE
        q = query(
          collection(db, 'asistencias'),
          where('uid', '==', filterEmpleado),
          where('fecha', '>=', startDate),
          where('fecha', '<=', endDate),
          orderBy('fecha', 'desc'),
          limit(101) // ✅ Traer 101 para detectar si hay más
        );
      } else {
        // Query solo con rango de fechas + LÍMITE
        q = query(
          collection(db, 'asistencias'),
          where('fecha', '>=', startDate),
          where('fecha', '<=', endDate),
          orderBy('fecha', 'desc'),
          limit(101) // ✅ Traer 101 para detectar si hay más
        );
      }
      
      console.log('🔍 Aplicando filtros:', { startDate, endDate, empleado: filterEmpleado });

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const asistenciasData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // ✅ Helper para convertir Timestamp o ISO string a Date
            const toDate = (value) => {
              if (!value) return null;
              if (value.toDate) return value.toDate(); // Firestore Timestamp
              return new Date(value); // ISO string
            };

            // ✅ Formato de APP MÓVIL: UN documento con entrada/breaks/almuerzo/salida
            asistenciasData.push({
              id: doc.id,
              uid: data.uid || data.empleadoId, // ✅ Soportar ambos campos por compatibilidad
              empleadoEmail: data.empleadoEmail,
              empleadoNombre: data.empleadoNombre || data.empleadoEmail,
              fecha: data.fecha,
              entrada: {
                hora: toDate(data.entrada?.hora),
                ubicacion: data.entrada?.ubicacion || null, // ✅ Ubicación GPS
                dispositivo: data.entrada?.dispositivo || null // ✅ Dispositivo móvil
              },
              breaks: (data.breaks || []).map(br => ({
                inicio: toDate(br.inicio),
                fin: toDate(br.fin),
                duracion: br.duracion
              })),
              almuerzo: data.almuerzo || null,
              almuerzoInicio: toDate(data.almuerzo?.inicio),
              almuerzoFin: toDate(data.almuerzo?.fin),
              almuerzoDuracion: data.almuerzo?.duracion || null,
              salida: data.salida ? {
                hora: toDate(data.salida.hora),
                ubicacion: data.salida.ubicacion || null // ✅ Preservar ubicación con tipo (Remoto/Oficina)
              } : null,
              estadoActual: data.estadoActual,
              horasTrabajadas: data.horasTrabajadas || null,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt)
            });
          });
          
          // ✅ Detectar si hay más de 100 registros
          if (asistenciasData.length > 100) {
            setHasMoreData(true);
            asistenciasData.pop(); // Eliminar el registro 101
          } else {
            setHasMoreData(false);
          }
          
          // ✅ Aplicar filtros de estado y ubicación (client-side)
          let filteredData = asistenciasData;
          
          // Filtro por estado
          if (filterEstado !== 'all') {
            filteredData = filteredData.filter(a => 
              (a.estadoActual || '').toLowerCase() === filterEstado.toLowerCase()
            );
          }
          
          // Filtro por ubicación
          if (filterUbicacion !== 'all') {
            filteredData = filteredData.filter(a => {
              const ubicacionSalida = a.salida?.ubicacion || {};
              const tipo = ubicacionSalida.tipo || '';
              
              if (filterUbicacion === 'oficina') {
                return tipo.toLowerCase() === 'oficina';
              } else if (filterUbicacion === 'remoto') {
                return tipo.toLowerCase() === 'remoto';
              }
              return true;
            });
          }
          
          // ✅ Ordenar SIEMPRE por createdAt (fuente de verdad más precisa)
          filteredData.sort((a, b) => {
            // 1. Obtener timestamp de creación o entrada
            const timeA = (a.createdAt instanceof Date && !isNaN(a.createdAt.getTime())) 
              ? a.createdAt.getTime() 
              : (a.entrada?.hora instanceof Date && !isNaN(a.entrada.hora.getTime()))
                ? a.entrada.hora.getTime()
                : 0;
            
            const timeB = (b.createdAt instanceof Date && !isNaN(b.createdAt.getTime())) 
              ? b.createdAt.getTime() 
              : (b.entrada?.hora instanceof Date && !isNaN(b.entrada.hora.getTime()))
                ? b.entrada.hora.getTime()
                : 0;
            
            // 2. Ordenar descendente (más reciente primero)
            return timeB - timeA;
          });
          
          console.log('📊 Asistencias cargadas:', filteredData.length, hasMoreData ? '(+100 disponibles)' : '');
          
          setAsistencias(filteredData);
          setHasAppliedFilters(true);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error en listener de asistencias:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      setActiveListener(() => unsubscribe);
    } catch (err) {
      console.error('❌ Error configurando listener:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ✅ Función para limpiar filtros y volver a estado inicial
  const handleClearFilters = () => {
    // Detener listener activo
    if (activeListener) {
      activeListener();
      setActiveListener(null);
    }
    
    // Reset estados
    setFilterPeriodo('hoy'); // Mantener valor por defecto
    setFilterEmpleado('all');
    setFilterEstado('all');
    setFilterUbicacion('all');
    setFilterDateStart('');
    setFilterDateEnd('');
    setSearchText('');
    setAsistencias([]);
    setHasAppliedFilters(false);
    setHasMoreData(false);
    setPage(0);
    
    showToast('Filtros limpiados', 'info');
  };

  // ✅ Reset de página si no hay datos
  useEffect(() => {
    if (asistencias.length === 0 && page > 0) {
      setPage(0);
    }
  }, [asistencias.length, page]);

  // ✅ PROCESAMIENTO DE ASISTENCIAS (ya vienen agrupadas de la app móvil)
  const asistenciasAgrupadas = useMemo(() => {
    return asistencias.map(asistencia => {
      let horasTrabajadas = asistencia.horasTrabajadas;
      
      // 🔄 SIEMPRE recalcular desde timestamps si existen entrada y salida
      if (asistencia.entrada?.hora && asistencia.salida?.hora) {
        // Tiempo total: salida - entrada
        const diffMs = asistencia.salida.hora.getTime() - asistencia.entrada.hora.getTime();
        
        // Calcular tiempo de descansos (breaks + almuerzo) en milisegundos
        let tiempoDescansoMs = 0;
        

        
        // Sumar breaks
        if (asistencia.breaks && Array.isArray(asistencia.breaks)) {
          asistencia.breaks.forEach(b => {
            let breakMs = 0;
            
            // Si duracion es 0 o null, calcular desde timestamps
            if (!b.duracion || b.duracion === 0) {
              if (b.inicio && b.fin) {
                const inicio = new Date(b.inicio);
                const fin = new Date(b.fin);
                breakMs = fin - inicio;
              }
            }
            // Si es string HH:MM:SS
            else if (typeof b.duracion === 'string' && b.duracion.includes(':')) {
              const [h, m, s] = b.duracion.split(':').map(Number);
              breakMs = (h * 60 * 60 + m * 60 + s) * 1000;
            }
            // Si es número (minutos legacy)
            else if (typeof b.duracion === 'number' && b.duracion > 0) {
              breakMs = b.duracion * 60 * 1000;
            }
            
            tiempoDescansoMs += breakMs;
          });
        }
        
        // Sumar almuerzo
        let almuerzoMs = 0;
        
        // Si duracion es 0 o null, calcular desde timestamps
        if (!asistencia.almuerzoDuracion || asistencia.almuerzoDuracion === 0) {
          if (asistencia.almuerzo?.inicio && asistencia.almuerzo?.fin) {
            const inicio = new Date(asistencia.almuerzo.inicio);
            const fin = new Date(asistencia.almuerzo.fin);
            almuerzoMs = fin - inicio;
          }
        }
        // Si es string HH:MM:SS
        else if (typeof asistencia.almuerzoDuracion === 'string' && asistencia.almuerzoDuracion.includes(':')) {
          const [h, m, s] = asistencia.almuerzoDuracion.split(':').map(Number);
          almuerzoMs = (h * 60 * 60 + m * 60 + s) * 1000;
        }
        // Si es número (minutos legacy)
        else if (typeof asistencia.almuerzoDuracion === 'number' && asistencia.almuerzoDuracion > 0) {
          almuerzoMs = asistencia.almuerzoDuracion * 60 * 1000;
        }
        
        tiempoDescansoMs += almuerzoMs;
        
        // Tiempo trabajado efectivo = tiempo total - descansos
        const tiempoTrabajadoMs = diffMs - tiempoDescansoMs;
        
        // Convertir a HH:MM:SS
        const horas = Math.floor(tiempoTrabajadoMs / 1000 / 60 / 60);
        const minutos = Math.floor((tiempoTrabajadoMs / 1000 / 60) % 60);
        const segundos = Math.floor((tiempoTrabajadoMs / 1000) % 60);
        horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
      }
      // Si no hay timestamps pero existe horasTrabajadas decimal (legacy), convertir
      else if (horasTrabajadas && typeof horasTrabajadas === 'number') {
        const totalSegundos = Math.floor(horasTrabajadas * 60 * 60);
        const horas = Math.floor(totalSegundos / 60 / 60);
        const minutos = Math.floor((totalSegundos / 60) % 60);
        const segundos = Math.floor(totalSegundos % 60);
        horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
      }
      
      return {
        ...asistencia,
        horasTrabajadas
      };
    }).sort((a, b) => {
      // Ordenar por fecha desc, luego por nombre
      const dateCompare = b.fecha.localeCompare(a.fecha);
      if (dateCompare !== 0) return dateCompare;
      return (a.empleadoNombre || '').localeCompare(b.empleadoNombre || '');
    });
  }, [asistencias]);

  // ✅ FILTRADO ADICIONAL POR BÚSQUEDA DE TEXTO (solo si aplicó filtros)
  const asistenciasFiltradas = useMemo(() => {
    if (!hasAppliedFilters) return [];
    
    return asistenciasAgrupadas.filter((asistencia) => {
      // Búsqueda por nombre/email (opcional)
      if (searchText) {
        const search = searchText.toLowerCase();
        const nombre = (asistencia.empleadoNombre || '').toLowerCase();
        const email = (asistencia.empleadoEmail || '').toLowerCase();
        return nombre.includes(search) || email.includes(search);
      }
      
      return true;
    });
  }, [asistenciasAgrupadas, searchText, hasAppliedFilters]);

  // ✅ PAGINACIÓN
  const asistenciasPaginadas = useMemo(() => {
    const start = page * rowsPerPage;
    return asistenciasFiltradas.slice(start, start + rowsPerPage);
  }, [asistenciasFiltradas, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ✅ EXPORTACIÓN A EXCEL (Formato Python)
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportarAsistenciasExcel(asistenciasFiltradas);
      showToast('Excel exportado exitosamente', 'success');
    } catch (err) {
      console.error('❌ Error exportando Excel:', err);
      showToast('Error al exportar Excel: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  // ✅ FORMATO DE HORA
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return format(date, 'HH:mm:ss', { locale: es });
    } catch (err) {
      return '-';
    }
  };

  // ✅ SIN PERMISOS
  if (!canViewAsistencias) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body2">
            No tienes permisos para ver el módulo de asistencias. Contacta al administrador.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header Sobrio con Gradiente Simplificado */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" sx={{
            fontWeight: 600,
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 1.2
          }}>
            CONTROL DE PERSONAL • ASISTENCIAS
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            mt: 0.5,
            mb: 0.5,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AccessTimeIcon sx={{ fontSize: 32 }} />
            Asistencias del Personal
          </Typography>
          <Typography variant="body1" sx={{
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Registro completo de entrada, breaks, almuerzo y salida del personal
          </Typography>
        </Box>
      </Paper>

      {/* Filtros Avanzados */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.8),
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}
      >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              🔍 Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              {/* Período */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={filterPeriodo}
                    label="Período"
                    onChange={(e) => setFilterPeriodo(e.target.value)}
                  >
                    <MenuItem value="">Seleccionar...</MenuItem>
                    <MenuItem value="hoy">Hoy</MenuItem>
                    <MenuItem value="ayer">Ayer</MenuItem>
                    <MenuItem value="7dias">Últimos 7 días</MenuItem>
                    <MenuItem value="30dias">Últimos 30 días</MenuItem>
                    <MenuItem value="mes_actual">Mes actual</MenuItem>
                    <MenuItem value="personalizado">Rango personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Empleado */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    value={filterEmpleado}
                    label="Empleado"
                    onChange={(e) => setFilterEmpleado(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {empleadosList.map((emp) => (
                      <MenuItem key={emp.uid} value={emp.uid}>
                        {emp.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ✅ Estado */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterEstado}
                    label="Estado"
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="trabajando">🟢 Trabajando</MenuItem>
                    <MenuItem value="break">☕ Break</MenuItem>
                    <MenuItem value="almuerzo">🍽️ Almuerzo</MenuItem>
                    <MenuItem value="finalizado">🏠 Finalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* ✅ Ubicación */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    value={filterUbicacion}
                    label="Ubicación"
                    onChange={(e) => setFilterUbicacion(e.target.value)}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value="oficina">🏢 Oficina</MenuItem>
                    <MenuItem value="remoto">🏠 Remoto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fechas personalizadas (solo si período = personalizado) */}
              {filterPeriodo === 'personalizado' && (
                <>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Desde"
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Hasta"
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Búsqueda por texto */}
              <Grid item xs={12} sm={6} md={filterPeriodo === 'personalizado' ? 2 : 2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por nombre"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Diego, Carolina..."
                />
              </Grid>

              {/* Botones */}
              <Grid item xs={12} md={filterPeriodo === 'personalizado' ? 12 : 12}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{
                      flex: 1,
                      minWidth: 120,
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                    }}
                  >
                    {loading ? 'Cargando...' : 'Aplicar Filtros'}
                  </Button>
                  {hasAppliedFilters && (
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        fontWeight: 600
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                    onClick={handleExportExcel}
                    disabled={asistencias.length === 0 || exporting}
                    sx={{
                      flex: 1,
                      minWidth: 120,
                      fontWeight: 600
                    }}
                  >
                    Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Info de resultados */}
            {hasAppliedFilters && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  📊 Mostrando <strong>{asistenciasFiltradas.length}</strong> registro{asistenciasFiltradas.length !== 1 ? 's' : ''} 
                  {searchText && ` filtrados por "${searchText}"`}
                </Typography>
              </Box>
            )}

            {/* ✅ WARNING: Más de 100 registros disponibles */}
            {hasMoreData && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mt: 2,
                  borderRadius: 1,
                  boxShadow: '0 2px 8px rgba(255,152,0,0.15)'
                }}
              >
                ⚠️ <strong>Mostrando 100 registros</strong>. Hay más datos disponibles. 
                Ajusta los filtros para resultados más específicos (por ej. selecciona un empleado o reduce el rango de fechas).
              </Alert>
            )}
          </CardContent>
        </Card>

      {/* Tabla */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : !hasAppliedFilters ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={400} sx={{ p: 4 }}>
              <CalendarIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona los filtros para ver registros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elige un período y opcionalmente un empleado, luego presiona "Aplicar Filtros"
              </Typography>
            </Box>
          ) : asistencias.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No hay registros de asistencias para los filtros seleccionados.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table sx={{
                  '& .MuiTableCell-root': {
                    borderColor: theme.palette.divider,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  },
                  '& .MuiTableHead-root .MuiTableRow-root': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    '& .MuiTableCell-root': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      paddingY: 2,
                      borderColor: theme.palette.divider
                    }
                  },
                  '& .MuiTableBody-root .MuiTableRow-root': {
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    },
                    '&:last-child .MuiTableCell-root': {
                      borderBottom: 'none'
                    },
                    '& .MuiTableCell-root': {
                      paddingY: 1.8,
                      fontSize: '0.85rem',
                      borderColor: theme.palette.divider
                    }
                  }
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Empleado</TableCell>
                      <TableCell align="center">Fecha</TableCell>
                      <TableCell align="center">Entrada</TableCell>
                      <TableCell align="center">Ubicación</TableCell>
                      <TableCell align="center">Modalidad</TableCell>
                      <TableCell align="center">Breaks</TableCell>
                      <TableCell align="center">Almuerzo</TableCell>
                      <TableCell align="center">Salida</TableCell>
                      <TableCell align="center">Horas Trabajadas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asistenciasPaginadas.map((asistencia, index) => (
                      <TableRow
                        key={`${asistencia.empleadoEmail}-${asistencia.fecha}-${index}`}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                          },
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {/* Empleado */}
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: theme.palette.primary.main
                              }}
                            >
                              {(asistencia.empleadoNombre || 'U')[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {asistencia.empleadoNombre || 'Sin nombre'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {asistencia.fecha ? format(parseISO(asistencia.fecha), 'dd/MM/yyyy', { locale: es }) : '-'}
                          </Typography>
                        </TableCell>

                        {/* Entrada */}
                        <TableCell align="center">
                          <Chip
                            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                            label={formatTime(asistencia.entrada?.hora) || '-'}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(theme.palette.success.main, 0.5),
                              color: theme.palette.success.main,
                              fontSize: '0.75rem',
                              '& .MuiChip-icon': {
                                color: theme.palette.success.main
                              }
                            }}
                          />
                        </TableCell>

                        {/* Ubicación */}
                        <TableCell align="center">
                          {asistencia.entrada?.ubicacion && asistencia.entrada.ubicacion.lat && asistencia.entrada.ubicacion.lon ? (
                            <Tooltip title="Abrir en Google Maps">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const lat = asistencia.entrada.ubicacion.lat;
                                  const lon = asistencia.entrada.ubicacion.lon;
                                  window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
                                }}
                                sx={{
                                  color: theme.palette.info.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.info.main, 0.1)
                                  }
                                }}
                              >
                                <LocationOnIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Modalidad */}
                        <TableCell align="center">
                          {asistencia.entrada?.ubicacion?.tipo ? (
                            <Chip
                              label={asistencia.entrada.ubicacion.tipo}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                backgroundColor: asistencia.entrada.ubicacion.tipo === 'Oficina' 
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.warning.main, 0.1),
                                color: asistencia.entrada.ubicacion.tipo === 'Oficina'
                                  ? theme.palette.success.main
                                  : theme.palette.warning.main,
                                border: `1px solid ${
                                  asistencia.entrada.ubicacion.tipo === 'Oficina'
                                    ? alpha(theme.palette.success.main, 0.3)
                                    : alpha(theme.palette.warning.main, 0.3)
                                }`
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Breaks */}
                        <TableCell align="center">
                          {asistencia.breaks && asistencia.breaks.length > 0 ? (
                            <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
                              {asistencia.breaks.map((br, idx) => {
                                const horaInicio = formatTime(br.inicio); // Ya viene como Date
                                let duracion = 'En curso';
                                
                                // Si tiene duracion como string HH:MM:SS, usarla
                                if (br.duracion && typeof br.duracion === 'string' && br.duracion.includes(':')) {
                                  duracion = br.duracion;
                                } 
                                // Si tiene duración numérica (formato antiguo), mostrarla
                                else if (br.duracion && typeof br.duracion === 'number' && br.duracion > 0) {
                                  duracion = `${br.duracion} min`;
                                }
                                // Si no tiene duración pero tiene fin, calcularla en HH:MM:SS
                                else if (br.fin && br.inicio) {
                                  const inicio = new Date(br.inicio);
                                  const fin = new Date(br.fin);
                                  const diffMs = fin - inicio;
                                  const horas = Math.floor(diffMs / 1000 / 60 / 60);
                                  const minutos = Math.floor((diffMs / 1000 / 60) % 60);
                                  const segundos = Math.floor((diffMs / 1000) % 60);
                                  duracion = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                                }
                                
                                return (
                                  <Box key={idx} display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                                    <Chip
                                      icon={<BreakIcon sx={{ fontSize: 12 }} />}
                                      label={horaInicio}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        height: 22,
                                        borderColor: alpha(theme.palette.info.main, 0.5),
                                        color: theme.palette.info.main,
                                        fontSize: '0.7rem',
                                        '& .MuiChip-icon': {
                                          color: theme.palette.info.main
                                        }
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: theme.palette.info.main, fontWeight: 500 }}>
                                      {duracion}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Almuerzo */}
                        <TableCell align="center">
                          {asistencia.almuerzo ? (
                            <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
                              {(() => {
                                const horaInicio = formatTime(asistencia.almuerzoInicio);
                                let duracion = 'En curso';
                                
                                // Si tiene duracion como string HH:MM:SS, usarla
                                if (asistencia.almuerzoDuracion && typeof asistencia.almuerzoDuracion === 'string' && asistencia.almuerzoDuracion.includes(':')) {
                                  duracion = asistencia.almuerzoDuracion;
                                }
                                // Si tiene duración numérica (formato antiguo), mostrarla
                                else if (asistencia.almuerzoDuracion && typeof asistencia.almuerzoDuracion === 'number' && asistencia.almuerzoDuracion > 0) {
                                  duracion = `${asistencia.almuerzoDuracion} min`;
                                }
                                // Si no tiene duración pero tiene fin, calcularla en HH:MM:SS
                                else if (asistencia.almuerzoFin && asistencia.almuerzoInicio) {
                                  const inicio = asistencia.almuerzoInicio;
                                  const fin = asistencia.almuerzoFin;
                                  const diffMs = fin - inicio;
                                  const horas = Math.floor(diffMs / 1000 / 60 / 60);
                                  const minutos = Math.floor((diffMs / 1000 / 60) % 60);
                                  const segundos = Math.floor((diffMs / 1000) % 60);
                                  duracion = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                                }
                                
                                return (
                                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                                    <Chip
                                      icon={<LunchIcon sx={{ fontSize: 12 }} />}
                                      label={horaInicio}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        height: 22,
                                        borderColor: alpha(theme.palette.warning.main, 0.5),
                                        color: theme.palette.warning.main,
                                        fontSize: '0.7rem',
                                        '& .MuiChip-icon': {
                                          color: theme.palette.warning.main
                                        }
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: theme.palette.warning.main, fontWeight: 500 }}>
                                      {duracion}
                                    </Typography>
                                  </Box>
                                );
                              })()}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Salida */}
                        <TableCell align="center">
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Chip
                              icon={<ExitIcon sx={{ fontSize: 14 }} />}
                              label={formatTime(asistencia.salida?.hora) || '-'}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: asistencia.salida?.hora 
                                  ? alpha(theme.palette.error.main, 0.5) 
                                  : alpha(theme.palette.divider, 0.6),
                                color: asistencia.salida?.hora 
                                  ? theme.palette.error.main 
                                  : 'text.secondary',
                                fontSize: '0.75rem',
                                '& .MuiChip-icon': {
                                  color: asistencia.salida?.hora 
                                    ? theme.palette.error.main 
                                    : 'text.secondary'
                                }
                              }}
                            />
                            {/* Modalidad Salida (Nuevo) */}
                            {asistencia.salida?.ubicacion?.tipo ? (
                              <Chip
                                label={asistencia.salida.ubicacion.tipo}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  backgroundColor: asistencia.salida.ubicacion.tipo === 'Oficina' 
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : alpha(theme.palette.warning.main, 0.1),
                                  color: asistencia.salida.ubicacion.tipo === 'Oficina'
                                    ? theme.palette.success.main
                                    : theme.palette.warning.main,
                                  border: `1px solid ${
                                    asistencia.salida.ubicacion.tipo === 'Oficina'
                                      ? alpha(theme.palette.success.main, 0.3)
                                      : alpha(theme.palette.warning.main, 0.3)
                                  }`
                                }}
                              />
                            ) : asistencia.salida?.hora ? (
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                Sin ubicación
                              </Typography>
                            ) : null}
                          </Box>
                        </TableCell>

                        {/* Horas Trabajadas */}
                        <TableCell align="center">
                          {asistencia.horasTrabajadas ? (
                            <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                              <TimerIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.primary.main
                                }}
                              >
                                {typeof asistencia.horasTrabajadas === 'string' && asistencia.horasTrabajadas.includes(':')
                                  ? asistencia.horasTrabajadas
                                  : `${asistencia.horasTrabajadas}h`}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">En curso</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginación */}
              <TablePagination
                component="div"
                count={asistenciasFiltradas.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '& .MuiTablePagination-toolbar': {
                    px: 2
                  }
                }}
              />
            </>
          )}
        </Card>
    </Box>
  );
};

export default AsistenciasPage;
