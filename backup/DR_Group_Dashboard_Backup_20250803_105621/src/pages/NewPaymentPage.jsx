import React, { useState } from 'react';
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
  Avatar,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Business as CompanyIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';

const NewPaymentPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    company: '',
    amount: '',
    method: '',
    concept: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    'Transferencia Bancaria',
    'Cheque',
    'Efectivo',
    'Tarjeta de Crédito',
    'Tarjeta de Débito'
  ];

  const companies = [
    'ABC Construcciones',
    'XYZ Logística',
    'DEF Tecnología',
    'GHI Servicios',
    'JKL Consultores'
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

    if (!formData.company) newErrors.company = 'La empresa es requerida';
    if (!formData.amount) newErrors.amount = 'El monto es requerido';
    if (formData.amount && parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }
    if (!formData.method) newErrors.method = 'El método de pago es requerido';
    if (!formData.concept) newErrors.concept = 'El concepto es requerido';
    if (!formData.date) newErrors.date = 'La fecha es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular envío de datos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Datos del pago:', formData);
      
      // Agregar notificación de éxito
      addNotification({
        type: 'payment',
        title: '💰 Pago Registrado',
        message: `Pago de $${formData.amount} registrado para ${formData.company}`,
        icon: '💳'
      });
      
      // Redirigir a la página de pagos
      navigate('/payments');
    } catch (error) {
      console.error('Error al registrar el pago:', error);
      
      // Agregar notificación de error
      addNotification({
        type: 'error',
        title: '❌ Error al Registrar Pago',
        message: 'Hubo un problema al registrar el pago. Intenta nuevamente.',
        icon: '⚠️'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/payments');
  };

  const steps = ['Información Básica', 'Detalles del Pago', 'Confirmación'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Registrar Nuevo Pago
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete la información del pago a registrar
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={0} alternativeLabel>
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
                  <CompanyIcon color="primary" />
                  Información del Pago
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.company}>
                      <InputLabel>Empresa</InputLabel>
                      <Select
                        value={formData.company}
                        onChange={handleInputChange('company')}
                        label="Empresa"
                      >
                        {companies.map((company) => (
                          <MenuItem key={company} value={company}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                                {company.charAt(0)}
                              </Avatar>
                              {company}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.company && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.company}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monto"
                      type="number"
                      value={formData.amount}
                      onChange={handleInputChange('amount')}
                      error={!!errors.amount}
                      helperText={errors.amount}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
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
                      {errors.method && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {errors.method}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fecha"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange('date')}
                      error={!!errors.date}
                      helperText={errors.date}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Concepto"
                      value={formData.concept}
                      onChange={handleInputChange('concept')}
                      error={!!errors.concept}
                      helperText={errors.concept}
                      placeholder="Ej: Cuota mensual, Servicios profesionales, etc."
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Referencia"
                      value={formData.reference}
                      onChange={handleInputChange('reference')}
                      placeholder="Número de referencia o comprobante"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notas adicionales"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={handleInputChange('notes')}
                      placeholder="Información adicional sobre el pago..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  Resumen del Pago
                </Typography>
                
                <Box sx={{ space: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Empresa:
                    </Typography>
                    <Typography variant="body2">
                      {formData.company || '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Monto:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formData.amount ? `$${parseFloat(formData.amount).toLocaleString()}` : '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Método:
                    </Typography>
                    <Typography variant="body2">
                      {formData.method || '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha:
                    </Typography>
                    <Typography variant="body2">
                      {formData.date ? new Date(formData.date).toLocaleDateString() : '-'}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Alert severity="info" sx={{ mb: 2 }}>
                    El pago será registrado como "Pendiente" hasta su confirmación.
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={<SaveIcon />}
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Pago'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default NewPaymentPage;
