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
  IconButton,
  alpha
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { exportarReporteDiarioSala } from '../../utils/liquidacionExcelExportDiarioSala';

const ReporteDiarioModal = ({ 
  open, 
  onClose, 
  consolidatedData,
  originalData,
  empresa, 
  addLog, 
  addNotification 
}) => {
  const theme = useTheme();
  
  // Estados locales del modal
  const [salaDailySeleccionada, setSalaDailySeleccionada] = useState('');
  const [dailySearchTerm, setDailySearchTerm] = useState('');
  const [exportandoDaily, setExportandoDaily] = useState(false);

  const confirmarExportarDaily = async () => {
    if (!salaDailySeleccionada) return;
    await exportarReporteDiario(salaDailySeleccionada);
  };

  const exportarReporteDiario = async (establecimientoForzado) => {
    if (!consolidatedData || !consolidatedData.length) {
      addNotification('No hay datos para exportar reporte diario', 'warning');
      return;
    }

    // Si el usuario seleccionó solo un establecimiento previamente (por sala export), usamos ese; de lo contrario pedimos el primero.
    const establecimientosUnicos = [...new Set(consolidatedData.map(item => item.establecimiento).filter(Boolean))];
    if (!establecimientosUnicos.length) {
      addNotification('No se detectaron establecimientos en los datos', 'error');
      return;
    }

    let establecimientoTarget;
    if (establecimientoForzado) {
      establecimientoTarget = establecimientoForzado;
    } else {
      establecimientoTarget = establecimientosUnicos[0];
      if (establecimientosUnicos.length > 1) {
        addNotification(`Usando el primer establecimiento (${establecimientoTarget}).`, 'info');
      }
    }

    try {
      setExportandoDaily(true);
      // Usar exclusivamente el primer archivo (originalData) para datos diarios reales
      if (!originalData || !Array.isArray(originalData) || originalData.length === 0) {
        addNotification('No hay archivo original con datos diarios', 'warning');
        return;
      }
      const hayFechasReales = originalData.some(r => r['Fecha reporte'] || r.fechaReporte || r['Fecha'] || r.fecha);
      if (!hayFechasReales) {
        addLog('⚠️ No se encontraron fechas diarias explícitas en el archivo original. No se genera reporte.', 'warning');
        addNotification('No hay registros diarios reales en el archivo original', 'warning');
        return;
      }
      addLog(`📅 Generando reporte diario multi-hoja (solo datos reales) para ${establecimientoTarget}...`, 'info');
      await exportarReporteDiarioSala(originalData, establecimientoTarget, empresa || 'General');
      addLog('✅ Reporte diario exportado (multi-hoja por día)', 'success');
      addNotification('Reporte diario exportado', 'success');
      onClose();
    } catch (error) {
      console.error('Error exportando reporte diario:', error);
      addLog(`❌ Error exportando: ${error.message}`, 'error');
      addNotification('Error al exportar reporte diario', 'error');
    } finally {
      setExportandoDaily(false);
    }
  };

  const handleClose = () => {
    setSalaDailySeleccionada('');
    setDailySearchTerm('');
    setExportandoDaily(false);
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
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="overline" sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: 1.2,
          display: 'block',
          mb: 1
        }}>
          SELECTOR • REPORTE DIARIO
        </Typography>
        <Typography variant="h6" sx={{
          fontWeight: 600,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          Establecimientos
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '1rem',
          mt: 1
        }}>
          Empresa: {empresa || 'Organizaci�n RDJ'}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {consolidatedData && (
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
                gap: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: theme => theme.palette.primary.main 
                }} />
                <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
                  Establecimientos disponibles: {[...new Set(consolidatedData.map(r => r.establecimiento).filter(Boolean))].length}
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
                    fontWeight: 600,
                    borderRadius: 1,
                    textTransform: 'none',
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
                    fontWeight: 600,
                    borderRadius: 1,
                    textTransform: 'none',
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
                  value={dailySearchTerm}
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
                    setDailySearchTerm(val);
                    if (val.trim()) {
                      const establecimientosUnicos = [...new Set(consolidatedData.map(r => r.establecimiento).filter(Boolean))];
                      const firstMatch = establecimientosUnicos.find(r => r.toLowerCase().includes(val.toLowerCase()));
                      if (firstMatch) setSalaDailySeleccionada(firstMatch);
                    }
                  }}
                />
                {/* Autocomplete dropdown */}
                {dailySearchTerm && consolidatedData && !salaDailySeleccionada && (
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
                    {[...new Set(consolidatedData.map(r => r.establecimiento).filter(Boolean))]
                      .filter(est => est.toLowerCase().includes(dailySearchTerm.toLowerCase()))
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
                            setSalaDailySeleccionada(est);
                            setDailySearchTerm(est);
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
                  setDailySearchTerm('');
                  setSalaDailySeleccionada('');
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
              {[...new Set(consolidatedData.map(r => r.establecimiento).filter(Boolean))]
                .filter(est => {
                  if (!dailySearchTerm) return true;
                  return est.toLowerCase().includes(dailySearchTerm.toLowerCase());
                })
                .sort()
                .map(est => {
                  // Calculate metrics for this establishment
                  const estData = consolidatedData.filter(r => r.establecimiento === est);
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
                        border: theme => salaDailySeleccionada === est 
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
                          : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: 2,
                        mb: 1.5,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: theme => salaDailySeleccionada === est 
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
                      onClick={() => setSalaDailySeleccionada(est)}
                    >
                      {/* Header sobrio */}
                      <Box sx={{ 
                        background: theme => salaDailySeleccionada === est 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.secondary.main, 0.08),
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderBottom: theme => `1px solid ${alpha(theme.palette.divider, 0.12)}`
                      }}>
                        <Radio 
                          checked={salaDailySeleccionada === est} 
                          onChange={() => setSalaDailySeleccionada(est)}
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
                Seleccionados: {salaDailySeleccionada ? 1 : 0} de {[...new Set(consolidatedData.map(r => r.establecimiento).filter(Boolean))].length}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        background: 'background.paper',
        borderTop: theme => `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        gap: 1
      }}>
        <Button 
          onClick={handleClose} 
          disabled={exportandoDaily}
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
          onClick={confirmarExportarDaily} 
          disabled={!salaDailySeleccionada || exportandoDaily} 
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
          {exportandoDaily ? 'Exportando...' : 'Exportar Seleccionados'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReporteDiarioModal;
