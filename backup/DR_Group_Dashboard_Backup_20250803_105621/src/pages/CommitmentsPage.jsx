import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Warning,
  AccountBalance,
  Add
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../utils/designSystem.js';
import CommitmentsFilters from '../components/commitments/CommitmentsFilters';
import CommitmentsList from '../components/commitments/CommitmentsList';

const CommitmentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const gradients = useThemeGradients();
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
    // Navegar a la página de nuevo compromiso
    navigate('/commitments/new');
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Header Premium con Gradiente Dinámico */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <Paper
          elevation={0}
          sx={{
            background: gradients.primary,
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            ...shimmerEffect,
            '&::before': {
              ...shimmerEffect['&::before'],
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 1
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <motion.div
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 800,
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      mb: 1
                    }}
                  >
                    Gestión de Compromisos
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontWeight: 400,
                      maxWidth: 600
                    }}
                  >
                    Administra todos tus compromisos financieros empresariales con elegancia y control total
                  </Typography>
                </motion.div>
              </Box>
              
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddCommitment}
                  size="large"
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.25)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  Nuevo Compromiso
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Paper>
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
