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
  Divider,
  useTheme
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
import { useSettings } from '../../context/SettingsContext';

const PDFCompressionPreview = ({ 
  open, 
  onClose, 
  file, 
  onAccept, 
  onReject 
}) => {
  const theme = useTheme();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [compressionResult, setCompressionResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('balanced'); // conservative, balanced, aggressive
  const [showLevelSelector, setShowLevelSelector] = useState(true);

  // 🎨 Configuraciones de tema sobrio (como NewCommitmentPage)
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const compactMode = settings?.sidebar?.compactMode || false;

  // Función para obtener gradiente sobrio
  const getGradientBackground = () => {
    return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  };

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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: compactMode ? '60vh' : '70vh',
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: getGradientBackground(),
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: compactMode ? 2.5 : 3,
        px: 3,
        fontSize: compactMode ? '1.1rem' : '1.25rem',
        fontWeight: 600,
        borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
        minHeight: compactMode ? '60px' : '70px'
      }}>
        <CompareIcon sx={{ fontSize: compactMode ? '1.5rem' : '2rem' }} />
        <Box>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 600, 
            mb: 0.5,
            fontSize: compactMode ? '1.1rem' : '1.25rem'
          }}>
            Vista Previa de Compresión PDF
          </Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.9, 
            fontSize: compactMode ? '0.8rem' : '0.9rem'
          }}>
            Optimiza tu documento manteniendo la calidad
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4, background: 'transparent' }}>
        {/* Selector de Nivel de Compresión */}
        {showLevelSelector && !loading && !error && (
          <Box sx={{ mb: 4 }}>
            {/* Header Section */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 6, // Aumentado de 4 a 6 para más separación
              mt: 3, // Agregado margen superior
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${borderRadius}px`
            }}>
              <CompareIcon sx={{ 
                mr: 2, 
                color: 'primary.main', 
                fontSize: compactMode ? '1.5rem' : '2rem',
                p: 1,
                borderRadius: `${borderRadius / 2}px`,
                backgroundColor: `primary.50`
              }} />
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary', 
                  mb: 1,
                  fontSize: compactMode ? '1.1rem' : '1.25rem'
                }}>
                  Selecciona el nivel de compresión
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontSize: compactMode ? '0.85rem' : '0.95rem',
                  lineHeight: 1.5
                }}>
                  Para PDFs generados desde navegador (como facturas, reportes), recomendamos compresión{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: 'warning.main' }}>Agresiva</Box>.
                  Para documentos escaneados o imágenes, usa{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: 'success.main' }}>Conservativa</Box>.
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {Object.entries(compressionLevels).map(([level, config]) => {
                const Icon = config.icon;
                const isSelected = compressionLevel === level;
                
                return (
                  <Grid item xs={12} md={4} key={level}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        border: isSelected ? `2px solid` : '1px solid',
                        borderColor: isSelected ? `${config.color}.main` : 'divider',
                        backgroundColor: isSelected 
                          ? `${config.color}.50`
                          : theme.palette.background.paper,
                        borderRadius: `${borderRadius}px`,
                        transition: 'all 0.3s ease',
                        transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: isSelected 
                          ? '0 8px 20px rgba(0, 0, 0, 0.15)'
                          : '0 2px 8px rgba(0, 0, 0, 0.08)',
                        '&:hover': {
                          borderColor: `${config.color}.main`,
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                        }
                      }}
                      onClick={() => setCompressionLevel(level)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: compactMode ? 3 : 4, px: 3 }}>
                        <Box sx={{ 
                          width: compactMode ? 60 : 70, 
                          height: compactMode ? 60 : 70, 
                          mx: 'auto', 
                          mb: 2,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected 
                            ? `${config.color}.100`
                            : `${config.color}.50`,
                          border: isSelected 
                            ? `2px solid ${config.color}.300`
                            : `2px solid ${config.color}.200`,
                        }}>
                          <Icon 
                            sx={{ 
                              fontSize: compactMode ? '2rem' : '2.5rem', 
                              color: `${config.color}.main`
                            }} 
                          />
                        </Box>
                        
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          mb: 1, 
                          color: 'text.primary',
                          fontSize: compactMode ? '1rem' : '1.1rem'
                        }}>
                          {config.title}
                        </Typography>
                        
                        <Chip 
                          label={config.subtitle}
                          size="small"
                          sx={{
                            mb: 2,
                            fontWeight: 500,
                            backgroundColor: isSelected ? `${config.color}.200` : `${config.color}.100`,
                            color: `${config.color}.800`,
                            border: 'none'
                          }}
                        />
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            lineHeight: 1.5,
                            fontSize: compactMode ? '0.8rem' : '0.9rem',
                            mb: 2
                          }}
                        >
                          {config.description}
                        </Typography>
                        
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 1.5,
                          background: isSelected 
                            ? `linear-gradient(135deg, ${config.color}.50 0%, ${config.color}.100 100%)`
                            : `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
                          border: `1px solid ${isSelected ? `${config.color}.200` : '#e2e8f0'}`
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: isSelected ? `${config.color}.700` : 'text.secondary',
                              fontSize: '0.85rem'
                            }}
                          >
                            Reducción estimada: {config.reduction}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowLevelSelector(false)}
                startIcon={<CompareIcon />}
                sx={{
                  minWidth: 280,
                  py: 2,
                  px: 4,
                  borderRadius: `${borderRadius}px`,
                  fontSize: compactMode ? '1rem' : '1.1rem',
                  fontWeight: 600,
                  background: getGradientBackground(),
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    background: getGradientBackground(),
                    opacity: 0.9,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Comprimir con {compressionLevels[compressionLevel].title}
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
          <Box sx={{ mt: 4 }}> {/* Agregado margen superior para separar del header */}
            {/* Resumen de Compresión */}
            <Paper elevation={2} sx={{ 
              p: 4, // Aumentado de 3 a 4 
              mb: 4, // Aumentado de 3 a 4
              background: 'rgba(255,255,255,0.9)',
              borderRadius: `${borderRadius}px`
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3, // Aumentado de 2 a 3
                pb: 2, // Agregado padding bottom
                borderBottom: `1px solid ${theme.palette.divider}` // Agregada línea separadora
              }}>
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

              <Grid container spacing={4}> {/* Aumentado de 3 a 4 */}
                {/* Archivo Original */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ 
                    p: 3, // Aumentado de 2 a 3
                    background: '#f8f9fa',
                    borderRadius: `${borderRadius}px`,
                    height: '100%' // Para igualar alturas
                  }}>
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
                  <Paper variant="outlined" sx={{ 
                    p: 3, // Aumentado de 2 a 3
                    background: '#f0f8f0',
                    borderRadius: `${borderRadius}px`,
                    height: '100%' // Para igualar alturas
                  }}>
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
                <Grid item xs={12} sx={{ mt: 2 }}> {/* Agregado margen superior */}
                  <Alert 
                    severity={compressionResult.stats.legible ? "success" : "warning"} 
                    sx={{ 
                      background: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: `${borderRadius}px`,
                      p: 2.5 // Agregado padding interno
                    }}
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

      <DialogActions sx={{ 
        p: 4, 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        gap: 2,
        justifyContent: 'center'
      }}>
        <Button 
          onClick={handleReject} 
          variant="outlined"
          disabled={loading}
          size="large"
          sx={{
            minWidth: 180,
            py: 1.5,
            px: 3,
            borderRadius: `${borderRadius}px`,
            borderWidth: 1,
            fontWeight: 600,
            textTransform: 'none',
            borderColor: 'grey.300',
            color: 'text.secondary',
            '&:hover': {
              borderWidth: 2,
              borderColor: 'grey.400',
              backgroundColor: 'grey.50'
            }
          }}
        >
          Mantener Original
        </Button>
        
        {compressionResult?.preview && (
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => window.open(compressionResult.preview, '_blank')}
            size="large"
            sx={{
              minWidth: 160,
              py: 1.5,
              px: 3,
              borderRadius: `${borderRadius}px`,
              borderWidth: 1,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'info.main',
              color: 'info.main',
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'info.50'
              }
            }}
          >
            Vista Previa
          </Button>
        )}
        
        <Button 
          onClick={handleAccept}
          variant="contained"
          disabled={loading || !compressionResult}
          size="large"
          sx={{
            minWidth: 180,
            py: 1.5,
            px: 3,
            borderRadius: `${borderRadius}px`,
            fontSize: compactMode ? '0.9rem' : '1rem',
            fontWeight: 600,
            textTransform: 'none',
            background: getGradientBackground(),
            color: 'white',
            '&:hover': {
              background: getGradientBackground(),
              opacity: 0.9,
              transform: 'translateY(-2px)'
            },
            '&:disabled': {
              background: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            },
            transition: 'all 0.2s ease'
          }}
        >
          {compressionResult?.stats.reduction > 0 ? 'Usar Comprimido' : 'Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFCompressionPreview;
