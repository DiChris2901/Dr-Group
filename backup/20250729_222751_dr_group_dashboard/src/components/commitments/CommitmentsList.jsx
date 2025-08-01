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
  Divider
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
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import CommitmentEditForm from './CommitmentEditForm';

const CommitmentsList = ({ companyFilter, statusFilter, searchTerm }) => {
  const { currentUser } = useAuth();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
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

  const getStatusInfo = (commitment) => {
    if (commitment.paid) {
      return {
        label: 'Pagado',
        color: 'success',
        icon: <TrendingUp />
      };
    }

    const today = new Date();
    const dueDate = commitment.dueDate;
    const threeDaysFromNow = addDays(today, 3);

    if (isBefore(dueDate, today)) {
      return {
        label: 'Vencido',
        color: 'error',
        icon: <Warning />
      };
    }

    if (isBefore(dueDate, threeDaysFromNow)) {
      return {
        label: 'Próximo a vencer',
        color: 'warning',
        icon: <Warning />
      };
    }

    return {
      label: 'Pendiente',
      color: 'info',
      icon: <CalendarToday />
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
                        <IconButton size="small" color="error">
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
            <Box
              sx={{
                background: (() => {
                  const status = getStatusInfo(selectedCommitment);
                  switch (status.color) {
                    case 'error':
                      return 'linear-gradient(135deg, #f44336 0%, #e53935 100%)';
                    case 'warning':
                      return 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
                    case 'success':
                      return 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
                    default:
                      return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
                  }
                })(),
                color: 'white',
                p: 4,
                borderRadius: '16px 16px 0 0',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 120,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="40" cy="40" r="3"/%3E%3Ccircle cx="20" cy="20" r="2"/%3E%3Ccircle cx="60" cy="60" r="2"/%3E%3Ccircle cx="80" cy="20" r="2"/%3E%3Ccircle cx="20" cy="80" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  opacity: 0.6
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
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
