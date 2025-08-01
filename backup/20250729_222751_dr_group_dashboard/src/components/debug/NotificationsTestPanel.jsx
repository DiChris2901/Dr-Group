import React from 'react';
import { Box, Button, Stack, Typography, Divider } from '@mui/material';
import { useNotifications } from '../../context/NotificationsContext';

const NotificationsTestPanel = () => {
  const { addNotification, addAlert } = useNotifications();

  const testNotifications = [
    {
      title: 'Pago Recibido',
      message: 'ABC Construcciones completó el pago de $150,000',
      type: 'success',
      category: 'payment'
    },
    {
      title: 'Compromiso Próximo',
      message: 'XYZ Logística - Vence en 2 días',
      type: 'warning',
      category: 'payment'
    },
    {
      title: 'Nuevo Documento',
      message: 'Factura #5678 ha sido cargada',
      type: 'info',
      category: 'company'
    },
    {
      title: 'Reporte Generado',
      message: 'Informe mensual de febrero disponible',
      type: 'success',
      category: 'report'
    }
  ];

  const testAlerts = [
    {
      title: 'Pago Vencido',
      message: 'DEF Tecnología - $250,000 vencido hace 2 días',
      priority: 'Alta',
      category: 'payment'
    },
    {
      title: 'Límite de Crédito',
      message: 'GHI Servicios ha alcanzado el 90% del límite',
      priority: 'Media',
      category: 'system'
    }
  ];

  const generateRandomNotification = () => {
    const notification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    addNotification(notification);
  };

  const generateRandomAlert = () => {
    const alert = testAlerts[Math.floor(Math.random() * testAlerts.length)];
    addAlert(alert);
  };

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 2,
        p: 2,
        zIndex: 9999,
        boxShadow: 3,
        minWidth: 200
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        🧪 Test Notificaciones
      </Typography>
      
      <Stack spacing={1}>
        <Button
          size="small"
          variant="outlined"
          onClick={generateRandomNotification}
        >
          + Notificación
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          color="warning"
          onClick={generateRandomAlert}
        >
          + Alerta
        </Button>
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Solo visible en desarrollo
      </Typography>
    </Box>
  );
};

export default NotificationsTestPanel;
