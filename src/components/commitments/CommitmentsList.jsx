import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Tooltip,
  Fade,
  useTheme,
  alpha,
  Pagination,
  Stack,
  Avatar,
  TextField,
  Skeleton
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  AttachFile,
  Business,
  CalendarToday,
  AccountBalance,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Payment,
  Share,
  NotificationAdd,
  GetApp,
  Close,
  // ✅ Receipt as ReceiptIcon ELIMINADO (ya no se usa)
  Person,
  Info,
  Notes,
  History,
  AccessTime,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, addDays, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, deleteDoc, limit, startAfter, getDocs, getCountFromServer } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import { useThemeGradients, shimmerEffect } from '../../utils/designSystem';
import { unifiedTokens, enhancedTokenUtils } from '../../theme/tokens';

// Imports básicos sin optimizaciones problemáticas
import { useTableTokens } from '../../hooks/useTokens';
import useCommitmentAlerts from '../../hooks/useCommitmentAlerts';
import CommitmentEditForm from './CommitmentEditForm';
// ✅ PaymentReceiptViewer ELIMINADO COMPLETAMENTE

// Helper function para manejar fechas de Firebase de manera segura
const safeToDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return null;
};

// 🎨 Función global para obtener colores optimizados para modo oscuro
const getGlobalDarkModeColors = (theme) => ({
  cardBackground: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.95)
    : '#ffffff',
  cardBorder: theme.palette.mode === 'dark'
    ? alpha(theme.palette.divider, 0.3)
    : alpha(theme.palette.divider, 0.2),
  hoverBackground: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.98)
    : alpha(theme.palette.background.default, 0.8),
  shadowColor: theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.4)'
    : 'rgba(0, 0, 0, 0.1)',
  textPrimary: theme.palette.mode === 'dark'
    ? '#e2e8f0'
    : theme.palette.text.primary,
  textSecondary: theme.palette.mode === 'dark'
    ? '#94a3b8'
    : theme.palette.text.secondary,
  shimmerEffect: theme.palette.mode === 'dark'
    ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)',
});

// Helper function para estilos de chips sin relleno
const getTransparentChipStyles = (statusColor) => ({
  fontWeight: 500,
  borderRadius: '20px',
  borderColor: statusColor,
  color: statusColor,
  backgroundColor: 'transparent !important',
  '&.MuiChip-root': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-outlined': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-colorPrimary': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-colorSecondary': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-colorSuccess': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-colorError': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-colorWarning': {
    backgroundColor: 'transparent !important'
  },
  '&.MuiChip-colorInfo': {
    backgroundColor: 'transparent !important'
  },
  '&:hover': {
    backgroundColor: 'transparent !important',
    borderColor: statusColor,
    boxShadow: `0 0 0 2px ${alpha(statusColor, 0.2)}`,
  },
  '&:focus': {
    backgroundColor: 'transparent !important',
  },
  '&:active': {
    backgroundColor: 'transparent !important',
  },
  '& .MuiChip-icon': {
    color: statusColor
  },
  '& .MuiChip-label': {
    fontSize: '0.8rem',
    fontWeight: 500,
    lineHeight: 1.3
  }
});

// Helper function para determinar el estado del compromiso
const getCommitmentStatus = (commitment) => {
  if (!commitment) return { text: 'DESCONOCIDO', color: 'grey', emoji: '❓' };
  
  // Si está marcado como pagado, es pagado (compatible con ambas propiedades)
  if (commitment.isPaid || commitment.paid) {
    return { text: 'PAGADO', color: 'success', emoji: '✅' };
  }
  
  // Si no tiene fecha de vencimiento, es pendiente
  const dueDate = safeToDate(commitment.dueDate);
  if (!dueDate) {
    return { text: 'PENDIENTE', color: 'warning', emoji: '⏳' };
  }
  
  const today = new Date();
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Comparar solo las fechas, sin horas
  if (dueDateOnly < todayOnly) {
    return { text: 'VENCIDO', color: 'error', emoji: '⚠️' };
  } else if (dueDateOnly.getTime() === todayOnly.getTime()) {
    return { text: 'VENCE HOY', color: 'warning', emoji: '🔔' };
  } else {
    return { text: 'PENDIENTE', color: 'info', emoji: '⏳' };
  }
};

// Helper function para obtener el color del estado con DS 3.0
const getStatusColor = (status, theme) => {
  // Validación de seguridad
  if (!theme || !theme.palette) {
    console.warn('Theme no está disponible en getStatusColor, usando colores por defecto');
    return {
      main: '#666',
      light: '#999', 
      dark: '#333'
    };
  }
  
  // Mejoramos los colores basándose en el chipColor para mejor consistencia
  
  switch (status.chipColor) {
    case 'success':
      return {
        main: theme.palette.success.main,
        light: theme.palette.success.light,
        dark: theme.palette.success.dark
      };
    case 'error':
      return {
        main: theme.palette.error.main,
        light: theme.palette.error.light, 
        dark: theme.palette.error.dark
      };
    case 'warning':
      return {
        main: theme.palette.warning.main,
        light: theme.palette.warning.light,
        dark: theme.palette.warning.dark
      };
    case 'info':
      return {
        main: theme.palette.info.main,
        light: theme.palette.info.light,
        dark: theme.palette.info.dark
      };
    default:
      return {
        main: theme.palette.grey[600],
        light: theme.palette.grey[400],
        dark: theme.palette.grey[800]
      };
  }
};

// Componente de Chip DS 3.0 mejorado
const StatusChipDS3 = ({ status, showTooltip = false, theme }) => {
  // status ya viene procesado como statusInfo
  const colors = getStatusColor(status, theme);
  
  const ChipComponent = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
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
          '& .MuiChip-icon': {
            color: colors.main,
            fontSize: 16,
            marginLeft: '4px'
          },
          '& .MuiChip-label': {
            paddingLeft: '6px',
            paddingRight: '12px',
            letterSpacing: '0.3px',
            fontWeight: 600
          },
          '&:hover': {
            backgroundColor: 'transparent !important',
            borderColor: alpha(colors.main, 0.35),
            boxShadow: `0 2px 4px ${alpha(colors.main, 0.15)}`,
            transform: 'scale(1.02)'
          }
        }}
      />
    </motion.div>
  );

  return showTooltip ? (
    <Tooltip 
      title={`Estado: ${status.label}`} 
      arrow
      placement="top"
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
    >
      {ChipComponent}
    </Tooltip>
  ) : ChipComponent;
};

// Componente para fechas mejoradas DS 3.0
const DateDisplayDS3 = ({ date, showDaysRemaining = false, variant = 'standard', theme, isPaid = false }) => {
  const darkColors = getGlobalDarkModeColors(theme);
  
  if (!date) return <Typography color={darkColors.textSecondary}>Fecha no disponible</Typography>;
  
  const safeDate = safeToDate(date);
  if (!safeDate) return <Typography color={darkColors.textSecondary}>Fecha inválida</Typography>;
  
  const today = new Date();
  const daysRemaining = differenceInDays(safeDate, today);
  
  const formatOptions = {
    standard: {
      dateFormat: "dd/MM/yyyy",
      fontSize: "0.875rem",
      color: "text.primary"
    },
    compact: {
      dateFormat: "dd MMM",
      fontSize: "0.8rem", 
      color: "text.secondary"
    },
    detailed: {
      dateFormat: "EEEE, dd 'de' MMMM 'de' yyyy",
      fontSize: "1rem",
      color: "text.primary"
    }
  };
  
  const option = formatOptions[variant] || formatOptions.standard;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography 
        variant="body2"
        sx={{ 
          fontSize: option.fontSize,
          fontWeight: variant === 'detailed' ? 500 : 400,
          color: option.color,
          lineHeight: 1.3
        }}
      >
        {format(safeDate, option.dateFormat, { locale: es })}
      </Typography>
      {showDaysRemaining && !isPaid && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: daysRemaining < 0 ? 'error.main' : 
                   daysRemaining <= 7 ? 'warning.main' : 
                   'success.main',
            fontWeight: 500,
            fontSize: '0.7rem',
            mt: 0.2
          }}
        >
          {daysRemaining < 0 ? `${Math.abs(daysRemaining)} días vencido` :
           daysRemaining === 0 ? 'Vence hoy' :
           `${daysRemaining} días restantes`}
        </Typography>
      )}
    </Box>
  );
};

// Componente mejorado para mostrar montos DS 3.0
const AmountDisplayDS3 = ({ amount, variant = 'standard', showAnimation = false, theme }) => {
  const darkColors = getGlobalDarkModeColors(theme);
  
  if (!amount && amount !== 0) return <Typography color={darkColors.textSecondary}>Monto no disponible</Typography>;
  
  const formatAmount = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const styles = {
    standard: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: 'text.primary'
    },
    large: {
      fontSize: '1.125rem',
      fontWeight: 700,
      color: 'text.primary'
    },
    compact: {
      fontSize: '0.8rem',
      fontWeight: 500,
      color: 'text.secondary'
    }
  };

  const currentStyle = styles[variant] || styles.standard;

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Typography
        variant="body2"
        sx={{
          ...currentStyle,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: variant === 'large' ? '-0.02em' : 0,
          lineHeight: 1.2
        }}
      >
        {showAnimation ? (
          <CountingNumber end={amount} />
        ) : (
          formatAmount(amount)
        )}
      </Typography>
    </motion.div>
  );
};

const CountingNumber = ({ end, duration = 1000, prefix = '$' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span>
      {prefix}{new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0
      }).format(count)}
    </span>
  );
};

// Componente para progreso de tiempo
const TimeProgress = ({ dueDate, createdAt, isPaid }) => {
  // Ya no mostramos información de progreso porque está en la fecha de vencimiento
  return null;
};

const CommitmentsList = ({ companyFilter, statusFilter, searchTerm, yearFilter, viewMode = 'cards', onCommitmentsChange }) => {
  const { currentUser } = useAuth();
  const { addNotification, addAlert } = useNotifications();
  const { settings } = useSettings();
  const navigate = useNavigate(); // ✅ Hook para navegación
  const theme = useTheme();
  const gradients = useThemeGradients();
  
  // 🎨 Función para obtener colores optimizados para modo oscuro
  const getDarkModeColors = useCallback(() => ({
    cardBackground: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.95)
      : '#ffffff',
    cardBorder: theme.palette.mode === 'dark'
      ? alpha(theme.palette.divider, 0.3)
      : alpha(theme.palette.divider, 0.2),
    hoverBackground: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.98)
      : alpha('#f8fafc', 0.8),
    shadowColor: theme.palette.mode === 'dark'
      ? 'rgba(0, 0, 0, 0.4)'
      : 'rgba(0, 0, 0, 0.1)',
    textPrimary: theme.palette.mode === 'dark'
      ? '#e2e8f0'
      : theme.palette.text.primary,
    textSecondary: theme.palette.mode === 'dark'
      ? '#94a3b8'
      : theme.palette.text.secondary,
    shimmerEffect: theme.palette.mode === 'dark'
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)',
  }), [theme]);

  const darkColors = getDarkModeColors();

  // Header de tabla DS 3.0 simplificado - Profesional sin animaciones
  const TableHeaderDS3 = () => {
    return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '0.8fr 2fr 1.5fr 1.2fr 1fr 0.8fr',
        gap: 2,
        p: 3,
        backgroundColor: darkColors.cardBackground,
        borderRadius: '1px 1px 0 0',
        border: `1px solid ${darkColors.cardBorder}`,
        borderBottom: `2px solid ${darkColors.cardBorder}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: darkColors.cardBackground,
        boxShadow: `0 4px 20px ${darkColors.shadowColor}`
      }}>
        {[
          'ESTADO',
          'DESCRIPCIÓN',
          'EMPRESA',
          'MONTO',
          'VENCIMIENTO',
          'ACCIONES'
        ].map((column) => (
          <Box 
            key={column}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: column === 'MONTO' ? 'center' : 
                            column === 'ACCIONES' ? 'center' : 'flex-start'
            }}
          >
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: darkColors.textPrimary,
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
    );
  };
  
  // 🚀 OPTIMIZACIÓN FASE 1: Debounce para filtros críticos
  // Variables sin debounce para eliminar caché problemático
  const debouncedSearchTerm = searchTerm;
  const debouncedCompanyFilter = companyFilter;
  const debouncedStatusFilter = statusFilter;
  const debouncedYearFilter = yearFilter;
  
  // Configuración básica sin optimizaciones problemáticas
  const [virtualScrollEnabled, setVirtualScrollEnabled] = useState(false);
  const itemHeight = viewMode === 'cards' ? 160 : 80;
  const containerHeight = 600;
  
  // Hook mejorado para tokens de tabla
  const tableTokens = useTableTokens();
  
  // Hook para detectar el tamaño de pantalla y densidad
  const [screenInfo, setScreenInfo] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
    pixelRatio: window.devicePixelRatio || 1
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenInfo({
        height: window.innerHeight,
        width: window.innerWidth,
        pixelRatio: window.devicePixelRatio || 1
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determinar si es una pantalla de menor resolución que necesita ajustes especiales
  const isLowerResScreen = screenInfo.height <= 1080 || (screenInfo.width <= 1920 && screenInfo.height <= 1200);
  
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // ✅ receiptViewerOpen ELIMINADO COMPLETAMENTE
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  
  // Estados para el diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState(null);

  // Estados de paginación spectacular
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCommitments, setTotalCommitments] = useState(0);
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [firstVisibleDoc, setFirstVisibleDoc] = useState(null);
  const [pageDocuments, setPageDocuments] = useState({}); // Cache de documentos por página
  const [paginationCache, setPaginationCache] = useState(new Map());
  const [jumpToPage, setJumpToPage] = useState(''); // Estado para salto directo a página
  
  // Elementos por página fijos en 9
  const ITEMS_PER_PAGE = 9;

  // Hook para generar alertas automáticas de compromisos vencidos/próximos a vencer
  const { overdueCount, dueSoonCount } = useCommitmentAlerts(commitments);

  // ✅ NUEVA FUNCIONALIDAD: Detección de montos elevados
  useEffect(() => {
    if (!commitments?.length || !settings.notifications?.enabled || !settings.notifications?.montosElevados) {
      return;
    }

    const threshold = settings.notifications?.umbralesMonto || 100000;
    const processedCommitments = new Set(JSON.parse(localStorage.getItem('processedHighAmountCommitments') || '[]'));

    commitments.forEach(commitment => {
      const commitmentId = commitment.id;
      const amount = commitment.amount || 0;

      // Solo procesar compromisos que superen el umbral y no hayan sido procesados antes
      if (amount > threshold && !processedCommitments.has(commitmentId)) {
        addAlert({
          id: `high-amount-${commitmentId}`,
          type: 'warning',
          title: 'Monto Elevado Detectado',
          message: `El compromiso "${commitment.concept || 'Sin concepto'}" por $${amount.toLocaleString()} supera el umbral configurado de $${threshold.toLocaleString()}`,
          commitment: commitment,
          timestamp: new Date(),
          severity: 'warning',
          persistent: true
        });

        // Marcar como procesado para evitar notificaciones duplicadas
        processedCommitments.add(commitmentId);
        localStorage.setItem('processedHighAmountCommitments', JSON.stringify([...processedCommitments]));
      }
    });
  }, [commitments, settings.notifications, addAlert]);

  // Configuraciones del dashboard desde SettingsContext
  const dashboardConfig = settings.dashboard;
  const effectiveViewMode = viewMode || dashboardConfig.layout.viewMode;
  const cardSize = dashboardConfig.layout.cardSize;
  const density = dashboardConfig.layout.density;
  const columns = dashboardConfig.layout.columns;
  const animationsEnabled = dashboardConfig.behavior.animationsEnabled;
  const showTooltips = dashboardConfig.behavior.showTooltips;

  // Funciones helper para aplicar configuraciones
  const getSpacingByDensity = () => {
    switch (density) {
      case 'compact': return { grid: 1.5, card: 1, padding: 1.5 };
      case 'spacious': return { grid: 4, card: 3, padding: 3 };
      default: return { grid: 3, card: 2, padding: 2 }; // normal
    }
  };

  const getCardSizeStyles = () => {
    const base = {
      small: { 
        minHeight: 160, 
        padding: 1.5, 
        fontSize: '0.85rem',
        titleSize: '0.95rem',
        subtitleSize: '0.75rem',
        captionSize: '0.65rem',
        amountSize: '1rem'
      },
      medium: { 
        minHeight: 190, 
        padding: 2, 
        fontSize: '0.9rem',
        titleSize: '1rem',
        subtitleSize: '0.8rem',
        captionSize: '0.7rem',
        amountSize: '1.15rem'
      },
      large: { 
        minHeight: 240, 
        padding: 3, 
        fontSize: '0.95rem',
        titleSize: '1.1rem',
        subtitleSize: '0.85rem',
        captionSize: '0.75rem',
        amountSize: '1.3rem'
      }
    };
    return base[cardSize] || base.medium;
  };

  const getColumnsConfig = () => {
    // Responsive columns basado en la configuración
    const baseColumns = {
      xs: Math.min(columns, 1),
      sm: Math.min(columns, 2),
      md: Math.min(columns, 3),
      lg: Math.min(columns, 4),
      xl: Math.min(columns, 6)
    };
    return baseColumns;
  };

  const spacing = getSpacingByDensity();
  const cardStyles = getCardSizeStyles();
  const responsiveColumns = getColumnsConfig();

  // Configuración de paginación por modo de vista
  const getPaginationConfig = () => {
    // Usar valor fijo de 9 elementos por página
    switch (effectiveViewMode) {
      case 'table': 
        return { itemsPerPage: ITEMS_PER_PAGE, label: 'filas por página' };
      case 'list': 
        return { itemsPerPage: ITEMS_PER_PAGE, label: 'elementos por página' };
      case 'cards': 
      default: 
        return { itemsPerPage: ITEMS_PER_PAGE, label: 'tarjetas por página' };
    }
  };

  const paginationConfig = getPaginationConfig();

  // Función helper para verificar si un compromiso tiene pago válido (SIMPLIFICADA PARA DEBUG)
  const hasValidPayment = (commitment) => {
    const isPaid = commitment.paid || commitment.isPaid;
    const hasPaymentDate = commitment.paymentDate || commitment.paidAt;
    const hasReceipt = commitment.receiptUrl || (commitment.receiptUrls && commitment.receiptUrls.length > 0);
    const hasPaymentRef = commitment.paymentReference || commitment.paymentId;
    const hasPaymentMetadata = commitment.receiptMetadata && commitment.receiptMetadata.length > 0;
    
    console.log('🔍 [DEBUG] Validando pago para compromiso:', commitment.id, {
      isPaid,
      hasPaymentDate,
      hasReceipt,
      hasPaymentRef,
      hasPaymentMetadata,
      receiptUrl: commitment.receiptUrl,
      receiptUrls: commitment.receiptUrls,
      paid: commitment.paid,
      isPaidField: commitment.isPaid
    });
    
    // TEMPORALMENTE: devolver true si está marcado como pagado, sin importar los comprobantes
    const result = isPaid;
    console.log('🔍 [DEBUG] Resultado final hasValidPayment:', result);
    return result;
  };

  // Función simplificada para obtener el total sin caché
  const getTotalCount = useCallback(async () => {
    try {
      let q = query(collection(db, 'commitments'));

      // Aplicar filtros
      if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
        q = query(q, where('companyId', '==', debouncedCompanyFilter));
      }
      
      if (debouncedYearFilter && debouncedYearFilter !== 'all') {
        const startDate = new Date(parseInt(debouncedYearFilter), 0, 1);
        const endDate = new Date(parseInt(debouncedYearFilter), 11, 31);
        q = query(q, where('dueDate', '>=', startDate), where('dueDate', '<=', endDate));
      }

      let totalCount = 0;
      
      if (debouncedStatusFilter !== 'all' || debouncedSearchTerm) {
        // Obtener todos los documentos y filtrar localmente
        const snapshot = await getDocs(q);
        let filteredCommitments = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          filteredCommitments.push({
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate)
          });
        });

        // Aplicar filtros locales
        if (debouncedSearchTerm) {
          filteredCommitments = filteredCommitments.filter(commitment =>
            (commitment.concept && commitment.concept.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.description && commitment.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.companyName && commitment.companyName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.company && commitment.company.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.beneficiary && commitment.beneficiary.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
          );
        }

        if (debouncedStatusFilter && debouncedStatusFilter !== 'all') {
          const today = new Date();
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(today.getDate() + 3);

          filteredCommitments = filteredCommitments.filter(commitment => {
            const dueDate = commitment.dueDate;
            
            switch (debouncedStatusFilter) {
              case 'overdue':
                return dueDate < today && !commitment.paid;
              case 'due-soon':
                return dueDate > today && dueDate < threeDaysFromNow && !commitment.paid;
              case 'pending':
                return !commitment.paid && dueDate >= threeDaysFromNow;
              case 'paid':
                return commitment.paid;
              default:
                return true;
            }
          });
        }
        
        totalCount = filteredCommitments.length;
      } else {
        // Sin filtros de estado o búsqueda, usar getCountFromServer
        const countSnapshot = await getCountFromServer(q);
        totalCount = countSnapshot.data().count;
      }
      
      setTotalCommitments(totalCount);
      return totalCount;
    } catch (error) {
      console.error('Error getting count:', error);
      setTotalCommitments(0);
      return 0;
    }
  }, [debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedYearFilter]);

  // 🚀 OPTIMIZACIÓN FASE 2: Función para cargar página con query optimizer
  // Función simplificada para cargar página sin caché problemático
  const loadCommitmentsPage = useCallback(async (pageNumber, pageSize = paginationConfig.itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);

      let q = query(collection(db, 'commitments'), orderBy('dueDate', 'desc'));

      // Aplicar filtros básicos en Firestore
      if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
        q = query(collection(db, 'commitments'), where('companyId', '==', debouncedCompanyFilter), orderBy('dueDate', 'desc'));
      }
      
      if (debouncedYearFilter && debouncedYearFilter !== 'all') {
        const startDate = new Date(parseInt(debouncedYearFilter), 0, 1);
        const endDate = new Date(parseInt(debouncedYearFilter), 11, 31);
        if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
          q = query(collection(db, 'commitments'), 
            where('companyId', '==', debouncedCompanyFilter),
            where('dueDate', '>=', startDate),
            where('dueDate', '<=', endDate),
            orderBy('dueDate', 'desc')
          );
        } else {
          q = query(collection(db, 'commitments'), 
            where('dueDate', '>=', startDate),
            where('dueDate', '<=', endDate),
            orderBy('dueDate', 'desc')
          );
        }
      }

      // Paginación simplificada: Para página 1, no usar startAfter
      if (pageNumber > 1) {
        // Para páginas > 1, intentar usar el cache de páginas
        const prevPageKey = pageNumber - 1;
        const prevPageDoc = pageDocuments[prevPageKey]?.lastVisible;
        if (prevPageDoc) {
          q = query(q, startAfter(prevPageDoc), limit(pageSize));
        } else {
          // Fallback: usar lastVisibleDoc actual si no hay cache
          if (lastVisibleDoc) {
            q = query(q, startAfter(lastVisibleDoc), limit(pageSize));
          } else {
            // Si no hay referencia, cargar desde el principio
            console.warn('Sin documento de referencia para paginación, cargando desde inicio');
            q = query(q, limit(pageSize));
          }
        }
      } else {
        // Página 1: limpiar estado y empezar desde el principio
        setLastVisibleDoc(null);
        setFirstVisibleDoc(null);
        q = query(q, limit(pageSize));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCommitments([]);
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

      // Aplicar filtros locales
      let filteredCommitments = commitmentsData;

      // Filtro por término de búsqueda
      if (debouncedSearchTerm) {
        filteredCommitments = filteredCommitments.filter(
          commitment =>
            (commitment.concept && commitment.concept.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.description && commitment.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.companyName && commitment.companyName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.company && commitment.company.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
            (commitment.beneficiary && commitment.beneficiary.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        );
      }

      // Filtro por estado
      if (debouncedStatusFilter && debouncedStatusFilter !== 'all') {
        const today = new Date();
        const threeDaysFromNow = addDays(today, 3);

        filteredCommitments = filteredCommitments.filter(commitment => {
          const dueDate = commitment.dueDate;
          
          switch (debouncedStatusFilter) {
            case 'overdue':
              return isBefore(dueDate, today) && !commitment.paid;
            case 'due-soon':
              return isAfter(dueDate, today) && isBefore(dueDate, threeDaysFromNow) && !commitment.paid;
            case 'pending':
              return !commitment.paid && isAfter(dueDate, threeDaysFromNow);
            case 'paid':
              return commitment.paid;
            default:
              return true;
          }
        });
      }

      const firstVisible = snapshot.docs[0];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      setCommitments(filteredCommitments);
      setFirstVisibleDoc(firstVisible);
      setLastVisibleDoc(lastVisible);
      
      // Guardar documentos de esta página en el cache
      setPageDocuments(prev => ({
        ...prev,
        [pageNumber]: {
          firstVisible,
          lastVisible
        }
      }));
      
      setLoading(false);

      // Notificar al componente padre
      if (onCommitmentsChange) {
        onCommitmentsChange(filteredCommitments);
      }

    } catch (error) {
      console.error('Error loading commitments page:', error);
      setError('Error al cargar los compromisos');
      setLoading(false);
    }
  }, [debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedYearFilter, paginationConfig.itemsPerPage]); // Removed lastVisibleDoc dependency

  // SISTEMA DE PAGINACIÓN SIMPLIFICADO - Una sola función para cargar datos
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('🔄 [DEBUG Pagination] useEffect triggered:', {
      currentPage,
      debouncedCompanyFilter,
      debouncedStatusFilter,
      debouncedSearchTerm,
      debouncedYearFilter
    });
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Recalcular total cuando cambien filtros
        const total = await getTotalCount();
        console.log('📊 [DEBUG Pagination] Total compromisos:', total);
        setTotalCommitments(total);
        
        // Cargar página actual
        console.log('📖 [DEBUG Pagination] Cargando página:', currentPage);
        await loadCommitmentsPage(currentPage);
        
      } catch (error) {
        console.error('❌ [DEBUG Pagination] Error loading commitments:', error);
        setError('Error al cargar los compromisos');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedYearFilter, currentPage]);

  // Reset página cuando cambien SOLO los filtros (no la página)
  useEffect(() => {
    console.log('🔄 [DEBUG Reset] Resetting to page 1 due to filter change');
    setCurrentPage(1);
    setLastVisibleDoc(null);
    setFirstVisibleDoc(null);
    setPageDocuments({}); // Limpiar cache de páginas
  }, [debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedYearFilter]);

  const getStatusInfo = (commitment) => {
    const today = new Date();
    const dueDate = commitment.dueDate;
    const threeDaysFromNow = addDays(today, 3);
    const daysDifference = differenceInDays(dueDate, today);

    if (commitment.paid) {
      return {
        label: 'Pagado',
        color: theme.palette.success.main,
        chipColor: 'success',
        icon: <CheckCircle />,
        gradient: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
        shadowColor: 'rgba(76, 175, 80, 0.3)',
        action: 'Ver Comprobante',
        actionIcon: <GetApp />
      };
    }

    if (isBefore(dueDate, today)) {
      const urgency = Math.min(Math.abs(daysDifference), 30) / 30; // Más urgente = más rojo
      return {
        label: 'Vencido',
        color: theme.palette.error.main,
        chipColor: 'error',
        icon: <Warning />,
        gradient: `linear-gradient(135deg, #f44336 0%, #d32f2f ${urgency * 50}%, #b71c1c 100%)`,
        shadowColor: 'rgba(244, 67, 54, 0.4)',
        action: 'Pagar Ahora',
        actionIcon: <Payment />
      };
    }

    if (isBefore(dueDate, threeDaysFromNow)) {
      return {
        label: 'Próximo',
        color: theme.palette.warning.main,
        chipColor: 'warning',
        icon: <Schedule />,
        gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        shadowColor: 'rgba(255, 152, 0, 0.3)',
        action: 'Programar Pago',
        actionIcon: <NotificationAdd />
      };
    }

    return {
      label: 'Pendiente',
      color: theme.palette.info.main,
      chipColor: 'info',
      icon: <CalendarToday />,
      gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
      shadowColor: 'rgba(33, 150, 243, 0.3)',
      action: 'Ver Detalles',
      actionIcon: <Visibility />
    };
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

  // ✅ TODAS LAS FUNCIONES DEL VISOR DE COMPROBANTES ELIMINADAS COMPLETAMENTE
  // - handleViewReceipt (completamente eliminada)
  // - handleCloseReceiptViewer (completamente eliminada)

  const handleCommitmentSaved = async () => {
    console.log('🔄 [DEBUG] handleCommitmentSaved iniciado');
    console.log('🔍 [DEBUG] Compromiso seleccionado antes de actualizar:', selectedCommitment?.id);
    
    // Cerrar el modal de edición
    setEditDialogOpen(false);
    setSelectedCommitment(null);
    
    // Recargar la página actual directamente - SIMPLE Y EFECTIVO
    try {
      setLoading(true);
      console.log('🔄 [DEBUG] Recargando datos después de guardar compromiso...');
      
      const total = await getTotalCount();
      console.log('📊 [DEBUG] Total compromisos después de actualizar:', total);
      setTotalCommitments(total);
      
      await loadCommitmentsPage(currentPage);
      console.log('✅ [DEBUG] Página recargada exitosamente');
      
      // Agregar notificación de éxito
      addNotification({
        type: 'success',
        title: '¡Compromiso actualizado!',
        message: 'Los cambios se han guardado correctamente',
        icon: '💾'
      });
    } catch (error) {
      console.error('❌ [DEBUG] Error recargando después de guardar:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error actualizando la vista, por favor recarga la página',
        icon: '❌'
      });
    } finally {
      setLoading(false);
      console.log('🏁 [DEBUG] handleCommitmentSaved finalizado');
    }
  };

  // Compartir desde el popup (Web Share API con fallback a portapapeles)
  const handleShareFromPopup = async () => {
    if (!selectedCommitment) return;

    try {
      const title = `Compromiso: ${selectedCommitment?.name || ''}`.trim();
      const amount = selectedCommitment?.amount ? `$${Number(selectedCommitment.amount).toLocaleString('es-CO')}` : '';
      const due = selectedCommitment?.dueDate && safeToDate(selectedCommitment.dueDate)
        ? format(safeToDate(selectedCommitment.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: es })
        : 'Sin fecha';
      const company = (selectedCommitment?.companyName || selectedCommitment?.company || companyData?.name || '').trim();

      const text = [
        title,
        company ? `Empresa: ${company}` : null,
        amount ? `Monto: ${amount}` : null,
        `Vence: ${due}`
      ].filter(Boolean).join('\n');

      if (navigator.share) {
        try {
          await navigator.share({ title, text });
          addNotification({ type: 'success', title: 'Compartido', message: 'Se abrió el panel de compartir', icon: '📤' });
          return;
        } catch (err) {
          // Si el usuario cancela, no mostrar error ruidoso
          if (err?.name === 'AbortError') return;
          // Continuar al fallback
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        addNotification({ type: 'success', title: 'Copiado', message: 'Resumen copiado al portapapeles', icon: '📋' });
      } else {
        addNotification({ type: 'warning', title: 'No disponible', message: 'Tu navegador no permite compartir ni copiar automáticamente', icon: '⚠️' });
      }
    } catch (error) {
      addNotification({ type: 'error', title: 'Error al compartir', message: 'Intenta nuevamente más tarde', icon: '❌' });
    }
  };
  // El componente CommitmentEditForm manejará el cierre
  // Los datos se actualizarán automáticamente por el listener en tiempo real

  // Funciones de manejo de paginación spectacular - SIMPLIFICADO
  const handlePageChange = async (newPage) => {
    console.log(`🔄 Cambiando a página ${newPage}`);
    if (newPage !== currentPage && newPage >= 1) {
      setCurrentPage(newPage);
      // Forzar recarga inmediata
      try {
        setLoading(true);
        await loadCommitmentsPage(newPage);
      } catch (error) {
        console.error('Error al cambiar página:', error);
        setError('Error al cargar la página');
      } finally {
        setLoading(false);
      }
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

    console.group(`🗑️ ELIMINANDO COMPROMISO: ${commitmentToDelete.concept || commitmentToDelete.description || commitmentToDelete.id}`);
    
    try {
      // 1. Análisis previo de archivos
      const filesToDelete = [];
      
      console.log('📋 Analizando archivos asociados...');
      console.log('📊 Datos del compromiso:', {
        id: commitmentToDelete.id,
        receiptUrl: commitmentToDelete.receiptUrl ? '✅ Presente' : '❌ No presente',
        receiptUrls: commitmentToDelete.receiptUrls ? `✅ Array con ${commitmentToDelete.receiptUrls.length} elementos` : '❌ No presente',
        attachments: commitmentToDelete.attachments ? `✅ Array con ${commitmentToDelete.attachments.length} elementos` : '❌ No presente'
      });

      // Función avanzada para debug y extracción de paths
      const debugAndExtractPath = (url, type = 'archivo') => {
        console.group(`🔍 Analizando ${type}`);
        console.log('URL original:', url);
        
        if (!url) {
          console.log('❌ URL vacía o undefined');
          console.groupEnd();
          return null;
        }
        
        try {
          const urlObj = new URL(url);
          console.log('✅ URL válida:', {
            protocol: urlObj.protocol,
            hostname: urlObj.hostname,
            pathname: urlObj.pathname,
            search: urlObj.search
          });
          
          // Verificar si es Firebase Storage
          const isFirebaseStorage = url.includes('firebase') && (url.includes('googleapis.com') || url.includes('firebasestorage'));
          console.log('Es Firebase Storage:', isFirebaseStorage);
          
          if (!isFirebaseStorage) {
            console.log('⚠️ No es una URL de Firebase Storage válida');
            console.groupEnd();
            return null;
          }
          
          let extractedPath = null;
          
          // Método 1: URLs con token (formato /o/path?alt=media)
          if (url.includes('/o/') && url.includes('?alt=')) {
            const pathMatch = url.match(/\/o\/(.+?)\?/);
            if (pathMatch && pathMatch[1]) {
              extractedPath = decodeURIComponent(pathMatch[1]);
              console.log('✅ Método 1 exitoso - Path extraído:', extractedPath);
              console.groupEnd();
              return extractedPath;
            }
            console.log('⚠️ Método 1 falló - no se encontró match');
          }
          
          // Método 2: URLs directas
          if (url.includes('firebasestorage.googleapis.com')) {
            const pathParts = urlObj.pathname.split('/');
            console.log('🔍 Path parts:', pathParts);
            
            if (pathParts.length > 4) {
              // Buscar patrón /v0/b/bucket/o/path
              const bucketIndex = pathParts.findIndex(part => part === 'b');
              const oIndex = pathParts.findIndex(part => part === 'o');
              
              if (bucketIndex !== -1 && oIndex !== -1 && oIndex > bucketIndex) {
                extractedPath = pathParts.slice(oIndex + 1).join('/');
                if (extractedPath) {
                  extractedPath = decodeURIComponent(extractedPath);
                  console.log('✅ Método 2 exitoso - Path extraído:', extractedPath);
                  console.groupEnd();
                  return extractedPath;
                }
              }
            }
            console.log('⚠️ Método 2 falló - estructura no reconocida');
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
              console.log(`✅ Método 3.${i+1} exitoso - Path extraído:`, extractedPath);
              console.groupEnd();
              return extractedPath;
            }
          }
          
          console.log('❌ Ningún método pudo extraer el path');
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
        console.log('� Procesando receiptUrl...');
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
        console.log(`📎 Procesando receiptUrls (${commitmentToDelete.receiptUrls.length} elementos)...`);
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
        console.log(`📎 Procesando attachments (${commitmentToDelete.attachments.length} elementos)...`);
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
      
      console.log(`🎯 RESUMEN: ${filesToDelete.length} archivos válidos encontrados para eliminar`);
      filesToDelete.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.type})`);
        console.log(`      Path: ${file.path}`);
      });
      
      // 5. Eliminar cada archivo de Storage con monitoreo detallado
      let deletedFiles = [];
      let failedFiles = [];
      
      for (let i = 0; i < filesToDelete.length; i++) {
        const fileInfo = filesToDelete[i];
        console.group(`🔥 Eliminando archivo ${i + 1}/${filesToDelete.length}: ${fileInfo.name}`);
        
        try {
          console.log('� Path del archivo:', fileInfo.path);
          console.log('🔗 URL original:', fileInfo.url);
          
          const fileRef = ref(storage, fileInfo.path);
          console.log('📋 Referencia creada:', fileRef.fullPath);
          
          await deleteObject(fileRef);
          
          deletedFiles.push(fileInfo.name);
          console.log(`✅ ${fileInfo.name} eliminado exitosamente`);
          
        } catch (storageError) {
          console.error(`❌ Error eliminando ${fileInfo.name}:`, storageError);
          console.log(`🔍 URL problemática: ${fileInfo.url}`);
          console.log(`🔍 Path intentado: ${fileInfo.path}`);
          console.log(`� Código de error: ${storageError.code}`);
          console.log(`🔍 Mensaje de error: ${storageError.message}`);
          
          failedFiles.push({
            name: fileInfo.name,
            error: storageError.code || storageError.message
          });
        }
        
        console.groupEnd();
      }

      // 2. Eliminar pagos relacionados con este compromiso
      console.log('🧹 Buscando pagos relacionados con el compromiso...');
      let deletedPayments = 0;
      let failedPaymentDeletions = 0;
      
      try {
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('commitmentId', '==', commitmentToDelete.id)
        );
        
        const paymentsSnapshot = await getDocs(paymentsQuery);
        console.log(`📋 Pagos encontrados: ${paymentsSnapshot.size}`);
        
        if (paymentsSnapshot.size > 0) {
          // Eliminar cada pago encontrado
          for (const paymentDoc of paymentsSnapshot.docs) {
            try {
              const paymentData = paymentDoc.data();
              console.log(`🗑️ Eliminando pago: ${paymentDoc.id} (Monto: ${formatCurrency(paymentData.amount || 0)})`);
              
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
                  console.log(`🔥 Eliminando archivo de pago: ${fileInfo.name}`);
                  const fileRef = ref(storage, fileInfo.path);
                  await deleteObject(fileRef);
                  deletedFiles.push(fileInfo.name);
                  console.log(`✅ ${fileInfo.name} eliminado exitosamente`);
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
              console.log(`✅ Pago ${paymentDoc.id} eliminado exitosamente`);
              
            } catch (paymentError) {
              console.error(`❌ Error eliminando pago ${paymentDoc.id}:`, paymentError);
              failedPaymentDeletions++;
            }
          }
        } else {
          console.log('ℹ️ No se encontraron pagos asociados con este compromiso');
        }
        
      } catch (paymentsError) {
        console.error('❌ Error consultando pagos relacionados:', paymentsError);
        failedPaymentDeletions++;
      }

      console.log(`📊 RESULTADO PAGOS: ${deletedPayments} eliminados, ${failedPaymentDeletions} fallos`);

      // 3. Eliminar el documento de Firestore
      console.log('🗑️ Eliminando documento de Firestore...');
      await deleteDoc(doc(db, 'commitments', commitmentToDelete.id));
      console.log('✅ Documento eliminado de Firestore exitosamente');
      
      // 4. Actualizar estado local
      console.log(`� Actualizando estado local: ${commitmentToDelete.concept} (ID: ${commitmentToDelete.id})`);
      setCommitments(prevCommitments => {
        const filtered = prevCommitments.filter(c => c.id !== commitmentToDelete.id);
        console.log(`📊 Compromisos: ${prevCommitments.length} → ${filtered.length}`);
        return filtered;
      });
      
      // 5. Limpiar caché del Service Worker (opcional)
      console.log(`🧹 Limpiando caché del Service Worker...`);
      // Limpiar caché básico si está disponible
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        console.log(`✅ Service Worker cache cleared via message`);
      }
      
      // 6. Recargar datos
      console.log(`🔄 Recargando datos después de eliminación...`);
      try {
        const total = await getTotalCount();
        setTotalCommitments(total);
        
        // Si eliminamos el último elemento de la página, ir a la página anterior
        const totalPages = Math.ceil(total / paginationConfig.itemsPerPage);
        let targetPage = currentPage;
        if (currentPage > totalPages && totalPages > 0) {
          targetPage = totalPages;
          setCurrentPage(targetPage);
        }
        
        await loadCommitmentsPage(targetPage);
      } catch (error) {
        console.error('Error recargando después de eliminar:', error);
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
      
      console.log(`🎉 ELIMINACIÓN COMPLETADA`);
      console.log(`   📋 Compromiso: "${commitmentToDelete.concept || commitmentToDelete.description || 'Sin concepto'}"`);
      console.log(`   📁 Archivos eliminados: ${deletedFiles.length}`);
      console.log(`   💰 Pagos eliminados: ${deletedPayments}`);
      console.log(`   ❌ Fallos totales: ${failedFiles.length + failedPaymentDeletions}`);
      
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
    }
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCommitmentToDelete(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
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

  if (commitments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ textAlign: 'center', py: 4 }}>
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
      {/* Contenido principal según modo de vista */}
      {viewMode === 'list' ? (
        // Vista Lista Spectacular - Design System Premium v3.0
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
                      {showTooltips ? (
                        <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                          <Chip 
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            variant="outlined"
                            size="small"
                            sx={getTransparentChipStyles(statusInfo.color)}
                          />
                        </Tooltip>
                      ) : (
                        <Chip 
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          variant="outlined"
                          size="small"
                          sx={getTransparentChipStyles(statusInfo.color)}
                        />
                      )}
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
                          <Tooltip title="Marcar como pagado" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => navigate('/payments/new')}
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
                            onClick={() => navigate('/payments/new')}
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
                key={commitment.id}
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
              <Box key={commitment.id} sx={{ mb: spacing.grid }}>
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
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
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
                  key={commitment.id}
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
                    gridTemplateColumns: '0.8fr 2fr 1.5fr 1.2fr 1fr 0.8fr',
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
                          variant="caption" 
                          sx={{
                            display: 'block',
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          Para: {commitment.beneficiary}
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

                    {/* Monto con AmountDisplayDS3 */}
                    <Box sx={{ textAlign: 'center' }}>
                      <AmountDisplayDS3 
                        amount={commitment.amount}
                        animate={animationsEnabled}
                        theme={theme}
                      />
                    </Box>

                    {/* Fecha con DateDisplayDS3 */}
                    <Box sx={{ textAlign: 'center' }}>
                      <DateDisplayDS3
                        date={commitment.dueDate}
                        variant="standard"
                        showDaysRemaining
                        isOverdue={isOverdue}
                        isDueSoon={isDueSoon}
                        isPaid={commitment.paid || commitment.isPaid}
                        theme={theme}
                      />
                    </Box>

                    {/* Acciones */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 0.5,
                      justifyContent: 'center'
                    }}>
                      {showTooltips ? (
                        <>
                          <Tooltip title="Ver detalles" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewCommitment(commitment)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* ✅ NUEVO: Botón condicional "Marcar Pagado" - Solo aparece si NO está pagado */}
                          {!commitment.paid && !commitment.isPaid && (
                            <Tooltip title="Marcar como pagado" arrow>
                              <IconButton
                                size="small"
                                onClick={() => navigate('/payments/new')}
                                sx={{ 
                                  color: 'success.main',
                                  '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                }}
                              >
                                <Payment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Editar" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditFromCard(commitment)}
                              sx={{ 
                                color: 'warning.main',
                                '&:hover': { backgroundColor: 'rgba(237, 108, 2, 0.1)' }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCommitment(commitment)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }
                              }}
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
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          {/* ✅ NUEVO: Botón condicional "Marcar Pagado" - Solo aparece si NO está pagado */}
                          {!commitment.paid && !commitment.isPaid && (
                            <IconButton
                              size="small"
                              onClick={() => navigate('/payments/new')}
                              sx={{ 
                                color: 'success.main',
                                '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                              }}
                            >
                              <Payment fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleEditFromCard(commitment)}
                            sx={{ 
                              color: 'warning.main',
                              '&:hover': { backgroundColor: 'rgba(237, 108, 2, 0.1)' }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCommitment(commitment)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
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
                key={commitment.id}
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
                        border: `1px solid ${darkColors.cardBorder}`,
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: darkColors.hoverBackground,
                          transition: 'left 0.6s ease-out',
                          zIndex: 1
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${darkColors.shadowColor}`,
                          '&::before': {
                            left: '100%'
                          }
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
                          {showTooltips ? (
                            <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                              <Chip
                                icon={statusInfo.icon}
                                label={statusInfo.label}
                                variant="outlined"
                                size="small"
                                sx={getTransparentChipStyles(statusInfo.color)}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              variant="outlined"
                              size="small"
                              sx={{
                                fontWeight: 500,
                                borderRadius: '20px',
                                borderColor: statusInfo.color,
                                color: statusInfo.color,
                                backgroundColor: 'transparent !important',
                                '& .MuiChip-icon': {
                                  color: statusInfo.color
                                },
                                '& .MuiChip-label': {
                                  fontSize: '0.75rem'
                                }
                              }}
                            />
                          )}
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
                                  <Tooltip title="Marcar como pagado" arrow>
                                    <IconButton 
                                      size="small" 
                                      sx={{ mr: 1 }}
                                      onClick={() => navigate('/payments/new')}
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
                      border: `1px solid ${darkColors.cardBorder}`,
                      borderRadius: 2,
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${darkColors.shadowColor}`
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
                        {showTooltips ? (
                          <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              variant="outlined"
                              size="small"
                              sx={{
                                fontWeight: 500,
                                borderRadius: '20px',
                                borderColor: statusInfo.color,
                                color: statusInfo.color,
                                backgroundColor: 'transparent !important',
                                '& .MuiChip-icon': {
                                  color: statusInfo.color
                                },
                                '& .MuiChip-label': {
                                  fontSize: '0.75rem'
                                }
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            variant="outlined"
                            size="small"
                            sx={{
                              fontWeight: 500,
                              borderRadius: '20px',
                              borderColor: statusInfo.color,
                              color: statusInfo.color,
                              backgroundColor: 'transparent !important',
                              '& .MuiChip-icon': {
                                color: statusInfo.color
                              },
                              '& .MuiChip-label': {
                                fontSize: '0.75rem'
                              }
                            }}
                          />
                        )}
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
                                <Tooltip title="Marcar como pagado" arrow>
                                  <IconButton 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                    onClick={() => navigate('/payments/new')}
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
                                  onClick={() => navigate('/payments/new')}
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

      {/* Diálogo de vista detallada - Premium Design System v2.1 */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: '24px', // Margen fijo y seguro
            maxHeight: 'calc(100vh - 48px)', // Altura segura
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            position: 'relative',
            // Shimmer effect premium
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 3s infinite',
              zIndex: 1
            },
            '& @keyframes pulse': {
              '0%, 100%': { 
                boxShadow: `0 0 0 0 ${theme.palette.primary.main}40` 
              },
              '50%': { 
                boxShadow: `0 0 0 10px ${theme.palette.primary.main}00` 
              }
            },
            '& @keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            },
            '& @keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(180deg)' }
            }
          }
        }}
      >
        {selectedCommitment && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 120,
              duration: 0.6 
            }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            {/* Header Premium Spectacular */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 100,
                delay: 0.1 
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  p: 3,
                  borderRadius: '16px 16px 0 0',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                    zIndex: 1
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    animation: 'float 6s ease-in-out infinite',
                    zIndex: 1
                  },
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(180deg)' }
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 2 }}>
                  <Box display="flex" alignItems="center" gap={2.5}>
                    {/* Logo de empresa en lugar del icono ojo */}
                    <motion.div
                      initial={{ scale: 0.8, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2.5,
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            animation: 'shimmer 2s infinite'
                          }
                        }}
                      >
                        {companyData?.logoURL ? (
                          <Box
                            component="img"
                            src={companyData.logoURL}
                            alt={`Logo de ${companyData.name}`}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              objectFit: 'contain',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              zIndex: 1
                            }}
                          />
                        ) : (
                          <Business sx={{ fontSize: 28, color: 'white', zIndex: 1 }} />
                        )}
                      </Box>
                    </motion.div>
                    
                    {/* Información compacta del compromiso */}
                    <Box>
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontSize: '1.25rem' }}>
                          {selectedCommitment?.concept || selectedCommitment?.description || 'Sin concepto'}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 800, 
                              fontSize: '1.4rem',
                              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              color: 'rgba(255, 255, 255, 0.95)'
                            }}
                          >
                            ${selectedCommitment?.amount?.toLocaleString() || '0'}
                          </Typography>
                          {companyData && (
                            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                              • {companyData.name}
                            </Typography>
                          )}
                        </Box>
                        {/* Nueva fila con información adicional */}
                        <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                          <Typography variant="body2" sx={{ 
                            opacity: 0.85, 
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}>
                            {(() => {
                              switch(selectedCommitment?.periodicity) {
                                case 'unique': return '🔄 Pago único';
                                case 'monthly': return '📅 Mensual';
                                case 'bimonthly': return '📅 Bimestral';
                                case 'quarterly': return '📅 Trimestral';
                                case 'fourmonthly': return '📅 Cuatrimestral';
                                case 'biannual': return '📅 Semestral';
                                case 'annual': return '📅 Anual';
                                default: return '📅 Mensual';
                              }
                            })()}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            opacity: 0.85, 
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}>
                            • {(() => {
                              switch(selectedCommitment?.paymentMethod) {
                                case 'transfer': return '🏦 Transferencia';
                                case 'cash': return '💵 Efectivo';
                                case 'pse': return '💳 PSE';
                                case 'check': return '📝 Cheque';
                                case 'card': return '💳 Tarjeta';
                                default: return '🏦 Transferencia';
                              }
                            })()}
                          </Typography>
                          {(() => {
                            const status = getCommitmentStatus(selectedCommitment);
                            const colors = getStatusColor(status, theme);
                            return (
                              <Box
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1.5,
                                  background: colors.bg,
                                  border: `1px solid ${colors.border}`,
                                  backdropFilter: 'blur(10px)'
                                }}
                              >
                                <Typography variant="caption" sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  color: 'rgba(255, 255, 255, 0.95)'
                                }}>
                                  {status.emoji} {status.text}
                                </Typography>
                              </Box>
                            );
                          })()}
                        </Box>
                      </motion.div>
                    </Box>
                  </Box>

                  {/* Lado derecho: Estado + Botón cerrar */}
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      {/* Estado del compromiso */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <Chip
                          icon={getStatusInfo(selectedCommitment).icon}
                          label={getStatusInfo(selectedCommitment).label}
                          size="medium"
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      </motion.div>

                      {/* Botón de cerrar */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <IconButton
                          onClick={handleCloseViewDialog}
                          sx={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.3)',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <Close />
                        </IconButton>
                      </motion.div>
                    </Box>
                  </motion.div>
                </Box>
              </Box>
            </motion.div>
            
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Progreso de Tiempo */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
                  >
                    <TimeProgress 
                      dueDate={selectedCommitment.dueDate} 
                      createdAt={selectedCommitment.createdAt || new Date()} 
                      isPaid={selectedCommitment.paid || selectedCommitment.isPaid}
                    />
                  </motion.div>
                </Grid>

                {/* Fecha de Vencimiento - Diseño agradable recuperado */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 120 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2.5}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 2.5,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            <CalendarToday sx={{ color: 'white', fontSize: 28 }} />
                          </Box>
                        </motion.div>
                        
                        <Box flex={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                            Fecha de Vencimiento
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: 'text.primary',
                            textTransform: 'capitalize',
                            mb: 0.2
                          }}>
                            {format(selectedCommitment.dueDate, 'EEEE', { locale: es })}
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 500,
                            color: 'text.secondary'
                          }}>
                            {format(selectedCommitment.dueDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Información Adicional - Diseño agradable recuperado */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        background: gradients.paper,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderRadius: 4,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        position: 'relative',
                        overflow: 'hidden',
                        ...shimmerEffect
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 3, 
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Info sx={{ fontSize: 24 }} />
                          Información Adicional
                        </Typography>
                        
                        <Grid container spacing={{ xs: 2, sm: 3 }}>
                          {/* Primera fila: Beneficiario y Método de Pago */}
                          <Grid item xs={12} sm={6}>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(theme.palette.info.light, 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Person sx={{ color: 'info.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.main' }}>
                                    Beneficiario
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary',
                                  fontStyle: selectedCommitment.beneficiary ? 'normal' : 'italic',
                                  opacity: selectedCommitment.beneficiary ? 1 : 0.7
                                }}>
                                  {selectedCommitment.beneficiary || 'No especificado'}
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.light, 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Payment sx={{ color: 'success.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    Método de Pago
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {(() => {
                                    switch(selectedCommitment.paymentMethod) {
                                      case 'transfer': return '🏦 Transferencia';
                                      case 'cash': return '💵 Efectivo';
                                      case 'pse': return '💳 PSE';
                                      case 'check': return '📝 Cheque';
                                      case 'card': return '💳 Tarjeta';
                                      default: return '🏦 Transferencia';
                                    }
                                  })()}
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>

                          {/* Segunda fila: Periodicidad y Empresa */}
                          <Grid item xs={12} sm={6}>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)}, ${alpha(theme.palette.warning.light, 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Schedule sx={{ color: 'warning.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                    Periodicidad
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {(() => {
                                    switch(selectedCommitment.periodicity) {
                                      case 'unique': return '🔄 Pago único';
                                      case 'monthly': return '📅 Mensual';
                                      case 'bimonthly': return '📅 Bimestral';
                                      case 'quarterly': return '📅 Trimestral';
                                      case 'fourmonthly': return '📅 Cuatrimestral';
                                      case 'biannual': return '📅 Semestral';
                                      case 'annual': return '📅 Anual';
                                      default: return '📅 Mensual';
                                    }
                                  })()}
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.55, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.secondary.light, 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Business sx={{ color: 'secondary.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                    Empresa
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  {companyData?.logoURL ? (
                                    <Box
                                      component="img"
                                      src={companyData.logoURL}
                                      alt={`Logo de ${companyData.name}`}
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 1,
                                        objectFit: 'contain',
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                                      }}
                                    />
                                  ) : (
                                    <Business sx={{ fontSize: 20, color: 'text.secondary' }} />
                                  )}
                                  <Typography variant="body1" sx={{ 
                                    fontWeight: 500,
                                    color: 'text.primary'
                                  }}>
                                    {companyData?.name || 'Empresa no especificada'}
                                  </Typography>
                                </Box>
                              </Box>
                            </motion.div>
                          </Grid>

                          {/* Tercera fila: Observaciones (full width) */}
                          <Grid item xs={12}>
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.light, 0.03)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <Notes sx={{ color: 'primary.main', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    Observaciones
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 400,
                                  lineHeight: 1.6,
                                  color: 'text.primary',
                                  fontStyle: selectedCommitment.observations ? 'normal' : 'italic',
                                  opacity: selectedCommitment.observations ? 1 : 0.7
                                }}>
                                  {selectedCommitment.observations || 'Sin observaciones adicionales'}
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>

                          {/* Cuarta fila: Fechas del sistema */}
                          <Grid item xs={12} md={6}>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.65, duration: 0.3 }}
                            >
                              <Box sx={{
                                p: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.08)}, ${alpha(theme.palette.grey[400], 0.04)})`,
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.grey[500], 0.15)}`,
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                  <AccessTime sx={{ color: 'text.secondary', fontSize: 20 }} />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Fecha de Creación
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {selectedCommitment.createdAt && safeToDate(selectedCommitment.createdAt)
                                    ? format(safeToDate(selectedCommitment.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                    : 'No disponible'
                                  }
                                </Typography>
                              </Box>
                            </motion.div>
                          </Grid>

                          {selectedCommitment.updatedAt && (
                            <Grid item xs={12} md={6}>
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7, duration: 0.3 }}
                              >
                                <Box sx={{
                                  p: 2.5,
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)}, ${alpha(theme.palette.error.light, 0.04)})`,
                                  borderRadius: 3,
                                  border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}>
                                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                    <Edit sx={{ color: 'error.main', fontSize: 20 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'error.main' }}>
                                      Última Modificación
                                    </Typography>
                                  </Box>
                                  <Typography variant="body1" sx={{ 
                                    fontWeight: 500,
                                    color: 'text.primary'
                                  }}>
                                    {selectedCommitment.updatedAt && safeToDate(selectedCommitment.updatedAt)
                                      ? format(safeToDate(selectedCommitment.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                                      : 'No disponible'
                                    }
                                  </Typography>
                                </Box>
                              </motion.div>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Archivos Adjuntos - MEJORADO */}
                {selectedCommitment.attachments && selectedCommitment.attachments.length > 0 && (
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    >
                      <Card
                        sx={{
                          p: 3,
                          background: gradients.infoCard,
                          border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          borderRadius: 4,
                          boxShadow: '0 8px 32px rgba(33, 150, 243, 0.15)',
                          position: 'relative',
                          overflow: 'hidden',
                          ...shimmerEffect
                        }}
                      >
                        <Box sx={{ position: 'relative', zIndex: 2 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            mb: 3, 
                            color: 'info.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <AttachFile sx={{ fontSize: 24 }} />
                            Archivos Adjuntos
                            <Chip
                              label={selectedCommitment.attachments.length}
                              size="small"
                              sx={{
                                ml: 1,
                                background: theme.palette.background.paper,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {selectedCommitment.attachments.map((attachment, index) => {
                              const getFileIcon = (fileName) => {
                                const extension = fileName.split('.').pop().toLowerCase();
                                switch (extension) {
                                  case 'pdf': return '📄';
                                  case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
                                  case 'doc': case 'docx': return '📝';
                                  case 'xls': case 'xlsx': return '📊';
                                  case 'txt': return '📄';
                                  default: return '📎';
                                }
                              };

                              const getFileSize = (bytes) => {
                                if (!bytes) return 'Tamaño desconocido';
                                if (bytes < 1024) return bytes + ' B';
                                if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                                return (bytes / 1048576).toFixed(1) + ' MB';
                              };

                              return (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                  >
                                    <Box sx={{
                                      p: 2.5,
                                      background: theme.palette.background.paper,
                                      borderRadius: 1,
                                      border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                                      
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        borderColor: theme.palette.info.main,
                                        background: theme.palette.background.paper,
                                        boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.2)}`
                                      }
                                    }}>
                                      <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                                        <Typography sx={{ fontSize: '1.5rem' }}>
                                          {getFileIcon(attachment.name || 'archivo')}
                                        </Typography>
                                        <Box flex={1} minWidth={0}>
                                          <Typography variant="subtitle2" sx={{ 
                                            fontWeight: 600,
                                            color: 'text.primary',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {attachment.name || 'Archivo sin nombre'}
                                          </Typography>
                                          <Typography variant="caption" sx={{ 
                                            color: 'text.secondary',
                                            fontSize: '0.75rem'
                                          }}>
                                            {getFileSize(attachment.size)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      
                                      <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" sx={{ 
                                          color: 'info.main',
                                          fontWeight: 500,
                                          fontSize: '0.7rem'
                                        }}>
                                          {attachment.uploadedAt && safeToDate(attachment.uploadedAt)
                                            ? format(safeToDate(attachment.uploadedAt), "dd/MM/yyyy", { locale: es })
                                            : 'Fecha desconocida'
                                          }
                                        </Typography>
                                        <Box display="flex" gap={0.5}>
                                          <Tooltip title="Ver archivo">
                                            <IconButton 
                                              size="small" 
                                              sx={{ 
                                                color: 'info.main',
                                                '&:hover': { 
                                                  background: alpha(theme.palette.info.main, 0.1) 
                                                }
                                              }}
                                            >
                                              <Visibility sx={{ fontSize: 16 }} />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Descargar">
                                            <IconButton 
                                              size="small" 
                                              sx={{ 
                                                color: 'success.main',
                                                '&:hover': { 
                                                  background: alpha(theme.palette.success.main, 0.1) 
                                                }
                                              }}
                                            >
                                              <GetApp sx={{ fontSize: 16 }} />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>
                                    </Box>
                                  </motion.div>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
                <DialogActions 
                  sx={{ 
                    p: 4,
                    pb: 6, // Padding inferior fijo y razonable
                    background: `
                      linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%),
                      linear-gradient(225deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)
                    `,
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60%',
                      height: 1,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)'
                    }
                  }}
                >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  onClick={handleCloseViewDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 12,
                    px: 4,
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.3)}`,
                    color: theme.palette.text.secondary,
                    backgroundColor: 'transparent',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: theme.palette.background.paper,
                      transition: 'all 0.5s ease'
                    },
                    '&:hover': {
                      borderColor: alpha(theme.palette.text.primary, 0.3),
                      backgroundColor: 'transparent !important',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.text.primary, 0.15)}`,
                      '&::before': {
                        left: '100%'
                      }
                    },
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  Cerrar
                </Button>
              </motion.div>
              
              <Box display="flex" gap={2.5}>
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={handleShareFromPopup}
                    sx={{ 
                      borderRadius: 999,
                      px: 4,
                      py: 1.25,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'secondary.main',
                      borderWidth: 2,
                      borderColor: 'transparent',
                      background: theme => `
                        linear-gradient(${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.95)}) padding-box,
                        linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main}) border-box
                      `,
                      boxShadow: theme => theme.palette.mode === 'dark'
                        ? '0 6px 18px rgba(233, 30, 99, 0.22)'
                        : '0 8px 22px rgba(233, 30, 99, 0.24)',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 10px 26px rgba(233, 30, 99, 0.28)'
                          : '0 12px 30px rgba(233, 30, 99, 0.32)'
                      }
                    }}
                  >
                    Compartir
                  </Button>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button 
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEditFromPopup}
                    disabled={false /* Ajustar con permisos/estado si aplica */}
                    sx={{ 
                      borderRadius: 999,
                      px: 4,
                      py: 1.25,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#fff',
                      background: theme => `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.98)}, ${alpha(theme.palette.primary.main, 0.98)})`,
                      boxShadow: theme => theme.palette.mode === 'dark'
                        ? '0 10px 26px rgba(102,126,234,0.42), 0 2px 10px rgba(0,0,0,0.25)'
                        : '0 14px 34px rgba(102,126,234,0.50), 0 3px 12px rgba(0,0,0,0.10)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 14px 36px rgba(102,126,234,0.48)'
                          : '0 18px 40px rgba(102,126,234,0.58)'
                      },
                      '&.Mui-disabled': {
                        color: theme => alpha(theme.palette.common.white, 0.7),
                        background: theme => `linear-gradient(135deg, ${alpha(theme.palette.grey[300], 0.55)}, ${alpha(theme.palette.grey[400], 0.45)})`,
                        boxShadow: theme => `0 10px 28px ${alpha(theme.palette.primary.main, 0.25)}`,
                        cursor: 'not-allowed'
                      }
                    }}
                  >
                    Editar
                  </Button>
                </motion.div>

                {/* ✅ BOTÓN "Marcar Pagado" ELIMINADO COMPLETAMENTE DEL POPUP DE VISTA PREVIA */}
              </Box>
            </DialogActions>
          </motion.div>
        )}
      </Dialog>

      {/* Formulario de edición compacto */}
      <CommitmentEditForm
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        commitment={selectedCommitment}
        onSaved={handleCommitmentSaved}
      />

      {/* ✅ VISOR DE COMPROBANTES DE PAGO ELIMINADO COMPLETAMENTE */}

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        commitment={commitmentToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Paginación Spectacular - Design System Premium v3.0 */}
      {!loading && commitments.length > 0 && (
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ marginTop: spacing.grid * 2 }}
        >
          <Card sx={{
            background: darkColors.cardBackground,
            border: `1px solid ${darkColors.cardBorder}`,
            borderRadius: 1,
            boxShadow: `0 2px 8px ${darkColors.shadowColor}`,
            position: 'relative',
            overflow: 'hidden'
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
    </Box>
  );
};

// Componente para Confirmar Eliminación
const DeleteConfirmDialog = ({ open, commitment, onConfirm, onCancel }) => {
  const theme = useTheme();
  
  if (!commitment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Warning sx={{ color: theme.palette.error.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Confirmar Eliminación
          </Typography>
        </Stack>
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
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          sx={{ borderRadius: 2 }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommitmentsList;
