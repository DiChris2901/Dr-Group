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
import { useSettings } from '../../context/SettingsContext';

// Estilos CSS para animaciones spectacular
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined' && !document.getElementById('storage-shimmer-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'storage-shimmer-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = shimmerStyles;
  document.head.appendChild(styleSheet);
}

const StorageMenu = ({ anchorEl, open, onClose }) => {
  const theme = useTheme();
  const { settings } = useSettings();
  const storageStats = useStorageStats();
  
  // Configuraciones dinámicas del Design System
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 12;
  const animationsEnabled = settings?.theme?.animations !== false;
  
  const usagePercentage = storageStats.total > 0 ? (storageStats.used / storageStats.total) * 100 : 0;
  
  const getStorageStatus = () => {
    if (usagePercentage > 90) return { 
      status: 'critical', 
      color: theme.palette.error.main, 
      message: '¡Crítico!',
      icon: Warning,
      description: 'Espacio casi agotado'
    };
    if (usagePercentage > 75) return { 
      status: 'warning', 
      color: theme.palette.warning.main, 
      message: 'Alto uso',
      icon: Warning,
      description: 'Considere limpiar archivos'
    };
    if (usagePercentage > 50) return { 
      status: 'moderate', 
      color: primaryColor, 
      message: 'Moderado',
      icon: Info,
      description: 'Uso normal del espacio'
    };
    return { 
      status: 'good', 
      color: theme.palette.success.main, 
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
          width: 440,
          maxHeight: 580,
          bgcolor: 'transparent',
          borderRadius: `${borderRadius}px`,
          boxShadow: `0 8px 32px ${alpha(primaryColor, 0.25)}`,
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          overflow: 'visible',
          mt: 1,
          background: theme.palette.mode === 'dark'
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          '&::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            borderBottom: 'none',
            borderRight: 'none'
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 0 }}>
        {/* Header spectacular con gradiente dinámico */}
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: -10 } : {}}
          animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
          transition={animationsEnabled ? { type: 'spring', stiffness: 300, damping: 30 } : {}}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: animationsEnabled ? 
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' : 
                'none',
              transform: 'translateX(-100%)',
              animation: animationsEnabled ? 'shimmer 3s infinite' : 'none'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <Storage sx={{ 
                color: 'white', 
                mr: 1, 
                fontSize: 22 
              }} />
              <Box>
                <Typography variant="h6" fontWeight="700" color="white">
                  Almacenamiento
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {storageStats.used || 0} GB de {storageStats.total || 5} GB
                </Typography>
              </Box>
            </Box>
            
            {/* Indicador de estado mejorado */}
            <Box sx={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
              <Chip
                icon={<storageStatus.icon sx={{ fontSize: 16, color: 'white' }} />}
                label={storageStatus.message}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Typography variant="caption" sx={{ 
                color: 'rgba(255,255,255,0.8)', 
                display: 'block', 
                mt: 0.3,
                fontSize: '0.7rem'
              }}>
                {storageStatus.description}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Contenido del menú */}
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />

          {/* Progreso de uso */}
          <motion.div
            initial={animationsEnabled ? { opacity: 0, y: 10 } : {}}
            animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
            transition={animationsEnabled ? { delay: 0.1 } : {}}
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
      </Box>
    </Menu>
  );
};

export default StorageMenu;
