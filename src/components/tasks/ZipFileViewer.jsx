import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  CircularProgress,
  Chip,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  InsertDriveFile as FileIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  FolderZip as ZipIcon
} from '@mui/icons-material';
import JSZip from 'jszip';

// Componente para visor de PDFs (reutilizar el existente si está disponible)
const PDFViewerSimple = ({ url, onClose }) => {
  const theme = useTheme();
  
  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Vista Previa de Documento
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: '80vh' }}>
        <iframe
          src={`${url}#view=FitH`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="PDF Viewer"
          type="application/pdf"
        />
      </DialogContent>
    </Dialog>
  );
};

const ZipFileViewer = ({ open, onClose, zipUrl, zipFileName }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    if (open && zipUrl) {
      loadZipContents();
    }
    return () => {
      // Cleanup URLs
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, zipUrl]);

  const loadZipContents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Descargar el ZIP
      const response = await fetch(zipUrl);
      const zipBlob = await response.blob();
      
      // Cargar con JSZip
      const zip = await JSZip.loadAsync(zipBlob);
      
      // Extraer información de archivos
      const fileList = [];
      zip.forEach((relativePath, zipEntry) => {
        // Ignorar carpetas
        if (!zipEntry.dir) {
          fileList.push({
            name: relativePath,
            size: zipEntry._data.uncompressedSize,
            type: getFileType(relativePath),
            zipEntry: zipEntry
          });
        }
      });
      
      setFiles(fileList);
    } catch (err) {
      console.error('Error al cargar ZIP:', err);
      setError('No se pudo cargar el contenido del archivo ZIP');
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    
    const typeMap = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      zip: 'application/zip'
    };
    
    return typeMap[ext] || 'application/octet-stream';
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <PdfIcon sx={{ color: '#f44336' }} />;
    if (type.includes('image')) return <ImageIcon sx={{ color: '#4caf50' }} />;
    if (type.includes('word')) return <DocIcon sx={{ color: '#2196f3' }} />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <ExcelIcon sx={{ color: '#4caf50' }} />;
    if (type.includes('zip')) return <ZipIcon sx={{ color: '#ff9800' }} />;
    return <FileIcon sx={{ color: theme.palette.text.secondary }} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleViewFile = async (file) => {
    try {
      // Extraer el archivo del ZIP como ArrayBuffer
      const arrayBuffer = await file.zipEntry.async('arraybuffer');
      
      // Crear blob con el tipo MIME correcto
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setSelectedFile(file);
      
      // Si es PDF o imagen, mostrar en visor
      if (file.type.includes('pdf')) {
        setShowPdfViewer(true);
      } else if (file.type.includes('image')) {
        setShowPdfViewer(true); // Reutilizar mismo visor
      }
    } catch (err) {
      console.error('Error al extraer archivo:', err);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      // Extraer el archivo del ZIP como ArrayBuffer
      const arrayBuffer = await file.zipEntry.async('arraybuffer');
      
      // Crear blob con el tipo MIME correcto
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar archivo:', err);
    }
  };

  const canPreview = (type) => {
    return type.includes('pdf') || type.includes('image');
  };

  const handleClosePdfViewer = () => {
    setShowPdfViewer(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ZipIcon sx={{ color: '#ff9800', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Archivos en ZIP
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {zipFileName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 3 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!loading && !error && files.length > 0 && (
            <List sx={{ p: 0 }}>
              {files.map((file, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {canPreview(file.type) && (
                        <IconButton 
                          edge="end" 
                          onClick={() => handleViewFile(file)}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDownloadFile(file)}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                          '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.15) }
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    borderBottom: index < files.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                  }}
                >
                  <ListItemButton onClick={() => canPreview(file.type) ? handleViewFile(file) : handleDownloadFile(file)}>
                    <ListItemIcon>
                      {getFileIcon(file.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {file.name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            alignItems: 'center', 
                            mt: 0.5,
                            fontSize: '0.75rem'
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.25,
                              fontSize: '0.65rem',
                              bgcolor: alpha(theme.palette.info.main, 0.08),
                              color: 'info.main',
                              borderRadius: 1,
                              fontWeight: 500
                            }}
                          >
                            {formatFileSize(file.size)}
                          </Typography>
                          {canPreview(file.type) && (
                            <Typography
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.25,
                                fontSize: '0.65rem',
                                bgcolor: alpha(theme.palette.success.main, 0.08),
                                color: 'success.main',
                                borderRadius: 1,
                                fontWeight: 500
                              }}
                            >
                              Vista previa disponible
                            </Typography>
                          )}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {!loading && !error && files.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No se encontraron archivos en el ZIP
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 2 
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
          </Typography>
          <Button onClick={onClose} sx={{ borderRadius: 1 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visor de PDFs/Imágenes */}
      {showPdfViewer && previewUrl && (
        <PDFViewerSimple url={previewUrl} onClose={handleClosePdfViewer} />
      )}
    </>
  );
};

export default ZipFileViewer;
