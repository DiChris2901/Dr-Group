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
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const CommitmentsFilters = ({ 
  onSearchChange, 
  onCompanyChange, 
  onStatusChange,
  onYearChange,
  onApplyFilters,
  onClearFilters,
  searchTerm = '',
  companyFilter = 'all',
  statusFilter = 'all',
  yearFilter = 'all',
  hasFiltersChanged = false,
  filtersApplied = false
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
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

    const fetchAvailableYears = async () => {
      try {
        const commitmentsSnapshot = await getDocs(collection(db, 'commitments'));
        const years = new Set();
        commitmentsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.dueDate) {
            const date = data.dueDate.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
            years.add(date.getFullYear());
          }
        });
        
        // Convertir a array y ordenar de mayor a menor
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        setAvailableYears(sortedYears);
      } catch (error) {
        console.error('Error fetching available years:', error);
      }
    };

    if (currentUser) {
      fetchCompanies();
      fetchAvailableYears();
    }
  }, [currentUser]);

  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleCompanyChange = (event) => {
    onCompanyChange(event.target.value);
  };

  const handleStatusChange = (event) => {
    onStatusChange(event.target.value);
  };

  const handleYearChange = (event) => {
    onYearChange(event.target.value);
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onCompanyChange('all');
    onStatusChange('all');
    onYearChange('all');
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: 'default', icon: '📋' },
    { value: 'overdue', label: 'Vencidos', color: 'error', icon: '🔴' },
    { value: 'due-soon', label: 'Próximos a vencer', color: 'warning', icon: '⚠️' },
    { value: 'pending', label: 'Pendientes', color: 'info', icon: '⏳' },
    { value: 'paid', label: 'Pagados', color: 'success', icon: '✅' }
  ];

  const hasActiveFilters = searchTerm || companyFilter !== 'all' || statusFilter !== 'all' || yearFilter !== 'all';

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
            
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
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

          <Grid container spacing={3}>
            {/* Campo de búsqueda */}
            <Grid item xs={12} md={3}>
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
                  placeholder="Descripción, empresa, tipo..."
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

            {/* Filtro por empresa */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
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
                    value={companyFilter}
                    onChange={handleCompanyChange}
                    label="Empresa"
                    startAdornment={
                      <InputAdornment position="start">
                        <Business color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">
                      <Box display="flex" alignItems="center">
                        <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        Todas las empresas
                      </Box>
                    </MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          {company.logoURL ? (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 0.5,
                                backgroundColor: 'background.paper'
                              }}
                            >
                              <Box
                                component="img"
                                src={company.logoURL}
                                alt={`Logo de ${company.name}`}
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
                                mr: 1, 
                                bgcolor: 'primary.main',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}
                            >
                              {company.name.charAt(0)}
                            </Avatar>
                          )}
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {company.name}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por estado */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
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
                    value={statusFilter}
                    onChange={handleStatusChange}
                    label="Estado"
                    startAdornment={
                      <InputAdornment position="start">
                        <Today color="primary" />
                      </InputAdornment>
                    }
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: option.value === 'all' ? 'text.primary' : `${option.color}.main`,
                            fontWeight: option.value === 'all' ? 'normal' : 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          {option.icon} {option.label}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por año */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
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
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={yearFilter}
                    onChange={handleYearChange}
                    label="Año"
                    startAdornment={
                      <InputAdornment position="start">
                        <CalendarToday color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        📅 Todos los años
                      </Typography>
                    </MenuItem>
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            color: 'primary.main',
                            fontWeight: 500 
                          }}
                        >
                          🗓️ {year}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>
          </Grid>

          {/* Chips de filtros activos */}
          {hasActiveFilters && (
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
                  {yearFilter !== 'all' && (
                    <Chip
                      label={`Año: ${yearFilter}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onDelete={() => onYearChange('all')}
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

              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={onClearFilters}
                disabled={!filtersApplied && !hasFiltersChanged}
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
            </Box>
          </motion.div>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default CommitmentsFilters;
