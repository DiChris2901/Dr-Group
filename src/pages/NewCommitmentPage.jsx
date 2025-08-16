import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Fab,
  Tooltip,
  Switch,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  AccountBalance as BankIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Repeat as RepeatIcon,
  Timeline as TimelineIcon,
  Event as EventIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { getPaymentMethodOptions } from '../utils/formatUtils';
import { 
  generateRecurringCommitments, 
  saveRecurringCommitments, 
  getPeriodicityDescription,
  calculateNextDueDates 
} from '../utils/recurringCommitments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '../context/SettingsContext';
import ConfigurationCompatibilityAnalyzer from '../components/settings/ConfigurationCompatibilityAnalyzer';

const NewCommitmentPage = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { settings } = useSettings();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  // Estados para autocompletado
  const [providersSuggestions, setProvidersSuggestions] = useState([]);
  const [conceptsSuggestions, setConceptsSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  
  // Estado para el analizador de compatibilidad
  const [showCompatibilityAnalyzer, setShowCompatibilityAnalyzer] = useState(false);

  // Obtener empresa preseleccionada desde la navegación
  const preselectedCompany = location.state?.preselectedCompany;

  // 🔄 Calcular número de compromisos sugerido según periodicidad (para 1 año)
  const getDefaultRecurringCount = (periodicity) => {
    const counts = {
      'monthly': 12,      // 12 meses = 1 año
      'bimonthly': 6,     // 6 bimestres = 1 año  
      'quarterly': 4,     // 4 trimestres = 1 año
      'fourmonthly': 3,   // 3 cuatrimestres = 1 año
      'biannual': 2,      // 2 semestres = 1 año
      'annual': 1         // 1 año
    };
    return counts[periodicity] || 12;
  };

  // Formulario para nuevo compromiso
  const [formData, setFormData] = useState({
    companyId: preselectedCompany?.id || '',
    companyName: preselectedCompany?.name || '',
    month: new Date().getMonth() + 1, // Mes actual (1-12)
    year: new Date().getFullYear(), // Año actual
    dueDate: null, // Fecha de vencimiento específica
    periodicity: 'monthly', // unique, monthly, bimonthly, quarterly, fourmonthly, biannual, annual
    beneficiary: '',
    beneficiaryNit: '', // 🆔 NIT o identificación del beneficiario
    concept: '',
    baseAmount: '', // 💰 Valor base (antes era 'amount')
    iva: '', // 📊 IVA
    retefuente: '', // 📉 Retención en la fuente
  ica: '', // 🏙️ ICA
  discount: '', // 🏷️ Descuento
  invoiceNumber: '', // 🧾 Número de Factura
  hasTaxes: false, // ✅ Mostrar/ocultar impuestos y descuentos
    totalAmount: '', // 💵 Total calculado
    paymentMethod: 'transfer', // transfer, check, cash, debit, credit
    observations: '',
    deferredPayment: false,
    status: 'pending', // pending, paid, overdue
    // 🔄 Solo contador para compromisos recurrentes (automático según periodicidad)
    recurringCount: getDefaultRecurringCount('monthly'), // Valor dinámico basado en periodicidad inicial
    // 📄 Campo para factura
    invoiceFile: null,
    invoiceURL: null,
    invoiceFileName: null
  });

  // Estados para subida de archivo
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 💰 Funciones para formateo de moneda colombiana
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const cleanValue = value.toString().replace(/[^\d]/g, '');
    if (!cleanValue) return '';
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseFormattedNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\./g, '');
  };

  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    const formattedValue = formatNumberWithCommas(cleanValue);
    
    // Actualizar el valor formateado en el estado
    setFormData(prev => ({
      ...prev,
      baseAmount: cleanValue // Guardamos el valor sin formato para cálculos
    }));
  };

  const handleIvaChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    setFormData(prev => ({
      ...prev,
      iva: cleanValue
    }));
  };

  const handleRetefuenteChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    setFormData(prev => ({
      ...prev,
      retefuente: cleanValue
    }));
  };

  const handleIcaChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);

    setFormData(prev => ({
      ...prev,
      ica: cleanValue
    }));
  };

  const handleDiscountChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);

    setFormData(prev => ({
      ...prev,
      discount: cleanValue
    }));
  };

  // 🧮 Calcular automáticamente el total
  const calculateTotal = () => {
    const base = parseFloat(formData.baseAmount) || 0;
    if (!formData.hasTaxes) return base;
    const iva = parseFloat(formData.iva) || 0;
    const retefuente = parseFloat(formData.retefuente) || 0;
    const ica = parseFloat(formData.ica) || 0;
    const discount = parseFloat(formData.discount) || 0;
    // Total a Pagar = Valor base + IVA + Retefuente + ICA - Descuento
    return base + iva + retefuente + ica - discount;
  };

  // Actualizar total automáticamente cuando cambien los valores
  React.useEffect(() => {
    const total = calculateTotal();
    setFormData(prev => ({
      ...prev,
      totalAmount: total.toString()
    }));
  }, [formData.baseAmount, formData.iva, formData.retefuente, formData.ica, formData.discount, formData.hasTaxes]);

  // 📎 Estados y funciones para drag & drop
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!saving && !uploadingFile) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (saving || uploadingFile) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Simular el evento de selección de archivo
      const mockEvent = {
        target: {
          files: [file]
        }
      };
      handleFileSelect(mockEvent);
    }
  };

  // 🎨 Design System Spectacular - Configuraciones dinámicas
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;
  const fontSize = settings?.theme?.fontSize || 14;
  
  // 📧 Configuraciones de Notificaciones
  const notificationsEnabled = settings?.notifications?.enabled !== false;
  const notificationSoundEnabled = settings?.notifications?.sound !== false;
  
  // 📐 Configuraciones de Layout
  const compactMode = settings?.sidebar?.compactMode || false;

  // Función para obtener colores dinámicos basados en configuraciones
  const getThemeColor = (colorName) => {
    if (colorName === 'primary') return primaryColor;
    if (colorName === 'secondary') return secondaryColor;
    return theme.palette.mode === 'dark' 
      ? theme.palette[colorName]?.dark || theme.palette[colorName]?.main 
      : theme.palette[colorName]?.main;
  };

  // Función para obtener gradiente dinámico con configuraciones
  const getGradientBackground = () => {
    return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  };

  // Cargar empresas desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoadingCompanies(true);

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
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
        setLoadingCompanies(false);
      },
      (error) => {
        console.error('Error fetching companies:', error);
        addNotification({
          type: 'error',
          title: 'Error al cargar empresas',
          message: 'No se pudieron cargar las empresas disponibles',
          icon: 'error',
          color: 'error'
        });
        setLoadingCompanies(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, addNotification]);

  // Cargar sugerencias para autocompletado desde proveedores y compromisos
  useEffect(() => {
    if (!currentUser) return;

    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        // Cargar proveedores desde la colección providers
        const providersQuery = query(collection(db, 'providers'), orderBy('name'));
        const providersSnapshot = await getDocs(providersQuery);
        
        const providers = [];
        providersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name && data.name.trim()) {
            providers.push({
              name: data.name.trim(),
              nit: data.nit?.trim() || '',
              id: doc.id
            });
          }
        });
        
        // Cargar conceptos desde compromisos existentes
        const commitmentsQuery = query(collection(db, 'commitments'));
        const commitmentsSnapshot = await getDocs(commitmentsQuery);
        
        const conceptsSet = new Set();
        commitmentsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.concept && data.concept.trim()) {
            conceptsSet.add(data.concept.trim());
          }
        });
        
        setProvidersSuggestions(providers);
        setConceptsSuggestions(Array.from(conceptsSet).sort());
      } catch (error) {
        console.error('Error loading suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, [currentUser]);

  // Mostrar notificación cuando se preselecciona una empresa
  useEffect(() => {
    if (preselectedCompany && companies.length > 0) {
      addNotification({
        type: 'info',
        title: 'Empresa preseleccionada',
        message: `Se ha preseleccionado "${preselectedCompany.name}" para el nuevo compromiso`,
        icon: 'info',
        color: 'info'
      });
    }
  }, [preselectedCompany, companies, addNotification]);

  // 🔄 Actualizar contador de compromisos según periodicidad
  useEffect(() => {
    if (formData.periodicity && formData.periodicity !== 'unique') {
      const defaultCount = getDefaultRecurringCount(formData.periodicity);
      setFormData(prev => ({
        ...prev,
        recurringCount: defaultCount
      }));
    }
  }, [formData.periodicity]);

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    // Detectar cambio de periodicidad para mostrar toast informativo
    if (field === 'periodicity') {
      const wasUnique = formData.periodicity === 'unique';
      const isNowRecurring = value !== 'unique';
      
      // Toast informativo cuando se activa recurrencia
      if (wasUnique && isNowRecurring && formData.dueDate) {
        setTimeout(() => {
          if (notificationsEnabled) {
            // Calcular próximas fechas para el toast
            const nextDates = calculateNextDueDates(formData.dueDate, value, 3);
            const nextDatesText = nextDates.slice(1, 3).map(date => 
              format(date, 'dd/MM/yyyy', { locale: es })
            ).join(', ');
            
            addNotification({
              type: 'info',
              title: '🔄 Pagos Recurrentes Activados',
              message: `Se configuró periodicidad ${getPeriodicityDescription(value).toLowerCase()}. Próximas fechas: ${nextDatesText}`,
              icon: 'info',
              color: 'info',
              duration: 5000
            });
          }
        }, 300); // Pequeño delay para que se vea el cambio visual primero
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si cambia la empresa, actualizar el nombre
    if (field === 'companyId') {
      const selectedCompany = companies.find(company => company.id === value);
      setFormData(prev => ({
        ...prev,
        companyName: selectedCompany?.name || ''
      }));
    }
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      companyId: '',
      companyName: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: null,
      periodicity: 'monthly',
      beneficiary: '',
      beneficiaryNit: '',
      concept: '',
  invoiceNumber: '',
      baseAmount: '',
      iva: '',
      retefuente: '',
  ica: '',
  discount: '',
  hasTaxes: false,
      totalAmount: '',
      paymentMethod: 'transfer',
      observations: '',
      deferredPayment: false,
      status: 'pending',
      invoiceFile: null,
      invoiceURL: null,
      invoiceFileName: null
    });
    setUploadProgress(0);
  };

  // 📄 Funciones para manejo de archivos
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addNotification({
        type: 'error',
        title: 'Tipo de archivo no válido',
        message: 'Solo se permiten archivos PDF o imágenes (JPG, PNG, WebP)',
        icon: 'error',
        color: 'error'
      });
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      addNotification({
        type: 'error',
        title: 'Archivo muy grande',
        message: 'El archivo no puede superar los 10MB',
        icon: 'error',
        color: 'error'
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      invoiceFile: file,
      invoiceFileName: file.name
    }));

    addNotification({
      type: 'success',
      title: 'Archivo seleccionado',
      message: `Archivo "${file.name}" listo para subir`,
      icon: 'success',
      color: 'success'
    });
  };

  const uploadInvoiceFile = async (file) => {
    if (!file) return null;

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Generar nombre único para el archivo
      const timestamp = new Date().getTime();
      const extension = file.name.split('.').pop();
      const fileName = `invoices/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
      
      // Crear referencia en Firebase Storage
      const storageRef = ref(storage, fileName);
      
      // Simular progreso de subida (Firebase no proporciona progreso real para uploadBytes)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      addNotification({
        type: 'success',
        title: 'Factura subida exitosamente',
        message: `El archivo "${file.name}" se subió correctamente`,
        icon: 'success',
        color: 'success'
      });

      return {
        url: downloadURL,
        fileName: file.name,
        storagePath: fileName
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      addNotification({
        type: 'error',
        title: 'Error al subir archivo',
        message: 'No se pudo subir la factura. Inténtalo de nuevo.',
        icon: 'error',
        color: 'error'
      });
      return null;
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const removeInvoiceFile = async () => {
    try {
      // Si hay un archivo ya subido, eliminarlo de Storage
      if (formData.invoiceURL) {
        const storageRef = ref(storage, formData.invoiceURL);
        await deleteObject(storageRef);
      }
      
      setFormData(prev => ({
        ...prev,
        invoiceFile: null,
        invoiceURL: null,
        invoiceFileName: null
      }));

      addNotification({
        type: 'info',
        title: 'Archivo eliminado',
        message: 'La factura fue eliminada',
        icon: 'info',
        color: 'info'
      });
    } catch (error) {
      console.error('Error removing file:', error);
      addNotification({
        type: 'warning',
        title: 'Archivo eliminado localmente',
        message: 'El archivo fue eliminado del formulario',
        icon: 'warning',
        color: 'warning'
      });
    }
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.companyId) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'Debe seleccionar una empresa',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    if (!formData.beneficiary.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El beneficiario es obligatorio',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    if (!formData.concept.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El concepto es obligatorio',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    if (!formData.baseAmount || parseFloat(formData.baseAmount) <= 0) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El valor base debe ser mayor a cero',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    return true;
  };

  // Guardar compromiso
  const handleSaveCommitment = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // 📄 Subir archivo de factura si existe
      let invoiceData = null;
      if (formData.invoiceFile) {
        const uploadResult = await uploadInvoiceFile(formData.invoiceFile);
        if (uploadResult) {
          invoiceData = {
            url: uploadResult.url,
            fileName: uploadResult.fileName,
            storagePath: uploadResult.storagePath,
            uploadedAt: serverTimestamp()
          };
        }
      }

      const commitmentData = {
        ...formData,
        amount: parseFloat(formData.totalAmount), // El campo amount en la BD será el total
        baseAmount: parseFloat(formData.baseAmount),
        iva: parseFloat(formData.iva) || 0,
        retefuente: parseFloat(formData.retefuente) || 0,
  ica: parseFloat(formData.ica) || 0,
  discount: parseFloat(formData.discount) || 0,
  hasTaxes: !!formData.hasTaxes,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
        // Agregar datos de factura si existe
        invoice: invoiceData
      };

      // Limpiar campos de archivo del objeto que se guarda en Firestore
      delete commitmentData.invoiceFile;
      delete commitmentData.invoiceURL;
      delete commitmentData.invoiceFileName;

      // 🏢 Auto-guardar proveedor si no existe
      if (formData.beneficiary && formData.beneficiary.trim()) {
        try {
          const providersQuery = query(
            collection(db, 'providers'), 
            where('name', '==', formData.beneficiary.trim())
          );
          const existingProvider = await getDocs(providersQuery);
          
          if (existingProvider.empty) {
            // Crear nuevo proveedor
            const providerData = {
              name: formData.beneficiary.trim(),
              nit: formData.beneficiaryNit?.trim() || '',
              createdAt: serverTimestamp(),
              createdBy: currentUser.uid,
              updatedAt: serverTimestamp(),
              updatedBy: currentUser.uid
            };
            
            await addDoc(collection(db, 'providers'), providerData);
            console.log('✅ Nuevo proveedor guardado:', providerData.name);
          } else if (formData.beneficiaryNit?.trim()) {
            // Actualizar NIT si el proveedor existe pero no tiene NIT o es diferente
            const providerDoc = existingProvider.docs[0];
            const currentNit = providerDoc.data().nit;
            
            if (!currentNit || currentNit !== formData.beneficiaryNit.trim()) {
              await updateDoc(providerDoc.ref, {
                nit: formData.beneficiaryNit.trim(),
                updatedAt: serverTimestamp(),
                updatedBy: currentUser.uid
              });
              console.log('✅ NIT del proveedor actualizado:', formData.beneficiary);
            }
          }
        } catch (error) {
          console.warn('Error al guardar proveedor:', error);
          // No detener el proceso si falla el guardado del proveedor
        }
      }

      // 🔄 Si la periodicidad NO es "único", generar compromisos recurrentes automáticamente
      if (formData.periodicity !== 'unique') {
        // Generar compromisos recurrentes automáticamente
        const recurringCommitments = await generateRecurringCommitments(
          commitmentData, 
          formData.recurringCount || 12
        );

        // Guardar todos los compromisos recurrentes
        const result = await saveRecurringCommitments(recurringCommitments);

        // 🔊 Notificación de éxito para compromisos recurrentes
        if (notificationsEnabled) {
          if (notificationSoundEnabled) {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeCSGh2u+8g');
            audio.volume = 0.2;
            audio.play().catch(() => {});
          }
          
          // Calcular próximas fechas para mostrar en la notificación
          const nextDates = calculateNextDueDates(new Date(formData.dueDate), formData.periodicity, 3);
          const nextDatesText = nextDates.slice(1).map(date => 
            format(date, 'dd/MM/yyyy', { locale: es })
          ).join(', ');
          
          addNotification({
            type: 'success',
            title: '🔄 Sistema de Pagos Recurrentes Activado',
            message: `Se crearon ${result.count} compromisos ${getPeriodicityDescription(formData.periodicity).toLowerCase()} para "${formData.companyName}". Próximas fechas: ${nextDatesText}${result.count > 3 ? ' y más...' : ''}`,
            icon: 'success',
            color: 'success',
            duration: 8000 // Más tiempo para leer la información completa
          });

          // 📋 Notificación adicional para el centro de notificaciones con detalles de recurrencia
          addNotification({
            type: 'info',
            title: '📊 Registro de Compromiso Recurrente',
            message: `✅ Sistema recurrente configurado: ${getPeriodicityDescription(formData.periodicity)} • ${result.count} instancias • Beneficiario: ${formData.beneficiary} • Monto: $${parseFloat(formData.totalAmount || 0).toLocaleString('es-CO')} c/u • ID Grupo: ${result.groupId?.split('_')[1]}`,
            icon: 'info',
            color: 'info',
            duration: 10000 // Mayor duración para información detallada
          });
        }
      } else {
        // Guardar compromiso único
        await addDoc(collection(db, 'commitments'), commitmentData);
        
        // 🔊 Notificación con sonido condicional
        if (notificationsEnabled) {
          if (notificationSoundEnabled) {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeCSGh2u+8g');
            audio.volume = 0.2;
            audio.play().catch(() => {});
          }
          
          addNotification({
            type: 'success',
            title: '💼 Compromiso Único Creado',
            message: `Se creó exitosamente el compromiso para "${formData.companyName}" por $${parseFloat(formData.amount).toLocaleString('es-CO')}`,
            icon: 'success',
            color: 'success'
          });

          // 📋 Notificación adicional para el centro de notificaciones con detalles
          addNotification({
            type: 'info',
            title: '📝 Registro de Compromiso Individual',
            message: `✅ Pago único registrado • Beneficiario: ${formData.beneficiary} • Vencimiento: ${format(new Date(formData.dueDate), 'dd/MM/yyyy', { locale: es })} • Monto: $${parseFloat(formData.amount).toLocaleString('es-CO')} • Método: ${formData.paymentMethod}`,
            icon: 'info',
            color: 'info',
            duration: 8000
          });
        }
      }

      // Navegar de vuelta a la lista de compromisos
      navigate('/commitments');
    } catch (error) {
      console.error('Error saving commitment:', error);
      addNotification({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo crear el compromiso. Inténtalo de nuevo.',
        icon: 'error',
        color: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancelar y volver
  const handleCancel = () => {
    navigate('/commitments');
  };

  // Opciones para los selects
  const periodicityOptions = [
    { value: 'unique', label: 'Pago único' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'bimonthly', label: 'Bimestral' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'fourmonthly', label: 'Cuatrimestral' },
    { value: 'biannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' }
  ];

  const paymentMethods = getPaymentMethodOptions();

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const years = [];
  for (let i = new Date().getFullYear() - 2; i <= new Date().getFullYear() + 5; i++) {
    years.push({ value: i, label: i.toString() });
  }

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loadingCompanies) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando empresas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Banner Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            background: getGradientBackground(),
            borderRadius: `${borderRadius}px`,
            p: compactMode ? 3 : 4,
            mb: 3,
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
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: `${borderRadius}px`,
              zIndex: 0,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: `${borderRadius / 2}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AssignmentIcon sx={{ fontSize: fontSize * 2.3, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="700" sx={{ 
                  color: 'white', 
                  mb: 0.5,
                  fontSize: `${fontSize + 8}px`
                }}>
                  Nuevo Compromiso Financiero
                </Typography>
                <Typography variant="subtitle1" sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: `${fontSize + 2}px`
                }}>
                  Registra un nuevo compromiso para gestión empresarial
                </Typography>
              </Box>
            </Box>
            
            {preselectedCompany && (
              <motion.div
                initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0 }}
                transition={animationsEnabled ? { duration: 0.4, delay: 0.2 } : { duration: 0.1 }}
              >
                <Chip
                  label={`Empresa preseleccionada: ${preselectedCompany.name}`}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                  variant="outlined"
                  icon={<BusinessIcon />}
                />
              </motion.div>
            )}
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={animationsEnabled ? { duration: 0.5, delay: 0.1 } : { duration: 0.1 }}
      >
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: `${borderRadius}px`,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
              '&:hover': animationsEnabled ? {
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              } : {}
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                {/* Información de la Empresa */}
                <Grid item xs={12}>
                  <motion.div
                    initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={animationsEnabled ? { duration: 0.5, delay: 0.2 } : { duration: 0.1 }}
                  >
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: `${borderRadius}px`,
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                        '&:hover': animationsEnabled ? {
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: primaryColor,
                          transform: 'translateY(-1px)'
                        } : {}
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Box
                          sx={{
                            p: 1,
                            background: getGradientBackground(),
                            borderRadius: `${borderRadius / 2}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                              : '0 4px 12px rgba(0, 0, 0, 0.15)',
                            mr: 2
                          }}
                        >
                          <BusinessIcon sx={{ 
                            fontSize: fontSize + 6, 
                            color: 'white'
                          }} />
                        </Box>
                        <Typography variant="h6" fontWeight="600" sx={{ 
                          color: theme.palette.text.primary,
                          fontSize: `${fontSize + 4}px`
                        }}>
                          Información de la Empresa
                        </Typography>
                      </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Empresa</InputLabel>
                          <Select
                            value={formData.companyId}
                            label="Empresa"
                            onChange={(e) => handleFormChange('companyId', e.target.value)}
                            disabled={saving}
                          >
                            {companies.map((company) => (
                              <MenuItem key={company.id} value={company.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {company.logoURL && (
                                    <img 
                                      src={company.logoURL} 
                                      alt={company.name}
                                      style={{ width: 24, height: 24, borderRadius: 4 }}
                                    />
                                  )}
                                  <Box>
                                    <Typography variant="body2" fontWeight="500">
                                      {company.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      NIT: {company.nit}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                  </motion.div>
                </Grid>

                {/* Detalles del Compromiso */}
                <Grid item xs={12}>
                  <motion.div
                    initial={animationsEnabled ? { opacity: 0, x: 20 } : { opacity: 1 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={animationsEnabled ? { duration: 0.5, delay: 0.3 } : { duration: 0.1 }}
                  >
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: `${borderRadius}px`,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.03)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                      '&:hover': animationsEnabled ? {
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: primaryColor,
                        transform: 'translateY(-1px)'
                      } : {}
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <Box
                        sx={{
                          p: 1,
                          background: getGradientBackground(),
                          borderRadius: `${borderRadius / 2}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <DescriptionIcon sx={{ fontSize: fontSize + 6, color: 'white' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="600" sx={{ 
                        color: theme.palette.text.primary,
                        fontSize: `${fontSize + 4}px`
                      }}>
                        Detalles del Compromiso
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                      {/* Fila 1: Mes, Año, Periodicidad */}
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Mes</InputLabel>
                          <Select
                            value={formData.month}
                            label="Mes"
                            onChange={(e) => handleFormChange('month', e.target.value)}
                            disabled={saving}
                          >
                            {months.map((month) => (
                              <MenuItem key={month.value} value={month.value}>
                                {month.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Box position="relative">
                          <FormControl fullWidth required>
                            <InputLabel>Periodicidad</InputLabel>
                            <Select
                              value={formData.periodicity}
                              label="Periodicidad"
                              onChange={(e) => handleFormChange('periodicity', e.target.value)}
                              disabled={saving}
                              startAdornment={
                                <InputAdornment position="start" sx={{ ml: 1 }}>
                                  <ScheduleIcon color="info" fontSize="small" />
                                </InputAdornment>
                              }
                              sx={{ 
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              {periodicityOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  <Box display="flex" alignItems="center">
                                    <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                                    {option.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Badge Dinámico */}
                          {formData.periodicity !== 'unique' && formData.dueDate && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: -10 }}
                              transition={{ duration: 0.2, type: "spring", damping: 20 }}
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: 8,
                                zIndex: 1
                              }}
                            >
                              <Chip
                                icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                                label={(() => {
                                  if (!formData.dueDate) return `${formData.recurringCount || getDefaultRecurringCount(formData.periodicity)} cuotas`;
                                  const nextDates = calculateNextDueDates(formData.dueDate, formData.periodicity, 2);
                                  const nextDate = nextDates[1];
                                  return nextDate ? `Próxima: ${format(nextDate, 'dd/MM', { locale: es })}` : `${formData.recurringCount || getDefaultRecurringCount(formData.periodicity)} cuotas`;
                                })()}
                                size="small"
                                color="info"
                                variant="filled"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 20,
                                  backgroundColor: alpha(theme.palette.info.main, 0.9),
                                  color: 'white',
                                  fontWeight: 500,
                                  boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`,
                                  '& .MuiChip-icon': {
                                    fontSize: 12,
                                    color: 'white'
                                  }
                                }}
                              />
                            </motion.div>
                          )}
                        </Box>
                      </Grid>

                      {/* Fila 2: Beneficiario, Concepto */}
                      <Grid item xs={12} md={8}>
                        <Autocomplete
                          freeSolo
                          options={providersSuggestions}
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            return option?.name || '';
                          }}
                          value={formData.beneficiary}
                          onChange={(event, newValue) => {
                            if (typeof newValue === 'object' && newValue?.name) {
                              // Si selecciona un proveedor de las sugerencias, auto-llenar NIT
                              handleFormChange('beneficiary', newValue.name);
                              if (newValue.nit) {
                                handleFormChange('beneficiaryNit', newValue.nit);
                              }
                            } else {
                              // Si es texto libre
                              handleFormChange('beneficiary', newValue || '');
                            }
                          }}
                          onInputChange={(event, newInputValue) => {
                            handleFormChange('beneficiary', newInputValue || '');
                          }}
                          disabled={saving}
                          loading={loadingSuggestions}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              required
                              label="Beneficiario / Proveedor"
                              placeholder="Nombre de la entidad o persona a quien se le paga"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PersonIcon 
                                      sx={{ 
                                        color: primaryColor,
                                        transition: animationsEnabled ? 'all 0.3s ease' : 'none'
                                      }} 
                                    />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <>
                                    {loadingSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                                sx: {
                                  borderRadius: `${borderRadius}px`,
                                  '& .MuiOutlinedInput-root': {
                                    transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                                    '&:hover': animationsEnabled ? {
                                      borderColor: primaryColor,
                                      transform: 'translateY(-1px)',
                                      boxShadow: theme.palette.mode === 'dark' 
                                        ? `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)` 
                                        : `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.15)`
                                    } : {},
                                    '&.Mui-focused': {
                                      borderColor: primaryColor,
                                      borderWidth: 2,
                                      transform: 'translateY(-1px)',
                                      boxShadow: theme.palette.mode === 'dark' 
                                        ? `0 6px 16px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.3)` 
                                        : `0 6px 16px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)`
                                    }
                                  }
                                }
                              }}
                            />
                          )}
                          sx={{
                            '& .MuiAutocomplete-listbox': {
                              borderRadius: `${borderRadius}px`,
                              fontSize: `${fontSize}px`
                            },
                            '& .MuiAutocomplete-option': {
                              transition: animationsEnabled ? 'all 0.2s ease' : 'none',
                              '&:hover': animationsEnabled ? {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? `rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.1)` 
                                  : `rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.08)`,
                                transform: 'translateX(4px)'
                              } : {}
                            }
                          }}
                        />
                      </Grid>

                      {/* Sección 2: Beneficiario / Proveedor y NIT */}
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="NIT/Identificación"
                          value={formData.beneficiaryNit}
                          onChange={(e) => handleFormChange('beneficiaryNit', e.target.value)}
                          disabled={saving}
                          placeholder="Ej: 900123456-1 o 12345678"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AssignmentIcon sx={{ color: primaryColor }} />
                              </InputAdornment>
                            )
                          }}
                          helperText="NIT, CC, CE o documento de identificación"
                        />
                      </Grid>

                      {/* Sección 3: Concepto y Número de Factura */}
                      <Grid item xs={12} md={8}>
                        <Autocomplete
                          freeSolo
                          options={conceptsSuggestions}
                          value={formData.concept}
                          onChange={(event, newValue) => {
                            handleFormChange('concept', newValue || '');
                          }}
                          onInputChange={(event, newInputValue) => {
                            handleFormChange('concept', newInputValue || '');
                          }}
                          disabled={saving}
                          loading={loadingSuggestions}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              required
                              label="Concepto"
                              placeholder="Descripción del pago o servicio"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <DescriptionIcon 
                                      sx={{ 
                                        color: primaryColor,
                                        transition: animationsEnabled ? 'all 0.3s ease' : 'none'
                                      }} 
                                    />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <>
                                    {loadingSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                                sx: {
                                  borderRadius: `${borderRadius}px`,
                                  '& .MuiOutlinedInput-root': {
                                    transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                                    '&:hover': animationsEnabled ? {
                                      borderColor: primaryColor,
                                      transform: 'translateY(-1px)',
                                      boxShadow: theme.palette.mode === 'dark' 
                                        ? `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)` 
                                        : `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.15)`
                                    } : {},
                                    '&.Mui-focused': {
                                      borderColor: primaryColor,
                                      borderWidth: 2,
                                      transform: 'translateY(-1px)',
                                      boxShadow: theme.palette.mode === 'dark' 
                                        ? `0 6px 16px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.3)` 
                                        : `0 6px 16px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)`
                                    }
                                  }
                                }
                              }}
                            />
                          )}
                          sx={{
                            '& .MuiAutocomplete-listbox': {
                              borderRadius: `${borderRadius}px`,
                              fontSize: `${fontSize}px`
                            },
                            '& .MuiAutocomplete-option': {
                              transition: animationsEnabled ? 'all 0.2s ease' : 'none',
                              '&:hover': animationsEnabled ? {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? `rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.1)` 
                                  : `rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.08)`,
                                transform: 'translateX(4px)'
                              } : {}
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Número de Factura"
                          value={formData.invoiceNumber}
                          onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                          disabled={saving}
                          placeholder="Ej: FAC-0001"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AssignmentIcon sx={{ color: primaryColor }} />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          required
                          label="Valor Base"
                          value={formData.baseAmount ? formatNumberWithCommas(formData.baseAmount) : ''}
                          onChange={handleAmountChange}
                          disabled={saving}
                          placeholder="0"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon color="primary" />
                                $
                              </InputAdornment>
                            ),
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                '&.Mui-focused': {
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.success.main,
                                    borderWidth: 2,
                                  }
                                }
                              }
                            }
                          }}
                          helperText="Valor antes de impuestos"
                        />
                      </Grid>

                      {/* Mostrar/Ocultar Impuestos */}
                      <Grid item xs={12} md={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!formData.hasTaxes}
                              onChange={(e) => handleFormChange('hasTaxes', e.target.checked)}
                              disabled={saving}
                              color="primary"
                            />
                          }
                          label={<Typography>Este compromiso tiene impuestos y/o descuentos</Typography>}
                          sx={{ mt: { xs: 1, md: 0 } }}
                        />
                      </Grid>

                      {/* IVA */}
                      {formData.hasTaxes && (
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="IVA"
                          value={formData.iva ? formatNumberWithCommas(formData.iva) : ''}
                          onChange={handleIvaChange}
                          disabled={saving}
                          placeholder="0"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                  📊 $
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                          helperText="Impuesto al Valor Agregado"
                        />
                      </Grid>
                      )}

                      {/* Retefuente */}
                      {formData.hasTaxes && (
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Retefuente"
                          value={formData.retefuente ? formatNumberWithCommas(formData.retefuente) : ''}
                          onChange={handleRetefuenteChange}
                          disabled={saving}
                          placeholder="0"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                                  📉 $
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                          helperText="Retefuente aplicada"
                        />
                      </Grid>
                      )}

                      {/* ICA */}
                      {formData.hasTaxes && (
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="ICA"
                          value={formData.ica ? formatNumberWithCommas(formData.ica) : ''}
                          onChange={handleIcaChange}
                          disabled={saving}
                          placeholder="0"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>
                                  🏙️ $
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                          helperText="Impuesto de Industria y Comercio"
                        />
                      </Grid>
                      )}

                      {/* Descuento */}
                      {formData.hasTaxes && (
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Descuento"
                          value={formData.discount ? formatNumberWithCommas(formData.discount) : ''}
                          onChange={handleDiscountChange}
                          disabled={saving}
                          placeholder="0"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                  🔻 $
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                          helperText="Descuento aplicado"
                        />
                      </Grid>
                      )}

                      {/* Total calculado */}
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Total a pagar"
                          value={formData.totalAmount ? formatNumberWithCommas(formData.totalAmount) : '0'}
                          disabled={true}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                                  💵 $
                                </Typography>
                              </InputAdornment>
                            ),
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: alpha(theme.palette.success.main, 0.05),
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.success.main,
                                  borderWidth: 2
                                }
                              },
                              '& .MuiInputBase-input': {
                                fontWeight: 600,
                                color: theme.palette.success.main,
                                fontSize: '1.1rem'
                              }
                            }
                          }}
                          helperText={formData.hasTaxes
                            ? `Base + IVA + Retefuente + ICA - Descuento = ${formatCurrency(formData.totalAmount || 0)}`
                            : `Total = Base = ${formatCurrency(formData.totalAmount || 0)}`}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth required>
                          <InputLabel>Método de pago</InputLabel>
                          <Select
                            value={formData.paymentMethod}
                            label="Método de pago"
                            onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                            disabled={saving}
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PaymentIcon color="primary" fontSize="small" />
                                  {method.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Fila 4: Fecha de vencimiento, Pago aplazado */}
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Fecha de vencimiento"
                          value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => handleFormChange('dueDate', e.target.value ? new Date(e.target.value) : null)}
                          disabled={saving}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                          helperText="Fecha específica de vencimiento del compromiso"
                        />
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.deferredPayment}
                              onChange={(e) => handleFormChange('deferredPayment', e.target.checked)}
                              disabled={saving}
                              color="primary"
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <ScheduleIcon color="primary" fontSize="small" />
                              <Typography variant="body1" fontWeight="500">
                                Pago aplazado
                              </Typography>
                            </Box>
                          }
                          sx={{ 
                            m: 0,
                            p: 2.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '56px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.02)' 
                              : 'rgba(0, 0, 0, 0.01)',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'rgba(0, 0, 0, 0.03)',
                              transform: 'translateY(-1px)'
                            },
                            '& .MuiFormControlLabel-label': {
                              flex: 1,
                              marginLeft: 1.5
                            }
                          }}
                        />
                      </Grid>

            {/* Sección 4: Comentarios */}
                      <Grid item xs={12} md={9}>
                        <TextField
                          fullWidth
              label="Comentarios"
                          value={formData.observations}
                          onChange={(e) => handleFormChange('observations', e.target.value)}
                          disabled={saving}
                          multiline
                          rows={3}
                          placeholder="Información adicional, notas importantes, condiciones especiales..."
                        />
                      </Grid>

                      {/* Fila 6: Factura */}
                      <Grid item xs={12}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <AttachFileIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                              Factura (opcional):
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1.5 }}>
                            {!formData.invoiceFile && !formData.invoiceFileName ? (
                              <Box
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  px: 2,
                                  py: 1,
                                  border: `1px dashed ${isDragOver ? primaryColor : theme.palette.divider}`,
                                  borderRadius: 2,
                                  background: isDragOver 
                                    ? alpha(primaryColor, 0.08)
                                    : 'transparent',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  maxWidth: 200,
                                  '&:hover': {
                                    borderColor: primaryColor,
                                    borderStyle: 'solid',
                                    background: alpha(primaryColor, 0.04)
                                  }
                                }}
                                component="label"
                              >
                                <input
                                  type="file"
                                  hidden
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  onChange={handleFileSelect}
                                  disabled={saving || uploadingFile}
                                />
                                
                                <CloudUploadIcon 
                                  sx={{ 
                                    color: isDragOver ? primaryColor : theme.palette.text.secondary,
                                    fontSize: 18,
                                    transition: 'all 0.3s ease'
                                  }} 
                                />
                                
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: '0.875rem',
                                    color: isDragOver ? primaryColor : theme.palette.text.secondary,
                                    fontWeight: 500
                                  }}
                                >
                                  {isDragOver ? 'Soltar aquí' : 'Seleccionar'}
                                </Typography>
                              </Box>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    border: `1px solid ${alpha(primaryColor, 0.2)}`,
                                    borderRadius: 2,
                                    background: alpha(primaryColor, 0.03),
                                    maxWidth: 400
                                  }}
                                >
                                  <FileIcon sx={{ color: primaryColor, fontSize: 20 }} />
                                  
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 500,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.875rem'
                                      }}
                                    >
                                      {formData.invoiceFileName}
                                    </Typography>
                                    
                                    {formData.invoiceFile && (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        {(formData.invoiceFile.size / 1024 / 1024).toFixed(1)} MB
                                      </Typography>
                                    )}
                                  </Box>

                                  <IconButton
                                    onClick={removeInvoiceFile}
                                    disabled={saving || uploadingFile}
                                    size="small"
                                    sx={{
                                      color: theme.palette.text.secondary,
                                      '&:hover': {
                                        color: theme.palette.error.main,
                                        backgroundColor: alpha(theme.palette.error.main, 0.1)
                                      }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>

                                {uploadingFile && (
                                  <Box sx={{ mt: 1, maxWidth: 400 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={uploadProgress}
                                      size="small"
                                      sx={{
                                        height: 3,
                                        borderRadius: 1.5,
                                        backgroundColor: alpha(primaryColor, 0.1),
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: primaryColor
                                        }
                                      }}
                                    />
                                  </Box>
                                )}
                              </motion.div>
                            )}

                            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                              PDF, JPG, PNG • Max. 10MB
                            </Typography>
                          </Box>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </Paper>
                  </motion.div>
                </Grid>

                {/* Estilos CSS para animaciones */}
                <style>{`
                  @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                  }
                `}</style>

                {/* Botones de Acción */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Divider sx={{ 
                      my: 3, 
                      borderColor: theme.palette.divider
                    }} />
                    <Box 
                      display="flex" 
                      gap={2} 
                      justifyContent="flex-end"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(0, 0, 0, 0.02)'
                      }}
                    >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={saving}
                        sx={{ 
                          borderRadius: `${borderRadius}px`,
                          px: 3,
                          py: 1.5,
                          borderWidth: 2,
                          fontSize: `${fontSize}px`,
                          fontWeight: 600,
                          textTransform: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': animationsEnabled ? {
                            borderWidth: 2,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 8px 20px rgba(255, 255, 255, 0.15)' 
                              : '0 8px 20px rgba(0, 0, 0, 0.2)',
                            '&::before': {
                              opacity: 1,
                            }
                          } : {},
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${theme.palette.action.hover}, transparent)`,
                            transition: animationsEnabled ? 'all 0.6s ease' : 'none',
                            opacity: 0,
                          },
                          '&:hover::before': animationsEnabled ? {
                            left: '100%',
                            opacity: 1,
                          } : {},
                          transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                        }}
                      >
                        Cancelar
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={animationsEnabled ? { scale: 1.02 } : {}}
                      whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                    >
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveCommitment}
                        disabled={
                          saving ||
                          !formData.companyId ||
                          !formData.month ||
                          !formData.periodicity ||
                          !formData.beneficiary?.trim() ||
                          !formData.concept?.trim() ||
                          !(parseFloat(formData.baseAmount) > 0) ||
                          !formData.paymentMethod
                        }
                        sx={{ 
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          minWidth: 180,
                          background: getGradientBackground(),
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: `${fontSize + 2}px`,
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 8px 25px rgba(0, 0, 0, 0.4)' 
                            : '0 8px 25px rgba(0, 0, 0, 0.15)',
                          border: 'none',
                          '&:hover': animationsEnabled ? {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 12px 40px rgba(0, 0, 0, 0.5)' 
                              : '0 12px 40px rgba(0, 0, 0, 0.2)'
                          } : {},
                          '&:active': animationsEnabled ? {
                            transform: 'translateY(-1px) scale(0.98)',
                          } : {},
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: animationsEnabled ? 'all 0.6s ease' : 'none',
                            opacity: 0,
                          },
                          '&:hover::before': animationsEnabled ? {
                            left: '100%',
                            opacity: 1,
                          } : {},
                          '&:disabled': {
                            opacity: 0.6,
                            transform: 'none'
                          },
                          transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                        }}
                      >
                        {saving ? 'Guardando...' : 'Guardar Compromiso'}
                      </Button>
                    </motion.div>
                  </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Información de ayuda */}
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: 30, scale: 0.95 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={animationsEnabled ? { 
            duration: 0.6, 
            delay: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 15
          } : { duration: 0.1 }}
        >
          <motion.div
            animate={animationsEnabled ? { 
              boxShadow: [
                theme.palette.mode === 'dark' 
                  ? `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)` 
                  : `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.1)`,
                theme.palette.mode === 'dark' 
                  ? `0 8px 20px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.3)` 
                  : `0 8px 20px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)`,
                theme.palette.mode === 'dark' 
                  ? `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.2)` 
                  : `0 4px 12px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.1)`
              ]
            } : {}}
            transition={animationsEnabled ? { 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            } : {}}
          >
            <Alert 
              severity="info" 
              sx={{ 
                mt: 3, 
                borderRadius: `${borderRadius}px`,
                border: `1px solid ${theme.palette.info.main}`,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(33, 150, 243, 0.1)' 
                  : 'rgba(33, 150, 243, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.1), transparent)',
                  animation: animationsEnabled ? 'shimmer 3s infinite' : 'none',
                },
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                },
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  fontSize: fontSize * 2,
                  animation: animationsEnabled ? 'pulse 2s infinite' : 'none',
                },
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' }
                },
                '& .MuiAlert-message': {
                  fontSize: `${fontSize + 1}px`,
                  position: 'relative',
                  zIndex: 1
                },
                transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                '&:hover': animationsEnabled ? {
                  transform: 'translateY(-2px)',
                  borderColor: theme.palette.info.dark,
                } : {}
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  style={{ display: 'inline-block' }}
                >
                  <Box component="span" sx={{ fontWeight: 700, color: theme.palette.info.main, fontSize: '1.2em' }}>
                    💡
                  </Box>
                </motion.span>
                <Box component="span" sx={{ fontWeight: 700, color: theme.palette.info.main, ml: 1 }}>
                  Tip:
                </Box>
                {' '}Los compromisos mensuales, trimestrales y anuales se renovarán automáticamente 
                según la frecuencia seleccionada. Los compromisos únicos no se renovarán.
              </Typography>
            </Alert>
          </motion.div>
        </motion.div>

        {/* Floating Action Button para Analizador de Compatibilidad */}
        <Tooltip 
          title="Analizar Compatibilidad de Configuraciones"
          placement="left"
        >
          <Fab
            onClick={() => setShowCompatibilityAnalyzer(true)}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              color: 'white',
              zIndex: 1000,
              transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              '&:hover': animationsEnabled ? {
                transform: 'scale(1.1) rotate(15deg)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 12px 30px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 30px rgba(0, 0, 0, 0.25)',
              } : {},
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
                : '0 8px 25px rgba(0, 0, 0, 0.15)',
            }}
          >
            <motion.div
              animate={animationsEnabled ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <SettingsIcon sx={{ fontSize: 28 }} />
            </motion.div>
          </Fab>
        </Tooltip>

        {/* Analizador de Compatibilidad de Configuraciones */}
        <ConfigurationCompatibilityAnalyzer
          pageName="NewCommitmentPage"
          pageUrl="http://localhost:5173/commitments/new"
          isOpen={showCompatibilityAnalyzer}
          onClose={() => setShowCompatibilityAnalyzer(false)}
        />
      </Box>
    );
  };

export default NewCommitmentPage;