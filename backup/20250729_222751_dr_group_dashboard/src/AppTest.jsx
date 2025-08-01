import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';

// Context Providers
import SettingsProvider from './context/SettingsContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Simple test component
const TestApp = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2
    }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
            DR Group Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" mb={2}>
            Sistema de Prueba
          </Typography>
          <Typography variant="body1" color="text.primary">
            ✅ React funcionando correctamente
          </Typography>
          <Typography variant="body1" color="text.primary">
            ✅ Material-UI funcionando correctamente
          </Typography>
          <Typography variant="body1" color="text.primary">
            ✅ Contextos cargando correctamente
          </Typography>
          <Typography variant="body1" color="success.main" fontWeight="bold" mt={2}>
            🎉 Sistema Boss Lite operativo
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

function AppTest() {
  return (
    <SettingsProvider>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <TestApp />
          </Router>
        </AuthProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  );
}

export default AppTest;
