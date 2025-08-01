import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Divider
} from '@mui/material';
import {
  Add,
  Upload,
  Assessment,
  Business,
  AccountBalance,
  TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createSampleData } from '../../utils/sampleData';

const QuickActions = () => {
  const navigate = useNavigate();

  const handleCreateSampleData = async () => {
    try {
      const result = await createSampleData();
      if (result.success) {
        alert('¡Datos de ejemplo creados exitosamente! Ya puedes ver compromisos reales.');
        // Recargar la página para mostrar los nuevos datos
        window.location.reload();
      } else {
        alert('Error al crear datos de ejemplo: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const quickActions = [
    {
      title: 'Nuevo Compromiso',
      description: 'Agregar un nuevo compromiso financiero',
      icon: Add,
      color: 'primary.main',
      action: () => navigate('/commitments'),
      gradient: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
    },
    {
      title: 'Ver Compromisos',
      description: 'Gestionar compromisos existentes',
      icon: AccountBalance,
      color: 'success.main',
      action: () => navigate('/commitments'),
      gradient: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)'
    },
    {
      title: 'Cargar Datos Demo',
      description: 'Crear datos de ejemplo para probar',
      icon: Upload,
      color: 'warning.main',
      action: handleCreateSampleData,
      gradient: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)'
    },
    {
      title: 'Ver Reportes',
      description: 'Analizar datos financieros',
      icon: Assessment,
      color: 'info.main',
      action: () => navigate('/reports'),
      gradient: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary.main">
              Acciones Rápidas
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={action.action}
                    sx={{
                      background: action.gradient,
                      color: 'white',
                      height: 100,
                      flexDirection: 'column',
                      gap: 1,
                      boxShadow: '0 3px 5px 2px rgba(0,0,0,.1)',
                      '&:hover': {
                        boxShadow: '0 6px 10px 4px rgba(0,0,0,.15)',
                      }
                    }}
                  >
                    <action.icon sx={{ fontSize: 24 }} />
                    <Box textAlign="center">
                      <Typography variant="subtitle2" fontWeight="bold">
                        {action.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" paragraph>
              💡 <strong>Sugerencia:</strong> Comienza cargando datos de ejemplo para explorar todas las funcionalidades del sistema.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Los datos de ejemplo incluyen diferentes tipos de compromisos, empresas y estados de pago.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickActions;
