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
  spectacularGradients,
  spectacularAnimations
} from '../../utils/designSystem';

const ExtendCommitmentsModal = ({ 
  open, 
  onClose, 
  commitmentsToExtend,
  onExtensionComplete 
}) => {
  console.log('🎭 MODAL: ExtendCommitmentsModal instanciado:', {
    open,
    commitmentsToExtend,
    groupsCount: commitmentsToExtend?.groups?.length
  });
  
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

          // Notificación detallada
          addNotification({
            type: 'info',
            title: '📊 Detalles de Extensión',
            message: `✅ Grupos procesados: ${successfulExtensions.length} • Año objetivo: ${targetYear} • Total compromisos: ${totalNewCommitments}`,
            duration: 6000
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
                : spectacularGradients.glass.background,
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
                  ...shimmerEffect,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 3s infinite'
                  }
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
                <motion.div
                  initial={settings.theme?.animations ? { opacity: 0, scale: 0.95 } : {}}
                  animate={settings.theme?.animations ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
                  transition={settings.theme?.animations ? { delay: 0.3, duration: 0.3 } : { duration: 0 }}
                >
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      '& .MuiAlert-icon': {
                        color: theme.palette.info.main
                      }
                    }}
                  >
                    Se encontraron <strong>{commitmentsToExtend.total}</strong> grupos de compromisos recurrentes. 
                    <strong> {commitmentsToExtend.needsExtension}</strong> necesitan extensión.
                  </Alert>
                </motion.div>
              </Grid>

              {/* Configuración de extensión */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={settings.theme?.animations ? { opacity: 0, x: -20 } : {}}
                  animate={settings.theme?.animations ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                  transition={settings.theme?.animations ? { delay: 0.4, duration: 0.4 } : { duration: 0 }}
                >
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
                        : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fafc', 0.8)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: gradients.secondary,
                        opacity: 0.6
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }}
                      >
                        <Schedule sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        fontWeight="700"
                        sx={{
                          background: gradients.text,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        Configuración de Extensión
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Año Objetivo</InputLabel>
                        <Select
                          value={targetYear}
                          label="Año Objetivo"
                          onChange={(e) => setTargetYear(e.target.value)}
                          disabled={extending}
                          sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(theme.palette.primary.main, 0.2)
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(theme.palette.primary.main, 0.4)
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                              borderWidth: 2
                            }
                          }}
                        >
                          {availableYears.map(year => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Ajuste de Monto (%)"
                        type="number"
                        value={adjustmentPercentage}
                        onChange={(e) => setAdjustmentPercentage(parseFloat(e.target.value) || 0)}
                        disabled={extending}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '& fieldset': {
                              borderColor: alpha(theme.palette.primary.main, 0.2)
                            },
                            '&:hover fieldset': {
                              borderColor: alpha(theme.palette.primary.main, 0.4)
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                              borderWidth: 2
                            }
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TrendingUp sx={{ color: alpha(theme.palette.primary.main, 0.7) }} />
                            </InputAdornment>
                          )
                        }}
                        helperText="Porcentaje de incremento/descuento para nuevos compromisos"
                      />
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>

              {/* Estadísticas */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={settings.theme?.animations ? { opacity: 0, x: 20 } : {}}
                  animate={settings.theme?.animations ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                  transition={settings.theme?.animations ? { delay: 0.5, duration: 0.4 } : { duration: 0 }}
                >
                  <Paper 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
                        : `linear-gradient(135deg, ${alpha('#10b981', 0.08)} 0%, ${alpha('#3b82f6', 0.08)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: gradients.success,
                        opacity: 0.8
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main
                        }}
                      >
                        <TrendingUp sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        fontWeight="700"
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        Resumen de Extensión
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          Grupos seleccionados:
                        </Typography>
                        <Chip 
                          label={selectedCount}
                          size="small"
                          color="primary"
                          sx={{ 
                            fontWeight: 700,
                            background: gradients.primary
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          Monto estimado anual:
                        </Typography>
                        <Typography variant="h6" fontWeight="700" color="success.main">
                          ${totalAmount.toLocaleString('es-CO')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {adjustmentPercentage !== 0 && (
                      <motion.div
                        initial={settings.theme?.animations ? { opacity: 0, scale: 0.9 } : {}}
                        animate={settings.theme?.animations ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
                        transition={settings.theme?.animations ? { delay: 0.6, duration: 0.3 } : { duration: 0 }}
                      >
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
                                sx={{ 
                                  fontWeight: 700,
                                  background: adjustmentPercentage > 0 ? gradients.success : gradients.error
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                  </Paper>
                </motion.div>
              </Grid>

              {/* Lista de grupos */}
              <Grid item xs={12}>
                <motion.div
                  initial={settings.theme?.animations ? { opacity: 0, y: 30 } : {}}
                  animate={settings.theme?.animations ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={settings.theme?.animations ? { delay: 0.7, duration: 0.4 } : { duration: 0 }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        background: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main
                      }}
                    >
                      <Business sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="700"
                      sx={{
                        background: gradients.text,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Compromisos a Extender
                    </Typography>
                  </Box>
                  
                  <List 
                    sx={{ 
                      maxHeight: 300, 
                      overflow: 'auto',
                      background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.3)
                        : alpha('#ffffff', 0.5),
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
                        whileHover={settings.theme?.animations ? { y: -2 } : {}}
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
                            backdropFilter: 'blur(5px)',
                            boxShadow: selectedGroups[group.groupId]
                              ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                              : '0 2px 10px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background: selectedGroups[group.groupId] 
                                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                              borderColor: alpha(theme.palette.primary.main, 0.4),
                              boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                          }}
                          onClick={() => handleGroupToggle(group.groupId)}
                        >
                          <ListItemIcon>
                            <motion.div
                              animate={selectedGroups[group.groupId] ? { rotate: 360 } : { rotate: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <RepeatIcon 
                                color={selectedGroups[group.groupId] ? 'primary' : 'action'}
                                sx={{
                                  fontSize: 24,
                                  filter: selectedGroups[group.groupId] ? 'drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3))' : 'none'
                                }}
                              />
                            </motion.div>
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
                                  sx={{
                                    background: selectedGroups[group.groupId] 
                                      ? gradients.primary 
                                      : alpha(theme.palette.info.main, 0.1),
                                    color: selectedGroups[group.groupId] 
                                      ? 'white' 
                                      : theme.palette.info.main,
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}
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
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Switch
                                checked={selectedGroups[group.groupId] || false}
                                onChange={() => handleGroupToggle(group.groupId)}
                                disabled={extending}
                                color="primary"
                                sx={{
                                  '& .MuiSwitch-thumb': {
                                    boxShadow: selectedGroups[group.groupId] 
                                      ? '0 2px 8px rgba(102, 126, 234, 0.4)'
                                      : '0 2px 4px rgba(0,0,0,0.2)'
                                  }
                                }}
                              />
                            </motion.div>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </motion.div>
              </Grid>

              {/* Progreso de extensión */}
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
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                          boxShadow: '0 8px 32px rgba(255, 152, 0, 0.1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: gradients.warning,
                            opacity: 0.8
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Schedule sx={{ color: theme.palette.warning.main, fontSize: 24 }} />
                          </motion.div>
                          <Typography 
                            variant="h6" 
                            fontWeight="700"
                            sx={{
                              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.info.main} 100%)`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            Procesando extensión... {Math.round(extensionProgress)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={extensionProgress} 
                          sx={{ 
                            height: 12, 
                            borderRadius: 6,
                            background: alpha(theme.palette.warning.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              background: gradients.warning,
                              borderRadius: 6,
                              boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                            }
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

        <DialogActions sx={{ p: 3, gap: 2, background: alpha(theme.palette.background.default, 0.3) }}>
          <motion.div
            initial={settings.theme?.animations ? { opacity: 0, x: -20 } : {}}
            animate={settings.theme?.animations ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            transition={settings.theme?.animations ? { delay: 0.9, duration: 0.3 } : { duration: 0 }}
          >
            <Button
              onClick={onClose}
              disabled={extending}
              startIcon={<Close />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                color: alpha(theme.palette.text.secondary, 0.8),
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  borderColor: alpha(theme.palette.error.main, 0.3),
                  color: theme.palette.error.main
                },
                '&:disabled': {
                  opacity: 0.5
                }
              }}
            >
              Cancelar
            </Button>
          </motion.div>
          
          <motion.div
            initial={settings.theme?.animations ? { opacity: 0, x: 20 } : {}}
            animate={settings.theme?.animations ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
            transition={settings.theme?.animations ? { delay: 1, duration: 0.3 } : { duration: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="contained"
              onClick={handleExtendCommitments}
              disabled={extending || selectedCount === 0}
              startIcon={extending ? <Schedule /> : <CheckCircle />}
              sx={{
                background: extending 
                  ? gradients.warning
                  : selectedCount === 0 
                    ? alpha(theme.palette.action.disabled, 0.3)
                    : gradients.primary,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: selectedCount > 0 && !extending 
                  ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                  : 'none',
                '&:hover': {
                  background: extending 
                    ? gradients.warning
                    : selectedCount === 0 
                      ? alpha(theme.palette.action.disabled, 0.3)
                      : `linear-gradient(135deg, ${alpha('#667eea', 0.9)} 0%, ${alpha('#764ba2', 0.9)} 100%)`,
                  boxShadow: selectedCount > 0 && !extending 
                    ? '0 12px 35px rgba(102, 126, 234, 0.5)'
                    : 'none'
                },
                '&:disabled': {
                  color: alpha(theme.palette.text.disabled, 0.6)
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': extending ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shimmer 2s infinite'
                } : {}
              }}
            >
              {extending ? 'Procesando...' : `Extender ${selectedCount} Grupos`}
            </Button>
          </motion.div>
        </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ExtendCommitmentsModal;
