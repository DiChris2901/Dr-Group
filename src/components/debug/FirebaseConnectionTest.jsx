import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { db } from '../../config/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const FirebaseConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const testConnection = async () => {
    setStatus('testing');
    setError(null);
    setData(null);

    try {
      console.log('🔍 Probando conexión a Firebase...');
      
      // Intentar una consulta simple
      const testQuery = query(
        collection(db, 'commitments'),
        limit(1)
      );
      
      const snapshot = await getDocs(testQuery);
      
      console.log('✅ Conexión exitosa. Documentos encontrados:', snapshot.size);
      
      setData({
        connected: true,
        documentsFound: snapshot.size,
        projectId: db.app.options.projectId
      });
      setStatus('success');
      
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setError(error.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card sx={{ mb: 3, border: '2px solid', borderColor: status === 'error' ? 'error.main' : 'info.main' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔧 Verificación de Conexión Firebase
        </Typography>
        
        {status === 'testing' && (
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography>Probando conexión...</Typography>
          </Box>
        )}
        
        {status === 'success' && data && (
          <Alert severity="success">
            <Typography variant="body2">
              ✅ <strong>Conexión exitosa</strong><br />
              • Proyecto: {data.projectId}<br />
              • Documentos encontrados: {data.documentsFound}
            </Typography>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert severity="error">
            <Typography variant="body2">
              ❌ <strong>Error de conexión:</strong><br />
              {error}
            </Typography>
          </Alert>
        )}
        
        <Box mt={2}>
          <Button 
            variant="outlined" 
            onClick={testConnection}
            disabled={status === 'testing'}
          >
            Probar Conexión
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FirebaseConnectionTest;
