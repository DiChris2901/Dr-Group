import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  AlertTitle,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Chip,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Collapse,
  alpha
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Business as CompanyIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  TrendingUp as InterestIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Visibility as ViewIcon,
  Description as PdfIcon,
  Image as ImageIcon,
  Launch as ExternalLinkIcon,
  FullscreenExit as MinimizeIcon,
  Fullscreen as MaximizeIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFDocument } from 'pdf-lib';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// 🗜️ IMPORTAR SISTEMA DE COMPRESIÓN
import PDFCompressionPreview from '../components/common/PDFCompressionPreview';
import { drGroupCompressor } from '../utils/pdfCompressor';

const NewPaymentPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  
  // Helper para crear fecha local sin problemas de zona horaria
  const createLocalDate = (dateString) => {
    if (!dateString) return new Date();
    
    // Si es una fecha en formato YYYY-MM-DD del input
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day); // month - 1 porque Date usa base 0 para meses
    }
    
    return new Date(dateString);
  };

  // 💰 Función para calcular 4x1000 automáticamente
  const calculate4x1000Visual = (amount, method, sourceAccount) => {
    // 4x1000 se aplica a TODOS los pagos que requieren movimiento bancario
    // Para métodos como "Efectivo", se asume retiro de cuenta bancaria
    if (amount > 0) {
      return Math.round((amount * 4) / 1000);
    }
    return 0;
  };

  // 💰 Funciones para formateo de moneda colombiana
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    
    // Remover todo excepto dígitos
    const cleanValue = value.toString().replace(/[^\d]/g, '');
    if (!cleanValue || cleanValue === '0') return '';
    
    // Formatear con separadores de miles
    const numValue = parseInt(cleanValue);
    if (isNaN(numValue)) return '';
    
    return numValue.toLocaleString('es-CO');
  };

  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.toString().replace(/[^\d]/g, '');
    return parseInt(cleanValue) || 0;
  };

  const formatCurrencyDisplay = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };
  
  // Estado para compromisos pendientes
  const [pendingCommitments, setPendingCommitments] = useState([]);
  const [loadingCommitments, setLoadingCommitments] = useState(true);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  
  // Estado para empresas y cuentas bancarias
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [personalAccounts, setPersonalAccounts] = useState([]);
  
  const [formData, setFormData] = useState({
    commitmentId: '',
    method: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    sourceAccount: '', // NUEVO: cuenta de origen del pago
    sourceBank: '',    // NUEVO: banco de origen (se autocompleta)
    tax4x1000: 0,     // NUEVO: campo visual para 4x1000
    // Campos calculados automáticamente
    originalAmount: 0,
    interests: 0,
    // Campos específicos para Coljuegos
    interesesDerechosExplotacion: 0,
    interesesGastosAdministracion: 0,
    derechosExplotacion: 0,        // NUEVO: monto base derechos
    gastosAdministracion: 0,       // NUEVO: monto base gastos
    finalAmount: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para archivos
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // 🗜️ ESTADO PARA COMPRESIÓN DE PDFs
  const [compressionPreviewOpen, setCompressionPreviewOpen] = useState(false);
  const [pendingPDFFile, setPendingPDFFile] = useState(null);
  const [compressionEnabled, setCompressionEnabled] = useState(true); // Compresión habilitada por defecto

  // 📄 Estado para visor PDF de factura del compromiso
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [pdfViewerSize, setPdfViewerSize] = useState('medium'); // small, medium, large

  // Función de refresh manual
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingCommitments();
    await loadCompanies();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // Cargar compromisos pendientes de pago
  useEffect(() => {
    loadPendingCommitments();
  }, []);

  // Cargar empresas con cuentas bancarias
  useEffect(() => {
    loadCompanies();
  }, []);

  // Limpiar intereses cuando la fecha ya no los requiere
  useEffect(() => {
    if (selectedCommitment && formData.date) {
      const needsInterests = requiresInterests(selectedCommitment, formData.date);
      
      if (!needsInterests) {
        // Limpiar todos los tipos de intereses si no se requieren
        setFormData(prev => ({
          ...prev,
          interests: 0,
          interesesDerechosExplotacion: 0,
          interesesGastosAdministracion: 0,
          finalAmount: prev.originalAmount
        }));
      }
    }
  }, [formData.date, selectedCommitment]);

  // 🔄 useEffect para calcular 4x1000 automáticamente
  useEffect(() => {
    const tax4x1000Amount = calculate4x1000Visual(
      formData.finalAmount, 
      formData.method, 
      formData.sourceAccount
    );
    
    if (tax4x1000Amount !== formData.tax4x1000) {
      setFormData(prev => ({
        ...prev,
        tax4x1000: tax4x1000Amount
      }));
    }
  }, [formData.finalAmount, formData.method, formData.sourceAccount]);

  // Cargar cuentas personales desde Firebase
  useEffect(() => {
    if (!user?.uid) {
      setPersonalAccounts([]);
      return;
    }

    const q = query(
      collection(db, 'personal_accounts'),
      where('userId', '==', user.uid)
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
  }, [user]);

  const loadPendingCommitments = async () => {
    try {
      setLoadingCommitments(true);
      
      // Consultar todos los compromisos
      const commitmentsQuery = query(
        collection(db, 'commitments')
      );
      
      const snapshot = await getDocs(commitmentsQuery);
      const commitments = [];
      
      // También consultar todos los pagos para verificar cuáles compromisos ya tienen pago
      const paymentsQuery = query(
        collection(db, 'payments')
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const commitmentsWithPayments = new Set();
      
      // Crear set de commitmentIds que ya tienen pagos
      paymentsSnapshot.forEach((doc) => {
        const paymentData = doc.data();
        if (paymentData.commitmentId) {
          commitmentsWithPayments.add(paymentData.commitmentId);
        }
      });
      
      console.log('📊 Compromisos que ya tienen pagos:', Array.from(commitmentsWithPayments));
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filtrar solo compromisos pendientes o vencidos Y que NO tengan pagos registrados Y que no estén marcados como pagados
        const status = data.status || 'pending';
        const isPaid = data.paid === true || data.isPaid === true || status === 'paid';
        const hasPayment = commitmentsWithPayments.has(doc.id);
        
        if ((status === 'pending' || status === 'overdue') && !hasPayment && !isPaid) {
          console.log('📄 Compromiso sin pago encontrado:', doc.id, data);
          commitments.push({
            id: doc.id,
            ...data,
            // Formatear datos para el display
            displayName: `${data.companyName || 'Sin empresa'} - ${data.concept || data.name || 'Sin concepto'}`,
            formattedDueDate: data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM/yyyy', { locale: es }) : 'Sin fecha',
            formattedAmount: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            }).format(data.amount || 0)
          });
        } else if (hasPayment || isPaid) {
          console.log('🚫 Compromiso omitido (ya pagado):', doc.id, data.concept, { hasPayment, isPaid, status });
        }
      });
      
      // Ordenar por fecha de vencimiento
      commitments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.toDate() - b.dueDate.toDate();
      });
      
      console.log(`📋 Total compromisos sin pago: ${commitments.length}`);
      setPendingCommitments(commitments);
    } catch (error) {
      console.error('Error loading pending commitments:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los compromisos pendientes',
        icon: 'error'
      });
    } finally {
      setLoadingCommitments(false);
    }
  };

  // Cargar empresas con información bancaria
  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesQuery = query(collection(db, 'companies'));
      const snapshot = await getDocs(companiesQuery);
      
      const companiesData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        companiesData.push({
          id: doc.id,
          ...data
        });
      });
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      addNotification({
        type: 'error',
        title: 'Error al cargar empresas',
        message: 'No se pudieron cargar las empresas',
        icon: 'error'
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Obtener cuentas bancarias disponibles (empresariales y personales)
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
        displayText: `${company.bankAccount} - ${company.bankName} (${company.name})`
      }));

    // Cuentas personales  
    const personalAccountsList = personalAccounts.map(account => ({
      id: account.id,
      type: 'personal',
      companyName: account.holderName,
      bankAccount: account.accountNumber, // Mapear accountNumber a bankAccount para consistencia
      bankName: account.bankName,
      displayText: `${account.accountNumber} - ${account.bankName} (${account.holderName})`
    }));

    return [...businessAccounts, ...personalAccountsList];
  };

  // Manejar selección de cuenta bancaria
  const handleSourceAccountSelect = (selectedAccount) => {
    if (selectedAccount) {
      const accountInfo = getBankAccounts().find(acc => acc.bankAccount === selectedAccount);
      if (accountInfo) {
        setFormData(prev => ({
          ...prev,
          sourceAccount: accountInfo.bankAccount,
          sourceBank: accountInfo.bankName
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        sourceAccount: '',
        sourceBank: ''
      }));
    }
  };

  // Función para formatear moneda
  const formatCurrencyBalance = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Función para calcular y crear registro del 4x1000 MEJORADA
  const create4x1000Record = async (paymentAmount, sourceAccount, sourceBank, companyName, paymentDate, parentPaymentId = null) => {
    // Calcular 4x1000: 4 pesos por cada 1000 pesos transferidos
    const tax4x1000 = Math.round((paymentAmount * 4) / 1000);
    
    // Solo crear si el impuesto es mayor a 0
    if (tax4x1000 <= 0) return null;

    try {
      // 🔗 REGISTRO DEL 4x1000 CON RELACIÓN MEJORADA
      const tax4x1000Data = {
        // Información básica del impuesto
        concept: '4x1000 - Impuesto Gravamen Movimientos Financieros',
        amount: tax4x1000,
        originalAmount: tax4x1000,
        method: 'Transferencia',
        notes: `Impuesto 4x1000 generado automáticamente (${formatCurrencyBalance(paymentAmount)} x 0.004)`,
        reference: `4x1000-${Date.now()}`,
        
        // Información de la empresa y cuentas
        companyName: companyName,
        sourceAccount: sourceAccount,
        sourceBank: sourceBank,
        date: paymentDate,
        
        // 📊 CAMPOS DE RELACIÓN MEJORADOS
        parentPaymentId: parentPaymentId,           // ID del pago principal que generó este impuesto
        parentPaymentAmount: paymentAmount,         // Monto base que generó el impuesto
        taxRate: 0.004,                            // Tasa aplicada (4/1000)
        taxType: '4x1000',                         // Tipo específico de impuesto
        
        // Metadatos técnicos
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        
        // 🏷️ FLAGS DE IDENTIFICACIÓN MEJORADOS
        is4x1000Tax: true,                         // Flag principal
        relatedToPayment: true,                    // Es un impuesto relacionado
        isAutomaticTax: true,                      // Generado automáticamente
        category: 'tax',                           // Categoría: impuesto
        subcategory: 'transaction_tax',            // Subcategoría: impuesto transaccional
        tags: ['impuesto', '4x1000', 'automatico', 'gmf']
      };

      // Agregar a la colección de pagos
      const taxRef = await addDoc(collection(db, 'payments'), tax4x1000Data);
      
      console.log('✅ Registro 4x1000 creado:', formatCurrencyBalance(tax4x1000));
      return { amount: tax4x1000, id: taxRef.id };
    } catch (error) {
      console.error('❌ Error creando registro 4x1000:', error);
      return null;
    }
  };

  // Verificar si los intereses requeridos están completos
  const areInterestsComplete = () => {
    // Si no se requieren intereses, siempre está completo
    if (!requiresInterests(selectedCommitment, formData.date)) {
      return true;
    }
    
    // Si se requieren intereses
    if (isColjuegosCommitment(selectedCommitment)) {
      // Para Coljuegos: al menos uno de los dos tipos debe tener valor > 0
      return formData.interesesDerechosExplotacion > 0 || formData.interesesGastosAdministracion > 0;
    } else {
      // Para otros compromisos: debe tener intereses > 0
      return formData.interests > 0;
    }
  };

  // Verificar si la fecha de pago requiere intereses (posterior al vencimiento)
  const requiresInterests = (commitment, paymentDate) => {
    if (!commitment?.dueDate || !paymentDate) return false;
    
    const dueDate = commitment.dueDate.toDate();
    const payment = new Date(paymentDate);
    
    // Resetear horas para comparar solo fechas
    dueDate.setHours(0, 0, 0, 0);
    payment.setHours(0, 0, 0, 0);
    
    console.log('Checking interests requirement:', {
      dueDate: dueDate.toDateString(),
      paymentDate: payment.toDateString(),
      isLater: payment > dueDate
    });
    
    return payment > dueDate;
  };

  // Detectar si es un compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const companyName = commitment.companyName?.toLowerCase() || '';
    const concept = commitment.concept?.toLowerCase() || '';
    
    console.log('Checking Coljuegos for:', { companyName, concept });
    
    // Buscar por nombre de empresa o concepto relacionado a Coljuegos
    const isColjuegos = companyName.includes('coljuegos') || 
           companyName.includes('col juegos') ||
           concept.includes('derechos de explotación') ||
           concept.includes('derechos de explotacion') ||
           concept.includes('gastos de administración') ||
           concept.includes('gastos de administracion');
           
    console.log('Is Coljuegos:', isColjuegos);
    return isColjuegos;
  };

  // Calcular si hay intereses basado en la fecha de pago vs fecha de vencimiento
  const calculateInterestsForPaymentDate = (dueDate, amount, paymentDate) => {
    if (!dueDate || !amount || !paymentDate) return 0;
    
    const due = dueDate.toDate();
    const payment = new Date(paymentDate);
    const diffTime = payment - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si no está vencido en la fecha de pago, no hay intereses
    if (diffDays <= 0) return 0;
    
    // Calcular interés: 1% mensual (0.033% diario) por días de retraso
    const dailyRate = 0.01 / 30; // 1% mensual dividido en 30 días
    const interestAmount = amount * dailyRate * diffDays;
    
    return Math.round(interestAmount);
  };

  // Manejar selección de compromiso
  const handleCommitmentSelect = (commitment) => {
    if (!commitment) {
      setSelectedCommitment(null);
      setFormData(prev => ({
        ...prev,
        commitmentId: '',
        originalAmount: 0,
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        derechosExplotacion: 0,
        gastosAdministracion: 0,
        finalAmount: 0
      }));
      // Limpiar URL de factura al deseleccionar compromiso
      setInvoiceUrl(null);
      return;
    }

    setSelectedCommitment(commitment);
    
    // No calcular intereses automáticamente, dejar en 0
    const finalAmount = commitment.amount || 0;

    setFormData(prev => ({
      ...prev,
      commitmentId: commitment.id,
      originalAmount: commitment.amount || 0,
      interests: 0,
      interesesDerechosExplotacion: 0,
      interesesGastosAdministracion: 0,
      // CARGAR VALORES BASE DESDE EL COMPROMISO
      derechosExplotacion: commitment.derechosExplotacion || 0,
      gastosAdministracion: commitment.gastosAdministracion || 0,
      finalAmount: finalAmount
    }));

    // 📄 Obtener URL de la factura del compromiso
    extractInvoiceUrl(commitment);
  };

  // 📄 FUNCIONES DEL VISOR PDF DE FACTURA DEL COMPROMISO
  
  // Extraer URL de la factura del compromiso seleccionado
  const extractInvoiceUrl = (commitment) => {
    if (!commitment) {
      setInvoiceUrl(null);
      return;
    }

    console.log('🔍 Extrayendo URL de factura para compromiso:', commitment.id);
    console.log('📄 DATOS COMPLETOS DEL COMPROMISO:', commitment);
    console.log('📄 Analizando campos de archivos:', {
      'invoice.url': commitment.invoice?.url,
      'invoice': commitment.invoice,
      receiptUrl: commitment.receiptUrl,
      receiptUrls: commitment.receiptUrls,
      attachments: commitment.attachments,
      attachmentUrls: commitment.attachmentUrls,
      invoiceUrl: commitment.invoiceUrl,
      fileUrl: commitment.fileUrl,
      fileUrls: commitment.fileUrls
    });

    let foundUrl = null;

    // PRIORIDAD 1: invoice.url (campo específico de factura - ESTRUCTURA CORRECTA)
    if (commitment.invoice && commitment.invoice.url && commitment.invoice.url.trim() !== '') {
      foundUrl = commitment.invoice.url;
      console.log('✅ URL de factura encontrada en invoice.url:', foundUrl);
    }
    // PRIORIDAD 2: invoiceUrl (campo directo de factura)
    else if (commitment.invoiceUrl && commitment.invoiceUrl.trim() !== '') {
      foundUrl = commitment.invoiceUrl;
      console.log('✅ URL de factura encontrada en invoiceUrl:', foundUrl);
    }
    // PRIORIDAD 3: attachments (URLs más frescas)
    else if (commitment.attachments && commitment.attachments.length > 0) {
      foundUrl = commitment.attachments[commitment.attachments.length - 1]; // Más reciente
      console.log('✅ URL de factura encontrada en attachments:', foundUrl);
    }
    // PRIORIDAD 4: receiptUrls (múltiples archivos)
    else if (commitment.receiptUrls && commitment.receiptUrls.length > 0) {
      foundUrl = commitment.receiptUrls[commitment.receiptUrls.length - 1]; // Más reciente
      console.log('✅ URL de factura encontrada en receiptUrls:', foundUrl);
    }
    // PRIORIDAD 5: receiptUrl (archivo único)
    else if (commitment.receiptUrl && commitment.receiptUrl.trim() !== '') {
      foundUrl = commitment.receiptUrl;
      console.log('✅ URL de factura encontrada en receiptUrl:', foundUrl);
    }
    // PRIORIDAD 6: attachmentUrls (legacy)
    else if (commitment.attachmentUrls && commitment.attachmentUrls.length > 0) {
      foundUrl = commitment.attachmentUrls[commitment.attachmentUrls.length - 1];
      console.log('✅ URL de factura encontrada en attachmentUrls:', foundUrl);
    }
    // PRIORIDAD 7: fileUrls (otro campo posible)
    else if (commitment.fileUrls && commitment.fileUrls.length > 0) {
      foundUrl = commitment.fileUrls[commitment.fileUrls.length - 1];
      console.log('✅ URL de factura encontrada en fileUrls:', foundUrl);
    }
    // PRIORIDAD 8: fileUrl (archivo único)
    else if (commitment.fileUrl && commitment.fileUrl.trim() !== '') {
      foundUrl = commitment.fileUrl;
      console.log('✅ URL de factura encontrada en fileUrl:', foundUrl);
    }

    if (foundUrl) {
      // Verificar que la URL sea válida
      if (foundUrl.includes('firebase') && (foundUrl.includes('googleapis.com') || foundUrl.includes('firebasestorage'))) {
        setInvoiceUrl(foundUrl);
        console.log('📄 ✅ URL de factura establecida (Firebase Storage):', foundUrl);
        console.log('📄 ✅ Nombre del archivo:', commitment.invoice?.fileName || 'Nombre no disponible');
      } else {
        setInvoiceUrl(foundUrl);
        console.log('📄 ✅ URL de factura establecida (otro origen):', foundUrl);
      }
    } else {
      setInvoiceUrl(null);
      console.log('⚠️ NINGÚN CAMPO DE ARCHIVO ENCONTRADO');
      console.log('🔍 Estructura del campo invoice:', commitment.invoice);
      console.log('🔍 Todos los campos disponibles:', Object.keys(commitment));
      
      // Debug adicional: buscar cualquier campo que contenga palabras clave
      Object.keys(commitment).forEach(key => {
        const value = commitment[key];
        if (key.toLowerCase().includes('file') || 
            key.toLowerCase().includes('url') || 
            key.toLowerCase().includes('attachment') || 
            key.toLowerCase().includes('receipt') ||
            key.toLowerCase().includes('invoice') ||
            key.toLowerCase().includes('document')) {
          console.log(`🔍 Campo sospechoso encontrado: ${key} =`, value);
        }
      });
    }
  };

  // Abrir visor PDF
  const handleOpenPdfViewer = () => {
    if (invoiceUrl) {
      setPdfViewerOpen(true);
      console.log('📄 Abriendo visor PDF con URL:', invoiceUrl);
    } else {
      addNotification({
        type: 'warning',
        title: 'Sin factura',
        message: 'Este compromiso no tiene factura adjunta',
        icon: 'warning'
      });
    }
  };

  // Cerrar visor PDF
  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
  };

  // Cambiar tamaño del visor
  const toggleViewerSize = () => {
    setPdfViewerSize(prev => {
      if (prev === 'medium') return 'large';
      if (prev === 'large') return 'small';
      return 'medium';
    });
  };

  // Abrir PDF en nueva pestaña
  const handleOpenInNewTab = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
      console.log('🔗 Abriendo PDF en nueva pestaña:', invoiceUrl);
    }
  };

  const paymentMethods = [
    'Transferencia',
    'PSE',
    'Efectivo'
  ];

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.commitmentId) newErrors.commitmentId = 'Debe seleccionar un compromiso';
    if (!formData.method) newErrors.method = 'El método de pago es requerido';
    if (!formData.reference) newErrors.reference = 'La referencia es requerida';
    if (!formData.date) newErrors.date = 'La fecha es requerida';
    
    // Validar intereses si se requieren
    if (requiresInterests(selectedCommitment, formData.date)) {
      if (!areInterestsComplete()) {
        if (isColjuegosCommitment(selectedCommitment)) {
          newErrors.interests = 'Debe ingresar al menos uno de los tipos de intereses de Coljuegos';
        } else {
          newErrors.interests = 'Debe ingresar el monto de intereses por mora';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('🎯 handleSubmit INICIADO - event:', event);
    
    // Verificar autenticación
    if (!user) {
      addNotification({
        type: 'error',
        title: 'No autenticado',
        message: 'Debe iniciar sesión para registrar pagos',
        icon: 'error'
      });
      return;
    }
    
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: 'Formulario incompleto',
        message: 'Por favor complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Iniciando proceso de pago...');
      console.log('👤 Usuario autenticado:', user?.uid, user?.email);
      console.log('📋 Selected commitment completo:', JSON.stringify(selectedCommitment, null, 2));
      console.log('📝 Form data completo:', JSON.stringify(formData, null, 2));
      
      // Subir archivos primero
      console.log('📎 Subiendo archivos...');
      const uploadedFileUrls = await uploadFiles();
      console.log('✅ Archivos subidos:', uploadedFileUrls);
      
      // Preparar datos del pago incluyendo URLs de archivos
      const paymentData = {
        commitmentId: selectedCommitment.id,
        companyName: selectedCommitment.companyName || selectedCommitment.company || 'Sin empresa',
        concept: selectedCommitment.name || selectedCommitment.concept || selectedCommitment.description || 'Sin concepto',
        amount: formData.finalAmount || 0,
        originalAmount: formData.originalAmount || 0,
        interests: formData.interests || 0,  // Intereses generales (sin Coljuegos)
        // 🎰 NUEVOS CAMPOS ESPECÍFICOS DE COLJUEGOS
        interesesDerechosExplotacion: formData.interesesDerechosExplotacion || 0,
        interesesGastosAdministracion: formData.interesesGastosAdministracion || 0,
        derechosExplotacion: formData.derechosExplotacion || 0,        // NUEVO: monto base derechos
        gastosAdministracion: formData.gastosAdministracion || 0,      // NUEVO: monto base gastos
        method: formData.method || '',
        reference: formData.reference || '',
        date: Timestamp.fromDate(createLocalDate(formData.date)),
        notes: formData.notes || '',
        sourceAccount: formData.sourceAccount || '',  // NUEVO: cuenta de origen
        sourceBank: formData.sourceBank || '',        // NUEVO: banco de origen
        
        // 💳 INFORMACIÓN DEL 4x1000 (REFERENCIAL)
        tax4x1000Amount: Math.round((formData.finalAmount * 4) / 1000), // Monto calculado
        includesTax4x1000: formData.finalAmount > 0,                     // Indica si genera 4x1000
        taxInfo: {
          rate4x1000: 0.004,                                             // Tasa aplicada
          base: formData.finalAmount,                                     // Base gravable
          calculated: Math.round((formData.finalAmount * 4) / 1000)       // Impuesto calculado
        },
        
        status: 'completed',
        attachments: uploadedFileUrls || [],
        processedBy: user.uid,
        processedByEmail: user.email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Validar que los campos críticos no estén vacíos
      console.log('🔍 Validando paymentData antes de guardar:', paymentData);
      
      if (!paymentData.commitmentId) {
        throw new Error('ID del compromiso no válido');
      }
      if (!paymentData.concept || paymentData.concept === 'Sin concepto') {
        console.warn('⚠️ Concepto no encontrado en selectedCommitment:', selectedCommitment);
      }
      
      // Guardar el pago en la colección payments
      console.log('💾 Guardando pago en Firebase:', paymentData);
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      console.log('✅ Pago guardado con ID:', paymentRef.id);
      
      // =====================================================
      // GENERAR 4x1000 AUTOMÁTICAMENTE (SI APLICA)
      // =====================================================
      // Generar 4x1000 para CUALQUIER pago que requiera movimiento bancario
      // Esto incluye transferencias, PSE, e incluso retiros para efectivo
      // Para efectivo, se usará una cuenta por defecto si no hay cuenta específica
      if (paymentData.amount > 0) {
        
        // Para pagos sin cuenta específica (ej: efectivo), usar la primera cuenta disponible
        const effectiveSourceAccount = paymentData.sourceAccount || 'Cuenta Corriente Principal';
        const effectiveSourceBank = paymentData.sourceBank || 'Banco Principal';
        
        console.log('💰 Generando 4x1000 para método', paymentData.method, 'de:', formatCurrencyBalance(paymentData.amount));
        
        const tax4x1000Result = await create4x1000Record(
          paymentData.amount,
          effectiveSourceAccount,
          effectiveSourceBank,
          paymentData.companyName,
          paymentData.date,
          paymentRef.id  // 🔗 PASAR ID DEL PAGO PRINCIPAL
        );

        if (tax4x1000Result) {
          console.log('ℹ️ 4x1000 generado automáticamente:', formatCurrencyBalance(tax4x1000Result.amount));
          
          // 🔄 ACTUALIZAR EL PAGO PRINCIPAL CON LA REFERENCIA AL 4x1000
          await updateDoc(paymentRef, {
            tax4x1000PaymentId: tax4x1000Result.id,    // ID del registro de 4x1000 generado
            hasTax4x1000: true,                        // Flag indicando que tiene impuesto asociado
            updatedAt: Timestamp.now()
          });
        }
      }
      
      // Actualizar el compromiso como pagado
      console.log('🔄 Actualizando compromiso como pagado...');
      const commitmentRef = doc(db, 'commitments', selectedCommitment.id);
      await updateDoc(commitmentRef, {
        isPaid: true,
        paid: true,
        paymentDate: Timestamp.fromDate(createLocalDate(formData.date)),
        paidAt: Timestamp.fromDate(createLocalDate(formData.date)), // También agregar paidAt para compatibilidad
        paymentAmount: formData.finalAmount,
        paymentId: paymentRef.id,
        interestPaid: (formData.interests || 0) + (formData.interesesDerechosExplotacion || 0) + (formData.interesesGastosAdministracion || 0),
        paymentMethod: formData.method,
        paymentReference: formData.reference,
        paymentNotes: formData.notes,
        receiptUrl: uploadedFileUrls && uploadedFileUrls.length > 0 ? uploadedFileUrls[0] : null, // Primer archivo para compatibilidad
        receiptUrls: uploadedFileUrls || [], // Todos los archivos
        receiptMetadata: uploadedFileUrls ? uploadedFileUrls.map(url => ({
          url: url,
          uploadedAt: new Date(),
          type: url.includes('.pdf') ? 'pdf' : 'image'
        })) : [],
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ Compromiso actualizado como pagado');
      
      // Recargar la lista de compromisos para quitar el que acaba de ser pagado
      await loadPendingCommitments();
      
      addNotification({
        type: 'success',
        title: 'Pago registrado exitosamente',
        message: `Pago de $${formData.finalAmount.toLocaleString()} registrado para ${selectedCommitment.companyName}`,
        icon: 'success'
      });
      
      // Limpiar el formulario para permitir otro pago
      setSelectedCommitment(null);
      setFormData({
        commitmentId: '',
        method: '',
        reference: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        sourceAccount: '',  // ✅ AGREGAR CAMPOS FALTANTES
        sourceBank: '',     // ✅ AGREGAR CAMPOS FALTANTES
        tax4x1000: 0,      // ✅ AGREGAR CAMPOS FALTANTES
        originalAmount: 0,
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        finalAmount: 0
      });
      setFiles([]);
      
      // Limpiar también la URL de la factura
      setInvoiceUrl(null);
      
      // ✅ DESHABILITADO: No navegar automáticamente después de registrar pago
      // setTimeout(() => {
      //   navigate('/payments');
      // }, 2000);
    } catch (error) {
      console.error('Error guardando pago:', error);
      addNotification({
        type: 'error',
        title: 'Error al registrar pago',
        message: `No se pudo guardar el pago: ${error.message}`,
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  // Funciones para manejo de archivos
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    // Filtrar archivos válidos
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });

    if (validFiles.length !== newFiles.length) {
      addNotification({
        type: 'warning',
        title: 'Archivos filtrados',
        message: 'Solo se permiten imágenes (JPG, PNG) y PDFs menores a 10MB',
        icon: 'warning'
      });
    }

    // 🗜️ PROCESAR CADA ARCHIVO (COMPRIMIR PDFs SI ES NECESARIO)
    validFiles.forEach(file => {
      if (file.type === 'application/pdf' && compressionEnabled && file.size > 100 * 1024) { // Solo comprimir PDFs > 100KB
        // Mostrar vista previa de compresión para PDFs grandes
        setPendingPDFFile(file);
        setCompressionPreviewOpen(true);
      } else {
        // Agregar archivos no-PDF o PDFs pequeños directamente
        addFileToList(file);
      }
    });
  };

  // 🗜️ MANEJAR RESULTADO DE COMPRESIÓN
  const handleCompressionAccept = (compressionResult) => {
    console.log('✅ Compresión aceptada:', compressionResult.stats);
    
    // Convertir el blob comprimido a File objeto
    const compressedFile = new File([compressionResult.compressed], pendingPDFFile.name, {
      type: 'application/pdf'
    });
    
    addFileToList(compressedFile, compressionResult.stats);
    setPendingPDFFile(null);
    
    addNotification({
      type: 'success',
      title: 'PDF Optimizado',
      message: `Archivo comprimido exitosamente (${compressionResult.stats.reductionPercent} reducido)`,
      icon: 'success'
    });
  };

  const handleCompressionReject = () => {
    console.log('❌ Compresión rechazada, usando original');
    addFileToList(pendingPDFFile);
    setPendingPDFFile(null);
    
    addNotification({
      type: 'info',
      title: 'Original Mantenido',
      message: 'Se usará el archivo original sin comprimir',
      icon: 'info'
    });
  };

  // Función auxiliar para agregar archivos a la lista
  const addFileToList = (file, compressionStats = null) => {
    setFiles(prev => [...prev, {
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false,
      url: null,
      compressed: !!compressionStats,
      compressionStats: compressionStats
    }]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Función para convertir imagen a PDF
  const imageToPdf = async (imageFile) => {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await imageFile.arrayBuffer();
    
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error('Tipo de imagen no soportado');
    }

    // Crear página con el tamaño de la imagen
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });

    return pdfDoc;
  };

  // Función para combinar todos los archivos en un solo PDF
  const combineFilesToPdf = async (files) => {
    try {
      const mainPdfDoc = await PDFDocument.create();

      for (const fileData of files) {
        const file = fileData.file;
        
        if (file.type === 'application/pdf') {
          // Si es PDF, copiarlo al documento principal
          const pdfBytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mainPdfDoc.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mainPdfDoc.addPage(page));
        } else if (file.type.startsWith('image/')) {
          // Si es imagen, convertirla a PDF primero
          const imagePdf = await imageToPdf(file);
          const copiedPages = await mainPdfDoc.copyPages(imagePdf, imagePdf.getPageIndices());
          copiedPages.forEach((page) => mainPdfDoc.addPage(page));
        }
      }

      // Generar el PDF combinado
      const pdfBytes = await mainPdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error combining files:', error);
      throw error;
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];

    setUploading(true);
    setUploadProgress(0);

    try {
      let fileToUpload;
      let fileName;

      if (files.length === 1) {
        // Si solo hay un archivo, subirlo directamente
        fileToUpload = files[0].file;
        fileName = files[0].name;
      } else {
        // Si hay múltiples archivos, combinarlos en un PDF
        setUploadProgress(25); // Progreso durante la combinación
        
        addNotification({
          type: 'info',
          title: 'Combinando archivos',
          message: 'Creando PDF combinado con todos los comprobantes...',
          icon: 'info'
        });

        const combinedPdf = await combineFilesToPdf(files);
        fileToUpload = combinedPdf;
        fileName = `comprobantes_pago_${Date.now()}.pdf`;
        
        setUploadProgress(50); // Progreso después de combinar
      }

      // Crear referencia para el archivo
      const timestamp = Date.now();
      const finalFileName = `payments/${timestamp}_${fileName}`;
      const storageRef = ref(storage, finalFileName);

      setUploadProgress(75); // Progreso antes de subir

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100); // Completado

      addNotification({
        type: 'success',
        title: 'Comprobante subido',
        message: files.length > 1 
          ? `${files.length} archivos combinados y subidos como PDF único`
          : 'Comprobante subido exitosamente',
        icon: 'success'
      });

      // Marcar todos los archivos como subidos
      setFiles(prev => prev.map(f => ({ ...f, uploaded: true, url: downloadURL })));

      return [downloadURL];
    } catch (error) {
      console.error('Error uploading files:', error);
      addNotification({
        type: 'error',
        title: 'Error de carga',
        message: 'Hubo un error al procesar y subir los archivos',
        icon: 'error'
      });
      return [];
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const steps = ['Seleccionar Compromiso', 'Información del Pago', 'Confirmación'];

  return (
    <Box sx={{ p: 3 }}>
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
          mb: 3
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
              FINANZAS • NUEVO PAGO
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
              💳 Registrar Pago de Compromiso
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Seleccione un compromiso pendiente y registre su pago
            </Typography>
          </Box>

          {/* Acciones */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            alignItems: 'center'
          }}>
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

            {/* Botón de regresar */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/payments')}
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
          </Box>
        </Box>
      </Paper>

      {/* Progress Stepper */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
      }}>
        <Stepper activeStep={selectedCommitment ? 1 : 0} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Información Principal */}
          <Grid item xs={12} lg={8}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  Seleccionar Compromiso Pendiente
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Selector de Compromiso Pendiente */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={pendingCommitments}
                      getOptionLabel={(option) => option.displayName || ''}
                      loading={loadingCommitments}
                      value={selectedCommitment}
                      onChange={(event, newValue) => handleCommitmentSelect(newValue)}
                      noOptionsText={
                        loadingCommitments 
                          ? "Cargando compromisos..." 
                          : "No hay compromisos pendientes sin pago registrado"
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Compromiso a Pagar"
                          placeholder={
                            pendingCommitments.length === 0 && !loadingCommitments
                              ? "No hay compromisos disponibles para pagar..."
                              : "Seleccione un compromiso pendiente..."
                          }
                          fullWidth
                          required
                          helperText={
                            pendingCommitments.length === 0 && !loadingCommitments
                              ? "Solo se muestran compromisos pendientes que aún no tienen pagos registrados"
                              : ""
                          }
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CompanyIcon color="primary" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <>
                                {loadingCommitments ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <li key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {option.companyName}
                                </Typography>
                                <Chip 
                                  label={option.formattedAmount} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {option.concept}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" color="warning.main">
                                  Vencimiento: {option.formattedDueDate}
                                </Typography>
                              </Box>
                            </Box>
                          </li>
                        );
                      }}
                    />
                  </Grid>

                  {/* Información del Compromiso Seleccionado */}
                  {selectedCommitment && (
                    <>
                      <Grid item xs={12}>
                        <Card 
                          variant="outlined"
                          sx={{ 
                            mt: 2,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`
                          }}
                        >
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="subtitle1" sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <CompanyIcon color="action" fontSize="small" />
                              {selectedCommitment.companyName}
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Concepto:</strong> {selectedCommitment.concept}
                                </Typography>
                              </Grid>
                              
                              {selectedCommitment.beneficiary && (
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="primary.main" sx={{ 
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                  }}>
                                    <PersonIcon fontSize="small" />
                                    <strong>Proveedor:</strong> {selectedCommitment.beneficiary}
                                  </Typography>
                                </Grid>
                              )}
                              
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Vencimiento:</strong> {selectedCommitment.formattedDueDate}
                                </Typography>
                              </Grid>
                            
                            {/* Botón para ver factura - Solo si existe */}
                            {invoiceUrl && (
                              <Grid item xs={12} sx={{ mt: 1 }}>
                                <Button
                                  variant="text"
                                  size="small"
                                  startIcon={<ViewIcon />}
                                  onClick={handleOpenPdfViewer}
                                  sx={{ 
                                    color: 'primary.main',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      backgroundColor: 'action.hover'
                                    }
                                  }}
                                >
                                  Ver Factura Original
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Valor Original"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.originalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon 
                                  sx={{ 
                                    color: 'success.main'
                                  }} 
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Alerta de pago tardío al lado del valor original */}
                      {requiresInterests(selectedCommitment, formData.date) && (
                        <Grid item xs={12} sm={8}>
                          <Box sx={{ 
                            p: 1.5,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            height: '56px' // Mismo alto que el TextField
                          }}>
                            <InterestIcon color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              {isColjuegosCommitment(selectedCommitment) 
                                ? "Pago posterior al vencimiento - Calcular intereses específicos de Coljuegos"
                                : "Pago posterior al vencimiento - Calcular intereses por mora"
                              }
                            </Typography>
                          </Box>
                        </Grid>
                      )}

                      {/* Campos de Intereses - Solo cuando la fecha de pago es posterior al vencimiento */}
                      {requiresInterests(selectedCommitment, formData.date) ? (
                        <>
                          {(() => {
                            const isColj = isColjuegosCommitment(selectedCommitment);
                            console.log('Rendering interest fields - Is Coljuegos:', isColj);
                            return isColj;
                          })() ? (
                            <>
                              {/* Intereses específicos para Coljuegos */}
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Intereses Derechos de Explotación"
                                  value={formData.interesesDerechosExplotacion > 0 ? formatCurrency(formData.interesesDerechosExplotacion) : ''}
                                  onChange={(e) => {
                                    const numericValue = parseCurrency(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesDerechosExplotacion: numericValue,
                                      finalAmount: prev.originalAmount + numericValue + prev.interesesGastosAdministracion
                                    }));
                                  }}
                                  fullWidth
                                  placeholder="0"
                                  error={errors.interests && formData.interesesDerechosExplotacion === 0 && formData.interesesGastosAdministracion === 0}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon 
                                          sx={{ 
                                            color: 'warning.main',
                                            transition: 'color 0.2s ease'
                                          }} 
                                        />
                                        <Typography sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                          $
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&:hover': {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'primary.main'
                                        },
                                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                          color: 'primary.main'
                                        }
                                      },
                                      '&.Mui-focused': {
                                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                          color: 'primary.main'
                                        }
                                      }
                                    }
                                  }}
                                  helperText="Para derechos de explotación"
                                />
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Intereses Gastos de Administración"
                                  value={formData.interesesGastosAdministracion > 0 ? formatCurrency(formData.interesesGastosAdministracion) : ''}
                                  onChange={(e) => {
                                    const numericValue = parseCurrency(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesGastosAdministracion: numericValue,
                                      finalAmount: prev.originalAmount + prev.interesesDerechosExplotacion + numericValue
                                    }));
                                  }}
                                  fullWidth
                                  placeholder="0"
                                  error={errors.interests && formData.interesesDerechosExplotacion === 0 && formData.interesesGastosAdministracion === 0}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon 
                                          sx={{ 
                                            color: 'error.main',
                                            transition: 'color 0.2s ease'
                                          }} 
                                        />
                                        <Typography sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                          $
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&:hover': {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'primary.main'
                                        },
                                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                          color: 'primary.main'
                                        }
                                      },
                                      '&.Mui-focused': {
                                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                          color: 'primary.main'
                                        }
                                      }
                                    }
                                  }}
                                  helperText="Para gastos de administración"
                                />
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Total Intereses"
                                  value={new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                  }).format(formData.interesesDerechosExplotacion + formData.interesesGastosAdministracion)}
                                  fullWidth
                                  disabled
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon 
                                          sx={{ 
                                            color: 'secondary.main'
                                          }} 
                                        />
                                      </InputAdornment>
                                    ),
                                  }}
                                  helperText="Suma de ambos tipos de intereses"
                                />
                              </Grid>
                            </>
                          ) : (
                            <>
                              {/* Intereses regulares para otros compromisos */}
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  label="Intereses por Mora"
                                  value={formData.interests > 0 ? formatCurrency(formData.interests) : ''}
                                  onChange={(e) => {
                                    const numericValue = parseCurrency(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: numericValue,
                                      finalAmount: prev.originalAmount + numericValue
                                    }));
                                  }}
                                  fullWidth
                                  placeholder="0"
                                  error={errors.interests && formData.interests === 0}
                                  helperText={errors.interests && formData.interests === 0 ? "Requerido para pagos tardíos" : "Monto de intereses por mora"}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon 
                                          sx={{ 
                                            color: 'warning.main',
                                            transition: 'color 0.2s ease'
                                          }} 
                                        />
                                        <Typography sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                          $
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      '&:hover': {
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'primary.main'
                                        },
                                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                          color: 'primary.main'
                                        }
                                      },
                                      '&.Mui-focused': {
                                        '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                          color: 'primary.main'
                                        }
                                      }
                                    }
                                  }}
                                />
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                {/* Espacio vacío para mantener layout */}
                              </Grid>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Mensaje cuando no se requieren intereses */}
                          <Grid item xs={12}>
                            <Typography variant="body2" color="success.main" sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              mt: 1,
                              fontWeight: 500
                            }}>
                              ✅ Pago a tiempo - Sin intereses adicionales
                            </Typography>
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Total a Pagar"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.finalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon 
                                  sx={{ 
                                    color: 'primary.main'
                                  }} 
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: 600,
                              color: 'primary.main',
                              fontSize: '1rem'
                            }
                          }}
                        />
                      </Grid>

                      {/* Campo visual del 4x1000 - Visible cuando hay monto válido */}
                      {formData.finalAmount > 0 && (
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="4x1000 (Automático)"
                            value={new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(formData.tax4x1000)}
                            fullWidth
                            disabled
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ReceiptIcon 
                                    sx={{ 
                                      color: 'info.main'
                                    }} 
                                  />
                                </InputAdornment>
                              ),
                            }}
                            helperText="Se registra automáticamente"
                          />
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        {/* Espaciador visual */}
                        <Box sx={{ my: 1 }} />
                      </Grid>

                      {/* Campo de cuenta de origen */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors.sourceAccount}>
                          <InputLabel>Cuenta de Origen</InputLabel>
                          <Select
                            value={formData.sourceAccount}
                            label="Cuenta de Origen"
                            onChange={(e) => handleSourceAccountSelect(e.target.value)}
                            disabled={loadingCompanies}
                            startAdornment={
                              <InputAdornment position="start">
                                <CompanyIcon 
                                  sx={{ 
                                    color: 'success.main',
                                    transition: 'color 0.2s ease',
                                    '.MuiOutlinedInput-root:hover &': {
                                      color: 'primary.main'
                                    },
                                    '.MuiOutlinedInput-root.Mui-focused &': {
                                      color: 'primary.main'
                                    }
                                  }} 
                                />
                              </InputAdornment>
                            }
                            sx={{
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              }
                            }}
                          >
                            <MenuItem value="">
                              <em>Seleccionar cuenta de origen</em>
                            </MenuItem>
                            {getBankAccounts().map((account) => (
                              <MenuItem 
                                key={`${account.id}-${account.bankAccount}`} 
                                value={account.bankAccount}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <Box sx={{ mr: 1 }}>
                                    {account.type === 'personal' ? <PersonIcon fontSize="small" /> : <CompanyIcon fontSize="small" />}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {account.bankAccount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {account.bankName} - {account.companyName} {account.type === 'personal' ? '(Personal)' : '(Empresarial)'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                            {getBankAccounts().length === 0 && (
                              <MenuItem disabled>
                                <Typography variant="body2" color="text.secondary">
                                  {loadingCompanies ? 'Cargando...' : 'No hay cuentas bancarias registradas'}
                                </Typography>
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Campo de banco (autocompletado) */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Banco de Origen"
                          value={formData.sourceBank}
                          fullWidth
                          disabled={true}
                          placeholder="Se autocompleta al seleccionar cuenta"
                          helperText="Se completa automáticamente al seleccionar una cuenta"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CompanyIcon 
                                  sx={{ 
                                    color: 'success.light'
                                  }} 
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.action.hover,
                            },
                            '& .MuiInputLabel-root.Mui-disabled': {
                              color: theme.palette.text.secondary
                            }
                          }}
                        />
                      </Grid>

                      {/* Mensaje informativo sobre cuentas bancarias */}
                      {getBankAccounts().length === 0 && !loadingCompanies && (
                        <Grid item xs={12}>
                          <Alert 
                            severity="info" 
                            variant="outlined"
                            sx={{ mt: 1 }}
                          >
                            <Typography variant="body2">
                              <strong>💡 Tip:</strong> Para registrar cuentas de origen, agrega información bancaria en la sección de Empresas o en Cuentas Personales desde el menú principal.
                            </Typography>
                          </Alert>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors.method}>
                          <InputLabel>Método de Pago</InputLabel>
                          <Select
                            value={formData.method}
                            onChange={handleInputChange('method')}
                            label="Método de Pago"
                            startAdornment={
                              <InputAdornment position="start">
                                <ReceiptIcon 
                                  sx={{ 
                                    color: 'secondary.main',
                                    transition: 'color 0.2s ease',
                                    '.MuiOutlinedInput-root:hover &': {
                                      color: 'primary.main'
                                    },
                                    '.MuiOutlinedInput-root.Mui-focused &': {
                                      color: 'primary.main'
                                    }
                                  }} 
                                />
                              </InputAdornment>
                            }
                            sx={{
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              }
                            }}
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method} value={method}>
                                {method}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Referencia/ID del Pago"
                          value={formData.reference}
                          onChange={handleInputChange('reference')}
                          fullWidth
                          error={!!errors.reference}
                          helperText={errors.reference}
                          placeholder="Ej: TRF-2025-001, CHE-12345"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachIcon 
                                  sx={{ 
                                    color: 'info.main',
                                    transition: 'color 0.2s ease'
                                  }} 
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main'
                                },
                                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                  color: 'primary.main'
                                }
                              },
                              '&.Mui-focused': {
                                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                  color: 'primary.main'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Fecha del Pago"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange('date')}
                          fullWidth
                          error={!!errors.date}
                          helperText={errors.date}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <ScheduleIcon 
                                  sx={{ 
                                    color: 'warning.main',
                                    transition: 'color 0.2s ease'
                                  }} 
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main'
                                },
                                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                  color: 'primary.main'
                                }
                              },
                              '&.Mui-focused': {
                                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                  color: 'primary.main'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Observaciones"
                          value={formData.notes}
                          onChange={handleInputChange('notes')}
                          fullWidth
                          multiline
                          rows={1}
                          placeholder="Notas adicionales sobre el pago..."
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SaveIcon 
                                  sx={{ 
                                    color: 'grey.600',
                                    transition: 'color 0.2s ease'
                                  }} 
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main'
                                },
                                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                  color: 'primary.main'
                                }
                              },
                              '&.Mui-focused': {
                                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                  color: 'primary.main'
                                }
                              }
                            }
                          }}
                        />
                      </Grid>

                      {/* Sección de carga de archivos */}
                      <Grid item xs={12}>
                        <Typography variant="body1" gutterBottom sx={{ 
                          fontWeight: 600, 
                          color: 'text.primary',
                          mt: 2
                        }}>
                          Comprobantes de Pago
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        {/* Zona de drag & drop */}
                        <Card 
                          sx={{ 
                            border: dragActive ? `2px dashed ${theme.palette.primary.main}` : `2px dashed ${alpha(theme.palette.primary.main, 0.6)}`,
                            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderColor: alpha(theme.palette.primary.main, 0.8)
                            }
                          }}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <input
                              type="file"
                              multiple
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleFileSelect}
                              style={{ display: 'none' }}
                              id="file-upload"
                            />
                            <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                Seleccionar Comprobantes
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                JPG, PNG, PDF (máx. 10MB c/u) • Múltiples archivos se combinan en PDF
                              </Typography>
                              <Button
                                variant="outlined"
                                startIcon={<AttachIcon />}
                                component="span"
                              >
                                Examinar Archivos
                              </Button>
                            </label>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Lista de archivos seleccionados */}
                      {files.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                            Archivos Seleccionados ({files.length})
                          </Typography>
                          <List dense sx={{ 
                            bgcolor: 'background.paper', 
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}>
                            {files.map((fileData) => (
                              <ListItem key={fileData.id} sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <FileIcon color={fileData.uploaded ? 'success' : 'default'} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" noWrap>
                                      {fileData.name}
                                    </Typography>
                                  }
                                  secondary={`${Math.round(fileData.size / 1024)} KB`}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    onClick={() => removeFile(fileData.id)}
                                    size="small"
                                    disabled={uploading}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}

                      {/* Barra de progreso durante la carga */}
                      {uploading && (
                        <Grid item xs={12}>
                          <Box sx={{ width: '100%', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Subiendo archivos... {uploadProgress}%
                            </Typography>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                          </Box>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel de Resumen */}
          <Grid item xs={12} lg={4}>
            <Card 
              sx={{ 
                position: 'sticky', 
                top: 20,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: 'text.primary',
                  fontWeight: 600
                }}>
                  <ReceiptIcon color="primary" />
                  Resumen de Pago
                </Typography>
                
                {selectedCommitment ? (
                  <Box>
                    {/* Info del compromiso simplificada */}
                    <Box sx={{ 
                      mb: 2, 
                      p: 1.5, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {selectedCommitment.companyName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedCommitment.concept}
                      </Typography>
                    </Box>
                    
                    {/* Breakdown de costos */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Valor Base:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.originalAmount)}
                        </Typography>
                      </Box>
                      
                      {/* Intereses - Simplificados */}
                      {(formData.interests > 0 || formData.interesesDerechosExplotacion > 0 || formData.interesesGastosAdministracion > 0) && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Intereses:</Typography>
                          <Typography variant="body2" color="warning.main" fontWeight={500}>
                            +{new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(
                              formData.interests + 
                              formData.interesesDerechosExplotacion + 
                              formData.interesesGastosAdministracion
                            )}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" color="primary">Total:</Typography>
                        <Typography variant="h6" color="primary" fontWeight={700}>
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.finalAmount)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Mostrar información del 4x1000 si aplica */}
                    {(formData.method === 'Transferencia' || formData.method === 'PSE') && formData.sourceAccount && formData.tax4x1000 > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        + 4x1000: {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(formData.tax4x1000)} (registro separado)
                      </Typography>
                    )}

                    {files.length > 0 && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
                        ✓ {files.length === 1 ? '1 comprobante' : `${files.length} comprobantes`}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 3,
                    color: 'text.secondary'
                  }}>
                    <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">
                      Seleccione un compromiso para ver el resumen
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botones de Acción */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            <CancelIcon sx={{ mr: 1 }} />
            Cancelar
          </Button>
          
          <Box sx={{ position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || uploading}
              sx={{ minWidth: 120 }}
              onClick={() => {
                console.log('🔘 Botón clicked - Estado del formulario:');
                console.log('- isSubmitting:', isSubmitting);
                console.log('- uploading:', uploading);
                console.log('- selectedCommitment:', !!selectedCommitment);
                console.log('- areInterestsComplete():', areInterestsComplete());
                console.log('- requiresInterests:', requiresInterests(selectedCommitment, formData.date));
                console.log('- formData:', formData);
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} />
              ) : uploading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Subiendo...
                </>
              ) : (
                <>
                  <SaveIcon sx={{ mr: 1 }} />
                  Registrar Pago
                </>
              )}
            </Button>
            
            {/* Mensaje de ayuda cuando el botón está deshabilitado por intereses */}
            {selectedCommitment && 
             requiresInterests(selectedCommitment, formData.date) && 
             !areInterestsComplete() && (
              <Typography 
                variant="caption" 
                color="warning.main" 
                sx={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  mt: 0.5,
                  fontStyle: 'italic',
                  fontSize: '0.7rem'
                }}
              >
                ⚠️ Ingrese los intereses para habilitar el pago
              </Typography>
            )}
          </Box>
        </Box>
      </form>

      {/* 📄 VISOR PDF DE FACTURA DEL COMPROMISO */}
      <Dialog
        open={pdfViewerOpen}
        onClose={handleClosePdfViewer}
        maxWidth={pdfViewerSize === 'large' ? 'xl' : pdfViewerSize === 'small' ? 'sm' : 'lg'}
        fullWidth
        PaperProps={{
          sx: {
            height: pdfViewerSize === 'large' ? '90vh' : pdfViewerSize === 'small' ? '60vh' : '80vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PdfIcon />
            <Typography variant="h6">
              📄 Factura del Compromiso
            </Typography>
            {selectedCommitment && (
              <Chip 
                label={selectedCommitment.companyName}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Cambiar tamaño">
              <IconButton onClick={toggleViewerSize} sx={{ color: 'white' }}>
                {pdfViewerSize === 'large' ? <MinimizeIcon /> : <MaximizeIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Abrir en nueva pestaña">
              <IconButton onClick={handleOpenInNewTab} sx={{ color: 'white' }}>
                <ExternalLinkIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          p: 0, 
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {invoiceUrl ? (
            <Box sx={{ 
              flex: 1,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {invoiceUrl.includes('.pdf') ? (
                // Visor PDF
                <iframe
                  src={`${invoiceUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'white'
                  }}
                  title="Factura del Compromiso"
                />
              ) : (
                // Visor de imagen
                <Box sx={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2
                }}>
                  <img
                    src={invoiceUrl}
                    alt="Factura del Compromiso"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}>
              <PdfIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                No hay factura disponible
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Este compromiso no tiene factura adjunta
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          background: 'rgba(0,0,0,0.1)',
          justifyContent: 'space-between'
        }}>
          <Typography variant="body2" sx={{ color: 'white', ml: 1 }}>
            {selectedCommitment && (
              <>
                💼 {selectedCommitment.concept} • 
                💰 {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0
                }).format(selectedCommitment.amount || 0)}
              </>
            )}
          </Typography>
          
          <Button 
            onClick={handleClosePdfViewer}
            variant="outlined"
            sx={{ 
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🗜️ DIÁLOGO DE VISTA PREVIA DE COMPRESIÓN */}
      <PDFCompressionPreview
        open={compressionPreviewOpen}
        onClose={() => setCompressionPreviewOpen(false)}
        file={pendingPDFFile}
        onAccept={handleCompressionAccept}
        onReject={handleCompressionReject}
      />
    </Box>
  );
};

export default NewPaymentPage;
