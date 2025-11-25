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
  alpha,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  useTheme
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
  ArrowBack as ArrowBackIcon,
  DateRange as DateRangeIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { useTelegramNotifications } from '../hooks/useTelegramNotifications';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, onSnapshot, orderBy, limit } from 'firebase/firestore';
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
  const { settings } = useSettings();
  const { logActivity } = useActivityLogs();
  const telegram = useTelegramNotifications(); // 🆕 Hook de Telegram
  
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

  // 💰 Funciones para formateo de moneda colombiana (con decimales)
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    
    // Permitir dígitos, punto y coma para decimales
    const cleanValue = value.toString().replace(/[^\d.,]/g, '');
    if (!cleanValue) return '';
    if (cleanValue === '0' || cleanValue === '0,00') return '0';
    
    // Convertir coma a punto para procesamiento
    const normalizedValue = cleanValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    if (isNaN(numValue)) return '';
    
    // Formatear con separadores de miles y decimales colombianos
    return numValue.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return 0;
    // Permitir dígitos, punto y coma
    const cleanValue = formattedValue.toString().replace(/[^\d.,]/g, '');
    if (!cleanValue) return 0;
    
    // Convertir formato colombiano (coma decimal) a formato estándar
    const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  };

  const formatCurrencyDisplay = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
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
    finalAmount: 0,
    // 💰 NUEVO: Campo para pagos parciales
    partialPaymentAmount: 0        // Monto del pago parcial
  });

  const [errors, setErrors] = useState({});
  
  // 💰 NUEVO: Estado para controlar pago parcial
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para archivos
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // 🗜️ ESTADO PARA COMPRESIÓN DE PDFs
  const [compressionPreviewOpen, setCompressionPreviewOpen] = useState(false);
  const [pendingPDFFile, setPendingPDFFile] = useState(null);
  const [pendingPDFQueue, setPendingPDFQueue] = useState([]); // 🆕 Cola de PDFs pendientes
  const [compressionEnabled, setCompressionEnabled] = useState(true); // Compresión habilitada por defecto
  
  // ✅ ESTADO PARA MODAL DE CONFIRMACIÓN
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

  // ✅ NUEVO: Listener en tiempo real para compromisos y pagos
  useEffect(() => {
    if (!user?.uid) return;

    // console.log('🔄 Configurando listeners en tiempo real para compromisos y pagos...');

    // Listener para compromisos (detecta cambios en estados de pago)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfThreeMonthsLater = new Date(currentYear, currentMonth + 3, 1);

    const commitmentsQuery = query(
      collection(db, 'commitments'),
      where('dueDate', '<', startOfThreeMonthsLater),
      orderBy('dueDate', 'asc')
    );

    const unsubscribeCommitments = onSnapshot(commitmentsQuery, (snapshot) => {
      // console.log('🔄 Cambios detectados en compromisos, actualizando lista...');
      // Solo recargar si la página está visible y hay cambios relevantes
      if (!document.hidden) {
        loadPendingCommitments();
      }
    }, (error) => {
      console.error('❌ Error en listener de compromisos:', error);
    });

    // Listener para pagos (detecta eliminaciones y creaciones)
    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(100) // Limitar para performance
    );

    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      // console.log('🔄 Cambios detectados en pagos, actualizando compromisos disponibles...');
      // Solo recargar si la página está visible y hay cambios en pagos
      if (!document.hidden) {
        // Delay para permitir que se procesen las actualizaciones de compromisos
        setTimeout(() => {
          loadPendingCommitments();
        }, 500);
      }
    }, (error) => {
      console.error('❌ Error en listener de pagos:', error);
    });

    // Cleanup listeners
    return () => {
      // console.log('🧹 Limpiando listeners en tiempo real...');
      unsubscribeCommitments();
      unsubscribePayments();
    };
  }, [user?.uid]);

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
        // 💰 Usar saldo pendiente si hay pagos parciales, sino el monto original
        const baseAmount = selectedCommitment.remainingBalance || prev.originalAmount;
        setFormData(prev => ({
          ...prev,
          interests: 0,
          interesesDerechosExplotacion: 0,
          interesesGastosAdministracion: 0,
          finalAmount: baseAmount
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

  // 💰 useEffect para recalcular finalAmount según el tipo de pago y intereses
  useEffect(() => {
    if (!selectedCommitment) return;
    
    // Si es pago parcial, el finalAmount ya está establecido por partialPaymentAmount
    if (isPartialPayment) {
      // En pago parcial, finalAmount = partialPaymentAmount (sin sumar intereses automáticamente)
      // Los intereses se manejarán por separado si es necesario
      return;
    }
    
    // 💰 Si no es pago parcial, calcular el total con intereses USANDO EL SALDO PENDIENTE
    // Si hay pagos parciales previos, usar remainingBalance; si no, usar originalAmount
    const baseAmount = selectedCommitment.remainingBalance || formData.originalAmount || 0;
    const regularInterests = formData.interests || 0;
    const coljuegosInterests1 = formData.interesesDerechosExplotacion || 0;
    const coljuegosInterests2 = formData.interesesGastosAdministracion || 0;
    
    const totalWithInterests = baseAmount + regularInterests + coljuegosInterests1 + coljuegosInterests2;
    
    if (totalWithInterests !== formData.finalAmount) {
      setFormData(prev => ({
        ...prev,
        finalAmount: totalWithInterests
      }));
    }
  }, [
    selectedCommitment,
    isPartialPayment,
    formData.originalAmount,
    formData.interests,
    formData.interesesDerechosExplotacion,
    formData.interesesGastosAdministracion
  ]);

  // Cargar cuentas personales desde Firebase (GLOBALES - visibles para todos los usuarios)
  useEffect(() => {
    // ✅ CAMBIO: Cargar TODAS las cuentas personales, no filtrar por usuario
    const q = query(
      collection(db, 'personal_accounts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // console.log('🌍 [NewPaymentPage] personal_accounts snapshot (GLOBAL) size:', snapshot.size);
        let accounts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            bankName: data.bankName || data.bank || data.bank_name || '',
            bank: data.bank || data.bankName || data.bank_name || '',
            accountNumber: data.accountNumber || data.account || data.bankAccount || '',
            accountOwner: data.accountOwner || data.holderName || data.ownerName || '',
            holderName: data.holderName || data.accountOwner || data.ownerName || '',
            currentBalance: typeof data.currentBalance === 'number' ? data.currentBalance : 0,
            accountType: data.accountType || 'Cuenta Personal',
            rawUserId: data.userId,
            rawUserID: data.userID
          };
        });

        setPersonalAccounts(accounts);
      },
      (error) => {
        console.error('Error cargando cuentas personales:', error);
      }
    );

    return () => unsubscribe();
  }, []); // ✅ Sin dependencia de user

  const loadPendingCommitments = async () => {
    try {
      setLoadingCommitments(true);
      
      // ✅ NUEVA LÓGICA: todos los pendientes del pasado + mes actual + 2 meses adelante
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      
      // Sin límite inferior (para capturar todos los pendientes del pasado)
      // Límite superior: inicio del mes que está 3 meses adelante
      const startOfThreeMonthsLater = new Date(currentYear, currentMonth + 3, 1);
      
      // console.log('📅 NUEVA LÓGICA - Filtrando compromisos: todos del pasado + actual + 2 meses adelante:', {
      //   currentDate: now.toISOString(),
      //   limiteSuperior: startOfThreeMonthsLater.toISOString(),
      //   currentMonth: currentMonth + 1,   // mes actual (human-readable) 
      //   nextMonth1: currentMonth + 2,     // primer mes adelante (human-readable)
      //   nextMonth2: currentMonth + 3,     // segundo mes adelante (human-readable)
      //   currentYear,
      //   note: 'Sin límite inferior - incluye todos los pendientes del pasado'
      // });
      
      // Consultar compromisos: todos del pasado + actual + 2 meses adelante
      const commitmentsQuery = query(
        collection(db, 'commitments'),
        where('dueDate', '<', startOfThreeMonthsLater),
        orderBy('dueDate', 'asc') // Ordenar por fecha para mostrar primero los más antiguos
      );
      
      const snapshot = await getDocs(commitmentsQuery);
      const commitments = [];
      
      // console.log(`📊 Compromisos encontrados en rango (pasado+actual+2futuros): ${snapshot.size}`);
      
      // También consultar todos los pagos ACTIVOS para verificar cuáles compromisos realmente tienen pago válido
      const paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc')
      );
      
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      // console.log('📊 Total de pagos en base de datos:', paymentsSnapshot.size);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const commitmentId = doc.id;
        
        // ✅ NUEVA LÓGICA: Verificar pagos REALES para este compromiso específico
        const commitmentPayments = [];
        paymentsSnapshot.forEach((paymentDoc) => {
          const paymentData = paymentDoc.data();
          if (paymentData.commitmentId === commitmentId && !paymentData.is4x1000Tax) {
            commitmentPayments.push({
              id: paymentDoc.id,
              ...paymentData
            });
          }
        });
        
        // console.log(`� Compromiso "${data.concept}" (${data.companyName}):`, {
        //   id: commitmentId,
        //   status: data.status,
        //   paid: data.paid,
        //   isPaid: data.isPaid,
        //   paymentsFound: commitmentPayments.length,
        //   paymentIds: commitmentPayments.map(p => p.id),
        //   dueDate: data.dueDate?.toDate?.() || data.dueDate
        // });
        
        // ✅ LÓGICA CORREGIDA: Verificar SOLO estados que indican pago COMPLETO
  const status = data.status || 'pending';
  const isPaidByStatus = status === 'paid' || status === 'completed';
        const isPaidByFlag = data.paid === true || data.isPaid === true;
        const isPaidByPaymentStatus = data.paymentStatus === 'paid' || data.paymentStatus === 'Pagado' || data.paymentStatus === 'pagado';
        
        // ✅ NUEVA LÓGICA: Verificar si realmente tiene pagos válidos (no solo la marca en el documento)
        const hasActivePayments = commitmentPayments.length > 0;
        const totalPaidAmount = commitmentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const originalAmount = data.amount || 0;
        const remainingBalance = originalAmount - totalPaidAmount;
        
        // 🔧 FIX: Solo considerar "pagado" si tiene la marca Y pagos reales, o si el saldo restante es <= 0
        const isReallyPaid = (isPaidByStatus || isPaidByFlag || isPaidByPaymentStatus) && hasActivePayments;
        const isFullyPaidByAmount = hasActivePayments && remainingBalance <= 0;

        // 🛠 NORMALIZACIÓN: si NO hay pagos reales pero está marcado como pagado en flags, lo tratamos como pendiente/overdue
        let effectiveStatus = status;
        if (!hasActivePayments && (isPaidByStatus || isPaidByFlag || isPaidByPaymentStatus)) {
          // Determinar si está vencido
            try {
              const dueJS = data.dueDate?.toDate?.() || data.dueDate;
              if (dueJS) {
                const due = new Date(dueJS);
                due.setHours(0,0,0,0);
                const today = new Date();
                today.setHours(0,0,0,0);
                effectiveStatus = due < today ? 'overdue' : 'pending';
              } else {
                effectiveStatus = 'pending';
              }
            } catch(normalizeErr) {
              console.warn('⚠️ Error normalizando status, usando pending por defecto:', normalizeErr);
              effectiveStatus = 'pending';
            }
          // console.log('🛠 Normalización aplicada: compromiso sin pagos pero marcado pagado. Nuevo status:', effectiveStatus);
        }

        // Excluir solo si realmente está pagado y existen pagos válidos
        const shouldExclude = hasActivePayments && (isReallyPaid || isFullyPaidByAmount);
        
        // console.log(`🔍 ANÁLISIS DETALLADO "${data.companyName} - ${data.concept}":`, {
        //   id: commitmentId,
        //   status: data.status,
        //   paid: data.paid,
        //   isPaid: data.isPaid,
        //   paymentStatus: data.paymentStatus,
        //   hasActivePayments,
        //   paymentsCount: commitmentPayments.length,
        //   originalAmount,
        //   totalPaidAmount,
        //   remainingBalance,
        //   isReallyPaid,
        //   isFullyPaidByAmount,
        //   shouldExclude,
        //   willBeIncluded: !shouldExclude && (effectiveStatus === 'pending' || effectiveStatus === 'overdue' || effectiveStatus === 'partial_payment')
        // });
        
        // ✅ NUEVA LÓGICA: Incluir compromisos que no están realmente pagados
  if ((effectiveStatus === 'pending' || effectiveStatus === 'overdue' || effectiveStatus === 'partial_payment') && !shouldExclude) {
          
          // console.log(`✅ Compromiso DISPONIBLE agregado:`, {
          //   id: commitmentId,
          //   concept: data.concept,
          //   company: data.companyName,
          //   originalAmount,
          //   totalPaidAmount, 
          //   remainingBalance: remainingBalance > 0 ? remainingBalance : originalAmount,
          //   hasPartialPayments: commitmentPayments.length > 0,
          //   effectiveStatus
          // });
          
          const displayBalance = remainingBalance > 0 ? remainingBalance : originalAmount;
          const isPartialPaymentScenario = commitmentPayments.length > 0 && remainingBalance > 0;
          
            commitments.push({
            id: commitmentId,
            ...data,
              status: effectiveStatus,
            // 💰 NUEVO: Campos para pagos parciales
            originalAmount: originalAmount,
            totalPaid: totalPaidAmount,
            remainingBalance: displayBalance,
            hasPartialPayments: commitmentPayments.length > 0,
            // Formatear datos para el display
            displayName: `${data.companyName || 'Sin empresa'} - ${data.concept || data.name || 'Sin concepto'}${isPartialPaymentScenario ? ' (Saldo Pendiente)' : ''} - ${data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM', { locale: es }) : 'Sin fecha'}`,
            uniqueKey: `${commitmentId}-${data.companyName || 'sin-empresa'}-${data.concept || data.name || 'sin-concepto'}`, // Key única para React
            formattedDueDate: data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM/yyyy', { locale: es }) : 'Sin fecha',
            formattedAmount: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            }).format(displayBalance) // 💰 Mostrar saldo pendiente o monto original
          });
        } else {
          // console.log('🚫 Compromiso OMITIDO:', commitmentId, `"${data.companyName} - ${data.concept}"`, {
          //   reason: shouldExclude ? 'YA TIENE PAGO VÁLIDO' : 'ESTADO NO VÁLIDO',
          //   status: effectiveStatus,
          //   shouldExclude,
          //   hasActivePayments,
          //   totalPaidAmount,
          //   remainingBalance
          // });
        }
      });
      
      // Ordenar por fecha de vencimiento
      commitments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.toDate() - b.dueDate.toDate();
      });
      
      // console.log(`📋 Total compromisos sin pago: ${commitments.length}`);
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
      .filter(company => (company.bankAccount || company.accountNumber) && (company.bankName || company.bank))
      .map(company => {
        const bankAccount = company.bankAccount || company.accountNumber || '';
        const bankName = company.bankName || company.bank || '';
        return {
          id: company.id,
            type: 'business',
            companyName: company.name,
            bankAccount,
            bankName,
            displayText: `${bankAccount} - ${bankName} (${company.name})`
        };
      });

    // Cuentas personales normalizadas
    const personalAccountsList = personalAccounts.map(account => {
      const bankAccount = account.accountNumber || account.bankAccount || account.account || '';
      const bankName = account.bankName || account.bank || '';
      const owner = account.holderName || account.accountOwner || account.ownerName || 'Titular';
      return {
        id: account.id,
        type: 'personal',
        companyName: owner,
        bankAccount,
        bankName,
        displayText: `${bankAccount} - ${bankName} (${owner})`
      };
    });

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
      
      // console.log('✅ Registro 4x1000 creado:', formatCurrencyBalance(tax4x1000));
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
      // Para Coljuegos: al menos uno de los dos tipos debe estar definido (puede ser 0)
      return formData.interesesDerechosExplotacion !== undefined && formData.interesesGastosAdministracion !== undefined;
    } else {
      // Para otros compromisos: debe estar definido (puede ser 0)
      return formData.interests !== undefined;
    }
  };

  // Verificar si la fecha de pago requiere intereses (posterior al vencimiento)
  const requiresInterests = (commitment, paymentDate) => {
    if (!commitment?.dueDate || !paymentDate) return false;
    
    // Convertir dueDate de Firestore a Date local
    const dueDate = commitment.dueDate.toDate();
    dueDate.setHours(0, 0, 0, 0);
    
    // Parsear paymentDate explícitamente en zona local (evitar problemas UTC)
    // Input format: "YYYY-MM-DD"
    const [year, month, day] = paymentDate.split('-').map(Number);
    const payment = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // console.log('Checking interests requirement:', {
    //   dueDate: dueDate.toDateString(),
    //   paymentDate: payment.toDateString(),
    //   dueDateMs: dueDate.getTime(),
    //   paymentMs: payment.getTime(),
    //   isLater: payment > dueDate
    // });
    
    return payment > dueDate;
  };

  // Detectar si es un compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const companyName = commitment.companyName?.toLowerCase() || '';
    const concept = commitment.concept?.toLowerCase() || '';
    const beneficiary = commitment.beneficiary?.toLowerCase() || '';
    
    // console.log('Checking Coljuegos for:', { companyName, concept, beneficiary });
    
    // Buscar por nombre de empresa, concepto o beneficiario relacionado a Coljuegos
    const isColjuegos = companyName.includes('coljuegos') || 
           companyName.includes('col juegos') ||
           beneficiary.includes('coljuegos') ||
           beneficiary.includes('col juegos') ||
           concept.includes('derechos de explotación') ||
           concept.includes('derechos de explotacion') ||
           concept.includes('gastos de administración') ||
           concept.includes('gastos de administracion');
           
    // console.log('Is Coljuegos:', isColjuegos);
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
    
    // 💰 NUEVO: Usar saldo pendiente en lugar del monto original para pagos parciales
    const originalAmount = commitment.originalAmount || commitment.amount || 0;
    const remainingBalance = commitment.remainingBalance || originalAmount;
    const hasPartialPayments = commitment.hasPartialPayments || false;
    
    console.log('💰 Compromiso seleccionado:', {
      id: commitment.id,
      originalAmount,
      remainingBalance,
      hasPartialPayments,
      totalPaid: commitment.totalPaid || 0,
      isColjuegos: isColjuegosCommitment(commitment)
    });
    
    // 🚫 Si es Coljuegos, desactivar automáticamente pago parcial
    if (isColjuegosCommitment(commitment)) {
      setIsPartialPayment(false);
    }

    setFormData(prev => ({
      ...prev,
      commitmentId: commitment.id,
      originalAmount: originalAmount,
      interests: 0,
      interesesDerechosExplotacion: 0,
      interesesGastosAdministracion: 0,
      // CARGAR VALORES BASE DESDE EL COMPROMISO
      derechosExplotacion: commitment.derechosExplotacion || 0,
      gastosAdministracion: commitment.gastosAdministracion || 0,
      finalAmount: remainingBalance,  // 💰 Usar saldo pendiente como monto inicial
      partialPaymentAmount: 0         // 💰 Inicializar campo de pago parcial
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

  // 💰 NUEVAS FUNCIONES PARA PAGOS PARCIALES
  
  // Manejar toggle de pago parcial
  const handlePartialPaymentToggle = (checked) => {
    setIsPartialPayment(checked);
    
    if (checked) {
      // Si se activa pago parcial, limpiar el monto final
      setFormData(prev => ({
        ...prev,
        finalAmount: 0,
        partialPaymentAmount: 0
      }));
    } else {
      // Si se desactiva, usar el saldo pendiente completo
      const remainingBalance = selectedCommitment?.remainingBalance || selectedCommitment?.amount || 0;
      setFormData(prev => ({
        ...prev,
        finalAmount: remainingBalance,
        partialPaymentAmount: 0
      }));
    }
  };

  // Manejar cambio en el monto de pago parcial
  const handlePartialAmountChange = (value) => {
    const numericValue = parseCurrency(value);
    const maxAmount = selectedCommitment?.remainingBalance || selectedCommitment?.amount || 0;
    
    // Validar que no exceda el saldo pendiente
    if (numericValue > maxAmount) {
      setErrors(prev => ({
        ...prev,
        partialPaymentAmount: `No puede exceder el saldo pendiente de ${formatCurrencyDisplay(maxAmount)}`
      }));
      return;
    }
    
    // Limpiar error si existe
    if (errors.partialPaymentAmount) {
      setErrors(prev => ({
        ...prev,
        partialPaymentAmount: ''
      }));
    }
    
    setFormData(prev => ({
      ...prev,
      partialPaymentAmount: numericValue,
      finalAmount: numericValue
    }));
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

  // 📦 MANEJAR CLICK DEL BOTÓN DE GUARDAR (muestra modal de confirmación)
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

    // Mostrar modal de confirmación
    setConfirmDialogOpen(true);
  };

  // ✅ CONFIRMAR Y GUARDAR PAGO (después de confirmar en el modal)
  const handleConfirmPayment = async () => {
    setConfirmDialogOpen(false);
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
        provider: selectedCommitment.provider || selectedCommitment.beneficiary || '',
        beneficiary: selectedCommitment.beneficiary || selectedCommitment.provider || '',
        amount: formData.finalAmount || 0,
        originalAmount: formData.originalAmount || 0,
        interests: formData.interests || 0,  // Intereses generales (sin Coljuegos)
        // 🎰 CAMPOS ESPECÍFICOS DE COLJUEGOS (solo si aplica)
        interesesDerechosExplotacion: formData.interesesDerechosExplotacion || 0,
        interesesGastosAdministracion: formData.interesesGastosAdministracion || 0,
        derechosExplotacion: formData.derechosExplotacion || 0,        // NUEVO: monto base derechos
        gastosAdministracion: formData.gastosAdministracion || 0,      // NUEVO: monto base gastos
        // 💰 CAMPOS ESPECÍFICOS DE PAGOS PARCIALES
        isPartialPayment: isPartialPayment,                            // Flag de pago parcial
        partialPaymentAmount: isPartialPayment ? formData.finalAmount : 0, // Monto del pago parcial
        originalCommitmentAmount: selectedCommitment.originalAmount || selectedCommitment.amount || 0, // Monto original del compromiso
        remainingBalanceBefore: selectedCommitment.remainingBalance || selectedCommitment.amount || 0, // Saldo antes de este pago
        remainingBalanceAfter: isPartialPayment ? 
          (selectedCommitment.remainingBalance || selectedCommitment.amount || 0) - formData.finalAmount : 0, // Saldo después de este pago
        paymentSequence: (selectedCommitment.totalPaid > 0 ? 
          Math.floor(selectedCommitment.totalPaid / 1000) + 1 : 1), // Número de pago parcial
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
      
      // 📝 Registrar actividad de auditoría - Creación de nuevo pago
      await logActivity('create_payment', 'payment', paymentRef.id, {
        concept: paymentData.concept,
        amount: paymentData.finalAmount,
        paymentMethod: paymentData.method,
        companyName: selectedCommitment?.companyName || 'Sin empresa',
        provider: selectedCommitment?.provider || selectedCommitment?.beneficiary || 'Sin proveedor',
        reference: paymentData.reference || 'Sin referencia',
        commitmentId: selectedCommitment?.id,
        isPartialPayment: paymentData.isPartialPayment || false,
        remainingBalance: paymentData.remainingBalanceAfter || 0
      });
      
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
      
      // 💰 LÓGICA PARA PAGOS PARCIALES - Actualizar compromiso según el tipo de pago
      // console.log('🔄 Actualizando compromiso...');
      const commitmentRef = doc(db, 'commitments', selectedCommitment.id);
      
      // Calcular nuevo saldo pendiente
      const originalAmount = selectedCommitment.originalAmount || selectedCommitment.amount || 0;
      const previouslyPaid = selectedCommitment.totalPaid || 0;
      const currentPayment = formData.finalAmount;
      const newTotalPaid = previouslyPaid + currentPayment;
      const newRemainingBalance = originalAmount - newTotalPaid;
      
      console.log('💰 Cálculos de pago parcial:', {
        originalAmount,
        previouslyPaid,
        currentPayment,
        newTotalPaid,
        newRemainingBalance,
        isFullyPaid: newRemainingBalance <= 0
      });

      if (newRemainingBalance <= 0) {
        // 💰 PAGO COMPLETO - Marcar compromiso como totalmente pagado
        await updateDoc(commitmentRef, {
          isPaid: true,
          paid: true,
          status: 'paid',
          paymentDate: Timestamp.fromDate(createLocalDate(formData.date)),
          paidAt: Timestamp.fromDate(createLocalDate(formData.date)),
          paymentAmount: originalAmount, // Monto original total
          totalPaid: newTotalPaid,
          remainingBalance: 0,
          lastPaymentId: paymentRef.id,
          lastPaymentAmount: currentPayment,
          paymentMethod: formData.method,
          paymentReference: formData.reference,
          paymentNotes: formData.notes,
          receiptUrl: uploadedFileUrls && uploadedFileUrls.length > 0 ? uploadedFileUrls[0] : null,
          receiptUrls: uploadedFileUrls || [],
          receiptMetadata: uploadedFileUrls ? uploadedFileUrls.map(url => ({
            url: url,
            uploadedAt: new Date(),
            type: url.includes('.pdf') ? 'pdf' : 'image'
          })) : [],
          interestPaid: (formData.interests || 0) + (formData.interesesDerechosExplotacion || 0) + (formData.interesesGastosAdministracion || 0),
          updatedAt: Timestamp.now()
        });
        console.log('✅ Compromiso marcado como TOTALMENTE PAGADO');
      } else {
        // 💰 PAGO PARCIAL - Mantener compromiso pendiente con nuevo saldo
        await updateDoc(commitmentRef, {
          isPaid: false, // 💰 MANTENER COMO PENDIENTE
          paid: false,
          status: 'partial_payment', // 💰 ESTADO ESPECIAL PARA PAGOS PARCIALES
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          lastPaymentId: paymentRef.id,
          lastPaymentAmount: currentPayment,
          lastPaymentDate: Timestamp.fromDate(createLocalDate(formData.date)),
          paymentMethod: formData.method,
          paymentReference: formData.reference,
          paymentNotes: formData.notes,
          // NO agregar receiptUrl/receiptUrls al compromiso en pagos parciales
          // Los comprobantes quedan en cada pago individual
          interestPaid: (formData.interests || 0) + (formData.interesesDerechosExplotacion || 0) + (formData.interesesGastosAdministracion || 0),
          updatedAt: Timestamp.now()
        });
        console.log('✅ Compromiso actualizado con PAGO PARCIAL - Saldo pendiente:', formatCurrencyDisplay(newRemainingBalance));
      }
      
      // =====================================================
      // 💳 PROCESAMIENTO DE CUOTAS (SI APLICA)
      // =====================================================
      // Recargar la lista de compromisos para quitar el que acaba de ser pagado
      await loadPendingCommitments();

      addNotification({
        type: 'success',
        title: 'Pago registrado exitosamente',
        message: `Pago de $${formData.finalAmount.toLocaleString()} registrado para ${selectedCommitment.companyName}`,
        icon: 'success'
      });

      // 📱 TELEGRAM: Notificar pago registrado
      if (settings?.notificationSettings?.telegramEnabled && settings?.notificationSettings?.telegramChatId) {
        try {
          // Validar y formatear el monto correctamente
          const amountValue = parseFloat(formData.finalAmount);
          const formattedAmount = !isNaN(amountValue) && amountValue > 0
            ? `$${amountValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : 'Monto no especificado';
          
          await telegram.sendPaymentRegisteredNotification(settings.notificationSettings.telegramChatId, {
            companyName: selectedCommitment.companyName || 'Sin empresa',
            beneficiary: selectedCommitment.beneficiary || selectedCommitment.companyName || 'Sin beneficiario',
            amount: formattedAmount,
            paymentDate: format(new Date(formData.date), 'dd/MM/yyyy', { locale: es }),
            concept: selectedCommitment.concept || 'Pago registrado',
            registeredBy: user?.displayName || user?.email || 'Usuario',
            receiptURL: uploadedFileUrls && uploadedFileUrls.length > 0 ? uploadedFileUrls[0] : null
          });
          console.log('✅ Notificación de Telegram enviada para pago', {
            amount: formattedAmount,
            originalAmount: formData.finalAmount,
            parsedAmount: amountValue
          });
        } catch (telegramError) {
          console.warn('⚠️ Error enviando notificación de Telegram (no crítico):', telegramError);
        }
      }
      
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
        finalAmount: 0,
        partialPaymentAmount: 0  // 💰 NUEVO: Limpiar campo de pago parcial
      });
      setFiles([]);
      
      // 💰 NUEVO: Limpiar estado de pago parcial
      setIsPartialPayment(false);
      
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

    // 🗜️ SEPARAR ARCHIVOS: PDFs que necesitan compresión vs archivos directos
    const pdfsToCompress = [];
    const directFiles = [];

    validFiles.forEach(file => {
      if (file.type === 'application/pdf' && compressionEnabled && file.size > 100 * 1024) {
        // PDFs grandes que necesitan compresión
        pdfsToCompress.push(file);
      } else {
        // Archivos que se agregan directamente (imágenes o PDFs pequeños)
        directFiles.push(file);
      }
    });

    // Agregar archivos directos inmediatamente
    directFiles.forEach(file => addFileToList(file));

    // 🆕 AGREGAR PDFs A LA COLA Y PROCESAR EL PRIMERO
    if (pdfsToCompress.length > 0) {
      console.log(`📋 Agregando ${pdfsToCompress.length} PDFs a la cola de compresión`);
      setPendingPDFQueue(pdfsToCompress);
      // Procesar el primer PDF inmediatamente
      setPendingPDFFile(pdfsToCompress[0]);
      setCompressionPreviewOpen(true);
    }
  };

  // 🗜️ MANEJAR RESULTADO DE COMPRESIÓN
  const handleCompressionAccept = (compressionResult) => {
    console.log('✅ Compresión aceptada:', compressionResult.stats);
    
    // Convertir el blob comprimido a File objeto
    const compressedFile = new File([compressionResult.compressed], pendingPDFFile.name, {
      type: 'application/pdf'
    });
    
    addFileToList(compressedFile, compressionResult.stats);
    
    addNotification({
      type: 'success',
      title: 'PDF Optimizado',
      message: `Archivo comprimido exitosamente (${compressionResult.stats.reductionPercent} reducido)`,
      icon: 'success'
    });

    // 🆕 PROCESAR SIGUIENTE PDF EN LA COLA
    processNextPDFInQueue();
  };

  const handleCompressionReject = () => {
    console.log('❌ Compresión rechazada, usando original');
    
    addFileToList(pendingPDFFile);
    
    addNotification({
      type: 'info',
      title: 'Original Mantenido',
      message: 'Se usará el archivo original sin comprimir',
      icon: 'info'
    });

    // 🆕 PROCESAR SIGUIENTE PDF EN LA COLA
    processNextPDFInQueue();
  };

  // 🆕 FUNCIÓN PARA PROCESAR SIGUIENTE PDF EN LA COLA
  const processNextPDFInQueue = () => {
    // Remover el PDF actual de la cola
    const remainingQueue = pendingPDFQueue.slice(1);
    setPendingPDFQueue(remainingQueue);

    if (remainingQueue.length > 0) {
      // Hay más PDFs en la cola, procesar el siguiente
      console.log(`📋 Procesando siguiente PDF (${remainingQueue.length} restantes)`);
      
      addNotification({
        type: 'info',
        title: 'PDFs Pendientes',
        message: `Quedan ${remainingQueue.length} PDF${remainingQueue.length > 1 ? 's' : ''} por procesar`,
        icon: 'info'
      });

      setPendingPDFFile(remainingQueue[0]);
      setCompressionPreviewOpen(true);
    } else {
      // No hay más PDFs en la cola, cerrar modal
      console.log('✅ Todos los PDFs procesados');
      setPendingPDFFile(null);
      setCompressionPreviewOpen(false);
    }
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
                      getOptionLabel={(option) => `${option.displayName || ''} [${option.id.slice(-6)}]`}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      loading={loadingCommitments}
                      value={selectedCommitment}
                      onChange={(event, newValue) => handleCommitmentSelect(newValue)}
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue) return options;
                        
                        const filtered = options.filter(option => {
                          const searchText = inputValue.toLowerCase();
                          
                          // Lista completa de campos a buscar
                          const searchFields = [
                            option.companyName || '',
                            option.concept || '',
                            option.name || '',
                            option.beneficiary || '',
                            option.provider || '',
                            option.formattedAmount || '',
                            option.displayName || '',
                            option.description || '',
                            option.category || '',
                            option.subcategory || '',
                            option.observations || '',
                            option.notes || '',
                            // Incluir campos específicos que podrían contener "salario"
                            option.paymentType || '',
                            option.commitmentType || '',
                            option.frequency || ''
                          ];
                          
                          // Debug: Log para ver qué campos están disponibles
                          if (searchText === 'salario' && options.indexOf(option) === 0) {
                            console.log('🔍 Campos disponibles para búsqueda:', {
                              companyName: option.companyName,
                              concept: option.concept,
                              name: option.name,
                              beneficiary: option.beneficiary,
                              provider: option.provider,
                              displayName: option.displayName,
                              description: option.description,
                              category: option.category,
                              allFields: Object.keys(option)
                            });
                          }
                          
                          // Buscar en todos los campos de texto
                          return searchFields.some(field => 
                            field.toLowerCase().includes(searchText)
                          );
                        });
                        
                        // Ordenar resultados por relevancia
                        return filtered.sort((a, b) => {
                          const searchText = inputValue.toLowerCase();
                          const aCompany = (a.companyName || '').toLowerCase();
                          const bCompany = (b.companyName || '').toLowerCase();
                          const aConcept = (a.concept || a.name || '').toLowerCase();
                          const bConcept = (b.concept || b.name || '').toLowerCase();
                          
                          // Priorizar coincidencias exactas de empresa
                          if (aCompany.startsWith(searchText) && !bCompany.startsWith(searchText)) return -1;
                          if (bCompany.startsWith(searchText) && !aCompany.startsWith(searchText)) return 1;
                          
                          // Priorizar coincidencias exactas de concepto
                          if (aConcept.startsWith(searchText) && !bConcept.startsWith(searchText)) return -1;
                          if (bConcept.startsWith(searchText) && !aConcept.startsWith(searchText)) return 1;
                          
                          // Luego por fecha de vencimiento
                          if (!a.dueDate && !b.dueDate) return 0;
                          if (!a.dueDate) return 1;
                          if (!b.dueDate) return -1;
                          return a.dueDate.toDate() - b.dueDate.toDate();
                        });
                      }}
                      noOptionsText={
                        loadingCommitments 
                          ? "Cargando compromisos..." 
                          : "No se encontraron compromisos que coincidan con su búsqueda"
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Compromiso a Pagar"
                          placeholder={
                            pendingCommitments.length === 0 && !loadingCommitments
                              ? "No hay compromisos disponibles para pagar..."
                              : "Buscar por cualquier texto: empresa, concepto, beneficiario, salario, etc..."
                          }
                          fullWidth
                          required
                          helperText={
                            pendingCommitments.length === 0 && !loadingCommitments
                              ? "Incluye compromisos pendientes y con pagos parciales por completar"
                              : "El filtrado busca en todos los campos del compromiso (concepto, empresa, beneficiario, etc.)"
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
                      renderOption={(props, option, { inputValue }) => {
                        const { key, ...otherProps } = props;
                        
                        // Función para resaltar texto coincidente
                        const highlightText = (text, searchText) => {
                          if (!searchText) return text;
                          
                          const regex = new RegExp(`(${searchText})`, 'gi');
                          const parts = text.split(regex);
                          
                          return parts.map((part, index) => 
                            part.toLowerCase() === searchText.toLowerCase() ? (
                              <span key={index} style={{ 
                                backgroundColor: theme.palette.primary.main + '20',
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                borderRadius: 2,
                                padding: '0 2px'
                              }}>
                                {part}
                              </span>
                            ) : part
                          );
                        };

                        return (
                          <li key={key} {...otherProps}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                width: '100%',
                                py: 1
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                <Box sx={{ flex: 1, mr: 1 }}>
                                  <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                                    {highlightText(option.companyName || 'Sin empresa', inputValue)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2, lineHeight: 1.3 }}>
                                    {highlightText(option.concept || option.name || 'Sin concepto', inputValue)}
                                  </Typography>
                                  {option.beneficiary && (
                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.2, display: 'block' }}>
                                      Beneficiario: {highlightText(option.beneficiary, inputValue)}
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                  <Chip 
                                    label={option.formattedAmount} 
                                    size="small" 
                                    color={option.hasPartialPayments ? 'warning' : 'primary'}
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                  />
                                  {option.hasPartialPayments && (
                                    <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                      Pago Parcial
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                <Typography 
                                  variant="caption" 
                                  color={
                                    option.status === 'overdue' ? 'error.main' : 
                                    option.status === 'partial_payment' ? 'warning.main' : 
                                    'text.secondary'
                                  }
                                >
                                  🗓️ Vence: {option.formattedDueDate}
                                </Typography>
                                {option.status === 'overdue' && (
                                  <Chip 
                                    label="Vencido" 
                                    size="small" 
                                    color="error" 
                                    variant="filled"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                )}
                                {option.status === 'partial_payment' && (
                                  <Chip 
                                    label="Parcial" 
                                    size="small" 
                                    color="warning" 
                                    variant="filled"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                )}
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
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
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
                              
                              {/* 💰 Información de Pagos Parciales */}
                              {selectedCommitment.hasPartialPayments && (
                                <>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                                      <strong>Monto Original:</strong> {new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                      }).format(selectedCommitment.originalAmount)}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                                      <strong>Ya Pagado:</strong> {new Intl.NumberFormat('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                      }).format(selectedCommitment.totalPaid)}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                                      <strong>Saldo Pendiente:</strong> {selectedCommitment.formattedAmount}
                                    </Typography>
                                  </Grid>
                                </>
                              )}
                              
                              {/* Monto total para compromisos sin pagos parciales */}
                              {!selectedCommitment.hasPartialPayments && (
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                                    <strong>Monto Total:</strong> {selectedCommitment.formattedAmount}
                                  </Typography>
                                </Grid>
                              )}
                            
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
                            bgcolor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.background.paper, 0.8)
                              : 'grey.50',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark'
                              ? alpha(theme.palette.divider, 0.3)
                              : 'grey.300',
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
                                  value={formData.interesesDerechosExplotacion !== undefined ? formatCurrency(formData.interesesDerechosExplotacion) : ''}
                                  onChange={(e) => {
                                    const numericValue = parseCurrency(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesDerechosExplotacion: numericValue
                                      // finalAmount se calcula en useEffect
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
                                  value={formData.interesesGastosAdministracion !== undefined ? formatCurrency(formData.interesesGastosAdministracion) : ''}
                                  onChange={(e) => {
                                    const numericValue = parseCurrency(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesGastosAdministracion: numericValue
                                      // finalAmount se calcula en useEffect
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
                                  value={formData.interests !== undefined ? formatCurrency(formData.interests) : ''}
                                  onChange={(e) => {
                                    const numericValue = parseCurrency(e.target.value);
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: numericValue
                                      // finalAmount se calcula en useEffect
                                    }));
                                  }}
                                  fullWidth
                                  placeholder="0"
                                  error={errors.interests && formData.interests === 0}
                                  helperText={errors.interests && formData.interests === 0 ? "Requerido para pagos tardíos" : "Monto de intereses por mora (puede ser $0)"}
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

                      {/* 💰 SECCIÓN DE PAGO PARCIAL */}
                      {selectedCommitment && !isColjuegosCommitment(selectedCommitment) && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.info.main, 0.05),
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              mt: 1
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isPartialPayment}
                                  onChange={(e) => handlePartialPaymentToggle(e.target.checked)}
                                  color="info"
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    Pago Parcial
                                  </Typography>
                                </Box>
                              }
                            />
                            
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                              Pagar solo una parte del compromiso. El saldo restante quedará pendiente.
                            </Typography>

                            {/* Información del compromiso */}
                            <Grid container spacing={2} sx={{ ml: 4, mb: 2 }}>
                              <Grid item xs={12} sm={4}>
                                <Box sx={{ 
                                  p: 1.5, 
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.background.paper, 0.8)
                                    : 'grey.50', 
                                  borderRadius: 1 
                                }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Monto Original
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatCurrencyDisplay(selectedCommitment.originalAmount || selectedCommitment.amount || 0)}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              {selectedCommitment.hasPartialPayments && (
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ 
                                    p: 1.5, 
                                    bgcolor: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.success.main, 0.1)
                                      : 'success.50', 
                                    borderRadius: 1 
                                  }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Total Pagado
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      {formatCurrencyDisplay(selectedCommitment.totalPaid || 0)}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                              
                              <Grid item xs={12} sm={4}>
                                <Box sx={{ 
                                  p: 1.5, 
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.warning.main, 0.1)
                                    : 'warning.50', 
                                  borderRadius: 1 
                                }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Saldo Pendiente
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                                    {formatCurrencyDisplay(selectedCommitment.remainingBalance || selectedCommitment.amount || 0)}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Campo de monto de pago parcial */}
                            {isPartialPayment && (
                              <Box sx={{ ml: 4 }}>
                                <TextField
                                  label="Monto a Pagar"
                                  placeholder="Ej: 1.500.000,50"
                                  value={formatCurrency(formData.partialPaymentAmount)}
                                  onChange={(e) => handlePartialAmountChange(e.target.value)}
                                  fullWidth
                                  error={!!errors.partialPaymentAmount}
                                  helperText={errors.partialPaymentAmount || `Máximo: ${formatCurrencyDisplay(selectedCommitment.remainingBalance || selectedCommitment.amount || 0)} • Puede usar decimales (ej: 1.234.567,89)`}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <MoneyIcon color="info" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{ maxWidth: 300 }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      )}

                      {/* 🚫 MENSAJE PARA COLJUEGOS - NO PERMITE PAGOS PARCIALES */}
                      {selectedCommitment && isColjuegosCommitment(selectedCommitment) && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.info.main, 0.05),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                              mt: 1
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              fontWeight: 500
                            }}>
                              ⚠️ Los compromisos de Coljuegos deben pagarse completos - No se permiten pagos parciales
                            </Typography>
                          </Box>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label={isPartialPayment ? "Saldo Disponible" : "Total a Pagar"}
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(selectedCommitment?.remainingBalance || selectedCommitment?.amount || formData.finalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon 
                                  sx={{ 
                                    color: isPartialPayment ? 'warning.main' : 'primary.main'
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
                        {/* Texto de ayuda para pagos parciales */}
                        {isPartialPayment && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            ℹ️ Este es el saldo pendiente total disponible - ingrese el monto específico arriba
                          </Typography>
                        )}
                        {!isPartialPayment && selectedCommitment?.hasPartialPayments && (
                          <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
                            ℹ️ Este es el saldo pendiente disponible para pago completo
                          </Typography>
                        )}
                      </Grid>

                      {/* Campo adicional: Monto específico de este pago parcial */}
                      {isPartialPayment && formData.partialPaymentAmount > 0 && (
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Monto de este Pago"
                            value={new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(formData.partialPaymentAmount)}
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
                            sx={{
                              '& .MuiInputBase-input': {
                                fontWeight: 600,
                                color: 'success.main',
                                fontSize: '1rem'
                              }
                            }}
                          />
                        </Grid>
                      )}

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
                        <Autocomplete
                          fullWidth
                          options={getBankAccounts()}
                          value={getBankAccounts().find(acc => acc.bankAccount === formData.sourceAccount) || null}
                          onChange={(event, newValue) => {
                            handleSourceAccountSelect(newValue ? newValue.bankAccount : '');
                          }}
                          getOptionLabel={(option) => option.displayText || ''}
                          isOptionEqualToValue={(option, value) => option.bankAccount === value.bankAccount}
                          disabled={loadingCompanies}
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <Box key={key} component="li" {...otherProps}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <Box sx={{ mr: 1 }}>
                                    {option.type === 'personal' ? <PersonIcon fontSize="small" /> : <CompanyIcon fontSize="small" />}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {option.bankAccount}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.bankName} - {option.companyName} {option.type === 'personal' ? '(Personal)' : '(Empresarial)'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Cuenta de Origen"
                              error={!!errors.sourceAccount}
                              helperText={errors.sourceAccount}
                              placeholder="Buscar cuenta... (ej: Bancolombia, 123456)"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CompanyIcon 
                                      sx={{ 
                                        color: 'success.main',
                                        transition: 'color 0.2s ease'
                                      }} 
                                    />
                                  </InputAdornment>
                                ),
                                sx: {
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main'
                                  }
                                }
                              }}
                            />
                          )}
                          noOptionsText={loadingCompanies ? "Cargando..." : "No hay cuentas registradas"}
                        />
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
                        <Autocomplete
                          fullWidth
                          options={paymentMethods}
                          value={formData.method || null}
                          onChange={(event, newValue) => {
                            setFormData({
                              ...formData,
                              method: newValue || ''
                            });
                            // Limpiar error cuando el usuario empiece a escribir
                            if (errors.method) {
                              setErrors({
                                ...errors,
                                method: ''
                              });
                            }
                          }}
                          getOptionLabel={(option) => option || ''}
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <Box key={key} component="li" {...otherProps}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <Box sx={{ mr: 1 }}>
                                    {option === 'Transferencia' && <ReceiptIcon fontSize="small" color="primary" />}
                                    {option === 'PSE' && <AccountBalanceIcon fontSize="small" color="secondary" />}
                                    {option === 'Efectivo' && <MoneyIcon fontSize="small" color="success" />}
                                  </Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {option}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Método de Pago"
                              error={!!errors.method}
                              helperText={errors.method}
                              placeholder="Buscar método... (ej: Transfer, PSE)"
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <ReceiptIcon 
                                      sx={{ 
                                        color: 'secondary.main',
                                        transition: 'color 0.2s ease'
                                      }} 
                                    />
                                  </InputAdornment>
                                ),
                                sx: {
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main'
                                  }
                                }
                              }}
                            />
                          )}
                        />
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
                      bgcolor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.8)
                        : 'grey.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.divider, 0.3)
                        : 'grey.200'
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
                      {/* 💰 Mostrar información específica para pagos parciales */}
                      {selectedCommitment.hasPartialPayments && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="info.main">Monto Original:</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(selectedCommitment.originalAmount || 0)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="success.main">Ya Pagado:</Typography>
                            <Typography variant="body2" color="success.main" fontWeight={500}>
                              -{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(selectedCommitment.totalPaid || 0)}
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>Saldo Pendiente:</Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(selectedCommitment.remainingBalance || 0)}
                            </Typography>
                          </Box>
                        </>
                      )}
                      
                      {/* Para compromisos sin pagos parciales */}
                      {!selectedCommitment.hasPartialPayments && (
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
                      )}
                      
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
                <>
                  <CircularProgress size={20} />
                </>
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
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.default, 0.5)
            : '#f5f5f5',
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
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paper, 0.8)
                      : 'white'
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
        onClose={() => {
          // 🆕 No cerrar si hay archivos en cola, solo si se cancela manualmente
          if (pendingPDFQueue.length <= 1) {
            setCompressionPreviewOpen(false);
            setPendingPDFFile(null);
            setPendingPDFQueue([]);
          }
        }}
        file={pendingPDFFile}
        onAccept={handleCompressionAccept}
        onReject={handleCompressionReject}
        keepOpenAfterAction={pendingPDFQueue.length > 1}  // 🆕 Mantener abierto si hay más archivos
      />

      {/* ✅ MODAL DE CONFIRMACIÓN DE PAGO */}
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
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
              Confirmar Pago
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Revisa la información antes de registrar
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {/* Compromiso */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                COMPROMISO
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CompanyIcon color="primary" fontSize="small" />
                <Typography variant="body1" fontWeight="500">
                  {selectedCommitment?.companyName || 'Sin empresa'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                {selectedCommitment?.concept || selectedCommitment?.name || 'Sin concepto'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Beneficiario */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                BENEFICIARIO
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" fontSize="small" />
                <Typography variant="body1" fontWeight="500">
                  {selectedCommitment?.beneficiary || selectedCommitment?.provider || 'Sin beneficiario'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Montos */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                  MONTO ORIGINAL
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="info" fontSize="small" />
                  <Typography variant="body1" fontWeight="600">
                    ${parseFloat(formData.originalAmount || 0).toLocaleString('es-CO')}
                  </Typography>
                </Box>
              </Grid>

              {/* Intereses - Condicional según tipo de compromiso */}
              {isColjuegosCommitment(selectedCommitment) ? (
                <>
                  {/* Intereses Coljuegos - Derechos de Explotación */}
                  {formData.interesesDerechosExplotacion > 0 && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                        INTERESES DERECHOS
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InterestIcon color="warning" fontSize="small" />
                        <Typography variant="body1" fontWeight="600" color="warning.main">
                          ${parseFloat(formData.interesesDerechosExplotacion || 0).toLocaleString('es-CO')}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {/* Intereses Coljuegos - Gastos de Administración */}
                  {formData.interesesGastosAdministracion > 0 && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                        INTERESES GASTOS
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InterestIcon color="error" fontSize="small" />
                        <Typography variant="body1" fontWeight="600" color="error.main">
                          ${parseFloat(formData.interesesGastosAdministracion || 0).toLocaleString('es-CO')}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  {/* Intereses normales para otros compromisos */}
                  {formData.interests > 0 && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                        INTERESES
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InterestIcon color="warning" fontSize="small" />
                        <Typography variant="body1" fontWeight="600" color="warning.main">
                          ${parseFloat(formData.interests || 0).toLocaleString('es-CO')}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </>
              )}

              {formData.fourPerThousand > 0 && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    4x1000
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceIcon color="error" fontSize="small" />
                    <Typography variant="body1" fontWeight="600" color="error.main">
                      ${parseFloat(formData.fourPerThousand || 0).toLocaleString('es-CO')}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
                }}>
                  <Typography variant="caption" color="primary.main" fontWeight="700" sx={{ mb: 0.5, display: 'block' }}>
                    MONTO TOTAL A PAGAR
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h5" fontWeight="700" color="primary.main">
                      ${parseFloat(formData.finalAmount || 0).toLocaleString('es-CO')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Fecha y método de pago */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                  FECHA DE PAGO
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRangeIcon color="primary" fontSize="small" />
                  <Typography variant="body1" fontWeight="600">
                    {formData.date ? format(createLocalDate(formData.date), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                  MÉTODO DE PAGO
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="primary" fontSize="small" />
                  <Typography variant="body1" fontWeight="600">
                    {formData.method || 'Sin método'}
                  </Typography>
                </Box>
              </Grid>

              {/* Cuenta de Origen */}
              {formData.sourceAccount && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    CUENTA DE ORIGEN
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceIcon color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="body1" fontWeight="600">
                        {formData.sourceAccount}
                      </Typography>
                      {(() => {
                        const accountInfo = getBankAccounts().find(acc => acc.bankAccount === formData.sourceAccount);
                        return accountInfo ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {accountInfo.companyName}
                          </Typography>
                        ) : null;
                      })()}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Pago parcial */}
            {isPartialPayment && (
              <>
                <Divider sx={{ my: 2 }} />
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="600">
                    ⚠️ Pago Parcial
                  </Typography>
                  <Typography variant="caption">
                    Este pago no cubre el monto total del compromiso. El saldo restante quedará pendiente.
                  </Typography>
                </Alert>
              </>
            )}

            {/* Archivos */}
            {files && files.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 0.5, display: 'block' }}>
                    ARCHIVOS ADJUNTOS
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachIcon color="primary" fontSize="small" />
                    <Typography variant="body2">
                      {files.length} archivo{files.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={isSubmitting}
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
            onClick={handleConfirmPayment}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
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
            {isSubmitting ? 'Registrando...' : 'Confirmar y Registrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewPaymentPage;
