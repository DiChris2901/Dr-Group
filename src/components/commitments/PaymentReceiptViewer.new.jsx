import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Box,
  IconButton,
  Avatar,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fCurrency } from '../../utils/formatNumber';
import { db } from '../../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useTokens } from '../../hooks/useTokens';
import PDFPreviewDialog from '../common/PDFPreviewDialog';

const PaymentReceiptViewer = ({ 
  open, 
  onClose, 
  commitment,
  receiptUrl,
  receiptMetadata 
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Determinar la URL del comprobante
  const finalReceiptUrl = useMemo(() => {
    if (receiptUrl && receiptUrl.trim() !== '') {
      return receiptUrl;
    }
    if (commitment?.attachments && commitment.attachments.length > 0) {
      return commitment.attachments[commitment.attachments.length - 1];
    }
    if (commitment?.receiptUrls && commitment.receiptUrls.length > 0) {
      return commitment.receiptUrls[0];
    }
    if (commitment?.receiptUrl) {
      return commitment.receiptUrl;
    }
    return null;
  }, [receiptUrl, commitment]);

  if (!commitment) return null;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
            }
          }}
        >
          {/* Header - Siguiendo políticas de diseño exactas */}
          <DialogTitle sx={{ 
            pb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' 
              ? theme.palette.grey[900]
              : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
                  Detalle del Pago
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {commitment?.beneficiary || commitment?.empresa || 'Información completa'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {/* Content - Siguiendo Grid md={8,4} para modal de vista */}
          <DialogContent sx={{ p: 3, pt: 5 }}>
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                {/* Información Principal */}
                <Grid item xs={12} md={8}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <Typography variant="overline" sx={{ 
                      fontWeight: 600, 
                      color: 'primary.main',
                      letterSpacing: 0.8,
                      fontSize: '0.75rem'
                    }}>
                      Información General
                    </Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Monto Pagado */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          💰 Monto Pagado
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {fCurrency(commitment?.amount || commitment?.partialPaymentAmount || 0)}
                        </Typography>
                      </Box>
                      
                      {/* Fecha de Pago */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          📅 Fecha de Pago
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {commitment?.fecha ? format(commitment.fecha, 'dd MMM yyyy', { locale: es }) : 'No definida'}
                        </Typography>
                      </Box>
                      
                      {/* Método de Pago */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          💳 Método de Pago
                        </Typography>
                        <Chip 
                          label={commitment?.metodoPago || 'Transferencia'} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Box>
                      
                      {/* Beneficiario */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          👤 Beneficiario
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {commitment?.beneficiary || commitment?.empresa || 'No definido'}
                        </Typography>
                      </Box>
                      
                      {/* Referencia */}
                      {commitment?.referencia && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            📋 Referencia
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {commitment.referencia}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Información Lateral - Archivos */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <Typography variant="overline" sx={{ 
                      fontWeight: 600, 
                      color: 'secondary.main',
                      letterSpacing: 0.8,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📎 Comprobantes
                    </Typography>
                    
                    {/* Sección de comprobantes */}
                    <Box sx={{ mt: 2 }}>
                      {finalReceiptUrl ? (
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          backgroundColor: alpha(theme.palette.info.main, 0.05)
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                            📄 comprobante.pdf
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setPreviewDialogOpen(true)}
                            sx={{ borderRadius: 1, textTransform: 'none' }}
                          >
                            Ver Comprobante
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 4, 
                          borderRadius: 2, 
                          border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Sin comprobantes disponibles
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          
          {/* Actions - Siguiendo políticas de diseño exactas */}
          <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              ID: {commitment?.id || `Creado: ${commitment?.createdAt ? format(commitment.createdAt, 'dd MMM yyyy', { locale: es }) : 'N/A'}`}
            </Typography>
            <Button 
              onClick={onClose} 
              variant="contained" 
              color="primary" 
              sx={{ borderRadius: 1, fontWeight: 600, px: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Vista previa del PDF */}
      <PDFPreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        receiptUrl={finalReceiptUrl}
        receiptMetadata={receiptMetadata}
        canDownloadReceipts={false}
        title="Vista Previa del Comprobante"
      />
    </AnimatePresence>
  );
};

export default PaymentReceiptViewer;
