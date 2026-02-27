import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Avatar,
  Divider,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as BankIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const IncomeDetailModal = ({ 
  open, 
  onClose, 
  income,
  formatCurrency,
  getPaymentMethodColor,
  companies = []
}) => {
  const theme = useTheme();
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);

  if (!income) return null;

  // Función para encontrar la empresa basada en la cuenta bancaria
  const findCompanyByAccount = (accountNumber, bankName) => {
    if (!accountNumber || !companies.length) return null;
    
    return companies.find(company => 
      company.bankAccount === accountNumber && 
      (!bankName || company.bankName === bankName)
    );
  };

  const associatedCompany = findCompanyByAccount(income.account, income.bank);

  const receiptUrl = getReceiptUrl(income);
  const isPdf = receiptUrl && /\.pdf($|\?)/i.test(receiptUrl.split('?')[0]);
  const isImage = receiptUrl && /\.(png|jpg|jpeg|gif|webp)($|\?)/i.test(receiptUrl.split('?')[0]);

  const handleOpenPdfViewer = () => {
    setPdfViewerOpen(true);
  };

  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
  };

  return (
    <>
      {/* Modal Principal */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0, color: 'text.primary' }}>
                Detalle del Ingreso
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {income.client}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

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
                  <DetailRow 
                    icon={<PersonIcon />} 
                    label="Cliente" 
                    value={income.client} 
                  />
                  <DetailRow 
                    icon={<AttachMoneyIcon />} 
                    label="Monto" 
                    value={formatCurrency(income.amount)} 
                    highlight 
                  />
                  <DetailRow 
                    icon={<CalendarIcon />} 
                    label="Fecha" 
                    value={format(income.date, 'dd MMM yyyy HH:mm', { locale: es })} 
                  />
                  {income.createdAt && (
                    <DetailRow 
                      icon={<CalendarIcon />} 
                      label="Creado" 
                      value={format(income.createdAt, 'dd MMM yyyy HH:mm', { locale: es })} 
                    />
                  )}
                  <DetailRow 
                    icon={<BankIcon />} 
                    label="Método" 
                    value={
                      <Chip 
                        label={income.paymentMethod} 
                        size="small" 
                        color={getPaymentMethodColor(income.paymentMethod)} 
                        variant="outlined" 
                      />
                    } 
                  />
                  {income.bank && (
                    <DetailRow 
                      icon={<BankIcon />} 
                      label="Banco" 
                      value={income.bank} 
                    />
                  )}
                  {income.account && (
                    <DetailRow 
                      icon={<BankIcon />} 
                      label="Cuenta" 
                      value={associatedCompany 
                        ? `${income.account} - ${associatedCompany.name}`
                        : income.account
                      } 
                    />
                  )}
                  {income.reference && (
                    <DetailRow 
                      icon={<DescriptionIcon />} 
                      label="Referencia" 
                      value={income.reference} 
                    />
                  )}
                  {income.transactionId && (
                    <DetailRow 
                      icon={<DescriptionIcon />} 
                      label="Transacción" 
                      value={income.transactionId} 
                    />
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Descripción y Comprobante */}
            <Grid item xs={12} md={4}>
              {/* Descripción */}
              <Paper sx={{ 
                p: 2, 
                mb: 3, 
                borderRadius: 2, 
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                background: theme.palette.background.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Typography variant="overline" sx={{ 
                  fontWeight: 600, 
                  color: 'secondary.main',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem'
                }}>
                  Descripción / Notas
                </Typography>
                <Typography variant="body2" sx={{ 
                  mt: 1, 
                  whiteSpace: 'pre-wrap', 
                  minHeight: 60,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  {income.description || income.notes || 'Sin descripción adicional'}
                </Typography>
              </Paper>

              {/* Comprobante */}
              <Paper sx={{ 
                p: 2, 
                borderRadius: 2, 
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                background: theme.palette.background.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Typography variant="overline" sx={{ 
                  fontWeight: 600, 
                  color: 'success.main',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem',
                  mb: 2,
                  display: 'block'
                }}>
                  Comprobante Adjunto
                </Typography>
                
                {receiptUrl ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ 
                      width: 64, 
                      height: 64, 
                      mx: 'auto', 
                      mb: 2,
                      bgcolor: isPdf ? 'error.main' : 'info.main',
                      fontSize: 32,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                    }}>
                      {isPdf ? <PdfIcon /> : <VisibilityIcon />}
                    </Avatar>
                    <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, fontSize: '0.875rem' }}>
                      {isPdf ? 'Documento PDF' : isImage ? 'Imagen' : 'Archivo'} disponible
                    </Typography>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={handleOpenPdfViewer}
                      sx={{ 
                        borderRadius: 1, 
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                      }}
                    >
                      Ver Comprobante
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Sin comprobante adjunto
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            ID: {income.id}
          </Typography>
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: 1,
              fontWeight: 600,
              px: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Visor PDF/Imagen */}
      {receiptUrl && (
        <Dialog
          open={pdfViewerOpen}
          onClose={handleClosePdfViewer}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: 2,
              height: '90vh',
              background: theme.palette.background.paper,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: theme.palette.mode === 'dark' 
              ? theme.palette.grey[900]
              : theme.palette.grey[50],
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PdfIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Comprobante - {income.client}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Descargar">
                <IconButton 
                  onClick={() => window.open(receiptUrl + '?download=1', '_blank')}
                  sx={{ color: 'text.secondary' }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleClosePdfViewer} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
            {isPdf ? (
              <iframe
                src={`${receiptUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  flex: 1
                }}
                title="Comprobante PDF"
              />
            ) : isImage ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                p: 2
              }}>
                <Box
                  component="img"
                  src={receiptUrl}
                  alt="Comprobante"
                  sx={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain',
                    borderRadius: 1,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%'
              }}>
                <Typography variant="h6" color="text.secondary">
                  Tipo de archivo no compatible para vista previa
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// Componente auxiliar para filas de detalle
const DetailRow = ({ icon, label, value, highlight = false }) => {
  const theme = useTheme();
  
  if (!value) return null;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      p: 1.5,
      borderRadius: 1,
      background: highlight 
        ? alpha(theme.palette.success.main, 0.08)
        : theme.palette.mode === 'dark' 
          ? alpha(theme.palette.primary.main, 0.08)
          : alpha(theme.palette.primary.main, 0.04),
      border: `1px solid ${highlight 
        ? alpha(theme.palette.success.main, 0.3)
        : alpha(theme.palette.primary.main, 0.2)
      }`
    }}>
      <Box sx={{ 
        color: highlight ? 'success.main' : 'primary.main',
        display: 'flex',
        alignItems: 'center'
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ 
          fontWeight: 600, 
          color: 'text.secondary',
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.7rem',
          mb: 0.5
        }}>
          {label}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          {typeof value === 'string' || typeof value === 'number' ? (
            <Typography variant="body2" sx={{ 
              fontWeight: highlight ? 600 : 500,
              color: highlight ? 'success.main' : 'text.primary',
              fontSize: '0.875rem'
            }}>
              {value}
            </Typography>
          ) : (
            value
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Función auxiliar para obtener URL del comprobante
const getReceiptUrl = (income) => {
  const possibleUrls = [
    income?.receiptUrl,
    income?.fileUrl,
    income?.comprobanteUrl,
    income?.attachmentUrl,
    income?.supportUrl,
    income?.evidenceUrl,
    Array.isArray(income?.files) ? income.files[0]?.url : null,
    Array.isArray(income?.attachments) ? income.attachments[0]?.url : null
  ];
  
  return possibleUrls.find(url => url && url.trim() !== '') || null;
};

export default IncomeDetailModal;
