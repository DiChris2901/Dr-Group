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
import { fCurrency } from '../../utils/formatNumber';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  const [originalCommitment, setOriginalCommitment] = useState(null);
  const [loadingOriginalCommitment, setLoadingOriginalCommitment] = useState(false);

  // Función para cargar datos del compromiso original
  const loadOriginalCommitmentData = async (commitmentId) => {
    if (!commitmentId) return null;
    
    try {
      setLoadingOriginalCommitment(true);
      const commitmentRef = doc(db, 'commitments', commitmentId);
      const commitmentSnap = await getDoc(commitmentRef);
      
      if (commitmentSnap.exists()) {
        const data = commitmentSnap.data();
        setOriginalCommitment(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error cargando compromiso original:', error);
      return null;
    } finally {
      setLoadingOriginalCommitment(false);
    }
  };

  // Cargar compromiso original cuando se abre el modal
  useEffect(() => {
    if (open && commitment?.id) {
      loadOriginalCommitmentData(commitment.id);
    }
  }, [open, commitment?.id]);

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
  
  // Determinar la URL final del comprobante con validación MEJORADA - SOLUCIÓN DEFINITIVA
  const finalReceiptUrl = useMemo(() => {
    console.log('🔍 [DEBUG PaymentReceiptViewer] Determinando URL final:', {
      propsReceiptUrl: receiptUrl,
      commitmentAttachments: commitment?.attachments, // ← NUEVA PRIORIDAD
      commitmentReceiptUrls: commitment?.receiptUrls,
      commitmentReceiptUrl: commitment?.receiptUrl,
      paymentReceiptUrl: payment?.receiptUrl
    });

    // PRIORIDAD 1: receiptUrl prop si existe y es válido
    if (receiptUrl && receiptUrl.trim() !== '') {
      console.log('✅ [DEBUG] Usando receiptUrl prop:', receiptUrl);
      return receiptUrl;
    }
    
    // PRIORIDAD 2: attachments más reciente del commitment (URLs MÁS FRESCAS)
    if (commitment?.attachments && commitment.attachments.length > 0) {
      const latestUrl = commitment.attachments[commitment.attachments.length - 1];
      console.log('✅ [DEBUG] Usando attachments más reciente (FRESCO):', latestUrl);
      return latestUrl;
    }
    
    // PRIORIDAD 3: receiptUrls más reciente del commitment
    if (commitment?.receiptUrls && commitment.receiptUrls.length > 0) {
      const latestUrl = commitment.receiptUrls[commitment.receiptUrls.length - 1];
      console.log('⚠️ [DEBUG] Usando receiptUrls más reciente (PUEDE ESTAR EXPIRADA):', latestUrl);
      return latestUrl;
    }
    
    // PRIORIDAD 3: receiptUrl del commitment
    if (commitment?.receiptUrl && commitment.receiptUrl.trim() !== '') {
      console.log('✅ [DEBUG] Usando receiptUrl del commitment:', commitment.receiptUrl);
      return commitment.receiptUrl;
    }
    
    // PRIORIDAD 4: receiptUrl del payment (último recurso)
    if (payment?.receiptUrl && payment.receiptUrl.trim() !== '') {
      console.log('✅ [DEBUG] Usando receiptUrl del payment:', payment.receiptUrl);
      return payment.receiptUrl;
    }
    
    console.warn('⚠️ [DEBUG] No se encontró URL válida para el comprobante');
    return null;
  }, [receiptUrl, commitment?.receiptUrls, commitment?.receiptUrl, payment?.receiptUrl]);
  
  console.log('🔍 PaymentReceiptViewer - Validaciones:', {
    validPaymentDate,
    hasReceipt,
    receiptUrl,
    commitmentReceiptUrl: commitment?.receiptUrl,
    commitmentReceiptUrls: commitment?.receiptUrls,
    finalReceiptUrl,
    commitmentId: commitment?.id
  });

  // LOGGING CRÍTICO MEJORADO para debug del error 403
  console.log('🚨 [DEBUG 403] PaymentReceiptViewer URL Analysis COMPLETO:', {
    // Props recibidas
    propsReceiptUrl: receiptUrl,
    receiptMetadata: receiptMetadata,
    
    // Commitment data
    commitmentId: commitment?.id,
    commitmentReceiptUrl: commitment?.receiptUrl,
    commitmentReceiptUrls: commitment?.receiptUrls,
    commitmentReceiptUrlsLength: commitment?.receiptUrls?.length || 0,
    
    // Payment data
    paymentReceiptUrl: payment?.receiptUrl,
    
    // URLs finales calculadas
    finalReceiptUrlCalculated: finalReceiptUrl,
    
    // Estado del componente
    hasReceipt,
    validPaymentDate,
    
    // Datos completos para debug
    commitmentFullStructure: {
      id: commitment?.id,
      concept: commitment?.concept,
      receiptUrl: commitment?.receiptUrl,
      receiptUrls: commitment?.receiptUrls,
      attachments: commitment?.attachments,
      paid: commitment?.paid,
      isPaid: commitment?.isPaid
    }
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
              borderRadius: 1,
              background: 'white',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: `1px solid ${tokens.getBorder('soft')}`,
              overflow: 'hidden'
            }
          }}
        >
          {/* � Header Sobrio Corporativo */}
          <DialogTitle>
            <Paper sx={{ 
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              borderRadius: 1,
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Typography variant="overline" sx={{
                  fontWeight: 600, 
                  fontSize: '0.7rem', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  letterSpacing: 1.2
                }}>
                  FINANZAS • COMPROBANTE
                </Typography>
                <Typography variant="h4" sx={{
                  fontWeight: 700, 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  📄 Comprobante de Pago
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  Detalles de la transacción
                </Typography>
              </Box>
            </Paper>
          </DialogTitle>

          <DialogContent sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'white',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: alpha(theme.palette.divider, 0.1),
            },
            '&::-webkit-scrollbar-thumb': {
              background: alpha(theme.palette.action.active, 0.2),
              borderRadius: 3,
            },
          }}>
            {/* 📊 Tarjetas de Información Principal - Diseño Sobrio */}
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
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      height: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: alpha(theme.palette.primary.main, 0.8)
                      }
                    }}
                  >
                    <Typography variant="overline" sx={{ 
                      fontWeight: 500, 
                      mb: 2,
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      letterSpacing: 0.5
                    }}>
                      Monto Pagado
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      fontSize: '1.5rem'
                    }}>
                      {fCurrency(payment.amount)}
                    </Typography>
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
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      height: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: alpha(theme.palette.primary.main, 0.8)
                      }
                    }}
                  >
                    <Typography variant="overline" sx={{ 
                      fontWeight: 500, 
                      mb: 2,
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      letterSpacing: 0.5
                    }}>
                      Fecha de Pago
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary, 
                      fontSize: '1.5rem'
                    }}>
                      {format(validPaymentDate, 'dd/MM/yyyy', { locale: es })}
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
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      height: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: alpha(theme.palette.primary.main, 0.8)
                      }
                    }}
                  >
                    <Typography variant="overline" sx={{ 
                      fontWeight: 500, 
                      mb: 2,
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      letterSpacing: 0.5
                    }}>
                      Método de Pago
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary, 
                      fontSize: '1.5rem'
                    }}>
                      {payment.paymentMethod || 'Transferencia'}
                    </Typography>
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
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderColor: alpha(theme.palette.primary.main, 0.8)
                  }
                }}>
                  <Typography variant="h6" sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: '1rem'
                  }}>
                    Notas Adicionales
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 400, 
                    lineHeight: 1.6,
                    color: theme.palette.text.primary
                  }}>
                    {payment.notes}
                  </Typography>
                </Paper>
              </motion.div>
            )}

            {/* 📊 NUEVA SECCIÓN: Información Detallada del Pago */}
            <motion.div
              key="payment-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Paper sx={{ 
                mt: 3, 
                p: 3, 
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderColor: alpha(theme.palette.primary.main, 0.8)
                }
              }}>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.text.primary, 
                  fontWeight: 600, 
                  mb: 3,
                  fontSize: '1rem'
                }}>
                  Información del Pago
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Empresa */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Empresa
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {commitment?.companyName || payment.companyName || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Concepto del Compromiso */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Concepto
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>
                        {commitment?.concept || payment.concept || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Referencia de Pago */}
                  {commitment?.reference && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Referencia
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {commitment.reference}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {/* SECCIÓN DE MONTOS Y DETALLES - SIEMPRE VISIBLE CON DEBUG */}
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                  <Typography variant="h6" sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 600, 
                    mb: 3,
                    fontSize: '1rem'
                  }}>
                    Desglose del Pago
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Verificar si es Coljuegos CON DATOS CORRECTOS */}
                    {(() => {
                      // Usar commitment que contiene todos los datos mapeados desde PaymentsPage
                      const isColjuegos = 
                        // Por provider/beneficiary
                        commitment?.provider?.toLowerCase()?.includes('coljuegos') || 
                        commitment?.beneficiary?.toLowerCase()?.includes('coljuegos') ||
                        
                        // Por concepto/referencia
                        commitment?.concept?.toLowerCase()?.includes('coljuegos') ||
                        commitment?.reference?.toLowerCase()?.includes('coljuegos') ||
                        
                        // Por conceptos específicos de Coljuegos
                        commitment?.concept?.toLowerCase()?.includes('derechos') ||
                        commitment?.concept?.toLowerCase()?.includes('explotación') ||
                        commitment?.concept?.toLowerCase()?.includes('gastos') ||
                        
                        // Por referencia con "impuestos coljuegos"
                        commitment?.reference?.toLowerCase()?.includes('impuestos');
                      
                      console.log('🔍 Debug PaymentReceiptViewer - DATOS CORRECTOS:');
                      console.log('- isColjuegos:', isColjuegos);
                      console.log('- commitment.concept:', commitment?.concept);
                      console.log('- commitment.reference:', commitment?.reference);
                      console.log('- commitment.provider:', commitment?.provider);
                      console.log('- commitment.derechosExplotacion:', commitment?.derechosExplotacion);
                      console.log('- commitment.gastosAdministracion:', commitment?.gastosAdministracion);
                      console.log('- commitment.interesesDerechosExplotacion:', commitment?.interesesDerechosExplotacion);
                      console.log('- commitment.interesesGastosAdministracion:', commitment?.interesesGastosAdministracion);
                      console.log('- commitment completo:', commitment);
                      console.log('🚨 VALORES RECIBIDOS:');
                      console.log('- derechosExplotacion valor:', commitment?.derechosExplotacion, 'tipo:', typeof commitment?.derechosExplotacion);
                      console.log('- gastosAdministracion valor:', commitment?.gastosAdministracion, 'tipo:', typeof commitment?.gastosAdministracion);
                      
                      if (isColjuegos) {
                        return (
                          <>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="success.main" sx={{ fontStyle: 'italic' }}>
                                ✅ Detectado como pago Coljuegos
                              </Typography>
                            </Grid>
                            
                            {/* Derechos de Explotación Base - USAR DATOS REALES COMO EN MODAL EDICIÓN */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Derechos Explotación
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                  {(() => {
                                    // MISMA LÓGICA QUE EN MODAL DE EDICIÓN:
                                    // Primero del pago, si no está, del compromiso original
                                    const fromPayment = commitment?.derechosExplotacion;
                                    const fromOriginalCommitment = originalCommitment?.derechosExplotacion;
                                    const finalValue = fromPayment ?? fromOriginalCommitment ?? 0;
                                    
                                    console.log('🎯 Debug Derechos Explotación:', {
                                      fromPayment,
                                      fromOriginalCommitment,
                                      finalValue,
                                      'commitment object': commitment,
                                      'originalCommitment object': originalCommitment
                                    });
                                    
                                    return fCurrency(finalValue);
                                  })()}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Gastos de Administración Base - USAR DATOS REALES COMO EN MODAL EDICIÓN */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Gastos Administración
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                  {(() => {
                                    // MISMA LÓGICA QUE EN MODAL DE EDICIÓN:
                                    // Primero del pago, si no está, del compromiso original
                                    const fromPayment = commitment?.gastosAdministracion;
                                    const fromOriginalCommitment = originalCommitment?.gastosAdministracion;
                                    const finalValue = fromPayment ?? fromOriginalCommitment ?? 0;
                                    
                                    console.log('📋 Debug Gastos Administración:', {
                                      fromPayment,
                                      fromOriginalCommitment,
                                      finalValue
                                    });
                                    
                                    return fCurrency(finalValue);
                                  })()}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Intereses de Derechos de Explotación */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  📈 Intereses Derechos:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                  {fCurrency(commitment?.interesesDerechosExplotacion || 0)}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Intereses de Gastos de Administración */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  📈 Intereses Gastos:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                  {fCurrency(commitment?.interesesGastosAdministracion || 0)}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                                ⚠️ Detectado como pago regular (No Coljuegos)
                              </Typography>
                            </Grid>
                            
                            {/* Monto Base/Impuestos - SIEMPRE MOSTRAR */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  📊 Monto Base:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                  {fCurrency(commitment?.originalAmount || commitment?.amount || 0)}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Intereses generales - SIEMPRE MOSTRAR */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  💸 Intereses:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                  {fCurrency(commitment?.interests || 0)}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        );
                      }
                    })()}
                    
                    {/* Mostrar Total Pagado - SIEMPRE VISIBLE */}
                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mt: 2, 
                        pt: 2, 
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 1,
                        px: 2,
                        py: 1
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: theme.palette.text.primary
                        }}>
                          Total Pagado
                        </Typography>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 600, 
                          color: theme.palette.text.primary
                        }}>
                          {fCurrency(commitment?.amount || 0)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                  <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, mb: 2, display: 'block' }}>
                    💰 Desglose del Pago
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* PARA COLJUEGOS */}
                    {(commitment?.provider?.toLowerCase().includes('coljuegos') || 
                      commitment?.beneficiary?.toLowerCase().includes('coljuegos') ||
                      payment.companyName?.toLowerCase().includes('coljuegos')) ? (
                      <>
                        {/* Derechos de Explotación Base */}
                        {(payment.derechosExplotacion || commitment?.derechosExplotacion) && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                🎯 Derechos Explotación:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {fCurrency(payment.derechosExplotacion || commitment?.derechosExplotacion || 0)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Gastos de Administración Base */}
                        {(payment.gastosAdministracion || commitment?.gastosAdministracion) && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                📋 Gastos Administración:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {fCurrency(payment.gastosAdministracion || commitment?.gastosAdministracion || 0)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Intereses de Derechos de Explotación */}
                        {(payment.interesesDerechosExplotacion && payment.interesesDerechosExplotacion > 0) && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                � Intereses Derechos:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                {fCurrency(payment.interesesDerechosExplotacion)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Intereses de Gastos de Administración */}
                        {(payment.interesesGastosAdministracion && payment.interesesGastosAdministracion > 0) && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                📈 Intereses Gastos:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                {fCurrency(payment.interesesGastosAdministracion)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </>
                    ) : (
                      <>
                        {/* PARA OTROS PAGOS (NO COLJUEGOS) */}
                        {/* Impuestos */}
                        {(payment.originalAmount && payment.originalAmount > 0) && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                � Impuestos:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                {fCurrency(payment.originalAmount)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Intereses generales */}
                        {(payment.interests && payment.interests > 0) && (
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                💸 Intereses:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                {fCurrency(payment.interests)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </Box>
              </Paper>
            </motion.div>

            {/* 📎 Comprobante */}
            {finalReceiptUrl && (
              <motion.div
                key="payment-receipt"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <Paper sx={{ 
                  mt: 3, 
                  p: 4, 
                  borderRadius: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderColor: alpha(theme.palette.primary.main, 0.8)
                  }
                }}>
                  <Typography variant="h6" sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: '1rem'
                  }}>
                    Comprobante de Pago
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    mb: 3, 
                    fontWeight: 400,
                    color: theme.palette.text.primary
                  }}>
                    {receiptMetadata?.name || 'comprobante.pdf'}
                    {receiptMetadata?.size && (
                      <Chip 
                        label={`${Math.round(receiptMetadata.size / 1024)} KB`}
                        size="small"
                        sx={{ 
                          ml: 1,
                          fontWeight: 500,
                          border: `1px solid ${theme.palette.divider}`
                        }}
                      />
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Visibility />}
                    onClick={() => setPreviewDialogOpen(true)}
                    sx={{
                      borderRadius: 1,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                  >
                    Ver Comprobante
                  </Button>
                </Paper>
              </motion.div>
            )}

            {/* ✅ Botón Cerrar */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={onClose}
                sx={{
                  borderRadius: 1,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600
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
