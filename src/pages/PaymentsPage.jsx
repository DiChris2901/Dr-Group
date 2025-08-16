import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  InputBase,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  TextField,
  alpha,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  MoreVert as MoreVertIcon,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Hook para cargar pagos desde Firebase
import { usePayments } from '../hooks/useFirestore';
// Firebase para manejo de archivos y Firestore
import { doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
// Componente temporal para agregar datos de prueba
import AddSamplePayments from '../components/debug/AddSamplePayments';
// Componente para visor de comprobantes de pago
import PaymentReceiptViewer from '../components/commitments/PaymentReceiptViewer';

const PaymentsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estados para el visor de comprobantes
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Estados para edición de archivos
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar pagos reales desde Firebase
  const { payments: firebasePayments, loading, error } = usePayments({ status: statusFilter !== 'all' ? statusFilter : undefined });

  // Usar solo datos reales de Firebase
  const payments = firebasePayments;

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'completado':
        return 'success';
      case 'pending':
      case 'pendiente':
        return 'warning';
      case 'failed':
      case 'fallido':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'completado':
        return <CheckIcon fontSize="small" />;
      case 'pending':
      case 'pendiente':
        return <PendingIcon fontSize="small" />;
      case 'failed':
      case 'fallido':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallido';
      case 'completado':
      case 'pendiente':
      case 'fallido':
        return status; // Ya están en español
      default:
        return status || 'Desconocido';
    }
  };

  // Filtrar pagos por término de búsqueda
  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.companyName?.toLowerCase().includes(searchLower) ||
      payment.concept?.toLowerCase().includes(searchLower) ||
      payment.reference?.toLowerCase().includes(searchLower) ||
      payment.method?.toLowerCase().includes(searchLower)
    );
  });

  // Calcular estadísticas de pagos
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments
    .filter(p => p.status?.toLowerCase() === 'completado' || p.status?.toLowerCase() === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status?.toLowerCase() === 'pendiente' || p.status?.toLowerCase() === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Acentos desde DS (gradients via theme variants y tokenUtils)

  const fadeUp = { initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{duration:.45,ease:'easeOut'} };

  // Paginación (máx 10 registros por página)
  const [page, setPage] = useState(0);
  const [jumpToPage, setJumpToPage] = useState('');
  const rowsPerPage = 10; // fijo según requerimiento

  useEffect(()=>{
    const maxPage = Math.max(0, Math.ceil(filteredPayments.length / rowsPerPage) - 1);
    if(page > maxPage) setPage(0);
  }, [filteredPayments.length, page]);

  const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Funciones de navegación de paginación
  const handlePageChange = (newPage) => {
    setPage(newPage - 1); // Pagination component usa base 1, nosotros base 0
  };

  const handleFirstPage = () => setPage(0);
  const handlePrevPage = () => setPage(Math.max(0, page - 1));
  const handleNextPage = () => setPage(Math.min(Math.ceil(filteredPayments.length / rowsPerPage) - 1, page + 1));
  const handleLastPage = () => setPage(Math.ceil(filteredPayments.length / rowsPerPage) - 1);

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    const maxPage = Math.ceil(filteredPayments.length / rowsPerPage);
    if (pageNum >= 1 && pageNum <= maxPage) {
      setPage(pageNum - 1);
      setJumpToPage('');
    }
  };

  const handleJumpToPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // Funciones para el visor de comprobantes
  const handleViewReceipt = (payment) => {
    console.log('📄 Abriendo visor para pago:', payment);
    setSelectedPayment(payment);
    setReceiptViewerOpen(true);
  };

  const handleCloseReceiptViewer = () => {
    setReceiptViewerOpen(false);
    setSelectedPayment(null);
  };

  // Función para mostrar notificaciones
  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Función para eliminar comprobante
  const handleDeleteReceipt = async (payment) => {
    // Confirmar eliminación
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comprobante? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setUploadingFile(true);
      console.log('🗑️ Iniciando eliminación de comprobante para pago:', payment.id);
      
      // Verificar que el pago tenga comprobantes - usar attachments como campo principal
      const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
      console.log('📄 URLs a eliminar:', receiptUrls);
      console.log('📄 Estructura completa del pago:', {
        attachments: payment.attachments,
        receiptUrls: payment.receiptUrls,
        receiptUrl: payment.receiptUrl,
        files: payment.files
      });
      
      if (receiptUrls.length === 0) {
        showNotification('No hay comprobantes para eliminar', 'warning');
        return;
      }
      
      // Eliminar archivos de Storage
      for (const url of receiptUrls) {
        if (url) {
          try {
            // Extraer el path del archivo desde la URL
            const filePathMatch = url.match(/o\/(.+?)\?/);
            if (filePathMatch) {
              const filePath = decodeURIComponent(filePathMatch[1]);
              console.log('🔥 Eliminando archivo:', filePath);
              const fileRef = ref(storage, filePath);
              await deleteObject(fileRef);
              console.log('✅ Archivo eliminado de Storage');
            }
          } catch (storageError) {
            console.warn('⚠️ Error al eliminar archivo de Storage:', storageError);
          }
        }
      }

      // Actualizar documento en Firestore removiendo las URLs
      const paymentRef = doc(db, 'payments', payment.id);
      await updateDoc(paymentRef, {
        attachments: [], // Campo principal donde se guardan los comprobantes
        receiptUrls: [],
        receiptUrl: null,
        files: [],
        updatedAt: new Date()
      });

      console.log('✅ Comprobante eliminado exitosamente de Firestore');
      
      // Cerrar el visor de PDF si está abierto para este pago
      if (selectedPayment?.id === payment.id) {
        handleCloseReceiptViewer();
      }
      
      showNotification('Comprobante eliminado exitosamente', 'success');
    } catch (error) {
      console.error('❌ Error al eliminar comprobante:', error);
      showNotification(`Error al eliminar comprobante: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Función para editar comprobante (reemplazar)
  const handleEditReceipt = (payment) => {
    console.log('✏️ Editando comprobante para pago:', payment.id);
    setEditingReceipt(payment);
    
    // Crear input de archivo temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        setEditingReceipt(null);
        return;
      }

      try {
        setUploadingFile(true);
        console.log('📤 Subiendo nuevos archivos:', files.map(f => f.name));

        // 1. Eliminar archivos antiguos del Storage
        const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
        console.log('🗑️ Eliminando archivos antiguos:', receiptUrls);
        
        for (const url of receiptUrls) {
          if (url) {
            try {
              const filePathMatch = url.match(/o\/(.+?)\?/);
              if (filePathMatch) {
                const filePath = decodeURIComponent(filePathMatch[1]);
                const fileRef = ref(storage, filePath);
                await deleteObject(fileRef);
                console.log('✅ Archivo antiguo eliminado:', filePath);
              }
            } catch (deleteError) {
              console.warn('⚠️ Error al eliminar archivo antiguo:', deleteError);
            }
          }
        }

        // 2. Subir nuevos archivos
        const newReceiptUrls = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileName = `receipts/${payment.id}_${i + 1}_${Date.now()}_${file.name}`;
          const storageRef = ref(storage, fileName);
          
          console.log('⬆️ Subiendo archivo:', fileName);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          newReceiptUrls.push(downloadURL);
          console.log('✅ Archivo subido:', downloadURL);
        }

        // 3. Actualizar documento en Firestore
        const paymentRef = doc(db, 'payments', payment.id);
        await updateDoc(paymentRef, {
          attachments: newReceiptUrls, // Campo principal
          receiptUrls: newReceiptUrls,
          receiptUrl: newReceiptUrls[0] || null, // Para compatibilidad
          updatedAt: new Date()
        });

        console.log('✅ Comprobante editado exitosamente');
        showNotification('Comprobante editado exitosamente', 'success');
      } catch (error) {
        console.error('❌ Error al editar comprobante:', error);
        showNotification(`Error al editar comprobante: ${error.message}`, 'error');
      } finally {
        setUploadingFile(false);
        setEditingReceipt(null);
      }
    };

    input.click();
  };

  return (
    <Box sx={{ p: 2, pb: 4, display:'flex', flexDirection:'column', gap: 2 }}>
      {/* Mostrar indicador de carga */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            Cargando pagos...
          </Typography>
        </Box>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar los pagos: {error}
        </Alert>
      )}

      {/* Mostrar indicador de carga para operaciones de archivos */}
      {uploadingFile && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            {editingReceipt ? 'Editando comprobante...' : 'Eliminando comprobante...'}
          </Box>
        </Alert>
      )}

      {/* Contenido principal - solo se muestra si no hay loading ni error */}
      {!loading && !error && (
        <>
          {/* HEADER COMPACTO */}
          <motion.div {...fadeUp}>
            <Paper sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: 'background.paper' }}>
              <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, justifyContent:'space-between', alignItems:{ md:'center' }, gap: 1.5 }}>
                <Box sx={{ flex:1 }}>
                  <Typography variant="overline" sx={{ fontWeight:600, fontSize: '0.7rem', color:'text.secondary' }}>FINANZAS • PAGOS</Typography>
                  <Typography variant="h6" sx={{ fontWeight:700, mt: 0.5, mb: 0.5 }}>Gestión de Pagos</Typography>
                  <Typography variant="caption" sx={{ color:'text.secondary' }}>Administra pagos y transacciones corporativas</Typography>
                </Box>
                <Box sx={{ display:'flex', flexWrap:'wrap', gap: 0.8, alignItems:'center' }}>
                  <Chip 
                    size="small" 
                    label={`Total $${totalAmount.toLocaleString()}`} 
                    sx={{ 
                      fontWeight: 600, 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`Comp $${completedAmount.toLocaleString()}`} 
                    color="success" 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`Pend $${pendingAmount.toLocaleString()}`} 
                    color="warning" 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Chip 
                    size="small" 
                    label={`${filteredPayments.length} pagos`} 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 0.5,
                      fontSize: '0.7rem',
                      height: 24
                    }} 
                  />
                  <Button 
                    size="small" 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={()=>navigate('/payments/new')} 
                    sx={{ 
                      textTransform:'none', 
                      fontWeight: 600, 
                      borderRadius: 0.5,
                      fontSize: '0.75rem',
                      height: 28,
                      px: 1.5
                    }}
                  >
                    Nuevo
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>          {/* KPIs COMPACTOS */}
          <Grid container spacing={1.5}>
            {[{
              label:'Total Procesado', value:`$${totalAmount.toLocaleString()}`, icon:<MoneyIcon />, color: theme.palette.primary.main
            },{
              label:'Completados', value:`$${completedAmount.toLocaleString()}`, icon:<CheckIcon />, color: theme.palette.success.main
            },{
              label:'Pendientes', value:`$${pendingAmount.toLocaleString()}`, icon:<PendingIcon />, color: theme.palette.warning.main
            },{
              label:'Total Pagos', value:filteredPayments.length, icon:<ReceiptIcon />, color: theme.palette.info.main
            }].map(card => (
              <Grid item xs={12} sm={6} md={3} key={card.label}>
                <Card sx={{ 
                  borderRadius: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  '&:hover': { 
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s'
                  }
                }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: `${card.color}15`, 
                        color: card.color,
                        '& .MuiSvgIcon-root': { fontSize: 18 }
                      }}>
                        {card.icon}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.9rem',
                          lineHeight: 1.2
                        }}>
                          {card.value}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary', 
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}>
                          {card.label}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* FILTROS COMPACTOS */}
          <motion.div {...fadeUp}>
            <Paper sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              display:'flex', 
              flexWrap:'wrap', 
              gap: 1.5, 
              alignItems:'center', 
              border: '1px solid', 
              borderColor: 'divider' 
            }}>
              <Box sx={{ 
                flex:1, 
                minWidth: 240, 
                display:'flex', 
                alignItems:'center', 
                gap: 1, 
                px: 1.5, 
                py: 0.5, 
                borderRadius: 0.5, 
                border:'1px solid', 
                borderColor: 'divider', 
                backgroundColor: 'background.default' 
              }}>
                <SearchIcon fontSize="small" sx={{ color:'text.secondary', fontSize: 18 }} />
                <InputBase 
                  placeholder="Buscar pagos..." 
                  value={searchTerm} 
                  onChange={e=>setSearchTerm(e.target.value)} 
                  sx={{ 
                    flex:1, 
                    fontSize: '0.8rem',
                    '& input::placeholder': {
                      fontSize: '0.8rem'
                    }
                  }} 
                />
              </Box>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.8rem' }}>Estado</InputLabel>
                <Select 
                  value={statusFilter} 
                  onChange={e=>setStatusFilter(e.target.value)} 
                  label="Estado" 
                  sx={{ 
                    borderRadius: 0.5,
                    fontSize: '0.8rem',
                    height: 36
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>Todos</MenuItem>
                  <MenuItem value="completed" sx={{ fontSize: '0.8rem' }}>Completados</MenuItem>
                  <MenuItem value="pending" sx={{ fontSize: '0.8rem' }}>Pendientes</MenuItem>
                  <MenuItem value="failed" sx={{ fontSize: '0.8rem' }}>Fallidos</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={()=>navigate('/payments/new')} 
                sx={{ 
                  borderRadius: 0.5, 
                  fontWeight: 600,
                  textTransform:'none', 
                  px: 2,
                  fontSize: '0.8rem',
                  height: 36
                }}
              >
                Nuevo Pago
              </Button>
            </Paper>
          </motion.div>

          {/* TABLA ESTILO COMMITMENTS LIST */}
          <motion.div {...fadeUp}>
            <Paper sx={{ 
              borderRadius: 1, 
              overflow:'hidden', 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Header de la tabla */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr',
                gap: 2,
                p: 2,
                bgcolor: alpha(theme.palette.grey[50], 0.8),
                borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                {[
                  'ESTADO',
                  'CONCEPTO', 
                  'EMPRESA',
                  'MONTO',
                  'MÉTODO',
                  'FECHA',
                  'REFERENCIA',
                  'ACCIONES'
                ].map((column) => (
                  <Box 
                    key={column}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: column === 'MONTO' || column === 'ACCIONES' ? 'center' : 'flex-start'
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        color: 'text.primary'
                      }}
                    >
                      {column}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Filas de datos */}
              <Box>
                {paginatedPayments.length > 0 ? paginatedPayments.map((payment, index) => (
                  <Box key={payment.id} sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1.5fr 1.2fr 1fr 1fr 1fr 0.8fr',
                    gap: 2,
                    p: 2.5,
                    borderBottom: index === paginatedPayments.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.04)}`,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    },
                    alignItems: 'center'
                  }}>
                    {/* Estado */}
                    <Box>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={getStatusText(payment.status)}
                        color={getStatusColor(payment.status)}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          borderRadius: 0.5,
                          '& .MuiChip-icon': { fontSize: 14 }
                        }}
                      />
                    </Box>

                    {/* Concepto */}
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          mb: 0.5,
                          color: 'text.primary',
                          fontSize: '0.9rem'
                        }}
                      >
                        {payment.concept || 'Sin concepto'}
                      </Typography>
                      {payment.reference && (
                        <Typography 
                          variant="caption" 
                          sx={{
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                          }}
                        >
                          Ref: {payment.reference}
                        </Typography>
                      )}
                    </Box>

                    {/* Empresa */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                      >
                        {(payment.companyName || 'SC').charAt(0)}
                      </Avatar>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary'
                        }}
                      >
                        {payment.companyName || 'Sin empresa'}
                      </Typography>
                    </Box>

                    {/* Monto */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        color: 'success.main',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}>
                        ${payment.amount?.toLocaleString('es-MX')}
                      </Typography>
                    </Box>

                    {/* Método */}
                    <Box>
                      <Chip 
                        label={payment.method} 
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 500,
                          borderRadius: 0.5,
                          borderColor: alpha(theme.palette.divider, 0.3),
                          '& .MuiChip-label': { px: 0.5 }
                        }} 
                      />
                    </Box>

                    {/* Fecha */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {payment.date ? new Date(payment.date.seconds * 1000).toLocaleDateString('es-MX') : '-'}
                      </Typography>
                    </Box>

                    {/* Referencia */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ 
                        fontFamily: 'monospace', 
                        color: 'text.secondary',
                        fontSize: '0.7rem'
                      }}>
                        {payment.reference || '-'}
                      </Typography>
                    </Box>

                    {/* Acciones */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 0.5,
                      justifyContent: 'center'
                    }}>
                      <Tooltip title="Ver comprobantes" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleViewReceipt(payment)}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Solo mostrar botones de editar/eliminar si hay comprobante */}
                      {(payment.attachments?.length > 0) && (
                        <>
                          <Tooltip title="Editar comprobante" arrow>
                        <IconButton
                          size="small"
                          onClick={() => {
                            console.log('🔍 Datos del pago para edición:', payment);
                            handleEditReceipt(payment);
                          }}
                          disabled={uploadingFile}
                          sx={{ 
                            color: 'warning.main',
                            '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.1) }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Eliminar comprobante" arrow>
                        <IconButton
                          size="small"
                          onClick={() => {
                            alert('🔍 BOTÓN CLICKEADO - Revisa la consola');
                            console.log('🔍 DATOS COMPLETOS DEL PAGO:', JSON.stringify(payment, null, 2));
                            console.log('🔍 payment.receiptUrls:', payment.receiptUrls);
                            console.log('🔍 payment.receiptUrl:', payment.receiptUrl);
                            console.log('🔍 payment.attachments:', payment.attachments);
                            handleDeleteReceipt(payment);
                          }}
                          disabled={uploadingFile}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                )) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      No hay pagos registrados
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Crea el primer registro con el botón "Nuevo Pago"
                    </Typography>
                    
                    {/* Componente temporal para agregar datos de prueba */}
                    <AddSamplePayments />
                  </Box>
                )}
              </Box>
            </Paper>
          </motion.div>
                
          {/* PAGINACIÓN SEPARADA ESTILO COMMITMENTS */}
          {Math.ceil(filteredPayments.length / rowsPerPage) > 1 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
              px: 2.5, 
              py: 1.5,
              mt: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Info de paginación y controles adicionales */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1.5} 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                {/* Info detallada */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: '0.85rem',
                      lineHeight: 1.2
                    }}
                  >
                    {filteredPayments.length === 0 ? 'Sin pagos' : 
                     `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, filteredPayments.length)} de ${filteredPayments.length}`}
                  </Typography>
                  
                  {filteredPayments.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.75rem',
                        lineHeight: 1.2
                      }}
                    >
                      pagos encontrados
                    </Typography>
                  )}
                </Box>

                {/* Salto directo a página */}
                {Math.ceil(filteredPayments.length / rowsPerPage) > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary', 
                      fontSize: '0.75rem', 
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2
                    }}>
                      Ir a:
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Pág"
                      type="number"
                      value={jumpToPage}
                      onChange={(e) => setJumpToPage(e.target.value)}
                      onKeyDown={handleJumpToPageKeyDown}
                      onBlur={handleJumpToPage}
                      inputProps={{
                        min: 1,
                        max: Math.ceil(filteredPayments.length / rowsPerPage),
                        style: { 
                          textAlign: 'center', 
                          fontSize: '0.75rem',
                          padding: '5px'
                        }
                      }}
                      sx={{
                        width: 55,
                        '& .MuiOutlinedInput-root': {
                          height: 30,
                          borderRadius: 0.5,
                          '& fieldset': {
                            borderColor: alpha(theme.palette.divider, 0.2)
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </Stack>

              {/* Controles de paginación */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: { xs: 'center', sm: 'flex-end' },
                alignItems: 'center',
                gap: 1.5
              }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton
                    onClick={handleFirstPage}
                    disabled={page === 0}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page === 0 ? 'action.disabled' : 'background.paper',
                      color: page === 0 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page !== 0 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <FirstPage fontSize="inherit" />
                  </IconButton>

                  <IconButton
                    onClick={handlePrevPage}
                    disabled={page === 0}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page === 0 ? 'action.disabled' : 'background.paper',
                      color: page === 0 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page !== 0 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <NavigateBefore fontSize="inherit" />
                  </IconButton>

                  <Pagination
                    count={Math.ceil(filteredPayments.length / rowsPerPage)}
                    page={page + 1}
                    onChange={(event, newPage) => handlePageChange(newPage)}
                    color="primary"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        minWidth: 30,
                        height: 30,
                        borderRadius: 0.5,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-0.5px)',
                          boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                        }
                      },
                      '& .MuiPaginationItem-page.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.3)',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)'
                        }
                      },
                      '& .MuiPaginationItem-ellipsis': {
                        color: 'text.secondary',
                        fontSize: '0.75rem'
                      },
                      '& .MuiPaginationItem-icon': {
                        fontSize: 16
                      }
                    }}
                  />

                  <IconButton
                    onClick={handleNextPage}
                    disabled={page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'action.disabled' : 'background.paper',
                      color: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page < Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <NavigateNext fontSize="inherit" />
                  </IconButton>

                  <IconButton
                    onClick={handleLastPage}
                    disabled={page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1}
                    size="small"
                    sx={{
                      borderRadius: 0.5,
                      width: 30,
                      height: 30,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      bgcolor: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'action.disabled' : 'background.paper',
                      color: page >= Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? 'text.disabled' : 'primary.main',
                      transition: 'all 0.15s ease',
                      '&:hover': page < Math.ceil(filteredPayments.length / rowsPerPage) - 1 ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'translateY(-0.5px)',
                        boxShadow: '0 1px 4px rgba(25, 118, 210, 0.2)'
                      } : {}
                    }}
                  >
                    <LastPage fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Visor de comprobantes de pago */}
      <PaymentReceiptViewer
        open={receiptViewerOpen}
        onClose={handleCloseReceiptViewer}
        commitment={selectedPayment ? {
          id: selectedPayment.commitmentId,
          companyName: selectedPayment.companyName,
          concept: selectedPayment.concept,
          amount: selectedPayment.amount,
          paidAt: selectedPayment.date, // date del pago -> paidAt
          paymentMethod: selectedPayment.method,
          paymentNotes: selectedPayment.notes,
          receiptUrl: selectedPayment.attachments && selectedPayment.attachments.length > 0 ? selectedPayment.attachments[0] : null,
          receiptUrls: selectedPayment.attachments || []
        } : null}
      />

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PaymentsPage;
