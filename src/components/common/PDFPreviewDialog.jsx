import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardMedia,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Security as SecurityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import FallbackPDFViewer from './FallbackPDFViewer';

/**
 * PDFPreviewDialog - Componente reutilizable para vista previa de comprobantes
 * Usado por PaymentPopupPremium y PaymentReceiptViewer
 * IDÉNTICO al visor del PaymentPopupPremium
 * 
 * Props:
 * - open: boolean - Si el dialog está abierto
 * - onClose: function - Función para cerrar el dialog
 * - receiptUrl: string - URL del archivo (se puede llamar url para compatibilidad)
 * - receiptMetadata: object - Metadatos del archivo (name, size, type, originalName)
 * - canDownloadReceipts: boolean - Si se puede descargar el archivo
 * - title: string - Título del dialog
 */
const PDFPreviewDialog = ({ 
  open, 
  onClose, 
  url,                    // Para compatibilidad hacia atrás
  receiptUrl,             // Nuevo parámetro preferido
  filename = 'comprobante.pdf',
  metadata,               // Para compatibilidad hacia atrás
  receiptMetadata,        // Nuevo parámetro preferido
  canDownloadReceipts = false,
  title = "Vista Previa del Comprobante"
}) => {
  // Compatibilidad: usar receiptUrl o url, receiptMetadata o metadata
  const finalUrl = receiptUrl || url;
  const finalMetadata = receiptMetadata || metadata;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: 600
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          {title}
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {finalUrl ? (
          <Box sx={{ width: '100%' }}>
            {finalMetadata?.type?.startsWith('image/') ? (
              // Vista previa de imágenes
              <Card sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                borderRadius: 2
              }}>
                <CardMedia
                  component="img"
                  image={finalUrl}
                  alt="Comprobante de pago"
                  sx={{ 
                    width: '100%',
                    height: 'auto',
                    maxHeight: 500,
                    objectFit: 'contain'
                  }}
                />
              </Card>
            ) : (
              // Vista previa segura de PDFs
              <Box sx={{ width: '100%' }}>
                <Box sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderRadius: '8px 8px 0 0',
                  border: '2px solid #dee2e6',
                  borderBottom: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PictureAsPdfIcon sx={{ fontSize: 24, color: '#dc3545' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {finalMetadata?.originalName || finalMetadata?.name || filename}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Documento PDF • {finalMetadata?.size ? (finalMetadata.size / 1024 / 1024).toFixed(2) : '1.08'} MB
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ fontSize: 16, color: '#28a745' }} />
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                      Vista Segura
                    </Typography>
                  </Box>
                </Box>
                
                {/* Visor PDF mejorado - IDÉNTICO al PaymentPopupPremium */}
                <FallbackPDFViewer 
                  url={finalUrl}
                  height={500}
                  filename={finalMetadata?.originalName || finalMetadata?.name || filename}
                  onError={(error) => {
                    console.error('Error loading PDF:', error);
                  }}
                />
              </Box>
            )}
            
            {finalMetadata && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <strong>Archivo:</strong> {finalMetadata.originalName || finalMetadata.name || filename}<br/>
                  <strong>Tamaño:</strong> {finalMetadata.size ? (finalMetadata.size / 1024 / 1024).toFixed(2) : '1.08'} MB<br/>
                  <strong>Tipo:</strong> {finalMetadata.type || 'application/pdf'}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              No se encontró el archivo del comprobante.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
        {/* Botón de descarga solo si tiene permisos - IDÉNTICO al PaymentPopupPremium */}
        {canDownloadReceipts && finalUrl && (
          <Button 
            variant="outlined"
            onClick={() => window.open(finalUrl, '_blank')}
            startIcon={<DownloadIcon />}
            sx={{ 
              color: 'success.main',
              borderColor: 'success.main',
              '&:hover': {
                backgroundColor: 'success.light',
                borderColor: 'success.dark'
              }
            }}
          >
            Descargar
          </Button>
        )}
        
        <Button 
          onClick={onClose}
          variant="contained"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFPreviewDialog;
