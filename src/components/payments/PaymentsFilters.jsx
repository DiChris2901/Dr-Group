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
  Avatar
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
  companyFilter = 'all',
  statusFilter = 'all',
  conceptFilter = 'all',
  beneficiaryFilter = 'all',
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

  const handleCompanyChange = (event) => {
    onCompanyChange(event.target.value);
  };

  const handleStatusChange = (event) => {
    onStatusChange(event.target.value);
  };

  const handleConceptChange = (event) => {
    onConceptChange(event.target.value);
  };

  const handleBeneficiaryChange = (event) => {
    onBeneficiaryChange(event.target.value);
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
                    value={companyFilter}
                    onChange={handleCompanyChange}
                    onKeyDown={handleSelectKeyDown}
                    label="Empresa"
                    startAdornment={
                      <InputAdornment position="start">
                        <Business color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        Todas las empresas
                      </Box>
                    </MenuItem>
                    {uniqueCompanies.map((companyName) => {
                      const company = getCompanyByName(companyName);
                      return (
                        <MenuItem key={companyName} value={companyName}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                                  mr: 1, 
                                  bgcolor: 'primary.main',
                                  fontSize: 12,
                                  fontWeight: 'bold'
                                }}
                              >
                                {companyName.charAt(0)}
                              </Avatar>
                            )}
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {companyName}
                            </Typography>
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
                    value={conceptFilter}
                    onChange={handleConceptChange}
                    onKeyDown={handleSelectKeyDown}
                    label="Concepto"
                    startAdornment={
                      <InputAdornment position="start">
                        <AccountBalance color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Todos los conceptos</MenuItem>
                    {uniqueConcepts.map((concept) => (
                      <MenuItem key={concept} value={concept}>
                        {concept}
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
                    value={beneficiaryFilter}
                    onChange={handleBeneficiaryChange}
                    onKeyDown={handleSelectKeyDown}
                    label="Beneficiario"
                    startAdornment={
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">Todos los beneficiarios</MenuItem>
                    {uniqueBeneficiaries.map((beneficiary) => (
                      <MenuItem key={beneficiary} value={beneficiary}>
                        {beneficiary}
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
