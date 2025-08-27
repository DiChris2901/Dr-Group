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
  Avatar,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close,
  Visibility,
  CheckCircle,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  CreditCard as CreditCardIcon,
  Analytics as AnalyticsIcon,
  Notes as NotesIcon,
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
  commitment, // Cambiado de payment a commitment
  receiptUrl,
  receiptMetadata 
}) => {
  // 🔍 DEBUG INICIAL: Ver qué datos están llegando al modal
  console.log('🚀 PaymentReceiptViewer PROPS RECEIVED:', {
    open,
    commitment,
    'commitment is null': commitment === null,
    'commitment is undefined': commitment === undefined,
    'commitment exists': !!commitment,
    'commitment keys': commitment ? Object.keys(commitment) : 'No commitment'
  });

  // 🔍 ANÁLISIS DETALLADO DE VALORES PARA ENCONTRAR EL VALOR BASE ORIGINAL
  if (commitment && open) {
    console.log('💰 ANÁLISIS COMPLETO DE VALORES - COMMITMENT:');
    console.log('📋 Commitment data completo:', JSON.stringify(commitment, null, 2));
    
    // Buscar todos los campos que podrían contener el valor base original
    console.log('💵 POSIBLES VALORES BASE ORIGINALES:');
    console.log('💵 originalCommitmentAmount:', commitment.originalCommitmentAmount);
    console.log('💵 originalAmount:', commitment.originalAmount);
    console.log('💵 amount:', commitment.amount);
    console.log('💵 partialPaymentAmount:', commitment.partialPaymentAmount);
    console.log('💵 remainingBalanceBefore:', commitment.remainingBalanceBefore);
    console.log('💵 remainingBalanceAfter:', commitment.remainingBalanceAfter);
    console.log('💵 baseAmount:', commitment.baseAmount);
    console.log('💵 commitmentAmount:', commitment.commitmentAmount);
    console.log('💵 totalAmount:', commitment.totalAmount);
    
    console.log('🔢 OTROS CAMPOS:');
    console.log('💵 intereses/interests:', commitment.intereses || commitment.interests);
    console.log('💵 iva:', commitment.iva);
    console.log('🏷️ isPartialPayment:', commitment.isPartialPayment);
    console.log('🏷️ paymentSequence:', commitment.paymentSequence);
  }

  const theme = useTheme();
  const tokens = useTokens();
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [canViewReceipts, setCanViewReceipts] = useState(true); // Bypass temporal
  const [originalCommitment, setOriginalCommitment] = useState(null);
  const [loadingOriginalCommitment, setLoadingOriginalCommitment] = useState(false);

  // 💳 Estados para información de cuotas
  const [installmentInfo, setInstallmentInfo] = useState(null);
  const [loadingInstallmentInfo, setLoadingInstallmentInfo] = useState(false);

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

  // 💳 Función para cargar información de cuotas
  const loadInstallmentInfo = async (commitment) => {
    console.log('🔍 [DEBUG CUOTAS] loadInstallmentInfo called with:', {
      commitment,
      'commitment.isInstallment': commitment?.isInstallment,
      'commitment.parentPaymentId': commitment?.parentPaymentId,
      'all commitment keys': commitment ? Object.keys(commitment) : 'no commitment'
    });
    
    if (!commitment) return;
    
    try {
      setLoadingInstallmentInfo(true);
      
      // Verificar si este pago es parte de un plan de cuotas
      const isInstallment = commitment.isInstallment;
      const parentPaymentId = commitment.parentPaymentId;
      
      console.log('🔍 [DEBUG CUOTAS] Checking installment status:', {
        isInstallment,
        parentPaymentId,
        'should load installments': isInstallment && parentPaymentId
      });
      
      if (isInstallment && parentPaymentId) {
        console.log('💳 [DEBUG CUOTAS] Loading installments for parentPaymentId:', parentPaymentId);
        
        // Obtener todas las cuotas del plan
        const installmentsQuery = query(
          collection(db, 'payments'),
          where('parentPaymentId', '==', parentPaymentId),
          orderBy('installmentNumber', 'asc')
        );
        
        const installmentsSnap = await getDocs(installmentsQuery);
        const allInstallments = installmentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('💳 [DEBUG CUOTAS] Found installments:', allInstallments);
        
        // Calcular estadísticas
        const totalInstallments = allInstallments.length;
        const paidInstallments = allInstallments.filter(inst => inst.status === 'completed').length;
        const pendingInstallments = totalInstallments - paidInstallments;
        
        const totalAmount = allInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
        const paidAmount = allInstallments
          .filter(inst => inst.status === 'completed')
          .reduce((sum, inst) => sum + (inst.amount || 0), 0);
        const pendingAmount = totalAmount - paidAmount;
        
        const installmentInfoData = {
          isInstallment: true,
          currentInstallment: commitment.installmentNumber,
          totalInstallments,
          paidInstallments,
          pendingInstallments,
          totalAmount,
          paidAmount,
          pendingAmount,
          allInstallments
        };
        
        console.log('💳 [DEBUG CUOTAS] Setting installment info:', installmentInfoData);
        setInstallmentInfo(installmentInfoData);
      } else {
        console.log('💳 [DEBUG CUOTAS] Not an installment payment, setting null');
        setInstallmentInfo(null);
      }
    } catch (error) {
      console.error('❌ Error cargando información de cuotas:', error);
      setInstallmentInfo(null);
    } finally {
      setLoadingInstallmentInfo(false);
    }
  };

  // Cargar compromiso original y información de cuotas cuando se abre el modal
  useEffect(() => {
    if (open && commitment?.id) {
      loadOriginalCommitmentData(commitment.id);
      loadInstallmentInfo(commitment);
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

  // Función para convertir número de cuenta a nombre descriptivo
  const getAccountDisplayName = (commitment) => {
    // Primero buscar nombres descriptivos directos
    const descriptiveName = commitment?.accountDisplayName || 
                           commitment?.paymentAccountDisplayName || 
                           commitment?.bankAccountDisplayName ||
                           commitment?.accountDescription ||
                           commitment?.paymentDescription ||
                           commitment?.bankDescription ||
                           commitment?.accountName ||
                           commitment?.paymentAccountName;
    
    if (descriptiveName && !descriptiveName.match(/^\d+$/)) {
      // Solo retornar si no es un número puro
      return descriptiveName;
    }
    
    // Solo mapeo directo y exacto, sin suposiciones automáticas
    const accountMapping = {
      // Agregar mapeos específicos solo cuando sean confirmados
      // '019544766': 'BBVA DiverGames',  // Comentado hasta confirmar
      // '777': 'Davivienda Juegos 777', // Comentado hasta confirmar
    };
    
    // Buscar en diferentes campos de cuenta
    const accountNumber = commitment?.paymentAccount || 
                         commitment?.bankAccount || 
                         commitment?.sourceAccount || 
                         commitment?.account;
    
    if (accountNumber && accountMapping[accountNumber]) {
      return accountMapping[accountNumber];
    }
    
    // NO hacer suposiciones automáticas por patrones
    // Retornar null si no hay nombre descriptivo explícito
    return null;
  };
  console.log('🔍 PaymentReceiptViewer - Props recibidas:', {
    open,
    commitment,
    receiptUrl,
    receiptMetadata
  });
  console.log('🔍 PaymentReceiptViewer - Payment extraído:', payment);
  console.log('🏦 PaymentReceiptViewer - Account Info Debug:', {
    accountDisplayName: getAccountDisplayName(commitment),
    rawAccountData: {
      accountName: commitment?.accountName,
      paymentAccount: commitment?.paymentAccount,
      bankAccount: commitment?.bankAccount,
      sourceAccount: commitment?.sourceAccount,
      account: commitment?.account,
    },
    allCommitmentKeys: Object.keys(commitment || {})
  });

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
          <DialogTitle sx={{ pb: 4, backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ backgroundColor: 'primary.main', width: 40, height: 40 }}>
                <ReceiptIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Detalle del Pago
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 4 }}>
            {/* 📊 Tarjetas de Información Principal - Diseño Sobrio */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
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
                      borderRadius: 2,
                      backgroundColor: 'white',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Avatar sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        color: 'success.main'
                      }}>
                        <AttachMoneyIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          mb: 0.5
                        }}>
                          MONTO PAGADO
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '1.1rem'
                        }}>
                          {fCurrency(payment.amount)}
                        </Typography>
                      </Box>
                    </Box>
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
                      borderRadius: 2,
                      backgroundColor: 'white',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Avatar sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        color: 'info.main'
                      }}>
                        <CalendarIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          mb: 0.5
                        }}>
                          FECHA DE PAGO
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '1.1rem'
                        }}>
                          {format(validPaymentDate, 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                      </Box>
                    </Box>
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
                      borderRadius: 2,
                      backgroundColor: 'white',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Avatar sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        color: 'secondary.main'
                      }}>
                        <CreditCardIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'block',
                          mb: 0.5
                        }}>
                          MÉTODO DE PAGO
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '1.1rem'
                        }}>
                          {payment.paymentMethod || 'Transferencia'}
                        </Typography>
                      </Box>
                    </Box>
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
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  backdropFilter: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Avatar sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <NotesIcon sx={{ 
                        fontSize: 18, 
                        color: theme.palette.primary.main 
                      }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ 
                      color: 'text.primary', 
                      fontWeight: 600, 
                      fontSize: '1.1rem',
                      flex: 1
                    }}>
                      Notas Adicionales
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ 
                    fontWeight: 400, 
                    lineHeight: 1.6,
                    color: theme.palette.text.secondary,
                    pl: 0,
                    fontStyle: 'normal'
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
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                backdropFilter: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}>
                    <CreditCardIcon sx={{ 
                      fontSize: 18, 
                      color: theme.palette.primary.main 
                    }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ 
                    color: 'text.primary', 
                    fontWeight: 600, 
                    fontSize: '1.1rem',
                    flex: 1
                  }}>
                    Información del Pago
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  {/* Empresa */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                        Empresa
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.primary', fontSize: '0.85rem' }}>
                        {commitment?.companyName || payment.companyName || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Concepto del Compromiso */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                        Concepto
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400, maxWidth: '60%', textAlign: 'right', color: 'text.primary', fontSize: '0.85rem' }}>
                        {commitment?.concept || payment.concept || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Referencia de Pago */}
                  {commitment?.reference && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 1,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Referencia
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.85rem' }}>
                          {commitment.reference}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Proveedor/Beneficiario - Siempre visible */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                        Proveedor/Beneficiario
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.85rem' }}>
                        {commitment?.beneficiary || 'No especificado'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* 💳 SECCIÓN DE INFORMACIÓN DE CUOTAS */}
                {(() => {
                  console.log('💳 [DEBUG RENDER CUOTAS] Checking installment render condition:', {
                    'installmentInfo': installmentInfo,
                    'installmentInfo?.isInstallment': installmentInfo?.isInstallment,
                    'should render': installmentInfo?.isInstallment
                  });
                  
                  return installmentInfo?.isInstallment;
                })() && (
                  <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.info.main, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'info.main',
                        fontSize: '1.1rem'
                      }}>
                        <CreditCardIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" sx={{ 
                        color: 'info.main', 
                        fontWeight: 600, 
                        fontSize: '1.1rem',
                        flex: 1
                      }}>
                        Plan de Cuotas
                      </Typography>
                      <Chip 
                        label={`Cuota ${installmentInfo.currentInstallment}/${installmentInfo.totalInstallments}`}
                        size="small"
                        sx={{ 
                          backgroundColor: alpha(theme.palette.info.main, 0.1),
                          color: 'info.main',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      {/* Progreso de Cuotas */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.success.main, 0.06),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem', mb: 1 }}>
                            Cuotas Pagadas
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mb: 1 }}>
                            {installmentInfo.paidInstallments} de {installmentInfo.totalInstallments}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                            {fCurrency(installmentInfo.paidAmount)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.warning.main, 0.06),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem', mb: 1 }}>
                            Cuotas Pendientes
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main', mb: 1 }}>
                            {installmentInfo.pendingInstallments} restantes
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main' }}>
                            {fCurrency(installmentInfo.pendingAmount)}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Valor Total del Compromiso */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.06),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem', mb: 1 }}>
                            Valor Total del Compromiso
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {fCurrency(installmentInfo.totalAmount)}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Detalle de Todas las Cuotas */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                          Detalle de Cuotas:
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                          {installmentInfo.allInstallments.map((installment, index) => (
                            <Box 
                              key={installment.id}
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                p: 1.5,
                                mb: 1,
                                borderRadius: 1,
                                backgroundColor: installment.status === 'completed' 
                                  ? alpha(theme.palette.success.main, 0.04)
                                  : alpha(theme.palette.grey[500], 0.04),
                                border: `1px solid ${installment.status === 'completed' 
                                  ? alpha(theme.palette.success.main, 0.15)
                                  : alpha(theme.palette.grey[500], 0.12)}`,
                                opacity: installment.installmentNumber === installmentInfo.currentInstallment ? 1 : 0.7
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 60 }}>
                                  Cuota {installment.installmentNumber}
                                </Typography>
                                {installment.installmentNumber === installmentInfo.currentInstallment && (
                                  <Chip 
                                    label="Actual" 
                                    size="small" 
                                    color="primary"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {fCurrency(installment.amount)}
                                </Typography>
                                <Chip 
                                  label={installment.status === 'completed' ? 'Pagada' : 'Pendiente'}
                                  size="small"
                                  color={installment.status === 'completed' ? 'success' : 'warning'}
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* SECCIÓN DE MONTOS Y DETALLES - SIEMPRE VISIBLE CON DEBUG */}
                <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                    }}>
                      <AttachMoneyIcon sx={{ 
                        fontSize: 20, 
                        color: theme.palette.secondary.main 
                      }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ 
                      color: 'text.primary', 
                      fontWeight: 600, 
                      fontSize: '1.1rem',
                      flex: 1
                    }}>
                      Desglose del Pago
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {/* Verificar si es Coljuegos CON DATOS CORRECTOS */}
                    {(() => {
                      // ✅ LÓGICA BASADA EN DATOS REALES, NO EN TEXTO
                      // Si tiene datos específicos de Coljuegos, mostrar campos de Coljuegos
                      const hasDerechosExplotacion = (commitment?.derechosExplotacion ?? 0) > 0;
                      const hasGastosAdministracion = (commitment?.gastosAdministracion ?? 0) > 0;
                      const hasInteresesDerechos = (commitment?.interesesDerechosExplotacion ?? 0) > 0;
                      const hasInteresesGastos = (commitment?.interesesGastosAdministracion ?? 0) > 0;
                      
                      // Es Coljuegos si tiene CUALQUIER dato específico de Coljuegos
                      const isColjuegos = hasDerechosExplotacion || hasGastosAdministracion || hasInteresesDerechos || hasInteresesGastos;
                      
                      console.log('🔍 Debug PaymentReceiptViewer - LÓGICA BASADA EN DATOS:');
                      console.log('- hasDerechosExplotacion:', hasDerechosExplotacion, `(${commitment?.derechosExplotacion})`);
                      console.log('- hasGastosAdministracion:', hasGastosAdministracion, `(${commitment?.gastosAdministracion})`);
                      console.log('- hasInteresesDerechos:', hasInteresesDerechos, `(${commitment?.interesesDerechosExplotacion})`);
                      console.log('- hasInteresesGastos:', hasInteresesGastos, `(${commitment?.interesesGastosAdministracion})`);
                      console.log('- isColjuegos (FINAL):', isColjuegos);
                      console.log('- commitment.concept:', commitment?.concept);
                      console.log('- commitment.reference:', commitment?.reference);
                      
                      // 🔍 DEBUG PAYMENT DATA TAMBIÉN
                      console.log('💰 PAYMENT DATA DEBUG (commitment object):');
                      console.log('- commitment.interesesDerechosExplotacion:', commitment?.interesesDerechosExplotacion);
                      console.log('- commitment.interesesGastosAdministracion:', commitment?.interesesGastosAdministracion);
                      console.log('- commitment.interests (total):', commitment?.interests);
                      console.log('- commitment.amount:', commitment?.amount);
                      console.log('- commitment completo:', commitment);
                      
                      // 🔍 DEBUG IVA Y OTROS IMPUESTOS
                      console.log('💳 IVA AND TAX DEBUG:');
                      console.log('- commitment.iva:', commitment?.iva);
                      console.log('- commitment.tax:', commitment?.tax);
                      console.log('- commitment.taxes:', commitment?.taxes);
                      console.log('- commitment.baseAmount:', commitment?.baseAmount);
                      console.log('- commitment.originalAmount:', commitment?.originalAmount);
                      console.log('- commitment.vatAmount:', commitment?.vatAmount);
                      console.log('- commitment.ivaAmount:', commitment?.ivaAmount);
                      
                      // 🔍 DEBUG ORIGINALCOMMITMENT DATA
                      console.log('📋 ORIGINAL COMMITMENT DATA DEBUG:');
                      console.log('- originalCommitment.interesesDerechosExplotacion:', originalCommitment?.interesesDerechosExplotacion);
                      console.log('- originalCommitment.interesesGastosAdministracion:', originalCommitment?.interesesGastosAdministracion);
                      console.log('- originalCommitment.iva:', originalCommitment?.iva);
                      console.log('- originalCommitment completo:', originalCommitment);
                      
                      if (isColjuegos) {
                        return (
                          <>
                            {/* Derechos de Explotación Base - USAR DATOS REALES COMO EN MODAL EDICIÓN */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1.2,
                                borderRadius: 1.5,
                                backgroundColor: alpha(theme.palette.success.main, 0.06),
                                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  Derechos Explotación
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main', fontSize: '0.9rem' }}>
                                  {(() => {
                                    // ✅ BUSCAR DATOS EN COMMITMENT PRIMERO (que contiene datos del pago)
                                    // Luego en originalCommitment como fallback
                                    const fromCommitment = commitment?.derechosExplotacion;
                                    const fromOriginalCommitment = originalCommitment?.derechosExplotacion;
                                    const finalValue = fromCommitment ?? fromOriginalCommitment ?? 0;
                                    
                                    console.log('🎯 Debug Derechos Explotación:', {
                                      fromCommitment,
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
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1.2,
                                borderRadius: 1.5,
                                backgroundColor: alpha(theme.palette.info.main, 0.06),
                                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  Gastos Administración
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'info.main', fontSize: '0.9rem' }}>
                                  {(() => {
                                    // ✅ BUSCAR DATOS EN COMMITMENT PRIMERO (que contiene datos del pago)
                                    // Luego en originalCommitment como fallback
                                    const fromCommitment = commitment?.gastosAdministracion;
                                    const fromOriginalCommitment = originalCommitment?.gastosAdministracion;
                                    const finalValue = fromCommitment ?? fromOriginalCommitment ?? 0;
                                    
                                    console.log('📋 Debug Gastos Administración:', {
                                      fromCommitment,
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
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1.2,
                                borderRadius: 1.5,
                                backgroundColor: alpha(theme.palette.warning.main, 0.06),
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  Intereses Derechos
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main', fontSize: '0.9rem' }}>
                                  {(() => {
                                    // ✅ BUSCAR INTERESES EN COMMITMENT - NO EN PAYMENT
                                    const fromCommitment = commitment?.interesesDerechosExplotacion;
                                    const fromOriginalCommitment = originalCommitment?.interesesDerechosExplotacion;
                                    const finalValue = fromCommitment ?? fromOriginalCommitment ?? 0;
                                    
                                    console.log('🎯 Debug Intereses Derechos:', {
                                      fromCommitment,
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

                            {/* Intereses de Gastos de Administración */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1.2,
                                borderRadius: 1.5,
                                backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  Intereses Gastos
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'secondary.main', fontSize: '0.9rem' }}>
                                  {(() => {
                                    // ✅ BUSCAR INTERESES EN COMMITMENT - NO EN PAYMENT
                                    const fromCommitment = commitment?.interesesGastosAdministracion;
                                    const fromOriginalCommitment = originalCommitment?.interesesGastosAdministracion;
                                    const finalValue = fromCommitment ?? fromOriginalCommitment ?? 0;
                                    
                                    console.log('� Debug Intereses Gastos:', {
                                      fromCommitment,
                                      fromOriginalCommitment,
                                      finalValue
                                    });
                                    
                                    return fCurrency(finalValue);
                                  })()}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        );
                      } else {
                        return (
                          <>
                            {/* INFORMACIÓN SIMPLIFICADA - SIEMPRE IGUAL PARA TODOS LOS PAGOS */}
                            
                            {/* Valor Original - VALOR BASE SIN IVA del compromiso original */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  Valor Original
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '0.9rem' }}>
                                  {fCurrency(
                                    originalCommitment?.baseAmount ||      // Valor base original sin IVA
                                    commitment?.originalCommitmentAmount || // Fallback 1
                                    originalCommitment?.amount ||          // Fallback 2
                                    0
                                  )}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Intereses - Del pago específico */}
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 1,
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                  Intereses
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main', fontSize: '0.9rem' }}>
                                  {fCurrency(commitment?.intereses || commitment?.interests || 0)}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* IVA - Del compromiso original */}
                            {originalCommitment?.iva > 0 && (
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  mb: 1,
                                  p: 1.2,
                                  borderRadius: 1.5,
                                  backgroundColor: alpha(theme.palette.warning.main, 0.06),
                                  border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                                }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                    IVA
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main', fontSize: '0.9rem' }}>
                                    {fCurrency(originalCommitment?.iva || 0)}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </>
                        );
                      }
                    })()}
                    
                    {/* Mostrar Total Pagado - SIEMPRE VISIBLE */}
                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 2, 
                        pt: 2, 
                        borderTop: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        borderRadius: 3,
                        px: 2.5,
                        py: 1.8,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                          }}>
                            <AttachMoneyIcon sx={{ 
                              fontSize: 22, 
                              color: theme.palette.success.main 
                            }} />
                          </Avatar>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '1rem'
                          }}>
                            Total Pagado
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          color: 'success.main',
                          fontSize: '1.1rem'
                        }}>
                          {fCurrency(commitment?.amount || 0)}
                        </Typography>
                      </Box>
                    </Grid>
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
                  p: 3, 
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  backdropFilter: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  textAlign: 'center'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2.5 }}>
                    <Avatar sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <ReceiptIcon sx={{ 
                        fontSize: 18, 
                        color: theme.palette.primary.main 
                      }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ 
                      color: 'text.primary', 
                      fontWeight: 600, 
                      fontSize: '1.1rem'
                    }}>
                      Comprobante de Pago
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ 
                    mb: 2.5, 
                    fontWeight: 400,
                    color: 'text.secondary',
                    fontSize: '0.9rem'
                  }}>
                    {receiptMetadata?.name || 'comprobante.pdf'}
                    {receiptMetadata?.size && (
                      <Chip 
                        label={`${Math.round(receiptMetadata.size / 1024)} KB`}
                        size="small"
                        sx={{ 
                          ml: 1,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                          color: 'primary.main'
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
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.2,
                      fontWeight: 500,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      boxShadow: 'none'
                    }}
                  >
                    Ver Comprobante
                  </Button>
                </Paper>
              </motion.div>
            )}

            {/* Botón Cerrar */}
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
                Cerrar
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

