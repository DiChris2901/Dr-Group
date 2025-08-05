import React, { useState, useEffect } from 'react';
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
  alpha
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
  History
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, addDays, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import { useThemeGradients, shimmerEffect } from '../../utils/designSystem';
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

// Helper function para obtener el color del estado
const getStatusColor = (status) => {
  switch (status.color) {
    case 'success': return { bg: 'rgba(76, 175, 80, 0.3)', border: 'rgba(76, 175, 80, 0.5)' };
    case 'error': return { bg: 'rgba(244, 67, 54, 0.3)', border: 'rgba(244, 67, 54, 0.5)' };
    case 'warning': return { bg: 'rgba(255, 152, 0, 0.3)', border: 'rgba(255, 152, 0, 0.5)' };
    case 'info': return { bg: 'rgba(33, 150, 243, 0.3)', border: 'rgba(33, 150, 243, 0.5)' };
    default: return { bg: 'rgba(158, 158, 158, 0.3)', border: 'rgba(158, 158, 158, 0.5)' };
  }
};

// Componente para animación de conteo de montos
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
  // Si el compromiso está pagado, no mostrar progreso de tiempo
  if (isPaid) {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'success.main',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            ✅ Compromiso completado y pagado
          </Typography>
        </Box>
      </Box>
    );
  }

  const today = new Date();
  const totalDays = differenceInDays(dueDate, createdAt);
  const remainingDays = differenceInDays(dueDate, today);
  const progress = Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100));
  
  const getProgressColor = () => {
    if (remainingDays < 0) return 'error';
    if (remainingDays <= 3) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="caption" color="text.secondary">
          Progreso del compromiso
        </Typography>
        <Typography variant="caption" color={`${getProgressColor()}.main`} fontWeight="bold">
          {remainingDays > 0 ? `${remainingDays} días restantes` : 
           remainingDays === 0 ? 'Vence hoy' : `${Math.abs(remainingDays)} días vencido`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={getProgressColor()}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: remainingDays < 0 
              ? 'linear-gradient(90deg, #f44336 0%, #ff5722 100%)'
              : remainingDays <= 3
              ? 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)'
              : 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)'
          }
        }}
      />
    </Box>
  );
};

const CommitmentsList = ({ companyFilter, statusFilter, searchTerm, viewMode = 'cards', onCommitmentsChange }) => {
  const { currentUser } = useAuth();
  const { addNotification, addAlert } = useNotifications();
  const { settings } = useSettings();
  const theme = useTheme();
  const gradients = useThemeGradients();
  
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
      small: { minHeight: 180, padding: 1.5, fontSize: '0.85rem' },
      medium: { minHeight: 220, padding: 2, fontSize: '0.95rem' },
      large: { minHeight: 280, padding: 3, fontSize: '1rem' }
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

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    // Crear la consulta base
    let q = query(
      collection(db, 'commitments'),
      orderBy('dueDate', 'asc')
    );

    // Agregar filtros si es necesario
    if (companyFilter && companyFilter !== 'all') {
      q = query(q, where('companyId', '==', companyFilter));
    }

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        if (searchTerm) {
          filteredCommitments = filteredCommitments.filter(
            commitment =>
              (commitment.concept && commitment.concept.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (commitment.description && commitment.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (commitment.companyName && commitment.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (commitment.company && commitment.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (commitment.beneficiary && commitment.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        // Filtro por estado
        if (statusFilter && statusFilter !== 'all') {
          const today = new Date();
          const threeDaysFromNow = addDays(today, 3);

          filteredCommitments = filteredCommitments.filter(commitment => {
            const dueDate = commitment.dueDate;
            
            switch (statusFilter) {
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

        setCommitments(filteredCommitments);
        setLoading(false);
        
        // Notificar al componente padre sobre los datos de compromisos
        if (onCommitmentsChange) {
          onCommitmentsChange(filteredCommitments);
        }
      },
      (error) => {
        console.error('Error fetching commitments:', error);
        setError('Error al cargar los compromisos');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, companyFilter, statusFilter, searchTerm]);

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
        label: `Vencido (${Math.abs(daysDifference)} día${Math.abs(daysDifference) !== 1 ? 's' : ''})`,
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
        label: `Próximo (${daysDifference} día${daysDifference !== 1 ? 's' : ''})`,
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
      label: `Pendiente (${daysDifference} días)`,
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
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay compromisos registrados
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
        // Vista Lista Spectacular - Design System Premium v2.2
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: spacing.grid,
          position: 'relative'
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
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(statusInfo.color, 0.15)}`,
                  borderRadius: 3,
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
                    transition: 'left 0.8s ease-in-out',
                    zIndex: 1
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.grey[500], 0.12)}`,
                    '&::before': {
                      left: '100%'
                    }
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: spacing.padding,
                  position: 'relative',
                  zIndex: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box sx={{ mr: spacing.card }}>
                      {showTooltips ? (
                        <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                          <Chip 
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.chipColor}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                              '& .MuiChip-icon': {
                                color: statusInfo.color
                              }
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip 
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.chipColor}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                            '& .MuiChip-icon': {
                              color: statusInfo.color
                            }
                          }}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          mb: 0.5, 
                          fontSize: cardStyles.fontSize,
                          background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${alpha(theme.palette.primary.main, 0.8)})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          textShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
                        }}
                      >
                        {commitment.description}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.light, 0.02)})`,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                      }}>
                        <Business sx={{ 
                          fontSize: 16, 
                          color: theme.palette.info.main,
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                        }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: cardStyles.fontSize,
                            fontWeight: 500
                          }}
                        >
                          {commitment.companyName}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          ml: 2,
                          pl: 2,
                          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                        }}>
                          <CalendarToday sx={{ 
                            fontSize: 16, 
                            mr: 0.5,
                            color: theme.palette.warning.main,
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                          }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: cardStyles.fontSize }}
                          >
                            {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      textAlign: 'right', 
                      mr: spacing.card,
                      p: 2,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.light, 0.02)})`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: `calc(${cardStyles.fontSize} * 1.4)`,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          mb: 0.5
                        }}
                      >
                        <CountingNumber end={commitment.amount} />
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={commitment.paid ? 'success.main' : (isOverdue ? 'error.main' : isDueSoon ? 'warning.main' : 'text.secondary')}
                        sx={{ 
                          fontSize: `calc(${cardStyles.fontSize} * 0.85)`,
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        {commitment.paid 
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
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.1)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`
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
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 100,
                  damping: 12
                }}
                whileHover={{ 
                  scale: 1.01,
                  transition: { duration: 0.3, type: "spring", stiffness: 400 }
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
      ) : viewMode === 'table' ? (
        // Vista Tabla Spectacular - Design System Premium v2.2
        <motion.div
          initial={animationsEnabled ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <Card sx={{ 
            overflow: 'hidden', 
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.grey[500], 0.15)}`,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              zIndex: 1
            }
          }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                {/* Encabezado Spectacular */}
                <Box component="thead">
                  <Box
                    component="tr"
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
                      backdropFilter: 'blur(10px)',
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.5)}, transparent)`
                      }
                    }}
                  >
                    <Box component="th" sx={{ 
                      p: spacing.padding, 
                      textAlign: 'left', 
                      fontWeight: 800, 
                      fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      Estado
                    </Box>
                    <Box component="th" sx={{ 
                      p: spacing.padding, 
                      textAlign: 'left', 
                      fontWeight: 800, 
                      fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      Descripción
                    </Box>
                    <Box component="th" sx={{ 
                      p: spacing.padding, 
                      textAlign: 'left', 
                      fontWeight: 800, 
                      fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      Empresa
                    </Box>
                    <Box component="th" sx={{ 
                      p: spacing.padding, 
                      textAlign: 'right', 
                      fontWeight: 800, 
                      fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      Monto
                    </Box>
                    <Box component="th" sx={{ 
                      p: spacing.padding, 
                      textAlign: 'center', 
                      fontWeight: 800, 
                      fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      Vencimiento
                    </Box>
                    <Box component="th" sx={{ 
                      p: spacing.padding, 
                      textAlign: 'center', 
                      fontWeight: 800, 
                      fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.dark, 0.8)})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Acciones
                    </Box>
                  </Box>
                </Box>
                
                {/* Contenido Spectacular */}
                <Box component="tbody">
                  {commitments.map((commitment, index) => {
                    const statusInfo = getStatusInfo(commitment);
                    const dueDate = commitment.dueDate;
                    const today = new Date();
                    const daysUntilDue = differenceInDays(dueDate, today);
                    const isOverdue = daysUntilDue < 0;
                    const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
                    
                    return (
                      <motion.tr
                        key={commitment.id}
                        component={Box}
                        initial={animationsEnabled ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.06, type: "spring" }}
                        sx={{
                          background: index % 2 === 0 
                            ? 'transparent'
                            : alpha(theme.palette.primary.main, 0.02),
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          position: 'relative',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
                            transform: 'scale(1.002)',
                            boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
                            '& .MuiIconButton-root': {
                              transform: 'scale(1.1)'
                            }
                          }
                        }}
                      >
                        <Box component="td" sx={{ 
                          p: spacing.padding,
                          borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                        }}>
                          {showTooltips ? (
                            <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                              <Chip 
                                icon={statusInfo.icon}
                                label={statusInfo.label}
                                color={statusInfo.chipColor}
                                size="small"
                                sx={{ 
                                  fontWeight: 700,
                                  background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                                  backdropFilter: 'blur(10px)',
                                  border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                  '& .MuiChip-icon': {
                                    color: statusInfo.color,
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                                  }
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.chipColor}
                              size="small"
                              sx={{ 
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                '& .MuiChip-icon': {
                                  color: statusInfo.color,
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                                }
                              }}
                            />
                          )}
                        </Box>
                        <Box component="td" sx={{ 
                          p: spacing.padding,
                          borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 700, 
                              mb: 0.5,
                              fontSize: cardStyles.fontSize,
                              background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${alpha(theme.palette.primary.main, 0.7)})`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              color: 'transparent'
                            }}
                          >
                            {commitment.concept || commitment.description || 'Sin concepto'}
                          </Typography>
                          {commitment.beneficiary && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                p: 0.5,
                                borderRadius: 1,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.light, 0.02)})`,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                              }}
                            >
                              Para: {commitment.beneficiary}
                            </Typography>
                          )}
                        </Box>
                        <Box component="td" sx={{ 
                          p: spacing.padding,
                          borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            p: 1,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.light, 0.02)})`,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                          }}>
                            <Business sx={{ 
                              fontSize: 18, 
                              color: theme.palette.info.main,
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: cardStyles.fontSize
                              }}
                            >
                              {commitment.companyName || commitment.company || 'Sin empresa'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box component="td" sx={{ 
                          p: spacing.padding, 
                          textAlign: 'right',
                          borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                        }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 800,
                              fontSize: `calc(${cardStyles.fontSize} * 1.3)`,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              color: 'transparent',
                              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            <CountingNumber end={commitment.amount} />
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ 
                          p: spacing.padding, 
                          textAlign: 'center',
                          borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`
                        }}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.light, 0.02)})`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                          }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 700, 
                                mb: 0.5,
                                fontSize: cardStyles.fontSize
                              }}
                            >
                              {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                            <Typography
                              variant="caption"
                              color={commitment.paid ? 'success.main' : (isOverdue ? 'error.main' : isDueSoon ? 'warning.main' : 'success.main')}
                              sx={{
                                fontWeight: 600,
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              {commitment.paid 
                                ? '✅ Pagado' 
                                : (daysUntilDue >= 0 
                                  ? `${daysUntilDue} días restantes` 
                                  : `${Math.abs(daysUntilDue)} días vencido`)
                              }
                            </Typography>
                          </Box>
                        </Box>
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'center' }}>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 0.5, 
                            justifyContent: 'center',
                            '& .MuiIconButton-root': {
                              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'translateY(-2px) scale(1.1)',
                                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`
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
                                    sx={{ color: 'info.main' }}
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
                                  sx={{ color: 'info.main' }}
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
                      </motion.tr>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Card>
        </motion.div>
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
                      scale: 1.02, 
                      y: -8,
                      transition: { duration: 0.3, type: "spring", stiffness: 400 }
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
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(statusInfo.color, 0.2)}`,
                        borderRadius: 3,
                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                          transition: 'left 0.8s ease-in-out',
                          zIndex: 1
                        },
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.grey[500], 0.15)}`,
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
                          borderRadius: 3,
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
                                color={statusInfo.chipColor}
                                size="small"
                                sx={{
                                  background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                                  backdropFilter: 'blur(10px)',
                                  border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                  fontWeight: 600,
                                  '& .MuiChip-icon': {
                                    color: statusInfo.color
                                  }
                                }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.chipColor}
                              size="small"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                  color: statusInfo.color
                                }
                              }}
                            />
                          )}
                          <Box sx={{
                            display: 'flex',
                            gap: 0.5,
                            '& .MuiIconButton-root': {
                              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'translateY(-2px) scale(1.1)',
                                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`
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
                            fontSize: cardStyles.fontSize,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${alpha(theme.palette.primary.main, 0.8)})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            textShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(255,255,255,0.1)' : 'none',
                            transition: 'all 0.3s ease'
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
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.light, 0.02)})`,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Business sx={{ 
                            fontSize: 18, 
                            mr: 1.5, 
                            color: theme.palette.info.main,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                          }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            noWrap 
                            sx={{ 
                              fontSize: cardStyles.fontSize,
                              fontWeight: 500,
                              flex: 1
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
                                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
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
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.light, 0.02)})`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <CalendarToday sx={{ 
                            fontSize: 18, 
                            mr: 1.5, 
                            color: theme.palette.warning.main,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                          }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: cardStyles.fontSize,
                              fontWeight: 500
                            }}
                          >
                            {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Box>

                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: `calc(${cardStyles.fontSize} * 1.4)`,
                            fontWeight: 800,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            mb: 1,
                            transition: 'all 0.3s ease'
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
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.light, 0.02)})`,
                              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <AttachFile sx={{ 
                              fontSize: 18, 
                              mr: 1.5, 
                              color: theme.palette.success.main,
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }} />
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                fontSize: `calc(${cardStyles.fontSize} * 0.9)`,
                                fontWeight: 500
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
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(statusInfo.color, 0.2)}`,
                      borderRadius: 3,
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.grey[500], 0.12)}`
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
                              color={statusInfo.chipColor}
                              size="small"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                  color: statusInfo.color
                                }
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.chipColor}
                            size="small"
                            sx={{
                              background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.15)}, ${alpha(statusInfo.color, 0.25)})`,
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: statusInfo.color
                              }
                            }}
                          />
                        )}
                        <Box sx={{
                          display: 'flex',
                          gap: 0.5,
                          '& .MuiIconButton-root': {
                            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-2px) scale(1.1)',
                              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`
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
                          fontSize: cardStyles.fontSize,
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${alpha(theme.palette.primary.main, 0.8)})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          textShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(255,255,255,0.1)' : 'none',
                          transition: 'all 0.3s ease'
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
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.light, 0.02)})`,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Business sx={{ 
                          fontSize: 18, 
                          mr: 1.5, 
                          color: theme.palette.info.main,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          noWrap 
                          sx={{ 
                            fontSize: cardStyles.fontSize,
                            fontWeight: 500,
                            flex: 1
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
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
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
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.warning.light, 0.02)})`,
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <CalendarToday sx={{ 
                          fontSize: 18, 
                          mr: 1.5, 
                          color: theme.palette.warning.main,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: cardStyles.fontSize,
                            fontWeight: 500
                          }}
                        >
                          {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Box>

                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontSize: `calc(${cardStyles.fontSize} * 1.4)`,
                          fontWeight: 800,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          mb: 1,
                          transition: 'all 0.3s ease'
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
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.success.light, 0.02)})`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <AttachFile sx={{ 
                            fontSize: 18, 
                            mr: 1.5, 
                            color: theme.palette.success.main,
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                          }} />
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              fontSize: `calc(${cardStyles.fontSize} * 0.9)`,
                              fontWeight: 500
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
            '& @keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
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
                            const colors = getStatusColor(status);
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
                            {format(selectedCommitment.dueDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                          </Typography>
                        </Box>

                        {/* Indicador de días restantes */}
                        <Box textAlign="right">
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                          >
                            <Chip
                              label={(() => {
                                if (selectedCommitment.paid) return '✅ Pagado';
                                const days = differenceInDays(selectedCommitment.dueDate, new Date());
                                if (days < 0) return `${Math.abs(days)} días vencido`;
                                if (days === 0) return 'Vence hoy';
                                if (days === 1) return 'Vence mañana';
                                return `${days} días restantes`;
                              })()}
                              size="medium"
                              sx={{
                                fontWeight: 600,
                                bgcolor: (() => {
                                  const days = differenceInDays(selectedCommitment.dueDate, new Date());
                                  if (days < 0) return alpha(theme.palette.error.main, 0.1);
                                  if (days <= 3) return alpha(theme.palette.warning.main, 0.1);
                                  return alpha(theme.palette.success.main, 0.1);
                                })(),
                                color: (() => {
                                  const days = differenceInDays(selectedCommitment.dueDate, new Date());
                                  if (days < 0) return theme.palette.error.main;
                                  if (days <= 3) return theme.palette.warning.main;
                                  return theme.palette.success.main;
                                })(),
                                border: `1px solid ${(() => {
                                  const days = differenceInDays(selectedCommitment.dueDate, new Date());
                                  if (days < 0) return alpha(theme.palette.error.main, 0.3);
                                  if (days <= 3) return alpha(theme.palette.warning.main, 0.3);
                                  return alpha(theme.palette.success.main, 0.3);
                                })()}`
                              }}
                            />
                          </motion.div>
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
                        
                        <Grid container spacing={3}>
                          {/* Primera fila: Beneficiario y Método de Pago */}
                          <Grid item xs={12} md={6}>
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
                          <Grid item xs={12} md={6}>
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
                                  <History sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.grey[600], 0.08)}, ${alpha(theme.palette.grey[500], 0.04)})`,
                                  borderRadius: 3,
                                  border: `1px solid ${alpha(theme.palette.grey[600], 0.15)}`,
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}>
                                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                    <Edit sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
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
                                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
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
                                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.default, 0.7)})`,
                                      borderRadius: 3,
                                      border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                                      backdropFilter: 'blur(10px)',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        borderColor: theme.palette.info.main,
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.info.light, 0.03)})`,
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
                    borderRadius: 3,
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
                      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.text.primary, 0.08)}, transparent)`,
                      transition: 'all 0.5s ease'
                    },
                    '&:hover': {
                      borderColor: alpha(theme.palette.text.primary, 0.3),
                      backgroundColor: alpha(theme.palette.text.primary, 0.04),
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
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, transparent 50%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      },
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        borderColor: 'primary.dark',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(25, 118, 210, 0.25)',
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
                      background: `
                        linear-gradient(135deg, #667eea 0%, #764ba2 100%),
                        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)
                      `,
                      boxShadow: `
                        0 8px 25px rgba(102, 126, 234, 0.35),
                        0 3px 12px rgba(102, 126, 234, 0.25),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      },
                      '&:hover': {
                        background: `
                          linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%),
                          radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 60%)
                        `,
                        boxShadow: `
                          0 12px 35px rgba(102, 126, 234, 0.45),
                          0 5px 20px rgba(102, 126, 234, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.3)
                        `,
                        transform: 'translateY(-2px)',
                        '&::before': {
                          opacity: 1
                        }
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
    </Box>
  );
};

export default CommitmentsList;
