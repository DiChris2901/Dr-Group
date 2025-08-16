import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AddSamplePayments = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const samplePayments = [
    {
      companyName: 'DR Group',
      concept: 'Nómina Diciembre 2024',
      amount: 125000,
      method: 'Transferencia Bancaria',
      date: Timestamp.now(),
      reference: 'TRF-DRG-001',
      status: 'completed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Tech Solutions',
      concept: 'Servicios de TI - Noviembre',
      amount: 85000,
      method: 'Tarjeta de Crédito',
      date: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      reference: 'TRF-TECH-002',
      status: 'completed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Marketing Pro',
      concept: 'Campaña Digital Q4',
      amount: 45000,
      method: 'Efectivo',
      date: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      reference: 'EFE-MKT-001',
      status: 'pending',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Construcciones ABC',
      concept: 'Material de Construcción',
      amount: 230000,
      method: 'Transferencia Bancaria',
      date: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      reference: 'TRF-CONS-003',
      status: 'completed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Logística Express',
      concept: 'Transporte Mensual',
      amount: 65000,
      method: 'Cheque',
      date: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      reference: 'CHE-LOG-001',
      status: 'completed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Consultoría Legal',
      concept: 'Asesoría Jurídica',
      amount: 95000,
      method: 'Transferencia Bancaria',
      date: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      reference: 'TRF-LEG-004',
      status: 'failed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Inmobiliaria Central',
      concept: 'Renta de Oficina - Diciembre',
      amount: 155000,
      method: 'Transferencia Bancaria',
      date: Timestamp.fromDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
      reference: 'TRF-IMO-005',
      status: 'completed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Servicios Generales',
      concept: 'Mantenimiento Instalaciones',
      amount: 35000,
      method: 'Efectivo',
      date: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      reference: 'EFE-SER-002',
      status: 'pending',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Proveedores Unidos',
      concept: 'Insumos de Oficina',
      amount: 28000,
      method: 'Tarjeta de Débito',
      date: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
      reference: 'TAR-PRO-001',
      status: 'completed',
      createdAt: Timestamp.now()
    },
    {
      companyName: 'Desarrollo Web',
      concept: 'Sitio Web Corporativo',
      amount: 180000,
      method: 'Transferencia Bancaria',
      date: Timestamp.fromDate(new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)),
      reference: 'TRF-WEB-006',
      status: 'completed',
      createdAt: Timestamp.now()
    }
  ];

  const addSamplePayments = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔥 Agregando pagos de prueba a Firebase...');
      
      const promises = samplePayments.map(payment => 
        addDoc(collection(db, 'payments'), payment)
      );
      
      const results = await Promise.all(promises);
      
      setMessage(`✅ Se agregaron ${results.length} pagos de prueba exitosamente!`);
      console.log(`✅ Se agregaron ${results.length} pagos de prueba exitosamente!`);
      console.log('IDs generados:', results.map(doc => doc.id));
      
    } catch (error) {
      setMessage(`❌ Error agregando pagos: ${error.message}`);
      console.error('❌ Error agregando pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Agregar Pagos de Prueba
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Haz clic para agregar {samplePayments.length} pagos de prueba a Firebase.
        Esto te permitirá ver la funcionalidad de la página de pagos.
      </Typography>

      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        onClick={addSamplePayments}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Agregando...' : `Agregar ${samplePayments.length} Pagos de Prueba`}
      </Button>

      {message && (
        <Alert 
          severity={message.includes('Error') ? 'error' : 'success'}
          sx={{ mt: 2 }}
        >
          {message}
        </Alert>
      )}
    </Box>
  );
};

export default AddSamplePayments;
