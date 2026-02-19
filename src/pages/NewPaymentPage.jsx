import {
  AccountBalance as AccountBalanceIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  DateRange as DateRangeIcon,
  Delete as DeleteIcon,
  Launch as ExternalLinkIcon,
  InsertDriveFile as FileIcon,
  TrendingUp as InterestIcon,
  Fullscreen as MaximizeIcon,
  FullscreenExit as MinimizeIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  Description as PdfIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  SwapHoriz as SwapHorizIcon,
  Warning as WarningIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { PDFDocument } from 'pdf-lib';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useSettings } from '../context/SettingsContext';
import useActivityLogs from '../hooks/useActivityLogs';
import { useTelegramNotifications } from '../hooks/useTelegramNotifications';
// 🗜️ IMPORTAR SISTEMA DE COMPRESIÓN
import PDFCompressionPreview from '../components/common/PDFCompressionPreview';
import AttachmentPreviewDialog from '../components/common/AttachmentPreviewDialog';

const NewPaymentPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { logActivity } = useActivityLogs();
  const telegram = useTelegramNotifications();

  // ============================================================
  // 🎨 CONFIGURACIÓN VISUAL (idéntica a NewCommitmentPage)
  // ============================================================
  const primaryColor = settings?.theme?.primaryColor || theme.palette.primary.main;
  const secondaryColor = settings?.theme?.secondaryColor || theme.palette.secondary.main;
  const borderRadius = settings?.theme?.borderRadius || 8;
  const animationsEnabled = settings?.theme?.animations !== false;
  const fontSize = settings?.theme?.fontSize || 14;
  const compactMode = settings?.sidebar?.compactMode || false;

  const getGradientBackground = () => {
    return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
  };

  // ============================================================
  // 🔧 HELPERS
  // ============================================================
  const createLocalDate = (dateString) => {
    if (!dateString) return new Date();
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateString);
  };

  const calculate4x1000Visual = (amount) => {
    if (amount > 0) {
      return Math.round((amount * 4) / 1000);
    }
    return 0;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    const cleanValue = value.toString().replace(/[^\d.,]/g, '');
    if (!cleanValue) return '';
    if (cleanValue === '0' || cleanValue === '0,00') return '0';
    const normalizedValue = cleanValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.toString().replace(/[^\d.,]/g, '');
    if (!cleanValue) return 0;
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

  const formatCurrencyBalance = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ============================================================
  // 📊 ESTADOS
  // ============================================================

  // 🏢 Modal de selección de compromiso (espejo del modal empresa en NewCommitmentPage)
  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [commitmentLocked, setCommitmentLocked] = useState(false);
  const [selectedCommitmentInModal, setSelectedCommitmentInModal] = useState(null);

  // Compromisos pendientes
  const [pendingCommitments, setPendingCommitments] = useState([]);
  const [loadingCommitments, setLoadingCommitments] = useState(true);
  const [selectedCommitment, setSelectedCommitment] = useState(null);

  // Empresas y cuentas
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [personalAccounts, setPersonalAccounts] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    commitmentId: '',
    method: '',
    reference: '',
    date: getTodayLocalDate(),
    notes: '',
    sourceAccount: '',
    sourceBank: '',
    sourceCompanyName: '',
    tax4x1000: 0,
    originalAmount: 0,
    interests: 0,
    interesesDerechosExplotacion: 0,
    interesesGastosAdministracion: 0,
    derechosExplotacion: 0,
    gastosAdministracion: 0,
    finalAmount: 0,
    partialPaymentAmount: 0
  });

  const [errors, setErrors] = useState({});
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Archivos
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Compresión PDF
  const [compressionPreviewOpen, setCompressionPreviewOpen] = useState(false);
  const [pendingPDFFile, setPendingPDFFile] = useState(null);
  const [pendingPDFQueue, setPendingPDFQueue] = useState([]);
  const [compressionEnabled] = useState(true);

  // Modal de confirmación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Visor PDF factura del compromiso
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [pdfViewerSize, setPdfViewerSize] = useState('medium');

  // Visor de adjuntos (preview antes de confirmar)
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const [attachmentPreviewFile, setAttachmentPreviewFile] = useState(null);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // 📡 EFECTOS
  // ============================================================

  // 🏢 Abrir modal de compromiso si no hay selección bloqueada
  useEffect(() => {
    if (!commitmentLocked && !formData.commitmentId) {
      setCommitmentModalOpen(true);
    }
  }, [commitmentLocked, formData.commitmentId]);

  // Listener en tiempo real para compromisos y pagos
  // onSnapshot dispara inmediatamente al suscribirse → NO necesitamos loadPendingCommitments() separado
  const loadPendingRef = useState({ loading: false, timer: null })[0];

  useEffect(() => {
    if (!user?.uid) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfThreeMonthsLater = new Date(currentYear, currentMonth + 3, 1);

    const commitmentsQuery = query(
      collection(db, 'commitments'),
      where('dueDate', '<', startOfThreeMonthsLater),
      orderBy('dueDate', 'asc')
    );

    // Debounce: si ambos listeners disparan casi al mismo tiempo, solo ejecutar UNA vez
    const debouncedLoad = () => {
      if (loadPendingRef.timer) clearTimeout(loadPendingRef.timer);
      if (loadPendingRef.loading) return; // Ya hay una carga en curso
      loadPendingRef.timer = setTimeout(() => {
        if (!document.hidden) {
          loadPendingCommitments();
        }
      }, 100);
    };

    const unsubscribeCommitments = onSnapshot(commitmentsQuery, () => {
      debouncedLoad();
    }, (error) => {
      console.error('❌ Error en listener de compromisos:', error);
    });

    const paymentsQuery = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribePayments = onSnapshot(paymentsQuery, () => {
      debouncedLoad();
    }, (error) => {
      console.error('❌ Error en listener de pagos:', error);
    });

    return () => {
      unsubscribeCommitments();
      unsubscribePayments();
      if (loadPendingRef.timer) clearTimeout(loadPendingRef.timer);
    };
  }, [user?.uid]);

  // Cargar empresas
  useEffect(() => {
    loadCompanies();
  }, []);

  // Limpiar intereses cuando la fecha ya no los requiere
  useEffect(() => {
    if (selectedCommitment && formData.date) {
      const needsInterests = requiresInterests(selectedCommitment, formData.date);
      if (!needsInterests && (formData.interests > 0 || formData.interesesDerechosExplotacion > 0 || formData.interesesGastosAdministracion > 0)) {
        setFormData(prev => ({
          ...prev,
          interests: 0,
          interesesDerechosExplotacion: 0,
          interesesGastosAdministracion: 0
        }));
      }
    }
  }, [formData.date, selectedCommitment]);

  // Calcular 4x1000 automáticamente
  useEffect(() => {
    const tax4x1000Amount = calculate4x1000Visual(formData.finalAmount);
    if (tax4x1000Amount !== formData.tax4x1000) {
      setFormData(prev => ({
        ...prev,
        tax4x1000: tax4x1000Amount
      }));
    }
  }, [formData.finalAmount]);

  // Recalcular finalAmount según tipo de pago e intereses
  useEffect(() => {
    if (!selectedCommitment) return;
    if (isPartialPayment) return;

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

  // Cargar cuentas personales GLOBALES
  useEffect(() => {
    const q = query(
      collection(db, 'personal_accounts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
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
          };
        });
        setPersonalAccounts(accounts);
      },
      (error) => {
        console.error('Error cargando cuentas personales:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ============================================================
  // 📦 CARGA DE DATOS
  // ============================================================

  const loadPendingCommitments = async () => {
    // Evitar cargas concurrentes
    if (loadPendingRef.loading) return;
    loadPendingRef.loading = true;

    try {
      // Solo mostrar loading en la primera carga (no en recargas por listeners)
      if (pendingCommitments.length === 0) {
        setLoadingCommitments(true);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const startOfThreeMonthsLater = new Date(currentYear, currentMonth + 3, 1);

      const commitmentsQuery = query(
        collection(db, 'commitments'),
        where('dueDate', '<', startOfThreeMonthsLater),
        orderBy('dueDate', 'asc')
      );

      const paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc')
      );

      // 🚀 Ejecutar ambas queries EN PARALELO (antes eran secuenciales)
      const [snapshot, paymentsSnapshot] = await Promise.all([
        getDocs(commitmentsQuery),
        getDocs(paymentsQuery)
      ]);

      // 🚀 Construir Map<commitmentId, Payment[]> para lookup O(1)
      // Antes: O(n*m) — por cada compromiso iteraba TODOS los pagos
      // Ahora: O(n+m) — una pasada para construir el Map + una pasada para los compromisos
      const paymentsByCommitment = new Map();
      paymentsSnapshot.forEach((paymentDoc) => {
        const paymentData = paymentDoc.data();
        if (paymentData.commitmentId && !paymentData.is4x1000Tax) {
          const cid = paymentData.commitmentId;
          if (!paymentsByCommitment.has(cid)) {
            paymentsByCommitment.set(cid, []);
          }
          paymentsByCommitment.get(cid).push({
            id: paymentDoc.id,
            amount: paymentData.amount || 0
          });
        }
      });

      const commitments = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const commitmentId = docSnap.id;

        // 🚀 Lookup O(1) en lugar de iterar todos los pagos
        const commitmentPayments = paymentsByCommitment.get(commitmentId) || [];

        const status = data.status || 'pending';
        const isPaidByStatus = status === 'paid' || status === 'completed';
        const isPaidByFlag = data.paid === true || data.isPaid === true;
        const isPaidByPaymentStatus = data.paymentStatus === 'paid' || data.paymentStatus === 'Pagado' || data.paymentStatus === 'pagado';

        const hasActivePayments = commitmentPayments.length > 0;
        const totalPaidAmount = commitmentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const originalAmount = data.amount || 0;
        const remainingBalance = originalAmount - totalPaidAmount;

        const isReallyPaid = (isPaidByStatus || isPaidByFlag || isPaidByPaymentStatus) && hasActivePayments;
        const isFullyPaidByAmount = hasActivePayments && remainingBalance <= 0;

        // Normalización: si NO hay pagos reales pero está marcado como pagado
        let effectiveStatus = status;
        if (!hasActivePayments && (isPaidByStatus || isPaidByFlag || isPaidByPaymentStatus)) {
          try {
            const dueJS = data.dueDate?.toDate?.() || data.dueDate;
            if (dueJS) {
              const due = new Date(dueJS);
              due.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              effectiveStatus = due < today ? 'overdue' : 'pending';
            } else {
              effectiveStatus = 'pending';
            }
          } catch {
            effectiveStatus = 'pending';
          }
        }

        const shouldExclude = hasActivePayments && (isReallyPaid || isFullyPaidByAmount);

        if ((effectiveStatus === 'pending' || effectiveStatus === 'overdue' || effectiveStatus === 'partial_payment') && !shouldExclude) {
          const displayBalance = remainingBalance > 0 ? remainingBalance : originalAmount;
          const isPartialPaymentScenario = commitmentPayments.length > 0 && remainingBalance > 0;

          commitments.push({
            id: commitmentId,
            ...data,
            status: effectiveStatus,
            originalAmount: originalAmount,
            totalPaid: totalPaidAmount,
            remainingBalance: displayBalance,
            hasPartialPayments: commitmentPayments.length > 0,
            displayName: `${data.companyName || 'Sin empresa'} - ${data.concept || data.name || 'Sin concepto'}${isPartialPaymentScenario ? ' (Saldo Pendiente)' : ''} - ${data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM', { locale: es }) : 'Sin fecha'}`,
            uniqueKey: `${commitmentId}-${data.companyName || 'sin-empresa'}-${data.concept || data.name || 'sin-concepto'}`,
            formattedDueDate: data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM/yyyy', { locale: es }) : 'Sin fecha',
            formattedAmount: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            }).format(displayBalance)
          });
        }
      });

      commitments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.toDate() - b.dueDate.toDate();
      });

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
      loadPendingRef.loading = false;
    }
  };

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesQuery = query(collection(db, 'companies'));
      const snapshot = await getDocs(companiesQuery);
      const companiesData = [];
      snapshot.forEach((docSnap) => {
        companiesData.push({ id: docSnap.id, ...docSnap.data() });
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

  // ============================================================
  // 🏢 MODAL DE SELECCIÓN DE COMPROMISO (espejo del modal empresa)
  // ============================================================

  const handleCommitmentModalConfirm = () => {
    if (!selectedCommitmentInModal) return;

    // Aplicar la selección real
    handleCommitmentSelect(selectedCommitmentInModal);

    // Bloquear compromiso
    setCommitmentLocked(true);
    setCommitmentModalOpen(false);

    addNotification({
      type: 'success',
      title: 'Compromiso seleccionado',
      message: `Pagarás "${selectedCommitmentInModal.companyName} - ${selectedCommitmentInModal.concept || selectedCommitmentInModal.name || 'Sin concepto'}"`,
      icon: 'success',
      color: 'success',
      duration: 3000
    });
  };

  const handleChangeCommitment = () => {
    const hasData = formData.method || formData.reference || formData.notes || files.length > 0;

    if (hasData) {
      const confirmed = window.confirm(
        '⚠️ Si cambias de compromiso, perderás los datos ingresados.\n\n¿Deseas continuar?'
      );
      if (!confirmed) return;
    }

    // Reset todo
    setSelectedCommitmentInModal(null);
    setSelectedCommitment(null);
    setFormData({
      commitmentId: '',
      method: '',
      reference: '',
      date: getTodayLocalDate(),
      notes: '',
      sourceAccount: '',
      sourceBank: '',
      sourceCompanyName: '',
      tax4x1000: 0,
      originalAmount: 0,
      interests: 0,
      interesesDerechosExplotacion: 0,
      interesesGastosAdministracion: 0,
      derechosExplotacion: 0,
      gastosAdministracion: 0,
      finalAmount: 0,
      partialPaymentAmount: 0
    });
    setFiles([]);
    setIsPartialPayment(false);
    setInvoiceUrl(null);
    setErrors({});

    // Desbloquear y abrir modal
    setCommitmentLocked(false);
    setCommitmentModalOpen(true);
  };

  const handleCommitmentModalCancel = () => {
    setCommitmentModalOpen(false);
    navigate(-1); // Regresar a la página anterior
  };

  // ============================================================
  // 💰 LÓGICA DE NEGOCIO (idéntica a V1)
  // ============================================================

  const getBankAccounts = () => {
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
          displayText: `${bankAccount} - ${bankName}`
        };
      });

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
        displayText: `${bankAccount} - ${bankName}`
      };
    });

    return [...businessAccounts, ...personalAccountsList];
  };

  const handleSourceAccountSelect = (selectedAccount) => {
    if (selectedAccount) {
      const accountInfo = getBankAccounts().find(acc => acc.bankAccount === selectedAccount);
      if (accountInfo) {
        setFormData(prev => ({
          ...prev,
          sourceAccount: accountInfo.bankAccount,
          sourceBank: accountInfo.bankName,
          sourceCompanyName: accountInfo.companyName || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        sourceAccount: '',
        sourceBank: '',
        sourceCompanyName: ''
      }));
    }
  };

  const create4x1000Record = async (paymentAmount, sourceAccount, sourceBank, companyName, paymentDate, parentPaymentId = null) => {
    const tax4x1000 = Math.round((paymentAmount * 4) / 1000);
    if (tax4x1000 <= 0) return null;

    try {
      const tax4x1000Data = {
        concept: '4x1000 - Impuesto Gravamen Movimientos Financieros',
        amount: tax4x1000,
        originalAmount: tax4x1000,
        method: 'Transferencia',
        notes: `Impuesto 4x1000 generado automáticamente (${formatCurrencyBalance(paymentAmount)} x 0.004)`,
        reference: `4x1000-${Date.now()}`,
        companyName: companyName,
        sourceAccount: sourceAccount,
        sourceBank: sourceBank,
        date: paymentDate,
        parentPaymentId: parentPaymentId,
        parentPaymentAmount: paymentAmount,
        taxRate: 0.004,
        taxType: '4x1000',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        is4x1000Tax: true,
        relatedToPayment: true,
        isAutomaticTax: true,
        category: 'tax',
        subcategory: 'transaction_tax',
        tags: ['impuesto', '4x1000', 'automatico', 'gmf']
      };

      const taxRef = await addDoc(collection(db, 'payments'), tax4x1000Data);
      return { amount: tax4x1000, id: taxRef.id };
    } catch (error) {
      console.error('❌ Error creando registro 4x1000:', error);
      return null;
    }
  };

  const areInterestsComplete = () => {
    if (!requiresInterests(selectedCommitment, formData.date)) return true;
    if (isColjuegosCommitment(selectedCommitment)) {
      return formData.interesesDerechosExplotacion !== undefined && formData.interesesGastosAdministracion !== undefined;
    }
    return formData.interests !== undefined;
  };

  const requiresInterests = (commitment, paymentDate) => {
    if (!commitment?.dueDate || !paymentDate) return false;
    const dueDate = commitment.dueDate.toDate();
    dueDate.setHours(0, 0, 0, 0);
    const [year, month, day] = paymentDate.split('-').map(Number);
    const payment = new Date(year, month - 1, day, 0, 0, 0, 0);
    return payment > dueDate;
  };

  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const companyName = commitment.companyName?.toLowerCase() || '';
    const concept = commitment.concept?.toLowerCase() || '';
    const beneficiary = commitment.beneficiary?.toLowerCase() || '';
    return companyName.includes('coljuegos') ||
      companyName.includes('col juegos') ||
      beneficiary.includes('coljuegos') ||
      beneficiary.includes('col juegos') ||
      concept.includes('derechos de explotación') ||
      concept.includes('derechos de explotacion') ||
      concept.includes('gastos de administración') ||
      concept.includes('gastos de administracion');
  };

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
      setInvoiceUrl(null);
      return;
    }

    setSelectedCommitment(commitment);
    const originalAmount = commitment.originalAmount || commitment.amount || 0;
    const remainingBalance = commitment.remainingBalance || originalAmount;

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
      derechosExplotacion: commitment.derechosExplotacion || 0,
      gastosAdministracion: commitment.gastosAdministracion || 0,
      finalAmount: remainingBalance,
      partialPaymentAmount: 0,
      method: commitment.paymentMethod || ''
    }));

    extractInvoiceUrl(commitment);
  };

  // ============================================================
  // 📄 VISOR PDF DE FACTURA DEL COMPROMISO
  // ============================================================

  const extractInvoiceUrl = (commitment) => {
    if (!commitment) { setInvoiceUrl(null); return; }

    let foundUrl = null;

    if (commitment.invoice && commitment.invoice.url && commitment.invoice.url.trim() !== '') {
      foundUrl = commitment.invoice.url;
    } else if (commitment.invoiceUrl && commitment.invoiceUrl.trim() !== '') {
      foundUrl = commitment.invoiceUrl;
    } else if (commitment.attachments && commitment.attachments.length > 0) {
      foundUrl = commitment.attachments[commitment.attachments.length - 1];
    } else if (commitment.receiptUrls && commitment.receiptUrls.length > 0) {
      foundUrl = commitment.receiptUrls[commitment.receiptUrls.length - 1];
    } else if (commitment.receiptUrl && commitment.receiptUrl.trim() !== '') {
      foundUrl = commitment.receiptUrl;
    } else if (commitment.attachmentUrls && commitment.attachmentUrls.length > 0) {
      foundUrl = commitment.attachmentUrls[commitment.attachmentUrls.length - 1];
    } else if (commitment.fileUrls && commitment.fileUrls.length > 0) {
      foundUrl = commitment.fileUrls[commitment.fileUrls.length - 1];
    } else if (commitment.fileUrl && commitment.fileUrl.trim() !== '') {
      foundUrl = commitment.fileUrl;
    }

    if (foundUrl) {
      setInvoiceUrl(foundUrl);
    } else {
      setInvoiceUrl(null);
    }
  };

  const handleOpenPdfViewer = () => {
    if (invoiceUrl) {
      setPdfViewerOpen(true);
    } else {
      addNotification({ type: 'warning', title: 'Sin factura', message: 'Este compromiso no tiene factura adjunta', icon: 'warning' });
    }
  };

  const handleClosePdfViewer = () => { setPdfViewerOpen(false); };

  const toggleViewerSize = () => {
    setPdfViewerSize(prev => {
      if (prev === 'medium') return 'large';
      if (prev === 'large') return 'small';
      return 'medium';
    });
  };

  const handleOpenInNewTab = () => {
    if (invoiceUrl) window.open(invoiceUrl, '_blank');
  };

  // ============================================================
  // 💰 PAGOS PARCIALES
  // ============================================================

  const handlePartialPaymentToggle = (checked) => {
    setIsPartialPayment(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, finalAmount: 0, partialPaymentAmount: 0 }));
    } else {
      const remainingBalance = selectedCommitment?.remainingBalance || selectedCommitment?.amount || 0;
      setFormData(prev => ({ ...prev, finalAmount: remainingBalance, partialPaymentAmount: 0 }));
    }
  };

  const handlePartialAmountChange = (value) => {
    const numericValue = parseCurrency(value);
    const maxAmount = selectedCommitment?.remainingBalance || selectedCommitment?.amount || 0;

    if (numericValue > maxAmount) {
      setErrors(prev => ({ ...prev, partialPaymentAmount: `No puede exceder el saldo pendiente de ${formatCurrencyDisplay(maxAmount)}` }));
      return;
    }

    if (errors.partialPaymentAmount) {
      setErrors(prev => ({ ...prev, partialPaymentAmount: '' }));
    }

    setFormData(prev => ({ ...prev, partialPaymentAmount: numericValue, finalAmount: numericValue }));
  };

  // ============================================================
  // 📝 FORMULARIO
  // ============================================================

  const paymentMethods = ['Transferencia', 'PSE', 'Efectivo'];

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.commitmentId) newErrors.commitmentId = 'Debe seleccionar un compromiso';
    if (!formData.method) newErrors.method = 'El método de pago es requerido';
    if (!formData.reference) newErrors.reference = 'La referencia es requerida';
    if (!formData.date) newErrors.date = 'La fecha es requerida';

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
    if (!user) {
      addNotification({ type: 'error', title: 'No autenticado', message: 'Debe iniciar sesión para registrar pagos', icon: 'error' });
      return;
    }
    if (!validateForm()) {
      addNotification({ type: 'error', title: 'Formulario incompleto', message: 'Por favor complete todos los campos requeridos', icon: 'error' });
      return;
    }
    setConfirmDialogOpen(true);
  };

  // ============================================================
  // ✅ CONFIRMAR Y GUARDAR PAGO (idéntico a V1)
  // ============================================================

  const handleConfirmPayment = async () => {
    setConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const uploadedFileUrls = await uploadFiles();

      const paymentData = {
        commitmentId: selectedCommitment.id,
        companyName: selectedCommitment.companyName || selectedCommitment.company || 'Sin empresa',
        concept: selectedCommitment.name || selectedCommitment.concept || selectedCommitment.description || 'Sin concepto',
        provider: selectedCommitment.provider || selectedCommitment.beneficiary || '',
        beneficiary: selectedCommitment.beneficiary || selectedCommitment.provider || '',
        amount: formData.finalAmount || 0,
        originalAmount: formData.originalAmount || 0,
        interests: formData.interests || 0,
        interesesDerechosExplotacion: formData.interesesDerechosExplotacion || 0,
        interesesGastosAdministracion: formData.interesesGastosAdministracion || 0,
        derechosExplotacion: formData.derechosExplotacion || 0,
        gastosAdministracion: formData.gastosAdministracion || 0,
        isPartialPayment: isPartialPayment,
        partialPaymentAmount: isPartialPayment ? formData.finalAmount : 0,
        originalCommitmentAmount: selectedCommitment.originalAmount || selectedCommitment.amount || 0,
        remainingBalanceBefore: selectedCommitment.remainingBalance || selectedCommitment.amount || 0,
        remainingBalanceAfter: isPartialPayment
          ? (selectedCommitment.remainingBalance || selectedCommitment.amount || 0) - formData.finalAmount
          : 0,
        paymentSequence: (selectedCommitment.totalPaid > 0
          ? Math.floor(selectedCommitment.totalPaid / 1000) + 1 : 1),
        method: formData.method || '',
        reference: formData.reference || '',
        date: Timestamp.fromDate(createLocalDate(formData.date)),
        notes: formData.notes || '',
        sourceAccount: formData.sourceAccount || '',
        sourceBank: formData.sourceBank || '',
        tax4x1000Amount: Math.round((formData.finalAmount * 4) / 1000),
        includesTax4x1000: formData.finalAmount > 0,
        taxInfo: {
          rate4x1000: 0.004,
          base: formData.finalAmount,
          calculated: Math.round((formData.finalAmount * 4) / 1000)
        },
        status: 'completed',
        attachments: uploadedFileUrls || [],
        processedBy: user.uid,
        processedByEmail: user.email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (!paymentData.commitmentId) {
        throw new Error('ID del compromiso no válido');
      }

      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);

      // Registrar actividad de auditoría
      await logActivity('create_payment', 'payment', paymentRef.id, {
        concept: paymentData.concept,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        companyName: selectedCommitment?.companyName || 'Sin empresa',
        provider: selectedCommitment?.provider || selectedCommitment?.beneficiary || 'Sin proveedor',
        reference: paymentData.reference || 'Sin referencia',
        commitmentId: selectedCommitment?.id,
        isPartialPayment: paymentData.isPartialPayment || false,
        remainingBalance: paymentData.remainingBalanceAfter || 0
      });

      // Generar 4x1000
      if (paymentData.amount > 0) {
        const effectiveSourceAccount = paymentData.sourceAccount || 'Cuenta Corriente Principal';
        const effectiveSourceBank = paymentData.sourceBank || 'Banco Principal';

        const tax4x1000Result = await create4x1000Record(
          paymentData.amount,
          effectiveSourceAccount,
          effectiveSourceBank,
          paymentData.companyName,
          paymentData.date,
          paymentRef.id
        );

        if (tax4x1000Result) {
          await updateDoc(paymentRef, {
            tax4x1000PaymentId: tax4x1000Result.id,
            hasTax4x1000: true,
            updatedAt: Timestamp.now()
          });
        }
      }

      // Actualizar compromiso
      const commitmentRef = doc(db, 'commitments', selectedCommitment.id);
      const originalAmount = selectedCommitment.originalAmount || selectedCommitment.amount || 0;
      const previouslyPaid = selectedCommitment.totalPaid || 0;
      const currentPayment = formData.finalAmount;
      const newTotalPaid = previouslyPaid + currentPayment;
      const newRemainingBalance = originalAmount - newTotalPaid;

      if (newRemainingBalance <= 0) {
        await updateDoc(commitmentRef, {
          isPaid: true,
          paid: true,
          status: 'paid',
          paymentDate: Timestamp.fromDate(createLocalDate(formData.date)),
          paidAt: Timestamp.fromDate(createLocalDate(formData.date)),
          paymentAmount: originalAmount,
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
      } else {
        await updateDoc(commitmentRef, {
          isPaid: false,
          paid: false,
          status: 'partial_payment',
          totalPaid: newTotalPaid,
          remainingBalance: newRemainingBalance,
          lastPaymentId: paymentRef.id,
          lastPaymentAmount: currentPayment,
          lastPaymentDate: Timestamp.fromDate(createLocalDate(formData.date)),
          paymentMethod: formData.method,
          paymentReference: formData.reference,
          paymentNotes: formData.notes,
          interestPaid: (formData.interests || 0) + (formData.interesesDerechosExplotacion || 0) + (formData.interesesGastosAdministracion || 0),
          updatedAt: Timestamp.now()
        });
      }

      await loadPendingCommitments();

      addNotification({
        type: 'success',
        title: 'Pago registrado exitosamente',
        message: `Pago de $${formData.finalAmount.toLocaleString()} registrado para ${selectedCommitment.companyName}`,
        icon: 'success'
      });

      // Telegram
      if (settings?.notificationSettings?.telegramEnabled && settings?.notificationSettings?.telegramChatId) {
        try {
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
        } catch (telegramError) {
          console.warn('⚠️ Error enviando notificación de Telegram (no crítico):', telegramError);
        }
      }

      // Limpiar formulario para permitir otro pago
      setSelectedCommitment(null);
      setSelectedCommitmentInModal(null);
      setCommitmentLocked(false);
      setFormData({
        commitmentId: '',
        method: '',
        reference: '',
        date: getTodayLocalDate(),
        notes: '',
        sourceAccount: '',
        sourceBank: '',
        sourceCompanyName: '',
        tax4x1000: 0,
        originalAmount: 0,
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        derechosExplotacion: 0,
        gastosAdministracion: 0,
        finalAmount: 0,
        partialPaymentAmount: 0
      });
      setFiles([]);
      setIsPartialPayment(false);
      setInvoiceUrl(null);
      setErrors({});

      // Reabrir modal para siguiente pago
      setTimeout(() => {
        setCommitmentModalOpen(true);
      }, 500);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingCommitments();
    await loadCompanies();
    setTimeout(() => setRefreshing(false), 500);
  };

  // ============================================================
  // 📁 MANEJO DE ARCHIVOS (idéntico a V1)
  // ============================================================

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
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e) => {
    handleFiles(Array.from(e.target.files));
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== newFiles.length) {
      addNotification({ type: 'warning', title: 'Archivos filtrados', message: 'Solo se permiten imágenes (JPG, PNG) y PDFs menores a 10MB', icon: 'warning' });
    }

    const pdfsToCompress = [];
    const directFiles = [];

    validFiles.forEach(file => {
      if (file.type === 'application/pdf' && compressionEnabled && file.size > 100 * 1024) {
        pdfsToCompress.push(file);
      } else {
        directFiles.push(file);
      }
    });

    directFiles.forEach(file => addFileToList(file));

    if (pdfsToCompress.length > 0) {
      setPendingPDFQueue(pdfsToCompress);
      setPendingPDFFile(pdfsToCompress[0]);
      setCompressionPreviewOpen(true);
    }
  };

  const handleCompressionAccept = (compressionResult) => {
    const compressedFile = new File([compressionResult.compressed], pendingPDFFile.name, { type: 'application/pdf' });
    addFileToList(compressedFile, compressionResult.stats);
    addNotification({ type: 'success', title: 'PDF Optimizado', message: `Archivo comprimido exitosamente (${compressionResult.stats.reductionPercent} reducido)`, icon: 'success' });
    processNextPDFInQueue();
  };

  const handleCompressionReject = () => {
    addFileToList(pendingPDFFile);
    addNotification({ type: 'info', title: 'Original Mantenido', message: 'Se usará el archivo original sin comprimir', icon: 'info' });
    processNextPDFInQueue();
  };

  const processNextPDFInQueue = () => {
    const remainingQueue = pendingPDFQueue.slice(1);
    setPendingPDFQueue(remainingQueue);

    if (remainingQueue.length > 0) {
      addNotification({ type: 'info', title: 'PDFs Pendientes', message: `Quedan ${remainingQueue.length} PDF${remainingQueue.length > 1 ? 's' : ''} por procesar`, icon: 'info' });
      setPendingPDFFile(remainingQueue[0]);
      setCompressionPreviewOpen(true);
    } else {
      setPendingPDFFile(null);
      setCompressionPreviewOpen(false);
    }
  };

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
    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
    return pdfDoc;
  };

  const combineFilesToPdf = async (filesToCombine) => {
    try {
      const mainPdfDoc = await PDFDocument.create();
      for (const fileData of filesToCombine) {
        const file = fileData.file;
        if (file.type === 'application/pdf') {
          const pdfBytes = await file.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mainPdfDoc.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mainPdfDoc.addPage(page));
        } else if (file.type.startsWith('image/')) {
          const imagePdf = await imageToPdf(file);
          const copiedPages = await mainPdfDoc.copyPages(imagePdf, imagePdf.getPageIndices());
          copiedPages.forEach((page) => mainPdfDoc.addPage(page));
        }
      }
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
        fileToUpload = files[0].file;
        fileName = files[0].name;
      } else {
        setUploadProgress(25);
        addNotification({ type: 'info', title: 'Combinando archivos', message: 'Creando PDF combinado con todos los comprobantes...', icon: 'info' });
        const combinedPdf = await combineFilesToPdf(files);
        fileToUpload = combinedPdf;
        fileName = `comprobantes_pago_${Date.now()}.pdf`;
        setUploadProgress(50);
      }

      const timestamp = Date.now();
      const finalFileName = `payments/${timestamp}_${fileName}`;
      const storageRef = ref(storage, finalFileName);
      setUploadProgress(75);

      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadProgress(100);

      addNotification({
        type: 'success',
        title: 'Comprobante subido',
        message: files.length > 1
          ? `${files.length} archivos combinados y subidos como PDF único`
          : 'Comprobante subido exitosamente',
        icon: 'success'
      });

      setFiles(prev => prev.map(f => ({ ...f, uploaded: true, url: downloadURL })));
      return [downloadURL];
    } catch (error) {
      console.error('Error uploading files:', error);
      addNotification({ type: 'error', title: 'Error de carga', message: 'Hubo un error al procesar y subir los archivos', icon: 'error' });
      return [];
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ============================================================
  // 🧮 CÁLCULOS DERIVADOS PARA LA UI
  // ============================================================

  const getStatusTag = (commitment) => {
    if (!commitment) return { label: 'Pendiente', color: 'primary' };
    if (commitment.status === 'overdue') return { label: 'Vencido', color: 'error' };
    if (commitment.status === 'partial_payment' || commitment.hasPartialPayments) return { label: 'Parcial', color: 'warning' };
    return { label: 'Pendiente', color: 'primary' };
  };

  const getCompanyInitial = (commitment) => {
    if (!commitment) return '?';
    const name = commitment.companyName || '';
    return name.charAt(0).toUpperCase() || '?';
  };

  const getCompanyAvatarColor = (commitment) => {
    if (!commitment) return getGradientBackground();
    if (commitment.status === 'overdue') return 'linear-gradient(135deg, #ef4444, #dc2626)';
    if (commitment.status === 'partial_payment' || commitment.hasPartialPayments) return 'linear-gradient(135deg, #f59e0b, #ef4444)';
    return getGradientBackground();
  };

  // Contar campos completados para la bottom bar
  const getFilledFieldsCount = () => {
    let filled = 0;
    let total = 4; // method, reference, date, commitment
    if (formData.commitmentId) filled++;
    if (formData.method) filled++;
    if (formData.reference) filled++;
    if (formData.date) filled++;
    return { filled, total };
  };

  const { filled: filledCount, total: totalFields } = getFilledFieldsCount();
  const isFormReady = filledCount === totalFields && formData.finalAmount > 0;

  // ============================================================
  // 🎨 RENDER - ESTILO NEWCOMMITMENTPAGE
  // ============================================================

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* ============================================================ */}
      {/* BANNER HEADER CON GRADIENTE (idéntico a NewCommitmentPage) */}
      {/* ============================================================ */}
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
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: `${borderRadius}px`,
              zIndex: 0,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
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
                  <PaymentIcon sx={{ fontSize: fontSize * 2.3, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="700" sx={{
                    color: 'white',
                    mb: 0.5,
                    fontSize: `${fontSize + 8}px`
                  }}>
                    Registrar Pago de Compromiso
                  </Typography>
                  <Typography variant="subtitle1" sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: `${fontSize + 2}px`
                  }}>
                    Selecciona un compromiso pendiente y registra el pago
                  </Typography>
                </Box>
              </Box>

              {/* Acciones del header */}
              <Box display="flex" gap={1}>
                <Tooltip title="Actualizar lista">
                  <span>
                    <IconButton
                      onClick={handleRefresh}
                      disabled={refreshing}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                      }}
                    >
                      <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Regresar">
                  <IconButton
                    onClick={handleCancel}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Chip de compromiso seleccionado en el header */}
            {commitmentLocked && selectedCommitment && (
              <motion.div
                initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0 }}
                transition={animationsEnabled ? { duration: 0.4, delay: 0.2 } : { duration: 0.1 }}
              >
                <Chip
                  label={`${selectedCommitment.companyName} - ${selectedCommitment.concept || selectedCommitment.name || 'Sin concepto'}`}
                  sx={{
                    mt: 2,
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                  variant="outlined"
                  icon={<ReceiptIcon />}
                />
              </motion.div>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* ============================================================ */}
      {/* CONTENIDO PRINCIPAL - CARD ÚNICA (como NewCommitmentPage) */}
      {/* ============================================================ */}
      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={animationsEnabled ? { duration: 0.5, delay: 0.1 } : { duration: 0.1 }}
      >
        <form onSubmit={handleSubmit}>
          {/* ======================================================== */}
          {/* SECCIÓN 1: INFORMACIÓN DEL COMPROMISO */}
          {/* ======================================================== */}
          <motion.div
            initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1 }}
            animate={{ opacity: 1, x: 0 }}
            transition={animationsEnabled ? { duration: 0.5, delay: 0.2 } : { duration: 0.1 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${borderRadius}px`,
                background: theme.palette.mode === 'dark'
                  ? theme.palette.background.paper
                  : '#ffffff',
                transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                '&:hover': animationsEnabled ? {
                  borderColor: alpha(primaryColor, 0.4),
                  transform: 'translateY(-1px)'
                } : {}
              }}
            >
              {/* Header de sección */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    p: 1,
                    background: getGradientBackground(),
                    borderRadius: `${borderRadius / 2}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: fontSize + 6, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: `${fontSize + 4}px` }}>
                    Información del Compromiso
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compromiso al que se aplicará el pago
                  </Typography>
                </Box>
              </Box>

              {/* Compromiso bloqueado o mensaje vacío */}
              {commitmentLocked && selectedCommitment ? (
                <>
                  {/* Campo bloqueado con info del compromiso */}
                  <Box
                    sx={{
                      border: `1.5px solid ${alpha(theme.palette.success.main, 0.3)}`,
                      borderRadius: `${borderRadius}px`,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      background: alpha(theme.palette.success.main, 0.04)
                    }}
                  >
                    {/* Avatar */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: `${borderRadius / 2}px`,
                        background: getCompanyAvatarColor(selectedCommitment),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {getCompanyInitial(selectedCommitment)}
                    </Box>
                    {/* Info */}
                    <Box flex={1}>
                      <Typography fontWeight="600" variant="body1">
                        {selectedCommitment.companyName} — {selectedCommitment.concept || selectedCommitment.name || 'Sin concepto'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vence: {selectedCommitment.formattedDueDate} · {selectedCommitment.formattedAmount}
                        {selectedCommitment.hasPartialPayments && ' (Saldo pendiente)'}
                      </Typography>
                    </Box>
                    {/* Tag estado */}
                    <Chip
                      label={getStatusTag(selectedCommitment).label}
                      size="small"
                      color={getStatusTag(selectedCommitment).color}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {/* Chip bloqueado + botón cambiar */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5}>
                      <Chip
                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                        label="Compromiso bloqueado"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                      />
                      <Button
                        size="small"
                        startIcon={<SwapHorizIcon />}
                        onClick={handleChangeCommitment}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          color: theme.palette.warning.main,
                          '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.1) }
                        }}
                      >
                        Cambiar compromiso
                      </Button>
                    </Box>
                  </motion.div>

                  {/* Detalles extendidos del compromiso */}
                  <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                    {/* Beneficiario */}
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

                    {/* Vencimiento */}
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

                    {/* Observaciones */}
                    {selectedCommitment.observations && (
                      <Grid item xs={12}>
                        <Box sx={{
                          mt: 1,
                          p: 1.5,
                          bgcolor: 'transparent',
                          borderLeft: `2px solid ${alpha(theme.palette.divider, 0.3)}`,
                          borderRadius: 0
                        }}>
                          <Typography variant="caption" sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: '0.65rem',
                            display: 'block',
                            mb: 0.5
                          }}>
                            Observaciones
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            fontSize: '0.8rem'
                          }}>
                            {selectedCommitment.observations}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  {/* Botón ver factura */}
                  {invoiceUrl && (
                    <Box mt={2}>
                      <Button
                        size="small"
                        startIcon={<PdfIcon />}
                        onClick={handleOpenPdfViewer}
                        variant="outlined"
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          borderColor: alpha(primaryColor, 0.3),
                          color: primaryColor,
                          '&:hover': { backgroundColor: alpha(primaryColor, 0.08) }
                        }}
                      >
                        Ver factura del compromiso
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info" icon={<LockOpenIcon />} sx={{ borderRadius: `${borderRadius}px` }}>
                  <Typography variant="body2" fontWeight="500">
                    Selecciona un compromiso del modal para continuar
                  </Typography>
                </Alert>
              )}
            </Paper>
          </motion.div>

          {/* ======================================================== */}
          {/* SECCIÓN 2: DETALLES DEL PAGO */}
          {/* ======================================================== */}
          {commitmentLocked && selectedCommitment && (
            <motion.div
              initial={animationsEnabled ? { opacity: 0, x: 20 } : { opacity: 1 }}
              animate={{ opacity: 1, x: 0 }}
              transition={animationsEnabled ? { duration: 0.5, delay: 0.3 } : { duration: 0.1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${borderRadius}px`,
                  background: theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : '#ffffff',
                  transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                  '&:hover': animationsEnabled ? {
                    borderColor: alpha(primaryColor, 0.4),
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
                      boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                    }}
                  >
                    <MoneyIcon sx={{ fontSize: fontSize + 6, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: `${fontSize + 4}px` }}>
                      Detalles del Pago
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fecha, método, cuenta de origen y montos
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2.5}>
                  {/* Fecha y referencia */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de pago *"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange('date')}
                      error={!!errors.date}
                      helperText={errors.date}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DateRangeIcon sx={{ color: primaryColor, opacity: 0.7 }} />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Referencia / Comprobante *"
                      value={formData.reference}
                      onChange={handleInputChange('reference')}
                      error={!!errors.reference}
                      helperText={errors.reference}
                      placeholder="Ej: TRN-20260218-001"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ReceiptIcon sx={{ color: primaryColor, opacity: 0.7 }} />
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                    />
                  </Grid>

                  {/* Método de pago - Chips */}
                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight="600" color="text.secondary" sx={{ mb: 1 }}>
                      Método de pago *
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {paymentMethods.map((method) => (
                        <Chip
                          key={method}
                          label={method}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, method }));
                            if (errors.method) setErrors(prev => ({ ...prev, method: '' }));
                          }}
                          variant={formData.method === method ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: formData.method === method ? 600 : 400,
                            borderColor: formData.method === method ? primaryColor : theme.palette.divider,
                            bgcolor: formData.method === method ? alpha(primaryColor, 0.12) : 'transparent',
                            color: formData.method === method ? primaryColor : theme.palette.text.secondary,
                            '&:hover': {
                              borderColor: primaryColor,
                              bgcolor: alpha(primaryColor, 0.08)
                            },
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </Box>
                    {errors.method && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.method}
                      </Typography>
                    )}
                  </Grid>

                  {/* Cuenta de origen y banco */}
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      fullWidth
                      options={getBankAccounts()}
                      value={getBankAccounts().find(acc => acc.bankAccount === formData.sourceAccount) || null}
                      onChange={(e, newValue) => handleSourceAccountSelect(newValue?.bankAccount || null)}
                      getOptionLabel={(option) => option.displayText || ''}
                      filterOptions={(options, { inputValue }) => {
                        const filterText = inputValue.toLowerCase();
                        return options.filter(opt =>
                          (opt.displayText || '').toLowerCase().includes(filterText) ||
                          (opt.companyName || '').toLowerCase().includes(filterText)
                        );
                      }}
                      groupBy={(option) => option.type === 'business' ? '🏢 Cuentas Empresariales' : '👤 Cuentas Personales'}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cuenta de origen"
                          placeholder="Seleccionar cuenta"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <AccountBalanceIcon sx={{ color: primaryColor, opacity: 0.7 }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Empresa / Titular"
                      value={formData.sourceCompanyName}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountBalanceIcon sx={{ color: primaryColor, opacity: 0.7 }} />
                          </InputAdornment>
                        )
                      }}
                      helperText={formData.sourceCompanyName ? '' : 'Se completa al seleccionar cuenta'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                    />
                  </Grid>

                  {/* Tip: Sin cuentas bancarias */}
                  {getBankAccounts().length === 0 && !loadingCompanies && (
                    <Grid item xs={12}>
                      <Alert
                        severity="info"
                        variant="outlined"
                        sx={{ mt: 1, borderRadius: `${borderRadius}px` }}
                      >
                        <Typography variant="body2">
                          <strong>💡 Tip:</strong> Para registrar cuentas de origen, agrega información bancaria en la sección de Empresas o en Cuentas Personales desde el menú principal.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Montos */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Total a pagar *"
                      value={isPartialPayment ? formatCurrency(formData.partialPaymentAmount) : formatCurrency(formData.finalAmount)}
                      onChange={isPartialPayment ? (e) => handlePartialAmountChange(e.target.value) : undefined}
                      InputProps={{
                        readOnly: !isPartialPayment,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon sx={{ color: primaryColor }} />
                          </InputAdornment>
                        )
                      }}
                      helperText={
                        isPartialPayment
                          ? formData.partialPaymentAmount > 0
                            ? `Saldo restante: ${formatCurrencyDisplay(Math.max(0, (selectedCommitment?.remainingBalance || 0) - formData.partialPaymentAmount))}`
                            : `Saldo pendiente: ${formatCurrencyDisplay(selectedCommitment?.remainingBalance || 0)}`
                          : selectedCommitment?.hasPartialPayments
                            ? `Saldo pendiente disponible para pago completo`
                            : 'Saldo pendiente del compromiso'
                      }
                      error={!!errors.partialPaymentAmount}
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` },
                        '& input': { color: primaryColor, fontWeight: 600 }
                      }}
                    />
                  </Grid>

                  {/* Intereses */}
                  {requiresInterests(selectedCommitment, formData.date) && !isColjuegosCommitment(selectedCommitment) && (
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Intereses por mora"
                        value={formatCurrency(formData.interests)}
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          setFormData(prev => ({ ...prev, interests: value }));
                        }}
                        error={!!errors.interests}
                        helperText={errors.interests || 'Pago vencido - Se requieren intereses'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <InterestIcon sx={{ color: theme.palette.warning.main }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                      />
                    </Grid>
                  )}

                  {/* Intereses Coljuegos */}
                  {requiresInterests(selectedCommitment, formData.date) && isColjuegosCommitment(selectedCommitment) && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Intereses Derechos Explotación"
                          value={formatCurrency(formData.interesesDerechosExplotacion)}
                          onChange={(e) => {
                            const value = parseCurrency(e.target.value);
                            setFormData(prev => ({ ...prev, interesesDerechosExplotacion: value }));
                          }}
                          error={!!errors.interests}
                          helperText="Intereses sobre derechos de explotación"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <InterestIcon sx={{ color: theme.palette.warning.main }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Intereses Gastos Administración"
                          value={formatCurrency(formData.interesesGastosAdministracion)}
                          onChange={(e) => {
                            const value = parseCurrency(e.target.value);
                            setFormData(prev => ({ ...prev, interesesGastosAdministracion: value }));
                          }}
                          helperText="Intereses sobre gastos de administración"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <InterestIcon sx={{ color: theme.palette.warning.main }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                        />
                      </Grid>
                      {/* Total Intereses Coljuegos (suma) */}
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Total Intereses"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.interesesDerechosExplotacion + formData.interesesGastosAdministracion)}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <InterestIcon sx={{ color: theme.palette.secondary.main }} />
                              </InputAdornment>
                            )
                          }}
                          helperText="Suma de ambos tipos de intereses"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                        />
                      </Grid>
                    </>
                  )}

                  {/* 4x1000 (readonly) */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="4x1000 (referencia)"
                      value={formatCurrencyDisplay(formData.tax4x1000)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon sx={{ color: theme.palette.text.disabled }} />
                          </InputAdornment>
                        )
                      }}
                      helperText="Se generará automáticamente"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` },
                        '& input': { color: theme.palette.text.disabled }
                      }}
                    />
                  </Grid>

                  {/* Toggle pago parcial */}
                  {!isColjuegosCommitment(selectedCommitment) && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: alpha(theme.palette.info.main, 0.04),
                          borderRadius: `${borderRadius}px`,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isPartialPayment}
                              onChange={(e) => handlePartialPaymentToggle(e.target.checked)}
                              sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight="500" color="text.secondary">
                              Este es un pago parcial
                            </Typography>
                          }
                        />
                      </Box>
                    </Grid>
                  )}

                  {/* Alerta intereses requeridos o pago a tiempo */}
                  {requiresInterests(selectedCommitment, formData.date) ? (
                    <Grid item xs={12}>
                      <Alert
                        severity="warning"
                        icon={<WarningIcon />}
                        sx={{ borderRadius: `${borderRadius}px` }}
                      >
                        <Typography variant="body2" fontWeight="500">
                          El pago se realizará posterior a la fecha de vencimiento ({selectedCommitment.formattedDueDate}). Se requiere incluir intereses por mora.
                        </Typography>
                      </Alert>
                    </Grid>
                  ) : (
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
                  )}

                  {/* 🚫 Coljuegos: No permite pagos parciales */}
                  {selectedCommitment && isColjuegosCommitment(selectedCommitment) && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: `${borderRadius}px`,
                          bgcolor: alpha(theme.palette.warning.main, 0.03),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                          mt: 1
                        }}
                      >
                        <Typography variant="body2" color="warning.main" sx={{
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
                </Grid>
              </Paper>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 3: COMPROBANTE DE PAGO */}
          {/* ======================================================== */}
          {commitmentLocked && selectedCommitment && (
            <motion.div
              initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1 }}
              animate={{ opacity: 1, x: 0 }}
              transition={animationsEnabled ? { duration: 0.5, delay: 0.4 } : { duration: 0.1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${borderRadius}px`,
                  background: theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : '#ffffff',
                  transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                  '&:hover': animationsEnabled ? {
                    borderColor: alpha(primaryColor, 0.4),
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
                      boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                    }}
                  >
                    <UploadIcon sx={{ fontSize: fontSize + 6, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: `${fontSize + 4}px` }}>
                      Comprobante de Pago
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      PDF o imagen del soporte de la transacción
                    </Typography>
                  </Box>
                </Box>

                {/* Drop zone */}
                <Box
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  sx={{
                    border: `2px dashed ${dragActive ? primaryColor : alpha(theme.palette.divider, 0.5)}`,
                    borderRadius: `${borderRadius}px`,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    bgcolor: dragActive ? alpha(primaryColor, 0.04) : 'transparent',
                    '&:hover': {
                      borderColor: primaryColor,
                      bgcolor: alpha(primaryColor, 0.04)
                    }
                  }}
                  onClick={() => document.getElementById('file-upload-v2').click()}
                >
                  <input
                    type="file"
                    id="file-upload-v2"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <UploadIcon sx={{ fontSize: 40, color: dragActive ? primaryColor : theme.palette.text.disabled, mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight="500">
                    Arrastra el comprobante aquí o{' '}
                    <Typography component="span" sx={{ color: primaryColor, fontWeight: 600 }}>
                      selecciona un archivo
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                    PDF, JPG, PNG — Máx. 10MB — Se comprimirá automáticamente
                  </Typography>
                </Box>

                {/* Upload progress */}
                {uploading && (
                  <Box mt={2}>
                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, height: 6 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Subiendo... {uploadProgress}%
                    </Typography>
                  </Box>
                )}

                {/* Lista de archivos */}
                {files.length > 0 && (
                  <Box mt={2}>
                    {files.map((fileData) => (
                      <Box
                        key={fileData.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          mb: 1,
                          borderRadius: `${borderRadius}px`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                          bgcolor: alpha(theme.palette.background.default, 0.5)
                        }}
                      >
                        <FileIcon sx={{ color: primaryColor, fontSize: 20 }} />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight="500" noWrap>
                            {fileData.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(fileData.size / 1024).toFixed(0)} KB
                            {fileData.compressed && (
                              <Chip label="Comprimido" size="small" color="success" variant="outlined" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                            )}
                            {fileData.uploaded && (
                              <Chip label="Subido" size="small" color="info" variant="outlined" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeFile(fileData.id)} sx={{ color: theme.palette.error.main }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SECCIÓN 4: COMENTARIOS */}
          {/* ======================================================== */}
          {commitmentLocked && selectedCommitment && (
            <motion.div
              initial={animationsEnabled ? { opacity: 0, x: 20 } : { opacity: 1 }}
              animate={{ opacity: 1, x: 0 }}
              transition={animationsEnabled ? { duration: 0.5, delay: 0.5 } : { duration: 0.1 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${borderRadius}px`,
                  background: theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : '#ffffff',
                  transition: animationsEnabled ? 'all 0.3s ease-in-out' : 'none',
                  '&:hover': animationsEnabled ? {
                    borderColor: alpha(primaryColor, 0.4),
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
                      boxShadow: `0 4px 12px ${alpha(primaryColor, 0.3)}`
                    }}
                  >
                    <PdfIcon sx={{ fontSize: fontSize + 6, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: `${fontSize + 4}px` }}>
                      Comentarios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Observaciones opcionales
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="Ej: Pago correspondiente al mes de febrero de 2026..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${borderRadius}px` } }}
                />
              </Paper>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* BOTTOM BAR FLOTANTE */}
          {/* ======================================================== */}
          {commitmentLocked && selectedCommitment && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Paper
                elevation={8}
                sx={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 700,
                  bgcolor: alpha(theme.palette.background.paper, 0.97),
                  backdropFilter: 'blur(8px)',
                  borderTop: `1.5px solid ${theme.palette.divider}`,
                  p: 2,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
                }}
              >
                {/* Resumen rápido */}
                <Box flex={1} display={{ xs: 'none', md: 'flex' }} alignItems="center" gap={2}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCommitment.companyName} · {formData.method || 'Sin método'} ·{' '}
                    <Typography component="span" fontWeight="700" color={primaryColor}>
                      {formatCurrencyDisplay(formData.finalAmount)}
                    </Typography>
                  </Typography>
                  {formData.tax4x1000 > 0 && (
                    <Chip
                      label={`4x1000: ${formatCurrencyDisplay(formData.tax4x1000)}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>

                <Button
                  onClick={handleCancel}
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  sx={{
                    borderRadius: 6,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.error.main,
                      color: theme.palette.error.main,
                      bgcolor: alpha(theme.palette.error.main, 0.05)
                    }
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isFormReady || isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  sx={{
                    borderRadius: 6,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    background: isFormReady ? getGradientBackground() : theme.palette.action.disabledBackground,
                    boxShadow: isFormReady ? `0 4px 16px ${alpha(primaryColor, 0.4)}` : 'none',
                    '&:hover': isFormReady ? {
                      background: getGradientBackground(),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 20px ${alpha(primaryColor, 0.5)}`
                    } : {},
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isSubmitting ? 'Registrando...' : isFormReady ? 'Registrar Pago' : `Faltan ${totalFields - filledCount} campo${totalFields - filledCount !== 1 ? 's' : ''}`}
                </Button>
              </Paper>
            </motion.div>
          )}

          {/* Spacer para el bottom bar */}
          {commitmentLocked && selectedCommitment && <Box sx={{ height: 80 }} />}
        </form>
      </motion.div>

      {/* ============================================================ */}
      {/* 🏢 MODAL DE SELECCIÓN DE COMPROMISO */}
      {/* ============================================================ */}
      <Dialog
        open={commitmentModalOpen}
        onClose={handleCommitmentModalCancel}
        maxWidth="sm"
        fullWidth
        onKeyDown={(e) => {
          if (e.key === 'Enter' && selectedCommitmentInModal) {
            e.preventDefault();
            handleCommitmentModalConfirm();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCommitmentModalCancel();
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(primaryColor, 0.2)}`,
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
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <ReceiptIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: 'white' }}>
                Selecciona un Compromiso
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Elige el compromiso que vas a pagar
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 6, pb: 3, px: 3 }}>
          <Box sx={{ minHeight: 200, mt: 3 }}>
            <Autocomplete
              fullWidth
              options={pendingCommitments}
              value={selectedCommitmentInModal}
              onChange={(event, newValue) => {
                setSelectedCommitmentInModal(newValue);
              }}
              getOptionLabel={(option) => option.displayName || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              autoHighlight
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                const filterText = inputValue.toLowerCase();
                const filtered = options.filter(option => {
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
                    option.paymentType || '',
                    option.commitmentType || '',
                    option.frequency || ''
                  ];
                  return searchFields.some(field => field.toLowerCase().includes(filterText));
                });
                return filtered.sort((a, b) => {
                  const aCompany = (a.companyName || '').toLowerCase();
                  const bCompany = (b.companyName || '').toLowerCase();
                  const aConcept = (a.concept || a.name || '').toLowerCase();
                  const bConcept = (b.concept || b.name || '').toLowerCase();
                  if (aCompany.startsWith(filterText) && !bCompany.startsWith(filterText)) return -1;
                  if (bCompany.startsWith(filterText) && !aCompany.startsWith(filterText)) return 1;
                  if (aConcept.startsWith(filterText) && !bConcept.startsWith(filterText)) return -1;
                  if (bConcept.startsWith(filterText) && !aConcept.startsWith(filterText)) return 1;
                  if (!a.dueDate && !b.dueDate) return 0;
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return a.dueDate.toDate() - b.dueDate.toDate();
                });
              }}
              renderOption={(props, option, { inputValue }) => {
                const { key, ...otherProps } = props;
                const statusTag = getStatusTag(option);

                // Función para resaltar texto coincidente
                const highlightText = (text, searchText) => {
                  if (!searchText) return text;
                  try {
                    const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    const parts = text.split(regex);
                    return parts.map((part, index) =>
                      part.toLowerCase() === searchText.toLowerCase() ? (
                        <span key={index} style={{
                          backgroundColor: alpha(primaryColor, 0.12),
                          color: primaryColor,
                          fontWeight: 600,
                          borderRadius: 2,
                          padding: '0 2px'
                        }}>
                          {part}
                        </span>
                      ) : part
                    );
                  } catch {
                    return text;
                  }
                };

                return (
                  <Box
                    key={key}
                    component="li"
                    {...otherProps}
                    sx={{
                      py: 1.5,
                      px: 1.5,
                      '&:hover': { backgroundColor: alpha(primaryColor, 0.08) },
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} width="100%">
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          background: getCompanyAvatarColor(option),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {getCompanyInitial(option)}
                      </Box>
                      {/* Info */}
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight="600" noWrap>
                          {highlightText(option.companyName || 'Sin empresa', inputValue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {highlightText(option.concept || option.name || 'Sin concepto', inputValue)}
                        </Typography>
                        {option.beneficiary && (
                          <Typography variant="caption" color="text.disabled" display="block" noWrap>
                            Beneficiario: {highlightText(option.beneficiary, inputValue)}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" display="block">
                          📅 Vence: {option.formattedDueDate}
                        </Typography>
                      </Box>
                      {/* Monto + tag */}
                      <Box textAlign="right" flexShrink={0}>
                        <Chip
                          label={`${option.formattedAmount} ${statusTag.label !== 'Pendiente' ? '· ' + statusTag.label : ''}`}
                          size="small"
                          color={statusTag.color}
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar compromiso"
                  placeholder="Buscar por empresa, concepto, beneficiario..."
                  autoFocus
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: primaryColor }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              loading={loadingCommitments}
              noOptionsText="No se encontraron compromisos pendientes"
              loadingText="Cargando compromisos..."
            />

            {/* Mensaje informativo */}
            <Alert
              severity="info"
              icon={<LockOpenIcon />}
              sx={{
                mt: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': { color: theme.palette.info.main }
              }}
            >
              <Typography variant="body2" fontWeight="500">
                Una vez seleccionado, el compromiso quedará bloqueado para este registro de pago
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleCommitmentModalCancel}
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
            onClick={handleCommitmentModalConfirm}
            variant="contained"
            disabled={!selectedCommitmentInModal}
            startIcon={<CheckCircleIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              background: selectedCommitmentInModal
                ? getGradientBackground()
                : theme.palette.action.disabledBackground,
              boxShadow: selectedCommitmentInModal
                ? `0 4px 12px ${alpha(primaryColor, 0.4)}`
                : 'none',
              '&:hover': selectedCommitmentInModal ? {
                background: getGradientBackground(),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 16px ${alpha(primaryColor, 0.5)}`
              } : {},
              transition: 'all 0.3s ease'
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* ✅ MODAL DE CONFIRMACIÓN DE PAGO */}
      {/* ============================================================ */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${alpha(primaryColor, 0.2)}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
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
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <CheckCircleIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: 'white' }}>
                Confirmar Registro de Pago
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Revisa los detalles antes de confirmar
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {selectedCommitment && (
            <Box>
              {/* Resumen del compromiso */}
              <Box sx={{ mt: 1, mb: 2, p: 2, borderRadius: 2, bgcolor: alpha(primaryColor, 0.04), border: `1px solid ${alpha(primaryColor, 0.15)}` }}>
                <Typography variant="body2" fontWeight="600" gutterBottom>
                  📋 {selectedCommitment.companyName} — {selectedCommitment.concept || selectedCommitment.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Vence: {selectedCommitment.formattedDueDate}
                </Typography>
                {selectedCommitment.hasPartialPayments && (
                  <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5, fontWeight: 600 }}>
                    Saldo pendiente antes de este pago: {formatCurrencyDisplay(selectedCommitment.remainingBalance || selectedCommitment.amount || 0)}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Detalles del pago */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Monto a pagar</Typography>
                  <Typography variant="body1" fontWeight="700" sx={{ color: primaryColor }}>
                    {formatCurrencyDisplay(formData.finalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">4x1000</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {formatCurrencyDisplay(formData.tax4x1000)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Monto total (con 4x1000)</Typography>
                  <Typography variant="body1" fontWeight="700">
                    {formatCurrencyDisplay(formData.finalAmount + formData.tax4x1000)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Fecha</Typography>
                  <Typography variant="body1">
                    {formData.date ? format(createLocalDate(formData.date), 'dd/MMM/yyyy', { locale: es }) : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Método</Typography>
                  <Typography variant="body1">{formData.method || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Cuenta</Typography>
                  <Typography variant="body1" noWrap>
                    {formData.sourceAccount
                      ? `${formData.sourceAccount}${formData.sourceBank ? ` - ${formData.sourceBank}` : ''}`
                      : 'Sin especificar'}
                  </Typography>
                  {formData.sourceCompanyName && (
                    <Typography variant="caption" color="text.disabled">{formData.sourceCompanyName}</Typography>
                  )}
                </Grid>
              </Grid>

              {/* Alerta pago parcial */}
              {isPartialPayment && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="500">
                    ⚠️ Este es un pago parcial. El compromiso quedará pendiente con un saldo de{' '}
                    <strong>{formatCurrencyDisplay((selectedCommitment.remainingBalance || selectedCommitment.amount || 0) - formData.finalAmount)}</strong>
                  </Typography>
                </Alert>
              )}

              {/* Archivos adjuntos con preview */}
              {files.length > 0 && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ mb: 1, display: 'block' }}>
                    📎 Archivos adjuntos ({files.length})
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {files.map((f) => (
                      <Box
                        key={f.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.divider, 0.06),
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} minWidth={0}>
                          <PdfIcon sx={{ fontSize: 18, color: f.type?.includes('pdf') ? theme.palette.error.main : primaryColor, flexShrink: 0 }} />
                          <Typography variant="caption" noWrap>{f.name}</Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={() => {
                            setAttachmentPreviewFile(f);
                            setAttachmentPreviewOpen(true);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            minWidth: 'auto',
                            px: 1.5,
                            color: primaryColor,
                            fontWeight: 600
                          }}
                        >
                          Ver
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                bgcolor: alpha(theme.palette.error.main, 0.05)
              }
            }}
          >
            Revisar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 4,
              background: getGradientBackground(),
              boxShadow: `0 4px 12px ${alpha(primaryColor, 0.4)}`,
              '&:hover': {
                background: getGradientBackground(),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 16px ${alpha(primaryColor, 0.5)}`
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar y Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 📄 VISOR PDF DE FACTURA DEL COMPROMISO */}
      {/* ============================================================ */}
      <Dialog
        open={pdfViewerOpen}
        onClose={handleClosePdfViewer}
        maxWidth={pdfViewerSize === 'large' ? 'lg' : pdfViewerSize === 'small' ? 'xs' : 'md'}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            height: pdfViewerSize === 'large' ? '90vh' : pdfViewerSize === 'small' ? '50vh' : '70vh',
            border: `1px solid ${alpha(primaryColor, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{
          py: 1.5,
          background: getGradientBackground(),
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PdfIcon sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight="600">Factura del Compromiso</Typography>
          </Box>
          <Box display="flex" gap={0.5}>
            <Tooltip title="Cambiar tamaño">
              <IconButton size="small" onClick={toggleViewerSize} sx={{ color: 'white' }}>
                {pdfViewerSize === 'large' ? <MinimizeIcon /> : <MaximizeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Abrir en nueva pestaña">
              <IconButton size="small" onClick={handleOpenInNewTab} sx={{ color: 'white' }}>
                <ExternalLinkIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cerrar">
              <IconButton size="small" onClick={handleClosePdfViewer} sx={{ color: 'white' }}>
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {invoiceUrl && (
            invoiceUrl.toLowerCase().includes('.pdf') ? (
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
                title="Factura del compromiso"
              />
            ) : (
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
            )
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 🗜️ DIÁLOGO DE COMPRESIÓN PDF */}
      {/* ============================================================ */}
      <PDFCompressionPreview
        open={compressionPreviewOpen}
        onClose={() => setCompressionPreviewOpen(false)}
        file={pendingPDFFile}
        onAccept={handleCompressionAccept}
        onReject={handleCompressionReject}
        keepOpenAfterAction={pendingPDFQueue.length > 1}
      />

      {/* ============================================================ */}
      {/* 👁️ VISOR DE ADJUNTOS (preview antes de confirmar) */}
      {/* ============================================================ */}
      <AttachmentPreviewDialog
        open={attachmentPreviewOpen}
        onClose={() => {
          setAttachmentPreviewOpen(false);
          setAttachmentPreviewFile(null);
        }}
        file={attachmentPreviewFile?.file || null}
        fileName={attachmentPreviewFile?.name || 'Archivo'}
        fileType={attachmentPreviewFile?.type || ''}
      />
    </Box>
  );
};

export default NewPaymentPage;
