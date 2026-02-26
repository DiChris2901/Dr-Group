import {
  Assignment as AssignmentIcon,
  AttachFile as AttachFileIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  InsertDriveFile as FileIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Repeat as RepeatIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { alpha, useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useSettings } from '../context/SettingsContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { getPaymentMethodOptions } from '../utils/formatUtils';
import {
  calculateNextDueDates,
  generateRecurringCommitments,
  getPeriodicityDescription,
  saveRecurringCommitments
} from '../utils/recurringCommitments';
// 🗜️ IMPORTAR SISTEMA DE COMPRESIÓN
import PDFCompressionPreview from '../components/common/PDFCompressionPreview';
import { drGroupCompressor } from '../utils/pdfCompressor';
// 📄 IMPORTAR SISTEMA DE COMBINACIÓN
import { combineFilesToPDF } from '../utils/pdfCombiner';
import {
  createLocalDate,
  getDefaultRecurringCount,
  formatNitId,
  isColjuegosCommitment as isColjuegosCheck,
  formatNumberWithCommas,
  parseFormattedNumber,
  createAmountChangeHandler,
  calculateTotal as calcTotalHelper,
  getMissingFields as getMissingFieldsHelper,
  formatCurrency,
  periodicityOptions,
  MONTHS
} from './commitments/commitmentHelpers';

const NewCommitmentPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const { logActivity } = useActivityLogs();
  const { settings } = useSettings();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // 🏢 Estados para modal de selección de empresa
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyLocked, setCompanyLocked] = useState(false);
  const [selectedCompanyInModal, setSelectedCompanyInModal] = useState(null);
  
  // Estados para autocompletado
  const [providersSuggestions, setProvidersSuggestions] = useState([]);
  const [conceptsSuggestions, setConceptsSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Obtener empresa preseleccionada desde la navegación
  const preselectedCompany = location.state?.preselectedCompany;

  // 🎮 Detectar si es compromiso de Coljuegos (wrapper over imported pure function)
  const isColjuegosCommitment = () => isColjuegosCheck(formData.beneficiary);

  // Formulario para nuevo compromiso
  const [formData, setFormData] = useState({
    companyId: preselectedCompany?.id || '',
    companyName: preselectedCompany?.name || '',
    month: new Date().getMonth() + 1, // Mes actual (1-12)
    year: new Date().getFullYear(), // Año actual
    dueDate: null, // Fecha de vencimiento específica
    periodicity: 'unique', // unique, monthly, bimonthly, quarterly, fourmonthly, biannual, annual
    beneficiary: '',
    beneficiaryNit: '', // 🆔 NIT o identificación del beneficiario
    concept: '',
    baseAmount: '', // 💰 Valor base (antes era 'amount')
    // 🎮 Campos específicos de Coljuegos
    derechosExplotacion: '', // Derechos de Explotación
    gastosAdministracion: '', // Gastos de Administración
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
    // 📄 Campos para facturas (múltiples archivos)
    invoiceFiles: [],
    invoiceURLs: [],
    invoiceFileNames: []
  });

  // 📅 useEffect para manejar parámetros del calendario
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fromCalendar = urlParams.get('fromCalendar');
    
    if (fromCalendar === 'true') {
      const dateParam = urlParams.get('date');
      const conceptParam = urlParams.get('concept');
      const amountParam = urlParams.get('amount');
      const companyParam = urlParams.get('company');

      // Pre-llenar formulario con datos del calendario
      setFormData(prev => ({
        ...prev,
        ...(dateParam && { dueDate: createLocalDate(dateParam) }),
        ...(conceptParam && { concept: decodeURIComponent(conceptParam) }),
        ...(amountParam && { baseAmount: amountParam }),
        ...(companyParam && { beneficiary: decodeURIComponent(companyParam) })
      }));

      // Mostrar notificación informativa
      addNotification({
        type: 'info',
        message: 'Formulario pre-llenado desde el calendario',
        duration: 3000
      });
    }
  }, [location.search, addNotification]);

  // Estados para subida de archivo
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 🗜️ ESTADO PARA COMPRESIÓN DE PDFs
  const [compressionPreviewOpen, setCompressionPreviewOpen] = useState(false);
  const [pendingPDFFile, setPendingPDFFile] = useState(null);
  const [compressionEnabled, setCompressionEnabled] = useState(true);

  // 💰 Amount change handlers (factory pattern from commitmentHelpers)
  const handleAmountChange = createAmountChangeHandler('baseAmount', parseFormattedNumber, setFormData);
  const handleIvaChange = createAmountChangeHandler('iva', parseFormattedNumber, setFormData);
  const handleRetefuenteChange = createAmountChangeHandler('retefuente', parseFormattedNumber, setFormData);
  const handleIcaChange = createAmountChangeHandler('ica', parseFormattedNumber, setFormData);
  const handleDiscountChange = createAmountChangeHandler('discount', parseFormattedNumber, setFormData);
  const handleDerechosChange = createAmountChangeHandler('derechosExplotacion', parseFormattedNumber, setFormData);
  const handleGastosChange = createAmountChangeHandler('gastosAdministracion', parseFormattedNumber, setFormData);

  // 🧮 Calcular automáticamente el total
  const calculateTotal = () => calcTotalHelper(formData, isColjuegosCommitment());

  // Actualizar total automáticamente cuando cambien los valores
  React.useEffect(() => {
    const total = calculateTotal();
    setFormData(prev => ({
      ...prev,
      totalAmount: total.toString()
    }));
  }, [formData.baseAmount, formData.iva, formData.retefuente, formData.ica, formData.discount, formData.hasTaxes, formData.derechosExplotacion, formData.gastosAdministracion, formData.beneficiary]);

  // 🎮 Auto-desactivar impuestos para Coljuegos
  React.useEffect(() => {
    if (isColjuegosCommitment() && formData.hasTaxes) {
      setFormData(prev => ({
        ...prev,
        hasTaxes: false,
        iva: '',
        retefuente: '',
        ica: '',
        discount: ''
      }));
    }
  }, [formData.beneficiary]);

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
      // Convertir FileList a Array para pasar todos los archivos
      const filesArray = Array.from(files);
      // Simular el evento de selección de múltiples archivos
      const mockEvent = {
        target: {
          files: filesArray
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

  // 🔄 Función para cargar sugerencias (movida fuera del useEffect para reutilización)
  const loadSuggestions = async () => {
    if (!currentUser) return;
    
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

  // Cargar sugerencias para autocompletado desde proveedores y compromisos
  useEffect(() => {
    loadSuggestions();
  }, [currentUser]);

  // 🏢 Abrir modal de empresa si no hay preselección y companies cargaron
  useEffect(() => {
    if (!preselectedCompany && companies.length > 0 && !companyLocked && !formData.companyId) {
      setCompanyModalOpen(true);
    }
  }, [companies, preselectedCompany, companyLocked, formData.companyId]);

  // Mostrar notificación cuando se preselecciona una empresa
  useEffect(() => {
    if (preselectedCompany && companies.length > 0) {
      // Bloquear empresa automáticamente si viene preseleccionada
      setCompanyLocked(true);
      addNotification({
        type: 'info',
        title: 'Empresa preseleccionada',
        message: `Se ha preseleccionado "${preselectedCompany.name}" para el nuevo compromiso`,
        icon: 'info',
        color: 'info'
      });
    }
  }, [preselectedCompany, companies, addNotification]);

  // 🔄 Actualizar contador de compromisos según periodicidad y fecha
  useEffect(() => {
    if (formData.periodicity && formData.periodicity !== 'unique') {
      const baseDate = formData.dueDate || new Date();
      const defaultCount = getDefaultRecurringCount(formData.periodicity, baseDate);
      setFormData(prev => ({
        ...prev,
        recurringCount: defaultCount
      }));
    }
  }, [formData.periodicity, formData.dueDate]);

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
      periodicity: 'unique',
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
      invoiceFiles: [],
      invoiceURLs: [],
      invoiceFileNames: []
    });
    setUploadProgress(0);
  };

  // �️ Eliminar concepto de las sugerencias
  const handleDeleteConcept = async (conceptToDelete) => {
    try {
      // Confirmar eliminación
      const confirmed = window.confirm(
        `¿Estás seguro de que quieres eliminar el concepto "${conceptToDelete}"?\n\nEsto eliminará TODOS los compromisos que tengan este concepto exacto.`
      );
      
      if (!confirmed) return;

      setLoadingSuggestions(true);

      // Buscar y eliminar todos los compromisos con este concepto
      const commitmentsQuery = query(
        collection(db, 'commitments'),
        where('concept', '==', conceptToDelete)
      );

      const commitmentsSnapshot = await getDocs(commitmentsQuery);
      
      if (commitmentsSnapshot.empty) {
        addNotification({
          type: 'info',
          title: 'Sin compromisos',
          message: `No se encontraron compromisos con el concepto "${conceptToDelete}"`,
          icon: 'info',
          color: 'info'
        });
        setLoadingSuggestions(false);
        return;
      }

      // 🔒 Auditoría: registrar un log por cada compromiso que se eliminará
      // (esto permite trazabilidad por ID específico, incluso en borrados masivos)
      try {
        for (const commitmentDoc of commitmentsSnapshot.docs) {
          const commitmentData = commitmentDoc.data();
          await logActivity('delete_commitment', 'commitment', commitmentDoc.id, {
            phase: 'before_delete',
            reason: 'delete_concept',
            conceptDeleted: conceptToDelete,
            companyId: commitmentData.companyId || null,
            companyName: commitmentData.companyName || null,
            beneficiary: commitmentData.beneficiary || null,
            dueDate: commitmentData.dueDate || null,
            status: commitmentData.status || null,
            totalAmount: commitmentData.totalAmount || null,
            periodicity: commitmentData.periodicity || null
          });
        }
      } catch {
        // No bloquear el borrado masivo si falla la auditoría
      }

      // Eliminar compromisos en batch
      const batch = writeBatch(db);
      commitmentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // 🔒 Auditoría: log resumen de borrado masivo por concepto
      try {
        await logActivity('bulk_delete_commitments_by_concept', 'commitments', `concept:${conceptToDelete}`, {
          concept: conceptToDelete,
          deletedCount: commitmentsSnapshot.size
        });
      } catch {
        // No bloquear si falla la auditoría
      }

      // Actualizar sugerencias localmente
      setConceptsSuggestions(prev => prev.filter(concept => concept !== conceptToDelete));

      addNotification({
        type: 'success',
        title: 'Concepto eliminado',
        message: `Se eliminaron ${commitmentsSnapshot.size} compromisos con el concepto "${conceptToDelete}"`,
        icon: 'success',
        color: 'success'
      });

    } catch (error) {
      console.error('Error eliminando concepto:', error);
      addNotification({
        type: 'error',
        title: 'Error eliminando concepto',
        message: 'No se pudo eliminar el concepto. Inténtalo de nuevo.',
        icon: 'error',
        color: 'error'
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // �📄 Funciones para manejo de archivos
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Procesar cada archivo individualmente para validación
    const validFiles = [];
    
    files.forEach(file => {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        addNotification({
          type: 'error',
          title: 'Tipo de archivo no válido',
          message: `"${file.name}" - Solo se permiten archivos PDF o imágenes (JPG, PNG, WebP)`,
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
          message: `"${file.name}" no puede superar los 10MB`,
          icon: 'error',
          color: 'error'
        });
        return;
      }

      // Verificar si ya existe un archivo con el mismo nombre
      const existsInFiles = formData.invoiceFileNames.some(name => name === file.name);
      if (existsInFiles) {
        addNotification({
          type: 'warning',
          title: 'Archivo duplicado',
          message: `"${file.name}" ya está en la lista`,
          icon: 'warning',
          color: 'warning'
        });
        return;
      }

      // Archivo válido - agregar para combinación posterior
      validFiles.push(file);
    });

    // Agregar archivos válidos a la lista (se combinarán al guardar)
    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        invoiceFiles: [...prev.invoiceFiles, ...validFiles],
        invoiceFileNames: [...prev.invoiceFileNames, ...validFiles.map(f => f.name)]
      }));

      addNotification({
        type: 'success',
        title: `${validFiles.length} Archivo${validFiles.length !== 1 ? 's' : ''} Agregado${validFiles.length !== 1 ? 's' : ''}`,
        message: `Se agregaron a la lista para combinación. Total: ${formData.invoiceFiles.length + validFiles.length} archivos`,
        icon: 'success',
        color: 'success'
      });
    }

    // Limpiar input
    event.target.value = '';
  };

  // 🗜️ PROCESAR ARCHIVO SELECCIONADO (CON O SIN COMPRESIÓN)
  const processSelectedFile = (file, compressionStats = null) => {
    setFormData(prev => ({
      ...prev,
      invoiceFiles: [...prev.invoiceFiles, file],
      invoiceFileNames: [...prev.invoiceFileNames, file.name],
      compressionStats: compressionStats
    }));

    const message = compressionStats 
      ? `Archivo "${file.name}" optimizado (${compressionStats.reductionPercent} reducido)`
      : `Archivo "${file.name}" agregado a la lista`;

    addNotification({
      type: 'success',
      title: 'Archivo agregado',
      message: message,
      icon: 'success',
      color: 'success'
    });
  };

  // 🗜️ MANEJAR RESULTADO DE COMPRESIÓN
  const handleCompressionAccept = (compressionResult) => {
    const compressedFile = new File([compressionResult.compressed], pendingPDFFile.name, {
      type: 'application/pdf'
    });
    
    processSelectedFile(compressedFile, compressionResult.stats);
    setPendingPDFFile(null);
    
    addNotification({
      type: 'success',
      title: 'Factura Optimizada',
      message: `PDF comprimido exitosamente (${compressionResult.stats.reductionPercent} reducido)`,
      icon: 'success'
    });
  };

  const handleCompressionReject = () => {
    processSelectedFile(pendingPDFFile);
    setPendingPDFFile(null);
    
    addNotification({
      type: 'info',
      title: 'Original Mantenido',
      message: 'Se usará la factura original sin comprimir',
      icon: 'info'
    });
  };

  const uploadInvoiceFiles = async (files) => {
    if (!files || files.length === 0) return [];

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // 📄 COMBINAR TODOS LOS ARCHIVOS EN UN SOLO PDF
      setUploadProgress(20); // 20% - Iniciando combinación

      // Obtener información del compromiso para metadatos
      const selectedCompany = companies.find(company => company.id === formData.companyId);
      const commitmentMetadata = {
        commitmentTitle: `Factura ${formData.title || 'Sin título'} - ${selectedCompany?.name || 'Sin empresa'}`,
        companyName: selectedCompany?.name,
        commitmentDate: formData.dueDate,
        amount: formData.totalAmount
      };

      const combinationResult = await combineFilesToPDF(files, commitmentMetadata);
      setUploadProgress(60); // 60% - Combinación completada

      // 🗜️ APLICAR COMPRESIÓN AL PDF COMBINADO
      setUploadProgress(70); // 70% - Iniciando compresión

      let finalPDF = combinationResult.combinedPDF;
      let compressionStats = null;

      // Aplicar compresión solo a PDFs mayores de 100KB
      if (combinationResult.combinedPDF.size > 100 * 1024) {
        const compressionResult = await drGroupCompressor.compressPDF(
          combinationResult.combinedPDF,
          'balanced' // Usar compresión balanceada
        );

        if (compressionResult.success && compressionResult.compressedBlob) {
          finalPDF = compressionResult.compressedBlob;
          compressionStats = compressionResult.stats;
          
        }
      }

      setUploadProgress(80); // 80% - Compresión completada

      // Generar nombre único para el archivo combinado
      const timestamp = new Date().getTime();
      const fileName = `invoices/combined_${timestamp}_${Math.random().toString(36).substr(2, 9)}.pdf`;
      
      // Crear referencia en Firebase Storage
      const storageRef = ref(storage, fileName);
      
      setUploadProgress(90); // 90% - Preparando subida

      // Subir archivo combinado y comprimido
      const snapshot = await uploadBytes(storageRef, finalPDF);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);

      // Mostrar estadísticas de combinación y compresión
      const statsMessage = compressionStats 
        ? `${combinationResult.stats.processedFiles} archivo${combinationResult.stats.processedFiles !== 1 ? 's' : ''} combinado${combinationResult.stats.processedFiles !== 1 ? 's' : ''} en ${combinationResult.stats.totalPages} página${combinationResult.stats.totalPages !== 1 ? 's' : ''} | Compresión: ${compressionStats.reductionPercent} reducción`
        : `${combinationResult.stats.processedFiles} archivo${combinationResult.stats.processedFiles !== 1 ? 's' : ''} combinado${combinationResult.stats.processedFiles !== 1 ? 's' : ''} en ${combinationResult.stats.totalPages} página${combinationResult.stats.totalPages !== 1 ? 's' : ''}`;

      addNotification({
        type: 'success',
        title: compressionStats ? 'Archivos Combinados y Comprimidos' : 'Archivos Combinados Exitosamente',
        message: statsMessage,
        icon: 'success',
        color: 'success'
      });

      setTimeout(() => {
        setUploadingFile(false);
        setUploadProgress(0);
      }, 500);

      // Retornar información del archivo único combinado y comprimido
      return [{
        fileName: `Factura_Combinada_${timestamp}.pdf`,
        downloadURL: downloadURL,
        size: finalPDF.size,
        type: 'application/pdf',
        combinationStats: combinationResult.stats,
        compressionStats: compressionStats // Agregar estadísticas de compresión
      }];

    } catch (error) {
      console.error('Error combining/uploading files:', error);
      setUploadingFile(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Error al Procesar Archivos',
        message: `No se pudieron procesar los archivos: ${error.message}`,
        icon: 'error',
        color: 'error'
      });
      return [];
    }
  };

  // Eliminar archivo individual por índice
  const removeInvoiceFile = async (index) => {
    try {
      const fileToRemove = formData.invoiceFileNames[index];
      const urlToRemove = formData.invoiceURLs[index];

      // Si hay un archivo ya subido, eliminarlo de Storage
      if (urlToRemove) {
        const storageRef = ref(storage, urlToRemove);
        await deleteObject(storageRef);
      }
      
      setFormData(prev => ({
        ...prev,
        invoiceFiles: prev.invoiceFiles.filter((_, i) => i !== index),
        invoiceURLs: prev.invoiceURLs.filter((_, i) => i !== index),
        invoiceFileNames: prev.invoiceFileNames.filter((_, i) => i !== index)
      }));

      addNotification({
        type: 'info',
        title: 'Archivo eliminado',
        message: `"${fileToRemove}" fue eliminado de la lista`,
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

  // Eliminar todos los archivos
  const removeAllInvoiceFiles = async () => {
    try {
      // Eliminar archivos de Storage si existen URLs
      for (const url of formData.invoiceURLs) {
        if (url) {
          const storageRef = ref(storage, url);
          await deleteObject(storageRef);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        invoiceFiles: [],
        invoiceURLs: [],
        invoiceFileNames: []
      }));

      addNotification({
        type: 'info',
        title: 'Archivos eliminados',
        message: 'Todos los archivos fueron eliminados',
        icon: 'info',
        color: 'info'
      });
    } catch (error) {
      console.error('Error removing all files:', error);
      addNotification({
        type: 'warning',
        title: 'Archivos eliminados localmente',
        message: 'Los archivos fueron eliminados del formulario',
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

    // Validación específica según el tipo de compromiso
    if (isColjuegosCommitment()) {
      // 🎮 Validación para Coljuegos
      if (!formData.derechosExplotacion || parseFloat(formData.derechosExplotacion) <= 0) {
        addNotification({
          type: 'error',
          title: 'Error de validación',
          message: 'Los derechos de explotación deben ser mayor a cero',
          icon: 'error',
          color: 'error'
        });
        return false;
      }

      // ✅ Gastos de administración puede ser $0 (es válido no tener gastos)
      if (formData.gastosAdministracion === '' || formData.gastosAdministracion === null || formData.gastosAdministracion === undefined) {
        addNotification({
          type: 'error',
          title: 'Error de validación',
          message: 'Debe ingresar el monto de gastos de administración (puede ser $0)',
          icon: 'error',
          color: 'error'
        });
        return false;
      }
    } else {
      // 📊 Validación para empresas estándar
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
    }

    // Validación de fecha de vencimiento
    if (!formData.dueDate) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'La fecha de vencimiento es obligatoria',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    return true;
  };

  // 🔍 FUNCIÓN PARA IDENTIFICAR CAMPOS FALTANTES
  const getMissingFields = () => getMissingFieldsHelper(formData, isColjuegosCommitment());

  // 🚨 MOSTRAR ALERTA DE CAMPOS FALTANTES
  const showMissingFieldsAlert = () => {
    const missingFields = getMissingFields();
    
    if (missingFields.length === 0) return;

    const message = missingFields.length === 1 
      ? `Falta completar: ${missingFields[0]}`
      : `Faltan completar: ${missingFields.slice(0, -1).join(', ')} y ${missingFields[missingFields.length - 1]}`;

    addNotification({
      type: 'warning',
      title: '⚠️ Campos obligatorios faltantes',
      message: message,
      icon: 'warning',
      color: 'warning',
      autoHideDuration: 6000
    });
  };

  // � MANEJAR SELECCIÓN DE EMPRESA EN MODAL
  const handleCompanyModalConfirm = () => {
    if (!selectedCompanyInModal) return;
    
    // Actualizar formulario con la empresa seleccionada
    setFormData(prev => ({
      ...prev,
      companyId: selectedCompanyInModal.id,
      companyName: selectedCompanyInModal.name
    }));
    
    // Bloquear campo de empresa
    setCompanyLocked(true);
    
    // Cerrar modal
    setCompanyModalOpen(false);
    
    // Notificación
    addNotification({
      type: 'success',
      title: 'Empresa seleccionada',
      message: `Trabajarás con "${selectedCompanyInModal.name}"`,
      icon: 'success',
      color: 'success',
      duration: 3000
    });
  };

  // 🔄 CAMBIAR EMPRESA (desbloquear y reabrir modal)
  const handleChangeCompany = () => {
    // Verificar si hay datos en el formulario
    const hasData = formData.beneficiary || formData.concept || formData.baseAmount || 
                    formData.invoiceFiles.length > 0;
    
    if (hasData) {
      const confirmed = window.confirm(
        '⚠️ Si cambias de empresa, perderás los datos ingresados.\n\n¿Deseas continuar?'
      );
      if (!confirmed) return;
    }
    
    // Resetear empresa seleccionada en modal
    setSelectedCompanyInModal(null);
    
    // Desbloquear y abrir modal
    setCompanyLocked(false);
    setCompanyModalOpen(true);
  };

  // ❌ CANCELAR MODAL DE EMPRESA (regresar)
  const handleCompanyModalCancel = () => {
    setCompanyModalOpen(false);
    navigate(-1); // Regresar a la página anterior
  };

  // �🎯 MANEJAR CLICK DEL BOTÓN DE GUARDAR
  const handleSaveButtonClick = () => {
    const missingFields = getMissingFields();
    
    if (missingFields.length > 0) {
      // Mostrar campos faltantes
      showMissingFieldsAlert();
      return;
    }
    
    // Si todo está completo, mostrar modal de confirmación
    setConfirmDialogOpen(true);
  };

  // ✅ CONFIRMAR Y GUARDAR COMPROMISO
  const handleConfirmSave = () => {
    setConfirmDialogOpen(false);
    handleSaveCommitment();
  };

  // 📝 GENERAR TEXTO DINÁMICO DEL BOTÓN
  const getButtonText = () => {
    if (saving) return 'Guardando...';
    
    const missingFields = getMissingFields();
    if (missingFields.length === 0) {
      return 'Guardar Compromiso';
    } else if (missingFields.length === 1) {
      return `Falta: ${missingFields[0]}`;
    } else {
      return `Faltan ${missingFields.length} campos`;
    }
  };

  // Guardar compromiso
  const handleSaveCommitment = async () => {
    if (!validateForm()) return;

    // ✅ Validar que el usuario esté autenticado
    if (!currentUser || !currentUser.uid) {
      console.error('❌ Usuario no autenticado, no se puede guardar el compromiso');
      addNotification({
        type: 'error',
        title: 'Error de Autenticación',
        message: 'Debe estar autenticado para crear compromisos.',
        icon: 'error',
        color: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      // 📄 Subir archivos de facturas si existen
      let invoicesData = [];
      if (formData.invoiceFiles && formData.invoiceFiles.length > 0) {
        const uploadResults = await uploadInvoiceFiles(formData.invoiceFiles);
        if (uploadResults && uploadResults.length > 0) {
          invoicesData = uploadResults.map(result => ({
            url: result.downloadURL,
            fileName: result.fileName,
            size: result.size,
            type: result.type,
            uploadedAt: new Date() // Usar Date() normal en lugar de serverTimestamp() en arrays
          }));
        }
      }

      // 🏢 Obtener nombre de la empresa para compromisos recurrentes
      const selectedCompany = companies.find(company => company.id === formData.companyId);
      const companyName = selectedCompany ? selectedCompany.name : 'Sin empresa';

      const commitmentData = {
        ...formData,
        amount: parseFloat(formData.totalAmount), // El campo amount en la BD será el total
        baseAmount: parseFloat(formData.baseAmount) || 0,
        // 🎮 Campos específicos de Coljuegos
        derechosExplotacion: parseFloat(formData.derechosExplotacion) || 0,
        gastosAdministracion: parseFloat(formData.gastosAdministracion) || 0,
        isColjuegosCommitment: isColjuegosCommitment(), // Bandera para identificar tipo
        iva: parseFloat(formData.iva) || 0,
        retefuente: parseFloat(formData.retefuente) || 0,
        ica: parseFloat(formData.ica) || 0,
        discount: parseFloat(formData.discount) || 0,
        hasTaxes: !!formData.hasTaxes && !isColjuegosCommitment(), // No impuestos para Coljuegos
        // ✅ CRITICAL FIX: Asegurar que companyName esté presente
        companyName: companyName,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
        // Agregar datos de facturas si existen (múltiples)
        invoices: invoicesData
      };

      // Limpiar campos de archivo del objeto que se guarda en Firestore
      delete commitmentData.invoiceFiles;
      delete commitmentData.invoiceURLs;
      delete commitmentData.invoiceFileNames;

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
            }
          }
        } catch (error) {
          // No detener el proceso si falla el guardado del proveedor
        }
      }

      // 🔄 Si la periodicidad NO es "único", generar compromisos recurrentes automáticamente
      if (formData.periodicity !== 'unique') {
        // Establecer límite anual para compromisos recurrentes
        const currentYear = new Date().getFullYear();
        const maxDate = new Date(currentYear, 11, 31); // 31 de diciembre del año en curso
        
        // Generar compromisos recurrentes automáticamente con límite anual
        const recurringCommitments = await generateRecurringCommitments(
          commitmentData, 
          formData.recurringCount || 12,
          false, // skipFirst = false para nuevo compromiso
          maxDate // Límite anual
        );

        // Guardar todos los compromisos recurrentes
        const result = await saveRecurringCommitments(recurringCommitments);

        // 📝 Registrar actividad de auditoría para compromisos recurrentes
        try {
          await logActivity('create_commitment', 'commitment', result.groupId, {
            concept: formData.concept,
            companyName: formData.companyName,
            totalAmount: parseFloat(formData.totalAmount) || 0,
            beneficiary: formData.beneficiary,
            periodicity: formData.periodicity,
            recurringCount: result.count,
            type: 'recurring'
          }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
        } catch (logError) {
        }

        // �🔊 Notificación de éxito para compromisos recurrentes
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
        
        // 🧹 Limpiar formulario después del éxito
        resetForm();
        
        // 🔄 Actualización optimista: agregar nuevo beneficiario/concepto si no existe
        if (formData.beneficiary && !providersSuggestions.some(p => p.name === formData.beneficiary)) {
          setProvidersSuggestions(prev => [...prev, {
            name: formData.beneficiary,
            nit: formData.beneficiaryNit || '',
            id: `temp-${Date.now()}` // ID temporal
          }].sort((a, b) => a.name.localeCompare(b.name)));
        }
        
        if (formData.concept && !conceptsSuggestions.includes(formData.concept)) {
          setConceptsSuggestions(prev => [...prev, formData.concept].sort());
        }
        
        // 🔄 Recargar sugerencias completas en background (sin bloquear UI)
        setTimeout(() => loadSuggestions(), 1000);
        
      } else {
        // Guardar compromiso único
        const docRef = await addDoc(collection(db, 'commitments'), commitmentData);
        
        // 📝 Registrar actividad de auditoría para compromiso único
        try {
          await logActivity('create_commitment', 'commitment', docRef.id, {
            concept: formData.concept,
            companyName: formData.companyName,
            totalAmount: parseFloat(formData.totalAmount) || 0,
            beneficiary: formData.beneficiary,
            type: 'single'
          }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
        } catch (logError) {
        }
        
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
        
        // 🧹 Limpiar formulario después del éxito
        resetForm();
        
        // 🔄 Actualización optimista: agregar nuevo beneficiario/concepto si no existe
        if (formData.beneficiary && !providersSuggestions.some(p => p.name === formData.beneficiary)) {
          setProvidersSuggestions(prev => [...prev, {
            name: formData.beneficiary,
            nit: formData.beneficiaryNit || '',
            id: `temp-${Date.now()}` // ID temporal
          }].sort((a, b) => a.name.localeCompare(b.name)));
        }
        
        if (formData.concept && !conceptsSuggestions.includes(formData.concept)) {
          setConceptsSuggestions(prev => [...prev, formData.concept].sort());
        }
        
        // 🔄 Recargar sugerencias completas en background (sin bloquear UI)
        setTimeout(() => loadSuggestions(), 1000);
      }

      // ✅ DESHABILITADO: No navegar automáticamente después de guardar
      // navigate('/commitments');
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

  // 🧹 Función para limpiar el formulario después de guardar
  const resetForm = () => {
    setFormData({
      companyId: preselectedCompany?.id || '',
      companyName: preselectedCompany?.name || '',
      month: new Date().getMonth() + 1, // Mes actual (1-12)
      year: new Date().getFullYear(), // Año actual
      dueDate: null, // Fecha de vencimiento específica
      periodicity: 'unique', // unique, monthly, bimonthly, quarterly, fourmonthly, biannual, annual
      beneficiary: '',
      beneficiaryNit: '', // 🆔 NIT o identificación del beneficiario
      concept: '',
      baseAmount: '', // 💰 Valor base (antes era 'amount')
      // 🎮 Campos específicos de Coljuegos
      derechosExplotacion: '', // Derechos de Explotación
      gastosAdministracion: '', // Gastos de Administración
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
      // 📄 Campos para facturas (múltiples archivos)
      invoiceFiles: [],
      invoiceURLs: [],
      invoiceFileNames: []
    });
    
    // También limpiar archivos subidos
    setUploadProgress(0);
    setUploadingFile(false);
    
    // Limpiar archivos de compresión si están abiertos
    setCompressionPreviewOpen(false);
    setPendingPDFFile(null);
    
    // Limpiar archivos drag & drop si están activos
    setIsDragOver(false);
    
    // 🔄 RESETEAR ESTADO DE EMPRESA Y RE-ABRIR MODAL
    // Solo si NO hay empresa preseleccionada desde otra vista
    if (!preselectedCompany) {
      setCompanyLocked(false);
      setSelectedCompanyInModal(null);
      // Re-abrir modal automáticamente para el siguiente compromiso
      setTimeout(() => {
        setCompanyModalOpen(true);
      }, 500); // Pequeño delay para que se vea la transición
    }
  };

  // Opciones para los selects (imported from commitmentHelpers)

  const paymentMethods = getPaymentMethodOptions();

  const months = MONTHS;

  const years = [];
  for (let i = new Date().getFullYear() - 2; i <= new Date().getFullYear() + 5; i++) {
    years.push({ value: i, label: i.toString() });
  }

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
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
              '&:hover': animationsEnabled ? {
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)',
                borderColor: alpha(theme.palette.primary.main, 0.8)
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
                          ? theme.palette.background.paper
                          : '#ffffff',
                        transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                        '&:hover': animationsEnabled ? {
                          background: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.background.paper, 0.8)
                            : '#f8f9fa',
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
                        <Box position="relative">
                          <Autocomplete
                            fullWidth
                            options={companies}
                            value={companies.find(company => company.id === formData.companyId) || null}
                            onChange={(event, newValue) => {
                              handleFormChange('companyId', newValue ? newValue.id : '');
                            }}
                            getOptionLabel={(option) => option.name || ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            disabled={saving || companyLocked}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                                <Box key={key} component="li" {...otherProps}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {option.logoURL && (
                                      <img 
                                        src={option.logoURL} 
                                        alt={option.name}
                                        style={{ width: 24, height: 24, borderRadius: 4 }}
                                      />
                                    )}
                                    <Box>
                                      <Typography variant="body2" fontWeight="500">
                                        {option.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        NIT: {option.nit}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Empresa"
                                required
                                placeholder={companyLocked ? "Empresa bloqueada" : "Buscar empresa... (ej: King)"}
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      {companyLocked ? (
                                        <LockIcon sx={{ color: theme.palette.success.main }} />
                                      ) : (
                                        <BusinessIcon sx={{ color: primaryColor }} />
                                      )}
                                    </InputAdornment>
                                  ),
                                  sx: {
                                    borderRadius: `${borderRadius}px`,
                                    backgroundColor: companyLocked 
                                      ? alpha(theme.palette.success.main, 0.05)
                                      : 'transparent',
                                    '& .MuiOutlinedInput-root': {
                                      transition: animationsEnabled ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                                      '&:hover': animationsEnabled && !companyLocked ? {
                                        borderColor: primaryColor,
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${alpha(primaryColor, 0.25)}`
                                      } : {}
                                    }
                                  }
                                }}
                              />
                            )}
                          />
                          
                          {/* 🔒 Indicador de bloqueo y botón cambiar */}
                          {companyLocked && formData.companyId && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Box 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="space-between"
                                mt={1}
                              >
                                <Chip
                                  icon={<LockIcon sx={{ fontSize: 14 }} />}
                                  label="Empresa bloqueada"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}
                                />
                                <Button
                                  size="small"
                                  startIcon={<SwapHorizIcon />}
                                  onClick={handleChangeCompany}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    color: theme.palette.warning.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.warning.main, 0.1)
                                    }
                                  }}
                                >
                                  Cambiar empresa
                                </Button>
                              </Box>
                            </motion.div>
                          )}
                        </Box>
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
                        ? theme.palette.background.paper
                        : '#ffffff',
                      transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                      '&:hover': animationsEnabled ? {
                        background: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.8)
                          : '#f8f9fa',
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
                          onChange={(e) => {
                            const formattedValue = formatNitId(e.target.value);
                            handleFormChange('beneficiaryNit', formattedValue);
                          }}
                          disabled={saving}
                          placeholder="Ej: 900505060-5 o 9005050605 o 1082881132"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AssignmentIcon sx={{ color: primaryColor }} />
                              </InputAdornment>
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
                                '&.Mui-focused': animationsEnabled ? {
                                  borderColor: primaryColor,
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? `0 0 0 2px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.25)` 
                                    : `0 0 0 2px rgba(${primaryColor.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.08)`,
                                  transform: 'translateX(4px)'
                                } : {}
                              }
                            }
                          }}
                          helperText="NIT, CC, CE o documento de identificación"
                        />
                        {/* Indicador de tipo de documento */}
                        {formData.beneficiaryNit && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                            <Chip
                              size="small"
                              icon={formData.beneficiaryNit.includes('-') ? 
                                <BusinessIcon sx={{ fontSize: 12 }} /> : 
                                <PersonIcon sx={{ fontSize: 12 }} />
                              }
                              label={formData.beneficiaryNit.includes('-') ? 'NIT Empresa' : 'ID Persona'}
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 1 },
                                '& .MuiChip-icon': { fontSize: 10 }
                              }}
                              color={formData.beneficiaryNit.includes('-') ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                          </Box>
                        )}
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
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <Box
                                key={key}
                                {...otherProps}
                                component="li"
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  '&:hover .delete-concept-btn': {
                                    opacity: 1
                                  }
                                }}
                              >
                                <Typography
                                  sx={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {option}
                                </Typography>
                                <IconButton
                                  className="delete-concept-btn"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConcept(option);
                                  }}
                                  sx={{
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'error.light',
                                      color: 'error.dark'
                                    }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            );
                          }}
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

                      {/* 🎮 Campos específicos para Coljuegos */}
                      {isColjuegosCommitment() ? (
                        <>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              required
                              label="Derechos de Explotación"
                              value={formData.derechosExplotacion ? formatNumberWithCommas(formData.derechosExplotacion) : ''}
                              onChange={handleDerechosChange}
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
                                        borderColor: theme.palette.warning.main,
                                        borderWidth: 2,
                                      }
                                    }
                                  }
                                }
                              }}
                              helperText="Monto por derechos de explotación"
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              required
                              label="Gastos de Administración"
                              value={formData.gastosAdministracion ? formatNumberWithCommas(formData.gastosAdministracion) : ''}
                              onChange={handleGastosChange}
                              disabled={saving}
                              placeholder="0"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <MoneyIcon color="secondary" />
                                    $
                                  </InputAdornment>
                                ),
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused': {
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: theme.palette.secondary.main,
                                        borderWidth: 2,
                                      }
                                    }
                                  }
                                }
                              }}
                              helperText="Monto por gastos de administración"
                            />
                          </Grid>

                          {/* Alert informativo para Coljuegos */}
                          <Grid item xs={12}>
                            <Alert 
                              severity="info" 
                              icon={<BusinessIcon />}
                              sx={{
                                border: 'none',
                                background: theme.palette.mode === 'dark' 
                                  ? theme.palette.background.paper
                                  : '#ffffff',
                                boxShadow: 'none',
                                borderRadius: 1,
                                '& .MuiAlert-icon': {
                                  color: theme.palette.primary.main,
                                },
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  background: theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.background.paper, 0.8)
                                    : '#f8f9fa',
                                }
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>
                                🎮 <strong>Compromiso Coljuegos</strong> - El total se calcula como: 
                                <strong> Derechos + Gastos</strong> (sin impuestos aplicables)
                              </Typography>
                            </Alert>
                          </Grid>
                        </>
                      ) : (
                        <>
                          {/* 📊 Campos estándar para otras empresas */}
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
                        </>
                      )}

                      {/* Mostrar/Ocultar Impuestos - Solo para empresas que NO son Coljuegos */}
                      {!isColjuegosCommitment() && (
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
                      )}

                      {/* IVA - Solo para empresas que NO son Coljuegos */}
                      {formData.hasTaxes && !isColjuegosCommitment() && (
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

                      {/* Retefuente - Solo para empresas que NO son Coljuegos */}
                      {formData.hasTaxes && !isColjuegosCommitment() && (
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

                      {/* ICA - Solo para empresas que NO son Coljuegos */}
                      {formData.hasTaxes && !isColjuegosCommitment() && (
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

                      {/* Descuento - Solo para empresas que NO son Coljuegos */}
                      {formData.hasTaxes && !isColjuegosCommitment() && (
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
                          helperText={isColjuegosCommitment() 
                            ? `🎮 Total Coljuegos = Derechos + Gastos = ${formatCurrency(formData.totalAmount || 0)}`
                            : formData.hasTaxes
                              ? `📊 Base + IVA - Retención - ICA - Descuento = ${formatCurrency(formData.totalAmount || 0)}`
                              : `💰 Total = Base = ${formatCurrency(formData.totalAmount || 0)}`
                          }
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
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                          <DatePicker
                            label="Fecha de vencimiento"
                            value={formData.dueDate}
                            onChange={(newValue) => handleFormChange('dueDate', newValue)}
                            disabled={saving}
                            format="dd/MM/yyyy"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true,
                                helperText: "Fecha específica de vencimiento del compromiso",
                                InputProps: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <CalendarIcon color="primary" />
                                    </InputAdornment>
                                  ),
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const missing = getMissingFields();
                              if (missing.length > 0) {
                                showMissingFieldsAlert();
                                return;
                              }
                              if (!saving) handleSaveCommitment();
                            }
                          }}
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
                              Facturas (opcional):
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1.5 }}>
                            {formData.invoiceFiles.length === 0 ? (
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
                                  multiple
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
                                  {isDragOver ? 'Soltar archivos aquí' : 'Seleccionar archivos'}
                                </Typography>
                              </Box>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Box sx={{ maxWidth: 500 }}>
                                  {/* Header con contador */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    mb: 1.5 
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 600,
                                      color: primaryColor,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      <FileIcon sx={{ fontSize: 18 }} />
                                      {formData.invoiceFiles.length} archivo{formData.invoiceFiles.length !== 1 ? 's' : ''} adjunto{formData.invoiceFiles.length !== 1 ? 's' : ''} 
                                      {formData.invoiceFiles.length > 1 && <span style={{ color: theme.palette.primary.main, fontWeight: 600 }}>→ Se combinarán</span>}
                                    </Typography>
                                    
                                    {formData.invoiceFiles.length > 1 && (
                                      <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        onClick={removeAllInvoiceFiles}
                                        disabled={saving || uploadingFile}
                                        startIcon={<DeleteIcon />}
                                        sx={{ minWidth: 'auto', px: 1 }}
                                      >
                                        Eliminar todos
                                      </Button>
                                    )}
                                  </Box>

                                  {/* Lista de archivos */}
                                  <Stack spacing={1}>
                                    {formData.invoiceFiles.map((file, index) => (
                                      <Box
                                        key={index}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1.5,
                                          p: 1.5,
                                          border: `1px solid ${alpha(primaryColor, 0.2)}`,
                                          borderRadius: 2,
                                          background: alpha(primaryColor, 0.03),
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
                                            {formData.invoiceFileNames[index]}
                                          </Typography>
                                          
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            {(file.size / 1024 / 1024).toFixed(1)} MB
                                          </Typography>
                                        </Box>

                                        <IconButton
                                          onClick={() => removeInvoiceFile(index)}
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
                                    ))}
                                  </Stack>

                                  {/* Botón para agregar más archivos */}
                                  <Box sx={{ mt: 2 }}>
                                    <Button
                                      variant="outlined"
                                      startIcon={<AttachFileIcon />}
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.pdf,.jpg,.jpeg,.png';
                                        input.multiple = true;
                                        input.onchange = (event) => {
                                          handleFileSelect(event);
                                        };
                                        input.click();
                                      }}
                                      disabled={saving || uploadingFile}
                                      sx={{
                                        borderColor: alpha(primaryColor, 0.3),
                                        color: primaryColor,
                                        '&:hover': {
                                          borderColor: primaryColor,
                                          backgroundColor: alpha(primaryColor, 0.05)
                                        }
                                      }}
                                    >
                                      Agregar más archivos
                                    </Button>
                                  </Box>
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
                              PDF, JPG, PNG • Max. 10MB • Se combinarán en un solo PDF
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
                        onClick={handleSaveButtonClick}
                        disabled={saving}
                        sx={{ 
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          minWidth: 180,
                          background: getGradientBackground(), // Siempre usar gradiente principal
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
                        {getButtonText()}
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
              boxShadow: 'none' // Sin sombras de color
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
                borderRadius: 1,
                border: 'none',
                background: theme.palette.mode === 'dark' 
                  ? theme.palette.background.paper
                  : '#ffffff',
                boxShadow: 'none',
                '& .MuiAlert-icon': {
                  display: 'none', // Ocultar ícono predeterminado
                },
                '& .MuiAlert-message': {
                  fontSize: `${fontSize}px`,
                  padding: 0,
                },
                padding: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.8)
                    : '#f8f9fa',
                }
              }}
            >
              <Typography variant="body2" sx={{ 
                fontWeight: 400,
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box component="span" sx={{ 
                  fontSize: '16px',
                  opacity: 0.7
                }}>
                  ℹ️
                </Box>
                <Box component="span" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                  Nota:
                </Box>
                {' '}Los compromisos mensuales, trimestrales y anuales se renovarán automáticamente 
                según la frecuencia seleccionada. Los compromisos únicos no se renovarán.
              </Typography>
            </Alert>
          </motion.div>
        </motion.div>

        {/* 🗜️ DIÁLOGO DE VISTA PREVIA DE COMPRESIÓN */}
        <PDFCompressionPreview
          open={compressionPreviewOpen}
          onClose={() => setCompressionPreviewOpen(false)}
          file={pendingPDFFile}
          onAccept={handleCompressionAccept}
          onReject={handleCompressionReject}
        />

        {/* 🏢 MODAL DE SELECCIÓN INICIAL DE EMPRESA */}
        <Dialog
          open={companyModalOpen}
          onClose={handleCompanyModalCancel} // Permite cerrar con ESC
          maxWidth="sm"
          fullWidth
          onKeyDown={(e) => {
            // ✅ ENTER: Continuar (solo si hay empresa seleccionada)
            if (e.key === 'Enter' && selectedCompanyInModal) {
              e.preventDefault();
              handleCompanyModalConfirm();
            }
            // ❌ ESC: Cancelar y cerrar modal
            if (e.key === 'Escape') {
              e.preventDefault();
              handleCompanyModalCancel();
            }
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.15)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 2,
            background: getGradientBackground(),
            color: 'white'
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <BusinessIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ color: 'white' }}>
                  Selecciona una Empresa
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Elige la empresa para este compromiso
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 6, pb: 3, px: 3 }}>
            <Box sx={{ minHeight: 150, mt: 3 }}>
              <Autocomplete
                fullWidth
                options={companies}
                value={selectedCompanyInModal}
                onChange={(event, newValue) => {
                  setSelectedCompanyInModal(newValue);
                }}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                autoHighlight
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box 
                      key={key} 
                      component="li" 
                      {...otherProps}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} width="100%">
                        {option.logoURL ? (
                          <img 
                            src={option.logoURL} 
                            alt={option.name}
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: 6,
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              background: getGradientBackground(),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <BusinessIcon sx={{ fontSize: 18, color: 'white' }} />
                          </Box>
                        )}
                        <Box flex={1}>
                          <Typography variant="body1" fontWeight="600">
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            NIT: {option.nit}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar empresa"
                    placeholder="Escribe para buscar... (ej: King)"
                    autoFocus
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: theme.palette.primary.main }} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText="No se encontraron empresas"
                loadingText="Cargando empresas..."
              />

              {/* Mensaje informativo */}
              <Alert 
                severity="info" 
                icon={<LockOpenIcon />}
                sx={{ 
                  mt: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: theme.palette.info.main
                  }
                }}
              >
                <Typography variant="body2" fontWeight="500">
                  Una vez seleccionada, la empresa quedará bloqueada para este compromiso
                </Typography>
              </Alert>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button
              onClick={handleCompanyModalCancel}
              variant="outlined"
              startIcon={<CancelIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.05),
                  color: theme.palette.error.main
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompanyModalConfirm}
              variant="contained"
              disabled={!selectedCompanyInModal}
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: selectedCompanyInModal 
                  ? getGradientBackground()
                  : theme.palette.action.disabledBackground,
                boxShadow: selectedCompanyInModal
                  ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                  : 'none',
                '&:hover': selectedCompanyInModal ? {
                  background: getGradientBackground(),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.5)}`
                } : {},
                transition: 'all 0.3s ease'
              }}
            >
              Continuar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ MODAL DE CONFIRMACIÓN DE GUARDADO */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
              <SaveIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Confirmar Compromiso
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Revisa la información antes de guardar
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {/* Empresa */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                  EMPRESA
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon color="primary" fontSize="small" />
                  <Typography variant="body1" fontWeight="500">
                    {formData.companyName || 'Sin empresa'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Beneficiario y Concepto */}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    BENEFICIARIO
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" fontSize="small" />
                    <Typography variant="body1" fontWeight="500">
                      {formData.beneficiary || 'Sin beneficiario'}
                    </Typography>
                  </Box>
                  {formData.beneficiaryNit && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      NIT: {formData.beneficiaryNit}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    CONCEPTO
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" fontSize="small" />
                    <Typography variant="body1">
                      {formData.concept || 'Sin concepto'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              {/* Monto y Fecha */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    MONTO TOTAL
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="success" fontSize="small" />
                    <Typography variant="h6" fontWeight="700" color="success.main">
                      ${parseFloat(formData.totalAmount || 0).toLocaleString('es-CO')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    FECHA VENCIMIENTO
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="primary" fontSize="small" />
                    <Typography variant="body1" fontWeight="600">
                      {formData.dueDate ? format(formData.dueDate, 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              {/* Periodicidad */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                  TIPO DE COMPROMISO
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RepeatIcon color="primary" fontSize="small" />
                  <Chip 
                    label={getPeriodicityDescription(formData.periodicity)}
                    color={formData.periodicity === 'unique' ? 'default' : 'primary'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  {formData.periodicity !== 'unique' && (
                    <Typography variant="body2" color="text.secondary">
                      ({formData.recurringCount} compromisos)
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Método de pago */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                  MÉTODO DE PAGO
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="primary" fontSize="small" />
                  <Typography variant="body1">
                    {getPaymentMethodOptions(settings).find(m => m.value === formData.paymentMethod)?.label || formData.paymentMethod}
                  </Typography>
                </Box>
              </Box>

              {/* Archivos adjuntos */}
              {formData.invoiceFiles && formData.invoiceFiles.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                      ARCHIVOS ADJUNTOS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon color="primary" fontSize="small" />
                      <Typography variant="body2">
                        {formData.invoiceFiles.length} archivo{formData.invoiceFiles.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={() => setConfirmDialogOpen(false)}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                fontWeight: 600
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {saving ? 'Guardando...' : 'Confirmar y Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

export default NewCommitmentPage;