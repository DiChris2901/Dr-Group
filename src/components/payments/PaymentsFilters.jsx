import {
  Business,
  Clear,
  FilterList,
  Search,
  Receipt,
  AccountBalance,
  Person
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
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DateRangeFilter from './DateRangeFilter';

const PaymentsFilters = ({ 
  onSearchChange, 
  onCompanyChange, 
  onStatusChange,
  onConceptChange,
  onBeneficiaryChange,
  onReceiptsChange,
  onDateRangeChange,
  onCustomDateRangeChange,
  onApplyFilters,
  onClearFilters,
  searchTerm = '',
  companyFilter = [],
  statusFilter = 'all',
  conceptFilter = [],
  beneficiaryFilter = [],
  receiptsFilter = 'all',
  dateRangeFilter = 'all',
  customStartDate = null,
  customEndDate = null,
  hasFiltersChanged = false,
  filtersApplied = false,
  uniqueCompanies = [],
  uniqueConcepts = [],
  uniqueBeneficiaries = [],
  companies = [] // Array completo de empresas con logoURL
}) => {
  const theme = useTheme();

  // Debug temporal para verificar tipos de filtros
  console.log('[PaymentsFilters] tipos de filtros:', {
    companyFilterType: Array.isArray(companyFilter) ? 'array' : typeof companyFilter,
    companyFilter,
    conceptFilterType: Array.isArray(conceptFilter) ? 'array' : typeof conceptFilter,
    conceptFilter,
    beneficiaryFilterType: Array.isArray(beneficiaryFilter) ? 'array' : typeof beneficiaryFilter,
    beneficiaryFilter
  });

  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onApplyFilters();
    }
  };

  const handleSelectKeyDown = (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'INPUT') {
      event.preventDefault();
      onApplyFilters();
    }
  };

  const handleCompanyChange = (newValue) => {
    onCompanyChange(newValue);
  };

  const handleStatusChange = (event) => {
    onStatusChange(event.target.value);
  };

  const handleConceptChange = (newValue) => {
    onConceptChange(newValue);
  };

  const handleBeneficiaryChange = (newValue) => {
    onBeneficiaryChange(newValue);
  };

  const handleReceiptsChange = (event) => {
    onReceiptsChange(event.target.value);
  };

  const handleDateRangeChange = (value) => {
    onDateRangeChange(value);
  };

  const handleCustomDateRangeChange = (startDate, endDate) => {
    onCustomDateRangeChange(startDate, endDate);
  };

  // Función para obtener la empresa completa por nombre
  const getCompanyByName = (companyName) => {
    return companies.find(company => company.name === companyName);
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
                  Filtros de Pagos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refina tu búsqueda de pagos con múltiples criterios
                </Typography>
              </Box>
            </Box>
            

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
                  label="Buscar pagos"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Descripción, empresa, beneficiario..."
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
                          onClick={() => onSearchChange('')}
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

            {/* Filtro por fechas */}
            <Grid item xs={12} md={3}>
              <DateRangeFilter
                value={dateRangeFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onChange={handleDateRangeChange}
                onCustomRangeChange={handleCustomDateRangeChange}
              />
            </Grid>

            {/* Filtro por empresa */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
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
                    value={Array.isArray(companyFilter) ? companyFilter : (companyFilter ? [companyFilter] : [])}
                    onChange={(e) => {
                      const valueRaw = e.target.value;
                      const value = Array.isArray(valueRaw) ? valueRaw : (valueRaw ? [valueRaw] : []);
                      if (value.includes('__all__')) {
                        const allSelected = companyFilter.length === uniqueCompanies.length;
                        handleCompanyChange(allSelected ? [] : uniqueCompanies);
                      } else {
                        handleCompanyChange(value);
                      }
                    }}
                    onKeyDown={handleSelectKeyDown}
                    input={<OutlinedInput label="Empresa" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0 || (selected.length === 1 && selected[0] === 'all')) {
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Todas las empresas
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
                        checked={companyFilter.length === uniqueCompanies.length}
                        indeterminate={companyFilter.length > 0 && companyFilter.length < uniqueCompanies.length}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                      <ListItemText
                        primary={companyFilter.length === uniqueCompanies.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        ({companyFilter.length}/{uniqueCompanies.length})
                      </Typography>
                    </MenuItem>
                    {uniqueCompanies.map((companyName) => {
                      const company = getCompanyByName(companyName);
                      return (
                        <MenuItem key={companyName} value={companyName}>
                          <Checkbox
                            checked={companyFilter.indexOf(companyName) > -1}
                            sx={{
                              color: theme.palette.primary.main,
                              '&.Mui-checked': { color: theme.palette.primary.main }
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            {company?.logoURL ? (
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
                                  alt={`Logo de ${companyName}`}
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
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: 'primary.main',
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {companyName.charAt(0)}
                              </Avatar>
                            )}
                            <ListItemText
                              primary={companyName}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por estado */}
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
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    onKeyDown={handleSelectKeyDown}
                    label="Estado"
                  >
                    <MenuItem value="all">
                      <Typography variant="body2">
                        Todos los estados
                      </Typography>
                    </MenuItem>
                    <MenuItem value="completed">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'success.main',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        ✓ Completados
                      </Typography>
                    </MenuItem>
                    <MenuItem value="pending">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'warning.main',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        ⏳ Pendientes
                      </Typography>
                    </MenuItem>
                    <MenuItem value="failed">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'error.main',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        ❌ Rechazados
                      </Typography>
                    </MenuItem>
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>

            {/* Filtro por concepto */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
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
                  <InputLabel>Concepto</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(conceptFilter) ? conceptFilter : (conceptFilter ? [conceptFilter] : [])}
                    onChange={(e) => {
                      const valueRaw = e.target.value;
                      const value = Array.isArray(valueRaw) ? valueRaw : (valueRaw ? [valueRaw] : []);
                      if (value.includes('__all__')) {
                        const allSelected = conceptFilter.length === uniqueConcepts.length;
                        handleConceptChange(allSelected ? [] : uniqueConcepts);
                      } else {
                        handleConceptChange(value);
                      }
                    }}
                    onKeyDown={handleSelectKeyDown}
                    input={<OutlinedInput label="Concepto" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0 || (selected.length === 1 && selected[0] === 'all')) {
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
                        <AccountBalance color="primary" />
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
                        checked={conceptFilter.length === uniqueConcepts.length}
                        indeterminate={conceptFilter.length > 0 && conceptFilter.length < uniqueConcepts.length}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                      <ListItemText
                        primary={conceptFilter.length === uniqueConcepts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        ({conceptFilter.length}/{uniqueConcepts.length})
                      </Typography>
                    </MenuItem>
                    {uniqueConcepts.map((concept) => (
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
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
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
                  <InputLabel>Beneficiario</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(beneficiaryFilter) ? beneficiaryFilter : (beneficiaryFilter ? [beneficiaryFilter] : [])}
                    onChange={(e) => {
                      const valueRaw = e.target.value;
                      const value = Array.isArray(valueRaw) ? valueRaw : (valueRaw ? [valueRaw] : []);
                      if (value.includes('__all__')) {
                        const allSelected = beneficiaryFilter.length === uniqueBeneficiaries.length;
                        handleBeneficiaryChange(allSelected ? [] : uniqueBeneficiaries);
                      } else {
                        handleBeneficiaryChange(value);
                      }
                    }}
                    onKeyDown={handleSelectKeyDown}
                    input={<OutlinedInput label="Beneficiario" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0 || (selected.length === 1 && selected[0] === 'all')) {
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
                        checked={beneficiaryFilter.length === uniqueBeneficiaries.length}
                        indeterminate={beneficiaryFilter.length > 0 && beneficiaryFilter.length < uniqueBeneficiaries.length}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': { color: theme.palette.primary.main },
                          '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.main }
                        }}
                      />
                      <ListItemText
                        primary={beneficiaryFilter.length === uniqueBeneficiaries.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        primaryTypographyProps={{ fontWeight: 600, color: 'primary.main', variant: 'body2' }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        ({beneficiaryFilter.length}/{uniqueBeneficiaries.length})
                      </Typography>
                    </MenuItem>
                    {uniqueBeneficiaries.map((beneficiary) => (
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

            {/* Filtro por comprobantes */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
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
                  <InputLabel>Comprobantes</InputLabel>
                  <Select
                    value={receiptsFilter}
                    onChange={handleReceiptsChange}
                    onKeyDown={handleSelectKeyDown}
                    label="Comprobantes"
                    startAdornment={
                      <InputAdornment position="start">
                        <Receipt color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">
                      <Typography variant="body2">
                        Todos
                      </Typography>
                    </MenuItem>
                    <MenuItem value="with">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'success.main',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        📄 Con comprobantes
                      </Typography>
                    </MenuItem>
                    <MenuItem value="without">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'warning.main',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        📝 Sin comprobantes
                      </Typography>
                    </MenuItem>
                  </Select>
                </FormControl>
              </motion.div>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box
            display="flex"
            gap={2}
            mt={4}
            pt={3}
            borderTop={`1px solid ${alpha(theme.palette.divider, 0.2)}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Button
                variant="contained"
                onClick={onApplyFilters}
                disabled={!hasFiltersChanged && filtersApplied}
                startIcon={<FilterList />}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  minWidth: 140,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                {filtersApplied && !hasFiltersChanged ? 'Filtros Aplicados' : 'Aplicar Filtros'}
              </Button>
            </motion.div>
            
            {(filtersApplied || hasFiltersChanged) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Button
                  variant="outlined"
                  onClick={onClearFilters}
                  startIcon={<Clear />}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 140,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  Limpiar Filtros
                </Button>
              </motion.div>
            )}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default PaymentsFilters;
