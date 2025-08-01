import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Edit,
  Business,
  AccountBalance
} from '@mui/icons-material';
import { format } from 'date-fns';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const CommitmentEditForm = ({ 
  open, 
  onClose, 
  commitment, 
  onSaved 
}) => {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    concept: '',
    companyId: '',
    amount: '',
    dueDate: null,
    beneficiary: '',
    observations: '',
    paymentMethod: 'transfer'
  });

  // Cargar empresas
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'companies'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData = [];
      snapshot.forEach((doc) => {
        companiesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setCompanies(companiesData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Llenar formulario cuando se abre
  useEffect(() => {
    if (commitment && open) {
      setFormData({
        concept: commitment.concept || commitment.description || '',
        companyId: commitment.companyId || '',
        amount: commitment.amount || '',
        dueDate: commitment.dueDate,
        beneficiary: commitment.beneficiary || '',
        observations: commitment.observations || '',
        paymentMethod: commitment.paymentMethod || 'transfer'
      });
    }
  }, [commitment, open]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!commitment || !formData.concept.trim() || !formData.amount) {
      return;
    }

    setSaving(true);
    try {
      const commitmentRef = doc(db, 'commitments', commitment.id);
      await updateDoc(commitmentRef, {
        concept: formData.concept.trim(),
        companyId: formData.companyId,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        beneficiary: formData.beneficiary.trim(),
        observations: formData.observations.trim(),
        paymentMethod: formData.paymentMethod,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error updating commitment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      concept: '',
      companyId: '',
      amount: '',
      dueDate: null,
      beneficiary: '',
      observations: '',
      paymentMethod: 'transfer'
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      {/* Header compacto */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white'
            }}
          >
            <Edit sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Editar Compromiso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Modifica los detalles del compromiso
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Concepto/Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Concepto o Descripción"
              value={formData.concept}
              onChange={(e) => handleFormChange('concept', e.target.value)}
              variant="outlined"
              required
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>

          {/* Empresa y Monto */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Empresa</InputLabel>
              <Select
                value={formData.companyId}
                onChange={(e) => handleFormChange('companyId', e.target.value)}
                label="Empresa"
                required
                sx={{ borderRadius: '8px' }}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    <Box display="flex" alignItems="center">
                      <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {company.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              variant="outlined"
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <Typography
                    variant="body2"
                    sx={{ mr: 1, color: 'text.secondary', fontWeight: 'bold' }}
                  >
                    $
                  </Typography>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>

          {/* Fecha de Vencimiento */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha de Vencimiento"
              type="date"
              value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => handleFormChange('dueDate', new Date(e.target.value))}
              variant="outlined"
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>

          {/* Método de Pago */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                label="Método de Pago"
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value="transfer">
                  <Box display="flex" alignItems="center">
                    <AccountBalance sx={{ mr: 1, fontSize: 16 }} />
                    Transferencia
                  </Box>
                </MenuItem>
                <MenuItem value="cash">Efectivo</MenuItem>
                <MenuItem value="check">Cheque</MenuItem>
                <MenuItem value="card">Tarjeta</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Beneficiario */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Beneficiario"
              value={formData.beneficiary}
              onChange={(e) => handleFormChange('beneficiary', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observations}
              onChange={(e) => handleFormChange('observations', e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer compacto */}
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            px: 3,
            py: 1,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !formData.concept.trim() || !formData.amount}
          sx={{
            px: 3,
            py: 1,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 'medium',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
            }
          }}
        >
          {saving ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommitmentEditForm;
