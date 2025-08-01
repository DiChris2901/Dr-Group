import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography } from '@mui/material';
import SettingsProviderSimple from './context/SettingsContextSimple';
import MainLayoutSimple from './components/layout/MainLayoutSimple';

const App = () => {
  return (
    <SettingsProviderSimple>
      <CssBaseline />
      <MainLayoutSimple title="DR Group Dashboard">
        <Box>
          <Typography variant="h4" gutterBottom>
            ¡Bienvenido al DR Group Dashboard!
          </Typography>
          <Typography variant="body1">
            El sistema está funcionando correctamente.
          </Typography>
        </Box>
      </MainLayoutSimple>
    </SettingsProviderSimple>
  );
};

export default App;
