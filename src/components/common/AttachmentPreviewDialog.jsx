import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  PictureAsPdf as PdfIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSettings } from '../../context/SettingsContext';

/**
 * AttachmentPreviewDialog
 * 
 * Componente reutilizable para previsualizar archivos adjuntos (PDF, imágenes).
 * Soporta File objects locales (via URL.createObjectURL) y URLs remotas.
 * 
 * @param {boolean} open - Controla visibilidad del diálogo
 * @param {Function} onClose - Callback al cerrar
 * @param {File|null} file - Archivo local a previsualizar (opcional, se usa si no hay url)
 * @param {string|null} url - URL directa a previsualizar (opcional, tiene prioridad sobre file)
 * @param {string} fileName - Nombre del archivo a mostrar en el header
 * @param {string} fileType - MIME type del archivo (e.g. 'application/pdf', 'image/png')
 */
const AttachmentPreviewDialog = ({
  open = false,
  onClose,
  file = null,
  url = null,
  fileName = 'Archivo',
  fileType = '',
}) => {
  const theme = useTheme();
  const { primaryColor = theme.palette.primary.main, secondaryColor = theme.palette.secondary.main } = useSettings() || {};
  const gradientBackground = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;

  // Crear objectURL para archivos locales
  const [objectUrl, setObjectUrl] = React.useState(null);

  useEffect(() => {
    if (open && file && !url) {
      const created = URL.createObjectURL(file);
      setObjectUrl(created);
      return () => URL.revokeObjectURL(created);
    }
    if (!open) {
      setObjectUrl(null);
    }
  }, [open, file, url]);

  const previewUrl = url || objectUrl;
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isImage = fileType.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: '80vh',
          border: `1px solid ${alpha(primaryColor, 0.2)}`,
        }
      }}
    >
      <DialogTitle sx={{
        py: 1.5,
        background: gradientBackground,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box display="flex" alignItems="center" gap={1} minWidth={0}>
          <PdfIcon sx={{ fontSize: 20, flexShrink: 0 }} />
          <Typography variant="subtitle1" fontWeight="600" noWrap>
            {fileName}
          </Typography>
        </Box>
        <Tooltip title="Cerrar">
          <IconButton size="small" onClick={handleClose} sx={{ color: 'white' }}>
            <CancelIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {previewUrl ? (
          isPdf ? (
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={fileName}
            />
          ) : isImage ? (
            <Box sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
            }}>
              <img
                src={previewUrl}
                alt={fileName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                Vista previa no disponible para este tipo de archivo
              </Typography>
            </Box>
          )
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              Sin archivo para previsualizar
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentPreviewDialog;
