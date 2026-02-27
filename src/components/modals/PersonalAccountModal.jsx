import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const PersonalAccountModal = ({ open, onClose, onSave, editingAccount = null }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    holderName: editingAccount?.holderName || '',
    bankName: editingAccount?.bankName || '',
    accountNumber: editingAccount?.accountNumber || '',
    accountType: editingAccount?.accountType || 'ahorros',
    description: editingAccount?.description || '',
  });
  const [errors, setErrors] = useState({});

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.holderName.trim()) {
      newErrors.holderName = 'El nombre del titular es requerido';
    }
    
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'El nombre del banco es requerido';
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'El número de cuenta es requerido';
    } else if (formData.accountNumber.length < 8) {
      newErrors.accountNumber = 'El número de cuenta debe tener al menos 8 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío
  const handleSubmit = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        type: 'personal',
        id: editingAccount?.id || `personal_${Date.now()}`,
        createdAt: editingAccount?.createdAt || new Date()
      });
      handleClose();
    }
  };

  // Limpiar y cerrar
  const handleClose = () => {
    setFormData({
      holderName: '',
      bankName: '',
      accountNumber: '',
      accountType: 'ahorros',
      description: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[24],
        }
      }}
    >
      <DialogTitle sx={{
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        position: 'relative',
        background: `linear-gradient(135deg, ${theme.palette.secondary.main}15 0%, ${theme.palette.primary.main}15 100%)`
      }}>
        <PersonIcon sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={600}>
          {editingAccount ? 'Editar Cuenta Personal' : 'Agregar Cuenta Personal'}
        </Typography>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Las cuentas personales te permiten registrar ingresos de clientes que consignan en tus cuentas privadas.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Nombre del titular */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Titular"
              value={formData.holderName}
              onChange={(e) => setFormData({...formData, holderName: e.target.value})}
              error={!!errors.holderName}
              helperText={errors.holderName}
              placeholder="Tu nombre completo"
            />
          </Grid>

          {/* Banco y Tipo de Cuenta */}
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Banco"
              value={formData.bankName}
              onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              error={!!errors.bankName}
              helperText={errors.bankName}
              placeholder="Ej: Bancolombia, Davivienda, BBVA"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.accountType}
                onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                label="Tipo"
              >
                <MenuItem value="ahorros">Ahorros</MenuItem>
                <MenuItem value="corriente">Corriente</MenuItem>
                <MenuItem value="nequi">Nequi</MenuItem>
                <MenuItem value="daviplata">Daviplata</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Número de Cuenta */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Número de Cuenta"
              value={formData.accountNumber}
              onChange={(e) => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g, '')})}
              error={!!errors.accountNumber}
              helperText={errors.accountNumber || 'Solo números, sin espacios ni guiones'}
              placeholder="1234567890"
              inputProps={{ maxLength: 20 }}
            />
          </Grid>

          {/* Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción (Opcional)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              multiline
              rows={2}
              placeholder="Ej: Cuenta personal para recibir pagos de clientes..."
            />
          </Grid>
        </Grid>

        {/* Vista previa */}
        {formData.holderName && formData.bankName && formData.accountNumber && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Vista previa:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountBalanceIcon sx={{ color: 'secondary.main' }} />
              <Box>
                <Typography variant="body1" fontWeight="600">
                  {formData.holderName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.bankName} • {formData.accountNumber} 
                  <Chip 
                    label={formData.accountType.toUpperCase()} 
                    size="small" 
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.holderName || !formData.bankName || !formData.accountNumber}
        >
          {editingAccount ? 'Actualizar' : 'Agregar'} Cuenta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonalAccountModal;
