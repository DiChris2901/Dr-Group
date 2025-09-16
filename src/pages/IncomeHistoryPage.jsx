import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    AttachFile as AttachFileIcon,
    AttachMoney as AttachMoneyIcon,
    Business as BusinessIcon,
    Clear as ClearIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon,
    Edit as EditIcon,
    FilterList as FilterIcon,
    Person as PersonIcon,
    Receipt as ReceiptIcon,
    Save as SaveIcon,
    Search as SearchIcon,
    TrendingUp as TrendingUpIcon,
    Visibility as VisibilityIcon,
    SwapHoriz as SwapHorizIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
  Pagination,
  Divider,
  alpha,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Autocomplete
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { deleteObject, getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { useToast } from '../context/ToastContext';
import IncomeDetailModal from '../components/incomes/IncomeDetailModal';
import DateRangeFilter, { getDateRangeFromFilter } from '../components/payments/DateRangeFilter';
import { isValid } from 'date-fns';
import { motion } from 'framer-motion';

const IncomeHistoryPage = () => {
  const theme = useTheme();
  const { currentUser, userProfile } = useAuth();
  const { logActivity } = useActivityLogs();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  
  // Estados principales
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [bankFilter, setBankFilter] = useState('all');
  
  // Estados para paginación optimizada
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Fijo a 10 registros por página
  const [uniqueBanks, setUniqueBanks] = useState([]);
  // Modal detalle ingreso
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  
  // Estados para eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Estados para edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    client: '',
    amount: '',
    description: '',
    paymentMethod: 'transferencia',
    account: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [formattedAmount, setFormattedAmount] = useState('');
  const [editFiles, setEditFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  // Cargar ingresos y empresas desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    const unsubscribes = [];

    // Cargar empresas
    const companiesQuery = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );
    
    unsubscribes.push(onSnapshot(
      companiesQuery,
      (snapshot) => {
        const companiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.bankAccount && data.bankName) {
            companiesData.push({
              id: doc.id,
              ...data
            });
          }
        });
        setCompanies(companiesData);
      },
      (error) => {
        console.error('Error cargando empresas:', error);
      }
    ));

    // Cargar ingresos
    const q = query(
      collection(db, 'incomes'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const incomesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          incomesData.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });

        setIncomes(incomesData);
        
        // Extraer bancos únicos para filtros
        const banks = [...new Set(incomesData
          .map(income => income.bank)
          .filter(bank => bank && bank.trim())
        )].sort();
        setUniqueBanks(banks);
        
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando histórico de ingresos:', error);
        setError('Error al cargar el histórico: ' + error.message);
        setLoading(false);
      }
    );

    unsubscribes.push(unsubscribe);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser]);

  // Aplicar filtros optimizado
  useEffect(() => {
    let filtered = [...incomes];

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(income =>
        income.client.toLowerCase().includes(searchLower) ||
        (income.description && income.description.toLowerCase().includes(searchLower)) ||
        (income.account && income.account.toLowerCase().includes(searchLower)) ||
        (income.bank && income.bank.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(income => income.paymentMethod === paymentMethodFilter);
    }

    // Filtro por banco
    if (bankFilter !== 'all') {
      filtered = filtered.filter(income => income.bank === bankFilter);
    }

    // Filtro por rango de fechas
    if (dateRangeFilter !== 'all') {
      const { startDate, endDate } = getDateRangeFromFilter(
        dateRangeFilter,
        customStartDate,
        customEndDate
      );

      if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
        filtered = filtered.filter(income =>
          isWithinInterval(income.date, { start: startDate, end: endDate })
        );
      }
    }

    setFilteredIncomes(filtered);
    setCurrentPage(1); // Reset página al filtrar
  }, [incomes, searchTerm, paymentMethodFilter, bankFilter, dateRangeFilter, customStartDate, customEndDate]);

  // Calcular estadísticas de los ingresos filtrados
  const stats = React.useMemo(() => {
    const totalAmount = filteredIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    
    // Agrupar por método de pago
    const byPaymentMethod = filteredIncomes.reduce((acc, income) => {
      acc[income.paymentMethod] = (acc[income.paymentMethod] || 0) + income.amount;
      return acc;
    }, {});

    return {
      total: filteredIncomes.length,
      totalAmount,
      byPaymentMethod,
      averageAmount: filteredIncomes.length > 0 ? totalAmount / filteredIncomes.length : 0
    };
  }, [filteredIncomes]);

  // Calcular datos paginados con mejor performance
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncomes = React.useMemo(() => {
    return filteredIncomes.slice(startIndex, endIndex);
  }, [filteredIncomes, startIndex, endIndex]);

  // Limpiar filtros
  // Detectar si hay filtros activos
  const hasActiveFilters = searchTerm || 
    paymentMethodFilter !== 'all' || 
    bankFilter !== 'all' || 
    dateRangeFilter !== 'all';

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentMethodFilter('all');
    setBankFilter('all');
    setDateRangeFilter('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  // Handlers modal detalle
  const handleOpenDetail = (income) => {
    setSelectedIncome(income);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedIncome(null);
  };

  // Funciones de formateo de moneda
  const formatCurrencyInput = (value) => {
    // Eliminar caracteres no numéricos
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    // Convertir a número y formatear con puntos
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('es-CO').format(number);
  };

  const handleAmountChange = (value) => {
    const formatted = formatCurrencyInput(value);
    const numericValue = value.replace(/[^\d]/g, '');
    
    handleEditFormChange('amount', numericValue);
    return formatted;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Funciones para eliminación
  const handleDeleteClick = (income) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;

    setDeleting(true);
    const storage = getStorage();

    try {
      // 1. Eliminar archivos de Storage si existen
      if (incomeToDelete.attachments && incomeToDelete.attachments.length > 0) {
        for (const file of incomeToDelete.attachments) {
          try {
            const fileRef = ref(storage, file.path || file.storagePath);
            await deleteObject(fileRef);
            console.log(`Archivo eliminado: ${file.name}`);
          } catch (fileError) {
            console.warn(`Error al eliminar archivo ${file.name}:`, fileError);
          }
        }
      }

      // 2. Eliminar documento de Firestore
      await deleteDoc(doc(db, 'incomes', incomeToDelete.id));

      // 📝 Registrar actividad de auditoría - Eliminación de ingreso desde historial
      await logActivity('delete_income', 'income', incomeToDelete.id, {
        client: incomeToDelete.client,
        amount: incomeToDelete.amount,
        paymentMethod: incomeToDelete.paymentMethod,
        account: incomeToDelete.account,
        bank: incomeToDelete.bank || 'Sin banco',
        description: incomeToDelete.description || 'Sin descripción',
        attachmentsCount: (incomeToDelete.attachments || []).length,
        deletedAttachments: (incomeToDelete.attachments || []).map(f => f.name).join(', '),
        source: 'history_page'
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);

      // 3. Mostrar mensaje de éxito
      showSuccess('Ingreso eliminado exitosamente');

      // 4. Cerrar diálogo
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);

    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      showError('Error al eliminar el ingreso: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Funciones para edición
  const handleEditClick = (income) => {
    setIncomeToEdit(income);
    const amountValue = income.amount?.toString() || '';
    setEditFormData({
      client: income.client || '',
      amount: amountValue,
      description: income.description || '',
      paymentMethod: income.paymentMethod || 'transferencia',
      account: income.account || '',
      date: format(income.date, 'yyyy-MM-dd')
    });
    setFormattedAmount(amountValue ? formatCurrencyInput(amountValue) : '');
    
    // Marcar archivos existentes como tal
    const existingFiles = (income.attachments || []).map(file => ({
      ...file,
      isNew: false,
      storagePath: file.path // Mapear 'path' a 'storagePath' para compatibilidad
    }));
    setEditFiles(existingFiles);
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setIncomeToEdit(null);
    setEditFormData({
      client: '',
      amount: '',
      description: '',
      paymentMethod: 'transferencia',
      account: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setFormattedAmount('');
    setEditFiles([]);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditFileUpload = (event) => {
    const files = Array.from(event.target.files);
    // Agregar nuevos archivos a la lista existente
    setEditFiles(prev => [...prev, ...files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      isNew: true
    }))]);
  };

  const handleEditFileRemove = async (fileIndex) => {
    const fileToRemove = editFiles[fileIndex];
    
    if (fileToRemove.isNew) {
      // Solo remover del estado si es un archivo nuevo
      setEditFiles(prev => prev.filter((_, index) => index !== fileIndex));
    } else {
      // Si es un archivo existente, marcarlo para eliminación
      try {
        const storage = getStorage();
        const fileRef = ref(storage, fileToRemove.path || fileToRemove.storagePath);
        await deleteObject(fileRef);
        setEditFiles(prev => prev.filter((_, index) => index !== fileIndex));
        showSuccess(`Archivo ${fileToRemove.name} eliminado`);
      } catch (error) {
        console.error('Error al eliminar archivo:', error);
        showError('Error al eliminar archivo');
      }
    }
  };

  // Nueva función para reemplazar comprobante existente
  const handleEditFileReplace = async (fileIndex) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
    
    input.onchange = async (event) => {
      const newFile = event.target.files[0];
      if (!newFile) return;
      
      // Validar tamaño
      if (newFile.size > 5 * 1024 * 1024) {
        showError('El archivo no puede ser mayor a 5MB');
        return;
      }
      
      const oldFile = editFiles[fileIndex];
      
      try {
        // 1. Eliminar el archivo anterior del storage
        if (oldFile && (oldFile.path || oldFile.storagePath) && !oldFile.isNew) {
          const storage = getStorage();
          const oldFileRef = ref(storage, oldFile.path || oldFile.storagePath);
          await deleteObject(oldFileRef);
        }
        
        // 2. Reemplazar en el estado con el nuevo archivo
        setEditFiles(prev => prev.map((file, index) => 
          index === fileIndex 
            ? {
                name: newFile.name,
                file: newFile,
                isNew: true,
                url: URL.createObjectURL(newFile)
              }
            : file
        ));
        
        showSuccess(`Comprobante reemplazado: ${newFile.name}`);
      } catch (error) {
        console.error('Error al reemplazar archivo:', error);
        showError('Error al reemplazar el comprobante');
      }
    };
    
    input.click();
  };

  const handleEditSubmit = async () => {
    if (!incomeToEdit) return;

    // Validaciones
    if (!editFormData.client || !editFormData.amount || !editFormData.account) {
      showError('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    const storage = getStorage();

    try {
      // 1. Subir nuevos archivos si existen
      const uploadedFiles = [];
      const newFiles = editFiles.filter(f => f.isNew && f.file);
      
      for (const fileData of newFiles) {
        try {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${fileData.file.name}`;
          const filePath = `incomes/${incomeToEdit.id}/${fileName}`;
          const storageRef = ref(storage, filePath);
          
          await uploadBytes(storageRef, fileData.file);
          const downloadURL = await getDownloadURL(storageRef);
          
          uploadedFiles.push({
            name: fileData.file.name,
            originalName: fileData.file.name,
            url: downloadURL,
            path: filePath,
            size: fileData.file.size,
            type: fileData.file.type,
            uploadedAt: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error al subir ${fileData.file.name}:`, error);
        }
      }

      // 2. Combinar archivos existentes con nuevos
      const existingFiles = editFiles.filter(f => !f.isNew);
      const allFiles = [...existingFiles, ...uploadedFiles];

      // 3. Actualizar documento en Firestore
      const updateData = {
        client: editFormData.client,
        amount: parseFloat(editFormData.amount),
        description: editFormData.description,
        paymentMethod: editFormData.paymentMethod,
        account: editFormData.account,
        date: Timestamp.fromDate(new Date(editFormData.date)),
        attachments: allFiles,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(doc(db, 'incomes', incomeToEdit.id), updateData);

      // 📝 Registrar actividad de auditoría - Edición de ingreso desde historial
      await logActivity('update_income', 'income', incomeToEdit.id, {
        client: updateData.client,
        amount: updateData.amount,
        paymentMethod: updateData.paymentMethod,
        account: updateData.account,
        description: updateData.description || 'Sin descripción',
        attachmentsModified: editFiles.some(f => f.isNew) || filesToRemove.length > 0,
        newAttachmentsCount: editFiles.filter(f => f.isNew).length,
        removedAttachmentsCount: filesToRemove.length,
        previousAmount: incomeToEdit.amount || 0,
        source: 'history_page'
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);

      // 4. Mostrar mensaje de éxito
      showSuccess('Ingreso actualizado exitosamente');

      // 5. Cerrar modal
      handleEditCancel();

    } catch (error) {
      console.error('Error al actualizar ingreso:', error);
      showError('Error al actualizar el ingreso: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Obtener cuentas bancarias disponibles
  const getBankAccounts = () => {
    const businessAccounts = companies
      .filter(company => company.bankAccount && company.bankName)
      .map(company => ({
        id: company.id,
        type: 'business',
        companyName: company.name,
        bankAccount: company.bankAccount,
        bankName: company.bankName,
        displayName: `${company.name} (Empresarial)`,
        uniqueKey: `business-${company.id}-${company.bankAccount}`
      }));

    return businessAccounts;
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'transferencia': 'primary',
      'efectivo': 'success',
      'cheque': 'warning',
      'tarjeta': 'info',
      'otro': 'default'
    };
    return colors[method] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando histórico de ingresos...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* HEADER GRADIENT SOBRIO */}
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
          mb: 6
        }}
      >
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Información principal */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ 
              fontWeight: 600, 
              fontSize: '0.7rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 1.2
            }}>
              FINANZAS • HISTÓRICO
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mt: 0.5, 
              mb: 0.5,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              📈 Histórico de Consignaciones
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Consulta y analiza todos los pagos recibidos
            </Typography>
          </Box>

          {/* Indicadores y acciones */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'row', md: 'row' },
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center'
          }}>
            {/* Botón de regresar */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/income')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1,
                fontSize: '0.75rem',
                height: 32,
                px: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Regresar
            </Button>

            {/* Botón de Nuevo Ingreso */}
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/income')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1,
                fontSize: '0.75rem',
                height: 32,
                px: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              Nuevo Ingreso
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas sobrias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Registros',
            value: stats.total,
            icon: <ReceiptIcon />,
            color: theme.palette.primary.main
          },
          {
            title: 'Monto Total',
            value: formatCurrency(stats.totalAmount),
            icon: <AttachMoneyIcon />,
            color: theme.palette.success.main
          },
          {
            title: 'Promedio por Ingreso',
            value: formatCurrency(stats.averageAmount),
            icon: <TrendingUpIcon />,
            color: theme.palette.warning.main
          },
          {
            title: 'Página Actual',
            value: `${currentPage} de ${totalPages}`,
            icon: <BusinessIcon />,
            color: theme.palette.info.main
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: `${stat.color}15`,
                    color: stat.color
                  }}>
                    {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Panel de filtros sobrio */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          borderRadius: 1,
          p: 3,
          mb: 4,
          position: 'relative',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.8)
          }
        }}
      >
        <Box>
          {/* Header Premium */}
          <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
            <Box display="flex" alignItems="center">
              <FilterIcon 
                sx={{ 
                  mr: 2, 
                  color: 'primary.main',
                  fontSize: 28
                }} 
              />
              <Box>
                <Typography 
                  variant="h5" 
                  color="primary.main"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Filtros de Ingresos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refina tu búsqueda de ingresos con múltiples criterios
                </Typography>
              </Box>
            </Box>
            
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  Limpiar Filtros
                </Button>
              </motion.div>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Búsqueda */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar ingresos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cliente, descripción, cuenta, banco..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Filtro por método de pago */}
            <Grid item xs={12} md={2.25}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
              >
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  label="Método de Pago"
                >
                  <MenuItem value="all">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      Todos los métodos
                    </Box>
                  </MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por banco */}
            <Grid item xs={12} md={2.25}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.default,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                    }
                  }
                }}
              >
                <InputLabel>Banco</InputLabel>
                <Select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  label="Banco"
                >
                  <MenuItem value="all">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      Todos los bancos
                    </Box>
                  </MenuItem>
                  {uniqueBanks.map((bank) => (
                    <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por período */}
            <Grid item xs={12} md={2.25}>
              <DateRangeFilter
                value={dateRangeFilter}
                onFilterChange={setDateRangeFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomStartDateChange={setCustomStartDate}
                onCustomEndDateChange={setCustomEndDate}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main'
                    }
                  }
                }}
              />
            </Grid>




          </Grid>
        </Box>
      </Paper>

      {/* Tabla de resultados sobria */}
      <Card sx={{ 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
      }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header con controles de paginación */}
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Resultados: {stats.total} ingresos encontrados
            </Typography>
          </Box>

          <TableContainer>
            <Table sx={{
              '& .MuiTableCell-root': {
                borderColor: `${theme.palette.divider}`,
                borderBottom: `1px solid ${theme.palette.divider}`
              },
              '& .MuiTableHead-root': {
                '& .MuiTableRow-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  '& .MuiTableCell-root': {
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    paddingY: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    borderColor: `${theme.palette.divider}`
                  }
                }
              },
              '& .MuiTableBody-root': {
                '& .MuiTableRow-root': {
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    transition: 'background-color 0.2s ease'
                  },
                  '&:last-child': {
                    '& .MuiTableCell-root': {
                      borderBottom: 'none'
                    }
                  },
                  '& .MuiTableCell-root': {
                    paddingY: 1.8,
                    fontSize: '0.85rem',
                    borderColor: `${theme.palette.divider}`,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }
                }
              }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Cuenta</TableCell>
                  <TableCell>Banco</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedIncomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Box>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No se encontraron ingresos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Intenta ajustar los filtros de búsqueda
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedIncomes.map((income, index) => (
                    <TableRow key={income.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {income.client}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(income.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(income.date, 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={income.paymentMethod}
                          size="small"
                          color={getPaymentMethodColor(income.paymentMethod)}
                          variant="outlined"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {income.account || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {income.bank || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small" 
                              color="primary"
                              sx={{
                                borderRadius: 1,
                                '&:hover': {
                                  backgroundColor: 'primary.main',
                                  color: 'primary.contrastText'
                                }
                              }}
                              onClick={() => handleOpenDetail(income)}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              color="warning"
                              sx={{
                                borderRadius: 1,
                                '&:hover': {
                                  backgroundColor: 'warning.main',
                                  color: 'warning.contrastText'
                                }
                              }}
                              onClick={() => handleEditClick(income)}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error"
                              sx={{
                                borderRadius: 1,
                                '&:hover': {
                                  backgroundColor: 'error.main',
                                  color: 'error.contrastText'
                                }
                              }}
                              onClick={() => handleDeleteClick(income)}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación sobria */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.6)}` }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredIncomes.length)} de {filteredIncomes.length} registros
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
                variant="outlined"
                shape="rounded"
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1,
                    fontWeight: 500
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Última actualización: {new Date().toLocaleString('es-CO')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total procesado: {formatCurrency(stats.totalAmount)}
        </Typography>
      </Box>

      {/* Modal Detalle Ingreso */}
      <IncomeDetailModal
        open={detailOpen}
        onClose={handleCloseDetail}
        income={selectedIncome}
        formatCurrency={formatCurrency}
        getPaymentMethodColor={getPaymentMethodColor}
        companies={companies}
      />

      {/* Modal de Edición de Ingreso */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: theme.palette.mode === 'dark' 
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0, color: 'text.primary' }}>
                Editar Ingreso
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {editFormData.client || 'Modificar información del ingreso'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 5 }}>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {/* Información Principal */}
              <Grid item xs={12} md={7}>
                <Paper sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: theme.palette.background.paper,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="overline" sx={{ 
                    fontWeight: 600, 
                    color: 'primary.main',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem'
                  }}>
                    Información General
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Cliente */}
                    <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Cliente"
                value={editFormData.client}
                onChange={(e) => handleEditFormChange('client', e.target.value)}
                disabled={saving}
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: 1 }
                }}
              />
            </Grid>

            {/* Monto */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Monto"
                value={formattedAmount}
                onChange={(e) => {
                  const formatted = handleAmountChange(e.target.value);
                  setFormattedAmount(formatted);
                }}
                disabled={saving}
                placeholder="0"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main'
                    }
                  }
                }}
              />
            </Grid>

            {/* Fecha */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Fecha"
                type="date"
                value={editFormData.date}
                onChange={(e) => handleEditFormChange('date', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: 1 }
                }}
              />
            </Grid>

            {/* Método de Pago */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={editFormData.paymentMethod}
                  onChange={(e) => handleEditFormChange('paymentMethod', e.target.value)}
                  disabled={saving}
                  label="Método de Pago"
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Cuenta Bancaria */}
            <Grid item xs={12}>
              <Autocomplete
                options={getBankAccounts()}
                getOptionLabel={(option) => option.displayName || ''}
                value={getBankAccounts().find(acc => acc.bankAccount === editFormData.account) || null}
                onChange={(event, newValue) => handleEditFormChange('account', newValue?.bankAccount || '')}
                disabled={saving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cuenta Bancaria"
                    required
                    placeholder="Seleccionar cuenta"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                )}
              />
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={editFormData.description}
                onChange={(e) => handleEditFormChange('description', e.target.value)}
                disabled={saving}
                placeholder="Descripción del ingreso (opcional)"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Información Lateral */}
              <Grid item xs={12} md={5}>
                {/* Gestión de Archivos */}
                <Paper sx={{ 
                  p: 3.5, 
                  borderRadius: 2, 
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  background: theme.palette.background.paper,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="overline" sx={{ 
                    fontWeight: 600, 
                    color: 'secondary.main',
                    letterSpacing: 0.8,
                    fontSize: '0.75rem'
                  }}>
                    <AttachFileIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Gestión de Archivos
                  </Typography>

            {/* Archivos */}
            <Box sx={{ mt: 2 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, #ffffff 100%)`,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1rem'
                  }}
                >
                  <AttachFileIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                  Gestión de Archivos
                </Typography>
                
                {/* Estado de archivos */}
                {editFiles.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    <Alert 
                      severity={editFiles.filter(f => !f.isNew).length > 0 ? "info" : "success"}
                      sx={{ 
                        mb: 2, 
                        backgroundColor: alpha(
                          editFiles.filter(f => !f.isNew).length > 0 
                            ? theme.palette.info.main 
                            : theme.palette.success.main, 
                          0.08
                        ),
                        '& .MuiAlert-icon': { 
                          color: editFiles.filter(f => !f.isNew).length > 0 
                            ? theme.palette.info.main 
                            : theme.palette.success.main 
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {editFiles.filter(f => !f.isNew).length > 0 ? (
                          <>
                            ☁️ <strong>Este ingreso tiene {editFiles.filter(f => !f.isNew).length} comprobante{editFiles.filter(f => !f.isNew).length > 1 ? 's' : ''} en almacenamiento</strong>
                            {editFiles.filter(f => f.isNew).length > 0 && (
                              <> + {editFiles.filter(f => f.isNew).length} nuevo{editFiles.filter(f => f.isNew).length > 1 ? 's' : ''}</>
                            )}
                            <br />
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              Puedes reemplazar o eliminar los comprobantes existentes
                            </Typography>
                          </>
                        ) : (
                          <>
                            📄 <strong>{editFiles.length} archivo{editFiles.length > 1 ? 's' : ''} nuevo{editFiles.length > 1 ? 's' : ''} agregado{editFiles.length > 1 ? 's' : ''}</strong>
                            <br />
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              Se subirá{editFiles.length > 1 ? 'n' : ''} al almacenamiento al guardar
                            </Typography>
                          </>
                        )}
                      </Typography>
                    </Alert>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {editFiles.map((file, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 3,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              borderColor: alpha(theme.palette.primary.main, 0.25),
                              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: file.isNew ? theme.palette.success.main : theme.palette.info.main,
                                mr: 3,
                                flexShrink: 0,
                                boxShadow: `0 0 0 3px ${alpha(file.isNew ? theme.palette.success.main : theme.palette.info.main, 0.15)}`,
                                border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`
                              }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: theme.palette.text.primary
                                }}
                              >
                                {file.name || file.file?.name}
                              </Typography>
                              <Chip
                                label={file.isNew ? '📄 Nuevo archivo' : '☁️ En almacenamiento'}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  mt: 0.5,
                                  height: 22,
                                  fontSize: '0.7rem',
                                  borderColor: file.isNew ? theme.palette.success.light : theme.palette.info.light,
                                  color: file.isNew ? theme.palette.success.main : theme.palette.info.main,
                                  backgroundColor: alpha(file.isNew ? theme.palette.success.main : theme.palette.info.main, 0.08),
                                  fontWeight: 500
                                }}
                              />
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            {/* Botón Reemplazar - Solo para archivos existentes */}
                            {!file.isNew && (
                              <Tooltip title="Reemplazar comprobante">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditFileReplace(index)}
                                  disabled={saving}
                                  sx={{
                                    color: alpha(theme.palette.warning.main, 0.8),
                                    borderRadius: 1.5,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      color: theme.palette.warning.main,
                                      backgroundColor: alpha(theme.palette.warning.main, 0.08),
                                      transform: 'scale(1.05)'
                                    },
                                    '&:disabled': {
                                      color: alpha(theme.palette.text.disabled, 0.5)
                                    }
                                  }}
                                >
                                  <SwapHorizIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* Botón Eliminar */}
                            <Tooltip title={file.isNew ? "Quitar archivo" : "Eliminar comprobante"}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditFileRemove(index)}
                                disabled={saving}
                                sx={{
                                  color: alpha(theme.palette.error.main, 0.7),
                                  borderRadius: 1.5,
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    color: theme.palette.error.main,
                                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                                    transform: 'scale(1.05)'
                                  },
                                  '&:disabled': {
                                    color: alpha(theme.palette.text.disabled, 0.5)
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      mb: 3,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.3)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
                      border: `2px dashed ${alpha(theme.palette.divider, 0.15)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.25),
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.1)} 0%, ${alpha(theme.palette.grey[300], 0.05)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                    }}>
                      <AttachFileIcon sx={{ 
                        fontSize: 24, 
                        color: alpha(theme.palette.text.secondary, 0.7)
                      }} />
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 500,
                      mb: 1,
                      color: theme.palette.text.primary,
                      fontSize: '1rem'
                    }}>
                      Sin comprobantes en almacenamiento
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: alpha(theme.palette.text.secondary, 0.8),
                      lineHeight: 1.6,
                      mb: 2
                    }}>
                      Este ingreso no tiene comprobantes adjuntos
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: alpha(theme.palette.text.secondary, 0.6),
                      lineHeight: 1.6
                    }}>
                      Utiliza el botón de abajo para agregar comprobantes de pago
                    </Typography>
                  </Box>
                )}

                {/* Botón para agregar archivos */}
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  id="edit-file-upload"
                  type="file"
                  multiple
                  onChange={handleEditFileUpload}
                  disabled={saving}
                />
                <label htmlFor="edit-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AddIcon />}
                    disabled={saving}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      fontWeight: 500,
                      textTransform: 'none',
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      background: alpha(theme.palette.primary.main, 0.02),
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        background: alpha(theme.palette.primary.main, 0.06),
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      '&:disabled': {
                        borderColor: alpha(theme.palette.text.disabled, 0.23),
                        color: alpha(theme.palette.text.disabled, 0.6),
                        background: alpha(theme.palette.text.disabled, 0.04)
                      }
                    }}
                  >
                    <CloudUploadIcon sx={{ mr: 1 }} />
                    {editFiles.length > 0 ? 'Agregar Más Archivos' : 'Seleccionar Comprobantes'}
                  </Button>
                </label>
                
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    mt: 2,
                    fontStyle: 'italic',
                    fontSize: '0.75rem'
                  }}
                >
                  📎 Formatos admitidos: PDF, JPG, PNG, WebP • 📏 Máximo 5MB por archivo
                </Typography>
                </Paper>
              </Box>
            </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {editFormData.client ? `Editando: ${editFormData.client}` : 'Formulario de edición'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button 
              onClick={handleEditCancel}
              variant="outlined"
              disabled={saving}
              sx={{ 
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                px: 3
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditSubmit}
              variant="contained"
              disabled={saving || !editFormData.client || !editFormData.amount || !editFormData.account}
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{ 
                borderRadius: 1,
                fontWeight: 600,
                textTransform: 'none',
                px: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: 'error.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar este ingreso?
          </DialogContentText>
          {incomeToDelete && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Detalles del ingreso:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Cliente:</strong> {incomeToDelete.client}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Monto:</strong> {formatCurrency(incomeToDelete.amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Fecha:</strong> {format(incomeToDelete.date, 'dd MMM yyyy', { locale: es })}
              </Typography>
              {incomeToDelete.attachments && incomeToDelete.attachments.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Archivos adjuntos:</strong> {incomeToDelete.attachments.length} archivo(s)
                </Typography>
              )}
            </Box>
          )}
          <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 500 }}>
            ⚠️ Esta acción no se puede deshacer. Se eliminarán tanto el registro como los archivos adjuntos.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={deleting}
            sx={{ borderRadius: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{ borderRadius: 1 }}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncomeHistoryPage;
