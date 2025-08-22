// ⚙️ Panel de configuración para compresión PDF
// Permite a los usuarios personalizar el comportamiento

import React from 'react';
import {
  Box,
  Typography,
  Switch,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Compress as CompressIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Tune as TuneIcon
} from '@mui/icons-material';

const PDFCompressionSettings = ({ 
  settings = {}, 
  onChange,
  sx = {} 
}) => {
  const {
    enabled = true,
    quality = 0.85,
    minFileSize = 100 * 1024,
    maxReduction = 60,
    autoCompress = false
  } = settings;

  const handleChange = (key, value) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card elevation={2} sx={{ ...sx }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CompressIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Configuración de Compresión PDF
          </Typography>
        </Box>

        {/* Habilitar/Deshabilitar Compresión */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={500}>
              Compresión Automática
            </Typography>
            <Switch
              checked={enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              color="primary"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Optimiza automáticamente los PDFs para reducir su tamaño manteniendo la legibilidad
          </Typography>
        </Box>

        {enabled && (
          <>
            <Divider sx={{ my: 3 }} />

            {/* Calidad de Compresión */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Nivel de Calidad: {Math.round(quality * 100)}%
              </Typography>
              <Slider
                value={quality}
                onChange={(_, value) => handleChange('quality', value)}
                min={0.5}
                max={0.95}
                step={0.05}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                marks={[
                  { value: 0.5, label: 'Máxima compresión' },
                  { value: 0.75, label: 'Balanceada' },
                  { value: 0.95, label: 'Máxima calidad' }
                ]}
                sx={{ mt: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  icon={<SpeedIcon />} 
                  label="Rápido" 
                  size="small" 
                  variant={quality <= 0.6 ? "filled" : "outlined"}
                  color={quality <= 0.6 ? "warning" : "default"}
                />
                <Chip 
                  icon={<TuneIcon />} 
                  label="Balanceado" 
                  size="small" 
                  variant={quality > 0.6 && quality <= 0.85 ? "filled" : "outlined"}
                  color={quality > 0.6 && quality <= 0.85 ? "primary" : "default"}
                />
                <Chip 
                  icon={<SecurityIcon />} 
                  label="Conservador" 
                  size="small" 
                  variant={quality > 0.85 ? "filled" : "outlined"}
                  color={quality > 0.85 ? "success" : "default"}
                />
              </Box>
            </Box>

            {/* Tamaño Mínimo */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Tamaño Mínimo para Comprimir: {formatFileSize(minFileSize)}
              </Typography>
              <Slider
                value={minFileSize}
                onChange={(_, value) => handleChange('minFileSize', value)}
                min={50 * 1024}
                max={1024 * 1024}
                step={50 * 1024}
                valueLabelDisplay="auto"
                valueLabelFormat={formatFileSize}
                marks={[
                  { value: 50 * 1024, label: '50KB' },
                  { value: 100 * 1024, label: '100KB' },
                  { value: 500 * 1024, label: '500KB' },
                  { value: 1024 * 1024, label: '1MB' }
                ]}
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Solo se comprimirán archivos PDF mayores a este tamaño
              </Typography>
            </Box>

            {/* Reducción Máxima */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Reducción Máxima Permitida: {maxReduction}%
              </Typography>
              <Slider
                value={maxReduction}
                onChange={(_, value) => handleChange('maxReduction', value)}
                min={30}
                max={80}
                step={5}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                marks={[
                  { value: 30, label: '30%' },
                  { value: 50, label: '50%' },
                  { value: 70, label: '70%' },
                  { value: 80, label: '80%' }
                ]}
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Si la compresión excede este porcentaje, se usará el archivo original
              </Typography>
            </Box>

            {/* Modo Automático */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Compresión Automática (sin confirmación)
                </Typography>
                <Switch
                  checked={autoCompress}
                  onChange={(e) => handleChange('autoCompress', e.target.checked)}
                  color="primary"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Comprime automáticamente sin mostrar vista previa
              </Typography>
            </Box>

            {/* Información de Seguridad */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                🛡️ <strong>Garantía de Seguridad:</strong> La compresión nunca afecta el texto ni la estructura del PDF. 
                Si se detecta cualquier problema de legibilidad, se usa automáticamente el archivo original.
              </Typography>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFCompressionSettings;
