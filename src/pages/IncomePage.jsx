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
  Checkbox,
  FormControlLabel,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Autocomplete
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
  
  // 🎨 Colores dinámicos del tema (igual que el sidebar)
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  
  // Estados principales
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el modal de agregar/editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  
  // Estado para autocompletado de clientes
  const [uniqueClients, setUniqueClients] = useState([]);
  
  // Estados para distribución por empresas
  const [companies, setCompanies] = useState([]);
  const [personalAccounts, setPersonalAccounts] = useState([]);
  const [distributions, setDistributions] = useState([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    client: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'transferencia',
    account: '',
    bank: '',
    isClientPaidInFull: false
  });
  
  const [saving, setSaving] = useState(false);
  
  // Estados para archivos/comprobantes
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Función para obtener cuentas bancarias (empresariales y personales)
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

  // Función para manejar la selección de cuenta bancaria
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
        
        // Extraer clientes únicos para autocompletado
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

  // Calcular estadísticas
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

  // Manejar checkbox "al día"
  const handlePaidInFullChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isClientPaidInFull: checked
    }));

    // Si se marca como "al día" y no es una edición, abrir modal de distribución
    if (checked && !selectedIncome) {
      // Validar campos requeridos antes de abrir distribución
      if (!formData.client.trim() || !formData.amount || !formData.date) {
        showError('Por favor completa Cliente, Monto y Fecha antes de marcar como "al día"');
        setFormData(prev => ({
          ...prev,
          isClientPaidInFull: false
        }));
        return;
      }
      handleOpenDistributionDialog();
    }
  };

  // ====================================
  // 📎 FUNCIONES PARA MANEJO DE ARCHIVOS
  // ====================================

  // Validar archivos (reutilizable para drag y click)
  const validateFiles = (files) => {
    return files.filter(file => {
      // Validar tipo de archivo (imágenes y PDFs)
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        showError(`${file.name}: Solo se permiten imágenes (JPG, PNG, WEBP) y archivos PDF`);
        return false;
      }

      // Validar tamaño (máximo 10MB)
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
  // 🖱️ FUNCIONES DRAG AND DROP
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
    // Solo quitar dragOver si realmente salimos del área
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

  // Abrir modal para agregar ingreso
  const handleAddIncome = () => {
    setSelectedIncome(null);
    setSelectedFiles([]);
    setUploadProgress({});
    setDragOver(false);
    setFormData({
      client: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'transferencia',
      account: '',
      bank: '',
      isClientPaidInFull: false
    });
    setDialogOpen(true);
  };

  // Abrir modal para editar ingreso
  const handleEditIncome = (income) => {
    setSelectedIncome(income);
    setFormData({
      client: income.client || '',
      amount: income.amount?.toString() || '',
      description: income.description || '',
      date: income.date ? format(income.date, 'yyyy-MM-dd') : '',
      paymentMethod: income.paymentMethod || 'transferencia',
      account: income.account || '',
      bank: income.bank || '',
      isClientPaidInFull: income.isClientPaidInFull || false
    });
    setDialogOpen(true);
  };

  // Ver detalles del ingreso
  const handleViewIncome = (income) => {
    setSelectedIncome(income);
    setViewDialogOpen(true);
  };

  // Confirmar eliminación
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
        isClientPaidInFull: formData.isClientPaidInFull || false,
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
        // Crear nuevo (solo si NO está marcado como "al día")
        if (!formData.isClientPaidInFull) {
          incomeData.createdAt = Timestamp.fromDate(new Date());
          const incomeDoc = await addDoc(collection(db, 'incomes'), incomeData);
          incomeId = incomeDoc.id;
          
          // Subir archivos después de crear el documento
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
        } else {
          // Si está marcado como "al día", el guardado se hace desde el modal de distribución
          showInfo('Complete la distribución por empresas para finalizar');
          setSaving(false);
          return;
        }
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('Error guardando ingreso:', error);
      showError('Error al guardar el ingreso: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para distribución por empresas
  const handleOpenDistributionDialog = () => {
    if (companies.length === 0) {
      showWarning('Primero debe registrar empresas en el sistema');
      return;
    }

    // Inicializar distribuciones vacías para todas las empresas
    const initialDistributions = companies.map(company => ({
      companyId: company.id,
      companyName: company.name,
      amount: 0
    }));
    setDistributions(initialDistributions);
    setDistributionDialogOpen(true);
  };

  const handleDistributionChange = (companyId, amount) => {
    setDistributions(prev =>
      prev.map(dist =>
        dist.companyId === companyId
          ? { ...dist, amount: parseFloat(amount) || 0 }
          : dist
      )
    );
  };

  const getTotalDistribution = () => {
    return distributions.reduce((sum, dist) => sum + dist.amount, 0);
  };

  const handleSaveWithDistribution = async () => {
    const totalDistribution = getTotalDistribution();
    const incomeAmount = parseFloat(formData.amount);

    if (totalDistribution !== incomeAmount) {
      addToast({
        type: 'error',
        title: 'Error en distribución',
        message: `La suma de la distribución ($${totalDistribution.toLocaleString()}) debe ser igual al monto del ingreso ($${incomeAmount.toLocaleString()})`
      });
      return;
    }

    setSaving(true);

    try {
      // Guardar el ingreso
      const incomeData = {
        client: formData.client.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: Timestamp.fromDate(new Date(formData.date)),
        paymentMethod: formData.paymentMethod,
        account: formData.account.trim(),
        bank: formData.bank.trim(),
        isClientPaidInFull: true,
        createdBy: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const incomeDoc = await addDoc(collection(db, 'incomes'), incomeData);
      const incomeId = incomeDoc.id;

      // Subir archivos si hay
      let uploadedFiles = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadFiles(incomeId);
        if (uploadedFiles.length > 0) {
          await updateDoc(doc(db, 'incomes', incomeId), {
            attachments: uploadedFiles
          });
        }
      }

      // Guardar la distribución
      const distributionData = {
        incomeId: incomeId,
        client: formData.client.trim(),
        totalAmount: parseFloat(formData.amount),
        distributions: distributions.filter(dist => dist.amount > 0),
        createdBy: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date())
      };

      await addDoc(collection(db, 'income_distributions'), distributionData);

      addToast({
        type: 'success',
        title: 'Ingreso y distribución guardados',
        message: uploadedFiles.length > 0 
          ? `Ingreso registrado con distribución y ${uploadedFiles.length} archivo(s)`
          : 'El ingreso ha sido registrado con su distribución por empresas'
      });

      setDialogOpen(false);
      setDistributionDialogOpen(false);
    } catch (error) {
      console.error('Error guardando ingreso con distribución:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Error al guardar: ' + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDistributionDialog = () => {
    setDistributionDialogOpen(false);
    // Si el usuario cancela, desmarcar el checkbox
    if (!selectedIncome) {
      setFormData(prev => ({
        ...prev,
        isClientPaidInFull: false
      }));
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            💰 Gestión de Ingresos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registra y gestiona todos los pagos recibidos de clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddIncome}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)'
            }
          }}
        >
          Registrar Ingreso
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Ingresos',
            value: stats.total,
            icon: <ReceiptIcon />,
            color: '#2196f3'
          },
          {
            title: 'Monto Total',
            value: formatCurrency(stats.totalAmount),
            icon: <AttachMoneyIcon />,
            color: '#4caf50'
          },
          {
            title: 'Este Mes',
            value: stats.monthlyTotal,
            icon: <CalendarIcon />,
            color: '#ff9800'
          },
          {
            title: 'Monto Mensual',
            value: formatCurrency(stats.monthlyAmount),
            icon: <TrendingUpIcon />,
            color: '#9c27b0'
          }
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
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Lista de ingresos */}
      {incomes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default
            }}
          >
            <AttachMoneyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              No hay ingresos registrados
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Comienza registrando tu primer ingreso de cliente
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddIncome}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
              }}
            >
              Registrar Primer Ingreso
            </Button>
          </Paper>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {incomes.map((income, index) => (
              <Grid item xs={12} md={6} lg={4} key={income.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <CardContent>
                      {/* Header con cliente y monto */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getCategoryIcon(income.category)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {income.client}
                            </Typography>
                            {income.company && (
                              <Typography variant="caption" color="text.secondary">
                                {income.company}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {formatCurrency(income.amount)}
                        </Typography>
                      </Box>

                      {/* Descripción */}
                      {income.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {income.description}
                        </Typography>
                      )}

                      {/* Detalles */}
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(income.date, 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccountBalanceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Chip
                            label={income.paymentMethod}
                            size="small"
                            color={getPaymentMethodColor(income.paymentMethod)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Acciones */}
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleViewIncome(income)}
                            sx={{ color: 'primary.main' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditIncome(income)}
                            sx={{ color: 'warning.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteIncome(income)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Dialog para agregar/editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 24px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          color: 'common.white',
          py: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
            pointerEvents: 'none'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {selectedIncome ? <EditIcon /> : <AddIcon />}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                {selectedIncome ? '✏️ Editar Ingreso' : '✨ Registrar Nuevo Ingreso'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                {selectedIncome ? 'Modifica los detalles del ingreso' : 'Complete la información del nuevo pago recibido'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 2.5, position: 'relative' }}>
          {/* Decorative background elements */}
          <Box sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${primaryColor}06, ${secondaryColor}03)`,
            filter: 'blur(30px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              {/* Información Principal */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.06)',
                  mb: 1.5
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: primaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PersonIcon sx={{ fontSize: 20 }} /> Información Principal
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        fullWidth
                        freeSolo
                        options={uniqueClients}
                        value={formData.client}
                        onChange={(event, newValue) => {
                          handleFormChange('client', newValue || '');
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleFormChange('client', newInputValue);
                        }}
                        disabled={saving}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Cliente"
                            required
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon sx={{ color: primaryColor }} />
                                </InputAdornment>
                              )
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                                    : '0 4px 12px rgba(0, 0, 0, 0.08)'
                                },
                                '&.Mui-focused': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 12px ${primaryColor}20`
                                }
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Monto"
                        value={formData.amount ? formatCurrency(formData.amount) : ''}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        disabled={saving}
                        required
                        placeholder="$0"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoneyIcon sx={{ color: '#4caf50' }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.08)'
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Fecha"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleFormChange('date', e.target.value)}
                        disabled={saving}
                        required
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon sx={{ color: '#ff9800' }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
                                : '0 8px 25px rgba(0, 0, 0, 0.1)'
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)'
                            }
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Método de Pago</InputLabel>
                        <Select
                          value={formData.paymentMethod}
                          onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                          disabled={saving}
                          label="Método de Pago"
                          startAdornment={
                            <InputAdornment position="start">
                              <AccountBalanceIcon sx={{ color: '#2196f3' }} />
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 2,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
                                : '0 8px 25px rgba(0, 0, 0, 0.1)'
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)'
                            }
                          }}
                        >
                          <MenuItem value="transferencia">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccountBalanceIcon sx={{ fontSize: 18, color: '#2196f3' }} />
                              Transferencia
                            </Box>
                          </MenuItem>
                          <MenuItem value="consignacion">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ReceiptIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                              Consignación
                            </Box>
                          </MenuItem>
                          <MenuItem value="efectivo">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AttachMoneyIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                              Efectivo
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Descripción */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.06)',
                  mb: 1.5
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: secondaryColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <DescriptionIcon sx={{ fontSize: 20 }} /> Descripción
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Descripción del ingreso"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    disabled={saving}
                    placeholder="Describe los detalles del pago..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                          <DescriptionIcon sx={{ color: secondaryColor, fontSize: 20 }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.08)'
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${secondaryColor}20`
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>

              {/* Información Bancaria */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                    : '0 4px 20px rgba(0, 0, 0, 0.06)',
                  mb: 1.5
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: '#9c27b0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AccountBalanceIcon sx={{ fontSize: 20 }} /> Información Bancaria
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Número de Cuenta</InputLabel>
                        <Select
                          value={formData.account}
                          label="Número de Cuenta"
                          onChange={(e) => handleBankAccountSelect(e.target.value)}
                          disabled={saving}
                          startAdornment={
                            <InputAdornment position="start">
                              <AccountBalanceIcon sx={{ color: '#9c27b0', fontSize: 18 }} />
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.08)'
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)'
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Seleccionar cuenta bancaria</em>
                          </MenuItem>
                          {getBankAccounts().map((account) => (
                            <MenuItem 
                              key={`${account.id}-${account.bankAccount}-${account.type}`} 
                              value={account.bankAccount}
                              sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'flex-start',
                                py: 1.5,
                                gap: 0.5
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="body2" fontWeight="medium" sx={{ flex: 1 }}>
                                  {account.bankAccount}
                                </Typography>
                                <Chip 
                                  label={account.type === 'personal' ? 'Personal' : 'Empresarial'}
                                  size="small"
                                  color={account.type === 'personal' ? 'secondary' : 'primary'}
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: '0.7rem', 
                                    height: 20,
                                    '& .MuiChip-label': {
                                      px: 0.8
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {account.bankName} - {account.companyName}
                              </Typography>
                            </MenuItem>
                          ))}
                          {getBankAccounts().length === 0 && (
                            <MenuItem disabled>
                              <Typography variant="body2" color="text.secondary">
                                No hay cuentas bancarias registradas en las empresas
                              </Typography>
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Banco"
                        value={formData.bank}
                        onChange={(e) => handleFormChange('bank', e.target.value)}
                        disabled={true} // Siempre deshabilitado porque se autocompleta
                        placeholder="Se autocompletará al seleccionar una cuenta"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon sx={{ color: '#9c27b0', fontSize: 18 }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease',
                            backgroundColor: theme.palette.action.hover,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.08)'
                            }
                          },
                          '& .MuiInputLabel-root.Mui-disabled': {
                            color: theme.palette.text.secondary
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Mensaje informativo sobre cuentas bancarias */}
                  {getBankAccounts().length === 0 && (
                    <Box 
                      sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)',
                        borderRadius: 2,
                        border: `1px solid rgba(156, 39, 176, 0.2)`
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#9c27b0', fontWeight: 500, mb: 0.5 }}>
                        💡 Consejo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Para tener cuentas bancarias disponibles, primero regístralas en la sección de Empresas. 
                        Allí puedes agregar el número de cuenta, banco y certificación bancaria de cada empresa.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Sección de archivos adjuntos con Drag & Drop */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(145deg, rgba(76, 175, 80, 0.03) 0%, rgba(67, 160, 71, 0.05) 100%)'
                    : 'linear-gradient(145deg, rgba(232, 245, 233, 0.6) 0%, rgba(220, 237, 200, 0.7) 100%)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.2)'}`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                    : '0 4px 20px rgba(76, 175, 80, 0.1)',
                }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: '#4caf50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CloudUploadIcon sx={{ fontSize: 20 }} /> Comprobantes de Pago
                  </Typography>
                  
                  {/* Zona de Drag & Drop mejorada */}
                  <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                      border: dragOver 
                        ? `2px dashed #4caf50` 
                        : `1px dashed rgba(76, 175, 80, 0.3)`,
                      borderRadius: 2,
                      p: 2.5,
                      textAlign: 'center',
                      backgroundColor: dragOver 
                        ? 'rgba(76, 175, 80, 0.08)' 
                        : 'rgba(76, 175, 80, 0.03)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.06)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -30,
                        left: -30,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(76, 175, 80, 0.08) 0%, transparent 70%)',
                        opacity: dragOver ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: 'none'
                      }
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    
                    <motion.div
                      animate={dragOver ? { scale: 1.05, rotate: [0, 2, -2, 0] } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CloudUploadIcon 
                        sx={{ 
                          fontSize: 48, 
                          color: dragOver ? '#4caf50' : 'rgba(76, 175, 80, 0.6)',
                          mb: 1.5,
                          transition: 'all 0.2s ease',
                          filter: dragOver ? 'drop-shadow(0 2px 8px rgba(76, 175, 80, 0.3))' : 'none'
                        }} 
                      />
                    </motion.div>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 0.5, 
                        color: dragOver ? '#4caf50' : '#388e3c',
                        fontWeight: 600,
                        textShadow: dragOver ? '0 1px 4px rgba(76, 175, 80, 0.2)' : 'none'
                      }}
                    >
                      {dragOver ? '¡Suelta los archivos aquí!' : '✨ Arrastra archivos aquí'}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                      o haz click para seleccionar desde tu dispositivo
                    </Typography>
                    
                    <label htmlFor="file-upload">
                      <Button
                        variant={dragOver ? 'contained' : 'outlined'}
                        component="span"
                        size="large"
                        startIcon={<AttachFileIcon />}
                        disabled={saving || uploading}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          background: dragOver 
                            ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                            : 'transparent',
                          borderColor: '#4caf50',
                          color: dragOver ? 'white' : '#4caf50',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                            color: 'white',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)'
                          }
                        }}
                      >
                        {dragOver ? 'Procesar Archivos' : 'Seleccionar Archivos'}
                      </Button>
                    </label>
                    
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      mt: 2, 
                      color: 'text.secondary',
                      fontWeight: 500
                    }}>
                      📄 Imágenes (JPG, PNG, WEBP) y PDF • Máximo 10MB por archivo
                    </Typography>
                  </Box>

                  {/* Lista de archivos seleccionados mejorada */}
                  {selectedFiles.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ 
                        mb: 2, 
                        fontWeight: 700,
                        color: '#4caf50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <ReceiptIcon /> Archivos Seleccionados ({selectedFiles.length})
                      </Typography>
                      <List sx={{ 
                        bgcolor: 'background.paper', 
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        overflow: 'hidden'
                      }}>
                        {selectedFiles.map((file, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <ListItem 
                              sx={{ 
                                borderBottom: index < selectedFiles.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(76, 175, 80, 0.05)',
                                  transform: 'translateX(4px)'
                                }
                              }}
                            >
                              <ListItemIcon>
                                <Box sx={{
                                  p: 1,
                                  borderRadius: 2,
                                  bgcolor: file.type === 'application/pdf' ? 'error.light' : 'primary.light',
                                  color: 'white'
                                }}>
                                  {file.type === 'application/pdf' ? 
                                    <DescriptionIcon /> : 
                                    <AttachFileIcon />
                                  }
                                </Box>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {file.name}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip 
                                      label={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                    <Chip 
                                      label={file.type === 'application/pdf' ? 'PDF' : 'Imagen'}
                                      size="small"
                                      color={file.type === 'application/pdf' ? 'error' : 'success'}
                                      variant="filled"
                                    />
                                  </Box>
                                }
                              />
                              {uploadProgress[index] && (
                                <Box sx={{ mr: 2, minWidth: 80, textAlign: 'center' }}>
                                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                    {Math.round(uploadProgress[index])}%
                                  </Typography>
                                  <Box sx={{ 
                                    width: '100%', 
                                    height: 4, 
                                    bgcolor: 'grey.200', 
                                    borderRadius: 2, 
                                    overflow: 'hidden',
                                    mt: 0.5
                                  }}>
                                    <Box sx={{
                                      width: `${uploadProgress[index]}%`,
                                      height: '100%',
                                      bgcolor: 'primary.main',
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </Box>
                                </Box>
                              )}
                              <ListItemSecondaryAction>
                                <Tooltip title="Eliminar archivo">
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleRemoveFile(index)}
                                    disabled={uploading}
                                    sx={{
                                      color: 'error.main',
                                      '&:hover': {
                                        bgcolor: 'error.light',
                                        color: 'error.contrastText',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <DeleteFileIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          </motion.div>
                        ))}
                      </List>
                    </Box>
                  )}

                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mt: 2,
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: 24
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            📤 Subiendo archivos...
                          </Typography>
                          <Typography variant="body2">
                            Por favor espere mientras procesamos sus documentos
                          </Typography>
                        </Box>
                      </Alert>
                    </motion.div>
                  )}
                </Box>
              </Grid>
              
              {/* Checkbox de Cliente al Día - Mejorado */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    background: theme.palette.mode === 'dark' 
                      ? `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}08 100%)`
                      : `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
                    border: `1px solid ${formData.isClientPaidInFull ? primaryColor : 'rgba(0, 0, 0, 0.06)'}`,
                    boxShadow: formData.isClientPaidInFull 
                      ? `0 4px 20px ${primaryColor}20`
                      : theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                        : '0 4px 20px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: formData.isClientPaidInFull 
                        ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
                        : 'transparent',
                      transition: 'all 0.2s ease'
                    }
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isClientPaidInFull}
                          onChange={(e) => handlePaidInFullChange(e.target.checked)}
                          disabled={saving}
                          icon={
                            <Box sx={{
                              width: 20,
                              height: 20,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }} />
                          }
                          checkedIcon={
                            <Box sx={{
                              width: 20,
                              height: 20,
                              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              boxShadow: `0 2px 8px ${primaryColor}30`
                            }}>
                              ✓
                            </Box>
                          }
                          sx={{
                            '&:hover': {
                              bgcolor: 'transparent',
                            },
                            '& .MuiSvgIcon-root': {
                              fontSize: 28
                            }
                          }}
                        />
                      }
                      label={
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: formData.isClientPaidInFull ? primaryColor : 'text.primary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5
                          }}>
                            {formData.isClientPaidInFull ? '✅' : '💰'} Cliente queda al día con este pago
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            {formData.isClientPaidInFull 
                              ? '🎉 Perfecto! Se abrirá un formulario para distribuir el monto entre empresas'
                              : 'Si marcas esta opción, podrás distribuir el pago entre diferentes empresas'
                            }
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        margin: 0,
                        alignItems: 'flex-start',
                        width: '100%'
                      }}
                    />
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2, 
          gap: 1.5,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)'
            : 'linear-gradient(145deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.8) 100%)',
          backdropFilter: 'blur(15px)',
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            variant="outlined"
            size="medium"
            startIcon={<CancelIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: 'none',
              borderColor: 'error.main',
              color: 'error.main',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'error.dark',
                backgroundColor: 'error.light',
                color: 'error.contrastText',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveIncome}
            disabled={saving}
            variant="contained"
            size="medium"
            startIcon={saving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <RefreshIcon sx={{ fontSize: 18 }} />
              </motion.div>
            ) : <SaveIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 1.5,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${primaryColor}DD 0%, ${secondaryColor}DD 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 20px ${primaryColor}30`
              },
              '&:disabled': {
                background: theme.palette.action.disabled,
                color: theme.palette.action.disabled,
              }
            }}
          >
            {saving ? 'Guardando...' : (selectedIncome ? 'Actualizar Ingreso' : 'Guardar Ingreso')}
          </Button>
        </DialogActions>
      </Dialog>

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
        <DialogContent dividers>
          {selectedIncome && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cliente
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedIncome.client}
                </Typography>
              </Grid>
              {selectedIncome.company && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Empresa
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.company}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monto
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(selectedIncome.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Fecha
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {format(selectedIncome.date, 'dd MMM yyyy', { locale: es })}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Descripción
                </Typography>
                <Typography variant="body1">
                  {selectedIncome.description || 'Sin descripción'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Método de Pago
                </Typography>
                <Chip
                  label={selectedIncome.paymentMethod}
                  color={getPaymentMethodColor(selectedIncome.paymentMethod)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Categoría
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getCategoryIcon(selectedIncome.category)}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.category}
                  </Typography>
                </Box>
              </Grid>
              {selectedIncome.account && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Número de Cuenta
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.account}
                  </Typography>
                </Grid>
              )}
              {selectedIncome.bank && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Banco
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.bank}
                  </Typography>
                </Grid>
              )}
              {selectedIncome.reference && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Referencia
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.reference}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer.
          </Typography>
          {incomeToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Cliente:</strong> {incomeToDelete.client}<br />
                <strong>Monto:</strong> {formatCurrency(incomeToDelete.amount)}<br />
                <strong>Fecha:</strong> {format(incomeToDelete.date, 'dd MMM yyyy', { locale: es })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Distribución por Empresas */}
      <Dialog
        open={distributionDialogOpen}
        onClose={() => !saving && handleCloseDistributionDialog()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${primaryColor}80 0%, ${secondaryColor}80 50%, ${primaryColor}60 100%)`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor}CC 100%)`,
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : `0 4px 20px ${primaryColor}30`,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.5rem',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }
        }}>
          <BusinessIcon />
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.02em'
              }}
            >
              Distribución por Empresas
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95, 
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              Cliente: {formData.client}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ position: 'relative', minHeight: 400, p: 0 }}>
          {/* Header fijo con total a distribuir y progreso */}
          <Box sx={{ 
            position: 'sticky',
            top: -1,
            bgcolor: 'background.paper',
            zIndex: 10,
            borderBottom: `1px solid ${theme.palette.divider}`,
            p: 3,
            mb: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.4)' 
              : '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Total a Distribuir: <Chip 
                  label={`$${parseFloat(formData.amount || 0).toLocaleString()}`} 
                  color="primary" 
                  variant="filled" 
                  size="medium"
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.9rem',
                    ml: 1
                  }}
                />
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {companies.length} empresas
                </Typography>
                <Chip 
                  label={getTotalDistribution() === parseFloat(formData.amount || 0) ? "✅ Completo" : `${Math.round((getTotalDistribution() / parseFloat(formData.amount || 1)) * 100)}%`}
                  color={getTotalDistribution() === parseFloat(formData.amount || 0) ? "success" : "warning"}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
              Especifica cuánto corresponde a cada empresa. La suma debe ser igual al monto total.
            </Typography>
            {/* Barra de progreso visual mejorada */}
            <Box sx={{ 
              width: '100%', 
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200', 
              borderRadius: 2,
              height: 10,
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              mb: 1
            }}>
              <Box sx={{
                width: `${Math.min((getTotalDistribution() / parseFloat(formData.amount || 1)) * 100, 100)}%`,
                height: '100%',
                bgcolor: getTotalDistribution() === parseFloat(formData.amount || 0) 
                  ? 'success.main' 
                  : getTotalDistribution() > parseFloat(formData.amount || 0)
                    ? 'error.main'
                    : 'warning.main',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: getTotalDistribution() > 0 
                  ? '0 2px 8px rgba(0,0,0,0.2)' 
                  : 'none'
              }} />
            </Box>
            {/* Indicador numérico del progreso */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              typography: 'caption',
              color: 'text.secondary',
              fontWeight: 500
            }}>
              <span>
                Distribuido: ${getTotalDistribution().toLocaleString()}
              </span>
              <span>
                {getTotalDistribution() === parseFloat(formData.amount || 0) 
                  ? '✅ Completo' 
                  : `Falta: $${(parseFloat(formData.amount || 0) - getTotalDistribution()).toLocaleString()}`
                }
              </span>
            </Box>
          </Box>

          <Box sx={{ px: 3 }}>
            <Grid container spacing={2}>
              {companies.map((company) => (
              <Grid item xs={12} md={6} key={company.id}>
                <Card sx={{ 
                  p: 2.5,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { 
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 25px rgba(0,0,0,0.4)' 
                      : '0 8px 25px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)',
                    borderColor: 'primary.main'
                  },
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {company.logoURL ? (
                      <Box
                        sx={{
                          width: 50,
                          height: 35,
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 0.5,
                          backgroundColor: 'background.paper'
                        }}
                      >
                        <Box
                          component="img"
                          src={company.logoURL}
                          alt={`Logo de ${company.name}`}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                    ) : (
                      <Avatar sx={{ 
                        bgcolor: 'primary.main', 
                        mr: 2, 
                        width: 40, 
                        height: 40,
                        fontSize: 16,
                        fontWeight: 'bold'
                      }}>
                        {company.name.charAt(0)}
                      </Avatar>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {company.name}
                    </Typography>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Monto para esta empresa"
                    type="number"
                    value={distributions.find(d => d.companyId === company.id)?.amount || ''}
                    onChange={(e) => handleDistributionChange(company.id, e.target.value)}
                    disabled={saving}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2
                        }
                      }
                    }}
                  />
                </Card>
              </Grid>
            ))}
            </Grid>
          </Box>

          {/* Resumen de la distribución */}
          <Box sx={{ mt: 3, p: 2, mx: 3, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Distribuido:</strong>
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Chip 
                  label={`$${getTotalDistribution().toLocaleString()}`} 
                  color={getTotalDistribution() === parseFloat(formData.amount || 0) ? "success" : "warning"}
                  variant="filled"
                />
              </Grid>
              <Grid item xs={3}>
                <Chip 
                  label={getTotalDistribution() === parseFloat(formData.amount || 0) ? "✅ Correcto" : "⚠️ Ajustar"}
                  color={getTotalDistribution() === parseFloat(formData.amount || 0) ? "success" : "warning"}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDistributionDialog}
            disabled={saving}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveWithDistribution}
            disabled={saving || getTotalDistribution() !== parseFloat(formData.amount || 0)}
            variant="contained"
            startIcon={saving ? <RefreshIcon className="animate-spin" /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Guardar con Distribución'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncomePage;
