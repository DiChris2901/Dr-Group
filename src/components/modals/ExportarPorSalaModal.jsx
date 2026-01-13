import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { exportarLiquidacionPythonFormat } from '../../utils/liquidacionExcelExportPythonFormat';

const ExportarPorSalaModal = ({ 
  open, 
  onClose, 
  reporteBySala, 
  consolidatedData, 
  empresa, 
  addLog, 
  addNotification 
}) => {
  const theme = useTheme();
  
  // Estados locales del modal
  const [salaSeleccionada, setSalaSeleccionada] = useState('');
  const [salaSearchTerm, setSalaSearchTerm] = useState('');
  const [exportandoSala, setExportandoSala] = useState(false);

  const confirmarExportarSala = async () => {
    if (!salaSeleccionada) return;
    try {
      if (!consolidatedData || !Array.isArray(consolidatedData)) {
        addNotification('No hay datos consolidados para filtrar la sala', 'warning');
        return;
      }
      setExportandoSala(true);
      addLog(`🏢 Exportando sala (estructura consolidado): ${salaSeleccionada}`, 'info');
      // Filtrar filas originales de la sala seleccionada
      const dataSala = consolidatedData.filter(r => (r.establecimiento || r.sala) === salaSeleccionada);
      if (!dataSala.length) {
        throw new Error('No se encontraron filas detalladas de la sala seleccionada');
      }
      // Reutilizamos el exportador consolidado para mantener EXACTA estructura y estilos
      await exportarLiquidacionPythonFormat(dataSala, empresa || 'GENERAL', { salaNombre: salaSeleccionada });
      addLog('✅ Exportación sala (formato consolidado) completa', 'success');
      addNotification('Sala exportada con estructura consolidada', 'success');
      onClose();
    } catch (e) {
      console.error(e);
      addLog(`❌ Error exportando sala: ${e.message}`, 'error');
      addNotification('Error exportando sala', 'error');
    } finally {
      setExportandoSala(false);
    }
  };

  const handleClose = () => {
    setSalaSeleccionada('');
    setSalaSearchTerm('');
    setExportandoSala(false);
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
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme => theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      {/* Header sobrio con gradiente controlado */}
      <Box sx={{ 
        background: theme => theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        p: 3,
        position: 'relative',
        zIndex: 1
      }}>
        <Typography variant="overline" sx={{
          fontWeight: 600, 
          fontSize: '0.8rem', 
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: 1.2,
          display: 'block',
          mb: 1
        }}>
          SELECTOR • EXPORTAR POR SALA
        </Typography>
        <Typography variant="h4" sx={{
          fontWeight: 700, 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '1.75rem'
        }}>
          📊 Establecimientos
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1rem',
          mt: 1
        }}>
          Empresa: {empresa || 'DR Group'}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {reporteBySala && (
          <Box>
            {/* Info header sobrio */}
            <Box sx={{ 
              background: theme => alpha(theme.palette.primary.main, 0.08),
              borderBottom: theme => `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
              p: 2.5, 
              display: 'flex', 
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderBottomColor: theme => alpha(theme.palette.primary.main, 0.8)
              }
            }}>
              <Box sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.9rem'
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: theme => theme.palette.primary.main 
                }} />
                <Typography component="span" variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  Establecimientos disponibles: {reporteBySala.map(r => r.establecimiento).filter((v, i, arr) => arr.indexOf(v) === i).length}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5,
                ml: 'auto'
              }}>
                <Button 
                  size="small" 
                  variant="contained" 
                  sx={{ 
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 1,
                    background: theme => theme.palette.success.main,
                    '&:hover': {
                      background: theme => theme.palette.success.dark
                    },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Seleccionar Todos
                </Button>
                <Button 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 1,
                    borderColor: theme => alpha(theme.palette.primary.main, 0.6),
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: theme => alpha(theme.palette.primary.main, 0.8),
                      background: theme => alpha(theme.palette.primary.main, 0.04)
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Deseleccionar Todos
                </Button>
              </Box>
            </Box>

            {/* Search sobrio */}
            <Box sx={{ p: 3, background: 'background.paper' }}>
              <Box sx={{ 
                fontWeight: 500,
                mb: 1.5,
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.9rem'
              }}>
                <Box sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: theme => theme.palette.secondary.main 
                }} />
                <Typography component="span" variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  Buscar establecimiento
                </Typography>
              </Box>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Escriba para filtrar establecimientos"
                  variant="outlined"
                  value={salaSearchTerm}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      background: theme => alpha(theme.palette.primary.main, 0.02),
                      border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      '&:hover': {
                        borderColor: theme => alpha(theme.palette.primary.main, 0.8)
                      },
                      '&.Mui-focused': {
                        borderColor: theme => theme.palette.primary.main
                      },
                      transition: 'all 0.2s ease'
                    },
                    '& input': {
                      fontSize: '0.9rem'
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSalaSearchTerm(val);
                    if (val.trim()) {
                      const firstMatch = reporteBySala?.find(r => r.establecimiento.toLowerCase().includes(val.toLowerCase()));
                      if (firstMatch) setSalaSeleccionada(firstMatch.establecimiento);
                    }
                  }}
                />
                {/* Autocomplete dropdown */}
                {salaSearchTerm && reporteBySala && !salaSeleccionada && (
                  <Box sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'background.paper',
                    border: theme => `1px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    maxHeight: 200,
                    overflowY: 'auto'
                  }}>
                    {reporteBySala
                      .map(r => r.establecimiento)
                      .filter((v, i, arr) => arr.indexOf(v) === i)
                      .filter(est => est.toLowerCase().includes(salaSearchTerm.toLowerCase()))
                      .sort()
                      .slice(0, 5)
                      .map(est => (
                        <Box
                          key={est}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&:hover': {
                              background: theme => alpha(theme.palette.primary.main, 0.04)
                            },
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                          onClick={() => {
                            setSalaSeleccionada(est);
                            setSalaSearchTerm(est);
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {est}
                          </Typography>
                        </Box>
                      ))
                    }
                  </Box>
                )}
              </Box>
              <Button 
                size="small" 
                sx={{ 
                  mt: 1.5, 
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  borderRadius: 1,
                  background: theme => alpha(theme.palette.secondary.main, 0.08),
                  color: 'text.secondary',
                  border: theme => `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
                  '&:hover': { 
                    background: theme => alpha(theme.palette.secondary.main, 0.12),
                    borderColor: theme => alpha(theme.palette.secondary.main, 0.8)
                  },
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setSalaSearchTerm('');
                  setSalaSeleccionada('');
                }}
              >
                Limpiar
              </Button>
            </Box>

            {/* Establishments list sobrio */}
            <Box sx={{ 
              maxHeight: 300, 
              overflowY: 'auto', 
              background: 'background.paper',
              px: 3,
              pb: 2
            }}>
              {reporteBySala
                .map(r => r.establecimiento)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .filter(est => !salaSearchTerm || est.toLowerCase().includes(salaSearchTerm.toLowerCase()))
                .sort()
                .map(est => {
                  // Calculate metrics for this establishment
                  const estData = reporteBySala.filter(r => r.establecimiento === est);
                  const maquinas = estData.length;
                  const produccionTotal = Math.round(estData.reduce((sum, r) => sum + (Number(r.produccion) || 0), 0));
                  const promedioPorMaquina = maquinas > 0 ? Math.round(produccionTotal / maquinas) : 0;
                  const derechos = Math.round(produccionTotal * 0.12);
                  const gastos = Math.round(derechos * 0.01);
                  const totalImpuestos = Math.round(derechos + gastos);

                  return (
                    <Box 
                      key={est} 
                      sx={{ 
                        border: theme => salaSeleccionada === est 
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
                          : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: 2,
                        mb: 1.5,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: theme => salaSeleccionada === est 
                          ? alpha(theme.palette.primary.main, 0.04)
                          : 'background.paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        '&:hover': {
                          borderColor: theme => alpha(theme.palette.primary.main, 0.6),
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          background: theme => alpha(theme.palette.primary.main, 0.04)
                        },
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSalaSeleccionada(est)}
                    >
                      {/* Header sobrio */}
                      <Box sx={{ 
                        background: theme => salaSeleccionada === est 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.08),
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.12)}`
                      }}>
                        <Radio 
                          checked={salaSeleccionada === est} 
                          onChange={() => setSalaSeleccionada(est)}
                          size="small"
                          sx={{ 
                            color: theme => alpha(theme.palette.primary.main, 0.6),
                            '&.Mui-checked': { 
                              color: theme => theme.palette.primary.main 
                            }
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          fontSize: '1rem',
                          color: 'text.primary'
                        }}>
                          {est}
                        </Typography>
                      </Box>

                      {/* Metrics sobrios */}
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 3, mb: 1.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ 
                            color: theme => theme.palette.success.main, 
                            fontWeight: 500,
                            fontSize: '1rem'
                          }}>
                            {maquinas} máquinas
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme => theme.palette.success.main, 
                            fontWeight: 500,
                            fontSize: '1rem'
                          }}>
                            ${produccionTotal.toLocaleString()} producción
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: theme => theme.palette.success.main, 
                            fontWeight: 500,
                            fontSize: '1rem'
                          }}>
                            ${promedioPorMaquina.toLocaleString()} promedio/máquina
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.9rem'
                          }}>
                            ${derechos.toLocaleString()} derechos
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.9rem'
                          }}>
                            ${gastos.toLocaleString()} gastos
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.9rem'
                          }}>
                            ${totalImpuestos.toLocaleString()} total impuestos
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
            </Box>

            {/* Selected info sobrio */}
            <Box sx={{ 
              background: theme => alpha(theme.palette.secondary.main, 0.08),
              borderTop: theme => `1px solid ${alpha(theme.palette.secondary.main, 0.6)}`,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderTopColor: theme => alpha(theme.palette.secondary.main, 0.8)
              }
            }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: theme => theme.palette.secondary.main 
              }} />
              <Typography variant="body2" sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                fontSize: '0.9rem'
              }}>
                Seleccionados: {salaSeleccionada ? 1 : 0} de {reporteBySala.map(r => r.establecimiento).filter((v, i, arr) => arr.indexOf(v) === i).length}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        background: 'background.paper',
        borderTop: theme => `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        gap: 1.5
      }}>
        <Button 
          onClick={handleClose} 
          disabled={exportandoSala}
          sx={{ 
            borderRadius: 1,
            fontWeight: 500,
            color: 'text.secondary',
            border: theme => `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            '&:hover': { 
              background: theme => alpha(theme.palette.secondary.main, 0.04),
              borderColor: theme => alpha(theme.palette.secondary.main, 0.3)
            },
            transition: 'all 0.2s ease'
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={confirmarExportarSala} 
          disabled={!salaSeleccionada || exportandoSala} 
          variant="contained"
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            px: 3,
            background: theme => theme.palette.primary.main,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            '&:hover': {
              background: theme => theme.palette.primary.dark,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            },
            '&:disabled': {
              background: theme => alpha(theme.palette.primary.main, 0.3)
            },
            transition: 'all 0.2s ease'
          }}
        >
          {exportandoSala ? 'Exportando...' : 'Exportar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportarPorSalaModal;
