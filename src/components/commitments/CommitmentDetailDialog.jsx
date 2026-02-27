import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Paper,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Assignment as AssignmentIcon,
  CalendarToday,
  Info,
  Person,
  Payment,
  Schedule,
  Business,
  Notes,
  AccessTime,
  GetApp,
  Repeat as RepeatIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Componente extraído del bloque original de CommitmentsList.jsx
// Refactorizado para cumplir completamente con MODAL_DESIGN_SYSTEM.md
const CommitmentDetailDialog = ({
  open,
  commitment,
  companyData,
  onClose,
  onEdit,
  onOpenPdf,
  extractInvoiceUrl,
  safeToDate
}) => {
  const theme = useTheme();
  const selectedCommitment = commitment;

  // 🎮 Detectar si es compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    return commitment?.beneficiary && 
           commitment.beneficiary.toLowerCase().includes('coljuegos');
  };

  // 💰 Formatear moneda colombiana
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'No especificado';
    const num = parseFloat(amount);
    if (isNaN(num)) return 'No especificado';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // 🧮 Renderizar información de pagos según el tipo de compromiso
  const renderPaymentInfo = () => {
    if (!selectedCommitment) return null;

    const isColjuegos = isColjuegosCommitment(selectedCommitment);

    if (isColjuegos) {
      // 🎮 Para Coljuegos: Mostrar Derechos de Explotación y Gastos de Administración
      const derechosExplotacion = selectedCommitment.derechosExplotacion || 0;
      const gastosAdministracion = selectedCommitment.gastosAdministracion || 0;
      
      return (
        <>
          <Grid item xs={12} sm={6}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 1,
              background: alpha(theme.palette.secondary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
            }}>
              <TrendingUpIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  DERECHOS DE EXPLOTACIÓN
                </Typography>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  {formatCurrency(derechosExplotacion)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 1,
              background: alpha(theme.palette.secondary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
            }}>
              <WalletIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  GASTOS DE ADMINISTRACIÓN
                </Typography>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  {formatCurrency(gastosAdministracion)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </>
      );
    } else {
      // 📊 Para otros compromisos: Mostrar valor base e impuestos
      const baseAmount = selectedCommitment.baseAmount || selectedCommitment.amount || 0;
      const iva = selectedCommitment.iva || 0;
      const retefuente = selectedCommitment.retefuente || 0;
      const ica = selectedCommitment.ica || 0;
      const discount = selectedCommitment.discount || 0;
      const hasTaxes = selectedCommitment.hasTaxes || (iva > 0 || retefuente > 0 || ica > 0 || discount > 0);

      return (
        <>
          <Grid item xs={12}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 1,
              background: alpha(theme.palette.secondary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
            }}>
              <MoneyIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  VALOR BASE
                </Typography>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  {formatCurrency(baseAmount)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {hasTaxes && (
            <>
              {iva > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    background: alpha(theme.palette.info.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}>
                    <ReceiptIcon sx={{ color: 'info.main', fontSize: 18 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        IVA
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}>
                        +{formatCurrency(iva)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {retefuente > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    background: alpha(theme.palette.warning.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  }}>
                    <TrendingUpIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        RETENCIÓN EN LA FUENTE
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}>
                        -{formatCurrency(retefuente)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {ica > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    background: alpha(theme.palette.warning.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  }}>
                    <AccountBalanceIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        ICA
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}>
                        -{formatCurrency(ica)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {discount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    background: alpha(theme.palette.error.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                  }}>
                    <WalletIcon sx={{ color: 'error.main', fontSize: 18 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        DESCUENTO
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}>
                        -{formatCurrency(discount)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </>
          )}
        </>
      );
    }
  };

  if (!selectedCommitment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"  // OBLIGATORIO - NO cambiar a 'lg' o 'sm'
      PaperProps={{
        sx: {
          borderRadius: 2,  // EXACTO - No usar 1 o 3
          background: theme.palette.background.paper,  // NUNCA hardcodear colores
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'    // EXACTO
            : '0 4px 20px rgba(0, 0, 0, 0.08)',  // EXACTO
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`  // EXACTO - 0.6 no 0.5 o 0.7
        }
      }}
    >
      {selectedCommitment && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 120,
            duration: 0.6
          }}
        >
          <DialogTitle sx={{ 
            pb: 2,  // EXACTO - No usar 1.5 o 2.5
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' 
              ? theme.palette.grey[900]      // EXACTO - 900 no 800 o A700
              : theme.palette.grey[50],      // EXACTO - 50 no 100 o A100
            borderBottom: `1px solid ${theme.palette.divider}`,  // SIEMPRE divider
            color: 'text.primary'  // NUNCA hardcodear color
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>  {/* EXACTO gap: 1.5 */}
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  mb: 0,
                  color: 'text.primary'
                }}>
                  Detalle del Compromiso
                </Typography>
              </Box>
            </Box>
            {/* BOTÓN DE CIERRE - Solo en modales de vista */}
            <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ 
            p: 3,     // EXACTO - No usar 2.5 o 3.5
            pt: 5     // EXACTO - Top padding mayor para separación del header
          }}>
            <Box sx={{ mt: 3 }}>  {/* EXACTO - mt: 3 para espacio adicional */}
              <Grid container spacing={3}>  {/* SIEMPRE spacing={3} */}
                
                {/* INFORMACIÓN PRINCIPAL - Grid responsivo */}
                <Grid item xs={12} md={12}>
                  <Paper sx={{
                    p: 3,  // EXACTO
                    borderRadius: 2,  // EXACTO
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,  // EXACTO - primary, 0.2
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'  // EXACTO - Nivel 1
                  }}>
                    <Typography variant="overline" sx={{
                      fontWeight: 600,  // EXACTO
                      color: 'primary.main',
                      letterSpacing: 0.8,  // EXACTO
                      fontSize: '0.75rem'  // EXACTO
                    }}>
                      Información General
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mt: 1 }}>  {/* EXACTO mt: 1 */}
                      {/* Fecha de Vencimiento */}
                      <Grid item xs={12}>
                        <Box sx={{
                          p: 1.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}>
                          <CalendarToday sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              Fecha de Vencimiento
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              textTransform: 'capitalize'
                            }}>
                              {(() => {
                                const safeDate = safeToDate(selectedCommitment.dueDate);
                                return safeDate ? format(safeDate, 'EEEE', { locale: es }) : 'Fecha no válida';
                              })()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {(() => {
                                const safeDate = safeToDate(selectedCommitment.dueDate);
                                return safeDate ? format(safeDate, "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'Fecha no válida';
                              })()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Información del Compromiso */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <Person sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              BENEFICIARIO
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}>
                              {selectedCommitment.beneficiary || 'No especificado'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <Business sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              EMPRESA
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {companyData?.logoUrl ? (
                                <img
                                  src={companyData.logoUrl}
                                  alt={companyData.name}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    objectFit: 'contain'
                                  }}
                                />
                              ) : (
                                <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                              )}
                              <Typography variant="body2" sx={{
                                fontWeight: 600,
                                color: 'text.primary'
                              }}>
                                {companyData?.name || 'Empresa no especificada'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Periodicidad */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <RepeatIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              PERIODICIDAD
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}>
                              {selectedCommitment.frequency || selectedCommitment.periodicidad || 'Única vez'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Método de Pago */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <AccountBalanceIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              MÉTODO DE PAGO
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}>
                              {selectedCommitment.paymentMethod || selectedCommitment.metodoPago || 'Transferencia bancaria'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Número de Factura */}
                      {selectedCommitment.invoiceNumber && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            background: alpha(theme.palette.info.main, 0.04),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                          }}>
                            <ReceiptIcon sx={{ color: 'info.main', fontSize: 18 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                NÚMERO DE FACTURA
                              </Typography>
                              <Typography variant="body2" sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                fontFamily: 'monospace'
                              }}>
                                {selectedCommitment.invoiceNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}

                      {/* Observaciones */}
                      <Grid item xs={12}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <Notes sx={{ color: 'primary.main', fontSize: 18, mt: 0.2 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              OBSERVACIONES
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 400,
                              lineHeight: 1.5,
                              color: 'text.primary',
                              fontStyle: selectedCommitment.observations ? 'normal' : 'italic'
                            }}>
                              {selectedCommitment.observations || 'Sin observaciones adicionales'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Información de Pagos */}
                      {renderPaymentInfo()}

                      {/* Total del Compromiso */}
                      <Grid item xs={12}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.success.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}>
                          <MonetizationOnIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              TOTAL DEL COMPROMISO
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'success.main',
                              fontSize: '0.95rem'
                            }}>
                              {formatCurrency(selectedCommitment?.amount || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Fechas de seguimiento */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          background: alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                          <AccessTime sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              FECHA DE CREACIÓN
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}>
                              {selectedCommitment.createdAt && safeToDate(selectedCommitment.createdAt)
                                ? format(safeToDate(selectedCommitment.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                : 'No disponible'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {selectedCommitment.updatedAt && (
                        <Grid item xs={12} md={6}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            background: alpha(theme.palette.primary.main, 0.04),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                          }}>
                            <EditIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                ÚLTIMA MODIFICACIÓN
                              </Typography>
                              <Typography variant="body2" sx={{
                                fontWeight: 600,
                                color: 'text.primary'
                              }}>
                                {selectedCommitment.updatedAt && safeToDate(selectedCommitment.updatedAt)
                                  ? format(safeToDate(selectedCommitment.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                  : 'No disponible'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
                
              </Grid>
            </Box>
          </DialogContent>

          {/* DIALOG ACTIONS - Modal de Solo Vista */}
          <DialogActions sx={{ p: 3, gap: 1, justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              ID: {selectedCommitment.id}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {extractInvoiceUrl && extractInvoiceUrl(selectedCommitment) && (
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => onOpenPdf && onOpenPdf(selectedCommitment)}
                  sx={{
                    borderRadius: 1,
                    fontWeight: 500,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  Ver Factura
                </Button>
              )}
              <Button 
                onClick={onClose} 
                variant="outlined" 
                sx={{ 
                  borderRadius: 1, 
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={onEdit}
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  px: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                Editar
              </Button>
            </Box>
          </DialogActions>
        </motion.div>
      )}
    </Dialog>
  );
};

export default CommitmentDetailDialog;
