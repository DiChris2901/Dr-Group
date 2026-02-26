import React, { useState, useEffect } from 'react';
import { isValid } from 'date-fns';
import { fCurrency } from '../utils/formatUtils';
import { calculateMonthlyAccountBalance } from '../utils/monthlyBalanceUtils';
import {
  createLocalDate,
  formatPaymentDate,
  formatDateForInput,
  getStatusColor,
  getStatusText,
  formatCurrency,
  cleanCurrency,
  isColjuegosCommitment,
  imageToPdf,
  combineFilesToPdf
} from './payments/paymentsHelpers';
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

// Context para tema
// Nota: Los colores dinámicos se deben leer del theme de MUI

// Hook para cargar pagos desde Firebase
import { usePayments, useCommitments } from '../hooks/useFirestore';
// Firebase para manejo de archivos y Firestore
import { doc, updateDoc, getDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, getDocs, where, deleteField } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { managedOnSnapshot } from '../utils/listenerManager';
// Componente para visor de comprobantes de pago
import PaymentReceiptViewer from '../components/commitments/PaymentReceiptViewer';
import EditPaymentDialog from './payments/EditPaymentDialog';
// Context para autenticación
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/permissions';
// Hook para auditoría
import useActivityLogs from '../hooks/useActivityLogs';


// Helper that returns JSX — cannot be in pure-utility paymentsHelpers.js
const getStatusIcon = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'completado') return <CheckIcon fontSize="small" />;
  if (s === 'pending' || s === 'pendiente') return <PendingIcon fontSize="small" />;
  if (s === 'failed' || s === 'fallido') return <ErrorIcon fontSize="small" />;
  return <PendingIcon fontSize="small" />;
};

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
  
  // Estados para modal de gestión de comprobantes
  const [receiptManagementOpen, setReceiptManagementOpen] = useState(false);
  const [receiptDragActive, setReceiptDragActive] = useState(false);
  


  
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

  // Enriquecer pagos con datos actualizados de compromisos
  const payments = React.useMemo(() => {
    if (!firebasePayments || !firebaseCommitments) return firebasePayments;
    
    return firebasePayments.map(payment => {
      // Si el pago tiene un compromiso asociado, actualizar datos del compromiso
      if (payment.commitmentId && firebaseCommitments.length > 0) {
        const relatedCommitment = firebaseCommitments.find(c => c.id === payment.commitmentId);
        
        if (relatedCommitment) {
          // Actualizar beneficiario/proveedor desde el compromiso actualizado
          return {
            ...payment,
            beneficiary: relatedCommitment.beneficiary || relatedCommitment.provider || payment.beneficiary,
            provider: relatedCommitment.provider || relatedCommitment.beneficiary || payment.provider,
            concept: relatedCommitment.concept || payment.concept,
            companyName: relatedCommitment.companyName || payment.companyName
          };
        }
      }
      
      // Si no hay compromiso asociado, devolver el pago sin cambios
      return payment;
    });
  }, [firebasePayments, firebaseCommitments]);

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
    setSelectedPayment(payment);
    setAutoOpenPdfViewer(false);
    setReceiptViewerOpen(true);
  };

  // Función para abrir PDF del comprobante directamente
  const handleOpenPdfDirect = (payment) => {
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

      // 1. Eliminar archivos antiguos del Storage
      const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
      
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
              const fileRef = ref(storage, filePath);
              await deleteObject(fileRef);
            } else {
            }
          } catch (deleteError) {
            // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
            if (deleteError.code === 'storage/object-not-found') {
            } else if (deleteError.code === 'storage/unauthorized') {
            } else {
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
        showNotification('Combinando archivos en PDF único...', 'info');
        
        try {
          const combinedBlob = await combineFilesToPdf(files);
          const combinedFile = new File([combinedBlob], `comprobante_${payment.id}_${timestamp}.pdf`, {
            type: 'application/pdf'
          });
          filesToUpload = [combinedFile];
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
        
        
        try {
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          newReceiptUrls.push(downloadURL);
        } catch (uploadError) {
          console.error('❌ Error subiendo archivo:', fileName, uploadError);
          throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
        }
      }
      

      // 3. Actualizar documento en Firestore
      const paymentRef = doc(db, 'payments', payment.id);
      const updateData = {
        attachments: newReceiptUrls, // Campo principal
        receiptUrls: newReceiptUrls, // Para compatibilidad
        receiptUrl: newReceiptUrls[0] || null, // Para compatibilidad con código legacy
        updatedAt: new Date()
      };
      
      await updateDoc(paymentRef, updateData);

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
      
      // Verificar que el pago tenga comprobantes - usar attachments como campo principal
      const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
      
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
              const fileRef = ref(storage, filePath);
              await deleteObject(fileRef);
            }
          } catch (storageError) {
            // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
            if (storageError.code === 'storage/object-not-found') {
            } else if (storageError.code === 'storage/unauthorized') {
            } else {
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

        // 1. Eliminar archivos antiguos del Storage
        const receiptUrls = payment.attachments || payment.receiptUrls || [payment.receiptUrl].filter(Boolean) || [];
        
        for (const url of receiptUrls) {
          if (url) {
            try {
              const filePathMatch = url.match(/o\/(.+?)\?/);
              if (filePathMatch) {
                const filePath = decodeURIComponent(filePathMatch[1]);
                const fileRef = ref(storage, filePath);
                await deleteObject(fileRef);
              }
            } catch (deleteError) {
              // ✅ MEJORADO: Manejo específico para diferentes tipos de errores
              if (deleteError.code === 'storage/object-not-found') {
              } else if (deleteError.code === 'storage/unauthorized') {
              } else {
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
          
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          newReceiptUrls.push(downloadURL);
        }

        // 3. Actualizar documento en Firestore
        const paymentRef = doc(db, 'payments', payment.id);
        await updateDoc(paymentRef, {
          attachments: newReceiptUrls, // Campo principal
          receiptUrls: newReceiptUrls,
          receiptUrl: newReceiptUrls[0] || null, // Para compatibilidad
          updatedAt: new Date()
        });

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

  // Open edit dialog — EditPaymentDialog handles all internal logic
  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setEditPaymentOpen(true);
  };






  // 🔄 useEffect para calcular 4x1000 automáticamente en formulario de edición
















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
                gridTemplateColumns: '1fr 1.5fr 1.8fr 1.5fr 1.2fr 1fr 1.8fr 0.5fr',
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
                      gridTemplateColumns: '1fr 1.5fr 1.8fr 1.5fr 1.2fr 1fr 1.8fr 0.5fr',
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


      {/* Edit Payment Dialog — Extracted Component */}
      <EditPaymentDialog
        open={editPaymentOpen}
        payment={editingPayment}
        onClose={() => { setEditPaymentOpen(false); setEditingPayment(null); }}
        companies={companies}
        personalAccounts={personalAccounts}
        incomes={incomes}
        payments={payments}
        showNotification={showNotification}
        currentUser={currentUser}
        userProfile={userProfile}
        isAdmin={isAdmin}
        logActivity={logActivity}
      />

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

    </Box>
  );
};

export default PaymentsPage;
