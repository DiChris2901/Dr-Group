import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Pagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Avatar,
  Paper,
  Menu,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, addDays, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, deleteDoc, limit, getDocs } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL, getMetadata } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { isAdminUser } from '../../utils/permissions';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import useActivityLogs from '../../hooks/useActivityLogs';
import { useTableTokens } from '../../hooks/useTokens';
import useCommitmentAlerts from '../../hooks/useCommitmentAlerts';
import { useCommitmentCompleteStatus } from '../../hooks/useCommitmentPaymentStatus';
import { determineCommitmentStatus, filterCommitmentsByStatus } from '../../utils/commitmentStatusUtils';
import CommitmentEditFormComplete from './CommitmentEditFormComplete';
import CommitmentStatusChip, { getEnhancedStatusInfo } from './CommitmentStatusChip';
import {
  FilterList,
  NavigateBefore,
  NavigateNext,
  FirstPage,
  LastPage,
  Close,
  Visibility,
  Edit,
  AttachFile,
  AccountBalance,
  Warning,
  CheckCircle,
  GetApp,
  Payment,
  Person,
  Schedule,
  NotificationAdd,
  CalendarToday,
  Business,
  Delete,
  Fullscreen,
  FullscreenExit,
  OpenInNew,
  InsertDriveFile,
  PictureAsPdf,
  Image,
  FolderOpen,
  Info,
  Share,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import CommitmentDetailDialog from './CommitmentDetailDialog';
import { getDateRangeFromFilter } from '../payments/DateRangeFilter';
import { isValid } from 'date-fns';

// Función helper para validar y crear fechas seguras
const createSafeDate = (year, month, day = 1, hours = 0, minutes = 0, seconds = 0) => {
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  
  // Validar que los valores sean números válidos
  if (isNaN(yearNum) || isNaN(monthNum) || 
      yearNum < 1900 || yearNum > 2100 || 
      monthNum < 0 || monthNum > 11) {
    return null;
  }
  
  const date = new Date(yearNum, monthNum, day, hours, minutes, seconds);
  
  // Verificar que la fecha creada sea válida
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

// ================= Helper & UI Sub-Components Restored =================
// (Recovered after extraction patch accidentally removed them)

// Safe date conversion
const safeToDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  return null;
};

// Dark mode color helpers (global)
const getGlobalDarkModeColors = (theme) => ({
  cardBackground: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.95) : '#ffffff',
  cardBorder: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : alpha(theme.palette.divider, 0.2),
  hoverBackground: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.98) : alpha(theme.palette.background.default, 0.8),
  shadowColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
  textPrimary: theme.palette.mode === 'dark' ? '#e2e8f0' : theme.palette.text.primary,
  textSecondary: theme.palette.mode === 'dark' ? '#94a3b8' : theme.palette.text.secondary
});

// Status color helper
const getStatusColor = (status, theme) => {
  if (!theme || !theme.palette) return { main: '#666', light: '#999', dark: '#333' };
  switch (status.chipColor) {
    case 'success': return { main: theme.palette.success.main, light: theme.palette.success.light, dark: theme.palette.success.dark };
    case 'error': return { main: theme.palette.error.main, light: theme.palette.error.light, dark: theme.palette.error.dark };
    case 'warning': return { main: theme.palette.warning.main, light: theme.palette.warning.light, dark: theme.palette.warning.dark };
    case 'info': return { main: theme.palette.info.main, light: theme.palette.info.light, dark: theme.palette.info.dark };
    default: return { main: theme.palette.grey[600], light: theme.palette.grey[400], dark: theme.palette.grey[800] };
  }
};

// Status chip (Design System 3)
const StatusChipDS3 = ({ status, showTooltip = false, theme }) => {
  const colors = getStatusColor(status, theme);
  const chip = (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <Chip
        icon={status.icon}
        label={status.label}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
            height: 28,
            minWidth: 80,
            borderRadius: '14px',
            backgroundColor: 'transparent !important',
            color: colors.main,
            border: `1px solid ${alpha(colors.main, 0.25)}`,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            '& .MuiChip-icon': { color: colors.main, fontSize: 16, marginLeft: '4px' },
            '& .MuiChip-label': { paddingLeft: '6px', paddingRight: '12px', letterSpacing: '0.3px', fontWeight: 600 },
            '&:hover': { backgroundColor: 'transparent !important', borderColor: alpha(colors.main, 0.35), boxShadow: `0 2px 4px ${alpha(colors.main, 0.15)}`, transform: 'scale(1.02)' }
        }}
      />
    </motion.div>
  );
  return showTooltip ? (
    <Tooltip title={`Estado: ${status.label}`} arrow placement="top">
      {chip}
    </Tooltip>
  ) : chip;
};

// Date display component
const DateDisplayDS3 = ({ date, showDaysRemaining = false, variant = 'standard', theme, isPaid = false }) => {
  const darkColors = getGlobalDarkModeColors(theme);
  if (!date) return <Typography color={darkColors.textSecondary}>Fecha no disponible</Typography>;
  const safe = safeToDate(date);
  if (!safe) return <Typography color={darkColors.textSecondary}>Fecha inválida</Typography>;
  const today = new Date();
  const daysRemaining = differenceInDays(safe, today);
  const formats = {
    standard: { dateFormat: 'dd/MM/yyyy', fontSize: '0.875rem', color: 'text.primary' },
    compact: { dateFormat: 'dd MMM', fontSize: '0.8rem', color: 'text.secondary' },
    detailed: { dateFormat: "EEEE, dd 'de' MMMM 'de' yyyy", fontSize: '1rem', color: 'text.primary' }
  };
  const opt = formats[variant] || formats.standard;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography variant="body2" sx={{ fontSize: opt.fontSize, fontWeight: variant === 'detailed' ? 500 : 400, color: opt.color, lineHeight: 1.3 }}>
        {format(safe, opt.dateFormat, { locale: es })}
      </Typography>
      {showDaysRemaining && !isPaid && (
        <Typography variant="caption" sx={{ color: daysRemaining < 0 ? 'error.main' : daysRemaining === 0 ? 'warning.main' : daysRemaining <= 7 ? 'warning.main' : 'success.main', fontWeight: 500, fontSize: '0.7rem', mt: 0.2 }}>
          {daysRemaining < 0 ? `${Math.abs(daysRemaining)} días vencido` : daysRemaining === 0 ? 'Vence hoy' : `${daysRemaining} días restantes`}
        </Typography>
      )}
    </Box>
  );
};

// Encabezado tabla (reintroducido) - ✅ Corregido para coincidir con contenido
const TableHeaderDS3 = ({ columns = ['Estado', 'Concepto', 'Empresa', 'Monto', 'Creado', 'Comentarios', 'Acciones'] }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '0.8fr 1.8fr 1.3fr 1fr 0.9fr 1.5fr 0.5fr', // ✅ Reducción de ACCIONES
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
      {columns.map(col => (
        <Box 
          key={col}
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
            {col.toUpperCase()}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Amount display
const AmountDisplayDS3 = ({ amount, variant = 'standard', showAnimation = false, theme }) => {
  const darkColors = getGlobalDarkModeColors(theme);
  if (amount === undefined || amount === null) return <Typography color={darkColors.textSecondary}>Monto no disponible</Typography>;
  const formatAmount = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  const styles = {
    standard: { fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' },
    large: { fontSize: '1.125rem', fontWeight: 700, color: 'text.primary' },
    compact: { fontSize: '0.8rem', fontWeight: 500, color: 'text.secondary' }
  };
  const style = styles[variant] || styles.standard;
  return (
    <motion.div initial={showAnimation ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      <Typography variant="body2" sx={{ ...style, fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: variant === 'large' ? '-0.02em' : 0, lineHeight: 1.2 }}>
        {showAnimation ? <CountingNumber end={amount} /> : formatAmount(amount)}
      </Typography>
    </motion.div>
  );
};

const CountingNumber = ({ end, duration = 1000, prefix = '$' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime; let af;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) af = requestAnimationFrame(animate);
    };
    af = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(af);
  }, [end, duration]);
  return <span>{prefix}{new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(count)}</span>;
};

// Placeholder (previously returned null)
const TimeProgress = () => null;

// ================= Main Component (restored wrapper) =================
const CommitmentsList = ({
  companyFilter,
  statusFilter,
  conceptFilter,
  beneficiaryFilter,
  searchTerm,
  dateRangeFilter,
  customStartDate,
  customEndDate,
  yearFilter = 'all',
  monthFilter = { month: 'all', year: 'all' },
  viewMode = 'cards',
  onCommitmentsChange,
  shouldLoadData = true,
  showEmptyState = false
}) => {

  // Si no debemos cargar datos (filtros no aplicados), limpiar visualmente
  useEffect(() => {
    if (!shouldLoadData) {
      setCommitments([]);
      setAllCommitments && setAllCommitments([]); // defensivo si refactor
      setTotalCommitments(0);
    }
  }, [shouldLoadData]);
  // Context & hooks
  const { currentUser, userProfile } = useAuth();
  const { logActivity } = useActivityLogs();
  const isAdmin = useMemo(() => isAdminUser(currentUser, userProfile), [currentUser, userProfile]);
  const { addNotification, addAlert } = useNotifications();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const theme = useTheme();
  // Colores reutilizables (modo oscuro / claro) para el cuerpo principal
  const darkColors = getGlobalDarkModeColors(theme);

  // Dashboard config (defensive fallbacks)
  const dashboardConfig = settings?.dashboard || { layout: { viewMode: viewMode, cardSize: 'medium', density: 'normal', columns: 3 }, behavior: { animationsEnabled: true, showTooltips: true } };
  const effectiveViewMode = viewMode || dashboardConfig.layout.viewMode;
  const cardSize = dashboardConfig.layout.cardSize;
  const density = dashboardConfig.layout.density;
  const columns = dashboardConfig.layout.columns;
  const animationsEnabled = dashboardConfig.behavior.animationsEnabled;
  const showTooltips = dashboardConfig.behavior.showTooltips;

  // ================= Pagination & View Config =================
  // Constant restored (was referenced before declaration after refactor)
  const ITEMS_PER_PAGE = 9; // Fixed as per original design
  const QUERY_LIMIT = 500; // Server-side safety cap for onSnapshot listener

  // Helper functions that depend on density/cardSize now placed AFTER those vars
  const getSpacingByDensity = () => {
    switch (density) {
      case 'compact': return { grid: 1.5, card: 1, padding: 1.5 };
      case 'spacious': return { grid: 4, card: 3, padding: 3 };
      default: return { grid: 3, card: 2, padding: 2 };
    }
  };

  const getCardSizeStyles = () => {
    const base = {
      small: { minHeight: 160, padding: 1.5, fontSize: '0.85rem', titleSize: '0.95rem', subtitleSize: '0.75rem', captionSize: '0.65rem', amountSize: '1rem' },
      medium: { minHeight: 190, padding: 2, fontSize: '0.9rem', titleSize: '1rem', subtitleSize: '0.8rem', captionSize: '0.7rem', amountSize: '1.15rem' },
      large: { minHeight: 240, padding: 3, fontSize: '0.95rem', titleSize: '1.1rem', subtitleSize: '0.85rem', captionSize: '0.75rem', amountSize: '1.3rem' }
    };
    return base[cardSize] || base.medium;
  };

  const getColumnsConfig = () => ({
    xs: Math.min(columns, 1),
    sm: Math.min(columns, 2),
    md: Math.min(columns, 3),
    lg: Math.min(columns, 4),
    xl: Math.min(columns, 6)
  });

  const spacing = getSpacingByDensity();
  const cardStyles = getCardSizeStyles();
  const responsiveColumns = getColumnsConfig();

  // ================= Transparent Chip Styles Function =================
  const getTransparentChipStyles = (color) => ({
    backgroundColor: alpha(theme.palette[color]?.main || color, 0.1),
    borderColor: alpha(theme.palette[color]?.main || color, 0.3),
    color: theme.palette[color]?.main || color,
    '& .MuiChip-icon': {
      color: theme.palette[color]?.main || color
    }
  });

  // ✅ Usar useMemo para evitar recrear paginationConfig en cada render
  const paginationConfig = useMemo(() => {
    switch (effectiveViewMode) {
      case 'table': return { itemsPerPage: ITEMS_PER_PAGE, label: 'filas por página' };
      case 'list': return { itemsPerPage: ITEMS_PER_PAGE, label: 'elementos por página' };
      case 'cards':
      default: return { itemsPerPage: ITEMS_PER_PAGE, label: 'tarjetas por página' };
    }
  }, [effectiveViewMode]);

  // ================= Filter values (no debounce restoration) =================
  // Refactor: original file applied debouncing; for now we map directly to props to restore functionality.
  const debouncedSearchTerm = searchTerm;
  const debouncedCompanyFilter = companyFilter;
  const debouncedStatusFilter = statusFilter;
  const debouncedConceptFilter = conceptFilter;
  const debouncedBeneficiaryFilter = beneficiaryFilter;
  const debouncedDateRangeFilter = dateRangeFilter;
  const debouncedCustomStartDate = customStartDate;
  const debouncedCustomEndDate = customEndDate;
  const debouncedYearFilter = yearFilter;
  const debouncedMonthFilter = monthFilter;

  // (Duplicated helper block removed after refactor consolidation)

  // ================= Local State (reintroducido tras refactor) =================
  // Paginación y datos
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [commitments, setCommitments] = useState([]); // Compromisos mostrados (paginados)
  const [totalCommitments, setTotalCommitments] = useState(0); // Total global filtrado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isResultsTruncated, setIsResultsTruncated] = useState(false);

  // Estados de diálogos / selección
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [viewerSize, setViewerSize] = useState('normal');
  const [autoOpenPdfViewer, setAutoOpenPdfViewer] = useState(false);
  
  // Estados para menú contextual de acciones
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [currentCommitment, setCurrentCommitment] = useState(null);
  
  // Estados adicionales para modal de confirmación y datos de empresa
  const [companyData, setCompanyData] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [documentDimensions, setDocumentDimensions] = useState({ width: 'xl', height: '90vh' });
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingCommitment, setIsDeletingCommitment] = useState(false);

  // Eliminados en esta versión: visor de comprobantes de pago y estados relacionados

  // Función helper para verificar si un compromiso tiene pago válido
  const hasValidPayment = (commitment) => {
    return commitment.paid || commitment.isPaid;
  };

  // SISTEMA DE DATOS EN TIEMPO REAL - Solo para filtros, NO para paginación
  const [allCommitments, setAllCommitments] = useState([]); // Todos los compromisos después de filtros
  const [filteredTotal, setFilteredTotal] = useState(0); // Total después de filtros

  useEffect(() => {
    // ✅ Solo cargar datos si shouldLoadData es true
    if (!currentUser || !shouldLoadData) return;
    
    
    let q = query(collection(db, 'commitments'), orderBy('createdAt', 'desc'));

    // Nota: el filtro por empresa se aplicará localmente para soportar selección múltiple.
    
    // ✅ Aplicar filtro de rango de fechas (Este mes, Último mes, etc.)
      if (debouncedDateRangeFilter && debouncedDateRangeFilter !== 'all') {
      const { startDate, endDate } = getDateRangeFromFilter(
        debouncedDateRangeFilter,
        debouncedCustomStartDate,
        debouncedCustomEndDate
      );

      if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
        if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
          q = query(
            collection(db, 'commitments'),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(
            collection(db, 'commitments'),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            orderBy('createdAt', 'desc')
          );
        }
      }
    } else if (debouncedYearFilter && debouncedYearFilter !== 'all') {
      let startDate, endDate;
      
      if (debouncedMonthFilter && debouncedMonthFilter.month !== 'all' && debouncedMonthFilter.year !== 'all') {
        // Filtro por mes y año específicos
        startDate = createSafeDate(debouncedMonthFilter.year, debouncedMonthFilter.month, 1);
        endDate = createSafeDate(debouncedMonthFilter.year, parseInt(debouncedMonthFilter.month) + 1, 0, 23, 59, 59);
      } else {
        // Solo filtro por año
        startDate = createSafeDate(debouncedYearFilter, 0, 1);
        endDate = createSafeDate(debouncedYearFilter, 11, 31);
      }
      
      // Solo aplicar filtros si las fechas son válidas
      if (startDate && endDate) {
        if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
          q = query(collection(db, 'commitments'), 
            where('companyId', '==', debouncedCompanyFilter),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(collection(db, 'commitments'), 
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            orderBy('createdAt', 'desc')
          );
        }
      }
  } else if (debouncedMonthFilter && debouncedMonthFilter.month !== 'all' && debouncedMonthFilter.year !== 'all') {
      // Solo filtro por mes/año sin filtro de año heredado
      const startDate = createSafeDate(debouncedMonthFilter.year, debouncedMonthFilter.month, 1);
      const endDate = createSafeDate(debouncedMonthFilter.year, parseInt(debouncedMonthFilter.month) + 1, 0, 23, 59, 59);
      
      // Solo proceder si las fechas son válidas
      if (startDate && endDate) {
        if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
          q = query(collection(db, 'commitments'), 
            where('companyId', '==', debouncedCompanyFilter),
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(collection(db, 'commitments'), 
            where('createdAt', '>=', startDate),
            where('createdAt', '<=', endDate),
            orderBy('createdAt', 'desc')
          );
        }
      }
    }

    // Server-side safety cap: limit maximum documents loaded
    q = query(q, limit(QUERY_LIMIT));

    // Configurar listener en tiempo real
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      
      if (snapshot.empty) {
        setAllCommitments([]);
        setFilteredTotal(0);
        setIsResultsTruncated(false);
        setLoading(false);
        return;
      }

      const commitmentsData = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        commitmentsData.push({
          id: doc.id,
          ...data,
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });

      // Detect if results were truncated by the safety cap
      setIsResultsTruncated(commitmentsData.length >= QUERY_LIMIT);

      // Aplicar filtros locales
      let filteredCommitments = commitmentsData;

      // Filtro por empresa (múltiple, aplicado localmente)
      if (Array.isArray(debouncedCompanyFilter) && debouncedCompanyFilter.length > 0) {
        filteredCommitments = filteredCommitments.filter(commitment =>
          commitment.companyId && debouncedCompanyFilter.includes(commitment.companyId)
        );
      }

      // Filtro por término de búsqueda
      if (debouncedSearchTerm) {
        filteredCommitments = filteredCommitments.filter(
          commitment =>
            (commitment.concept && commitment.concept.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.description && commitment.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.companyName && commitment.companyName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.company && commitment.company.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.beneficiary && commitment.beneficiary.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.invoiceNumber && commitment.invoiceNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.observations && commitment.observations.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.notes && commitment.notes.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        );
      }

      // Filtro por concepto (múltiple)
      if (Array.isArray(debouncedConceptFilter) && debouncedConceptFilter.length > 0) {
        filteredCommitments = filteredCommitments.filter(commitment =>
          commitment.concept && debouncedConceptFilter.some(c =>
            commitment.concept.toLowerCase() === c.toLowerCase()
          )
        );
      }

      // Filtro por beneficiario (múltiple)
      if (Array.isArray(debouncedBeneficiaryFilter) && debouncedBeneficiaryFilter.length > 0) {
        filteredCommitments = filteredCommitments.filter(commitment =>
          commitment.beneficiary && debouncedBeneficiaryFilter.some(b =>
            commitment.beneficiary.toLowerCase() === b.toLowerCase()
          )
        );
      }

      // Filtro por estado - Ahora con función asíncrona
      if (debouncedStatusFilter && debouncedStatusFilter !== 'all') {
        try {
          // Usar la nueva lógica de filtrado con estados de pago reales
          filteredCommitments = await filterCommitmentsByStatus(filteredCommitments, debouncedStatusFilter);
        } catch (error) {
          console.error('Error al filtrar por estado:', error);
          // En caso de error, mantener todos los compromisos sin filtrar por estado
        }
      }


      // Guardar todos los compromisos filtrados
      setAllCommitments(filteredCommitments);
      setFilteredTotal(filteredCommitments.length);
      setLoading(false);
      
    }, (error) => {
      console.error('❌ [REAL TIME] Error en listener:', error);
      setError('Error al cargar los compromisos en tiempo real');
      setLoading(false);
    });

    // Limpiar caché cuando se conecte el listener
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_COMMITMENTS_CACHE' });
    }

    // Cleanup del listener
    return () => {
      unsubscribe();
    };
    
  }, [currentUser, debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedDateRangeFilter, debouncedCustomStartDate, debouncedCustomEndDate, debouncedYearFilter, debouncedMonthFilter, shouldLoadData]); // ✅ Agregado shouldLoadData + debouncedYearFilter + debouncedMonthFilter para refrescar al limpiar/cambiar filtros

  // EFECTO SEPARADO SOLO PARA PAGINACIÓN - No reinicia listeners
  useEffect(() => {
    if (allCommitments.length === 0 && !loading) return;
    
    
    // Aplicar paginación local a los datos ya filtrados
    const startIndex = (currentPage - 1) * paginationConfig.itemsPerPage;
    const endIndex = startIndex + paginationConfig.itemsPerPage;
    const paginatedCommitments = allCommitments.slice(startIndex, endIndex);


    setCommitments(paginatedCommitments);
    setTotalCommitments(filteredTotal);
    
  }, [allCommitments, currentPage, filteredTotal, paginationConfig]); // ✅ Use whole paginationConfig object
  
  // 🔔 Hook de alertas de compromisos - Genera alertas automáticas basadas en vencimientos
  useCommitmentAlerts(allCommitments);
  
  // ✅ Efecto separado para notificar cambios al padre
  useEffect(() => {
    if (onCommitmentsChange && commitments.length > 0) {
      onCommitmentsChange(commitments);
    }
  }, [commitments, onCommitmentsChange]);

  // Reset página cuando cambien SOLO los filtros (no la página) - CON DEBOUNCE
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 100); // Pequeño debounce para evitar resets múltiples

    return () => clearTimeout(resetTimer);
  }, [debouncedDateRangeFilter, debouncedCustomStartDate, debouncedCustomEndDate, debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm]); // NO incluir currentPage aquí

  // 🔥 FUNCIÓN DE ESTADO MEJORADA QUE CONSIDERA PAGOS PARCIALES
  const getStatusInfo = (commitment) => {
    // Usar la función mejorada que incluye lógica básica de fallback
    return getEnhancedStatusInfo(commitment, theme);
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para obtener datos de la empresa
  const fetchCompanyData = async (companyId) => {
    if (!companyId) return null;
    
    setLoadingCompany(true);
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        const companyInfo = { id: companyDoc.id, ...companyDoc.data() };
        setCompanyData(companyInfo);
        return companyInfo;
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoadingCompany(false);
    }
    return null;
  };

  const handleViewCommitment = async (commitment) => {
    setSelectedCommitment(commitment);
    setViewDialogOpen(true);
    
    // Obtener datos de la empresa si existe companyId
    if (commitment.companyId) {
      await fetchCompanyData(commitment.companyId);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedCommitment(null);
    setCompanyData(null);
  };

  // Manejar apertura del formulario de edición desde la tarjeta
  const handleEditFromCard = (commitment) => {
    setSelectedCommitment(commitment);
    setEditDialogOpen(true);
  };

  // Manejar apertura del formulario de edición desde el popup de detalles
  const handleEditFromPopup = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCommitment(null);
  };

  // Funciones para el menú contextual de acciones
  const handleActionMenuOpen = (event, commitment) => {
    setActionMenuAnchor(event.currentTarget);
    setCurrentCommitment(commitment);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // ✅ TODAS LAS FUNCIONES DEL VISOR DE COMPROBANTES ELIMINADAS COMPLETAMENTE
  // - handleViewReceipt (completamente eliminada)
  // - handleCloseReceiptViewer (completamente eliminada)

  // ✅ FUNCIONES PARA EL VISOR PDF DE FACTURAS
  const extractInvoiceUrl = (commitment) => {
    // Prioridad de búsqueda
    // 1. Campo invoices array (formato actual Firebase)
    if (commitment.invoices && Array.isArray(commitment.invoices) && commitment.invoices.length > 0) {
      const firstInvoice = commitment.invoices[0];
      if (firstInvoice?.url) {
        return firstInvoice.url;
      }
      if (firstInvoice?.downloadURL) {
        return firstInvoice.downloadURL;
      }
    }
    
    // 2. Campo invoice.url (formato anterior)
    if (commitment.invoice?.url) {
      return commitment.invoice.url;
    }
    
    // 3. Campo invoiceUrl directo (formato legacy)
    if (commitment.invoiceUrl) {
      return commitment.invoiceUrl;
    }
    
    // 4. Buscar en attachments por tipo invoice
    if (commitment.attachments?.length > 0) {
      const invoiceAttachment = commitment.attachments.find(att => 
        att.type === 'invoice' || 
        att.category === 'invoice' ||
        (att.name && att.name.toLowerCase().includes('factura'))
      );
      if (invoiceAttachment?.url) {
        return invoiceAttachment.url;
      }
    }
    
    return null;
  };

  const getDocumentInfo = async (commitment, url) => {
    // Buscar información del documento en attachments primero
    let docInfo = null;
    
    if (commitment.attachments?.length > 0) {
      const attachment = commitment.attachments.find(att => 
        att.url === url || 
        att.type === 'invoice' || 
        att.category === 'invoice' ||
        (att.name && att.name.toLowerCase().includes('factura'))
      );
      
      if (attachment) {
        docInfo = {
          name: attachment.name || 'Documento sin nombre',
          size: attachment.size || 0,
          type: attachment.contentType || (url.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image'),
          uploadedAt: attachment.uploadedAt || attachment.createdAt || null,
          path: attachment.path || 'Storage/compromisos/',
          url: url
        };
      }
    }
    
    // Si no se encuentra en attachments, intentar obtener metadatos reales de Firebase Storage
    if (!docInfo) {
      try {
        // Extraer la ruta del archivo desde la URL de Firebase Storage
        let filePath = null;
        
        // Si es una URL de Firebase Storage, extraer la ruta
        if (url.includes('firebase') && url.includes('o/')) {
          const encodedPath = url.split('o/')[1].split('?')[0];
          filePath = decodeURIComponent(encodedPath);
        } else {
          // Fallback: intentar extraer nombre del archivo de la URL
          const urlParts = url.split('/');
          filePath = urlParts[urlParts.length - 1].split('?')[0];
        }
        
        if (filePath) {
          // Crear referencia al archivo en Firebase Storage
          const fileRef = ref(storage, filePath);
          
          try {
            // Obtener metadatos reales del archivo
            const metadata = await getMetadata(fileRef);
            
            // Extraer nombre limpio del archivo
            let fileName = metadata.name || filePath.split('/').pop() || 'Documento';
            
            // Limpiar nombre muy largo
            if (fileName.length > 50) {
              const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
              const baseName = fileName.substring(0, 40);
              fileName = baseName + '...' + extension;
            }
            
            docInfo = {
              name: fileName,
              size: parseInt(metadata.size) || 0,
              type: metadata.contentType || 'application/octet-stream',
              uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : null,
              updatedAt: metadata.updated ? new Date(metadata.updated) : null,
              path: filePath,
              url: url,
              bucket: metadata.bucket,
              fullPath: metadata.fullPath
            };
            
          } catch (metadataError) {
            // Fallback a información extraída de la URL
            docInfo = await extractInfoFromUrl(url, commitment);
          }
        } else {
          // Fallback a información extraída de la URL
          docInfo = await extractInfoFromUrl(url, commitment);
        }
        
      } catch (error) {
        // Fallback a información extraída de la URL
        docInfo = await extractInfoFromUrl(url, commitment);
      }
    }
    
    return docInfo;
  };

  // Función auxiliar para extraer información de la URL cuando no se pueden obtener metadatos
  const extractInfoFromUrl = async (url, commitment) => {
    let fileName = 'Comprobante';
    let estimatedDate = null;
    
    try {
      // Obtener la parte después de la última '/'
      const urlParts = url.split('/');
      let rawFileName = urlParts[urlParts.length - 1];
      
      // Si contiene parámetros, extraer solo el nombre del archivo
      if (rawFileName.includes('?')) {
        rawFileName = rawFileName.split('?')[0];
      }
      
      // Decodificar URL encoding
      rawFileName = decodeURIComponent(rawFileName);
      
      // Si tiene extensión reconocible, usar el nombre
      if (rawFileName.includes('.pdf') || rawFileName.includes('.jpg') || 
          rawFileName.includes('.jpeg') || rawFileName.includes('.png')) {
        fileName = rawFileName;
        
        // Intentar extraer timestamp del nombre del archivo
        const timestampMatch = fileName.match(/(\d{13})/); // 13 dígitos = timestamp en ms
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1]);
          if (timestamp > 1000000000000 && timestamp < Date.now()) { // Validar timestamp
            estimatedDate = new Date(timestamp);
          }
        }
        
        // También intentar timestamp de 10 dígitos (segundos)
        if (!estimatedDate) {
          const timestampMatch10 = fileName.match(/(\d{10})/);
          if (timestampMatch10) {
            const timestamp = parseInt(timestampMatch10[1]) * 1000;
            if (timestamp > 1000000000000 && timestamp < Date.now()) {
              estimatedDate = new Date(timestamp);
            }
          }
        }
      } else {
        // Crear nombre descriptivo basado en el tipo
        const isPdf = url.toLowerCase().includes('.pdf');
        fileName = isPdf ? 'Comprobante.pdf' : 'Comprobante.jpg';
      }
      
      // Limpiar nombre muy largo
      if (fileName.length > 50) {
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        const baseName = fileName.substring(0, 40);
        fileName = baseName + '...' + extension;
      }
      
      // Intentar obtener información del commitment para fecha
      if (!estimatedDate && commitment.createdAt) {
        estimatedDate = commitment.createdAt;
      } else if (!estimatedDate && commitment.fecha) {
        estimatedDate = commitment.fecha;
      } else if (!estimatedDate && commitment.updatedAt) {
        estimatedDate = commitment.updatedAt;
      }
      
    } catch (error) {
      const isPdf = url.toLowerCase().includes('.pdf');
      fileName = isPdf ? 'Comprobante.pdf' : 'Comprobante.jpg';
    }
    
    const isPdf = url.toLowerCase().includes('.pdf');
    
    // Estimación de tamaño basada en tipo de archivo
    let estimatedSize = 0;
    if (isPdf) {
      estimatedSize = Math.floor(Math.random() * (5000000 - 500000) + 500000);
    } else {
      estimatedSize = Math.floor(Math.random() * (2000000 - 100000) + 100000);
    }
    
    return {
      name: fileName,
      size: estimatedSize,
      type: isPdf ? 'application/pdf' : 'image/jpeg',
      uploadedAt: estimatedDate,
      path: 'Firebase Storage',
      url: url,
      isEstimated: true
    };
  };

  const getOptimalDimensions = (docInfo) => {
    if (!docInfo) return { width: 'xl', height: '90vh' };
    
    const isPdf = docInfo.type === 'PDF';
    
    if (isPdf) {
      // PDFs se muestran mejor en ventana grande
      return { width: 'xl', height: '90vh' };
    } else {
      // Imágenes pueden usar menos espacio inicialmente
      return { width: 'lg', height: '80vh' };
    }
  };

  const handleOpenPdfViewer = async (commitment) => {
    const url = extractInvoiceUrl(commitment);
    if (url) {
      // Obtener información del documento (ahora async)
      const docInfo = await getDocumentInfo(commitment, url);
      const dimensions = getOptimalDimensions(docInfo);
      
      setInvoiceUrl(url);
      setDocumentInfo(docInfo);
      setDocumentDimensions(dimensions);
      setAutoOpenPdfViewer(false);
      setPdfViewerOpen(true);
      setViewerSize('normal');
    }
  };

  // Función para abrir PDF directamente desde menú de acciones
  const handleOpenPdfDirect = async (commitment) => {
    const url = extractInvoiceUrl(commitment);
    if (url) {
      const docInfo = await getDocumentInfo(commitment, url);
      const dimensions = getOptimalDimensions(docInfo);
      
      setSelectedCommitment(commitment);
      setInvoiceUrl(url);
      setDocumentInfo(docInfo);
      setDocumentDimensions(dimensions);
      setAutoOpenPdfViewer(true);
      setViewDialogOpen(true);
      setPdfViewerOpen(true);
      setViewerSize('normal');
    }
  };

  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
    setInvoiceUrl(null);
    setDocumentInfo(null);
    setDocumentDimensions({ width: 'xl', height: '90vh' });
    setDocumentInfoOpen(false);
    setViewerSize('normal');
    setAutoOpenPdfViewer(false);
    
    // Si se abrió automáticamente, cerrar también el modal de detalle
    if (autoOpenPdfViewer) {
      setViewDialogOpen(false);
      setSelectedCommitment(null);
    }
  };

  const handleToggleDocumentInfo = () => {
    const willOpen = !documentInfoOpen;
    setDocumentInfoOpen(willOpen);
    
    // Ajustar dimensiones del modal según el estado del panel
    if (willOpen) {
      // Cuando se abre el panel, aumentar significativamente la altura
      setDocumentDimensions(prev => ({
        ...prev,
        height: 'calc(100vh - 50px)' // Casi pantalla completa
      }));
    } else {
      // Cuando se cierra el panel, volver a la altura normal
      setDocumentDimensions(prev => ({
        ...prev,
        height: '90vh'
      }));
    }
  };

  const toggleViewerSize = () => {
    setViewerSize(prev => prev === 'normal' ? 'fullscreen' : 'normal');
  };

  const formatFileSize = (bytes, isEstimated = false) => {
    if (!bytes || bytes === 0) {
      return 'Tamaño no disponible';
    }
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
    
    if (isEstimated) {
      return `≈ ${size} ${sizes[i]}`;
    }
    
    return `${size} ${sizes[i]}`;
  };

  // Función para formatear el tipo de documento
  const formatDocumentType = (type) => {
    if (!type) return 'Documento';
    
    // Si es un tipo MIME, convertir a formato amigable
    const mimeToFriendly = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG', 
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WEBP',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/vnd.ms-excel': 'Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'text/plain': 'Texto',
      'text/csv': 'CSV'
    };
    
    // Si es un tipo MIME conocido, usar la versión amigable
    if (mimeToFriendly[type]) {
      return mimeToFriendly[type];
    }
    
    // Si ya es un tipo simple (PDF, Imagen, etc.), devolverlo tal como está
    if (type.length <= 10 && !type.includes('/')) {
      return type;
    }
    
    // Para tipos MIME no reconocidos, extraer la parte después de '/'
    if (type.includes('/')) {
      const parts = type.split('/');
      const subtype = parts[1];
      return subtype.toUpperCase();
    }
    
    return type;
  };

  const handleCommitmentSaved = async () => {
    // Cerrar el modal de edición
    setEditDialogOpen(false);
    setSelectedCommitment(null);
    
    // onSnapshot se encarga de refrescar los datos automáticamente
    addNotification({
      type: 'success',
      title: '¡Compromiso actualizado!',
      message: 'Los cambios se han guardado correctamente',
      icon: '💾'
    });
  };

  // El componente CommitmentEditForm manejará el cierre
  // Los datos se actualizarán automáticamente por el listener en tiempo real

  // Funciones de manejo de paginación spectacular - SIMPLIFICADO SIN RECARGA
  const handlePageChange = async (newPage) => {
    if (newPage !== currentPage && newPage >= 1) {
      setCurrentPage(newPage);
      // Ya no necesitamos recargar datos, el useEffect de paginación se encarga
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalCommitments / paginationConfig.itemsPerPage);
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Función para salto directo a página
  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage, 10);
    const totalPages = Math.ceil(totalCommitments / paginationConfig.itemsPerPage);
    
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      handlePageChange(pageNumber);
      setJumpToPage('');
    }
  };

  const handleJumpToPageKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleFirstPage = () => {
    if (currentPage > 1) {
      handlePageChange(1);
    }
  };

  const handleLastPage = () => {
    const totalPages = Math.ceil(totalCommitments / paginationConfig.itemsPerPage);
    if (currentPage < totalPages) {
      handlePageChange(totalPages);
    }
  };

  // Manejar eliminación de compromiso - Abrir diálogo de confirmación
  const handleDeleteCommitment = (commitment) => {
    setCommitmentToDelete(commitment);
    setDeleteDialogOpen(true);
  };

  // 🚀 FUNCIÓN MEJORADA: confirmDelete con debugging avanzado
  const confirmDelete = async () => {
    if (!commitmentToDelete) return;

    // Evitar dobles clicks / doble ejecución
    if (isDeletingCommitment) return;

    // ✅ VALIDACIÓN CRÍTICA: Verificar que el compromiso tenga ID
    if (!commitmentToDelete.id) {
      console.error('❌ ERROR CRÍTICO: Compromiso sin ID', commitmentToDelete);
      addNotification({
        type: 'error',
        title: '❌ Error al eliminar',
        message: 'El compromiso no tiene un ID válido. No se puede eliminar.',
        icon: '⚠️'
      });
      setDeleteDialogOpen(false);
      setCommitmentToDelete(null);
      return;
    }

    setIsDeletingCommitment(true);

    console.group(`🗑️ ELIMINANDO COMPROMISO: ${commitmentToDelete.concept || commitmentToDelete.description || commitmentToDelete.id}`);
    
    try {
      // 🔒 Auditoría: registrar intento de eliminación ANTES de borrar
      try {
        await logActivity('delete_commitment', 'commitment', commitmentToDelete.id, {
          phase: 'before_delete',
          concept: commitmentToDelete.concept || commitmentToDelete.description || null,
          companyId: commitmentToDelete.companyId || null,
          companyName: commitmentToDelete.companyName || null,
          beneficiary: commitmentToDelete.beneficiary || null,
          dueDate: commitmentToDelete.dueDate || null,
          status: commitmentToDelete.status || null,
          totalAmount: commitmentToDelete.totalAmount || null,
          periodicity: commitmentToDelete.periodicity || null
        });
      } catch {
        // No bloquear el borrado si el log falla
      }

      // 1. Análisis previo de archivos
      const filesToDelete = [];
      
      //   id: commitmentToDelete.id,
      //   receiptUrl: commitmentToDelete.receiptUrl ? '✅ Presente' : '❌ No presente',
      //   receiptUrls: commitmentToDelete.receiptUrls ? `✅ Array con ${commitmentToDelete.receiptUrls.length} elementos` : '❌ No presente',
      //   attachments: commitmentToDelete.attachments ? `✅ Array con ${commitmentToDelete.attachments.length} elementos` : '❌ No presente'
      // });

      // Función avanzada para debug y extracción de paths
      const debugAndExtractPath = (url, type = 'archivo') => {
        console.group(`🔍 Analizando ${type}`);
        
        if (!url) {
          console.groupEnd();
          return null;
        }
        
        try {
          const urlObj = new URL(url);
          
          // Verificar si es Firebase Storage
          const isFirebaseStorage = url.includes('firebase') && (url.includes('googleapis.com') || url.includes('firebasestorage'));
          
          if (!isFirebaseStorage) {
            console.groupEnd();
            return null;
          }
          
          let extractedPath = null;
          
          // Método 1: URLs con token (formato /o/path?alt=media)
          if (url.includes('/o/') && url.includes('?alt=')) {
            const pathMatch = url.match(/\/o\/(.+?)\?/);
            if (pathMatch && pathMatch[1]) {
              extractedPath = decodeURIComponent(pathMatch[1]);
              console.groupEnd();
              return extractedPath;
            }
          }
          
          // Método 2: URLs directas
          if (url.includes('firebasestorage.googleapis.com')) {
            const pathParts = urlObj.pathname.split('/');
            
            if (pathParts.length > 4) {
              // Buscar patrón /v0/b/bucket/o/path
              const bucketIndex = pathParts.findIndex(part => part === 'b');
              const oIndex = pathParts.findIndex(part => part === 'o');
              
              if (bucketIndex !== -1 && oIndex !== -1 && oIndex > bucketIndex) {
                extractedPath = pathParts.slice(oIndex + 1).join('/');
                if (extractedPath) {
                  extractedPath = decodeURIComponent(extractedPath);
                  console.groupEnd();
                  return extractedPath;
                }
              }
            }
          }
          
          // Método 3: Patrones comunes
          const patterns = [
            /receipts\/[^?#]+/,
            /attachments\/[^?#]+/,
            /payments\/[^?#]+/,
            /commitments\/[^?#]+/,
            /files\/[^?#]+/
          ];
          
          for (let i = 0; i < patterns.length; i++) {
            const match = url.match(patterns[i]);
            if (match) {
              extractedPath = match[0];
              console.groupEnd();
              return extractedPath;
            }
          }
          
          console.groupEnd();
          return null;
          
        } catch (error) {
          console.error('❌ Error parseando URL:', error);
          console.groupEnd();
          return null;
        }
      };

      // 2. Procesar receiptUrl (formato singular)
      if (commitmentToDelete.receiptUrl) {
        const path = debugAndExtractPath(commitmentToDelete.receiptUrl, 'receiptUrl');
        if (path) {
          filesToDelete.push({ 
            url: commitmentToDelete.receiptUrl, 
            type: 'receiptUrl', 
            path: path,
            name: 'Comprobante de pago'
          });
        }
      }
      
      // 3. Procesar receiptUrls (formato array)
      if (commitmentToDelete.receiptUrls && Array.isArray(commitmentToDelete.receiptUrls)) {
        commitmentToDelete.receiptUrls.forEach((url, index) => {
          if (url) {
            const path = debugAndExtractPath(url, `receiptUrls[${index}]`);
            if (path) {
              filesToDelete.push({ 
                url, 
                type: `receiptUrls[${index}]`, 
                path: path,
                name: `Comprobante ${index + 1}`
              });
            }
          }
        });
      }
      
      // 4. Procesar attachments (formato array)
      if (commitmentToDelete.attachments && Array.isArray(commitmentToDelete.attachments)) {
        commitmentToDelete.attachments.forEach((attachment, index) => {
          const attachmentUrl = attachment.url || attachment;
          if (attachmentUrl) {
            const path = debugAndExtractPath(attachmentUrl, `attachments[${index}]`);
            if (path) {
              filesToDelete.push({ 
                url: attachmentUrl, 
                type: `attachments[${index}]`, 
                path: path,
                name: attachment.name || `Archivo adjunto ${index + 1}`
              });
            }
          }
        });
      }
      
      filesToDelete.forEach((file, index) => {
      });
      
      // 5. Eliminar cada archivo de Storage con monitoreo detallado
      let deletedFiles = [];
      let failedFiles = [];
      
      for (let i = 0; i < filesToDelete.length; i++) {
        const fileInfo = filesToDelete[i];
        console.group(`🔥 Eliminando archivo ${i + 1}/${filesToDelete.length}: ${fileInfo.name}`);
        
        try {
          
          const fileRef = ref(storage, fileInfo.path);
          
          await deleteObject(fileRef);
          
          deletedFiles.push(fileInfo.name);
          
        } catch (storageError) {
          console.error(`❌ Error eliminando ${fileInfo.name}:`, storageError);
          
          failedFiles.push({
            name: fileInfo.name,
            error: storageError.code || storageError.message
          });
        }
        
        console.groupEnd();
      }

      // 2. Eliminar pagos relacionados con este compromiso
      let deletedPayments = 0;
      let failedPaymentDeletions = 0;
      
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('commitmentId', '==', commitmentToDelete.id)
        );
        
        const paymentsSnapshot = await getDocs(paymentsQuery);
        
        if (paymentsSnapshot.size > 0) {
          // Eliminar cada pago encontrado
          for (const paymentDoc of paymentsSnapshot.docs) {
            try {
              const paymentData = paymentDoc.data();
              
              // Eliminar archivos de Storage del pago si existen
              const paymentFilesToDelete = [];
              
              if (paymentData.receiptUrl) {
                const path = debugAndExtractPath(paymentData.receiptUrl, `Pago-receiptUrl`);
                if (path) {
                  paymentFilesToDelete.push({ 
                    url: paymentData.receiptUrl, 
                    type: 'Pago-receiptUrl', 
                    path: path,
                    name: 'Comprobante de pago'
                  });
                }
              }
              
              if (paymentData.receiptUrls && Array.isArray(paymentData.receiptUrls)) {
                paymentData.receiptUrls.forEach((url, index) => {
                  if (url) {
                    const path = debugAndExtractPath(url, `Pago-receiptUrls[${index}]`);
                    if (path) {
                      paymentFilesToDelete.push({ 
                        url, 
                        type: `Pago-receiptUrls[${index}]`, 
                        path: path,
                        name: `Comprobante pago ${index + 1}`
                      });
                    }
                  }
                });
              }
              
              if (paymentData.attachments && Array.isArray(paymentData.attachments)) {
                paymentData.attachments.forEach((attachment, index) => {
                  const attachmentUrl = attachment.url || attachment;
                  if (attachmentUrl) {
                    const path = debugAndExtractPath(attachmentUrl, `Pago-attachments[${index}]`);
                    if (path) {
                      paymentFilesToDelete.push({ 
                        url: attachmentUrl, 
                        type: `Pago-attachments[${index}]`, 
                        path: path,
                        name: attachment.name || `Archivo pago ${index + 1}`
                      });
                    }
                  }
                });
              }
              
              // Eliminar archivos del pago de Storage
              for (const fileInfo of paymentFilesToDelete) {
                try {
                  const fileRef = ref(storage, fileInfo.path);
                  await deleteObject(fileRef);
                  deletedFiles.push(fileInfo.name);
                } catch (storageError) {
                  console.error(`❌ Error eliminando archivo de pago ${fileInfo.name}:`, storageError);
                  failedFiles.push({
                    name: fileInfo.name,
                    error: storageError.code || storageError.message
                  });
                }
              }
              
              // Eliminar documento de pago
              await deleteDoc(paymentDoc.ref);
              deletedPayments++;
              
            } catch (paymentError) {
              console.error(`❌ Error eliminando pago ${paymentDoc.id}:`, paymentError);
              failedPaymentDeletions++;
            }
          }
        } else {
        }
        
      } catch (paymentsError) {
        console.error('❌ Error consultando pagos relacionados:', paymentsError);
        failedPaymentDeletions++;
      }


      // 3. Verificar si el documento existe antes de eliminar
      const docRef = doc(db, 'commitments', commitmentToDelete.id);
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        
        // Actualizar estado local para remover el compromiso inexistente
        setCommitments(prevCommitments => {
          const filtered = prevCommitments.filter(c => c.id !== commitmentToDelete.id);
          return filtered;
        });
        
        addNotification({
          type: 'warning',
          title: '⚠️ Compromiso ya eliminado',
          message: `El compromiso "${commitmentToDelete.concept || 'Sin concepto'}" ya no existe en la base de datos.`,
          icon: '👻'
        });
        
        setDeleteDialogOpen(false);
        setCommitmentToDelete(null);
        return;
      }
      
      
      // 4. Eliminar el documento de Firestore
      await deleteDoc(docRef);

      // 🔒 Auditoría: registrar eliminación confirmada
      try {
        await logActivity('delete_commitment', 'commitment', commitmentToDelete.id, {
          phase: 'after_delete',
          concept: commitmentToDelete.concept || commitmentToDelete.description || null,
          companyId: commitmentToDelete.companyId || null,
          companyName: commitmentToDelete.companyName || null,
          beneficiary: commitmentToDelete.beneficiary || null,
          dueDate: commitmentToDelete.dueDate || null,
          status: commitmentToDelete.status || null,
          totalAmount: commitmentToDelete.totalAmount || null,
          periodicity: commitmentToDelete.periodicity || null,
          deletedFilesCount: deletedFiles.length,
          failedFilesCount: failedFiles.length,
          deletedPaymentsCount: deletedPayments,
          failedPaymentDeletionsCount: failedPaymentDeletions
        });
      } catch {
        // No bloquear el flujo si el log falla
      }
      
      // 4. Actualizar estado local
      setCommitments(prevCommitments => {
        const filtered = prevCommitments.filter(c => c.id !== commitmentToDelete.id);
        return filtered;
      });
      
      // 5. Limpiar caché del Service Worker (opcional)
      // Limpiar caché básico si está disponible
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      // 6. onSnapshot se encarga de refrescar los datos automáticamente
      // Si eliminamos el último elemento de la página, ir a la página anterior
      const newTotal = allCommitments.length - 1;
      const totalPages = Math.ceil(newTotal / paginationConfig.itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
      
      // 10. Mostrar notificación de éxito con detalles mejorados
      const deletedFilesMessage = deletedFiles.length > 0 
        ? ` y ${deletedFiles.length} archivo${deletedFiles.length > 1 ? 's' : ''}`
        : '';
        
      const deletedPaymentsMessage = deletedPayments > 0
        ? ` y ${deletedPayments} pago${deletedPayments > 1 ? 's' : ''} relacionado${deletedPayments > 1 ? 's' : ''}`
        : '';
        
      const failureMessage = (failedFiles.length > 0 || failedPaymentDeletions > 0)
        ? ` (${failedFiles.length + failedPaymentDeletions} elemento${failedFiles.length + failedPaymentDeletions > 1 ? 's' : ''} no se pudo${failedFiles.length + failedPaymentDeletions > 1 ? 'ieron' : ''} eliminar)`
        : '';
      
      
      addNotification({
        type: (deletedFiles.length > 0 || deletedPayments > 0) ? 'success' : 'warning',
        title: (failedFiles.length > 0 || failedPaymentDeletions > 0) ? 'Compromiso eliminado parcialmente' : '¡Compromiso eliminado completamente!',
        message: `Se eliminó "${commitmentToDelete.concept || commitmentToDelete.description || 'Sin concepto'}"${deletedFilesMessage}${deletedPaymentsMessage}${failureMessage}`,
        icon: (failedFiles.length > 0 || failedPaymentDeletions > 0) ? '⚠️' : '🗑️'
      });

      // 11. Cerrar diálogo y limpiar estado
      setDeleteDialogOpen(false);
      setCommitmentToDelete(null);

    } catch (error) {
      console.error('Error al eliminar compromiso:', error);
      
      // Mostrar notificación de error
      addNotification({
        type: 'error',
        title: 'Error al eliminar',
        message: 'No se pudo eliminar el compromiso completamente. Algunos archivos pueden no haberse eliminado.',
        icon: '❌'
      });

      // Cerrar el diálogo incluso si hubo error
      setDeleteDialogOpen(false);
      setCommitmentToDelete(null);
    } finally {
      setIsDeletingCommitment(false);
    }
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCommitmentToDelete(null);
  };

  // 🧹 FUNCIÓN DE EMERGENCIA: Limpiar compromisos huérfanos
  const cleanupOrphanedCommitments = async () => {
    
    try {
      // 1. Buscar compromisos con "Sin empresa"
      
      const orphanQuery = query(
        collection(db, 'commitments'),
        where('companyName', '==', 'Sin empresa')
      );
      
      const orphanSnapshot = await getDocs(orphanQuery);
      
      // 2. Buscar compromisos con companyName vacío
      const emptyCompanyQuery = query(
        collection(db, 'commitments'),
        where('companyName', '==', '')
      );
      
      const emptySnapshot = await getDocs(emptyCompanyQuery);
      
      const totalProblematic = orphanSnapshot.size + emptySnapshot.size;
      
      if (totalProblematic === 0) {
        addNotification({
          type: 'info',
          title: '✅ Base de datos limpia',
          message: 'No se encontraron compromisos huérfanos para limpiar',
          duration: 4000
        });
        return;
      }
      
      // 3. Mostrar confirmación al usuario
      const userConfirmed = window.confirm(
        `Se encontraron ${totalProblematic} compromisos huérfanos:\n\n` +
        `• ${orphanSnapshot.size} compromisos "Sin empresa"\n` +
        `• ${emptySnapshot.size} compromisos con empresa vacía\n\n` +
        `¿Deseas eliminarlos permanentemente?`
      );
      
      if (!userConfirmed) {
        return;
      }
      
      // 4. Procesar eliminaciones
      let deletedCount = 0;
      let errorCount = 0;
      const deletedCommitments = [];
      
      // Procesar compromisos "Sin empresa"
      for (const docSnapshot of orphanSnapshot.docs) {
        try {
          const data = docSnapshot.data();
          
          // Verificar si realmente existe
          const docRef = doc(db, 'commitments', docSnapshot.id);
          const currentDoc = await getDoc(docRef);
          
          if (currentDoc.exists()) {
            await deleteDoc(docRef);
            deletedCount++;
            deletedCommitments.push(`${data.concept} (${data.beneficiary})`);
          } else {
          }
        } catch (error) {
          console.error(`❌ Error eliminando ${docSnapshot.id}:`, error);
          errorCount++;
        }
      }
      
      // Procesar compromisos con empresa vacía
      for (const docSnapshot of emptySnapshot.docs) {
        try {
          const data = docSnapshot.data();
          
          // Verificar si realmente existe
          const docRef = doc(db, 'commitments', docSnapshot.id);
          const currentDoc = await getDoc(docRef);
          
          if (currentDoc.exists()) {
            await deleteDoc(docRef);
            deletedCount++;
            deletedCommitments.push(`${data.concept} (${data.beneficiary})`);
          } else {
          }
        } catch (error) {
          console.error(`❌ Error eliminando ${docSnapshot.id}:`, error);
          errorCount++;
        }
      }
      
      // 5. Actualizar estado local inmediatamente
      setCommitments(prevCommitments => {
        const filtered = prevCommitments.filter(commitment => 
          commitment.companyName && 
          commitment.companyName !== 'Sin empresa' && 
          commitment.companyName.trim() !== ''
        );
        return filtered;
      });
      
      // 6. onSnapshot se encarga de refrescar los datos automáticamente
      setCurrentPage(1);
      
      // 7. Mostrar resultado al usuario
      
      if (deletedCount > 0) {
        addNotification({
          type: 'success',
          title: '🧹 Limpieza completada',
          message: `Se eliminaron ${deletedCount} compromisos huérfanos. ${errorCount > 0 ? `${errorCount} errores.` : ''}`,
          duration: 6000
        });
        
        // Log de auditoría
        await logActivity('bulk_delete_orphaned_commitments', 'commitments', 'cleanup', {
          deletedCount,
          errorCount,
          deletedCommitments: deletedCommitments.slice(0, 10), // Solo los primeros 10 para no saturar
          totalProcessed: totalProblematic
        });
        
      } else {
        addNotification({
          type: 'warning',
          title: '⚠️ Sin cambios',
          message: 'No se eliminó ningún compromiso. Pueden haber sido eliminados previamente.',
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('❌ Error durante la limpieza de emergencia:', error);
      addNotification({
        type: 'error',
        title: '❌ Error en limpieza',
        message: 'Hubo un error durante la limpieza de compromisos huérfanos',
        duration: 5000
      });
    }
  };

  // 🚨 EXPOSER FUNCIÓN GLOBALMENTE PARA DEBUG (solo en desarrollo)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.cleanupOrphanedCommitments = cleanupOrphanedCommitments;
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          textAlign: 'center',
          py: 4,
          px: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Icono compacto */}
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FilterList sx={{ 
                fontSize: 24, 
                color: theme.palette.primary.main,
                opacity: 0.8
              }} />
            </Box>
            
            {/* Texto sobrio */}
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body1" sx={{ 
                fontWeight: 500, 
                color: theme.palette.text.primary,
                mb: 0.5
              }}>
                Aplique filtros para mostrar compromisos
              </Typography>
              
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                opacity: 0.8
              }}>
                Configure los filtros y presione "Aplicar Filtros"
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (commitments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ 
          textAlign: 'center', 
          py: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.8)
          }
        }}>
          <CardContent>
            <AccountBalance sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" color={darkColors.textSecondary} gutterBottom>
              No hay compromisos registrados
            </Typography>
            <Typography variant="body2" color={darkColors.textSecondary}>
              {searchTerm || statusFilter !== 'all' || companyFilter !== 'all'
                ? 'No se encontraron compromisos con los filtros aplicados'
                : 'Comienza agregando tu primer compromiso financiero'
              }
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Box>
      {/* ✅ ESTADO VACÍO CUANDO NO HAY FILTROS APLICADOS */}
      {showEmptyState && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            p: 4,
            backgroundColor: alpha(theme.palette.background.paper, 0.4),
            borderRadius: 3,
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Efecto de fondo */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 30% 40%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%), 
                          radial-gradient(circle at 70% 80%, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />
            
            {/* Icono principal */}
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              position: 'relative',
              zIndex: 1
            }}>
              <FilterList sx={{ 
                fontSize: 60, 
                color: theme.palette.primary.main,
                opacity: 0.7
              }} />
            </Box>
            
            {/* Texto principal */}
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              mb: 2,
              position: 'relative',
              zIndex: 1
            }}>
              Seleccione filtros para mostrar compromisos
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: theme.palette.text.secondary,
              maxWidth: 500,
              lineHeight: 1.6,
              position: 'relative',
              zIndex: 1
            }}>
              Configure los filtros de búsqueda (empresa, estado, año, etc.) y haga clic en 
              <strong> "Aplicar Filtros" </strong> para cargar y visualizar los compromisos.
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* ✅ CONTENIDO PRINCIPAL - SOLO SI HAY FILTROS APLICADOS */}
      {!showEmptyState && (
        <>
      {/* Contenido principal según modo de vista */}
      {viewMode === 'list' ? (
        // Vista Lista Sobria - Diseño Empresarial
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: spacing.grid,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '-20px',
              bottom: '-20px',
              background: `radial-gradient(ellipse at top center, 
                ${alpha(theme.palette.primary.main, 0.04)} 0%, 
                transparent 50%), 
                radial-gradient(ellipse at bottom center, 
                ${alpha(theme.palette.secondary.main, 0.04)} 0%, 
                transparent 50%)`,
              pointerEvents: 'none',
              zIndex: 0,
              borderRadius: 3
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 0
            }
          }}>
          {commitments.map((commitment, index) => {
            const statusInfo = getStatusInfo(commitment);
            const dueDate = commitment.dueDate;
            const today = new Date();
            const daysUntilDue = differenceInDays(dueDate, today);
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
            
            const cardContent = (
              <Card
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: darkColors.cardBackground,
                  border: `1px solid ${darkColors.cardBorder}`,
                  borderRadius: 1,
                  boxShadow: `0 2px 8px ${darkColors.shadowColor}`,
                  transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.98)
                      : alpha(theme.palette.grey[50], 0.9),
                    boxShadow: theme.palette.mode === 'dark'
                      ? `0 4px 16px ${alpha('#000000', 0.5)}`
                      : `0 4px 12px ${alpha(theme.palette.grey[900], 0.12)}`,
                    borderColor: theme.palette.mode === 'dark'
                      ? alpha(statusInfo.color, 0.5)
                      : alpha(statusInfo.color, 0.35)
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 1.5,
                  position: 'relative',
                  zIndex: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box sx={{ mr: 1.5 }}>
                      {/* 🔥 COMPONENTE MEJORADO QUE CONSIDERA PAGOS PARCIALES */}
                      <CommitmentStatusChip 
                        commitment={commitment} 
                        showTooltip={showTooltips}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 0.25, 
                          fontSize: cardStyles.titleSize,
                          color: theme.palette.text.primary,
                          lineHeight: 1.2,
                          transition: 'color 0.3s ease',
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        {commitment.description}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 0.75,
                        p: 1,
                        borderRadius: 1,
                        background: alpha(theme.palette.info.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                        transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&:hover': {
                          background: alpha(theme.palette.info.main, 0.06),
                          borderColor: alpha(theme.palette.info.main, 0.18)
                        }
                      }}>
                        <Business sx={{ 
                          fontSize: 14, 
                          color: theme.palette.info.main,
                          transition: 'color 0.25s ease'
                        }} />
                        <Typography 
                          variant="body2" 
                          color={darkColors.textSecondary} 
                          sx={{ 
                            fontSize: cardStyles.subtitleSize,
                            fontWeight: 500,
                            lineHeight: 1.3
                          }}
                        >
                          {commitment.companyName}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          ml: 1.5,
                          pl: 1.5,
                          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                        }}>
                          <CalendarToday sx={{ 
                            fontSize: 14, 
                            mr: 0.5,
                            color: theme.palette.warning.main
                          }} />
                          <Typography 
                            variant="body2" 
                            color={darkColors.textSecondary}
                            sx={{ 
                              fontSize: cardStyles.subtitleSize,
                              lineHeight: 1.4
                            }}
                          >
                            {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      textAlign: 'right', 
                      mr: 1,
                      p: 1.25,
                      borderRadius: 1,
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.6)
                        : alpha(theme.palette.background.paper, 0.95),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.8)
                          : alpha(theme.palette.grey[50], 0.95),
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        transform: 'translateY(-1px)'
                      }
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: cardStyles.amountSize,
                          color: theme.palette.primary.main,
                          mb: 0.25,
                          lineHeight: 1.1,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                      >
                        <CountingNumber end={commitment.amount} />
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={commitment.paid || commitment.isPaid ? 'success.main' : (isOverdue ? 'error.main' : isDueSoon ? 'warning.main' : 'text.secondary')}
                        sx={{ 
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          lineHeight: 1.1
                        }}
                      >
                        {(commitment.paid || commitment.isPaid)
                          ? '✅ Pagado' 
                          : (daysUntilDue >= 0 ? `${daysUntilDue} días restantes` : `${Math.abs(daysUntilDue)} días vencido`)
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    '& .MuiIconButton-root': {
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.95)
                        : theme.palette.background.paper,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                        background: theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 1)
                          : alpha(theme.palette.grey[50], 0.95)
                      }
                    }
                  }}>
                    {showTooltips ? (
                      <>
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewCommitment(commitment)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {/* ✅ NUEVO: Botón condicional "Marcar Pagado" con tooltip - Solo aparece si NO está pagado */}
                        {!commitment.paid && !commitment.isPaid && (
                          <Tooltip title="Registrar pago" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/payments/new?commitmentId=${commitment.id}`)}
                              sx={{ color: 'success.main' }}
                            >
                              <Payment />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Editar compromiso" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditFromCard(commitment)}
                            sx={{ color: 'warning.main' }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar compromiso" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteCommitment(commitment)}
                            sx={{ color: 'error.main' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewCommitment(commitment)}
                          sx={{ color: 'primary.main' }}
                        >
                          <Visibility />
                        </IconButton>
                        {/* ✅ NUEVO: Botón condicional "Marcar Pagado" sin tooltip - Solo aparece si NO está pagado */}
                        {!commitment.paid && !commitment.isPaid && (
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/payments/new?commitmentId=${commitment.id}`)}
                            sx={{ color: 'success.main' }}
                          >
                            <Payment />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditFromCard(commitment)}
                          sx={{ color: 'warning.main' }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteCommitment(commitment)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>
              </Card>
            );
            
            return animationsEnabled ? (
              <motion.div
                key={`${commitment.id}-${index}`}
                initial={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.95
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1
                }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.08,
                  ease: [0.4, 0, 0.2, 1]
                }}
                whileHover={{ 
                  y: -2,
                  transition: { 
                    duration: 0.25, 
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }
                }}
                style={{
                  position: 'relative'
                }}
              >
                {cardContent}
              </motion.div>
            ) : (
              <Box key={`${commitment.id}-${index}`} sx={{ mb: spacing.grid }}>
                {cardContent}
              </Box>
            );
          })}
          </Box>
        </motion.div>
      ) : viewMode === 'table' ? (
        // Vista Tabla Profesional DS 3.0 - ACTUALIZADA CON TOKENS MEJORADOS
        <Box
          component={motion.div}
          initial={animationsEnabled ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          sx={{
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}
        >
          {/* Header mejorado DS 3.0 */}
          <TableHeaderDS3 />
          
          {/* Cards en formato grid */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            backgroundColor: 'background.paper',
            borderRadius: '0 0 1px 1px',
            borderTop: 'none'
          }}>
            {commitments.map((commitment, index) => {
              const statusInfo = getStatusInfo(commitment);
              const dueDate = commitment.dueDate;
              const today = new Date();
              const daysUntilDue = differenceInDays(dueDate, today);
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
              
              return (
                <motion.div
                  key={`${commitment.id}-${index}`}
                  initial={animationsEnabled ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
                    transition: { duration: 0.25 }
                  }}
                >
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '0.8fr 1.8fr 1.3fr 1fr 0.9fr 1.5fr 0.5fr',
                    gap: 2,
                    p: 2.5,
                    borderBottom: index === commitments.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    },
                    alignItems: 'center'
                  }}>
                    {/* Estado con StatusChipDS3 */}
                    <StatusChipDS3 
                      status={statusInfo}
                      showTooltip={showTooltips}
                      theme={theme}
                    />

                    {/* Descripción */}
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          mb: 0.5,
                          color: 'text.primary',
                          fontSize: '0.9rem'
                        }}
                      >
                        {commitment.concept || commitment.description || 'Sin concepto'}
                      </Typography>
                      {commitment.beneficiary && (
                        <Typography 
                          variant="body2" 
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'primary.main',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            mt: 0.5
                          }}
                        >
                          <Person sx={{ fontSize: 16 }} />
                          Proveedor: {commitment.beneficiary}
                        </Typography>
                      )}
                    </Box>

                    {/* Empresa */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1
                    }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {(commitment.companyName || commitment.company || 'SC').charAt(0)}
                      </Avatar>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary'
                        }}
                      >
                        {commitment.companyName || commitment.company || 'Sin empresa'}
                      </Typography>
                    </Box>

                    {/* Monto con AmountDisplayDS3 (alineado a la izquierda) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                      <AmountDisplayDS3 
                        amount={commitment.amount}
                        animate={animationsEnabled}
                        theme={theme}
                      />
                    </Box>

                    {/* Fecha de Creación (alineada a la izquierda) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <DateDisplayDS3
                        date={commitment.createdAt}
                        variant="standard"
                        showDaysRemaining={false}
                        isOverdue={false}
                        isDueSoon={false}
                        isPaid={commitment.paid || commitment.isPaid}
                        theme={theme}
                      />
                    </Box>

                    {/* Comentarios */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.3
                        }}
                      >
                        {commitment.observations || commitment.notes || '-'}
                      </Typography>
                    </Box>

                    {/* Acciones - Botón único de menú */}
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Tooltip title="Opciones" arrow>
                        <IconButton
                          size="small"
                          onClick={(event) => handleActionMenuOpen(event, commitment)}
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
              );
            })}
          </Box>
        </Box>
      ) : (
        // Vista Cards Spectacular - Design System Premium v2.2
        <Grid container spacing={spacing.grid}>
          {commitments.map((commitment, index) => {
            const statusInfo = getStatusInfo(commitment);
            const dueDate = commitment.dueDate;
            const today = new Date();
            const daysUntilDue = differenceInDays(dueDate, today);
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
            
            return (
              <Grid item 
                xs={12 / responsiveColumns.xs} 
                sm={12 / responsiveColumns.sm} 
                md={12 / responsiveColumns.md} 
                lg={12 / responsiveColumns.lg} 
                xl={12 / responsiveColumns.xl} 
                key={`${commitment.id}-${index}`}
              >
                {animationsEnabled ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 12
                    }}
                    whileHover={{ 
                      scale: 1.01, 
                      y: -4,
                      transition: { duration: 0.4, type: "spring", stiffness: 200, damping: 15 }
                    }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        minHeight: cardStyles.minHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        background: darkColors.cardBackground,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${darkColors.shadowColor}`,
                          borderColor: alpha(theme.palette.primary.main, 0.8)
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          background: 'transparent',
                          borderRadius: 1,
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          zIndex: -1
                        }
                      }}
                    >
                      <CardContent sx={{ 
                        flexGrow: 1, 
                        p: cardStyles.padding,
                        position: 'relative',
                        zIndex: 2
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={spacing.card}>
                          {/* 🔥 COMPONENTE MEJORADO QUE CONSIDERA PAGOS PARCIALES */}
                          <CommitmentStatusChip 
                            commitment={commitment} 
                            showTooltip={showTooltips}
                            variant="outlined"
                          />
                          <Box sx={{
                            display: 'flex',
                            gap: 0.5,
                            '& .MuiIconButton-root': {
                              background: `rgba(255, 255, 255, 0.08)`,
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              '&:hover': {
                                transform: 'translateY(-1px) scale(1.05)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                background: `rgba(255, 255, 255, 0.12)`
                              }
                            }
                          }}>
                            {showTooltips ? (
                              <>
                                <Tooltip title="Ver detalles" arrow>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleViewCommitment(commitment)}
                                    sx={{ mr: 1 }}
                                  >
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {/* ✅ NUEVO: Botón condicional "Marcar Pagado" - Solo aparece si NO está pagado */}
                                {!commitment.paid && !commitment.isPaid && (
                                  <Tooltip title="Registrar pago" arrow>
                                    <IconButton 
                                      size="small" 
                                      sx={{ mr: 1 }}
                                      onClick={() => navigate(`/payments/new?commitmentId=${commitment.id}`)}
                                    >
                                      <Payment fontSize="small" sx={{ color: 'success.main' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Editar compromiso" arrow>
                                  <IconButton 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                    onClick={() => handleEditFromCard(commitment)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar compromiso" arrow>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteCommitment(commitment)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewCommitment(commitment)}
                                  sx={{ mr: 1 }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                                {/* ✅ BOTÓN handleViewReceipt ELIMINADO COMPLETAMENTE */}
                                <IconButton 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  onClick={() => handleEditFromCard(commitment)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteCommitment(commitment)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Box>

                        <Typography 
                          variant="h6" 
                          gutterBottom 
                          noWrap 
                          sx={{ 
                            fontSize: cardStyles.titleSize,
                            fontWeight: 600,
                            color: darkColors.textPrimary,
                            transition: 'all 0.3s ease',
                            lineHeight: 1.3
                          }}
                        >
                          {commitment.concept || commitment.description || 'Sin concepto'}
                        </Typography>

                        <Box 
                          display="flex" 
                          alignItems="center" 
                          mb={1}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            background: darkColors.cardBackground,
                            border: `1px solid ${darkColors.cardBorder}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Business sx={{ 
                            fontSize: 14, 
                            mr: 1, 
                            color: theme.palette.info.main,
                            
                          }} />
                          <Typography 
                            variant="body2" 
                            color={darkColors.textSecondary} 
                            noWrap 
                            sx={{ 
                              fontSize: cardStyles.subtitleSize,
                              fontWeight: 500,
                              flex: 1,
                              lineHeight: 1.3
                            }}
                          >
                            {commitment.companyName || commitment.company || 'Sin empresa'}
                          </Typography>
                          {commitment.companyLogo && (
                            <Box ml={1}>
                              <img 
                                src={commitment.companyLogo} 
                                alt="Logo empresa"
                                style={{ 
                                  width: 20, 
                                  height: 20, 
                                  borderRadius: 4,
                                  objectFit: 'contain',
                                  
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </Box>
                          )}
                        </Box>

                        <Box 
                          display="flex" 
                          alignItems="center" 
                          mb={spacing.card}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            background: theme.palette.background.paper,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <CalendarToday sx={{ 
                            fontSize: 14, 
                            mr: 1, 
                            color: theme.palette.warning.main,
                            
                          }} />
                          <Typography 
                            variant="body2" 
                            color={darkColors.textSecondary} 
                            sx={{ 
                              fontSize: cardStyles.subtitleSize,
                              fontWeight: 500,
                              lineHeight: 1.4
                            }}
                          >
                            {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Box>

                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: cardStyles.amountSize,
                            fontWeight: 800,
                            color: theme.palette.primary.main,
                            mb: 1,
                            lineHeight: 1.2,
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          {formatCurrency(commitment.amount)}
                        </Typography>

                        {commitment.attachments && commitment.attachments.length > 0 && (
                          <Box 
                            display="flex" 
                            alignItems="center" 
                            mt={2}
                            sx={{
                              p: 1.5,
                              borderRadius: 1,
                              background: darkColors.cardBackground,
                              border: `1px solid ${darkColors.cardBorder}`,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <AttachFile sx={{ 
                              fontSize: 18, 
                              mr: 1.5, 
                              color: theme.palette.success.main,
                              
                            }} />
                            <Typography 
                              variant="caption" 
                              color={darkColors.textSecondary} 
                              sx={{ 
                                fontSize: cardStyles.captionSize,
                                fontWeight: 500,
                                lineHeight: 1.3
                              }}
                            >
                              {commitment.attachments.length} archivo(s)
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <Card
                    sx={{
                      height: '100%',
                      minHeight: cardStyles.minHeight,
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      background: darkColors.cardBackground,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      borderRadius: 2,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${darkColors.shadowColor}`,
                        borderColor: alpha(theme.palette.primary.main, 0.8)
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      p: cardStyles.padding,
                      position: 'relative',
                      zIndex: 2
                    }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={spacing.card}>
                        {/* 🔥 COMPONENTE MEJORADO QUE CONSIDERA PAGOS PARCIALES */}
                        <CommitmentStatusChip 
                          commitment={commitment} 
                          showTooltip={showTooltips}
                          variant="outlined"
                        />
                        <Box sx={{
                          display: 'flex',
                          gap: 0.5,
                          '& .MuiIconButton-root': {
                            background: `rgba(255, 255, 255, 0.08)`,
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            '&:hover': {
                              transform: 'translateY(-1px) scale(1.05)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                              background: `rgba(255, 255, 255, 0.12)`
                            }
                          }
                        }}>
                          {showTooltips ? (
                            <>
                              <Tooltip title="Ver detalles" arrow>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewCommitment(commitment)}
                                  sx={{ mr: 1 }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {/* ✅ NUEVO: Botón condicional "Marcar Pagado" - Solo aparece si NO está pagado */}
                              {!commitment.paid && !commitment.isPaid && (
                                <Tooltip title="Registrar pago" arrow>
                                  <IconButton 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                    onClick={() => navigate(`/payments/new?commitmentId=${commitment.id}`)}
                                  >
                                    <Payment fontSize="small" sx={{ color: 'success.main' }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Editar compromiso" arrow>
                                <IconButton 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  onClick={() => handleEditFromCard(commitment)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar compromiso" arrow>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteCommitment(commitment)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewCommitment(commitment)}
                                sx={{ mr: 1 }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              {/* ✅ NUEVO: Botón condicional "Marcar Pagado" sin tooltip - Solo aparece si NO está pagado */}
                              {!commitment.paid && !commitment.isPaid && (
                                <IconButton 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  onClick={() => navigate(`/payments/new?commitmentId=${commitment.id}`)}
                                >
                                  <Payment fontSize="small" sx={{ color: 'success.main' }} />
                                </IconButton>
                              )}
                              <IconButton 
                                size="small" 
                                sx={{ mr: 1 }}
                                onClick={() => handleEditFromCard(commitment)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteCommitment(commitment)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        noWrap 
                        sx={{ 
                          fontSize: cardStyles.titleSize,
                          fontWeight: 500,
                          background: theme.palette.mode === 'dark' 
                            ? 'linear-gradient(135deg, #ffffff, #64b5f6)' 
                            : 'linear-gradient(135deg, #1a1a1a, #1976d2)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          textShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(255,255,255,0.1)' : 'none',
                          transition: 'all 0.3s ease',
                          lineHeight: 1.3
                        }}
                      >
                        {commitment.concept || commitment.description || 'Sin concepto'}
                      </Typography>

                      <Box 
                        display="flex" 
                        alignItems="center" 
                        mb={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          background: theme.palette.background.paper,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Business sx={{ 
                          fontSize: 14, 
                          mr: 1, 
                          color: theme.palette.info.main,
                          
                        }} />
                        <Typography 
                          variant="body2" 
                          color={darkColors.textSecondary} 
                          noWrap 
                          sx={{ 
                            fontSize: cardStyles.subtitleSize,
                            fontWeight: 500,
                            flex: 1,
                            lineHeight: 1.3
                          }}
                        >
                          {commitment.companyName || commitment.company || 'Sin empresa'}
                        </Typography>
                        {commitment.companyLogo && (
                          <Box ml={1}>
                            <img 
                              src={commitment.companyLogo} 
                              alt="Logo empresa"
                              style={{ 
                                width: 20, 
                                height: 20, 
                                borderRadius: 4,
                                objectFit: 'contain',
                                
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </Box>
                        )}
                      </Box>

                      <Box 
                        display="flex" 
                        alignItems="center" 
                        mb={spacing.card}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          background: theme.palette.background.paper,
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <CalendarToday sx={{ 
                          fontSize: 14, 
                          mr: 1, 
                          color: theme.palette.warning.main,
                          
                        }} />
                        <Typography 
                          variant="body2" 
                          color={darkColors.textSecondary} 
                          sx={{ 
                            fontSize: cardStyles.subtitleSize,
                            fontWeight: 500,
                            lineHeight: 1.4
                          }}
                        >
                          {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Box>

                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontSize: cardStyles.amountSize,
                          fontWeight: 800,
                          color: theme.palette.primary.main,
                          mb: 1,
                          lineHeight: 1.2,
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                      >
                        {formatCurrency(commitment.amount)}
                      </Typography>

                      {commitment.attachments && commitment.attachments.length > 0 && (
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          mt={2}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            background: theme.palette.background.paper,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <AttachFile sx={{ 
                            fontSize: 18, 
                            mr: 1.5, 
                            color: theme.palette.success.main,
                            
                          }} />
                          <Typography 
                            variant="caption" 
                            color={darkColors.textSecondary} 
                            sx={{ 
                              fontSize: cardStyles.captionSize,
                              fontWeight: 500,
                              lineHeight: 1.3
                            }}
                          >
                            {commitment.attachments.length} archivo(s)
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Diálogo de vista detallada - ahora componente extraído */}
      <CommitmentDetailDialog
        open={viewDialogOpen}
        commitment={selectedCommitment}
        companyData={companyData}
        onClose={handleCloseViewDialog}
        onEdit={handleEditFromPopup}
        onOpenPdf={handleOpenPdfViewer}
        extractInvoiceUrl={extractInvoiceUrl}
        safeToDate={safeToDate}
      />

      {/* Formulario de edición completo */}
      <CommitmentEditFormComplete
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        commitment={selectedCommitment}
        onUpdate={handleCommitmentSaved}
      />

      {/* ✅ VISOR DE COMPROBANTES DE PAGO ELIMINADO COMPLETAMENTE */}

      {/* ✅ MODAL VISOR PDF DE FACTURAS - DESIGN SYSTEM SPECTACULAR V2 */}
      <Dialog
        open={pdfViewerOpen}
        onClose={handleClosePdfViewer}
        maxWidth={viewerSize === 'fullscreen' ? false : documentDimensions.width}
        fullScreen={viewerSize === 'fullscreen'}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: viewerSize === 'fullscreen' ? 0 : 2,
            background: theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: viewerSize === 'fullscreen' ? '100vh' : documentDimensions.height,
            overflow: 'hidden'
          }
        }}
      >
        {/* DialogTitle - Con información del documento */}
        <DialogTitle sx={{ 
          p: 3,
          pb: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.grey[800], 0.95)} 0%, ${alpha(theme.palette.grey[900], 0.98)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.95)} 0%, ${alpha(theme.palette.grey[100], 0.98)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Avatar sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                width: 40,
                height: 40
              }}>
                {formatDocumentType(documentInfo?.type) === 'PDF' ? 
                  <PictureAsPdf sx={{ fontSize: 20 }} /> :
                  <Image sx={{ fontSize: 20 }} />
                }
              </Avatar>
            </motion.div>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5
              }}>
                {documentInfo?.name && documentInfo.name !== 'Comprobante.pdf' && documentInfo.name !== 'Comprobante.jpg' 
                  ? documentInfo.name 
                  : `Comprobante ${formatDocumentType(documentInfo?.type) || 'PDF'}`}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.85rem'
                }}>
                  {formatDocumentType(documentInfo?.type) || 'Documento'} • {formatFileSize(documentInfo?.size, documentInfo?.isEstimated)}
                </Typography>
                {documentInfo?.uploadedAt && (
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.85rem'
                  }}>
                    • {format(safeToDate(documentInfo.uploadedAt), 'dd/MM/yyyy', { locale: es })}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {/* Botón de información del documento */}
            <Tooltip title="Información del documento">
              <IconButton
                onClick={handleToggleDocumentInfo}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: documentInfoOpen 
                    ? alpha(theme.palette.info.main, 0.15)
                    : alpha(theme.palette.info.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.info.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <Info sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={viewerSize === 'fullscreen' ? 'Ventana normal' : 'Pantalla completa'}>
              <IconButton
                onClick={toggleViewerSize}
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.primary.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {viewerSize === 'fullscreen' ? 
                  <FullscreenExit sx={{ fontSize: 18 }} /> : 
                  <Fullscreen sx={{ fontSize: 18 }} />
                }
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Abrir en nueva pestaña">
              <IconButton
                component="a"
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  color: theme.palette.text.primary,
                  background: alpha(theme.palette.success.main, 0.08),
                  '&:hover': { 
                    background: alpha(theme.palette.success.main, 0.12),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <OpenInNew sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <IconButton
              onClick={handleClosePdfViewer}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': { 
                  color: theme.palette.error.main,
                  background: alpha(theme.palette.error.main, 0.08),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Barra de información del documento (toggle) */}
        {documentInfo && documentInfoOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <Box sx={{
              px: 3,
              py: 2,
              background: alpha(theme.palette.info.main, 0.04),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              maxHeight: '50vh',
              overflowY: 'auto',
              minHeight: 'auto'
            }}>
              {/* Información principal en una estructura más compacta */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2, 
                mb: 2
              }}>
                <Box display="flex" alignItems="start" gap={1}>
                  <FolderOpen sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Ubicación
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: '0.8rem',
                      wordBreak: 'break-word'
                    }}>
                      {documentInfo.path || 'Firebase Storage'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="start" gap={1}>
                  <InsertDriveFile sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Tipo
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: '0.8rem'
                    }}>
                      {formatDocumentType(documentInfo.type)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="start" gap={1}>
                  <Schedule sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Fecha de subida
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: '0.8rem'
                    }}>
                      {documentInfo.uploadedAt ? (
                        format(safeToDate(documentInfo.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: es })
                      ) : documentInfo.isEstimated ? (
                        'Fecha aproximada no disponible'
                      ) : (
                        'Fecha no registrada'
                      )}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="start" gap={1}>
                  <GetApp sx={{ fontSize: 16, color: theme.palette.text.secondary, mt: 0.5 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      Tamaño
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: '0.8rem'
                    }}>
                      {formatFileSize(documentInfo.size, documentInfo.isEstimated)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Información técnica detallada */}
              {documentInfo.url && (
                <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    mb: 1,
                    display: 'block'
                  }}>
                    Ruta completa del documento
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.primary,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    background: alpha(theme.palette.grey[500], 0.1),
                    p: 1.5,
                    borderRadius: 1,
                    wordBreak: 'break-all',
                    mb: 2
                  }}>
                    {documentInfo.fullPath || documentInfo.path || documentInfo.url}
                  </Typography>

                  {/* Metadatos adicionales de Firebase */}
                  {(documentInfo.bucket || documentInfo.updatedAt) && (
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: 2,
                      mt: 2
                    }}>
                      {documentInfo.bucket && (
                        <Box>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            display: 'block'
                          }}>
                            Bucket de almacenamiento
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.primary,
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            wordBreak: 'break-word'
                          }}>
                            {documentInfo.bucket}
                          </Typography>
                        </Box>
                      )}
                      
                      {documentInfo.updatedAt && (
                        <Box>
                          <Typography variant="caption" sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            display: 'block'
                          }}>
                            Última modificación
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.text.primary,
                            fontSize: '0.75rem'
                          }}>
                            {format(documentInfo.updatedAt, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </motion.div>
        )}
        
        {/* DialogContent - Padding exacto según design system */}
        <DialogContent sx={{ 
          p: 3, 
          pt: 3,
          height: documentInfoOpen ? 'calc(100% - 200px)' : '100%', 
          display: 'flex', 
          flexDirection: 'column',
          background: theme.palette.background.default,
          overflow: 'hidden'
        }}>
          <Paper sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            background: theme.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            minHeight: '500px'
          }}>
            {invoiceUrl ? (
              <>
                {invoiceUrl.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={invoiceUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    title="Visualizar Factura PDF"
                  />
                ) : (
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 2
                  }}>
                    <img 
                      src={invoiceUrl}
                      alt="Factura"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{
                textAlign: 'center',
                py: 8,
                px: 4
              }}>
                <Avatar sx={{ 
                  width: 64, 
                  height: 64, 
                  background: alpha(theme.palette.grey[400], 0.1),
                  margin: '0 auto 16px'
                }}>
                  <Visibility sx={{ 
                    fontSize: 32, 
                    color: alpha(theme.palette.text.secondary, 0.7)
                  }} />
                </Avatar>
                <Typography variant="h6" sx={{ 
                  fontWeight: 500,
                  mb: 1,
                  color: theme.palette.text.primary
                }}>
                  No hay documento disponible
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: alpha(theme.palette.text.secondary, 0.8),
                  lineHeight: 1.6
                }}>
                  Este compromiso no tiene un comprobante asociado
                </Typography>
              </Box>
            )}
          </Paper>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        commitment={commitmentToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeletingCommitment}
      />

      {/* Aviso de resultados truncados */}
      {isResultsTruncated && (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2, 
            borderRadius: 1,
            '& .MuiAlert-message': { fontSize: '0.85rem' }
          }}
        >
          Mostrando los primeros {QUERY_LIMIT} compromisos. Aplica filtros más específicos (fecha, empresa, etc.) para ver resultados más precisos.
        </Alert>
      )}

      {/* Paginación Sobria - Diseño Empresarial */}
      {!loading && commitments.length > 0 && (
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ marginTop: spacing.grid * 2 }}
        >
          <Card sx={{
            background: darkColors.cardBackground,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            borderRadius: 1,
            boxShadow: `0 2px 8px ${darkColors.shadowColor}`,
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.8)
            }
          }}>
            <Box sx={{ p: 2.5 }}>
              {/* Información mejorada */}
              <Stack 
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', md: 'center' }}
                gap={2}
                mb={1.5}
              >
                {/* Info detallada de paginación */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: '0.95rem',
                      lineHeight: 1.2
                    }}
                  >
                    {totalCommitments === 0 ? 'Sin compromisos' : 
                     `${Math.min(((currentPage - 1) * paginationConfig.itemsPerPage) + 1, totalCommitments)}-${Math.min(currentPage * paginationConfig.itemsPerPage, totalCommitments)} de ${totalCommitments}`}
                  </Typography>
                  
                  {totalCommitments > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'text.secondary', 
                          fontSize: '0.8rem',
                          lineHeight: 1.2
                        }}
                      >
                        compromisos encontrados
                      </Typography>
                      
                      {(searchTerm || companyFilter !== 'all' || statusFilter !== 'all' || yearFilter !== 'all') && (
                        <Chip
                          label="Con filtros"
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ 
                            height: 20,
                            '& .MuiChip-label': { fontSize: '0.75rem' }
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>

                {/* Controles adicionales */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                  {/* Salto directo a página */}
                  {Math.ceil(totalCommitments / paginationConfig.itemsPerPage) > 1 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.8rem', 
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
                          max: Math.ceil(totalCommitments / paginationConfig.itemsPerPage),
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
              </Stack>

              {/* Controles de paginación mejorados */}
              {Math.ceil(totalCommitments / paginationConfig.itemsPerPage) > 1 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 1.5,
                  pt: 1.5,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      onClick={handleFirstPage}
                      disabled={currentPage === 1}
                      size="small"
                      sx={{
                        borderRadius: 0.5,
                        width: 30,
                        height: 30,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: currentPage === 1 ? 'action.disabled' : 'background.paper',
                        color: currentPage === 1 ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.15s ease',
                        '&:hover': currentPage !== 1 ? {
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
                      disabled={currentPage === 1}
                      size="small"
                      sx={{
                        borderRadius: 0.5,
                        width: 30,
                        height: 30,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: currentPage === 1 ? 'action.disabled' : 'background.paper',
                        color: currentPage === 1 ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.15s ease',
                        '&:hover': currentPage !== 1 ? {
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
                      count={Math.ceil(totalCommitments / paginationConfig.itemsPerPage)}
                      page={currentPage}
                      onChange={(event, page) => handlePageChange(page)}
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
                      disabled={currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage)}
                      size="small"
                      sx={{
                        borderRadius: 0.5,
                        width: 30,
                        height: 30,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'action.disabled' : 'background.paper',
                        color: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.15s ease',
                        '&:hover': currentPage !== Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? {
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
                      disabled={currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage)}
                      size="small"
                      sx={{
                        borderRadius: 0.5,
                        width: 30,
                        height: 30,
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        bgcolor: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'action.disabled' : 'background.paper',
                        color: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.15s ease',
                        '&:hover': currentPage !== Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? {
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
              )}
            </Box>
          </Card>
        </motion.div>
      )}
      {/* (stray fragment cleanup) */}
      </>
      )}

      {/* Menú contextual de acciones */}
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
        {/* Ver detalles */}
        <ListItemButton onClick={() => {
          handleViewCommitment(currentCommitment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Visibility sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Ver detalles"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>

        {/* Marcar como pagado - solo si NO está pagado */}
        {currentCommitment && !currentCommitment.paid && !currentCommitment.isPaid && (
          <ListItemButton onClick={() => {
            navigate(`/payments/new?commitmentId=${currentCommitment.id}`);
            handleActionMenuClose();
          }}>
            <ListItemIcon>
              <Payment sx={{ color: 'success.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Marcar como pagado"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}

        {/* Editar */}
        <ListItemButton onClick={() => {
          handleEditFromCard(currentCommitment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Edit sx={{ color: 'warning.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Editar"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>

        {/* Divider antes de acciones especiales */}
        {currentCommitment && extractInvoiceUrl(currentCommitment) && <Divider sx={{ my: 0.5 }} />}

        {/* Ver factura - solo si tiene factura */}
        {currentCommitment && extractInvoiceUrl(currentCommitment) && (
          <ListItemButton onClick={() => {
            handleOpenPdfDirect(currentCommitment);
            handleActionMenuClose();
          }}>
            <ListItemIcon>
              <PictureAsPdf sx={{ color: 'secondary.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Ver factura"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        )}

        <Divider sx={{ my: 0.5 }} />

        {/* Eliminar */}
        <ListItemButton onClick={() => {
          handleDeleteCommitment(currentCommitment);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <Delete sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Eliminar"
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItemButton>
      </Menu>
    </Box>
  );
};

// Componente para Confirmar Eliminación
const DeleteConfirmDialog = ({ open, commitment, onConfirm, onCancel, isDeleting = false }) => {
  const theme = useTheme();
  
  if (!commitment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={isDeleting ? undefined : onCancel}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        fontWeight: 600,
        fontSize: '1.25rem'
      }}>
        <Warning sx={{ color: theme.palette.error.main }} />
        Confirmar Eliminación
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que deseas eliminar el compromiso <strong>"{commitment.concept || commitment.description || commitment.title || 'Sin concepto'}"</strong>?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, color: theme.palette.error.main }}>
          Esta acción no se puede deshacer y eliminará todos los archivos adjuntos permanentemente.
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onCancel} 
          variant="outlined"
          disabled={isDeleting}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          disabled={isDeleting}
          sx={{ borderRadius: 2 }}
        >
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommitmentsList;
