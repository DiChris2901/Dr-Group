import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  TextField,
  Stack,
  Divider,
  alpha
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 2,
    maxWidth: 500,
    width: '100%',
    margin: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
}));

const ConfirmarGuardadoModal = ({ 
  open, 
  onClose, 
  onConfirm,
  periodoDetectado,
  loading = false
}) => {
  const theme = useTheme();
  const [editando, setEditando] = useState(false);
  const [periodoEditado, setPeriodoEditado] = useState('');

  useEffect(() => {
    if (periodoDetectado) {
      setPeriodoEditado(periodoDetectado);
    }
  }, [periodoDetectado]);

  // Función para formatear el período: "Mes AAAA" con primera letra mayúscula
  const formatearPeriodo = (texto) => {
    if (!texto) return '';
    
    // Eliminar espacios extra y normalizar
    const textoLimpio = texto.trim().replace(/\s+/g, ' ');
    
    // Separar por espacios
    const partes = textoLimpio.split(' ');
    
    if (partes.length === 0) return '';
    
    // Formatear primera parte (mes) con primera letra mayúscula
    const mes = partes[0].toLowerCase();
    const mesFormateado = mes.charAt(0).toUpperCase() + mes.slice(1);
    
    // Si hay año, agregarlo
    if (partes.length > 1) {
      const año = partes[1];
      return `${mesFormateado} ${año}`;
    }
    
    return mesFormateado;
  };

  const handleChangePeriodo = (e) => {
    const valor = e.target.value;
    // Formatear automáticamente mientras escribe
    const valorFormateado = formatearPeriodo(valor);
    setPeriodoEditado(valorFormateado);
  };

  const handleConfirmar = () => {
    // Asegurar formato antes de confirmar
    const periodoFinal = formatearPeriodo(periodoEditado);
    onConfirm(periodoFinal);
  };

  const handleCancelarEdicion = () => {
    setPeriodoEditado(periodoDetectado);
    setEditando(false);
  };

  const handleAplicarEdicion = () => {
    // Formatear al aplicar
    const periodoFinal = formatearPeriodo(periodoEditado);
    setPeriodoEditado(periodoFinal);
    setEditando(false);
  };

  return (
    <StyledDialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{
        pb: 2,
        pt: 2.5,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        position: 'relative',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <SaveIcon sx={{ color: 'primary.main', fontSize: 24 }} />
        <Box>
          <Typography variant="h6" sx={{ 
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1.3
          }}>
            Confirmar Guardado de Liquidación
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Revisa el período antes de guardar
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={loading} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
        <Box sx={{ 
          p: 2.5,
          mt: 2.5,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <CalendarMonthIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              fontSize: '0.875rem'
            }}>
              Período de Liquidación
            </Typography>
          </Stack>

          {!editando ? (
            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
              <Chip 
                label={periodoEditado || 'Período no detectado'}
                color="error"
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  height: 38,
                  px: 2,
                  borderRadius: 1
                }}
              />
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setEditando(true)}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                  }
                }}
              >
                Editar
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                value={periodoEditado}
                onChange={handleChangePeriodo}
                placeholder="Ej: Junio 2025"
                autoFocus
                helperText="Formato: Mes AAAA (Ej: Enero 2025)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    fontWeight: 500
                  }
                }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={handleCancelarEdicion}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 1,
                    color: 'text.secondary'
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CheckIcon />}
                  onClick={handleAplicarEdicion}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                >
                  Aplicar
                </Button>
              </Stack>
            </Stack>
          )}

          {(!periodoEditado || periodoEditado === 'No detectado') && !editando && (
            <Typography variant="caption" sx={{ 
              display: 'block', 
              mt: 1.5, 
              color: 'warning.main',
              fontSize: '0.75rem'
            }}>
              ⚠️ Recomendamos editar el período para mejor organización
            </Typography>
          )}
        </Box>
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading || editando}
          startIcon={<CloseIcon />}
          sx={{ 
            textTransform: 'none',
            fontWeight: 500,
            color: 'text.secondary',
            borderRadius: 1,
            '&:hover': {
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: 'error.main'
            }
          }}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleConfirmar}
          variant="contained"
          disabled={loading || editando || !periodoEditado}
          startIcon={loading ? null : <SaveIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1,
            px: 3,
            minWidth: 180
          }}
        >
          {loading ? 'Guardando...' : 'Confirmar Guardado'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ConfirmarGuardadoModal;
