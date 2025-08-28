import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Stack,
  useTheme
} from '@mui/material';
import {
  Clear,
  Search,
  FilterAlt
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Componente de filtros para la página de auditoría
 * Diseño sobrio con filtros avanzados para logs de actividad
 */
const ActivityFilters = ({ filters, onFiltersChange, onKeyPress }) => {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);
  const [users, setUsers] = useState([]);

  // Opciones predefinidas para los filtros
  const actionOptions = [
    { value: '', label: 'Todas las acciones' },
    { value: 'create_commitment', label: 'Crear Compromiso' },
    { value: 'update_commitment', label: 'Editar Compromiso' },
    { value: 'delete_commitment', label: 'Eliminar Compromiso' },
    { value: 'create_payment', label: 'Registrar Pago' },
    { value: 'update_payment', label: 'Editar Pago' },
    { value: 'delete_payment', label: 'Eliminar Pago' },
    { value: 'view_report', label: 'Ver Reporte' },
    { value: 'download_report', label: 'Descargar Reporte' },
    { value: 'export_data', label: 'Exportar Datos' },
    { value: 'login', label: 'Iniciar Sesión' },
    { value: 'logout', label: 'Cerrar Sesión' },
    { value: 'profile_update', label: 'Actualizar Perfil' }
  ];

  const entityTypeOptions = [
    { value: '', label: 'Todas las entidades' },
    { value: 'commitment', label: 'Compromiso' },
    { value: 'payment', label: 'Pago' },
    { value: 'report', label: 'Reporte' },
    { value: 'user', label: 'Usuario' },
    { value: 'auth', label: 'Autenticación' },
    { value: 'system', label: 'Sistema' }
  ];

  const userRoleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'super_admin', label: 'Super Administrador' },
    { value: 'user', label: 'Usuario' },
    { value: 'viewer', label: 'Solo Lectura' }
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Cargar usuarios disponibles
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = [];
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersList.push({
            id: doc.id,
            name: userData.name || userData.displayName || 'Sin nombre',
            email: userData.email,
            displayText: `${userData.name || userData.displayName || 'Sin nombre'} (${userData.email})`
          });
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };

    loadUsers();
  }, []);

  const handleFilterChange = (field, value) => {
    const newFilters = {
      ...localFilters,
      [field]: value
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      userId: '',
      action: '',
      entityType: '',
      startDate: null,
      endDate: null,
      userRole: ''
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== '' && value !== null
  );

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Filtro por acción */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Acción</InputLabel>
            <Select
              value={localFilters.action || ''}
              label="Tipo de Acción"
              onChange={(e) => handleFilterChange('action', e.target.value)}
              sx={{
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${theme.palette.primary.main}60`
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${theme.palette.primary.main}80`
                }
              }}
            >
              {actionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

          {/* Filtro por tipo de entidad */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Entidad</InputLabel>
              <Select
                value={localFilters.entityType || ''}
                label="Tipo de Entidad"
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${theme.palette.primary.main}60`
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${theme.palette.primary.main}80`
                  }
                }}
              >
                {entityTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por rol de usuario */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Rol de Usuario</InputLabel>
              <Select
                value={localFilters.userRole || ''}
                label="Rol de Usuario"
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${theme.palette.primary.main}60`
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${theme.palette.primary.main}80`
                  }
                }}
              >
                {userRoleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Botón limpiar filtros */}
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              startIcon={<Clear />}
              sx={{
                height: 40,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  bgcolor: theme.palette.error.light + '10'
                }
              }}
            >
              Limpiar Filtros
            </Button>
          </Grid>

          {/* Filtro por fecha de inicio */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha de Inicio"
              value={localFilters.startDate ? 
                localFilters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleFilterChange('startDate', date);
              }}
              onKeyPress={onKeyPress}
              InputLabelProps={{
                shrink: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${theme.palette.primary.main}60`
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${theme.palette.primary.main}80`
                }
              }}
            />
          </Grid>

          {/* Filtro por fecha de fin */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha de Fin"
              value={localFilters.endDate ? 
                localFilters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleFilterChange('endDate', date);
              }}
              onKeyPress={onKeyPress}
              InputLabelProps={{
                shrink: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${theme.palette.primary.main}60`
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${theme.palette.primary.main}80`
                }
              }}
            />
          </Grid>

          {/* Selector de usuario */}
          <Grid item xs={12} sm={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Usuario</InputLabel>
              <Select
                value={localFilters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                label="Usuario"
                sx={{
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${theme.palette.primary.main}60`
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${theme.palette.primary.main}80`
                  }
                }}
              >
                <MenuItem value="">
                  <em>Todos los usuarios</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.displayText}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {localFilters.action && (
                <Chip
                  label={`Acción: ${actionOptions.find(opt => opt.value === localFilters.action)?.label}`}
                  onDelete={() => handleFilterChange('action', '')}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {localFilters.entityType && (
                <Chip
                  label={`Entidad: ${entityTypeOptions.find(opt => opt.value === localFilters.entityType)?.label}`}
                  onDelete={() => handleFilterChange('entityType', '')}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
              {localFilters.userRole && (
                <Chip
                  label={`Rol: ${userRoleOptions.find(opt => opt.value === localFilters.userRole)?.label}`}
                  onDelete={() => handleFilterChange('userRole', '')}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              )}
              {localFilters.userId && (
                <Chip
                  label={`Usuario: ${localFilters.userId}`}
                  onDelete={() => handleFilterChange('userId', '')}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              )}
              {localFilters.startDate && (
                <Chip
                  label={`Desde: ${localFilters.startDate.toLocaleDateString()}`}
                  onDelete={() => handleFilterChange('startDate', null)}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              )}
              {localFilters.endDate && (
                <Chip
                  label={`Hasta: ${localFilters.endDate.toLocaleDateString()}`}
                  onDelete={() => handleFilterChange('endDate', null)}
                  color="error"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}
      </Box>
  );
};

export default ActivityFilters;
