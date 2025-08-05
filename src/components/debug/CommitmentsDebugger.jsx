/**
 * 🔍 Debug Component - Verificador de Compromisos
 * Componente temporal para verificar que los compromisos se estén guardando y leyendo correctamente
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createSampleData } from '../../utils/sampleData';

const CommitmentsDebugger = () => {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creatingData, setCreatingData] = useState(false);

  const fetchCommitments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching commitments from Firebase...');
      
      // Consulta directa a la colección de compromisos
      const q = query(
        collection(db, 'commitments'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Snapshot size:', snapshot.size);
      
      const commitmentsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Document data:', { id: doc.id, ...data });
        
        commitmentsData.push({
          id: doc.id,
          ...data,
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });
      
      setCommitments(commitmentsData);
      console.log('✅ Commitments loaded:', commitmentsData.length);
      
    } catch (error) {
      console.error('❌ Error fetching commitments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSampleData = async () => {
    setCreatingData(true);
    try {
      console.log('🏢 Creando datos de muestra...');
      await createSampleData();
      console.log('✅ Datos de muestra creados');
      
      // Recargar compromisos después de crear datos
      setTimeout(() => {
        fetchCommitments();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creando datos de muestra:', error);
      setError(error.message);
    } finally {
      setCreatingData(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, []);

  return (
    <Card sx={{ mb: 3, border: '2px solid #ff9800' }}>
      <CardContent>
        <Typography variant="h6" color="warning.main" gutterBottom>
          🔍 Debug: Verificador de Compromisos
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={fetchCommitments}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {loading ? <CircularProgress size={20} /> : '🔄 Recargar'}
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleCreateSampleData}
            disabled={creatingData}
            sx={{ mr: 1 }}
          >
            {creatingData ? <CircularProgress size={20} /> : '🏢 Crear Datos de Muestra'}
          </Button>
          
          <Chip 
            label={`${commitments.length} compromisos encontrados`}
            color={commitments.length > 0 ? 'success' : 'warning'}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error: {error}
          </Alert>
        )}

        {commitments.length === 0 && !loading && !error && (
          <Alert severity="info">
            No se encontraron compromisos en la base de datos.
            <br />
            <strong>Sugerencia:</strong> Crea un compromiso en /commitments/new para probar.
          </Alert>
        )}

        {commitments.length > 0 && (
          <List>
            {commitments.slice(0, 5).map((commitment) => (
              <ListItem key={commitment.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {commitment.concept || 'Sin concepto'}
                      </Typography>
                      {commitment.isRecurring && (
                        <Chip size="small" label="🔄 Recurrente" color="info" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        📅 Vence: {format(commitment.dueDate, 'dd/MM/yyyy', { locale: es })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🏢 Empresa: {commitment.companyName || 'Sin empresa'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        💰 Monto: ${commitment.amount?.toLocaleString('es-CO') || '0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🆔 ID: {commitment.id}
                      </Typography>
                      {commitment.recurringGroup && (
                        <Typography variant="body2" color="info.main">
                          🔗 Grupo: {commitment.recurringGroup}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
            
            {commitments.length > 5 && (
              <ListItem>
                <ListItemText>
                  <Typography variant="body2" color="text.secondary" align="center">
                    ... y {commitments.length - 5} compromisos más
                  </Typography>
                </ListItemText>
              </ListItem>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default CommitmentsDebugger;
