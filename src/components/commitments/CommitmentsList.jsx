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
  Fade
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
  GetApp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, addDays, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import useCommitmentAlerts from '../../hooks/useCommitmentAlerts';
import CommitmentEditForm from './CommitmentEditForm';

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

const CommitmentsList = ({ companyFilter, statusFilter, searchTerm }) => {
  const { currentUser } = useAuth();
  const { addNotification, addAlert } = useNotifications();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Hook para generar alertas automáticas de compromisos vencidos/próximos a vencer
  const { overdueCount, dueSoonCount } = useCommitmentAlerts(commitments);

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
        color: 'success',
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
        color: 'error',
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
        color: 'warning',
        icon: <Schedule />,
        gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        shadowColor: 'rgba(255, 152, 0, 0.3)',
        action: 'Programar Pago',
        actionIcon: <NotificationAdd />
      };
    }

    return {
      label: `Pendiente (${daysDifference} días)`,
      color: 'info',
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
      `¿Estás seguro de que quieres eliminar el compromiso "${commitment.concept || commitment.description || 'Sin concepto'}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, 'commitments', commitment.id));
      
      // Mostrar notificación de éxito
      addNotification({
        type: 'success',
        title: '¡Compromiso eliminado!',
        message: `Se eliminó exitosamente el compromiso "${commitment.concept || commitment.description || 'Sin concepto'}"`,
        icon: '🗑️'
      });

    } catch (error) {
      console.error('Error al eliminar compromiso:', error);
      
      // Mostrar notificación de error
      addNotification({
        type: 'error',
        title: 'Error al eliminar',
        message: 'No se pudo eliminar el compromiso. Inténtalo de nuevo.',
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
      <Grid container spacing={3}>
        {commitments.map((commitment, index) => {
          const statusInfo = getStatusInfo(commitment);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={commitment.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                      />
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewCommitment(commitment)}
                          sx={{ mr: 1 }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => handleEditFromCard(commitment)}
                          title="Editar compromiso"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteCommitment(commitment)}
                          title="Eliminar compromiso"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="h6" gutterBottom noWrap>
                      {commitment.concept || commitment.description || 'Sin concepto'}
                    </Typography>

                    <Box display="flex" alignItems="center" mb={1}>
                      <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
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

                    <Box display="flex" alignItems="center" mb={2}>
                      <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(commitment.dueDate, 'dd MMM yyyy', { locale: es })}
                      </Typography>
                    </Box>

                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      {formatCurrency(commitment.amount)}
                    </Typography>

                    {commitment.attachments && commitment.attachments.length > 0 && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <AttachFile sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {commitment.attachments.length} archivo(s)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Diálogo de vista detallada */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.8)'
          }
        }}
      >
        {selectedCommitment && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Box
                sx={{
                  background: getStatusInfo(selectedCommitment).gradient,
                  color: 'white',
                  p: 2.5,
                  borderRadius: '16px 16px 0 0',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 75,
                  boxShadow: `
                    0 8px 32px ${getStatusInfo(selectedCommitment).shadowColor},
                    0 4px 16px rgba(0, 0, 0, 0.2),
                    0 2px 8px rgba(0, 0, 0, 0.15),
                    0 1px 3px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                  `,
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3Ccircle cx="15" cy="15" r="1.5"/%3E%3Ccircle cx="45" cy="45" r="1.5"/%3E%3Ccircle cx="60" cy="15" r="1.5"/%3E%3Ccircle cx="15" cy="60" r="1.5"/%3E%3Cpath d="M30 45L45 30L30 15L15 30z" fill-opacity="0.04"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
                      linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, transparent 60%),
                      linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 25%, rgba(255, 255, 255, 0.05) 50%, transparent 75%)
                    `,
                    opacity: 0.9,
                    mixBlendMode: 'overlay'
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 240,
                    height: 240,
                    borderRadius: '50%',
                    background: `
                      radial-gradient(circle, 
                        rgba(255, 255, 255, 0.25) 0%, 
                        rgba(255, 255, 255, 0.15) 20%,
                        rgba(255, 255, 255, 0.08) 40%, 
                        transparent 70%
                      ),
                      conic-gradient(from 0deg, 
                        transparent 0deg, 
                        rgba(255, 255, 255, 0.15) 45deg,
                        rgba(255, 255, 255, 0.1) 90deg, 
                        transparent 135deg,
                        rgba(255, 255, 255, 0.05) 180deg,
                        transparent 225deg
                      )
                    `,
                    zIndex: 0,
                    animation: 'rotate 25s linear infinite',
                    '@keyframes rotate': {
                      from: { transform: 'rotate(0deg)' },
                      to: { transform: 'rotate(360deg)' }
                    }
                  }
                }}
              >
                  <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  sx={{ position: 'relative', zIndex: 2, height: '100%' }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    {/* Logo de la empresa con efecto de pulso mejorado */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
                      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                      transition={{ 
                        delay: 0.2, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.08, 
                        rotateY: 5,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          background: `
                            linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%),
                            rgba(255, 255, 255, 0.05)
                          `,
                          backdropFilter: 'blur(20px) saturate(200%)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          boxShadow: `
                            0 8px 32px rgba(0, 0, 0, 0.25),
                            0 2px 8px rgba(0, 0, 0, 0.15),
                            inset 0 1px 0 rgba(255, 255, 255, 0.3),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                          `,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 'inherit',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          },
                          '&:hover::before': {
                            opacity: 1
                          }
                        }}
                      >
                        {companyData?.logoURL ? (
                          <img 
                            src={companyData.logoURL} 
                            alt={companyData.name}
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'contain',
                              borderRadius: 6
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Business sx={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.9)' }} />
                        )}
                      </Box>
                    </motion.div>
                    
                    {/* Información principal con mejor espaciado */}
                    <Box sx={{ ml: 0.5 }}>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          delay: 0.1, 
                          duration: 0.5,
                          type: "spring",
                          stiffness: 80
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 800, 
                            mb: 0.3, 
                            fontSize: '1.4rem', 
                            textShadow: '0 3px 6px rgba(0,0,0,0.15)',
                            lineHeight: 1.2,
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {selectedCommitment.concept || selectedCommitment.description || 'Sin concepto'}
                        </Typography>
                      </motion.div>
                      
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          delay: 0.2, 
                          duration: 0.5,
                          type: "spring",
                          stiffness: 80
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            opacity: 0.92, 
                            fontWeight: 500, 
                            mb: 0.5, 
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {selectedCommitment.companyName || selectedCommitment.company || companyData?.name || 'Sin empresa'}
                        </Typography>
                      </motion.div>
                      
                      <motion.div
                        initial={{ x: -20, opacity: 0, scale: 0.9 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: 0.3, 
                          duration: 0.6, 
                          type: "spring",
                          stiffness: 60
                        }}
                      >
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 900, 
                            fontSize: '1.8rem', 
                            textShadow: '0 4px 12px rgba(0,0,0,0.25)',
                            lineHeight: 1,
                            letterSpacing: '-0.03em',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                          }}
                        >
                          <CountingNumber end={selectedCommitment.amount} duration={1800} />
                        </Typography>
                      </motion.div>
                    </Box>
                  </Box>

                  {/* Estado del compromiso y acciones - BANNER DERECHO */}
                  <Box textAlign="right" sx={{ ml: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                    {/* Chip de Estado */}
                    <motion.div
                      initial={{ x: 20, opacity: 0, scale: 0.9 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.2, 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 100
                      }}
                    >
                      <Chip
                        icon={getStatusInfo(selectedCommitment).icon}
                        label={getStatusInfo(selectedCommitment).label}
                        sx={{ 
                          bgcolor: 'rgba(0, 0, 0, 0.25)',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          height: 36,
                          px: 1.5,
                          backdropFilter: 'blur(20px) saturate(200%)',
                          border: '2px solid rgba(0, 0, 0, 0.3)',
                          borderRadius: '18px',
                          background: `
                            linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.25) 100%),
                            linear-gradient(225deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
                          `,
                          boxShadow: `
                            0 6px 25px rgba(0, 0, 0, 0.4),
                            0 2px 10px rgba(0, 0, 0, 0.25),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                          `,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 'inherit',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          },
                          '& .MuiChip-icon': { 
                            color: 'white',
                            fontSize: '1.1rem',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                            animation: 'pulse 2s infinite'
                          },
                          '& .MuiChip-label': {
                            textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                            letterSpacing: '0.02em'
                          },
                          '&:hover': {
                            transform: 'translateY(-2px) scale(1.02)',
                            bgcolor: 'rgba(0, 0, 0, 0.35)',
                            boxShadow: `
                              0 10px 35px rgba(0, 0, 0, 0.5),
                              0 4px 15px rgba(0, 0, 0, 0.3),
                              inset 0 1px 0 rgba(255, 255, 255, 0.25),
                              inset 0 -1px 0 rgba(0, 0, 0, 0.4)
                            `,
                            '&::before': {
                              opacity: 1
                            }
                          },
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                            '100%': { opacity: 1 }
                          }
                        }}
                      />
                    </motion.div>
                    
                    {/* Fecha de Vencimiento */}
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ 
                        delay: 0.3, 
                        duration: 0.4,
                        type: "spring"
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.95, 
                          fontWeight: 700, 
                          textShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          fontSize: '0.8rem',
                          letterSpacing: '0.03em',
                          display: 'block',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                        }}
                      >
                        Vence: {format(selectedCommitment.dueDate, 'dd MMM yyyy', { locale: es })}
                      </Typography>
                    </motion.div>
                    
                    {/* Botón de Acción Dinámico - SIEMPRE VISIBLE */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 15 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.4, 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 120
                      }}
                      whileHover={{ 
                        scale: 1.08,
                        y: -3 
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="contained"
                        startIcon={selectedCommitment.paid ? <GetApp /> : <Payment />}
                        size="medium"
                        onClick={() => {
                          if (selectedCommitment.paid) {
                            console.log('Ver comprobante - Compromiso ya pagado');
                          } else {
                            console.log('¡PAGAR AHORA! - Proceder con el pago');
                          }
                        }}
                        sx={{
                          bgcolor: 'rgba(0, 0, 0, 0.25)',
                          color: 'white',
                          backdropFilter: 'blur(25px) saturate(200%)',
                          border: '2px solid rgba(0, 0, 0, 0.3)',
                          borderRadius: '24px',
                          px: 3,
                          py: 1,
                          fontWeight: 800,
                          textTransform: 'none',
                          fontSize: '0.85rem',
                          letterSpacing: '0.02em',
                          minWidth: '140px',
                          height: '48px',
                          background: `
                            linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.25) 100%),
                            linear-gradient(225deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)
                          `,
                          boxShadow: `
                            0 8px 32px rgba(0, 0, 0, 0.4),
                            0 4px 16px rgba(0, 0, 0, 0.25),
                            inset 0 2px 0 rgba(255, 255, 255, 0.2),
                            inset 0 -2px 0 rgba(0, 0, 0, 0.3)
                          `,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 'inherit',
                            background: `
                              linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)
                            `,
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '0',
                            height: '0',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.6s ease',
                            transform: 'translate(-50%, -50%)'
                          },
                          '& .MuiButton-startIcon': {
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                            fontSize: '1.1rem !important',
                            color: 'white'
                          },
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.35)',
                            transform: 'translateY(-3px)',
                            boxShadow: `
                              0 12px 40px rgba(0, 0, 0, 0.5),
                              0 6px 20px rgba(0, 0, 0, 0.3),
                              inset 0 2px 0 rgba(255, 255, 255, 0.25),
                              inset 0 -2px 0 rgba(0, 0, 0, 0.4)
                            `,
                            '&::before': {
                              opacity: 1
                            },
                            '&::after': {
                              width: '100%',
                              height: '100%'
                            }
                          },
                          '&:active': {
                            transform: 'translateY(-1px)',
                            boxShadow: `
                              0 6px 20px rgba(0, 0, 0, 0.2),
                              0 2px 8px rgba(0, 0, 0, 0.15),
                              inset 0 1px 0 rgba(255, 255, 255, 0.3)
                            `
                          }
                        }}
                      >
                        {selectedCommitment.paid ? 'Pagado' : 'Pagar Ahora'}
                      </Button>
                    </motion.div>
                  </Box>
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

                {/* Fecha de Vencimiento Destacada con mejor espaciado */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
                  >
                    <Card
                      sx={{
                        p: 3.5,
                        background: `
                          linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.08) 50%, rgba(255, 152, 0, 0.04) 100%),
                          linear-gradient(225deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)
                        `,
                        border: '2px solid rgba(255, 152, 0, 0.25)',
                        borderRadius: 4,
                        textAlign: 'center',
                        boxShadow: `
                          0 12px 40px rgba(255, 152, 0, 0.2),
                          0 4px 16px rgba(255, 152, 0, 0.15),
                          0 2px 8px rgba(0, 0, 0, 0.08),
                          inset 0 1px 0 rgba(255, 255, 255, 0.4)
                        `,
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -50,
                          left: -50,
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          background: `
                            radial-gradient(circle, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.08) 40%, transparent 70%),
                            conic-gradient(from 45deg, transparent 0deg, rgba(255, 152, 0, 0.1) 90deg, transparent 180deg)
                          `,
                          zIndex: 0,
                          animation: 'rotate 15s linear infinite'
                        },
                        '@keyframes rotate': {
                          from: { transform: 'rotate(0deg)' },
                          to: { transform: 'rotate(360deg)' }
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" mb={2.5} sx={{ position: 'relative', zIndex: 1 }}>
                        <motion.div
                          initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
                          animate={{ rotate: 0, scale: 1, opacity: 1 }}
                          transition={{ 
                            delay: 0.3, 
                            duration: 0.8, 
                            type: "spring",
                            stiffness: 80
                          }}
                          whileHover={{ 
                            scale: 1.1, 
                            rotate: [0, -5, 5, 0],
                            transition: { duration: 0.6 }
                          }}
                        >
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: 3.5,
                              background: `
                                linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #e65100 100%),
                                radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)
                              `,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 3,
                              boxShadow: `
                                0 12px 32px rgba(255, 152, 0, 0.4),
                                0 4px 16px rgba(255, 152, 0, 0.25),
                                0 2px 8px rgba(0, 0, 0, 0.15),
                                inset 0 2px 0 rgba(255, 255, 255, 0.2),
                                inset 0 -2px 0 rgba(0, 0, 0, 0.1)
                              `,
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
                                borderRadius: 'inherit'
                              }
                            }}
                          >
                            <CalendarToday sx={{ color: 'white', fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                          </Box>
                        </motion.div>
                        <Box textAlign="left">
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.8, fontWeight: 500, fontSize: '0.95rem' }}>
                            Fecha de Vencimiento
                          </Typography>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                          >
                            <Typography variant="h5" sx={{ 
                              fontWeight: 700, 
                              color: 'warning.main',
                              fontSize: '1.4rem',
                              textTransform: 'capitalize',
                              mb: 0.2
                            }}>
                              {format(selectedCommitment.dueDate, 'EEEE', { locale: es })}
                            </Typography>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                          >
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600,
                              fontSize: '1.1rem',
                              color: 'text.primary',
                              lineHeight: 1.3
                            }}>
                              {format(selectedCommitment.dueDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                            </Typography>
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
              >
                <Button 
                  onClick={handleCloseViewDialog}
                  sx={{ 
                    borderRadius: 3.5,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'text.secondary',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.06)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
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
          </>
        )}
      </Dialog>

      {/* Formulario de edición compacto */}
      <CommitmentEditForm
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        commitment={selectedCommitment}
        onSaved={handleCommitmentSaved}
      />
    </Box>
  );
};

export default CommitmentsList;
