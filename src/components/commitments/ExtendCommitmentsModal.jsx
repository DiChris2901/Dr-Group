import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Alert,
  LinearProgress,
  Divider,
  Paper,
  alpha,
  useTheme
} from '@mui/material';
import {
  CalendarToday,
  Business,
  Person,
  AttachMoney,
  Schedule,
  TrendingUp,
  Warning,
  CheckCircle,
  Close,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  generateExtensionCommitments, 
  saveRecurringCommitments,
  getPeriodicityDescription 
} from '../../utils/recurringCommitments';
import {
  shimmerEffect,
  useThemeGradients,
  paperGradient,
  animationVariants
} from '../../utils/designSystem';

const ExtendCommitmentsModal = ({ 
  open, 
  onClose, 
  commitmentsToExtend,
  onExtensionComplete 
}) => {
  const { currentUser } = useAuth();
  const { addNotification, notificationsEnabled } = useNotifications();
  const { settings } = useSettings();
  const theme = useTheme();
  const gradients = useThemeGradients();
  
  const [selectedGroups, setSelectedGroups] = useState({});
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(0);
  const [extending, setExtending] = useState(false);
  const [extensionProgress, setExtensionProgress] = useState(0);

  // Inicializar grupos seleccionados
  useEffect(() => {
    if (commitmentsToExtend && commitmentsToExtend.groups) {
      const initialSelected = {};
      commitmentsToExtend.groups.forEach(group => {
        initialSelected[group.groupId] = true;
      });
      setSelectedGroups(initialSelected);
    }
  }, [commitmentsToExtend]);

  // Manejar selección de grupos
  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Calcular estadísticas
  const selectedCount = Object.values(selectedGroups).filter(Boolean).length;
  const totalAmount = commitmentsToExtend?.groups
    ?.filter(group => selectedGroups[group.groupId])
    ?.reduce((sum, group) => sum + (group.amount * 12), 0) || 0; // Estimado anual

  // Aplicar ajuste de monto
  const adjustedAmount = totalAmount * (1 + adjustmentPercentage / 100);

  // Años disponibles
  const availableYears = [];
  for (let i = 0; i <= 3; i++) {
    availableYears.push(new Date().getFullYear() + i);
  }

  // Procesar extensión
  const handleExtendCommitments = async () => {
    if (selectedCount === 0) {
      if (notificationsEnabled) {
        addNotification({
          type: 'warning',
          title: '⚠️ Sin Selección',
          message: 'Debes seleccionar al menos un grupo de compromisos para extender',
          duration: 4000
        });
      }
      return;
    }

    setExtending(true);
    setExtensionProgress(0);

    try {
      const selectedGroupsData = commitmentsToExtend.groups.filter(
        group => selectedGroups[group.groupId]
      );

      let processedGroups = 0;
      const results = [];

      // Procesar cada grupo seleccionado
      for (const group of selectedGroupsData) {
        try {
          // Aplicar ajuste de monto si es necesario
          const adjustedGroupData = {
            ...group,
            amount: adjustmentPercentage !== 0 
              ? group.amount * (1 + adjustmentPercentage / 100)
              : group.amount
          };

          // Generar compromisos de extensión
          const extensionCommitments = await generateExtensionCommitments(
            adjustedGroupData,
            12, // Un año de compromisos
            targetYear
          );

          if (extensionCommitments.length > 0) {
            // Guardar compromisos
            const result = await saveRecurringCommitments(extensionCommitments);
            results.push({
              groupId: group.groupId,
              concept: group.concept,
              count: result.count,
              success: true
            });
          }

        } catch (error) {
          console.error(`Error extending group ${group.groupId}:`, error);
          results.push({
            groupId: group.groupId,
            concept: group.concept,
            count: 0,
            success: false,
            error: error.message
          });
        }

        processedGroups++;
        setExtensionProgress((processedGroups / selectedGroupsData.length) * 100);
      }

      // Mostrar resultados
      const successfulExtensions = results.filter(r => r.success);
      const failedExtensions = results.filter(r => !r.success);

      if (successfulExtensions.length > 0) {
        const totalNewCommitments = successfulExtensions.reduce((sum, r) => sum + r.count, 0);
        
        if (notificationsEnabled) {
          addNotification({
            type: 'success',
            title: '🔄 Compromisos Extendidos Exitosamente',
            message: `Se extendieron ${successfulExtensions.length} grupos con ${totalNewCommitments} compromisos para ${targetYear}${adjustmentPercentage !== 0 ? ` (ajuste: ${adjustmentPercentage > 0 ? '+' : ''}${adjustmentPercentage}%)` : ''}`,
            duration: 8000
          });
        }
      }

      if (failedExtensions.length > 0) {
        if (notificationsEnabled) {
          addNotification({
            type: 'warning',
            title: '⚠️ Algunas Extensiones Fallaron',
            message: `${failedExtensions.length} grupos no pudieron ser extendidos. Revisa los logs para más detalles.`,
            duration: 6000
          });
        }
      }

      // Llamar callback de finalización
      onExtensionComplete?.(results);
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error in extension process:', error);
      if (notificationsEnabled) {
        addNotification({
          type: 'error',
          title: 'Error en Extensión',
          message: 'Ocurrió un error durante el proceso de extensión. Intenta nuevamente.',
          duration: 5000
        });
      }
    } finally {
      setExtending(false);
      setExtensionProgress(0);
    }
  };

  if (!commitmentsToExtend) return null;

  return (
    <AnimatePresence>
      {open && (
        <Dialog 
          open={open} 
          onClose={!extending ? onClose : undefined}
          maxWidth="md" 
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: settings.theme?.animations ? { 
              opacity: 0, 
              scale: 0.9, 
              y: 50 
            } : {},
            animate: settings.theme?.animations ? { 
              opacity: 1, 
              scale: 1, 
              y: 0 
            } : { opacity: 1, scale: 1, y: 0 },
            exit: settings.theme?.animations ? { 
              opacity: 0, 
              scale: 0.95, 
              y: 20 
            } : {},
            transition: settings.theme?.animations ? { 
              duration: 0.4, 
              ease: [0.4, 0, 0.2, 1] 
            } : { duration: 0 },
            sx: {
              borderRadius: 4,
              background: theme.palette.mode === 'dark' 
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`
                : paperGradient(theme),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                : '0 20px 40px rgba(31, 38, 135, 0.15)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: gradients.primary,
                opacity: 0.8
              }
            }
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <motion.div
              initial={settings.theme?.animations ? { opacity: 0, x: -20 } : {}}
              animate={settings.theme?.animations ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
              transition={settings.theme?.animations ? { delay: 0.1, duration: 0.4 } : { duration: 0 }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: gradients.primary,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    ...shimmerEffect
                  }}
                >
                  <RepeatIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight="800"
                    sx={{
                      background: gradients.text,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5
                    }}
                  >
                    Extender Compromisos Recurrentes
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500
                    }}
                  >
                    Replica compromisos para el siguiente período
                  </Typography>
                </Box>
                {!extending && (
                  <Box sx={{ ml: 'auto' }}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={onClose}
                        size="small"
                        sx={{
                          minWidth: 'auto',
                          p: 1,
                          borderRadius: 2,
                          color: alpha(theme.palette.text.secondary, 0.7),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            color: theme.palette.error.main
                          }
                        }}
                      >
                        <Close />
                      </Button>
                    </motion.div>
                  </Box>
                )}
              </Box>
            </motion.div>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pb: 1 }}>
            <motion.div
              initial={settings.theme?.animations ? { opacity: 0, y: 20 } : {}}
              animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={settings.theme?.animations ? { delay: 0.2, duration: 0.4 } : { duration: 0 }}
            >
              <Grid container spacing={3}>
                {/* Resumen de grupos */}
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                    }}
                  >
                    Se encontraron <strong>{commitmentsToExtend.total}</strong> grupos de compromisos recurrentes. 
                    <strong> {commitmentsToExtend.needsExtension}</strong> necesitan extensión.
                  </Alert>
                </Grid>

                {/* Configuración */}
                <Grid item xs={12} md={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fafc', 0.8)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
                    }}
                  >
                    <Typography variant="h6" fontWeight="700" mb={2}>
                      ⚙️ Configuración de Extensión
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Año Objetivo</InputLabel>
                      <Select
                        value={targetYear}
                        label="Año Objetivo"
                        onChange={(e) => setTargetYear(e.target.value)}
                        disabled={extending}
                        sx={{ borderRadius: 2 }}
                      >
                        {availableYears.map(year => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Ajuste de Monto (%)"
                      type="number"
                      value={adjustmentPercentage}
                      onChange={(e) => setAdjustmentPercentage(parseFloat(e.target.value) || 0)}
                      disabled={extending}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TrendingUp sx={{ color: alpha(theme.palette.primary.main, 0.7) }} />
                          </InputAdornment>
                        )
                      }}
                      helperText="Porcentaje de incremento/descuento para nuevos compromisos"
                    />
                  </Paper>
                </Grid>

                {/* Resumen */}
                <Grid item xs={12} md={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha('#10b981', 0.08)} 0%, ${alpha('#3b82f6', 0.08)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)'
                    }}
                  >
                    <Typography variant="h6" fontWeight="700" mb={2}>
                      📊 Resumen de Extensión
                    </Typography>
                    
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Grupos seleccionados:
                      </Typography>
                      <Chip 
                        label={selectedCount}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Monto estimado anual:
                      </Typography>
                      <Typography variant="h6" fontWeight="700" color="success.main">
                        ${totalAmount.toLocaleString('es-CO')}
                      </Typography>
                    </Box>
                    
                    {adjustmentPercentage !== 0 && (
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          background: adjustmentPercentage > 0 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                          border: `1px solid ${adjustmentPercentage > 0 
                            ? alpha(theme.palette.success.main, 0.3)
                            : alpha(theme.palette.error.main, 0.3)}`
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography 
                            variant="body2" 
                            color={adjustmentPercentage > 0 ? 'success.main' : 'error.main'}
                            fontWeight="600"
                          >
                            Monto ajustado:
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography 
                              variant="h6" 
                              fontWeight="700"
                              color={adjustmentPercentage > 0 ? 'success.main' : 'error.main'}
                            >
                              ${adjustedAmount.toLocaleString('es-CO')}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={`${adjustmentPercentage > 0 ? '+' : ''}${adjustmentPercentage}%`}
                              color={adjustmentPercentage > 0 ? 'success' : 'error'}
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Lista de compromisos */}
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight="700" mb={2}>
                    📋 Compromisos a Extender
                  </Typography>
                  
                  <List 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto',
                      background: alpha('#ffffff', 0.5),
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      p: 1
                    }}
                  >
                    {commitmentsToExtend.groups.map((group, index) => (
                      <motion.div
                        key={group.groupId}
                        initial={settings.theme?.animations ? { opacity: 0, y: 20 } : {}}
                        animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                        transition={settings.theme?.animations ? { delay: (index * 0.1) + 0.8 } : { duration: 0 }}
                      >
                        <ListItem
                          sx={{
                            border: `1px solid ${selectedGroups[group.groupId] 
                              ? alpha(theme.palette.primary.main, 0.3)
                              : alpha(theme.palette.divider, 0.2)
                            }`,
                            borderRadius: 2,
                            mb: 1,
                            background: selectedGroups[group.groupId] 
                              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: alpha(theme.palette.primary.main, 0.4)
                            }
                          }}
                          onClick={() => handleGroupToggle(group.groupId)}
                        >
                          <ListItemIcon>
                            <RepeatIcon 
                              color={selectedGroups[group.groupId] ? 'primary' : 'action'}
                              sx={{ fontSize: 24 }}
                            />
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography 
                                  variant="subtitle1" 
                                  fontWeight="700"
                                  sx={{ 
                                    color: selectedGroups[group.groupId] 
                                      ? theme.palette.primary.main 
                                      : theme.palette.text.primary 
                                  }}
                                >
                                  {group.concept}
                                </Typography>
                                <Chip 
                                  size="small" 
                                  label={getPeriodicityDescription(group.periodicity)}
                                  color={selectedGroups[group.groupId] ? "primary" : "default"}
                                  sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5} mb={0.5}>
                                  <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                                    {group.companyName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">•</Typography>
                                  <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                                    {group.beneficiary}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">•</Typography>
                                  <AttachMoney sx={{ fontSize: 14, color: 'success.main' }} />
                                  <Typography variant="body2" color="success.main" fontWeight="700">
                                    ${group.amount.toLocaleString('es-CO')}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {group.commitmentsCount} compromisos • 
                                  Último vencimiento: {format(new Date(group.lastDueDate), 'dd/MM/yyyy', { locale: es })}
                                </Typography>
                              </Box>
                            }
                          />
                          
                          <ListItemSecondaryAction>
                            <Switch
                              checked={selectedGroups[group.groupId] || false}
                              onChange={() => handleGroupToggle(group.groupId)}
                              disabled={extending}
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </Grid>

                {/* Progreso */}
                <AnimatePresence>
                  {extending && (
                    <Grid item xs={12}>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Paper 
                          sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Schedule sx={{ color: theme.palette.warning.main, fontSize: 24 }} />
                            </motion.div>
                            <Typography variant="h6" fontWeight="700">
                              Procesando extensión... {Math.round(extensionProgress)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={extensionProgress} 
                            sx={{ 
                              height: 12, 
                              borderRadius: 6,
                              background: alpha(theme.palette.warning.main, 0.1)
                            }}
                          />
                        </Paper>
                      </motion.div>
                    </Grid>
                  )}
                </AnimatePresence>
              </Grid>
            </motion.div>
          </DialogContent>

          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={onClose}
              disabled={extending}
              startIcon={<Close />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600
              }}
            >
              Cancelar
            </Button>
            
            <Button
              variant="contained"
              onClick={handleExtendCommitments}
              disabled={extending || selectedCount === 0}
              startIcon={extending ? <Schedule /> : <CheckCircle />}
              sx={{
                background: extending 
                  ? gradients.warning
                  : gradients.primary,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                boxShadow: selectedCount > 0 && !extending 
                  ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                  : 'none'
              }}
            >
              {extending ? 'Procesando...' : `Extender ${selectedCount} Grupos`}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ExtendCommitmentsModal;
