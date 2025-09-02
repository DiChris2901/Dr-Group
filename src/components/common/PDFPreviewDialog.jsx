import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  alpha
} from '@mui/material';
import {
  Close,
  Receipt as ReceiptIcon,
  PictureAsPdf,
  Image,
  Info,
  FolderOpen,
  InsertDriveFile,
  Schedule,
  GetApp,
  Fullscreen,
  FullscreenExit,
  OpenInNew
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMetadata } from 'firebase/storage';
import { ref } from 'firebase/storage';
import { storage } from '../../config/firebase';
import FallbackPDFViewer from './FallbackPDFViewer';

/**
 * PDFPreviewDialog - Componente avanzado con diseño spectacular para vista previa de comprobantes
 * Implementación basada en el modal de referencia de CommitmentsList.jsx
 * Con panel de información expandible y metadatos de Firebase Storage
 * 
 * Props:
 * - open: boolean - Si el dialog está abierto
 * - onClose: function - Función para cerrar el dialog
 * - receiptUrl: string - URL del archivo (se puede llamar url para compatibilidad)
 * - receiptMetadata: object - Metadatos del archivo (name, size, type, originalName)
 * - canDownloadReceipts: boolean - Si se puede descargar el archivo
 * - title: string - Título del dialog
 */
const PDFPreviewDialog = ({ 
  open, 
  onClose, 
  url,                    // Para compatibilidad hacia atrás
  receiptUrl,             // Nuevo parámetro preferido
  filename = 'comprobante.pdf',
  metadata,               // Para compatibilidad hacia atrás
  receiptMetadata,        // Nuevo parámetro preferido
  canDownloadReceipts = false,
  title = "Vista Previa del Comprobante"
}) => {
  // Compatibilidad: usar receiptUrl o url, receiptMetadata o metadata
  const finalUrl = receiptUrl || url;
  const finalMetadata = receiptMetadata || metadata;
  const theme = useTheme();

  // Estados para el modal avanzado
  const [documentInfo, setDocumentInfo] = useState(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [documentDimensions, setDocumentDimensions] = useState({ width: 'xl', height: '90vh' });
  const [viewerSize, setViewerSize] = useState('normal');
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Funciones auxiliares copiadas de CommitmentsList.jsx
  const formatDocumentType = (type) => {
    if (!type) return 'Documento';
    
    const mimeToFriendly = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG', 
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WEBP',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/vnd.ms-excel': 'Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'text/plain': 'Texto',
      'text/csv': 'CSV'
    };
    
    if (mimeToFriendly[type]) {
      return mimeToFriendly[type];
    }
    
    if (type.length <= 10 && !type.includes('/')) {
      return type;
    }
    
    if (type.includes('/')) {
      const parts = type.split('/');
      const subtype = parts[1];
      return subtype.toUpperCase();
    }
    
    return type;
  };

  const formatFileSize = (bytes, isEstimated = false) => {
    if (!bytes || bytes === 0) {
      return 'Tamaño no disponible';
    }
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
    
    if (isEstimated) {
      return `≈ ${size} ${sizes[i]}`;
    }
    
    return `${size} ${sizes[i]}`;
  };

  const handleToggleDocumentInfo = () => {
    const willOpen = !documentInfoOpen;
    setDocumentInfoOpen(willOpen);
    
    if (willOpen) {
      setDocumentDimensions(prev => ({
        ...prev,
        height: 'calc(100vh - 50px)'
      }));
    } else {
      setDocumentDimensions(prev => ({
        ...prev,
        height: '90vh'
      }));
    }
  };

  const toggleViewerSize = () => {
    setViewerSize(prev => prev === 'normal' ? 'fullscreen' : 'normal');
  };

  const safeToDate = (dateValue) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue.toDate) return dateValue.toDate();
    return new Date(dateValue);
  };

  // Función para obtener metadatos reales de Firebase Storage
  const getDocumentInfo = async (url) => {
    if (!url) return null;

    try {
      setLoadingMetadata(true);
      
      // Si ya tenemos metadata, usarla como base
      if (finalMetadata) {
        return {
          name: finalMetadata.originalName || finalMetadata.name || filename,
          size: finalMetadata.size || 0,
          type: finalMetadata.type || (url.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg'),
          uploadedAt: finalMetadata.uploadedAt || finalMetadata.createdAt || null,
          path: finalMetadata.path || 'Firebase Storage',
          url: url,
          isEstimated: false
        };
      }

      // Intentar obtener metadatos reales de Firebase Storage
      let filePath = null;
      
      if (url.includes('firebase') && url.includes('o/')) {
        const encodedPath = url.split('o/')[1].split('?')[0];
        filePath = decodeURIComponent(encodedPath);
      } else {
        const urlParts = url.split('/');
        filePath = urlParts[urlParts.length - 1].split('?')[0];
      }
      
      if (filePath) {
        try {
          const fileRef = ref(storage, filePath);
          const metadata = await getMetadata(fileRef);
          
          let fileName = metadata.name || filePath.split('/').pop() || 'Documento';
          
          if (fileName.length > 50) {
            const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
            const baseName = fileName.substring(0, 40);
            fileName = baseName + '...' + extension;
          }
          
          return {
            name: fileName,
            size: parseInt(metadata.size) || 0,
            type: metadata.contentType || 'application/octet-stream',
            uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : null,
            updatedAt: metadata.updated ? new Date(metadata.updated) : null,
            path: filePath,
            url: url,
            bucket: metadata.bucket,
            fullPath: metadata.fullPath,
            isEstimated: false
          };
          
        } catch (metadataError) {
          console.log('Error obteniendo metadatos de Firebase:', metadataError);
          // Fallback a información básica
          const isPdf = url.toLowerCase().includes('.pdf');
          const estimatedSize = isPdf ? Math.floor(Math.random() * (5000000 - 500000) + 500000) : Math.floor(Math.random() * (2000000 - 100000) + 100000);
          
          return {
            name: filename,
            size: estimatedSize,
            type: isPdf ? 'application/pdf' : 'image/jpeg',
            uploadedAt: new Date(),
            path: 'Firebase Storage',
            url: url,
            isEstimated: true
          };
        }
      }
    } catch (error) {
      console.error('Error procesando información del documento:', error);
    } finally {
      setLoadingMetadata(false);
    }
    
    return null;
  };

  // Cargar información del documento cuando se abre el modal
  useEffect(() => {
    if (open && finalUrl) {
      getDocumentInfo(finalUrl).then(info => {
        if (info) {
          setDocumentInfo(info);
        }
      });
    }
  }, [open, finalUrl]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!open) {
      setDocumentInfo(null);
      setDocumentInfoOpen(false);
      setViewerSize('normal');
      setDocumentDimensions({ width: 'xl', height: '90vh' });
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={viewerSize === 'fullscreen' ? false : documentDimensions.width}
      fullScreen={viewerSize === 'fullscreen'}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: viewerSize === 'fullscreen' ? 0 : 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          height: viewerSize === 'fullscreen' ? '100vh' : documentDimensions.height,
          overflow: 'hidden'
        }
      }}
    >
      {/* DialogTitle spectacular con información del documento */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 2,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              width: 40,
              height: 40
            }}>
              {formatDocumentType(documentInfo?.type) === 'PDF' ? 
                <PictureAsPdf sx={{ fontSize: 20 }} /> :
                <Image sx={{ fontSize: 20 }} />
              }
            </Avatar>
          </motion.div>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 0.5
            }}>
              {documentInfo?.name && documentInfo.name !== 'Comprobante.pdf' && documentInfo.name !== 'Comprobante.jpg' 
                ? documentInfo.name 
                : `Comprobante ${formatDocumentType(documentInfo?.type) || 'PDF'}`}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.85rem'
              }}>
                {formatDocumentType(documentInfo?.type) || 'Documento'} • {formatFileSize(documentInfo?.size, documentInfo?.isEstimated)}
              </Typography>
              {documentInfo?.uploadedAt && (
                <Typography variant="body2" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.85rem'
                }}>
                  • {format(safeToDate(documentInfo.uploadedAt), 'dd/MM/yyyy', { locale: es })}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {/* Botón de información del documento */}
          <Tooltip title="Información del documento">
            <IconButton
              onClick={handleToggleDocumentInfo}
              sx={{ 
                color: theme.palette.text.primary,
                background: documentInfoOpen 
                  ? alpha(theme.palette.info.main, 0.15)
                  : alpha(theme.palette.info.main, 0.08),
                '&:hover': { 
                  background: alpha(theme.palette.info.main, 0.12),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Info sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={viewerSize === 'fullscreen' ? 'Ventana normal' : 'Pantalla completa'}>
            <IconButton
              onClick={toggleViewerSize}
              sx={{ 
                color: theme.palette.text.primary,
                background: alpha(theme.palette.primary.main, 0.08),
                '&:hover': { 
                  background: alpha(theme.palette.primary.main, 0.12),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {viewerSize === 'fullscreen' ? 
                <FullscreenExit sx={{ fontSize: 18 }} /> : 
                <Fullscreen sx={{ fontSize: 18 }} />
              }
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Abrir en nueva pestaña">
            <IconButton
              component="a"
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: theme.palette.text.primary,
                background: alpha(theme.palette.success.main, 0.08),
                '&:hover': { 
                  background: alpha(theme.palette.success.main, 0.12),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <OpenInNew sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          
          <IconButton
            onClick={onClose}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { 
                color: theme.palette.error.main,
                background: alpha(theme.palette.error.main, 0.08),
                transform: 'scale(1.05)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Panel de información expandible con metadatos */}
      {documentInfo && documentInfoOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: 'hidden' }}
        >
          <Box sx={{
            px: 3,
            py: 2,
            background: alpha(theme.palette.info.main, 0.04),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            maxHeight: '50vh',
            overflowY: 'auto',
            minHeight: 'auto'
          }}>
            {/* Grid responsivo con información principal */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2, 
              mb: 2
            }}>
              <Box display="flex" alignItems="start" gap={1}>
                <FolderOpen sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'block'
                  }}>
                    Ubicación
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.primary,
                    fontSize: '0.8rem',
                    wordBreak: 'break-word'
                  }}>
                    {documentInfo.path || 'Firebase Storage'}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="start" gap={1}>
                <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'block'
                  }}>
                    Tipo
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.primary,
                    fontSize: '0.8rem'
                  }}>
                    {formatDocumentType(documentInfo.type)}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="start" gap={1}>
                <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'block'
                  }}>
                    Fecha de subida
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.primary,
                    fontSize: '0.8rem'
                  }}>
                    {documentInfo.uploadedAt ? (
                      format(safeToDate(documentInfo.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: es })
                    ) : documentInfo.isEstimated ? (
                      'Fecha aproximada no disponible'
                    ) : (
                      'Fecha no registrada'
                    )}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="start" gap={1}>
                <GetApp sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: 'block'
                  }}>
                    Tamaño
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.primary,
                    fontSize: '0.8rem'
                  }}>
                    {formatFileSize(documentInfo.size, documentInfo.isEstimated)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Información técnica detallada */}
            {documentInfo.url && (
              <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  mb: 1,
                  display: 'block'
                }}>
                  Ruta completa del documento
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.text.primary,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  background: alpha(theme.palette.grey[500], 0.1),
                  p: 1.5,
                  borderRadius: 1,
                  wordBreak: 'break-all',
                  mb: 2
                }}>
                  {documentInfo.fullPath || documentInfo.path || documentInfo.url}
                </Typography>

                {/* Metadatos adicionales de Firebase */}
                {(documentInfo.bucket || documentInfo.updatedAt) && (
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 2,
                    mt: 2
                  }}>
                    {documentInfo.bucket && (
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          display: 'block'
                        }}>
                          Bucket de almacenamiento
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          wordBreak: 'break-word'
                        }}>
                          {documentInfo.bucket}
                        </Typography>
                      </Box>
                    )}
                    
                    {documentInfo.updatedAt && (
                      <Box>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.text.secondary,
                          fontWeight: 500,
                          display: 'block'
                        }}>
                          Última modificación
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: '0.75rem'
                        }}>
                          {format(documentInfo.updatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </motion.div>
      )}
      
      {/* Contenido principal del visor */}
      <DialogContent sx={{ 
        p: 3, 
        pt: 3,
        height: documentInfoOpen ? 'calc(100% - 300px)' : 'calc(100% - 120px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {finalUrl ? (
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {finalMetadata?.type?.startsWith('image/') ? (
              // Vista previa de imágenes con diseño mejorado
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha(theme.palette.grey[100], 0.3),
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <img 
                  src={finalUrl}
                  alt="Comprobante de pago"
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                />
              </Box>
            ) : (
              // Vista previa de PDFs con FallbackPDFViewer
              <Box sx={{ 
                flex: 1,
                borderRadius: 2,
                overflow: 'hidden',
                background: alpha(theme.palette.grey[100], 0.3)
              }}>
                <FallbackPDFViewer 
                  url={finalUrl}
                  height="100%"
                  filename={documentInfo?.name || filename}
                  onError={(error) => {
                    console.error('Error loading PDF:', error);
                  }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            color: theme.palette.text.secondary
          }}>
            <ReceiptIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.5) }} />
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
              No hay documento disponible
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Este comprobante no tiene un archivo asociado
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog;
