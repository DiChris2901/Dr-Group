import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import AdminAccessVerifier from '../components/debug/AdminAccessVerifier';

const AdminAccessVerifierPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Verificador de Acceso de Administrador
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Esta herramienta permite verificar y corregir los permisos de acceso del administrador principal 
            del sistema. Asegura que el usuario daruedagu@gmail.com tenga acceso completo en todo momento.
          </Typography>

          <AdminAccessVerifier />
        </Box>
      </Container>
    </motion.div>
  );
};

export default AdminAccessVerifierPage;
