import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * 🔗 Preview Dialog - Non-Blocking Navigation
 * 
 * Muestra vista previa de entidades sin salir del chat
 * Implementa sugerencia #1 de Gemini
 */
const PreviewDialog = ({ open, onClose, entityType, entityId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !entityType || !entityId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Mapear entityType a collection de Firestore
        const collectionMap = {
          'invoice': 'invoices',
          'client': 'clients',
          'company': 'companies',
          'commitment': 'commitments',
          'payment': 'payments'
        };

        const collectionName = collectionMap[entityType];
        if (!collectionName) {
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
        }

        // Obtener documento
        const docRef = doc(db, collectionName, entityId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Documento no encontrado');
        }

        setData({ id: docSnap.id, ...docSnap.data() });
      } catch (err) {
        console.error('Error cargando preview:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, entityType, entityId]);

  // Renderizar contenido según tipo
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!data) return null;

    // Renderizar según tipo de entidad
    switch (entityType) {
      case 'invoice':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Número de Factura
            </Typography>
            <Typography variant="h6" gutterBottom>
              {data.invoiceNumber || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Cliente
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.clientName || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Monto Total
            </Typography>
            <Typography variant="h5" color="primary" fontWeight={600}>
              ${(data.totalAmount || 0).toLocaleString('es-CO')}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Estado
            </Typography>
            <Typography variant="body1">
              {data.status || 'Pendiente'}
            </Typography>

            {data.dueDate && (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Fecha de Vencimiento
                </Typography>
                <Typography variant="body1">
                  {new Date(data.dueDate.seconds * 1000).toLocaleDateString('es-CO')}
                </Typography>
              </>
            )}
          </Box>
        );

      case 'client':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nombre
            </Typography>
            <Typography variant="h6" gutterBottom>
              {data.name || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Email
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.email || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Teléfono
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.phone || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Empresa
            </Typography>
            <Typography variant="body1">
              {data.companyName || 'N/A'}
            </Typography>
          </Box>
        );

      case 'company':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nombre de la Empresa
            </Typography>
            <Typography variant="h6" gutterBottom>
              {data.name || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              NIT
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.nit || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Dirección
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.address || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Teléfono
            </Typography>
            <Typography variant="body1">
              {data.phone || 'N/A'}
            </Typography>
          </Box>
        );

      case 'commitment':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Concepto
            </Typography>
            <Typography variant="h6" gutterBottom>
              {data.concept || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Monto
            </Typography>
            <Typography variant="h5" color="primary" fontWeight={600} gutterBottom>
              ${(data.amount || 0).toLocaleString('es-CO')}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Fecha de Vencimiento
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.dueDate?.toDate?.().toLocaleDateString('es-CO') || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Estado
            </Typography>
            <Typography variant="body1">
              {data.status === 'paid' ? '✅ Pagado' : '🟡 Pendiente'}
            </Typography>
          </Box>
        );

      case 'payment':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Concepto
            </Typography>
            <Typography variant="h6" gutterBottom>
              {data.concept || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Monto
            </Typography>
            <Typography variant="h5" color="success.main" fontWeight={600} gutterBottom>
              ${(data.amount || 0).toLocaleString('es-CO')}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Método de Pago
            </Typography>
            <Typography variant="body1" gutterBottom>
              {data.method || data.paymentMethod || 'N/A'}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Fecha
            </Typography>
            <Typography variant="body1">
              {data.date?.toDate?.().toLocaleDateString('es-CO') || 'N/A'}
            </Typography>
          </Box>
        );

      default:
        return (
          <Alert severity="warning" sx={{ m: 2 }}>
            Tipo de vista previa no soportado
          </Alert>
        );
    }
  };

  // Obtener ícono según tipo
  const getIcon = () => {
    switch (entityType) {
      case 'invoice':
      case 'payment':
        return <ReceiptIcon />;
      case 'client':
        return <PersonIcon />;
      case 'company':
        return <BusinessIcon />;
      default:
        return <OpenInNewIcon />;
    }
  };

  // Obtener título según tipo
  const getTitle = () => {
    switch (entityType) {
      case 'invoice':
        return '💳 Factura';
      case 'client':
        return '👤 Cliente';
      case 'company':
        return '🏢 Empresa';
      case 'commitment':
        return '📋 Compromiso';
      case 'payment':
        return '💰 Pago';
      default:
        return 'Detalles';
    }
  };

  // Obtener URL completa para abrir en nueva pestaña
  const getFullUrl = () => {
    const baseMap = {
      'invoice': '/invoices',
      'client': '/clients',
      'company': '/companies',
      'commitment': '/commitments',
      'payment': '/payments'
    };
    return `${baseMap[entityType] || ''}/${entityId}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: `0 8px 32px ${alpha('#000', 0.15)}`
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: '#fff'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {getIcon()}
            <Typography variant="h6" fontWeight={600}>
              {getTitle()}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: alpha('#000', 0.02) }}>
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          startIcon={<OpenInNewIcon />}
          onClick={() => {
            window.open(getFullUrl(), '_blank');
            onClose();
          }}
          sx={{
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          Abrir Completo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PreviewDialog;
