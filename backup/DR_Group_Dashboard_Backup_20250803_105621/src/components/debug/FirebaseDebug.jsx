import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const FirebaseDebug = () => {
  const { currentUser } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Verificar conexión a Firebase
  useEffect(() => {
    if (currentUser) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('not-authenticated');
    }
  }, [currentUser]);

  // Cargar compromisos usando getDocs (una sola vez)
  const loadCommitmentsOnce = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(collection(db, 'commitments'), orderBy('dueDate', 'asc'));
      const snapshot = await getDocs(q);
      
      const commitmentsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        commitmentsData.push({
          id: doc.id,
          ...data
        });
      });

      setCommitments(commitmentsData);
      console.log('Commitments loaded:', commitmentsData);
    } catch (err) {
      console.error('Error loading commitments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listener en tiempo real
  const setupRealtimeListener = () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(collection(db, 'commitments'), orderBy('dueDate', 'asc'));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const commitmentsData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            commitmentsData.push({
              id: doc.id,
              ...data
            });
          });

          setCommitments(commitmentsData);
          setLoading(false);
          console.log('Real-time commitments update:', commitmentsData);
        },
        (err) => {
          console.error('Real-time listener error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up listener:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Agregar compromiso de prueba
  const addTestCommitment = async () => {
    try {
      const testCommitment = {
        description: 'Compromiso de prueba - ' + new Date().toLocaleTimeString(),
        company: 'DR Group Test',
        companyId: 'test-company-1',
        type: 'Factura',
        amount: 1500000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde hoy
        paid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: currentUser?.uid || 'test-user'
      };

      const docRef = await addDoc(collection(db, 'commitments'), testCommitment);
      console.log('Test commitment added with ID:', docRef.id);
      alert('Compromiso de prueba agregado exitosamente!');
    } catch (err) {
      console.error('Error adding test commitment:', err);
      alert('Error agregando compromiso: ' + err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Firebase Debug Tool
      </Typography>
      
      {/* Estado de conexión */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Estado de Conexión
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={connectionStatus === 'connected' ? 'Conectado' : 'No autenticado'}
              color={connectionStatus === 'connected' ? 'success' : 'error'}
            />
            {currentUser && (
              <Typography variant="body2">
                Usuario: {currentUser.email}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Controles */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Acciones de Debug
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={loadCommitmentsOnce}
              disabled={loading || !currentUser}
            >
              Cargar Una Vez (getDocs)
            </Button>
            <Button 
              variant="outlined" 
              onClick={setupRealtimeListener}
              disabled={loading || !currentUser}
            >
              Activar Listener Tiempo Real
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={addTestCommitment}
              disabled={!currentUser}
            >
              Agregar Compromiso de Prueba
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Estado de carga */}
      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          Cargando datos...
        </Alert>
      )}

      {/* Errores */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}

      {/* Resultados */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Compromisos Encontrados ({commitments.length})
          </Typography>
          
          {commitments.length === 0 ? (
            <Alert severity="warning">
              No se encontraron compromisos en la base de datos
            </Alert>
          ) : (
            <List>
              {commitments.map((commitment, index) => (
                <div key={commitment.id}>
                  <ListItem>
                    <ListItemText
                      primary={commitment.description}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Empresa: {commitment.company}
                          </Typography>
                          <Typography variant="body2">
                            Monto: ${commitment.amount?.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Fecha: {commitment.dueDate ? new Date(commitment.dueDate).toLocaleDateString() : 'No definida'}
                          </Typography>
                          <Typography variant="body2">
                            Estado: {commitment.paid ? 'Pagado' : 'Pendiente'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < commitments.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FirebaseDebug;
