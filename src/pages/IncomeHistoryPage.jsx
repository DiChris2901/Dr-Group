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
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
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
  Avatar,
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
import { useToast } from '../context/ToastContext';
import IncomeDetailModal from '../components/incomes/IncomeDetailModal';

const IncomeHistoryPage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
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
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
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
      const now = new Date();
      let startDate, endDate;

      switch (dateRangeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'thisWeek':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          startDate = startOfWeek;
          endDate = endOfWeek;
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'custom':
          if (customDateFrom && customDateTo) {
            startDate = parseISO(customDateFrom);
            endDate = parseISO(customDateTo + 'T23:59:59');
          }
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(income =>
          isWithinInterval(income.date, { start: startDate, end: endDate })
        );
      }
    }

    setFilteredIncomes(filtered);
    setCurrentPage(1); // Reset página al filtrar
  }, [incomes, searchTerm, paymentMethodFilter, bankFilter, dateRangeFilter, customDateFrom, customDateTo]);

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
  const clearFilters = () => {
    setSearchTerm('');
    setPaymentMethodFilter('all');
    setBankFilter('all');
    setDateRangeFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
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
      if (incomeToDelete.files && incomeToDelete.files.length > 0) {
        for (const file of incomeToDelete.files) {
          try {
            const fileRef = ref(storage, file.storagePath);
            await deleteObject(fileRef);
            console.log(`Archivo eliminado: ${file.name}`);
          } catch (fileError) {
            console.warn(`Error al eliminar archivo ${file.name}:`, fileError);
          }
        }
      }

      // 2. Eliminar documento de Firestore
      await deleteDoc(doc(db, 'incomes', incomeToDelete.id));

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
    const existingFiles = (income.files || []).map(file => ({
      ...file,
      isNew: false
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
        const fileRef = ref(storage, fileToRemove.storagePath);
        await deleteObject(fileRef);
        setEditFiles(prev => prev.filter((_, index) => index !== fileIndex));
        showSuccess(`Archivo ${fileToRemove.name} eliminado`);
      } catch (error) {
        console.error('Error al eliminar archivo:', error);
        showError('Error al eliminar archivo');
      }
    }
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
            url: downloadURL,
            storagePath: filePath,
            size: fileData.file.size,
            type: fileData.file.type,
            uploadedAt: new Date()
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
        files: allFiles,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(doc(db, 'incomes', incomeToEdit.id), updateData);

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
      <Card sx={{ 
        borderRadius: 2, 
        mb: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <FilterIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Filtros Avanzados
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Búsqueda */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cliente, descripción, cuenta, banco..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>

            {/* Filtro por método de pago */}
            <Grid item xs={12} md={2.25}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  label="Método de Pago"
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'success.main'
                    }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por banco */}
            <Grid item xs={12} md={2.25}>
              <FormControl fullWidth>
                <InputLabel>Banco</InputLabel>
                <Select
                  value={bankFilter}
                  onChange={(e) => setBankFilter(e.target.value)}
                  label="Banco"
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'info.main'
                    }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {uniqueBanks.map((bank) => (
                    <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por período */}
            <Grid item xs={12} md={2.25}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  label="Período"
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'warning.main'
                    }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="today">Hoy</MenuItem>
                  <MenuItem value="thisWeek">Esta Semana</MenuItem>
                  <MenuItem value="thisMonth">Este Mes</MenuItem>
                  <MenuItem value="lastMonth">Mes Anterior</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Botón limpiar filtros */}
            <Grid item xs={12} md={2.25}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ 
                  height: '56px',
                  borderRadius: 1,
                  fontWeight: 500
                }}
              >
                Limpiar
              </Button>
            </Grid>

            {/* Fechas personalizadas */}
            {dateRangeFilter === 'custom' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Desde"
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'info.main'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Hasta"
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'info.main'
                        }
                      }
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

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
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0, 0, 0, 0.3)'
              : '0 12px 40px rgba(0, 0, 0, 0.15)',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`
              : `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.common.white} 100%)`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2, 
          pt: 3,
          px: 3,
          background: 'transparent',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <EditIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Editar Ingreso
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2, pt: 3 }}>
          <Grid container spacing={3}>
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

            {/* Archivos */}
            <Grid item xs={12}>
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
                      severity="info" 
                      sx={{ 
                        mb: 2, 
                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                        '& .MuiAlert-icon': { color: theme.palette.info.main }
                      }}
                    >
                      <Typography variant="body2">
                        {editFiles.length} archivo{editFiles.length > 1 ? 's' : ''} 
                        {editFiles.filter(f => !f.isNew).length > 0 && (
                          <> ({editFiles.filter(f => !f.isNew).length} existente{editFiles.filter(f => !f.isNew).length > 1 ? 's' : ''})</>
                        )}
                      </Typography>
                    </Alert>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {editFiles.map((file, index) => (
                        <Paper
                          key={index}
                          elevation={0}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2.5,
                            borderRadius: 2,
                            backgroundColor: theme.palette.background.default,
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: theme.palette.primary.light,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: file.isNew ? theme.palette.success.main : theme.palette.primary.main,
                                mr: 2,
                                flexShrink: 0,
                                boxShadow: `0 0 0 3px ${alpha(file.isNew ? theme.palette.success.main : theme.palette.primary.main, 0.2)}`
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
                                label={file.isNew ? 'Nuevo archivo' : 'En almacenamiento'}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  mt: 0.5,
                                  height: 20,
                                  fontSize: '0.65rem',
                                  borderColor: file.isNew ? theme.palette.success.light : theme.palette.primary.light,
                                  color: file.isNew ? theme.palette.success.main : theme.palette.primary.main,
                                  backgroundColor: alpha(file.isNew ? theme.palette.success.main : theme.palette.primary.main, 0.08)
                                }}
                              />
                            </Box>
                          </Box>
                          
                          <Tooltip title="Eliminar archivo">
                            <IconButton
                              size="small"
                              onClick={() => handleEditFileRemove(index)}
                              disabled={saving}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.08)
                                }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 4,
                      mb: 3,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    <AttachFileIcon 
                      sx={{ 
                        fontSize: 48, 
                        color: alpha(theme.palette.primary.main, 0.4),
                        mb: 1
                      }} 
                    />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No hay archivos adjuntos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Utiliza el botón de abajo para agregar comprobantes
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
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {editFiles.length > 0 ? 'Agregar Más Archivos' : 'Seleccionar Archivos'}
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 3, gap: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
          <Button 
            onClick={handleEditCancel}
            variant="outlined"
            disabled={saving}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              '&:hover': {
                borderColor: theme.palette.text.secondary,
                backgroundColor: alpha(theme.palette.text.secondary, 0.04)
              }
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
              borderRadius: 2,
              px: 3,
              py: 1,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
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
              {incomeToDelete.files && incomeToDelete.files.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Archivos adjuntos:</strong> {incomeToDelete.files.length} archivo(s)
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
