import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  DeleteSweep as DeleteSweepIcon,
  Storage as StorageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useOrphanFileDetector } from '../hooks/useOrphanFileDetector';

const OrphanFilesPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  // Hook personalizado para detección de archivos huérfanos
  const {
    isScanning,
    scanProgress,
    storageFiles,
    firestoreRefs,
    orphanFiles,
    totalStorageSize,
    orphanStorageSize,
    scanResults,
    performFullScan,
    deleteOrphanFiles,
    getScanSummary,
    resetScan,
    hasOrphans,
    scanComplete
  } = useOrphanFileDetector();
  
  // Estados de UI
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar permisos de usuario
  const hasPermission = user?.email === 'daruedagu@gmail.com';

  // Función para manejar inicio de escaneo con notificaciones
  const handleFullScan = useCallback(async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Escaneo Iniciado',
        message: 'Analizando archivos huérfanos en Storage...',
        icon: 'info'
      });
      
      const results = await performFullScan();
      
      addNotification({
        type: results.orphanCount > 0 ? 'warning' : 'success',
        title: 'Escaneo Completado',
        message: `Encontrados ${results.orphanCount} archivos huérfanos (${(results.orphanStorageSize / 1024 / 1024).toFixed(2)} MB)`,
        icon: results.orphanCount > 0 ? 'warning' : 'success'
      });
      
    } catch (error) {
      console.error('❌ Error durante el escaneo:', error);
      addNotification({
        type: 'error',
        title: 'Error en Escaneo',
        message: 'Hubo un error al escanear los archivos',
        icon: 'error'
      });
    }
  }, [performFullScan, addNotification]);

  // Función para eliminar archivos seleccionados con UI feedback
  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    
    setIsDeleting(true);
    
    try {
      const filesToDelete = Array.from(selectedFiles);
      const results = await deleteOrphanFiles(filesToDelete, (progress) => {
        // Aquí podrías mostrar progreso de eliminación si quieres
      });
      
      setSelectedFiles(new Set());
      
      addNotification({
        type: 'success',
        title: 'Archivos Eliminados',
        message: `${results.success} archivos eliminados exitosamente${results.errors > 0 ? ` (${results.errors} errores)` : ''}`,
        icon: 'success'
      });
      
    } catch (error) {
      console.error('❌ Error eliminando archivos:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Hubo un error al eliminar algunos archivos',
        icon: 'error'
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Toggle selección de archivo
  const toggleFileSelection = (filePath) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedFiles(newSelection);
  };

  // Seleccionar todos los archivos
  const selectAllFiles = () => {
    if (selectedFiles.size === orphanFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(orphanFiles.map(f => f.path)));
    }
  };

  if (!hasPermission) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6">Acceso Denegado</Typography>
          <Typography>Esta página es solo accesible para administradores autorizados.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header sobrio simplificado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          sx={{
            background: theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            mb: 3
          }}
        >
          <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Typography variant="overline" sx={{
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              ADMINISTRACIÓN • ARCHIVOS
            </Typography>
            <Typography variant="h4" sx={{
              fontWeight: 700, 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1
            }}>
              🗂️ Archivos Huérfanos
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Detecta y gestiona archivos sin referencias en la base de datos
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Estadísticas con bordes dinámicos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <StorageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="primary" fontWeight={600}>
                {storageFiles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archivos en Storage
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(totalStorageSize)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.success.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="success.main" fontWeight={600}>
                {firestoreRefs.size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Referencias en DB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.warning.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="warning.main" fontWeight={600}>
                {orphanFiles.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archivos Huérfanos
              </Typography>
              <Typography variant="caption" color="warning.main">
                {formatFileSize(orphanStorageSize)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.error.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={selectedFiles.size} color="error">
                <DeleteSweepIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              </Badge>
              <Typography variant="h6" color="error.main" fontWeight={600}>
                {selectedFiles.size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Para Eliminar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
        borderRadius: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.8),
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleFullScan}
            disabled={isScanning}
            sx={{ minWidth: 200 }}
          >
            {isScanning ? 'Escaneando...' : 'Iniciar Escaneo'}
          </Button>
          
          {hasOrphans && (
            <>
              <Button
                variant="outlined"
                onClick={selectAllFiles}
                startIcon={<CheckCircleIcon />}
              >
                {selectedFiles.size === orphanFiles.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={selectedFiles.size === 0}
              >
                Eliminar Seleccionados ({selectedFiles.size})
              </Button>
            </>
          )}
          
          <Box sx={{ flex: 1 }} />
          
          {scanComplete && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`Escaneo Completado - ${orphanFiles.length} huérfanos`}
              color={hasOrphans ? 'warning' : 'success'}
              variant="outlined"
            />
          )}
        </Box>
        
        {/* Barra de progreso */}
        {isScanning && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={scanProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {scanProgress}% - {
                scanProgress < 50 ? 'Escaneando archivos en Storage...' :
                scanProgress < 80 ? 'Escaneando referencias en Firestore...' :
                'Identificando archivos huérfanos...'
              }
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Estadísticas Avanzadas */}
      {scanComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              Estadísticas del Escaneo
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="primary" fontWeight={700}>
                    {((1 - orphanFiles.length / storageFiles.length) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eficiencia de Storage
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {firestoreRefs.size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Referencias Activas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="warning.main" fontWeight={700}>
                    {(orphanStorageSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Espacio Recuperable
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {scanResults && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon />
                    Detalles Técnicos del Escaneo
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Duración:</strong> {(scanResults.scanDuration / 1000).toFixed(2)}s
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Archivos Procesados:</strong> {scanResults.totalFiles}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Referencias Encontradas:</strong> {scanResults.totalReferences}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Archivos por Carpeta:</strong>
                      </Typography>
                      {Object.entries(scanResults.filesByFolder || {}).map(([folder, count]) => (
                        <Chip 
                          key={folder}
                          label={`${folder}: ${count}`}
                          size="small"
                          sx={{ mr: 1, mb: 0.5 }}
                        />
                      ))}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}
          </Paper>
        </motion.div>
      )}

      {/* Lista de archivos huérfanos */}
      {hasOrphans && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ 
            p: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.warning.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              Archivos Huérfanos Detectados ({orphanFiles.length})
            </Typography>
            
            <List>
              {orphanFiles.map((file, index) => (
                <motion.div
                  key={file.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ListItem
                    sx={{
                      border: `1px solid ${selectedFiles.has(file.path) ? alpha(theme.palette.error.main, 0.8) : alpha(theme.palette.divider, 0.6)}`,
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: selectedFiles.has(file.path) ? alpha(theme.palette.error.main, 0.05) : 'transparent',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      '&:hover': {
                        borderColor: selectedFiles.has(file.path) ? alpha(theme.palette.error.main, 1) : alpha(theme.palette.primary.main, 0.6),
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">{file.name}</Typography>
                          <Chip 
                            label={file.folder} 
                            size="small" 
                            variant="outlined"
                            color="info"
                          />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                            📁 {file.path}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                            📊 {formatFileSize(file.size)} • 📅 {new Date(file.created).toLocaleDateString()}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Ver archivo">
                          <IconButton 
                            size="small"
                            onClick={() => window.open(file.downloadURL, '_blank')}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={selectedFiles.has(file.path) ? "Deseleccionar" : "Seleccionar para eliminar"}>
                          <IconButton
                            size="small"
                            color={selectedFiles.has(file.path) ? "error" : "default"}
                            onClick={() => toggleFileSelection(file.path)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Paper>
        </motion.div>
      )}

      {/* Mensaje cuando no hay archivos huérfanos */}
      {scanComplete && !hasOrphans && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.success.main, 0.8),
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }
          }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" color="success.main" fontWeight={600} sx={{ mb: 1 }}>
              ¡Storage Limpio!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No se encontraron archivos huérfanos. Todos los archivos están correctamente referenciados.
            </Typography>
          </Paper>
        </motion.div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar <strong>{selectedFiles.size}</strong> archivo(s) huérfano(s)?
          </Typography>
          <Typography variant="body2" color="warning.main">
            ⚠️ Esta acción no se puede deshacer. Los archivos serán eliminados permanentemente del Storage.
          </Typography>
          
          {selectedFiles.size > 0 && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'error.50', borderRadius: 1 }}>
              <Typography variant="caption" color="error.main">
                Archivos a eliminar: {
                  orphanFiles
                    .filter(f => selectedFiles.has(f.path))
                    .reduce((sum, f) => sum + f.size, 0) / 1024 / 1024
                }{" "}MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteSelected} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrphanFilesPage;
