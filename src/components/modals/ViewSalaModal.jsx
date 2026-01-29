import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Avatar,
  Typography,
  Grid,
  Chip,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PDFViewerModal from './PDFViewerModal';

/**
 * Modal para ver detalles completos de una sala
 * Componente extraído de SalasPage para mejorar la mantenibilidad
 */
const ViewSalaModal = ({
  open,
  onClose,
  selectedSala,
  onEdit,
  getStatusText,
  getStatusColor
}) => {
  const theme = useTheme();
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);

  // Helper: Formatear cédula con puntos (ej: 25456325 → 25.456.325)
  const formatCedula = (value) => {
    if (!value) return '';
    // Remover todo lo que no sea número
    const numbers = value.toString().replace(/\D/g, '');
    // Agregar puntos cada 3 dígitos desde el final
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper: Formatear NIT (900.123.456-7)
  const formatNIT = (nit) => {
    if (!nit) return '';
    const cleaned = String(nit).replace(/\D/g, '');
    if (cleaned.length <= 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3').replace(/\.$/, '');
    }
    const num = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return num.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3') + '-' + dv;
  };

  const handleViewDocument = (doc, title) => {
    setCurrentDocument({ url: doc.url, title });
    setPdfViewerOpen(true);
  };

  return (
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
          border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`
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
          <Avatar sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
            <VisibilityIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
              Detalles de la Sala
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Información completa de la sala
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, background: alpha(theme.palette.background.default, 0.4) }}>
        {selectedSala && (
          <Box sx={{ p: 3 }}>
            {/* Header Card - Nombre y Estado */}
            <Paper elevation={0} sx={{ 
              p: 3, 
              mb: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  {selectedSala.name}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Chip 
                    label={getStatusText(selectedSala.status)}
                    color={getStatusColor(selectedSala.status)}
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                  {selectedSala.status === 'retired' && selectedSala.fechaRetiro && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Retirada: {new Date(selectedSala.fechaRetiro).toLocaleDateString('es-CO', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {selectedSala.companyName}
                  </Typography>
                </Box>
                {selectedSala.ciudad && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedSala.ciudad}{selectedSala.departamento ? `, ${selectedSala.departamento}` : ''}
                    </Typography>
                  </Box>
                )}
                {selectedSala.direccion && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedSala.direccion}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            <Grid container spacing={2.5}>
              {/* Card: Información del Propietario y Representante Legal */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ 
                  p: 2.5, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      color: 'primary.main',
                      width: 36,
                      height: 36
                    }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Propietario
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 1, fontWeight: 600 }}>
                    {selectedSala.propietario || 'No especificado'}
                  </Typography>
                  
                  {/* Representante Legal Principal */}
                  {(selectedSala.nombreRepLegal || selectedSala.cedulaRepLegal) && (
                    <Box sx={{ 
                      mt: 2, 
                      pt: 2, 
                      borderTop: `1px solid ${theme.palette.divider}` 
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        📋 Representante Legal Principal
                      </Typography>
                      {selectedSala.nombreRepLegal && (
                        <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                          {selectedSala.nombreRepLegal}
                        </Typography>
                      )}
                      {selectedSala.cedulaRepLegal && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {(() => {
                            const tipo = selectedSala.tipoDocumentoRepLegal || 'CC';
                            const valor = selectedSala.cedulaRepLegal;
                            const tipoLabel = {
                              CC: 'CC',
                              NIT: 'NIT',
                              CE: 'CE',
                              PP: 'Pasaporte'
                            }[tipo];
                            
                            let valorFormateado = valor;
                            if (tipo === 'CC' || tipo === 'CE') {
                              valorFormateado = formatCedula(valor);
                            } else if (tipo === 'NIT') {
                              valorFormateado = formatNIT(valor);
                            }
                            
                            return `${tipoLabel}: ${valorFormateado}`;
                          })()}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Representante Legal Suplente */}
                  {(selectedSala.nombreRepLegalSuplente || selectedSala.cedulaRepLegalSuplente) && (
                    <Box sx={{ 
                      mt: 2, 
                      pt: 2, 
                      borderTop: `1px solid ${theme.palette.divider}` 
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        👥 Representante Legal Suplente
                      </Typography>
                      {selectedSala.nombreRepLegalSuplente && (
                        <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                          {selectedSala.nombreRepLegalSuplente}
                        </Typography>
                      )}
                      {selectedSala.cedulaRepLegalSuplente && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {(() => {
                            const tipo = selectedSala.tipoDocumentoRepLegalSuplente || 'CC';
                            const valor = selectedSala.cedulaRepLegalSuplente;
                            const tipoLabel = {
                              CC: 'CC',
                              NIT: 'NIT',
                              CE: 'CE',
                              PP: 'Pasaporte'
                            }[tipo];
                            
                            let valorFormateado = valor;
                            if (tipo === 'CC' || tipo === 'CE') {
                              valorFormateado = formatCedula(valor);
                            } else if (tipo === 'NIT') {
                              valorFormateado = formatNIT(valor);
                            }
                            
                            return `${tipoLabel}: ${valorFormateado}`;
                          })()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Card: Costos */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ 
                  p: 2.5, 
                  height: '100%',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.08)}`,
                    borderColor: alpha(theme.palette.success.main, 0.3)
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      color: 'success.main',
                      width: 36,
                      height: 36
                    }}>
                      <MoneyIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Costos Mensuales
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Administración
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      ${(selectedSala.administracion || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Conexión
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      ${(selectedSala.conexion || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Card: Información del Proveedor y Contrato */}
              {(selectedSala.proveedorOnline || selectedSala.fechaInicioContrato) && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ 
                    p: 2.5, 
                    height: '100%',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.08)}`,
                      borderColor: alpha(theme.palette.info.main, 0.3)
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1), 
                        color: 'info.main',
                        width: 36,
                        height: 36
                      }}>
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Proveedor y Contrato
                      </Typography>
                    </Box>
                    
                    {selectedSala.proveedorOnline && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Proveedor de Servicios
                        </Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
                          {selectedSala.proveedorOnline}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedSala.fechaInicioContrato && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          📅 Fecha Inicio Contrato
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {new Date(selectedSala.fechaInicioContrato).toLocaleDateString('es-CO', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Card: Contacto Principal */}
              {selectedSala.contactoAutorizado && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ 
                    p: 2.5, 
                    height: '100%',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.08)}`,
                      borderColor: alpha(theme.palette.warning.main, 0.3)
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                        color: 'warning.main',
                        width: 36,
                        height: 36
                      }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Contacto Principal
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
                      {selectedSala.contactoAutorizado}
                    </Typography>
                    {selectedSala.contactPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {selectedSala.contactPhone}
                        </Typography>
                      </Box>
                    )}
                    {selectedSala.contactEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {selectedSala.contactEmail}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}

              {/* Card: Contacto Secundario */}
              {selectedSala.contactoAutorizado2 && (
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ 
                    p: 2.5, 
                    height: '100%',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.08)}`,
                      borderColor: alpha(theme.palette.info.main, 0.3)
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1), 
                        color: 'info.main',
                        width: 36,
                        height: 36
                      }}>
                        <PeopleIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Contacto Secundario
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
                      {selectedSala.contactoAutorizado2}
                    </Typography>
                    {selectedSala.contactPhone2 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {selectedSala.contactPhone2}
                        </Typography>
                      </Box>
                    )}
                    {selectedSala.contactEmail2 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {selectedSala.contactEmail2}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* Sección: Documentos Adjuntos */}
            {(selectedSala.attachments?.camaraComercio || selectedSala.attachments?.usoSuelos || selectedSala.attachments?.validacionUsoSuelos) && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <DocumentIcon color="primary" />
                  Documentos Adjuntos
                </Typography>
                <Grid container spacing={2} justifyContent="center">
                  {(() => {
                    // Contar documentos disponibles
                    const availableDocuments = [
                      selectedSala.attachments?.camaraComercio,
                      selectedSala.attachments?.usoSuelos,
                      selectedSala.attachments?.validacionUsoSuelos
                    ].filter(Boolean).length;

                    // Calcular tamaño de Grid: 3 docs = md{4}, 2 docs = md{6}, 1 doc = md{8}
                    const gridSize = availableDocuments === 3 ? 4 : availableDocuments === 2 ? 6 : 8;
                    
                    return (
                      <>
                        {/* Cámara de Comercio */}
                        {selectedSala.attachments?.camaraComercio && (
                          <Grid item xs={12} md={gridSize}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: `2px solid ${theme.palette.primary.main}`,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'primary.contrastText',
                            width: 40,
                            height: 40
                          }}>
                            <PdfIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                              Cámara de Comercio
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedSala.attachments.camaraComercio.name || 'Documento PDF'}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDocument(selectedSala.attachments.camaraComercio, 'Cámara de Comercio')}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            mt: 'auto'
                          }}
                        >
                          Ver Documento
                        </Button>
                      </Paper>
                    </Grid>
                  )}

                  {/* Uso de Suelos */}
                  {selectedSala.attachments?.usoSuelos && (
                    <Grid item xs={12} md={gridSize}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: `2px solid ${theme.palette.secondary.main}`,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: 'secondary.main', 
                            color: 'secondary.contrastText',
                            width: 40,
                            height: 40
                          }}>
                            <PdfIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} color="secondary.main">
                              Uso de Suelos
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedSala.attachments.usoSuelos.name || 'Documento PDF'}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          color="secondary"
                          fullWidth
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDocument(selectedSala.attachments.usoSuelos, 'Uso de Suelos')}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            mt: 'auto'
                          }}
                        >
                          Ver Documento
                        </Button>
                      </Paper>
                    </Grid>
                  )}

                  {/* Validación Uso de Suelos */}
                  {selectedSala.attachments?.validacionUsoSuelos && (
                    <Grid item xs={12} md={gridSize}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: `2px solid ${theme.palette.primary.dark}`,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.dark, 0.05),
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.dark, 0.15)}`,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.dark', 
                            color: 'primary.contrastText',
                            width: 40,
                            height: 40
                          }}>
                            <PdfIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.dark' }}>
                              Validación Uso de Suelos
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedSala.attachments.validacionUsoSuelos.name || 'Documento PDF'}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDocument(selectedSala.attachments.validacionUsoSuelos, 'Validación Uso de Suelos')}
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: 'primary.dark',
                            mt: 'auto',
                            '&:hover': {
                              bgcolor: 'primary.main'
                            }
                          }}
                        >
                          Ver Documento
                        </Button>
                      </Paper>
                    </Grid>
                  )}
                      </>
                    );
                  })()}
                </Grid>
              </Box>
            )}

            {/* Footer: Metadatos */}
            <Box sx={{ 
              mt: 3, 
              pt: 2.5, 
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  📅 Creada el {selectedSala.createdAt ? format(selectedSala.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'Fecha no disponible'}
                </Typography>
                {selectedSala.updatedAt && selectedSala.updatedAt !== selectedSala.createdAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    🔄 Última actualización: {format(selectedSala.updatedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2 }}
        >
          Cerrar
        </Button>
        <Button
          onClick={onEdit}
          variant="contained"
          startIcon={<EditIcon />}
          sx={{ borderRadius: 2 }}
        >
          Editar Sala
        </Button>
      </DialogActions>

      {/* Modal Visor PDF */}
      <PDFViewerModal
        open={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          setCurrentDocument(null);
        }}
        documentUrl={currentDocument?.url}
        documentTitle={currentDocument?.title}
      />
    </Dialog>
  );
};

export default ViewSalaModal;
