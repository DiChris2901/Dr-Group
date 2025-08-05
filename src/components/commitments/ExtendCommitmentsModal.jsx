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
  Paper
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
import { 
  generateExtensionCommitments, 
  saveRecurringCommitments,
  getPeriodicityDescription 
} from '../../utils/recurringCommitments';

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
    <Dialog 
      open={open} 
      onClose={!extending ? onClose : undefined}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <CalendarToday />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="700">
              🔄 Extender Compromisos Recurrentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Replica compromisos para el siguiente período
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Resumen de grupos */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Se encontraron <strong>{commitmentsToExtend.total}</strong> grupos de compromisos recurrentes. 
                <strong> {commitmentsToExtend.needsExtension}</strong> necesitan extensión.
              </Typography>
            </Alert>
          </Grid>

          {/* Configuración de extensión */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                ⚙️ Configuración de Extensión
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Año Objetivo</InputLabel>
                  <Select
                    value={targetYear}
                    label="Año Objetivo"
                    onChange={(e) => setTargetYear(e.target.value)}
                    disabled={extending}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TrendingUp color={adjustmentPercentage > 0 ? 'success' : adjustmentPercentage < 0 ? 'error' : 'action'} />
                      </InputAdornment>
                    ),
                    inputProps: { min: -50, max: 100, step: 0.1 }
                  }}
                  helperText="Porcentaje de incremento/descuento para nuevos compromisos"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Estadísticas */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                📊 Resumen de Extensión
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Grupos seleccionados: <strong>{selectedCount}</strong>
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Monto estimado anual: <strong>${totalAmount.toLocaleString('es-CO')}</strong>
                </Typography>
              </Box>
              
              {adjustmentPercentage !== 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color={adjustmentPercentage > 0 ? 'success.main' : 'error.main'}>
                    Monto ajustado: <strong>${adjustedAmount.toLocaleString('es-CO')}</strong>
                    <Chip 
                      size="small" 
                      label={`${adjustmentPercentage > 0 ? '+' : ''}${adjustmentPercentage}%`}
                      color={adjustmentPercentage > 0 ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Lista de grupos */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              📋 Compromisos a Extender
            </Typography>
            
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {commitmentsToExtend.groups.map((group, index) => (
                <motion.div
                  key={group.groupId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: selectedGroups[group.groupId] ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      <RepeatIcon color={selectedGroups[group.groupId] ? 'primary' : 'action'} />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="600">
                            {group.concept}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={getPeriodicityDescription(group.periodicity)}
                            color="info"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <Business sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {group.companyName} • 
                            <Person sx={{ fontSize: 14, mx: 0.5, verticalAlign: 'middle' }} />
                            {group.beneficiary} • 
                            <AttachMoney sx={{ fontSize: 14, mx: 0.5, verticalAlign: 'middle' }} />
                            ${group.amount.toLocaleString('es-CO')}
                          </Typography>
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

          {/* Progreso de extensión */}
          <AnimatePresence>
            {extending && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Procesando extensión... {Math.round(extensionProgress)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={extensionProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            )}
          </AnimatePresence>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={extending}
          startIcon={<Close />}
        >
          Cancelar
        </Button>
        
        <Button
          variant="contained"
          onClick={handleExtendCommitments}
          disabled={extending || selectedCount === 0}
          startIcon={extending ? <Schedule /> : <CheckCircle />}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 4
          }}
        >
          {extending ? 'Procesando...' : `Extender ${selectedCount} Grupos`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtendCommitmentsModal;
