// 🛠️ Página administrativa para configurar datos de Firebase
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  Storage,
  Build,
  NotificationsActive
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  createSampleToolsData, 
  // createSampleMonitoringData, // Comentado - página eliminada
  // createSampleAlertsData, // Comentado - página eliminada
  createAllSampleData 
} from '../utils/createSampleData';

const FirebaseSetupPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [currentStep, setCurrentStep] = useState('');

  const addResult = (type, message) => {
    setResults(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const executeStep = async (stepName, stepFunction, description) => {
    setCurrentStep(description);
    try {
      await stepFunction();
      addResult('success', `✅ ${stepName} completado exitosamente`);
    } catch (error) {
      addResult('error', `❌ Error en ${stepName}: ${error.message}`);
      throw error;
    }
  };

  const handleCreateAllData = async () => {
    setLoading(true);
    setResults([]);
    setCurrentStep('Iniciando configuración...');

    try {
      await executeStep(
        'Herramientas Avanzadas', 
        createSampleToolsData, 
        'Creando datos para Advanced Tools...'
      );

      // await executeStep(
      //   'Monitoreo del Sistema', 
      //   createSampleMonitoringData, 
      //   'Creando datos para System Monitoring...'
      // );

      // await executeStep(
      //   'Centro de Alertas', 
      //   createSampleAlertsData, 
      //   'Creando datos para Alerts Center...'
      // );

      addResult('success', '🎉 ¡Configuración completa! Las páginas ahora muestran datos reales.');
      setCurrentStep('Configuración completada');
    } catch (error) {
      addResult('error', `❌ Error en la configuración: ${error.message}`);
      setCurrentStep('Error en la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIndividual = async (type) => {
    setLoading(true);
    setResults([]);

    try {
      switch (type) {
        case 'tools':
          await executeStep('Herramientas', createSampleToolsData, 'Creando datos de herramientas...');
          break;
        // case 'monitoring':
        //   await executeStep('Monitoreo', createSampleMonitoringData, 'Creando datos de monitoreo...');
        //   break;
        // case 'alerts':
        //   await executeStep('Alertas', createSampleAlertsData, 'Creando datos de alertas...');
        //   break;
      }
    } catch (error) {
      addResult('error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          🛠️ Configuración de Firebase
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Esta página permite poblar Firebase con datos de muestra para que las páginas útiles (Tools, Reports, KPIs) muestren información real.
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🚀 Configuración Completa
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Crea todos los datos de muestra necesarios para las tres páginas
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleCreateAllData}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Crear Todos los Datos
            </Button>

            {loading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {currentStep}
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography variant="h6" gutterBottom>
          📦 Configuración Individual
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', mb: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Build sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Advanced Tools</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cálculos, exportaciones e historial de herramientas
              </Typography>
              <Button
                variant="outlined"
                onClick={() => handleCreateIndividual('tools')}
                disabled={loading}
                size="small"
              >
                Crear Datos
              </Button>
            </CardContent>
          </Card>

          {/* <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">System Monitoring</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Logs del sistema y métricas de rendimiento
              </Typography>
              <Button
                variant="outlined"
                onClick={() => handleCreateIndividual('monitoring')}
                disabled={loading}
                size="small"
              >
                Crear Datos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Alerts Center</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Alertas del sistema y notificaciones
              </Typography>
              <Button
                variant="outlined"
                onClick={() => handleCreateIndividual('alerts')}
                disabled={loading}
                size="small"
              >
                Crear Datos
              </Button>
            </CardContent>
          </Card> */}
        </Box>

        {results.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Resultados de la Configuración
              </Typography>
              <List>
                {results.map((result, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {result.type === 'success' ? (
                          <CheckCircle color="success" />
                        ) : result.type === 'error' ? (
                          <Error color="error" />
                        ) : (
                          <Warning color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.message}
                        secondary={result.timestamp.toLocaleTimeString()}
                      />
                      <Chip
                        label={result.type}
                        color={result.type === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </ListItem>
                    {index < results.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Box>
  );
};

export default FirebaseSetupPage;
