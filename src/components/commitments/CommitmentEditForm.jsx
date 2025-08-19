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
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  Paper,
  alpha
} from '@mui/material';
import {
  Edit,
  Business,
  AccountBalance,
  CalendarToday,
  AttachMoney,
  Person,
  Notes,
  Payment,
  Description,
  CheckCircle,
  Info,
  Close,
  Save,
  History,
  CheckCircleOutline,
  RotateLeft,
  Receipt,
  AttachFile,
  Percent,
  TrendingUp,
  Schedule,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useTheme } from '@mui/material/styles';
// ✅ PaymentPopupPremium ELIMINADO COMPLETAMENTE
import { getPaymentMethodOptions } from '../../utils/formatUtils';
import { 
  generateRecurringCommitments, 
  saveRecurringCommitments, 
  getPeriodicityDescription,
  calculateNextDueDates 
} from '../../utils/recurringCommitments';

// Helper function para manejar fechas de Firebase de manera segura
const safeToDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return null;
};

// Función segura para formatear fechas
const formatSafeDate = (dateValue, formatString = 'yyyy-MM-dd') => {
  // Si ya es string y está en formato correcto para input date, retornar directamente
  if (typeof dateValue === 'string' && formatString === 'yyyy-MM-dd' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateValue;
  }
  
  const safeDate = safeToDate(dateValue);
  if (!safeDate) return '';
  
  try {
    // Para inputs type="date", usar método que evite problemas de zona horaria
    if (formatString === 'yyyy-MM-dd') {
      const year = safeDate.getFullYear();
      const month = String(safeDate.getMonth() + 1).padStart(2, '0');
      const day = String(safeDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return format(safeDate, formatString, { locale: es });
  } catch (error) {
    console.warn('Error formatting date in CommitmentEditForm:', error);
    return '';
  }
};

const CommitmentEditForm = ({ 
  open, 
  onClose, 
  commitment, 
  onSaved 
}) => {
  const { currentUser } = useAuth();
  const { addNotification, notificationsEnabled, notificationSoundEnabled } = useNotifications();
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});
  // ✅ paymentPopupOpen ELIMINADO COMPLETAMENTE
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    concept: '',
    companyId: '',
    amount: '',
    dueDate: null,
    beneficiary: '',
    observations: '',
    paymentMethod: 'transfer',
    periodicity: 'monthly', // unique, monthly, bimonthly, quarterly, fourmonthly, biannual, annual
    recurringCount: 12 // número de cuotas para compromisos recurrentes
  });

  // Calcular progreso del formulario
  const calculateProgress = () => {
    const requiredFields = ['concept', 'companyId', 'amount', 'dueDate'];
    const filledFields = requiredFields.filter(field => {
      if (field === 'dueDate') return formData[field] !== null;
      return formData[field] && formData[field].toString().trim() !== '';
    });
    return (filledFields.length / requiredFields.length) * 100;
  };

  // Opciones para periodicidad (siguiendo el patrón de NewCommitmentPage)
  const periodicityOptions = [
    { value: 'unique', label: 'Pago único' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'bimonthly', label: 'Bimestral' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'fourmonthly', label: 'Cuatrimestral' },
    { value: 'biannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' }
  ];

  // Opciones para método de pago (centralizadas)
  const paymentMethodOptions = getPaymentMethodOptions();

  // ✅ hasValidPayment ELIMINADO COMPLETAMENTE (ya no se usa)

  // Validar campo en tiempo real
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'concept':
        if (!value || value.trim() === '') {
          newErrors.concept = 'El concepto es obligatorio';
        } else if (value.trim().length < 3) {
          newErrors.concept = 'El concepto debe tener al menos 3 caracteres';
        } else {
          delete newErrors.concept;
        }
        break;
      case 'amount':
        if (!value || parseFloat(value) <= 0) {
          newErrors.amount = 'El monto debe ser mayor a 0';
        } else {
          delete newErrors.amount;
        }
        break;
      case 'companyId':
        if (!value) {
          newErrors.companyId = 'Debe seleccionar una empresa';
        } else {
          delete newErrors.companyId;
        }
        break;
      case 'dueDate':
        if (!value) {
          newErrors.dueDate = 'La fecha de vencimiento es obligatoria';
        } else {
          delete newErrors.dueDate;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

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
      const initialData = {
        concept: commitment.concept || commitment.description || '',
        companyId: commitment.companyId || '',
        amount: commitment.amount || '',
        dueDate: formatSafeDate(commitment.dueDate, 'yyyy-MM-dd'), // Convertir a string para input
        beneficiary: commitment.beneficiary || '',
        observations: commitment.observations || '',
        paymentMethod: commitment.paymentMethod || 'transfer',
        periodicity: commitment.periodicity || 'monthly',
        recurringCount: commitment.recurringCount || 12
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
    }
  }, [commitment, open]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const hasFormChanges = Object.keys(formData).some(key => {
      return formData[key] !== originalData[key];
    });
    setHasChanges(hasFormChanges);
  }, [formData, originalData]);

  const handleFormChange = (field, value) => {
    // Detectar cambio de periodicidad para mostrar toast informativo
    if (field === 'periodicity') {
      const wasUnique = formData.periodicity === 'unique';
      const isNowRecurring = value !== 'unique';
      
      // Toast informativo cuando se activa recurrencia
      if (wasUnique && isNowRecurring && formData.dueDate) {
        setTimeout(() => {
          if (notificationsEnabled) {
            // Calcular próximas fechas para el toast
            if (formData.dueDate) {
              const nextDates = calculateNextDueDates(safeToDate(formData.dueDate) || new Date(), value, 3);
              const nextDatesText = nextDates.slice(1, 3).map(date => 
                formatSafeDate(date, 'dd/MM/yyyy')
              ).join(', ');
              
              addNotification({
                type: 'info',
                title: '🔄 Pagos Recurrentes Activados',
                message: `Se configuró periodicidad ${getPeriodicityDescription(value).toLowerCase()}. Próximas fechas: ${nextDatesText}`,
                icon: 'info',
                color: 'info',
                duration: 5000
              });
            }
          }
        }, 300); // Pequeño delay para que se vea el cambio visual primero
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Validar campo en tiempo real
    validateField(field, value);
  };

  const handleSave = async () => {
    if (!commitment || !formData.concept.trim() || !formData.amount) {
      return;
    }

    setSaving(true);
    try {
      // Convertir fecha a formato compatible con Firestore SIN problemas de zona horaria
      let dueDateToSave = null;
      if (formData.dueDate) {
        if (typeof formData.dueDate === 'string') {
          // Si es string (del input date), crear fecha local sin zona horaria
          const [year, month, day] = formData.dueDate.split('-');
          dueDateToSave = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        } else {
          // Si ya es Date, usar directamente
          dueDateToSave = formData.dueDate;
        }
      }
      
      console.log('🕐 [DEBUG] Conversión de fecha:', {
        original: formData.dueDate,
        converted: dueDateToSave,
        string: dueDateToSave?.toString()
      });
      
      // Datos del compromiso actualizado
      const updatedData = {
        concept: formData.concept.trim(),
        companyId: formData.companyId,
        amount: parseFloat(formData.amount),
        dueDate: dueDateToSave, // Usar fecha convertida
        beneficiary: formData.beneficiary.trim(),
        observations: formData.observations.trim(),
        paymentMethod: formData.paymentMethod,
        periodicity: formData.periodicity,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      console.log('🔄 Actualizando compromiso:', commitment.id, {
        originalDueDate: commitment.dueDate,
        newDueDate: dueDateToSave,
        updatedData
      });

      // Actualizar el compromiso existente
      const commitmentRef = doc(db, 'commitments', commitment.id);
      await updateDoc(commitmentRef, updatedData);

      console.log('✅ Compromiso actualizado exitosamente');

      // � CRÍTICO: Limpiar caché para forzar recarga
      if (window.firestoreCache) {
        window.firestoreCache.clear();
        console.log('🗑️ Cache invalidado después de actualización');
      }

      // �🔄 Detectar cambios en la periodicidad para regenerar compromisos
      const periodicityChanged = originalData.periodicity !== formData.periodicity;
      const wasUnique = originalData.periodicity === 'unique';
      const isNowRecurring = formData.periodicity !== 'unique';
      const wasRecurring = originalData.periodicity !== 'unique';
      const isNowUnique = formData.periodicity === 'unique';
      
      // 🗑️ CASO 1: Cambio DE recurrente A único - Solo eliminar compromisos relacionados
      if (periodicityChanged && wasRecurring && isNowUnique) {
        try {
          // Obtener el nombre de la empresa para las notificaciones
          const selectedCompany = companies.find(c => c.id === formData.companyId);
          const companyName = selectedCompany?.name || 'Empresa';
          
          // Eliminar compromisos del MISMO GRUPO RECURRENTE
          if (originalData.recurringGroup) {
            const commitmentsQuery = query(
              collection(db, 'commitments'),
              where('recurringGroup', '==', originalData.recurringGroup)
            );
            
            const querySnapshot = await getDocs(commitmentsQuery);
            const deletePromises = [];
            let deletedCount = 0;
            
            querySnapshot.forEach((docSnap) => {
              // No eliminar el compromiso actual que estamos editando
              if (docSnap.id !== commitment.id) {
                deletePromises.push(deleteDoc(docSnap.ref));
                deletedCount++;
                console.log(`🗑️ Marcado para eliminar (grupo recurrente): ${docSnap.data().concept} (${docSnap.id})`);
              }
            });
            
            if (deletePromises.length > 0) {
              await Promise.all(deletePromises);
              console.log(`🗑️ Eliminados ${deletedCount} compromisos del grupo recurrente`);
              
              // Notificación de eliminación
              if (notificationsEnabled) {
                addNotification({
                  type: 'success',
                  title: '🗑️ Compromisos Recurrentes Eliminados',
                  message: `Se eliminaron ${deletedCount} compromisos ${getPeriodicityDescription(originalData.periodicity).toLowerCase()} y se convirtió a pago único para "${companyName}"`,
                  icon: 'success',
                  color: 'warning',
                  duration: 6000
                });
              }
            }
          } else {
            // Fallback: buscar por criterios similares (método anterior pero más específico)
            const baseConcept = originalData.concept.replace(/ - (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) \d{4}$/i, '');
            
            const commitmentsQuery = query(
              collection(db, 'commitments'),
              where('companyId', '==', originalData.companyId),
              where('beneficiary', '==', originalData.beneficiary),
              where('amount', '==', originalData.amount),
              where('periodicity', '==', originalData.periodicity)
            );
            
            const querySnapshot = await getDocs(commitmentsQuery);
            const deletePromises = [];
            let deletedCount = 0;
            
            querySnapshot.forEach((docSnap) => {
              const docData = docSnap.data();
              const docConcept = docData.concept || '';
              
              // Verificar si es parte de la misma serie (concepto base similar)
              const isRelated = docConcept.includes(baseConcept) || docConcept.startsWith(baseConcept);
              
              // No eliminar el compromiso actual que estamos editando
              const isCurrentCommitment = docSnap.id === commitment.id;
              
              // Solo eliminar si es relacionado y no es el actual
              if (isRelated && !isCurrentCommitment) {
                deletePromises.push(deleteDoc(docSnap.ref));
                deletedCount++;
                console.log(`🗑️ Marcado para eliminar (cambio a único): ${docConcept} (${docSnap.id})`);
              }
            });
            
            if (deletePromises.length > 0) {
              await Promise.all(deletePromises);
              console.log(`🗑️ Eliminados ${deletedCount} compromisos recurrentes al cambiar a pago único`);
              
              // Notificación de eliminación
              if (notificationsEnabled) {
                addNotification({
                  type: 'success',
                  title: '🗑️ Compromisos Recurrentes Eliminados',
                  message: `Se eliminaron ${deletedCount} compromisos ${getPeriodicityDescription(originalData.periodicity).toLowerCase()} y se convirtió a pago único para "${companyName}"`,
                  icon: 'success',
                  color: 'warning',
                  duration: 6000
                });
              }
            }
          }
          
          // Notificación simple para el cambio a único
          if (notificationsEnabled) {
            addNotification({
              type: 'info',
              title: '📝 Compromiso Convertido a Pago Único',
              message: `Se actualizó el compromiso "${formData.concept}" de ${getPeriodicityDescription(originalData.periodicity).toLowerCase()} a pago único`,
              icon: 'info',
              color: 'info',
              duration: 4000
            });
          }
          
        } catch (error) {
          console.error('Error eliminando compromisos recurrentes:', error);
          if (notificationsEnabled) {
            addNotification({
              type: 'warning',
              title: '⚠️ Advertencia de Limpieza',
              message: 'No se pudieron eliminar algunos compromisos recurrentes. Revisa posibles duplicados.',
              icon: 'warning',
              color: 'warning',
              duration: 5000
            });
          }
        }
      }
      // 🔄 CASO 2: Cambio entre periodicidades recurrentes O de único a recurrente
      else if (periodicityChanged && isNowRecurring) {
        // Obtener el nombre de la empresa para las notificaciones
        const selectedCompany = companies.find(c => c.id === formData.companyId);
        const companyName = selectedCompany?.name || 'Empresa';

        // 🗑️ Si ya era recurrente pero cambió la periodicidad, eliminar compromisos relacionados del grupo anterior
        if (wasRecurring && !wasUnique) {
          try {
            // Estrategia mejorada: buscar compromisos relacionados por múltiples criterios
            // Usar el concepto base (sin sufijos de fecha) para encontrar la serie completa
            const baseConcept = originalData.concept.replace(/ - (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) \d{4}$/i, '');
            
            // Buscar compromisos relacionados con criterios más amplios
            const commitmentsQuery = query(
              collection(db, 'commitments'),
              where('companyId', '==', originalData.companyId),
              where('beneficiary', '==', originalData.beneficiary),
              where('amount', '==', originalData.amount),
              where('periodicity', '==', originalData.periodicity)
            );
            
            const querySnapshot = await getDocs(commitmentsQuery);
            const deletePromises = [];
            let deletedCount = 0;
            
            querySnapshot.forEach((docSnap) => {
              const docData = docSnap.data();
              const docConcept = docData.concept || '';
              
              // Verificar si es parte de la misma serie (concepto base similar)
              const isRelated = docConcept.includes(baseConcept) || docConcept.startsWith(baseConcept);
              
              // No eliminar el compromiso actual que estamos editando
              const isCurrentCommitment = docSnap.id === commitment.id;
              
              // Solo eliminar si es relacionado y no es el actual
              if (isRelated && !isCurrentCommitment) {
                deletePromises.push(deleteDoc(docSnap.ref));
                deletedCount++;
                console.log(`🗑️ Marcado para eliminar: ${docConcept} (${docSnap.id})`);
              }
            });
            
            if (deletePromises.length > 0) {
              await Promise.all(deletePromises);
              console.log(`🗑️ Eliminados ${deletedCount} compromisos relacionados con periodicidad anterior (${originalData.periodicity})`);
              
              // Notificación de limpieza
              if (notificationsEnabled) {
                addNotification({
                  type: 'info',
                  title: '🗑️ Compromisos Anteriores Eliminados',
                  message: `Se eliminaron ${deletedCount} compromisos con periodicidad ${getPeriodicityDescription(originalData.periodicity).toLowerCase()} para evitar duplicados`,
                  icon: 'info',
                  color: 'warning',
                  duration: 4000
                });
              }
            }
          } catch (error) {
            console.error('Error eliminando compromisos anteriores:', error);
            if (notificationsEnabled) {
              addNotification({
                type: 'warning',
                title: '⚠️ Advertencia de Limpieza',
                message: 'No se pudieron eliminar algunos compromisos anteriores. Revisa posibles duplicados.',
                icon: 'warning',
                color: 'warning',
                duration: 5000
              });
            }
          }
        }

        // Generar nuevos compromisos recurrentes con la nueva periodicidad
        const recurringData = {
          ...updatedData,
          companyName: companyName,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
        };

        const recurringCommitments = await generateRecurringCommitments(
          recurringData, 
          formData.recurringCount || 12,
          true // skipFirst = true porque el primero ya existe y se actualizó
        );

        if (recurringCommitments.length > 0) {
          // Guardar los nuevos compromisos recurrentes
          const result = await saveRecurringCommitments(recurringCommitments);

          // 🔊 Notificación de éxito
          if (notificationsEnabled) {
            if (notificationSoundEnabled) {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeCSGh2u+8g');
              audio.volume = 0.2;
              audio.play().catch(() => {});
            }
            
            // Calcular próximas fechas para mostrar en la notificación
            const nextDates = calculateNextDueDates(safeToDate(formData.dueDate) || new Date(), formData.periodicity, 4);
            const nextDatesText = nextDates.slice(1).map(date => 
              formatSafeDate(date, 'dd/MM/yyyy')
            ).join(', ');
            
            const titleText = wasUnique ? '🔄 Sistema de Pagos Recurrentes Activado' : '🔄 Periodicidad Actualizada';
            const messageText = wasUnique 
              ? `Se activó la recurrencia y se crearon ${result.count} compromisos ${getPeriodicityDescription(formData.periodicity).toLowerCase()} adicionales para "${companyName}"`
              : `Se cambió de ${getPeriodicityDescription(originalData.periodicity).toLowerCase()} a ${getPeriodicityDescription(formData.periodicity).toLowerCase()} y se regeneraron ${result.count} compromisos para "${companyName}"`;
            
            addNotification({
              type: 'success',
              title: titleText,
              message: `${messageText}. Próximas fechas: ${nextDatesText}${result.count > 3 ? ' y más...' : ''}`,
              icon: 'success',
              color: 'success',
              duration: 8000
            });

            // 📋 Notificación adicional para el centro de notificaciones
            addNotification({
              type: 'info',
              title: '📊 Periodicidad de Compromisos Actualizada',
              message: `✅ Nueva periodicidad: ${getPeriodicityDescription(formData.periodicity)} • ${result.count + 1} total • Beneficiario: ${formData.beneficiary} • Monto: $${formData.amount.toLocaleString('es-CO')} c/u`,
              icon: 'info',
              color: 'info',
              duration: 6000
            });
          }
        }
      } 
      // 🔄 CASO 3: Sin cambio de periodicidad o cambio que no requiere procesamiento especial
      else {
        // Notificación simple para edición sin cambio de recurrencia
        if (notificationsEnabled) {
          addNotification({
            type: 'success',
            title: 'Compromiso Actualizado',
            message: `Se actualizó correctamente el compromiso "${formData.concept}"`,
            icon: 'success',
            color: 'success',
            duration: 4000
          });
        }
      }

      console.log('🔄 [DEBUG CommitmentEditForm] Llamando callback onSaved...');
      onSaved?.();
      console.log('🏁 [DEBUG CommitmentEditForm] Callback onSaved ejecutado, cerrando...');
      onClose();
    } catch (error) {
      console.error('Error updating commitment:', error);
      if (notificationsEnabled) {
        addNotification({
          type: 'error',
          title: 'Error al Actualizar',
          message: 'No se pudo actualizar el compromiso. Intenta nuevamente.',
          icon: 'error',
          color: 'error',
          duration: 5000
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Limpiar el formulario solo si no está guardando
    if (!saving) {
      setFormData({
        concept: '',
        companyId: '',
        amount: '',
        dueDate: null,
        beneficiary: '',
        observations: '',
        paymentMethod: 'transfer',
        periodicity: 'monthly',
        recurringCount: 12
      });
      setErrors({});
    }
    onClose();
  };

  // Obtener información de la empresa seleccionada
  const selectedCompany = companies.find(c => c.id === formData.companyId);
  
  // Formatear monto
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Formatear número con puntos de miles (sin símbolo de moneda)
  const formatNumber = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO').format(value);
  };

  // Limpiar formato para obtener solo números
  const parseNumber = (formattedValue) => {
    if (!formattedValue) return '';
    return formattedValue.toString().replace(/[^\d]/g, '');
  };

  // Manejar cambio en el campo de monto
  const handleAmountChange = (value) => {
    // Limpiar el valor de cualquier formato
    const cleanValue = parseNumber(value);
    
    // Actualizar el estado con el valor limpio
    handleFormChange('amount', cleanValue);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(50, 50, 50, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
          position: 'relative',
          // Shimmer effect premium
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shimmer 3s infinite',
            zIndex: 1
          },
          '& @keyframes pulse': {
            '0%, 100%': { 
              boxShadow: `0 0 0 0 ${theme.palette.primary.main}40` 
            },
            '50%': { 
              boxShadow: `0 0 0 10px ${theme.palette.primary.main}00` 
            }
          },
          '& @keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' }
          },
          '& @keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(180deg)' }
          }
        }
      }}
    >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 120,
            duration: 0.6 
          }}
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* Header Premium con Gradiente Dinámico */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 100,
              delay: 0.1 
            }}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
                p: 4,
                borderRadius: '16px 16px 0 0',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                  zIndex: 1
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  animation: 'float 6s ease-in-out infinite',
                  zIndex: 1
                },
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-20px) rotate(180deg)' }
                },
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 2 }}>
                <Box display="flex" alignItems="center" gap={3}>
                  <motion.div
                    initial={{ scale: 0.8, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 2s infinite'
                        }
                      }}
                    >
                      <Edit sx={{ fontSize: 32, color: 'white', zIndex: 1 }} />
                    </Box>
                  </motion.div>
                  
                  <Box>
                    <motion.div
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        Editar Compromiso
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {commitment?.concept || commitment?.description || 'Modifica los detalles del compromiso'}
                      </Typography>
                    </motion.div>
                  </Box>
                </Box>

                {/* Información adicional del compromiso */}
                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                    {selectedCompany && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 3,
                            p: 1.5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        >
                          {/* Logotipo de la empresa */}
                          {selectedCompany.logoURL ? (
                            <Box
                              component="img"
                              src={selectedCompany.logoURL}
                              alt={`Logo de ${selectedCompany.name}`}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                objectFit: 'contain',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Business sx={{ fontSize: 18, color: 'white' }} />
                            </Box>
                          )}
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                            {selectedCompany.name}
                          </Typography>
                        </Box>
                      </motion.div>
                    )}
                    {hasChanges && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <Chip
                          icon={<Edit />}
                          label="Cambios pendientes"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 193, 7, 0.9)',
                            color: 'rgba(0,0,0,0.8)',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      </motion.div>
                    )}
                  </Box>
                </motion.div>
              </Box>

              {/* Progress bar premium */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                style={{ originX: 0 }}
              >
                <Box sx={{ mt: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      Progreso del formulario
                    </Typography>
                    <motion.div
                      key={calculateProgress()}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {Math.round(calculateProgress())}%
                      </Typography>
                    </motion.div>
                  </Box>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress()}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 4,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            animation: 'shimmer 2s infinite'
                          }
                        }
                      }}
                    />
                  </motion.div>
                </Box>
              </motion.div>
            </Box>
          </motion.div>

          <DialogContent sx={{ p: 4 }}>
            {/* Alert Premium con Información del Monto */}
            <AnimatePresence>
              {formData.amount && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    bounce: 0.3, 
                    duration: 0.6 
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 3,
                      p: 2.5,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.info.light}15, ${theme.palette.info.main}10)`,
                      border: `1px solid ${theme.palette.info.main}30`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${theme.palette.info.main}20, transparent)`,
                        animation: 'shimmer 3s infinite',
                        zIndex: 1
                      },
                      '@keyframes shimmer': {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' }
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} sx={{ position: 'relative', zIndex: 2 }}>
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${theme.palette.info.main}40`,
                            animation: 'pulse 2s infinite'
                          }}
                        >
                          <AttachMoney sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </motion.div>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.info.dark, mb: 0.5 }}>
                          Monto del Compromiso
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          <strong style={{ color: theme.palette.info.main }}>{formatCurrency(formData.amount)}</strong>
                          {hasChanges && originalData.amount !== formData.amount && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              style={{ 
                                marginLeft: 8, 
                                color: theme.palette.warning.main,
                                fontWeight: 600
                              }}
                            >
                              (Modificado desde {formatCurrency(originalData.amount)})
                            </motion.span>
                          )}
                        </Typography>
                      </Box>
                      {hasChanges && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                        >
                          <Chip
                            icon={<Edit />}
                            label="Modificado"
                            size="small"
                            sx={{
                              bgcolor: theme.palette.warning.main,
                              color: 'white',
                              fontWeight: 600,
                              boxShadow: `0 2px 8px ${theme.palette.warning.main}40`,
                              animation: 'pulse 2s infinite'
                            }}
                          />
                        </motion.div>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            <Grid container spacing={3}>
              {/* Concepto/Descripción */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 120,
                    delay: 0.2 
                  }}
                  whileHover={{ y: -2 }}
                >
                  <TextField
                    fullWidth
                    label="Concepto o Descripción"
                    value={formData.concept}
                    onChange={(e) => handleFormChange('concept', e.target.value)}
                    variant="outlined"
                    required
                    size="small"
                    error={!!errors.concept}
                    helperText={errors.concept || 'Describe el compromiso financiero'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Description color={errors.concept ? 'error' : 'primary'} />
                        </InputAdornment>
                      ),
                      endAdornment: !errors.concept && formData.concept.trim() && (
                        <InputAdornment position="end">
                          <CheckCircle color="success" fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                          transition: 'all 0.6s ease'
                        },
                        '&:hover': {
                          transform: 'translateY(-2px) scale(1.01)',
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                          '&::before': {
                            left: '100%'
                          }
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                        }
                      }
                    }}
                  />
                </motion.div>
              </Grid>

              {/* Empresa y Monto */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 120,
                    delay: 0.3 
                  }}
                  whileHover={{ y: -2, scale: 1.01 }}
                >
                  <FormControl fullWidth size="small" error={!!errors.companyId}>
                    <InputLabel>Empresa *</InputLabel>
                    <Select
                      value={formData.companyId}
                      onChange={(e) => handleFormChange('companyId', e.target.value)}
                      label="Empresa *"
                      startAdornment={
                        <InputAdornment position="start" sx={{ ml: 1 }}>
                          {selectedCompany?.logoUrl ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                              key={selectedCompany.id} // Para animar cambios
                            >
                              <Box
                                component="img"
                                src={selectedCompany.logoURL}
                                alt={`Logo de ${selectedCompany.name}`}
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 1,
                                  objectFit: 'contain',
                                  backgroundColor: theme.palette.background.paper,
                                  border: `1px solid ${theme.palette.divider}`,
                                  boxShadow: `0 2px 4px ${theme.palette.primary.main}20`,
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ rotate: -10 }}
                              animate={{ rotate: 0 }}
                              transition={{ type: "spring", bounce: 0.3 }}
                            >
                              <Business 
                                color={errors.companyId ? 'error' : 'primary'} 
                                fontSize="small"
                                sx={{ 
                                  transition: 'all 0.3s ease',
                                  filter: selectedCompany ? 'none' : 'grayscale(50%)'
                                }}
                              />
                            </motion.div>
                          )}
                        </InputAdornment>
                      }
                      sx={{ 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            {/* Logotipo de la empresa */}
                            {company.logoURL ? (
                              <Box
                                component="img"
                                src={company.logoURL}
                                alt={`Logo de ${company.name}`}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 1,
                                  objectFit: 'contain',
                                  backgroundColor: theme.palette.background.paper,
                                  border: `1px solid ${theme.palette.divider}`,
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 1,
                                  backgroundColor: theme.palette.action.hover,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                              </Box>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {company.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.companyId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                        {errors.companyId}
                      </Typography>
                    )}
                  </FormControl>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 120,
                    delay: 0.4 
                  }}
                  whileHover={{ y: -2, scale: 1.01 }}
                >
                  <TextField
                    fullWidth
                    label="Monto"
                    type="text"
                    value={formData.amount ? formatNumber(formData.amount) : ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    variant="outlined"
                    required
                    size="small"
                    error={!!errors.amount}
                    helperText={errors.amount || 'Valor del compromiso en COP'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney color={errors.amount ? 'error' : 'success'} />
                        </InputAdornment>
                      ),
                      endAdornment: !errors.amount && formData.amount && parseFloat(formData.amount) > 0 && (
                        <InputAdornment position="end">
                          <CheckCircle color="success" fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.03)}, ${alpha(theme.palette.success.light, 0.02)})`,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.success.main, 0.15)}, transparent)`,
                          transition: 'all 0.6s ease'
                        },
                        '&:hover': {
                          transform: 'translateY(-2px) scale(1.01)',
                          boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.2)}`,
                          '&::before': {
                            left: '100%'
                          }
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.25)}`
                        }
                      }
                    }}
                  />
                </motion.div>
              </Grid>

              {/* Fecha de Vencimiento */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <TextField
                    fullWidth
                    label="Fecha de Vencimiento"
                    type="date"
                    value={formatSafeDate(formData.dueDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      // Manejar fecha sin problemas de zona horaria
                      const dateString = e.target.value;
                      console.log('📅 [DEBUG] Input date changed:', dateString);
                      handleFormChange('dueDate', dateString); // Guardar como string
                    }}
                    variant="outlined"
                    required
                    size="small"
                    error={!!errors.dueDate}
                    helperText={errors.dueDate || 'Fecha límite de pago'}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday color={errors.dueDate ? 'error' : 'warning'} />
                        </InputAdornment>
                      ),
                      endAdornment: !errors.dueDate && formData.dueDate && (
                        <InputAdornment position="end">
                          <CheckCircle color="success" fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  />
                </motion.div>
              </Grid>

              {/* Método de Pago */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <FormControl fullWidth size="small">
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={formData.paymentMethod}
                      onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                      label="Método de Pago"
                      startAdornment={
                        <InputAdornment position="start" sx={{ ml: 1 }}>
                          <Payment color="info" fontSize="small" />
                        </InputAdornment>
                      }
                      sx={{ 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      {paymentMethodOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center">
                            {option.value === 'transfer' && <AccountBalance sx={{ mr: 1, fontSize: 16 }} />}
                            {option.value === 'cash' && <AttachMoney sx={{ mr: 1, fontSize: 16 }} />}
                            {option.value === 'pse' && <Payment sx={{ mr: 1, fontSize: 16 }} />}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </motion.div>
              </Grid>

              {/* Periodicidad con Badge Dinámico */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <Box position="relative">
                    <FormControl fullWidth size="small">
                      <InputLabel>Periodicidad</InputLabel>
                      <Select
                        value={formData.periodicity}
                        onChange={(e) => handleFormChange('periodicity', e.target.value)}
                        label="Periodicidad"
                        startAdornment={
                          <InputAdornment position="start" sx={{ ml: 1 }}>
                            <Schedule color="info" fontSize="small" />
                          </InputAdornment>
                        }
                        sx={{ 
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        {periodicityOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box display="flex" alignItems="center">
                              <Schedule sx={{ mr: 1, fontSize: 16 }} />
                              {option.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Badge Dinámico */}
                    <AnimatePresence>
                      {formData.periodicity !== 'unique' && formData.dueDate && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ duration: 0.2, type: "spring", damping: 20 }}
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: 8,
                            zIndex: 1
                          }}
                        >
                          <Chip
                            icon={<RepeatIcon sx={{ fontSize: 14 }} />}
                            label={(() => {
                              if (!formData.dueDate) return `${formData.recurringCount || 12} cuotas`;
                              const safeDueDate = safeToDate(formData.dueDate);
                              if (!safeDueDate) return `${formData.recurringCount || 12} cuotas`;
                              const nextDates = calculateNextDueDates(safeDueDate, formData.periodicity, 2);
                              const nextDate = nextDates[1];
                              return nextDate ? `Próxima: ${formatSafeDate(nextDate, 'dd/MM')}` : `${formData.recurringCount || 12} cuotas`;
                            })()}
                            size="small"
                            color="info"
                            variant="filled"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              backgroundColor: alpha(theme.palette.info.main, 0.9),
                              color: 'white',
                              fontWeight: 500,
                              boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`,
                              '& .MuiChip-icon': {
                                fontSize: 12,
                                color: 'white'
                              }
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </motion.div>
              </Grid>

              {/* Número de Cuotas - Solo para compromisos recurrentes */}
              {formData.periodicity !== 'unique' && (
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ delay: 0.65, duration: 0.3 }}
                  >
                    <TextField
                      fullWidth
                      label="Número de Cuotas"
                      type="number"
                      value={formData.recurringCount || 12}
                      onChange={(e) => handleFormChange('recurringCount', parseInt(e.target.value) || 12)}
                      variant="outlined"
                      size="small"
                      inputProps={{ min: 2, max: 120 }}
                      helperText={`Total de cuotas ${getPeriodicityDescription(formData.periodicity).toLowerCase()}`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <RepeatIcon color="secondary" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          background: alpha(theme.palette.secondary.main, 0.05),
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }
                      }}
                    />
                  </motion.div>
                </Grid>
              )}

              {/* Separador visual */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Divider sx={{ my: 1 }}>
                    <Chip 
                      label="Información Adicional" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Divider>
                </motion.div>
              </Grid>

              {/* Beneficiario */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <TextField
                    fullWidth
                    label="Beneficiario"
                    value={formData.beneficiary}
                    onChange={(e) => handleFormChange('beneficiary', e.target.value)}
                    variant="outlined"
                    size="small"
                    helperText="Persona o entidad que recibe el pago"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="secondary" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  />
                </motion.div>
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  <TextField
                    fullWidth
                    label="Observaciones"
                    value={formData.observations}
                    onChange={(e) => handleFormChange('observations', e.target.value)}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    helperText="Notas adicionales sobre el compromiso"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <Notes color="action" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  />
                </motion.div>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: 4, 
              pt: 3,
              gap: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.default, 0.4)})`,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}
          >
            {/* Botón Secundario - Acción Rápida */}
            <Box sx={{ 
              order: { xs: 2, sm: 1 }, 
              width: { xs: '100%', sm: 'auto' },
              minHeight: { xs: 'auto', sm: '50px' }, // Altura fija para evitar reflow
              display: 'flex',
              alignItems: 'center'
            }}>
              {/* ✅ BOTÓN "Marcar Pagado" ELIMINADO COMPLETAMENTE */}
            </Box>

            {/* Botones Principales - Jerarquía Clara */}
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2,
                order: { xs: 1, sm: 2 },
                width: { xs: '100%', sm: 'auto' },
                minWidth: { sm: '340px' }
              }}
            >
              {/* Botón Cancelar - Estilo Sutil */}
              <motion.div
                style={{ flex: 1 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<Close />}
                  sx={{
                    borderRadius: 3,
                    height: 50,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    border: `1.5px solid ${alpha(theme.palette.divider, 0.3)}`,
                    color: theme.palette.text.secondary,
                    backgroundColor: 'transparent',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.error.main, 0.08)}, transparent)`,
                      transition: 'all 0.5s ease'
                    },
                    '&:hover': {
                      borderColor: alpha(theme.palette.error.main, 0.5),
                      color: theme.palette.error.main,
                      backgroundColor: alpha(theme.palette.error.main, 0.04),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.error.main, 0.15)}`,
                      '&::before': {
                        left: '100%'
                      }
                    },
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  Cancelar
                </Button>
              </motion.div>
              
              {/* Botón Principal - Guardar con Emphasis Premium */}
              <motion.div
                style={{ flex: 1.8 }}
                whileHover={{ 
                  scale: saving || Object.keys(errors).length > 0 || !formData.concept.trim() || !formData.amount ? 1 : 1.03,
                  y: saving || Object.keys(errors).length > 0 || !formData.concept.trim() || !formData.amount ? 0 : -3
                }}
                whileTap={{ 
                  scale: saving || Object.keys(errors).length > 0 || !formData.concept.trim() || !formData.amount ? 1 : 0.97 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handleSave}
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={saving || Object.keys(errors).length > 0 || !formData.concept.trim() || !formData.amount}
                  startIcon={saving ? 
                    <CircularProgress size={18} color="inherit" /> : 
                    <Save />
                  }
                  sx={{
                    borderRadius: 3,
                    height: 50,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    background: (saving || Object.keys(errors).length > 0 || !formData.concept.trim() || !formData.amount) ? 
                      `linear-gradient(135deg, ${theme.palette.grey[300]}, ${theme.palette.grey[400]})` :
                      `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: (saving || Object.keys(errors).length > 0 || !formData.concept.trim() || !formData.amount) ? 
                      'none' : 
                      `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      transition: 'all 0.6s ease',
                      animation: !saving && Object.keys(errors).length === 0 && formData.concept.trim() && formData.amount ? 'shimmer 3s infinite' : 'none'
                    },
                    '&:hover:not(:disabled)': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: 'translateY(-3px) scale(1.02)',
                      boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.6)}`,
                      '&::before': {
                        left: '100%'
                      }
                    },
                    '&:disabled': {
                      background: `linear-gradient(135deg, ${theme.palette.grey[300]}, ${theme.palette.grey[400]})`,
                      color: alpha(theme.palette.text.primary, 0.4),
                      boxShadow: 'none'
                    },
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </motion.div>
            </Box>

            {/* Indicador de Cambios Pendientes */}
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.warning.light}20, ${theme.palette.warning.main}15)`,
                      border: `1px solid ${theme.palette.warning.main}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Edit sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
                    </motion.div>
                    <Typography variant="body2" sx={{ color: theme.palette.warning.dark, fontWeight: 500 }}>
                      Tienes cambios sin guardar. No olvides guardar antes de cerrar.
                    </Typography>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="small"
                        startIcon={<RotateLeft />}
                        onClick={() => {
                          setFormData(originalData);
                          setHasChanges(false);
                        }}
                        sx={{
                          textTransform: 'none',
                          color: theme.palette.warning.dark,
                          fontWeight: 600,
                          minWidth: 'auto'
                        }}
                      >
                        Revertir
                      </Button>
                    </motion.div>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Indicador de validación */}
            <AnimatePresence>
              {Object.keys(errors).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Alert 
                    severity="warning" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: `${theme.palette.warning.main}08`,
                      borderColor: `${theme.palette.warning.main}40`
                    }}
                  >
                    <Typography variant="body2">
                      Por favor, corrige los errores antes de guardar: {Object.keys(errors).length} campo(s) con errores
                    </Typography>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogActions>
        </motion.div>
      
      {/* ✅ PAYMENT POPUP ELIMINADO COMPLETAMENTE */}
    </Dialog>
  );
};

export default CommitmentEditForm;
