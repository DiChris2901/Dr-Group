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
  Timer as TimerIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtros
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByEmpleado, setFilterByEmpleado] = useState('all');
  
  // Exportando Excel
  const [exporting, setExporting] = useState(false);

  // ✅ Usar hook centralizado de permisos
  const { hasPermission } = usePermissions();
  const canViewAsistencias = hasPermission('asistencias');

  // ✅ REAL-TIME LISTENER - onSnapshot en collection asistencias
  useEffect(() => {
    if (!canViewAsistencias) {
      setLoading(false);
      setError('No tienes permisos para ver asistencias');
      return;
    }

    try {
      // Query base: ordenar por fecha desc (más reciente primero)
      const q = query(
        collection(db, 'asistencias'),
        orderBy('fecha', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const asistenciasData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // ✅ Formato de APP MÓVIL: UN documento con entrada/breaks/almuerzo/salida
            asistenciasData.push({
              id: doc.id,
              empleadoId: data.empleadoId,
              empleadoEmail: data.empleadoEmail,
              empleadoNombre: data.empleadoNombre || data.empleadoEmail,
              fecha: data.fecha,
              entrada: data.entrada?.hora ? new Date(data.entrada.hora) : null,
              breaks: data.breaks || [],
              almuerzo: data.almuerzo || null,
              almuerzoInicio: data.almuerzo?.inicio ? new Date(data.almuerzo.inicio) : null,
              almuerzoFin: data.almuerzo?.fin ? new Date(data.almuerzo.fin) : null,
              almuerzoDuracion: data.almuerzo?.duracion || null,
              salida: data.salida?.hora ? new Date(data.salida.hora) : null,
              estadoActual: data.estadoActual,
              horasTrabajadas: data.horasTrabajadas || null,
              createdAt: data.createdAt?.toDate?.() || null,
              updatedAt: data.updatedAt?.toDate?.() || null
            });
          });
          
          setAsistencias(asistenciasData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error en listener de asistencias:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('❌ Error configurando listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [canViewAsistencias]);

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
      if (asistencia.entrada && asistencia.salida) {
        // Tiempo total: salida - entrada
        const diffMs = asistencia.salida.getTime() - asistencia.entrada.getTime();
        
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

  // ✅ FILTRADO DE ASISTENCIAS
  const asistenciasFiltradas = useMemo(() => {
    return asistenciasAgrupadas.filter((asistencia) => {
      // Filtro por fecha
      if (selectedDate && asistencia.fecha !== selectedDate) {
        return false;
      }
      
      // Filtro por empleado
      if (filterByEmpleado !== 'all' && asistencia.empleadoEmail !== filterByEmpleado) {
        return false;
      }
      
      // Búsqueda por nombre/email
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const nombre = (asistencia.empleadoNombre || '').toLowerCase();
        const email = (asistencia.empleadoEmail || '').toLowerCase();
        return nombre.includes(search) || email.includes(search);
      }
      
      return true;
    });
  }, [asistenciasAgrupadas, selectedDate, filterByEmpleado, searchTerm]);

  // ✅ LISTA ÚNICA DE EMPLEADOS PARA FILTRO
  const empleadosUnicos = useMemo(() => {
    const emails = [...new Set(asistenciasAgrupadas.map(a => a.empleadoEmail))];
    return emails.map(email => {
      const asistencia = asistenciasAgrupadas.find(a => a.empleadoEmail === email);
      return {
        email,
        nombre: asistencia?.empleadoNombre || email
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [asistenciasAgrupadas]);

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            p: 3,
            borderRadius: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <AccessTimeIcon sx={{ fontSize: 40 }} />
            <Box flex={1}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                📋 Asistencias del Personal
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Control de entrada, breaks, almuerzo y salida registrados vía Telegram Bot
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {/* Fecha */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              {/* Empleado */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    value={filterByEmpleado}
                    label="Empleado"
                    onChange={(e) => {
                      setFilterByEmpleado(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {empleadosUnicos.map((emp) => (
                      <MenuItem key={emp.email} value={emp.email}>
                        {emp.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Búsqueda */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar por nombre/email"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Diego, carolina@..."
                />
              </Grid>

              {/* Botones */}
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" gap={1}>
                  <Tooltip title="Refrescar datos">
                    <IconButton
                      onClick={() => {
                        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
                        setFilterByEmpleado('all');
                        setSearchTerm('');
                        setPage(0);
                      }}
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                    onClick={handleExportExcel}
                    disabled={asistenciasFiltradas.length === 0 || exporting}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      fontWeight: 600
                    }}
                  >
                    {exporting ? 'Exportando...' : 'Excel'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Stats */}
            <Box mt={2} display="flex" gap={2} flexWrap="wrap">
              <Chip
                icon={<PersonIcon />}
                label={`${empleadosUnicos.length} empleados registrados`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<CalendarIcon />}
                label={`${asistenciasFiltradas.length} registros (${selectedDate ? format(parseISO(selectedDate), 'dd MMM yyyy', { locale: es }) : 'Todas las fechas'})`}
                color="secondary"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card elevation={0} sx={{ borderRadius: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : asistenciasFiltradas.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No hay registros de asistencias para los filtros seleccionados.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        '& th': {
                          fontWeight: 700,
                          color: theme.palette.text.primary
                        }
                      }}
                    >
                      <TableCell>Empleado</TableCell>
                      <TableCell align="center">Fecha</TableCell>
                      <TableCell align="center">Entrada</TableCell>
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
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {asistencia.empleadoNombre || 'Sin nombre'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asistencia.empleadoEmail}
                              </Typography>
                            </Box>
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
                            icon={<AccessTimeIcon />}
                            label={formatTime(asistencia.entrada)}
                            size="small"
                            color={asistencia.entrada ? 'success' : 'default'}
                            variant={asistencia.entrada ? 'filled' : 'outlined'}
                          />
                        </TableCell>

                        {/* Breaks */}
                        <TableCell align="center">
                          {asistencia.breaks && asistencia.breaks.length > 0 ? (
                            <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
                              {asistencia.breaks.map((br, idx) => {
                                const horaInicio = formatTime(br.inicio ? new Date(br.inicio) : null);
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
                                  <Chip
                                    key={idx}
                                    icon={<BreakIcon />}
                                    label={`${horaInicio} (${duracion})`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
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
                                  <Chip
                                    icon={<LunchIcon />}
                                    label={`${horaInicio} (${duracion})`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                );
                              })()}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>

                        {/* Salida */}
                        <TableCell align="center">
                          <Chip
                            icon={<ExitIcon />}
                            label={formatTime(asistencia.salida)}
                            size="small"
                            color={asistencia.salida ? 'error' : 'default'}
                            variant={asistencia.salida ? 'filled' : 'outlined'}
                          />
                        </TableCell>

                        {/* Horas Trabajadas */}
                        <TableCell align="center">
                          {asistencia.horasTrabajadas ? (
                            <Chip
                              icon={<TimerIcon />}
                              label={
                                typeof asistencia.horasTrabajadas === 'string' && asistencia.horasTrabajadas.includes(':')
                                  ? asistencia.horasTrabajadas // Ya está en formato HH:MM:SS
                                  : `${asistencia.horasTrabajadas}h` // Formato antiguo (decimal)
                              }
                              size="small"
                              sx={{
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.dark, 0.3)} 100%)`,
                                color: theme.palette.success.dark
                              }}
                            />
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
      </motion.div>
    </Box>
  );
};

export default AsistenciasPage;
