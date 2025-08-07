import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Chip, 
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  ExpandMore, 
  Business, 
  Error, 
  CheckCircle, 
  Search,
  Add,
  Refresh
} from '@mui/icons-material';
import useCompanies from '../../hooks/useCompanies';
import { initializeTestCompanies } from '../../utils/initializeCompanies';
import { testFirebaseConnection } from '../../utils/testFirebaseConnection';

const CompaniesDebug = () => {
  const { companies, loading, error, findCompanyByNIT } = useCompanies();
  const [testNIT, setTestNIT] = useState('');
  const [initializingCompanies, setInitializingCompanies] = useState(false);
  const [initResult, setInitResult] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);

  const handleInitializeCompanies = async () => {
    setInitializingCompanies(true);
    setInitResult(null);
    
    try {
      const result = await initializeTestCompanies();
      setInitResult(result);
      
      // Esperar 2 segundos y recargar la página para que se actualicen las empresas
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setInitResult({ success: false, error: error.message });
    } finally {
      setInitializingCompanies(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    
    try {
      const result = await testFirebaseConnection();
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({ success: false, error: error.message });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2, border: '2px solid #2196f3' }}>
        <CardContent>
          <Typography variant="h6" color="primary">🔄 Cargando empresas...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 2, border: '2px solid #f44336' }}>
        <CardContent>
          <Typography variant="h6" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Error /> Error: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Test de búsqueda con NITs reales de la base de datos
  const testNITs = companies.length > 0 
    ? companies.slice(0, 4).map(c => c.nit).filter(Boolean)
    : ['901230106', '901.230.106-7', '900123456', '800.000.000-1'];
  
  return (
    <Card sx={{ mb: 2, border: '2px solid #4caf50' }}>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CheckCircle color="success" />
          Debug: Estado de Empresas
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`${companies.length} empresas cargadas`} 
            color={companies.length > 0 ? 'success' : 'error'} 
            icon={<Business />}
          />
        </Box>

        {/* Botón para inicializar empresas si no hay ninguna */}
        {companies.length === 0 && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              No hay empresas en la base de datos. Esto podría explicar por qué aparece "No encontrado".
            </Alert>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={initializingCompanies ? <CircularProgress size={20} /> : <Add />}
                onClick={handleInitializeCompanies}
                disabled={initializingCompanies}
                color="primary"
              >
                {initializingCompanies ? 'Creando empresas...' : 'Crear empresas de prueba'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={testingConnection ? <CircularProgress size={20} /> : <Refresh />}
                onClick={handleTestConnection}
                disabled={testingConnection}
                color="secondary"
              >
                {testingConnection ? 'Probando...' : 'Test Conexión Firebase'}
              </Button>
            </Stack>
            
            {initResult && (
              <Alert 
                severity={initResult.success ? 'success' : 'error'} 
                sx={{ mt: 2 }}
              >
                {initResult.success 
                  ? `✅ ${initResult.message}: ${initResult.count} empresas. Recargando página...`
                  : `❌ Error: ${initResult.error}`
                }
              </Alert>
            )}
            
            {connectionResult && (
              <Alert 
                severity={connectionResult.success ? 'success' : 'error'} 
                sx={{ mt: 2 }}
              >
                {connectionResult.success 
                  ? `✅ ${connectionResult.message}. Empresas encontradas: ${connectionResult.companiesCount}`
                  : `❌ Error conexión: ${connectionResult.error} (${connectionResult.code || 'N/A'})`
                }
              </Alert>
            )}
          </Box>
        )}

        {companies.length > 0 && (
          <>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Ver empresas cargadas ({companies.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {companies.slice(0, 5).map((company, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Nombre:</strong> {company.name || 'Sin nombre'} <br />
                      <strong>NIT:</strong> {company.nit || 'Sin NIT'} <br />
                      <strong>ID:</strong> {company.id}
                    </Typography>
                  </Box>
                ))}
                {companies.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    ... y {companies.length - 5} más
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Test de búsqueda de NITs</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* Test manual */}
                  <Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Probar NIT específico"
                      value={testNIT}
                      onChange={(e) => setTestNIT(e.target.value)}
                      placeholder="Ej: 901854000 o 901.854.900-3"
                      InputProps={{
                        endAdornment: (
                          <Button 
                            size="small" 
                            startIcon={<Search />}
                            disabled={!testNIT.trim()}
                          >
                            Buscar
                          </Button>
                        )
                      }}
                    />
                    {testNIT.trim() && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>NIT buscado:</strong> {testNIT}<br />
                          <strong>NIT normalizado:</strong> {testNIT.toString().replace(/[\.\-\s]/g, '').trim().toUpperCase()}<br />
                          <strong>Resultado:</strong> {findCompanyByNIT(testNIT) || 'No encontrado'}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                  
                  {/* Tests predefinidos */}
                  <Typography variant="subtitle2">
                    Tests con NITs de tu base de datos ({testNITs.length}):
                  </Typography>
                  {testNITs.map((testNIT, index) => {
                    const normalized = testNIT?.toString().replace(/[\.\-\s]/g, '').trim().toUpperCase();
                    const result = findCompanyByNIT(testNIT);
                    return (
                      <Box key={index} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>NIT original:</strong> {testNIT}<br />
                          <strong>NIT normalizado:</strong> {normalized}<br />
                          <strong>Resultado:</strong> {result || 'No encontrado'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CompaniesDebug;
