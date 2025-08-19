import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  Paper,
  Avatar,
  Divider,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';

const IncomePage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  // Estados principales
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el modal de agregar/editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  
  // Estados para distribución por empresas
  const [companies, setCompanies] = useState([]);
  const [distributions, setDistributions] = useState([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    client: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'transferencia',
    account: '',
    bank: '',
    isClientPaidInFull: false
  });
  
  const [saving, setSaving] = useState(false);

  // Cargar ingresos desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'incomes'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const incomesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          incomesData.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
          });
        });

        setIncomes(incomesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando ingresos:', error);
        setError('Error al cargar ingresos: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Cargar empresas desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    const companiesQuery = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      companiesQuery,
      (snapshot) => {
        const companiesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({
            id: doc.id,
            ...data
          });
        });
        setCompanies(companiesData);
      },
      (error) => {
        console.error('Error cargando empresas:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const totalAmount = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const thisMonth = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      const now = new Date();
      return incomeDate.getMonth() === now.getMonth() && 
             incomeDate.getFullYear() === now.getFullYear();
    });
    const monthlyAmount = thisMonth.reduce((sum, income) => sum + (income.amount || 0), 0);

    return {
      total: incomes.length,
      totalAmount,
      monthlyTotal: thisMonth.length,
      monthlyAmount
    };
  }, [incomes]);

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar checkbox "al día"
  const handlePaidInFullChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isClientPaidInFull: checked
    }));

    // Si se marca como "al día" y no es una edición, abrir modal de distribución
    if (checked && !selectedIncome) {
      // Validar campos requeridos antes de abrir distribución
      if (!formData.client.trim() || !formData.amount || !formData.date) {
        addToast({
          type: 'error',
          title: 'Campos obligatorios',
          message: 'Por favor completa Cliente, Monto y Fecha antes de marcar como "al día"'
        });
        setFormData(prev => ({
          ...prev,
          isClientPaidInFull: false
        }));
        return;
      }
      handleOpenDistributionDialog();
    }
  };

  // Abrir modal para agregar ingreso
  const handleAddIncome = () => {
    setSelectedIncome(null);
    setFormData({
      client: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'transferencia',
      account: '',
      bank: '',
      isClientPaidInFull: false
    });
    setDialogOpen(true);
  };

  // Abrir modal para editar ingreso
  const handleEditIncome = (income) => {
    setSelectedIncome(income);
    setFormData({
      client: income.client || '',
      amount: income.amount?.toString() || '',
      description: income.description || '',
      date: income.date ? format(income.date, 'yyyy-MM-dd') : '',
      paymentMethod: income.paymentMethod || 'transferencia',
      account: income.account || '',
      bank: income.bank || '',
      isClientPaidInFull: income.isClientPaidInFull || false
    });
    setDialogOpen(true);
  };

  // Ver detalles del ingreso
  const handleViewIncome = (income) => {
    setSelectedIncome(income);
    setViewDialogOpen(true);
  };

  // Confirmar eliminación
  const handleDeleteIncome = (income) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  // Guardar ingreso
  const handleSaveIncome = async () => {
    if (!formData.client.trim() || !formData.amount || !formData.date) {
      addToast({
        type: 'error',
        title: 'Campos obligatorios',
        message: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    setSaving(true);

    try {
      const incomeData = {
        client: formData.client.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: Timestamp.fromDate(new Date(formData.date)),
        paymentMethod: formData.paymentMethod,
        account: formData.account.trim(),
        bank: formData.bank.trim(),
        isClientPaidInFull: formData.isClientPaidInFull || false,
        createdBy: currentUser.uid,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (selectedIncome) {
        // Actualizar
        await updateDoc(doc(db, 'incomes', selectedIncome.id), incomeData);
        addToast({
          type: 'success',
          title: 'Ingreso actualizado',
          message: 'El ingreso ha sido actualizado correctamente'
        });
      } else {
        // Crear nuevo (solo si NO está marcado como "al día")
        if (!formData.isClientPaidInFull) {
          incomeData.createdAt = Timestamp.fromDate(new Date());
          await addDoc(collection(db, 'incomes'), incomeData);
          addToast({
            type: 'success',
            title: 'Ingreso registrado',
            message: 'El ingreso ha sido registrado correctamente'
          });
        } else {
          // Si está marcado como "al día", el guardado se hace desde el modal de distribución
          addToast({
            type: 'info',
            title: 'Distribución requerida',
            message: 'Complete la distribución por empresas para finalizar'
          });
          setSaving(false);
          return;
        }
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('Error guardando ingreso:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Error al guardar el ingreso: ' + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  // Funciones para distribución por empresas
  const handleOpenDistributionDialog = () => {
    if (companies.length === 0) {
      addToast({
        type: 'warning',
        title: 'No hay empresas',
        message: 'Primero debe registrar empresas en el sistema'
      });
      return;
    }

    // Inicializar distribuciones vacías para todas las empresas
    const initialDistributions = companies.map(company => ({
      companyId: company.id,
      companyName: company.name,
      amount: 0
    }));
    setDistributions(initialDistributions);
    setDistributionDialogOpen(true);
  };

  const handleDistributionChange = (companyId, amount) => {
    setDistributions(prev =>
      prev.map(dist =>
        dist.companyId === companyId
          ? { ...dist, amount: parseFloat(amount) || 0 }
          : dist
      )
    );
  };

  const getTotalDistribution = () => {
    return distributions.reduce((sum, dist) => sum + dist.amount, 0);
  };

  const handleSaveWithDistribution = async () => {
    const totalDistribution = getTotalDistribution();
    const incomeAmount = parseFloat(formData.amount);

    if (totalDistribution !== incomeAmount) {
      addToast({
        type: 'error',
        title: 'Error en distribución',
        message: `La suma de la distribución ($${totalDistribution.toLocaleString()}) debe ser igual al monto del ingreso ($${incomeAmount.toLocaleString()})`
      });
      return;
    }

    setSaving(true);

    try {
      // Guardar el ingreso
      const incomeData = {
        client: formData.client.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: Timestamp.fromDate(new Date(formData.date)),
        paymentMethod: formData.paymentMethod,
        account: formData.account.trim(),
        bank: formData.bank.trim(),
        isClientPaidInFull: true,
        createdBy: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const incomeDoc = await addDoc(collection(db, 'incomes'), incomeData);

      // Guardar la distribución
      const distributionData = {
        incomeId: incomeDoc.id,
        client: formData.client.trim(),
        totalAmount: parseFloat(formData.amount),
        distributions: distributions.filter(dist => dist.amount > 0),
        createdBy: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date())
      };

      await addDoc(collection(db, 'income_distributions'), distributionData);

      addToast({
        type: 'success',
        title: 'Ingreso y distribución guardados',
        message: 'El ingreso ha sido registrado con su distribución por empresas'
      });

      setDialogOpen(false);
      setDistributionDialogOpen(false);
    } catch (error) {
      console.error('Error guardando ingreso con distribución:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Error al guardar: ' + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDistributionDialog = () => {
    setDistributionDialogOpen(false);
    // Si el usuario cancela, desmarcar el checkbox
    if (!selectedIncome) {
      setFormData(prev => ({
        ...prev,
        isClientPaidInFull: false
      }));
    }
  };

  // Eliminar ingreso
  const confirmDelete = async () => {
    if (!incomeToDelete) return;

    try {
      await deleteDoc(doc(db, 'incomes', incomeToDelete.id));
      addToast({
        type: 'success',
        title: 'Ingreso eliminado',
        message: 'El ingreso ha sido eliminado correctamente'
      });
      setDeleteDialogOpen(false);
      setIncomeToDelete(null);
    } catch (error) {
      console.error('Error eliminando ingreso:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Error al eliminar el ingreso: ' + error.message
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'transferencia': 'primary',
      'efectivo': 'success',
      'cheque': 'warning',
      'tarjeta': 'info',
      'otro': 'default'
    };
    return colors[method] || 'default';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'servicio': <BusinessIcon />,
      'consulta': <PersonIcon />,
      'producto': <AttachMoneyIcon />,
      'otro': <DescriptionIcon />
    };
    return icons[category] || <AttachMoneyIcon />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando ingresos...</Typography>
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            💰 Gestión de Ingresos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registra y gestiona todos los pagos recibidos de clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddIncome}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)'
            }
          }}
        >
          Registrar Ingreso
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Ingresos',
            value: stats.total,
            icon: <ReceiptIcon />,
            color: '#2196f3'
          },
          {
            title: 'Monto Total',
            value: formatCurrency(stats.totalAmount),
            icon: <AttachMoneyIcon />,
            color: '#4caf50'
          },
          {
            title: 'Este Mes',
            value: stats.monthlyTotal,
            icon: <CalendarIcon />,
            color: '#ff9800'
          },
          {
            title: 'Monto Mensual',
            value: formatCurrency(stats.monthlyAmount),
            icon: <TrendingUpIcon />,
            color: '#9c27b0'
          }
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Lista de ingresos */}
      {incomes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default
            }}
          >
            <AttachMoneyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              No hay ingresos registrados
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Comienza registrando tu primer ingreso de cliente
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddIncome}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
              }}
            >
              Registrar Primer Ingreso
            </Button>
          </Paper>
        </motion.div>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {incomes.map((income, index) => (
              <Grid item xs={12} md={6} lg={4} key={income.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <CardContent>
                      {/* Header con cliente y monto */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {getCategoryIcon(income.category)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {income.client}
                            </Typography>
                            {income.company && (
                              <Typography variant="caption" color="text.secondary">
                                {income.company}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {formatCurrency(income.amount)}
                        </Typography>
                      </Box>

                      {/* Descripción */}
                      {income.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {income.description}
                        </Typography>
                      )}

                      {/* Detalles */}
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(income.date, 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccountBalanceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Chip
                            label={income.paymentMethod}
                            size="small"
                            color={getPaymentMethodColor(income.paymentMethod)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Acciones */}
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleViewIncome(income)}
                            sx={{ color: 'primary.main' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditIncome(income)}
                            sx={{ color: 'warning.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteIncome(income)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Dialog para agregar/editar */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedIncome ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso'}
          <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.7 }}>
            DEBUG: Modal={distributionDialogOpen ? 'OPEN' : 'CLOSED'} | Companies={companies.length}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cliente *"
                value={formData.client}
                onChange={(e) => handleFormChange('client', e.target.value)}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto *"
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha *"
                type="date"
                value={formData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                  disabled={saving}
                  label="Método de Pago"
                >
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="consignacion">Consignación</MenuItem>
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cuenta"
                value={formData.account}
                onChange={(e) => handleFormChange('account', e.target.value)}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Banco"
                value={formData.bank}
                onChange={(e) => handleFormChange('bank', e.target.value)}
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.50', 
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}20`
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isClientPaidInFull}
                      onChange={(e) => handlePaidInFullChange(e.target.checked)}
                      disabled={saving}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ✅ Cliente queda al día con este pago
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Si marcas esta opción, se abrirá un formulario para distribuir el monto entre empresas
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveIncome}
            disabled={saving}
            variant="contained"
            startIcon={saving ? <RefreshIcon className="spinning" /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver detalles */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Ingreso
        </DialogTitle>
        <DialogContent dividers>
          {selectedIncome && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cliente
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedIncome.client}
                </Typography>
              </Grid>
              {selectedIncome.company && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Empresa
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.company}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monto
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(selectedIncome.amount)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Fecha
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {format(selectedIncome.date, 'dd MMM yyyy', { locale: es })}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Descripción
                </Typography>
                <Typography variant="body1">
                  {selectedIncome.description || 'Sin descripción'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Método de Pago
                </Typography>
                <Chip
                  label={selectedIncome.paymentMethod}
                  color={getPaymentMethodColor(selectedIncome.paymentMethod)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Categoría
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getCategoryIcon(selectedIncome.category)}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.category}
                  </Typography>
                </Box>
              </Grid>
              {selectedIncome.accountNumber && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Número de Cuenta
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.accountNumber}
                  </Typography>
                </Grid>
              )}
              {selectedIncome.reference && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Referencia
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedIncome.reference}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer.
          </Typography>
          {incomeToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Cliente:</strong> {incomeToDelete.client}<br />
                <strong>Monto:</strong> {formatCurrency(incomeToDelete.amount)}<br />
                <strong>Fecha:</strong> {format(incomeToDelete.date, 'dd MMM yyyy', { locale: es })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Distribución por Empresas */}
      <Dialog
        open={distributionDialogOpen}
        onClose={() => !saving && handleCloseDistributionDialog()}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <BusinessIcon />
          Distribución por Empresas - {formData.client}
        </DialogTitle>
        <DialogContent dividers sx={{ position: 'relative', minHeight: 400 }}>
          {/* Header fijo con total a distribuir */}
          <Box sx={{ 
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 10,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2,
            mb: 3
          }}>
            <Typography variant="h6" gutterBottom>
              Total a Distribuir: <Chip 
                label={`$${parseFloat(formData.amount || 0).toLocaleString()}`} 
                color="primary" 
                variant="outlined" 
                size="medium"
              />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Especifica cuánto corresponde a cada empresa. La suma debe ser igual al monto total.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {companies.map((company) => (
              <Grid item xs={12} md={6} key={company.id}>
                <Card sx={{ 
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { boxShadow: theme.shadows[4] }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {company.logoURL ? (
                      <Box
                        sx={{
                          width: 50,
                          height: 35,
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 0.5,
                          backgroundColor: 'background.paper'
                        }}
                      >
                        <Box
                          component="img"
                          src={company.logoURL}
                          alt={`Logo de ${company.name}`}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                    ) : (
                      <Avatar sx={{ 
                        bgcolor: 'primary.main', 
                        mr: 2, 
                        width: 40, 
                        height: 40,
                        fontSize: 16,
                        fontWeight: 'bold'
                      }}>
                        {company.name.charAt(0)}
                      </Avatar>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {company.name}
                    </Typography>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Monto para esta empresa"
                    type="number"
                    value={distributions.find(d => d.companyId === company.id)?.amount || ''}
                    onChange={(e) => handleDistributionChange(company.id, e.target.value)}
                    disabled={saving}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Resumen de la distribución */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Distribuido:</strong>
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Chip 
                  label={`$${getTotalDistribution().toLocaleString()}`} 
                  color={getTotalDistribution() === parseFloat(formData.amount || 0) ? "success" : "warning"}
                  variant="filled"
                />
              </Grid>
              <Grid item xs={3}>
                <Chip 
                  label={getTotalDistribution() === parseFloat(formData.amount || 0) ? "✅ Correcto" : "⚠️ Ajustar"}
                  color={getTotalDistribution() === parseFloat(formData.amount || 0) ? "success" : "warning"}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDistributionDialog}
            disabled={saving}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveWithDistribution}
            disabled={saving || getTotalDistribution() !== parseFloat(formData.amount || 0)}
            variant="contained"
            startIcon={saving ? <RefreshIcon className="animate-spin" /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Guardar con Distribución'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncomePage;
