import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const FirebaseDataDebug = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    commitments: null,
    payments: null,
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener algunos compromisos para ver su estructura
        const commitmentsQuery = query(collection(db, 'commitments'), limit(3));
        const commitmentsSnapshot = await getDocs(commitmentsQuery);
        const commitments = [];
        commitmentsSnapshot.forEach(doc => {
          commitments.push({ id: doc.id, ...doc.data() });
        });

        // Obtener algunos pagos para ver su estructura
        const paymentsQuery = query(collection(db, 'payments'), limit(3));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = [];
        paymentsSnapshot.forEach(doc => {
          payments.push({ id: doc.id, ...doc.data() });
        });

        setData({
          commitments,
          payments,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setData({
          commitments: null,
          payments: null,
          loading: false,
          error: error.message
        });
      }
    };

    fetchData();
  }, []);

  if (data.loading) {
    return <Typography>Cargando datos de Firebase...</Typography>;
  }

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Usuario actual: {user?.uid || 'No user'}
      </Alert>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Compromisos en Firebase ({data.commitments?.length || 0})
          </Typography>
          <Typography component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(data.commitments, null, 2)}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pagos en Firebase ({data.payments?.length || 0})
          </Typography>
          <Typography component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(data.payments, null, 2)}
          </Typography>
        </CardContent>
      </Card>

      {data.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {data.error}
        </Alert>
      )}
    </Box>
  );
};

export default FirebaseDataDebug;
