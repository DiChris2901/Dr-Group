import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Box,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close,
  Visibility,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fCurrency } from '../../utils/formatUtils';
import { useTokens } from '../../hooks/useTokens';
import PDFPreviewDialog from '../common/PDFPreviewDialog';

const PaymentReceiptViewer = ({ 
  open, 
  onClose, 
  commitment, // Cambiado de payment a commitment
  receiptUrl,
  receiptMetadata 
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [canViewReceipts, setCanViewReceipts] = useState(true); // Bypass temporal

  // Extraer datos de pago del commitment
  const payment = commitment ? {
    amount: commitment.amount,
    paidAt: commitment.paidAt,
    paymentMethod: commitment.paymentMethod,
    notes: commitment.paymentNotes || commitment.notes,
    receiptUrl: commitment.receiptUrl || (commitment.receiptUrls && commitment.receiptUrls.length > 0 ? commitment.receiptUrls[0] : null)
  } : null;

  // Logging para debug
  console.log('🔍 PaymentReceiptViewer - Props recibidas:', {
    open,
    commitment,
    receiptUrl,
    receiptMetadata
  });
  console.log('🔍 PaymentReceiptViewer - Payment extraído:', payment);

  // Validación de fecha de pago
  const validPaymentDate = payment?.paidAt?.toDate?.() || payment?.paidAt || new Date();
  const hasReceipt = Boolean(receiptUrl || payment?.receiptUrl || commitment?.receiptUrls?.length > 0);
  
  // Determinar la URL final del comprobante con validación
  const finalReceiptUrl = useMemo(() => {
    // Priorizar receiptUrl prop si existe y es válido
    if (receiptUrl && receiptUrl.trim() !== '') return receiptUrl;
    
    // Luego verificar receiptUrls más reciente
    if (commitment?.receiptUrls && commitment.receiptUrls.length > 0) {
      return commitment.receiptUrls[commitment.receiptUrls.length - 1]; // Tomar el más reciente
    }
    
    // Finalmente receiptUrl del commitment
    if (commitment?.receiptUrl && commitment.receiptUrl.trim() !== '') {
      return commitment.receiptUrl;
    }
    
    // Último recurso: payment receiptUrl
    if (payment?.receiptUrl && payment.receiptUrl.trim() !== '') {
      return payment.receiptUrl;
    }
    
    return null;
  }, [receiptUrl, commitment?.receiptUrls, commitment?.receiptUrl, payment?.receiptUrl]);
  
  console.log('🔍 PaymentReceiptViewer - Validaciones:', {
    validPaymentDate,
    hasReceipt,
    receiptUrl,
    commitmentReceiptUrl: commitment?.receiptUrl,
    commitmentReceiptUrls: commitment?.receiptUrls,
    finalReceiptUrl
  });

  if (!payment || !commitment) {
    console.warn('⚠️ PaymentReceiptViewer - No hay payment o commitment válido');
    return null;
  }

  const modalVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 }
  };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <Dialog
          key={`payment-receipt-${commitment?.id || 'dialog'}`}
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            component: motion.div,
            variants: modalVariants,
            initial: "initial",
            animate: "animate",
            exit: "exit",
            transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            sx: {
              borderRadius: 3,
              background: tokens.getSurface('primary'),
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: `1px solid ${tokens.getBorder('soft')}`,
              overflow: 'hidden'
            }
          }}
        >
          {/* 🎨 Header con gradiente */}
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircle sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  💰 Comprobante de Pago
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Detalles de la transacción
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {/* 🎯 Grid Principal - Información del Pago */}
            <Grid container spacing={3}>
              {/* 💰 Monto Pagado */}
              <Grid item xs={12} md={4}>
                <motion.div
                  key="payment-amount"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
                      border: '2px solid',
                      borderColor: 'success.main',
                      borderRadius: 3,
                      height: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)'
                      }
                    }}
                  >
                    <Typography variant="overline" color="success.main" sx={{ fontWeight: 700, mb: 1 }}>
                      💰 Monto Pagado
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 800, 
                      color: 'success.main',
                      mb: 1
                    }}>
                      {fCurrency(payment.amount)}
                    </Typography>
                    <Chip 
                      label="✅ Confirmado" 
                      color="success" 
                      variant="filled"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </Paper>
                </motion.div>
              </Grid>

              {/* 📅 Fecha de Pago */}
              <Grid item xs={12} md={4}>
                <motion.div
                  key="payment-date"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
                      border: '2px solid',
                      borderColor: 'info.main',
                      borderRadius: 3,
                      height: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(33, 150, 243, 0.15)'
                      }
                    }}
                  >
                    <Typography variant="overline" color="info.main" sx={{ fontWeight: 700, mb: 1 }}>
                      📅 Fecha de Pago
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                      {format(validPaymentDate, 'dd/MM/yyyy', { locale: es })}
                    </Typography>
                    <Typography variant="body2" color="info.dark" sx={{ fontWeight: 600 }}>
                      {format(validPaymentDate, 'HH:mm', { locale: es })} hrs
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>

              {/* 💳 Método de Pago */}
              <Grid item xs={12} md={4}>
                <motion.div
                  key="payment-method"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(156, 39, 176, 0.05))',
                      border: '2px solid',
                      borderColor: 'secondary.main',
                      borderRadius: 3,
                      height: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(156, 39, 176, 0.15)'
                      }
                    }}
                  >
                    <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 700, mb: 1 }}>
                      💳 Método de Pago
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1 }}>
                      {payment.paymentMethod || 'Transferencia'}
                    </Typography>
                    <Chip 
                      label="Procesado" 
                      color="secondary" 
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>

            {/* 📝 Notas Adicionales */}
            {payment.notes && (
              <motion.div
                key="payment-notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Paper sx={{ 
                  mt: 3, 
                  p: 3, 
                  bgcolor: alpha(theme.palette.info.main, 0.05), 
                  border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                  borderRadius: 2
                }}>
                  <Typography variant="overline" color="info.main" sx={{ fontWeight: 700, mb: 2, display: 'block' }}>
                    📝 Notas Adicionales
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.6 }}>
                    {payment.notes}
                  </Typography>
                </Paper>
              </motion.div>
            )}

            {/* 📎 Comprobante */}
            {finalReceiptUrl && (
              <motion.div
                key="payment-receipt"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Paper sx={{ 
                  mt: 3, 
                  p: 4, 
                  bgcolor: alpha(theme.palette.success.main, 0.05), 
                  border: `2px solid ${alpha(theme.palette.success.main, 0.15)}`,
                  borderRadius: 3,
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, mb: 2 }}>
                    📎 Comprobante Disponible
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                    {receiptMetadata?.name || 'comprobante.pdf'}
                    {receiptMetadata?.size && (
                      <Chip 
                        label={`${Math.round(receiptMetadata.size / 1024)} KB`}
                        size="small"
                        sx={{ 
                          ml: 1,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: 'success.dark',
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Visibility />}
                    onClick={() => setPreviewDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Ver Comprobante
                  </Button>
                </Paper>
              </motion.div>
            )}

            {/* 🚀 Botón Cerrar */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={onClose}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.45)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                ✅ Cerrar
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* 📄 Vista previa del PDF - COMPONENTE COMPARTIDO IDÉNTICO */}
      <PDFPreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        receiptUrl={finalReceiptUrl}
        receiptMetadata={receiptMetadata}
        canDownloadReceipts={false} // Sin descarga en visor de comprobantes ya pagados
        title="Vista Previa del Comprobante"
      />
    </AnimatePresence>
  );
};

export default PaymentReceiptViewer;
