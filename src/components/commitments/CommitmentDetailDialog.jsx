import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton, Grid, Box, Typography, Button, Card, Chip, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Close, Assignment as AssignmentIcon, CalendarToday, Info, Person, Payment, Schedule, Business, Notes, AccessTime, Edit, AttachFile, Visibility, GetApp
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Import del componente utilizado dentro del modal
// Ajusta la ruta si TimeProgress está en otra carpeta
// Placeholder de TimeProgress (el original estaba inline en CommitmentsList)
// Si se requiere lógica real (barra / porcentaje), implementarla aquí.
const TimeProgress = ({ dueDate, createdAt, isPaid }) => null;

// Componente extraído del bloque original de CommitmentsList.jsx
// Mantiene el mismo JSX y estilos. Sólo se parametrizan las dependencias externas.
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
  const selectedCommitment = commitment; // Alias para conservar el código original sin cambios significativos

  if (!selectedCommitment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': {
          margin: '24px',
          maxHeight: 'calc(100vh - 48px)',
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          background: theme.palette.background.paper,
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          border: `2px solid ${theme.palette.primary.main}`,
          overflow: 'hidden',
          position: 'relative'
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
          style={{ position: 'relative', zIndex: 2 }}
        >
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
                <AssignmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  color: 'text.primary'
                }}>
                  Detalle del Compromiso
                </Typography>
                <Typography variant="h6" sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }}>
                  ${selectedCommitment?.amount?.toLocaleString() || '0'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
                >
                  <TimeProgress
                    dueDate={selectedCommitment.dueDate}
                    createdAt={selectedCommitment.createdAt || new Date()}
                    isPaid={selectedCommitment.paid || selectedCommitment.isPaid}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
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
                        {format(selectedCommitment.dueDate, 'EEEE', { locale: es })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(selectedCommitment.dueDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>

              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Info sx={{ fontSize: 20 }} />
                      Información Adicional
                    </Typography>

                    <Grid container spacing={1.5}>
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
                          <Payment sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              MÉTODO DE PAGO
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}>
                              {(() => {
                                switch (selectedCommitment.paymentMethod) {
                                  case 'transfer': return '🏦 Transferencia';
                                  case 'cash': return '💵 Efectivo';
                                  case 'pse': return '💳 PSE';
                                  case 'check': return '📝 Cheque';
                                  case 'card': return '💳 Tarjeta';
                                  default: return '🏦 Transferencia';
                                }
                              })()}
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
                          <Schedule sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              PERIODICIDAD
                            </Typography>
                            <Typography variant="body2" sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}>
                              {(() => {
                                switch (selectedCommitment.periodicity) {
                                  case 'unique': return '🔄 Pago único';
                                  case 'monthly': return '📅 Mensual';
                                  case 'bimonthly': return '📅 Bimestral';
                                  case 'quarterly': return '📅 Trimestral';
                                  case 'fourmonthly': return '📅 Cuatrimestral';
                                  case 'biannual': return '📅 Semestral';
                                  case 'annual': return '📅 Anual';
                                  default: return '📅 Mensual';
                                }
                              })()}
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
                            <Box display="flex" alignItems="center" gap={1}>
                              {companyData?.logoURL ? (
                                <Box
                                  component="img"
                                  src={companyData.logoURL}
                                  alt={`Logo de ${companyData.name}`}
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 1,
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
                            <Edit sx={{ color: 'primary.main', fontSize: 18 }} />
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
                  </Box>
                </motion.div>
              </Grid>

              {selectedCommitment.attachments && selectedCommitment.attachments.length > 0 && (
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 700,
                          mb: 3,
                          color: 'info.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <AttachFile sx={{ fontSize: 24 }} />
                          Archivos Adjuntos
                          <Chip
                            label={selectedCommitment.attachments.length}
                            size="small"
                            sx={{
                              ml: 1,
                              background: theme.palette.background.paper,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </Typography>

                        <Grid container spacing={2}>
                          {selectedCommitment.attachments.map((attachment, index) => {
                            const getFileIcon = (fileName) => {
                              const extension = fileName.split('.').pop().toLowerCase();
                              switch (extension) {
                                case 'pdf': return '📄';
                                case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
                                case 'doc': case 'docx': return '📝';
                                case 'xls': case 'xlsx': return '📊';
                                case 'txt': return '📄';
                                default: return '📎';
                              }
                            };

                            const getFileSize = (bytes) => {
                              if (!bytes) return 'Tamaño desconocido';
                              if (bytes < 1024) return bytes + ' B';
                              if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                              return (bytes / 1048576).toFixed(1) + ' MB';
                            };

                            return (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <motion.div
                                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                >
                                  <Box sx={{
                                    p: 2.5,
                                    background: theme.palette.background.paper,
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      borderColor: theme.palette.info.main,
                                      background: theme.palette.background.paper,
                                      boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.2)}`
                                    }
                                  }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                                      <Typography sx={{ fontSize: '1.5rem' }}>
                                        {getFileIcon(attachment.name || 'archivo')}
                                      </Typography>
                                      <Box flex={1} minWidth={0}>
                                        <Typography variant="subtitle2" sx={{
                                          fontWeight: 600,
                                          color: 'text.primary',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}>
                                          {attachment.name || 'Archivo sin nombre'}
                                        </Typography>
                                        <Typography variant="caption" sx={{
                                          color: 'text.secondary',
                                          fontSize: '0.75rem'
                                        }}>
                                          {getFileSize(attachment.size)}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Typography variant="caption" sx={{
                                        color: 'info.main',
                                        fontWeight: 500,
                                        fontSize: '0.7rem'
                                      }}>
                                        {attachment.uploadedAt && safeToDate(attachment.uploadedAt)
                                          ? format(safeToDate(attachment.uploadedAt), 'dd/MM/yyyy', { locale: es })
                                          : 'Fecha desconocida'}
                                      </Typography>
                                      <Box display="flex" gap={0.5}>
                                        <Tooltip title="Ver archivo">
                                          <IconButton
                                            size="small"
                                            sx={{
                                              color: 'info.main',
                                              '&:hover': {
                                                background: alpha(theme.palette.info.main, 0.1)
                                              }
                                            }}
                                          >
                                            <Visibility sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Descargar">
                                          <IconButton
                                            size="small"
                                            sx={{
                                              color: 'success.main',
                                              '&:hover': {
                                                background: alpha(theme.palette.success.main, 0.1)
                                              }
                                            }}
                                          >
                                            <GetApp sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    </Box>
                                  </Box>
                                </motion.div>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              p: 4,
              pb: 6,
              backgroundColor: 'background.paper',
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              position: 'relative'
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onClose}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.25,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  color: 'text.secondary',
                  backgroundColor: 'background.paper',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: (theme) => alpha(theme.palette.text.primary, 0.4),
                    backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.04),
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Cerrar
              </Button>
            </motion.div>

            <Box display="flex" gap={2.5}>
              {extractInvoiceUrl && extractInvoiceUrl(selectedCommitment) && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.4, type: 'spring', stiffness: 100 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => onOpenPdf && onOpenPdf(selectedCommitment)}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.25,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      backgroundColor: 'background.paper',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Ver Factura
                  </Button>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={onEdit}
                  disabled={false}
                  sx={{
                    borderRadius: 999,
                    px: 4,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: '#fff',
                    background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.98)}, ${alpha(theme.palette.primary.main, 0.98)})`,
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 10px 26px rgba(102,126,234,0.42), 0 2px 10px rgba(0,0,0,0.25)'
                      : '0 14px 34px rgba(102,126,234,0.50), 0 3px 12px rgba(0,0,0,0.10)',
                    transition: 'all 0.22s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 14px 36px rgba(102,126,234,0.48)'
                        : '0 18px 40px rgba(102,126,234,0.58)'
                    },
                    '&.Mui-disabled': {
                      color: (theme) => alpha(theme.palette.common.white, 0.7),
                      background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.grey[300], 0.55)}, ${alpha(theme.palette.grey[400], 0.45)})`,
                      boxShadow: (theme) => `0 10px 28px ${alpha(theme.palette.primary.main, 0.25)}`,
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  Editar
                </Button>
              </motion.div>
            </Box>
          </DialogActions>
        </motion.div>
      )}
    </Dialog>
  );
};

export default CommitmentDetailDialog;
