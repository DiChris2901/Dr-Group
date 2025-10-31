import {
  Business,
  CalendarToday,
  Clear,
  FilterList,
  Search,
  Today
} from '@mui/icons-material';
import {
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
  Typography,
  alpha,
  Avatar,
  Autocomplete
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import DateRangeFilter from '../payments/DateRangeFilter';

const CommitmentsFilters = ({ 
  onSearchChange, 
  onCompanyChange, 
  onStatusChange,
  onDateRangeChange,
  onCustomDateRangeChange,
  onApplyFilters,
  onClearFilters,
  searchTerm = '',
  companyFilter = 'all',
  statusFilter = 'all',
  dateRangeFilter = 'all',
  customStartDate = null,
  customEndDate = null,
  hasFiltersChanged = false,
  filtersApplied = false
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesData = [];
        companiesSnapshot.forEach((doc) => {
          companiesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchCompanies();
    }
  }, [currentUser]);

  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleCompanyChange = (event, newValue) => {
    // Si es del autocomplete (newValue), usar el id, si es del select normal usar event.target.value
    const value = newValue ? (newValue.id || newValue) : event.target.value;
    onCompanyChange(value);
  };

  const handleStatusChange = (event) => {
  onStatusChange(event.target.value);
  };



  const handleStatusAutoChange = (event, option) => {
    const value = option ? option.value : 'all';
    onStatusChange(value);
  };

  const handleDateRangeChange = (value) => {
    onDateRangeChange(value);
  };

  const handleCustomDateRangeChange = (startDate, endDate) => {
    onCustomDateRangeChange(startDate, endDate);
  };

  const handleKeyDownApply = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onApplyFilters) onApplyFilters();
    }
  };

  const handleClearFilters = () => {
    console.log('🧹 [FILTERS] *** CLEARING ALL FILTERS ***');
    
    // ✅ Limpiar todos los filtros del padre
    onSearchChange('');
    onCompanyChange('all');
    onStatusChange('all');
    onDateRangeChange('all');
    onCustomDateRangeChange(null, null);
    
    // ✅ Llamar onClearFilters del componente padre
    if (onClearFilters) {
      console.log('🧹 [FILTERS] *** CALLING PARENT onClearFilters ***');
      onClearFilters();
    } else {
      console.log('🧹 [FILTERS] *** NO PARENT onClearFilters AVAILABLE ***');
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: 'default', icon: '📋' },
    { value: 'overdue', label: 'Vencidos', color: 'error', icon: '🔴' },
    { value: 'due-soon', label: 'Próximos a vencer', color: 'warning', icon: '⚠️' },
    { value: 'pending', label: 'Pendientes', color: 'info', icon: '⏳' },
    { value: 'paid', label: 'Pagados', color: 'success', icon: '✅' }
  ];

  const hasActiveFilters = searchTerm || companyFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all';

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
          <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
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
                  Filtros de Búsqueda
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Encuentra rápidamente los compromisos que necesitas
                </Typography>
              </Box>
            </Box>
            
            {/* Botón Limpiar Filtros reubicado abajo */}
          </Box>

          <Grid container spacing={3}>
            {/* Campo de búsqueda */}
            <Grid item xs={12} lg={2.4} md={4} sm={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TextField
                  fullWidth
                  label="Buscar compromisos"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Descripción, empresa, beneficiario, # factura..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.paper,
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
                          onClick={handleClearSearch}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { color: 'error.main' }
                          }}
                        >
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </motion.div>
            </Grid>

            {/* Filtro por empresa con Autocomplete */}
            <Grid item xs={12} lg={2.4} md={4} sm={6}>
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Autocomplete
                  fullWidth
                  options={[{ id: 'all', name: 'Todas las empresas' }, ...companies]}
                  value={companies.find(c => c.id === companyFilter) || { id: 'all', name: 'Todas las empresas' }}
                  onChange={handleCompanyChange}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box key={key} {...otherProps} component="li" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.id === 'all' ? (
                          <Business sx={{ color: 'text.secondary', fontSize: 20 }} />
                        ) : option.logoURL ? (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 0.5,
                            backgroundColor: 'background.paper'
                          }}
                        >
                          <Box
                            component="img"
                            src={option.logoURL}
                            alt={`Logo de ${option.name}`}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        </Box>
                      ) : (
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: 'primary.main',
                            fontSize: 12,
                            fontWeight: 'bold'
                          }}
                        >
                          {option.name.charAt(0)}
                        </Avatar>
                      )}
                      <Typography variant="body2">
                        {option.name}
                      </Typography>
                    </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Empresa"
                      placeholder="Buscar empresa..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
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
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business color="primary" />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                  noOptionsText="No se encontraron empresas"
                  loading={loading}
                />
              </motion.div>
            </Grid>

            {/* Filtro por estado (Autocomplete) */}
            <Grid item xs={12} lg={2.4} md={4} sm={6}>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <Autocomplete
                  disablePortal
                  options={statusOptions}
                  value={statusOptions.find(o => o.value === statusFilter) || statusOptions[0]}
                  onChange={handleStatusAutoChange}
                  getOptionLabel={(o) => o.label}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Estado"
                      onKeyDown={handleKeyDownApply}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
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
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <Today color="primary" />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </motion.div>
            </Grid>

            {/* Filtro por fechas */}
            <Grid item xs={12} lg={2.4} md={6} sm={6}>
              <DateRangeFilter
                value={dateRangeFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onChange={handleDateRangeChange}
                onCustomRangeChange={handleCustomDateRangeChange}
              />
            </Grid>
          </Grid>

          {/* Chips de filtros activos */}
          {hasActiveFilters && filtersApplied && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Box mt={3} pt={2} borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Filtros activos:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {searchTerm && (
                    <Chip
                      label={`Búsqueda: "${searchTerm}"`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => onSearchChange('')}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                  {companyFilter !== 'all' && (
                    <Chip
                      label={`Empresa: ${companies.find(c => c.id === companyFilter)?.name || companyFilter}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      onDelete={() => onCompanyChange('all')}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                  {statusFilter !== 'all' && (
                    <Chip
                      label={`Estado: ${statusOptions.find(s => s.value === statusFilter)?.label || statusFilter}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      onDelete={() => onStatusChange('all')}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                  {dateRangeFilter !== 'all' && (
                    <Chip
                      label={`Período: ${dateRangeFilter === 'custom' && customStartDate && customEndDate 
                        ? `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`
                        : dateRangeFilter}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onDelete={() => {
                        onDateRangeChange('all');
                        onCustomDateRangeChange(null, null);
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  )}
                </Box>
              </Box>
            </motion.div>
          )}

          {/* ✅ BOTONES DE ACCIÓN PARA FILTROS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: 2,
              mt: 3,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                onClick={onApplyFilters}
                disabled={!hasFiltersChanged && filtersApplied}
                sx={{
                  minWidth: 160,
                  py: 1.5,
                  px: 3,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  background: hasFiltersChanged || !filtersApplied 
                    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                    : theme.palette.action.disabled,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    background: hasFiltersChanged || !filtersApplied 
                      ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                      : theme.palette.action.disabled,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                  }
                }}
              >
                {filtersApplied && !hasFiltersChanged ? 'Filtros Aplicados' : 'Aplicar Filtros'}
              </Button>
              {hasActiveFilters && filtersApplied && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  sx={{
                    minWidth: 140,
                    py: 1.5,
                    px: 3,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: alpha(theme.palette.error.main, 0.5),
                    color: theme.palette.error.main,
                    backgroundColor: alpha(theme.palette.error.main, 0.05),
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Limpiar Filtros
                </Button>
              )}
            </Box>
          </motion.div>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default CommitmentsFilters;
