import React, { useState } from 'react';
import {
  Box,
  Menu,
  Typography,
  Grid,
  LinearProgress,
  useTheme,
  alpha,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Storage,
  Description,
  Image,
  AttachFile,
  CloudUpload,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useStorageStats } from '../../hooks/useStorageStats';

const StorageMenu = ({ anchorEl, open, onClose }) => {
  const theme = useTheme();
  const storageStats = useStorageStats();
  
  const usagePercentage = storageStats.total > 0 ? (storageStats.used / storageStats.total) * 100 : 0;
  
  const getStorageStatus = () => {
    if (usagePercentage > 90) return { 
      status: 'critical', 
      color: '#f44336', 
      message: '¡Crítico!',
      icon: Warning,
      description: 'Espacio casi agotado'
    };
    if (usagePercentage > 75) return { 
      status: 'warning', 
      color: '#ff9800', 
      message: 'Alto uso',
      icon: Warning,
      description: 'Considere limpiar archivos'
    };
    if (usagePercentage > 50) return { 
      status: 'moderate', 
      color: '#2196f3', 
      message: 'Moderado',
      icon: Info,
      description: 'Uso normal del espacio'
    };
    return { 
      status: 'good', 
      color: '#4caf50', 
      message: 'Óptimo',
      icon: CheckCircle,
      description: 'Espacio disponible'
    };
  };

  const storageStatus = getStorageStatus();

  // Datos de tipos de archivos con mejores descripciones
  const fileTypes = [
    {
      id: 'documents',
      title: 'Documentos',
      count: storageStats.documents || 0,
      icon: Description,
      color: '#2196f3',
      description: 'PDFs, contratos, reportes',
      percentage: storageStats.documents ? ((storageStats.documents / (storageStats.documents + storageStats.images + storageStats.files)) * 100) : 0
    },
    {
      id: 'images',
      title: 'Imágenes',
      count: storageStats.images || 0,
      icon: Image,
      color: '#4caf50',
      description: 'Fotos, logos, capturas',
      percentage: storageStats.images ? ((storageStats.images / (storageStats.documents + storageStats.images + storageStats.files)) * 100) : 0
    },
    {
      id: 'files',
      title: 'Otros Archivos',
      count: storageStats.files || 0,
      icon: AttachFile,
      color: '#ff9800',
      description: 'Comprobantes, anexos',
      percentage: storageStats.files ? ((storageStats.files / (storageStats.documents + storageStats.images + storageStats.files)) * 100) : 0
    }
  ];

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          maxHeight: 550,
          bgcolor: 'background.paper',
          borderRadius: '12px',
          boxShadow: theme.shadows[8],
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: 'visible',
          mt: 1,
          '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1.5 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Storage sx={{ 
                color: storageStatus.color, 
                mr: 1, 
                fontSize: 20 
              }} />
              <Box>
                <Typography variant="h6" fontWeight="600" color="text.primary">
                  Almacenamiento
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {storageStats.used || 0} GB de {storageStats.total || 5} GB
                </Typography>
              </Box>
            </Box>
            
            {/* Indicador de estado */}
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                icon={<storageStatus.icon sx={{ fontSize: 16 }} />}
                label={storageStatus.message}
                size="small"
                sx={{
                  bgcolor: alpha(storageStatus.color, 0.1),
                  color: storageStatus.color,
                  border: `1px solid ${alpha(storageStatus.color, 0.2)}`,
                  fontWeight: 600
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                {storageStatus.description}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <Divider sx={{ mb: 2 }} />

        {/* Progreso de uso */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="600" color="text.primary">
                Espacio Utilizado
              </Typography>
              <Typography variant="h6" fontWeight="600" sx={{ color: storageStatus.color }}>
                {usagePercentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={usagePercentage} 
              sx={{
                height: 8,
                borderRadius: '4px',
                bgcolor: alpha(storageStatus.color, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: '4px',
                  bgcolor: storageStatus.color
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
              <Typography variant="caption" color="text.secondary">
                Usado: {storageStats.used || 0} GB
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Libre: {((storageStats.total || 5) - (storageStats.used || 0)).toFixed(1)} GB
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Distribución de archivos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 1.5 }}>
            Distribución de Archivos
          </Typography>
          <Grid container spacing={1.5}>
            {fileTypes.map((type, index) => (
              <Grid item xs={4} key={type.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.05) }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      background: alpha(type.color, 0.04),
                      border: `1px solid ${alpha(type.color, 0.1)}`,
                      textAlign: 'center',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: alpha(type.color, 0.08),
                        border: `1px solid ${alpha(type.color, 0.15)}`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <type.icon sx={{ 
                      color: type.color, 
                      fontSize: 18,
                      mb: 0.8
                    }} />
                    <Typography 
                      variant="h6" 
                      fontWeight="600" 
                      sx={{ 
                        color: type.color,
                        fontSize: '1.1rem',
                        mb: 0.3
                      }}
                    >
                      {type.count}
                    </Typography>
                    <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ 
                      display: 'block',
                      mb: 0.3,
                      fontSize: '0.7rem'
                    }}>
                      {type.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.65rem',
                        lineHeight: 1.2,
                        display: 'block'
                      }}
                    >
                      {type.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Resumen de capacidad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Box sx={{ 
            mt: 2.5,
            p: 2, 
            borderRadius: '8px',
            background: alpha(storageStatus.color, 0.08),
            border: `1px solid ${alpha(storageStatus.color, 0.12)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CloudUpload sx={{ color: storageStatus.color, mr: 1, fontSize: 18 }} />
                <Typography variant="body2" fontWeight="600" color="text.secondary">
                  Plan Actual
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="600" sx={{ color: storageStatus.color }}>
                Firebase Spark (Gratuito)
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
              Límite: {storageStats.total || 5} GB • Renovación automática mensual
            </Typography>
          </Box>
        </motion.div>

        {/* Loading indicator */}
        {storageStats.loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>
    </Menu>
  );
};

export default StorageMenu;
