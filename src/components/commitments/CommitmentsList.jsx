import React, { useState, useEffect, useCallback } from 'react';
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
  Receipt as ReceiptIcon,
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
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import { useThemeGradients, shimmerEffect } from '../../utils/designSystem';
import { unifiedTokens, enhancedTokenUtils } from '../../theme/tokens';

// 🚀 OPTIMIZACIÓN FASE 1: Performance hooks y cache
import useDebounce from '../../hooks/useDebounce';
import { firestoreCache } from '../../utils/FirestoreCache';
import { performanceLogger } from '../../utils/PerformanceLogger';

// 🚀 OPTIMIZACIÓN FASE 2: Virtual scrolling y lazy loading
import VirtualScrollList from '../common/VirtualScrollList';
import { queryOptimizer } from '../../utils/FirestoreQueryOptimizer';
import useServiceWorker from '../../hooks/useServiceWorker';
import useLazyData from '../../hooks/useLazyData';
import { useTableTokens } from '../../hooks/useTokens';
import useCommitmentAlerts from '../../hooks/useCommitmentAlerts';
import CommitmentEditForm from './CommitmentEditForm';
import PaymentReceiptViewer from './PaymentReceiptViewer';

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
const DateDisplayDS3 = ({ date, showDaysRemaining = false, variant = 'standard', theme }) => {
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
      {showDaysRemaining && (
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
  const debouncedSearchTerm = useDebounce(searchTerm, 500, 'search'); // 500ms para búsqueda
  const debouncedCompanyFilter = useDebounce(companyFilter, 300, 'company'); // 300ms para filtros
  const debouncedStatusFilter = useDebounce(statusFilter, 300, 'status');
  const debouncedYearFilter = useDebounce(yearFilter, 300, 'year');
  
  // 🚀 OPTIMIZACIÓN FASE 2: Service Worker para cache persistente
  const { isRegistered: swRegistered, clearCache: clearSWCache } = useServiceWorker();
  
  // 🎯 Virtual scrolling configuration
  const [virtualScrollEnabled, setVirtualScrollEnabled] = useState(false);
  const itemHeight = viewMode === 'cards' ? 160 : 80; // Altura por elemento
  const containerHeight = 600; // Altura del contenedor
  
  // 🎯 Hook mejorado para tokens de tabla - Sistema DS 3.0 Unificado
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
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Estados de paginación spectacular
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCommitments, setTotalCommitments] = useState(0);
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [firstVisibleDoc, setFirstVisibleDoc] = useState(null);
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

  // Función helper para verificar si un compromiso tiene pago válido
  const hasValidPayment = (commitment) => {
    return commitment.paid && (
      commitment.paymentDate || 
      commitment.paidAt || 
      commitment.receiptUrl ||
      commitment.receiptMetadata ||
      commitment.paymentReference
    );
  };

  // Reset página cuando cambian los filtros (OPTIMIZADO con debounce)
  useEffect(() => {
    setCurrentPage(1);
    setLastVisibleDoc(null);
    setFirstVisibleDoc(null);
    
    // 🚀 OPTIMIZACIÓN: Invalidar cache por patrón cuando cambian filtros
    firestoreCache.invalidatePattern(`commitments_${debouncedCompanyFilter || 'all'}_*`);
    setPaginationCache(new Map());
  }, [debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedYearFilter]);

  // 🚀 OPTIMIZACIÓN: Función para obtener el total con cache inteligente
  const getTotalCount = useCallback(async () => {
    try {
      // 🎯 Cache key basado en filtros debouncados
      const cacheKey = `count_${debouncedCompanyFilter || 'all'}_${debouncedYearFilter || 'all'}`;
      
      // ✅ Intentar obtener del cache primero (TTL: 2 minutos para conteo)
      const cachedCount = firestoreCache.get(cacheKey);
      if (cachedCount !== null) {
        performanceLogger.logCacheHit('firestore', cacheKey);
        return cachedCount;
      }

      let q = query(collection(db, 'commitments'));

      // Aplicar filtros con variables debouncadas
      if (debouncedCompanyFilter && debouncedCompanyFilter !== 'all') {
        q = query(q, where('companyId', '==', debouncedCompanyFilter));
      }
      
      if (debouncedYearFilter && debouncedYearFilter !== 'all') {
        const startDate = new Date(parseInt(debouncedYearFilter), 0, 1);
        const endDate = new Date(parseInt(debouncedYearFilter), 11, 31);
        q = query(q, where('dueDate', '>=', startDate), where('dueDate', '<=', endDate));
      }

      const countSnapshot = await getCountFromServer(q);
      const count = countSnapshot.data().count;
      
      // 💾 Guardar en cache (TTL: 2 minutos)
      firestoreCache.set(cacheKey, count, 2 * 60 * 1000);
      performanceLogger.logFirebaseRead('getCountFromServer', 1);
      
      return count;
    } catch (error) {
      console.error('Error getting count:', error);
      return 0;
    }
  }, [debouncedCompanyFilter, debouncedYearFilter]);

  // 🚀 OPTIMIZACIÓN FASE 2: Función para cargar página con query optimizer
  const loadCommitmentsPage = useCallback(async (pageNumber, pageSize = paginationConfig.itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);

      // 🎯 Cache key con filtros debouncados
      const cacheKey = `page_${pageNumber}_${debouncedCompanyFilter || 'all'}_${debouncedStatusFilter || 'all'}_${debouncedSearchTerm || ''}_${debouncedYearFilter || 'all'}`;
      
      // ✅ Verificar cache de Firestore primero (TTL: 1 minuto para páginas)
      const cachedPageData = firestoreCache.get(cacheKey);
      if (cachedPageData) {
        performanceLogger.logCacheHit('firestore-page', cacheKey);
        setCommitments(cachedPageData.commitments);
        setLastVisibleDoc(cachedPageData.lastVisible);
        setFirstVisibleDoc(cachedPageData.firstVisible);
        setLoading(false);
        return;
      }

      // 🔥 Fallback al cache local (pagination cache)
      if (paginationCache.has(cacheKey)) {
        const localCachedData = paginationCache.get(cacheKey);
        performanceLogger.logCacheHit('local-pagination', cacheKey);
        setCommitments(localCachedData.commitments);
        setLastVisibleDoc(localCachedData.lastVisible);
        setFirstVisibleDoc(localCachedData.firstVisible);
        setLoading(false);
        return;
      }

      // 🚀 FASE 2: Usar Query Optimizer para consultas optimizadas
      const optimizedQuery = await queryOptimizer.buildOptimizedCommitmentsQuery(
        {
          companyId: debouncedCompanyFilter !== 'all' ? debouncedCompanyFilter : null,
          year: debouncedYearFilter !== 'all' ? debouncedYearFilter : null,
          status: debouncedStatusFilter !== 'all' ? debouncedStatusFilter : null,
          searchTerm: debouncedSearchTerm
        },
        {
          pageSize,
          lastDoc: pageNumber > 1 ? lastVisibleDoc : null
        }
      );

      const snapshot = await getDocs(optimizedQuery);
      
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

      // Aplicar filtros locales restantes con variables debouncadas
      let filteredCommitments = commitmentsData;

      // Filtro por término de búsqueda (local) - DEBOUNCADO
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

      // Filtro por estado (local) - DEBOUNCADO
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

      // 🚀 OPTIMIZACIÓN: Doble cache (local + Firestore)
      const pageData = {
        commitments: filteredCommitments,
        firstVisible,
        lastVisible
      };

      // Cache local (inmediato)
      const newCache = new Map(paginationCache);
      newCache.set(cacheKey, pageData);
      setPaginationCache(newCache);

      // Cache Firestore (TTL: 1 minuto)
      firestoreCache.set(cacheKey, pageData, 60 * 1000);
      performanceLogger.logFirebaseRead('getDocs', filteredCommitments.length);

      setCommitments(filteredCommitments);
      setFirstVisibleDoc(firstVisible);
      setLastVisibleDoc(lastVisible);
      setLoading(false);

      // Notificar al componente padre
      if (onCommitmentsChange) {
        onCommitmentsChange(filteredCommitments);
      }

      // 🚀 FASE 2: Prefetch inteligente en background
      queryOptimizer.intelligentPrefetch({
        companyId: debouncedCompanyFilter !== 'all' ? debouncedCompanyFilter : null,
        year: debouncedYearFilter !== 'all' ? debouncedYearFilter : null,
        status: debouncedStatusFilter !== 'all' ? debouncedStatusFilter : null
      });

    } catch (error) {
      console.error('Error loading commitments page:', error);
      setError('Error al cargar los compromisos');
      setLoading(false);
    }
  }, [debouncedCompanyFilter, debouncedStatusFilter, debouncedSearchTerm, debouncedYearFilter, currentPage, paginationConfig.itemsPerPage, lastVisibleDoc, paginationCache, onCommitmentsChange]);

  // 🚀 OPTIMIZACIÓN: Cargar datos con filtros debouncados
  useEffect(() => {
    if (!currentUser) return;
    
    // Obtener total y cargar primera página con filtros debouncados
    const initialize = async () => {
      const total = await getTotalCount();
      setTotalCommitments(total);
      await loadCommitmentsPage(currentPage);
    };
    
    initialize();
  }, [currentUser, loadCommitmentsPage, getTotalCount, currentPage]);

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

  // Manejar visualización de comprobante de pago
  const handleViewReceipt = (commitment) => {
    // Verificar que el compromiso tenga pago válido
    if (!commitment.paid) {
      addNotification({
        type: 'warning',
        title: 'Compromiso no pagado',
        message: 'Este compromiso aún no ha sido marcado como pagado',
        icon: '⚠️'
      });
      return;
    }

    setSelectedCommitment(commitment);
    setReceiptViewerOpen(true);
  };

  const handleCloseReceiptViewer = () => {
    setReceiptViewerOpen(false);
    setSelectedCommitment(null);
  };

  const handleCommitmentSaved = () => {
    // Agregar notificación de éxito
    addNotification({
      type: 'success',
      title: '¡Compromiso actualizado!',
      message: 'Los cambios se han guardado correctamente',
      icon: '💾'
    });

    // El componente CommitmentEditForm manejará el cierre
    // Los datos se actualizarán automáticamente por el listener en tiempo real
  };

  // Funciones de manejo de paginación spectacular
  const handlePageChange = async (newPage) => {
    if (newPage !== currentPage && newPage >= 1) {
      setCurrentPage(newPage);
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

  // Manejar eliminación de compromiso
  const handleDeleteCommitment = async (commitment) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el compromiso "${commitment.concept || commitment.description || 'Sin concepto'}"?\n\nEsta acción eliminará el compromiso y todos sus archivos adjuntos de forma permanente.`
    );

    if (!confirmDelete) return;

    try {
      // 1. Eliminar archivos de Firebase Storage si existen
      const filesToDelete = [];
      
      // Eliminar comprobante de pago si existe
      if (commitment.receiptUrl) {
        try {
          // Extraer el path del archivo desde la URL de Firebase Storage
          let storagePath = '';
          
          if (commitment.receiptUrl.includes('firebase.googleapis.com')) {
            // URL con token: extraer path entre /o/ y ?alt=
            const pathMatch = commitment.receiptUrl.match(/\/o\/(.+?)\?/);
            if (pathMatch) {
              storagePath = decodeURIComponent(pathMatch[1]);
            }
          } else if (commitment.receiptUrl.includes('firebasestorage.googleapis.com')) {
            // URL directa: extraer path después del bucket
            const pathMatch = commitment.receiptUrl.match(/\/receipts\/.+$/);
            if (pathMatch) {
              storagePath = pathMatch[0].substring(1); // Remover la barra inicial
            }
          }
          
          if (storagePath) {
            const fileRef = ref(storage, storagePath);
            await deleteObject(fileRef);
            filesToDelete.push('comprobante de pago');
          }
        } catch (storageError) {
          console.warn('Error al eliminar comprobante de pago:', storageError);
          // Continuar con la eliminación del documento aunque falle la eliminación del archivo
        }
      }
      
      // Eliminar otros archivos adjuntos si existen
      if (commitment.attachments && Array.isArray(commitment.attachments)) {
        for (const attachment of commitment.attachments) {
          try {
            if (attachment.url) {
              let storagePath = '';
              
              if (attachment.url.includes('firebase.googleapis.com')) {
                const pathMatch = attachment.url.match(/\/o\/(.+?)\?/);
                if (pathMatch) {
                  storagePath = decodeURIComponent(pathMatch[1]);
                }
              } else if (attachment.url.includes('firebasestorage.googleapis.com')) {
                const pathMatch = attachment.url.match(/\/attachments\/.+$/);
                if (pathMatch) {
                  storagePath = pathMatch[0].substring(1);
                }
              }
              
              if (storagePath) {
                const fileRef = ref(storage, storagePath);
                await deleteObject(fileRef);
                filesToDelete.push(attachment.name || 'archivo adjunto');
              }
            }
          } catch (storageError) {
            console.warn('Error al eliminar archivo adjunto:', storageError);
          }
        }
      }

      // 2. Eliminar el documento de Firestore
      await deleteDoc(doc(db, 'commitments', commitment.id));
      
      // 3. Mostrar notificación de éxito
      const deletedFilesMessage = filesToDelete.length > 0 
        ? ` y ${filesToDelete.length} archivo${filesToDelete.length > 1 ? 's' : ''} adjunto${filesToDelete.length > 1 ? 's' : ''}` 
        : '';
      
      addNotification({
        type: 'success',
        title: '¡Compromiso eliminado!',
        message: `Se eliminó exitosamente el compromiso "${commitment.concept || commitment.description || 'Sin concepto'}"${deletedFilesMessage}`,
        icon: '🗑️'
      });

    } catch (error) {
      console.error('Error al eliminar compromiso:', error);
      
      // Mostrar notificación de error
      addNotification({
        type: 'error',
        title: 'Error al eliminar',
        message: 'No se pudo eliminar el compromiso completamente. Algunos archivos pueden no haberse eliminado.',
        icon: '❌'
      });
    }
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
              background: theme.palette.background.paper,
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
                    background: darkColors.hoverBackground,
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
                      background: `${alpha(theme.palette.background.paper, 0.6)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      
                      '&:hover': {
                        background: `${alpha(theme.palette.background.paper, 0.8)}`,
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
                        color={commitment.paid ? 'success.main' : (isOverdue ? 'error.main' : isDueSoon ? 'warning.main' : 'text.secondary')}
                        sx={{ 
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          lineHeight: 1.1
                        }}
                      >
                        {commitment.paid 
                          ? '' 
                          : (daysUntilDue >= 0 ? `${daysUntilDue} días restantes` : `${Math.abs(daysUntilDue)} días vencido`)
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    '& .MuiIconButton-root': {
                      background: theme.palette.background.paper,
                      
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                        background: theme.palette.background.paper
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
                        <Tooltip title="Validar pago" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewReceipt(commitment)}
                            sx={{ color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary' }}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
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
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewReceipt(commitment)}
                          sx={{ color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary' }}
                        >
                          <ReceiptIcon />
                        </IconButton>
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
                          <Tooltip title="Validar pago" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewReceipt(commitment)}
                              sx={{ 
                                color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary',
                                '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                              }}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                              onClick={() => handleDelete(commitment.id)}
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
                          <IconButton
                            size="small"
                            onClick={() => handleViewReceipt(commitment)}
                            sx={{ 
                              color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary',
                              '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                            }}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
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
                            onClick={() => handleDelete(commitment.id)}
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
                                <Tooltip title="Validar pago" arrow>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleViewReceipt(commitment)}
                                    sx={{ mr: 1, color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary' }}
                                  >
                                    <ReceiptIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
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
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewReceipt(commitment)}
                                  sx={{ mr: 1, color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary' }}
                                >
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
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
                              <Tooltip title="Validar pago" arrow>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewReceipt(commitment)}
                                  sx={{ mr: 1, color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary' }}
                                >
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
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
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewReceipt(commitment)}
                                sx={{ mr: 1, color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary' }}
                              >
                                <ReceiptIcon fontSize="small" />
                              </IconButton>
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`,
            boxShadow: '0 12px 50px rgba(0,0,0,0.25)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            overflow: 'hidden',
            position: 'relative',
            backdropFilter: 'blur(20px)',
            // Shimmer effect premium
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              animation: 'shimmer 3s infinite',
              zIndex: 1
            },
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' }
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
            {/* Header Premium con Gradiente Dinámico */}
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

                {/* Fecha de Vencimiento - Diseño consistente */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 120 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.03)})`,
                          zIndex: 0
                        }
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
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                zIndex: 1
                              }
                            }}
                          >
                            <CalendarToday sx={{ color: 'white', fontSize: 24, zIndex: 2, position: 'relative' }} />
                          </Box>
                        </motion.div>
                        
                        <Box flex={1} sx={{ position: 'relative', zIndex: 1 }}>
                          <Typography variant="body2" sx={{ 
                            mb: 0.5, 
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.75rem'
                          }}>
                            Fecha de Vencimiento
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: 'text.primary',
                            textTransform: 'capitalize',
                            mb: 0.2,
                            fontSize: '1.1rem'
                          }}>
                            {format(selectedCommitment.dueDate, 'EEEE', { locale: es })}
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            fontSize: '0.95rem'
                          }}>
                            {format(selectedCommitment.dueDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Información Adicional - COMPLETA Y MEJORADA */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Card
                      sx={{
                        p: 4,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 4,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                          animation: 'shimmer 3s infinite',
                          zIndex: 1
                        },
                        '@keyframes shimmer': {
                          '0%': { left: '-100%' },
                          '100%': { left: '100%' }
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          mb: 3, 
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          fontSize: '1.2rem',
                          position: 'relative',
                          zIndex: 2
                        }}>
                          <Info sx={{ fontSize: 28 }} />
                          📋 Información Detallada del Compromiso
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
                                p: 3,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                borderLeft: `4px solid ${theme.palette.info.main}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: `0 4px 16px ${alpha(theme.palette.info.main, 0.3)}`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                        borderRadius: 2,
                                        zIndex: 1
                                      }
                                    }}
                                  >
                                    <Person sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                  </Box>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 700, 
                                    color: theme.palette.info.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontSize: '0.85rem'
                                  }}>
                                    👤 Beneficiario Principal
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
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
                                p: 3,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                borderLeft: `4px solid ${theme.palette.success.main}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.3)}`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                        borderRadius: 2,
                                        zIndex: 1
                                      }
                                    }}
                                  >
                                    <Payment sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                  </Box>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 700, 
                                    color: theme.palette.success.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontSize: '0.85rem'
                                  }}>
                                    💳 Método de Pago
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
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
                                p: 3,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                borderLeft: `4px solid ${theme.palette.warning.main}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: `0 4px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                        borderRadius: 2,
                                        zIndex: 1
                                      }
                                    }}
                                  >
                                    <Schedule sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                  </Box>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 700, 
                                    color: theme.palette.warning.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontSize: '0.85rem'
                                  }}>
                                    ⏰ Periodicidad
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
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
                                p: 3,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                borderLeft: `4px solid ${theme.palette.secondary.main}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.3)}`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                        borderRadius: 2,
                                        zIndex: 1
                                      }
                                    }}
                                  >
                                    {companyData?.logoURL ? (
                                      <Box
                                        component="img"
                                        src={companyData.logoURL}
                                        alt={`Logo de ${companyData.name}`}
                                        sx={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 1,
                                          objectFit: 'contain',
                                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                          zIndex: 2,
                                          position: 'relative'
                                        }}
                                      />
                                    ) : (
                                      <Business sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                    )}
                                  </Box>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 700, 
                                    color: theme.palette.secondary.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontSize: '0.85rem'
                                  }}>
                                    🏢 Empresa
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
                                  color: 'text.primary'
                                }}>
                                  {companyData?.name || 'Empresa no especificada'}
                                </Typography>
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
                                p: 3,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                        borderRadius: 2,
                                        zIndex: 1
                                      }
                                    }}
                                  >
                                    <Notes sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                  </Box>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 700, 
                                    color: theme.palette.primary.main,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontSize: '0.85rem'
                                  }}>
                                    📝 Observaciones
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: selectedCommitment.observations ? 700 : 500,
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
                                p: 3,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                borderLeft: `4px solid ${theme.palette.grey[500]}`,
                                borderRadius: 2,
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 2,
                                      background: `linear-gradient(135deg, ${theme.palette.grey[600]}, ${theme.palette.grey[700]})`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backdropFilter: 'blur(10px)',
                                      boxShadow: `0 4px 16px ${alpha(theme.palette.grey[500], 0.3)}`,
                                      position: 'relative',
                                      '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                        borderRadius: 2,
                                        zIndex: 1
                                      }
                                    }}
                                  >
                                    <AccessTime sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                  </Box>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 700, 
                                    color: theme.palette.grey[600],
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    fontSize: '0.85rem'
                                  }}>
                                    🕒 Fecha de Creación
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 700,
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
                                  p: 3,
                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                  borderLeft: `4px solid ${theme.palette.grey[500]}`,
                                  borderRadius: 2,
                                  backdropFilter: 'blur(20px)',
                                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}>
                                  <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${theme.palette.error.main}, ${alpha(theme.palette.error.main, 0.8)})`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.3)}`,
                                        position: 'relative',
                                        '&::before': {
                                          content: '""',
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                                          borderRadius: 2,
                                          zIndex: 1
                                        }
                                      }}
                                    >
                                      <Edit sx={{ color: 'white', fontSize: 20, zIndex: 2, position: 'relative' }} />
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ 
                                      fontWeight: 700, 
                                      color: theme.palette.error.main,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.8px',
                                      fontSize: '0.85rem'
                                    }}>
                                      ✏️ Última Modificación
                                    </Typography>
                                  </Box>
                                  <Typography variant="body1" sx={{ 
                                    fontWeight: 700,
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
                pb: 6,
                background: theme => theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.98)
                  : alpha('#ffffff', 0.98),
                borderTop: theme => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.08)',
                position: 'relative'
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
                    borderRadius: 1,
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
                    sx={{ 
                      borderRadius: 3.5,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      borderWidth: '2px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'transparent',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      },
                      '&:hover': {
                        bgcolor: theme => theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.12)
                          : alpha(theme.palette.primary.main, 0.08),
                        borderColor: 'primary.main',
                        transform: 'translateY(-1px)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(25, 118, 210, 0.15)'
                          : '0 4px 12px rgba(25, 118, 210, 0.20)',
                        '&::before': {
                          opacity: 1
                        }
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
                    sx={{ 
                      borderRadius: 3.5,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: theme.palette.background.paper,
                      boxShadow: `
                        0 8px 25px rgba(102, 126, 234, 0.35),
                        0 3px 12px rgba(102, 126, 234, 0.25),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      '&:hover': {
                        bgcolor: theme => theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.15)
                          : alpha(theme.palette.primary.main, 0.12),
                        transform: 'translateY(-1px)',
                        boxShadow: theme => theme.palette.mode === 'dark'
                          ? '0 6px 16px rgba(102, 126, 234, 0.25)'
                          : '0 6px 16px rgba(102, 126, 234, 0.35)'
                      }
                    }}
                  >
                    Editar
                  </Button>
                </motion.div>
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

      {/* Visor de comprobantes de pago */}
      <PaymentReceiptViewer
        open={receiptViewerOpen}
        onClose={handleCloseReceiptViewer}
        commitment={selectedCommitment}
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
                      color: theme.palette.primary.main,
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
                            fontSize: '0.8rem',
                            padding: '6px'
                          }
                        }}
                        sx={{
                          width: 60,
                          '& .MuiOutlinedInput-root': {
                            height: 32
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
                  gap: 2,
                  pt: 2,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      onClick={handleFirstPage}
                      disabled={currentPage === 1}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        bgcolor: currentPage === 1 ? 'action.disabled' : 'background.paper',
                        color: currentPage === 1 ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': currentPage !== 1 ? {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                        } : {}
                      }}
                    >
                      <FirstPage fontSize="small" />
                    </IconButton>

                    <IconButton
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        bgcolor: currentPage === 1 ? 'action.disabled' : 'background.paper',
                        color: currentPage === 1 ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': currentPage !== 1 ? {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                        } : {}
                      }}
                    >
                      <NavigateBefore fontSize="small" />
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
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          borderRadius: 1,
                          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                          }
                        },
                        '& .MuiPaginationItem-page.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            boxShadow: '0 3px 12px rgba(25, 118, 210, 0.5)'
                          }
                        },
                        '& .MuiPaginationItem-ellipsis': {
                          color: 'text.secondary'
                        }
                      }}
                    />

                    <IconButton
                      onClick={handleNextPage}
                      disabled={currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage)}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        bgcolor: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'action.disabled' : 'background.paper',
                        color: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': currentPage !== Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                        } : {}
                      }}
                    >
                      <NavigateNext fontSize="small" />
                    </IconButton>

                    <IconButton
                      onClick={handleLastPage}
                      disabled={currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage)}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        bgcolor: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'action.disabled' : 'background.paper',
                        color: currentPage === Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? 'text.disabled' : 'primary.main',
                        transition: 'all 0.2s ease',
                        '&:hover': currentPage !== Math.ceil(totalCommitments / paginationConfig.itemsPerPage) ? {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                        } : {}
                      }}
                    >
                      <LastPage fontSize="small" />
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

export default CommitmentsList;
