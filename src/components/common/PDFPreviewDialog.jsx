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
  Alert,
  Avatar,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Security as SecurityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: '#ffffff',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 3,
        pt: 3,
        px: 3,
        backgroundColor: '#ffffff',
        borderBottom: 'none'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{
              width: 52,
              height: 52,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
              <ReceiptIcon sx={{ 
                fontSize: 24, 
                color: theme.palette.primary.main 
              }} />
            </Avatar>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: alpha(theme.palette.primary.main, 0.9),
              fontSize: '1.25rem'
            }}>
              {title}
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {finalUrl ? (
          <Box sx={{ width: '100%' }}>
            {finalMetadata?.type?.startsWith('image/') ? (
              // Vista previa de imágenes
              <Card sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
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
                  p: 3, 
                  background: alpha(theme.palette.info.main, 0.02),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
                  borderRadius: 2,
                  borderBottom: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`
                    }}>
                      <PictureAsPdfIcon sx={{ 
                        fontSize: 22, 
                        color: theme.palette.error.main 
                      }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600,
                        color: 'text.primary'
                      }}>
                        {finalMetadata?.originalName || finalMetadata?.name || filename}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Documento PDF • {finalMetadata?.size ? (finalMetadata.size / 1024 / 1024).toFixed(2) : '1.08'} MB
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    background: alpha(theme.palette.success.main, 0.1),
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                  }}>
                    <Avatar sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                    }}>
                      <SecurityIcon sx={{ 
                        fontSize: 14, 
                        color: theme.palette.success.main 
                      }} />
                    </Avatar>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.success.main,
                      fontWeight: 600
                    }}>
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
              <Box sx={{ 
                mt: 3, 
                p: 3, 
                background: alpha(theme.palette.info.main, 0.02),
                border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
                borderRadius: 2
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2
                }}>
                  <Avatar sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                  }}>
                    <ReceiptIcon sx={{ 
                      fontSize: 16, 
                      color: theme.palette.info.main 
                    }} />
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600,
                    color: alpha(theme.palette.info.main, 0.9)
                  }}>
                    Información del Archivo
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
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
      
      <DialogActions sx={{ 
        p: 3, 
        pt: 2, 
        gap: 2,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        justifyContent: 'space-between' 
      }}>
        {/* Botón de descarga solo si tiene permisos */}
        {canDownloadReceipts && finalUrl && (
          <Button 
            variant="outlined"
            onClick={() => window.open(finalUrl, '_blank')}
            startIcon={<DownloadIcon />}
            sx={{ 
              color: 'success.main',
              borderColor: alpha(theme.palette.success.main, 0.6),
              '&:hover': {
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                borderColor: theme.palette.success.main,
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Descargar
          </Button>
        )}
        
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.9),
            '&:hover': {
              bgcolor: theme.palette.primary.main,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFPreviewDialog;
