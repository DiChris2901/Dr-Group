import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  LinearProgress,
  useTheme,
  Stack,
  Divider,
  Button,
  alpha,
  TablePagination
} from '@mui/material';
import {
  Security,
  Assessment,
  FilterList,
  Download,
  Refresh,
  Visibility,
  Person,
  Schedule,
  TrendingUp,
  Business
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks y contextos
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import useActivityLogs from '../hooks/useActivityLogs';

// Componentes
import ActivityLogTable from '../components/admin/ActivityLogTable';
import ActivityFilters from '../components/admin/ActivityFilters';
import ActivityStats from '../components/admin/ActivityStats';
import ActivityExporter from '../components/admin/ActivityExporter';
import ActivityAlertsConfig from '../components/admin/ActivityAlertsConfig';
import ActivityCharts from '../components/admin/ActivityCharts';

/**
 * Página de Auditoría y Logs de Actividad
 * Permite a los administradores ver todas las actividades del sistema
 * Diseño sobrio y profesional siguiendo las reglas de desarrollo
 */
const ActivityLogsPage = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { 
    logs, 
    loading, 
    error, 
    getActivityLogs, 
    subscribeToRecentLogs, 
    getActivityStats 
  } = useActivityLogs();

  // Estados locales
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: null,
    endDate: null,
    userRole: ''
  });
  const [appliedFilters, setAppliedFilters] = useState(null); // Filtros aplicados
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'stats'
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  
  // Estados para Fase 2
  const [showCharts, setShowCharts] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Verificar permisos de administrador
  const hasAdminAccess = userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN';

  useEffect(() => {
    // Solo cargar si tiene permisos de admin
    if (!hasAdminAccess) return;

    // NO cargar logs iniciales automáticamente
    // Solo cargar estadísticas
    loadStats();
    
    // NO suscribirse automáticamente - solo cuando se apliquen filtros
  }, [hasAdminAccess]);

  // Función para aplicar filtros
  const handleApplyFilters = async () => {
    if (!hasAdminAccess) return;
    
    setAppliedFilters({ ...filters });
    setPage(0); // Resetear paginación
    
    // Cargar logs con filtros aplicados
    await loadActivityLogs();
    
    // Si hay filtros, suscribirse a tiempo real
    if (Object.values(filters).some(v => v !== '' && v !== null)) {
      const unsubscribe = subscribeToRecentLogs(filters, 100);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: null,
      endDate: null,
      userRole: ''
    });
    setAppliedFilters(null);
    setPage(0);
  };

  // Función para manejar Enter en los filtros
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Función para cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const loadActivityLogs = async (customFilters = filters) => {
    try {
      await getActivityLogs(customFilters, 200);
    } catch (error) {
      addNotification({
        type: 'error',
        title: '❌ Error al cargar logs',
        message: `No se pudieron cargar los logs de actividad: ${error.message}`,
        duration: 5000
      });
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getActivityStats(30); // Últimos 30 días
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    loadActivityLogs(newFilters);
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadActivityLogs(),
      loadStats()
    ]);
    setRefreshing(false);
    
    addNotification({
      type: 'success',
      title: '🔄 Datos Actualizados',
      message: 'Los datos de auditoría se han actualizado correctamente',
      duration: 3000
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadActivityLogs(),
      loadStats()
    ]);
    setRefreshing(false);
    
    addNotification({
      type: 'success',
      title: '🔄 Logs Actualizados',
      message: 'Los logs de actividad se han actualizado correctamente',
      duration: 3000
    });
  };

  const handleExportLogs = () => {
    // TODO: Implementar exportación a Excel/CSV
    addNotification({
      type: 'info',
      title: '📊 Exportación',
      message: 'Funcionalidad de exportación próximamente disponible',
      duration: 4000
    });
  };

  // Si no tiene permisos de administrador
  if (!hasAdminAccess) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card sx={{ 
            maxWidth: 500,
            textAlign: 'center',
            borderRadius: 1,
            border: `1px solid ${theme.palette.primary.main}60`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            '&:hover': {
              borderColor: `${theme.palette.primary.main}80`
            }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Security sx={{ 
                fontSize: 64, 
                color: theme.palette.warning.main,
                mb: 2
              }} />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Acceso Restringido
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Esta página requiere permisos de administrador para acceder a los logs de auditoría del sistema.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con diseño sobrio */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 1,
          border: `1px solid ${theme.palette.primary.main}60`,
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          mb: 3,
          '&:hover': {
            borderColor: `${theme.palette.primary.main}80`
          }
        }}>
          <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography variant="overline" sx={{
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              ADMINISTRACIÓN • AUDITORÍA
            </Typography>
            <Typography variant="h4" sx={{
              fontWeight: 700, 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              🔍 Auditoría del Sistema
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Registro completo de actividades y acciones de usuarios
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Indicador de carga global */}
      {(loading || refreshing) && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
      )}

      {/* Alerta de error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Error al cargar los logs: {error}
        </Alert>
      )}

      {/* Estadísticas rápidas */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ActivityStats stats={stats} />
        </motion.div>
      )}

      {/* Controles Fase 2 - Funcionalidades avanzadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <Card sx={{
          mb: 3,
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:hover': {
            borderColor: `${theme.palette.secondary.main}80`
          }
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp color="secondary" />
                <Typography variant="h6" fontWeight={600}>
                  Herramientas Avanzadas
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={showCharts ? 'contained' : 'outlined'}
                  startIcon={<Assessment />}
                  onClick={() => setShowCharts(!showCharts)}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Gráficos
                </Button>

                <Button
                  variant={showAlerts ? 'contained' : 'outlined'}
                  startIcon={<Security />}
                  onClick={() => setShowAlerts(!showAlerts)}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Alertas
                </Button>

                <ActivityExporter 
                  logs={logs} 
                  filters={filters} 
                  stats={stats} 
                />

                <IconButton
                  onClick={handleRefreshData}
                  disabled={refreshing}
                  size="small"
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 1
                  }}
                >
                  <Refresh />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gráficos avanzados - Fase 2 */}
      {showCharts && (
        <ActivityCharts logs={logs} stats={stats} />
      )}

      {/* Configuración de alertas - Fase 2 */}
      {showAlerts && (
        <ActivityAlertsConfig onConfigSave={(config) => {
          console.log('Configuración de alertas guardada:', config);
          addNotification({
            type: 'success',
            message: 'Configuración de alertas guardada exitosamente'
          });
        }} />
      )}

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card sx={{ 
          mb: 3,
          borderRadius: 1,
          border: `1px solid ${theme.palette.primary.main}60`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:hover': {
            borderColor: `${theme.palette.primary.main}80`
          }
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2 
            }}>
              <FilterList color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Filtros de Búsqueda
              </Typography>
            </Box>
            <ActivityFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onKeyPress={handleKeyPress}
            />
            
            {/* Botones de acción para filtros */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: 2, 
              justifyContent: 'flex-end' 
            }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                disabled={loading}
                sx={{ borderRadius: 1 }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                disabled={loading}
                startIcon={<FilterList />}
                sx={{ borderRadius: 1 }}
              >
                Aplicar Filtros
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card sx={{ 
          borderRadius: 1,
          border: `1px solid ${theme.palette.primary.main}60`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          '&:hover': {
            borderColor: `${theme.palette.primary.main}80`
          }
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2,
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Registro de Actividades
                </Typography>
              </Box>
              
              {appliedFilters && (
                <Chip
                  label={`${logs.length} registros filtrados`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
            
            {/* Contenido condicional */}
            {!appliedFilters ? (
              // Mensaje cuando no hay filtros aplicados
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: theme.palette.text.secondary
              }}>
                <Security sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Esperando filtros de búsqueda
                </Typography>
                <Typography variant="body2">
                  Aplica filtros para ver los registros de auditoría del sistema
                </Typography>
              </Box>
            ) : (
              // Tabla con paginación cuando hay filtros aplicados
              <>
                <ActivityLogTable 
                  logs={logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
                  loading={loading}
                />
                
                {/* Paginación */}
                {logs.length > 0 && (
                  <TablePagination
                    component="div"
                    count={logs.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10]}
                    labelDisplayedRows={({ from, to, count }) => 
                      `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                    labelRowsPerPage="Registros por página:"
                    sx={{
                      mt: 2,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      pt: 2
                    }}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ActivityLogsPage;
