// 🔍 Componente de Vista Previa de Compresión PDF
// Permite comparar original vs comprimido antes de proceder

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Visibility as PreviewIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { drGroupCompressor } from '../../utils/pdfCompressor';

const PDFCompressionPreview = ({ 
  open, 
  onClose, 
  file, 
  onAccept, 
  onReject 
}) => {
  const [loading, setLoading] = useState(false);
  const [compressionResult, setCompressionResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  // Ejecutar compresión cuando se abre el diálogo
  React.useEffect(() => {
    if (open && file && !compressionResult) {
      compressFile();
    }
  }, [open, file]);

  const compressFile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando compresión de vista previa...');
      const result = await drGroupCompressor.compressPDF(file);
      setCompressionResult(result);
      console.log('✅ Vista previa de compresión generada:', result.stats);
    } catch (err) {
      console.error('❌ Error en vista previa:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (compressionResult) {
      onAccept(compressionResult);
    }
    handleClose();
  };

  const handleReject = () => {
    onReject();
    handleClose();
  };

  const handleClose = () => {
    setCompressionResult(null);
    setError(null);
    setActiveTab(0);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQualityColor = (stats) => {
    if (!stats.legible) return 'error';
    if (stats.error || stats.fallback) return 'warning';
    const reduction = parseFloat(stats.reductionPercent);
    if (reduction > 50) return 'success';
    if (reduction > 20) return 'info';
    return 'default';
  };

  const getQualityMessage = (stats) => {
    if (!stats.legible) return 'No legible - se mantiene original';
    if (stats.error) return 'Error - se mantiene original';
    if (stats.fallback) return 'Compresión cancelada - original preservado';
    if (stats.reduction === 0) return 'No requiere compresión';
    return `Optimizado ${stats.reductionPercent} manteniendo legibilidad`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '60vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <CompareIcon />
        Vista Previa de Compresión PDF
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6">Analizando documento...</Typography>
            <Typography variant="body2" color="text.secondary">
              Verificando legibilidad y calculando optimizaciones
            </Typography>
            <LinearProgress sx={{ width: '100%', mt: 2 }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Error en compresión</Typography>
            <Typography variant="body2">{error}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Se mantendrá el archivo original sin modificaciones.
            </Typography>
          </Alert>
        )}

        {compressionResult && (
          <Box>
            {/* Resumen de Compresión */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'rgba(255,255,255,0.9)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {compressionResult.stats.legible ? (
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                )}
                <Typography variant="h6">
                  Resultado de Compresión
                </Typography>
                <Chip 
                  label={getQualityMessage(compressionResult.stats)}
                  color={getQualityColor(compressionResult.stats)}
                  sx={{ ml: 'auto' }}
                />
              </Box>

              <Grid container spacing={3}>
                {/* Archivo Original */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, background: '#f8f9fa' }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      📄 ARCHIVO ORIGINAL
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                      {formatFileSize(compressionResult.stats.originalSize)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {file.name}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Archivo Comprimido */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, background: '#f0f8f0' }}>
                    <Typography variant="subtitle1" fontWeight={600} color="success.main">
                      📄 ARCHIVO OPTIMIZADO
                    </Typography>
                    <Typography variant="h4" color="success.main" sx={{ my: 1 }}>
                      {formatFileSize(compressionResult.stats.compressedSize)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reducido {compressionResult.stats.reductionPercent}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Ahorro */}
                <Grid item xs={12}>
                  <Alert 
                    severity={compressionResult.stats.legible ? "success" : "warning"} 
                    sx={{ background: 'rgba(76, 175, 80, 0.1)' }}
                  >
                    <Typography variant="h6">
                      💾 Ahorro de espacio: {compressionResult.stats.saved}
                    </Typography>
                    <Typography variant="body2">
                      {compressionResult.stats.message}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Paper>

            {/* Garantías de Legibilidad */}
            <Paper elevation={1} sx={{ p: 3, background: 'rgba(255,255,255,0.7)' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                🛡️ Garantías de Calidad
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Texto 100% preservado</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Estructura PDF intacta</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Legibilidad verificada</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Failsafe automático</Typography>
                  </Box>
                </Grid>
              </Grid>

              {compressionResult.stats.processingTime && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  ⚡ Procesado en {compressionResult.stats.processingTime.toFixed(0)}ms
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, background: 'rgba(255,255,255,0.9)' }}>
        <Button 
          onClick={handleReject} 
          variant="outlined"
          disabled={loading}
        >
          Mantener Original
        </Button>
        
        {compressionResult?.preview && (
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => window.open(compressionResult.preview, '_blank')}
          >
            Vista Previa
          </Button>
        )}
        
        <Button 
          onClick={handleAccept}
          variant="contained"
          disabled={loading || !compressionResult}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            }
          }}
        >
          {compressionResult?.stats.reduction > 0 ? 'Usar Comprimido' : 'Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFCompressionPreview;
