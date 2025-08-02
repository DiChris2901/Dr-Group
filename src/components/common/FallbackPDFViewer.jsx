import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Paper
} from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  OpenInNew as OpenInNewIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * FallbackPDFViewer - Visor de PDF simple y efectivo para Firebase Storage
 * Usa iframe como método principal con fallback a link directo
 */
const FallbackPDFViewer = ({ 
  url, 
  height = 500, 
  filename = 'documento.pdf',
  onError 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.('Error loading PDF in iframe');
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  if (!url) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography>No se encontró la URL del documento</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', height: height, position: 'relative' }}>
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            zIndex: 2
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Cargando documento...</Typography>
        </Box>
      )}

      {error ? (
        <Paper 
          elevation={1}
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            p: 3
          }}
        >
          <WarningIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" color="warning.dark" gutterBottom>
            No se puede mostrar la vista previa
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            El documento no se puede mostrar en el navegador. <br />
            Haz clic en el botón para abrirlo en una nueva pestaña.
          </Typography>
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={openInNewTab}
            color="warning"
          >
            Abrir en nueva pestaña
          </Button>
        </Paper>
      ) : (
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          width="100%"
          height="100%"
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}
          onLoad={handleLoad}
          onError={handleError}
          title={filename}
        />
      )}

      {/* Información del archivo */}
      <Box sx={{ 
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        px: 2,
        py: 1,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: '0.875rem',
        zIndex: 3
      }}>
        <PictureAsPdfIcon sx={{ fontSize: 16 }} />
        <Typography variant="caption" color="inherit">
          {filename}
        </Typography>
      </Box>
    </Box>
  );
};

export default FallbackPDFViewer;
