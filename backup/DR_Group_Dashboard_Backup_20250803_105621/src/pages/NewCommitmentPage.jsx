import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  AccountBalance as BankIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

const NewCommitmentPage = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Obtener empresa preseleccionada desde la navegación
  const preselectedCompany = location.state?.preselectedCompany;

  // Formulario para nuevo compromiso
  const [formData, setFormData] = useState({
    companyId: preselectedCompany?.id || '',
    companyName: preselectedCompany?.name || '',
    month: new Date().getMonth() + 1, // Mes actual (1-12)
    year: new Date().getFullYear(), // Año actual
    dueDate: null, // Fecha de vencimiento específica
    periodicity: 'monthly', // unique, monthly, bimonthly, quarterly, fourmonthly, biannual, annual
    beneficiary: '',
    concept: '',
    amount: '',
    paymentMethod: 'transfer', // transfer, check, cash, debit, credit
    observations: '',
    deferredPayment: false,
    status: 'pending' // pending, paid, overdue
  });

  // Función para obtener colores dinámicos basados en el tema
  const getThemeColor = (colorName) => {
    return theme.palette.mode === 'dark' 
      ? theme.palette[colorName]?.dark || theme.palette[colorName]?.main 
      : theme.palette[colorName]?.main;
  };

  // Función para obtener gradiente dinámico
  const getGradientBackground = () => {
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;
    return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
  };

  // Cargar empresas desde Firebase
  useEffect(() => {
    if (!currentUser) return;

    setLoadingCompanies(true);

    const q = query(
      collection(db, 'companies'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
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
        setLoadingCompanies(false);
      },
      (error) => {
        console.error('Error fetching companies:', error);
        addNotification({
          type: 'error',
          title: 'Error al cargar empresas',
          message: 'No se pudieron cargar las empresas disponibles',
          icon: 'error',
          color: 'error'
        });
        setLoadingCompanies(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, addNotification]);

  // Mostrar notificación cuando se preselecciona una empresa
  useEffect(() => {
    if (preselectedCompany && companies.length > 0) {
      addNotification({
        type: 'info',
        title: 'Empresa preseleccionada',
        message: `Se ha preseleccionado "${preselectedCompany.name}" para el nuevo compromiso`,
        icon: 'info',
        color: 'info'
      });
    }
  }, [preselectedCompany, companies, addNotification]);

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si cambia la empresa, actualizar el nombre
    if (field === 'companyId') {
      const selectedCompany = companies.find(company => company.id === value);
      setFormData(prev => ({
        ...prev,
        companyName: selectedCompany?.name || ''
      }));
    }
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      companyId: '',
      companyName: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: null,
      periodicity: 'monthly',
      beneficiary: '',
      concept: '',
      amount: '',
      paymentMethod: 'transfer',
      observations: '',
      deferredPayment: false,
      status: 'pending'
    });
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.companyId) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'Debe seleccionar una empresa',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    if (!formData.beneficiary.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El beneficiario es obligatorio',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    if (!formData.concept.trim()) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El concepto es obligatorio',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      addNotification({
        type: 'error',
        title: 'Error de validación',
        message: 'El valor a cancelar debe ser mayor a cero',
        icon: 'error',
        color: 'error'
      });
      return false;
    }

    return true;
  };

  // Guardar compromiso
  const handleSaveCommitment = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const commitmentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      await addDoc(collection(db, 'commitments'), commitmentData);
      
      addNotification({
        type: 'success',
        title: 'Compromiso creado',
        message: `Se creó exitosamente el compromiso para "${formData.companyName}"`,
        icon: 'success',
        color: 'success'
      });

      // Navegar de vuelta a la lista de compromisos
      navigate('/commitments');
    } catch (error) {
      console.error('Error saving commitment:', error);
      addNotification({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudo crear el compromiso. Inténtalo de nuevo.',
        icon: 'error',
        color: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancelar y volver
  const handleCancel = () => {
    navigate('/commitments');
  };

  // Opciones para los selects
  const periodicityOptions = [
    { value: 'unique', label: 'Pago único' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'bimonthly', label: 'Bimestral' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'fourmonthly', label: 'Cuatrimestral' },
    { value: 'biannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' }
  ];

  const paymentMethods = [
    { value: 'transfer', label: 'Transferencia' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'pse', label: 'PSE' }
  ];

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const years = [];
  for (let i = new Date().getFullYear() - 2; i <= new Date().getFullYear() + 5; i++) {
    years.push({ value: i, label: i.toString() });
  }

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loadingCompanies) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando empresas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Banner Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            background: getGradientBackground(),
            borderRadius: 3,
            p: 4,
            mb: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              zIndex: 0,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AssignmentIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="700" sx={{ color: 'white', mb: 0.5 }}>
                  Nuevo Compromiso Financiero
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Registra un nuevo compromiso para gestión empresarial
                </Typography>
              </Box>
            </Box>
            
            {preselectedCompany && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Chip
                  label={`Empresa preseleccionada: ${preselectedCompany.name}`}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                  variant="outlined"
                  icon={<BusinessIcon />}
                />
              </motion.div>
            )}
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 12px 40px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 40px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                {/* Información de la Empresa */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: theme.palette.primary.main,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Box
                          sx={{
                            p: 1,
                            background: getGradientBackground(),
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                              : '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 20, color: 'white' }} />
                        </Box>
                        <Typography variant="h6" fontWeight="600" sx={{ color: theme.palette.text.primary }}>
                          Información de la Empresa
                        </Typography>
                      </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Empresa</InputLabel>
                          <Select
                            value={formData.companyId}
                            label="Empresa"
                            onChange={(e) => handleFormChange('companyId', e.target.value)}
                            disabled={saving}
                          >
                            {companies.map((company) => (
                              <MenuItem key={company.id} value={company.id}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {company.logoURL && (
                                    <img 
                                      src={company.logoURL} 
                                      alt={company.name}
                                      style={{ width: 24, height: 24, borderRadius: 4 }}
                                    />
                                  )}
                                  <Box>
                                    <Typography variant="body2" fontWeight="500">
                                      {company.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      NIT: {company.nit}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                  </motion.div>
                </Grid>

                {/* Detalles del Compromiso */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.03)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: theme.palette.primary.main,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <Box
                        sx={{
                          p: 1,
                          background: getGradientBackground(),
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <DescriptionIcon sx={{ fontSize: 20, color: 'white' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="600" sx={{ color: theme.palette.text.primary }}>
                        Detalles del Compromiso
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                      {/* Fila 1: Mes, Año, Periodicidad */}
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth required>
                          <InputLabel>Mes</InputLabel>
                          <Select
                            value={formData.month}
                            label="Mes"
                            onChange={(e) => handleFormChange('month', e.target.value)}
                            disabled={saving}
                          >
                            {months.map((month) => (
                              <MenuItem key={month.value} value={month.value}>
                                {month.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth required>
                          <InputLabel>Año</InputLabel>
                          <Select
                            value={formData.year}
                            label="Año"
                            onChange={(e) => handleFormChange('year', e.target.value)}
                            disabled={saving}
                          >
                            {years.map((year) => (
                              <MenuItem key={year.value} value={year.value}>
                                {year.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth required>
                          <InputLabel>Periodicidad</InputLabel>
                          <Select
                            value={formData.periodicity}
                            label="Periodicidad"
                            onChange={(e) => handleFormChange('periodicity', e.target.value)}
                            disabled={saving}
                          >
                            {periodicityOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Fila 2: Beneficiario, Concepto */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          required
                          label="Beneficiario"
                          value={formData.beneficiary}
                          onChange={(e) => handleFormChange('beneficiary', e.target.value)}
                          disabled={saving}
                          placeholder="Nombre de la entidad o persona a quien se le paga"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          required
                          label="Concepto"
                          value={formData.concept}
                          onChange={(e) => handleFormChange('concept', e.target.value)}
                          disabled={saving}
                          placeholder="Descripción del pago o servicio"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DescriptionIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      {/* Fila 3: Valor a cancelar, Método de pago */}
                      <Grid item xs={12} md={6}>
                        <motion.div
                          animate={formData.amount ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <TextField
                            fullWidth
                            required
                            label="Valor a cancelar"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => handleFormChange('amount', e.target.value)}
                            disabled={saving}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <motion.div
                                    animate={formData.amount ? { 
                                      color: [theme.palette.primary.main, theme.palette.success.main, theme.palette.primary.main],
                                      scale: [1, 1.1, 1]
                                    } : {}}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <MoneyIcon color="primary" />
                                  </motion.div>
                                  $
                                </InputAdornment>
                              ),
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused': {
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: theme.palette.success.main,
                                      borderWidth: 2,
                                    }
                                  }
                                }
                              }
                            }}
                            helperText={
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: formData.amount ? 1 : 0, y: formData.amount ? 0 : -10 }}
                                transition={{ duration: 0.3 }}
                              >
                                {formData.amount ? formatCurrency(formData.amount) : ''}
                              </motion.div>
                            }
                          />
                        </motion.div>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Método de pago</InputLabel>
                          <Select
                            value={formData.paymentMethod}
                            label="Método de pago"
                            onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                            disabled={saving}
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PaymentIcon color="primary" fontSize="small" />
                                  {method.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Fila 4: Fecha de vencimiento, Pago aplazado */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Fecha de vencimiento"
                          value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => handleFormChange('dueDate', e.target.value ? new Date(e.target.value) : null)}
                          disabled={saving}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                          helperText="Fecha específica de vencimiento del compromiso"
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.deferredPayment}
                              onChange={(e) => handleFormChange('deferredPayment', e.target.checked)}
                              disabled={saving}
                              color="primary"
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <ScheduleIcon color="primary" fontSize="small" />
                              <Typography variant="body1" fontWeight="500">
                                Pago aplazado
                              </Typography>
                            </Box>
                          }
                          sx={{ 
                            m: 0,
                            p: 2.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: '56px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.02)' 
                              : 'rgba(0, 0, 0, 0.01)',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'rgba(0, 0, 0, 0.03)',
                              transform: 'translateY(-1px)'
                            },
                            '& .MuiFormControlLabel-label': {
                              flex: 1,
                              marginLeft: 1.5
                            }
                          }}
                        />
                      </Grid>

                      {/* Fila 5: Observaciones */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Observaciones"
                          value={formData.observations}
                          onChange={(e) => handleFormChange('observations', e.target.value)}
                          disabled={saving}
                          multiline
                          rows={3}
                          placeholder="Información adicional, notas importantes, condiciones especiales..."
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                  </motion.div>
                </Grid>

                {/* Botones de Acción */}
                <Grid item xs={12}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />
                    <Box 
                      display="flex" 
                      gap={2} 
                      justifyContent="flex-end"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.02)' 
                          : 'rgba(0, 0, 0, 0.02)'
                      }}
                    >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={saving}
                        sx={{ 
                          borderRadius: 3,
                          px: 3,
                          py: 1.5,
                          borderWidth: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            borderWidth: 2,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 8px 20px rgba(255, 255, 255, 0.15)' 
                              : '0 8px 20px rgba(0, 0, 0, 0.2)',
                            '&::before': {
                              opacity: 1,
                            }
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${theme.palette.action.hover}, transparent)`,
                            transition: 'all 0.6s ease',
                            opacity: 0,
                          },
                          '&:hover::before': {
                            left: '100%',
                            opacity: 1,
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        Cancelar
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveCommitment}
                        disabled={saving || !formData.companyId || !formData.month || !formData.year || !formData.periodicity || !formData.beneficiary?.trim() || !formData.concept?.trim() || !formData.amount || !formData.paymentMethod}
                        sx={{ 
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          minWidth: 180,
                          background: getGradientBackground(),
                          fontWeight: 600,
                          textTransform: 'none',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 6px 20px rgba(0, 0, 0, 0.4)' 
                            : '0 6px 20px rgba(0, 0, 0, 0.25)',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 12px 30px rgba(0, 0, 0, 0.5)' 
                              : '0 12px 30px rgba(0, 0, 0, 0.35)',
                            '&::before': {
                              opacity: 1,
                            }
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            transition: 'all 0.6s ease',
                            opacity: 0,
                          },
                          '&:hover::before': {
                            left: '100%',
                            opacity: 1,
                          },
                          '&:disabled': {
                            opacity: 0.6,
                            transform: 'none'
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        {saving ? 'Guardando...' : 'Guardar Compromiso'}
                      </Button>
                    </motion.div>
                  </Box>
                  </motion.div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Información de ayuda */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          <motion.div
            animate={{ 
              boxShadow: [
                theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(33, 150, 243, 0.2)' 
                  : '0 4px 12px rgba(33, 150, 243, 0.1)',
                theme.palette.mode === 'dark' 
                  ? '0 8px 20px rgba(33, 150, 243, 0.3)' 
                  : '0 8px 20px rgba(33, 150, 243, 0.2)',
                theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(33, 150, 243, 0.2)' 
                  : '0 4px 12px rgba(33, 150, 243, 0.1)'
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <Alert 
              severity="info" 
              sx={{ 
                mt: 3, 
                borderRadius: 3,
                border: `1px solid ${theme.palette.info.main}`,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(33, 150, 243, 0.1)' 
                  : 'rgba(33, 150, 243, 0.05)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.1), transparent)',
                  animation: 'shimmer 3s infinite',
                },
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                },
                '& .MuiAlert-icon': {
                  alignItems: 'center',
                  fontSize: 28,
                  animation: 'pulse 2s infinite',
                },
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' }
                },
                '& .MuiAlert-message': {
                  fontSize: '0.95rem',
                  position: 'relative',
                  zIndex: 1
                },
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: theme.palette.info.dark,
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  style={{ display: 'inline-block' }}
                >
                  <Box component="span" sx={{ fontWeight: 700, color: theme.palette.info.main, fontSize: '1.2em' }}>
                    💡
                  </Box>
                </motion.span>
                <Box component="span" sx={{ fontWeight: 700, color: theme.palette.info.main, ml: 1 }}>
                  Tip:
                </Box>
                {' '}Los compromisos mensuales, trimestrales y anuales se renovarán automáticamente 
                según la frecuencia seleccionada. Los compromisos únicos no se renovarán.
              </Typography>
            </Alert>
          </motion.div>
        </motion.div>
      </Box>
    );
  };

export default NewCommitmentPage;
