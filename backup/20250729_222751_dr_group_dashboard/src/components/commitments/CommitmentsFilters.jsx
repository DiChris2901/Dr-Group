import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  InputAdornment,
  Chip,
  Button,
  Typography
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  Business,
  Today
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const CommitmentsFilters = ({ 
  onSearchChange, 
  onCompanyChange, 
  onStatusChange,
  searchTerm = '',
  companyFilter = 'all',
  statusFilter = 'all'
}) => {
  const { currentUser } = useAuth();
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

  const handleCompanyChange = (event) => {
    onCompanyChange(event.target.value);
  };

  const handleStatusChange = (event) => {
    onStatusChange(event.target.value);
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onCompanyChange('all');
    onStatusChange('all');
  };

  const statusOptions = [
    { value: 'all', label: 'Todos los estados', color: 'default' },
    { value: 'overdue', label: 'Vencidos', color: 'error' },
    { value: 'due-soon', label: 'Próximos a vencer', color: 'warning' },
    { value: 'pending', label: 'Pendientes', color: 'info' },
    { value: 'paid', label: 'Pagados', color: 'success' }
  ];

  const hasActiveFilters = searchTerm || companyFilter !== 'all' || statusFilter !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FilterList sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary.main">
              Filtros de Búsqueda
            </Typography>
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={handleClearFilters}
                sx={{ ml: 'auto' }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Campo de búsqueda */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar compromisos"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Descripción, empresa, tipo..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        edge="end"
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Filtro por empresa */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={handleCompanyChange}
                  label="Empresa"
                  startAdornment={
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">Todas las empresas</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por estado */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  label="Estado"
                  startAdornment={
                    <InputAdornment position="start">
                      <Today />
                    </InputAdornment>
                  }
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {option.value !== 'all' && (
                          <Chip
                            size="small"
                            label=""
                            color={option.color}
                            sx={{ width: 8, height: 8, minWidth: 8 }}
                          />
                        )}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Chips de filtros activos */}
          {hasActiveFilters && (
            <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
              {searchTerm && (
                <Chip
                  label={`Búsqueda: "${searchTerm}"`}
                  onDelete={handleClearSearch}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {companyFilter !== 'all' && (
                <Chip
                  label={`Empresa: ${companies.find(c => c.id === companyFilter)?.name || companyFilter}`}
                  onDelete={() => onCompanyChange('all')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {statusFilter !== 'all' && (
                <Chip
                  label={`Estado: ${statusOptions.find(s => s.value === statusFilter)?.label}`}
                  onDelete={() => onStatusChange('all')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CommitmentsFilters;
