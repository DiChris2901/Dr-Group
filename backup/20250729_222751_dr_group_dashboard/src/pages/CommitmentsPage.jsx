import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Warning,
  AccountBalance,
  Add
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CommitmentsFilters from '../components/commitments/CommitmentsFilters';
import CommitmentsList from '../components/commitments/CommitmentsList';
import DashboardStats from '../components/dashboard/DashboardStats';
import { useDashboardStats } from '../hooks/useDashboardStats';

const CommitmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Usar el hook para obtener estadísticas reales de Firebase
  const stats = useDashboardStats();

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleCompanyChange = (value) => {
    setCompanyFilter(value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleAddCommitment = () => {
    // Funcionalidad temporal - podrías mostrar un mensaje o redirigir
    console.log('Función de agregar compromiso - por implementar');
  };

  return (
    <Box>
      {/* Header de la página */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Gestión de Compromisos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Administra todos tus compromisos financieros empresariales
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCommitment}
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
            }}
          >
            Nuevo Compromiso
          </Button>
        </Box>
      </motion.div>

      {/* Estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <DashboardStats stats={stats} />
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <CommitmentsFilters
          searchTerm={searchTerm}
          companyFilter={companyFilter}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onCompanyChange={handleCompanyChange}
          onStatusChange={handleStatusChange}
        />
      </motion.div>

      {/* Lista de compromisos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <CommitmentsList
          searchTerm={searchTerm}
          companyFilter={companyFilter}
          statusFilter={statusFilter}
        />
      </motion.div>
    </Box>
  );
};

export default CommitmentsPage;
