import React, { useState, useEffect } from 'react';
import { fCurrency } from '../utils/formatNumber';
import { calculateMonthlyAccountBalance } from '../utils/monthlyBalanceUtils';
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
  FormHelperText,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  TextField,
  alpha,
  Snackbar,
  Alert as MuiAlert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  Popover,
  Fade,
  Grow,
  Slide,
  Divider,
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FilterList,
  Business,
  Receipt,
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
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Business as CompanyIcon,
  AttachFile as AttachFileIcon,
  PictureAsPdf as PdfIcon,
  RemoveRedEye as RemoveRedEyeIcon,
  SwapHoriz as SwapIcon,
  AttachEmail as AttachEmailIcon,
  Menu as MenuIcon,
  Info as InfoIcon,
  Visibility,
  Edit,
  Delete,
  CloudUpload,
  DragHandle as DragIcon,
  Share,
  Person
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import PaymentsFilters from '../components/payments/PaymentsFilters';
import { getDateRangeFromFilter } from '../components/payments/DateRangeFilter';
import { useNavigate } from 'react-router-dom';
import { isValid } from 'date-fns';
import { PDFDocument } from 'pdf-lib';

// Context para tema
// Nota: Los colores dinámicos se deben leer del theme de MUI

// Hook para cargar pagos desde Firebase
import { usePayments, useCommitments } from '../hooks/useFirestore';
import ShareToChat from '../components/common/ShareToChat';
// Firebase para manejo de archivos y Firestore
import { doc, updateDoc, getDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, getDocs, where, deleteField } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { managedOnSnapshot } from '../utils/listenerManager';
// Componente para visor de comprobantes de pago
import PaymentReceiptViewer from '../components/commitments/PaymentReceiptViewer';
// Context para autenticación
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/permissions';
// Hook para auditoría
import useActivityLogs from '../hooks/useActivityLogs';

const PaymentsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const isAdmin = isAdminUser(currentUser, userProfile);
  const { logActivity } = useActivityLogs();
  const theme = useTheme();
  // Tomar colores desde el tema efectivo de MUI (que ya refleja SettingsContext)
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [receiptsFilter, setReceiptsFilter] = useState('all'); // Nuevo filtro para comprobantes
  const [companyFilter, setCompanyFilter] = useState([]); // Filtro por empresa (array)
  const [conceptFilter, setConceptFilter] = useState([]); // Filtro por concepto (array)
  const [beneficiaryFilter, setBeneficiaryFilter] = useState([]); // Filtro por beneficiario/proveedor (array)
  const [dateRangeFilter, setDateRangeFilter] = useState('thisMonth'); // Filtro por rango de fechas
  const [customStartDate, setCustomStartDate] = useState(null); // Fecha inicial personalizada
  const [customEndDate, setCustomEndDate] = useState(null); // Fecha final personalizada
  
  // ✅ NUEVOS ESTADOS PARA SISTEMA DE FILTROS APLICADOS
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    companyFilter: [],
    statusFilter: 'all',
    conceptFilter: [],
    beneficiaryFilter: [],
    receiptsFilter: 'all',
    dateRangeFilter: 'thisMonth',
    customStartDate: null,
    customEndDate: null
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Estados para el visor de comprobantes
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [autoOpenPdfViewer, setAutoOpenPdfViewer] = useState(false);
  
  // Estados para edición de archivos
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Estados para menú contextual de acciones
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  
  // Estados para compartir al chat
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [paymentToShare, setPaymentToShare] = useState(null);
  
  // Estados para modal de gestión de comprobantes
  const [receiptManagementOpen, setReceiptManagementOpen] = useState(false);
  const [receiptDragActive, setReceiptDragActive] = useState(false);
  
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

  // Helper para formatear fechas de diferentes fuentes
  const formatPaymentDate = (date) => {
    if (!date) return '-';
    
    // Debug temporal
    console.log('Formato de fecha recibido:', date, typeof date, date instanceof Date);
    
    try {
      let dateObj;
      
      // Si ya es un objeto Date (que es lo que debería venir del hook)
      if (date instanceof Date) {
        dateObj = date;
      }
      // Si es un Timestamp de Firebase con seconds
      else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      }
      // Si es un string de fecha ISO (usar fecha local)
      else if (typeof date === 'string') {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateObj = createLocalDate(date); // Usar fecha local
        } else {
          dateObj = new Date(date);
        }
      }
      // Si es un timestamp numérico
      else if (typeof date === 'number') {
        dateObj = new Date(date);
      }
      // Otros casos
      else {
        console.log('Formato de fecha no reconocido:', date);
        return '-';
      }
      
      // Verificar si la fecha es válida
      if (isNaN(dateObj.getTime())) {
        console.log('Fecha inválida después de conversión:', dateObj);
        return '-';
      }
      
      const formattedDate = dateObj.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      console.log('Fecha original:', date, '-> Fecha formateada:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.warn('Error formateando fecha:', error, date);
      return '-';
    }
  };

  // Helper para convertir fecha a formato ISO para inputs (usando fecha local)
  const formatDateForInput = (date) => {
    if (!date) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    try {
      let dateObj;
      
      // Si ya es un objeto Date
      if (date instanceof Date) {
        dateObj = date;
      }
      // Si es un Timestamp de Firebase con seconds
      else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      }
      // Si es un string de fecha
      else if (typeof date === 'string') {
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return date; // Ya está en el formato correcto
        }
        dateObj = createLocalDate(date); // Usar fecha local
      }
      // Si es un timestamp numérico
      else if (typeof date === 'number') {
        dateObj = new Date(date);
      }
      // Otros casos - usar fecha actual
      else {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Verificar si la fecha es válida
      if (isNaN(dateObj.getTime())) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Convertir usando componentes locales para evitar problemas de zona horaria
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Error convirtiendo fecha para input:', error, date);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };
  
  // Estados para edición de pago
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  
  // Estados para empresas y cuentas bancarias
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  // Estados para listas de filtros únicos
  const [uniqueCompanies, setUniqueCompanies] = useState([]);
  const [uniqueConcepts, setUniqueConcepts] = useState([]);
  const [uniqueBeneficiaries, setUniqueBeneficiaries] = useState([]);
  
  // Estados para ingresos (necesarios para calcular balances)
  const [incomes, setIncomes] = useState([]);
  const [loadingIncomes, setLoadingIncomes] = useState(true);
  
  // Estado para cuentas personales
  const [personalAccounts, setPersonalAccounts] = useState([]);
  
  const [editFormData, setEditFormData] = useState({
    concept: '',
    amount: '',
    method: '',
    notes: '',
    reference: '',
    date: '',
    companyName: '',
    provider: '',
    interests: '',
    interesesDerechosExplotacion: '',
    interesesGastosAdministracion: '',
    derechosExplotacion: '',
    gastosAdministracion: '',
    originalAmount: '',
    sourceAccount: '',  // NUEVO: cuenta de origen
    sourceBank: '',     // NUEVO: banco de origen
    tax4x1000: 0       // NUEVO: campo visual para 4x1000
  });
  
  // Estados adicionales para cargar datos del compromiso
  const [loadingCommitment, setLoadingCommitment] = useState(false);
  const [commitmentData, setCommitmentData] = useState(null);
  
  // Estados para confirmación de eliminación de pago
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(false);
  
  // Estados para manejo de múltiples archivos y combinación PDF
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Función para cargar datos del compromiso
  const loadCommitmentData = async (commitmentId) => {
    if (!commitmentId) return null;
    
    try {
      setLoadingCommitment(true);
      const commitmentRef = doc(db, 'commitments', commitmentId);
      const commitmentSnap = await getDoc(commitmentRef);
      
      if (commitmentSnap.exists()) {
        const data = commitmentSnap.data();
        setCommitmentData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error cargando compromiso:', error);
      return null;
    } finally {
      setLoadingCommitment(false);
    }
  };

  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Cargar pagos reales desde Firebase - usar filtros aplicados
  const { payments: firebasePayments, loading, error } = usePayments({ 
    status: appliedFilters.statusFilter !== 'all' ? appliedFilters.statusFilter : undefined,
    shouldLoadData: true // Siempre cargar datos para poblar los filtros
  });

  // Cargar compromisos para obtener beneficiarios de pagos que no los tengan
  const { commitments: firebaseCommitments } = useCommitments({ 
    shouldLoadData: true 
  });

  // Función de refresh manual
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulamos un delay breve para dar feedback visual
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Exponer función temporal de actualización en consola (solo en desarrollo)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.updatePaymentsWithBeneficiaries = async () => {
        console.log('� Ejecutando actualización de beneficiarios...');
        try {
          const paymentsQuery = query(collection(db, 'payments'));
          const paymentsSnapshot = await getDocs(paymentsQuery);
          let updateCount = 0;
          
          for (const paymentDoc of paymentsSnapshot.docs) {
            const payment = paymentDoc.data();
            if (payment.provider || payment.beneficiary || !payment.commitmentId) continue;
            
            const commitmentDoc = await getDoc(doc(db, 'commitments', payment.commitmentId));
            if (!commitmentDoc.exists()) continue;
            
            const commitment = commitmentDoc.data();
            const provider = commitment.provider || commitment.beneficiary || '';
            const beneficiary = commitment.beneficiary || commitment.provider || '';
            
            if (provider || beneficiary) {
              await updateDoc(doc(db, 'payments', paymentDoc.id), {
                provider: provider,
                beneficiary: beneficiary,
                updatedAt: new Date()
              });
              updateCount++;
            }
          }
          
          console.log(`✅ Actualizados ${updateCount} pagos`);
          return updateCount;
        } catch (error) {
          console.error('❌ Error:', error);
          return 0;
        }
      };
    }
  }, []);

  // ✅ NUEVAS FUNCIONES PARA SISTEMA DE FILTROS APLICADOS
  const handleApplyFilters = () => {
    // Normalizar siempre a arrays para filtros múltiples
    const normalizedCompany = Array.isArray(companyFilter)
      ? companyFilter
      : companyFilter
        ? [companyFilter]
        : [];

    const normalizedConcept = Array.isArray(conceptFilter)
      ? conceptFilter
      : conceptFilter
        ? [conceptFilter]
        : [];

    const normalizedBeneficiary = Array.isArray(beneficiaryFilter)
      ? beneficiaryFilter
      : beneficiaryFilter
        ? [beneficiaryFilter]
        : [];

    setAppliedFilters({
      searchTerm,
      companyFilter: normalizedCompany,
      statusFilter,
      conceptFilter: normalizedConcept,
      beneficiaryFilter: normalizedBeneficiary,
      receiptsFilter,
      dateRangeFilter,
      customStartDate,
      customEndDate
    });
    setFiltersApplied(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCompanyFilter([]);
    setStatusFilter('all');
    setConceptFilter([]);
    setBeneficiaryFilter([]);
    setReceiptsFilter('all');
    setDateRangeFilter('thisMonth');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setAppliedFilters({
      searchTerm: '',
      companyFilter: [],
      statusFilter: 'all',
      conceptFilter: [],
      beneficiaryFilter: [],
      receiptsFilter: 'all',
      dateRangeFilter: 'thisMonth',
      customStartDate: null,
      customEndDate: null
    });
    setFiltersApplied(false);
  };

  // Helper para comparar arrays
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  const hasFiltersChanged = () => {
    return (
      appliedFilters.searchTerm !== searchTerm ||
      !arraysEqual(appliedFilters.companyFilter, companyFilter) ||
      appliedFilters.statusFilter !== statusFilter ||
      !arraysEqual(appliedFilters.conceptFilter, conceptFilter) ||
      !arraysEqual(appliedFilters.beneficiaryFilter, beneficiaryFilter) ||
      appliedFilters.receiptsFilter !== receiptsFilter ||
      appliedFilters.dateRangeFilter !== dateRangeFilter ||
      appliedFilters.customStartDate !== customStartDate ||
      appliedFilters.customEndDate !== customEndDate
    );
  };

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

  // Filtrar pagos usando filtros aplicados - Solo mostrar datos si hay filtros aplicados
  const filteredPayments = !filtersApplied ? [] : payments.filter(payment => {
    // Filtro por búsqueda
    let matchesSearch = true;
    if (appliedFilters.searchTerm) {
      const searchLower = appliedFilters.searchTerm.toLowerCase();
      matchesSearch = (
        payment.companyName?.toLowerCase().includes(searchLower) ||
        payment.concept?.toLowerCase().includes(searchLower) ||
        payment.reference?.toLowerCase().includes(searchLower) ||
        payment.method?.toLowerCase().includes(searchLower) ||
        payment.provider?.toLowerCase().includes(searchLower) ||
        payment.beneficiary?.toLowerCase().includes(searchLower)
      );
    }
    
    // Normalizar filtros múltiples a arrays seguros
    const companyFilterArray = Array.isArray(appliedFilters.companyFilter)
      ? appliedFilters.companyFilter
      : appliedFilters.companyFilter
        ? [appliedFilters.companyFilter]
        : [];

    const conceptFilterArray = Array.isArray(appliedFilters.conceptFilter)
      ? appliedFilters.conceptFilter
      : appliedFilters.conceptFilter
        ? [appliedFilters.conceptFilter]
        : [];

    const beneficiaryFilterArray = Array.isArray(appliedFilters.beneficiaryFilter)
      ? appliedFilters.beneficiaryFilter
      : appliedFilters.beneficiaryFilter
        ? [appliedFilters.beneficiaryFilter]
        : [];

    // Filtro por empresa (múltiple)
    let matchesCompany = true;
    if (companyFilterArray.length > 0) {
      matchesCompany = companyFilterArray.includes(payment.companyName);
    }
    
    // Filtro por concepto (múltiple)
    let matchesConcept = true;
    if (conceptFilterArray.length > 0) {
      matchesConcept = conceptFilterArray.includes(payment.concept);
    }
    
    // Filtro por beneficiario/proveedor (múltiple)
    let matchesBeneficiary = true;
    if (beneficiaryFilterArray.length > 0) {
      // Obtener todos los valores posibles del pago y del compromiso relacionado
      const paymentProvider = payment.provider?.trim() || '';
      const paymentBeneficiary = payment.beneficiary?.trim() || '';
      
      // Verificar si alguno de los valores del array coincide
      matchesBeneficiary = beneficiaryFilterArray.some(filterValue => {
        const trimmedFilter = filterValue.trim();
        // Buscar en ambos campos del pago
        let matches = (paymentProvider === trimmedFilter) || (paymentBeneficiary === trimmedFilter);
        
        // Si no encuentra match en el pago, buscar en el compromiso relacionado
        if (!matches && payment.commitmentId && firebaseCommitments?.length > 0) {
          const relatedCommitment = firebaseCommitments.find(c => c.id === payment.commitmentId);
          if (relatedCommitment) {
            const commitmentProvider = relatedCommitment.provider?.trim() || '';
            const commitmentBeneficiary = relatedCommitment.beneficiary?.trim() || '';
            matches = (commitmentProvider === trimmedFilter) || (commitmentBeneficiary === trimmedFilter);
          }
        }
        
        return matches;
      });
    }
    
    // Filtro por estado
    let matchesStatus = true;
    if (appliedFilters.statusFilter !== 'all') {
      const paymentStatus = payment.status?.toLowerCase();
      matchesStatus = (
        (appliedFilters.statusFilter === 'completed' && (paymentStatus === 'completado' || paymentStatus === 'completed')) ||
        (appliedFilters.statusFilter === 'pending' && (paymentStatus === 'pendiente' || paymentStatus === 'pending')) ||
        (appliedFilters.statusFilter === 'failed' && (paymentStatus === 'fallido' || paymentStatus === 'failed'))
      );
    }
    
    // Filtro por comprobantes
    let matchesReceipts = true;
    if (appliedFilters.receiptsFilter !== 'all') {
      const hasReceipts = !!(
        payment.receiptUrl || 
        (payment.receiptUrls && payment.receiptUrls.length > 0) ||
        (payment.attachments && payment.attachments.length > 0)
      );
      
      matchesReceipts = (appliedFilters.receiptsFilter === 'with' && hasReceipts) || 
                       (appliedFilters.receiptsFilter === 'without' && !hasReceipts);
    }

    // Filtro por rango de fechas
    let matchesDateRange = true;
    if (appliedFilters.dateRangeFilter !== 'all') {
      const dateRange = getDateRangeFromFilter(
        appliedFilters.dateRangeFilter, 
        appliedFilters.customStartDate, 
        appliedFilters.customEndDate
      );
      
      if (dateRange && payment.date) {
        let paymentDate;
        
        // Manejar diferentes formatos de fecha
        if (payment.date instanceof Date) {
          paymentDate = payment.date;
        } else if (payment.date.toDate && typeof payment.date.toDate === 'function') {
          // Firestore Timestamp
          paymentDate = payment.date.toDate();
        } else if (typeof payment.date === 'string') {
          paymentDate = new Date(payment.date);
        } else {
          // Si no se puede parsear la fecha, no coincide
          matchesDateRange = false;
        }
        
        if (matchesDateRange && paymentDate && isValid(paymentDate)) {
          matchesDateRange = paymentDate >= dateRange.startDate && paymentDate <= dateRange.endDate;
        }
      }
    }
    
    return matchesSearch && matchesCompany && matchesConcept && 
           matchesBeneficiary && matchesStatus && matchesReceipts && matchesDateRange;
  });

  // Calcular estadísticas de pagos
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = filteredPayments
    .filter(p => p.status?.toLowerCase() === 'completado' || p.status?.toLowerCase() === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = filteredPayments
    .filter(p => p.status?.toLowerCase() === 'pendiente' || p.status?.toLowerCase() === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Estadísticas de comprobantes
  const paymentsWithReceipts = filteredPayments.filter(payment => 
    !!(payment.receiptUrl || 
       (payment.receiptUrls && payment.receiptUrls.length > 0) ||
       (payment.attachments && payment.attachments.length > 0))
  );
  const paymentsWithoutReceipts = filteredPayments.filter(payment => 
    !(payment.receiptUrl || 
      (payment.receiptUrls && payment.receiptUrls.length > 0) ||
      (payment.attachments && payment.attachments.length > 0))
  );

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

  // Actualizar listas únicas para filtros cuando cambien los pagos
  useEffect(() => {
    if (payments && payments.length > 0) {
      // Extraer empresas únicas
      const companies = [...new Set(payments
        .map(p => p.companyName)
        .filter(name => name && name.trim() !== '')
      )].sort();
      
      // Extraer conceptos únicos
      const concepts = [...new Set(payments
        .map(p => p.concept)
        .filter(concept => concept && concept.trim() !== '')
      )].sort();
      
      // Extraer beneficiarios/proveedores únicos (incluyendo desde compromisos)
      const beneficiaries = [...new Set(payments
        .flatMap(p => {
          const values = [];
          // Datos directos del pago
          if (p.provider && p.provider.trim() !== '') values.push(p.provider);
          if (p.beneficiary && p.beneficiary.trim() !== '') values.push(p.beneficiary);
          
          // Si el pago tiene un commitmentId, buscar el compromiso relacionado
          if (p.commitmentId && firebaseCommitments?.length > 0) {
            const relatedCommitment = firebaseCommitments.find(commitment => commitment.id === p.commitmentId);
            if (relatedCommitment) {
              if (relatedCommitment.provider && relatedCommitment.provider.trim() !== '') {
                values.push(relatedCommitment.provider);
              }
              if (relatedCommitment.beneficiary && relatedCommitment.beneficiary.trim() !== '') {
                values.push(relatedCommitment.beneficiary);
              }
            }
          }
          
          return values;
        })
        .filter(value => value && value.trim() !== '')
      )].sort();
      
      // Debug temporal
      console.log('Beneficiarios únicos encontrados:', beneficiaries);
      console.log('Pagos con datos de proveedor/beneficiario:', payments.map(p => ({
        id: p.id,
        provider: p.provider,
        beneficiary: p.beneficiary,
        commitmentId: p.commitmentId
      })));
      
      setUniqueCompanies(companies);
      setUniqueConcepts(concepts);
      setUniqueBeneficiaries(beneficiaries);
    } else {
      // Limpiar listas cuando no hay datos
      setUniqueCompanies([]);
      setUniqueConcepts([]);
      setUniqueBeneficiaries([]);
    }
  }, [payments, firebaseCommitments]);

  // Cargar empresas con cuentas bancarias
  useEffect(() => {
    if (!currentUser) return;

    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const companiesQuery = query(
          collection(db, 'companies'),
          orderBy('name', 'asc')
        );
        
        const unsubscribe = managedOnSnapshot(companiesQuery, (snapshot) => {
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
        }, (error) => {
          console.error('Error en listener de empresas:', error);
          setLoadingCompanies(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error cargando empresas:', error);
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [currentUser]);

  // useEffect para cargar ingresos
  useEffect(() => {
    if (!currentUser) return;

    const loadIncomes = async () => {
      try {
        setLoadingIncomes(true);
        const incomesQuery = query(
          collection(db, 'income'),
          orderBy('date', 'desc')
        );
        
        const unsubscribe = onSnapshot(incomesQuery, (snapshot) => {
          const incomesData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            incomesData.push({
              id: doc.id,
              ...data
            });
          });
          setIncomes(incomesData);
          setLoadingIncomes(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error cargando ingresos:', error);
        setLoadingIncomes(false);
      }
    };

    loadIncomes();
  }, [currentUser]);

// Cargar cuentas personales desde Firebase (GLOBALES - visibles para todos los usuarios)
useEffect(() => {
  // ✅ CAMBIO: Cargar TODAS las cuentas personales, no filtrar por usuario
  const q = query(
    collection(db, 'personal_accounts'),
    orderBy('createdAt', 'desc')
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
      console.log('🌍 [PaymentsPage] personal_accounts snapshot (GLOBAL) size:', accounts.length);
      setPersonalAccounts(accounts);
    },
    (error) => {
      console.error('Error cargando cuentas personales:', error);
    }
  );

  return () => unsubscribe();
}, []); // ✅ Sin dependencia de currentUser

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
    setAutoOpenPdfViewer(false);
    setReceiptViewerOpen(true);
  };

  // Función para abrir PDF del comprobante directamente
  const handleOpenPdfDirect = (payment) => {
    console.log('📄 Abriendo PDF directo para pago:', payment);
    setSelectedPayment(payment);
    setAutoOpenPdfViewer(true);
    setReceiptViewerOpen(true);
  };

  // Alias semánticamente más correcto para ver información del pago
  const handleViewPayment = (payment) => {
    handleViewReceipt(payment);
  };

  const handleCloseReceiptViewer = () => {
    setReceiptViewerOpen(false);
    setSelectedPayment(null);
    setAutoOpenPdfViewer(false);
  };

  // Función para mostrar notificaciones
  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 🎯 === FUNCIONES PARA MENÚ CONTEXTUAL MEJORADO ===
  
  const handleActionMenuOpen = (event, payment) => {
    setActionMenuAnchor(event.currentTarget);
    setCurrentPayment(payment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    // No limpiar currentPayment aquí si hay un modal abierto
    if (!receiptManagementOpen) {
      setCurrentPayment(null);
    }
  };
  
  // 📤 Handlers para compartir al chat
  const handleSharePayment = (payment) => {
    setPaymentToShare(payment);
    setShareDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setPaymentToShare(null);
  };

  const handleOpenReceiptManagement = (payment) => {
    setCurrentPayment(payment);
    setReceiptManagementOpen(true);
    setActionMenuAnchor(null); // Solo cerrar el menú, mantener currentPayment
  };

  const handleCloseReceiptManagement = () => {
    setReceiptManagementOpen(false);
    setReceiptDragActive(false);
    // Limpiar currentPayment al cerrar el modal
    setTimeout(() => setCurrentPayment(null), 100);
  };

  // Drag & Drop para el modal de gestión de comprobantes
  const handleReceiptDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptDragActive(true);
  };

  const handleReceiptDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptDragActive(false);
  };

  const handleReceiptDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReceiptDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReceiptDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && currentPayment && currentPayment.id) {
      await handleEditReceiptWithFiles(currentPayment, files);
    } else if (!currentPayment) {
      showNotification('Error: No hay pago seleccionado', 'error');
    }
  };

  // Función mejorada para editar comprobante con archivos específicos
  const handleEditReceiptWithFiles = async (payment, files) => {
    try {
      if (!payment || !payment.id) {
        showNotification('Error: Pago no válido', 'error');
        return;
      }

      setUploadingFile(true);
      console.log('📤 Reemplazando comprobantes con archivos:', files.map(f => f.name));
      console.log('💾 Datos del pago actual:', {
        id: payment.id,
        attachments: payment.attachments,
        receiptUrls: payment.receiptUrls,
        receiptUrl: payment.receiptUrl
      });

      // 1. Eliminar archivos antiguos del Storage
      const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
      console.log('🗑️ Eliminando archivos antiguos:', receiptUrls);
      
      for (const url of receiptUrls) {
        if (url) {
          try {
            let filePath = null;
            
            // Intentar extraer el path de diferentes formatos de URL de Firebase Storage
            if (url.includes('firebasestorage.googleapis.com')) {
              // Formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Ffile?alt=media&token=...
              const pathMatch = url.match(/\/o\/(.+?)\?/);
              if (pathMatch) {
                filePath = decodeURIComponent(pathMatch[1]);
              }
            } else if (url.includes('storage.googleapis.com')) {
              // Formato: https://storage.googleapis.com/bucket/path/file
              const urlParts = new URL(url);
              const pathParts = urlParts.pathname.split('/').slice(2); // Eliminar '' y bucket
              if (pathParts.length > 0) {
                filePath = pathParts.join('/');
              }
            }
            
            if (filePath) {
              console.log('🔥 Eliminando archivo con path:', filePath);
              const fileRef = ref(storage, filePath);
              await deleteObject(fileRef);
              console.log('✅ Archivo antiguo eliminado exitosamente');
            } else {
              console.warn('⚠️ No se pudo extraer el path del archivo:', url);
            }
          } catch (deleteError) {
            // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
            if (deleteError.code === 'storage/object-not-found') {
              console.log('ℹ️ Archivo ya no existe en storage (probablemente eliminado anteriormente):', filePath || url);
            } else if (deleteError.code === 'storage/unauthorized') {
              console.warn('⚠️ Sin permisos para eliminar archivo del storage:', filePath || url);
            } else {
              console.warn('⚠️ Error al eliminar archivo antiguo:', deleteError.message, 'Path:', filePath || url);
            }
            // Continuar con el siguiente archivo aunque falle la eliminación
          }
        }
      }

      // 2. Procesar y subir archivos (combinar múltiples archivos en un PDF)
      let filesToUpload = [];
      const timestamp = Date.now();
      
      // Si hay múltiples archivos, combinarlos en un PDF único
      if (files.length > 1) {
        console.log('📄 Combinando múltiples archivos en un PDF único...');
        showNotification('Combinando archivos en PDF único...', 'info');
        
        try {
          const combinedBlob = await combineFilesToPdf(files);
          const combinedFile = new File([combinedBlob], `comprobante_${payment.id}_${timestamp}.pdf`, {
            type: 'application/pdf'
          });
          filesToUpload = [combinedFile];
          console.log('✅ Archivos combinados exitosamente en PDF único');
        } catch (combineError) {
          console.error('❌ Error combinando archivos:', combineError);
          showNotification('Error combinando archivos. Subiendo archivos por separado...', 'warning');
          filesToUpload = files; // Fallback: subir archivos individuales
        }
      } else {
        // Un solo archivo
        filesToUpload = files;
      }
      
      // Subir archivos procesados
      const newReceiptUrls = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        // Generar nombre único para evitar conflictos
        const fileExtension = file.name.split('.').pop();
        const fileName = files.length > 1 && filesToUpload.length === 1
          ? `payments/comprobante_${payment.id}_${timestamp}.pdf`
          : `payments/${payment.id}_${timestamp}_${i + 1}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        console.log('⬆️ Subiendo archivo:', fileName, 'Tamaño:', file.size, 'bytes');
        
        try {
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          newReceiptUrls.push(downloadURL);
          console.log('✅ Archivo subido exitosamente:', downloadURL);
        } catch (uploadError) {
          console.error('❌ Error subiendo archivo:', fileName, uploadError);
          throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
        }
      }
      
      console.log('📋 URLs de nuevos comprobantes:', newReceiptUrls);

      // 3. Actualizar documento en Firestore
      const paymentRef = doc(db, 'payments', payment.id);
      const updateData = {
        attachments: newReceiptUrls, // Campo principal
        receiptUrls: newReceiptUrls, // Para compatibilidad
        receiptUrl: newReceiptUrls[0] || null, // Para compatibilidad con código legacy
        updatedAt: new Date()
      };
      
      console.log('🔄 Actualizando Firestore con datos:', updateData);
      await updateDoc(paymentRef, updateData);
      console.log('✅ Documento actualizado en Firestore exitosamente');

      // 📝 Registrar actividad de auditoría - Modificación de comprobantes de pago
      await logActivity('update_receipt', 'payment', payment.id, {
        concept: payment.concept || 'Sin concepto',
        amount: payment.amount || 0,
        paymentMethod: payment.method || 'Sin método',
        companyName: payment.companyName || 'Sin empresa',
        newReceiptsCount: files.length,
        previousReceiptsCount: (payment.attachments || []).length,
        receiptNames: files.map(f => f.name).join(', '),
        action: 'replace_receipts'
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);

      // Actualizar el estado local del currentPayment para reflejar los cambios inmediatamente
      setCurrentPayment(prevPayment => ({
        ...prevPayment,
        ...updateData,
        id: payment.id
      }));

      console.log('✅ Comprobantes reemplazados exitosamente');
      showNotification('Comprobantes reemplazados exitosamente', 'success');
      
      // Cerrar el modal después de un breve delay para permitir que el usuario vea el éxito
      setTimeout(() => {
        handleCloseReceiptManagement();
      }, 1000);
    } catch (error) {
      console.error('❌ Error al reemplazar comprobantes:', error);
      showNotification(`Error al reemplazar comprobantes: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Función para eliminar comprobante
  const handleDeleteReceipt = async (payment) => {
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
            // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
            if (storageError.code === 'storage/object-not-found') {
              console.log('ℹ️ Archivo ya no existe en storage (probablemente eliminado anteriormente)');
            } else if (storageError.code === 'storage/unauthorized') {
              console.warn('⚠️ Sin permisos para eliminar archivo del storage');
            } else {
              console.warn('⚠️ Error al eliminar archivo de Storage:', storageError.message);
            }
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
              // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
              if (deleteError.code === 'storage/object-not-found') {
                console.log('ℹ️ Archivo ya no existe en storage (probablemente eliminado anteriormente)');
              } else if (deleteError.code === 'storage/unauthorized') {
                console.warn('⚠️ Sin permisos para eliminar archivo del storage');
              } else {
                console.warn('⚠️ Error al eliminar archivo antiguo:', deleteError.message);
              }
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

  // Función para abrir el modal de edición de pago
  const handleEditPayment = async (payment) => {
    console.log('✏️ Editando pago:', payment.id);
    setEditingPayment(payment);
    
    // Cargar datos del compromiso si existe commitmentId
    let providerName = '';
    let commitment = null;
    if (payment.commitmentId) {
      commitment = await loadCommitmentData(payment.commitmentId);
      providerName = commitment?.provider || commitment?.beneficiary || '';
    }
    
    // Determinar si es Coljuegos para mostrar campos específicos
    const isColjuegos = isColjuegosCommitment(commitment);
    
    // 🔍 DEBUG VALORES EXACTOS COMO EN EL MODAL
    console.log('🔍 PAYMENT FORM DEBUG - commitmentData:', commitment);
    console.log('🔍 baseAmount:', commitment?.baseAmount);
    console.log('🔍 iva:', commitment?.iva);
    console.log('🔍 amount:', commitment?.amount);
    console.log('🔍 originalCommitmentAmount:', payment.originalCommitmentAmount);
    
    // Crear copia del pago para trabajar
    let correctedPayment = { ...payment };
    
    // 🔧 CORRECCIÓN AUTOMÁTICA DESACTIVADA TEMPORALMENTE
    // (Se puede reactivar más adelante si es necesario)
    /*
    // Si es un pago de Coljuegos pero los campos específicos están en 0 o undefined
    if (isColjuegos && (!payment.interesesDerechosExplotacion && !payment.interesesGastosAdministracion) && payment.interests > 0) {
      console.log('🔧 Detectado pago Coljuegos sin campos separados. Aplicando corrección automática...');
      
      // Dividir interests entre derechos y gastos (50/50 como patrón común)
      const halfInterests = Math.round(payment.interests / 2);
      correctedPayment = {
        ...payment,
        interesesDerechosExplotacion: halfInterests,
        interesesGastosAdministracion: payment.interests - halfInterests,
        originalAmount: payment.amount - payment.interests
      };
      
      console.log('✅ Corrección aplicada:', {
        original: payment.interests,
        derechos: correctedPayment.interesesDerechosExplotacion,
        gastos: correctedPayment.interesesGastosAdministracion,
        originalAmount: correctedPayment.originalAmount
      });
    }
    // Si es Coljuegos pero no tiene interests ni campos separados, calcular desde commitment
    else if (isColjuegos && !payment.interests && commitment) {
      console.log('🔧 Detectado pago Coljuegos sin intereses. Calculando desde compromiso...');
      
      const totalInterests = payment.amount - (commitment.amount || 0);
      if (totalInterests > 0) {
        const halfInterests = Math.round(totalInterests / 2);
        correctedPayment = {
          ...payment,
          interesesDerechosExplotacion: halfInterests,
          interesesGastosAdministracion: totalInterests - halfInterests,
          originalAmount: payment.amount - totalInterests,
          interests: totalInterests
        };
        
        console.log('✅ Intereses calculados desde compromiso:', {
          commitmentAmount: commitment.amount,
          paymentAmount: payment.amount,
          totalInterests: totalInterests,
          derechos: correctedPayment.interesesDerechosExplotacion,
          gastos: correctedPayment.interesesGastosAdministracion
        });
      }
    }
    */
    
    // === LÓGICA ALINEADA CON PaymentReceiptViewer ===
    const baseOriginal = (
      commitment?.baseAmount ||
      correctedPayment.originalCommitmentAmount ||
      commitment?.originalAmount ||
      commitment?.amount ||
      correctedPayment.originalAmount ||
      0
    );
    const ivaOriginal = commitment?.iva || 0;
    const interesesNormales = isColjuegos ? 0 : (commitment?.intereses || commitment?.interests || correctedPayment.intereses || correctedPayment.interests || 0);

    setEditFormData({
      concept: correctedPayment.concept || '',
      amount: fCurrency(correctedPayment.amount || 0),
      method: correctedPayment.method || '',
      notes: correctedPayment.notes || '',
      reference: correctedPayment.reference || '',
      companyName: correctedPayment.companyName || '',
      provider: providerName,
      interests: isColjuegos ? '' : fCurrency(interesesNormales),
      // ✅ SIEMPRE cargar los valores de Coljuegos si existen (para preservarlos)
      interesesDerechosExplotacion: fCurrency(correctedPayment.interesesDerechosExplotacion ?? commitment?.interesesDerechosExplotacion ?? 0),
      interesesGastosAdministracion: fCurrency(correctedPayment.interesesGastosAdministracion ?? commitment?.interesesGastosAdministracion ?? 0),
      derechosExplotacion: fCurrency(correctedPayment.derechosExplotacion ?? commitment?.derechosExplotacion ?? 0),
      gastosAdministracion: fCurrency(correctedPayment.gastosAdministracion ?? commitment?.gastosAdministracion ?? 0),
      originalAmount: fCurrency(baseOriginal + ivaOriginal), // Monto original (base + IVA)
      baseOriginal: fCurrency(baseOriginal),
      ivaOriginal: fCurrency(ivaOriginal),
      sourceAccount: correctedPayment.sourceAccount || '',
      sourceBank: correctedPayment.sourceBank || '',
      date: formatDateForInput(correctedPayment.date),
      tax4x1000: calculate4x1000Visual(
        correctedPayment.amount || 0,
        correctedPayment.method || '',
        correctedPayment.sourceAccount || ''
      )
    });

    console.log('🔍 Debug - Datos cargados en el modal de edición:', {
      isColjuegos,
      payment: correctedPayment,
      commitment: commitment,
      'RAW derechosExplotacion (PAGO)': correctedPayment.derechosExplotacion,
      'RAW gastosAdministracion (PAGO)': correctedPayment.gastosAdministracion,
      'RAW derechosExplotacion (COMPROMISO)': commitment?.derechosExplotacion,
      'RAW gastosAdministracion (COMPROMISO)': commitment?.gastosAdministracion,
      'RAW interesesDerechosExplotacion': correctedPayment.interesesDerechosExplotacion,
      'RAW interesesGastosAdministracion': correctedPayment.interesesGastosAdministracion,
      'TYPEOF derechosExplotacion': typeof correctedPayment.derechosExplotacion,
      'TYPEOF gastosAdministracion': typeof correctedPayment.gastosAdministracion,
      'IS UNDEFINED derechosExplotacion': correctedPayment.derechosExplotacion === undefined,
      'IS NULL derechosExplotacion': correctedPayment.derechosExplotacion === null,
      'IS ZERO derechosExplotacion': correctedPayment.derechosExplotacion === 0,
      'IS UNDEFINED gastosAdministracion': correctedPayment.gastosAdministracion === undefined,
      'IS NULL gastosAdministracion': correctedPayment.gastosAdministracion === null,
      'IS ZERO gastosAdministracion': correctedPayment.gastosAdministracion === 0,
      'FINAL VALUES USED': {
        derechosExplotacion: correctedPayment.derechosExplotacion ?? commitment?.derechosExplotacion ?? 0,
        gastosAdministracion: correctedPayment.gastosAdministracion ?? commitment?.gastosAdministracion ?? 0
      },
      formData: {
        derechosExplotacion: isColjuegos ? formatCurrency(correctedPayment.derechosExplotacion ?? commitment?.derechosExplotacion ?? 0) : '',
        gastosAdministracion: isColjuegos ? formatCurrency(correctedPayment.gastosAdministracion ?? commitment?.gastosAdministracion ?? 0) : '',
        'FORMATTED derechosExplotacion': formatCurrency(correctedPayment.derechosExplotacion ?? commitment?.derechosExplotacion ?? 0),
        'FORMATTED gastosAdministracion': formatCurrency(correctedPayment.gastosAdministracion ?? commitment?.gastosAdministracion ?? 0)
      }
    });
    
    // 🔄 ACTUALIZACIÓN AUTOMÁTICA DE FIREBASE DESACTIVADA
    /*
    if (correctedPayment !== payment) {
      try {
        console.log('💾 Aplicando corrección automática a Firebase...');
        const paymentRef = doc(db, 'payments', payment.id);
        await updateDoc(paymentRef, {
          interesesDerechosExplotacion: correctedPayment.interesesDerechosExplotacion || 0,
          interesesGastosAdministracion: correctedPayment.interesesGastosAdministracion || 0,
          originalAmount: correctedPayment.originalAmount || correctedPayment.amount,
          interests: correctedPayment.interests || 0,
          updatedAt: new Date()
        });
        
        console.log('✅ Pago actualizado automáticamente en Firebase');
        showNotification('Datos de intereses corregidos automáticamente', 'success');
      } catch (error) {
        console.error('❌ Error al actualizar pago:', error);
        showNotification('Error al corregir datos automáticamente', 'error');
      }
    }
    */
    
    setEditPaymentOpen(true);
  };

  // Función para obtener cuentas bancarias de todas las empresas
  const getBankAccounts = () => {
    const accounts = [];
    
    // Agregar cuentas empresariales
    companies.forEach(company => {
      // La estructura de datos usa bankAccount y bankName (singular), no bankAccounts (array)
      if (company.bankAccount && company.bankName) {
        accounts.push({
          account: company.bankAccount,
          bank: company.bankName,
          companyName: company.name,
          type: 'Empresarial'
        });
      }
    });

    // Agregar cuentas personales desde Firebase
    personalAccounts.forEach(account => {
      if (account.accountNumber && account.bankName) {
        accounts.push({
          account: account.accountNumber,
          bank: account.bankName,
          companyName: account.holderName || 'Personal',
          type: 'Personal'
        });
      }
    });

    // Ordenar: primero empresariales, luego personales
    return accounts.sort((a, b) => {
      if (a.type === 'Empresarial' && b.type === 'Personal') return -1;
      if (a.type === 'Personal' && b.type === 'Empresarial') return 1;
      return a.companyName?.localeCompare(b.companyName) || 0;
    });
  };

  // Función para manejar la selección de cuenta bancaria
  const handleSourceAccountSelect = (event) => {
    const selectedAccount = event.target.value;
    const accountInfo = getBankAccounts().find(acc => acc.account === selectedAccount);
    
    setEditFormData(prev => ({
      ...prev,
      sourceAccount: selectedAccount,
      sourceBank: accountInfo ? accountInfo.bank : ''
    }));
  };

  // Función para calcular balance de una cuenta específica (SOLO MES ACTUAL - RESET MENSUAL)
  const calculateAccountBalance = (accountNumber) => {
    // 🗓️ NUEVO: Usar utilidad de balance mensual para reset automático
    // Calcular balance solo con transacciones del mes actual
    const monthlyBalance = calculateMonthlyAccountBalance(accountNumber, incomes, payments);
    
    return monthlyBalance;
  };

  // Función para formatear moneda
  const formatCurrencyBalance = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // 💰 Función para calcular 4x1000 visual
  const calculate4x1000Visual = (amount, method, sourceAccount) => {
    // 4x1000 se aplica a TODOS los pagos que requieren movimiento bancario
    // Para métodos como "Efectivo", se asume retiro de cuenta bancaria
    if (amount > 0) {
      return Math.round((amount * 4) / 1000);
    }
    return 0;
  };

  // 🔄 useEffect para calcular 4x1000 automáticamente en formulario de edición
  useEffect(() => {
    const tax4x1000Amount = calculate4x1000Visual(
      editFormData.amount, 
      editFormData.method, 
      editFormData.sourceAccount
    );
    
    if (tax4x1000Amount !== editFormData.tax4x1000) {
      setEditFormData(prev => ({
        ...prev,
        tax4x1000: tax4x1000Amount
      }));
    }
  }, [editFormData.amount, editFormData.method, editFormData.sourceAccount]);

  // Función para calcular y crear registro del 4x1000
  const create4x1000Record = async (paymentAmount, sourceAccount, sourceBank, companyName, paymentDate) => {
    // Calcular 4x1000: 4 pesos por cada 1000 pesos transferidos
    const tax4x1000 = Math.round((paymentAmount * 4) / 1000);
    
    // Solo crear si el impuesto es mayor a 0
    if (tax4x1000 <= 0) return null;

    try {
      // Crear registro del 4x1000 como un pago adicional
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
        createdAt: new Date(),
        updatedAt: new Date(),
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        is4x1000Tax: true, // Flag para identificar registros de 4x1000
        relatedToPayment: true, // Flag para indicar que es un impuesto relacionado
        tags: ['impuesto', '4x1000', 'automatico']
      };

      // Agregar a la colección de pagos
      const docRef = await addDoc(collection(db, 'payments'), tax4x1000Data);
      
      // 📝 Registrar actividad de auditoría
      await logActivity('create_payment', 'payment', docRef.id, {
        concept: tax4x1000Data.concept,
        amount: tax4x1000,
        paymentMethod: 'Transferencia',
        companyName: companyName || 'Sin empresa',
        isAutomatic: true,
        is4x1000Tax: true,
        relatedToAmount: paymentAmount
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
      
      console.log('✅ Registro 4x1000 creado:', formatCurrencyBalance(tax4x1000));
      return tax4x1000;
    } catch (error) {
      console.error('❌ Error creando registro 4x1000:', error);
      return null;
    }
  };

  // Función para cerrar el modal de edición
  const handleCloseEditPayment = () => {
    setEditPaymentOpen(false);
    setEditingPayment(null);
    setCommitmentData(null);
    setSelectedFiles([]); // Limpiar archivos seleccionados
    setDragActive(false); // Reset drag state
    setUploading(false); // Reset upload state
    setUploadProgress(0); // Reset progress
    setEditFormData({
      concept: '',
      amount: '',
      method: '',
      notes: '',
      reference: '',
      date: '',
      companyName: '',
      provider: '',
      interests: '',
      interesesDerechosExplotacion: '',
      interesesGastosAdministracion: '',
      originalAmount: '',
      sourceAccount: '',
      sourceBank: '',
      tax4x1000: 0
    });
  };

  // Función para guardar los cambios del pago
  const handleSavePayment = async () => {
    if (!editingPayment || !editFormData.concept.trim() || !editFormData.amount) {
      showNotification('Por favor completa los campos obligatorios', 'warning');
      return;
    }

    try {
      setUploadingFile(true);
      
      const paymentRef = doc(db, 'payments', editingPayment.id);
      
      // Determinar si es Coljuegos para guardar campos específicos
      const isColjuegos = isColjuegosCommitment(commitmentData);
      
      // 📦 Construir actualización PARCIAL (solo campos realmente cambiados)
      const updateData = { updatedAt: new Date() };

      // Helpers de comparación
      const normalizeNumber = (val) => {
        const n = typeof val === 'string' ? parseFloat(cleanCurrency(val)) : Number(val);
        return Number.isFinite(n) ? n : undefined;
      };
      const normalizeDate = (val) => {
        if (!val) return undefined;
        const d = createLocalDate(val);
        if (!(d instanceof Date) || Number.isNaN(d.getTime())) return undefined;
        d.setHours(0,0,0,0);
        return d;
      };
      const normalizeExistingDate = (val) => {
        if (!val) return undefined;
        const d = val.toDate ? val.toDate() : new Date(val);
        if (!(d instanceof Date) || Number.isNaN(d.getTime())) return undefined;
        d.setHours(0,0,0,0);
        return d;
      };
      const addIfChangedStr = (key, newVal, oldVal) => {
        const a = (newVal ?? '').trim();
        const b = (oldVal ?? '').trim();
        if (a !== b) updateData[key] = a;
      };
      const addIfChangedNum = (key, newValRaw, oldValRaw) => {
        const a = normalizeNumber(newValRaw);
        const b = normalizeNumber(oldValRaw);
        if (a !== undefined && a !== b) updateData[key] = a;
      };
      const addIfChangedDate = (key, newValRaw, oldValRaw) => {
        const a = normalizeDate(newValRaw);
        const b = normalizeExistingDate(oldValRaw);
        if (a && (!b || a.getTime() !== b.getTime())) updateData[key] = a;
      };

      // Cadenas
      addIfChangedStr('concept', editFormData.concept, editingPayment.concept);
      addIfChangedStr('method', editFormData.method, editingPayment.method);
      addIfChangedStr('notes', editFormData.notes, editingPayment.notes);
      addIfChangedStr('reference', editFormData.reference, editingPayment.reference);
      addIfChangedStr('companyName', editFormData.companyName, editingPayment.companyName);
      addIfChangedStr('sourceAccount', editFormData.sourceAccount, editingPayment.sourceAccount);
      addIfChangedStr('sourceBank', editFormData.sourceBank, editingPayment.sourceBank);

      // Números
      addIfChangedNum('amount', editFormData.amount, editingPayment.amount);
      addIfChangedNum('originalAmount', editFormData.originalAmount, editingPayment.originalAmount);

      // Fecha
      addIfChangedDate('date', editFormData.date, editingPayment.date);

      // ✅ AGREGAR CAMPOS DE INTERESES SOLO SI ES COLJUEGOS
      // Si NO es Coljuegos, NO incluir estos campos en updateData para preservar valores existentes
      if (isColjuegos) {
        // Es Coljuegos: actualizar SOLO los campos que cambian
        addIfChangedNum('interesesDerechosExplotacion', editFormData.interesesDerechosExplotacion, editingPayment.interesesDerechosExplotacion);
        addIfChangedNum('interesesGastosAdministracion', editFormData.interesesGastosAdministracion, editingPayment.interesesGastosAdministracion);
        addIfChangedNum('derechosExplotacion', editFormData.derechosExplotacion, editingPayment.derechosExplotacion);
        addIfChangedNum('gastosAdministracion', editFormData.gastosAdministracion, editingPayment.gastosAdministracion);

        // Intereses totales (derivado) - recalcular sólo si cambian sus componentes o si interests mismo cambió
        const newInterests = (normalizeNumber(editFormData.interesesDerechosExplotacion) || 0) + (normalizeNumber(editFormData.interesesGastosAdministracion) || 0);
        const oldInterests = normalizeNumber(editingPayment.interests) || 0;
        if (newInterests !== oldInterests) updateData.interests = newInterests;
      } else {
        // NO Coljuegos: actualizar sólo interests normal si cambió
        addIfChangedNum('interests', editFormData.interests, editingPayment.interests);
        // No tocar campos específicos de Coljuegos
      }

      // Si no hay cambios en updateData (más allá de updatedAt) y no hay archivos, evitar write
      const keysToWrite = Object.keys(updateData).filter(k => k !== 'updatedAt');
      if (keysToWrite.length === 0 && selectedFiles.length === 0) {
        setUploadingFile(false);
        showNotification('No hay cambios para guardar', 'info');
        return;
      }

      // =====================================================
      // SUBIR COMPROBANTES SELECCIONADOS (SI LOS HAY)
      // =====================================================
      if (selectedFiles.length > 0) {
        console.log('📁 Subiendo comprobantes seleccionados...');
        setUploadProgress(10);
        
        try {
          let fileToUpload;
          let fileName;

          if (selectedFiles.length === 1) {
            // Un solo archivo
            fileToUpload = selectedFiles[0].file;
            fileName = selectedFiles[0].name;
            console.log('📄 Subiendo archivo único:', fileName);
          } else {
            // Múltiples archivos - combinar en PDF
            setUploadProgress(25);
            showNotification('Combinando archivos en PDF único...', 'info');
            
            const combinedPdf = await combineFilesToPdf(selectedFiles);
            fileToUpload = combinedPdf;
            fileName = `comprobantes_editado_${Date.now()}.pdf`;
            console.log('✅ PDF combinado generado:', fileName);
          }

          // Subir a Firebase Storage
          setUploadProgress(50);
          const timestamp = Date.now();
          const finalFileName = `payments/${timestamp}_${fileName}`;
          const storageRef = ref(storage, finalFileName);
          
          console.log('⬆️ Subiendo a Firebase Storage:', finalFileName);
          const snapshot = await uploadBytes(storageRef, fileToUpload);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          console.log('✅ Comprobante subido exitosamente:', downloadURL);
          setUploadProgress(75);

          // Agregar URLs de comprobantes al updateData
          updateData.attachments = [downloadURL];
          updateData.receiptUrls = [downloadURL];
          updateData.receiptUrl = downloadURL;

          // Actualizar estado local para mostrar inmediatamente
          setEditingPayment(prev => ({
            ...prev,
            attachments: [downloadURL],
            receiptUrls: [downloadURL],
            receiptUrl: downloadURL
          }));

          // Limpiar archivos seleccionados
          setSelectedFiles([]);
          
        } catch (uploadError) {
          console.error('❌ Error subiendo comprobantes:', uploadError);
          showNotification(`Error subiendo comprobantes: ${uploadError.message}`, 'error');
          setUploadingFile(false);
          setUploadProgress(0);
          return; // Detener ejecución si falla la subida
        }
      }

      // Actualizar documento en Firestore
      setUploadProgress(90);
      await updateDoc(paymentRef, updateData);
      
      // 📝 Registrar actividad de auditoría (sin undefineds)
      const activityDetails = {
        concept: updateData.concept ?? editingPayment.concept ?? 'Sin concepto',
        amount: updateData.amount ?? editingPayment.amount ?? 0,
        originalAmount: updateData.originalAmount ?? editingPayment.originalAmount ?? editingPayment.amount ?? 0,
        companyName: (updateData.companyName ?? editingPayment.companyName) || 'Sin empresa',
        paymentMethod: updateData.method ?? editingPayment.method ?? '',
        hasNewAttachments: selectedFiles.length > 0,
        attachmentCount: selectedFiles.length,
        isColjuegos: isColjuegos,
        interestsPaid: updateData.interests ?? editingPayment.interests ?? 0
      };
      // Eliminar claves con undefined explícitamente (seguridad)
      Object.keys(activityDetails).forEach(k => activityDetails[k] === undefined && delete activityDetails[k]);

      await logActivity('update_payment', 'payment', editingPayment.id, activityDetails, 
        currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
      
      // =====================================================
      // GENERAR 4x1000 AUTOMÁTICAMENTE (SI APLICA)
      // =====================================================
      // Solo generar 4x1000 si:
      // 1. Es transferencia bancaria o PSE
      // 2. Tiene cuenta de origen definida
      // 3. El monto es mayor a 0
      if ((updateData.method === 'Transferencia' || updateData.method === 'PSE') && 
          updateData.sourceAccount && 
          updateData.amount > 0) {
        
        console.log('💰 Generando 4x1000 para', updateData.method, 'de:', formatCurrencyBalance(updateData.amount));
        
        const tax4x1000Amount = await create4x1000Record(
          updateData.amount,
          updateData.sourceAccount,
          updateData.sourceBank,
          updateData.companyName,
          updateData.date
        );

        if (tax4x1000Amount) {
          console.log('ℹ️ 4x1000 generado automáticamente:', formatCurrencyBalance(tax4x1000Amount));
        }
      }
      
      setUploadProgress(100);

      console.log('✅ Pago actualizado exitosamente con comprobantes');
      showNotification(
        selectedFiles.length > 0 
          ? `Pago actualizado y ${selectedFiles.length > 1 ? 'comprobantes combinados' : 'comprobante'} subido exitosamente`
          : 'Pago actualizado exitosamente', 
        'success'
      );
      
      handleCloseEditPayment();
    } catch (error) {
      console.error('❌ Error al actualizar pago:', error);
      showNotification(`Error al actualizar pago: ${error.message}`, 'error');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  // Función para eliminar un pago completo
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    
    setDeletingPayment(true);
    
    // ✅ FIXED: Declarar tax4x1000Records fuera del try-catch para que esté disponible en toda la función
    let tax4x1000Records = [];
    
    try {
      console.log('🗑️ Iniciando eliminación del pago:', paymentToDelete.id);
      
      // 1. Eliminar comprobantes de Firebase Storage si existen
      if (paymentToDelete.attachments && paymentToDelete.attachments.length > 0) {
        console.log('📎 Eliminando comprobantes del storage...');
        for (const attachmentUrl of paymentToDelete.attachments) {
          try {
            const storageRef = ref(storage, attachmentUrl);
            await deleteObject(storageRef);
            console.log('✅ Comprobante eliminado del storage:', attachmentUrl);
          } catch (storageError) {
            // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
            if (storageError.code === 'storage/object-not-found') {
              console.log('ℹ️ Archivo ya no existe en storage (probablemente eliminado anteriormente):', attachmentUrl);
            } else if (storageError.code === 'storage/unauthorized') {
              console.warn('⚠️ Sin permisos para eliminar archivo del storage:', attachmentUrl);
            } else {
              console.warn('⚠️ Error eliminando comprobante del storage:', storageError.message, 'URL:', attachmentUrl);
            }
            // Continuar aunque falle eliminar el archivo - no es crítico
          }
        }
      }
      
      // 2. Buscar y eliminar registros de 4x1000 asociados
      console.log('🏦 Buscando registros de 4x1000 asociados...');
      try {
        // Buscar registros de 4x1000 que coincidan con el concepto y fecha del pago
        const paymentsQuery = query(
          collection(db, 'payments'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(paymentsQuery);
        // ✅ FIXED: Reasignar el array en lugar de declarar uno nuevo
        tax4x1000Records = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Identificar registros de 4x1000 por concepto y fecha similar
          if (data.concept && data.concept.includes('4x1000') && data.is4x1000Tax === true) {
            // Verificar si la fecha es del mismo día que el pago original
            const paymentDate = paymentToDelete.date?.toDate?.() || new Date(paymentToDelete.date);
            const taxDate = data.date?.toDate?.() || new Date(data.date);
            
            const isSameDay = paymentDate.toDateString() === taxDate.toDateString();
            const isSimilarAmount = Math.abs(data.amount - Math.round((paymentToDelete.amount * 4) / 1000)) < 10;
            
            if (isSameDay && isSimilarAmount) {
              tax4x1000Records.push({ id: doc.id, data });
            }
          }
        });
        
        // Eliminar registros de 4x1000 encontrados
        if (tax4x1000Records.length > 0) {
          console.log(`💰 Eliminando ${tax4x1000Records.length} registros de 4x1000 asociados...`);
          for (const record of tax4x1000Records) {
            await deleteDoc(doc(db, 'payments', record.id));
            console.log(`✅ 4x1000 eliminado: ${record.data.concept} - $${record.data.amount.toLocaleString()}`);
          }
        } else {
          console.log('ℹ️ No se encontraron registros de 4x1000 asociados');
        }
        
      } catch (error) {
        console.error('⚠️ Error al eliminar registros de 4x1000:', error);
        // Continuar aunque falle la eliminación de 4x1000
      }
      
      // 3. Actualizar compromiso relacionado como no pagado
      if (paymentToDelete.commitmentId) {
        console.log('🔄 Actualizando compromiso relacionado como no pagado...');
        try {
          // Verificar si existen otros pagos para este compromiso (excluyendo 4x1000)
          const otherPaymentsQuery = query(
            collection(db, 'payments'),
            where('commitmentId', '==', paymentToDelete.commitmentId)
          );
          
          const otherPaymentsSnapshot = await getDocs(otherPaymentsQuery);
          const hasOtherValidPayments = otherPaymentsSnapshot.docs.some(doc => {
            const data = doc.data();
            return doc.id !== paymentToDelete.id && !data.is4x1000Tax; // Excluir el que estamos eliminando y los 4x1000
          });
          
          // Si no hay otros pagos válidos, marcar compromiso como no pagado
          if (!hasOtherValidPayments) {
            const commitmentRef = doc(db, 'commitments', paymentToDelete.commitmentId);

            // Leer el compromiso para recalcular estado y saldo
            let newStatus = 'pending';
            let restoredAmount = 0;
            try {
              const commitmentSnap = await getDoc(commitmentRef);
              if (commitmentSnap.exists()) {
                const cData = commitmentSnap.data();
                restoredAmount = cData.amount || cData.originalAmount || 0;
                const rawDue = cData.dueDate?.toDate?.() || cData.dueDate;
                if (rawDue) {
                  const due = new Date(rawDue);
                  due.setHours(0,0,0,0);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  if (due < today) newStatus = 'overdue';
                }
              }
            } catch(readCommitmentErr) {
              console.warn('⚠️ No se pudo leer el compromiso antes de revertir estado, se usará status pending por defecto:', readCommitmentErr);
            }

            await updateDoc(commitmentRef, {
              isPaid: false,
              paid: false,
              status: newStatus,            // Revertir a pending/overdue según fecha
              paymentStatus: deleteField(),  // Eliminar posibles flags previos
              totalPaid: deleteField(),      // Limpia acumulados de pagos
              remainingBalance: restoredAmount, // Restaura saldo completo
              lastPaymentId: deleteField(),
              lastPaymentAmount: deleteField(),
              lastPaymentDate: deleteField(),
              paymentDate: deleteField(),
              paidAt: deleteField(),
              paymentAmount: deleteField(),
              paymentId: deleteField(),
              interestPaid: deleteField(),
              paymentMethod: deleteField(),
              paymentReference: deleteField(),
              paymentNotes: deleteField(),
              receiptUrl: deleteField(),
              receiptUrls: deleteField(),
              receiptMetadata: deleteField(),
              updatedAt: new Date()
            });
            console.log('✅ Compromiso marcado como no pagado y restablecido (status:', newStatus, ')');
          } else {
            console.log('ℹ️ El compromiso tiene otros pagos, mantiene estado pagado');
          }
          
        } catch (commitmentError) {
          console.error('⚠️ Error actualizando estado del compromiso:', commitmentError);
          // No detener la eliminación del pago por este error
        }
      }
      
      // 4. Eliminar el documento del pago de Firestore
      const paymentRef = doc(db, 'payments', paymentToDelete.id);
      await deleteDoc(paymentRef);
      
      // 📝 Registrar actividad de auditoría
      await logActivity('delete_payment', 'payment', paymentToDelete.id, {
        concept: paymentToDelete.concept || 'Pago sin concepto',
        amount: paymentToDelete.amount || 0,
        companyName: paymentToDelete.companyName || paymentToDelete.company || 'Sin empresa',
        commitmentId: paymentToDelete.commitmentId || null,
        paymentMethod: paymentToDelete.paymentMethod || 'No especificado',
        had4x1000: tax4x1000Records.length > 0,
        deleted4x1000Count: tax4x1000Records.length,
        performedByRole: userProfile?.role || 'unknown',
        performedByIsAdmin: isAdmin
      }, currentUser?.uid, userProfile?.name || userProfile?.displayName || 'Usuario desconocido', currentUser?.email);
      
      console.log('✅ Pago eliminado exitosamente');
      showNotification('Pago eliminado y compromiso actualizado correctamente', 'success');
      
      // 6. Limpiar caché de compromisos para forzar actualización
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_COMMITMENTS_CACHE' });
        console.log('🧹 Cache de compromisos limpiado');
      }
      
      // 7. Cerrar modal y limpiar estado
      setDeletePaymentDialogOpen(false);
      setPaymentToDelete(null);
      handleCloseEditPayment();
      
    } catch (error) {
      console.error('❌ Error al eliminar pago:', error);
      showNotification(`Error al eliminar pago: ${error.message}`, 'error');
    } finally {
      setDeletingPayment(false);
    }
  };

  // Función para abrir diálogo de confirmación de eliminación
  const handleOpenDeletePayment = (payment) => {
    setPaymentToDelete(payment || editingPayment);
    setDeletePaymentDialogOpen(true);
  };

  // Función para cerrar diálogo de eliminación
  const handleCloseDeletePayment = () => {
    setDeletePaymentDialogOpen(false);
    setPaymentToDelete(null);
  };

  // Función para formatear números con separadores de miles
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    // Convertir a string y remover todos los caracteres no numéricos
    const cleanValue = value.toString().replace(/[^\d]/g, '');
    // Si después de limpiar no hay dígitos o es '0', manejar caso especial
    if (!cleanValue) return '';
    if (cleanValue === '0') return '0';
    // Aplicar formato con puntos separadores de miles
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Eliminadas funciones de normalización experimental. Usamos datos exactos + fCurrency.

  // Función para limpiar formato de moneda (remover puntos)
  const cleanCurrency = (value) => {
    return value.toString().replace(/\./g, '');
  };

  // Función para detectar si es un compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const provider = commitment.provider || commitment.beneficiary || '';
    return provider.toLowerCase().includes('coljuegos');
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Formateo especial para campos de monto
    if (name === 'amount' || name === 'interests' || name === 'originalAmount' || 
        name === 'interesesDerechosExplotacion' || name === 'interesesGastosAdministracion') {
      const formattedValue = formatCurrency(value);
      
      setEditFormData(prev => {
        const newData = {
          ...prev,
          [name]: formattedValue
        };
        
        // Si se actualizó el amount, recalcular 4x1000 automáticamente
        if (name === 'amount') {
          const numericAmount = parseFloat(formattedValue?.toString().replace(/[^\d.-]/g, '') || 0);
          newData.tax4x1000 = calculate4x1000Visual(numericAmount, prev.method, prev.sourceAccount);
        }
        
        return newData;
      });
    } else {
      setEditFormData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };
        
        // Si se actualizó el método o cuenta origen, recalcular 4x1000
        if (name === 'method' || name === 'sourceAccount') {
          const numericAmount = parseFloat(prev.amount?.toString().replace(/[^\d.-]/g, '') || 0);
          newData.tax4x1000 = calculate4x1000Visual(numericAmount, 
            name === 'method' ? value : prev.method, 
            name === 'sourceAccount' ? value : prev.sourceAccount
          );
        }
        
        return newData;
      });
    }
  };

  // ========================
  // FUNCIONES PARA MANEJAR MÚLTIPLES ARCHIVOS Y COMBINAR PDFs
  // ========================

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
      throw new Error('Tipo de imagen no soportado: ' + imageFile.type);
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
        const file = fileData.file || fileData;
        
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
      console.error('Error combinando archivos:', error);
      throw error;
    }
  };

  // Función para manejar selección de archivos
  const handleFiles = (newFiles) => {
    // Filtrar solo archivos de imagen y PDF
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
    });

    if (validFiles.length !== newFiles.length) {
      showNotification('Solo se permiten imágenes (JPG, PNG) y PDFs menores a 10MB', 'warning');
    }

    setSelectedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false,
      url: null
    }))]);
  };

  // Funciones para drag and drop
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
    const selectedFilesArray = Array.from(e.target.files);
    handleFiles(selectedFilesArray);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Función para subir archivos combinados
  const uploadCombinedFiles = async () => {
    if (selectedFiles.length === 0) {
      showNotification('Por favor selecciona al menos un archivo', 'warning');
      return;
    }

    if (!editingPayment) {
      showNotification('Error: No se encontró el pago a editar', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      let fileToUpload;
      let fileName;

      if (selectedFiles.length === 1) {
        // Si solo hay un archivo, subirlo directamente
        fileToUpload = selectedFiles[0].file;
        fileName = selectedFiles[0].name;
      } else {
        // Si hay múltiples archivos, combinarlos en un PDF
        setUploadProgress(25);
        showNotification('Combinando archivos en PDF único...', 'info');

        const combinedPdf = await combineFilesToPdf(selectedFiles);
        fileToUpload = combinedPdf;
        fileName = `comprobantes_editado_${Date.now()}.pdf`;
        
        setUploadProgress(50);
      }

      // Crear referencia para el archivo
      const timestamp = Date.now();
      const finalFileName = `payments/${timestamp}_${fileName}`;
      const storageRef = ref(storage, finalFileName);

      setUploadProgress(75);

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);

      // Actualizar el pago con el nuevo comprobante
      if (editingPayment) {
        const paymentRef = doc(db, 'payments', editingPayment.id);
        const updateData = {
          attachments: [downloadURL],
          receiptUrls: [downloadURL],
          receiptUrl: downloadURL,
          updatedAt: new Date()
        };
        
        await updateDoc(paymentRef, updateData);

        // Actualizar el estado local del pago editado
        setEditingPayment(prev => ({
          ...prev,
          attachments: [downloadURL],
          receiptUrls: [downloadURL],
          receiptUrl: downloadURL,
          updatedAt: new Date()
        }));

        showNotification(
          selectedFiles.length > 1 
            ? `${selectedFiles.length} archivos combinados y subidos como PDF único`
            : 'Comprobante subido exitosamente', 
          'success'
        );

        // Limpiar archivos seleccionados
        setSelectedFiles([]);
      }

      return [downloadURL];
    } catch (error) {
      console.error('Error al procesar y subir archivos:', error);
      showNotification(`Error al procesar y subir los archivos: ${error.message}`, 'error');
      return [];
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
              height: 120
            }}
          >
            <Box sx={{ 
              p: 2.5, 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              height: '100%',
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
                  FINANZAS • PAGOS
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  mt: 0.5, 
                  mb: 0.5,
                  color: 'white'
                }}>
                  Gestión de Pagos
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.85rem'
                }}>
                  Administra pagos y transacciones corporativas
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
                  label={`Total $${totalAmount.toLocaleString()}`} 
                  sx={{ 
                    fontWeight: 600, 
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    height: 26,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }} 
                />
                <Chip 
                  size="small" 
                  label={`Comp $${completedAmount.toLocaleString()}`} 
                  sx={{ 
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    height: 26,
                    bgcolor: 'rgba(76, 175, 80, 0.3)',
                    color: 'white'
                  }} 
                />
                <Chip 
                  size="small" 
                  label={`Pend $${pendingAmount.toLocaleString()}`} 
                  sx={{ 
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    height: 26,
                    bgcolor: 'rgba(255, 152, 0, 0.3)',
                    color: 'white',
                  }} 
                />
                <Chip 
                  size="small" 
                  label={`${filteredPayments.length} pagos`} 
                  sx={{ 
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    height: 26,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }} 
                />
              </Box>
            </Box>
          </Paper>          {/* KPIs COMPACTOS */}
          <Grid container spacing={1.5}>
            {[{
              label:'Total Procesado', value:`$${totalAmount.toLocaleString()}`, icon:<MoneyIcon />, color: theme.palette.primary.main
            },{
              label:'Completados', value:`$${completedAmount.toLocaleString()}`, icon:<CheckIcon />, color: theme.palette.success.main
            },{
              label:'Pendientes', value:`$${pendingAmount.toLocaleString()}`, icon:<PendingIcon />, color: theme.palette.warning.main
            },{
              label:'Total Pagos', value:filteredPayments.length, icon:<ReceiptIcon />, color: theme.palette.info.main
            },{
              label:'Con Comprobantes', value:paymentsWithReceipts.length, icon:<AttachFileIcon />, color: theme.palette.success.main
            },{
              label:'Sin Comprobantes', value:paymentsWithoutReceipts.length, icon:<ErrorIcon />, color: theme.palette.error.main
            }].map(card => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
                <Card sx={{ 
                  borderRadius: 2, 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  '&:hover': { 
                    borderColor: alpha(theme.palette.primary.main, 0.8),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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

          {/* COMPONENTE DE FILTROS */}
          <PaymentsFilters
            searchTerm={searchTerm}
            companyFilter={companyFilter}
            statusFilter={statusFilter}
            conceptFilter={conceptFilter}
            beneficiaryFilter={beneficiaryFilter}
            receiptsFilter={receiptsFilter}
            dateRangeFilter={dateRangeFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onSearchChange={setSearchTerm}
            onCompanyChange={setCompanyFilter}
            onStatusChange={setStatusFilter}
            onConceptChange={setConceptFilter}
            onBeneficiaryChange={setBeneficiaryFilter}
            onReceiptsChange={setReceiptsFilter}
            onDateRangeChange={setDateRangeFilter}
            onCustomDateRangeChange={(startDate, endDate) => {
              setCustomStartDate(startDate);
              setCustomEndDate(endDate);
            }}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            hasFiltersChanged={hasFiltersChanged()}
            filtersApplied={filtersApplied}
            uniqueCompanies={uniqueCompanies}
            uniqueConcepts={uniqueConcepts}
            uniqueBeneficiaries={uniqueBeneficiaries}
            companies={companies}
          />

          {/* ESTADO VACÍO CUANDO NO HAY FILTROS APLICADOS */}
          {!filtersApplied && (
            <motion.div {...fadeUp}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  px: 4,
                  textAlign: 'center',
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
                    : `linear-gradient(145deg, ${alpha('#ffffff', 0.6)} 0%, ${alpha('#f8fafc', 0.9)} 100%)`,
                  borderRadius: 3,
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    mb: 3
                  }}
                >
                  <FilterList sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="700"
                  color="text.primary"
                  gutterBottom
                >
                  Configura tus filtros
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 500, mb: 3 }}
                >
                  Para comenzar, configura los filtros de búsqueda y luego haz clic en "Aplicar Filtros" 
                  para cargar los pagos que coincidan con tus criterios.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<Business />}
                    label="Filtra por empresa"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    icon={<SearchIcon />}
                    label="Busca por término"
                    variant="outlined"
                    color="primary"
                  />
                  <Chip
                    icon={<Receipt />}
                    label="Filtra por comprobantes"
                    variant="outlined"
                    color="primary"
                  />
                </Box>
              </Box>
            </motion.div>
          )}

          {/* TABLA ESTILO COMMITMENTS LIST - Solo mostrar si hay filtros aplicados */}
          {filtersApplied && (
          <motion.div {...fadeUp}>
            <Box sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}>
              {/* Header de la tabla - Estilo Commitments */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr 1.8fr 1.5fr 1.2fr 1fr 0.9fr 1.8fr 0.5fr',
                gap: 2,
                p: 2.5,
                backgroundColor: 'background.paper',
                borderRadius: '1px 1px 0 0',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderBottom: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                minWidth: 0
              }}>
                {[
                  'ESTADO',
                  'CONCEPTO', 
                  'EMPRESA',
                  'BENEFICIARIO',
                  'MONTO',
                  'FECHA',
                  'REFERENCIA',
                  'COMENTARIOS',
                  'ACCIONES'
                ].map((column) => (
                  <Box 
                    key={column}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-start'
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: 'text.primary',
                        letterSpacing: '0.8px',
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        opacity: 0.85
                      }}
                    >
                      {column}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Cards en formato grid - Estilo Commitments */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                backgroundColor: 'background.paper',
                borderRadius: '0 0 1px 1px',
                borderTop: 'none'
              }}>
                {paginatedPayments.length > 0 ? paginatedPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.01)',
                      transition: { duration: 0.25 }
                    }}
                  >
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr 1.8fr 1.5fr 1.2fr 1fr 0.9fr 1.8fr 0.5fr',
                      gap: 2,
                      p: 2.5,
                      borderBottom: index === paginatedPayments.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)'
                      },
                      alignItems: 'center'
                    }}>
                    {/* Estado - Estilo Commitments */}
                    <Box>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={getStatusText(payment.status)}
                        variant="outlined"
                        size="small"
                        sx={{
                          fontWeight: 500,
                          borderRadius: '20px',
                          borderColor: getStatusColor(payment.status) === 'success' ? theme.palette.success.main :
                                      getStatusColor(payment.status) === 'warning' ? theme.palette.warning.main :
                                      getStatusColor(payment.status) === 'error' ? theme.palette.error.main :
                                      theme.palette.primary.main,
                          color: getStatusColor(payment.status) === 'success' ? theme.palette.success.main :
                                 getStatusColor(payment.status) === 'warning' ? theme.palette.warning.main :
                                 getStatusColor(payment.status) === 'error' ? theme.palette.error.main :
                                 theme.palette.primary.main,
                          backgroundColor: 'transparent !important',
                          '&.MuiChip-root': {
                            backgroundColor: 'transparent !important'
                          },
                          '& .MuiChip-icon': { fontSize: 14 },
                          '& .MuiChip-label': { 
                            px: 1,
                            lineHeight: 1.2
                          }
                        }}
                      />
                    </Box>

                    {/* Concepto */}
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          lineHeight: 1.3
                        }}
                      >
                        {payment.concept || 'Sin concepto'}
                      </Typography>
                    </Box>

                    {/* Empresa */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        {(payment.companyName || 'SC').charAt(0)}
                      </Avatar>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          lineHeight: 1.3
                        }}
                      >
                        {payment.companyName || 'Sin empresa'}
                      </Typography>
                    </Box>

                    {/* Beneficiario */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.5) }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          lineHeight: 1.3
                        }}
                      >
                        {payment.beneficiary || payment.provider || '-'}
                      </Typography>
                    </Box>

                    {/* Monto - Estilo Commitments */}
                    <Box>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.success.main,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '0.875rem',
                        lineHeight: 1.2,
                        letterSpacing: 0
                      }}>
                        ${payment.amount?.toLocaleString('es-MX')}
                      </Typography>
                    </Box>

                    {/* Fecha */}
                    <Box>
                      <Typography variant="body2" sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.3
                      }}>
                        {formatPaymentDate(payment.date)}
                      </Typography>
                    </Box>

                    {/* Referencia */}
                    <Box>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace', 
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        lineHeight: 1.3
                      }}>
                        {payment.reference || '-'}
                      </Typography>
                    </Box>

                    {/* Comentarios */}
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          color: 'text.secondary',
                          lineHeight: 1.3
                        }}
                      >
                        {payment.notes || payment.observations || '-'}
                      </Typography>
                    </Box>

                    {/* ACCIONES - Botón único de menú */}
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Tooltip title="Opciones" arrow>
                        <IconButton
                          size="small"
                          onClick={(event) => handleActionMenuOpen(event, payment)}
                          sx={{ 
                            color: 'text.secondary',
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main'
                            }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    </Box>
                  </motion.div>
                )) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <ReceiptIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      No hay pagos registrados
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Crea el primer registro con el botón "Nuevo Pago"
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </motion.div>
          )}

          {/* PAGINACIÓN SEPARADA ESTILO COMMITMENTS - Solo mostrar si hay filtros aplicados */}
          {filtersApplied && filteredPayments.length > 0 && (
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
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
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

                {/* Salto directo a página - Solo si hay más de 1 página */}
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
                    count={Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage))}
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
        autoOpenPdf={autoOpenPdfViewer}
        commitment={selectedPayment ? {
          id: selectedPayment.commitmentId,
          companyName: selectedPayment.companyName,
          concept: selectedPayment.concept,
          amount: selectedPayment.amount,
          paidAt: selectedPayment.date, // date del pago -> paidAt
          paymentMethod: selectedPayment.method,
          paymentNotes: selectedPayment.notes,
          receiptUrl: selectedPayment.attachments && selectedPayment.attachments.length > 0 ? selectedPayment.attachments[0] : null,
          receiptUrls: selectedPayment.attachments || [],
          // INFORMACIÓN ADICIONAL DEL PAGO
          provider: selectedPayment.provider,
          beneficiary: selectedPayment.beneficiary,
          reference: selectedPayment.reference,
          sourceAccount: selectedPayment.sourceAccount,
          sourceBank: selectedPayment.sourceBank,
          // CAMPOS ESPECÍFICOS DE COLJUEGOS
          originalAmount: selectedPayment.originalAmount,
          interests: selectedPayment.interests,
          interesesDerechosExplotacion: selectedPayment.interesesDerechosExplotacion,
          interesesGastosAdministracion: selectedPayment.interesesGastosAdministracion,
          derechosExplotacion: selectedPayment.derechosExplotacion,
          gastosAdministracion: selectedPayment.gastosAdministracion,
          // CAMPOS ESPECÍFICOS DE PAGOS PARCIALES
          isPartialPayment: selectedPayment.isPartialPayment,
          originalCommitmentAmount: selectedPayment.originalCommitmentAmount,
          remainingBalanceBefore: selectedPayment.remainingBalanceBefore,
          remainingBalanceAfter: selectedPayment.remainingBalanceAfter,
          partialPaymentAmount: selectedPayment.partialPaymentAmount
        } : null}
      />

      {/* Modal de edición de pago - COMPLETO ESTILO NEWPAYMENTPAGE */}
      <Dialog
        open={editPaymentOpen}
        onClose={handleCloseEditPayment}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : '#ffffff',
            minHeight: '70vh',
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          pt: 3,
          px: 3,
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : '#ffffff',
          borderBottom: 'none'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{
              width: 52,
              height: 52,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
              <EditIcon sx={{ 
                fontSize: 24, 
                color: theme.palette.primary.main 
              }} />
            </Avatar>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: alpha(theme.palette.primary.main, 0.9),
              fontSize: '1.25rem'
            }}>
              Editar Pago
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          pt: 2.5, 
          pb: 0, 
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.9) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: theme.palette.mode === 'dark'
              ? `radial-gradient(circle, ${primaryColor}08 0%, transparent 70%)`
              : `radial-gradient(circle, ${primaryColor}05 0%, transparent 70%)`,
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }
        }}>
          <Grid container spacing={2}>
            {/* Columna Izquierda - Información del Pago */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                mb: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2.5
                }}>
                  <Avatar sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                  }}>
                    <MoneyIcon sx={{ 
                      fontSize: 20, 
                      color: theme.palette.primary.main 
                    }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: alpha(theme.palette.primary.main, 0.9),
                    fontSize: '1.1rem'
                  }}>
                    Datos del Pago
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                {/* Empresa/Cliente (a quién le corresponde el pago) */}
                <TextField
                  name="companyName"
                  label="Empresa / Cliente"
                  fullWidth
                  required
                  value={editFormData.companyName}
                  onChange={handleFormChange}
                  variant="outlined"
                  helperText="Empresa a la que le corresponde este pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />

                {/* Proveedor/Beneficiario (desde el compromiso - solo lectura) */}
                <TextField
                  name="provider"
                  label="Proveedor / Beneficiario"
                  fullWidth
                  value={editFormData.provider}
                  variant="outlined"
                  disabled
                  helperText="Tomado del compromiso original (no editable)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                />

                {/* Concepto */}
                <TextField
                  name="concept"
                  label="Concepto del Pago"
                  fullWidth
                  required
                  value={editFormData.concept}
                  onChange={handleFormChange}
                  variant="outlined"
                  helperText="Describe el motivo del pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />
                
                {/* Montos - Layout dinámico según tipo de compromiso */}
                {isColjuegosCommitment(commitmentData) ? (
                  // Layout para Coljuegos (6 campos completos)
                  <>
                    <TextField
                      name="originalAmount"
                      label="Monto Original"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.originalAmount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ 
                            mr: 1, 
                            color: theme.palette.text.secondary, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto total original (base + impuestos)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          backgroundColor: theme.palette.background.paper,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          },
                          '&.Mui-focused': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 0 0 2px ${primaryColor}20`,
                          }
                        }
                      }}
                    />

                    {/* NUEVO CAMPO: Solo Valor Base Original para Coljuegos */}
                    <TextField
                      label="Valor Base Original"
                      type="text"
                      fullWidth
                      value={commitmentData?.baseAmount !== undefined ? fCurrency(commitmentData.baseAmount) : ''}
                      variant="outlined"
                      disabled
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ 
                            mr: 1, 
                            color: theme.palette.primary.main, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Valor base sin impuestos - Coljuegos"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          '& input': {
                            color: theme.palette.primary.main,
                            fontWeight: 600
                          }
                        }
                      }}
                    />

                    {/* Montos Base de Coljuegos */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        name="derechosExplotacion"
                        label="Derechos de Explotación (Base)"
                        type="text"
                        fullWidth
                        value={editFormData.derechosExplotacion || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.info.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Monto base derechos de explotación"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />

                      <TextField
                        name="gastosAdministracion"
                        label="Gastos de Administración (Base)"
                        type="text"
                        fullWidth
                        value={editFormData.gastosAdministracion || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.info.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Monto base gastos administrativos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />
                    </Stack>

                    {/* Intereses Específicos de Coljuegos */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        name="interesesDerechosExplotacion"
                        label="Intereses Derechos de Explotación"
                        type="text"
                        fullWidth
                        value={editFormData.interesesDerechosExplotacion}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.warning.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Intereses por derechos de explotación"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />

                      <TextField
                        name="interesesGastosAdministracion"
                        label="Intereses Gastos de Administración"
                        type="text"
                        fullWidth
                        value={editFormData.interesesGastosAdministracion}
                        onChange={handleFormChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.warning.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Intereses por gastos administrativos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            backgroundColor: theme.palette.background.paper
                          }
                        }}
                      />
                    </Stack>

                    <TextField
                      name="amount"
                      label="Monto Total Pagado"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.amount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputLabelProps={{
                        sx: {
                          backgroundColor: theme.palette.background.paper,
                          px: 0.5,
                          '&.Mui-focused': {
                            backgroundColor: theme.palette.background.paper
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ 
                            mr: 1, 
                            color: theme.palette.success.main, 
                            fontWeight: 600,
                            fontSize: '1rem'
                          }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto final que se pagó efectivamente"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.success.main}`
                        }
                      }}
                    />
                  </>
                ) : (
                  // Layout para compromisos normales (3 campos)
                  <>
                    <TextField
                      name="originalAmount"
                      label="Monto Original"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.originalAmount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto total original (base + impuestos)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper
                        }
                      }}
                    />

                    <TextField
                      name="interests"
                      label="Intereses"
                      type="text"
                      fullWidth
                      value={editFormData.interests}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, color: 'warning.main', fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Intereses aplicados"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper
                        }
                      }}
                    />

                    {/* CAMPOS PARA COMPROMISOS REGULARES */}
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Valor Base Original"
                        type="text"
                        fullWidth
                        value={commitmentData?.baseAmount !== undefined ? fCurrency(commitmentData.baseAmount) : ''}
                        variant="outlined"
                        disabled
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ 
                              mr: 1, 
                              color: theme.palette.primary.main, 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}>
                              $
                            </Typography>
                          )
                        }}
                        helperText="Valor base sin impuestos"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            '& input': {
                              color: theme.palette.primary.main,
                              fontWeight: 600
                            }
                          }
                        }}
                      />

                      {/* IVA Original - Solo mostrar si existe, como en el modal de vista */}
                      {commitmentData?.iva > 0 && (
                        <TextField
                          label="IVA Original"
                          type="text"
                          fullWidth
                          value={
                            commitmentData?.iva ? 
                              fCurrency(commitmentData.iva) : 
                              ''
                          }
                          variant="outlined"
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ 
                                mr: 1, 
                                color: theme.palette.warning.main, 
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}>
                                $
                              </Typography>
                            )
                          }}
                          helperText="IVA del compromiso original"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              backgroundColor: alpha(theme.palette.warning.main, 0.05),
                              '& input': {
                                color: theme.palette.warning.main,
                                fontWeight: 600
                              }
                            }
                          }}
                        />
                      )}
                    </Stack>

                    {/* RETENCIONES (Solo si hasImpuestos = true) */}
                    {commitmentData?.hasImpuestos && (
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="Retefuente Original"
                          type="text"
                          fullWidth
                          value={commitmentData?.retefuente ? formatCurrency(commitmentData.retefuente) : ''}
                          variant="outlined"
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ 
                                mr: 1, 
                                color: theme.palette.error.main, 
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}>
                                $
                              </Typography>
                            )
                          }}
                          helperText="Retefuente del compromiso"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              backgroundColor: alpha(theme.palette.error.main, 0.05),
                              '& input': {
                                color: theme.palette.error.main,
                                fontWeight: 600
                              }
                            }
                          }}
                        />

                        <TextField
                          label="Reteica Original"
                          type="text"
                          fullWidth
                          value={commitmentData?.reteica ? formatCurrency(commitmentData.reteica) : ''}
                          variant="outlined"
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Typography sx={{ 
                                mr: 1, 
                                color: theme.palette.info.main, 
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}>
                                $
                              </Typography>
                            )
                          }}
                          helperText="Reteica del compromiso"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              backgroundColor: alpha(theme.palette.info.main, 0.05),
                              '& input': {
                                color: theme.palette.info.main,
                                fontWeight: 600
                              }
                            }
                          }}
                        />
                      </Stack>
                    )}
                    
                    <TextField
                      name="amount"
                      label="Monto Total Pagado"
                      type="text"
                      required
                      fullWidth
                      value={editFormData.amount}
                      onChange={handleFormChange}
                      variant="outlined"
                      InputLabelProps={{
                        sx: {
                          backgroundColor: theme.palette.background.paper,
                          px: 0.5,
                          '&.Mui-focused': {
                            backgroundColor: theme.palette.background.paper
                          }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Typography sx={{ mr: 1, color: 'success.main', fontWeight: 600 }}>
                            $
                          </Typography>
                        )
                      }}
                      helperText="Monto final pagado"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.success.main}`
                        }
                      }}
                    />
                  </>
                )}
                
                {/* Método de Pago */}
                <FormControl fullWidth required>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    name="method"
                    value={editFormData.method || ''}
                    onChange={handleFormChange}
                    label="Método de Pago"
                    sx={{
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }}
                  >
                    <MenuItem value="Efectivo">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <MoneyIcon fontSize="small" />
                        Efectivo
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Transferencia">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <CompanyIcon fontSize="small" />
                        Transferencia Bancaria
                      </Stack>
                    </MenuItem>
                    <MenuItem value="PSE">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <ReceiptIcon fontSize="small" />
                        PSE (Pagos Seguros en Línea)
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Cuenta Bancaria de Origen */}
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel 
                    id="source-account-label" 
                    shrink
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      px: 0.5,
                      borderRadius: 0.5,
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    Cuenta Bancaria de Origen
                  </InputLabel>
                  <Select
                    labelId="source-account-label"
                    name="sourceAccount"
                    value={editFormData.sourceAccount || ''}
                    onChange={handleSourceAccountSelect}
                    label="Cuenta Bancaria de Origen"
                    displayEmpty
                    notched
                    sx={{
                      borderRadius: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Seleccionar cuenta bancaria</em>
                    </MenuItem>
                    {getBankAccounts().map((account, index) => {
                      return (
                        <MenuItem key={index} value={account.account}>
                          <Stack direction="column" alignItems="flex-start" width="100%">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {account.account}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {account.bank} - {account.companyName} {account.type && `(${account.type})`}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText>Selecciona de qué cuenta salió el dinero</FormHelperText>
                </FormControl>

                {/* Campo banco de origen (auto-completado) */}
                {editFormData.sourceBank && (
                  <TextField
                    name="sourceBank"
                    label="Banco de Origen"
                    fullWidth
                    value={editFormData.sourceBank}
                    variant="outlined"
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  />
                )}

                {/* Fecha de Pago */}
                <TextField
                  name="date"
                  label="Fecha de Pago"
                  type="date"
                  required
                  fullWidth
                  value={editFormData.date}
                  onChange={handleFormChange}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true
                  }}
                  helperText="Fecha en que se realizó el pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />

                {/* Referencia/Número */}
                <TextField
                  name="reference"
                  label="Referencia/Número (Opcional)"
                  fullWidth
                  value={editFormData.reference || ''}
                  onChange={handleFormChange}
                  variant="outlined"
                  placeholder="Ej: Transferencia #123456, Cheque #001"
                  helperText="Número de referencia del pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />

                {/* Notas */}
                <TextField
                  name="notes"
                  label="Notas Adicionales (Opcional)"
                  multiline
                  rows={3}
                  fullWidth
                  value={editFormData.notes}
                  onChange={handleFormChange}
                  variant="outlined"
                  placeholder="Agregar observaciones, condiciones especiales, o información relevante sobre este pago..."
                  helperText="Información adicional sobre el pago"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 0 0 2px ${primaryColor}20`,
                      }
                    }
                  }}
                />
              </Stack>
              </Box>
            </Grid>

            {/* Columna Derecha - Comprobantes */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: alpha(theme.palette.success.main, 0.02),
                border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                mb: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2.5
                }}>
                  <Avatar sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                  }}>
                    <UploadIcon sx={{ 
                      fontSize: 20, 
                      color: theme.palette.success.main 
                    }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: alpha(theme.palette.success.main, 0.9),
                    fontSize: '1.1rem'
                  }}>
                    Comprobantes de Pago
                  </Typography>
                </Box>

                {/* Área de carga de comprobantes */}
                <Paper
                  elevation={0}
                  sx={{
                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.6)}`,
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    background: alpha(theme.palette.primary.main, 0.02),
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.8),
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)'
                    }
                  }}
                  onClick={() => document.getElementById('receipt-upload-edit').click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <motion.div
                  animate={dragActive ? { scale: 1.08, rotate: [0, 3, -3, 0] } : { scale: 1 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Avatar sx={{
                    width: 64,
                    height: 64,
                    backgroundColor: dragActive 
                      ? alpha(theme.palette.success.main, 0.15) 
                      : alpha(theme.palette.primary.main, 0.1),
                    border: `2px solid ${dragActive 
                      ? alpha(theme.palette.success.main, 0.4) 
                      : alpha(theme.palette.primary.main, 0.3)}`,
                    mb: 2,
                    transition: 'all 0.3s ease'
                  }}>
                    <UploadIcon sx={{ 
                      fontSize: 28, 
                      color: dragActive 
                        ? theme.palette.success.main 
                        : theme.palette.primary.main,
                      transition: 'all 0.3s ease'
                    }} />
                  </Avatar>
                </motion.div>
                
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: dragActive 
                    ? theme.palette.success.main 
                    : alpha(theme.palette.primary.main, 0.9),
                  mb: 1,
                  transition: 'all 0.3s ease'
                }}>
                  {dragActive ? '¡Suelta los archivos aquí!' : 'Subir Comprobantes'}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                  Arrastra archivos aquí o haz clic para seleccionar
                </Typography>
                
                <Typography variant="caption" sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontSize: '0.75rem'
                }}>
                  PDF, JPG, PNG • Máximo 10MB por archivo
                </Typography>
                
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, mt: 1 }}>
                  💡 Múltiples archivos se combinarán automáticamente en un solo PDF
                </Typography>

                <input
                  id="receipt-upload-edit"
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileSelect}
                />
              </Paper>

              {/* Lista de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2
                  }}>
                    <Avatar sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                    }}>
                      <FileIcon sx={{ 
                        fontSize: 16, 
                        color: theme.palette.info.main 
                      }} />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: alpha(theme.palette.info.main, 0.9)
                    }}>
                      📋 Archivos Seleccionados ({selectedFiles.length})
                    </Typography>
                  </Box>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    {selectedFiles.map((fileData, index) => (
                      <motion.div
                        key={fileData.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            background: fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.02)
                              : alpha(theme.palette.info.main, 0.02),
                            border: `1px solid ${fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.6)
                              : alpha(theme.palette.info.main, 0.6)}`,
                            borderRadius: 2,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                              borderColor: fileData.uploaded 
                                ? alpha(theme.palette.success.main, 0.8)
                                : alpha(theme.palette.info.main, 0.8)
                            }
                          }}
                        >
                          <Avatar sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${fileData.uploaded 
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.info.main, 0.3)}`
                          }}>
                            <FileIcon sx={{ 
                              fontSize: 18, 
                              color: fileData.uploaded 
                                ? theme.palette.success.main
                                : theme.palette.info.main
                            }} />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              mb: 0.5,
                              color: fileData.uploaded 
                                ? theme.palette.success.main
                                : theme.palette.info.main
                            }}>
                              {fileData.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(fileData.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                          <IconButton 
                            onClick={() => removeFile(fileData.id)}
                            size="small"
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Paper>
                      </motion.div>
                    ))}
                  </Stack>
                  
                  {/* Información sobre múltiples archivos */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{ 
                        mt: 3, 
                        p: 3, 
                        background: alpha(theme.palette.info.main, 0.02),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                          }}>
                            <InfoIcon sx={{ 
                              fontSize: 18, 
                              color: theme.palette.info.main 
                            }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ 
                              fontWeight: 600, 
                              mb: 0.5,
                              color: alpha(theme.palette.info.main, 0.9)
                            }}>
                              � Procesamiento Automático
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                              {selectedFiles.length > 1 
                                ? `${selectedFiles.length} archivos se combinarán automáticamente en un PDF único al guardar cambios`
                                : '1 archivo se subirá al guardar cambios'
                              }
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setSelectedFiles([])}
                          sx={{ 
                            color: theme.palette.info.main, 
                            borderColor: alpha(theme.palette.info.main, 0.6),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                              borderColor: theme.palette.info.main,
                              transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Limpiar
                        </Button>
                      </Box>
                    </Paper>
                  </motion.div>
                </Box>
              )}

              {/* Mostrar comprobantes actuales si existen */}
              {editingPayment?.attachments?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2
                  }}>
                    <Avatar sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                    }}>
                      <ReceiptIcon sx={{ 
                        fontSize: 16, 
                        color: theme.palette.success.main 
                      }} />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: alpha(theme.palette.success.main, 0.9)
                    }}>
                      📋 Comprobantes Actuales:
                    </Typography>
                  </Box>
                  {editingPayment.attachments.map((attachment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2.5,
                          background: alpha(theme.palette.success.main, 0.02),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
                          borderRadius: 2,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                            borderColor: alpha(theme.palette.success.main, 0.8),
                            background: alpha(theme.palette.success.main, 0.04)
                          }
                        }}
                      >
                        <Avatar sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`
                        }}>
                          <FileIcon sx={{ 
                            fontSize: 22, 
                            color: theme.palette.success.main 
                          }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            color: alpha(theme.palette.success.main, 0.9),
                            mb: 0.5
                          }}>
                            Comprobante {index + 1}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            opacity: 0.7
                          }}>
                            {attachment.slice(-20)}
                          </Typography>
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Chip
                            label="PDF"
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main,
                              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Progress bar durante la subida */}
        {uploadingFile && uploadProgress > 0 && (
          <Box sx={{ px: 3, pb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1, borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              {uploadProgress < 25 ? 'Preparando archivos...' :
               uploadProgress < 50 ? 'Combinando documentos...' :
               uploadProgress < 75 ? 'Subiendo a la nube...' :
               uploadProgress < 90 ? 'Actualizando datos...' :
               'Finalizando...'}
            </Typography>
          </Box>
        )}

        <DialogActions sx={{ 
          p: 2, 
          pt: 1.5, 
          gap: 1.5,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)'
            : 'linear-gradient(145deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.8) 100%)',
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* Botón de eliminar pago - Lado izquierdo */}
          <Button
            onClick={() => handleOpenDeletePayment(editingPayment)}
            variant="outlined"
            color="error"
            size="medium"
            startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
            sx={{ 
              borderRadius: 1.5,
              px: 2.5,
              py: 1,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            Eliminar Pago
          </Button>

          {/* Botones de cancelar y guardar - Lado derecho */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={handleCloseEditPayment}
              variant="outlined"
              size="medium"
              startIcon={<CancelIcon sx={{ fontSize: 18 }} />}
              sx={{ 
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePayment}
              variant="contained"
              size="medium"
              startIcon={uploadingFile ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: 18 }} />}
              disabled={!editFormData.concept || !editFormData.amount || !editFormData.method || !editFormData.companyName || uploadingFile}
              sx={{ 
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                fontWeight: 600,
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
              {uploadingFile ? 
                (uploadProgress > 0 ? 
                  `${uploadProgress < 50 ? 'Subiendo...' : uploadProgress < 90 ? 'Guardando...' : 'Finalizando...'}` 
                  : 'Procesando...'
                ) 
                : 'Guardar Cambios'
              }
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación de pago */}
      <Dialog
        open={deletePaymentDialogOpen}
        onClose={handleCloseDeletePayment}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main',
          fontWeight: 600
        }}>
          <DeleteIcon />
          Eliminar Pago
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
          </Typography>
          
          {paymentToDelete && (
            <Paper sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.error.main, 0.05),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Detalles del pago:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Concepto:</strong> {paymentToDelete.concept || 'Sin concepto'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Monto:</strong> ${paymentToDelete.amount?.toLocaleString('es-MX')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Empresa:</strong> {paymentToDelete.companyName || 'Sin empresa'}
              </Typography>
              {paymentToDelete.attachments?.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Comprobantes:</strong> {paymentToDelete.attachments.length} archivo(s)
                </Typography>
              )}
            </Paper>
          )}
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Se eliminará el registro del pago y todos sus comprobantes asociados.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleCloseDeletePayment}
            variant="outlined"
            disabled={deletingPayment}
            sx={{ 
              borderRadius: 1,
              px: 3,
              fontWeight: 600
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeletePayment}
            variant="contained"
            color="error"
            disabled={deletingPayment}
            startIcon={deletingPayment ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{ 
              borderRadius: 1,
              px: 3,
              fontWeight: 600
            }}
          >
            {deletingPayment ? 'Eliminando...' : 'Eliminar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* 🎯 MENÚ CONTEXTUAL MEJORADO */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          }
        }}
        TransitionComponent={Fade}
      >
        {/* Ver pago */}
        <ListItemButton onClick={() => {
          handleViewPayment(currentPayment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Visibility sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Ver pago"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>

        {/* Editar datos del pago */}
        <ListItemButton onClick={() => {
          handleEditPayment(currentPayment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Edit sx={{ color: 'warning.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Editar pago"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>

        {/* Compartir al chat */}
        <ListItemButton onClick={() => {
          handleSharePayment(currentPayment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Share sx={{ color: 'success.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Compartir en chat"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>

        {/* Divider antes de gestión de comprobantes */}
        {currentPayment?.attachments?.length > 0 && <Divider sx={{ my: 0.5 }} />}

        {/* Ver comprobante - solo si existe */}
        {currentPayment?.attachments?.length > 0 && (
          <ListItemButton onClick={() => {
            handleOpenPdfDirect(currentPayment);
            handleActionMenuClose();
          }}>
            <ListItemIcon>
              <Visibility sx={{ color: 'info.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Ver comprobante"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}

        {/* Gestión de comprobantes - solo si existe */}
        {currentPayment?.attachments?.length > 0 && (
          <>
            <ListItemButton onClick={() => handleOpenReceiptManagement(currentPayment)}>
              <ListItemIcon>
                <SwapIcon sx={{ color: 'warning.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Gestionar comprobantes"
                secondary="Reemplazar o eliminar"
                primaryTypographyProps={{ fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </>
        )}
      </Menu>

      {/* 📄 MODAL DE GESTIÓN DE COMPROBANTES MEJORADO */}
      <Dialog
        open={receiptManagementOpen}
        onClose={handleCloseReceiptManagement}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : '#ffffff',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          pt: 3,
          px: 3,
          backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : '#ffffff',
          borderBottom: 'none'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{
              width: 52,
              height: 52,
              backgroundColor: alpha(theme.palette.secondary.main, 0.12),
              border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`
            }}>
              <AttachEmailIcon sx={{ 
                fontSize: 24, 
                color: theme.palette.secondary.main 
              }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: alpha(theme.palette.secondary.main, 0.9),
                fontSize: '1.25rem'
              }}>
                Gestionar Comprobantes
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                fontSize: '0.9rem',
                mt: 0.5
              }}>
                {currentPayment?.concept || 'Pago seleccionado'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Comprobantes actuales */}
          {currentPayment?.attachments?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2.5
              }}>
                <Avatar sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                }}>
                  <ReceiptIcon sx={{ 
                    fontSize: 20, 
                    color: theme.palette.success.main 
                  }} />
                </Avatar>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: alpha(theme.palette.success.main, 0.9),
                  fontSize: '1.1rem'
                }}>
                  Comprobantes actuales
                </Typography>
              </Box>
              <Paper
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  background: alpha(theme.palette.success.main, 0.02),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <Avatar sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                }}>
                  <CheckIcon sx={{ 
                    fontSize: 18, 
                    color: theme.palette.success.main 
                  }} />
                </Avatar>
                <Typography variant="body1" sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.success.main, 0.9)
                }}>
                  {currentPayment.attachments.length} archivo(s) adjunto(s)
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Zona de drag & drop mejorada */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2.5
            }}>
              <Avatar sx={{
                width: 40,
                height: 40,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              }}>
                <SwapIcon sx={{ 
                  fontSize: 20, 
                  color: theme.palette.primary.main 
                }} />
              </Avatar>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: alpha(theme.palette.primary.main, 0.9),
                fontSize: '1.1rem'
              }}>
                Reemplazar comprobantes
              </Typography>
            </Box>
            <Box
              onDragEnter={handleReceiptDragEnter}
              onDragLeave={handleReceiptDragLeave}
              onDragOver={handleReceiptDragOver}
              onDrop={handleReceiptDrop}
              sx={{
                border: `2px dashed ${receiptDragActive 
                  ? alpha(theme.palette.primary.main, 0.8) 
                  : alpha(theme.palette.primary.main, 0.6)}`,
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: receiptDragActive 
                  ? alpha(theme.palette.primary.main, 0.04)
                  : alpha(theme.palette.primary.main, 0.02),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 200,
                justifyContent: 'center',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.8),
                  background: alpha(theme.palette.primary.main, 0.04),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)'
                }
              }}
              onClick={() => {
                if (!currentPayment || !currentPayment.id) {
                  showNotification('Error: No hay pago seleccionado para reemplazar comprobantes', 'error');
                  return;
                }
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0 && currentPayment && currentPayment.id) {
                    handleEditReceiptWithFiles(currentPayment, files);
                  }
                };
                input.click();
              }}
            >
              <motion.div
                animate={receiptDragActive ? { scale: 1.08, rotate: [0, 3, -3, 0] } : { scale: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <Avatar sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: receiptDragActive 
                    ? alpha(theme.palette.success.main, 0.15) 
                    : alpha(theme.palette.primary.main, 0.1),
                  border: `2px solid ${receiptDragActive 
                    ? alpha(theme.palette.success.main, 0.4) 
                    : alpha(theme.palette.primary.main, 0.3)}`,
                  mb: 2,
                  transition: 'all 0.3s ease'
                }}>
                  <CloudUpload sx={{ 
                    fontSize: 28, 
                    color: receiptDragActive 
                      ? theme.palette.success.main 
                      : theme.palette.primary.main,
                    transition: 'all 0.3s ease'
                  }} />
                </Avatar>
              </motion.div>
              
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: receiptDragActive 
                  ? theme.palette.success.main 
                  : alpha(theme.palette.primary.main, 0.9),
                mb: 1,
                transition: 'all 0.3s ease'
              }}>
                {receiptDragActive ? 'Suelta los archivos aquí' : 'Subir nuevos comprobantes'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                Arrastra archivos aquí o haz clic para seleccionar
              </Typography>
              <Typography variant="caption" sx={{ 
                color: alpha(theme.palette.text.secondary, 0.7),
                fontSize: '0.75rem'
              }}>
                Formatos: PDF, JPG, PNG | Múltiples archivos permitidos
              </Typography>
            </Box>
          </Box>

          {/* Loading indicator */}
          {uploadingFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{ 
                  mt: 3,
                  p: 3,
                  background: alpha(theme.palette.info.main, 0.02),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.6)}`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                }}>
                  <CircularProgress size={20} sx={{ color: theme.palette.info.main }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600,
                    color: alpha(theme.palette.info.main, 0.9),
                    mb: 0.5
                  }}>
                    Procesando archivos...
                  </Typography>
                  <LinearProgress sx={{ 
                    width: 200,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.info.main
                    }
                  }} />
                </Box>
              </Paper>
            </motion.div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Button
            onClick={() => {
              if (window.confirm('¿Estás seguro de eliminar todos los comprobantes? Esta acción no se puede deshacer.')) {
                handleDeleteReceipt(currentPayment);
                handleCloseReceiptManagement();
              }
            }}
            disabled={uploadingFile}
            startIcon={<Delete />}
            variant="outlined"
            sx={{ 
              color: 'error.main',
              borderColor: alpha(theme.palette.error.main, 0.6),
              '&:hover': { 
                bgcolor: alpha(theme.palette.error.main, 0.1),
                borderColor: theme.palette.error.main,
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              },
              '&:disabled': {
                opacity: 0.5
              },
              transition: 'all 0.2s ease'
            }}
          >
            Eliminar todos
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button 
            onClick={handleCloseReceiptManagement} 
            disabled={uploadingFile}
            variant="contained"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.9),
              '&:hover': {
                bgcolor: theme.palette.primary.main,
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              },
              '&:disabled': {
                opacity: 0.5
              },
              transition: 'all 0.2s ease'
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📤 Dialog para compartir al chat */}
      <ShareToChat
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        entity={paymentToShare}
        entityType="payment"
        entityName="pago"
      />
    </Box>
  );
};

export default PaymentsPage;
