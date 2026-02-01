import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  Image as ImageIcon
} from '@mui/icons-material';

/**
 * DocumentPreviewModal - Visor universal de documentos
 * Diseño: Siguiendo MODAL_PDF_VIEWER_DESIGN.md
 * 
 * @param {boolean} open - Estado del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {object} document - Objeto con información del documento
 *   - nombre: string
 *   - url: string
 *   - tipo: string (MIME type)
 *   - tamaño: number (bytes)
 * 
 * @example
 * <DocumentPreviewModal
 *   open={previewOpen}
 *   onClose={handleClosePreview}
 *   document={{
 *     nombre: 'documento.pdf',
 *     url: 'https://...',
 *     tipo: 'application/pdf',
 *     tamaño: 1024000
 *   }}
 * />
 */
const DocumentPreviewModal = ({ open, onClose, document }) => {
  const theme = useTheme();

  if (!document) return null;

  // Determinar ícono según tipo de archivo
  const getFileIcon = () => {
    if (document.tipo === 'application/pdf') return <PdfIcon />;
    if (document.tipo === 'application/zip') return <ZipIcon />;
    if (document.tipo?.startsWith('image/')) return <ImageIcon />;
    return <FileIcon />;
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Renderizar contenido según tipo de archivo
  const renderContent = () => {
    // PDFs → iframe nativo
    if (document.tipo === 'application/pdf') {
      return (
        <iframe
          src={document.url}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="Vista previa PDF"
        />
      );
    }

    // Imágenes → img tag
    if (document.tipo?.startsWith('image/')) {
      return (
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}>
          <img
            src={document.url}
            alt="Vista previa"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }}
          />
        </Box>
      );
    }

    // ZIP u otros archivos no previsualiz ables
    return (
      <Box sx={{ 
        textAlign: 'center', 
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <Avatar sx={{ 
          width: 80, 
          height: 80, 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          mb: 3
        }}>
          {getFileIcon()}
        </Avatar>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {document.tipo === 'application/zip' ? 'Archivo ZIP' : 'Vista previa no disponible'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          {document.tipo === 'application/zip' 
            ? 'Los archivos comprimidos no se pueden previsualizar. Descárgalo para ver su contenido.'
            : 'Este tipo de archivo no se puede previsualizar en el navegador.'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          component="a"
          href={document.url}
          download
          sx={{ borderRadius: 1 }}
        >
          Descargar Archivo
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          borderRadius: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.grey[900], 0.98)} 0%, ${alpha(theme.palette.grey[800], 0.95)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`
        }
      }}
    >
      {/* Header Premium */}
      <DialogTitle sx={{ 
        p: 3,
        pb: 2,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* Información del documento */}
          <Box display="flex" alignItems="center" gap={2.5}>
            <Avatar sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              width: 40,
              height: 40
            }}>
              {getFileIcon()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {document.nombre || 'Vista Previa'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {document.tipo || 'Documento'} • {formatFileSize(document.tamaño)}
              </Typography>
            </Box>
          </Box>
          
          {/* Controles */}
          <Box display="flex" gap={1}>
            <IconButton
              component="a"
              href={document.url}
              download
              sx={{ 
                color: 'text.primary',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <DownloadIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      {/* Contenido del visor */}
      <DialogContent sx={{ 
        p: 0, 
        height: 'calc(100% - 80px)', 
        overflow: 'hidden',
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100'
      }}>
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {renderContent()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
