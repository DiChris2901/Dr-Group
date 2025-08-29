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
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const PaymentsFilters = ({ 
  onSearchChange, 
  onCompanyChange, 
  onStatusChange,
  onConceptChange,
  onBeneficiaryChange,
  onReceiptsChange,
  onApplyFilters,
  onClearFilters,
  searchTerm = '',
  companyFilter = 'all',
  statusFilter = 'all',
  conceptFilter = 'all',
  beneficiaryFilter = 'all',
  receiptsFilter = 'all',
  hasFiltersChanged = false,
  filtersApplied = false,
  uniqueCompanies = [],
  uniqueConcepts = [],
  uniqueBeneficiaries = []
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

  // Animation variants
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: 'easeOut' }
  };

  return (
    <motion.div {...fadeUp}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 1.5,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
            : `linear-gradient(145deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fafc', 0.95)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
          mb: 3,
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              color: theme.palette.primary.main
            }}
          >
            <FilterList sx={{ fontSize: 24 }} />
          </Box>
          <Box flex={1}>
            <Typography
              variant="h6"
              fontWeight="700"
              color="text.primary"
              sx={{ mb: 0.5 }}
            >
              Filtros de Pagos
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Refina tu búsqueda de pagos con múltiples criterios
            </Typography>
          </Box>
          
          {/* Status indicator */}
          {filtersApplied && (
            <Chip
              label={hasFiltersChanged ? "Filtros modificados" : "Filtros aplicados"}
              color={hasFiltersChanged ? "warning" : "success"}
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 600,
                borderWidth: 2
              }}
            />
          )}
        </Box>

        {/* Filters Grid */}
        <Grid container spacing={3}>
          {/* Search Field */}
          <Grid item xs={12} md={6} lg={4}>
            <TextField
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar pagos... (Presiona Enter para aplicar)"
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => onSearchChange('')}
                      edge="end"
                    >
                      <Clear sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    }
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px'
                    }
                  }
                }
              }}
            />
          </Grid>

          {/* Company Filter */}
          <Grid item xs={12} md={6} lg={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                <Business sx={{ fontSize: 16 }} />
                Empresa
              </InputLabel>
              <Select
                value={companyFilter}
                onChange={handleCompanyChange}
                onKeyDown={handleSelectKeyDown}
                label="Empresa"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              >
                <MenuItem value="all">Todas las empresas</MenuItem>
                {uniqueCompanies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} md={6} lg={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusChange}
                onKeyDown={handleSelectKeyDown}
                label="Estado"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="completed">Completados</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="failed">Fallidos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Concept Filter */}
          <Grid item xs={12} md={6} lg={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                <AccountBalance sx={{ fontSize: 16 }} />
                Concepto
              </InputLabel>
              <Select
                value={conceptFilter}
                onChange={handleConceptChange}
                onKeyDown={handleSelectKeyDown}
                label="Concepto"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              >
                <MenuItem value="all">Todos los conceptos</MenuItem>
                {uniqueConcepts.map((concept) => (
                  <MenuItem key={concept} value={concept}>
                    {concept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Beneficiary Filter */}
          <Grid item xs={12} md={6} lg={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                <Person sx={{ fontSize: 16 }} />
                Beneficiario
              </InputLabel>
              <Select
                value={beneficiaryFilter}
                onChange={handleBeneficiaryChange}
                onKeyDown={handleSelectKeyDown}
                label="Beneficiario"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              >
                <MenuItem value="all">Todos los beneficiarios</MenuItem>
                {uniqueBeneficiaries.map((beneficiary) => (
                  <MenuItem key={beneficiary} value={beneficiary}>
                    {beneficiary}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Receipts Filter */}
          <Grid item xs={12} md={6} lg={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)'
                  }
                }}
              >
                <Receipt sx={{ fontSize: 16 }} />
                Comprobantes
              </InputLabel>
              <Select
                value={receiptsFilter}
                onChange={handleReceiptsChange}
                onKeyDown={handleSelectKeyDown}
                label="Comprobantes"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8)
                  },
                  '&.Mui-focused': {
                    backgroundColor: theme.palette.background.paper
                  }
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="with">Con comprobantes</MenuItem>
                <MenuItem value="without">Sin comprobantes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box
          display="flex"
          gap={2}
          mt={4}
          pt={3}
          borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}
        >
          <Button
            variant="contained"
            onClick={onApplyFilters}
            disabled={!hasFiltersChanged && filtersApplied}
            startIcon={<FilterList />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 140,
              background: hasFiltersChanged || !filtersApplied 
                ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                : alpha(theme.palette.action.disabled, 0.3),
              '&:hover': {
                background: hasFiltersChanged || !filtersApplied 
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  : alpha(theme.palette.action.disabled, 0.3),
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            {filtersApplied && !hasFiltersChanged ? 'Filtros Aplicados' : 'Aplicar Filtros'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={onClearFilters}
            disabled={!filtersApplied && !hasFiltersChanged}
            startIcon={<Clear />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: alpha(theme.palette.error.main, 0.3),
              color: theme.palette.error.main,
              '&:hover': {
                borderColor: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.04),
                transform: 'translateY(-1px)'
              }
            }}
          >
            Limpiar Filtros
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default PaymentsFilters;
