import React, { useState, useEffect } from 'react';
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../../utils/designSystem.js';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  InputAdornment,
  CircularProgress,
  Divider,
  IconButton,
  alpha,
  Card,
  CardMedia,
  Chip,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  AttachFile,
  Close,
  TrendingUp,
  AccountBalance,
  Receipt,
  AttachMoney,
  Visibility,
  FilePresent,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/userPermissions';
import SecurePDFViewer from '../common/SecurePDFViewer';

const PaymentPopupPremium = ({ 
  open, 
  onClose, 
  commitment, 
  onPaymentConfirmed 
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const gradients = useThemeGradients();

  const [saving, setSaving] = useState(false);
  const [hasExistingReceipt, setHasExistingReceipt] = useState(false);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null);
  const [existingReceiptMetadata, setExistingReceiptMetadata] = useState(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [replaceReceipt, setReplaceReceipt] = useState(false);
  
  // Estados para verificación de permisos
  const [canViewReceipts, setCanViewReceipts] = useState(false);
  const [canDownloadReceipts, setCanDownloadReceipts] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  
  const [paymentData, setPaymentData] = useState({
    interests: '',
    receiptFile: null
  });

  // Verificar permisos del usuario actual
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!currentUser?.email) {
        setPermissionsLoading(false);
        return;
      }

      try {
        setPermissionsLoading(true);
        console.log('🔍 Verificando permisos para:', currentUser.email);
        
        const [viewPermission, downloadPermission] = await Promise.all([
          hasPermission(currentUser.email, PERMISSIONS.VIEW_RECEIPTS),
          hasPermission(currentUser.email, PERMISSIONS.DOWNLOAD_RECEIPTS)
        ]);

        setCanViewReceipts(viewPermission);
        setCanDownloadReceipts(downloadPermission);
        
        console.log('✅ Permisos verificados:', {
          email: currentUser.email,
          canView: viewPermission,
          canDownload: downloadPermission
        });
      } catch (error) {
        console.error('❌ Error verificando permisos:', error);
        setCanViewReceipts(false);
        setCanDownloadReceipts(false);
      } finally {
        setPermissionsLoading(false);
      }
    };

    checkUserPermissions();
  }, [currentUser?.email]);

  // Verificar si ya existe un comprobante al abrir el modal
  useEffect(() => {
    if (open && commitment) {
      const hasReceipt = !!(commitment.receiptUrl || commitment.receiptMetadata);
      const receiptUrl = commitment.receiptUrl || null;
      const receiptMetadata = commitment.receiptMetadata || null;
      
      // Solo actualizar si los valores han cambiado realmente
      setHasExistingReceipt(prev => prev !== hasReceipt ? hasReceipt : prev);
      setExistingReceiptUrl(prev => prev !== receiptUrl ? receiptUrl : prev);
      setExistingReceiptMetadata(prev => {
        // Comparación profunda para objetos
        if (JSON.stringify(prev) !== JSON.stringify(receiptMetadata)) {
          return receiptMetadata;
        }
        return prev;
      });
      setReplaceReceipt(false);
    } else if (!open) {
      // Reset cuando se cierra el modal
      setHasExistingReceipt(false);
      setExistingReceiptUrl(null);
      setExistingReceiptMetadata(null);
      setReplaceReceipt(false);
    }
  }, [open, commitment?.id, commitment?.receiptUrl, commitment?.receiptMetadata]);

  // Detectar tipo de archivo para mostrar vista previa apropiada
  const getFileType = (metadata) => {
    if (!metadata) return 'unknown';
    const type = metadata.type || '';
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    return 'document';
  };

  // Obtener icono según tipo de archivo
  const getFileIcon = (metadata) => {
    const type = getFileType(metadata);
    switch (type) {
      case 'image': return <ImageIcon />;
      case 'pdf': return <PictureAsPdfIcon />;
      default: return <FilePresent />;
    }
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Formatear número con puntos de miles (sin símbolo de moneda) - igual que CommitmentEditForm
  const formatNumber = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO').format(value);
  };

  // Limpiar formato para obtener solo números - igual que CommitmentEditForm
  const parseNumber = (formattedValue) => {
    if (!formattedValue) return '';
    return formattedValue.toString().replace(/[^\d]/g, '');
  };

  // Calcular total
  const calculateTotal = () => {
    const baseAmount = parseFloat(commitment?.amount) || 0;
    const interests = parseFloat(paymentData.interests) || 0;
    return baseAmount + interests;
  };

  // Manejar cambio en el campo de intereses - igual que CommitmentEditForm
  const handleInterestsChange = (value) => {
    // Limpiar el valor de cualquier formato
    const cleanValue = parseNumber(value);
    
    // Actualizar el estado con el valor limpio
    handleInputChange('interests', cleanValue);
  };

  // Manejar cambios generales en el formulario
  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cerrar modal
  const handleClose = () => {
    if (!saving) {
      setPaymentData({ interests: '', receiptFile: null });
      setShowReceiptPreview(false);
      setReplaceReceipt(false);
      onClose();
    }
  };

  // Confirmar pago
  const handleConfirmPayment = async () => {
    if (!commitment) return;
    
    try {
      setSaving(true);
      
      let receiptUrl = existingReceiptUrl; // Mantener URL existente por defecto
      let receiptMetadata = existingReceiptMetadata; // Mantener metadata existente
      
      // Subir nuevo archivo solo si se seleccionó uno nuevo o se está reemplazando
      if (paymentData.receiptFile && (!hasExistingReceipt || replaceReceipt)) {
        console.log('📎 Subiendo comprobante:', paymentData.receiptFile.name);
        
        // Crear referencia con ruta que coincida con las reglas de seguridad
        const timestamp = Date.now();
        const fileExtension = paymentData.receiptFile.name.split('.').pop();
        const fileName = `${commitment.id}_${timestamp}.${fileExtension}`;
        const fileRef = ref(storage, `receipts/${currentUser.uid}/${fileName}`);
        
        // Subir archivo con metadata
        const metadata = {
          customMetadata: {
            'commitmentId': commitment.id,
            'uploadedBy': currentUser.uid,
            'originalName': paymentData.receiptFile.name,
            'uploadedAt': new Date().toISOString()
          }
        };
        
        const snapshot = await uploadBytes(fileRef, paymentData.receiptFile, metadata);
        receiptUrl = await getDownloadURL(snapshot.ref);
        
        receiptMetadata = {
          originalName: paymentData.receiptFile.name,
          size: paymentData.receiptFile.size,
          type: paymentData.receiptFile.type,
          storagePath: `receipts/${currentUser.uid}/${fileName}`
        };
        
        console.log('✅ Comprobante subido exitosamente:', receiptUrl);
      }
      
      // Actualizar compromiso en Firestore
      const commitmentRef = doc(db, 'commitments', commitment.id);
      const updateData = {
        status: 'paid',
        paid: true, // Para compatibilidad
        paidAt: serverTimestamp(),
        paidBy: currentUser.uid,
        interests: parseFloat(paymentData.interests) || 0,
        totalPaid: calculateTotal(),
        updatedAt: serverTimestamp()
      };
      
      // Agregar datos del comprobante si existe (nuevo o existente)
      if (receiptUrl) {
        updateData.receiptUrl = receiptUrl;
        updateData.receiptMetadata = receiptMetadata;
      }
      
      await updateDoc(commitmentRef, updateData);
      
      console.log('✅ Pago procesado exitosamente');
      
      // Ejecutar callbacks
      onPaymentConfirmed && onPaymentConfirmed();
      
      // Cerrar modal
      handleClose();
      
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      
      // Mensaje de error más específico
      let errorMessage = '❌ Error al procesar el pago';
      if (error.code === 'storage/unauthorized') {
        errorMessage = '❌ Error: No tienes permisos para subir archivos';
      } else if (error.code === 'storage/canceled') {
        errorMessage = '❌ Error: Subida cancelada';
      } else if (error.code === 'storage/unknown') {
        errorMessage = '❌ Error desconocido al subir el archivo';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!commitment) return null;

  return (
    <>
      <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4, // Más consistente con el sistema
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              background: gradients.paper,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0,0,0,0.3)' 
                : '0 8px 32px rgba(0,0,0,0.1)', // Sombras más sutiles como las tarjetas
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              ...shimmerEffect,
              maxWidth: '450px',
              margin: 'auto'
            }
          }}
        >
          <motion.div
            {...animationVariants.modalAppear}
            style={{ position: 'relative', zIndex: 2 }}
          >
            {/* Header Premium con Gradiente Dinámico */}
            <DialogTitle
              sx={{
                background: gradients.primary,
                color: 'white',
                textAlign: 'center',
                py: 3,
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
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%',
                  zIndex: 1
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
                </motion.div>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                  Marcar como Pagado
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 400, mx: 'auto' }}>
                  {commitment.concept}
                </Typography>
              </Box>

              {/* Botón de Cerrar Premium */}
              <IconButton
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 3,
                  color: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, pt: 3 }}> {/* Más espacioso */}
              {/* Monto del Compromiso - Paper Premium */}
              <motion.div {...animationVariants.slideUp}>
                <Paper
                  elevation={0}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.info.light}10)`,
                    border: `1px solid ${theme.palette.info.main}30`,
                    borderRadius: 4, // Consistente con el sistema
                    p: 3, // Espaciado más generoso
                    mb: 3,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    ...shimmerEffect
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <AccountBalance color="info" />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Monto del Compromiso
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h3" 
                      color="info.main" 
                      fontWeight={800}
                      sx={{ 
                        fontFamily: 'monospace',
                        textShadow: `0 2px 4px ${theme.palette.info.main}20`
                      }}
                    >
                      {formatCurrency(commitment.amount)}
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>

              {/* Campo de Intereses Premium */}
              <motion.div 
                {...animationVariants.slideUp}
                transition={{ delay: 0.1 }}
              >
                <Box mb={2.5}>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    mb={2}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: theme.palette.text.primary
                    }}
                  >
                    <TrendingUp color="warning" />
                    ¿Pagaste intereses adicionales?
                  </Typography>
                  
                  <TextField
                    fullWidth
                    type="text"
                    label="Intereses (opcional)"
                    value={paymentData.interests ? formatNumber(paymentData.interests) : ''}
                    onChange={(e) => handleInterestsChange(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 4, // Consistente con el sistema
                        background: alpha(theme.palette.background.paper, 0.8),
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' // Sombra más sutil
                        },
                        '&.Mui-focused': {
                          boxShadow: `0 0 0 2px ${theme.palette.warning.main}40`
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney color="warning" />
                        </InputAdornment>
                      ),
                      endAdornment: paymentData.interests && (
                        <InputAdornment position="end">
                          <CheckCircle color="success" fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    helperText="Ingresa cualquier interés adicional que hayas pagado"
                  />
                </Box>
              </motion.div>

              {/* Total a Pagar - Paper Premium con Animación */}
              <motion.div 
                {...animationVariants.slideUp}
                transition={{ delay: 0.2 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    background: gradients.success,
                    border: `1px solid ${theme.palette.success.main}40`,
                    borderRadius: 4, // Consistente
                    p: 3, // Espaciado más generoso
                    mb: 3,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    ...shimmerEffect
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                      <TrendingUp color="success" />
                      <Typography variant="body2" color="success.main" fontWeight={700}>
                        Total a Pagar
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h2" 
                      color="success.main" 
                      fontWeight={800}
                      sx={{ 
                        fontFamily: 'monospace',
                        textShadow: `0 2px 4px ${theme.palette.success.main}20`
                      }}
                    >
                      {formatCurrency(calculateTotal())}
                    </Typography>
                    {paymentData.interests > 0 && (
                      <Typography variant="body2" color="success.dark" sx={{ mt: 1, opacity: 0.8 }}>
                        Incluye {formatCurrency(paymentData.interests)} en intereses
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </motion.div>

              {/* Sección de Comprobante Premium - Con detección de comprobante existente */}
              <motion.div 
                {...animationVariants.slideUp}
                transition={{ delay: 0.3 }}
              >
                <Box mb={4}>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    mb={2}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: theme.palette.text.primary
                    }}
                  >
                    <Receipt color="primary" />
                    Comprobante de Pago
                    {hasExistingReceipt && (
                      <Chip 
                        label="Ya adjunto" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                  
                  {/* Si ya existe un comprobante */}
                  {hasExistingReceipt && !replaceReceipt ? (
                    <Card
                      sx={{
                        border: `2px solid ${theme.palette.success.main}40`,
                        borderRadius: 4,
                        background: alpha(theme.palette.success.main, 0.05),
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}
                          >
                            {getFileIcon(existingReceiptMetadata)}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body1" fontWeight={600} color="success.main">
                              Comprobante adjunto
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {existingReceiptMetadata?.originalName || 'Archivo existente'}
                            </Typography>
                            {existingReceiptMetadata?.size && (
                              <Typography variant="caption" color="text.secondary">
                                {(existingReceiptMetadata.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Vista previa para imágenes */}
                        {getFileType(existingReceiptMetadata) === 'image' && existingReceiptUrl && (
                          <Box sx={{ mb: 2 }}>
                            <CardMedia
                              component="img"
                              src={existingReceiptUrl}
                              alt="Vista previa del comprobante"
                              sx={{
                                height: 200,
                                objectFit: 'contain',
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                cursor: 'pointer'
                              }}
                              onClick={() => setShowReceiptPreview(true)}
                            />
                          </Box>
                        )}

                        <Box display="flex" gap={2}>
                          {/* Botón Ver comprobante - Solo si tiene permisos */}
                          {canViewReceipts ? (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => setShowReceiptPreview(true)}
                              sx={{ borderRadius: 2 }}
                            >
                              Ver comprobante
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<SecurityIcon />}
                              disabled
                              sx={{ 
                                borderRadius: 2,
                                color: 'error.main',
                                borderColor: 'error.main'
                              }}
                            >
                              Sin permisos
                            </Button>
                          )}
                          
                          {/* Botón Reemplazar - Solo si tiene permisos de upload */}
                          {canViewReceipts && (
                            <Button
                              variant="text"
                              size="small"
                              startIcon={<AttachFile />}
                              onClick={() => setReplaceReceipt(true)}
                              sx={{ borderRadius: 2 }}
                            >
                              Reemplazar
                            </Button>
                          )}
                        </Box>

                        {/* Mensaje de permisos */}
                        {!canViewReceipts && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              No tienes permisos para ver comprobantes. Contacta al administrador.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Card>
                  ) : (
                    /* Área de carga de archivo (nueva o reemplazo) */
                    <Paper
                      elevation={0}
                      sx={{
                        border: `2px dashed ${theme.palette.primary.main}40`,
                        borderRadius: 4,
                        p: 3,
                        textAlign: 'center',
                        background: alpha(theme.palette.primary.main, 0.02),
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          background: alpha(theme.palette.primary.main, 0.05),
                          transform: 'translateY(-1px)'
                        }
                      }}
                      onClick={() => document.getElementById('receipt-upload').click()}
                    >
                      <AttachFile color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="body1" color="primary" fontWeight={600}>
                        {paymentData.receiptFile 
                          ? paymentData.receiptFile.name 
                          : replaceReceipt 
                            ? 'Seleccionar nuevo archivo'
                            : 'Seleccionar Archivo'
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {replaceReceipt 
                          ? 'Elige un nuevo comprobante para reemplazar el actual'
                          : 'Arrastra aquí tu comprobante o haz clic para seleccionar'
                        }
                      </Typography>
                      {replaceReceipt && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplaceReceipt(false);
                            setPaymentData(prev => ({ ...prev, receiptFile: null }));
                          }}
                          sx={{ mt: 1 }}
                        >
                          Cancelar reemplazo
                        </Button>
                      )}
                      <input
                        id="receipt-upload"
                        type="file"
                        hidden
                        accept="image/*,.pdf"
                        onChange={(e) => handleInputChange('receiptFile', e.target.files[0])}
                      />
                    </Paper>
                  )}
                </Box>
              </motion.div>

              {/* Modal de vista previa para imágenes */}
              <Dialog
                open={showReceiptPreview}
                onClose={() => setShowReceiptPreview(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    background: theme.palette.background.paper
                  }
                }}
              >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Vista previa del comprobante
                  <IconButton onClick={() => setShowReceiptPreview(false)}>
                    <Close />
                  </IconButton>
                </DialogTitle>
                <DialogContent>
                  {existingReceiptUrl && (
                    <CardMedia
                      component="img"
                      src={existingReceiptUrl}
                      alt="Vista previa del comprobante"
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '70vh',
                        objectFit: 'contain',
                        borderRadius: 2
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </DialogContent>

            {/* Footer con Botones Premium */}
            <DialogActions 
              sx={{ 
                p: 4, 
                pt: 2,
                gap: 2,
                background: alpha(theme.palette.background.default, 0.5),
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <motion.div {...animationVariants.slideUp} style={{ flex: 1 }}>
                <Button
                  onClick={handleClose}
                  size="large"
                  sx={{
                    borderRadius: 4, // Consistente
                    px: 4,
                    py: 1.5,
                    color: theme.palette.text.secondary,
                    border: `1px solid ${theme.palette.divider}`, // Borde más sutil
                    background: 'transparent',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.text.primary, 0.04),
                      borderColor: theme.palette.text.secondary,
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Cancelar
                </Button>
              </motion.div>

              <motion.div 
                {...animationVariants.slideUp} 
                transition={{ delay: 0.1 }}
                style={{ flex: 2 }}
              >
                <Button
                  variant="contained"
                  onClick={handleConfirmPayment}
                  disabled={saving}
                  fullWidth
                  size="large"
                  startIcon={saving ? 
                    <CircularProgress size={20} color="inherit" /> : 
                    <CheckCircle />
                  }
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 4, // Consistente
                    background: theme.palette.success.main,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                      : '0 4px 12px rgba(0,0,0,0.1)', // Sombra consistente
                    '&:hover': {
                      background: theme.palette.success.dark,
                      transform: 'translateY(-1px)',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 6px 16px rgba(0,0,0,0.4)' 
                        : '0 6px 16px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {saving ? 'Procesando Pago...' : 'Confirmar Pago'}
                </Button>
              </motion.div>
            </DialogActions>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>

    {/* Modal de Vista Previa de Comprobante */}
    <Dialog
      open={showReceiptPreview}
      onClose={() => setShowReceiptPreview(false)}
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
          Vista Previa del Comprobante
        </Box>
        <IconButton 
          onClick={() => setShowReceiptPreview(false)}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {permissionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Verificando permisos...</Typography>
          </Box>
        ) : !canViewReceipts ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              🔒 Acceso Denegado
            </Typography>
            <Typography variant="body2">
              No tienes permisos para ver comprobantes. Tu usuario actual ({currentUser?.email}) 
              no tiene el permiso <strong>VIEW_RECEIPTS</strong> asignado.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Contacta al administrador para obtener los permisos necesarios.
            </Typography>
          </Alert>
        ) : existingReceiptUrl && (
          <Box sx={{ width: '100%' }}>
            {existingReceiptMetadata?.type?.startsWith('image/') ? (
              // Vista previa de imágenes
              <Card sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                borderRadius: 2
              }}>
                <CardMedia
                  component="img"
                  image={existingReceiptUrl}
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
                        {existingReceiptMetadata?.originalName || 'comprobante.pdf'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Documento PDF • {(existingReceiptMetadata?.size / 1024 / 1024).toFixed(2)} MB
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
                
                {/* Visor PDF seguro */}
                <SecurePDFViewer 
                  url={existingReceiptUrl}
                  height={500}
                  allowControls={true}
                  onError={(error) => {
                    console.error('Error loading PDF:', error);
                  }}
                />
              </Box>
            )}
            
            {existingReceiptMetadata && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <strong>Archivo:</strong> {existingReceiptMetadata.originalName}<br/>
                  <strong>Tamaño:</strong> {(existingReceiptMetadata.size / 1024 / 1024).toFixed(2)} MB<br/>
                  <strong>Tipo:</strong> {existingReceiptMetadata.type}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
        {/* Botón de descarga solo si tiene permisos */}
        {canDownloadReceipts ? (
          <Button 
            variant="outlined"
            onClick={() => window.open(existingReceiptUrl, '_blank')}
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
        ) : (
          <Alert 
            severity="info" 
            variant="outlined"
            sx={{ 
              flex: 1, 
              mr: 2,
              '& .MuiAlert-message': { fontSize: '0.875rem' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 16 }} />
              No tienes permisos para descargar archivos
            </Box>
          </Alert>
        )}
        
        <Button 
          onClick={() => setShowReceiptPreview(false)}
          variant="contained"
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default PaymentPopupPremium;
