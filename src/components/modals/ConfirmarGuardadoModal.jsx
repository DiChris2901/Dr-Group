import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxWidth: 480,
    width: '100%',
    margin: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
}));

const ConfirmarGuardadoModal = ({ 
  open, 
  onClose, 
  onConfirm,
  periodoDetectado,
  loading = false
}) => {
  return (
    <StyledDialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        pb: 1,
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'primary.main'
      }}>
        💾 Confirmar Guardado de Liquidación
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            Estás a punto de guardar la liquidación procesada en Firebase Storage y Firestore.
            Esta acción permitirá que puedas acceder a los datos desde cualquier dispositivo.
          </Typography>
          
          <Box sx={{ 
            p: 3, 
            bgcolor: 'primary.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.200',
            mb: 2,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              📅 Información del Período:
            </Typography>
            <Chip 
              label={periodoDetectado || 'Período no detectado automáticamente'}
              color={periodoDetectado && periodoDetectado !== 'No detectado' ? 'primary' : 'warning'}
              sx={{ 
                fontWeight: 500,
                fontSize: '0.875rem',
                height: 32
              }}
            />
            {(!periodoDetectado || periodoDetectado === 'No detectado') && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'warning.main' }}>
                ⚠️ El período será detectado a partir del contenido del archivo
              </Typography>
            )}
          </Box>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            💡 Una vez guardada, podrás encontrar esta liquidación en el historial y 
            exportar reportes específicos cuando lo necesites.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ 
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          <CloseIcon sx={{ mr: 1, fontSize: 20 }} />
          Cancelar
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1,
            px: 3
          }}
        >
          {loading ? 'Guardando...' : 'Confirmar Guardado'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ConfirmarGuardadoModal;
