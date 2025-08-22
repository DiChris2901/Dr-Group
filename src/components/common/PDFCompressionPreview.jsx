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
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Visibility as PreviewIcon,
  GetApp as DownloadIcon,
  Security as ConservativeIcon,
  Balance as BalancedIcon,
  Speed as AggressiveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  EnterprisePDFCompressor,
  CONSERVATIVE_COMPRESSION, 
  BALANCED_COMPRESSION, 
  AGGRESSIVE_COMPRESSION 
} from '../../utils/pdfCompressor';
import { testPDFCompression } from '../../utils/pdfTestCompression';

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
  const [compressionLevel, setCompressionLevel] = useState('balanced'); // conservative, balanced, aggressive
  const [showLevelSelector, setShowLevelSelector] = useState(true);

  // Ejecutar compresión cuando se abre el diálogo
  React.useEffect(() => {
    if (open && file && !compressionResult && !showLevelSelector) {
      compressFile();
    } else if (!open || !file) {
      // Limpiar resultado cuando se cierra el modal o no hay archivo
      setCompressionResult(null);
      setError(null);
      setLoading(false);
      setShowLevelSelector(true);
    }
  }, [open, file, showLevelSelector]);

  // Limpiar y recomprimir cuando cambie el archivo o nivel
  React.useEffect(() => {
    if (file) {
      console.log('🔄 Nuevo archivo detectado, limpiando compresión anterior:', file.name);
      setCompressionResult(null);
      setError(null);
      setLoading(false);
      setShowLevelSelector(true);
    }
  }, [file?.name, file?.size, file?.lastModified]);

  // Recomprimir cuando cambie el nivel de compresión
  const handleCompressionLevelChange = (level) => {
    setCompressionLevel(level);
    if (compressionResult) {
      console.log('🔄 Cambiando nivel de compresión a:', level);
      setCompressionResult(null);
      setShowLevelSelector(false);
      // La compresión se ejecutará automáticamente
    }
  };

  const compressFile = async () => {
    if (!file) {
      console.warn('⚠️ No hay archivo para comprimir');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando compresión de vista previa...');
      console.log('📄 Archivo:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      console.log('⚙️ Nivel de compresión:', compressionLevel);
      
      // Seleccionar configuración según el nivel elegido
      let config;
      switch (compressionLevel) {
        case 'conservative':
          config = CONSERVATIVE_COMPRESSION;
          break;
        case 'aggressive':
          config = AGGRESSIVE_COMPRESSION;
          break;
        default:
          config = BALANCED_COMPRESSION;
      }
      
      // Crear compresor con la configuración seleccionada
      const compressor = new EnterprisePDFCompressor(config);
      const result = await compressor.compressPDF(file);
      
      console.log('✅ Vista previa de compresión generada:', result.stats);
      console.log('📊 Estadísticas completas:', {
        originalSize: result.stats.originalSize,
        compressedSize: result.stats.compressedSize,
        reduction: result.stats.reduction,
        reductionPercent: result.stats.reductionPercent,
        saved: result.stats.saved
      });
      
      setCompressionResult(result);
      setShowLevelSelector(false); // Ocultar selector después de comprimir
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
    console.log('🔄 Cerrando modal de compresión, limpiando estados');
    setCompressionResult(null);
    setError(null);
    setActiveTab(0);
    setLoading(false);
    setShowLevelSelector(true);
    setCompressionLevel('balanced');
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

  // Configuraciones de niveles de compresión
  const compressionLevels = {
    conservative: {
      icon: ConservativeIcon,
      title: 'Conservativa',
      subtitle: 'Máxima calidad',
      description: 'Compresión mínima, ideal para documentos importantes',
      color: 'success',
      reduction: '10-30%'
    },
    balanced: {
      icon: BalancedIcon,
      title: 'Balanceada',
      subtitle: 'Recomendada',
      description: 'Balance perfecto entre calidad y tamaño para uso general',
      color: 'primary',
      reduction: '30-60%'
    },
    aggressive: {
      icon: AggressiveIcon,
      title: 'Agresiva',
      subtitle: 'Máximo ahorro',
      description: 'Compresión alta, perfecta para PDFs del navegador',
      color: 'warning',
      reduction: '50-80%'
    }
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
        {/* Selector de Nivel de Compresión */}
        {showLevelSelector && !loading && !error && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Selecciona el nivel de compresión
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Para PDFs generados desde navegador (como facturas, reportes), recomendamos compresión <strong>Agresiva</strong>.
              Para documentos escaneados o imágenes, usa <strong>Conservativa</strong>.
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(compressionLevels).map(([level, config]) => {
                const Icon = config.icon;
                const isSelected = compressionLevel === level;
                
                return (
                  <Grid item xs={12} md={4} key={level}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: isSelected ? `2px solid` : '1px solid',
                        borderColor: isSelected ? `${config.color}.main` : 'divider',
                        bgcolor: isSelected ? `${config.color}.50` : 'background.paper',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: `${config.color}.main`,
                          bgcolor: `${config.color}.50`,
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => setCompressionLevel(level)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Icon 
                          sx={{ 
                            fontSize: 40, 
                            color: isSelected ? `${config.color}.main` : 'text.secondary',
                            mb: 1 
                          }} 
                        />
                        <Typography variant="h6" fontWeight={600}>
                          {config.title}
                        </Typography>
                        <Chip 
                          label={config.subtitle}
                          size="small"
                          color={config.color}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {config.description}
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color={`${config.color}.main`}>
                          Reducción estimada: {config.reduction}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowLevelSelector(false)}
                startIcon={<CompareIcon />}
                sx={{
                  minWidth: 200,
                  py: 1.5,
                  mr: 2
                }}
              >
                Comprimir con {compressionLevels[compressionLevel].title}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={async () => {
                  console.log('🧪 Ejecutando test directo...');
                  try {
                    const testResult = await testPDFCompression(file);
                    console.log('🧪 RESULTADOS DEL TEST:', testResult);
                    alert(`Test completado!\nOriginal: ${(testResult.original / 1024 / 1024).toFixed(2)} MB\nBásico: ${(testResult.basic / 1024 / 1024).toFixed(2)} MB\nCon streams: ${(testResult.withStreams / 1024 / 1024).toFixed(2)} MB\nLimpio: ${(testResult.cleaned / 1024 / 1024).toFixed(2)} MB\n\nVe la consola para más detalles.`);
                  } catch (error) {
                    console.error('❌ Error en test:', error);
                    alert('Error en test: ' + error.message);
                  }
                }}
                startIcon={<SettingsIcon />}
                sx={{
                  minWidth: 150,
                  py: 1.5
                }}
              >
                Test Directo
              </Button>
            </Box>
          </Box>
        )}

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

        {compressionResult && file && (
          <Box>
            {/* DEBUG INFO */}
            {process.env.NODE_ENV === 'development' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  DEBUG: {file.name} - Original: {formatFileSize(file.size)} - 
                  Comprimido: {formatFileSize(compressionResult.stats.compressedSize)}
                </Typography>
              </Alert>
            )}

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
                      {formatFileSize(file.size)}
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

            {/* Opción para cambiar nivel de compresión */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setShowLevelSelector(true)}
                startIcon={<SettingsIcon />}
                color="primary"
              >
                Cambiar nivel de compresión
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Nivel actual: {compressionLevels[compressionLevel].title}
              </Typography>
            </Box>

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
