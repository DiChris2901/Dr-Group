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
  useTheme,
  Paper,
  Typography,
  Avatar,
  alpha
} from '@mui/material';
import {
  Clear,
  Search,
  FilterAlt,
  Person,
  Business,
  CalendarToday,
  Assignment,
  Security
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';

/**
 * Componente de filtros para la página de auditoría
 * Diseño sobrio con filtros avanzados para logs de actividad
 */
const ActivityFilters = ({ filters, onFiltersChange, onKeyPress }) => {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);
  const [users, setUsers] = useState([]);

  // Opciones predefinidas para los filtros con iconos y colores
  const actionOptions = [
    { value: '', label: '📋 Todas las acciones', color: theme.palette.grey[600] },
    { value: 'create_commitment', label: '➕ Crear Compromiso', color: theme.palette.success.main },
    { value: 'update_commitment', label: '✏️ Editar Compromiso', color: theme.palette.warning.main },
    { value: 'delete_commitment', label: '🗑️ Eliminar Compromiso', color: theme.palette.error.main },
    { value: 'create_payment', label: '💰 Registrar Pago', color: theme.palette.success.main },
    { value: 'update_payment', label: '💳 Editar Pago', color: theme.palette.warning.main },
    { value: 'delete_payment', label: '❌ Eliminar Pago', color: theme.palette.error.main },
    { value: 'view_report', label: '👁️ Ver Reporte', color: theme.palette.info.main },
    { value: 'download_report', label: '📄 Descargar Reporte', color: theme.palette.info.main },
    { value: 'export_data', label: '📊 Exportar Datos', color: theme.palette.secondary.main },
    { value: 'login', label: '🔑 Iniciar Sesión', color: theme.palette.success.main },
    { value: 'logout', label: '🚪 Cerrar Sesión', color: theme.palette.warning.main },
    { value: 'profile_update', label: '👤 Actualizar Perfil', color: theme.palette.info.main }
  ];

  const entityTypeOptions = [
    { value: '', label: '🌐 Todas las entidades', color: theme.palette.grey[600] },
    { value: 'commitment', label: '📝 Compromiso', color: theme.palette.primary.main },
    { value: 'payment', label: '💸 Pago', color: theme.palette.success.main },
    { value: 'report', label: '📈 Reporte', color: theme.palette.info.main },
    { value: 'user', label: '👥 Usuario', color: theme.palette.secondary.main },
    { value: 'auth', label: '🔐 Autenticación', color: theme.palette.warning.main },
    { value: 'system', label: '⚙️ Sistema', color: theme.palette.error.main }
  ];

  const userRoleOptions = [
    { value: '', label: '👨‍💼 Todos los roles', color: theme.palette.grey[600] },
    { value: 'admin', label: '🛡️ Administrador', color: theme.palette.primary.main },
    { value: 'super_admin', label: '⚡ Super Administrador', color: theme.palette.error.main },
    { value: 'user', label: '👤 Usuario', color: theme.palette.success.main },
    { value: 'viewer', label: '👁️ Solo Lectura', color: theme.palette.info.main }
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
            : `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.3)'
            : '0 8px 32px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.3),
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 48px rgba(0,0,0,0.4)'
              : '0 12px 48px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        {/* Header elegante */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <FilterAlt sx={{ 
              color: theme.palette.primary.main, 
              fontSize: 24 
            }} />
          </motion.div>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: '1.1rem'
          }}>
            Filtros de Búsqueda
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Filtro por acción */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: theme.palette.primary.main,
                    fontWeight: 700
                  }
                }}>
                  Tipo de Acción
                </InputLabel>
                <Select
                  value={localFilters.action || ''}
                  label="Tipo de Acción"
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  sx={{
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8) 
                      : 'white',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        mt: 0.5
                      }
                    }
                  }}
                >
                  {actionOptions.map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: option.color,
                        '&:hover': {
                          backgroundColor: alpha(option.color, 0.1)
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(option.color, 0.15),
                          color: option.color,
                          fontWeight: 600
                        }
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </motion.div>
          </Grid>

          {/* Filtro por tipo de entidad */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: theme.palette.primary.main,
                    fontWeight: 700
                  }
                }}>
                  Tipo de Entidad
                </InputLabel>
                <Select
                  value={localFilters.entityType || ''}
                  label="Tipo de Entidad"
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  sx={{
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8) 
                      : 'white',
                    border: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.15)}`
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.secondary.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.2)}`
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        mt: 0.5
                      }
                    }
                  }}
                >
                  {entityTypeOptions.map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: option.color,
                        '&:hover': {
                          backgroundColor: alpha(option.color, 0.1)
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(option.color, 0.15),
                          color: option.color,
                          fontWeight: 600
                        }
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </motion.div>
          </Grid>

          {/* Filtro por rol de usuario */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: theme.palette.primary.main,
                    fontWeight: 700
                  }
                }}>
                  Rol de Usuario
                </InputLabel>
                <Select
                  value={localFilters.userRole || ''}
                  label="Rol de Usuario"
                  onChange={(e) => handleFilterChange('userRole', e.target.value)}
                  sx={{
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8) 
                      : 'white',
                    border: `2px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.info.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.15)}`
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.info.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.info.main, 0.2)}`
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        mt: 0.5
                      }
                    }
                  }}
                >
                  {userRoleOptions.map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: option.color,
                        '&:hover': {
                          backgroundColor: alpha(option.color, 0.1)
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(option.color, 0.15),
                          color: option.color,
                          fontWeight: 600
                        }
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </motion.div>
          </Grid>

          {/* Botón limpiar filtros mejorado */}
          <Grid item xs={12} sm={6} md={3}>
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
            >
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
                  fontWeight: 600,
                  border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  color: theme.palette.error.main,
                  background: alpha(theme.palette.error.main, 0.05),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: theme.palette.error.main,
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.25)}`
                  },
                  '&:disabled': {
                    borderColor: alpha(theme.palette.divider, 0.3),
                    color: theme.palette.text.disabled,
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Limpiar Filtros
              </Button>
            </motion.div>
          </Grid>

          {/* Filtro por fecha de inicio */}
          <Grid item xs={12} sm={6} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  shrink: true,
                  sx: {
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: theme.palette.success.main,
                      fontWeight: 700
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <CalendarToday sx={{ 
                      mr: 1, 
                      fontSize: 18, 
                      color: theme.palette.success.main 
                    }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8) 
                      : 'white',
                    border: `2px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.success.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.success.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.success.main, 0.2)}`
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                }}
              />
            </motion.div>
          </Grid>

          {/* Filtro por fecha de fin */}
          <Grid item xs={12} sm={6} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  shrink: true,
                  sx: {
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: theme.palette.warning.main,
                      fontWeight: 700
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <CalendarToday sx={{ 
                      mr: 1, 
                      fontSize: 18, 
                      color: theme.palette.warning.main 
                    }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8) 
                      : 'white',
                    border: `2px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.warning.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.15)}`
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.warning.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.warning.main, 0.2)}`
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                }}
              />
            </motion.div>
          </Grid>

          {/* Selector de usuario mejorado */}
          <Grid item xs={12} sm={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  '&.Mui-focused': {
                    color: theme.palette.secondary.main,
                    fontWeight: 700
                  }
                }}>
                  Usuario
                </InputLabel>
                <Select
                  value={localFilters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  label="Usuario"
                  sx={{
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8) 
                      : 'white',
                    border: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.15)}`
                    },
                    '&.Mui-focused': {
                      borderColor: theme.palette.secondary.main,
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.2)}`
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        mt: 0.5
                      }
                    }
                  }}
                >
                  <MenuItem value="">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ 
                        fontStyle: 'italic',
                        color: 'text.secondary',
                        fontWeight: 500
                      }}>
                        Todos los usuarios
                      </Typography>
                    </Box>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box display="flex" alignItems="center" gap={1.5} sx={{ width: '100%' }}>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: theme.palette.secondary.main,
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}
                        >
                          {user.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 500, 
                          flex: 1,
                          color: 'text.primary'
                        }}>
                          {user.displayText}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </motion.div>
          </Grid>
        </Grid>

        {/* Chips de filtros activos mejorados */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Security sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.secondary,
                  fontSize: '0.85rem'
                }}>
                  Filtros Activos:
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {localFilters.action && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`${actionOptions.find(opt => opt.value === localFilters.action)?.label}`}
                      onDelete={() => handleFilterChange('action', '')}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          borderColor: theme.palette.primary.main
                        }
                      }}
                    />
                  </motion.div>
                )}
                {localFilters.entityType && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`${entityTypeOptions.find(opt => opt.value === localFilters.entityType)?.label}`}
                      onDelete={() => handleFilterChange('entityType', '')}
                      color="secondary"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                          borderColor: theme.palette.secondary.main
                        }
                      }}
                    />
                  </motion.div>
                )}
                {localFilters.userRole && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`${userRoleOptions.find(opt => opt.value === localFilters.userRole)?.label}`}
                      onDelete={() => handleFilterChange('userRole', '')}
                      color="info"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        border: `2px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.info.main, 0.2),
                          borderColor: theme.palette.info.main
                        }
                      }}
                    />
                  </motion.div>
                )}
                {localFilters.userId && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`Usuario: ${users.find(u => u.id === localFilters.userId)?.name || 'Usuario'}`}
                      onDelete={() => handleFilterChange('userId', '')}
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.success.main, 0.2),
                          borderColor: theme.palette.success.main
                        }
                      }}
                    />
                  </motion.div>
                )}
                {localFilters.startDate && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`📅 Desde: ${localFilters.startDate.toLocaleDateString()}`}
                      onDelete={() => handleFilterChange('startDate', null)}
                      color="warning"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.warning.main, 0.2),
                          borderColor: theme.palette.warning.main
                        }
                      }}
                    />
                  </motion.div>
                )}
                {localFilters.endDate && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      label={`📅 Hasta: ${localFilters.endDate.toLocaleDateString()}`}
                      onDelete={() => handleFilterChange('endDate', null)}
                      color="error"
                      variant="outlined"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                          borderColor: theme.palette.error.main
                        }
                      }}
                    />
                  </motion.div>
                )}
              </Stack>
            </Box>
          </motion.div>
        )}
      </Paper>
    </motion.div>
  );
};

export default ActivityFilters;
