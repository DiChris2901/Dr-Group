import {
  Business,
  CalendarMonth,
  Clear,
  FilterList,
  GridView as GridViewIcon,
  Refresh as RefreshIcon,
  Search,
  ViewKanban as ViewKanbanIcon,
  Assignment,
  Person,
  Flag
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const TasksFilters = ({
  onSearchChange,
  onPriorityChange,
  onAssignmentChange,
  onCompanyChange,
  onUserChange,
  onMonthChange,
  onViewModeChange,
  onApplyFilters,
  onClearFilters,
  onRefresh,
  searchTerm = '',
  filterPriority = 'all',
  filterAssignment = 'all',
  filterCompany = 'all',
  filterUser = 'all',
  filterMonth = 'all',
  viewMode = 'grid',
  companies = [],
  users = [],
  hasFiltersChanged = false,
  filtersApplied = false,
  userProfile = null
}) => {
  const theme = useTheme();

  // Generar opciones de los últimos 13 meses (mes actual + 12 anteriores)
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const date = subMonths(startOfMonth(new Date()), i);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: es });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  // Determinar permisos del usuario
  const hasPermissionVerTodas = userProfile?.permissions?.['tareas.ver_todas'] || 
                                userProfile?.permissions?.['tareas'] || // Permiso padre incluye ver todas
                                (Array.isArray(userProfile?.permissions) && 
                                 (userProfile?.permissions.includes('tareas.ver_todas') ||
                                  userProfile?.permissions.includes('tareas')));
  
  const hasPermissionAsignar = userProfile?.permissions?.['tareas.asignar'] || 
                               userProfile?.permissions?.['tareas'] || // Permiso padre incluye asignar
                               (Array.isArray(userProfile?.permissions) && 
                                (userProfile?.permissions.includes('tareas.asignar') ||
                                 userProfile?.permissions.includes('tareas')));

  // Filtrar opciones de asignación según permisos
  const getAssignmentOptions = () => {
    const allOptions = [
      { value: 'all', label: 'Todas las tareas', icon: '📋', requiresPermission: 'tareas.ver_todas' },
      { value: 'mine', label: 'Mis Tareas', icon: '👤', requiresPermission: null },
      { value: 'created', label: 'Creadas por Mí', icon: '✏️', requiresPermission: 'tareas.crear' },
      { value: 'unassigned', label: 'Sin Asignar', icon: '❓', requiresPermission: 'tareas.asignar' }
    ];

    return allOptions.filter(option => {
      if (!option.requiresPermission) return true; // Opciones disponibles para todos
      
      if (option.requiresPermission === 'tareas.ver_todas') {
        return hasPermissionVerTodas;
      }
      
      if (option.requiresPermission === 'tareas.crear') {
        return userProfile?.permissions?.['tareas.crear'] || 
               userProfile?.permissions?.['tareas'] || 
               (Array.isArray(userProfile?.permissions) && 
                (userProfile?.permissions.includes('tareas.crear') ||
                 userProfile?.permissions.includes('tareas')));
      }
      
      if (option.requiresPermission === 'tareas.asignar') {
        return hasPermissionAsignar; // Solo usuarios con permiso de asignar
      }
      
      return false;
    });
  };

  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (onApplyFilters) onApplyFilters();
    }
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handlePriorityChange = (event) => {
    onPriorityChange(event.target.value);
  };

  const handleAssignmentChange = (event) => {
    onAssignmentChange(event.target.value);
  };

  const handleCompanyChange = (event) => {
    onCompanyChange(event.target.value);
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      onViewModeChange(newMode);
    }
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onPriorityChange('all');
    onAssignmentChange('all');
    onCompanyChange('all');
    if (onUserChange) onUserChange('all');
    if (onMonthChange) onMonthChange('all');
    if (onClearFilters) onClearFilters();
  };

  const priorityOptions = [
    { value: 'all', label: 'Todas las prioridades', color: 'default', icon: '📋' },
    { value: 'urgente', label: 'Urgentes', color: 'error', icon: '🔴' },
    { value: 'alta', label: 'Alta', color: 'warning', icon: '🟠' },
    { value: 'media', label: 'Media', color: 'info', icon: '🔵' },
    { value: 'baja', label: 'Baja', color: 'success', icon: '🟢' }
  ];

  // Obtener opciones de asignación según permisos del usuario
  const assignmentOptions = getAssignmentOptions();

  // Determinar filtro de asignación por defecto según permisos
  const defaultAssignmentFilter = hasPermissionVerTodas ? 'all' : 'mine';

  // Siempre habilitar "Limpiar" si hay filtros aplicados
  const hasActiveFilters = filtersApplied;

  const getActiveFiltersCount = () => {
    if (!filtersApplied) return 0;
    let count = 1; // asignación siempre cuenta
    if (searchTerm) count++;
    if (filterPriority !== 'all') count++;
    if (filterCompany !== 'all') count++;
    if (filterUser !== 'all') count++;
    if (filterMonth !== 'all') count++;
    return count;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
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
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <FilterList 
                  sx={{ 
                    mr: 2, 
                    color: 'primary.main',
                    fontSize: 28
                  }} 
                />
              </motion.div>
              <Box>
                <Typography 
                  variant="h5" 
                  color="primary.main"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Filtros de Tareas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Organiza y encuentra tareas con filtros avanzados
                </Typography>
              </Box>
            </Box>

            {/* Toggle View Mode */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
                sx={{ 
                  '& .MuiToggleButton-root': { 
                    borderRadius: 1,
                    px: 2
                  } 
                }}
              >
                <ToggleButton value="grid">
                  <Tooltip title="Vista Grid">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GridViewIcon fontSize="small" />
                      <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Grid
                      </Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="kanban">
                  <Tooltip title="Vista Kanban">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ViewKanbanIcon fontSize="small" />
                      <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Kanban
                      </Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>

              <Tooltip title="Refrescar tareas">
                <IconButton 
                  size="small"
                  onClick={onRefresh}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Una sola fila: 5 dropdowns + botones */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Prioridad */}
            <Box sx={{ flex: '1 1 140px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridad</InputLabel>
                <Select value={filterPriority} onChange={handlePriorityChange}
                  label="Prioridad" sx={{ borderRadius: 1 }}>
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Asignación */}
            <Box sx={{ flex: '1 1 140px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Asignación</InputLabel>
                <Select value={filterAssignment} onChange={handleAssignmentChange}
                  label="Asignación" disabled={!hasPermissionVerTodas} sx={{ borderRadius: 1 }}>
                  {assignmentOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Empresa */}
            <Box sx={{ flex: '1 1 150px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Empresa</InputLabel>
                <Select value={filterCompany} onChange={handleCompanyChange}
                  label="Empresa" sx={{ borderRadius: 1 }}>
                  <MenuItem value="all">Todas las empresas</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>{company.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Usuario asignado */}
            <Box sx={{ flex: '1 1 150px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Usuario asignado</InputLabel>
                <Select value={filterUser}
                  onChange={(e) => onUserChange && onUserChange(e.target.value)}
                  label="Usuario asignado" sx={{ borderRadius: 1 }}>
                  <MenuItem value="all">Todos los usuarios</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.uid} value={user.uid}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={user.photoURL} sx={{ width: 20, height: 20, fontSize: '0.65rem' }}>
                          {(user.nombre || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <span>{user.nombre}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Mes de creación */}
            <Box sx={{ flex: '1 1 140px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Mes de creación</InputLabel>
                <Select value={filterMonth}
                  onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
                  label="Mes de creación" sx={{ borderRadius: 1 }}>
                  <MenuItem value="all">Todos los meses</MenuItem>
                  {monthOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Botones — siempre al final */}
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, ml: 'auto' }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                size="small"
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, minWidth: 80 }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onApplyFilters}
                disabled={!hasFiltersChanged}
                size="small"
                sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, minWidth: 80,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                Aplicar
              </Button>
            </Box>

          </Box>



          {/* Chips de Filtros Activos */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3 }}
            >
              <Box 
                sx={{ 
                  mt: 3, 
                  pt: 2.5, 
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap'
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Filtros activos ({getActiveFiltersCount()}):
                </Typography>

                {searchTerm && (
                  <Chip
                    label={`Búsqueda: "${searchTerm}"`}
                    onDelete={handleClearSearch}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}

                {filterPriority !== 'all' && (
                  <Chip
                    label={`Prioridad: ${priorityOptions.find(o => o.value === filterPriority)?.label}`}
                    onDelete={() => onPriorityChange('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}

                {filtersApplied && (
                  <Chip
                    label={`Asignación: ${assignmentOptions.find(o => o.value === filterAssignment)?.label}`}
                    onDelete={() => onAssignmentChange(defaultAssignmentFilter)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}

                {filterCompany !== 'all' && (
                  <Chip
                    label={`Empresa: ${companies.find(c => c.id === filterCompany)?.nombre || 'Seleccionada'}`}
                    onDelete={() => onCompanyChange('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}

                {filterUser !== 'all' && (
                  <Chip
                    label={`Asignado a: ${users.find(u => u.uid === filterUser)?.nombre || 'Usuario'}`}
                    onDelete={() => onUserChange && onUserChange('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}

                {filterMonth !== 'all' && (
                  <Chip
                    label={`Mes: ${monthOptions.find(m => m.value === filterMonth)?.label || filterMonth}`}
                    onDelete={() => onMonthChange && onMonthChange('all')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                )}
              </Box>
            </motion.div>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default TasksFilters;
