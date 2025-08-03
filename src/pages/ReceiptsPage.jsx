import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  AlertTitle,
  Stack,
  alpha
} from '@mui/material';
import {
  Search,
  CloudUpload,
  Download,
  Delete,
  Visibility,
  FilterList,
  AttachFile,
  Close,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Star,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

// ✨ NUEVO: Design System v2.2 imports
import {
  animationVariants,
  useThemeGradients,
  shimmerEffect
} from '../utils/designSystem.js';
import { useFirestore } from '../hooks/useFirestore.js';

// ✨ NUEVO: Styled components premium
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Box)(({ theme }) => ({
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' }
  },
  '@keyframes pulse': {
    '0%, 100%': { 
      boxShadow: `0 0 0 0 ${theme.palette.primary.main}40` 
    },
    '50%': { 
      boxShadow: `0 0 0 8px ${theme.palette.primary.main}00` 
    }
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-10px) rotate(180deg)' }
  }
}));

// ✨ NUEVO: MorphingCard para cards que cambian de forma
const MorphingCard = ({ 
  data, 
  state = 'normal', 
  onStateChange,
  children,
  delay = 0,
  ...props 
}) => {
  const theme = useTheme();
  
  const getStateStyles = (currentState) => {
    switch (currentState) {
      case 'critical':
        return {
          borderRadius: '20px 4px 20px 4px',
          transform: 'perspective(500px) rotateX(1deg) scale(1.02)',
          boxShadow: `0 15px 30px ${theme.palette.error.main}25`,
        };
      case 'success':
        return {
          borderRadius: '16px',
          transform: 'scale(1.01) translateY(-2px)',
          boxShadow: `0 8px 25px ${theme.palette.success.main}20`,
        };
      case 'expanded':
        return {
          borderRadius: '12px',
          transform: 'scale(1.03) translateY(-4px)',
          zIndex: 10
        };
      default:
        return {
          borderRadius: '16px',
          transform: 'scale(1)'
        };
    }
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        ...getStateStyles(state)
      }}
      transition={{ 
        duration: 0.6,
        delay,
        type: "spring", 
        damping: 20, 
        stiffness: 100
      }}
      whileHover={{ 
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      onClick={() => onStateChange?.(state === 'normal' ? 'expanded' : 'normal')}
    >
      <Card sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        ...shimmerEffect,
        border: `1px solid ${theme.palette.divider}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}30, transparent, ${theme.palette.secondary.main}30)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          opacity: state === 'expanded' ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }
      }}>
        {children}
      </Card>
    </motion.div>
  );
};

// ✨ NUEVO: PremiumDataTable optimizada
const PremiumDataTable = ({ 
  data, 
  columns, 
  loading = false, 
  onRowClick,
  ...props 
}) => {
  const theme = useTheme();
  const gradients = useThemeGradients();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          background: gradients.paper,
          position: 'relative',
          // ✨ NUEVO: Efecto cristal sutil
          backdropFilter: 'blur(8px)',
          ...shimmerEffect
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}06, ${theme.palette.secondary.main}03)`,
                position: 'relative',
                // ✨ NUEVO: Efecto de partículas en encabezado
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: `radial-gradient(circle at 25% 25%, ${theme.palette.primary.main}08 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, ${theme.palette.secondary.main}08 1px, transparent 1px)`,
                  backgroundSize: '40px 40px, 60px 60px',
                  opacity: 0.4,
                  pointerEvents: 'none'
                }
              }}>
                {columns.map((column, index) => (
                  <TableCell 
                    key={column.id}
                    sx={{ 
                      fontWeight: 700,
                      borderBottom: 'none',
                      py: 2.5,
                      position: 'relative',
                      zIndex: 2,
                      // ✨ NUEVO: Animación de entrada escalonada
                      animation: `slideInFromTop 0.5s ease-out ${index * 0.1}s both`,
                      '@keyframes slideInFromTop': {
                        '0%': { opacity: 0, transform: 'translateY(-10px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' }
                      }
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {data.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    component={TableRow}
                    onClick={() => onRowClick?.(row)}
                    // ✨ NUEVO: Efecto de resaltado mejorado
                    whileHover={{ 
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      scale: 1.001
                    }}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}15`
                      }
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={column.id} 
                        sx={{ 
                          borderBottom: `1px solid ${theme.palette.divider}`, 
                          py: 2
                        }}
                      >
                        {column.render ? column.render(row[column.id], row) : row[column.id]}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* ✨ NUEVO: Loading overlay premium */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <CircularProgress size={40} thickness={2} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </motion.div>
  );
};

const ReceiptsPage = () => {
  const theme = useTheme();
  const gradients = useThemeGradients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // ✨ NUEVO: Estados para las nuevas funcionalidades
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [cardStates, setCardStates] = useState({});

  // Conectar con Firebase para obtener archivos reales
  const { data: receipts, loading, error } = useFirestore('files', {
    orderBy: { field: 'uploadDate', direction: 'desc' }
  });

  const filteredReceipts = (receipts || []).filter(receipt => {
    const matchesSearch = receipt.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || receipt.type?.toLowerCase() === filterType;
    return matchesSearch && matchesFilter;
  });

  // ✨ NUEVO: Funciones mejoradas
  const handlePreview = (receipt) => {
    setSelectedReceipt(receipt);
    setPreviewOpen(true);
  };

  const handleDownload = async (receipt) => {
    setDownloadLoading(true);
    // Simular descarga con delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Descargando: ${receipt.name}`);
    setDownloadLoading(false);
  };

  const handleDelete = (receipt) => {
    if (window.confirm(`¿Estás seguro de eliminar ${receipt.name}?`)) {
      console.log(`Eliminando: ${receipt.name}`);
    }
  };

  const handleCardStateChange = (cardId, newState) => {
    setCardStates(prev => ({
      ...prev,
      [cardId]: newState
    }));
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Activo' : 'Archivado';
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <PictureAsPdf sx={{ color: '#f44336' }} />;
      case 'image': return <Image sx={{ color: '#4caf50' }} />;
      default: return <InsertDriveFile sx={{ color: '#757575' }} />;
    }
  };

  // ✨ NUEVO: Configuración de columnas para la tabla premium
  const tableColumns = [
    { 
      id: 'name', 
      label: 'Archivo', 
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {getFileIcon(row.type)}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.type} • {row.size}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      id: 'company', 
      label: 'Empresa',
      render: (value) => (
        <Chip 
          label={value} 
          size="small" 
          sx={{ 
            borderRadius: 2,
            fontWeight: 500,
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            color: theme.palette.info.main
          }} 
        />
      )
    },
    { 
      id: 'amount', 
      label: 'Monto',
      render: (value) => (
        <Typography sx={{ fontWeight: 700, color: theme.palette.success.main }}>
          {value}
        </Typography>
      )
    },
    { id: 'uploadDate', label: 'Fecha' },
    { 
      id: 'status', 
      label: 'Estado',
      render: (value) => (
        <Chip 
          label={getStatusLabel(value)}
          color={getStatusColor(value)}
          size="small"
          sx={{ borderRadius: 2, fontWeight: 500 }}
        />
      )
    },
    { 
      id: 'actions', 
      label: 'Acciones',
      render: (_, row) => (
        <Stack direction="row" spacing={0.5}>
          {[
            { icon: Visibility, tooltip: 'Vista Previa', color: theme.palette.info.main, action: () => handlePreview(row) },
            { icon: Download, tooltip: 'Descargar', color: theme.palette.success.main, action: () => handleDownload(row) },
            { icon: Delete, tooltip: 'Eliminar', color: theme.palette.error.main, action: () => handleDelete(row) }
          ].map((action, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <Tooltip title={action.tooltip}>
                <IconButton 
                  size="small" 
                  onClick={action.action}
                  sx={{ 
                    color: action.color,
                    backgroundColor: alpha(action.color, 0.1),
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: alpha(action.color, 0.2),
                      boxShadow: `0 4px 12px ${action.color}25`
                    }
                  }}
                >
                  <action.icon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </motion.div>
          ))}
        </Stack>
      )
    }
  ];

  return (
    <StyledContainer sx={{ p: 3 }}>
      {/* ✨ NUEVO: Header Premium con partículas */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: gradients.primary,
            borderRadius: 4,
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.primary.main}30`,
            ...shimmerEffect,
            // ✨ NUEVO: Efectos de partículas flotantes
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              background: `radial-gradient(circle, ${theme.palette.secondary.main}20 2px, transparent 2px)`,
              backgroundSize: '20px 20px',
              animation: 'float 8s ease-in-out infinite',
              zIndex: 1
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.info.main}25, ${theme.palette.success.main}15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <InsertDriveFile sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    color: 'white'
                  }}
                >
                  📄 Gestión de Comprobantes
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                  Sistema inteligente de administración de documentos
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* ✨ NUEVO: Stats Cards con MorphingCard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            id: 'total',
            label: 'Total Comprobantes', 
            value: receipts.length, 
            icon: InsertDriveFile,
            color: theme.palette.primary.main,
            state: receipts.length > 5 ? 'expanded' : 'normal'
          },
          { 
            id: 'active',
            label: 'Activos', 
            value: receipts.filter(r => r.status === 'active').length, 
            icon: CheckCircle,
            color: theme.palette.success.main,
            state: 'success'
          },
          { 
            id: 'archived',
            label: 'Archivados', 
            value: receipts.filter(r => r.status === 'archived').length, 
            icon: Star,
            color: theme.palette.warning.main,
            state: 'normal'
          },
          { 
            id: 'size',
            label: 'Tamaño Total', 
            value: '12.5 MB', 
            icon: TrendingUp,
            color: theme.palette.secondary.main,
            state: 'normal'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.id}>
            <MorphingCard
              state={cardStates[stat.id] || stat.state}
              onStateChange={(newState) => handleCardStateChange(stat.id, newState)}
              delay={index * 0.1}
            >
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <stat.icon sx={{ fontSize: 24, color: stat.color }} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </MorphingCard>
          </Grid>
        ))}
      </Grid>

      {/* ✨ NUEVO: Filtros mejorados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper sx={{ 
          mb: 3, 
          borderRadius: 4,
          background: gradients.paper,
          border: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
          ...shimmerEffect
        }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Buscar comprobantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    borderRadius: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover': {
                        boxShadow: `0 4px 12px ${theme.palette.primary.main}15`
                      }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Archivo</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Tipo de Archivo"
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="image">Imágenes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<CloudUpload />}
                      disabled={loading}
                      sx={{
                        background: gradients.primary,
                        borderRadius: 3,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        boxShadow: `0 4px 15px ${theme.palette.primary.main}30`,
                        '&:hover': {
                          boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          opacity: 0.7
                        }
                      }}
                    >
                      {loading ? 'Procesando...' : 'Subir Archivo'}
                    </Button>
                  </motion.div>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>
      </motion.div>

      {/* ✨ NUEVO: Tabla Premium */}
      <PremiumDataTable
        data={filteredReceipts}
        columns={tableColumns}
        loading={loading}
        onRowClick={(row) => console.log('Row clicked:', row)}
      />

      {/* ✨ NUEVO: Empty State mejorado */}
      {filteredReceipts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              background: gradients.paper,
              mt: 4
            }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <InsertDriveFile sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            </motion.div>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              No se encontraron comprobantes
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Intenta ajustar los filtros o sube tu primer archivo
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              sx={{ borderRadius: 3 }}
            >
              Subir Primer Archivo
            </Button>
          </Paper>
        </motion.div>
      )}

      {/* ✨ NUEVO: Preview Dialog mejorado */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: gradients.paper,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.divider}`,
            ...shimmerEffect
          }
        }}
      >
        <DialogTitle sx={{
          background: gradients.primary,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedReceipt && getFileIcon(selectedReceipt.type)}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Vista Previa: {selectedReceipt?.name}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setPreviewOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.grey[100]}, ${theme.palette.grey[50]})`,
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ textAlign: 'center', zIndex: 2 }}>
                {selectedReceipt && getFileIcon(selectedReceipt.type)}
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  {selectedReceipt?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedReceipt?.company} • {selectedReceipt?.size}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Vista previa del archivo se mostraría aquí
                </Typography>
              </Box>
              
              {/* Efecto de fondo */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at 30% 30%, ${theme.palette.primary.main}05 20%, transparent 60%)`,
                  zIndex: 1
                }}
              />
            </Box>
          </motion.div>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setPreviewOpen(false)}
            sx={{ borderRadius: 3 }}
          >
            Cerrar
          </Button>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="contained" 
              onClick={() => handleDownload(selectedReceipt)}
              startIcon={<Download />}
              disabled={loading}
              sx={{
                background: gradients.primary,
                borderRadius: 3,
                px: 3
              }}
            >
              {loading ? 'Descargando...' : 'Descargar'}
            </Button>
          </motion.div>
        </DialogActions>
      </Dialog>
    </StyledContainer>
  );
};

export default ReceiptsPage;
