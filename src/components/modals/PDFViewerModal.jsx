import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  IconButton,
  Typography,
  Avatar,
  Tooltip,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  FolderOpen,
  InsertDriveFile,
  Schedule,
  GetApp
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ref, getMetadata } from 'firebase/storage';
import { storage } from '../../config/firebase';

/**
 * Modal Visor PDF - Diseño Spectacular Empresarial
 * Siguiendo especificaciones de MODAL_PDF_VIEWER_DESIGN.md
 */
const PDFViewerModal = ({ 
  open, 
  onClose, 
  documentUrl, 
  documentTitle = 'Documento',
  documentType = 'PDF'
}) => {
  const theme = useTheme();
  const [documentInfo, setDocumentInfo] = useState(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener información del documento desde Firebase
  useEffect(() => {
    const fetchDocumentInfo = async () => {
      if (!documentUrl) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Extraer ruta del archivo desde URL Firebase
        let filePath = null;
        
        if (documentUrl.includes('firebase') && documentUrl.includes('o/')) {
          const encodedPath = documentUrl.split('o/')[1].split('?')[0];
          filePath = decodeURIComponent(encodedPath);
        }
        
        if (filePath) {
          const fileRef = ref(storage, filePath);
          const metadata = await getMetadata(fileRef);
          
          // Extraer nombre limpio
          let fileName = metadata.name || filePath.split('/').pop() || documentTitle;
          
          // Limpiar nombres largos
          if (fileName.length > 50) {
            const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
            const baseName = fileName.substring(0, 40);
            fileName = baseName + '...' + extension;
          }
          
          setDocumentInfo({
            name: fileName,
            size: parseInt(metadata.size) || 0,
            type: metadata.contentType || 'application/pdf',
            uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : null,
            updatedAt: metadata.updated ? new Date(metadata.updated) : null,
            path: filePath,
            url: documentUrl,
            bucket: metadata.bucket,
            fullPath: metadata.fullPath
          });
        } else {
          // Fallback si no se puede extraer la ruta
          setDocumentInfo({
            name: documentTitle,
            size: 0,
            type: 'application/pdf',
            uploadedAt: null,
            path: 'Storage/documentos/',
            url: documentUrl
          });
        }
      } catch (err) {
        console.error('Error obteniendo información del documento:', err);
        // Fallback en caso de error
        setDocumentInfo({
          name: documentTitle,
          size: 0,
          type: 'application/pdf',
          uploadedAt: null,
          path: 'Storage/documentos/',
          url: documentUrl
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (open && documentUrl) {
      fetchDocumentInfo();
    }
  }, [open, documentUrl, documentTitle]);

  // Formatear tipo de documento
  const formatDocumentType = (type) => {
    const mimeToFriendly = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WEBP',
    };
    
    return mimeToFriendly[type] || type?.split('/')[1]?.toUpperCase() || 'PDF';
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return 'Tamaño desconocido';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Descargar documento
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentInfo?.name || 'documento.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: documentInfoOpen ? 'calc(100vh - 50px)' : '90vh',
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.5)'
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      {/* HEADER EMPRESARIAL PREMIUM */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 2,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* SECCIÓN IZQUIERDA - Avatar + Información */}
          <Box display="flex" alignItems="center" gap={2.5}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Avatar sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                width: 40,
                height: 40
              }}>
                <PdfIcon />
              </Avatar>
            </motion.div>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {documentInfo?.name || documentTitle}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  {documentInfo ? formatDocumentType(documentInfo.type) : documentType}
                  {documentInfo && documentInfo.size > 0 && ` • ${formatFileSize(documentInfo.size)}`}
                </Typography>
                {documentInfo?.uploadedAt && (
                  <Typography variant="body2" color="text.secondary">
                    {format(documentInfo.uploadedAt, "dd/MM/yyyy", { locale: es })}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          
          {/* SECCIÓN DERECHA - Controles Avanzados */}
          <Box display="flex" gap={1}>
            {/* BOTÓN INFO */}
            <Tooltip title="Información del documento">
              <IconButton
                onClick={() => setDocumentInfoOpen(!documentInfoOpen)}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: documentInfoOpen 
                    ? alpha(theme.palette.info.main, 0.15) 
                    : alpha(theme.palette.info.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.info.main, 0.2),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <InfoIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            
            {/* BOTÓN DESCARGAR */}
            <Tooltip title="Descargar documento">
              <IconButton
                onClick={handleDownload}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.success.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.success.main, 0.15),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <DownloadIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            
            {/* BOTÓN CERRAR */}
            <IconButton onClick={onClose} sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* PANEL INFORMACIÓN EXPANDIBLE */}
      <AnimatePresence>
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
              maxHeight: '30vh',
              overflowY: 'auto'
            }}>
              {/* GRID RESPONSIVO PRINCIPAL */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2, 
                mb: 2
              }}>
                {/* UBICACIÓN */}
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
                
                {/* TIPO */}
                <Box display="flex" alignItems="start" gap={1}>
                  <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500
                    }}>
                      Tipo
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem' }}>
                      {formatDocumentType(documentInfo.type)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* FECHA */}
                {documentInfo.uploadedAt && (
                  <Box display="flex" alignItems="start" gap={1}>
                    <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                      }}>
                        Fecha de subida
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem' }}>
                        {format(documentInfo.uploadedAt, "dd/MM/yyyy HH:mm", { locale: es })}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {/* TAMAÑO */}
                {documentInfo.size > 0 && (
                  <Box display="flex" alignItems="start" gap={1}>
                    <GetApp sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                      }}>
                        Tamaño
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem' }}>
                        {formatFileSize(documentInfo.size)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
              
              {/* INFORMACIÓN TÉCNICA DETALLADA */}
              {documentInfo.fullPath && (
                <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500
                  }}>
                    Ruta completa del documento
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    background: alpha(theme.palette.grey[500], 0.1),
                    p: 1.5,
                    borderRadius: 1,
                    wordBreak: 'break-all',
                    color: theme.palette.text.secondary
                  }}>
                    {documentInfo.fullPath}
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CONTENIDO - VISOR PDF */}
      <DialogContent sx={{ 
        p: 0,
        height: documentInfoOpen ? 'calc(100% - 200px)' : '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.default,
        overflow: 'hidden'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%' 
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography color="error">Error al cargar el documento</Typography>
            <Button variant="outlined" onClick={onClose}>Cerrar</Button>
          </Box>
        ) : (
          <iframe
            src={documentUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: theme.palette.background.default
            }}
            title={documentInfo?.name || documentTitle}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerModal;
