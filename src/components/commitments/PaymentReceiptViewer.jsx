import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardMedia,
  Chip,
  Alert,
  IconButton,
  Divider,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  CheckCircle,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AccountBalance,
  AttachMoney,
  Visibility
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/userPermissions';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import SecurePDFViewer from '../common/SecurePDFViewer';
import FallbackPDFViewer from '../common/FallbackPDFViewer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PaymentReceiptViewer = ({ 
  open, 
  onClose, 
  commitment,
  paymentData = null
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [canViewReceipts, setCanViewReceipts] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deletingReceipt, setDeletingReceipt] = useState(false);

  // Verificar permisos del usuario
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!currentUser) {
        setPermissionsLoading(false);
        return;
      }

      try {
        const viewPermission = await hasPermission(currentUser.email, PERMISSIONS.VIEW_RECEIPTS);
        setCanViewReceipts(viewPermission);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanViewReceipts(false);
      } finally {
        setPermissionsLoading(false);
      }
    };

    checkUserPermissions();
  }, [currentUser]);

  // Verificar si hay comprobante
  const hasReceipt = !!(commitment?.receiptUrl || commitment?.receiptMetadata);
  const receiptUrl = commitment?.receiptUrl || null;
  const receiptMetadata = commitment?.receiptMetadata || null;

  // Datos del pago (pueden venir del commitment o del paymentData separado)
  const payment = paymentData || {
    amount: commitment?.amount || 0,
    paymentDate: commitment?.paymentDate || commitment?.paidAt || commitment?.updatedAt || new Date(),
    reference: commitment?.paymentReference || 'N/A',
    method: commitment?.paymentMethod || 'Transferencia',
    notes: commitment?.paymentNotes || ''
  };

  // Validar y convertir fecha de pago
  const getValidPaymentDate = (dateValue) => {
    if (!dateValue) return new Date();
    
    // Si es un timestamp de Firebase
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    
    // Si es una cadena o número, intentar convertir
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const validPaymentDate = getValidPaymentDate(payment.paymentDate);

  const getFileType = (metadata) => {
    if (!metadata) return 'unknown';
    const type = metadata.type || '';
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('image')) return 'image';
    return 'unknown';
  };

  const getFileIcon = (metadata) => {
    const type = getFileType(metadata);
    switch (type) {
      case 'pdf':
        return <PictureAsPdfIcon sx={{ color: '#d32f2f', fontSize: 20 }} />;
      case 'image':
        return <ImageIcon sx={{ color: '#1976d2', fontSize: 20 }} />;
      default:
        return <ReceiptIcon sx={{ color: '#757575', fontSize: 20 }} />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear método de pago para que coincida con el formulario
  const getFormattedPaymentMethod = (method) => {
    const paymentMethods = {
      'transfer': 'Transferencia',
      'cash': 'Efectivo',
      'pse': 'PSE',
      // Retrocompatibilidad con posibles valores antiguos
      'transferencia': 'Transferencia',
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'cheque': 'Cheque'
    };
    
    return paymentMethods[method?.toLowerCase()] || method || 'Transferencia';
  };

  // Función para eliminar comprobante de Firebase Storage y Firestore
  const handleDeleteReceipt = async () => {
    if (!receiptUrl || !commitment?.id) return;

    // Confirmar eliminación
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer.'
    );
    
    if (!confirmDelete) return;

    setDeletingReceipt(true);
    
    try {
      console.log('🗑️ Iniciando eliminación de comprobante...');
      console.log('📎 URL del comprobante:', receiptUrl);
      
      // 1. Eliminar archivo de Firebase Storage
      if (receiptUrl.includes('firebase') || receiptUrl.includes('googleapis')) {
        try {
          // Método 1: Extraer path desde URL con parámetros
          let filePath = null;
          
          if (receiptUrl.includes('/o/') && receiptUrl.includes('?')) {
            // URL típica: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.pdf?token=...
            const pathMatch = receiptUrl.match(/\/o\/([^?]+)/);
            if (pathMatch) {
              filePath = decodeURIComponent(pathMatch[1]);
            }
          } else if (receiptUrl.includes('appspot.com')) {
            // URL alternativa: https://bucket.appspot.com/path/to/file.pdf
            const urlObj = new URL(receiptUrl);
            filePath = urlObj.pathname.substring(1); // Remover el "/" inicial
          }
          
          if (filePath) {
            console.log('📂 Path del archivo a eliminar:', filePath);
            
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
            console.log('✅ Archivo eliminado de Firebase Storage');
          } else {
            console.warn('⚠️ No se pudo extraer el path del archivo desde la URL');
          }
          
        } catch (storageError) {
          console.warn('⚠️ Error al eliminar de Storage:', storageError.message);
          // Continuar con la eliminación de Firestore aunque falle Storage
        }
      }

      // 2. Actualizar documento en Firestore para remover referencias al comprobante
      const commitmentRef = doc(db, 'commitments', commitment.id);
      const updateData = {
        receiptUrl: null,
        receiptMetadata: null,
        // Mantener el estado de pagado pero sin comprobante
        updatedAt: new Date()
      };

      await updateDoc(commitmentRef, updateData);
      console.log('✅ Referencias del comprobante eliminadas de Firestore');

      // 3. Cerrar el popup y notificar
      setPreviewDialogOpen(false);
      
      // Notificar al componente padre que se actualizó el compromiso
      if (onClose) {
        onClose();
      }

      alert('✅ Comprobante eliminado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al eliminar comprobante:', error);
      alert(`❌ Error al eliminar el comprobante: ${error.message}`);
    } finally {
      setDeletingReceipt(false);
    }
  };

  if (!commitment || !commitment.paid) {
    return null;
  }

  // Verificar que realmente tenga datos de pago válidos
  const hasValidPayment = commitment.paid && (
    commitment.paymentDate || 
    commitment.paidAt || 
    commitment.updatedAt ||
    commitment.receiptUrl ||
    commitment.receiptMetadata
  );

  if (!hasValidPayment) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9, y: 50 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 50 },
            transition: { 
              duration: 0.6, 
              type: "spring", 
              damping: 25, 
              stiffness: 120 
            },
            sx: {
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 3s infinite',
                zIndex: 1
              },
              '& @keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' }
              }
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 100,
              delay: 0.1 
            }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <DialogTitle sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              color: 'white',
              p: 3,
              borderRadius: '16px 16px 0 0',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                zIndex: 1
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                animation: 'float 6s ease-in-out infinite',
                zIndex: 1
              },
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                '50%': { transform: 'translateY(-20px) rotate(180deg)' }
              }
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 2 }}>
                <Box display="flex" alignItems="center" gap={2.5}>
                  <motion.div
                    initial={{ scale: 0.8, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2.5,
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 2s infinite'
                        }
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 32, color: 'white', zIndex: 1 }} />
                    </Box>
                  </motion.div>
                  <Box>
                    <motion.div
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.3, textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontSize: '1.25rem' }}>
                        💳 Comprobante de Pago
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {commitment.concept || commitment.description || 'Pago registrado'}
                      </Typography>
                    </motion.div>
                  </Box>
                </Box>
                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <IconButton 
                    onClick={onClose}
                    sx={{ 
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </motion.div>
              </Box>
            </DialogTitle>
          </motion.div>

          <DialogContent sx={{ p: 4 }}>
            {permissionsLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box display="flex" justifyContent="center" py={6}>
                  <Box textAlign="center">
                    <CircularProgress sx={{ mb: 2, color: 'primary.main' }} />
                    <Typography variant="body1" color="text.secondary" fontWeight="500">
                      Verificando permisos...
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ) : !canViewReceipts ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
                    border: '1px solid rgba(255, 152, 0, 0.2)',
                    boxShadow: '0 4px 20px rgba(255, 152, 0, 0.1)'
                  }}
                >
                  <Typography variant="body1" fontWeight="500">
                    ⚠️ No tienes permisos para ver comprobantes de pago.
                  </Typography>
                </Alert>
              </motion.div>
            ) : (
              <Box>
                {/* Información del pago */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 120 }}
                >
                  <Card 
                    sx={{ 
                      mb: 4, 
                      p: 4, 
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.08) 0%, transparent 70%)',
                        zIndex: 0
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={3} mb={3} sx={{ position: 'relative', zIndex: 1 }}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)'
                          }}
                        >
                          <ReceiptIcon sx={{ color: 'white', fontSize: 32 }} />
                        </Box>
                      </motion.div>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                          📊 Información del Pago
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Detalles completos de la transacción
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4} mt={3} sx={{ position: 'relative', zIndex: 1 }}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <Box 
                          sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)',
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                            💰 MONTO PAGADO
                          </Typography>
                          <Typography variant="h3" sx={{ 
                            fontWeight: 800, 
                            color: 'success.main',
                            textShadow: '0 2px 4px rgba(76, 175, 80, 0.2)',
                            mb: 1
                          }}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600 }}>
                            Confirmado ✅
                          </Typography>
                        </Box>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                      >
                        <Box 
                          sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(30, 136, 229, 0.05) 100%)',
                            border: '1px solid rgba(33, 150, 243, 0.2)'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                            📅 FECHA DE PAGO
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                            {format(validPaymentDate, 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                          <Typography variant="body2" color="info.dark" sx={{ fontWeight: 600 }}>
                            {format(validPaymentDate, 'HH:mm', { locale: es })} hrs
                          </Typography>
                        </Box>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      >
                        <Box 
                          sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(142, 36, 170, 0.05) 100%)',
                            border: '1px solid rgba(156, 39, 176, 0.2)'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                            💳 MÉTODO DE PAGO
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1 }}>
                            {getFormattedPaymentMethod(payment.method)}
                          </Typography>
                          <Typography variant="body2" color="secondary.dark" sx={{ fontWeight: 600 }}>
                            Procesado
                          </Typography>
                        </Box>
                      </motion.div>
                    </Box>

                    {payment.notes && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                      >
                        <Box mt={4} sx={{ position: 'relative', zIndex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 2, display: 'block' }}>
                            📝 NOTAS ADICIONALES
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              mt: 1, 
                              p: 3, 
                              backgroundColor: alpha(theme.palette.info.main, 0.08), 
                              borderRadius: 3,
                              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                              fontWeight: 500,
                              lineHeight: 1.6,
                              fontStyle: 'italic'
                            }}
                          >
                            {payment.notes}
                          </Typography>
                        </Box>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>

                {/* Comprobante adjunto */}
                {hasReceipt ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                  >
                    <Card 
                      sx={{ 
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(theme.palette.info.light, 0.04)})`,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                        boxShadow: '0 8px 32px rgba(33, 150, 243, 0.15)',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.1), transparent)',
                          animation: 'shimmer 4s infinite',
                          zIndex: 1
                        }
                      }}
                    >
                      <Box sx={{ 
                        p: 4, 
                        position: 'relative',
                        zIndex: 2
                      }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={3}>
                            <motion.div
                              initial={{ scale: 0.8, rotate: -10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                              whileHover={{ scale: 1.05, rotate: 5 }}
                            >
                              <Box
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 3,
                                  background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'shimmer 2s infinite'
                                  }
                                }}
                              >
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                  {getFileIcon(receiptMetadata)}
                                </Box>
                              </Box>
                            </motion.div>
                            <Box>
                              <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                              >
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main', mb: 0.5 }}>
                                  📎 Comprobante Disponible
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {receiptMetadata?.name || 'comprobante.pdf'} 
                                  {receiptMetadata?.size && (
                                    <Chip 
                                      label={formatFileSize(receiptMetadata.size)}
                                      size="small"
                                      sx={{ 
                                        ml: 1,
                                        bgcolor: alpha(theme.palette.info.main, 0.1),
                                        color: 'info.dark',
                                        fontWeight: 600
                                      }}
                                    />
                                  )}
                                </Typography>
                              </motion.div>
                            </Box>
                          </Box>
                          
                          <Box display="flex" alignItems="center" gap={2}>
                            <motion.div
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.5, duration: 0.5 }}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Button
                                variant="contained"
                                startIcon={<Visibility />}
                                onClick={() => setPreviewDialogOpen(true)}
                                sx={{
                                  borderRadius: 3,
                                  px: 3,
                                  py: 1.25,
                                  fontWeight: 600,
                                  textTransform: 'none',
                                  background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                                  boxShadow: '0 6px 20px rgba(244, 67, 54, 0.3)',
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
                                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                Ver Comprobante
                              </Button>
                            </motion.div>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Alert 
                      severity="info"
                      sx={{
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(30, 136, 229, 0.04) 100%)',
                        border: '1px solid rgba(33, 150, 243, 0.15)',
                        boxShadow: '0 4px 20px rgba(33, 150, 243, 0.1)'
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        📄 Este pago no tiene un comprobante adjunto.
                      </Typography>
                    </Alert>
                  </motion.div>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: 4, 
              background: `
                linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%),
                linear-gradient(225deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)
              `,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backdropFilter: 'blur(20px) saturate(180%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)'
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                onClick={onClose}
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 3.5,
                  px: 5,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: `
                    linear-gradient(135deg, #667eea 0%, #764ba2 100%),
                    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)
                  `,
                  boxShadow: `
                    0 8px 25px rgba(102, 126, 234, 0.35),
                    0 3px 12px rgba(102, 126, 234, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    background: `
                      linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%),
                      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)
                    `,
                    boxShadow: `
                      0 12px 35px rgba(102, 126, 234, 0.45),
                      0 5px 20px rgba(102, 126, 234, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3)
                    `,
                    transform: 'translateY(-2px)',
                    '&::before': {
                      opacity: 1
                    }
                  }
                }}
              >
                ✅ Cerrar
              </Button>
            </motion.div>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Vista Previa del Comprobante - Popup como en imagen 1 */}
      {previewDialogOpen && receiptUrl && (
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9, y: 30 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 30 },
            transition: { 
              duration: 0.4, 
              type: "spring", 
              damping: 25, 
              stiffness: 120 
            },
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              background: '#fff'
            }
          }}
        >
          {/* Header con título y botón cerrar */}
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <ReceiptIcon sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Vista Previa del Comprobante
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setPreviewDialogOpen(false)}
              sx={{ 
                color: 'white',
                p: 0.5,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>

          {/* Información del archivo */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1.5}>
                <PictureAsPdfIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {receiptMetadata?.name || 'comprobante.pdf'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Documento PDF • {receiptMetadata?.size ? (receiptMetadata.size / 1024 / 1024).toFixed(2) : '0.07'} MB
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <SecurityIcon sx={{ fontSize: 16, color: '#28a745' }} />
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                  Vista Segura
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Información del pago (como en imagen 1) */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Box display="flex" gap={4}>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  Número de autorización
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {commitment.paymentReference || commitment.id?.slice(-8) || '16768169'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  Detalles del pago
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {commitment.concept || 'PAGO AGOSTO 2025'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Visor PDF */}
          <DialogContent sx={{ p: 0, height: 400 }}>
            <FallbackPDFViewer
              url={receiptUrl}
              height={400}
              filename={receiptMetadata?.name || 'comprobante.pdf'}
              onError={(error) => {
                console.error('Error en FallbackPDFViewer:', error);
              }}
            />
          </DialogContent>

          {/* Footer con información del archivo */}
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="textSecondary">
              <strong>Archivo:</strong> {receiptMetadata?.name || 'comprobante.pdf'}<br/>
              <strong>Tamaño:</strong> {receiptMetadata?.size ? (receiptMetadata.size / 1024 / 1024).toFixed(2) : '0.07'} MB<br/>
              <strong>Tipo:</strong> {receiptMetadata?.type || 'application/pdf'}
            </Typography>
          </Box>

          {/* Botones de acción */}
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Box display="flex" gap={1}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = receiptUrl;
                  link.download = receiptMetadata?.name || 'comprobante.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                sx={{
                  color: '#28a745',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(40, 167, 69, 0.08)'
                  }
                }}
              >
                Descargar
              </Button>
              
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDeleteReceipt}
                disabled={deletingReceipt}
                sx={{
                  color: '#dc3545',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(220, 53, 69, 0.08)'
                  },
                  '&:disabled': {
                    color: 'rgba(220, 53, 69, 0.5)'
                  }
                }}
              >
                {deletingReceipt ? 'Eliminando...' : 'Eliminar Comprobante'}
              </Button>
            </Box>
            
            <Button 
              onClick={() => setPreviewDialogOpen(false)}
              variant="contained"
              sx={{
                bgcolor: '#007bff',
                '&:hover': {
                  bgcolor: '#0056b3'
                }
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default PaymentReceiptViewer;
