import React, { useState, useEffect } from 'react';
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
  InputLabel
} from '@mui/material';
import {
  Search,
  CloudUpload,
  Download,
  Delete,
  Visibility,
  FilterList,
  AttachFile
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const ReceiptsPage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Mock data - en producción vendrá de Firebase Storage
  const [receipts] = useState([
    {
      id: 1,
      name: 'Comprobante_Coca_Cola_Enero.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadDate: '2025-01-15',
      company: 'Coca-Cola',
      amount: '$25,000',
      status: 'active',
      url: '/files/receipts/coca_cola_enero.pdf'
    },
    {
      id: 2,
      name: 'Factura_Pepsi_Febrero.pdf',
      type: 'PDF', 
      size: '1.8 MB',
      uploadDate: '2025-02-10',
      company: 'Pepsi',
      amount: '$18,500',
      status: 'active',
      url: '/files/receipts/pepsi_febrero.pdf'
    },
    {
      id: 3,
      name: 'Recibo_Bimbo_Marzo.jpg',
      type: 'IMAGE',
      size: '945 KB',
      uploadDate: '2025-03-05',
      company: 'Bimbo',
      amount: '$12,300',
      status: 'active',
      url: '/files/receipts/bimbo_marzo.jpg'
    },
    {
      id: 4,
      name: 'Comprobante_Femsa_Abril.pdf',
      type: 'PDF',
      size: '3.1 MB',
      uploadDate: '2025-04-20',
      company: 'Femsa',
      amount: '$31,750',
      status: 'archived',
      url: '/files/receipts/femsa_abril.pdf'
    }
  ]);

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || receipt.type.toLowerCase() === filterType;
    return matchesSearch && matchesFilter;
  });

  const handlePreview = (receipt) => {
    setSelectedReceipt(receipt);
    setPreviewOpen(true);
  };

  const handleDownload = (receipt) => {
    // Simular descarga
    console.log(`Descargando: ${receipt.name}`);
  };

  const handleDelete = (receipt) => {
    if (window.confirm(`¿Estás seguro de eliminar ${receipt.name}?`)) {
      console.log(`Eliminando: ${receipt.name}`);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Activo' : 'Archivado';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            📄 Gestión de Comprobantes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra todos los comprobantes y documentos del sistema
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Comprobantes', value: receipts.length, color: '#667eea' },
          { label: 'Activos', value: receipts.filter(r => r.status === 'active').length, color: '#4caf50' },
          { label: 'Archivados', value: receipts.filter(r => r.status === 'archived').length, color: '#ff9800' },
          { label: 'Tamaño Total', value: '8.2 MB', color: '#f093fb' }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}30`,
                borderRadius: 4,
                backdropFilter: 'blur(20px)'
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
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
                sx={{ borderRadius: 4 }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Archivo</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Tipo de Archivo"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="image">Imágenes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  Subir Archivo
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card sx={{ 
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Archivo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Empresa</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tamaño</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.map((receipt, index) => (
                <motion.tr
                  key={receipt.id}
                  component={TableRow}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFile color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {receipt.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{receipt.company}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {receipt.amount}
                    </Typography>
                  </TableCell>
                  <TableCell>{receipt.size}</TableCell>
                  <TableCell>{receipt.uploadDate}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(receipt.status)}
                      color={getStatusColor(receipt.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Vista Previa">
                        <IconButton 
                          size="small" 
                          onClick={() => handlePreview(receipt)}
                          sx={{ color: '#667eea' }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Descargar">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownload(receipt)}
                          sx={{ color: '#4caf50' }}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(receipt)}
                          sx={{ color: '#f44336' }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Vista Previa: {selectedReceipt?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            height: 400, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: 2
          }}>
            <Typography color="text.secondary">
              Preview del archivo: {selectedReceipt?.name}
              <br />
              <small>Aquí se mostraría el contenido del archivo</small>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
          <Button 
            variant="contained" 
            onClick={() => handleDownload(selectedReceipt)}
            startIcon={<Download />}
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptsPage;
