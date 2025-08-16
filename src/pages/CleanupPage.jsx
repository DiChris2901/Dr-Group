import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import DataCleanupTool from '../components/admin/DataCleanupTool';

const CleanupPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🛠️ Panel de Administración
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Herramientas de gestión y mantenimiento del sistema
        </Typography>
      </Box>
      
      <DataCleanupTool />
    </Container>
  );
};

export default CleanupPage;
