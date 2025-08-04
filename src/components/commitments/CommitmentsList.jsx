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
  Tooltip,
  alpha,
  useTheme
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
  Payment as ReceiptIcon,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  Pending
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import CommitmentEditForm from './CommitmentEditForm';
import CountingNumber from '../common/CountingNumber';
import TimeProgress from '../common/TimeProgress';

// 🎨 Design System Spectacular - Configuraciones Centralizadas
const getSpectacularDesignSystem = () => {
  const theme = useTheme();
  
  return {
    // Configuraciones de densidad responsivas
    density: {
      compact: { spacing: 1, padding: 1.5, borderRadius: '8px', shadow: '0 2px 8px rgba(0,0,0,0.12)' },
      normal: { spacing: 2, padding: 2, borderRadius: '12px', shadow: '0 4px 20px rgba(0,0,0,0.15)' },
      spacious: { spacing: 3, padding: 3, borderRadius: '16px', shadow: '0 8px 32px rgba(0,0,0,0.18)' }
    },
    
    // Configuraciones de tamaño de tarjetas
    cardSizes: {
      small: { width: 280, height: 200, fontSize: '0.8rem', iconSize: 16, amountSize: '1rem' },
      medium: { width: 350, height: 250, fontSize: '0.9rem', iconSize: 18, amountSize: '1.2rem' },
      large: { width: 420, height: 300, fontSize: '1rem', iconSize: 20, amountSize: '1.4rem' }
    },
    
    // Gradientes spectacular por estado
    statusGradients: {
      'Pendiente': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Pagado': 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
      'Vencido': 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
      'Próximo': 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
      'En Proceso': 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'
    },
    
    // Efectos hover por modo de vista
    hoverEffects: {
      cards: { scale: 1.03, y: -8, shadow: '0 12px 40px rgba(0,0,0,0.25)' },
      list: { scale: 1.01, y: -2, shadow: '0 6px 24px rgba(0,0,0,0.18)' },
      table: { scale: 1.005, y: -1, shadow: '0 4px 16px rgba(0,0,0,0.12)' }
    },
    
    // Configuraciones responsive de columnas
    responsiveColumns: {
      xs: 1,
      sm: 2, 
      md: 3,
      lg: 4,
      xl: 5
    }
  };
};

const CommitmentsList = ({ companyFilter, statusFilter, searchTerm, viewMode = 'cards', cardSize = 'medium', density = 'normal', showTooltips = true }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // 🎨 Design System Functions
  const designSystem = getSpectacularDesignSystem();
  const { spacing, cardStyles } = {
    spacing: designSystem.density[density],
    cardStyles: designSystem.cardSizes[cardSize]
  };

  // Función para obtener información de estado spectacular
  const getStatusInfo = (commitment) => {
    const dueDate = commitment.dueDate;
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);
    
    if (commitment.status === 'paid' || commitment.paymentValidated) {
      return {
        label: 'Pagado',
        color: theme.palette.success.main,
        chipColor: 'success',
        icon: <CheckCircle />,
        gradient: designSystem.statusGradients['Pagado']
      };
    }
    
    if (daysUntilDue < 0) {
      return {
        label: 'Vencido',
        color: theme.palette.error.main,
        chipColor: 'error',
        icon: <ErrorIcon />,
        gradient: designSystem.statusGradients['Vencido']
      };
    }
    
    if (daysUntilDue <= 3) {
      return {
        label: 'Próximo',
        color: theme.palette.warning.main,
        chipColor: 'warning',
        icon: <Warning />,
        gradient: designSystem.statusGradients['Próximo']
      };
    }
    
    if (commitment.status === 'processing') {
      return {
        label: 'En Proceso',
        color: theme.palette.info.main,
        chipColor: 'info',
        icon: <Schedule />,
        gradient: designSystem.statusGradients['En Proceso']
      };
    }
    
    return {
      label: 'Pendiente',
      color: theme.palette.primary.main,
      chipColor: 'primary',
      icon: <Pending />,
      gradient: designSystem.statusGradients['Pendiente']
    };
  };

  // Función para estilos de chips spectacular
  const getSpectacularChipStyles = (statusInfo) => ({
    background: statusInfo.gradient,
    color: 'white',
    fontWeight: 700,
    fontSize: cardStyles.fontSize,
    px: 2,
    py: 0.5,
    boxShadow: `0 4px 12px ${alpha(statusInfo.color, 0.4)}`,
    border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
    backdropFilter: 'blur(8px)',
    '& .MuiChip-icon': {
      color: 'white',
      fontSize: cardStyles.iconSize
    },
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: `0 6px 16px ${alpha(statusInfo.color, 0.5)}`
    }
  });

  // Función para estilos de acciones spectacular
  const getSpectacularActionStyles = (colorType) => {
    const colors = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main
    };
    
    const color = colors[colorType] || colors.primary;
    
    return {
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
      border: `1px solid ${alpha(color, 0.2)}`,
      color: color,
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.1)} 100%)`,
        transform: 'scale(1.1)',
        boxShadow: `0 4px 12px ${alpha(color, 0.3)}`
      }
    };
  };

  // Función para validar pago
  const hasValidPayment = (commitment) => {
    return commitment.paymentValidated || commitment.status === 'paid';
  };
  const [loadingCompany, setLoadingCompany] = useState(false);

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

  // Manejadores de eventos spectacular
  const handleViewReceipt = (commitment) => {
    // Aquí iría la lógica para mostrar el comprobante de pago
    console.log('Ver comprobante:', commitment);
  };

  const handleDeleteCommitment = (commitment) => {
    // Aquí iría la lógica para eliminar el compromiso
    console.log('Eliminar compromiso:', commitment);
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
    // El componente CommitmentEditForm manejará el cierre
    // Los datos se actualizarán automáticamente por el listener en tiempo real
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
      {viewMode === 'cards' ? (
        // 🎨 Vista Tarjetas Spectacular - Design System Completo
        <Grid 
          container 
          spacing={spacing.spacing}
          sx={{
            '& .MuiGrid-item': {
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }}
        >
          {commitments.map((commitment, index) => {
            const statusInfo = getStatusInfo(commitment);
            const chipSx = getSpectacularChipStyles(statusInfo);
            const dueDate = commitment.dueDate;
            const today = new Date();
            const daysUntilDue = differenceInDays(dueDate, today);
            
            return (
              <Grid 
                item 
                xs={designSystem.responsiveColumns.xs} 
                sm={designSystem.responsiveColumns.sm} 
                md={designSystem.responsiveColumns.md} 
                lg={designSystem.responsiveColumns.lg}
                xl={designSystem.responsiveColumns.xl}
                key={commitment.id}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 120
                  }}
                  whileHover={{ 
                    scale: designSystem.hoverEffects.cards.scale,
                    y: designSystem.hoverEffects.cards.y,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Card
                    sx={{
                      height: cardStyles.height,
                      minWidth: cardStyles.width,
                      background: `
                        linear-gradient(135deg, 
                          ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                          ${alpha(theme.palette.background.paper, 0.85)} 100%
                        )
                      `,
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(statusInfo.color, 0.2)}`,
                      borderRadius: spacing.borderRadius,
                      boxShadow: spacing.shadow,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: alpha(statusInfo.color, 0.4),
                        boxShadow: designSystem.hoverEffects.cards.shadow,
                        transform: `translateY(${designSystem.hoverEffects.cards.y}px)`,
                        '&::before': {
                          opacity: 1
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '6px',
                        background: statusInfo.gradient,
                        opacity: 0.8,
                        transition: 'opacity 0.3s ease',
                        zIndex: 1
                      }
                    }}
                  >
                    {/* Header espectacular con estado y empresa */}
                    <Box sx={{ 
                      p: spacing.padding, 
                      pb: 1,
                      background: `linear-gradient(135deg, ${alpha(statusInfo.color, 0.08)} 0%, transparent 100%)`,
                      position: 'relative',
                      zIndex: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                        >
                          <Chip 
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            size="small"
                            sx={chipSx}
                          />
                        </motion.div>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: cardStyles.iconSize, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            color: 'text.secondary',
                            fontSize: `calc(${cardStyles.fontSize} * 0.8)`
                          }}>
                            {format(dueDate, 'dd/MM', { locale: es })}
                          </Typography>
                          <Box
                            sx={{
                              ml: 1,
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
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
                              fontSize: `calc(${cardStyles.fontSize} * 0.7)`,
                              color: daysUntilDue < 0 
                                ? 'error.main'
                                : daysUntilDue <= 3
                                ? 'warning.main'
                                : 'success.main'
                            }}>
                              {daysUntilDue >= 0 ? `${daysUntilDue}d` : `${Math.abs(daysUntilDue)}d!`}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Empresa */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Business sx={{ fontSize: cardStyles.iconSize, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700,
                          color: 'primary.main',
                          fontSize: cardStyles.fontSize,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          {commitment.companyName || commitment.company || 'Sin empresa'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Contenido principal */}
                    <CardContent sx={{ 
                      p: spacing.padding, 
                      pt: 1,
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between' 
                    }}>
                      <Box>
                        <Typography variant="h6" gutterBottom noWrap sx={{ 
                          fontWeight: 800, 
                          mb: 1,
                          fontSize: cardStyles.fontSize,
                          color: 'text.primary'
                        }}>
                          {commitment.concept || commitment.description || 'Sin concepto'}
                        </Typography>
                        
                        {commitment.beneficiary && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <AccountBalance sx={{ fontSize: cardStyles.iconSize, color: 'info.main' }} />
                            <Typography variant="body2" color="info.main" sx={{ 
                              fontWeight: 600,
                              fontSize: `calc(${cardStyles.fontSize} * 0.9)`,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {commitment.beneficiary}
                            </Typography>
                          </Box>
                        )}
                        
                        {commitment.attachments && commitment.attachments.length > 0 && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <AttachFile sx={{ fontSize: cardStyles.iconSize, color: 'secondary.main' }} />
                              <Typography variant="caption" color="secondary.main" sx={{ 
                                fontWeight: 600,
                                fontSize: `calc(${cardStyles.fontSize} * 0.8)`
                              }}>
                                {commitment.attachments.length} archivo{commitment.attachments.length > 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </motion.div>
                        )}
                      </Box>
                      
                      {/* Monto spectacular */}
                      <Box sx={{ mt: 2 }}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.6, duration: 0.4, type: "spring" }}
                        >
                          <Typography variant="h5" sx={{ 
                            fontWeight: 900, 
                            color: statusInfo.color,
                            fontSize: cardStyles.amountSize,
                            textAlign: 'center',
                            textShadow: `0 2px 4px ${alpha(statusInfo.color, 0.3)}`,
                            background: statusInfo.gradient,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            <CountingNumber end={commitment.amount} duration={800} />
                          </Typography>
                        </motion.div>
                        
                        {/* Progreso de tiempo spectacular */}
                        <Box sx={{ mt: 1 }}>
                          <TimeProgress 
                            createdDate={commitment.createdAt}
                            dueDate={dueDate}
                            size="small"
                            showLabel={false}
                          />
                        </Box>
                      </Box>
                      
                      {/* Acciones spectacular */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: 1, 
                        mt: 2,
                        pt: 2,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        {showTooltips ? (
                          <>
                            <Tooltip title="Ver detalles" arrow>
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewCommitment(commitment)}
                                sx={getSpectacularActionStyles('primary')}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Validar pago" arrow>
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewReceipt(commitment)}
                                sx={getSpectacularActionStyles(hasValidPayment(commitment) ? 'success' : 'secondary')}
                              >
                                <ReceiptIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar compromiso" arrow>
                              <IconButton 
                                size="small"
                                onClick={() => handleEditFromCard(commitment)}
                                sx={getSpectacularActionStyles('warning')}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar compromiso" arrow>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteCommitment(commitment)}
                                sx={getSpectacularActionStyles('error')}
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
                              sx={getSpectacularActionStyles('primary')}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewReceipt(commitment)}
                              sx={getSpectacularActionStyles(hasValidPayment(commitment) ? 'success' : 'secondary')}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => handleEditFromCard(commitment)}
                              sx={getSpectacularActionStyles('warning')}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteCommitment(commitment)}
                              sx={getSpectacularActionStyles('error')}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      ) : viewMode === 'list' ? (
        // 🎨 Vista Lista Spectacular - Design System Completo  
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing }}>
            {commitments.map((commitment, index) => {
              const statusInfo = getStatusInfo(commitment);
              const chipSx = getSpectacularChipStyles(statusInfo);
              const dueDate = commitment.dueDate;
              const today = new Date();
              const daysUntilDue = differenceInDays(dueDate, today);
              
              return (
                <motion.div
                  key={commitment.id}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.08,
                    type: "spring",
                    stiffness: 120
                  }}
                  whileHover={{ 
                    scale: designSystem.hoverEffects.list.scale,
                    y: designSystem.hoverEffects.list.y,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card sx={{
                    background: `
                      linear-gradient(135deg, 
                        ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                        ${alpha(theme.palette.background.paper, 0.85)} 100%
                      )
                    `,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(statusInfo.color, 0.2)}`,
                    borderRadius: spacing.borderRadius,
                    boxShadow: spacing.shadow,
                    p: spacing.padding,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(statusInfo.color, 0.4),
                      boxShadow: designSystem.hoverEffects.list.shadow,
                      '&::before': {
                        opacity: 1
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '6px',
                      background: statusInfo.gradient,
                      opacity: 0.7,
                      transition: 'opacity 0.3s ease'
                    }
                  }}>
                    {/* Estado y indicadores */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 120 }}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.2, duration: 0.3 }}
                      >
                        <Chip 
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          size="medium"
                          sx={chipSx}
                        />
                      </motion.div>
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
                          fontSize: `calc(${cardStyles.fontSize} * 0.8)`,
                          color: daysUntilDue < 0 
                            ? 'error.main'
                            : daysUntilDue <= 3
                            ? 'warning.main'
                            : 'success.main'
                        }}>
                          {daysUntilDue >= 0 ? `${daysUntilDue} días` : `${Math.abs(daysUntilDue)} días!`}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Información principal */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Business sx={{ fontSize: cardStyles.iconSize, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700,
                          color: 'primary.main',
                          fontSize: cardStyles.fontSize,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          {commitment.companyName || commitment.company || 'Sin empresa'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" sx={{ 
                        fontWeight: 800, 
                        mb: 0.5,
                        fontSize: `calc(${cardStyles.fontSize} * 1.1)`,
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {commitment.concept || commitment.description || 'Sin concepto'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600,
                            fontSize: `calc(${cardStyles.fontSize} * 0.9)`,
                            color: 'text.secondary'
                          }}>
                            {format(dueDate, 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                        
                        {commitment.beneficiary && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccountBalance sx={{ fontSize: 14, color: 'info.main' }} />
                            <Typography variant="body2" color="info.main" sx={{ 
                              fontWeight: 600,
                              fontSize: `calc(${cardStyles.fontSize} * 0.9)`,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 150
                            }}>
                              {commitment.beneficiary}
                            </Typography>
                          </Box>
                        )}
                        
                        {commitment.attachments && commitment.attachments.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AttachFile sx={{ fontSize: 14, color: 'secondary.main' }} />
                            <Typography variant="caption" color="secondary.main" sx={{ 
                              fontWeight: 600,
                              fontSize: `calc(${cardStyles.fontSize} * 0.8)`
                            }}>
                              {commitment.attachments.length}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Monto spectacular */}
                    <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.08 + 0.4, duration: 0.4, type: "spring" }}
                      >
                        <Typography variant="h5" sx={{ 
                          fontWeight: 900, 
                          color: statusInfo.color,
                          fontSize: `calc(${cardStyles.amountSize} * 1.1)`,
                          textShadow: `0 2px 4px ${alpha(statusInfo.color, 0.3)}`,
                          mb: 1
                        }}>
                          <CountingNumber end={commitment.amount} duration={600} />
                        </Typography>
                        <TimeProgress 
                          createdDate={commitment.createdAt}
                          dueDate={dueDate}
                          size="small"
                          showLabel={false}
                        />
                      </motion.div>
                    </Box>

                    {/* Acciones spectacular */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 100 }}>
                      {showTooltips ? (
                        <>
                          <Tooltip title="Ver detalles" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewCommitment(commitment)}
                              sx={getSpectacularActionStyles('primary')}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Validar pago" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewReceipt(commitment)}
                              sx={getSpectacularActionStyles(hasValidPayment(commitment) ? 'success' : 'secondary')}
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar compromiso" arrow>
                            <IconButton 
                              size="small"
                              onClick={() => handleEditFromCard(commitment)}
                              sx={getSpectacularActionStyles('warning')}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar compromiso" arrow>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteCommitment(commitment)}
                              sx={getSpectacularActionStyles('error')}
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
                            sx={getSpectacularActionStyles('primary')}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewReceipt(commitment)}
                            sx={getSpectacularActionStyles(hasValidPayment(commitment) ? 'success' : 'secondary')}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleEditFromCard(commitment)}
                            sx={getSpectacularActionStyles('warning')}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteCommitment(commitment)}
                            sx={getSpectacularActionStyles('error')}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Card>
                </motion.div>
              );
            })}
          </Box>
        </motion.div>
      ) : (
        // 🎨 Vista Tabla Spectacular - Design System Completo
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <Card sx={{ 
            overflow: 'hidden', 
            background: `
              linear-gradient(135deg, 
                ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                ${alpha(theme.palette.background.paper, 0.9)} 100%
              )
            `,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: spacing.borderRadius,
            boxShadow: spacing.shadow,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              zIndex: 1
            }
          }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                {/* Encabezado spectacular */}
                <Box component="thead">
                  <motion.tr
                    component={Box}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    sx={{
                      background: `
                        linear-gradient(135deg, 
                          ${alpha(theme.palette.primary.main, 0.15)} 0%, 
                          ${alpha(theme.palette.secondary.main, 0.08)} 100%
                        )
                      `,
                      borderBottom: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    {['Estado', 'Descripción', 'Empresa', 'Monto', 'Vencimiento', 'Acciones'].map((header, index) => (
                      <Box key={header} component="th" sx={{ 
                        p: spacing.padding, 
                        textAlign: index === 3 ? 'right' : index >= 4 ? 'center' : 'left',
                        fontWeight: 800, 
                        color: 'primary.main',
                        fontSize: cardStyles.fontSize,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        {header}
                      </Box>
                    ))}
                  </motion.tr>
                </Box>
                
                {/* Contenido spectacular */}
                <Box component="tbody">
                  {commitments.map((commitment, index) => {
                    const statusInfo = getStatusInfo(commitment);
                    const chipSx = getSpectacularChipStyles(statusInfo);
                    const dueDate = commitment.dueDate;
                    const today = new Date();
                    const daysUntilDue = differenceInDays(dueDate, today);
                    
                    return (
                      <motion.tr
                        key={commitment.id}
                        component={Box}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 + 0.3 }}
                        sx={{
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          '&:hover': {
                            background: `
                              linear-gradient(135deg, 
                                ${alpha(statusInfo.color, 0.08)} 0%, 
                                ${alpha(statusInfo.color, 0.03)} 100%
                              )
                            `,
                            transform: `scale(${designSystem.hoverEffects.table.scale})`,
                            boxShadow: designSystem.hoverEffects.table.shadow,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }
                        }}
                      >
                        {/* Estado */}
                        <Box component="td" sx={{ p: spacing.padding }}>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.4, duration: 0.3 }}
                          >
                            <Chip 
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              sx={{
                                ...chipSx,
                                fontSize: `calc(${cardStyles.fontSize} * 0.85)`
                              }}
                            />
                          </motion.div>
                        </Box>

                        {/* Descripción */}
                        <Box component="td" sx={{ p: spacing.padding, maxWidth: 250 }}>
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.5, duration: 0.3 }}
                          >
                            <Typography variant="body2" sx={{ 
                              fontWeight: 700, 
                              mb: 0.5, 
                              fontSize: cardStyles.fontSize,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {commitment.concept || commitment.description || 'Sin concepto'}
                            </Typography>
                            {commitment.beneficiary && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccountBalance sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary" sx={{
                                  fontSize: `calc(${cardStyles.fontSize} * 0.8)`,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {commitment.beneficiary}
                                </Typography>
                              </Box>
                            )}
                          </motion.div>
                        </Box>

                        {/* Empresa */}
                        <Box component="td" sx={{ p: spacing.padding, maxWidth: 200 }}>
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.6, duration: 0.3 }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Business sx={{ fontSize: cardStyles.iconSize, color: 'primary.main' }} />
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                fontSize: cardStyles.fontSize,
                                color: 'primary.main',
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {commitment.companyName || commitment.company || 'Sin empresa'}
                              </Typography>
                            </Box>
                          </motion.div>
                        </Box>

                        {/* Monto */}
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'right' }}>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.7, duration: 0.4, type: "spring" }}
                          >
                            <Typography variant="h6" sx={{ 
                              fontWeight: 800, 
                              color: statusInfo.color,
                              fontSize: cardStyles.amountSize,
                              textShadow: `0 1px 3px ${alpha(statusInfo.color, 0.3)}`
                            }}>
                              <CountingNumber end={commitment.amount} duration={500} />
                            </Typography>
                            {commitment.attachments && commitment.attachments.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}>
                                <AttachFile sx={{ fontSize: 12, color: 'info.main', mr: 0.5 }} />
                                <Typography variant="caption" color="info.main" sx={{ 
                                  fontSize: `calc(${cardStyles.fontSize} * 0.7)`,
                                  fontWeight: 600
                                }}>
                                  {commitment.attachments.length}
                                </Typography>
                              </Box>
                            )}
                          </motion.div>
                        </Box>

                        {/* Vencimiento */}
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'center' }}>
                          <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.8, duration: 0.3 }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600,
                                  fontSize: cardStyles.fontSize,
                                  color: 'text.primary'
                                }}>
                                  {format(dueDate, 'dd/MM/yy', { locale: es })}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.2,
                                  borderRadius: 1,
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
                                  fontSize: `calc(${cardStyles.fontSize} * 0.7)`,
                                  color: daysUntilDue < 0 
                                    ? 'error.main'
                                    : daysUntilDue <= 3
                                    ? 'warning.main'
                                    : 'success.main'
                                }}>
                                  {daysUntilDue >= 0 ? `${daysUntilDue}d` : `${Math.abs(daysUntilDue)}d!`}
                                </Typography>
                              </Box>
                            </Box>
                          </motion.div>
                        </Box>

                        {/* Acciones */}
                        <Box component="td" sx={{ p: spacing.padding, textAlign: 'center' }}>
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.9, duration: 0.3 }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              {showTooltips ? (
                                <>
                                  <Tooltip title="Ver detalles" arrow>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleViewCommitment(commitment)}
                                      sx={getSpectacularActionStyles('primary')}
                                    >
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Validar pago" arrow>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleViewReceipt(commitment)}
                                      sx={getSpectacularActionStyles(hasValidPayment(commitment) ? 'success' : 'secondary')}
                                    >
                                      <ReceiptIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Editar compromiso" arrow>
                                    <IconButton 
                                      size="small"
                                      onClick={() => handleEditFromCard(commitment)}
                                      sx={getSpectacularActionStyles('warning')}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar compromiso" arrow>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteCommitment(commitment)}
                                      sx={getSpectacularActionStyles('error')}
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
                                    sx={getSpectacularActionStyles('primary')}
                                  >
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleViewReceipt(commitment)}
                                    sx={getSpectacularActionStyles(hasValidPayment(commitment) ? 'success' : 'secondary')}
                                  >
                                    <ReceiptIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleEditFromCard(commitment)}
                                    sx={getSpectacularActionStyles('warning')}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeleteCommitment(commitment)}
                                    sx={getSpectacularActionStyles('error')}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </motion.div>
                        </Box>
                      </motion.tr>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Card>
        </motion.div>
      )}

      {/* Diálogo de vista detallada spectacular */}
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
            <DialogTitle sx={{
              background: (() => {
                const status = getStatusInfo(selectedCommitment);
                return status.gradient;
              })(),
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="40" cy="40" r="3"/%3E%3Ccircle cx="20" cy="20" r="2"/%3E%3Ccircle cx="60" cy="60" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.6
              }
            }}>
              <Typography variant="h5" sx={{ fontWeight: 800, position: 'relative', zIndex: 1 }}>
                Detalles del Compromiso
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedCommitment.concept || selectedCommitment.description || 'Sin concepto'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Empresa:</strong> {selectedCommitment.companyName || selectedCommitment.company || 'Sin empresa'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Monto:</strong> <CountingNumber end={selectedCommitment.amount} duration={1000} />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Fecha de vencimiento:</strong> {format(selectedCommitment.dueDate, 'dd/MM/yyyy', { locale: es })}
              </Typography>
              {selectedCommitment.beneficiary && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Beneficiario:</strong> {selectedCommitment.beneficiary}
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={handleCloseViewDialog} sx={{ mr: 2 }}>
                Cerrar
              </Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditFromPopup}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Formulario de edición */}
      <CommitmentEditForm
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        commitment={selectedCommitment}
        onSaved={handleCommitmentSaved}
      />
    </Box>
  );
                  zIndex: 0
                }
              }}
            >
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between" 
                sx={{ position: 'relative', zIndex: 2, height: '100%' }}
              >
                <Box display="flex" alignItems="center" gap={3}>
                  {/* Logo de la empresa */}
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {companyData?.logoURL ? (
                      <img 
                        src={companyData.logoURL} 
                        alt={companyData.name}
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          objectFit: 'contain',
                          borderRadius: 8
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Business sx={{ fontSize: 36, color: 'rgba(255, 255, 255, 0.8)' }} />
                    )}
                  </Box>
                  
                  {/* Información principal */}
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: '2rem' }}>
                      {selectedCommitment.concept || selectedCommitment.description || 'Sin concepto'}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500, mb: 0.5 }}>
                      {selectedCommitment.companyName || selectedCommitment.company || companyData?.name || 'Sin empresa'}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, fontSize: '2.5rem' }}>
                      {formatCurrency(selectedCommitment.amount)}
                    </Typography>
                  </Box>
                </Box>

                {/* Estado del compromiso */}
                <Box textAlign="right">
                  <Chip
                    icon={getStatusInfo(selectedCommitment).icon}
                    label={getStatusInfo(selectedCommitment).label}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                      height: 40,
                      backdropFilter: 'blur(15px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      mb: 2,
                      '& .MuiChip-icon': { 
                        color: 'white',
                        fontSize: '1.2rem'
                      }
                    }}
                  />
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                    Vence: {format(selectedCommitment.dueDate, 'dd MMM yyyy', { locale: es })}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                {/* Fecha de Vencimiento Destacada */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.03) 100%)',
                      border: '2px solid rgba(255, 152, 0, 0.15)',
                      borderRadius: 4,
                      textAlign: 'center'
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3
                        }}
                      >
                        <CalendarToday sx={{ color: 'white', fontSize: 32 }} />
                      </Box>
                      <Box textAlign="left">
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                          Fecha de Vencimiento
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                          {format(selectedCommitment.dueDate, 'EEEE', { locale: es })}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {format(selectedCommitment.dueDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Información Adicional */}
                {(selectedCommitment.beneficiary || selectedCommitment.observations) && (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, rgba(96, 125, 139, 0.06) 0%, rgba(96, 125, 139, 0.02) 100%)',
                        border: '1px solid rgba(96, 125, 139, 0.12)',
                        borderRadius: 4
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
                        📋 Información Adicional
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {selectedCommitment.beneficiary && (
                          <Grid item xs={12} md={6}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                👤 Beneficiario
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                p: 2, 
                                bgcolor: 'rgba(25, 118, 210, 0.08)', 
                                borderRadius: 2,
                                border: '1px solid rgba(25, 118, 210, 0.12)'
                              }}>
                                {selectedCommitment.beneficiary}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {selectedCommitment.observations && (
                          <Grid item xs={12} md={selectedCommitment.beneficiary ? 6 : 12}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                📝 Observaciones
                              </Typography>
                              <Typography variant="body1" sx={{ 
                                p: 2, 
                                bgcolor: 'rgba(76, 175, 80, 0.08)', 
                                borderRadius: 2,
                                border: '1px solid rgba(76, 175, 80, 0.12)'
                              }}>
                                {selectedCommitment.observations}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Card>
                  </Grid>
                )}

                {/* Archivos Adjuntos */}
                {selectedCommitment.attachments && selectedCommitment.attachments.length > 0 && (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.03) 100%)',
                        border: '2px solid rgba(33, 150, 243, 0.15)',
                        borderRadius: 4
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 3
                          }}
                        >
                          <AttachFile sx={{ color: 'white', fontSize: 32 }} />
                        </Box>
                        <Box textAlign="left">
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                            Archivos Adjuntos
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {selectedCommitment.attachments.length}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            archivo(s) disponible(s)
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions 
              sx={{ 
                p: 3, 
                background: 'rgba(248, 250, 252, 0.8)',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)'
              }}
            >
              <Button 
                onClick={handleCloseViewDialog}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Cerrar
              </Button>
              <Button 
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditFromPopup}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Editar
              </Button>
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
