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
  
  // Estado del formulario - ACTUALIZADO CON TODOS LOS CAMPOS
  const [formData, setFormData] = useState({
    concept: '',
    companyId: '',
    beneficiary: '',
    beneficiaryNit: '', // 🆔 NIT o identificación del beneficiario
    baseAmount: '', // 💰 Valor base (antes era 'amount')
    // 🎮 Campos específicos de Coljuegos
    derechosExplotacion: '', // Derechos de Explotación
    gastosAdministracion: '', // Gastos de Administración
    iva: '', // 📊 IVA
    retefuente: '', // 📉 Retención en la fuente
    ica: '', // 🏙️ ICA
    discount: '', // 🏷️ Descuento
    invoiceNumber: '', // 🧾 Número de Factura
    hasTaxes: false, // ✅ Mostrar/ocultar impuestos y descuentos
    totalAmount: '', // 💵 Total calculado
    paymentMethod: 'transfer',
    observations: '',
    deferredPayment: false,
    status: 'pending',
    dueDate: null,
    periodicity: 'monthly', // unique, monthly, bimonthly, quarterly, fourmonthly, biannual, annual
    recurringCount: 12, // número de cuotas para compromisos recurrentes
    // 📄 Campos para facturas - NO EDITABLES en modal de edición
    invoiceFiles: [],
    invoiceURLs: [],
    invoiceFileNames: [],
    // Mantener compatibilidad con campo legacy
    amount: '' // Se calculará automáticamente desde totalAmount
  });

  // Calcular progreso del formulario
  const calculateProgress = () => {
    const requiredFields = ['concept', 'companyId', 'totalAmount', 'dueDate']; // Cambiado 'amount' por 'totalAmount'
    const filledFields = requiredFields.filter(field => {
      if (field === 'dueDate') return formData[field] !== null;
      return formData[field] && formData[field].toString().trim() !== '';
    });
    return (filledFields.length / requiredFields.length) * 100;
  };

  // 💰 Funciones para formateo de moneda colombiana (CON DECIMALES)
  const formatNumberWithCommas = (value) => {
    if (!value && value !== 0) return '';
    
    // Convertir a string y limpiar, pero preservar decimales
    const strValue = value.toString();
    
    // Permitir solo números y un punto decimal
    const cleanValue = strValue.replace(/[^\d.]/g, '');
    
    // Asegurar que solo haya un punto decimal
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      // Si hay más de un punto, conservar solo el primero
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (!cleanValue) return '';
    
    // Si hay decimales
    if (parts.length === 2) {
      const integerPart = parts[0];
      const decimalPart = parts[1];
      
      // Formatear la parte entera con puntos como separadores de miles
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Retornar con la parte decimal (máximo 2 decimales)
      return formattedInteger + ',' + decimalPart.substring(0, 2);
    } else {
      // Solo parte entera
      return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };

  const parseFormattedNumber = (value) => {
    if (!value && value !== 0) return '';
    
    // Convertir puntos de miles a nada y comas decimales a puntos
    return value.toString()
      .replace(/\./g, '') // Remover separadores de miles
      .replace(/,/g, '.'); // Convertir coma decimal a punto
  };

  // 🎮 Detectar compromisos de Coljuegos
  const isColjuegosCommitment = () => {
    return formData.beneficiary && formData.beneficiary.toLowerCase().includes('coljuegos');
  };

  // 🧮 Calcular automáticamente el total
  const calculateTotal = () => {
    // 🎮 Caso especial: Coljuegos
    if (isColjuegosCommitment()) {
      const derechos = parseFloat(formData.derechosExplotacion) || 0;
      const gastos = parseFloat(formData.gastosAdministracion) || 0;
      return derechos + gastos; // Suma directa sin impuestos
    }
    
    // 📊 Caso general: Otras empresas
    const base = parseFloat(formData.baseAmount) || 0;
    if (!formData.hasTaxes) return base;
    
    const iva = parseFloat(formData.iva) || 0;
    const retefuente = parseFloat(formData.retefuente) || 0;
    const ica = parseFloat(formData.ica) || 0;
    const discount = parseFloat(formData.discount) || 0;
    
    // Total = Valor base + IVA - Retefuente - ICA - Descuento
    return base + iva - retefuente - ica - discount;
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
        beneficiary: commitment.beneficiary || '',
        beneficiaryNit: commitment.beneficiaryNit || '',
        baseAmount: commitment.baseAmount || commitment.amount || '', // Compatibilidad con campo legacy
        // 🎮 Campos específicos de Coljuegos
        derechosExplotacion: commitment.derechosExplotacion || '',
        gastosAdministracion: commitment.gastosAdministracion || '',
        iva: commitment.iva || '',
        retefuente: commitment.retefuente || '',
        ica: commitment.ica || '',
        discount: commitment.discount || '',
        invoiceNumber: commitment.invoiceNumber || '',
        hasTaxes: commitment.hasTaxes || false,
        totalAmount: commitment.totalAmount || commitment.amount || '',
        paymentMethod: commitment.paymentMethod || 'transfer',
        observations: commitment.observations || '',
        deferredPayment: commitment.deferredPayment || false,
        status: commitment.status || 'pending',
        dueDate: formatSafeDate(commitment.dueDate, 'yyyy-MM-dd'), // Convertir a string para input
        periodicity: commitment.periodicity || 'monthly',
        recurringCount: commitment.recurringCount || 12,
        // 📄 Campos para facturas - NO EDITABLES en modal de edición
        invoiceFiles: commitment.invoiceFiles || [],
        invoiceURLs: commitment.invoiceURLs || [],
        invoiceFileNames: commitment.invoiceFileNames || [],
        // Mantener compatibilidad con campo legacy
        amount: commitment.totalAmount || commitment.amount || ''
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

  // 🧮 Actualizar total automáticamente cuando cambien los valores
  useEffect(() => {
    const total = calculateTotal();
    setFormData(prev => ({
      ...prev,
      totalAmount: total.toString(),
      amount: total.toString() // Mantener compatibilidad con campo legacy
    }));
  }, [formData.baseAmount, formData.iva, formData.retefuente, formData.ica, formData.discount, formData.hasTaxes, formData.derechosExplotacion, formData.gastosAdministracion, formData.beneficiary]);

  // 🎮 Auto-desactivar impuestos para Coljuegos
  useEffect(() => {
    if (isColjuegosCommitment() && formData.hasTaxes) {
      setFormData(prev => ({
        ...prev,
        hasTaxes: false,
        iva: '',
        retefuente: '',
        ica: '',
        discount: ''
      }));
    }
  }, [formData.beneficiary]);

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

  // 💰 Funciones de manejo de campos numéricos con formato
  const handleBaseAmountChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    // Validar que sea un número válido (entero o decimal)
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('baseAmount', cleanValue);
    }
  };

  const handleDerechosChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('derechosExplotacion', cleanValue);
    }
  };

  const handleGastosChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('gastosAdministracion', cleanValue);
    }
  };

  const handleIvaChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('iva', cleanValue);
    }
  };

  const handleRetefuenteChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('retefuente', cleanValue);
    }
  };

  const handleIcaChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('ica', cleanValue);
    }
  };

  const handleDiscountChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = parseFormattedNumber(inputValue);
    
    if (cleanValue === '' || /^\d*\.?\d*$/.test(cleanValue)) {
      handleFormChange('discount', cleanValue);
    }
  };

  const handleSave = async () => {
    if (!commitment || !formData.concept.trim() || !formData.totalAmount) { // Cambiar validación a totalAmount
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
      
      // Datos del compromiso actualizado - INCLUIR TODOS LOS CAMPOS NUEVOS
      const updatedData = {
        concept: formData.concept.trim(),
        companyId: formData.companyId,
        beneficiary: formData.beneficiary.trim(),
        beneficiaryNit: formData.beneficiaryNit.trim(),
        baseAmount: parseFloat(formData.baseAmount) || 0,
        // 🎮 Campos específicos de Coljuegos
        derechosExplotacion: parseFloat(formData.derechosExplotacion) || 0,
        gastosAdministracion: parseFloat(formData.gastosAdministracion) || 0,
        iva: parseFloat(formData.iva) || 0,
        retefuente: parseFloat(formData.retefuente) || 0,
        ica: parseFloat(formData.ica) || 0,
        discount: parseFloat(formData.discount) || 0,
        invoiceNumber: formData.invoiceNumber.trim(),
        hasTaxes: formData.hasTaxes,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        paymentMethod: formData.paymentMethod,
        observations: formData.observations.trim(),
        deferredPayment: formData.deferredPayment,
        status: formData.status,
        dueDate: dueDateToSave, // Usar fecha convertida
        periodicity: formData.periodicity,
        recurringCount: formData.recurringCount,
        // Mantener compatibilidad con campo legacy
        amount: parseFloat(formData.totalAmount) || parseFloat(formData.amount) || 0,
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
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }
      }}
  >
    <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header sobrio con gradiente mantenido */}
          <Box sx={{
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Edit sx={{ fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Editar Compromiso
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {commitment?.concept || commitment?.description || 'Modifica los detalles del compromiso'}
              </Typography>
            </Box>
          </Box>

          <DialogContent sx={{ 
            p: 4,
            display: 'flex', 
            flexDirection: 'column'
          }}>
            {/* Información del Monto - Estilo sobrio */}
            {formData.amount && (
              <Box>
                <Paper
                    elevation={0}
                    sx={{
                      mb: 3,
                      p: 2.5,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderColor: theme.palette.info.main
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: theme.palette.info.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <AttachMoney sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                          Monto del Compromiso
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong style={{ color: theme.palette.info.main }}>{formatCurrency(formData.amount)}</strong>
                          {hasChanges && originalData.amount !== formData.amount && (
                            <span
                              style={{ 
                                marginLeft: 8, 
                                color: theme.palette.warning.main,
                                fontWeight: 600
                              }}
                            >
                              (Modificado desde {formatCurrency(originalData.amount)})
                            </span>
                          )}
                        </Typography>
                      </Box>
                      {hasChanges && (
                        <Chip
                          icon={<Edit />}
                          label="Modificado"
                          size="small"
                          sx={{
                            bgcolor: theme.palette.warning.main,
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Box>
              )}

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
                <Box>
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
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  />
                </Box>
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
              p: 3,
              gap: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              justifyContent: 'flex-end'
            }}
          >
            <Button
              onClick={handleClose}
              variant="outlined"
              startIcon={<Close />}
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saving || Object.keys(errors).length > 0}
              startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogActions>
  </div>
      
    </Dialog>
  );
};

export default CommitmentEditForm;
