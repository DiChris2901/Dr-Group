import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  alpha,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  Avatar,
  DialogContent,
  DialogActions,
  DialogContentText,
  Pagination
} from '@mui/material';
import {
  Warning,
  Schedule,
  Assignment,
  Business,
  FilterList,
  AttachMoney,
  Visibility,
  Edit,
  Delete,
  CalendarToday,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  NotificationImportant,
  GetApp,
  Payment,
  NotificationAdd,
  Refresh,
  Flag,
  MoreHoriz,
  Person,
  Info,
  Notes,
  History,
  Share
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks y Context
import { useAuth } from '../context/AuthContext';
import { useDueCommitments } from '../hooks/useDueCommitments';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationsContext';

// Firebase
import { doc, updateDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Componentes de compromisos
import CommitmentEditForm from '../components/commitments/CommitmentEditForm';
import PaymentReceiptViewer from '../components/commitments/PaymentReceiptViewer';

// Función para obtener colores de status (copiada de CommitmentsList)
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

// Componentes especializados DS3 (copiados de CommitmentsList)
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
    >
      {ChipComponent}
    </Tooltip>
  ) : ChipComponent;
};

// Componente para fechas mejoradas DS 3.0
const DateDisplayDS3 = ({ date, showDaysRemaining = false, variant = 'standard', theme, isPaid = false }) => {
  if (!date) return <Typography color="text.secondary">Fecha no disponible</Typography>;
  
  // Función auxiliar para convertir fecha de manera segura
  const safeToDate = (dateInput) => {
    if (!dateInput) return null;
    
    // Si ya es un Date válido
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      return dateInput;
    }
    
    // Si es un timestamp de Firestore
    if (dateInput && typeof dateInput.toDate === 'function') {
      try {
        return dateInput.toDate();
      } catch (error) {
        console.warn('Error al convertir timestamp de Firestore:', error);
      }
    }
    
    // Si es un string o number, intentar crear Date
    try {
      const newDate = new Date(dateInput);
      if (!isNaN(newDate)) {
        return newDate;
      }
    } catch (error) {
      console.warn('Error al convertir fecha:', error);
    }
    
    return null;
  };
  
  const safeDate = safeToDate(date);
  if (!safeDate) return <Typography color="text.secondary">Fecha inválida</Typography>;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const targetDate = new Date(safeDate);
  targetDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const diffTime = targetDate - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
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
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography 
        variant="body2"
        sx={{ 
          fontSize: option.fontSize,
          fontWeight: variant === 'detailed' ? 500 : 400,
          color: option.color,
          lineHeight: 1.3
        }}
      >
        {safeDate.toLocaleDateString('es-CO')}
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
  if (!amount && amount !== 0) return <Typography color="text.secondary">Monto no disponible</Typography>;
  
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
        {formatAmount(amount)}
      </Typography>
    </motion.div>
  );
};

// Función para obtener información de estado (copiada de CommitmentsList)
const getStatusInfo = (commitment, theme) => {
  // Función auxiliar para convertir fecha de manera segura
  const safeToDate = (dateInput) => {
    if (!dateInput) return null;
    
    // Si ya es un Date válido
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      return dateInput;
    }
    
    // Si es un timestamp de Firestore
    if (dateInput && typeof dateInput.toDate === 'function') {
      try {
        return dateInput.toDate();
      } catch (error) {
        console.warn('Error al convertir timestamp de Firestore:', error);
      }
    }
    
    // Si es un string o number, intentar crear Date
    try {
      const newDate = new Date(dateInput);
      if (!isNaN(newDate)) {
        return newDate;
      }
    } catch (error) {
      console.warn('Error al convertir fecha:', error);
    }
    
    return null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const dueDate = safeToDate(commitment.dueDate);
  if (!dueDate) {
    // Si no hay fecha válida, devolver estado por defecto
    return {
      label: 'Sin fecha',
      color: theme.palette.grey[600],
      chipColor: 'default',
      icon: <CalendarToday />,
      gradient: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
      shadowColor: 'rgba(158, 158, 158, 0.3)',
      action: 'Ver Detalles',
      actionIcon: <Visibility />
    };
  }

  const dueDateCopy = new Date(dueDate);
  dueDateCopy.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  
  const diffTime = dueDateCopy - today;
  const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (commitment.paid || commitment.isPaid) {
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

  if (dueDateCopy < today) {
    const urgency = Math.min(Math.abs(daysDifference), 30) / 30;
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

  if (dueDateCopy <= threeDaysFromNow) {
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

const DueCommitmentsPage = () => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { userProfile, currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const { 
    commitments, 
    loading, 
    error, 
    refreshCommitments, 
    getCommitmentsByPriority,
    stats 
  } = useDueCommitments();

  const [filteredCommitments, setFilteredCommitments] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Número de elementos por página
  
  // Estados para modales y dialogs
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commitmentToDelete, setCommitmentToDelete] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  
  // Estados para formulario de pago
  // Eliminado: estados de modal de pago (se redirige a /payments/new)

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función local para filtrar compromisos por prioridad
  const filterCommitmentsByPriority = (priority) => {
    if (priority === 'all') return commitments;
    return commitments.filter(commitment => commitment.priority === priority);
  };

  useEffect(() => {
    // Filtrar compromisos según prioridad y empresa usando datos reales
    let filtered = filterCommitmentsByPriority(priorityFilter);
    
    // Excluir compromisos pagados (esta es una página de compromisos próximos a vencer)
    filtered = filtered.filter(commitment => 
      !commitment.isPaid && !commitment.paid
    );
    
    if (companyFilter !== 'all') {
      filtered = filtered.filter(commitment => 
        commitment.company === companyFilter
      );
    }
    
    setFilteredCommitments(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [priorityFilter, companyFilter, commitments]);

  // Calculate paginated data
  const totalPages = Math.ceil(filteredCommitments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCommitments = filteredCommitments.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // Calculate stats only for non-paid commitments (due commitments) - Memoized
  const dueCommitmentsStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueCommitments = commitments.filter(commitment => 
      !commitment.isPaid && !commitment.paid
    );

    let overdue = 0;
    let dueSoon = 0;
    let upcoming = 0;
    let totalAmount = 0;
    let overdueAmount = 0;

    dueCommitments.forEach(commitment => {
      const dueDate = commitment.dueDate?.toDate ? commitment.dueDate.toDate() : new Date(commitment.dueDate);
      const diffTime = dueDate - today;
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      totalAmount += commitment.amount || 0;

      if (daysUntilDue < 0) {
        overdue++;
        overdueAmount += commitment.amount || 0;
      } else if (daysUntilDue <= 7) {
        dueSoon++;
      } else {
        upcoming++;
      }
    });

    return {
      total: dueCommitments.length,
      overdue,
      dueSoon,
      upcoming,
      totalAmount,
      overdueAmount
    };
  }, [commitments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh con datos reales de Firebase
    await new Promise(resolve => setTimeout(resolve, 1000));
    refreshCommitments();
    setRefreshing(false);
  };

  // Funciones para manejar acciones de compromisos con Firebase
  const handleViewCommitment = async (commitment) => {
    setSelectedCommitment(commitment);
    setViewDialogOpen(true);
    
    // Obtener datos de la empresa si existe companyId
    if (commitment.companyId) {
      try {
        const companyDoc = await getDoc(doc(db, 'companies', commitment.companyId));
        if (companyDoc.exists()) {
          setCompanyData(companyDoc.data());
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    }
  };

  const handleEditCommitment = (commitment) => {
    setSelectedCommitment(commitment);
    setEditDialogOpen(true);
  };

  const handleDeleteCommitment = (commitment) => {
    setCommitmentToDelete(commitment);
    setDeleteDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedCommitment(null);
    setCompanyData(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCommitment(null);
  };

  const confirmDelete = async () => {
    if (commitmentToDelete) {
      try {
        console.log('🗑️ Iniciando eliminación del compromiso:', commitmentToDelete.id);
        
        // 1. Eliminar archivos de Firebase Storage si existen
        const filesToDelete = [];
        
        // Eliminar comprobante de pago si existe
        if (commitmentToDelete.receiptUrl) {
          try {
            // Extraer el path del archivo desde la URL de Firebase Storage
            let storagePath = '';
            
            if (commitmentToDelete.receiptUrl.includes('firebase.googleapis.com')) {
              // URL de descarga de Firebase Storage
              const urlParts = commitmentToDelete.receiptUrl.split('/o/')[1];
              if (urlParts) {
                storagePath = decodeURIComponent(urlParts.split('?')[0]);
                console.log('📂 Path del comprobante a eliminar:', storagePath);
                
                const fileRef = ref(storage, storagePath);
                await deleteObject(fileRef);
                console.log('✅ Comprobante eliminado de Firebase Storage');
              }
            }
          } catch (storageError) {
            console.warn('⚠️ Error al eliminar comprobante de Storage:', storageError.message);
            // Continuar con la eliminación aunque falle Storage
          }
        }

        // Eliminar otros archivos adjuntos si existen
        if (commitmentToDelete.attachmentUrls && Array.isArray(commitmentToDelete.attachmentUrls)) {
          for (const url of commitmentToDelete.attachmentUrls) {
            try {
              if (url.includes('firebase.googleapis.com')) {
                const urlParts = url.split('/o/')[1];
                if (urlParts) {
                  const storagePath = decodeURIComponent(urlParts.split('?')[0]);
                  console.log('📎 Path del archivo adjunto a eliminar:', storagePath);
                  
                  const fileRef = ref(storage, storagePath);
                  await deleteObject(fileRef);
                  console.log('✅ Archivo adjunto eliminado de Firebase Storage');
                }
              }
            } catch (storageError) {
              console.warn('⚠️ Error al eliminar archivo adjunto de Storage:', storageError.message);
              // Continuar con siguiente archivo
            }
          }
        }

        // 2. Eliminar el documento de Firestore
        await deleteDoc(doc(db, 'commitments', commitmentToDelete.id));
        console.log('✅ Compromiso eliminado de Firestore');
        
        // 3. Mostrar notificación de éxito
        addNotification({
          type: 'success',
          title: '🗑️ Compromiso Eliminado',
          message: `El compromiso "${commitmentToDelete.concept || commitmentToDelete.description || 'Sin concepto'}" ha sido eliminado correctamente`,
          duration: 5000
        });
        
        // 4. Cerrar dialog y limpiar estado
        setDeleteDialogOpen(false);
        setCommitmentToDelete(null);
        
        // 5. Refrescar datos (opcional ya que onSnapshot actualiza automáticamente)
        refreshCommitments();
        
      } catch (error) {
        console.error('❌ Error al eliminar compromiso:', error);
        addNotification({
          type: 'error',
          title: '❌ Error al Eliminar',
          message: `No se pudo eliminar el compromiso: ${error.message}`,
          duration: 8000
        });
      }
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCommitmentToDelete(null);
  };

  // Función para manejar el éxito de la edición
  const handleCommitmentSaved = () => {
    addNotification({
      type: 'success',
      title: '💾 Compromiso Actualizado',
      message: 'Los cambios se han guardado correctamente en Firebase',
      duration: 4000
    });
    
    handleCloseEditDialog();
    refreshCommitments(); // Refrescar la lista después de editar
  };

  // Acción de pago ahora redirige a la página de nuevo pago
  const navigate = useNavigate();
  const handlePayCommitment = (commitment) => {
    if (!commitment) return;
    // Se puede pasar el ID por query param para que la página de pago precargue datos
    navigate(`/payments/new?commitmentId=${commitment.id}`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return theme.palette.error.main;
      case 'due_soon': return theme.palette.warning.main;
      case 'upcoming': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'overdue': return 'Vencido';
      case 'due_soon': return 'Próximo a vencer';
      case 'upcoming': return 'Por vencer';
      default: return 'Al día';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const safeDueDate = safeToDate(dueDate);
    if (!safeDueDate) return 0;
    return differenceInDays(safeDueDate, new Date());
  };

  // Función segura para formatear fechas
  const formatSafeDate = (dateValue, formatString = 'dd/MM/yyyy') => {
    const safeDate = safeToDate(dateValue);
    if (!safeDate) return 'Sin fecha';
    try {
      return format(safeDate, formatString, { locale: es });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  // Función auxiliar para obtener texto de estado
  const getStatusText = (commitment) => {
    const safeDueDate = safeToDate(commitment?.dueDate);
    if (!safeDueDate) return 'Sin fecha';
    
    const today = new Date();
    const daysUntilDue = differenceInDays(safeDueDate, today);
    
    if (daysUntilDue < 0) return 'Vencido';
    if (daysUntilDue === 0) return 'Vence hoy';
    if (daysUntilDue <= 7) return 'Próximo';
    return 'Vigente';
  };

  // Función auxiliar para formatear la fecha de forma segura
  const safeToDate = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
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

  // Obtener empresas únicas para el filtro
  // Get unique companies - Memoized
  const uniqueCompanies = useMemo(() => {
    const companies = commitments
      .map(commitment => commitment.company)
      .filter(company => company && company.trim() !== '')
      .filter((company, index, arr) => arr.indexOf(company) === index)
      .sort();
    return companies;
  }, [commitments]);

  const overdueCounts = {
    total: dueCommitmentsStats.total,
    overdue: dueCommitmentsStats.overdue,
    dueSoon: dueCommitmentsStats.dueSoon,
    upcoming: dueCommitmentsStats.upcoming,
    totalAmount: dueCommitmentsStats.totalAmount,
    overdueAmount: dueCommitmentsStats.overdueAmount
  };

  // Mostrar estado de carga

  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: '1400px',
        mx: 'auto'
      }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LinearProgress 
            sx={{ 
              mb: 2, 
              borderRadius: 1,
              height: 4
            }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Cargando compromisos próximos a vencer...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto'
    }}>
      {/* 🎨 Header sobrio que se adapta al tema */}
      <Box sx={{
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: 1,
        p: 3,
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                mb: 0.5,
                color: 'white',
                fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' }
              }}
            >
              ⚠️ Compromisos Próximos a Vencer
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 400,
                color: 'rgba(255,255,255,0.85)',
                mb: 1.5
              }}
            >
              Gestión proactiva de vencimientos • {overdueCounts.total} compromisos activos
            </Typography>
            
            {/* Indicadores compactos con Chips - Diseño sobrio para header */}
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Chip
                icon={<Warning sx={{ fontSize: 16 }} />}
                label={`${overdueCounts.overdue} vencidos`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.75rem',
                  height: 28,
                  '& .MuiChip-icon': {
                    color: 'rgba(255, 193, 7, 1)'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.35)'
                  }
                }}
              />
              <Chip
                icon={<Schedule sx={{ fontSize: 16 }} />}
                label={`${overdueCounts.dueSoon} próximos`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.75rem',
                  height: 28,
                  '& .MuiChip-icon': {
                    color: 'rgba(76, 175, 80, 1)'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.35)'
                  }
                }}
              />
              <Chip
                icon={<AttachMoney sx={{ fontSize: 16 }} />}
                label={formatCurrency(overdueCounts.totalAmount)}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.75rem',
                  height: 28,
                  '& .MuiChip-icon': {
                    color: 'rgba(255, 152, 0, 1)'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.35)'
                  }
                }}
              />
            </Box>
          </Box>
          
          { /* Bloque corregido: se mantiene sólo el botón de actualizar existente */ }
          {refreshing ? ' ' : ''}
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outlined"
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.2,
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 'auto',
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              '&:hover': {
                background: 'rgba(255,255,255,0.25)',
                borderColor: 'rgba(255,255,255,0.4)'
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                borderColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </Box>
      </Box>

      {/* Cards de Resumen - Estilo sobrio */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            title: 'Total Compromisos',
            value: overdueCounts.total,
            icon: Assignment,
            iconBg: '#e3f2fd',
            iconColor: '#2196f3',
            trend: '+12%',
            trendColor: '#4caf50'
          },
          {
            title: 'Vencidos',
            value: overdueCounts.overdue,
            icon: Warning,
            iconBg: '#ffebee',
            iconColor: '#f44336',
            trend: '-5%',
            trendColor: '#f44336'
          },
          {
            title: 'Por Vencer (7 días)',
            value: overdueCounts.dueSoon,
            icon: Schedule,
            iconBg: '#e8f5e8',
            iconColor: '#4caf50',
            trend: '+8%',
            trendColor: '#4caf50'
          },
          {
            title: 'Monto Total',
            value: formatCurrency(overdueCounts.totalAmount),
            icon: AttachMoney,
            iconBg: '#fff3e0',
            iconColor: '#ff9800',
            trend: '-15%',
            trendColor: '#f44336'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
            >
              <Card
                sx={{
                  p: 2.5,
                  height: 130,
                  background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.7)
                    : 'white',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0,0,0,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(0,0,0,0.5)'
                      : '0 8px 24px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)',
                    borderColor: alpha(theme.palette.primary.main, 0.8)
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                        fontSize: '1.75rem'
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        mb: 1.5
                      }}
                    >
                      {stat.title}
                    </Typography>
                    <Chip
                      label={stat.trend}
                      size="small"
                      sx={{
                        backgroundColor: stat.trendColor === '#4caf50' 
                          ? (theme.palette.mode === 'dark' ? alpha('#4caf50', 0.2) : '#e8f5e8')
                          : (theme.palette.mode === 'dark' ? alpha('#f44336', 0.2) : '#ffebee'),
                        color: stat.trendColor,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        border: 'none'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? alpha(stat.iconColor, 0.15)
                        : stat.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <stat.icon sx={{ fontSize: 22, color: stat.iconColor }} />
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Alertas Críticas */}
      {overdueCounts.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.6)}`,
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.8)
                : 'white',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Warning sx={{ color: theme.palette.error.main, fontSize: 20 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.error.main, mb: 0.5 }}>
                  ¡Atención Requerida!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Tienes <strong>{overdueCounts.overdue} compromiso{overdueCounts.overdue > 1 ? 's' : ''} vencido{overdueCounts.overdue > 1 ? 's' : ''}</strong> por un monto de <strong>{formatCurrency(overdueCounts.overdueAmount)}</strong>. Se requiere acción inmediata.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </motion.div>
      )}

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.8)
              : 'white',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Stack direction="column" spacing={2.5}>
            {/* Filtros en una sola fila */}
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" justifyContent="space-between">
              {/* Filtro por Prioridad */}
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <FilterList sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  minWidth: 'fit-content'
                }}>
                  Filtrar por prioridad:
                </Typography>
                {['all', 'critical', 'high', 'medium'].map((filter) => (
                  <motion.div
                    key={filter}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
                  >
                    <Chip
                      label={filter === 'all' ? 'Todas' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      onClick={() => setPriorityFilter(filter)}
                      sx={{ 
                        borderRadius: 1,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        height: 32,
                        backgroundColor: priorityFilter === filter ? theme.palette.primary.main : 'transparent',
                        color: priorityFilter === filter ? 'white' : theme.palette.text.secondary,
                        border: `1px solid ${priorityFilter === filter ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : '#e0e0e0')}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: priorityFilter === filter 
                            ? theme.palette.primary.dark 
                            : (theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.05) : 'white'),
                          borderColor: priorityFilter === filter 
                            ? theme.palette.primary.dark 
                            : (theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.5) : '#d0d0d0'),
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 2px 8px rgba(255,255,255,0.1)' 
                            : '0 2px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </Stack>

              {/* Filtro por Empresa */}
              <Stack direction="row" alignItems="center" spacing={2.5}>
                <Business sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  minWidth: 'fit-content'
                }}>
                  Filtrar por empresa:
                </Typography>
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 220,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      height: 32,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: `1px solid ${theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : '#e0e0e0'}`,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.5) : '#d0d0d0',
                        boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(255,255,255,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      '&.Mui-focused': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    },
                    '& .MuiSelect-select': {
                      padding: '6px 24px',
                      color: theme.palette.text.secondary
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.75rem',
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      transform: 'translate(24px, 8px) scale(1)',
                      '&.Mui-focused, &.MuiFormLabel-filled': {
                        transform: 'translate(24px, -9px) scale(0.75)',
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : '#e0e0e0'
                    },
                    '& fieldset': {
                      borderRadius: 1
                    }
                  }}
                >
                  <InputLabel>Seleccionar empresa</InputLabel>
                  <Select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    label="Seleccionar empresa"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 1,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                          border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.3)}` : '1px solid #f0f0f0',
                          mt: 0.5,
                          '& .MuiMenuItem-root': {
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            padding: '8px 16px',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.05) : 'white'
                            },
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.12)
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="all">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Business sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Todas las empresas
                        </Typography>
                      </Stack>
                    </MenuItem>
                    {uniqueCompanies.map((company) => (
                      <MenuItem key={company} value={company}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Business sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {company}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </motion.div>

      {/* Tabla de Compromisos */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Paper 
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
            background: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.paper, 0.8)
              : 'white',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {/* Grid Layout igual que CommitmentsList */}
          <Box>
            {/* Header usando Grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '0.8fr 2fr 1.5fr 1.2fr 1fr 0.8fr',
              gap: 2,
              p: 2.5,
              bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : 'white',
              borderBottom: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.3)}` : `1px solid #f0f0f0`,
              alignItems: 'center'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Estado
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Compromiso
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary }}>
                Empresa
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary, textAlign: 'center' }}>
                Monto
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary, textAlign: 'center' }}>
                Vencimiento
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary, textAlign: 'center' }}>
                Acciones
              </Typography>
            </Box>

            {/* Filas usando Grid */}
            <AnimatePresence>
              {paginatedCommitments.map((commitment, index) => {
                const daysUntilDue = getDaysUntilDue(commitment.dueDate);
                const isOverdue = daysUntilDue < 0;
                const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
                
                return (
                  <motion.div
                    key={commitment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}
                  >
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: '0.8fr 2fr 1.5fr 1.2fr 1fr 0.8fr',
                      gap: 2,
                      p: 2.5,
                      borderBottom: index === paginatedCommitments.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        cursor: 'pointer'
                      },
                      alignItems: 'center'
                    }}>
                      {/* Estado con StatusChipDS3 */}
                      <StatusChipDS3 
                        status={getStatusInfo(commitment, theme)}
                        showTooltip={true}
                        theme={theme}
                      />

                      {/* Descripción igual que CommitmentsList */}
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
                          {commitment.concept || commitment.description || commitment.title || 'Sin concepto'}
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

                      {/* Empresa con Avatar igual que CommitmentsList */}
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
                          animate={false}
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
                          isPaid={commitment.isPaid || commitment.paid}
                        />
                      </Box>

                      {/* Acciones igual que CommitmentsList */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5,
                        justifyContent: 'center'
                      }}>
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCommitment(commitment);
                            }}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {/* Solo mostrar botón de pagar si el compromiso no está pagado */}
                        {(!commitment.paid && !commitment.isPaid) && (
                          <Tooltip title="Marcar como pagado" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayCommitment(commitment);
                              }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCommitment(commitment);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCommitment(commitment);
                            }}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        </Paper>

        {/* Paginación */}
        {filteredCommitments.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mt: 4,
                mb: 2
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(50, 50, 50, 0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Página {currentPage} de {totalPages} • {filteredCommitments.length} compromisos total
                </Typography>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  variant="outlined"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 1,
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      },
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                        }
                      }
                    }
                  }}
                />
              </Paper>
            </Box>
          </motion.div>
        )}
      </motion.div>

      {/* Empty State */}
      {filteredCommitments.length === 0 && (
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.6)}`,
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.8)
                : 'white',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              ¡Excelente!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No hay compromisos que coincidan con los filtros seleccionados.
            </Typography>
          </Paper>
        </Box>
      )}
      
      {/* Modales y Dialogs */}
      {/* Diálogo de vista detallada - Premium Design System v2.1 COMPLETO */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            backgroundColor: 'transparent !important',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5) !important',
          },
          '& .MuiDialog-paper': {
            margin: '24px',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.background.paper 
              : '#ffffff !important',
          },
          '& .MuiDialogContent-root': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.background.paper 
              : '#ffffff !important',
          },
          '& .MuiDialogActions-root': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.background.paper + ' !important'
              : '#ffffff !important',
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? theme.palette.background.paper + ' !important'
              : '#ffffff !important',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.2 : 0.1)}`,
            overflow: 'hidden',
            position: 'relative'
          }
        }}
      >
        {selectedCommitment && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Header Premium con Gradiente Dinámico */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
                p: 3,
                borderRadius: '8px 8px 0 0',
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
                    {/* Logo de empresa */}
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2.5,
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        position: 'relative',
                        overflow: 'hidden'
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
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? alpha(theme.palette.background.paper, 0.9)
                                : 'rgba(255, 255, 255, 0.9)',
                              border: theme.palette.mode === 'dark'
                                ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
                                : '1px solid rgba(255, 255, 255, 0.3)',
                              zIndex: 1
                            }}
                          />
                        ) : (
                          <Business sx={{ fontSize: 28, color: 'white', zIndex: 1 }} />
                        )}
                      </Box>
                    
                    {/* Información compacta del compromiso */}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, textShadow: '0 2px 4px rgba(0,0,0,0.3)', fontSize: '1.25rem' }}>
                        {selectedCommitment?.concept || selectedCommitment?.description || selectedCommitment?.title || 'Sin concepto'}
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
                            {formatCurrency(selectedCommitment?.amount || 0)}
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
                        </Box>
                    </Box>
                  </Box>

                  {/* Lado derecho: Estado + Botón cerrar */}
                  <Box display="flex" alignItems="center" gap={2}>
                    {/* Estado del compromiso */}
                    <Chip
                      icon={getStatusInfo(selectedCommitment, theme).icon}
                      label={getStatusInfo(selectedCommitment, theme).label}
                      size="medium"
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />

                    {/* Botón de cerrar */}
                    <IconButton
                      onClick={handleCloseViewDialog}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.3)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      ×
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            
            <DialogContent sx={{ 
              p: 4, 
              bgcolor: theme.palette.mode === 'dark' 
                ? theme.palette.background.paper 
                : '#ffffff' 
            }}>
              <Grid container spacing={4}>
                {/* Fecha de Vencimiento - Diseño sobrio */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      p: 2.5,
                      bgcolor: 'background.paper',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      borderRadius: 3,
                      boxShadow: 'none',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CalendarToday sx={{ color: 'primary.main', fontSize: 24 }} />
                      </Box>
                      
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
                          {formatSafeDate(selectedCommitment.dueDate, 'EEEE')}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 500,
                          color: 'text.secondary'
                        }}>
                          {formatSafeDate(selectedCommitment.dueDate, 'dd \'de\' MMMM \'de\' yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Información Adicional COMPLETA */}
                <Grid item xs={12}>
                  <Box>
                    <Card
                      sx={{
                        p: 2.5,
                        bgcolor: 'background.paper',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 3,
                        boxShadow: 'none',
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          mb: 2, 
                          color: 'text.primary',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Info sx={{ fontSize: 20, color: 'primary.main' }} />
                          Información Adicional
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {/* Primera fila: Beneficiario y Método de Pago */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                              },
                              transition: 'all 0.3s ease'
                            }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  Beneficiario
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                color: 'text.primary',
                                fontStyle: selectedCommitment.beneficiary ? 'normal' : 'italic',
                                opacity: selectedCommitment.beneficiary ? 1 : 0.7
                              }}>
                                {selectedCommitment.beneficiary || 'No especificado'}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`
                              },
                              transition: 'all 0.3s ease'
                            }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Payment sx={{ color: 'secondary.main', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                  Método de Pago
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                color: 'text.primary'
                              }}>
                                {(() => {
                                  switch(selectedCommitment.paymentMethod) {
                                    case 'transfer': return 'Transferencia';
                                    case 'cash': return 'Efectivo';
                                    case 'pse': return 'PSE';
                                    case 'check': return 'Cheque';
                                    case 'card': return 'Tarjeta';
                                    default: return 'Transferencia';
                                  }
                                })()}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Segunda fila: Periodicidad y Empresa */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                              },
                              transition: 'all 0.3s ease'
                            }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Schedule sx={{ color: 'info.main', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                  Periodicidad
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                color: 'text.primary'
                              }}>
                                {(() => {
                                  switch(selectedCommitment.periodicity) {
                                    case 'unique': return 'Pago único';
                                    case 'monthly': return 'Mensual';
                                    case 'bimonthly': return 'Bimestral';
                                    case 'quarterly': return 'Trimestral';
                                    case 'fourmonthly': return 'Cuatrimestral';
                                    case 'biannual': return 'Semestral';
                                    case 'annual': return 'Anual';
                                    default: return 'Mensual';
                                  }
                                })()}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                              },
                              transition: 'all 0.3s ease'
                            }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Business sx={{ color: 'success.main', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  Empresa
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={1}>
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
                                      backgroundColor: theme.palette.mode === 'dark' 
                                        ? alpha(theme.palette.background.paper, 0.9)
                                        : 'rgba(255, 255, 255, 0.9)',
                                    }}
                                  />
                                ) : (
                                  <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                                )}
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {companyData?.name || selectedCommitment.company || 'Empresa no especificada'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* Tercera fila: Observaciones (full width) */}
                          <Grid item xs={12}>
                            <Box sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`
                              },
                              transition: 'all 0.3s ease'
                            }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <Notes sx={{ color: 'warning.main', fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                  Observaciones
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 400,
                                lineHeight: 1.5,
                                color: 'text.primary',
                                fontStyle: selectedCommitment.observations ? 'normal' : 'italic',
                                opacity: selectedCommitment.observations ? 1 : 0.7
                              }}>
                                {selectedCommitment.observations || 'Sin observaciones adicionales'}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Cuarta fila: Fechas del sistema */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`,
                              }
                            }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <History sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                                  Fecha de Creación
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                color: 'text.primary'
                              }}>
                                {selectedCommitment.createdAt && safeToDate(selectedCommitment.createdAt)
                                  ? formatSafeDate(selectedCommitment.createdAt, "dd 'de' MMMM 'de' yyyy")
                                  : 'No disponible'
                                }
                              </Typography>
                            </Box>
                          </Grid>

                          {selectedCommitment.updatedAt && (
                            <Grid item xs={12} md={6}>
                              <Box sx={{
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`,
                                }
                              }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                  <Edit sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                                    Última Modificación
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 500,
                                  color: 'text.primary'
                                }}>
                                  {selectedCommitment.updatedAt && safeToDate(selectedCommitment.updatedAt)
                                    ? formatSafeDate(selectedCommitment.updatedAt, "dd 'de' MMMM 'de' yyyy")
                                    : 'No disponible'
                                  }
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions
              sx={{
                p: 4,
                pb: 6,
                // Fondo blanco puro (o mismo paper en dark) sin transparencias ni gradientes
                backgroundColor: theme.palette.mode === 'dark'
                  ? theme.palette.background.paper + ' !important'
                  : '#ffffff !important',
                // Borde superior sutil (se puede quitar si también genera sombra gris)
                borderTop: theme.palette.mode === 'dark'
                  ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
                  : '1px solid #ffffff',
                position: 'relative',
                boxShadow: 'none',
                // Eliminamos pseudo-elemento que creaba degradado y efecto gris
                '&::before': { display: 'none' },
                '&::after': { display: 'none' }
              }}
            >
              <Box>
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
                    '&:hover': {
                      borderColor: alpha(theme.palette.text.primary, 0.3),
                      backgroundColor: alpha(theme.palette.text.primary, 0.04),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.text.primary, 0.15)}`
                    }
                  }}
                >
                  Cerrar
                </Button>
              </Box>
              
              <Box display="flex" gap={2.5}>
                <Box>
                  <Button 
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => handleEditCommitment(selectedCommitment)}
                    sx={{ 
                      borderRadius: 3.5,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                        : `0 8px 25px ${alpha(theme.palette.primary.main, 0.35)}`,
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: theme.palette.mode === 'dark' 
                          ? `0 6px 18px ${alpha(theme.palette.primary.main, 0.4)}`
                          : `0 12px 35px ${alpha(theme.palette.primary.main, 0.45)}`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Editar
                  </Button>
                </Box>
              </Box>
            </DialogActions>
          </div>
        )}
      </Dialog>
      
      {/* Modal de Edición usando CommitmentEditForm */}
      <CommitmentEditForm 
        open={editDialogOpen}
        commitment={selectedCommitment}
        onClose={handleCloseEditDialog}
        onSaved={handleCommitmentSaved}
      />
      
  {/* Eliminado modal de pago: ahora se redirige directamente */}
      
      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        commitment={commitmentToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Box>
  );
};

// Eliminado componente PaymentFormDialog (lógica movida a página dedicada)

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
          ¿Estás seguro de que deseas eliminar el compromiso <strong>"{commitment.title}"</strong>?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, color: theme.palette.error.main }}>
          Esta acción no se puede deshacer.
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

export default DueCommitmentsPage;
