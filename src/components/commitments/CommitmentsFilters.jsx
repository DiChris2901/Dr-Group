import {
  Business,
  CalendarToday,
  Clear,
  Description,
  FilterList,
  Person,
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
  Autocomplete,
  Checkbox,
  ListItemText,
  OutlinedInput
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
  onConceptChange,
  onBeneficiaryChange,
  onDateRangeChange,
  onCustomDateRangeChange,
  onApplyFilters,
  onClearFilters,
  searchTerm = '',
  companyFilter = [],
  statusFilter = 'all',
  conceptFilter = [],
  beneficiaryFilter = [],
  dateRangeFilter = 'all',
  customStartDate = null,
  customEndDate = null,
  conceptOptions = [],
  beneficiaryOptions = [],
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

  const handleCompanyChange = (selectedIds) => {
    // Selección múltiple: selectedIds es un array de IDs
    onCompanyChange(selectedIds);
  };

  const handleStatusChange = (event) => {
  onStatusChange(event.target.value);
  };



  const handleStatusAutoChange = (event, option) => {
    const value = option ? option.value : 'all';
    onStatusChange(value);
  };

  const handleConceptChange = (selectedConcepts) => {
    // Selección múltiple: selectedConcepts es un array de strings
    onConceptChange(selectedConcepts);
  };

  const handleBeneficiaryChange = (selectedBeneficiaries) => {
    // Selección múltiple: selectedBeneficiaries es un array de strings
    onBeneficiaryChange(selectedBeneficiaries);
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
    
    // ✅ Limpiar todos los filtros del padre
    onSearchChange('');
    onCompanyChange([]);
    onStatusChange('all');
    onConceptChange([]);
    onBeneficiaryChange([]);
    onDateRangeChange('all');
    onCustomDateRangeChange(null, null);
    
    // ✅ Llamar onClearFilters del componente padre
    if (onClearFilters) {
      onClearFilters();
    } else {
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: 'default', icon: '📋' },
    { value: 'overdue', label: 'Vencidos', color: 'error', icon: '🔴' },
    { value: 'due-soon', label: 'Próximos a vencer', color: 'warning', icon: '⚠️' },
    { value: 'pending', label: 'Pendientes', color: 'info', icon: '⏳' },
    { value: 'paid', label: 'Pagados', color: 'success', icon: '✅' }
  ];

  const hasActiveFilters = searchTerm || companyFilter.length > 0 || statusFilter !== 'all' || conceptFilter.length > 0 || beneficiaryFilter.length > 0 || dateRangeFilter !== 'all';

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
            <Grid item xs={12} lg={2} md={4} sm={6}>
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

            {/* Filtro por empresa con Select Multiple */}
            <Grid item xs={12} lg={2} md={4} sm={6}>
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
                >
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    multiple
                    value={companyFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Handle "Select All"
                      if (value.includes('__all__')) {
                        const allSelected = companyFilter.length === companies.length;
                        handleCompanyChange(allSelected ? [] : companies.map(c => c.id));
                      } else {
                        handleCompanyChange(value);
                      }
                    }}
                    input={<OutlinedInput label="Empresa" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) {
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Todas las empresas
                          </Typography>
                        );
                      }
                      if (selected.length === 1) {
                        const company = companies.find(c => c.id === selected[0]);
                        return (
                          <Typography variant="body2">
                            {company?.name || 'Empresa'}
                          </Typography>
                        );
                      }
                      return (
                        <Typography variant="body2">
                          {selected.length} empresas
                        </Typography>
                      );
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Business color="primary" />
                      </InputAdornment>
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                          borderRadius: 8,
                          marginTop: 8
                        }
                      }
                    }}
                  >
                    <MenuItem value="__all__" sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Checkbox
                        checked={companyFilter.length === companies.length}
                        indeterminate={companyFilter.length > 0 && companyFilter.length < companies.length}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                      <ListItemText
                        primary={companyFilter.length === companies.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        ({companyFilter.length}/{companies.length})
                      </Typography>
                    </MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        <Checkbox
                          checked={companyFilter.indexOf(company.id) > -1}
                          sx={{
                            color: theme.palette.primary.main,
                            '&.Mui-checked': { color: theme.palette.primary.main }
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          {company.logoURL ? (
                            <Avatar
                              src={company.logoURL}
                              sx={{
                                width: 24,
                                height: 24,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              {company.name.charAt(0)}
                            </Avatar>
                          ) : (
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: '0.75rem',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                fontWeight: 600
                              }}
                            >
                              {company.name.charAt(0)}
                            </Avatar>
                          )}
                          <ListItemText
                            primary={company.name}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por estado (Autocomplete) */}
            <Grid item xs={12} lg={2} md={4} sm={6}>
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

            {/* Filtro por concepto */}
            <Grid item xs={12} lg={2} md={4} sm={6}>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
                <FormControl
                  fullWidth
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
                >
                  <InputLabel>Concepto</InputLabel>
                  <Select
                    multiple
                    value={conceptFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('__all__')) {
                        const allSelected = conceptFilter.length === conceptOptions.length;
                        handleConceptChange(allSelected ? [] : conceptOptions);
                      } else {
                        handleConceptChange(value);
                      }
                    }}
                    input={<OutlinedInput label="Concepto" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) {
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Todos los conceptos
                          </Typography>
                        );
                      }
                      if (selected.length === 1) {
                        return (
                          <Typography variant="body2">
                            {selected[0]}
                          </Typography>
                        );
                      }
                      return (
                        <Typography variant="body2">
                          {selected.length} conceptos
                        </Typography>
                      );
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Description color="primary" />
                      </InputAdornment>
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                          borderRadius: 8,
                          marginTop: 8
                        }
                      }
                    }}
                  >
                    <MenuItem value="__all__" sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Checkbox
                        checked={conceptFilter.length === conceptOptions.length}
                        indeterminate={conceptFilter.length > 0 && conceptFilter.length < conceptOptions.length}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                      <ListItemText
                        primary={conceptFilter.length === conceptOptions.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        ({conceptFilter.length}/{conceptOptions.length})
                      </Typography>
                    </MenuItem>
                    {conceptOptions.map((concept) => (
                      <MenuItem key={concept} value={concept}>
                        <Checkbox
                          checked={conceptFilter.indexOf(concept) > -1}
                          sx={{
                            color: theme.palette.primary.main,
                            '&.Mui-checked': { color: theme.palette.primary.main }
                          }}
                        />
                        <ListItemText primary={concept} primaryTypographyProps={{ variant: 'body2' }} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por beneficiario */}
            <Grid item xs={12} lg={2} md={4} sm={6}>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <FormControl
                  fullWidth
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
                >
                  <InputLabel>Beneficiario</InputLabel>
                  <Select
                    multiple
                    value={beneficiaryFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('__all__')) {
                        const allSelected = beneficiaryFilter.length === beneficiaryOptions.length;
                        handleBeneficiaryChange(allSelected ? [] : beneficiaryOptions);
                      } else {
                        handleBeneficiaryChange(value);
                      }
                    }}
                    input={<OutlinedInput label="Beneficiario" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) {
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Todos los beneficiarios
                          </Typography>
                        );
                      }
                      if (selected.length === 1) {
                        return (
                          <Typography variant="body2">
                            {selected[0]}
                          </Typography>
                        );
                      }
                      return (
                        <Typography variant="body2">
                          {selected.length} beneficiarios
                        </Typography>
                      );
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                          borderRadius: 8,
                          marginTop: 8
                        }
                      }
                    }}
                  >
                    <MenuItem value="__all__" sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Checkbox
                        checked={beneficiaryFilter.length === beneficiaryOptions.length}
                        indeterminate={beneficiaryFilter.length > 0 && beneficiaryFilter.length < beneficiaryOptions.length}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                      <ListItemText
                        primary={beneficiaryFilter.length === beneficiaryOptions.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        ({beneficiaryFilter.length}/{beneficiaryOptions.length})
                      </Typography>
                    </MenuItem>
                    {beneficiaryOptions.map((beneficiary) => (
                      <MenuItem key={beneficiary} value={beneficiary}>
                        <Checkbox
                          checked={beneficiaryFilter.indexOf(beneficiary) > -1}
                          sx={{
                            color: theme.palette.primary.main,
                            '&.Mui-checked': { color: theme.palette.primary.main }
                          }}
                        />
                        <ListItemText primary={beneficiary} primaryTypographyProps={{ variant: 'body2' }} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por fechas */}
            <Grid item xs={12} lg={2} md={6} sm={6}>
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
                  {companyFilter.length > 0 && companyFilter.map(companyId => (
                    <Chip
                      key={companyId}
                      label={`Empresa: ${companies.find(c => c.id === companyId)?.name || companyId}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      onDelete={() => {
                        const newFilter = companyFilter.filter(id => id !== companyId);
                        onCompanyChange(newFilter);
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
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
                  {conceptFilter.length > 0 && conceptFilter.map(concept => (
                    <Chip
                      key={concept}
                      label={`Concepto: ${concept}`}
                      size="small"
                      color="success"
                      variant="outlined"
                      onDelete={() => {
                        const newFilter = conceptFilter.filter(c => c !== concept);
                        onConceptChange(newFilter);
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                  {beneficiaryFilter.length > 0 && beneficiaryFilter.map(beneficiary => (
                    <Chip
                      key={beneficiary}
                      label={`Beneficiario: ${beneficiary}`}
                      size="small"
                      color="error"
                      variant="outlined"
                      onDelete={() => {
                        const newFilter = beneficiaryFilter.filter(b => b !== beneficiary);
                        onBeneficiaryChange(newFilter);
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
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
