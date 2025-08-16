import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Business as CompanyIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  TrendingUp as InterestIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NewPaymentPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  // Estado para compromisos pendientes
  const [pendingCommitments, setPendingCommitments] = useState([]);
  const [loadingCommitments, setLoadingCommitments] = useState(true);
  const [selectedCommitment, setSelectedCommitment] = useState(null);
  
  const [formData, setFormData] = useState({
    commitmentId: '',
    method: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    // Campos calculados automáticamente
    originalAmount: 0,
    interests: 0,
    // Campos específicos para Coljuegos
    interesesDerechosExplotacion: 0,
    interesesGastosAdministracion: 0,
    finalAmount: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar compromisos pendientes de pago
  useEffect(() => {
    loadPendingCommitments();
  }, []);

  // Limpiar intereses cuando la fecha ya no los requiere
  useEffect(() => {
    if (selectedCommitment && formData.date) {
      const needsInterests = requiresInterests(selectedCommitment, formData.date);
      
      if (!needsInterests) {
        // Limpiar todos los tipos de intereses si no se requieren
        setFormData(prev => ({
          ...prev,
          interests: 0,
          interesesDerechosExplotacion: 0,
          interesesGastosAdministracion: 0,
          finalAmount: prev.originalAmount
        }));
      }
    }
  }, [formData.date, selectedCommitment]);

  const loadPendingCommitments = async () => {
    try {
      setLoadingCommitments(true);
      
      // Consultar todos los compromisos y filtrar en cliente por ahora
      // Para evitar el error de índice compuesto de Firebase
      const commitmentsQuery = query(
        collection(db, 'commitments')
      );
      
      const snapshot = await getDocs(commitmentsQuery);
      const commitments = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filtrar solo compromisos pendientes o vencidos
        const status = data.status || 'pending';
        if (status === 'pending' || status === 'overdue') {
          commitments.push({
            id: doc.id,
            ...data,
            // Formatear datos para el display
            displayName: `${data.companyName} - ${data.concept}`,
            formattedDueDate: data.dueDate ? format(data.dueDate.toDate(), 'dd/MMM/yyyy', { locale: es }) : 'Sin fecha',
            formattedAmount: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0
            }).format(data.amount || 0)
          });
        }
      });
      
      // Ordenar por fecha de vencimiento
      commitments.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.toDate() - b.dueDate.toDate();
      });
      
      setPendingCommitments(commitments);
    } catch (error) {
      console.error('Error loading pending commitments:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los compromisos pendientes',
        icon: 'error'
      });
    } finally {
      setLoadingCommitments(false);
    }
  };

  // Verificar si la fecha de pago requiere intereses (posterior al vencimiento)
  const requiresInterests = (commitment, paymentDate) => {
    if (!commitment?.dueDate || !paymentDate) return false;
    
    const dueDate = commitment.dueDate.toDate();
    const payment = new Date(paymentDate);
    
    // Resetear horas para comparar solo fechas
    dueDate.setHours(0, 0, 0, 0);
    payment.setHours(0, 0, 0, 0);
    
    console.log('Checking interests requirement:', {
      dueDate: dueDate.toDateString(),
      paymentDate: payment.toDateString(),
      isLater: payment > dueDate
    });
    
    return payment > dueDate;
  };

  // Detectar si es un compromiso de Coljuegos
  const isColjuegosCommitment = (commitment) => {
    if (!commitment) return false;
    const companyName = commitment.companyName?.toLowerCase() || '';
    const concept = commitment.concept?.toLowerCase() || '';
    
    console.log('Checking Coljuegos for:', { companyName, concept });
    
    // Buscar por nombre de empresa o concepto relacionado a Coljuegos
    const isColjuegos = companyName.includes('coljuegos') || 
           companyName.includes('col juegos') ||
           concept.includes('derechos de explotación') ||
           concept.includes('derechos de explotacion') ||
           concept.includes('gastos de administración') ||
           concept.includes('gastos de administracion');
           
    console.log('Is Coljuegos:', isColjuegos);
    return isColjuegos;
  };

  // Calcular si hay intereses basado en la fecha de pago vs fecha de vencimiento
  const calculateInterestsForPaymentDate = (dueDate, amount, paymentDate) => {
    if (!dueDate || !amount || !paymentDate) return 0;
    
    const due = dueDate.toDate();
    const payment = new Date(paymentDate);
    const diffTime = payment - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Si no está vencido en la fecha de pago, no hay intereses
    if (diffDays <= 0) return 0;
    
    // Calcular interés: 1% mensual (0.033% diario) por días de retraso
    const dailyRate = 0.01 / 30; // 1% mensual dividido en 30 días
    const interestAmount = amount * dailyRate * diffDays;
    
    return Math.round(interestAmount);
  };

  // Manejar selección de compromiso
  const handleCommitmentSelect = (commitment) => {
    if (!commitment) {
      setSelectedCommitment(null);
      setFormData(prev => ({
        ...prev,
        commitmentId: '',
        originalAmount: 0,
        interests: 0,
        interesesDerechosExplotacion: 0,
        interesesGastosAdministracion: 0,
        finalAmount: 0
      }));
      return;
    }

    setSelectedCommitment(commitment);
    
    // No calcular intereses automáticamente, dejar en 0
    const finalAmount = commitment.amount || 0;

    setFormData(prev => ({
      ...prev,
      commitmentId: commitment.id,
      originalAmount: commitment.amount || 0,
      interests: 0,
      interesesDerechosExplotacion: 0,
      interesesGastosAdministracion: 0,
      finalAmount: finalAmount
    }));
  };

  const paymentMethods = [
    'Transferencia',
    'PSE',
    'Efectivo'
  ];

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.commitmentId) newErrors.commitmentId = 'Debe seleccionar un compromiso';
    if (!formData.method) newErrors.method = 'El método de pago es requerido';
    if (!formData.reference) newErrors.reference = 'La referencia es requerida';
    if (!formData.date) newErrors.date = 'La fecha es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: 'Formulario incompleto',
        message: 'Por favor complete todos los campos requeridos',
        icon: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Aquí iría la lógica para guardar el pago
      console.log('Saving payment:', formData);
      
      addNotification({
        type: 'success',
        title: 'Pago registrado',
        message: 'El pago ha sido registrado exitosamente',
        icon: 'success'
      });
      
      navigate('/payments');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Hubo un error al registrar el pago',
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  const steps = ['Seleccionar Compromiso', 'Información del Pago', 'Confirmación'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          💳 Registrar Pago de Compromiso
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seleccione un compromiso pendiente y registre su pago
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={selectedCommitment ? 1 : 0} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Información Principal */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  Seleccionar Compromiso Pendiente
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Selector de Compromiso Pendiente */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={pendingCommitments}
                      getOptionLabel={(option) => option.displayName || ''}
                      loading={loadingCommitments}
                      value={selectedCommitment}
                      onChange={(event, newValue) => handleCommitmentSelect(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Compromiso a Pagar"
                          placeholder="Seleccione un compromiso pendiente..."
                          fullWidth
                          required
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CompanyIcon color="primary" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <>
                                {loadingCommitments ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <li key={key} {...otherProps}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {option.companyName}
                                </Typography>
                                <Chip 
                                  label={option.formattedAmount} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {option.concept}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" color="warning.main">
                                  Vencimiento: {option.formattedDueDate}
                                </Typography>
                              </Box>
                            </Box>
                          </li>
                        );
                      }}
                      noOptionsText={loadingCommitments ? "Cargando..." : "No hay compromisos pendientes"}
                    />
                  </Grid>

                  {/* Información del Compromiso Seleccionado */}
                  {selectedCommitment && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          📋 Detalles del Compromiso Seleccionado
                          {/* Indicador temporal para depuración */}
                          {isColjuegosCommitment(selectedCommitment) && (
                            <Chip 
                              label="COLJUEGOS DETECTED" 
                              color="secondary" 
                              size="small" 
                              sx={{ ml: 2 }}
                            />
                          )}
                        </Typography>
                        
                        {/* Información del compromiso */}
                        <Box sx={{ mb: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Concepto:</strong> {selectedCommitment.concept}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="warning.main">
                                <strong>Fecha de Vencimiento:</strong> {selectedCommitment.formattedDueDate}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Valor Original"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.originalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon color="success" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: 600,
                              color: 'success.main'
                            }
                          }}
                        />
                      </Grid>

                      {/* Campos de Intereses - Solo cuando la fecha de pago es posterior al vencimiento */}
                      {requiresInterests(selectedCommitment, formData.date) ? (
                        <>
                          {(() => {
                            const isColj = isColjuegosCommitment(selectedCommitment);
                            console.log('Rendering interest fields - Is Coljuegos:', isColj);
                            return isColj;
                          })() ? (
                            <>
                              {/* Intereses específicos para Coljuegos */}
                              <Grid item xs={12}>
                                <Typography variant="body2" color="info.main" sx={{ mb: 1, fontStyle: 'italic' }}>
                                  ⚠️ Pago posterior al vencimiento - Se requieren intereses específicos de Coljuegos
                                </Typography>
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Intereses Derechos de Explotación"
                                  value={formData.interesesDerechosExplotacion}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesDerechosExplotacion: value,
                                      finalAmount: prev.originalAmount + value + prev.interesesGastosAdministracion
                                    }));
                                  }}
                                  fullWidth
                                  type="number"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="warning" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 600,
                                      color: formData.interesesDerechosExplotacion > 0 ? 'warning.main' : 'text.secondary'
                                    }
                                  }}
                                  helperText="Intereses específicos para derechos de explotación"
                                />
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Intereses Gastos de Administración"
                                  value={formData.interesesGastosAdministracion}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      interesesGastosAdministracion: value,
                                      finalAmount: prev.originalAmount + prev.interesesDerechosExplotacion + value
                                    }));
                                  }}
                                  fullWidth
                                  type="number"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="error" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 600,
                                      color: formData.interesesGastosAdministracion > 0 ? 'error.main' : 'text.secondary'
                                    }
                                  }}
                                  helperText="Intereses específicos para gastos de administración"
                                />
                              </Grid>

                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Total Intereses Coljuegos"
                                  value={new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0
                                  }).format(formData.interesesDerechosExplotacion + formData.interesesGastosAdministracion)}
                                  fullWidth
                                  disabled
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="secondary" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 700,
                                      color: 'secondary.main'
                                    }
                                  }}
                                  helperText="Suma de ambos tipos de intereses"
                                />
                              </Grid>
                            </>
                          ) : (
                            <>
                              {/* Intereses regulares para otros compromisos */}
                              <Grid item xs={12}>
                                <Typography variant="body2" color="warning.main" sx={{ mb: 1, fontStyle: 'italic' }}>
                                  ⚠️ Pago posterior al vencimiento - Se pueden aplicar intereses por mora
                                </Typography>
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                <TextField
                                  label="Intereses por Mora"
                                  value={formData.interests}
                                  onChange={(e) => {
                                    const interestValue = parseFloat(e.target.value) || 0;
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: interestValue,
                                      finalAmount: prev.originalAmount + interestValue
                                    }));
                                  }}
                                  fullWidth
                                  type="number"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <InterestIcon color="warning" />
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    '& .MuiInputBase-input': {
                                      fontWeight: 600,
                                      color: formData.interests > 0 ? 'warning.main' : 'text.secondary'
                                    }
                                  }}
                                  helperText="Ingrese el monto de intereses por mora"
                                />
                              </Grid>

                              <Grid item xs={12} sm={6}>
                                {/* Espacio vacío para mantener layout */}
                              </Grid>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Mensaje cuando no se requieren intereses */}
                          <Grid item xs={12}>
                            <Alert severity="success" sx={{ mt: 1 }}>
                              ✅ Pago a tiempo - No se requieren intereses adicionales
                            </Alert>
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Total a Pagar"
                          value={new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0
                          }).format(formData.finalAmount)}
                          fullWidth
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MoneyIcon color="error" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontWeight: 700,
                              color: 'error.main',
                              fontSize: '1.1rem'
                            },
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: theme.palette.error.main + '10',
                              '& fieldset': {
                                borderColor: theme.palette.error.main,
                                borderWidth: 2
                              }
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom color="primary">
                          💳 Información del Pago
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!errors.method}>
                          <InputLabel>Método de Pago</InputLabel>
                          <Select
                            value={formData.method}
                            onChange={handleInputChange('method')}
                            label="Método de Pago"
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method} value={method}>
                                {method}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Referencia/ID del Pago"
                          value={formData.reference}
                          onChange={handleInputChange('reference')}
                          fullWidth
                          error={!!errors.reference}
                          helperText={errors.reference}
                          placeholder="Ej: TRF-2025-001, CHE-12345"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Fecha del Pago"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange('date')}
                          fullWidth
                          error={!!errors.date}
                          helperText={errors.date}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Observaciones"
                          value={formData.notes}
                          onChange={handleInputChange('notes')}
                          fullWidth
                          multiline
                          rows={1}
                          placeholder="Notas adicionales sobre el pago..."
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Panel de Resumen */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="secondary" />
                  Resumen del Pago
                </Typography>
                
                {selectedCommitment ? (
                  <Box>
                    <Box sx={{ mb: 2, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {selectedCommitment.companyName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCommitment.concept}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Valor Original:</Typography>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(formData.originalAmount)}
                      </Typography>
                    </Box>
                    
                    {isColjuegosCommitment(selectedCommitment) ? (
                      <>
                        {/* Mostrar intereses de Coljuegos separados */}
                        {formData.interesesDerechosExplotacion > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Int. Derechos Explotación:</Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              +{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(formData.interesesDerechosExplotacion)}
                            </Typography>
                          </Box>
                        )}
                        
                        {formData.interesesGastosAdministracion > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Int. Gastos Administración:</Typography>
                            <Typography variant="body2" color="error.main" fontWeight={600}>
                              +{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(formData.interesesGastosAdministracion)}
                            </Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Mostrar intereses regulares */}
                        {formData.interests > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Intereses:</Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              +{new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                              }).format(formData.interests)}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Total a Pagar:</Typography>
                      <Typography variant="h6" color="error.main">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(formData.finalAmount)}
                      </Typography>
                    </Box>
                    
                    {formData.method && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Método: <strong>{formData.method}</strong>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Seleccione un compromiso para ver el resumen del pago
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botones de Acción */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            <CancelIcon sx={{ mr: 1 }} />
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !selectedCommitment}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <SaveIcon sx={{ mr: 1 }} />
                Registrar Pago
              </>
            )}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default NewPaymentPage;
