import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  Paper,
  Avatar,
  Divider,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Autocomplete,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteFileIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { db, storage } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

const IncomePage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToast();
  const { settings } = useSettings();
  
  // ðŸŽ¨ Colores dinÃ¡micos del tema (igual que el sidebar)
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  
  // Estados principales
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para diÃ¡logos de visualizaciÃ³n y eliminaciÃ³n (mantener solo los necesarios)
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  
  // Estado para autocompletado de clientes
  const [uniqueClients, setUniqueClients] = useState([]);
  
  // Estados para distribuciÃ³n por empresas
  const [companies, setCompanies] = useState([]);
  const [personalAccounts, setPersonalAccounts] = useState([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    client: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'transferencia',
    account: '',
    bank: ''
  });
  
  const [saving, setSaving] = useState(false);
  
  // Estados para archivos/comprobantes
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // FunciÃ³n para obtener cuentas bancarias (empresariales y personales)
  const getBankAccounts = () => {
    // Cuentas empresariales
    const businessAccounts = companies
      .filter(company => company.bankAccount && company.bankName)
      .map(company => ({
        id: company.id,
        type: 'business',
        companyName: company.name,
        bankAccount: company.bankAccount,
        bankName: company.bankName,
        displayName: `${company.name} (Empresarial)`
      }));

    // Cuentas personales  
    const personalAccountsList = personalAccounts.map(account => ({
      id: account.id,
      type: 'personal',
      companyName: account.holderName,
      bankAccount: account.accountNumber,
      bankName: account.bankName,
      displayName: `${account.holderName} (Personal)`
    }));

    return [...businessAccounts, ...personalAccountsList];
  };

  const cleanCurrencyInput = (value) => {
    return value.replace(/[^\d]/g, '');
  };

  const handleAmountChange = (value) => {
    const cleanValue = cleanCurrencyInput(value);
    const numericValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
    handleFormChange('amount', numericValue);
  };

  // FunciÃ³n para manejar la selecciÃ³n de cuenta bancaria
  const handleBankAccountSelect = (selectedAccount) => {
    if (selectedAccount) {
      const accountInfo = getBankAccounts().find(acc => acc.bankAccount === selectedAccount);
      if (accountInfo) {
        setFormData(prev => ({
          ...prev,
          account: accountInfo.bankAccount,
          bank: accountInfo.bankName
        }));
      }
    }
  };

  // Cargar ingresos desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

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
        
        // Extraer clientes Ãºnicos para autocompletado
        const clients = incomesData
          .map(income => income.client)
          .filter((client, index, self) => client && client.trim() && self.indexOf(client) === index)
          .sort();
        setUniqueClients(clients);
        
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando ingresos:', error);
        setError('Error al cargar ingresos: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Cargar empresas desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    const companiesQuery = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      companiesQuery,
      (snapshot) => {
        const companiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({
            id: doc.id,
            ...data
          });
        });
        setCompanies(companiesData);
      },
      (error) => {
        console.error('Error cargando empresas:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Cargar cuentas personales desde Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setPersonalAccounts([]);
      return;
    }

    const q = query(
      collection(db, 'personal_accounts'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accounts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          accounts.push({
            id: doc.id,
            ...data
          });
        });
        setPersonalAccounts(accounts);
      },
      (error) => {
        console.error('Error cargando cuentas personales:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Función de refresh manual
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    // Los datos se actualizan automáticamente por los listeners de Firebase
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Calcular estadÃ­sticas
  const stats = React.useMemo(() => {
    const totalAmount = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const thisMonth = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      const now = new Date();
      return incomeDate.getMonth() === now.getMonth() && 
             incomeDate.getFullYear() === now.getFullYear();
    });
    const monthlyAmount = thisMonth.reduce((sum, income) => sum + (income.amount || 0), 0);

    return {
      total: incomes.length,
      totalAmount,
      monthlyTotal: thisMonth.length,
      monthlyAmount
    };
  }, [incomes]);

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ====================================
  // ðŸ“Ž FUNCIONES PARA MANEJO DE ARCHIVOS
  // ====================================

  // Validar archivos (reutilizable para drag y click)
  const validateFiles = (files) => {
    return files.filter(file => {
      // Validar tipo de archivo (imÃ¡genes y PDFs)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showError(`${file.name}: Solo se permiten imÃ¡genes (JPG, PNG, WEBP) y archivos PDF`);
        return false;
      }

      // Validar tamaÃ±o (mÃ¡ximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError(`${file.name}: El archivo no puede exceder 10MB`);
        return false;
      }

      return true;
    });
  };

  // Procesar archivos (reutilizable)
  const processFiles = (validFiles) => {
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      showSuccess(`${validFiles.length} archivo(s) agregado(s)`);
    }
  };

  // Actualizar handleFileSelect para usar las funciones reutilizables
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = validateFiles(files);
    processFiles(validFiles);

    // Limpiar el input
    event.target.value = '';
  };

  // Remover archivo de la lista
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ====================================
  // ðŸ–±ï¸ FUNCIONES DRAG AND DROP
  // ====================================

  // Manejar drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  // Manejar drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo quitar dragOver si realmente salimos del Ã¡rea
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  // Manejar drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    processFiles(validFiles);
  };

  // Subir archivos a Firebase Storage
  const uploadFiles = async (incomeId) => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `incomes/${incomeId}/${fileName}`);

        // Crear la tarea de subida
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Promesa para manejar el progreso y resultado
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({
                ...prev,
                [i]: progress
              }));
            },
            (error) => {
              console.error('Error uploading file:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                uploadedFiles.push({
                  name: file.name,
                  originalName: file.name,
                  url: downloadURL,
                  size: file.size,
                  type: file.type,
                  path: `incomes/${incomeId}/${fileName}`,
                  uploadedAt: new Date().toISOString()
                });
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      addToast({
        type: 'error',
        title: 'Error al subir archivos',
        message: error.message
      });
      return [];
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // FunciÃ³n para editar ingreso (llenar formulario inline)
  const handleEditIncome = (income) => {
    setSelectedIncome(income);
    setFormData({
      client: income.client || '',
      amount: income.amount?.toString() || '',
      description: income.description || '',
      date: income.date ? format(income.date, 'yyyy-MM-dd') : '',
      paymentMethod: income.paymentMethod || 'transferencia',
      account: income.account || '',
      bank: income.bank || ''
    });
    // Reset other form states
    setSelectedFiles([]);
    setUploadProgress({});
    setDragOver(false);
  };

  // Ver detalles del ingreso
  const handleViewIncome = (income) => {
    setSelectedIncome(income);
    setViewDialogOpen(true);
  };

  // Confirmar eliminaciÃ³n
  const handleDeleteIncome = (income) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  // Guardar ingreso
  const handleSaveIncome = async () => {
    if (!formData.client.trim() || !formData.amount || !formData.date) {
      showError('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);

    try {
      const incomeData = {
        client: formData.client.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: Timestamp.fromDate(new Date(formData.date)),
        paymentMethod: formData.paymentMethod,
        account: formData.account.trim(),
        bank: formData.bank.trim(),
        createdBy: currentUser.uid,
        updatedAt: Timestamp.fromDate(new Date())
      };

      let incomeId;

      if (selectedIncome) {
        // Actualizar
        incomeId = selectedIncome.id;
        await updateDoc(doc(db, 'incomes', incomeId), incomeData);
        
        // Subir archivos si hay nuevos
        if (selectedFiles.length > 0) {
          const uploadedFiles = await uploadFiles(incomeId);
          if (uploadedFiles.length > 0) {
            // Agregar archivos nuevos a los existentes
            const existingFiles = selectedIncome.attachments || [];
            await updateDoc(doc(db, 'incomes', incomeId), {
              attachments: [...existingFiles, ...uploadedFiles]
            });
          }
        }
        
        addToast({
          type: 'success',
          title: 'Ingreso actualizado',
          message: 'El ingreso ha sido actualizado correctamente'
        });
      } else {
        // Crear nuevo
        incomeData.createdAt = Timestamp.fromDate(new Date());
        const incomeDoc = await addDoc(collection(db, 'incomes'), incomeData);
        incomeId = incomeDoc.id;
        
        // Subir archivos despuÃ©s de crear el documento
        if (selectedFiles.length > 0) {
          const uploadedFiles = await uploadFiles(incomeId);
          if (uploadedFiles.length > 0) {
            await updateDoc(doc(db, 'incomes', incomeId), {
              attachments: uploadedFiles
            });
          }
        }
        
        showSuccess(selectedFiles.length > 0 
          ? `Ingreso registrado con ${selectedFiles.length} archivo(s)`
          : 'El ingreso ha sido registrado correctamente'
        );
      }

      // Limpiar formulario despuÃ©s de guardar
      setSelectedIncome(null);
      setFormData({
        client: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'transferencia',
        account: '',
        bank: ''
      });
      setSelectedFiles([]);
      setUploadProgress({});
      setDragOver(false);
    } catch (error) {
      console.error('Error guardando ingreso:', error);
      showError('Error al guardar el ingreso: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar ingreso
  const confirmDelete = async () => {
    if (!incomeToDelete) return;

    try {
      // 1. Primero eliminar archivos de Storage si existen
      if (incomeToDelete.attachments && incomeToDelete.attachments.length > 0) {
        const deletePromises = incomeToDelete.attachments.map(async (file) => {
          try {
            const fileRef = ref(storage, file.path);
            await deleteObject(fileRef);
            console.log(`Archivo eliminado: ${file.name}`);
          } catch (error) {
            // Si el archivo no existe en Storage, continuamos
            console.warn(`Error eliminando archivo ${file.name}:`, error);
          }
        });
        
        await Promise.allSettled(deletePromises);
      }

      // 2. Luego eliminar el documento de Firestore
      await deleteDoc(doc(db, 'incomes', incomeToDelete.id));
      
      showSuccess('El ingreso y sus archivos han sido eliminados correctamente');
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    } catch (error) {
      console.error('Error eliminando ingreso:', error);
      showError('Error al eliminar el ingreso: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
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

  const getCategoryIcon = (category) => {
    const icons = {
      'servicio': <BusinessIcon />,
      'consulta': <PersonIcon />,
      'producto': <AttachMoneyIcon />,
      'otro': <DescriptionIcon />
    };
    return icons[category] || <AttachMoneyIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando ingresos...</Typography>
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
              FINANZAS • INGRESOS
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
              💰 Gestión de Ingresos
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Registra y gestiona todos los pagos recibidos de tus clientes
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
            <Chip 
              size="small" 
              label={`Total ${formatCurrency(stats.total)}`} 
              sx={{ 
                fontWeight: 600, 
                borderRadius: 1,
                fontSize: '0.7rem',
                height: 26,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Chip 
              size="small" 
              label={`Este Mes ${formatCurrency(stats.thisMonth)}`} 
              sx={{ 
                borderRadius: 1,
                fontSize: '0.7rem',
                height: 26,
                bgcolor: 'rgba(76, 175, 80, 0.3)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Chip 
              size="small" 
              label={`${incomes.length} ingresos`} 
              sx={{ 
                borderRadius: 1,
                fontSize: '0.7rem',
                height: 26,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            
            {/* Botón de refresh */}
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                borderRadius: 1,
                p: 0.5,
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)'
                }
              }}
            >
              {refreshing ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Estadísticas sobrias */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Ingresos',
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
            title: 'Este Mes',
            value: stats.monthlyTotal,
            icon: <CalendarIcon />,
            color: theme.palette.info.main
          },
          {
            title: 'Monto Mensual',
            value: formatCurrency(stats.monthlyAmount),
            icon: <TrendingUpIcon />,
            color: theme.palette.warning.main
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
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

      {/* Formulario sobrio */}
      <Card sx={{ 
        borderRadius: 2,
        mb: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper
      }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header del formulario sobrio */}
          <Box sx={{ 
            mb: 4,
            pb: 3,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              mb: 1,
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AddIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              Registrar Nuevo Ingreso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completa la información del pago recibido
            </Typography>
          </Box>

          {/* Formulario */}
          <Grid container spacing={3}>
            {/* Cliente */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={uniqueClients}
                value={formData.client}
                onChange={(event, newValue) => {
                  handleFormChange('client', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  handleFormChange('client', newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    label="Cliente"
                    disabled={saving}
                    placeholder="Nombre del cliente"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'primary.main' }} />
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
                )}
              />
            </Grid>

            {/* Monto */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Monto"
                value={formData.amount ? formData.amount.toLocaleString() : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={saving}
                placeholder="0"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'success.main'
                    }
                  }
                }}
              />
            </Grid>

            {/* DescripciÃ³n */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="DescripciÃ³n"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                disabled={saving}
                placeholder="DescripciÃ³n del ingreso (opcional)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                      <DescriptionIcon sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  )
                }}
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

            {/* Fecha */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha"
                value={formData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ color: 'warning.main' }} />
                    </InputAdornment>
                  )
                }}
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

            {/* MÃ©todo de pago */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>MÃ©todo de Pago</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                  disabled={saving}
                  label="MÃ©todo de Pago"
                  startAdornment={
                    <InputAdornment position="start">
                      <AccountBalanceIcon sx={{ color: '#2196f3' }} />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 1,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2196f3'
                    }
                  }}
                >
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">ConsignaciÃ³n</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="tarjeta">Tarjeta</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Cuenta bancaria */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={getBankAccounts()}
                getOptionLabel={(option) => option.displayName || ''}
                value={getBankAccounts().find(acc => acc.bankAccount === formData.account) || null}
                onChange={(event, newValue) => handleBankAccountSelect(newValue?.bankAccount || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cuenta Bancaria"
                    disabled={saving}
                    placeholder="Seleccionar cuenta"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountBalanceIcon sx={{ color: '#9c27b0' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#9c27b0'
                        }
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalanceIcon sx={{ color: '#9c27b0', fontSize: 18 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.companyName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.bankName} - {option.bankAccount}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
          </Grid>

          {/* Sección de archivos sobria */}
          <Box sx={{ mt: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'text.primary'
              }}
            >
              <AttachFileIcon sx={{ fontSize: 20 }} />
              Archivos y Comprobantes
            </Typography>
            
            <Paper
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                p: 3,
                border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: 1,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                background: theme.palette.background.paper,
                '&:hover': {
                  borderColor: theme.palette.primary.main
                }
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                type="file"
                id="file-input"
                multiple
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              
              <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                {dragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Imágenes (JPG, PNG, WEBP) y archivos PDF hasta 10MB
              </Typography>
            </Paper>

            {/* Lista de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Archivos seleccionados ({selectedFiles.length})
                </Typography>
                <Grid container spacing={2}>
                  {selectedFiles.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AttachFileIcon color="primary" />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          {/* Botones de acción sobrios */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 2, 
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setFormData({
                  client: '',
                  amount: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                  paymentMethod: 'transferencia',
                  account: '',
                  bank: ''
                });
                setSelectedFiles([]);
                setSelectedIncome(null);
              }}
              disabled={saving}
              sx={{ 
                borderRadius: 1,
                fontWeight: 500
              }}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <RefreshIcon /> : <SaveIcon />}
              onClick={handleSaveIncome}
              disabled={saving || !formData.client.trim() || !formData.amount || !formData.date}
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                '&:disabled': {
                  background: theme.palette.action.disabled
                }
              }}
            >
              {saving ? 'Guardando...' : (selectedIncome ? 'Actualizar Ingreso' : 'Registrar Ingreso')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para ver detalles */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Ingreso
        </DialogTitle>
        <DialogContent>
          {selectedIncome && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cliente: {selectedIncome.client}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Monto: {formatCurrency(selectedIncome.amount)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Fecha: {format(selectedIncome.date, 'dd/MM/yyyy')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Método de Pago: {selectedIncome.paymentMethod}
              </Typography>
              {selectedIncome.description && (
                <Typography variant="body1" gutterBottom>
                  Descripción: {selectedIncome.description}
                </Typography>
              )}
              {selectedIncome.attachments && selectedIncome.attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Archivos adjuntos:
                  </Typography>
                  {selectedIncome.attachments.map((file, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AttachFileIcon />}
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        {file.name}
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este ingreso?
            {incomeToDelete && (
              <>
                <br />
                <strong>Cliente:</strong> {incomeToDelete.client}
                <br />
                <strong>Monto:</strong> {formatCurrency(incomeToDelete.amount)}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncomePage;

