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
  Receipt as ReceiptIcon
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
import useCommitmentAlerts from '../../hooks/useCommitmentAlerts';
import CommitmentEditForm from './CommitmentEditForm';
import PaymentReceiptViewer from './PaymentReceiptViewer';

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
const TimeProgress = ({ dueDate, createdAt }) => {
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

const CommitmentsList = ({ companyFilter, statusFilter, searchTerm, viewMode = 'cards' }) => {
  const { currentUser } = useAuth();
  const { addNotification, addAlert } = useNotifications();
  const { settings } = useSettings();
  const theme = useTheme();
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
        // Vista Lista Optimizada - Diseño spectacular mejorado
        <Box>
          {commitments.map((commitment, index) => {
            const statusInfo = getStatusInfo(commitment);
            const dueDate = commitment.dueDate;
            const today = new Date();
            const daysUntilDue = differenceInDays(dueDate, today);
            
            const cardContent = (
              <Card
                sx={{
                  mb: spacing.card,
                  p: 0,
                  minHeight: 100,
                  background: `
                    linear-gradient(135deg, 
                      ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                      ${alpha(theme.palette.background.paper, 0.9)} 100%
                    ),
                    linear-gradient(225deg, 
                      ${alpha(statusInfo.color, 0.08)} 0%, 
                      transparent 50%
                    )
                  `,
                  border: `2px solid ${alpha(statusInfo.color, 0.2)}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 20px ${alpha(statusInfo.color, 0.15)}`,
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: `0 12px 35px ${alpha(statusInfo.color, 0.25)}`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .commitment-actions': {
                      opacity: 1,
                      transform: 'translateX(0)'
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '6px',
                    height: '100%',
                    background: statusInfo.gradient,
                    zIndex: 1
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(statusInfo.color, 0.1)} 0%, transparent 70%)`,
                    zIndex: 0
                  }
                }}
              >
                {/* Header con estado y fecha */}
                <Box 
                  sx={{ 
                    px: 3, 
                    py: 1.5,
                    background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.1)} 0%, ${alpha(statusInfo.color, 0.05)} 100%)`,
                    borderBottom: `1px solid ${alpha(statusInfo.color, 0.1)}`,
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Chip 
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          size="medium"
                          sx={{ 
                            background: statusInfo.gradient,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            px: 1,
                            boxShadow: `0 4px 12px ${alpha(statusInfo.color, 0.3)}`,
                            '& .MuiChip-icon': {
                              color: 'white'
                            }
                          }}
                        />
                      </motion.div>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                        </Typography>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.3,
                            borderRadius: 2,
                            background: daysUntilDue < 0 
                              ? alpha(theme.palette.error.main, 0.1)
                              : daysUntilDue <= 3
                              ? alpha(theme.palette.warning.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                            border: `1px solid ${
                              daysUntilDue < 0 
                                ? alpha(theme.palette.error.main, 0.3)
                                : daysUntilDue <= 3
                                ? alpha(theme.palette.warning.main, 0.3)
                                : alpha(theme.palette.success.main, 0.3)
                            }`
                          }}
                        >
                          <Typography variant="caption" sx={{ 
                            fontWeight: 700,
                            color: daysUntilDue < 0 
                              ? 'error.main'
                              : daysUntilDue <= 3
                              ? 'warning.main'
                              : 'success.main'
                          }}>
                            {daysUntilDue >= 0 ? `${daysUntilDue} días restantes` : `${Math.abs(daysUntilDue)} días vencido`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Acciones - Aparecen en hover */}
                    <Box 
                      className="commitment-actions"
                      sx={{ 
                        display: 'flex', 
                        gap: 1,
                        opacity: 0.7,
                        transform: 'translateX(10px)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {showTooltips ? (
                        <>
                          <Tooltip title="Ver detalles" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewCommitment(commitment)}
                              sx={{ 
                                color: 'primary.main',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
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
                                bgcolor: hasValidPayment(commitment) 
                                  ? alpha(theme.palette.success.main, 0.1) 
                                  : alpha(theme.palette.text.secondary, 0.1),
                                '&:hover': { 
                                  bgcolor: hasValidPayment(commitment) 
                                    ? alpha(theme.palette.success.main, 0.2)
                                    : alpha(theme.palette.text.secondary, 0.2)
                                }
                              }}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar compromiso" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditFromCard(commitment)}
                              sx={{ 
                                color: 'warning.main',
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar compromiso" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteCommitment(commitment)}
                              sx={{ 
                                color: 'error.main',
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
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
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewReceipt(commitment)}
                            sx={{ 
                              color: hasValidPayment(commitment) ? 'success.main' : 'text.secondary',
                              bgcolor: hasValidPayment(commitment) 
                                ? alpha(theme.palette.success.main, 0.1) 
                                : alpha(theme.palette.text.secondary, 0.1),
                              '&:hover': { 
                                bgcolor: hasValidPayment(commitment) 
                                  ? alpha(theme.palette.success.main, 0.2)
                                  : alpha(theme.palette.text.secondary, 0.2)
                              }
                            }}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditFromCard(commitment)}
                            sx={{ 
                              color: 'warning.main',
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteCommitment(commitment)}
                            sx={{ 
                              color: 'error.main',
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Contenido principal */}
                <Box sx={{ px: 3, py: 2, position: 'relative', zIndex: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Información del compromiso */}
                    <Box sx={{ flex: 1, pr: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Business sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: 'primary.main',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          {commitment.companyName || 'Sin empresa'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        mb: 0.5,
                        color: 'text.primary',
                        fontSize: '1.15rem',
                        lineHeight: 1.3
                      }}>
                        {commitment.concept || commitment.description || 'Sin concepto'}
                      </Typography>
                      
                      {commitment.beneficiary && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccountBalance sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                            Beneficiario: {commitment.beneficiary}
                          </Typography>
                        </Box>
                      )}
                      
                      {commitment.observations && (
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          display: 'block',
                          fontStyle: 'italic',
                          mt: 0.5,
                          opacity: 0.8
                        }}>
                          📝 {commitment.observations}
                        </Typography>
                      )}
                    </Box>

                    {/* Monto y indicadores */}
                    <Box sx={{ textAlign: 'right', minWidth: 140 }}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                      >
                        <Typography variant="h5" sx={{ 
                          fontWeight: 800, 
                          color: statusInfo.color,
                          fontSize: '1.5rem',
                          textShadow: `0 2px 4px ${alpha(statusInfo.color, 0.3)}`,
                          mb: 0.5
                        }}>
                          <CountingNumber end={commitment.amount} />
                        </Typography>
                      </motion.div>
                      
                      {/* Indicadores de progreso */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                        {commitment.paid && (
                          <Chip 
                            icon={<CheckCircle />}
                            label="Pagado"
                            size="small"
                            sx={{ 
                              bgcolor: 'success.main',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        
                        {commitment.attachments && commitment.attachments.length > 0 && (
                          <Chip 
                            icon={<AttachFile />}
                            label={`${commitment.attachments.length} archivo(s)`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: 'info.main',
                              color: 'info.main',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Barra de progreso temporal */}
                  <Box sx={{ mt: 2 }}>
                    <TimeProgress 
                      dueDate={commitment.dueDate} 
                      createdAt={commitment.createdAt || new Date()} 
                    />
                  </Box>
                </Box>
              </Card>
            );
            
            return animationsEnabled ? (
              <motion.div
                key={commitment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {cardContent}
              </motion.div>
            ) : (
              <div key={commitment.id}>
                {cardContent}
              </div>
            );
          })}
        </Box>
      ) : viewMode === 'table' ? (
        // Vista Tabla
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                {/* Encabezado de la tabla */}
                <Box component="thead">
                  <Box
                    component="tr"
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    <Box component="th" sx={{ p: spacing.padding, textAlign: 'left', fontWeight: 700, color: 'primary.main' }}>
                      Estado
                    </Box>
                    <Box component="th" sx={{ p: spacing.padding, textAlign: 'left', fontWeight: 700, color: 'primary.main' }}>
                      Descripción
                    </Box>
                    <Box component="th" sx={{ p: spacing.padding, textAlign: 'left', fontWeight: 700, color: 'primary.main' }}>
                      Empresa
                    </Box>
                    <Box component="th" sx={{ p: spacing.padding, textAlign: 'right', fontWeight: 700, color: 'primary.main' }}>
                      Monto
                    </Box>
                    <Box component="th" sx={{ p: spacing.padding, textAlign: 'center', fontWeight: 700, color: 'primary.main' }}>
                      Vencimiento
                    </Box>
                    <Box component="th" sx={{ p: spacing.padding, textAlign: 'center', fontWeight: 700, color: 'primary.main' }}>
                      Acciones
                    </Box>
                  </Box>
                </Box>
                
                {/* Contenido de la tabla */}
                <Box component="tbody">
                  {commitments.map((commitment, index) => {
                    const statusInfo = getStatusInfo(commitment);
                    const dueDate = commitment.dueDate;
                    const today = new Date();
                    const daysUntilDue = differenceInDays(dueDate, today);
                    
                    return (
                      <motion.tr
                        key={commitment.id}
                        component={Box}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        sx={{
                          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.03),
                            transform: 'scale(1.005)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                      >
                        <Box component="td" sx={{ p: spacing.padding }}>
                          {showTooltips ? (
                            <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                              <Chip 
                                label={statusInfo.label}
                                color={statusInfo.chipColor}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip 
                              label={statusInfo.label}
                              color={statusInfo.chipColor}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <Box component="td" sx={{ p: spacing.padding }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {commitment.concept || commitment.description || 'Sin concepto'}
                          </Typography>
                          {commitment.beneficiary && (
                            <Typography variant="caption" color="text.secondary">
                              Para: {commitment.beneficiary}
                            </Typography>
                          )}
                        </Box>
                        <Box component="td" sx={{ p: spacing.padding }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {commitment.companyName || commitment.company || 'Sin empresa'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: statusInfo.color }}>
                            <CountingNumber end={commitment.amount} />
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {daysUntilDue >= 0 
                              ? `${daysUntilDue} días restantes` 
                              : `${Math.abs(daysUntilDue)} días vencido`
                            }
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
        // Vista Cards (por defecto) - Con configuraciones dashboard
        <Grid container spacing={spacing.grid}>
          {commitments.map((commitment, index) => {
            const statusInfo = getStatusInfo(commitment);
            
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        minHeight: cardStyles.minHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: cardStyles.padding }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={spacing.card}>
                          {showTooltips ? (
                            <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                              <Chip
                                icon={statusInfo.icon}
                                label={statusInfo.label}
                                color={statusInfo.chipColor}
                                size="small"
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.chipColor}
                              size="small"
                            />
                          )}
                          <Box>
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

                        <Typography variant="h6" gutterBottom noWrap sx={{ fontSize: cardStyles.fontSize }}>
                          {commitment.concept || commitment.description || 'Sin concepto'}
                        </Typography>

                        <Box display="flex" alignItems="center" mb={1}>
                          <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: cardStyles.fontSize }}>
                            {commitment.companyName || commitment.company || 'Sin empresa'}
                          </Typography>
                          {commitment.companyLogo && (
                            <Box ml={1}>
                              <img 
                                src={commitment.companyLogo} 
                                alt="Logo empresa"
                                style={{ 
                                  width: 16, 
                                  height: 16, 
                                  borderRadius: 2,
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </Box>
                          )}
                        </Box>

                        <Box display="flex" alignItems="center" mb={spacing.card}>
                          <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: cardStyles.fontSize }}>
                            {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Box>

                        <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ fontSize: `calc(${cardStyles.fontSize} * 1.3)` }}>
                          {formatCurrency(commitment.amount)}
                        </Typography>

                        {commitment.attachments && commitment.attachments.length > 0 && (
                          <Box display="flex" alignItems="center" mt={1}>
                            <AttachFile sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: `calc(${cardStyles.fontSize} * 0.8)` }}>
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
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: cardStyles.padding }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={spacing.card}>
                        {showTooltips ? (
                          <Tooltip title={`Estado: ${statusInfo.label}`} arrow>
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.chipColor}
                              size="small"
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.chipColor}
                            size="small"
                          />
                        )}
                        <Box>
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

                      <Typography variant="h6" gutterBottom noWrap sx={{ fontSize: cardStyles.fontSize }}>
                        {commitment.concept || commitment.description || 'Sin concepto'}
                      </Typography>

                      <Box display="flex" alignItems="center" mb={1}>
                        <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: cardStyles.fontSize }}>
                          {commitment.companyName || commitment.company || 'Sin empresa'}
                        </Typography>
                        {commitment.companyLogo && (
                          <Box ml={1}>
                            <img 
                              src={commitment.companyLogo} 
                              alt="Logo empresa"
                              style={{ 
                                width: 16, 
                                height: 16, 
                                borderRadius: 2,
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </Box>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" mb={spacing.card}>
                        <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: cardStyles.fontSize }}>
                          {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                        </Typography>
                      </Box>

                      <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ fontSize: `calc(${cardStyles.fontSize} * 1.3)` }}>
                        {formatCurrency(commitment.amount)}
                      </Typography>

                      {commitment.attachments && commitment.attachments.length > 0 && (
                        <Box display="flex" alignItems="center" mt={1}>
                          <AttachFile sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: `calc(${cardStyles.fontSize} * 0.8)` }}>
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

                {/* Información Adicional - SIEMPRE VISIBLE */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <Card
                      sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, rgba(96, 125, 139, 0.08) 0%, rgba(96, 125, 139, 0.03) 100%)',
                        border: '1px solid rgba(96, 125, 139, 0.15)',
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(96, 125, 139, 0.1)'
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
                        📋 Información Adicional
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {/* Beneficiario - Siempre presente */}
                        <Grid item xs={12} md={6}>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                          >
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                👤 Beneficiario
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                p: 2, 
                                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                                borderRadius: 2,
                                border: '1px solid rgba(25, 118, 210, 0.15)',
                                fontWeight: 500,
                                fontStyle: selectedCommitment.beneficiary ? 'normal' : 'italic',
                                opacity: selectedCommitment.beneficiary ? 1 : 0.7
                              }}>
                                {selectedCommitment.beneficiary || 'No especificado'}
                              </Typography>
                            </Box>
                          </motion.div>
                        </Grid>

                        {/* Observaciones - Siempre presente */}
                        <Grid item xs={12} md={6}>
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                          >
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                📝 Observaciones
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                p: 2, 
                                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                                borderRadius: 2,
                                border: '1px solid rgba(76, 175, 80, 0.15)',
                                fontWeight: 400,
                                lineHeight: 1.6,
                                fontStyle: selectedCommitment.observations ? 'normal' : 'italic',
                                opacity: selectedCommitment.observations ? 1 : 0.7
                              }}>
                                {selectedCommitment.observations || 'Sin observaciones adicionales'}
                              </Typography>
                            </Box>
                          </motion.div>
                        </Grid>
                      </Grid>
                    </Card>
                  </motion.div>
                </Grid>

                {/* Archivos Adjuntos */}
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
                          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.04) 100%)',
                          border: '2px solid rgba(33, 150, 243, 0.2)',
                          borderRadius: 4,
                          boxShadow: '0 8px 32px rgba(33, 150, 243, 0.15)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -30,
                            right: -30,
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(33, 150, 243, 0.08) 0%, transparent 70%)',
                            zIndex: 0
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="center" mb={2} sx={{ position: 'relative', zIndex: 1 }}>
                          <motion.div
                            initial={{ scale: 0.5, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                          >
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2.5,
                                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)'
                              }}
                            >
                              <AttachFile sx={{ color: 'white', fontSize: 30 }} />
                            </Box>
                          </motion.div>
                          <Box textAlign="left">
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              Archivos Adjuntos
                            </Typography>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.6, duration: 0.4 }}
                            >
                              <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                                <CountingNumber end={selectedCommitment.attachments.length} duration={800} prefix="" />
                              </Typography>
                            </motion.div>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              archivo(s) disponible(s)
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Botón para ver archivos */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7, duration: 0.3 }}
                        >
                          <Box display="flex" justifyContent="center" mt={2}>
                            <Button
                              variant="outlined"
                              startIcon={<Visibility />}
                              sx={{
                                borderColor: 'info.main',
                                color: 'info.main',
                                borderRadius: 3,
                                px: 3,
                                py: 1,
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                  bgcolor: 'rgba(33, 150, 243, 0.08)',
                                  borderColor: 'info.dark',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 16px rgba(33, 150, 243, 0.2)'
                                }
                              }}
                            >
                              Ver Archivos
                            </Button>
                          </Box>
                        </motion.div>
                      </Card>
                    </motion.div>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions 
              sx={{ 
                p: 4, 
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
